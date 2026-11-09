'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..', '..');
const dist = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const starts = [];
let at = 0;
while ((at = dist.indexOf('<script', at)) !== -1) {
  const end = dist.indexOf('</script>', at);
  starts.push({ start: at, end, length: end - at });
  at = end + 9;
}
console.log('dist length', dist.length, 'scripts', starts.length);
console.log(starts.map((s) => ({ start: s.start, end: s.end, length: s.length })));
for (const s of starts) {
  const chunk = dist.slice(s.start + 8, s.end);
  console.log('script bytes', chunk.length, 'gameHead', chunk.indexOf(game.slice(0, 400)), 'gameTail', chunk.indexOf(game.slice(-400)));
}
console.log('game length', game.length);
console.log('dist includes full game', dist.includes(game));
console.log('game head', JSON.stringify(game.slice(0, 200)));
console.log('game tail', JSON.stringify(game.slice(-120)));
