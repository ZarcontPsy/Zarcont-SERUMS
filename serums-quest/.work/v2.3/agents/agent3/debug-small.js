'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a3.html');
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent3', 'shots');
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 640, height: 360 });
  try {
    const save = JSON.parse(JSON.stringify(SAVE));
    save.settings = Object.assign({}, save.settings, { tutorialSeen: true, backupReminder: false });
    save.coins = 500;
    save.achievements = {};
    await s.seed(save);
    await s.dismissBanners();
    await sleep(500);
    await s.setViewport(640, 360);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(1200);
    const m = await s.ev(`(() => {
      const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height), flex:cs.flex, maxH:cs.maxHeight, minH:cs.minHeight, display:cs.display, overflow:cs.overflow }; };
      return {
        shell: box('.v23ShopShell'), head: box('.v23ShopHead'), layout: box('.v23ShopLayout'),
        rail: box('.v23ShopRail'), catalog: box('.v23Catalog'), catHead: box('.v23CatalogHead'), grid: box('#shopGrid'),
        detail: box('.v23Detail'), preview: box('.v23PreviewMount'), detailBody: box('#shopDetailBody'),
        gridStyle: (() => { const g=document.querySelector('#shopGrid'); const cs=getComputedStyle(g); return { cols: cs.gridTemplateColumns, gap: cs.gap, pad: cs.padding, maxH: cs.maxHeight, h: cs.height, scrollH: g.scrollHeight }; })(),
        overlay: box('.v23Overlay')
      };
    })()`);
    console.log(JSON.stringify(m, null, 2));
    await s.shot(path.join(OUT, 'debug-640x360.png'));
  } finally { await s.close(); }
})();
