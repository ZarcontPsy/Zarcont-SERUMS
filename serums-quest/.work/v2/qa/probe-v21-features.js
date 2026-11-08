'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const empty = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-empty.json'), 'utf8'));
const low = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-low.json'), 'utf8'));
const mastery = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-mastery-etica.json'), 'utf8'));
let S = null;
async function enterHub(s) {
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
}
(async () => {
  const s = await open({ port: 9387, width: 1280, height: 720, gpu: true });
  S = s;
  const out = {};
  await s.seed(empty);
  // Ajustes: toggles
  await s.click('[data-action="open-settings"]', 800);
  const before = await s.ev("(() => { var st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); return {fb:st.settings.feedbackMode, only:st.settings.onlyOriginalBank}; })()");
  await s.click('[data-action="v2-feedback-mode"][data-mode="each"]', 400);
  await s.click('[data-action="v2-perf-original-bank"]', 400);
  const after = await s.ev("(() => { var st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); return {fb:st.settings.feedbackMode, only:st.settings.onlyOriginalBank, allowedFlash: window.__V2.perf.questionAllowed({source:'flashcards'}), allowedCampaign: window.__V2.perf.questionAllowed({source:'campaign'})}; })()");
  await s.shot(path.join(__dirname, '..', 'evidence', 'v21-settings-on.png'));
  await s.send('Page.reload', { ignoreCache: true }); await sleep(2400);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  const persisted = await s.ev("(() => { var st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); return {fb:st.settings.feedbackMode, only:st.settings.onlyOriginalBank}; })()");
  out.settings = { before: before, after: after, persisted: persisted };

  // Momento del feedback por defecto + auto avance (reset a end)
  await s.seed(empty);
  await enterHub(s);
  const modeDefault = await s.ev("(() => { var st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); return {fb:st.settings.feedbackMode, inline:window.__V2.feedback.inlineEnabled(), delay:window.__V2.feedback.autoAdvanceDelay({mode:'mission'})}; })()");
  out.feedbackDefault = modeDefault;

  // Generada: pesos dashboard 100
  const dash = JSON.parse(JSON.stringify(empty)); dash.settings.sourceWeights = {campaign:0,dashboard:1,flashcards:0}; dash.settings.onlyOriginalBank = false;
  await s.seed(dash);
  await enterHub(s);
  await s.key('KeyJ'); await sleep(600);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 350);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 350);
  await s.click('[data-action="start-mission"]', 1100);
  out.generated = await s.ev("(() => { var chip=document.querySelector('.chip--generated'); return {chip: chip?chip.textContent.trim():null, body:document.body.innerText.slice(0,400)}; })()");
  await s.shot(path.join(__dirname, '..', 'evidence', 'v21-generated-chip.png'));

  // Restauración máxima persistente: mastery -> low
  await s.seed(mastery);
  await enterHub(s);
  const rest1 = await s.ev('window.__V2.world.stats().restoration.levels');
  await s.seed(low);
  await enterHub(s);
  const rest2 = await s.ev('window.__V2.world.stats().restoration.levels');
  out.restoration = { mastery: rest1, lowAfter: rest2 };

  // Culling y sombras
  await s.seed(empty);
  await enterHub(s);
  out.perf = await s.ev('window.__V2.perf.stats()');
  out.worldStats = await s.ev('window.__V2.world.stats().restoration');
  await s.shot(path.join(__dirname, '..', 'evidence', 'v21-atrio-culling.png'));
  out.errors = s.errors.slice(0, 10);
  fs.writeFileSync(path.join(__dirname, '..', 'evidence', 'v21-features.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await s.close();
})().catch((e) => { console.error('V21_FEATURES_ERROR', e.stack || e); if (S) S.close(); process.exit(1); });
