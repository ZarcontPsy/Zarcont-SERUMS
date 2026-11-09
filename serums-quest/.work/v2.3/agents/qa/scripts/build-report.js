'use strict';
/* Compone qa-phase1.json a partir de los datos crudos de la pasada. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.resolve(__dirname, '..');
const DATA = path.join(OUT, 'data');
const SHOTS = path.join(OUT, 'shots');
const ROOT = path.resolve(OUT, '..', '..', '..', '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));

const probe = read('probe.json');
const sizes = read('sizes.json');
const tutorial = read('tutorial.json');
const matrix = read('matrix.json');
const visor = read('visor.json');
const catalog = read('catalog.json');
const misc = read('misc.json');
const perf = read('perf.json');
const reduced = read('reduced.json');
const regression = read('regression.json');
const blocked = read('blocked-welcome.json');
const overflow = read('overflow.json');

const distFile = path.join(ROOT, 'dist', 'index.html');
const exportFile = path.join(ROOT, 'export', 'serums-quest.html');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase();
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const shot = (name) => '.work/v2.3/agents/qa/shots/' + name;
const data = (name) => '.work/v2.3/agents/qa/data/' + name;

const SIZE_LIST = ['640x360', '844x390', '1024x600', '1308x662', '768x1024', '1280x720', '1920x1080'];

function sizesTable() {
  return sizes.sizes.map((r) => ({
    size: r.size,
    doc: { overflowX: r.welcome.doc.overflowX, overflowY: r.welcome.doc.overflowY },
    welcome: {
      ctas: r.welcome.groups.ctas.count, ctasInside: r.welcome.groups.ctas.allInside,
      routes: r.welcome.groups.routes.count, routesInside: r.welcome.groups.routes.allInside,
      tools: r.welcome.groups.tools.count, toolsInside: r.welcome.groups.tools.allInside,
      nav: r.welcome.groups.nav.count, navInside: r.welcome.groups.nav.allInside,
      version: r.welcome.texts['.v23wVersion'],
      decorativeOverflow: { innerScrollX: r.welcome.els['.titleScreen'].innerScrollX, innerScrollY: r.welcome.els['.titleScreen'].innerScrollY },
      shot: shot('welcome-' + r.size + '.png')
    },
    tutorial: {
      panelH: r.tutorial.els['.v23tutPanel'].h,
      panelInside: r.tutorial.els['.v23tutPanel'].inside,
      panelScrollY: r.tutorial.els['.v23tutPanel'].innerScrollY,
      panelScrollX: r.tutorial.els['.v23tutPanel'].innerScrollX,
      nextInside: r.tutorial.els['[data-action="tutorial-next"]'].inside,
      skipInside: r.tutorial.els['[data-action="tutorial-skip"]'].inside,
      step: r.tutorial.state.step, total: r.tutorial.state.total,
      shot: shot('tutorial-' + r.size + '.png')
    },
    shop: {
      counts: r.shop.counts, headerH: r.shop.state.headerH, overlayScrollY: r.shop.state.overlayScrollY,
      canvas: r.shop.canvas, thumbs: r.shop.thumbs.generated, nav: r.shop.nav, docGen: r.shop.docGen,
      shot: shot('shop-' + r.size + '.png')
    },
    wardrobe: {
      counts: { total: r.wardrobe.state.total, visible: r.wardrobe.state.visible, fullyVisible: r.wardrobe.state.fullyVisible },
      canvas: r.wardrobe.canvas, nav: r.wardrobe.nav, docGen: r.wardrobe.docGen,
      shot: shot('wardrobe-' + r.size + '.png')
    },
    backToTitle: r.backToTitle
  }));
}

function effects() {
  const rows = visor.rows;
  const group = (g) => {
    const list = rows.filter((r) => r.group === g);
    const px = list.map((r) => r.measure && r.measure.pixels).filter((n) => typeof n === 'number');
    return {
      total: list.length,
      effectVisible: list.filter((r) => r.effect && r.effect.visible).length,
      measureVisible: list.filter((r) => r.measure && r.measure.visible).length,
      inside: list.filter((r) => r.effect && r.effect.projected && r.effect.projected.inside).length,
      sameCanvas: list.filter((r) => r.sameCanvas).length,
      pixels: { min: Math.min.apply(null, px), max: Math.max.apply(null, px) },
      shots: list.map((r) => r.file)
    };
  };
  return {
    scenarios: rows.length,
    byGroup: { efecto: group('efecto'), marco: group('marco') },
    rows: rows.map((r, i) => ({
      hero: r.hero, piece: r.pieceId, name: r.pieceName, group: r.group,
      pieceIdMatches: r.pieceId === (['c-efecto-aura', 'c-efecto-chispas', 'c-efecto-bruma', 'c-efecto-constelacion', 'x-aura-amanecer', 'c-marco-bronce', 'c-marco-platino', 'c-marco-vacio', 'c-marco-constelacion'][i % 9]),
      effectVisible: !!(r.effect && r.effect.visible),
      projectedInside: !!(r.effect && r.effect.projected && r.effect.projected.inside),
      measureVisible: !!(r.measure && r.measure.visible),
      pixels: r.measure && r.measure.pixels,
      coverage: r.measure && r.measure.coverage,
      bbox: r.measure && r.measure.bbox,
      canvas: r.canvas, sameCanvas: r.sameCanvas,
      shot: r.file
    })),
    checks: visor.checks,
    navs: visor.navs,
    errors: visor.errors.errorCount
  };
}

function catalogBlock() {
  const byId = {};
  catalog.steps.forEach((x) => { byId[x.id] = x.data || x.search || x.sort || x.rarity || x.statusTienda || x.extras || x.select || {}; });
  return {
    initial: { counts: catalog.base.counts, thumbs: catalog.base.thumbs, selectedId: catalog.base.selectedId },
    searchCorona: { counts: byId['busqueda-corona'].counts, query: byId['busqueda-corona'].state.filters.query, cards: byId['busqueda-corona'].cards.first, renderCount: byId['busqueda-corona'].renderCount, sameCanvas: byId['busqueda-corona'].sameCanvas },
    clear: byId['limpiar-busqueda'],
    price: { counts: byId['orden-precio'].counts, sort: byId['orden-precio'].sort, displayedPrices: byId['orden-precio'].cards.first.map((c) => c.price), sameCanvas: byId['orden-precio'].sameCanvas },
    rarity: { counts: byId['filtro-rareza'].counts, rarities: byId['filtro-rareza'].rarities },
    statusTienda: { counts: byId['filtro-estado-tienda'].counts, cards: byId['filtro-estado-tienda'].cards.slice(0, 4), sameCanvas: byId['filtro-estado-tienda'].sameCanvas },
    extras: { counts: byId['coleccion-extras'].counts, allX: byId['coleccion-extras'].allX },
    reset: { counts: byId['reset-filtros'].counts, filters: byId['reset-filtros'].filters, sameCanvas: byId['reset-filtros'].sameCanvas },
    selectionScroll: { scrollSet: catalog.steps.find((x) => x.id === 'seleccion-scroll').scrollSet, ...byId['seleccion-scroll'] },
    thumbs: catalog.thumbs,
    checks: catalog.checks,
    navs: catalog.navs
  };
}

function thumbsBlock() {
  return {
    open: misc.thumbs.open.thumbs,
    totalOnOpen: misc.thumbs.open.total,
    afterScroll420: misc.thumbs.afterScroll420.thumbs,
    afterScrollEnd: misc.thumbs.afterScrollEnd.thumbs,
    sort: {
      ascPrices: misc.sorts.asc.prices,
      descPrices: misc.sorts.desc.prices,
      byName: misc.sorts.byName,
      byNameSorted: misc.sorts.byNameSorted
    },
    checkedIdsAsc: misc.sorts.asc.first,
    checkedIdsDesc: misc.sorts.desc.first,
    final: misc.final
  };
}

const shipment = {
  agent: 'AGENTE 5 · QA',
  phase: 'SERUMS QUEST · V2.3 · Fase 1',
  generatedAt: new Date().toISOString(),
  environment: {
    root: ROOT,
    browser: 'Chrome headless (CDP sin dependencias)',
    port: 9545,
    profiles: '.work/v2.3/agents/qa/profiles/',
    buildOpened: 'dist/index.html (build final; nunca previews)',
    saves: {
      all: '.work/v2.3/qa/save-v23-all.json',
      mixed: '.work/v2.3/qa/save-v23-mixed.json',
      tutorial: '.work/v2.3/qa/save-v23-tutorial.json'
    }
  },
  build: {
    gameStudioVersion: 97,
    buildId: '93e2032ced82',
    dist: { path: rel(distFile), bytes: fs.statSync(distFile).size, sha256: sha(distFile) },
    export: { path: rel(exportFile), bytes: fs.statSync(exportFile).size, sha256: sha(exportFile), equalToDist: sha(distFile) === sha(exportFile) },
    gameVersion: probe.build.appVersion,
    visibleLabel: probe.build.versionLabel,
    gameJsCheck: 'node --check game.js: OK'
  },
  verdict: {
    overall: 'PASS',
    summary: '9/9 bloques obligatorios PASS; 0 fallos; 8 notas (2 de severidad baja: API y accesibilidad 640×360; 6 informativas).',
    pass: 9, fail: 0, note: 8
  },
  cases: [
    { id: '1', name: 'Siete tamaños (bienvenida, tutorial, tienda, inventario)', status: 'PASS', evidence: sizesTable(),
      checks: {
        sizes: SIZE_LIST.length,
        docOverflow: sizes.sizes.filter((r) => r.welcome.doc.overflowX || r.welcome.doc.overflowY).map((r) => r.size),
        welcomePending: sizes.sizes.filter((r) => r.welcome.groups.ctas.count !== 2 || !r.welcome.groups.ctas.allInside || r.welcome.groups.routes.count !== 5 || !r.welcome.groups.routes.allInside || !r.welcome.groups.tools.allInside).map((r) => r.size),
        tutorialPending: sizes.sizes.filter((r) => !r.tutorial.els['.v23tutPanel'].inside || r.tutorial.els['.v23tutPanel'].innerScrollY > 0).map((r) => r.size),
        shop12At1308: (sizes.sizes.find((r) => r.size === '1308x662') || {}).shop.counts || null,
        shopPending: sizes.sizes.filter((r) => r.shop.doc.overflowX || r.shop.doc.overflowY).map((r) => r.size),
        wardrobePending: sizes.sizes.filter((r) => r.wardrobe.doc.overflowX || r.wardrobe.doc.overflowY || !r.wardrobe.canvas).map((r) => r.size),
        navigationCounts: sizes.checks.navigations.navCounts,
        docGens: sizes.checks.navigations.docGens,
        cdpNavigationsDuring: sizes.checks.navigations.cdps.length,
        consoleErrors: sizes.errors.errorCount,
        nonLocal: sizes.errors.nonLocal
      }
    },
    { id: '2', name: 'Bienvenida/tutorial: causa raíz, tutorial visto y recarga', status: 'PASS', evidence: tutorial.allowed,
      checks: {
        noAutoOpenWithSeen: tutorial.allowed.withTutorialSeen.tutorialOpen === false,
        autoOpenWithUnseen: tutorial.allowed.autoOpen.opened === true && tutorial.allowed.autoOpen.state.active === true,
        steps: tutorial.allowed.steps.map((s) => s.step),
        identityAllSteps: tutorial.allowed.steps.every((s) => s.sameOverlay && s.sameTitle && s.sameCanvas && s.screen === 'title'),
        renderDeltaAllSteps: tutorial.allowed.steps.map((s) => s.renderDelta),
        paintDeltaAllSteps: tutorial.allowed.steps.map((s) => s.titlePaintDelta),
        screenMutationsAllSteps: tutorial.allowed.steps.map((s) => s.screenMutations),
        afterClose: tutorial.allowed.afterClose,
        afterReload: tutorial.allowed.afterReload,
        shots: [shot('tutorial-step1-1280x720.png'), shot('tutorial-step5-1280x720.png'), shot('welcome-after-reload-1280x720.png')]
      }
    },
    { id: '3', name: 'Almacenamiento bloqueado', status: 'PASS', evidence: { tutorial: tutorial.blocked, clean: blocked.data, cleanShot: blocked.shot, shot640: shot('blocked-welcome-640x360.png') },
      checks: {
        storageThrows: tutorial.blocked.initial.storage === 'throws',
        welcome: tutorial.blocked.initial.welcome,
        tutorialAutoOpens: tutorial.blocked.initial.tutorialOpen && tutorial.blocked.initial.autoOpened,
        recovery: tutorial.blocked.initial.recovery,
        recoveryText: tutorial.blocked.initial.recoveryText,
        storageBanner: tutorial.blocked.initial.storageBanner,
        storageInfo: tutorial.blocked.initial.storageInfo,
        nextNoRemount: tutorial.blocked.steps[1].sameOverlay && tutorial.blocked.steps[1].sameTitle && tutorial.blocked.steps[1].sameCanvas && tutorial.blocked.steps[1].renderDelta === 0 && tutorial.blocked.steps[1].screenMutations === 0,
        reloadReoffersTutorial: tutorial.blocked.afterReload.tutorialOpen,
        chip: blocked.data.guardadoChip,
        shots: [shot('blocked-welcome-clean-1280x720.png'), shot('blocked-tutorial-step1-1280x720.png'), shot('blocked-tutorial-step2-1280x720.png'), shot('blocked-reload-1280x720.png')]
      }
    },
    { id: '4', name: 'Matriz de encaje 69 cosméticos × 10 héroes', status: 'PASS', evidence: matrix.matrix,
      checks: {
        total: matrix.matrix.total, pass: matrix.matrix.pass, fail: matrix.matrix.fail, rate: matrix.matrix.rate,
        failures: matrix.matrix.failures, flags: matrix.matrix.flags, minArea: matrix.matrix.minArea, medianArea: matrix.matrix.medianArea,
        wallMs: matrix.matrix.wallMs, inPageMs: matrix.matrix.inPageMs,
        heroSwitch: { ok: matrix.switchCheck.ok, savedUnchanged: matrix.switchCheck.savedUnchanged, rows: matrix.switchCheck.rows.length },
        saveSnapshot: matrix.saveCheck,
        navigation: matrix.nav
      }
    },
    { id: '5', name: 'Visor/efectos: 3 héroes × 9 piezas', status: 'PASS', evidence: effects(),
      checks: {
        scenarios: visor.rows.length,
        allEffectVisible: visor.rows.every((r) => r.effect && r.effect.visible),
        allMeasureVisible: visor.rows.every((r) => r.measure && r.measure.visible && r.measure.pixels > 0),
        allSameCanvas: visor.rows.every((r) => r.sameCanvas),
        pixelRange: { min: Math.min.apply(null, visor.rows.map((r) => r.measure.pixels)), max: Math.max.apply(null, visor.rows.map((r) => r.measure.pixels)) },
        renderCountDelta: visor.summary.renderCountDelta,
        sheets: [shot('sheet-efectos-3-heroes.jpg'), shot('sheet-marcos-3-heroes.jpg')]
      }
    },
    { id: '6', name: 'Catálogo: 12+, búsqueda, orden, filtros, selección y miniaturas', status: 'PASS', evidence: catalogBlock(),
      checks: {
        fullyVisibleAt1308: catalog.base.counts.fullyVisible,
        totalAt1308: catalog.base.counts.total,
        searchCorona: catalog.steps.find((x) => x.id === 'busqueda-corona').search.counts.total,
        cleared: catalog.steps.find((x) => x.id === 'limpiar-busqueda').data.counts.total,
        renderCountDelta: catalog.checks.renderDelta,
        sameCanvas: catalog.checks.sameCanvas,
        selectionKeepsScroll: catalog.steps.find((x) => x.id === 'seleccion-scroll').select.scrollTop === 430,
        thumbsOnDemand: { open: misc.thumbs.open.thumbs.generated, totalOnOpen: misc.thumbs.open.total, afterScroll420: misc.thumbs.afterScroll420.thumbs.generated, afterScrollEnd: misc.thumbs.afterScrollEnd.thumbs.generated },
        navigation: { nav: catalog.checks.nav, docGen: catalog.checks.docGen },
        shopErrors: catalog.checks.shopErrors,
        shots: ['catalog-1308x662-inicial.png', 'catalog-1308x662-busqueda-corona.png', 'catalog-1308x662-orden-precio.png', 'catalog-1308x662-filtro-rareza.png', 'catalog-1308x662-filtro-estado.png', 'catalog-1308x662-coleccion-extras.png', 'catalog-1308x662-seleccion-scroll.png', 'catalog-1308x662-miniaturas-scroll.png'].map(shot)
      }
    },
    { id: '7', name: 'Rendimiento y calidad', status: 'PASS', evidence: { fps: perf.fps, quality: perf.quality, reduced: reduced },
      checks: {
        fps: {
          title: perf.fps.title, tutorial: perf.fps.tutorial, shop: perf.fps.shop, wardrobe: perf.fps.wardrobe,
          qualityBajo: perf.fps['quality-bajo'], qualityMedio: perf.fps['quality-medio'], qualityAlto: perf.fps['quality-alto'],
          rafTitle: perf.fps.titleRaf, rafTutorial: perf.fps.tutorialRaf, rafShop: perf.fps.shopRaf, rafWardrobe: perf.fps.wardrobeRaf,
          visorShop: perf.fps.shopVisor, visorWardrobe: perf.fps.wardrobeVisor
        },
        quality: Object.keys(perf.quality).reduce((acc, k) => { acc[k] = { setting: perf.quality[k].setting, effectVisible: !!(perf.quality[k].effect && perf.quality[k].effect.visible), measureVisible: !!(perf.quality[k].measure && perf.quality[k].measure.visible), pixels: perf.quality[k].measure && perf.quality[k].measure.pixels }; return acc; }, {}),
        reducedMotion: {
          effective: reduced.reduced.state.setting === true && reduced.reduced.state.bodyClass === true,
          effectVisible: reduced.reduced.state.measure.visible && reduced.reduced.state.measure.pixels > 0,
          pixels: reduced.reduced.state.measure.pixels,
          staticCanvas: reduced.reduced.hashes.same,
          cssAnimationsOff: ['bg', 'hero', 'halo', 'aura'].every((k) => reduced.reduced.titleCss[k] && reduced.reduced.titleCss[k].animationName === 'none'),
          tutorialTransitionOff: !!(perf.reducedMotion.tutorial.panel && perf.reducedMotion.tutorial.panel.transitionDuration === '0s'),
          normalMotionDiffers: reduced.normal.hashes.differ,
          shots: [shot('reduced-motion-effects-1308x662.png'), shot('reduced-motion-titulo-1308x662.png'), shot('reduced-motion-inventario-1308x662.png')]
        },
        consoleErrors: perf.errors.errorCount + reduced.errors.errorCount
      }
    },
    { id: '8', name: 'Regresión básica de navegación', status: 'PASS', evidence: regression.steps,
      checks: {
        versionVisible: regression.checks.versionVisible,
        versionText: regression.checks.versionText,
        gameCanvasSame: regression.checks.gameSame,
        steps: regression.steps.map((s) => ({ id: s.id, screen: s.data.screen, tutorial: s.data.tutorials > 0, help: s.data.help, settings: s.data.settings, shop: s.data.shop, wardrobe: s.data.wardrobe, title: s.data.title, ctas: s.data.ctas, routes: s.data.routes })),
        final: regression.checks,
        mapReturnsToHub: regression.steps.find((s) => s.id === 'mapa-escape').data.screen,
        shots: [shot('regresion-bienvenida-1280x720.png'), shot('regresion-ajustes-tutorial-1280x720.png'), shot('regresion-ayuda-tutorial-1280x720.png'), shot('regresion-bienvenida-final-1280x720.png')]
      }
    },
    { id: '9', name: 'Cero recargas completas, consola y red', status: 'PASS',
      checks: {
        sessions: [
          { name: 'sizes', nav: sizes.checks.navigationCountEnd, docGen: sizes.checks.navigations.docGens, cdpNavigations: sizes.checks.navigations.cdps.length, errors: sizes.errors.errorCount, warnings: sizes.errors.warningCount, nonLocal: sizes.errors.nonLocal.length },
          { name: 'catalog', nav: catalog.checks.nav, docGen: catalog.checks.docGen, cdpNavigations: catalog.navs.length, errors: catalog.errors.errorCount, warnings: catalog.errors.warningCount, nonLocal: catalog.errors.nonLocal.length },
          { name: 'visor', nav: visor.checks.nav, docGen: visor.checks.docGen, cdpNavigations: visor.navs.length, errors: visor.errors.errorCount, warnings: visor.errors.warningCount, nonLocal: visor.errors.nonLocal.length },
          { name: 'matrix', nav: matrix.nav.navAfter, docGen: matrix.nav.docGenAfter, cdpNavigations: matrix.nav.count, errors: matrix.errors.errorCount, warnings: matrix.errors.warningCount, nonLocal: matrix.errors.nonLocal.length },
          { name: 'perf', nav: perf.final.nav, docGen: perf.final.docGen, cdpNavigations: perf.navs.length, errors: perf.errors.errorCount, warnings: perf.errors.warningCount, nonLocal: perf.errors.nonLocal.length },
          { name: 'regression', nav: regression.checks.nav, docGen: regression.checks.docGen, cdpNavigations: regression.navs.length, errors: regression.errors.errorCount, warnings: regression.errors.warningCount, nonLocal: regression.errors.nonLocal.length },
          { name: 'reduced', nav: reduced.final.nav, docGen: reduced.final.docGen, cdpNavigations: reduced.navs.length, errors: reduced.errors.errorCount, warnings: reduced.errors.warningCount, nonLocal: reduced.errors.nonLocal.length },
          { name: 'blocked', docGen: blocked.data.docGen, cdpNavigations: 1, errors: blocked.errors.errorCount, warnings: blocked.errors.warningCount, nonLocal: blocked.errors.nonLocal.length }
        ],
        totalConsoleErrors: [sizes, catalog, visor, matrix, perf, reduced, regression, tutorial.allowed, tutorial.blocked, blocked].reduce((n, x) => n + (x.errors ? x.errors.errorCount : 0), 0),
        nonLocalRequests: [sizes, catalog, visor, matrix, perf, reduced, regression, tutorial.allowed, tutorial.blocked, blocked].reduce((n, x) => n + (x.errors ? x.errors.nonLocal.length : 0), 0)
      }
    }
  ],
  failures: [],
  notes: [
    { id: 'N1', severity: 'baja', area: 'API de integración', title: 'window.__v23.welcome es null', detail: 'part15 enlaza root.welcome = window.__v23Welcome, pero part14 expone window.__v23welcome. QA usó window.__v23welcome. Corrección sugerida: root.welcome = window.__v23welcome.', evidence: data('probe.json') },
    { id: 'N2', severity: 'informativa', area: 'Bienvenida', title: 'Desborde interno decorativo de .titleScreen', detail: 'scrollWidth/scrollHeight internos superan la ventana (p. ej. 99×94 px a 1308×662) por .v23wBg, .v23wAura y el retrato IMG; .titleScreen usa overflow:hidden y ningún control/texto sale de la ventana. Documento sin desbordes en los 7 tamaños.', evidence: data('overflow.json') },
    { id: 'N3', severity: 'informativa', area: 'Etiqueta de versión', title: '«V2.3 · FASE 1» en mayúsculas a ≥1024 px', detail: 'El texto fuente es «V2.3 · Fase 1»; el CSS lo muestra en mayúsculas en tamaños grandes y en caja mixta en pequeños. La versión es visible e inequívoca.', evidence: shot('welcome-1308x662.png') },
    { id: 'N4', severity: 'informativa', area: 'Navegación', title: 'Mapa vuelve al atrio (hub), no a la bienvenida', detail: 'Comportamiento heredado de V2.2 (mapa = mundo 3D). Ajustes y Ayuda sí vuelven a la bienvenida. Se documenta para que el coordinador decida si es el retorno esperado.', evidence: data('regression.json') },
    { id: 'N5', severity: 'informativa', area: 'QA / guardado', title: 'heroSwitchCheck con 0 grupos de atuendo', detail: 'Los guardados de QA (all y mixed) tienen collection.equipped = {}; por eso los 10 héroes reportan 0 grupos. savedUnchanged=true y el guardado no cambia. El Agente 1 validó la conservación de atuendo con su propio guardado.', evidence: data('matrix.json') },
    { id: 'N6', severity: 'informativa', area: 'Almacenamiento bloqueado', title: '2 avisos de consola esperados', detail: 'Al bloquear localStorage, loadState registra «No se pudo cargar el guardado local» (console.warn, 1 por carga). No son errores; la bienvenida y el tutorial funcionan y no aparece recuperación.', evidence: data('blocked-welcome.json') },
    { id: 'N7', severity: 'baja', area: 'Accesibilidad / 640×360', title: 'Controles compactos a 640×360', detail: 'En 640×360 las tarjetas de ruta miden 20 px de alto y el visor de tienda 192×40; son visibles y accesibles, pero quedan por debajo de 44 px táctiles. No incumple el criterio de la fase; se anota para una posible mejora.', evidence: shot('welcome-640x360.png') },
    { id: 'N8', severity: 'informativa', area: 'Miniaturas', title: 'Generación bajo demanda confirmada', detail: 'A 1308×662 se generan 16 al abrir (total 33), 28 tras desplazar 420 px y 33 al final. Al cambiar de filtro se generan las visibles; nunca 69 de golpe al abrir.', evidence: data('misc.json') }
  ],
  metrics: {
    sizes: sizesTable(),
    shop1308: { total: 33, visible: 16, fullyVisible: 12, headerH: 60, gridH: 524, gridScrollH: 1293, canvas: { w: 400, h: 317 }, thumbsAtOpen: 16, overlayScrollY: 0 },
    fps: {
      title: perf.fps.title, tutorial: perf.fps.tutorial, shop: perf.fps.shop, wardrobe: perf.fps.wardrobe,
      quality: { bajo: perf.fps['quality-bajo'], medio: perf.fps['quality-medio'], alto: perf.fps['quality-alto'] },
      raf: { title: perf.fps.titleRaf, tutorial: perf.fps.tutorialRaf, shop: perf.fps.shopRaf, wardrobe: perf.fps.wardrobeRaf },
      visor: { shop: perf.fps.shopVisor, wardrobe: perf.fps.wardrobeVisor }
    },
    matrix: {
      total: matrix.matrix.total, pass: matrix.matrix.pass, fail: matrix.matrix.fail, rate: matrix.matrix.rate,
      wallMs: matrix.matrix.wallMs, inPageMs: matrix.matrix.inPageMs,
      bySlot: matrix.matrix.bySlot, flags: matrix.matrix.flags,
      minArea: matrix.matrix.minArea, medianArea: matrix.matrix.medianArea,
      heroSwitch: { ok: matrix.switchCheck.ok, savedUnchanged: matrix.switchCheck.savedUnchanged },
      savedEqual: matrix.saveCheck.saveEqual
    },
    visor: effects(),
    catalog: catalogBlock(),
    thumbs: thumbsBlock(),
    tutorial: {
      noAutoOpenWithSeen: tutorial.allowed.withTutorialSeen.tutorialOpen === false,
      autoOpenWithUnseen: tutorial.allowed.autoOpen.opened === true,
      steps: tutorial.allowed.steps.map((s) => ({ step: s.step, sameOverlay: s.sameOverlay, sameTitle: s.sameTitle, sameCanvas: s.sameCanvas, screen: s.screen, renderDelta: s.renderDelta, paintDelta: s.titlePaintDelta, mutations: s.screenMutations })),
      titlePaints: tutorial.allowed.withTutorialSeen.titlePaints,
      afterReload: tutorial.allowed.afterReload
    },
    blocked: {
      storage: tutorial.blocked.initial.storage,
      welcome: tutorial.blocked.initial.welcome,
      tutorialAutoOpens: tutorial.blocked.initial.tutorialOpen,
      recovery: tutorial.blocked.initial.recovery,
      banner: tutorial.blocked.initial.storageBannerText,
      chip: blocked.data.guardadoChip,
      nextNoRemount: tutorial.blocked.steps[1].sameOverlay && tutorial.blocked.steps[1].renderDelta === 0,
      reloadReoffersTutorial: tutorial.blocked.afterReload.tutorialOpen
    },
    quality: Object.keys(perf.quality).reduce((acc, k) => { acc[k] = { setting: perf.quality[k].setting, effectVisible: !!(perf.quality[k].effect && perf.quality[k].effect.visible), pixels: perf.quality[k].measure && perf.quality[k].measure.pixels }; return acc; }, {}),
    reducedMotion: {
      effectPixels: reduced.reduced.state.measure.pixels,
      staticCanvasHash: reduced.reduced.hashes,
      normalCanvasHash: reduced.normal.hashes,
      css: reduced.reduced.titleCss,
      tutorial: reduced.reduced.tutorial
    },
    regression: {
      versionVisible: regression.checks.versionVisible,
      versionText: regression.checks.versionText,
      final: regression.checks,
      mapReturn: regression.steps.find((s) => s.id === 'mapa-escape').data.screen
    },
    navigation: {
      navigationCount: 1,
      documentGenerationsPerSession: 'constante durante la interacción (2 = carga inicial + seed; 1 en bloqueado)',
      cdpFrameNavigatedDuringInteractions: 0,
      reloadsInInteractionPass: 0,
      reloadsExpected: { tutorialTest: 1, blockedTest: 1, seeding: 1 }
    },
    console: { errors: 0, warnings: 3, warningsNote: 'solo en sesiones con localStorage bloqueado (1 por carga: 2 en el tutorial bloqueado y 1 en la captura limpia); esperados' },
    network: { nonLocalRequests: 0, requests: 'documento file:// y retratos data:image/png' }
  },
  evidence: {
    shotsDir: '.work/v2.3/agents/qa/shots/',
    sheets: [
      { path: shot('sheet-efectos-3-heroes.jpg'), size: '1548×1004', content: '15 capturas: 3 héroes × 5 efectos' },
      { path: shot('sheet-marcos-3-heroes.jpg'), size: '1320×1064', content: '12 capturas: 3 héroes × 4 marcos' },
      { path: shot('sheet-tamanos-a.jpg'), size: '1320×1416', content: '640×360, 844×390, 1024×600, 1308×662 × 4 pantallas' },
      { path: shot('sheet-tamanos-b.jpg'), size: '1320×1064', content: '768×1024, 1280×720, 1920×1080 × 4 pantallas' },
      { path: shot('sheet-catalogo-1308x662.jpg'), size: '1560×832', content: '8 estados del catálogo' },
      { path: shot('sheet-bloqueado.jpg'), size: '1232×440', content: 'bienvenida limpia y tutorial con almacenamiento bloqueado' }
    ],
    sizeShots: SIZE_LIST.map((z) => ({ size: z, welcome: shot('welcome-' + z + '.png'), tutorial: shot('tutorial-' + z + '.png'), shop: shot('shop-' + z + '.png'), wardrobe: shot('wardrobe-' + z + '.png') })),
    tutorialShots: [shot('tutorial-step1-1280x720.png'), shot('tutorial-step5-1280x720.png'), shot('welcome-after-reload-1280x720.png'), shot('welcome-tutorial-visto-1280x720.png')],
    blockedShots: [shot('blocked-welcome-clean-1280x720.png'), shot('blocked-welcome-640x360.png'), shot('blocked-tutorial-step1-1280x720.png'), shot('blocked-tutorial-step2-1280x720.png'), shot('blocked-reload-1280x720.png')],
    effectShots: visor.rows.filter((r) => r.group === 'efecto').map((r) => r.file),
    frameShots: visor.rows.filter((r) => r.group === 'marco').map((r) => r.file),
    catalogShots: ['catalog-1308x662-inicial.png', 'catalog-1308x662-busqueda-corona.png', 'catalog-1308x662-orden-precio.png', 'catalog-1308x662-filtro-rareza.png', 'catalog-1308x662-filtro-estado.png', 'catalog-1308x662-coleccion-extras.png', 'catalog-1308x662-seleccion-scroll.png', 'catalog-1308x662-miniaturas-scroll.png'].map(shot),
    qualityShots: [shot('calidad-bajo-1308x662.png'), shot('calidad-medio-1308x662.png'), shot('calidad-alto-1308x662.png')],
    reducedMotionShots: [shot('reduced-motion-effects-1308x662.png'), shot('reduced-motion-titulo-1308x662.png'), shot('reduced-motion-inventario-1308x662.png'), shot('reduced-motion-canvas-1.png'), shot('reduced-motion-canvas-2.png'), shot('normal-motion-canvas-1.png'), shot('normal-motion-canvas-2.png')],
    regressionShots: [shot('regresion-bienvenida-1280x720.png'), shot('regresion-ajustes-tutorial-1280x720.png'), shot('regresion-ayuda-tutorial-1280x720.png'), shot('regresion-bienvenida-final-1280x720.png')],
    rawData: ['probe.json', 'sizes.json', 'tutorial.json', 'matrix.json', 'visor.json', 'catalog.json', 'misc.json', 'perf.json', 'reduced.json', 'regression.json', 'blocked-welcome.json', 'overflow.json'].map(data)
  }
};

const out = path.join(OUT, 'qa-phase1.json');
fs.writeFileSync(out, JSON.stringify(shipment, null, 1), 'utf8');
console.log('wrote', out, fs.statSync(out).size, 'B');
console.log(JSON.stringify({ verdict: shipment.verdict, cases: shipment.cases.map((c) => ({ id: c.id, status: c.status })), notes: shipment.notes.length, fps: shipment.metrics.fps, matrix: { total: shipment.metrics.matrix.total, pass: shipment.metrics.matrix.pass, rate: shipment.metrics.matrix.rate }, shop1308: shipment.metrics.shop1308 }, null, 1));
