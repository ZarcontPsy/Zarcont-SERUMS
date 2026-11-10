/* © 2026 ZARCONT — Auditoría axe-core real sobre las rutas del Study Dashboard.
 *
 * Cubre la Fase 0 y los estados nuevos de la Fase 1: búsqueda con resultados,
 * paleta Ctrl+K, barra de selección, ficha con subrayados/modo recordar,
 * confianza y pausa de recuerdo, hoja del índice y las rutas #/subrayados y
 * #/dudas. Añade las cinco rutas de la Fase 3: #/glosario, #/datos, #/trampas,
 * #/relampago y #/ultimo-dia, y los estados de Fase 4: carga y error de ficha
 * con el chunk del área retenido/fallido (H4), más la comprobación de H17.
 *
 * Usa Chrome headless por CDP y una copia local de axe-core
 * (tools/qa/vendor/axe.min.js, MPL-2.0, nunca se carga en la app).
 * Reutiliza el servidor y el cliente CDP del arnés tests/e2e/lib sin modificarlo.
 *
 * Uso directo:
 *   node tools/qa/axe-audit.mjs
 *
 * Salida: tools/qa/salida/axe.json (+ capturas de las violaciones).
 * Código 1 si hay violaciones WCAG A/AA o si la auditoría no pudo ejecutarse.
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../tests/e2e/lib/cdp.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = path.join(HERE, "salida");
const VENDOR_AXE = path.join(HERE, "vendor", "axe.min.js");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const SERVER_PORT = 8791;
const CDP_PORT = 9391;

const BASE_ROUTES = [
  { hash: "#/", name: "panel", label: "Panel" },
  { hash: "#/biblioteca", name: "biblioteca", label: "Biblioteca" },
  { hash: "#/progreso", name: "progreso", label: "Progreso" },
  { hash: "#/ficha/sheet-aps-01", name: "ficha", label: "Ficha sheet-aps-01" },
];

const PHASE1_ROUTES = [
  { hash: "#/subrayados", name: "subrayados", label: "Mis subrayados", optional: true, phase1: true },
  { hash: "#/dudas", name: "dudas", label: "Dudas pendientes", optional: true, phase1: true },
  { hash: "#/respaldo", name: "respaldo", label: "Respaldo y datos", optional: true },
];

const PHASE2_ROUTES = [
  { hash: "#/ruta", name: "ruta", label: "Ruta de hoy completa", optional: true, phase2: true },
  { hash: "#/plan", name: "plan", label: "Plan de estudio", optional: true, phase2: true },
  { hash: "#/dominio", name: "dominio", label: "Mapa de dominio", optional: true, phase2: true },
  { hash: "#/repaso", name: "repaso", label: "Repaso de fichas", optional: true, phase2: true },
];

const PHASE3_ROUTES = [
  { hash: "#/glosario", name: "glosario", label: "Glosario", optional: true, phase3: true },
  { hash: "#/datos", name: "datos", label: "Datos para memorizar", optional: true, phase3: true },
  { hash: "#/trampas", name: "trampas", label: "Trampas frecuentes", optional: true, phase3: true },
  { hash: "#/relampago", name: "relampago", label: "Repaso relámpago", optional: true, phase3: true },
  { hash: "#/ultimo-dia", name: "ultimo-dia", label: "Hoja de último día", optional: true, phase3: true },
];

const ROUTES = [...BASE_ROUTES, ...PHASE1_ROUTES, ...PHASE2_ROUTES, ...PHASE3_ROUTES];

const VIEWPORTS = [
  { id: "desktop-1440x900", width: 1440, height: 900, mobile: false, label: "Escritorio 1440×900" },
  { id: "movil-390x844", width: 390, height: 844, mobile: true, label: "Móvil 390×844" },
];

const THEMES = [
  { id: "dark", label: "oscuro" },
  { id: "light", label: "claro" },
];

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/* Fase 4 · H4: la ficha carga sus secciones por área. Para auditar el estado
 * de carga se retiene la petición del chunk con Fetch; para el error se falla
 * la petición retenida. El gate de la app es `.sheet-gate[role=status|alert]`. */
const FASE4_SHEET = { hash: "#/ficha/sheet-aps-01", name: "ficha", label: "Ficha sheet-aps-01" };
const FASE4_SECTION_GLOB = "*study-data/sections/*";

async function startSectionIntercept(page) {
  const paused = [];
  const off = page.conn.on("Fetch.requestPaused", (params) => {
    const url = params && params.request ? params.request.url : "";
    if (url.includes("/study-data/sections/")) {
      paused.push(params);
      return;
    }
    page.conn.send("Fetch.continueRequest", { requestId: params.requestId }).catch(() => {});
  });
  await page.conn.send("Fetch.enable", {
    patterns: [{ urlPattern: FASE4_SECTION_GLOB, requestStage: "Request" }],
  });
  return { paused, off };
}

async function stopSectionIntercept(page, handle) {
  try {
    await page.conn.send("Fetch.disable");
  } catch {}
  if (handle && handle.off) handle.off();
}

async function waitSheetGate(page, selector, timeout = 20000) {
  return page
    .waitFor(`(() => {
      const gates = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      return gates.some((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && !el.hidden && rect.width > 1 && rect.height > 1;
      });
    })()`, { timeout, message: `estado de ficha (${selector})` })
    .then(() => true)
    .catch(() => false);
}

async function h17Check(page) {
  return page.eval(`(() => {
    const body = (document.getElementById("view-root").innerText || "").replace(/\\s+/g, " ").trim();
    const normalized = body.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const stats = window.StudyStore && window.StudyStore.getDashboardStats ? window.StudyStore.getDashboardStats() : null;
    return {
      totalTopics: stats ? stats.totalTopics : null,
      totalSheets: stats ? stats.totalSheets : null,
      has85: /85\\s+temas/.test(normalized),
      has22: /22\\s+fichas\\s+oficiales/.test(normalized),
      has86Modules: /86\\s+modulos/.test(normalized),
      ok: !!stats && stats.totalTopics === 85 && stats.totalSheets === 210 && /85\\s+temas/.test(normalized) && /22\\s+fichas\\s+oficiales/.test(normalized) && !/86\\s+modulos/.test(normalized),
      text: body.slice(0, 220)
    };
  })()`);
}

async function injectAxe(page, source) {
  const has = await page.eval("typeof window.axe !== 'undefined' && !!window.axe.version");
  if (has) return page.eval("window.axe.version");
  // La fuente termina en un comentario de sourcemap: se añade una línea nueva.
  await page.eval(`${source}\n;0`, { timeout: 60000 });
  return page.eval("window.axe && window.axe.version");
}

async function axeRun(page) {
  return page.eval(
    `(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ${JSON.stringify(AXE_TAGS)} },
        resultTypes: ["violations", "incomplete"],
        elementRef: false
      });
      const simplify = (list) => list.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        description: v.description,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 12).map((n) => (n.target || []).join(" "))
      }));
      return {
        version: window.axe.version,
        url: location.href,
        violations: simplify(result.violations),
        incomplete: simplify(result.incomplete),
        passCount: result.passes ? result.passes.length : null
      };
    })()`,
    { timeout: 120000 },
  );
}

/* Los nodos que axe no puede resolver (fondo con degradado o superposición) se
   miden a mano en la página: color computado compuesto sobre la pila real de
   fondos. Se documenta el resultado; nunca sustituye un PASS de axe. */
const CONTRAST_PROBE = `(targets) => {
  const parse = (value) => {
    const m = String(value).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(/[,\\s\\/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some((n) => !isFinite(n))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] == null ? 1 : parts[3] };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: fg.a + bg.a * (1 - fg.a),
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
  const out = [];
  for (const target of targets) {
    let el = null;
    try { el = document.querySelector(target); } catch (e) { el = null; }
    if (!el) { out.push({ target, missing: true }); continue; }
    let node = el;
    let gradient = false;
    const chain = [];
    while (node) {
      chain.unshift(node);
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") gradient = true;
      node = node.parentElement;
    }
    let bg = { r: 0, g: 0, b: 0, a: 0 };
    for (const layerNode of chain) {
      const bgColor = parse(getComputedStyle(layerNode).backgroundColor);
      if (bgColor && bgColor.a > 0) bg = over(bgColor, bg);
    }
    if (bg.a < 0.999) bg = over(bg, { r: 255, g: 255, b: 255, a: 1 });
    const fg = parse(getComputedStyle(el).color) || { r: 0, g: 0, b: 0, a: 1 };
    const fgEffective = fg.a < 1 ? over(fg, bg) : fg;
    out.push({
      target,
      text: (el.innerText || "").trim().slice(0, 40),
      fg: hex(fgEffective),
      bg: hex(bg),
      ratio: Math.round(ratio(fgEffective, bg) * 100) / 100,
      gradient,
      decorative: !!(el.closest && el.closest('[aria-hidden="true"]')),
      min: 4.5,
      pass: ratio(fgEffective, bg) >= 4.5,
    });
  }
  return out;
}`;

async function probeIncompleteContrast(page, incomplete) {
  const targets = incomplete
    .filter((item) => item.id === "color-contrast")
    .flatMap((item) => item.targets)
    .filter(Boolean);
  const unique = [...new Set(targets)].slice(0, 80);
  if (!unique.length) return { checked: 0, failures: [], rows: [] };
  const rows = await page.eval(`(${CONTRAST_PROBE})(${JSON.stringify(unique)})`, { timeout: 30000 });
  const failures = rows.filter((row) => !row.missing && !row.gradient && row.decorative !== true && row.pass === false);
  return {
    checked: rows.length,
    failures,
    gradientNodes: rows.filter((row) => row.gradient).length,
    decorativeNodes: rows.filter((row) => row.decorative === true).length,
    rows,
  };
}

async function probeResources(page) {
  return page.eval(
    `(() => {
      let entries = [];
      try { entries = performance.getEntriesByType("resource"); } catch (e) {}
      return entries
        .filter((entry) => typeof entry.responseStatus === "number" && entry.responseStatus >= 400)
        .map((entry) => ({ url: entry.name.replace(location.origin, ""), status: entry.responseStatus }));
    })()`,
  );
}

async function waitAppRender(page, message) {
  await page.waitFor(
    `!document.getElementById('view-root').hidden && document.getElementById('view-root').innerText.trim().length > 20`,
    { timeout: 25000, message },
  );
}

async function routeUnavailable(page) {
  return page.eval(`(() => {
    const title = document.title || "";
    const text = (document.getElementById("view-root") || {}).innerText || "";
    return /no encontramos|página no encontrada|módulo no disponible/i.test(title + " " + text);
  })()`);
}

async function waitPhase3Ready(page) {
  await page.waitFor(`(() => {
    const root = document.querySelector('section[data-ref-view], section[data-plan-view="relampago"], section[data-plan-view="ultimo-dia"]');
    if (!root) return true;
    const loading = root.querySelector("[data-ref-loading], [data-quick-loading], [data-lastday-loading]");
    if (!loading) return true;
    const s = getComputedStyle(loading);
    const r = loading.getBoundingClientRect();
    return s.display === "none" || s.visibility === "hidden" || loading.hidden || r.height < 2;
  })()`, { timeout: 30000, message: "carga de la vista de Fase 3" }).catch(() => {});
  await sleep(320);
}

async function ensureTheme(page, themeId) {
  await page.eval(`window.StudyUI && window.StudyUI.applyTheme(${JSON.stringify(themeId)}), true`);
  await sleep(300);
}

async function pressCtrlK(page) {
  const conn = page.conn;
  await conn.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "k", code: "KeyK", modifiers: 2, windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75 });
  await conn.send("Input.dispatchKeyEvent", { type: "keyUp", key: "k", code: "KeyK", modifiers: 2, windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75 });
  await sleep(500);
}

async function pressEscape(page) {
  await page.conn.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await page.conn.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
  await sleep(320);
}

async function typeInto(page, selector, value) {
  const ok = await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.focus(); if (el.select) el.select(); return true; })()`);
  if (!ok) return false;
  await page.conn.send("Input.insertText", { text: value });
  await sleep(400);
  return true;
}

/* ------------------------------------------------------------------------- */
/* Preparación de estados                                                    */
/* ------------------------------------------------------------------------- */

async function clearProgress(page) {
  await page.eval(`window.StudyStore && window.StudyStore.clearAllProgress ? (window.StudyStore.clearAllProgress({ confirm: true }), true) : false`);
  await sleep(450);
}

async function seedActiveState(page) {
  await page.eval(`(() => {
    const store = window.StudyStore;
    if (!store) return false;
    const sheetId = "sheet-aps-01";
    const sheet = window.STUDY_CONTENT.sheets.find((s) => s.id === sheetId);
    const section = sheet && sheet.sections && sheet.sections[0] ? sheet.sections[0] : { title: "Sección 1", body: ["Texto"] };
    const existing = store.annotations.list({ sheetId: sheetId })[0];
    if (!existing) {
      store.annotations.add({
        sheetId: sheetId,
        sectionIndex: 0,
        sectionTitle: section.title || "Sección 1",
        paragraphIndex: 0,
        color: "important",
        quote: String((section.body && section.body[0]) || "Cita de QA para la auditoría de contraste.").slice(0, 180),
        prefix: "",
        suffix: "",
        note: "Nota de QA con subrayado y confianza."
      });
    }
    if (store.doubts.list({ resolved: false }).length === 0) {
      store.doubts.add({
        sheetId: sheetId,
        sectionIndex: 0,
        paragraphIndex: 0,
        quote: "Cita de duda para la auditoría",
        note: "Duda de QA",
        annotationId: (store.annotations.list({ sheetId: sheetId })[0] || {}).id || null
      });
    }
    if (!store.sheetConfidence.get(sheetId)) store.sheetConfidence.set(sheetId, "partial");
    try {
      localStorage.setItem("study-active-prefs-v1", JSON.stringify({ version: 1, recallPause: true, recallEvery: 1, shortcuts: true }));
    } catch (e) {}
    return true;
  })()`);
  await sleep(400);
}

async function markSheetCompleted(page) {
  return page.eval(`(() => {
    const btn = document.querySelector('[data-action="toggle-complete"]');
    if (!btn) return false;
    if (btn.getAttribute("aria-pressed") !== "true") btn.click();
    return true;
  })()`);
}

async function openRecallMode(page) {
  const clicked = await page.eval(`(() => {
    const scope = document.querySelector(".reader-concepts");
    if (!scope) return false;
    const nodes = Array.from(scope.querySelectorAll("button"));
    const re = /recordar|memoria/i;
    for (const el of nodes) {
      const name = ((el.getAttribute("aria-label") || "") + " " + (el.innerText || "")).trim();
      if (re.test(name)) { el.click(); return true; }
    }
    return false;
  })()`);
  await sleep(500);
  return clicked;
}

async function openSelectionBar(page) {
  const clicked = await page.eval(`(() => {
    const btn = document.querySelector('[data-ac-action="paragraph:open"]');
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  await sleep(500);
  return clicked;
}

async function findRecallPause(page) {
  const present = await page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`);
  if (present) return true;
  await page.eval(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" }), true`);
  await sleep(500);
  return page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`);
}

/* ------------------------------------------------------------------------- */
/* Ejecución                                                                 */
/* ------------------------------------------------------------------------- */

export async function runAxeAudit({ quiet = false, outDir = OUT_DIR } = {}) {
  await mkdir(path.join(outDir, "capturas"), { recursive: true });
  const axeSource = await readFile(VENDOR_AXE, "utf8");
  const profileRoot = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-axe-"));

  const server = new StaticServer({ root: ROOT, port: SERVER_PORT, python: PYTHON });
  await server.start();
  const chrome = new Chrome({
    chromePath: CHROME,
    userDataDir: path.join(profileRoot, "profile"),
    port: CDP_PORT,
  });

  const runs = [];
  const failures = [];
  const pending = [];
  let h17 = null;
  let environment = {};
  let page = null;

  try {
    const info = await chrome.start();
    environment = {
      browser: info && info.Browser,
      server: server.baseURL,
      axe: "local vendor/axe.min.js",
      profileRoot,
    };
    const conn = await chrome.newTarget("about:blank");
    page = new Page(conn, { browser: chrome, port: CDP_PORT });
    await page.init();

    const auditRun = async ({ route, state, theme, viewport, pointer, label, shotPrefix }) => {
      await ensureTheme(page, theme.id);
      const version = await injectAxe(page, axeSource);
      const started = Date.now();
      const result = await axeRun(page);
      const elapsed = Date.now() - started;
      const manualContrast = await probeIncompleteContrast(page, result.incomplete).catch(() => ({ checked: 0, failures: [], rows: [] }));
      const resources = await probeResources(page).catch(() => []);
      const reviewRequired = result.incomplete
        .filter((item) => item.id !== "color-contrast")
        .map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes, targets: item.targets }));
      const shotBase = `axe-${(shotPrefix || route.name) + "-" + (state === "base" ? "" : state + "-")}${theme.id}-${viewport.id}`.replace(/--+/g, "-");
      let shot = null;
      if (result.violations.length) {
        shot = path.posix.join("tools/qa/salida/capturas", `${shotBase}.png`);
        await page.screenshot(path.join(outDir, "capturas", `${shotBase}.png`)).catch(() => {});
      }
      const run = {
        route: route.hash,
        routeLabel: state === "base" ? route.label : `${route.label} (${label})`,
        state,
        stateLabel: state === "base" ? "base" : label,
        theme: theme.id,
        viewport: viewport.id,
        viewportLabel: viewport.label,
        width: viewport.width,
        height: viewport.height,
        mobile: viewport.mobile,
        pointer,
        axeVersion: version,
        title: await page.eval("document.title"),
        navigations: 0,
        violations: result.violations,
        incomplete: result.incomplete,
        manualContrast,
        reviewRequired,
        resources,
        elapsedMs: elapsed,
        screenshot: shot,
      };
      runs.push(run);
      for (const violation of result.violations) {
        failures.push({
          route: route.hash,
          state,
          theme: theme.id,
          viewport: viewport.id,
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes,
          targets: violation.targets,
          screenshot: shot,
        });
      }
      if (!quiet) {
        const tag = result.violations.length ? "FALLA" : "OK";
        console.log(
          `[${tag}] ${route.hash}${state === "base" ? "" : " · " + state} · ${theme.id} · ${viewport.id}: ${result.violations.length} violaciones, ${result.incomplete.length} incompletas (${elapsed} ms)`,
        );
        for (const v of result.violations) console.log(`    - ${v.id} (${v.impact}) × ${v.nodes}: ${v.targets.join(" | ")}`);
      }
    };

    for (const viewport of VIEWPORTS) {
      await page.viewport(viewport.width, viewport.height, { mobile: viewport.mobile });
      await conn.send("Emulation.setTouchEmulationEnabled", {
        enabled: viewport.mobile,
        maxTouchPoints: viewport.mobile ? 5 : 1,
      });
      const pointer = await page.eval(
        `({ coarse: matchMedia('(pointer: coarse)').matches, hoverNone: matchMedia('(hover: none)').matches })`,
      );

      // Punto de partida sin actividad: estados vacíos reales.
      await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 900 });
      await waitAppRender(page, "arranque del Dashboard");
      await clearProgress(page);

      /* --- Rutas de Fase 1, Fase 2 y Fase 3 (pueden no estar registradas todavía) --- */
      for (const route of [...PHASE1_ROUTES, ...PHASE2_ROUTES, ...PHASE3_ROUTES]) {
        await page.goto(`${server.baseURL}/study-dashboard/index.html${route.hash}`, { settle: viewport.mobile ? 900 : 750 });
        await waitAppRender(page, `render de ${route.name}`);
        if (route.optional && (await routeUnavailable(page))) {
          pending.push({
            route: route.hash,
            reason: route.phase3
              ? "La ruta de la Fase 3 todavía no está registrada (vista reference / plan.relámpago / plan.lastday ausente); se auditará en cuanto exista."
              : route.phase2
                ? "La ruta de la Fase 2 todavía no está registrada (vista plan.* ausente); se auditará en cuanto exista."
                : route.phase1
                  ? "La ruta de la Fase 1 todavía no está registrada (módulo active ausente); se auditará en cuanto exista."
                  : "La ruta todavía no está registrada; el runner queda preparado y la auditará en cuanto exista.",
            title: await page.eval("document.title"),
            viewport: viewport.id,
          });
          if (!quiet) console.log(`[PENDIENTE] ${route.hash} — ruta sin módulo integrado (${viewport.id}).`);
          continue;
        }
        if (route.phase3) await waitPhase3Ready(page);
        for (const theme of THEMES) {
          const title = await page.eval("document.title");
          const nav = 0;
          await auditRun({ route, state: "base", theme, viewport, pointer, label: "base", shotPrefix: route.name });
          const last = runs[runs.length - 1];
          last.title = title;
          last.navigations = nav;
        }
      }

      /* --- Rutas de la Fase 0 --- */
      for (const route of BASE_ROUTES) {
        await page.goto(`${server.baseURL}/study-dashboard/index.html${route.hash}`, { settle: viewport.mobile ? 900 : 750 });
        await waitAppRender(page, `render de ${route.name}`);
        for (const theme of THEMES) {
          await auditRun({ route, state: "base", theme, viewport, pointer, label: "base", shotPrefix: route.name });
        }
      }

      /* H17: el Panel y la Biblioteca de esta matriz ya auditan el copy nuevo;
         se comprueba el conteo editorial una sola vez y se documenta. */
      if (!h17) {
        await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 900 });
        await waitAppRender(page, "panel para H17");
        h17 = await h17Check(page);
        if (!h17.ok) {
          pending.push({
            route: "#/",
            reason: `H17 pendiente: totalTopics=${h17.totalTopics}, 85 temas=${h17.has85}, 22 fichas oficiales=${h17.has22}, «86 módulos»=${h17.has86Modules}.`,
            viewport: viewport.id,
          });
        }
      }

      /* --- Estado real del lector: guardada y completada (Fase 0) --- */
      await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-aps-01`, { settle: 900 });
      await waitAppRender(page, "ficha para estado guardada/completada");
      await page.eval(`(() => {
        const fav = document.querySelector('[data-action="toggle-favorite"]');
        if (fav && fav.getAttribute("aria-pressed") === "false") fav.click();
        const done = document.querySelector('[data-action="toggle-complete"]');
        if (done && done.getAttribute("aria-pressed") === "false") done.click();
        return true;
      })()`);
      await sleep(700);
      for (const theme of THEMES) {
        await auditRun({
          route: BASE_ROUTES[3],
          state: "guardada-completada",
          theme,
          viewport,
          pointer,
          label: "guardada y completada",
          shotPrefix: "ficha-guardada",
        });
      }

      /* --- Fase 1: datos reales y estados abiertos --- */
      const activeReady = await page.eval(`!!document.querySelector('[data-ac-action="paragraph:open"]')`);
      const navReady = await page.eval(`!!(window.StudyNav && window.StudyNav.search && window.StudyNav.palette && window.StudyNav.sections)`);
      await seedActiveState(page);

      if (activeReady) {
        // Ficha con subrayado + confianza + modo recordar.
        await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-aps-01`, { settle: 1000 });
        await waitAppRender(page, "ficha activa");
        await markSheetCompleted(page);
        await sleep(700);
        await openRecallMode(page);
        await findRecallPause(page).catch(() => {});
        for (const theme of THEMES) {
          await auditRun({
            route: BASE_ROUTES[3],
            state: "activa",
            theme,
            viewport,
            pointer,
            label: "subrayados, confianza y modo recordar",
            shotPrefix: "ficha-activa",
          });
        }
        if (await page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`)) {
          for (const theme of THEMES) {
            await auditRun({
              route: BASE_ROUTES[3],
              state: "pausa-recuerdo",
              theme,
              viewport,
              pointer,
              label: "pausa de recuerdo",
              shotPrefix: "ficha-pausa",
            });
          }
        } else {
          pending.push({ route: "#/ficha/sheet-aps-01", reason: "La pausa de recuerdo no aparece con frecuencia 1 en este estado; su contraste se revisa con el componente en el informe.", viewport: viewport.id });
        }

        // Barra de selección abierta.
        if (await openSelectionBar(page)) {
          for (const theme of THEMES) {
            await auditRun({
              route: BASE_ROUTES[3],
              state: "barra-seleccion",
              theme,
              viewport,
              pointer,
              label: "barra de selección",
              shotPrefix: "ficha-barra",
            });
          }
          await page.eval(`(() => {
            const cancel = document.querySelector('[data-ac-action="selection:cancel"], [data-ac-action="selection:close"]');
            if (cancel) cancel.click();
            return true;
          })()`);
          await sleep(350);
        } else {
          pending.push({ route: "#/ficha/sheet-aps-01", reason: "No se pudo abrir la barra de selección por párrafo en este estado.", viewport: viewport.id });
        }
      } else {
        pending.push({
          route: "#/ficha/sheet-aps-01",
          reason: "Lectura activa sin integrar (sin [data-ac-action=\"paragraph:open\"]); los estados de subrayado, barra, pausa y confianza quedan pendientes.",
          viewport: viewport.id,
        });
      }

      // Rutas de la Fase 1 con datos reales.
      for (const route of PHASE1_ROUTES.filter((item) => item.phase1)) {
        await page.goto(`${server.baseURL}/study-dashboard/index.html${route.hash}`, { settle: 900 });
        await waitAppRender(page, `render con datos de ${route.name}`);
        if (await routeUnavailable(page)) {
          pending.push({ route: route.hash, reason: "Ruta aún sin módulo; estado con datos no auditado.", viewport: viewport.id });
          continue;
        }
        for (const theme of THEMES) {
          await auditRun({ route, state: "con-datos", theme, viewport, pointer, label: "con datos reales", shotPrefix: route.name + "-datos" });
        }
      }

      // Panel con el resumen de lectura activa.
      if (activeReady) {
        await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 1000 });
        await waitAppRender(page, "panel con actividad");
        for (const theme of THEMES) {
          await auditRun({
            route: BASE_ROUTES[0],
            state: "con-actividad",
            theme,
            viewport,
            pointer,
            label: "Ruta de hoy y resumen activo",
            shotPrefix: "panel-actividad",
          });
        }
      }

      // Búsqueda con resultados + paleta Ctrl+K.
      if (navReady) {
        await page.goto(`${server.baseURL}/study-dashboard/index.html#/biblioteca`, { settle: 900 });
        await waitAppRender(page, "biblioteca para búsqueda");
        let focused = true;
        try {
          // Clic real: el foco programático no dispara focusin en headless.
          await page.click("[data-library-search-input]", { timeout: 8000 });
        } catch {
          focused = false;
        }
        if (focused) {
          await page.waitFor(`window.StudyDerived && window.StudyDerived.state("search") === "ready"`, { timeout: 60000, message: "índice para la auditoría" }).catch(() => {});
          await typeInto(page, "[data-library-search-input]", "vacunacion");
          await page.waitFor(`document.querySelectorAll("[data-navx-result]").length > 0`, { timeout: 20000, message: "resultados para axe" }).catch(() => {});
          if (await page.eval(`document.querySelectorAll("[data-navx-result]").length > 0`)) {
            for (const theme of THEMES) {
              await auditRun({
                route: BASE_ROUTES[1],
                state: "busqueda-resultados",
                theme,
                viewport,
                pointer,
                label: "búsqueda con resultados",
                shotPrefix: "biblioteca-busqueda",
              });
            }
          } else {
            pending.push({ route: "#/biblioteca", reason: "La búsqueda no devolvió resultados en la auditoría; estado no auditado.", viewport: viewport.id });
          }
        }

        await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 800 });
        await waitAppRender(page, "panel para la paleta");
        await page.eval(`document.activeElement && document.activeElement.blur(), true`);
        await pressCtrlK(page);
        if (await page.eval(`!!document.querySelector('.navx-palette-layer[data-state="open"]')`)) {
          for (const theme of THEMES) {
            await auditRun({
              route: BASE_ROUTES[0],
              state: "paleta",
              theme,
              viewport,
              pointer,
              label: "paleta Ctrl+K",
              shotPrefix: "paleta",
            });
          }
          await pressEscape(page);
        } else {
          pending.push({ route: "#/", reason: "Ctrl+K no abrió la paleta en la auditoría; estado no auditado.", viewport: viewport.id });
        }
      } else {
        pending.push({ route: "#/biblioteca", reason: "Búsqueda de navegación sin integrar; estados de resultados y paleta quedan pendientes.", viewport: viewport.id });
      }

      // Hoja del índice (solo móvil, donde el índice es hoja inferior).
      if (viewport.mobile && navReady) {
        await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-aps-01`, { settle: 950 });
        await waitAppRender(page, "ficha para la hoja del índice");
        const opened = await page.eval(`(() => {
          const toggle = document.querySelector('[data-module-mount="reader-index"] .navx-sections-toggle');
          if (!toggle) return false;
          toggle.click();
          return true;
        })()`);
        await sleep(550);
        if (opened && (await page.eval(`!!document.querySelector(".navx-sections-panel:not([hidden])")`))) {
          for (const theme of THEMES) {
            await auditRun({
              route: BASE_ROUTES[3],
              state: "hoja-indice",
              theme,
              viewport,
              pointer,
              label: "hoja del índice",
              shotPrefix: "ficha-indice",
            });
          }
          await pressEscape(page);
        } else {
          pending.push({ route: "#/ficha/sheet-aps-01", reason: "La hoja móvil del índice no se pudo abrir; estado no auditado.", viewport: viewport.id });
        }
      }

      /* --- Fase 2: rutas de planificación con datos y estados --- */
      const plan2Ready = await page.eval(`!!(window.StudyPlanRuntime && window.StudyPlanRuntime.ensureModel)`);
      if (plan2Ready) {
        await page.eval(`(() => {
          const s = window.StudyStore;
          if (s.plan && s.plan.get && !s.plan.get()) {
            const areaId = (() => {
              try {
                if (window.StudyTaxonomy && typeof window.StudyTaxonomy.primaryAreas === "function") {
                  const areas = window.StudyTaxonomy.primaryAreas();
                  if (areas && areas[0]) return areas[0].id;
                }
              } catch (e) {}
              return null;
            })();
            s.plan.save({ examDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10), minutesPerDay: 45, daysPerWeek: 6, areaPriority: areaId ? (() => { const o = {}; o[areaId] = 2; return o; })() : {} });
          }
          const sheets = (window.STUDY_CONTENT && window.STUDY_CONTENT.sheets) || [];
          sheets.slice(0, 3).forEach((sheet) => {
            try {
              if (!s.sheetConfidence.get(sheet.id)) s.sheetConfidence.set(sheet.id, "partial");
              const st = s.getSheetState(sheet.id);
              if (!(st && st.completedAt)) s.toggleSheetComplete(sheet.id);
            } catch (e) {}
          });
          sheets.slice(4, 6).forEach((sheet) => {
            try {
              s.sheetConfidence.set(sheet.id, "weak");
              s.sheetReview.save({
                sheetId: sheet.id,
                dueAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                intervalDays: 2,
                lastReviewedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                source: "confidence"
              });
            } catch (e) {}
          });
          return true;
        })()`);
        await sleep(500);

        const phase2States = [
          { route: "#/ruta", name: "ruta", label: "ruta con plan y resumen semanal", state: "con-plan", shot: "ruta-con-plan" },
          { route: "#/plan", name: "plan", label: "editor con plan guardado", state: "con-plan", shot: "plan-con-plan" },
          { route: "#/dominio", name: "dominio", label: "dominio con señales", state: "con-datos", shot: "dominio-con-datos" },
          { route: "#/repaso", name: "repaso", label: "repaso con vencimientos", state: "con-repasos", shot: "repaso-con-repasos" },
        ];
        for (const item of phase2States) {
          await page.goto(`${server.baseURL}/study-dashboard/index.html${item.route}`, { settle: viewport.mobile ? 1000 : 900 });
          await waitAppRender(page, `render de ${item.name}`);
          if (await routeUnavailable(page)) {
            pending.push({ route: item.route, reason: `La vista ${item.name} no está registrada; estado ${item.state} pendiente.`, viewport: viewport.id });
            continue;
          }
          await page.waitFor(`(() => {
            const root = document.querySelector('section[data-plan-view]');
            return root && !root.querySelector('[data-plan-loading]');
          })()`, { timeout: 30000, message: `carga de ${item.name}` }).catch(() => {});
          for (const theme of THEMES) {
            await auditRun({
              route: { hash: item.route, name: item.name, label: item.label },
              state: item.state,
              theme,
              viewport,
              pointer,
              label: item.label,
              shotPrefix: item.shot,
            });
          }
        }

        // Hoja «Más» con el grupo de Planificación (solo móvil).
        if (viewport.mobile) {
          await page.goto(`${server.baseURL}/study-dashboard/index.html#/`, { settle: 900 });
          await waitAppRender(page, "panel para Más");
          const opened = await page.eval(`(() => {
            const btn = document.querySelector('[data-action="more-open"]');
            if (!btn) return false;
            btn.click();
            return true;
          })()`);
          await sleep(450);
          if (opened && (await page.eval(`!document.getElementById("dash-more-panel").hidden`))) {
            for (const theme of THEMES) {
              await auditRun({
                route: BASE_ROUTES[0],
                state: "mas-planificacion",
                theme,
                viewport,
                pointer,
                label: "Más con Planificación",
                shotPrefix: "mas-planificacion",
              });
            }
            await pressEscape(page);
          } else {
            pending.push({ route: "#/", reason: "No se pudo abrir Más para auditar el grupo Planificación.", viewport: viewport.id });
          }
        }
      } else {
        pending.push({
          route: "#/ruta",
          reason: "plan.runtime.js no está cargado; los estados de planificación quedan pendientes.",
          viewport: viewport.id,
        });
      }

      /* --- Fase 4 · H4: ficha con el chunk retenido y con el chunk fallido --- */
      let intercept = null;
      try {
        intercept = await startSectionIntercept(page);
        const target = `${server.baseURL}/study-dashboard/index.html?qa=fase4-axe-${Date.now()}#/ficha/sheet-aps-01`;
        await page.goto(target, { wait: "none", settle: 450 });
        const loadingReady = await waitSheetGate(page, '.sheet-gate[role="status"], [data-sheet-loading]', 20000);
        if (!loadingReady) {
          pending.push({
            route: FASE4_SHEET.hash,
            reason: "PENDIENTE DE INTEGRACIÓN (Fase 4): la ficha no muestra estado de carga visible (.sheet-gate[role=status]) mientras el chunk está retenido.",
            viewport: viewport.id,
          });
        } else {
          for (const theme of THEMES) {
            await ensureTheme(page, theme.id);
            await auditRun({
              route: FASE4_SHEET,
              state: "fase4-carga",
              theme,
              viewport,
              pointer,
              label: "ficha con chunk retenido (loading)",
              shotPrefix: "ficha-carga",
            });
          }
          if (intercept.paused.length) {
            await conn.send("Fetch.failRequest", { requestId: intercept.paused[0].requestId, errorReason: "Failed" }).catch(() => {});
          }
          const errorReady = await waitSheetGate(page, '.sheet-gate[role="alert"], [data-sheet-error]', 15000);
          if (!errorReady) {
            pending.push({
              route: FASE4_SHEET.hash,
              reason: "PENDIENTE DE INTEGRACIÓN (Fase 4): el fallo del chunk no muestra error accesible (.sheet-gate[role=alert]).",
              viewport: viewport.id,
            });
          } else {
            for (const theme of THEMES) {
              await ensureTheme(page, theme.id);
              await auditRun({
                route: FASE4_SHEET,
                state: "fase4-error",
                theme,
                viewport,
                pointer,
                label: "ficha con chunk fallido (error + Reintentar)",
                shotPrefix: "ficha-error",
              });
            }
          }
        }
      } catch (error) {
        pending.push({
          route: FASE4_SHEET.hash,
          reason: `La auditoría de loading/error de Fase 4 no se completó: ${error && error.message ? error.message : error}`,
          viewport: viewport.id,
        });
      } finally {
        await stopSectionIntercept(page, intercept);
      }
    }
  } finally {
    try { if (page) await page.close(); } catch {}
    await chrome.stop().catch(() => {});
    await server.stop().catch(() => {});
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "tools/qa/axe-audit.mjs",
    axe: { file: "tools/qa/vendor/axe.min.js", license: "MPL-2.0 (tools/qa/vendor/axe.LICENSE.txt)", tags: AXE_TAGS },
    environment,
    summary: {
      runs: runs.length,
      violationTypes: [...new Set(failures.map((f) => f.id))],
      violations: failures.length,
      nodes: failures.reduce((n, f) => n + f.nodes, 0),
      pending: pending.length,
      states: [...new Set(runs.filter((r) => r.state !== "base").map((r) => r.state))],
      manualContrastChecked: runs.reduce((n, r) => n + (r.manualContrast ? r.manualContrast.checked : 0), 0),
      manualContrastFailures: runs.reduce((n, r) => n + (r.manualContrast ? r.manualContrast.failures.length : 0), 0),
      manualContrastDecorative: runs.reduce((n, r) => n + (r.manualContrast ? (r.manualContrast.decorativeNodes || 0) : 0), 0),
      reviewRequired: [...new Set(runs.flatMap((r) => (r.reviewRequired || []).map((item) => item.id)))],
      missingResources: [...new Set(runs.flatMap((r) => (r.resources || []).map((item) => item.url)))],
      h17Ok: !!(h17 && h17.ok),
      ok: failures.length === 0 && runs.length > 0,
    },
    h17,
    pending,
    failures,
    runs,
  };
  await writeFile(path.join(outDir, "axe.json"), JSON.stringify(payload, null, 2));
  await writeFile(path.join(outDir, "axe.md"), renderAxeMarkdown(payload));

  if (!quiet) {
    console.log(
      `\naxe: ${payload.summary.runs} auditorías · ${payload.summary.violationTypes.length} tipos de violación · ${payload.summary.nodes} nodos · ${pending.length} pendientes · estados: ${payload.summary.states.join(", ") || "—"}`,
    );
    console.log(`  JSON: ${path.relative(ROOT, path.join(outDir, "axe.json"))}`);
  }
  return { ok: payload.summary.ok, payload, file: path.join(outDir, "axe.json") };
}

function renderAxeMarkdown(payload) {
  const lines = [];
  lines.push("# Auditoría axe-core — Study Dashboard");
  lines.push("");
  lines.push(`Generado por \`tools/qa/axe-audit.mjs\` el ${payload.generatedAt} con axe-core local \`${payload.axe.file}\` (${payload.axe.license}).`);
  lines.push("");
  lines.push("Reglas ejecutadas: " + payload.axe.tags.map((t) => `\`${t}\``).join(", ") + ".");
  lines.push("");
  lines.push("## Resumen");
  lines.push("");
  lines.push(`- Auditorías ejecutadas: **${payload.summary.runs}**`);
  lines.push(`- Estados abiertos auditados: ${payload.summary.states.length ? payload.summary.states.map((s) => `\`${s}\``).join(", ") : "—"}`);
  lines.push(`- Tipos de violación: **${payload.summary.violationTypes.length}** ${payload.summary.violationTypes.length ? `(${payload.summary.violationTypes.join(", ")})` : ""}`);
  lines.push(`- Nodos afectados: **${payload.summary.nodes}**`);
  lines.push(`- Rutas pendientes de integración: **${payload.summary.pending}**`);
  lines.push(`- H17 (85 temas + 22 fichas oficiales, sin «86 módulos»): **${payload.summary.h17Ok ? "OK" : "PENDIENTE"}**${payload.h17 ? ` — totalTopics=${payload.h17.totalTopics}, 85=${payload.h17.has85}, 22=${payload.h17.has22}, 86Módulos=${payload.h17.has86Modules}` : ""}`);
  lines.push(`- Nodos \`color-contrast\` que axe dejó incompletos y se midieron a mano: **${payload.summary.manualContrastChecked}** (fallos: ${payload.summary.manualContrastFailures}; decorativos \`aria-hidden\` exentos: ${payload.summary.manualContrastDecorative || 0}; los fondos con degradado se revisan por token en \`contraste.md\`)`);
  if (payload.summary.reviewRequired.length) {
    lines.push(`- Reglas incompletas que requieren revisión manual: ${payload.summary.reviewRequired.map((id) => `\`${id}\``).join(", ")}`);
  }
  lines.push(`- Resultado: **${payload.summary.ok ? "OK" : "FALLO"}**`);
  lines.push("");
  if (payload.failures.length) {
    lines.push("## Violaciones");
    lines.push("");
    lines.push("| Ruta | Estado | Tema | Viewport | Regla | Impacto | Nodos | Objetivos |");
    lines.push("|---|---|---|---|---|---|---:|---|");
    for (const f of payload.failures) {
      lines.push(`| \`${f.route}\` | ${f.state} | ${f.theme} | ${f.viewport} | \`${f.id}\` | ${f.impact} | ${f.nodes} | ${f.targets.join("<br>")} |`);
    }
    lines.push("");
  }
  if (payload.pending.length) {
    lines.push("## Pendiente de integración");
    lines.push("");
    for (const item of payload.pending) lines.push(`- \`${item.route}\` (${item.viewport || "—"}): ${item.reason}`);
    lines.push("");
  }
  if (payload.summary.missingResources.length) {
    lines.push("## Recursos 404 observados durante la auditoría");
    lines.push("");
    for (const url of payload.summary.missingResources) lines.push(`- \`${url}\``);
    lines.push("");
  }
  const withManual = payload.runs.filter((run) => run.manualContrast && run.manualContrast.checked);
  if (withManual.length) {
    lines.push("## Nodos incompletos de `color-contrast` medidos a mano");
    lines.push("");
    lines.push("| Ruta | Estado | Tema | Viewport | Medidos | Fallos (sin degradado) | Degradados |");
    lines.push("|---|---|---|---|---|---:|---:|");
    for (const run of withManual) {
      lines.push(
        `| \`${run.route}\` | ${run.state} | ${run.theme} | ${run.viewport} | ${run.manualContrast.checked} | ${run.manualContrast.failures.length} | ${run.manualContrast.gradientNodes || 0} |`,
      );
    }
    lines.push("");
    const failures = payload.runs.flatMap((run) => (run.manualContrast ? run.manualContrast.failures : []));
    if (failures.length) {
      lines.push("Fallos detectados en la medición manual:");
      lines.push("");
      for (const row of failures) {
        lines.push(`- \`${row.target}\`: ${row.ratio}:1 (${row.fg} sobre ${row.bg})`);
      }
      lines.push("");
    }
  }
  if (payload.summary.reviewRequired.length) {
    lines.push("## Revisión manual pendiente (reglas incompletas)");
    lines.push("");
    for (const run of payload.runs) {
      for (const item of run.reviewRequired || []) {
        lines.push(`- \`${run.route}\` (${run.state}, ${run.theme}/${run.viewport}): \`${item.id}\` × ${item.nodes} — ${item.targets.join("<br>")}`);
      }
    }
    lines.push("");
  }
  lines.push("## Matriz ejecutada");
  lines.push("");
  lines.push("| Ruta | Estado | Tema | Viewport | Violaciones | Incompletas | ms | Captura |");
  lines.push("|---|---|---|---|---:|---:|---:|---|");
  for (const run of payload.runs) {
    lines.push(
      `| \`${run.route}\` | ${run.state} | ${run.theme} | ${run.viewport} | ${run.violations.length} | ${run.incomplete.length} | ${run.elapsedMs} | ${run.screenshot ? `\`${run.screenshot}\`` : "—"} |`,
    );
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("© 2026 ZARCONT — Evidencia interna de QA.");
  lines.push("");
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAxeAudit({ quiet: process.argv.includes("--quiet") })
    .then(({ ok }) => process.exit(ok ? 0 : 1))
    .catch((err) => {
      console.error("ERROR en axe-audit.mjs:", err && err.stack ? err.stack : err);
      process.exit(1);
    });
}
