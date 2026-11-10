/* © 2026 ZARCONT — Verificación reproducible de contraste de los tokens de diseño.
 *
 * Uso:
 *   node tools/qa/contraste.mjs
 *   node tools/qa/contraste.mjs --quiet
 *
 * Qué hace
 *   - Lee los tokens de `study-shared/base.css` (`:root` y
 *     `html[data-theme="light"]`), sin navegador y sin dependencias.
 *   - Compone los fondos translúcidos reales (p. ej. `--green-soft` sobre
 *     `--surface-2`) antes de medir.
 *   - Calcula ratios WCAG 2.2 y escribe:
 *       tools/qa/salida/contraste.json
 *       tools/qa/salida/contraste.md
 *   - Sale con código 1 si alguna comprobación requerida falla.
 *
 * Fórmulas: ver tools/qa/lib/color.mjs (documentadas también en el .md).
 */
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { readBaseTokens } from "./lib/css-tokens.mjs";
import { contrast, meets, over, parseColor, toHex, fmtRatio } from "./lib/color.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..");
const BASE_CSS = path.join(ROOT, "study-shared", "base.css");
const OUT_DIR = path.join(HERE, "salida");

const THEMES = [
  { id: "dark", label: "Tema oscuro", selector: ":root" },
  { id: "light", label: "Tema claro", selector: 'html[data-theme="light"]' },
];

/* ------------------------------------------------------------------------- */
/* Especificación de fondos: token opaco o token translúcido sobre una base.  */
/* ------------------------------------------------------------------------- */

const solid = (token) => ({ kind: "solid", token });
const soft = (token, base) => ({ kind: "soft", token, base });

function resolveBackground(spec, tokens, stack = []) {
  const guard = new Set(stack);
  if (spec.kind === "solid") {
    const color = tokenColor(tokens, spec.token);
    // El fondo raíz de la app es --bg; un token translúcido se compone sobre él.
    const page = parseColor(tokens["--bg"]);
    return color.a < 1 ? over(color, page) : color;
  }
  if (spec.kind === "soft") {
    if (guard.has(spec.token)) throw new Error(`Ciclo de tokens en ${spec.token}`);
    const color = tokenColor(tokens, spec.token);
    return over(color, resolveBackground(spec.base, tokens, [...stack, spec.token]));
  }
  throw new Error(`Fondo no soportado: ${JSON.stringify(spec)}`);
}

function tokenColor(tokens, token) {
  const raw = tokens[token];
  if (raw == null) throw new Error(`Falta el token ${token} en base.css`);
  const color = parseColor(raw);
  if (!color) throw new Error(`El token ${token} no es un color literal: ${raw}`);
  return color;
}

function describeBackground(spec) {
  if (spec.kind === "solid") return spec.token;
  return `${spec.token} sobre ${describeBackground(spec.base)}`;
}

/* ------------------------------------------------------------------------- */
/* Matriz de comprobaciones contra contextos reales de la interfaz.           */
/* ------------------------------------------------------------------------- */

const MARKS = [
  { id: "important", label: "Importante" },
  { id: "understand", label: "Entender" },
  { id: "review", label: "Repasar" },
  { id: "doubt", label: "Duda" },
];

function buildChecks() {
  /** @type {Array<any>} */
  const checks = [];
  const add = (id, label, category, min, required, fg, bg) => {
    checks.push({ id, label, category, min, required, fg, bg });
  };

  // --- Texto base y superficies ---
  add("texto-principal-fondo", "Texto principal sobre el fondo", "texto", 4.5, true, "--text", solid("--bg"));
  add("texto-principal-superficie", "Texto principal sobre superficie", "texto", 4.5, true, "--text", solid("--surface"));
  add("texto-suave-superficie", "Texto suave sobre superficie", "texto", 4.5, true, "--text-soft", solid("--surface"));
  add("texto-suave-fondo", "Texto suave sobre el fondo", "texto", 4.5, true, "--text-soft", solid("--bg"));
  add("atenuado-superficie", "Texto atenuado sobre superficie", "texto", 4.5, true, "--muted", solid("--surface"));
  add("atenuado-superficie2", "Texto atenuado sobre superficie 2", "texto", 4.5, true, "--muted", solid("--surface-2"));
  add("atenuado-fondo", "Texto atenuado sobre el fondo", "texto", 4.5, true, "--muted", solid("--bg"));

  // --- Acento (botones, badges, números decorativos del lector) ---
  add("acento-sobre-suave", "Acento sobre accent-soft (badge «Ampliación», chips)", "texto", 4.5, true, "--accent", soft("--accent-soft", solid("--surface")));
  add("acento-sobre-fondo-suave", "Acento sobre bg-soft (números de concepto del lector)", "texto", 4.5, true, "--accent", solid("--bg-soft"));
  add("acento-ink-boton", "Texto del botón principal sobre el acento", "texto", 4.5, true, "--accent-ink", solid("--accent"));
  add("acento-icono-superficie", "Acento en iconos sobre superficie", "icono", 3, true, "--accent", solid("--surface"));
  add("acento-icono-fondo", "Acento en iconos sobre el fondo", "icono", 3, true, "--accent", solid("--bg"));
  add("alerta-texto", "Texto de alerta sobre su fondo", "texto", 4.5, true, "--text-soft", soft("--accent-soft", solid("--surface-2")));

  // --- Semánticos verde / peligro ---
  add("verde-chip", "Verde del chip «Completada» sobre green-soft", "texto", 4.5, true, "--green", soft("--green-soft", solid("--surface-2")));
  add("verde-icono-superficie", "Verde en iconos sobre superficie", "icono", 3, true, "--green", solid("--surface"));
  add("verde-icono-fondo", "Verde en iconos sobre el fondo", "icono", 3, true, "--green", solid("--bg"));
  add("verde-check-ink", "Icono de check sobre el verde de completada", "icono", 4.5, true, "--accent-ink", solid("--green"));
  add("peligro-alerta", "Peligro sobre danger-soft (aviso del lector)", "texto", 4.5, true, "--danger", soft("--danger-soft", solid("--surface-2")));
  add("peligro-superficie", "Peligro sobre superficie (botón/etiqueta)", "texto", 4.5, true, "--danger", solid("--surface"));
  add("peligro-superficie-fondo", "Peligro sobre el fondo", "texto", 4.5, true, "--danger", solid("--bg"));
  add("peligro-icono", "Icono de aviso sobre el fondo", "icono", 3, true, "--danger", soft("--danger-soft", solid("--surface")));

  // --- Subrayados: color de marca, texto y línea ---
  for (const mark of MARKS) {
    const base = `--mark-${mark.id}`;
    add(`marca-${mark.id}-ink-superficie`, `${mark.label}: texto sobre su fondo (superficie)`, "texto", 4.5, true, `${base}-ink`, soft(`${base}-bg`, solid("--surface")));
    add(`marca-${mark.id}-ink-fondo`, `${mark.label}: texto sobre su fondo (fondo de página)`, "texto", 4.5, true, `${base}-ink`, soft(`${base}-bg`, solid("--bg")));
    add(`marca-${mark.id}-icono-superficie`, `${mark.label}: color de marca sobre superficie`, "icono", 3, true, base, solid("--surface"));
    add(`marca-${mark.id}-icono-fondo`, `${mark.label}: color de marca sobre el fondo`, "icono", 3, true, base, solid("--bg"));
    add(`marca-${mark.id}-linea-superficie`, `${mark.label}: línea sobre superficie`, "grafico", 3, true, `${base}-line`, solid("--surface"));
    add(`marca-${mark.id}-linea-fondo`, `${mark.label}: línea sobre el fondo`, "grafico", 3, true, `${base}-line`, solid("--bg"));
  }

  // --- Informativos: bordes decorativos y combinaciones secundarias ---
  add("acento-linea-superficie", "Borde de acento sobre superficie (decorativo)", "adorno", 3, false, "--accent-line", solid("--surface"));
  add("verde-linea-superficie", "Borde verde sobre superficie (decorativo)", "adorno", 3, false, "--green-line", solid("--surface"));
  add("peligro-linea-superficie", "Borde de peligro sobre superficie (decorativo)", "adorno", 3, false, "--danger-line", solid("--surface"));
  add("atenuado-superficie3", "Texto atenuado sobre superficie 3", "adorno", 4.5, false, "--muted", solid("--surface-3"));
  add("texto-suave-superficie2", "Texto suave sobre superficie 2", "adorno", 4.5, false, "--text-soft", solid("--surface-2"));

  return checks;
}

/* ------------------------------------------------------------------------- */
/* Ejecución                                                                  */
/* ------------------------------------------------------------------------- */

function round(value) {
  return Math.round(value * 100) / 100;
}

export async function runContrast({ quiet = false } = {}) {
  const { dark, light, source } = await readBaseTokens(BASE_CSS);
  const themeTokens = { dark, light };
  const checks = buildChecks();
  const results = [];

  for (const theme of THEMES) {
    const tokens = themeTokens[theme.id];
    for (const check of checks) {
      let row;
      try {
        const fgColor = tokenColor(tokens, check.fg);
        const bg = resolveBackground(check.bg, tokens);
        const fgEffective = fgColor.a < 1 ? over(fgColor, bg) : fgColor;
        const ratio = contrast(fgEffective, bg);
        row = {
          id: check.id,
          theme: theme.id,
          themeLabel: theme.label,
          label: check.label,
          category: check.category,
          min: check.min,
          required: check.required,
          ratio: round(ratio),
          pass: meets(ratio, check.min),
          fg: check.fg,
          fgValue: tokens[check.fg],
          fgEffective: toHex(fgEffective),
          bg: describeBackground(check.bg),
          bgValue: check.bg.kind === "solid" ? tokens[check.bg.token] : tokens[check.bg.token],
          bgEffective: toHex(bg),
        };
      } catch (err) {
        row = {
          id: check.id,
          theme: theme.id,
          themeLabel: theme.label,
          label: check.label,
          category: check.category,
          min: check.min,
          required: check.required,
          ratio: null,
          pass: false,
          error: err.message,
          fg: check.fg,
          bg: describeBackground(check.bg),
        };
      }
      results.push(row);
    }
  }

  const requiredFailed = results.filter((r) => r.required && !r.pass);
  const advisoryFailed = results.filter((r) => !r.required && !r.pass);
  const byTheme = {
    dark: results.filter((r) => r.theme === "dark"),
    light: results.filter((r) => r.theme === "light"),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, source).replace(/\\/g, "/"),
    generator: "tools/qa/contraste.mjs",
    standards: {
      textMin: 4.5,
      largeTextMin: 3,
      graphicsMin: 3,
      formula: "ratio = (L_luminoso + 0.05) / (L_oscuro + 0.05); L = 0.2126R + 0.7152G + 0.0722B (sRGB lineal)",
      compositing: "resultado = alpha·frente + (1 − alpha)·fondo, aplicado de la capa translúcida a la base",
    },
    tokens: {
      dark: pickTokens(dark),
      light: pickTokens(light),
    },
    summary: {
      total: results.length,
      pass: results.filter((r) => r.pass).length,
      fail: results.filter((r) => !r.pass).length,
      requiredFailed: requiredFailed.length,
      advisoryFailed: advisoryFailed.length,
      ok: requiredFailed.length === 0,
    },
    failures: requiredFailed,
    advisories: advisoryFailed,
    checks: results,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const jsonFile = path.join(OUT_DIR, "contraste.json");
  const mdFile = path.join(OUT_DIR, "contraste.md");
  await writeFile(jsonFile, JSON.stringify(payload, null, 2));
  await writeFile(mdFile, renderMarkdown(payload, byTheme));

  if (!quiet) {
    printSummary(payload);
  }
  return { ok: payload.summary.ok, payload, jsonFile, mdFile };
}

function pickTokens(tokens) {
  const keys = [
    "--bg", "--bg-soft", "--surface", "--surface-2", "--surface-3",
    "--text", "--text-soft", "--muted", "--accent", "--accent-ink",
    "--green", "--green-soft", "--danger", "--danger-soft",
    "--target-min", "--z-appbar", "--z-sheet", "--z-popover", "--z-modal", "--z-toast",
  ];
  for (const mark of ["important", "understand", "review", "doubt"]) {
    for (const suffix of ["", "-bg", "-line", "-ink"]) keys.push(`--mark-${mark}${suffix}`);
  }
  const out = {};
  for (const key of keys) out[key] = tokens[key] ?? null;
  return out;
}

function statusOf(row) {
  if (row.pass) return "PASA";
  return row.required ? "**FALLA**" : "aviso";
}

function renderMarkdown(payload, byTheme) {
  const lines = [];
  lines.push("# Informe de contraste — tokens de Study (Fase 0)");
  lines.push("");
  lines.push(`Generado por \`tools/qa/contraste.mjs\` el ${payload.generatedAt}.`);
  lines.push("");
  lines.push("## Cómo se mide");
  lines.push("");
  lines.push("1. Cada token se lee de `study-shared/base.css` como color literal (hex o `rgba`). No se aceptan `var()` ni `color-mix()` en los tokens medidos.");
  lines.push("2. Un fondo translúcido (`--*-soft`, `--*-bg`, `--*-line`) se compone sobre la superficie real en la que se pinta: `resultado = alpha·frente + (1 − alpha)·fondo`. Así, `--green-soft` sobre `--surface-2` produce un color opaco medido, no el token aislado.");
  lines.push("3. Luminancia relativa WCAG 2.2: cada canal sRGB se normaliza (`c/255`), se linealiza con `c <= 0.03928 ? c/12.92 : ((c + 0.055)/1.055)^2.4` y se combina como `L = 0.2126·R + 0.7152·G + 0.0722·B`.");
  lines.push("4. Ratio: `(L_claro + 0.05) / (L_oscuro + 0.05)`.");
  lines.push("5. Umbrales: **4,5:1** para texto, **3:1** para iconos, puntos y líneas con significado. Los bordes decorativos se miden como aviso y no bloquean.");
  lines.push("");
  lines.push("El tema claro se evalúa como `:root` + overrides de `html[data-theme=\"light\"]`, igual que el navegador; los refuerzos de `prefers-contrast: more` solo suben valores y no se usan en la medición base.");
  lines.push("");
  lines.push(`## Resumen`);
  lines.push("");
  lines.push(`- Comprobaciones: **${payload.summary.total}**`);
  lines.push(`- Requeridas que fallan: **${payload.summary.requiredFailed}**`);
  lines.push(`- Avisos (no bloquean): **${payload.summary.advisoryFailed}**`);
  lines.push(`- Resultado: **${payload.summary.ok ? "OK" : "FALLO"}**`);
  lines.push("");
  for (const theme of THEMES) {
    const rows = byTheme[theme.id];
    lines.push(`### ${theme.label}`);
    lines.push("");
    lines.push("| Comprobación | Categoría | Fondo efectivo | Frente efectivo | Ratio | Mínimo | Estado |");
    lines.push("|---|---|---|---|---:|---:|---|");
    for (const row of rows) {
      lines.push(
        `| ${row.label} | ${row.category} | \`${row.bg}\`${row.bgEffective ? ` = ${row.bgEffective}` : ""} | ${row.fgEffective ?? "—"} | ${row.ratio == null ? "—" : fmtRatio(row.ratio)} | ${row.min}:1 | ${statusOf(row)} |`,
      );
    }
    lines.push("");
  }
  lines.push("## Tokens medidos");
  lines.push("");
  lines.push("| Token | Oscuro | Claro |");
  lines.push("|---|---|---|");
  for (const key of Object.keys(payload.tokens.dark)) {
    lines.push(`| \`${key}\` | \`${payload.tokens.dark[key] ?? "—"}\` | \`${payload.tokens.light[key] ?? "—"}\` |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("© 2026 ZARCONT — Evidencia interna de QA.");
  lines.push("");
  return lines.join("\n");
}

function printSummary(payload) {
  console.log("Contraste de tokens — study-shared/base.css");
  console.log(`  fuente: ${payload.source}`);
  for (const row of payload.checks) {
    if (!row.pass) {
      const ratio = row.ratio == null ? "sin medir" : fmtRatio(row.ratio);
      const kind = row.required ? "FALLA" : "aviso";
      console.log(`  [${kind}] ${row.theme}/${row.id}: ${ratio} < ${row.min}:1 — ${row.label}`);
    }
  }
  console.log(
    `  ${payload.summary.total} comprobaciones · ${payload.summary.pass} pasan · ${payload.summary.requiredFailed} requeridas fallan · ${payload.summary.advisoryFailed} avisos`,
  );
  console.log(`  JSON: ${path.relative(ROOT, path.join(OUT_DIR, "contraste.json"))}`);
  console.log(`  Markdown: ${path.relative(ROOT, path.join(OUT_DIR, "contraste.md"))}`);
}

/* Solo se ejecuta como CLI, no al importarlo desde run-qa.mjs. */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const quiet = process.argv.includes("--quiet");
  runContrast({ quiet }).then(({ ok }) => {
    process.exit(ok ? 0 : 1);
  }).catch((err) => {
    console.error("ERROR en contraste.mjs:", err && err.stack ? err.stack : err);
    process.exit(1);
  });
}
