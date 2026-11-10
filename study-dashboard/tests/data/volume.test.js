/* © 2026 ZARCONT — Volumen y operaciones de las colecciones v2 (Node, sin dependencias).
   Simula un uso largo (miles de subrayados y recuerdos) sobre el contenido real
   y comprueba listados, filtros, tombstones, exportar/importar y que las cajas
   de Study Flashcards siguen fuera del circuito.
   Comando: node --test study-dashboard/tests/data */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createStorage,
  createStore,
  seedWithState,
  readKey,
  loadRealContent
} = require("./helpers.js");

function plain(value) { return JSON.parse(JSON.stringify(value)); }
function same(actual, expected, message) {
  assert.deepEqual(plain(actual), JSON.parse(JSON.stringify(expected)), message || "estructura");
}

const COLORS = ["important", "understand", "review", "doubt"];
const RATINGS = ["again", "hard", "good", "easy", "skipped"];

function iso(offsetMs) { return new Date(offsetMs).toISOString(); }

function buildVolumeState(content) {
  const now = Date.now();
  const state = {
    version: 2, schemaVersion: 2,
    createdAt: iso(now - 4000 * 86400000), updatedAt: iso(now - 1000), resetAt: null,
    sheets: {}, cards: {}, sessions: [], activity: {}, goals: { dailySheets: 2 },
    history: [], last: {}, flashSession: null,
    annotations: {}, doubts: {}, sheetConfidence: {}, sheetReview: {},
    recall: {}, userCards: {}, plan: null, weekly: {}, factsKnown: {}
  };
  const ids = content.sheets.map((sheet) => sheet.id);
  const sheetsByCycle = [ids[0], ids[1], ids[2], ids[3]];

  /* 1.200 subrayados, 24 tombstones (uno cada 50), 4 colores y 4 fichas. */
  for (let i = 0; i < 1200; i += 1) {
    const id = "ann-vol-" + i;
    const sheetId = sheetsByCycle[i % 4];
    const deleted = i % 50 === 0;
    state.annotations[id] = {
      id, sheetId, sectionIndex: i % 5, sectionTitle: "Sección " + (i % 7),
      paragraphIndex: i % 9, color: COLORS[i % 4],
      quote: "Cita de volumen número " + i + " sobre atención primaria y longitudinalidad.",
      prefix: "pre", suffix: "post", note: i % 3 === 0 ? "Nota " + i : "",
      createdAt: iso(now - (i + 5000) * 1000), updatedAt: iso(now - (i + 1) * 1000), deleted
    };
  }

  /* 3.000 recuerdos, 30 tombstones (uno cada 100). */
  for (let i = 0; i < 3000; i += 1) {
    const id = "recall-vol-" + i;
    state.recall[id] = {
      id, sheetId: i % 10 === 0 ? ids[1] : ids[0],
      cardId: "card-" + (i % 630), sectionIndex: i % 6,
      question: "Pregunta " + i + " de la ficha sobre el primer nivel de contacto.",
      answer: "Respuesta " + i + " con detalle suficiente para simular una tarjeta real.",
      rating: RATINGS[i % 5],
      createdAt: iso(now - (i + 9000) * 1000), updatedAt: iso(now - (i + 2000) * 1000),
      deleted: i % 100 === 0
    };
  }

  /* 300 dudas, 12 tombstones y un tercio resueltas. */
  for (let i = 0; i < 300; i += 1) {
    const id = "doubt-vol-" + i;
    const resolved = i % 3 === 0;
    state.doubts[id] = {
      id, sheetId: sheetsByCycle[i % 4], sectionIndex: i % 4, paragraphIndex: i % 6,
      quote: "Duda " + i + " sobre la ficha.", note: i % 4 === 0 ? "Nota de duda " + i : "",
      annotationId: null, resolvedAt: resolved ? iso(now - (i + 4000) * 1000) : null,
      createdAt: iso(now - (i + 7000) * 1000), updatedAt: iso(now - (i + 3000) * 1000),
      deleted: i % 25 === 0
    };
  }

  /* Confianza en 120 fichas, 12 borradas con tombstone. */
  ids.slice(0, 120).forEach((sheetId, i) => {
    state.sheetConfidence[sheetId] = {
      id: sheetId, sheetId, value: ["solid", "partial", "weak"][i % 3],
      createdAt: iso(now - (i + 8000) * 1000), updatedAt: iso(now - (i + 500) * 1000),
      deleted: i % 10 === 0
    };
  });

  /* Repaso programado en 120 fichas, 6 tombstones; la mitad vencidas. */
  ids.slice(0, 120).forEach((sheetId, i) => {
    state.sheetReview["review-" + sheetId] = {
      id: "review-" + sheetId, sheetId,
      dueAt: iso(now + (i % 2 === 0 ? -1 : 1) * 86400000),
      intervalDays: 1 + (i % 30), lastReviewedAt: iso(now - 2 * 86400000),
      source: i % 2 === 0 ? "confidence" : "spaced",
      createdAt: iso(now - (i + 8000) * 1000), updatedAt: iso(now - (i + 600) * 1000),
      deleted: i % 20 === 0
    };
  });

  /* 600 tarjetas propias, 15 tombstones. */
  for (let i = 0; i < 600; i += 1) {
    const id = "ucard-vol-" + i;
    state.userCards[id] = {
      id, sheetId: sheetsByCycle[i % 4],
      front: "¿Frente " + i + "?", back: "Reverso " + i + " con la respuesta.",
      source: i % 2 === 0 ? "annotation" : "manual", annotationId: null,
      createdAt: iso(now - (i + 6000) * 1000), updatedAt: iso(now - (i + 700) * 1000),
      deleted: i % 40 === 0
    };
  }

  state.plan = {
    id: "plan", examDate: "2027-04-12", minutesPerDay: 60, daysPerWeek: 6,
    createdAt: iso(now - 9000 * 1000), updatedAt: iso(now - 800 * 1000), deleted: false
  };
  for (let i = 0; i < 100; i += 1) {
    const start = new Date(now - (i + 1) * 7 * 86400000);
    const weekStart = start.toISOString().slice(0, 10);
    const week = (function (dateStr) {
      const d = new Date(dateStr + "T00:00:00Z");
      const target = new Date(d.valueOf());
      const dayNr = (d.getUTCDay() + 6) % 7;
      target.setUTCDate(target.getUTCDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setUTCMonth(0, 1);
      if (target.getUTCDay() !== 4) target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
      const number = 1 + Math.ceil((firstThursday - target) / 604800000);
      return target.getUTCFullYear() + "-W" + String(number).padStart(2, "0");
    })(weekStart);
    state.weekly[week] = {
      id: week, weekStart, sheetsCompleted: i % 5, minutes: 30 + i,
      createdAt: iso(now - (i + 9000) * 1000), updatedAt: iso(now - (i + 900) * 1000),
      deleted: false
    };
  }
  for (let i = 0; i < 200; i += 1) {
    const id = "fact-vol-" + i;
    state.factsKnown[id] = {
      id, factId: id, known: i % 2 === 0,
      createdAt: iso(now - 9000 * 1000), updatedAt: iso(now - (i + 100) * 1000),
      deleted: i % 50 === 0
    };
  }

  /* Cajas de Flashcards preexistentes: no deben tocarse. */
  content.cards.slice(0, 12).forEach((card, i) => {
    state.cards[card.id] = {
      box: i % 7, dueAt: iso(now + (i % 3) * 86400000), lastReviewAt: iso(now - i * 86400000),
      lastResult: i % 2 === 0 ? "good" : "again", reviews: i + 1, correct: i, wrong: i % 2, lapses: i % 3
    };
  });
  state.sheets[ids[0]] = {
    views: 12, viewedAt: iso(now - 86400000), lastOpenedAt: iso(now - 3600000),
    completedAt: iso(now - 172800000), favorite: true, scroll: 0.4, readSeconds: 900,
    topicId: content.sheets[0].topicId
  };
  return state;
}

test("volumen alto: listados, filtros por área/color, tombstones y recarga", async () => {
  const content = loadRealContent();
  const state = buildVolumeState(content);
  const storage = createStorage(seedWithState(state));
  const ctx = createStore({ storage, content });
  await ctx.init();
  const store = ctx.store;

  const annAll = store.annotations.list({ includeDeleted: true });
  const annLive = store.annotations.list();
  assert.equal(annAll.length, 1200);
  assert.equal(annLive.length, 1176);
  assert.equal(annLive.filter((a) => a.deleted).length, 0);
  assert.ok(annLive[0].updatedAt >= annLive[annLive.length - 1].updatedAt, "orden updatedAt descendente");

  const expectedLiveByArea = {};
  const expectedLiveByColor = {};
  annAll.forEach((ann) => {
    if (ann.deleted) return;
    const sheet = content.sheets.filter((s) => s.id === ann.sheetId)[0];
    [sheet.primaryAreaId, sheet.areaId].forEach((areaId) => {
      expectedLiveByArea[areaId] = (expectedLiveByArea[areaId] || 0) + 1;
    });
    expectedLiveByColor[ann.color] = (expectedLiveByColor[ann.color] || 0) + 1;
  });
  Object.keys(expectedLiveByArea).forEach((areaId) => {
    assert.equal(
      store.annotations.list({ areaId }).length,
      expectedLiveByArea[areaId],
      "área " + areaId
    );
  });
  Object.keys(expectedLiveByColor).forEach((color) => {
    assert.equal(store.annotations.list({ color }).length, expectedLiveByColor[color], "color " + color);
  });
  assert.equal(store.annotations.list({ areaId: "area-psi-gestion" }).length, 0);
  assert.equal(store.annotations.list({ includeDeleted: true, areaId: "area-psi-cuidado-integral" }).length,
    expectedLiveByArea["area-psi-cuidado-integral"] + 24, "los tombstones del área también se cuentan con includeDeleted");

  /* Las listas devuelven copias también con volumen. */
  const copy = store.annotations.list()[0];
  copy.quote = "mutado";
  assert.notEqual(store.annotations.list()[0].quote, "mutado");

  /* Recuerdos: 3.000 con 30 tombstones y reparto por ficha. */
  assert.equal(store.recall.list({ includeDeleted: true }).length, 3000);
  assert.equal(store.recall.list().length, 2970);
  assert.equal(store.recall.list({ sheetId: content.sheets[0].id }).length, 2700);
  assert.equal(store.recall.list({ sheetId: content.sheets[1].id }).length, 270);
  assert.equal(store.recall.list({ includeDeleted: true, sheetId: content.sheets[1].id }).length, 300);

  /* Dudas: resueltas, abiertas y tombstones. */
  assert.equal(store.doubts.list().length, 288);
  assert.equal(store.doubts.list({ resolved: true }).length, 96);
  assert.equal(store.doubts.list({ resolved: false }).length, 192);
  assert.equal(store.doubts.list({ includeDeleted: true }).length, 300);

  /* Confianza, repaso, tarjetas propias, plan y datos. */
  assert.equal(store.sheetConfidence.list().length, 108);
  assert.equal(store.sheetConfidence.get(content.sheets[0].id), null, "tombstone de confianza");
  assert.equal(store.sheetReview.list().length, 114);
  assert.ok(store.sheetReview.due().length > 0);
  assert.equal(store.userCards.list().length, 585);
  assert.equal(store.userCards.list({ includeDeleted: true }).length, 600);
  assert.equal(store.plan.get().minutesPerDay, 60);
  assert.equal(store.weekly.list(10).length, 10);
  assert.equal(store.factsKnown.listKnown().length, 96);

  /* Operaciones de escritura en frío sobre el volumen. */
  const added = store.annotations.add({
    sheetId: content.sheets[0].id, sectionIndex: 9, paragraphIndex: 9,
    color: "important", quote: "Subrayado nuevo con el estado ya cargado."
  });
  assert.ok(added && added.id);
  assert.equal(store.annotations.list().length, 1177);
  const removed = store.annotations.remove(added.id);
  assert.equal(removed.deleted, true);
  assert.equal(store.annotations.list().length, 1176);
  assert.equal(store.annotations.list({ includeDeleted: true }).length, 1201);
  const recall = store.recall.add({
    sheetId: content.sheets[0].id, question: "¿Última pregunta?", answer: "Sí.", rating: "easy"
  });
  assert.ok(recall && recall.id);
  assert.equal(store.recall.remove(recall.id).deleted, true);
  assert.equal(store.recall.list().length, 2970);

  /* Exportar/importar con este volumen. */
  const exported = store.exportProgress();
  const exportedBytes = JSON.stringify(exported).length;
  assert.ok(exportedBytes < 12 * 1024 * 1024, "el JSON exportado cabe en el límite de importación");
  assert.equal(Object.keys(exported.state.annotations).length, 1201);
  assert.equal(Object.keys(exported.state.recall).length, 3001);
  const preview = store.previewImport(exported);
  assert.equal(preview.ok, true, (preview.errors || []).join(" "));
  assert.equal(preview.summary.annotations, 1176);
  assert.equal(preview.summary.doubts, 288);
  assert.equal(preview.summary.userCards, 585);
  assert.equal(preview.summary.recalls, 2970);

  const merged = store.importProgress(exported, { mode: "merge" });
  assert.equal(merged.ok, true, (merged.errors || []).join(" "));
  assert.equal(store.annotations.list().length, 1176);
  assert.equal(store.recall.list().length, 2970);
  assert.equal(store.doubts.list().length, 288);

  const cardsBefore = plain(store.getState().cards);
  same(store.getState().cards, cardsBefore);
  assert.equal(Object.keys(store.getState().cards).length, 12);

  /* Recarga completa: el volumen y los tombstones sobreviven. */
  const reloaded = createStore({ storage, content });
  await reloaded.init();
  assert.equal(reloaded.store.annotations.list().length, 1176);
  assert.equal(reloaded.store.annotations.list({ includeDeleted: true }).length, 1201);
  assert.equal(reloaded.store.recall.list().length, 2970);
  assert.equal(reloaded.store.doubts.list().length, 288);
  assert.equal(reloaded.store.userCards.list().length, 585);
  same(reloaded.store.getState().cards, cardsBefore);
  assert.equal(reloaded.store.annotations.list({ areaId: content.sheets[0].primaryAreaId }).length,
    store.annotations.list({ areaId: content.sheets[0].primaryAreaId }).length);
  assert.equal(JSON.stringify(readKey(storage, "study-state-v1").annotations).includes("area-psi"), false);
});
