/* Agent 4 - inspección del dataset y del mapa maestro (solo lectura). */
"use strict";

const fs = require("fs");
const path = require("path");
const { ROOT, loadContent } = require("./agent4-load.js");

const OFFICIAL = [
  "area-psi-salud-publica",
  "area-psi-cuidado-integral",
  "area-psi-etica",
  "area-psi-investigacion",
  "area-psi-gestion"
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1; } else { q = false; }
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur); cur = ""; rows.push(row); row = []; }
    else if (ch === "\r") { /* ignore */ }
    else cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function readCsv(rel) {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  let text = buf.toString("utf8");
  if (text.includes("\uFFFD")) text = buf.toString("latin1");
  const rows = parseCsv(text).filter((r) => r.length > 1);
  const head = rows[0];
  return rows.slice(1).map((r) => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

function main() {
  const c = loadContent();
  const csv = readCsv("study-data/audit/MAPA-MAESTRO-5-AREAS.csv");
  const map = new Map();
  csv.forEach((r) => { if (r.ficha_id) map.set(r.ficha_id, r); });

  const out = {};
  out.version = c.version;
  out.counts = {
    sources: c.sources.length,
    areas: c.areas.length,
    topics: c.topics.length,
    sheets: c.sheets.length,
    cards: c.cards.length,
    cardsByType: c.cards.reduce((m, k) => { m[k.type] = (m[k.type] || 0) + 1; return m; }, {})
  };
  out.taxonomyIssues = c.taxonomy.issues;
  out.areaSheetTotals = c.taxonomy.areaSheetTotals;
  out.csvRows = csv.length;
  out.csvFichaRows = map.size;

  const mismatch = [];
  const missing = [];
  c.sheets.forEach((s) => {
    const r = map.get(s.id);
    if (!r) { missing.push(s.id); return; }
    if (r.area_id !== s.primaryAreaId) mismatch.push({ id: s.id, csv: r.area_id, tax: s.primaryAreaId });
  });
  out.csvMissing = missing;
  out.csvMismatch = mismatch;

  // Categorías por área
  out.categoriesByArea = {};
  c.categories.forEach((cat) => {
    out.categoriesByArea[cat.areaId] = out.categoriesByArea[cat.areaId] || [];
    out.categoriesByArea[cat.areaId].push(cat.id + " · " + cat.title);
  });

  // Cobertura de tarjetas por área (a través de la ficha)
  const sheetById = new Map(c.sheets.map((s) => [s.id, s]));
  out.cardsByAreaAndType = {};
  OFFICIAL.forEach((a) => { out.cardsByAreaAndType[a] = {}; });
  const orphan = [];
  c.cards.forEach((k) => {
    const s = sheetById.get(k.sheetId);
    if (!s || !OFFICIAL.includes(s.primaryAreaId)) { orphan.push(k.id); return; }
    const t = out.cardsByAreaAndType[s.primaryAreaId];
    t[k.type] = (t[k.type] || 0) + 1;
  });
  out.orphanCards = orphan;

  // Equilibrio de opciones MCQ ya existentes
  let badOptions = 0;
  let badIndex = 0;
  let dupOptions = 0;
  c.cards.forEach((k) => {
    if (k.type === "concept") return;
    if (!Array.isArray(k.options) || k.options.length !== 4) badOptions += 1;
    else if (k.options.some((o) => !String(o || "").trim())) badOptions += 1;
    if (!Number.isInteger(k.correctIndex) || k.correctIndex < 0 || k.correctIndex > 3) badIndex += 1;
    if (Array.isArray(k.options) && new Set(k.options.map((o) => String(o).toLowerCase().trim())).size < 4) dupOptions += 1;
  });
  out.cardOptionIssues = { badOptions, badIndex, dupOptions };

  // Longitud de respuestas concept
  const concept = c.cards.filter((k) => k.type === "concept");
  out.conceptAnswerLength = {
    min: Math.min(...concept.map((k) => k.answer.length)),
    max: Math.max(...concept.map((k) => k.answer.length)),
    over300: concept.filter((k) => k.answer.length > 300).length,
    over500: concept.filter((k) => k.answer.length > 500).length
  };

  // Topics sin categoría / contenedores
  out.containerTopics = c.topics.filter((t) => t.isContainer).map((t) => t.id);
  out.topicsWithoutCategory = c.topics.filter((t) => !t.isContainer && !t.categoryId).map((t) => t.id);

  // Sheets por categoría
  const sheetCat = {};
  c.sheets.forEach((s) => { sheetCat[s.categoryId] = (sheetCat[s.categoryId] || 0) + 1; });
  out.sheetsByCategory = sheetCat;

  // ¿Hay sheets duplicados por título o keyConcept idéntico?
  out.sheetsDuplicateTitles = c.sheets.length - new Set(c.sheets.map((s) => s.title.toLowerCase().trim())).size;

  console.log(JSON.stringify(out, null, 2));
}

main();
