'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const mastery = JSON.parse(fs.readFileSync(path.join(__dirname, 'save-world-mastery-etica.json'), 'utf8'));
let S = null;
(async () => {
  const s = await open({ port: 9388, width: 1280, height: 720, gpu: true });
  S = s;
  await s.seed(mastery);
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await sleep(800);
  const before = await s.ev("(() => { var st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); return {restored:st.v2&&st.v2.world&&st.v2.world.restored, levels:window.__V2.world.stats().restoration.levels}; })()");
  // Bajar el cálculo sin borrar el save: quitar mastery/misiones manteniendo restored.
  await s.ev(`(() => { var k='serumsquest:voxel:state:v1'; var st=JSON.parse(localStorage.getItem(k)); st.questions={}; st.missions={}; st.xp=0; st.stage=1; localStorage.setItem(k, JSON.stringify(st)); return true; })()`);
  await s.send('Page.reload', { ignoreCache: true }); await sleep(2400);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await sleep(600);
  const after = await s.ev("(() => { var st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); return {restored:st.v2&&st.v2.world&&st.v2.world.restored, levels:window.__V2.world.stats().restoration.levels}; })()");
  console.log(JSON.stringify({ before: before, after: after }, null, 2));
  await s.close();
})().catch((e) => { console.error(e); if (S) S.close(); process.exit(1); });
