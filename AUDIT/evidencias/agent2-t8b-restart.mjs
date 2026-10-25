/* A2-RESTART fase 2: comprobar que el estado sobrevive al cierre real del navegador. */
import { connect, newPage, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { fase: "2-despues-de-reabrir", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();
const page = await newPage(b, ORIGIN + "/index.html");
await sleep(1500);
const keys = await evalJS(page, `(() => ({ keys: Object.keys(localStorage).sort(),
  studyState: JSON.parse(localStorage.getItem("study-state-v1") || "null"),
  quest: JSON.parse(localStorage.getItem("serumsquest:state:v1") || "null"),
  snapshot: JSON.parse(localStorage.getItem("studyhub:snapshot:v1") || "null"),
  review: Object.keys(JSON.parse(localStorage.getItem("banqueo-review-v1") || "{}")).length,
  plazasFavs: JSON.parse(localStorage.getItem("serums_favoritos") || "[]").length }))()`);
const dash = keys.studyState ? {
  sheets: Object.keys(keys.studyState.sheets || {}).length,
  favs: Object.keys(keys.studyState.sheets || {}).filter(id => keys.studyState.sheets[id].favorite),
  flash: keys.studyState.flashSession ? { id: keys.studyState.flashSession.id, index: keys.studyState.flashSession.index, answers: Object.keys(keys.studyState.flashSession.answers || {}).length } : null,
  cards: Object.keys(keys.studyState.cards || {}).length,
  snapshotLast: keys.snapshot && keys.snapshot.dashboard ? keys.snapshot.dashboard.last : null
} : null;
const quest = keys.quest ? { xp: keys.quest.xp, coins: keys.quest.coins, revision: keys.quest.revision,
  active: keys.quest.activeSession ? { id: keys.quest.activeSession.id, answered: Object.keys(keys.quest.activeSession.answers || {}).length } : null } : null;
step("estado tras reabrir el navegador", { keys: keys.keys, review: keys.review, plazasFavs: keys.plazasFavs, dash, quest });

/* sesión de flashcards y de QUEST reanudables */
const flash = await newPage(b, ORIGIN + "/study-flashcards/index.html#/sesion");
await sleep(2000);
step("flashcards reanuda tras reinicio", await evalJS(flash, `(() => { const s = window.StudyStore.getFlashSession();
  return { active: !!s, index: s && s.index, answers: s && Object.keys(s.answers).length, stage: !!document.querySelector("#session-stage"),
    h1: (document.querySelector("h1")||{}).textContent }; })()`));

const questPage = await newPage(b, ORIGIN + "/serums-quest/index.html#/jugar");
await sleep(2600);
step("quest reanuda tras reinicio", await evalJS(questPage, `(() => { const s = window.QuestStore.get().getState();
  return { active: !!s.activeSession, answered: s.activeSession ? Object.keys(s.activeSession.answers || {}).length : 0,
    playView: !!document.querySelector(".q-play, .q-question, .q-option"), hash: location.hash }; })()`));

const ban = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html#practice");
await sleep(4500);
step("banqueo tras reinicio", await evalJS(ban, `(() => ({ resumeRows: document.querySelectorAll('[data-act="practice-resume"]').length,
  practice: !!document.querySelector(".practice-card"), review: Object.keys(window.BanqueoStore.state.review).length }))()`));

const idb = await evalJS(ban, `(async () => {
  const db = await new Promise(res => { const r = indexedDB.open("examenstudio", 2); r.onsuccess = () => res(r.result); });
  const attempts = await new Promise(res => { const tx = db.transaction("attempts", "readonly"); const q = tx.objectStore("attempts").getAll(); q.onsuccess = () => res(q.result); });
  return attempts.map(a => ({ id: a.id, status: a.status, answers: Object.keys(a.answers || {}).length }));
})()`);
step("banqueo intentos en IndexedDB", idb);

report("AUDIT/evidencias/agent2-restart-fase2.json", out);
b.close();
