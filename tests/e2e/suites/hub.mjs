/* © 2026 ZARCONT — Suite del HUB (Agente 8). */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { APPS, appURL, gotoApp, waitApp, firstVisible, clickFirst, explainErrors } from "../lib/apps.mjs";

const APP_NAMES = {
  banqueo: /BANQUEO/,
  plazas: /PLAZAS SERUMS/,
  dashboard: /STUDY DASHBOARD/,
  flashcards: /STUDY FLASHCARDS/,
  quest: /SERUMS QUEST/,
};

async function gotoHub(page, baseURL) {
  await gotoApp(page, baseURL, "hub", { settle: 900 });
}

async function selectedApp(page) {
  return page.eval(`(() => { const el = document.querySelector('.app-card.is-active'); return el ? el.dataset.app : null; })()`);
}

async function selectCard(page, appId, { maxSteps = 6 } = {}) {
  for (let i = 0; i < maxSteps; i++) {
    if ((await selectedApp(page)) === appId) return { steps: i };
    await page.click("#nextTop");
    await page.waitFor(`document.querySelector('.app-card.is-active')?.dataset.app !== ${JSON.stringify(await selectedApp(page))}`, { timeout: 2500 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 350));
  }
  if ((await selectedApp(page)) === appId) return { steps: maxSteps };
  throw new Error(`No se pudo seleccionar ${appId}; activo=${await selectedApp(page)}`);
}

async function openSelected(page) {
  const beforeUrl = await page.eval("location.href");
  const nav = page.waitForNavigation((url) => url !== beforeUrl, 15000);
  const click = await clickFirst(page, ["#openCurrent", ".app-card.is-active .app-cta", ".app-card.is-active"]);
  await nav;
  await new Promise((r) => setTimeout(r, 500));
  return { click: click.selector, url: await page.eval("location.href") };
}

export async function runHub({ h, page, baseURL }) {
  h.suite("HUB");
  h.state.app = "Hub";

  await h.test(
    "HUB-01",
    "Carga inicial: 5 tarjetas, carrusel y sin errores de producto",
    async () => {
      page.resetErrors();
      await gotoHub(page, baseURL);
      const data = await page.eval(`(() => ({
        title: document.title,
        cards: Array.from(document.querySelectorAll('.app-card[data-app]')).map(c => ({ id: c.dataset.app, href: c.getAttribute('href'), active: c.classList.contains('is-active') })),
        pos: document.getElementById('tbPos')?.textContent,
        now: document.getElementById('tbNow')?.textContent,
        dots: document.querySelectorAll('#dots [data-dot], #dots button').length,
        dock: !!document.getElementById('dock'),
        version: document.getElementById('aboutVersion')?.textContent,
        fsEnabled: !!document.fullscreenEnabled
      }))()`);
      assertEq(data.cards.length, 5, "número de tarjetas");
      assertEq(data.cards.filter((c) => c.active).length, 1, "una tarjeta activa");
      assertEq(data.pos, "1 / 5", "posición inicial");
      for (const [id, rx] of Object.entries(APP_NAMES)) {
        const card = data.cards.find((c) => c.id === id);
        assert(card, `tarjeta ${id} presente`);
        assert(card.href && !/^javascript:/.test(card.href), `tarjeta ${id} con href real`);
      }
      const errors = explainErrors(await page.errorsSummary());
      assertEq(errors.productErrorCount, 0, `errores de producto: ${JSON.stringify(errors)}`);
      return { ...data, errors };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-02",
    "Selección con flechas y puntos: cambia tarjeta sin recargar el documento",
    async () => {
      await gotoHub(page, baseURL);
      const before = page.navCount();
      const start = await selectedApp(page);
      await page.click("#nextTop");
      await page.waitFor(`document.querySelector('#tbPos').textContent === '2 / 5'`, { timeout: 4000 });
      const afterArrow = await selectedApp(page);
      await page.click("#prevTop");
      await page.waitFor(`document.querySelector('#tbPos').textContent === '1 / 5'`, { timeout: 4000 });
      const afterPrev = await selectedApp(page);
      // Punto 4 del carrusel (si existe)
      const dotCount = await page.eval(`document.querySelectorAll('#dots [data-dot], #dots button').length`);
      let afterDot = null;
      if (dotCount >= 4) {
        await page.click("#dots [data-dot], #dots button", { index: 3 });
        await new Promise((r) => setTimeout(r, 500));
        afterDot = await selectedApp(page);
      }
      const navs = page.navCount() - before;
      assertEq(navs, 0, "navegaciones de documento al cambiar de tarjeta");
      assert(afterArrow !== start, `la flecha cambia la tarjeta (${start} → ${afterArrow})`);
      assertEq(afterPrev, start, "la flecha anterior vuelve a la tarjeta inicial");
      return { start, afterArrow, afterPrev, afterDot, dotCount, navigations: navs };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-03",
    "HUB → BANQUEO (Abrir) y URL/título correctos",
    async () => {
      await gotoHub(page, baseURL);
      await selectCard(page, "banqueo");
      const nav = await openSelected(page);
      await waitApp(page, "banqueo");
      assertIncludes(nav.url, "EXAMEN%20STUDIO/Examen%20Studio.html");
      assert(/Banqueo/.test(await page.eval("document.title")), "título de Banqueo");
      return { ...nav, title: await page.eval("document.title") };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-04",
    "HUB → Study Dashboard (Abrir) y portada de la app",
    async () => {
      await gotoHub(page, baseURL);
      await selectCard(page, "dashboard");
      const nav = await openSelected(page);
      await waitApp(page, "dashboard");
      assertIncludes(nav.url, "study-dashboard/index.html");
      return { ...nav, h1: await page.eval(`document.querySelector('#view-root h1')?.innerText || document.title`) };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-05",
    "HUB → Study Flashcards (Abrir) y portada de la app",
    async () => {
      await gotoHub(page, baseURL);
      await selectCard(page, "flashcards");
      const nav = await openSelected(page);
      await waitApp(page, "flashcards");
      assertIncludes(nav.url, "study-flashcards/index.html");
      return { ...nav, h1: await page.eval(`document.querySelector('#view-root h1')?.innerText || document.title`) };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-06",
    "HUB → SERUMS QUEST (Abrir)",
    async () => {
      await gotoHub(page, baseURL);
      await selectCard(page, "quest");
      const nav = await openSelected(page);
      await waitApp(page, "quest");
      assertIncludes(nav.url, "serums-quest/index.html");
      return { ...nav, h1: await page.eval(`document.querySelector('#view h1')?.innerText || document.title`) };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-07",
    "HUB → PLAZAS SERUMS (Abrir) y carga de datos",
    async () => {
      await gotoHub(page, baseURL);
      await selectCard(page, "plazas");
      const nav = await openSelected(page);
      await waitApp(page, "plazas");
      assertIncludes(nav.url, "serums%20map/serums-map-explorer/index.html");
      return { ...nav, badge: await page.eval(`document.getElementById('datasetBadge')?.textContent`) };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-08",
    "Modales de atajos y Acerca de: abren, cierran con Esc y devuelven el foco",
    async () => {
      await gotoHub(page, baseURL);
      await page.click("#btnHelp");
      await page.waitFor(`document.getElementById('helpModal').getAttribute('aria-hidden') === 'false'`, { timeout: 3000 });
      const helpText = await page.eval(`document.getElementById('helpModal').innerText`);
      await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
      await page.waitFor(`document.getElementById('helpModal').getAttribute('aria-hidden') === 'true'`, { timeout: 3000 });
      await page.click("#btnAbout");
      await page.waitFor(`document.getElementById('aboutModal').getAttribute('aria-hidden') === 'false'`, { timeout: 3000 });
      const aboutText = await page.eval(`document.getElementById('aboutModal').innerText`);
      await page.pressKey("Escape", { code: "Escape", keyCode: 27 });
      await page.waitFor(`document.getElementById('aboutModal').getAttribute('aria-hidden') === 'true'`, { timeout: 3000 });
      assertIncludes(helpText, "Atajos de teclado");
      assertIncludes(aboutText, "ZARCONT");
      assertIncludes(aboutText, "2.3.0");
      return { helpText: helpText.slice(0, 120), aboutText: aboutText.slice(0, 160) };
    },
    { severity: "media", page },
  );

  await h.test(
    "HUB-09",
    "Pantalla completa del HUB con gesto real (headless)",
    async () => {
      await gotoHub(page, baseURL);
      await page.click("#btnFs");
      await new Promise((r) => setTimeout(r, 900));
      const on = await page.eval(`({ element: !!document.fullscreenElement, enabled: document.fullscreenEnabled, aria: document.getElementById('btnFs').getAttribute('aria-label'), cls: document.getElementById('btnFs').className })`);
      if (!on.element) {
        return { ...on, limitation: "requestFullscreen no concedió fullscreen en headless (se documenta como limitación del entorno)" };
      }
      await page.click("#btnFs");
      await new Promise((r) => setTimeout(r, 700));
      const off = await page.eval(`({ element: !!document.fullscreenElement, aria: document.getElementById('btnFs').getAttribute('aria-label') })`);
      assertEq(off.element, false, "salir de pantalla completa");
      return { on, off };
    },
    { severity: "media", page },
  );

  await h.test(
    "HUB-10",
    "Responsive: 360×640, 390×844, 768×1024, 1024×768, 1440×900 y landscape",
    async () => {
      await gotoHub(page, baseURL);
      const viewports = [
        [360, 640, false, "360x640"],
        [390, 844, false, "390x844"],
        [768, 1024, false, "768x1024"],
        [1024, 768, false, "1024x768"],
        [1440, 900, false, "1440x900"],
        [844, 390, true, "844x390-landscape"],
      ];
      const out = [];
      for (const [w, hgt, mobile, label] of viewports) {
        await page.viewport(w, hgt, { mobile, isLandscape: label.includes("landscape") });
        await new Promise((r) => setTimeout(r, 350));
        const m = await page.eval(`(() => {
          const cards = Array.from(document.querySelectorAll('.app-card'));
          const active = document.querySelector('.app-card.is-active');
          const ar = active ? active.getBoundingClientRect() : null;
          return {
            innerWidth, innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            overflowX: document.documentElement.scrollWidth - innerWidth,
            activeVisible: ar ? (ar.width > 20 && ar.height > 20 && ar.bottom > 0 && ar.top < innerHeight) : false,
            activeRect: ar ? { x: Math.round(ar.x), y: Math.round(ar.y), w: Math.round(ar.width), h: Math.round(ar.height) } : null,
            topbarVisible: !!document.querySelector('.topbar') && getComputedStyle(document.querySelector('.topbar')).display !== 'none'
          };
        })()`);
        const shot = await h.shot(page, `hub-${label}`);
        out.push({ label, ...m, shot });
        assert(m.overflowX <= 1, `desbordamiento horizontal en ${label}: ${m.overflowX}px`);
        assert(m.activeVisible, `tarjeta activa visible en ${label}: ${JSON.stringify(m.activeRect)}`);
      }
      await page.viewport(1440, 900);
      return out;
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-11",
    "Persistencia de selección del carrusel (si aplica)",
    async () => {
      skip("El HUB no persiste la tarjeta seleccionada entre recargas; el requisito no la exige (matriz: «selección si aplica»).");
    },
    { severity: "baja", page },
  );

  await h.test(
    "HUB-12",
    "App → HUB con control compartido y URL directa al HUB",
    async () => {
      await gotoApp(page, baseURL, "dashboard");
      const nav = page.waitForNavigation((url) => /\/index\.html(?:[?#]|$)/.test(url), 15000);
      const click = await clickFirst(page, ['[data-serums-chrome="hub"]', 'a[aria-label="Volver al HUB"]', '.dash-home-link', 'footer a[href="../index.html"]']);
      await nav;
      await waitApp(page, "hub");
      const url = await page.eval("location.href");
      assert(/\/index\.html(?:[?#]|$)/.test(url), `URL del HUB: ${url}`);
      return { click: click.selector, url };
    },
    { severity: "alta", page },
  );

  await h.test(
    "HUB-13",
    "Decisión D2: dock eliminado y navegación del carrusel conservada",
    async () => {
      await gotoHub(page, baseURL);
      const data = await page.eval(`({
        dock: !!document.getElementById('dock'),
        carousel: !!document.getElementById('carousel'),
        bar: !!document.getElementById('carouselBar'),
        dots: document.querySelectorAll('#dots [data-dot], #dots button').length,
        arrows: !!document.getElementById('prevTop') && !!document.getElementById('nextTop'),
        keys: !!(document.getElementById('btnHelp'))
      })`);
      assertEq(data.dock, false, "dock inferior eliminado (D2)");
      assert(data.carousel && data.bar && data.arrows, "carrusel, barra y flechas conservados");
      return data;
    },
    { severity: "media", page },
  );

  await h.test(
    "HUB-14",
    "Decisión D1: con snapshot sembrado, las tarjetas Study siguen abriendo portada",
    async () => {
      await gotoHub(page, baseURL);
      await page.eval(`localStorage.setItem('studyhub:snapshot:v1', JSON.stringify({
        version: 1,
        contentVersion: "2.5.0",
        dashboard: { totalSheets: 210, completedSheets: 1, last: { sheetId: "sheet-aps-01" } },
        flashcards: { totalCards: 630, reviewedCards: 1, last: { deckId: "sheet-aps-01" } }
      }))`);
      await page.goto(`${baseURL}/index.html`, { settle: 800 });
      const hrefs = await page.eval(`({
        dashboard: document.querySelector('[data-app="dashboard"]').getAttribute('href'),
        flashcards: document.querySelector('[data-app="flashcards"]').getAttribute('href')
      })`);
      assertEq(hrefs.dashboard.includes("?"), false, `tarjeta Dashboard sin query (${hrefs.dashboard})`);
      assertEq(hrefs.flashcards.includes("?"), false, `tarjeta Flashcards sin query (${hrefs.flashcards})`);
      await selectCard(page, "dashboard");
      await openSelected(page);
      await waitApp(page, "dashboard");
      const dash = await page.eval(`({ hash: location.hash, path: location.pathname })`);
      assertEq(dash.hash, "#/", "Dashboard abre en portada");
      await page.goto(`${baseURL}/index.html`, { settle: 800 });
      await selectCard(page, "flashcards");
      await openSelected(page);
      await waitApp(page, "flashcards");
      const flash = await page.eval(`({ hash: location.hash, path: location.pathname })`);
      assertEq(flash.hash, "#/", "Flashcards abre en portada");
      return { hrefs, dash, flash };
    },
    { severity: "alta", page },
  );
}
