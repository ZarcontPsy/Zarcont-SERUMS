const fs = require('fs');
(async () => {
  const list = await (await fetch('http://127.0.0.1:9340/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errors = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression) { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(250); }
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable'); await sleep(2200);
  const tutorial = await ev("!!document.querySelector('.tutorialShell')");
  if (tutorial) await shot('bloque3-tutorial.png');
  if (tutorial) await click('[data-action="tutorial-skip"]');
  await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.reload', { ignoreCache: true }); await sleep(2000);
  await click('[data-action="enter-game"]'); await sleep(600);
  const landscape = {
    coarse: await ev("matchMedia('(pointer: coarse)').matches"),
    joystick: await ev("(() => { const b=document.querySelector('.joystick'); if(!b)return null; const r=b.getBoundingClientRect(); const c=getComputedStyle(document.getElementById('touchControls')); return {display:c.display,width:r.width,height:r.height}; })()"),
    action: await ev("(() => { const b=document.getElementById('touchAction'); if(!b)return null; const r=b.getBoundingClientRect(); return {width:r.width,height:r.height,display:getComputedStyle(b).display}; })()"),
    scrollWidth: await ev('document.documentElement.scrollWidth'),
    innerWidth: await ev('window.innerWidth'),
    rotateDisplay: await ev("getComputedStyle(document.getElementById('rotatePrompt')).display")
  };
  await shot('bloque3-movil-horizontal.png');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
  await sleep(400);
  const portrait = {
    scrollWidth: await ev('document.documentElement.scrollWidth'),
    innerWidth: await ev('window.innerWidth'),
    rotateDisplay: await ev("getComputedStyle(document.getElementById('rotatePrompt')).display"),
    touchDisplay: await ev("getComputedStyle(document.getElementById('touchControls')).display")
  };
  await shot('bloque3-movil-vertical.png');
  const result = { tutorial, landscape, portrait, errors };
  fs.writeFileSync('.work/block3-mobile-verify.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('MOBILE_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
