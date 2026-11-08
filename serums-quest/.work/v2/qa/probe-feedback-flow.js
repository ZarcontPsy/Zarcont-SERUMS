'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
const evidence = path.join(__dirname, '..', 'evidence');
async function q(s) {
  return s.ev(`(() => {
    var stem = (document.querySelector('.questionText')||{}).textContent || '';
    var norm = function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
    var n = norm(stem);
    var list = Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];});
    var hit = list.filter(function(x){return norm(x.stem)===n;})[0] || list.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0];
    return hit ? { answer: hit.answer, stem: hit.stem.slice(0,80), source: hit.source, id: hit.id } : null;
  })()`);
}
(async () => {
  const s = await open({ port: 9365, width: 1280, height: 720 });
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  await s.key('KeyJ'); await sleep(700);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 400);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 400);
  await s.click('[data-action="start-mission"]', 1200);
  const q1 = await q(s);
  const wrong = ['A', 'B', 'C', 'D'].find((x) => x !== q1.answer);
  await s.click(`[data-action="answer"][data-letter="${wrong}"]`, 600);
  const flash = await s.ev("!!document.querySelector('[data-action=v2-feedback-flashcard]')");
  console.log('flashcard button', flash, 'q1', q1);
  if (flash) {
    await s.click('[data-action="v2-feedback-flashcard"]', 500);
    await s.shot(path.join(evidence, '09-feedback-flashcard.png'));
    console.log('flashcard open', await s.ev("!!document.querySelector('.v2-flashcard')"));
    await s.click('[data-action="v2-flashcard-close"]', 350);
  }
  const diff = await s.ev("!!document.querySelector('[data-action=v2-feedback-difficult]')");
  if (diff) await s.click('[data-action="v2-feedback-difficult"]', 350);
  const tags = await s.ev("(localStorage.getItem('serumsquest:voxel:state:v1')||'').indexOf('difficult') !== -1");
  console.log('difficult', diff, 'persisted', tags);
  await s.click('[data-action="v2-feedback-continue"]', 650);
  let steps = 0, result = false;
  while (steps < 8 && !result) {
    steps += 1;
    if (await s.ev("!!document.querySelector('.resultScreen')")) { result = true; break; }
    const cur = await q(s);
    if (!cur) break;
    await s.click(`[data-action="answer"][data-letter="${cur.answer}"]`, 500);
    if (await s.ev("!!document.querySelector('[data-action=v2-feedback-continue]')")) await s.click('[data-action="v2-feedback-continue"]', 500);
    else if (await s.ev("!!document.querySelector('[data-action=next-question]')")) await s.click('[data-action="next-question"]', 500);
    result = await s.ev("!!document.querySelector('.resultScreen')");
  }
  console.log('steps', steps, 'result', result, 'screen', (await s.state()).screen);
  await s.shot(path.join(evidence, '10-resultado-campana.png'));
  console.log('errors', JSON.stringify(s.errors));
  await s.close();
})().catch((e) => { console.error(e); process.exit(1); });
