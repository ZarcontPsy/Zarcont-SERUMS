'use strict';
/* Diagnóstico A2 (nuevo visor): estado, encuadre y capturas rápidas. */
const path = require('path');
const fs = require('fs');
const { open, sleep, ROOT } = require(path.resolve(__dirname, '..', '..', '..', 'qa', 'cdp.js'));
const save = JSON.parse(fs.readFileSync(path.resolve(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.resolve(__dirname, '..', 'shots');

(async () => {
  const b = await open({ port: 9542, width: 1308, height: 662, bundle: path.resolve(ROOT, '.work', 'v2.3', 'preview', 'a2.html') });
  try {
    await b.seed(save);
    const opened = await b.ev('window.__v23Visor.openShop()');
    await sleep(1200);
    console.log('open', JSON.stringify(opened, null, 2));
    console.log('errors', JSON.stringify(b.errors.slice(0, 8)));
    const info = await b.ev('window.__v23Visor.info()');
    console.log('info', JSON.stringify(info, null, 2));
    const dom = await b.ev(`(() => {
      const mount = document.getElementById('shopPreviewMount');
      const stage = mount && mount.querySelector('.v23VisorStage');
      const cv = mount && mount.querySelector('canvas');
      const q = el => el ? (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null;
      return { mount: q(mount), stage: q(stage), canvas: q(cv), stageBg: stage ? getComputedStyle(stage).backgroundImage.slice(0, 160) : null, css: stage ? { w: getComputedStyle(stage).width, h: getComputedStyle(stage).height, ar: getComputedStyle(stage).aspectRatio, mh: getComputedStyle(stage).maxHeight } : null };
    })()`);
    console.log('dom', JSON.stringify(dom, null, 2));
    await b.shot(path.join(OUT, 'new-shop-1308.png'));
    await b.shotClip('#shopPreviewMount', path.join(OUT, 'new-mount-1308.png'), 1);
    // selector de héroe
    const hero = await b.ev("window.__v23Visor.hero('zenon')");
    await sleep(300);
    console.log('zenon', JSON.stringify({ heroId: hero.heroId, category: hero.category, effect: hero.effect, fps: hero.fps }));
    await b.shotClip('#shopPreviewMount', path.join(OUT, 'new-mount-zenon-1308.png'), 1);
    // efectos y marcos
    const ids = ['c-efecto-aura', 'c-efecto-chispas', 'c-efecto-bruma', 'c-efecto-constelacion', 'x-aura-amanecer', 'c-marco-bronce', 'c-marco-platino', 'c-marco-vacio', 'c-marco-constelacion'];
    const measures = {};
    for (const id of ids) {
      const r = await b.ev(`(() => { window.__v23Visor.select(${JSON.stringify(id)}); return window.__v23Visor.info(); })()`);
      await sleep(220);
      const m = await b.ev('window.__v23Visor.measure()');
      measures[id] = { info: { category: r.category, pieceId: r.pieceId, zoom: r.zoom, canvas: r.canvas, camera: r.camera, projected: r.effect.projected, visible: r.effect.visible }, measure: m.measure };
      await b.shotClip('#shopPreviewMount', path.join(OUT, 'new-' + id + '.png'), 1);
    }
    console.log('measures', JSON.stringify(measures, null, 2));
    console.log('errors-final', JSON.stringify(b.errors.slice(0, 10)));
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
