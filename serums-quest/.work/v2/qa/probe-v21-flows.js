'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-empty.json'), 'utf8'));
let S = null;
function cfg(over) { const s = JSON.parse(JSON.stringify(base)); s.settings = Object.assign({}, s.settings, over); return s; }
async function q(s) {
  return s.ev(`(() => {
    var stem=(document.querySelector('.questionText')||{}).textContent||'';
    var norm=function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
    var n=norm(stem); var list=Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];});
    var hit=list.filter(function(x){return norm(x.stem)===n;})[0]||list.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0];
    return hit?{id:hit.id,answer:hit.answer,source:hit.source,generated:!!hit.generated}:null;
  })()`);
}
async function enterHub(s) {
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
}
async function startMission(s) {
  await s.key('KeyJ'); await sleep(600);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 350);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 350);
  await s.click('[data-action="start-mission"]', 1100);
}
(async () => {
  const s = await open({ port: 9390, width: 1280, height: 720, gpu: true });
  S = s;
  const out = {};
  // each mode
  await s.seed(cfg({ feedbackMode: 'each', onlyOriginalBank: false, sourceWeights: { campaign: 0, dashboard: 0, flashcards: 1 } }));
  await enterHub(s); await startMission(s);
  const q1 = await q(s);
  await s.click(`[data-action="answer"][data-letter="${q1.answer}"]`, 600);
  const each = await s.ev("(() => ({overlay:!!document.querySelector('.v2-feedback'), continueBtn:!!document.querySelector('[data-action=v2-feedback-continue]'), index:window.__gameState().questionIndex}))()");
  if (each.continueBtn) await s.click('[data-action="v2-feedback-continue"]', 700);
  const eachAfter = await s.ev("(() => ({overlay:!!document.querySelector('.v2-feedback'), index:window.__gameState().questionIndex}))()");
  out.each = { q1: q1 && q1.source, each: each, after: eachAfter };

  // only original + weights flashcards
  await s.seed(cfg({ feedbackMode: 'end', onlyOriginalBank: true, sourceWeights: { campaign: 0, dashboard: 0, flashcards: 1 } }));
  await enterHub(s); await startMission(s);
  const orig = await q(s);
  out.onlyOriginal = { q1: orig && orig.source, allowedFlash: await s.ev("window.__V2.perf.questionAllowed({source:'flashcards'})") };

  // summary filters
  await s.seed(cfg({ feedbackMode: 'end', onlyOriginalBank: false, sourceWeights: { campaign: 1, dashboard: 0, flashcards: 0 } }));
  await enterHub(s); await startMission(s);
  for (let i = 0; i < 5; i++) {
    if (await s.ev("window.__gameState().screen === 'result'")) break;
    const cur = await q(s); if (!cur) break;
    let letter = cur.answer;
    if (i < 2) letter = ['A','B','C','D'].find(x => x !== cur.answer);
    await s.click(`[data-action="answer"][data-letter="${letter}"]`, 250);
    await sleep(1050);
  }
  const summaryBefore = await s.ev(`(() => { var s=document.querySelector('.v2-summary'); return s?{text:s.innerText.slice(0,200), total:(s.innerText.match(/FALLADA|CORRECTA/g)||[]).length}:null; })()`);
  const filterBtn = await s.ev("!!document.querySelector('[data-action=v2-summary-filter][data-filter=errors]')");
  if (filterBtn) await s.click('[data-action="v2-summary-filter"][data-filter="errors"]', 500);
  const summaryErrors = await s.ev(`(() => { var s=document.querySelector('.v2-summary'); return s?{text:s.innerText.slice(0,200), total:(s.innerText.match(/FALLADA|CORRECTA/g)||[]).length}:null; })()`);
  const allBtn = await s.ev("!!document.querySelector('[data-action=v2-summary-filter][data-filter=all]')");
  if (allBtn) await s.click('[data-action="v2-summary-filter"][data-filter="all"]', 500);
  const summaryAll = await s.ev(`(() => { var s=document.querySelector('.v2-summary'); return s?{total:(s.innerText.match(/FALLADA|CORRECTA/g)||[]).length}:null; })()`);
  out.summary = { before: summaryBefore, errors: summaryErrors, all: summaryAll, filterBtn: filterBtn, allBtn: allBtn };
  console.log(JSON.stringify(out, null, 2));
  await s.close();
})().catch((e) => { console.error('V21_FLOWS_ERROR', e.stack || e); if (S) S.close(); process.exit(1); });
