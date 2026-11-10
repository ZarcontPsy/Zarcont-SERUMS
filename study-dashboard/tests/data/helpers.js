/* © 2026 ZARCONT — Arnés mínimo para las pruebas del store v2.
   No usa dependencias: carga `study-shared/store.js` en un contexto `vm` con
   window/document/localStorage simulados y sin IndexedDB (modo localStorage).
   Fase 1 añade el temario real con su taxonomía, un bus `StudyApp` simulado y
   helpers para leer eventos DOM y aplicar la taxonomía dentro del sandbox. */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../../..");
const STORE_PATH = path.join(ROOT, "study-shared", "store.js");
const TAXONOMY_PATH = path.join(ROOT, "study-shared", "taxonomy.js");
const TEMARIO_PATH = path.join(ROOT, "study-data", "temario.js");
const FIXTURE_PATH = path.join(__dirname, "fixtures", "v1-state.json");
const STORE_CODE = fs.readFileSync(STORE_PATH, "utf8");
const TAXONOMY_CODE = fs.readFileSync(TAXONOMY_PATH, "utf8");
const V1_FIXTURE = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

const CONTENT = {
  version: "2.5.0",
  meta: { title: "Temario de prueba" },
  sources: [{ id: "src-aps", short: "APS", title: "Fuente APS", file: "../study-data/fuentes/aps.pdf" }],
  areas: [{ id: "area-aps", title: "Atención primaria" }],
  topics: [
    { id: "topic-aps-atributos", areaId: "area-aps", title: "Los cuatro atributos de la APS" }
  ],
  sheets: [
    {
      id: "sheet-aps-01", topicId: "topic-aps-atributos", areaId: "area-aps",
      title: "Una APS fuerte no es un consultorio de segunda", minutes: 6,
      summary: "La APS organiza el sistema.", keyConcepts: ["Puerta de entrada"],
      sections: [{ title: "De la enfermedad a la persona", depth: "core", body: ["Texto de prueba."] }]
    },
    {
      id: "sheet-aps-02", topicId: "topic-aps-atributos", areaId: "area-aps",
      title: "Accesibilidad y longitudinalidad: entrar y permanecer", minutes: 7,
      summary: "Entrar y permanecer.", keyConcepts: ["Accesibilidad"],
      sections: [{ title: "Atributos", depth: "core", body: ["Texto de prueba."] }]
    }
  ],
  cards: [
    { id: "card-aps-01-1", topicId: "topic-aps-atributos", sheetId: "sheet-aps-01", type: "concept", prompt: "P1", answer: "R1", tags: [] },
    { id: "card-aps-01-2", topicId: "topic-aps-atributos", sheetId: "sheet-aps-01", type: "concept", prompt: "P2", answer: "R2", tags: [] },
    { id: "card-aps-01-3", topicId: "topic-aps-atributos", sheetId: "sheet-aps-01", type: "concept", prompt: "P3", answer: "R3", tags: [] }
  ]
};

class TestCustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init && init.detail ? init.detail : {};
  }
}

function createStorage(seed) {
  const map = new Map();
  if (seed && typeof seed === "object") {
    Object.keys(seed).forEach((key) => map.set(key, String(seed[key])));
  }
  let failOn = null;
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) {
      if (failOn === key) {
        const err = new Error("QuotaExceededError (simulado)");
        err.name = "QuotaExceededError";
        throw err;
      }
      map.set(key, String(value));
    },
    removeItem(key) { map.delete(key); },
    clear() { map.clear(); },
    key(index) { return Array.from(map.keys())[index] || null; },
    get length() { return map.size; },
    _map: map,
    _failOn(key) { failOn = key; },
    _json(key) {
      const raw = map.get(key);
      return raw == null ? null : JSON.parse(raw);
    }
  };
}

function createStore(options) {
  const opts = options || {};
  const storage = opts.storage || createStorage(opts.seed);
  const content = opts.content || CONTENT;
  const events = [];
  const listeners = {};
  const windowObj = {
    STUDY_CONTENT: content,
    location: { href: "http://127.0.0.1:8790/study-dashboard/index.html" },
    addEventListener(type, fn) {
      (listeners[type] || (listeners[type] = [])).push(fn);
    },
    removeEventListener(type, fn) {
      listeners[type] = (listeners[type] || []).filter((x) => x !== fn);
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    }
  };
  windowObj.window = windowObj;
  const documentObj = {
    hidden: false,
    addEventListener() {},
    removeEventListener() {}
  };
  const sandbox = {
    window: windowObj,
    document: documentObj,
    localStorage: storage,
    CustomEvent: TestCustomEvent,
    console: { warn() {}, log() {}, error() {} },
    setTimeout,
    clearTimeout,
    TextEncoder,
    URL,
    encodeURIComponent,
    decodeURIComponent,
    unescape,
    escape
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(STORE_CODE, sandbox, { filename: "store.js" });
  const store = sandbox.window.StudyStore;
  return {
    store,
    storage,
    content,
    events,
    sandbox,
    window: windowObj,
    init() { return store.init(); }
  };
}

function seedWithState(state) {
  return { "study-state-v1": JSON.stringify(state) };
}

/* Contenido real del temario, en un contexto `vm` aislado. Por defecto aplica
   la taxonomía de la app (fichas con primaryAreaId/categoryId), como en
   `index.html`; con `{taxonomy:false}` devuelve el temario tal cual. El
   resultado completo se cachea: son 2,5 MB y varias pruebas lo comparten. */
let realContentCache = null;
function loadRealContent(options) {
  const withTaxonomy = !options || options.taxonomy !== false;
  if (!withTaxonomy) return buildRealContent(false);
  if (!realContentCache) realContentCache = buildRealContent(true);
  return realContentCache;
}
function buildRealContent(withTaxonomy) {
  const sandbox = { window: {}, console: { warn() {}, log() {}, error() {} } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(TEMARIO_PATH, "utf8"), sandbox, { filename: "temario.js" });
  if (withTaxonomy) vm.runInContext(TAXONOMY_CODE, sandbox, { filename: "taxonomy.js" });
  return sandbox.window.STUDY_CONTENT;
}

/* Ejecuta taxonomy.js dentro del sandbox de un store ya creado. Sirve para
   comprobar que el índice de áreas se reconstruye si la taxonomía llega tarde. */
function applyTaxonomy(ctx) {
  vm.runInContext(TAXONOMY_CODE, ctx.sandbox, { filename: "taxonomy.js" });
  return ctx.window.STUDY_CONTENT;
}

/* Bus de la app simulado: el store emite por `StudyApp.events` cuando existe. */
function attachBus(ctx) {
  const bus = [];
  ctx.window.StudyApp = {
    events: {
      emit(name, detail) { bus.push({ name, detail: JSON.parse(JSON.stringify(detail || {})) }); }
    }
  };
  return bus;
}

/* Eventos DOM registrados por el `window.dispatchEvent` simulado. */
function domEvents(ctx, name) {
  return ctx.events
    .filter((event) => !name || event.type === name)
    .map((event) => ({ name: event.type, detail: JSON.parse(JSON.stringify(event.detail || {})) }));
}

function readKey(storage, key) {
  return storage._json(key);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  CONTENT,
  V1_FIXTURE,
  ROOT,
  STORE_PATH,
  TAXONOMY_PATH,
  TEMARIO_PATH,
  createStorage,
  createStore,
  seedWithState,
  readKey,
  loadRealContent,
  applyTaxonomy,
  attachBus,
  domEvents,
  sleep
};
