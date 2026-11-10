/* © 2026 ZARCONT — Lectura de tokens CSS de study-shared/base.css (Agente 6).
 *
 * El proyecto no usa build ni PostCSS: este lector es deliberadamente pequeño.
 * Extrae los bloques de nivel superior (`:root` y `html[data-theme="light"]`),
 * ignora bloques anidados dentro de `@media`/`@supports` (los refuerzos de
 * prefers-contrast) y resuelve el valor efectivo del tema claro como
 * `:root` + overrides de `html[data-theme="light"]`, igual que hace el navegador.
 */
import { readFile } from "node:fs/promises";

/** Devuelve [{ selector, body, index }] solo para reglas de nivel superior. */
export function extractTopLevelBlocks(cssText) {
  const text = String(cssText).replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  let depth = 0;
  let selector = "";
  let bodyStart = -1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) {
        bodyStart = i + 1;
      }
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0 && bodyStart >= 0) {
        blocks.push({ selector: selector.trim(), body: text.slice(bodyStart, i), index: bodyStart });
        selector = "";
        bodyStart = -1;
      }
      continue;
    }
    if (depth === 0) {
      if (ch === ";") {
        // Reglas sueltas (@import, @charset): no son bloques de declaraciones.
        selector = "";
        continue;
      }
      selector += ch;
    }
  }
  return blocks;
}

/** Convierte el cuerpo de un bloque en un mapa de custom properties literales. */
export function parseCustomProperties(body) {
  const out = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;{}]+);/gi;
  let m;
  while ((m = re.exec(body))) {
    out[`--${m[1]}`] = m[2].trim();
  }
  return out;
}

/**
 * Lee los tokens de base.css.
 * @returns {Promise<{ source: string, dark: Record<string,string>, light: Record<string,string>, lightOverrides: Record<string,string> }>}
 */
export async function readBaseTokens(file) {
  const cssText = await readFile(file, "utf8");
  const blocks = extractTopLevelBlocks(cssText);
  let dark = {};
  let lightOverrides = {};
  for (const block of blocks) {
    const selector = block.selector.replace(/\s+/g, " ").toLowerCase();
    if (selector === ":root") {
      dark = { ...dark, ...parseCustomProperties(block.body) };
    } else if (selector === 'html[data-theme="light"]' || selector === "html[data-theme=light]") {
      lightOverrides = { ...lightOverrides, ...parseCustomProperties(block.body) };
    }
  }
  const light = { ...dark, ...lightOverrides };
  return { source: file, cssText, dark, light, lightOverrides };
}
