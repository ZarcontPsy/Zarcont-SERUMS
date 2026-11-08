/* Agent 4 - verificación programática del banco V2 y de las explicaciones.
   Comprueba: JSON válido, ids únicos, 4 opciones no vacías, answer presente,
   explicación presente, areaId válido, correspondencia de la clave con la
   fuente, deduplicación y muestra de ≥30 claves verificadas.
   Salida: serums-quest/.work/v2/tools/agent4-verify-report.json + resumen. */
"use strict";

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  loadContent,
  loadCampaign,
  normalizeText,
  similarity,
  loadKeySample
} = require("./agent4-load.js");

const V2 = path.join(ROOT, "serums-quest/.work/v2");
const OUT = path.join(__dirname, "agent4-verify-report.js");

const OFFICIAL = [
  "area-psi-salud-publica",
  "area-psi-cuidado-integral",
  "area-psi-etica",
  "area-psi-investigacion",
  "area-psi-gestion"
];
const REQUIRED = [
  "id", "areaId", "stem", "options", "answer", "examTitle", "cycle", "page",
  "complexity", "confidence", "source", "origin", "explanation",
  "explanationGenerated", "difficulty", "tags", "generated"
];

const content = loadContent();
const campaign = loadCampaign();
const sheetById = new Map(content.sheets.map((s) => [s.id, s]));
const cardById = new Map(content.cards.map((c) => [c.id, c]));
const keySample = loadKeySample();

const raw = fs.readFileSync(path.join(V2, "questions-v2.json"), "utf8");
let bank;
let jsonError = null;
try {
  bank = JSON.parse(raw);
} catch (e) {
  jsonError = e.message;
}

const errors = [];
const warnings = [];
const checks = {};

function fail(id, issue) { errors.push({ id, issue }); }

if (jsonError) {
  console.log("JSON INVÁLIDO:", jsonError);
  process.exit(1);
}
checks.jsonValid = true;
checks.isArray = Array.isArray(bank);
if (!Array.isArray(bank)) fail("questions-v2.json", "no es un arreglo");

/* ---- validación estructural ---- */
const ids = new Set();
const byId = new Map();
let optCountOk = 0;
let answerOk = 0;
let explanationOk = 0;
let areaOk = 0;
let requiredOk = 0;
const letters = { A: 0, B: 0, C: 0, D: 0 };

bank.forEach((q) => {
  if (ids.has(q.id)) fail(q.id, "id duplicado");
  ids.add(q.id);
  byId.set(q.id, q);

  const missing = REQUIRED.filter((k) => !(k in q));
  if (missing.length) fail(q.id, "faltan campos: " + missing.join(", "));
  else requiredOk += 1;

  if (!Array.isArray(q.options) || q.options.length !== 4) fail(q.id, "no tiene 4 opciones");
  else if (q.options.some((o) => !o || typeof o.text !== "string" || !o.text.trim())) fail(q.id, "opción vacía");
  else optCountOk += 1;

  if (!["A", "B", "C", "D"].includes(q.answer)) fail(q.id, "answer ausente o inválido");
  else answerOk += 1;

  if (!q.explanation || !String(q.explanation).trim()) fail(q.id, "sin explicación");
  else explanationOk += 1;

  if (!OFFICIAL.includes(q.areaId)) fail(q.id, "areaId fuera de las 5 áreas oficiales");
  else areaOk += 1;

  if (q.options) {
    const texts = q.options.map((o) => normalizeText(o.text));
    if (new Set(texts).size !== texts.length) fail(q.id, "opciones duplicadas internas");
  }
  if (letters[q.answer] !== undefined) letters[q.answer] += 1;
});

checks.uniqueIds = ids.size === bank.length;
checks.fourOptions = optCountOk === bank.length;
checks.answerPresent = answerOk === bank.length;
checks.explanationPresent = explanationOk === bank.length;
checks.areaValid = areaOk === bank.length;
checks.requiredFields = requiredOk === bank.length;
checks.answerDistribution = letters;

/* ---- correspondencia con la fuente ---- */
const provenance = { flashcardsClosed: 0, flashcardsConcept: 0, dashboard: 0 };
const provenanceProblems = [];

bank.forEach((q) => {
  if (q.source === "flashcards") {
    const card = cardById.get(q.flashcardId);
    if (!card) { provenanceProblems.push({ id: q.id, issue: "tarjeta inexistente" }); return; }
    const chosen = q.options.find((o) => o.id === q.answer);
    if (!chosen) { provenanceProblems.push({ id: q.id, issue: "clave no está entre las opciones" }); return; }
    if (card.type === "multiple" || card.type === "application") {
      const sourceText = card.options[card.correctIndex];
      if (chosen.text !== sourceText) {
        provenanceProblems.push({
          id: q.id,
          issue: "la opción correcta no coincide con options[correctIndex] de la tarjeta",
          q: chosen.text,
          source: sourceText
        });
      } else provenance.flashcardsClosed += 1;
      // las 4 opciones deben ser exactamente las de la tarjeta
      const sameSet = q.options.map((o) => o.text).slice().sort().join("|") === card.options.slice().sort().join("|");
      if (!sameSet) provenanceProblems.push({ id: q.id, issue: "las opciones no son las de la tarjeta" });
    } else {
      const answer = card.answer.trim();
      if (!answer.startsWith(chosen.text)) {
        provenanceProblems.push({ id: q.id, issue: "la opción correcta no es un fragmento exacto (prefijo) de card.answer" });
      } else {
        const rest = answer.slice(chosen.text.length);
        if (rest && !/^[.;:]?\s/.test(rest)) {
          provenanceProblems.push({ id: q.id, issue: "el corte no cae en un límite de oración o cláusula" });
        } else provenance.flashcardsConcept += 1;
      }
      // los distractores deben ser prefijos exactos de respuestas de otras tarjetas
      const distractors = q.options.filter((o) => o.id !== q.answer);
      distractors.forEach((o) => {
        const owner = content.cards.find((c) => c.type === "concept" && c.id !== card.id && c.answer.trim().startsWith(o.text));
        if (!owner) {
          provenanceProblems.push({ id: q.id, issue: "distractor que no proviene de otra tarjeta concept", text: o.text.slice(0, 90) });
        }
      });
    }
  } else if (q.source === "dashboard") {
    const sheet = sheetById.get(q.sheetId);
    if (!sheet) { provenanceProblems.push({ id: q.id, issue: "ficha inexistente" }); return; }
    const chosen = q.options.find((o) => o.id === q.answer);
    if (!chosen) { provenanceProblems.push({ id: q.id, issue: "clave no está entre las opciones" }); return; }
    if (!sheet.keyConcepts.includes(chosen.text)) {
      provenanceProblems.push({ id: q.id, issue: "la clave no es un keyConcept exacto de la ficha" });
    } else provenance.dashboard += 1;
    q.options.filter((o) => o.id !== q.answer).forEach((o) => {
      const owner = content.sheets.find((s) => s.id !== sheet.id && s.keyConcepts.includes(o.text));
      if (!owner) provenanceProblems.push({ id: q.id, issue: "distractor que no es keyConcept exacto de otra ficha", text: o.text.slice(0, 90) });
      else if (owner.primaryAreaId !== sheet.primaryAreaId) provenanceProblems.push({ id: q.id, issue: "distractor de otra área" });
    });
  } else {
    provenanceProblems.push({ id: q.id, issue: "source desconocido" });
  }
});

checks.provenance = provenance;
checks.provenanceOk = provenanceProblems.length === 0;

/* ---- deduplicación ---- */
const campaignIds = Object.keys(campaign.questions);
const campaignList = campaignIds.map((id) => ({ id, stem: campaign.questions[id].stem }));
let maxVsCampaign = 0;
const nearCampaign = [];
bank.forEach((q) => {
  campaignList.forEach((c) => {
    const s = similarity(q.stem, c.stem);
    if (s > maxVsCampaign) maxVsCampaign = s;
    if (s > 0.9) nearCampaign.push({ id: q.id, with: c.id, sim: Number(s.toFixed(3)) });
  });
});
const dupInternal = [];
for (let i = 0; i < bank.length; i += 1) {
  for (let j = i + 1; j < bank.length; j += 1) {
    if (normalizeText(bank[i].stem) === normalizeText(bank[j].stem)) dupInternal.push([bank[i].id, bank[j].id]);
  }
}
checks.noDuplicatesVsCampaign = nearCampaign.length === 0;
checks.noDuplicatesInternal = dupInternal.length === 0;
checks.maxSimilarityVsCampaign = Number(maxVsCampaign.toFixed(3));

/* ---- explicaciones de las 111 originales ---- */
const explPath = path.join(V2, "explanations-original.json");
let expl = null;
let explError = null;
try { expl = JSON.parse(fs.readFileSync(explPath, "utf8")); } catch (e) { explError = e.message; }
const explProblems = [];
if (!expl) explProblems.push({ id: "explanations-original.json", issue: explError || "no se pudo leer" });
else {
  campaignIds.forEach((id) => {
    const e = expl[id];
    if (!e) { explProblems.push({ id, issue: "sin explicación" }); return; }
    if (!e.explanation || !String(e.explanation).trim()) explProblems.push({ id, issue: "explicación vacía" });
    if (e.explanationGenerated !== true) explProblems.push({ id, issue: "explanationGenerated debe ser true" });
    if (!["base", "media", "alta"].includes(e.difficulty)) explProblems.push({ id, issue: "difficulty inválida" });
    if (!Array.isArray(e.tags) || !e.tags.length) explProblems.push({ id, issue: "tags vacíos" });
  });
  Object.keys(expl).forEach((id) => {
    if (!campaign.questions[id]) explProblems.push({ id, issue: "id que no existe en la campaña" });
  });
  if (Object.keys(expl).length !== campaignIds.length) {
    explProblems.push({ id: "conteo", issue: "entradas " + Object.keys(expl).length + " vs " + campaignIds.length + " preguntas" });
  }
}
checks.originalExplanationsCount = expl ? Object.keys(expl).length : 0;
checks.originalExplanationsOk = explProblems.length === 0;

/* ---- muestra verificada (≥30) ---- */
const sample = [];
function addRow(id, source, keyText, check, ok) {
  sample.push({ id, fuente: source, clave: keyText, comprobacion: check, ok });
}

// 10 de la muestra ya verificada en fase previa (key-sample.json)
keySample.rows.slice(0, 10).forEach((r) => {
  const q = campaign.questions[r.id];
  const ok = !!q && q.answer === r.originalKey && q.options.find((o) => o.id === q.answer).text === r.originalText && r.match === true;
  addRow(r.id, "campaña (111 originales)", "Opción " + r.originalKey + ": " + r.originalText,
    "key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json", ok);
});

// 12 tarjetas cerradas
const closed = bank.filter((q) => q.origin === "tarjeta-multiple" || q.origin === "tarjeta-application");
const stepC = Math.max(1, Math.floor(closed.length / 12));
for (let i = 0; i < closed.length && sample.length < 22; i += stepC) {
  const q = closed[i];
  const card = cardById.get(q.flashcardId);
  const chosen = q.options.find((o) => o.id === q.answer).text;
  addRow(q.id, "flashcards · " + card.type + " (" + card.id + ")", chosen,
    "options[correctIndex=" + card.correctIndex + "] de la tarjeta = opción " + q.answer, chosen === card.options[card.correctIndex]);
}

// 8 concept convertidas
const conceptQ = bank.filter((q) => q.origin === "tarjeta-concepto-convertida");
const stepK = Math.max(1, Math.floor(conceptQ.length / 8));
for (let i = 0; i < conceptQ.length && sample.length < 30; i += stepK) {
  const q = conceptQ[i];
  const card = cardById.get(q.flashcardId);
  const chosen = q.options.find((o) => o.id === q.answer).text;
  addRow(q.id, "flashcards · concept (" + card.id + ")", chosen,
    "fragmento exacto al inicio de card.answer (" + card.answer.length + " → " + chosen.length + " caracteres)", card.answer.trim().startsWith(chosen));
}

// 7 fichas
const dash = bank.filter((q) => q.source === "dashboard");
const stepD = Math.max(1, Math.floor(dash.length / 7));
for (let i = 0; i < dash.length && sample.length < 37; i += stepD) {
  const q = dash[i];
  const sheet = sheetById.get(q.sheetId);
  const chosen = q.options.find((o) => o.id === q.answer).text;
  addRow(q.id, "dashboard · " + sheet.id, chosen,
    "keyConcept exacto de la ficha " + sheet.id + " (" + sheet.keyConcepts.length + " keyConcepts)", sheet.keyConcepts.includes(chosen));
}
checks.sampleRows = sample.length;
checks.sampleAllOk = sample.every((r) => r.ok);

/* ---- conteos ---- */
const countBy = (arr, fn) => arr.reduce((m, x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const summary = {
  total: bank.length,
  bySource: countBy(bank, (q) => q.source),
  byOrigin: countBy(bank, (q) => q.origin),
  byArea: countBy(bank, (q) => q.areaId),
  byAreaAndSource: OFFICIAL.reduce((m, a) => {
    m[a] = countBy(bank.filter((q) => q.areaId === a), (q) => q.source);
    return m;
  }, {}),
  generated: bank.filter((q) => q.generated).length,
  explanationGenerated: bank.filter((q) => q.explanationGenerated).length,
  byDifficulty: countBy(bank, (q) => q.difficulty),
  withSourceRefs: bank.filter((q) => Array.isArray(q.sourceRefs) && q.sourceRefs.length).length,
  withFlashcardId: bank.filter((q) => q.flashcardId).length,
  withSheetId: bank.filter((q) => q.sheetId).length
};

const report = {
  checkedAt: new Date().toISOString(),
  datasetVersion: content.version,
  checks,
  errors,
  warnings,
  provenanceProblems,
  nearDuplicates: nearCampaign,
  internalDuplicates: dupInternal,
  originalExplanationsProblems: explProblems,
  summary,
  sample
};

fs.writeFileSync(OUT, "module.exports = " + JSON.stringify(report, null, 2) + ";\n", "utf8");

/* Tabla Markdown de la muestra, para el informe. */
function escCell(s) {
  return String(s).replace(/\|/g, "/").replace(/\n/g, " ");
}
function cutCell(s, n) {
  const t = escCell(s);
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}
const sampleMd = ["| # | id | fuente | clave | comprobación | OK |", "|---|---|---|---|---|---|"]
  .concat(sample.map((s, i) => "| " + (i + 1) + " | `" + s.id + "` | " + escCell(s.fuente) + " | " +
    cutCell(s.clave, 110) + " | " + cutCell(s.comprobacion, 110) + " | " + (s.ok ? "OK" : "FALLA") + " |"))
  .join("\n");

const failed = Object.entries(checks).filter(([k, v]) => v === false).map(([k]) => k);
const booleans = Object.entries(checks).filter(([, v]) => typeof v === "boolean");
console.log(JSON.stringify({
  written: OUT,
  checks,
  booleans: booleans.length + " comprobaciones booleanas, " + booleans.filter(([, v]) => v).length + " en verde",
  errors: errors.slice(0, 10),
  errorCount: errors.length,
  provenanceProblems: provenanceProblems.length,
  explProblems: explProblems.length,
  failedChecks: failed,
  summary
}, null, 2));
if (process.argv.includes("--sample")) console.log("\n" + sampleMd);

if (errors.length || provenanceProblems.length || explProblems.length || failed.length) process.exitCode = 1;
