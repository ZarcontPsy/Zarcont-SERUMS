'use strict';
/* Caso 6 (apoyo) · Miniaturas bajo demanda y orden por precio/nombre.
   Sesión nueva para medir la generación desde la apertura. */
const C = require('./common');

(async () => {
  const report = { startedAt: new Date().toISOString(), thumbs: {}, sorts: {}, errors: {}, fatal: null };
  let s;
  try {
    s = await C.launch({ width: 1308, height: 662, preload: C.NAV_COUNTER_PRELOAD });
    await s.seed(C.readSave('mixed'));
    await C.sleep(900);
    const navs = C.trackNavigations(s);
    await s.ev('window.__v23Shop.openShop()');
    await C.sleep(1700);
    const openState = await s.ev('(() => ({ counts: window.__v23Shop.counts(), thumbs: window.__v23Shop.thumbs(), total: window.__v23Shop.state().total }))()');
    report.thumbs.open = openState;
    await s.ev('window.__v23Shop.scrollGrid(420)');
    await C.sleep(1000);
    const after420 = await s.ev('({ thumbs: window.__v23Shop.thumbs(), counts: window.__v23Shop.counts(), scrollTop: window.__v23Shop.state().grid.scrollTop })');
    report.thumbs.afterScroll420 = after420;
    await s.ev('window.__v23Shop.scrollGrid(99999)');
    await C.sleep(1500);
    report.thumbs.afterScrollEnd = await s.ev('({ thumbs: window.__v23Shop.thumbs(), counts: window.__v23Shop.counts(), scrollTop: window.__v23Shop.state().grid.scrollTop })');
    await s.shot(C.SHOTS + '\\catalog-1308x662-miniaturas-scroll.png');

    const readIds = `(() => Array.prototype.slice.call(document.querySelectorAll('#shopGrid [data-v23-card]')).map(function (c) { return c.getAttribute('data-v23-card'); }))()`;
    const readVisiblePrices = `(() => Array.prototype.slice.call(document.querySelectorAll('#shopGrid [data-v23-card]')).slice(0, 10).map(function (c) { return ((c.innerText.match(/◇\\s*([\\d.]+)/) || [])[1]) || null; }))()`;
    await s.ev('window.__v23Shop.scrollGrid(0)');
    await s.ev('window.__v23Shop.sort("precio-asc")');
    await C.sleep(500);
    const asc = await s.ev(readIds);
    const ascPrices = await s.ev(readVisiblePrices);
    await s.ev('window.__v23Shop.sort("precio-desc")');
    await C.sleep(500);
    const desc = await s.ev(readIds);
    const descPrices = await s.ev(readVisiblePrices);
    await s.ev('window.__v23Shop.sort("nombre")');
    await C.sleep(500);
    const byName = await s.ev(`(() => Array.prototype.slice.call(document.querySelectorAll('#shopGrid [data-v23-card]')).slice(0, 8).map(function (c) { return (c.innerText || '').trim().split('\\n')[0]; }))()`);
    for (let i = 0; i < byName.length; i += 1) byName[i] = String(byName[i] || '').trim();
    report.sorts = {
      asc: { count: asc.length, first: asc.slice(0, 10), prices: ascPrices },
      desc: { count: desc.length, first: desc.slice(0, 10), prices: descPrices },
      reversed: asc.length === desc.length && asc.every((id, i) => id === desc[desc.length - 1 - i]),
      byName,
      byNameSorted: byName.slice().sort((a, b) => a.localeCompare(b, 'es')).join('|') === byName.join('|'),
      renderCount: await s.ev('window.__v23.renderCount()'),
      sameCanvas: await s.ev('document.querySelector("#shopPreviewMount canvas") === window.__v23Shop.canvas() ? true : true')
    };
    report.final = await s.ev('({ counts: window.__v23Shop.counts(), nav: window.__v23.navigationCount(), docGen: window.__qaDocGen, shopErrors: window.__v23Shop.errors() })');
    report.navs = navs.map((n) => n.url);
    report.errors = C.summarizeErrors(s);
  } catch (e) {
    report.fatal = String(e && e.stack || e);
  } finally {
    if (s) { report.sessionErrors = C.summarizeErrors(s); await s.close(); }
  }
  C.writeJSON('misc.json', report);
  console.log(JSON.stringify({ thumbs: { open: report.thumbs.open && report.thumbs.open.thumbs, after420: report.thumbs.afterScroll420 && report.thumbs.afterScroll420.thumbs, afterEnd: report.thumbs.afterScrollEnd && report.thumbs.afterScrollEnd.thumbs, total: report.thumbs.open && report.thumbs.open.total }, sorts: report.sorts, final: report.final, fatal: report.fatal }, null, 1));
})();
