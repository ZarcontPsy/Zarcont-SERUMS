/* © 2026 ZARCONT — Cobertura de «Fichas relacionadas» en las 210 fichas.
 * Navega por todas las fichas reales en Chrome headless y comprueba que el
 * bloque existe, no supera 4 tarjetas, no repite fichas y enlaza solo a IDs
 * existentes.
 *
 * Uso, desde study-dashboard/:
 *   node tests/nav/related-coverage.mjs
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp } from "node:fs/promises";
import { StaticServer } from "../../../tests/e2e/lib/server.mjs";
import { Chrome, Page } from "../../../tests/e2e/lib/cdp.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const server = new StaticServer({ root: ROOT, port: 8799, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({
  chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  userDataDir: path.join(await mkdtemp(path.join(os.tmpdir(), "qa-nav-related-")), "p"),
  port: 9399
});
let page = null;

try {
  await server.start();
  await chrome.start();
  page = new Page(await chrome.newTarget("about:blank"), { browser: chrome, port: 9399 });
  await page.init();
  await page.viewport(1440, 900);
  await page.goto(`${server.baseURL}/study-dashboard/index.html#/ficha/sheet-aps-01`, { settle: 1000 });
  await page.conn.send("Page.bringToFront");

  const ids = await page.eval(`STUDY_CONTENT.sheets.map((sheet) => sheet.id)`);
  const missing = [];
  const bad = [];
  for (const id of ids) {
    await page.eval(`StudyApp.navigate(${JSON.stringify("#/ficha/" + id)})`);
    await new Promise((resolve) => setTimeout(resolve, 80));
    let ok = await page.waitFor(
      `!!document.querySelector('article.reader[data-sheet-id=${JSON.stringify(id)}]') &&
       document.querySelectorAll('[data-module-mount="reader-related"] .navx-related-card').length > 0`,
      { timeout: 8000, message: id }
    ).then(() => true).catch(() => false);
    if (!ok) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      ok = await page.eval(`(() => {
        const article = document.querySelector('article.reader');
        const mount = document.querySelector('[data-module-mount="reader-related"]');
        return !!article && article.dataset.sheetId === ${JSON.stringify(id)} && !!mount && mount.querySelectorAll('.navx-related-card').length > 0;
      })()`);
    }
    if (!ok) { missing.push(id); continue; }
    const info = await page.eval(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-module-mount="reader-related"] .navx-related-card'));
      const hrefs = cards.map((card) => card.getAttribute('href'));
      const targets = hrefs.map((href) => decodeURIComponent(String(href || '').replace('#/ficha/', '')));
      return {
        count: cards.length,
        unique: new Set(hrefs).size,
        existing: targets.every((target) => !!StudyStore.getSheet(target)),
        reasons: cards.map((card) => (card.querySelector('.navx-related-reason') || {}).textContent || ''),
        tags: cards.map((card) => (card.querySelector('.navx-related-tag') || {}).textContent || '')
      };
    })()`);
    if (info.count > 4 || info.unique !== info.count || !info.existing ||
        info.reasons.some((reason) => !reason.trim()) || info.tags.some((tag) => !tag.trim())) {
      bad.push({ id, info });
    }
  }
  console.log(`Fichas comprobadas: ${ids.length}`);
  console.log(`Sin bloque: ${missing.length}${missing.length ? " → " + missing.join(", ") : ""}`);
  console.log(`Bloques inválidos: ${bad.length}`);
  if (bad.length) console.log(JSON.stringify(bad.slice(0, 5), null, 2));
  if (missing.length || bad.length) process.exitCode = 1;
} catch (error) {
  console.error("Cobertura de relacionadas falló:", error && error.stack ? error.stack : error);
  process.exitCode = 1;
} finally {
  if (page) await page.close().catch(() => {});
  await chrome.stop().catch(() => {});
  await server.stop().catch(() => {});
}
