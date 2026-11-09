'use strict';
/* Caso 6 · Catálogo de tienda a 1308×662: 12+ completas, búsqueda, orden,
   filtros, reset, selección con scroll y miniaturas bajo demanda.
   Se usa el guardado mixto (35 cosméticos) para que precio/estado tengan
   elementos reales sin poseer. */
const C = require('./common');

const readCards = `(() => {
  const cards = Array.prototype.slice.call(document.querySelectorAll('#shopGrid [data-v23-card]'));
  return {
    count: cards.length,
    first: cards.slice(0, 8).map(function (c) {
      const price = (c.innerText.match(/◇\\s*([\\d.]+)/) || [])[1] || null;
      return { id: c.getAttribute('data-v23-card'), rarity: c.getAttribute('data-v23-rarity'), price: price, text: (c.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 70) };
    })
  };
})()`;

(async () => {
  const report = { startedAt: new Date().toISOString(), save: 'save-v23-mixed', size: '1308x662', steps: [], checks: {}, thumbs: {}, errors: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1308, height: 662, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('mixed'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);
    await s.ev('window.__v23Shop.openShop()');
    await C.sleep(1600);
    await s.ev(`(() => { window.__qaCanvas = document.querySelector('#shopPreviewMount canvas'); window.__qaRender = window.__v23.renderCount(); return !!window.__qaCanvas; })()`);
    const base = await s.ev(`(() => ({
      counts: window.__v23Shop.counts(), state: window.__v23Shop.state(), thumbs: window.__v23Shop.thumbs(),
      canvas: window.__v23Shop.canvas(), renderCount: window.__v23.renderCount(),
      selectedId: window.__v23Shop.state().selectedId, nav: window.__v23.navigationCount()
    }))()`);
    report.base = base;
    report.thumbs.open = base.thumbs;
    await s.shot(C.SHOTS + '\\catalog-1308x662-inicial.png');

    /* Búsqueda real por el input (debounce) */
    await s.ev(`(() => { const i = document.querySelector('[data-v23-search="shop"]'); i.value = 'corona'; i.dispatchEvent(new Event('input', { bubbles: true })); return i.value; })()`);
    await C.sleep(600);
    const search = await s.ev(`(() => ({ counts: window.__v23Shop.counts(), state: window.__v23Shop.state(), cards: ${readCards}, renderCount: window.__v23.renderCount(), sameCanvas: document.querySelector('#shopPreviewMount canvas') === window.__qaCanvas }))()`);
    await s.shot(C.SHOTS + '\\catalog-1308x662-busqueda-corona.png');
    report.steps.push({ id: 'busqueda-corona', search });
    await s.click('[data-v23-search-clear="shop"]', 500);
    report.steps.push({ id: 'limpiar-busqueda', data: await s.ev(`(() => ({ counts: window.__v23Shop.counts(), query: window.__v23Shop.state().filters.query, input: document.querySelector('[data-v23-search="shop"]').value, renderCount: window.__v23.renderCount() }))()`) });

    /* Orden precio ascendente */
    await s.ev('window.__v23Shop.sort("precio-asc")');
    await C.sleep(450);
    const sort = await s.ev(`(() => ({ counts: window.__v23Shop.counts(), sort: window.__v23Shop.state().filters.sort, cards: ${readCards}, renderCount: window.__v23.renderCount(), sameCanvas: document.querySelector('#shopPreviewMount canvas') === window.__qaCanvas }))()`);
    await s.shot(C.SHOTS + '\\catalog-1308x662-orden-precio.png');
    report.steps.push({ id: 'orden-precio', sort });

    /* Filtro de rareza */
    await s.ev('window.__v23Shop.filter("rarity", "legendario")');
    await C.sleep(450);
    const rarity = await s.ev(`(() => { const cards = Array.prototype.slice.call(document.querySelectorAll('#shopGrid [data-v23-card]')); return { counts: window.__v23Shop.counts(), rarities: cards.map(function (c) { return c.getAttribute('data-v23-rarity'); }).filter(function (v, i, a) { return a.indexOf(v) === i; }), renderCount: window.__v23.renderCount() }; })()`);
    await s.shot(C.SHOTS + '\\catalog-1308x662-filtro-rareza.png');
    report.steps.push({ id: 'filtro-rareza', rarity });
    await s.ev('window.__v23Shop.filter("rarity", "todas")');
    await C.sleep(350);

    /* Estado «En tienda» */
    await s.ev('window.__v23Shop.filter("collection", "originales")');
    await C.sleep(300);
    await s.ev('window.__v23Shop.filter("status", "tienda")');
    await C.sleep(450);
    const statusTienda = await s.ev(`(() => { const cards = Array.prototype.slice.call(document.querySelectorAll('#shopGrid [data-v23-card]')); return { counts: window.__v23Shop.counts(), cards: cards.slice(0, 6).map(function (c) { return (c.innerText || '').replace(/\\s+/g, ' ').trim(); }), status: window.__v23Shop.state().filters.status, renderCount: window.__v23.renderCount(), sameCanvas: document.querySelector('#shopPreviewMount canvas') === window.__qaCanvas }; })()`);
    await s.shot(C.SHOTS + '\\catalog-1308x662-filtro-estado.png');
    report.steps.push({ id: 'filtro-estado-tienda', statusTienda });
    await s.ev('window.__v23Shop.filter("status", "todos")');
    await C.sleep(300);

    /* Colección Extras */
    await s.ev('window.__v23Shop.filter("collection", "extras")');
    await C.sleep(450);
    const extras = await s.ev(`(() => { const cards = Array.prototype.slice.call(document.querySelectorAll('#shopGrid [data-v23-card]')); return { counts: window.__v23Shop.counts(), ids: cards.slice(0, 8).map(function (c) { return c.getAttribute('data-v23-card'); }), allX: cards.every(function (c) { return /^x-/.test(c.getAttribute('data-v23-card')); }), renderCount: window.__v23.renderCount() }; })()`);
    await s.shot(C.SHOTS + '\\catalog-1308x662-coleccion-extras.png');
    report.steps.push({ id: 'coleccion-extras', extras });

    /* Reset de filtros */
    await s.ev('window.__v23Shop.resetFilters(true)');
    await C.sleep(500);
    report.steps.push({ id: 'reset-filtros', data: await s.ev(`(() => ({ counts: window.__v23Shop.counts(), filters: window.__v23Shop.state().filters, renderCount: window.__v23.renderCount(), sameCanvas: document.querySelector('#shopPreviewMount canvas') === window.__qaCanvas }))()`) });

    /* Selección conservando scroll */
    await s.ev('window.__v23Shop.filter("collection", "todos")');
    await C.sleep(400);
    const scrollSet = await s.ev('window.__v23Shop.scrollGrid(430)');
    await C.sleep(250);
    const beforeSelect = await s.ev('(() => ({ scrollTop: window.__v23Shop.state().grid.scrollTop, renderCount: window.__v23.renderCount() }))()');
    await s.ev('window.__v23Shop.select("c-torso-manto")');
    await C.sleep(600);
    const select = await s.ev(`(() => {
      const selected = document.querySelector('#shopGrid [data-v23-card="c-torso-manto"]');
      return {
        scrollTop: window.__v23Shop.state().grid.scrollTop,
        selectedId: window.__v23Shop.state().selectedId,
        selectedCard: !!selected,
        ariaPressed: selected ? selected.getAttribute('aria-pressed') : null,
        renderCount: window.__v23.renderCount(),
        sameCanvas: document.querySelector('#shopPreviewMount canvas') === window.__qaCanvas,
        canvasId: window.__v23Shop.canvas(),
        piece: window.__v23Visor.info().pieceId
      };
    })()`);
    await s.shot(C.SHOTS + '\\catalog-1308x662-seleccion-scroll.png');
    report.steps.push({ id: 'seleccion-scroll', scrollSet, beforeSelect, select });

    /* Miniaturas bajo demanda: abrir (< total), scroll al final (aumenta) */
    const thumbsBefore = await s.ev('window.__v23Shop.thumbs()');
    await s.ev('window.__v23Shop.scrollGrid(99999)');
    await C.sleep(1400);
    const thumbsAfter = await s.ev('window.__v23Shop.thumbs()');
    const thumbsState = await s.ev('window.__v23Shop.state()');
    report.thumbs = { open: report.thumbs.open, beforeScroll: thumbsBefore, afterScroll: thumbsAfter, countsAfterScroll: await s.ev('window.__v23Shop.counts()'), scrollTop: thumbsState.grid.scrollTop };
    await s.shot(C.SHOTS + '\\catalog-1308x662-scroll-final.png');

    report.checks = await s.ev(`(() => ({
      counts: window.__v23Shop.counts(),
      fullAt1308: window.__v23Shop.counts().fullyVisible,
      renderCount: window.__v23.renderCount(),
      renderDelta: window.__v23.renderCount() - window.__qaRender,
      sameCanvas: document.querySelector('#shopPreviewMount canvas') === window.__qaCanvas,
      canvasId: window.__v23Shop.canvas(),
      nav: window.__v23.navigationCount(),
      docGen: window.__qaDocGen == null ? null : window.__qaDocGen,
      shopErrors: window.__v23Shop.errors(),
      screen: window.__v23.screen()
    }))()`);
    report.navs = navs.map((n) => n.url);
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('catalog.json', report);
  const stepSummary = report.steps.map((x) => {
    const d = x.data || x.search || x.sort || x.rarity || x.statusTienda || x.extras || x.select || {};
    return { id: x.id, counts: d.counts || null, renderCount: d.renderCount == null ? null : d.renderCount };
  });
  console.log(JSON.stringify({ baseCounts: report.base && report.base.counts, stepSummary, thumbs: report.thumbs, checks: report.checks, fatal: report.fatal }, null, 1));
})();
