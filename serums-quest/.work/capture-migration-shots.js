'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS\\serums-quest';
const DIST = path.join(ROOT, 'dist', 'index.html');
const FIXTURE = path.join(ROOT, '.work', 'offline-fixture.json');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const profile = path.join(os.tmpdir(), 'serums-mig-shots');
  fs.rmSync(profile, { recursive: true, force: true });
  const child = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9353', `--user-data-dir=${profile}`, '--window-size=1280,800', pathToFileURL(DIST).href], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:9353/json/list')).json();
      page = list.find((x) => x.type === 'page');
      if (page) break;
    } catch {}
    await sleep(250);
  }
  if (!page) throw new Error('no page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map();
  ws.onmessage = (event) => { const m = JSON.parse(event.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); return x.result ? x.result.value : undefined; };
  const click = async (sel) => { await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(e) e.click(); })()`); await sleep(300); };
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(ROOT, '.work', name), Buffer.from(r.data, 'base64')); };
  await send('Page.enable'); await send('Runtime.enable');
  await sleep(2600);
  if (await ev("!!document.querySelector('.tutorialShell')")) { await click('[data-action="tutorial-skip"]'); await sleep(600); }
  await shot('migration-title.png');
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  await ev(`localStorage.setItem('serumsquest:state:v1', ${JSON.stringify(JSON.stringify(fixture.state))})`);
  await send('Page.reload', { ignoreCache: true });
  await sleep(2500);
  if (await ev("!!document.querySelector('.tutorialShell')")) { await click('[data-action="tutorial-skip"]'); await sleep(500); }
  await click('[data-action="open-import"]');
  await sleep(700);
  await shot('migration-import-local.png');
  console.log(JSON.stringify({
    title: await ev('document.title'),
    titleScreen: await ev("!!document.querySelector('.titleScreen')"),
    localButton: await ev("!!document.querySelector('[data-action=\"legacy-local\"]')"),
    files: ['migration-title.png', 'migration-import-local.png']
  }, null, 2));
  await send('Browser.close');
  ws.close();
  try { child.kill(); } catch {}
})().catch((e) => { console.error(e.stack || e); process.exitCode = 1; });
