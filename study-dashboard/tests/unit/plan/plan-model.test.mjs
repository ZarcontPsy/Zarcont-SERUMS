/* Tests del modelo de planificación · Fase 0
   Sin dependencias: solo `node:test` y el propio módulo UMD.
   Ejecutar: node --test study-dashboard/tests/unit/plan

   © 2026 ZARCONT */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const modulePath = fileURLToPath(new URL("../../../js/plan/plan-model.js", import.meta.url));
const Model = require(modulePath);

/* Lunes 9 de noviembre de 2026, 08:00 en Lima. */
const NOW = "2026-11-09T08:00:00-05:00";

function sheet(id, minutes, area, category) {
  return {
    id: id,
    title: "Ficha " + id,
    minutes: minutes,
    areaId: area || "area-a",
    categoryId: category || "cat-a"
  };
}

function codes(response) {
  return response.warnings.map((warning) => warning.code);
}

function sumMinutes(items) {
  return items.reduce((total, item) => total + item.minutes, 0);
}

/* ==========================================================================
   Módulo y fechas
   ========================================================================== */

test("expone la API UMD esperada y no toca el reloj", () => {
  assert.equal(typeof Model.version, "string");
  for (const name of ["buildPlan", "buildTodayRoute", "masteryFor", "nextSheetReview", "buildWeeklySummary"]) {
    assert.equal(typeof Model[name], "function", name);
  }
  assert.equal(typeof Model.dates.today, "function");
  assert.equal(Model.constants.SIGNAL_WEIGHTS.lectura, 0.3);
  assert.equal(Model.constants.ZONE_OFFSET_MINUTES, -300);
});

test("funciona en navegador: window.StudyPlanModel sin module ni require", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  sandbox.window = sandbox;
  vm.runInContext(source, sandbox, { filename: "plan-model.js" });
  assert.equal(typeof sandbox.StudyPlanModel, "object");
  assert.equal(typeof sandbox.StudyPlanModel.buildPlan, "function");
  assert.equal(typeof sandbox.StudyPlanModel.buildTodayRoute, "function");
  const plan = sandbox.StudyPlanModel.buildPlan({
    now: NOW,
    minutesPerDay: 30,
    daysPerWeek: 5,
    sheets: [sheet("s1", 10)]
  });
  assert.equal(plan.totals.pendingMinutes, 10);
});

test("aritmética civil: mes, año y 29 de febrero", () => {
  assert.equal(Model.dates.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(Model.dates.addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(Model.dates.addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(Model.dates.diffDays("2026-11-09", "2026-11-30"), 21);
  assert.equal(Model.dates.parse("2026-02-30"), null);
  assert.equal(Model.dates.parse("09-11-2026"), null);
});

test("semana que empieza en lunes y fecha legible", () => {
  assert.equal(Model.constants.WEEKDAYS[0], "lunes");
  assert.equal(Model.dates.weekday("2026-11-09"), 0);
  assert.equal(Model.dates.weekday("2026-11-15"), 6);
  assert.equal(Model.dates.startOfWeek("2026-11-11"), "2026-11-09");
  assert.equal(Model.dates.label("2026-11-09"), "9 nov 2026");
  assert.equal(Model.dates.isoWeek("2026-11-09"), "2026-W46");
});

test("una misma hora en Lima y en UTC da el mismo día civil", () => {
  assert.equal(Model.dates.today("2026-11-09T21:33:46-05:00"), "2026-11-09");
  assert.equal(Model.dates.today("2026-11-10T02:33:46Z"), "2026-11-09");
  assert.equal(Model.dates.today("2026-11-09"), "2026-11-09");
  assert.equal(Model.dates.today("no-es-fecha"), null);
});

test("sin `now` válido no calcula: estado sinDatos explícito", () => {
  const plan = Model.buildPlan({ sheets: [sheet("s1", 10)], minutesPerDay: 30 });
  assert.equal(plan.status, "sinDatos");
  assert.equal(plan.calendar.length, 0);
  const route = Model.buildTodayRoute({ sheets: [sheet("s1", 10)], budgetMinutes: 30 });
  assert.equal(route.status, "sinDatos");
  assert.equal(route.items.length, 0);
  const mastery = Model.masteryFor({ sheets: [sheet("s1", 10)] });
  assert.equal(mastery.status, "sinDatos");
  const weekly = Model.buildWeeklySummary({ activity: {} });
  assert.equal(weekly.status, "sinDatos");
});

/* ==========================================================================
   buildPlan
   ========================================================================== */

test("plan holgado: termina antes del examen y lo declara", () => {
  const sheets = Array.from({ length: 10 }, (_, i) => sheet("s" + i, 10));
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 60,
    daysPerWeek: 5,
    sheets
  });
  assert.equal(plan.status, "ok");
  assert.equal(plan.balance, "ahead");
  assert.equal(plan.fits, true);
  assert.equal(plan.totals.pendingSheets, 10);
  assert.equal(plan.totals.pendingMinutes, 100);
  assert.equal(plan.estimatedEndDate, "2026-11-10");
  assert.ok(plan.slackStudyDays >= 1);
  assert.equal(plan.spareMinutes, plan.capacity.minutes - 100);
  assert.equal(
    plan.calendar.reduce((total, day) => total + day.minutes, 0),
    100
  );
  for (const day of plan.calendar) assert.ok(day.minutes <= 60);
  assert.ok(plan.message.includes("Llegas con margen"));
});

test("determinista: mismo input y mismo now producen el mismo plan", () => {
  const input = {
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 45,
    daysPerWeek: 6,
    sheets: [sheet("s1", 10), sheet("s2", 22), sheet("s3", 8)]
  };
  assert.equal(JSON.stringify(Model.buildPlan(input)), JSON.stringify(Model.buildPlan(input)));
});

test("no muta el input", () => {
  const input = {
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 45,
    daysPerWeek: 6,
    sheets: [sheet("s1", 10), sheet("s2", 22)]
  };
  const before = JSON.stringify(input);
  Model.buildPlan(input);
  assert.equal(JSON.stringify(input), before);
});

test("0 minutos por día: sin plan, sin excepciones y sin fechas inventadas", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-12-01",
    minutesPerDay: 0,
    daysPerWeek: 6,
    sheets: [sheet("s1", 10), sheet("s2", 10)]
  });
  assert.equal(plan.status, "sinTiempo");
  assert.equal(plan.balance, "behind");
  assert.equal(plan.fits, false);
  assert.equal(plan.estimatedEndDate, null);
  assert.equal(plan.calendar.length, 0);
  assert.equal(plan.shortfallMinutes, 20);
  assert.ok(codes(plan).includes("PRESUPUESTO_INVALIDO") === false);
  assert.ok(plan.message.includes("0 minutos"));
});

test("presupuesto ausente ≠ 0 minutos", () => {
  const plan = Model.buildPlan({ now: NOW, examDate: "2026-12-01", daysPerWeek: 6, sheets: [sheet("s1", 10)] });
  assert.equal(plan.status, "sinPresupuesto");
  assert.equal(plan.balance, null);
  assert.equal(plan.calendar.length, 0);
  assert.ok(plan.message.includes("no son lo mismo"));
});

test("fecha de examen pasada: no planifica hacia atrás y no promete", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-10-01",
    minutesPerDay: 45,
    daysPerWeek: 6,
    sheets: [sheet("s1", 10), sheet("s2", 10)]
  });
  assert.equal(plan.status, "fechaPasada");
  assert.equal(plan.balance, null);
  assert.equal(plan.fits, null);
  assert.equal(plan.shortfallMinutes, null);
  assert.ok(plan.estimatedEndDate !== null);
  assert.ok(plan.message.includes("ya pasó"));
});

test("sin fecha de examen: plan por capacidad y sin promesa", () => {
  const plan = Model.buildPlan({
    now: NOW,
    minutesPerDay: 30,
    daysPerWeek: 6,
    sheets: [sheet("s1", 30), sheet("s2", 30), sheet("s3", 30)]
  });
  assert.equal(plan.status, "sinFecha");
  assert.equal(plan.balance, null);
  assert.equal(plan.fits, null);
  assert.equal(plan.spareMinutes, null);
  assert.equal(plan.estimatedEndDate, "2026-11-11");
  assert.ok(plan.message.includes("Sin fecha de examen"));
});

test("todo completado: no reparte nada", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-12-01",
    minutesPerDay: 45,
    sheets: [sheet("s1", 10), sheet("s2", 10)].map((item) => ({ ...item, done: true }))
  });
  assert.equal(plan.status, "completado");
  assert.equal(plan.balance, "ahead");
  assert.equal(plan.totals.pendingSheets, 0);
  assert.equal(plan.calendar.length, 0);
});

test("lista de fichas vacía o ausente", () => {
  assert.equal(Model.buildPlan({ now: NOW, minutesPerDay: 30, sheets: [] }).status, "sinFichas");
  assert.equal(Model.buildPlan({ now: NOW, minutesPerDay: 30 }).status, "sinDatos");
});

test("ficha sin minutos: usa 6 por defecto y lo declara", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 30,
    daysPerWeek: 6,
    sheets: [{ id: "s1", title: "Sin minutos", areaId: "area-a", categoryId: "cat-a" }]
  });
  assert.equal(plan.totals.pendingMinutes, 6);
  assert.equal(plan.totals.minutesEstimated, 1);
  assert.ok(codes(plan).includes("MINUTOS_POR_DEFECTO"));
  assert.ok(plan.assumptions.some((item) => item.code === "MINUTOS_POR_DEFECTO"));
  assert.equal(plan.calendar[0].sheets[0].minutesEstimated, true);
  assert.equal(plan.coverage.minutesComplete, false);
});

test("días por semana inválidos no descartan días y se advierte", () => {
  const sheets = Array.from({ length: 6 }, (_, i) => sheet("s" + i, 10));
  for (const value of [0, 9, "abc", 3.5]) {
    const plan = Model.buildPlan({ now: NOW, minutesPerDay: 30, daysPerWeek: value, sheets });
    assert.ok(plan.daysPerWeek >= 1 && plan.daysPerWeek <= 7, String(value));
    if (value !== 3.5) {
      assert.equal(plan.daysPerWeek, 7);
      assert.ok(codes(plan).includes("DIAS_SEMANA_INVALIDO"), String(value));
    }
  }
});

test("5 días por semana: no asigna carga en sábado ni domingo", () => {
  const sheets = Array.from({ length: 12 }, (_, i) => sheet("s" + i, 10));
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-12-04",
    minutesPerDay: 20,
    daysPerWeek: 5,
    sheets
  });
  assert.deepEqual(plan.studyWeekdays, [0, 1, 2, 3, 4]);
  assert.equal(plan.calendar.filter((day) => day.minutes > 0 && day.weekday > 4).length, 0);
});

test("el día del examen no cuenta como día de estudio", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-11",
    minutesPerDay: 10,
    daysPerWeek: 6,
    sheets: [sheet("s1", 10), sheet("s2", 10), sheet("s3", 10)]
  });
  assert.equal(plan.capacity.studyDays, 2);
  assert.equal(plan.capacity.lastStudyDay, "2026-11-10");
  const examDay = plan.calendar.find((day) => day.date === "2026-11-11");
  assert.ok(examDay, "el calendario incluye el día del examen cuando hay contenido después");
  assert.equal(examDay.examDay, true);
  assert.equal(examDay.studyDay, false);
  assert.equal(examDay.minutes, 0);
  const after = plan.calendar.find((day) => day.date === "2026-11-12");
  assert.equal(after.afterExam, true);
  assert.equal(after.minutes, 10);
});

test("no promete llegar cuando las fichas no caben (fragmentación real)", () => {
  /* Capacidad aritmética: 2 días × 10 min = 20 ≥ 18. Pero con bloques de 6
     minutos caben 6 por día, así que el tercer bloque cae después del examen. */
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-11",
    minutesPerDay: 10,
    daysPerWeek: 6,
    sheets: [sheet("s1", 6), sheet("s2", 6), sheet("s3", 6)]
  });
  assert.equal(plan.status, "ok");
  assert.equal(plan.balance, "behind");
  assert.equal(plan.fits, false);
  assert.equal(plan.shortfallMinutes, 6);
  assert.equal(plan.sheetsAfterDeadline, 1);
  assert.equal(plan.capacity.gapMinutes, 2);
  assert.ok(plan.lateDays >= 1);
  assert.ok(plan.message.includes("No alcanza"));
  assert.ok(plan.message.includes("No prometo que llegues"));
  assert.equal(plan.spareMinutes, 0);
});

test("el peso es por minutos, no por número de fichas", () => {
  const sheets = [
    sheet("a1", 40, "area-a"),
    sheet("b1", 10, "area-b"),
    sheet("b2", 10, "area-b"),
    sheet("b3", 10, "area-b")
  ];
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 40,
    daysPerWeek: 6,
    sheets
  });
  assert.equal(plan.areaMinutes["area-a"], 40);
  assert.equal(plan.areaMinutes["area-b"], 30);
  assert.equal(plan.areaShare["area-a"], 40 / 70);
  assert.equal(plan.areas.find((area) => area.id === "area-a").pendingShare, 40 / 70);
  /* El área con más minutos aparece primero pese a tener menos fichas. */
  assert.equal(plan.areas[0].id, "area-a");
});

test("mezcla proporcional: las dos áreas aparecen desde el primer día", () => {
  const sheets = [
    ...Array.from({ length: 10 }, (_, i) => sheet("a" + i, 10, "area-a")),
    ...Array.from({ length: 5 }, (_, i) => sheet("b" + i, 10, "area-b"))
  ];
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-12-30",
    minutesPerDay: 30,
    daysPerWeek: 6,
    sheets
  });
  const firstDayAreas = new Set(plan.calendar[0].sheets.map((item) => item.areaId));
  assert.equal(firstDayAreas.has("area-a"), true);
  assert.equal(firstDayAreas.has("area-b"), true);
  assert.equal(plan.areaShare["area-a"], 100 / 150);
});

test("una ficha más larga que el día ocupa su propio día y se marca", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 10,
    daysPerWeek: 6,
    sheets: [sheet("largo", 25), sheet("corto", 5)]
  });
  assert.ok(codes(plan).includes("FICHA_MAS_LARGA_QUE_EL_DIA"));
  const longDay = plan.calendar.find((day) => day.sheets.some((item) => item.id === "largo"));
  assert.equal(longDay.overBudget, true);
  assert.equal(longDay.minutes, 25);
});

test("feriados se respetan y se marcan en el calendario", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-13",
    minutesPerDay: 60,
    daysPerWeek: 6,
    holidays: ["2026-11-10"],
    sheets: [sheet("s1", 50), sheet("s2", 50)]
  });
  const holiday = plan.calendar.find((day) => day.date === "2026-11-10");
  assert.equal(holiday.holiday, true);
  assert.equal(holiday.studyDay, false);
  assert.equal(holiday.minutes, 0);
  assert.equal(plan.calendar[0].date, "2026-11-09");
  assert.equal(plan.calendar.find((day) => day.minutes > 0 && day.date !== "2026-11-09").date, "2026-11-11");
  assert.equal(plan.estimatedEndDate, "2026-11-11");
});

test("fichas duplicadas, sin id y sin área: se declaran, no se inventan", () => {
  const plan = Model.buildPlan({
    now: NOW,
    minutesPerDay: 60,
    sheets: [
      sheet("s1", 10),
      sheet("s1", 10),
      { id: "", minutes: 10 },
      { minutes: 10 },
      { id: "s2", minutes: 10 }
    ]
  });
  assert.equal(plan.totals.sheets, 2);
  assert.ok(codes(plan).includes("FICHAS_DUPLICADAS"));
  assert.ok(codes(plan).includes("FICHAS_DESCARTADAS"));
  assert.equal(plan.coverage.sheetsSkipped, 2);
  assert.equal(plan.areaMinutes["sin-area"], 10);
});

test("sesión de hoy y siguiente ficha del plan", () => {
  const sheets = [sheet("s1", 20), sheet("s2", 20), sheet("s3", 20)];
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-30",
    minutesPerDay: 30,
    daysPerWeek: 6,
    sheets
  });
  assert.equal(plan.session.date, "2026-11-09");
  assert.equal(plan.session.isToday, true);
  assert.equal(plan.session.minutes, 20);
  assert.equal(plan.nextSheet.id, "s1");
});

test("prioridad de área arranca por esa área pero reparte todos los minutos", () => {
  const sheets = [
    ...Array.from({ length: 6 }, (_, i) => sheet("a" + i, 10, "area-a")),
    ...Array.from({ length: 6 }, (_, i) => sheet("b" + i, 10, "area-b"))
  ];
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-12-30",
    minutesPerDay: 30,
    daysPerWeek: 6,
    sheets,
    areaPriority: { "area-b": 2 }
  });
  assert.equal(plan.calendar[0].sheets[0].areaId, "area-b");
  assert.equal(plan.areaMinutes["area-a"], 60);
  assert.equal(plan.areaMinutes["area-b"], 60);
  assert.equal(plan.areas.find((area) => area.id === "area-b").priority, 2);
});

test("presupuesto por encima de 1440 se limita y se advierte", () => {
  const plan = Model.buildPlan({
    now: NOW,
    minutesPerDay: 5000,
    daysPerWeek: 6,
    sheets: [sheet("s1", 10)]
  });
  assert.equal(plan.minutesPerDay, 1440);
  assert.ok(codes(plan).includes("PRESUPUESTO_AJUSTADO"));
});

test("la fecha de examen inválida se trata como ausente y se advierte", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "15/01/2027",
    minutesPerDay: 30,
    sheets: [sheet("s1", 10)]
  });
  assert.equal(plan.status, "sinFecha");
  assert.equal(plan.examDate, null);
  assert.ok(codes(plan).includes("FECHA_INVALIDA"));
});

/* ==========================================================================
   buildTodayRoute
   ========================================================================== */

test("ruta con 0 minutos: vacía a propósito", () => {
  const route = Model.buildTodayRoute({ now: NOW, budgetMinutes: 0, sheets: [sheet("s1", 10)] });
  assert.equal(route.status, "sinTiempo");
  assert.equal(route.items.length, 0);
  assert.equal(route.plannedMinutes, 0);
  assert.equal(route.remainingMinutes, 0);
  assert.ok(route.message.includes("0 minutos declarados"));
});

test("ruta sin presupuesto declarado", () => {
  const route = Model.buildTodayRoute({ now: NOW, sheets: [sheet("s1", 10)] });
  assert.equal(route.status, "sinPresupuesto");
  assert.equal(route.items.length, 0);
});

test("ruta con todo completado", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 45,
    sheets: [sheet("s1", 10), sheet("s2", 10)].map((item) => ({ ...item, done: true }))
  });
  assert.equal(route.status, "todoCompletado");
  assert.equal(route.ok, true);
  assert.equal(route.allCompleted, true);
  assert.equal(route.items.length, 0);
  assert.ok(route.message.includes("Día libre"));
});

test("ruta sin ninguna señal", () => {
  const route = Model.buildTodayRoute({ now: NOW, budgetMinutes: 30 });
  assert.equal(route.status, "sinDatos");
  const emptyList = Model.buildTodayRoute({ now: NOW, budgetMinutes: 30, sheets: [] });
  assert.equal(emptyList.status, "sinDatos");
  assert.equal(emptyList.items.length, 0);
});

test("repasos vencidos: primero lo más atrasado y con razón explícita", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [sheet("s1", 10), sheet("s2", 10)],
    reviews: [
      { sheetId: "s1", dueDate: "2026-11-08" },
      { sheetId: "s2", dueDate: "2026-11-01" }
    ]
  });
  assert.equal(route.status, "lista");
  assert.equal(route.items[0].type, "repaso");
  assert.equal(route.items[0].sheetId, "s2");
  assert.equal(route.items[0].overdueDays, 8);
  assert.equal(route.items[0].minutes, 5);
  assert.ok(route.items[0].reason.includes("hace 8 días"));
  assert.equal(route.items[0].action.kind, "repasar-ficha");
  assert.equal(route.items[0].action.href, "#/ficha/s2");
  assert.ok(route.items[0].minutesSource === "estimada");
});

test("repasos futuros no entran en la ruta de hoy", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [sheet("s1", 10)],
    reviews: [{ sheetId: "s1", dueDate: "2026-11-20" }]
  });
  assert.equal(route.counts.repaso, 0);
  assert.equal(route.items.filter((item) => item.type === "repaso").length, 0);
});

test("repaso con ficha desconocida se excluye y se declara", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [sheet("s1", 10)],
    reviews: [{ sheetId: "fantasma", dueDate: "2026-11-01" }]
  });
  assert.equal(route.excluded.repaso, 1);
  assert.ok(codes(route).includes("REPASO_SIN_FICHA"));
  assert.equal(route.items.filter((item) => item.type === "repaso").length, 0);
});

test("repasos repetidos de la misma ficha se cuentan una vez", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [sheet("s1", 10)],
    reviews: [
      { sheetId: "s1", dueDate: "2026-11-01" },
      { sheetId: "s1", dueDate: "2026-11-05" }
    ]
  });
  assert.equal(route.counts.repaso, 1);
  assert.ok(codes(route).includes("REPASO_DUPLICADO"));
  const item = route.items.find((entry) => entry.type === "repaso");
  assert.equal(item.overdueDays, 8);
});

test("el día del examen: no quedan días y el mensaje lo dice sin prometer", () => {
  const plan = Model.buildPlan({
    now: NOW,
    examDate: "2026-11-09",
    minutesPerDay: 30,
    daysPerWeek: 6,
    sheets: [sheet("s1", 10), sheet("s2", 10)]
  });
  assert.equal(plan.balance, "behind");
  assert.equal(plan.capacity.studyDays, 0);
  assert.ok(plan.message.includes("El examen es hoy"));
  assert.ok(plan.message.includes("No prometo que llegues"));
});

test("tarjetas vencidas: un bloque agregado con minutos estimados", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [],
    cardsDue: 24
  });
  const cards = route.items.find((item) => item.type === "tarjetas");
  assert.ok(cards);
  assert.equal(cards.minutes, 12);
  assert.equal(cards.count, 24);
  assert.equal(cards.action.kind, "repasar-tarjetas");
  assert.equal(cards.action.href, null);
});

test("dudas abiertas: máximo dos, las más antiguas primero", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [sheet("s1", 10)],
    doubts: [
      { id: "d1", sheetId: "s1", note: "Reciente", createdAt: "2026-11-08T10:00:00-05:00" },
      { id: "d2", sheetId: "s1", note: "Antigua", createdAt: "2026-11-02T10:00:00-05:00" },
      { id: "d3", sheetId: "s1", note: "Media", createdAt: "2026-11-05T10:00:00-05:00" },
      { id: "d4", sheetId: "s1", note: "Resuelta", createdAt: "2026-11-01T10:00:00-05:00", resolvedAt: "2026-11-02T10:00:00-05:00" }
    ]
  });
  const doubts = route.items.filter((item) => item.type === "duda");
  assert.equal(doubts.length, 2);
  assert.equal(doubts[0].title, "Antigua");
  assert.equal(route.counts.duda, 3);
  assert.equal(route.deferred.duda, 1);
});

test("la ruta nunca supera el presupuesto declarado", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 25,
    sheets: Array.from({ length: 5 }, (_, i) => sheet("s" + i, 7)),
    reviews: [{ sheetId: "s0", dueDate: "2026-11-05" }],
    cardsDue: 4
  });
  assert.ok(sumMinutes(route.items) <= 25);
  assert.equal(route.overload, false);
  assert.equal(route.plannedMinutes, sumMinutes(route.items));
  assert.equal(route.remainingMinutes, 25 - route.plannedMinutes);
});

test("si nada cabe, propone el bloque mínimo y declara el exceso", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 2,
    sheets: [sheet("s1", 10)],
    cardsDue: 10
  });
  assert.equal(route.status, "lista");
  assert.equal(route.minimumBlock, true);
  assert.equal(route.overload, true);
  assert.equal(route.items.length, 1);
  assert.equal(route.items[0].minutes, 5);
  assert.equal(route.items[0].minimumBlock, true);
  assert.equal(route.items[0].overBudgetMinutes, 3);
  assert.ok(route.message.includes("bloque mínimo"));
  assert.ok(route.support.includes("más que tu presupuesto"));
});

test("un repaso vencido no se repite como ficha nueva", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [sheet("s1", 10), sheet("s2", 10)],
    reviews: [{ sheetId: "s1", dueDate: "2026-11-08" }],
    todaySheets: ["s1", "s2"]
  });
  const ids = route.items.map((item) => item.sheetId).filter(Boolean);
  assert.equal(ids.filter((id) => id === "s1").length, 1);
  assert.equal(route.items.find((item) => item.sheetId === "s1").type, "repaso");
});

test("la siguiente ficha del plan entra y se explica", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 60,
    sheets: [sheet("s1", 10), sheet("s2", 10)],
    nextSheetId: "s2"
  });
  const fichas = route.items.filter((item) => item.type === "ficha");
  assert.equal(fichas[0].sheetId, "s2");
  assert.equal(fichas[0].isNext, true);
  assert.equal(fichas[0].minutesSource, "declarada");
  assert.ok(fichas[0].reason.includes("siguiente ficha"));
  assert.equal(route.nextSheetId, "s2");
});

test("con plan configurado usa la sesión del plan y expone el balance", () => {
  const sheets = Array.from({ length: 8 }, (_, i) => sheet("s" + i, 10));
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 40,
    sheets,
    plan: { examDate: "2026-11-20", minutesPerDay: 30, daysPerWeek: 6 }
  });
  assert.equal(route.status, "lista");
  assert.equal(route.plan.status, "ok");
  assert.ok(["ahead", "onTrack", "behind"].includes(route.plan.balance));
  assert.equal(route.session.date, "2026-11-09");
  assert.equal(route.session.isToday, true);
  /* La vista #/ruta muestra la sesión planificada: minutos y fichas. */
  assert.equal(route.session.minutes, 30);
  assert.equal(route.session.sheets.length, 3);
  assert.deepEqual(route.session.sheets, ["s0", "s1", "s2"]);
  const fichas = route.items.filter((item) => item.type === "ficha");
  assert.ok(fichas.length >= 1);
  assert.ok(fichas[0].reason.includes("sesión"));
});

test("atraso del plan: texto de apoyo sin culpa", () => {
  const sheets = Array.from({ length: 40 }, (_, i) => sheet("s" + i, 20));
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 30,
    sheets,
    plan: { examDate: "2026-11-13", minutesPerDay: 30, daysPerWeek: 6 }
  });
  assert.equal(route.plan.balance, "behind");
  assert.ok(route.support.includes("se recalcula"));
});

test("sobran minutos: se dice, no se rellena con nada", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 30,
    sheets: [sheet("s1", 20), sheet("s2", 20)]
  });
  assert.equal(route.plannedMinutes, 20);
  assert.equal(route.remainingMinutes, 10);
  assert.equal(route.nextBlockMinutes, 20);
  assert.ok(route.support.includes("Sobran 10 minutos"));
});

test("nextSheetId desconocido se advierte y no rompe la ruta", () => {
  const route = Model.buildTodayRoute({
    now: NOW,
    budgetMinutes: 30,
    sheets: [sheet("s1", 10)],
    nextSheetId: "no-existe"
  });
  assert.ok(codes(route).includes("FICHA_DESCONOCIDA"));
  assert.equal(route.status, "lista");
});

/* ==========================================================================
   masteryFor
   ========================================================================== */

test("sin ninguna colección de estado no inventa dominio", () => {
  const mastery = Model.masteryFor({ now: NOW, sheets: [sheet("s1", 10), sheet("s2", 10)] });
  assert.equal(mastery.status, "sinDatos");
  assert.equal(mastery.global.score, null);
  assert.equal(mastery.global.band, "sinDatos");
  assert.equal(mastery.categories[0].score, null);
  assert.deepEqual(mastery.categories[0].missing, ["lectura", "confianza", "tarjetas", "errores"]);
  assert.equal(mastery.coverage, 0);
});

test("una colección vacía sí es una señal: nada leído = lectura 0", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10), sheet("s2", 10)],
    states: { sheets: {} }
  });
  const category = mastery.categories[0];
  assert.equal(category.signals.lectura.present, true);
  assert.equal(category.signals.lectura.value, 0);
  assert.equal(category.score, 0);
  assert.equal(category.band, "fragil");
  assert.equal(category.coverage, 0.3);
  assert.deepEqual(category.missing, ["confianza", "tarjetas", "errores"]);
  assert.equal(category.sheetCoverage, 0);
});

test("leer todo no basta para declarar «sólido» sin más señales", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10), sheet("s2", 10)],
    states: { sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" }, s2: { completedAt: "2026-11-02T10:00:00Z" } } }
  });
  const category = mastery.categories[0];
  assert.equal(category.score, 100);
  assert.equal(category.coverage, 0.3);
  assert.equal(category.band, "enProgreso");
  assert.ok(mastery.constants === undefined);
});

test("lectura + confianza sólida alcanza banda sólida", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10), sheet("s2", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" }, s2: { completedAt: "2026-11-02T10:00:00Z" } },
      confidence: { s1: "solid", s2: "solid" }
    }
  });
  const category = mastery.categories[0];
  assert.equal(category.signals.confianza.value, 1);
  assert.equal(category.score, 100);
  assert.equal(category.coverage, 0.6);
  assert.equal(category.band, "solido");
});

test("confianza parcial baja el puntaje de forma transparente", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      confidence: { s1: "partial" }
    }
  });
  assert.equal(mastery.categories[0].signals.confianza.value, 0.55);
  assert.equal(mastery.categories[0].score, 78);
  assert.equal(mastery.categories[0].band, "solido");
});

test("tarjetas: mezcla de acierto (0,6) y volumen (0,4)", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      confidence: { s1: "solid" },
      cards: { s1: { reviews: 3, correct: 3, wrong: 0 } }
    }
  });
  const category = mastery.categories[0];
  assert.equal(category.signals.tarjetas.value, 1);
  assert.equal(category.accuracy, 100);
  assert.equal(category.coverage, 0.85);
  assert.equal(category.score, 100);
});

test("errores recientes: un fallo de tres baja la señal a 0,667", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      confidence: { s1: "solid" },
      cards: { s1: { reviews: 3, correct: 3, wrong: 0 } },
      recall: [
        { sheetId: "s1", rating: "again", createdAt: "2026-11-05T10:00:00Z" },
        { sheetId: "s1", rating: "again", createdAt: "2026-11-06T10:00:00Z" }
      ]
    }
  });
  const category = mastery.categories[0];
  assert.ok(Math.abs(category.signals.errores.value - 1 / 3) < 1e-9);
  assert.equal(category.coverage, 1);
  assert.equal(category.score, 90);
  assert.deepEqual(category.missing, []);
});

test("errores fuera de la ventana no cuentan", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      cards: { s1: { reviews: 3, correct: 3, wrong: 0 } },
      recall: [{ sheetId: "s1", rating: "again", createdAt: "2026-10-01T10:00:00Z" }]
    }
  });
  assert.equal(mastery.categories[0].signals.errores.present, true);
  assert.equal(mastery.categories[0].signals.errores.value, 1);
});

test("error sin fecha no cuenta y se advierte", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      cards: { s1: { reviews: 3, correct: 3, wrong: 0 } },
      errors: [{ sheetId: "s1" }]
    }
  });
  assert.equal(mastery.categories[0].signals.errores.value, 1);
  assert.ok(codes(mastery).includes("ERRORES_SIN_FECHA"));
});

test("confianza borrada no cuenta como señal", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      confidence: { s1: { value: "solid", deleted: true } }
    }
  });
  assert.equal(mastery.categories[0].signals.confianza.present, false);
  assert.equal(mastery.categories[0].coverage, 0.3);
});

test("tarjetas en arreglo con sheetId se asocian sin mapa auxiliar", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      cards: [{ id: "card-1", sheetId: "s1", reviews: 2, correct: 1, wrong: 1 }]
    }
  });
  assert.equal(mastery.categories[0].signals.tarjetas.present, true);
  assert.equal(mastery.categories[0].accuracy, 50);
});

test("tarjetas indexadas por tarjeta se asocian con cardSheet", () => {
  const withMap = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      cards: { "card-1": { reviews: 3, correct: 2, wrong: 1 } }
    },
    cardSheet: { "card-1": "s1" }
  });
  assert.equal(withMap.categories[0].signals.tarjetas.present, true);
  assert.equal(withMap.categories[0].accuracy, 67);
  const withoutMap = Model.masteryFor({
    now: NOW,
    sheets: [sheet("s1", 10)],
    states: {
      sheets: { s1: { completedAt: "2026-11-01T10:00:00Z" } },
      cards: { "card-1": { reviews: 3, correct: 2, wrong: 1 } }
    }
  });
  assert.equal(withoutMap.categories[0].signals.tarjetas.present, false);
  assert.ok(codes(withoutMap).includes("TARJETAS_SIN_FICHA"));
});

test("agregación por área ponderada por minutos y más floja con cobertura", () => {
  const sheets = [sheet("a1", 60, "area-a", "cat-a"), sheet("b1", 10, "area-b", "cat-b")];
  const mastery = Model.masteryFor({
    now: NOW,
    sheets,
    states: {
      sheets: { a1: { completedAt: "2026-11-01T10:00:00Z" } },
      confidence: { a1: "solid", b1: "weak" },
      cards: { a1: { reviews: 3, correct: 3, wrong: 0 } }
    }
  });
  const areaA = mastery.areas.find((area) => area.id === "area-a");
  const areaB = mastery.areas.find((area) => area.id === "area-b");
  assert.equal(areaA.score, 100);
  /* Lectura 0 (no vista) + confianza débil 0,15 → (0 + 0,045) / 0,6 = 8 */
  assert.equal(areaB.score, 8);
  assert.equal(areaB.band, "fragil");
  assert.equal(mastery.weakest.id, "cat-b");
  assert.equal(mastery.weakestArea.id, "area-b");
  /* (60 × 100 + 10 × 8) / 70 = 86,9 → 87 */
  assert.equal(mastery.global.score, 87);
});

test("una categoría sin datos se declara y no arrastra el total", () => {
  const mastery = Model.masteryFor({
    now: NOW,
    sheets: [sheet("a1", 10, "area-a", "cat-a"), sheet("b1", 10, "area-a", "cat-b")],
    states: { sheets: { a1: { completedAt: "2026-11-01T10:00:00Z" } } }
  });
  const catA = mastery.categories.find((item) => item.id === "cat-a");
  const catB = mastery.categories.find((item) => item.id === "cat-b");
  assert.equal(catA.score, 100);
  assert.equal(catB.score, 0);
  assert.equal(catB.band, "fragil");
  assert.equal(mastery.status, "ok");
});

test("dominio determinista", () => {
  const input = {
    now: NOW,
    sheets: [sheet("a1", 10, "area-a", "cat-a")],
    states: {
      sheets: { a1: { completedAt: "2026-11-01T10:00:00Z" } },
      confidence: { a1: "partial" },
      cards: { a1: { reviews: 2, correct: 1, wrong: 1 } }
    }
  };
  assert.equal(JSON.stringify(Model.masteryFor(input)), JSON.stringify(Model.masteryFor(input)));
});

/* ==========================================================================
   nextSheetReview
   ========================================================================== */

test("primer repaso según confianza: débil 1, parcial 2, sólida 4", () => {
  const weak = Model.nextSheetReview({ now: NOW, sheetId: "s1", confidence: "weak" });
  const partial = Model.nextSheetReview({ now: NOW, sheetId: "s1", confidence: "partial" });
  const solid = Model.nextSheetReview({ now: NOW, sheetId: "s1", confidence: "solid" });
  assert.equal(weak.intervalDays, 1);
  assert.equal(partial.intervalDays, 2);
  assert.equal(solid.intervalDays, 4);
  assert.equal(weak.dueDate, "2026-11-10");
  assert.equal(solid.dueDate, "2026-11-13");
  assert.equal(weak.isFirst, true);
  assert.equal(weak.status, "primeraVez");
  assert.equal(weak.source, "confidence");
});

test("vencimiento a medianoche local en ISO", () => {
  const review = Model.nextSheetReview({ now: NOW, confidence: "weak" });
  assert.equal(review.dueAt, "2026-11-10T05:00:00.000Z");
});

test("la escalera avanza con los repasos previos", () => {
  const first = Model.nextSheetReview({ now: NOW, confidence: "solid", reviewCount: 0 });
  const second = Model.nextSheetReview({ now: NOW, confidence: "solid", reviewCount: 1 });
  const third = Model.nextSheetReview({ now: NOW, confidence: "solid", reviewCount: 2 });
  assert.equal(first.intervalDays, 4);
  assert.equal(second.intervalDays, 7);
  assert.equal(third.intervalDays, 15);
  assert.ok(third.reason.includes("2 repasos"));
});

test("un lapso reinicia la escalera", () => {
  const review = Model.nextSheetReview({ now: NOW, confidence: "solid", reviewCount: 3, lapses: 1 });
  assert.equal(review.intervalDays, 1);
  assert.ok(review.reason.includes("lapso"));
});

test("intervalo máximo acotado", () => {
  const review = Model.nextSheetReview({ now: NOW, confidence: "solid", reviewCount: 99 });
  assert.equal(review.intervalDays, 60);
  assert.equal(review.ladderIndex, Model.constants.REVIEW_LADDER.length - 1);
});

test("sin confianza declarada: conservador y declarado ausente", () => {
  const review = Model.nextSheetReview({ now: NOW, sheetId: "s1" });
  assert.equal(review.confidence, null);
  assert.equal(review.confidenceSource, "ausente");
  assert.equal(review.intervalDays, 1);
  assert.equal(review.assumptions.length, 1);
  assert.equal(review.assumptions[0].code, "CONFIANZA_AUSENTE");
});

test("sin confianza pero con intervalo previo: no lo aumenta", () => {
  const review = Model.nextSheetReview({ now: NOW, previousIntervalDays: 10 });
  assert.equal(review.intervalDays, 10);
  assert.ok(review.reason.includes("conservador"));
});

test("repaso atrasado: mide el atraso y reprograma desde hoy", () => {
  const review = Model.nextSheetReview({
    now: NOW,
    confidence: "partial",
    reviewCount: 1,
    dueDate: "2026-11-04"
  });
  assert.equal(review.overdue, true);
  assert.equal(review.overdueDays, 5);
  assert.equal(review.status, "atrasado");
  assert.equal(review.previousDueDate, "2026-11-04");
  assert.equal(review.dueDate, "2026-11-13");
  assert.ok(review.reason.includes("Estaba vencido"));
});

test("no toca las cajas de Study Flashcards", () => {
  const review = Model.nextSheetReview({ now: NOW, confidence: "solid" });
  assert.equal("box" in review, false);
  assert.equal(review.source, "confidence");
});

/* ==========================================================================
   buildWeeklySummary
   ========================================================================== */

test("semana sin actividad: cifras nulas, no ceros", () => {
  const summary = Model.buildWeeklySummary({ now: NOW, activity: {} });
  assert.equal(summary.status, "sinDatos");
  assert.equal(summary.empty, true);
  assert.equal(summary.activity.sheetViews, null);
  assert.equal(summary.activity.minutesRead, null);
  assert.ok(summary.missing.includes("actividad"));
  assert.ok(summary.message.includes("Aún no hay actividad"));
});

test("registros en cero son actividad real en cero", () => {
  const summary = Model.buildWeeklySummary({
    now: NOW,
    activity: { "2026-11-09": { sheetViews: 0, sheetCompletions: 0, cardReviews: 0, correct: 0, wrong: 0, seconds: 0 } }
  });
  assert.equal(summary.status, "sinActividad");
  assert.equal(summary.activity.sheetViews, 0);
  assert.equal(summary.activity.minutesRead, 0);
  assert.equal(summary.empty, true);
});

test("semana completa: suma actividad y calcula acierto y minutos", () => {
  const summary = Model.buildWeeklySummary({
    now: NOW,
    weekStart: "2026-11-02",
    activity: {
      "2026-11-02": { sheetViews: 4, sheetCompletions: 3, cardReviews: 20, correct: 17, wrong: 3, seconds: 1800 },
      "2026-11-03": { sheetViews: 2, sheetCompletions: 2, cardReviews: 10, correct: 9, wrong: 1, seconds: 900 },
      "2026-11-09": { sheetViews: 99, sheetCompletions: 99, cardReviews: 99, correct: 99, wrong: 0, seconds: 9999 }
    }
  });
  assert.equal(summary.status, "ok");
  assert.equal(summary.weekStart, "2026-11-02");
  assert.equal(summary.rangeEnd, "2026-11-08");
  assert.equal(summary.partial, false);
  assert.equal(summary.activity.sheetViews, 6);
  assert.equal(summary.activity.sheetsCompleted, 5);
  assert.equal(summary.activity.cardsReviewed, 30);
  assert.equal(summary.activity.accuracy, 87);
  assert.equal(summary.activity.minutesRead, 45);
  assert.equal(summary.activity.daysWithActivity, 2);
  assert.ok(summary.message.includes("6 lecturas"));
});

test("semana en curso: rango parcial y solo hasta hoy", () => {
  const summary = Model.buildWeeklySummary({
    now: NOW,
    activity: { "2026-11-09": { sheetViews: 2, sheetCompletions: 1, cardReviews: 4, correct: 3, wrong: 1, seconds: 600 } }
  });
  assert.equal(summary.weekStart, "2026-11-09");
  assert.equal(summary.rangeEnd, "2026-11-09");
  assert.equal(summary.partial, true);
  assert.equal(summary.activity.sheetViews, 2);
});

test("sin segundos declarados, los minutos de lectura son nulos", () => {
  const summary = Model.buildWeeklySummary({
    now: NOW,
    activity: { "2026-11-09": { sheetViews: 2, sheetCompletions: 1, cardReviews: 4, correct: 3, wrong: 1 } }
  });
  assert.equal(summary.activity.minutesRead, null);
  assert.equal(summary.activity.minutesSource, "ausente");
  assert.ok(summary.missing.includes("minutos de lectura"));
});

test("prioridad semanal: dominio, repaso, duda y fichas pendientes", () => {
  const summary = Model.buildWeeklySummary({
    now: NOW,
    weekStart: "2026-11-02",
    activity: { "2026-11-03": { sheetViews: 2, sheetCompletions: 2, cardReviews: 4, correct: 4, wrong: 0, seconds: 600 } },
    sheets: [{ ...sheet("a1", 10, "area-a", "cat-a"), done: true }, sheet("b1", 10, "area-b", "cat-b")],
    states: {
      sheets: { a1: { completedAt: "2026-11-03T10:00:00Z" } },
      confidence: { a1: "solid" },
      cards: { a1: { reviews: 3, correct: 3, wrong: 0 } }
    },
    reviews: [{ sheetId: "a1", dueDate: "2026-11-01" }],
    doubts: [{ id: "d1", sheetId: "a1" }],
    cardsDue: 7
  });
  assert.equal(summary.status, "ok");
  assert.ok(summary.priority.length >= 2 && summary.priority.length <= 3);
  assert.equal(summary.priority[0].kind, "dominio");
  assert.ok(summary.priority.some((item) => item.kind === "repaso"));
  assert.ok(summary.priority.some((item) => item.kind === "duda"));
  assert.equal(summary.pending.sheets, 1);
  assert.equal(summary.pending.reviewsDue, 1);
  assert.equal(summary.pending.doubtsOpen, 1);
  assert.equal(summary.pending.cardsDue, 7);
});

test("resumen semanal determinista", () => {
  const input = {
    now: NOW,
    activity: { "2026-11-09": { sheetViews: 1, sheetCompletions: 1, cardReviews: 1, correct: 1, wrong: 0, seconds: 300 } }
  };
  assert.equal(JSON.stringify(Model.buildWeeklySummary(input)), JSON.stringify(Model.buildWeeklySummary(input)));
});
