'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a3.html');
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 640, height: 360 });
  try {
    const save = JSON.parse(JSON.stringify(SAVE));
    save.settings = Object.assign({}, save.settings, { tutorialSeen: true, backupReminder: false });
    await s.seed(save); await s.dismissBanners(); await sleep(400);
    await s.setViewport(640, 360);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(600);
    const m = await s.ev(`(() => {
      const rail = document.querySelector('.v23ShopRail');
      const cs = getComputedStyle(rail);
      const kids = [...rail.children].map(el => { const r=el.getBoundingClientRect(); const k=getComputedStyle(el); return { cls: el.className, tag: el.tagName, x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height), display:k.display, flex:k.flex, dir:k.flexDirection }; });
      return { dir: cs.flexDirection, wrap: cs.flexWrap, h: Math.round(rail.getBoundingClientRect().height), kids, mq899: matchMedia('(max-width: 899px)').matches, mq640: matchMedia('(max-width: 640px)').matches };
    })()`);
    console.log(JSON.stringify(m, null, 2));
  } finally { await s.close(); }
})();
