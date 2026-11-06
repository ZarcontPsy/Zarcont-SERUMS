/* SERUMS QUEST - persistencia local versionada
   Un único documento de estado, escritura con diario de recuperación y respaldo.
   No toca claves de Study, Examen Studio ni Plazas. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var P = window.QuestProgression;

  function collectionDefaults() {
    if (window.QuestCollection) return window.QuestCollection.defaultCollection();
    return {
      ownedCharacterIds: ["ilan"],
      ownedCosmeticIds: [],
      selectedCharacterId: "ilan",
      equipped: {},
      previousOutfits: {},
      unlockedBy: { ilan: { method: "starter", at: null, price: 0 } }
    };
  }

  function economyDefaults() {
    if (window.QuestCollection) return window.QuestCollection.defaultEconomy();
    return { transactions: [], lifetimeSpent: 0 };
  }

  function presentationDefaults() {
    if (window.QuestCollection) return window.QuestCollection.defaultPresentation();
    return {
      animationPreferences: { idle: true, reactions: true, celebrate: true },
      visualPreferences: { rarityFrames: true, particles: true },
      audioPreferences: { muted: false, sfxVolume: 0.55, musicVolume: 0.22, music: false }
    };
  }

  function defaultState(now) {
    var at = U.nowISO(now || new Date());
    var byArea = {};
    C.areas.forEach(function (id) {
      byArea[id] = { answered: 0, correct: 0, wrong: 0, reliableAnswered: 0, reliableCorrect: 0, reliableWrong: 0 };
    });
    var countersKey = U.dateKey(now || new Date());
    return {
      schemaVersion: C.schemaVersion,
      appVersion: C.version,
      revision: 0,
      createdAt: at,
      updatedAt: at,
      profile: {
        id: "local-" + U.hashString(at),
        name: "Serumista",
        createdAt: at
      },
      xp: 0,
      coins: 0,
      stage: 1,
      academic: {
        answered: 0,
        correct: 0,
        wrong: 0,
        totalTimeMs: 0,
        sessions: 0,
        byArea: byArea,
        recent: []
      },
      questions: {},
      errors: {},
      sessions: [],
      activeSession: null,
      missions: {},
      daily: {
        lastCompletedDate: null,
        lastDate: null,
        streak: 0,
        bestStreak: 0,
        totalCompleted: 0
      },
      rewards: {},
      achievements: {},
      modeStats: {
        survivalWins: 0,
        timedAce: 0,
        simulacros: 0
      },
      collection: collectionDefaults(),
      economy: economyDefaults(),
      presentation: presentationDefaults(),
      counters: {
        date: countersKey,
        coins: 0,
        xp: 0,
        sessions: 0
      },
      settings: {
        instantFeedback: true,
        timerVisible: true,
        theme: "dark",
        reducedMotion: false
      },
      events: [],
      meta: {
        migratedFrom: null,
        lastBackupAt: null
      }
    };
  }

  function number(value, fallback) {
    return Math.max(0, U.safeInt(value, fallback || 0));
  }

  function normalizeMap(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function sanitizeTree(value, depth) {
    if (depth > 14) return null;
    if (typeof value === "string") {
      return value.replace(/[<>]/g, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    }
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "boolean" || value === null) return value;
    if (Array.isArray(value)) return value.map(function (item) { return sanitizeTree(item, depth + 1); });
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (key) {
        out[key] = sanitizeTree(value[key], depth + 1);
      });
      return out;
    }
    return null;
  }

  function normalizeState(raw, now) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("El estado guardado no es un objeto válido.");
    }
    if (Number(raw.schemaVersion) > C.schemaVersion) {
      throw new Error("El progreso fue creado por una versión más reciente de SERUMS QUEST.");
    }
    var base = defaultState(now || new Date());
    var out = Object.assign({}, raw);
    Object.keys(base).forEach(function (key) {
      if (out[key] === undefined) out[key] = base[key];
    });
    out.schemaVersion = C.schemaVersion;
    out.appVersion = C.version;
    out.revision = number(raw.revision, 0);
    out.createdAt = raw.createdAt || base.createdAt;
    out.updatedAt = raw.updatedAt || base.updatedAt;
    out.profile = Object.assign({}, base.profile, raw.profile || {});
    out.profile.name = String(out.profile.name || "Serumista").slice(0, 40);
    out.xp = number(raw.xp, 0);
    out.coins = number(raw.coins, 0);
    out.stage = Math.max(1, Math.min(4, U.safeInt(raw.stage, 1)));
    out.academic = Object.assign({}, base.academic, raw.academic || {});
    out.academic.answered = number(out.academic.answered, 0);
    out.academic.correct = Math.min(out.academic.answered, number(out.academic.correct, 0));
    out.academic.wrong = number(out.academic.wrong, 0);
    out.academic.totalTimeMs = number(out.academic.totalTimeMs, 0);
    out.academic.sessions = number(out.academic.sessions, 0);
    out.academic.byArea = normalizeMap(out.academic.byArea);
    C.areas.forEach(function (id) {
      var a = out.academic.byArea[id] || {};
      out.academic.byArea[id] = {
        answered: number(a.answered, 0),
        correct: number(a.correct, 0),
        wrong: number(a.wrong, 0),
        reliableAnswered: number(a.reliableAnswered, 0),
        reliableCorrect: number(a.reliableCorrect, 0),
        reliableWrong: number(a.reliableWrong, 0)
      };
    });
    out.academic.recent = Array.isArray(out.academic.recent) ? out.academic.recent.slice(-60).filter(function (r) {
      return r && typeof r === "object";
    }) : [];
    out.questions = normalizeMap(out.questions);
    out.errors = normalizeMap(out.errors);
    out.sessions = Array.isArray(out.sessions) ? out.sessions.slice(0, 250) : [];
    out.activeSession = out.activeSession && typeof out.activeSession === "object" ? out.activeSession : null;
    out.missions = normalizeMap(out.missions);
    out.daily = Object.assign({}, base.daily, raw.daily || {});
    out.daily.streak = number(out.daily.streak, 0);
    out.daily.bestStreak = number(out.daily.bestStreak, 0);
    out.daily.totalCompleted = number(out.daily.totalCompleted, 0);
    out.rewards = normalizeMap(out.rewards);
    out.achievements = normalizeMap(out.achievements);
    out.modeStats = Object.assign({}, base.modeStats, raw.modeStats || {});
    out.modeStats.survivalWins = number(out.modeStats.survivalWins, 0);
    out.modeStats.timedAce = number(out.modeStats.timedAce, 0);
    out.modeStats.simulacros = number(out.modeStats.simulacros, 0);
    if (window.QuestCollection) {
      out.collection = window.QuestCollection.normalizeCollection(raw.collection, { collection: raw.collection || {} });
      out.economy = window.QuestCollection.normalizeEconomy(raw.economy);
      out.presentation = window.QuestCollection.normalizePresentation(raw.presentation);
    } else {
      out.collection = raw.collection || base.collection;
      out.economy = raw.economy || base.economy;
      out.presentation = raw.presentation || base.presentation;
    }
    out.counters = Object.assign({}, base.counters, raw.counters || {});
    out.counters.date = out.counters.date || U.dateKey(now || new Date());
    out.counters.coins = number(out.counters.coins, 0);
    out.counters.xp = number(out.counters.xp, 0);
    out.counters.sessions = number(out.counters.sessions, 0);
    out.settings = Object.assign({}, base.settings, raw.settings || {});
    out.events = Array.isArray(raw.events) ? raw.events.slice(-200) : [];
    out.meta = Object.assign({}, base.meta, raw.meta || {});
    return sanitizeTree(out, 0);
  }

  function validateState(state) {
    if (!state || typeof state !== "object") return { ok: false, errors: ["El estado no es un objeto."] };
    var errors = [];
    if (Number(state.schemaVersion) !== C.schemaVersion) errors.push("schemaVersion inesperado.");
    if (!Number.isFinite(Number(state.xp)) || Number(state.xp) < 0) errors.push("XP inválida.");
    if (!Number.isFinite(Number(state.coins)) || Number(state.coins) < 0) errors.push("Monedas inválidas.");
    if (!state.academic || typeof state.academic !== "object") errors.push("academic inválido.");
    if (!state.questions || typeof state.questions !== "object") errors.push("questions inválido.");
    if (!Array.isArray(state.sessions)) errors.push("sessions inválido.");
    if (state.activeSession && typeof state.activeSession !== "object") errors.push("activeSession inválido.");
    if (!state.profile || typeof state.profile !== "object") errors.push("profile inválido.");
    if (!state.collection || !Array.isArray(state.collection.ownedCharacterIds)) errors.push("collection inválida.");
    if (!state.economy || !Array.isArray(state.economy.transactions)) errors.push("economy inválida.");
    if (window.QuestCollection && state.collection && state.collection.ownedCharacterIds) {
      window.QuestCollection.validate(state).forEach(function (message) { errors.push(message); });
    }
    return { ok: errors.length === 0, errors: errors };
  }

  function makeMemoryStorage() {
    var map = {};
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null; },
      setItem: function (key, value) { map[key] = String(value); },
      removeItem: function (key) { delete map[key]; },
      key: function (i) { return Object.keys(map)[i] || null; },
      get length() { return Object.keys(map).length; }
    };
  }

  function resolveStorage() {
    try {
      var test = "__quest_test__";
      window.localStorage.setItem(test, "1");
      window.localStorage.removeItem(test);
      return { storage: window.localStorage, mode: "local" };
    } catch (e) {
      return { storage: makeMemoryStorage(), mode: "memory" };
    }
  }

  function create(options) {
    var opts = options || {};
    var resolved = opts.storage ? { storage: opts.storage, mode: "injected" } : resolveStorage();
    var storage = resolved.storage;
    var mode = resolved.mode;
    var keys = {
      state: (opts.prefix || "") + C.storage.stateKey,
      backup: (opts.prefix || "") + C.storage.backupKey,
      journal: (opts.prefix || "") + C.storage.journalKey,
      snapshot: (opts.prefix || "") + C.storage.snapshotKey,
      archivePrefix: (opts.prefix || "") + C.storage.archivePrefix
    };
    var autoSnapshot = opts.autoSnapshot !== false;
    var state = null;
    var blocked = false;
    var listeners = [];
    var ready = false;
    var lastError = null;
    var clock = typeof opts.now === "function" ? opts.now : function () { return new Date(); };

    function now() { return clock(); }

    function notify(source) {
      var payload = { state: state, snapshot: getSnapshot(), source: source || "commit" };
      listeners.slice().forEach(function (fn) {
        try { fn(payload); } catch (e) { if (window.console) console.warn("QuestStore listener", e); }
      });
    }

    function readRaw(key) {
      var text = null;
      try { text = storage.getItem(key); } catch (e) {
        return { present: false, text: null, value: null, error: e };
      }
      if (text === null || text === undefined) return { present: false, text: null, value: null, error: null };
      try {
        return { present: true, text: text, value: JSON.parse(text), error: null };
      } catch (e) {
        return { present: true, text: text, value: null, error: e };
      }
    }

    function readJSON(key) {
      var entry = readRaw(key);
      return entry.value;
    }

    function writeJSON(key, value) {
      storage.setItem(key, JSON.stringify(value));
    }

    function cleanupJournal() {
      try { storage.removeItem(keys.journal); } catch (e) {}
    }

    function archiveRaw(text, reason) {
      if (!text) return null;
      var key = keys.archivePrefix + (reason || "recovery") + "-" + U.nowISO(now()).replace(/[:.]/g, "-");
      storage.setItem(key, text);
      return key;
    }

    /* Antigüedad de un documento guardado: revisión y luego marca de tiempo.
       Sirve para no dejar que un diario viejo pise un estado más reciente. */
    function freshness(doc) {
      if (!doc || typeof doc !== "object") return -1;
      var rev = Number(doc.revision);
      var stamp = Date.parse(doc.updatedAt || "");
      return (isFinite(rev) ? rev : 0) * 1e13 + (isFinite(stamp) ? stamp : 0);
    }

    function loadRaw() {
      var stateEntry = readRaw(keys.state);
      var journalEntry = readRaw(keys.journal);
      if (journalEntry.present && journalEntry.value && journalEntry.value.state) {
        var journalIsNewer = !stateEntry.present || !!stateEntry.error ||
          freshness(journalEntry.value.state) >= freshness(stateEntry.value);
        if (journalIsNewer) {
          try {
            writeJSON(keys.state, journalEntry.value.state);
            cleanupJournal();
            return { raw: journalEntry.value.state, recovered: false, fromJournal: true };
          } catch (e) { /* el diario se ignora si no se puede consolidar */ }
        } else {
          /* El diario es de una escritura anterior ya consolidada: no sustituye
             a un estado más reciente. */
          cleanupJournal();
        }
      }
      if (stateEntry.present && !stateEntry.error) {
        return { raw: stateEntry.value, recovered: false, fromJournal: false };
      }
      if (stateEntry.present && stateEntry.error) {
        var backup = readRaw(keys.backup);
        var archived = null;
        try { archived = archiveRaw(stateEntry.text, "corrupt-state"); } catch (e) { archived = null; }
        if (backup.present && !backup.error && backup.value) {
          return { raw: backup.value, recovered: true, fromJournal: false, archivedKey: archived };
        }
        throw new Error("El progreso guardado está dañado y no hay un respaldo legible. Se conservó una copia" + (archived ? " en " + archived : "") + ". Usa el botón de recuperación o restaura el archivo manualmente.");
      }
      if (!stateEntry.present) {
        var backupOnly = readRaw(keys.backup);
        if (backupOnly.present && !backupOnly.error && backupOnly.value) {
          return { raw: backupOnly.value, recovered: true, fromJournal: false };
        }
      }
      return { raw: null, recovered: false, fromJournal: false };
    }

    function persist(next, previousRaw) {
      var payload = JSON.stringify(next);
      try {
        writeJSON(keys.journal, { at: U.nowISO(now()), updatedAt: next.updatedAt, state: next });
        if (previousRaw) storage.setItem(keys.backup, previousRaw);
        storage.setItem(keys.state, payload);
        cleanupJournal();
        state = next;
        lastError = null;
        return true;
      } catch (e) {
        lastError = e;
        try { storage.removeItem(keys.journal); } catch (ignored) {}
        throw new Error("No se pudo guardar el progreso en este navegador. No se aplicó el cambio. " + (e && e.message ? e.message : ""));
      }
    }

    function init() {
      blocked = false;
      try {
        var loaded = loadRaw();
        var raw = loaded.raw;
        if (!raw) {
          state = defaultState(now());
          persist(state, null);
        } else {
          var previousRaw = JSON.stringify(raw);
          state = normalizeState(raw, now());
          if (loaded.recovered) state.meta.recoveredFromCorrupt = true;
          if (Number(raw.schemaVersion) !== C.schemaVersion || raw.appVersion !== C.version || loaded.recovered || loaded.fromJournal) {
            state.meta.migratedFrom = raw.schemaVersion == null ? "sin versión" : String(raw.schemaVersion);
            state.updatedAt = U.nowISO(now());
            persist(state, previousRaw);
          }
        }
      } catch (e) {
        lastError = e;
        blocked = true;
        try {
          var current = readRaw(keys.state);
          if (current.present && current.text) archiveRaw(current.text, "blocked-state");
        } catch (ignored) {}
        state = defaultState(now());
      }
      ready = true;
      if (autoSnapshot && !blocked) writeSnapshot();
      return state;
    }

    function currentRevisionOnDisk() {
      var raw = readJSON(keys.state);
      return raw ? number(raw.revision, 0) : 0;
    }

    function commit(mutator, meta) {
      if (typeof mutator !== "function") throw new Error("commit requiere una función.");
      if (!state) init();
      if (blocked) throw new Error("El progreso guardado no pudo leerse. Recupera el perfil antes de continuar.");
      var diskRevision = currentRevisionOnDisk();
      if (diskRevision > number(state.revision, 0)) {
        try {
          var diskRaw = readJSON(keys.state);
          if (diskRaw) state = normalizeState(diskRaw, now());
        } catch (e) {}
        notify("external");
        throw new Error("Otra pestaña cambió el progreso. Se recargó el estado; vuelve a intentar la acción.");
      }
      var before = state;
      var draft = U.clone(state);
      var result;
      try {
        result = mutator(draft, { now: now(), meta: meta || {} });
        draft.revision = number(state.revision, 0) + 1;
        draft.updatedAt = U.nowISO(now());
        var check = validateState(draft);
        if (!check.ok) throw new Error("Estado inconsistente: " + check.errors.join(" "));
        var previousRaw = JSON.stringify(before);
        persist(draft, previousRaw);
      } catch (e) {
        state = before;
        throw e;
      }
      if (autoSnapshot) writeSnapshot();
      notify("commit");
      return { result: result, state: state, snapshot: getSnapshot() };
    }

    function getSnapshot() {
      if (!state) return null;
      var catalog = window.QuestContent && window.QuestContent.catalog ? window.QuestContent.catalog : null;
      var stats = P.stats(state, catalog);
      var rank = P.rankFor(stats);
      var level = P.levelFromXp(state.xp);
      var last = state.sessions && state.sessions.length ? state.sessions[0] : null;
      var collection = window.QuestCollection && state ? state.collection : null;
      var selectedId = window.QuestCollection ? window.QuestCollection.selectedCharacterId(state) : "ilan";
      var selected = window.QuestCharacters ? window.QuestCharacters.byId(selectedId) : null;
      return {
        version: C.version,
        schemaVersion: C.schemaVersion,
        updatedAt: state.updatedAt,
        level: level.level,
        levelPercent: level.percent,
        xp: state.xp,
        xpToNext: level.toNext,
        coins: state.coins,
        rank: rank.name,
        rankColor: rank.color,
        stage: state.stage,
        stageName: C.stages[state.stage] ? C.stages[state.stage].name : "Iniciación",
        answered: stats.answered,
        accuracy: Math.round(stats.accuracy * 1000) / 10,
        missions: stats.missions,
        bosses: stats.bosses,
        mastered: stats.mastered,
        streak: state.daily.streak,
        hasActivity: stats.answered > 0 || state.xp > 0 || state.sessions.length > 0,
        selectedCharacterId: selectedId,
        selectedCharacterName: selected ? selected.name : "",
        selectedCharacterTitle: selected ? selected.title : "",
        selectedCharacterRarity: selected ? selected.rarity : "",
        charactersOwned: collection ? collection.ownedCharacterIds.length : 0,
        charactersTotal: window.QuestCharacters ? window.QuestCharacters.characters.length : 0,
        cosmeticsOwned: collection ? collection.ownedCosmeticIds.length : 0,
        lastSession: last ? {
          id: last.id,
          mode: last.mode,
          title: last.title,
          endedAt: last.endedAt,
          score: last.score,
          accuracy: last.accuracy
        } : null
      };
    }

    function writeSnapshot() {
      if (!autoSnapshot || !state || blocked) return null;
      try {
        var snap = getSnapshot();
        storage.setItem(keys.snapshot, JSON.stringify(snap));
        return snap;
      } catch (e) { return null; }
    }

    function subscribe(fn) {
      if (typeof fn !== "function") return function () {};
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (x) { return x !== fn; }); };
    }

    function reset() {
      if (!state) init();
      var currentRaw = readRaw(keys.state);
      var source = blocked && currentRaw.text ? currentRaw.text : JSON.stringify(state);
      try { archiveRaw(source, blocked ? "recovered" : "reset"); } catch (e) {
        throw new Error("No se pudo archivar el progreso actual; no se reinició nada.");
      }
      var fresh = defaultState(now());
      fresh.revision = blocked ? 0 : number(state.revision, 0) + 1;
      blocked = false;
      persist(fresh, source);
      if (autoSnapshot) writeSnapshot();
      notify("reset");
      return fresh;
    }

    function recoverCorrupt() {
      var currentRaw = readRaw(keys.state);
      if (currentRaw.text) {
        try { archiveRaw(currentRaw.text, "recovered"); } catch (e) {
          throw new Error("No se pudo archivar el progreso dañado; la recuperación se canceló.");
        }
      }
      var fresh = defaultState(now());
      blocked = false;
      persist(fresh, currentRaw.text || null);
      if (autoSnapshot) writeSnapshot();
      notify("recovered");
      return fresh;
    }

    function exportState() {
      if (!state) init();
      return JSON.stringify({
        app: C.appName,
        build: C.build,
        exportedAt: U.nowISO(now()),
        state: state
      }, null, 2);
    }

    function importPayload(text) {
      var parsed;
      try { parsed = JSON.parse(text); } catch (e) { throw new Error("El archivo no contiene JSON válido."); }
      if (parsed && parsed.app && parsed.app !== C.appName) {
        throw new Error("El archivo pertenece a otra aplicación, no a SERUMS QUEST.");
      }
      var imported = parsed && parsed.state ? parsed.state : parsed;
      if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
        throw new Error("El archivo no contiene un progreso reconocible.");
      }
      if (!parsed.state && imported.schemaVersion == null && imported.profile == null && imported.xp == null) {
        throw new Error("El archivo no parece un progreso de SERUMS QUEST.");
      }
      var normalized = normalizeState(imported, now());
      var check = validateState(normalized);
      if (!check.ok) throw new Error("El progreso importado no pasó la validación: " + check.errors.join(" "));
      var currentRaw = readRaw(keys.state);
      var source = currentRaw.text || JSON.stringify(state);
      try { archiveRaw(source, "import"); } catch (e) {
        throw new Error("No se pudo archivar el progreso actual; la importación se canceló.");
      }
      normalized.revision = blocked ? 0 : number(state.revision, 0) + 1;
      normalized.updatedAt = U.nowISO(now());
      blocked = false;
      persist(normalized, source);
      if (autoSnapshot) writeSnapshot();
      notify("import");
      return normalized;
    }

    if (window.addEventListener && !opts.prefix) {
      window.addEventListener("storage", function (e) {
        if (e.key !== keys.state || !e.newValue) return;
        try {
          var incoming = normalizeState(JSON.parse(e.newValue), now());
          if (incoming.updatedAt >= state.updatedAt) {
            state = incoming;
            notify("external");
          }
        } catch (err) {}
      });
    }

    return {
      init: init,
      getState: function () { return state; },
      getSnapshot: getSnapshot,
      commit: commit,
      subscribe: subscribe,
      reset: reset,
      recoverCorrupt: recoverCorrupt,
      exportState: exportState,
      importPayload: importPayload,
      writeSnapshot: writeSnapshot,
      getMode: function () { return blocked ? "blocked" : mode; },
      getLastError: function () { return lastError; },
      isReady: function () { return ready; },
      isBlocked: function () { return blocked; },
      keys: keys
    };
  }

  var singleton = null;
  function get() {
    if (!singleton) singleton = create();
    return singleton;
  }

  window.QuestStore = {
    create: create,
    get: get,
    defaultState: defaultState,
    normalize: normalizeState,
    validate: validateState,
    makeMemoryStorage: makeMemoryStorage
  };
})();
