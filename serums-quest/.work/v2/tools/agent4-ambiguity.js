/* Agent 4 - análisis de defensibilidad de las preguntas de ficha. */
"use strict";

const fs = require("fs");
const path = require("path");
const { ROOT, loadContent, normalizeText, similarity } = require("./agent4-load.js");

const V2 = path.join(ROOT, "serums-quest/.work/v2");
const bank = JSON.parse(fs.readFileSync(path.join(V2, "questions-v2.json"), "utf8"));
const content = loadContent();
const sheetById = new Map(content.sheets.map((s) => [s.id, s]));

const dash = bank.filter((q) => q.source === "dashboard");
const rows = [];
dash.forEach((q) => {
  const sheet = sheetById.get(q.sheetId);
  const distractors = q.options.filter((o) => o.id !== q.answer);
  let maxOverlap = 0;
  let worst = "";
  distractors.forEach((o) => {
    sheet.keyConcepts.forEach((kc) => {
      const s = similarity(o.text, kc);
      if (s > maxOverlap) { maxOverlap = s; worst = kc; }
    });
  });
  rows.push({ id: q.id, maxOverlap, worst, d: distractors.map((o) => o.text) });
});
rows.sort((a, b) => b.maxOverlap - a.maxOverlap);
console.log("dashboard n =", rows.length);
[0.5, 0.4, 0.3, 0.25].forEach((t) => {
  console.log("con solapamiento > " + t + " contra keyConcepts de la misma ficha:", rows.filter((r) => r.maxOverlap > t).length);
});
console.log("\nTop 8 más solapados:");
rows.slice(0, 8).forEach((r) => {
  console.log("─", r.id, "overlap=" + r.maxOverlap.toFixed(2));
  console.log("   peor distractor:", r.worst.slice(0, 140));
});
