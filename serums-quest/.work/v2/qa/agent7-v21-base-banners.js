'use strict';
/* Capturas base (V2.0) de arena + close-up de estandartes por área. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib.js');
const QA = __dirname;
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EV = path.resolve(ROOT, '.work', 'v2', 'evidence');
const save = JSON.parse(fs.readFileSync(path.join(QA, 'save-world-low.json'), 'utf8'));
save.settings = { feedbackMode: 'end', onlyOriginalBank: false, effectsQuality: 'alto', qualityChosen: true, backupReminder: false, tutorialSeen: true, sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 } };
save.missions = {}; save.questions = {}; save.errors = {};
const areas = ['area-psi-salud-publica', 'area-psi-cuidado-integral', 'area-psi-etica', 'area-psi-investigacion', 'area-psi-gestion'];
async function click(s, sel, wait) { const ok = await s.ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e)return false; e.click(); return true; })()`); await sleep(wait || 500); return ok; }
async function shotClip(s, name, rect) {
  const res = await s.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 2 } });
  const file = path.join(EV, name); fs.writeFileSync(file, Buffer.from(res.data, 'base64')); return path.basename(file);
}
(async () => {
  const s = await open({ gpu: true, width: 1280, height: 720, port: 9391 });
  try {
    for (const areaId of areas) {
      await s.seed(save); await sleep(800);
      await click(s, '#screen [data-action=menu-continue]', 900);
      await s.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyG', key: 'g', windowsVirtualKeyCode: 71 });
      await s.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyG', key: 'g', windowsVirtualKeyCode: 71 });
      await sleep(700);
      await click(s, '#screen [data-action=open-practice]', 400);
      await sleep(400);
      await click(s, '#screen [data-action=start-practice][data-area="' + areaId + '"]', 1300);
      await sleep(900);
      const name = areaId.replace('area-psi-', '');
      await shotClip(s, 'agent7-v21-base-estandarte-' + name + '.png', { x: 0, y: 0, width: 1280, height: 720 });
      await shotClip(s, 'agent7-v21-base-estandarte-' + name + '-close-izq.png', { x: 0, y: 100, width: 340, height: 500 });
      await shotClip(s, 'agent7-v21-base-estandarte-' + name + '-close-der.png', { x: 940, y: 100, width: 340, height: 500 });
      await s.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27 });
      await s.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27 });
      await sleep(500);
      await click(s, '#screen [data-action=abandon-duel]', 400);
      await click(s, '#screen [data-action=abandon-duel]', 400);
      await sleep(500);
      await click(s, '#screen [data-action=result-continue]', 600);
      await sleep(400);
      await s.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27 });
      await s.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Escape', key: 'Escape', windowsVirtualKeyCode: 27 });
      await sleep(500);
      console.log('base banner', areaId);
    }
  } catch (e) { console.error(e && e.stack || e); process.exitCode = 1; }
  finally { await s.close(); }
})();
