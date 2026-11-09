'use strict';
/* Arnés CDP mínimo de V2.3, sin dependencias. Cada agente usa un puerto y
   perfil propios. No modifica el juego: solo lo abre, conduce y captura. */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTarget(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < (timeoutMs || 30000)) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      const page = list.find((x) => x.type === 'page' && /^file:/.test(x.url)) || list.find((x) => x.type === 'page');
      if (page) return page;
    } catch (e) { /* todavía no */ }
    await sleep(160);
  }
  throw new Error('Chrome no abrió la pestaña en el puerto ' + port);
}

async function open(options) {
  const opts = options || {};
  const port = opts.port || 9530;
  const profileDir = opts.profile || path.join(__dirname, 'profiles', 'p' + port);
  const bundle = opts.bundle || path.join(ROOT, 'dist', 'index.html');
  const target = opts.url || pathToFileURL(bundle).href;
  const width = opts.width || 1280;
  const height = opts.height || 720;
  fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(profileDir, { recursive: true });
  const args = [
    '--headless=new', '--enable-unsafe-swiftshader',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--mute-audio',
    '--force-device-scale-factor=1', '--window-size=' + width + ',' + height,
    '--remote-debugging-port=' + port, '--user-data-dir=' + profileDir,
    'about:blank'
  ];
  const proc = spawn(CHROME, args, { stdio: 'ignore', windowsHide: true });
  const page = await waitForTarget(port);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  const warnings = [];
  const requests = [];
  ws.onmessage = (event) => {
    let m;
    try { m = JSON.parse(event.data); } catch (e) { return; }
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
      return;
    }
    const p = m.params || {};
    if (m.method === 'Runtime.exceptionThrown') {
      const d = p.exceptionDetails || {};
      errors.push({ kind: 'exception', text: String(d.text || ''), description: String((d.exception && d.exception.description) || '') });
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const text = (p.args || []).map((a) => a.value != null ? a.value : (a.description || a.type)).join(' ');
      if (p.type === 'error') errors.push({ kind: 'console', text });
      else if (p.type === 'warning') warnings.push({ kind: 'warning', text });
    } else if (m.method === 'Log.entryAdded') {
      const e = p.entry || {};
      if (e.level === 'error') errors.push({ kind: 'log', text: String(e.text || ''), url: String(e.url || '') });
      else if (e.level === 'warning') warnings.push({ kind: 'log', text: String(e.text || ''), url: String(e.url || '') });
    } else if (m.method === 'Network.requestWillBeSent') {
      requests.push({ url: p.request.url, type: p.type });
    }
  };
  const send = (method, params, timeout) => new Promise((resolve, reject) => {
    const mid = ++id;
    const timer = setTimeout(() => { pending.delete(mid); reject(new Error('CDP timeout: ' + method)); }, timeout || 30000);
    pending.set(mid, { resolve, reject, timer });
    ws.send(JSON.stringify({ id: mid, method: method, params: params || {} }));
  });
  async function ev(expression, awaitPromise) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: !!awaitPromise, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('eval: ' + String(d.text || '') + ' ' + String((d.exception && d.exception.description) || ''));
    }
    return r.result ? r.result.value : undefined;
  }
  async function waitFor(expression, timeout, interval) {
    const end = Date.now() + (timeout || 8000);
    while (Date.now() < end) {
      try { if (await ev('!!(' + expression + ')')) return true; } catch (e) { /* todavía no */ }
      await sleep(interval || 120);
    }
    return false;
  }
  async function click(selector, delay) {
    const ok = await ev('(() => { const el = document.querySelector(' + JSON.stringify(selector) + '); if (!el) return false; el.click(); return true; })()');
    if (!ok) throw new Error('No existe ' + selector);
    await sleep(delay == null ? 260 : delay);
    return true;
  }
  async function clickIf(selector, delay) { try { return await click(selector, delay); } catch (e) { return false; } }
  async function has(selector) { return !!(await ev('!!document.querySelector(' + JSON.stringify(selector) + ')')); }
  async function shot(file) {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }
  async function shotClip(selector, file, scale) {
    const rect = await ev('(() => { const el=document.querySelector(' + JSON.stringify(selector) + '); if(!el) return null; const r=el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; })()');
    if (!rect || !rect.width) throw new Error('No existe o está vacío ' + selector);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false,
      clip: { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: Math.max(1, rect.width), height: Math.max(1, rect.height), scale: scale || 2 } });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }
  async function setViewport(w, h) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await sleep(500);
  }
  async function navigate(url) {
    await send('Page.navigate', { url });
    await sleep(400);
    const booted = await waitFor("document.readyState === 'complete' && window.__gameState && window.__gameState().screen", 30000, 200);
    if (!booted) throw new Error('El juego no completó el arranque');
    await sleep(800);
    return true;
  }
  async function preload(script) {
    await send('Page.addScriptToEvaluateOnNewDocument', { source: script });
  }
  async function seed(save, options) {
    const opts = options || {};
    await ev(`(() => {
      ${JSON.stringify(['serumsquest:voxel:state:v1', 'serumsquest:voxel:settings:v1', 'serumsquest:voxel:preimport:v1', 'serumsquest:voxel:backup:v1', 'serumsquest:voxel:corrupt:v1'])}.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      try {
        localStorage.setItem('serumsquest:voxel:state:v1', ${JSON.stringify(JSON.stringify(save))});
        localStorage.setItem('serumsquest:voxel:settings:v1', ${JSON.stringify(JSON.stringify(save.settings || {}))});
      } catch (e) {}
      return true;
    })()`);
    if (opts.reload !== false) await navigate(target);
    return true;
  }
  async function readSave() {
    return ev("(() => { try { return JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1') || 'null'); } catch (e) { return null; } })()");
  }
  async function dismissBanners() {
    await clickIf('#backupBanner [data-action="backup-later"]', 120);
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');
  try { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); } catch (e) {}
  if (opts.preload) await preload(opts.preload);
  await navigate(target);
  return { proc, ws, send, ev, waitFor, click, clickIf, has, shot, shotClip, setViewport, navigate, preload, seed, readSave,
    dismissBanners, errors, warnings, requests, port, target, close: async () => { try { ws.close(); } catch (e) {} try { proc.kill(); } catch (e) {} } };
}

module.exports = { open, sleep, ROOT, CHROME };
