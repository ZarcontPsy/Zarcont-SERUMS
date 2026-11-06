const fs = require('fs');
const p = '.work/src/part3-ui.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/^.*Calidad de efectos.*$/m, [
  "        '<div class=\"settingsRow settingsRow--stack\"><div><b>Calidad de efectos</b><small>Más resolución y partículas = más carga. La calidad baja ayuda en táctiles o sin aceleración.</small></div><div class=\"qualityOptions\">' + ['bajo', 'medio', 'alto'].map(function (q) { return '<button type=\"button\" class=\"qualityBtn ' + (quality === q ? 'is-active' : '') + '\" data-action=\"set-effects-quality\" data-quality=\"' + q + '\">' + (q === 'bajo' ? 'Baja' : q === 'alto' ? 'Alta' : 'Media') + '</button>'; }).join('') + '</div></div>' +",
  "        qualityHelpHTML() +",
  "        '<div class=\"settingsRow\"><div><b>Tamaño del texto</b><small>Amplía la lectura de preguntas, paneles y ayudas.</small></div><div class=\"qualityOptions\"><button type=\"button\" class=\"qualityBtn ' + (state.settings.textScale !== 'grande' ? 'is-active' : '') + '\" data-action=\"set-text-scale\" data-scale=\"normal\">Normal</button><button type=\"button\" class=\"qualityBtn ' + (state.settings.textScale === 'grande' ? 'is-active' : '') + '\" data-action=\"set-text-scale\" data-scale=\"grande\">Grande</button></div></div>' +",
  "        '<div class=\"settingsRow\"><div><b>Alto contraste</b><small>Refuerza texto secundario, bordes y separación de paneles.</small></div><button type=\"button\" class=\"toggle ' + (state.settings.highContrast ? 'is-on' : '') + '\" data-action=\"toggle-contrast\" aria-label=\"Alternar alto contraste\" aria-pressed=\"' + state.settings.highContrast + '\"></button></div>' +",
  "        '<div class=\"settingsRow\"><div><b>Recordatorio semanal de respaldo</b><small>Un aviso neutral si llevas días sin exportar. Puedes silenciarlo.</small></div><button type=\"button\" class=\"toggle ' + (state.settings.backupReminder ? 'is-on' : '') + '\" data-action=\"toggle-backup-reminder\" aria-label=\"Alternar recordatorio de respaldo\" aria-pressed=\"' + state.settings.backupReminder + '\"></button></div>' +"
].join('\n'));
fs.writeFileSync(p, s);
console.log('patched settings quality/accessibility');
