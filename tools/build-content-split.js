#!/usr/bin/env node
/* © 2026 ZARCONT — H4: divide el temario canónico para carga bajo demanda.
 *
 * Fuente única: study-data/temario.js + study-shared/taxonomy.js.
 * Genera:
 *   study-data/temario-core.js                 (metadatos, sheets sin sections, cards)
 *   study-data/sections/<primaryAreaId>.js     (un chunk por área oficial)
 *   study-data/content-split.json              (conteos, bytes, cobertura y hashes)
 *
 * No modifica el temario canónico. Sin dependencias npm; usa vm para no evaluar
 * el temario en el proceso principal. Salida determinista para una misma fuente.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_PATH = path.join(ROOT, "study-data", "temario.js");
const TAXONOMY_PATH = path.join(ROOT, "study-shared", "taxonomy.js");
const OUT_DIR = path.join(ROOT, "study-data");
const SECTIONS_DIR = path.join(OUT_DIR, "sections");
const CORE_PATH = path.join(OUT_DIR, "temario-core.js");
const META_PATH = path.join(OUT_DIR, "content-split.json");
const FORMAT_VERSION = 1;
const OFFICIAL_AREAS = [
  "area-psi-salud-publica",
  "area-psi-cuidado-integral",
  "area-psi-etica",
  "area-psi-investigacion",
  "area-psi-gestion"
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}
function byteLength(text) {
  return Buffer.byteLength(text, "utf8");
}
function jsonScript(variable, value) {
  return "window." + variable + " = " + JSON.stringify(value) + ";\n";
}
function stripSections(sheet) {
  const clean = {};
  Object.keys(sheet || {}).forEach((key) => {
    if (key !== "sections") clean[key] = sheet[key];
  });
  return clean;
}
function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function sectionCount(sheets) {
  return (sheets || []).reduce((sum, sheet) => sum + ((sheet.sections || []).length), 0);
}

function loadSource() {
  const code = fs.readFileSync(SOURCE_PATH, "utf8");
  const sandbox = {
    window: {},
    console: { warn: function () {}, log: function () {}, error: function () {} }
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "temario.js", timeout: 30000 });
  if (!sandbox.window.STUDY_CONTENT) throw new Error("temario.js no expone STUDY_CONTENT.");
  const canonical = clone(sandbox.window.STUDY_CONTENT);

  vm.runInContext(fs.readFileSync(TAXONOMY_PATH, "utf8"), sandbox, {
    filename: "taxonomy.js",
    timeout: 30000
  });
  const applied = sandbox.window.STUDY_CONTENT;
  return { canonical, applied, code };
}

function validateSource(canonical, applied, errors) {
  if (!Array.isArray(canonical.sheets) || canonical.sheets.length !== 210) {
    errors.push("El temario canónico debe tener 210 fichas; hay " + ((canonical.sheets || []).length) + ".");
  }
  if (!Array.isArray(canonical.cards) || canonical.cards.length !== 630) {
    errors.push("El temario canónico debe tener 630 tarjetas; hay " + ((canonical.cards || []).length) + ".");
  }
  if (!Array.isArray(canonical.sources) || canonical.sources.length !== 48) {
    errors.push("El temario canónico debe declarar 48 fuentes; hay " + ((canonical.sources || []).length) + ".");
  }
  if (!applied.primaryAreas || applied.primaryAreas.length !== OFFICIAL_AREAS.length) {
    errors.push("StudyTaxonomy.apply no produjo las cinco áreas oficiales.");
    return;
  }
  const ids = applied.primaryAreas.map((area) => area.id);
  if (!sameJson(ids, OFFICIAL_AREAS)) {
    errors.push("Las áreas oficiales no coinciden: " + ids.join(", "));
  }
  const primary = {};
  applied.primaryAreas.forEach((area) => { primary[area.id] = true; });
  (applied.sheets || []).forEach((sheet) => {
    if (!primary[sheet.primaryAreaId]) {
      errors.push("Ficha sin primaryAreaId oficial: " + sheet.id + " (" + sheet.primaryAreaId + ").");
    }
  });
}

function buildOutputs(canonical, applied) {
  const core = {
    version: canonical.version,
    meta: canonical.meta,
    sources: canonical.sources,
    areas: canonical.areas,
    topics: canonical.topics,
    sheets: canonical.sheets.map(stripSections),
    cards: canonical.cards
  };

  const appliedById = {};
  (applied.sheets || []).forEach((sheet) => { appliedById[sheet.id] = sheet; });
  const canonicalById = {};
  (canonical.sheets || []).forEach((sheet) => { canonicalById[sheet.id] = sheet; });

  const areas = applied.primaryAreas.map((area) => {
    const sheets = canonical.sheets.filter((sheet) => appliedById[sheet.id].primaryAreaId === area.id);
    const map = {};
    sheets.forEach((sheet) => { map[sheet.id] = sheet.sections; });
    return { area: area, sheets: sheets, map: map };
  });

  const coreSource = "/* © 2026 ZARCONT — temario-core generado; no editar a mano. */\n" +
    jsonScript("STUDY_CONTENT", core);
  const chunks = areas.map((entry) => {
    const source = "/* © 2026 ZARCONT — secciones de " + entry.area.id + " generadas; no editar a mano. */\n" +
      "window.STUDY_SECTIONS = window.STUDY_SECTIONS || {};\n" +
      "window.STUDY_SECTIONS[" + JSON.stringify(entry.area.id) + "] = " + JSON.stringify(entry.map) + ";\n";
    return { area: entry.area, sheets: entry.sheets, map: entry.map, source: source };
  });

  return { core: core, coreSource: coreSource, areas: areas, chunks: chunks };
}

function validateOutputs(canonical, applied, built, errors) {
  const canonicalById = {};
  const appliedById = {};
  (canonical.sheets || []).forEach((sheet) => { canonicalById[sheet.id] = sheet; });
  (applied.sheets || []).forEach((sheet) => { appliedById[sheet.id] = sheet; });

  if (built.core.sheets.length !== canonical.sheets.length) {
    errors.push("core no conserva todas las fichas.");
  }
  if (built.core.cards.length !== canonical.cards.length) {
    errors.push("core no conserva todas las tarjetas.");
  }
  built.core.sheets.forEach((sheet) => {
    if (Object.prototype.hasOwnProperty.call(sheet, "sections")) {
      errors.push("core conserva sections en " + sheet.id + ".");
    }
    const original = canonicalById[sheet.id];
    if (!original) { errors.push("core inventa la ficha " + sheet.id + "."); return; }
    if (!sameJson(sheet, stripSections(original))) {
      errors.push("core altera metadatos de " + sheet.id + ".");
    }
  });
  if (!sameJson(built.core.cards, canonical.cards)) errors.push("core altera las tarjetas.");

  const seen = {};
  const seenSections = {};
  let chunkSheets = 0;
  let chunkSections = 0;
  built.areas.forEach((entry) => {
    entry.sheets.forEach((sheet) => {
      if (seen[sheet.id]) errors.push("ficha duplicada en chunks: " + sheet.id + ".");
      seen[sheet.id] = true;
      chunkSheets += 1;
      if (!sameJson(entry.map[sheet.id], sheet.sections)) {
        errors.push("chunk altera secciones de " + sheet.id + ".");
      }
      (sheet.sections || []).forEach((section) => {
        const key = sheet.id + "|" + JSON.stringify(section);
        if (seenSections[key]) errors.push("sección duplicada en " + sheet.id + ".");
        seenSections[key] = true;
      });
      chunkSections += (sheet.sections || []).length;
    });
  });
  canonical.sheets.forEach((sheet) => {
    if (!seen[sheet.id]) errors.push("ficha ausente en chunks: " + sheet.id + ".");
  });
  const canonicalSections = sectionCount(canonical.sheets);
  if (chunkSheets !== canonical.sheets.length) errors.push("chunks cubren " + chunkSheets + " fichas, no 210.");
  if (chunkSections !== canonicalSections) errors.push("chunks tienen " + chunkSections + " secciones, no " + canonicalSections + ".");
  if (canonicalSections !== 1392) errors.push("El temario canónico debe tener 1392 secciones; hay " + canonicalSections + ".");
  if (Object.keys(seen).length !== 210) errors.push("cobertura de fichas: " + Object.keys(seen).length + "/210.");
  if (built.areas.length !== OFFICIAL_AREAS.length) errors.push("no hay cinco chunks.");
}

function buildMeta(canonical, applied, built, sourceInfo) {
  const coreText = built.coreSource;
  const coreInfo = {
    file: "temario-core.js",
    bytes: byteLength(coreText),
    sha256: sha256(coreText),
    sheets: built.core.sheets.length,
    cards: built.core.cards.length,
    sources: built.core.sources.length,
    areas: built.core.areas.length,
    topics: built.core.topics.length
  };
  const areas = built.chunks.map((entry) => ({
    id: entry.area.id,
    title: entry.area.title,
    file: "sections/" + entry.area.id + ".js",
    sheets: entry.sheets.length,
    sections: sectionCount(entry.sheets),
    bytes: byteLength(entry.source),
    sha256: sha256(entry.source)
  }));
  const totalSections = areas.reduce((sum, area) => sum + area.sections, 0);
  const totalSheets = areas.reduce((sum, area) => sum + area.sheets, 0);
  const sectionsBytes = areas.reduce((sum, area) => sum + area.bytes, 0);
  return {
    format: "serums-content-split",
    version: FORMAT_VERSION,
    contentVersion: canonical.version || "",
    generatedAt: sourceInfo.modifiedAt,
    source: sourceInfo,
    core: coreInfo,
    areas: areas,
    coverage: {
      primaryAreas: areas.length,
      officialAreaIds: areas.map((area) => area.id),
      sheets: canonical.sheets.length,
      sheetsInChunks: totalSheets,
      sections: sectionCount(canonical.sheets),
      sectionsInChunks: totalSections,
      cards: canonical.cards.length,
      sources: canonical.sources.length,
      topics: canonical.topics.length,
      areas: canonical.areas.length,
      missingSheets: canonical.sheets.length - totalSheets,
      duplicateSheets: 0,
      missingSections: sectionCount(canonical.sheets) - totalSections,
      extraSections: 0,
      allSheetsHaveSections: canonical.sheets.every((sheet) => Array.isArray(sheet.sections))
    },
    totals: {
      coreBytes: coreInfo.bytes,
      sectionsBytes: sectionsBytes,
      contentBytes: coreInfo.bytes + sectionsBytes,
      files: 1 + areas.length
    }
  };
}

function main() {
  const errors = [];
  const { canonical, applied, code } = loadSource();
  const stat = fs.statSync(SOURCE_PATH);
  const sourceInfo = {
    path: "study-data/temario.js",
    bytes: byteLength(code),
    sha256: sha256(code),
    modifiedAt: new Date(stat.mtimeMs).toISOString()
  };
  validateSource(canonical, applied, errors);
  const built = buildOutputs(canonical, applied);
  validateOutputs(canonical, applied, built, errors);
  const meta = buildMeta(canonical, applied, built, sourceInfo);
  const metaText = JSON.stringify(meta, null, 2) + "\n";

  if (errors.length) {
    process.stderr.write("Validación fallida (" + errors.length + " errores):\n  - " + errors.slice(0, 60).join("\n  - ") + "\n");
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(SECTIONS_DIR, { recursive: true });
  fs.writeFileSync(CORE_PATH, built.coreSource, "utf8");
  built.chunks.forEach((entry) => {
    fs.writeFileSync(path.join(SECTIONS_DIR, entry.area.id + ".js"), entry.source, "utf8");
  });
  fs.writeFileSync(META_PATH, metaText, "utf8");

  process.stdout.write(
    "Contenido dividido generado:\n" +
    "  temario-core.js          " + String(meta.core.bytes).padStart(9) + " B · " + meta.core.sheets + " fichas · " + meta.core.cards + " tarjetas\n" +
    meta.areas.map((area) => "  " + area.file.padEnd(42) + String(area.bytes).padStart(9) + " B · " + area.sheets + " fichas · " + area.sections + " secciones").join("\n") + "\n" +
    "  content-split.json       " + String(byteLength(metaText)).padStart(9) + " B\n" +
    "  TOTAL core+secciones     " + String(meta.totals.contentBytes).padStart(9) + " B\n"
  );
}

try {
  main();
} catch (error) {
  process.stderr.write("ERROR: " + (error && error.stack ? error.stack : error) + "\n");
  process.exitCode = 1;
}
