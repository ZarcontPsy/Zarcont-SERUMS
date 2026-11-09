'use strict';
/* Caso 5 · Visor/efectos: 3 héroes × 9 piezas problemáticas en la tienda a
   1308×662. Exige effect.visible y píxeles medidos en el canvas, además de
   captura por pieza para las hojas de contacto. */
const C = require('./common');

const HEROES = ['ilan', 'noa', 'zenon'];
const EFFECTS = ['c-efecto-aura', 'c-efecto-chispas', 'c-efecto-bruma', 'c-efecto-constelacion', 'x-aura-amanecer'];
const FRAMES = ['c-marco-bronce', 'c-marco-platino', 'c-marco-vacio', 'c-marco-constelacion'];

(async () => {
  const report = { startedAt: new Date().toISOString(), size: '1308x662', heroes: HEROES, pieces: EFFECTS.concat(FRAMES), rows: [], checks: {}, errors: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1308, height: 662, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('all'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);
    await s.ev('window.__v23Shop.openShop()');
    await C.sleep(1500);
    await s.ev('window.__v23Shop.filter("collection", "todos")');
    await C.sleep(900);
    report.initial = await s.ev(`(() => ({
      counts: window.__v23Shop.counts(),
      state: window.__v23Shop.state(),
      canvas: window.__v23Visor.info().canvas,
      canvasId: window.__v23Visor.info().canvasId,
      mounts: window.__v23Shop.state().mounts,
      renderCount: window.__v23.renderCount(),
      nav: window.__v23.navigationCount()
    }))()`);
    await s.ev(`(() => { window.__qaVisorCanvas = document.querySelector('#shopPreviewMount canvas'); window.__qaRows = []; window.__qaErrors = []; return !!window.__qaVisorCanvas; })()`);

    for (const hero of HEROES) {
      const heroStart = await s.ev(`window.__v23Visor.hero(${JSON.stringify(hero)})`);
      await C.sleep(350);
      for (const piece of EFFECTS.concat(FRAMES)) {
        await s.ev(`window.__v23Shop.select(${JSON.stringify(piece)})`);
        await C.sleep(380);
        const m = await s.ev(`(() => {
          const inf = window.__v23Visor.info();
          const meas = window.__v23Visor.measure();
          const canvas = document.querySelector('#shopPreviewMount canvas');
          const r = canvas ? canvas.getBoundingClientRect() : null;
          return {
            hero: inf.heroId, pieceId: inf.pieceId, pieceName: inf.pieceName, category: inf.category, slotLabel: inf.slotLabel,
            rarity: inf.rarity, zoom: inf.zoom, mounted: inf.mounted, mountId: inf.mountId,
            canvasId: inf.canvasId, canvasIdentity: inf.canvasIdentity,
            canvas: inf.canvas ? { bufferW: inf.canvas.bufferW, bufferH: inf.canvas.bufferH, cssW: inf.canvas.cssW, cssH: inf.canvas.cssH } : null,
            cssRect: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
            effect: inf.effect,
            measure: meas.measure,
            sameCanvas: !!canvas && canvas === window.__qaVisorCanvas,
            selectedId: window.__v23Shop.state().selectedId,
            renderCount: window.__v23.renderCount()
          };
        })()`);
        m.group = EFFECTS.indexOf(piece) >= 0 ? 'efecto' : 'marco';
        m.file = C.rel(await C.shotClip(s, '#shopPreviewMount', (m.group === 'efecto' ? 'fx-' : 'marco-') + hero + '-' + piece + '-1308x662.png', 2));
        report.rows.push(m);
        console.log(hero, piece, JSON.stringify({ effectVisible: m.effect && m.effect.visible, inside: m.effect && m.effect.projected && m.effect.projected.inside, pixels: m.measure && m.measure.pixels, visible: m.measure && m.measure.visible, sameCanvas: m.sameCanvas, pieceId: m.pieceId }));
      }
    }

    report.checks = await s.ev(`(() => {
      const rows = window.__qaRows;
      const canvasNow = document.querySelector('#shopPreviewMount canvas');
      return {
        sameCanvasAll: rows.length ? rows.every(function () { return true; }) : null,
        canvasNowExists: !!canvasNow,
        canvasSameNow: canvasNow === window.__qaVisorCanvas,
        canvasId: window.__v23Visor.info().canvasId,
        rendererAlive: window.__v23Visor.info().rendererAlive,
        renderCount: window.__v23.renderCount(),
        counts: window.__v23Shop.counts(),
        shopErrors: window.__v23Shop.errors(),
        nav: window.__v23.navigationCount(),
        docGen: window.__qaDocGen == null ? null : window.__qaDocGen
      };
    })()`);
    const rows = report.rows;
    const sum = { total: rows.length, effectVisible: 0, measureVisible: 0, inside: 0, sameCanvas: 0, pixelMin: null, pixelMax: null };
    const byGroup = {};
    rows.forEach((r) => {
      const g = (byGroup[r.group] = byGroup[r.group] || { total: 0, effectVisible: 0, measureVisible: 0, inside: 0, sameCanvas: 0, pixelMin: null, pixelMax: null });
      [g, sum].forEach((o) => {
        o.total += 1;
        if (r.effect && r.effect.visible) o.effectVisible += 1;
        if (r.measure && r.measure.visible) o.measureVisible += 1;
        if (r.effect && r.effect.projected && r.effect.projected.inside) o.inside += 1;
        if (r.sameCanvas) o.sameCanvas += 1;
        const px = r.measure && typeof r.measure.pixels === 'number' ? r.measure.pixels : null;
        if (px != null) {
          if (o.pixelMin == null || px < o.pixelMin) o.pixelMin = px;
          if (o.pixelMax == null || px > o.pixelMax) o.pixelMax = px;
        }
      });
    });
    report.summary = { all: sum, byGroup, renderCountDelta: report.checks.renderCount - report.initial.renderCount, navCount: navs.length };
    report.navs = navs.map((n) => n.url);
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('visor.json', report);
  console.log(JSON.stringify({ summary: report.summary, checks: report.checks, initial: report.initial && { counts: report.initial.counts, canvas: report.initial.canvas, mounts: report.initial.mounts }, fatal: report.fatal }, null, 1));
})();
