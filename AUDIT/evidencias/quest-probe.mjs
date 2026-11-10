import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import { Chrome, Page, sleep } from "../../tests/e2e/lib/cdp.mjs";
const ROOT = process.cwd();
const server = new StaticServer({ root: ROOT, port: 8796, python: "C:\\Python313\\python.exe" });
await server.start();
const profile = await mkdtemp(path.join(os.tmpdir(), "quest-probe-"));
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(profile,"p"), port: 9396 });
await chrome.start();
const conn = await chrome.newTarget("about:blank");
const page = new Page(conn, { browser: chrome, port: 9396 });
await page.init();
await page.goto(server.baseURL + "/serums-quest/index.html", { settle: 6000 });
const data = await page.eval(`(() => {
  const ids = ["view","screen","ui","game","app"];
  return {
    url: location.href,
    title: document.title,
    ids: Object.fromEntries(ids.map(id => { const el = document.getElementById(id); return [id, el ? {hidden: el.hidden, text: (el.innerText||"").replace(/\\s+/g," ").trim().slice(0,120)} : null]; })),
    tutorial: !!document.querySelector('[data-action="tutorial-skip"]'),
    body: (document.body.innerText||"").replace(/\\s+/g," ").trim().slice(0,240)
  };
})()`);
console.log(JSON.stringify(data, null, 2));
await page.close(); await chrome.stop(); await server.stop();
