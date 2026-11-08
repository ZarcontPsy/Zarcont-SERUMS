'use strict';
/* =========================================================================
   SERUMS QUEST Â· V2.1 Â· Agente 7 Â· ArnÃ©s de QA (base V2.0 / final V2.1)
   ArnÃ©s autÃ³nomo por CDP. No modifica el juego: siembra localStorage,
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
  console.log('[' + status + '] ' + id + ' Â· ' + title + (detail ? ' :: ' + String(detail).slice(0, 400) : ''));
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
  throw new Error('Chrome no abriÃ³ la pestaÃ±a de prueba');
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
    if (!booted) throw new Error('La recarga no completÃ³ el arranque');
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

/* -------------------------------------------------------------------------
   Flujo V2.2
   ------------------------------------------------------------------------- */
function record(id, title, status, detail) {
  results.cases.push({ id, title, status, detail: detail || '' });
  console.log('[' + status + '] ' + id + ' · ' + title + (detail ? ' :: ' + String(detail).slice(0, 300) : ''));
}
function diff(a, b) { return Math.round((b - a) * 10) / 10; }
(async () => {
  const savePath = path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json');
  const baseSave = JSON.parse(fs.readFileSync(savePath, 'utf8'));
  baseSave.coins = 5000;
  baseSave.settings = Object.assign({}, baseSave.settings || {}, { tutorialSeen: true, backupReminder: false, feedbackMode: 'end' });

  s = await launch(DIST);
  await s.seed(baseSave, { skipTutorial: true });
  await s.setViewport(1280, 720);

  /* ---------- Tienda ---------- */
  await s.ev('window.__v22.openShop()');
  await s.waitFor("!!document.querySelector('.shopShell')", 5000);
  await sleep(1200);
  let shop = await s.ev(`(() => {
    const cards=[...document.querySelectorAll('#shopGrid .cosmeticCard')];
    return { cards: cards.length, thumbs: document.querySelectorAll('#shopGrid .cosmeticCardThumb img').length,
      canvas: !!document.querySelector('#shopPreviewMount canvas'), detail: (document.querySelector('#shopDetailBody h3')||{}).textContent || '',
      ids: cards.slice(0,3).map(c=>c.getAttribute('data-id')) };
  })()`);
  record('T01', 'Tienda: cuadrícula de 33 originales, miniaturas y visor 3D', shop.cards === 33 && shop.thumbs > 0 && shop.canvas ? 'PASS' : 'FAIL', JSON.stringify(shop));
  if (shop.cards !== 33) issue('La tienda no muestra 33 tarjetas', JSON.stringify(shop));

  const firstId = shop.ids[1] || shop.ids[0];
  const markerBefore = await s.ev("(()=>{const el=document.querySelector('.shopShell'); el.setAttribute('data-qa-marker','1'); const g=document.querySelector('#shopGrid'); g.scrollTop=90; return {render:window.__v22.renderCount, scroll:g.scrollTop};})()");
  await s.ev(`(()=>{const c=document.querySelector('#shopGrid .cosmeticCard[data-id="${firstId}"]'); if(c)c.click();})()`);
  await sleep(500);
  const shopAfter = await s.ev(`(() => {
    const el=document.querySelector('.shopShell'); const g=document.querySelector('#shopGrid');
    const card=document.querySelector('#shopGrid .cosmeticCard[data-id="${firstId}"]');
    return { marker: el && el.getAttribute('data-qa-marker'), render: window.__v22.renderCount, scroll: g ? g.scrollTop : null,
      selected: card ? card.classList.contains('is-selected') : false, detail: (document.querySelector('#shopDetailBody h3')||{}).textContent || '',
      canvas: !!document.querySelector('#shopPreviewMount canvas') };
  })()`);
  record('T02', 'Tienda: selección incremental sin rehacer pantalla ni perder scroll', shopAfter.marker === '1' && shopAfter.render === markerBefore.render && shopAfter.selected && shopAfter.canvas ? 'PASS' : 'FAIL', JSON.stringify({ before: markerBefore, after: shopAfter }));
  if (shopAfter.render !== markerBefore.render) issue('La selección de tienda rehizo la pantalla', JSON.stringify({ before: markerBefore, after: shopAfter }));
  await s.ev("(()=>{const g=document.querySelector('#shopGrid'); if(g) g.scrollTop=0; return true;})()");
  await sleep(200);
  await s.shot('tienda-1280x720');

  /* ---------- Inventario ---------- */
  await s.ev('window.__v22.openWardrobe()');
  await s.waitFor("!!document.querySelector('.wardrobeShell')", 5000);
  await sleep(900);
  const wardrobe = await s.ev(`(() => {
    const cards=[...document.querySelectorAll('#wardrobeItemsGrid .cosmeticCard')];
    const canvas=document.querySelector('#wardrobePreviewMount canvas');
    return { cards: cards.length, thumbs: document.querySelectorAll('#wardrobeItemsGrid .cosmeticCardThumb img').length,
      canvas: !!canvas, canvasW: canvas?Math.round(canvas.getBoundingClientRect().width):0, canvasH: canvas?Math.round(canvas.getBoundingClientRect().height):0,
      title: (document.querySelector('#wardrobeDetail h3')||{}).textContent || '' };
  })()`);
  record('T03', 'Inventario: tarjetas, miniaturas y visor 3D', wardrobe.cards > 0 && wardrobe.thumbs > 0 && wardrobe.canvas && wardrobe.canvasW > 50 ? 'PASS' : 'FAIL', JSON.stringify(wardrobe));
  if (wardrobe.cards) {
    const id = await s.ev("document.querySelector('#wardrobeItemsGrid .cosmeticCard').getAttribute('data-id')");
    const before = await s.ev("(()=>{const el=document.querySelector('.wardrobeShell'); el.setAttribute('data-qa-marker','1'); return window.__v22.renderCount;})()");
    await s.ev(`(()=>{const c=document.querySelector('#wardrobeItemsGrid .cosmeticCard[data-id="${id}"]'); if(c)c.click();})()`);
    await sleep(500);
    const after = await s.ev(`(() => { const el=document.querySelector('.wardrobeShell'); return { marker: el && el.getAttribute('data-qa-marker'), render: window.__v22.renderCount, canvas: !!document.querySelector('#wardrobePreviewMount canvas'), detail: (document.querySelector('#wardrobeDetail h3')||{}).textContent||'' }; })()`);
    record('T04', 'Inventario: probar pieza sin rehacer pantalla y con visor vivo', after.marker === '1' && after.render === before && after.canvas ? 'PASS' : 'FAIL', JSON.stringify({ before, after }));
  }
  await s.shot('inventario-1280x720');

  /* ---------- Versión visible y menús ---------- */
  await s.ev("window.__v22.setScreen('settings')");
  await sleep(700);
  const version = await s.ev("(() => ({ body: document.body.innerText.indexOf('V2.2') !== -1, title: document.title, gameVersion: window.GAME && window.GAME.rules ? window.GAME.rules.version : null }))()");
  record('T13', 'Versión V2.2 visible en la interfaz', version.body ? 'PASS' : 'FAIL', JSON.stringify(version));
  const menuScreens = ['title', 'pause', 'settings', 'journal', 'help', 'map'];
  const menuSizes = [[480,320],[844,390],[1308,662],[390,844],[1920,1080]];
  const menuRows = [];
  for (const [w,h] of menuSizes) {
    await s.setViewport(w,h);
    for (const name of menuScreens) {
      await s.ev(`window.__v22.setScreen(${JSON.stringify(name)})`);
      await sleep(name === 'map' ? 700 : 380);
      const m = await s.ev(`(() => { const s=document.querySelector('#screen'); const o=document.querySelector('.overlayShell'); const r=s?s.getBoundingClientRect():null; return { screen:${JSON.stringify(name)}, sw:s?s.scrollWidth:0, cw:s?s.clientWidth:0, docW:document.documentElement.scrollWidth, innerW:innerWidth, buttons:document.querySelectorAll('#screen button').length, overlay:!!o, h:r?Math.round(r.height):0, vh:innerHeight }; })()`);
      menuRows.push({ size: w + 'x' + h, ...m, overflow: m.sw - m.cw, docOverflow: m.docW - m.innerW });
    }
  }
  const menuOk = menuRows.every(r => r.overflow <= 2 && r.docOverflow <= 2 && r.buttons > 0);
  record('T14', 'Menús: sin desbordes horizontales en 6 pantallas × 5 tamaños', menuOk ? 'PASS' : 'FAIL', JSON.stringify(menuRows.filter(r=>r.overflow>2||r.docOverflow>2||r.buttons===0).slice(0,10)));
  if (!menuOk) issue('Algún menú desborda horizontalmente o no tiene acciones', JSON.stringify(menuRows.filter(r=>r.overflow>2||r.docOverflow>2||r.buttons===0).slice(0,10)));
  await s.setViewport(1280, 720);

  /* ---------- Cambio de cosmético: frames no vacíos ---------- */
  await s.ev('window.__v22.openWardrobe()');
  await s.waitFor("!!document.querySelector('#wardrobePreviewMount canvas')", 5000);
  await sleep(700);
  await s.ev(`(() => {
    window.__v22.flicker = [];
    if (window.__v22.flickerTimer) clearInterval(window.__v22.flickerTimer);
    window.__v22.flickerTimer = setInterval(function () {
      var c = document.querySelector('#wardrobePreviewMount canvas');
      if (!c) return;
      try { window.__v22.flicker.push(c.toDataURL('image/png').length); } catch (e) {}
    }, 35);
    return true;
  })()`);
  const cards = await s.ev("[...document.querySelectorAll('#wardrobeItemsGrid .cosmeticCard')].slice(0,10).map(c=>c.getAttribute('data-id'))");
  for (const id of cards) {
    await s.ev(`(() => { const c=document.querySelector('#wardrobeItemsGrid .cosmeticCard[data-id="${id}"]'); if(c)c.click(); })()`);
    await sleep(135);
  }
  await sleep(500);
  const flicker = await s.ev("(() => { clearInterval(window.__v22.flickerTimer); const a=window.__v22.flicker||[]; return { frames:a.length, min: a.length?Math.min.apply(null,a):0, max: a.length?Math.max.apply(null,a):0, blanks: a.filter(x=>x<3000).length, detail: (document.querySelector('#wardrobeDetail h3')||{}).textContent||'' }; })()");
  record('T15', 'Cambio de cosmético: sin frames vacíos en el visor', flicker.frames >= 20 && flicker.blanks === 0 && flicker.detail ? 'PASS' : 'FAIL', JSON.stringify(flicker));
  if (flicker.blanks) issue('El visor produjo frames vacíos al cambiar cosméticos', JSON.stringify(flicker));
  await s.ev("window.__v22.openHub()");
  await s.waitFor("window.__gameState().screen === 'hub'", 7000);
  await sleep(600);

  /* ---------- Duelo: matriz ---------- */
  await s.ev("window.__v22.launchMission('mission-sp-1')");
  await s.waitFor("window.__gameState && window.__gameState().screen === 'duel'", 9000);
  await sleep(900);
  const sizes = [[1308,662],[480,320],[640,360],[844,390],[1024,600],[768,1024],[1280,720],[1920,1080]];
  const duelRows = [];
  for (const [w,h] of sizes) {
    await s.setViewport(w,h);
    await sleep(650);
    const m = await s.ev(`(() => {
      const panel=document.querySelector('.duelPanel'); const r=panel?panel.getBoundingClientRect():null;
      const opts=[...document.querySelectorAll('#screen [data-action="answer"]')].map(e=>{const q=e.getBoundingClientRect(); return {t:Math.round(q.top),b:Math.round(q.bottom),h:Math.round(q.height),w:Math.round(q.width)}});
      return { vw:innerWidth, vh:innerHeight, panel:r?{t:Math.round(r.top),b:Math.round(r.bottom),h:Math.round(r.height),w:Math.round(r.width)}:null,
        opts, visible: opts.filter(o=>o.t>=-1 && o.b<=innerHeight+1 && o.w>20).length, scroll: panel?panel.scrollHeight>panel.clientHeight+1:false };
    })()`);
    const ok = !!(m.panel && m.panel.b <= m.vh + 2 && m.panel.t >= -1 && m.opts.length === 4);
    duelRows.push({ size: w + 'x' + h, ok, panel: m.panel, visible: m.visible, scroll: m.scroll });
    if (w === 1308 || w === 480 || w === 844) await s.shot('duelo-' + w + 'x' + h);
  }
  record('T05', 'Duelo: panel dentro del alto y 4 alternativas en la matriz', duelRows.every(r=>r.ok) ? 'PASS' : 'FAIL', JSON.stringify(duelRows));
  if (duelRows.some(r=>!r.ok)) issue('El panel del duelo se sale en alguna vista', JSON.stringify(duelRows.filter(r=>!r.ok)));
  await s.setViewport(1280, 720);
  await sleep(500);
  const fpsDuel = await s.collectFps('duel', 2);
  await s.setViewport(1308, 662);
  await sleep(500);

  /* ---------- Resumen ---------- */
  for (let i = 0; i < 6; i++) {
    const scr = await s.ev('window.__v22.screen()');
    if (scr === 'result') break;
    await s.ev("window.__v22.answer('A')");
    await sleep(1100);
  }
  await s.waitFor("window.__gameState().screen === 'result'", 9000);
  await sleep(500);
  const result = await s.ev(`(() => {
    const card=document.querySelector('.resultCard'); const head=document.querySelector('.resultHead'); const foot=document.querySelector('.resultFoot');
    const list=document.querySelector('.v2-summary__list'); const title=document.querySelector('.resultHead h1');
    const r=card?card.getBoundingClientRect():null; const h=head?head.getBoundingClientRect():null; const f=foot?foot.getBoundingClientRect():null;
    return { vw:innerWidth, vh:innerHeight, card:r?{t:Math.round(r.top),b:Math.round(r.bottom),h:Math.round(r.height)}:null,
      head:h?{t:Math.round(h.top),b:Math.round(h.bottom)}:null, foot:f?{t:Math.round(f.top),b:Math.round(f.bottom)}:null,
      title:title?title.textContent.trim():'', buttons:document.querySelectorAll('.resultFoot .btn').length,
      list:list?{h:list.clientHeight, sh:list.scrollHeight, scroll:list.scrollHeight>list.clientHeight+2}:null,
      scrollbar:getComputedStyle(document.documentElement).scrollbarColor || '' };
  })()`);
  const resultOk = !!(result.card && result.card.t >= -1 && result.card.b <= result.vh + 2 && result.head && result.head.t >= -1 && result.foot && result.foot.b <= result.vh + 2 && result.buttons > 0);
  record('T06', 'Resumen: cabecera/pie visibles y lista con scroll propio', resultOk ? 'PASS' : 'FAIL', JSON.stringify(result));
  if (!resultOk) issue('El resumen no cabe en la ventana', JSON.stringify(result));
  await s.shot('resumen-1308x662');
  await s.setViewport(390, 844);
  await sleep(500);
  await s.shot('resumen-390x844');
  await s.setViewport(1280, 720);

  /* ---------- Atrio, etiquetas y avisos ---------- */
  await s.ev('window.__v22.openHub()');
  await s.waitFor("window.__gameState().screen === 'hub'", 7000);
  await sleep(1200);
  const gates = await s.ev('window.__v22.gateInfo()');
  record('T07', 'Atrio: 5 etiquetas de área con desvanecimiento', gates.length === 5 && gates.every(g=>g.label && g.opacity != null) ? 'PASS' : 'FAIL', JSON.stringify(gates));
  await s.shot('atrio-1280x720');

  const sigs = await s.ev('window.__v22.cosmeticSignatures()');
  const nonTitle = sigs.filter(g=>g.category !== 'titulo');
  const geom = nonTitle.map(g=>g.groups + '|' + g.verts + '|' + g.size.join(','));
  const uniqueGeom = new Set(geom).size;
  record('T11', '61 cosméticos 3D: geometría propia por pieza (8 títulos son texto)', sigs.length === 69 && nonTitle.length === 61 && uniqueGeom === 61 ? 'PASS' : 'FAIL', JSON.stringify({ total: sigs.length, nonTitle: nonTitle.length, uniqueGeom, duplicates: geom.filter((v,i)=>geom.indexOf(v)!==i).slice(0,8) }));
  const fit = await s.ev('window.__v22.fitAllHeroes()');
  record('T12', '69 cosméticos acoplados a los 10 héroes (690 montajes)', fit && fit.count === 0 && fit.cases === 690 ? 'PASS' : 'FAIL', JSON.stringify(fit));

  await s.ev('window.__v22.storageBlocked()');
  await sleep(400);
  const notice1 = await s.ev("(()=>{const b=document.querySelector('.storageBanner'); return {banner:!!b, close:!!(b&&b.querySelector('[data-action=storage-dismiss]')), indicator:!!document.querySelector('.storageIndicator')};})()");
  await sleep(6800);
  const notice2 = await s.ev("(()=>({banner:!!document.querySelector('.storageBanner'), indicator:!!document.querySelector('.storageIndicator')}))()");
  record('T08', 'Aviso de guardado: cierre, auto-ocultado e indicador', notice1.banner && notice1.close && notice1.indicator && !notice2.banner && notice2.indicator ? 'PASS' : 'FAIL', JSON.stringify({ notice1, notice2 }));

  /* ---------- Compra ---------- */
  const buySave = JSON.parse(JSON.stringify(baseSave));
  buySave.coins = 5000;
  buySave.collection = { ownedCharacterIds: ['ilan','noa','teo'], ownedCosmeticIds: [], selectedCharacterId: 'noa', equipped: {} };
  await s.seed(buySave, { skipTutorial: true });
  await s.ev('window.__v22.openShop()');
  await s.waitFor("!!document.querySelector('.shopShell')", 5000);
  await sleep(1200);
  await s.ev("(()=>{const c=document.querySelector('#shopGrid .cosmeticCard[data-id=\\\"c-cabeza-gorro\\\"]'); if(c)c.click();})()");
  await sleep(400);
  await s.ev("(()=>{const b=document.querySelector('[data-action=shop-buy]'); if(b&&!b.disabled)b.click();})()");
  await sleep(500);
  const confirmVisible = await s.ev("!!document.querySelector('[data-action=shop-confirm]')");
  if (confirmVisible) await s.ev("document.querySelector('[data-action=shop-confirm]').click()");
  await sleep(900);
  const bought = await s.readSave();
  const owns = !!(bought && bought.collection && bought.collection.ownedCosmeticIds && bought.collection.ownedCosmeticIds.indexOf('c-cabeza-gorro') !== -1);
  record('T09', 'Compra: confirmación, descuento y pieza en la colección', owns && bought.coins < 5000 ? 'PASS' : 'FAIL', JSON.stringify({ owns, coins: bought && bought.coins }));
  if (!owns) issue('La compra no dejó la pieza en la colección', JSON.stringify({ confirmVisible, coins: bought && bought.coins }));

  /* ---------- FPS ---------- */
  await s.seed(baseSave, { skipTutorial: true });
  await s.ev('window.__v22.openHub()');
  await s.waitFor("window.__gameState().screen === 'hub'", 7000);
  await sleep(800);
  const fpsHub = await s.collectFps('hub', 2);
  record('T10', 'FPS en atrio', fpsHub.min >= 55 && fpsHub.below45 === 0 ? 'PASS' : 'FAIL', JSON.stringify({ min: fpsHub.min, avg: fpsHub.avg, samples: fpsHub.samples.length }));
  record('T17', 'FPS en duelo', fpsDuel.min >= 55 && fpsDuel.below45 === 0 ? 'PASS' : 'FAIL', JSON.stringify({ min: fpsDuel.min, avg: fpsDuel.avg, samples: fpsDuel.samples.length }));

  /* ---------- Export HTML por file:// ---------- */
  const errorsBefore = s.errors.length;
  const requestsBefore = s.requests.length;
  await s.send('Page.navigate', { url: pathToFileURL(EXPORT).href });
  const exportBooted = await s.waitFor("document.readyState === 'complete' && window.__gameState && window.__gameState().screen", 20000);
  await sleep(1200);
  const exportState = await s.ev("(() => ({ screen: window.__gameState ? window.__gameState().screen : null, title: document.title, game: !!(window.__gameState && window.__gameState().game), hasV22: typeof window.__v22 !== 'undefined' }))()");
  const errorsAdded = s.errors.length - errorsBefore;
  const nonLocal = s.requests.slice(requestsBefore).filter((r) => /^https?:/i.test(r.url)).length;
  record('T16', 'Export HTML por file://: arranca, sin red y sin errores', exportBooted && exportState.screen && exportState.hasV22 && errorsAdded === 0 && nonLocal === 0 ? 'PASS' : 'FAIL', JSON.stringify({ booted: exportBooted, ...exportState, errorsAdded, nonLocal }));
  await s.shot('export-file');

  const summary = { cases: results.cases, issues: results.issues, shots: results.shots, fps: { hub: fpsHub, duel: fpsDuel }, artifacts: { dist: fs.statSync(DIST).size }, generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(EVIDENCE, 'agent9-v22-qa.json'), JSON.stringify(summary, null, 2));
  const md = ['# SERUMS QUEST · V2.2 · QA Agente 9', '', '- Casos: ' + results.cases.length + ' · PASS ' + results.cases.filter(c=>c.status==='PASS').length + ' · FAIL ' + results.cases.filter(c=>c.status==='FAIL').length, '- Incidencias: ' + results.issues.length, '', '| Caso | Resultado | Detalle |', '| --- | --- | --- |'];
  results.cases.forEach(c=>md.push('| ' + c.id + ' · ' + c.title.replace(/\|/g,'/') + ' | **' + c.status + '** | ' + String(c.detail).replace(/\|/g,'/').slice(0,240) + ' |'));
  md.push('', '## FPS', '', JSON.stringify({ hub: { min: fpsHub.min, avg: fpsHub.avg, below45: fpsHub.below45 }, duel: { min: fpsDuel.min, avg: fpsDuel.avg, below45: fpsDuel.below45 } }, null, 2), '', '## Capturas', '');
  results.shots.forEach(f=>md.push('- `' + path.basename(f) + '`'));
  fs.writeFileSync(path.join(EVIDENCE, 'agent9-v22-report.md'), md.join('\n'));
  console.log('V2.2 QA terminado: ' + results.cases.filter(c=>c.status==='PASS').length + ' PASS / ' + results.cases.filter(c=>c.status==='FAIL').length + ' FAIL / ' + results.issues.length + ' issues');
  try { s.ws.close(); } catch (e) {}
  try { s.proc.kill(); } catch (e) {}
  process.exit(results.cases.some(c=>c.status==='FAIL') ? 2 : 0);
})().catch((e) => { console.error('QA V2.2 ERROR', e && e.stack || e); try { if (s) { s.ws.close(); s.proc.kill(); } } catch (x) {} process.exit(1); });
