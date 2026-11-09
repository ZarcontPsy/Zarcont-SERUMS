'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'combined.html'), port: 9539, width: 1308, height: 662 });
  await s.seed(save);
  await s.ev('window.__v23.openWardrobe()');
  await s.waitFor("!!document.querySelector('.v23WardrobeShell')", 8000);
  await sleep(1000);
  console.log(JSON.stringify(await s.ev(`(() => {
    const sel=['.v23WardrobeShell','.v23WardrobeGrid','.v23WardrobeStage','.v23WardrobeItems','.v23WardrobeHead','.wardrobeShell','.overlayShell'];
    const out={};
    for(const q of sel){const e=document.querySelector(q); if(!e){out[q]=null;continue;} const r=e.getBoundingClientRect(),c=getComputedStyle(e); out[q]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),display:c.display,grid:c.gridTemplateColumns,width:c.width,maxWidth:c.maxWidth,flex:c.flex,alignItems:c.alignItems};}
    return out;
  })()`), null, 2));
  await s.close();
})();
