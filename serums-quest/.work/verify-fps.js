const fs = require('fs');
const fixture = fs.readFileSync('.work/offline-fixture.json', 'utf8');
(async () => {
  const list = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression, awaitPromise = false) { const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; }
  async function waitFor(expr, ms = 5000) { const s = Date.now(); while (Date.now() - s < ms) { if (await ev(expr)) return true; await sleep(80); } return false; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(150); }
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.reload', { ignoreCache: true }); await sleep(2000);
  await click('[data-action="open-import"]'); await waitFor("!!document.querySelector('#legacyText')");
  await ev(`document.querySelector('#legacyText').value = ${JSON.stringify(fixture)}`);
  await click('[data-action="legacy-analyze"]'); await sleep(250); await click('[data-action="import-confirm"]'); await sleep(800);
  await click('[data-action="open-map"]'); await sleep(1000);
  const mapFps = await ev(`(async () => { const a=[]; for(let i=0;i<18;i++){ const s=window.__gameState(); if(s.fps) a.push(s.fps); await new Promise(r=>setTimeout(r,180)); } return a; })()`, true);
  if (!(await ev("!!document.querySelector('[data-action=map-start]')"))) throw new Error('no map start');
  await click('[data-action="map-start"]'); await sleep(900);
  const duel = await ev(`(async () => { const a=[]; for(let i=0;i<100;i++){ const s=window.__gameState(); if(s.fps) a.push(s.fps); if(!document.querySelector('.resultScreen')) window.__autoplay(); await new Promise(r=>setTimeout(r,100)); if(document.querySelector('.resultScreen')) break; } return { fps:a, phase:window.__gameState().phase, result: !!document.querySelector('.resultScreen'), text: document.body.innerText }; })()`, true);
  const data = { mapFps: mapFps, duelFps: duel.fps, phase: duel.phase, victory: /La ruta queda sellada|Ruta superada/.test(duel.text) };
  fs.writeFileSync('.work/offline-fps.json', JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ mapMin: Math.min(...mapFps), mapAvg: mapFps.reduce((a,b)=>a+b,0)/mapFps.length, duelMin: Math.min(...duel.fps), duelAvg: duel.fps.reduce((a,b)=>a+b,0)/duel.fps.length, phase: duel.phase, victory: data.victory }, null, 2));
  ws.close();
})().catch((e) => { console.error('FPS_ERROR', e.stack || e); process.exitCode = 1; });
