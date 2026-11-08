'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS';
const BROWSERS = {
  edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(browser, port, profile, url) {
  const dir = path.join(os.tmpdir(), profile);
  fs.rmSync(dir, { recursive: true, force: true });
  const child = spawn(BROWSERS[browser], ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu-sandbox',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1280,800', url], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((x) => x.type === 'page');
      if (page) return { child, page };
    } catch {}
    await sleep(200);
  }
  throw new Error('no page');
}

async function connect(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (expression) => {
    const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text);
    return x.result ? x.result.value : undefined;
  };
  const waitUrl = async (re, ms = 12000) => { const end = Date.now() + ms; while (Date.now() < end) { try { const u = await ev('location.href'); if (re.test(u)) return u; } catch {} await sleep(200); } return ''; };
  return { ws, send, ev, waitUrl, errors };
}

async function hubClick(browser, port, profile) {
  const out = { browser };
  const { child, page } = await launch(browser, port, profile, pathToFileURL(path.join(ROOT, 'index.html')).href);
  const c = await connect(page);
  try {
    await sleep(2800);
    out.hubTitle = await c.ev('document.title');
    await c.ev("localStorage.removeItem('serumshub:active:v1')");
    await c.ev("(() => { document.querySelector('[data-app=\\\"quest\\\"]').click(); return true; })()");
    await sleep(500);
    out.afterSelect = await c.ev('location.href');
    await c.ev("(() => { document.querySelector('[data-app=\\\"quest\\\"]').click(); return true; })()");
    out.landed = await c.waitUrl(/serums-quest\/dist\/index\.html$/);
    out.tutorialOrMenu = await (async () => {
      for (let i = 0; i < 40; i++) {
        if (await c.ev("!!document.querySelector('.tutorialShell') || !!document.querySelector('.titleScreen')").catch(() => false)) return true;
        await sleep(200);
      }
      return false;
    })();
    out.title = await c.ev('document.title');
    out.errors = c.errors.slice();
  } catch (e) { out.failure = e.stack || String(e); }
  finally { c.ws.close(); try { child.kill(); } catch {} }
  return out;
}

async function stubDirect(browser, port, profile) {
  const out = { browser, route: 'serums-quest/index.html (redirección antigua)' };
  const { child, page } = await launch(browser, port, profile, pathToFileURL(path.join(ROOT, 'serums-quest', 'index.html')).href);
  const c = await connect(page);
  try {
    await sleep(3500);
    out.landed = await c.ev('location.href');
    out.title = await c.ev('document.title');
    out.isDist = /dist\/index\.html$/.test(out.landed);
    out.gameMounted = await c.ev("!!document.querySelector('canvas#game') && (!!document.querySelector('.tutorialShell') || !!document.querySelector('.titleScreen'))");
    out.errors = c.errors.slice();
  } catch (e) { out.failure = e.stack || String(e); }
  finally { c.ws.close(); try { child.kill(); } catch {} }
  return out;
}

async function barButton(port, profile) {
  const out = { scenario: 'barra inferior: Abrir/Continuar' };
  const { child, page } = await launch('chrome', port, profile, pathToFileURL(path.join(ROOT, 'index.html')).href);
  const c = await connect(page);
  try {
    await sleep(2800);
    await c.ev("localStorage.removeItem('serumshub:active:v1')");
    await c.ev("(() => { document.querySelector('[data-app=\\\"quest\\\"]').click(); return true; })()");
    await sleep(500);
    out.openLabel = await c.ev("(document.querySelector('#openCurrent span')||{}).textContent");
    out.aria = await c.ev("document.getElementById('openCurrent').getAttribute('aria-label')");
    await c.ev("document.getElementById('openCurrent').click()");
    out.landed = await c.waitUrl(/serums-quest\/dist\/index\.html$/);
    out.menu = await (async () => { for (let i = 0; i < 40; i++) { if (await c.ev("!!document.querySelector('.titleScreen') || !!document.querySelector('.tutorialShell')").catch(() => false)) return true; await sleep(200); } return false; })();
    out.errors = c.errors.slice();
  } catch (e) { out.failure = e.stack || String(e); }
  finally { c.ws.close(); try { child.kill(); } catch {} }
  return out;
}

(async () => {
  const report = {};
  report.edgeHub = await hubClick('edge', 9371, 'hub-edge-test');
  report.chromeHub = await hubClick('chrome', 9372, 'hub-chrome-test');
  report.edgeStub = await stubDirect('edge', 9373, 'stub-edge-test');
  report.chromeStub = await stubDirect('chrome', 9374, 'stub-chrome-test');
  report.bar = await barButton(9375, 'bar-chrome-test');
  fs.writeFileSync(path.join(ROOT, 'serums-quest', '.work', 'hub-edge-verify.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => { console.error('EDGE_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
