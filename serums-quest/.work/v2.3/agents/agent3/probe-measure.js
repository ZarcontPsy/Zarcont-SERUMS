'use strict';
/* Sonda de medidas concretas. */
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
  try {
    await s.seed(saveWith({ settings: { tutorialSeen: true, backupReminder: false } }));
    await s.dismissBanners();
    await sleep(500);
    await s.setViewport(1308, 662);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(1500);
    const m = await s.ev(`(() => {
      const grid = document.querySelector('#shopGrid');
      const cs = getComputedStyle(grid);
      const gr = grid.getBoundingClientRect();
      const cat = document.querySelector('.v23Catalog').getBoundingClientRect();
      const shell = document.querySelector('.v23ShopShell').getBoundingClientRect();
      const layout = document.querySelector('.v23ShopLayout').getBoundingClientRect();
      const cards = [...grid.querySelectorAll('.cosmeticCard')];
      return {
        gridRect: {x:Math.round(gr.x),y:Math.round(gr.y),w:Math.round(gr.width),h:Math.round(gr.height)},
        gridStyle: {maxHeight:cs.maxHeight,height:cs.height,overflow:cs.overflow,display:cs.display,cols:cs.gridTemplateColumns},
        scrollH: grid.scrollHeight, clientH: grid.clientHeight,
        catRect: {y:Math.round(cat.y),h:Math.round(cat.height)},
        layoutRect: {y:Math.round(layout.y),h:Math.round(layout.height)},
        shellRect: {y:Math.round(shell.y),h:Math.round(shell.height)},
        cardCount: cards.length,
        cardTops: [...new Set(cards.map(c=>Math.round(c.getBoundingClientRect().top)))],
        cardBottom: Math.round(cards[cards.length-1].getBoundingClientRect().bottom),
        state: window.__v23Shop.state()
      };
    })()`);
    console.log(JSON.stringify(m, null, 2));
    await s.shot(path.join(OUT, 'probe-measure.png'));
  } catch (e) { console.error(e); } finally { await s.close(); }
})();
