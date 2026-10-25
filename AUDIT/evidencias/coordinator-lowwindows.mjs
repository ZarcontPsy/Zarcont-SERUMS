/* © 2026 ZARCONT — Medición de ventanas de escritorio bajas (coordinador). */
import { Chrome, Page } from "../../tests/e2e/lib/cdp.mjs";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import path from "node:path";
const ROOT = path.resolve(".");
const PORT = 8767, CDP = 9367;
const server = new StaticServer({ root: ROOT, port: PORT, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(process.env.TEMP, "serums-lowwin"), port: CDP });
let page;
try {
  await server.start(); await chrome.start(); await chrome.newTarget("about:blank");
  page = new Page([...chrome.pages][0], { browser: chrome, port: CDP }); await page.init();
  for (const [w, h] of [[1280,650],[1280,600],[1024,600],[900,600],[768,600],[700,600],[640,600],[600,650],[1440,700],[1366,720],[1024,768]]) {
    await page.viewport(w, h);
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { settle: 600 });
    await page.screenshot(`AUDIT/evidencias/coordinator-${w}x${h}.png`);
    const m = await page.eval(`(() => { const bar=document.querySelector('.carousel-bar').getBoundingClientRect(); const dots=document.querySelector('.dots').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, ih: innerHeight, barBottom: Math.round(bar.bottom), dotsBottom: Math.round(dots.bottom), cardH: Math.round(document.querySelector('.app-card.is-active').getBoundingClientRect().height) }; })()`);
    console.log(`${w}x${h}`, JSON.stringify(m));
  }
} finally { try { await chrome.stop(); } catch {} try { await server.stop(); } catch {} }
