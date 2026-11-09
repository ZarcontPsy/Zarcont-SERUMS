'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
(async () => {
  const h = await open({ port: 9588, profile: path.join(__dirname, 'profiles', 'matrix'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1308, height: 662 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(900);
    const r = await h.ev(`new Promise((resolve) => { window.__v23Anchors.matrixAsync({ chunk: 30 }).then(function(x){ resolve({ total:x.total, pass:x.pass, fail:x.fail, failures:(x.cases||[]).filter(function(c){return c.status!=='PASS';}).map(function(c){return {hero:c.hero,id:c.cosmetic,slot:c.slot,reason:c.failReason,pen:c.penCount,penZone:c.penZone,gap:c.gap,flota:c.huecoFlotante};}) }); }).catch(function(e){ resolve({ error:String(e&&e.message||e) }); }); })`, true);
    console.log(JSON.stringify(r, null, 1));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
