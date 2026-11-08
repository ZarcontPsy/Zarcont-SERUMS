'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-empty.json'), 'utf8'));
const evidence = path.join(__dirname, '..', 'evidence');
async function run(size, port) {
  const s = await open({ port: port, width: size[0], height: size[1], gpu: true });
  try {
    await s.seed(save);
    if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
    if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
    await s.key('KeyJ'); await sleep(600);
    await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 350);
    await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 350);
    await s.click('[data-action="start-mission"]', 1200);
    const m = await s.ev(`(() => {
      var p=document.querySelector('.duelPanel'), w=document.querySelector('.duelPanelWrap');
      var r=function(e){if(!e)return null;var b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};};
      return {screen: window.__gameState().screen, panel:r(p), wrap:r(w), viewport:[innerWidth,innerHeight], bodyClass:document.body.className, sheet:(document.querySelector('[data-v2d-sheet]')||{}).className||null};
    })()`);
    await s.shot(path.join(evidence, `v21-duel-${size[0]}x${size[1]}.png`));
    return m;
  } finally { await s.close(); }
}
(async () => {
  const out = {};
  out.desktop = await run([1280,720], 9382);
  out.tablet = await run([1024,768], 9383);
  out.landscape = await run([844,390], 9384);
  out.portrait = await run([390,844], 9385);
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
