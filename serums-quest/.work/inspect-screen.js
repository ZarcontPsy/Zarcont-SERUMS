(async () => {
  const list = await (await fetch('http://127.0.0.1:9338/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true }); if (r.exceptionDetails) return { error: r.exceptionDetails.text, desc: r.exceptionDetails.exception && r.exceptionDetails.exception.description }; return r.result && r.result.value; };
  const out = {
    screen: await ev('window.__gameState ? window.__gameState().screen : null'),
    body: String(await ev('document.body.innerText') || '').slice(0, 600),
    hasTextScale: await ev("!!document.querySelector('[data-action=\"set-text-scale\"]')"),
    hasSettings: await ev("!!document.querySelector('.settingsShell')"),
    html: String(await ev("document.getElementById('screen') ? document.getElementById('screen').innerHTML.slice(0,250) : ''"))
  };
  console.log(JSON.stringify(out, null, 2));
  ws.close();
})().catch((e) => { console.error(e); process.exitCode = 1; });
