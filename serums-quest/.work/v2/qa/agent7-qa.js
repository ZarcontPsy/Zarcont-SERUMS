'use strict';
/* =========================================================================
   SERUMS QUEST · V2 · Agente 7 (QA y rendimiento)
   Arnés de regresión con Chrome headless por CDP, sin dependencias.
   No edita el juego: siembra localStorage, conduce la UI y mide.

   Uso:
     node .work/v2/qa/agent7-qa.js --pass=base
     node .work/v2/qa/agent7-qa.js --pass=final

   Salidas:
     .work/v2/evidence/agent7-qa.json
     .work/v2/evidence/agent7-report.md
     .work/v2/evidence/agent7-<base|cp1>-*.png
     .work/v2/evidence/agent7-exported-save.json
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const QA_DIR = __dirname;
const V2_DIR = path.resolve(__dirname, '..');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EVIDENCE = path.join(V2_DIR, 'evidence');
const DIST = path.join(ROOT, 'dist', 'index.html');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SAVE_KEY = 'serumsquest:voxel:state:v1';
const SETTINGS_KEY = 'serumsquest:voxel:settings:v1';
const AUX_KEYS = [
  'serumsquest:voxel:preimport:v1', 'serumsquest:voxel:backup:v1',
  'serumsquest:voxel:corrupt:v1', 'serumsquest:snapshot:v1',
  'serumsquest:state:v1', 'serumsquest:backup:v1', 'serumsquest:journal:v1'
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] == null ? true : m[2]] : [a, true];
}));
const PASS = args.pass === 'final' ? 'final' : 'base';
const CAPTURES = PASS === 'final' || !!args.captures;
const PORT = Number(args.port) || (PASS === 'final' ? 9386 : 9385);
const WIDTH = Number(args.width) || 1280;
const HEIGHT = Number(args.height) || 720;
const PROFILE = path.join(QA_DIR, 'agent7-profile-' + PORT);
const DOWNLOADS = path.join(QA_DIR, 'agent7-downloads-' + PASS);
const SHOT_PREFIX = PASS === 'final' ? 'cp1' : 'base';

const saveFull = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-full.json'), 'utf8'));
const legacyFixtureText = fs.readFileSync(path.join(ROOT, '.work', 'offline-fixture.json'), 'utf8');
const legacyFixture = JSON.parse(legacyFixtureText);

function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
function makeSave(overrides) {
  const out = deepClone(saveFull);
  Object.keys(overrides || {}).forEach((key) => { out[key] = deepClone(overrides[key]); });
  return out;
}

const defaultModeStats = {
  dailyDate: null, claims: {}, dailyWins: 0, survivalWins: 0, survivalBest: 0,
  timedRuns: 0, timedBest: 0, timedAce: 0, simulacros: 0, simulacroHistory: []
};
const baseSettings = deepClone(saveFull.settings);
const saveMission = makeSave({
  xp: 0, coins: 120, stage: 1,
  academic: { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: {}, recent: [] },
  questions: {}, questionTags: {}, errors: {}, missions: {}, achievements: {},
  daily: { lastCompletedDate: null, streak: 0, bestStreak: 0, totalCompleted: 0, graceWeek: null },
  reviews: { lastCompletedDate: null, completed: 0, onTimeSessions: 0, earlySessions: 0 },
  modeStats: deepClone(defaultModeStats),
  backup: { lastExportedAt: null, lastPromptAt: null },
  importedFrom: null, importedAt: null,
  settings: Object.assign({}, baseSettings, {
    tutorialSeen: true, backupReminder: false, qualityChosen: true,
    effectsQuality: 'alto', reducedMotion: false,
    sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 }
  })
});
const saveShop = makeSave({
  xp: 0, coins: 500, stage: 1,
  academic: { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: {}, recent: [] },
  questions: {}, questionTags: {}, errors: {}, missions: {}, achievements: {},
  daily: { lastCompletedDate: null, streak: 0, bestStreak: 0, totalCompleted: 0, graceWeek: null },
  reviews: { lastCompletedDate: null, completed: 0, onTimeSessions: 0, earlySessions: 0 },
  modeStats: deepClone(defaultModeStats),
  collection: { ownedCharacterIds: ['ilan', 'noa'], ownedCosmeticIds: [], selectedCharacterId: 'noa', equipped: {} },
  backup: { lastExportedAt: null, lastPromptAt: null },
  importedFrom: null, importedAt: null,
  settings: Object.assign({}, baseSettings, {
    tutorialSeen: true, backupReminder: false, qualityChosen: true,
    effectsQuality: 'alto', reducedMotion: false,
    sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 }
  })
});
const saveHeroStates = deepClone(saveShop);
saveHeroStates.collection = { ownedCharacterIds: ['ilan'], ownedCosmeticIds: [], selectedCharacterId: 'ilan', equipped: {} };
const saveTutorial = makeSave({
  xp: 0, coins: 0, stage: 1,
  academic: { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: {}, recent: [] },
  questions: {}, questionTags: {}, errors: {}, missions: {}, achievements: {},
  daily: { lastCompletedDate: null, streak: 0, bestStreak: 0, totalCompleted: 0, graceWeek: null },
  reviews: { lastCompletedDate: null, completed: 0, onTimeSessions: 0, earlySessions: 0 },
  modeStats: deepClone(defaultModeStats),
  collection: { ownedCharacterIds: ['ilan'], ownedCosmeticIds: [], selectedCharacterId: 'ilan', equipped: {} },
  backup: { lastExportedAt: null, lastPromptAt: null },
  importedFrom: null, importedAt: null,
  settings: Object.assign({}, baseSettings, {
    tutorialSeen: false, backupReminder: false, qualityChosen: true,
    effectsQuality: 'alto', reducedMotion: false,
    sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 }
  })
});

const results = {
  meta: {},
  summary: {},
  cases: [],
  issues: [],
  fps: {},
  screenshots: [],
  counts: {},
  v2: {},
  imports: {},
  network: {},
  errors: {},
  failedLoads: [],
  warnings: []
};
let cdp = null;

/* ------------------------------------------------------------------ utils */
function distInfo() {
  const buf = fs.readFileSync(DIST);
  return {
    path: DIST,
    bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    mtime: fs.statSync(DIST).mtime.toISOString()
  };
}
function pngSize(file) {
  try {
    const buf = fs.readFileSync(file);
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch (e) { return { w: null, h: null, error: String(e) }; }
}
function slug(text) { return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72); }
function record(id, area, title, status, detail, extra) {
  const item = Object.assign({ id, area, title, status, detail: detail || '', evidence: [] }, extra || {});
  results.cases.push(item);
  const suffix = detail ? ' :: ' + detail : '';
  console.log('[' + status + '] ' + id + ' · ' + title + suffix);
  return item;
}
function issue(severity, kind, title, detail, extra) {
  results.issues.push(Object.assign({ severity, kind, title, detail: detail || '', at: new Date().toISOString() }, extra || {}));
  console.log('[ISSUE:' + severity + '] ' + title + ' :: ' + (detail || ''));
}
function addShot(name) {
  results.screenshots.push(name);
  return name;
}

/* -------------------------------------------------------------- CDP setup */
async function waitForTarget(timeoutMs) {
  const start = Date.now();
  const endpoint = 'http://127.0.0.1:' + PORT + '/json/list';
  while (Date.now() - start < (timeoutMs || 25000)) {
    try {
      const list = await (await fetch(endpoint)).json();
      const page = list.find((x) => x.type === 'page' && /^file:/.test(x.url)) || list.find((x) => x.type === 'page');
      if (page) return page;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('Chrome no abrió una pestaña file:// en el puerto ' + PORT);
}

async function launch() {
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.rmSync(DOWNLOADS, { recursive: true, force: true });
  fs.mkdirSync(DOWNLOADS, { recursive: true });
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const proc = spawn(CHROME, [
    '--headless=new',
    '--enable-unsafe-swiftshader',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--mute-audio',
    '--force-device-scale-factor=1',
    '--window-size=' + WIDTH + ',' + HEIGHT,
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + PROFILE,
    pathToFileURL(DIST).href
  ], { stdio: 'ignore', windowsHide: true });
  const page = await waitForTarget(30000);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  const warnings = [];
  const requests = [];
  const failedLoads = [];
  ws.onmessage = (event) => {
    let m;
    try { m = JSON.parse(event.data); } catch (e) { return; }
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      clearTimeout(p.timer);
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
      return;
    }
    const p = m.params || {};
    if (m.method === 'Runtime.exceptionThrown') {
      const d = p.exceptionDetails || {};
      errors.push({
        kind: 'exception', at: new Date().toISOString(),
        text: String(d.text || ''),
        description: String((d.exception && d.exception.description) || ''),
        url: String(d.url || ''), line: d.lineNumber, column: d.columnNumber
      });
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
    const r = await send('Runtime.evaluate', {
      expression: expression, awaitPromise: !!awaitPromise, returnByValue: true, userGesture: true
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('eval: ' + String(d.text || '') + ' ' + String((d.exception && d.exception.description) || ''));
    }
    return r.result ? r.result.value : undefined;
  }
  async function waitFor(expression, timeout, interval) {
    const end = Date.now() + (timeout || 6000);
    while (Date.now() < end) {
      try { if (await ev('!!(' + expression + ')')) return true; } catch (e) {}
      await sleep(interval || 120);
    }
    return false;
  }
  async function click(selector, delay) {
    const ok = await ev('(() => { const el = document.querySelector(' + JSON.stringify(selector) + '); if (!el) return false; el.click(); return true; })()');
    if (!ok) throw new Error('No existe ' + selector);
    await sleep(delay == null ? 250 : delay);
    return true;
  }
  async function clickIf(selector, delay) {
    try { return await click(selector, delay); } catch (e) { return false; }
  }
  async function has(selector) {
    return !!(await ev('!!document.querySelector(' + JSON.stringify(selector) + ')'));
  }
  async function setValue(selector, value) {
    const ok = await ev(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!ok) throw new Error('No existe para escribir ' + selector);
    await sleep(200);
  }
  const KEY = {
    Enter: ['Enter', 'Enter', 13], Escape: ['Escape', 'Escape', 27], Space: ['Space', ' ', 32],
    ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37], ArrowUp: ['ArrowUp', 'ArrowUp', 38],
    ArrowRight: ['ArrowRight', 'ArrowRight', 39], ArrowDown: ['ArrowDown', 'ArrowDown', 40],
    KeyJ: ['KeyJ', 'j', 74], KeyM: ['KeyM', 'm', 77], KeyR: ['KeyR', 'r', 82],
    KeyH: ['KeyH', 'h', 72], KeyG: ['KeyG', 'g', 71], KeyI: ['KeyI', 'i', 73],
    KeyA: ['KeyA', 'a', 65], KeyB: ['KeyB', 'b', 66], KeyC: ['KeyC', 'c', 67], KeyD: ['KeyD', 'd', 68]
  };
  async function press(code) {
    const k = KEY[code] || [code, code, 0];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', code: k[0], key: k[1], windowsVirtualKeyCode: k[2], nativeVirtualKeyCode: k[2] });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code: k[0], key: k[1], windowsVirtualKeyCode: k[2], nativeVirtualKeyCode: k[2] });
    await sleep(260);
  }
  async function shot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = path.join(EVIDENCE, 'agent7-' + SHOT_PREFIX + '-' + slug(name) + '.png');
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
    addShot(file);
    return file;
  }
  async function state() { return ev('window.__gameState ? window.__gameState() : null'); }
  async function readSave() { return ev(`(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null'); } catch (e) { return null; } })()`); }
  async function readSettingsKey() { return ev(`(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)}) || 'null'); } catch (e) { return null; } })()`); }
  async function dismissBanners() {
    try {
      const visible = await ev("(() => { const b=document.querySelector('#backupBanner'); return !!(b && !b.classList.contains('hidden')); })()");
      if (visible) { await clickIf('#backupBanner [data-action="backup-later"]', 150); }
    } catch (e) {}
  }
  async function skipTutorial() {
    const screen = await ev("window.__gameState ? window.__gameState().screen : ''");
    if (screen === 'tutorial') {
      await clickIf('#screen [data-action="tutorial-skip"]', 350);
      await waitFor("window.__gameState().screen === 'title'", 4000);
    }
  }
  async function reload(options) {
    const opts = options || {};
    await send('Page.reload', { ignoreCache: true });
    await sleep(350);
    const booted = await waitFor("document.readyState === 'complete' && window.__gameState && window.__gameState().screen", 25000);
    if (!booted) throw new Error('La recarga no completó el arranque');
    await sleep(700);
    if (opts.skipTutorial !== false) await skipTutorial();
    if (opts.dismissBanners !== false) await dismissBanners();
  }
  async function seed(save, options) {
    const opts = options || {};
    await ev(`(() => {
      const keys = ${JSON.stringify([SAVE_KEY, SETTINGS_KEY].concat(AUX_KEYS))};
      keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(JSON.stringify(save))});
      return true;
    })()`);
    await reload(opts);
  }
  async function enterHubFromTitle() {
    if (await has('#screen [data-action="menu-continue"]')) await click('#screen [data-action="menu-continue"]', 900);
    else await press('Enter');
    await waitFor("window.__gameState().screen === 'hub'", 6000);
    await sleep(500);
    await dismissBanners();
  }
  async function collectFps(label, seconds) {
    const values = [];
    const samples = [];
    const started = Date.now();
    let last = null;
    while (Date.now() - started < seconds * 1000) {
      try {
        const st = await state();
        if (st) {
          last = st;
          if (Number.isFinite(st.fps)) {
            values.push(st.fps);
            samples.push({ t: Date.now() - started, fps: st.fps, screen: st.screen });
          }
        }
      } catch (e) {}
      await sleep(120);
    }
    const out = {
      label, seconds, screen: last && last.screen,
      quality: await ev("window.__V2 && window.__V2.quality ? window.__V2.quality() : null").catch(() => null),
      samples, values
    };
    if (values.length) {
      out.min = Math.min.apply(null, values);
      out.max = Math.max.apply(null, values);
      out.avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
      out.below45 = values.filter((v) => v < 45).length;
    }
    return out;
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');
  try {
    await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS });
  } catch (e) {}
  try {
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  } catch (e) {}
  async function setViewport(width, height) {
    try {
      await send('Emulation.setDeviceMetricsOverride', { width: width, height: height, deviceScaleFactor: 1, mobile: false });
    } catch (e) {}
    await sleep(550);
  }
  await sleep(600);
  return {
    proc, ws, send, ev, waitFor, click, clickIf, has, setValue, press, shot, state,
    readSave, readSettingsKey, reload, seed, enterHubFromTitle, collectFps, setViewport,
    dismissBanners, skipTutorial, errors, warnings, requests, failedLoads
  };
}

/* ------------------------------------------------------------- page probes */
async function pageInfo(s) {
  return s.ev(`(() => {
    const V = window.__V2 || null;
    const has = function (m, f) { return !!(V && V[m] && typeof V[m][f] === 'function'); };
    const st = window.__gameState ? window.__gameState() : null;
    const camp = window.CAMPAIGN_DATA || {};
    const qs = camp.questions || {};
    const ids = Object.keys(qs);
    const bySource = {}, byArea = {};
    ids.forEach(function (id) {
      const q = qs[id];
      bySource[q.source] = (bySource[q.source] || 0) + 1;
      byArea[q.areaId] = (byArea[q.areaId] || 0) + 1;
    });
    const glCanvas = document.createElement('canvas');
    let gl = { ok: false };
    try {
      const g = glCanvas.getContext('webgl2') || glCanvas.getContext('webgl');
      if (g) {
        const d = g.getExtension('WEBGL_debug_renderer_info');
        gl = {
          ok: true,
          vendor: d ? g.getParameter(d.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR),
          renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER),
          version: g.getParameter(g.VERSION)
        };
      }
    } catch (e) { gl = { ok: false, error: String(e) }; }
    return {
      screen: st && st.screen, phase: st && st.phase, renderer: st && st.renderer,
      state: st,
      title: document.title,
      titleVersion: (document.querySelector('.titleVersion') || {}).textContent || '',
      v2: {
        version: V && V.version,
        modules: (V && V.modules) || null,
        has: {
          call: !!(V && typeof V.call === 'function'),
          assetsHub: has('assets', 'decorateHub'), assetsMap: has('assets', 'decorateMapIsland'),
          assetsArena: has('assets', 'applyArenaVariant'), assetsStats: has('assets', 'stats'),
          heroesMount: has('heroes', 'mount'), heroesUpdate: has('heroes', 'update'),
          combatHero: has('combat', 'heroAttack'), combatGuardian: has('combat', 'guardianAttack'),
          combatDuel: has('combat', 'onDuelStart'), feedbackAnswer: has('feedback', 'onAnswer'),
          feedbackSettings: has('feedback', 'settingsHTML'), feedbackMix: has('feedback', 'mixMissionQuestions')
        },
        errors: (V && V._errors || []).slice(-12),
        events: (V && V.events || []).slice(-12).map(function (e) { return e && e.type; })
      },
      counts: {
        total: ids.length,
        bySource: bySource,
        byArea: byArea,
        metaQuestionCount: camp.meta && camp.meta.questionCount,
        metaSourceCounts: camp.meta && camp.meta.sourceCounts,
        metaV2: camp.meta && camp.meta.v2
      },
      gl: gl,
      dpr: window.devicePixelRatio,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      bodyClasses: document.body.className
    };
  })()`);
}

async function questionKeyAudit(s) {
  return s.ev(`(() => {
    const qs = (window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.questions) || {};
    const ids = Object.keys(qs);
    const step = Math.max(1, Math.floor(ids.length / 42));
    const checked = [], failures = [];
    for (let i = 0; i < ids.length && checked.length < 42; i += step) {
      const id = ids[i], q = qs[id], bad = [];
      if (!q.stem || q.stem.length < 8) bad.push('stem');
      if (!q.explanation || String(q.explanation).length < 10) bad.push('explanation');
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5) bad.push('options');
      if (!q.options || !q.options.some(function (o) { return o.id === q.answer; })) bad.push('answer');
      if (!q.areaId || !(window.CAMPAIGN_DATA.areas || []).some(function (a) { return a.id === q.areaId; })) bad.push('area');
      if (['campaign', 'dashboard', 'flashcards'].indexOf(q.source) === -1) bad.push('source');
      if (bad.length) failures.push({ id: id, bad: bad });
      checked.push(id);
    }
    const sample = checked.slice(0, 12).map(function (id) { return { id: id, answer: qs[id].answer, source: qs[id].source, areaId: qs[id].areaId }; });
    return { checked: checked.length, failures: failures, sample: sample };
  })()`);
}

async function assetCatalog(s) {
  return s.ev(`(() => {
    const V = window.__V2;
    if (!V || !V.assets) return null;
    let stats = null;
    try { stats = typeof V.assets.stats === 'function' ? V.assets.stats() : null; } catch (e) { stats = { error: String(e) }; }
    let catalog = null;
    try {
      const c = V.assets.catalog;
      if (c) {
        const areas = {};
        Object.keys(c.areas || {}).forEach(function (k) { areas[k] = (c.areas[k] || []).length; });
        catalog = { areas: areas, minions: (c.minions || []).length, arena: (c.arena || []).length, sky: (c.sky || []).length };
      }
    } catch (e) { catalog = { error: String(e) }; }
    let ids = null;
    try {
      const raw = V.assets.ids || {};
      const areas = {};
      Object.keys(raw).forEach(function (k) {
        if (k.indexOf('v2-') === 0) return;
        if (Array.isArray(raw[k])) areas[k] = raw[k].length;
      });
      ids = { areas: areas, minions: Array.isArray(raw['v2-minions']) ? raw['v2-minions'].length : null, arena: Array.isArray(raw['v2-arena']) ? raw['v2-arena'].length : null, sky: Array.isArray(raw['v2-sky']) ? raw['v2-sky'].length : null };
    } catch (e) { ids = { error: String(e) }; }
    return { stats: stats, catalog: catalog, ids: ids };
  })()`);
}

async function feedbackInfo(s) {
  return s.ev(`(() => {
    const v2 = document.querySelector('.v2-feedback[data-v2-feedback]');
    const legacy = document.querySelector('.feedbackStrip');
    const r = { v2Open: !!v2, legacy: !!legacy };
    if (v2) {
      r.kind = v2.getAttribute('data-kind') || '';
      r.text = String(v2.innerText || '').slice(0, 1400);
      const key = v2.querySelector('.v2-feedback__letter');
      r.answer = key ? String(key.textContent || '').trim() : '';
      const explain = v2.querySelector('.v2-feedback__block--explain .v2-feedback__text');
      r.hasExplanation = !!explain;
      r.explanation = explain ? String(explain.textContent || '').trim() : '';
      r.hasWhy = !!v2.querySelector('.v2-feedback__block--why');
      r.hasContinue = !!v2.querySelector('[data-action="v2-feedback-continue"]');
      r.hasFlash = !!v2.querySelector('[data-action="v2-feedback-flashcard"]');
      r.hasDifficult = !!v2.querySelector('[data-action="v2-feedback-difficult"]');
      r.sealed = !!v2.querySelector('.v2-feedback__sealed');
      const diff = v2.querySelector('[data-action="v2-feedback-difficult"]');
      r.difficultPressed = diff ? diff.getAttribute('aria-pressed') : null;
    }
    if (legacy) r.legacyText = String(legacy.innerText || '').slice(0, 1000);
    return r;
  })()`);
}

async function currentQuestion(s) {
  return s.ev(`(() => {
    const btn = document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]');
    const id = btn && btn.getAttribute('data-question');
    const q = id && window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.questions ? window.CAMPAIGN_DATA.questions[id] : null;
    if (!q) return null;
    return {
      id: q.id, answer: q.answer, stem: q.stem, source: q.source, areaId: q.areaId,
      examTitle: q.examTitle, explanation: q.explanation,
      options: (q.options || []).map(function (o) { return { id: o.id, text: o.text }; })
    };
  })()`);
}

async function hideFeedbackOverlay(s) {
  return s.ev(`(() => {
    document.querySelectorAll('[class*="v2-feedback"], [id*="v2-feedback"], .feedbackStrip').forEach(function (e) {
      e.style.visibility = 'hidden';
      e.style.pointerEvents = 'none';
    });
    return true;
  })()`);
}
async function showFeedbackOverlay(s) {
  return s.ev(`(() => {
    document.querySelectorAll('[class*="v2-feedback"], [id*="v2-feedback"], .feedbackStrip').forEach(function (e) {
      e.style.visibility = '';
      e.style.pointerEvents = '';
    });
    return true;
  })()`);
}

async function analyzeImportText(s, text) {
  await s.setValue('#legacyText', text);
  await s.click('#screen [data-action="legacy-analyze"]', 0);
  const ok = await s.waitFor("!!document.querySelector('.importPreview')", 6000);
  if (!ok) {
    const err = await s.ev("(document.querySelector('#screen .notice') || {}).innerText || ''");
    throw new Error('La vista previa de importación no apareció. ' + err);
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
    return { name: ((p.querySelector('.previewName') || {}).textContent || '').trim(), grid: grid, text: String(p.innerText || '').slice(0, 1600) };
  })()`);
}

async function confirmImportAndWait(s) {
  await s.click('#screen [data-action="import-confirm"]', 900);
  const ok = await s.waitFor("['title','hub'].indexOf(window.__gameState().screen) !== -1", 7000);
  if (!ok) throw new Error('La importación no volvió al título/atrio');
  await sleep(500);
  await s.dismissBanners();
}

async function openJournalMission(s, areaId, missionId) {
  const screen = await s.ev("window.__gameState().screen");
  if (screen === 'hub') await s.press('KeyJ');
  else if (await s.has('#screen [data-action="open-journal"]')) await s.click('#screen [data-action="open-journal"]', 450);
  await s.waitFor("window.__gameState().screen === 'journal'", 5000);
  const areaSel = '#screen [data-action="select-area"][data-area="' + areaId + '"]';
  if (!(await s.has(areaSel))) throw new Error('La bitácora no muestra el área ' + areaId);
  await s.click(areaSel, 400);
  const missionSel = '#screen [data-action="select-mission"][data-mission="' + missionId + '"]';
  await s.waitFor('!!document.querySelector(' + JSON.stringify(missionSel) + ')', 4000);
  await s.click(missionSel, 400);
  await s.click('#screen [data-action="start-mission"]', 1200);
  await s.waitFor("window.__gameState().screen === 'duel'", 7000);
  await sleep(700);
}

async function answerAndWait(s, letter, waitMs) {
  await s.click('#screen [data-action="answer"][data-letter="' + letter + '"]', 0);
  const ok = await s.waitFor("!!document.querySelector('.v2-feedback[data-v2-feedback], .feedbackStrip')", 4000);
  if (!ok) throw new Error('No apareció feedback tras responder ' + letter);
  await sleep(waitMs == null ? 260 : waitMs);
}

async function continueFeedback(s) {
  if (await s.has('[data-action="v2-feedback-continue"]')) {
    await s.click('[data-action="v2-feedback-continue"]', 450);
  } else if (await s.has('#screen [data-action="next-question"]')) {
    await s.click('#screen [data-action="next-question"]', 450);
  } else {
    throw new Error('No hay botón para continuar el feedback');
  }
  await sleep(350);
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
  await s.click('#screen [data-action="result-continue"]', 800);
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
async function closeSettingsToTitle(s) {
  await s.click('#screen [data-action="close-settings"]', 500);
  await s.waitFor("window.__gameState().screen === 'title'", 5000);
}
async function closeSettingsToHub(s) {
  await s.click('#screen [data-action="close-settings"]', 450);
  await s.waitFor("['pause','title','hub'].indexOf(window.__gameState().screen) !== -1", 5000);
  if (await s.ev("window.__gameState().screen === 'pause'")) {
    await s.click('#screen [data-action="close-pause"]', 500);
  } else if (await s.ev("window.__gameState().screen === 'title'")) {
    await s.enterHubFromTitle();
    return;
  }
  await s.waitFor("window.__gameState().screen === 'hub'", 5000);
  await sleep(400);
}

function compareWeights(a, b) {
  if (!a || !b) return false;
  return ['campaign', 'dashboard', 'flashcards'].every((k) => Math.abs(Number(a[k]) - Number(b[k])) <= 0.001);
}
function countsOfSave(save) {
  const missions = save && save.missions ? Object.keys(save.missions).filter((id) => save.missions[id] && save.missions[id].completedAt).length : 0;
  const cosmetics = save && save.collection && Array.isArray(save.collection.ownedCosmeticIds) ? save.collection.ownedCosmeticIds.length : 0;
  const heroes = save && save.collection && Array.isArray(save.collection.ownedCharacterIds) ? save.collection.ownedCharacterIds.length : 0;
  return {
    xp: save ? Number(save.xp) : null,
    coins: save ? Number(save.coins) : null,
    missions: missions,
    cosmetics: cosmetics,
    heroes: heroes,
    selectedCharacterId: save && save.collection ? save.collection.selectedCharacterId : null,
    profileName: save && save.profile ? save.profile.name : null,
    weights: save && save.settings ? save.settings.sourceWeights : null,
    quality: save && save.settings ? save.settings.effectsQuality : null
  };
}

/* --------------------------------------------------------------- report */
function buildReport() {
  const passLabel = PASS === 'final' ? 'Pasada final (Checkpoint 1)' : 'Pasada base';
  const total = results.cases.length;
  const count = (st) => results.cases.filter((c) => c.status === st).length;
  const nonLocal = (results.network && results.network.nonLocal) || [];
  const viewport = results.meta.viewport || { w: WIDTH, h: HEIGHT, dpr: '—' };
  const dist = results.meta.dist || distInfo();
  const md = [];
  md.push('# SERUMS QUEST · V2 · Informe QA Agente 7');
  md.push('');
  md.push('- **Pasada:** ' + passLabel);
  md.push('- **Inicio/fin:** ' + results.meta.startedAt + ' → ' + results.meta.finishedAt);
  md.push('- **Build:** `dist/index.html` · buildId `' + (results.meta.buildId || dist.sha256.slice(0, 12)) + '` · ' + dist.bytes + ' bytes · SHA-256 `' + dist.sha256 + '` · mtime ' + dist.mtime);
  md.push('- **Entorno:** ' + (results.meta.chrome || '—') + ' · GPU: ' + (results.meta.gpu || '—') + ' · ' + viewport.w + '×' + viewport.h + ' · DPR ' + viewport.dpr);
  md.push('- **Resultado:** ' + count('PASS') + ' PASS · ' + count('FAIL') + ' FAIL · ' + count('BLOCKED') + ' BLOCKED · ' + count('SKIP') + ' SKIP · ' + count('NOTE') + ' NOTE (de ' + total + ' casos)');
  md.push('- **Red:** ' + nonLocal.length + ' peticiones no locales · **Errores de consola/excepción:** ' + (results.errors.total || 0) + ' · **V2._errors:** ' + (results.v2.errors ? results.v2.errors.length : 0));
  md.push('');
  const cell = (text, max) => String(text == null ? '' : text).replace(/\r?\n/g, ' ').replace(/\|/g, '/').slice(0, max || 500);
  md.push('## Casos');
  md.push('');
  md.push('| Caso | Resultado | Evidencia |');
  md.push('| --- | --- | --- |');
  results.cases.forEach((c) => {
    const ev = (c.evidence || []).map((e) => String(e).indexOf('agent7-') === 0 ? '[' + e + '](' + e + ')' : e).join(' · ');
    md.push('| ' + cell(c.id, 80) + ' · ' + cell(c.title, 180) + ' | **' + c.status + '** | ' + (cell(ev, 500) || cell(c.detail, 500) || '—') + ' |');
  });
  md.push('');
  md.push('## Rendimiento');
  md.push('');
  md.push('| Escena | Calidad | Mínimo | Medio | Muestras | < 45 | Evidence |');
  md.push('| --- | --- | --- | --- | --- | --- | --- |');
  ['hub', 'map', 'duel', 'hubLow'].forEach((key) => {
    const f = results.fps[key];
    if (!f) return;
    md.push('| ' + key + ' | ' + (f.quality || '—') + ' | ' + (f.min == null ? '—' : f.min) + ' | ' + (f.avg == null ? '—' : f.avg) + ' | ' + (f.samples ? f.samples.length : 0) + ' | ' + (f.below45 == null ? '—' : f.below45) + ' | ' + (f.evidence || 'agent7-qa.json → fps.' + key) + ' |');
  });
  md.push('');
  md.push('Objetivo del contrato: medio ≥ 55 y mínimo ≥ 45. ' + (results.meta.fpsNote || ''));
  md.push('');
  const fpsValues = ['hub', 'map', 'duel'].map((key) => {
    const f = results.fps[key];
    return f && f.values ? key + ' = [' + f.values.join(', ') + ']' : null;
  }).filter(Boolean);
  if (fpsValues.length) {
    md.push('Muestras (`window.__gameState().fps` cada ~120 ms): ' + fpsValues.join(' · ') + '.');
    md.push('');
  }
  md.push('**Nota de entorno:** ' + (results.meta.swiftShader
    ? 'el navegador headless de esta pasada usa SwiftShader (software), por lo que las cifras no representan una GPU real; se reportan tal cual.'
    : 'el navegador headless de esta pasada usa la GPU del host (no SwiftShader); las cifras son del render real a 1280×720 con DPR 1.') +
    ' No se ejecutó el playtest de Game Studio: esta tarea lo prohíbe.');
  md.push('');
  md.push('## Red y errores');
  md.push('');
  md.push('- Peticiones totales capturadas: ' + (results.network.total || 0) + '; no locales (http/https/ws): ' + nonLocal.length + '.');
  md.push('- Esquemas permitidos: ' + JSON.stringify(results.network.allowed || {}));
  if (nonLocal.length) md.push('- **No locales:** `' + nonLocal.slice(0, 15).map((r) => r.url).join('`, `') + '`');
  md.push('- Errores de consola/excepción: ' + (results.errors.total || 0) + '.');
  if ((results.errors.items || []).length) {
    (results.errors.items || []).slice(0, 12).forEach((e) => md.push('  - `' + e.kind + '` ' + String(e.text || e.description || '').slice(0, 300)));
  }
  const warningTexts = Array.from(new Set((results.warnings || []).map((w) => String(w.text || ''))));
  const warningTotal = results.warningsTotal == null ? (results.warnings || []).length : results.warningsTotal;
  if (warningTotal) {
    md.push('- Advertencias de consola: ' + warningTotal + ' · ' + warningTexts.map((w) => '`' + w.slice(0, 220) + '`').join(' · '));
  }
  if (results.v2.errors && results.v2.errors.length) {
    md.push('- **V2._errors:**');
    results.v2.errors.slice(0, 10).forEach((e) => md.push('  - `' + e.module + '.' + e.method + '` ' + String(e.message || '').slice(0, 240)));
  }
  md.push('');
  md.push('## V2 · módulos y contenido');
  md.push('');
  md.push('```json');
  md.push(JSON.stringify({ modules: results.v2.has, catalog: results.v2.catalog, ids: results.v2.ids, counts: results.counts, boot: results.v2.boot, events: results.v2.eventsTail }, null, 2));
  md.push('```');
  md.push('');
  if (results.imports && Object.keys(results.imports).length) {
    md.push('## Importar / exportar');
    md.push('');
    md.push('```json');
    md.push(JSON.stringify(results.imports, null, 2));
    md.push('```');
    md.push('');
  }
  md.push('## Problemas');
  md.push('');
  if (!results.issues.length) md.push('Sin problemas registrados.');
  else results.issues.forEach((i) => md.push('- **[' + i.severity + ' · ' + i.kind + ']** ' + i.title + (i.detail ? ' — ' + String(i.detail).replace(/\r?\n/g, ' ').slice(0, 1200) : '')));
  md.push('');
  if ((results.screenshots || []).length) {
    md.push('## Capturas de esta pasada');
    md.push('');
    Array.from(new Set(results.screenshots)).forEach((file) => {
      const name = path.basename(file);
      md.push('- [' + name + '](' + name + ')');
    });
    md.push('');
  }
  md.push(PASS === 'final' ? '## Cierre' : '## Qué falta para la pasada final');
  md.push('');
  const blocked = results.cases.filter((c) => c.status === 'BLOCKED');
  const failed = results.cases.filter((c) => c.status === 'FAIL');
  if (!blocked.length && !failed.length && PASS === 'final') md.push('Nada bloqueado; revisar capturas y confirmar el veredicto.');
  else {
    blocked.forEach((c) => md.push('- BLOCKED ' + c.id + ' · ' + c.title + (c.detail ? ': ' + c.detail : '')));
    failed.forEach((c) => md.push('- FAIL ' + c.id + ' · ' + c.title + (c.detail ? ': ' + c.detail : '')));
    if (!blocked.length && !failed.length) md.push('- Repetir la pasada final cuando el Agente 0 avise «integración lista»; aquí solo se hizo la pasada base.');
  }
  md.push('');
  md.push('_Informe generado automáticamente por `agent7-qa.js`. No se modificó el juego._');
  return md.join('\n');
}

/* ------------------------------------------------------------------- main */
(async () => {
  if (args['report-only']) {
    const raw = JSON.parse(fs.readFileSync(path.join(EVIDENCE, 'agent7-qa.json'), 'utf8'));
    Object.assign(results, raw);
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-report.md'), buildReport(), 'utf8');
    console.log('Informe regenerado desde agent7-qa.json');
    return;
  }
  const startedAt = new Date();
  const distStart = distInfo();
  results.meta = {
    agent: 'Agente 7 · QA y rendimiento',
    pass: PASS,
    startedAt: startedAt.toISOString(),
    dist: distStart,
    buildId: distStart.sha256.slice(0, 12),
    width: WIDTH, height: HEIGHT
  };
  console.log('Pasada ' + PASS + ' · dist ' + distStart.sha256.slice(0, 12) + ' · ' + distStart.bytes + ' bytes');
  const s = await launch();
  cdp = s;
  try {
    const version = await s.send('Browser.getVersion');
    results.meta.chrome = version.product + ' (' + version.revision + ')';
    await s.seed(saveFull);
    let info = await pageInfo(s);
    if (info.screen !== 'title') {
      await s.reload();
      info = await pageInfo(s);
    }
    const st = info.state || {};
    results.meta.viewport = { w: info.viewport.w, h: info.viewport.h, dpr: info.dpr };
    results.meta.gpu = info.gl.ok ? info.gl.renderer : 'sin WebGL';
    results.meta.swiftShader = /swiftshader|llvmpipe|software/i.test(String(results.meta.gpu));
    results.v2.version = info.v2.version;
    results.v2.has = info.v2.has;
    results.v2.modules = info.v2.modules;
    results.counts = info.counts;

    record('E00', 'Entorno', 'Chrome headless y perfil limpio',
      info.screen === 'title' ? 'PASS' : 'FAIL',
      results.meta.chrome + ' · ' + results.meta.gpu + ' · DPR ' + info.dpr + ' · ' + info.viewport.w + '×' + info.viewport.h,
      { values: { sha256: distStart.sha256, mtime: distStart.mtime, gpu: results.meta.gpu, swiftShader: results.meta.swiftShader } });

    record('E01', 'Módulos V2', 'Namespace y módulos registrados',
      info.v2.has.call && info.v2.has.combatHero && info.v2.has.heroesMount && info.v2.has.feedbackAnswer && info.v2.has.assetsHub ? 'PASS' : 'FAIL',
      JSON.stringify(info.v2.has),
      { values: info.v2.has });

    record('T01', 'Título', 'Versión «V2 · Checkpoint 1» visible',
      String(info.titleVersion).indexOf('V2 · Checkpoint 1') !== -1 ? 'PASS' : 'FAIL',
      'titleVersion="' + info.titleVersion + '" · document.title="' + info.title + '"');

    const c = info.counts;
    const runtimeSources = c.bySource || {};
    const runtimeTotal = c.total;
    const sourceOk = !!c.metaSourceCounts
      && Number(c.metaSourceCounts.campaign) === Number(runtimeSources.campaign)
      && Number(c.metaSourceCounts.dashboard) === Number(runtimeSources.dashboard)
      && Number(c.metaSourceCounts.flashcards) === Number(runtimeSources.flashcards);
    record('T02', 'Contenido', 'Banco combinado de 951 preguntas y fuentes',
      runtimeTotal === 951 && Number(c.metaQuestionCount) === 951 && sourceOk ? 'PASS' : 'FAIL',
      'runtime=' + runtimeTotal + ' meta=' + c.metaQuestionCount + ' sources=' + JSON.stringify(runtimeSources) + ' meta=' + JSON.stringify(c.metaSourceCounts),
      { values: c });
    if (runtimeTotal !== 951) issue('high', 'regresion', 'El banco runtime no tiene 951 preguntas', 'runtime=' + runtimeTotal + ' meta=' + c.metaQuestionCount);

    const audit = await questionKeyAudit(s);
    record('T03', 'Contenido', 'Muestra de claves y estructura (≥30)',
      audit.checked >= 30 && audit.failures.length === 0 ? 'PASS' : 'FAIL',
      audit.checked + ' preguntas verificadas · ' + audit.failures.length + ' con problemas',
      { values: audit });
    results.counts.keyAudit = audit;

    await s.shot('titulo');
    await s.enterHubFromTitle();
    await sleep(1000);
    let hubInfo = await pageInfo(s);
    record('H01', 'Atrio', 'Entrada al observatorio y render 3D',
      hubInfo.screen === 'hub' && hubInfo.renderer === 'webgl' && !!(hubInfo.state && hubInfo.state.heroOnScreen) ? 'PASS' : 'FAIL',
      'screen=' + hubInfo.screen + ' renderer=' + hubInfo.renderer + ' heroOnScreen=' + (hubInfo.state && hubInfo.state.heroOnScreen) + ' fps=' + (hubInfo.state && hubInfo.state.fps));
    const hubAssets = await assetCatalog(s);
    results.v2.catalog = hubAssets && hubAssets.catalog;
    results.v2.ids = hubAssets && hubAssets.ids;
    results.v2.hubStats = hubAssets && hubAssets.stats;
    if (info.v2.has.assetsHub) {
      const hs = hubAssets && hubAssets.stats;
      record('AS01', 'Assets', 'Atrio decorado por V2.assets',
        hs && Number(hs.hubProps) > 0 && Number(hs.minions) >= 1 ? 'PASS' : 'FAIL',
        JSON.stringify(hs || null),
        { values: hs || null });
    } else {
      record('AS01', 'Assets', 'Atrio decorado por V2.assets', 'BLOCKED', 'V2.assets.decorateHub no está en el build');
    }
    await s.shot('atrio');

    /* Tutorial: primera vez (semilla sin tutorialSeen) */
    await s.seed(saveTutorial, { skipTutorial: false });
    const tutorialShown = await s.waitFor("window.__gameState().screen === 'tutorial'", 5000);
    if (tutorialShown) {
      const tutorialStep = () => s.ev(`(() => {
        const dots = [...document.querySelectorAll('#screen .tutorialDots span')];
        const eyebrow = document.querySelector('#screen .tutorialBody .eyebrow.noRule');
        const button = document.querySelector('#screen [data-action="tutorial-next"]');
        return {
          eyebrow: eyebrow ? String(eyebrow.textContent || '').trim() : '',
          dots: dots.length,
          active: dots.findIndex(function (d) { return d.classList.contains('is-active'); }),
          button: button ? String(button.textContent || '').trim() : ''
        };
      })()`);
      const step1 = await tutorialStep();
      for (let i = 0; i < 4; i++) await s.click('#screen [data-action="tutorial-next"]', 260);
      const step5 = await tutorialStep();
      await s.shot('tutorial');
      await s.click('#screen [data-action="tutorial-next"]', 600);
      const backTitle = await s.waitFor("window.__gameState().screen === 'title'", 5000);
      const saved = await s.readSave();
      record('T04', 'Tutorial', 'Primer recorrido de 5 pasos y cierre',
        step1.dots === 5 && step1.active === 0 && /1/.test(step1.eyebrow)
          && step5.dots === 5 && step5.active === 4 && /5/.test(step5.eyebrow)
          && /Terminar/i.test(step5.button) && backTitle ? 'PASS' : 'FAIL',
        'inicio=' + JSON.stringify(step1) + ' · fin=' + JSON.stringify(step5) + ' · tutorialSeen=' + (saved && saved.settings && saved.settings.tutorialSeen));
    } else {
      record('T04', 'Tutorial', 'Primer recorrido de 5 pasos y cierre', 'FAIL', 'El tutorial no se abrió con tutorialSeen=false');
      issue('medium', 'regresion', 'El tutorial no se abre en un guardado nuevo', 'screen=' + (await s.ev('window.__gameState().screen')));
      await s.seed(saveFull);
    }

    /* Menú de título */
    await s.seed(saveFull);
    const titleMenu = await s.ev("[...document.querySelectorAll('#screen .titleMenuBtn')].map(e => e.getAttribute('data-action'))");
    record('T05', 'Título', 'Menú de título completo',
      Array.isArray(titleMenu) && ['open-map', 'open-modes', 'open-wardrobe', 'open-shop', 'open-journal', 'open-settings', 'open-import'].every((a) => titleMenu.indexOf(a) !== -1) ? 'PASS' : 'FAIL',
      JSON.stringify(titleMenu));

    /* Selector de héroes */
    await s.enterHubFromTitle();
    await s.press('KeyH');
    const selectorOpen = await s.waitFor("window.__gameState().screen === 'heroes'", 5000);
    await sleep(1400);
    if (selectorOpen) {
      const v2Selector = await s.ev(`(() => {
        const cards = document.querySelectorAll('.v2-carousel-card');
        const center = document.querySelector('.v2-carousel-card.is-center');
        const pos = document.querySelector('[data-v2-pos]');
        const canvas = document.querySelector('.v2-hero-canvas');
        const fallback = document.querySelector('.v2-hero-fallback');
        return {
          overlay: !!document.querySelector('.v2-hero-overlay'),
          carousel: !!document.querySelector('[data-v2-carousel]'),
          cards: cards.length,
          centerId: center ? center.getAttribute('data-v2-id') : null,
          pos: pos ? String(pos.textContent || '').trim() : null,
          canvas: !!canvas,
          fallback: !!fallback,
          visibleText: String((document.querySelector('#screen') || {}).innerText || '').slice(0, 220)
        };
      })()`);
      if (v2Selector.carousel) {
        await s.shot('selector-heroes');
        const beforePos = v2Selector.pos;
        await s.click('#screen [data-action="v2-hero-next"]', 450);
        const afterPos = await s.ev("((document.querySelector('[data-v2-pos]') || {}).textContent || '').trim()");
        const centerInfo = await s.ev(`(() => { const c=document.querySelector('.v2-carousel-card.is-center'); return { id:c?c.getAttribute('data-v2-id'):null, cta:!!document.querySelector('.v2-carousel-card.is-center [data-action="select-hero"]') }; })()`);
        let selected = null;
        if (centerInfo && centerInfo.id && centerInfo.cta) {
          await s.click('.v2-carousel-card.is-center [data-action="select-hero"][data-hero="' + centerInfo.id + '"]', 500);
          const save = await s.readSave();
          selected = save && save.collection && save.collection.selectedCharacterId;
        }
        record('S01', 'Héroes', 'Selector V2 con carrusel 3D y 10 héroes',
          v2Selector.overlay && v2Selector.cards === 10 && (v2Selector.canvas || v2Selector.fallback) ? 'PASS' : 'FAIL',
          'cards=' + v2Selector.cards + ' pos ' + beforePos + '→' + afterPos + ' center=' + (centerInfo && centerInfo.id) + ' selected=' + selected + ' canvas=' + v2Selector.canvas + ' fallback=' + v2Selector.fallback);
        if (beforePos === afterPos) issue('medium', 'regresion', 'El carrusel V2 no avanza con la flecha siguiente', 'pos=' + beforePos);
      } else {
        record('S01', 'Héroes', 'Selector V2 con carrusel 3D y 10 héroes', 'BLOCKED', 'No hay carrusel V2 en el DOM; se muestra el selector antiguo. Texto: ' + v2Selector.visibleText.slice(0, 120));
      }
      await s.press('Escape');
      await s.waitFor("window.__gameState().screen === 'hub'", 4000);
    } else {
      record('S01', 'Héroes', 'Selector de héroes', 'FAIL', 'No se abrió la pantalla heroes');
    }

    /* Pausa */
    await s.press('Escape');
    const pauseOpen = await s.waitFor("window.__gameState().screen === 'pause'", 4000);
    const pauseActions = await s.ev("[...document.querySelectorAll('#screen [data-action]')].map(e => e.getAttribute('data-action'))");
    record('H02', 'Pausa', 'Pausa y accesos',
      pauseOpen && pauseActions.indexOf('open-settings') !== -1 && pauseActions.indexOf('open-import') !== -1 && pauseActions.indexOf('open-modes') !== -1 ? 'PASS' : 'FAIL',
      'actions=' + JSON.stringify(pauseActions.slice(0, 20)));
    if (pauseOpen) { await s.click('#screen [data-action="close-pause"]', 500); await s.waitFor("window.__gameState().screen === 'hub'", 4000); }

    /* Ajustes: versión, pesos, calidad, movimiento */
    await s.seed(saveFull);
    await openSettingsFromTitle(s);
    let settingsText = await s.ev("(document.querySelector('#screen') || {}).innerText || ''");
    const qualityButtons = await s.ev("[...document.querySelectorAll('#screen [data-action=set-effects-quality]')].map(e => e.getAttribute('data-quality'))");
    const versionLine = await s.ev("(document.querySelector('#screen .settingsFoot') || {}).innerText || ''");
    record('ST01', 'Ajustes', 'Ajustes completos y versión compilada',
      qualityButtons.length === 3 && versionLine.indexOf('V2 · Checkpoint 1') !== -1 ? 'PASS' : 'FAIL',
      'quality=' + JSON.stringify(qualityButtons) + ' · foot="' + versionLine.slice(0, 160) + '"');

    const weightsPresent = await s.has('#screen [data-v2-feedback-settings]');
    if (weightsPresent) {
      const w0 = await s.readSave();
      const rangeCount = await s.ev("[...document.querySelectorAll('#screen [data-v2-weight]')].map(e => e.getAttribute('data-v2-weight'))");
      await s.setValue('#screen [data-v2-weight="campaign"]', '80');
      await sleep(500);
      const raw80 = (await s.readSave()).settings.sourceWeights;
      await s.shot('ajustes');
      await s.reload();
      await openSettingsFromTitle(s);
      const rawReload = (await s.readSave()).settings.sourceWeights;
      const uiReload = await s.ev(`(() => { const o = {}; document.querySelectorAll('#screen [data-v2-weight]').forEach(function (e) { o[e.getAttribute('data-v2-weight')] = Number(e.value) / 100; }); return o; })()`);
      const totalLabel = await s.ev("((document.querySelector('#screen [data-v2-weight-total]') || {}).textContent || '').trim()");
      record('ST02', 'Ajustes', 'Pesos de fuentes (60/15/25 → 80/15/25) persisten',
        rangeCount.length === 3 && compareWeights(raw80, { campaign: 0.8, dashboard: 0.15, flashcards: 0.25 }) && compareWeights(rawReload, raw80) && compareWeights(uiReload, raw80) ? 'PASS' : 'FAIL',
        'inicial=' + JSON.stringify(w0 && w0.settings && w0.settings.sourceWeights) + ' trasUI=' + JSON.stringify(raw80) + ' trasRecarga=' + JSON.stringify(rawReload) + ' sliders=' + JSON.stringify(uiReload) + ' total="' + totalLabel + '"');
      if (!compareWeights(uiReload, raw80)) issue('medium', 'regresion', 'Los pesos de fuentes no sobreviven a la recarga', 'antes=' + JSON.stringify(raw80) + ' sliders tras recarga=' + JSON.stringify(uiReload));
      await s.click('#screen [data-action="v2-weights-reset"]', 400);
    } else {
      record('ST02', 'Ajustes', 'Pesos de fuentes en Ajustes', 'BLOCKED', 'No existe la sección [data-v2-feedback-settings]');
    }

    /* Calidad baja/media/alta con recarga */
    const qualityCycle = [];
    for (const q of ['bajo', 'medio', 'alto']) {
      await s.click('#screen [data-action="set-effects-quality"][data-quality="' + q + '"]', 500);
      const applied = await s.readSave();
      await s.reload();
      await openSettingsFromTitle(s);
      const after = await s.readSave();
      const active = await s.ev("((document.querySelector('#screen [data-action=set-effects-quality].is-active') || {}).getAttribute('data-quality')) || ''");
      const budget = await s.ev("window.__V2 && window.__V2.budget ? window.__V2.budget() : null");
      const vq = await s.ev("window.__V2 && window.__V2.quality ? window.__V2.quality() : null");
      qualityCycle.push({ q, applied: applied && applied.settings.effectsQuality, after: after && after.settings.effectsQuality, active, vq, budget });
      if (!(applied && applied.settings.effectsQuality === q && after && after.settings.effectsQuality === q && active === q && vq === q)) {
        issue('high', 'regresion', 'La calidad ' + q + ' no persiste correctamente', JSON.stringify(qualityCycle[qualityCycle.length - 1]));
      }
    }
    record('ST03', 'Ajustes', 'Calidad baja/media/alta persiste y activa la UI',
      qualityCycle.length === 3 && qualityCycle.every((x) => x.applied === x.q && x.after === x.q && x.active === x.q && x.vq === x.q) ? 'PASS' : 'FAIL',
      JSON.stringify(qualityCycle.map((x) => ({ q: x.q, state: x.after, active: x.active, v2: x.vq, particles: x.budget && x.budget.particles }))));
    results.v2.budgetByQuality = qualityCycle.map((x) => ({ q: x.q, budget: x.budget }));

    /* Pesos después de otro cambio de Ajustes (escenario real) */
    if (weightsPresent) {
      await s.setValue('#screen [data-v2-weight="campaign"]', '70');
      await sleep(500);
      const raw70 = (await s.readSave()).settings.sourceWeights;
      await s.reload();
      await openSettingsFromTitle(s);
      const rawAfter = (await s.readSave()).settings.sourceWeights;
      const uiAfter = await s.ev(`(() => { const o = {}; document.querySelectorAll('#screen [data-v2-weight]').forEach(function (e) { o[e.getAttribute('data-v2-weight')] = Number(e.value) / 100; }); return o; })()`);
      const settingsKey = await s.readSettingsKey();
      const expected70 = { campaign: 0.7, dashboard: 0.15, flashcards: 0.25 };
      const effectiveOk = compareWeights(uiAfter, expected70);
      record('ST04', 'Ajustes', 'Pesos persisten tras cambiar antes la calidad (escenario real)',
        effectiveOk ? 'PASS' : 'FAIL',
        'antes=' + JSON.stringify(raw70) + ' localStorage=' + JSON.stringify(rawAfter) + ' slidersEfectivos=' + JSON.stringify(uiAfter) + ' settingsKey=' + JSON.stringify(settingsKey && settingsKey.sourceWeights));
      if (!effectiveOk) {
        issue('medium', 'integracion', 'Los pesos de fuentes se pierden al recargar si antes se guardó otro ajuste',
          'state efectivo (sliders)=' + JSON.stringify(uiAfter) + ' · localStorage SAVE_KEY=' + JSON.stringify(rawAfter) + ' · SETTINGS_KEY=' + JSON.stringify(settingsKey && settingsKey.sourceWeights) + '. v2fbFlushPersist llama a persist() (SAVE_KEY) pero no a saveSettings(); al arrancar, loadSettings() mezcla SETTINGS_KEY (obsoleto) sobre state.settings. Repro independiente: agent7-weight-repro.json / agent7-weight-repro.png. Arreglo probable: añadir saveSettings() en v2fbFlushPersist o no pisar las claves ya presentes del state al arrancar.');
      }
      await s.click('#screen [data-action="v2-weights-reset"]', 350);
      const uiReset = await s.ev(`(() => { const o = {}; document.querySelectorAll('#screen [data-v2-weight]').forEach(function (e) { o[e.getAttribute('data-v2-weight')] = Number(e.value) / 100; }); return o; })()`);
      if (!compareWeights(uiReset, { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 })) issue('low', 'integracion', 'El botón de restablecer pesos no deja 60/15/25', JSON.stringify(uiReset));
    }

    /* Reducir movimiento */
    const rmBefore = await s.readSave();
    await s.click('#screen [data-action="toggle-reduced-motion"]', 400);
    const rmOn = await s.readSave();
    const bodyOn = await s.ev("document.body.classList.contains('reduced-motion')");
    const v2rmOn = await s.ev("window.__V2 && window.__V2.reducedMotion ? window.__V2.reducedMotion() : null");
    await s.shot('ajustes-accesibilidad');
    await s.reload();
    await openSettingsFromTitle(s);
    const rmReload = await s.readSave();
    const bodyReload = await s.ev("document.body.classList.contains('reduced-motion')");
    const v2rmReload = await s.ev("window.__V2 && window.__V2.reducedMotion ? window.__V2.reducedMotion() : null");
    await s.click('#screen [data-action="toggle-reduced-motion"]', 350);
    const rmOff = await s.readSave();
    const bodyOff = await s.ev("document.body.classList.contains('reduced-motion')");
    record('ST05', 'Ajustes', 'Reducir movimiento persiste y se desactiva',
      rmOn && rmOn.settings.reducedMotion === true && bodyOn && v2rmOn === true
        && rmReload && rmReload.settings.reducedMotion === true && bodyReload && v2rmReload === true
        && rmOff && rmOff.settings.reducedMotion === false && !bodyOff ? 'PASS' : 'FAIL',
      'on=' + JSON.stringify(rmOn && rmOn.settings.reducedMotion) + '/' + bodyOn + '/' + v2rmOn + ' · reload=' + JSON.stringify(rmReload && rmReload.settings.reducedMotion) + '/' + bodyReload + '/' + v2rmReload + ' · off=' + JSON.stringify(rmOff && rmOff.settings.reducedMotion) + '/' + bodyOff);
    if (!(rmReload && rmReload.settings.reducedMotion === true && bodyReload)) issue('high', 'regresion', 'Reducir movimiento no persiste tras la recarga', 'reload=' + JSON.stringify(rmReload && rmReload.settings.reducedMotion) + ' body=' + bodyReload);
    results.settingsInitialSnapshot = rmBefore && rmBefore.settings;

    /* FPS · atrio, mapa y duelo (calidad alta, GPU del host) */
    await s.seed(saveFull);
    await s.enterHubFromTitle();
    await sleep(1400);
    const hubFps = await s.collectFps('hub', 2.4);
    results.fps.hub = hubFps;
    record('PF01', 'Rendimiento', 'FPS en el atrio (mín/medio, ≥2 s)',
      hubFps.min != null && hubFps.min >= 45 && hubFps.avg >= 55 ? 'PASS' : 'FAIL',
      'min=' + hubFps.min + ' avg=' + hubFps.avg + ' muestras=' + hubFps.samples.length + ' · <45=' + hubFps.below45 + ' · calidad=' + hubFps.quality,
      { values: { min: hubFps.min, avg: hubFps.avg, below45: hubFps.below45 } });
    if (hubFps.min != null && hubFps.min < 45) issue('high', 'rendimiento', 'FPS mínimo por debajo de 45 en el atrio', 'min=' + hubFps.min + ' avg=' + hubFps.avg + ' GPU=' + results.meta.gpu);

    await s.press('KeyM');
    await s.waitFor("window.__gameState().screen === 'map'", 6000);
    await sleep(1500);
    const mapInfo = await pageInfo(s);
    const mapAssets = await assetCatalog(s);
    results.v2.mapStats = mapAssets && mapAssets.stats;
    const mapAreas = await s.ev("[...document.querySelectorAll('#screen [data-action=map-area]')].map(e => e.getAttribute('data-area'))");
    await s.shot('mapa');
    record('M01', 'Mapa', 'Mapa 3D con cinco islas',
      mapInfo.screen === 'map' && Array.isArray(mapAreas) && mapAreas.length === 5 ? 'PASS' : 'FAIL',
      'screen=' + mapInfo.screen + ' areas=' + JSON.stringify(mapAreas));
    if (info.v2.has.assetsMap) {
      const ms = mapAssets && mapAssets.stats;
      record('AS02', 'Assets', 'Islas del mapa decoradas por V2.assets',
        ms && Number(ms.mapIslands) >= 5 ? 'PASS' : 'FAIL',
        JSON.stringify(ms || null));
    } else {
      record('AS02', 'Assets', 'Islas del mapa decoradas por V2.assets', 'BLOCKED', 'V2.assets.decorateMapIsland no está en el build');
    }
    for (let i = 0; i < (mapAreas || []).length; i++) {
      await s.click('#screen [data-action="map-area"][data-area="' + mapAreas[i] + '"]', 1100);
      if (CAPTURES) await s.shot('isla-' + (i + 1) + '-' + mapAreas[i].replace('area-psi-', ''));
    }
    await sleep(500);
    const mapFps = await s.collectFps('map', 2.4);
    results.fps.map = mapFps;
    record('PF02', 'Rendimiento', 'FPS en el mapa (mín/medio, ≥2 s)',
      mapFps.min != null && mapFps.min >= 45 && mapFps.avg >= 55 ? 'PASS' : 'FAIL',
      'min=' + mapFps.min + ' avg=' + mapFps.avg + ' muestras=' + mapFps.samples.length + ' · <45=' + mapFps.below45 + ' · islas=' + mapAreas.length,
      { values: { min: mapFps.min, avg: mapFps.avg, below45: mapFps.below45 } });
    if (mapFps.min != null && mapFps.min < 45) issue('high', 'rendimiento', 'FPS mínimo por debajo de 45 en el mapa', 'min=' + mapFps.min + ' avg=' + mapFps.avg);

    /* Duelo: FPS y variante de arena */
    await s.click('#screen [data-action="map-close"]', 700);
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    await openJournalMission(s, 'area-psi-salud-publica', 'mission-sp-1');
    await sleep(1500);
    const duelFps = await s.collectFps('duel', 2.4);
    results.fps.duel = duelFps;
    const arenaAssets = await assetCatalog(s);
    results.v2.arenaStats = arenaAssets && arenaAssets.stats;
    record('PF03', 'Rendimiento', 'FPS en duelo (mín/medio, ≥2 s)',
      duelFps.min != null && duelFps.min >= 45 && duelFps.avg >= 55 ? 'PASS' : 'FAIL',
      'min=' + duelFps.min + ' avg=' + duelFps.avg + ' muestras=' + duelFps.samples.length + ' · <45=' + duelFps.below45 + ' · preguntas=' + (await s.ev('window.__gameState().questionTotal')),
      { values: { min: duelFps.min, avg: duelFps.avg, below45: duelFps.below45 } });
    if (duelFps.min != null && duelFps.min < 45) issue('high', 'rendimiento', 'FPS mínimo por debajo de 45 en duelo', 'min=' + duelFps.min + ' avg=' + duelFps.avg);
    if (info.v2.has.assetsArena) {
      const as = arenaAssets && arenaAssets.stats;
      record('AS03', 'Assets', 'Variante de arena por área',
        as && as.arenaActive === true ? 'PASS' : 'FAIL',
        JSON.stringify(as || null));
    } else {
      record('AS03', 'Assets', 'Variante de arena por área', 'BLOCKED', 'V2.assets.applyArenaVariant no está en el build');
    }
    const duelIndexBeforePause = (await s.state()).questionIndex;
    await s.press('Escape');
    const pausedOk = await s.waitFor("window.__gameState().screen === 'pause'", 4000);
    await s.click('#screen [data-action="close-pause"]', 500);
    const resumedOk = await s.waitFor("window.__gameState().screen === 'duel'", 4000);
    const duelIndexAfterPause = (await s.state()).questionIndex;
    record('H03', 'Pausa', 'Pausa en duelo y reanudación en la misma pregunta',
      pausedOk && resumedOk && duelIndexBeforePause === duelIndexAfterPause ? 'PASS' : 'FAIL',
      'pausa=' + pausedOk + ' reanuda=' + resumedOk + ' índice ' + duelIndexBeforePause + '→' + duelIndexAfterPause);
    await pauseAndAbandon(s);
    await resultContinue(s);
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);

    /* Misión de 5 preguntas: feedback V2 y ataque */
    await s.seed(saveMission);
    await s.enterHubFromTitle();
    await openJournalMission(s, 'area-psi-salud-publica', 'mission-sp-1');
    const duelStartState = await s.state();
    const q1 = await currentQuestion(s);
    if (!q1) throw new Error('No se pudo identificar la pregunta del duelo');
    record('C01', 'Campaña', 'Misión de campaña con 5 preguntas',
      duelStartState && duelStartState.questionTotal === 5 ? 'PASS' : 'FAIL',
      'questionTotal=' + (duelStartState && duelStartState.questionTotal) + ' mission=' + (duelStartState && duelStartState.activeMissionId));

    /* Etiqueta difícil en la pregunta */
    await s.click('#screen [data-action="toggle-question-tag"][data-tag="difficult"][data-question="' + q1.id + '"]', 350);
    const tagSave = await s.readSave();
    record('L01', 'Repaso', 'Marca «difícil» en una pregunta',
      tagSave && tagSave.questionTags && tagSave.questionTags[q1.id] && tagSave.questionTags[q1.id].difficult ? 'PASS' : 'FAIL',
      'qid=' + q1.id + ' tags=' + JSON.stringify(tagSave && tagSave.questionTags));

    const wrong = (q1.options || []).map((o) => o.id).find((x) => x !== q1.answer);
    if (!wrong) throw new Error('La pregunta no tiene una opción incorrecta');
    await answerAndWait(s, wrong, 40);
    const fbWrong = await feedbackInfo(s);
    const eventsBeforeShot = await s.ev("(window.__V2 && window.__V2.events ? window.__V2.events.slice(-10).map(function(e){return e.type;}) : [])");
    await hideFeedbackOverlay(s);
    await sleep(140);
    await s.shot('ataque-1-territorio');
    await showFeedbackOverlay(s);
    await sleep(220);
    await s.setViewport(960, 540);
    await sleep(400);
    const feedbackErrorShot = await s.shot('feedback-error');
    const feedbackErrorSize = pngSize(feedbackErrorShot);
    await s.setViewport(WIDTH, HEIGHT);
    await sleep(400);
    const fbWrong2 = await feedbackInfo(s);
    const wrongOk = !!fbWrong.v2Open && fbWrong.kind === 'wrong'
      && fbWrong.answer === q1.answer
      && String(fbWrong.text).indexOf(q1.answer) !== -1
      && (q1.explanation ? String(fbWrong.text).indexOf(q1.explanation.slice(0, 40)) !== -1 : true)
      && fbWrong.hasExplanation && fbWrong.hasContinue;
    record('F01', 'Feedback', 'Feedback de error con clave y explicación',
      wrongOk ? 'PASS' : 'FAIL',
      'kind=' + fbWrong.kind + ' clave=' + fbWrong.answer + '/' + q1.answer + ' explicacion=' + fbWrong.hasExplanation + ' why=' + fbWrong.hasWhy + ' flash=' + fbWrong.hasFlash + ' tipo DOM=' + (fbWrong2.kind || '—') + ' · captura=' + feedbackErrorSize.w + '×' + feedbackErrorSize.h,
      { values: { kind: fbWrong.kind, answer: fbWrong.answer, expected: q1.answer, events: eventsBeforeShot, screenshot: feedbackErrorShot, screenshotSize: feedbackErrorSize } });
    if (!wrongOk) {
      issue('high', 'integracion', 'El feedback de error V2 no muestra clave/explicación',
        'kind=' + fbWrong.kind + ' answer=' + fbWrong.answer + ' expected=' + q1.answer + ' text=' + String(fbWrong.text || '').slice(0, 300));
    }
    if (info.v2.has.combatGuardian) {
      const attackEvents = await s.ev(`(() => {
        const list = (window.__V2 && window.__V2.events) || [];
        return list.slice(-30).map(function (e) {
          if (!e || e.type !== 'combat' || !e.payload) return null;
          return e.payload.type || null;
        }).filter(Boolean);
      })()`);
      const guardianEvents = (attackEvents || []).filter((t) => t === 'guardianTelegraph' || t === 'guardianImpact');
      record('C02', 'Combate', 'Ataque visual del guardián (territorio)',
        guardianEvents.length > 0 ? 'PASS' : 'FAIL',
        'eventos=' + JSON.stringify(guardianEvents) + ' · cola=' + JSON.stringify(attackEvents.slice(-8)) + ' · captura agent7-' + SHOT_PREFIX + '-ataque-1-territorio.png');
      if (!guardianEvents.length) issue('medium', 'integracion', 'El ataque del guardián no emite eventos de combate', 'payloads=' + JSON.stringify(attackEvents) + ' · V2.events tail=' + JSON.stringify(eventsBeforeShot));
    } else {
      record('C02', 'Combate', 'Ataque visual del guardián', 'BLOCKED', 'V2.combat.guardianAttack no está en el build');
    }

    /* Flashcard del feedback */
    if (fbWrong.hasFlash) {
      await s.click('[data-action="v2-feedback-flashcard"]', 400);
      const flash = await s.ev(`(() => { const f=document.querySelector('.v2-flashcard'); return f ? { open:true, text:String(f.innerText||'').slice(0,700) } : { open:false }; })()`);
      await s.shot('flashcard');
      record('F02', 'Feedback', 'Flashcard local desde el feedback',
        flash.open && /Ficha de estudio/.test(flash.text) ? 'PASS' : 'FAIL', 'open=' + flash.open + ' text=' + flash.text.slice(0, 120));
      await s.click('[data-action="v2-flashcard-close"]', 350);
    } else {
      record('F02', 'Feedback', 'Flashcard local desde el feedback', 'BLOCKED', 'El feedback no ofrece «Ver en flashcard»');
    }

    await continueFeedback(s);
    await s.waitFor("window.__gameState().questionIndex === 1", 5000);
    const q2 = await currentQuestion(s);
    if (!q2) throw new Error('No hay segunda pregunta');
    await answerAndWait(s, q2.answer, 300);
    const fbCorrect = await feedbackInfo(s);
    await s.setViewport(960, 540);
    await sleep(400);
    const feedbackCorrectShot = await s.shot('feedback-acierto');
    const feedbackCorrectSize = pngSize(feedbackCorrectShot);
    await s.setViewport(WIDTH, HEIGHT);
    await sleep(400);
    const correctOk = !!fbCorrect.v2Open && fbCorrect.kind === 'correct' && fbCorrect.answer === q2.answer && fbCorrect.hasExplanation;
    record('F03', 'Feedback', 'Feedback de acierto con clave',
      correctOk ? 'PASS' : 'FAIL',
      'kind=' + fbCorrect.kind + ' clave=' + fbCorrect.answer + '/' + q2.answer + ' explicacion=' + fbCorrect.hasExplanation + ' · captura=' + feedbackCorrectSize.w + '×' + feedbackCorrectSize.h,
      { values: { screenshot: feedbackCorrectShot, screenshotSize: feedbackCorrectSize } });
    if (!correctOk) issue('high', 'integracion', 'El feedback de acierto V2 no muestra la clave esperada', JSON.stringify(fbCorrect).slice(0, 500));
    await continueFeedback(s);

    /* Q3–Q5 correctas */
    for (let idx = 2; idx < 5; idx++) {
      await s.waitFor("window.__gameState().questionIndex === " + idx, 5000);
      const q = await currentQuestion(s);
      if (!q) throw new Error('No hay pregunta en índice ' + idx);
      await answerAndWait(s, q.answer, 260);
      const fb = await feedbackInfo(s);
      if (!fb.v2Open || fb.kind !== 'correct') issue('medium', 'integracion', 'Feedback inesperado en pregunta ' + (idx + 1), JSON.stringify(fb).slice(0, 300));
      await continueFeedback(s);
    }

    await s.waitFor("window.__gameState().screen === 'result'", 7000);
    const resultState = await s.state();
    await sleep(400);
    await s.shot('resultado-mision');
    const missionSave = await s.readSave();
    const missionRec = missionSave && missionSave.missions ? missionSave.missions['mission-sp-1'] : null;
    record('C03', 'Campaña', 'Cierre de misión con resultado y premios',
      resultState && resultState.lastResultPass === true && resultState.score === 400 && missionRec && missionRec.completedAt ? 'PASS' : 'FAIL',
      'screen=' + (resultState && resultState.screen) + ' pass=' + (resultState && resultState.lastResultPass) + ' score=' + (resultState && resultState.score) + ' mission=' + JSON.stringify(missionRec));
    if (!(resultState && resultState.lastResultPass === true)) issue('high', 'regresion', 'La misión no se cerró como superada', JSON.stringify(resultState));
    if (missionRec && missionRec.completedAt && !missionSave.xp) issue('medium', 'regresion', 'La misión no otorgó XP', JSON.stringify({ xp: missionSave.xp, coins: missionSave.coins }));

    /* Persistencia de la misión tras recargar */
    await s.reload();
    const missionReload = await s.readSave();
    record('P01', 'Persistencia', 'Misión completada sobrevive a la recarga',
      missionReload && missionReload.missions && missionReload.missions['mission-sp-1'] && missionReload.missions['mission-sp-1'].completedAt ? 'PASS' : 'FAIL',
      'missions=' + Object.keys(missionReload && missionReload.missions || {}).length + ' xp=' + (missionReload && missionReload.xp) + ' coins=' + (missionReload && missionReload.coins));

    /* Modos y práctica libre */
    await s.enterHubFromTitle();
    await s.press('KeyG');
    await s.waitFor("window.__gameState().screen === 'modes'", 5000);
    const modeCards = await s.ev("[...document.querySelectorAll('#screen .modeCard h2')].map(e => e.textContent.trim())");
    await s.shot('modos');
    record('G01', 'Modos', 'Pantalla de modos con diario, supervivencia, contrarreloj y simulacro',
      Array.isArray(modeCards) && modeCards.length >= 4 ? 'PASS' : 'FAIL', JSON.stringify(modeCards));
    await s.click('#screen [data-action="open-practice"]', 500);
    await s.waitFor("window.__gameState().screen === 'practicePicker'", 5000);
    const practiceAreas = await s.ev("[...document.querySelectorAll('#screen [data-action=start-practice]')].map(e => e.getAttribute('data-area'))");
    record('G02', 'Modos', 'Práctica libre por área', Array.isArray(practiceAreas) && practiceAreas.length === 5 ? 'PASS' : 'FAIL', JSON.stringify(practiceAreas));
    await s.click('#screen [data-action="start-practice"][data-area="area-psi-salud-publica"]', 1300);
    await s.waitFor("window.__gameState().screen === 'duel'", 6000);
    const practiceState = await s.state();
    const pq = await currentQuestion(s);
    record('G03', 'Modos', 'Sesión de práctica libre sin corazones de campaña',
      practiceState && practiceState.mode === 'practice' ? 'PASS' : 'FAIL',
      'mode=' + (practiceState && practiceState.mode) + ' total=' + (practiceState && practiceState.questionTotal));
    if (pq) {
      await answerAndWait(s, pq.answer, 300);
      await continueFeedback(s);
    }
    await pauseAndAbandon(s);
    await resultContinue(s);
    if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);

    /* Tienda e inventario */
    await s.seed(saveShop);
    await s.enterHubFromTitle();
    await s.click('#hud [data-action="open-shop"]', 600);
    await s.waitFor("window.__gameState().screen === 'shop'", 5000);
    const shopCoinsBefore = (await s.state()).coins;
    await s.shot('tienda');
    await s.click('#screen [data-action="shop-item"][data-id="c-cabeza-gorro"]', 350);
    await s.click('#screen [data-action="shop-buy"][data-id="c-cabeza-gorro"]', 350);
    const confirmShown = await s.has('#screen [data-action="shop-confirm"][data-id="c-cabeza-gorro"]');
    await s.click('#screen [data-action="shop-confirm"][data-id="c-cabeza-gorro"]', 600);
    const shopSave = await s.readSave();
    const bought = shopSave && shopSave.collection.ownedCosmeticIds.indexOf('c-cabeza-gorro') !== -1;
    record('SH01', 'Tienda', 'Compra de cosmético con confirmación y saldo',
      confirmShown && bought && shopSave.coins === shopCoinsBefore - 90 ? 'PASS' : 'FAIL',
      'monedas ' + shopCoinsBefore + '→' + (shopSave && shopSave.coins) + ' · gorro=' + bought + ' · confirm=' + confirmShown);
    if (!bought) issue('high', 'regresion', 'La compra en la tienda no se aplicó', JSON.stringify({ coins: shopSave && shopSave.coins, owned: shopSave && shopSave.collection.ownedCosmeticIds }));
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
    record('W01', 'Inventario', 'Equipar y guardar atuendo',
      !!(equipped && equipped.cabeza === 'c-cabeza-gorro') ? 'PASS' : 'FAIL',
      'equipped=' + JSON.stringify(equipped || null) + ' hero=' + (wardrobeSave && wardrobeSave.collection.selectedCharacterId));
    if (!(equipped && equipped.cabeza === 'c-cabeza-gorro')) issue('high', 'regresion', 'El atuendo no se guardó', JSON.stringify(equipped || null));

    await s.reload();
    const persistSave = await s.readSave();
    const persistOk = persistSave && persistSave.coins === shopSave.coins
      && persistSave.collection.ownedCosmeticIds.indexOf('c-cabeza-gorro') !== -1
      && persistSave.collection.equipped
      && persistSave.collection.equipped[persistSave.collection.selectedCharacterId] && persistSave.collection.equipped[persistSave.collection.selectedCharacterId].cabeza === 'c-cabeza-gorro';
    record('P02', 'Persistencia', 'Compra y atuendo sobreviven a la recarga',
      persistOk ? 'PASS' : 'FAIL',
      'coins=' + (persistSave && persistSave.coins) + ' ownedGorro=' + (persistSave && persistSave.collection.ownedCosmeticIds.indexOf('c-cabeza-gorro') !== -1) + ' equipped=' + JSON.stringify(persistSave && persistSave.collection.equipped));

    /* Importación de partida antigua + repaso */
    await s.seed(saveFull);
    await s.click('#screen [data-action="open-import"]', 700);
    await s.waitFor("window.__gameState().screen === 'import'", 5000);
    const previewLegacy = await analyzeImportText(s, legacyFixtureText);
    await s.shot('importar-antigua');
    await confirmImportAndWait(s);
    const importedLegacy = await s.readSave();
    const legacyErrors = importedLegacy ? Object.keys(importedLegacy.errors || {}).length : -1;
    results.imports.legacy = {
      preview: previewLegacy,
      expected: { name: 'Offline QA', xp: 1640, coins: 2510, stage: 3, errors: 3 },
      actual: importedLegacy ? {
        name: importedLegacy.profile.name, xp: importedLegacy.xp, coins: importedLegacy.coins, stage: importedLegacy.stage,
        errors: legacyErrors, importedFrom: importedLegacy.importedFrom, importedAt: importedLegacy.importedAt,
        heroes: importedLegacy.collection.ownedCharacterIds.length, cosmetics: importedLegacy.collection.ownedCosmeticIds.length
      } : null
    };
    const legacyOk = importedLegacy && importedLegacy.profile.name === 'Offline QA' && importedLegacy.xp === 1640
      && importedLegacy.coins === 2510 && importedLegacy.stage === 3 && legacyErrors === 3;
    record('IM01', 'Importación', 'Partida antigua offline-fixture importada por la UI',
      legacyOk ? 'PASS' : 'FAIL',
      'name=' + (importedLegacy && importedLegacy.profile.name) + ' xp=' + (importedLegacy && importedLegacy.xp) + ' coins=' + (importedLegacy && importedLegacy.coins) + ' stage=' + (importedLegacy && importedLegacy.stage) + ' errors=' + legacyErrors + ' · preview=' + (previewLegacy && previewLegacy.name + ' ' + JSON.stringify(previewLegacy.grid)));
    if (!legacyOk) issue('high', 'regresion', 'La importación de la partida antigua no coincide con el fixture', JSON.stringify(results.imports.legacy).slice(0, 800));

    await s.reload();
    const legacyReload = await s.readSave();
    record('P03', 'Persistencia', 'Partida antigua importada sobrevive a la recarga',
      legacyReload && legacyReload.xp === 1640 && legacyReload.coins === 2510 && legacyReload.profile.name === 'Offline QA' ? 'PASS' : 'FAIL',
      'name=' + (legacyReload && legacyReload.profile.name) + ' xp=' + (legacyReload && legacyReload.xp) + ' coins=' + (legacyReload && legacyReload.coins));

    await s.enterHubFromTitle();
    await s.press('KeyR');
    const reviewOpen = await s.waitFor("window.__gameState().screen === 'review'", 5000);
    const reviewText = await s.ev("(document.querySelector('#screen') || {}).innerText || ''");
    const dueCount = await s.ev(`(() => { const b=document.querySelector('#screen [data-action="start-review"][data-mode="due"]'); return b ? { disabled: !!b.disabled, text: String(b.textContent||'').trim() } : null; })()`);
    record('R01', 'Repaso', 'Pantalla de repaso y sesión con errores vencidos',
      reviewOpen && dueCount && !dueCount.disabled ? 'PASS' : 'FAIL',
      'due=' + JSON.stringify(dueCount) + ' · text=' + reviewText.slice(0, 160));
    if (reviewOpen && dueCount && !dueCount.disabled) {
      await s.click('#screen [data-action="start-review"][data-mode="due"]', 1300);
      await s.waitFor("window.__gameState().screen === 'duel'", 6000);
      const reviewState = await s.state();
      const rq = await currentQuestion(s);
      record('R02', 'Repaso', 'Sesión de repaso con las preguntas falladas',
        reviewState && reviewState.mode === 'review' && reviewState.questionTotal >= 1 ? 'PASS' : 'FAIL',
        'mode=' + (reviewState && reviewState.mode) + ' total=' + (reviewState && reviewState.questionTotal));
      if (rq) {
        await answerAndWait(s, rq.answer, 300);
        await continueFeedback(s);
      }
      await pauseAndAbandon(s);
      await resultContinue(s);
      if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
      await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    }

    /* Exportar y reimportar el guardado nuevo */
    await s.seed(saveFull);
    await openSettingsFromTitle(s);
    await s.ev(`(() => {
      if (!window.__qaOrigCreate) {
        window.__qaOrigCreate = URL.createObjectURL.bind(URL);
        window.__qaBlobs = [];
        URL.createObjectURL = function (blob) { window.__qaBlobs.push(blob); return window.__qaOrigCreate(blob); };
      }
      return true;
    })()`);
    await s.click('#screen [data-action="export-save"]', 0);
    await sleep(1200);
    let exportText = null;
    let exportMethod = 'download';
    try {
      const files = fs.readdirSync(DOWNLOADS).filter((f) => /^serums-quest-observatorio-.*\.json$/.test(f)).sort();
      if (files.length) exportText = fs.readFileSync(path.join(DOWNLOADS, files[files.length - 1]), 'utf8');
    } catch (e) {}
    if (!exportText) {
      exportMethod = 'blob-capturado';
      exportText = await s.ev("(async () => { const b = window.__qaBlobs && window.__qaBlobs[window.__qaBlobs.length - 1]; return b ? await b.text() : null; })()", true);
    }
    if (!exportText) throw new Error('No se pudo capturar la exportación');
    const exportPayload = JSON.parse(exportText);
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-exported-save.json'), exportText, 'utf8');
    const exportCounts = countsOfSave(exportPayload.state);
    const exportOk = exportPayload.app === 'SERUMS QUEST VOXEL' && Number(exportPayload.saveSchema) === 2
      && exportCounts.xp === 6200 && exportCounts.coins === 999 && exportCounts.missions === 18 && exportCounts.cosmetics === 69;
    record('IM02', 'Exportación', 'Exportar respaldo JSON desde Ajustes',
      exportOk ? 'PASS' : 'FAIL',
      'vía=' + exportMethod + ' app=' + exportPayload.app + ' schema=' + exportPayload.saveSchema + ' xp=' + exportCounts.xp + ' coins=' + exportCounts.coins + ' nodos=' + exportCounts.missions + ' cosméticos=' + exportCounts.cosmetics,
      { values: { exportPath: path.join(EVIDENCE, 'agent7-exported-save.json'), method: exportMethod } });
    if (!exportOk) issue('high', 'regresion', 'La exportación no contiene el guardado esperado', JSON.stringify(exportCounts));
    await s.click('#screen [data-action="open-import"]', 700);
    await s.waitFor("window.__gameState().screen === 'import'", 5000);
    const previewExport = await analyzeImportText(s, exportText);
    await confirmImportAndWait(s);
    const reimported = await s.readSave();
    const reimportedCounts = countsOfSave(reimported);
    const reimportOk = reimportedCounts.xp === exportCounts.xp && reimportedCounts.coins === exportCounts.coins
      && reimportedCounts.missions === exportCounts.missions && reimportedCounts.cosmetics === exportCounts.cosmetics
      && reimportedCounts.selectedCharacterId === exportCounts.selectedCharacterId
      && compareWeights(reimportedCounts.weights, exportCounts.weights);
    results.imports.exportRoundTrip = { exported: exportCounts, reimported: reimportedCounts, preview: previewExport };
    record('IM03', 'Exportación', 'Reimportar el guardado nuevo y comparar XP/monedas/marcas',
      reimportOk ? 'PASS' : 'FAIL',
      'xp ' + exportCounts.xp + '→' + reimportedCounts.xp + ' · coins ' + exportCounts.coins + '→' + reimportedCounts.coins + ' · nodos ' + exportCounts.missions + '→' + reimportedCounts.missions + ' · cosméticos ' + exportCounts.cosmetics + '→' + reimportedCounts.cosmetics + ' · héroe ' + exportCounts.selectedCharacterId + '→' + reimportedCounts.selectedCharacterId + ' · pesos=' + JSON.stringify(reimportedCounts.weights));
    if (!reimportOk) issue('high', 'regresion', 'La reimportación del guardado nuevo no conserva XP/monedas/marcas', JSON.stringify(results.imports.exportRoundTrip).slice(0, 900));
    await s.reload();
    const reimportedReload = countsOfSave(await s.readSave());
    record('P04', 'Persistencia', 'Reimportación sobrevive a la recarga',
      reimportedReload.xp === exportCounts.xp && reimportedReload.coins === exportCounts.coins && reimportedReload.missions === exportCounts.missions ? 'PASS' : 'FAIL',
      'xp=' + reimportedReload.xp + ' coins=' + reimportedReload.coins + ' nodos=' + reimportedReload.missions);

    /* Capturas de Checkpoint 1 (solo pasada final o --captures) */
    if (CAPTURES) {
      await s.seed(saveFull);
      await openSettingsFromTitle(s);
      if (await s.has('#screen [data-v2-feedback-settings]')) {
        await s.setValue('#screen [data-v2-weight="campaign"]', '70');
        await sleep(450);
        await s.ev(`(() => { const el = document.querySelector('#screen [data-v2-feedback-settings]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); return true; })()`);
        await sleep(450);
      }
      await s.shot('ajustes-pesos');
      await s.click('#screen [data-action="close-settings"]', 600);
      await s.waitFor("window.__gameState().screen === 'title'", 5000);
      await s.shot('titulo-version');
      await s.enterHubFromTitle();
      await sleep(900);
      await s.shot('atrio');
      await s.press('KeyH');
      await s.waitFor("window.__gameState().screen === 'heroes'", 5000);
      await sleep(1500);
      await s.shot('selector-heroes');
      await s.press('Escape');
      await s.waitFor("window.__gameState().screen === 'hub'", 5000);

      /* Selector con estados En ruta / Comprar / Bloqueado */
      await s.seed(saveHeroStates);
      await s.enterHubFromTitle();
      await s.press('KeyH');
      await s.waitFor("window.__gameState().screen === 'heroes'", 5000);
      await sleep(1400);
      const readHeroCta = () => s.ev(`(() => {
        const center = document.querySelector('.v2-carousel-card.is-center');
        const cta = center ? center.querySelector('.v2-hero-cta') : null;
        return {
          id: center ? center.getAttribute('data-v2-id') : null,
          ctaClass: cta ? cta.className : '',
          ctaText: cta ? String(cta.textContent || '').trim() : '',
          pos: ((document.querySelector('[data-v2-pos]') || {}).textContent || '').trim()
        };
      })()`);
      const stateEnRuta = await readHeroCta();
      await s.shot('selector-en-ruta');
      await s.click('#screen [data-action="v2-hero-next"]', 650);
      const stateComprar = await readHeroCta();
      await s.shot('selector-comprar');
      await s.click('#screen [data-action="v2-hero-next"]', 650);
      const stateBloqueado = await readHeroCta();
      await s.shot('selector-bloqueado');
      const heroStatesOk = /is-current/.test(stateEnRuta.ctaClass) && /en ruta/i.test(stateEnRuta.ctaText)
        && /is-buy/.test(stateComprar.ctaClass) && /comprar/i.test(stateComprar.ctaText)
        && /is-blocked/.test(stateBloqueado.ctaClass) && /bloqueado/i.test(stateBloqueado.ctaText);
      record('S02', 'Héroes', 'Estados del selector: En ruta, Comprar y Bloqueado',
        heroStatesOk ? 'PASS' : 'FAIL',
        JSON.stringify({ enRuta: stateEnRuta, comprar: stateComprar, bloqueado: stateBloqueado }));
      if (!heroStatesOk) issue('medium', 'integracion', 'El selector V2 no muestra los tres estados esperados', JSON.stringify({ enRuta: stateEnRuta, comprar: stateComprar, bloqueado: stateBloqueado }));
      await s.press('Escape');
      await s.waitFor("window.__gameState().screen === 'hub'", 5000);

      /* Ataque de los cinco guardianes */
      await s.seed(saveFull);
      await s.enterHubFromTitle();
      const areas = [
        { areaId: 'area-psi-salud-publica', mission: 'mission-sp-1', name: 'territorio' },
        { areaId: 'area-psi-cuidado-integral', mission: 'mission-ci-1', name: 'cuidado' },
        { areaId: 'area-psi-etica', mission: 'mission-et-1', name: 'confianza' },
        { areaId: 'area-psi-investigacion', mission: 'mission-in-1', name: 'evidencia' },
        { areaId: 'area-psi-gestion', mission: 'mission-ge-1', name: 'sistema' }
      ];
      const attackEvidence = [];
      for (let i = 0; i < areas.length; i++) {
        if (i > 0) {
          await s.seed(saveFull);
          await s.enterHubFromTitle();
        }
        await openJournalMission(s, areas[i].areaId, areas[i].mission);
        const q = await currentQuestion(s);
        if (!q) throw new Error('Sin pregunta para ataque en ' + areas[i].name);
        const wrong = (q.options || []).map((o) => o.id).find((x) => x !== q.answer);
        await answerAndWait(s, wrong, 40);
        await hideFeedbackOverlay(s);
        await sleep(160);
        const shotName = await s.shot('ataque-' + (i + 1) + '-' + areas[i].name);
        await showFeedbackOverlay(s);
        await sleep(120);
        const evCount = await s.ev(`(() => {
          const list = (window.__V2 && window.__V2.events) || [];
          return list.slice(-30).filter(function (e) { return e && e.type === 'combat' && e.payload && (e.payload.type === 'guardianTelegraph' || e.payload.type === 'guardianImpact'); }).length;
        })()`);
        attackEvidence.push({ area: areas[i].name, shot: shotName, events: evCount });
        await continueFeedback(s);
        await pauseAndAbandon(s);
        await resultContinue(s);
        await s.waitFor("window.__gameState().screen === 'hub'", 5000);
      }
      record('CP-ATTACKS', 'Capturas', 'Ataque de los 5 guardianes', attackEvidence.every((x) => x.events > 0) ? 'PASS' : 'FAIL', JSON.stringify(attackEvidence));

      /* Assets de las cinco islas + mapa completo */
      await s.seed(saveFull);
      await s.enterHubFromTitle();
      await s.press('KeyM');
      await s.waitFor("window.__gameState().screen === 'map'", 6000);
      await sleep(1500);
      await s.shot('mapa-completo');
      const areas2 = await s.ev("[...document.querySelectorAll('#screen [data-action=map-area]')].map(e => e.getAttribute('data-area'))");
      for (let i = 0; i < areas2.length; i++) {
        await s.click('#screen [data-action="map-area"][data-area="' + areas2[i] + '"]', 1200);
        await s.shot('isla-' + (i + 1) + '-' + areas2[i].replace('area-psi-', ''));
      }
    }

    /* Cierre: red, errores, V2 */
    const finalInfo = await pageInfo(s);
    results.v2.final = finalInfo.v2;
    results.v2.eventsTail = finalInfo.v2.events;
    const nonLocal = s.requests.filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url));
    const counts = { file: 0, data: 0, blob: 0, about: 0, chrome: 0, other: 0 };
    s.requests.forEach((r) => {
      const m = /^([a-z]+):/i.exec(r.url);
      const scheme = m ? m[1].toLowerCase() : 'other';
      counts[scheme] = (counts[scheme] || 0) + 1;
    });
    results.network = { total: s.requests.length, nonLocal: nonLocal, allowed: counts };
    const errorList = s.errors.slice();
    const v2Errors = finalInfo.v2.errors || [];
    results.errors = { total: errorList.length, items: errorList.slice(0, 40), v2Count: v2Errors.length };
    results.v2.errors = v2Errors;
    results.failedLoads = s.failedLoads.slice(0, 20);
    results.warningsTotal = s.warnings.length;
    results.warnings = s.warnings.slice(0, 40);
    record('N01', 'Red', 'Cero peticiones de red',
      nonLocal.length === 0 ? 'PASS' : 'FAIL',
      nonLocal.length + ' no locales de ' + s.requests.length + ' totales · esquemas=' + JSON.stringify(counts));
    if (nonLocal.length) issue('high', 'regresion', 'Hay peticiones de red en el juego', nonLocal.slice(0, 10).map((r) => r.url).join(', '));
    record('N02', 'Errores', 'Cero errores de consola y excepciones',
      errorList.length === 0 ? 'PASS' : 'FAIL',
      errorList.length + ' errores · ' + errorList.slice(0, 3).map((e) => String(e.text || e.description || '').slice(0, 100)).join(' | '));
    if (errorList.length) issue('high', 'regresion', 'La consola registra errores/excepciones', JSON.stringify(errorList.slice(0, 6)).slice(0, 900));
    const uniqueWarnings = Array.from(new Set(s.warnings.map((w) => String(w.text || ''))));
    record('N02b', 'Errores', 'Advertencias de consola (no bloqueantes)',
      uniqueWarnings.length ? 'NOTE' : 'PASS',
      s.warnings.length + ' advertencias · ' + (uniqueWarnings.length ? uniqueWarnings.join(' | ').slice(0, 600) : 'ninguna'));
    record('N03', 'Errores', 'V2._errors vacío',
      v2Errors.length === 0 ? 'PASS' : 'FAIL',
      v2Errors.length + ' errores V2' + (v2Errors.length ? ' · ' + JSON.stringify(v2Errors.slice(0, 4)) : ''));
    if (v2Errors.length) issue('high', 'integracion', 'V2.call/módulos acumulan errores', JSON.stringify(v2Errors.slice(0, 6)).slice(0, 900));

    const distEnd = distInfo();
    results.meta.distEnd = distEnd;
    if (distEnd.sha256 !== distStart.sha256) {
      issue('high', 'qa-harness', 'dist/index.html cambió durante la pasada', 'inicio=' + distStart.sha256 + ' fin=' + distEnd.sha256 + '; repetir con el build estable');
      record('N04', 'Entorno', 'Build estable durante la pasada', 'FAIL', 'El hash cambió: ' + distStart.sha256.slice(0, 12) + ' → ' + distEnd.sha256.slice(0, 12));
    } else {
      record('N04', 'Entorno', 'Build estable durante la pasada', 'PASS', distStart.sha256);
    }
    results.meta.fpsNote = results.meta.swiftShader
      ? 'El entorno headless de esta pasada usa SwiftShader; el FPS no representa una GPU real.'
      : 'El entorno headless usa la GPU del host (' + results.meta.gpu + ').';
  } catch (error) {
    console.error('FATAL', error && error.stack || error);
    results.fatal = String(error && error.stack || error);
    issue('critical', 'qa-harness', 'La pasada se detuvo', String(error && error.message || error));
    if (s) {
      results.network = { total: s.requests.length, nonLocal: s.requests.filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url)), allowed: {} };
      results.errors = { total: s.errors.length, items: s.errors.slice(0, 30) };
      results.failedLoads = s.failedLoads.slice(0, 20);
      results.warningsTotal = s.warnings.length;
      results.warnings = s.warnings.slice(0, 40);
    }
  } finally {
    try {
      const finalInfo = await pageInfo(s);
      results.v2.final = finalInfo.v2;
      results.v2.eventsTail = finalInfo.v2.events;
    } catch (e) {}
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
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-qa.json'), JSON.stringify(results, null, 2), 'utf8');
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-report.md'), buildReport(), 'utf8');
  } catch (e) { console.error('No se pudo escribir la evidencia', e); }
  console.log('RESUMEN', JSON.stringify({ pass: PASS, cases: summary, fps: { hub: results.fps.hub && { min: results.fps.hub.min, avg: results.fps.hub.avg }, map: results.fps.map && { min: results.fps.map.min, avg: results.fps.map.avg }, duel: results.fps.duel && { min: results.fps.duel.min, avg: results.fps.duel.avg } }, network: results.network && results.network.nonLocal && results.network.nonLocal.length, errors: results.errors && results.errors.total, issues: results.issues.length }, null, 2));
  if (summary.fail || results.fatal) process.exitCode = 1;
})();
