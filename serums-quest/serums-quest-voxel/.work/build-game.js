'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const project = path.resolve(__dirname, '..');
const src = path.resolve(__dirname, 'src');
const campaign = JSON.parse(fs.readFileSync(path.join(project, 'src', 'campaign.json'), 'utf8'));
const extras = JSON.parse(fs.readFileSync(path.join(project, 'src', 'extras.json'), 'utf8'));
const modes = JSON.parse(fs.readFileSync(path.join(project, 'src', 'modes.json'), 'utf8'));
campaign.achievements = campaign.achievements.concat(modes.achievements);
campaign.meta.achievementCount = campaign.achievements.length;
const css = fs.readFileSync(path.join(src, 'styles.css'), 'utf8') + '\n' + fs.readFileSync(path.join(src, 'part3e-cosmetics.css'), 'utf8') + '\n' + fs.readFileSync(path.join(src, 'part3g-map.css'), 'utf8') + '\n' + fs.readFileSync(path.join(src, 'part3i-modes.css'), 'utf8') + '\n' + fs.readFileSync(path.join(src, 'part3k-learning.css'), 'utf8');

// Fase 3: compatibilidad abierta a los diez héroes y catálogo ampliado.
const allHeroIds = campaign.characters.map((c) => c.id);
const originalCatalog = campaign.cosmetics.map((c) => Object.assign({}, c, {
  compatibleCharacterIds: allHeroIds.slice(),
  isExtra: false
}));
const extraCatalog = extras.cosmetics.map((c) => Object.assign({}, c, {
  compatibleCharacterIds: allHeroIds.slice(),
  isExtra: true,
  shopAvailable: false
}));
campaign.cosmeticCategories = campaign.cosmeticCategories.concat(extras.categories);
campaign.cosmetics = originalCatalog.concat(extraCatalog);
campaign.meta.cosmeticCount = campaign.cosmetics.length;
campaign.meta.originalCosmeticCount = originalCatalog.length;
campaign.meta.extraCosmeticCount = extraCatalog.length;
const parts = ['part1-core.js', 'part2-world.js', 'part3-ui.js', 'part3b-cosmetics-core.js', 'part3c-cosmetics-models.js', 'part3d-cosmetics-ui.js', 'part3f-map.js', 'part3h-modes.js', 'part3j-learning.js', 'part4-flow.js']
  .map((name) => fs.readFileSync(path.join(src, name), 'utf8'));

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const header = '/* SERUMS QUEST — OBSERVATORIO DE LAS CINCO RUTAS\n' +
  '   Fase 4 · mapa de avance. Generado desde src/campaign.json, src/extras.json y .work/src.\n' +
  '   Checkpoint: mapa 3D, 18 nodos, estados, puertas, repaso, cámara y flujo mapa-duelo.\n' +
  '   F4 checkpoint final: estados Disponible/Dominado y fotograma de animación verificados.\n' +
  '   No editar a mano: cambia las fuentes y ejecuta .work/build-game.js. */\n' +
  'var CAMPAIGN_DATA = ' + safeJson(campaign) + ';\n' +
  'var STYLE_CSS = ' + safeJson(css) + ';\n' +
  '(function () {\n\'use strict\';\n';
const footer = '\n})();\n';
const code = header + parts.join('\n') + footer;
fs.writeFileSync(path.join(project, 'game.js'), code);
console.log('game.js bytes:', Buffer.byteLength(code));
try {
  execFileSync(process.execPath, ['--check', path.join(project, 'game.js')], { stdio: 'inherit' });
  console.log('node --check: OK');
} catch (error) {
  process.exitCode = 1;
}
