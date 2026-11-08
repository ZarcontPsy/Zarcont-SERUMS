'use strict';
/* =========================================================================
   SERUMS QUEST Ã‚Â· V2.1 Ã‚Â· Agente 7 Ã‚Â· ArnÃƒÂ©s de QA (base V2.0 / final V2.1)
   ArnÃƒÂ©s autÃƒÂ³nomo por CDP. No modifica el juego: siembra localStorage,
   conduce la UI/API, mide, captura y escribe evidencia.

   Uso:
     node .work/v2/qa/agent7-v21-qa.js --mode=base
     node .work/v2/qa/agent7-v21-qa.js --mode=final
     node .work/v2/qa/agent7-v21-qa.js --mode=base --report-only

   Salidas:
     .work/v2/evidence/agent7-v21-qa.json (+ -base/-final)
     .work/v2/evidence/agent7-v21-report.md (+ -base/-final)
     .work/v2/evidence/agent7-v21-{base|final}-*.png
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const QA_DIR = __dirname;
const V2_DIR = path.resolve(__dirname, '..');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EVIDENCE = path.join(V2_DIR, 'evidence');
const MODE = 'final';
const PORT = 9402;
const PROFILE = path.join(QA_DIR, 'profile-v22');
const DOWNLOADS = path.join(QA_DIR, 'downloads-v22');
const SHOT_PREFIX = 'v22';
const DIST = path.join(ROOT, 'dist', 'index.html');
const EXPORT = path.join(ROOT, 'export', 'serums-quest.html');
const HUB_INDEX = path.join(ROOT, 'index.html');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SAVE_KEY = 'serumsquest:voxel:state:v1';
const SETTINGS_KEY = 'serumsquest:voxel:settings:v1';
const AUX_KEYS = [
  'serumsquest:voxel:preimport:v1', 'serumsquest:voxel:backup:v1',
  'serumsquest:voxel:corrupt:v1', 'serumsquest:snapshot:v1',
  'serumsquest:state:v1', 'serumsquest:backup:v1', 'serumsquest:journal:v1'
];
const WIDTH = 1280;
const HEIGHT = 720;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


const deepClone = (v) => JSON.parse(JSON.stringify(v));
function withSettings(save, extra) {
  const out = deepClone(save);
  out.settings = Object.assign({
    sound: false, ambient: false, muted: false, volume: 0.7, reducedMotion: false,
    extraTime: false, effectsQuality: 'alto', qualityChosen: true, hide3dFrames: false,
    textScale: 'normal', highContrast: false, tutorialSeen: true, backupReminder: false,
    sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 },
    feedbackMode: 'end', onlyOriginalBank: false
  }, out.settings || {}, extra || {});
  return out;
}
const results = {
  cases: [], issues: [], fps: {}, shots: []
};
let s = null;

function distInfo(file) {
  const target = file || DIST;
  const buf = fs.readFileSync(target);
  return {
    path: target, bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    mtime: fs.statSync(target).mtime.toISOString()
  };
}
function pngSize(file) {
  try { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }
  catch (e) { return { w: null, h: null, error: String(e) }; }
}
function slug(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
}
function record(id, area, title, status, detail, extra) {
  const item = Object.assign({ id, area, title, status, detail: detail || '', evidence: [] }, extra || {});
  results.cases.push(item);
  console.log('[' + status + '] ' + id + ' Ã‚Â· ' + title + (detail ? ' :: ' + String(detail).slice(0, 400) : ''));
  return item;
}
function issue(severity, kind, title, detail) {
  results.issues.push({ severity, kind, title, detail: detail || '', at: new Date().toISOString() });
  console.log('[ISSUE:' + severity + '] ' + title + ' :: ' + String(detail || '').slice(0, 400));
}
function isBase() { return MODE === 'base'; }
function v21Status(ok, detail, blocked) {
  if (ok) return 'PASS';
  if (isBase()) return blocked ? 'BLOCKED' : 'NOTE';
  return 'FAIL';
}

/* ------------------------------------------------------------- CDP launch */
async function waitForTarget() {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      const page = list.find((x) => x.type === 'page' && /^file:/.test(x.url)) || list.find((x) => x.type === 'page');
      if (page) return page;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('Chrome no abriÃƒÂ³ la pestaÃƒÂ±a de prueba');
}
async function launch(bundle) {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.rmSync(DOWNLOADS, { recursive: true, force: true });
  fs.mkdirSync(DOWNLOADS, { recursive: true });
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const proc = spawn(CHROME, [
    '--headless=new', '--enable-unsafe-swiftshader',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--mute-audio',
    '--force-device-scale-factor=1', '--window-size=' + WIDTH + ',' + HEIGHT,
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE,
    pathToFileURL(bundle || DIST).href
  ], { stdio: 'ignore', windowsHide: true });
  const page = await waitForTarget();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = []; const warnings = []; const requests = []; const failedLoads = [];
  ws.onmessage = (event) => {
    let m;
    try { m = JSON.parse(event.data); } catch (e) { return; }
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
      return;
    }
    const p = m.params || {};
    if (m.method === 'Runtime.exceptionThrown') {
      const d = p.exceptionDetails || {};
      errors.push({ kind: 'exception', at: new Date().toISOString(), text: String(d.text || ''),
        description: String((d.exception && d.exception.description) || ''), url: String(d.url || ''), line: d.lineNumber });
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const text = (p.args || []).map((a) => a.value != null ? a.value : (a.description || a.type)).join(' ');
      if (p.type === 'error') errors.push({ kind: 'console', at: new Date().toISOString(), text });
      else if (p.type === 'warning') warnings.push({ kind: 'console', at: new Date().toISOString(), text });
    } else if (m.method === 'Log.entryAdded') {
      const e = p.entry || {};
      if (e.level === 'error') errors.push({ kind: 'log', at: new Date().toISOString(), text: String(e.text || ''), url: String(e.url || '') });
      else if (e.level === 'warning') warnings.push({ kind: 'log', at: new Date().toISOString(), text: String(e.text || ''), url: String(e.url || '') });
    } else if (m.method === 'Network.requestWillBeSent') {
      requests.push({ url: p.request.url, type: p.type, method: p.request.method, at: Date.now() });
    } else if (m.method === 'Network.loadingFailed') {
      failedLoads.push({ url: p.url || '', errorText: p.errorText || '', type: p.type || '', canceled: !!p.canceled });
    }
  };
  const send = (method, params, timeout) => new Promise((resolve, reject) => {
    const mid = ++id;
    const timer = setTimeout(() => { pending.delete(mid); reject(new Error('CDP timeout: ' + method)); }, timeout || 20000);
    pending.set(mid, { resolve, reject, timer });
    ws.send(JSON.stringify({ id: mid, method: method, params: params || {} }));
  });
  async function ev(expression, awaitPromise) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: !!awaitPromise, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('eval: ' + String(d.text || '') + ' ' + String((d.exception && d.exception.description) || ''));
    }
    return r.result ? r.result.value : undefined;
  }
  async function waitFor(expression, timeout, interval) {
    const end = Date.now() + (timeout || 7000);
    while (Date.now() < end) {
      try { if (await ev('!!(' + expression + ')')) return true; } catch (e) {}
      await sleep(interval || 120);
    }
    return false;
  }
  async function click(selector, delay) {
    const ok = await ev('(() => { const el = document.querySelector(' + JSON.stringify(selector) + '); if (!el) return false; el.click(); return true; })()');
    if (!ok) throw new Error('No existe ' + selector);
    await sleep(delay == null ? 260 : delay);
    return true;
  }
  async function clickIf(selector, delay) { try { return await click(selector, delay); } catch (e) { return false; } }
  async function has(selector) { return !!(await ev('!!document.querySelector(' + JSON.stringify(selector) + ')')); }
  async function setValue(selector, value) {
    const ok = await ev(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!ok) throw new Error('No existe para escribir ' + selector);
    await sleep(220);
  }
  const KEY = {
    Enter: ['Enter', 'Enter', 13], Escape: ['Escape', 'Escape', 27], Space: ['Space', ' ', 32],
    ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37], ArrowUp: ['ArrowUp', 'ArrowUp', 38],
    ArrowRight: ['ArrowRight', 'ArrowRight', 39], ArrowDown: ['ArrowDown', 'ArrowDown', 40],
    KeyJ: ['KeyJ', 'j', 74], KeyM: ['KeyM', 'm', 77], KeyR: ['KeyR', 'r', 82],
    KeyH: ['KeyH', 'h', 72], KeyG: ['KeyG', 'g', 71], KeyI: ['KeyI', 'i', 73]
  };
  async function press(code) {
    const k = KEY[code] || [code, code, 0];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', code: k[0], key: k[1], windowsVirtualKeyCode: k[2], nativeVirtualKeyCode: k[2] });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code: k[0], key: k[1], windowsVirtualKeyCode: k[2], nativeVirtualKeyCode: k[2] });
    await sleep(300);
  }
  async function shot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = path.join(EVIDENCE, 'agent7-v21-' + SHOT_PREFIX + '-' + slug(name) + '.png');
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
    results.shots.push(file);
    return file;
  }
  async function shotClip(name, rect, scale) {
    let clip = rect;
    try {
      if (!clip) {
        clip = await ev(`(() => { const el=document.querySelector('.v2-hero-canvas') || document.querySelector('.v2-carousel-card.is-center [data-v2-stage]'); if(!el) return null; const r=el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; })()`);
      }
      if (!clip || !clip.width) return null;
      const res = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false,
        clip: { x: Math.max(0, clip.x), y: Math.max(0, clip.y), width: Math.max(1, clip.width), height: Math.max(1, clip.height), scale: scale || 2 } });
      const file = path.join(EVIDENCE, 'agent7-v21-' + SHOT_PREFIX + '-' + slug(name) + '.png');
      fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
      results.shots.push(file);
      return file;
    } catch (e) { return null; }
  }
  function rel(file) { return path.basename(file); }
  async function state() { return ev('window.__gameState ? window.__gameState() : null'); }
  async function readSave() { return ev(`(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null'); } catch (e) { return null; } })()`); }
  async function readSettingsKey() { return ev(`(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)}) || 'null'); } catch (e) { return null; } })()`); }
  async function dismissBanners() {
    try {
      const visible = await ev("(() => { const b=document.querySelector('#backupBanner'); return !!(b && !b.classList.contains('hidden')); })()");
      if (visible) await clickIf('#backupBanner [data-action="backup-later"]', 150);
    } catch (e) {}
  }
  async function skipTutorial() {
    const screen = await ev("window.__gameState ? window.__gameState().screen : ''");
    if (screen === 'tutorial') {
      await clickIf('#screen [data-action="tutorial-skip"]', 300);
      await waitFor("window.__gameState().screen === 'title'", 4000);
    }
  }
  async function reload(options) {
    const opts = options || {};
    await send('Page.reload', { ignoreCache: true });
    await sleep(350);
    const booted = await waitFor("document.readyState === 'complete' && window.__gameState && window.__gameState().screen", 26000);
    if (!booted) throw new Error('La recarga no completÃƒÂ³ el arranque');
    await sleep(700);
    if (opts.skipTutorial !== false) await skipTutorial();
    if (opts.dismissBanners !== false) await dismissBanners();
  }
  async function seed(save, options) {
    const opts = options || {};
    const settings = save && save.settings ? save.settings : null;
    await ev(`(() => {
      ${JSON.stringify([SAVE_KEY, SETTINGS_KEY].concat(AUX_KEYS))}.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(JSON.stringify(save))});
      ${settings ? `localStorage.setItem(${JSON.stringify(SETTINGS_KEY)}, ${JSON.stringify(JSON.stringify(settings))});` : ''}
      return true;
    })()`);
    await reload(opts);
  }
  async function enterHubFromTitle() {
    if (await has('#screen [data-action="menu-continue"]')) await click('#screen [data-action="menu-continue"]', 1000);
    else await press('Enter');
    await waitFor("window.__gameState().screen === 'hub'", 7000);
    await sleep(900);
    await dismissBanners();
  }
  async function setViewport(w, h) {
    try { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }); } catch (e) {}
    await sleep(600);
  }
  async function collectFps(label, seconds) {
    const values = []; const samples = []; const started = Date.now();
    let last = null;
    while (Date.now() - started < seconds * 1000) {
      try {
        const st = await state();
        if (st) {
          last = st;
          if (Number.isFinite(st.fps)) { values.push(st.fps); samples.push({ t: Date.now() - started, fps: st.fps, screen: st.screen }); }
        }
      } catch (e) {}
      await sleep(120);
    }
    const out = { label, seconds, screen: last && last.screen, samples };
    if (values.length) {
      out.min = Math.min.apply(null, values); out.max = Math.max.apply(null, values);
      out.avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
      out.below45 = values.filter((v) => v < 45).length;
      out.values = values;
    }
    return out;
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');
  try { await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS }); } catch (e) {}
  try { await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false }); } catch (e) {}
  await sleep(600);
  return { proc, ws, send, ev, waitFor, click, clickIf, has, setValue, press, shot, shotClip, rel, state, readSave, readSettingsKey,
    reload, seed, enterHubFromTitle, setViewport, collectFps, dismissBanners, skipTutorial,
    errors, warnings, requests, failedLoads };
}


(async () => {
  const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
  save.coins = 5000; save.settings.tutorialSeen = true; save.settings.backupReminder = false;
  s = await launch(DIST);
  await s.seed(save, { skipTutorial: true });
  await s.setViewport(1280, 720);
  await s.ev('window.__v22.openShop()');
  await s.waitFor("!!document.querySelector('.shopShell')", 5000);
  await sleep(1500);
  const info = await s.ev(`(() => {
    const card=document.querySelector('#shopGrid .cosmeticCard'); const thumb=card?card.querySelector('.cosmeticCardThumb'):null; const img=thumb?thumb.querySelector('img'):null;
    const g=document.querySelector('#shopGrid');
    const cstyle=card?getComputedStyle(card):null; const tstyle=thumb?getComputedStyle(thumb):null;
    return { html: card?card.outerHTML.slice(0,600):null,
      card:{w:card?card.getBoundingClientRect().width:0,h:card?card.getBoundingClientRect().height:0,display:cstyle?cstyle.display:null,padding:cstyle?cstyle.padding:null,border:cstyle?cstyle.border:null,height:cstyle?cstyle.height:null,minHeight:cstyle?cstyle.minHeight:null,maxHeight:cstyle?cstyle.maxHeight:null,flex:cstyle?cstyle.flex:null,alignSelf:cstyle?cstyle.alignSelf:null,position:cstyle?cstyle.position:null,boxSizing:cstyle?cstyle.boxSizing:null},
      thumb:{w:thumb?thumb.getBoundingClientRect().width:0,h:thumb?thumb.getBoundingClientRect().height:0,display:tstyle?tstyle.display:null,aspect:tstyle?tstyle.aspectRatio:null,minH:tstyle?tstyle.minHeight:null},
      img:{w:img?img.getBoundingClientRect().width:0,h:img?img.getBoundingClientRect().height:0,natural:img?img.naturalWidth:0,src:img?img.src.slice(0,40):null},
      grid:{display:getComputedStyle(g).display, cols:getComputedStyle(g).gridTemplateColumns, autoRows:getComputedStyle(g).gridAutoRows} };
  })()`);
  console.log(JSON.stringify(info, null, 2));
  try { s.ws.close(); s.proc.kill(); } catch (e) {}
  process.exit(0);
})().catch(e=>{ console.error(e && e.stack || e); try { if(s){s.ws.close();s.proc.kill();} } catch(x){} process.exit(1); });

