'use strict';
/* QA del Agente 1. Uso:
   node qa.js probe      → estado, anclas y errores
   node qa.js matrix     → matriz 69×10 completa (en tandas) y JSON
   node qa.js case <hero> <cosmetic> [--raw]  → un caso
*/
const fs = require('fs');
const path = require('path');
const cdp = require('../../qa/cdp.js');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const OUT = __dirname;
const save = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));
const mode = process.argv[2] || 'probe';

async function openGame() {
  const b = await cdp.open({
    port: 9541,
    profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'p9541'),
    bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'a1.html'),
    width: 1280, height: 720
  });
  await b.seed(save);
  await b.dismissBanners();
  await cdp.sleep(700);
  return b;
}

(async () => {
  const b = await openGame();
  try {
    if (mode === 'probe') {
      const out = await b.ev(`(() => {
        const A = window.__v23Anchors;
        const rows = {};
        (A.heroIds()).forEach(id => { rows[id] = A.anchors(id); });
        return {
          stats: A.stats(), ready: A.ready, version: A.version,
          anchors: rows,
          errs: A.errors().slice(0, 10)
        };
      })()`);
      console.log(JSON.stringify(out, null, 1).slice(0, 6000));
    } else if (mode === 'case') {
      const hero = process.argv[3] || 'ilan';
      const cos = process.argv[4] || 'c-cabeza-diadema';
      const raw = process.argv.includes('--raw');
      const out = await b.ev(`window.__v23Anchors.audit(${JSON.stringify(hero)}, ${JSON.stringify(cos)}, {raw:${raw}})`, true);
      console.log(JSON.stringify(out, null, 1));
      if (!raw) {
        const url = await b.ev(`window.__v23Anchors.shot(${JSON.stringify(hero)}, ${JSON.stringify(cos)}, {size:260})`);
        if (url) fs.writeFileSync(path.join(OUT, 'case-' + hero + '-' + cos + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      }
    } else if (mode === 'matrix') {
      const raw = process.argv.includes('--raw');
      const all = [];
      const total = await b.ev(`(window.__v23Anchors.heroIds().length * window.__v23Anchors.cosmeticIds().length)`);
      console.log('total cases', total);
      for (let from = 0; from < total; from += 30) {
        const chunk = await b.ev(`window.__v23Anchors.matrix({from:${from}, to:${Math.min(total, from + 30)}, raw:${raw}})`, true);
        all.push(...chunk.cases);
        process.stdout.write(`${chunk.to}/${total} `);
      }
      console.log('');
      const pass = all.filter((r) => r.status === 'PASS').length;
      const fails = all.filter((r) => r.status !== 'PASS');
      const bySlot = {};
      all.forEach((r) => {
        bySlot[r.slot] = bySlot[r.slot] || { total: 0, pass: 0, fail: 0, reasons: {} };
        bySlot[r.slot].total++;
        if (r.status === 'PASS') bySlot[r.slot].pass++;
        else {
          bySlot[r.slot].fail++;
          const reason = r.failReason || '?';
          bySlot[r.slot].reasons[reason] = (bySlot[r.slot].reasons[reason] || 0) + 1;
        }
      });
      const byHero = {};
      all.forEach((r) => {
        byHero[r.hero] = byHero[r.hero] || { total: 0, pass: 0, fail: 0 };
        byHero[r.hero].total++;
        if (r.status === 'PASS') byHero[r.hero].pass++; else byHero[r.hero].fail++;
      });
      const json = {
        generatedAt: new Date().toISOString(),
        mode: raw ? 'raw-sin-encaje' : 'encaje-v23',
        total: all.length, pass, fail: fails.length, passRate: Math.round(pass / all.length * 10000) / 100,
        bySlot, byHero,
        failures: fails.map((r) => ({ hero: r.hero, cosmetic: r.cosmetic, slot: r.slot, status: r.status, reason: r.failReason, visible: r.visible, areaFull: r.areaFull, areaBust: r.areaBust, areaFront: r.areaFront, gap: r.gap, pen: r.penCount, penDepth: r.penDepth, penZone: r.penZone, penInterna: r.penetraInterna, penInternaDepth: r.penInternaDepth, jitter: r.jitter, transform: r.transform, note: r.note, error: r.error })),
        stats: await b.ev(`window.__v23Anchors.stats()`),
        cases: all
      };
      const name = raw ? 'matrix-before.json' : 'matrix-after.json';
      fs.writeFileSync(path.join(OUT, name), JSON.stringify(json, null, 1));
      console.log(JSON.stringify({ total: json.total, pass, fail: json.fail, passRate: json.passRate, bySlot, byHero }, null, 1));
      // peores casos para la hoja de contacto (menor área / fallos)
      const worst = all.slice().sort((a, b2) => (a.areaFull + a.areaBust) - (b2.areaFull + b2.areaBust)).slice(0, 8);
      fs.writeFileSync(path.join(OUT, raw ? 'worst-before.json' : 'worst-after.json'), JSON.stringify(worst.map((r) => ({ hero: r.hero, cosmetic: r.cosmetic, slot: r.slot, status: r.status, areaFull: r.areaFull, areaBust: r.areaBust, reason: r.failReason })), null, 1));
      console.log('errors', JSON.stringify(json.stats && json.stats.errors));
    }
  } finally {
    await b.close();
  }
})().catch((e) => { console.error('QA FAIL', e); process.exit(1); });
