'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port, profile, url) {
  const dir = path.join(os.tmpdir(), profile);
  fs.rmSync(dir, { recursive: true, force: true });
  const child = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=960,540', url], { stdio: 'ignore' });
  for (let i = 0; i < 80; i++) {
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
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result ? x.result.value : undefined;
  };
  const click = async (sel) => { const ok = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(260); };
  const waitFor = async (expr, ms = 7000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await ev(expr)) return true; await sleep(150); } return false; };
  return { ws, send, ev, click, waitFor, errors, requests };
}

(async () => {
  const port = 9349;
  const rootIndex = pathToFileURL(path.join(ROOT, 'index.html')).href;
  const { child, page } = await launch(port, 'serums-mig-redirect2', rootIndex);
  const { ws, send, ev, click, waitFor, errors, requests } = await connect(page);
  const out = { scenario: 'redirect-save-legacy' };
  try {
    await sleep(3200);
    out.url = await ev('location.href');
    out.title = await ev('document.title');
    out.tutorial = await ev("!!document.querySelector('.tutorialShell')");
    if (out.tutorial) { out.tutorialSkipped = await ev("(() => { const b=document.querySelector('[data-action=\"tutorial-skip\"]'); if(!b) return false; b.click(); return true; })()"); await sleep(500); }
    out.titleScreen = await waitFor("!!document.querySelector('.titleScreen')", 5000);
    out.soundButton = await ev("!!document.querySelector('[data-action=\"toggle-sound\"]')");
    const settingsBefore = await ev("localStorage.getItem('serumsquest:voxel:settings:v1')");
    await click('[data-action="toggle-sound"]');
    await sleep(400);
    const settingsAfter = await ev("localStorage.getItem('serumsquest:voxel:settings:v1')");
    out.settingsWritten = !!settingsAfter && settingsAfter !== settingsBefore;
    out.settingsSample = settingsAfter ? JSON.parse(settingsAfter) : null;
    await send('Page.reload', { ignoreCache: true });
    await sleep(3000);
    if (await ev("!!document.querySelector('.tutorialShell')")) { await ev("(() => { const b=document.querySelector('[data-action=\"tutorial-skip\"]'); if(b) b.click(); })()"); await sleep(400); }
    const settingsReloaded = await ev("localStorage.getItem('serumsquest:voxel:settings:v1')");
    out.settingsPersist = !!settingsReloaded && settingsReloaded === settingsAfter;
    out.titleScreenAfterReload = await waitFor("!!document.querySelector('.titleScreen')", 5000);
    out.errors = errors;
    out.network = Array.from(new Set(requests)).filter((u) => /^https?:/i.test(u));

    const legacy = pathToFileURL('C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest-legacy\\index.html').href;
    await send('Page.navigate', { url: legacy });
    await sleep(3500);
    out.legacyUrl = await ev('location.href');
    out.legacyTitle = await ev('document.title');
    out.legacyBrand = await ev("(document.querySelector('.q-brand-name') || {}).textContent || ''");
    out.legacyBodyHasSerums = (await ev('document.body.innerText')).includes('SERUMS');
    out.legacyMain = await ev("!!document.querySelector('#main')");
    out.legacyErrors = errors;
  } catch (e) {
    out.failure = e.stack || String(e);
  } finally {
    ws.close();
    try { child.kill(); } catch {}
  }
  const target = path.join(ROOT, '.work', 'migration-verify-redirect.json');
  fs.writeFileSync(target, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error('REDIRECT_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
