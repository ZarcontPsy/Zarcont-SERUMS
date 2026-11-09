'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'combined.html'), port: 9546, width: 1308, height: 662 });
  await s.seed(save);
  await s.ev('window.__v23.openShop()');
  await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
  await sleep(1000);
  await s.shotClip('.v23ShopHead', path.join(ROOT, '.work', 'v2.3', 'evidence', 'crop-head-live.png'), 2);
  console.log(await s.ev(`(() => { const h=document.querySelector('.v23ShopHead h1'); const r=h.getBoundingClientRect(); const cs=getComputedStyle(h); return {rect:[r.x,r.y,r.width,r.height], lineHeight:cs.lineHeight, fontSize:cs.fontSize, fontFamily:cs.fontFamily, overflow:cs.overflow, clip:cs.clipPath, transform:cs.transform, parentOverflow:getComputedStyle(h.parentElement).overflow, parentClip:getComputedStyle(h.parentElement).clipPath}; })()`));
  await s.close();
})();
