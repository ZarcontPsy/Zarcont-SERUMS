'use strict';
/* Sonda de Checkpoint 2: API del mundo, paneles y estado. No modifica el juego. */
const fs = require('fs');
const path = require('path');
const { open, sleep } = require('./cdp-lib');

const QA = __dirname;
const EV = path.resolve(__dirname, '..', 'evidence');
const DIST = path.resolve(__dirname, '..', '..', '..', 'dist', 'index.html');
const save = (name) => JSON.parse(fs.readFileSync(path.join(QA, name), 'utf8'));

(async () => {
  const s = await open({ port: 9376, profile: path.join(QA, 'agent7-cp2-probe-profile'), width: 1280, height: 720 });
  const out = { steps: [], errors: [], network: [] };
  try {
    const seed = save('save-world-empty.json');
    await s.seed(seed);
    if (await s.ev("!!document.querySelector('[data-action=menu-continue]')")) await s.click('[data-action="menu-continue"]', 1000);
    await sleep(800);
    out.steps.push({ step: 'hub', state: await s.state(), stats: await s.ev('window.__V2.world.stats()') });
    const ids = await s.ev('window.__V2.world.ids');
    out.ids = { version: ids.version, all: ids.all.length, kinds: ids.all.reduce((o, x) => (o[x.kind] = (o[x.kind] || 0) + 1, o), {}) };
    out.steps.push({ step: 'ids', ids: out.ids });

    await s.ev("window.__V2.world.interact('v2w-library')"); await sleep(450);
    out.emptyLibrary = await s.ev("({open:window.__V2.world.isOpen(), title:(document.querySelector('.v2-world-title')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText, body:(document.querySelector('#v2w-body')||{}).innerText})");
    await s.ev('window.__V2.world.close()'); await sleep(250);

    await s.ev("window.__V2.world.interact('v2w-chest-salud-publica')"); await sleep(450);
    out.chestClosed = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText, body:(document.querySelector('#v2w-body')||{}).innerText})");
    if (await s.ev("!!document.querySelector('[data-action=v2-world-chest-open]')")) await s.click('[data-action="v2-world-chest-open"]', 650);
    out.chestOpened = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText, body:(document.querySelector('#v2w-body')||{}).innerText})");
    out.afterChest = await s.ev("(() => { const st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); const w=window.__V2.world.stats(); return {xp:st.xp, coins:st.coins, counters:st.counters, chests:w.chests, fragments:w.fragments, rewards:w.rewards}; })()");
    await s.ev('window.__V2.world.close()'); await sleep(200);

    await s.ev("window.__V2.world.interact('v2w-guide-salud-publica')"); await sleep(450);
    out.guide1 = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, eyebrow:(document.querySelector('.v2-world-eyebrow')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText})");
    if (await s.ev("!!document.querySelector('[data-action=v2-world-guide-next]')")) await s.click('[data-action="v2-world-guide-next"]', 450);
    out.guide2 = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, eyebrow:(document.querySelector('.v2-world-eyebrow')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText})");
    if (await s.ev("!!document.querySelector('[data-action=v2-world-guide-next]')")) await s.click('[data-action="v2-world-guide-next"]', 450);
    out.guide3 = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, eyebrow:(document.querySelector('.v2-world-eyebrow')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText})");
    out.afterGuide = await s.ev("(() => { const st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); const w=window.__V2.world.stats(); return {xp:st.xp, coins:st.coins, guides:w.guides, rewards:w.rewards}; })()");
    await s.ev('window.__V2.world.close()'); await sleep(200);

    await s.ev("window.__V2.world.interact('v2w-frag-salud-publica-1')"); await sleep(450);
    out.fragClosed = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText})");
    if (await s.ev("!!document.querySelector('[data-action=v2-world-fragment-save]')")) await s.click('[data-action="v2-world-fragment-save"]', 600);
    out.fragSaved = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, foot:(document.querySelector('#v2w-foot')||{}).innerText})");
    out.afterFrag = await s.ev("(() => { const st=JSON.parse(localStorage.getItem('serumsquest:voxel:state:v1')); const w=window.__V2.world.stats(); return {xp:st.xp, coins:st.coins, fragments:w.fragments, rewards:w.rewards, libraryOpen: !!document.querySelector('[data-action=v2-world-library-read]')}; })()");
    await s.ev('window.__V2.world.close()'); await sleep(200);

    await s.ev("window.__V2.world.interact('v2w-library')"); await sleep(450);
    out.libraryWith = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, rows:document.querySelectorAll('[data-action=v2-world-library-read]').length, text:(document.querySelector('#v2w-body')||{}).innerText})");
    if (await s.ev("!!document.querySelector('[data-action=v2-world-library-read]')")) await s.click('[data-action="v2-world-library-read"]', 500);
    out.reader = await s.ev("({title:(document.querySelector('.v2-world-title')||{}).textContent, eyebrow:(document.querySelector('.v2-world-eyebrow')||{}).textContent, body:(document.querySelector('#v2w-body')||{}).innerText, foot:(document.querySelector('#v2w-foot')||{}).innerText})");
    await s.ev('window.__V2.world.close()'); await sleep(200);

    out.errors = s.errors.slice(0, 10);
    out.network = s.requests.filter((u) => !/^(file|data|blob):/i.test(u));
    fs.writeFileSync(path.join(EV, 'agent7-cp2-probe.json'), JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 2).slice(0, 24000));
  } catch (e) {
    out.error = String(e && e.stack || e);
    out.errors = s.errors.slice(0, 10);
    out.network = s.requests.filter((u) => !/^(file|data|blob):/i.test(u));
    fs.writeFileSync(path.join(EV, 'agent7-cp2-probe.json'), JSON.stringify(out, null, 2));
    console.error(out.error);
    process.exitCode = 1;
  } finally {
    await s.close();
  }
})();
