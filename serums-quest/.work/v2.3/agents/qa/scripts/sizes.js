'use strict';
/* Caso 1 · Siete tamaños: bienvenida, tutorial, tienda e inventario.
   Una sola página: los cambios de tamaño son emulación, no recargas. */
const C = require('./common');

const SIZES = [
  [640, 360], [844, 390], [1024, 600], [1308, 662], [768, 1024], [1280, 720], [1920, 1080]
];

const welcomeCfg = {
  els: ['.titleScreen', '.v23wShell', '.v23wMain', '.v23wFoot', '.v23wTop', '.v23wCta', '.v23wCta2', '.v23wRoutes', '.v23wDock'],
  groups: { ctas: '[data-action="menu-continue"], [data-action="open-tutorial"]', routes: '.v23wRoute', tools: '.v23wTool', nav: '.v23wNavBtn' },
  texts: ['.v23wVersion', '.v23wGenre', '.v23wLogo', '.v23wCta', '.v23wCta2'],
  scan: '.titleScreen'
};
const tutorialCfg = {
  els: ['#v23Tutorial', '.v23tutPanel', '.v23tutBody', '.v23tutHead', '.v23tutFoot', '[data-action="tutorial-next"]', '[data-action="tutorial-prev"]', '[data-action="tutorial-skip"]'],
  groups: { dots: '.v23tutDot' },
  texts: ['.v23tutProgressText', '.v23tutBody h2', '[data-action="tutorial-next"]'],
  scan: '.v23tutPanel'
};
const shopCfg = {
  els: ['[data-v23-shop-screen]', '[data-v23-shop-head]', '[data-v23-shop-rail]', '[data-v23-shop-catalog]', '[data-v23-shop-detail]', '[data-v23-grid]', '#shopPreviewMount', '#shopPreviewMount canvas'],
  groups: { cards: '[data-v23-grid] [data-v23-card]' },
  texts: ['[data-v23-count]', '[data-v23-coins-value]'],
  scan: '[data-v23-shop-screen]'
};
const wardrobeCfg = {
  els: ['[data-v23-wardrobe-screen]', '[data-v23-wardrobe-head]', '#wardrobeItemsGrid', '#wardrobePreviewMount', '#wardrobePreviewMount canvas'],
  groups: { cards: '#wardrobeItemsGrid [data-v23-card]' },
  texts: ['[data-v23-count]'],
  scan: '[data-v23-wardrobe-screen]'
};

function sizeLabel(w, h) { return w + 'x' + h; }

(async () => {
  const report = { startedAt: new Date().toISOString(), bundle: C.rel(C.BUNDLE), sizes: [], checks: {}, errors: {}, notes: [] };
  let s;
  try {
    s = await C.launch({ width: 1280, height: 720, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('all'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);
    const base = await s.ev('({ screen: window.__v23.screen(), renderCount: window.__v23.renderCount(), nav: window.__v23.navigationCount(), docGen: window.__qaDocGen, titlePaints: window.__v23welcome.titlePaints(), canvasCount: document.querySelectorAll("canvas").length })');
    report.base = base;

    for (const [w, h] of SIZES) {
      const label = sizeLabel(w, h);
      const row = { size: label, w, h };
      await s.setViewport(w, h);
      await s.ev('window.__v23.openTitle()');
      await C.sleep(650);
      row.welcome = await C.layout(s, welcomeCfg);
      row.welcome.shot = C.rel(await C.shot(s, 'welcome-' + label + '.png'));

      /* Tutorial abierto desde el CTA de la bienvenida. */
      await s.click('[data-action="open-tutorial"]');
      await C.sleep(450);
      row.tutorial = await C.layout(s, tutorialCfg);
      row.tutorial.state = await s.ev('window.__v23welcome.tutorialState()');
      row.tutorial.shot = C.rel(await C.shot(s, 'tutorial-' + label + '.png'));
      await s.ev('window.__v23welcome.close()');
      await C.sleep(450);

      /* Tienda */
      await s.ev('window.__v23Shop.openShop()');
      await C.sleep(1500);
      row.shop = await C.layout(s, shopCfg);
      row.shop.counts = await s.ev('window.__v23Shop.counts()');
      row.shop.state = await s.ev('window.__v23Shop.state()');
      row.shop.thumbs = await s.ev('window.__v23Shop.thumbs()');
      row.shop.canvas = await s.ev('window.__v23Shop.canvas()');
      row.shop.shot = C.rel(await C.shot(s, 'shop-' + label + '.png'));
      row.shop.renderCount = await s.ev('window.__v23.renderCount()');
      row.shop.nav = await s.ev('window.__v23.navigationCount()');
      row.shop.docGen = await s.ev('typeof window.__qaDocGen === "number" ? window.__qaDocGen : null');
      await s.ev('window.__v23.openTitle()');
      await C.sleep(500);

      /* Inventario */
      await s.ev('window.__v23Shop.openWardrobe()');
      await C.sleep(1500);
      row.wardrobe = await C.layout(s, wardrobeCfg);
      row.wardrobe.state = await s.ev('window.__v23Shop.state()');
      row.wardrobe.canvas = await s.ev('window.__v23Shop.canvas()');
      row.wardrobe.shot = C.rel(await C.shot(s, 'wardrobe-' + label + '.png'));
      row.wardrobe.renderCount = await s.ev('window.__v23.renderCount()');
      row.wardrobe.nav = await s.ev('window.__v23.navigationCount()');
      await s.ev('window.__v23.openTitle()');
      await C.sleep(450);
      row.backToTitle = await s.ev('({ screen: window.__v23.screen(), ctas: document.querySelectorAll(\'[data-action="menu-continue"], [data-action="open-tutorial"]\').length, routes: document.querySelectorAll(".v23wRoute").length })');
      report.sizes.push(row);
      console.log(label, JSON.stringify({
        welcome: row.welcome.doc,
        cta: row.welcome.groups.ctas,
        routes: row.welcome.groups.routes,
        tutorial: { inside: row.tutorial.els['.v23tutPanel'] && row.tutorial.els['.v23tutPanel'].inside, scroll: row.tutorial.els['.v23tutPanel'] && row.tutorial.els['.v23tutPanel'].innerScrollY },
        shop: { counts: row.shop.counts, doc: row.shop.doc, overlayScrollY: row.shop.state.overlayScrollY, canvas: row.shop.canvas },
        wardrobe: { doc: row.wardrobe.doc, canvas: row.wardrobe.canvas, counts: { total: row.wardrobe.state.total, visible: row.wardrobe.state.visible, fully: row.wardrobe.state.fullyVisible } }
      }));
    }

    report.checks.navigations = { cdps: navs.map((n) => n.url), count: navs.length, navCounts: report.sizes.map((r) => r.shop.nav), docGens: report.sizes.map((r) => r.shop.docGen) };
    report.checks.renderCountEnd = await s.ev('window.__v23.renderCount()');
    report.checks.navigationCountEnd = await s.ev('window.__v23.navigationCount()');
    report.checks.canvasCountTitle = await s.ev('document.querySelectorAll("canvas").length');
    report.checks.shopErrors = await s.ev('window.__v23Shop.errors()');
    report.checks.visorInfo = await s.ev('window.__v23Visor.info()');
    report.checks.screenEnd = await s.ev('window.__v23.screen()');
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('sizes.json', report);
  console.log('FATAL', report.fatal || 'none');
  console.log('ERRORS', JSON.stringify(report.errors || report.sessionErrors));
})();
