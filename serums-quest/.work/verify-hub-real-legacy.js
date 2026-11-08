'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS';
const SQ = path.join(ROOT, 'serums-quest');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const REAL = fs.readFileSync(path.join(SQ, '.work', 'legacy-export-real.json'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const port = 9391;
  const dir = path.join(os.tmpdir(), 'hub-legacy-real');
  fs.rmSync(dir, { recursive: true, force: true });
  const child = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu-sandbox',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=1280,800',
    pathToFileURL(path.join(ROOT, 'index.html')).href], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 100; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); page = list.find((x) => x.type === 'page'); if (page) break; } catch {}
    await sleep(200);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result ? x.result.value : undefined; };
  const waitFor = async (expr, ms = 8000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await ev(expr)) return true; } catch {} await sleep(150); } return false; };
  const click = async (sel) => { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(260); };
  const out = { scenario: 'HUB → juego: importar el JSON real exportado por la app 1.2' };
  try {
    await sleep(2800);
    await ev("(() => { document.querySelector('[data-app=\\\"quest\\\"]').click(); return true; })()");
    await sleep(500);
    await ev("(() => { document.querySelector('[data-app=\\\"quest\\\"]').click(); return true; })()");
    await waitFor("location.pathname.endsWith('/serums-quest/dist/index.html')", 12000);
    await sleep(1600);
    if (await ev("!!document.querySelector('.tutorialShell')")) { await click('[data-action="tutorial-skip"]'); await sleep(500); }
    await waitFor("!!document.querySelector('.titleScreen')");
    await click('[data-action="open-import"]');
    await ev(`(() => { const t=document.querySelector('#legacyText'); t.value=${JSON.stringify(REAL)}; t.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
    await click('[data-action="legacy-analyze"]');
    out.preview = await waitFor("document.body.innerText.includes('Serumista')");
    await click('[data-action="import-confirm"]');
    await sleep(1000);
    const s = await ev("(() => { const raw=localStorage.getItem('serumsquest:voxel:state:v1'); return raw?JSON.parse(raw):null; })()");
    out.imported = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom, schema: s.schema } : null;
    await send('Page.reload', { ignoreCache: true });
    await sleep(2600);
    if (await ev("!!document.querySelector('.tutorialShell')")) { await click('[data-action="tutorial-skip"]'); await sleep(500); }
    const s2 = await ev("(() => { const raw=localStorage.getItem('serumsquest:voxel:state:v1'); return raw?JSON.parse(raw):null; })()");
    out.afterReload = s2 ? { name: s2.profile && s2.profile.name, importedFrom: s2.importedFrom } : null;
    out.continueVisible = await ev("document.body.innerText.includes('Continuar en el observatorio')");
    out.errors = errors;
  } catch (e) { out.failure = e.stack || String(e); }
  finally { ws.close(); try { child.kill(); } catch {} }
  fs.writeFileSync(path.join(SQ, '.work', 'hub-real-legacy-import.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error(e.stack || e); process.exitCode = 1; });
