'use strict';
/* Validación local del Agente 5: sintaxis, llaves CSS y contratos de acciones. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const src = path.resolve(__dirname, '..', '..', '..', 'src');
const jsFile = path.join(src, 'part5-heroes.js');
const cssFile = path.join(src, 'part5-heroes.css');
const out = { ok: true, checks: {} };

try {
  execFileSync(process.execPath, ['--check', jsFile], { stdio: 'pipe' });
  out.checks.nodeCheck = 'OK';
} catch (e) {
  out.ok = false;
  out.checks.nodeCheck = 'FAIL ' + (e.stderr ? e.stderr.toString().slice(0, 900) : e.message);
}

const css = fs.readFileSync(cssFile, 'utf8');
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
let depth = 0; let min = 0;
for (const ch of stripped) {
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth < min) min = depth; }
}
out.checks.cssBraces = { open: (stripped.match(/{/g) || []).length, close: (stripped.match(/}/g) || []).length, finalDepth: depth, negative: min };
if (depth !== 0 || min < 0) out.ok = false;

const js = fs.readFileSync(jsFile, 'utf8');
const mustHave = ['select-hero', 'open-recruit', 'recruit-confirm', 'v2-hero-prev', 'v2-hero-next', 'v2-hero-goto', 'data-v2-card', 'data-v2-stage', 'heroRequirementState', 'formatNumber', 'buildHeroAvatar', 'applyOutfitToAvatar', 'depth: true', 'antialias: true', 'ResizeObserver'];
out.checks.actions = {};
mustHave.forEach((token) => { out.checks.actions[token] = js.includes(token); if (!js.includes(token)) out.ok = false; });
out.checks.cssTokens = {
  reducedMotion: css.includes('prefers-reduced-motion') && css.includes('body.reduced-motion'),
  sidePlate: css.includes('.v2-hero-sideName') && css.includes('.v2-hero-sideRarity'),
  narrow: css.includes('.v2-carousel.is-narrow'),
  touch: css.includes('@media (pointer: coarse)'),
  noCanvasFade: !css.includes('.v2-hero-stage canvas.is-in') && !css.includes('v2hModelIn')
};
if (!Object.values(out.checks.cssTokens).every(Boolean)) out.ok = false;
out.checks.ownFilesOnly = !/part2-world\.js|part3c-cosmetics-models\.js/.test(js);
out.checks.noCanvasFade = !js.includes("classList.add('is-in')") && !css.includes('.v2-hero-stage canvas.is-in');
out.checks.canvasOptions = (() => {
  const m = js.match(/new THREE\.WebGLRenderer\(\{[\s\S]*?\}\)/);
  return m ? m[0].replace(/\s+/g, ' ') : 'missing';
})();
out.checks.gallerySlotsUntouched = !/assets\/|GAME\.assets/.test(js);
console.log(JSON.stringify(out, null, 2));
if (!out.ok) process.exitCode = 1;
