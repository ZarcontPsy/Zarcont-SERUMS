/* =========================================================================
   SERUMS QUEST · V2 · Checkpoint 1
   Módulo 5 · Feedback de respuesta, flashcard local y mezcla de fuentes.

   Se concatena dentro del mismo IIFE que part0–part4: comparte ámbito con
   state, session, lastFeedback, QUESTION_BY_ID, AREA_BY_ID, nextQuestion,
   toggleQuestionTag, persist, esc, icon, etc. No crea otro IIFE.

   Qué hace:
   - onAnswer(): en el modo por defecto («al final del nivel», feedbackMode
     'end') NO abre ninguna pantalla entre preguntas: el combate, el sonido
     y un destello breve en la opción elegida/clave son la señal, y el flujo
     pasa a la siguiente pregunta en ~900 ms. En el modo «tras cada
     pregunta» ('each') conserva el overlay completo de siempre.
   - inlineEnabled()/autoAdvanceDelay()/feedbackMode()/isEndMode(): contrato
     que part4-flow y part3-ui consultan para el avance fluido.
   - hide()/isOpen(): cierre e integración con nextQuestion, setScreen y
     updateModeClock.
   - Congela de verdad el reloj de sesión y de pregunta mientras el overlay
     está abierto: desplaza session.endsAt, session.questionEndsAt y
     session.startedAt por el tiempo transcurrido. updateModeClock solo evita
     dibujar/cerrar; sin este ajuste el tiempo avanzaría igual.
   - settingsHTML()/mountSettings(): pesos de las tres fuentes y ajuste del
     momento del feedback («al final del nivel» por defecto / «tras cada
     pregunta»), guardado en state.settings.feedbackMode.
   - mixMissionQuestions/mixModeQuestions/mixPracticeQuestions: reparto
     ponderado de preguntas sin tocar recompensas, reglas ni repaso.

   ES5. Sin red, sin imágenes y sin inventar datos de contenido.
   ========================================================================= */

var V2FB_KEYS = ['campaign', 'dashboard', 'flashcards'];
var V2FB_DEFAULT_WEIGHTS = { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 };
/* Feedback «al final del nivel» (por defecto): entre preguntas no hay pantalla.
   El avance automático deja ver el impacto del combate y el destello de la
   opción; 900 ms lo mantiene dentro del rango fluido de 800–1000 ms. */
var V2FB_AUTO_ADVANCE_MS = 900;
var V2FB_FLASH_MS = 720;
var V2FB_SOURCE_META = {
  campaign: {
    label: 'Campaña',
    short: 'Campaña',
    hint: 'Misiones y duelos de la ruta original.',
    color: '#7aa2ff'
  },
  dashboard: {
    label: 'Fichas del dashboard',
    short: 'Dashboard',
    hint: 'Preguntas del panel de estudio.',
    color: '#69d3c1'
  },
  flashcards: {
    label: 'Flashcards',
    short: 'Flashcards',
    hint: 'Tarjetas del mazo de repaso.',
    color: '#c49bff'
  }
};
var V2FB_DIFFICULTY_LABELS = { base: 'Base', media: 'Media', alta: 'Alta' };
var V2FB_STOPWORDS = {
  para: 1, como: 1, desde: 1, entre: 1, sobre: 1, cuando: 1, porque: 1, aunque: 1,
  donde: 1, mismo: 1, misma: 1, todos: 1, todas: 1, suele: 1, suelen: 1,
  puede: 1, pueden: 1, debe: 1, deben: 1, ser: 1, son: 1, los: 1, las: 1,
  del: 1, una: 1, unos: 1, unas: 1, con: 1, sin: 1, por: 1, que: 1, esta: 1,
  este: 1, estos: 1, estas: 1, otro: 1, otra: 1, otros: 1, otras: 1, tiene: 1,
  tienen: 1, hacer: 1, hace: 1, modo: 1, forma: 1, parte: 1, caso: 1, casos: 1
};

var v2fbState = {
  installed: false,
  open: false,
  root: null,
  flashRoot: null,
  flashReturnFocus: null,
  q: null,
  feedback: null,
  session: null,
  sealed: false,
  kind: '',
  returnFocus: null,
  exitAt: 0,
  exitTimer: 0,
  lastContinueAt: 0,
  clockSession: null,
  clockPausedAt: 0,
  clockPaused: false,
  persistTimer: 0,
  flashTimer: 0,
  inlineUntil: 0,
  inlineTimer: 0,
  pools: null
};

/* -------------------------------------------------------------------------
   Utilidades defensivas
   ------------------------------------------------------------------------- */
function v2fbSoftError(error) {
  try {
    if (typeof V2 !== 'undefined' && V2 && typeof V2.softError === 'function') V2.softError('feedback', error);
  } catch (e) {}
  try { if (window.console && window.console.warn) window.console.warn('[V2 feedback]', error); } catch (e) {}
}
function v2fbEmit(type, payload) {
  try {
    if (typeof V2 !== 'undefined' && V2 && typeof V2.emit === 'function') V2.emit('feedback:' + type, payload || null);
  } catch (e) {}
}
function v2fbClamp(value, min, max) {
  var n = Number(value);
  if (!isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}
function v2fbEsc(value) {
  if (typeof esc === 'function') {
    try { return esc(value); } catch (e) {}
  }
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function v2fbIcon(name, size) {
  if (typeof icon === 'function') {
    try { return icon(name, size || 14); } catch (e) {}
  }
  return '';
}
function v2fbToast(message, tone, duration) {
  if (typeof toast === 'function') {
    try { toast(message, tone || 'success', duration || 2000); } catch (e) {}
  }
}
function v2fbInitAudio() {
  try { if (typeof initAudio === 'function') initAudio(); } catch (e) {}
}
function v2fbReducedMotion() {
  try {
    if (typeof V2 !== 'undefined' && V2 && typeof V2.reducedMotion === 'function') return !!V2.reducedMotion();
  } catch (e) {}
  try { return !!(document.body && document.body.classList && document.body.classList.contains('reduced-motion')); } catch (e) {}
  return false;
}
function v2fbTruncate(value, max) {
  var text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  if (!max || text.length <= max) return text;
  var cut = text.slice(0, max);
  var space = cut.lastIndexOf(' ');
  if (space > max * 0.55) cut = cut.slice(0, space);
  return cut.replace(/[\s,;:.!?]+$/, '') + '…';
}
function v2fbNorm(text) {
  var out = String(text == null ? '' : text).toLowerCase();
  try { if (out.normalize) out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
  return out.replace(/[^a-z0-9ñü\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function v2fbTokens(text) {
  var normalized = v2fbNorm(text);
  if (!normalized) return [];
  var parts = normalized.split(' ');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var word = parts[i];
    if (!word || word.length < 5 || V2FB_STOPWORDS[word]) continue;
    if (out.indexOf(word) === -1) out.push(word);
    if (out.length >= 6) break;
  }
  return out;
}
function v2fbQuestion(id) {
  try {
    if (typeof QUESTION_BY_ID !== 'undefined' && QUESTION_BY_ID && QUESTION_BY_ID[id]) return QUESTION_BY_ID[id];
  } catch (e) {}
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.questions && CAMP.questions[id]) return CAMP.questions[id];
  } catch (e) {}
  return null;
}
function v2fbArea(question) {
  try {
    if (question && typeof AREA_BY_ID !== 'undefined' && AREA_BY_ID && AREA_BY_ID[question.areaId]) return AREA_BY_ID[question.areaId];
  } catch (e) {}
  return null;
}
function v2fbOption(question, id) {
  if (!question || !question.options) return null;
  for (var i = 0; i < question.options.length; i++) {
    var option = question.options[i];
    if (option && String(option.id) === String(id)) return option;
  }
  return null;
}
function v2fbCurrentSession() {
  try { if (typeof session !== 'undefined' && session) return session; } catch (e) {}
  return null;
}
function v2fbCurrentFeedback() {
  try { if (typeof lastFeedback !== 'undefined' && lastFeedback) return lastFeedback; } catch (e) {}
  return null;
}
function v2fbSourceOf(question) {
  var source = question && question.source;
  if (source === 'campaign' || source === 'dashboard' || source === 'flashcards') return source;
  var id = String((question && question.id) || '');
  if (id.indexOf('v2-fc') === 0) return 'flashcards';
  if (id.indexOf('v2-dash') === 0) return 'dashboard';
  return 'campaign';
}
function v2fbSourceLabel(question) {
  return V2FB_SOURCE_META[v2fbSourceOf(question)].label;
}
function v2fbSessionLabel(ses) {
  if (!ses) return 'Sesión';
  var mode = ses.mode;
  if (mode === 'review') return 'Repaso espaciado';
  if (mode === 'practice') return 'Práctica libre';
  if (mode === 'daily') return 'Desafío diario';
  if (mode === 'survival') return 'Supervivencia';
  if (mode === 'timed') return 'Contrarreloj';
  if (mode === 'simulacro') return 'Simulacro';
  if (mode === 'boss') return 'Duelo de dominio';
  if (mode === 'mission') return 'Campaña';
  return 'Sesión';
}
function v2fbKind(feedback) {
  if (feedback && feedback.timeout) return 'timeout';
  if (feedback && feedback.correct) return 'correct';
  return 'wrong';
}

/* -------------------------------------------------------------------------
   Modo de feedback: «al final del nivel» (por defecto) o «tras cada pregunta»
   ------------------------------------------------------------------------- */
function v2fbFeedbackMode() {
  try {
    if (typeof state !== 'undefined' && state && state.settings && state.settings.feedbackMode === 'each') return 'each';
  } catch (e) {}
  return 'end';
}
function v2fbIsEndMode() {
  return v2fbFeedbackMode() === 'end';
}
function v2fbInlineEnabled() {
  return v2fbFeedbackMode() === 'each';
}
function v2fbAutoAdvanceDelay(ses) {
  if (!v2fbIsEndMode()) return 0;
  /* En «al final» también el Simulacro avanza solo: su clave sigue reservada
     para el informe final, así que no hay nada que leer entre preguntas. */
  return V2FB_AUTO_ADVANCE_MS;
}
function v2fbOnlyOriginalBank() {
  try {
    return !!(typeof state !== 'undefined' && state && state.settings && state.settings.onlyOriginalBank);
  } catch (e) {
    return false;
  }
}
function v2fbCampaignOnlyIds(qids) {
  var out = [];
  for (var i = 0; i < qids.length; i++) {
    var question = v2fbQuestion(qids[i]);
    if (!question) continue;
    if (v2fbSourceOf(question) !== 'campaign') continue;
    out.push(String(question.id));
  }
  return out;
}

/* -------------------------------------------------------------------------
   Preguntas: pools, pesos y semillas
   ------------------------------------------------------------------------- */
function v2fbQuestionMap() {
  try {
    if (typeof QUESTION_BY_ID !== 'undefined' && QUESTION_BY_ID) return QUESTION_BY_ID;
  } catch (e) {}
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.questions) return CAMP.questions;
  } catch (e) {}
  return {};
}
function v2fbPools() {
  if (v2fbState.pools) return v2fbState.pools;
  var pools = { campaign: [], dashboard: [], flashcards: [] };
  var map = v2fbQuestionMap();
  var ids = [];
  try { ids = Object.keys(map); } catch (e) { ids = []; }
  for (var i = 0; i < ids.length; i++) {
    var question = map[ids[i]];
    if (!question || !question.options || !question.answer || !question.stem) continue;
    var source = v2fbSourceOf(question);
    if (!pools[source]) pools[source] = [];
    pools[source].push(question);
  }
  var total = pools.campaign.length + pools.dashboard.length + pools.flashcards.length;
  if (total > 0) v2fbState.pools = pools;
  return pools;
}
function v2fbRawWeights() {
  var out = {
    campaign: V2FB_DEFAULT_WEIGHTS.campaign,
    dashboard: V2FB_DEFAULT_WEIGHTS.dashboard,
    flashcards: V2FB_DEFAULT_WEIGHTS.flashcards
  };
  var raw = null;
  try { raw = (typeof state !== 'undefined' && state && state.settings && state.settings.sourceWeights) || null; } catch (e) {}
  if (!raw) return out;
  for (var i = 0; i < V2FB_KEYS.length; i++) {
    var key = V2FB_KEYS[i];
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    var n = Number(raw[key]);
    if (isFinite(n) && n >= 0) out[key] = Math.min(1, n);
  }
  return out;
}
function v2fbNormalizeWeights(weights) {
  if (!weights) return null;
  var total = weights.campaign + weights.dashboard + weights.flashcards;
  if (!(total > 0)) return null;
  return {
    campaign: weights.campaign / total,
    dashboard: weights.dashboard / total,
    flashcards: weights.flashcards / total
  };
}
function v2fbDisplayPercents(normalized) {
  var values = [];
  var floors = { campaign: 0, dashboard: 0, flashcards: 0 };
  var sum = 0;
  for (var i = 0; i < V2FB_KEYS.length; i++) {
    var key = V2FB_KEYS[i];
    var exact = normalized[key] * 100;
    var floor = Math.floor(exact + 1e-9);
    floors[key] = floor;
    sum += floor;
    values.push({ key: key, frac: exact - floor });
  }
  values.sort(function (a, b) {
    if (b.frac !== a.frac) return b.frac - a.frac;
    return V2FB_KEYS.indexOf(a.key) - V2FB_KEYS.indexOf(b.key);
  });
  var remaining = 100 - sum;
  for (var j = 0; j < remaining && j < values.length; j++) floors[values[j].key] += 1;
  return floors;
}
function v2fbStoreWeights(weights) {
  try {
    if (typeof state !== 'undefined' && state) {
      state.settings = state.settings || {};
      state.settings.sourceWeights = {
        campaign: weights.campaign,
        dashboard: weights.dashboard,
        flashcards: weights.flashcards
      };
    }
  } catch (e) {}
}
function v2fbSchedulePersist() {
  if (v2fbState.persistTimer) return;
  v2fbState.persistTimer = window.setTimeout(function () {
    v2fbState.persistTimer = 0;
    v2fbFlushPersist();
  }, 180);
}
function v2fbSaveSettingsNow() {
  /* SETTINGS_KEY y SAVE_KEY son dos copias: loadSettings() pisa state.settings
     al arrancar. Si solo persistimos SAVE_KEY, una recarga devuelve los pesos
     viejos desde SETTINGS_KEY. Guardamos ambas claves al cambiar los pesos. */
  try { if (typeof saveSettings === 'function') saveSettings(); } catch (e) {}
}
function v2fbFlushPersist() {
  if (v2fbState.persistTimer) {
    try { window.clearTimeout(v2fbState.persistTimer); } catch (e) {}
    v2fbState.persistTimer = 0;
  }
  v2fbSaveSettingsNow();
  try { if (typeof persist === 'function') persist(); } catch (e) {}
}
function v2fbHash(text) {
  var value = String(text == null ? '' : text);
  var hash = 2166136261;
  for (var i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function v2fbRandom(seed) {
  var s = v2fbHash(seed) || 1;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function v2fbShuffle(list, seed) {
  var out = list.slice();
  var random = v2fbRandom(seed);
  for (var i = out.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}
function v2fbTodayKey() {
  try { if (typeof dateKey === 'function') return dateKey(); } catch (e) {}
  var now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1) + '-' + String(now.getDate());
}
function v2fbSeedBase(kind, id) {
  var answered = 0;
  var sessions = 0;
  try {
    answered = Number(state && state.academic && state.academic.answered) || 0;
    sessions = Number(state && state.academic && state.academic.sessions) || 0;
  } catch (e) {}
  return kind + ':' + String(id || '') + ':' + v2fbTodayKey() + ':' + answered + ':' + sessions;
}
function v2fbStageTargetComplexity() {
  var stage = 1;
  try { stage = Math.max(1, Math.min(4, Number(state && state.stage) || 1)); } catch (e) {}
  var table = [18, 25, 30, 35];
  return table[stage - 1];
}

/* -------------------------------------------------------------------------
   Mezcla ponderada de fuentes
   ------------------------------------------------------------------------- */
function v2fbBuildSlots(qids, fixedArea, useStageTarget) {
  var slots = [];
  for (var i = 0; i < qids.length; i++) {
    var question = v2fbQuestion(qids[i]);
    if (!question) continue;
    slots.push({
      id: question.id,
      area: fixedArea || question.areaId || '',
      complexity: useStageTarget ? v2fbStageTargetComplexity() : (Number(question.complexity) || v2fbStageTargetComplexity()),
      source: v2fbSourceOf(question),
      locked: false
    });
  }
  return slots;
}
function v2fbPracticeSlots(valid, desired) {
  var sorted = valid.slice().sort(function (a, b) {
    var diff = (Number(a.complexity) || 0) - (Number(b.complexity) || 0);
    return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
  });
  var slots = [];
  for (var i = 0; i < desired; i++) {
    var index = Math.min(sorted.length - 1, Math.floor((i + 0.5) * sorted.length / desired));
    slots.push({
      id: null,
      area: valid[0].areaId || '',
      complexity: Number(sorted[index].complexity) || v2fbStageTargetComplexity(),
      source: '',
      locked: false
    });
  }
  return slots;
}
function v2fbAllocate(desired, weights, pools, forceCampaign, caps) {
  if (desired <= 0) return null;
  var active = [];
  var capacity = 0;
  var limits = { campaign: 0, dashboard: 0, flashcards: 0 };
  for (var i = 0; i < V2FB_KEYS.length; i++) {
    var key = V2FB_KEYS[i];
    var limit = caps ? Math.max(0, Number(caps[key]) || 0) : (pools[key] ? pools[key].length : 0);
    limits[key] = limit;
    if (limit > 0 && weights[key] > 0) {
      active.push(key);
      capacity += limit;
    }
  }
  if (!active.length || capacity < desired) return null;
  var counts = { campaign: 0, dashboard: 0, flashcards: 0 };
  var pending = desired;
  while (pending > 0) {
    var best = null;
    var bestScore = -1;
    for (var a = 0; a < active.length; a++) {
      var candidate = active[a];
      if (counts[candidate] >= limits[candidate]) continue;
      var score = weights[candidate] / (counts[candidate] + 1);
      if (score > bestScore + 1e-12) {
        bestScore = score;
        best = candidate;
      }
    }
    if (!best) return null;
    counts[best] += 1;
    pending -= 1;
  }
  if (forceCampaign && weights.campaign > 0 && limits.campaign > 0 && counts.campaign === 0) {
    var donor = null;
    var donorCount = 0;
    for (var b = 0; b < active.length; b++) {
      var donorKey = active[b];
      if (donorKey === 'campaign') continue;
      if (counts[donorKey] > donorCount) {
        donor = donorKey;
        donorCount = counts[donorKey];
      }
    }
    if (donor) {
      counts[donor] -= 1;
      counts.campaign += 1;
    }
  }
  return counts;
}
function v2fbSequence(counts, desired, seed) {
  var order = v2fbShuffle(V2FB_KEYS.slice(), seed + ':order');
  var remaining = {
    campaign: counts.campaign,
    dashboard: counts.dashboard,
    flashcards: counts.flashcards
  };
  var sequence = [];
  while (sequence.length < desired) {
    var added = false;
    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      if (remaining[key] > 0) {
        sequence.push(key);
        remaining[key] -= 1;
        added = true;
        if (sequence.length >= desired) break;
      }
    }
    if (!added) break;
  }
  return sequence;
}
function v2fbRanks(pools, seed) {
  var ranks = {};
  for (var i = 0; i < V2FB_KEYS.length; i++) {
    var key = V2FB_KEYS[i];
    var list = (pools[key] || []).slice().sort(function (a, b) {
      return String(a.id).localeCompare(String(b.id));
    });
    var shuffled = v2fbShuffle(list, seed + ':rank:' + key);
    for (var j = 0; j < shuffled.length; j++) ranks[shuffled[j].id] = j;
  }
  return ranks;
}
function v2fbPick(source, slot, pools, used, ranks, allowed, areaStrict) {
  var list = pools[source] || [];
  var sameArea = [];
  var otherArea = [];
  for (var i = 0; i < list.length; i++) {
    var question = list[i];
    if (!question || used[question.id]) continue;
    if (allowed && !allowed[question.id]) continue;
    if (slot.area && question.areaId === slot.area) sameArea.push(question);
    else otherArea.push(question);
  }
  var candidates = sameArea.length || areaStrict ? sameArea : otherArea;
  if (!candidates.length) return null;
  var target = Number(slot.complexity) || v2fbStageTargetComplexity();
  var best = null;
  var bestScore = Infinity;
  var bestRank = Infinity;
  for (var j = 0; j < candidates.length; j++) {
    var candidate = candidates[j];
    var distance = Math.abs((Number(candidate.complexity) || target) - target);
    var rank = ranks && ranks[candidate.id] != null ? ranks[candidate.id] : 1e9;
    if (distance < bestScore - 1e-9 || (Math.abs(distance - bestScore) <= 1e-9 && rank < bestRank)) {
      best = candidate;
      bestScore = distance;
      bestRank = rank;
    }
  }
  return best;
}
function v2fbAnyPick(slot, pools, used, ranks, allowed, excluded, areaStrict) {
  for (var i = 0; i < V2FB_KEYS.length; i++) {
    var key = V2FB_KEYS[i];
    if (key === excluded) continue;
    var found = v2fbPick(key, slot, pools, used, ranks, allowed, areaStrict);
    if (found) return found;
  }
  return null;
}
function v2fbFillSlots(slots, sequence, pools, seed, allowed, areaStrict) {
  var used = {};
  var ranks = v2fbRanks(pools, seed);
  var out = [];
  var sequenceIndex = 0;
  var i;
  for (i = 0; i < slots.length; i++) {
    if (slots[i].locked && slots[i].id && v2fbQuestion(slots[i].id)) used[slots[i].id] = true;
  }
  for (i = 0; i < slots.length; i++) {
    var slot = slots[i];
    if (slot.locked && slot.id && v2fbQuestion(slot.id)) {
      out.push(slot.id);
      continue;
    }
    var source = sequence[sequenceIndex];
    sequenceIndex += 1;
    if (!source) return null;
    var original = slot.id ? v2fbQuestion(slot.id) : null;
    if (original && !used[original.id] && v2fbSourceOf(original) === source && (!allowed || allowed[original.id])) {
      used[original.id] = true;
      out.push(original.id);
      continue;
    }
    var pick = v2fbPick(source, slot, pools, used, ranks, allowed, areaStrict);
    if (!pick) pick = v2fbAnyPick(slot, pools, used, ranks, allowed, source, areaStrict);
    if (!pick) return null;
    used[pick.id] = true;
    out.push(pick.id);
  }
  if (sequenceIndex !== sequence.length) return null;
  return out;
}
function v2fbLockedForMode(mode, qids) {
  var locked = {};
  if (mode !== 'daily') return locked;
  try {
    if (typeof dueErrors !== 'function') return locked;
    var due = dueErrors();
    if (due && due.length && due[0] && due[0].questionId && qids.indexOf(due[0].questionId) !== -1) {
      locked[due[0].questionId] = true;
    }
  } catch (e) {}
  return locked;
}
function v2fbMixMissionQuestions(mission, qids) {
  try {
    if (!Array.isArray(qids) || !qids.length) return null;
    /* Ajuste «solo banco original»: la misión conserva sus preguntas de
       campaña y no se mezclan fichas ni tarjetas. */
    if (v2fbOnlyOriginalBank()) {
      var campaignMissionIds = v2fbCampaignOnlyIds(qids);
      return campaignMissionIds.length ? campaignMissionIds : null;
    }
    var valid = [];
    for (var i = 0; i < qids.length; i++) {
      if (v2fbQuestion(qids[i])) valid.push(qids[i]);
    }
    if (!valid.length) return null;
    var desired = Math.max(3, valid.length);
    var weights = v2fbNormalizeWeights(v2fbRawWeights());
    if (!weights) return null;
    var pools = v2fbPools();
    var areaId = (mission && mission.areaId) || '';
    var slots = v2fbBuildSlots(valid, areaId, true);
    while (slots.length < desired) {
      slots.push({
        id: null,
        area: areaId || (slots[0] ? slots[0].area : ''),
        complexity: v2fbStageTargetComplexity(),
        source: '',
        locked: false
      });
    }
    if (slots.length > desired) slots = slots.slice(0, desired);
    var caps = null;
    if (areaId) {
      caps = { campaign: 0, dashboard: 0, flashcards: 0 };
      for (var k = 0; k < V2FB_KEYS.length; k++) {
        var sourceKey = V2FB_KEYS[k];
        var sourcePool = pools[sourceKey] || [];
        for (var p = 0; p < sourcePool.length; p++) {
          if (sourcePool[p].areaId === areaId) caps[sourceKey] += 1;
        }
      }
    }
    var counts = v2fbAllocate(desired, weights, pools, weights.campaign > 0, caps);
    if (!counts) return null;
    var seed = v2fbSeedBase('mission', mission && mission.id);
    var sequence = v2fbSequence(counts, desired, seed);
    if (sequence.length !== desired) return null;
    var out = v2fbFillSlots(slots, sequence, pools, seed, null, !!areaId);
    if (!out || out.length !== desired) return null;
    return out;
  } catch (error) {
    v2fbSoftError(error);
    return null;
  }
}
function v2fbMixModeQuestions(mode, qids) {
  try {
    if (!Array.isArray(qids) || !qids.length) return null;
    if (v2fbOnlyOriginalBank()) {
      var campaignModeIds = v2fbCampaignOnlyIds(qids);
      return campaignModeIds.length ? campaignModeIds : null;
    }
    var valid = [];
    for (var i = 0; i < qids.length; i++) {
      if (v2fbQuestion(qids[i])) valid.push(qids[i]);
    }
    if (!valid.length) return null;
    var weights = v2fbNormalizeWeights(v2fbRawWeights());
    if (!weights) return null;
    var pools = v2fbPools();
    var desired = valid.length;
    var slots = v2fbBuildSlots(valid, '', false);
    if (!slots.length) return null;
    var locked = v2fbLockedForMode(mode, valid);
    var lockedCount = 0;
    var hasLockedCampaign = false;
    for (i = 0; i < slots.length; i++) {
      if (slots[i].id && locked[slots[i].id]) {
        slots[i].locked = true;
        lockedCount += 1;
        var lockedQuestion = v2fbQuestion(slots[i].id);
        if (lockedQuestion && v2fbSourceOf(lockedQuestion) === 'campaign') hasLockedCampaign = true;
      }
    }
    var mixCount = desired - lockedCount;
    if (mixCount <= 0) return valid.slice();
    var counts = v2fbAllocate(mixCount, weights, pools, weights.campaign > 0 && !hasLockedCampaign, null);
    if (!counts) return null;
    var seed = v2fbSeedBase('mode', mode);
    var sequence = v2fbSequence(counts, mixCount, seed);
    if (sequence.length !== mixCount) return null;
    var out = v2fbFillSlots(slots, sequence, pools, seed, null, false);
    if (!out || out.length !== desired) return null;
    return out;
  } catch (error) {
    v2fbSoftError(error);
    return null;
  }
}
function v2fbMixPracticeQuestions(areaId, qids) {
  try {
    if (!areaId || !Array.isArray(qids) || !qids.length) return null;
    if (v2fbOnlyOriginalBank()) {
      var campaignPracticeIds = v2fbCampaignOnlyIds(qids);
      return campaignPracticeIds.length ? campaignPracticeIds : null;
    }
    var valid = [];
    var allowed = {};
    var caps = { campaign: 0, dashboard: 0, flashcards: 0 };
    for (var i = 0; i < qids.length; i++) {
      var question = v2fbQuestion(qids[i]);
      if (!question || question.areaId !== areaId) continue;
      valid.push(question);
      allowed[question.id] = true;
      var source = v2fbSourceOf(question);
      caps[source] = (caps[source] || 0) + 1;
    }
    if (!valid.length) return null;
    var desired = Math.min(10, valid.length);
    if (desired < 1) return null;
    var weights = v2fbNormalizeWeights(v2fbRawWeights());
    if (!weights) return null;
    var pools = v2fbPools();
    var slots = v2fbPracticeSlots(valid, desired);
    if (slots.length !== desired) return null;
    var counts = v2fbAllocate(desired, weights, pools, weights.campaign > 0, caps);
    if (!counts) return null;
    var seed = v2fbSeedBase('practice', areaId);
    var sequence = v2fbSequence(counts, desired, seed);
    if (sequence.length !== desired) return null;
    var out = v2fbFillSlots(slots, sequence, pools, seed, allowed, false);
    if (!out || out.length !== desired) return null;
    return out;
  } catch (error) {
    v2fbSoftError(error);
    return null;
  }
}

/* -------------------------------------------------------------------------
   Ajustes: pesos de las tres fuentes
   ------------------------------------------------------------------------- */
function v2fbModeButtonHTML(mode, title, hint, current) {
  var on = current === mode;
  return '<button type="button" class="v2-feedback-modeBtn' + (on ? ' is-active' : '') + '" data-action="v2-feedback-mode" data-mode="' + mode + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
    '<span class="v2-feedback-modeBtnTitle">' + v2fbEsc(title) + '</span>' +
    '<span class="v2-feedback-modeBtnHint">' + v2fbEsc(hint) + '</span>' +
  '</button>';
}
function v2fbSettingsHTML() {
  try {
    var pools = v2fbPools();
    var raw = v2fbRawWeights();
    var normalized = v2fbNormalizeWeights(raw);
    var percents = normalized ? v2fbDisplayPercents(normalized) : null;
    var rows = '';
    var bars = '';
    for (var i = 0; i < V2FB_KEYS.length; i++) {
      var key = V2FB_KEYS[i];
      var meta = V2FB_SOURCE_META[key];
      var count = (pools[key] || []).length;
      var percent = percents ? percents[key] : 0;
      rows += '<div class="v2-feedback-weight" style="--v2fb-chip:' + meta.color + '">' +
        '<div class="v2-feedback-weightLabel"><b>' + v2fbEsc(meta.label) + '</b><small>' + v2fbEsc(meta.hint) + '</small>' +
          '<em data-v2-weight-pool="' + key + '">' + (count === 1 ? '1 pregunta' : count + ' preguntas') + '</em></div>' +
        '<input type="range" min="0" max="100" step="5" value="' + Math.round(raw[key] * 100) + '" data-v2-weight="' + key + '" aria-label="Peso de ' + v2fbEsc(meta.label) + '" />' +
        '<output class="v2-feedback-weightPct" data-v2-weight-pct="' + key + '">' + (percents ? percent + ' %' : '—') + '</output>' +
      '</div>';
      bars += '<i data-v2-weight-bar="' + key + '" style="width:' + (percents ? percent : 0) + '%;background:' + meta.color + '"></i>';
    }
    var mode = v2fbFeedbackMode();
    return '<section class="panel settingsPanel settingsPanel--wide v2-feedback-settings" data-v2-feedback-settings>' +
      '<span class="eyebrow noRule">Mezcla de fuentes</span>' +
      '<h3>De dónde salen tus preguntas</h3>' +
      '<p class="settingsHelp">Las misiones, los modos y la práctica reparten sus preguntas entre las tres fuentes con estos pesos. Al iniciar la sesión se normalizan a 100 %; si una fuente no tiene preguntas, su parte se reparte entre las demás. El Desafío diario conserva su pregunta de repaso.</p>' +
      '<div class="v2-feedback-weights">' + rows + '</div>' +
      '<div class="v2-feedback-weightBar" aria-hidden="true">' + bars + '</div>' +
      '<div class="v2-feedback-weightFoot"><span>Mezcla normalizada</span><b data-v2-weight-total>' + (percents ? '100 %' : 'sin mezcla') + '</b>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-action="v2-weights-reset">Restablecer 60 / 15 / 25</button></div>' +
      '<p class="settingsHelp v2-feedback-weightsNote">Solo cambia la procedencia de las preguntas. XP, monedas, repaso espaciado y el tope diario de 120 monedas no se tocan. El cambio se aplica a la próxima sesión; una sesión en curso mantiene sus preguntas.</p>' +
    '</section>' +
    '<section class="panel settingsPanel settingsPanel--wide v2-feedback-modeSettings" data-v2-feedback-mode-settings>' +
      '<span class="eyebrow noRule">Feedback de respuesta</span>' +
      '<h3>Cuándo quieres ver la corrección</h3>' +
      '<p class="settingsHelp">Después de cada respuesta la clave se aprende mejor en el resumen final. Elige si quieres la explicación completa entre preguntas o solo al cerrar el nivel. En los dos modos se conserva el ataque del héroe o del guardián, el sonido y la clave al final del Simulacro.</p>' +
      '<div class="v2-feedback-modeOptions" role="group" aria-label="Momento del feedback">' +
        v2fbModeButtonHTML('end', 'Al final del nivel (por defecto)', 'Entre preguntas no se abre ninguna pantalla: ves el combate y un destello breve, y sigues en menos de un segundo.', mode) +
        v2fbModeButtonHTML('each', 'Tras cada pregunta', 'Abre la ficha de corrección después de cada respuesta y espera a que pulses Continuar. El reloj de la sesión se detiene mientras está abierta.', mode) +
      '</div>' +
      '<p class="settingsHelp v2-feedback-modeNote">En el resumen final, los fallos aparecen primero con tu respuesta, la clave y la explicación. Los errores siguen entrando al repaso espaciado con las mismas reglas; este ajuste no cambia recompensas, monedas ni el tope diario.</p>' +
    '</section>';
  } catch (error) {
    v2fbSoftError(error);
    return '';
  }
}
function v2fbSyncWeightUI() {
  var root = null;
  try { root = document.querySelector('[data-v2-feedback-settings]'); } catch (e) {}
  if (!root) return;
  var raw = v2fbRawWeights();
  var normalized = v2fbNormalizeWeights(raw);
  var percents = normalized ? v2fbDisplayPercents(normalized) : null;
  var pools = v2fbPools();
  for (var i = 0; i < V2FB_KEYS.length; i++) {
    var key = V2FB_KEYS[i];
    var pctEl = root.querySelector('[data-v2-weight-pct="' + key + '"]');
    if (pctEl) pctEl.textContent = percents ? percents[key] + ' %' : '—';
    var barEl = root.querySelector('[data-v2-weight-bar="' + key + '"]');
    if (barEl) barEl.style.width = (percents ? percents[key] : 0) + '%';
    var input = root.querySelector('[data-v2-weight="' + key + '"]');
    if (input && document.activeElement !== input) input.value = String(Math.round(raw[key] * 100));
    var poolEl = root.querySelector('[data-v2-weight-pool="' + key + '"]');
    if (poolEl) {
      var count = (pools[key] || []).length;
      poolEl.textContent = count === 1 ? '1 pregunta' : count + ' preguntas';
    }
  }
  var totalEl = root.querySelector('[data-v2-weight-total]');
  if (totalEl) totalEl.textContent = percents ? '100 %' : 'sin mezcla';
}
function v2fbResetWeights() {
  v2fbStoreWeights(V2FB_DEFAULT_WEIGHTS);
  v2fbFlushPersist();
  v2fbSyncWeightUI();
  v2fbToast('Mezcla de fuentes restablecida: 60 / 15 / 25.', 'success', 2000);
  v2fbEmit('weights:reset', V2FB_DEFAULT_WEIGHTS);
}
function v2fbSyncModeUI() {
  var root = null;
  try { root = document.querySelector('[data-v2-feedback-mode-settings]'); } catch (e) {}
  if (!root) return;
  var current = v2fbFeedbackMode();
  var buttons = [];
  try { buttons = root.querySelectorAll('[data-action="v2-feedback-mode"]'); } catch (e) {}
  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    if (!button) continue;
    var on = button.getAttribute('data-mode') === current;
    if (on) button.classList.add('is-active');
    else button.classList.remove('is-active');
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}
function v2fbSetFeedbackMode(mode) {
  var next = mode === 'each' ? 'each' : 'end';
  var previous = v2fbFeedbackMode();
  try {
    if (typeof state !== 'undefined' && state) {
      state.settings = state.settings || {};
      state.settings.feedbackMode = next;
    }
  } catch (e) {}
  v2fbFlushPersist();
  v2fbSyncModeUI();
  if (next === 'end' && v2fbState.open) v2fbHide(false);
  v2fbToast(next === 'end'
    ? 'Feedback al final del nivel: entre preguntas solo el combate y el destello.'
    : 'Feedback tras cada pregunta: se abrirá la ficha de corrección completa.', 'success', 2800);
  v2fbEmit('mode', { from: previous, to: next });
  return next;
}
function v2fbMountSettings() {
  v2fbInstall();
  var addedDefaults = false;
  try {
    if (typeof state !== 'undefined' && state && state.settings && !state.settings.sourceWeights) {
      state.settings.sourceWeights = {
        campaign: V2FB_DEFAULT_WEIGHTS.campaign,
        dashboard: V2FB_DEFAULT_WEIGHTS.dashboard,
        flashcards: V2FB_DEFAULT_WEIGHTS.flashcards
      };
      addedDefaults = true;
    }
  } catch (e) {}
  if (addedDefaults) v2fbSaveSettingsNow();
  v2fbSyncWeightUI();
  v2fbSyncModeUI();
  return true;
}

/* -------------------------------------------------------------------------
   Contenido del feedback
   ------------------------------------------------------------------------- */
function v2fbExplanationPayload(question) {
  var raw = question && question.explanation ? String(question.explanation).replace(/\s+/g, ' ').trim() : '';
  var keyOption = question ? v2fbOption(question, question.answer) : null;
  var keyText = keyOption ? keyOption.text : '';
  if (raw) {
    return {
      text: v2fbTruncate(raw, 300),
      full: raw,
      brief: !!question.explanationGenerated,
      missing: false
    };
  }
  var generated = 'La clave es ' + ((question && question.answer) || '—');
  if (keyText) generated += ': «' + keyText + '»';
  generated += '. Vuelve al enunciado y compara esa opción con las demás.';
  return { text: generated, full: generated, brief: true, missing: true };
}
function v2fbSentenceWith(text, tokens) {
  if (!text || !tokens || !tokens.length) return '';
  var sentences = String(text).match(/[^.!?]+[.!?]*/g) || [String(text)];
  for (var i = 0; i < sentences.length; i++) {
    var normalized = v2fbNorm(sentences[i]);
    for (var j = 0; j < tokens.length; j++) {
      if (normalized.indexOf(tokens[j]) !== -1) return sentences[i].replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}
function v2fbWhy(question, chosenOption, keyOption) {
  var chosenId = chosenOption ? chosenOption.id : '';
  var chosenText = chosenOption ? chosenOption.text : '';
  var keyId = question ? question.answer : '';
  var keyText = keyOption ? keyOption.text : '';
  var chosenLabel = 'Elegiste ' + chosenId + (chosenText ? ' («' + v2fbTruncate(chosenText, 90) + '»)' : '') + '.';
  var full = question && question.explanation ? String(question.explanation).replace(/\s+/g, ' ').trim() : '';
  if (full) {
    var keyTokens = v2fbTokens(keyText);
    var chosenTokens = v2fbTokens(chosenText);
    var distinct = [];
    for (var i = 0; i < chosenTokens.length; i++) {
      if (keyTokens.indexOf(chosenTokens[i]) === -1) distinct.push(chosenTokens[i]);
    }
    var sentence = v2fbSentenceWith(full, distinct);
    if (sentence) {
      return chosenLabel + ' La explicación alude a esa opción: «' + v2fbTruncate(sentence, 190) + '».';
    }
    return chosenLabel + ' La explicación se centra en la clave ' + keyId +
      (keyText ? ' («' + v2fbTruncate(keyText, 90) + '»)' : '') + '; revisa la diferencia con la opción elegida.';
  }
  return 'La clave es ' + keyId + (keyText ? ' («' + v2fbTruncate(keyText, 90) + '»)' : '') +
    '; revisa la diferencia con la opción elegida.';
}
function v2fbSourceRefs(question) {
  var refs = question && question.sourceRefs;
  if (!Array.isArray(refs) || !refs.length) return '';
  var out = [];
  for (var i = 0; i < refs.length; i++) {
    var ref = refs[i];
    if (!ref) continue;
    var label = ref.sourceId ? String(ref.sourceId) : 'referencia';
    if (Array.isArray(ref.pages) && ref.pages.length) label += ' · págs. ' + ref.pages.join(', ');
    else if (ref.pages != null && ref.pages !== '') label += ' · p. ' + ref.pages;
    out.push(label);
  }
  return out.join(' · ');
}
function v2fbMetaHTML(question) {
  var html = '<div class="v2-feedback__meta">';
  var area = v2fbArea(question);
  if (area) {
    html += '<span class="v2-feedback__chip" style="--v2fb-chip:' + v2fbEsc(area.accent || '#7aa2ff') + '"><i></i>' + v2fbEsc(area.short) + '</span>';
  }
  html += '<span class="v2-feedback__chip">' + v2fbEsc(v2fbSourceLabel(question)) + '</span>';
  if (question && question.difficulty) {
    html += '<span class="v2-feedback__chip">Dificultad ' + v2fbEsc(V2FB_DIFFICULTY_LABELS[question.difficulty] || question.difficulty) + '</span>';
  }
  if (question && question.page != null && question.page !== '') {
    html += '<span class="v2-feedback__chip">p. ' + v2fbEsc(question.page) + '</span>';
  }
  html += '</div>';
  var origin = (question && (question.examTitle || question.origin)) || '';
  if (origin) {
    html += '<p class="v2-feedback__source">' + v2fbEsc(origin) + (question && question.cycle ? ' · ' + v2fbEsc(question.cycle) : '') + '</p>';
  }
  return html;
}
function v2fbVerdict(kind) {
  if (kind === 'correct') {
    return {
      eyebrow: 'Veredicto',
      title: 'Correcto',
      subtitle: 'La clave coincide con tu respuesta. Puedes seguir cuando quieras.',
      icon: 'checkCircle'
    };
  }
  if (kind === 'timeout') {
    return {
      eyebrow: 'Veredicto',
      title: 'Tiempo agotado',
      subtitle: 'El tiempo terminó antes de responder. La pregunta vuelve al repaso.',
      icon: 'clock'
    };
  }
  return {
    eyebrow: 'Veredicto',
    title: 'Todavía no',
    subtitle: 'La clave está abajo. Revisar la diferencia ya es parte del repaso.',
    icon: 'compass'
  };
}
function v2fbFeedbackHTML(question, feedback, ses, sealed) {
  var kind = v2fbKind(feedback);
  var verdict = v2fbVerdict(kind);
  if (sealed) {
    if (kind === 'correct') verdict.subtitle = 'La respuesta quedó registrada. La clave y la explicación se verán en el informe final.';
    else if (kind === 'timeout') verdict.subtitle = 'El tiempo terminó antes de responder. La clave se verá en el informe final.';
    else verdict.subtitle = 'La clave y la explicación de este duelo se verán en el informe final.';
  }
  var accent = kind === 'correct' ? '#69d3c1' : (kind === 'timeout' ? '#7aa2ff' : '#f3b562');
  var keyOption = v2fbOption(question, question.answer);
  var keyText = keyOption ? keyOption.text : (feedback && feedback.answerText ? feedback.answerText : '');
  var chosenOption = feedback && feedback.chosen ? v2fbOption(question, feedback.chosen) : null;
  var explanation = v2fbExplanationPayload(question);
  var isDifficult = v2fbIsDifficult(question.id);
  var sessionLabel = v2fbSessionLabel(ses);
  if (ses && typeof ses.cursor === 'number' && ses.questions && ses.questions.length) {
    sessionLabel += ' · ' + (ses.cursor + 1) + '/' + ses.questions.length;
  }
  var html = '';
  html += '<div class="v2-feedback__panel" data-v2fb-panel style="--v2fb-accent:' + accent + '">';
  html += '<div class="v2-feedback__head">' +
    '<span class="v2-feedback__kicker"><span class="v2-feedback__kickerDot"></span>Retroalimentación · ' + v2fbEsc(sessionLabel) + '</span>' +
    '<button type="button" class="v2-feedback__close" data-action="v2-feedback-hide" aria-label="Cerrar el feedback">' + v2fbIcon('close', 16) + '</button>' +
  '</div>';
  html += '<div class="v2-feedback__body">';
  html += '<div class="v2-feedback__verdict">' +
    '<span class="v2-feedback__verdictIcon" aria-hidden="true">' + v2fbIcon(verdict.icon, 22) + '</span>' +
    '<div class="v2-feedback__verdictCopy"><span class="v2-feedback__eyebrow">' + v2fbEsc(verdict.eyebrow) + '</span>' +
      '<h2 class="v2-feedback__title" id="v2-feedback-title">' + v2fbEsc(verdict.title) + '</h2>' +
      '<p class="v2-feedback__subtitle">' + v2fbEsc(verdict.subtitle) + '</p></div>' +
  '</div>';
  if (question.stem) {
    html += '<p class="v2-feedback__stem">' + v2fbEsc(v2fbTruncate(question.stem, 240)) + '</p>';
  }
  if (sealed) {
    html += '<div class="v2-feedback__sealed">' + v2fbIcon('lock', 16) +
      '<div><b>La clave se reserva para el informe final.</b><span>Este duelo mantiene la clave y la explicación selladas hasta el cierre, como en el registro del guardián.</span></div></div>';
  } else {
    html += '<div class="v2-feedback__key"><span class="v2-feedback__keyLabel">Respuesta correcta</span>' +
      '<div class="v2-feedback__keyRow"><span class="v2-feedback__letter">' + v2fbEsc(question.answer) + '</span>' +
      '<span class="v2-feedback__keyText">' + v2fbEsc(keyText) + '</span></div></div>';
    var explanationBlock = '<div class="v2-feedback__block v2-feedback__block--explain">' +
      '<div class="v2-feedback__blockHead"><span class="v2-feedback__blockTitle">Explicación</span>' +
      (explanation.brief ? '<span class="v2-feedback__tag">Explicación breve</span>' : '') + '</div>' +
      '<p class="v2-feedback__text">' + v2fbEsc(explanation.text) + '</p>' +
      (explanation.missing ? '<p class="v2-feedback__note">No hay una explicación registrada para esta pregunta: la frase anterior solo ordena la clave y el enunciado, sin añadir datos.</p>' : '') +
    '</div>';
    if (kind === 'wrong' && chosenOption) {
      var why = v2fbWhy(question, chosenOption, keyOption);
      html += '<div class="v2-feedback__details">' + explanationBlock +
        '<div class="v2-feedback__block v2-feedback__block--why">' +
          '<div class="v2-feedback__blockHead"><span class="v2-feedback__blockTitle">Por qué no encaja tu opción</span></div>' +
          '<div class="v2-feedback__compare">' +
            '<div class="v2-feedback__compareRow is-chosen"><span class="v2-feedback__compareKey">Elegiste · ' + v2fbEsc(chosenOption.id) + '</span><span>' + v2fbEsc(chosenOption.text) + '</span></div>' +
            '<div class="v2-feedback__compareRow is-key"><span class="v2-feedback__compareKey">Clave · ' + v2fbEsc(question.answer) + '</span><span>' + v2fbEsc(keyText) + '</span></div>' +
          '</div>' +
          '<p class="v2-feedback__text">' + v2fbEsc(why) + '</p>' +
        '</div>' +
      '</div>';
    } else {
      html += explanationBlock;
    }
  }
  html += v2fbMetaHTML(question);
  html += '</div>';
  html += '<div class="v2-feedback__actions">' +
    '<button type="button" class="btn btn--primary v2-feedback__continue" data-action="v2-feedback-continue">Continuar ' + v2fbIcon('chevronRight', 13) + '</button>' +
    '<button type="button" class="btn btn--ghost v2-feedback__action' + (isDifficult ? ' is-on' : '') + '" data-action="v2-feedback-difficult" aria-pressed="' + (isDifficult ? 'true' : 'false') + '">' +
      v2fbIcon('flag', 13) + ' <span data-v2fb-difficult-label>' + (isDifficult ? 'Marcada como difícil' : 'Marcar como difícil') + '</span></button>' +
    (sealed ? '' : '<button type="button" class="btn btn--ghost v2-feedback__action" data-action="v2-feedback-flashcard">' + v2fbIcon('bookOpen', 13) + ' Ver en flashcard</button>') +
  '</div>';
  html += '<p class="v2-feedback__hint"><kbd>Enter</kbd> o <kbd>Espacio</kbd> para continuar · <kbd>Esc</kbd> cierra</p>';
  html += '</div>';
  return html;
}
function v2fbFlashcardSourceHTML(question) {
  var rows = '';
  function addRow(label, value, code) {
    if (value == null || value === '') return;
    rows += '<div class="v2-flashcard__sourceRow"><span>' + v2fbEsc(label) + '</span><b' + (code ? ' class="is-code"' : '') + '>' + v2fbEsc(value) + '</b></div>';
  }
  addRow('Fuente', v2fbSourceLabel(question), false);
  addRow('Origen', question.origin, false);
  addRow('Examen', question.examTitle, false);
  addRow('Ciclo', question.cycle, false);
  addRow('Página', question.page, false);
  addRow('Flashcard', question.flashcardId, true);
  addRow('Hoja', question.sheetId, true);
  addRow('Referencias', v2fbSourceRefs(question), true);
  return rows;
}
function v2fbFlashcardHTML(question) {
  var keyOption = v2fbOption(question, question.answer);
  var keyText = keyOption ? keyOption.text : '';
  var full = question.explanation ? String(question.explanation).replace(/\s+/g, ' ').trim() : '';
  var explanation = full || v2fbExplanationPayload(question).text;
  var options = '';
  var i;
  if (question.options && question.options.length) {
    for (i = 0; i < question.options.length; i++) {
      var option = question.options[i];
      var isKey = String(option.id) === String(question.answer);
      options += '<li class="v2-flashcard__option' + (isKey ? ' is-key' : '') + '"><span class="v2-flashcard__optionKey">' + v2fbEsc(option.id) + '</span><span>' + v2fbEsc(option.text) + '</span></li>';
    }
    options = '<ul class="v2-flashcard__options">' + options + '</ul>';
  }
  var tags = '';
  if (question.tags && question.tags.length) {
    tags = '<div class="v2-flashcard__tags">';
    for (i = 0; i < question.tags.length && i < 8; i++) {
      tags += '<span class="v2-flashcard__tag">' + v2fbEsc(question.tags[i]) + '</span>';
    }
    tags += '</div>';
  }
  return '<div class="v2-flashcard__panel" data-v2fb-flashcard-panel>' +
    '<div class="v2-flashcard__head"><div><span class="v2-flashcard__eyebrow">Flashcard local</span><h2 class="v2-flashcard__title" id="v2-flashcard-title">Ficha de estudio</h2></div>' +
      '<button type="button" class="v2-flashcard__close" data-action="v2-flashcard-close" aria-label="Cerrar la flashcard">' + v2fbIcon('close', 16) + '</button></div>' +
    '<div class="v2-flashcard__body">' +
      '<p class="v2-flashcard__stem">' + v2fbEsc(question.stem) + '</p>' +
      '<div class="v2-flashcard__key"><span class="v2-flashcard__keyLabel">Clave</span><div class="v2-flashcard__keyRow"><span class="v2-flashcard__letter">' + v2fbEsc(question.answer) + '</span><b>' + v2fbEsc(keyText) + '</b></div></div>' +
      options +
      '<div class="v2-flashcard__block"><span class="v2-flashcard__blockTitle">Explicación</span><p>' + v2fbEsc(explanation) + '</p></div>' +
      '<div class="v2-flashcard__block"><span class="v2-flashcard__blockTitle">Fuente</span><div class="v2-flashcard__sourceGrid">' + v2fbFlashcardSourceHTML(question) + '</div></div>' +
      tags +
    '</div>' +
    '<div class="v2-flashcard__foot"><span>Contenido local · sin conexión</span><button type="button" class="btn btn--ghost btn--sm" data-action="v2-flashcard-close">Volver al feedback</button></div>' +
  '</div>';
}

/* -------------------------------------------------------------------------
   Estado de la marca «difícil» (sin duplicar el repaso espaciado)
   ------------------------------------------------------------------------- */
function v2fbIsDifficult(questionId) {
  try {
    if (typeof questionTag === 'function') return !!questionTag(questionId).difficult;
  } catch (e) {}
  try {
    return !!(state && state.questionTags && state.questionTags[questionId] && state.questionTags[questionId].difficult);
  } catch (e) {}
  return false;
}
function v2fbSetDifficult(questionId, on) {
  if (typeof toggleQuestionTag === 'function') {
    toggleQuestionTag(questionId, 'difficult');
    return;
  }
  try {
    if (typeof state === 'undefined' || !state) return;
    state.questionTags = state.questionTags || {};
    var tag = state.questionTags[questionId] || { difficult: false, favorite: false };
    tag.difficult = !!on;
    tag.updatedAt = typeof nowISO === 'function' ? nowISO() : new Date().toISOString();
    if (!tag.difficult && !tag.favorite) delete state.questionTags[questionId];
    else state.questionTags[questionId] = tag;
    if (typeof persist === 'function') persist();
  } catch (e) {}
}
function v2fbSyncDifficultButton() {
  if (!v2fbState.root || !v2fbState.q) return;
  var button = null;
  try { button = v2fbState.root.querySelector('[data-action="v2-feedback-difficult"]'); } catch (e) {}
  if (!button) return;
  var on = v2fbIsDifficult(v2fbState.q.id);
  if (on) button.classList.add('is-on');
  else button.classList.remove('is-on');
  button.setAttribute('aria-pressed', on ? 'true' : 'false');
  var label = button.querySelector('[data-v2fb-difficult-label]');
  if (label) label.textContent = on ? 'Marcada como difícil' : 'Marcar como difícil';
}
function v2fbToggleDifficult() {
  if (!v2fbState.open || !v2fbState.q) return false;
  var was = v2fbIsDifficult(v2fbState.q.id);
  try { v2fbSetDifficult(v2fbState.q.id, !was); } catch (error) { v2fbSoftError(error); }
  var now = v2fbIsDifficult(v2fbState.q.id);
  v2fbSyncDifficultButton();
  v2fbEmit('difficult', { questionId: v2fbState.q.id, difficult: now });
  return now;
}

/* -------------------------------------------------------------------------
   Reloj: el overlay no consume tiempo de sesión ni de pregunta
   ------------------------------------------------------------------------- */
function v2fbPauseClock(ses) {
  v2fbResumeClock();
  v2fbState.clockSession = ses || null;
  v2fbState.clockPausedAt = Date.now();
  v2fbState.clockPaused = !!(ses && (ses.endsAt || ses.questionEndsAt));
}
function v2fbResumeClock() {
  if (!v2fbState.clockPaused || !v2fbState.clockSession) {
    v2fbState.clockPaused = false;
    v2fbState.clockSession = null;
    v2fbState.clockPausedAt = 0;
    return 0;
  }
  var ses = v2fbState.clockSession;
  var delta = Math.max(0, Date.now() - (v2fbState.clockPausedAt || Date.now()));
  var shifted = 0;
  if (ses && delta > 0) {
    if (ses.endsAt) {
      var endsAt = Date.parse(ses.endsAt);
      if (!isNaN(endsAt)) {
        ses.endsAt = new Date(endsAt + delta).toISOString();
        shifted = delta;
      }
    }
    if (ses.questionEndsAt) {
      var questionEnds = Date.parse(ses.questionEndsAt);
      if (!isNaN(questionEnds)) {
        ses.questionEndsAt = new Date(questionEnds + delta).toISOString();
        shifted = delta;
      }
    }
    if (ses.startedAt) {
      var startedAt = Date.parse(ses.startedAt);
      if (!isNaN(startedAt)) {
        ses.startedAt = new Date(startedAt + delta).toISOString();
        shifted = delta;
      }
    }
  }
  v2fbState.clockPaused = false;
  v2fbState.clockSession = null;
  v2fbState.clockPausedAt = 0;
  if (shifted > 0) v2fbEmit('clock:resumed', { ms: shifted });
  return delta;
}

/* -------------------------------------------------------------------------
   Overlay: apertura, cierre y foco
   ------------------------------------------------------------------------- */
function v2fbIsOpen() {
  return !!(v2fbState.open && v2fbState.root);
}
function v2fbRemoveRoot() {
  if (v2fbState.exitTimer) {
    try { window.clearTimeout(v2fbState.exitTimer); } catch (e) {}
    v2fbState.exitTimer = 0;
  }
  v2fbState.exitAt = 0;
  var root = v2fbState.root;
  v2fbState.root = null;
  v2fbState.flashRoot = null;
  if (root && root.parentNode) {
    try { root.parentNode.removeChild(root); } catch (e) {}
  }
}
function v2fbTeardown() {
  v2fbResumeClock();
  v2fbCloseFlashcard(false);
  v2fbRemoveRoot();
  v2fbClearAnswerFlash();
  v2fbClearInlineWindow();
  v2fbState.open = false;
  v2fbState.q = null;
  v2fbState.feedback = null;
  v2fbState.session = null;
  v2fbState.sealed = false;
  v2fbState.kind = '';
  v2fbState.returnFocus = null;
}

/* -------------------------------------------------------------------------
   Señal no bloqueante del modo «al final del nivel»
   La pantalla no se abre: el combate ya golpea y el sonido ya suena. Aquí
   solo se marca durante ~720 ms la alternativa elegida (y la clave cuando
   es visible) con un destello que no mueve el diseño ni captura el foco.
   ------------------------------------------------------------------------- */
function v2fbClearAnswerFlash() {
  if (v2fbState.flashTimer) {
    try { window.clearTimeout(v2fbState.flashTimer); } catch (e) {}
    v2fbState.flashTimer = 0;
  }
  var nodes = [];
  try { nodes = document.querySelectorAll('.answerBtn.v2-fb-flash'); } catch (e) { nodes = []; }
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (!node || !node.classList) continue;
    node.classList.remove('v2-fb-flash', 'v2-fb-flash--good', 'v2-fb-flash--bad', 'v2-fb-flash--key', 'v2-fb-flash--quiet');
  }
}
/* La ventana del avance automático se comporta como el overlay a efectos de
   pausa: si el jugador pulsa Esc/P justo después de responder, no se abre una
   pausa que dejaría la pregunta sin botón visible al volver. Se libera sola en
   cuanto nextQuestion() limpia lastFeedback o vence el plazo. */
function v2fbClearInlineWindow() {
  if (v2fbState.inlineTimer) {
    try { window.clearTimeout(v2fbState.inlineTimer); } catch (e) {}
    v2fbState.inlineTimer = 0;
  }
  v2fbState.inlineUntil = 0;
}
function v2fbInlinePending() {
  if (!v2fbState.inlineUntil) return false;
  if (v2fbState.inlineUntil <= Date.now()) {
    v2fbClearInlineWindow();
    return false;
  }
  try {
    if (typeof lastFeedback !== 'undefined' && !lastFeedback) {
      v2fbClearInlineWindow();
      return false;
    }
  } catch (e) {}
  return true;
}
function v2fbMarkInlineWindow() {
  v2fbState.inlineUntil = Date.now() + V2FB_AUTO_ADVANCE_MS + 50;
  if (v2fbState.inlineTimer) {
    try { window.clearTimeout(v2fbState.inlineTimer); } catch (e) {}
  }
  v2fbState.inlineTimer = window.setTimeout(function () {
    v2fbState.inlineTimer = 0;
    v2fbState.inlineUntil = 0;
  }, V2FB_AUTO_ADVANCE_MS + 70);
}
function v2fbFlashAnswer(question, feedback, ses) {
  try {
    if (!question || !feedback) return false;
    if (typeof document === 'undefined' || !document.querySelector) return false;
    var answers = document.querySelector('.duelPanel .answers');
    if (!answers || !answers.querySelectorAll) return false;
    v2fbClearAnswerFlash();
    var sealed = !!(ses && ses.mode === 'boss');
    var deferred = !!(ses && ses.deferred) || !!feedback.deferred;
    var chosen = feedback.chosen == null ? '' : String(feedback.chosen);
    var key = question.answer == null ? '' : String(question.answer);
    var buttons = answers.querySelectorAll('.answerBtn[data-letter]');
    if (!buttons || !buttons.length) return false;
    var marked = [];
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      if (!button || !button.classList) continue;
      var letter = String(button.getAttribute('data-letter') || '');
      if (!letter) continue;
      if (chosen && letter === chosen) {
        button.classList.add('v2-fb-flash');
        if (deferred) button.classList.add('v2-fb-flash--quiet');
        else button.classList.add(feedback.correct ? 'v2-fb-flash--good' : 'v2-fb-flash--bad');
        marked.push(button);
      }
      if (!deferred && !sealed && key && letter === key && letter !== chosen) {
        button.classList.add('v2-fb-flash', 'v2-fb-flash--key');
        marked.push(button);
      }
    }
    if (!marked.length) return false;
    v2fbState.flashTimer = window.setTimeout(function () {
      v2fbState.flashTimer = 0;
      for (var j = 0; j < marked.length; j++) {
        var el = marked[j];
        if (!el || !el.classList) continue;
        el.classList.remove('v2-fb-flash', 'v2-fb-flash--good', 'v2-fb-flash--bad', 'v2-fb-flash--key', 'v2-fb-flash--quiet');
      }
    }, V2FB_FLASH_MS);
    return true;
  } catch (error) {
    v2fbSoftError(error);
    return false;
  }
}
function v2fbOnAnswer(question, feedback, sessionArg) {
  try {
    v2fbInstall();
    if (!question || !feedback) return false;
    var ses = sessionArg || v2fbCurrentSession();
    if ((ses && ses.deferred) || feedback.deferred) {
      if (v2fbState.open) v2fbHide(false);
      /* En Simulacro la clave sigue reservada, pero el destello neutro de la
         opción elegida mantiene la señal del modo «al final del nivel». */
      if (v2fbIsEndMode()) {
        v2fbFlashAnswer(question, feedback, ses);
        v2fbMarkInlineWindow();
      }
      return false;
    }
    if (v2fbIsEndMode()) {
      if (v2fbState.open) v2fbHide(false);
      v2fbFlashAnswer(question, feedback, ses);
      v2fbMarkInlineWindow();
      v2fbEmit('inline', {
        questionId: question.id,
        kind: v2fbKind(feedback),
        mode: ses ? ses.mode : null
      });
      return false;
    }
    if (typeof document === 'undefined' || !document.body) return false;
    v2fbTeardown();
    var sealed = !!(ses && ses.mode === 'boss');
    var html = v2fbFeedbackHTML(question, feedback, ses, sealed);
    if (!html) return false;
    var root = document.createElement('div');
    root.className = 'v2-feedback';
    root.setAttribute('data-kind', v2fbKind(feedback));
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'v2-feedback-title');
    root.setAttribute('data-v2-feedback', 'overlay');
    if (v2fbReducedMotion()) root.className += ' is-instant';
    try {
      if (typeof V2 !== 'undefined' && V2 && typeof V2.quality === 'function' && V2.quality() === 'bajo') {
        root.className += ' is-low';
      }
    } catch (e) {}
    root.innerHTML = html;
    document.body.appendChild(root);
    v2fbState.root = root;
    v2fbState.open = true;
    v2fbState.q = question;
    v2fbState.feedback = feedback;
    v2fbState.session = ses;
    v2fbState.sealed = sealed;
    v2fbState.kind = v2fbKind(feedback);
    v2fbState.returnFocus = document.activeElement || null;
    v2fbPauseClock(ses);
    v2fbFocusContinue();
    v2fbEmit('open', {
      questionId: question.id,
      kind: v2fbState.kind,
      mode: ses ? ses.mode : null,
      sealed: sealed
    });
    return true;
  } catch (error) {
    v2fbSoftError(error);
    return false;
  }
}
function v2fbFocusContinue() {
  if (!v2fbState.root) return;
  var button = null;
  try { button = v2fbState.root.querySelector('[data-action="v2-feedback-continue"]'); } catch (e) {}
  if (!button) return;
  window.setTimeout(function () {
    if (!v2fbState.open || !v2fbState.root || v2fbState.flashRoot) return;
    try {
      if (document.contains && !document.contains(button)) return;
      button.focus({ preventScroll: true });
    } catch (e) {
      try { button.focus(); } catch (e2) {}
    }
  }, 40);
}
function v2fbHide(restoreFocus) {
  var had = !!v2fbState.open;
  if (!had) return !!(v2fbState.root);
  v2fbCloseFlashcard(false);
  v2fbResumeClock();
  v2fbState.open = false;
  var root = v2fbState.root;
  if (root) {
    if (v2fbReducedMotion()) {
      v2fbRemoveRoot();
    } else {
      root.classList.add('is-leaving');
      v2fbState.exitAt = Date.now() + 240;
      v2fbState.exitTimer = window.setTimeout(function () {
        v2fbState.exitTimer = 0;
        v2fbRemoveRoot();
      }, 280);
    }
  }
  if (restoreFocus && v2fbState.returnFocus) {
    var target = v2fbState.returnFocus;
    window.setTimeout(function () {
      try {
        if (!target || !target.focus) return;
        if (document.contains && !document.contains(target)) return;
        target.focus();
      } catch (e) {}
    }, 0);
  }
  v2fbState.returnFocus = null;
  v2fbEmit('close', { kind: v2fbState.kind, mode: v2fbState.session ? v2fbState.session.mode : null });
  return true;
}
function v2fbUpdate(dt, time) {
  if (!v2fbState.root) return;
  if (!v2fbState.open && v2fbState.exitAt && Date.now() >= v2fbState.exitAt) v2fbRemoveRoot();
}
function v2fbOpenFlashcard() {
  if (!v2fbState.open || !v2fbState.root || v2fbState.flashRoot) return false;
  var question = v2fbState.q;
  if (!question || v2fbState.sealed) return false;
  try {
    var layer = document.createElement('div');
    layer.className = 'v2-flashcard';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'v2-flashcard-title');
    layer.setAttribute('data-v2-flashcard', 'overlay');
    layer.innerHTML = v2fbFlashcardHTML(question);
    v2fbState.root.appendChild(layer);
    v2fbState.flashRoot = layer;
    v2fbState.flashReturnFocus = document.activeElement || null;
    var closeButton = null;
    try { closeButton = layer.querySelector('[data-action="v2-flashcard-close"]'); } catch (e) {}
    if (closeButton) {
      try { closeButton.focus(); } catch (e) {}
    }
    v2fbEmit('flashcard:open', { questionId: question.id });
    return true;
  } catch (error) {
    v2fbSoftError(error);
    return false;
  }
}
function v2fbCloseFlashcard(restoreFocus) {
  if (!v2fbState.flashRoot) return false;
  var layer = v2fbState.flashRoot;
  v2fbState.flashRoot = null;
  if (layer && layer.parentNode) {
    try { layer.parentNode.removeChild(layer); } catch (e) {}
  }
  var target = v2fbState.flashReturnFocus;
  v2fbState.flashReturnFocus = null;
  if (restoreFocus && target && target.focus) {
    try {
      if (!document.contains || document.contains(target)) target.focus();
    } catch (e) {}
  }
  v2fbEmit('flashcard:close');
  return true;
}
function v2fbContinue() {
  if (!v2fbState.open) return false;
  var now = Date.now();
  if (now - (v2fbState.lastContinueAt || 0) < 260) return false;
  v2fbState.lastContinueAt = now;
  var advanced = false;
  try {
    var feedback = v2fbCurrentFeedback();
    if (typeof nextQuestion === 'function' && feedback) {
      nextQuestion();
      advanced = true;
    }
  } catch (error) {
    v2fbSoftError(error);
  }
  if (v2fbState.open) v2fbHide(false);
  v2fbEmit('continue', { advanced: advanced });
  return advanced;
}

/* -------------------------------------------------------------------------
   Teclado y foco
   ------------------------------------------------------------------------- */
function v2fbClosestAction(node) {
  var current = node;
  while (current && current !== document) {
    if (current.getAttribute && current.getAttribute('data-action')) return current;
    current = current.parentNode;
  }
  return null;
}
function v2fbFocusable(scope) {
  var out = [];
  if (!scope || !scope.querySelectorAll) return out;
  var nodes = [];
  try {
    nodes = scope.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
  } catch (e) {
    nodes = [];
  }
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && !nodes[i].disabled) out.push(nodes[i]);
  }
  return out;
}
function v2fbMoveFocus(backwards) {
  var scope = v2fbState.flashRoot || v2fbState.root;
  var nodes = v2fbFocusable(scope);
  if (!nodes.length) return;
  var active = null;
  try { active = document.activeElement; } catch (e) {}
  var index = -1;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] === active) { index = i; break; }
  }
  var next;
  if (index === -1) next = backwards ? nodes.length - 1 : 0;
  else next = (index + (backwards ? -1 : 1) + nodes.length) % nodes.length;
  try { nodes[next].focus(); } catch (e) {}
}
function v2fbOnKeydown(event) {
  if (v2fbInlinePending()) {
    var pendingKey = event.key || '';
    var pendingCode = event.code || '';
    if (pendingKey === 'Escape' || pendingKey === 'Esc' || pendingCode === 'Escape' ||
        pendingKey === 'p' || pendingKey === 'P' || pendingCode === 'KeyP') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }
  if (!v2fbState.open || !v2fbState.root) return;
  var code = event.code || '';
  var key = event.key || '';
  var isEscape = code === 'Escape' || key === 'Escape' || key === 'Esc';
  if (isEscape) {
    event.preventDefault();
    event.stopPropagation();
    if (v2fbState.flashRoot) v2fbCloseFlashcard(true);
    else v2fbHide(true);
    return;
  }
  var isTab = code === 'Tab' || key === 'Tab';
  if (isTab) {
    event.preventDefault();
    event.stopPropagation();
    v2fbMoveFocus(!!event.shiftKey);
    return;
  }
  var isEnter = code === 'Enter' || code === 'NumpadEnter' || key === 'Enter';
  var isSpace = code === 'Space' || key === ' ' || key === 'Spacebar';
  if (isEnter || isSpace) {
    var actionEl = v2fbClosestAction(event.target);
    var action = actionEl ? actionEl.getAttribute('data-action') : '';
    if (v2fbState.flashRoot) {
      /* Dentro de la flashcard se deja actuar al botón enfocado; el juego no recibe la tecla. */
      event.stopPropagation();
      return;
    }
    if (action && action !== 'v2-feedback-continue') {
      /* Enter/Espacio activan el botón enfocado de forma nativa; el juego no recibe la tecla. */
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    v2fbContinue();
    return;
  }
  if (code.indexOf('Arrow') === 0 || code === 'KeyW' || code === 'KeyA' || code === 'KeyS' ||
      code === 'KeyD' || /^Digit[1-4]$/.test(code)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/* -------------------------------------------------------------------------
   Eventos
   ------------------------------------------------------------------------- */
function v2fbInstall() {
  if (v2fbState.installed) return;
  if (typeof document === 'undefined' || !document.addEventListener) return;
  v2fbState.installed = true;
  document.addEventListener('click', v2fbOnClick, true);
  document.addEventListener('input', v2fbOnInput, false);
  document.addEventListener('change', v2fbOnChange, false);
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('keydown', v2fbOnKeydown, true);
}
function v2fbOnClick(event) {
  var actionEl = v2fbClosestAction(event.target);
  if (!actionEl) return;
  var action = actionEl.getAttribute('data-action');
  if (action === 'open-pause' && v2fbInlinePending()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (!action || action.indexOf('v2-') !== 0) return;
  if (action !== 'v2-feedback-continue' && action !== 'v2-feedback-hide' &&
      action !== 'v2-feedback-difficult' && action !== 'v2-feedback-flashcard' &&
      action !== 'v2-flashcard-close' && action !== 'v2-weights-reset' &&
      action !== 'v2-feedback-mode') {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  v2fbInitAudio();
  switch (action) {
    case 'v2-feedback-continue':
      v2fbContinue();
      break;
    case 'v2-feedback-hide':
      v2fbHide(true);
      break;
    case 'v2-feedback-difficult':
      v2fbToggleDifficult();
      break;
    case 'v2-feedback-flashcard':
      v2fbOpenFlashcard();
      break;
    case 'v2-flashcard-close':
      v2fbCloseFlashcard(true);
      break;
    case 'v2-weights-reset':
      v2fbResetWeights();
      break;
    case 'v2-feedback-mode':
      v2fbSetFeedbackMode(actionEl.getAttribute('data-mode'));
      break;
  }
}
function v2fbOnInput(event) {
  var target = event.target;
  if (!target || !target.getAttribute) return;
  var key = target.getAttribute('data-v2-weight');
  if (!key || V2FB_KEYS.indexOf(key) === -1) return;
  var value = Number(target.value);
  if (!isFinite(value)) return;
  var raw = v2fbRawWeights();
  raw[key] = v2fbClamp(value / 100, 0, 1);
  v2fbStoreWeights(raw);
  v2fbSaveSettingsNow();
  v2fbSchedulePersist();
  v2fbSyncWeightUI();
  v2fbEmit('weights', { key: key, weights: raw });
}
function v2fbOnChange(event) {
  var target = event.target;
  if (!target || !target.getAttribute) return;
  if (!target.getAttribute('data-v2-weight')) return;
  v2fbFlushPersist();
  v2fbSyncWeightUI();
}

/* -------------------------------------------------------------------------
   API pública
   ------------------------------------------------------------------------- */
var v2fbAPI = {
  onAnswer: v2fbOnAnswer,
  hide: v2fbHide,
  isOpen: v2fbIsOpen,
  update: v2fbUpdate,
  settingsHTML: v2fbSettingsHTML,
  mountSettings: v2fbMountSettings,
  mixMissionQuestions: v2fbMixMissionQuestions,
  mixModeQuestions: v2fbMixModeQuestions,
  mixPracticeQuestions: v2fbMixPracticeQuestions,
  inlineEnabled: v2fbInlineEnabled,
  autoAdvanceDelay: v2fbAutoAdvanceDelay,
  feedbackMode: v2fbFeedbackMode,
  isEndMode: v2fbIsEndMode,
  setFeedbackMode: v2fbSetFeedbackMode
};

try {
  if (typeof V2 !== 'undefined' && V2) {
    if (typeof V2.register === 'function') V2.register('feedback', v2fbAPI);
    else V2.feedback = v2fbAPI;
  }
} catch (error) {
  v2fbSoftError(error);
}

try { v2fbInstall(); } catch (error) {
  v2fbSoftError(error);
}
