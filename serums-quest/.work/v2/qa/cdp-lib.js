'use strict';
/* Utilidades CDP para QA de SERUMS QUEST V2 (sin dependencias externas). */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTarget(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < (timeoutMs || 20000)) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((x) => x.type === 'page' && /^file:/.test(x.url)) || list.find((x) => x.type === 'page');
      if (page) return page;
    } catch (e) {}
    await sleep(200);
  }
  throw new Error('No apareció la pestaña de Chrome en el puerto ' + port);
}

async function open(options) {
  const opts = options || {};
  const port = opts.port || 9355;
  const profile = opts.profile || path.join(__dirname, 'profile-' + port);
  const bundle = opts.bundle || path.join(__dirname, '..', '..', '..', 'dist', 'index.html');
  const url = opts.url || pathToFileURL(bundle).href;
  fs.rmSync(profile, { recursive: true, force: true });
  const baseArgs = [
    '--headless=new',
    '--enable-unsafe-swiftshader',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--mute-audio', `--window-size=${opts.width || 960},${opts.height || 540}`,
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, url
  ];
  if (!opts.gpu) baseArgs.splice(1, 0, '--disable-gpu');
  if (opts.angle) baseArgs.splice(1, 0, '--use-angle=' + opts.angle);
  const proc = spawn(CHROME, baseArgs, { stdio: 'ignore' });
  const page = await waitForTarget(port);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  const errors = []; const requests = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) {
      const p = pend.get(m.id); pend.delete(m.id);
      m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails || {};
      errors.push(String(d.text || '') + ' ' + String(d.exception && d.exception.description || ''));
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(String(m.params.entry.text || ''));
    if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
  };
  const send = (method, params = {}) => new Promise((r, j) => {
    const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params }));
  });
  async function ev(expression, awaitPromise = false) {
    const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result && x.result.value;
  }
  async function waitFor(expression, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < (timeoutMs || 6000)) {
      if (await ev('!!(' + expression + ')')) return true;
      await sleep(100);
    }
    return false;
  }
  async function click(selector, wait) {
    const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e)return false; e.click(); return true; })()`);
    if (!ok) throw new Error('No existe ' + selector);
    await sleep(wait == null ? 260 : wait);
  }
  async function clickAll(selector) {
    return ev(`(() => { const list=[...document.querySelectorAll(${JSON.stringify(selector)})]; list.forEach(e=>e.click()); return list.length; })()`);
  }
  async function key(code, type) {
    const keyMap = { Enter: 'Enter', Escape: 'Escape', Space: ' ', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', KeyA: 'a', KeyD: 'd', KeyW: 'w', KeyS: 's', KeyE: 'e', KeyM: 'm', KeyJ: 'j', KeyR: 'r', KeyH: 'h' };
    await send('Input.dispatchKeyEvent', { type: type || 'keyDown', code: code, key: keyMap[code] || code, windowsVirtualKeyCode: 0 });
    if (!type || type === 'keyDown') await send('Input.dispatchKeyEvent', { type: 'keyUp', code: code, key: keyMap[code] || code, windowsVirtualKeyCode: 0 });
  }
  async function shot(file, format) {
    const r = await send('Page.captureScreenshot', { format: format || 'png', captureBeyondViewport: false });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }
  async function text() { return ev('document.body.innerText'); }
  async function state() { return ev('window.__gameState ? window.__gameState() : null'); }
  async function seed(save) {
    await ev(`localStorage.setItem('serumsquest:voxel:state:v1', ${JSON.stringify(JSON.stringify(save))})`);
    if (save && save.settings) await ev(`localStorage.setItem('serumsquest:voxel:settings:v1', ${JSON.stringify(JSON.stringify(save.settings))})`);
    await send('Page.reload', { ignoreCache: true });
    await sleep(2400);
    if (await ev("!!document.querySelector('[data-action=tutorial-skip]')")) await click('[data-action="tutorial-skip"]', 350);
  }
  async function close() {
    try { ws.close(); } catch (e) {}
    try { proc.kill(); } catch (e) {}
  }
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  await sleep(1200);
  return { proc, ws, send, ev, waitFor, click, clickAll, key, shot, text, state, seed, close, errors, requests, port };
}

module.exports = { open, sleep, CHROME };
