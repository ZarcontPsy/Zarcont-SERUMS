'use strict';
/* Sonda rápida del catálogo V2.3 (Agente 3). No modifica el juego. */
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a3.html');
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent3', 'shots');

function saveWith(patch) {
  const s = JSON.parse(JSON.stringify(SAVE));
  Object.keys(patch || {}).forEach((k) => {
    if (k === 'collection') Object.assign(s.collection, patch.collection);
    else if (k === 'settings') Object.assign(s.settings, patch.settings);
    else s[k] = patch[k];
  });
  return s;
}

(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 1308, height: 662 });
  const result = { errors: [], notes: [] };
  try {
    await s.seed(saveWith({ settings: { tutorialSeen: true, backupReminder: false } }));
    await s.dismissBanners();
    await sleep(600);
    await s.setViewport(1308, 662);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(1800);
    const state = await s.ev('window.__v23Shop.state()');
    result.state = state;
    const cards = await s.ev(`(() => {
      const grid = document.querySelector('#shopGrid');
      const cards = [...document.querySelectorAll('#shopGrid .cosmeticCard')];
      const gr = grid.getBoundingClientRect();
      return {
        grid: { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height) },
        cardRects: cards.slice(0, 8).map(c => { const r=c.getBoundingClientRect(); return { id:c.getAttribute('data-id'), x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height) }; }),
        head: (() => { const h=document.querySelector('.v23ShopHead'); const r=h.getBoundingClientRect(); return { h:Math.round(r.height), y:Math.round(r.y) }; })(),
        preview: (() => { const c=document.querySelector('#shopPreviewMount'); const r=c.getBoundingClientRect(); return { w:Math.round(r.width), h:Math.round(r.height) }; })(),
        detail: (() => { const c=document.querySelector('#shopDetailBody'); const r=c.getBoundingClientRect(); return { w:Math.round(r.width), h:Math.round(r.height), scrollH:c.scrollHeight }; })(),
        slotSel: [...document.querySelectorAll('[data-v23-filter-slot="shop"] option')].map(o=>o.value),
        statusSel: [...document.querySelectorAll('[data-v23-filter-status="shop"] option')].map(o=>o.value),
        collectionSel: [...document.querySelectorAll('[data-v23-filter-collection="shop"] option')].map(o=>o.value),
        sortSel: [...document.querySelectorAll('[data-v23-sort="shop"] option')].map(o=>o.value),
        count: (document.querySelector('[data-v23-count]')||{}).textContent,
        coins: (document.querySelector('[data-v23-coins-value]')||{}).textContent,
        hasSearch: !!document.querySelector('[data-v23-search="shop"]')
      };
    })()`);
    result.dom = cards;
    await s.shot(path.join(OUT, 'probe-shop-1308x662.png'));
  } catch (e) {
    result.fatal = String(e && e.stack || e);
  } finally {
    result.errors = s.errors.slice(0, 10);
    await s.close();
  }
  console.log(JSON.stringify(result, null, 2));
})();
