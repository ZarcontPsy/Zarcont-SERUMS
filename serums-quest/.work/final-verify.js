const fs = require('fs');
(async () => {
  const list = await (await fetch('http://127.0.0.1:9342/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errors = []; const requests = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url); };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression, awaitPromise = false) { const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || '')); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(220); }
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Page.reload', { ignoreCache: true }); await sleep(2300);
  const tutorial = await ev("!!document.querySelector('.tutorialShell')");
  if (tutorial) await shot('final-tutorial.png');
  if (tutorial) await click('[data-action="tutorial-skip"]');
  const menuLabels = await ev("document.body.innerText");
  const menuOk = ['Mapa','Arena','Modos','Inventario','Tienda','Bitácora','Ajustes','Importar'].every(x => menuLabels.includes(x));
  await shot('final-menu.png');
  await click('[data-action="menu-continue"]'); await sleep(500);
  await click('[data-action="open-pause"]'); await sleep(250);
  const pause = await ev("!!document.querySelector('[data-action=close-pause]')");
  await click('[data-action="close-pause"]'); await sleep(200);
  await click('[data-action="open-pause"]'); await sleep(150); await click('[data-action="open-map"]'); await sleep(1000);
  const map = await ev("!!document.querySelector('.mapScreen')");
  const mapFps = await ev(`(async()=>{const a=[];for(let i=0;i<14;i++){const s=window.__gameState();if(s.fps)a.push(s.fps);await new Promise(r=>setTimeout(r,250));}return a;})()`, true);
  await shot('final-map.png');
  const mapStart = await ev("!!document.querySelector('[data-action=map-start]')");
  let duelFps = [], victory = false, resultText = '';
  if (mapStart) {
    await click('[data-action="map-start"]'); await sleep(700);
    const played = await ev(`(async()=>{const a=[];for(let i=0;i<140;i++){const s=window.__gameState();if(s.fps)a.push(s.fps);if(!document.querySelector('.resultScreen'))window.__autoplay();await new Promise(r=>setTimeout(r,100));if(document.querySelector('.resultScreen'))break;}return {fps:a,phase:window.__gameState().phase,text:document.body.innerText};})()`, true);
    duelFps = played.fps; victory = played.phase === 'won' || /La ruta queda sellada/.test(played.text); resultText = played.text.slice(0, 500);
    await shot('final-result.png');
    if (await ev("!!document.querySelector('[data-action=result-continue]')")) { await click('[data-action="result-continue"]'); await sleep(600); }
  }
  await shot('final-map-after.png');
  if (await ev("!!document.querySelector('.mapScreen')")) await click('[data-action="map-close"]'); await sleep(400);
  const screenAfter = await ev('window.__gameState().screen');
  await click('[data-action="open-shop"]'); await sleep(350);
  const shop = await ev("!!document.querySelector('.shopScreen, .overlay')");
  await shot('final-shop.png');
  if (await ev("!!document.querySelector('[data-action=close-sheet]')")) await click('[data-action="close-sheet"]'); await sleep(250);
  await click('[data-action="open-wardrobe"]'); await sleep(500);
  const wardrobe = await ev("!!document.querySelector('.wardrobeScreen, .overlay')");
  await shot('final-wardrobe.png');
  if (await ev("!!document.querySelector('[data-action=close-sheet]')")) await click('[data-action="close-sheet"]'); await sleep(250);
  await click('[data-action="open-pause"]'); await sleep(180);
  await click('[data-action="open-review"]'); await sleep(300);
  const review = await ev("!!document.querySelector('.workbenchShell, .overlay')");
  await shot('final-review.png');
  if (await ev("!!document.querySelector('[data-action=close-sheet]')")) await click('[data-action="close-sheet"]'); await sleep(200);
  await click('[data-action="open-pause"]'); await sleep(150); await click('[data-action="open-settings"]'); await sleep(350);
  const settingsText = await ev('document.body.innerText');
  const versionOk = settingsText.includes('Versión final completa') && settingsText.includes('2026-11-06');
  await shot('final-settings.png');
  const result = {
    tutorial, menuOk, pause, map, mapStart,
    screenAfter, shop, wardrobe, review,
    victory,
    mapFps, duelFps,
    versionOk,
    network: Array.from(new Set(requests)).filter((u) => /^https?:/i.test(u)),
    errors,
    resultText
  };
  fs.writeFileSync('.work/final-file-verify.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('FINAL_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
