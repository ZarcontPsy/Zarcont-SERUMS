'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest';
const EXPORTED = path.join(ROOT, 'export', 'serums-quest.html');
const FIXTURE = path.join(ROOT, '.work', 'offline-fixture.json');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port, profile, url) {
  const dir = path.join(os.tmpdir(), profile);
  fs.rmSync(dir, { recursive: true, force: true });
  const child = spawn(CHROME, [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    '--window-size=960,540', url,
  ], { stdio: 'ignore' });
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
  let id = 0;
  const pending = new Map();
  const errors = [];
  const requests = [];
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
    }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result ? x.result.value : undefined;
  };
  const click = async (sel) => {
    const ok = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
    if (!ok) throw new Error('Missing ' + sel);
    await sleep(240);
  };
  const waitFor = async (expr, ms = 6000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await ev(expr)) return true;
      await sleep(150);
    }
    return false;
  };
  const skipTutorial = async () => {
    if (await ev("!!document.querySelector('.tutorialShell')")) {
      if (await ev("!!document.querySelector('[data-action=\"tutorial-skip\"]')")) await click('[data-action="tutorial-skip"]');
      await sleep(250);
    }
  };
  return { ws, send, ev, click, waitFor, skipTutorial, errors, requests };
}

function stateFrom(page) {
  return `(() => { const raw = localStorage.getItem('serumsquest:voxel:state:v1'); return raw ? JSON.parse(raw) : null; })()`;
}

async function runJsonImport(fixture) {
  const port = 9346;
  const { child, page } = await launch(port, 'serums-mig-json', pathToFileURL(EXPORTED).href);
  const { ws, send, ev, click, waitFor, skipTutorial, errors, requests } = await connect(page);
  const out = { scenario: 'import-json', exported: EXPORTED };
  try {
    await sleep(1800);
    out.title = await ev('document.title');
    out.titleScreen = await ev("!!document.querySelector('.titleScreen')");
    await skipTutorial();
    await ev('localStorage.clear()');
    await send('Page.reload', { ignoreCache: true });
    await sleep(1800);
    await skipTutorial();
    out.network = [];
    await click('[data-action="open-import"]');
    await ev(`document.querySelector('#legacyText').value = ${JSON.stringify(JSON.stringify(fixture))}`);
    await click('[data-action="legacy-analyze"]');
    out.preview = await waitFor("document.body.innerText.includes('Offline QA')");
    out.previewText = (await ev('document.body.innerText')).slice(0, 120);
    await click('[data-action="import-confirm"]');
    await sleep(900);
    let s = await ev(stateFrom(page));
    out.imported = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom, schema: s.schema } : null;
    out.preimportBackup = await ev("!!localStorage.getItem('serumsquest:voxel:preimport:v1')");
    await send('Page.reload', { ignoreCache: true });
    await sleep(2000);
    await skipTutorial();
    s = await ev(stateFrom(page));
    out.afterReload = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom } : null;
    out.continueVisible = await ev("document.body.innerText.includes('Continuar en el observatorio')");
    out.errors = errors;
    out.network = Array.from(new Set(requests)).filter((u) => /^https?:/i.test(u));
  } catch (e) {
    out.failure = e.stack || String(e);
  } finally {
    ws.close();
    try { child.kill(); } catch {}
  }
  return out;
}

async function runLocalImport(fixture) {
  const port = 9347;
  const { child, page } = await launch(port, 'serums-mig-local', pathToFileURL(EXPORTED).href);
  const { ws, send, ev, click, waitFor, skipTutorial, errors, requests } = await connect(page);
  const out = { scenario: 'import-local', exported: EXPORTED };
  try {
    await sleep(1800);
    await skipTutorial();
    await ev('localStorage.clear()');
    // Simula la partida guardada por la versión 1.2 en este mismo navegador.
    await ev(`localStorage.setItem('serumsquest:state:v1', ${JSON.stringify(JSON.stringify(fixture.state))})`);
    await send('Page.reload', { ignoreCache: true });
    await sleep(1800);
    await skipTutorial();
    await click('[data-action="open-import"]');
    out.noticeFound = await waitFor("!!document.querySelector('[data-action=\"legacy-local\"]')");
    out.noticeText = await ev("(document.querySelector('[data-action=\"legacy-local\"]') || {}).parentElement ? document.querySelector('[data-action=\"legacy-local\"]').parentElement.innerText : ''");
    await click('[data-action="legacy-local"]');
    out.preview = await waitFor("document.body.innerText.includes('Offline QA')");
    await click('[data-action="import-confirm"]');
    await sleep(900);
    const s = await ev(stateFrom(page));
    out.imported = s ? { name: s.profile && s.profile.name, coins: s.coins, xp: s.xp, importedFrom: s.importedFrom, schema: s.schema } : null;
    await send('Page.reload', { ignoreCache: true });
    await sleep(2000);
    await skipTutorial();
    const s2 = await ev(stateFrom(page));
    out.afterReload = s2 ? { name: s2.profile && s2.profile.name, coins: s2.coins, xp: s2.xp, importedFrom: s2.importedFrom } : null;
    out.oldKeyStillThere = await ev("!!localStorage.getItem('serumsquest:state:v1')");
    out.errors = errors;
    out.network = Array.from(new Set(requests)).filter((u) => /^https?:/i.test(u));
  } catch (e) {
    out.failure = e.stack || String(e);
  } finally {
    ws.close();
    try { child.kill(); } catch {}
  }
  return out;
}

async function runRedirects() {
  const port = 9348;
  const rootIndex = pathToFileURL(path.join(ROOT, 'index.html')).href;
  const legacy = pathToFileURL('C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest-legacy\\index.html').href;
  const { child, page } = await launch(port, 'serums-mig-redirect', rootIndex);
  const { ws, send, ev, errors } = await connect(page);
  const out = { scenario: 'redirect-and-legacy' };
  try {
    await sleep(2500);
    out.redirectUrl = await ev('location.href');
    out.redirectTitle = await ev('document.title');
    out.redirectLandedOnBuild = /dist\/index\.html$/.test(await ev('location.pathname'));
    out.redirectGameLoaded = await ev("!!document.querySelector('.titleScreen')");
    await send('Page.navigate', { url: legacy });
    await sleep(2600);
    out.legacyUrl = await ev('location.href');
    out.legacyTitle = await ev('document.title');
    out.legacyRendered = await ev("!!document.querySelector('.q-appbar, .q-brand, #main')");
    out.legacyBodyHasQuest = (await ev('document.body.innerText')).includes('SERUMS');
    out.errors = errors;
  } catch (e) {
    out.failure = e.stack || String(e);
  } finally {
    ws.close();
    try { child.kill(); } catch {}
  }
  return out;
}

(async () => {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const json = await runJsonImport(fixture);
  const local = await runLocalImport(fixture);
  const redirects = await runRedirects();
  const report = { at: new Date().toISOString(), json, local, redirects };
  const target = path.join(ROOT, '.work', 'migration-verify.json');
  fs.writeFileSync(target, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => { console.error('MIGRATION_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
