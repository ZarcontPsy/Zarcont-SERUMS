'use strict';
/* =========================================================================
   SERUMS QUEST · V2.1 · Agente 7 · Arnés de QA (base V2.0 / final V2.1)
   Arnés autónomo por CDP. No modifica el juego: siembra localStorage,
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
const MODE = (process.argv.find((a) => /^--mode=/.test(a)) || '--mode=base').split('=')[1] === 'final' ? 'final' : 'base';
const PORT = MODE === 'final' ? 9399 : 9398;
const PROFILE = path.join(QA_DIR, 'agent7-v21-profile-' + MODE);
const DOWNLOADS = path.join(QA_DIR, 'agent7-v21-downloads-' + MODE);
const SHOT_PREFIX = MODE;
const BASE_BUILD = 'b32f14899538';
const WIDTH = 1280;
const HEIGHT = 720;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const emptySave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-empty.json'), 'utf8'));
const dueSave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-due.json'), 'utf8'));
const lowSave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-low.json'), 'utf8'));
const masterySave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-mastery-etica.json'), 'utf8'));
const saveFull = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-full.json'), 'utf8'));
const legacyText = fs.readFileSync(path.join(ROOT, '.work', 'offline-fixture.json'), 'utf8');

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
const saveMission = withSettings(lowSave);
saveMission.settings.sourceWeights = { campaign: 0.35, dashboard: 0.4, flashcards: 0.25 };
saveMission.coins = 120; saveMission.xp = 0; saveMission.stage = 1;
saveMission.missions = {}; saveMission.questions = {}; saveMission.errors = {}; saveMission.questionTags = {};
const saveShop = withSettings(lowSave);
saveShop.coins = 500; saveShop.xp = 0; saveShop.stage = 1;
saveShop.missions = {}; saveShop.questions = {}; saveShop.errors = {};
saveShop.academic = { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: {}, recent: [] };
saveShop.collection = { ownedCharacterIds: ['ilan', 'noa'], ownedCosmeticIds: [], selectedCharacterId: 'noa', equipped: {} };
const saveHeroes = withSettings(saveFull);
const saveHeroesHat = withSettings(saveFull);
saveHeroesHat.collection.equipped = {};
['ilan', 'mara', 'noa', 'teo', 'lia', 'kian', 'amaru', 'ona', 'iris', 'zenon'].forEach((id) => {
  saveHeroesHat.collection.equipped[id] = { cabeza: 'c-cabeza-gorro' };
});
const saveHeroesGlasses = withSettings(saveFull);
saveHeroesGlasses.collection.ownedCosmeticIds = saveHeroesGlasses.collection.ownedCosmeticIds.concat(['c-accesorios-gafas']);
saveHeroesGlasses.collection.equipped = {};
['ilan', 'mara', 'noa', 'teo', 'lia', 'kian', 'amaru', 'ona', 'iris', 'zenon'].forEach((id) => {
  saveHeroesGlasses.collection.equipped[id] = { accesorios: 'c-accesorios-gafas' };
});
const saveGenerated = withSettings(lowSave, { sourceWeights: { campaign: 0, dashboard: 0.5, flashcards: 0.5 } });
saveGenerated.missions = {}; saveGenerated.questions = {}; saveGenerated.errors = {};
const saveRestoreHigh = withSettings(masterySave);
saveRestoreHigh.v2 = saveRestoreHigh.v2 || {};
saveRestoreHigh.v2.world = saveRestoreHigh.v2.world || {};
saveRestoreHigh.v2.world.restored = {
  'area-psi-salud-publica': 3, 'area-psi-cuidado-integral': 2, 'area-psi-etica': 3,
  'area-psi-investigacion': 1, 'area-psi-gestion': 2
};

const results = {
  meta: { mode: MODE, startedAt: new Date().toISOString(), expectedBase: BASE_BUILD },
  summary: {}, cases: [], issues: [], fps: {}, shots: [], captures: {},
  regression: {}, v21: {}, probes: {}, artifacts: {}, network: {}, errors: {}, warnings: [],
  warningsTotal: 0, viewports: {}, save: {}
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
  console.log('[' + status + '] ' + id + ' · ' + title + (detail ? ' :: ' + String(detail).slice(0, 400) : ''));
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
  throw new Error('Chrome no abrió la pestaña de prueba');
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
    if (!booted) throw new Error('La recarga no completó el arranque');
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

/* ------------------------------------------------------------- page probes */
async function pageInfo(s) {
  return s.ev(`(() => {
    const V = window.__V2 || null;
    const st = window.__gameState ? window.__gameState() : null;
    const glCanvas = document.createElement('canvas');
    let gl = { ok: false };
    try {
      const g = glCanvas.getContext('webgl2') || glCanvas.getContext('webgl');
      if (g) {
        const d = g.getExtension('WEBGL_debug_renderer_info');
        gl = { ok: true, vendor: d ? g.getParameter(d.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR),
          renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER) };
      }
    } catch (e) { gl = { ok: false, error: String(e) }; }
    const apis = {};
    if (V) {
      ['feedback', 'heroes', 'assets', 'world', 'duel', 'summary', 'perf'].forEach(function (m) {
        apis[m] = V[m] ? Object.keys(V[m]) : null;
      });
    }
    return {
      screen: st && st.screen, state: st, title: document.title,
      titleVersion: (document.querySelector('.titleVersion') || {}).textContent || '',
      version: V && V.version, modules: V && V.modules, apis,
      feedbackApis: V && V.feedback ? {
        onAnswer: typeof V.feedback.onAnswer === 'function', hide: typeof V.feedback.hide === 'function',
        isOpen: typeof V.feedback.isOpen === 'function', update: typeof V.feedback.update === 'function',
        settingsHTML: typeof V.feedback.settingsHTML === 'function', mountSettings: typeof V.feedback.mountSettings === 'function',
        inlineEnabled: typeof V.feedback.inlineEnabled === 'function', autoAdvanceDelay: typeof V.feedback.autoAdvanceDelay === 'function',
        isEndMode: typeof V.feedback.isEndMode === 'function', feedbackMode: typeof V.feedback.feedbackMode === 'function',
        mixMissionQuestions: typeof V.feedback.mixMissionQuestions === 'function'
      } : null,
      world: !!V && !!V.world, dpr: window.devicePixelRatio, gl: gl,
      viewport: { w: window.innerWidth, h: window.innerHeight }
    };
  })()`);
}
async function worldStats(s) { return s.ev('window.__V2 && window.__V2.world ? window.__V2.world.stats() : null'); }
async function worldIds(s) { return s.ev('window.__V2 && window.__V2.world ? window.__V2.world.ids : null'); }
async function worldOpen(s) { return s.ev("!!document.querySelector('.v2-world-overlay.is-open')"); }
async function openWorld(s, id) {
  const ok = await s.ev(`window.__V2 && window.__V2.world ? !!window.__V2.world.interact(${JSON.stringify(id)}) : false`);
  await sleep(450);
  return ok;
}
async function closeWorld(s) {
  await s.ev("window.__V2 && window.__V2.world ? window.__V2.world.close() : false");
  await sleep(300);
}
async function worldPanel(s) {
  return s.ev(`(() => {
    const root = document.querySelector('.v2-world-overlay.is-open');
    if (!root) return null;
    const q = function (sel) { const e = root.querySelector(sel); return e ? String(e.textContent || '').trim() : ''; };
    const body = root.querySelector('#v2w-body');
    const panel = root.querySelector('.v2-world-panel');
    return {
      open: true, eyebrow: q('.v2-world-eyebrow'), title: q('.v2-world-title'),
      body: body ? String(body.innerText || '') : '', foot: (root.querySelector('#v2w-foot') || {}).innerText || '',
      actions: [...root.querySelectorAll('[data-action]')].map(function (e) { return e.getAttribute('data-action'); }),
      panel: panel ? { w: panel.clientWidth, h: panel.clientHeight, scrollW: panel.scrollWidth, scrollH: panel.scrollHeight } : null,
      bodyBox: body ? { w: body.clientWidth, h: body.clientHeight, scrollW: body.scrollWidth, scrollH: body.scrollHeight } : null
    };
  })()`);
}
async function clickWorld(s, action, delay) {
  const sel = '.v2-world-overlay.is-open [data-action="' + action + '"]';
  const ok = await s.ev('(() => { const el=document.querySelector(' + JSON.stringify(sel) + '); if(!el) return false; el.click(); return true; })()');
  if (!ok) throw new Error('No existe acción de mundo ' + action);
  await sleep(delay == null ? 500 : delay);
}
async function readWorldState(s) {
  return s.ev(`(() => { const st = JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null'); return st && st.v2 && st.v2.world ? st.v2.world : null; })()`);
}
async function currentQuestion(s) {
  return s.ev(`(() => {
    const btn = document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]');
    const id = btn && btn.getAttribute('data-question');
    const q = id && window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.questions ? window.CAMPAIGN_DATA.questions[id] : null;
    if (!q) return null;
    return { id: q.id, answer: q.answer, stem: q.stem, explanation: q.explanation, areaId: q.areaId,
      source: q.source, generated: q.generated, difficulty: q.difficulty,
      options: (q.options || []).map(function (o) { return { id: o.id, text: o.text }; }) };
  })()`);
}
async function answerAndWait(s, letter, waitMs) {
  await s.click('#screen [data-action="answer"][data-letter="' + letter + '"]', 0);
  const ok = await s.waitFor("!!document.querySelector('.v2-feedback[data-v2-feedback], .feedbackStrip, [data-v2-summary-inline]')", 1800);
  await sleep(waitMs == null ? 300 : waitMs);
  return ok;
}
async function feedbackInfo(s) {
  return s.ev(`(() => {
    const v2 = document.querySelector('.v2-feedback[data-v2-feedback]');
    const legacy = document.querySelector('.feedbackStrip');
    const r = { v2Open: !!v2, legacy: !!legacy };
    if (v2) {
      r.kind = v2.getAttribute('data-kind') || '';
      r.text = String(v2.innerText || '').slice(0, 1200);
      const key = v2.querySelector('.v2-feedback__letter');
      r.answer = key ? String(key.textContent || '').trim() : '';
      r.hasExplanation = !!v2.querySelector('.v2-feedback__block--explain .v2-feedback__text');
      r.hasContinue = !!v2.querySelector('[data-action="v2-feedback-continue"]');
      r.hasFlash = !!v2.querySelector('[data-action="v2-feedback-flashcard"]');
    }
    if (legacy) r.legacyText = String(legacy.innerText || '').slice(0, 900);
    if (window.__V2 && window.__V2.feedback && typeof window.__V2.feedback.isOpen === 'function') r.apiOpen = !!window.__V2.feedback.isOpen();
    const st = window.__gameState ? window.__gameState() : null;
    r.feedbackOpen = st ? st.feedbackOpen : null;
    return r;
  })()`);
}
async function continueFeedback(s) {
  if (await s.has('[data-action="v2-feedback-continue"]')) await s.click('[data-action="v2-feedback-continue"]', 450);
  else if (await s.has('#screen [data-action="next-question"]')) await s.click('#screen [data-action="next-question"]', 450);
  else return false;
  await sleep(350);
  return true;
}
async function openJournalMission(s, areaId, missionId) {
  const screen = await s.ev('window.__gameState().screen');
  if (screen === 'hub') await s.press('KeyJ');
  else if (await s.has('#screen [data-action="open-journal"]')) await s.click('#screen [data-action="open-journal"]', 450);
  await s.waitFor("window.__gameState().screen === 'journal'", 5000);
  const areaSel = '#screen [data-action="select-area"][data-area="' + areaId + '"]';
  if (!(await s.has(areaSel))) throw new Error('La bitácora no muestra ' + areaId);
  await s.click(areaSel, 400);
  const missionSel = '#screen [data-action="select-mission"][data-mission="' + missionId + '"]';
  await s.waitFor('!!document.querySelector(' + JSON.stringify(missionSel) + ')', 4000);
  await s.click(missionSel, 400);
  await s.click('#screen [data-action="start-mission"]', 1200);
  await s.waitFor("window.__gameState().screen === 'duel'", 7000);
  await sleep(700);
}
async function pauseAndAbandon(s) {
  if (!(await s.waitFor("window.__gameState().screen === 'pause'", 1200))) {
    if (await s.has('#screen [data-action="open-pause"]')) await s.click('#screen [data-action="open-pause"]', 350);
    else await s.press('Escape');
  }
  await s.waitFor("window.__gameState().screen === 'pause'", 4000);
  await s.click('#screen [data-action="abandon-duel"]', 380);
  await s.click('#screen [data-action="abandon-duel"]', 380);
  await s.waitFor("window.__gameState().screen === 'result'", 6000);
  await sleep(400);
}
async function resultContinue(s) {
  if (await s.has('#screen [data-action="result-continue"]')) await s.click('#screen [data-action="result-continue"]', 800);
  await sleep(500);
}
async function openSettingsFromTitle(s) {
  await s.click('#screen [data-action="open-settings"]', 450);
  await s.waitFor("window.__gameState().screen === 'settings'", 5000);
  await sleep(300);
}
async function openSettingsFromHub(s) {
  await s.press('Escape');
  await s.waitFor("window.__gameState().screen === 'pause'", 4000);
  await s.click('#screen [data-action="open-settings"]', 450);
  await s.waitFor("window.__gameState().screen === 'settings'", 5000);
  await sleep(300);
}
async function analyzeImportText(s, text) {
  await s.setValue('#legacyText', text);
  await s.click('#screen [data-action="legacy-analyze"]', 0);
  const ok = await s.waitFor("!!document.querySelector('.importPreview')", 6000);
  if (!ok) {
    const err = await s.ev("(document.querySelector('#screen .notice') || {}).innerText || ''");
    throw new Error('La vista previa no apareció. ' + err);
  }
  await sleep(250);
  return s.ev(`(() => {
    const p = document.querySelector('.importPreview');
    if (!p) return null;
    const grid = {};
    p.querySelectorAll('.previewGrid > div').forEach(function (d) {
      const k = (d.querySelector('span') || {}).textContent || '';
      const v = (d.querySelector('b') || {}).textContent || '';
      if (k) grid[k.trim()] = v.trim();
    });
    return { name: ((p.querySelector('.previewName') || {}).textContent || '').trim(), grid: grid, text: String(p.innerText || '').slice(0, 1400) };
  })()`);
}
async function confirmImportAndWait(s) {
  await s.click('#screen [data-action="import-confirm"]', 900);
  const ok = await s.waitFor("['title','hub'].indexOf(window.__gameState().screen) !== -1", 7000);
  if (!ok) throw new Error('La importación no volvió al título/atrio');
  await sleep(500);
  await s.dismissBanners();
}
async function clickByText(s, scope, pattern, max) {
  return s.ev(`(() => {
    const re = new RegExp(${JSON.stringify(pattern)}, 'i');
    const root = document.querySelector(${JSON.stringify(scope)}) || document;
    const list = [...root.querySelectorAll('button, [role="button"], label, input, select')];
    for (const el of list) {
      const txt = ((el.innerText || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('data-action') || '') + ' ' + (el.getAttribute('data-mode') || '')).trim();
      if (!re.test(txt)) continue;
      if (el.tagName === 'INPUT' && el.type === 'checkbox') { el.click(); return { clicked: true, tag: el.tagName, type: el.type, text: txt.slice(0, 160) }; }
      el.click();
      return { clicked: true, tag: el.tagName, type: el.type || '', text: txt.slice(0, 160), action: el.getAttribute('data-action') || '' };
    }
    return { clicked: false, count: list.length, sample: list.slice(0, 12).map(function (e) { return ((e.innerText || '') + ' ' + (e.getAttribute('data-action') || '')).trim().slice(0, 80); }) };
  })()`);
}
function todayFromNode() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/* --------------------------------------------------------------- report */
function buildReport() {
  const count = (st) => results.cases.filter((c) => c.status === st).length;
  const md = [];
  md.push('# SERUMS QUEST · V2.1 · Informe QA Agente 7 · ' + (isBase() ? 'pasada base (V2.0)' : 'pasada final (V2.1)'));
  md.push('');
  md.push('- **Modo:** ' + MODE + ' · build esperado base `' + BASE_BUILD + '`');
  md.push('- **Inicio/fin:** ' + results.meta.startedAt + ' → ' + results.meta.finishedAt + ' · ' + Math.round((results.meta.durationMs || 0) / 1000) + ' s');
  if (results.artifacts && results.artifacts.dist) {
    md.push('- **bundle evaluado:** `' + (results.artifacts.bundle && results.artifacts.bundle.path || 'dist/index.html') + '` · `' + (results.artifacts.bundle && results.artifacts.bundle.sha256) + '` · ' + (results.artifacts.bundle && results.artifacts.bundle.bytes) + ' B · mtime ' + (results.artifacts.bundle && results.artifacts.bundle.mtime));
    md.push('- **dist/index.html:** `' + results.artifacts.dist.sha256 + '` · ' + results.artifacts.dist.bytes + ' B');
    md.push('- **export/serums-quest.html:** `' + (results.artifacts.export && results.artifacts.export.sha256) + '` · ' + (results.artifacts.export && results.artifacts.export.bytes) + ' B · igual al dist: ' + (results.artifacts.sameHash ? 'sí' : 'NO') + (results.artifacts.baseBundleReason ? ' · ' + results.artifacts.baseBundleReason : ''));
  }
  md.push('- **Entorno:** ' + (results.meta.chrome || '—') + ' · GPU: ' + (results.meta.gpu || '—') + ' · ' + (results.meta.viewport ? results.meta.viewport.w + '×' + results.meta.viewport.h : '—') + ' · DPR ' + (results.meta.viewport ? results.meta.viewport.dpr : '—'));
  md.push('- **Resultado:** ' + count('PASS') + ' PASS · ' + count('FAIL') + ' FAIL · ' + count('BLOCKED') + ' BLOCKED · ' + count('SKIP') + ' SKIP · ' + count('NOTE') + ' NOTE (de ' + results.cases.length + ' casos)');
  md.push('- **Red principal:** ' + ((results.network && results.network.nonLocal) || []).length + ' no locales de ' + (results.network ? results.network.total : 0) + ' · **Errores:** ' + (results.errors.total || 0) + ' · **V2._errors:** ' + (results.errors.v2Count || 0));
  md.push('');
  md.push('## Casos');
  md.push('');
  md.push('| Caso | Resultado | Evidencia |');
  md.push('| --- | --- | --- |');
  const cell = (t, max) => String(t == null ? '' : t).replace(/\r?\n/g, ' ').replace(/\|/g, '/').slice(0, max || 500);
  results.cases.forEach((c) => {
    const ev = (c.evidence || []).map((e) => String(e).indexOf('agent7-') === 0 ? '[' + e + '](' + e + ')' : e).join(' · ');
    md.push('| ' + cell(c.id, 80) + ' · ' + cell(c.title, 180) + ' | **' + c.status + '** | ' + (cell(ev, 600) || cell(c.detail, 600) || '—') + ' |');
  });
  md.push('');
  md.push('## Rendimiento');
  md.push('');
  md.push('| Escena | Calidad | Mínimo | Medio | Muestras | <45 | Evidencia |');
  md.push('| --- | --- | --- | --- | --- | --- | --- |');
  ['hubIdle', 'hubPanel', 'map', 'duel'].forEach((key) => {
    const f = results.fps[key];
    if (!f) return;
    md.push('| ' + key + ' | ' + (f.quality || 'alto') + ' | ' + (f.min == null ? '—' : f.min) + ' | ' + (f.avg == null ? '—' : f.avg) + ' | ' + (f.values ? f.values.length : 0) + ' | ' + (f.below45 == null ? '—' : f.below45) + ' | agent7-v21-qa.json → fps.' + key + ' |');
  });
  md.push('');
  const fpsVals = ['hubIdle', 'hubPanel', 'map', 'duel'].map((k) => results.fps[k] && results.fps[k].values ? k + ' = [' + results.fps[k].values.join(', ') + ']' : null).filter(Boolean);
  if (fpsVals.length) { md.push('Muestras (`window.__gameState().fps` cada ~120 ms): ' + fpsVals.join(' · ') + '.'); md.push(''); }
  md.push('Objetivo: medio ≥ 55 y mínimo ≥ 45. ' + (results.meta.fpsNote || ''));
  md.push('');
  md.push('## V2.1 · estado de las funciones pedidas');
  md.push('');
  if (results.v21 && results.v21.features) {
    md.push('```json');
    md.push(JSON.stringify(results.v21.features, null, 2));
    md.push('```');
    md.push('');
  }
  md.push('## Capturas y medidas');
  md.push('');
  if (results.captures && results.captures.counts) {
    md.push('- ' + Object.keys(results.captures.counts).map((k) => k + ': ' + results.captures.counts[k]).join(' · '));
  }
  if (results.viewports && Object.keys(results.viewports).length) {
    md.push('');
    md.push('| Vista | Captura | scrollW | screenW | overflow | opciones visibles | HUD | tapado | rotatePrompt |');
    md.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    Object.keys(results.viewports).forEach((k) => {
      const v = results.viewports[k];
      md.push('| ' + k + ' | ' + (v.shot ? '[' + v.shot + '](' + v.shot + ')' : '—') + ' | ' + (v.scrollW == null ? '—' : v.scrollW) + ' | ' + (v.innerW == null ? '—' : v.innerW) + ' | ' + (v.overflow == null ? '—' : v.overflow) + ' | ' + (v.optionsVisible == null ? '—' : v.optionsVisible + '/' + v.options) + ' | ' + (v.hud ? v.hud.w + '×' + v.hud.h : '—') + ' | ' + (v.hudOverlap == null ? '—' : v.hudOverlap) + ' | ' + (v.rotatePrompt == null ? '—' : v.rotatePrompt) + ' |');
    });
  }
  md.push('');
  md.push('## Red y errores');
  md.push('');
  if (results.network) {
    md.push('- Peticiones totales: ' + results.network.total + '; no locales (http/https/ws): ' + ((results.network.nonLocal || []).length) + '.');
    md.push('- Esquemas: ' + JSON.stringify(results.network.allowed || {}));
  }
  md.push('- Errores de consola/excepción: ' + (results.errors.total || 0) + '.');
  if (results.errors.items && results.errors.items.length) results.errors.items.slice(0, 12).forEach((e) => md.push('  - `' + e.kind + '` ' + String(e.text || e.description || '').slice(0, 260)));
  if (results.artifacts && results.artifacts.exportTest) {
    const ex = results.artifacts.exportTest;
    md.push('- Export HTML (file://): mundo=' + (ex.stats && ex.stats.built ? 'construido' : 'NO') + ' · no locales=' + ((ex.nonLocal || []).length) + ' · errores=' + ((ex.errors || []).length) + ' · warnings=' + ((ex.warnings || []).length) + '.');
  }
  if (results.artifacts && results.artifacts.hubRedirect) {
    const hr = results.artifacts.hubRedirect;
    md.push('- HUB index → dist/index.html: redirect=' + (/\/dist\/index\.html$/.test(hr.path || '') ? 'sí' : 'NO') + ' · juego=' + !!hr.game + ' · no locales=' + ((hr.nonLocal || []).length) + ' · errores=' + ((hr.errors || []).length) + '.');
  }
  const warnTotal = results.warningsTotal || (results.warnings || []).length;
  if (warnTotal) {
    const uniq = Array.from(new Set((results.warnings || []).map((w) => String(w.text || ''))));
    md.push('- Advertencias de consola: ' + warnTotal + ' · ' + uniq.slice(0, 6).map((w) => '`' + w.slice(0, 220) + '`').join(' · '));
  }
  md.push('');
  md.push('## Guardado y progreso');
  md.push('');
  if (results.save && Object.keys(results.save).length) {
    md.push('```json');
    md.push(JSON.stringify(results.save, null, 2).slice(0, 8000));
    md.push('```');
  }
  md.push('');
  md.push('## Problemas');
  md.push('');
  if (!results.issues.length) md.push('Sin problemas registrados.');
  else results.issues.forEach((i) => md.push('- **[' + i.severity + ' · ' + i.kind + ']** ' + i.title + (i.detail ? ' — ' + String(i.detail).replace(/\r?\n/g, ' ').slice(0, 1000) : '')));
  md.push('');
  if ((results.shots || []).length) {
    md.push('## Capturas');
    md.push('');
    Array.from(new Set(results.shots)).forEach((file) => {
      const name = path.basename(file);
      md.push('- [' + name + '](' + name + ')');
    });
    md.push('');
  }
  md.push('## Cierre');
  md.push('');
  md.push(count('FAIL') || count('BLOCKED') ? 'Hay casos FAIL/BLOCKED: revisar arriba; no se presentan como PASS.' : (isBase() ? 'Pasada base completada. Las funciones V2.1 ausentes quedan como NOTE/BLOCKED hasta integrar el nuevo build.' : 'Sin FAIL/BLOCKED. Revisar capturas y confirmar el veredicto de V2.1.'));
  md.push('');
  md.push('_Informe generado por `agent7-v21-qa.js`. No se modificó el juego._');
  return md.join('\n');
}

/* ------------------------------------------------------------------ main */
(async () => {
  const startedAt = new Date();
  const reportOnly = process.argv.indexOf('--report-only') !== -1;
  const baseJson = path.join(EVIDENCE, 'agent7-v21-base-qa.json');
  const modeJson = path.join(EVIDENCE, 'agent7-v21-' + MODE + '-qa.json');
  const mainJson = path.join(EVIDENCE, 'agent7-v21-qa.json');
  const modeReport = path.join(EVIDENCE, 'agent7-v21-' + MODE + '-report.md');
  const mainReport = path.join(EVIDENCE, 'agent7-v21-report.md');

  if (reportOnly) {
    Object.assign(results, JSON.parse(fs.readFileSync(modeJson, 'utf8')));
    fs.writeFileSync(modeReport, buildReport(), 'utf8');
    fs.writeFileSync(mainReport, buildReport(), 'utf8');
    console.log('Informe ' + MODE + ' regenerado');
    return;
  }

  const distStart = distInfo(DIST);
  const exportStart = distInfo(EXPORT);
  let BUNDLE = DIST;
  let baseBundleReason = '';
  if (MODE === 'base') {
    const distIsBase = distStart.sha256.indexOf(BASE_BUILD) === 0;
    const exportIsBase = exportStart.sha256.indexOf(BASE_BUILD) === 0;
    if (!distIsBase && exportIsBase) {
      BUNDLE = EXPORT;
      baseBundleReason = 'dist ya no es el build base (V2.1 en integración); se usa export/serums-quest.html, que conserva V2.0 ' + BASE_BUILD;
    }
  }
  const bundleStart = distInfo(BUNDLE);
  results.artifacts = {
    dist: distStart, export: exportStart, bundle: bundleStart,
    sameHash: distStart.sha256 === exportStart.sha256 && distStart.bytes === exportStart.bytes,
    baseBundleReason: baseBundleReason,
    bundleIsBase: bundleStart.sha256.indexOf(BASE_BUILD) === 0,
    hubIndex: { path: HUB_INDEX, bytes: fs.statSync(HUB_INDEX).size }
  };
  results.meta = Object.assign(results.meta, {
    startedAt: startedAt.toISOString(), buildId: bundleStart.sha256.slice(0, 12),
    width: WIDTH, height: HEIGHT, bundle: path.basename(BUNDLE)
  });
  console.log('V2.1 QA · modo ' + MODE + ' · bundle ' + path.basename(BUNDLE) + ' ' + bundleStart.sha256.slice(0, 12) + ' · ' + bundleStart.bytes + ' B · dist ' + distStart.sha256.slice(0, 12) + ' · export ' + exportStart.sha256.slice(0, 12));
  s = await launch(BUNDLE);
  try {
    const bv = await s.send('Browser.getVersion');
    results.meta.chrome = bv.product + ' (' + bv.revision + ')';
    const boot = await (async () => {
      await s.seed(withSettings(emptySave));
      if (!(await s.ev("window.__gameState && window.__gameState().screen === 'title'"))) await s.reload();
      return pageInfo(s);
    })();
    results.meta.viewport = { w: boot.viewport.w, h: boot.viewport.h, dpr: boot.dpr };
    results.meta.gpu = boot.gl.ok ? boot.gl.renderer : 'sin WebGL';
    results.meta.swiftShader = /swiftshader|llvmpipe|software/i.test(String(results.meta.gpu));
    results.meta.fpsNote = results.meta.swiftShader ? 'El entorno usa SwiftShader; las cifras no representan una GPU real.' : 'GPU real del host (' + results.meta.gpu + '), 1280×720 y DPR 1.';
    results.api = boot;
    results.v21.features = {
      summaryApi: !!(boot.apis && boot.apis.summary && boot.apis.summary.length),
      duelApi: !!(boot.apis && boot.apis.duel && boot.apis.duel.length),
      perfApi: !!(boot.apis && boot.apis.perf && boot.apis.perf.length),
      feedbackApi: boot.feedbackApis,
      settingsFeedbackMode: await s.ev(`(() => { try { const st=JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)})||'null'); return st && st.settings ? st.settings.feedbackMode : null; } catch(e) { return null; } })()`),
      settingsOnlyOriginalBank: await s.ev(`(() => { try { const st=JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)})||'null'); return st && st.settings ? !!st.settings.onlyOriginalBank : null; } catch(e) { return null; } })()`),
      titleVersion: boot.titleVersion, version: boot.version
    };
    const expectedHash = isBase() ? bundleStart.sha256.indexOf(BASE_BUILD) === 0 : true;
    record('ART01', 'Artefactos', 'Artefacto base/final: tamaño, hash y buildId',
      (isBase() ? bundleStart.sha256.indexOf(BASE_BUILD) === 0 : results.artifacts.sameHash) && expectedHash ? 'PASS' : 'FAIL',
      'bundle=' + path.basename(BUNDLE) + ' ' + bundleStart.bytes + ' B/' + bundleStart.sha256.slice(0, 20) + ' · dist=' + distStart.bytes + ' B/' + distStart.sha256.slice(0, 12) + ' · export=' + exportStart.bytes + ' B/' + exportStart.sha256.slice(0, 12) + (baseBundleReason ? ' · ' + baseBundleReason : ''),
      { values: { dist: distStart, export: exportStart, bundle: bundleStart, sameHash: results.artifacts.sameHash } });
    if (isBase() && results.artifacts.bundleIsBase && distStart.sha256.indexOf(BASE_BUILD) !== 0) {
      record('ART03', 'Artefactos', 'dist fue reconstruido a V2.1 durante la ventana de QA base', 'NOTE',
        'dist actual=' + distStart.sha256.slice(0, 12) + ' · base evaluada=' + bundleStart.sha256.slice(0, 12) + ' (' + path.basename(BUNDLE) + ')');
    }
    if (!isBase() && !results.artifacts.sameHash) issue('high', 'artefacto', 'dist y export no son idénticos', JSON.stringify({ dist: distStart.sha256, export: exportStart.sha256 }));
    const hubText = fs.readFileSync(HUB_INDEX, 'utf8');
    record('ART02', 'Artefactos', 'Enlace del HUB (serums-quest/index.html → dist/index.html)',
      hubText.indexOf('dist/index.html') !== -1 ? 'PASS' : 'FAIL', hubText.indexOf('dist/index.html') !== -1 ? 'target dist/index.html presente' : 'target ausente');
    record('ENV01', 'Entorno', 'Chrome headless, perfil limpio y GPU',
      boot.screen === 'title' && boot.gl.ok ? 'PASS' : 'FAIL',
      results.meta.chrome + ' · ' + results.meta.gpu + ' · DPR ' + boot.dpr + ' · ' + boot.viewport.w + '×' + boot.viewport.h);
    record('V01', 'Versión', 'Título y versión visible',
      /V2\.1|Correcciones/i.test(boot.titleVersion) || /V2/.test(boot.titleVersion) ? 'PASS' : 'FAIL',
      'titleVersion="' + boot.titleVersion + '" · document.title="' + boot.title + '" · V2.version=' + boot.version);
    await s.shot('titulo-version');

    /* ------------------------------------------------ R01 · menú de título */
    const titleMenu = await s.ev("[...document.querySelectorAll('#screen .titleMenuBtn')].map(e => e.getAttribute('data-action'))");
    record('R01', 'Regresión', 'Menú de título completo',
      Array.isArray(titleMenu) && ['open-map', 'open-modes', 'open-wardrobe', 'open-shop', 'open-journal', 'open-settings', 'open-import'].every((a) => titleMenu.indexOf(a) !== -1) ? 'PASS' : 'FAIL',
      JSON.stringify(titleMenu));

    /* ------------------------------------------------ R02 · mapa */
    await s.enterHubFromTitle();
    await s.press('KeyM');
    await s.waitFor("window.__gameState().screen === 'map'", 6000);
    const mapAreas = await s.ev("[...document.querySelectorAll('#screen [data-action=map-area]')].map(e=>e.getAttribute('data-area'))");
    await s.shot('mapa');
    record('R02', 'Regresión', 'Mapa con 5 islas',
      mapAreas && mapAreas.length === 5 ? 'PASS' : 'FAIL', JSON.stringify(mapAreas));
    await s.click('#screen [data-action="map-close"]', 700);
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);

    /* ------------------------------------------------ selector + parpadeo */
    await s.seed(saveHeroes);
    await s.enterHubFromTitle();
    await s.ev("document.querySelector('#hud [data-action=open-heroes]').click()");
    await s.waitFor("window.__gameState().screen === 'heroes'", 6000);
    await sleep(900);
    const heroInfo = await s.ev(`(() => {
      const cards = [...document.querySelectorAll('.v2-hero-card')];
      return { cards: cards.length, names: cards.map(c => (c.querySelector('.v2-hero-name')||{}).textContent||''),
        center: (document.querySelector('.v2-carousel-card.is-center .v2-hero-name')||{}).textContent||'',
        canvas: !!document.querySelector('.v2-hero-canvas'),
        stage: (document.querySelector('.v2-carousel-card.is-center [data-v2-stage]')||{}).clientWidth || 0 };
    })()`);
    await s.shot('selector-heroes');
    const blinkCaptures = [];
    const blinkSeries = {};
    const blinkHeroes = ['ilan', 'mara', 'noa', 'teo', 'lia', 'kian', 'amaru', 'ona', 'iris', 'zenon'];
    for (let i = 0; i < blinkHeroes.length; i++) {
      const heroId = blinkHeroes[i];
      await s.ev(`(() => { const d=document.querySelector('#screen [data-action=v2-hero-goto][data-index="${i}"]'); if(d){d.click();return true;} const n=document.querySelector('#screen [data-action=v2-hero-next]'); for(let k=0;k<12;k++){ if(!n) break; n.click(); } return false; })()`);
      await sleep(650);
      const center = await s.ev("(document.querySelector('.v2-carousel-card.is-center .v2-hero-name')||{}).textContent||''");
      const sampleMs = isBase() ? 900 : 5600;
      const series = await s.ev(`(async () => {
        const canvas = document.querySelector('.v2-hero-canvas');
        if (!canvas) return { error: 'sin canvas', frames: [] };
        const c2 = document.createElement('canvas');
        const w = Math.min(canvas.width, 320), h = Math.min(canvas.height, 480);
        c2.width = w; c2.height = h;
        const ctx = c2.getContext('2d', { willReadFrequently: true });
        const frames = [];
        const started = performance.now();
        const every = 90;
        while (performance.now() - started < ${sampleMs}) {
          try {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(canvas, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h).data;
            let dark = 0, bright = 0, opaque = 0, topDark = 0, midDark = 0;
            const rows = new Array(16).fill(0);
            for (let y = 0; y < h; y += 1) {
              const yy = Math.floor(y / h * 16);
              for (let x = 0; x < w; x += 1) {
                const idx = (y * w + x) * 4;
                const a = img[idx + 3];
                if (a < 100) continue;
                opaque += 1;
                const r = img[idx], g = img[idx + 1], b = img[idx + 2];
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                if (max < 70) { dark += 1; rows[yy] += 1; if (y < h * 0.55) topDark += 1; else if (y < h * 0.75) midDark += 1; }
                else if (max > 200 && min > 170) bright += 1;
              }
            }
            frames.push({ t: Math.round(performance.now() - started), dark, topDark, midDark, bright, opaque, rows: rows.slice(4, 12) });
          } catch (e) { frames.push({ t: Math.round(performance.now() - started), error: String(e) }); }
          await new Promise(r => setTimeout(r, every));
        }
        return { w: w, h: h, canvasW: canvas.width, canvasH: canvas.height, frames };
      })()`, true);
      blinkSeries[heroId] = series;
      // capture 3 angles over the sample window (front/side/back due to autorotation) en primer plano
      const shotA = await s.shotClip('parpadeo-' + heroId + '-a', null, 2);
      await sleep(1200);
      const shotB = await s.shotClip('parpadeo-' + heroId + '-b', null, 2);
      await sleep(1200);
      const shotC = await s.shotClip('parpadeo-' + heroId + '-c', null, 2);
      blinkCaptures.push({ heroId, center, shots: [shotA && s.rel(shotA), shotB && s.rel(shotB), shotC && s.rel(shotC)].filter(Boolean), frames: series.frames ? series.frames.length : 0 });
    }
    // Variante con cosmético de cara (gafas) para los 10 héroes, 3 ángulos.
    const cosmeticShots = [];
    await s.seed(saveHeroesGlasses);
    await s.enterHubFromTitle();
    await s.ev("document.querySelector('#hud [data-action=open-heroes]').click()");
    await s.waitFor("window.__gameState().screen === 'heroes'", 6000);
    await sleep(800);
    for (let i = 0; i < blinkHeroes.length; i++) {
      const heroId = blinkHeroes[i];
      await s.ev(`(() => { const d=document.querySelector('#screen [data-action=v2-hero-goto][data-index="${i}"]'); if(d){d.click();return true;} const n=document.querySelector('#screen [data-action=v2-hero-next]'); for(let k=0;k<12;k++){ if(!n) break; n.click(); } return false; })()`);
      await sleep(750);
      const shots = [];
      for (const suffix of ['a', 'b', 'c']) {
        shots.push(s.rel(await s.shotClip('parpadeo-cosmetico-' + heroId + '-' + suffix, null, 2)));
        await sleep(1000);
      }
      cosmeticShots.push({ heroId, shots: shots.filter(Boolean) });
    }
    // Además, ranura de cabeza (gorro) en los héroes que la admiten.
    await s.seed(saveHeroesHat);
    await s.enterHubFromTitle();
    await s.ev("document.querySelector('#hud [data-action=open-heroes]').click()");
    await s.waitFor("window.__gameState().screen === 'heroes'", 6000);
    await sleep(800);
    const hatShots = [];
    for (const idxHero of [[0, 'ilan'], [3, 'teo'], [9, 'zenon']]) {
      await s.ev(`(() => { const d=document.querySelector('#screen [data-action=v2-hero-goto][data-index="${idxHero[0]}"]'); if(d){d.click();return true;} return false; })()`);
      await sleep(900);
      hatShots.push({ hero: idxHero[1], shot: s.rel(await s.shotClip('parpadeo-ranura-' + idxHero[1], null, 2)) });
    }
    results.captures.blink = { heroes: blinkCaptures, cosmetics: cosmeticShots, hats: hatShots, series: blinkSeries };
    results.captures.counts = Object.assign(results.captures.counts || {}, { blink: blinkCaptures.reduce((n, x) => n + x.shots.length, 0) + cosmeticShots.reduce((n, x) => n + x.shots.length, 0) + hatShots.length });
    // análisis de parpadeo
    const blinkAnalysis = {};
    Object.keys(blinkSeries).forEach((heroId) => {
      const all = (blinkSeries[heroId] && blinkSeries[heroId].frames || []).filter((f) => !f.error && f.dark > 0);
      if (all.length < 4) { blinkAnalysis[heroId] = { detected: false, reason: 'muestras insuficientes', frames: all.length }; return; }
      const seriesOf = (key) => all.map((f) => Number(f[key]) || 0).filter((v) => v > 0).sort((a, b) => a - b);
      const vals = seriesOf('topDark');
      const med = vals.length ? vals[Math.floor(vals.length / 2)] : 0;
      const min = vals.length ? vals[0] : 0;
      const top = all.map((f, i) => ({ i, t: f.t, topDark: f.topDark, ratio: med ? f.topDark / med : 1 }));
      const drops = top.filter((f) => f.ratio < 0.6);
      const darkVals = seriesOf('dark');
      const darkMed = darkVals.length ? darkVals[Math.floor(darkVals.length / 2)] : 0;
      const darkDrops = all.map((f, i) => ({ i, t: f.t, dark: f.dark, ratio: darkMed ? f.dark / darkMed : 1 })).filter((f) => f.ratio < 0.6);
      blinkAnalysis[heroId] = { detected: (drops.length >= 1 && min < med * 0.65) || darkDrops.length >= 1,
        medianTopDark: med, minTopDark: min, drops: drops.slice(0, 8), darkDrops: darkDrops.slice(0, 8),
        frames: all.length, spanMs: all[all.length - 1].t };
    });
    results.captures.blink.analysis = blinkAnalysis;
    const blinkDetected = Object.keys(blinkAnalysis).filter((k) => blinkAnalysis[k].detected);
    const blinkShots = results.captures.counts.blink || 0;
    record('B08a', 'V2.1 · Parpadeo/z-fighting', 'Capturas de los 10 héroes sin/con cosmético y 3 ángulos',
      blinkCaptures.length === 10 && cosmeticShots.length === 10 && blinkShots >= 55 ? 'PASS' : 'FAIL',
      'héroes=' + blinkCaptures.length + ' · con cosmético=' + cosmeticShots.length + ' · capturas=' + blinkShots + ' · hoja de contacto generada al cierre · señal de ojos=' + JSON.stringify(blinkDetected),
      { evidence: [].concat(...blinkCaptures.map((b) => b.shots)).slice(0, 4) });
    if (blinkCaptures.length !== 10 || cosmeticShots.length !== 10 || blinkShots < 55) issue('high', 'qa-harness', 'Faltan capturas de parpadeo de héroes', JSON.stringify({ heroes: blinkCaptures.length, cosmetic: cosmeticShots.length, shots: blinkShots }));
    // La ausencia o presencia de parpadeo se confirma en la revisión visual de la hoja de
    // contacto; el detector de ojos solo aporta una señal auxiliar.
    if (blinkDetected.length) record('B08c', 'V2.1 · Parpadeo/z-fighting', 'Señal auxiliar de parpadeo en el canvas', 'NOTE', 'héroes con caída de píxeles oscuros: ' + JSON.stringify(blinkDetected));
    else record('B08c', 'V2.1 · Parpadeo/z-fighting', 'Señal auxiliar de parpadeo en el canvas', 'NOTE', 'sin caídas fuertes de píxeles oscuros en la muestra');
    await s.ev("document.querySelector('#screen [data-action=close-sheet]').click()");
    await sleep(700);

    /* ------------------------------------------------ ajustes base */
    if (await s.ev("window.__gameState().screen") === 'hub') await s.press('Escape');
    if (await s.ev("window.__gameState().screen") === 'pause') {
      await s.click('#screen [data-action="open-settings"]', 600);
      await s.waitFor("window.__gameState().screen === 'settings'", 5000);
    }
    const settingsInfo = await s.ev(`(() => {
      const root = document.querySelector('#screen');
      const text = root ? String(root.innerText || '') : '';
      const actions = [...new Set([...document.querySelectorAll('[data-action]')].map(e => e.getAttribute('data-action')))];
      const buttons = [...document.querySelectorAll('button, [role="button"], label')].map(e => String(e.innerText || '').trim()).filter(Boolean);
      const settingsKey = (() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)}) || 'null'); } catch (e) { return null; } })();
      const mainKey = (() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null'); } catch (e) { return null; } })();
      return { text: text.slice(0, 6000), actions: actions, buttons: buttons.slice(0, 80),
        hasFeedbackSettings: !!document.querySelector('[data-v2-feedback-settings]'), hasPerfSettings: !!document.querySelector('[data-v2-perf-settings]'),
        lowText: /solo banco original|banco original/i.test(text), eachText: /tras cada|despu[eé]s de cada|cada pregunta/i.test(text),
        endText: /al final/i.test(text), feedbackMode: settingsKey && settingsKey.feedbackMode,
        settingsFeedbackMode: mainKey && mainKey.settings && mainKey.settings.feedbackMode,
        onlyOriginalBank: mainKey && mainKey.settings ? !!mainKey.settings.onlyOriginalBank : null };
    })()`);
    results.v21.features.settingsControls = settingsInfo;
    await s.shot('ajustes');
    record('B03a', 'V2.1 · Ajustes', 'Ajustes exponen «al final / tras cada pregunta» y «solo banco original»',
      v21Status(settingsInfo.eachText || settingsInfo.endText, 'acciones=' + JSON.stringify(settingsInfo.actions.slice(0, 30)) + ' · hasFeedbackSettings=' + settingsInfo.hasFeedbackSettings),
      'acciones=' + JSON.stringify(settingsInfo.actions.slice(0, 30)) + ' · textos: each=' + settingsInfo.eachText + ' end=' + settingsInfo.endText + ' bancoOriginal=' + settingsInfo.lowText + ' hasFeedbackSettings=' + settingsInfo.hasFeedbackSettings + ' hasPerf=' + settingsInfo.hasPerfSettings + ' buttons=' + JSON.stringify(settingsInfo.buttons.filter((b) => /final|cada|banco|original|feedback|resumen/i.test(b)).slice(0, 12)));
    await s.click('#screen [data-action="close-settings"]', 700);
    if (await s.ev("window.__gameState().screen") === 'pause') { await s.click('#screen [data-action="close-pause"]', 600); }
    await s.waitFor("window.__gameState().screen === 'hub'", 6000);

    /* ------------------------------------------------ R03 · modos + práctica */
    await s.press('KeyG');
    await s.waitFor("window.__gameState().screen === 'modes'", 5000);
    const modeCards = await s.ev("[...document.querySelectorAll('#screen .modeCard h2')].map(e=>e.textContent.trim())");
    await s.shot('modos');
    record('R03a', 'Regresión', 'Pantalla de modos',
      Array.isArray(modeCards) && modeCards.length >= 4 ? 'PASS' : 'FAIL', JSON.stringify(modeCards));
    await s.click('#screen [data-action="open-practice"]', 500);
    await s.waitFor("window.__gameState().screen === 'practicePicker'", 5000);
    await s.click('#screen [data-action="start-practice"][data-area="area-psi-salud-publica"]', 1300);
    await s.waitFor("window.__gameState().screen === 'duel'", 7000);
    const practiceQ = await currentQuestion(s);
    const practiceState = await s.state();
    let practiceFeedback = null;
    let practiceAuto = null;
    if (practiceQ) {
      const tAnswer = Date.now();
      await s.click('#screen [data-action="answer"][data-letter="' + practiceQ.answer + '"]', 0);
      await sleep(320);
      practiceFeedback = await feedbackInfo(s);
      const idx0 = await s.ev("window.__gameState().questionIndex");
      let idx1 = idx0; let advanceMs = null;
      while (Date.now() - tAnswer < 2600) {
        await sleep(90);
        idx1 = await s.ev("window.__gameState().questionIndex");
        if (idx1 > idx0) { advanceMs = Date.now() - tAnswer; break; }
      }
      practiceAuto = { idx0, idx1, advanceMs, advanced: idx1 > idx0, overlayStillOpen: !!(await s.has('.v2-feedback[data-v2-feedback]')), screen: await s.ev("window.__gameState().screen") };
      if (practiceFeedback.v2Open || practiceFeedback.legacy) await continueFeedback(s);
    }
    await s.shot('practica-pregunta');
    await pauseAndAbandon(s);
    await s.shot('practica-resultado');
    const practiceResultScreen = await s.ev("(document.querySelector('#screen')||{}).innerText||''");
    await resultContinue(s);
    if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
    await s.waitFor("window.__gameState().screen === 'hub'", 6000);
    record('R03b', 'Regresión', 'Práctica libre: sesión, respuesta y cierre',
      practiceState && practiceState.mode === 'practice' ? 'PASS' : 'FAIL',
      'mode=' + (practiceState && practiceState.mode) + ' total=' + (practiceState && practiceState.questionTotal));
    results.v21.feedbackFlow = { practiceFeedback, practiceAuto, resultText: String(practiceResultScreen).slice(0, 2600) };
    const practiceAdvanceOk = !!(practiceAuto && practiceAuto.advanced && practiceAuto.advanceMs != null && practiceAuto.advanceMs >= 450 && practiceAuto.advanceMs <= 1700);
    const endDefaultOk = isBase()
      ? (practiceFeedback && (practiceFeedback.v2Open || practiceFeedback.legacy))
      : (practiceFeedback && !practiceFeedback.v2Open && !practiceFeedback.legacy && practiceAdvanceOk);
    record('B01', 'V2.1 · Feedback', isBase() ? 'Comportamiento base del feedback por defecto' : 'Feedback por defecto al final: sin overlay entre preguntas y auto-avance ~900 ms',
      isBase() ? (practiceFeedback && (practiceFeedback.v2Open || practiceFeedback.legacy) ? 'NOTE' : 'FAIL') : v21Status(endDefaultOk, JSON.stringify(practiceAuto)),
      'feedback=' + JSON.stringify({ v2Open: practiceFeedback && practiceFeedback.v2Open, legacy: practiceFeedback && practiceFeedback.legacy, feedbackOpen: practiceFeedback && practiceFeedback.feedbackOpen, kind: practiceFeedback && practiceFeedback.kind }) + ' · auto=' + JSON.stringify(practiceAuto) + ' · settings.feedbackMode=' + JSON.stringify(results.v21.features.settingsFeedbackMode));
    if (!isBase() && !endDefaultOk) issue('high', 'v21', 'El feedback por defecto no se comporta «al final» (overlay o sin auto-avance)', JSON.stringify({ practiceFeedback, practiceAuto }).slice(0, 1200));

    /* ------------------------------------------------ R03c · los 4 modos abren y cierran */
    await s.seed(withSettings(saveFull));
    await s.enterHubFromTitle();
    await s.press('KeyG');
    await s.waitFor("window.__gameState().screen === 'modes'", 5000);
    const modeSmoke = [];
    async function backToModes() {
      if (await s.ev("window.__gameState().screen === 'result'")) { await resultContinue(s); await sleep(500); }
      if (await s.ev("window.__gameState().screen === 'modes'")) return true;
      if (await s.ev("window.__gameState().screen === 'hub'")) { await s.press('KeyG'); await s.waitFor("window.__gameState().screen === 'modes'", 5000); }
      return await s.ev("window.__gameState().screen === 'modes'");
    }
    async function tryMode(mode, selector) {
      const present = await s.has(selector);
      if (!present) { modeSmoke.push({ mode, ok: false, why: 'sin botón' }); return; }
      const disabled = await s.ev("(() => { const b=document.querySelector(" + JSON.stringify(selector) + "); return !!b.disabled; })()");
      if (disabled) { modeSmoke.push({ mode, ok: false, why: 'deshabilitado' }); return; }
      await s.click(selector, 1300);
      const started = await s.waitFor("window.__gameState().screen === 'duel'", 7000);
      const st = await s.state();
      const snap = await s.shot('modo-' + mode);
      modeSmoke.push({ mode, ok: !!started && st && st.mode === mode, state: st && st.mode, total: st && st.questionTotal, shot: s.rel(snap) });
      if (started) {
        await pauseAndAbandon(s);
        await resultContinue(s);
      }
      await backToModes();
    }
    await tryMode('daily', '#screen [data-action="start-mode"][data-mode="daily"]');
    await tryMode('survival', '#screen [data-action="start-mode"][data-mode="survival"]');
    await tryMode('timed', '#screen [data-action="start-mode"][data-mode="timed"][data-seconds="180"]');
    await tryMode('simulacro', '#screen [data-action="start-mode"][data-mode="simulacro"]');
    record('R03c', 'Regresión', 'Los 4 modos abren una sesión y se cierran sin error',
      modeSmoke.length === 4 && modeSmoke.every((m) => m.ok) ? 'PASS' : 'FAIL',
      JSON.stringify(modeSmoke));
    if (!modeSmoke.every((m) => m.ok)) issue('high', 'regresion', 'Algún modo no abre o no cierra', JSON.stringify(modeSmoke));
    await s.seed(withSettings(emptySave));
    await s.enterHubFromTitle();

    /* ------------------------------------------------ B02 · resumen de nivel */
    await s.seed(saveMission);
    await s.enterHubFromTitle();
    await openJournalMission(s, 'area-psi-salud-publica', 'mission-sp-1');
    const missionStart = await s.state();
    const q1 = await currentQuestion(s);
    if (!q1) throw new Error('Sin pregunta de misión');
    const missionQMeta = [];
    const missionChip = async () => s.ev("(() => { const c=document.querySelector('#screen .chip--generated'); return c?String(c.textContent||'').trim():null; })()");
    missionQMeta.push({ id: q1.id, source: q1.source, generated: !!q1.generated, chip: await missionChip() });
    await s.press('Escape');
    const paused = await s.waitFor("window.__gameState().screen === 'pause'", 4000);
    await s.click('#screen [data-action="close-pause"]', 500);
    const resumed = await s.waitFor("window.__gameState().screen === 'duel'", 4000);
    record('R05', 'Regresión', 'Pausa en duelo y reanudación',
      paused && resumed ? 'PASS' : 'FAIL', 'pausa=' + paused + ' reanuda=' + resumed + ' índice=' + (await s.state()).questionIndex);
    // Primera respuesta correcta y segunda fallada: así el resumen debe poner el error
    // (segundo en el tiempo) primero si el orden «errores primero» funciona.
    const wrong = (q1.options || []).map((o) => o.id).find((x) => x !== q1.answer);
    await s.click('#screen [data-action="answer"][data-letter="' + q1.answer + '"]', 0);
    const missionT0 = Date.now();
    await sleep(320);
    const fbWrong = await feedbackInfo(s);
    const missionIdx0 = await s.ev("window.__gameState().questionIndex");
    let missionIdx1 = missionIdx0; let missionAdvanceMs = null;
    while (Date.now() - missionT0 < 2600) {
      await sleep(90);
      missionIdx1 = await s.ev("window.__gameState().questionIndex");
      if (missionIdx1 > missionIdx0) { missionAdvanceMs = Date.now() - missionT0; break; }
    }
    const missionAuto = { idx0: missionIdx0, idx1: missionIdx1, advanceMs: missionAdvanceMs, advanced: missionIdx1 > missionIdx0,
      overlayAfter: !!(await s.has('.v2-feedback[data-v2-feedback]')), screen: await s.ev("window.__gameState().screen") };
    if (fbWrong.v2Open || fbWrong.legacy) await continueFeedback(s);
    const missionEndOk = !fbWrong.v2Open && !fbWrong.legacy && missionAuto.advanced && missionAuto.advanceMs != null && missionAuto.advanceMs >= 450 && missionAuto.advanceMs <= 1700;
    record('B01b', 'V2.1 · Feedback', isBase() ? 'Comportamiento base del feedback en campaña' : 'Campaña: feedback al final sin overlay y con auto-avance',
      isBase() ? (fbWrong.v2Open || fbWrong.legacy ? 'NOTE' : 'FAIL') : v21Status(missionEndOk, JSON.stringify(missionAuto)),
      'feedback=' + JSON.stringify({ v2Open: fbWrong.v2Open, legacy: fbWrong.legacy, kind: fbWrong.kind }) + ' · auto=' + JSON.stringify(missionAuto));
    if (!isBase() && !missionEndOk) issue('high', 'v21', 'La campaña no aplica el feedback «al final» (overlay o sin auto-avance)', JSON.stringify({ fbWrong, missionAuto }).slice(0, 1200));
    for (let i = 1; i < 5; i++) {
      await s.waitFor("window.__gameState().questionIndex === " + i + " || window.__gameState().screen === 'result'", 6000);
      if (await s.ev("window.__gameState().screen === 'result'")) break;
      const q = await currentQuestion(s);
      if (!q) break;
      missionQMeta.push({ id: q.id, source: q.source, generated: !!q.generated, chip: await missionChip() });
      const letter = i === 1 ? (q.options || []).map((o) => o.id).find((x) => x !== q.answer) : q.answer;
      await answerAndWait(s, letter, 300);
      const fb = await feedbackInfo(s);
      if (fb.v2Open || fb.legacy) await continueFeedback(s);
      else await sleep(1100);
    }
    await s.waitFor("window.__gameState().screen === 'result'", 7000);
    await sleep(600);
    const missionResult = await s.state();
    const missionSave = await s.readSave();
    await s.shot('resumen-mision');
    const summaryDom = await s.ev(`(() => {
      const root = document.querySelector('[data-v2-summary]') || document.querySelector('#screen .v2-summary');
      const items = root ? [...root.querySelectorAll('[data-v2-summary-item]')] : [];
      const filters = root ? [...root.querySelectorAll('[data-action="v2-summary-filter"]')].map(e => ({ filter: e.getAttribute('data-filter'), text: String(e.innerText || '').trim().slice(0, 60), pressed: e.getAttribute('aria-pressed') })) : [];
      const statuses = items.map(e => ({ id: e.getAttribute('data-question'), cls: String(e.className || ''), text: String((e.querySelector('.v2-summary__status') || {}).innerText || '').trim().slice(0, 60) }));
      const generated = items.filter(e => /generad[ao]/i.test(String(e.innerText || ''))).length;
      const difficult = root ? [...root.querySelectorAll('[data-action="v2-summary-difficult"]')].length : 0;
      const flashcards = root ? [...root.querySelectorAll('[data-action="v2-summary-flashcard"]')].length : 0;
      const screenText = String((document.querySelector('#screen') || {}).innerText || '');
      return { hasSummary: !!root, items: items.length, statuses: statuses, generated: generated, filters: filters, difficult: difficult, flashcards: flashcards,
        orderText: screenText.slice(0, 5200), actions: [...new Set([...document.querySelectorAll('#screen [data-action]')].map(e => e.getAttribute('data-action')))] };
    })()`);
    let summaryFilter = null, summaryDifficult = null, summaryFlashcard = null;
    if (summaryDom.hasSummary) {
      if (await s.has('[data-action="v2-summary-filter"][data-filter="wrong"]')) {
        await s.click('[data-action="v2-summary-filter"][data-filter="wrong"]', 500);
        summaryFilter = await s.ev(`(() => {
          const root = document.querySelector('[data-v2-summary]');
          const items = root ? [...root.querySelectorAll('[data-v2-summary-item]')] : [];
          return { visible: items.filter(e => e.offsetParent !== null || getComputedStyle(e).display !== 'none').length,
            wrong: items.filter(e => /is-wrong/.test(e.className) && !/is-correct/.test(e.className)).length,
            pressedWrong: (document.querySelector('[data-action="v2-summary-filter"][data-filter="wrong"]') || {}).getAttribute('aria-pressed'),
            emptyText: String((root && root.querySelector('.v2-summary__empty') || {}).innerText || '').slice(0, 140) };
        })()`);
        await s.shot('resumen-filtro-errores');
        if (await s.has('[data-action="v2-summary-filter"][data-filter="all"]')) await s.click('[data-action="v2-summary-filter"][data-filter="all"]', 400);
      }
      if (await s.has('[data-action="v2-summary-difficult"]')) {
        const beforeLabel = await s.ev("(document.querySelector('[data-action=\"v2-summary-difficult\"] [data-v2-summary-difficult-label]')||{}).innerText||''");
        await s.click('[data-action="v2-summary-difficult"]', 500);
        const afterLabel = await s.ev("(document.querySelector('[data-action=\"v2-summary-difficult\"] [data-v2-summary-difficult-label]')||{}).innerText||''");
        summaryDifficult = { before: beforeLabel, after: afterLabel, toggled: beforeLabel !== afterLabel || /dif/i.test(afterLabel) };
        await s.shot('resumen-dificil');
      }
      if (await s.has('[data-action="v2-summary-flashcard"]')) {
        await s.click('[data-action="v2-summary-flashcard"]', 700);
        const flashOpen = await s.waitFor("!!document.querySelector('.v2-summary-flash, [data-v2-summary-flash], .v2-flashcard, [data-v2-flashcard]')", 4000);
        summaryFlashcard = { open: flashOpen, text: await s.ev("(document.querySelector('.v2-summary-flash, [data-v2-summary-flash], .v2-flashcard, [data-v2-flashcard]')||{}).innerText ? String((document.querySelector('.v2-summary-flash, [data-v2-summary-flash], .v2-flashcard, [data-v2-flashcard]')).innerText).slice(0,220) : ''") };
        summaryFlashcard.closeAction = await s.ev("!!document.querySelector('[data-action=v2-summary-flash-close], [data-action=v2-flashcard-close]')");
        await s.shot('resumen-flashcard');
        if (flashOpen) await s.clickIf('[data-action="v2-summary-flash-close"], [data-action="v2-flashcard-close"]', 500);
      }
    }
    // Resumen a 960×540 y 390×844
    const summaryViewports = {};
    for (const [sw, sh] of [[960, 540], [390, 844]]) {
      await s.setViewport(sw, sh);
      await sleep(500);
      const layout = await s.ev(`(() => {
        const root = document.querySelector('[data-v2-summary]');
        const filters = root ? [...root.querySelectorAll('[data-action=v2-summary-filter]')] : [];
        const items = root ? [...root.querySelectorAll('[data-v2-summary-item]')] : [];
        const r = root ? root.getBoundingClientRect() : null;
        return { innerW: innerWidth, innerH: innerHeight,
          scrollW: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          summary: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
          items: items.length, filters: filters.length,
          filtersVisible: filters.filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.right <= innerWidth + 2; }).length,
          overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth };
      })()`);
      layout.shot = s.rel(await s.shot('resumen-' + sw + 'x' + sh));
      summaryViewports[sw + 'x' + sh] = layout;
    }
    await s.setViewport(WIDTH, HEIGHT);
    await sleep(400);
    results.v21.summaryViewports = summaryViewports;
    const summaryViewportOk = Object.keys(summaryViewports).length === 2 && Object.keys(summaryViewports).every((k) => summaryViewports[k].summary && summaryViewports[k].items >= 5 && summaryViewports[k].overflow <= 1 && summaryViewports[k].filtersVisible >= 2);
    const summaryCounts = summaryDom;
    results.v21.summary = { dom: summaryDom, filter: summaryFilter, difficult: summaryDifficult, flashcard: summaryFlashcard, viewports: summaryViewports };
    const summaryPresent = isBase() ? false : !!(results.v21.features.summaryApi && summaryDom.hasSummary);
    const summaryOrderOk = summaryDom.statuses.length >= 2 && /is-wrong/.test(summaryDom.statuses[0].cls);
    const summaryFiltersOk = !summaryFilter || (summaryFilter.visible <= summaryFilter.wrong && summaryFilter.wrong >= 1);
    const summaryOk = summaryPresent && summaryOrderOk && summaryDom.items >= 5 && summaryDom.filters.length >= 2 && summaryDom.difficult >= 1 && summaryDom.flashcards >= 1 && (summaryFlashcard && summaryFlashcard.open) && summaryFiltersOk && summaryViewportOk;
    record('B02', 'V2.1 · Resumen', isBase() ? 'Resumen base del nivel (sin filtros V2.1)' : 'Resumen de nivel con errores primero, filtros, difícil, flashcard y vistas 960/390',
      isBase() ? 'NOTE' : v21Status(summaryOk, 'summary=' + JSON.stringify({ present: summaryPresent, order: summaryOrderOk, items: summaryDom.items, generated: summaryDom.generated, filters: summaryDom.filters.length, difficult: summaryDom.difficult, flashcards: summaryDom.flashcards, flashOpen: summaryFlashcard && summaryFlashcard.open, viewports: summaryViewportOk })),
      'api=' + JSON.stringify(results.v21.features.summaryApi) + ' · items=' + summaryDom.items + ' · first=' + JSON.stringify(summaryDom.statuses[0] || null) + ' · filtros=' + JSON.stringify(summaryDom.filters) + ' · difficult=' + JSON.stringify(summaryDifficult) + ' · flashcard=' + JSON.stringify(summaryFlashcard) + ' · filter=' + JSON.stringify(summaryFilter));
    if (!isBase() && !summaryOk) issue('high', 'v21', 'El resumen V2.1 no cumple errores primero/filtros/difícil/flashcard', JSON.stringify(results.v21.summary).slice(0, 1800));
    const missionGenerated = missionQMeta.filter((m) => m.generated);
    const missionLabelsOk = missionGenerated.length === 0 || missionGenerated.every((m) => /generad/i.test(m.chip || ''));
    record('B05b', 'V2.1 · Generadas', 'Etiqueta de generadas dentro de la misión de campaña',
      isBase() ? 'NOTE' : (missionGenerated.length ? v21Status(missionLabelsOk, JSON.stringify(missionGenerated)) : 'NOTE'),
      'preguntas=' + JSON.stringify(missionQMeta) + (missionGenerated.length ? '' : ' · la misión no incluyó preguntas generadas'));
    if (!isBase() && missionGenerated.length && !missionLabelsOk) issue('high', 'v21', 'La misión no etiqueta sus preguntas generadas', JSON.stringify(missionQMeta).slice(0, 1200));
    // regresión campaña
    const missionRec = missionSave && missionSave.missions ? missionSave.missions['mission-sp-1'] : null;
    record('R04', 'Regresión', 'Campaña: misión de 5 preguntas, feedback y resultado',
      missionResult && missionResult.lastResultPass === true && missionRec && missionRec.completedAt ? 'PASS' : 'FAIL',
      'questionTotal=' + (missionStart && missionStart.questionTotal) + ' · feedback=' + fbWrong.kind + ' · pass=' + (missionResult && missionResult.lastResultPass) + ' · score=' + (missionResult && missionResult.score) + ' · mission=' + JSON.stringify(missionRec));
    await s.reload();
    const missionPersist = await s.readSave();
    record('R06', 'Persistencia', 'Misión de campaña persiste tras recargar',
      missionPersist && missionPersist.missions && missionPersist.missions['mission-sp-1'] && missionPersist.missions['mission-sp-1'].completedAt ? 'PASS' : 'FAIL',
      'missions=' + Object.keys(missionPersist && missionPersist.missions || {}).length + ' xp=' + (missionPersist && missionPersist.xp));
    await s.enterHubFromTitle();

    /* ------------------------------------------------ B03b · opción «tras cada pregunta» */
    if (!isBase()) {
      await openSettingsFromHub(s);
      const eachPresent = await s.has('[data-action="v2-feedback-mode"][data-mode="each"]');
      const eachClick = eachPresent ? { clicked: true, action: 'v2-feedback-mode', mode: 'each' } : await clickByText(s, '#screen', 'tras cada|cada pregunta|despu[eé]s de cada', 1);
      if (eachPresent) await s.click('[data-action="v2-feedback-mode"][data-mode="each"]', 500);
      await sleep(700);
      const settingsAfterEach = await s.readSettingsKey();
      const saveAfterEach = await s.readSave();
      const feedbackModeAfter = (settingsAfterEach && settingsAfterEach.feedbackMode) || (saveAfterEach && saveAfterEach.settings && saveAfterEach.settings.feedbackMode);
      await s.click('#screen [data-action="close-settings"]', 600);
      if (await s.ev("window.__gameState().screen") === 'pause') await s.click('#screen [data-action="close-pause"]', 600);
      await s.waitFor("window.__gameState().screen === 'hub'", 6000);
      await s.reload();
      const persistedEach = await s.readSettingsKey();
      const feedbackModePersisted = persistedEach && persistedEach.feedbackMode;
      await s.enterHubFromTitle();
      let eachFlow = null;
      if (feedbackModeAfter === 'each') {
        await s.press('KeyG'); await s.waitFor("window.__gameState().screen === 'modes'", 5000);
        await s.click('#screen [data-action="open-practice"]', 400);
        await s.waitFor("window.__gameState().screen === 'practicePicker'", 5000);
        await s.click('#screen [data-action="start-practice"][data-area="area-psi-salud-publica"]', 1200);
        await s.waitFor("window.__gameState().screen === 'duel'", 7000);
        const qq = await currentQuestion(s);
        if (qq) {
          await answerAndWait(s, qq.answer, 600);
          const fb = await feedbackInfo(s);
          const i0 = await s.ev("window.__gameState().questionIndex");
          await sleep(2200);
          const i1 = await s.ev("window.__gameState().questionIndex");
          eachFlow = { fb, i0, i1, overlay: !!(fb.v2Open || fb.legacy), advanced: i1 > i0 };
          if (eachFlow.overlay) await continueFeedback(s);
        }
        await pauseAndAbandon(s); await resultContinue(s);
        if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
        await s.waitFor("window.__gameState().screen === 'hub'", 5000);
      }
      const eachOk = feedbackModeAfter === 'each' && feedbackModePersisted === 'each' && eachFlow && eachFlow.overlay && !eachFlow.advanced;
      record('B03b', 'V2.1 · Feedback', 'Opción «tras cada pregunta»: persiste, abre overlay y desactiva el auto-avance',
        v21Status(eachOk, JSON.stringify({ feedbackModeAfter, feedbackModePersisted, eachFlow }).slice(0, 1200)),
        'click=' + JSON.stringify(eachClick) + ' · mode=' + feedbackModeAfter + ' · tras recarga=' + feedbackModePersisted + ' · flow=' + JSON.stringify(eachFlow));
      if (!eachOk) issue('high', 'v21', 'La opción «tras cada pregunta» no funciona o no persiste', JSON.stringify({ eachClick, feedbackModeAfter, feedbackModePersisted, eachFlow }).slice(0, 1200));
      // restaurar modo end
      await s.seed(saveHeroes);
      await s.enterHubFromTitle(); await openSettingsFromHub(s);
      if (await s.has('[data-action="v2-feedback-mode"][data-mode="end"]')) await s.click('[data-action="v2-feedback-mode"][data-mode="end"]', 500);
      else await clickByText(s, '#screen', 'al final', 1);
      await s.click('#screen [data-action="close-settings"]', 500);
      if (await s.ev("window.__gameState().screen") === 'pause') await s.click('#screen [data-action="close-pause"]', 500);
      await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    } else {
      record('B03b', 'V2.1 · Feedback', 'Opción «tras cada pregunta»', 'NOTE', 'Función V2.1 no integrada en el build base');
    }

    /* ------------------------------------------------ B04 · solo banco original */
    if (!isBase()) {
      await s.seed(saveGenerated);
      await s.enterHubFromTitle();
      await openSettingsFromHub(s);
      const bankPresent = await s.has('[data-action="v2-perf-original-bank"]');
      const bankClick = bankPresent ? { clicked: true, action: 'v2-perf-original-bank' } : await clickByText(s, '#screen', 'banco original|solo banco|original', 1);
      if (bankPresent) await s.click('[data-action="v2-perf-original-bank"]', 600);
      await sleep(600);
      const bankSave = await s.readSave();
      const bankSettingsKey = await s.readSettingsKey();
      const bankMode = (bankSettingsKey && typeof bankSettingsKey.onlyOriginalBank === 'boolean') ? bankSettingsKey.onlyOriginalBank
        : (bankSave && bankSave.settings ? bankSave.settings.onlyOriginalBank : null);
      await s.click('#screen [data-action="close-settings"]', 500);
      if (await s.ev("window.__gameState().screen") === 'pause') await s.click('#screen [data-action="close-pause"]', 500);
      await s.waitFor("window.__gameState().screen === 'hub'", 6000);
      await s.reload();
      const bankPersistedKey = await s.readSettingsKey();
      const bankModePersisted = bankPersistedKey && typeof bankPersistedKey.onlyOriginalBank === 'boolean' ? bankPersistedKey.onlyOriginalBank : null;
      await s.enterHubFromTitle();
      await s.press('KeyG'); await s.waitFor("window.__gameState().screen === 'modes'", 5000);
      await s.click('#screen [data-action="open-practice"]', 400);
      await s.waitFor("window.__gameState().screen === 'practicePicker'", 5000);
      await s.click('#screen [data-action="start-practice"][data-area="area-psi-salud-publica"]', 1200);
      await s.waitFor("window.__gameState().screen === 'duel'", 7000);
      const bankQs = [];
      for (let i = 0; i < 6; i++) {
        const q = await currentQuestion(s);
        if (!q) break;
        bankQs.push({ id: q.id, source: q.source, generated: q.generated });
        await answerAndWait(s, q.answer, 300);
        const fb = await feedbackInfo(s);
        if (fb.v2Open || fb.legacy) await continueFeedback(s); else await sleep(1000);
        if (await s.ev("window.__gameState().screen === 'result'")) break;
      }
      await pauseAndAbandon(s); await resultContinue(s);
      if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
      await s.waitFor("window.__gameState().screen === 'hub'", 5000);
      const bankOk = bankMode === true && bankModePersisted === true && bankQs.length > 0 && bankQs.every((q) => q.source === 'campaign');
      record('B04', 'V2.1 · Banco', '«Solo banco original» persiste y filtra la sesión',
        v21Status(bankOk, JSON.stringify(bankQs)),
        'click=' + JSON.stringify(bankClick) + ' · setting=' + bankMode + ' · tras recarga=' + bankModePersisted + ' · preguntas=' + JSON.stringify(bankQs));
      if (!bankOk) issue('high', 'v21', '«Solo banco original» no persiste o no filtra la sesión', JSON.stringify({ bankClick, bankMode, bankModePersisted, bankQs }).slice(0, 1200));
    } else {
      record('B04', 'V2.1 · Banco', '«Solo banco original» filtra las preguntas de la sesión', 'NOTE', 'Función V2.1 no integrada en el build base');
    }

    /* ------------------------------------------------ B05 · etiqueta de generadas */
    await s.seed(saveGenerated);
    await s.enterHubFromTitle();
    await s.press('KeyG'); await s.waitFor("window.__gameState().screen === 'modes'", 5000);
    await s.click('#screen [data-action="open-practice"]', 400);
    await s.waitFor("window.__gameState().screen === 'practicePicker'", 5000);
    await s.click('#screen [data-action="start-practice"][data-area="area-psi-salud-publica"]', 1200);
    await s.waitFor("window.__gameState().screen === 'duel'", 7000);
    let generatedEvidence = null;
    for (let i = 0; i < 8; i++) {
      const q = await currentQuestion(s);
      if (!q) break;
      if (q.generated) {
        generatedEvidence = await s.ev(`(() => {
          const chip = document.querySelector('#screen .chip--generated, #screen [data-generated-label]');
          const root = document.querySelector('#screen');
          const text = root ? String(root.innerText || '') : '';
          return { id: ${JSON.stringify(q.id)}, source: ${JSON.stringify(q.source)}, generated: true,
            chip: chip ? String(chip.textContent || '').trim() : null, chips: [...document.querySelectorAll('#screen .chip')].map(e=>String(e.textContent||'').trim()),
            screenHasGenerada: /generad[ao]/i.test(text), text: text.slice(0, 900) };
        })()`);
        await s.shot('etiqueta-generada');
        break;
      }
      await answerAndWait(s, q.answer, 250);
      const fb = await feedbackInfo(s);
      if (fb.v2Open || fb.legacy) await continueFeedback(s); else await sleep(1000);
      if (await s.ev("window.__gameState().screen === 'result'")) break;
    }
    await pauseAndAbandon(s).catch(() => {}); await resultContinue(s).catch(() => {});
    if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    const generatedOk = !!(generatedEvidence && (/generad/i.test(generatedEvidence.chip || '') || generatedEvidence.screenHasGenerada));
    record('B05', 'V2.1 · Generadas', 'Las preguntas generadas llevan etiqueta visible',
      v21Status(generatedOk, JSON.stringify(generatedEvidence)),
      JSON.stringify(generatedEvidence));
    if (!generatedOk) issue(isBase() ? 'medium' : 'high', 'v21', 'No se encontró la etiqueta de pregunta generada', JSON.stringify({ generatedEvidence }).slice(0, 1000));

    /* ------------------------------------------------ B06 · restauración no retrocede */
    // Fixture low: sin restauración; fixture mastery: alta; luego degradar el cálculo
    // conservando state.v2.world.restored y recargar: el nivel visible no debe bajar.
    await s.seed(withSettings(lowSave));
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1200);
    const restoreLowFixture = await worldStats(s);
    const restoreLowFixtureShot = await s.shot('restauracion-fixture-low');
    const lowFixtureLevels = restoreLowFixture && restoreLowFixture.restoration ? restoreLowFixture.restoration.levels : null;
    record('B06a', 'V2.1 · Restauración', 'Fixture low: restauración en cero',
      v21Status(!!lowFixtureLevels && Object.keys(lowFixtureLevels).every((k) => (lowFixtureLevels[k] || 0) === 0), JSON.stringify(lowFixtureLevels)),
      'levels=' + JSON.stringify(lowFixtureLevels) + ' · captura=' + s.rel(restoreLowFixtureShot));
    await s.seed(saveRestoreHigh);
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1500);
    const restoreHigh = await worldStats(s);
    const restoreHighShot = await s.shot('restauracion-alta');
    const highLevels = restoreHigh && restoreHigh.restoration ? restoreHigh.restoration.levels : null;
    const savedAfterHigh = await s.readSave();
    const decayed = JSON.parse(JSON.stringify(savedAfterHigh || saveRestoreHigh));
    decayed.v2 = decayed.v2 || {};
    decayed.v2.world = decayed.v2.world || {};
    decayed.v2.world.restored = (savedAfterHigh && savedAfterHigh.v2 && savedAfterHigh.v2.world && savedAfterHigh.v2.world.restored) || saveRestoreHigh.v2.world.restored;
    decayed.v2.world.stations = {};
    decayed.v2.world.chests = {}; decayed.v2.world.guides = {}; decayed.v2.world.fragments = {}; decayed.v2.world.visited = {};
    await s.ev(`localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(JSON.stringify(decayed))})`);
    await s.reload();
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1500);
    const restoreLow = await worldStats(s);
    const restoreLowShot = await s.shot('restauracion-tras-degradar-calculo');
    const lowLevels = restoreLow && restoreLow.restoration ? restoreLow.restoration.levels : null;
    const restoreOk = highLevels && lowLevels && Object.keys(highLevels).every((k) => (lowLevels[k] || 0) >= (highLevels[k] || 0));
    const restoredSaved = savedAfterHigh && savedAfterHigh.v2 && savedAfterHigh.v2.world ? savedAfterHigh.v2.world.restored : null;
    record('B06', 'V2.1 · Restauración', 'La restauración no retrocede al degradarse el cálculo (se conserva el máximo)',
      v21Status(restoreOk, 'alto=' + JSON.stringify(highLevels) + ' · tras degradar=' + JSON.stringify(lowLevels)),
      'restored=' + JSON.stringify(restoredSaved) + ' · alto=' + JSON.stringify(highLevels) + ' → tras degradar cálculo=' + JSON.stringify(lowLevels) + ' · capturas=' + s.rel(restoreHighShot) + ', ' + s.rel(restoreLowShot),
      { evidence: [s.rel(restoreHighShot), s.rel(restoreLowShot)] });
    if (!isBase() && !restoreOk) issue('high', 'v21', 'La restauración retrocede al degradarse el cálculo', JSON.stringify({ highLevels, lowLevels, restoredSaved }).slice(0, 900));
    results.v21.restoration = { highLevels, lowLevels, restoredSaved, ok: !!restoreOk };

    /* ------------------------------------------------ R06b · repaso */
    await s.seed(dueSave);
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(800);
    const dueBefore = await s.state();
    await s.click('#hud [data-action="open-review"]', 700);
    const reviewScreen = await s.waitFor("window.__gameState().screen === 'review'", 6000);
    const reviewText = await s.ev("(document.querySelector('#screen')||{}).innerText||''");
    await s.shot('repaso');
    if (reviewScreen) {
      const dueBtnSel = '#screen [data-action="start-review"][data-mode="due"]';
      if (await s.has(dueBtnSel)) await s.click(dueBtnSel, 1100);
      else await s.click('#screen [data-action="start-review"]', 1100);
      await s.waitFor("window.__gameState().screen === 'duel'", 7000);
      let reviewSteps = 0;
      while (reviewSteps < 8) {
        reviewSteps += 1;
        if (await s.ev("window.__gameState().screen === 'result'")) break;
        const q = await currentQuestion(s);
        if (!q) break;
        await answerAndWait(s, q.answer, 250);
        const fb = await feedbackInfo(s);
        if (fb.v2Open || fb.legacy) await continueFeedback(s); else await sleep(1000);
      }
      await s.waitFor("window.__gameState().screen === 'result'", 7000);
      await sleep(400);
      await s.shot('repaso-resultado');
      await resultContinue(s);
      if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
      await s.waitFor("window.__gameState().screen === 'hub'", 6000);
      await sleep(1200);
      const dueAfter = await s.state();
      record('R06', 'Regresión', 'Repaso: sesión de errores vencidos y resultado',
        reviewScreen && dueAfter && dueBefore && (dueAfter.dueReviews <= dueBefore.dueReviews) ? 'PASS' : 'FAIL',
        'review=' + reviewScreen + ' · due ' + (dueBefore && dueBefore.dueReviews) + '→' + (dueAfter && dueAfter.dueReviews) + ' · text=' + String(reviewText).slice(0, 180));
    } else {
      record('R06', 'Regresión', 'Repaso: sesión de errores vencidos y resultado', 'FAIL', 'No abrió la pantalla de repaso');
    }

    /* ------------------------------------------------ R07-R09 · tienda/inventario */
    await s.seed(saveShop);
    await s.enterHubFromTitle();
    await s.click('#hud [data-action="open-shop"]', 600);
    await s.waitFor("window.__gameState().screen === 'shop'", 5000);
    const shopBefore = await s.readSave();
    await s.shot('tienda');
    await s.click('#screen [data-action="shop-item"][data-id="c-cabeza-gorro"]', 350);
    await s.click('#screen [data-action="shop-buy"][data-id="c-cabeza-gorro"]', 350);
    const confirmShown = await s.has('#screen [data-action="shop-confirm"][data-id="c-cabeza-gorro"]');
    await s.click('#screen [data-action="shop-confirm"][data-id="c-cabeza-gorro"]', 600);
    const shopAfter = await s.readSave();
    record('R07', 'Regresión', 'Tienda: compra de cosmético con confirmación',
      confirmShown && shopAfter.coins === shopBefore.coins - 90 && shopAfter.collection.ownedCosmeticIds.indexOf('c-cabeza-gorro') !== -1 ? 'PASS' : 'FAIL',
      'coins ' + shopBefore.coins + '→' + shopAfter.coins + ' · gorro=' + (shopAfter.collection.ownedCosmeticIds.indexOf('c-cabeza-gorro') !== -1));
    await s.click('#screen [data-action="open-wardrobe"]', 700);
    await s.waitFor("window.__gameState().screen === 'wardrobe'", 5000);
    await s.shot('inventario');
    if (!(await s.has('#screen [data-action="wardrobe-item"][data-id="c-cabeza-gorro"]'))) {
      if (await s.has('#screen [data-action="wardrobe-slot"][data-slot="cabeza"]')) await s.click('#screen [data-action="wardrobe-slot"][data-slot="cabeza"]', 350);
    }
    await s.click('#screen [data-action="wardrobe-item"][data-id="c-cabeza-gorro"]', 400);
    await s.click('#screen [data-action="wardrobe-save"]', 600);
    const wardrobeSave = await s.readSave();
    const equipped = wardrobeSave && wardrobeSave.collection && wardrobeSave.collection.equipped && wardrobeSave.collection.equipped[wardrobeSave.collection.selectedCharacterId || 'noa'];
    record('R08', 'Regresión', 'Inventario: equipar y guardar atuendo',
      !!(equipped && equipped.cabeza === 'c-cabeza-gorro') ? 'PASS' : 'FAIL', 'equipped=' + JSON.stringify(equipped || null));
    await s.reload();
    const shopPersist = await s.readSave();
    const shopEquipped = shopPersist && shopPersist.collection && shopPersist.collection.equipped ? shopPersist.collection.equipped[shopPersist.collection.selectedCharacterId || 'noa'] : null;
    record('R09', 'Persistencia', 'Compra y atuendo persisten tras recargar',
      shopPersist.coins === shopAfter.coins && !!(shopEquipped && shopEquipped.cabeza === 'c-cabeza-gorro') ? 'PASS' : 'FAIL',
      'coins=' + shopPersist.coins + ' equipped=' + JSON.stringify(shopPersist.collection.equipped));

    /* ------------------------------------------------ R10 · selector (10 héroes, elegir) */
    await s.seed(saveHeroes);
    await s.enterHubFromTitle();
    await s.ev("document.querySelector('#hud [data-action=open-heroes]').click()");
    await s.waitFor("window.__gameState().screen === 'heroes'", 6000);
    await sleep(700);
    const selectorCounts = await s.ev(`(() => ({ cards: document.querySelectorAll('.v2-hero-card').length,
      dots: document.querySelectorAll('[data-action=v2-hero-goto]').length,
      hasCanvas: !!document.querySelector('.v2-hero-canvas') }))()`);
    await s.ev("document.querySelector('#screen [data-action=v2-hero-goto][data-index=\"0\"]').click()");
    await sleep(600);
    if (await s.has('#screen [data-action="select-hero"]')) await s.click('#screen [data-action="select-hero"][data-hero="ilan"]', 700);
    else if (await s.has('#screen [data-action="v2-hero-choose"]')) await s.click('#screen [data-action="v2-hero-choose"]', 700);
    const heroSave = await s.readSave();
    const choseIlan = heroSave && heroSave.collection && heroSave.collection.selectedCharacterId === 'ilan';
    await s.shot('selector-elegido');
    record('R10', 'Regresión', 'Selector: 10 héroes, navegación y elección',
      selectorCounts.cards === 10 && selectorCounts.dots === 10 && selectorCounts.hasCanvas ? 'PASS' : 'FAIL',
      JSON.stringify(selectorCounts) + ' · elegido=' + (heroSave && heroSave.collection && heroSave.collection.selectedCharacterId));
    await s.ev("document.querySelector('#screen [data-action=close-sheet]').click()");
    await sleep(700);

    /* ------------------------------------------------ R11 · mundo interactivo */
    await s.seed(withSettings(emptySave));
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1200);
    const w0 = await worldStats(s);
    const ids0 = await worldIds(s);
    const idKinds = (ids0 && ids0.all || []).reduce((o, x) => { o[x.kind] = (o[x.kind] || 0) + 1; return o; }, {});
    await s.shot('atrio-mundo');
    record('R11a', 'Regresión', 'Mundo interactivo listo y censo',
      w0 && w0.built && w0.ready && w0.chests.total === 5 && w0.fragments.total === 15 && w0.guides.total === 5 && w0.stations.total === 2 ? 'PASS' : 'FAIL',
      'ids=' + JSON.stringify(idKinds) + ' · counts=' + JSON.stringify(w0 && w0.counts));
    const stateBeforeChest = await s.readSave();
    await openWorld(s, 'v2w-chest-salud-publica');
    const chestClosed = await worldPanel(s);
    await s.shot('mundo-cofre-cerrado');
    await clickWorld(s, 'v2-world-chest-open', 700);
    const chestOpen = await worldPanel(s);
    const stateAfterChest = await s.readSave();
    await s.shot('mundo-cofre-abierto');
    const chestOk = chestClosed && chestOpen && /Cofre abierto/.test(chestOpen.title) && stateAfterChest.xp >= stateBeforeChest.xp + 5;
    record('R11b', 'Regresión', 'Mundo: cofre con recompensa única',
      chestOk ? 'PASS' : 'FAIL', 'xp ' + stateBeforeChest.xp + '→' + stateAfterChest.xp + ' · title="' + (chestOpen && chestOpen.title) + '"');
    await closeWorld(s);
    await openWorld(s, 'v2w-frag-salud-publica-1');
    const fragPanel = await worldPanel(s);
    const stateBeforeFrag = await s.readSave();
    if (fragPanel && fragPanel.actions.indexOf('v2-world-fragment-save') !== -1) await clickWorld(s, 'v2-world-fragment-save', 700);
    const stateAfterFrag = await s.readSave();
    await s.shot('mundo-fragmento');
    record('R11c', 'Regresión', 'Mundo: fragmento guardado',
      stateAfterFrag.xp >= stateBeforeFrag.xp + 5 ? 'PASS' : 'FAIL', 'xp ' + stateBeforeFrag.xp + '→' + stateAfterFrag.xp);
    await closeWorld(s);
    await openWorld(s, 'v2w-guide-salud-publica');
    const guide1 = await worldPanel(s);
    if (guide1 && guide1.actions.indexOf('v2-world-guide-next') !== -1) { await clickWorld(s, 'v2-world-guide-next', 400); await clickWorld(s, 'v2-world-guide-next', 400); }
    await s.shot('mundo-guia');
    const stateAfterGuide = await s.readSave();
    record('R11d', 'Regresión', 'Mundo: guía completada',
      stateAfterGuide.xp >= stateAfterFrag.xp + 5 ? 'PASS' : 'FAIL', 'xp ' + stateAfterFrag.xp + '→' + stateAfterGuide.xp);
    await closeWorld(s);
    await openWorld(s, 'v2w-telescope');
    const telescopePanel = await worldPanel(s);
    await s.shot('mundo-telescopio');
    record('R11f', 'Regresión', 'Mundo: telescopio y biblioteca abren su panel',
      !!(telescopePanel && telescopePanel.open) ? 'PASS' : 'FAIL',
      'telescopio="' + (telescopePanel && telescopePanel.title) + '" · acciones=' + JSON.stringify(telescopePanel && telescopePanel.actions));
    await closeWorld(s);
    await openWorld(s, 'v2w-library');
    const libraryPanel = await worldPanel(s);
    await s.shot('mundo-biblioteca');
    record('R11g', 'Regresión', 'Mundo: biblioteca de fichas abre su panel',
      !!(libraryPanel && libraryPanel.open) ? 'PASS' : 'FAIL',
      'biblioteca="' + (libraryPanel && libraryPanel.title) + '" · body=' + String(libraryPanel && libraryPanel.body).slice(0, 140));
    await closeWorld(s);
    await s.reload();
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1000);
    const wAfterReload = await worldStats(s);
    record('R11e', 'Persistencia', 'Mundo interactivo persiste tras recargar',
      wAfterReload && wAfterReload.chests.opened >= 1 && wAfterReload.fragments.collected >= 1 && wAfterReload.guides.completed >= 1 ? 'PASS' : 'FAIL',
      'chests=' + (wAfterReload && wAfterReload.chests.opened) + ' fragments=' + (wAfterReload && wAfterReload.fragments.collected) + ' guides=' + (wAfterReload && wAfterReload.guides.completed));
    results.v21.world = { initial: w0 && w0.counts, afterReload: wAfterReload && { chests: wAfterReload.chests, fragments: wAfterReload.fragments, guides: wAfterReload.guides } };

    /* ------------------------------------------------ R11h · culling con todas las misiones */
    await s.seed(saveFull);
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1800);
    const perfStats = await s.ev("window.__V2 && window.__V2.perf && window.__V2.perf.stats ? window.__V2.perf.stats() : null");
    const cull = perfStats && perfStats.culling;
    await s.shot('atrio-culling-todas-misiones');
    const cullOk = !!(cull && cull.installed && cull.hubVisible && cull.allMissionsComplete && cull.targets > 0 && cull.hidden >= 0 && cull.drawCallsSaved > 0);
    record('R11h', 'V2.1 · Rendimiento', 'Culling del atrio con todas las misiones completas',
      v21Status(cullOk, JSON.stringify(cull && { targets: cull.targets, visible: cull.visible, hidden: cull.hidden, saved: cull.drawCallsSaved, pct: cull.savedPercent })),
      cull ? ('misiones=' + JSON.stringify(cull.missionTotals) + ' · all=' + cull.allMissionsComplete + ' · targets=' + cull.targets + ' · visibles=' + cull.visible + ' · ocultos=' + cull.hidden + ' · drawsSaved=' + cull.drawCallsSaved + ' (' + cull.savedPercent + '%) · vegetación=' + JSON.stringify(cull.vegetation) + ' · polvo=' + JSON.stringify(cull.dust)) : 'sin V2.perf.stats');
    if (!cullOk) issue('high', 'v21', 'El culling del atrio no reporta ahorro con todas las misiones', JSON.stringify(perfStats).slice(0, 1400));
    results.v21.culling = { perf: perfStats && { quality: perfStats.quality, culling: perfStats.culling, settings: perfStats.settings }, errorCount: perfStats && perfStats.errors ? perfStats.errors.length : null };

    /* ------------------------------------------------ R12-R13 · import/export */
    await s.seed(withSettings(emptySave));
    if (!(await s.ev("window.__gameState().screen === 'title'"))) await s.reload();
    await s.click('#screen [data-action="open-import"]', 700);
    await s.waitFor("window.__gameState().screen === 'import'", 5000);
    const previewLegacy = await analyzeImportText(s, legacyText);
    await s.shot('importar-1-2');
    await confirmImportAndWait(s);
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1000);
    const legacyState = await s.readSave();
    const legacyWorld = await worldStats(s);
    record('R12', 'Importación', 'Importar partida 1.2 y añadir v2.world vacío',
      legacyState && legacyState.profile.name === 'Offline QA' && legacyState.xp === 1640 && legacyState.coins === 2510 && Object.keys(legacyState.errors || {}).length === 3 ? 'PASS' : 'FAIL',
      'preview=' + (previewLegacy && previewLegacy.name) + ' · xp=' + (legacyState && legacyState.xp) + ' coins=' + (legacyState && legacyState.coins) + ' errors=' + Object.keys(legacyState && legacyState.errors || {}).length);
    await s.reload();
    const legacyReload = await s.readSave();
    record('R12b', 'Persistencia', 'Importación 1.2 persiste tras recargar',
      legacyReload && legacyReload.xp === 1640 && legacyReload.coins === 2510 ? 'PASS' : 'FAIL', 'xp=' + (legacyReload && legacyReload.xp) + ' coins=' + (legacyReload && legacyReload.coins));

    await s.enterHubFromTitle();
    await openSettingsFromHub(s);
    await s.ev(`(() => { if (!window.__qaBlobOrig) { window.__qaBlobOrig = URL.createObjectURL.bind(URL); window.__qaBlobs = []; URL.createObjectURL = function (b) { window.__qaBlobs.push(b); return window.__qaBlobOrig(b); }; } return true; })()`);
    await s.click('#screen [data-action="export-save"]', 0);
    await sleep(1200);
    let exportText = null; let exportMethod = 'download';
    try {
      const files = fs.readdirSync(DOWNLOADS).filter((f) => /^serums-quest-observatorio-.*\.json$/.test(f)).sort();
      if (files.length) exportText = fs.readFileSync(path.join(DOWNLOADS, files[files.length - 1]), 'utf8');
    } catch (e) {}
    if (!exportText) {
      exportMethod = 'blob';
      exportText = await s.ev("(async () => { const b=window.__qaBlobs && window.__qaBlobs[window.__qaBlobs.length-1]; return b?await b.text():null; })()", true);
    }
    if (!exportText) throw new Error('No se pudo capturar la exportación del guardado');
    const payload = JSON.parse(exportText);
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-v21-' + SHOT_PREFIX + '-exported-save.json'), exportText, 'utf8');
    const exportState = payload.state || payload;
    const exportOk = exportState && exportState.xp === legacyState.xp && exportState.coins === legacyState.coins;
    record('R13a', 'Exportación', 'Exportar partida nueva (JSON) conserva progreso',
      exportOk ? 'PASS' : 'FAIL', 'vía=' + exportMethod + ' · xp=' + (exportState && exportState.xp) + ' coins=' + (exportState && exportState.coins) + ' · perfil=' + (exportState && exportState.profile && exportState.profile.name));
    await s.click('#screen [data-action="open-import"]', 700);
    await s.waitFor("window.__gameState().screen === 'import'", 5000);
    const previewNew = await analyzeImportText(s, exportText);
    await s.shot('importar-nuevo');
    await confirmImportAndWait(s);
    await s.enterHubFromTitle();
    const reimportState = await s.readSave();
    const reimportOk = reimportState && reimportState.xp === exportState.xp && reimportState.coins === exportState.coins;
    record('R13b', 'Importación', 'Reimportar el guardado nuevo conserva progreso',
      reimportOk ? 'PASS' : 'FAIL', 'preview=' + (previewNew && previewNew.name) + ' · xp=' + (reimportState && reimportState.xp) + ' coins=' + (reimportState && reimportState.coins));
    results.save.roundTrip = { exportMethod, before: { xp: legacyState.xp, coins: legacyState.coins, errors: Object.keys(legacyState.errors || {}).length }, after: reimportState && { xp: reimportState.xp, coins: reimportState.coins, missions: Object.keys(reimportState.missions || {}).length } };

    /* ------------------------------------------------ viewport y duelo */
    await s.seed(saveMission);
    await s.enterHubFromTitle();
    await openJournalMission(s, 'area-psi-salud-publica', 'mission-sp-1');
    await sleep(900);
    const viewports = [
      [390, 844], [844, 390], [768, 1024], [1024, 768],
      [820, 1180], [960, 540], [1280, 720], [1920, 1080]
    ];
    const viewportData = {};
    for (const [vw, vh] of viewports) {
      await s.setViewport(vw, vh);
      const layout = await s.ev(`(() => {
        const scr = document.querySelector('#screen');
        const opts = [...document.querySelectorAll('#screen [data-action=answer]')];
        const rects = opts.map(e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), right: Math.round(r.right), bottom: Math.round(r.bottom) }; });
        const hud = document.querySelector('#hud');
        const duelTop = document.querySelector('#screen .duelTop, #screen .duelHudTop, #screen .v2d-top');
        const hudRect = hud ? hud.getBoundingClientRect() : null;
        const hudVisible = !!(hudRect && hudRect.width > 0 && hudRect.height > 0 && getComputedStyle(hud).display !== 'none' && getComputedStyle(hud).visibility !== 'hidden');
        const topRect = duelTop ? duelTop.getBoundingClientRect() : null;
        const headerRect = hudVisible ? hudRect : topRect;
        const hudRectOut = headerRect ? { x: Math.round(headerRect.x), y: Math.round(headerRect.y), w: Math.round(headerRect.width), h: Math.round(headerRect.height), source: hudVisible ? 'hud' : 'duelTop', display: getComputedStyle(hudVisible ? hud : duelTop).display, visibility: getComputedStyle(hudVisible ? hud : duelTop).visibility } : null;
        const overlap = headerRect ? rects.reduce(function (area, r) {
          const x = Math.max(0, Math.min(r.right, headerRect.right) - Math.max(r.x, headerRect.left));
          const y = Math.max(0, Math.min(r.bottom, headerRect.bottom) - Math.max(r.y, headerRect.top));
          return area + x * y;
        }, 0) : 0;
        const metrics = window.__V2 && window.__V2.duel && typeof window.__V2.duel.metrics === 'function' ? window.__V2.duel.metrics() : null;
        return { innerW: innerWidth, innerH: innerHeight, scrollW: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          scrollH: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
          screenW: scr ? scr.clientWidth : null, screenScrollW: scr ? scr.scrollWidth : null,
          options: rects.length, optionsVisible: rects.filter(r => r.w > 0 && r.h > 0 && r.x >= -2 && r.right <= innerWidth + 2).length,
          hud: hudRectOut, hudOverlap: Math.round(overlap),
          duelMetrics: metrics ? { viewport: metrics.viewport, safe: metrics.safe, topHud: metrics.topHud, classes: metrics.classes, panel: metrics.panel, camera: metrics.camera, reserve: metrics.reserve } : null,
          rotatePrompt: (() => { const r = document.querySelector('#rotatePrompt'); return r ? getComputedStyle(r).display !== 'none' : false; })(),
          shot: '' };
      })()`);
      layout.shot = s.rel(await s.shot('duelo-' + vw + 'x' + vh));
      layout.overflow = layout.scrollW - layout.innerW;
      viewportData[vw + 'x' + vh] = layout;
    }
    await s.setViewport(WIDTH, HEIGHT);
    // Contracción al atacar (V2.duel.metrics + clase v2d-attacking)
    let contraction = null;
    const cq = await currentQuestion(s);
    if (cq) {
      const beforeMetrics = await s.ev("window.__V2 && window.__V2.duel && window.__V2.duel.metrics ? window.__V2.duel.metrics() : null");
      const beforePanel = await s.ev("(() => { const p=document.querySelector('.v2d-duel-panel, #screen .duelPanel'); if(!p) return null; const r=p.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height),y:Math.round(r.y)}; })()");
      await s.shot('duelo-contraccion-antes');
      const tAttack = Date.now();
      await s.click('#screen [data-action="answer"][data-letter="' + cq.answer + '"]', 0);
      let startMs = null, endMs = null, idxDuring = null, during = null, activeSample = null;
      while (Date.now() - tAttack < 2600) {
        await sleep(60);
        const sample = await s.ev(`(() => {
          const p=document.querySelector('.v2d-duel-panel, #screen .duelPanel'); const r=p?p.getBoundingClientRect():null;
          const m=window.__V2 && window.__V2.duel && window.__V2.duel.metrics ? window.__V2.duel.metrics() : null;
          return { attacking: document.body.classList.contains('v2d-attacking'),
            panel: r?{w:Math.round(r.width),h:Math.round(r.height),y:Math.round(r.y)}:null,
            attack: m?m.attack:null, idx: window.__gameState().questionIndex, screen: window.__gameState().screen };
        })()`);
        if (sample.attacking && startMs == null) {
          startMs = Date.now() - tAttack; idxDuring = sample.idx; activeSample = sample;
          // esperar al estado contraído (la clase aparece antes de que el panel termine de encogerse)
          await sleep(140);
          const contracted = await s.ev(`(() => {
            const p=document.querySelector('.v2d-duel-panel, #screen .duelPanel'); const r=p?p.getBoundingClientRect():null;
            const m=window.__V2 && window.__V2.duel && window.__V2.duel.metrics ? window.__V2.duel.metrics() : null;
            return { attacking: document.body.classList.contains('v2d-attacking'), panel: r?{w:Math.round(r.width),h:Math.round(r.height),y:Math.round(r.y)}:null,
              attack: m?m.attack:null, idx: window.__gameState().questionIndex };
          })()`);
          during = contracted;
          await s.shot('duelo-contraccion-durante');
        } else if (sample.attacking && startMs != null && !during && sample.panel && beforePanel && Math.abs(sample.panel.h - beforePanel.h) > 20) {
          during = sample;
        }
        if (!sample.attacking && startMs != null) { endMs = Date.now() - tAttack; during = during || sample; break; }
        if (sample.screen !== 'duel') { endMs = Date.now() - tAttack; during = during || sample; break; }
      }
      await sleep(200);
      const afterClass = await s.ev("document.body.classList.contains('v2d-attacking')");
      const shrunk = !!(during && beforePanel && during.panel && Math.abs(during.panel.h - beforePanel.h) > 20);
      contraction = { beforeMetrics, beforePanel, startMs, endMs, idxDuring, activeSample, during, afterClass, shrunk };
      const contractionOk = !!(startMs != null && startMs <= 350 && idxDuring === 0 && shrunk && endMs != null && endMs - startMs >= 250 && !afterClass);
      record('B07b', 'V2.1 · Duelo', 'Contracción al atacar: empieza con el ataque, no en la pregunta siguiente',
        v21Status(contractionOk, JSON.stringify({ startMs: startMs, idxDuring: idxDuring, shrunk: shrunk, endMs: endMs, afterClass: afterClass })),
        'inicio=' + startMs + ' ms · índice al iniciar=' + idxDuring + ' · fin=' + endMs + ' ms · clase final=' + afterClass + ' · panel ' + JSON.stringify(beforePanel) + '→' + JSON.stringify(during && during.panel) + ' · ataque=' + JSON.stringify(activeSample && activeSample.attack));
      results.v21.contraction = contraction;
      if (!contractionOk) issue('high', 'v21', 'La contracción del duelo no empieza al atacar (se difiere al siguiente render/pregunta)', JSON.stringify({ startMs, idxDuring, endMs, shrunk, beforePanel, during: during && during.panel }).slice(0, 1200));
    } else {
      record('B07b', 'V2.1 · Duelo', 'Contracción al atacar', 'BLOCKED', 'sin pregunta activa al medir');
    }
    await pauseAndAbandon(s);
    await resultContinue(s);
    if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
    await s.waitFor("window.__gameState().screen === 'hub'", 6000);
    results.viewports = viewportData;
    const viewportOverflow = Object.keys(viewportData).filter((k) => viewportData[k].overflow > 1);
    const viewportOptions = Object.keys(viewportData).filter((k) => viewportData[k].options !== 4 || viewportData[k].optionsVisible < 4);
    const viewportHud = Object.keys(viewportData).filter((k) => !viewportData[k].hud || viewportData[k].hud.w === 0 || viewportData[k].hudOverlap > 0);
    record('B07', 'V2.1 · Duelo', 'Duelo en 8 vistas (390×844 … 1920×1080): 4 alternativas, HUD sin tapar, sin desbordes',
      v21Status(viewportOverflow.length === 0 && viewportOptions.length === 0 && viewportHud.length === 0, JSON.stringify({ overflow: viewportOverflow, options: viewportOptions, hud: viewportHud })),
      'vistas=' + Object.keys(viewportData).length + ' · overflow=' + JSON.stringify(viewportOverflow) + ' · opciones=' + JSON.stringify(viewportOptions) + ' · HUD=' + JSON.stringify(viewportHud) + ' · ' + Object.keys(viewportData).map((k) => k + ':opts=' + viewportData[k].optionsVisible + ',hud=' + (viewportData[k].hud ? viewportData[k].hud.w + 'x' + viewportData[k].hud.h : 'no') + ',tap=' + viewportData[k].hudOverlap).join(' '));
    if (viewportOverflow.length || viewportOptions.length || viewportHud.length) issue('high', 'v21', 'El duelo desborda, corta opciones o el HUD tapa contenido en alguna vista', JSON.stringify({ viewportOverflow, viewportOptions, viewportHud }).slice(0, 1200));

    /* ------------------------------------------------ banderines/estandartes */
    const bannerShots = [];
    const areaIds = ['area-psi-salud-publica', 'area-psi-cuidado-integral', 'area-psi-etica', 'area-psi-investigacion', 'area-psi-gestion'];
    for (const areaId of areaIds) {
      await s.seed(saveMission);
      await s.enterHubFromTitle();
      await s.press('KeyG'); await s.waitFor("window.__gameState().screen === 'modes'", 5000);
      await s.click('#screen [data-action="open-practice"]', 350);
      await s.waitFor("window.__gameState().screen === 'practicePicker'", 5000);
      const startSel = '#screen [data-action="start-practice"][data-area="' + areaId + '"]';
      if (await s.has(startSel)) {
        await s.click(startSel, 1300);
        await s.waitFor("window.__gameState().screen === 'duel'", 7000);
        await sleep(900);
        const areaShot = await s.shot('estandarte-' + areaId.replace('area-psi-', ''));
        await sleep(300);
        // El banderín visible queda a la izquierda del guardián, sobre el palo, en ~x 330-630 / y 180-480 (1280×720).
        const closeBanner = await s.shotClip('estandarte-' + areaId.replace('area-psi-', '') + '-close', { x: 330, y: 180, width: 300, height: 300 }, 3);
        const assetsStats = await s.ev("window.__V2 && window.__V2.assets && window.__V2.assets.stats ? window.__V2.assets.stats() : null");
        bannerShots.push({ areaId, shot: s.rel(areaShot), close: closeBanner && s.rel(closeBanner), assets: assetsStats });
        await pauseAndAbandon(s); await resultContinue(s);
        if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
        await s.waitFor("window.__gameState().screen === 'hub'", 5000);
      } else {
        bannerShots.push({ areaId, shot: null, error: 'sin botón de práctica para el área' });
        await s.press('Escape');
        await sleep(400);
      }
    }
    results.captures.banners = bannerShots;
    results.captures.counts.banners = bannerShots.filter((b) => b.shot).length;
    const bannerOk = bannerShots.length === 5 && bannerShots.every((b) => b.shot && b.close && b.assets && b.assets.arenaActive && b.assets.arenaArea === b.areaId);
    record('B08b', 'V2.1 · Banderín', 'Arena + close-up de banderín/estandarte en las 5 arenas, con tela sobre el palo',
      v21Status(bannerOk, JSON.stringify(bannerShots.map((b) => ({ area: b.areaId, arena: b.assets && b.assets.arenaArea, close: !!b.close })))),
      JSON.stringify(bannerShots.map((b) => ({ area: b.areaId, shot: b.shot, close: b.close, arena: b.assets && b.assets.arenaArea }))),
      { evidence: [].concat(...bannerShots.map((b) => [b.shot, b.close].filter(Boolean))).slice(0, 6) });
    if (!bannerOk) issue('high', 'v21', 'Faltan capturas de arena/close-up o la arena no está activa por área', JSON.stringify(bannerShots.map((b) => ({ area: b.areaId, assets: b.assets, close: !!b.close }))).slice(0, 1200));

    /* ------------------------------------------------ FPS */
    await s.seed(withSettings(emptySave));
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1500);
    results.fps.hubIdle = await s.collectFps('hubIdle', 2.5);
    results.fps.hubIdle.quality = 'alto';
    await openWorld(s, 'v2w-telescope');
    await sleep(400);
    results.fps.hubPanel = await s.collectFps('hubPanel', 2.5);
    results.fps.hubPanel.quality = 'alto';
    await closeWorld(s);
    await s.press('KeyM');
    await s.waitFor("window.__gameState().screen === 'map'", 6000);
    await sleep(1400);
    results.fps.map = await s.collectFps('map', 2.5);
    results.fps.map.quality = 'alto';
    await s.click('#screen [data-action="map-close"]', 700);
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    await openJournalMission(s, 'area-psi-salud-publica', 'mission-sp-1');
    await sleep(1400);
    results.fps.duel = await s.collectFps('duel', 2.5);
    results.fps.duel.quality = 'alto';
    await pauseAndAbandon(s); await resultContinue(s);
    await s.waitFor("window.__gameState().screen === 'hub'", 6000);
    const fpsChecks = [['F01', 'hubIdle', 'Atrio en reposo'], ['F02', 'hubPanel', 'Atrio con panel'], ['F03', 'map', 'Mapa'], ['F04', 'duel', 'Duelo']];
    fpsChecks.forEach(([id, key, title]) => {
      const f = results.fps[key];
      record(id, 'Rendimiento', 'FPS · ' + title,
        f && f.min != null && f.min >= 45 && f.avg >= 55 ? 'PASS' : 'FAIL',
        'min=' + (f && f.min) + ' avg=' + (f && f.avg) + ' muestras=' + (f && f.values ? f.values.length : 0) + ' <45=' + (f && f.below45));
      if (f && f.min != null && f.min < 45) issue('high', 'rendimiento', 'FPS mínimo <45 en ' + key, 'min=' + f.min + ' avg=' + f.avg);
    });

    /* ------------------------------------------------ N · red/errores/advertencias */
    const nonLocal = s.requests.filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url));
    const schemes = { file: 0, data: 0, blob: 0, about: 0, chrome: 0, other: 0 };
    s.requests.forEach((r) => {
      const m = /^([a-z]+):/i.exec(r.url);
      const key = m ? m[1].toLowerCase() : 'other';
      schemes[key] = (schemes[key] || 0) + 1;
    });
    results.network = { total: s.requests.length, nonLocal, allowed: schemes };
    const finalV2 = await s.ev("(window.__V2 && window.__V2._errors) || []");
    results.errors = { total: s.errors.length, items: s.errors.slice(0, 30), v2Count: (finalV2 || []).length, v2Errors: finalV2 || [] };
    results.warningsTotal = s.warnings.length;
    results.warnings = s.warnings.slice(0, 60);
    record('N01', 'Red', 'Cero peticiones de red no locales',
      nonLocal.length === 0 ? 'PASS' : 'FAIL', nonLocal.length + ' no locales de ' + s.requests.length + ' · ' + JSON.stringify(schemes));
    if (nonLocal.length) issue('high', 'regresion', 'Hay peticiones de red en el build', nonLocal.slice(0, 8).map((r) => r.url).join(', '));
    record('N02', 'Errores', 'Cero errores de consola/excepción',
      s.errors.length === 0 ? 'PASS' : 'FAIL', s.errors.length + ' errores · ' + s.errors.slice(0, 3).map((e) => String(e.text || e.description || '').slice(0, 120)).join(' | '));
    if (s.errors.length) issue('high', 'regresion', 'La consola registra errores/excepciones', JSON.stringify(s.errors.slice(0, 6)).slice(0, 900));
    record('N03', 'Errores', 'V2._errors vacío',
      (finalV2 || []).length === 0 ? 'PASS' : 'FAIL', (finalV2 || []).length + ' errores V2 ' + JSON.stringify((finalV2 || []).slice(0, 4)));
    const pcfWarnings = s.warnings.filter((w) => /PCFSoftShadowMap|PCFShadowMap|WebGLShadowMap/i.test(String(w.text || '')));
    const otherWarnings = s.warnings.filter((w) => !/PCFSoftShadowMap|PCFShadowMap|WebGLShadowMap/i.test(String(w.text || '')));
    record('B09', 'V2.1 · Sombras', 'Sin warnings de PCF en consola',
      isBase() ? (pcfWarnings.length ? 'NOTE' : 'PASS') : v21Status(pcfWarnings.length === 0, 'PCF=' + pcfWarnings.length + ' · otras=' + otherWarnings.length),
      'PCF=' + pcfWarnings.length + ' · otras=' + otherWarnings.length + ' · ' + Array.from(new Set(pcfWarnings.map((w) => String(w.text || '')))).slice(0, 2).join(' | ').slice(0, 300));
    if (!isBase() && pcfWarnings.length) issue('high', 'v21', 'Persisten warnings de PCFSoftShadowMap', String(pcfWarnings[0].text || ''));
    results.v21.pcfWarnings = pcfWarnings.length;
    results.v21.otherWarnings = otherWarnings.length;
    if (otherWarnings.length) record('N02b', 'Errores', 'Otras advertencias de consola (no bloqueantes)', 'NOTE', otherWarnings.length + ' · ' + Array.from(new Set(otherWarnings.map((w) => String(w.text || '')))).slice(0, 4).join(' | ').slice(0, 400));

    /* ------------------------------------------------ export HTML + HUB */
    const req0 = s.requests.length; const err0 = s.errors.length; const warn0 = s.warnings.length;
    await s.send('Page.navigate', { url: pathToFileURL(EXPORT).href });
    await sleep(1600);
    await s.waitFor("document.readyState === 'complete' && window.__gameState && window.__gameState().screen", 20000);
    await s.seed(withSettings(emptySave));
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(900);
    const exportStats = await worldStats(s);
    const exportChestBefore = await s.readSave();
    await openWorld(s, 'v2w-chest-salud-publica');
    await clickWorld(s, 'v2-world-chest-open', 700);
    const exportChestAfter = await s.readSave();
    const exportPanel = await worldPanel(s);
    await s.shot('export-html');
    await closeWorld(s);
    const exportNonLocal = s.requests.slice(req0).filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url));
    const exportErrors = s.errors.slice(err0);
    const exportWarnings = s.warnings.slice(warn0);
    const exportHtmlOk = exportStats && exportStats.built && exportStats.ready && exportChestAfter.coins === exportChestBefore.coins + 5 && exportNonLocal.length === 0 && exportErrors.length === 0;
    record('X01', 'Export HTML', 'export/serums-quest.html por file://: mundo + cofre + 0 red/errores',
      exportHtmlOk ? 'PASS' : 'FAIL',
      'stats=' + JSON.stringify({ built: exportStats && exportStats.built, ready: exportStats && exportStats.ready, chests: exportStats && exportStats.chests && exportStats.chests.opened }) + ' · coins ' + exportChestBefore.coins + '→' + exportChestAfter.coins + ' · noLocales=' + exportNonLocal.length + ' · errores=' + exportErrors.length + ' · warnings=' + exportWarnings.length);
    if (!exportHtmlOk) issue('high', 'artefacto', 'El HTML exportado falla la prueba de mundo/cofre/red', JSON.stringify({ stats: exportStats && { built: exportStats.built, ready: exportStats.ready }, before: exportChestBefore && exportChestBefore.coins, after: exportChestAfter && exportChestAfter.coins, panel: exportPanel && exportPanel.title, nonLocal: exportNonLocal, errors: exportErrors }).slice(0, 1000));
    results.artifacts.exportTest = { stats: exportStats && { built: exportStats.built, ready: exportStats.ready, chests: exportStats.chests }, nonLocal: exportNonLocal, errors: exportErrors, warnings: exportWarnings };
    const reqHub = s.requests.length; const errHub = s.errors.length;
    await s.send('Page.navigate', { url: pathToFileURL(HUB_INDEX).href });
    await sleep(2200);
    const hubRedirect = await s.ev("({ href: location.href, path: location.pathname, title: document.title, game: !!window.__gameState })");
    await s.shot('hub-link');
    const hubErrors = s.errors.slice(errHub);
    const hubNonLocal = s.requests.slice(reqHub).filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url));
    const redirectOk = hubRedirect && /\/dist\/index\.html$/.test(hubRedirect.path || '') && hubRedirect.game && hubErrors.length === 0 && hubNonLocal.length === 0;
    record('X02', 'HUB', 'index.html redirige a dist/index.html',
      redirectOk ? 'PASS' : 'FAIL', JSON.stringify(hubRedirect) + ' · errores=' + hubErrors.length + ' · noLocales=' + hubNonLocal.length);
    if (!redirectOk) issue('high', 'artefacto', 'El enlace del HUB no redirige a dist/index.html', JSON.stringify({ redirect: hubRedirect, errors: hubErrors, nonLocal: hubNonLocal }));
    results.artifacts.hubRedirect = Object.assign({}, hubRedirect, { errors: hubErrors, nonLocal: hubNonLocal });

    const distEnd = distInfo(DIST); const exportEnd = distInfo(EXPORT); const bundleEnd = distInfo(BUNDLE);
    results.artifacts.distEnd = distEnd; results.artifacts.exportEnd = exportEnd; results.artifacts.bundleEnd = bundleEnd;
    const stable = isBase() ? bundleEnd.sha256 === bundleStart.sha256 : (distEnd.sha256 === distStart.sha256 && exportEnd.sha256 === exportStart.sha256);
    record('N04', 'Entorno', isBase() ? 'Artefacto base estable durante la pasada' : 'dist y export estables durante la pasada',
      stable ? 'PASS' : 'FAIL',
      'bundle=' + bundleEnd.sha256.slice(0, 12) + ' · dist=' + distEnd.sha256.slice(0, 12) + ' · export=' + exportEnd.sha256.slice(0, 12));
    if (!stable) issue('high', 'qa-harness', 'El artefacto evaluado cambió durante la pasada', 'bundle ' + bundleStart.sha256 + '→' + bundleEnd.sha256 + ' · dist ' + distStart.sha256 + '→' + distEnd.sha256 + ' · export ' + exportStart.sha256 + '→' + exportEnd.sha256);

    /* ------------------------------------------------ B10 · guardado */
    results.save.integrity = {
      initialSeeded: { xp: emptySave.xp, coins: emptySave.coins, missions: Object.keys(emptySave.missions || {}).length },
      finalReimport: reimportState && { xp: reimportState.xp, coins: reimportState.coins, missions: Object.keys(reimportState.missions || {}).length },
      worldAfterReload: results.v21.world && results.v21.world.afterReload
    };
    record('B10', 'V2.1 · Guardado', 'No se pierde progreso ni guardado en la pasada (export/import/reload)',
      v21Status(!!(reimportState && reimportState.xp === legacyState.xp && reimportState.coins === legacyState.coins), 'roundtrip=' + JSON.stringify(results.save.roundTrip)),
      'roundtrip=' + JSON.stringify(results.save.roundTrip) + ' · integridad=' + JSON.stringify(results.save.integrity));

  } catch (error) {
    console.error('FATAL V2.1 QA', error && error.stack || error);
    results.fatal = String(error && error.stack || error);
    issue('critical', 'qa-harness', 'La pasada se detuvo', String(error && error.message || error));
    if (s) {
      results.network = { total: s.requests.length, nonLocal: s.requests.filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url)), allowed: {} };
      results.errors = { total: s.errors.length, items: s.errors.slice(0, 30) };
      results.warningsTotal = s.warnings.length;
      results.warnings = s.warnings.slice(0, 40);
    }
  } finally {
    try { s.ws.close(); } catch (e) {}
    try { s.proc.kill(); } catch (e) {}
    await sleep(600);
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {}
  }

  results.meta.finishedAt = new Date().toISOString();
  results.meta.durationMs = new Date(results.meta.finishedAt).getTime() - new Date(results.meta.startedAt).getTime();
  const summary = { total: results.cases.length, pass: 0, fail: 0, blocked: 0, skip: 0, note: 0 };
  results.cases.forEach((c) => { if (summary[c.status.toLowerCase()] != null) summary[c.status.toLowerCase()] += 1; });
  results.summary = summary;
  try {
    fs.writeFileSync(modeJson, JSON.stringify(results, null, 2), 'utf8');
    fs.writeFileSync(mainJson, JSON.stringify(results, null, 2), 'utf8');
    fs.writeFileSync(modeReport, buildReport(), 'utf8');
    fs.writeFileSync(mainReport, buildReport(), 'utf8');
    // Contactos para revisión visual de parpadeo/estandartes
    try {
      execFileSync('python', [path.join(QA_DIR, 'agent7-v21-contact.py'), MODE], { cwd: ROOT, stdio: 'ignore' });
      const contacts = [
        path.join(EVIDENCE, 'agent7-v21-' + MODE + '-contacto-parpadeo.png'),
        path.join(EVIDENCE, 'agent7-v21-' + MODE + '-contacto-parpadeo-cosmeticos.png'),
        path.join(EVIDENCE, 'agent7-v21-' + MODE + '-contacto-estandartes.png'),
        path.join(EVIDENCE, 'agent7-v21-' + MODE + '-contacto-estandartes-close.png')
      ].filter((f) => fs.existsSync(f));
      contacts.forEach((f) => { if (results.shots.indexOf(f) === -1) results.shots.push(f); });
      if (contacts.length) {
        fs.writeFileSync(modeJson, JSON.stringify(results, null, 2), 'utf8');
        fs.writeFileSync(mainJson, JSON.stringify(results, null, 2), 'utf8');
        fs.writeFileSync(modeReport, buildReport(), 'utf8');
        fs.writeFileSync(mainReport, buildReport(), 'utf8');
      }
    } catch (e) { console.error('No se pudieron crear los contactos', e.message); }
  } catch (e) { console.error('No se pudo escribir evidencia', e); }
  console.log('RESUMEN V2.1 ' + MODE, JSON.stringify({ cases: summary, fps: results.fps, network: results.network && results.network.nonLocal && results.network.nonLocal.length,
    errors: results.errors && results.errors.total, warnings: results.warningsTotal, issues: results.issues.length }, null, 2));
  if (summary.fail || results.fatal) process.exitCode = 1;
})();
