'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-empty.json'), 'utf8'));
let S = null;
(async () => {
  const s = await open({ port: 9381, width: 1280, height: 720, gpu: true });
  S = s;
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=open-settings]')")) {
    await s.click('[data-action="open-settings"]', 800);
  } else {
    if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
    await s.key('Escape'); await sleep(300);
    if (await s.ev("!!document.querySelector('[data-action=open-settings]')")) await s.click('[data-action="open-settings"]', 800);
  }
  const info = await s.ev(`(() => {
    var t = document.body.innerText;
    return {
      screen: window.__gameState().screen,
      feedbackEnd: t.indexOf('Al final del nivel') !== -1,
      feedbackEach: t.indexOf('Tras cada pregunta') !== -1,
      bank: t.indexOf('banco original') !== -1,
      buttons: [...document.querySelectorAll('[data-action]')].map(function(e){return e.getAttribute('data-action');}).filter(function(a){return a && a.indexOf('feedback')!==-1 || a && a.indexOf('perf')!==-1 || a && a.indexOf('v2-')===0;}).slice(0,30)
    };
  })()`);
  await s.shot(path.join(__dirname, '..', 'evidence', 'v21-settings.png'));
  console.log(JSON.stringify(info, null, 2));
  await s.close();
})().catch((e) => { console.error(e); if (S) S.close(); process.exit(1); });
