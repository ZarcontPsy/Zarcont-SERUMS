/* Sonda de conteos de datos (Agente 8). */
import vm from "node:vm";
import { readFileSync } from "node:fs";
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of [
  "study-data/temario.js",
  "EXAMEN STUDIO/datos/banco-oficial.js",
  "serums-quest/data/quest-map.js",
  "serums map/serums-map-explorer/datos/datos_plazas.js",
  "serums map/serums-map-explorer/datos/datos_adjudicados.js",
]) {
  try {
    vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f, timeout: 30000 });
    console.log("OK", f);
  } catch (e) {
    console.log("ERR", f, e.message);
  }
}
const C = ctx.window.STUDY_CONTENT;
console.log("study", {
  areas: C.areas?.length,
  categories: C.categories?.length,
  topics: C.topics?.length,
  sheets: C.sheets?.length,
  cards: C.cards?.length,
  uniqueSheets: new Set(C.sheets?.map((s) => s.id)).size,
  uniqueCards: new Set(C.cards?.map((c) => c.id)).size,
  version: C.version,
  firstSheet: C.sheets?.[0]?.id,
  cardsPerSheet: C.sheets?.slice(0, 3).map((s) => C.cards.filter((c) => c.sheetId === s.id).length),
});
const B = ctx.window.BANCO_OFICIAL;
console.log("banco", B?.totals, "professions", B?.professions?.length, "exams", B?.exams?.length, "questions", B?.questions?.length);
const Q = ctx.window.QUEST_CONTENT_MAP;
console.log("questMap", { questions: Q?.questions?.length, keys: Object.keys(Q || {}) });
const D = ctx.window.SERUMS_DATA;
console.log("plazas", D?.length, "adj", Object.keys(ctx.window.SERUMS_ADJUDICADOS || {}).length, "geo", Object.keys(ctx.window.SERUMS_GEO_PUNTOS || {}).length);
