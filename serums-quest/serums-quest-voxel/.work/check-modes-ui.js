(async () => {
  const list = await (await fetch('http://127.0.0.1:9334/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const exceptions = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || '')); };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression, awaitPromise = false) { const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || '')); return x.result && x.result.value; }
  await send('Runtime.enable'); await sleep(2200);
  console.log('rules', JSON.stringify(await ev('window.GAME.rules')));
  console.log('title', await ev("!!document.querySelector('.titleScreen')"));
  console.log('buttons', await ev("[...document.querySelectorAll('[data-action]')].map(x=>x.getAttribute('data-action')).slice(0,30)"));
  console.log('openModes', await ev("(()=>{const e=document.querySelector('[data-action=\"open-modes\"]'); if(!e)return false; e.click(); return true;})()"));
  await sleep(500);
  console.log('modes', await ev("!!document.querySelector('.modesShell')"));
  console.log('modeText', (await ev("document.body.innerText")).slice(0,300));
  console.log('startSurv', await ev("(()=>{const e=document.querySelector('[data-action=\"start-mode\"][data-mode=\"survival\"]'); if(!e)return false; e.click(); return true;})()"));
  await sleep(1200);
  console.log('gameState', JSON.stringify(await ev('window.__gameState()')));
  console.log('bodyStart', (await ev("document.body.innerText")).slice(0,500));
  console.log('exceptions', exceptions);
  ws.close();
})().catch((e) => { console.error('ERR', e.stack || e); process.exitCode = 1; });
