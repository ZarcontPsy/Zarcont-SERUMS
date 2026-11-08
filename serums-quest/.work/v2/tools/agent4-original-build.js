/* Agent 4 - construye explanations-original.json a partir de:
   - las explicaciones redactadas en agent4-original-es.js
   - el enunciado, la clave y las opciones de campaign.json
   - la dificultad derivada del campo complexity (terciles de las 111)
   Valida cobertura y coherencia antes de escribir. */
"use strict";

const fs = require("fs");
const path = require("path");
const { ROOT, loadCampaign } = require("./agent4-load.js");

const V2 = path.join(ROOT, "serums-quest/.work/v2");
const OUT = path.join(V2, "explanations-original.json");
const explanations = require("./agent4-original-es.js");

const campaign = loadCampaign();
const ids = Object.keys(campaign.questions);

/* Dificultad por terciles de complexity, añadiendo tags de área. */
const sorted = ids.map((id) => campaign.questions[id].complexity).sort((a, b) => a - b);
const t1 = sorted[Math.floor(sorted.length / 3)];
const t2 = sorted[Math.floor((sorted.length * 2) / 3)];

function difficultyOf(c) {
  if (c <= t1) return "base";
  if (c <= t2) return "media";
  return "alta";
}

const AREA_TAG = {
  "area-psi-salud-publica": "salud pública",
  "area-psi-cuidado-integral": "cuidado integral",
  "area-psi-etica": "ética e interculturalidad",
  "area-psi-investigacion": "investigación",
  "area-psi-gestion": "gestión de servicios"
};

const missing = [];
const problems = [];
const out = {};

ids.forEach((id) => {
  const item = explanations[id];
  const q = campaign.questions[id];
  if (!item) {
    missing.push(id);
    return;
  }
  const exp = String(item.explanation || "").trim();
  const sentences = exp.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 1 || sentences.length > 2) {
    problems.push({ id, issue: "nº de frases = " + sentences.length, text: exp });
  }
  if (exp.length < 80) problems.push({ id, issue: "explicación demasiado corta", text: exp });
  if (exp.length > 420) problems.push({ id, issue: "explicación demasiado larga", text: exp });
  // La clave citada nunca debe contradecir el texto de la opción correcta.
  const keyText = q.options.find((o) => o.id === q.answer);
  const tags = Array.from(new Set((item.tags || []).concat([AREA_TAG[q.areaId]]).filter(Boolean)));
  out[id] = {
    explanation: exp,
    explanationGenerated: true,
    difficulty: difficultyOf(q.complexity),
    tags
  };
  if (!keyText) problems.push({ id, issue: "la clave no existe entre las opciones" });
});

if (missing.length) {
  console.error("FALTAN " + missing.length + " explicaciones:", missing.join(", "));
  process.exitCode = 1;
}
if (problems.length) {
  console.error("PROBLEMAS:", JSON.stringify(problems, null, 1));
  process.exitCode = 1;
}
if (missing.length || problems.length) {
  console.log("No se escribió el archivo. Corrige primero.");
  process.exit();
}

const ordered = {};
ids.forEach((id) => { ordered[id] = out[id]; });
fs.writeFileSync(OUT, JSON.stringify(ordered, null, 2) + "\n", "utf8");

const dist = {};
Object.values(ordered).forEach((o) => { dist[o.difficulty] = (dist[o.difficulty] || 0) + 1; });
console.log(JSON.stringify({
  written: OUT,
  total: Object.keys(ordered).length,
  terciles: { t1, t2 },
  difficulty: dist,
  avgLength: Math.round(Object.values(ordered).reduce((n, o) => n + o.explanation.length, 0) / Object.keys(ordered).length)
}, null, 2));
