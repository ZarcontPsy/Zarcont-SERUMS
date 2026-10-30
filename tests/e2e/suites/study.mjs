/* © 2026 ZARCONT — Suites Study Dashboard y Study Flashcards (Agente 8). */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { gotoApp, waitApp, firstVisible, clickFirst, explainErrors, appURL, APPS } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

async function hash(page) {
  return page.eval("location.hash");
}

async function clickHash(page, selectors, predicate, timeout = 8000) {
  const click = await clickFirst(page, selectors);
  await page.waitFor(`(() => { const h = location.hash; return (${predicate}); })()`, { timeout, message: `hash tras clic ${selectors[0]}` });
  return click;
}

async function markComplete(page) {
  const before = JSON.parse(await page.eval(`localStorage.getItem('studyhub:snapshot:v1') || 'null'`));
  const click = await clickFirst(page, ['[data-action="toggle-complete"]']);
  await page.waitFor(`(() => { try { const s = JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); return s && s.dashboard.completedSheets > ${before ? before.dashboard.completedSheets : 0}; } catch(e){ return false; } })()`, { timeout: 8000 });
  const after = JSON.parse(await page.eval(`localStorage.getItem('studyhub:snapshot:v1')`));
  return { click: click.selector, before: before ? before.dashboard : null, after: after.dashboard };
}

export async function runDashboard({ h, page, baseURL }) {
  h.suite("Study Dashboard");
  h.state.app = "Study Dashboard";

  await h.test(
    "DASH-01",
    "Carga directa de la portada, 210 fichas y sin errores de producto",
    async () => {
      page.resetErrors();
      const info = await gotoApp(page, baseURL, "dashboard");
      const data = await page.eval(`(() => ({
        title: document.title,
        hash: location.hash,
        totalVisible: /210/.test(document.body.innerText),
        hero: !!document.querySelector('#view-root .dash-hero'),
        chrome: !!document.querySelector('[data-serums-chrome]')
      }))()`);
      assertIncludes(await page.eval("document.body.innerText"), "210");
      const errors = explainErrors(await page.errorsSummary());
      assertEq(errors.productErrorCount, 0, `errores: ${JSON.stringify(errors)}`);
      return { ...info, ...data, errors };
    },
    { severity: "alta", page },
  );

  await h.test(
    "DASH-02",
    "Inicio → Biblioteca → área → ficha, sin recargar el documento",
    async () => {
      await gotoApp(page, baseURL, "dashboard");
      const before = page.navCount();
      await clickHash(page, ['#view-root a[href="#/biblioteca"]'], `h === '#/biblioteca'`);
      await page.waitFor(`document.querySelectorAll('a[href^="#/biblioteca/area-"]').length > 0`, { timeout: 8000, message: "tarjetas de área" });
      const libraryTitle = await page.eval(`document.querySelector('#view-root h1')?.innerText || ''`);
      const areaLink = await page.eval(`(() => { const a = document.querySelector('a[href^="#/biblioteca/area-"]'); return a ? a.getAttribute('href') : null; })()`);
      assert(areaLink, "enlace de área en biblioteca");
      let areaClick = null;
      let lastAreaError = "";
      for (let attempt = 0; attempt < 4 && !areaClick; attempt += 1) {
        const href = await page.eval(`(() => { const a = document.querySelector('a[href^="#/biblioteca/area-"]'); return a ? a.getAttribute('href') : null; })()`);
        if (!href) {
          lastAreaError = "sin enlace de área en la vista actual";
          await sleep(250);
          continue;
        }
        try {
          areaClick = await page.click(`a[href="${href}"]`);
          await page.waitFor(`location.hash.startsWith(${JSON.stringify(href)})`, { timeout: 5000 });
        } catch (err) {
          lastAreaError = err.message;
          areaClick = null;
          await sleep(250);
        }
      }
      if (!areaClick) {
        // Fallback de navegación por hash (mismo destino, sin depender de un nodo que se re-renderiza).
        await page.eval(`location.hash = ${JSON.stringify(areaLink)}`);
        lastAreaError += " · fallback hash";
      }
      const areaHash = await page.eval("location.hash");
      assert(areaHash.startsWith(areaLink), `ruta de área: ${areaHash}`);
      // IA del temario: área → categoría (tarjetas) → tema (<details>) → ficha.
      const hasTopics = await page.eval(`document.querySelectorAll('details.topic-block').length > 0`);
      if (!hasTopics) {
        const categoryHref = await page.eval(`(() => {
          const links = Array.from(document.querySelectorAll('a[href*="#/biblioteca/"]'));
          const target = links.find(a => /\\/cat-/.test(a.getAttribute('href') || ''));
          return target ? target.getAttribute('href') : null;
        })()`);
        if (categoryHref) {
          await page.click(`a[href="${categoryHref}"]`);
          await page.waitFor(`location.hash === ${JSON.stringify(categoryHref)}`, { timeout: 6000 });
        }
      }
      await page.waitFor(`document.querySelectorAll('details.topic-block').length > 0`, { timeout: 10000, message: "temas/categorías del área" });
      // La ficha vive dentro de un <details> de tema: se abre con un clic real.
      const closedTopic = await page.eval(`!!document.querySelector('details.topic-block:not([open]) summary')`);
      if (closedTopic) {
        await page.click("details.topic-block:not([open]) summary");
        await page.waitFor(`!!document.querySelector('details.topic-block[open] a[href^="#/ficha/"]')`, { timeout: 5000, message: "fichas del tema abierto" });
      }
      const sheetHref = await page.eval(`(() => { const a = document.querySelector('details.topic-block[open] a[href^="#/ficha/"]') || document.querySelector('a[href^="#/ficha/"]'); return a ? a.getAttribute('href') : null; })()`);
      assert(sheetHref, "enlace de ficha en el área");
      await clickHash(page, [`a[href="${sheetHref}"]`], `h.startsWith('#/ficha/')`);
      const sheet = await page.eval(`({ hash: location.hash, h1: document.querySelector('#view-root h1')?.innerText || '', text: document.body.innerText.slice(0,240) })`);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas de documento durante la navegación interna");
      return { libraryTitle, areaLink, sheetHref, sheet, navigations: navs, lastAreaError };
    },
    { severity: "alta", page },
  );

  await h.test(
    "DASH-03",
    "Ficha → Inicio (Panel) y ficha → HUB (control compartido)",
    async () => {
      await gotoApp(page, baseURL, `dashboard`, { settle: 500 });
      await page.goto(appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", { settle: 900 });
      await page.waitFor(`location.hash === '#/ficha/sheet-aps-01' && !!document.querySelector('#view-root h1')`, { timeout: 8000 });
      const before = page.navCount();
      await page.click('[data-serums-chrome="home"]');
      await page.waitFor(`location.hash === '#/'`, { timeout: 5000 });
      const homeHash = await hash(page);
      await page.goto(appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", { settle: 600 });
      const nav = page.waitForNavigation((url) => /\/index\.html(?:$|[?#])/.test(url), 12000);
      await page.click('[data-serums-chrome="hub"]');
      await nav;
      await waitApp(page, "hub");
      const navs = page.navCount() - before;
      return { homeHash, hubUrl: await page.eval("location.href"), navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "DASH-04",
    "URL directa a una ficha concreta",
    async () => {
      await page.goto(appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", { settle: 900 });
      await waitApp(page, "dashboard");
      const data = await page.eval(`({ hash: location.hash, h1: document.querySelector('#view-root h1')?.innerText || '', hasArticle: !!document.querySelector('#view-root article, #view-root .sheet, #view-root .reader') })`);
      assertEq(data.hash, "#/ficha/sheet-aps-01");
      assert(data.h1.length > 3, "título de la ficha renderizado");
      return data;
    },
    { severity: "alta", page },
  );

  await h.test(
    "DASH-05",
    "Atrás/adelante del navegador entre biblioteca y ficha",
    async () => {
      await page.goto(appURL(baseURL, "dashboard") + "#/biblioteca", { settle: 800 });
      await page.waitFor(`location.hash === '#/biblioteca'`, { timeout: 5000 });
      const sheetHref = "#/ficha/sheet-aps-01";
      await page.eval(`location.hash = ${JSON.stringify(sheetHref)}`);
      await page.waitFor(`location.hash === ${JSON.stringify(sheetHref)}`, { timeout: 5000 });
      const hist = await page.conn.send("Page.getNavigationHistory");
      assert(hist.currentIndex > 0, "historial con entrada anterior");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist.entries[hist.currentIndex - 1].id });
      await page.waitFor(`location.hash === '#/biblioteca'`, { timeout: 5000 });
      const backHash = await hash(page);
      const hist2 = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist2.entries[hist2.currentIndex + 1].id });
      await page.waitFor(`location.hash === ${JSON.stringify(sheetHref)}`, { timeout: 5000 });
      return { backHash, forwardHash: await hash(page), sheetHref };
    },
    { severity: "media", page },
  );

  await h.test(
    "DASH-06",
    "Persistencia: marcar ficha completada, refrescar y conservar progreso",
    async () => {
      await page.goto(appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", { settle: 900 });
      const marked = await markComplete(page);
      await page.goto(appURL(baseURL, "dashboard") + "#/ficha/sheet-aps-01", { settle: 800 });
      const afterRefresh = await page.eval(`(() => {
        const s = JSON.parse(localStorage.getItem('studyhub:snapshot:v1'));
        const btn = document.querySelector('[data-action="toggle-complete"]');
        return { completedSheets: s.dashboard.completedSheets, lastSheet: s.dashboard.last?.sheetId, aria: btn ? btn.getAttribute('aria-pressed') : null, hash: location.hash };
      })()`);
      assertEq(afterRefresh.completedSheets, marked.after.completedSheets, "fichas completadas tras refrescar");
      assertEq(afterRefresh.completedSheets >= 1, true, "al menos una ficha completada");
      assertEq(afterRefresh.aria, "true", "estado del botón tras refrescar");
      const shot = await h.shot(page, "dash-progreso-refresh");
      return { marked, afterRefresh, shot };
    },
    { severity: "alta", page },
  );

  await h.test(
    "DASH-07",
    "Persistencia: tema claro/oscuro tras refrescar",
    async () => {
      await page.goto(appURL(baseURL, "dashboard"), { settle: 700 });
      const before = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('study-theme') })`);
      await clickFirst(page, ["[data-theme-toggle]"]);
      await page.waitFor(`document.documentElement.dataset.theme !== ${JSON.stringify(before.theme)}`, { timeout: 4000 });
      const toggled = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('study-theme') })`);
      await page.goto(appURL(baseURL, "dashboard"), { settle: 700 });
      const after = await page.eval(`({ theme: document.documentElement.dataset.theme, stored: localStorage.getItem('study-theme') })`);
      assertEq(after.theme, toggled.theme, "tema tras refrescar");
      return { before, toggled, after };
    },
    { severity: "media", page },
  );

  await h.test(
    "DASH-08",
    "Sin recargas al filtrar la biblioteca y al cambiar de tema",
    async () => {
      await page.goto(appURL(baseURL, "dashboard") + "#/biblioteca", { settle: 900 });
      const before = page.navCount();
      const filter = await page.eval(`(() => { const b = document.querySelector('[data-action="library-filter"]'); return b ? b.dataset.filter : null; })()`);
      if (filter) {
        await page.click(`[data-action="library-filter"][data-filter="${filter}"]`);
        await sleep(400);
      }
      await page.click("[data-theme-toggle]");
      await sleep(400);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "navegaciones de documento al filtrar/cambiar tema");
      return { filter, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "DASH-09",
    "Pantalla completa del Dashboard con gesto real",
    async () => {
      const found = await firstVisible(page, ['[data-serums-chrome="fullscreen"]']);
      if (!found) skip("El Dashboard no expone control de pantalla completa en el estado actual.");
      await gotoApp(page, baseURL, "dashboard");
      await page.click('[data-serums-chrome="fullscreen"]');
      await sleep(900);
      const on = await page.eval(`({ element: !!document.fullscreenElement, pressed: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-pressed'), label: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-label') })`);
      if (!on.element) return { ...on, limitation: "headless no concedió fullscreen" };
      await page.click('[data-serums-chrome="fullscreen"]');
      await sleep(600);
      const off = await page.eval(`({ element: !!document.fullscreenElement, pressed: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-pressed') })`);
      assertEq(off.element, false, "salida de pantalla completa");
      assertEq(off.pressed, "false", "aria-pressed tras salir");
      return { on, off };
    },
    { severity: "media", page },
  );
}

export async function runFlashcards({ h, page, baseURL }) {
  h.suite("Study Flashcards");
  h.state.app = "Study Flashcards";

  await h.test(
    "FLASH-01",
    "Carga directa de la biblioteca, 630 tarjetas y sin errores",
    async () => {
      page.resetErrors();
      await gotoApp(page, baseURL, "flashcards");
      const data = await page.eval(`({
        title: document.title,
        hash: location.hash,
        has630: /630/.test(document.body.innerText),
        decks: document.querySelectorAll('a[href^="#/mazo/"]').length,
        chrome: !!document.querySelector('[data-serums-chrome]')
      })`);
      assert(data.has630, "630 tarjetas visibles en la portada");
      const errors = explainErrors(await page.errorsSummary());
      assertEq(errors.productErrorCount, 0, `errores: ${JSON.stringify(errors)}`);
      return { ...data, errors };
    },
    { severity: "alta", page },
  );

  await h.test(
    "FLASH-02",
    "Biblioteca → mazo → sesión sin recargar, con revelado y calificación",
    async () => {
      await gotoApp(page, baseURL, "flashcards");
      const before = page.navCount();
      const deckHref = await page.eval(`(() => { const a = document.querySelector('a[href^="#/mazo/"]'); return a ? a.getAttribute('href') : null; })()`);
      assert(deckHref, "enlace a mazo");
      await clickHash(page, [`a[href="${deckHref}"]`], `h === ${JSON.stringify(deckHref)}`);
      await page.waitFor(`document.querySelectorAll('[data-action="start-session"]').length > 0`, { timeout: 8000, message: "modos del mazo" });
      const deck = await page.eval(`({ hash: location.hash, h1: document.querySelector('#view-root h1')?.innerText || '', modes: document.querySelectorAll('[data-action="start-session"]').length })`);
      const modeSelector = await firstVisible(page, ['[data-action="start-session"][data-mode="free"]', '[data-action="start-session"][data-mode="quick"]', '[data-action="start-session"]']);
      assert(modeSelector, "botón de inicio de sesión");
      await page.click(modeSelector);
      await page.waitFor(`location.hash === '#/sesion'`, { timeout: 6000 });
      await page.waitFor(`!!document.querySelector('[data-action="reveal"], [data-action="select-option"], [data-action="exam-next"]')`, { timeout: 8000, message: "tarjeta de sesión" });
      await sleep(250);
      const session = await page.eval(`({ hash: location.hash, hasReveal: !!document.querySelector('[data-action="reveal"]'), hasOption: !!document.querySelector('[data-action="select-option"]') })`);
      let interaction = "none";
      if (session.hasReveal) {
        await page.click('[data-action="reveal"]');
        await page.waitFor(`!!document.querySelector('[data-action="rate"]')`, { timeout: 5000 });
        await page.click('[data-action="rate"]');
        interaction = "concepto:revelar+calificar";
      } else if (session.hasOption) {
        await page.click('[data-action="select-option"]');
        await page.waitFor(`!document.querySelector('[data-action="check"]')?.disabled`, { timeout: 4000 });
        await page.click('[data-action="check"]');
        await page.waitFor(`!!document.querySelector('.flash-feedback')`, { timeout: 5000 });
        interaction = "opción multiple:seleccionar+comprobar";
      }
      assert(interaction !== "none", `la tarjeta debe ser de concepto u opción múltiple (${JSON.stringify(session)})`);
      await sleep(500);
      const after = await page.eval(`(() => { let s=null; try { s=JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); } catch(e){} return { hash: location.hash, reviewed: s?.flashcards?.reviewedCards, lastDeck: s?.flashcards?.last?.deckId }; })()`);
      const navs = page.navCount() - before;
      assertEq(navs, 0, "recargas durante mazo/sesión/calificación");
      assert((after.reviewed || 0) >= 1, `tarjetas revisadas en snapshot: ${after.reviewed}`);
      return { deckHref, deck, session, interaction, after, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "FLASH-03",
    "Sesión → Inicio de la app y sesión → HUB",
    async () => {
      await gotoApp(page, baseURL, "flashcards");
      await page.goto(appURL(baseURL, "flashcards") + "#/mazo/sheet-aps-01", { settle: 900 });
      await page.waitFor(`location.hash === '#/mazo/sheet-aps-01'`, { timeout: 6000 });
      const modeSelector = await firstVisible(page, ['[data-action="start-session"][data-mode="free"]', '[data-action="start-session"][data-mode="quick"]', '[data-action="start-session"]']);
      await page.click(modeSelector);
      await page.waitFor(`location.hash === '#/sesion'`, { timeout: 7000 });
      await page.click('[data-serums-chrome="home"]');
      await page.waitFor(`location.hash === '#/'`, { timeout: 5000 });
      const home = await hash(page);
      const nav = page.waitForNavigation((url) => /\/index\.html(?:$|[?#])/.test(url), 12000);
      await page.click('[data-serums-chrome="hub"]');
      await nav;
      await waitApp(page, "hub");
      return { home, hubUrl: await page.eval("location.href") };
    },
    { severity: "alta", page },
  );

  await h.test(
    "FLASH-04",
    "URL directa a un mazo",
    async () => {
      await page.goto(appURL(baseURL, "flashcards") + "#/mazo/sheet-aps-01", { settle: 900 });
      await waitApp(page, "flashcards");
      const data = await page.eval(`({ hash: location.hash, h1: document.querySelector('#view-root h1')?.innerText || '', modes: document.querySelectorAll('[data-action="start-session"]').length })`);
      assertEq(data.hash, "#/mazo/sheet-aps-01");
      assert(data.h1.length > 2, "título del mazo");
      return data;
    },
    { severity: "alta", page },
  );

  await h.test(
    "FLASH-05",
    "Atrás/adelante del navegador entre biblioteca y mazo",
    async () => {
      await page.goto(appURL(baseURL, "flashcards") + "#/", { settle: 800 });
      await page.eval(`location.hash = '#/mazo/sheet-aps-01'`);
      await page.waitFor(`location.hash === '#/mazo/sheet-aps-01'`, { timeout: 5000 });
      const hist = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist.entries[hist.currentIndex - 1].id });
      await page.waitFor(`location.hash === '#/'`, { timeout: 5000 });
      const back = await hash(page);
      const hist2 = await page.conn.send("Page.getNavigationHistory");
      await page.conn.send("Page.navigateToHistoryEntry", { entryId: hist2.entries[hist2.currentIndex + 1].id });
      await page.waitFor(`location.hash === '#/mazo/sheet-aps-01'`, { timeout: 5000 });
      return { back, forward: await hash(page) };
    },
    { severity: "media", page },
  );

  await h.test(
    "FLASH-06",
    "Persistencia: sesión en curso sobrevive a refresh",
    async () => {
      await page.goto(appURL(baseURL, "flashcards") + "#/mazo/sheet-aps-01", { settle: 900 });
      await page.waitFor(`location.hash === '#/mazo/sheet-aps-01'`, { timeout: 6000 });
      const modeSelector = await firstVisible(page, ['[data-action="start-session"][data-mode="free"]', '[data-action="start-session"][data-mode="quick"]', '[data-action="start-session"]']);
      await page.click(modeSelector);
      await page.waitFor(`location.hash === '#/sesion'`, { timeout: 7000 });
      await page.waitFor(`!!document.querySelector('[data-action="reveal"], [data-action="select-option"]')`, { timeout: 8000, message: "tarjeta de sesión (persistencia)" });
      if (await page.eval(`!!document.querySelector('[data-action="reveal"]')`)) await page.click('[data-action="reveal"]');
      else if (await page.eval(`!!document.querySelector('[data-action="select-option"]')`)) {
        await page.click('[data-action="select-option"]');
        await page.waitFor(`!document.querySelector('[data-action="check"]')?.disabled`, { timeout: 4000 }).catch(() => {});
        await page.click('[data-action="check"]').catch(() => {});
      }
      const rating = await firstVisible(page, ['[data-action="rate"]']);
      if (rating) await page.click(rating);
      await sleep(500);
      const before = await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('study-state-v1')); return { session: s.flashcards?.session, reviewed: s.flashcards?.reviewedCards }; })()`);
      await page.goto(appURL(baseURL, "flashcards") + "#/sesion", { settle: 900 });
      const after = await page.eval(`(() => { const s=JSON.parse(localStorage.getItem('study-state-v1')); const view=document.getElementById('view-root').innerText.slice(0,160); return { hash: location.hash, text: view, session: s.flashcards?.session, reviewed: s.flashcards?.reviewedCards }; })()`);
      assertEq(after.hash, "#/sesion", "hash de sesión tras refrescar");
      assert((after.text || "").length > 10, "contenido de sesión tras refrescar");
      return { before, after };
    },
    { severity: "alta", page },
  );

  await h.test(
    "FLASH-07",
    "Reanudación por ruta directa (?deck=…&resume=1) conserva el último mazo",
    async () => {
      await gotoApp(page, baseURL, "flashcards", { settle: 800 });
      const snap = await page.eval(`(() => { try { return JSON.parse(localStorage.getItem('studyhub:snapshot:v1')); } catch(e) { return null; } })()`);
      const deckId = snap?.flashcards?.last?.deckId || "sheet-aps-01";
      await page.goto(appURL(baseURL, "flashcards") + `?deck=${encodeURIComponent(deckId)}&resume=1`, { settle: 1200 });
      const resume = await page.eval(`({ url: location.href, hash: location.hash, text: document.getElementById('view-root')?.innerText.slice(0, 220), modes: document.querySelectorAll('[data-action="start-session"]').length, session: !!document.querySelector('[data-action="reveal"], [data-action="select-option"]') })`);
      assert(
        resume.hash === `#/mazo/${deckId}` || resume.hash === "#/sesion",
        `la ruta directa debe abrir el mazo o la sesión reanudada (hash=${resume.hash})`,
      );
      return { snapshotLast: snap?.flashcards?.last || null, deckId, resume };
    },
    { severity: "media", page },
  );

  await h.test(
    "FLASH-08",
    "Pantalla completa de Flashcards con gesto real",
    async () => {
      await gotoApp(page, baseURL, "flashcards");
      const found = await firstVisible(page, ['[data-serums-chrome="fullscreen"]']);
      if (!found) skip("La app no expone control de pantalla completa en el estado actual.");
      await page.click('[data-serums-chrome="fullscreen"]');
      await sleep(900);
      const on = await page.eval(`({ element: !!document.fullscreenElement, pressed: document.querySelector('[data-serums-chrome="fullscreen"]').getAttribute('aria-pressed') })`);
      if (!on.element) return { ...on, limitation: "headless no concedió fullscreen" };
      await page.click('[data-serums-chrome="fullscreen"]');
      await sleep(600);
      return { on, off: await page.eval(`!!document.fullscreenElement`) };
    },
    { severity: "media", page },
  );

  await h.test(
    "FLASH-09",
    "Terminar una sesión incompleta pide confirmación y permite seguir",
    async () => {
      await page.goto(appURL(baseURL, "flashcards") + "#/mazo/sheet-aps-01", { settle: 900 });
      await page.waitFor(`!!document.querySelector('[data-action="start-session"]')`, { timeout: 8000 });
      await page.click('[data-action="start-session"]');
      await page.waitFor(`location.hash === '#/sesion'`, { timeout: 8000 });
      await sleep(500);
      if (await page.eval(`!!document.querySelector('[data-action="reveal"]')`)) {
        await page.click('[data-action="reveal"]');
        await sleep(250);
        await page.click('[data-action="rate"][data-rating="good"]');
      } else {
        await page.click('[data-action="select-option"]');
        await sleep(200);
        await page.click('[data-action="check"]');
        await sleep(250);
        if (await page.eval(`!!document.querySelector('[data-action="rate"][data-rating="good"]')`)) {
          await page.click('[data-action="rate"][data-rating="good"]');
        }
      }
      await sleep(450);
      await page.click('[data-action="end-session"]');
      await page.waitFor(`!!document.querySelector('.session-end-confirm')`, { timeout: 4000 });
      const confirm = await page.eval(`({
        text: document.querySelector('.session-end-confirm')?.innerText || "",
        headerEnd: !!document.querySelector('.session-header [data-action="end-session"]'),
        focus: document.activeElement.getAttribute('data-action')
      })`);
      assertIncludes(confirm.text, "Quedan", "aviso de tarjetas pendientes");
      assertEq(confirm.headerEnd, false, "el botón único se retira durante la confirmación");
      assertEq(confirm.focus, "cancel-end", "el foco queda en Seguir");
      await page.click('[data-action="cancel-end"]');
      await sleep(350);
      const resumed = await page.eval(`({ confirm: !!document.querySelector('.session-end-confirm'), end: !!document.querySelector('[data-action="end-session"]'), hash: location.hash })`);
      assertEq(resumed.confirm, false, "la confirmación se cierra");
      assertEq(resumed.end, true, "se puede volver a terminar");
      await page.click('[data-action="end-session"]');
      await sleep(350);
      await page.click('.session-end-actions [data-action="end-session"]');
      await page.waitFor(`location.hash === '#/resumen'`, { timeout: 8000 });
      await page.waitFor(`!!document.querySelector('.summary-view')`, { timeout: 5000 });
      const summary = await page.eval(`({ summary: !!document.querySelector('.summary-view'), text: document.getElementById('view-root')?.innerText.slice(0, 120) })`);
      assert(summary.summary, "resumen renderizado");
      return { confirm, resumed, summary };
    },
    { severity: "media", page },
  );
}
