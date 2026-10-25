/* A2-CORRUPT — lectura de datos dañados: ¿se recupera sin borrar lo demás? */
import { connect, newPage, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { app: "corrupt", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();

/* STUDY: localStorage dañado, IndexedDB intacto */
const dash = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1800);
const before = await evalJS(dash, `(() => { const s = window.StudyStore.getState(); return { cards: Object.keys(s.cards).length, sheets: Object.keys(s.sheets).length }; })()`);
await evalJS(dash, `localStorage.setItem("study-state-v1", "{esto no es json")`);
await dash.send("Page.reload");
await sleep(2200);
const afterCorrupt = await evalJS(dash, `(() => { const s = window.StudyStore.getState(); return { ready: window.StudyStore.isReady(), mode: window.StudyStore.getMode(),
  cards: Object.keys(s.cards).length, sheets: Object.keys(s.sheets).length, raw: (localStorage.getItem("study-state-v1")||"").slice(0, 30) }; })()`);
step("1 STUDY localStorage dañado", { before, afterCorrupt });

/* QUEST: estado dañado + respaldo válido */
const quest = await newPage(b, ORIGIN + "/serums-quest/index.html");
await sleep(2200);
const qBefore = await evalJS(quest, `(() => { const s = window.QuestStore.get().getState(); return { xp: s.xp, revision: s.revision, backup: !!localStorage.getItem("serumsquest:backup:v1") }; })()`);
const corruptQuest = await evalJS(quest, `(() => { localStorage.setItem("serumsquest:state:v1", "{dañado"); localStorage.removeItem("serumsquest:journal:v1");
  return { backupKeys: Object.keys(localStorage).filter(k => k.indexOf("serumsquest:") === 0) }; })()`);
await quest.send("Page.reload");
await sleep(2600);
const qAfter = await evalJS(quest, `(() => { const s = window.QuestStore.get().getState(); return { blocked: window.QuestStore.get().isBlocked(), xp: s.xp,
  recovered: !!(s.meta && s.meta.recoveredFromCorrupt), archived: Object.keys(localStorage).filter(k => k.indexOf("serumsquest:archive:") === 0),
  fatalVisible: !!document.querySelector(".q-fatal"), keys: Object.keys(localStorage).filter(k => k.indexOf("serumsquest:") === 0) }; })()`);
step("2 QUEST estado dañado (con respaldo)", { qBefore, corruptQuest, qAfter });

/* BANQUEO: revisión dañada */
const ban = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
await sleep(4500);
const bBefore = await evalJS(ban, `({ review: Object.keys(window.BanqueoStore.state.review).length, ready: window.__BANQUEO_READY__ })`);
await evalJS(ban, `localStorage.setItem("banqueo-review-v1", "{roto")`);
await ban.send("Page.reload");
await sleep(4500);
const bAfter = await evalJS(ban, `(() => ({ ready: !!window.__BANQUEO_READY__, review: Object.keys(window.BanqueoStore.state.review).length, questions: window.BanqueoStore.state.questions.length }))()`);
step("3 BANQUEO revisión dañada", { bBefore, bAfter });

/* PLAZAS: favoritos dañados */
const plazas = await newPage(b, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
await sleep(3200);
await evalJS(plazas, `localStorage.setItem("serums_favoritos", "{roto")`);
await plazas.send("Page.reload");
await sleep(3200);
const pAfter = await evalJS(plazas, `(() => ({ ready: !!window.App, plazas: window.App.allPlazas().length, favs: window.Store.get("favoritos", []).length,
  raw: (localStorage.getItem("serums_favoritos")||"").slice(0,20) }))()`);
step("4 PLAZAS favoritos dañados", pAfter);

report("AUDIT/evidencias/agent2-corrupt.json", out);
for (const p of [dash, quest, ban, plazas]) await b.send("Target.closeTarget", { targetId: p.targetId });
b.close();
