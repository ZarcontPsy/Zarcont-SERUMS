/* © 2026 ZARCONT — Suite BANQUEO · Examen Studio (Agente 8). */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { gotoApp, waitApp, firstVisible, clickFirst, explainErrors, appURL } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

async function startPractice(page, baseURL) {
  await page.goto(appURL(baseURL, "banqueo") + "#practice/2026-ii-medicina", { settle: 1000 });
  await page.waitFor(`!!document.querySelector('[data-act="practice-start"]')`, { timeout: 10000 });
  const setup = await page.eval(`({ hash: location.hash, count: document.querySelector('[data-practice-count]')?.value, exam: document.querySelector('[data-practice-exam]')?.value, disabled: document.querySelector('[data-act="practice-start"]')?.disabled })`);
  await page.click('[data-act="practice-start"]');
  await page.waitFor(`!!document.querySelector('.practice-card') && !!document.querySelector('[data-act="practice-answer"]')`, { timeout: 12000 });
  return { setup, session: await page.eval(`({ hash: location.hash, question: document.querySelector('.practice-question')?.innerText?.slice(0,100), options: document.querySelectorAll('[data-act="practice-answer"]').length, timer: !!document.getElementById('practice-timer') })`) };
}

async function finishPractice(page) {
  const finish = await firstVisible(page, ['[data-act="practice-finish"]']);
  if (finish) await page.click(finish);
  await sleep(300);
  const confirm = await firstVisible(page, ['#modal-root [data-confirm]', '[data-confirm]']);
  if (confirm) await page.click(confirm);
  await page.waitFor(`location.hash.startsWith('#practice/result/')`, { timeout: 12000 });
  await sleep(900);
  return page.eval(`({ hash: location.hash, text: document.querySelector('#app')?.innerText.slice(0, 320) })`);
}

export async function runBanqueo({ h, page, baseURL }) {
  h.suite("Banqueo · Examen Studio");
  h.state.app = "Banqueo";

  await h.test(
    "BANQ-01",
    "Carga del hub: 51 exámenes, 5.100 preguntas, 17 profesiones y 100% de cobertura declarada",
    async () => {
      page.resetErrors();
      await gotoApp(page, baseURL, "banqueo", { settle: 900 });
      await page.waitFor(`document.getElementById('boot')?.classList.contains('is-hidden') || getComputedStyle(document.getElementById('boot')).display === 'none'`, { timeout: 10000 }).catch(() => {});
      const data = await page.eval(`(() => ({
        title: document.title,
        body: document.body.innerText.slice(0, 1200),
        totals: window.BANCO_OFICIAL.totals,
        bootVisible: (() => { const b=document.getElementById('boot'); return b ? getComputedStyle(b).display !== 'none' : false; })(),
        chrome: !!document.querySelector('[data-serums-chrome]')
      }))()`);
      assertIncludes(data.body, "51");
      assertIncludes(data.body, "5,100");
      assertIncludes(data.body, "17");
      assertEq(data.totals.exams, 51, "exámenes cargados");
      assertEq(data.totals.questions, 5100, "preguntas cargadas");
      const errors = explainErrors(await page.errorsSummary());
      return { ...data, body: data.body.slice(0, 500), errors };
    },
    { severity: "alta", page },
  );

  await h.test(
    "BANQ-02",
    "Hub de Banqueo → banco → pregunta, sin recargar el documento",
    async () => {
      await gotoApp(page, baseURL, "banqueo", { settle: 900 });
      const before = page.navCount();
      await page.click('a[href="#bank/medicina"]');
      await page.waitFor(`location.hash === '#bank/medicina' && document.querySelectorAll('[data-act="bank-select"]').length > 0`, { timeout: 10000 });
      const bank = await page.eval(`({ hash: location.hash, count: document.querySelectorAll('[data-act="bank-select"]').length, h1: document.querySelector('#app h1')?.innerText })`);
      await page.click('[data-act="bank-select"]', { index: 1 });
      await sleep(400);
      const detail = await page.eval(`({ selected: document.querySelector('[data-act="bank-select"].is-active')?.dataset.id, detail: document.querySelector('.qdetail-panel')?.innerText.slice(0, 220), keyVisible: /Clave [A-D]/.test(document.querySelector('.qdetail-panel')?.innerText || '') })`);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas al cambiar de pregunta");
      assert(bank.count > 0, "preguntas listadas");
      assert(detail.keyVisible, "clave visible en el detalle");
      return { bank, detail, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "BANQ-03",
    "Banco → inicio de Banqueo y URL directa al banco",
    async () => {
      await page.goto(appURL(baseURL, "banqueo") + "#bank/medicina", { settle: 900 });
      await page.waitFor(`location.hash === '#bank/medicina'`, { timeout: 8000 });
      await page.click('a.brand[href="#hub"]');
      await page.waitFor(`location.hash === '#hub'`, { timeout: 6000 });
      const home = await page.eval("location.hash");
      await page.goto(appURL(baseURL, "banqueo") + "#bank/medicina", { settle: 900 });
      const direct = await page.eval(`({ hash: location.hash, h1: document.querySelector('#app h1')?.innerText, rows: document.querySelectorAll('[data-act="bank-select"]').length })`);
      assertEq(direct.hash, "#bank/medicina");
      assert(direct.rows > 0, "banco directo renderizado");
      return { home, direct };
    },
    { severity: "alta", page },
  );

  await h.test(
    "BANQ-04",
    "Banqueo → HUB (control compartido o enlace explícito)",
    async () => {
      await gotoApp(page, baseURL, "banqueo", { settle: 900 });
      const candidates = ['[data-serums-chrome="hub"]', 'a[aria-label="Volver al HUB"]', 'a[href="../index.html"]', 'a[href="../../index.html"]'];
      const found = await firstVisible(page, candidates);
      if (!found) {
        throw new Error(
          "No existe control «Volver al HUB» ni enlace a ../index.html en Banqueo. El script serums-chrome.js está cargado pero app.js no monta el grupo (ver AUDIT/agent-8-qa.md).",
        );
      }
      const nav = page.waitForNavigation((url) => /\/index\.html(?:$|[?#])/.test(url), 12000);
      await page.click(found);
      await nav;
      await waitApp(page, "hub");
      return { selector: found, url: await page.eval("location.href") };
    },
    { severity: "alta", page },
  );

  await h.test(
    "BANQ-05",
    "Atrás/adelante del navegador entre banco y hub de Banqueo",
    async () => {
      await page.goto(appURL(baseURL, "banqueo") + "#hub", { settle: 800 });
      await page.eval(`location.hash = '#bank/medicina'`);
      await page.waitFor(`location.hash === '#bank/medicina'`, { timeout: 6000 });
      const hist = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist.entries[hist.currentIndex - 1].id });
      await page.waitFor(`location.hash === '#hub'`, { timeout: 6000 });
      const back = await page.eval("location.hash");
      const hist2 = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist2.entries[hist2.currentIndex + 1].id });
      await page.waitFor(`location.hash === '#bank/medicina'`, { timeout: 6000 });
      return { back, forward: await page.eval("location.hash") };
    },
    { severity: "media", page },
  );

  await h.test(
    "BANQ-06",
    "Práctica (Examen Studio): configuración → sesión → responder → resultado",
    async () => {
      await gotoApp(page, baseURL, "banqueo", { settle: 900 });
      const started = await startPractice(page, baseURL);
      const before = page.navCount();
      await page.click('[data-act="practice-answer"]', { index: 0 });
      await sleep(300);
      const answered = await page.eval(`({ selected: document.querySelectorAll('[data-act="practice-answer"].is-selected').length, feedback: document.querySelector('.practice-card .evidence')?.innerText.slice(0,120) })`);
      const next = await firstVisible(page, ['[data-act="practice-next"]:not([disabled])']);
      if (next) await page.click(next);
      await sleep(400);
      const second = await page.eval(`({ index: document.querySelector('.practice-kicker')?.innerText, options: document.querySelectorAll('[data-act="practice-answer"]').length })`);
      const result = await finishPractice(page);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas durante la práctica");
      assert((result.text || "").length > 30, "resultado renderizado");
      return { started, answered, second, result, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "BANQ-07",
    "Persistencia del intento: visible en Progreso tras refresh",
    async () => {
      await page.goto(appURL(baseURL, "banqueo") + "#prog/history", { settle: 1200 });
      await page.waitFor(`location.hash === '#prog/history'`, { timeout: 8000 });
      const before = await page.eval(`({ text: document.querySelector('#app')?.innerText.slice(0, 900), attempts: document.querySelectorAll('[data-act="open-attempt"]').length })`);
      await page.goto(appURL(baseURL, "banqueo") + "#prog/history", { settle: 1200 });
      const after = await page.eval(`({ text: document.querySelector('#app')?.innerText.slice(0, 900), attempts: document.querySelectorAll('[data-act="open-attempt"]').length })`);
      assert(after.attempts > 0, `intentos listados tras refresh (${after.attempts})`);
      const shot = await h.shot(page, "banq-progreso-refresh");
      return { before: { attempts: before.attempts, text: before.text.slice(0, 300) }, after: { attempts: after.attempts, text: after.text.slice(0, 300) }, shot };
    },
    { severity: "alta", page },
  );

  await h.test(
    "BANQ-08",
    "Persistencia de revisión de pregunta (banqueo-review-v1) tras refresh",
    async () => {
      await page.goto(appURL(baseURL, "banqueo") + "#bank/medicina", { settle: 1000 });
      await page.waitFor(`document.querySelectorAll('[data-act="bank-select"]').length > 0`, { timeout: 8000 });
      const reviewBtn = await firstVisible(page, ['[data-act="bank-review"]']);
      if (!reviewBtn) skip("No hay botón de revisión en el detalle del banco.");
      const before = await page.eval(`localStorage.getItem('banqueo-review-v1')`);
      await page.click(reviewBtn);
      await sleep(500);
      const after = await page.eval(`({ stored: localStorage.getItem('banqueo-review-v1'), pressed: document.querySelector('[data-act="bank-review"]')?.getAttribute('aria-pressed') })`);
      await page.goto(appURL(baseURL, "banqueo") + "#bank/medicina", { settle: 1000 });
      await sleep(400);
      const refreshed = await page.eval(`({ stored: localStorage.getItem('banqueo-review-v1'), pressed: document.querySelector('[data-act="bank-review"]')?.getAttribute('aria-pressed') })`);
      assert(after.stored !== before, "la marca de revisión se guardó");
      assertEq(refreshed.stored, after.stored, "revisión tras refresh");
      return { before, after, refreshed };
    },
    { severity: "media", page },
  );

  await h.test(
    "BANQ-09",
    "Sin recargas al cambiar filtro de preguntas y búsqueda",
    async () => {
      await page.goto(appURL(baseURL, "banqueo") + "#bank/medicina", { settle: 1000 });
      const before = page.navCount();
      await page.click('[data-act="bank-filter"][data-filter="valid"]');
      await sleep(400);
      const filter = await page.eval(`document.querySelector('[data-act="bank-filter"].is-active')?.innerText`);
      await page.click('[data-bank-search]');
      await page.conn.send("Input.insertText", { text: "salud" });
      await sleep(800);
      const rows = await page.eval(`document.querySelectorAll('[data-act="bank-select"]').length`);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas al filtrar/buscar");
      return { filter, rows, navigations: navs };
    },
    { severity: "media", page },
  );

  await h.test(
    "BANQ-10",
    "Pantalla completa de Banqueo con gesto real",
    async () => {
      await gotoApp(page, baseURL, "banqueo", { settle: 900 });
      const found = await firstVisible(page, ['[data-serums-chrome="fullscreen"]']);
      if (!found) throw new Error("Banqueo no expone control de pantalla completa (serums-chrome.js cargado sin mount).");
      await page.click(found);
      await sleep(900);
      const on = await page.eval(`({ element: !!document.fullscreenElement, pressed: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-pressed') })`);
      if (!on.element) return { ...on, limitation: "headless no concedió fullscreen" };
      await page.click(found);
      await sleep(600);
      return { on, off: await page.eval(`!!document.fullscreenElement`) };
    },
    { severity: "media", page },
  );
}
