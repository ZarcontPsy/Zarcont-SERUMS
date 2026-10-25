/* © 2026 ZARCONT — Ejecutor de la matriz E2E (Agente 8).
 *
 * Uso:
 *   node tests/e2e/run.mjs
 *   node tests/e2e/run.mjs --suite=hub,study
 *   node tests/e2e/run.mjs --quick
 *
 * Requisitos: Node 24, Python 3.13, Chrome. Ver tests/e2e/README.md.
 */
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { StaticServer } from "./lib/server.mjs";
import { Chrome, Page, sleep } from "./lib/cdp.mjs";
import { Harness, fmt, skip } from "./lib/harness.mjs";
import { runContent } from "./suites/content.mjs";
import { runHub } from "./suites/hub.mjs";
import { runDashboard, runFlashcards } from "./suites/study.mjs";
import { runQuest } from "./suites/quest.mjs";
import { runPlazas } from "./suites/plazas.mjs";
import { runBanqueo } from "./suites/banqueo.mjs";
import { runResponsive } from "./suites/responsive.mjs";
import { runPersistence } from "./suites/persistence.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PYTHON = "C:\\Python313\\python.exe";
const PORT = 8790;
const CDP_PORT = 9390;

const args = new Map(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v === undefined ? true : v];
    }),
);
const EVIDENCE_NAME = args.has("out") ? String(args.get("out")) : "agent8-baseline";
const EVIDENCE = path.join(ROOT, "AUDIT", "evidencias", EVIDENCE_NAME);
const only = args.has("suite") ? String(args.get("suite")).split(",").map((s) => s.trim().toLowerCase()) : null;
const quick = args.has("quick");

function wanted(name) {
  if (!only) return true;
  return only.some((n) => name.toLowerCase().includes(n));
}

async function fileState(files) {
  const out = {};
  for (const rel of files) {
    try {
      const full = path.join(ROOT, rel);
      const s = await stat(full);
      const buf = await readFile(full);
      out[rel] = { size: buf.length, mtimeMs: Math.round(s.mtimeMs), sha1ish: (await import("node:crypto")).createHash("sha1").update(buf).digest("hex") };
    } catch (err) {
      out[rel] = { error: err.code || err.message };
    }
  }
  return out;
}

const WATCHED_FILES = [
  "index.html",
  "serums-chrome.js",
  "serums-chrome.css",
  "study-dashboard/index.html",
  "study-dashboard/app.js",
  "study-flashcards/index.html",
  "study-flashcards/app.js",
  "study-shared/store.js",
  "study-shared/taxonomy.js",
  "study-shared/ui.js",
  "study-shared/base.css",
  "serums-quest/index.html",
  "serums-quest/js/app.js",
  "serums-quest/js/store.js",
  "serums-quest/js/characters.js",
  "EXAMEN STUDIO/Examen Studio.html",
  "EXAMEN STUDIO/js/app.js",
  "EXAMEN STUDIO/js/store.js",
  "EXAMEN STUDIO/js/parser.js",
  "serums map/serums-map-explorer/index.html",
  "serums map/serums-map-explorer/js/app.js",
  "serums map/serums-map-explorer/js/services.js",
  "serums map/serums-map-explorer/styles.css",
];

function gitState() {
  try {
    const status = execFileSync("git", ["status", "--porcelain=v1"], { cwd: ROOT, encoding: "utf8" });
    const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
    return { head, status: status.split(/\r?\n/).filter(Boolean) };
  } catch (err) {
    return { error: err.message };
  }
}

function printTable(summary) {
  const rows = summary.results.map((r) => ({
    id: r.id,
    app: r.app,
    estado: r.status,
    prueba: r.description,
    ms: r.durationMs,
    detalle: r.error || "",
  }));
  const headers = ["ID", "App", "Estado", "Prueba", "ms", "Detalle"];
  const widths = [10, 16, 7, 62, 8, 56];
  const line = (cells) =>
    cells
      .map((c, i) => {
        let s = String(c ?? "").replace(/\s+/g, " ").trim();
        if (s.length > widths[i]) s = s.slice(0, widths[i] - 1) + "…";
        return s.padEnd(widths[i]);
      })
      .join(" | ");
  console.log("\n" + line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("-+-"));
  for (const r of rows) console.log(line([r.id, r.app, r.estado, r.prueba, r.ms, r.detalle]));
  console.log(`\nTOTAL ${summary.total} · PASS ${summary.counts.PASS} · FAIL ${summary.counts.FAIL} · SKIP ${summary.counts.SKIP}`);
}

async function main() {
  const startedAt = new Date().toISOString();
  const stateBefore = await fileState(WATCHED_FILES);
  const gitBefore = gitState();
  const profileRoot = await mkdtemp(path.join(os.tmpdir(), "zarcont-qa-"));

  const server = new StaticServer({ root: ROOT, port: PORT, python: PYTHON });
  await server.start();

  const h = new Harness({ evidenceDir: EVIDENCE, baseURL: server.baseURL, evidenceName: EVIDENCE_NAME });
  await mkdir(path.join(EVIDENCE, "img"), { recursive: true });

  const mainChrome = new Chrome({
    chromePath: CHROME,
    userDataDir: path.join(profileRoot, "profile-main"),
    port: CDP_PORT,
  });
  let page = null;
  try {
    await mainChrome.start();
    const mainConn = await mainChrome.newTarget("about:blank");
    page = new Page(mainConn, { browser: mainChrome, port: CDP_PORT });
    await page.init();
    await page.viewport(1440, 900);

    if (wanted("content")) await runContent({ h, page, baseURL: server.baseURL });
    if (wanted("hub")) await runHub({ h, page, baseURL: server.baseURL });
    if (wanted("dash") || wanted("study")) await runDashboard({ h, page, baseURL: server.baseURL });
    if (wanted("flash") || wanted("study")) await runFlashcards({ h, page, baseURL: server.baseURL });
    if (wanted("quest") || wanted("serum")) await runQuest({ h, page, baseURL: server.baseURL });
    if (wanted("plaza") || wanted("map") || wanted("serum")) await runPlazas({ h, page, baseURL: server.baseURL });
    if (wanted("banq") || wanted("examen")) await runBanqueo({ h, page, baseURL: server.baseURL });
    if (!quick && (wanted("responsive") || wanted("resp"))) await runResponsive({ h, page, baseURL: server.baseURL });

    await page.close();
    page = null;
    await mainChrome.stop();
    await sleep(600);

    if (!quick && (wanted("persist") || !only)) {
      const persistChrome = new Chrome({
        chromePath: CHROME,
        userDataDir: path.join(profileRoot, "profile-persist"),
        port: CDP_PORT,
      });
      try {
        await persistChrome.start();
        await runPersistence({ h, chrome: persistChrome, port: CDP_PORT, baseURL: server.baseURL });
      } finally {
        await persistChrome.stop();
      }
    }
  } catch (err) {
    console.error("ERROR FATAL DEL EJECUTOR:", err && err.stack ? err.stack : err);
    h.results.push({
      id: "RUN-FATAL",
      app: "Ejecutor",
      suite: "Ejecutor",
      description: "El ejecutor se detuvo por una excepción no controlada",
      severity: "alta",
      status: "FAIL",
      durationMs: 0,
      observations: null,
      error: err && err.stack ? err.stack.split("\n").slice(0, 8).join(" | ") : String(err),
      evidence: [],
      at: new Date().toISOString(),
    });
  } finally {
    try {
      if (page) await page.close();
    } catch {}
    try {
      await mainChrome.stop();
    } catch {}
    await server.stop();
  }

  const stateAfter = await fileState(WATCHED_FILES);
  const changedDuringRun = Object.keys(stateBefore).filter(
    (k) => stateBefore[k] && stateAfter[k] && stateBefore[k].sha1ish !== stateAfter[k].sha1ish,
  );
  const summary = h.summary();
  summary.environment = {
    node: process.version,
    chrome: mainChrome.browserInfo ? mainChrome.browserInfo.Browser : null,
    server: server.baseURL,
    cdpPort: CDP_PORT,
    profileRoot,
  };
  summary.repo = { git: gitBefore, watchedFiles: stateBefore, changedDuringRun };
  summary.stable = changedDuringRun.length === 0;
  const written = await h.write(quick ? "run-quick.json" : "run.json");
  // h.write vuelve a resumir; se añaden entorno y estado del repo medidos por el ejecutor.
  const finalJson = { ...summary, ...written.data, environment: summary.environment, repo: summary.repo, stable: summary.stable };
  await writeFile(written.file, JSON.stringify(finalJson, null, 2));
  await writeFile(
    path.join(EVIDENCE, "run-meta.json"),
    JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), environment: summary.environment, repo: summary.repo }, null, 2),
  );
  printTable(summary);
  console.log(`\nJSON: ${written.file}`);
  if (changedDuringRun.length) {
    console.log(`ATENCIÓN: ${changedDuringRun.length} archivo(s) cambiaron durante la ejecución; línea base inestable:`);
    for (const f of changedDuringRun) console.log(`  - ${f}`);
  }
  console.log(`RESULTADO: PASS=${summary.counts.PASS} FAIL=${summary.counts.FAIL} SKIP=${summary.counts.SKIP}`);
  const code = summary.counts.FAIL > 0 ? 2 : 0;
  await sleep(200);
  process.exit(code);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
