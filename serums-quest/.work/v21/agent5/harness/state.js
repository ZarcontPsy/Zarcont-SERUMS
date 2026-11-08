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
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL_BASE });
  await sleep(3000);
  await ev('window.__H5 && window.__H5.ready()', true);
  await sleep(800);
  const keys = await ev('Object.keys(localStorage)');
  console.log('keys', JSON.stringify(keys));
  const raw = await ev("localStorage.getItem('serumsquest:voxel:state:v1')");
  console.log('save bytes', raw ? raw.length : null);
  if (raw) {
    const s = JSON.parse(raw);
    console.log('top keys', JSON.stringify(Object.keys(s)));
    console.log('collection', JSON.stringify(s.collection).slice(0, 700));
    console.log('coins', s.coins);
  }
  ws.close(); process.exit(0);
})().catch((e) => { console.error('STATE_ERROR', e.stack || e); process.exit(1); });
