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
      const f = document.querySelector('.v23Filter--slot');
      const kids = [...f.children].map(el => { const r=el.getBoundingClientRect(); const k=getComputedStyle(el); return { tag:el.tagName, cls:el.className, h:Math.round(r.height), w:Math.round(r.width), display:k.display, height:k.height, minH:k.minHeight, maxH:k.maxHeight, lineK:k.lineHeight, pad:k.padding }; });
      const sel = f.querySelector('select');
      const sk = getComputedStyle(sel);
      return { kids, select: { h: Math.round(sel.getBoundingClientRect().height), height: sk.height, minH: sk.minHeight, font: sk.fontSize, opts: sel.options.length } };
    })()`);
    console.log(JSON.stringify(m, null, 2));
  } finally { await s.close(); }
})();
