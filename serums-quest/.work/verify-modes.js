const fs = require('fs');
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
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(150); }
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.reload', { ignoreCache: true }); await sleep(2200);
  await click('[data-action="open-modes"]');
  const menu = await ev("!!document.querySelector('.modesShell')");
  await click('[data-action="start-mode"][data-mode="daily"]');
  await sleep(500);
  const dailyStarted = await ev("window.__gameState().screen === 'duel' && window.__gameState().mode === 'daily'");
  const played = await ev(`(async () => { for (let i=0;i<160;i++) { if (document.querySelector('.resultScreen')) break; window.__autoplay(); await new Promise(r=>setTimeout(r,120)); } return { result: !!document.querySelector('.resultScreen'), state: window.__gameState(), body: document.body.innerText.slice(0,300) }; })()`, true);
  const dailyDate = await ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).modeStats.dailyDate");
  if (played.result) { await click('[data-action="result-continue"]'); await sleep(300); }
  const dailyDone = await ev("(() => { const b=document.querySelector('[data-action=start-mode][data-mode=daily]'); return {screen: window.__gameState().screen, disabled: !!(b && b.disabled), text: b ? b.innerText : ''}; })()");
  console.log('module_a', JSON.stringify({ menu, dailyStarted, result: played.result, dailyDate, dailyDone, exceptions }, null, 2));
  await click('[data-action="close-sheet"]'); await sleep(300);
  await click('[data-action="open-settings"]'); await sleep(250);
  if (await ev("!!document.querySelector('[data-action=toggle-extra-time]')")) await click('[data-action="toggle-extra-time"]');
  await click('[data-action="close-settings"]'); await sleep(250);
  await click('[data-action="open-modes"]'); await sleep(300);
  await click('[data-action="start-mode"][data-mode="timed"][data-seconds="180"]'); await sleep(600);
  const timer = await ev("document.querySelector('[data-mode-timer]') ? document.querySelector('[data-mode-timer]').innerText : ''");
  const timedState = await ev("window.__gameState()");
  console.log('module_b', JSON.stringify({ timer, timedState, exceptions }, null, 2));
  fs.writeFileSync('.work/modes-verify.json', JSON.stringify({ menu, dailyStarted, result: played.result, dailyDate, dailyDone, timer, timedState, exceptions }, null, 2));
  ws.close();
})().catch((e) => { console.error('MODES_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
