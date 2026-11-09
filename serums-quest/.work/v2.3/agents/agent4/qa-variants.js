'use strict';
/* Agente 4 · variantes de la bienvenida: héroe equipado + partida importada. */
const fs = require('fs');
const path = require('path');
const { open, sleep, ROOT } = require('../../qa/cdp.js');
const SAVE = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2', 'qa', 'save-full.json'), 'utf8'));
const OUT = path.join(ROOT, '.work', 'v2.3', 'agents', 'agent4');
const EVID = path.join(OUT, 'evidence');
const PREVIEW = path.join(ROOT, '.work', 'v2.3', 'preview', 'a4.html');
function plain() {
  const base = JSON.parse(JSON.stringify(SAVE));
  base.settings = Object.assign({}, base.settings, { tutorialSeen: true, backupReminder: false });
  return base;
}
function equipped() {
  const base = plain();
  base.importedAt = '2026-11-01T12:00:00.000Z';
  base.collection.equipped = {
    noa: { cabeza: 'c-cabeza-corona', torso: 'c-torso-manto', piernas: 'c-piernas-grebas', accesorios: 'c-accesorios-gafas', efectos: 'c-efecto-constelacion', marcos: 'c-marco-constelacion' }
  };
  return base;
}
(async () => {
  const s = await open({ bundle: PREVIEW, port: 9544, width: 1280, height: 720, profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'a4') });
  const out = { cases: [], shots: [] };
  try {
    await s.seed(plain());
    await sleep(900);
    const baseSrc = await s.ev(`(() => { const i = document.querySelector('.v23wFigure--front img'); return { len: i.src.length, tail: i.src.slice(-80) }; })()`);
    await s.seed(equipped());
    await sleep(1100);
    const result = await s.ev(`(() => {
      const img = document.querySelector('.v23wFigure--front img');
      const stats = [...document.querySelectorAll('.v23wStat')].map(n => n.textContent.trim());
      return {
        screen: window.__v22.screen(),
        importedPill: (document.querySelector('.v23wStat.is-teal') || {}).textContent || null,
        stats,
        cta: (document.querySelector('.v23wCta') || {}).innerText.replace(/\\n/g, ' · '),
        hero: { len: img.src.length, tail: img.src.slice(-80) }
      };
    })()`);
    result.heroChangedVsDefault = result.hero.len !== baseSrc.len || result.hero.tail !== baseSrc.tail;
    result.defaultHero = baseSrc;
    await s.shot(path.join(EVID, 'welcome-equipped-imported-1280x720.png'));
    out.cases.push({ id: 'EQUIPPED-IMPORTED', data: result });
    console.log('EQUIPPED-IMPORTED', JSON.stringify(result, null, 2));
    out.errors = s.errors.slice(0, 20);
  } catch (e) {
    out.fatal = String(e && e.stack || e);
    console.error('FATAL', out.fatal);
  } finally { await s.close(); }
  fs.writeFileSync(path.join(OUT, 'qa-variants.json'), JSON.stringify(out, null, 2));
  console.log('WROTE qa-variants.json');
})();
