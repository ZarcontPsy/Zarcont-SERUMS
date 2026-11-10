/* © 2026 ZARCONT — Pruebas de Fase 1 del almacén compartido (Node, sin dependencias).
   Cubre: filtro de anotaciones por área/color, evento `recall:changed`, fusión
   real entre pestañas con tombstones y `updatedAt`, exportar/importar las
   colecciones nuevas y regresión de Study Flashcards.
   Comando: node --test study-dashboard/tests/data */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CONTENT,
  V1_FIXTURE,
  createStorage,
  createStore,
  seedWithState,
  readKey,
  loadRealContent,
  applyTaxonomy,
  attachBus,
  domEvents,
  sleep
} = require("./helpers.js");

const ANNOTATION = {
  sheetId: "sheet-aps-01",
  sectionIndex: 0,
  sectionTitle: "De la enfermedad a la persona",
  paragraphIndex: 0,
  color: "important",
  quote: "La atención primaria de salud (APS) es el primer nivel de contacto.",
  prefix: "Inicio. ",
  suffix: " Después.",
  note: "Repasar con la ficha 02."
};

function plain(value) { return JSON.parse(JSON.stringify(value)); }
function same(actual, expected, message) {
  assert.deepEqual(plain(actual), JSON.parse(JSON.stringify(expected)), message || "estructura");
}
function hasOwn(record, key) { return Object.prototype.hasOwnProperty.call(record || {}, key); }

async function readyStore(options) {
  const ctx = createStore(options);
  await ctx.init();
  return ctx;
}

/* ------------------------------------------------------------------ */
/* 1 · Filtro por área de las anotaciones (contenido real)             */
/* ------------------------------------------------------------------ */

test("anotaciones: filtro por areaId con el contenido real y la taxonomía", async () => {
  const content = loadRealContent();
  const ctx = await readyStore({ content });
  const store = ctx.store;

  const annA = store.annotations.add({
    sheetId: "sheet-aps-01", sectionIndex: 1, paragraphIndex: 0,
    color: "important", quote: "Cita importante en APS."
  });
  const annB = store.annotations.add({
    sheetId: "sheet-aps-01", sectionIndex: 2, paragraphIndex: 1,
    color: "doubt", quote: "Cita con duda en APS."
  });
  const annC = store.annotations.add({
    sheetId: "sheet-aps-02", sectionIndex: 0, paragraphIndex: 0,
    color: "review", quote: "Cita para repasar en la ficha 02."
  });
  const annD = store.annotations.add({
    sheetId: "sheet-psi-et-1-1", sectionIndex: 0, paragraphIndex: 0,
    color: "important", quote: "Cita de ética."
  });
  const annE = store.annotations.add({
    sheetId: "sheet-ottawa-01", sectionIndex: 0, paragraphIndex: 0,
    color: "important", quote: "Cita de promoción de la salud."
  });
  const annF = store.annotations.add({
    sheetId: "sheet-psi-in-1-1", sectionIndex: 0, paragraphIndex: 0,
    color: "understand", quote: "Cita sobre investigación."
  });
  store.annotations.remove(annF.id);

  assert.equal(store.annotations.list().length, 5, "la lista viva excluye el tombstone");
  assert.equal(store.annotations.list({ includeDeleted: true }).length, 6);

  /* Área primaria oficial (taxonomy.js): suma las áreas heredadas. */
  assert.equal(store.annotations.list({ areaId: "area-psi-cuidado-integral" }).length, 3);
  assert.equal(store.annotations.list({ areaId: "area-psi-etica" }).length, 1);
  assert.equal(store.annotations.list({ areaId: "area-psi-salud-publica" }).length, 1);
  assert.equal(store.annotations.list({ areaId: "area-psi-investigacion" }).length, 0);
  assert.equal(store.annotations.list({ areaId: "area-psi-investigacion", includeDeleted: true }).length, 1);
  assert.equal(store.annotations.list({ areaId: "area-psi-gestion" }).length, 0);

  /* Área heredada: la misma ficha responde a su área de origen. */
  assert.equal(store.annotations.list({ areaId: "area-aps" }).length, 3);
  assert.equal(store.annotations.list({ areaId: "area-mci" }).length, 0);

  /* Combinaciones y límites. */
  assert.equal(store.annotations.list({ areaId: "area-psi-cuidado-integral", color: "important" }).length, 1);
  assert.equal(store.annotations.list({ areaId: "area-psi-cuidado-integral", color: "doubt" }).length, 1);
  assert.equal(store.annotations.list({ areaId: "area-psi-cuidado-integral", color: "understand" }).length, 0);
  same(
    store.annotations.list({ sheetId: "sheet-psi-et-1-1", areaId: "area-psi-etica" }).map((a) => a.id),
    [annD.id],
    "sheetId y área se combinan con AND"
  );
  assert.equal(store.annotations.list({ sheetId: "sheet-psi-et-1-1", areaId: "area-psi-cuidado-integral" }).length, 0);
  assert.equal(store.annotations.list({ areaId: "area-inexistente" }).length, 0);
  assert.equal(store.annotations.list({ areaId: "area-psi-etica", includeDeleted: true }).length, 1);

  /* El filtro no altera registros ni escribe el área en el estado guardado. */
  const stateAnnotations = store.getState().annotations;
  Object.keys(stateAnnotations).forEach((id) => {
    assert.equal(hasOwn(stateAnnotations[id], "areaId"), false, "el registro no gana areaId");
  });
  assert.equal(JSON.stringify(stateAnnotations).includes("area-psi"), false);
  const persisted = readKey(ctx.storage, "study-state-v1");
  assert.equal(JSON.stringify(persisted.annotations).includes("area-psi"), false, "tampoco se persiste el área");
  assert.equal(store.annotations.get(annA.id).quote, "Cita importante en APS.");

  const before = JSON.stringify(store.getState());
  store.annotations.list({ areaId: "area-psi-cuidado-integral" });
  store.annotations.list({ areaId: "area-aps", color: "review" });
  assert.equal(JSON.stringify(store.getState()), before, "listar no muta el estado");
});

test("anotaciones: área resuelta desde el tema y reconstrucción si la taxonomía llega tarde", async () => {
  /* Contenido sintético: la ficha no declara área y solo la hereda del tema. */
  const content = {
    version: "prueba-areas",
    meta: {},
    sources: [],
    areas: [{ id: "area-x", title: "Área X" }, { id: "area-y", title: "Área Y" }],
    topics: [{ id: "topic-x", areaId: "area-x", title: "Tema X" }],
    sheets: [{ id: "sheet-sin-area", topicId: "topic-x", title: "Ficha sin área" }],
    cards: []
  };
  const ctx = await readyStore({ content });
  ctx.store.annotations.add({ sheetId: "sheet-sin-area", quote: "Cita heredada del tema." });
  assert.equal(ctx.store.annotations.list({ areaId: "area-x" }).length, 1, "resuelve el área del tema");
  assert.equal(ctx.store.annotations.list({ areaId: "area-y" }).length, 0);

  /* Contenido real sin taxonomía: el área primaria aún no existe en las fichas.
     Al aplicarla después, el índice en caché debe reconstruirse. */
  const rawContent = loadRealContent({ taxonomy: false });
  const late = await readyStore({ content: rawContent });
  late.store.annotations.add({ sheetId: "sheet-aps-01", quote: "Cita antes de taxonomía." });
  assert.equal(late.store.annotations.list({ areaId: "area-psi-cuidado-integral" }).length, 0);
  assert.equal(late.store.annotations.list({ areaId: "area-aps" }).length, 1, "el área heredada ya funciona");
  applyTaxonomy(late);
  assert.equal(late.store.annotations.list({ areaId: "area-psi-cuidado-integral" }).length, 1, "índice reconstruido");
  assert.equal(late.store.annotations.list({ areaId: "area-aps" }).length, 1, "sigue respondiendo al área heredada");
});

test("anotaciones: filtro por color, orden updatedAt y tombstones (dataset sintético)", async () => {
  const ctx = await readyStore();
  const store = ctx.store;

  const first = store.annotations.add(Object.assign({}, ANNOTATION, { color: "important", quote: "Primera." }));
  await sleep(4);
  const second = store.annotations.add(Object.assign({}, ANNOTATION, {
    sheetId: "sheet-aps-02", color: "review", quote: "Segunda."
  }));
  await sleep(4);
  const third = store.annotations.add(Object.assign({}, ANNOTATION, {
    sheetId: "sheet-aps-02", color: "doubt", quote: "Tercera."
  }));
  await sleep(4);
  const fourth = store.annotations.add(Object.assign({}, ANNOTATION, {
    sheetId: "sheet-aps-02", color: "doubt", quote: "Cuarta."
  }));
  await sleep(4);
  const removed = store.annotations.add(Object.assign({}, ANNOTATION, { color: "review", quote: "Quinta." }));
  store.annotations.remove(removed.id);

  assert.equal(store.annotations.list().length, 4);
  assert.equal(store.annotations.list({ color: "doubt" }).length, 2);
  assert.equal(store.annotations.list({ color: "review" }).length, 1);
  assert.equal(store.annotations.list({ color: "understand" }).length, 0);
  assert.equal(store.annotations.list({ color: "inexistente" }).length, 0);
  assert.equal(store.annotations.list({ color: "review", includeDeleted: true }).length, 2);

  const ordered = store.annotations.list();
  assert.equal(ordered[0].id, fourth.id, "updatedAt descendente sin tombstones");
  assert.ok(ordered.length === 4 && ordered.every((a) => a.deleted === false));
  assert.equal(store.annotations.list({ sheetId: "sheet-aps-02" }).length, 3);
  assert.equal(store.annotations.list({ sheetId: "sheet-aps-01" }).length, 1);
  assert.ok(first.updatedAt <= second.updatedAt && second.updatedAt <= third.updatedAt);
});

/* ------------------------------------------------------------------ */
/* 2 · recall:changed                                                  */
/* ------------------------------------------------------------------ */

test("recall:changed en add y remove, por DOM y por StudyApp.events", async () => {
  const ctx = await readyStore();
  const store = ctx.store;
  const bus = attachBus(ctx);
  const dom = () => domEvents(ctx, "recall:changed");

  assert.equal(dom().length, 0);
  const added = store.recall.add({
    sheetId: "sheet-aps-01", cardId: "card-aps-01-1", sectionIndex: 0,
    question: "¿Qué es la APS?", answer: "El primer nivel de contacto.", rating: "good"
  });
  assert.ok(added && added.id.startsWith("recall-"));
  assert.equal(dom().length, 1);
  same(dom()[0].detail, { sheetId: "sheet-aps-01", id: added.id, rating: "good" });
  same(dom()[0].detail && Object.keys(dom()[0].detail).sort(), ["id", "rating", "sheetId"]);
  assert.equal(bus.length, 1);
  assert.equal(bus[0].name, "recall:changed");
  same(bus[0].detail, { sheetId: "sheet-aps-01", id: added.id, rating: "good" });

  const skipped = store.recall.add({
    sheetId: "sheet-aps-02", question: "¿Pregunta?", answer: "Respuesta.", rating: "skipped"
  });
  assert.equal(dom().length, 2);
  same(dom()[1].detail, { sheetId: "sheet-aps-02", id: skipped.id, rating: "skipped" });

  const removed = store.recall.remove(added.id);
  assert.equal(removed.deleted, true);
  assert.equal(dom().length, 3);
  same(dom()[2].detail, { sheetId: "sheet-aps-01", id: added.id, rating: "good" }, "el tombstone conserva el rating");
  same(bus[2].detail, { sheetId: "sheet-aps-01", id: added.id, rating: "good" });
  assert.equal(store.recall.list().length, 1);
  assert.equal(store.recall.list({ includeDeleted: true }).length, 2);

  /* Un add inválido o un remove inexistente no emiten nada. */
  assert.equal(store.recall.add({ sheetId: "sheet-aps-01" }), null);
  assert.equal(store.recall.remove("recall-no-existe"), null);
  assert.equal(dom().length, 3);
  assert.equal(bus.length, 3);

  /* El resto de eventos v2 sigue funcionando y `cards` no se toca. */
  const cardsBefore = JSON.stringify(store.getState().cards);
  store.annotations.add(ANNOTATION);
  assert.ok(domEvents(ctx, "annotation:changed").length === 1);
  assert.ok(ctx.events.some((e) => e.type === "store:change"));
  assert.equal(JSON.stringify(store.getState().cards), cardsBefore);
  assert.equal(Object.keys(store.getState().recall).length, 2);
  same(Object.keys(store.getState().recall).sort(), [skipped.id, added.id].sort(), "el esquema de datos no cambia");
});

/* ------------------------------------------------------------------ */
/* 3 · Fusión real entre pestañas                                      */
/* ------------------------------------------------------------------ */

test("merge real entre dos pestañas: anotaciones, dudas, confianza y tarjetas propias", async () => {
  const storage = createStorage();
  const tabA = createStore({ storage });
  const tabB = createStore({ storage });
  await tabA.init();
  await tabB.init();

  const annA = tabA.store.annotations.add(Object.assign({}, ANNOTATION, { quote: "Anotación de A." }));
  await sleep(6);
  const doubtB = tabB.store.doubts.add({ sheetId: "sheet-aps-01", quote: "Duda de B.", note: "Nota B" });
  await sleep(6);
  const ucardB = tabB.store.userCards.add({ sheetId: "sheet-aps-01", front: "F B", back: "R B" });
  await sleep(6);
  const reviewB = tabB.store.sheetReview.save({
    sheetId: "sheet-aps-01", dueAt: "2026-12-01T09:00:00.000Z", intervalDays: 4, source: "spaced"
  });
  await sleep(6);
  const recallB = tabB.store.recall.add({
    sheetId: "sheet-aps-01", question: "¿Pregunta de B?", answer: "Respuesta de B.", rating: "hard"
  });
  await sleep(6);
  const confB = tabB.store.sheetConfidence.set("sheet-aps-01", "weak");
  await sleep(6);
  const confA = tabA.store.sheetConfidence.set("sheet-aps-01", "solid");
  await sleep(6);
  const annB = tabB.store.annotations.add(Object.assign({}, ANNOTATION, {
    sheetId: "sheet-aps-02", color: "review", quote: "Anotación de B."
  }));
  await sleep(6);

  /* La escritura de A fusiona lo que B ya había guardado. */
  const annA2 = tabA.store.annotations.add(Object.assign({}, ANNOTATION, {
    sheetId: "sheet-aps-02", color: "doubt", quote: "Segunda anotación de A."
  }));
  const reviewA = tabA.store.sheetReview.save({
    sheetId: "sheet-aps-02", dueAt: "2026-12-02T09:00:00.000Z", source: "confidence"
  });
  const recallA = tabA.store.recall.add({
    sheetId: "sheet-aps-02", question: "¿Pregunta de A?", answer: "Respuesta de A.", rating: "good"
  });
  const stateA = tabA.store.getState();
  assert.ok(stateA.annotations[annA.id], "A conserva lo suyo");
  assert.ok(stateA.annotations[annB.id], "A incorpora lo de B");
  assert.ok(stateA.annotations[annA2.id]);
  assert.ok(stateA.doubts[doubtB.id], "A incorpora la duda de B");
  assert.ok(stateA.userCards[ucardB.id], "A incorpora la tarjeta propia de B");
  assert.equal(stateA.sheetReview[reviewB.id].source, "spaced", "A incorpora el repaso de B");
  assert.ok(stateA.recall[recallB.id], "A incorpora el recuerdo de B");
  assert.ok(stateA.recall[recallA.id]);
  assert.equal(tabA.store.sheetConfidence.get("sheet-aps-01").value, "solid", "updatedAt más reciente gana");
  assert.equal(stateA.sheetConfidence["sheet-aps-01"].updatedAt, confA.updatedAt);
  assert.notEqual(confB.updatedAt, confA.updatedAt);

  /* La escritura de B fusiona la unión de A. */
  await sleep(6);
  const doubtA = tabA.store.doubts.add({ sheetId: "sheet-aps-02", quote: "Duda de A." });
  await sleep(6);
  tabB.store.userCards.add({ sheetId: "sheet-aps-02", front: "F A", back: "R A" });
  const recallB2 = tabB.store.recall.add({
    sheetId: "sheet-aps-01", question: "¿Otra de B?", answer: "Otra respuesta.", rating: "again"
  });
  const stateB = tabB.store.getState();
  assert.ok(stateB.annotations[annA.id] && stateB.annotations[annB.id] && stateB.annotations[annA2.id]);
  assert.ok(stateB.doubts[doubtA.id] && stateB.doubts[doubtB.id]);
  assert.equal(Object.keys(stateB.userCards).length, 2);
  assert.equal(Object.keys(stateB.sheetReview).length, 2, "los dos repasos conviven");
  assert.equal(stateB.sheetReview[reviewA.id].source, "confidence");
  assert.ok(stateB.recall[recallA.id] && stateB.recall[recallB.id] && stateB.recall[recallB2.id]);
  assert.equal(tabB.store.sheetConfidence.get("sheet-aps-01").value, "solid");

  /* Tombstone entre pestañas: borrar en A no puede resucitar en B. */
  await sleep(6);
  tabA.store.annotations.remove(annA.id);
  const tombstone = tabA.store.getState().annotations[annA.id];
  assert.equal(tombstone.deleted, true);
  await sleep(6);
  tabB.store.annotations.add(Object.assign({}, ANNOTATION, {
    sheetId: "sheet-aps-01", quote: "Otra de B tras el borrado."
  }));
  assert.equal(tabB.store.getState().annotations[annA.id].deleted, true, "B recibe el tombstone y no resucita");
  assert.equal(tabB.store.annotations.list().length, 3);
  assert.equal(tabB.store.annotations.list({ includeDeleted: true }).length, 4);

  const persisted = readKey(storage, "study-state-v1");
  assert.equal(persisted.annotations[annA.id].deleted, true);
  assert.ok(persisted.annotations[annB.id] && persisted.annotations[annA2.id]);
  assert.ok(persisted.doubts[doubtA.id] && persisted.doubts[doubtB.id]);
  assert.equal(persisted.sheetConfidence["sheet-aps-01"].value, "solid");
  assert.equal(Object.keys(persisted.userCards).length, 2);
  assert.equal(Object.keys(persisted.sheetReview).length, 2);
  assert.equal(Object.keys(persisted.recall).length, 3);
  assert.equal(JSON.stringify(persisted).includes("area-psi"), false);
});

test("merge determinista entre dos estados exportados: updatedAt, tombstones y victoria del borrado", async () => {
  const ctx = await readyStore();
  const store = ctx.store;
  const t1 = "2026-11-01T10:00:00.000Z";
  const t2 = "2026-11-02T10:00:00.000Z";
  const t3 = "2026-11-03T10:00:00.000Z";
  const t4 = "2026-11-04T10:00:00.000Z";

  function annotation(id, updatedAt, deleted, quote) {
    return {
      id, sheetId: "sheet-aps-01", sectionIndex: 0, sectionTitle: "S", paragraphIndex: 0,
      color: "important", quote, prefix: "", suffix: "", note: "",
      createdAt: t1, updatedAt, deleted
    };
  }
  function doubt(id, updatedAt, deleted, quote) {
    return {
      id, sheetId: "sheet-aps-01", sectionIndex: 0, paragraphIndex: 0, quote, note: "",
      annotationId: null, resolvedAt: null, createdAt: t1, updatedAt, deleted
    };
  }
  function userCard(id, updatedAt, deleted, back) {
    return {
      id, sheetId: "sheet-aps-01", front: "F", back, source: "manual",
      annotationId: null, createdAt: t1, updatedAt, deleted
    };
  }
  function recall(id, updatedAt, deleted, rating) {
    return {
      id, sheetId: "sheet-aps-01", cardId: "card-aps-01-1", sectionIndex: 0,
      question: "Q", answer: "A", rating, createdAt: t1, updatedAt, deleted
    };
  }
  function envelope(statePatch) {
    const empty = {
      version: 2, schemaVersion: 2, createdAt: t1, updatedAt: t1, resetAt: null,
      sheets: {}, cards: {}, sessions: [], activity: {}, goals: { dailySheets: 2 },
      history: [], last: {}, flashSession: null,
      annotations: {}, doubts: {}, sheetConfidence: {}, sheetReview: {},
      recall: {}, userCards: {}, plan: null, weekly: {}, factsKnown: {}
    };
    return {
      format: "serums-study-progress", schema: 2, app: "study-dashboard",
      appVersion: "2.3.0", contentVersion: "2.5.0", exportedAt: t1,
      state: Object.assign(empty, plain(statePatch))
    };
  }

  const stateA = {
    annotations: {
      "ann-live": annotation("ann-live", t2, false, "A"),
      "ann-conflict": annotation("ann-conflict", t2, false, "A"),
      "ann-tomb": annotation("ann-tomb", t1, true, "borrada")
    },
    doubts: {
      "doubt-live": doubt("doubt-live", t2, false, "A"),
      "doubt-tomb": doubt("doubt-tomb", t1, true, "borrada")
    },
    sheetConfidence: {
      "sheet-aps-01": {
        id: "sheet-aps-01", sheetId: "sheet-aps-01", value: "weak",
        createdAt: t1, updatedAt: t2, deleted: false
      }
    },
    userCards: {
      "ucard-live": userCard("ucard-live", t2, false, "A"),
      "ucard-tomb": userCard("ucard-tomb", t1, true, "borrada")
    },
    recall: {
      "recall-live": recall("recall-live", t2, false, "good"),
      "recall-tomb": recall("recall-tomb", t1, true, "good")
    }
  };
  const stateB = {
    annotations: {
      "ann-live": annotation("ann-live", t1, false, "B antigua"),
      "ann-conflict": annotation("ann-conflict", t3, false, "B nueva"),
      "ann-tomb": annotation("ann-tomb", t4, false, "B intenta resucitar")
    },
    doubts: {
      "doubt-live": doubt("doubt-live", t1, false, "B antigua"),
      "doubt-tomb": doubt("doubt-tomb", t4, false, "B intenta resucitar")
    },
    sheetConfidence: {
      "sheet-aps-01": {
        id: "sheet-aps-01", sheetId: "sheet-aps-01", value: "solid",
        createdAt: t1, updatedAt: t3, deleted: false
      }
    },
    userCards: {
      "ucard-live": userCard("ucard-live", t3, false, "B nueva"),
      "ucard-tomb": userCard("ucard-tomb", t4, false, "B intenta resucitar")
    },
    recall: {
      "recall-live": recall("recall-live", t1, false, "hard"),
      "recall-tomb": recall("recall-tomb", t4, false, "again"),
      "recall-nuevo": recall("recall-nuevo", t3, false, "easy")
    }
  };

  const preview = store.previewImport(envelope(stateA));
  assert.equal(preview.ok, true, preview.errors.join(" "));
  assert.equal(preview.summary.annotations, 2);
  assert.equal(preview.summary.doubts, 1);
  assert.equal(preview.summary.userCards, 1);
  assert.equal(preview.summary.recalls, 1);

  assert.equal(store.importProgress(envelope(stateA), { mode: "merge" }).ok, true);
  const secondImport = store.importProgress(envelope(stateB), { mode: "merge" });
  assert.equal(secondImport.ok, true, (secondImport.errors || []).join(" "));

  const st = store.getState();
  assert.equal(store.annotations.get("ann-live").quote, "A", "updatedAt más reciente gana");
  assert.equal(store.annotations.get("ann-conflict").quote, "B nueva");
  assert.equal(st.annotations["ann-tomb"].deleted, true, "el tombstone no resucita aunque llegue uno vivo más nuevo");
  assert.equal(st.annotations["ann-tomb"].quote, "borrada");

  assert.equal(store.doubts.get("doubt-live").quote, "A");
  assert.equal(st.doubts["doubt-tomb"].deleted, true);
  assert.equal(store.sheetConfidence.get("sheet-aps-01").value, "solid");
  assert.equal(store.userCards.get("ucard-live").back, "B nueva");
  assert.equal(st.userCards["ucard-tomb"].deleted, true);
  assert.equal(store.recall.list().length, 2);
  assert.equal(store.recall.list({ includeDeleted: true }).length, 3);
  assert.equal(store.recall.list().find((r) => r.id === "recall-live").rating, "good");
  assert.ok(store.recall.list().some((r) => r.id === "recall-nuevo"));
  assert.equal(st.recall["recall-tomb"].deleted, true);
});

/* ------------------------------------------------------------------ */
/* 4 · Exportar / importar con las colecciones nuevas                  */
/* ------------------------------------------------------------------ */

test("exportar e importar conserva las colecciones nuevas, tombstones y tarjetas de Flashcards", async () => {
  const source = await readyStore({ seed: seedWithState(V1_FIXTURE) });
  const store = source.store;

  const annLive = store.annotations.add(ANNOTATION);
  const annGone = store.annotations.add(Object.assign({}, ANNOTATION, { quote: "Se borra." }));
  store.annotations.remove(annGone.id);
  const doubt = store.doubts.add({ sheetId: "sheet-aps-01", quote: "Duda viva" });
  const doubtGone = store.doubts.add({ sheetId: "sheet-aps-02", quote: "Duda borrada" });
  store.doubts.remove(doubtGone.id);
  store.sheetConfidence.set("sheet-aps-01", "solid");
  store.sheetConfidence.set("sheet-aps-02", "weak");
  store.sheetConfidence.clear("sheet-aps-02");
  store.sheetReview.save({ sheetId: "sheet-aps-01", dueAt: "2026-12-01T09:00:00.000Z", source: "spaced" });
  store.sheetReview.save({ sheetId: "sheet-aps-02", dueAt: "2026-12-02T09:00:00.000Z" });
  store.sheetReview.remove("sheet-aps-02");
  const recall = store.recall.add({
    sheetId: "sheet-aps-01", cardId: "card-aps-01-1", question: "¿Q?", answer: "R", rating: "hard"
  });
  const recallGone = store.recall.add({
    sheetId: "sheet-aps-01", cardId: "card-aps-01-2", question: "¿Q2?", answer: "R2", rating: "again"
  });
  store.recall.remove(recallGone.id);
  const ucard = store.userCards.add({
    sheetId: "sheet-aps-01", front: "¿F?", back: "R", source: "annotation", annotationId: annLive.id
  });
  const ucardGone = store.userCards.add({ sheetId: "sheet-aps-02", front: "F2", back: "R2" });
  store.userCards.remove(ucardGone.id);

  const cardsBefore = plain(store.getState().cards);
  const exported = store.exportProgress();
  assert.equal(exported.schema, 2);
  assert.equal(exported.state.annotations[annGone.id].deleted, true);
  assert.equal(exported.state.doubts[doubtGone.id].deleted, true);
  assert.equal(exported.state.sheetConfidence["sheet-aps-02"].deleted, true);
  assert.equal(exported.state.sheetReview["review-sheet-aps-02"].deleted, true);
  assert.equal(exported.state.recall[recallGone.id].deleted, true);
  assert.equal(exported.state.userCards[ucardGone.id].deleted, true);

  const preview = store.previewImport(exported);
  assert.equal(preview.ok, true);
  same(preview.summary, {
    exportedAt: exported.exportedAt,
    appVersion: "2.3.0",
    contentVersion: "2.5.0",
    sheets: 1, completedSheets: 0, favorites: 0,
    cardsReviewed: 1, sessions: 0,
    annotations: 1, doubts: 1, userCards: 1, recalls: 1,
    hasPlan: false, factsKnown: 0
  });

  const target = await readyStore();
  const result = target.store.importProgress(exported, { mode: "replace", confirmReplace: true });
  assert.equal(result.ok, true);
  const st = target.store.getState();
  same(st.annotations, exported.state.annotations);
  same(st.doubts, exported.state.doubts);
  same(st.sheetConfidence, exported.state.sheetConfidence);
  same(st.sheetReview, exported.state.sheetReview);
  same(st.recall, exported.state.recall);
  same(st.userCards, exported.state.userCards);
  same(st.cards, cardsBefore, "las cajas de repaso viajan intactas");
  same(st.flashSession, V1_FIXTURE.flashSession);
  assert.equal(st.sheetConfidence["sheet-aps-02"].deleted, true);
  assert.equal(target.store.annotations.list().length, 1);
  assert.equal(target.store.annotations.list({ includeDeleted: true }).length, 2);
  assert.equal(target.store.annotations.list({ areaId: "area-aps" }).length, 1);
  assert.equal(target.store.recall.list().length, 1);
  assert.equal(target.store.recall.list({ includeDeleted: true }).length, 2);
  assert.ok(readKey(target.storage, "study-backup-preimport-v1"));

  /* Recargar desde el almacenamiento conserva las colecciones y tombstones. */
  const reloaded = createStore({ storage: target.storage });
  await reloaded.init();
  same(reloaded.store.getState().annotations, st.annotations);
  same(reloaded.store.getState().recall, st.recall);
  same(reloaded.store.getState().userCards, st.userCards);
  same(reloaded.store.getState().cards, cardsBefore);
  assert.equal(reloaded.store.annotations.list({ areaId: "area-aps" }).length, 1);
  assert.equal(reloaded.store.recall.list().length, 1);

  /* La importación de un archivo v1 con tarjetas antiguas no toca `cards`. */
  const legacy = {
    format: "serums-study-progress", schema: 1, app: "study-dashboard",
    appVersion: "2.3.0", contentVersion: "2.5.0", exportedAt: "2026-10-25T22:06:11.163Z",
    state: V1_FIXTURE
  };
  const merged = await readyStore();
  assert.equal(merged.store.importProgress(legacy, { mode: "merge" }).ok, true);
  same(merged.store.getState().cards, V1_FIXTURE.cards);
  assert.equal(Object.keys(merged.store.getState().annotations).length, 0);
});

test("las preferencias de lectura activa quedan fuera del estado exportado y del borrado", async () => {
  const prefs = { version: 1, recallPause: true, recallEvery: 2, shortcuts: true };
  const seed = Object.assign(seedWithState(V1_FIXTURE), {
    "study-active-prefs-v1": JSON.stringify(prefs)
  });
  const ctx = await readyStore({ seed });
  ctx.store.annotations.add(ANNOTATION);

  const exported = ctx.store.exportProgress();
  const exportedText = JSON.stringify(exported);
  assert.equal(exportedText.includes("study-active-prefs-v1"), false);
  assert.equal(exportedText.includes("recallPause"), false);
  assert.equal(exportedText.includes("recallEvery"), false);
  assert.equal(exportedText.includes("shortcuts"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(exported.state, "prefs"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(exported.state, "activePrefs"), false);

  ctx.store.clearAllProgress({ confirm: true });
  assert.equal(ctx.storage.getItem("study-active-prefs-v1"), JSON.stringify(prefs), "el borrado no toca las preferencias");

  const target = await readyStore();
  target.store.importProgress(exported, { mode: "replace", confirmReplace: true });
  assert.equal(target.storage.getItem("study-active-prefs-v1"), null, "la importación no crea la clave");
  assert.equal(JSON.stringify(target.store.getState()).includes("study-active-prefs-v1"), false);
  assert.equal(Object.keys(target.store.getState()).some((key) => /pref/i.test(key)), false);
});

/* ------------------------------------------------------------------ */
/* 5 · Regresión de Study Flashcards                                   */
/* ------------------------------------------------------------------ */

test("Flashcards: cajas `cards` intactas, API antigua y notificaciones legadas", async () => {
  const ctx = await readyStore({ seed: seedWithState(V1_FIXTURE) });
  const store = ctx.store;
  const cardsBefore = plain(store.getState().cards);
  const sessionsBefore = store.getState().sessions.length;
  const payloads = [];
  const off = store.subscribe((payload) => payloads.push(payload));

  /* Uso intensivo de las colecciones de Fase 1. */
  const ann = store.annotations.add(ANNOTATION);
  store.doubts.add({ sheetId: "sheet-aps-01", quote: "Duda" });
  store.sheetConfidence.set("sheet-aps-01", "partial");
  store.sheetReview.save({ sheetId: "sheet-aps-01", dueAt: new Date().toISOString() });
  store.recall.add({ sheetId: "sheet-aps-01", question: "Q", answer: "A", rating: "good" });
  store.userCards.add({ sheetId: "sheet-aps-01", front: "F", back: "B", annotationId: ann.id });

  same(plain(store.getState().cards), cardsBefore, "las cajas no cambian");
  assert.equal(payloads.length > 0, true);
  assert.ok(payloads[payloads.length - 1].state);
  assert.ok(payloads[payloads.length - 1].snapshot);
  assert.equal(payloads[payloads.length - 1].snapshot.version, 1, "el snapshot del HUB conserva su formato");

  /* API antigua de repaso. */
  assert.equal(store.getCardState("card-aps-01-1").reviews, 1);
  store.recordReview("card-aps-01-1", "good", { correct: true });
  const reviewed = store.getCardState("card-aps-01-1");
  assert.equal(reviewed.reviews, 2);
  assert.equal(reviewed.lastResult, "good");
  assert.ok(Array.isArray(store.getDueCards("sheet-aps-01")));
  assert.ok(Array.isArray(store.getErrorCards()));
  assert.equal(typeof store.getDeckStats("sheet-aps-01").percent, "number");
  assert.ok(Array.isArray(store.getRecommendations()));
  assert.equal(store.getDashboardStats().hasActivity, true);

  const session = store.startSession("quick", "sheet-aps-01", ["card-aps-01-1", "card-aps-01-2"]);
  assert.ok(session && session.status === "active");
  store.recordSessionAnswer("card-aps-01-1", { correct: true, rating: "good" });
  assert.equal(store.updateFlashSession({ index: 1 }).index, 1);
  const summary = store.finishSession();
  assert.ok(summary && summary.total === 1);
  assert.equal(store.getState().sessions.length, sessionsBefore + 1);
  assert.equal(store.getState().cards["card-aps-01-1"].reviews, 3, "la tarjeta se actualiza como siempre");

  /* Las operaciones nuevas no tocan las cajas ni el esquema de repaso. */
  const cardsAfter = plain(store.getState().cards);
  same(Object.keys(cardsAfter), ["card-aps-01-1"], "solo la tarjeta repasada tiene estado");
  assert.equal(cardsAfter["card-aps-01-1"].reviews, 3, "la tarjeta se actualiza como siempre");
  assert.equal(cardsAfter["card-aps-01-2"], undefined, "las tarjetas no repasadas siguen fuera de `cards`");

  /* Exportar/importar reemplazando conserva las cajas y la API. */
  const exported = store.exportProgress();
  const fresh = await readyStore();
  fresh.store.importProgress(exported, { mode: "replace", confirmReplace: true });
  same(fresh.store.getState().cards, cardsAfter);
  assert.equal(fresh.store.getCardState("card-aps-01-1").reviews, 3);
  assert.equal(typeof fresh.store.getDeckStats("sheet-aps-01").percent, "number");
  off();
});
