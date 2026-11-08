'use strict';
/* Inspección puntual del DOM del panel en un tamaño dado. */
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname);
const HARNESS = path.join(ROOT, 'duel-harness.html');
const PORT = 9482;
const PROFILE = path.join(os.tmpdir(), 'v2d-inspect-' + process.pid);
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const W = Number(process.argv[2]) || 960;
const H = Number(process.argv[3]) || 540;
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function waitJson(url, ms) {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch (e) {}
    await sleep(120);
  }
  throw new Error('timeout ' + url);
}
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
  return {
    send(method, params) { const mid = ++id; return new Promise((res, rej) => { pend.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params: params || {} })); }); },
    close() { try { ws.close(); } catch (e) {} }
  };
}
(async () => {
  const child = spawn(EXE, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE,
    '--no-first-run', '--disable-gpu', '--allow-file-access-from-files', '--force-device-scale-factor=1',
    'file:///' + HARNESS.replace(/\\/g, '/')], { detached: true, stdio: 'ignore' });
  child.unref();
  let page = null;
  try {
    const v = await waitJson('http://127.0.0.1:' + PORT + '/json/version', 12000);
    const list = await waitJson('http://127.0.0.1:' + PORT + '/json/list', 8000);
    const target = list.find((t) => t.type === 'page');
    page = await connect(target.webSocketDebuggerUrl);
    await page.send('Page.enable'); await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await sleep(300);
    await page.send('Runtime.evaluate', { expression: '__H.prepare()', awaitPromise: true, returnByValue: true });
    await sleep(500);
    const expr = `(() => {
      const q = document.querySelector('.questionText');
      const body = document.querySelector('.duelPanelBody');
      const panel = document.querySelector('.duelPanel');
      const head = document.querySelector('.duelPanelHead');
      const ans = document.querySelector('.answers');
      const info = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height), scrollTop:el.scrollTop, scrollH:el.scrollHeight, clientH:el.clientHeight, display:cs.display, visibility:cs.visibility, opacity:cs.opacity, color:cs.color, fontSize:cs.fontSize, overflow:cs.overflow, flex:cs.flex, alignSelf:cs.alignSelf, zIndex:cs.zIndex }; };
      return {
        viewport:[innerWidth,innerHeight], dock: V2.duel.metrics().dock,
        panel: info(panel), head: info(head), body: info(body), question: info(q), answers: info(ans),
        qText: q ? q.textContent.slice(0,120) : null,
        bodyScrollTop: body ? body.scrollTop : null,
        bodyChildren: body ? Array.from(body.children).map(c => c.className + ':' + Math.round(c.getBoundingClientRect().height)) : [],
        headChildren: head ? Array.from(head.children).map(c => ({ cls: c.className, w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height), x: Math.round(c.getBoundingClientRect().x), display: getComputedStyle(c).display })) : [],
        metrics: V2.duel.metrics()
      };
    })()`;
    const res = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(JSON.stringify(res.result.value, null, 2));
  } catch (e) { console.error('INSPECT_ERROR', e.stack || e); process.exitCode = 1; }
  finally {
    try { if (page) page.close(); } catch (e) {}
    try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) {}
    await sleep(400);
    try { require('fs').rmSync(PROFILE, { recursive: true, force: true, maxRetries: 2, retryDelay: 300 }); } catch (e) {}
  }
})();
