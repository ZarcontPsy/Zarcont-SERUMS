'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'combined.html'), port: 9548, width: 1308, height: 662 });
  await s.seed(save);
  await s.ev('window.__v23.openShop()');
  await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
  await sleep(700);
  const r = await s.ev(`(() => {
    const pts=[[100,36],[100,42],[100,48],[100,52],[100,60]];
    return pts.map(([x,y])=>({x,y,els:document.elementsFromPoint(x,y).slice(0,5).map(e=>e.tagName+'.'+(e.className&&String(e.className).slice(0,40))) }));
  })()`);
  console.log(JSON.stringify(r,null,1));
  await s.close();
})();
