'use strict';
const r = require('../data/tutorial.json');
console.log(JSON.stringify({
  allowed: {
    withTutorialSeen: r.allowed.withTutorialSeen,
    autoOpen: r.allowed.autoOpen,
    steps: r.allowed.steps.map((x) => ({ phase: x.phase, step: x.step, active: x.active, sameOverlay: x.sameOverlay, sameTitle: x.sameTitle, sameCanvas: x.sameCanvas, titleConnected: x.titleConnected, overlayOpen: x.overlayOpen, screen: x.screen, renderDelta: x.renderDelta, paintDelta: x.titlePaintDelta, screenMutations: x.screenMutations, progress: x.progress, title: x.stepTitle, next: x.nextLabel })),
    afterClose: r.allowed.afterClose,
    afterReload: r.allowed.afterReload,
    final: r.allowed.final,
    cdpNavigations: r.allowed.cdpNavigations,
    errors: { count: r.allowed.errors.errorCount, warnings: r.allowed.errors.warningCount, nonLocal: r.allowed.errors.nonLocal },
    fatal: r.allowed.fatal
  },
  blocked: {
    initial: r.blocked.initial,
    steps: (r.blocked.steps || []).map((x) => ({ phase: x.phase, step: x.step, sameOverlay: x.sameOverlay, sameTitle: x.sameTitle, sameCanvas: x.sameCanvas, overlayOpen: x.overlayOpen, screen: x.screen, recovery: x.recovery, renderDelta: x.renderDelta, paintDelta: x.titlePaintDelta, mut: x.screenMutations, banner: x.storageBannerText })),
    afterStep: r.blocked.afterStep,
    afterReload: r.blocked.afterReload,
    cdpNavigations: r.blocked.cdpNavigations,
    errors: { count: r.blocked.errors.errorCount, warnings: r.blocked.errors.warningCount, nonLocal: r.blocked.errors.nonLocal },
    fatal: r.blocked.fatal
  }
}, null, 1));
