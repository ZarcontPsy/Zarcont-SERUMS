'use strict';
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp');
const SAVE = JSON.parse(require('fs').readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a3.html');
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9543, width: 640, height: 360 });
  try {
    const save = JSON.parse(JSON.stringify(SAVE));
    save.settings = Object.assign({}, save.settings, { tutorialSeen: true, backupReminder: false });
    await s.seed(save); await s.dismissBanners(); await sleep(400);
    await s.setViewport(640, 360);
    await s.ev('window.__v22.openShop()');
    await s.waitFor("!!document.querySelector('.v23ShopShell')", 8000);
    await sleep(600);
    const m = await s.ev(`(() => {
      const sel = document.querySelector('.v23Select');
      const rail = document.querySelector('.v23ShopRail');
      const rules = [];
      try {
        for (const sheet of document.styleSheets) {
          let list; try { list = sheet.cssRules; } catch (e) { continue; }
          const walk = (arr, media) => {
            for (const r of arr) {
              if (r.type === 4) { walk(r.cssRules, r.conditionText); continue; }
              if (!r.selectorText) continue;
              if (r.selectorText.indexOf('.v23Select') !== -1 || r.selectorText.indexOf('.v23Filter') !== -1 || r.selectorText.indexOf('.v23ShopRail') !== -1) {
                if (r.style && (r.style.height || r.style.minHeight || r.style.flex || r.style.alignItems)) rules.push({ m: media || '', sel: r.selectorText, height: r.style.height, minH: r.style.minHeight, flex: r.style.flex, align: r.style.alignItems });
              }
            }
          };
          walk(list, '');
        }
      } catch (e) { rules.push({ err: String(e) }); }
      const cs = getComputedStyle(sel);
      return {
        matches: sel.matches('.v23ShopRail .v23Select'),
        railAlign: getComputedStyle(rail).alignItems,
        cssHeight: cs.height, specified: sel.style.height || null,
        rules: rules.slice(0, 40)
      };
    })()`);
    console.log(JSON.stringify(m, null, 2));
  } finally { await s.close(); }
})();
