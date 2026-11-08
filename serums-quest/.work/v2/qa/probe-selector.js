'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
(async () => {
  const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
  const s = await open({ port: 9362, width: 1280, height: 720 });
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  await s.key('KeyH');
  await sleep(1200);
  const info = await s.ev(`(() => {
    var cards = [...document.querySelectorAll('.v2-carousel-card')];
    return cards.map(function(c){
      var img = c.querySelector('img.v2-hero-portrait');
      var stage = c.querySelector('[data-v2-stage]');
      return { cls: c.className, id: c.getAttribute('data-v2-id'), img: img ? {src: img.getAttribute('src') ? img.getAttribute('src').slice(0,48) : null, w: img.naturalWidth, h: img.naturalHeight, opacity: getComputedStyle(img).opacity, display: getComputedStyle(img).display} : null, stage: stage ? stage.innerHTML.slice(0,80) : null };
    });
  })()`);
  console.log(JSON.stringify(info, null, 2));
  await s.shot(path.join(__dirname, 'probe-selector.png'));
  await s.close();
})().catch((e) => { console.error(e); process.exit(1); });
