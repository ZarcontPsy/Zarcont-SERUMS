'use strict';
/* Resumen compacto de data/sizes.json para revisión humana. */
const r = require('../data/sizes.json');
const rows = r.sizes.map((s) => ({
  size: s.size,
  doc: { ox: s.welcome.doc.overflowX, oy: s.welcome.doc.overflowY },
  titleInner: { x: s.welcome.els['.titleScreen'].innerScrollX, y: s.welcome.els['.titleScreen'].innerScrollY },
  ctas: s.welcome.groups.ctas,
  routes: s.welcome.groups.routes,
  tools: s.welcome.groups.tools,
  nav: s.welcome.groups.nav,
  version: s.welcome.texts['.v23wVersion'],
  ctaText: s.welcome.texts['.v23wCta'],
  tutPanel: { inside: s.tutorial.els['.v23tutPanel'].inside, scroll: s.tutorial.els['.v23tutPanel'].innerScrollY, h: s.tutorial.els['.v23tutPanel'].h },
  tutNext: s.tutorial.els['[data-action="tutorial-next"]'],
  tutSkip: s.tutorial.els['[data-action="tutorial-skip"]'],
  tutStep: s.tutorial.state.step,
  tutText: s.tutorial.texts['.v23tutProgressText'],
  shop: {
    counts: s.shop.counts, ox: s.shop.doc.overflowX, oy: s.shop.doc.overflowY,
    overlay: s.shop.state.overlayScrollY, header: s.shop.state.headerH,
    grid: { h: s.shop.state.grid.h, scrollH: s.shop.state.grid.scrollH },
    canvas: s.shop.canvas, nav: s.shop.nav, docGen: s.shop.docGen, thumbs: s.shop.thumbs.generated,
    shell: s.shop.state.shell, screenEl: s.shop.els['[data-v23-shop-screen]']
  },
  wardrobe: {
    counts: { t: s.wardrobe.state.total, v: s.wardrobe.state.visible, f: s.wardrobe.state.fullyVisible },
    canvas: s.wardrobe.canvas, nav: s.wardrobe.nav, docGen: s.wardrobe.docGen,
    ox: s.wardrobe.doc.overflowX, oy: s.wardrobe.doc.overflowY,
    shell: s.wardrobe.state.shell
  },
  back: s.backToTitle,
  welcomeScan: s.welcome.scan.slice(0, 6),
  shopScan: s.shop.scan.slice(0, 4),
  wardrobeScan: s.wardrobe.scan.slice(0, 4)
}));
console.log(JSON.stringify({ base: r.base, rows, checks: r.checks, errors: { count: r.errors.errorCount, warnings: r.errors.warningCount, nonLocal: r.errors.nonLocal }, fatal: r.fatal }, null, 1));
