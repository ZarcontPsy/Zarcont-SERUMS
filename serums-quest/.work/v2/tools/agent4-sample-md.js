/* Agent 4 - imprime la muestra verificada como tabla Markdown.
   Lee el informe que genera agent4-verify.js. */
"use strict";
const r = require("./agent4-verify-report.js");

function esc(s) {
  return String(s).replace(/\|/g, "/").replace(/\n/g, " ");
}
function cut(s, n) {
  const t = esc(s);
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

const lines = [];
lines.push("| # | id | fuente | clave | comprobación | OK |");
lines.push("|---|---|---|---|---|---|");
r.sample.forEach((s, i) => {
  lines.push("| " + (i + 1) + " | `" + s.id + "` | " + esc(s.fuente) + " | " + cut(s.clave, 110) + " | " + cut(s.comprobacion, 110) + " | " + (s.ok ? "OK" : "FALLA") + " |");
});
console.log(lines.join("\n"));
