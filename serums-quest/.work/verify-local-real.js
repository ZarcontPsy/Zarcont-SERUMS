'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest';
const LEGACY = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest-legacy\\index.html';
const EXPORTED = path.join(ROOT, 'export', 'serums-quest.html');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port, profileDir, url) {
  const child = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, '--window-size=1280,900', url], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((x) => x.type === 'page');
      if (page) return { child, page };
    } catch {}
    await sleep(250);
  }
  throw new Error('no page on ' + port);
}

async function connect(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result ? x.result.value : undefined; };
  const click = async (sel) => { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(300); };
  const waitFor = async (expr, ms = 8000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await ev(expr)) return true; await sleep(150); } return false; };
  return { ws, send, ev, click, waitFor, errors };
}

(async () => {
  const out = { scenario: 'legacy-local-save-cross-restart' };
  const profile = path.join(os.tmpdir(), 'serums-real-local');
  fs.rmSync(profile, { recursive: true, force: true });

  // 1) The archived app at its new (legacy) path writes its own save.
  let b = await launch(9356, profile, pathToFileURL(LEGACY).href + '#/ajustes');
  let c = await connect(b.page);
  try {
    await sleep(3200);
    out.legacyStateKeyBefore = await c.ev("!!localStorage.getItem('serumsquest:state:v1')");
    out.legacyKeys = await c.ev('Object.keys(localStorage)');
    out.legacyProfile = await c.ev("(() => { const r=localStorage.getItem('serumsquest:state:v1'); if(!r) return null; try { const s=JSON.parse(r); return { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp }; } catch(e) { return 'unparsable'; } })()");
    // A harmless interaction that forces the archived app to persist its progress.
    if (await c.ev("!!document.querySelector('[data-action=\"toggle-sound\"], .q-toggle, [data-action=\"audio-toggle\"]')")) {
      await c.ev("(() => { const e=document.querySelector('[data-action=\"toggle-sound\"], .q-toggle, [data-action=\"audio-toggle\"]'); if(e) e.click(); })()");
      await sleep(600);
    }
    out.legacyStateKeyAfter = await c.ev("!!localStorage.getItem('serumsquest:state:v1')");
    out.legacyErrors = c.errors;
    await c.send('Browser.close');
  } catch (e) {
    out.legacyFailure = e.stack || String(e);
  } finally {
    c.ws.close();
    try { b.child.kill(); } catch {}
    await sleep(1800);
  }

  // 2) The new app in the same browser profile should offer "Usar partida local".
  b = await launch(9357, profile, pathToFileURL(EXPORTED).href);
  c = await connect(b.page);
  try {
    await sleep(2600);
    if (await c.ev("!!document.querySelector('.tutorialShell')")) { await c.click('[data-action="tutorial-skip"]'); await sleep(500); }
    out.oldKeyVisibleToNewApp = await c.ev("!!localStorage.getItem('serumsquest:state:v1')");
    await c.click('[data-action="open-import"]');
    out.localButton = await c.waitFor("!!document.querySelector('[data-action=\"legacy-local\"]')", 6000);
    if (out.localButton) {
      await c.click('[data-action="legacy-local"]');
      out.preview = await c.waitFor("document.body.innerText.includes('Partida reconocida')", 6000);
      out.previewName = await c.ev("(document.querySelector('.previewName') || {}).textContent || ''");
      await c.click('[data-action="import-confirm"]');
      await sleep(1200);
      const s = await c.ev("(() => { const r=localStorage.getItem('serumsquest:voxel:state:v1'); return r ? JSON.parse(r) : null; })()");
      out.imported = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom } : null;
    }
    out.errors = c.errors;
  } catch (e) {
    out.newFailure = e.stack || String(e);
  } finally {
    c.ws.close();
    try { b.child.kill(); } catch {}
  }
  fs.writeFileSync(path.join(ROOT, '.work', 'migration-verify-local-real.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error('LOCAL_REAL_ERROR', e.stack || e); process.exitCode = 1; });
