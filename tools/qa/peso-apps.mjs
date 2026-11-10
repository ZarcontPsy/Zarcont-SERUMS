/* © 2026 ZARCONT — Peso de apps y coste de H4 (Fase 4).
 *
 * Mide, con Chrome headless + servidor local y caché desactivada:
 *   1. Carga inicial REAL de Study Dashboard, Study Flashcards y HUB.
 *   2. Línea base anterior (Fase 3) de Dashboard y Flashcards: se bloquean por
 *      CDP todos los assets de contenido (temario.js, temario-core.js,
 *      content-loader.js y sections/*) para medir el «resto» de la app, y se
 *      descarga el temario completo real (temario.js) para sumar su coste. Es
 *      una reconstrucción medida, no una corrida histórica.
 *   3. Coste del core (temario-core.js + content-loader.js) en el arranque.
 *   4. Coste de la primera área: una ficha directa debe pedir solo su chunk;
 *      otra ficha del área no debe repetir la petición.
 *   5. El HUB no descarga nada de study-data y sus peticiones no cambian al
 *      bloquear los assets de contenido.
 *
 * Uso: node tools/qa/peso-apps.mjs
 * Salida: tools/qa/salida/peso-apps.json + peso-apps.md
 * Código 1 si falta la integración de Fase 4 o si se pide el temario completo.
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../tests/e2e/lib/cdp.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = path.join(HERE, "salida");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const SERVER_PORT = 8794;
const CDP_PORT = 9394;

const PATH_CONST = {
  full: "/study-data/temario.js",
  core: "/study-data/temario-core.js",
  loader: "/study-data/content-loader.js",
  sections: "/study-data/sections/",
  studyData: "/study-data/",
};

/* Para medir el «resto» de la app se bloquean TODOS los assets de contenido. */
const CONTENT_BLOCKED = [
  "*study-data/temario.js*",
  "*study-data/temario-core.js*",
  "*study-data/content-loader.js*",
  "*study-data/sections/*",
];

const READY = {
  dashboard: `!document.getElementById("view-root").hidden && document.getElementById("view-root").innerText.trim().length > 20`,
  flashcards: `!document.getElementById("view-root").hidden && document.getElementById("view-root").innerText.trim().length > 20`,
  hub: `!!document.querySelector(".app-card[data-app]") && !document.getElementById("overlay").classList.contains("open")`,
};

const RESOURCE_JS = `(() => {
  const P = ${JSON.stringify(PATH_CONST)};
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
  const chunks = entries.filter((entry) => entry.url.includes(P.sections));
  return {
    href: location.href,
    entries,
    transfer: entries.reduce((total, entry) => total + entry.transfer, 0),
    decoded: entries.reduce((total, entry) => total + entry.decoded, 0),
    count: entries.filter((entry) => entry.transfer > 0 || entry.decoded > 0).length,
    core: entries.filter((entry) => entry.url.includes(P.core)),
    loader: entries.filter((entry) => entry.url.includes(P.loader)),
    full: entries.filter((entry) => entry.url.includes(P.full)),
    chunks,
    loadedChunks: chunks.filter((entry) => entry.transfer > 0 || entry.decoded > 0),
    studyData: entries.filter((entry) => entry.url.includes(P.studyData)),
    contentSplit: entries.filter((entry) => entry.url.includes("/study-data/content-split.json"))
  };
})()`;

const TEMARIO_FETCH = `(async () => {
  const url = "/study-data/temario.js?qa=peso-full-" + Date.now();
  const started = performance.now();
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  const elapsed = performance.now() - started;
  const entries = performance.getEntriesByType("resource").filter((entry) => entry.name.includes(url));
  const entry = entries[entries.length - 1] || null;
  return {
    url,
    status: response.status,
    bytes: text.length,
    duration: Math.round(elapsed),
    transfer: entry ? entry.transferSize || 0 : 0,
    encoded: entry ? entry.encodedBodySize || 0 : 0,
    decoded: entry ? entry.decodedBodySize || 0 : 0
  };
})()`;

function kb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

async function readSplitMeta() {
  try {
    const raw = await readFile(path.join(ROOT, "study-data", "content-split.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function runAppsWeight({ quiet = false } = {}) {
  await mkdir(OUT_DIR, { recursive: true });
  const profileRoot = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-peso-apps-"));
  const server = new StaticServer({ root: ROOT, port: SERVER_PORT, python: PYTHON });
  await server.start();
  const chrome = new Chrome({
    chromePath: CHROME,
    userDataDir: path.join(profileRoot, "profile"),
    port: CDP_PORT,
  });

  const result = {
    generatedAt: new Date().toISOString(),
    source: "tools/qa/peso-apps.mjs",
    method: {
      after: "Carga real con temario-core.js + content-loader.js (Fase 4).",
      before: "Reconstrucción medida: resto de la app con todos los assets de contenido bloqueados por CDP + descarga real de temario.js (Fase 3).",
      blockedForBaseline: CONTENT_BLOCKED,
      cache: "Network.setCacheDisabled(true) + Network.clearBrowserCache",
    },
    environment: {},
    apps: {},
    core: null,
    firstArea: null,
    files: [],
    checks: {},
    notes: [],
    summary: { ok: false },
  };
  let page = null;
  let conn = null;

  const measure = async (name, url, { blocked = [], ready = null } = {}) => {
    await conn.send("Network.setBlockedURLs", { urls: blocked });
    const [base, hash = ""] = url.split("#");
    const target = base + (base.includes("?") ? "&" : "?") + "qa=" + name + "-" + Date.now() + (hash ? "#" + hash : "");
    const started = Date.now();
    await page.goto(target, { settle: 1200 });
    let readyOk = false;
    if (ready) {
      readyOk = await page
        .waitFor(ready, { timeout: 25000, message: `arranque de ${name}` })
        .then(() => true)
        .catch(() => false);
    }
    await sleep(350);
    const resources = await page.eval(RESOURCE_JS);
    return { ...resources, ready: readyOk, wallMs: Date.now() - started, name };
  };

  try {
    const info = await chrome.start();
    result.environment = { browser: info && info.Browser, server: server.baseURL, profileRoot };
    conn = await chrome.newTarget("about:blank");
    page = new Page(conn, { browser: chrome, port: CDP_PORT });
    await page.init();
    await page.viewport(1440, 900);
    await conn.send("Network.setCacheDisabled", { cacheDisabled: true });
    await conn.send("Network.clearBrowserCache");

    const dashURL = `${server.baseURL}/study-dashboard/index.html`;
    const flashURL = `${server.baseURL}/study-flashcards/index.html`;
    const hubURL = `${server.baseURL}/index.html`;

    /* Dashboard: después real y resto bloqueado. */
    const dashboardAfter = await measure("dashboard-after", `${dashURL}#/`, { ready: READY.dashboard });
    const dashboardRest = await measure("dashboard-rest", `${dashURL}#/`, { blocked: CONTENT_BLOCKED });
    result.apps.dashboard = { after: dashboardAfter, restBlocked: dashboardRest };

    /* Flashcards: después real y resto bloqueado. */
    const flashAfter = await measure("flashcards-after", `${flashURL}#/`, { ready: READY.flashcards });
    const flashRest = await measure("flashcards-rest", `${flashURL}#/`, { blocked: CONTENT_BLOCKED });
    result.apps.flashcards = { after: flashAfter, restBlocked: flashRest };

    /* HUB: no usa contenido; con y sin bloqueo debe ser el mismo conjunto. */
    const hubAfter = await measure("hub-after", hubURL, { ready: READY.hub });
    const hubBlocked = await measure("hub-blocked", hubURL, { blocked: CONTENT_BLOCKED, ready: READY.hub });
    result.apps.hub = { after: hubAfter, blocked: hubBlocked };

    /* Temario completo real (para la línea base reconstruida). */
    await conn.send("Network.setBlockedURLs", { urls: [] });
    const temario = await page.eval(TEMARIO_FETCH);
    result.apps.temario = temario;

    /* Coste del core y metadatos del split. */
    const split = await readSplitMeta();
    const coreEntries = [...dashboardAfter.core, ...dashboardAfter.loader];
    result.core = {
      file: "study-data/temario-core.js + study-data/content-loader.js",
      found: dashboardAfter.core.length + dashboardAfter.loader.length,
      coreRequests: dashboardAfter.core.length,
      loaderRequests: dashboardAfter.loader.length,
      transfer: coreEntries.reduce((total, entry) => total + entry.transfer, 0),
      decoded: coreEntries.reduce((total, entry) => total + entry.decoded, 0),
      coreTransfer: dashboardAfter.core.reduce((total, entry) => total + entry.transfer, 0),
      loaderTransfer: dashboardAfter.loader.reduce((total, entry) => total + entry.transfer, 0),
      bytes: split && split.core ? split.core.bytes : null,
      sheets: split && split.core ? split.core.sheets : null,
      cards: split && split.core ? split.core.cards : null,
      areas: split && split.areas ? split.areas.length : null,
      sectionsBytes: split && split.totals ? split.totals.sectionsBytes : null,
      contentBytes: split && split.totals ? split.totals.contentBytes : null,
    };
    result.core.kb = kb(result.core.transfer);
    if (split) {
      for (const area of split.areas) {
        result.files.push({ path: `study-data/${area.file}`, bytes: area.bytes, kb: kb(area.bytes), areaId: area.id, sheets: area.sheets });
      }
      result.files.push({ path: "study-data/temario-core.js", bytes: split.core.bytes, kb: kb(split.core.bytes) });
      result.files.push({ path: "study-data/temario.js", bytes: split.source.bytes, kb: kb(split.source.bytes) });
    }
    try {
      const loaderStat = await stat(path.join(ROOT, "study-data", "content-loader.js"));
      result.files.push({ path: "study-data/content-loader.js", bytes: loaderStat.size, kb: kb(loaderStat.size) });
    } catch {
      result.files.push({ path: "study-data/content-loader.js", missing: true });
    }

    /* Primera área: ficha directa y misma área sin repetir chunk. */
    await conn.send("Network.setBlockedURLs", { urls: [] });
    const firstStarted = Date.now();
    await page.goto(`${dashURL}?qa=first-area-${Date.now()}#/ficha/sheet-aps-01`, { settle: 700 });
    const readerReady = await page
      .waitFor(
        `!!document.querySelector("article.reader") && !!document.querySelector(".reader-main") && document.querySelectorAll(".reader-section").length > 0`,
        { timeout: 25000, message: "lector de la primera área" },
      )
      .then(() => true)
      .catch(() => false);
    const readerAtMs = readerReady ? await page.eval("Math.round(performance.now())") : null;
    await sleep(350);
    const firstResources = await page.eval(RESOURCE_JS);
    const firstState = await page.eval(`(() => ({
      hash: location.hash,
      title: document.title,
      sheetTitle: ((document.querySelector("article.reader h1") || {}).innerText || "").trim(),
      sections: document.querySelectorAll(".reader-section").length,
      content: window.StudyContent && window.StudyContent.state ? window.StudyContent.state() : null,
      needs: window.StudyContent && window.StudyContent.needs ? window.StudyContent.needs("sheet-aps-02") : null
    }))()`);
    const firstArea = {
      sheetId: "sheet-aps-01",
      areaId: firstState.content && firstState.content.loadedAreas[0] ? firstState.content.loadedAreas[0] : null,
      readerReady,
      readerMs: readerAtMs,
      wallMs: Date.now() - firstStarted,
      sections: firstState.sections,
      sheetTitle: firstState.sheetTitle,
      state: firstState.content,
      chunkRequests: firstResources.loadedChunks.length,
      chunks: firstResources.loadedChunks,
      chunkTransfer: firstResources.loadedChunks.reduce((total, entry) => total + entry.transfer, 0),
      fullRequests: firstResources.full.length,
    };
    firstArea.chunkKb = kb(firstArea.chunkTransfer);
    firstArea.largestChunk = firstResources.loadedChunks
      .slice()
      .sort((a, b) => b.transfer - a.transfer)
      .map((entry) => ({ url: entry.url, transfer: entry.transfer, kb: kb(entry.transfer), duration: entry.duration }))[0] || null;

    /* Segunda ficha de la misma área: no debe repetir el chunk. */
    await page.eval(`location.hash = "#/ficha/sheet-aps-02", true`);
    const sameReady = await page
      .waitFor(
        `!!document.querySelector("article.reader") && (document.querySelector("article.reader h1") || {}).innerText !== ${JSON.stringify(firstState.sheetTitle)}`,
        { timeout: 12000, message: "segunda ficha del área" },
      )
      .then(() => true)
      .catch(() => false);
    await sleep(320);
    const sameResources = await page.eval(RESOURCE_JS);
    const sameState = await page.eval(`(() => ({
      hash: location.hash,
      title: ((document.querySelector("article.reader h1") || {}).innerText || "").trim(),
      content: window.StudyContent && window.StudyContent.state ? window.StudyContent.state() : null
    }))()`);
    firstArea.sameArea = {
      ready: sameReady,
      sheetId: "sheet-aps-02",
      title: sameState.title,
      chunkRequests: sameResources.loadedChunks.length,
      chunks: sameResources.loadedChunks.map((entry) => entry.url),
      loadedAreas: sameState.content ? sameState.content.loadedAreas : null,
      fullRequests: sameResources.full.length,
    };
    result.firstArea = firstArea;

    /* Línea base reconstruida por app. */
    const temarioTransfer = temario.transfer || temario.bytes;
    for (const key of ["dashboard", "flashcards"]) {
      const app = result.apps[key];
      const beforeTransfer = app.restBlocked.transfer + temarioTransfer;
      const beforeRequests = app.restBlocked.count + 1;
      app.before = {
        transfer: beforeTransfer,
        kb: kb(beforeTransfer),
        requests: beforeRequests,
        components: {
          rest: { transfer: app.restBlocked.transfer, kb: kb(app.restBlocked.transfer), requests: app.restBlocked.count },
          temario: { transfer: temarioTransfer, kb: kb(temarioTransfer), bytes: temario.bytes },
        },
      };
      app.afterSummary = {
        transfer: app.after.transfer,
        kb: kb(app.after.transfer),
        requests: app.after.count,
      };
      app.delta = {
        transfer: app.after.transfer - beforeTransfer,
        kb: kb(app.after.transfer - beforeTransfer),
        requests: app.after.count - beforeRequests,
        percent: beforeTransfer ? Math.round(((app.after.transfer - beforeTransfer) / beforeTransfer) * 1000) / 10 : null,
      };
    }
    result.apps.hub.comparison = {
      sameRequests: JSON.stringify(result.apps.hub.after.entries.map((entry) => entry.url).sort()) ===
        JSON.stringify(result.apps.hub.blocked.entries.map((entry) => entry.url).sort()),
      afterTransfer: result.apps.hub.after.transfer,
      blockedTransfer: result.apps.hub.blocked.transfer,
      studyDataAfter: result.apps.hub.after.studyData.map((entry) => entry.url),
      studyDataBlocked: result.apps.hub.blocked.studyData.map((entry) => entry.url),
    };

    /* Diagnóstico y criterios de aceptación. */
    const dashboard = result.apps.dashboard.after;
    const flashcards = result.apps.flashcards.after;
    const hub = result.apps.hub.after;
    result.checks = {
      dashboardCoreLoaded: dashboard.core.length >= 1,
      dashboardLoaderLoaded: dashboard.loader.length >= 1,
      dashboardNoFullTemario: dashboard.full.length === 0,
      dashboardNoChunks: dashboard.loadedChunks.length === 0,
      flashcardsCoreLoaded: flashcards.core.length >= 1,
      flashcardsNoLoader: flashcards.loader.length === 0,
      flashcardsNoFullTemario: flashcards.full.length === 0,
      flashcardsNoChunks: flashcards.loadedChunks.length === 0,
      hubNoStudyData: hub.studyData.length === 0,
      hubBlockedSameRequests: result.apps.hub.comparison.sameRequests,
      firstAreaOneChunk: firstArea.chunkRequests === 1,
      firstAreaNoFullTemario: firstArea.fullRequests === 0,
      sameAreaNoRepeat: firstArea.sameArea.chunkRequests === 1,
    };
    result.summary.ok = Object.values(result.checks).every(Boolean);

    if (!result.checks.dashboardCoreLoaded) result.notes.push("PENDIENTE DE INTEGRACIÓN (Fase 4): index.html no carga study-data/temario-core.js.");
    if (!result.checks.dashboardLoaderLoaded) result.notes.push("PENDIENTE DE INTEGRACIÓN (Fase 4): index.html no carga study-data/content-loader.js.");
    if (!result.checks.dashboardNoFullTemario) result.notes.push("El Dashboard sigue descargando temario.js completo al arrancar.");
    if (!result.checks.dashboardNoChunks) result.notes.push(`El Dashboard pide chunks de secciones al arrancar: ${dashboard.loadedChunks.map((entry) => entry.url).join(", ")}`);
    if (!result.checks.flashcardsCoreLoaded) result.notes.push("PENDIENTE DE INTEGRACIÓN (Fase 4): Study Flashcards no carga temario-core.js.");
    if (!result.checks.flashcardsNoLoader) result.notes.push("Study Flashcards carga content-loader.js sin necesitarlo.");
    if (!result.checks.flashcardsNoFullTemario) result.notes.push("Study Flashcards sigue descargando temario.js completo.");
    if (!result.checks.flashcardsNoChunks) result.notes.push(`Study Flashcards pide chunks: ${flashcards.loadedChunks.map((entry) => entry.url).join(", ")}`);
    if (!result.checks.hubNoStudyData) result.notes.push(`El HUB descarga study-data: ${hub.studyData.map((entry) => entry.url).join(", ")}`);
    if (!result.checks.hubBlockedSameRequests) result.notes.push("El conjunto de peticiones del HUB cambia al bloquear los assets de contenido (no debería usar ninguno).");
    if (!result.checks.firstAreaOneChunk) result.notes.push(`PENDIENTE DE INTEGRACIÓN (Fase 4): la ficha directa pidió ${firstArea.chunkRequests} chunks (se esperaba 1).`);
    if (!result.checks.firstAreaNoFullTemario) result.notes.push("La ficha directa pidió temario.js completo.");
    if (!result.checks.sameAreaNoRepeat) result.notes.push(`Una segunda ficha de la misma área repitió el chunk (${firstArea.sameArea.chunkRequests} peticiones).`);
    if (result.summary.ok) result.notes.push("Carga inicial sin el temario completo; core y primera área medidos.");
  } finally {
    try { if (page) await page.close(); } catch {}
    await chrome.stop().catch(() => {});
    await server.stop().catch(() => {});
  }

  result.summary.dashboardBeforeKb = result.apps.dashboard && result.apps.dashboard.before ? result.apps.dashboard.before.kb : null;
  result.summary.dashboardAfterKb = result.apps.dashboard && result.apps.dashboard.afterSummary ? result.apps.dashboard.afterSummary.kb : null;
  result.summary.flashcardsBeforeKb = result.apps.flashcards && result.apps.flashcards.before ? result.apps.flashcards.before.kb : null;
  result.summary.flashcardsAfterKb = result.apps.flashcards && result.apps.flashcards.afterSummary ? result.apps.flashcards.afterSummary.kb : null;
  result.summary.hubKb = result.apps.hub && result.apps.hub.after ? kb(result.apps.hub.after.transfer) : null;
  result.summary.coreKb = result.core ? result.core.kb : null;
  result.summary.firstAreaKb = result.firstArea ? result.firstArea.chunkKb : null;
  result.summary.firstAreaMs = result.firstArea ? (result.firstArea.readerMs != null ? result.firstArea.readerMs : result.firstArea.wallMs) : null;
  result.summary.temarioKb = kb(result.apps.temario ? (result.apps.temario.transfer || result.apps.temario.bytes) : 0);

  await writeFile(path.join(OUT_DIR, "peso-apps.json"), JSON.stringify(result, null, 2));
  await writeFile(path.join(OUT_DIR, "peso-apps.md"), renderMarkdown(result));
  if (!quiet) {
    console.log("\nPeso de apps — Fase 4 (H4)");
    console.log(`  Dashboard: ${result.summary.dashboardBeforeKb} KB antes → ${result.summary.dashboardAfterKb} KB después (${result.apps.dashboard.delta.kb} KB, ${result.apps.dashboard.delta.percent}%)`);
    console.log(`  Flashcards: ${result.summary.flashcardsBeforeKb} KB antes → ${result.summary.flashcardsAfterKb} KB después (${result.apps.flashcards.delta.kb} KB, ${result.apps.flashcards.delta.percent}%)`);
    console.log(`  HUB: ${result.summary.hubKb} KB · study-data: ${result.apps.hub.after.studyData.length}`);
    console.log(`  Core (core+loader): ${result.summary.coreKb} KB · primera área (chunk): ${result.summary.firstAreaKb} KB en ${result.summary.firstAreaMs} ms`);
    console.log(`  ${result.summary.ok ? "OK" : "FALLO"}: ${path.relative(ROOT, path.join(OUT_DIR, "peso-apps.json"))}`);
    for (const note of result.notes) console.log(`  - ${note}`);
  }
  return { ok: result.summary.ok, payload: result, file: path.join(OUT_DIR, "peso-apps.json") };
}

function renderMarkdown(payload) {
  const apps = payload.apps;
  const lines = [];
  lines.push("# Peso de apps y coste de H4 (Fase 4)");
  lines.push("");
  lines.push(`Generado por \`tools/qa/peso-apps.mjs\` el ${payload.generatedAt}.`);
  lines.push("");
  lines.push("## Método");
  lines.push("");
  lines.push("1. Medición real de cada portada con Chrome headless, servidor local, caché desactivada y `transferSize` de `performance.getEntriesByType(\"resource\")` mismo origen.");
  lines.push(`2. Línea base: se bloquean por CDP todos los assets de contenido (${payload.method.blockedForBaseline.map((item) => `\`${item}\``).join(", ")}) y se mide el resto de la app.`);
  lines.push(`3. A esa base se le suma la descarga real de \`temario.js\` (${payload.summary.temarioKb} KB) para reconstruir el arranque de Fase 3, que cargaba el temario completo en una sola petición.`);
  lines.push("4. La primera área se mide abriendo una ficha directa: debe pedir solo \`study-data/sections/<área>.js\`; una segunda ficha de la misma área no repite la petición.");
  lines.push("");
  lines.push("## Resultado");
  lines.push("");
  lines.push("| App | Antes (Fase 3, reconstruido) | Después (Fase 4) | Delta | Peticiones antes → después |");
  lines.push("|---|---:|---:|---:|---:|");
  lines.push(`| Study Dashboard | **${apps.dashboard.before.kb} KB** | **${apps.dashboard.afterSummary.kb} KB** | ${apps.dashboard.delta.kb} KB (${apps.dashboard.delta.percent}%) | ${apps.dashboard.before.requests} → ${apps.dashboard.afterSummary.requests} |`);
  lines.push(`| Study Flashcards | **${apps.flashcards.before.kb} KB** | **${apps.flashcards.afterSummary.kb} KB** | ${apps.flashcards.delta.kb} KB (${apps.flashcards.delta.percent}%) | ${apps.flashcards.before.requests} → ${apps.flashcards.afterSummary.requests} |`);
  lines.push(`| HUB | ${kb(apps.hub.after.transfer)} KB | ${kb(apps.hub.after.transfer)} KB | 0 KB | ${apps.hub.after.count} → ${apps.hub.after.count} |`);
  lines.push("");
  lines.push("## Coste de H4");
  lines.push("");
  lines.push(`- Core + loader al arrancar: **${payload.summary.coreKb} KB** (${payload.core.coreTransfer} B + ${payload.core.loaderTransfer} B), con ${payload.core.sheets} fichas y ${payload.core.cards} tarjetas de metadatos.`);
  lines.push(`- Primera área: **${payload.summary.firstAreaKb} KB** en **${payload.summary.firstAreaMs} ms** desde el arranque de la navegación (lector listo); ${payload.firstArea.sections} secciones de \`${payload.firstArea.areaId}\`; ${payload.firstArea.chunkRequests} petición(es).`);
  lines.push(`- Segunda ficha de la misma área: ${payload.firstArea.sameArea.chunkRequests} petición(es) de chunk (no repite).`);
  lines.push(`- \`temario.js\` completo que ya no se descarga al arrancar: **${payload.summary.temarioKb} KB**.`);
  lines.push("");
  lines.push("## Verificación");
  lines.push("");
  lines.push("| Comprobación | Resultado |");
  lines.push("|---|---|");
  for (const [key, value] of Object.entries(payload.checks)) lines.push(`| \`${key}\` | ${value ? "OK" : "**FALLA / PENDIENTE**"} |`);
  lines.push("");
  lines.push(`- Resultado global: **${payload.summary.ok ? "OK" : "FALLO / PENDIENTE DE INTEGRACIÓN"}**${payload.notes.length ? ` — ${payload.notes.join(" · ")}` : ""}`);
  lines.push("");
  lines.push("## Peticiones del arranque (Dashboard)");
  lines.push("");
  lines.push("| Recurso | Transferencia | Decodificado | ms |");
  lines.push("|---|---:|---:|---:|");
  for (const entry of apps.dashboard.after.entries) {
    lines.push(`| \`${entry.url}\` | ${kb(entry.transfer)} KB | ${kb(entry.decoded)} KB | ${entry.duration} |`);
  }
  lines.push("");
  lines.push("## Archivos de contenido");
  lines.push("");
  lines.push("| Archivo | Tamaño |");
  lines.push("|---|---:|");
  for (const file of payload.files) lines.push(`| \`${file.path}\` | ${file.missing ? "—" : `${file.kb} KB`} |`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("© 2026 ZARCONT — Evidencia interna de QA.");
  lines.push("");
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAppsWeight({ quiet: process.argv.includes("--quiet") })
    .then(({ ok }) => process.exit(ok ? 0 : 1))
    .catch((err) => {
      console.error("ERROR en peso-apps.mjs:", err && err.stack ? err.stack : err);
      process.exit(1);
    });
}
