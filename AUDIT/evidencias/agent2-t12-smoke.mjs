/* A2-SMOKE — humo final de las cinco apps con las tiendas corregidas (sin caché). */
import { connect, newPage, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { app: "smoke", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();

const apps = [
  ["study-dashboard", "/study-dashboard/index.html", `(() => ({ ready: window.StudyStore.isReady(), mode: window.StudyStore.getMode(), h1: (document.querySelector("h1")||{}).textContent }))()`],
  ["study-flashcards", "/study-flashcards/index.html", `(() => ({ ready: window.StudyStore.isReady(), mode: window.StudyStore.getMode(), h1: (document.querySelector("h1")||{}).textContent }))()`],
  ["serums-quest", "/serums-quest/index.html", `(() => ({ ready: window.QuestStore.get().isReady(), mode: window.QuestStore.get().getMode(), h1: (document.querySelector("h1")||{}).textContent }))()`],
  ["examen-studio", "/EXAMEN%20STUDIO/Examen%20Studio.html", `(() => ({ ready: !!window.__BANQUEO_READY__, db: window.BanqueoStore.dbReady, questions: window.BanqueoStore.state.questions.length, h1: (document.querySelector("h1")||{}).textContent }))()`],
  ["plazas", "/serums%20map/serums-map-explorer/index.html", `(() => ({ ready: !!window.App, plazas: window.App.allPlazas().length, storeKeys: Object.keys(localStorage).filter(k => k.startsWith("serums_")).length, h1: (document.querySelector("h1")||{}).textContent }))()`],
];

for (const [name, path, probe] of apps) {
  const page = await newPage(b, ORIGIN + path);
  await sleep(name === "examen-studio" ? 4500 : name === "plazas" ? 3200 : 2000);
  step(name, { probe: await evalJS(page, probe), errors: page.errors.filter(e => !/pdf|cdn|jsdelivr|cdnjs|googleapis|Maps|net::ERR|favicon/i.test(e)).slice(0, 4) });
  await b.send("Target.closeTarget", { targetId: page.targetId });
}
report("AUDIT/evidencias/agent2-smoke-final.json", out);
b.close();
