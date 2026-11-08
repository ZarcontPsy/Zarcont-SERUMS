'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');
const evidence = path.join(__dirname, '..', 'evidence');
function load(name) { return JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8')); }
let S = null;
async function enterHub(s) {
  if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 900);
  else if (await s.ev("!!document.querySelector('[data-action=enter-game]')")) await s.click('[data-action="enter-game"]', 900);
  await sleep(500);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
}
async function stateVal(s) { return s.ev("JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1'))"); }
(async () => {
  const s = await open({ port: 9371, width: 1280, height: 720, gpu: true });
  S = s;
  const out = {};
  // 1) Sombra del error con errores vencidos
  await s.seed(load('save-world-due.json'));
  await enterHub(s);
  out.dueStats = await s.ev('window.__V2.world.stats().shadows');
  await s.shot(path.join(evidence, 'w12-sombra-error.png'));
  await s.ev("window.__V2.world.interact('v2w-shadow-salud-publica')");
  await sleep(450);
  await s.shot(path.join(evidence, 'w13-sombra-panel.png'));
  out.shadowPanel = { open: await s.ev("!!document.querySelector('.v2-world-overlay.is-open')"), text: (await s.text()).slice(0, 400) };
  if (await s.ev("!!document.querySelector('[data-action=v2-world-review-open]')")) {
    await s.click('[data-action="v2-world-review-open"]', 900);
    out.afterReviewOpen = { screen: (await s.state()).screen, text: (await s.text()).slice(0, 500) };
    await s.shot(path.join(evidence, 'w14-repaso-desde-sombra.png'));
    if (await s.ev("!!document.querySelector('[data-action=start-review]')")) await s.click('[data-action="start-review"]', 900);
    // Responder las 3 preguntas del repaso correctamente
    let steps = 0;
    while (steps < 5) {
      steps += 1;
      if (await s.ev("!!document.querySelector('.resultScreen')")) break;
      const cur = await s.ev(`(() => {
        var stem=(document.querySelector('.questionText')||{}).textContent||'';
        var norm=function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();};
        var n=norm(stem); var list=Object.keys(window.CAMPAIGN_DATA.questions).map(function(id){return window.CAMPAIGN_DATA.questions[id];});
        var hit=list.filter(function(x){return norm(x.stem)===n;})[0]||list.filter(function(x){return n.indexOf(norm(x.stem).slice(0,50))===0;})[0];
        return hit?hit.answer:null;
      })()`);
      if (!cur) break;
      await s.click(`[data-action="answer"][data-letter="${cur}"]`, 400);
      if (await s.ev("!!document.querySelector('[data-action=v2-feedback-continue]')")) await s.click('[data-action="v2-feedback-continue"]', 450);
      else if (await s.ev("!!document.querySelector('[data-action=next-question]')")) await s.click('[data-action="next-question"]', 450);
    }
    out.reviewResult = await s.ev("!!document.querySelector('.resultScreen')");
    await s.shot(path.join(evidence, 'w15-repaso-resultado.png'));
    if (await s.ev("!!document.querySelector('[data-action=result-continue]')")) await s.click('[data-action="result-continue"]', 700);
    await s.shot(path.join(evidence, 'w16-sombra-derrotada.png'));
    out.shadowsAfter = await s.ev('window.__V2.world.stats().shadows');
    out.dueErrorsAfter = await s.ev('Object.keys(JSON.parse(localStorage.getItem("serumsquest:voxel:state:v1")).errors||{}).length');
  }
  await s.seed(load('save-world-low.json'));
  await enterHub(s);
  out.lowRestoration = await s.ev('window.__V2.world.stats().restoration');
  await s.shot(path.join(evidence, 'w17-atrio-bajo.png'));
  await s.seed(load('save-world-mastery-etica.json'));
  await enterHub(s);
  out.masteryRestoration = await s.ev('window.__V2.world.stats().restoration');
  await s.shot(path.join(evidence, 'w18-atrio-mastery-etica.png'));

  // 3) Recompensas únicas y persistencia
  await s.seed(load('save-world-empty.json'));
  await enterHub(s);
  await s.ev("window.__V2.world.interact('v2w-chest-salud-publica')"); await sleep(300);
  if (await s.ev("!!document.querySelector('[data-action=v2-world-chest-open]')")) await s.click('[data-action="v2-world-chest-open"]', 500);
  const coins1 = (await stateVal(s)).coins;
  await s.ev("window.__V2.world.interact('v2w-chest-salud-publica')"); await sleep(300);
  const hasOpen = await s.ev("!!document.querySelector('[data-action=v2-world-chest-open]')");
  await s.ev("window.__V2.world.close()"); await sleep(250);
  const coins2 = (await stateVal(s)).coins;
  out.chestRepeat = { coins1: coins1, coins2: coins2, stillOpenButton: hasOpen };
  await s.seed(load('save-world-empty.json'));
  await enterHub(s);
  await s.key('KeyE'); await sleep(500);
  out.keyboardInteract = { open: await s.ev("!!document.querySelector('.v2-world-overlay.is-open')"), title: await s.ev("(document.querySelector('.v2-world-title')||{}).textContent||''") };
  await s.ev("window.__V2.world.close()"); await sleep(250);
  await s.ev("window.__V2.world.interact('v2w-guide-salud-publica')"); await sleep(300);
  for (let k = 0; k < 4; k++) { if (await s.ev("!!document.querySelector('[data-action=v2-world-guide-next]')")) await s.click('[data-action="v2-world-guide-next"]', 350); }
  if (await s.ev("!!document.querySelector('[data-action=v2-world-close]')")) await s.click('[data-action="v2-world-close"]', 350);
  const xpGuide1 = (await stateVal(s)).xp;
  await s.ev("window.__V2.world.interact('v2w-guide-salud-publica')"); await sleep(300);
  for (let k = 0; k < 4; k++) { if (await s.ev("!!document.querySelector('[data-action=v2-world-guide-next]')")) await s.click('[data-action="v2-world-guide-next"]', 350); }
  if (await s.ev("!!document.querySelector('[data-action=v2-world-close]')")) await s.click('[data-action="v2-world-close"]', 350);
  const xpGuide2 = (await stateVal(s)).xp;
  out.guideRepeat = { xp1: xpGuide1, xp2: xpGuide2 };

  out.errors = s.errors.slice(0, 20);
  out.network = s.requests.filter((u) => !/^(file|data|blob):/.test(u));
  fs.writeFileSync(path.join(evidence, 'world-interactions-2.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await s.close();
})().catch((e) => { console.error('WORLD2_ERROR', e.stack || e); if (S) S.close(); process.exitCode = 1; });
