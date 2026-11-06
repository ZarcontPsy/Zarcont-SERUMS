'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest';
const LEGACY = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest-legacy\\index.html';
const EXPORTED = path.join(ROOT, 'export', 'serums-quest.html');
const DOWNLOAD = path.join(ROOT, '.work', 'legacy-export');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port, profile, url) {
  fs.rmSync(path.join(os.tmpdir(), profile), { recursive: true, force: true });
  const child = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(os.tmpdir(), profile)}`, '--window-size=1280,900', url], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((x) => x.type === 'page');
      if (page) return { child, page };
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not expose a page on port ' + port);
}

async function connect(page) {
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map(); const errors = []; const requests = [];
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  const ev = async (expression) => {
    const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result ? x.result.value : undefined;
  };
  const click = async (sel) => { const ok = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(300); };
  const waitFor = async (expr, ms = 8000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await ev(expr)) return true; await sleep(150); } return false; };
  return { ws, send, ev, click, waitFor, errors };
}

(async () => {
  const out = { scenario: 'legacy-export-to-new-import' };
  fs.rmSync(DOWNLOAD, { recursive: true, force: true });
  fs.mkdirSync(DOWNLOAD, { recursive: true });

  // 1) Export a real JSON from the archived 1.2 app through its own UI.
  let b = await launch(9354, 'serums-legacy-export', pathToFileURL(LEGACY).href + '#/ajustes');
  let c = await connect(b.page);
  try {
    await sleep(3000);
    out.legacyTitle = await c.ev('document.title');
    out.legacyRoute = await c.ev('location.hash');
    out.exportButton = await c.waitFor("!!document.querySelector('[data-action=\"export\"]')", 6000);
    if (!out.exportButton) {
      await c.ev("location.hash = '#/ajustes'");
      await sleep(1500);
      out.exportButton = await c.waitFor("!!document.querySelector('[data-action=\"export\"]')", 5000);
    }
    if (out.exportButton) {
      try { await c.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD, eventsEnabled: true }); } catch (e) { out.downloadBehaviorError = String(e.message || e); }
      await c.click('[data-action="export"]');
      let file = null;
      for (let i = 0; i < 50; i++) {
        const names = fs.readdirSync(DOWNLOAD).filter((n) => n.endsWith('.json'));
        if (names.length) { file = path.join(DOWNLOAD, names[0]); break; }
        await sleep(200);
      }
      out.exportFile = file;
      if (file) {
        const text = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(text);
        out.exportParsed = { app: parsed.app, build: parsed.build, hasState: !!parsed.state, profile: parsed.state && parsed.state.profile && parsed.state.profile.name, coins: parsed.state && parsed.state.coins, xp: parsed.state && parsed.state.xp, keys: Object.keys(parsed.state || {}).length };
        out.exportBytes = Buffer.byteLength(text);
        fs.copyFileSync(file, path.join(ROOT, '.work', 'legacy-export-real.json'));
        out.legacyErrors = c.errors;
      }
    }
  } catch (e) {
    out.legacyFailure = e.stack || String(e);
  } finally {
    try { await c.send('Browser.close'); } catch {}
    c.ws.close();
    try { b.child.kill(); } catch {}
    await sleep(1200);
  }

  // 2) Import that exact file into the new main build.
  if (!out.exportFile) { out.importSkipped = 'no export file'; console.log(JSON.stringify(out, null, 2)); return; }
  const raw = fs.readFileSync(out.exportFile, 'utf8');
  b = await launch(9355, 'serums-new-import-real', pathToFileURL(EXPORTED).href);
  c = await connect(b.page);
  try {
    await sleep(2400);
    if (await c.ev("!!document.querySelector('.tutorialShell')")) { await c.click('[data-action="tutorial-skip"]'); await sleep(400); }
    await c.ev('localStorage.clear()');
    await c.send('Page.reload', { ignoreCache: true });
    await sleep(2200);
    if (await c.ev("!!document.querySelector('.tutorialShell')")) { await c.click('[data-action="tutorial-skip"]'); await sleep(400); }
    await c.click('[data-action="open-import"]');
    await c.ev(`document.querySelector('#legacyText').value = ${JSON.stringify(raw)}`);
    await c.click('[data-action="legacy-analyze"]');
    out.preview = await c.waitFor("document.body.innerText.includes('Partida reconocida')", 6000);
    const previewName = await c.ev("(document.querySelector('.previewName') || {}).textContent || ''");
    out.previewName = previewName;
    await c.click('[data-action="import-confirm"]');
    await sleep(1200);
    const s = await c.ev("(() => { const r=localStorage.getItem('serumsquest:voxel:state:v1'); return r ? JSON.parse(r) : null; })()");
    out.imported = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom, schema: s.schema } : null;
    out.errors = c.errors;
  } catch (e) {
    out.importFailure = e.stack || String(e);
  } finally {
    c.ws.close();
    try { b.child.kill(); } catch {}
  }
  fs.writeFileSync(path.join(ROOT, '.work', 'migration-verify-legacy-export.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error('LEGACY_EXPORT_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
