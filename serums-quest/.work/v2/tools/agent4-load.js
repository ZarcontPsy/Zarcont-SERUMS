/* Agent 4 - cargador del dataset compartido y de la campaña.
   Uso: const { content, campaign, ... } = require("./agent4-load.js");
   No imprime nada: solo carga en un vm aislado para no consumir contexto. */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "../../../.."); // .../ZARCONT SERUMS

function loadContent() {
  const temarioPath = path.join(ROOT, "study-data/temario.js");
  const taxonomyPath = path.join(ROOT, "study-shared/taxonomy.js");
  const sandbox = { window: {}, console: { log() {}, warn() {}, error() {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(temarioPath, "utf8"), sandbox, { filename: temarioPath });
  vm.runInContext(fs.readFileSync(taxonomyPath, "utf8"), sandbox, { filename: taxonomyPath });
  return sandbox.window.STUDY_CONTENT;
}

function loadCampaign() {
  const p = path.join(ROOT, "serums-quest/src/campaign.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadKeySample() {
  const p = path.join(ROOT, "serums-quest/.work/key-sample.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/* Normalización usada para deduplicar: minúsculas, sin tildes, sin puntuación. */
function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s) {
  return new Set(normalizeText(s).split(" ").filter((w) => w.length > 2));
}

/* Similitud de Jaccard sobre palabras (>3 letras) del stem normalizado. */
function similarity(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter += 1;
  return inter / (A.size + B.size - inter);
}

/* NFD sin tildes pero conservando tildes originales no: solo para comparar. */
function stripAccents(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

module.exports = {
  ROOT,
  loadContent,
  loadCampaign,
  loadKeySample,
  normalizeText,
  similarity,
  stripAccents
};
