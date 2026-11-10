/* © 2026 ZARCONT — Smoke de integración de navegación (Fase 1).
 * Chrome headless + HTTP real sobre la app. No forma parte de tests/e2e.
 *
 * Uso, desde study-dashboard/:
 *   node tests/nav/probe-nav.mjs
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "../../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../../tests/e2e/lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const PORT = 8796;
const CDP_PORT = 9396;

const failures = [];
function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
    failures.push(name + (detail ? " — " + detail : ""));
  }
}

const server = new StaticServer({ root: ROOT, port: PORT, python: PYTHON });
const chrome = new Chrome({
  chromePath: CHROME,
  userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-nav-")), "p"),
  port: CDP_PORT
});
let page = null;

try {
  await server.start();
  await chrome.start();
  page = new Page(await chrome.newTarget("about:blank"), { browser: chrome, port: CDP_PORT });
  await page.init();
  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/study-dashboard/index.html#/biblioteca`, { settle: 1000 });
  await page.conn.send("Page.bringToFront");

  const initial = await page.eval(`(() => ({
    host: !!document.querySelector('[data-module-mount="library-search"] [data-navx-search]'),
    input: !!document.querySelector('[data-library-search-input]'),
    bodyHidden: document.querySelector('#library-body-results').hidden,
    searchRequests: performance.getEntriesByType('resource').filter(e => e.name.includes('/search.json')).length,
    summaryVisible: getComputedStyle(document.querySelector('#library-summary')).display !== 'none'
  }))()`);
  check("panel montado en library-search", initial.host);
  check("campo con data-library-search-input", initial.input);
  check("resultados externos ocultos al inicio", initial.bodyHidden);
  check("search.json no se pide al arrancar", initial.searchRequests === 0, String(initial.searchRequests));
  check("biblioteca normal visible sin consulta", initial.summaryVisible);

  /* La paleta no debe pedir el índice solo por abrirse. */
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))`);
  await sleep(150);
  const lazyPalette = await page.eval(`(() => ({
    open: !document.querySelector('.navx-palette-layer').hidden,
    requests: performance.getEntriesByType('resource').filter(e => e.name.includes('/search.json')).length,
    sheetOptions: document.querySelectorAll('[data-navx-palette-kind="sheet"]').length,
    views: Array.from(document.querySelectorAll('[data-navx-palette-group="views"] [data-navx-palette-kind="view"]')).map((option) => ({
      label: (option.querySelector('.navx-palette-option-label') || {}).textContent || '',
      hint: (option.querySelector('.navx-palette-option-hint') || {}).textContent || '',
      hasIcon: !!option.querySelector('.navx-palette-option-icon svg')
    }))
  }))()`);
  check("abrir la paleta no descarga el índice", lazyPalette.open && lazyPalette.requests === 0 && lazyPalette.sheetOptions === 0, JSON.stringify(lazyPalette));
  const expectedPhase2Views = ["Ruta de hoy", "Plan de estudio", "Mapa de dominio", "Repaso de fichas"];
  const expectedPhase3Views = ["Repaso relámpago", "Hoja de último día", "Glosario", "Datos para memorizar", "Trampas frecuentes"];
  const viewLabels = lazyPalette.views.map((view) => view.label);
  check(
    "la paleta incluye las cuatro vistas de Fase 2",
    expectedPhase2Views.every((label) => viewLabels.includes(label)),
    JSON.stringify(viewLabels)
  );
  check(
    "la paleta incluye las cinco vistas de Fase 3",
    expectedPhase3Views.every((label) => viewLabels.includes(label)),
    JSON.stringify(viewLabels)
  );
  check(
    "las vistas de la paleta no se duplican y tienen motivo/icono",
    new Set(viewLabels).size === viewLabels.length &&
      lazyPalette.views.every((view) => view.label.trim() && view.hint.trim() && view.hasIcon),
    JSON.stringify(lazyPalette.views)
  );
  check(
    "la paleta suma diez vistas previas y cinco nuevas (15 únicas)",
    viewLabels.length === 15 && new Set(viewLabels).size === 15,
    JSON.stringify({ count: viewLabels.length })
  );
  const phase2Icons = await page.eval(`(() => ({
    compass: StudyUI.icon("compass", 16),
    calendar: StudyUI.icon("calendar", 16),
    target: StudyUI.icon("target", 16),
    rotate: StudyUI.icon("rotate", 16)
  }))()`);
  check(
    "los cuatro iconos de Fase 2 existen",
    Object.values(phase2Icons).every((svg) => /<svg/i.test(svg)),
    JSON.stringify(Object.keys(phase2Icons).filter((name) => !/<svg/i.test(phase2Icons[name])))
  );
  const phase3Icons = await page.eval(`(() => ({
    flame: StudyUI.icon("flame", 16),
    calendar: StudyUI.icon("calendar", 16),
    book: StudyUI.icon("book", 16),
    list: StudyUI.icon("list", 16),
    alert: StudyUI.icon("alert", 16)
  }))()`);
  check(
    "los cinco iconos de Fase 3 existen",
    Object.values(phase3Icons).every((svg) => /<svg/i.test(svg)),
    JSON.stringify(Object.keys(phase3Icons).filter((name) => !/<svg/i.test(phase3Icons[name])))
  );
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
  await sleep(200);

  await page.eval(`(() => {
    window.__navStates = [];
    const body = document.querySelector('#library-body-results');
    const record = () => window.__navStates.push({
      hidden: body.hidden,
      state: body.dataset.state || '',
      busy: body.getAttribute('aria-busy') || ''
    });
    record();
    new MutationObserver(record).observe(body, { attributes: true, attributeFilter: ['hidden', 'data-state', 'aria-busy', 'class'] });
  })()`);
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }))`);
  await sleep(60);
  const slashFocus = await page.eval(`document.activeElement === document.querySelector('[data-library-search-input]')`);
  check("el atajo / enfoca la búsqueda", slashFocus);
  await page.waitFor(
    `performance.getEntriesByType('resource').filter(e => e.name.includes('/search.json')).length > 0 ||
     /Índice listo/.test(document.querySelector('[data-navx-search-status]').innerText)`,
    { timeout: 15000, message: "carga del índice" }
  );
  await page.waitFor(`/Índice listo/.test(document.querySelector('[data-navx-search-status]').innerText)`, { timeout: 15000, message: "índice listo sin consulta" });
  const loading = await page.eval(`(() => ({
    states: window.__navStates,
    busy: document.querySelector('#library-body-results').getAttribute('aria-busy'),
    state: document.querySelector('#library-body-results').dataset.state,
    text: document.querySelector('#library-body-results').innerText.slice(0, 200)
  }))()`);
  check(
    "al enfocar aparece carga/progreso",
    loading.states.some((s) => s.state === "loading" && s.busy === "true" && s.hidden === false),
    JSON.stringify(loading.states.slice(0, 8))
  );

  const afterFocus = await page.eval(`(() => ({
    requests: performance.getEntriesByType('resource').filter(e => e.name.includes('/search.json')).length,
    hidden: document.querySelector('#library-body-results').hidden,
    status: document.querySelector('[data-navx-search-status]').innerText
  }))()`);
  check("search.json se pide solo después del foco", afterFocus.requests === 1, JSON.stringify(afterFocus));
  check("el cuerpo se repliega sin consulta", afterFocus.hidden === true);

  const query = "vacunación";
  await page.eval(`(() => {
    const input = document.querySelector('[data-library-search-input]');
    input.focus();
    input.value = ${JSON.stringify(query)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await page.waitFor(`document.querySelectorAll('#library-body-results a[data-navx-sheet]').length > 0`, { timeout: 10000, message: "resultados de búsqueda" });
  const results = await page.eval(`(() => ({
    count: document.querySelectorAll('#library-body-results a[data-navx-sheet]').length,
    summaryDisplay: getComputedStyle(document.querySelector('#library-summary')).display,
    resultsDisplay: getComputedStyle(document.querySelector('#library-results')).display,
    filtersDisplay: getComputedStyle(document.querySelector('.library-filters')).display,
    summaryHidden: document.querySelector('#library-summary').hidden,
    resultsHidden: document.querySelector('#library-results').hidden,
    filtersHidden: document.querySelector('.library-filters').hidden,
    marks: document.querySelectorAll('#library-body-results mark.navx-mark').length,
    firstHref: document.querySelector('#library-body-results a[data-navx-sheet]').getAttribute('href'),
    firstSnippet: document.querySelector('#library-body-results .navx-result-snippet').innerHTML.slice(0, 200)
  }))()`);
  check("búsqueda real devuelve resultados", results.count > 0, String(results.count));
  check("consulta activa oculta resumen, resultados y filtros", results.summaryDisplay === "none" && results.resultsDisplay === "none" && results.filtersDisplay === "none", JSON.stringify(results));
  check("ocultación explícita con hidden al buscar", results.summaryHidden && results.resultsHidden && results.filtersHidden, JSON.stringify(results));
  check("fragmento resaltado con <mark>", results.marks > 0, results.firstSnippet);
  check("enlace de resultado a ficha real", /^#\/ficha\/[A-Za-z0-9-]+$/.test(results.firstHref), results.firstHref);

  const selectEnter = await page.eval(`(() => {
    const select = document.querySelector('[data-navx-search-area]');
    select.focus();
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    return { hash: location.hash, active: document.activeElement && document.activeElement.tagName };
  })()`);
  check("Enter en el selector de área no abre una ficha", selectEnter.hash === "#/biblioteca" && selectEnter.active === "SELECT", JSON.stringify(selectEnter));

  const areaFilter = await page.eval(`(() => {
    const select = document.querySelector('[data-navx-search-area]');
    const option = Array.from(select.options).find(o => o.value);
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return { value: option.value, label: option.textContent };
  })()`);
  await sleep(500);
  const areaResults = await page.eval(`(() => ({
    paths: Array.from(document.querySelectorAll('#library-body-results .navx-result-path')).map(el => el.textContent),
    count: document.querySelectorAll('#library-body-results a[data-navx-sheet]').length
  }))()`);
  check("filtro por área devuelve resultados del área", areaResults.count > 0 && areaResults.paths.every((p) => p.indexOf(areaFilter.label) !== -1 || p.length === 0), JSON.stringify({ areaFilter, areaResults: areaResults.paths.slice(0, 3) }));

  await page.eval(`StudyApp.refresh({ scrollY: window.scrollY })`);
  await page.waitFor(`document.querySelectorAll('#library-body-results a[data-navx-sheet]').length > 0`, { timeout: 8000, message: "persistencia de la consulta" });
  const persisted = await page.eval(`(() => ({
    value: document.querySelector('[data-library-search-input]').value,
    summaryHidden: document.querySelector('#library-summary').hidden,
    bodyHidden: document.querySelector('#library-body-results').hidden
  }))()`);
  check(
    "la consulta sobrevive a un refresh de ruta",
    persisted.value === query && persisted.summaryHidden === true && persisted.bodyHidden === false,
    JSON.stringify(persisted)
  );

  await page.eval(`(() => {
    const input = document.querySelector('[data-library-search-input]');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await page.waitFor(`document.querySelector('#library-body-results').hidden === true`, { timeout: 5000 });
  const cleared = await page.eval(`(() => ({
    summary: getComputedStyle(document.querySelector('#library-summary')).display,
    results: getComputedStyle(document.querySelector('#library-results')).display,
    filters: getComputedStyle(document.querySelector('.library-filters')).display,
    summaryHidden: document.querySelector('#library-summary').hidden,
    resultsHidden: document.querySelector('#library-results').hidden,
    filtersHidden: document.querySelector('.library-filters').hidden,
    body: document.querySelector('#library-body-results').hidden
  }))()`);
  check("limpiar restaura la biblioteca normal", cleared.summary !== "none" && cleared.results !== "none" && cleared.filters !== "none" && cleared.body === true, JSON.stringify(cleared));
  check("limpiar retira hidden de la biblioteca", !cleared.summaryHidden && !cleared.resultsHidden && !cleared.filtersHidden, JSON.stringify(cleared));

  await page.eval(`(() => { const i=document.querySelector('[data-library-search-input]'); i.focus(); i.value='zzzzzz'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await page.waitFor(`document.querySelector('#library-body-results').dataset.state === 'empty'`, { timeout: 5000, message: "estado vacío" });
  const emptyState = await page.eval(`(() => ({
    state: document.querySelector('#library-body-results').dataset.state,
    emptyCard: !!document.querySelector('#library-body-results .navx-state--empty'),
    summaryHidden: document.querySelector('#library-summary').hidden
  }))()`);
  check("estado vacío con consulta sin coincidencias", emptyState.emptyCard && emptyState.summaryHidden, JSON.stringify(emptyState));
  await page.eval(`(() => { const i=document.querySelector('[data-library-search-input]'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await page.waitFor(`document.querySelector('#library-body-results').hidden === true`, { timeout: 5000 });

  await page.eval(`document.querySelector('[data-library-search-input]').focus()`);
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))`);
  await sleep(150);
  const paletteInInput = await page.eval(`!document.querySelector('.navx-palette-layer').hidden`);
  check("Ctrl+K funciona con el foco en el buscador", paletteInInput);
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
  await sleep(200);
  const paletteBackToInput = await page.eval(`document.activeElement === document.querySelector('[data-library-search-input]')`);
  check("al cerrar la paleta vuelve al buscador", paletteBackToInput);

  /* Paleta por Ctrl+K (evento real de teclado sintético del navegador). */
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))`);
  await sleep(120);
  const palette = await page.eval(`(() => {
    const layer = document.querySelector('.navx-palette-layer');
    const input = document.querySelector('.navx-palette-input');
    const main = document.querySelector('#main');
    return {
      open: !!layer && !layer.hidden,
      input: !!input,
      focused: document.activeElement === input,
      mainInert: !!main && main.inert,
      options: document.querySelectorAll('[data-navx-palette-index]').length,
      groups: Array.from(document.querySelectorAll('[data-navx-palette-group]')).map(g => g.getAttribute('data-navx-palette-group'))
    };
  })()`);
  check("Ctrl+K abre la paleta", palette.open);
  check("paleta es modal con fondo inert y foco en el campo", palette.focused && palette.mainInert, JSON.stringify(palette));
  check("paleta incluye vistas y acciones", palette.groups.includes("views") && palette.groups.includes("actions"), JSON.stringify(palette.groups));

  const paletteQuery = await page.eval(`(() => {
    const input = document.querySelector('.navx-palette-input');
    input.value = 'progreso';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(500);
  const activeLabel = await page.eval(`(() => {
    const active = document.querySelector('[data-navx-palette-index].is-active .navx-palette-option-label');
    return active ? active.textContent : '';
  })()`);
  check("consulta de paleta activa la vista exacta", /progreso/i.test(activeLabel), activeLabel);

  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
  await sleep(200);
  const paletteClosed = await page.eval(`(() => ({
    open: !document.querySelector('.navx-palette-layer').hidden,
    mainInert: document.querySelector('#main').inert
  }))()`);
  check("Esc cierra la paleta y restaura el fondo", paletteClosed.open === false && paletteClosed.mainInert === false, JSON.stringify(paletteClosed));

  /* Abrir desde Más: el evento palette:open entrega el botón visible. */
  await page.eval(`document.querySelector('[data-action="more-open"]').click()`);
  await sleep(150);
  const moreOpen = await page.eval(`!document.querySelector('#dash-more-panel').hidden`);
  check("Más abre su panel", moreOpen);
  await page.eval(`document.querySelector('[data-navx-open-palette]').click()`);
  await sleep(250);
  const morePalette = await page.eval(`(() => ({
    palette: !document.querySelector('.navx-palette-layer').hidden,
    more: !document.querySelector('#dash-more-panel').hidden,
    focus: document.activeElement && document.activeElement.className
  }))()`);
  check("el botón de Más abre la paleta y cierra Más", morePalette.palette && !morePalette.more, JSON.stringify(morePalette));
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
  await sleep(250);
  const returnFocus = await page.eval(`(() => {
    const active = document.activeElement;
    const main = document.querySelector('#main');
    return { main: active === main, tag: active && active.tagName };
  })()`);
  check("al cerrar no se pierde el foco si Más está oculto", returnFocus.main, JSON.stringify(returnFocus));

  /* Lector: índice y relacionadas con evidencia real. */
  await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-audit-05`, { settle: 900 });
  const reader = await page.eval(`(() => ({
    sections: document.querySelectorAll('[data-module-mount="reader-index"] .navx-section-link').length,
    indexVisible: !!document.querySelector('[data-module-mount="reader-index"] .navx-sections'),
    related: document.querySelectorAll('[data-module-mount="reader-related"] .navx-related-card').length,
    reason: (document.querySelector('[data-module-mount="reader-related"] .navx-related-reason') || {}).textContent || "",
    tag: (document.querySelector('[data-module-mount="reader-related"] .navx-related-tag') || {}).textContent || "",
    hrefs: Array.from(document.querySelectorAll('[data-module-mount="reader-related"] a[href^="#/ficha/"]')).map(a => a.getAttribute('href'))
  }))()`);
  check("índice de secciones montado", reader.indexVisible && reader.sections > 0, JSON.stringify(reader));
  check("relacionadas con evidencia textual", reader.related > 0 && /Comparten el término/.test(reader.reason) && reader.tag === "Evidencia", JSON.stringify(reader));
  check("relacionadas enlazan a fichas existentes", reader.hrefs.every((href) => /^#\/ficha\/[A-Za-z0-9-]+$/.test(href)), JSON.stringify(reader.hrefs));

  const indexState = await page.eval(`(() => {
    const links = Array.from(document.querySelectorAll('[data-module-mount="reader-index"] .navx-section-link'));
    const current = links.filter((link) => link.getAttribute('aria-current') === 'location');
    const reading = links.filter((link) => {
      const label = link.querySelector('.navx-section-reading');
      return label && !label.hidden;
    });
    const mountText = document.querySelector('[data-module-mount="reader-index"]').innerText;
    const mountTextContent = document.querySelector('[data-module-mount="reader-index"]').textContent;
    return {
      current: current.length,
      reading: reading.length,
      leyendoOccurrences: (mountText.match(/LEYENDO/gi) || []).length,
      leyendoTextOccurrences: (mountTextContent.match(/LEYENDO/gi) || []).length,
      activeIndexes: current.map((link) => link.getAttribute('data-navx-section-index'))
    };
  })()`);
  check(
    "una sola sección activa y un solo Leyendo",
    indexState.current === 1 && indexState.reading === 1 && indexState.leyendoOccurrences === 1 && indexState.leyendoTextOccurrences === 1,
    JSON.stringify(indexState)
  );

  const hashBeforeSection = await page.eval(`location.hash`);
  await page.eval(`document.querySelectorAll('.reader-section')[1].scrollIntoView({ behavior: 'instant', block: 'start' })`);
  await sleep(500);
  const spy = await page.eval(`(() => {
    const active = document.querySelector('[data-navx-section-index].is-active');
    const bar = document.querySelector('.navx-sections-progress .navx-progress');
    return {
      index: active ? Number(active.getAttribute('data-navx-section-index')) : -1,
      current: active ? active.getAttribute('aria-current') : '',
      progress: bar ? Number(bar.getAttribute('aria-valuenow')) : -1
    };
  })()`);
  check("scrollspy marca la sección activa y el avance", spy.index >= 1 && spy.current === "location" && spy.progress > 0, JSON.stringify(spy));
  await page.eval(`document.querySelectorAll('[data-navx-section-index]')[1].click()`);
  await sleep(400);
  const sectionJump = await page.eval(`(() => {
    const active = document.activeElement;
    return {
      hashSame: location.hash === ${JSON.stringify(hashBeforeSection)},
      tag: active && active.tagName,
      text: active ? active.textContent.trim().slice(0, 60) : ""
    };
  })()`);
  check("saltar de sección no cambia el hash y enfoca el h2", sectionJump.hashSame && sectionJump.tag === "H2", JSON.stringify(sectionJump));

  const relatedFallback = await page.eval(`(async () => {
    const btn = document.querySelector('[data-module-mount="reader-index"] .navx-sections-toggle');
    return true;
  })()`);
  await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-aps-04`, { settle: 900 });
  const fallback = await page.eval(`(() => ({
    related: document.querySelectorAll('[data-module-mount="reader-related"] .navx-related-card').length,
    reasons: Array.from(document.querySelectorAll('[data-module-mount="reader-related"] .navx-related-reason')).map(el => el.textContent),
    tags: Array.from(document.querySelectorAll('[data-module-mount="reader-related"] .navx-related-tag')).map(el => el.textContent)
  }))()`);
  check("relacionadas estructurales cuando no hay evidencia", fallback.related > 0 && fallback.related <= 4 && fallback.reasons.some((r) => /Comparten (el tema|la categoría)/.test(r)), JSON.stringify(fallback));

  /* Scrollspy y hoja móvil. */
  await page.viewport(390, 844, { mobile: true });
  await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-audit-05`, { settle: 700 });
  const mobile = await page.eval(`(() => {
    const main = document.querySelector('.reader-main');
    const toggle = document.querySelector('[data-module-mount="reader-index"] .navx-sections-toggle');
    return {
      indexedClass: main.classList.contains('navx-reader-main--indexed'),
      paddingBottom: getComputedStyle(main).paddingBottom,
      toggleFixed: toggle ? getComputedStyle(toggle).position : "",
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      hOverflow: document.documentElement.scrollWidth > innerWidth + 1
    };
  })()`);
  check("lector móvil reserva espacio del FAB", mobile.indexedClass && parseFloat(mobile.paddingBottom) >= 80, JSON.stringify(mobile));
  check("sin scroll horizontal en 390", !mobile.hOverflow, String(mobile.scrollWidth));
  await page.eval(`document.querySelector('[data-module-mount="reader-index"] .navx-sections-toggle').click()`);
  await sleep(200);
  const sheet = await page.eval(`(() => {
    const panel = document.querySelector('.navx-sections-panel');
    const scrim = document.querySelector('[data-navx-sections-scrim]');
    return { open: !panel.hidden, modal: panel.getAttribute('aria-modal'), scrim: !scrim.hidden, focus: document.activeElement && document.activeElement.className };
  })()`);
  check("hoja móvil del índice abre con velo y foco", sheet.open && sheet.modal === "true" && sheet.scrim, JSON.stringify(sheet));

  /* En móvil, Más es visible: el cierre de la paleta devuelve el foco allí. */
  await page.eval(`document.querySelector('[data-navx-sections-close]').click()`);
  await sleep(200);
  await page.eval(`document.querySelector('[data-action="more-open"]').click()`);
  await sleep(120);
  await page.eval(`document.querySelector('[data-navx-open-palette]').click()`);
  await sleep(250);
  await page.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))`);
  await sleep(250);
  const mobileReturn = await page.eval(`(() => {
    const more = document.querySelector('[data-action="more-open"]');
    return { focused: document.activeElement === more, moreVisible: more.getClientRects().length > 0, tag: document.activeElement && document.activeElement.tagName };
  })()`);
  check("en móvil el foco vuelve al botón Más", mobileReturn.focused && mobileReturn.moreVisible, JSON.stringify(mobileReturn));

  /* Sin scroll horizontal en escritorio con búsqueda y relacionadas. */
  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/study-dashboard/index.html#/biblioteca`, { settle: 600 });
  await page.eval(`(() => { const i=document.querySelector('[data-library-search-input]'); i.focus(); i.value='atención primaria'; i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await page.waitFor(`document.querySelectorAll('#library-body-results a[data-navx-sheet]').length > 0`, { timeout: 15000 });
  const desktop = await page.eval(`(() => ({ w: document.documentElement.scrollWidth, iw: innerWidth }))()`);
  check("sin scroll horizontal en 1440", desktop.w <= desktop.iw + 1, JSON.stringify(desktop));

  for (const width of [360, 768, 1024]) {
    await page.viewport(width, 844, { mobile: width < 900 });
    await sleep(180);
    const metrics = await page.eval(`(() => {
      const host = document.querySelector('[data-module-mount="library-search"]');
      const bar = host.querySelector('.navx-search-bar');
      return {
        w: document.documentElement.scrollWidth,
        iw: innerWidth,
        hostHeight: Math.round(host.getBoundingClientRect().height),
        barHeight: Math.round(bar.getBoundingClientRect().height)
      };
    })()`);
    check(`sin scroll horizontal en ${width} (búsqueda)`, metrics.w <= metrics.iw + 1, JSON.stringify(metrics));
    if (width <= 620) {
      check(`host de búsqueda sin hueco vertical en ${width}`, metrics.hostHeight <= metrics.barHeight + 40, JSON.stringify(metrics));
    }
  }
  await page.viewport(1440, 900);

  await page.eval(`(() => {
    const input = document.querySelector('[data-library-search-input]');
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  })()`);
  await page.waitFor(`location.hash.startsWith('#/ficha/')`, { timeout: 5000, message: "Enter abre la primera ficha" });
  const enterResult = await page.eval(`({ hash: location.hash, h1: (document.querySelector('#view-root h1') || {}).textContent || '' })`);
  check("Enter abre el primer resultado", enterResult.hash.startsWith("#/ficha/") && enterResult.h1.length > 0, JSON.stringify(enterResult));

  for (const width of [360, 768, 1024, 1440]) {
    await page.viewport(width, 844, { mobile: width < 900 });
    await sleep(220);
    const metrics = await page.eval(`(() => ({
      w: document.documentElement.scrollWidth,
      iw: innerWidth,
      related: document.querySelectorAll('[data-module-mount="reader-related"] .navx-related-card').length,
      sections: document.querySelectorAll('[data-module-mount="reader-index"] .navx-section-link').length
    }))()`);
    check(`sin scroll horizontal en ${width} (ficha)`, metrics.w <= metrics.iw + 1 && metrics.related > 0 && metrics.sections > 0, JSON.stringify(metrics));
  }

  /* La paleta debe navegar con el router, sin recargar el documento. La ruta
     #/ruta puede estar aún sin registrar: el hash y la misma página se prueban
     aquí; el contenido de la vista es verificación de QA con el módulo plan. */
  await page.eval(`window.__navProbeMarker = 1; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))`);
  await sleep(200);
  await page.eval(`(() => {
    const input = document.querySelector('.navx-palette-input');
    input.focus();
    input.value = 'Ruta de hoy';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await page.waitFor(
    `(() => { const active = document.querySelector('[data-navx-palette-index].is-active .navx-palette-option-label'); return !!active && /ruta de hoy/i.test(active.textContent); })()`,
    { timeout: 5000, message: "vista Ruta de hoy activa" }
  );
  await page.eval(`document.querySelector('.navx-palette-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))`);
  await page.waitFor(`location.hash === '#/ruta'`, { timeout: 5000, message: "la paleta navega a #/ruta" });
  const paletteNavigation = await page.eval(`({ hash: location.hash, sameDocument: window.__navProbeMarker === 1 })`);
  check("la paleta navega a #/ruta sin recargar", paletteNavigation.hash === "#/ruta" && paletteNavigation.sameDocument, JSON.stringify(paletteNavigation));

  /* Fase 3: misma comprobación de router para una de las vistas de Última hora.
     El contenido de #/glosario depende del módulo reference/glossary de QA. */
  await page.eval(`window.__navProbeMarker = 1; document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }))`);
  await sleep(200);
  await page.eval(`(() => {
    const input = document.querySelector('.navx-palette-input');
    input.focus();
    input.value = 'Glosario';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await page.waitFor(
    `(() => { const active = document.querySelector('[data-navx-palette-index].is-active .navx-palette-option-label'); return !!active && /^glosario$/i.test(active.textContent.trim()); })()`,
    { timeout: 5000, message: "vista Glosario activa" }
  );
  await page.eval(`document.querySelector('.navx-palette-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))`);
  await page.waitFor(`location.hash === '#/glosario'`, { timeout: 5000, message: "la paleta navega a #/glosario" });
  const phase3Navigation = await page.eval(`({ hash: location.hash, sameDocument: window.__navProbeMarker === 1 })`);
  check("la paleta navega a #/glosario sin recargar", phase3Navigation.hash === "#/glosario" && phase3Navigation.sameDocument, JSON.stringify(phase3Navigation));

  const external = page.exceptions.filter((e) => /\/js\/(active|plan)\//.test(e.url || ""));
  const errors = page.exceptions
    .filter((e) => !/\/js\/(active|plan)\//.test(e.url || ""))
    .map((e) => e.description || e.text)
    .filter(Boolean);
  const consoleErrors = page.consoleErrors.map((e) => e.text);
  check("sin excepciones JS propias", errors.length === 0, errors.slice(0, 3).join(" | "));
  check("consola sin errores propios", consoleErrors.filter((text) => !/404|Failed to load resource/i.test(text)).length === 0, consoleErrors.slice(0, 3).join(" | "));
  if (external.length) {
    console.log(`INFO  excepciones de módulos de otros agentes (no evaluadas): ${external.length}`);
  }

  console.log(`\nRESULTADO: ${failures.length ? failures.length + " fallo(s)" : "OK"}`);
  failures.forEach((f) => console.log("  - " + f));
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error("Probe falló:", error && error.stack ? error.stack : error);
  process.exitCode = 1;
} finally {
  if (page) await page.close().catch(() => {});
  await chrome.stop().catch(() => {});
  await server.stop().catch(() => {});
}
