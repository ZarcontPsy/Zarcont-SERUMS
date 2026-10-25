/* Escenario A2-FILE — diferencia file:// frente a http:// (persistencia y navegación). */
import { connect, newPage, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";

const out = { app: "file-protocol", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const base = "file:///C:/Users/USARIO/Documents/ZARCONT%20SERUMS";

const b = await connect();
const page = await newPage(b, "about:blank");

async function probe(url, label) {
  await page.send("Page.navigate", { url });
  await sleep(3200);
  const res = await evalJS(page, `(() => {
    const info = { url: location.href, origin: location.origin, title: document.title };
    try { localStorage.setItem("__a2_test__", "1"); info.localStorage = localStorage.getItem("__a2_test__"); localStorage.removeItem("__a2_test__"); }
    catch (e) { info.localStorage = "ERROR: " + e.name; }
    info.indexedDB = "indexedDB" in window;
    info.studyStore = !!(window.StudyStore && window.StudyStore.isReady && window.StudyStore.isReady());
    info.storeMode = window.StudyStore ? window.StudyStore.getMode() : null;
    info.questState = !!(window.QuestStore && window.QuestStore.get().isReady && window.QuestStore.get().isReady());
    info.questMode = window.QuestStore ? window.QuestStore.get().getMode() : null;
    info.banqueoReady = !!window.__BANQUEO_READY__;
    info.banqueoDb = window.BanqueoStore ? window.BanqueoStore.dbReady : null;
    info.plazas = !!(window.App && window.App.allPlazas);
    info.scriptsFailed = [...document.scripts].filter(s => s.src && !s.src.startsWith("file:") && !s.src.startsWith("http")).length;
    info.h1 = (document.querySelector("h1")||{}).textContent || null;
    return info;
  })()`);
  step(label, res);
  return res;
}

await probe(base + "/study-dashboard/index.html", "1 file:// Study Dashboard");
await probe(base + "/study-flashcards/index.html", "2 file:// Study Flashcards");
await probe(base + "/serums-quest/index.html", "3 file:// SERUMS QUEST");
await probe(base + "/EXAMEN%20STUDIO/Examen%20Studio.html", "4 file:// Examen Studio");
await probe(base + "/serums%20map/serums-map-explorer/index.html", "5 file:// Plazas");
await probe(base + "/index.html", "6 file:// HUB");
await probe(ORIGIN + "/study-dashboard/index.html", "7 http:// Study Dashboard (control)");

out.errors = page.errors.slice(0, 20);
report("AUDIT/evidencias/agent2-file-antes.json", out);
b.close();
