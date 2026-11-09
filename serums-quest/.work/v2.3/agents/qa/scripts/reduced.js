'use strict';
/* Caso 7 (apoyo) · Reducir movimiento: efecto visible, escena 3D estática y
   animaciones CSS desactivadas. Compara dos capturas del canvas separadas
   800 ms con y sin reducción. */
const fs = require('fs');
const crypto = require('crypto');
const C = require('./common');

function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

(async () => {
  const report = { startedAt: new Date().toISOString(), size: '1308x662', reduced: {}, normal: {}, errors: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1308, height: 662, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('all'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);
    await s.ev('window.__v23Shop.openShop()');
    await C.sleep(1400);
    await s.ev('window.__v23Visor.hero("noa")');
    await s.ev('window.__v23Shop.select("c-efecto-aura")');
    await C.sleep(700);
    await s.ev('window.__v23.setReducedMotion(true)');
    await C.sleep(900);

    report.reduced.state = await s.ev(`(() => ({
      bodyClass: document.body.classList.contains('reduced-motion'),
      setting: window.__v23.snapshot().reducedMotion,
      info: (function () { const i = window.__v23Visor.info(); return { effectVisible: i.effect.visible, projected: i.effect.projected, frames: i.frames }; })(),
      measure: window.__v23Visor.measure().measure
    }))()`);
    const m1 = await s.ev('window.__v23Visor.measure().measure');
    await C.sleep(800);
    const m2 = await s.ev('window.__v23Visor.measure().measure');
    report.reduced.measures = { p1: m1.pixels, p2: m2.pixels, samePixels: m1.pixels === m2.pixels, bbox1: m1.bbox, bbox2: m2.bbox, sameBbox: JSON.stringify(m1.bbox) === JSON.stringify(m2.bbox) };
    const r1 = await C.shotClip(s, '#shopPreviewMount canvas', 'reduced-motion-canvas-1.png', 2);
    await C.sleep(800);
    const r2 = await C.shotClip(s, '#shopPreviewMount canvas', 'reduced-motion-canvas-2.png', 2);
    report.reduced.hashes = { h1: hash(r1), h2: hash(r2), same: hash(r1) === hash(r2) };
    report.reduced.mountShot = C.rel(await C.shotClip(s, '#shopPreviewMount', 'reduced-motion-effects-1308x662.png', 2));
    await s.ev('window.__v23.openTitle()');
    await C.sleep(500);
    report.reduced.titleShot = C.rel(await C.shot(s, 'reduced-motion-titulo-1308x662.png'));
    report.reduced.titleCss = await s.ev(`(() => { const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el); return { animationName: cs.animationName, animationDuration: cs.animationDuration, transform: cs.transform }; }; return { bg: pick('.v23wBg'), hero: pick('.v23wFigure--front'), halo: pick('.v23wHalo'), aura: pick('.v23wAura') }; })()`);

    /* Vuelta al movimiento normal: la escena debe volver a animarse */
    await s.ev('window.__v23.setReducedMotion(false)');
    await C.sleep(500);
    await s.ev('window.__v23Shop.openShop()');
    await C.sleep(1300);
    await s.ev('window.__v23Shop.select("c-efecto-aura")');
    await C.sleep(700);
    const n1 = await C.shotClip(s, '#shopPreviewMount canvas', 'normal-motion-canvas-1.png', 2);
    await C.sleep(800);
    const n2 = await C.shotClip(s, '#shopPreviewMount canvas', 'normal-motion-canvas-2.png', 2);
    report.normal.hashes = { h1: hash(n1), h2: hash(n2), differ: hash(n1) !== hash(n2) };
    report.normal.bg = await s.ev('(() => { const el = document.querySelector(".v23wBg"); return el ? getComputedStyle(el).animationName : null; })()');
    report.normal.measure = await s.ev('window.__v23Visor.measure().measure');
    await s.ev('window.__v23.setReducedMotion(false)');

    report.final = await s.ev('({ screen: window.__v23.screen(), nav: window.__v23.navigationCount(), docGen: window.__qaDocGen, reducedMotion: window.__v23.snapshot().reducedMotion })');
    report.navs = navs.map((n) => n.url);
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('reduced.json', report);
  console.log(JSON.stringify({ reduced: report.reduced, normal: report.normal, final: report.final, errors: { c: report.errors.errorCount, w: report.errors.warningCount, nl: report.errors.nonLocal }, fatal: report.fatal }, null, 1));
})();
