/* © 2026 ZARCONT — Pruebas del store v2 (Node, sin dependencias).
   Comando: node --test study-dashboard/tests/data */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  V1_FIXTURE,
  createStorage,
  createStore,
  seedWithState,
  readKey,
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

/* Los objetos creados dentro del contexto vm tienen otro prototipo: se comparan
   como JSON para que node:assert no confunda «misma estructura» con «mismo reino». */
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function same(actual, expected, message) {
  assert.deepEqual(plain(actual), JSON.parse(JSON.stringify(expected)), message || "estructura");
}

async function readyStore(options) {
  const ctx = createStore(options);
  await ctx.init();
  return ctx;
}

test("migración v1→v2: conserva todo el legado y añade colecciones vacías", async () => {
  const ctx = await readyStore({ seed: seedWithState(V1_FIXTURE) });
  const st = ctx.store.getState();

  assert.equal(ctx.store.SCHEMA_VERSION, 2);
  assert.equal(st.version, 2);
  assert.equal(st.schemaVersion, 2);
  assert.equal(st.resetAt, null);
  same(plain(st.sheets), V1_FIXTURE.sheets, "sheets intacto");
  same(plain(st.cards), V1_FIXTURE.cards, "cajas de repaso intactas");
  same(plain(st.sessions), V1_FIXTURE.sessions);
  same(plain(st.activity), V1_FIXTURE.activity);
  same(plain(st.goals), V1_FIXTURE.goals);
  same(plain(st.history), V1_FIXTURE.history);
  same(plain(st.last), V1_FIXTURE.last);
  same(plain(st.flashSession), V1_FIXTURE.flashSession, "sesión de Flashcards intacta");
  same(plain(st.annotations), {});
  same(plain(st.doubts), {});
  same(plain(st.sheetConfidence), {});
  same(plain(st.sheetReview), {});
  same(plain(st.recall), {});
  same(plain(st.userCards), {});
  assert.equal(st.plan, null);
  same(plain(st.weekly), {});
  same(plain(st.factsKnown), {});

  const persisted = readKey(ctx.storage, "study-state-v1");
  assert.equal(persisted.version, 2);
  assert.equal(persisted.schemaVersion, 2);
  same(persisted.flashSession, V1_FIXTURE.flashSession);
  assert.equal(ctx.store.getDashboardStats().hasActivity, true);

  const snapshot = readKey(ctx.storage, "studyhub:snapshot:v1");
  assert.equal(snapshot.version, 1, "el snapshot del HUB conserva su formato");
  assert.equal(snapshot.contentVersion, "2.5.0");
  assert.equal(snapshot.hasActivity, true);
});

test("API antigua intacta: fichas, tarjetas y sesión de Flashcards", async () => {
  const ctx = await readyStore({ seed: seedWithState(V1_FIXTURE) });
  const store = ctx.store;

  const sheetState = store.recordSheetView("sheet-aps-01", "topic-aps-atributos");
  assert.equal(sheetState.views, 1);
  assert.ok(sheetState.lastOpenedAt);
  assert.equal(store.getSheetState("sheet-aps-01").views, 1);

  assert.equal(store.toggleSheetComplete("sheet-aps-01"), true);
  assert.ok(store.getSheetState("sheet-aps-01").completedAt);

  store.recordReview("card-aps-01-1", "good", { correct: true });
  const cardState = store.getCardState("card-aps-01-1");
  assert.equal(cardState.reviews, 2);
  assert.equal(cardState.lastResult, "good");

  const session = store.startSession("quick", "sheet-aps-01", ["card-aps-01-1", "card-aps-01-2"]);
  assert.ok(session && session.status === "active");
  store.recordSessionAnswer("card-aps-01-1", { correct: true, rating: "good" });
  const summary = store.finishSession();
  assert.ok(summary);
  assert.equal(summary.total, 1);
  assert.equal(store.getState().sessions.length, 1);
  assert.equal(store.getFlashSession(), null);
  assert.equal(typeof store.getDeckStats("sheet-aps-01").percent, "number");
  assert.ok(Array.isArray(store.getRecommendations()));

  /* Las URLs entre apps se construyen desde la raíz común, no desde el
     directorio actual de la app que las invoca. */
  const origin = "http://127.0.0.1:8790";
  function setLocation(path) { ctx.window.location.href = origin + path; }
  function appHref(folder, params) { return store.urls.appUrl(folder, params); }
  const cases = [
    ["/", "study-flashcards", "/study-flashcards/index.html"],
    ["/", "study-dashboard", "/study-dashboard/index.html"],
    ["/study-dashboard/", "study-flashcards", "/study-flashcards/index.html"],
    ["/study-dashboard", "study-flashcards", "/study-flashcards/index.html"],
    ["/study-dashboard/index.html", "study-flashcards", "/study-flashcards/index.html"],
    ["/study-dashboard/index.html", "study-dashboard", "/study-dashboard/index.html"],
    ["/study-dashboard/tests/data/smoke.html", "study-flashcards", "/study-flashcards/index.html"],
    ["/study-flashcards/index.html", "study-dashboard", "/study-dashboard/index.html"],
    ["/study-flashcards/index.html", "study-flashcards", "/study-flashcards/index.html"],
    ["/serums-quest/index.html", "study-dashboard", "/study-dashboard/index.html"],
    ["/serums-quest/index.html", "study-flashcards", "/study-flashcards/index.html"],
    ["/prefix/study-dashboard/index.html", "study-flashcards", "/prefix/study-flashcards/index.html"],
    ["/prefix/study-flashcards/deck", "study-dashboard", "/prefix/study-dashboard/index.html"],
    ["/otra/app/index.html", "study-flashcards", "/otra/app/study-flashcards/index.html"]
  ];
  cases.forEach(function (item) {
    setLocation(item[0]);
    assert.equal(appHref(item[1]), origin + item[2], item[0] + " → " + item[1]);
  });
  setLocation("/study-dashboard/index.html?x=1#/ficha/sheet-aps-01");
  assert.equal(
    appHref("study-flashcards", { deck: "sheet-aps-01", resume: "1", empty: "" }),
    origin + "/study-flashcards/index.html?deck=sheet-aps-01&resume=1",
    "limpia query/hash y conserva params"
  );
  assert.equal(appHref("study-dashboard", { sheet: "sheet-aps-01" }), origin + "/study-dashboard/index.html?sheet=sheet-aps-01");
});

test("colecciones v2: CRUD, validación, copias defensivas y tombstones", async () => {
  const ctx = await readyStore();
  const store = ctx.store;

  assert.equal(store.annotations.add({ sheetId: "sheet-aps-01" }), null, "add exige quote");
  const ann = store.annotations.add(ANNOTATION);
  assert.ok(ann.id.startsWith("ann-"));
  assert.equal(ann.deleted, false);
  assert.ok(ann.createdAt && ann.updatedAt);

  ann.note = "mutado fuera";
  assert.equal(store.annotations.get(ann.id).note, ANNOTATION.note, "devuelve copia");

  const updated = store.annotations.update(ann.id, { note: "Nota nueva", id: "otro", deleted: true });
  assert.equal(updated.id, ann.id);
  assert.equal(updated.note, "Nota nueva");
  assert.equal(updated.deleted, false, "update no puede borrar");
  assert.equal(updated.createdAt, ann.createdAt);
  assert.equal(store.annotations.update(ann.id, { quote: "" }), null, "update no acepta quote vacía");
  assert.equal(store.annotations.list({ sheetId: "sheet-aps-01" }).length, 1);
  assert.equal(store.annotations.list({ sheetId: "otra" }).length, 0);
  assert.equal(store.annotations.list({ color: "doubt" }).length, 0);

  const removed = store.annotations.remove(ann.id);
  assert.equal(removed.deleted, true);
  assert.equal(store.annotations.get(ann.id), null);
  assert.equal(store.annotations.list().length, 0);
  assert.equal(store.annotations.list({ includeDeleted: true }).length, 1);
  assert.equal(store.getState().annotations[ann.id].deleted, true);
  assert.equal(store.annotations.remove(ann.id), null, "no borra dos veces");

  const doubt = store.doubts.add({
    sheetId: "sheet-aps-01", sectionIndex: 1, paragraphIndex: 0,
    quote: "¿Qué es longitudinalidad?", note: "Preguntar en clase"
  });
  assert.ok(doubt.id.startsWith("doubt-"));
  assert.equal(doubt.resolvedAt, null);
  assert.equal(store.doubts.resolve(doubt.id).resolvedAt !== null, true);
  assert.equal(store.doubts.list({ resolved: true }).length, 1);
  assert.equal(store.doubts.reopen(doubt.id).resolvedAt, null);
  assert.equal(store.doubts.list({ resolved: false }).length, 1);
  assert.equal(store.doubts.remove(doubt.id).deleted, true);
  assert.equal(store.doubts.list().length, 0);

  assert.equal(store.sheetConfidence.set("sheet-aps-01", "inventado"), null);
  const confidence = store.sheetConfidence.set("sheet-aps-01", "partial");
  assert.equal(confidence.id, "sheet-aps-01");
  assert.equal(store.sheetConfidence.get("sheet-aps-01").value, "partial");
  assert.equal(store.sheetConfidence.list().length, 1);
  assert.equal(store.sheetConfidence.clear("sheet-aps-01").deleted, true);
  assert.equal(store.sheetConfidence.get("sheet-aps-01"), null);

  assert.equal(store.sheetReview.save({ sheetId: "sheet-aps-01", dueAt: "no-fecha" }), null);
  const dueAt = new Date(Date.now() - 60000).toISOString();
  const review = store.sheetReview.save({
    sheetId: "sheet-aps-01", dueAt, intervalDays: 2, source: "spaced"
  });
  assert.equal(review.id, "review-sheet-aps-01");
  assert.equal(store.sheetReview.due().length, 1);
  assert.equal(store.sheetReview.get("sheet-aps-01").source, "spaced");
  assert.equal(store.sheetReview.remove("sheet-aps-01").deleted, true);
  assert.equal(store.sheetReview.due().length, 0);

  const recall = store.recall.add({
    sheetId: "sheet-aps-01", cardId: "card-aps-01-1", sectionIndex: 0,
    question: "¿Qué es la APS?", answer: "Primer nivel de contacto.", rating: "good"
  });
  assert.ok(recall.id.startsWith("recall-"));
  assert.equal(store.recall.list().length, 1);
  assert.equal(store.recall.remove(recall.id).deleted, true);
  assert.equal(store.recall.list().length, 0);

  const userCard = store.userCards.add({
    sheetId: "sheet-aps-01", front: "¿Qué atributo?", back: "Longitudinalidad",
    source: "annotation", annotationId: ann.id
  });
  assert.ok(userCard.id.startsWith("ucard-"));
  assert.equal(store.userCards.get(userCard.id).front, "¿Qué atributo?");
  assert.equal(store.userCards.update(userCard.id, { back: "Accesibilidad" }).back, "Accesibilidad");
  assert.equal(store.userCards.remove(userCard.id).deleted, true);
  assert.equal(store.userCards.list().length, 0);

  assert.equal(store.plan.save({ examDate: "2026-13-40" }), null);
  const plan = store.plan.save({ examDate: "2027-04-12", minutesPerDay: 60, daysPerWeek: 6 });
  assert.equal(plan.id, "plan");
  assert.equal(store.plan.get().minutesPerDay, 60);
  assert.equal(store.plan.remove().deleted, true);
  assert.equal(store.plan.get(), null);
  assert.ok(store.plan.save({ minutesPerDay: 30 }).id === "plan", "plan explícito puede volver");

  assert.equal(store.weekly.save({ weekStart: "2026-13-01" }), null);
  const week = store.weekly.save({ weekStart: "2026-11-02", sheetsCompleted: 3, note: "ok" });
  assert.equal(week.id, "2026-W45");
  assert.equal(store.weekly.get("2026-11-02").sheetsCompleted, 3);
  assert.equal(store.weekly.list().length, 1);

  assert.equal(store.factsKnown.set("fact-x", true).known, true);
  same(store.factsKnown.listKnown(), ["fact-x"]);
  store.factsKnown.set("fact-y", false);
  same(store.factsKnown.listKnown(), ["fact-x"]);
});

test("exportar → importar (replace) conserva legado y colecciones nuevas", async () => {
  const source = await readyStore();
  const store = source.store;

  const ann = store.annotations.add(ANNOTATION);
  store.doubts.add({ sheetId: "sheet-aps-01", quote: "Duda viva" });
  store.userCards.add({ sheetId: "sheet-aps-01", front: "F", back: "B" });
  store.recall.add({ sheetId: "sheet-aps-01", question: "Q", answer: "A", rating: "good" });
  store.plan.save({ examDate: "2027-04-12", minutesPerDay: 45, daysPerWeek: 5 });
  store.weekly.save({ weekStart: "2026-11-02", sheetsCompleted: 2 });
  store.factsKnown.set("fact-aps-1", true);
  store.sheetConfidence.set("sheet-aps-01", "solid");
  store.sheetReview.save({ sheetId: "sheet-aps-01", dueAt: new Date().toISOString() });
  store.recordSheetView("sheet-aps-02", "topic-aps-atributos");
  store.toggleSheetComplete("sheet-aps-02");
  store.recordReview("card-aps-01-2", "good", { correct: true });
  store.startSession("quick", "sheet-aps-01", ["card-aps-01-1"]);
  store.recordSessionAnswer("card-aps-01-1", { correct: false, rating: "again" });
  store.finishSession();

  const exported = store.exportProgress();
  assert.equal(exported.format, "serums-study-progress");
  assert.equal(exported.schema, 2);
  assert.equal(exported.app, "study-dashboard");
  assert.equal(exported.appVersion, "2.3.0");
  assert.equal(exported.contentVersion, "2.5.0");
  assert.ok(exported.state.sheets["sheet-aps-02"]);
  assert.ok(exported.state.cards["card-aps-01-2"]);
  assert.equal(exported.state.sessions.length, 1);
  same(exported.state.sessions[0].answers["card-aps-01-1"].rating, "again");
  assert.equal(exported.state.annotations[ann.id].quote, ANNOTATION.quote);
  assert.equal(exported.state.plan.examDate, "2027-04-12");
  assert.equal(exported.state.factsKnown["fact-aps-1"].known, true);

  const target = await readyStore();
  assert.equal(target.store.previewImport(exported).ok, true);
  assert.equal(target.store.annotations.list().length, 0, "preview no muta");

  const result = target.store.importProgress(exported, { mode: "replace", confirmReplace: true });
  assert.equal(result.ok, true);
  assert.equal(result.mode, "replace");
  assert.equal(result.safetyCopy, true);
  const st = target.store.getState();
  same(st.sheets, exported.state.sheets);
  same(st.cards, exported.state.cards);
  same(st.sessions, exported.state.sessions);
  same(st.activity, exported.state.activity);
  same(st.history, exported.state.history);
  same(st.last, exported.state.last);
  assert.equal(st.annotations[ann.id].quote, ANNOTATION.quote);
  assert.equal(Object.keys(st.doubts).length, 1);
  assert.equal(Object.keys(st.userCards).length, 1);
  assert.equal(Object.keys(st.recall).length, 1);
  assert.equal(st.plan.examDate, "2027-04-12");
  assert.equal(Object.keys(st.weekly).length, 1);
  assert.equal(st.factsKnown["fact-aps-1"].known, true);
  assert.ok(readKey(target.storage, "study-backup-preimport-v1"), "copia previa de importación");
});

test("merge con tombstones: un registro borrado no resucita", async () => {
  const ctx = await readyStore();
  const store = ctx.store;

  const ann = store.annotations.add(ANNOTATION);
  const liveExport = store.exportProgress();
  store.annotations.remove(ann.id);
  const tombstoneState = store.getState().annotations[ann.id];
  assert.equal(tombstoneState.deleted, true);

  const mergeResult = store.importProgress(liveExport, { mode: "merge" });
  assert.equal(mergeResult.ok, true);
  assert.equal(store.annotations.list().length, 0, "el tombstone gana");
  assert.equal(store.getState().annotations[ann.id].deleted, true);

  const plan = store.plan.save({ minutesPerDay: 20 });
  const planLive = store.exportProgress();
  store.plan.remove();
  store.importProgress(planLive, { mode: "merge" });
  assert.equal(store.plan.get(), null, "plan borrado no resucita");

  const other = await readyStore();
  other.store.importProgress(liveExport, { mode: "merge" });
  assert.equal(other.store.annotations.list().length, 1);
  other.store.importProgress(store.exportProgress(), { mode: "merge" });
  assert.equal(other.store.annotations.list().length, 0, "tombstone importado gana en otra pestaña");
});

test("resetAt: un estado anterior al borrado total no resucita el progreso", async () => {
  const storage = createStorage();
  const tabA = createStore({ storage });
  const tabB = createStore({ storage });
  await tabA.init();
  await tabB.init();

  tabB.store.recordSheetView("sheet-aps-01", "topic-aps-atributos");
  tabB.store.toggleSheetComplete("sheet-aps-01");
  const oldAnnotation = tabB.store.annotations.add(ANNOTATION);
  assert.ok(tabB.store.getState().sheets["sheet-aps-01"]);

  await sleep(10);
  const cleared = tabA.store.clearAllProgress({ confirm: true });
  assert.equal(cleared.ok, true);
  assert.ok(cleared.at);

  await sleep(10);
  const freshAnnotation = tabB.store.annotations.add(Object.assign({}, ANNOTATION, { quote: "Después del borrado." }));
  const st = tabB.store.getState();

  assert.equal(st.resetAt, cleared.at, "resetAt más reciente manda");
  same(st.sheets, {}, "las vistas previas no vuelven");
  assert.equal(st.sheets["sheet-aps-01"], undefined);
  assert.equal(st.cards["card-aps-01-1"], undefined);
  assert.equal(st.annotations[oldAnnotation.id], undefined, "la anotación anterior no vuelve");
  assert.ok(st.annotations[freshAnnotation.id], "lo escrito después del sello sí se conserva");
  assert.equal(tabB.store.annotations.list().length, 1);
});

test("importación inválida: errores claros, sin mutación ni copia de seguridad", async () => {
  const ctx = await readyStore();
  const store = ctx.store;
  store.annotations.add(ANNOTATION);
  const before = JSON.stringify(store.getState());

  const cases = [
    ["no es JSON", "esto no es json"],
    ["sin formato", { hello: "world" }],
    ["sin estado", { format: "serums-study-progress", schema: 2, app: "study-dashboard" }]
  ];
  for (const [label, raw] of cases) {
    const preview = store.previewImport(raw);
    assert.equal(preview.ok, false, label);
    assert.ok(preview.errors.length > 0, label + " debe explicar el error");
  }

  const malformed = store.exportProgress();
  malformed.state.annotations = { roto: { id: "roto" } };
  const badPreview = store.previewImport(malformed);
  assert.equal(badPreview.ok, false);
  assert.ok(badPreview.errors.some((e) => e.includes("annotation")), "señala el registro inválido");

  const replaceWithoutConfirm = store.importProgress(store.exportProgress(), { mode: "replace" });
  assert.equal(replaceWithoutConfirm.ok, false);
  assert.equal(replaceWithoutConfirm.safetyCopy, false);
  assert.equal(store.importProgress({}, { mode: "merge" }).ok, false);
  assert.equal(store.importProgress(store.exportProgress(), { mode: "otro" }).ok, false);

  const huge = "x".repeat(12 * 1024 * 1024 + 10);
  assert.equal(store.previewImport(huge).ok, false);

  assert.equal(JSON.stringify(store.getState()), before, "ninguna importación inválida mutó el estado");
  assert.equal(ctx.storage.getItem("study-backup-preimport-v1"), null);
});

test("clearAllProgress: confirmación, copia previa, resetAt y snapshot en cero", async () => {
  const seed = seedWithState(V1_FIXTURE);
  seed["study-theme"] = "light";
  seed["study-dashboard-mode"] = "full";
  const ctx = await readyStore({ seed });
  ctx.store.annotations.add(ANNOTATION);
  ctx.store.plan.save({ minutesPerDay: 50 });

  const refused = ctx.store.clearAllProgress({});
  assert.equal(refused.ok, false);
  assert.equal(refused.safetyCopy, false);
  assert.equal(ctx.storage.getItem("study-backup-preclear-v1"), null);
  assert.ok(ctx.store.getState().sheets["sheet-aps-02"]);

  const result = ctx.store.clearAllProgress({ confirm: true });
  assert.equal(result.ok, true);
  assert.equal(result.safetyCopy, true);
  assert.ok(result.at);
  const st = ctx.store.getState();
  same(st.sheets, {});
  same(st.cards, {});
  same(st.sessions, []);
  same(st.activity, {});
  same(st.history, []);
  same(st.last, {});
  assert.equal(st.flashSession, null);
  same(st.annotations, {});
  same(st.doubts, {});
  same(st.sheetConfidence, {});
  same(st.sheetReview, {});
  same(st.recall, {});
  same(st.userCards, {});
  assert.equal(st.plan, null);
  same(st.weekly, {});
  same(st.factsKnown, {});
  assert.equal(st.resetAt, result.at);
  assert.equal(st.version, 2);
  same(st.goals, V1_FIXTURE.goals, "objetivo se conserva");
  assert.equal(ctx.storage.getItem("study-theme"), "light", "tema intacto");
  assert.equal(ctx.storage.getItem("study-dashboard-mode"), "full", "modo de lectura intacto");

  const safety = readKey(ctx.storage, "study-backup-preclear-v1");
  assert.equal(safety.format, "serums-study-progress");
  assert.ok(safety.state.sheets["sheet-aps-02"]);
  assert.ok(safety.state.annotations);

  const snapshot = readKey(ctx.storage, "studyhub:snapshot:v1");
  assert.equal(snapshot.hasActivity, false);
  assert.equal(ctx.store.getBackupStatus().hasActivity, false);
});

test("la copia de seguridad previa es obligatoria: si falla, la operación se cancela", async () => {
  const ctx = await readyStore({ seed: seedWithState(V1_FIXTURE) });
  ctx.storage._failOn("study-backup-preimport-v1");
  const imported = ctx.store.importProgress(ctx.store.exportProgress(), { mode: "merge" });
  assert.equal(imported.ok, false);
  assert.equal(imported.safetyCopy, false);
  assert.ok(imported.errors[0].includes("copia de seguridad"));

  ctx.storage._failOn("study-backup-preclear-v1");
  const cleared = ctx.store.clearAllProgress({ confirm: true });
  assert.equal(cleared.ok, false);
  assert.equal(cleared.safetyCopy, false);
  assert.ok(ctx.store.getState().sheets["sheet-aps-02"], "no se borró nada");
});

test("entradas con __proto__ no contaminan el estado normalizado", async () => {
  const evil = JSON.parse('{"version":2,"createdAt":"2026-01-01T00:00:00.000Z","updatedAt":"2026-01-01T00:00:00.000Z","sheets":{"__proto__":{"views":99}},"activity":{"__proto__":{"seconds":99}}}');
  const ctx = await readyStore({ seed: seedWithState(evil) });
  const st = ctx.store.getState();
  assert.deepEqual(Object.keys(st.sheets), []);
  assert.deepEqual(Object.keys(st.activity), []);
  assert.equal({}.views, undefined);
});

test("garantía del plan: minutesPerDay 0 es un valor explícito, no un valor por defecto", async () => {
  const ctx = await readyStore();
  const plan = ctx.store.plan.save({ examDate: null, minutesPerDay: 0, daysPerWeek: 1 });
  assert.equal(plan.minutesPerDay, 0);
  assert.equal(ctx.store.plan.get().minutesPerDay, 0, "get devuelve 0, no 6/null");

  const updated = ctx.store.plan.save({ daysPerWeek: 3 });
  assert.equal(updated.minutesPerDay, 0, "un save parcial conserva el 0");
  assert.equal(updated.daysPerWeek, 3);

  const persisted = readKey(ctx.storage, "study-state-v1");
  assert.equal(persisted.plan.minutesPerDay, 0);

  const reloaded = createStore({ storage: ctx.storage });
  await reloaded.init();
  assert.equal(reloaded.store.plan.get().minutesPerDay, 0, "sobrevive a la recarga");

  ctx.store.plan.remove();
  assert.equal(ctx.store.plan.get(), null, "null solo cuando no hay plan vivo");
});

test("garantía de actividad: activity[día].seconds se escribe y acumula", async () => {
  const ctx = await readyStore();
  const store = ctx.store;

  store.recordSheetView("sheet-aps-01", "topic-aps-atributos", { seconds: 12 });
  let days = store.getState().activity;
  let key = Object.keys(days)[0];
  assert.ok(key);
  assert.equal(days[key].seconds, 12, "la primera vista registra los segundos de meta");

  store.recordSheetTime("sheet-aps-01", 8);
  assert.equal(store.getState().activity[key].seconds, 20, "recordSheetTime acumula");

  store.recordSheetView("sheet-aps-01", "topic-aps-atributos", { seconds: 5 });
  assert.equal(store.getState().activity[key].seconds, 20, "una vista posterior no duplica la lectura");

  store.recordSheetTime("sheet-aps-01", 2);
  assert.equal(store.getState().activity[key].seconds, 20, "menos de 3 s no suma");

  store.recordSheetTime("sheet-aps-01", 7);
  assert.equal(store.getState().activity[key].seconds, 27, "el cierre de la ficha acumula");

  const persisted = readKey(ctx.storage, "study-state-v1");
  assert.equal(persisted.activity[key].seconds, 27, "se persiste en study-state-v1");
});

test("recordatorio de respaldo: cada 7 días, solo con actividad, fuera del JSON", async () => {  const empty = await readyStore();
  same(
    { hasActivity: empty.store.getBackupStatus().hasActivity, due: empty.store.getBackupStatus().due },
    { hasActivity: false, due: false }
  );

  const ctx = await readyStore();
  ctx.store.recordSheetView("sheet-aps-01", "topic-aps-atributos");
  let status = ctx.store.getBackupStatus();
  assert.equal(status.hasActivity, true);
  assert.equal(status.neverExported, true);
  assert.equal(status.due, true);

  ctx.store.markBackupExported();
  status = ctx.store.getBackupStatus();
  assert.equal(status.neverExported, false);
  assert.equal(status.daysSinceExport, 0);
  assert.equal(status.due, false);

  const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString();
  ctx.store.markBackupExported(eightDaysAgo);
  status = ctx.store.getBackupStatus();
  assert.equal(status.due, true);
  assert.ok(status.daysSinceExport >= 8);

  ctx.store.snoozeBackupReminder();
  assert.equal(ctx.store.getBackupStatus().due, false);

  const exported = ctx.store.exportProgress();
  const text = JSON.stringify(exported);
  assert.equal(text.includes("study-backup-meta"), false);
  assert.equal(text.includes("lastExportAt"), false);
  assert.equal(exported.state.lastExportAt, undefined);
  assert.ok(readKey(ctx.storage, "study-backup-meta-v1").lastExportAt);
});

test("H13: dos vistas de la misma ficha dejan una sola entrada y la más reciente arriba", async () => {
  const ctx = await readyStore();
  const store = ctx.store;

  store.recordSheetView("sheet-aps-01", "topic-aps-atributos");
  const firstAt = store.getHistory(10)[0].at;
  await sleep(5);
  store.recordSheetView("sheet-aps-01", "topic-aps-atributos");
  let history = store.getHistory(10);
  assert.equal(history.length, 1, "no duplica la ficha");
  assert.equal(history[0].id, "sheet-aps-01");
  assert.ok(history[0].at >= firstAt);

  store.recordSheetView("sheet-aps-02", "topic-aps-atributos");
  history = store.getHistory(10);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, "sheet-aps-02");

  await sleep(5);
  store.recordSheetView("sheet-aps-01", "topic-aps-atributos");
  history = store.getHistory(10);
  assert.equal(history.length, 2, "sigue sin duplicar");
  assert.equal(history[0].id, "sheet-aps-01", "la vista más reciente sube al principio");
  assert.equal(history[1].id, "sheet-aps-02");

  /* El merge con el estado persistido tampoco reintroduce la entrada vieja. */
  const persisted = readKey(ctx.storage, "study-state-v1");
  const sameSheetEntries = persisted.history.filter((h) => h.type === "sheet" && h.id === "sheet-aps-01");
  assert.equal(sameSheetEntries.length, 1);
});

test("importar un estado v1 con sobre válido migra sin pérdida", async () => {
  const ctx = await readyStore();
  const envelope = {
    format: "serums-study-progress",
    schema: 1,
    app: "study-dashboard",
    appVersion: "2.3.0",
    contentVersion: "2.5.0",
    exportedAt: "2026-10-25T22:06:11.163Z",
    state: V1_FIXTURE
  };
  const preview = ctx.store.previewImport(envelope);
  assert.equal(preview.ok, true);
  assert.ok(preview.warnings.some((w) => w.includes("esquema 1")));
  assert.equal(preview.summary.sheets, 1);
  assert.equal(preview.summary.cardsReviewed, 1);

  const result = ctx.store.importProgress(envelope, { mode: "merge" });
  assert.equal(result.ok, true);
  const st = ctx.store.getState();
  same(st.sheets, V1_FIXTURE.sheets);
  same(st.cards, V1_FIXTURE.cards);
  same(st.flashSession, V1_FIXTURE.flashSession);
  assert.equal(st.version, 2);
  assert.equal(st.schemaVersion, 2);
  assert.equal(st.resetAt, null);
});
