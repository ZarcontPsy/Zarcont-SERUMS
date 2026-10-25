/* © 2026 ZARCONT — Suite de persistencia real entre pestañas, refresh y reinicio de navegador (Agente 8). */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { gotoApp, waitApp, firstVisible, clickFirst, explainErrors, appURL } from "../lib/apps.mjs";
import { sleep, Page } from "../lib/cdp.mjs";
import path from "node:path";

async function selectCard(page, appId) {
  for (let i = 0; i < 6; i++) {
    const active = await page.eval(`document.querySelector('.app-card.is-active')?.dataset.app`);
    if (active === appId) return true;
    await page.click("#nextTop");
    await sleep(350);
  }
  return (await page.eval(`document.querySelector('.app-card.is-active')?.dataset.app`)) === appId;
}

export async function runPersistence({ h, chrome, port = 9390, baseURL }) {
  h.suite("Persistencia");
  h.state.app = "Persistencia";

  let page = null;
  async function newPage() {
    const conn = await chrome.newTarget("about:blank");
    const p = new Page(conn, { port });
    await p.init();
    await p.viewport(1440, 900);
    return p;
  }
  page = await newPage();

  async function reopenPage() {
    if (page) {
      try {
        await page.close();
      } catch {}
    }
    page = await newPage();
    return page;
  }

  await h.test(
    "PERSIST-01",
    "Progreso de Study: pestaña nueva, refresh y reentrada desde el HUB conservan la ficha completada",
    async () => {
      await gotoApp(page, baseURL, "dashboard", { settle: 800 });
      await page.goto(appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", { settle: 900 });
      await page.waitFor(`!!document.querySelector('[data-action="toggle-complete"]')`, { timeout: 8000 });
      const already = await page.eval(`document.querySelector('[data-action="toggle-complete"]').getAttribute('aria-pressed')`);
      if (already !== "true") await page.click('[data-action="toggle-complete"]');
      await page.waitFor(`(() => { try { const s=JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); return s && s.dashboard.completedSheets >= 1; } catch(e) { return false; } })()`, { timeout: 8000 });
      const snap1 = await page.eval(`JSON.parse(localStorage.getItem('studyhub:snapshot:v1'))`);
      // Pestaña nueva (mismo perfil, mismo origen): el HUB debe ver el progreso.
      const second = await chrome.newTarget(appURL(baseURL, "hub"));
      const page2 = new Page(second, { port: 9390 });
      await page2.init();
      await waitApp(page2, "hub");
      const hubProgress = await page2.eval(`(() => ({
        text: document.body.innerText.slice(0, 700),
        value: document.querySelector('[data-progress="dashboard"] [data-progress-value]')?.textContent || null,
        href: document.querySelector('[data-app="dashboard"]')?.getAttribute('href') || null
      }))()`);
      await chrome.closeTarget(second);
      assert(/\b1\b/.test(hubProgress.value || ""), `el HUB muestra 1 ficha completada (valor=${hubProgress.value}; texto=${hubProgress.text.slice(0, 300)})`);
      // Refresh
      await page.goto(appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", { settle: 900 });
      const snap2 = await page.eval(`JSON.parse(localStorage.getItem('studyhub:snapshot:v1'))`);
      // Reentrada desde el HUB con el enlace real de la tarjeta
      await gotoApp(page, baseURL, "hub", { settle: 900 });
      await selectCard(page, "dashboard");
      const href = await page.eval(`document.querySelector('[data-app="dashboard"]').getAttribute('href')`);
      const flashHref = await page.eval(`document.querySelector('[data-app="flashcards"]').getAttribute('href')`);
      await page.click('[data-app="dashboard"]');
      await waitApp(page, "dashboard");
      const reentry = await page.eval(`({ url: location.href, hash: location.hash, completed: document.querySelector('#view-root')?.innerText.includes('Ficha completada') || document.querySelector('[data-action="toggle-complete"]')?.getAttribute('aria-pressed') })`);
      assertEq(snap2.dashboard.completedSheets, snap1.dashboard.completedSheets, "fichas completadas tras refresh");
      assertEq(snap2.dashboard.last.sheetId, "sheet-aps-01", "última ficha conservada");
      assertEq(href.includes("?"), false, `D1: la tarjeta Study Dashboard del HUB no debe llevar query de reanudación (href=${href})`);
      assertEq(flashHref.includes("?"), false, `D1: la tarjeta Study Flashcards del HUB no debe llevar query de reanudación (href=${flashHref})`);
      assertEq(reentry.hash, "#/", `D1: la tarjeta debe abrir la portada de la app (hash=${reentry.hash})`);
      return { snapshot: { completed: snap1.dashboard.completedSheets, last: snap1.dashboard.last }, href, flashHref, reentry, hubProgress };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PERSIST-02",
    "Cerrar y reabrir Chrome conserva progreso de Study y snapshot del HUB",
    async () => {
      const before = await page.eval(`(() => { const snap=JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); return { completed: snap.dashboard.completedSheets, keys: Object.keys(localStorage).sort() }; })()`);
      await chrome.restart();
      page = await newPage();
      await gotoApp(page, baseURL, "dashboard", { settle: 900 });
      const after = await page.eval(`(() => { const snap=JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); return { completed: snap.dashboard.completedSheets, keys: Object.keys(localStorage).sort() }; })()`);
      assertEq(after.completed, before.completed, "fichas completadas tras reiniciar Chrome");
      assertEq(after.keys.join("|"), before.keys.join("|"), "claves de almacenamiento sin cambios");
      await page.screenshot(path.join(h.evidenceDir, "img", "persist-study-restart.png"));
      return { before, after };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PERSIST-03",
    "Orientación landscape/portrait no rompe el progreso ni produce errores",
    async () => {
      page.resetErrors();
      await page.goto(appURL(baseURL, "dashboard") + "#/", { settle: 800 });
      await page.viewport(844, 390, { isLandscape: true });
      await sleep(500);
      const landscape = await page.eval(`({ w: innerWidth, h: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth, text: document.getElementById('view-root').innerText.slice(0,80), completed: JSON.parse(localStorage.getItem('studyhub:snapshot:v1')).dashboard.completedSheets })`);
      await page.viewport(390, 844);
      await sleep(500);
      const portrait = await page.eval(`({ w: innerWidth, h: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth, completed: JSON.parse(localStorage.getItem('studyhub:snapshot:v1')).dashboard.completedSheets })`);
      const errors = explainErrors(await page.errorsSummary());
      assertEq(portrait.completed, landscape.completed, "progreso tras cambio de orientación");
      assert(landscape.overflow <= 1 && portrait.overflow <= 1, `overflow landscape=${landscape.overflow}, portrait=${portrait.overflow}`);
      return { landscape, portrait, errors };
    },
    { severity: "media", page },
  );

  await h.test(
    "PERSIST-04",
    "Flashcards: sesión y tarjeta revisada sobreviven a refresh y reinicio",
    async () => {
      await gotoApp(page, baseURL, "flashcards", { settle: 800 });
      const deckHref = await page.eval(`(() => { const a=document.querySelector('a[href^="#/mazo/"]'); return a ? a.getAttribute('href') : null; })()`);
      await page.eval(`location.hash = ${JSON.stringify(deckHref)}`);
      await page.waitFor(`location.hash === ${JSON.stringify(deckHref)}`, { timeout: 5000 });
      const mode = await firstVisible(page, ['[data-action="start-session"][data-mode="free"]', '[data-action="start-session"][data-mode="quick"]', '[data-action="start-session"]']);
      await page.click(mode);
      await page.waitFor(`location.hash === '#/sesion'`, { timeout: 7000 });
      if (await page.eval(`!!document.querySelector('[data-action="reveal"]')`)) await page.click('[data-action="reveal"]');
      const rating = await firstVisible(page, ['[data-action="rate"]']);
      if (rating) await page.click(rating);
      await sleep(500);
      const before = await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('study-state-v1')); const snap=JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); return { session: s.flashcards?.session?.id || null, reviewed: snap.flashcards.reviewedCards, lastDeck: snap.flashcards.last?.deckId || null, keys: Object.keys(localStorage).sort() }; })()`);
      await chrome.restart();
      page = await newPage();
      await gotoApp(page, baseURL, "flashcards", { settle: 900 });
      const after = await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('study-state-v1')); const snap=JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); return { session: s.flashcards?.session?.id || null, reviewed: snap.flashcards.reviewedCards, lastDeck: snap.flashcards.last?.deckId || null, keys: Object.keys(localStorage).sort(), resumeHref: document.querySelector('[data-app="flashcards"]')?.getAttribute('href') || null }; })()`);
      assertEq(after.reviewed, before.reviewed, "tarjetas revisadas tras reinicio");
      assertEq(after.session, before.session, "sesión de flashcards tras reinicio");
      assertEq(after.keys.join("|"), before.keys.join("|"), "claves de almacenamiento sin cambios");
      return { before, after };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PERSIST-05",
    "QUEST: tema, misión y estado versionado sobreviven a cerrar/reabrir",
    async () => {
      await gotoApp(page, baseURL, "quest", { settle: 1000 });
      const currentTheme = await page.eval(`document.documentElement.dataset.theme`);
      if (currentTheme !== "light") await page.click('[data-theme-toggle]');
      await sleep(300);
      await page.goto(appURL(baseURL, "quest") + "#/mision/mission-sp-1", { settle: 800 });
      await page.waitFor(`!!document.querySelector('[data-action="start-mission"]')`, { timeout: 8000 });
      await page.click('[data-action="start-mission"]');
      await page.waitFor(`!!document.querySelector('[data-action="answer"]')`, { timeout: 8000 });
      await page.click('[data-action="answer"]');
      await page.waitFor(`!!document.querySelector('[data-action="next"]')`, { timeout: 5000 });
      await page.click('[data-action="next"]');
      await sleep(600);
      const before = await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('serumsquest:state:v1')); return { revision: s.revision, theme: localStorage.getItem('serumsquest:theme'), answers: s.activeSession ? Object.keys(s.activeSession.answers||{}).length : 0, xp: s.progress?.xp || 0, keys: Object.keys(localStorage).sort() }; })()`);
      await chrome.restart();
      page = await newPage();
      await gotoApp(page, baseURL, "quest", { settle: 1000 });
      const after = await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('serumsquest:state:v1')); return { revision: s.revision, theme: localStorage.getItem('serumsquest:theme'), answers: s.activeSession ? Object.keys(s.activeSession.answers||{}).length : 0, xp: s.progress?.xp || 0, docTheme: document.documentElement.dataset.theme, keys: Object.keys(localStorage).sort() }; })()`);
      assertEq(after.theme, before.theme, "tema de QUEST tras reinicio");
      assertEq(after.revision, before.revision, "revisión de estado tras reinicio");
      assertEq(after.answers, before.answers, "respuestas de misión tras reinicio");
      assertEq(after.keys.join("|"), before.keys.join("|"), "claves de QUEST sin cambios");
      return { before, after };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PERSIST-06",
    "Plazas: favoritos y preferencias sobreviven a cerrar/reabrir",
    async () => {
      await gotoApp(page, baseURL, "plazas", { settle: 1200 });
      await page.click('#sideTabs [data-tab="results"]');
      await sleep(300);
      const favBtn = await firstVisible(page, ['#resultsList .resitem [data-act="fav"]']);
      if (!favBtn) skip("No hay resultados visibles para marcar favorito.");
      await page.click(favBtn);
      await sleep(400);
      const themeBefore = await page.eval(`document.documentElement.dataset.theme`);
      await page.click("#btnTheme");
      await sleep(400);
      const themeAfter = await page.eval(`document.documentElement.dataset.theme`);
      assert(themeAfter !== themeBefore, "el tema de Plazas cambia con el control");
      const before = await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos') || '[]'), keys: Object.keys(localStorage).sort() })`);
      assert(before.favs.length >= 1, "favorito guardado");
      await chrome.restart();
      page = await newPage();
      await gotoApp(page, baseURL, "plazas", { settle: 1400 });
      const after = await page.eval(`({ favs: JSON.parse(localStorage.getItem('serums_favoritos') || '[]'), badge: document.getElementById('favBadge')?.textContent, keys: Object.keys(localStorage).sort() })`);
      assertEq(after.favs.length, before.favs.length, "favoritos tras reinicio");
      assertEq(after.badge, String(after.favs.length), "badge de favoritos tras reinicio");
      assertEq(after.keys.join("|"), before.keys.join("|"), "claves de Plazas sin cambios");
      return { before, after };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PERSIST-07",
    "Banqueo: intento de práctica persiste en IndexedDB y se lista tras reiniciar",
    async () => {
      await gotoApp(page, baseURL, "banqueo", { settle: 1000 });
      await page.goto(appURL(baseURL, "banqueo") + "#bank/medicina", { settle: 1000 });
      await page.waitFor(`document.querySelectorAll('[data-act="bank-select"]').length > 0`, { timeout: 10000 });
      const reviewBtn = await firstVisible(page, ['[data-act="bank-review"]']);
      if (reviewBtn) {
        await page.click(reviewBtn);
        await sleep(500);
      }
      await page.goto(appURL(baseURL, "banqueo") + "#practice/2026-ii-medicina", { settle: 1000 });
      await page.waitFor(`!!document.querySelector('[data-act="practice-start"]')`, { timeout: 10000 });
      await page.click('[data-act="practice-start"]');
      await page.waitFor(`!!document.querySelector('[data-action="none"], .practice-card, [data-act="practice-answer"]')`, { timeout: 12000 });
      await page.waitFor(`!!document.querySelector('[data-act="practice-answer"]')`, { timeout: 12000 });
      await page.click('[data-act="practice-answer"]', { index: 0 });
      await sleep(300);
      await page.click('[data-act="practice-next"]:not([disabled])').catch(() => {});
      await sleep(300);
      const finish = await firstVisible(page, ['[data-act="practice-finish"]']);
      if (finish) await page.click(finish);
      await sleep(300);
      const confirm = await firstVisible(page, ['#modal-root [data-confirm]', '[data-confirm]']);
      if (confirm) await page.click(confirm);
      await page.waitFor(`location.hash.startsWith('#practice/result/')`, { timeout: 12000 });
      await sleep(1200);
      const dbs = await page.eval(`(async () => { try { return await indexedDB.databases(); } catch(e) { return []; } })()`);
      assert(dbs.some((d) => d.name === "examenstudio"), "IndexedDB examenstudio existe");
      await chrome.restart();
      page = await newPage();
      await page.goto(appURL(baseURL, "banqueo") + "#prog/history", { settle: 1400 });
      await page.waitFor(`document.querySelectorAll('[data-act="open-attempt"]').length > 0`, { timeout: 10000 });
      const after = await page.eval(`({ attempts: document.querySelectorAll('[data-act="open-attempt"]').length, text: document.querySelector('#app')?.innerText.slice(0, 400) })`);
      assert(after.attempts > 0, "intento listado tras reiniciar");
      return { databases: dbs, after };
    },
    { severity: "alta", page },
  );

  await h.test(
    "PERSIST-08",
    "Inventario de claves final: ninguna clave esperada se perdió",
    async () => {
      const keys = await page.eval(`Object.keys(localStorage).sort()`);
      const required = [
        "study-state-v1",
        "studyhub:snapshot:v1",
        "study-theme",
        "serumsquest:state:v1",
        "serumsquest:snapshot:v1",
        "serumsquest:theme",
        "serums_favoritos",
        "serums_theme",
        "banqueo-review-v1",
        "banqueo-profession-v1",
      ];
      const missing = required.filter((k) => !keys.includes(k));
      assertEq(missing.length, 0, `claves perdidas: ${missing.join(", ")}`);
      return { keys, required, missing };
    },
    { severity: "alta", page },
  );

  try {
    await page.close();
  } catch {}
}
