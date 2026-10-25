/* Escenario A2-PLAZAS — Plazas SERUMS: favoritos, adjudicadas, tema, filtros,
   pestaña, plaza seleccionada, visibilidad, refresco y claves serums_*. */
import { connect, newPage, navigate, evalJS, sleep, ORIGIN, screenshot, setVisibility, setViewport, report } from "./agent2-lib.mjs";

const out = { app: "plazas", steps: [] };
function step(name, data) { out.steps.push({ name, ...data }); console.log("· " + name + " → " + JSON.stringify(data)); }
const storeDump = `(() => ({
  keys: Object.keys(localStorage).filter(k => k.indexOf("serums_") === 0),
  favs: window.Store.get("favoritos", []).length,
  adjs: Object.keys(window.Store.get("adjudicadas", {})).length,
  theme: window.Store.get("theme", "dark"),
  search: window.App.S.filters.search, prov: window.App.S.filters.provincia,
  view: window.App.S.view, sideTab: window.App.S.sideTab, quick: window.App.S.quick,
  selectedId: window.App.S.selectedId,
  cards: document.querySelectorAll(".resitem").length,
  favBadge: (document.getElementById("favBadge")||{}).textContent
}))()`;

const b = await connect();
const page = await newPage(b, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
await sleep(3000);
step("0 carga", await evalJS(page, `(() => ({ url: location.href, title: document.title, plazas: window.App.allPlazas().length,
  mapReady: !!(window.MapView && window.MapView.map), errors: (document.getElementById("mapError")||{}).textContent || "",
  key: Object.keys(localStorage).filter(k => k.indexOf("serums_") === 0), favs: window.Store.get("favoritos", []).length }))()`));

/* --- favorito + tema + filtro --- */
const acted = await evalJS(page, `(() => {
  const fav = document.querySelector('[data-act="fav"]');
  const card = document.querySelector(".resitem");
  if (fav) fav.click();
  const theme = document.getElementById("btnTheme"); if (theme) theme.click();
  const search = document.getElementById("filterSearch");
  if (search) { search.value = "LIMA"; search.dispatchEvent(new Event("input", { bubbles: true })); }
  const prov = document.getElementById("selProvincia"); if (prov) { prov.value = prov.options[1] ? prov.options[1].value : ""; prov.dispatchEvent(new Event("change", { bubbles: true })); }
  if (card) card.click();
  return { favClicked: !!fav, themeClicked: !!theme, search: !!search, prov: !!prov };
})()`);
await sleep(1200);
const afterAct = await evalJS(page, storeDump);
step("1 favorito + tema + filtro + selección", { acted, afterAct });

/* --- visibilidad --- */
const navsBefore = page.navs;
await setVisibility(page, true);
await sleep(350);
await setVisibility(page, false);
await sleep(400);
step("2 pestaña oculta/visible", { after: await evalJS(page, storeDump), navsDuring: page.navs - navsBefore });

/* --- refrescar --- */
await page.send("Page.reload");
await sleep(3500);
const afterReload = await evalJS(page, storeDump);
step("3 refrescar", afterReload);

/* --- volver al hub y reentrar (navegación completa) --- */
await navigate(page, ORIGIN + "/index.html");
await sleep(1200);
await navigate(page, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
await sleep(3000);
const reentry = await evalJS(page, storeDump);
step("4 reentrar desde el HUB", reentry);

/* --- atrás/adelante --- */
await evalJS(page, "history.back()");
await sleep(1500);
const back = await evalJS(page, `({ url: location.href, title: document.title })`);
await evalJS(page, "history.forward()");
await sleep(2500);
step("5 atrás/adelante", { back, fwd: await evalJS(page, `({ url: location.href, title: document.title, cards: document.querySelectorAll(".resitem").length })`) });

/* --- orientación --- */
await setViewport(page, 390, 844, true);
const portrait = await evalJS(page, `({ w: innerWidth, view: window.App.S.view, sideOpen: document.getElementById("side").classList.contains("open") })`);
await setViewport(page, 844, 390, true);
const landscape = await evalJS(page, `({ w: innerWidth })`);
await setViewport(page, 1280, 800, false);
step("6 orientación", { portrait, landscape });

/* --- pestaña de estado (favoritos) y subvista --- */
await evalJS(page, `window.App.go("favoritos")`);
await sleep(600);
const favView = await evalJS(page, `(() => ({ view: window.App.S.view, hash: location.hash, rows: document.querySelectorAll("#favBody .resitem").length,
  tabs: document.querySelectorAll("#favTabs [data-stab]").length }))()`);
step("7 subvista favoritos", favView);

await screenshot(page, "AUDIT/evidencias/agent2-plazas-final.png");
out.errors = page.errors.filter(e => !/Maps|googleapis|net::ERR|Failed to load resource/i.test(e));
report("AUDIT/evidencias/agent2-plazas-antes.json", out);
await b.send("Target.closeTarget", { targetId: page.targetId });
b.close();
