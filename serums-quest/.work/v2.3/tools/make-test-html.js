'use strict';
/* Sustituye el último <script> de dist/index.html por el game.js indicado.
   Uso: node .work/v2.3/tools/make-test-html.js <game.js> <salida.html>
   No toca dist/, ni game.js, ni export/. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..');
const from = process.argv[2] ? path.resolve(process.argv[2]) : null;
const to = process.argv[3] ? path.resolve(process.argv[3]) : null;
if (!from || !to) {
  console.error('Uso: node .work/v2.3/tools/make-test-html.js <game.js> <salida.html>');
  process.exit(2);
}
const dist = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const code = fs.readFileSync(from, 'utf8');
const starts = [];
let at = 0;
while ((at = dist.indexOf('<script', at)) !== -1) {
  const end = dist.indexOf('</script>', at);
  starts.push({ start: at, end });
  at = end + 9;
}
if (starts.length < 2) throw new Error('dist/index.html no tiene el script del juego');
const last = starts[starts.length - 1];
const html = dist.slice(0, last.start + 8) + '\n' + code.replace(/<\/script/gi, '<\\/script') + '\n' + dist.slice(last.end);
fs.mkdirSync(path.dirname(to), { recursive: true });
fs.writeFileSync(to, html);
console.log('preview HTML:', to, 'bytes:', Buffer.byteLength(html), 'game bytes:', Buffer.byteLength(code));
