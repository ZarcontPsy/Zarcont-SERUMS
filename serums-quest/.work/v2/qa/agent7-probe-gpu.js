'use strict';
/* Sonda de entorno: WebGL y FPS en Chrome headless con/sin SwiftShader.
   No toca el juego; solo lee el renderer y __gameState. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const bundle = path.resolve(__dirname, '..', '..', '..', 'dist', 'index.html');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(label, extraFlags, port) {
  const profile = path.join(__dirname, 'agent7-probe-' + port);
  fs.rmSync(profile, { recursive: true, force: true });
  const proc = spawn(CHROME, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--mute-audio',
    '--window-size=960,540', '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    ...extraFlags, pathToFileURL(bundle).href
  ], { stdio: 'ignore' });
  let page = null;
  for (let i = 0; i < 100 && !page; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      page = list.find((x) => x.type === 'page');
    } catch (e) {}
    if (!page) await sleep(200);
  }
  if (!page) { proc.kill(); return { label, error: 'sin pestaña' }; }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(String((m.params.exceptionDetails || {}).text || ''));
  };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await sleep(1000);
  await ev(`localStorage.setItem('serumsquest:voxel:state:v1', ${JSON.stringify(JSON.stringify(save))})`);
  await send('Page.reload', { ignoreCache: true });
  await sleep(2600);
  if (await ev("!!document.querySelector('[data-action=tutorial-skip]')")) await ev("document.querySelector('[data-action=tutorial-skip]').click()");
  const gl = await ev(`(() => { try { var c=document.createElement('canvas'); var g=c.getContext('webgl2')||c.getContext('webgl'); if(!g) return { ok:false, reason:'sin contexto' }; var d=g.getExtension('WEBGL_debug_renderer_info'); return { ok:true, vendor: d?g.getParameter(d.UNMASKED_VENDOR_WEBGL):g.getParameter(g.VENDOR), renderer: d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER), version:g.getParameter(g.VERSION) }; } catch(e){ return { ok:false, reason:String(e) }; } })()`);
  await ev("document.querySelector('[data-action=menu-continue]') && document.querySelector('[data-action=menu-continue]').click()");
  await sleep(1200);
  const samples = [];
  const end = Date.now() + 3000;
  while (Date.now() < end) {
    const st = await ev('window.__gameState && window.__gameState()');
    if (st && st.fps) samples.push(st.fps);
    await sleep(120);
  }
  const out = { label, flags: extraFlags, gl, fps: samples.length ? { min: Math.min(...samples), avg: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length), samples: samples.length } : null, errors: errors.slice(0, 5) };
  ws.close(); proc.kill();
  await sleep(300);
  return out;
}

(async () => {
  const results = [];
  results.push(await run('swiftshader', ['--disable-gpu', '--enable-unsafe-swiftshader'], 9371));
  results.push(await run('gpu-default', [], 9372));
  results.push(await run('gpu-angle-d3d11', ['--use-angle=d3d11', '--enable-gpu'], 9373));
  console.log(JSON.stringify(results, null, 2));
})();
