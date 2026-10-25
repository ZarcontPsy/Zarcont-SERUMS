/* A2-VISUAL — estado visual (acordeones, selección) frente a estado persistido
   al cambiar de pestaña y al refrescar. */
import { connect, newPage, evalJS, sleep, ORIGIN, setVisibility, report } from "./agent2-lib.mjs";

const out = { app: "estado-visual", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();

/* --- Flashcards: acordeón de área abierto + búsqueda mental --- */
const flash = await newPage(b, ORIGIN + "/study-flashcards/index.html");
await sleep(1800);
const opened = await evalJS(flash, `(() => {
  const all = [...document.querySelectorAll("details.lib-area")];
  const target = all[2] || all[0];
  if (!target) return { ok: false, count: all.length };
  target.open = true;
  return { ok: true, count: all.length, id: target.getAttribute("data-area-id"), wasOpen: target.open };
})()`);
await setVisibility(flash, true);
await sleep(300);
await setVisibility(flash, false);
await sleep(600);
const afterTab = await evalJS(flash, `(() => {
  const all = [...document.querySelectorAll("details.lib-area")];
  const t = all.find(d => d.getAttribute("data-area-id") === ${JSON.stringify("__")}) ;
  return { openNow: all.map(d => ({ id: d.getAttribute("data-area-id"), open: d.open })) };
})()`);
step("1 flashcards acordeón + pestaña", { opened, afterTab });

/* --- Dashboard biblioteca: filtro escrito + acordeón --- */
const dash = await newPage(b, ORIGIN + "/study-dashboard/index.html#/biblioteca");
await sleep(1800);
const filter = await evalJS(dash, `(() => {
  const input = document.querySelector("#library-search");
  const chips = document.querySelectorAll("[data-filter]");
  if (input) { input.value = "APS"; input.dispatchEvent(new Event("input", { bubbles: true })); }
  const details = [...document.querySelectorAll("details.topic-block")];
  if (details[1]) details[1].open = true;
  return { query: input && input.value, details: details.length, secondOpen: details[1] ? details[1].open : null };
})()`);
await sleep(400);
await setVisibility(dash, true);
await sleep(300);
await setVisibility(dash, false);
await sleep(700);
const afterTabDash = await evalJS(dash, `(() => {
  const input = document.querySelector("#library-search");
  const details = [...document.querySelectorAll("details.topic-block")];
  return { query: input && input.value, secondOpen: details[1] ? details[1].open : null, results: document.querySelectorAll(".sheet-row, .lib-sheet, [data-sheet]").length };
})()`);
await dash.send("Page.reload");
await sleep(1800);
const afterReloadDash = await evalJS(dash, `(() => { const input = document.querySelector("#library-search"); return { query: input && input.value, hash: location.hash }; })()`);
step("2 dashboard biblioteca: filtro y acordeón", { filter, afterTabDash, afterReloadDash });

report("AUDIT/evidencias/agent2-visual-antes.json", out);
for (const p of [flash, dash]) await b.send("Target.closeTarget", { targetId: p.targetId });
b.close();
