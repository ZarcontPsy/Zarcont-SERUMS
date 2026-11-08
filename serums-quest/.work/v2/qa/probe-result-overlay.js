'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-empty.json'), 'utf8'));
let S = null;
async function q(s) {
  return s.ev(`(() => {
    var stem=(document.querySelector('.questionText')||{}).textContent||'';
    var norm=function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
    var n=norm(stem); var list=Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];});
    var hit=list.filter(function(x){return norm(x.stem)===n;})[0]||list.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0];
    return hit?hit.answer:null;
  })()`);
}
(async () => {
  const s = await open({ port: 9389, width: 1280, height: 720, gpu: true });
  S = s;
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await s.key('KeyJ'); await sleep(600);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 350);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 350);
  await s.click('[data-action="start-mission"]', 1100);
  for (let i = 0; i < 5; i++) {
    if (await s.ev("window.__gameState().screen === 'result'")) break;
    const a = await q(s); if (!a) break;
    await s.click(`[data-action="answer"][data-letter="${a}"]`, 250);
    await sleep(1050);
  }
  const info = await s.ev(`(() => {
    var el = document.elementFromPoint(600,245);
    var stack = document.elementsFromPoint(600,245).slice(0,6).map(function(e){return {tag:e.tagName,cls:e.className,text:(e.textContent||'').trim().slice(0,40)};});
    return {el:el?{tag:el.tagName,cls:el.className,text:(el.textContent||'').slice(0,40)}:null, stack:stack};
  })()`);
  await s.shot(path.join(__dirname, '..', 'evidence', 'v21-result-immediate.png'));
  await sleep(5000);
  await s.shot(path.join(__dirname, '..', 'evidence', 'v21-result-after5s.png'));
  console.log(JSON.stringify(info, null, 2));
  await s.close();
})().catch((e) => { console.error(e); if (S) S.close(); process.exit(1); });
