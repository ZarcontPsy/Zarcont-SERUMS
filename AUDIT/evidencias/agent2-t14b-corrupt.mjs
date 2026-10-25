/* A2-CORRUPT2 — BANQUEO: copia del mapa de revisión dañado antes de continuar. */
import { connect, newPage, evalJS, sleep, ORIGIN, report } from "./agent2-lib.mjs";
const b = await connect();
const page = await newPage(b, ORIGIN + "/EXAMEN%20STUDIO/Examen%20Studio.html");
await sleep(4500);
const before = await evalJS(page, `({ review: Object.keys(window.BanqueoStore.state.review).length })`);
await evalJS(page, `localStorage.setItem("banqueo-review-v1", "{roto")`);
await page.send("Page.reload");
await sleep(4500);
const after = await evalJS(page, `(() => ({ ready: !!window.__BANQUEO_READY__, review: Object.keys(window.BanqueoStore.state.review).length,
  archiveKeys: Object.keys(localStorage).filter(k => k.indexOf("banqueo-review-v1-corrupt-") === 0),
  archiveContent: Object.keys(localStorage).filter(k => k.indexOf("banqueo-review-v1-corrupt-") === 0).map(k => localStorage.getItem(k)),
  questions: window.BanqueoStore.state.questions.length }))()`);
console.log(JSON.stringify({ before, after }, null, 1));
report("AUDIT/evidencias/agent2-corrupt2-despues.json", { before, after });
await b.send("Target.closeTarget", { targetId: page.targetId });
b.close();
