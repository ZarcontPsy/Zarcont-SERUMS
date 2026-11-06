(async () => {
  const list = await (await fetch('http://127.0.0.1:9342/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, returnByValue: true }); return x.result && x.result.value; };
  await sleep(2200);
  const raw = await ev("localStorage.getItem('serumsquest:voxel:state:v1')");
  const state = raw ? JSON.parse(raw) : null;
  const result = { hasState: !!state, profile: state && state.profile.name, coins: state && state.coins, importedFrom: state && state.importedFrom, tutorialOpen: await ev("!!document.querySelector('.tutorialShell')"), title: await ev("!!document.querySelector('.titleScreen')"), network: (await ev("performance.getEntriesByType('resource').map(x=>x.name).filter(x=>/^https?:/.test(x))")) };
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error(e); process.exitCode = 1; });
