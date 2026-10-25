import { connect, newPage, evalJS, sleep, ORIGIN } from "./agent2-lib.mjs";
const b = await connect();
const page = await newPage(b, ORIGIN + "/serums%20map/serums-map-explorer/index.html");
await sleep(3000);
const before = await evalJS(page, `(() => ({ raw: localStorage.getItem("serums_favoritos"), keys: Object.keys(localStorage), quota: (() => { try { return JSON.stringify(localStorage).length; } catch(e) { return String(e); } })() }))()`);
const act = await evalJS(page, `(() => {
  const out = {};
  const p = window.App.allPlazas()[0];
  out.p = { id: p && p.id, codigo: p && p.codigo, profesion: p && p.profesion };
  try { window.App.toggleFav(p); out.ok = true; } catch (e) { out.err = String(e && e.message || e); }
  out.rawAfter = localStorage.getItem("serums_favoritos");
  out.getAfter = window.Store.get("favoritos", []);
  out.getRaw = localStorage.getItem("serums_favoritos");
  return out;
})()`);
await sleep(300);
const after = await evalJS(page, `({ raw: localStorage.getItem("serums_favoritos"), parsed: (() => { try { return JSON.parse(localStorage.getItem("serums_favoritos")); } catch (e) { return String(e); } })() })`);
console.log(JSON.stringify({ before, act, after }, null, 1));
b.close();
