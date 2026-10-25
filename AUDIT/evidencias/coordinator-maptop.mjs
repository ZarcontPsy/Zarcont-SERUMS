/* © 2026 ZARCONT — Medición del topbar de Plazas (coordinador). */
import { Chrome, Page } from "../../tests/e2e/lib/cdp.mjs";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import path from "node:path";
const ROOT = path.resolve(".");
const PORT = 8768, CDP = 9368;
const server = new StaticServer({ root: ROOT, port: PORT, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(process.env.TEMP, "serums-maptop"), port: CDP });
let page;
try {
  await server.start(); await chrome.start(); await chrome.newTarget("about:blank");
  page = new Page([...chrome.pages][0], { browser: chrome, port: CDP }); await page.init();
  for (const [w, h] of [[320,700],[360,700],[390,844]]) {
    await page.viewport(w, h);
    await page.goto(`http://127.0.0.1:${PORT}/serums%20map/serums-map-explorer/index.html`, { settle: 1200 });
    const m = await page.eval(`(() => {
      const tb = document.querySelector('#topbar'); const tr = tb.getBoundingClientRect();
      const items = [...tb.querySelectorAll(':scope > *')].map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName, id: el.id, cls: el.className, w: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right), visible: r.width > 0 }; });
      return { vw: innerWidth, docSW: document.documentElement.scrollWidth, tb: { left: Math.round(tr.left), right: Math.round(tr.right), sw: tb.scrollWidth, cw: tb.clientWidth }, items };
    })()`);
    console.log(`${w}x${h}`, JSON.stringify(m));
    await page.screenshot(`AUDIT/evidencias/coordinator-map-${w}.png`);
  }
} finally { try { await chrome.stop(); } catch {} try { await server.stop(); } catch {} }
