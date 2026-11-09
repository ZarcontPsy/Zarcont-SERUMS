'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'gate-before.json');
(async () => {
  const h = await open({ port: 9583, profile: path.join(__dirname, 'profiles', 'gate'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1280, height: 720 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(1400);
    const all = await h.ev("window.__v23cGate ? window.__v23cGate.all().map(x => ({id:x.id,rarity:x.rarity,boxiness:x.boxiness,forms:x.forms,tones:x.tones,emissive:x.emissive,anims:x.anims,components:x.components,extrema:x.extrema,verdict:x.verdict,error:x.error})) : null", true);
    const effects = await h.ev("window.__v23cGate ? window.__v23cGate.compareEffects() : null");
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({ all, effects }, null, 1));
    const fail = (all || []).filter(x => !x.verdict || !x.verdict.pass);
    console.log('pieces', all && all.length, 'fail', fail.length, 'errors', h.errors.slice(0, 3));
    console.log('effect pass', effects && effects.pass, 'min', effects && effects.min, 'auraMin', effects && effects.auraMin);
    console.log(fail.slice(0, 12).map(x => x.id + ':' + (x.verdict ? x.verdict.reasons.join('|') : x.error)).join('\n'));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
