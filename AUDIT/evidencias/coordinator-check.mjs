/* © 2026 ZARCONT — Comprobación independiente del coordinador (solo lectura).
   Uso: node AUDIT/evidencias/coordinator-check.mjs
   Requiere tests/e2e/lib (arnés del Agente 8) y Chromium del sistema. */
import { Chrome, Page } from "../../tests/e2e/lib/cdp.mjs";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(".");
const PORT = Number(process.env.CHECK_PORT || 8765);
const CDP_PORT = Number(process.env.CHECK_CDP || 9365);
const NODE_TMP = process.env.TEMP || "C:\\Windows\\Temp";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const userDataDir = path.join(NODE_TMP, "serums-coordinator-chrome");
const outDir = path.join(ROOT, "AUDIT", "evidencias");
await mkdir(outDir, { recursive: true });

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail === undefined ? "" : detail });
  console.log(`${ok ? "PASS" : "FAIL"} · ${name}${detail !== undefined ? " · " + detail : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = new StaticServer({ root: ROOT, port: PORT, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath, userDataDir, port: CDP_PORT, headless: true });
let page = null;
try {
  await server.start();
  await chrome.start();
  await chrome.newTarget("about:blank");
  const conn = [...chrome.pages][0];
  page = new Page(conn, { browser: chrome, port: CDP_PORT });
  await page.init();
  await page.viewport(1280, 800);
  const base = `http://127.0.0.1:${PORT}`;

  /* 1. Hub: las tarjetas Study abren portada; cambiar de cartilla no navega. */
  await page.goto(`${base}/index.html`, { settle: 700 });
  const hub = await page.eval(`(() => {
    const cards = [...document.querySelectorAll('.app-card[data-app]')].map(c => ({ id: c.dataset.app, href: c.getAttribute('href') }));
    return { cards, dock: !!document.querySelector('.dock'), fs: !!document.querySelector('#btnFs') && !document.querySelector('#btnFs').hidden };
  })()`);
  const d = hub.cards.find((c) => c.id === "dashboard");
  const f = hub.cards.find((c) => c.id === "flashcards");
  record("Hub: tarjeta Dashboard abre portada sin query", d && !/[?]/.test(d.href), d && d.href);
  record("Hub: tarjeta Flashcards abre portada sin query", f && !/[?]/.test(f.href), f && f.href);
  record("Hub: dock eliminado", hub.dock === false);
  const beforeNav = page.navigations.length;
  await page.click("#nextBtn");
  await page.click('#dots .dot[data-index="3"]');
  await sleep(250);
  record("Hub: selección de cartillas sin navegación", page.navigations.length === beforeNav, `${page.navigations.length - beforeNav} navegaciones`);

  /* 2. Dashboard: restaurar posición de lectura tras refrescar. */
  await page.goto(`${base}/study-dashboard/index.html?sheet=sheet-aps-02`, { settle: 1300 });
  const sheetTitle = await page.eval(`document.querySelector('h1') ? document.querySelector('h1').textContent : ''`);
  await page.eval(`(() => { const max = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(max * 0.6)); return { max, y: scrollY }; })()`);
  await sleep(400);
  const preReload = await page.eval(`({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight, stored: (window.StudyStore && window.StudyStore.getSheetState('sheet-aps-02') || {}).scroll })`);
  await page.goto(`${base}/study-dashboard/index.html?sheet=sheet-aps-02`, { settle: 3000 });
  const postReload = await page.eval(`({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight, stored: (window.StudyStore && window.StudyStore.getSheetState('sheet-aps-02') || {}).scroll, title: document.querySelector('h1') ? document.querySelector('h1').textContent : '' })`);
  const ratio = postReload.max > 120 ? postReload.y / postReload.max : 0;
  record("Dashboard: misma ficha tras refrescar", postReload.title === sheetTitle, `${sheetTitle} / ${postReload.title}`);
  record("Dashboard: restaura ~60% del scroll tras refrescar", Math.abs(ratio - 0.6) < 0.12, `ratio=${ratio.toFixed(3)} stored=${Number(postReload.stored || 0).toFixed(3)}`);
  await page.screenshot(path.join(outDir, "coordinator-dashboard.png"));

  /* 3. Flashcards: biblioteca completa, filtros y navegación interna. */
  await page.goto(`${base}/study-flashcards/index.html`, { settle: 1400 });
  const flash = await page.eval(`(() => ({
    title: document.title,
    decks: document.querySelectorAll('.lib-deck-row, .deck-row').length,
    areas: document.querySelectorAll('.lib-area, .deck-area').length,
    totalText: (document.querySelector('.lib-library-head') || {}).textContent || '',
    segWidth: (() => { const el = document.querySelector('.lib-seg'); return el ? [el.scrollWidth, el.clientWidth] : null; })(),
    pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    chromeButtons: document.querySelectorAll('[data-serums-chrome]').length
  }))()`);
  record("Flashcards: portada = biblioteca (sin sesión forzada)", /Biblioteca de mazos/i.test(flash.title), flash.title);
  record("Flashcards: 210 mazos en 5 áreas", flash.totalText.includes("210 mazos") && flash.areas >= 5, `${flash.totalText.trim()} · filas=${flash.decks}`);
  record("Flashcards: controles comunes presentes", flash.chromeButtons >= 3, `${flash.chromeButtons} botones`);
  record("Flashcards: filtros sin recorte a 1280", !flash.segWidth || flash.segWidth[0] <= flash.segWidth[1] + 1, flash.segWidth && flash.segWidth.join("/"));

  /* 4. QUEST: cambio de personaje sin reemplazar #view. */
  await page.goto(`${base}/serums-quest/index.html#/personajes`, { settle: 1600 });
  const quest = await page.eval(`(() => {
    const view = document.querySelector('#view');
    const marker = document.createElement('i'); marker.id = 'coord-sentinel'; view.appendChild(marker);
    const before = view.querySelectorAll('*').length;
    const btn = document.querySelector('[data-action="select-character"][data-character]');
    if (btn) btn.click();
    return { before, sentinel: !!document.querySelector('#coord-sentinel'), viewSame: view === document.querySelector('#view'), scroll: scrollY };
  })()`);
  await sleep(700);
  const questAfter = await page.eval(`({ sentinel: !!document.querySelector('#coord-sentinel'), active: (function(){ try { return JSON.parse(localStorage.getItem('serumsquest:state:v1')).collection.selectedCharacterId; } catch(e){ return null; } })(), chrome: document.querySelectorAll('[data-serums-chrome]').length, themeVisible: (() => { const b = document.querySelector('[data-theme-toggle]'); if (!b) return false; const r = b.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1; })() })`);
  record("QUEST: cambio de personaje conserva el nodo #view", quest.viewSame && quest.sentinel, `centinela tras click=${questAfter.sentinel}`);
  record("QUEST: selección persistida en el estado", !!questAfter.active, questAfter.active);
  record("QUEST: tema visible en 1280 y controles comunes", questAfter.themeVisible && questAfter.chrome >= 3, `tema=${questAfter.themeVisible} chrome=${questAfter.chrome}`);

  /* 5. Errores de consola acumulados. */
  const exceptions = page.exceptions || [];
  const consoleErrors = page.consoleErrors || [];
  record("Sin excepciones JS en las páginas comprobadas", exceptions.length === 0 && consoleErrors.length === 0, JSON.stringify({ exceptions, consoleErrors }).slice(0, 400));
} catch (error) {
  record("Ejecución del arnés", false, error && error.stack ? error.stack : String(error));
} finally {
  try { if (page) await page.screenshot(path.join(outDir, "coordinator-final.png")); } catch {}
  try { await chrome.stop(); } catch {}
  try { await server.stop(); } catch {}
}

const failed = results.filter((r) => !r.ok);
console.log(`\nRESULTADO: ${results.length - failed.length}/${results.length} OK`);
if (failed.length) console.log(failed.map((r) => `- ${r.name}: ${r.detail}`).join("\n"));
process.exit(failed.length ? 1 : 0);
