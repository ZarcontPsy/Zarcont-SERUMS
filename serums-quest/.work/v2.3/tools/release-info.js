'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..', '..', '..');
function info(rel) {
  const file = path.join(root, rel);
  const buf = fs.readFileSync(file);
  return { path: rel, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), mtime: fs.statSync(file).mtime.toISOString() };
}
const dist = info('dist/index.html');
const exp = info('export/serums-quest.html');
const game = info('game.js');
const versions = fs.readdirSync(path.join(root, '.studio', 'versions')).filter((f) => /^\d+\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(root, '.studio', 'versions', f), 'utf8')));
versions.sort((a, b) => b.number - a.number);
const latest = versions[0];
const matrix = JSON.parse(fs.readFileSync(path.join(root, '.work', 'v2.3', 'agents', 'agent1', 'matrix-after.json'), 'utf8'));
const release = {
  version: 'V2.3 · Fase 1',
  gameStudio: { number: latest.number, buildId: latest.buildId, note: latest.note, createdAt: latest.createdAt },
  game, dist, export: exp,
  distEqualsExport: dist.sha256 === exp.sha256,
  matrix: { total: matrix.total, pass: matrix.pass, fail: matrix.fail, passRate: matrix.passRate },
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(root, '.work', 'v2.3', 'qa', 'release.json'), JSON.stringify(release, null, 2));
console.log(JSON.stringify(release, null, 2));
