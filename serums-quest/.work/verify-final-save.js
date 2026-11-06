const fs = require('fs');
const path = require('path');
(async () => {
  const dl = path.join(process.cwd(), '.work', 'final-downloads');
  fs.rmSync(dl, { recursive: true, force: true }); fs.mkdirSync(dl, { recursive: true });
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
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
  await ev(`(() => { const s=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); s.profile.name='Final Roundtrip'; s.xp=2460; s.coins=777; s.questionTags={'2025-i-psicologia-q009':{difficult:true,favorite:true,updatedAt:new Date().toISOString()}}; s.settings.tutorialSeen=true; localStorage.setItem('serumsquest:voxel:state:v1', JSON.stringify(s)); return true; })()`);
  await send('Page.reload', { ignoreCache: true }); await sleep(2000);
  if (await ev("!!document.querySelector('.tutorialShell')")) await click('[data-action="tutorial-skip"]');
  await click('[data-action="open-settings"]'); await sleep(300);
  await click('[data-action="export-save"]'); await sleep(800);
  const file = fs.readdirSync(dl).find((f) => f.endsWith('.json'));
  const payload = file ? JSON.parse(fs.readFileSync(path.join(dl, file), 'utf8')) : null;
  // Cambia a una partida distinta y luego importa el respaldo exportado.
  await ev(`(() => { const s=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); s.profile.name='Otra partida'; s.xp=1; s.coins=1; localStorage.setItem('serumsquest:voxel:state:v1', JSON.stringify(s)); return true; })()`);
  await send('Page.reload', { ignoreCache: true }); await sleep(1800);
  if (await ev("!!document.querySelector('.tutorialShell')")) await click('[data-action="tutorial-skip"]');
  await click('[data-action="open-import"]'); await sleep(250);
  await ev(`document.querySelector('#legacyText').value = ${JSON.stringify(JSON.stringify(payload))}`);
  await click('[data-action="legacy-analyze"]'); await sleep(300);
  const preview = await ev("document.body.innerText.includes('Final Roundtrip')");
  await click('[data-action="import-confirm"]'); await sleep(900);
  const state = JSON.parse(await ev("localStorage.getItem('serumsquest:voxel:state:v1')"));
  const result = { file, app: payload && payload.app, saveSchema: payload && payload.saveSchema, preview, importedName: state.profile.name, xp: state.xp, coins: state.coins, tag: state.questionTags['2025-i-psicologia-q009'] };
  fs.writeFileSync('.work/final-save-verify.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('FINAL_SAVE_ERROR', e.stack || e); process.exitCode = 1; });
