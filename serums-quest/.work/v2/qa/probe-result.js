'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
async function q(s) {
  return s.ev(`(() => {
    var stem = (document.querySelector('.questionText')||{}).textContent || '';
    var norm = function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
    var n = norm(stem);
    var list = Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];});
    var hit = list.filter(function(x){return norm(x.stem)===n;})[0] || list.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0];
    return hit ? hit.answer : null;
  })()`);
}
(async () => {
  const s = await open({ port: 9366, width: 1280, height: 720 });
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  await s.key('KeyJ'); await sleep(700);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 400);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 400);
  await s.click('[data-action="start-mission"]', 1200);
  let steps = 0;
  while (steps < 8) {
    steps++;
    if (await s.ev("!!document.querySelector('.resultScreen')")) break;
    const a = await q(s);
    if (!a) break;
    await s.click(`[data-action="answer"][data-letter="${a}"]`, 400);
    if (await s.ev("!!document.querySelector('[data-action=v2-feedback-continue]')")) await s.click('[data-action="v2-feedback-continue"]', 450);
    else if (await s.ev("!!document.querySelector('[data-action=next-question]')")) await s.click('[data-action="next-question"]', 450);
  }
  const dump = await s.ev(`(() => {
    var rr = document.querySelector('.rewardRows');
    return { text: rr ? rr.innerText : null, html: rr ? rr.innerHTML.slice(0,4000) : null, body: document.body.innerText.slice(-2500) };
  })()`);
  console.log(JSON.stringify(dump, null, 2));
  await s.close();
})().catch((e) => { console.error(e); process.exit(1); });
