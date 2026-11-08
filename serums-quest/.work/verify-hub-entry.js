'use strict';
/* Verificación del enlace SERUMS QUEST del HUB (6 nov 2026).
   Abre el HUB, pulsa la tarjeta como un usuario y comprueba:
   ruta directa, menú del juego, sin red, guardado, importación e HTML exportado. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS';
const SQ = path.join(ROOT, 'serums-quest');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FIXTURE = JSON.parse(fs.readFileSync(path.join(SQ, '.work', 'offline-fixture.json'), 'utf8'));
const LEGACY_EXPORT = JSON.parse(fs.readFileSync(path.join(SQ, '.work', 'legacy-export-real.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

function startServer(port) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/^\/+/, '');
    const file = path.resolve(ROOT, rel || 'index.html');
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

async function launch(port, profile, url, extraArgs) {
  const dir = path.join(os.tmpdir(), profile);
  fs.rmSync(dir, { recursive: true, force: true });
  const args = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu-sandbox',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1280,800'];
  if (extraArgs) args.push(...extraArgs);
  args.push(url);
  const child = spawn(CHROME, args, { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((x) => x.type === 'page');
      if (page) return { child, page };
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome did not expose a page on port ' + port);
}

async function connect(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  const requests = [];
  const failed = [];
  const nav = [];
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + ((m.params.exceptionDetails.exception || {}).description || ''));
    if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
    if (m.method === 'Network.loadingFailed') failed.push({ url: (m.params.requestId || ''), error: m.params.errorText });
    if (m.method === 'Page.frameNavigated' && m.params.frame.parentId === undefined) nav.push(m.params.frame.url);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result ? x.result.value : undefined;
  };
  const waitFor = async (expr, ms = 9000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { try { if (await ev(expr)) return true; } catch {} await sleep(160); }
    return false;
  };
  const waitUrl = async (re, ms = 12000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { try { const u = await ev('location.href'); if (re.test(u)) return u; } catch {} await sleep(200); }
    return '';
  };
  const click = async (sel) => {
    const ok = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
    if (!ok) throw new Error('Missing ' + sel);
    await sleep(260);
  };
  const skipTutorial = async () => {
    if (await ev("!!document.querySelector('.tutorialShell')").catch(() => false)) {
      if (await ev("!!document.querySelector('[data-action=\"tutorial-skip\"]')").catch(() => false)) await click('[data-action="tutorial-skip"]');
      await sleep(350);
    }
  };
  const state = () => ev("(() => { const raw = localStorage.getItem('serumsquest:voxel:state:v1'); return raw ? JSON.parse(raw) : null; })()");
  return { ws, send, ev, click, waitFor, waitUrl, skipTutorial, state, errors, requests, failed, nav };
}

/* Abre el HUB y pulsa la tarjeta de SERUMS QUEST como un usuario: 1.er clic selecciona,
   2.º clic abre. Devuelve métricas de la navegación. */
async function openQuestFromHub(c) {
  const out = { steps: [] };
  out.hubUrl = await c.ev('location.href');
  out.hubTitle = await c.ev('document.title');
  out.cardHrefInitial = await c.ev("document.querySelector('[data-app=\\\"quest\\\"]').getAttribute('href')");
  await c.ev("localStorage.setItem('hub:probe:origin', 'same-origin')");
  await c.ev("(() => { const el=document.querySelector('[data-app=\\\"quest\\\"]'); el.click(); return true; })()");
  await sleep(500);
  out.afterFirstClick = await c.ev('location.href');
  out.afterFirstClickStillHub = /\/index\.html$/.test(out.afterFirstClick) && !/serums-quest/.test(out.afterFirstClick);
  out.questActive = await c.ev("document.querySelector('[data-app=\\\"quest\\\"]').classList.contains('is-active')");
  out.barTitle = await c.ev("document.getElementById('barTitle').textContent");
  out.cardHrefAfterSelect = await c.ev("document.querySelector('[data-app=\\\"quest\\\"]').getAttribute('href')");
  out.openButton = await c.ev("(() => { const b=document.getElementById('openCurrent'); return b ? { label:(b.querySelector('span')||{}).textContent, aria:b.getAttribute('aria-label') } : null; })()");
  await c.ev("(() => { const el=document.querySelector('[data-app=\\\"quest\\\"]'); el.click(); return true; })()");
  out.landed = await c.waitUrl(/serums-quest\/dist\/index\.html$/, 12000);
  out.landedEarly = await c.ev('location.href').catch(() => '');
  out.tutorial = await c.waitFor("!!document.querySelector('.tutorialShell')", 8000);
  await c.skipTutorial();
  out.menu = await c.waitFor("!!document.querySelector('.titleScreen')", 8000);
  out.menuText = ((await c.ev('document.body.innerText').catch(() => '')) || '').slice(0, 260);
  out.gameState = await c.ev('window.__gameState ? window.__gameState().phase : null').catch(() => 'ERR');
  out.canvas = await c.ev("!!document.querySelector('canvas#game')").catch(() => false);
  out.sameOriginMarker = await c.ev("localStorage.getItem('hub:probe:origin')").catch(() => null);
  out.nav = c.nav.slice();
  out.redirectStubVisited = c.nav.some((u) => /serums-quest\/index\.html$/.test(u));
  out.requestsGame = Array.from(new Set(c.requests)).filter((u) => /serums-quest/.test(u));
  out.externalRequests = Array.from(new Set(c.requests)).filter((u) => /^https?:/i.test(u) && !/^https?:\/\/127\.0\.0\.1/.test(u));
  out.errors = c.errors.slice();
  return out;
}

async function scenarioFileOffline() {
  const port = 9361;
  const { child, page } = await launch(port, 'hub-quest-offline', pathToFileURL(path.join(ROOT, 'index.html')).href,
    ['--host-resolver-rules=MAP * ~NOTFOUND']);
  const c = await connect(page);
  const out = { scenario: 'HUB file:// sin red (DNS bloqueado)' };
  try {
    await sleep(2600);
    Object.assign(out, await openQuestFromHub(c));
    out.offlineRequestsBlocked = c.failed.length;
    // Volver al HUB con el botón Atrás.
    await c.ev('history.back()');
    await sleep(1600);
    out.backUrl = await c.ev('location.href');
    out.backTitle = await c.ev('document.title');
    out.backIsHub = /\/index\.html$/.test(out.backUrl);
  } catch (e) { out.failure = e.stack || String(e); }
  finally { c.ws.close(); try { child.kill(); } catch {} }
  return out;
}

async function scenarioSaveImportExport(downloadDir) {
  const port = 9362;
  const { child, page } = await launch(port, 'hub-quest-save', pathToFileURL(path.join(ROOT, 'index.html')).href);
  const c = await connect(page);
  const out = { scenario: 'HUB → juego: guardado, importación y exportación' };
  try {
    await sleep(2600);
    Object.assign(out, await openQuestFromHub(c));
    // Importar una partida antigua (JSON del formato 1.2) desde el juego abierto por el HUB.
    await c.click('[data-action="open-import"]');
    await c.ev(`(() => { const t=document.querySelector('#legacyText'); t.value=${JSON.stringify(JSON.stringify(FIXTURE))}; t.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
    await c.click('[data-action="legacy-analyze"]');
    out.previewOldSave = await c.waitFor("document.body.innerText.includes('Offline QA')", 8000);
    await c.click('[data-action="import-confirm"]');
    await sleep(1000);
    let s = await c.state();
    out.imported = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom, schema: s.schema } : null;
    // Persistencia tras recargar.
    await c.send('Page.reload', { ignoreCache: true });
    await sleep(2600);
    await c.skipTutorial();
    s = await c.state();
    out.afterReload = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom } : null;
    out.continueVisible = await c.ev("document.body.innerText.includes('Continuar en el observatorio')");
    // Exportar partida.
    fs.mkdirSync(downloadDir, { recursive: true });
    for (const f of fs.readdirSync(downloadDir)) fs.unlinkSync(path.join(downloadDir, f));
    await c.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true });
    await c.click('[data-action="open-settings"]');
    await c.click('[data-action="export-save"]');
    let file = '';
    for (let i = 0; i < 40; i++) {
      const files = fs.readdirSync(downloadDir).filter((f) => f.endsWith('.json'));
      if (files.length) { file = files[0]; break; }
      await sleep(250);
    }
    out.exportFile = file;
    if (file) {
      const data = JSON.parse(fs.readFileSync(path.join(downloadDir, file), 'utf8'));
      out.exportData = { app: data.app, schema: data.saveSchema, name: data.state && data.state.profile && data.state.profile.name, coins: data.state && data.state.coins, xp: data.state && data.state.xp, importedFrom: data.state && data.state.importedFrom };
    }
    // El HTML exportado, abierto en el mismo navegador, encuentra el mismo guardado.
    await c.send('Page.navigate', { url: pathToFileURL(path.join(SQ, 'export', 'serums-quest.html')).href });
    await sleep(2600);
    await c.skipTutorial();
    s = await c.state();
    out.exportedHtml = {
      url: await c.ev('location.href'),
      title: await c.ev('document.title'),
      menu: await c.ev("!!document.querySelector('.titleScreen')"),
      sameSave: s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp } : null,
      continueVisible: await c.ev("document.body.innerText.includes('Continuar en el observatorio')")
    };
    out.errors = c.errors.slice();
  } catch (e) { out.failure = e.stack || String(e); }
  finally { c.ws.close(); try { child.kill(); } catch {} }
  return out;
}

async function scenarioLegacyLocal() {
  const port = 9363;
  const { child, page } = await launch(port, 'hub-quest-legacy-local', pathToFileURL(path.join(ROOT, 'index.html')).href);
  const c = await connect(page);
  const out = { scenario: 'HUB → juego: «Usar partida local» de la app 1.2' };
  try {
    await sleep(2600);
    await c.ev(`localStorage.setItem('serumsquest:state:v1', ${JSON.stringify(JSON.stringify(FIXTURE.state))})`);
    Object.assign(out, await openQuestFromHub(c));
    await c.click('[data-action="open-import"]');
    out.localNotice = await c.waitFor("!!document.querySelector('[data-action=\\\"legacy-local\\\"]')", 7000);
    if (out.localNotice) await c.click('[data-action="legacy-local"]');
    out.preview = await c.waitFor("document.body.innerText.includes('Offline QA')", 8000);
    await c.click('[data-action="import-confirm"]');
    await sleep(1000);
    const s = await c.state();
    out.imported = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom } : null;
    await c.send('Page.reload', { ignoreCache: true });
    await sleep(2600);
    await c.skipTutorial();
    const s2 = await c.state();
    out.afterReload = s2 ? { name: s2.profile && s2.profile.name, coins: s2.coins, xp: s2.xp, importedFrom: s2.importedFrom } : null;
    out.oldKeyStillThere = await c.ev("!!localStorage.getItem('serumsquest:state:v1')");
    out.errors = c.errors.slice();
  } catch (e) { out.failure = e.stack || String(e); }
  finally { c.ws.close(); try { child.kill(); } catch {} }
  return out;
}

async function scenarioHttp(server) {
  const port = 9364;
  const { child, page } = await launch(port, 'hub-quest-http', 'http://127.0.0.1:8123/index.html');
  const c = await connect(page);
  const out = { scenario: 'HUB servido por HTTP local' };
  try {
    await sleep(2800);
    Object.assign(out, await openQuestFromHub(c));
    out.httpOrigin = await c.ev('location.origin');
    out.usedBarButton = false;
    await c.send('Page.navigate', { url: 'http://127.0.0.1:8123/index.html' });
    await sleep(2200);
    await c.ev("(() => { const el=document.querySelector('[data-app=\\\"quest\\\"]'); el.click(); return true; })()");
    await sleep(500);
    await c.click('#openCurrent');
    out.barLanded = await c.waitUrl(/serums-quest\/dist\/index\.html$/, 12000);
    out.usedBarButton = !!out.barLanded;
    out.barTitle = await c.ev('document.title');
    out.barMenu = await c.waitFor("!!document.querySelector('.titleScreen') || !!document.querySelector('.tutorialShell')", 8000);
    out.errors = c.errors.slice();
  } catch (e) { out.failure = e.stack || String(e); }
  finally { c.ws.close(); try { child.kill(); } catch {} }
  return out;
}

function stripNoise(o) {
  if (!o) return o;
  const copy = Object.assign({}, o);
  delete copy.menuText;
  return copy;
}

(async () => {
  const report = { at: new Date().toISOString(), hub: path.join(ROOT, 'index.html'), build: path.join(SQ, 'dist', 'index.html') };
  const downloadDir = path.join(os.tmpdir(), 'hub-quest-downloads');
  report.fileOffline = await scenarioFileOffline();
  report.saveImportExport = await scenarioSaveImportExport(downloadDir);
  report.legacyLocal = await scenarioLegacyLocal();
  const server = await startServer(8123);
  try { report.http = await scenarioHttp(server); }
  finally { server.close(); }
  fs.writeFileSync(path.join(SQ, '.work', 'hub-entry-verify.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => { console.error('HUB_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
