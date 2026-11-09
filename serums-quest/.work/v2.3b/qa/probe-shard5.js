'use strict';
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../v2.3/qa/cdp.js');
const OUT = path.resolve(__dirname, '..', 'evidence', 'debug');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await open({ port: 9573, profile: path.join(__dirname, 'profiles', 'probe6'), bundle: path.join(ROOT, 'dist', 'index.html'), width: 390, height: 844 });
  try {
    await h.seed(JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8')), { reload: true });
    await sleep(2000);
    const names = await h.ev("window.__v23b.scene().children.map(c => c.name).filter(Boolean)");
    console.log(names);
    for (const name of names) {
      await h.ev(`(() => { window.__v23b.scene().children.forEach(c => { c.visible = c.name !== ${JSON.stringify(name)} || !c.name; }); return true; })()`);
      await sleep(300);
      await h.shot(path.join(OUT, '390-hide-' + name + '.png'));
    }
  } finally { await h.close(); }
})().catch(e => { console.error(e); process.exit(1); });
