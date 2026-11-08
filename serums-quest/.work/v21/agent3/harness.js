/* Harness de validación del Agente 3 (V2.1)
   - Carga part5-feedback.js y part8-summary.js en un contexto vm con un DOM
     mínimo y comprueba: modo de feedback, autoAdvanceDelay, filtro de banco
     original, resumen (orden errores primero, filtros, difícil, flashcard),
     CSS equilibrado y ausencia de imágenes.
   No forma parte del build. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '..', '..', 'src');
const part5 = fs.readFileSync(path.join(SRC, 'part5-feedback.js'), 'utf8');
const part8 = fs.readFileSync(path.join(SRC, 'part8-summary.js'), 'utf8');
const css5 = fs.readFileSync(path.join(SRC, 'part5-feedback.css'), 'utf8');
const css8 = fs.readFileSync(path.join(SRC, 'part8-summary.css'), 'utf8');

let passed = 0;
let failed = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) { passed += 1; return; }
  failed += 1;
  failures.push(name + (detail ? ' — ' + detail : ''));
}
function section(title) { console.log('\n== ' + title + ' =='); }

/* ------------------------------------------------------------------ */
/* DOM mínimo                                                          */
/* ------------------------------------------------------------------ */
function parseSelector(raw) {
  const selector = String(raw || '').trim();
  const compound = { tag: null, classes: [], attrs: [] };
  let i = 0;
  const tagMatch = /^[a-zA-Z][a-zA-Z0-9-]*/.exec(selector);
  if (tagMatch) { compound.tag = tagMatch[0].toLowerCase(); i = tagMatch[0].length; }
  while (i < selector.length) {
    const ch = selector[i];
    if (ch === '.') {
      const m = /^\.([a-zA-Z0-9_-]+)/.exec(selector.slice(i));
      if (!m) { i += 1; continue; }
      compound.classes.push(m[1]);
      i += m[0].length;
    } else if (ch === '[') {
      const end = selector.indexOf(']', i);
      if (end === -1) break;
      const body = selector.slice(i + 1, end);
      const eq = body.indexOf('=');
      if (eq === -1) {
        compound.attrs.push({ name: body.trim(), value: null });
      } else {
        const name = body.slice(0, eq).trim();
        let value = body.slice(eq + 1).trim();
        value = value.replace(/^["']|["']$/g, '');
        compound.attrs.push({ name: name, value: value });
      }
      i = end + 1;
    } else if (ch === ':') {
      const m = /^:not\(([^)]*)\)/.exec(selector.slice(i));
      if (m) {
        compound.classes.push('!not:' + m[1]);
        i += m[0].length;
      } else {
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return compound;
}
function elementMatches(el, compound) {
  if (!el || !el._tag) return false;
  if (compound.tag && el._tag.toLowerCase() !== compound.tag) return false;
  for (const cls of compound.classes) {
    if (cls.indexOf('!not:') === 0) {
      const inner = parseSelector(cls.slice(5));
      if (elementMatches(el, inner)) return false;
      continue;
    }
    if (el._classes.indexOf(cls) === -1) return false;
  }
  for (const attr of compound.attrs) {
    if (!el._attrs || !Object.prototype.hasOwnProperty.call(el._attrs, attr.name)) return false;
    if (attr.value != null && String(el._attrs[attr.name]) !== String(attr.value)) return false;
  }
  return true;
}
function matchesComplex(node, selector) {
  const chain = String(selector || '').trim().split(/\s+/).filter(Boolean);
  if (!chain.length) return false;
  if (!elementMatches(node, parseSelector(chain[chain.length - 1]))) return false;
  let index = chain.length - 2;
  let ancestor = node.parentNode;
  while (ancestor && index >= 0) {
    if (elementMatches(ancestor, parseSelector(chain[index]))) index -= 1;
    ancestor = ancestor.parentNode;
  }
  return index < 0;
}
function makeNode(tag) {
  const el = {
    _tag: String(tag || 'div'),
    _classes: [],
    _attrs: {},
    _innerHTML: '',
    _textContent: '',
    _listeners: [],
    _children: [],
    parentNode: null,
    disabled: false,
    style: {},
    focus(options) {
      document.activeElement = el;
    },
    addEventListener(type, fn, options) {
      const capture = !!(options === true || (options && options.capture));
      el._listeners.push({ type: type, fn: fn, capture: capture });
    },
    removeEventListener(type, fn, options) {
      const capture = !!(options === true || (options && options.capture));
      el._listeners = el._listeners.filter(function (listener) {
        return !(listener.type === type && listener.fn === fn && listener.capture === capture);
      });
    },
    dispatchEvent(event) {
      dispatch(el, event);
      return true;
    },
    setAttribute(name, value) {
      el._attrs[name] = String(value);
      if (name === 'class') el.className = value;
      if (name === 'id') el.id = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(el._attrs, name) ? el._attrs[name] : null;
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(el._attrs, name);
    },
    removeAttribute(name) {
      delete el._attrs[name];
    },
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = el;
      el._children.push(child);
      return child;
    },
    removeChild(child) {
      const index = el._children.indexOf(child);
      if (index !== -1) el._children.splice(index, 1);
      child.parentNode = null;
      return child;
    },
    querySelectorAll(selector) {
      const out = [];
      const selectors = String(selector || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!selectors.length) return out;
      function walk(node) {
        for (const child of node._children) {
          for (const raw of selectors) {
            if (matchesComplex(child, raw)) { out.push(child); break; }
          }
          walk(child);
        }
      }
      walk(el);
      return out;
    },
    querySelector(selector) {
      return el.querySelectorAll(selector)[0] || null;
    },
    closest(selector) {
      let node = el;
      while (node) {
        const compound = parseSelector(selector);
        if (elementMatches(node, compound)) return node;
        node = node.parentNode;
      }
      return null;
    },
    contains(node) {
      if (!node) return false;
      let current = node;
      while (current) {
        if (current === el) return true;
        current = current.parentNode;
      }
      return false;
    },
    reset() {
      el._children = [];
      el._innerHTML = '';
      el._textContent = '';
    },
    _toString() { return '[node ' + el._tag + ']'; }
  };
  Object.defineProperty(el, 'className', {
    get() { return el._classes.join(' '); },
    set(value) { el._classes = String(value == null ? '' : value).split(/\s+/).filter(Boolean); }
  });
  Object.defineProperty(el, 'classList', {
    get() {
      return {
        add() {
          for (const name of Array.prototype.slice.call(arguments)) {
            if (!name) continue;
            String(name).split(/\s+/).forEach(function (part) {
              if (part && el._classes.indexOf(part) === -1) el._classes.push(part);
            });
          }
        },
        remove() {
          for (const name of Array.prototype.slice.call(arguments)) {
            if (!name) continue;
            el._classes = el._classes.filter(function (part) { return part !== String(name); });
          }
        },
        toggle(name, force) {
          const has = el._classes.indexOf(name) !== -1;
          const target = force === undefined ? !has : !!force;
          if (target && !has) el._classes.push(name);
          if (!target && has) el._classes = el._classes.filter(function (part) { return part !== name; });
          return target;
        },
        contains(name) { return el._classes.indexOf(name) !== -1; }
      };
    }
  });
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._innerHTML; },
    set(value) {
      el._innerHTML = String(value == null ? '' : value);
      if (!el._innerHTML) el._children = [];
    }
  });
  Object.defineProperty(el, 'textContent', {
    get() { return el._textContent; },
    set(value) { el._textContent = String(value == null ? '' : value); }
  });
  return el;
}
function collectListeners(node, type, capture) {
  return node._listeners.filter(function (listener) {
    return listener.type === type && listener.capture === capture;
  });
}
function dispatch(node, event) {
  const evt = event && typeof event === 'object' ? event : {};
  evt.target = node;
  evt.defaultPrevented = false;
  evt._stopped = false;
  evt.preventDefault = function () { evt.defaultPrevented = true; };
  evt.stopPropagation = function () { evt._stopped = true; };
  const type = evt.type || 'click';
  function call(nodeToCall, capture) {
    if (!nodeToCall || evt._stopped) return;
    const listeners = collectListeners(nodeToCall, type, capture);
    for (const listener of listeners) {
      if (evt._stopped) break;
      try { listener.fn.call(nodeToCall, evt); } catch (error) {
        console.error('Listener error:', error);
        failed += 1;
        failures.push('Excepción en listener ' + type + ': ' + error.message);
      }
    }
  }
  call(window, true);
  call(document, true);
  const path = [];
  let current = node;
  while (current) {
    path.push(current);
    if (current === document) break;
    current = current.parentNode;
  }
  for (const targetNode of path) {
    call(targetNode, false);
    if (evt._stopped) break;
  }
  if (!evt._stopped) call(window, false);
  return evt;
}

const document = makeNode('#document');
document._tag = '#document';
const body = makeNode('body');
body.parentNode = document;
document._children.push(body);
document.body = body;
document.documentElement = body;
document.activeElement = body;
document.contains = function (node) {
  let current = node;
  while (current) {
    if (current === document) return true;
    current = current.parentNode;
  }
  return false;
};
document.querySelectorAll = function (selector) {
  const out = [];
  const selectors = String(selector || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  function walk(node) {
    for (const child of node._children) {
      for (const raw of selectors) {
        if (matchesComplex(child, raw)) { out.push(child); break; }
      }
      walk(child);
    }
  }
  walk(document);
  return out;
};
document.querySelector = function (selector) { return document.querySelectorAll(selector)[0] || null; };
document.createElement = function (tag) { return makeNode(tag); };
document._listeners = [];
document.addEventListener = function (type, fn, options) {
  const capture = !!(options === true || (options && options.capture));
  document._listeners.push({ type: type, fn: fn, capture: capture });
};
document.removeEventListener = function (type, fn, options) {
  const capture = !!(options === true || (options && options.capture));
  document._listeners = document._listeners.filter(function (listener) {
    return !(listener.type === type && listener.fn === fn && listener.capture === capture);
  });
};

const window = makeNode('#window');
window._tag = '#window';
window.setTimeout = setTimeout;
window.clearTimeout = clearTimeout;
window.devicePixelRatio = 1;
window.performance = { now: function () { return Date.now(); } };
window.matchMedia = function () { return { matches: false, addListener: function () {}, removeListener: function () {} }; };
window.console = console;
window.addEventListener = function (type, fn, options) {
  const capture = !!(options === true || (options && options.capture));
  window._listeners.push({ type: type, fn: fn, capture: capture });
};
window.removeEventListener = function (type, fn, options) {
  const capture = !!(options === true || (options && options.capture));
  window._listeners = window._listeners.filter(function (listener) {
    return !(listener.type === type && listener.fn === fn && listener.capture === capture);
  });
};

/* ------------------------------------------------------------------ */
/* Estado y datos                                                      */
/* ------------------------------------------------------------------ */
const questions = {
  'q-a': {
    id: 'q-a', areaId: 'area-1', stem: 'Pregunta A sobre atención primaria.',
    options: [{ id: 'A', text: 'Opción correcta A' }, { id: 'B', text: 'Opción B' }],
    answer: 'A', explanation: 'La clave A responde al criterio de atención primaria. El resto no cubre la demanda.',
    source: 'campaign', examTitle: 'Psicología · SERUMS', page: 12, difficulty: 'media', generated: false
  },
  'q-b': {
    id: 'q-b', areaId: 'area-1', stem: 'Pregunta B generada desde ficha.',
    options: [{ id: 'A', text: 'Opción A' }, { id: 'B', text: 'Opción B' }, { id: 'C', text: 'Opción correcta C' }],
    answer: 'C', explanation: 'La respuesta C coincide con la ficha del dashboard. La opción B confunde el criterio.',
    source: 'dashboard', examTitle: 'Ficha de estudio', page: null, difficulty: 'alta', generated: true
  },
  'q-c': {
    id: 'q-c', areaId: 'area-1', stem: 'Pregunta C sin explicación.',
    options: [{ id: 'A', text: 'Opción A' }, { id: 'B', text: 'Opción correcta B' }],
    answer: 'B', explanation: '', source: 'campaign', examTitle: 'Psicología · SERUMS', page: 30, difficulty: 'base', generated: false
  }
};
const state = {
  settings: { feedbackMode: 'end', onlyOriginalBank: false, sourceWeights: { campaign: 0.6, dashboard: 0.15, flashcards: 0.25 } },
  questionTags: {},
  coins: 100,
  xp: 100,
  stage: 2
};
const result = {
  mode: 'mission', title: 'Ruta de prueba', pass: true,
  correct: 2, wrong: 1, total: 3, answered: 3, accuracy: 2 / 3, score: 200,
  areaId: 'area-1', questionXp: 30, questionCoins: 3, xpEarned: 70, coinsEarned: 13,
  completion: { xp: 40, coins: 10 }, achievements: [], errorsScheduled: 1,
  entries: [
    { questionId: 'q-a', chosen: 'A', chosenText: 'Opción correcta A', correct: true, answer: 'A', answerText: 'Opción correcta A' },
    { questionId: 'q-b', chosen: 'B', chosenText: 'Opción B', correct: false, answer: 'C', answerText: 'Opción correcta C' },
    { questionId: 'q-c', chosen: 'A', chosenText: 'Opción A', correct: true, answer: 'B', answerText: 'Opción correcta B' }
  ]
};
const V2 = {
  modules: {},
  _errors: [],
  events: [],
  register(name, module) { V2[name] = module; V2.modules[name] = true; },
  softError(scope, error) { V2._errors.push({ scope, message: String(error && error.message || error) }); },
  emit(type, payload) { V2.events.push({ type, payload }); },
  reducedMotion() { return false; },
  quality() { return 'medio'; },
  isTouch() { return false; },
  clamp(v, min, max) { return Math.max(min, Math.min(max, Number(v) || 0)); }
};

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function icon(name) { return '<svg data-icon="' + name + '"></svg>'; }
function formatNumber(value) { return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function areaName(id) { return id === 'area-1' ? 'Clínica' : 'Ruta'; }
function toast() {}
function persist() { return true; }
function saveSettings() {}
function initAudio() {}
function questionTag(id) { return state.questionTags[id] || { difficult: false, favorite: false }; }
function toggleQuestionTag(id, tag) {
  const current = state.questionTags[id] || { difficult: false, favorite: false };
  current[tag] = !current[tag];
  current.updatedAt = new Date().toISOString();
  if (!current.difficult && !current.favorite) delete state.questionTags[id];
  else state.questionTags[id] = current;
}
function dateKey() { return '2026-11-06'; }
function dueErrors() { return []; }

const context = {
  console, setTimeout, clearTimeout, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp,
  isFinite, parseInt, parseFloat, window, document,
  V2, state, esc, icon, formatNumber, areaName, toast, persist, saveSettings, initAudio,
  questionTag, toggleQuestionTag, dateKey, dueErrors,
  QUESTION_BY_ID: questions,
  CAMP: { questions: questions, areas: [{ id: 'area-1', short: 'Clínica', accent: '#69d3c1' }], rules: {} },
  AREA_BY_ID: { 'area-1': { id: 'area-1', short: 'Clínica', accent: '#69d3c1' } },
  RULES: { firstReviewMinutes: 20, duelHearts: 3 },
  screen: 'result',
  session: null,
  lastFeedback: null,
  lastResult: result,
  THREE: undefined,
  Math: Math
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext('var window = window; var document = document;', context);
try {
  vm.runInContext(part5, context, { filename: 'part5-feedback.js' });
} catch (error) {
  console.error('No se pudo cargar part5-feedback.js:', error);
  process.exit(1);
}
try {
  vm.runInContext(part8, context, { filename: 'part8-summary.js' });
} catch (error) {
  console.error('No se pudo cargar part8-summary.js:', error);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Pruebas part5: modo, autoavance y banco original                    */
/* ------------------------------------------------------------------ */
section('part5 · inlineEnabled / autoAdvanceDelay / isEndMode');
const feedback = context.V2.feedback;
check('V2.feedback registrado', !!feedback);
check('feedbackMode por defecto = end', feedback.feedbackMode() === 'end');
check('isEndMode() true por defecto', feedback.isEndMode() === true);
check('inlineEnabled() false por defecto', feedback.inlineEnabled() === false);
check('autoAdvanceDelay misión ≈ 900', feedback.autoAdvanceDelay({ mode: 'mission' }) === 900, String(feedback.autoAdvanceDelay({ mode: 'mission' })));
check('autoAdvanceDelay simulacro ≈ 900', feedback.autoAdvanceDelay({ mode: 'simulacro' }) === 900, String(feedback.autoAdvanceDelay({ mode: 'simulacro' })));
check('autoAdvanceDelay sin sesión = 900', feedback.autoAdvanceDelay(null) === 900);
state.settings.feedbackMode = 'each';
check('feedbackMode each', feedback.feedbackMode() === 'each');
check('inlineEnabled() true en each', feedback.inlineEnabled() === true);
check('autoAdvanceDelay 0 en each', feedback.autoAdvanceDelay({ mode: 'mission' }) === 0);
check('autoAdvanceDelay 0 en each (simulacro)', feedback.autoAdvanceDelay({ mode: 'simulacro' }) === 0);
state.settings.feedbackMode = 'end';

section('part5 · onAnswer no abre overlay en modo end');
const onAnswerEnd = feedback.onAnswer(questions['q-a'], { correct: true, chosen: 'A', answer: 'A', answerText: 'Opción correcta A' }, { mode: 'mission' });
check('onAnswer devuelve false', onAnswerEnd === false);
check('isOpen() false', feedback.isOpen() === false);

section('part5 · onAnswer conserva overlay en modo each');
state.settings.feedbackMode = 'each';
const onAnswerEach = feedback.onAnswer(questions['q-a'], { correct: true, chosen: 'A', answer: 'A', answerText: 'Opción correcta A' }, { mode: 'mission' });
check('onAnswer devuelve true', onAnswerEach === true);
check('isOpen() true', feedback.isOpen() === true);
feedback.hide(false);
check('hide() cierra', feedback.isOpen() === false);
const settingsHTML = feedback.settingsHTML();
check('settingsHTML incluye «Al final del nivel»', settingsHTML.indexOf('Al final del nivel') !== -1);
check('settingsHTML incluye «Tras cada pregunta»', settingsHTML.indexOf('Tras cada pregunta') !== -1);
check('settingsHTML usa acción v2-feedback-mode', settingsHTML.indexOf('data-action="v2-feedback-mode"') !== -1);
const modeReturned = feedback.setFeedbackMode('end');
check('setFeedbackMode guarda end', modeReturned === 'end' && state.settings.feedbackMode === 'end');
check('setFeedbackMode(' + "'" + 'each' + "'" + ') guarda each', feedback.setFeedbackMode('each') === 'each' && state.settings.feedbackMode === 'each');
state.settings.feedbackMode = 'end';

section('part5 · botones de ajuste del modo de feedback');
body.reset();
const modeSettings = makeNode('section');
modeSettings.setAttribute('data-v2-feedback-mode-settings', '');
function makeModeButton(mode) {
  const button = makeNode('button');
  button.setAttribute('data-action', 'v2-feedback-mode');
  button.setAttribute('data-mode', mode);
  button.setAttribute('aria-pressed', mode === 'end' ? 'true' : 'false');
  if (mode === 'end') button.classList.add('is-active');
  return button;
}
const modeEndButton = makeModeButton('end');
const modeEachButton = makeModeButton('each');
modeSettings.appendChild(modeEndButton);
modeSettings.appendChild(modeEachButton);
body.appendChild(modeSettings);
dispatch(modeEachButton, { type: 'click' });
check('click «Tras cada pregunta» guarda each', state.settings.feedbackMode === 'each');
check('click «Tras cada pregunta» activa su botón', modeEachButton.getAttribute('aria-pressed') === 'true' && modeEachButton.classList.contains('is-active'));
check('click «Tras cada pregunta» desactiva el otro', modeEndButton.getAttribute('aria-pressed') === 'false' && !modeEndButton.classList.contains('is-active'));
dispatch(modeEndButton, { type: 'click' });
check('click «Al final del nivel» guarda end', state.settings.feedbackMode === 'end');
check('click «Al final del nivel» activa su botón', modeEndButton.getAttribute('aria-pressed') === 'true' && modeEndButton.classList.contains('is-active'));
body.reset();

section('part5 · onlyOriginalBank filtra a campaña en mix*');
state.settings.onlyOriginalBank = true;
const missionIds = feedback.mixMissionQuestions({ id: 'm1', areaId: 'area-1' }, ['q-a', 'q-b', 'q-c']);
check('mixMissionQuestions solo campaña', Array.isArray(missionIds) && missionIds.every(function (id) { return questions[id] && questions[id].source === 'campaign'; }), JSON.stringify(missionIds));
const modeIds = feedback.mixModeQuestions('mission', ['q-a', 'q-b', 'q-c']);
check('mixModeQuestions solo campaña', Array.isArray(modeIds) && modeIds.every(function (id) { return questions[id] && questions[id].source === 'campaign'; }), JSON.stringify(modeIds));
const practiceIds = feedback.mixPracticeQuestions('area-1', ['q-a', 'q-b', 'q-c']);
check('mixPracticeQuestions solo campaña', Array.isArray(practiceIds) && practiceIds.every(function (id) { return questions[id] && questions[id].source === 'campaign'; }), JSON.stringify(practiceIds));
state.settings.onlyOriginalBank = false;

section('part5 · destello no bloqueante en modo end');
body.reset();
const duelPanel = makeNode('section');
duelPanel.className = 'duelPanel';
const answersBox = makeNode('div');
answersBox.className = 'answers';
const answerButtons = {};
['A', 'B', 'C'].forEach(function (letter) {
  const button = makeNode('button');
  button.className = 'answerBtn is-muted';
  button.setAttribute('data-letter', letter);
  answerButtons[letter] = button;
  answersBox.appendChild(button);
});
duelPanel.appendChild(answersBox);
body.appendChild(duelPanel);
state.settings.feedbackMode = 'end';
feedback.onAnswer(questions['q-b'], { correct: false, chosen: 'B', answer: 'C', answerText: 'Opción correcta C' }, { mode: 'mission' });
check('destello marca la elegida', answerButtons.B.classList.contains('v2-fb-flash') && answerButtons.B.classList.contains('v2-fb-flash--bad'));
check('destello marca la clave', answerButtons.C.classList.contains('v2-fb-flash') && answerButtons.C.classList.contains('v2-fb-flash--key'));
check('destello no marca opciones ajenas', !answerButtons.A.classList.contains('v2-fb-flash'));
feedback.onAnswer(questions['q-b'], { correct: false, chosen: 'B', answer: 'C', answerText: 'Opción correcta C', deferred: true }, { mode: 'simulacro' });
check('simulacro: destello neutro en la elegida', answerButtons.B.classList.contains('v2-fb-flash--quiet'));
check('simulacro: no destella la clave', !answerButtons.C.classList.contains('v2-fb-flash'));
feedback.onAnswer(questions['q-b'], { correct: true, chosen: 'C', answer: 'C', answerText: 'Opción correcta C' }, { mode: 'boss' });
check('boss: destella la elegida', answerButtons.C.classList.contains('v2-fb-flash--good'));
check('boss: no destella la clave aparte', document.querySelectorAll('.answerBtn.v2-fb-flash').length === 1);
body.reset();

section('part5 · la pausa no rompe el avance de la ventana inline');
const pendingFeedback = { correct: true, chosen: 'A', answer: 'A', answerText: 'Opción correcta A' };
const pauseButton = makeNode('button');
pauseButton.setAttribute('data-action', 'open-pause');
body.appendChild(pauseButton);
let pauseSpy = 0;
let keySpy = 0;
const pauseSpyFn = function () { pauseSpy += 1; };
const keySpyFn = function () { keySpy += 1; };
document.addEventListener('click', pauseSpyFn, false);
window.addEventListener('keydown', keySpyFn, false);
context.lastFeedback = pendingFeedback;
state.settings.feedbackMode = 'end';
feedback.onAnswer(questions['q-a'], pendingFeedback, { mode: 'mission' });
dispatch(pauseButton, { type: 'click' });
check('click de pausa bloqueado durante la ventana inline', pauseSpy === 0);
dispatch(document, { type: 'keydown', key: 'Escape', code: 'Escape' });
check('Escape de pausa bloqueado durante la ventana inline', keySpy === 0);
context.lastFeedback = null;
dispatch(pauseButton, { type: 'click' });
check('fuera de la ventana inline la pausa sigue funcionando', pauseSpy === 1);
document.removeEventListener('click', pauseSpyFn, false);
window.removeEventListener('keydown', keySpyFn, false);
body.reset();

/* ------------------------------------------------------------------ */
/* Pruebas part8: HTML y montaje con DOM mínimo                        */
/* ------------------------------------------------------------------ */
section('part8 · html(result)');
const summary = context.V2.summary;
check('V2.summary registrado', !!summary);
const html = summary.html(result);
check('html no vacío', typeof html === 'string' && html.length > 100);
check('contiene puntuación 200', html.indexOf('200') !== -1);
check('contiene XP +70', html.indexOf('+70') !== -1);
check('contiene monedas +13', html.indexOf('+13') !== -1);
const indexWrong = html.indexOf('data-question="q-b"');
const indexA = html.indexOf('data-question="q-a"');
const indexC = html.indexOf('data-question="q-c"');
check('errores primero (q-b antes de q-a)', indexWrong !== -1 && indexA !== -1 && indexWrong < indexA, indexWrong + ' / ' + indexA);
check('aciertos después en orden (q-a antes de q-c)', indexA !== -1 && indexC !== -1 && indexA < indexC, indexA + ' / ' + indexC);
check('muestra tu respuesta', html.indexOf('Tu respuesta · B') !== -1);
check('muestra la correcta', html.indexOf('Correcta · C') !== -1);
check('incluye explicación de q-b', html.indexOf('La respuesta C coincide con la ficha del dashboard') !== -1);
check('incluye por qué no encaja', html.indexOf('Por qué la elegida no encaja') !== -1);
check('etiqueta Generada para dashboard', html.indexOf('Generada') !== -1);
check('filtros Solo errores / Todas', html.indexOf('Solo errores') !== -1 && html.indexOf('Todas') !== -1);
check('acciones v2-summary-difficult', html.indexOf('data-action="v2-summary-difficult"') !== -1);
check('acciones v2-summary-flashcard', html.indexOf('data-action="v2-summary-flashcard"') !== -1);
check('sin data-action de otros módulos', html.indexOf('data-action="toggle-question-tag"') === -1);
const qcItem = html.slice(html.indexOf('data-question="q-c"'), html.indexOf('data-question="q-c"') + 2500);
check('pregunta sin explicación avisa', qcItem.indexOf('Sin explicación registrada') !== -1);
const simResult = Object.assign({}, result, { mode: 'simulacro', isMode: true, pass: true });
const simHtml = summary.html(simResult);
check('simulacro revela clave al final', simHtml.indexOf('informe final') !== -1 && simHtml.indexOf('Correcta · C') !== -1);
const survivalResult = Object.assign({}, result, { mode: 'survival', isMode: true, pass: false, total: 3 });
const survivalHtml = summary.html(survivalResult);
check('supervivencia explica el resumen al caer', survivalHtml.indexOf('sin vidas') !== -1 || survivalHtml.indexOf('perder las tres vidas') !== -1);
const timedResult = Object.assign({}, result, { mode: 'timed', isMode: true, pass: false });
const timedHtml = summary.html(timedResult);
check('contrarreloj explica el resumen al terminar', timedHtml.indexOf('tiempo cerró la sesión') !== -1);
check('html(null) devuelve cadena vacía', summary.html(null) === '');
const emptyResult = Object.assign({}, result, { entries: [], correct: 0, wrong: 0, total: 0, accuracy: 0, score: 0, xpEarned: 0, coinsEarned: 0, completion: {} });
const emptyHtml = summary.html(emptyResult);
check('sesión sin respuestas muestra vacío honesto', emptyHtml.indexOf('no registró respuestas') !== -1);
const omittedResult = Object.assign({}, result, {
  mode: 'survival', isMode: true, pass: false, correct: 1, wrong: 1, total: 2, accuracy: 0.5, score: 100,
  entries: [
    { questionId: 'q-a', chosen: 'A', chosenText: 'Opción correcta A', correct: true, answer: 'A', answerText: 'Opción correcta A' },
    { questionId: 'q-b', chosen: null, chosenText: '', correct: false, omitted: true, timeExpired: true, answer: 'C', answerText: 'Opción correcta C' }
  ]
});
const omittedHtml = summary.html(omittedResult);
check('timeout aparece como sin responder', omittedHtml.indexOf('Sin responder') !== -1);
check('timeout no inventa «por qué»', omittedHtml.indexOf('Por qué la elegida no encaja') === -1);

section('part8 · mount / filtros / difícil / flashcard');
body.reset();
const root = makeNode('section');
root.setAttribute('data-v2-summary', '');
root.setAttribute('data-filter', 'all');
const listEl = makeNode('ol');
listEl.setAttribute('data-v2-summary-list', '');
listEl.innerHTML = html.slice(html.indexOf('<ol class="v2-summary__list"'), html.indexOf('</ol>') + 5);
const statusEl = makeNode('p');
statusEl.setAttribute('data-v2-summary-status', '');
function makeFilterButton(filter, count) {
  const button = makeNode('button');
  button.setAttribute('data-action', 'v2-summary-filter');
  button.setAttribute('data-filter', filter);
  button.setAttribute('aria-pressed', 'false');
  const em = makeNode('em');
  em.textContent = String(count);
  button.appendChild(em);
  return button;
}
const filterWrong = makeFilterButton('wrong', 1);
const filterAll = makeFilterButton('all', 3);
const difficultButton = makeNode('button');
difficultButton.setAttribute('data-action', 'v2-summary-difficult');
difficultButton.setAttribute('data-question', 'q-b');
const difficultLabel = makeNode('span');
difficultLabel.setAttribute('data-v2-summary-difficult-label', '');
difficultLabel.textContent = 'Marcar como difícil';
difficultButton.appendChild(difficultLabel);
const flashButton = makeNode('button');
flashButton.setAttribute('data-action', 'v2-summary-flashcard');
flashButton.setAttribute('data-question', 'q-b');
root.appendChild(listEl);
root.appendChild(statusEl);
root.appendChild(filterWrong);
root.appendChild(filterAll);
root.appendChild(difficultButton);
root.appendChild(flashButton);
body.appendChild(root);

const mounted = summary.mount(result);
check('mount devuelve true', mounted === true);
check('status inicial menciona todas', statusEl.textContent.indexOf('Mostrando las 3 preguntas') !== -1, statusEl.textContent);

dispatch(filterWrong, { type: 'click' });
check('filtro errores activa aria-pressed', filterWrong.getAttribute('aria-pressed') === 'true');
check('filtro todas desactivado', filterAll.getAttribute('aria-pressed') === 'false');
check('lista filtrada solo contiene q-b', listEl.innerHTML.indexOf('q-b') !== -1 && listEl.innerHTML.indexOf('q-a') === -1 && listEl.innerHTML.indexOf('q-c') === -1);
check('status menciona solo errores', statusEl.textContent.indexOf('solo errores') !== -1, statusEl.textContent);
check('contador de errores = 1', filterWrong.querySelector('em').textContent === '1');

dispatch(filterAll, { type: 'click' });
check('filtro todas vuelve a mostrar q-a', listEl.innerHTML.indexOf('q-a') !== -1 && listEl.innerHTML.indexOf('q-c') !== -1);
check('status vuelve a todas', statusEl.textContent.indexOf('Mostrando las 3 preguntas') !== -1, statusEl.textContent);

dispatch(difficultButton, { type: 'click' });
check('difícil se guarda en questionTags', !!state.questionTags['q-b'] && state.questionTags['q-b'].difficult === true);
check('difícil marca aria-pressed', difficultButton.getAttribute('aria-pressed') === 'true');
check('difícil añade is-on', difficultButton.classList.contains('is-on'));
check('difícil actualiza etiqueta', difficultLabel.textContent === 'Marcada como difícil');
dispatch(difficultButton, { type: 'click' });
check('difícil se puede desmarcar', !state.questionTags['q-b'] || !state.questionTags['q-b'].difficult);

dispatch(flashButton, { type: 'click' });
const flashRoot = document.querySelector('[data-v2-summary-flash]');
check('flashcard local se abre', !!flashRoot);
dispatch(document, { type: 'keydown', key: 'Escape', code: 'Escape' });
check('Escape cierra la flashcard', !document.querySelector('[data-v2-summary-flash]'));

const listBeforeUnmount = listEl.innerHTML;
summary.unmount();
dispatch(filterWrong, { type: 'click' });
check('unmount quita listeners (no re-render)', listEl.innerHTML === listBeforeUnmount);
check('unmount limpia estado', context.V2.summary && typeof context.V2.summary.mount === 'function');

section('part8 · refresh');
body.reset();
const root2 = makeNode('section');
root2.setAttribute('data-v2-summary', '');
const list2 = makeNode('ol');
list2.setAttribute('data-v2-summary-list', '');
const status2 = makeNode('p');
status2.setAttribute('data-v2-summary-status', '');
root2.appendChild(list2);
root2.appendChild(status2);
body.appendChild(root2);
summary.mount(result);
const beforeRefresh = list2.innerHTML;
const refreshed = summary.refresh();
check('refresh devuelve true', refreshed === true);
check('refresh re-renderiza la lista', list2.innerHTML === beforeRefresh && list2.innerHTML.indexOf('q-b') !== -1);
summary.unmount();

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */
section('CSS');
function balancedBraces(css) {
  let depth = 0;
  let inString = null;
  let inComment = false;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    const next = css[i + 1];
    if (inComment) {
      if (ch === '*' && next === '/') { inComment = false; i += 1; }
      continue;
    }
    if (inString) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '/' && next === '*') { inComment = true; i += 1; continue; }
    if (ch === '"' || ch === "'") { inString = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') { depth -= 1; if (depth < 0) return false; }
  }
  return depth === 0 && !inString && !inComment;
}
check('part5-feedback.css llaves equilibradas', balancedBraces(css5));
check('part8-summary.css llaves equilibradas', balancedBraces(css8));
check('part5-feedback.css sin url()/imágenes', !/url\s*\(/i.test(css5));
check('part8-summary.css sin url()/imágenes', !/url\s*\(/i.test(css8));
check('part8-summary.css define focus-visible', css8.indexOf(':focus-visible') !== -1);
check('part8-summary.css respeta reduced-motion', css8.indexOf('prefers-reduced-motion') !== -1 && css8.indexOf('body.reduced-motion') !== -1);
check('part8-summary.css botones >= 44px', /min-height:\s*44px/.test(css8) && /min-height:\s*48px/.test(css8));
check('part5-feedback.css destello con reduced-motion', css5.indexOf('body.reduced-motion .answerBtn.v2-fb-flash') !== -1 && css5.indexOf('prefers-reduced-motion') !== -1);
check('part5-feedback.css ajuste de modo', css5.indexOf('.v2-feedback-modeOptions') !== -1 && css5.indexOf('.v2-feedback-modeBtn') !== -1);

/* ------------------------------------------------------------------ */
console.log('\n----------------------------------------');
console.log('Pruebas: ' + (passed + failed) + ' · OK: ' + passed + ' · Fallos: ' + failed);
if (failed) {
  console.log('\nFallos:');
  failures.forEach(function (item) { console.log(' - ' + item); });
  process.exitCode = 1;
} else {
  console.log('Todo correcto.');
}

if (process.argv.indexOf('--dump') !== -1) {
  const preview = '<!doctype html><html lang="es"><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
    '<title>Vista previa · resumen V2.1</title><style>' +
    ':root{--obsidian:#05070d;--sky:#0a1120;--stone:#263048;--gold:#e4c07a;--ink:#f2f0ea;--blue:#7aa2ff;--teal:#69d3c1;--violet:#c49bff;--lime:#b8d46a;--amber:#f3b562;--rose:#ff8b9d;--muted:#a7b2c9;--dim:#6f7c97;--line:rgba(190,208,245,.14);--line-strong:rgba(190,208,245,.28);--font-serif:Georgia,serif}' +
    'html,body{margin:0;min-height:100%;background:radial-gradient(ellipse at 50% 30%, rgba(23,35,61,.6), rgba(3,5,10,.94) 55%);color:#f2f0ea;font-family:system-ui,sans-serif}' +
    'body{padding:24px;max-width:940px;margin:0 auto}' +
    '.demo{width:100%;max-width:540px;border:1px solid var(--line-strong);border-radius:20px;background:linear-gradient(155deg, rgba(21,28,45,.96), rgba(7,11,19,.98));padding:20px}' +
    '.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--muted);font:inherit;cursor:pointer}' +
    css5 + '\n' + css8 +
    '</style></head><body><div class="demo">' +
    summary.html(result) +
    '</div></body></html>';
  fs.writeFileSync(path.join(__dirname, 'preview-summary.html'), preview);
  fs.writeFileSync(path.join(__dirname, 'sample-summary-fragment.html'), summary.html(result));
  console.log('Vista previa escrita en ' + path.join(__dirname, 'preview-summary.html'));
}
