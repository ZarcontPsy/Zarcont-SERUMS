'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('./cdp');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
(async () => {
  const s = await open({ bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'combined.html'), port: 9540, width: 1308, height: 662 });
  await s.seed(save);
  await s.ev('window.__v23.openShop()');
  await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
  await sleep(800);
  console.log(JSON.stringify(await s.ev(`(() => {
    const q=(sel)=>{const e=document.querySelector(sel); if(!e)return null; const r=e.getBoundingClientRect(),c=getComputedStyle(e); return {rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],overflow:c.overflow,overflowY:c.overflowY,position:c.position,top:c.top,marginTop:c.marginTop,padding:c.padding,height:c.height,lineHeight:c.lineHeight,fontSize:c.fontSize,display:c.display,alignItems:c.alignItems};};
    return { shell:q('.v23ShopShell'), head:q('.v23ShopHead'), main:q('.v23HeadMain'), h1:q('.v23ShopHead h1'), eyebrow:q('.v23ShopHead .eyebrow'), layout:q('.v23ShopLayout'), overlay:q('.v23Overlay') };
  })()`), null, 2));
  await s.close();
})();
