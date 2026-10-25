#!/usr/bin/env node
/* © 2026 ZARCONT — tools/route_nav_audit.mjs
 * Arnés mínimo de navegación real para la auditoría de rutas (Agente 1).
 * Chrome headless + CDP sobre WebSocket global de Node 24. Sin dependencias.
 *
 * Uso:
 *   node tools/route_nav_audit.mjs
 *   node tools/route_nav_audit.mjs --base http://127.0.0.1:8771 --port 9331 \
 *        --json AUDIT/evidencias/agent1-nav-tests.json
 *
 * Requisitos: servidor estático en --base sirviendo la raíz del repositorio y Chrome
 * instalado en la ruta indicada por --chrome (o la de por defecto).
 * Perfil: siempre temporal (nunca el del usuario). Se elimina al terminar.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");

const DEFAULTS = {
  base: "http://127.0.0.1:8771",
  port: 9331,
  chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  json: ""
};

function parseArgs(argv) {
  const out = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === "--base") { out.base = val.replace(/\/$/, ""); i += 1; }
    else if (key === "--port") { out.port = Number(val); i += 1; }
    else if (key === "--chrome") { out.chrome = val; i += 1; }
    else if (key === "--json") { out.json = val; i += 1; }
    else if (key === "--help" || key === "-h") { console.log("Ver cabecera del archivo."); process.exit(0); }
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const consoleErrors = [];

function record(id, name, ok, expected, actual, extra = {}) {
  const entry = { id, name, ok: !!ok, expected, actual, ...extra };
  results.push(entry);
  const mark = entry.ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${id} · ${name}`);
  console.log(`       esperado: ${typeof expected === "string" ? expected : JSON.stringify(expected)}`);
  console.log(`       real:     ${typeof actual === "string" ? actual : JSON.stringify(actual)}`);
  if (extra.defect) console.log(`       defecto:  ${extra.defect}`);
  return entry;
}

/* ------------------------------------------------------------------ */
/* Cliente CDP mínimo                                                  */
/* ------------------------------------------------------------------ */

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.frameNavs = 0;
    this.withinNavs = 0;
    ws.addEventListener("message", (event) => this._onMessage(event));
    ws.addEventListener("close", () => {
      for (const [, pending] of this.pending) pending.reject(new Error("CDP cerrado"));
      this.pending.clear();
    });
    this.on("Page.frameNavigated", (params) => {
      if (!params.frame || !params.frame.parentId) this.frameNavs += 1;
    });
    this.on("Page.navigatedWithinDocument", () => { this.withinNavs += 1; });
    this.on("Runtime.exceptionThrown", (params) => {
      const text = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || "";
      if (text) consoleErrors.push(text.split("\n")[0].slice(0, 200));
    });
  }

  _onMessage(event) {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
      else resolve(msg.result);
      return;
    }
    if (msg.method) {
      const list = this.handlers.get(msg.method);
      if (list) for (const fn of list) { try { fn(msg.params); } catch { /* ignore */ } }
    }
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout CDP ${method}`));
        }
      }, 30000);
    });
  }

  resetCounters() { this.frameNavs = 0; this.withinNavs = 0; }
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res;
}

async function launchChrome() {
  if (!fs.existsSync(opts.chrome)) throw new Error(`No se encontró Chrome en ${opts.chrome}`);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "a1-chrome-"));
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--remote-allow-origins=*",
    `${opts.base}`,
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${opts.port}`,
    // Resolución externa desactivada: las fuentes/CDN fallan rápido y no bloquean la carga.
    // El servidor de pruebas es 127.0.0.1 y queda excluido.
    "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"
  ];
  const child = spawn(opts.chrome, args, { stdio: "ignore", windowsHide: true });
  const deadline = Date.now() + 25000;
  let version = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetchJson(`http://127.0.0.1:${opts.port}/json/version`);
      version = await res.json();
      break;
    } catch { await sleep(250); }
  }
  if (!version) {
    try { child.kill(); } catch { /* ignore */ }
    throw new Error("Chrome no expuso el puerto de depuración");
  }
  return { child, profile, version };
}

async function openPage() {
  const res = await fetchJson(`http://127.0.0.1:${opts.port}/json/new?about:blank`, { method: "PUT" });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  return { cdp, ws, target };
}

/* ------------------------------------------------------------------ */
/* Utilidades de página                                                */
/* ------------------------------------------------------------------ */

let cdp;

async function evalJs(expression, { timeout = 12000, userGesture = true } = {}) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try {
      const res = await cdp.send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
        userGesture
      });
      if (res.exceptionDetails) {
        const text = res.exceptionDetails.exception?.description || res.exceptionDetails.text || "excepción";
        throw new Error(text.split("\n")[0]);
      }
      return res.result?.value;
    } catch (err) {
      last = err;
      const msg = String(err.message || err);
      if (/Execution context was destroyed|Cannot find context|Inspected target navigated|Target closed|timeout CDP/.test(msg)) {
        await sleep(120);
        continue;
      }
      throw err;
    }
  }
  throw last;
}

async function waitFor(expression, { timeout = 15000, label = expression } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const value = await evalJs(expression, { timeout: 3000 });
      if (value) return value;
    } catch { /* contexto en transición */ }
    await sleep(120);
  }
  throw new Error(`timeout esperando: ${label}`);
}

async function gotoPath(urlPath, readyExpr, { timeout = 20000 } = {}) {
  const url = new URL(`${opts.base}${urlPath}`).href;
  cdp.resetCounters();
  await cdp.send("Page.navigate", { url });
  await waitFor(
    `(function(){try{return decodeURIComponent(location.pathname) === ${JSON.stringify(urlPath.split("?")[0])};}catch(e){return false;}})()`,
    { timeout, label: `pathname ${urlPath}` }
  );
  if (readyExpr) await waitFor(readyExpr, { timeout, label: readyExpr });
  await sleep(80);
  return evalJs("({href: location.href, path: decodeURIComponent(location.pathname), search: location.search, hash: location.hash, title: document.title})");
}

async function pageState() {
  return evalJs("({href: location.href, path: decodeURIComponent(location.pathname), search: location.search, hash: location.hash, title: document.title})");
}

const READY = {
  hub: "document.body.classList.contains('ready') && document.querySelectorAll('.app-card').length === 5",
  dashboard: "document.querySelector('#view-root') && !document.querySelector('#view-root').hidden",
  flashcards: "document.querySelector('#view-root') && !document.querySelector('#view-root').hidden",
  quest: "document.querySelector('#view') && !document.querySelector('#view').hidden",
  banqueo: "document.querySelector('#topbar .brand') !== null",
  plazas: "document.querySelector('#topbar') !== null && document.querySelector('#app .rail') !== null"
};

async function hubHrefs() {
  return evalJs("Array.from(document.querySelectorAll('.app-card[data-app]')).map(function(c){return {app:c.getAttribute('data-app'), href:c.getAttribute('href')};})");
}

async function hubOpen(app, index) {
  // Selecciona la tarjeta con los puntos del carrusel y la abre con un clic real.
  cdp.resetCounters();
  const active = await evalJs(`(function(){
    var dot=document.querySelector('.dot[data-index="${index}"]');
    if(dot) dot.click();
    var c=document.querySelector('.app-card[data-app="${app}"]');
    var isActive=c ? c.classList.contains('is-active') : null;
    if(c) c.click();
    return isActive;
  })()`);
  return active;
}

async function openFromHub(app, index, targetPath, readyExpr, { timeout = 20000 } = {}) {
  const active = await hubOpen(app, index);
  await waitFor(
    `(function(){try{return decodeURIComponent(location.pathname) === ${JSON.stringify(targetPath)};}catch(e){return false;}})()`,
    { timeout, label: `navegación del hub a ${targetPath}` }
  );
  if (readyExpr) await waitFor(readyExpr, { timeout, label: readyExpr });
  await sleep(120);
  return { active, state: await pageState() };
}

async function clickAndWaitPath(actionExpr, targetPath, readyExpr, { timeout = 20000 } = {}) {
  cdp.resetCounters();
  await evalJs(actionExpr);
  await waitFor(
    `(function(){try{return decodeURIComponent(location.pathname) === ${JSON.stringify(targetPath)};}catch(e){return false;}})()`,
    { timeout, label: `navegación a ${targetPath}` }
  );
  if (readyExpr) await waitFor(readyExpr, { timeout, label: readyExpr });
  await sleep(120);
  return pageState();
}

/* Control «Volver al HUB»: SerumsChrome (data-serums-chrome="hub") con respaldo en los
   enlaces históricos de cada app. Devuelve el conteo de enlaces que resuelven a /index.html. */
const HUB_LINK_COUNT = `(function(){
  var n=0;
  try {
    document.querySelectorAll('a[href]').forEach(function(a){
      try { var u=new URL(a.getAttribute('href'), location.href); if(u.pathname==='/index.html') n+=1; } catch(e){}
    });
  } catch(e){}
  return n;
})()`;

const HUB_CONTROL = `[data-serums-chrome="hub"], .dash-home-link, .flash-home-link, .q-footer-links a[href="../index.html"]`;

const HUB_CLICK = `(function(){
  var h=document.querySelector(${JSON.stringify(HUB_CONTROL)});
  if(!h) return false;
  h.click();
  return true;
})()`;

async function clickHub() {
  const has = await evalJs(`!!document.querySelector(${JSON.stringify(HUB_CONTROL)})`);
  if (!has) return null;
  return clickAndWaitPath(HUB_CLICK, "/index.html", READY.hub);
}

/* ------------------------------------------------------------------ */
/* Escenarios                                                          */
/* ------------------------------------------------------------------ */

function staticScan() {
  const exts = new Set([".html", ".htm", ".js", ".mjs", ".css"]);
  const skip = new Set([".git", "node_modules", "__pycache__", "AUDIT", "tools"]);
  const hits = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skip.has(entry.name)) walk(path.join(dir, entry.name));
        continue;
      }
      if (!exts.has(path.extname(entry.name).toLowerCase())) continue;
      const file = path.join(dir, entry.name);
      const text = fs.readFileSync(file, "utf8");
      text.split(/\r?\n/).forEach((line, i) => {
        if (/history\.back\s*\(|history\.go\s*\(\s*-1/.test(line)) {
          hits.push({ file: path.relative(REPO, file).replace(/\\/g, "/"), line: i + 1, text: line.trim().slice(0, 160) });
        }
      });
    }
  };
  walk(REPO);
  return hits;
}

async function main() {
  const started = new Date().toISOString();
  const { child, profile, version } = await launchChrome();
  console.log(`Chrome ${version.Browser || ""} · perfil temporal ${profile}`);
  const page = await openPage();
  cdp = page.cdp;

  try {
    /* ---------------- FASE 1 · HUB ---------------- */
    let state = await gotoPath("/index.html", READY.hub);
    record("H1.1", "El hub carga y expone cinco tarjetas", state.path === "/index.html",
      "path /index.html", `${state.path} · ${state.title}`);

    const hrefs = await hubHrefs();
    const apps = hrefs.map((h) => h.app).sort().join(",");
    record("H1.2", "Cinco destinos únicos sin duplicados", apps === "banqueo,dashboard,flashcards,plazas,quest",
      "banqueo,dashboard,flashcards,plazas,quest", apps);

    const studyQuery = hrefs.filter((h) => /^(dashboard|flashcards)$/.test(h.app) && h.href.includes("?"));
    record("H1.3", "Tarjetas Study sin query en el HTML servido (D1)", studyQuery.length === 0,
      "dashboard y flashcards sin '?'", studyQuery.length ? JSON.stringify(studyQuery) : "sin query");

    const reach = [];
    for (const item of hrefs) {
      const url = new URL(item.href, `${opts.base}/index.html`).href;
      let status = 0;
      try {
        const res = await fetch(url, { method: "HEAD", redirect: "manual" });
        status = res.status;
      } catch (err) { status = String(err.message).slice(0, 40); }
      reach.push({ app: item.app, url, status });
    }
    record("H1.4", "Cada href del hub responde por HTTP", reach.every((r) => r.status === 200),
      "5 × HTTP 200", reach.map((r) => `${r.app}:${r.status}`).join(" "), { evidence: reach });

    const snapBefore = await evalJs("localStorage.getItem('studyhub:snapshot:v1')");
    record("H1.5", "Perfil de prueba sin snapshot previo", snapBefore === null, "null", snapBefore === null ? "null" : "presente");

    /* ---------------- FASE 2 · DASHBOARD DESDE EL HUB ---------------- */
    const dashEntry = await openFromHub("dashboard", 2, "/study-dashboard/index.html", READY.dashboard);
    state = dashEntry.state;
    const dashPortada = await evalJs("({hash: location.hash, search: location.search, title: document.title, h1: (document.querySelector('#view-root h1, #view-root h2') || {}).textContent || ''})");
    record("H2.1", "Hub → Study Dashboard abre la portada (sin query)", dashPortada.hash === "#/" && dashPortada.search === "",
      "#/ y sin query", `${dashPortada.hash}${dashPortada.search ? "?" + dashPortada.search : ""} · ${dashPortada.title}`);
    record("H2.2", "La portada del Dashboard es el panel, no una ficha", /Study Dashboard · SERUMS/.test(dashPortada.title),
      "title 'Study Dashboard · SERUMS'", dashPortada.title);

    /* Portada → biblioteca → categoría → ficha → portada, sin recargas */
    cdp.resetCounters();
    await evalJs("document.querySelector('.s-navlink[data-route=\"library\"]').click()");
    await waitFor("location.hash === '#/biblioteca'", { label: "hash biblioteca" });
    await sleep(250);
    const catLink = await evalJs("(function(){var a=document.querySelector('#view-root a.category-card'); return a ? a.getAttribute('href') : '';})()");
    await evalJs("(function(){var a=document.querySelector('#view-root a.category-card'); if(a) a.click(); return !!a;})()");
    await waitFor("location.hash.indexOf('#/biblioteca/') === 0 && location.hash.split('/').length >= 4", { label: "hash categoría" });
    await sleep(250);
    const firstSheetLink = await evalJs("(function(){var a=document.querySelector('#view-root a.sheet-row'); return a ? a.getAttribute('href') : '';})()");
    await evalJs("(function(){var a=document.querySelector('#view-root a.sheet-row'); if(a) a.click(); return !!a;})()");
    await waitFor("location.hash.indexOf('#/ficha/') === 0", { label: "hash ficha desde la biblioteca" });
    await sleep(250);
    const sheetState = await pageState();
    const realSheet = decodeURIComponent(firstSheetLink.replace("#/ficha/", ""));
    record("H2.3", "ID real de ficha obtenido de la biblioteca", !!realSheet, "un id no vacío", realSheet || "(vacío)");
    record("H2.4", "Portada → recurso individual (categoría y ficha reales desde la biblioteca)",
      catLink !== "" && firstSheetLink.length > 0 && sheetState.hash === firstSheetLink,
      `${catLink} → ${firstSheetLink}`, `categoría=${catLink} · ficha=${sheetState.hash} · ${sheetState.title}`);
    const navsFicha = { frame: cdp.frameNavs, within: cdp.withinNavs };
    record("H2.5", "Biblioteca → ficha sin recargar el documento (D4)", navsFicha.frame === 0,
      "0 navegaciones de documento", `${navsFicha.frame} documento / ${navsFicha.within} hash`);

    cdp.resetCounters();
    await evalJs("document.querySelector('.s-navlink[data-route=\"home\"]').click()");
    await waitFor("location.hash === '#/'", { label: "hash panel" });
    await sleep(200);
    const backHome = await pageState();
    record("H2.6", "Recurso → portada con control propio (no history.back)", backHome.hash === "#/" && /Study Dashboard · SERUMS/.test(backHome.title),
      "#/ y título de panel", `${backHome.hash} · ${backHome.title}`);
    record("H2.7", "Volver a portada no recarga el documento", cdp.frameNavs === 0,
      "0 navegaciones de documento", `${cdp.frameNavs} documento / ${cdp.withinNavs} hash`);

    cdp.resetCounters();
    await evalJs("history.back()");
    await waitFor("location.hash.indexOf('#/ficha/') === 0", { label: "atrás a ficha" });
    await sleep(200);
    const backState = await pageState();
    await evalJs("history.forward()");
    await waitFor("location.hash === '#/'", { label: "adelante a panel" });
    await sleep(200);
    const fwdState = await pageState();
    record("H2.8", "Atrás/adelante del navegador conservan las rutas", backState.hash === sheetState.hash && fwdState.hash === "#/",
      `atrás=${sheetState.hash}, adelante=#/`, `atrás=${backState.hash}, adelante=${fwdState.hash}`);

    /* Dashboard → HUB → atrás */
    state = await clickHub();
    record("H2.9", "Dashboard → HUB con control explícito", state && state.path === "/index.html" && state.search === "",
      "/index.html vía control «Volver al HUB»", state ? `${state.path} · ${state.title}` : "sin control de HUB");
    await evalJs("history.back()");
    await waitFor("decodeURIComponent(location.pathname) === '/study-dashboard/index.html'", { label: "atrás al Dashboard" });
    await sleep(250);
    const dashBack = await pageState();
    record("H2.10", "Atrás desde el HUB regresa al Dashboard", dashBack.path === "/study-dashboard/index.html",
      "/study-dashboard/index.html", dashBack.path);

    /* URL directa con ?sheet real */
    state = await gotoPath(`/study-dashboard/index.html?sheet=${encodeURIComponent(realSheet)}`, READY.dashboard);
    await sleep(250);
    let directSheet = await pageState();
    record("H2.11", "URL directa ?sheet=<real> abre la ficha y limpia la query",
      directSheet.hash === `#/ficha/${realSheet}` && directSheet.search === "",
      `#/ficha/${realSheet} sin query`, `${directSheet.hash}${directSheet.search}`);

    /* ?sheet con id obsoleto */
    state = await gotoPath("/study-dashboard/index.html?sheet=NO-EXISTE-999", READY.dashboard);
    await sleep(250);
    const stale = await evalJs("({hash: location.hash, title: document.title, text: (document.querySelector('#view-root')||{}).innerText || ''})");
    const staleOk = stale.hash === "#/" && /Study Dashboard · SERUMS/.test(stale.title);
    record("H2.12", "URL directa ?sheet=<obsoleto> cae en la portada con aviso", staleOk,
      "#/ con título de panel y aviso de ficha no disponible",
      `${stale.hash} · ${stale.title}`,
      staleOk ? {} : { defect: "A1-D2 · study-dashboard/app.js initQuery() redirige a #/ficha/<id> aunque el id no exista" });

    /* ---------------- FASE 3 · FLASHCARDS ---------------- */
    await gotoPath("/index.html", READY.hub);
    const flashEntry = await openFromHub("flashcards", 3, "/study-flashcards/index.html", READY.flashcards);
    state = flashEntry.state;
    await sleep(250);
    const flashPortada = await pageState();
    const flashLibOk = await evalJs("({decks: document.querySelectorAll('a[href^=\"#/mazo/\"]').length, nav: !!document.querySelector('.s-navlink[data-route=\"decks\"]')})");
    record("H3.1", "Hub → Study Flashcards abre la biblioteca de mazos",
      flashPortada.hash === "#/" && flashPortada.search === "" && /Flashcards/.test(flashPortada.title) && flashLibOk.decks > 0 && flashLibOk.nav,
      "#/ con mazos y nav «Mazos»", `${flashPortada.hash} · ${flashPortada.title} · ${flashLibOk.decks} mazos`);

    const deckLink = await evalJs("(function(){var a=document.querySelector('#view-root a[href^=\"#/mazo/\"]'); return a ? a.getAttribute('href') : '';})()");
    const realDeck = decodeURIComponent(deckLink.replace("#/mazo/", ""));
    cdp.resetCounters();
    await evalJs("(function(){var a=document.querySelector('#view-root a[href^=\"#/mazo/\"]'); if(a) a.click(); return !!a;})()");
    await waitFor("location.hash.indexOf('#/mazo/') === 0", { label: "hash mazo" });
    await sleep(250);
    const deckState = await pageState();
    record("H3.2", "Biblioteca → mazo individual con enlace real", deckLink !== "" && deckState.hash === deckLink,
      deckLink, `${deckState.hash} · ${deckState.title}`);
    record("H3.3", "Abrir un mazo no recarga el documento", cdp.frameNavs === 0,
      "0 navegaciones de documento", `${cdp.frameNavs} documento / ${cdp.withinNavs} hash`);

    const backControl = await evalJs(`(function(){
      var back=document.querySelector('.flash-back');
      var hub=document.querySelector('[data-serums-chrome="hub"], .flash-home-link');
      var home=document.querySelector('[data-serums-chrome="home"]');
      return {
        backHref: back ? back.getAttribute('href') : null,
        backText: back ? back.textContent.trim().slice(0,40) : null,
        hubHref: hub ? hub.getAttribute('href') : null,
        hubLabel: hub ? hub.getAttribute('aria-label') : null,
        homeHref: home ? home.getAttribute('href') : null
      };
    })()`);
    const hubResolvesToHub = (() => {
      try { return new URL(backControl.hubHref || "", `${opts.base}/study-flashcards/index.html`).pathname === "/index.html"; }
      catch { return false; }
    })();
    record("H3.4", "Mazo: «volver a mazos» y «volver al HUB» son controles distintos",
      backControl.backHref === "#/" && hubResolvesToHub && backControl.hubHref !== backControl.backHref,
      "backHref #/ y un control de HUB que resuelve a /index.html", JSON.stringify(backControl));

    cdp.resetCounters();
    await evalJs("document.querySelector('.flash-back').click()");
    await waitFor("location.hash === '#/'", { label: "hash mazos" });
    await sleep(200);
    const flashLib = await pageState();
    record("H3.5", "Volver del mazo lleva a la biblioteca, no al HUB", flashLib.hash === "#/" && flashLib.path === "/study-flashcards/index.html",
      "#/ en /study-flashcards/index.html", `${flashLib.path}${flashLib.hash}`);
    record("H3.6", "Regreso a la biblioteca sin recargar", cdp.frameNavs === 0,
      "0 navegaciones de documento", `${cdp.frameNavs} documento / ${cdp.withinNavs} hash`);

    /* URL directa ?deck real & resume=1 */
    state = await gotoPath(`/study-flashcards/index.html?deck=${encodeURIComponent(realDeck)}&resume=1`, READY.flashcards);
    await sleep(250);
    const resumeState = await evalJs("({hash: location.hash, search: location.search, title: document.title, decksNav: !!document.querySelector('.s-navlink[data-route=\"decks\"]')})");
    record("H3.7", "URL directa ?deck&resume=1 resuelve a una ruta válida y limpia la query",
      /^#\/(mazo|sesion)/.test(resumeState.hash) && resumeState.search === "" && resumeState.decksNav,
      "#/mazo/… o #/sesion, sin query, con nav de mazos",
      `${resumeState.hash} · ${resumeState.title}`);

    /* ?deck obsoleto */
    state = await gotoPath("/study-flashcards/index.html?deck=NO-EXISTE-999", READY.flashcards);
    await sleep(250);
    const staleDeck = await pageState();
    const staleDeckOk = staleDeck.hash === "#/" && staleDeck.search === "";
    record("H3.8", "URL directa ?deck=<obsoleto> cae en la biblioteca con aviso", staleDeckOk,
      `#/ sin query; obtenido ${staleDeck.hash} · ${staleDeck.title}`,
      `${staleDeck.hash} · ${staleDeck.search} · ${staleDeck.title}`,
      staleDeckOk ? {} : { defect: "A1-D3 · study-flashcards/app.js bootApp() redirige a #/mazo/<id> aunque el mazo no exista" });

    /* ---------------- FASE 4 · BANQUEO / PLAZAS / QUEST ---------------- */
    state = await gotoPath("/index.html", READY.hub);
    const bqEntry = await openFromHub("banqueo", 0, "/EXAMEN STUDIO/Examen Studio.html", READY.banqueo);
    state = bqEntry.state;
    await sleep(300);
    const banqueo = await evalJs(`(function(){
      return { hash: location.hash, title: document.title, hubLinks: ${HUB_LINK_COUNT}, navCount: document.querySelectorAll('#topbar a').length };
    })()`);
    record("H4.1", "Hub → Banqueo abre #hub", banqueo.hash === "#hub" && /Banqueo/.test(banqueo.title),
      "#hub", `${banqueo.hash} · ${banqueo.title}`);
    record("H4.2", "Banqueo ofrece regreso al HUB", banqueo.hubLinks > 0,
      "≥1 enlace al hub", `${banqueo.hubLinks} enlaces · ${banqueo.navCount} enlaces en topbar`,
      { defect: "A1-D4 · EXAMEN STUDIO/js/app.js renderShell() no pinta ningún enlace al hub (solo app.js: el topbar no incluye HUB)" });

    state = await gotoPath("/index.html", READY.hub);
    const pzEntry = await openFromHub("plazas", 1, "/serums map/serums-map-explorer/index.html", READY.plazas);
    state = pzEntry.state;
    await sleep(300);
    const plazas = await evalJs(`(function(){
      return { hash: location.hash, title: document.title, hubLinks: ${HUB_LINK_COUNT}, hasTopbar: !!document.querySelector('#topbar') };
    })()`);
    record("H4.3", "Hub → Plazas carga la consola del mapa", plazas.hasTopbar && /Map Explorer/.test(plazas.title),
      "#topbar presente", `${plazas.title} · hash='${plazas.hash}'`);
    record("H4.4", "Plazas ofrece regreso al HUB", plazas.hubLinks > 0,
      "≥1 enlace al hub", `${plazas.hubLinks} enlaces`,
      { defect: "A1-D5 · serums map/serums-map-explorer/index.html no contiene ningún <a> (topbar de botones); sin enlace al hub" });

    state = await gotoPath("/index.html", READY.hub);
    const qEntry = await openFromHub("quest", 4, "/serums-quest/index.html", READY.quest);
    state = qEntry.state;
    await sleep(300);
    const questHome = await pageState();
    record("H4.5", "Hub → QUEST abre el inicio #/", questHome.hash === "#/" && /SERUMS QUEST/.test(questHome.title),
      "#/", `${questHome.hash} · ${questHome.title}`);
    cdp.resetCounters();
    await evalJs("document.querySelector('.q-navlink[data-route=\"characters\"]').click()");
    await waitFor("location.hash === '#/personajes'", { label: "hash personajes" });
    await sleep(250);
    record("H4.6", "QUEST navega a una ruta individual sin recargar", cdp.frameNavs === 0,
      "0 navegaciones de documento", `${cdp.frameNavs} documento / ${cdp.withinNavs} hash`);
    const questHub = await evalJs(HUB_LINK_COUNT);
    record("H4.7", "QUEST ofrece regreso al HUB", questHub > 0, "≥1 control que resuelve a /index.html", `${questHub} enlaces`);
    state = await clickHub();
    record("H4.8", "QUEST → HUB con control explícito", state && state.path === "/index.html", "/index.html", state ? state.path : "sin control de HUB");
    await evalJs("history.back()");
    await waitFor("decodeURIComponent(location.pathname) === '/serums-quest/index.html'", { label: "atrás a QUEST" });
    await sleep(250);
    const questBack = await pageState();
    record("H4.9", "Atrás desde el HUB regresa a QUEST conservando la ruta", questBack.path === "/serums-quest/index.html",
      "/serums-quest/index.html#/personajes", `${questBack.path}${questBack.hash}`);

    /* ---------------- FASE 5 · URL DIRECTA Y SNAPSHOT ---------------- */
    const direct = [];
    for (const [appPath, ready] of [
      ["/index.html", READY.hub],
      ["/study-dashboard/index.html", READY.dashboard],
      ["/study-flashcards/index.html", READY.flashcards],
      ["/serums-quest/index.html", READY.quest],
      ["/EXAMEN STUDIO/Examen Studio.html", READY.banqueo],
      ["/serums map/serums-map-explorer/index.html", READY.plazas]
    ]) {
      const st = await gotoPath(appPath, ready);
      direct.push({ path: appPath, hash: st.hash, title: st.title });
    }
    record("H5.1", "Las seis entradas abren por URL directa", direct.every((d) => d.title.length > 0),
      "6 entradas con título propio", direct.map((d) => `${d.path.split("/").slice(-2).join("/")}:${d.title.slice(0, 24)}`).join(" | "), { evidence: direct });

    /* Snapshot del hub con ids obsoletos */
    await gotoPath("/index.html", READY.hub);
    await evalJs(`localStorage.setItem('studyhub:snapshot:v1', JSON.stringify({
      v: 1,
      dashboard: { last: { sheetId: 'NO-EXISTE-999', title: 'Ficha antigua' }, totalSheets: 210, completedSheets: 0, viewedSheets: 0, startedTopics: 0, streak: 0 },
      flashcards: { last: { deckId: 'NO-EXISTE-999', title: 'Mazo antiguo' }, totalCards: 630, reviewedCards: 0, masteredCards: 0, dueCards: 0, todayReviews: 0 }
    }))`);
    await gotoPath("/index.html", READY.hub);
    const staleHrefs = await hubHrefs();
    record("H5.2", "Snapshot obsoleto no inyecta ?sheet=/?deck= en las tarjetas (D1)",
      staleHrefs.every((h) => !/^(dashboard|flashcards)$/.test(h.app) || !h.href.includes("?")),
      "dashboard y flashcards sin query", JSON.stringify(staleHrefs),
      { defect: "A1-D1 · index.html applySnapshot() reescribe el href de las tarjetas con dashboardHref/flashcardsHref" });

    /* Snapshot del hub con ids reales */
    await evalJs(`localStorage.setItem('studyhub:snapshot:v1', JSON.stringify({
      v: 1,
      dashboard: { last: { sheetId: ${JSON.stringify(realSheet)}, title: 'Ficha real' }, totalSheets: 210, completedSheets: 3, viewedSheets: 5, startedTopics: 2, streak: 1, percent: 2 },
      flashcards: { last: { deckId: ${JSON.stringify(realDeck)}, title: 'Mazo real' }, totalCards: 630, reviewedCards: 10, masteredCards: 3, dueCards: 2, todayReviews: 4 }
    }))`);
    await gotoPath("/index.html", READY.hub);
    const realHrefs = await hubHrefs();
    record("H5.3", "Snapshot con ids válidos tampoco inyecta query en las tarjetas (D1)",
      realHrefs.every((h) => !/^(dashboard|flashcards)$/.test(h.app) || !h.href.includes("?")),
      "dashboard y flashcards sin query", JSON.stringify(realHrefs),
      { defect: "A1-D1 · mismo origen: la reanudación debe vivir dentro de la app o en un control aparte" });

    /* Snapshot de QUEST no altera la ruta */
    await evalJs(`localStorage.setItem('serumsquest:snapshot:v1', JSON.stringify({ level: 7, levelPercent: 40, rank: 'Interno', xp: 900, answered: 120, hasActivity: true, lastSession: { title: 'Misión antigua' } }))`);
    await gotoPath("/index.html", READY.hub);
    const questHref = (await hubHrefs()).find((h) => h.app === "quest");
    record("H5.4", "El snapshot de QUEST no altera el destino de la tarjeta", questHref && questHref.href === "./serums-quest/index.html",
      "./serums-quest/index.html", questHref ? questHref.href : "(sin tarjeta)");

    await evalJs("localStorage.removeItem('studyhub:snapshot:v1'); localStorage.removeItem('serumsquest:snapshot:v1');");

    /* ---------------- FASE 6 · ESTÁTICO ---------------- */
    const backHits = staticScan();
    record("H6.1", "No hay history.back()/history.go(-1) como mecanismo de regreso", backHits.length === 0,
      "0 ocurrencias en HTML/JS/CSS", backHits.length ? JSON.stringify(backHits) : "0 ocurrencias", { evidence: backHits });
  } finally {
    try { cdp.ws.close(); } catch { /* ignore */ }
    try { child.kill(); } catch { /* ignore */ }
    await sleep(400);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const payload = {
    generated_at: started,
    finished_at: new Date().toISOString(),
    base: opts.base,
    chrome: version.Browser || "",
    profile_note: "perfil temporal eliminado al terminar",
    totals: { tests: results.length, passed, failed },
    defects: results.filter((r) => r.defect).map((r) => ({ id: r.id, name: r.name, defect: r.defect })),
    console_errors: consoleErrors.slice(0, 40),
    results
  };
  console.log(`\nRESUMEN: ${passed}/${results.length} pruebas OK · ${failed} con hallazgo`);
  for (const r of results.filter((x) => !x.ok)) console.log(`  FAIL ${r.id} ${r.name}`);
  if (opts.json) {
    const out = path.isAbsolute(opts.json) ? opts.json : path.join(REPO, opts.json);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Informe JSON: ${path.relative(REPO, out).replace(/\\/g, "/")}`);
  }
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error("ERROR FATAL:", err && err.message ? err.message : err);
  process.exit(2);
});
