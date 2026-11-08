/* Agent 4 - revisión de la calidad del banco generado. */
"use strict";

const fs = require("fs");
const path = require("path");
const { ROOT, loadContent, loadCampaign, normalizeText, similarity } = require("./agent4-load.js");

const V2 = path.join(ROOT, "serums-quest/.work/v2");
const bank = JSON.parse(fs.readFileSync(path.join(V2, "questions-v2.json"), "utf8"));
const content = loadContent();
const campaign = loadCampaign();
const sheetById = new Map(content.sheets.map((s) => [s.id, s]));
const cardById = new Map(content.cards.map((c) => [c.id, c]));

const mode = process.argv[2] || "all";
const limit = Number(process.argv[3] || 3);

function pick(arr, n, seed) {
  const out = [];
  const step = Math.max(1, Math.floor(arr.length / n));
  for (let i = 0; i < n && i * step < arr.length; i += 1) out.push(arr[i * step]);
  return out;
}

function show(q) {
  console.log("─".repeat(100));
  console.log(q.id, "|", q.areaId, "|", q.origin, "|", q.difficulty);
  console.log("STEM:", q.stem);
  q.options.forEach((o) => console.log("  " + o.id + (o.id === q.answer ? " *" : "  ") + " " + o.text));
  console.log("EXPL:", q.explanation);
}

if (mode === "all" || mode === "dash") {
  const dash = bank.filter((q) => q.source === "dashboard");
  console.log("\n### MUESTRA DASHBOARD (" + dash.length + ")");
  pick(dash, limit).forEach((q) => {
    show(q);
    const sheet = sheetById.get(q.sheetId);
    console.log("  [ficha] keyConcepts:", JSON.stringify(sheet.keyConcepts, null, 1).slice(0, 900));
    console.log("  [ficha] summary:", sheet.summary.slice(0, 220));
    // ¿los distractores aparecen en el texto de la ficha?
    const blob = normalizeText([sheet.title, sheet.summary].concat(sheet.keyConcepts).join(" "));
    q.options.filter((o) => o.id !== q.answer).forEach((o) => {
      console.log("   distractor presente en la ficha?", blob.includes(normalizeText(o.text)), "|", o.text.slice(0, 80));
    });
  });
}

if (mode === "all" || mode === "concept") {
  const concept = bank.filter((q) => q.origin === "tarjeta-concepto-convertida");
  console.log("\n### MUESTRA CONCEPT CONVERTIDAS (" + concept.length + ")");
  pick(concept, limit).forEach((q) => {
    show(q);
    const card = cardById.get(q.flashcardId);
    console.log("  [tarjeta] answer completa:", card.answer);
    console.log("  [tarjeta] answer está en opción?", q.options.some((o) => o.text === card.answer));
  });
}

if (mode === "all" || mode === "closed") {
  const closed = bank.filter((q) => q.origin === "tarjeta-multiple" || q.origin === "tarjeta-application");
  console.log("\n### MUESTRA CERRADAS (" + closed.length + ")");
  pick(closed, limit).forEach((q) => {
    show(q);
    const card = cardById.get(q.flashcardId);
    console.log("  [tarjeta] correctIndex:", card.correctIndex, "→ texto:", card.options[card.correctIndex]);
    console.log("  [tarjeta] opción elegida coincide:", card.options[card.correctIndex] === q.options.find((o) => o.id === q.answer).text);
  });
}

if (mode === "all" || mode === "sim") {
  console.log("\n### SIMILITUD MÁXIMA CONTRA CAMPAÑA");
  const camp = Object.keys(campaign.questions).map((id) => campaign.questions[id]);
  let worst = [];
  bank.forEach((q) => {
    let max = 0;
    let wid = "";
    camp.forEach((c) => {
      const s = similarity(q.stem, c.stem);
      if (s > max) { max = s; wid = c.id; }
    });
    worst.push({ id: q.id, sim: max, with: wid });
  });
  worst.sort((a, b) => b.sim - a.sim);
  console.log(JSON.stringify(worst.slice(0, 8), null, 1));
}

if (mode === "all" || mode === "lengths") {
  console.log("\n### LONGITUDES");
  const optLen = bank.map((q) => Math.max(...q.options.map((o) => o.text.length)));
  const stemLen = bank.map((q) => q.stem.length);
  const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length * p)]; };
  console.log("stem p50/p90/max", q(stemLen, 0.5), q(stemLen, 0.9), Math.max(...stemLen));
  console.log("opción más larga p50/p90/max", q(optLen, 0.5), q(optLen, 0.9), Math.max(...optLen));
  const byOrigin = {};
  bank.forEach((b) => { (byOrigin[b.origin] = byOrigin[b.origin] || []).push(b); });
  Object.keys(byOrigin).forEach((k) => {
    const arr = byOrigin[k];
    console.log(" ", k, "n=" + arr.length, "opMax p90=", q(arr.map((x) => Math.max(...x.options.map((o) => o.text.length))), 0.9));
  });
  console.log("runts (opción <10 chars):", bank.filter((q) => q.options.some((o) => o.text.length < 10)).length);
}
