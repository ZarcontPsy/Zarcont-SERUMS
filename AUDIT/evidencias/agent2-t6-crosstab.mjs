/* Escenario A2-CROSSTAB — dos pestañas del mismo navegador: escrituras que se pisan. */
import { connect, newPage, navigate, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { app: "crosstab", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }

const b = await connect();

/* ---------- Study: dos pestañas, favoritos distintos ---------- */
const dashA = await newPage(b, ORIGIN + "/study-dashboard/index.html");
const dashB = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1500);
const ids = await evalJS(dashA, `window.STUDY_CONTENT.sheets.slice(0, 2).map(s => s.id)`);
const favA = await evalJS(dashA, `(() => { const s = window.StudyStore.getState(); const id = ${JSON.stringify(ids[0])};
  window.StudyStore.toggleFavorite(id); return { id, fav: !!(window.StudyStore.getSheetState(id) || {}).favorite }; })()`);
await sleep(500);
const favB = await evalJS(dashB, `(() => { const id = ${JSON.stringify(ids[1])};
  window.StudyStore.toggleFavorite(id); return { id, fav: !!(window.StudyStore.getSheetState(id) || {}).favorite }; })()`);
await sleep(800);
const merged = await evalJS(dashB, `(() => { const s = window.StudyStore.getState(); return {
  favs: Object.keys(s.sheets).filter(id => s.sheets[id].favorite),
  stored: (JSON.parse(localStorage.getItem("study-state-v1")||"{}").sheets || {}) }; })()`);
const storedFavs = Object.keys(merged.stored || {}).filter(id => merged.stored[id].favorite);
step("1 STUDY dos pestañas (favorito en cada una)", { favA, favB, memoriaB: merged.favs, disco: storedFavs });

/* ---------- QUEST: dos pestañas, respuestas simultáneas ---------- */
const questA = await newPage(b, ORIGIN + "/serums-quest/index.html");
const questB = await newPage(b, ORIGIN + "/serums-quest/index.html");
await sleep(1800);
const qa = await evalJS(questA, `(() => { const st = window.QuestStore.get();
  try { const r = st.commit(d => { d.xp = (d.xp || 0) + 10; d.profile.name = "A"; }); return { ok: true, xp: r.state.xp, rev: r.state.revision }; }
  catch (e) { return { ok: false, err: e.message }; } })()`);
const qb = await evalJS(questB, `(() => { const st = window.QuestStore.get();
  try { const r = st.commit(d => { d.coins = (d.coins || 0) + 5; d.profile.name = "B"; }); return { ok: true, coins: r.state.coins, xp: r.state.xp, rev: r.state.revision }; }
  catch (e) { return { ok: false, err: e.message }; } })()`);
await sleep(900);
const qAfter = await evalJS(questA, `(() => { const raw = JSON.parse(localStorage.getItem("serumsquest:state:v1")); return { xp: raw.xp, coins: raw.coins, name: raw.profile.name, revision: raw.revision,
  memXp: window.QuestStore.get().getState().xp, memCoins: window.QuestStore.get().getState().coins }; })()`);
step("2 QUEST dos pestañas (xp en A, monedas en B)", { qa, qb, discoYA: qAfter });

/* ---------- BANQUEO: dos pestañas, revisión de preguntas distintas ---------- */
const banA = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
const banB = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
await sleep(4500);
const qids = await evalJS(banA, `(() => { const s = window.BanqueoStore.state; return s.questions.slice(0, 2).map(q => q.id); })()`);
const revA = await evalJS(banA, `(() => { try { window.BanqueoStore.markReviewed(${JSON.stringify(qids[0])}, true); return { ok: true, keys: Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1")||"{}")) }; } catch (e) { return { ok: false, err: e.message }; } })()`);
const revB = await evalJS(banB, `(() => { try { window.BanqueoStore.markReviewed(${JSON.stringify(qids[1])}, true); return { ok: true, keys: Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1")||"{}")) }; } catch (e) { return { ok: false, err: e.message }; } })()`);
await sleep(500);
const revDisk = await evalJS(banA, `(() => { const m = JSON.parse(localStorage.getItem("banqueo-review-v1")||"{}"); return { total: Object.keys(m).length, hasQ1: !!m[${JSON.stringify(qids[0])}], hasQ2: !!m[${JSON.stringify(qids[1])}], memA: Object.keys(window.BanqueoStore.state.review).length }; })()`);
const revMemB = await evalJS(banB, `Object.keys(window.BanqueoStore.state.review).length`);
step("3 BANQUEO dos pestañas (revisión)", { qids, revA, revB, disco: revDisk, memoriaB: revMemB });

/* ---------- PLAZAS: favorito en A, lectura en B ---------- */
const plA = await newPage(b, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
const plB = await newPage(b, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
await sleep(3500);
const favPlazas = await evalJS(plA, `(() => { const p = window.App.allPlazas().find(p => p.codigo); window.App.toggleFav(p); return { key: window.App.favKey(p), n: window.Store.get("favoritos", []).length }; })()`);
await sleep(700);
const plBView = await evalJS(plB, `({ favs: window.Store.get("favoritos", []).length, badge: (document.getElementById("favBadge")||{}).textContent, view: window.App.S.view })`);
step("4 PLAZAS pestaña B tras favorito en A", { favPlazas, plBView });

out.errors = [];
report("AUDIT/evidencias/agent2-crosstab-antes.json", out);
for (const p of [dashA, dashB, questA, questB, banA, banB, plA, plB]) {
  await b.send("Target.closeTarget", { targetId: p.targetId });
}
b.close();
