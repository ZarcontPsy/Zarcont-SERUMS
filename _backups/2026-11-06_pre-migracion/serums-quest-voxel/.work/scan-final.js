const fs = require('fs');
const s = fs.readFileSync('export/serums-quest-final.html', 'utf8');
const pats = [
  /href=["']https?:\/\/[^"']+/gi,
  /src=["']https?:\/\/[^"']+/gi,
  /@import\s+url\([^)]*\)/gi,
  /fetch\(\s*["']https?:\/\//gi,
  /XMLHttpRequest/g
];
for (const re of pats) {
  const m = s.match(re);
  if (m) console.log(re.toString(), m.slice(0, 5));
}
console.log('https occurrences', (s.match(/https?:\/\//g) || []).length);
console.log('context', (s.match(/https?:\/\/[^\s"']+/g) || []).slice(0, 5));
