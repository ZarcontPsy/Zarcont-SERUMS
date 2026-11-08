'use strict';
/* Capturas base (V2.0) de los 10 héroes con cosmético para comparar z-fighting. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib.js');
const QA = __dirname;
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EV = path.resolve(ROOT, '.work', 'v2', 'evidence');
const save = JSON.parse(fs.readFileSync(path.join(QA, 'save-full.json'), 'utf8'));
save.settings = { feedbackMode: 'end', onlyOriginalBank: false, effectsQuality: 'alto', qualityChosen: true,
  backupReminder: false, tutorialSeen: true, sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 } };
save.collection.equipped = {};
['ilan', 'mara', 'noa', 'teo', 'lia', 'kian', 'amaru', 'ona', 'iris', 'zenon'].forEach((id) => {
  save.collection.equipped[id] = { accesorios: 'c-accesorios-gafas' };
});
const slug = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
(async () => {
  const s = await open({ gpu: true, width: 1280, height: 720, port: 9392 });
  try {
    await s.seed(save); await sleep(900);
    await s.ev("document.querySelector('#screen [data-action=menu-continue]')?.click()"); await sleep(1000);
    await s.ev("document.querySelector('#hud [data-action=open-heroes]')?.click()"); await sleep(1200);
    for (let i = 0; i < 10; i++) {
      await s.ev(`(() => { const d=document.querySelector('#screen [data-action=v2-hero-goto][data-index="${i}"]'); if(d){d.click();return true;} return false; })()`);
      await sleep(800);
      for (const suffix of ['a', 'b', 'c']) {
        const clip = await s.ev(`(() => { const el=document.querySelector('.v2-hero-canvas') || document.querySelector('.v2-carousel-card.is-center [data-v2-stage]'); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()`);
        if (clip && clip.width) {
          const res = await s.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false,
            clip: { x: Math.max(0, clip.x), y: Math.max(0, clip.y), width: clip.width, height: clip.height, scale: 2 } });
          const file = path.join(EV, 'agent7-v21-base-parpadeo-cosmetico-' + ['ilan', 'mara', 'noa', 'teo', 'lia', 'kian', 'amaru', 'ona', 'iris', 'zenon'][i] + '-' + suffix + '.png');
          fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
        }
        await sleep(1000);
      }
    }
    console.log('capturas base con cosmético listas');
  } catch (e) { console.error(e && e.stack || e); process.exitCode = 1; }
  finally { await s.close(); }
})();
