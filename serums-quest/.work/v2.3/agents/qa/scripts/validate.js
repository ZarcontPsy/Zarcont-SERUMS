'use strict';
/* Valida que qa-phase1.json apunte a archivos existentes y que los totales
   clave sean coherentes. Solo lectura. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const OUT = path.resolve(__dirname, '..');
const j = JSON.parse(fs.readFileSync(path.join(OUT, 'qa-phase1.json'), 'utf8'));

const paths = new Set();
function walk(v) {
  if (typeof v === 'string') {
    if (/\.(png|jpg|jpeg|json)$/i.test(v) && v.indexOf('.work/') === 0) paths.add(v);
    return;
  }
  if (Array.isArray(v)) { v.forEach(walk); return; }
  if (v && typeof v === 'object') Object.values(v).forEach(walk);
}
walk(j);
const missing = [...paths].filter((p) => !fs.existsSync(path.join(ROOT, p)));
const checks = {
  buildBytes: j.build.dist.bytes,
  distEqualsExport: j.build.export.equalToDist,
  cases: j.cases.length,
  pass: j.cases.filter((c) => c.status === 'PASS').length,
  fail: j.cases.filter((c) => c.status === 'FAIL').length,
  matrixPass: j.metrics.matrix.pass,
  matrixTotal: j.metrics.matrix.total,
  shop1308Fully: j.metrics.shop1308.fullyVisible,
  effectsScenarios: j.metrics.visor.scenarios,
  effectsAllVisible: j.metrics.visor.byGroup.efecto.effectVisible + j.metrics.visor.byGroup.marco.effectVisible,
  notes: j.notes.length,
  evidencePaths: paths.size,
  missing: missing.length
};
console.log(JSON.stringify({ checks, missing }, null, 1));
if (missing.length || checks.cases !== 9 || checks.pass !== 9 || checks.matrixPass !== 690 || checks.shop1308Fully < 12 || checks.effectsAllVisible !== 27) {
  process.exitCode = 1;
}
