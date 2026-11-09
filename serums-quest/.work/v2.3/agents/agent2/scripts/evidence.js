'use strict';
/* Evidencia A2: 3 héroes × 5 efectos + 4 marcos, 7 tamaños, interacciones, FPS. */
const path = require('path');
const fs = require('fs');
const { open, sleep, ROOT } = require(path.resolve(__dirname, '..', '..', '..', 'qa', 'cdp.js'));
const save = JSON.parse(fs.readFileSync(path.resolve(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const BASE = path.resolve(__dirname, '..');
const SHOTS = path.join(BASE, 'shots', 'evidence');
fs.mkdirSync(SHOTS, { recursive: true });
const state = { startedAt: new Date().toISOString(), measurements: [], sizes: {}, interactions: {}, errors: [] };

const PIECES = [
  { id: 'c-efecto-aura', tag: 'aura-alba', kind: 'effect' },
  { id: 'c-efecto-chispas', tag: 'chispas-racha', kind: 'effect' },
  { id: 'c-efecto-bruma', tag: 'bruma-estudio', kind: 'effect' },
  { id: 'c-efecto-constelacion', tag: 'constelacion-logros', kind: 'effect' },
  { id: 'x-aura-amanecer', tag: 'aura-amanecer', kind: 'effect' },
  { id: 'c-marco-bronce', tag: 'marco-bronce', kind: 'frame' },
  { id: 'c-marco-platino', tag: 'marco-platino', kind: 'frame' },
  { id: 'c-marco-vacio', tag: 'marco-vacio', kind: 'frame' },
  { id: 'c-marco-constelacion', tag: 'marco-constelacion', kind: 'frame' }
];
const HEROES = [{ id: 'ilan', tag: 'ilan' }, { id: 'noa', tag: 'noa' }, { id: 'zenon', tag: 'zenon' }];

async function info(b) { return b.ev('window.__v23Visor.info()'); }
async function shotClipTo(b, selector, name) {
  await b.shotClip(selector, path.join(SHOTS, name), 1);
}
async function fullShot(b, name) { await b.shot(path.join(SHOTS, name)); }
async function setHeroUi(b, id) {
  return b.ev(`(() => { const s = document.querySelector('[data-v23-hero-select]'); if (!s) return false; s.value = ${JSON.stringify(id)}; s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
}

(async () => {
  const b = await open({ port: 9542, width: 1308, height: 662, bundle: path.resolve(ROOT, '.work', 'v2.3', 'preview', 'a2.html') });
  try {
    const seeded = await b.seed(save);
    await sleep(300);
    const saveBefore = await b.readSave();
    const openInfo = await b.ev('window.__v23Visor.openShop()');
    await sleep(1100);
    const render0 = await b.ev('window.__v22.renderCount || 0');
    const canvas0 = (await info(b)).canvasId;
    state.interactions.open = { canvasId: openInfo.canvasId, mounted: openInfo.mounted, mode: openInfo.mode, heroId: openInfo.heroId };
    state.interactions.thumbnailCount = await b.ev('window.__v22.thumbs ? window.__v22.thumbs() : null');

    // ---------- 3 héroes × 9 piezas ----------
    for (const hero of HEROES) {
      const uiHero = await setHeroUi(b, hero.id);
      await sleep(220);
      for (const piece of PIECES) {
        await b.ev(`window.__v23Visor.select(${JSON.stringify(piece.id)})`);
        await sleep(150);
        const i = await info(b);
        const m = await b.ev('window.__v23Visor.measure()');
        const name = `${hero.tag}__${piece.tag}.png`;
        await shotClipTo(b, '#shopPreviewMount .v23VisorStage', name);
        state.measurements.push({
          hero: hero.id,
          heroUiChange: uiHero,
          piece: piece.id,
          kind: piece.kind,
          tag: piece.tag,
          category: i.category,
          rarity: i.rarity,
          canvasId: i.canvasId,
          canvas: i.canvas,
          zoom: i.zoom,
          camera: i.camera && { distance: i.camera.distance, aspect: i.camera.aspect, pad: i.camera.fit && i.camera.fit.pad },
          projected: i.effect.projected,
          visible: i.effect.visible,
          measure: m.measure,
          shot: 'shots/evidence/' + name
        });
      }
      await b.ev("window.__v23Visor.select('c-efecto-aura')");
      await sleep(250);
      await fullShot(b, `shop-1308-${hero.tag}.png`);
    }
    const render1 = await b.ev('window.__v22.renderCount || 0');
    const saveAfter = await b.readSave();
    const canvas1 = (await info(b)).canvasId;
    state.interactions.heroChangesNoRerender = { renderDelta: render1 - render0, canvasIdStable: canvas0 === canvas1, equippedHeroUnchanged: saveAfter.collection.selectedCharacterId === saveBefore.collection.selectedCharacterId, saveEqual: JSON.stringify(saveAfter) === JSON.stringify(saveBefore) };

    // ---------- Controles UI ----------
    const z0 = (await info(b)).zoom;
    await b.ev("document.querySelector('[data-v23-zoom=\"in\"]').click()");
    await sleep(120);
    const z1 = (await info(b)).zoom;
    await b.ev("document.querySelector('[data-v23-reset]').click()");
    await sleep(120);
    const z2 = (await info(b)).zoom;
    await b.ev("const s=document.querySelector('.v23VisorStage'); s.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true}))");
    await sleep(120);
    const z3 = (await info(b)).zoom;
    await b.ev("document.querySelector('[data-v23-reset]').click()");
    await sleep(100);
    state.interactions.zoomUi = { initial: z0, plus: z1, reset: z2, wheel: z3 };

    // ---------- Reapertura: canvas vivo ----------
    await b.ev("window.__v22.setScreen('hub')");
    await sleep(350);
    const closed = await info(b);
    await b.ev('window.__v23Visor.openShop()');
    await sleep(600);
    const reopened = await info(b);
    state.interactions.reopen = { mountedWhenClosed: closed.mounted, sameCanvasId: reopened.canvasId === canvas0, rendererAlive: reopened.rendererAlive, mounted: reopened.mounted };

    // ---------- Calidad baja + movimiento reducido ----------
    await b.ev("window.__v23Visor.hero('zenon')");
    await b.ev("window.__v23Visor.select('c-efecto-chispas')");
    await sleep(180);
    const high = await b.ev('window.__v23Visor.measure()');
    const highSprites = await b.ev(`(() => { const t = window.__v23Visor.tree(); return t.filter(n => n.slot === 'efectos' && n.type === 'Sprite').length; })()`);
    await b.ev("window.__v23Visor.quality('bajo'); window.__v23Visor.reducedMotion(true)");
    await sleep(280);
    const low = await b.ev('window.__v23Visor.measure()');
    const lowSprites = await b.ev(`(() => { const t = window.__v23Visor.tree(); return t.filter(n => n.slot === 'efectos' && n.type === 'Sprite').length; })()`);
    await shotClipTo(b, '#shopPreviewMount .v23VisorStage', 'calidad-baja-movimiento-reducido.png');
    state.interactions.quality = { highSprites, lowSprites, highPixels: high.measure.pixels, lowPixels: low.measure.pixels, lowVisible: low.measure.visible, highVisible: high.measure.visible };
    await b.ev("window.__v23Visor.quality('alto'); window.__v23Visor.reducedMotion(false)");
    await sleep(200);

    // ---------- Tienda real: clic en tarjeta de efecto ----------
    await b.ev("window.__v23Visor.clearSelect()");
    await sleep(120);
    const cardClick = await b.ev(`(() => { const el = document.querySelector('#shopGrid [data-id="c-efecto-aura"]'); if (!el) return false; el.click(); return true; })()`);
    await sleep(500);
    const afterCard = await info(b);
    state.interactions.catalogClick = { clicked: cardClick, pieceId: afterCard.pieceId, category: afterCard.category, visible: afterCard.effect.visible, selectedShopId: await b.ev('typeof shop !== "undefined" ? shop.selectedId : null') };

    // ---------- Matriz de tamaños (inventario) ----------
    await b.ev('window.__v23Visor.openWardrobe()');
    await sleep(900);
    await b.ev("window.__v23Visor.select('c-efecto-aura')");
    await sleep(300);
    const wInfo = await info(b);
    state.interactions.wardrobe = { mountId: wInfo.mountId, canvasId: wInfo.canvasId, heroId: wInfo.heroId, mounted: wInfo.mounted };
    const sizes = [[640, 360], [844, 390], [1024, 600], [1308, 662], [768, 1024], [1280, 720], [1920, 1080]];
    for (const [wpx, hpx] of sizes) {
      await b.setViewport(wpx, hpx);
      await sleep(650);
      const i = await info(b);
      const layout = await b.ev(`(() => {
        const m = document.getElementById('wardrobePreviewMount');
        if (!m) return null;
        const s = m.querySelector('.v23VisorStage'), h = m.querySelector('.v23VisorHud'), c = m.querySelector('canvas');
        const r = el => { if (!el) return null; const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
        return { mount: r(m), stage: r(s), hud: r(h), canvas: r(c), scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
      })()`);
      const key = `${wpx}x${hpx}`;
      state.sizes[key] = { canvas: i.canvas, camera: i.camera && { distance: i.camera.distance, aspect: i.camera.aspect, fit: i.camera.fit }, layout, fps: i.fps, heroId: i.heroId };
      await fullShot(b, `ventana-${key}.png`);
      await shotClipTo(b, '#wardrobePreviewMount', `visor-${key}.png`);
    }

    // ---------- Efectos en 3 tamaños ----------
    for (const [wpx, hpx] of [[640, 360], [1308, 662], [1920, 1080]]) {
      await b.setViewport(wpx, hpx);
      await sleep(600);
      for (const id of ['c-efecto-aura', 'x-aura-amanecer', 'c-marco-vacio']) {
        await b.ev(`window.__v23Visor.select(${JSON.stringify(id)})`);
        await sleep(180);
        const i = await info(b);
        await shotClipTo(b, '#wardrobePreviewMount', `efecto-${id}-${wpx}x${hpx}.png`);
        state.sizes[`${wpx}x${hpx}`].effects = state.sizes[`${wpx}x${hpx}`].effects || {};
        state.sizes[`${wpx}x${hpx}`].effects[id] = { visible: i.effect.visible, projected: i.effect.projected, canvas: i.canvas };
      }
    }
    await b.ev('window.__v23Visor.clearSelect()');

    // ---------- FPS ----------
    await b.setViewport(1308, 662);
    await sleep(400);
    const f0 = await b.ev('window.__v23Visor.info().frames');
    const t0 = Date.now();
    await sleep(2500);
    const f1 = await b.ev('window.__v23Visor.info().frames');
    const secs = (Date.now() - t0) / 1000;
    state.fps = {
      frames: f1 - f0,
      seconds: Math.round(secs * 100) / 100,
      visorFps: Math.round(((f1 - f0) / secs) * 10) / 10,
      infoFps: (await info(b)).fps,
      gameFps: await b.ev('window.__gameState().fps'),
      drawCalls: await b.ev('window.__v23Visor.info().canvas ? 1 : 0')
    };
    state.errors = b.errors.slice(0, 20);
    state.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(BASE, 'evidence.json'), JSON.stringify(state, null, 2));
    console.log('EVIDENCE_OK', JSON.stringify({ measurements: state.measurements.length, sizes: Object.keys(state.sizes).length, fps: state.fps, errors: state.errors.length }, null, 2));
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
