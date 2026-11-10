/* © 2026 ZARCONT — Pruebas del campo areaPriority del plan (Fase 2 §5).
   Comando: node --test study-dashboard/tests/data (o el glob de tests). */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  V1_FIXTURE,
  createStore,
  seedWithState,
  readKey
} = require("./helpers.js");

const AREAS = {
  "area-psi-salud-publica": 2,
  "area-psi-cuidado-integral": 1.5,
  "area-psi-etica": 1
};

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}
function same(actual, expected, message) {
  assert.deepEqual(plain(actual), JSON.parse(JSON.stringify(expected)), message || "estructura");
}
async function readyStore(options) {
  const ctx = createStore(options);
  await ctx.init();
  return ctx;
}

test("plan.areaPriority: save/get, copia defensiva y conservación en guardados parciales", async () => {
  const ctx = await readyStore({ seed: seedWithState(V1_FIXTURE) });
  const store = ctx.store;
  const cardsBefore = plain(store.getState().cards);
  const flashBefore = plain(store.getState().flashSession);
  const bus = [];
  ctx.window.StudyApp = {
    events: {
      emit: function (name, detail) { bus.push({ name: name, detail: detail }); }
    }
  };

  const saved = store.plan.save({
    examDate: "2027-04-12",
    minutesPerDay: 90,
    daysPerWeek: 6,
    areaPriority: AREAS
  });
  assert.ok(saved);
  same(saved.areaPriority, AREAS);
  assert.equal(saved.examDate, "2027-04-12");
  assert.equal(saved.minutesPerDay, 90);
  assert.equal(saved.daysPerWeek, 6);
  const planEvent = bus.filter(function (item) { return item.name === "plan:changed"; }).pop();
  assert.ok(planEvent, "emite plan:changed");
  same(planEvent.detail.plan.areaPriority, AREAS, "el evento lleva areaPriority");

  const got = store.plan.get();
  same(got.areaPriority, AREAS);
  got.areaPriority["area-psi-etica"] = 9;
  same(store.plan.get().areaPriority, AREAS, "get devuelve copia");

  const partial = store.plan.save({ minutesPerDay: 30 });
  same(partial.areaPriority, AREAS, "un save parcial conserva areaPriority");
  assert.equal(partial.examDate, "2027-04-12");
  assert.equal(partial.daysPerWeek, 6);
  assert.equal(partial.minutesPerDay, 30);

  const undefinedPatch = store.plan.save({ areaPriority: undefined });
  same(undefinedPatch.areaPriority, AREAS, "undefined no borra las prioridades");

  const persisted = readKey(ctx.storage, "study-state-v1");
  same(persisted.plan.areaPriority, AREAS);

  const reloaded = createStore({ storage: ctx.storage });
  await reloaded.init();
  same(reloaded.store.plan.get().areaPriority, AREAS, "sobrevive a la recarga");

  assert.deepEqual(plain(store.getState().cards), cardsBefore, "cards intactas");
  assert.deepEqual(plain(store.getState().flashSession), flashBefore, "flashSession intacto");

  const emptied = store.plan.save({ areaPriority: {} });
  same(emptied.areaPriority, {}, "un objeto vacío limpia prioridades");
});

test("plan.areaPriority: valores inválidos se ignoran y tipos no objeto se rechazan", async () => {
  const ctx = await readyStore();
  const store = ctx.store;

  assert.equal(store.plan.save({ areaPriority: [] }), null, "array no es objeto plano");
  assert.equal(store.plan.save({ areaPriority: null }), null, "null no es objeto plano");
  assert.equal(store.plan.save({ areaPriority: "2" }), null, "texto no es objeto plano");
  assert.equal(store.plan.get(), null, "los intentos inválidos no crean plan");

  const dirty = JSON.parse(
    '{"area-psi-salud-publica":2,"good":1.5,"zero":0,"negative":-2,"string":"2","bool":true,"__proto__":9,"":4}'
  );
  dirty.nan = NaN;
  dirty.inf = Infinity;

  const plan = store.plan.save({ areaPriority: dirty });
  assert.ok(plan, "el objeto válido se guarda aunque tenga claves inválidas");
  same(plan.areaPriority, {
    "area-psi-salud-publica": 2,
    good: 1.5
  });
  same(store.plan.get().areaPriority, plan.areaPriority);
  assert.equal({}.polluted, undefined, "sin contaminación de prototipo");

  const notArray = store.plan.save({ areaPriority: { " area-psi-etica ": 2 } });
  same(notArray.areaPriority, { "area-psi-etica": 2 }, "la clave se recorta");
});

test("plan.areaPriority: compatibilidad con estados v1/v2 sin el campo y export/import", async () => {
  const oldV1 = await readyStore({ seed: seedWithState(V1_FIXTURE) });
  assert.equal(oldV1.store.plan.get(), null, "v1 real no tiene plan");
  const created = oldV1.store.plan.save({ areaPriority: AREAS });
  same(created.areaPriority, AREAS);

  const v2State = {
    version: 2,
    schemaVersion: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    resetAt: null,
    sheets: {},
    cards: {},
    sessions: [],
    activity: {},
    goals: { dailySheets: 2 },
    history: [],
    last: {},
    flashSession: null,
    plan: {
      id: "plan",
      examDate: "2027-04-12",
      minutesPerDay: 60,
      daysPerWeek: 5,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      deleted: false
    }
  };
  const oldV2 = await readyStore({ seed: seedWithState(v2State) });
  same(oldV2.store.plan.get().areaPriority, {}, "v2 sin campo usa {}");
  assert.equal(oldV2.store.plan.get().minutesPerDay, 60);

  const oldExport = oldV2.store.exportProgress();
  delete oldExport.state.plan.areaPriority;
  const target = await readyStore();
  const preview = target.store.previewImport(oldExport);
  assert.equal(preview.ok, true);
  const imported = target.store.importProgress(oldExport, { mode: "replace", confirmReplace: true });
  assert.equal(imported.ok, true);
  same(target.store.plan.get().areaPriority, {}, "import de un estado antiguo");
  assert.equal(target.store.plan.get().examDate, "2027-04-12");

  const source = await readyStore();
  source.store.plan.save({
    examDate: "2027-06-01",
    minutesPerDay: 0,
    daysPerWeek: 3,
    areaPriority: AREAS
  });
  const exported = source.store.exportProgress();
  same(exported.state.plan.areaPriority, AREAS, "exporta el campo");
  const destination = await readyStore();
  assert.equal(destination.store.importProgress(exported, { mode: "replace", confirmReplace: true }).ok, true);
  const roundtrip = destination.store.plan.get();
  same(roundtrip.areaPriority, AREAS, "importa el campo");
  assert.equal(roundtrip.minutesPerDay, 0);
  assert.equal(roundtrip.daysPerWeek, 3);

  const snapshot = destination.store.getSnapshot();
  assert.ok(snapshot && snapshot.hasActivity === false, "sin progreso no se inventa actividad");
});

test("plan.areaPriority: el tombstone conserva el mapa pero get() devuelve null", async () => {
  const ctx = await readyStore();
  const settled = ctx.store.plan.save({ areaPriority: AREAS });
  assert.ok(settled);
  const tombstone = ctx.store.plan.remove();
  assert.equal(tombstone.deleted, true);
  same(tombstone.areaPriority, AREAS, "el tombstone conserva el campo");
  assert.equal(ctx.store.plan.get(), null);
  const exported = ctx.store.exportProgress();
  same(exported.state.plan.areaPriority, AREAS);
  same(ctx.store.plan.save({ areaPriority: { "area-psi-etica": 2 } }).areaPriority, { "area-psi-etica": 2 });
});
