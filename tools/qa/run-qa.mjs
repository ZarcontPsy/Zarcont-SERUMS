/* © 2026 ZARCONT — Orquestador de QA del Study Dashboard (Agente 6).
 *
 * Uso:
 *   node tools/qa/run-qa.mjs                 # contraste + peso + peso-apps + axe + capturas
 *   node tools/qa/run-qa.mjs --skip-axe      # sin navegador para axe
 *   node tools/qa/run-qa.mjs --skip-capturas
 *   node tools/qa/run-qa.mjs --quick         # contraste + peso (sin peso-apps, axe ni capturas)
 *
 * Devuelve código 1 si cualquier bloque falla. Evidencias en tools/qa/salida/.
 * No modifica la app ni necesita dependencias npm: axe-core vive en
 * tools/qa/vendor/axe.min.js y el navegador es Chrome headless por CDP.
 */
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runContrast } from "./contraste.mjs";
import { runWeight } from "./peso.mjs";
import { runAppsWeight } from "./peso-apps.mjs";
import { runAxeAudit } from "./axe-audit.mjs";
import { runCaptures } from "./capturas.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const OUT_DIR = path.join(HERE, "salida");

const args = new Set(process.argv.slice(2).filter((arg) => arg.startsWith("--")));
const quiet = args.has("--quiet");
const quick = args.has("--quick");
const skip = {
  contraste: args.has("--skip-contraste"),
  peso: args.has("--skip-peso"),
  pesoApps: args.has("--skip-peso-apps") || quick,
  axe: args.has("--skip-axe") || quick,
  capturas: args.has("--skip-capturas") || quick,
};

async function step(name, fn) {
  const started = Date.now();
  if (!quiet) console.log(`\n=== ${name} ===`);
  try {
    const result = await fn();
    return {
      name,
      status: result.ok ? "PASS" : "FAIL",
      durationMs: Date.now() - started,
      detail: result.payload ? result.payload.summary : null,
      files: result.file ? [result.file] : [],
    };
  } catch (err) {
    console.error(`[ERROR] ${name}:`, err && err.stack ? err.stack : err);
    return { name, status: "FAIL", durationMs: Date.now() - started, detail: null, error: String(err && err.message ? err.message : err) };
  }
}

async function main() {
  const steps = [];
  if (!skip.contraste) {
    steps.push(await step("Contraste de tokens", async () => {
      const result = await runContrast({ quiet });
      return { ...result, file: result.jsonFile };
    }));
  }
  if (!skip.peso) steps.push(await step("Peso de carga y derivados bajo demanda", () => runWeight({ quiet })));
  if (!skip.pesoApps) steps.push(await step("Peso de apps y coste de H4", () => runAppsWeight({ quiet })));
  if (!skip.axe) steps.push(await step("Auditoría axe-core", () => runAxeAudit({ quiet })));
  if (!skip.capturas) steps.push(await step("Capturas y métricas", () => runCaptures({ quiet })));

  const failed = steps.filter((s) => s.status === "FAIL");
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "tools/qa/run-qa.mjs",
    environment: { node: process.version, cwd: ROOT, quick },
    summary: {
      steps: steps.length,
      pass: steps.filter((s) => s.status === "PASS").length,
      fail: failed.length,
      ok: failed.length === 0 && steps.length > 0,
    },
    steps,
  };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "resumen.json"), JSON.stringify(payload, null, 2));
  await writeFile(path.join(OUT_DIR, "resumen.md"), renderSummary(payload, steps));

  console.log(`\nRESULTADO QA: ${payload.summary.pass}/${payload.summary.steps} bloques en verde · ${failed.length ? "FALLO" : "OK"}`);
  for (const stepResult of steps) {
    console.log(`  ${stepResult.status === "PASS" ? "PASS" : "FAIL"} ${stepResult.name} (${(stepResult.durationMs / 1000).toFixed(1)} s)`);
  }
  console.log(`  resumen: ${path.relative(ROOT, path.join(OUT_DIR, "resumen.json"))}`);
  return payload.summary.ok;
}

function renderSummary(payload, steps) {
  const lines = [];
  lines.push("# QA — resumen (Fases 0–4)");
  lines.push("");
  lines.push(`Generado por \`tools/qa/run-qa.mjs\` el ${payload.generatedAt}.`);
  lines.push("");
  lines.push("| Bloque | Estado | Duración | Evidencia |");
  lines.push("|---|---|---:|---|");
  for (const item of steps) {
    const evidence = item.files.length ? item.files.map((file) => `\`${path.relative(ROOT, file).replace(/\\/g, "/")}\``).join(", ") : "—";
    lines.push(`| ${item.name} | ${item.status === "PASS" ? "PASA" : "**FALLA**"} | ${(item.durationMs / 1000).toFixed(1)} s | ${evidence} |`);
  }
  lines.push("");
  lines.push("## Comandos");
  lines.push("");
  lines.push("```powershell");
  lines.push("node tools/qa/contraste.mjs");
  lines.push("node tools/qa/peso.mjs");
  lines.push("node tools/qa/peso-apps.mjs");
  lines.push("node tools/qa/axe-audit.mjs");
  lines.push("node tools/qa/capturas.mjs");
  lines.push("node tools/qa/run-qa.mjs");
  lines.push("```");
  lines.push("");
  lines.push("## Evidencias");
  lines.push("");
  lines.push("- `tools/qa/salida/contraste.json` y `contraste.md`: ratios por token y tema.");
  lines.push("- `tools/qa/salida/peso.json` y `peso.md`: carga inicial antes/después y derivados bajo demanda.");
  lines.push("- `tools/qa/salida/peso-apps.json` y `peso-apps.md`: Dashboard/Flashcards/HUB antes/después, core y primera área (Fase 4).");
  lines.push("- `tools/qa/salida/axe.json` y `axe.md`: matriz axe por ruta, estado, tema y viewport.");
  lines.push("- `tools/qa/salida/capturas.json` y `capturas.md`: capturas y métricas.");
  lines.push("- `tools/qa/salida/capturas/*.png`: imágenes de los seis viewports en ambos temas.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("© 2026 ZARCONT — Evidencia interna de QA.");
  lines.push("");
  return lines.join("\n");
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((err) => {
    console.error("ERROR en run-qa.mjs:", err && err.stack ? err.stack : err);
    process.exit(1);
  });
