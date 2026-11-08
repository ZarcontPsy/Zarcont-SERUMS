'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
const save = JSON.parse(JSON.stringify(base));
save.xp = 0; save.coins = 1000; save.stage = 1; save.missions = {};
save.collection = { ownedCharacterIds: ['ilan'], ownedCosmeticIds: [], selectedCharacterId: 'ilan', equipped: {} };
save.achievements = {};
save.academic = { answered: 0, correct: 0, wrong: 0, totalTimeMs: 0, sessions: 0, byArea: {}, recent: [] };
(async () => {
  const s = await open({ port: 9369, width: 1280, height: 720, gpu: true });
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await s.key('KeyH'); await sleep(1000);
  await s.key('ArrowRight'); await sleep(700);
  await s.shot(path.join(__dirname, '..', 'evidence', '13-selector-comprar.png'));
  const buy = await s.ev("!!document.querySelector('[data-action=open-recruit][data-hero=mara]')");
  console.log('buy button', buy);
  if (buy) {
    await s.click('[data-action="open-recruit"][data-hero="mara"]', 700);
    await s.shot(path.join(__dirname, '..', 'evidence', '14-reclutamiento.png'));
    const confirm = await s.ev("!!document.querySelector('[data-action=recruit-confirm]')");
    console.log('confirm', confirm, 'coins before', await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).coins"));
    if (confirm) await s.click('[data-action="recruit-confirm"]', 900);
    const after = await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1'))");
    console.log('after coins', after.coins, 'owned', after.collection.ownedCharacterIds);
    await s.shot(path.join(__dirname, '..', 'evidence', '15-reclutado.png'));
  }
  console.log('errors', JSON.stringify(s.errors));
  await s.close();
})().catch((e) => { console.error(e); process.exit(1); });
