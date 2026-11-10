/* Pruebas del agregador ligero «Ruta de hoy» (Fase 1).
   Ejecutar: node --test study-dashboard/tests/unit/plan

   Cubre: sin actividad, fichas pendientes, solo dudas, solo tarjetas vencidas,
   todo al día, minutos insuficientes, datos incompletos y la regla de no
   inventar tiempos ni razones. También prueba el adaptador real
   (buildInput) con un store simulado y el coste de la agregación.

   © 2026 ZARCONT */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Today = require(fileURLToPath(new URL("../../../js/plan/today.integration.js", import.meta.url)));

const NOW = "2026-11-09T08:00:00-05:00";

const SHEETS = [
  {
    id: "sheet-a",
    title: "Una APS fuerte no es un consultorio de segunda",
    minutes: 6,
    areaId: "area-psi-cuidado-integral",
    categoryId: "cat-ci-aps"
  },
  {
    id: "sheet-b",
    title: "El cuidado integral como punto de partida",
    minutes: 10,
    areaId: "area-psi-cuidado-integral",
    categoryId: "cat-ci-aps"
  },
  {
    id: "sheet-c",
    title: "Ética en la consulta y confidencialidad",
    minutes: 8,
    areaId: "area-psi-etica",
    categoryId: "cat-eti"
  }
];

function doneSheets() {
  return SHEETS.map((sheet) => Object.assign({}, sheet, { done: true }));
}

function routeInput(overrides = {}) {
  return Object.assign({
    now: NOW,
    sheets: SHEETS,
    reviews: [],
    doubts: [],
    cardsDue: 0,
    plan: null,
    hasActivity: false
  }, overrides);
}

function fakeContainer() {
  return {
    innerHTML: "",
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; }
  };
}

function fakeStore(overrides = {}) {
  const state = Object.assign({
    version: 2,
    sheets: {},
    cards: {},
    plan: null,
    last: {}
  }, overrides.state || {});
  return {
    getState() { return state; },
    getDashboardStats() {
      if (overrides.stats) return overrides.stats;
      return {
        hasActivity: overrides.hasActivity === true,
        lastSheet: overrides.lastSheet || null
      };
    },
    sheetReview: {
      list: overrides.reviews || (() => [])
    },
    doubts: {
      list: overrides.doubts || (() => [])
    },
    plan: {
      get: () => (overrides.plan === undefined ? null : overrides.plan)
    },
    urls: {
      appUrl: () => "http://example.test/study-flashcards/index.html?mode=quick&from=dashboard"
    }
  };
}

/* 1. Nuevo sin actividad ------------------------------------------------ */

test("sin actividad: muestra solo la primera ficha y no finge una jornada", () => {
  const model = Today.build(routeInput());

  assert.equal(model.status, "sinActividad");
  assert.equal(model.ok, true);
  assert.equal(model.items.length, 1, "un solo bloque de arranque");
  assert.equal(model.items[0].type, "ficha");
  assert.equal(model.items[0].sheetId, "sheet-a");
  assert.equal(model.items[0].minutes, 6, "minutos declarados en el temario");
  assert.equal(model.items[0].minutesSource, "declarada");
  assert.equal(model.items[0].reason, "Primera ficha pendiente del recorrido.");
  assert.equal(model.budgetMinutes, null);
  assert.equal(model.budgetDeclared, false);
  assert.equal(model.plannedMinutes, 6);
  assert.equal(model.minutesComplete, true);
  assert.equal(model.counts.ficha, 3);
  assert.equal(model.counts.repaso, 0);
  assert.equal(model.counts.tarjetas, 0);
  assert.equal(model.counts.duda, 0);
  assert.equal(model.missing.length, 0);
  assert.ok(model.plan === null);
  assert.ok(model.support.some((line) => /El recorrido tiene 3 fichas pendientes/.test(line)));
  assert.equal(model.items[0].action.href, "#/ficha/sheet-a");
  assert.equal(model.items[0].action.label, "Abrir ficha");
  assert.ok(model.items[0].priority >= 70);
});

/* 2. Con trabajo y fichas pendientes ----------------------------------- */

test("con trabajo: sigue el recorrido desde la última ficha abierta y respeta el presupuesto", () => {
  const model = Today.build(routeInput({
    hasActivity: true,
    lastSheetId: "sheet-b",
    plan: { minutesPerDay: 20, daysPerWeek: 6, examDate: "2027-02-15" }
  }));

  assert.equal(model.status, "lista");
  assert.equal(model.budgetMinutes, 20);
  assert.equal(model.budgetDeclared, true);
  assert.equal(model.items.length, 2, "10 + 8 caben; la de 6 ya no");
  assert.equal(model.items[0].sheetId, "sheet-b");
  assert.equal(model.items[0].isNext, true);
  assert.equal(model.items[0].kind, "Siguiente ficha");
  assert.equal(model.items[0].priority, 78, "70 + 8 por ser la siguiente");
  assert.match(model.items[0].reason, /Continúa donde quedaste/);
  assert.equal(model.items[1].sheetId, "sheet-c");
  assert.match(model.items[1].reason, /orden del temario/);
  assert.equal(model.plannedMinutes, 18);
  assert.equal(model.remainingMinutes, 2);
  assert.equal(model.overload, false);
  assert.equal(model.deferred.ficha, 1);
  assert.equal(model.counts.ficha, 3);
  assert.equal(model.plan.examDate, "2027-02-15");
  for (const item of model.items) {
    assert.ok(item.reason.length > 10, item.id);
    assert.match(item.action.href, /^#\/ficha\//);
  }
});

test("el bloque enlaza a la ruta completa sin cargar el modelo por su cuenta", () => {
  const store = fakeStore({ hasActivity: true, plan: { minutesPerDay: 20, daysPerWeek: 6 } });
  const container = fakeContainer();
  Today.render(container, { store, content: { sheets: SHEETS }, now: NOW });
  assert.match(container.innerHTML, /href="#\/ruta"/);
  assert.match(container.innerHTML, /Ver ruta completa/);
  assert.match(container.innerHTML, /data-nav/);
});

/* 3. Solo dudas --------------------------------------------------------- */
test("solo dudas: las más antiguas primero, 3 min cada una y enlace a #/dudas", () => {
  const model = Today.build(routeInput({
    sheets: doneSheets(),
    hasActivity: true,
    plan: { minutesPerDay: 45, daysPerWeek: 6 },
    doubts: [
      { id: "d2", sheetId: "sheet-b", note: "Diferencia entre APS y consultorio", createdAt: "2026-11-08T10:00:00-05:00" },
      { id: "d1", sheetId: "sheet-a", note: "No entiendo el atributo", createdAt: "2026-11-07T10:00:00-05:00" }
    ]
  }));

  assert.equal(model.status, "lista");
  assert.equal(model.items.length, 2);
  assert.ok(model.items.every((item) => item.type === "duda"));
  assert.equal(model.items[0].title, "No entiendo el atributo");
  assert.equal(model.items[0].minutes, 3);
  assert.equal(model.items[0].minutesSource, "estimada");
  assert.equal(model.items[0].action.href, "#/dudas");
  assert.equal(model.items[0].action.label, "Ver en dudas");
  assert.match(model.items[0].reason, /7 nov 2026/);
  assert.match(model.items[0].reason, /hace 2 días/);
  assert.equal(model.counts.duda, 2);
  assert.equal(model.counts.ficha, 0);
  assert.equal(model.plannedMinutes, 6);
  assert.equal(model.remainingMinutes, 39);
  assert.equal(model.deferred.duda, 0);
});

/* 4. Solo tarjetas vencidas -------------------------------------------- */

test("solo tarjetas vencidas: bloque único, 30 s por tarjeta y enlace a Flashcards", () => {
  const model = Today.build(routeInput({
    sheets: doneSheets(),
    hasActivity: true,
    cardsDue: 12,
    plan: { minutesPerDay: 45, daysPerWeek: 6 },
    flashcardsHref: "http://example.test/study-flashcards/index.html?mode=quick&from=dashboard"
  }));

  assert.equal(model.status, "lista");
  assert.equal(model.items.length, 1);
  assert.equal(model.items[0].type, "tarjetas");
  assert.equal(model.items[0].minutes, 6, "12 tarjetas × 0,5 min");
  assert.equal(model.items[0].count, 12);
  assert.equal(model.items[0].action.external, true);
  assert.match(model.items[0].action.href, /study-flashcards/);
  assert.match(model.items[0].reason, /12 tarjetas vencidas/);
  assert.equal(model.counts.tarjetas, 12);
  assert.equal(model.counts.ficha, 0);
  assert.equal(model.plannedMinutes, 6);
  assert.equal(model.deferred.tarjetas, 0);
});

/* 5. Todo al día -------------------------------------------------------- */

test("todo al día: sin bloques, sin cifras inventadas y plannedMinutes 0", () => {
  const model = Today.build(routeInput({
    sheets: doneSheets(),
    hasActivity: true,
    plan: { minutesPerDay: 45, daysPerWeek: 6 }
  }));

  assert.equal(model.status, "alDia");
  assert.equal(model.ok, true);
  assert.equal(model.items.length, 0);
  assert.equal(model.plannedMinutes, 0);
  assert.equal(model.minutesComplete, true);
  assert.equal(model.remainingMinutes, 45);
  assert.equal(model.counts.ficha, 0);
  assert.equal(model.deferred.ficha, 0);
  assert.match(model.message, /No quedan fichas pendientes/);

  const container = fakeContainer();
  Today.render(container, {
    store: fakeStore({ hasActivity: true, plan: { minutesPerDay: 45, daysPerWeek: 6 } , state: { sheets: {
      "sheet-a": { completedAt: "2026-11-01T10:00:00Z" },
      "sheet-b": { completedAt: "2026-11-02T10:00:00Z" },
      "sheet-c": { completedAt: "2026-11-03T10:00:00Z" }
    } } }),
    content: { sheets: SHEETS },
    now: NOW
  });
  assert.match(container.innerHTML, /Nada pendiente por hoy/);
  assert.doesNotMatch(container.innerHTML, /NaN|undefined|null min/);
});

/* 6. Minutos insuficientes --------------------------------------------- */

test("minutos insuficientes: bloque mínimo declarado y exceso visible", () => {
  const model = Today.build(routeInput({
    hasActivity: true,
    cardsDue: 20,
    plan: { minutesPerDay: 2, daysPerWeek: 6 }
  }));

  assert.equal(model.status, "lista");
  assert.equal(model.items.length, 1, "solo el bloque mínimo");
  assert.equal(model.items[0].type, "ficha");
  assert.equal(model.items[0].sheetId, "sheet-a", "el ítem más corto: 6 min");
  assert.equal(model.minimumBlock, true);
  assert.equal(model.items[0].minimumBlock, true);
  assert.equal(model.items[0].overBudgetMinutes, 4);
  assert.equal(model.plannedMinutes, 6);
  assert.equal(model.remainingMinutes, -4);
  assert.equal(model.overload, true);
  assert.match(model.message, /se pasa 4 min del presupuesto/);
  assert.ok(model.support.some((line) => /bloque dura más que tu presupuesto/.test(line)));
});

/* 7. Datos incompletos -------------------------------------------------- */

test("datos incompletos: las señales ausentes quedan null y se declaran", () => {
  const model = Today.build(routeInput({
    sheets: doneSheets(),
    hasActivity: true,
    signalsMissing: ["duda", "repaso"],
    plan: { minutesPerDay: 45, daysPerWeek: 6 }
  }));

  assert.equal(model.status, "alDia");
  assert.equal(model.items.length, 0);
  assert.equal(model.counts.duda, null, "no se inventa 0");
  assert.equal(model.counts.repaso, null);
  assert.equal(model.signals.duda.present, false);
  assert.equal(model.signals.repaso.present, false);
  assert.deepEqual(model.missing.sort(), ["duda", "repaso"]);
  assert.match(model.message, /señales que pude leer/);
  assert.ok(model.support.some((line) => /No pude leer/.test(line)));
});

test("datos incompletos: sin fecha, sin temario o sin store es estado de error", () => {
  const noNow = Today.build({ sheets: SHEETS, now: null });
  assert.equal(noNow.status, "error");
  assert.equal(noNow.ok, false);
  assert.equal(noNow.items.length, 0);
  assert.equal(noNow.plannedMinutes, 0);
  assert.equal(noNow.budgetMinutes, null);
  assert.equal(noNow.counts.ficha, null);

  const noSheets = Today.build({ now: NOW, sheets: [] });
  assert.equal(noSheets.status, "error");
  assert.match(noSheets.message, /temario llegó vacío/);

  const container = fakeContainer();
  const rendered = Today.render(container, {
    store: { getState() { throw new Error("almacenamiento no disponible"); } },
    content: { sheets: SHEETS },
    now: NOW
  });
  assert.equal(rendered, false);
  assert.match(container.innerHTML, /data-plan-state="error"/);
  assert.match(container.innerHTML, /data-action="retry"/);
  assert.doesNotMatch(container.innerHTML, /\d+ min/, "sin cifras en el error");
  assert.equal(container.attributes["data-plan-state"], "error");
});

test("presupuesto 0: ruta vacía a propósito, sin bloques ni cifras inventadas", () => {
  const model = Today.build(routeInput({
    hasActivity: true,
    cardsDue: 5,
    plan: { minutesPerDay: 0, daysPerWeek: 6 }
  }));

  assert.equal(model.status, "sinTiempo");
  assert.equal(model.items.length, 0);
  assert.equal(model.plannedMinutes, 0);
  assert.equal(model.budgetMinutes, 0);
  assert.equal(model.budgetDeclared, true);
  assert.match(model.message, /0 minutos/);

  const container = fakeContainer();
  Today.render(container, {
    store: fakeStore({
      hasActivity: true,
      plan: { minutesPerDay: 0, daysPerWeek: 6 },
      state: { cards: { "card-1": { reviews: 1, dueAt: "2026-11-08T00:00:00Z" } } }
    }),
    content: { sheets: SHEETS },
    now: NOW
  });
  assert.equal(container.attributes["data-plan-state"], "sinTiempo");
  assert.match(container.innerHTML, /Hoy no hay ruta/);
  assert.doesNotMatch(container.innerHTML, /NaN|undefined/);
});

/* 8. No inventar tiempos ni razones ------------------------------------ */

test("no inventa tiempos: una ficha sin minutos queda «sin dato», no en 6", () => {
  const sheets = [{ id: "sin-minutos", title: "Ficha sin minutos declarados", minutes: null }];
  const model = Today.build(routeInput({
    sheets,
    hasActivity: true,
    plan: { minutesPerDay: 45, daysPerWeek: 6 }
  }));

  assert.equal(model.status, "lista");
  assert.equal(model.items.length, 1);
  assert.equal(model.items[0].minutes, null);
  assert.equal(model.items[0].minutesSource, "desconocida");
  assert.equal(model.plannedMinutes, 0);
  assert.equal(model.minutesComplete, false);
  assert.equal(model.remainingMinutes, 45);
  assert.ok(model.support.some((line) => /no declara minutos/.test(line)));
  assert.ok(model.items[0].reason.length > 10);
  assert.doesNotMatch(model.items[0].kind, /6 min/);

  const container = fakeContainer();
  Today.render(container, {
    store: fakeStore({
      hasActivity: true,
      plan: { minutesPerDay: 45, daysPerWeek: 6 },
      state: { sheets: { "sin-minutos": { viewedAt: "2026-11-08T10:00:00Z" } } }
    }),
    content: { sheets },
    now: NOW
  });
  assert.match(container.innerHTML, /min sin dato/);
  assert.match(container.innerHTML, /sin minutos conocidos/);
  assert.match(container.innerHTML, /al menos|sin minutos/);
});

test("no inventa razones: el motivo de cada bloque sale de datos reales", () => {
  const model = Today.build(routeInput({
    hasActivity: true,
    plan: { minutesPerDay: 60, daysPerWeek: 6 },
    reviews: [{ sheetId: "sheet-a", dueAt: "2026-11-06T05:00:00.000Z" }],
    doubts: [{ id: "d1", sheetId: "sheet-b", quote: "¿Cómo se aplica?", createdAt: "2026-11-07T10:00:00-05:00" }],
    cardsDue: 4
  }));

  const review = model.items.find((item) => item.type === "repaso");
  const doubt = model.items.find((item) => item.type === "duda");
  const cards = model.items.find((item) => item.type === "tarjetas");
  assert.ok(review && doubt && cards);
  assert.match(review.reason, /6 nov 2026/);
  assert.match(review.reason, /hace 3 días/);
  assert.match(doubt.reason, /7 nov 2026/);
  assert.match(doubt.reason, /hace 2 días/);
  assert.match(cards.reason, /4 tarjetas vencidas/);
  /* Fase 2: los repasos abren la vista de repaso, no la ficha. */
  assert.equal(review.action.href, "#/repaso");
  assert.equal(review.action.label, "Repasar ficha");
  for (const item of model.items) {
    assert.ok(item.reason.length > 10, item.id);
    assert.doesNotMatch(item.reason, /lorem|placeholder|ejemplo/i);
  }
});

test("una ficha con repaso vencido no se repite como ficha nueva", () => {
  const model = Today.build(routeInput({
    hasActivity: true,
    plan: { minutesPerDay: 60, daysPerWeek: 6 },
    reviews: [{ sheetId: "sheet-a", dueAt: "2026-11-06T05:00:00.000Z" }]
  }));

  const repasos = model.items.filter((item) => item.type === "repaso");
  const fichas = model.items.filter((item) => item.type === "ficha");
  assert.equal(repasos.length, 1);
  assert.equal(repasos[0].sheetId, "sheet-a");
  assert.equal(fichas.some((item) => item.sheetId === "sheet-a"), false);
  assert.equal(fichas.length, 2);
});

/* 9. Adaptador real ----------------------------------------------------- */

test("adaptador: buildInput lee store y temario, y build produce la ruta", () => {
  const store = fakeStore({
    hasActivity: true,
    lastSheet: { sheetId: "sheet-b" },
    plan: { minutesPerDay: 30, daysPerWeek: 6, examDate: "2027-02-15" },
    reviews: () => [{ sheetId: "sheet-a", dueAt: "2026-11-06T05:00:00.000Z" }],
    doubts: () => [{ id: "d1", sheetId: "sheet-a", note: "Duda real", createdAt: "2026-11-07T10:00:00-05:00" }],
    state: {
      sheets: { "sheet-a": { viewedAt: "2026-11-01T10:00:00Z" } },
      cards: {
        "card-1": { reviews: 2, dueAt: "2026-11-08T00:00:00Z" },
        "card-2": { reviews: 1, dueAt: "2027-01-01T00:00:00Z" },
        "card-3": { reviews: 0 }
      }
    }
  });

  const input = Today.buildInput({
    store,
    content: { sheets: SHEETS },
    now: NOW
  });
  assert.equal(input.fatal, undefined);
  assert.equal(input.sheets.length, 3);
  assert.equal(input.hasActivity, true);
  assert.equal(input.lastSheetId, "sheet-b");
  assert.equal(input.plan.minutesPerDay, 30);
  assert.equal(input.reviews.length, 1);
  assert.equal(input.doubts.length, 1);
  assert.equal(input.cardsDue, 1, "solo la tarjeta repasada y vencida");
  assert.match(input.flashcardsHref, /study-flashcards/);

  const model = Today.build(input);
  assert.equal(model.status, "lista");
  assert.equal(model.budgetMinutes, 30);
  assert.equal(model.items[0].type, "repaso");
  assert.equal(model.plannedMinutes > 0, true);
  assert.ok(model.items.some((item) => item.type === "tarjetas"));
  assert.ok(model.items.some((item) => item.type === "duda"));
});

test("adaptador: una API del store ausente se declara, no se rellena", () => {
  const store = {
    getState: () => ({ sheets: {}, cards: {} }),
    getDashboardStats: () => ({ hasActivity: false, lastSheet: null }),
    plan: { get: () => null },
    urls: {}
  };
  const input = Today.buildInput({ store, content: { sheets: SHEETS }, now: NOW });
  assert.ok(input.signalsMissing.includes("duda"));
  assert.ok(input.signalsMissing.includes("repaso"));

  const model = Today.build(input);
  assert.equal(model.signals.duda.present, false);
  assert.equal(model.signals.repaso.present, false);
  assert.equal(model.counts.duda, null);
  assert.equal(model.counts.repaso, null);
  assert.ok(model.warnings.some((warning) => warning.code === "DATOS_INCOMPLETOS"));
});

/* 10. Coste y pureza --------------------------------------------------- */

test("pureza y coste: no carga plan-model.js y 100 agregaciones son rápidas", () => {
  assert.equal(typeof Today.build, "function");
  assert.equal(typeof Today.render, "function");
  assert.equal(globalThis.StudyPlanToday, undefined, "en Node no se registra en window");
  assert.equal(Today.constants.ROUTE_CAPS.duda, 2);
  assert.deepEqual(Today.states, ["lista", "sinActividad", "alDia", "sinTiempo", "error"]);

  const source = fs.readFileSync(
    fileURLToPath(new URL("../../../js/plan/today.integration.js", import.meta.url)),
    "utf8"
  );
  assert.ok(!/require\([^)]*plan-model/.test(source), "no requiere el modelo completo");
  assert.ok(!/(root|window)\.StudyPlanModel/.test(source), "no llama al modelo de Fase 0 en tiempo de ejecución");
  assert.ok(source.length < 60 * 1024, "el agregador ligero se mantiene por debajo de 60 KB");

  const input = routeInput({
    hasActivity: true,
    cardsDue: 12,
    plan: { minutesPerDay: 45, daysPerWeek: 6 },
    doubts: [{ id: "d1", sheetId: "sheet-a", note: "Una duda", createdAt: "2026-11-07T10:00:00-05:00" }]
  });
  const started = performance.now();
  for (let i = 0; i < 100; i += 1) Today.build(input);
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 1000, `100 agregaciones tardaron ${Math.round(elapsed)} ms`);
});
