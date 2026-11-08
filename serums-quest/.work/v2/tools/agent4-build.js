/* Agent 4 - constructor del banco pedagógico V2.
   Genera:
     serums-quest/.work/v2/questions-v2.json
     serums-quest/.work/v2/tools/agent4-build-stats.json   (estadísticas internas)
   No modifica ningún archivo fuera de los permitidos. */
"use strict";

const fs = require("fs");
const path = require("path");
const {
  ROOT,
  loadContent,
  loadCampaign,
  normalizeText,
  similarity,
  stripAccents
} = require("./agent4-load.js");

const V2_DIR = path.join(ROOT, "serums-quest/.work/v2");
const OUT_QUESTIONS = path.join(V2_DIR, "questions-v2.json");
const OUT_STATS = path.join(__dirname, "agent4-build-stats.js");

const DATASET_VERSION = "2.5.0";
const OFFICIAL_AREAS = [
  "area-psi-salud-publica",
  "area-psi-cuidado-integral",
  "area-psi-etica",
  "area-psi-investigacion",
  "area-psi-gestion"
];

/* Valores de complexity alineados con el contrato runtime
   (CONTRACTS.md §5: 18 | 25 | 28 | 35 | 38). */
const DIFF_COMPLEXITY = { base: 18, media: 28, alta: 38 };

/* ---------- utilidades deterministas ---------- */

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFrom(seedStr) {
  let s = hash32(seedStr) || 1;
  return function next() {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function shuffleSeeded(arr, seedStr) {
  const out = arr.slice();
  const rnd = rngFrom(seedStr);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const LETTERS = ["A", "B", "C", "D"];

function makeOptions(texts, seedStr) {
  const order = shuffleSeeded(texts.map((t, i) => i), seedStr);
  const options = order.map((srcIdx, pos) => ({ id: LETTERS[pos], text: texts[srcIdx] }));
  const answer = LETTERS[order.indexOf(0)];
  return { options, answer };
}

function firstSentence(text) {
  const m = String(text).match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0].trim() : String(text).trim();
}

/* Texto de opción para respuestas abiertas: se conserva un fragmento exacto
   de la fuente (respuesta completa, primera oración o primer tramo de una
   enumeración con punto y coma). */
function optionFromLongAnswer(answer) {
  const raw = String(answer || "").trim();
  if (raw.length <= 260) return { text: raw, shortened: false };
  const first = firstSentence(raw);
  if (first.length <= 320) return { text: first, shortened: first !== raw };
  const semi = first.lastIndexOf("; ");
  if (semi >= 120) return { text: first.slice(0, semi).trim(), shortened: true };
  return { text: first, shortened: true };
}

/* Familia de la pregunta, para que los distractores de una tarjeta abierta
   tengan la misma forma gramatical que la respuesta correcta. */
function questionKind(prompt) {
  const p = normalizeText(prompt);
  if (/^por que\b|^porque\b/.test(p)) return "porque";
  if (/^que\b/.test(p)) return "que";
  if (/^cual\b|^cuales\b/.test(p)) return "cual";
  if (/^como\b/.test(p)) return "como";
  if (/^explica\b|^describe\b|^menciona\b|^senala\b|^detalla\b/.test(p)) return "explica";
  if (/^en que\b/.test(p)) return "en-que";
  if (/^quien\b/.test(p)) return "quien";
  return "otro";
}

function isDuplicateOptionSet(options) {
  const seen = new Set();
  for (const o of options) {
    const key = normalizeText(o.text);
    if (!key) return true;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function firstPage(sourceRefs) {
  if (!Array.isArray(sourceRefs)) return null;
  for (const ref of sourceRefs) {
    if (ref && Array.isArray(ref.pages) && ref.pages.length) return ref.pages[0];
  }
  return null;
}

function cleanRefs(sourceRefs) {
  if (!Array.isArray(sourceRefs)) return undefined;
  const out = sourceRefs
    .filter((r) => r && r.sourceId)
    .map((r) => ({ sourceId: r.sourceId, pages: Array.isArray(r.pages) ? r.pages.slice() : [] }));
  return out.length ? out : undefined;
}

/* ---------- pregunta de ficha (dashboard) ---------- */

function sheetBlob(sheet) {
  const parts = [sheet.title, sheet.summary || "", sheet.kicker || ""];
  (sheet.keyConcepts || []).forEach((k) => parts.push(k));
  (sheet.sections || []).forEach((sec) => {
    if (sec.title) parts.push(sec.title);
    if (Array.isArray(sec.body)) sec.body.forEach((b) => parts.push(b));
    if (sec.table && Array.isArray(sec.table.rows)) {
      sec.table.rows.forEach((row) => row.forEach((cell) => parts.push(String(cell))));
    }
  });
  return normalizeText(parts.join(" "));
}

function buildDashboardQuestions(content) {
  const sheets = content.sheets;
  const areaSheets = {};
  OFFICIAL_AREAS.forEach((a) => { areaSheets[a] = []; });
  sheets.forEach((s) => {
    if (OFFICIAL_AREAS.includes(s.primaryAreaId)) areaSheets[s.primaryAreaId].push(s);
  });

  const blobs = new Map(sheets.map((s) => [s.id, sheetBlob(s)]));
  const allConceptsByArea = {};
  OFFICIAL_AREAS.forEach((area) => {
    allConceptsByArea[area] = [];
    areaSheets[area].forEach((s) => {
      (s.keyConcepts || []).forEach((kc) => {
        allConceptsByArea[area].push({ sheetId: s.id, text: kc });
      });
    });
  });

  const questions = [];
  const discards = [];
  const categories = content.categoryById || {};
  const matter = new Set(); // conceptos ya usados como correcta

  sheets.forEach((sheet, sheetIndex) => {
    const areaId = sheet.primaryAreaId;
    if (!OFFICIAL_AREAS.includes(areaId)) {
      discards.push({ sheetId: sheet.id, reason: "sin área oficial mapeada" });
      return;
    }
    const kcs = (sheet.keyConcepts || []).filter((k) => String(k).trim().length >= 25);
    if (!kcs.length) {
      discards.push({ sheetId: sheet.id, reason: "ficha sin keyConcepts utilizables" });
      return;
    }
    const others = allConceptsByArea[areaId].filter((o) => o.sheetId !== sheet.id);
    if (others.length < 3) {
      discards.push({ sheetId: sheet.id, reason: "menos de 3 keyConcepts de otras fichas en el área" });
      return;
    }
    const blob = blobs.get(sheet.id);

    /* 1) Elegir la idea clave más distintiva de la ficha: la que menos se
       parece a las ideas clave de las demás fichas del área y que no aparece
       literalmente en otra ficha. */
    let best = null;
    kcs.forEach((kc, i) => {
      let sum = 0;
      let max = 0;
      let appearsElsewhere = 0;
      const nk = normalizeText(kc);
      others.forEach((o) => {
        const sim = similarity(kc, o.text);
        sum += sim;
        if (sim > max) max = sim;
        if (normalizeText(o.text).includes(nk)) appearsElsewhere += 1;
      });
      let score = sum + max * 0.5 + appearsElsewhere * 2;
      const len = kc.length;
      if (len < 50 || len > 230) score += 0.15;
      if (matter.has(nk)) score += 0.25;
      if (!best || score < best.score) best = { kc, score, index: i };
    });

    const correct = best.kc;

    /* 2) Distractores: ideas clave de OTRAS fichas del área que no aparecen en
       el texto de esta ficha y que no repiten el contenido de la correcta ni
       de sus otras ideas clave (si no, habría dos respuestas defendibles). */
    const blocked = new Set();
    const candidates = others
      .map((o) => {
        const sim = similarity(correct, o.text);
        const n = normalizeText(o.text);
        let ownOverlap = 0;
        kcs.forEach((kc) => {
          const s = similarity(o.text, kc);
          if (s > ownOverlap) ownOverlap = s;
        });
        return {
          text: o.text,
          sheetId: o.sheetId,
          sim,
          n,
          ownOverlap,
          inTarget: blob.includes(n),
          ratio: o.text.length / Math.max(1, correct.length)
        };
      })
      .filter((c) => c.n && c.n !== normalizeText(correct))
      .filter((c) => !c.inTarget)
      .filter((c) => c.sim < 0.42)
      .filter((c) => c.ownOverlap <= 0.4)
      .filter((c) => c.ratio >= 0.45 && c.ratio <= 2.2)
      .filter((c) => !blocked.has(c.n))
      .sort((a, b) => Math.abs(a.sim - 0.16) - Math.abs(b.sim - 0.16));

    const picked = [];
    const usedSheets = new Set();
    for (const c of candidates) {
      if (picked.length >= 3) break;
      if (usedSheets.has(c.sheetId)) continue;
      if (picked.some((p) => similarity(p, c.text) > 0.6)) continue;
      picked.push(c.text);
      usedSheets.add(c.sheetId);
      blocked.add(c.n);
    }

    if (picked.length < 3) {
      discards.push({
        sheetId: sheet.id,
        reason: "solo " + picked.length + " distractores defendibles con keyConcepts del área",
        keyConcept: correct
      });
      return;
    }

    const texts = [correct].concat(picked);
    if (isDuplicateOptionSet(texts.map((t) => ({ text: t })))) {
      discards.push({ sheetId: sheet.id, reason: "opciones duplicadas tras el filtrado", keyConcept: correct });
      return;
    }

    const { options, answer } = makeOptions(texts, sheet.id + "-dash");
    const cat = categories[sheet.categoryId] || null;
    const levelMap = { Base: "base", Intermedio: "media", Avanzado: "alta" };
    const difficulty = levelMap[sheet.level] || "media";
    const summary = String(sheet.summary || "").trim();
    const summaryPart = summary.length > 260 ? firstSentence(summary) : summary;

    const explanation =
      "La ficha «" + sheet.title + "» lo resume así: «" + summaryPart + "». " +
      "La idea clave señalada está tomada textualmente de esa ficha; las demás opciones pertenecen a otras fichas del área.";

    const refs = cleanRefs(sheet.sourceRefs);

    questions.push({
      id: "v2-dash-" + sheet.id,
      areaId,
      stem: "Según la ficha «" + sheet.title + "», ¿cuál de estas ideas clave le corresponde?",
      options,
      answer,
      examTitle: "Study Dashboard · fichas " + DATASET_VERSION,
      cycle: "study-" + DATASET_VERSION,
      /* page: no existe página de examen para contenido generado; las páginas
         reales del PDF viajan en sourceRefs. */
      page: null,
      complexity: DIFF_COMPLEXITY[difficulty],
      confidence: "alta",
      source: "dashboard",
      origin: "ficha",
      explanation,
      explanationGenerated: true,
      difficulty,
      tags: ["ficha"].concat(cat ? [cat.short] : []),
      sheetId: sheet.id,
      sourceRefs: refs,
      generated: true,
      _sheetIndex: sheetIndex
    });
    matter.add(normalizeText(correct));
  });

  return { questions, discards };
}

/* ---------- preguntas de tarjetas (flashcards) ---------- */

function buildFlashcardQuestions(content) {
  const sheetById = new Map(content.sheets.map((s) => [s.id, s]));
  const questions = [];
  const discards = [];
  const shortened = [];

  const conceptByArea = {};
  OFFICIAL_AREAS.forEach((a) => { conceptByArea[a] = []; });
  content.cards.forEach((card) => {
    if (card.type !== "concept") return;
    const sheet = sheetById.get(card.sheetId);
    if (!sheet || !OFFICIAL_AREAS.includes(sheet.primaryAreaId)) return;
    conceptByArea[sheet.primaryAreaId].push(card);
  });

  /* multiple y application primero: son preguntas cerradas ya existentes */
  ["multiple", "application"].forEach((type) => {
    content.cards.forEach((card) => {
      if (card.type !== type) return;
      const sheet = sheetById.get(card.sheetId);
      if (!sheet || !OFFICIAL_AREAS.includes(sheet.primaryAreaId)) {
        discards.push({ cardId: card.id, reason: "tarjeta sin ficha/área oficial" });
        return;
      }
      const raw = Array.isArray(card.options) ? card.options.map((o) => String(o).trim()) : [];
      if (raw.length !== 4 || raw.some((t) => !t)) {
        discards.push({ cardId: card.id, reason: "la tarjeta no tiene 4 opciones válidas en la fuente" });
        return;
      }
      if (!Number.isInteger(card.correctIndex) || card.correctIndex < 0 || card.correctIndex > 3) {
        discards.push({ cardId: card.id, reason: "correctIndex inválido en la fuente" });
        return;
      }
      const options = raw.map((text, i) => ({ id: LETTERS[i], text }));
      if (isDuplicateOptionSet(options)) {
        discards.push({ cardId: card.id, reason: "opciones duplicadas en la fuente" });
        return;
      }
      const answer = LETTERS[card.correctIndex];
      const difficulty = type === "application" ? "alta" : "media";
      const tags = Array.from(new Set((card.tags || []).concat(["flashcard", type === "application" ? "aplicación" : "multiple"])));
      questions.push({
        id: "v2-fc-" + card.id,
        areaId: sheet.primaryAreaId,
        stem: String(card.prompt).trim(),
        options,
        answer,
        examTitle: "Study Flashcards · tarjetas " + DATASET_VERSION,
        cycle: "study-" + DATASET_VERSION,
        page: null,
        complexity: DIFF_COMPLEXITY[difficulty],
        confidence: "alta",
        source: "flashcards",
        origin: type === "application" ? "tarjeta-application" : "tarjeta-multiple",
        explanation: String(card.explanation || "").trim(),
        explanationGenerated: false,
        difficulty,
        tags,
        flashcardId: card.id,
        sheetId: card.sheetId,
        sourceRefs: cleanRefs(card.sourceRefs),
        generated: false
      });
    });
  });

  /* concept abiertas -> MCQ con 4 opciones tomadas de otras tarjetas del
     mismo tipo y área */
  content.cards.forEach((card) => {
    if (card.type !== "concept") return;
    const sheet = sheetById.get(card.sheetId);
    if (!sheet || !OFFICIAL_AREAS.includes(sheet.primaryAreaId)) {
      discards.push({ cardId: card.id, reason: "tarjeta sin ficha/área oficial" });
      return;
    }
    const areaId = sheet.primaryAreaId;
    const correctObj = optionFromLongAnswer(card.answer);
    if (correctObj.shortened) shortened.push({ cardId: card.id, from: card.answer.length, to: correctObj.text.length });
    const nCorrect = normalizeText(correctObj.text);
    if (!nCorrect || nCorrect.length < 20) {
      discards.push({ cardId: card.id, reason: "respuesta abierta demasiado corta para ser opción" });
      return;
    }
    const pool = conceptByArea[areaId]
      .filter((c) => c.id !== card.id)
      .map((c) => {
        const o = optionFromLongAnswer(c.answer);
        return {
          text: o.text,
          n: normalizeText(o.text),
          ratio: o.text.length / Math.max(1, correctObj.text.length),
          sim: similarity(correctObj.text, o.text),
          id: c.id,
          sameKind: questionKind(c.prompt) === questionKind(card.prompt) ? 0 : 1
        };
      })
      .filter((c) => c.n && c.n !== nCorrect && c.n.length >= 20)
      .filter((c) => c.ratio >= 0.35 && c.ratio <= 2.8)
      .filter((c) => c.sim < 0.55)
      .sort((a, b) => (a.sameKind - b.sameKind) || (Math.abs(a.sim - 0.12) - Math.abs(b.sim - 0.12)));

    const picked = [];
    const used = new Set();
    for (const c of pool) {
      if (picked.length >= 3) break;
      if (used.has(c.n)) continue;
      if (picked.some((p) => similarity(p, c.text) > 0.62)) continue;
      picked.push(c.text);
      used.add(c.n);
    }
    if (picked.length < 3) {
      discards.push({
        cardId: card.id,
        reason: "solo " + picked.length + " distractores del mismo tipo y área",
        answer: correctObj.text
      });
      return;
    }
    const texts = [correctObj.text].concat(picked);
    if (isDuplicateOptionSet(texts.map((t) => ({ text: t })))) {
      discards.push({ cardId: card.id, reason: "opciones duplicadas tras el filtrado" });
      return;
    }
    const { options, answer } = makeOptions(texts, card.id + "-concept");
    const tags = Array.from(new Set((card.tags || []).concat(["flashcard", "convertida"])));
    questions.push({
      id: "v2-fc-" + card.id,
      areaId,
      stem: String(card.prompt).trim(),
      options,
      answer,
      examTitle: "Study Flashcards · tarjetas " + DATASET_VERSION,
      cycle: "study-" + DATASET_VERSION,
      page: null,
      complexity: DIFF_COMPLEXITY.media,
      confidence: "media",
      source: "flashcards",
      origin: "tarjeta-concepto-convertida",
      explanation: String(card.explanation || "").trim(),
      explanationGenerated: false,
      difficulty: "media",
      tags,
      flashcardId: card.id,
      sheetId: card.sheetId,
      sourceRefs: cleanRefs(card.sourceRefs),
      generated: true
    });
  });

  return { questions, discards, shortened };
}

function dedupe(newQuestions, campaign) {
  const campaignList = Object.keys(campaign.questions).map((id) => ({ id, stem: campaign.questions[id].stem }));
  const campaignNorm = campaignList.map((c) => ({ id: c.id, norm: normalizeText(c.stem) }));

  const kept = [];
  const removed = [];
  const seenNorm = new Map();

  newQuestions.forEach((q) => {
    const norm = normalizeText(q.stem);
    let hit = null;
    // contra campaña
    for (const c of campaignNorm) {
      if (!c.norm) continue;
      if (c.norm === norm) { hit = { against: "campaña", id: c.id, kind: "stem idéntico" }; break; }
      if (similarity(q.stem, c.stem) > 0.9) { hit = { against: "campaña", id: c.id, kind: "similitud > 0.9" }; break; }
    }
    // contra nuevas ya conservadas
    if (!hit) {
      for (const k of kept) {
        if (k.norm === norm) { hit = { against: "nueva", id: k.q.id, kind: "stem idéntico" }; break; }
        if (similarity(q.stem, k.q.stem) > 0.9) { hit = { against: "nueva", id: k.q.id, kind: "similitud > 0.9" }; break; }
      }
    }
    if (hit) {
      removed.push({ id: q.id, source: q.source, duplicateOf: hit.id, against: hit.against, kind: hit.kind });
      return;
    }
    kept.push({ q, norm });
    if (!seenNorm.has(norm)) seenNorm.set(norm, q.id);
  });

  return { kept: kept.map((k) => k.q), removed };
}

/* ---------- principal ---------- */

function main() {
  const content = loadContent();
  const campaign = loadCampaign();

  const dash = buildDashboardQuestions(content);
  const flash = buildFlashcardQuestions(content);

  // Orden de prioridad para deduplicar: cerradas de tarjeta, convertidas, fichas.
  const ordered = flash.questions
    .filter((q) => q.origin === "tarjeta-multiple")
    .concat(flash.questions.filter((q) => q.origin === "tarjeta-application"))
    .concat(flash.questions.filter((q) => q.origin === "tarjeta-concepto-convertida"))
    .concat(dash.questions);

  const ded = dedupe(ordered, campaign);

  // Comprobación final de integridad mínima antes de escribir.
  const final = ded.kept.map((q) => {
    const out = {};
    Object.keys(q).forEach((k) => { if (k !== "_sheetIndex") out[k] = q[k]; });
    return out;
  });

  final.forEach((q) => {
    if (!OFFICIAL_AREAS.includes(q.areaId)) throw new Error("areaId inválido: " + q.id);
    if (q.options.length !== 4) throw new Error("opciones != 4: " + q.id);
    if (!LETTERS.includes(q.answer)) throw new Error("answer inválido: " + q.id);
    if (!q.explanation) throw new Error("sin explicación: " + q.id);
  });

  // Orden estable: por área oficial, luego fuente/orden de origen.
  const areaOrder = new Map(OFFICIAL_AREAS.map((a, i) => [a, i]));
  const sourceOrder = { flashcards: 0, dashboard: 1 };
  const originOrder = {
    "tarjeta-multiple": 0,
    "tarjeta-application": 1,
    "tarjeta-concepto-convertida": 2,
    ficha: 0
  };
  final.sort((a, b) => {
    const aa = areaOrder.get(a.areaId) - areaOrder.get(b.areaId);
    if (aa) return aa;
    const ss = sourceOrder[a.source] - sourceOrder[b.source];
    if (ss) return ss;
    const oo = originOrder[a.origin] - originOrder[b.origin];
    if (oo) return oo;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  fs.mkdirSync(path.dirname(OUT_QUESTIONS), { recursive: true });
  fs.writeFileSync(OUT_QUESTIONS, JSON.stringify(final, null, 2) + "\n", "utf8");

  const countBy = (arr, fn) => arr.reduce((m, x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; return m; }, {});
  const stats = {
    datasetVersion: content.version,
    generatedAt: new Date().toISOString(),
    built: {
      dashboard: dash.questions.length,
      flashcards: flash.questions.length,
      flashcardsByType: countBy(flash.questions, (q) => q.origin),
      total: ordered.length
    },
    discards: {
      dashboard: dash.discards,
      flashcards: flash.discards
    },
    shortenedConceptAnswers: flash.shortened,
    duplicates: ded.removed,
    final: {
      total: final.length,
      byArea: countBy(final, (q) => q.areaId),
      bySource: countBy(final, (q) => q.source),
      byOrigin: countBy(final, (q) => q.origin),
      bySourceAndArea: OFFICIAL_AREAS.reduce((m, a) => {
        m[a] = countBy(final.filter((q) => q.areaId === a), (q) => q.source);
        return m;
      }, {}),
      generated: final.filter((q) => q.generated).length,
      notGenerated: final.filter((q) => !q.generated).length,
      explanationGenerated: final.filter((q) => q.explanationGenerated).length,
      byDifficulty: countBy(final, (q) => q.difficulty),
      byConfidence: countBy(final, (q) => q.confidence),
      avgExplanationLength: Math.round(final.reduce((n, q) => n + q.explanation.length, 0) / final.length)
    },
    sheetsTotal: content.sheets.length,
    cardsTotal: content.cards.length
  };

  fs.writeFileSync(OUT_STATS, "module.exports = " + JSON.stringify(stats, null, 2) + ";\n", "utf8");
  console.log(JSON.stringify({
    written: OUT_QUESTIONS,
    built: stats.built,
    duplicates: stats.duplicates.length,
    dashboardDiscards: dash.discards.length,
    flashcardDiscards: flash.discards.length,
    final: stats.final
  }, null, 2));
}

main();
