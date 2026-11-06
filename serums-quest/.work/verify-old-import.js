const fs = require('fs');
(async () => {
  const fixture = fs.readFileSync('.work/offline-fixture.json', 'utf8');
  const list = await (await fetch('http://127.0.0.1:9342/json/list')).json();
  const t = list.find((x) => x.type === 'page' && x.url.startsWith('file:'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(JSON.stringify(m.error))) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const mid = ++id; pend.set(mid, { r, j }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function ev(expression) { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result && x.result.value; }
  async function click(sel) { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(220); }
  await send('Page.enable'); await send('Runtime.enable');
  if (await ev("!!document.querySelector('.titleScreen')") === false) { await send('Page.reload', { ignoreCache: true }); await sleep(1800); }
  await click('[data-action="open-import"]'); await sleep(250);
  await ev(`document.querySelector('#legacyText').value = ${JSON.stringify(fixture)}`);
  await click('[data-action="legacy-analyze"]'); await sleep(300);
  const preview = await ev("document.body.innerText.includes('Offline QA')");
  await click('[data-action="import-confirm"]'); await sleep(800);
  const state = JSON.parse(await ev("localStorage.getItem('serumsquest:voxel:state:v1')"));
  const result = { preview, profile: state.profile.name, coins: state.coins, importedFrom: state.importedFrom };
  fs.writeFileSync('.work/final-old-import.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('OLD_IMPORT_ERROR', e.stack || e); process.exitCode = 1; });
