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
    return hit?{id:hit.id,answer:hit.answer,stem:hit.stem.slice(0,70),source:hit.source,generated:!!hit.generated}:null;
  })()`);
}
(async () => {
  const s = await open({ port: 9380, width: 1280, height: 720, gpu: true });
  S = s;
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  const warnings0 = s.errors.slice();
  await s.key('KeyJ'); await sleep(650);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 350);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 350);
  await s.click('[data-action="start-mission"]', 1200);
  const duelInfo = await s.ev(`(() => { var p=document.querySelector('.duelPanelWrap'); var d=document.querySelector('.duelPanel'); return {html: document.body.className, panel: p?p.getBoundingClientRect():null, duel: d?d.getBoundingClientRect():null, overlay: !!document.querySelector('.v2-feedback'), version: (document.body.innerText||'').includes('V2 · Final')}; })()`);
  const q1 = await q(s);
  await s.click(`[data-action="answer"][data-letter="${q1.answer}"]`, 250);
  const afterAnswer = await s.ev(`(() => ({ feedbackOverlay: !!document.querySelector('.v2-feedback'), strip: !!document.querySelector('.feedbackStrip'), nextBtn: !!document.querySelector('[data-action=next-question]') }))()`);
  await sleep(1200);
  const afterWait = await s.ev(`(() => ({ index: window.__gameState().questionIndex, overlay: !!document.querySelector('.v2-feedback'), summary: !!document.querySelector('.v2-summary') }))()`);
  // responder hasta el final
  let steps = 0;
  while (steps < 8) {
    steps++;
    if (await s.ev("window.__gameState().screen === 'result'")) break;
    const cur = await q(s);
    if (!cur) break;
    await s.click(`[data-action="answer"][data-letter="${cur.answer}"]`, 250);
    await sleep(1050);
  }
  const result = await s.ev(`(() => ({ screen: window.__gameState().screen, summary: !!document.querySelector('.v2-summary'), text: (document.querySelector('.v2-summary')||{}).innerText||'' , firstRows: [...document.querySelectorAll('.v2-summary__row')].slice(0,3).map(e=>e.innerText.slice(0,120)) }))()`);
  await s.shot(path.join(__dirname, '..', 'evidence', 'v21-result.png'));
  await s.click('[data-action="result-continue"]', 700).catch(()=>{});
  const settings = await s.ev(`(() => { var b=document.body.innerText; return {feedbackMode: b.includes('Al final del nivel'), bank: b.includes('banco original') || b.includes('solo preguntas')}; })()`);
  console.log(JSON.stringify({ duelInfo, q1, afterAnswer, afterWait, result, settings, warnings: s.errors.slice(0,5), network: s.requests.filter(u=>!/^(file|data|blob):/.test(u)) }, null, 2));
  await s.close();
})().catch((e) => { console.error('V21_PROBE_ERROR', e.stack || e); if (S) S.close(); process.exit(1); });
