'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const PREVIEW = process.env.PREVIEW_FILE;
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent3', 'shots');
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 1308, height: 662 });
  try {
    const save = JSON.parse(JSON.stringify(SAVE));
    save.settings = Object.assign({}, save.settings, { tutorialSeen: true, backupReminder: false });
    save.coins = 500; save.achievements = {};
    save.collection.ownedCosmeticIds = save.collection.ownedCosmeticIds.slice(0, 20);
    for (const [w,h] of [[640,360],[844,390],[1308,662]]) {
      await s.setViewport(w,h);
      await s.seed(save); await s.dismissBanners(); await sleep(500);
      await s.ev('window.__v22.openShop()');
      await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
      await sleep(1400);
      const m = await s.ev(`(() => {
        const st = window.__v23Shop.state();
        const box = (sel) => { const el=document.querySelector(sel); if(!el) return null; const r=el.getBoundingClientRect(); return { y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height) }; };
        return { st, rail: box('.v23ShopRail'), catalog: box('.v23Catalog'), detail: box('.v23Detail'), head: box('.v23ShopHead'), h1: box('.v23ShopHead h1'), preview: box('#shopPreviewMount'), canvas: box('#shopPreviewMount canvas'), detailBody: box('#shopDetailBody') };
      })()`);
      console.log('SHOP', w+'x'+h, JSON.stringify({ total:m.st.total, vis:m.st.visible, full:m.st.fullyVisible, cols:m.st.columns, head:m.head&&m.head.h, h1:m.h1&&m.h1.h, rail:m.rail&&m.rail.h, catalog:m.catalog&&m.catalog.h, detail:m.detail&&m.detail.h, preview:m.preview&&m.preview.h, canvas:m.canvas, db:m.detailBody&&m.detailBody.h, thumbs:m.st.thumbs, ovX:m.st.overflowX, ovY:m.st.overlayScrollY }));
      await s.shot(path.join(OUT, 'check-shop-'+w+'x'+h+'.png'));
    }
    for (const [w,h] of [[640,360],[1308,662]]) {
      await s.setViewport(w,h);
      await s.seed(save); await s.dismissBanners(); await sleep(500);
      await s.ev('window.__v22.openWardrobe()');
      await s.waitFor("!!document.querySelector('.v23WardrobeShell')", 8000);
      await sleep(1400);
      const m = await s.ev(`(() => {
        const st = window.__v23Shop.state();
        const box = (sel) => { const el=document.querySelector(sel); if(!el) return null; const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return { w:Math.round(r.width), h:Math.round(r.height), cols:cs.gridTemplateColumns }; };
        return { st, grid: box('.v23WardrobeGrid'), stage: box('.v23WardrobeStage'), preview: box('#wardrobePreviewMount'), canvas: box('#wardrobePreviewMount canvas'), items: box('.v23WardrobeItems'), itemsGrid: box('#wardrobeItemsGrid'), detail: box('#wardrobeDetail'), head: box('.v23WardrobeHead') };
      })()`);
      console.log('WARDROBE', w+'x'+h, JSON.stringify({ total:m.st.total, vis:m.st.visible, full:m.st.fullyVisible, cols:m.st.columns, grid:m.grid, stage:m.stage, preview:m.preview, canvas:m.canvas, items:m.items, itemsGrid:m.itemsGrid, detail:m.detail, head:m.head, ovX:m.st.overflowX, ovY:m.st.overlayScrollY }));
      await s.shot(path.join(OUT, 'check-wardrobe-'+w+'x'+h+'.png'));
    }
  } catch(e) { console.error('FATAL', e); } finally { await s.close(); }
})();
