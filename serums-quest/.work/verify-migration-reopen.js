'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest';
const HUB = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\index.html';
const EXPORTED = path.join(ROOT, 'export', 'serums-quest.html');
const FIXTURE = path.join(ROOT, '.work', 'offline-fixture.json');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(port, profileDir, url) {
  const child = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, '--window-size=960,540', url], { stdio: 'ignore' });
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
  const ev = async (expression, awaitPromise = false) => {
    const x = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (x.exceptionDetails) throw new Error(x.exceptionDetails.text + ' ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || ''));
    return x.result ? x.result.value : undefined;
  };
  const click = async (sel) => { const ok = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`); if (!ok) throw new Error('Missing ' + sel); await sleep(260); };
  const waitFor = async (expr, ms = 7000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await ev(expr)) return true; await sleep(150); } return false; };
  const skipTutorial = async () => { if (await ev("!!document.querySelector('.tutorialShell')")) { await ev("(() => { const b=document.querySelector('[data-action=\"tutorial-skip\"]'); if(b) b.click(); })()"); await sleep(400); } };
  return { ws, send, ev, click, waitFor, skipTutorial, errors, requests };
}

function stateExpr() {
  return "(() => { const raw = localStorage.getItem('serumsquest:voxel:state:v1'); return raw ? JSON.parse(raw) : null; })()";
}

async function closeGracefully(browser, c) {
  try { await c.send('Browser.close'); } catch {}
  await new Promise((resolve) => {
    if (browser.child.exitCode !== null) return resolve();
    browser.child.once('exit', resolve);
    setTimeout(resolve, 8000);
  });
  await new Promise((r) => setTimeout(r, 1500));
}

(async () => {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const profile = path.join(os.tmpdir(), 'serums-mig-reopen');
  fs.rmSync(profile, { recursive: true, force: true });
  const out = { scenario: 'reopen-and-hub', exported: EXPORTED };
  let browser = null;
  try {
    // 1) First run: seed the old local save and import it with "Usar partida local".
    browser = await launch(9350, profile, pathToFileURL(EXPORTED).href);
    let c = await connect(browser.page);
    await sleep(2200);
    await c.skipTutorial();
    await c.ev('localStorage.clear()');
    await c.ev(`localStorage.setItem('serumsquest:state:v1', ${JSON.stringify(JSON.stringify(fixture.state))})`);
    await c.send('Page.reload', { ignoreCache: true });
    await sleep(2200);
    await c.skipTutorial();
    await c.click('[data-action="open-import"]');
    out.localNotice = await c.waitFor("!!document.querySelector('[data-action=\"legacy-local\"]')");
    await c.click('[data-action="legacy-local"]');
    out.preview = await c.waitFor("document.body.innerText.includes('Offline QA')");
    await c.click('[data-action="import-confirm"]');
    await sleep(2000);
    const first = await c.ev(stateExpr());
    out.firstRunState = first ? { name: first.profile.name, coins: first.coins, xp: first.xp, importedFrom: first.importedFrom } : null;
    out.firstRunErrors = c.errors;
    await closeGracefully(browser, c);
    c.ws.close();
    browser = null;

    // 2) Second run: same browser profile, closed and reopened.
    browser = await launch(9351, profile, pathToFileURL(EXPORTED).href);
    c = await connect(browser.page);
    await sleep(2500);
    await c.skipTutorial();
    const second = await c.ev(stateExpr());
    out.reopenedState = second ? { name: second.profile.name, coins: second.coins, xp: second.xp, importedFrom: second.importedFrom } : null;
    out.reopenedTitle = await c.ev('document.title');
    out.reopenedTitleScreen = await c.waitFor("!!document.querySelector('.titleScreen')");
    out.continueVisible = await c.ev("document.body.innerText.includes('Continuar en el observatorio')");
    out.oldKeyKept = await c.ev("!!localStorage.getItem('serumsquest:state:v1')");
    out.reopenErrors = c.errors;
    c.ws.close();
    browser.child.kill();
    await sleep(1500);

    // 3) HUB -> quest card -> redirected game.
    browser = await launch(9352, path.join(os.tmpdir(), 'serums-mig-hub'), pathToFileURL(HUB).href);
    c = await connect(browser.page);
    await sleep(3500);
    out.hubTitle = await c.ev('document.title');
    out.hubQuestHref = await c.ev("(document.querySelector('a[data-app=\"quest\"]') || {}).href || ''");
    const href = out.hubQuestHref;
    if (href) {
      await c.send('Page.navigate', { url: href });
      await sleep(3000);
      await c.skipTutorial();
      out.hubLandedUrl = await c.ev('location.href');
      out.hubLandedTitle = await c.ev('document.title');
      out.hubLandedGame = await c.waitFor("!!document.querySelector('.titleScreen')", 5000);
    }
    out.hubErrors = c.errors;
    out.hubNetwork = Array.from(new Set(c.requests)).filter((u) => /^https?:/i.test(u)).slice(0, 20);
    c.ws.close();
    browser.child.kill();
  } catch (e) {
    out.failure = e.stack || String(e);
    if (browser) { try { browser.child.kill(); } catch {} }
  }
  fs.writeFileSync(path.join(ROOT, '.work', 'migration-verify-reopen.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error('REOPEN_VERIFY_ERROR', e.stack || e); process.exitCode = 1; });
