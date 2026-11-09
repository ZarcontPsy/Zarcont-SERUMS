'use strict';
/* QA visual de la Fase 1B: bienvenida en 10 tamaños y tutorial de 5 pasos en
   3 tamaños. Solo escribe en .work/v2.3b/evidence/after/ y data/. */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');

const OUT = path.resolve(__dirname, '..', 'evidence', 'after');
const DATA = path.resolve(__dirname, '..', 'evidence', 'data');
const SAVE = path.resolve(__dirname, '..', '..', 'v2.3', 'qa', 'save-v23-all.json');
const BUNDLE = path.join(ROOT, 'dist', 'index.html');
const SIZES = [
  { w: 640, h: 360, name: '640x360' },
  { w: 844, h: 390, name: '844x390' },
  { w: 1024, h: 600, name: '1024x600' },
  { w: 1308, h: 662, name: '1308x662' },
  { w: 1280, h: 720, name: '1280x720' },
  { w: 1920, h: 1080, name: '1920x1080' },
  { w: 2560, h: 1080, name: '2560x1080' },
  { w: 768, h: 1024, name: '768x1024' },
  { w: 820, h: 1180, name: '820x1180' },
  { w: 390, h: 844, name: '390x844' }
];
const TUT_SIZES = ['1280x720', '640x360', '390x844'];

const PAGE_PROBE = `(() => {
  const q = (s) => document.querySelector(s);
  const rect = (s) => { const el = q(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  const style = (s, p) => { const el = q(s); return el ? getComputedStyle(el)[p] : null; };
  const intersects = (a, b) => !!a && !!b && a.x < b.r - 1 && a.r > b.x + 1 && a.y < b.b - 1 && a.b > b.y + 1;
  const inside = (a) => !!a && a.x >= -1 && a.y >= -1 && a.r <= innerWidth + 1 && a.b <= innerHeight + 1;
  const ids = ['.v23wPrelude', '.v23wLogo', '.v23wGenre', '.v23wLead', '.v23wActions', '.v23wStats', '.v23wFootnote', '.v23wTop', '.v23wFoot'];
  const rects = {}; ids.forEach(id => { rects[id] = rect(id); });
  const overlaps = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    if (intersects(rects[ids[i]], rects[ids[j]])) overlaps.push([ids[i], ids[j]]);
  }
  const controls = Array.from(document.querySelectorAll('.v23w a, .v23w button')).map(el => { const r = el.getBoundingClientRect(); return { action: el.getAttribute('data-action'), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), inside: r.x >= -1 && r.y >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, visible: getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none' && r.width > 1 }; });
  const doc = { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight };
  return {
    vw: innerWidth, vh: innerHeight, screen: window.__v23 ? window.__v23.screen() : null,
    rects, overlaps, allInside: ids.every(id => inside(rects[id])), docOverflowX: doc.w > innerWidth + 1, docOverflowY: doc.h > innerHeight + 1,
    logoFont: rect('.v23wLogo') ? parseFloat(style('.v23wLogo', 'fontSize')) : null,
    logoHeightRatio: rect('.v23wLogo') ? rect('.v23wLogo').h / innerHeight : null,
    fontRatio: rect('.v23wLogo') ? parseFloat(style('.v23wLogo', 'fontSize')) / innerHeight : null,
    controls, controlsOut: controls.filter(c => !c.inside),
    stage: rect('.v23wStage'), copy: rect('.v23wCopy'), zone: window.__v23b ? window.__v23b.zone() : null,
    margins: window.__v23b ? window.__v23b.liveMargins() : null,
    cinema: window.__v23b ? { ready: window.__v23b.ready(), mode: window.__v23b.mode(), active: window.__v23b.active(), canvas: !!window.__v23b.canvas(), fps: window.__v23b.fps(), stats: window.__v23b.stats(), errors: window.__v23b.errors() } : null,
    title: (() => { const el = q('.v23wLogo'); return el ? el.innerText.replace(/\\s+/g, ' ').trim() : null; })(),
    routes: document.querySelectorAll('.v23wRoute').length,
    nav: document.querySelectorAll('.v23wNavBtn').length,
    tutState: window.__v23welcome ? window.__v23welcome.tutorialState() : null
  };
})()`;

const TUT_PROBE = `(() => {
  const q = (s) => document.querySelector(s);
  const rect = (s) => { const el = q(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; };
  const inside = (a) => !!a && a.x >= -1 && a.y >= -1 && a.r <= innerWidth + 1 && a.b <= innerHeight + 1;
  const panel = rect('.v23tutPanel'), title = rect('#v23TutTitle'), support = rect('#v23TutSupport'), constel = rect('.v23tutConst'), foot = rect('.v23tutFoot'), aux = rect('.v23tutAux'), head = rect('.v23tutHead');
  const pEl = q('.v23tutPanel');
  const intersects = (a, b) => !!a && !!b && a.x < b.r - 1 && a.r > b.x + 1 && a.y < b.b - 1 && a.b > b.y + 1;
  return {
    vw: innerWidth, vh: innerHeight, active: window.__v23welcome.tutorialState(), mode: window.__v23b.mode(), step: window.__v23b.step(),
    zone: window.__v23b.zone(), scene: rect('.v23tutScene'), stage: rect('.v23tutStage'), panel, title, support, constel, foot, aux, head,
    titleFS: title ? parseFloat(getComputedStyle(q('#v23TutTitle')).fontSize) : null,
    supportLines: q('#v23TutSupport') ? Math.round(q('#v23TutSupport').scrollHeight / parseFloat(getComputedStyle(q('#v23TutSupport')).lineHeight)) : null,
    panelScroll: pEl ? pEl.scrollHeight - pEl.clientHeight : null,
    margins: window.__v23b.liveMargins(),
    inViewport: [panel, title, support, constel, foot, aux, head].every(inside),
    overlapTitleSupport: intersects(title, support) || intersects(support, constel) || intersects(constel, foot),
    overlay: !!q('#v23Tutorial'), sameOverlay: window.__v23welcome.tutorialNode() === q('#v23Tutorial'),
    titleText: q('#v23TutTitle') ? q('#v23TutTitle').textContent : null,
    stepText: q('#v23TutStepNo') ? q('#v23TutStepNo').textContent : null,
    primary: q('#v23TutNextLabel') ? q('#v23TutNextLabel').textContent : null,
    starsActive: document.querySelectorAll('.v23tutStar.is-active').length,
    starsDone: document.querySelectorAll('.v23tutStar.is-done').length,
    linesLit: document.querySelectorAll('.v23tutConstSvg line.is-lit').length,
    panelFont: panel ? parseFloat(getComputedStyle(q('.v23tutPanel')).fontSize) : null,
    fps: window.__v23b.fps(),
    errors: window.__v23b.errors()
  };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(DATA, { recursive: true });
  const h = await open({ port: 9563, profile: path.join(__dirname, 'profiles', 'capture'), bundle: BUNDLE, width: 1280, height: 720 });
  const report = { generatedAt: new Date().toISOString(), sizes: [], tutorials: [], consoleErrors: [] };
  try {
    await h.seed(JSON.parse(fs.readFileSync(SAVE, 'utf8')), { reload: true });
    await sleep(1600);
    await h.ev("(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); return true; })()");
    for (const s of SIZES) {
      await h.setViewport(s.w, s.h);
      await sleep(900);
      await h.ev("(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); return true; })()");
      const info = await h.ev(PAGE_PROBE);
      const file = path.join(OUT, 'welcome-' + s.name + '.png');
      await h.shot(file);
      report.sizes.push({ size: s.name, info, file: path.relative(ROOT, file) });
      console.log('welcome', s.name, 'font', info.logoFont, 'ratio', info.fontRatio ? info.fontRatio.toFixed(3) : null, 'overlaps', info.overlaps.length, 'out', info.controlsOut.length, 'margins', info.margins && [info.margins.top.toFixed(2), info.margins.bottom.toFixed(2), info.margins.left.toFixed(2), info.margins.right.toFixed(2)].join(','));
      if (TUT_SIZES.indexOf(s.name) !== -1) {
        await h.ev("(() => { window.__v23welcome.open('title'); return true; })()");
        await sleep(700);
        const steps = [];
        for (let step = 0; step < 5; step += 1) {
          if (step > 0) {
            await h.ev('(() => { window.__v23welcome.stepTo(' + step + '); return true; })()');
            await sleep(950);
          } else {
            await sleep(500);
          }
          const ti = await h.ev(TUT_PROBE);
          const tf = path.join(OUT, 'tutorial-' + s.name + '-step' + (step + 1) + '.png');
          await h.shot(tf);
          steps.push({ step: step + 1, info: ti, file: path.relative(ROOT, tf) });
          console.log('tut', s.name, step + 1, 'in', ti.inViewport, 'scroll', ti.panelScroll, 'margins', ti.margins && [ti.margins.top.toFixed(2), ti.margins.bottom.toFixed(2), ti.margins.left.toFixed(2), ti.margins.right.toFixed(2)].join(','), 'fps', ti.fps);
        }
        report.tutorials.push({ size: s.name, steps });
        await h.ev("(() => { window.__v23welcome.close(); return true; })()");
        await sleep(400);
      }
    }
    report.consoleErrors = h.errors.slice();
    fs.writeFileSync(path.join(DATA, 'capture.json'), JSON.stringify(report, null, 1));
    console.log('errors', JSON.stringify(h.errors));
    console.log('warnings', JSON.stringify(h.warnings.slice(0, 12)));
  } finally {
    await h.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
