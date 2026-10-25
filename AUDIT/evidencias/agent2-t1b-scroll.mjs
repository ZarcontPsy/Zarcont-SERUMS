import { connect, newPage, navigate, evalJS, sleep, ORIGIN } from "./agent2-lib.mjs";

const b = await connect();
const page = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1000);
const sheetId = (await evalJS(page, "window.STUDY_CONTENT.sheets[1].id"));
await navigate(page, ORIGIN + "/study-dashboard/index.html?sheet=" + encodeURIComponent(sheetId));
await sleep(1200);
console.log("url:", await evalJS(page, "location.href"));
console.log("restoration:", await evalJS(page, "history.scrollRestoration"));
console.log("stored:", await evalJS(page, `window.StudyStore.getSheetState(${JSON.stringify(sheetId)}).scroll`));
await evalJS(page, `window.scrollTo(0, 1100)`);
await sleep(400);
console.log("y antes de ocultar:", await evalJS(page, "Math.round(window.scrollY)"));

// guardar posición vía pagehide (flushReading + saveScroll)
await evalJS(page, `window.dispatchEvent(new PageTransitionEvent("pagehide"))`);
await sleep(200);
console.log("stored tras pagehide:", await evalJS(page, `window.StudyStore.getSheetState(${JSON.stringify(sheetId)}).scroll`));

// recargar y muestrear scrollY cada 100 ms
await page.send("Page.reload");
const samples = [];
for (let i = 0; i < 25; i++) {
  await sleep(100);
  samples.push(await evalJS(page, `({ t: Math.round(performance.now()), y: Math.round(window.scrollY), h: document.documentElement.scrollHeight, has: !!document.querySelector("#view-root h1") })`));
}
console.log("muestras:", JSON.stringify(samples));
const st = await evalJS(page, `(() => { const s = window.StudyStore.getSheetState(${JSON.stringify(sheetId)}); return { views: s.views, scroll: s.scroll }; })()`);
console.log("estado tras recarga:", JSON.stringify(st));
b.close();
