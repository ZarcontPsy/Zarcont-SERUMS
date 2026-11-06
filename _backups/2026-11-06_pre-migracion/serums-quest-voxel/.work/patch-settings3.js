const fs = require('fs');
const p = '.work/src/part3-ui.js';
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('function settingsScreenHTML');
const end = s.indexOf('function currentQuestion');
if (start < 0 || end < 0) throw new Error('settings function not found');
let block = s.slice(start, end);
const add = [
  "        qualityHelpHTML() +",
  "        '<div class=\"settingsRow\"><div><b>Tamaño del texto</b><small>Amplía la lectura de preguntas, paneles y ayudas.</small></div><div class=\"qualityOptions\"><button type=\"button\" class=\"qualityBtn ' + (state.settings.textScale !== 'grande' ? 'is-active' : '') + '\" data-action=\"set-text-scale\" data-scale=\"normal\">Normal</button><button type=\"button\" class=\"qualityBtn ' + (state.settings.textScale === 'grande' ? 'is-active' : '') + '\" data-action=\"set-text-scale\" data-scale=\"grande\">Grande</button></div></div>' +",
  "        '<div class=\"settingsRow\"><div><b>Alto contraste</b><small>Refuerza texto secundario, bordes y separación de paneles.</small></div><button type=\"button\" class=\"toggle ' + (state.settings.highContrast ? 'is-on' : '') + '\" data-action=\"toggle-contrast\" aria-label=\"Alternar alto contraste\" aria-pressed=\"' + state.settings.highContrast + '\"></button></div>' +",
  "        '<div class=\"settingsRow\"><div><b>Recordatorio semanal de respaldo</b><small>Un aviso neutral si llevas días sin exportar. Puedes silenciarlo.</small></div><button type=\"button\" class=\"toggle ' + (state.settings.backupReminder ? 'is-on' : '') + '\" data-action=\"toggle-backup-reminder\" aria-label=\"Alternar recordatorio de respaldo\" aria-pressed=\"' + state.settings.backupReminder + '\"></button></div>' +"
].join('\n');
if (!/data-action="set-text-scale"/.test(block)) {
  block = block.replace(/^.*<b>Calidad de efectos<\/b>.*$/m, (line) => line + '\n' + add);
} else {
  console.log('settings already has text scale');
}
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(p, s);
console.log('patched settings screen');
