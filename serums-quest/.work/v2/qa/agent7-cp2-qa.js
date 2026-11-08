'use strict';
/* =========================================================================
   SERUMS QUEST · V2 · Agente 7 · QA Checkpoint 2 (mundo interactivo)
   Arnés autónomo por CDP. No modifica el juego: siembra localStorage,
   conduce la UI/API del mundo, mide y captura.

   Uso:
     node .work/v2/qa/agent7-cp2-qa.js
     node .work/v2/qa/agent7-cp2-qa.js --report-only

   Salidas:
     .work/v2/evidence/agent7-cp2-qa.json
     .work/v2/evidence/agent7-cp2-report.md
     .work/v2/evidence/agent7-cp2-*.png
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
const PORT = 9390;
const PROFILE = path.join(QA_DIR, 'agent7-cp2-profile-' + PORT);
const DOWNLOADS = path.join(QA_DIR, 'agent7-cp2-downloads');
const SHOT_PREFIX = 'cp2';
const WIDTH = 1280;
const HEIGHT = 720;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const emptySave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-empty.json'), 'utf8'));
const dueSave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-due.json'), 'utf8'));
const lowSave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-low.json'), 'utf8'));
const masterySave = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-world-mastery-etica.json'), 'utf8'));
const legacyText = fs.readFileSync(path.join(ROOT, '.work', 'offline-fixture.json'), 'utf8');
const saveFull = JSON.parse(fs.readFileSync(path.join(QA_DIR, 'save-full.json'), 'utf8'));

const deepClone = (value) => JSON.parse(JSON.stringify(value));
const saveShop = deepClone(lowSave);
saveShop.coins = 500;
saveShop.xp = 0;
saveShop.stage = 1;
saveShop.missions = {};
saveShop.questions = {};
saveShop.errors = {};
saveShop.academic = { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: {}, recent: [] };
saveShop.collection = { ownedCharacterIds: ['ilan', 'noa'], ownedCosmeticIds: [], selectedCharacterId: 'noa', equipped: {} };
const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const capSave = deepClone(emptySave);
capSave.counters = { date: todayKey, coins: 120, xp: 0, sessions: 0 };
const saveMission = deepClone(lowSave);
saveMission.coins = 120;
saveMission.xp = 0;
saveMission.stage = 1;
saveMission.missions = {};
saveMission.questions = {};
saveMission.errors = {};

const results = {
  meta: {},
  summary: {},
  cases: [],
  issues: [],
  fps: {},
  shots: [],
  world: {},
  regression: {},
  artifacts: {},
  network: {},
  errors: {},
  warnings: [],
  warningsTotal: 0
};
let cdp = null;

function distInfo(file) {
  const target = file || DIST;
  const buf = fs.readFileSync(target);
  return {
    path: target,
    bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    mtime: fs.statSync(target).mtime.toISOString()
  };
}
function pngSize(file) {
  try {
    const b = fs.readFileSync(file);
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch (e) { return { w: null, h: null, error: String(e) }; }
}
function slug(text) {
  return String(text || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}
function record(id, area, title, status, detail, extra) {
  const item = Object.assign({ id, area, title, status, detail: detail || '', evidence: [] }, extra || {});
  results.cases.push(item);
  console.log('[' + status + '] ' + id + ' · ' + title + (detail ? ' :: ' + detail : ''));
  return item;
}
function issue(severity, kind, title, detail) {
  results.issues.push({ severity, kind, title, detail: detail || '', at: new Date().toISOString() });
  console.log('[ISSUE:' + severity + '] ' + title + ' :: ' + (detail || ''));
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

async function launch() {
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
    pathToFileURL(DIST).href
  ], { stdio: 'ignore', windowsHide: true });
  const page = await waitForTarget();
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
        kind: 'exception', at: new Date().toISOString(), text: String(d.text || ''),
        description: String((d.exception && d.exception.description) || ''),
        url: String(d.url || ''), line: d.lineNumber
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
    await sleep(260);
  }
  async function shot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = path.join(EVIDENCE, 'agent7-' + SHOT_PREFIX + '-' + slug(name) + '.png');
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
    results.shots.push(file);
    return file;
  }
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
    await ev(`(() => {
      ${JSON.stringify([SAVE_KEY, SETTINGS_KEY].concat(AUX_KEYS))}.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      localStorage.setItem(${JSON.stringify(SAVE_KEY)}, ${JSON.stringify(JSON.stringify(save))});
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
    await sleep(650);
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
    const out = { label, seconds, screen: last && last.screen, samples };
    if (values.length) {
      out.min = Math.min.apply(null, values);
      out.max = Math.max.apply(null, values);
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
  return { proc, ws, send, ev, waitFor, click, clickIf, has, setValue, press, shot, state, readSave, readSettingsKey, reload, seed, enterHubFromTitle, setViewport, collectFps, dismissBanners, skipTutorial, errors, warnings, requests, failedLoads };
}

/* ------------------------------------------------------------- page probes */
async function pageInfo(s) {
  return s.ev(`(() => {
    const V = window.__V2 || null;
    const st = window.__gameState ? window.__gameState() : null;
    const w = V && V.world;
    const glCanvas = document.createElement('canvas');
    let gl = { ok: false };
    try {
      const g = glCanvas.getContext('webgl2') || glCanvas.getContext('webgl');
      if (g) {
        const d = g.getExtension('WEBGL_debug_renderer_info');
        gl = { ok: true, vendor: d ? g.getParameter(d.UNMASKED_VENDOR_WEBGL) : g.getParameter(g.VENDOR), renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER) };
      }
    } catch (e) { gl = { ok: false, error: String(e) }; }
    return {
      screen: st && st.screen, state: st, title: document.title,
      titleVersion: (document.querySelector('.titleVersion') || {}).textContent || '',
      version: V && V.version,
      world: !!w,
      worldApi: w ? { interact: typeof w.interact === 'function', stats: typeof w.stats === 'function', ids: !!w.ids, close: typeof w.close === 'function', isOpen: typeof w.isOpen === 'function' } : null,
      gl, dpr: window.devicePixelRatio, viewport: { w: window.innerWidth, h: window.innerHeight }
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
      open: true,
      eyebrow: q('.v2-world-eyebrow'), title: q('.v2-world-title'),
      body: body ? String(body.innerText || '') : '',
      foot: (root.querySelector('#v2w-foot') || {}).innerText || '',
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
async function readState(s) {
  return s.ev(`(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(SAVE_KEY)}) || 'null'); } catch (e) { return null; } })()`);
}
async function currentQuestion(s) {
  return s.ev(`(() => {
    const btn = document.querySelector('[data-action="toggle-question-tag"][data-tag="difficult"]');
    const id = btn && btn.getAttribute('data-question');
    const q = id && window.CAMPAIGN_DATA && window.CAMPAIGN_DATA.questions ? window.CAMPAIGN_DATA.questions[id] : null;
    if (!q) return null;
    return { id: q.id, answer: q.answer, stem: q.stem, explanation: q.explanation, areaId: q.areaId, options: (q.options || []).map(function (o) { return { id: o.id, text: o.text }; }) };
  })()`);
}
async function answerAndWait(s, letter, waitMs) {
  await s.click('#screen [data-action="answer"][data-letter="' + letter + '"]', 0);
  const ok = await s.waitFor("!!document.querySelector('.v2-feedback[data-v2-feedback], .feedbackStrip')", 4500);
  if (!ok) throw new Error('No apareció feedback tras responder ' + letter);
  await sleep(waitMs == null ? 280 : waitMs);
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
    return r;
  })()`);
}
async function continueFeedback(s) {
  if (await s.has('[data-action="v2-feedback-continue"]')) await s.click('[data-action="v2-feedback-continue"]', 450);
  else if (await s.has('#screen [data-action="next-question"]')) await s.click('#screen [data-action="next-question"]', 450);
  else throw new Error('No hay botón para continuar el feedback');
  await sleep(350);
}
async function openJournalMission(s, areaId, missionId) {
  const screen = await s.ev("window.__gameState().screen");
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
    return { name: ((p.querySelector('.previewName') || {}).textContent || '').trim(), grid: grid, text: String(p.innerText || '').slice(0, 1200) };
  })()`);
}
async function confirmImportAndWait(s) {
  await s.click('#screen [data-action="import-confirm"]', 900);
  const ok = await s.waitFor("['title','hub'].indexOf(window.__gameState().screen) !== -1", 7000);
  if (!ok) throw new Error('La importación no volvió al título/atrio');
  await sleep(500);
  await s.dismissBanners();
}
function todayFromNode() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/* --------------------------------------------------------------- report */
function buildReport() {
  const count = (st) => results.cases.filter((c) => c.status === st).length;
  const md = [];
  md.push('# SERUMS QUEST · V2 · Informe QA Agente 7 · Checkpoint 2');
  md.push('');
  md.push('- **Pasada:** final Checkpoint 2 · mundo interactivo');
  md.push('- **Inicio/fin:** ' + results.meta.startedAt + ' → ' + results.meta.finishedAt);
  if (results.artifacts && results.artifacts.dist) {
    md.push('- **dist/index.html:** `' + results.artifacts.dist.sha256 + '` · ' + results.artifacts.dist.bytes + ' B · mtime ' + results.artifacts.dist.mtime);
    md.push('- **export/serums-quest.html:** `' + (results.artifacts.export && results.artifacts.export.sha256) + '` · ' + (results.artifacts.export && results.artifacts.export.bytes) + ' B · igual al dist: ' + (results.artifacts.sameHash ? 'sí' : 'NO'));
  }
  md.push('- **Entorno:** ' + (results.meta.chrome || '—') + ' · GPU: ' + (results.meta.gpu || '—') + ' · ' + (results.meta.viewport ? results.meta.viewport.w + '×' + results.meta.viewport.h : '—') + ' · DPR ' + (results.meta.viewport ? results.meta.viewport.dpr : '—'));
  md.push('- **Resultado:** ' + count('PASS') + ' PASS · ' + count('FAIL') + ' FAIL · ' + count('BLOCKED') + ' BLOCKED · ' + count('SKIP') + ' SKIP · ' + count('NOTE') + ' NOTE (de ' + results.cases.length + ' casos)');
  md.push('- **Red principal:** ' + ((results.network && results.network.nonLocal) || []).length + ' no locales de ' + (results.network ? results.network.total : 0) + ' · **Errores:** ' + (results.errors.total || 0) + ' · **V2._errors:** ' + (results.errors.v2Count || 0));
  md.push('');
  const cell = (t, max) => String(t == null ? '' : t).replace(/\r?\n/g, ' ').replace(/\|/g, '/').slice(0, max || 500);
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
  md.push('| Escena | Calidad | Mínimo | Medio | Muestras | <45 | Evidencia |');
  md.push('| --- | --- | --- | --- | --- | --- | --- |');
  ['hubIdle', 'hubPanel', 'map', 'duel'].forEach((key) => {
    const f = results.fps[key];
    if (!f) return;
    md.push('| ' + key + ' | ' + (f.quality || 'alto') + ' | ' + (f.min == null ? '—' : f.min) + ' | ' + (f.avg == null ? '—' : f.avg) + ' | ' + (f.samples ? f.samples.length : 0) + ' | ' + (f.below45 == null ? '—' : f.below45) + ' | agent7-cp2-qa.json → fps.' + key + ' |');
  });
  md.push('');
  const fpsVals = ['hubIdle', 'hubPanel', 'map', 'duel'].map((k) => results.fps[k] && results.fps[k].values ? k + ' = [' + results.fps[k].values.join(', ') + ']' : null).filter(Boolean);
  if (fpsVals.length) { md.push('Muestras (`window.__gameState().fps` cada ~120 ms): ' + fpsVals.join(' · ') + '.'); md.push(''); }
  md.push('Objetivo: medio ≥ 55 y mínimo ≥ 45. ' + (results.meta.fpsNote || ''));
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
    md.push('- Export HTML (file://): mundo=' + (ex.stats && ex.stats.built ? 'construido' : 'NO') + ' · cofre=abierto · no locales=' + ((ex.nonLocal || []).length) + ' · errores=' + ((ex.errors || []).length) + ' · warnings=' + ((ex.warnings || []).length) + '.');
  }
  if (results.artifacts && results.artifacts.hubRedirect) {
    const hr = results.artifacts.hubRedirect;
    md.push('- HUB index → dist/index.html: redirect=' + (/\/dist\/index\.html$/.test(hr.path || '') ? 'sí' : 'NO') + ' · juego=' + !!hr.game + ' · no locales=' + ((hr.nonLocal || []).length) + ' · errores=' + ((hr.errors || []).length) + '.');
  }
  const warnTotal = results.warningsTotal || (results.warnings || []).length;
  if (warnTotal) {
    const uniq = Array.from(new Set((results.warnings || []).map((w) => String(w.text || ''))));
    md.push('- Advertencias de consola: ' + warnTotal + ' · ' + uniq.map((w) => '`' + w.slice(0, 220) + '`').join(' · '));
  }
  md.push('');
  if (results.world) {
    const w = results.world;
    const kinds = {};
    ((w.ids && w.ids.all) || []).forEach((x) => { kinds[x.kind] = (kinds[x.kind] || 0) + 1; });
    const pers = w.persistence || {};
    const before = pers.before || {};
    const after = pers.after || {};
    const cnt = (obj) => obj && {
      chests: obj.chests && obj.chests.opened,
      fragments: obj.fragments && obj.fragments.collected,
      guides: obj.guides && obj.guides.completed
    };
    md.push('## Mundo interactivo');
    md.push('');
    md.push('- IDs: ' + JSON.stringify(kinds) + ' · ' + ((w.ids && w.ids.all) || []).length + ' entradas.');
    md.push('- Censo inicial: ' + JSON.stringify(w.initial && w.initial.counts) + ' · marcadores=' + JSON.stringify(w.initial && w.initial.markers));
    md.push('- Culling: rango ' + (w.culling && w.culling.config && w.culling.config.range) + ' / banda ' + (w.culling && w.culling.config && w.culling.config.fadeBand) + ' · ocultos en spawn=' + (w.culling && w.culling.fadedAtSpawn) + '/' + (w.culling && w.culling.items && w.culling.items.length) + ' · captura `agent7-cp2-atrio-culling.png`.');
    md.push('- Persistencia tras recarga: ' + JSON.stringify(cnt(before)) + ' → ' + JSON.stringify(cnt(after)) + ' · xp/coins iguales.');
    md.push('- Sombra/repaso: antes=' + JSON.stringify(w.shadowReview && w.shadowReview.before && { active: w.shadowReview.before.active, dueTotal: w.shadowReview.before.dueTotal }) + ' · después=' + JSON.stringify(w.shadowReview && w.shadowReview.after && { active: w.shadowReview.after.active, dueTotal: w.shadowReview.after.dueTotal }) + ' · errores guardados=' + (w.shadowReview && w.shadowReview.errorsStored) + ' · botón de repaso antes=' + JSON.stringify(w.shadowReview && w.shadowReview.dueBtn) + ' · telescopio tras repaso=' + JSON.stringify(w.shadowReview && w.shadowReview.telescopeAfter));
    md.push('- Restauración: nivel 0 = ' + JSON.stringify(w.restoration && w.restoration.low && w.restoration.low.levels) + ' · nivel 3 Ética = ' + JSON.stringify(w.restoration && w.restoration.mastery && w.restoration.mastery.levels) + ' · visuals=' + JSON.stringify(w.restoration && w.restoration.mastery && w.restoration.mastery.visuals));
    md.push('- Tope diario: ' + JSON.stringify(w.dailyCap && { before: w.dailyCap.before && { coins: w.dailyCap.before.coins, xp: w.dailyCap.before.xp, counters: w.dailyCap.before.counters }, after: w.dailyCap.after && { coins: w.dailyCap.after.coins, xp: w.dailyCap.after.xp, counters: w.dailyCap.after.counters }, chest: w.dailyCap.chest }));
    const rt = w.exportRoundTrip || {};
    if (rt.exported) {
      md.push('- Export/import: entradas por bucket=' + JSON.stringify({ chests: Object.keys(rt.exported.chests || {}).length, fragments: Object.keys(rt.exported.fragments || {}).length, guides: Object.keys(rt.exported.guides || {}).length, stations: Object.keys(rt.exported.stations || {}).length, visited: Object.keys(rt.exported.visited || {}).length }) + ' · reimportado=' + JSON.stringify(rt.reimported && cnt(rt.reimported)) + ' (guias completadas) · preview=' + (rt.preview && rt.preview.name));
    }
    md.push('');
    md.push('Datos completos: `agent7-cp2-qa.json` (mundo, capturas y muestras FPS).');
    md.push('');
  }
  if (results.regression && Object.keys(results.regression).length) {
    md.push('## Regresión e importación');
    md.push('');
    md.push('```json');
    md.push(JSON.stringify(results.regression, null, 2).slice(0, 8000));
    md.push('```');
    md.push('');
  }
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
  md.push(count('FAIL') || count('BLOCKED') ? 'Hay casos FAIL/BLOCKED: revisar arriba; no se presentan como PASS.' : 'Sin FAIL/BLOCKED. Revisar las capturas y confirmar el veredicto del Checkpoint 2.');
  md.push('');
  md.push('_Informe generado por `agent7-cp2-qa.js`. No se modificó el juego._');
  return md.join('\n');
}

/* ------------------------------------------------------------------ main */
(async () => {
  if (process.argv.indexOf('--report-only') !== -1) {
    const raw = JSON.parse(fs.readFileSync(path.join(EVIDENCE, 'agent7-cp2-qa.json'), 'utf8'));
    Object.assign(results, raw);
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-cp2-report.md'), buildReport(), 'utf8');
    console.log('Informe cp2 regenerado');
    return;
  }
  const startedAt = new Date();
  const distStart = distInfo(DIST);
  const exportStart = distInfo(EXPORT);
  results.artifacts = {
    dist: distStart,
    export: exportStart,
    sameHash: distStart.sha256 === exportStart.sha256 && distStart.bytes === exportStart.bytes,
    hubIndex: { path: HUB_INDEX, bytes: fs.statSync(HUB_INDEX).size }
  };
  results.meta = { startedAt: startedAt.toISOString(), buildId: distStart.sha256.slice(0, 12), width: WIDTH, height: HEIGHT };
  console.log('CP2 · dist ' + distStart.sha256.slice(0, 12) + ' · ' + distStart.bytes + ' B · export ' + exportStart.bytes + ' B');
  const s = await launch();
  cdp = s;
  try {
    const bv = await s.send('Browser.getVersion');
    results.meta.chrome = bv.product + ' (' + bv.revision + ')';
    const boot = await (async () => {
      await s.seed(emptySave);
      if (!(await s.ev("window.__gameState && window.__gameState().screen === 'title'"))) await s.reload();
      return pageInfo(s);
    })();
    results.meta.viewport = { w: boot.viewport.w, h: boot.viewport.h, dpr: boot.dpr };
    results.meta.gpu = boot.gl.ok ? boot.gl.renderer : 'sin WebGL';
    results.meta.swiftShader = /swiftshader|llvmpipe|software/i.test(String(results.meta.gpu));
    results.meta.fpsNote = results.meta.swiftShader
      ? 'El entorno usa SwiftShader; las cifras no representan una GPU real.'
      : 'GPU real del host (' + results.meta.gpu + '), 1280×720 y DPR 1.';
    record('ART01', 'Artefactos', 'dist/index.html y export/serums-quest.html: tamaño, hash y buildId',
      results.artifacts.sameHash && distStart.bytes === 3173871 && distStart.sha256.indexOf('b32f14899538') === 0 ? 'PASS' : 'FAIL',
      'dist=' + distStart.bytes + ' B/' + distStart.sha256 + ' · export=' + exportStart.bytes + ' B/' + exportStart.sha256,
      { values: results.artifacts });
    if (!results.artifacts.sameHash) issue('high', 'artefacto', 'dist y export no son idénticos', JSON.stringify(results.artifacts));
    const hubText = fs.readFileSync(HUB_INDEX, 'utf8');
    const hubTarget = /dist\\?\//.test(hubText) || hubText.indexOf('dist/index.html') !== -1;
    record('ART02', 'Artefactos', 'Enlace del HUB (serums-quest/index.html → dist/index.html)',
      hubTarget ? 'PASS' : 'FAIL', hubText.indexOf('dist/index.html') !== -1 ? 'target dist/index.html presente' : 'target ausente');

    record('E00', 'Entorno', 'Chrome headless, perfil limpio y GPU',
      boot.screen === 'title' && boot.gl.ok ? 'PASS' : 'FAIL',
      results.meta.chrome + ' · ' + results.meta.gpu + ' · DPR ' + boot.dpr + ' · ' + boot.viewport.w + '×' + boot.viewport.h);
    record('T01', 'Título', 'Versión visible V2 · Final',
      String(boot.titleVersion).indexOf('V2 · Final') !== -1 ? 'PASS' : 'FAIL',
      'titleVersion="' + boot.titleVersion + '" · document.title="' + boot.title + '"');
    record('T02', 'API', 'V2.world expone interact/stats/ids/close/isOpen',
      boot.world && boot.worldApi && Object.keys(boot.worldApi).every((k) => boot.worldApi[k]) ? 'PASS' : 'FAIL',
      JSON.stringify(boot.worldApi));
    await s.shot('titulo-version');

    /* Entrada al atrio y censo del mundo */
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1200);
    const hubInfo = await pageInfo(s);
    const w0 = await worldStats(s);
    const ids0 = await worldIds(s);
    results.world.ids = ids0;
    results.world.initial = w0;
    const idKinds = (ids0 && ids0.all || []).reduce((o, x) => { o[x.kind] = (o[x.kind] || 0) + 1; return o; }, {});
    record('W01', 'Mundo', 'Censo del mundo interactivo y API lista',
      w0 && w0.built && w0.ready && w0.chests.total === 5 && w0.fragments.total === 15 && w0.guides.total === 5 && w0.stations.total === 2 && w0.shadows.list.length === 5 ? 'PASS' : 'FAIL',
      'ids=' + JSON.stringify(idKinds) + ' · stats=' + JSON.stringify({ interactives: w0 && w0.counts.interactives, markers: w0 && w0.counts.markers, chests: w0 && w0.counts.chests, fragments: w0 && w0.counts.fragments, guides: w0 && w0.counts.guides, stations: w0 && w0.counts.stations, shadowSlots: w0 && w0.counts.shadowSlots }));
    await s.shot('atrio-mundo');
    const hero0 = (hubInfo.state && hubInfo.state.hero) || { x: 0, y: 3.3 };
    const cull = (w0.positions || []).filter((p) => p.active && p.kind !== 'shadow').map((p) => {
      const d = Math.sqrt(Math.pow(hero0.x - p.x, 2) + Math.pow(hero0.y - p.z, 2));
      return { id: p.id, kind: p.kind, d: Math.round(d * 100) / 100, fade: Math.max(0, Math.min(1, (w0.markers.range - d) / w0.markers.fadeBand)) };
    });
    const faded = cull.filter((c) => c.fade === 0).length;
    record('W02', 'Mundo', 'Culling de marcadores por distancia (configuración + atrio)',
      w0.markers.distanceCulling === true && w0.markers.range > 0 && w0.markers.fadeBand > 0 ? 'PASS' : 'FAIL',
      'total=' + w0.markers.total + ' rango=' + w0.markers.range + ' banda=' + w0.markers.fadeBand + ' · ocultos por distancia en spawn=' + faded + '/' + cull.length + ' · captura atrio-mundo');
    await s.shot('atrio-culling');
    results.world.culling = { config: w0.markers, hero: hero0, items: cull, fadedAtSpawn: faded };

    /* Biblioteca vacía */
    await openWorld(s, 'v2w-library');
    const emptyLib = await worldPanel(s);
    await s.shot('biblioteca-vacia');
    record('W03', 'Mundo', 'Biblioteca vacía',
      emptyLib && emptyLib.open && /Aún no hay fichas/.test(emptyLib.body) ? 'PASS' : 'FAIL',
      'title="' + (emptyLib && emptyLib.title) + '" · text=' + (emptyLib && emptyLib.body || '').slice(0, 160));
    await closeWorld(s);

    /* Cofre cerrado / abierto / repetido */
    const stateBeforeChest = await readState(s);
    await openWorld(s, 'v2w-chest-salud-publica');
    const chestClosed = await worldPanel(s);
    await s.shot('cofre-cerrado');
    record('W04', 'Mundo', 'Cofre cerrado: panel y botón Abrir',
      chestClosed && /Cofre de Salud pública/.test(chestClosed.title) && chestClosed.actions.indexOf('v2-world-chest-open') !== -1 ? 'PASS' : 'FAIL',
      'title="' + (chestClosed && chestClosed.title) + '" · acciones=' + JSON.stringify(chestClosed && chestClosed.actions));
    await clickWorld(s, 'v2-world-chest-open', 700);
    const chestOpen = await worldPanel(s);
    const stateAfterChest = await readState(s);
    const wAfterChest = await worldStats(s);
    await s.shot('cofre-abierto');
    const rewardsChest = (wAfterChest.rewards.log || []).filter((r) => r.id === 'v2w-chest-salud-publica' || r.id === 'v2w-frag-salud-publica-c');
    const chestOk = chestOpen && /Cofre abierto/.test(chestOpen.title)
      && stateAfterChest.xp === stateBeforeChest.xp + 10
      && stateAfterChest.coins === stateBeforeChest.coins + 5
      && wAfterChest.chests.opened === 1 && wAfterChest.fragments.chestCollected === 1;
    record('W05', 'Mundo', 'Cofre abierto: recompensa única + fragmento',
      chestOk ? 'PASS' : 'FAIL',
      'xp ' + stateBeforeChest.xp + '→' + stateAfterChest.xp + ' · coins ' + stateBeforeChest.coins + '→' + stateAfterChest.coins + ' · abiertos=' + wAfterChest.chests.opened + ' · fragmentosCofre=' + wAfterChest.fragments.chestCollected + ' · log=' + JSON.stringify(rewardsChest));
    if (!chestOk) issue('high', 'integracion', 'La recompensa del cofre no coincide con +10 XP/+5 monedas o no registra el fragmento', JSON.stringify({ before: stateBeforeChest && { xp: stateBeforeChest.xp, coins: stateBeforeChest.coins }, after: stateAfterChest && { xp: stateAfterChest.xp, coins: stateAfterChest.coins }, world: wAfterChest && { chests: wAfterChest.chests, fragments: wAfterChest.fragments, rewards: wAfterChest.rewards } }).slice(0, 1200));
    await closeWorld(s);
    await openWorld(s, 'v2w-chest-salud-publica');
    const chestRepeatPanel = await worldPanel(s);
    const stateAfterRepeat = await readState(s);
    await s.shot('cofre-reabierto');
    record('W06', 'Mundo', 'Cofre repetido no da recompensa (anti-farmeo)',
      chestRepeatPanel && chestRepeatPanel.actions.indexOf('v2-world-chest-open') === -1
        && stateAfterRepeat.xp === stateAfterChest.xp && stateAfterRepeat.coins === stateAfterChest.coins ? 'PASS' : 'FAIL',
      'xp=' + stateAfterRepeat.xp + ' coins=' + stateAfterRepeat.coins + ' acciones=' + JSON.stringify(chestRepeatPanel && chestRepeatPanel.actions));
    await closeWorld(s);

    /* Fragmento gratuito */
    const stateBeforeFrag = await readState(s);
    await openWorld(s, 'v2w-frag-salud-publica-1');
    const fragClosed = await worldPanel(s);
    await s.shot('fragmento-bloqueado');
    await clickWorld(s, 'v2-world-fragment-save', 700);
    const fragSaved = await worldPanel(s);
    const stateAfterFrag = await readState(s);
    const wAfterFrag = await worldStats(s);
    await s.shot('fragmento-guardado');
    const fragOk = fragClosed && fragClosed.actions.indexOf('v2-world-fragment-save') !== -1
      && fragSaved && fragSaved.actions.indexOf('v2-world-fragment-save') === -1
      && stateAfterFrag.xp === stateBeforeFrag.xp + 5
      && wAfterFrag.fragments.freeCollected >= 1 && wAfterFrag.fragments.collected >= 2;
    record('W07', 'Mundo', 'Fragmento gratuito: guardar +5 XP y desbloquear flashcard',
      fragOk ? 'PASS' : 'FAIL',
      'xp ' + stateBeforeFrag.xp + '→' + stateAfterFrag.xp + ' · fragmentos=' + wAfterFrag.fragments.collected + ' (libres=' + wAfterFrag.fragments.freeCollected + ', cofre=' + wAfterFrag.fragments.chestCollected + ')');
    if (!fragOk) issue('high', 'integracion', 'El fragmento no otorga +5 XP o no se registra', JSON.stringify({ before: stateBeforeFrag && stateBeforeFrag.xp, after: stateAfterFrag && stateAfterFrag.xp, fragments: wAfterFrag && wAfterFrag.fragments }).slice(0, 800));
    await closeWorld(s);
    await openWorld(s, 'v2w-frag-salud-publica-1');
    const fragRepeatPanel = await worldPanel(s);
    const stateAfterFragRepeat = await readState(s);
    record('W08', 'Mundo', 'Fragmento repetido no da XP (anti-farmeo)',
      fragRepeatPanel && fragRepeatPanel.actions.indexOf('v2-world-fragment-save') === -1 && stateAfterFragRepeat.xp === stateAfterFrag.xp ? 'PASS' : 'FAIL',
      'xp=' + stateAfterFragRepeat.xp + ' acciones=' + JSON.stringify(fragRepeatPanel && fragRepeatPanel.actions));
    await closeWorld(s);

    /* Guía 1–3 */
    const stateBeforeGuide = await readState(s);
    await openWorld(s, 'v2w-guide-salud-publica');
    const g1 = await worldPanel(s);
    await s.shot('guia-1');
    await clickWorld(s, 'v2-world-guide-next', 450);
    const g2 = await worldPanel(s);
    await s.shot('guia-2');
    await clickWorld(s, 'v2-world-guide-next', 450);
    const g3 = await worldPanel(s);
    const stateAfterGuide = await readState(s);
    const wAfterGuide = await worldStats(s);
    await s.shot('guia-3');
    const guideOk = g1 && /1 de 3/.test(g1.eyebrow) && g2 && /2 de 3/.test(g2.eyebrow) && g3 && /3 de 3/.test(g3.eyebrow)
      && stateAfterGuide.xp === stateBeforeGuide.xp + 5 && wAfterGuide.guides.completed === 1;
    record('W09', 'Mundo', 'Guía de 3 pantallas y recompensa +5 XP',
      guideOk ? 'PASS' : 'FAIL',
      'eyebrows=' + JSON.stringify([g1 && g1.eyebrow, g2 && g2.eyebrow, g3 && g3.eyebrow]) + ' · xp ' + stateBeforeGuide.xp + '→' + stateAfterGuide.xp + ' · completadas=' + wAfterGuide.guides.completed);
    if (!guideOk) issue('high', 'integracion', 'La guía no completa sus 3 pantallas o no da +5 XP', JSON.stringify({ g1: g1 && g1.eyebrow, g2: g2 && g2.eyebrow, g3: g3 && g3.eyebrow, before: stateBeforeGuide && stateBeforeGuide.xp, after: stateAfterGuide && stateAfterGuide.xp, guides: wAfterGuide && wAfterGuide.guides }).slice(0, 800));
    await closeWorld(s);
    await openWorld(s, 'v2w-guide-salud-publica');
    const guideAgain = await worldPanel(s);
    const stateGuideAgain = await readState(s);
    await s.shot('guia-completada');
    record('W10', 'Mundo', 'Guía repetida no da XP (anti-farmeo)',
      guideAgain && stateGuideAgain.xp === stateAfterGuide.xp ? 'PASS' : 'FAIL',
      'xp=' + stateGuideAgain.xp + ' · título="' + (guideAgain && guideAgain.title) + '" · body=' + String(guideAgain && guideAgain.body).slice(0, 160));
    await closeWorld(s);

    /* Todas las guías abren */
    const allGuideResults = [];
    for (const guide of (wAfterGuide.guides.list || [])) {
      const opened = await openWorld(s, guide.id);
      const panel = await worldPanel(s);
      allGuideResults.push({ id: guide.id, opened: !!opened && !!panel, title: panel && panel.title, eyebrow: panel && panel.eyebrow });
      await closeWorld(s);
    }
    record('W11', 'Mundo', 'Las 5 guías abren su panel',
      allGuideResults.length === 5 && allGuideResults.every((g) => g.opened) ? 'PASS' : 'FAIL',
      JSON.stringify(allGuideResults));

    /* Biblioteca con ficha y lector */
    await openWorld(s, 'v2w-library');
    const libraryWith = await worldPanel(s);
    const rows = await s.ev("document.querySelectorAll('.v2-world-overlay.is-open [data-action=v2-world-library-read]').length");
    await s.shot('biblioteca-ficha');
    record('W12a', 'Mundo', 'Biblioteca con fichas desbloqueadas',
      libraryWith && rows >= 2 && /fichas/.test(libraryWith.body) ? 'PASS' : 'FAIL',
      'filas=' + rows + ' · body=' + String(libraryWith && libraryWith.body).slice(0, 220));
    if (rows > 0) {
      await clickWorld(s, 'v2-world-library-read', 550);
      const reader = await worldPanel(s);
      await s.shot('lector');
      record('W12b', 'Mundo', 'Lector local de flashcard',
        reader && /Flashcard ·/.test(reader.eyebrow) && /CLAVE/.test(reader.body) && /Fuente:/.test(reader.body) ? 'PASS' : 'FAIL',
        'eyebrow="' + (reader && reader.eyebrow) + '" · body=' + String(reader && reader.body).slice(0, 260));
      if (!(reader && /CLAVE/.test(reader.body))) issue('high', 'integracion', 'El lector de flashcard no muestra clave/fuente', JSON.stringify(reader).slice(0, 700));
    } else {
      record('W12b', 'Mundo', 'Lector local de flashcard', 'BLOCKED', 'No hay filas de biblioteca');
    }
    await closeWorld(s);

    /* Persistencia del mundo tras recarga */
    const beforeReload = await worldStats(s);
    const beforeReloadState = await readState(s);
    await s.reload();
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1200);
    const afterReload = await worldStats(s);
    const afterReloadState = await readState(s);
    const persistenceOk = beforeReload.chests.opened === afterReload.chests.opened
      && beforeReload.fragments.collected === afterReload.fragments.collected
      && beforeReload.guides.completed === afterReload.guides.completed
      && beforeReloadState.xp === afterReloadState.xp && beforeReloadState.coins === afterReloadState.coins;
    record('W13', 'Persistencia', 'v2.world persiste tras recargar',
      persistenceOk ? 'PASS' : 'FAIL',
      'chests ' + beforeReload.chests.opened + '→' + afterReload.chests.opened + ' · fragments ' + beforeReload.fragments.collected + '→' + afterReload.fragments.collected + ' · guides ' + beforeReload.guides.completed + '→' + afterReload.guides.completed + ' · xp ' + beforeReloadState.xp + '→' + afterReloadState.xp + ' · coins ' + beforeReloadState.coins + '→' + afterReloadState.coins);
    if (!persistenceOk) issue('high', 'integracion', 'El estado v2.world o las recompensas no persisten tras recargar', JSON.stringify({ before: beforeReload && { chests: beforeReload.chests, fragments: beforeReload.fragments, guides: beforeReload.guides }, after: afterReload && { chests: afterReload.chests, fragments: afterReload.fragments, guides: afterReload.guides } }).slice(0, 1200));
    results.world.persistence = { before: beforeReload, after: afterReload };

    /* Exportar y reimportar incluyendo v2.world (estamos en el atrio) */
    await openSettingsFromHub(s);
    await s.ev(`(() => { if (!window.__qaBlobOrig) { window.__qaBlobOrig = URL.createObjectURL.bind(URL); window.__qaBlobs = []; URL.createObjectURL = function (b) { window.__qaBlobs.push(b); return window.__qaBlobOrig(b); }; } return true; })()`);
    await s.click('#screen [data-action="export-save"]', 0);
    await sleep(1200);
    let exportText = null;
    let exportMethod = 'download';
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
    const exportedWorld = payload.state && payload.state.v2 && payload.state.v2.world;
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-cp2-exported-save.json'), exportText, 'utf8');
    const exportWorldOk = !!(exportedWorld && exportedWorld.chests && exportedWorld.chests['v2w-chest-salud-publica']
      && exportedWorld.fragments['v2w-frag-salud-publica-1'] && exportedWorld.guides['area-psi-salud-publica']);
    record('W14a', 'Exportación', 'El JSON exportado incluye v2.world',
      exportWorldOk ? 'PASS' : 'FAIL',
      'vía=' + exportMethod + ' · chests=' + Object.keys(exportedWorld && exportedWorld.chests || {}).length + ' · fragments=' + Object.keys(exportedWorld && exportedWorld.fragments || {}).length + ' · guides=' + Object.keys(exportedWorld && exportedWorld.guides || {}).length);
    if (!exportWorldOk) issue('high', 'integracion', 'La exportación no incluye el estado v2.world', JSON.stringify(exportedWorld || null).slice(0, 800));
    await s.click('#screen [data-action="open-import"]', 700);
    await s.waitFor("window.__gameState().screen === 'import'", 5000);
    const previewNew = await analyzeImportText(s, exportText);
    await s.shot('importar-nuevo');
    await confirmImportAndWait(s);
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1200);
    const reimported = await worldStats(s);
    const reimportedState = await readState(s);
    const reimportOk = reimported.chests.opened === afterReload.chests.opened
      && reimported.fragments.collected === afterReload.fragments.collected
      && reimported.guides.completed === afterReload.guides.completed
      && reimportedState.xp === afterReloadState.xp && reimportedState.coins === afterReloadState.coins;
    record('W14b', 'Importación', 'Reimportar el guardado nuevo conserva v2.world y recompensas',
      reimportOk ? 'PASS' : 'FAIL',
      'preview=' + (previewNew && previewNew.name) + ' · chests=' + reimported.chests.opened + ' fragments=' + reimported.fragments.collected + ' guides=' + reimported.guides.completed + ' · xp=' + reimportedState.xp + ' coins=' + reimportedState.coins);
    if (!reimportOk) issue('high', 'integracion', 'La reimportación no conserva v2.world', JSON.stringify({ preview: previewNew, reimported: reimported && { chests: reimported.chests, fragments: reimported.fragments, guides: reimported.guides }, state: reimportedState && { xp: reimportedState.xp, coins: reimportedState.coins } }).slice(0, 1200));
    results.world.exportRoundTrip = { exported: exportedWorld, reimported: reimported && { chests: reimported.chests, fragments: reimported.fragments, guides: reimported.guides }, preview: previewNew };

    /* Telescopio vacío / con repaso */
    await s.seed(emptySave);
    await s.enterHubFromTitle();
    await openWorld(s, 'v2w-telescope');
    const teleEmpty = await worldPanel(s);
    await s.shot('telescopio-vacio');
    const teleEmptyBtn = await s.ev("(() => { const b=document.querySelector('.v2-world-overlay.is-open [data-action=v2-world-review-open]'); return b?{disabled:!!b.disabled,text:String(b.textContent||'').trim()}:null; })()");
    record('W15', 'Mundo', 'Telescopio sin errores vencidos',
      teleEmpty && teleEmptyBtn && teleEmptyBtn.disabled === true && /sin errores/i.test(teleEmpty.body) ? 'PASS' : 'FAIL',
      'botón=' + JSON.stringify(teleEmptyBtn) + ' · body=' + String(teleEmpty && teleEmpty.body).slice(0, 160));
    await closeWorld(s);
    await s.seed(dueSave);
    await s.enterHubFromTitle();
    const dueStats = await worldStats(s);
    await openWorld(s, 'v2w-telescope');
    const teleDue = await worldPanel(s);
    await s.shot('telescopio-3');
    const teleDueBtn = await s.ev("(() => { const b=document.querySelector('.v2-world-overlay.is-open [data-action=v2-world-review-open]'); return b?{disabled:!!b.disabled,text:String(b.textContent||'').trim()}:null; })()");
    record('W16', 'Mundo', 'Telescopio con 3 errores vencidos',
      dueStats.shadows.active === 1 && teleDue && teleDueBtn && teleDueBtn.disabled === false && /3/.test(teleDue.body) ? 'PASS' : 'FAIL',
      'sombras=' + JSON.stringify(dueStats.shadows) + ' · botón=' + JSON.stringify(teleDueBtn));
    await closeWorld(s);

    /* Sombra con errores y repaso que la disipa */
    await s.shot('atrio-sombra');
    const shadowOpened = await openWorld(s, 'v2w-shadow-salud-publica');
    const shadowPanel = await worldPanel(s);
    await s.shot('sombra-errores');
    const shadowBodyOk = !!(shadowPanel && /3[\s\S]{0,12}errores vencidos/i.test(shadowPanel.body));
    record('W17', 'Mundo', 'Sombra del error activa con 3 errores vencidos',
      shadowOpened && shadowPanel && /Sombra del error/.test(shadowPanel.title) && shadowBodyOk && shadowPanel.actions.indexOf('v2-world-review-open') !== -1 ? 'PASS' : 'FAIL',
      'title="' + (shadowPanel && shadowPanel.title) + '" · body=' + String(shadowPanel && shadowPanel.body).slice(0, 220));
    if (!shadowBodyOk) issue('high', 'integracion', 'La sombra no refleja los 3 errores vencidos', JSON.stringify(shadowPanel).slice(0, 800));
    await clickWorld(s, 'v2-world-review-open', 900);
    await s.waitFor("window.__gameState().screen === 'review'", 6000);
    await s.shot('repaso-desde-sombra');
    const reviewScreen = await s.ev("(document.querySelector('#screen') || {}).innerText || ''");
    const dueBtn = await s.ev("(() => { const b=document.querySelector('#screen [data-action=start-review][data-mode=due]'); return b?{disabled:!!b.disabled,text:String(b.textContent||'').trim()}:null; })()");
    await s.click('#screen [data-action="start-review"][data-mode="due"]', 1200);
    await s.waitFor("window.__gameState().screen === 'duel'", 7000);
    const reviewState = await s.state();
    let reviewSteps = 0;
    while (reviewSteps < 6) {
      reviewSteps += 1;
      if (await s.ev("window.__gameState().screen === 'result'")) break;
      const q = await currentQuestion(s);
      if (!q) break;
      await answerAndWait(s, q.answer, 300);
      await continueFeedback(s);
    }
    await s.waitFor("window.__gameState().screen === 'result'", 7000);
    await sleep(400);
    await s.shot('repaso-resultado');
    await resultContinue(s);
    if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
    await s.waitFor("window.__gameState().screen === 'hub'", 6000);
    await sleep(2200);
    await s.ev('window.__V2.world.refreshShadows()');
    await sleep(600);
    const afterReview = await worldStats(s);
    const afterReviewState = await readState(s);
    const gameAfterReview = await s.state();
    await s.shot('atrio-sombra-disipada');
    await openWorld(s, 'v2w-telescope');
    const teleAfterReview = await worldPanel(s);
    const teleAfterReviewBtn = await s.ev("(() => { const b=document.querySelector('.v2-world-overlay.is-open [data-action=v2-world-review-open]'); return b?{disabled:!!b.disabled,text:String(b.textContent||'').trim()}:null; })()");
    await s.shot('telescopio-sin-errores');
    await closeWorld(s);
    const shadowCleared = afterReview.shadows.active === 0 && afterReview.shadows.dueTotal === 0 && gameAfterReview.dueReviews === 0
      && teleAfterReview && teleAfterReviewBtn && teleAfterReviewBtn.disabled === true && /sin errores vencidos/i.test(teleAfterReview.body);
    record('W18', 'Mundo', 'La sombra se disipa al completar el repaso',
      shadowCleared && reviewState && reviewState.mode === 'review' ? 'PASS' : 'FAIL',
      'review=' + JSON.stringify({ mode: reviewState && reviewState.mode, total: reviewState && reviewState.questionTotal, dueBtn: dueBtn, screenText: String(reviewScreen).slice(0, 100) }) + ' · sombras tras repaso=' + JSON.stringify(afterReview.shadows) + ' · dueReviews=' + (gameAfterReview && gameAfterReview.dueReviews) + ' · errores guardados=' + Object.keys(afterReviewState.errors || {}).length + ' · telescopio=' + JSON.stringify(teleAfterReviewBtn));
    if (!shadowCleared) issue('high', 'integracion', 'La sombra no se disipa tras completar el repaso', JSON.stringify({ shadows: afterReview.shadows, dueReviews: gameAfterReview && gameAfterReview.dueReviews, errors: Object.keys(afterReviewState.errors || {}).length }));
    results.world.shadowReview = { before: dueStats.shadows, after: afterReview.shadows, dueBtn: dueBtn, telescopeAfter: teleAfterReviewBtn, errorsStored: Object.keys(afterReviewState.errors || {}).length };

    /* Restauración 0 vs 3 (misma puerta de Ética) */
    await s.seed(lowSave);
    await s.enterHubFromTitle();
    const lowRest = await worldStats(s);
    await s.shot('restauracion-0');
    record('W19', 'Restauración', 'Restauración nivel 0 (misma puerta de Ética)',
      lowRest.restoration.total === 0 && Object.values(lowRest.restoration.levels).every((v) => v === 0) ? 'PASS' : 'FAIL',
      JSON.stringify(lowRest.restoration) + ' · captura restauracion-0');
    await s.seed(masterySave);
    await s.enterHubFromTitle();
    const masteryRest = await worldStats(s);
    await s.shot('restauracion-3-etica');
    const eticaLevel = masteryRest.restoration.levels['area-psi-etica'];
    record('W20', 'Restauración', 'Restauración nivel 3 en Ética (misma puerta)',
      eticaLevel === 3 && masteryRest.restoration.total >= 3 && masteryRest.restoration.visuals.vegetation > 0 && masteryRest.restoration.visuals.runes > 0 ? 'PASS' : 'FAIL',
      JSON.stringify(masteryRest.restoration) + ' · captura restauracion-3-etica');
    if (eticaLevel !== 3) issue('high', 'integracion', 'La restauración de Ética no alcanza nivel 3 con el fixture mastery-etica', JSON.stringify(masteryRest.restoration));
    results.world.restoration = { low: lowRest.restoration, mastery: masteryRest.restoration };

    /* Tope diario de monedas */
    await s.seed(capSave);
    await s.enterHubFromTitle();
    const capBefore = await readState(s);
    await openWorld(s, 'v2w-chest-cuidado-integral');
    await clickWorld(s, 'v2-world-chest-open', 700);
    const capPanel = await worldPanel(s);
    const capAfter = await readState(s);
    const capStats = await worldStats(s);
    await s.shot('tope-diario');
    const capChest = capStats.chests.list.find((c) => c.id === 'v2w-chest-cuidado-integral');
    const capOk = capAfter.coins === capBefore.coins && capAfter.xp === capBefore.xp + 10
      && capChest && capChest.coins === 0 && /tope diario/i.test(capPanel && capPanel.body);
    record('W21', 'Recompensas', 'Tope diario: XP sí, monedas no; sin farmeo',
      capOk ? 'PASS' : 'FAIL',
      'coins ' + capBefore.coins + '→' + capAfter.coins + ' · xp ' + capBefore.xp + '→' + capAfter.xp + ' · chest=' + JSON.stringify(capChest) + ' · counters=' + JSON.stringify(capAfter.counters));
    if (!capOk) issue('high', 'regresion', 'El tope diario de monedas no se respeta en las recompensas del mundo', JSON.stringify({ before: capBefore && { coins: capBefore.coins, xp: capBefore.xp }, after: capAfter && { coins: capAfter.coins, xp: capAfter.xp, counters: capAfter.counters }, chest: capChest }).slice(0, 900));
    await closeWorld(s);
    results.world.dailyCap = { before: capBefore && { coins: capBefore.coins, xp: capBefore.xp, counters: capBefore.counters }, after: capAfter && { coins: capAfter.coins, xp: capAfter.xp, counters: capAfter.counters }, chest: capChest };

    /* Paneles 960 y 390 */
    await s.seed(emptySave);
    await s.enterHubFromTitle();
    await openWorld(s, 'v2w-library');
    await s.setViewport(960, 540);
    const panel960 = await worldPanel(s);
    await s.shot('panel-960');
    record('W22', 'Responsive', 'Panel de mundo a 960×540',
      panel960 && panel960.open && panel960.panel && panel960.panel.w > 0 ? 'PASS' : 'FAIL',
      'panel=' + JSON.stringify(panel960 && panel960.panel) + ' body=' + JSON.stringify(panel960 && panel960.bodyBox) + ' shot=960×540');
    await closeWorld(s);
    await s.setViewport(390, 844);
    await openWorld(s, 'v2w-telescope');
    const panel390 = await worldPanel(s);
    const rotate = await s.ev("(() => { const r=document.querySelector('#rotatePrompt'); return r ? getComputedStyle(r).display !== 'none' : false; })()");
    await s.shot('panel-390');
    record('W23', 'Responsive', 'Panel de mundo a 390×844',
      panel390 && panel390.open ? 'PASS' : 'FAIL',
      'panel=' + JSON.stringify(panel390 && panel390.panel) + ' body=' + JSON.stringify(panel390 && panel390.bodyBox) + ' rotatePrompt=' + rotate + ' shot=390×844');
    if (!(panel390 && panel390.open)) issue('medium', 'regresion', 'El panel de mundo no se abre en 390×844', JSON.stringify(panel390));
    await closeWorld(s);
    await s.setViewport(WIDTH, HEIGHT);

    /* Regresión: título/menú, mapa, modos/práctica, campaña, pausa, tienda, ajustes */
    await s.seed(emptySave);
    const titleMenu = await s.ev("[...document.querySelectorAll('#screen .titleMenuBtn')].map(e => e.getAttribute('data-action'))");
    record('R01', 'Regresión', 'Menú de título completo',
      Array.isArray(titleMenu) && ['open-map', 'open-modes', 'open-wardrobe', 'open-shop', 'open-journal', 'open-settings', 'open-import'].every((a) => titleMenu.indexOf(a) !== -1) ? 'PASS' : 'FAIL',
      JSON.stringify(titleMenu));
    await s.enterHubFromTitle();
    await s.press('KeyM');
    await s.waitFor("window.__gameState().screen === 'map'", 6000);
    const mapAreas = await s.ev("[...document.querySelectorAll('#screen [data-action=map-area]')].map(e=>e.getAttribute('data-area'))");
    await s.shot('mapa');
    record('R02', 'Regresión', 'Mapa con 5 islas',
      mapAreas.length === 5 ? 'PASS' : 'FAIL', JSON.stringify(mapAreas));
    await s.click('#screen [data-action="map-close"]', 700);
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);
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
    if (practiceQ) { await answerAndWait(s, practiceQ.answer, 300); await continueFeedback(s); }
    await pauseAndAbandon(s);
    await resultContinue(s);
    if (await s.ev("window.__gameState().screen === 'modes'")) await s.press('Escape');
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    record('R03b', 'Regresión', 'Práctica libre: sesión, respuesta y cierre',
      practiceState && practiceState.mode === 'practice' ? 'PASS' : 'FAIL',
      'mode=' + (practiceState && practiceState.mode) + ' total=' + (practiceState && practiceState.questionTotal));

    /* Campaña de 5 preguntas, pausa y persistencia */
    await s.seed(saveMission);
    await s.enterHubFromTitle();
    await openJournalMission(s, 'area-psi-salud-publica', 'mission-sp-1');
    const missionStart = await s.state();
    const q1 = await currentQuestion(s);
    if (!q1) throw new Error('Sin pregunta de misión');
    await s.press('Escape');
    const paused = await s.waitFor("window.__gameState().screen === 'pause'", 4000);
    await s.click('#screen [data-action="close-pause"]', 500);
    const resumed = await s.waitFor("window.__gameState().screen === 'duel'", 4000);
    const idxPaused = (await s.state()).questionIndex;
    record('R05', 'Regresión', 'Pausa en duelo y reanudación',
      paused && resumed && idxPaused === 0 ? 'PASS' : 'FAIL', 'pausa=' + paused + ' reanuda=' + resumed + ' índice=' + idxPaused);
    const wrong = (q1.options || []).map((o) => o.id).find((x) => x !== q1.answer);
    await answerAndWait(s, wrong, 350);
    const fb = await feedbackInfo(s);
    await continueFeedback(s);
    for (let i = 1; i < 5; i++) {
      await s.waitFor("window.__gameState().questionIndex === " + i, 5000);
      const q = await currentQuestion(s);
      if (!q) throw new Error('Sin pregunta en índice ' + i);
      await answerAndWait(s, q.answer, 280);
      await continueFeedback(s);
    }
    await s.waitFor("window.__gameState().screen === 'result'", 7000);
    const missionResult = await s.state();
    const missionSave = await readState(s);
    await s.shot('mision-resultado');
    const missionRec = missionSave && missionSave.missions ? missionSave.missions['mission-sp-1'] : null;
    record('R04', 'Regresión', 'Campaña: misión de 5 preguntas, feedback y resultado',
      missionResult && missionResult.lastResultPass === true && missionResult.score === 400 && missionRec && missionRec.completedAt ? 'PASS' : 'FAIL',
      'questionTotal=' + (missionStart && missionStart.questionTotal) + ' · feedback=' + fb.kind + ' · pass=' + (missionResult && missionResult.lastResultPass) + ' · score=' + (missionResult && missionResult.score) + ' · mission=' + JSON.stringify(missionRec));
    if (!(missionResult && missionResult.lastResultPass === true)) issue('high', 'regresion', 'La misión de campaña no cerró como superada', JSON.stringify(missionResult));
    await s.reload();
    const missionPersist = await readState(s);
    record('R06', 'Persistencia', 'Misión de campaña persiste tras recargar',
      missionPersist && missionPersist.missions && missionPersist.missions['mission-sp-1'] && missionPersist.missions['mission-sp-1'].completedAt ? 'PASS' : 'FAIL',
      'missions=' + Object.keys(missionPersist && missionPersist.missions || {}).length + ' xp=' + (missionPersist && missionPersist.xp));

    /* Tienda e inventario */
    await s.seed(saveShop);
    await s.enterHubFromTitle();
    await s.click('#hud [data-action="open-shop"]', 600);
    await s.waitFor("window.__gameState().screen === 'shop'", 5000);
    const shopBefore = await readState(s);
    await s.shot('tienda');
    await s.click('#screen [data-action="shop-item"][data-id="c-cabeza-gorro"]', 350);
    await s.click('#screen [data-action="shop-buy"][data-id="c-cabeza-gorro"]', 350);
    const confirmShown = await s.has('#screen [data-action="shop-confirm"][data-id="c-cabeza-gorro"]');
    await s.click('#screen [data-action="shop-confirm"][data-id="c-cabeza-gorro"]', 600);
    const shopAfter = await readState(s);
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
    const wardrobeSave = await readState(s);
    const equipped = wardrobeSave && wardrobeSave.collection && wardrobeSave.collection.equipped && wardrobeSave.collection.equipped[wardrobeSave.collection.selectedCharacterId || 'noa'];
    record('R08', 'Regresión', 'Inventario: equipar y guardar atuendo',
      !!(equipped && equipped.cabeza === 'c-cabeza-gorro') ? 'PASS' : 'FAIL',
      'equipped=' + JSON.stringify(equipped || null));
    await s.reload();
    const shopPersist = await readState(s);
    const shopHero = shopPersist && shopPersist.collection ? shopPersist.collection.selectedCharacterId : null;
    const shopEquipped = shopPersist && shopPersist.collection && shopPersist.collection.equipped ? shopPersist.collection.equipped[shopHero] : null;
    record('R09', 'Persistencia', 'Compra y atuendo persisten tras recargar',
      shopPersist.coins === shopAfter.coins && !!(shopEquipped && shopEquipped.cabeza === 'c-cabeza-gorro') ? 'PASS' : 'FAIL',
      'coins=' + shopPersist.coins + ' equipped=' + JSON.stringify(shopPersist.collection.equipped));

    /* Ajustes: V2 Final, calidad y movimiento */
    await s.seed(emptySave);
    if (!(await s.ev("window.__gameState().screen === 'title'"))) await s.reload();
    await openSettingsFromTitle(s);
    const settingsFoot = await s.ev("(document.querySelector('#screen .settingsFoot') || {}).innerText || ''");
    const qualities = await s.ev("[...document.querySelectorAll('#screen [data-action=set-effects-quality]')].map(e=>e.getAttribute('data-quality'))");
    const weightsSection = await s.has('#screen [data-v2-feedback-settings]');
    await s.shot('ajustes');
    await s.click('#screen [data-action="set-effects-quality"][data-quality="bajo"]', 500);
    await s.reload();
    await openSettingsFromTitle(s);
    const lowState = await readState(s);
    const lowActive = await s.ev("((document.querySelector('#screen [data-action=set-effects-quality].is-active')||{}).getAttribute('data-quality'))||''");
    await s.click('#screen [data-action="set-effects-quality"][data-quality="alto"]', 500);
    await s.reload();
    await openSettingsFromTitle(s);
    const highState = await readState(s);
    const highActive = await s.ev("((document.querySelector('#screen [data-action=set-effects-quality].is-active')||{}).getAttribute('data-quality'))||''");
    await s.click('#screen [data-action="toggle-reduced-motion"]', 400);
    await s.reload();
    const rmState = await readState(s);
    const rmBody = await s.ev("document.body.classList.contains('reduced-motion')");
    await openSettingsFromTitle(s);
    await s.click('#screen [data-action="toggle-reduced-motion"]', 350);
    const settingsOk = settingsFoot.indexOf('V2 · Final') !== -1 && qualities.length === 3 && weightsSection
      && lowState.settings.effectsQuality === 'bajo' && lowActive === 'bajo'
      && highState.settings.effectsQuality === 'alto' && highActive === 'alto'
      && rmState.settings.reducedMotion === true && rmBody;
    record('R10', 'Regresión', 'Ajustes: versión V2 Final, calidad y reducir movimiento',
      settingsOk ? 'PASS' : 'FAIL',
      'foot="' + settingsFoot.slice(0, 100) + '" · qualities=' + JSON.stringify(qualities) + ' · pesos=' + weightsSection + ' · low=' + lowState.settings.effectsQuality + '/' + lowActive + ' · high=' + highState.settings.effectsQuality + '/' + highActive + ' · reduced=' + rmState.settings.reducedMotion + '/' + rmBody);

    /* Importación 1.2 */
    await s.seed(emptySave);
    if (!(await s.ev("window.__gameState().screen === 'title'"))) await s.reload();
    await s.click('#screen [data-action="open-import"]', 700);
    await s.waitFor("window.__gameState().screen === 'import'", 5000);
    const previewLegacy = await analyzeImportText(s, legacyText);
    await s.shot('importar-1-2');
    await confirmImportAndWait(s);
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1000);
    const legacyState = await readState(s);
    const legacyWorld = await worldStats(s);
    const legacyOk = legacyState && legacyState.profile.name === 'Offline QA' && legacyState.xp === 1640 && legacyState.coins === 2510
      && Object.keys(legacyState.errors || {}).length === 3 && legacyWorld.chests.opened === 0 && legacyWorld.fragments.collected === 0 && legacyWorld.guides.completed === 0;
    record('R11', 'Importación', 'Importar partida 1.2 y añadir v2.world vacío',
      legacyOk ? 'PASS' : 'FAIL',
      'preview=' + (previewLegacy && previewLegacy.name) + ' · xp=' + (legacyState && legacyState.xp) + ' coins=' + (legacyState && legacyState.coins) + ' errors=' + Object.keys(legacyState && legacyState.errors || {}).length + ' · mundo=' + JSON.stringify(legacyWorld && { chests: legacyWorld.chests.opened, fragments: legacyWorld.fragments.collected, guides: legacyWorld.guides.completed }));
    if (!legacyOk) issue('high', 'integracion', 'La importación 1.2 no deja el mundo vacío o no conserva XP/monedas/errores', JSON.stringify({ preview: previewLegacy, state: legacyState && { name: legacyState.profile.name, xp: legacyState.xp, coins: legacyState.coins, errors: Object.keys(legacyState.errors || {}).length }, world: legacyWorld && { chests: legacyWorld.chests, fragments: legacyWorld.fragments, guides: legacyWorld.guides } }).slice(0, 1000));
    await s.reload();
    const legacyReload = await readState(s);
    record('R12', 'Persistencia', 'Importación 1.2 persiste tras recargar',
      legacyReload && legacyReload.xp === 1640 && legacyReload.coins === 2510 ? 'PASS' : 'FAIL', 'xp=' + (legacyReload && legacyReload.xp) + ' coins=' + (legacyReload && legacyReload.coins));

    /* FPS: atrio en reposo, atrio con panel, mapa y duelo */
    await s.seed(emptySave);
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(1600);
    results.fps.hubIdle = await s.collectFps('hubIdle', 2.4);
    await openWorld(s, 'v2w-telescope');
    await sleep(500);
    results.fps.hubPanel = await s.collectFps('hubPanel', 2.4);
    await closeWorld(s);
    await s.press('KeyM');
    await s.waitFor("window.__gameState().screen === 'map'", 6000);
    await sleep(1600);
    results.fps.map = await s.collectFps('map', 2.4);
    await s.click('#screen [data-action="map-close"]', 700);
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    await openJournalMission(s, 'area-psi-salud-publica', 'mission-sp-1');
    await sleep(1600);
    results.fps.duel = await s.collectFps('duel', 2.4);
    await pauseAndAbandon(s);
    await resultContinue(s);
    await s.waitFor("window.__gameState().screen === 'hub'", 5000);
    const fpsChecks = [
      ['F01', 'hubIdle', 'Atrio en reposo (sin panel)'],
      ['F02', 'hubPanel', 'Atrio con mundo activo (panel de telescopio)'],
      ['F03', 'map', 'Mapa'],
      ['F04', 'duel', 'Duelo']
    ];
    fpsChecks.forEach(([id, key, title]) => {
      const f = results.fps[key];
      record(id, 'Rendimiento', 'FPS · ' + title,
        f && f.min != null && f.min >= 45 && f.avg >= 55 ? 'PASS' : 'FAIL',
        'min=' + (f && f.min) + ' avg=' + (f && f.avg) + ' muestras=' + (f && f.samples.length) + ' <45=' + (f && f.below45),
        { values: f });
      if (f && f.min != null && f.min < 45) issue('high', 'rendimiento', 'FPS mínimo <45 en ' + key, 'min=' + f.min + ' avg=' + f.avg);
    });

    /* Red/errores de la pasada principal */
    const nonLocal = s.requests.filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url));
    const schemes = { file: 0, data: 0, blob: 0, about: 0, chrome: 0, other: 0 };
    s.requests.forEach((r) => {
      const m = /^([a-z]+):/i.exec(r.url);
      const key = m ? m[1].toLowerCase() : 'other';
      schemes[key] = (schemes[key] || 0) + 1;
    });
    results.network = { total: s.requests.length, nonLocal, allowed: schemes };
    results.errors = { total: s.errors.length, items: s.errors.slice(0, 30), v2Count: 0 };
    results.warningsTotal = s.warnings.length;
    results.warnings = s.warnings.slice(0, 40);
    const finalV2 = await s.ev("(window.__V2 && window.__V2._errors) || []");
    results.errors.v2Count = (finalV2 || []).length;
    results.v2Errors = finalV2 || [];
    record('N01', 'Red', 'Cero peticiones de red no locales',
      nonLocal.length === 0 ? 'PASS' : 'FAIL', nonLocal.length + ' no locales de ' + s.requests.length + ' · ' + JSON.stringify(schemes));
    if (nonLocal.length) issue('high', 'regresion', 'Hay peticiones de red en el build', nonLocal.slice(0, 8).map((r) => r.url).join(', '));
    record('N02', 'Errores', 'Cero errores de consola/excepción',
      s.errors.length === 0 ? 'PASS' : 'FAIL', s.errors.length + ' errores · ' + s.errors.slice(0, 3).map((e) => String(e.text || e.description || '').slice(0, 120)).join(' | '));
    if (s.errors.length) issue('high', 'regresion', 'La consola registra errores/excepciones', JSON.stringify(s.errors.slice(0, 6)).slice(0, 900));
    record('N03', 'Errores', 'V2._errors vacío',
      (finalV2 || []).length === 0 ? 'PASS' : 'FAIL', (finalV2 || []).length + ' errores V2 ' + JSON.stringify((finalV2 || []).slice(0, 4)));
    record('N02b', 'Errores', 'Advertencias de consola (no bloqueantes)',
      s.warnings.length ? 'NOTE' : 'PASS', s.warnings.length + ' advertencias · ' + Array.from(new Set(s.warnings.map((w) => String(w.text || '')))).join(' | ').slice(0, 500));

    /* HTML exportado + enlace del HUB */
    const req0 = s.requests.length;
    const err0 = s.errors.length;
    const warn0 = s.warnings.length;
    await s.send('Page.navigate', { url: pathToFileURL(EXPORT).href });
    await sleep(1600);
    await s.waitFor("document.readyState === 'complete' && window.__gameState && window.__gameState().screen", 20000);
    await s.seed(emptySave);
    await s.enterHubFromTitle();
    await s.waitFor("window.__V2.world && window.__V2.world.stats().ready", 8000);
    await sleep(900);
    const exportStats = await worldStats(s);
    const exportChestBefore = await readState(s);
    await openWorld(s, 'v2w-chest-salud-publica');
    await clickWorld(s, 'v2-world-chest-open', 700);
    const exportChestAfter = await readState(s);
    const exportPanel = await worldPanel(s);
    await s.shot('export-html');
    await closeWorld(s);
    const exportNonLocal = s.requests.slice(req0).filter((r) => !/^(file|data|blob|about|chrome):/i.test(r.url));
    const exportErrors = s.errors.slice(err0);
    const exportWarnings = s.warnings.slice(warn0);
    const exportOk = exportStats && exportStats.built && exportStats.ready
      && exportChestAfter.coins === exportChestBefore.coins + 5
      && exportPanel && /Cofre abierto/.test(exportPanel.title)
      && exportNonLocal.length === 0 && exportErrors.length === 0;
    record('X01', 'Export HTML', 'export/serums-quest.html por file://: mundo + cofre + 0 red/errores',
      exportOk ? 'PASS' : 'FAIL',
      'stats=' + JSON.stringify({ built: exportStats && exportStats.built, ready: exportStats && exportStats.ready, chests: exportStats && exportStats.chests.opened }) + ' · coins ' + exportChestBefore.coins + '→' + exportChestAfter.coins + ' · noLocales=' + exportNonLocal.length + ' · errores=' + exportErrors.length + ' · warnings=' + exportWarnings.length);
    if (!exportOk) issue('high', 'artefacto', 'El HTML exportado falla la prueba de mundo/cofre/red', JSON.stringify({ stats: exportStats && { built: exportStats.built, ready: exportStats.ready }, before: exportChestBefore && exportChestBefore.coins, after: exportChestAfter && exportChestAfter.coins, panel: exportPanel && exportPanel.title, nonLocal: exportNonLocal, errors: exportErrors }).slice(0, 1000));
    results.artifacts.exportTest = { stats: exportStats && { built: exportStats.built, ready: exportStats.ready, chests: exportStats.chests }, nonLocal: exportNonLocal, errors: exportErrors, warnings: exportWarnings };
    const reqHub = s.requests.length;
    const errHub = s.errors.length;
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
    results.artifacts.hubRedirect = { ...hubRedirect, errors: hubErrors, nonLocal: hubNonLocal };

    const distEnd = distInfo(DIST);
    const exportEnd = distInfo(EXPORT);
    results.artifacts.distEnd = distEnd;
    results.artifacts.exportEnd = exportEnd;
    record('N04', 'Entorno', 'dist y export estables durante la pasada',
      distEnd.sha256 === distStart.sha256 && exportEnd.sha256 === exportStart.sha256 ? 'PASS' : 'FAIL',
      'dist=' + distEnd.sha256.slice(0, 12) + ' export=' + exportEnd.sha256.slice(0, 12));
    if (distEnd.sha256 !== distStart.sha256 || exportEnd.sha256 !== exportStart.sha256) issue('high', 'qa-harness', 'Los artefactos cambiaron durante la pasada', 'dist ' + distStart.sha256 + '→' + distEnd.sha256 + ' export ' + exportStart.sha256 + '→' + exportEnd.sha256);

    results.world.summary = {
      ids: idKinds,
      initial: w0 && { counts: w0.counts, markers: w0.markers, objects: w0.objects },
      persistence: results.world.persistence && { before: results.world.persistence.before && { chests: results.world.persistence.before.chests, fragments: results.world.persistence.before.fragments, guides: results.world.persistence.before.guides }, after: results.world.persistence.after && { chests: results.world.persistence.after.chests, fragments: results.world.persistence.after.fragments, guides: results.world.persistence.after.guides } },
      shadowReview: results.world.shadowReview,
      restoration: results.world.restoration,
      dailyCap: results.world.dailyCap,
      culling: results.world.culling
    };
  } catch (error) {
    console.error('FATAL CP2', error && error.stack || error);
    results.fatal = String(error && error.stack || error);
    issue('critical', 'qa-harness', 'La pasada CP2 se detuvo', String(error && error.message || error));
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
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-cp2-qa.json'), JSON.stringify(results, null, 2), 'utf8');
    fs.writeFileSync(path.join(EVIDENCE, 'agent7-cp2-report.md'), buildReport(), 'utf8');
  } catch (e) { console.error('No se pudo escribir evidencia cp2', e); }
  console.log('RESUMEN CP2', JSON.stringify({ cases: summary, fps: results.fps, network: results.network && results.network.nonLocal && results.network.nonLocal.length, errors: results.errors && results.errors.total, issues: results.issues.length }, null, 2));
  if (summary.fail || results.fatal) process.exitCode = 1;
})();
