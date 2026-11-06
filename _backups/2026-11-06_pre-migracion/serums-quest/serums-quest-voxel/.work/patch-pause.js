const fs = require('fs');
const p = '.work/src/part3-ui.js';
let s = fs.readFileSync(p, 'utf8');
const a = s.indexOf('function pauseScreenHTML');
const b = s.indexOf('function settingsScreenHTML');
let block = s.slice(a, b);
block = block.replace('quality === q', 'state.settings.effectsQuality === q');
const second = block.lastIndexOf("        qualityHelpHTML() +");
if (second > 0) {
  const backup = block.indexOf('data-action="toggle-backup-reminder"', second);
  const lineEnd = block.indexOf('\n', backup);
  block = block.slice(0, second) + block.slice(lineEnd + 1);
}
s = s.slice(0, a) + block + s.slice(b);
fs.writeFileSync(p, s);
console.log('cleaned pause duplicate');
