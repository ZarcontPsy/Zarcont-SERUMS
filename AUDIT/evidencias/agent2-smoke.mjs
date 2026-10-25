import { connect, newPage, navigate, evalJS, sleep, ORIGIN, screenshot } from "./agent2-lib.mjs";

const b = await connect();
const page = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1500);
const probe = await evalJS(page, `(() => ({
  url: location.href,
  title: document.title,
  ready: !!(window.StudyStore && window.StudyStore.isReady()),
  stats: window.StudyStore ? window.StudyStore.getDashboardStats().completedSheets : null,
  h1: (document.querySelector("h1")||{}).textContent
}))()`);
console.log(JSON.stringify(probe, null, 1));
await screenshot(page, "AUDIT/evidencias/agent2-smoke.png");
b.close();
