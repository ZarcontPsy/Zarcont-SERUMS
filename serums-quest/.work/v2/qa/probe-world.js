'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const evidence = path.join(__dirname, '..', 'evidence');
let S = null;
function load(name) { return JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8')); }
async function enterHub(s) {
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  else if (await s.ev("!!document.querySelector('[data-action=enter-game]')")) await s.click('[data-action="enter-game"]', 900);
  await sleep(500);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
}
async function panelOpen(s) {
  return s.ev("!!(document.querySelector('.v2-world-overlay.is-open'))");
}
async function closePanel(s) {
  if (await panelOpen(s)) await s.click('[data-action="v2-world-close"]', 350);
}
(async () => {
  const s = await open({ port: 9370, width: 1280, height: 720, gpu: true });
  S = s;
  const out = { steps: [] };
  await s.seed(load('save-world-empty.json'));
  await enterHub(s);
  out.stats = await s.ev('window.__V2 && window.__V2.world ? window.__V2.world.stats() : null');
  out.ids = await s.ev('(() => { var w=window.__V2&&window.__V2.world; if(!w) return null; return typeof w.ids==="function" ? w.ids() : w.ids; })()');
  await s.shot(path.join(evidence, 'w01-atrio-mundo.png'));
  out.steps.push({ step: 'hub', state: await s.state() });

  await s.ev("window.__V2.world.interact('v2w-telescope')");
  await sleep(450);
  await s.shot(path.join(evidence, 'w02-telescopio.png'));
  out.steps.push({ step: 'telescope', open: await panelOpen(s), text: (await s.text()).slice(0, 300) });
  await closePanel(s);

  await s.ev("window.__V2.world.interact('v2w-library')");
  await sleep(450);
  await s.shot(path.join(evidence, 'w03-biblioteca-vacia.png'));
  out.steps.push({ step: 'library-empty', open: await panelOpen(s) });
  await closePanel(s);

  await s.ev("window.__V2.world.interact('v2w-chest-salud-publica')");
  await sleep(450);
  await s.shot(path.join(evidence, 'w04-cofre.png'));
  const coinsBefore = await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).coins");
  if (await s.ev("!!document.querySelector('[data-action=v2-world-chest-open]')")) await s.click('[data-action="v2-world-chest-open"]', 700);
  await s.shot(path.join(evidence, 'w05-cofre-abierto.png'));
  const coinsAfter = await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).coins");
  const worldAfterChest = await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).v2.world");
  out.steps.push({ step: 'chest', coinsBefore: coinsBefore, coinsAfter: coinsAfter, chests: worldAfterChest.chests, fragments: worldAfterChest.fragments });
  await closePanel(s);

  await s.ev("window.__V2.world.interact('v2w-guide-salud-publica')");
  await sleep(450);
  await s.shot(path.join(evidence, 'w06-guia.png'));
  const guideText1 = (await s.text()).slice(0, 300);
  if (await s.ev("!!document.querySelector('[data-action=v2-world-guide-next]')")) await s.click('[data-action="v2-world-guide-next"]', 450);
  await s.shot(path.join(evidence, 'w07-guia-paso2.png'));
  if (await s.ev("!!document.querySelector('[data-action=v2-world-guide-next]')")) await s.click('[data-action="v2-world-guide-next"]', 450);
  await s.shot(path.join(evidence, 'w08-guia-paso3.png'));
  if (await s.ev("!!document.querySelector('[data-action=v2-world-close]')")) await s.click('[data-action="v2-world-close"]', 450);
  const guideState = await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).v2.world.guides");
  out.steps.push({ step: 'guide', text: guideText1, guides: guideState });
  await closePanel(s);

  await s.ev("window.__V2.world.interact('v2w-frag-salud-publica-1')");
  await sleep(450);
  await s.shot(path.join(evidence, 'w09-fragmento.png'));
  if (await s.ev("!!document.querySelector('[data-action=v2-world-fragment-save]')")) await s.click('[data-action="v2-world-fragment-save"]', 700);
  await s.shot(path.join(evidence, 'w10-fragmento-guardado.png'));
  const worldAfterFrag = await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).v2.world");
  out.steps.push({ step: 'fragment', fragments: worldAfterFrag.fragments, xp: await s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')).xp") });
  await closePanel(s);

  await s.ev("window.__V2.world.interact('v2w-library')");
  await sleep(450);
  await s.shot(path.join(evidence, 'w11-biblioteca-con-ficha.png'));
  out.steps.push({ step: 'library-open', open: await panelOpen(s), text: (await s.text()).slice(0, 300) });
  await closePanel(s);

  out.errors = s.errors.slice(0, 20);
  out.network = s.requests.filter((u) => !/^(file|data|blob):/.test(u));
  fs.writeFileSync(path.join(evidence, 'world-interactions.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await s.close();
})().catch((e) => { console.error('WORLD_PROBE_ERROR', e.stack || e); if (S) S.close(); process.exitCode = 1; });
