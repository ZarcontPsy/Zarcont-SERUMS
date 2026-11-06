const fs = require('fs');
(async () => {
  const list = await (await fetch('http://127.0.0.1:9342/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression) { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(200); }
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable');
  if (await ev("!!document.querySelector('.tutorialShell')")) await click('[data-action="tutorial-skip"]');
  await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.reload', { ignoreCache: true }); await sleep(2000);
  if (await ev("!!document.querySelector('.tutorialShell')")) await click('[data-action="tutorial-skip"]');
  if (await ev("!!document.querySelector('.titleScreen')")) await click('[data-action="menu-continue"]');
  await sleep(400);
  const land = { coarse: await ev("matchMedia('(pointer: coarse)').matches"), joystick: await ev("(()=>{const e=document.querySelector('.joystick');const r=e.getBoundingClientRect();return [r.width,r.height,getComputedStyle(document.getElementById('touchControls')).display]})()"), overflow: await ev('document.documentElement.scrollWidth - window.innerWidth') };
  await shot('final-mobile.png');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
  await sleep(300);
  const port = { rotate: await ev("getComputedStyle(document.getElementById('rotatePrompt')).display"), touch: await ev("getComputedStyle(document.getElementById('touchControls')).display"), overflow: await ev('document.documentElement.scrollWidth - window.innerWidth') };
  await shot('final-mobile-portrait.png');
  console.log(JSON.stringify({ land, port }, null, 2));
  ws.close();
})().catch((e) => { console.error(e); process.exitCode = 1; });
