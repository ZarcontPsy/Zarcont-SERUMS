'use strict';
/* Evidencia del Agente 1: antes/después, por ranura, 3 héroes, selector de
   héroe del visor y comprobación de guardado. No modifica archivos del juego. */
const fs = require('fs');
const path = require('path');
const cdp = require('../../qa/cdp.js');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const OUT = __dirname;
const SHOTS = path.join(OUT, 'shots');
const baseSave = JSON.parse(fs.readFileSync(path.join(ROOT, '.work', 'v2.3', 'qa', 'save-v23-all.json'), 'utf8'));

const OUTFITS = {
  ilan: { cabeza: 'c-cabeza-corona', torso: 'c-torso-manto', piernas: 'c-piernas-ruta', titulo: 'x-titulo-maestro' },
  mara: { peinado: 'c-peinado-coleta', torso: 'c-torso-poncho', extras: 'c-accesorios-pluma', amuletos: 'c-amuleto-enfoque' },
  noa: { cabeza: 'c-cabeza-auriculares', torso: 'c-torso-bata', accesorios: 'c-accesorios-gafas', efectos: 'x-arma-prisma' },
  teo: { torso: 'c-torso-chaleco', piernas: 'c-piernas-falda', extras: 'x-reloj-arena', mascota: 'x-buho-cometa' },
  lia: { cabeza: 'c-cabeza-diadema', torso: 'c-torso-abrigo', piernas: 'c-piernas-ruta', estela: 'x-estela-racha' },
  kian: { cabeza: 'c-cabeza-casco', torso: 'c-torso-manto', piernas: 'c-piernas-grebas', marcos: 'c-marco-constelacion' },
  amaru: { peinado: 'c-peinado-mono', torso: 'x-capa-errorario', extras: 'x-trofeo-salud', mascota: 'x-luciernaga-observatorio' },
  ona: { cabeza: 'x-dominio-gestion', torso: 'c-torso-poncho', extras: 'x-cuaderno-orbital', marcos: 'c-marco-platino' },
  iris: { cabeza: 'c-cabeza-gorro', torso: 'c-torso-bata', amuletos: 'c-amuleto-criterio', efectos: 'c-efecto-bruma' },
  zenon: { cabeza: 'x-dominio-etica-oro', peinado: 'c-peinado-mecha', torso: 'c-torso-abrigo', mascota: 'x-zorro-tinta' }
};

const PIECES = [
  ['cabeza', 'c-cabeza-diadema'], ['cabeza', 'c-cabeza-casco'], ['peinado', 'c-peinado-mecha'],
  ['torso', 'c-torso-manto'], ['torso', 'c-torso-bata'], ['piernas', 'c-piernas-falda'],
  ['accesorios', 'c-accesorios-brujula'], ['extras', 'c-accesorios-bolso'], ['amuletos', 'c-amuleto-criterio'],
  ['efectos', 'x-arma-destello'], ['marcos', 'c-marco-platino'], ['extras', 'x-cuaderno-orbital'],
  ['extras', 'x-trofeo-salud'], ['mascota', 'x-luciernaga-observatorio']
];
const HEROES = ['ilan', 'noa', 'kian'];

function writeShot(name, dataUrl) {
  if (!dataUrl) { console.error('sin shot', name); return ''; }
  const file = path.join(SHOTS, name + '.png');
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  return file;
}

(async () => {
  const save = JSON.parse(JSON.stringify(baseSave));
  save.collection.equipped = OUTFITS;
  save.settings.hide3dFrames = false;
  save.settings.effectsQuality = 'alto';
  const savePath = path.join(OUT, 'save-agent1.json');
  fs.writeFileSync(savePath, JSON.stringify(save, null, 1));

  const b = await cdp.open({
    port: 9541,
    profile: path.join(ROOT, '.work', 'v2.3', 'qa', 'profiles', 'p9541'),
    bundle: path.join(ROOT, '.work', 'v2.3', 'preview', 'a1.html'),
    width: 1280, height: 720
  });
  try {
    await b.seed(save);
    await b.dismissBanners();
    await cdp.sleep(600);
    const report = { generatedAt: new Date().toISOString(), cases: [], switch: null, visor: null, stats: null };

    // 1 · Antes/después por pieza y héroe
    for (const hero of HEROES) {
      for (const [slot, id] of PIECES) {
        for (const raw of [true, false]) {
          const r = await b.ev(`window.__v23Anchors.audit(${JSON.stringify(hero)}, ${JSON.stringify(id)}, {raw:${raw}})`, true);
          report.cases.push({ hero: hero, cosmetic: id, slot: slot, raw: raw, status: r.status, visible: r.visible, areaFull: r.areaFull, areaFront: r.areaFront, gap: r.gap, pen: r.penCount, penInterna: r.penetraInterna, flota: r.huecoFlotante, parpadeo: r.parpadeo, transform: r.transform, note: r.note, reason: r.failReason });
          const url = await b.ev(`window.__v23Anchors.shot(${JSON.stringify(hero)}, ${JSON.stringify(id)}, {raw:${raw}, size:300})`);
          writeShot((raw ? 'antes' : 'despues') + '-' + hero + '-' + id, url);
        }
      }
    }

    // 2 · Comprobación de cambio de héroe (sin tocar el guardado)
    report.switch = await b.ev('window.__v23Anchors.heroSwitchCheck()', true);

    // 3 · Visor de inventario: recorrer los 10 héroes con atuendo guardado
    await b.ev('window.__v22.openWardrobe()');
    await b.waitFor("!!document.querySelector('#wardrobePreviewMount canvas')", 8000);
    await cdp.sleep(900);
    const tabs = await b.ev(`Array.from(document.querySelectorAll('.miniHeroTab')).map(x => x.getAttribute('data-hero'))`);
    const visorRows = [];
    for (const hero of tabs) {
      await b.click(`.miniHeroTab[data-hero="${hero}"]`, 700);
      const info = await b.ev('window.__v23Anchors.visorInfo()');
      visorRows.push({ hero: hero, info: info });
      if (hero === 'ilan' || hero === 'kian') {
        await b.shotClip('#wardrobePreviewMount', path.join(SHOTS, 'visor-' + hero + '.png'), 1);
      }
    }
    report.visor = { rows: visorRows, tabs: tabs };
    report.stateAfter = await b.ev('window.__v23Anchors.stateSnapshot()');
    report.stats = await b.ev('window.__v23Anchors.stats()');
    report.errors = await b.ev('window.__v23Anchors.errors()');
    fs.writeFileSync(path.join(OUT, 'evidence-summary.json'), JSON.stringify(report, null, 1));
    const badSwitch = report.switch && report.switch.rows ? report.switch.rows.filter((r) => r.groups < 1) : [];
    const badVisor = visorRows.filter((r) => !r.info || r.info.groups < 1);
    console.log(JSON.stringify({
      shots: fs.readdirSync(SHOTS).length,
      switchOk: report.switch && report.switch.ok,
      switchRows: report.switch && report.switch.rows ? report.switch.rows.map((r) => r.hero + ':' + r.groups) : [],
      savedUnchanged: report.switch && report.switch.savedUnchanged,
      visor: visorRows.map((r) => r.hero + ':' + (r.info ? r.info.groups : '?')),
      badVisor: badVisor.map((r) => r.hero),
      badSwitch: badSwitch.map((r) => r.hero),
      errors: report.stats && report.stats.errors
    }, null, 1));
  } finally {
    await b.close();
  }
})().catch((e) => { console.error('EVIDENCE FAIL', e); process.exit(1); });
