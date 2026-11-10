#!/usr/bin/env node
/* © 2026 ZARCONT — Estudio derivado bajo demanda
   Genera study-data/derived/ desde study-data/temario.js sin dependencias y sin
   evaluar el archivo como código de confianza: se ejecuta en un sandbox `vm`
   con un `window` vacío. La salida es determinista para una misma fuente.

   Uso: node tools/build-derived.js
   Falla con código 1 si la validación estructural no cuadra. */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_PATH = path.join(ROOT, "study-data", "temario.js");
const OUT_DIR = path.join(ROOT, "study-data", "derived");
const FORMAT_VERSION = 1;

const STOPWORDS = new Set([
  "porque", "cuando", "donde", "desde", "hasta", "entre", "sobre", "despues", "antes",
  "durante", "traves", "segun", "tambien", "puede", "pueden", "deben", "debe", "hacer",
  "tiene", "tienen", "ser", "estar", "como", "para", "toda", "todo", "todos", "todas",
  "cada", "otra", "otras", "otro", "otros", "esta", "este", "estas", "estos", "mismo",
  "misma", "partir", "caso", "casos", "forma", "manera", "nivel", "niveles", "salud",
  "persona", "personas", "atencion", "servicio", "servicios", "sistema", "sistemas",
  "primer", "segundo", "tercer", "cuidado", "cuidados", "medida", "medidas", "riesgo",
  "riesgos", "enfermedad", "enfermedades", "clinica", "clinico", "paciente", "pacientes",
  "concepto", "conceptos", "tema", "temas", "sostienen", "puntos", "clave", "claves",
  "errores", "frecuentes", "notas", "transicion", "esquema", "resumen", "practica",
  "aplicacion", "ejemplo", "ejemplos", "definicion", "definiciones", "introduccion",
  "marco", "general", "otros", "otras", "fundamentos", "criterios", "elementos",
  "componentes", "caracteristicas", "aspectos", "principios", "funciones", "acciones",
  "proceso", "procesos", "conjunto", "instrumento", "instrumentos", "herramienta",
  "herramientas", "resultado", "resultados", "problema", "problemas", "situacion",
  "situaciones", "informacion", "datos", "analisis", "control", "manejo", "prevencion",
  "promocion", "atencion", "integral", "integrada", "basico", "basica", "general",
  "especifico", "especifica", "importante", "principales", "diferentes", "distintos"
]);

const GENERIC_TERMS = new Set([
  "esto", "eso", "esto es", "la clave", "el objetivo", "la norma", "el plan", "el trabajo",
  "la familia", "la red", "el programa", "la guia", "el reglamento", "el manual",
  "el documento", "la tabla", "la ficha", "el caso", "la persona", "las personas",
  "el equipo", "el servicio", "los servicios", "el sistema", "la salud", "la atencion",
  "el cuidado", "los cuidados", "el proceso", "el conjunto", "la herramienta",
  "el instrumento", "la medida", "el resultado", "el riesgo", "la estrategia",
  "objetivo", "diagnostico", "calidad", "norma", "plan", "programa", "proyecto",
  "actividad", "accion", "funcion", "elemento", "componente", "criterio", "principio"
]);

function normalizeText(value) {
  return String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function collapse(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}
function fragment(value, max) {
  const limit = max || 180;
  const text = collapse(value);
  if (text.length <= limit) return text;
  let cut = text.slice(0, limit);
  const space = cut.lastIndexOf(" ");
  if (space > limit * 0.55) cut = cut.slice(0, space);
  return cut.trim() + "…";
}
function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}
function byteLength(text) {
  return Buffer.byteLength(text, "utf8");
}
function json(value, compact) {
  return (compact ? JSON.stringify(value) : JSON.stringify(value, null, 2)) + "\n";
}
function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function sentences(text) {
  return String(text || "")
    .match(/[^.!?]+[.!?]?/g)
    .map((s) => s.trim())
    .filter(Boolean);
}
function firstSentence(text) {
  const list = sentences(text);
  return list.length ? list[0] : collapse(text);
}
function cleanDefinition(value) {
  let text = collapse(value).replace(/^[,;:.\s]+/, "").trim();
  if (!text) return "";
  if (!/[.!?]$/.test(text)) text += ".";
  return text;
}
function cleanTerm(value) {
  let term = collapse(value)
    .replace(/^[\s¿?¡!"“”'«»]+|[\s¿?¡!"“”'«»]+$/g, "")
    .replace(/^(el|la|los|las|un|una)\s+/i, "")
    .trim();
  if (term.length < 2 || term.length > 70) return "";
  if (GENERIC_TERMS.has(normalizeText(term))) return "";
  if (/\bno\b/i.test(term) || /\bno$/i.test(term)) return "";
  if (term.split(/\s+/).length > 8) return "";
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(term)) return "";
  if (/^(esto|eso|esto es|estos|estas)$/i.test(term)) return "";
  return term;
}
function termFromTitle(title) {
  const clean = collapse(title).replace(/[“”"]/g, "");
  const match = clean.match(/^(?:qué|que)\s+(?:es|significa)\s+(?:el|la|los|las|un|una)?\s*(.+)$/i);
  if (match) {
    const candidate = match[1].replace(/\s+(?:y\s+.*)$/i, "").trim();
    return cleanTerm(candidate);
  }
  return "";
}
function wordsOf(text) {
  return normalizeText(text).split(" ").filter((word) => word && word.length >= 6 && !STOPWORDS.has(word) && !/^\d+$/.test(word));
}

/* ------------------------------------------------------------------ */
/* Carga del temario en sandbox                                        */
/* ------------------------------------------------------------------ */

function loadSource() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error("No existe " + path.relative(ROOT, SOURCE_PATH));
  }
  const code = fs.readFileSync(SOURCE_PATH, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "temario.js", timeout: 30000 });
  const content = sandbox.window.STUDY_CONTENT;
  if (!isObject(content)) throw new Error("temario.js no expone STUDY_CONTENT.");
  if (!Array.isArray(content.sheets) || !Array.isArray(content.cards)) {
    throw new Error("STUDY_CONTENT no tiene sheets/cards válidos.");
  }
  if (!Array.isArray(content.topics) || !Array.isArray(content.areas) || !Array.isArray(content.sources)) {
    throw new Error("STUDY_CONTENT no tiene topics/areas/sources válidos.");
  }
  return { content, code };
}

/* ------------------------------------------------------------------ */
/* Índice de búsqueda                                                  */
/* ------------------------------------------------------------------ */

function buildSearch(content, generatedAt) {
  const entries = [];
  const counts = { m: 0, y: 0, s: 0, p: 0, b: 0, t: 0, w: 0, c: 0 };
  let empty = 0;

  function push(kind, sheet, sectionIndex, paragraphIndex, text, display) {
    const normalized = normalizeText(text);
    if (!normalized) { empty += 1; return; }
    counts[kind] = (counts[kind] || 0) + 1;
    /* El fragmento con acentos es necesario para mostrar el resultado, pero
       duplicarlo en entradas cortas engordaría el índice innecesariamente.
       Títulos y entradas largas lo conservan; el resto usa `t` al pintar. */
    const original = collapse(display || text);
    const keepFragment = kind === "m" || kind === "s" || original.length > 140;
    entries.push({
      k: kind,
      sid: sheet.id,
      s: sectionIndex,
      p: paragraphIndex,
      t: normalized,
      f: keepFragment ? fragment(original, 170) : ""
    });
  }

  content.sheets.forEach((sheet) => {
    push("m", sheet, -1, -1, sheet.title, sheet.title);
    if (sheet.summary) push("y", sheet, -1, -1, sheet.summary, sheet.summary);
    (sheet.keyConcepts || []).forEach((concept, index) => {
      if (concept) push("c", sheet, -1, index, concept, concept);
    });
    (sheet.sections || []).forEach((section, sectionIndex) => {
      push("s", sheet, sectionIndex, -1, section.title, section.title);
      (section.body || []).forEach((paragraph, paragraphIndex) => {
        push("p", sheet, sectionIndex, paragraphIndex, paragraph, paragraph);
      });
      (section.bullets || []).forEach((bullet, bulletIndex) => {
        push("b", sheet, sectionIndex, bulletIndex, bullet, bullet);
      });
      if (section.table && Array.isArray(section.table.rows)) {
        const headers = (section.table.headers || []).join(" ");
        section.table.rows.forEach((row, rowIndex) => {
          const cells = (row || []).join(" · ");
          push("t", sheet, sectionIndex, rowIndex, headers + " " + cells, cells);
        });
      }
      if (section.callout) {
        const callout = section.callout;
        push("w", sheet, sectionIndex, 0, (callout.title || "") + " " + (callout.text || ""),
          (callout.title ? callout.title + ": " : "") + (callout.text || ""));
      }
    });
  });

  return {
    file: {
      format: "serums-study-search",
      version: FORMAT_VERSION,
      contentVersion: content.version || "",
      generatedAt,
      normalized: "NFD sin diacríticos, minúsculas, solo a-z0-9",
      fragmentPolicy: "f conserva acentos en títulos y entradas > 140 caracteres; si f está vacío, el consumidor usa t (sin acentos).",
      total: entries.length,
      counts,
      entries
    },
    stats: { total: entries.length, counts, empty }
  };
}

/* ------------------------------------------------------------------ */
/* Glosario                                                            */
/* ------------------------------------------------------------------ */

function isDefinitionTable(headers) {
  const normalized = (headers || []).map(normalizeText).join(" | ");
  return /definicion|definiciones|significado|que designa|que significa|desarrollo|referencia de comparacion/.test(normalized);
}
function isDefinitionSection(title) {
  const n = normalizeText(title);
  return /^(que es|que significa|una definicion|definicion|definiciones)/.test(n) &&
    !/^(definiciones de caso|definiciones operativas)/.test(n);
}
function extractBodyDefinition(paragraph, title) {
  const text = collapse(paragraph);
  const candidates = [];

  const defined = text.match(/\b(?:define|define a|considera|entiende)\s+(?:a\s+)?(?:el|la|los|las)?\s*([^,.;:]{2,70}?)\s+como\s+([\s\S]{15,700})/i);
  if (defined) candidates.push({ term: defined[1], definition: defined[2] });

  const startsEs = text.match(/^([A-ZÁÉÍÓÚÜÑ][^.]{2,70}?)\s+es\s+([\s\S]{20,700})/);
  if (startsEs) candidates.push({ term: startsEs[1], definition: startsEs[2] });

  const verb = text.match(/^([A-ZÁÉÍÓÚÜÑ][^.]{2,70}?)\s+(abarca|se refiere a|consiste en|comprende)\s+([\s\S]{20,700})/i);
  if (verb) candidates.push({ term: verb[1], definition: verb[3] });

  if (/^es\s+/i.test(text)) {
    const titleTerm = termFromTitle(title);
    if (titleTerm) candidates.push({ term: titleTerm, definition: text.replace(/^es\s+/i, "") });
  }

  for (const candidate of candidates) {
    const term = cleanTerm(candidate.term);
    const definition = cleanDefinition(firstSentence(candidate.definition));
    if (!term || definition.length < 35 || definition.length > 700) continue;
    return { term, definition };
  }
  return null;
}
function buildGlossary(content, generatedAt) {
  const entries = [];
  const discarded = { tableRows: 0, tableEmpty: 0, bodyParagraphs: 0, bodyNoPattern: 0, bulletCandidates: 0 };
  const seen = new Set();
  let corrected = 0;

  function add(sheet, sectionIndex, sectionTitle, paragraphIndex, term, definition, source, extra) {
    const clean = cleanTerm(term);
    const def = cleanDefinition(definition);
    if (!clean || !def || def.length < 10) return false;
    const key = sheet.id + "|" + normalizeText(clean) + "|" + normalizeText(def).slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    entries.push(Object.assign({
      id: "gloss-" + (entries.length + 1),
      term: clean,
      definition: def,
      sheetId: sheet.id,
      sectionIndex,
      sectionTitle,
      paragraphIndex,
      source
    }, extra || {}));
    return true;
  }

  content.sheets.forEach((sheet) => {
    (sheet.sections || []).forEach((section, sectionIndex) => {
      if (section.table && Array.isArray(section.table.rows) && isDefinitionTable(section.table.headers)) {
        section.table.rows.forEach((row) => {
          discarded.tableRows += 1;
          if (!Array.isArray(row) || !row[0] || !row[1]) { discarded.tableEmpty += 1; return; }
          if (!add(sheet, sectionIndex, section.title, -1, row[0], row[1], "table", {
            tableHeaders: section.table.headers,
            notes: row.slice(2).filter(Boolean)
          })) corrected += 1;
        });
      }
      if (!isDefinitionSection(section.title)) return;
      (section.body || []).forEach((paragraph, paragraphIndex) => {
        discarded.bodyParagraphs += 1;
        const found = extractBodyDefinition(paragraph, section.title);
        if (!found) { discarded.bodyNoPattern += 1; return; }
        if (!add(sheet, sectionIndex, section.title, paragraphIndex, found.term, found.definition, "paragraph")) {
          corrected += 1;
        }
      });
      (section.bullets || []).forEach((bullet) => {
        const match = String(bullet || "").match(/^([A-ZÁÉÍÓÚÜÑ][^:]{2,60}):\s+([\s\S]{25,500})$/);
        if (match && !/^fuente$/i.test(match[1]) && !/^distincion$/i.test(normalizeText(match[1])) && !/^abreviaturas$/i.test(normalizeText(match[1]))) {
          discarded.bulletCandidates += 1;
        }
      });
    });
  });

  return {
    file: {
      format: "serums-study-glossary",
      version: FORMAT_VERSION,
      contentVersion: content.version || "",
      generatedAt,
      total: entries.length,
      entries
    },
    stats: {
      total: entries.length,
      corrected,
      includedBySource: {
        table: entries.filter((entry) => entry.source === "table").length,
        paragraph: entries.filter((entry) => entry.source === "paragraph").length
      },
      discarded
    }
  };
}

/* ------------------------------------------------------------------ */
/* Datos para memorizar                                                */
/* ------------------------------------------------------------------ */

function buildFacts(content, generatedAt) {
  const entries = [];
  const discarded = { tableRows: 0, nonNumeric: 0, incomplete: 0, calloutNumeric: 0 };
  let truncated = 0;

  content.sheets.forEach((sheet) => {
    (sheet.sections || []).forEach((section, sectionIndex) => {
      if (!section.table || !Array.isArray(section.table.rows)) return;
      const headers = section.table.headers || [];
      section.table.rows.forEach((row, rowIndex) => {
        discarded.tableRows += 1;
        if (!Array.isArray(row) || !row.length) { discarded.incomplete += 1; return; }
        const joined = row.join(" ");
        if (!/\d/.test(joined)) { discarded.nonNumeric += 1; return; }
        const term = collapse(row[0]);
        const detail = row.slice(1).join(" · ");
        if (!term || !detail) { discarded.incomplete += 1; return; }
        if (term.length > 180 || detail.length > 700) { truncated += 1; }
        entries.push({
          id: "fact-" + (entries.length + 1),
          sheetId: sheet.id,
          sectionIndex,
          sectionTitle: section.title,
          rowIndex,
          term,
          detail: detail.slice(0, 700),
          headers
        });
      });
    });
  });

  return {
    file: {
      format: "serums-study-facts",
      version: FORMAT_VERSION,
      contentVersion: content.version || "",
      generatedAt,
      total: entries.length,
      entries
    },
    stats: { total: entries.length, discarded, truncated }
  };
}

/* ------------------------------------------------------------------ */
/* Avisos                                                              */
/* ------------------------------------------------------------------ */

const STRONG_WARNING = /\bno se debe\b|\bnunca\b|\bcontraindicad|\bno administrar\b|\bno indicar\b|\bno usar\b/;
const CAUTION_TITLE = /(no confundir|ojo|cuidado|evitar|error|alerta|precaucion|no se debe|limitacion|distincion)/i;

function buildWarnings(content, generatedAt) {
  const entries = [];
  const discarded = { callouts: 0, infoCallouts: 0, bullets: 0, paragraphSentences: 0, weakSentences: 0 };
  const seen = new Set();

  function add(sheet, sectionIndex, sectionTitle, title, text, tone, severity, source) {
    const body = collapse(text);
    if (!body) return false;
    const key = sheet.id + "|" + normalizeText(body);
    if (seen.has(key)) return false;
    seen.add(key);
    entries.push({
      id: "warn-" + (entries.length + 1),
      sheetId: sheet.id,
      sectionIndex,
      sectionTitle,
      title: collapse(title || "Precaución"),
      text: body,
      tone: tone || "warn",
      severity: severity || "warning",
      source
    });
    return true;
  }

  content.sheets.forEach((sheet) => {
    (sheet.sections || []).forEach((section, sectionIndex) => {
      const callout = section.callout;
      if (callout) {
        discarded.callouts += 1;
        const tone = normalizeText(callout.tone);
        if (tone === "warn" || tone === "warning") {
          add(sheet, sectionIndex, section.title, callout.title, callout.text, "warn", "warning", "callout");
        } else if (isObject(callout) && CAUTION_TITLE.test(callout.title || "")) {
          add(sheet, sectionIndex, section.title, callout.title, callout.text, callout.tone || "info", "caution", "callout");
        } else {
          discarded.infoCallouts += 1;
        }
      }
      (section.bullets || []).forEach((bullet) => {
        discarded.bullets += 1;
        const match = String(bullet || "").match(/^Distinción:\s*([\s\S]{10,600})$/i);
        if (match) add(sheet, sectionIndex, section.title, "No confundir", match[1], "warn", "caution", "bullet");
      });
      (section.body || []).forEach((paragraph) => {
        sentences(paragraph).forEach((sentence) => {
          if (!STRONG_WARNING.test(normalizeText(sentence))) return;
          discarded.paragraphSentences += 1;
          if (add(sheet, sectionIndex, section.title, "Precaución", sentence, "warn", "caution", "text")) return;
          discarded.weakSentences += 1;
        });
      });
    });
  });

  const includedBySource = {
    callout: entries.filter((entry) => entry.source === "callout").length,
    bullet: entries.filter((entry) => entry.source === "bullet").length,
    text: entries.filter((entry) => entry.source === "text").length
  };
  discarded.bulletsWithoutDistinction = Math.max(0, discarded.bullets - includedBySource.bullet);
  return {
    file: {
      format: "serums-study-warnings",
      version: FORMAT_VERSION,
      contentVersion: content.version || "",
      generatedAt,
      total: entries.length,
      entries
    },
    stats: { total: entries.length, includedBySource, discarded }
  };
}

/* ------------------------------------------------------------------ */
/* Relacionadas                                                        */
/* ------------------------------------------------------------------ */

function sectionTerms(sheet) {
  const map = new Map();
  (sheet.sections || []).forEach((section, index) => {
    wordsOf(section.title).forEach((word) => {
      if (!map.has(word)) map.set(word, index);
    });
  });
  return map;
}
function buildRelated(content, generatedAt) {
  const sheetIndex = new Map();
  content.sheets.forEach((sheet, index) => sheetIndex.set(sheet.id, index));
  const topics = new Map();
  content.sheets.forEach((sheet) => {
    if (!topics.has(sheet.topicId)) topics.set(sheet.topicId, []);
    topics.get(sheet.topicId).push(sheet);
  });

  /* Frecuencia de términos en títulos de sección: los muy repetidos no sirven
     como evidencia de relación. */
  const frequency = new Map();
  content.sheets.forEach((sheet) => {
    (sheet.sections || []).forEach((section) => {
      new Set(wordsOf(section.title)).forEach((word) => frequency.set(word, (frequency.get(word) || 0) + 1));
    });
  });

  const termCache = new Map();
  function termsFor(sheet) {
    if (!termCache.has(sheet.id)) termCache.set(sheet.id, sectionTerms(sheet));
    return termCache.get(sheet.id);
  }

  function relation(a, b) {
    const left = termsFor(a);
    const right = termsFor(b);
    const shared = [];
    left.forEach((leftIndex, term) => {
      if (!right.has(term)) return;
      if ((frequency.get(term) || 0) > 12) return;
      shared.push({ term, leftIndex, rightIndex: right.get(term) });
    });
    shared.sort((x, y) => (y.term.length - x.term.length) || x.term.localeCompare(y.term));
    const picked = shared.slice(0, 4);
    if (!picked.length) return null;
    return {
      sheetId: b.id,
      topicId: b.topicId,
      reason: "shared-section-term",
      sharedTerms: picked.map((item) => item.term),
      evidence: {
        source: { sheetId: a.id, sectionIndex: picked[0].leftIndex, term: picked[0].term },
        target: { sheetId: b.id, sectionIndex: picked[0].rightIndex, term: picked[0].term }
      }
    };
  }

  const entries = [];
  let truncated = 0;
  let sameTopicOnly = 0;
  let sharedCount = 0;
  let sameTopicPairs = 0;
  let crossTopicPairs = 0;
  for (let i = 0; i < content.sheets.length; i += 1) {
    for (let j = i + 1; j < content.sheets.length; j += 1) {
      if (content.sheets[i].topicId === content.sheets[j].topicId) sameTopicPairs += 1;
      else crossTopicPairs += 1;
    }
  }
  content.sheets.forEach((sheet) => {
    const siblings = (topics.get(sheet.topicId) || []).filter((item) => item.id !== sheet.id);
    const related = siblings.map((sibling) => relation(sheet, sibling)).filter(Boolean);
    related.sort((a, b) => a.sheetId.localeCompare(b.sheetId));
    if (related.length > 4) truncated += related.length - 4;
    const limited = related.slice(0, 4);
    limited.forEach((item) => {
      if (item.reason === "shared-section-term") sharedCount += 1;
      else sameTopicOnly += 1;
    });
    entries.push({
      sheetId: sheet.id,
      topicId: sheet.topicId,
      topicTitle: (content.topics.find((topic) => topic.id === sheet.topicId) || {}).title || "",
      related: limited
    });
  });

  return {
    file: {
      format: "serums-study-related",
      version: FORMAT_VERSION,
      contentVersion: content.version || "",
      generatedAt,
      totalSheets: entries.length,
      totalLinks: entries.reduce((sum, item) => sum + item.related.length, 0),
      entries
    },
    stats: {
      totalSheets: entries.length,
      totalLinks: entries.reduce((sum, item) => sum + item.related.length, 0),
      sharedCount,
      sameTopicOnly,
      truncated,
      sameTopicPairs,
      crossTopicPairs,
      discarded: {
        crossTopicPairs,
        sameTopicPairs,
        reason: "Solo se publican relaciones con término compartido en títulos de sección; la pertenencia al mismo tema sin evidencia textual no basta."
      }
    }
  };
}

/* ------------------------------------------------------------------ */
/* Validación                                                          */
/* ------------------------------------------------------------------ */

function validateOutputs(content, payloads) {
  const errors = [];
  const sheetMap = new Map(content.sheets.map((sheet) => [sheet.id, sheet]));
  const search = payloads.search;
  const glossary = payloads.glossary;
  const facts = payloads.facts;
  const warnings = payloads.warnings;
  const related = payloads.related;

  function sheetOf(id) {
    const sheet = sheetMap.get(id);
    if (!sheet) errors.push("Referencia a ficha inexistente: " + id);
    return sheet || null;
  }
  function sectionOf(sheet, index) {
    if (!sheet) return null;
    if (index === -1) return null;
    if (!Number.isInteger(index) || index < 0 || index >= sheet.sections.length) {
      errors.push("Sección fuera de rango en " + sheet.id + ": " + index);
      return null;
    }
    return sheet.sections[index];
  }

  if (!Array.isArray(search.entries) || search.entries.length === 0) errors.push("search.json no tiene entradas.");
  if (search.total !== search.entries.length) errors.push("search.total no coincide con entries.length.");
  search.entries.forEach((entry, index) => {
    if (!["m", "y", "s", "p", "b", "t", "w", "c"].includes(entry.k)) errors.push("search[" + index + "]: tipo desconocido.");
    const sheet = sheetOf(entry.sid);
    if (!sheet) return;
    if (!entry.t) errors.push("search[" + index + "]: texto vacío.");
    if (entry.s === -1) {
      if (entry.k !== "m" && entry.k !== "y" && entry.k !== "c") errors.push("search[" + index + "]: s=-1 no permitido.");
      if (entry.k === "c" && (!Number.isInteger(entry.p) || entry.p < 0 || entry.p >= (sheet.keyConcepts || []).length)) {
        errors.push("search[" + index + "]: concepto fuera de rango.");
      }
      return;
    }
    const section = sectionOf(sheet, entry.s);
    if (!section) return;
    if (entry.k === "s") {
      if (entry.p !== -1) errors.push("search[" + index + "]: título de sección con p distinto de -1.");
    } else if (entry.k === "p") {
      if (!Number.isInteger(entry.p) || entry.p < 0 || entry.p >= (section.body || []).length) errors.push("search[" + index + "]: párrafo fuera de rango.");
    } else if (entry.k === "b") {
      if (!Number.isInteger(entry.p) || entry.p < 0 || entry.p >= (section.bullets || []).length) errors.push("search[" + index + "]: viñeta fuera de rango.");
    } else if (entry.k === "t") {
      if (!section.table || !Number.isInteger(entry.p) || entry.p < 0 || entry.p >= section.table.rows.length) errors.push("search[" + index + "]: fila de tabla fuera de rango.");
    } else if (entry.k === "w") {
      if (!section.callout) errors.push("search[" + index + "]: aviso sin callout real.");
    }
  });

  if (!Array.isArray(glossary.entries)) errors.push("glossary.json no tiene entradas.");
  glossary.entries.forEach((entry) => {
    const sheet = sheetOf(entry.sheetId);
    if (!sheet) return;
    if (!entry.term || !entry.definition) errors.push("glossary[" + entry.id + "]: término o definición vacíos.");
    if (entry.sectionIndex !== -1) {
      const section = sectionOf(sheet, entry.sectionIndex);
      if (section && entry.source === "paragraph" && (!Number.isInteger(entry.paragraphIndex) || entry.paragraphIndex < 0 || entry.paragraphIndex >= (section.body || []).length)) {
        errors.push("glossary[" + entry.id + "]: párrafo fuera de rango.");
      }
      if (section && entry.source === "table" && !section.table) {
        errors.push("glossary[" + entry.id + "]: tabla inexistente.");
      }
    }
  });

  if (!Array.isArray(facts.entries)) errors.push("facts.json no tiene entradas.");
  facts.entries.forEach((entry) => {
    const sheet = sheetOf(entry.sheetId);
    if (!sheet) return;
    const section = sectionOf(sheet, entry.sectionIndex);
    if (section && (!section.table || !Number.isInteger(entry.rowIndex) || entry.rowIndex < 0 || entry.rowIndex >= section.table.rows.length)) {
      errors.push("facts[" + entry.id + "]: fila de tabla inválida.");
    }
  });

  if (!Array.isArray(warnings.entries)) errors.push("warnings.json no tiene entradas.");
  warnings.entries.forEach((entry) => {
    const sheet = sheetOf(entry.sheetId);
    if (!sheet) return;
    sectionOf(sheet, entry.sectionIndex);
    if (!entry.text || !entry.title) errors.push("warnings[" + entry.id + "]: texto o título vacío.");
  });

  if (!Array.isArray(related.entries)) errors.push("related.json no tiene entradas.");
  related.entries.forEach((entry) => {
    const sheet = sheetOf(entry.sheetId);
    if (!sheet) return;
    if (!Array.isArray(entry.related)) errors.push("related[" + entry.sheetId + "]: related no es una lista.");
    entry.related.forEach((link) => {
      if (!sheetMap.has(link.sheetId)) errors.push("related[" + entry.sheetId + "]: relacionada inexistente " + link.sheetId);
      if (link.sheetId === entry.sheetId) errors.push("related[" + entry.sheetId + "]: se relaciona consigo misma.");
      if (link.evidence) {
        sectionOf(sheet, link.evidence.source.sectionIndex);
        const target = sheetMap.get(link.sheetId);
        if (target) sectionOf(target, link.evidence.target.sectionIndex);
      }
    });
  });

  return { ok: errors.length === 0, errors: errors.slice(0, 120) };
}

/* ------------------------------------------------------------------ */
/* Informe y manifiesto                                                */
/* ------------------------------------------------------------------ */

function buildReport(content, sourceInfo, outputs, stats, validation) {
  const discarded = [];
  const glossaryTableDiscarded = Math.max(0, stats.glossary.discarded.tableRows - stats.glossary.includedBySource.table);
  discarded.push({
    kind: "search.empty",
    count: stats.search.empty,
    reason: "Fragmentos sin texto normalizable; no aportan nada a la búsqueda.",
    examples: []
  });
  discarded.push({
    kind: "glossary.tableRows",
    count: glossaryTableDiscarded,
    reason: "Filas de tablas definicionales sin término/definición utilizables o descartadas por baja confianza.",
    examples: []
  });
  discarded.push({
    kind: "glossary.body",
    count: stats.glossary.discarded.bodyNoPattern,
    reason: "Párrafos de secciones definicionales sin un patrón explícito «X es…», «define X como…» o «X abarca…»; no se publican definiciones inferidas.",
    examples: []
  });
  discarded.push({
    kind: "glossary.bullets",
    count: stats.glossary.discarded.bulletCandidates,
    reason: "Viñetas con dos puntos que no son definiciones (distinciones, abreviaturas o fuentes).",
    examples: []
  });
  discarded.push({
    kind: "facts.tableRows",
    count: stats.facts.discarded.nonNumeric,
    reason: "Filas de tabla sin ningún dato numérico; no son «datos para memorizar».",
    examples: []
  });
  discarded.push({
    kind: "facts.incomplete",
    count: stats.facts.discarded.incomplete,
    reason: "Filas numéricas sin término o detalle suficiente para citarse con contexto.",
    examples: []
  });
  discarded.push({
    kind: "warnings.callouts",
    count: stats.warnings.discarded.infoCallouts,
    reason: "Avisos informativos sin tono de advertencia ni título de precaución; se dejan fuera para no convertir ideas generales en alarmas.",
    examples: []
  });
  discarded.push({
    kind: "warnings.bullets",
    count: stats.warnings.discarded.bulletsWithoutDistinction,
    reason: "Viñetas que no empiezan por «Distinción:»; no se interpretan como avisos.",
    examples: []
  });
  discarded.push({
    kind: "related.sameTopic",
    count: stats.related.discarded.sameTopicPairs,
    reason: "Parejas del mismo tema sin ningún término compartido en títulos de sección; no hay evidencia textual para publicarlas.",
    examples: []
  });
  discarded.push({
    kind: "related.crossTopic",
    count: stats.related.discarded.crossTopicPairs,
    reason: stats.related.discarded.reason,
    examples: []
  });

  return {
    format: "serums-derived-report",
    version: FORMAT_VERSION,
    contentVersion: content.version || "",
    generatedAt: sourceInfo.modifiedAt,
    source: sourceInfo,
    included: {
      search: { entries: stats.search.total, kinds: stats.search.counts },
      glossary: { entries: stats.glossary.total, bySource: stats.glossary.includedBySource, corrected: stats.glossary.corrected },
      facts: { entries: stats.facts.total, truncated: stats.facts.truncated },
      warnings: { entries: stats.warnings.total, bySource: stats.warnings.includedBySource },
      related: { sheets: stats.related.totalSheets, links: stats.related.totalLinks, shared: stats.related.sharedCount, sameTopic: stats.related.sameTopicOnly, truncated: stats.related.truncated }
    },
    discarded,
    outputs: outputs.map((item) => ({ name: item.name, bytes: item.bytes, sha256: item.sha256 })),
    validation,
    notes: [
      "El contenido clínico no se amplía, corrige ni interpreta: cada entrada apunta a una ficha, sección y párrafo/fila reales.",
      "search.json normaliza mayúsculas y diacríticos (NFD); f conserva acentos en títulos y entradas largas, y si está vacío el consumidor usa t.",
      "Los derivados se cargan solo bajo demanda; no se descargan al arrancar la aplicación.",
      "La fecha generatedAt procede de la mtime de temario.js para que dos ejecuciones sobre la misma fuente produzcan los mismos bytes."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Ejecución                                                           */
/* ------------------------------------------------------------------ */

function main() {
  const { content, code } = loadSource();
  const stat = fs.statSync(SOURCE_PATH);
  const sourceInfo = {
    path: path.relative(ROOT, SOURCE_PATH).replace(/\\/g, "/"),
    bytes: Buffer.byteLength(code, "utf8"),
    sha256: sha256(code),
    modifiedAt: new Date(stat.mtimeMs).toISOString()
  };
  const generatedAt = sourceInfo.modifiedAt;

  const search = buildSearch(content, generatedAt);
  const glossary = buildGlossary(content, generatedAt);
  const facts = buildFacts(content, generatedAt);
  const warnings = buildWarnings(content, generatedAt);
  const related = buildRelated(content, generatedAt);

  const payloads = {
    search: search.file,
    glossary: glossary.file,
    facts: facts.file,
    warnings: warnings.file,
    related: related.file
  };
  const validation = validateOutputs(content, payloads);

  const strings = {};
  const outputInfo = [];
  Object.keys(payloads).forEach((key) => {
    strings[key] = json(payloads[key], key === "search");
    outputInfo.push({
      name: key + ".json",
      bytes: byteLength(strings[key]),
      sha256: sha256(strings[key]),
      entries: payloads[key].total
    });
  });

  const stats = {
    search: search.stats,
    glossary: glossary.stats,
    facts: facts.stats,
    warnings: warnings.stats,
    related: related.stats
  };
  const report = buildReport(content, sourceInfo, outputInfo, stats, validation);
  const reportString = json(report);
  const reportInfo = {
    name: "report.json",
    bytes: byteLength(reportString),
    sha256: sha256(reportString),
    entries: 0
  };
  const manifest = {
    format: "serums-derived-manifest",
    version: FORMAT_VERSION,
    contentVersion: content.version || "",
    generatedAt,
    source: sourceInfo,
    normalized: "NFD sin diacríticos; español",
    fragmentPolicy: "search.f vacío significa que el fragmento se toma de search.t (sin acentos).",
    files: outputInfo.concat([reportInfo]),
    counts: {
      sheets: content.sheets.length,
      sections: content.sheets.reduce((sum, sheet) => sum + (sheet.sections || []).length, 0),
      paragraphs: content.sheets.reduce((sum, sheet) => sum + (sheet.sections || []).reduce((n, section) => n + (section.body || []).length, 0), 0),
      bullets: content.sheets.reduce((sum, sheet) => sum + (sheet.sections || []).reduce((n, section) => n + (section.bullets || []).length, 0), 0),
      tables: content.sheets.reduce((sum, sheet) => sum + (sheet.sections || []).filter((section) => section.table).length, 0),
      tableRows: content.sheets.reduce((sum, sheet) => sum + (sheet.sections || []).reduce((n, section) => n + (section.table ? section.table.rows.length : 0), 0), 0),
      callouts: content.sheets.reduce((sum, sheet) => sum + (sheet.sections || []).filter((section) => section.callout).length, 0),
      searchEntries: search.stats.total,
      glossaryEntries: glossary.stats.total,
      factsEntries: facts.stats.total,
      warningsEntries: warnings.stats.total,
      relatedLinks: related.stats.totalLinks
    },
    searchKinds: search.stats.counts,
    totalBytes: outputInfo.concat([reportInfo]).reduce((sum, item) => sum + item.bytes, 0)
  };
  const manifestString = json(manifest);

  if (!validation.ok) {
    const message = "Validación fallida (" + validation.errors.length + " errores):\n  - " + validation.errors.join("\n  - ");
    process.stderr.write(message + "\n");
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  Object.keys(strings).forEach((key) => {
    fs.writeFileSync(path.join(OUT_DIR, key + ".json"), strings[key], "utf8");
  });
  fs.writeFileSync(path.join(OUT_DIR, "report.json"), reportString, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), manifestString, "utf8");

  const total = byteLength(manifestString) + manifest.totalBytes;
  process.stdout.write(
    "Derivados generados en study-data/derived/\n" +
    "  search.json      " + String(outputInfo[0].bytes).padStart(9) + " B · " + search.stats.total + " entradas\n" +
    "  glossary.json    " + String(outputInfo[1].bytes).padStart(9) + " B · " + glossary.stats.total + " entradas\n" +
    "  facts.json       " + String(outputInfo[2].bytes).padStart(9) + " B · " + facts.stats.total + " entradas\n" +
    "  warnings.json    " + String(outputInfo[3].bytes).padStart(9) + " B · " + warnings.stats.total + " entradas\n" +
    "  related.json     " + String(outputInfo[4].bytes).padStart(9) + " B · " + related.stats.totalLinks + " vínculos\n" +
    "  report.json      " + String(reportInfo.bytes).padStart(9) + " B\n" +
    "  manifest.json    " + String(byteLength(manifestString)).padStart(9) + " B\n" +
    "  TOTAL            " + String(total).padStart(9) + " B\n"
  );
}

try {
  main();
} catch (error) {
  process.stderr.write("ERROR: " + (error && error.stack ? error.stack : error) + "\n");
  process.exitCode = 1;
}
