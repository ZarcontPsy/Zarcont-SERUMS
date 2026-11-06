(async () => {
  const list = await (await fetch('http://127.0.0.1:9342/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, returnByValue: true }); return x.result && x.result.value; };
  console.log('before', await ev("localStorage.getItem('serumsquest:voxel:state:v1')") ? 'state-present' : 'no-state');
  await send('Browser.close');
})().catch((e) => { console.error(e); process.exitCode = 1; });
