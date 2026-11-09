'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const SAVE = path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-tutorial.json');
(async () => {
  const h = await open({ port: 9567, profile: path.join(__dirname, 'profiles', 'savediff'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 1280, height: 720 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(SAVE, 'utf8')), { reload: true });
    await sleep(2400);
    const before = await h.readSave();
    await h.ev("(() => { window.__v23welcome.close(); return true; })()");
    await sleep(500);
    const after1 = await h.readSave();
    await h.ev("(() => { window.__v23welcome.open('title'); return true; })()");
    await sleep(400);
    await h.ev("(() => { window.__v23welcome.close(); return true; })()");
    await sleep(500);
    const after2 = await h.readSave();
    function diff(a, b, prefix, out) {
      const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
      keys.forEach(k => {
        const av = a ? a[k] : undefined, bv = b ? b[k] : undefined;
        const p = prefix ? prefix + '.' + k : k;
        if (typeof av === 'object' && av && typeof bv === 'object' && bv && !Array.isArray(av)) diff(av, bv, p, out);
        else if (JSON.stringify(av) !== JSON.stringify(bv)) out.push({ key: p, before: av, after: bv });
      });
    }
    const d1 = [], d2 = [];
    diff(before, after1, '', d1); diff(after1, after2, '', d2);
    console.log('DIFF close1', JSON.stringify(d1, null, 1).slice(0, 4000));
    console.log('DIFF close2', JSON.stringify(d2, null, 1).slice(0, 4000));
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
