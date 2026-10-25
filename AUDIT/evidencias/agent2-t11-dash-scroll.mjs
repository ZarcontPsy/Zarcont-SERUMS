/* A2-DASH-SCROLL — posición de lectura: entrada directa, refresco, salida y reentrada
   sin reanudación. Compara el comportamiento con la corrección aplicada. */
import { connect, newPage, navigate, evalJS, sleep, ORIGIN, setVisibility, report } from "./agent2-lib.mjs";

const out = { app: "study-dashboard-scroll", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const b = await connect();
const page = await newPage(b, ORIGIN + "/study-dashboard/index.html");
await sleep(1600);
const id = await evalJS(page, "window.STUDY_CONTENT.sheets[8].id");
await evalJS(page, `window.StudyStore.setSheetScroll(${JSON.stringify(id)}, 0)`);

/* 1. entrada directa + lectura al 70 % */
await navigate(page, ORIGIN + "/study-dashboard/index.html?sheet=" + encodeURIComponent(id));
await sleep(1500);
await evalJS(page, `(() => { const max = document.documentElement.scrollHeight - window.innerHeight; window.scrollTo(0, Math.round(max * 0.7)); return true; })()`);
await sleep(400);
await setVisibility(page, true);   // guarda por flushReading
await sleep(400);
await setVisibility(page, false);
await sleep(400);
const saved = await evalJS(page, `(() => { const st = window.StudyStore.getSheetState(${JSON.stringify(id)}); return { stored: st.scroll, y: Math.round(window.scrollY), views: st.views }; })()`);
step("1 lectura al 70 % + pestaña oculta/visible", saved);

/* 2. refrescar: ¿vuelve a la posición? */
await page.send("Page.reload");
await sleep(2200);
const reload = await evalJS(page, `(() => { const st = window.StudyStore.getSheetState(${JSON.stringify(id)}); return { y: Math.round(window.scrollY), stored: st.scroll, views: st.views,
  max: document.documentElement.scrollHeight - window.innerHeight }; })()`);
step("2 refrescar en #/ficha", reload);

/* 3. salir al panel (guarda) y reentrar por la biblioteca (sin reanudar) */
await evalJS(page, `document.querySelector('.s-navlink[href="#/"]').click()`);
await sleep(700);
await evalJS(page, `location.hash = "#/biblioteca"`);
await sleep(700);
await evalJS(page, `(() => { const a = document.querySelector('a[href*="#/ficha/"]'); if (a) a.click(); })()`);
await sleep(900);
const reentry = await evalJS(page, `(() => { const st = window.StudyStore.getSheetState(${JSON.stringify(id)}); return { hash: location.hash, y: Math.round(window.scrollY), stored: st.scroll }; })()`);
step("3 reentrada por biblioteca (sin reanudar)", reentry);

/* 4. salir estando arriba: no debe borrar la posición guardada */
await evalJS(page, `document.querySelector('.s-navlink[href="#/"]').click()`);
await sleep(800);
const afterLeave = await evalJS(page, `(() => { const st = window.StudyStore.getSheetState(${JSON.stringify(id)}); return { stored: st.scroll, hash: location.hash }; })()`);
step("4 salir desde el inicio de la ficha", afterLeave);

/* 5. reentrada directa: vuelve a la posición */
await navigate(page, ORIGIN + "/study-dashboard/index.html?sheet=" + encodeURIComponent(id));
await sleep(1800);
const final = await evalJS(page, `(() => ({ y: Math.round(window.scrollY), max: document.documentElement.scrollHeight - window.innerHeight,
  stored: window.StudyStore.getSheetState(${JSON.stringify(id)}).scroll }))()`);
step("5 reentrada directa ?sheet=", final);

out.errors = page.errors;
report("AUDIT/evidencias/agent2-dash-scroll-despues.json", out);
await b.send("Target.closeTarget", { targetId: page.targetId });
b.close();
