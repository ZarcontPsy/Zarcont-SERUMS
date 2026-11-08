'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-full.json'), 'utf8'));
async function fps(s, ms) {
  const out = [];
  const end = Date.now() + ms;
  while (Date.now() < end) { const st = await s.state(); if (st && st.fps) out.push(st.fps); await sleep(120); }
  return out.length ? { min: Math.min.apply(null, out), avg: Math.round(out.reduce((a, b) => a + b, 0) / out.length), n: out.length } : null;
}
(async () => {
  const s = await open({ port: 9364, width: 960, height: 540, gpu: true });
  await s.seed(save);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  const hub = await fps(s, 2500);
  await s.key('KeyJ'); await sleep(700);
  await s.click('[data-action="select-area"][data-area="area-psi-salud-publica"]', 400);
  await s.click('[data-action="select-mission"][data-mission="mission-sp-1"]', 400);
  await s.click('[data-action="start-mission"]', 1200);
  const duel = await fps(s, 2500);
  await s.ev("document.querySelector('[data-action=open-pause]') && document.querySelector('[data-action=open-pause]').click()"); await sleep(400);
  await s.ev("document.querySelector('[data-action=open-map]') && document.querySelector('[data-action=open-map]').click()"); await sleep(1500);
  const map = await fps(s, 2500);
  console.log(JSON.stringify({ hub, duel, map, gpu: await s.ev("(document.createElement('canvas').getContext('webgl')||{}).getParameter ? 'webgl' : 'none'"), renderer: await s.ev("window.__gameState().renderer") }, null, 2));
  fs.writeFileSync(path.join(__dirname, '..', 'evidence', 'fps-gpu.json'), JSON.stringify({ hub, duel, map }, null, 2));
  await s.close();
})().catch((e) => { console.error(e); process.exit(1); });
