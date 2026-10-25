import { connect, newPage, navigate, evalJS, sleep, ORIGIN } from "./agent2-lib.mjs";

const b = await connect();
const page = await newPage(b, "about:blank");
await page.send("Page.enable");
await page.send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    window.__scrollLog = [];
    const orig = window.scrollTo.bind(window);
    window.scrollTo = function (...args) {
      window.__scrollLog.push({ call: JSON.stringify(args), y0: window.scrollY, at: Math.round(performance.now()), stack: (new Error()).stack.split("\\n").slice(1,4).join(" | ") });
      return orig(...args);
    };
    document.addEventListener("visibilitychange", () => window.__scrollLog.push({ visibility: document.visibilityState, y: window.scrollY, at: Math.round(performance.now()) }));
    window.addEventListener("load", () => window.__scrollLog.push({ ev: "load", y: window.scrollY, at: Math.round(performance.now()) }));
    document.addEventListener("DOMContentLoaded", () => window.__scrollLog.push({ ev: "DOMContentLoaded", y: window.scrollY, at: Math.round(performance.now()) }));
  `,
});
await navigate(page, ORIGIN + "/study-dashboard/index.html");
await sleep(1000);
const sheetId = await evalJS(page, "window.STUDY_CONTENT.sheets[1].id");
await navigate(page, ORIGIN + "/study-dashboard/index.html?sheet=" + encodeURIComponent(sheetId));
await sleep(1200);
await evalJS(page, `window.scrollTo(0, 1100)`);
await sleep(500);
console.log("stored:", await evalJS(page, `window.StudyStore.getSheetState(${JSON.stringify(sheetId)}).scroll`));
await evalJS(page, `window.__scrollLog = []`);
await page.send("Page.reload");
await sleep(2500);
console.log("scrollY final:", await evalJS(page, "Math.round(window.scrollY)"));
console.log("log:", JSON.stringify(await evalJS(page, "window.__scrollLog"), null, 1));
b.close();
