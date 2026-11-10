/* © 2026 ZARCONT — Pruebas H4: temario dividido y cargador por área.
   Comando: node --test study-dashboard/tests/data */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../../..");
const DATA = path.join(ROOT, "study-data");
const TEMARIO = path.join(DATA, "temario.js");
const TAXONOMY = path.join(ROOT, "study-shared", "taxonomy.js");
const BUILD = path.join(ROOT, "tools", "build-content-split.js");
const CORE = path.join(DATA, "temario-core.js");
const META = path.join(DATA, "content-split.json");
const LOADER = path.join(DATA, "content-loader.js");
const SECTIONS = path.join(DATA, "sections");
const OFFICIAL_AREAS = [
  "area-psi-salud-publica",
  "area-psi-cuidado-integral",
  "area-psi-etica",
  "area-psi-investigacion",
  "area-psi-gestion"
];

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}
function sameJson(actual, expected, message) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
}
function stripSections(sheet) {
  const clean = {};
  Object.keys(sheet).forEach((key) => {
    if (key !== "sections") clean[key] = sheet[key];
  });
  return clean;
}
function contentSnapshot() {
  const sandbox = { window: {}, console: { warn: function () {}, log: function () {}, error: function () {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(TEMARIO, "utf8"), sandbox, { filename: "temario.js" });
  const canonical = JSON.parse(JSON.stringify(sandbox.window.STUDY_CONTENT));
  vm.runInContext(fs.readFileSync(TAXONOMY, "utf8"), sandbox, { filename: "taxonomy.js" });
  return { canonical: canonical, applied: sandbox.window.STUDY_CONTENT };
}
function loadCore() {
  const sandbox = { window: {}, console: { warn: function () {}, log: function () {}, error: function () {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(CORE, "utf8"), sandbox, { filename: "temario-core.js" });
  return { sandbox: sandbox, core: sandbox.window.STUDY_CONTENT };
}
function loadChunks() {
  const sandbox = { window: {}, console: { warn: function () {}, log: function () {}, error: function () {} } };
  vm.createContext(sandbox);
  OFFICIAL_AREAS.forEach((area) => {
    const file = path.join(SECTIONS, area + ".js");
    vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: area + ".js" });
  });
  return sandbox.window.STUDY_SECTIONS;
}
function outputFiles() {
  return [CORE, META].concat(OFFICIAL_AREAS.map((area) => path.join(SECTIONS, area + ".js")));
}
function hashes() {
  const out = {};
  outputFiles().forEach((file) => {
    out[path.relative(ROOT, file).replace(/\\/g, "/")] = sha256(fs.readFileSync(file));
  });
  return out;
}
function runBuild() {
  return execFileSync(process.execPath, [BUILD], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function loaderSandbox(options) {
  const opts = options || {};
  const scripts = [];
  const head = {
    appendChild(node) {
      node.parentNode = head;
      scripts.push(node);
    },
    removeChild(node) {
      node.parentNode = null;
      const index = scripts.indexOf(node);
      if (index >= 0) scripts.splice(index, 1);
    }
  };
  const documentObj = {
    currentScript: opts.currentScript === false ? null : {
      src: "http://127.0.0.1:8790/study-data/content-loader.js"
    },
    head: head,
    documentElement: head,
    createElement(tag) {
      if (tag !== "script") return {};
      return {
        tagName: "SCRIPT",
        src: "",
        async: false,
        onload: null,
        onerror: null,
        parentNode: null
      };
    }
  };
  const windowObj = {
    location: { href: "http://127.0.0.1:8790/study-dashboard/index.html" },
    console: { warn: function () {}, log: function () {}, error: function () {} },
    addEventListener: function () {}
  };
  const sandbox = {
    window: windowObj,
    document: documentObj,
    console: windowObj.console,
    URL: URL,
    encodeURIComponent: encodeURIComponent,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(CORE, "utf8"), sandbox, { filename: "temario-core.js" });
  vm.runInContext(fs.readFileSync(TAXONOMY, "utf8"), sandbox, { filename: "taxonomy.js" });
  vm.runInContext(fs.readFileSync(LOADER, "utf8"), sandbox, { filename: "content-loader.js" });
  return {
    sandbox: sandbox,
    window: windowObj,
    document: documentObj,
    scripts: scripts,
    content: sandbox.window.StudyContent
  };
}
function executeChunk(ctx, area) {
  const file = path.join(SECTIONS, area + ".js");
  vm.runInContext(fs.readFileSync(file, "utf8"), ctx.sandbox, { filename: area + ".js" });
}
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

test("H4 · generador determinista y temario canónico intacto", async () => {
  const sourceHash = sha256(fs.readFileSync(TEMARIO));
  runBuild();
  const first = hashes();
  runBuild();
  const second = hashes();
  assert.deepEqual(second, first, "dos ejecuciones deben producir los mismos bytes");
  assert.equal(sha256(fs.readFileSync(TEMARIO)), sourceHash, "el temario canónico no se modifica");
  assert.ok(fs.statSync(CORE).size > 0);
  assert.ok(fs.statSync(META).size > 0);
  OFFICIAL_AREAS.forEach((area) => {
    assert.ok(fs.statSync(path.join(SECTIONS, area + ".js")).size > 0);
  });
});

test("H4 · core: metadatos, cards completos y sheets sin sections", async () => {
  const snapshot = contentSnapshot();
  const loaded = loadCore();
  const core = loaded.core;

  assert.deepEqual(Object.keys(core).sort(), ["areas", "cards", "meta", "sheets", "sources", "topics", "version"].sort());
  assert.equal(core.sheets.length, 210);
  assert.equal(core.cards.length, 630);
  assert.equal(core.sources.length, 48);
  assert.equal(core.topics.length, 86);
  assert.equal(core.areas.length, 23);

  const canonicalById = {};
  snapshot.canonical.sheets.forEach((sheet) => { canonicalById[sheet.id] = sheet; });
  core.sheets.forEach((sheet) => {
    assert.equal(Object.prototype.hasOwnProperty.call(sheet, "sections"), false, "sin sections: " + sheet.id);
    sameJson(JSON.parse(JSON.stringify(sheet)), stripSections(canonicalById[sheet.id]), "metadatos " + sheet.id);
  });
  sameJson(JSON.parse(JSON.stringify(core.cards)), snapshot.canonical.cards, "cards completos");
  sameJson(JSON.parse(JSON.stringify(core.sources)), snapshot.canonical.sources, "sources");
  sameJson(JSON.parse(JSON.stringify(core.topics)), snapshot.canonical.topics, "topics");
  sameJson(JSON.parse(JSON.stringify(core.areas)), snapshot.canonical.areas, "areas");

  vm.runInContext(fs.readFileSync(TAXONOMY, "utf8"), loaded.sandbox, { filename: "taxonomy.js" });
  const applied = loaded.sandbox.window.STUDY_CONTENT;
  assert.equal(applied.primaryAreas.length, 5);
  applied.sheets.forEach((sheet) => {
    assert.ok(OFFICIAL_AREAS.indexOf(sheet.primaryAreaId) >= 0, "área primaria " + sheet.id);
  });
});

test("H4 · cinco chunks cubren 210 fichas y 1392 secciones sin duplicados", async () => {
  const snapshot = contentSnapshot();
  const chunks = loadChunks();
  assert.deepEqual(Object.keys(chunks).sort(), OFFICIAL_AREAS.slice().sort());

  const canonicalById = {};
  snapshot.canonical.sheets.forEach((sheet) => { canonicalById[sheet.id] = sheet; });
  const appliedById = {};
  snapshot.applied.sheets.forEach((sheet) => { appliedById[sheet.id] = sheet; });

  const seen = {};
  let sheetCount = 0;
  let sectionCount = 0;
  OFFICIAL_AREAS.forEach((area) => {
    const expectedIds = snapshot.applied.sheets
      .filter((sheet) => sheet.primaryAreaId === area)
      .map((sheet) => sheet.id)
      .sort();
    assert.deepEqual(plain(Object.keys(chunks[area]).sort()), plain(expectedIds), "fichas de " + area);
    expectedIds.forEach((sheetId) => {
      assert.equal(seen[sheetId], undefined, "sin duplicados: " + sheetId);
      seen[sheetId] = area;
      sheetCount += 1;
      sameJson(
        JSON.parse(JSON.stringify(chunks[area][sheetId])),
        canonicalById[sheetId].sections,
        "secciones de " + sheetId
      );
      sectionCount += canonicalById[sheetId].sections.length;
    });
  });
  assert.equal(sheetCount, 210);
  assert.equal(sectionCount, 1392);
  assert.equal(Object.keys(seen).length, 210);
  snapshot.canonical.sheets.forEach((sheet) => {
    assert.equal(seen[sheet.id] !== undefined, true, "ficha en un chunk: " + sheet.id);
    assert.equal(appliedById[sheet.id].primaryAreaId, seen[sheet.id]);
  });
});

test("H4 · content-split.json: conteos, bytes, hashes y cobertura", async () => {
  const meta = JSON.parse(fs.readFileSync(META, "utf8"));
  assert.equal(meta.format, "serums-content-split");
  assert.equal(meta.version, 1);
  assert.equal(meta.contentVersion, "2.5.0");
  assert.equal(meta.coverage.primaryAreas, 5);
  assert.equal(meta.coverage.sheets, 210);
  assert.equal(meta.coverage.sheetsInChunks, 210);
  assert.equal(meta.coverage.sections, 1392);
  assert.equal(meta.coverage.sectionsInChunks, 1392);
  assert.equal(meta.coverage.cards, 630);
  assert.equal(meta.coverage.sources, 48);
  assert.equal(meta.coverage.missingSheets, 0);
  assert.equal(meta.coverage.duplicateSheets, 0);
  assert.equal(meta.coverage.missingSections, 0);
  assert.equal(meta.coverage.extraSections, 0);
  assert.equal(meta.coverage.allSheetsHaveSections, true);

  const coreBytes = fs.statSync(CORE).size;
  assert.equal(meta.core.bytes, coreBytes);
  assert.equal(meta.core.sha256, sha256(fs.readFileSync(CORE)));
  let sectionsBytes = 0;
  meta.areas.forEach((area) => {
    const file = path.join(DATA, area.file);
    const bytes = fs.statSync(file).size;
    sectionsBytes += bytes;
    assert.equal(area.bytes, bytes, "bytes " + area.id);
    assert.equal(area.sha256, sha256(fs.readFileSync(file)), "hash " + area.id);
    assert.ok(area.sheets > 0);
    assert.ok(area.sections > 0);
  });
  assert.equal(meta.totals.coreBytes, coreBytes);
  assert.equal(meta.totals.sectionsBytes, sectionsBytes);
  assert.equal(meta.totals.contentBytes, coreBytes + sectionsBytes);
  assert.equal(meta.source.sha256, sha256(fs.readFileSync(TEMARIO)), "huella del canónico");
});

test("H4 · loader: no pide al cargar, cachea por área y resuelve needs", async () => {
  const ctx = loaderSandbox();
  const StudyContent = ctx.content;
  assert.ok(StudyContent);
  assert.equal(ctx.scripts.length, 0, "sin requests al cargar");
  assert.deepEqual(plain(StudyContent.state().loadedAreas), []);
  assert.equal(StudyContent.needs("sheet-aps-01"), true);
  assert.equal(ctx.scripts.length, 0, "needs no hace requests");
  assert.equal(StudyContent.needs("sheet-psi-et-1-1"), true);

  const promise = StudyContent.ensureSheet("sheet-aps-01");
  assert.equal(ctx.scripts.length, 1);
  assert.equal(
    ctx.scripts[0].src,
    "http://127.0.0.1:8790/study-data/sections/area-psi-cuidado-integral.js?v=2.5.0"
  );
  executeChunk(ctx, "area-psi-cuidado-integral");
  ctx.scripts[0].onload();
  const sheet = await promise;
  assert.equal(sheet.id, "sheet-aps-01");
  assert.ok(Array.isArray(sheet.sections) && sheet.sections.length > 0);
  assert.equal(StudyContent.needs(sheet), false);
  assert.deepEqual(plain(StudyContent.state().loadedAreas), ["area-psi-cuidado-integral"]);

  const second = StudyContent.ensureSheet("sheet-aps-02");
  assert.equal(ctx.scripts.length, 1, "no repite request del área");
  const secondSheet = await second;
  assert.ok(secondSheet.sections.length > 0);

  const direct = await StudyContent.loadArea("area-psi-cuidado-integral");
  assert.ok(direct["sheet-aps-01"]);
  assert.equal(ctx.scripts.length, 1, "loadArea cacheado");
  assert.equal(StudyContent.loaded("area-psi-cuidado-integral"), true);
  await assert.rejects(StudyContent.ensureSheet("sheet-no-existe"), /Ficha no encontrada/);
  await assert.rejects(StudyContent.loadArea("area-inexistente"), /no existe/);
});

test("H4 · loader: error de chunk, estado de error y reintento recuperable", async () => {
  const ctx = loaderSandbox();
  const StudyContent = ctx.content;
  const failed = StudyContent.ensureSheet("sheet-psi-et-1-1");
  assert.equal(ctx.scripts.length, 1);
  ctx.scripts[0].onerror();
  await assert.rejects(failed, /No se pudo cargar/);
  assert.deepEqual(plain(StudyContent.state().errorAreas), ["area-psi-etica"]);
  assert.ok(StudyContent.error("area-psi-etica"));
  assert.equal(StudyContent.needs("sheet-psi-et-1-1"), true);

  const retry = StudyContent.ensureSheet("sheet-psi-et-1-1");
  assert.equal(ctx.scripts.length, 1, "el script fallido se retira");
  assert.equal(ctx.scripts[0].src.indexOf("area-psi-etica.js?v=2.5.0") >= 0, true);
  executeChunk(ctx, "area-psi-etica");
  ctx.scripts[0].onload();
  const sheet = await retry;
  assert.ok(sheet.sections.length > 0);
  assert.deepEqual(plain(StudyContent.state().errorAreas), []);
});

test("H4 · loader: base de secciones cuando currentScript no existe", async () => {
  const ctx = loaderSandbox({ currentScript: false });
  assert.equal(
    ctx.content.base(),
    "http://127.0.0.1:8790/study-data/sections/"
  );
  const promise = ctx.content.ensureSheet("sheet-aps-01");
  assert.equal(ctx.scripts[0].src, "http://127.0.0.1:8790/study-data/sections/area-psi-cuidado-integral.js?v=2.5.0");
  executeChunk(ctx, "area-psi-cuidado-integral");
  ctx.scripts[0].onload();
  await promise;
});
