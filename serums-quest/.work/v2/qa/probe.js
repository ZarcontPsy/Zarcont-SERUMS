'use strict';
/* Sonda de QA V2: abre el build, siembra una partida completa y vuelca pantalla/acciones. */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..', '..', '..');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9351;
const profile = path.join(__dirname, 'profile-probe');
const save = fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8');
const url = pathToFileURL(path.join(root, 'dist', 'index.html')).href;
let proc;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitList() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((x) => x.type === 'page');
      if (page) return page;
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('Chrome no respondió');
}

(async () => {
  fs.rmSync(profile, { recursive: true, force: true });
  proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--enable-unsafe-swiftshader',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--window-size=960,540', `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, url
  ], { stdio: 'ignore' });
  const page = await waitList();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); }
  };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  async function ev(expression, awaitPromise = false) {
    const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result && x.result.value;
  }
  async function click(sel) {
    const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`);
    if (!ok) throw new Error('Missing ' + sel);
    await sleep(350);
  }
  await send('Page.enable'); await send('Runtime.enable');
  await sleep(1500);
  await ev(`localStorage.setItem('serumsquest:voxel:state:v1', ${JSON.stringify(save)})`);
  await send('Page.reload', { ignoreCache: true });
  await sleep(2500);
  if (await ev("!!document.querySelector('[data-action=tutorial-skip]')")) await click('[data-action="tutorial-skip"]');
  const state = await ev('window.__gameState ? window.__gameState() : null');
  console.log('STATE', JSON.stringify(state));
  console.log('TEXT', (await ev('document.body.innerText')).slice(0, 800).replace(/\n/g, ' | '));
  console.log('ACTIONS', JSON.stringify(await ev("[...document.querySelectorAll('[data-action]')].map(e=>e.getAttribute('data-action')+':'+(e.textContent||'').trim().slice(0,40)).slice(0,40)")));
  await send('Page.captureScreenshot', { format: 'png' }).then((r) => fs.writeFileSync(path.join(__dirname, 'probe.png'), Buffer.from(r.data, 'base64')));
  console.log('screenshot', path.join(__dirname, 'probe.png'));
  ws.close();
  proc.kill();
})().catch((e) => { console.error('PROBE_ERROR', e.stack || e); try { proc && proc.kill(); } catch (x) {} process.exitCode = 1; });
