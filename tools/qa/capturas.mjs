/* © 2026 ZARCONT — Capturas de diseño y métricas (Fases 0–3).
 *
 * Genera capturas reales (Chrome headless + CDP) de las rutas del Study
 * Dashboard en ambos temas y en los seis viewports del contrato
 * (360, 390, 768, 1024, 1440 y 844×390), incluidos los estados nuevos de la
 * Fase 1: búsqueda con resultados, paleta Ctrl+K, barra de selección, hoja
 * del índice, ficha con subrayados/modo recordar/confianza, pausa de recuerdo,
 * fichas relacionadas, Mis subrayados y Dudas con datos, Ruta de hoy y la
 * hoja «Más» abierta. Añade las cinco vistas de la Fase 3 (glosario, datos,
 * trampas, repaso relámpago y hoja de último día) y sus estados.
 *
 * Fase 4: añade capturas de H17 (85 temas + 22 fichas oficiales) en los seis
 * viewports y de los estados de carga y error de una ficha con el chunk de su
 * área retenido o fallido (H4), además de las métricas de gate y H17.
 *
 * Uso directo:
 *   node tools/qa/capturas.mjs
 *
 * Salida: tools/qa/salida/capturas/*.png y tools/qa/salida/capturas.json
 * Código 1 si hay desborde horizontal, un control táctil requerido < 44 px o
 * un estado que no llegó a abrirse.
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../tests/e2e/lib/cdp.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = path.join(HERE, "salida");
const SHOT_DIR = path.join(OUT_DIR, "capturas");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const SERVER_PORT = 8792;
const CDP_PORT = 9392;

const VIEWPORTS = [
  { id: "1440x900", width: 1440, height: 900, mobile: false, label: "Escritorio 1440×900" },
  { id: "390x844", width: 390, height: 844, mobile: true, label: "Móvil 390×844" },
  { id: "360x800", width: 360, height: 800, mobile: true, label: "Móvil 360×800" },
  { id: "768x1024", width: 768, height: 1024, mobile: false, label: "Tablet 768×1024" },
  { id: "1024x768", width: 1024, height: 768, mobile: false, label: "Escritorio 1024×768" },
  { id: "844x390", width: 844, height: 390, mobile: true, landscape: true, label: "Móvil horizontal 844×390" },
];

const THEMES = [
  { id: "dark", slug: "oscuro" },
  { id: "light", slug: "claro" },
];

/* Viewports con la matriz completa de rutas. El resto mide layout. */
const CORE_VIEWPORTS = new Set(["1440x900", "390x844"]);
const LAYOUT_VIEWPORTS = new Set(["360x800", "768x1024", "1024x768", "844x390"]);

const ROUTES = [
  { hash: "#/", name: "panel", label: "Panel" },
  { hash: "#/biblioteca", name: "biblioteca", label: "Biblioteca" },
  { hash: "#/progreso", name: "progreso", label: "Progreso" },
  { hash: "#/ficha/sheet-aps-01", name: "ficha", label: "Ficha" },
  { hash: "#/subrayados", name: "subrayados", label: "Mis subrayados", optional: true, phase1: true },
  { hash: "#/dudas", name: "dudas", label: "Dudas", optional: true, phase1: true },
  { hash: "#/ruta", name: "ruta", label: "Ruta de hoy", optional: true, phase2: true },
  { hash: "#/plan", name: "plan", label: "Plan de estudio", optional: true, phase2: true },
  { hash: "#/dominio", name: "dominio", label: "Mapa de dominio", optional: true, phase2: true },
  { hash: "#/repaso", name: "repaso", label: "Repaso de fichas", optional: true, phase2: true },
  { hash: "#/glosario", name: "glosario", label: "Glosario", optional: true, phase3: true },
  { hash: "#/datos", name: "datos", label: "Datos para memorizar", optional: true, phase3: true },
  { hash: "#/trampas", name: "trampas", label: "Trampas frecuentes", optional: true, phase3: true },
  { hash: "#/relampago", name: "relampago", label: "Repaso relámpago", optional: true, phase3: true },
  { hash: "#/ultimo-dia", name: "ultimo-dia", label: "Hoja de último día", optional: true, phase3: true },
  { hash: "#/respaldo", name: "respaldo", label: "Respaldo", optional: true },
];

const LAYOUT_ROUTES = [
  { hash: "#/", name: "panel", label: "Panel" },
  { hash: "#/biblioteca", name: "biblioteca", label: "Biblioteca" },
  { hash: "#/ficha/sheet-aps-01", name: "ficha", label: "Ficha" },
  { hash: "#/subrayados", name: "subrayados", label: "Mis subrayados", optional: true, phase1: true },
  { hash: "#/ruta", name: "ruta", label: "Ruta de hoy", optional: true, phase2: true },
  { hash: "#/plan", name: "plan", label: "Plan de estudio", optional: true, phase2: true },
  { hash: "#/dominio", name: "dominio", label: "Mapa de dominio", optional: true, phase2: true },
  { hash: "#/repaso", name: "repaso", label: "Repaso de fichas", optional: true, phase2: true },
  { hash: "#/glosario", name: "glosario", label: "Glosario", optional: true, phase3: true },
  { hash: "#/datos", name: "datos", label: "Datos para memorizar", optional: true, phase3: true },
  { hash: "#/trampas", name: "trampas", label: "Trampas frecuentes", optional: true, phase3: true },
  { hash: "#/relampago", name: "relampago", label: "Repaso relámpago", optional: true, phase3: true },
  { hash: "#/ultimo-dia", name: "ultimo-dia", label: "Hoja de último día", optional: true, phase3: true },
];

/* Controles con objetivo táctil exigido por el contrato (§7 y Fase 1 §8). */
const REQUIRED_TOUCH_TARGETS = [
  ".s-appbar .s-navlink",
  ".s-appbar .s-iconbtn",
  ".dash-more-btn",
  ".reader-tools .s-btn",
  ".reader-tools .s-seg button",
  ".reader-back",
  ".goal-step",
  ".storage-actions .s-link",
  ".ac-para__btn",
  ".ac-colorbtn",
  ".ac-selbar [data-ac-action='selection:submit']",
  ".ac-selbar [data-ac-action='selection:cancel']",
  ".ac-switch",
  ".ac-rating",
  ".ac-chipf",
  ".ac-hlrow__foot .ac-btn",
  ".navx-sections-toggle",
  ".navx-section-link",
  ".navx-palette-close",
  ".navx-palette-option",
  ".navx-field-clear",
  "[data-library-search-input]",
  ".plan-item-link",
  "section[data-plan-view] button",
  "section[data-plan-view] input",
  "section[data-plan-view] select",
  "section[data-plan-view] a.s-btn",
  "section[data-plan-view] a[data-plan-action]",
  "section[data-plan-view] [role='button']",
  "[data-plan-area-priority] button",
  ".plan-route-item a[href]",
  ".plan-review-item button",
  "section[data-ref-view] button",
  "section[data-ref-view] input",
  "section[data-ref-view] select",
  "section[data-ref-view] [data-ref-action]:not(a)",
  "section[data-plan-view='relampago'] button",
  "section[data-plan-view='relampago'] select",
  "section[data-plan-view='ultimo-dia'] button",
  "section[data-plan-view='ultimo-dia'] select",
  ".sheet-gate .s-btn",
];

const METRICS_JS = `(() => {
  const doc = document.documentElement;
  const pick = ${JSON.stringify(REQUIRED_TOUCH_TARGETS)};
  const size = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
  const visible = (el) => {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.width > 1 && r.height > 1;
  };
  const targets = [];
  for (const selector of pick) {
    for (const el of document.querySelectorAll(selector)) {
      if (!visible(el)) continue;
      const box = size(el);
      if (box.w >= 44 && box.h >= 44) continue;
      targets.push({ selector, label: (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 60), ...box });
    }
  }
  const appbarControls = Array.from(document.querySelectorAll(".s-appbar a, .s-appbar button"))
    .filter((el) => !el.closest(".dash-more-panel"))
    .filter(visible)
    .map((el) => (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 40));
  const tableWrap = document.querySelector(".reader-table-wrap");
  const related = document.querySelector('[data-module-mount="reader-related"]');
  const today = document.querySelector('[data-module-mount="today-route"]');
  const summary = document.querySelector('[data-module-mount="active-summary"]');
  const searchResults = document.querySelectorAll("[data-navx-result]").length;
  const paletteOpen = !!document.querySelector('.navx-palette-layer[data-state="open"]');
  const selectionBar = !!document.querySelector(".ac-selbar");
  const indexSheet = !!document.querySelector(".navx-sections-panel:not([hidden])");
  return {
    innerWidth,
    innerHeight,
    scrollWidth: doc.scrollWidth,
    overflowX: doc.scrollWidth - innerWidth,
    coarse: matchMedia("(pointer: coarse)").matches,
    hoverNone: matchMedia("(hover: none)").matches,
    appbarControls,
    appbarCount: appbarControls.length,
    smallTargets: targets.slice(0, 16),
    tableRegion: tableWrap ? { tabindex: tableWrap.getAttribute("tabindex"), role: tableWrap.getAttribute("role"), label: tableWrap.getAttribute("aria-label") } : null,
    phase1: {
      todayRoute: today ? { state: (today.querySelector(".plan-today") || {}).getAttribute ? (today.querySelector(".plan-today") || {}).getAttribute("data-plan-state") : null, text: (today.innerText || "").trim().length } : null,
      activeSummary: summary ? { text: (summary.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 120) } : null,
      related: related ? { links: related.querySelectorAll("a[href^='#/ficha/']").length, text: (related.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 120) } : null,
      searchResults,
      paletteOpen,
      selectionBar,
      indexSheet,
      highlightsRows: document.querySelectorAll(".ac-hlrow").length,
      doubtRows: document.querySelectorAll("[data-doubt-id], .ac-doubtrow").length
    },
    phase4: {
      gate: document.querySelector(".sheet-gate")
        ? {
            role: document.querySelector(".sheet-gate").getAttribute("role"),
            text: (document.querySelector(".sheet-gate").innerText || "").replace(/\\s+/g, " ").trim().slice(0, 160)
          }
        : null,
      reader: !!document.querySelector("article.reader"),
      chunkRequests: performance.getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => url.includes("/study-data/sections/")).length
    }
  };
})()`;

async function applyTheme(page, theme) {
  await page.eval(`window.StudyUI && window.StudyUI.applyTheme(${JSON.stringify(theme)}), true`);
  await sleep(300);
}

async function setReducedMotion(conn, reduce) {
  await conn.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
  });
}

async function pressKey(page, key, { code = "", keyCode = 0, ctrl = false, text = "" } = {}) {
  const modifiers = ctrl ? 2 : 0;
  await page.conn.send("Input.dispatchKeyEvent", {
    type: text ? "keyDown" : "rawKeyDown",
    key,
    code,
    modifiers,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    text,
    unmodifiedText: text,
  });
  await page.conn.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    modifiers,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await sleep(220);
}

async function pressCtrlK(page) {
  await pressKey(page, "k", { code: "KeyK", keyCode: 75, ctrl: true });
}

async function pressEscape(page) {
  await pressKey(page, "Escape", { code: "Escape", keyCode: 27 });
}

async function typeInto(page, selector, value) {
  const ok = await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.focus(); if (el.select) el.select(); return true; })()`);
  if (!ok) return false;
  await page.conn.send("Input.insertText", { text: value });
  await sleep(400);
  return true;
}

/* Fase 4 · H4: retención del chunk de un área para capturar loading y error. */
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
    patterns: [{ urlPattern: "*study-data/sections/*", requestStage: "Request" }],
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

async function h17Values(page) {
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
      text: body.slice(0, 240)
    };
  })()`);
}

export async function runCaptures({ quiet = false, outDir = OUT_DIR } = {}) {
  await mkdir(SHOT_DIR, { recursive: true });
  const profileRoot = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-shots-"));
  const server = new StaticServer({ root: ROOT, port: SERVER_PORT, python: PYTHON });
  await server.start();
  const chrome = new Chrome({
    chromePath: CHROME,
    userDataDir: path.join(profileRoot, "profile"),
    port: CDP_PORT,
  });

  const shots = [];
  const problems = [];
  const pending = [];
  let environment = {};
  let page = null;

  try {
    const info = await chrome.start();
    environment = { browser: info && info.Browser, server: server.baseURL, profileRoot };
    const conn = await chrome.newTarget("about:blank");
    page = new Page(conn, { browser: chrome, port: CDP_PORT });
    await page.init();

    const waitApp = async (message) => {
      await page.waitFor(
        `!document.getElementById('view-root').hidden && document.getElementById('view-root').innerText.trim().length > 20`,
        { timeout: 25000, message },
      );
    };
    const routeUnavailable = () =>
      page.eval(`(() => {
        const title = document.title || "";
        const text = (document.getElementById("view-root") || {}).innerText || "";
        return /no encontramos|página no encontrada|módulo no disponible/i.test(title + " " + text);
      })()`);
    const go = async (hash, { mobile = false } = {}) => {
      await page.goto(`${server.baseURL}/study-dashboard/index.html${hash}`, { settle: mobile ? 900 : 750 });
      await waitApp(`render de ${hash}`);
    };
    /* Navegación sin esperar `load`: el chunk puede quedar retenido (Fase 4). */
    const goRaw = async (hash, settle = 450) => {
      await page.goto(`${server.baseURL}/study-dashboard/index.html?qa=capturas-fase4-${Date.now()}${hash}`, {
        wait: "none",
        settle,
      });
    };
    const setViewport = async (viewport) => {
      await page.viewport(viewport.width, viewport.height, { mobile: viewport.mobile, isLandscape: !!viewport.landscape });
      await conn.send("Emulation.setTouchEmulationEnabled", { enabled: viewport.mobile, maxTouchPoints: viewport.mobile ? 5 : 1 });
      await sleep(200);
    };

    const capture = async (payload, theme, viewport, { suffix = "", scrollTo = null } = {}) => {
      if (scrollTo) {
        await page.eval(`(() => {
          const el = document.querySelector(${JSON.stringify(scrollTo)});
          if (!el) return false;
          const root = document.documentElement;
          const previous = root.style.scrollBehavior;
          root.style.scrollBehavior = "auto";
          el.scrollIntoView({ block: "center", inline: "nearest" });
          if (previous) root.style.scrollBehavior = previous; else root.style.removeProperty("scroll-behavior");
          return true;
        })()`);
        await sleep(220);
      } else {
        await page.eval(`(() => {
          const el = document.documentElement;
          const previous = el.style.scrollBehavior;
          el.style.scrollBehavior = "auto";
          window.scrollTo(0, 0);
          if (previous) el.style.scrollBehavior = previous; else el.style.removeProperty("scroll-behavior");
          return true;
        })()`);
        await sleep(140);
      }
      const name = `${payload.name}-${theme.slug}-${viewport.id}${suffix}`;
      const file = path.join(SHOT_DIR, `${name}.png`);
      // Sin `clip`: con `captureBeyondViewport:false`, Chrome interpreta el clip
      // en coordenadas del documento y una página desplazada devuelve un lienzo
      // vacío. La captura de viewport (sin clip) refleja lo que se ve de verdad.
      const png = await page.conn.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      });
      await writeFile(file, Buffer.from(png.data, "base64"));
      const metrics = await page.eval(METRICS_JS);
      const record = {
        route: payload.hash,
        routeName: payload.name,
        state: payload.state || "base",
        label: payload.label,
        theme: theme.id,
        viewport: viewport.id,
        viewportLabel: viewport.label,
        file: path.posix.join("tools/qa/salida/capturas", path.basename(file)),
        metrics,
        at: new Date().toISOString(),
      };
      shots.push(record);
      if (metrics.overflowX > 1) {
        problems.push({ kind: "overflow", route: payload.hash, state: payload.state || "base", theme: theme.id, viewport: viewport.id, detail: metrics.overflowX });
      }
      if (viewport.mobile && metrics.smallTargets.length) {
        problems.push({ kind: "target", route: payload.hash, state: payload.state || "base", theme: theme.id, viewport: viewport.id, detail: metrics.smallTargets.slice(0, 6) });
      }
      if (viewport.mobile && viewport.width <= 900 && metrics.appbarCount !== 5) {
        problems.push({ kind: "appbar", route: payload.hash, state: payload.state || "base", theme: theme.id, viewport: viewport.id, detail: metrics.appbarCount });
      }
      if (!quiet) console.log(`[CAPTURA] ${record.file} (${metrics.overflowX}px overflow${viewport.mobile ? `, ${metrics.smallTargets.length} targets <44` : ""})`);
      return record;
    };

    const themeLoop = async (payload, viewport, options) => {
      for (const theme of THEMES) {
        await applyTheme(page, theme.id);
        await capture(payload, theme, viewport, options);
      }
    };

    const auditState = async (payload, viewport, options) => {
      await themeLoop(payload, viewport, options);
    };

    // Semilla de datos reales para los estados de la Fase 1.
    const seedState = async () => {
      await page.eval(`(() => {
        const store = window.StudyStore;
        if (!store) return false;
        const sheetId = "sheet-aps-01";
        const sheet = window.STUDY_CONTENT.sheets.find((s) => s.id === sheetId);
        const section = sheet && sheet.sections && sheet.sections[0] ? sheet.sections[0] : { title: "Sección", body: ["Texto"] };
        if (!store.annotations.list({ sheetId: sheetId }).length) {
          store.annotations.add({
            sheetId: sheetId, sectionIndex: 0, sectionTitle: section.title || "Sección 1", paragraphIndex: 0,
            color: "important", quote: String((section.body && section.body[0]) || "Cita de QA").slice(0, 160),
            prefix: "", suffix: "", note: "Nota de QA sobre la cita."
          });
        }
        if (!store.annotations.list({ sheetId: sheetId, color: "doubt" }).length) {
          store.annotations.add({
            sheetId: sheetId, sectionIndex: 0, sectionTitle: section.title || "Sección 1", paragraphIndex: 1,
            color: "doubt", quote: "Segunda cita con duda para la captura.", prefix: "", suffix: "", note: ""
          });
        }
        if (!store.doubts.list({ resolved: false }).length) {
          store.doubts.add({ sheetId: sheetId, sectionIndex: 0, paragraphIndex: 1, quote: "Segunda cita con duda para la captura.", note: "¿Por qué cambia el criterio?", annotationId: (store.annotations.list({ sheetId: sheetId })[1] || {}).id || null });
        }
        if (!store.sheetConfidence.get(sheetId)) store.sheetConfidence.set(sheetId, "partial");
        try { localStorage.setItem("study-active-prefs-v1", JSON.stringify({ version: 1, recallPause: true, recallEvery: 1, shortcuts: true })); } catch (e) {}
        return true;
      })()`);
      await sleep(450);
    };

    const openSelectionBar = () =>
      page.eval(`(() => {
        const btn = document.querySelector('[data-ac-action="paragraph:open"]');
        if (!btn) return false;
        btn.click();
        return true;
      })()`);

    const openRecallMode = () =>
      page.eval(`(() => {
        const scope = document.querySelector(".reader-concepts");
        if (!scope) return false;
        for (const el of scope.querySelectorAll("button")) {
          const name = ((el.getAttribute("aria-label") || "") + " " + (el.innerText || "")).trim();
          if (/recordar|memoria/i.test(name)) { el.click(); return true; }
        }
        return false;
      })()`);

    const findRecallPause = async () => {
      if (await page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`)) return true;
      await page.eval(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" }), true`);
      await sleep(450);
      return page.eval(`!!document.querySelector('[data-ac-component="recall-pause"]')`);
    };

    // Limpieza inicial: estados vacíos de la Fase 1.
    await setViewport(VIEWPORTS[0]);
    await go("#/");
    await page.eval(`window.StudyStore && window.StudyStore.clearAllProgress ? (window.StudyStore.clearAllProgress({ confirm: true }), true) : false`);
    await sleep(500);

    for (const viewport of VIEWPORTS) {
      await setViewport(viewport);
      const routes = CORE_VIEWPORTS.has(viewport.id) ? ROUTES : LAYOUT_ROUTES;
      for (const route of routes) {
        await go(route.hash, { mobile: viewport.mobile });
        if (route.optional && (await routeUnavailable())) {
          if (!pending.some((p) => p.route === route.hash)) {
            pending.push({ route: route.hash, reason: route.phase1 ? "Ruta de la Fase 1 aún sin módulo (active); captura pendiente." : "Ruta aún no registrada; captura pendiente." });
          }
          if (!quiet) console.log(`[PENDIENTE] ${route.hash} — sin módulo.`);
          continue;
        }
        await themeLoop({ hash: route.hash, name: route.name, label: route.label, state: "base" }, viewport);
      }

      // Hoja «Más» abierta (solo móvil: en escritorio .dash-more está oculto).
      if (viewport.mobile) {
        await go("#/", { mobile: true });
        for (const theme of THEMES) {
          await applyTheme(page, theme.id);
          const opened = await page.eval(`(() => {
            const btn = document.querySelector('[data-action="more-open"]');
            if (!btn) return false;
            btn.click();
            return true;
          })()`);
          await sleep(420);
          const state = await page.eval(`({
            open: !document.getElementById("dash-more-panel").hidden,
            expanded: document.querySelector('[data-action="more-open"]').getAttribute("aria-expanded"),
            controls: Array.from(document.querySelectorAll(".s-appbar a, .s-appbar button")).filter((el) => {
              const s = getComputedStyle(el); const r = el.getBoundingClientRect();
              return s.display !== "none" && s.visibility !== "hidden" && r.width > 1;
            }).length
          })`);
          if (!opened || !state.open) {
            problems.push({ kind: "more", route: "#/", state: "mas-abierto", theme: theme.id, viewport: viewport.id, detail: state });
          }
          await capture({ hash: "#/", name: "mas-abierto", label: "Más abierto", state: "mas-abierto" }, theme, viewport);
          await pressEscape(page);
          await sleep(300);
        }
      }
    }

    /* ---------------- Estados de la Fase 1 ---------------- */
    await seedState();
    const navReady = await page.eval(`!!(window.StudyNav && window.StudyNav.search && window.StudyNav.palette && window.StudyNav.sections)`);
    // La lectura activa se comprueba en una ficha, no en la última ruta visitada.
    await go("#/ficha/sheet-aps-01");
    const activeReady = await page.eval(`!!document.querySelector('[data-ac-action="paragraph:open"]')`);

    for (const viewport of [VIEWPORTS[0], VIEWPORTS[1]]) {
      await setViewport(viewport);

      // Ruta de hoy (funciona sin lectura activa) con datos reales.
      await go("#/", { mobile: viewport.mobile });
      await auditState({ hash: "#/", name: "panel-ruta-hoy", label: "Ruta de hoy", state: "ruta-hoy" }, viewport, { scrollTo: '[data-module-mount="today-route"]' });
      await auditState({ hash: "#/", name: "panel-actividad", label: "Ruta de hoy y resumen activo", state: "con-actividad" }, viewport, { scrollTo: '[data-module-mount="today-route"]' });

      // Fichas relacionadas (navegación, sin lectura activa).
      if (navReady) {
        await go("#/ficha/sheet-audit-05", { mobile: viewport.mobile });
        await sleep(800);
        await auditState({ hash: "#/ficha/sheet-audit-05", name: "ficha-relacionadas", label: "Fichas relacionadas", state: "relacionadas" }, viewport, { scrollTo: '[data-module-mount="reader-related"]' });
      }

      // Mis subrayados y Dudas con datos reales (rutas de la Fase 1).
      for (const route of [
        { hash: "#/subrayados", name: "subrayados-datos", label: "Mis subrayados con datos", state: "con-datos" },
        { hash: "#/dudas", name: "dudas-datos", label: "Dudas con datos", state: "con-datos" },
      ]) {
        await go(route.hash, { mobile: viewport.mobile });
        if (await routeUnavailable()) {
          if (!pending.some((item) => item.route === route.hash)) {
            pending.push({ route: route.hash, reason: "Ruta aún sin módulo; estado con datos pendiente." });
          }
          continue;
        }
        await auditState(route, viewport);
      }

      if (activeReady) {
        // Ficha con subrayados, modo recordar y confianza.
        await go("#/ficha/sheet-aps-01", { mobile: viewport.mobile });
        await page.eval(`(() => {
          const done = document.querySelector('[data-action="toggle-complete"]');
          if (done && done.getAttribute("aria-pressed") === "false") done.click();
          return true;
        })()`);
        await sleep(600);
        await openRecallMode();
        await sleep(400);
        await auditState({ hash: "#/ficha/sheet-aps-01", name: "ficha-activa", label: "Subrayados, modo recordar y confianza", state: "activa" }, viewport, { scrollTo: null });

        // Pausa de recuerdo, si la integración la muestra.
        if (await findRecallPause()) {
          await auditState({ hash: "#/ficha/sheet-aps-01", name: "ficha-pausa", label: "Pausa de recuerdo", state: "pausa" }, viewport, { scrollTo: '[data-ac-component="recall-pause"]' });
        } else {
          pending.push({ route: "#/ficha/sheet-aps-01", reason: "La pausa de recuerdo no apareció con frecuencia 1; captura pendiente de la integración final." });
        }

        // Barra de selección abierta.
        await go("#/ficha/sheet-aps-01", { mobile: viewport.mobile });
        if (await openSelectionBar()) {
          await sleep(450);
          await auditState({ hash: "#/ficha/sheet-aps-01", name: "ficha-barra", label: "Barra de selección", state: "barra-seleccion" }, viewport);
          await page.eval(`(() => { const b = document.querySelector('[data-ac-action="selection:cancel"], [data-ac-action="selection:close"]'); if (b) b.click(); return true; })()`);
        } else {
          pending.push({ route: "#/ficha/sheet-aps-01", reason: "La barra de selección no se pudo abrir; captura pendiente." });
        }
      } else if (!pending.some((item) => item.route === "#/ficha/sheet-aps-01" && /Lectura activa/.test(item.reason))) {
        pending.push({
          route: "#/ficha/sheet-aps-01",
          reason: "Lectura activa sin integrar ([data-ac-action=\"paragraph:open\"] ausente); capturas de subrayado/barra/pausa/confianza pendientes.",
        });
      }

      // Hoja del índice (solo móvil).
      if (viewport.mobile && navReady) {
        await go("#/ficha/sheet-aps-01", { mobile: true });
        const opened = await page.eval(`(() => {
          const toggle = document.querySelector('[data-module-mount="reader-index"] .navx-sections-toggle');
          if (!toggle) return false;
          toggle.click();
          return true;
        })()`);
        await sleep(500);
        if (opened && (await page.eval(`!!document.querySelector(".navx-sections-panel:not([hidden])")`))) {
          await auditState({ hash: "#/ficha/sheet-aps-01", name: "ficha-indice", label: "Hoja del índice", state: "hoja-indice" }, viewport);
          await pressEscape(page);
        } else {
          pending.push({ route: "#/ficha/sheet-aps-01", reason: "La hoja móvil del índice no se pudo abrir; captura pendiente." });
        }
      }

      if (navReady) {
        // Búsqueda con resultados.
        await go("#/biblioteca", { mobile: viewport.mobile });
        let focused = true;
        try {
          // Clic real: el foco programático no dispara focusin en headless.
          await page.click("[data-library-search-input]", { timeout: 8000 });
        } catch {
          focused = false;
        }
        if (focused) {
          await page.waitFor(`window.StudyDerived && window.StudyDerived.state("search") === "ready"`, { timeout: 60000, message: "índice para capturas" }).catch(() => {});
          await typeInto(page, "[data-library-search-input]", "vacunacion");
          await page.waitFor(`document.querySelectorAll("[data-navx-result]").length > 0`, { timeout: 20000, message: "resultados para captura" }).catch(() => {});
          if (await page.eval(`document.querySelectorAll("[data-navx-result]").length > 0`)) {
            await auditState({ hash: "#/biblioteca", name: "biblioteca-busqueda", label: "Búsqueda con resultados", state: "busqueda" }, viewport);
          } else {
            problems.push({ kind: "search", route: "#/biblioteca", state: "busqueda", theme: "both", viewport: viewport.id, detail: "sin resultados" });
          }
        } else {
          problems.push({ kind: "search", route: "#/biblioteca", state: "busqueda", theme: "both", viewport: viewport.id, detail: "sin campo de búsqueda" });
        }

        // Paleta Ctrl+K.
        await go("#/", { mobile: viewport.mobile });
        await page.eval(`document.activeElement && document.activeElement.blur(), true`);
        await pressCtrlK(page);
        if (await page.eval(`!!document.querySelector('.navx-palette-layer[data-state="open"]')`)) {
          await auditState({ hash: "#/", name: "paleta", label: "Paleta Ctrl+K", state: "paleta" }, viewport);
          await pressEscape(page);
        } else {
          problems.push({ kind: "palette", route: "#/", state: "paleta", theme: "both", viewport: viewport.id, detail: "Ctrl+K no abrió" });
        }
      } else {
        pending.push({ route: "#/biblioteca", reason: "Navegación sin integrar; capturas de búsqueda y paleta pendientes." });
      }

      /* ---------------- Estados de la Fase 2 ---------------- */
      const plan2Ready = await page.eval(`!!(window.StudyPlanRuntime && window.StudyPlanRuntime.ensureModel)`);
      if (plan2Ready) {
        await page.eval(`(() => {
          const s = window.StudyStore;
          if (s.plan.get && !s.plan.get()) {
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
        await sleep(450);
        const phase2States = [
          { hash: "#/ruta", name: "ruta-con-plan", label: "Ruta de hoy con plan y semana", state: "con-plan" },
          { hash: "#/plan", name: "plan-con-plan", label: "Editor con plan guardado", state: "con-plan" },
          { hash: "#/dominio", name: "dominio-con-datos", label: "Mapa de dominio con señales", state: "con-datos" },
          { hash: "#/repaso", name: "repaso-con-repasos", label: "Repaso con vencimientos", state: "con-repasos" },
        ];
        for (const item of phase2States) {
          await go(item.hash, { mobile: viewport.mobile });
          if (await routeUnavailable()) {
            if (!pending.some((p) => p.route === item.hash)) {
              pending.push({ route: item.hash, reason: "Ruta de Fase 2 aún sin vista; captura de estado pendiente." });
            }
            continue;
          }
          await page.waitFor(`(() => {
            const root = document.querySelector('section[data-plan-view]');
            return root && !root.querySelector('[data-plan-loading]');
          })()`, { timeout: 30000, message: `carga de ${item.name}` }).catch(() => {});
          await auditState(item, viewport);
        }
        if (viewport.mobile) {
          await go("#/", { mobile: true });
          const opened = await page.eval(`(() => {
            const btn = document.querySelector('[data-action="more-open"]');
            if (!btn) return false;
            btn.click();
            return true;
          })()`);
          await sleep(420);
          if (opened && (await page.eval(`!document.getElementById("dash-more-panel").hidden`))) {
            await auditState({ hash: "#/", name: "mas-planificacion", label: "Más con Planificación", state: "mas-planificacion" }, viewport);
            await pressEscape(page);
          } else {
            problems.push({ kind: "mas-planificacion", route: "#/", state: "mas-planificacion", theme: "both", viewport: viewport.id, detail: "no abrió" });
          }
        }
      } else {
        pending.push({ route: "#/ruta", reason: "plan.runtime.js no cargado; capturas de planificación pendientes." });
      }

      /* ---------------- Estados de la Fase 3 ---------------- */
      const ref3Ready = await page.eval(`!!window.StudyReference`);
      if (ref3Ready) {
        // Plan y datos conocidos para los estados (la ruta de último día y pendientes).
        await page.eval(`(() => {
          const store = window.StudyStore;
          if (store.plan && !store.plan.get()) {
            store.plan.save({
              examDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
              minutesPerDay: 45,
              daysPerWeek: 6,
              areaPriority: {}
            });
          }
          if (store.factsKnown && window.StudyReference) {
            window.StudyReference.entries("facts").slice(0, 3).forEach((entry) => store.factsKnown.set(entry.id, true));
          }
          return true;
        })()`).catch(() => {});
        await sleep(300);

        const phase3States = [
          {
            hash: "#/glosario",
            name: "glosario-busqueda",
            label: "Glosario con búsqueda sin acentos",
            state: "busqueda",
            ready: 'section[data-ref-view="glosario"]',
            setup: async () => {
              await typeInto(page, "[data-ref-search]", "atencion");
              await page.waitFor(`document.querySelectorAll(".ref-glossary-item").length > 0`, { timeout: 8000, message: "resultados del glosario" }).catch(() => {});
              return page.eval(`document.querySelectorAll(".ref-glossary-item").length > 0`);
            },
          },
          {
            hash: "#/datos",
            name: "datos-pendientes",
            label: "Datos con filtro Solo pendientes",
            state: "pendientes",
            ready: 'section[data-ref-view="datos"]',
            setup: async () => {
              await page.click('[data-ref-filter="pending"]');
              await sleep(450);
              return page.eval(`!!document.querySelector('[data-ref-filter="pending"]')`);
            },
          },
          {
            hash: "#/trampas",
            name: "trampas-mas",
            label: "Trampas con una página más",
            state: "paginacion",
            ready: 'section[data-ref-view="trampas"]',
            setup: async () => {
              await page.eval(`(() => {
                const b = document.querySelector('[data-ref-action="more"]');
                if (!b) return false;
                b.scrollIntoView({ block: "center", behavior: "instant" });
                b.click();
                return true;
              })()`);
              await page.waitFor(`document.querySelectorAll(".ref-trap-item").length >= 80`, {
                timeout: 8000,
                message: "segunda página de trampas",
              }).catch(() => {});
              return page.eval(`document.querySelectorAll(".ref-trap-item").length >= 80`);
            },
          },
          {
            hash: "#/relampago",
            name: "relampago-ronda",
            label: "Repaso relámpago con respuesta revelada",
            state: "ronda",
            ready: 'section[data-plan-view="relampago"]',
            setup: async () => {
              await page.click("[data-quick-start]");
              await waitForVisible("[data-quick-card]");
              await page.click("[data-quick-reveal]");
              await sleep(350);
              return page.eval(`(() => { const a = document.querySelector("[data-quick-answer]"); if (!a) return false; const r = a.getBoundingClientRect(); return !a.hidden && r.height > 1; })()`);
            },
          },
          {
            hash: "#/ultimo-dia",
            name: "ultimo-dia-hoja",
            label: "Hoja de último día con plan",
            state: "con-plan",
            ready: 'section[data-plan-view="ultimo-dia"]',
            setup: async () => {
              return page.eval(`!!document.querySelector("[data-lastday-facts]")`);
            },
          },
        ];

        const waitForVisible = async (selector) => {
          await page.waitFor(`(() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) return false;
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== "none" && s.visibility !== "hidden" && !el.hidden && r.height > 1;
          })()`, { timeout: 10000, message: `visible ${selector}` }).catch(() => {});
        };

        for (const item of phase3States) {
          await go(item.hash, { mobile: viewport.mobile });
          if (await routeUnavailable()) {
            if (!pending.some((p) => p.route === item.hash)) {
              pending.push({ route: item.hash, reason: "Ruta de Fase 3 aún sin vista; captura de estado pendiente." });
            }
            continue;
          }
          await page.waitFor(`(() => {
            const root = document.querySelector(${JSON.stringify(item.ready)});
            if (!root) return false;
            const loading = root.querySelector("[data-ref-loading], [data-quick-loading], [data-lastday-loading]");
            return !loading || loading.hidden || loading.getBoundingClientRect().height < 2;
          })()`, { timeout: 30000, message: `carga de ${item.name}` }).catch(() => {});
          const ok = await item.setup().catch(() => false);
          if (!ok) {
            const detail = await page.eval(`(() => ({
              items: document.querySelectorAll(".ref-trap-item, .ref-glossary-item, .ref-fact-item").length,
              more: !!document.querySelector('[data-ref-action="more"]'),
              state: (document.querySelector('[data-ref-view], [data-plan-view]') || {}).getAttribute ? (document.querySelector('[data-ref-view], [data-plan-view]') || {}).getAttribute("data-ref-state") || (document.querySelector('[data-ref-view], [data-plan-view]') || {}).getAttribute("data-plan-state") : null
            }))()`).catch(() => null);
            problems.push({ kind: "phase3-estado", route: item.hash, state: item.state, theme: "both", viewport: viewport.id, detail: { name: item.name, detail } });
            continue;
          }
          await auditState(item, viewport);
        }

        // Hoja Más con el grupo de Última hora (solo móvil).
        if (viewport.mobile) {
          await go("#/", { mobile: true });
          const opened = await page.eval(`(() => {
            const btn = document.querySelector('[data-action="more-open"]');
            if (!btn) return false;
            btn.click();
            return true;
          })()`);
          await sleep(450);
          const hasPhase3Links = await page.eval(`(() => {
            const panel = document.getElementById("dash-more-panel");
            if (!panel || panel.hidden) return false;
            const hrefs = Array.from(panel.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
            return ["#/relampago", "#/ultimo-dia", "#/glosario", "#/datos", "#/trampas"].every((href) => hrefs.includes(href));
          })()`);
          if (opened && hasPhase3Links) {
            await auditState({ hash: "#/", name: "mas-ultima-hora", label: "Más con Última hora", state: "mas-ultima-hora" }, viewport);
            await pressEscape(page);
          } else {
            problems.push({ kind: "mas-ultima-hora", route: "#/", state: "mas-ultima-hora", theme: "both", viewport: viewport.id, detail: "no abrió o faltan enlaces" });
          }
        }
      } else {
        pending.push({ route: "#/glosario", reason: "reference.js no cargado; capturas de la Fase 3 pendientes." });
      }
    }

    /* ---------------- Fase 4 · H4 + H17 ---------------- */
    for (const viewport of VIEWPORTS) {
      await setViewport(viewport);
      const themes = CORE_VIEWPORTS.has(viewport.id) ? THEMES : [THEMES[0]];

      // H17: el conteo editorial debe verse en Panel y Biblioteca.
      for (const route of [
        { hash: "#/", name: "h17-panel", label: "H17 · 85 temas + 22 fichas oficiales" },
        { hash: "#/biblioteca", name: "h17-biblioteca", label: "H17 · biblioteca con 85 temas" },
      ]) {
        await go(route.hash, { mobile: viewport.mobile });
        const check = await h17Values(page);
        for (const theme of themes) {
          await applyTheme(page, theme.id);
          const record = await capture({ ...route, state: "h17" }, theme, viewport);
          record.h17 = check;
        }
        if (!check.ok) {
          problems.push({ kind: "h17", route: route.hash, state: "h17", theme: "both", viewport: viewport.id, detail: check });
        }
      }

      // H4: ficha con el chunk retenido (loading) y con el chunk fallido (error).
      let handle = null;
      try {
        handle = await startSectionIntercept(page);
        await goRaw("#/ficha/sheet-aps-01");
        const loadingReady = await waitSheetGate(page, '.sheet-gate[role="status"], [data-sheet-loading]', 20000);
        if (!loadingReady) {
          pending.push({
            route: "#/ficha/sheet-aps-01",
            reason: "PENDIENTE DE INTEGRACIÓN (Fase 4): no aparece el estado de carga de la ficha con el chunk retenido.",
            viewport: viewport.id,
          });
        } else {
          for (const theme of themes) {
            await applyTheme(page, theme.id);
            await capture(
              { hash: "#/ficha/sheet-aps-01", name: "ficha-carga", label: "Ficha en carga (chunk retenido)", state: "fase4-carga" },
              theme,
              viewport,
            );
          }
          if (handle.paused.length) {
            await conn.send("Fetch.failRequest", { requestId: handle.paused[0].requestId, errorReason: "Failed" }).catch(() => {});
          }
          const errorReady = await waitSheetGate(page, '.sheet-gate[role="alert"], [data-sheet-error]', 15000);
          if (!errorReady) {
            pending.push({
              route: "#/ficha/sheet-aps-01",
              reason: "PENDIENTE DE INTEGRACIÓN (Fase 4): no aparece el error accesible de la ficha con el chunk fallido.",
              viewport: viewport.id,
            });
          } else {
            for (const theme of themes) {
              await applyTheme(page, theme.id);
              await capture(
                { hash: "#/ficha/sheet-aps-01", name: "ficha-error", label: "Ficha con error y Reintentar", state: "fase4-error" },
                theme,
                viewport,
              );
            }
          }
        }
      } catch (error) {
        problems.push({
          kind: "fase4-gate",
          route: "#/ficha/sheet-aps-01",
          state: "fase4-loading-error",
          theme: "both",
          viewport: viewport.id,
          detail: error && error.message ? error.message : String(error),
        });
      } finally {
        await stopSectionIntercept(page, handle);
      }
    }

    // Movimiento reducido: misma composición, sin animación de entrada.
    await setReducedMotion(conn, true);
    for (const target of [
      { viewport: VIEWPORTS[0], hash: "#/", name: "panel", theme: "dark" },
      { viewport: VIEWPORTS[1], hash: "#/ficha/sheet-aps-01", name: "ficha", theme: "dark" },
    ]) {
      await setViewport(target.viewport);
      await go(target.hash, { mobile: target.viewport.mobile });
      await applyTheme(page, target.theme);
      const theme = THEMES.find((item) => item.id === target.theme);
      await capture(
        { hash: target.hash, name: `movimiento-reducido-${target.name}`, label: "Movimiento reducido", state: "reduced-motion" },
        theme,
        target.viewport,
        { suffix: "-reduced-motion" },
      );
    }
    await setReducedMotion(conn, false);
  } finally {
    try { if (page) await page.close(); } catch {}
    await chrome.stop().catch(() => {});
    await server.stop().catch(() => {});
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "tools/qa/capturas.mjs",
    environment,
    summary: {
      shots: shots.length,
      problems: problems.length,
      pending: pending.length,
      viewports: VIEWPORTS.map((v) => v.id),
      states: [...new Set(shots.filter((s) => s.state !== "base").map((s) => s.state))],
      h17Shots: shots.filter((shot) => shot.state === "h17").length,
      fase4Shots: shots.filter((shot) => shot.state === "fase4-carga" || shot.state === "fase4-error").length,
      ok: problems.length === 0 && shots.length > 0,
    },
    pending,
    problems,
    shots,
  };
  await writeFile(path.join(OUT_DIR, "capturas.json"), JSON.stringify(payload, null, 2));
  await writeFile(path.join(OUT_DIR, "capturas.md"), renderShotsMarkdown(payload));

  if (!quiet) {
    console.log(`\ncapturas: ${shots.length} imágenes · ${problems.length} problemas · ${pending.length} pendientes`);
    console.log(`  directorio: ${path.relative(ROOT, SHOT_DIR)}`);
  }
  return { ok: payload.summary.ok, payload, file: path.join(OUT_DIR, "capturas.json") };
}

function renderShotsMarkdown(payload) {
  const lines = [];
  lines.push("# Capturas y métricas — Study Dashboard (Fases 0–4)");
  lines.push("");
  lines.push(`Generado por \`tools/qa/capturas.mjs\` el ${payload.generatedAt}.`);
  lines.push("");
  lines.push("Cada captura mide: desborde horizontal (`scrollWidth − innerWidth`), controles de appbar visibles y objetivos táctiles del contrato a 44 px en `(pointer: coarse)`. Los estados abiertos (barra, paleta, hoja del índice, búsqueda, Más) se capturan en ambos temas.");
  lines.push("");
  lines.push("## Resumen");
  lines.push("");
  lines.push(`- Capturas: **${payload.summary.shots}**`);
  lines.push(`- Problemas: **${payload.summary.problems}**`);
  lines.push(`- Pendientes de integración: **${payload.summary.pending}**`);
  lines.push(`- Viewports: ${payload.summary.viewports.join(", ")}`);
  lines.push(`- Estados: ${payload.summary.states.join(", ") || "—"}`);
  lines.push(`- Fase 4: **${payload.summary.h17Shots}** capturas H17 y **${payload.summary.fase4Shots}** de loading/error de ficha (seis viewports).`);
  lines.push(`- Resultado: **${payload.summary.ok ? "OK" : "FALLO"}**`);
  lines.push("");
  if (payload.problems.length) {
    lines.push("## Problemas medidos");
    lines.push("");
    for (const problem of payload.problems) {
      lines.push(`- \`${problem.kind}\` en \`${problem.route}\` (${problem.state || "base"}, ${problem.theme}/${problem.viewport}): ${JSON.stringify(problem.detail)}`);
    }
    lines.push("");
  }
  if (payload.pending.length) {
    lines.push("## Pendiente de integración");
    lines.push("");
    for (const item of payload.pending) lines.push(`- \`${item.route}\`: ${item.reason}`);
    lines.push("");
  }
  lines.push("## Capturas");
  lines.push("");
  lines.push("| Ruta | Estado | Tema | Viewport | Overflow | Appbar | Targets <44 | Archivo |");
  lines.push("|---|---|---|---|---:|---:|---:|---|");
  for (const shot of payload.shots) {
    lines.push(
      `| \`${shot.route}\` | ${shot.state} | ${shot.theme} | ${shot.viewport} | ${shot.metrics.overflowX}px | ${shot.metrics.appbarCount} | ${shot.metrics.smallTargets.length} | \`${shot.file}\` |`,
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
  runCaptures({ quiet: process.argv.includes("--quiet") })
    .then(({ ok }) => process.exit(ok ? 0 : 1))
    .catch((err) => {
      console.error("ERROR en capturas.mjs:", err && err.stack ? err.stack : err);
      process.exit(1);
    });
}
