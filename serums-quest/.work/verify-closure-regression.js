const fs = require('fs');
(async () => {
  const list = await (await fetch('http://127.0.0.1:9338/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression) { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(220); }
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.reload', { ignoreCache: true }); await sleep(2200);
  if (await ev("!!document.querySelector('.tutorialShell')")) await click('[data-action="tutorial-skip"]');
  if (await ev("!!document.querySelector('.titleScreen')")) await click('[data-action="menu-continue"]');
  await sleep(500);
  await click('[data-action="open-pause"]'); await sleep(300);
  const pause = await ev("document.body.innerText.includes('Respira. La pregunta espera.') || document.body.innerText.includes('El observatorio sigue aquí.')");
  await shot('bloque3-pausa.png');
  await click('[data-action="open-modes"]'); await sleep(300);
  const modes = await ev("!!document.querySelector('.modesShell')");
  await click('[data-action="close-sheet"]'); await sleep(250);
  if (await ev("!!document.querySelector('.pauseScreen, .overlay')")) { if (await ev("!!document.querySelector('[data-action=open-map]')")) { await click('[data-action="open-map"]'); await sleep(900); await shot('bloque3-mapa.png'); } }
  const map = await ev("!!document.querySelector('.mapScreen')");
  const fps = await ev('window.__gameState().fps');
  const result = { pause, modes, map, fps, errors };
  fs.writeFileSync('.work/block3-regression-ui.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('CLOSURE_REGRESSION_ERROR', e.stack || e); process.exitCode = 1; });
