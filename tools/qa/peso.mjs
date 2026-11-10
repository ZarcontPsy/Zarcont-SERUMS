/* © 2026 ZARCONT — Peso de carga inicial y carga perezosa de derivados.
 *
 * Mide, en Chrome headless y con el servidor local:
 *   1. Peso de la portada (#/) tal como está en Fase 3 (transferencia real,
 *      mismo origen, sin caché).
 *   2. Línea base equivalente a Fase 2: se bloquean por CDP los assets que
 *      añade la Fase 3 (reference.js, vistas de glosario/datos/trampas,
 *      plan.relampago/lastday y sus CSS). No es una medición histórica: es la
 *      misma app sin esos archivos, en la misma máquina y navegador.
 *   3. Línea base de Fase 1 (sin assets de Fase 2 ni 3) y de Fase 0 (además
 *      sin active/nav/plan de Fase 1).
 *   4. Que ningún índice derivado se pida al arrancar y que cada JSON
 *      (search, related, glossary, facts, warnings) solo se descargue en la
 *      acción o ruta que lo necesita.
 *
 * Uso: node tools/qa/peso.mjs
 * Salida: tools/qa/salida/peso.json + peso.md
 * Código 1 si un derivado se pide al arrancar o si la medición no se completa.
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../tests/e2e/lib/cdp.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = path.join(HERE, "salida");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const SERVER_PORT = 8793;
const CDP_PORT = 9393;

const PHASE1_BLOCKED = [
  "*study-dashboard/css/active.css*",
  "*study-dashboard/css/nav.css*",
  "*study-dashboard/css/plan.css*",
  "*study-dashboard/js/active/*",
  "*study-dashboard/js/nav/*",
  "*study-dashboard/js/plan/today.integration.js*",
  "*study-dashboard/js/data/derived-loader.js*",
];

const PHASE1_FILES = [
  "study-dashboard/css/active.css",
  "study-dashboard/css/nav.css",
  "study-dashboard/css/plan.css",
  "study-dashboard/js/active/active.icons.js",
  "study-dashboard/js/active/active.core.js",
  "study-dashboard/js/active/active.components.js",
  "study-dashboard/js/active/active.behavior.js",
  "study-dashboard/js/active/active.integration.js",
  "study-dashboard/js/nav/core.js",
  "study-dashboard/js/nav/search.js",
  "study-dashboard/js/nav/sections.js",
  "study-dashboard/js/nav/palette.js",
  "study-dashboard/js/nav/nav.integration.js",
  "study-dashboard/js/plan/today.integration.js",
  "study-dashboard/js/data/derived-loader.js",
];

const PHASE2_BLOCKED = [
  "*study-dashboard/js/plan/plan.runtime.js*",
  "*study-dashboard/js/plan/plan.ruta.js*",
  "*study-dashboard/js/plan/plan.editor.js*",
  "*study-dashboard/js/plan/plan.mastery.js*",
  "*study-dashboard/js/plan/plan.review.js*",
  "*study-dashboard/css/plan-ruta.css*",
  "*study-dashboard/css/plan-editor.css*",
  "*study-dashboard/css/plan-mastery.css*",
  "*study-dashboard/css/plan-review.css*",
];

const PHASE2_FILES = [
  "study-dashboard/js/plan/plan.runtime.js",
  "study-dashboard/js/plan/plan.ruta.js",
  "study-dashboard/js/plan/plan.editor.js",
  "study-dashboard/js/plan/plan.mastery.js",
  "study-dashboard/js/plan/plan.review.js",
  "study-dashboard/css/plan-ruta.css",
  "study-dashboard/css/plan-editor.css",
  "study-dashboard/css/plan-mastery.css",
  "study-dashboard/css/plan-review.css",
];

const PHASE3_BLOCKED = [
  "*study-dashboard/js/nav/reference.js*",
  "*study-dashboard/js/nav/glossary.integration.js*",
  "*study-dashboard/js/nav/facts.integration.js*",
  "*study-dashboard/js/nav/traps.integration.js*",
  "*study-dashboard/js/plan/plan.relampago.js*",
  "*study-dashboard/js/plan/plan.lastday.js*",
  "*study-dashboard/css/glossary.css*",
  "*study-dashboard/css/facts.css*",
  "*study-dashboard/css/traps.css*",
  "*study-dashboard/css/plan-relampago.css*",
  "*study-dashboard/css/plan-lastday.css*",
];

const PHASE3_FILES = [
  "study-dashboard/js/nav/reference.js",
  "study-dashboard/js/nav/glossary.integration.js",
  "study-dashboard/js/nav/facts.integration.js",
  "study-dashboard/js/nav/traps.integration.js",
  "study-dashboard/js/plan/plan.relampago.js",
  "study-dashboard/js/plan/plan.lastday.js",
  "study-dashboard/css/glossary.css",
  "study-dashboard/css/facts.css",
  "study-dashboard/css/traps.css",
  "study-dashboard/css/plan-relampago.css",
  "study-dashboard/css/plan-lastday.css",
];

const RESOURCE_JS = `(() => {
  const origin = location.origin;
  const entries = performance.getEntriesByType("resource")
    .filter((entry) => entry.name.indexOf(origin) === 0)
    .map((entry) => ({
      url: entry.name.replace(origin, ""),
      transfer: entry.transferSize || 0,
      encoded: entry.encodedBodySize || 0,
      decoded: entry.decodedBodySize || 0,
      duration: Math.round(entry.duration || 0),
      initiator: entry.initiatorType || ""
    }));
  return {
    href: location.href,
    entries,
    transfer: entries.reduce((total, entry) => total + entry.transfer, 0),
    decoded: entries.reduce((total, entry) => total + entry.decoded, 0),
    count: entries.filter((entry) => entry.transfer > 0 || entry.decoded > 0).length,
    rawCount: entries.length,
    blocked: entries.filter((entry) => entry.transfer === 0 && entry.decoded === 0).map((entry) => entry.url),
    derived: entries.filter((entry) => /\\/study-data\\/derived\\//.test(entry.url)).map((entry) => entry.url),
    searchJson: entries.filter((entry) => /\\/derived\\/search\\.json/.test(entry.url)).length,
    relatedJson: entries.filter((entry) => /\\/derived\\/related\\.json/.test(entry.url)).length,
    glossaryJson: entries.filter((entry) => /\\/derived\\/glossary\\.json/.test(entry.url)).length,
    factsJson: entries.filter((entry) => /\\/derived\\/facts\\.json/.test(entry.url)).length,
    warningsJson: entries.filter((entry) => /\\/derived\\/warnings\\.json/.test(entry.url)).length,
    planModel: entries.filter((entry) => entry.url.indexOf("/js/plan/plan-model.js") >= 0),
    planRuntime: entries.filter((entry) => entry.url.indexOf("/js/plan/plan.runtime.js") >= 0),
    reference: entries.filter((entry) => entry.url.indexOf("/js/nav/reference.js") >= 0)
  };
})()`;

function kb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

export async function runWeight({ quiet = false } = {}) {
  await mkdir(OUT_DIR, { recursive: true });
  const profileRoot = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-peso-"));
  const server = new StaticServer({ root: ROOT, port: SERVER_PORT, python: PYTHON });
  await server.start();
  const chrome = new Chrome({
    chromePath: CHROME,
    userDataDir: path.join(profileRoot, "profile"),
    port: CDP_PORT,
  });

  const result = {
    generatedAt: new Date().toISOString(),
    source: "tools/qa/peso.mjs",
    environment: {},
    blockedForBaseline: [...PHASE1_BLOCKED, ...PHASE2_BLOCKED, ...PHASE3_BLOCKED],
    files: [],
    measurements: {},
    lazy: {},
    summary: { ok: false, startupDerived: null, notes: [] },
  };
  let page = null;

  try {
    const info = await chrome.start();
    result.environment = { browser: info && info.Browser, server: server.baseURL, profileRoot };
    const conn = await chrome.newTarget("about:blank");
    page = new Page(conn, { browser: chrome, port: CDP_PORT });
    await page.init();
    await page.viewport(1440, 900);
    await conn.send("Network.setCacheDisabled", { cacheDisabled: true });
    await conn.send("Network.clearBrowserCache");

    const waitApp = () =>
      page.waitFor(
        `!document.getElementById('view-root').hidden && document.getElementById('view-root').innerText.trim().length > 20`,
        { timeout: 25000, message: "arranque del panel" },
      );

    // 1. Fase 3 (estado actual).
    await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 1200 });
    await waitApp();
    const phase3 = await page.eval(RESOURCE_JS);
    result.measurements.phase3 = phase3;

    // 2. Línea base de Fase 2: se bloquean los assets de Fase 3.
    await conn.send("Network.setBlockedURLs", { urls: PHASE3_BLOCKED });
    await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 1200 });
    await waitApp();
    const phase2 = await page.eval(RESOURCE_JS);
    result.measurements.phase2 = phase2;

    // 3. Línea base de Fase 1: se bloquean los assets de Fase 2 y Fase 3.
    await conn.send("Network.setBlockedURLs", { urls: [...PHASE2_BLOCKED, ...PHASE3_BLOCKED] });
    await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 1200 });
    await waitApp();
    const phase1 = await page.eval(RESOURCE_JS);
    result.measurements.phase1 = phase1;

    // 4. Línea base de Fase 0: además se bloquean los assets de Fase 1.
    await conn.send("Network.setBlockedURLs", { urls: [...PHASE1_BLOCKED, ...PHASE2_BLOCKED, ...PHASE3_BLOCKED] });
    await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 1200 });
    await waitApp();
    const phase0 = await page.eval(RESOURCE_JS);
    result.measurements.phase0 = phase0;
    await conn.send("Network.setBlockedURLs", { urls: [] });

    // 3. Derivados bajo demanda.
    //    La navegación de solo hash no recarga el documento: se fuerza una
    //    carga completa con una query neutra para que la app vuelva a cargar
    //    todos los scripts (los de la Fase 1 ya no están bloqueados).
    await page.goto(`${server.baseURL}/study-dashboard/index.html?qa=lazy#/biblioteca`, { settle: 1100 });
    await page.waitFor(`!!document.querySelector("[data-library-search-input]")`, {
      timeout: 12000,
      message: "panel de búsqueda de la biblioteca",
    });
    const beforeFocus = await page.eval(RESOURCE_JS);
    // El foco programático de Runtime.evaluate no dispara focusin en headless:
    // se usa un clic real (el mismo gesto que un usuario) para cargar el índice.
    let hasInput = true;
    try {
      await page.click("[data-library-search-input]", { timeout: 8000 });
    } catch {
      hasInput = false;
    }
    let afterIndex = null;
    if (hasInput) {
      const started = Date.now();
      await page.waitFor(`window.StudyDerived && window.StudyDerived.state("search") === "ready"`, {
        timeout: 60000,
        message: "índice de búsqueda bajo demanda",
      });
      afterIndex = await page.eval(RESOURCE_JS);
      afterIndex.buildMs = Date.now() - started;
    }
    const relatedHome = await page.eval(RESOURCE_JS);
    await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-audit-05`, { settle: 1400 });
    await page.waitFor(`!!window.StudyDerived && window.StudyDerived.state("related") === "ready"`, { timeout: 20000, message: "related.json bajo demanda" }).catch(() => {});
    const afterRelated = await page.eval(RESOURCE_JS);

    result.lazy = {
      searchInputAvailable: hasInput,
      atLibraryEntry: { derived: beforeFocus.derived, searchJson: beforeFocus.searchJson, transfer: beforeFocus.transfer },
      afterFocus: afterIndex
        ? { searchJson: afterIndex.searchJson, derived: afterIndex.derived, transfer: afterIndex.transfer, buildMs: afterIndex.buildMs }
        : null,
      relatedOnHomeOrLibrary: relatedHome.relatedJson,
      relatedOnSheet: afterRelated.relatedJson,
    };

    // 3b. plan-model.js: nunca en el arranque; solo al abrir una vista de planificación.
    const runtimeAtStartup = phase3.planRuntime.length > 0;
    let planModel = { pending: !runtimeAtStartup, startupRequests: phase3.planModel.length };
    if (runtimeAtStartup) {
      await page.goto(`${server.baseURL}/study-dashboard/index.html?qa=plan#/`, { settle: 1100 });
      await page.waitFor(`!!window.StudyPlanRuntime`, { timeout: 12000, message: "runtime de planificación" });
      const beforeRoute = await page.eval(RESOURCE_JS);
      const started = Date.now();
      await page.eval(`location.hash = "#/ruta", true`);
      await page.waitFor(`(() => {
        if (!window.StudyPlanModel) return false;
        const view = document.querySelector('section[data-plan-view="ruta"]');
        return !!view && !view.querySelector('[data-plan-loading]');
      })()`, { timeout: 35000, message: "vista #/ruta con el modelo cargado" });
      const afterRoute = await page.eval(RESOURCE_JS);
      planModel = {
        pending: false,
        startupRequests: beforeRoute.planModel.length,
        afterRouteRequests: afterRoute.planModel.length,
        transfer: afterRoute.planModel.reduce((total, entry) => total + entry.transfer, 0),
        loadMs: Date.now() - started,
        viewReady: true,
      };
    }
    result.lazy.planModel = planModel;

    // 3c. Fase 3: reference.js no pide JSON al arrancar; cada vista pide el suyo.
    const refAtStartup = phase3.reference.length > 0;
    let reference = {
      pending: !refAtStartup,
      startupRequests: phase3.glossaryJson + phase3.factsJson + phase3.warningsJson,
    };
    if (refAtStartup) {
      await page.goto(`${server.baseURL}/study-dashboard/index.html?qa=ref#/`, { settle: 1100 });
      await page.waitFor(`!!window.StudyReference`, { timeout: 12000, message: "puente StudyReference" });
      const atStart = await page.eval(RESOURCE_JS);
      const ready = (kind, message) =>
        page.waitFor(`window.StudyReference && window.StudyReference.state(${JSON.stringify(kind)}) === "ready"`, { timeout: 35000, message }).then(() => true).catch(() => false);
      await page.eval(`location.hash = "#/glosario", true`);
      const glossaryReady = await ready("glossary", "glossary.json bajo demanda");
      const afterGlossary = await page.eval(RESOURCE_JS);
      const glossaryViewReady = await page.eval(`!!document.querySelector('section[data-ref-view="glosario"]')`);
      if (!glossaryViewReady || !glossaryReady) {
        reference = {
          pending: true,
          reason: "reference.js está cargado pero las vistas de referencia aún no están registradas (o no cargaron su derivado); se medirá cuando existan.",
          startupRequests: atStart.glossaryJson + atStart.factsJson + atStart.warningsJson,
          viewReady: false,
        };
      } else {
        await page.eval(`location.hash = "#/datos", true`);
        await ready("facts", "facts.json bajo demanda");
        const afterFacts = await page.eval(RESOURCE_JS);
        await page.eval(`location.hash = "#/trampas", true`);
        await ready("warnings", "warnings.json bajo demanda");
        const afterWarnings = await page.eval(RESOURCE_JS);
        reference = {
          pending: false,
          startupRequests: atStart.glossaryJson + atStart.factsJson + atStart.warningsJson,
          atStart: { glossary: atStart.glossaryJson, facts: atStart.factsJson, warnings: atStart.warningsJson },
          glossary: { requests: afterGlossary.glossaryJson, facts: afterGlossary.factsJson, warnings: afterGlossary.warningsJson },
          facts: { requests: afterFacts.factsJson, glossary: afterFacts.glossaryJson, warnings: afterFacts.warningsJson },
          warnings: { requests: afterWarnings.warningsJson, glossary: afterWarnings.glossaryJson, facts: afterWarnings.factsJson },
          viewReady: await page.eval(`!!document.querySelector('section[data-ref-view="trampas"]')`),
        };
      }
    }
    result.lazy.reference = reference;

    result.summary.startupDerived = phase3.derived.length;
    result.summary.startupSearchJson = phase3.searchJson;
    result.summary.baselineDerived = phase0.derived.length;

    const requiredOk =
      phase3.derived.length === 0 &&
      phase0.derived.length === 0 &&
      afterIndex !== null &&
      afterIndex.searchJson >= 1 &&
      afterRelated.relatedJson >= 1 &&
      (planModel.pending || (planModel.startupRequests === 0 && planModel.afterRouteRequests >= 1)) &&
      (reference.pending || (reference.startupRequests === 0 && reference.glossary.requests >= 1 && reference.facts.requests >= 1 && reference.warnings.requests >= 1));
    result.summary.ok = requiredOk;
    if (phase3.derived.length) result.summary.notes.push(`Al arrancar se pidieron derivados: ${phase3.derived.join(", ")}`);
    if (!hasInput) result.summary.notes.push("No hay campo [data-library-search-input]; no se pudo medir la carga del índice.");
    if (afterIndex && afterIndex.searchJson < 1) result.summary.notes.push("search.json no se pidió al enfocar la búsqueda.");
    if (afterRelated.relatedJson < 1) result.summary.notes.push("related.json no se pidió al abrir la ficha con relaciones.");
    if (planModel.pending) result.summary.notes.push("Fase 2 sin integrar: plan.runtime.js no se carga en el documento; la carga perezosa de plan-model.js quedará pendiente hasta que exista.");
    if (!planModel.pending && planModel.startupRequests > 0) result.summary.notes.push("plan-model.js se pidió ANTES de abrir #/ruta.");
    if (!planModel.pending && planModel.afterRouteRequests < 1) result.summary.notes.push("plan-model.js no se pidió al abrir #/ruta.");
    if (reference.pending) result.summary.notes.push(`Fase 3 sin integrar: ${reference.reason || "reference.js no se carga en el documento"}; la carga perezosa de glossary/facts/warnings quedará pendiente hasta que exista.`);
    if (!reference.pending && reference.startupRequests > 0) result.summary.notes.push("glossary/facts/warnings se pidieron ANTES de abrir sus rutas.");
    if (!reference.pending && reference.glossary.requests < 1) result.summary.notes.push("glossary.json no se pidió al abrir #/glosario.");
    if (!reference.pending && reference.facts.requests < 1) result.summary.notes.push("facts.json no se pidió al abrir #/datos.");
    if (!reference.pending && reference.warnings.requests < 1) result.summary.notes.push("warnings.json no se pidió al abrir #/trampas.");

    // 4. Tamaños en disco de los archivos de la Fase 1, Fase 2 y Fase 3.
    for (const rel of [...PHASE1_FILES, ...PHASE2_FILES, ...PHASE3_FILES]) {
      try {
        const infoFile = await stat(path.join(ROOT, rel));
        result.files.push({ path: rel, bytes: infoFile.size, kb: kb(infoFile.size) });
      } catch {
        result.files.push({ path: rel, missing: true });
      }
    }
    result.files.push(
      { path: "study-dashboard/styles.css", bytes: (await stat(path.join(ROOT, "study-dashboard/styles.css"))).size },
      { path: "study-shared/base.css", bytes: (await stat(path.join(ROOT, "study-shared/base.css"))).size },
    );
    result.files = result.files.map((file) => ({ ...file, kb: file.bytes == null ? null : kb(file.bytes) }));
    result.summary.phase3TransferKb = kb(phase3.transfer);
    result.summary.phase2TransferKb = kb(phase2.transfer);
    result.summary.phase1TransferKb = kb(phase1.transfer);
    result.summary.phase0TransferKb = kb(phase0.transfer);
    result.summary.deltaPhase3Kb = kb(phase3.transfer - phase2.transfer);
    result.summary.deltaPhase2Kb = kb(phase2.transfer - phase1.transfer);
    result.summary.deltaPhase1Kb = kb(phase1.transfer - phase0.transfer);
    result.summary.phase3Requests = phase3.count;
    result.summary.phase2Requests = phase2.count;
    result.summary.phase1Requests = phase1.count;
    result.summary.phase0Requests = phase0.count;
  } finally {
    try { if (page) await page.close(); } catch {}
    await chrome.stop().catch(() => {});
    await server.stop().catch(() => {});
  }

  await writeFile(path.join(OUT_DIR, "peso.json"), JSON.stringify(result, null, 2));
  await writeFile(path.join(OUT_DIR, "peso.md"), renderWeightMarkdown(result));
  if (!quiet) {
    console.log("\nPeso de carga inicial — Study Dashboard");
    console.log(`  Fase 3 actual: ${result.summary.phase3TransferKb} KB en ${result.summary.phase3Requests} peticiones`);
    console.log(`  Sin assets de Fase 3 (Fase 2): ${result.summary.phase2TransferKb} KB en ${result.summary.phase2Requests} peticiones`);
    console.log(`  Sin assets de Fase 2 ni 3 (Fase 1): ${result.summary.phase1TransferKb} KB en ${result.summary.phase1Requests} peticiones`);
    console.log(`  Sin assets de Fase 1, 2 ni 3 (Fase 0): ${result.summary.phase0TransferKb} KB en ${result.summary.phase0Requests} peticiones`);
    console.log(`  Delta Fase 3: ${result.summary.deltaPhase3Kb} KB · Delta Fase 2: ${result.summary.deltaPhase2Kb} KB · Delta Fase 1: ${result.summary.deltaPhase1Kb} KB · derivados al arrancar: ${result.summary.startupDerived}`);
    console.log(`  search.json al enfocar: ${result.lazy.afterFocus ? result.lazy.afterFocus.searchJson : "no medido"} · related.json en ficha: ${result.lazy.relatedOnSheet}`);
    console.log(`  plan-model.js al arrancar: ${result.lazy.planModel.pending ? "pendiente (Fase 2 sin integrar)" : result.lazy.planModel.startupRequests} · al abrir #/ruta: ${result.lazy.planModel.pending ? "—" : result.lazy.planModel.afterRouteRequests}`);
    console.log(`  Fase 3 al arrancar: ${result.lazy.reference.pending ? "pendiente (Fase 3 sin integrar)" : result.lazy.reference.startupRequests} · glosario/datos/trampas: ${result.lazy.reference.pending ? "—" : `${result.lazy.reference.glossary.requests}/${result.lazy.reference.facts.requests}/${result.lazy.reference.warnings.requests}`}`);
    console.log(`  ${result.summary.ok ? "OK" : "FALLO"}: ${path.relative(ROOT, path.join(OUT_DIR, "peso.json"))}`);
  }
  return { ok: result.summary.ok, payload: result, file: path.join(OUT_DIR, "peso.json") };
}

function renderWeightMarkdown(payload) {
  const lines = [];
  lines.push("# Peso de carga inicial y derivados bajo demanda");
  lines.push("");
  lines.push(`Generado por \`tools/qa/peso.mjs\` el ${payload.generatedAt}.`);
  lines.push("");
  lines.push("## Método");
  lines.push("");
  lines.push("1. Medición real de la portada `#/` con Chrome headless, caché desactivada y servidor local: `transferSize` de `performance.getEntriesByType(\"resource\")` para el mismo origen.");
  lines.push("2. Línea base de Fase 2: se bloquean por CDP los assets que añade la Fase 3 (`js/nav/reference.js`, vistas `glossary|facts|traps`, `plan.relampago|lastday.js` y sus cinco CSS).");
  lines.push("3. Línea base de Fase 1: además se bloquean los assets de la Fase 2 (`css/plan-ruta|editor|mastery|review.css`, `js/plan/plan.runtime|ruta|editor|mastery|review.js`).");
  lines.push("4. Línea base de Fase 0: además se bloquean los assets de la Fase 1 (`css/active.css`, `css/nav.css`, `css/plan.css`, `js/active/*`, `js/nav/*`, `js/plan/today.integration.js`, `js/data/derived-loader.js`).");
  lines.push("5. La búsqueda, las relacionadas, `plan-model.js` y los tres derivados de Fase 3 se comprueban con `performance`: no aparecen antes de la acción/ruta que los necesita.");
  lines.push("");
  lines.push("## Resultado");
  lines.push("");
  lines.push("| Medición | Transferencia | Peticiones | Derivados |");
  lines.push("|---|---:|---:|---:|");
  lines.push(`| Fase 3 actual (portada) | **${payload.summary.phase3TransferKb} KB** | ${payload.summary.phase3Requests} | ${payload.summary.startupDerived} |`);
  lines.push(`| Sin assets de Fase 3 (equivale a Fase 2) | **${payload.summary.phase2TransferKb} KB** | ${payload.summary.phase2Requests} | — |`);
  lines.push(`| Sin assets de Fase 2 ni 3 (equivale a Fase 1) | **${payload.summary.phase1TransferKb} KB** | ${payload.summary.phase1Requests} | — |`);
  lines.push(`| Sin assets de Fase 1, 2 ni 3 (equivale a Fase 0) | **${payload.summary.phase0TransferKb} KB** | ${payload.summary.phase0Requests} | ${payload.summary.baselineDerived} |`);
  lines.push(`| Delta de la Fase 3 | **${payload.summary.deltaPhase3Kb} KB** | ${payload.summary.phase3Requests - payload.summary.phase2Requests} | — |`);
  lines.push(`| Delta de la Fase 2 | **${payload.summary.deltaPhase2Kb} KB** | ${payload.summary.phase2Requests - payload.summary.phase1Requests} | — |`);
  lines.push(`| Delta de la Fase 1 | **${payload.summary.deltaPhase1Kb} KB** | ${payload.summary.phase1Requests - payload.summary.phase0Requests} | — |`);
  lines.push("");
  lines.push(`- `+"`search.json`"+` al enfocar la búsqueda: **${payload.lazy.afterFocus ? payload.lazy.afterFocus.searchJson : "no medido"}** petición(es)${payload.lazy.afterFocus ? `, listo en ${payload.lazy.afterFocus.buildMs} ms` : ""}.`);
  lines.push(`- `+"`related.json`"+` en la portada/biblioteca: **${payload.lazy.relatedOnHomeOrLibrary}** · al abrir ficha con relaciones: **${payload.lazy.relatedOnSheet}**.`);
  if (payload.lazy.planModel.pending) {
    lines.push("- `plan-model.js`: **pendiente** — la Fase 2 no está integrada todavía (no se carga `plan.runtime.js` en el documento).");
  } else {
    lines.push(`- `+"`plan-model.js`"+`: **${payload.lazy.planModel.startupRequests}** peticiones al arrancar · **${payload.lazy.planModel.afterRouteRequests}** al abrir \`#/ruta\`${payload.lazy.planModel.loadMs != null ? ` (listo en ${payload.lazy.planModel.loadMs} ms)` : ""}.`);
  }
  if (payload.lazy.reference.pending) {
    lines.push(`- Glosario/datos/trampas: **pendiente** — ${payload.lazy.reference.reason || "la Fase 3 no está integrada todavía (no se carga `reference.js` en el documento)."}`);
  } else {
    const ref = payload.lazy.reference;
    lines.push(`- \`glossary.json\` / \`facts.json\` / \`warnings.json\`: **${ref.startupRequests}** al arrancar · **${ref.glossary.requests}** en \`#/glosario\` · **${ref.facts.requests}** en \`#/datos\` · **${ref.warnings.requests}** en \`#/trampas\` (acumuladas por vista: glosario → datos → trampas).`);
  }
  lines.push(`- Resultado: **${payload.summary.ok ? "OK" : "FALLO"}**${payload.summary.notes.length ? ` — ${payload.summary.notes.join(" · ")}` : ""}`);
  lines.push("");
  lines.push("## Archivos de la Fase 1, Fase 2 y Fase 3");
  lines.push("");
  lines.push("| Archivo | Tamaño |");
  lines.push("|---|---:|");
  for (const file of payload.files) {
    lines.push(`| \`${file.path}\` | ${file.missing ? "—" : `${file.kb} KB`} |`);
  }
  lines.push("");
  if (payload.measurements.phase3 && payload.measurements.phase3.entries.length) {
    lines.push("## Peticiones de la portada (Fase 3)");
    lines.push("");
    lines.push("| Recurso | Transferencia | Decodificado | ms |");
    lines.push("|---|---:|---:|---:|");
    for (const entry of payload.measurements.phase3.entries) {
      lines.push(`| \`${entry.url}\` | ${kb(entry.transfer)} KB | ${kb(entry.decoded)} KB | ${entry.duration} |`);
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push("© 2026 ZARCONT — Evidencia interna de QA.");
  lines.push("");
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runWeight({ quiet: process.argv.includes("--quiet") })
    .then(({ ok }) => process.exit(ok ? 0 : 1))
    .catch((err) => {
      console.error("ERROR en peso.mjs:", err && err.stack ? err.stack : err);
      process.exit(1);
    });
}
