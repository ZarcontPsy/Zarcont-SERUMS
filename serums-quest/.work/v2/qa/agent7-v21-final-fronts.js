'use strict';
/* Capturas frontales finales de los 10 héroes (con y sin gafas) para comparar con base. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib.js');
const QA = __dirname;
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EV = path.resolve(ROOT, '.work', 'v2', 'evidence');
const base = JSON.parse(fs.readFileSync(path.join(QA, 'save-full.json'), 'utf8'));
base.settings = { feedbackMode: 'end', onlyOriginalBank: false, effectsQuality: 'alto', qualityChosen: true, backupReminder: false, tutorialSeen: true, sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 } };
const heroes = ['ilan', 'mara', 'noa', 'teo', 'lia', 'kian', 'amaru', 'ona', 'iris', 'zenon'];
function withGlasses() {
  const s = JSON.parse(JSON.stringify(base));
  s.collection.equipped = {};
  heroes.forEach((id) => { s.collection.equipped[id] = { accesorios: 'c-accesorios-gafas' }; });
  return s;
}
async function clipShot(s, name) {
  const clip = await s.ev(`(() => { const el=document.querySelector('.v2-hero-canvas'); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()`);
  if (!clip || !clip.width) return;
  const res = await s.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false,
    clip: { x: Math.max(0, clip.x), y: Math.max(0, clip.y), width: clip.width, height: clip.height, scale: 2 } });
  fs.writeFileSync(path.join(EV, name), Buffer.from(res.data, 'base64'));
}
async function run(s, save, suffix) {
  await s.seed(save); await sleep(800);
  await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()"); await sleep(900);
  await s.ev("document.querySelector('#hud [data-action=open-heroes]')?.click()"); await sleep(1000);
  for (let i = 0; i < heroes.length; i++) {
    await s.ev(`(() => { const d=document.querySelector('#screen [data-action=v2-hero-goto][data-index="${i}"]'); if(d){d.click();return true;} return false; })()`);
    await sleep(820);
    await clipShot(s, 'agent7-v21-final-parpadeo-' + (suffix ? suffix + '-' : '') + 'front-' + heroes[i] + '.png');
    await sleep(160);
  }
}
(async () => {
  const s = await open({ gpu: true, width: 1280, height: 720, port: 9389 });
  try {
    await run(s, base, '');
    await run(s, withGlasses(), 'cosmetico');
    console.log('frontales finales listos');
  } catch (e) { console.error(e && e.stack || e); process.exitCode = 1; }
  finally { await s.close(); }
})();
