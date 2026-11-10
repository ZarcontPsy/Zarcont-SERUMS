/* Pruebas de la vista #/ruta (Fase 2, módulo plan-ruta).
   Render puro en Node: sin DOM, sin navegador y sin red. El módulo se apoya en
   el runtime solo para formatear y en el modelo real para construir la vista.
   Ejecutar: node --test study-dashboard/tests/unit/plan

   © 2026 ZARCONT */
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Model = require(fileURLToPath(new URL("../../../js/plan/plan-model.js", import.meta.url)));
const viewPath = fileURLToPath(new URL("../../../js/plan/plan.ruta.js", import.meta.url));
const View = require(viewPath);

const NOW = "2026-11-10T06:00:00-05:00";

const CONTENT = {
  primaryAreas: [{ id: "area-psi-cuidado-integral", title: "Área II · Cuidado integral" }],
  categories: [{ id: "cat-ci-aps", title: "Atención primaria y modelo de cuidado", areaId: "area-psi-cuidado-integral" }]
};

function sheet(id, minutes, extra) {
  return Object.assign({
    id,
    title: "Ficha " + id,
    minutes,
    areaId: "area-psi-cuidado-integral",
    categoryId: "cat-ci-aps",
    done: false
  }, extra || {});
}

function baseInput(overrides) {
  return Object.assign({
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 45,
    daysPerWeek: 6,
    budgetMinutes: 45,
    areaPriority: {},
    sheets: [sheet("s1", 10), sheet("s2", 20), sheet("s3", 15)],
    reviews: [{ sheetId: "s1", dueDate: "2026-11-08", intervalDays: 2 }],
    doubts: [{ id: "d1", sheetId: "s2", note: "No entiendo el criterio", createdAt: "2026-11-07T10:00:00-05:00" }],
    cardsDue: 12,
    states: { sheets: {}, confidence: {}, cards: {}, recall: [] },
    cardSheet: {},
    categories: CONTENT.categories,
    categoryArea: { "cat-ci-aps": "area-psi-cuidado-integral" },
    activity: { "2026-11-09": { sheetViews: 4, sheetCompletions: 3, cardReviews: 20, correct: 17, wrong: 3, seconds: 1800 } },
    planRecord: {
      id: "plan",
      examDate: "2026-11-30",
      minutesPerDay: 45,
      daysPerWeek: 6,
      areaPriority: {},
      deleted: false
    }
  }, overrides || {});
}

function withPlan(input) {
  const copy = Object.assign({}, input);
  copy.plan = {
    examDate: copy.planRecord ? copy.planRecord.examDate : null,
    minutesPerDay: copy.planRecord ? copy.planRecord.minutesPerDay : null,
    daysPerWeek: copy.planRecord ? copy.planRecord.daysPerWeek : null
  };
  return copy;
}

function fakeRuntime(input, overrides) {
  const base = {
    escape(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },
    icon(name, size) { return '<svg data-icon="' + name + '" width="' + (size || 16) + '"></svg>'; },
    plural(n, one, many) { return Number(n) === 1 ? one : (many || one + "s"); },
    format: {
      date(key) { return String(key || ""); },
      weekday() { return ""; },
      minutes(n) { return String(n) + " min"; },
      days(n) { return String(n) + " días"; }
    },
    content() { return CONTENT; },
    categories() { return CONTENT.categories; },
    plan() { return input.planRecord || null; },
    input() { return input; },
    model() { return Model; },
    ensureModel() { return Promise.resolve(Model); }
  };
  return Object.assign(base, overrides || {});
}

function setRuntime(runtime) {
  globalThis.StudyPlanRuntime = runtime;
}

function fakeWeeklyStore() {
  const state = { calls: 0, records: {} };
  return {
    __state: state,
    weekly: {
      get(weekStart) { return state.records[weekStart] || null; },
      save(record) {
        state.calls += 1;
        state.records[record.weekStart] = Object.assign({ id: "semana" }, record);
        return state.records[record.weekStart];
      },
      list() { return Object.keys(state.records); }
    }
  };
}

afterEach(() => {
  delete globalThis.StudyPlanRuntime;
  View.unmount();
  View.__page.ctx = null;
});

/* ------------------------------------------------------------------ */
/* Registro                                                            */
/* ------------------------------------------------------------------ */

test("se registra como módulo `plan-ruta` con ruta `ruta`, título y restoreScroll", () => {
  let captured = null;
  const app = {
    registerModule(def) { captured = def; return def; },
    getRoute() { return { name: "ruta" }; }
  };
  assert.equal(View.register({ StudyApp: app }), true);
  assert.ok(captured);
  assert.equal(captured.id, "plan-ruta");
  assert.equal(captured.routes.length, 1);
  assert.equal(captured.routes[0].path, "ruta");
  assert.equal(captured.routes[0].title, "Ruta de hoy");
  assert.equal(captured.routes[0].restoreScroll, true);
  assert.equal(typeof captured.routes[0].render, "function");
  assert.equal(typeof captured.routes[0].mount, "function");
  assert.equal(typeof captured.routes[0].unmount, "function");
  assert.equal(View.view, "ruta");
  assert.equal(View.titleId, "plan-ruta-title");
});

test("el armazón trae los selectores QA y un único h1", () => {
  setRuntime(fakeRuntime(baseInput()));
  const html = View.render({ root: null });
  assert.match(html, /<section class="plan-ruta" data-plan-view="ruta"/);
  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.match(html, /id="plan-ruta-title"/);
  assert.match(html, /data-plan-loading/);
  assert.match(html, /data-plan-error/);
  assert.match(html, /data-plan-content/);
  assert.match(html, /data-plan-link="plan"/);
  assert.doesNotMatch(html, /href="#\/ruta"/, "la vista no se enlaza a sí misma");
  assert.match(html, /Cargando la ruta de hoy/);
  assert.doesNotMatch(html, /\d+ min/, "el armazón no trae cifras");
});

/* ------------------------------------------------------------------ */
/* Contenido: plan, ruta y enlaces                                     */
/* ------------------------------------------------------------------ */

test("con plan: estado con data-balance, resumen, medidor e ítems con motivo", () => {
  setRuntime(fakeRuntime(withPlan(baseInput())));
  const view = View.build(withPlan(baseInput()), Model);
  const html = View.contentHTML(view, { flashcardsHref: "http://example.test/flashcards", planRecord: view.planRecord || baseInput().planRecord });

  assert.equal(view.route.status, "lista");
  assert.match(html, /data-plan-route-status/);
  assert.match(html, /data-balance="(ahead|onTrack|behind)"/);
  assert.match(html, /data-status="lista"/);
  assert.match(html, /data-plan-summary/);
  assert.match(html, /Examen/);
  assert.match(html, /data-plan-weekly/);
  assert.equal((html.match(/class="plan-item plan-route-item"/g) || []).length, view.route.items.length);
  for (const item of view.route.items) {
    assert.ok(item.reason.length > 10, item.id);
    assert.ok(item.minutes > 0, item.id);
  }
});

test("acciones: repaso → #/repaso, ficha → #/ficha, duda → #/dudas, tarjetas → Flashcards", () => {
  setRuntime(fakeRuntime(withPlan(baseInput())));
  const view = View.build(withPlan(baseInput()), Model);
  const html = View.contentHTML(view, { flashcardsHref: "http://example.test/flashcards", planRecord: baseInput().planRecord });
  assert.match(html, /href="#\/repaso"/);
  assert.match(html, /href="#\/dudas"/);
  assert.match(html, /href="#\/ficha\/s[123]"/);
  assert.match(html, /href="http:\/\/example\.test\/flashcards"[^>]*target="_blank"/);
  assert.doesNotMatch(html, /href="#\/ficha\/s1"[^>]*>Repasar ficha/, "el repaso no abre la ficha");
});

test("el medidor escribe «min de min» con separación (sin «minde»)", () => {
  setRuntime(fakeRuntime(withPlan(baseInput())));
  const view = View.build(withPlan(baseInput()), Model);
  const html = View.contentHTML(view, { flashcardsHref: "x", planRecord: baseInput().planRecord });
  assert.match(html, /\d+ min <i>de \d+ min<\/i>/);
  assert.doesNotMatch(html, /mind/);
  /* role="progressbar" necesita nombre accesible (axe aria-progressbar-name). */
  assert.match(html, /role="progressbar" aria-label="Presupuesto de la ruta"/);
});

test("sin plan: se declaran las señales abiertas y la CTA al plan", () => {
  const input = baseInput({ examDate: null, minutesPerDay: null, budgetMinutes: null, planRecord: null });
  setRuntime(fakeRuntime(input));
  const view = View.build(input, Model);
  assert.equal(view.route.status, "sinPresupuesto");
  assert.equal(view.route.items.length, 0);
  assert.equal(view.signals.reviewsDue, 1);
  assert.equal(view.signals.doubtsOpen, 1);
  assert.equal(view.signals.cardsDue, 12);
  assert.equal(view.signals.pendingSheets, 3);

  const html = View.contentHTML(view, { flashcardsHref: "http://example.test/flashcards", planRecord: null });
  assert.match(html, /data-plan-signals/);
  assert.match(html, /Señales abiertas/);
  assert.match(html, /href="#\/plan"[^>]*data-nav>Configurar el plan/);
  assert.match(html, /href="#\/repaso"/);
  assert.match(html, /href="#\/dudas"/);
  assert.match(html, /data-plan-weekly/);
  assert.doesNotMatch(html, /plan-route-item/);
});

test("por presupuesto 0 y todo completado: estados honestos, sin ítems", () => {
  const zero = withPlan(baseInput({ minutesPerDay: 0, budgetMinutes: 0 }));
  zero.planRecord = Object.assign({}, baseInput().planRecord, { minutesPerDay: 0 });
  setRuntime(fakeRuntime(zero));
  let view = View.build(zero, Model);
  assert.equal(view.route.status, "sinTiempo");
  let html = View.contentHTML(view, { flashcardsHref: "x", planRecord: zero.planRecord });
  assert.match(html, /data-plan-empty/);
  assert.match(html, /0 minutos/);
  assert.match(html, /data-plan-link="plan"/);

  const done = baseInput({
    sheets: [sheet("s1", 10, { done: true })],
    reviews: [],
    doubts: [],
    cardsDue: 0
  });
  setRuntime(fakeRuntime(withPlan(done)));
  view = View.build(withPlan(done), Model);
  assert.equal(view.route.status, "todoCompletado");
  html = View.contentHTML(view, { flashcardsHref: "x", planRecord: done.planRecord });
  assert.match(html, /Día libre/);
  assert.doesNotMatch(html, /plan-route-item/);
});

test("escapa el texto del temario y del usuario", () => {
  const input = withPlan(baseInput());
  input.sheets = [sheet("s1", 10, { title: '<img src=x onerror="alert(1)">' })];
  input.reviews = [];
  input.doubts = [{ id: "d1", note: "<script>alert(1)</script>", createdAt: "2026-11-07T10:00:00-05:00" }];
  setRuntime(fakeRuntime(input));
  const view = View.build(input, Model);
  const html = View.contentHTML(view, { flashcardsHref: "x", planRecord: input.planRecord });
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;img src=x/);
});

test("plan sin fecha o con fecha pasada: no promete un estado que no toca", () => {
  const noDate = withPlan(baseInput({ examDate: null }));
  noDate.plan = { examDate: null, minutesPerDay: 45, daysPerWeek: 6 };
  noDate.planRecord = Object.assign({}, baseInput().planRecord, { examDate: null });
  setRuntime(fakeRuntime(noDate));
  let view = View.build(noDate, Model);
  let html = View.contentHTML(view, { flashcardsHref: "x", planRecord: noDate.planRecord });
  assert.equal(view.route.status, "lista");
  assert.equal(view.route.plan.balance, null);
  assert.match(html, /data-balance=""/);
  assert.match(html, /Sin fecha de examen/);

  const past = withPlan(baseInput({ examDate: "2026-11-01" }));
  past.plan = { examDate: "2026-11-01", minutesPerDay: 45, daysPerWeek: 6 };
  past.planRecord = Object.assign({}, baseInput().planRecord, { examDate: "2026-11-01" });
  setRuntime(fakeRuntime(past));
  view = View.build(past, Model);
  html = View.contentHTML(view, { flashcardsHref: "x", planRecord: past.planRecord });
  assert.equal(view.route.plan.status, "fechaPasada");
  assert.match(html, /La fecha de examen ya pasó/);
});

/* ------------------------------------------------------------------ */
/* Escritura del resumen semanal                                       */
/* ------------------------------------------------------------------ */

test("el resumen semanal se guarda una vez y no se duplica", () => {
  const input = withPlan(baseInput());
  setRuntime(fakeRuntime(input));
  const store = fakeWeeklyStore();
  View.__page.ctx = { store };
  const view = View.build(input, Model);
  const first = View.persistWeekly(view.weekly);
  assert.ok(first);
  assert.equal(store.__state.calls, 1);
  const second = View.persistWeekly(view.weekly);
  assert.ok(second);
  assert.equal(store.__state.calls, 1, "el mismo resumen no se reescribe");
  assert.equal(store.weekly.list().length, 1);
  assert.equal(store.weekly.list()[0], view.weekly.weekStart);
});

test("un resumen con más actividad actualiza la misma semana", () => {
  const input = withPlan(baseInput());
  setRuntime(fakeRuntime(input));
  const store = fakeWeeklyStore();
  View.__page.ctx = { store };
  const first = View.build(input, Model);
  View.persistWeekly(first.weekly);
  assert.equal(store.__state.calls, 1);

  const more = Object.assign({}, input, {
    activity: {
      "2026-11-09": { sheetViews: 4, sheetCompletions: 3, cardReviews: 20, correct: 17, wrong: 3, seconds: 1800 },
      "2026-11-10": { sheetViews: 2, sheetCompletions: 1, cardReviews: 5, correct: 5, wrong: 0, seconds: 600 }
    }
  });
  setRuntime(fakeRuntime(more));
  const second = View.build(more, Model);
  View.persistWeekly(second.weekly);
  assert.equal(store.__state.calls, 2);
  assert.equal(store.weekly.list().length, 1, "sigue habiendo una sola semana");
});

test("sin actividad también se registra la semana, sin cifras inventadas", () => {
  const input = withPlan(baseInput({ activity: {} }));
  setRuntime(fakeRuntime(input));
  const store = fakeWeeklyStore();
  View.__page.ctx = { store };
  const view = View.build(input, Model);
  assert.equal(view.weekly.status, "sinDatos");
  const saved = View.persistWeekly(view.weekly);
  assert.ok(saved, "la semana queda registrada");
  assert.equal(store.__state.calls, 1);
  assert.equal(saved.status, "sinDatos");
  assert.equal(saved.activity.sheetViews, null);
  const html = View.contentHTML(view, { flashcardsHref: "x", savedWeekly: saved, planRecord: input.planRecord });
  assert.match(html, /data-weekly-status="sinDatos"/);
  assert.match(html, /Sin actividad todavía|sin actividad/i);
});

test("weeklyPayload normaliza números y no inventa señales", () => {
  const input = withPlan(baseInput());
  setRuntime(fakeRuntime(input));
  const view = View.build(input, Model);
  const payload = View.weeklyPayload(view.weekly);
  assert.equal(payload.weekStart, view.weekly.weekStart);
  assert.equal(payload.status, "ok");
  assert.equal(payload.activity.sheetViews, 4);
  assert.equal(payload.activity.minutesRead, 30);
  assert.equal(payload.mastery.coverage, 0.3);
  assert.deepEqual(payload.priority.map((item) => item.kind).sort(), ["duda", "ficha", "repaso"]);
  assert.equal(payload.pending.sheets, 3);
  assert.equal(payload.pending.reviewsDue, 1);
  assert.ok(!("warnings" in payload));
});

/* ------------------------------------------------------------------ */
/* Bordes del módulo                                                   */
/* ------------------------------------------------------------------ */

test("sin modelo no rompe: devuelve vista vacía y el armazón sigue", () => {
  setRuntime(fakeRuntime(baseInput()));
  const view = View.build(baseInput(), null);
  assert.equal(view.route, null);
  assert.equal(view.weekly, null);
  const html = View.contentHTML(view, {});
  assert.match(html, /data-plan-empty/);
  assert.match(html, /No pude construir la ruta/);
});

test("errorHTML escapa el mensaje e incluye reintento", () => {
  const html = View.errorHTML('Fallo <b>"real"</b>');
  assert.match(html, /&lt;b&gt;/);
  assert.match(html, /data-plan-action="retry-model"/);
  assert.match(html, /Volver a intentar/);
});

test("unmount sin DOM no lanza y limpia el estado de la página", () => {
  assert.doesNotThrow(() => View.unmount());
  assert.equal(View.__page.section, null);
  assert.equal(View.__page.content, null);
});

test("sin StudyApp, register devuelve false y no rompe", () => {
  assert.equal(View.register({}), false);
  assert.equal(View.register({ StudyApp: {} }), false);
});

test("carga como script clásico: window.StudyPlanRuta, sin module y sin auto-registro", () => {
  const source = fs.readFileSync(viewPath, "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  sandbox.window = sandbox;
  vm.runInContext(source, sandbox, { filename: "plan.ruta.js" });
  assert.equal(typeof sandbox.StudyPlanRuta, "object");
  assert.equal(typeof sandbox.StudyPlanRuta.render, "function");
  assert.equal(typeof sandbox.StudyPlanRuta.mount, "function");
  assert.equal(sandbox.StudyPlanRuta.__registered, false);
  assert.equal(sandbox.StudyPlanRuta.view, "ruta");
});
