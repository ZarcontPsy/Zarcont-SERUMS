import vm from "node:vm";
import { readFileSync } from "node:fs";
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["study-data/temario.js", "serums-quest/data/quest-map.js", "serums map/serums-map-explorer/datos/datos_adjudicados.js"]) {
  vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f });
}
const C = ctx.window.STUDY_CONTENT;
console.log("areas", C.areas.map((a) => a.id));
console.log("primaryAreas", C.primaryAreas);
console.log("taxonomy", C.taxonomy && { keys: Object.keys(C.taxonomy), areas: C.taxonomy.areas?.length, categories: C.taxonomy.categories?.length, topics: C.taxonomy.topics?.length });
console.log("question map", typeof ctx.window.QUEST_CONTENT_MAP.questions, Array.isArray(ctx.window.QUEST_CONTENT_MAP.questions), Object.keys(ctx.window.QUEST_CONTENT_MAP.questions || {}).length);
console.log("adj meta", ctx.window.SERUMS_ADJUDICADOS_META && Object.keys(ctx.window.SERUMS_ADJUDICADOS_META));
console.log("adj sample", Object.keys(ctx.window.SERUMS_ADJUDICADOS || {}).slice(0, 3));
console.log("adj count", ctx.window.SERUMS_ADJUDICADOS && Object.keys(ctx.window.SERUMS_ADJUDICADOS).length);
