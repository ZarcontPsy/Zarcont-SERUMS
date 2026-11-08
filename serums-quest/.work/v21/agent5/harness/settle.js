'use strict';
const PORT = 9338;
const URL_BASE = 'http://127.0.0.1:8899/.work/v21/agent5/harness/harness.html';
(async () => {
  const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
  const target = list.find((x) => x.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + ((x.exceptionDetails.exception || {}).description || ''));
    return x.result && x.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL_BASE });
  await ev('window.__H5 && window.__H5.ready()', true);
  const sample = async (label) => {
    const v = await ev(`(function(){
      var c=document.querySelector('.v2-carousel'); var n=document.querySelector('.v2-carousel-card.is-next');
      var a=document.querySelector('.v2-carousel-card.is-center');
      var nr=n?n.getBoundingClientRect():null; var ar=a?a.getBoundingClientRect():null;
      return {label:${JSON.stringify(label)}, step: c?c.style.getPropertyValue('--v2-step'):null, nextX: nr?Math.round(nr.x):null, nextRight: nr?Math.round(nr.right):null, centerRight: ar?Math.round(ar.right):null, transform: n?getComputedStyle(n).transform:null, ready: !!window.__H5, mounted: !!c };
    })()`);
    console.log(JSON.stringify(v));
  };
  for (const delay of [0, 200, 400, 600, 900, 1500, 2500, 4000]) {
    if (delay) await sleep(delay === 200 ? 200 : delay - (delay === 400 ? 200 : delay === 600 ? 400 : delay === 900 ? 600 : delay === 1500 ? 900 : delay === 2500 ? 1500 : 2500));
    await sample('t+' + delay);
  }
  ws.close(); process.exit(0);
})().catch((e) => { console.error('INSPECT_ERROR', e.stack || e); process.exit(1); });
