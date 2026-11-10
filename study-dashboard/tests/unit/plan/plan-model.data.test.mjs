/* Verificación del modelo contra el contenido real (210 fichas, 5 áreas, 20 categorías).
   Lee `study-data/temario.js` y `study-shared/taxonomy.js` con `node:vm` (sin dependencias).
   Ejecutar: node --test study-dashboard/tests/unit/plan

   © 2026 ZARCONT */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Model = require(fileURLToPath(new URL("../../../js/plan/plan-model.js", import.meta.url)));

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const contentPath = path.join(repoRoot, "study-data", "temario.js");
const taxonomyPath = path.join(repoRoot, "study-shared", "taxonomy.js");
const available = fs.existsSync(contentPath) && fs.existsSync(taxonomyPath);

function loadContent() {
  const sandbox = { window: {}, console: { warn() {}, log() {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(contentPath, "utf8"), sandbox, { filename: "temario.js" });
  vm.runInContext(fs.readFileSync(taxonomyPath, "utf8"), sandbox, { filename: "taxonomy.js" });
  return sandbox.window.STUDY_CONTENT;
}

test("contenido real: 210 fichas, 5 áreas y 20 categorías", { skip: !available }, () => {
  const content = loadContent();
  assert.equal(content.version, "2.5.0");
  assert.equal(content.sheets.length, 210);
  assert.equal(content.categories.length, 20);
  assert.equal(content.primaryAreas.length, 5);
  assert.equal(content.cards.length, 630);
  assert.equal(content.taxonomy.issues.length, 0);
  assert.equal(content.taxonomy.areaSheetTotals["area-psi-cuidado-integral"], 135);
});

test("contenido real: minutos declarados y peso del Área II", { skip: !available }, () => {
  const content = loadContent();
  const totalMinutes = content.sheets.reduce((total, sheet) => total + sheet.minutes, 0);
  const areaTwo = content.sheets.filter((sheet) => sheet.primaryAreaId === "area-psi-cuidado-integral");
  const areaTwoMinutes = areaTwo.reduce((total, sheet) => total + sheet.minutes, 0);
  assert.ok(content.sheets.every((sheet) => Number.isFinite(sheet.minutes) && sheet.minutes > 0));
  assert.equal(totalMinutes, 2524);
  assert.equal(areaTwo.length, 135);
  assert.equal(areaTwoMinutes, 1330);
  /* El Área II es ~64 % de las fichas, pero solo ~53 % de los minutos. */
  assert.equal(Number(((areaTwo.length / 210) * 100).toFixed(2)), 64.29);
  assert.equal(Number(((areaTwoMinutes / totalMinutes) * 100).toFixed(2)), 52.69);
});

test("plan sobre el contenido real: reparte los 2524 minutos y respeta el peso", { skip: !available }, () => {
  const content = loadContent();
  const sheets = content.sheets.map((sheet) => ({
    id: sheet.id,
    title: sheet.title,
    minutes: sheet.minutes,
    areaId: sheet.primaryAreaId,
    categoryId: sheet.categoryId
  }));
  const plan = Model.buildPlan({
    now: "2026-11-09T08:00:00-05:00",
    examDate: "2027-02-15",
    minutesPerDay: 60,
    daysPerWeek: 6,
    sheets
  });

  assert.equal(plan.status, "ok");
  assert.equal(plan.totals.sheets, 210);
  assert.equal(plan.totals.pendingSheets, 210);
  assert.equal(plan.totals.pendingMinutes, 2524);
  assert.equal(plan.totals.minutesEstimated, 0);
  assert.equal(plan.coverage.minutesComplete, true);
  assert.equal(plan.coverage.sheetsWithoutArea, 0);

  const warningCodes = plan.warnings.map((warning) => warning.code);
  for (const forbidden of ["MINUTOS_POR_DEFECTO", "FICHAS_SIN_AREA", "FICHAS_DESCARTADAS", "FICHAS_DUPLICADAS"]) {
    assert.equal(warningCodes.includes(forbidden), false, forbidden);
  }

  /* El calendario coloca exactamente el contenido, ni más ni menos. */
  const scheduled = plan.calendar.reduce((total, day) => total + day.minutes, 0);
  assert.equal(scheduled, 2524);
  for (const day of plan.calendar) assert.ok(day.minutes <= 60, day.date);

  /* Reparto por área = minutos reales, no número de fichas. */
  assert.equal(plan.areas.length, 5);
  assert.equal(plan.areaMinutes["area-psi-cuidado-integral"], 1330);
  assert.equal(plan.areaMinutes["area-psi-salud-publica"], 627);
  assert.equal(plan.areaShare["area-psi-cuidado-integral"], 1330 / 2524);
  assert.equal(plan.areaShare["area-psi-investigacion"], 118 / 2524);
  assert.equal(
    Object.keys(plan.areaMinutes).reduce((total, id) => total + plan.areaMinutes[id], 0),
    2524
  );
  assert.equal(plan.session.date, "2026-11-09");
  assert.ok(plan.session.sheets.length >= 1);
  assert.ok(plan.nextSheet && plan.nextSheet.id);
});

test("ruta sobre el contenido real: repasos, dudas y tarjetas inyectadas", { skip: !available }, () => {
  const content = loadContent();
  const sheets = content.sheets.map((sheet) => ({
    id: sheet.id,
    title: sheet.title,
    minutes: sheet.minutes,
    areaId: sheet.primaryAreaId,
    categoryId: sheet.categoryId
  }));
  const route = Model.buildTodayRoute({
    now: "2026-11-09T20:00:00-05:00",
    budgetMinutes: 45,
    sheets,
    reviews: [
      { sheetId: "sheet-aps-01", dueAt: "2026-11-06T05:00:00.000Z", intervalDays: 2 },
      { sheetId: "sheet-psi-ci-2-1", dueDate: "2026-11-09", intervalDays: 4 }
    ],
    doubts: [{ id: "doubt-1", sheetId: "sheet-aps-02", quote: "No entiendo el atributo", createdAt: "2026-11-07T10:00:00-05:00" }],
    cardsDue: 30,
    nextSheetId: "sheet-aps-05"
  });
  assert.equal(route.status, "lista");
  const planned = route.items.reduce((total, item) => total + item.minutes, 0);
  assert.equal(planned, route.plannedMinutes);
  assert.ok(planned <= 45);
  assert.equal(route.items[0].type, "repaso");
  for (const item of route.items) {
    assert.ok(item.reason.length > 10, item.id);
    assert.ok(item.minutes > 0, item.id);
    assert.ok(typeof item.action.label === "string", item.id);
  }
  assert.equal(route.counts.repaso, 2);
  assert.equal(route.counts.dudas === undefined, true);
  assert.equal(route.counts.duda, 1);
  assert.equal(route.counts.tarjetas, 30);
});

test("dominio sobre el contenido real: colecciones vacías no fingen dominio", { skip: !available }, () => {
  const content = loadContent();
  const sheets = content.sheets.map((sheet) => ({
    id: sheet.id,
    minutes: sheet.minutes,
    areaId: sheet.primaryAreaId,
    categoryId: sheet.categoryId
  }));
  const offline = Model.masteryFor({ now: "2026-11-09", sheets });
  assert.equal(offline.status, "sinDatos");
  assert.equal(offline.global.score, null);

  const nothingRead = Model.masteryFor({
    now: "2026-11-09",
    sheets,
    states: { sheets: {} }
  });
  assert.equal(nothingRead.status, "ok");
  assert.equal(nothingRead.global.score, 0);
  assert.equal(nothingRead.categories.length, 20);
  assert.equal(nothingRead.areas.length, 5);
  assert.equal(nothingRead.global.band, "fragil");
  assert.ok(nothingRead.sheetCoverage === 0);
});
