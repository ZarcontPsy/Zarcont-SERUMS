const fs = require('fs');
(async () => {
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
  async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('docs/' + name, Buffer.from(r.data, 'base64')); }
  await send('Page.enable'); await send('Runtime.enable');
  await ev(`(() => { const s=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); s.settings.tutorialSeen=true; s.backup={lastExportedAt:null,lastPromptAt:null}; s.settings.backupReminder=true; s.profile.name='Cierre QA'; s.xp=1200; s.coins=200; localStorage.setItem('serumsquest:voxel:state:v1', JSON.stringify(s)); localStorage.setItem('serumsquest:voxel:settings:v1', JSON.stringify(s.settings)); return true; })()`);
  await send('Page.reload', { ignoreCache: true }); await sleep(2300);
  const banner = await ev("!!document.getElementById('backupBanner') && !document.getElementById('backupBanner').classList.contains('hidden')");
  if (banner) await shot('bloque3-recordatorio-respaldo.png');
  if (banner) await click('[data-action="backup-later"]');
  const bannerAfter = await ev("!!document.getElementById('backupBanner') && !document.getElementById('backupBanner').classList.contains('hidden')");
  await ev("localStorage.setItem('serumsquest:voxel:state:v1','{esto no es json'); true");
  await send('Page.reload', { ignoreCache: true }); await sleep(2300);
  const recovery = await ev("!!document.querySelector('.recoveryShell')");
  if (recovery) await shot('bloque3-recuperacion.png');
  const recoveryText = await ev("document.body.innerText");
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: require('path').join(process.cwd(), '.work', 'downloads') });
  if (recovery) await click('[data-action="recovery-download"]');
  await sleep(600);
  if (recovery) { await click('[data-action="recovery-reset"]'); await sleep(150); await click('[data-action="recovery-reset"]'); await sleep(700); }
  const afterReset = await ev("!!document.querySelector('.titleScreen')");
  const result = { banner, bannerAfter, recovery, recoveryText: recoveryText.slice(0, 600), afterReset, errors };
  fs.writeFileSync('.work/block3-recovery-verify.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  ws.close();
})().catch((e) => { console.error('RECOVERY_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
