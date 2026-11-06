const fs = require('fs');
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
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(200); }
  await send('Page.enable'); await send('Runtime.enable');
  await sleep(2200);
  const title = await ev("!!document.querySelector('.titleScreen')");
  const raw = await ev("localStorage.getItem('serumsquest:voxel:state:v1')");
  const state = raw ? JSON.parse(raw) : null;
  const persistence = !!(state && state.profile && state.profile.name === 'Offline QA' && state.collection.ownedCosmeticIds.includes('c-accesorios-brujula'));
  await click('[data-action="open-map"]'); await sleep(1200);
  const map = await ev("!!document.querySelector('.mapScreen')");
  const mapFps = await ev(`(async () => { const a=[]; for(let i=0;i<18;i++){ const s=window.__gameState(); if(s.fps) a.push(s.fps); await new Promise(r=>setTimeout(r,180)); } return a; })()`, true);
  let duelFps = [], phase = null, victory = false;
  if (await ev("!!document.querySelector('[data-action=map-start]')")) {
    await click('[data-action="map-start"]'); await sleep(900);
    const d = await ev(`(async () => { const a=[]; for(let i=0;i<110;i++){ const s=window.__gameState(); if(s.fps) a.push(s.fps); if(!document.querySelector('.resultScreen')) window.__autoplay(); await new Promise(r=>setTimeout(r,100)); if(document.querySelector('.resultScreen')) break; } return { fps:a, phase:window.__gameState().phase, text:document.body.innerText }; })()`, true);
    duelFps = d.fps; phase = d.phase; victory = /La ruta queda sellada|Ruta superada/.test(d.text);
  }
  const r = { title, persistence, map, mapMin: Math.min(...mapFps), mapAvg: mapFps.reduce((a,b)=>a+b,0)/mapFps.length, duelMin: duelFps.length ? Math.min(...duelFps) : null, duelAvg: duelFps.length ? duelFps.reduce((a,b)=>a+b,0)/duelFps.length : null, phase, victory };
  fs.writeFileSync('.work/offline-reopen-fps.json', JSON.stringify(r, null, 2));
  console.log(JSON.stringify(r, null, 2));
  ws.close();
})().catch((e) => { console.error('REOPEN_ERROR', e.stack || e); process.exitCode = 1; });
