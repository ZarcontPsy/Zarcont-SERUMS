'use strict';
/* =========================================================================
   AGENTE 5 · QA · V2.3 Fase 1
   Utilidades comunes: apertura del build final con el arnés CDP, métricas de
   layout, capturas, FPS y guardado de datos. SOLO escribe en agents/qa/.
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../../qa/cdp.js');

const OUT = path.resolve(__dirname, '..');
const SHOTS = path.join(OUT, 'shots');
const DATA = path.join(OUT, 'data');
const PROFILES = path.join(OUT, 'profiles');
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const SAVES = {
  all: path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'),
  mixed: path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-mixed.json'),
  tutorial: path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-tutorial.json')
};
const BLOCKED_PRELOAD = `(() => { try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { throw new Error('localStorage blocked by QA'); } }); } catch (e) {} })();`;

function readSave(kind) {
  return JSON.parse(fs.readFileSync(SAVES[kind], 'utf8'));
}
function ensureDirs() {
  [SHOTS, DATA, PROFILES].forEach((d) => fs.mkdirSync(d, { recursive: true }));
}
function writeJSON(name, obj) {
  ensureDirs();
  const file = path.join(DATA, name);
  fs.writeFileSync(file, JSON.stringify(obj, null, 1), 'utf8');
  console.log('data:', file, fs.statSync(file).size, 'B');
  return file;
}
function log(...args) { console.log(...args); }

async function launch(opts) {
  ensureDirs();
  const o = opts || {};
  const port = o.port || 9545;
  const profileDir = path.join(PROFILES, o.profile || ('p' + port));
  /* Chrome en Windows puede tardar en soltar el perfil: se limpia con reintentos
     y, si sigue bloqueado, se usa un perfil alternativo (el arnés lo crea). */
  let cleaned = false;
  for (let i = 0; i < 3; i += 1) {
    try { fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 }); cleaned = true; break; } catch (e) { await sleep(700); }
  }
  const dir = cleaned ? profileDir : (profileDir + '-' + Date.now());
  return open({
    port,
    width: o.width || 1280,
    height: o.height || 720,
    profile: dir,
    preload: o.preload,
    bundle: BUNDLE
  });
}

/* Detecta navegaciones de documento (recargas completas) a nivel CDP. */
function trackNavigations(h) {
  const navs = [];
  try {
    h.ws.addEventListener('message', (event) => {
      try {
        const m = JSON.parse(event.data);
        if (m.method === 'Page.frameNavigated' && m.params && m.params.frame && !m.params.frame.parentId) {
          navs.push({ url: String(m.params.frame.url || ''), at: Date.now() });
        }
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* WebSocket sin addEventListener */ }
  return navs;
}

/* Contador de documentos sobrevive a recargas (sessionStorage). El preload se
   registra en todas las páginas de la sesión. */
const NAV_COUNTER_PRELOAD = `(() => { try { var n = Number(sessionStorage.getItem('__qaDocGen') || '0') + 1; sessionStorage.setItem('__qaDocGen', String(n)); window.__qaDocGen = n; } catch (e) { window.__qaDocGen = -1; } })();`;

/* -------------------------------------------------------------------------
   Métricas de layout (todo dentro de la página)
   ------------------------------------------------------------------------- */
function pageProbe(cfg) {
  cfg = cfg || {};
  const els = cfg.els || [];
  const groups = cfg.groups || {};
  const texts = cfg.texts || [];
  const inside = (r) => r.width > 0 && r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
  const info = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      right: Math.round(r.right), bottom: Math.round(r.bottom),
      clientW: el.clientWidth, clientH: el.clientHeight,
      scrollW: el.scrollWidth, scrollH: el.scrollHeight,
      innerScrollY: Math.max(0, el.scrollHeight - el.clientHeight),
      innerScrollX: Math.max(0, el.scrollWidth - el.clientWidth),
      display: cs.display, overflow: cs.overflow,
      animation: cs.animationName, transition: cs.transitionDuration,
      visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
      inside: inside(r)
    };
  };
  const de = document.documentElement;
  const body = document.body;
  const scrollW = Math.max(de.scrollWidth, body.scrollWidth);
  const scrollH = Math.max(de.scrollHeight, body.scrollHeight);
  const out = {
    vw: innerWidth, vh: innerHeight,
    dpr: Math.round(devicePixelRatio * 100) / 100,
    screen: (window.__v23 && window.__v23.screen) ? window.__v23.screen() : null,
    doc: {
      scrollW, scrollH,
      overflowX: scrollW > innerWidth + 1,
      overflowY: scrollH > innerHeight + 1,
      scrollX: Math.round(scrollX), scrollY: Math.round(scrollY)
    },
    bodyOverflow: getComputedStyle(body).overflow + '/' + getComputedStyle(de).overflow,
    els: {}, groups: {}, texts: {}
  };
  els.forEach((s) => { out.els[s] = info(document.querySelector(s)); });
  Object.keys(groups).forEach((name) => {
    const sel = groups[name];
    const list = Array.prototype.slice.call(document.querySelectorAll(sel));
    const rects = list.map((el) => el.getBoundingClientRect());
    const insideCount = rects.filter((r) => inside(r)).length;
    const visibleCount = rects.filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth).length;
    out.groups[name] = {
      count: list.length, visible: visibleCount, insideCount,
      allInside: list.length > 0 && insideCount === list.length,
      first: rects.length ? { x: Math.round(rects[0].x), y: Math.round(rects[0].y), w: Math.round(rects[0].width), h: Math.round(rects[0].height) } : null,
      last: rects.length ? { x: Math.round(rects[rects.length - 1].x), y: Math.round(rects[rects.length - 1].y), w: Math.round(rects[rects.length - 1].width), h: Math.round(rects[rects.length - 1].height) } : null
    };
  });
  texts.forEach((s) => {
    const el = document.querySelector(s);
    out.texts[s] = el ? (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180) : null;
  });
  out.scan = [];
  if (cfg.scan) {
    const root = document.querySelector(cfg.scan);
    if (root) {
      const nodes = Array.prototype.slice.call(root.querySelectorAll('*'));
      for (let i = 0; i < nodes.length && out.scan.length < 14; i += 1) {
        const el = nodes[i];
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
        if (r.right <= innerWidth + 2 && r.bottom <= innerHeight + 2 && r.left >= -2 && r.top >= -2) continue;
        const text = ((el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()).slice(0, 50);
        const interactive = /^(BUTTON|A|INPUT|SELECT|IMG|H1|H2|H3|P|SPAN|SMALL|B)$/.test(el.tagName) || !!text;
        if (!interactive) continue;
        out.scan.push({
          tag: el.tagName, cls: String(el.className || '').slice(0, 60),
          right: Math.round(r.right), bottom: Math.round(r.bottom), left: Math.round(r.left), top: Math.round(r.top),
          w: Math.round(r.width), h: Math.round(r.height), text
        });
      }
    }
  }
  return out;
}
async function layout(h, cfg) {
  return h.ev('(' + pageProbe.toString() + ')(' + JSON.stringify(cfg || {}) + ')');
}

/* FPS desde __gameState().fps, muestreado durante ms. */
async function sampleFps(h, ms) {
  const values = [];
  const start = Date.now();
  while (Date.now() - start < (ms || 2500)) {
    const v = await h.ev("(window.__gameState && typeof window.__gameState().fps === 'number') ? Math.round(window.__gameState().fps*10)/10 : null");
    if (typeof v === 'number' && isFinite(v)) values.push(v);
    await sleep(110);
  }
  const sorted = values.slice().sort((a, b) => a - b);
  return {
    samples: values.length,
    min: sorted.length ? sorted[0] : null,
    median: sorted.length ? sorted[Math.floor(sorted.length / 2)] : null,
    max: sorted.length ? sorted[sorted.length - 1] : null
  };
}
async function sampleRaf(h, ms) {
  return h.ev(`new Promise((resolve) => {
    let n = 0; const t0 = performance.now();
    function f() {
      n += 1;
      const t = performance.now();
      if (t - t0 < ${Number(ms) || 2000}) requestAnimationFrame(f);
      else resolve({ frames: n, ms: Math.round(t - t0), fps: Math.round((n / ((t - t0) / 1000)) * 10) / 10 });
    }
    requestAnimationFrame(f);
  })`, true);
}

async function shot(h, name) {
  ensureDirs();
  const file = path.join(SHOTS, name);
  await h.shot(file);
  return file;
}
async function shotClip(h, selector, name, scale) {
  ensureDirs();
  const file = path.join(SHOTS, name);
  await h.shotClip(selector, file, scale || 2);
  return file;
}
function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}
function summarizeErrors(h) {
  const errors = (h.errors || []).map((e) => ({ kind: e.kind, text: String(e.text || '').slice(0, 300), url: e.url || '' }));
  const warnings = (h.warnings || []).map((w) => ({ kind: w.kind, text: String(w.text || '').slice(0, 300) }));
  const requests = (h.requests || []).map((r) => r.url);
  const dataRequests = requests.filter((u) => /^data:/i.test(u)).length;
  const local = requests.filter((u) => !/^data:/i.test(u)).slice(0, 40).map((u) => u.slice(0, 200));
  const nonLocal = local.filter((u) => !/^(file:|blob:|about:)/i.test(u));
  return {
    errors, errorCount: errors.length, warnings, warningCount: warnings.length,
    requests: local, requestCount: requests.length, dataRequests, nonLocal
  };
}

module.exports = {
  open, sleep, ROOT, OUT, SHOTS, DATA, PROFILES, BUNDLE, SAVES, BLOCKED_PRELOAD, NAV_COUNTER_PRELOAD,
  readSave, ensureDirs, writeJSON, log, launch, trackNavigations, layout, sampleFps, sampleRaf,
  shot, shotClip, rel, summarizeErrors
};
