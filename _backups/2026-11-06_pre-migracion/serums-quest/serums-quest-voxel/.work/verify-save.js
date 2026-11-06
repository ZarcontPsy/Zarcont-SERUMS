const fs = require('fs');
const path = require('path');
(async () => {
  const dl = path.join(process.cwd(), '.work', 'downloads');
  fs.rmSync(dl, { recursive: true, force: true });
  fs.mkdirSync(dl, { recursive: true });
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
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
  await ev(`(() => { const raw=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); raw.profile.name='Roundtrip QA'; raw.xp=1750; raw.coins=333; raw.questionTags={'2025-i-psicologia-q009':{difficult:true,favorite:true,updatedAt:new Date().toISOString()}}; raw.modeStats.dailyDate='2026-11-05'; raw.settings.tutorialSeen=true; localStorage.setItem('serumsquest:voxel:state:v1', JSON.stringify(raw)); return true; })()`);
  await send('Page.reload', { ignoreCache: true }); await sleep(2000);
  await click('[data-action="open-settings"]'); await sleep(250);
  await click('[data-action="export-save"]'); await sleep(900);
  const files = fs.readdirSync(dl).filter((f) => f.endsWith('.json'));
  const file = files[0] ? path.join(dl, files[0]) : null;
  const payload = file ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  await ev(`(() => { const raw=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); raw.profile.name='Otra partida'; raw.xp=1; raw.coins=1; localStorage.setItem('serumsquest:voxel:state:v1', JSON.stringify(raw)); localStorage.removeItem('serumsquest:voxel:settings:v1'); return true; })()`);
  await send('Page.reload', { ignoreCache: true }); await sleep(2000);
  await click('[data-action="open-import"]'); await sleep(250);
  await ev(`document.querySelector('#legacyText').value = ${JSON.stringify(JSON.stringify(payload))}`);
  await click('[data-action="legacy-analyze"]'); await sleep(300);
  const preview = await ev("document.querySelector('.importPreview') ? document.body.innerText.slice(0,900) : ''");
  await click('[data-action="import-confirm"]'); await sleep(900);
  const importedRaw = await ev("localStorage.getItem('serumsquest:voxel:state:v1')");
  const imported = importedRaw ? JSON.parse(importedRaw) : null;
  const result = {
    downloadFile: file,
    exportApp: payload && payload.app,
    saveSchema: payload && payload.saveSchema,
    previewHasName: preview.includes('Roundtrip QA'),
    importedName: imported && imported.profile.name,
    importedXp: imported && imported.xp,
    importedCoins: imported && imported.coins,
    importedTag: imported && imported.questionTags && imported.questionTags['2025-i-psicologia-q009'],
    importedDailyDate: imported && imported.modeStats && imported.modeStats.dailyDate,
    errors
  };
  fs.writeFileSync('.work/block3-save-verify.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('SAVE_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
