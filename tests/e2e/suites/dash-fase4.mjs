/* © 2026 ZARCONT — Suites de Fase 4 del Study Dashboard (Agente 6).
 *
 * DASH-45 … DASH-48 se escriben contra `study-dashboard/docs/CONTRATOS-FASE4.md`
 * (§2 arquitectura H4, §3 integración, §4 H17, §6 aceptación): arranque sin el
 * temario completo, ficha directa con chunk bloqueado (loading/error/reintento),
 * conteo editorial H17 y cero pérdida al exportar/importar un estado v2.
 *
 * Selectores estables del contrato y de la integración:
 *   section.sheet-gate[role="status"]   → estado de carga de una ficha
 *   section.sheet-gate[role="alert"]    → error visible con reintento
 *   [data-action="sheet-retry"]         → botón Reintentar
 *   article.reader / .reader-main / .reader-section / #section-0
 *   [data-action="toggle-complete"], [data-ac-action="paragraph:open"]
 *
 * H4: `temario-core.js` + `content-loader.js`; `temario.js` NO debe pedirse.
 * Una ficha sin secciones se carga con el chunk de su área primaria; un área
 * ya cargada no repite request. Las rutas que no leen secciones no piden
 * chunks. Study Flashcards solo necesita core+cards. El HUB no descarga nada
 * del temario y conserva `studyhub:snapshot:v1`.
 *
 * No se marca PASS sin comprobar el comportamiento real. Si la integración aún
 * no está, la prueba falla con «PENDIENTE DE INTEGRACIÓN (Fase 4)» y el
 * selector/estado concreto; nunca se convierte en SKIP.
 */
import { assert, assertEq, assertIncludes, skip } from "../lib/harness.mjs";
import { appURL, firstVisible, gotoApp, waitApp } from "../lib/apps.mjs";
import { sleep } from "../lib/cdp.mjs";

const PENDING = "PENDIENTE DE INTEGRACIÓN (Fase 4): ";
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };
const CDP = (page) => page.conn;

const PATH = {
  full: "/study-data/temario.js",
  core: "/study-data/temario-core.js",
  loader: "/study-data/content-loader.js",
  sections: "/study-data/sections/",
  studyData: "/study-data/",
};

const AREA = {
  cuidado: "area-psi-cuidado-integral",
  salud: "area-psi-salud-publica",
};
const SHEET = {
  same: "sheet-aps-01",
  same2: "sheet-aps-02",
  other: "sheet-ottawa-01",
  cancel: "sheet-psi-et-1-1",
};
const SNAPSHOT_KEY = "studyhub:snapshot:v1";
const STATE_KEY = "study-state-v1";

const LOADING_SELECTORS = ['section.sheet-gate[role="status"]', "[data-sheet-loading]"];
const ERROR_SELECTORS = ['section.sheet-gate[role="alert"]', "[data-sheet-error]"];
const RETRY_SELECTORS = [
  '[data-action="sheet-retry"]',
  "[data-sheet-error] button",
  "[data-sheet-error] a[href]",
];

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

async function noSmoothScroll(page) {
  await page.eval(`(() => {
    try { document.documentElement.style.scrollBehavior = "auto"; } catch (e) {}
    return true;
  })()`);
}

async function openDocument(page, url, settle = 900, { fresh = false, wait = "load" } = {}) {
  let target = url;
  if (fresh) {
    const [base, hash = ""] = url.split("#");
    target = base + (base.includes("?") ? "&" : "?") + "qa=" + Date.now() + (hash ? "#" + hash : "");
  }
  await page.goto(target, { settle, wait });
  await noSmoothScroll(page);
}

async function setViewport(page, viewport, { touch = false, landscape = false } = {}) {
  await page.viewport(viewport.width, viewport.height, { mobile: touch, isLandscape: landscape });
  await CDP(page).send("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
  await sleep(200);
}

async function resetViewport(page) {
  await setViewport(page, VIEWPORT_DESKTOP, { touch: false });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pathCount(list, needle) {
  return (list || []).filter((url) => String(url).includes(needle)).length;
}

/** Recursos del documento actual (performance se limpia en cada navegación). */
const RESOURCES_JS = `(() => {
  const P = ${JSON.stringify(PATH)};
  const entries = performance.getEntriesByType("resource").map((entry) => ({
    url: entry.name,
    transfer: entry.transferSize || 0,
    encoded: entry.encodedBodySize || 0,
    decoded: entry.decodedBodySize || 0,
    duration: Math.round(entry.duration || 0)
  }));
  const chunks = entries.filter((entry) => entry.url.includes(P.sections));
  const loaded = chunks.filter((entry) => entry.transfer > 0 || entry.decoded > 0);
  return {
    href: location.href,
    entries: entries.length,
    full: entries.filter((entry) => entry.url.includes(P.full)),
    core: entries.filter((entry) => entry.url.includes(P.core)),
    loader: entries.filter((entry) => entry.url.includes(P.loader)),
    chunks,
    loadedChunks: loaded,
    studyData: entries.filter((entry) => entry.url.includes(P.studyData)),
    transfer: entries.reduce((total, entry) => total + entry.transfer, 0),
    count: entries.filter((entry) => entry.transfer > 0 || entry.decoded > 0).length
  };
})()`;

async function resources(page) {
  return page.eval(RESOURCES_JS);
}

const GATE_JS = `(() => {
  const P = ${JSON.stringify(PATH)};
  const root = document.getElementById("view-root");
  const visible = (el) => {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && !el.hidden && rect.width > 1 && rect.height > 1;
  };
  const pick = (selectors) => {
    for (const selector of selectors) {
      const nodes = Array.from(root.querySelectorAll(selector));
      const shown = nodes.find(visible);
      if (shown) return shown;
    }
    return null;
  };
  const loading = pick(${JSON.stringify(LOADING_SELECTORS)});
  const error = pick(${JSON.stringify(ERROR_SELECTORS)});
  const retry = error ? error.querySelector(${JSON.stringify(RETRY_SELECTORS.join(","))}) : null;
  const reader = root.querySelector("article.reader");
  const main = root.querySelector(".reader-main");
  const sections = root.querySelectorAll(".reader-section").length;
  const chunkRequests = performance.getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => url.includes(P.sections));
  return {
    hash: location.hash,
    title: document.title,
    loading: loading
      ? {
          visible: visible(loading),
          role: loading.getAttribute("role"),
          busy: loading.getAttribute("aria-busy"),
          live: loading.getAttribute("aria-live"),
          text: (loading.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 260)
        }
      : null,
    error: error
      ? {
          visible: visible(error),
          role: error.getAttribute("role"),
          text: (error.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 300),
          retry: retry
            ? {
                tag: retry.tagName,
                label: (retry.getAttribute("aria-label") || retry.innerText || "").replace(/\\s+/g, " ").trim(),
                action: retry.getAttribute("data-action")
              }
            : null
        }
      : null,
    reader: {
      present: !!reader,
      sheetId: reader ? reader.getAttribute("data-sheet-id") : null,
      main: !!main,
      sections,
      h1: ((root.querySelector("h1") || {}).innerText || "").trim(),
      paragraphs: root.querySelectorAll("[data-paragraph-index]").length,
      paragraphAction: !!root.querySelector('[data-ac-action="paragraph:open"]')
    },
    contentState: window.StudyContent && window.StudyContent.state ? window.StudyContent.state() : null,
    chunkRequests
  };
})()`;

async function gateState(page) {
  return page.eval(GATE_JS);
}

async function waitGate(page, kind, timeout = 20000) {
  const selector = kind === "loading" ? LOADING_SELECTORS.join(",") : ERROR_SELECTORS.join(",");
  await page.waitFor(`(() => {
    const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
    return nodes.some((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && !el.hidden && rect.width > 1 && rect.height > 1;
    });
  })()`, { timeout, message: `estado de ${kind} de la ficha` });
  await sleep(120);
  return gateState(page);
}

async function waitReader(page, { timeout = 20000, h1 = null } = {}) {
  await page.waitFor(`(() => {
    const reader = document.querySelector("article.reader");
    if (!reader) return false;
    if (!reader.querySelector(".reader-main")) return false;
    if (reader.querySelectorAll(".reader-section").length < 1) return false;
    ${h1 ? `const title = (reader.querySelector("h1") || {}).innerText || ""; if (!title.includes(${JSON.stringify(h1)})) return false;` : ""}
    return true;
  })()`, { timeout, message: `lector de la ficha${h1 ? ` (${h1})` : ""}` });
  await sleep(220);
  return gateState(page);
}

async function expectedTitle(page, sheetId) {
  return page.eval(`(() => {
    const sheet = (window.STUDY_CONTENT && window.STUDY_CONTENT.sheets || []).find((item) => item.id === ${JSON.stringify(sheetId)});
    return sheet ? sheet.title : null;
  })()`);
}

async function fetchIntercept(page) {
  const paused = [];
  const off = page.conn.on("Fetch.requestPaused", (params) => {
    if (params && params.request && /\/study-data\/sections\//.test(params.request.url)) {
      paused.push(params);
      return;
    }
    page.conn.send("Fetch.continueRequest", { requestId: params.requestId }).catch(() => {});
  });
  await CDP(page).send("Fetch.enable", {
    patterns: [{ urlPattern: "*study-data/sections/*", requestStage: "Request" }],
  });
  return { paused, off };
}

async function stopFetch(page, handle) {
  try {
    await CDP(page).send("Fetch.disable");
  } catch {}
  if (handle && handle.off) handle.off();
}

/** Estado H17 tal como se ve (Panel y Biblioteca). */
const H17_JS = `(() => {
  const text = (selector) => {
    const el = document.querySelector(selector);
    return el ? (el.innerText || "").replace(/\\s+/g, " ").trim() : "";
  };
  const stats = window.StudyStore && window.StudyStore.getDashboardStats ? window.StudyStore.getDashboardStats() : null;
  const topics = (window.STUDY_CONTENT && window.STUDY_CONTENT.topics) || [];
  const sheets = (window.STUDY_CONTENT && window.STUDY_CONTENT.sheets) || [];
  const container = topics.filter((topic) => topic.isContainer === true);
  return {
    hash: location.hash,
    body: text("#view-root"),
    hero: text(".dash-hero"),
    heroCopy: text(".dash-hero .hero-copy p"),
    aside: text(".hero-aside"),
    library: text("#view-root"),
    stats: stats
      ? {
          totalTopics: stats.totalTopics,
          totalSheets: stats.totalSheets,
          totalCards: stats.totalCards,
          startedTopics: stats.startedTopics
        }
      : null,
    content: {
      topics: topics.length,
      containers: container.length,
      containerSheets: container.length ? sheets.filter((sheet) => sheet.topicId === container[0].id).length : 0,
      sheets: sheets.length,
      cards: (window.STUDY_CONTENT && window.STUDY_CONTENT.cards || []).length
    }
  };
})()`;

async function h17State(page) {
  return page.eval(H17_JS);
}

function assertH17(state, surface, label) {
  assert(state.stats, `${PENDING}${surface} no expone StudyStore.getDashboardStats().`);
  assertEq(state.stats.totalTopics, 85, `${PENDING}${label}: getDashboardStats().totalTopics debe contar 85 temas no contenedores (H17)`);
  assertEq(state.stats.totalSheets, 210, `${label}: las 210 fichas totales se mantienen`);
  assertEq(state.content.topics, 86, `${label}: el temario declara 86 temas (1 contenedor)`);
  assertEq(state.content.containers, 1, `${label}: debe existir exactamente 1 tema contenedor`);
  assertEq(state.content.containerSheets, 22, `${label}: el contenedor agrupa 22 fichas oficiales`);
  const normalized = normalize(state.body);
  assert(/85\s+temas/.test(normalized), `${PENDING}${label}: el texto visible debe decir «85 temas»; actual: «${state.body.slice(0, 220)}»`);
  assert(/22\s+fichas\s+oficiales/.test(normalized), `${PENDING}${label}: el texto visible debe decir «22 fichas oficiales»; actual: «${state.body.slice(0, 220)}»`);
  assert(!/86\s+modulos/.test(normalized), `${PENDING}${label}: sigue apareciendo «86 módulos»; actual: «${state.body.slice(0, 220)}»`);
  assert(!/86\s+temas/.test(normalized), `${PENDING}${label}: no debe decir «86 temas»; actual: «${state.body.slice(0, 220)}»`);
}

/* ------------------------------------------------------------------ */
/* Suite                                                               */
/* ------------------------------------------------------------------ */

export async function runDashboardFase4({ h, page, baseURL }) {
  h.suite("Study Dashboard · Fase 4");
  h.state.app = "Study Dashboard";

  /* ---------------------------------------------------------------- */
  /* DASH-45 · Arranque sin temario completo; core+loader; sin chunks */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-45",
    "temario-core.js + content-loader.js cargan; no se pide temario.js; metadatos/cards disponibles; Panel/Biblioteca/Progreso no piden chunks",
    async () => {
      await resetViewport(page);
      page.resetErrors();
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1300, { fresh: true });
      await waitApp(page, "dashboard");
      await sleep(350);

      const startup = await page.eval(`(() => {
        const C = window.STUDY_CONTENT;
        const L = window.StudyContent;
        const scripts = Array.from(document.scripts).map((script) => script.getAttribute("src") || "");
        const sheet = window.StudyStore ? window.StudyStore.getSheet(${JSON.stringify(SHEET.same)}) : null;
        const card = window.StudyStore ? window.StudyStore.getCard("card-aps-01-1") : null;
        const stats = window.StudyStore && window.StudyStore.getDashboardStats ? window.StudyStore.getDashboardStats() : null;
        const required = ["id", "topicId", "title", "summary", "minutes", "keyConcepts", "sourceRefs"];
        return {
          hasContent: !!C,
          hasLoader: !!L,
          loader: L
            ? {
                version: L.version || null,
                ensureSheet: typeof L.ensureSheet,
                loadArea: typeof L.loadArea,
                needs: typeof L.needs,
                state: typeof L.state === "function" ? L.state() : null
              }
            : null,
          counts: C
            ? {
                sheets: C.sheets.length,
                cards: C.cards.length,
                sources: C.sources.length,
                topics: C.topics.length,
                areas: C.areas.length,
                withSections: C.sheets.filter((item) => Array.isArray(item.sections)).length,
                metadataOk: C.sheets.every((item) => required.every((key) => item[key] !== undefined)),
                cardsOk: C.cards.every((item) => item.id && item.sheetId && item.prompt &&
                  (item.type === "concept"
                    ? !!item.answer
                    : Array.isArray(item.options) && Number.isInteger(item.correctIndex) && item.options.length > 1)),
                cardsPerSheet: C.sheets.reduce((total, item) => total + C.cards.filter((cardItem) => cardItem.sheetId === item.id).length, 0)
              }
            : null,
          stats: stats ? { totalSheets: stats.totalSheets, totalCards: stats.totalCards, totalTopics: stats.totalTopics } : null,
          store: {
            ready: !!(window.StudyStore && window.StudyStore.isReady && window.StudyStore.isReady()),
            sheetTitle: sheet ? sheet.title : null,
            sheetHasSections: !!(sheet && Array.isArray(sheet.sections)),
            cardPrompt: card ? card.prompt : null
          },
          scripts: {
            core: scripts.some((src) => src.includes("temario-core.js")),
            loader: scripts.some((src) => src.includes("content-loader.js")),
            full: scripts.some((src) => /\\/study-data\\/temario\\.js(?:[?#]|$)/.test(src))
          }
        };
      })()`);

      assert(startup.hasContent, `${PENDING}index.html no carga study-data/temario-core.js (window.STUDY_CONTENT ausente).`);
      assert(startup.hasLoader, `${PENDING}index.html no carga study-data/content-loader.js (window.StudyContent ausente).`);
      assertEq(startup.loader.ensureSheet, "function", `${PENDING}StudyContent.ensureSheet no es una función.`);
      assertEq(startup.loader.loadArea, "function", `${PENDING}StudyContent.loadArea no es una función.`);
      assertEq(startup.loader.needs, "function", `${PENDING}StudyContent.needs no es una función.`);
      assertEq(startup.counts.sheets, 210, "fichas en temario-core.js");
      assertEq(startup.counts.cards, 630, "tarjetas en temario-core.js");
      assertEq(startup.counts.sources, 48, "fuentes en temario-core.js");
      assertEq(startup.counts.topics, 86, "temas en temario-core.js");
      assertEq(startup.counts.withSections, 0, `${PENDING}el core no debe incluir sections (H4)`);
      assert(startup.counts.metadataOk, "todas las fichas del core conservan sus metadatos");
      assert(startup.counts.cardsOk, "todas las tarjetas del core conservan id/sheetId/prompt/answer");
      assertEq(startup.counts.cardsPerSheet, 630, "las 630 tarjetas están enlazadas a fichas");
      assertEq(startup.stats.totalSheets, 210, "StudyStore ve 210 fichas");
      assertEq(startup.stats.totalCards, 630, "StudyStore ve 630 tarjetas");
      assert(startup.store.ready, "StudyStore inicializado");
      assert(startup.store.sheetTitle, `${PENDING}StudyStore.getSheet(sheet-aps-01) no devuelve metadatos.`);
      assertEq(startup.store.sheetHasSections, false, "la ficha del core no tiene secciones al arrancar");
      assert(startup.store.cardPrompt, "StudyStore.getCard devuelve la tarjeta real");
      assert(startup.scripts.core, `${PENDING}index.html no enlaza temario-core.js.`);
      assert(startup.scripts.loader, `${PENDING}index.html no enlaza content-loader.js.`);
      assertEq(startup.scripts.full, false, `${PENDING}index.html sigue enlazando temario.js (H4).`);
      assertEq(startup.loader.state.loadedAreas.length, 0, "content-loader no debe cargar áreas al arrancar");

      const startupResources = await resources(page);
      assertEq(startupResources.full.length, 0, `${PENDING}se pidió temario.js al arrancar: ${startupResources.full.map((item) => item.url).join(", ")}`);
      assertEq(startupResources.loadedChunks.length, 0, `${PENDING}se pidieron chunks de secciones al arrancar: ${startupResources.loadedChunks.map((item) => item.url).join(", ")}`);
      assert(startupResources.core.length >= 1, "temario-core.js se descarga una sola vez");
      assertEq(startupResources.core.length, 1, "temario-core.js no debe duplicar la petición");
      assertEq(startupResources.loader.length, 1, "content-loader.js no debe duplicar la petición");

      const routes = [];
      for (const hash of ["#/biblioteca", "#/progreso", "#/"]) {
        await page.eval(`location.hash = ${JSON.stringify(hash)}, true`);
        await page.waitFor(`location.hash === ${JSON.stringify(hash)}`, { timeout: 8000, message: `hash ${hash}` });
        await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
        await sleep(260);
        const state = await page.eval(`(() => ({
          hash: location.hash,
          title: document.title,
          text: (document.getElementById("view-root").innerText || "").trim().length,
          contentState: window.StudyContent && window.StudyContent.state ? window.StudyContent.state() : null
        }))()`);
        const routeResources = await resources(page);
        assert(state.text > 20, `la ruta ${hash} debe renderizar contenido`);
        assertEq(routeResources.full.length, 0, `${PENDING}${hash} pidió temario.js.`);
        assertEq(routeResources.loadedChunks.length, 0, `${PENDING}${hash} pidió chunks de secciones: ${routeResources.loadedChunks.map((item) => item.url).join(", ")}`);
        assertEq(state.contentState.loadedAreas.length, 0, `${hash} no debe cargar áreas de lectura`);
        routes.push({ hash, title: state.title, resources: { full: routeResources.full.length, chunks: routeResources.loadedChunks.length } });
      }

      const errors = await page.errorsSummary();
      const shot = await h.shot(page, "fase4-dash45-panel");
      return {
        startup,
        startupResources: {
          core: startupResources.core,
          loader: startupResources.loader,
          full: startupResources.full,
          chunks: startupResources.loadedChunks,
        },
        routes,
        errors: { exceptions: errors.exceptions.length, consoleErrors: errors.consoleErrors.length },
        shot,
      };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-46 · Ficha directa: loading, error, Reintentar, lector      */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-46",
    "Ficha directa con chunk bloqueado: loading accesible, error con Reintentar, liberación y lector; misma área no repite chunk; no se pide el temario completo",
    async () => {
      await resetViewport(page);
      page.resetErrors();
      const title = await expectedTitle(page, SHEET.same);
      assert(title, `${PENDING}no se pudo leer el título de ${SHEET.same} desde el core.`);

      let handle = await fetchIntercept(page);
      let loadingShot = null;
      let errorShot = null;
      try {
        await openDocument(page, appURL(baseURL, "dashboard") + "#/ficha/" + SHEET.same, 450, { fresh: true, wait: "none" });
        const loading = await waitGate(page, "loading", 20000);
        assert(loading.loading && loading.loading.visible, `${PENDING}la ficha directa no muestra estado de carga visible mientras el chunk está pendiente.`);
        assertEq(loading.loading.role, "status", `${PENDING}el estado de carga debe ser role="status" (accesible).`);
        assertEq(loading.loading.busy, "true", `${PENDING}el estado de carga debe marcar aria-busy="true".`);
        assertIncludes(normalize(loading.loading.text), "cargando", "texto del estado de carga");
        assertEq(loading.reader.main, false, "el lector no debe montarse durante la carga");
        assertEq(loading.reader.present, false, "article.reader no debe existir durante la carga");
        assertEq(loading.reader.sections, 0, "no debe haber secciones renderizadas durante la carga");
        assertEq(handle.paused.length, 1, `debe existir una petición de chunk pendiente (recibidas: ${handle.paused.length})`);
        assert(handle.paused[0].request.url.includes(AREA.cuidado), `el chunk pedido debe ser el del área de la ficha (${handle.paused[0].request.url})`);
        assertEq(loading.chunkRequests.length, 0, "el chunk pendiente no debe aparecer como cargado");
        const loadingResources = await resources(page);
        assertEq(loadingResources.full.length, 0, `${PENDING}se pidió temario.js al abrir la ficha`);
        loadingShot = await h.shot(page, "fase4-dash46-loading");

        await CDP(page).send("Fetch.failRequest", { requestId: handle.paused[0].requestId, errorReason: "Failed" });
        const error = await waitGate(page, "error", 15000);
        assert(error.error && error.error.visible, `${PENDING}el fallo del chunk no muestra error visible.`);
        assertEq(error.error.role, "alert", `${PENDING}el error debe ser role="alert".`);
        assert(error.error.retry, `${PENDING}el error no ofrece botón de reintento.`);
        assert(/reintentar/i.test(normalize(error.error.retry.label)), `el botón debe decir «Reintentar»; actual: «${error.error.retry.label}»`);
        assertEq(error.reader.main, false, "el lector no debe montarse con el chunk fallido");
        assertEq(error.reader.sections, 0, "no debe haber lector vacío tras el error");
        errorShot = await h.shot(page, "fase4-dash46-error");
      } finally {
        await stopFetch(page, handle);
      }

      /* Liberado el chunk: Reintentar debe recuperar el lector real. */
      const retryVisible = await page.eval(`(() => {
        const btn = document.querySelector(${JSON.stringify(RETRY_SELECTORS[0])});
        if (!btn) return false;
        const rect = btn.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1;
      })()`);
      assert(retryVisible, `${PENDING}no hay botón [data-action="sheet-retry"] visible tras el error.`);
      await page.click(RETRY_SELECTORS[0]);
      const reader = await waitReader(page, { h1: title, timeout: 20000 });
      assert(reader.reader.main, `${PENDING}tras Reintentar no se monta .reader-main.`);
      assert(reader.reader.sections >= 1, `${PENDING}tras Reintentar no se renderizan secciones.`);
      assertEq(reader.reader.sheetId, SHEET.same, "el lector abre la ficha pedida");
      assertEq(reader.reader.h1, title, "el lector muestra el título real de la ficha");
      assert(reader.reader.paragraphs >= 1, "el lector muestra párrafos reales");
      assert(reader.contentState, "StudyContent expone su estado");
      assertEq(reader.contentState.errorAreas.length, 0, "el área queda sin error tras el reintento");
      assert(reader.contentState.loadedAreas.includes(AREA.cuidado), `el área ${AREA.cuidado} queda cargada`);

      const loadedResources = await resources(page);
      assertEq(loadedResources.full.length, 0, `${PENDING}el reintento pidió temario.js`);
      assertEq(loadedResources.loadedChunks.length, 1, `el reintento debe cargar exactamente un chunk (${loadedResources.loadedChunks.map((item) => item.url).join(", ")})`);
      assert(loadedResources.loadedChunks[0].url.includes(AREA.cuidado), "el chunk cargado corresponde al área de la ficha");
      assert(loadedResources.loadedChunks[0].decoded > 1000, "el chunk descargado tiene contenido real");

      /* El lector debe funcionar: párrafo con acción de lectura activa. */
      assert(reader.reader.paragraphAction, `${PENDING}el lector no monta la acción [data-ac-action="paragraph:open"].`);
      await page.click('[data-ac-action="paragraph:open"]');
      await page.waitFor(`!!document.querySelector(".ac-selbar")`, { timeout: 6000, message: "barra de selección del lector" });
      const selectionBar = await page.eval(`(() => {
        const bar = document.querySelector(".ac-selbar");
        return bar ? { text: (bar.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 80), visible: bar.getBoundingClientRect().height > 1 } : null;
      })()`);
      assert(selectionBar && selectionBar.visible, "la barra de selección del lector es visible");
      await page.eval(`(() => {
        const cancel = document.querySelector('[data-ac-action="selection:cancel"], [data-ac-action="selection:close"]');
        if (cancel) cancel.click();
        return true;
      })()`);
      await sleep(250);

      /* Misma área: la segunda ficha no repite el chunk. */
      const title2 = await expectedTitle(page, SHEET.same2);
      await page.eval(`location.hash = ${JSON.stringify("#/ficha/" + SHEET.same2)}, true`);
      const same = await waitReader(page, { h1: title2, timeout: 12000 });
      const sameResources = await resources(page);
      assertEq(same.reader.sheetId, SHEET.same2, "navegación a la segunda ficha de la misma área");
      assertEq(sameResources.loadedChunks.length, 1, `${PENDING}una ficha de la misma área repitió el chunk: ${sameResources.loadedChunks.map((item) => item.url).join(", ")}`);
      assertEq(same.contentState.loadedAreas.length, 1, "solo hay un área cargada tras dos fichas de la misma área");
      assertEq(same.chunkRequests.length, loadedResources.chunks.length, "la navegación dentro del área no añade ninguna petición de chunk");
      const sameShot = await h.shot(page, "fase4-dash46-misma-area");

      /* Área distinta: pide su propio chunk, nunca el temario completo. */
      const titleOther = await expectedTitle(page, SHEET.other);
      await page.eval(`location.hash = ${JSON.stringify("#/ficha/" + SHEET.other)}, true`);
      const other = await waitReader(page, { h1: titleOther, timeout: 20000 });
      const otherResources = await resources(page);
      assertEq(other.reader.sheetId, SHEET.other, "navegación a una ficha de otra área");
      assertEq(otherResources.loadedChunks.length, 2, `la ficha de otra área debe pedir su chunk (${otherResources.loadedChunks.map((item) => item.url).join(", ")})`);
      assert(other.contentState.loadedAreas.includes(AREA.cuidado), "el área anterior sigue cargada");
      assert(other.contentState.loadedAreas.includes(AREA.salud), "el área nueva queda cargada");
      assertEq(otherResources.full.length, 0, `${PENDING}se pidió temario.js al navegar entre áreas`);

      /* Cancelación: una respuesta vieja no debe pintar la ficha anterior. */
      handle = await fetchIntercept(page);
      try {
        await page.eval(`location.hash = ${JSON.stringify("#/ficha/" + SHEET.cancel)}, true`);
        const cancelLoading = await waitGate(page, "loading", 15000);
        assert(cancelLoading.loading, `${PENDING}la ficha de otra área no muestra carga al pedir su chunk.`);
        assertEq(handle.paused.length, 1, "debe quedar una petición pendiente para la ficha cancelada");
        await page.eval(`location.hash = "#/", true`);
        await page.waitFor(`!!document.querySelector(".dash-hero")`, { timeout: 8000, message: "panel tras cancelar la ficha" });
        await CDP(page).send("Fetch.continueRequest", { requestId: handle.paused[0].requestId });
        await sleep(900);
        const canceled = await page.eval(`(() => ({
          hash: location.hash,
          hero: !!document.querySelector(".dash-hero"),
          gate: !!document.querySelector(".sheet-gate"),
          reader: !!document.querySelector("article.reader"),
          title: document.title
        }))()`);
        assertEq(canceled.hash, "#/", "la ruta sigue siendo el panel");
        assertEq(canceled.hero, true, "el panel sigue renderizado");
        assertEq(canceled.gate, false, "la respuesta vieja no deja un estado de carga en el panel");
        assertEq(canceled.reader, false, "la respuesta vieja no monta el lector de la ficha anterior");
      } finally {
        await stopFetch(page, handle);
      }

      return {
        title,
        loading: { role: "status", busy: true, text: "Cargando ficha", paused: true },
        error: { role: "alert", retry: true },
        reader: {
          sections: reader.reader.sections,
          paragraphs: reader.reader.paragraphs,
          paragraphAction: true,
          chunk: loadedResources.loadedChunks[0].url,
        },
        sameArea: { chunkRequests: sameResources.loadedChunks.length, loadedAreas: same.contentState.loadedAreas },
        otherArea: { chunks: otherResources.loadedChunks.length, loadedAreas: other.contentState.loadedAreas },
        cancellation: true,
        fullTemarioRequests: otherResources.full.length,
        shots: { loadingShot, errorShot, sameShot },
      };
    },
    { severity: "alta", page, timeout: 180000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-47 · H17 · Conteo editorial 85 temas + 22 fichas oficiales  */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-47",
    "H17: «85 temas + 22 fichas oficiales» visible, sin «86 módulos», 210 fichas y 630 tarjetas conservadas",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      await sleep(300);
      const panel = await h17State(page);
      assertH17(panel, "Panel", "Panel");
      assert(panel.hero && panel.heroCopy, "el hero del Panel debe estar renderizado");
      assert(!/\b86\b/.test(panel.aside), `${PENDING}el aside del Panel sigue mostrando 86 («${panel.aside}»)`);
      const panelShot = await h.shot(page, "fase4-h17-panel");

      await page.eval(`location.hash = "#/biblioteca", true`);
      await page.waitFor(`location.hash === "#/biblioteca"`, { timeout: 8000 });
      await page.eval(`new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
      await sleep(350);
      const library = await h17State(page);
      assertEq(library.hash, "#/biblioteca", "la Biblioteca está abierta");
      assertH17(library, "Biblioteca", "Biblioteca");
      const libraryShot = await h.shot(page, "fase4-h17-biblioteca");

      /* 210 fichas y 630 tarjetas siguen siendo el total real. */
      assertEq(library.content.sheets, 210, "las 210 fichas totales se mantienen");
      assertEq(library.content.cards, 630, "las 630 tarjetas se mantienen");
      assertEq(library.stats.totalSheets, 210, "getDashboardStats().totalSheets sigue siendo 210");
      assertEq(library.stats.totalCards, 630, "getDashboardStats().totalCards sigue siendo 630");

      return {
        panel: { hero: panel.heroCopy, aside: panel.aside, stats: panel.stats },
        library: { stats: library.stats, text: library.body.slice(0, 280) },
        content: library.content,
        shots: { panelShot, libraryShot },
      };
    },
    { severity: "alta", page, timeout: 90000 },
  );

  /* ---------------------------------------------------------------- */
  /* DASH-48 · Cero pérdida: exportar/importar estado v2              */
  /* ---------------------------------------------------------------- */
  await h.test(
    "DASH-48",
    "Cero pérdida: exportar/importar un estado v2 conserva progreso, subrayados, dudas, plan, tarjetas y snapshot; cards/flashSession intactos",
    async () => {
      await resetViewport(page);
      await openDocument(page, appURL(baseURL, "dashboard") + "#/", 1100, { fresh: true });
      await waitApp(page, "dashboard");
      await sleep(300);

      const seeded = await page.eval(`(() => {
        const store = window.StudyStore;
        if (!store) return { ok: false, reason: "StudyStore ausente" };
        const canon = (value) => {
          if (Array.isArray(value)) return value.map(canon);
          if (value && typeof value === "object") {
            const out = {};
            Object.keys(value).sort().forEach((key) => { out[key] = canon(value[key]); });
            return out;
          }
          return value;
        };
        window.__qaFase4Canon = canon;
        store.clearAllProgress({ confirm: true });
        store.recordSheetView(${JSON.stringify(SHEET.same)}, "topic-aps-atributos");
        store.toggleSheetComplete(${JSON.stringify(SHEET.same)});
        store.toggleFavorite(${JSON.stringify(SHEET.same)});
        store.setSheetScroll(${JSON.stringify(SHEET.same)}, 0.42);
        store.setDailyGoal(3);
        store.recordReview("card-aps-01-2", "good");
        const ann1 = store.annotations.add({
          sheetId: ${JSON.stringify(SHEET.same)},
          sectionIndex: 0,
          sectionTitle: "De la enfermedad a la persona",
          paragraphIndex: 0,
          color: "important",
          quote: "La atención primaria es la puerta de entrada y el eje organizador del sistema.",
          prefix: "La atención primaria",
          suffix: "eje organizador",
          note: "Nota de QA que debe sobrevivir a la importación."
        });
        const ann2 = store.annotations.add({
          sheetId: ${JSON.stringify(SHEET.same2)},
          sectionIndex: 0,
          sectionTitle: "Accesibilidad y longitudinalidad",
          paragraphIndex: 0,
          color: "doubt",
          quote: "Entrar y permanecer son dos caras de la misma longitudinalidad.",
          prefix: "",
          suffix: "",
          note: ""
        });
        store.doubts.add({
          sheetId: ${JSON.stringify(SHEET.same2)},
          sectionIndex: 0,
          paragraphIndex: 0,
          quote: "Entrar y permanecer son dos caras de la misma longitudinalidad.",
          note: "Duda de QA que también debe conservarse.",
          annotationId: ann2 ? ann2.id : null
        });
        store.sheetConfidence.set(${JSON.stringify(SHEET.same)}, "partial");
        store.sheetReview.save({
          sheetId: ${JSON.stringify(SHEET.same)},
          dueAt: new Date(Date.now() - 86400000).toISOString(),
          intervalDays: 2,
          lastReviewedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          source: "confidence"
        });
        store.recall.add({
          sheetId: ${JSON.stringify(SHEET.same)},
          cardId: "card-aps-01-1",
          sectionIndex: 0,
          question: "¿Cómo se organiza la APS?",
          answer: "Como puerta de entrada y eje organizador del sistema.",
          rating: "good"
        });
        store.userCards.add({
          sheetId: ${JSON.stringify(SHEET.same)},
          front: "Frente propio de QA",
          back: "Reverso propio de QA",
          source: "annotation",
          annotationId: ann1 ? ann1.id : null
        });
        store.plan.save({
          examDate: "2026-12-15",
          minutesPerDay: 45,
          daysPerWeek: 6,
          areaPriority: { ${JSON.stringify(AREA.cuidado)}: 2, ${JSON.stringify(AREA.salud)}: 1 }
        });
        store.factsKnown.set("fact-qa-fase4", true);
        store.startSession("free", ${JSON.stringify(SHEET.same)}, ["card-aps-01-1", "card-aps-01-2"]);
        store.recordSessionAnswer("card-aps-01-1", { correct: true, rating: "good" });
        const state = store.getState();
        const envelope = store.exportProgress();
        const preview = store.previewImport(envelope);
        window.__qaFase4 = {
          envelope,
          cards: JSON.stringify(canon(state.cards || {})),
          flashSession: JSON.stringify(canon(state.flashSession || null)),
          snapshotRaw: localStorage.getItem(${JSON.stringify(SNAPSHOT_KEY)})
        };
        const stats = store.getDashboardStats();
        return {
          ok: true,
          counts: {
            annotations: store.annotations.list().length,
            doubts: store.doubts.list().length,
            userCards: store.userCards.list().length,
            recall: store.recall.list().length,
            cards: Object.keys(state.cards || {}).length,
            flash: !!state.flashSession
          },
          stats: { completed: stats.completedSheets, viewed: stats.viewedSheets, totalSheets: stats.totalSheets },
          cards: window.__qaFase4.cards,
          flashSession: window.__qaFase4.flashSession,
          exportInfo: {
            format: envelope.format,
            schema: envelope.schema,
            app: envelope.app,
            appVersion: envelope.appVersion,
            contentVersion: envelope.contentVersion,
            stateVersion: envelope.state && envelope.state.version,
            stateSchema: envelope.state && envelope.state.schemaVersion
          },
          preview: {
            ok: preview.ok,
            errors: preview.errors,
            summary: preview.summary
          },
          snapshot: JSON.parse(window.__qaFase4.snapshotRaw || "null"),
          snapshotKeys: window.__qaFase4.snapshotRaw ? Object.keys(JSON.parse(window.__qaFase4.snapshotRaw)) : []
        };
      })()`);
      assert(seeded.ok, `${PENDING}no se pudo sembrar el estado v2: ${seeded.reason || "error"}`);
      assertEq(seeded.counts.annotations, 2, "dos subrayados sembrados");
      assertEq(seeded.counts.doubts, 1, "una duda sembrada");
      assertEq(seeded.counts.userCards, 1, "una tarjeta propia sembrada");
      assertEq(seeded.counts.recall, 1, "una pausa de recuerdo sembrada");
      assertEq(seeded.counts.cards, 2, "dos cajas de tarjeta sembradas");
      assertEq(seeded.counts.flash, true, "sesión de flashcards sembrada");
      assertEq(seeded.stats.completed, 1, "una ficha completada antes de exportar");
      assertEq(seeded.exportInfo.format, "serums-study-progress", "formato del sobre exportado");
      assertEq(seeded.exportInfo.schema, 2, "esquema 2 en el sobre exportado");
      assertEq(seeded.exportInfo.stateVersion, 2, "estado v2 exportado");
      assertEq(seeded.exportInfo.stateSchema, 2, "schemaVersion 2 exportado");
      assert(seeded.preview.ok, `previewImport acepta el estado exportado (${(seeded.preview.errors || []).join(", ")})`);
      assert(seeded.preview.summary && seeded.preview.summary.annotations === 2, "previewImport cuenta los subrayados");
      assert(seeded.preview.summary && seeded.preview.summary.doubts === 1, "previewImport cuenta las dudas");
      assert(seeded.preview.summary && seeded.preview.summary.userCards === 1, "previewImport cuenta las tarjetas propias");
      assert(seeded.preview.summary && seeded.preview.summary.hasPlan === true, "previewImport detecta el plan");
      assert(seeded.snapshot, "existe studyhub:snapshot:v1 antes de exportar");
      assertEq(seeded.snapshot.version, 1, "el snapshot conserva version 1");
      assertEq(seeded.snapshot.dashboard.completedSheets, 1, "el snapshot refleja la ficha completada");

      const imported = await page.eval(`(() => {
        const store = window.StudyStore;
        const packed = window.__qaFase4;
        const clear = store.clearAllProgress({ confirm: true });
        const clearedState = store.getState();
        const cleared = {
          completed: store.getDashboardStats().completedSheets,
          annotations: store.annotations.list().length,
          doubts: store.doubts.list().length,
          userCards: store.userCards.list().length,
          recall: store.recall.list().length,
          plan: store.plan.get(),
          cards: Object.keys(clearedState.cards || {}).length,
          flash: !!clearedState.flashSession
        };
        const result = store.importProgress(packed.envelope, { mode: "replace", confirmReplace: true });
        const state = store.getState();
        const snapshotRaw = localStorage.getItem(${JSON.stringify(SNAPSHOT_KEY)});
        const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : null;
        const stats = store.getDashboardStats();
        const annotations = store.annotations.list({ includeDeleted: true }).map((item) => ({
          id: item.id, sheetId: item.sheetId, quote: item.quote, note: item.note,
          color: item.color, sectionTitle: item.sectionTitle, deleted: item.deleted
        }));
        const doubts = store.doubts.list({ includeDeleted: true }).map((item) => ({
          id: item.id, sheetId: item.sheetId, quote: item.quote, note: item.note,
          resolvedAt: item.resolvedAt, annotationId: item.annotationId
        }));
        const userCards = store.userCards.list().map((item) => ({
          front: item.front, back: item.back, source: item.source, annotationId: item.annotationId
        }));
        const recall = store.recall.list().map((item) => ({
          sheetId: item.sheetId, cardId: item.cardId, question: item.question, answer: item.answer, rating: item.rating
        }));
        const plan = store.plan.get();
        const review = store.sheetReview.get(${JSON.stringify(SHEET.same)});
        const confidence = store.sheetConfidence.get(${JSON.stringify(SHEET.same)});
        const sheetState = store.getSheetState(${JSON.stringify(SHEET.same)}) || {};
        const canon = window.__qaFase4Canon || ((value) => value);
        const cards = JSON.stringify(canon(state.cards || {}));
        const flashSession = JSON.stringify(canon(state.flashSession || null));
        return {
          clearOk: clear && clear.ok === true,
          safetyCopy: clear && clear.safetyCopy === true,
          cleared,
          result: { ok: result.ok, mode: result.mode, safetyCopy: result.safetyCopy, errors: result.errors, warnings: result.warnings },
          stats: {
            completed: stats.completedSheets,
            viewed: stats.viewedSheets,
            totalSheets: stats.totalSheets,
            totalCards: stats.totalCards,
            totalTopics: stats.totalTopics
          },
          annotations, doubts, userCards, recall,
          plan: plan ? { examDate: plan.examDate, minutesPerDay: plan.minutesPerDay, daysPerWeek: plan.daysPerWeek, areaPriority: plan.areaPriority, deleted: plan.deleted } : null,
          review: review ? { dueAt: review.dueAt, intervalDays: review.intervalDays, source: review.source } : null,
          confidence: confidence ? confidence.value : null,
          facts: store.factsKnown.listKnown(),
          sheetState: { favorite: !!sheetState.favorite, scroll: sheetState.scroll, completedAt: sheetState.completedAt },
          cards,
          flashSession,
          cardsUnchanged: cards === packed.cards,
          flashUnchanged: flashSession === packed.flashSession,
          schema: { version: state.version, schemaVersion: state.schemaVersion },
          collections: ["annotations", "doubts", "sheetConfidence", "sheetReview", "recall", "userCards", "plan", "weekly", "factsKnown"].filter((key) => key in state),
          storageKeys: Object.keys(localStorage).sort(),
          snapshot: snapshot,
          snapshotKeys: snapshot ? Object.keys(snapshot) : [],
          snapshotDashboardKeys: snapshot && snapshot.dashboard ? Object.keys(snapshot.dashboard) : [],
          snapshotFlashcardsKeys: snapshot && snapshot.flashcards ? Object.keys(snapshot.flashcards) : []
        };
      })()`);

      assertEq(imported.clearOk, true, "el borrado previo a la importación se completó");
      assertEq(imported.cleared.completed, 0, "el borrado deja 0 fichas completadas");
      assertEq(imported.cleared.annotations, 0, "el borrado deja 0 subrayados");
      assertEq(imported.cleared.doubts, 0, "el borrado deja 0 dudas");
      assertEq(imported.cleared.userCards, 0, "el borrado deja 0 tarjetas propias");
      assertEq(imported.cleared.recall, 0, "el borrado deja 0 pausas");
      assertEq(imported.cleared.plan, null, "el borrado deja el plan vacío");
      assertEq(imported.cleared.cards, 0, "el borrado deja 0 cajas de tarjeta");
      assertEq(imported.cleared.flash, false, "el borrado deja la sesión de flashcards vacía");

      assertEq(imported.result.ok, true, `la importación debe aceptar el estado v2 (${(imported.result.errors || []).join(", ")})`);
      assertEq(imported.result.mode, "replace", "la importación de la prueba usa modo replace");
      assertEq(imported.result.safetyCopy, true, "la importación guarda copia de seguridad previa");
      assertEq(imported.schema.version, 2, "el estado importado sigue siendo v2");
      assertEq(imported.schema.schemaVersion, 2, "schemaVersion se conserva en 2");
      for (const key of ["annotations", "doubts", "sheetConfidence", "sheetReview", "recall", "userCards", "plan", "weekly", "factsKnown"]) {
        assert(imported.collections.includes(key), `el estado importado conserva la colección ${key}`);
      }
      assertEq(imported.stats.completed, 1, "la ficha completada se conserva tras importar");
      assertEq(imported.stats.viewed, 1, "la ficha vista se conserva tras importar");
      assertEq(imported.stats.totalSheets, 210, "las 210 fichas siguen disponibles");
      assertEq(imported.stats.totalCards, 630, "las 630 tarjetas siguen disponibles");
      assertEq(imported.sheetState.favorite, true, "la ficha favorita se conserva");
      assert(Math.abs(Number(imported.sheetState.scroll) - 0.42) < 0.001, `el scroll de la ficha se conserva (${imported.sheetState.scroll})`);
      assert(imported.sheetState.completedAt, "la fecha de completado se conserva");

      assertEq(imported.annotations.length, 2, "los dos subrayados se conservan");
      const important = imported.annotations.find((item) => item.color === "important");
      const doubtMark = imported.annotations.find((item) => item.color === "doubt");
      assert(important && doubtMark, "se conservan los dos colores de subrayado");
      assertIncludes(important.note, "Nota de QA", "nota del subrayado importante");
      assertIncludes(important.quote, "puerta de entrada", "cita del subrayado importante");
      assertEq(important.deleted, false, "el subrayado no queda como borrado");
      assertEq(important.sheetId, SHEET.same, "el subrayado conserva su ficha");
      assertEq(important.sectionTitle, "De la enfermedad a la persona", "el subrayado conserva el título de sección");
      assertEq(doubtMark.sheetId, SHEET.same2, "el subrayado de duda conserva su ficha");

      assertEq(imported.doubts.length, 1, "la duda se conserva");
      assertIncludes(imported.doubts[0].note, "Duda de QA", "nota de la duda");
      assertEq(imported.doubts[0].sheetId, SHEET.same2, "ficha de la duda");
      assertEq(imported.doubts[0].annotationId, doubtMark.id, "la duda sigue enlazada a su subrayado");

      assertEq(imported.userCards.length, 1, "la tarjeta propia se conserva");
      assertEq(imported.userCards[0].front, "Frente propio de QA", "frente de la tarjeta propia");
      assertEq(imported.userCards[0].back, "Reverso propio de QA", "reverso de la tarjeta propia");
      assertEq(imported.userCards[0].source, "annotation", "origen de la tarjeta propia");
      assertEq(imported.userCards[0].annotationId, important.id, "la tarjeta propia sigue enlazada a la anotación");

      assertEq(imported.recall.length, 1, "la pausa de recuerdo se conserva");
      assertEq(imported.recall[0].rating, "good", "la autoevaluación de la pausa se conserva");
      assertEq(imported.recall[0].cardId, "card-aps-01-1", "la pausa conserva su tarjeta");
      assert(imported.plan, "el plan se conserva tras importar");
      assertEq(imported.plan.examDate, "2026-12-15", "fecha de examen del plan");
      assertEq(imported.plan.minutesPerDay, 45, "minutos diarios del plan");
      assertEq(imported.plan.daysPerWeek, 6, "días por semana del plan");
      assertEq(imported.plan.areaPriority[AREA.cuidado], 2, "prioridad del área en el plan");
      assertEq(imported.review.intervalDays, 2, "el repaso espaciado se conserva");
      assertEq(imported.review.source, "confidence", "origen del repaso espaciado");
      assertEq(imported.confidence, "partial", "la confianza de la ficha se conserva");
      assertEq(imported.facts.includes("fact-qa-fase4"), true, "los datos marcados se conservan");

      assertEq(imported.cardsUnchanged, true, "las cajas de tarjetas (cards) quedan intactas");
      assertEq(imported.flashUnchanged, true, "flashSession queda intacta");
      assertEq(imported.cards, seeded.cards, "cards coincide byte a byte con el estado exportado");
      assertEq(imported.flashSession, seeded.flashSession, "flashSession coincide byte a byte con el estado exportado");

      assertEq(imported.snapshotKeys.join(","), "version,contentVersion,updatedAt,hasActivity,dashboard,flashcards", "el snapshot conserva su formato v1");
      assertEq(imported.snapshot.version, 1, "el snapshot importado conserva version 1");
      assertEq(imported.snapshot.contentVersion, "2.5.0", "el snapshot conserva contentVersion");
      assertEq(imported.snapshot.dashboard.totalSheets, 210, "el snapshot conserva totalSheets");
      assertEq(imported.snapshot.dashboard.completedSheets, 1, "el snapshot refleja la ficha completada tras importar");
      assertEq(imported.snapshot.flashcards.totalCards, 630, "el snapshot conserva totalCards");
      assert(imported.snapshotDashboardKeys.includes("last"), "el snapshot conserva dashboard.last");
      assert(imported.snapshotFlashcardsKeys.includes("last"), "el snapshot conserva flashcards.last");
      const snapshotKeys = seeded.snapshotKeys.slice().sort();
      assertEq(imported.snapshotKeys.slice().sort().join(","), snapshotKeys.join(","), "el snapshot conserva las mismas claves que antes");
      assert(imported.storageKeys.includes(STATE_KEY), `se conserva la clave ${STATE_KEY}`);
      assert(imported.storageKeys.includes(SNAPSHOT_KEY), `se conserva la clave ${SNAPSHOT_KEY}`);
      assert(imported.storageKeys.includes("study-backup-preimport-v1"), "la importación deja la copia previa documentada");

      const shot = await h.shot(page, "fase4-cero-perdida");
      return {
        seeded: { counts: seeded.counts, stats: seeded.stats, exportInfo: seeded.exportInfo, preview: seeded.preview },
        cleared: imported.cleared,
        import: imported.result,
        restored: {
          stats: imported.stats,
          annotations: imported.annotations.length,
          doubts: imported.doubts.length,
          userCards: imported.userCards.length,
          recall: imported.recall.length,
          plan: imported.plan,
          confidence: imported.confidence,
          review: imported.review,
          favorite: imported.sheetState.favorite,
          scroll: imported.sheetState.scroll,
          facts: imported.facts,
          cardsUnchanged: imported.cardsUnchanged,
          flashUnchanged: imported.flashUnchanged,
        },
        snapshot: {
          version: imported.snapshot.version,
          keys: imported.snapshotKeys,
          completedSheets: imported.snapshot.dashboard.completedSheets,
          totalCards: imported.snapshot.flashcards.totalCards,
        },
        shot,
      };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* F4-FLASH · Flashcards usa core (cards/metadatos), no chunks       */
  /* ---------------------------------------------------------------- */
  await h.test(
    "F4-FLASH",
    "Study Flashcards carga temario-core.js (630 tarjetas), no pide chunks ni el temario completo; mazos y sesión siguen operativos",
    async () => {
      await resetViewport(page);
      page.resetErrors();
      await openDocument(page, appURL(baseURL, "flashcards") + "#/", 1300, { fresh: true });
      await waitApp(page, "flashcards");
      await page.waitFor(`document.querySelectorAll("details.lib-area").length > 0`, {
        timeout: 12000,
        message: "áreas de la biblioteca de Flashcards",
      }).catch(() => {});
      await sleep(300);
      const source = await page.eval(`(() => {
        const C = window.STUDY_CONTENT;
        const scripts = Array.from(document.scripts).map((script) => script.getAttribute("src") || "");
        const stats = window.StudyStore && window.StudyStore.getDashboardStats ? window.StudyStore.getDashboardStats() : null;
        return {
          hasContent: !!C,
          hasLoader: typeof window.StudyContent !== "undefined",
          counts: C ? { sheets: C.sheets.length, cards: C.cards.length, topics: C.topics.length } : null,
          stats: stats ? { totalCards: stats.totalCards, totalSheets: stats.totalSheets } : null,
          scripts: {
            core: scripts.some((src) => src.includes("temario-core.js")),
            loader: scripts.some((src) => src.includes("content-loader.js")),
            full: scripts.some((src) => /\\/study-data\\/temario\\.js(?:[?#]|$)/.test(src))
          },
          decks: document.querySelectorAll(".deck-row, a[href^='#/mazo/']").length,
          areas: document.querySelectorAll("details.lib-area").length,
          text630: /630/.test(document.body.innerText)
        };
      })()`);
      assert(source.hasContent, `${PENDING}Study Flashcards no carga temario-core.js.`);
      assertEq(source.counts.sheets, 210, "Flashcards ve las 210 fichas");
      assertEq(source.counts.cards, 630, "Flashcards ve las 630 tarjetas");
      assertEq(source.stats.totalCards, 630, "getDashboardStats().totalCards en Flashcards");
      assert(source.scripts.core, `${PENDING}Study Flashcards no enlaza temario-core.js.`);
      assertEq(source.scripts.full, false, `${PENDING}Study Flashcards sigue enlazando temario.js.`);
      assertEq(source.scripts.loader, false, `${PENDING}Study Flashcards no necesita content-loader.js.`);
      assertEq(source.hasLoader, false, `${PENDING}Study Flashcards no debe cargar StudyContent/content-loader.js.`);
      assert(source.areas >= 1, "la biblioteca de Flashcards muestra las áreas");
      if (source.decks === 0) {
        const opened = await page.eval(`(() => {
          const details = document.querySelector("details.lib-area");
          if (!details) return false;
          const summary = details.querySelector("summary");
          if (!summary) return false;
          summary.click();
          return true;
        })()`);
        assert(opened, "se puede abrir un área de la biblioteca de Flashcards");
        await page.waitFor(`document.querySelectorAll(".deck-row").length > 0`, {
          timeout: 10000,
          message: "mazos del área abierta",
        });
        source.decks = await page.eval(`document.querySelectorAll(".deck-row").length`);
      }
      assert(source.decks >= 1, "la biblioteca de Flashcards muestra mazos");
      assert(source.text630, "la portada de Flashcards muestra las 630 tarjetas");

      let resourcesState = await resources(page);
      assertEq(resourcesState.full.length, 0, `${PENDING}Flashcards pidió temario.js al arrancar.`);
      assertEq(resourcesState.loadedChunks.length, 0, `${PENDING}Flashcards pidió chunks de secciones al arrancar.`);
      assert(resourcesState.core.length >= 1, "Flashcards descarga temario-core.js");

      await page.eval(`location.hash = "#/mazo/${SHEET.same}", true`);
      await page.waitFor(`location.hash === "#/mazo/${SHEET.same}"`, { timeout: 8000 });
      await page.waitFor(`!!document.querySelector('[data-action="start-session"], a[href="#/sesion"]')`, { timeout: 10000, message: "modos del mazo" });
      const modeSelector = await firstVisible(page, [
        '[data-action="start-session"][data-mode="free"]',
        '[data-action="start-session"][data-mode="quick"]',
        '[data-action="start-session"]',
        'a[href="#/sesion"]',
      ]);
      assert(modeSelector, "hay un control visible para entrar en la sesión de Flashcards");
      await page.click(modeSelector);
      await page.waitFor(`location.hash === "#/sesion"`, { timeout: 8000, message: "sesión de Flashcards" });
      await page.waitFor(`!!document.querySelector('[data-action="reveal"], [data-action="select-option"]')`, { timeout: 10000, message: "tarjeta de sesión" });
      const session = await page.eval(`(() => {
        const store = window.StudyStore;
        const s = store.getFlashSession ? store.getFlashSession() : null;
        const cards = (window.STUDY_CONTENT && window.STUDY_CONTENT.cards) || [];
        const queue = s && Array.isArray(s.queue) ? s.queue : [];
        return {
          hash: location.hash,
          queue: queue.length,
          allReal: queue.every((id) => cards.some((card) => card.id === id)),
          deckId: s ? s.deckId : null
        };
      })()`);
      assertEq(session.hash, "#/sesion", "la sesión de Flashcards está abierta");
      assert(session.queue >= 1, "la sesión tiene una cola real de tarjetas");
      assertEq(session.allReal, true, "todas las tarjetas de la cola existen en STUDY_CONTENT.cards");
      assertEq(session.deckId, SHEET.same, "la sesión conserva el mazo");
      resourcesState = await resources(page);
      assertEq(resourcesState.loadedChunks.length, 0, `${PENDING}la sesión de Flashcards pidió chunks.`);
      assertEq(resourcesState.full.length, 0, `${PENDING}la sesión de Flashcards pidió temario.js.`);

      const errors = await page.errorsSummary();
      const shot = await h.shot(page, "fase4-flash-sesion");
      return { source, session, resources: { core: resourcesState.core.length, chunks: resourcesState.loadedChunks.length, full: resourcesState.full.length }, errors: { exceptions: errors.exceptions.length, consoleErrors: errors.consoleErrors.length }, shot };
    },
    { severity: "alta", page, timeout: 120000 },
  );

  /* ---------------------------------------------------------------- */
  /* F4-HUB · Lee el snapshot v1 sin cambios y sin descargar temario  */
  /* ---------------------------------------------------------------- */
  await h.test(
    "F4-HUB",
    "El HUB lee studyhub:snapshot:v1 sin modificarlo y no descarga el temario ni chunks",
    async () => {
      await resetViewport(page);
      await gotoApp(page, baseURL, "hub", { settle: 1000 });
      const previous = await page.eval(`localStorage.getItem(${JSON.stringify(SNAPSHOT_KEY)})`);
      const seededSnapshot = {
        version: 1,
        contentVersion: "2.5.0",
        updatedAt: new Date().toISOString(),
        hasActivity: true,
        dashboard: {
          totalSheets: 210,
          completedSheets: 1,
          viewedSheets: 1,
          startedTopics: 1,
          completedTopics: 0,
          percent: 0,
          last: {
            sheetId: SHEET.same,
            topicId: "topic-aps-atributos",
            title: "Una APS fuerte no es un consultorio de segunda",
            url: baseURL + "/study-dashboard/index.html?sheet=" + SHEET.same,
          },
          todayCompleted: 1,
          goal: 2,
          streak: 1,
        },
        flashcards: {
          totalCards: 630,
          reviewedCards: 1,
          masteredCards: 0,
          dueCards: 1,
          newCards: 629,
          percent: 0,
          last: { deckId: SHEET.same, title: "Una APS fuerte no es un consultorio de segunda" },
          todayReviews: 1,
        },
      };
      try {
        await page.eval(`localStorage.setItem(${JSON.stringify(SNAPSHOT_KEY)}, ${JSON.stringify(JSON.stringify(seededSnapshot))})`);
        await page.goto(baseURL + "/index.html", { settle: 1000 });
        await waitApp(page, "hub");
        await sleep(250);
        const rawAfter = await page.eval(`localStorage.getItem(${JSON.stringify(SNAPSHOT_KEY)})`);
        assertEq(rawAfter, JSON.stringify(seededSnapshot), `${PENDING}el HUB modificó studyhub:snapshot:v1 al leerlo.`);
        const hub = await page.eval(`(() => {
          const card = document.querySelector('[data-app="dashboard"]');
          const progress = document.querySelector('[data-study-card="dashboard"] [data-progress="dashboard"]');
          const last = document.querySelector('[data-study-card="dashboard"] [data-last="dashboard"]');
          return {
            dashboardHref: card ? card.getAttribute("href") : null,
            progressValue: progress ? (progress.querySelector("[data-progress-value]") || {}).textContent : null,
            progressNote: progress ? (progress.querySelector("[data-progress-note]") || {}).textContent : null,
            lastHidden: last ? last.hidden : null,
            lastText: last ? (last.querySelector("[data-last-text]") || {}).textContent : null,
            studyScripts: Array.from(document.scripts).map((script) => script.getAttribute("src") || "").filter((src) => src.includes("/study-data/"))
          };
        })()`);
        assert(hub.dashboardHref, "el HUB conserva la tarjeta de Study Dashboard");
        assert(!hub.dashboardHref.includes("?"), `la tarjeta del HUB no debe alterar la URL (${hub.dashboardHref})`);
        assertEq(hub.progressValue, "1/210", "el HUB lee el progreso del snapshot");
        assertIncludes(normalize(hub.progressNote), "1 tema iniciado", "nota del snapshot en el HUB");
        assertEq(hub.lastHidden, false, "el HUB muestra el último punto del snapshot");
        assertEq(hub.lastText, "Una APS fuerte no es un consultorio de segunda", "título del último punto en el HUB");
        assertEq(hub.studyScripts.length, 0, `${PENDING}el HUB carga scripts de study-data.`);

        /* Seleccionar Dashboard en el carrusel para leer «Continuar». */
        let active = null;
        for (let step = 0; step < 6; step += 1) {
          active = await page.eval(`(() => { const card = document.querySelector(".app-card.is-active"); return card ? card.getAttribute("data-app") : null; })()`);
          if (active === "dashboard") break;
          await page.click("#nextTop");
          await sleep(260);
        }
        assertEq(active, "dashboard", "el carrusel del HUB permite seleccionar Study Dashboard");
        const continuation = await page.eval(`(() => {
          const btn = document.getElementById("openCurrent");
          return btn ? {
            label: (btn.querySelector("span") || {}).textContent || "",
            aria: btn.getAttribute("aria-label") || "",
            continuation: btn.dataset.continuation || ""
          } : null;
        })()`);
        assert(continuation, "el HUB expone el control Abrir/Continuar");
        assertEq(continuation.label, "Continuar", "el HUB reanuda el punto del snapshot");
        assert(continuation.aria.includes("Continuar en"), `el aria-label describe la continuación (${continuation.aria})`);
        assert(continuation.continuation.includes(SHEET.same), `la continuación apunta a la ficha del snapshot (${continuation.continuation})`);

        const resourcesState = await resources(page);
        assertEq(resourcesState.studyData.length, 0, `${PENDING}el HUB descargó recursos de study-data: ${resourcesState.studyData.map((item) => item.url).join(", ")}`);
        const errors = await page.errorsSummary();
        const shot = await h.shot(page, "fase4-hub-snapshot");
        return {
          snapshot: seededSnapshot.dashboard,
          hub,
          continuation,
          resources: { studyData: resourcesState.studyData.length, core: resourcesState.core.length, chunks: resourcesState.loadedChunks.length },
          errors: { exceptions: errors.exceptions.length, consoleErrors: errors.consoleErrors.length },
          shot,
        };
      } finally {
        await page.eval(previous === null
          ? `localStorage.removeItem(${JSON.stringify(SNAPSHOT_KEY)})`
          : `localStorage.setItem(${JSON.stringify(SNAPSHOT_KEY)}, ${JSON.stringify(previous)})`).catch(() => {});
      }
    },
    { severity: "alta", page, timeout: 90000 },
  );
}
