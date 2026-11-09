'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent3', 'integrated.html');
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent3', 'shots');
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 1308, height: 662 });
  try {
    const save = JSON.parse(JSON.stringify(SAVE));
    save.settings = Object.assign({}, save.settings, { tutorialSeen: true, backupReminder: false });
    save.coins = 500; save.achievements = {};
    save.collection.ownedCosmeticIds = save.collection.ownedCosmeticIds.slice(0, 20);
    await s.seed(save); await s.dismissBanners(); await sleep(700);
    await s.setViewport(1308, 662);
    await s.ev('window.__v22.openWardrobe()');
    await s.waitFor("!!document.querySelector('.v23WardrobeShell')", 8000);
    await sleep(1600);
    const m = await s.ev(`(() => {
      const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height), cols: cs.gridTemplateColumns, dir: cs.flexDirection, display: cs.display }; };
      return {
        shell: box('.v23WardrobeShell'), head: box('.v23WardrobeHead'), hero: box('.v23HeroBar'),
        grid: box('.v23WardrobeGrid'), stage: box('.v23WardrobeStage'), previewMount: box('#wardrobePreviewMount'),
        canvas: box('#wardrobePreviewMount canvas'), items: box('.v23WardrobeItems'), itemsGrid: box('#wardrobeItemsGrid'), detail: box('#wardrobeDetail'),
        visor: { hasCanvas: !!document.querySelector('#wardrobePreviewMount canvas'), cls: (document.querySelector('#wardrobePreviewMount')||{}).className || '' },
        state: window.__v23Shop ? window.__v23Shop.state() : null,
        v23visor: !!window.__v23Visor
      };
    })()`);
    console.log(JSON.stringify(m, null, 2));
    await s.shot(path.join(OUT, 'integrated-wardrobe-1308x662.png'));
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(1400);
    const sh = await s.ev(`(() => {
      const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height) }; };
      const h1 = document.querySelector('.v23ShopHead h1');
      return { head: box('.v23ShopHead'), h1: h1 ? { rect: box('.v23ShopHead h1'), scrollH: h1.scrollHeight, clientH: h1.clientHeight, fontSize: getComputedStyle(h1).fontSize, text: h1.textContent } : null, grid: box('#shopGrid'), preview: box('#shopPreviewMount'), canvas: box('#shopPreviewMount canvas'), detail: box('#shopDetailBody') };
    })()`);
    console.log('SHOP', JSON.stringify(sh, null, 2));
    await s.shot(path.join(OUT, 'integrated-shop-1308x662.png'));
  } finally { await s.close(); }
})();
