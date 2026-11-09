'use strict';
/* Sondeo A2: tienda, inventario, 10 héroes, zoom, calidades, tamaños y FPS. */
const path = require('path');
const fs = require('fs');
const { open, sleep, ROOT } = require(path.resolve(__dirname, '..', '..', '..', 'qa', 'cdp.js'));
const save = JSON.parse(fs.readFileSync(path.resolve(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.resolve(__dirname, '..', 'shots', 'probe');
fs.mkdirSync(OUT, { recursive: true });

async function info(b) { return b.ev('window.__v23Visor.info()'); }
async function shot(b, name) { await b.shot(path.join(OUT, name)); }

(async () => {
  const b = await open({ port: 9542, width: 1308, height: 662, bundle: path.resolve(ROOT, '.work', 'v2.3', 'preview', 'a2.html') });
  const report = { heroes: [], sizes: {}, errors: [], checks: {} };
  try {
    await b.seed(save);
    await b.ev('window.__v22.dismissBanners && window.__v22.dismissBanners()');
    await sleep(300);

    // --- Tienda: 10 héroes ---
    await b.ev('window.__v23Visor.openShop()');
    await sleep(900);
    const renderCount0 = await b.ev('window.__v22.renderCount || 0');
    const canvasId0 = (await info(b)).canvasId;
    for (const id of ['ilan', 'mara', 'noa', 'teo', 'lia', 'kian', 'amaru', 'ona', 'iris', 'zenon']) {
      const hi = await b.ev(`window.__v23Visor.hero(${JSON.stringify(id)})`);
      await b.ev("window.__v23Visor.select('c-efecto-aura')");
      await sleep(160);
      const m = await b.ev('window.__v23Visor.measure()');
      report.heroes.push({ id, heroId: hi.heroId, name: hi.heroName, canvasId: hi.canvasId, camera: hi.camera && hi.camera.distance, box: hi.camera && hi.camera.box, measure: m.measure, effect: m.info.effect.projected });
    }
    const renderCount1 = await b.ev('window.__v22.renderCount || 0');
    const canvasId1 = (await info(b)).canvasId;
    report.checks.renderCountDelta = renderCount1 - renderCount0;
    report.checks.canvasIdStable = canvasId0 === canvasId1;
    report.checks.thumbs = await b.ev('window.__v22.thumbs ? window.__v22.thumbs() : null');

    // --- Zoom y reset ---
    const z0 = await info(b);
    await b.ev('window.__v23Visor.zoom(1.6)');
    await sleep(150);
    const z1 = await info(b);
    await b.ev("document.querySelector('.v23VisorStage').dispatchEvent(new WheelEvent('wheel',{deltaY:-120,bubbles:true,cancelable:true}))");
    await sleep(150);
    const z2 = await info(b);
    await b.ev('window.__v23Visor.reset()');
    await sleep(120);
    const z3 = await info(b);
    report.checks.zoom = { initial: z0.zoom, fixed: z1.zoom, wheel: z2.zoom, reset: z3.zoom };

    // --- Estilos y medidas de la escena ---
    report.stage = await b.ev(`(() => {
      const mount = document.getElementById('shopPreviewMount');
      const stage = mount.querySelector('.v23VisorStage');
      const hud = mount.querySelector('.v23VisorHud');
      const cv = mount.querySelector('canvas');
      const r = el => { const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
      return { mount: r(mount), stage: r(stage), hud: r(hud), canvas: r(cv), canvasId: cv.getAttribute('data-v23-canvas-id'), mountOverflow: getComputedStyle(mount).overflow, docScroll: document.documentElement.scrollWidth, innerW: window.innerWidth };
    })()`);
    await shot(b, 'shop-1308.png');
    await b.shotClip('#shopPreviewMount', path.join(OUT, 'shop-mount-1308.png'), 1);

    // --- Calidad baja y movimiento reducido ---
    await b.ev("window.__v23Visor.hero('zenon'); window.__v23Visor.select('c-efecto-chispas')");
    await sleep(250);
    await b.ev("window.__v23Visor.quality('bajo'); window.__v23Visor.reducedMotion(true)");
    await sleep(300);
    const low = await info(b);
    report.checks.lowQualityReduced = { frames: low.frames, effect: low.effect.projected, fps: low.fps };
    await b.shotClip('#shopPreviewMount', path.join(OUT, 'low-reduced-1308.png'), 1);
    await b.ev("window.__v23Visor.quality('alto'); window.__v23Visor.reducedMotion(false)");
    await sleep(200);

    // --- Inventario ---
    await b.ev("window.__v23Visor.openWardrobe()");
    await sleep(900);
    const w = await info(b);
    report.wardrobe = { mountId: w.mountId, canvasId: w.canvasId, canvas: w.canvas, heroId: w.heroId, category: w.category, pieceId: w.pieceId, renderCount: await b.ev('window.__v22.renderCount || 0') };
    report.wardrobe.stage = await b.ev(`(() => {
      const m = document.getElementById('wardrobePreviewMount');
      if (!m) return null;
      const s = m.querySelector('.v23VisorStage'); const h = m.querySelector('.v23VisorHud');
      const r = el => { const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
      return { mount: r(m), stage: r(s), hud: r(h), canvas: r(m.querySelector('canvas')), docScroll: document.documentElement.scrollWidth, innerW: window.innerWidth };
    })()`);
    await shot(b, 'wardrobe-1308.png');
    await b.shotClip('#wardrobePreviewMount', path.join(OUT, 'wardrobe-mount-1308.png'), 1);

    // --- Tamaños ---
    const sizes = [[640, 360], [844, 390], [1024, 600], [1308, 662], [768, 1024], [1280, 720], [1920, 1080]];
    for (const [wpx, hpx] of sizes) {
      await b.setViewport(wpx, hpx);
      await sleep(700);
      const s = await info(b);
      const layout = await b.ev(`(() => {
        const mount = document.getElementById('wardrobePreviewMount');
        const stage = mount && mount.querySelector('.v23VisorStage');
        const cv = mount && mount.querySelector('canvas');
        const hud = mount && mount.querySelector('.v23VisorHud');
        const r = el => { if (!el) return null; const x = el.getBoundingClientRect(); return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) }; };
        return { mount: r(mount), stage: r(stage), hud: r(hud), canvas: r(cv), scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
      })()`);
      report.sizes[wpx + 'x' + hpx] = { canvas: s.canvas, camera: s.camera && { distance: s.camera.distance, aspect: s.camera.aspect }, layout, fps: s.fps };
      await shot(b, `wardrobe-${wpx}x${hpx}.png`);
      await b.shotClip('#wardrobePreviewMount', path.join(OUT, `wardrobe-mount-${wpx}x${hpx}.png`), 1);
    }

    // --- FPS a 1308 ---
    await b.setViewport(1308, 662);
    await sleep(500);
    await b.ev("window.__v23Visor.openShop()");
    await sleep(800);
    const f0 = await b.ev('window.__v23Visor.info().frames');
    const t0 = Date.now();
    await sleep(2500);
    const f1 = await b.ev('window.__v23Visor.info().frames');
    const fpsInfo = await info(b);
    report.fps = { frames: f1 - f0, seconds: (Date.now() - t0) / 1000, visorFps: Math.round((f1 - f0) / ((Date.now() - t0) / 1000) * 10) / 10, infoFps: fpsInfo.fps, gameFps: await b.ev('window.__gameState().fps') };

    // --- Errores de consola ---
    report.errors = b.errors.slice(0, 12);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
