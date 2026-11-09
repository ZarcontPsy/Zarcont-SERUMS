'use strict';
/* Sonda inicial: APIs, versión, bienvenida, tiempo de matriz y tienda 1308. */
const path = require('path');
const C = require('./common');

(async () => {
  const out = { startedAt: new Date().toISOString(), build: {}, api: {}, welcome1280: null, welcome1308: null, shop1308: null, matrixTiming: {}, errors: {} };
  let s;
  try {
    s = await C.launch({ width: 1280, height: 720 });
    await s.seed(C.readSave('all'));
    await C.sleep(500);
    const navs = C.trackNavigations(s);
    out.build = {
      bundle: C.rel(C.BUNDLE),
      bytes: require('fs').statSync(C.BUNDLE).size,
      versionLabel: await s.ev("(document.querySelector('.v23wVersion')||{}).textContent || null"),
      appVersion: await s.ev('window.__v23 ? window.__v23.version : null'),
      gameState: await s.ev('window.__gameState ? Object.keys(window.__gameState()) : null')
    };
    out.api = await s.ev(`(() => {
      const keys = (o) => o ? Object.keys(o).sort() : null;
      const st = (fn) => { try { return fn(); } catch (e) { return 'ERR:' + e.message; } };
      return {
        v23: keys(window.__v23),
        v23Shop: keys(window.__v23Shop),
        v23Visor: keys(window.__v23Visor),
        v23Anchors: keys(window.__v23Anchors),
        v23welcome: keys(window.__v23welcome),
        v23Welcome: window.__v23Welcome ? keys(window.__v23Welcome) : null,
        refs: { welcome: !!window.__v23.welcome, shop: !!window.__v23.shop, visor: !!window.__v23.visor, anchors: !!window.__v23.anchors },
        v23ref: st(() => window.__v23.snapshot()),
        anchorsReady: st(() => window.__v23Anchors.ready),
        visorInfo: st(() => { const i = window.__v23Visor ? window.__v23Visor.info() : null; return i ? { canvasId: i.canvasId, mounted: i.mounted, mountId: i.mountId, heroId: i.heroId, screen: i.screen } : null; }),
        storage: st(() => { try { localStorage.setItem('__qa_probe', '1'); localStorage.removeItem('__qa_probe'); return true; } catch (e) { return false; } }),
        session: st(() => { try { sessionStorage.setItem('__qa_probe', '1'); return true; } catch (e) { return false; } }),
        navEntries: performance.getEntriesByType('navigation').length,
        docGen: window.__qaDocGen == null ? null : window.__qaDocGen,
        tutorialOpen: !!document.querySelector('#v23Tutorial.is-open'),
        tutorialSeen: st(() => window.__v23welcome.tutorialState()),
        screen: st(() => window.__v23.screen())
      };
    })()`);

    out.welcome1280 = await C.layout(s, {
      els: ['.titleScreen', '.v23wShell', '.v23wMain', '.v23wFoot', '.v23wCta', '.v23wCta2', '.v23wRoutes', '.v23wNav', '.v23wDock'],
      groups: { ctas: '[data-action="menu-continue"], [data-action="open-tutorial"]', routes: '.v23wRoute', tools: '.v23wTool' },
      texts: ['.v23wVersion', '.v23wGenre', '.v23wLogo']
    });
    await s.setViewport(1308, 662);
    await C.sleep(400);
    out.welcome1308 = await C.layout(s, {
      els: ['.titleScreen', '.v23wShell', '.v23wCta', '.v23wCta2', '.v23wRoutes'],
      groups: { ctas: '[data-action="menu-continue"], [data-action="open-tutorial"]', routes: '.v23wRoute', tools: '.v23wTool' },
      texts: ['.v23wVersion']
    });

    /* Tiempo de auditoría de matriz (6 casos) para estimar la matriz completa. */
    const t0 = Date.now();
    const slice = await s.ev('window.__v23Anchors.matrix({from:0,to:6})');
    out.matrixTiming.slice6 = { ms: Date.now() - t0, total: slice && slice.summary };
    const t1 = Date.now();
    const one = await s.ev('window.__v23Anchors.audit("ilan","c-efecto-aura")');
    out.matrixTiming.one = { ms: Date.now() - t1, status: one && one.status, area: one && one.areaFull };

    out.shop1308 = await (async () => {
      await s.ev('window.__v23Shop.openShop()');
      await C.sleep(1600);
      const counts1 = await s.ev('window.__v23Shop.counts()');
      const st1 = await s.ev('window.__v23Shop.state()');
      const thumbs1 = await s.ev('window.__v23Shop.thumbs()');
      const canvas1 = await s.ev('window.__v23Shop.canvas()');
      await s.ev('window.__v23Shop.scrollGrid(420)');
      await C.sleep(900);
      const thumbs2 = await s.ev('window.__v23Shop.thumbs()');
      const st2 = await s.ev('window.__v23Shop.state()');
      const lay = await C.layout(s, { els: ['[data-v23-shop-screen]', '[data-v23-shop-head]', '[data-v23-grid]', '#shopPreviewMount', '#shopPreviewMount canvas'], groups: {}, texts: ['[data-v23-count]'] });
      return { counts1, state: st1, thumbs1, canvas1, afterScroll: { thumbs: thumbs2, scrollTop: st2.grid && st2.grid.scrollTop, counts: await s.ev('window.__v23Shop.counts()') }, layout: lay };
    })();

    await s.ev('window.__v23.openTitle()');
    await C.sleep(700);
    out.afterClose = await C.layout(s, { els: ['.titleScreen'], groups: { ctas: '[data-action="menu-continue"], [data-action="open-tutorial"]' } });
    out.navigationsDuring = navs.map((n) => n.url);
    out.final = await s.ev('({ screen: window.__v23.screen(), nav: performance.getEntriesByType("navigation").length, docGen: window.__qaDocGen, renderCount: window.__v23.renderCount(), canvasCount: document.querySelectorAll("canvas").length })');
    out.errors = C.summarizeErrors(s);
  } catch (e) {
    out.fatal = String(e && e.stack || e);
  } finally {
    if (s) { out.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('probe.json', out);
  console.log(JSON.stringify({ build: out.build, timing: out.matrixTiming, shopCounts: out.shop1308 && out.shop1308.counts1, thumbs: out.shop1308 && out.shop1308.thumbs1, overflow: out.welcome1280 && out.welcome1280.doc, over1308: out.welcome1308 && out.welcome1308.doc, fatal: out.fatal }, null, 1));
})();
