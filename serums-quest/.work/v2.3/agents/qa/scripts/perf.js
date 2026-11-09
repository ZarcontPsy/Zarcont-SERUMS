'use strict';
/* Caso 7 · Rendimiento y calidad: FPS en título, tutorial, tienda e
   inventario; calidades baja/media/alta; reducir movimiento. */
const C = require('./common');

(async () => {
  const report = { startedAt: new Date().toISOString(), size: '1308x662', fps: {}, quality: {}, reducedMotion: {}, errors: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1308, height: 662, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('all'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);

    /* Título */
    report.fps.title = await C.sampleFps(s, 2600);
    report.fps.titleRaf = await C.sampleRaf(s, 2000);
    report.fps.titleVisor = await s.ev('window.__v23Visor.fps()');

    /* Tutorial */
    await s.click('[data-action="open-tutorial"]', 500);
    report.fps.tutorial = await C.sampleFps(s, 2600);
    report.fps.tutorialRaf = await C.sampleRaf(s, 2000);
    await s.ev('window.__v23welcome.close()');
    await C.sleep(400);

    /* Tienda + efecto seleccionado */
    await s.ev('window.__v23Shop.openShop()');
    await C.sleep(1400);
    await s.ev('window.__v23Shop.select("c-efecto-chispas")');
    await C.sleep(600);
    report.fps.shop = await C.sampleFps(s, 2600);
    report.fps.shopRaf = await C.sampleRaf(s, 2000);
    report.fps.shopVisor = await s.ev('window.__v23Visor.fps()');
    report.shopInfo = await s.ev('(() => ({ info: window.__v23Visor.info(), measure: window.__v23Visor.measure().measure }))()');

    /* Calidades */
    for (const q of ['bajo', 'medio', 'alto']) {
      await s.ev('window.__v23.setQuality(' + JSON.stringify(q) + ')');
      await C.sleep(800);
      const data = await s.ev(`(() => ({
        setting: (window.__v23.snapshot() || {}).quality,
        state: window.__v23.snapshot(),
        visorQuality: window.__v23Visor.info().quality,
        effect: window.__v23Visor.info().effect,
        measure: window.__v23Visor.measure().measure,
        doc: document.documentElement.scrollWidth + 'x' + document.documentElement.scrollHeight,
        fps: window.__gameState().fps,
        errors: window.__v23Shop.errors()
      }))()`);
      data.shot = C.rel(await C.shot(s, 'calidad-' + q + '-1308x662.png'));
      report.quality[q] = data;
      report.fps['quality-' + q] = await C.sampleFps(s, 1600);
      console.log('quality', q, JSON.stringify({ setting: data.setting, visor: data.visorQuality, effectVisible: data.effect && data.effect.visible, pixels: data.measure && data.measure.pixels, visible: data.measure && data.measure.visible, errors: data.errors }));
    }
    await s.ev('window.__v23.setQuality("alto")');
    await C.sleep(500);

    /* Inventario */
    await s.ev('window.__v23.openTitle()');
    await C.sleep(400);
    await s.ev('window.__v23Shop.openWardrobe()');
    await C.sleep(1400);
    report.fps.wardrobe = await C.sampleFps(s, 2600);
    report.fps.wardrobeRaf = await C.sampleRaf(s, 2000);
    report.fps.wardrobeVisor = await s.ev('window.__v23Visor.fps()');
    report.wardrobeInfo = await s.ev('(() => ({ info: window.__v23Visor.info(), counts: window.__v23Shop.counts(), canvas: window.__v23Shop.canvas() }))()');

    /* Reducir movimiento */
    await s.ev('window.__v23.setReducedMotion(true)');
    await C.sleep(600);
    report.reducedMotion.state = await s.ev(`(() => ({
      bodyClass: document.body.classList.contains('reduced-motion'),
      reducedMotionSetting: (window.__v23.snapshot() || {}).reducedMotion,
      visorActive: window.__v23Visor.info().mounted,
      counts: window.__v23Shop.counts()
    }))()`);
    report.reducedMotion.measure1 = await s.ev('window.__v23Visor.measure().measure');
    await C.sleep(700);
    report.reducedMotion.measure2 = await s.ev('window.__v23Visor.measure().measure');
    report.reducedMotion.measureStable = report.reducedMotion.measure1.pixels === report.reducedMotion.measure2.pixels
      && JSON.stringify(report.reducedMotion.measure1.bbox) === JSON.stringify(report.reducedMotion.measure2.bbox);
    report.reducedMotion.wardrobeShot = C.rel(await C.shot(s, 'reduced-motion-inventario-1308x662.png'));

    /* Animaciones del título/inventario con reducción */
    await s.ev('window.__v23.openTitle()');
    await C.sleep(500);
    report.reducedMotion.css = await s.ev(`(() => {
      const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el); return { animationName: cs.animationName, animationDuration: cs.animationDuration, transitionDuration: cs.transitionDuration }; };
      return {
        bodyClass: document.body.classList.contains('reduced-motion'),
        bg: pick('.v23wBg'),
        hero: pick('.v23wFigure--front'),
        halo: pick('.v23wHalo'),
        aura: pick('.v23wAura'),
        ctas: pick('.v23wCta')
      };
    })()`);
    await s.click('[data-action="open-tutorial"]', 450);
    report.reducedMotion.tutorial = await s.ev(`(() => { const p = document.querySelector('.v23tutPanel'); const b = document.querySelector('.v23tutBody'); const cs = p ? getComputedStyle(p) : null; const cb = b ? getComputedStyle(b) : null; return { open: !!document.querySelector('#v23Tutorial.is-open'), panel: cs ? { animationName: cs.animationName, transitionDuration: cs.transitionDuration } : null, body: cb ? { animationName: cb.animationName, transitionDuration: cb.transitionDuration } : null }; })()`);
    await s.ev('window.__v23welcome.close()');
    await C.sleep(300);
    await s.ev('window.__v23.setReducedMotion(false)');
    await C.sleep(400);
    report.reducedMotion.afterOff = await s.ev('({ bodyClass: document.body.classList.contains("reduced-motion"), setting: window.__v23.snapshot().reducedMotion, bg: (function(){ const el=document.querySelector(".v23wBg"); return el?getComputedStyle(el).animationName:null; })() })');

    report.final = await s.ev('({ screen: window.__v23.screen(), nav: window.__v23.navigationCount(), docGen: window.__qaDocGen, renderCount: window.__v23.renderCount(), quality: window.__v23.snapshot().quality, reducedMotion: window.__v23.snapshot().reducedMotion, shopErrors: window.__v23Shop.errors() })');
    report.navs = navs.map((n) => n.url);
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('perf.json', report);
  console.log(JSON.stringify({ fps: report.fps, quality: Object.fromEntries(Object.entries(report.quality).map(([k, v]) => [k, { setting: v.setting, effectVisible: v.effect && v.effect.visible, pixels: v.measure && v.measure.pixels, measureVisible: v.measure && v.measure.visible, visorQuality: v.visorQuality }])), reducedMotion: { state: report.reducedMotion.state, css: report.reducedMotion.css, tutorial: report.reducedMotion.tutorial, stable: report.reducedMotion.measureStable, p1: report.reducedMotion.measure1 && report.reducedMotion.measure1.pixels, p2: report.reducedMotion.measure2 && report.reducedMotion.measure2.pixels, afterOff: report.reducedMotion.afterOff }, final: report.final, errors: { c: report.errors.errorCount, w: report.errors.warningCount, nl: report.errors.nonLocal }, fatal: report.fatal }, null, 1));
})();
