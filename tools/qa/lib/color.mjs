/* © 2026 ZARCONT — Motor de color y contraste WCAG 2.x (Agente 6).
 *
 * Sin dependencias. Se usa desde tools/qa/contraste.mjs y desde los runners
 * de axe/capturas para informar de los ratios efectivos.
 *
 * Fórmulas (WCAG 2.2, §relative luminance y §contrast ratio):
 *   1. Canal sRGB normalizado: c = canal / 255
 *   2. Linealización:          c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4
 *   3. Luminancia relativa:    L = 0.2126·R + 0.7152·G + 0.0722·B
 *   4. Ratio de contraste:     (L_claro + 0.05) / (L_oscuro + 0.05)
 *   5. Composición alfa (source-over): resultado = α·frente + (1 − α)·fondo
 *
 * El fondo "efectivo" de un token translúcido se calcula componiendo el token
 * sobre la superficie real donde se pinta (--surface, --surface-2, --bg…).
 */

/** @typedef {{ r: number, g: number, b: number, a: number }} RGBA */

/** Convierte un color CSS literal (hex o rgb/rgba) a RGBA 0-255 / 0-1. */
export function parseColor(input) {
  if (input == null) return null;
  const raw = String(input).trim().toLowerCase();
  if (!raw) return null;
  if (raw === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  let m = /^#([0-9a-f]{3,8})$/i.exec(raw);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length !== 6 && hex.length !== 8) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  m = /^rgba?\(([^)]+)\)$/i.exec(raw);
  if (m) {
    const parts = m[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (value) => {
      const v = String(value).trim();
      if (v.endsWith("%")) return (parseFloat(v) / 100) * 255;
      return parseFloat(v);
    };
    const alpha = parts[3] == null ? 1 : (String(parts[3]).trim().endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]));
    const r = channel(parts[0]);
    const g = channel(parts[1]);
    const b = channel(parts[2]);
    if ([r, g, b, alpha].some((n) => !Number.isFinite(n))) return null;
    return { r, g, b, a: Math.max(0, Math.min(1, alpha)) };
  }

  return null;
}

/** Composición source-over de `fg` (puede tener alfa) sobre `bg` opaco o translúcido ya compuesto. */
export function over(fg, bg) {
  const a = fg.a == null ? 1 : fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** Luminancia relativa WCAG de un color (opaco). */
export function luminance(color) {
  const lin = (channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(color.r) + 0.7152 * lin(color.g) + 0.0722 * lin(color.b);
}

/** Ratio de contraste entre dos colores opacos. */
export function contrast(colorA, colorB) {
  const la = luminance(colorA);
  const lb = luminance(colorB);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export function toHex(color) {
  const c = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${c(color.r)}${c(color.g)}${c(color.b)}`.toUpperCase();
}

export function toRgbaText(color) {
  const a = color.a == null ? 1 : Math.round(color.a * 1000) / 1000;
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${a})`;
}

export function fmtRatio(value) {
  return `${value.toFixed(2)}:1`;
}

/** Redondeo estable para comparar contra el umbral sin falsos negativos por IEEE-754. */
export function meets(ratio, min) {
  return Number(ratio.toFixed(4)) >= min;
}
