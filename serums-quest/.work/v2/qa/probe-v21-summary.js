'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-empty.json'), 'utf8'));
const evidence = path.join(__dirname, '..', 'evidence');
let S = null;
async function q(s) {
  return s.ev(`(() => {
    var stem=(document.querySelector('.questionText')||{}).textContent||'';
    var norm=function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
    var n=norm(stem); var list=Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];});
    var hit=list.filter(function(x){return norm(x.stem)===n;})[0]||list.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0];
    return hit?{id:hit.id,answer:hit.answer}:null;
  })()`);
}
(async () => {
  const s = await open({ port: 9386, width: 1280, height: 720, gpu: true });
  S = s;
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await s.key('KeyJ'); await sleep(650);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 350);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 350);
  await s.click('[data-action="start-mission"]', 1100);
  for (let i = 0; i < 5; i++) {
    if (await s.ev("window.__gameState().screen === 'result'")) break;
    const cur = await q(s);
    if (!cur) break;
    let letter = cur.answer;
    if (i < 2) letter = ['A','B','C','D'].find(x => x !== cur.answer);
    await s.click(`[data-action="answer"][data-letter="${letter}"]`, 250);
    await sleep(1050);
  }
  const info = await s.ev(`(() => {
    var sum=document.querySelector('.v2-summary');
    if (!sum) return {summary:false, screen:window.__gameState().screen};
    var rows=[...sum.querySelectorAll('[class*=row]')].filter(e=>e.querySelector('[data-action]')||e.innerText.includes('TU RESPUESTA'));
    return {
      summary:true,
      text:sum.innerText.slice(0,900),
      actions:[...sum.querySelectorAll('[data-action]')].map(e=>e.getAttribute('data-action')).slice(0,20),
      filters:[...sum.querySelectorAll('[data-action*=filter]')].map(e=>({a:e.getAttribute('data-action'),t:e.textContent.trim(),pressed:e.getAttribute('aria-pressed')})),
      rows:rows.length,
      tags:[...sum.querySelectorAll('.v2-summary__flag')].map(e=>e.textContent).slice(0,5)
    };
  })()`);
  await s.shot(path.join(evidence, 'v21-summary-errors.png'));
  if (info.summary) {
    const filter = await s.ev("!!document.querySelector('[data-action=\"v2-summary-filter-errors\"]')");
    if (filter) await s.click('[data-action="v2-summary-filter-errors"]', 500);
    const afterFilter = await s.ev("document.querySelector('.v2-summary').innerText.slice(0,500)");
    const diff = await s.ev("!!document.querySelector('[data-action*=difficult]')");
    if (diff) await s.click('[data-action*=difficult]', 400);
    const flash = await s.ev("!!document.querySelector('[data-action*=flashcard]')");
    if (flash) await s.click('[data-action*=flashcard]', 500);
    const flashOpen = await s.ev("!!document.querySelector('.v2-summary__flash, .v2-flashcard, [class*=flashcard]')");
    await s.shot(path.join(evidence, 'v21-summary-flashcard.png'));
    info.filter = filter; info.afterFilter = afterFilter; info.difficult = diff; info.flash = flash; info.flashOpen = flashOpen;
    const tags = await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).questionTags");
    info.tagsState = tags;
  }
  console.log(JSON.stringify(info, null, 2));
  await s.close();
})().catch((e) => { console.error('V21_SUMMARY_ERROR', e.stack || e); if (S) S.close(); process.exit(1); });
