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
  const r = await b.ev('window.__v23Anchors.matrix({heroes:["ona"]})', true);
  const bag = r.cases.filter((c) => c.cosmetic === 'c-accesorios-bolso')[0];
  console.log('bag', JSON.stringify({ st: bag.status, area: bag.areaFull, front: bag.areaFront, bust: bag.areaBust, err: bag.error, reason: bag.failReason }));
  console.log('order index', r.cases.findIndex((c) => c.cosmetic === 'c-accesorios-bolso'));
  const fails = r.cases.filter((c) => c.status !== 'PASS');
  console.log('fails', JSON.stringify(fails.map((f) => [f.cosmetic, f.status, f.failReason, f.areaFull, f.areaFront, f.areaBust])));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
