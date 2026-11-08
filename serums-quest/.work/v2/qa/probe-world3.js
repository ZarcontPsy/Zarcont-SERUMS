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
async function openPanel(s, id) { await s.ev(`window.__V2.world.interact(${JSON.stringify(id)})`); await sleep(400); }
(async () => {
  const s = await open({ port: 9372, width: 1280, height: 720, gpu: true });
  S = s;
  const out = {};
  await s.seed(load('save-world-empty.json'));
  await enterHub(s);
  // Cofre + fragmento + guía
  await openPanel(s, 'v2w-chest-salud-publica');
  if (await s.ev("!!document.querySelector('[data-action=v2-world-chest-open]')")) await s.click('[data-action="v2-world-chest-open"]', 500);
  await s.ev("window.__V2.world.close()"); await sleep(250);
  await openPanel(s, 'v2w-frag-salud-publica-1');
  if (await s.ev("!!document.querySelector('[data-action=v2-world-fragment-save]')")) await s.click('[data-action="v2-world-fragment-save"]', 500);
  await s.ev("window.__V2.world.close()"); await sleep(250);
  await openPanel(s, 'v2w-guide-salud-publica');
  for (let k = 0; k < 4; k++) { if (await s.ev("!!document.querySelector('[data-action=v2-world-guide-next]')")) await s.click('[data-action="v2-world-guide-next"]', 300); }
  if (await s.ev("!!document.querySelector('[data-action=v2-world-close]')")) await s.click('[data-action="v2-world-close"]', 300);
  const before = await s.ev('window.__V2.world.stats()');
  // Recargar sin sembrar: así comprobamos que el guardado persistió.
  await s.send('Page.reload', { ignoreCache: true }); await sleep(2400);
  if (await s.ev("!!document.querySelector('[data-action=backup-off]')")) await s.click('[data-action="backup-off"]', 200);
  await enterHub(s);
  const after = await s.ev('window.__V2.world.stats()');
  out.persistence = { beforeChests: before.chests.opened, afterChests: after.chests.opened, beforeFrags: before.fragments.collected, afterFrags: after.fragments.collected, beforeGuides: before.guides.completed, afterGuides: after.guides.completed };
  // Biblioteca con ficha y lector
  await openPanel(s, 'v2w-library');
  await s.shot(path.join(evidence, 'w19-biblioteca-persistida.png'));
  const row = await s.ev("!!document.querySelector('[data-action=v2-world-library-read]')");
  if (row) {
    await s.click('[data-action="v2-world-library-read"]', 500);
    await s.shot(path.join(evidence, 'w20-lector-ficha.png'));
    out.reader = { open: await s.ev("!!document.querySelector('.v2-world-reader')"), text: (await s.text()).slice(0, 300) };
  }
  await s.ev("window.__V2.world.close()"); await sleep(250);
  // Telescopio con repasos vencidos
  await s.seed(load('save-world-due.json'));
  await enterHub(s);
  await openPanel(s, 'v2w-telescope');
  await s.shot(path.join(evidence, 'w21-telescopio-con-repaso.png'));
  out.telescopeDue = { text: (await s.text()).slice(0, 500) };
  await s.ev("window.__V2.world.close()"); await sleep(200);
  out.errors = s.errors.slice(0, 20);
  out.network = s.requests.filter((u) => !/^(file|data|blob):/.test(u));
  fs.writeFileSync(path.join(evidence, 'world-interactions-3.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await s.close();
})().catch((e) => { console.error('WORLD3_ERROR', e.stack || e); if (S) S.close(); process.exitCode = 1; });
