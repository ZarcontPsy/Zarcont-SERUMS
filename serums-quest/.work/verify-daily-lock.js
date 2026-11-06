(async () => {
  const fs = require('fs');
  const list = await (await fetch('http://127.0.0.1:9334/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression) { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(180); }
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.reload', { ignoreCache: true }); await sleep(2200);
  await click('[data-action="open-modes"]'); await sleep(500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('docs/bloque1-diario-bloqueado.png', Buffer.from(shot.data, 'base64'));
  const info = await ev("(() => { const b=document.querySelector('[data-action=start-mode][data-mode=daily]'); const s=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); return {disabled:!!(b&&b.disabled), text:b?b.innerText:'', dailyDate:s.modeStats.dailyDate, claims:s.modeStats.claims}; })()");
  console.log(JSON.stringify(info, null, 2));
  ws.close();
})().catch((e) => { console.error('LOCK_ERROR', e.stack || e); process.exitCode = 1; });
