'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
const evidence = path.join(__dirname, '..', 'evidence');
function withWeights(w) {
  const s = JSON.parse(JSON.stringify(base));
  s.settings.sourceWeights = w;
  return s;
}
async function q(s) {
  return s.ev(`(() => {
    var stem = (document.querySelector('.questionText')||{}).textContent || '';
    var norm = function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
    var n = norm(stem);
    var list = Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];});
    var hit = list.filter(function(x){return norm(x.stem)===n;})[0] || list.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0];
    return hit ? { id: hit.id, answer: hit.answer, source: hit.source } : null;
  })()`);
}
async function runMissionSources(s, label) {
  await s.seed(withWeights(label.weights));
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await s.key('KeyJ'); await sleep(650);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 350);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 350);
  await s.click('[data-action="start-mission"]', 1100);
  const sources = [];
  for (let i = 0; i < 6; i++) {
    const cur = await q(s);
    if (!cur) break;
    sources.push(cur.source);
    await s.click(`[data-action="answer"][data-letter="${cur.answer}"]`, 350);
    if (await s.ev("!!document.querySelector('[data-action=v2-feedback-continue]')")) await s.click('[data-action="v2-feedback-continue"]', 400);
    else if (await s.ev("!!document.querySelector('[data-action=next-question]')")) await s.click('[data-action="next-question"]', 400);
    if (await s.ev("!!document.querySelector('.resultScreen')")) break;
  }
  return { label: label.name, weights: label.weights, sources: sources };
}
(async () => {
  const s = await open({ port: 9368, width: 1280, height: 720, gpu: true });
  const out = {};
  out.campaignOnly = await runMissionSources(s, { name: 'campaign-only', weights: { campaign: 1, dashboard: 0, flashcards: 0 } });
  out.flashcardsOnly = await runMissionSources(s, { name: 'flashcards-only', weights: { campaign: 0, dashboard: 0, flashcards: 1 } });
  out.dashboardOnly = await runMissionSources(s, { name: 'dashboard-only', weights: { campaign: 0, dashboard: 1, flashcards: 0 } });

  // Contrarreloj: el reloj no debe bajar mientras el feedback está abierto.
  await s.seed(withWeights({ campaign: 0.6, dashboard: 0.15, flashcards: 0.25 }));
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await s.key('KeyG'); await sleep(700);
  await s.click('[data-action="start-mode"][data-mode="timed"][data-seconds="180"]', 1100);
  const timer1 = await s.ev("(document.querySelector('[data-mode-timer]')||{}).textContent || ''");
  const cur = await q(s);
  const wrong = ['A', 'B', 'C', 'D'].find((x) => x !== (cur && cur.answer));
  await s.click(`[data-action="answer"][data-letter="${wrong}"]`, 500);
  const overlay = await s.ev("!!document.querySelector('.v2-feedback')");
  await sleep(2200);
  const timer2 = await s.ev("(document.querySelector('[data-mode-timer]')||{}).textContent || ''");
  await s.click('[data-action="v2-feedback-continue"]', 500);
  const timer3 = await s.ev("(document.querySelector('[data-mode-timer]')||{}).textContent || ''");
  out.timed = { timerBefore: timer1, timerDuring: timer2, timerAfter: timer3, overlay: overlay };
  await s.shot(path.join(evidence, '11-contrarreloj-feedback.png'));

  // Simulacro: sin overlay tras responder.
  await s.seed(withWeights({ campaign: 0.6, dashboard: 0.15, flashcards: 0.25 }));
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await s.key('KeyG'); await sleep(700);
  await s.click('[data-action="start-mode"][data-mode="simulacro"]', 1100);
  const cur2 = await q(s);
  if (cur2) await s.click(`[data-action="answer"][data-letter="${cur2.answer}"]`, 600);
  out.simulacro = {
    overlay: await s.ev("!!document.querySelector('.v2-feedback')"),
    state: await s.state()
  };
  await s.shot(path.join(evidence, '12-simulacro-sin-overlay.png'));

  fs.writeFileSync(path.join(evidence, 'learning-modes-verify.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  console.log('errors', JSON.stringify(s.errors));
  await s.close();
})().catch((e) => { console.error(e); process.exit(1); });
