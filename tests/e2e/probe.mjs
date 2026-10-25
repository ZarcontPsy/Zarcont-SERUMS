/* © 2026 ZARCONT — Sonda de reconocimiento del DOM (Agente 8). No forma parte de la matriz. */
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT = path.join(ROOT, "AUDIT", "evidencias", "agent8-probe");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const nodePath = "C:\\Users\\USARIO\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\node\\bin\\node.exe";

const server = new StaticServer({ root: ROOT, port: 8790, python: "C:\\Python313\\python.exe" });
const profile = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-probe-"));
const chrome = new Chrome({ chromePath, userDataDir: path.join(profile, "profile"), port: 9390 });
try {
  console.log("server", await server.start());
  console.log("chrome", (await chrome.start()).Browser);
  const conn = await chrome.newTarget("about:blank");
  const page = new Page(conn, { browser: chrome, port: 9390 });
  await page.init();
  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/index.html`, { settle: 1200 });
  console.log("HUB metrics", await page.metrics());
  console.log(
    "HUB state",
    await page.eval(`({
      title: document.title,
      cards: Array.from(document.querySelectorAll('.app-card')).map(c => ({app:c.dataset.app, href:c.getAttribute('href'), active:c.className, hidden:c.classList.contains('is-hidden')})),
      open: document.getElementById('openCurrent')?.getAttribute('aria-label'),
      fs: !!document.fullscreenEnabled,
      version: document.getElementById('aboutVersion')?.textContent
    })`),
  );
  await page.screenshot(path.join(OUT, "hub-1440.png"));
  // clic en tarjeta Study Dashboard (lateral)
  const next = await page.click('#nextTop');
  await sleep(900);
  console.log("after next", await page.eval(`({ now: document.getElementById('tbNow').textContent, pos: document.getElementById('tbPos').textContent, active: document.querySelector('.app-card.is-active')?.dataset.app })`));
  console.log("navs", page.navCount());
  await page.screenshot(path.join(OUT, "hub-next.png"));

  console.log("errors", await page.errorsSummary());
  await page.close();
} finally {
  await chrome.stop();
  await server.stop();
}
