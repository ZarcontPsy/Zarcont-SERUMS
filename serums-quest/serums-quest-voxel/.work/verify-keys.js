const fs = require('fs');
const vm = require('vm');
const campaign = JSON.parse(fs.readFileSync('src/campaign.json', 'utf8'));
const bankJs = fs.readFileSync('C:/Users/USARIO/Documents/ZARCONT SERUMS/EXAMEN STUDIO/datos/banco-oficial.js', 'utf8');
const box = { window: {} };
vm.createContext(box);
vm.runInContext(bankJs, box);
const bank = box.window.BANCO_OFICIAL;
const bankById = {};
Object.keys(bank.questions).forEach((exam) => bank.questions[exam].forEach((q) => { bankById[q.id] = q; }));
const all = Object.values(campaign.questions).sort((a, b) => a.id.localeCompare(b.id));
const sample = [];
for (let i = 0; i < all.length && sample.length < 30; i += Math.max(1, Math.floor(all.length / 30))) sample.push(all[i]);
if (sample.length < 30) for (const q of all) { if (sample.length >= 30) break; if (!sample.includes(q)) sample.push(q); }
const rows = sample.map((q) => {
  const b = bankById[q.id];
  if (!b) return { id: q.id, match: false, reason: 'No está en el banco original' };
  const originalText = (b.o.find((o) => o.id === b.c) || {}).text || '';
  const campaignText = (q.options.find((o) => o.id === q.answer) || {}).text || '';
  return {
    id: q.id,
    match: b.c === q.answer && originalText.trim() === campaignText.trim(),
    originalKey: b.c,
    campaignKey: q.answer,
    originalText,
    campaignText
  };
});
const result = {
  bankVersion: bank.version,
  bankQuestions: Object.values(bank.questions).reduce((n, qs) => n + qs.length, 0),
  campaignQuestions: all.length,
  sampled: rows.length,
  matched: rows.filter((r) => r.match).length,
  rows
};
fs.writeFileSync('.work/key-sample.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ bankVersion: result.bankVersion, bankQuestions: result.bankQuestions, campaignQuestions: result.campaignQuestions, sampled: result.sampled, matched: result.matched, failures: rows.filter((r) => !r.match) }, null, 2));
