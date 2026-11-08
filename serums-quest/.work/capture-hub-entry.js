'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = 'C:\\Users\\USARIO\\Documents\\ZARCONT SERUMS';
const OUT = path.join(ROOT, 'serums-quest', '.work');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const port = 9381;
  const dir = path.join(os.tmpdir(), 'hub-shots');
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
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }); if (x.exceptionDetails) throw new Error(x.exceptionDetails.text); return x.result ? x.result.value : undefined; };
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64')); };
  try {
    await sleep(3000);
    await ev("localStorage.removeItem('serumshub:active:v1')");
    await ev("(() => { document.querySelector('[data-app=\\\"quest\\\"]').click(); return true; })()");
    await sleep(700);
    await shot('hub-entry-selected.png');
    await ev("(() => { document.querySelector('[data-app=\\\"quest\\\"]').click(); return true; })()");
    for (let i = 0; i < 60; i++) { if (await ev("location.pathname.endsWith('/serums-quest/dist/index.html')").catch(() => false)) break; await sleep(200); }
    await sleep(1500);
    if (await ev("!!document.querySelector('.tutorialShell')").catch(() => false)) {
      await ev("(() => { const b=document.querySelector('[data-action=\\\"tutorial-skip\\\"]'); if(b) b.click(); return true; })()");
      await sleep(900);
    }
    for (let i = 0; i < 40; i++) { if (await ev("!!document.querySelector('.titleScreen')").catch(() => false)) break; await sleep(200); }
    await sleep(600);
    await shot('hub-entry-menu.png');
    // Acercamiento del HUD superior del menú para el informe.
    console.log(JSON.stringify({ title: await ev('document.title'), url: await ev('location.href'), menu: await ev("!!document.querySelector('.titleScreen')") }));
  } finally { ws.close(); try { child.kill(); } catch {} }
})().catch((e) => { console.error(e.stack || e); process.exitCode = 1; });
