/* © 2026 ZARCONT — Pruebas del adaptador del índice derivado compacto.
 * Usa el search.json real y el temario real; no fixtures inventados.
 *
 * Uso, desde study-dashboard/:
 *   node --test tests/nav/adapt.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");

function loadRuntime() {
  const sandbox = { window: {}, console };
  sandbox.window.console = console;
  vm.createContext(sandbox);
  for (const file of [
    "study-data/temario.js",
    "study-shared/taxonomy.js",
    "study-dashboard/js/nav/core.js",
    "study-dashboard/js/nav/search.js"
  ]) {
    vm.runInContext(fs.readFileSync(path.join(REPO, file), "utf8"), sandbox, { filename: file });
  }
  return {
    content: sandbox.window.STUDY_CONTENT,
    taxonomy: sandbox.window.StudyTaxonomy,
    search: sandbox.window.StudyNav.search
  };
}

const runtime = loadRuntime();
const derived = JSON.parse(fs.readFileSync(path.join(REPO, "study-data", "derived", "search.json"), "utf8"));
const index = runtime.search.adaptDerivedIndex(derived, {
  content: runtime.content,
  taxonomy: runtime.taxonomy
});

test("el adaptador acepta entries[] {k,sid,s,p,t,f} reales", () => {
  assert.equal(index.compact, true);
  assert.equal(index.docs.length, 210);
  assert.equal(index.source, "derived");
  assert.equal(index.derivedVersion, derived.version);
});

test("mapea m/y/s/p/b/t/w/c a la ficha correcta", () => {
  const doc = index.docs.find((item) => item.id === "sheet-aps-01");
  assert.ok(doc);
  assert.equal(doc.title, "Una APS fuerte no es un consultorio de segunda");
  assert.equal(doc.sections, 3);
  assert.equal(doc.keyConcepts.length, 4);
  const kinds = doc.blocks.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] || 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(kinds, { body: 3, table: 4, bullet: 4, callout: 1 });
});

test("busca con y sin acentos y resalta el fragmento escapado", () => {
  const accented = runtime.search.searchIndex(index, "vacunación", { limit: 40 });
  const plain = runtime.search.searchIndex(index, "vacunacion", { limit: 40 });
  assert.equal(accented.total, plain.total);
  assert.ok(accented.total > 0);
  assert.match(accented.results[0].title, /Vacunación/i);
  const hit = accented.results.find((item) => item.id === "sheet-vacunas-01") || accented.results[0];
  assert.match(hit.titleHTML + hit.snippet, /<mark class="navx-mark">/);
  assert.doesNotMatch(hit.snippet, /<script/i);
});

test("prefiere f con acentos y cae a t cuando el término no está en f", () => {
  const accented = runtime.search.searchIndex(index, "atención primaria", { limit: 10 });
  const first = accented.results[0];
  assert.match(first.snippet, /atención/i);
  assert.match(first.snippet, /<mark class="navx-mark">atención<\/mark>/i);
  const late = runtime.search.searchIndex(index, "coordinación", { limit: 10 });
  assert.ok(late.results.length > 0);
  assert.ok(late.results.some((item) => /<mark class="navx-mark">/.test(item.snippet)));
});

test("filtra por área con los IDs primarios reales", () => {
  const area = runtime.taxonomy.primaryAreas()[0];
  const result = runtime.search.searchIndex(index, "salud", { areaId: area.id, limit: 20 });
  assert.ok(result.total > 0);
  assert.ok(result.results.every((item) => item.areaId === area.id));
});

test("omite sids desconocidos y rechaza versiones distintas", () => {
  const sample = {
    format: "serums-study-search",
    version: 1,
    contentVersion: runtime.content.version,
    entries: [
      { k: "m", sid: "sheet-aps-01", s: -1, p: -1, t: "una aps fuerte", f: "Una APS fuerte" },
      { k: "p", sid: "sheet-aps-01", s: 0, p: 0, t: "texto real", f: "Texto real" },
      { k: "m", sid: "ficha-inventada", s: -1, p: -1, t: "no existe", f: "No existe" }
    ]
  };
  const small = runtime.search.adaptDerivedIndex(sample, {
    content: runtime.content,
    taxonomy: runtime.taxonomy
  });
  assert.deepEqual(Array.from(small.docs, (item) => item.id), ["sheet-aps-01"]);

  const stale = { ...sample, contentVersion: "0.0.0" };
  assert.throws(
    () => runtime.search.adaptDerivedIndex(stale, { content: runtime.content, taxonomy: runtime.taxonomy }),
    /versión del contenido/
  );
});
