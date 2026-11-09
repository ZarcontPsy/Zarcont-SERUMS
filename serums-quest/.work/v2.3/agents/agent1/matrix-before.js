'use strict';
const cdp = require('../../qa/cdp.js');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
(async () => {
  const b = await cdp.open({
    port: 9541,
    profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'p9541'),
    bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'a1.html'),
    width: 1280, height: 720
  });
  await b.seed(save);
  await cdp.sleep(500);
  const all = [];
  const heroes = ['ilan', 'noa'];
  for (let from = 0; from < 138; from += 30) {
    const r = await b.ev(`window.__v23Anchors.matrix({heroes:["ilan","noa"], raw:true, from:${from}, to:${Math.min(138, from + 30)}})`, true);
    all.push(...r.cases);
  }
  const pass = all.filter((r) => r.status === 'PASS').length;
  const bySlot = {};
  all.forEach((r) => {
    bySlot[r.slot] = bySlot[r.slot] || { total: 0, pass: 0 };
    bySlot[r.slot].total++;
    if (r.status === 'PASS') bySlot[r.slot].pass++;
  });
  const failures = all.filter((r) => r.status !== 'PASS').map((r) => ({ hero: r.hero, cosmetic: r.cosmetic, slot: r.slot, reason: r.failReason, areaFull: r.areaFull, areaFront: r.areaFront, gap: r.gap, pen: r.penCount, penZone: r.penZone, flota: r.huecoFlotante, transform: r.transform }));
  const out = { generatedAt: new Date().toISOString(), mode: 'raw-sin-encaje', heroes: heroes, total: all.length, pass, fail: all.length - pass, passRate: Math.round(pass / all.length * 10000) / 100, bySlot, failures, cases: all };
  fs.writeFileSync(path.join(__dirname, 'matrix-before-slice.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ total: out.total, pass, fail: out.fail, passRate: out.passRate, bySlot, failures: failures.map((f) => [f.hero, f.cosmetic, f.reason]) }, null, 1).slice(0, 4000));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
