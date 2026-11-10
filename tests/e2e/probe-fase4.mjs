/* © 2026 ZARCONT — Sonda de desarrollo para la suite de Fase 4 (Agente 6).
 *
 * Ejecuta SOLO `runDashboardFase4` (DASH-45…48, F4-FLASH, F4-HUB) contra el
 * servidor local y Chrome headless. No forma parte de la matriz de `run.mjs`;
 * sirve para validar la suite mientras la integración de la fase está en curso.
 *
 * Uso: node tests/e2e/probe-fase4.mjs
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir } from "node:fs/promises";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
import { Harness } from "./lib/harness.mjs";
import { runDashboardFase4 } from "./suites/dash-fase4.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const PORT = 8795;
const CDP_PORT = 9395;
const EVIDENCE = path.join(ROOT, "AUDIT", "evidencias", "agente6-fase4-probe");

async function main() {
  const profileRoot = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-fase4-"));
  const server = new StaticServer({ root: ROOT, port: PORT, python: PYTHON });
  await server.start();
  const chrome = new Chrome({
    chromePath: CHROME,
    userDataDir: path.join(profileRoot, "profile"),
    port: CDP_PORT,
  });
  const h = new Harness({ evidenceDir: EVIDENCE, baseURL: server.baseURL, evidenceName: "agente6-fase4-probe" });
  await mkdir(path.join(EVIDENCE, "img"), { recursive: true });
  let page = null;
  try {
    await chrome.start();
    const conn = await chrome.newTarget("about:blank");
    page = new Page(conn, { browser: chrome, port: CDP_PORT });
    await page.init();
    await page.viewport(1440, 900);
    await runDashboardFase4({ h, page, baseURL: server.baseURL });
  } catch (err) {
    console.error("ERROR EN LA SONDA:", err && err.stack ? err.stack : err);
    h.results.push({
      id: "PROBE-FATAL",
      app: "Fase 4",
      suite: "Study Dashboard · Fase 4",
      description: "La sonda se detuvo por una excepción no controlada",
      severity: "alta",
      status: "FAIL",
      durationMs: 0,
      observations: null,
      error: String(err && err.message ? err.message : err),
      evidence: [],
      at: new Date().toISOString(),
    });
  } finally {
    try { if (page) await page.close(); } catch {}
    await chrome.stop().catch(() => {});
    await server.stop().catch(() => {});
  }
  const summary = h.summary();
  const written = await h.write("run-probe.json");
  console.log(`\nSONDA FASE 4 · TOTAL ${summary.total} · PASS ${summary.counts.PASS} · FAIL ${summary.counts.FAIL} · SKIP ${summary.counts.SKIP}`);
  console.log(`JSON: ${written.file}`);
  for (const result of summary.results) {
    if (result.status !== "PASS") console.log(`  ${result.status} ${result.id}: ${result.error || ""}`);
  }
  await sleep(200);
  process.exit(summary.counts.FAIL > 0 ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
