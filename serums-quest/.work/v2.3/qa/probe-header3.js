'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'combined.html'), port: 9547, width: 1308, height: 662 });
  await s.seed(save);
  await s.ev('window.__v23.openShop()');
  await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
  await sleep(700);
  await s.ev(`(() => { const h=document.querySelector('.v23ShopHead h1'); h.style.lineHeight='1.2'; h.style.paddingTop='4px'; h.style.marginTop='0'; const e=document.querySelector('.v23ShopHead .eyebrow'); e.style.marginBottom='2px'; return true; })()`);
  await sleep(300);
  await s.shotClip('.v23ShopHead', path.join(ROOT, '.work', 'v2.3', 'evidence', 'crop-head-live2.png'), 2);
  await s.close();
})();
