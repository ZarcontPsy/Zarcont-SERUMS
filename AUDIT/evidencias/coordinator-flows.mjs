/* © 2026 ZARCONT — Verificación independiente de flujos señalados por QA. */
import { Chrome, Page } from "../../tests/e2e/lib/cdp.mjs";
import { StaticServer } from "../../tests/e2e/lib/server.mjs";
import path from "node:path";
const ROOT = path.resolve(".");
const PORT = 8770, CDP = 9370;
const server = new StaticServer({ root: ROOT, port: PORT, python: "C:\\Python313\\python.exe" });
const chrome = new Chrome({ chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", userDataDir: path.join(process.env.TEMP, "serums-flow-test"), port: CDP });
let page;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const base = `http://127.0.0.1:${PORT}`;
try {
  await server.start(); await chrome.start();
  page = new Page(await chrome.newTarget("about:blank"), { browser: chrome, port: CDP });
  await page.init(); await page.viewport(1440, 900);

  // 1. Dashboard: portada -> biblioteca -> área -> categoría -> tema -> ficha.
  await page.goto(`${base}/study-dashboard/index.html#/biblioteca`, { settle: 900 });
  const areaHref = await page.eval(`(() => { const a = document.querySelector('#view-root a[href^="#/biblioteca/area-"], #view-root a[href^="#/biblioteca/"]'); return a ? a.getAttribute('href') : null; })()`);
  if (areaHref) { await page.eval(`location.hash = ${JSON.stringify(areaHref)}; true`); await sleep(600); }
  const dashArea = await page.eval(`({ h1: document.querySelector('#view-root h1')?.innerText || '', cats: [...document.querySelectorAll('#view-root a[href^="#/biblioteca/"]')].map(a => a.getAttribute('href')).slice(0, 8) })`);
  const catHref = await page.eval(`(() => { const a = document.querySelector('#view-root a[href^="#/biblioteca/area-"][href*="/"]'); return a ? a.getAttribute('href') : null; })()`);
  if (catHref) { await page.eval(`location.hash = ${JSON.stringify(catHref)}; true`); await sleep(600); }
  const details = await page.eval(`document.querySelectorAll('#view-root details.topic-block').length`);
  if (details) await page.eval(`document.querySelector('#view-root details.topic-block summary').click(); true`);
  await sleep(250);
  const sheetHref = await page.eval(`(() => { const a = document.querySelector('#view-root a[href^="#/ficha/"]'); return a ? a.getAttribute('href') : null; })()`);
  if (sheetHref) { await page.eval(`location.hash = ${JSON.stringify(sheetHref)}; true`); await sleep(600); }
  const dashFicha = await page.eval(`({ hash: location.hash, h1: document.querySelector('#view-root h1')?.innerText || '' })`);
  console.log("DASH", JSON.stringify({ dashArea, catHref, details, sheetHref, dashFicha }));

  // 2. Flashcards: abrir área -> fila de mazo -> ficha; sin recarga.
  await page.goto(`${base}/study-flashcards/index.html`, { settle: 900 });
  const navBefore = page.navCount();
  await page.click("details.lib-area summary");
  await sleep(350);
  const rowHref = await page.eval(`(() => { const a = document.querySelector('a.deck-row-link'); return a ? a.getAttribute('href') : null; })()`);
  if (rowHref) { await page.click(`a[href="${rowHref}"]`); await sleep(500); }
  const flash = await page.eval(`({ hash: location.hash, rows: document.querySelectorAll('.deck-row').length, h1: document.querySelector('#view-root h1')?.innerText || document.querySelector('main h1')?.innerText || '' })`);
  console.log("FLASH", JSON.stringify({ rowHref, flash, navs: page.navCount() - navBefore }));

  // 3. QUEST: foco de Mara sin reconstruir #view.
  await page.goto(`${base}/serums-quest/index.html#/personajes`, { settle: 1100 });
  const questBefore = await page.eval(`(() => { const v=document.querySelector('#view'); const m=document.createElement('i'); m.id='coord-flow-sentinel'; v.appendChild(m); return { focused: [...document.querySelectorAll('.q-strip-card.is-focused')].map(c=>c.dataset.character) }; })()`);
  await page.click('.q-strip-card[data-action="char-focus"][data-character="mara"]');
  await sleep(450);
  const questAfter = await page.eval(`(() => ({ hash: location.hash, sentinel: !!document.querySelector('#coord-flow-sentinel'), focused: [...document.querySelectorAll('.q-strip-card.is-focused')].map(c=>c.dataset.character), title: document.querySelector('#view h1')?.innerText || '' }))()`);
  console.log("QUEST", JSON.stringify({ questBefore, questAfter }));

  // 4. Plazas: favoritos y ficha (sin mapa, fallback).
  await page.goto(`${base}/serums%20map/serums-map-explorer/index.html`, { settle: 1200 });
  const plazas = await page.eval(`({ rows: document.querySelectorAll('#resultsBody .rescard, .rescard').length, favBadge: document.querySelector('#favBadge')?.textContent || '', adjBadge: document.querySelector('#adjBadge')?.textContent || '', mapError: !!document.querySelector('#mapError') && document.querySelector('#mapError').offsetHeight > 0 })`);
  console.log("PLAZAS", JSON.stringify(plazas));
} finally {
  try { await chrome.stop(); } catch {}
  try { await server.stop(); } catch {}
}
