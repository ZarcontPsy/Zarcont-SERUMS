const fs = require('fs');
const s = fs.readFileSync('export/serums-quest-final.html', 'utf8');
const patterns = [/https?:\/\/[^\s"']+/g, /fetch\([^\n]{0,140}/g];
patterns.forEach((re) => {
  let m, n = 0;
  while ((m = re.exec(s)) && n < 12) { console.log(m[0]); n++; }
});
const d = require('./src/campaign.json');
console.log('KEYS', Object.keys(d));
for (const k of Object.keys(d)) if (Array.isArray(d[k])) console.log(k, d[k].length);
console.log('HTML_QUESTION_IDS', (s.match(/20\d\d-[ivx]+-psicologia-q\d+/g) || []).length);
