/* =========================================================================
   SERUMS QUEST · V2 · Módulo 8 · Resumen final del nivel
   Reemplaza el bloque `answerReview` de la pantalla de resultado.

   Se concatena dentro del mismo IIFE que part0–part7: comparte ámbito con
   state, lastResult, QUESTION_BY_ID, AREA_BY_ID, areaName, icon, esc,
   formatNumber, toggleQuestionTag, toast y persist. No crea otro IIFE.

   Qué muestra (solo lectura, sin añadir recompensas ni duplicar el repaso):
   - Puntuación, precisión, XP y monedas que la sesión ya calculó.
   - Todas las preguntas: errores primero y después los aciertos.
   - Tu respuesta, la clave, una explicación breve (1–3 líneas) y, si falló,
     por qué la opción elegida no encaja cuando hay dato en la explicación.
   - Filtros «Solo errores / Todas», marca «Difícil» y flashcard local.
   - Etiqueta «Generada» para preguntas de ficha (q.generated/dashboard).
   - Simulacro: la clave se revela aquí, al cerrar; Supervivencia: resumen al
     caer; Contrarreloj: resumen al terminar.

   El repaso espaciado NO se toca: los fallos ya quedaron programados por el
   flujo de la sesión; aquí solo se leen lastResult.entries.

   API: V2.summary = { html(result), mount(result), unmount(), refresh() }.
   Delegación propia (click/teclado) con acciones data-action="v2-summary-*".
   ========================================================================= */

var V2SM_MODE_LABELS = {
  mission: 'Campaña',
  boss: 'Duelo de dominio',
  review: 'Repaso espaciado',
  daily: 'Desafío diario',
  survival: 'Supervivencia',
  timed: 'Contrarreloj',
  simulacro: 'Simulacro',
  practice: 'Práctica libre'
};
var V2SM_DIFFICULTY_LABELS = { base: 'Base', media: 'Media', alta: 'Alta' };
var V2SM_MAX_EXPLAIN = 260;
var V2SM_STOPWORDS = {
  para: 1, como: 1, desde: 1, entre: 1, sobre: 1, cuando: 1, porque: 1, aunque: 1,
  donde: 1, mismo: 1, misma: 1, todos: 1, todas: 1, suele: 1, suelen: 1,
  puede: 1, pueden: 1, debe: 1, deben: 1, ser: 1, son: 1, los: 1, las: 1,
  del: 1, una: 1, unos: 1, unas: 1, con: 1, sin: 1, por: 1, que: 1, esta: 1,
  este: 1, estos: 1, estas: 1, otro: 1, otra: 1, otros: 1, otras: 1, tiene: 1,
  tienen: 1, hacer: 1, hace: 1, modo: 1, forma: 1, parte: 1, caso: 1, casos: 1
};

var v2smState = {
  mounted: false,
  root: null,
  result: null,
  items: [],
  filter: 'all',
  flashRoot: null,
  flashReturnFocus: null,
  clickHandler: null,
  keyHandler: null,
  docKeyHandler: null
};

/* -------------------------------------------------------------------------
   Utilidades defensivas
   ------------------------------------------------------------------------- */
function v2smSoft(error) {
  try {
    if (typeof V2 !== 'undefined' && V2 && typeof V2.softError === 'function') V2.softError('summary', error);
  } catch (e) {}
  try { if (window.console && window.console.warn) window.console.warn('[V2 summary]', error); } catch (e) {}
}
function v2smEmit(type, payload) {
  try {
    if (typeof V2 !== 'undefined' && V2 && typeof V2.emit === 'function') V2.emit('summary:' + type, payload || null);
  } catch (e) {}
}
function v2smEsc(value) {
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
function v2smIcon(name, size) {
  if (typeof icon === 'function') {
    try { return icon(name, size || 13); } catch (e) {}
  }
  return '';
}
function v2smNumber(value, fallback) {
  var n = Number(value);
  return isFinite(n) ? n : (Number(fallback) || 0);
}
function v2smFormat(value) {
  if (typeof formatNumber === 'function') {
    try { return formatNumber(value); } catch (e) {}
  }
  return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function v2smQuestion(id) {
  try {
    if (typeof QUESTION_BY_ID !== 'undefined' && QUESTION_BY_ID && QUESTION_BY_ID[id]) return QUESTION_BY_ID[id];
  } catch (e) {}
  try {
    if (typeof CAMP !== 'undefined' && CAMP && CAMP.questions && CAMP.questions[id]) return CAMP.questions[id];
  } catch (e) {}
  return null;
}
function v2smOption(question, id) {
  if (!question || !question.options) return null;
  for (var i = 0; i < question.options.length; i++) {
    var option = question.options[i];
    if (option && String(option.id) === String(id)) return option;
  }
  return null;
}
function v2smAreaLabel(id) {
  if (typeof areaName === 'function') {
    try {
      var label = areaName(id);
      if (label) return label;
    } catch (e) {}
  }
  try {
    if (typeof AREA_BY_ID !== 'undefined' && AREA_BY_ID && AREA_BY_ID[id]) return AREA_BY_ID[id].short || AREA_BY_ID[id].name || 'Ruta';
  } catch (e) {}
  return 'Ruta';
}
function v2smAreaAccent(id) {
  try {
    if (typeof AREA_BY_ID !== 'undefined' && AREA_BY_ID && AREA_BY_ID[id] && AREA_BY_ID[id].accent) return AREA_BY_ID[id].accent;
  } catch (e) {}
  return '#7aa2ff';
}
function v2smSourceLabel(question) {
  var source = question && question.source;
  if (source === 'dashboard') return 'Ficha del dashboard';
  if (source === 'flashcards') return 'Flashcards';
  return 'Campaña';
}
function v2smGenerated(question) {
  return !!(question && (question.generated || question.source === 'dashboard'));
}
function v2smIsDifficult(questionId) {
  try {
    if (typeof questionTag === 'function') return !!questionTag(questionId).difficult;
  } catch (e) {}
  try {
    return !!(typeof state !== 'undefined' && state && state.questionTags && state.questionTags[questionId] && state.questionTags[questionId].difficult);
  } catch (e) {}
  return false;
}

/* -------------------------------------------------------------------------
   Texto breve y comparación de la opción elegida
   ------------------------------------------------------------------------- */
function v2smSmartTrim(text, maxLen) {
  var clean = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  var limit = maxLen || V2SM_MAX_EXPLAIN;
  var sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
  var out = '';
  for (var i = 0; i < sentences.length && i < 3; i++) {
    var sentence = sentences[i].replace(/\s+/g, ' ').trim();
    if (!sentence) continue;
    var next = out ? out + ' ' + sentence : sentence;
    if (out && next.length > limit) break;
    out = next;
    if (out.length >= limit) break;
  }
  if (out.length > limit) {
    out = out.slice(0, limit);
    var cut = out.lastIndexOf(' ');
    if (cut > limit * 0.6) out = out.slice(0, cut);
    out = out.replace(/[\s,;:.!?]+$/, '') + '…';
  }
  return out;
}
function v2smNorm(text) {
  var out = String(text == null ? '' : text).toLowerCase();
  try { if (out.normalize) out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
  return out.replace(/[^a-z0-9ñü\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function v2smTokens(text) {
  var normalized = v2smNorm(text);
  if (!normalized) return [];
  var parts = normalized.split(' ');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var word = parts[i];
    if (!word || word.length < 5 || V2SM_STOPWORDS[word]) continue;
    if (out.indexOf(word) === -1) out.push(word);
    if (out.length >= 6) break;
  }
  return out;
}
function v2smSentenceWith(text, tokens) {
  if (!text || !tokens || !tokens.length) return '';
  var sentences = String(text).match(/[^.!?]+[.!?]*/g) || [String(text)];
  for (var i = 0; i < sentences.length; i++) {
    var normalized = v2smNorm(sentences[i]);
    for (var j = 0; j < tokens.length; j++) {
      if (normalized.indexOf(tokens[j]) !== -1) return sentences[i].replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}
function v2smDistinctTokens(text, avoidText) {
  var tokens = v2smTokens(text);
  var avoid = v2smTokens(avoidText);
  var out = [];
  for (var i = 0; i < tokens.length; i++) {
    if (avoid.indexOf(tokens[i]) === -1) out.push(tokens[i]);
  }
  return out;
}
function v2smExplanation(question) {
  var raw = question && question.explanation ? String(question.explanation).replace(/\s+/g, ' ').trim() : '';
  if (raw) {
    return { text: v2smSmartTrim(raw, V2SM_MAX_EXPLAIN), missing: false };
  }
  var keyOption = v2smOption(question, question && question.answer);
  var line = 'La clave es ' + ((question && question.answer) || '—') +
    (keyOption ? ': «' + keyOption.text + '»' : '') +
    '. No hay una explicación registrada para esta pregunta.';
  return { text: v2smSmartTrim(line, V2SM_MAX_EXPLAIN), missing: true };
}
function v2smWhy(question, entry) {
  if (!question || !entry || entry.correct) return '';
  var chosenId = entry.chosen == null ? '' : String(entry.chosen);
  if (!chosenId) return '';
  var chosenOption = v2smOption(question, chosenId);
  var keyOption = v2smOption(question, question.answer);
  var chosenText = chosenOption ? chosenOption.text : (entry.chosenText || '');
  var keyText = keyOption ? keyOption.text : (entry.answerText || '');
  var keyId = question.answer || '—';
  var full = question.explanation ? String(question.explanation).replace(/\s+/g, ' ').trim() : '';
  if (!full && !chosenText && !keyText) return '';
  var chosenLabel = 'Tu opción ' + chosenId + (chosenText ? ' («' + v2smSmartTrim(chosenText, 90) + '»)' : '');
  var keyLabel = 'la clave ' + keyId + (keyText ? ' («' + v2smSmartTrim(keyText, 90) + '»)' : '');
  if (full) {
    var chosenWhole = v2smNorm(chosenText);
    var directSentence = '';
    if (chosenWhole && chosenWhole.length >= 6) {
      var allSentences = full.match(/[^.!?]+[.!?]*/g) || [full];
      for (var s = 0; s < allSentences.length; s++) {
        var padded = ' ' + v2smNorm(allSentences[s]) + ' ';
        if (padded.indexOf(' ' + chosenWhole + ' ') !== -1) {
          directSentence = allSentences[s].replace(/\s+/g, ' ').trim();
          break;
        }
      }
    }
    var directMatch = directSentence || v2smSentenceWith(full, v2smDistinctTokens(chosenText, keyText));
    if (directMatch) {
      return chosenLabel + ' no coincide con ' + keyLabel + '. La explicación menciona «' +
        v2smSmartTrim(directMatch, 170) + '», así que el criterio no respalda esa opción.';
    }
    return chosenLabel + ' no coincide con ' + keyLabel +
      '. La explicación se centra en la clave y no respalda la opción elegida.';
  }
  return 'No hay explicación registrada. Compara ' + chosenLabel + ' con ' + keyLabel + '.';
}

/* -------------------------------------------------------------------------
   Normalización y orden: errores primero, luego aciertos
   ------------------------------------------------------------------------- */
function v2smEntriesFrom(result) {
  var out = [];
  if (!result || !Array.isArray(result.entries)) return out;
  for (var i = 0; i < result.entries.length; i++) {
    var entry = result.entries[i];
    if (!entry || !entry.questionId) continue;
    var question = v2smQuestion(entry.questionId);
    if (!question) continue;
    out.push({ order: out.length, entry: entry, question: question });
  }
  return out;
}
function v2smSorted(items) {
  var wrong = [];
  var right = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i] && items[i].entry && items[i].entry.correct) right.push(items[i]);
    else wrong.push(items[i]);
  }
  return wrong.concat(right);
}
function v2smFiltered(items, filter) {
  if (filter !== 'wrong') return items.slice();
  var out = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i] && items[i].entry && !items[i].entry.correct) out.push(items[i]);
  }
  return out;
}
function v2smCounts(items) {
  var counts = { total: items.length, errors: 0, correct: 0 };
  for (var i = 0; i < items.length; i++) {
    if (items[i] && items[i].entry && items[i].entry.correct) counts.correct += 1;
    else counts.errors += 1;
  }
  return counts;
}

/* -------------------------------------------------------------------------
   HTML del bloque
   ------------------------------------------------------------------------- */
function v2smScore(result) {
  if (!result) return 0;
  if (result.score != null && isFinite(Number(result.score))) return Math.round(Number(result.score));
  return Math.max(0, Math.round(v2smNumber(result.correct) * 100));
}
function v2smAccuracy(result) {
  if (!result) return 0;
  var accuracy = Number(result.accuracy);
  if (isFinite(accuracy)) return Math.max(0, Math.min(100, Math.round(accuracy * 100)));
  var total = v2smNumber(result.total);
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round(v2smNumber(result.correct) / total * 100)));
}
function v2smModeLabel(result) {
  return V2SM_MODE_LABELS[(result && result.mode) || ''] || 'Nivel';
}
function v2smModeNote(result) {
  if (!result) return '';
  var mode = result.mode;
  var pass = !!result.pass;
  if (mode === 'simulacro') return 'El Simulacro reservó la clave durante la prueba; aquí, en el informe final, tienes la corrección completa.';
  if (mode === 'survival') return pass ? 'Sobreviviste la serie completa. Revisa cada corrección antes de volver a intentarlo.' : 'La supervivencia terminó al perder las tres vidas. Este es el resumen de todo lo respondido hasta caer.';
  if (mode === 'timed') return pass ? 'La sesión terminó con el tiempo a favor. Aquí está el repaso completo.' : 'El tiempo cerró la sesión; se corrige lo respondido y el resto queda fuera de esta marca.';
  if (mode === 'daily') return 'Desafío diario cerrado. Los fallos siguen el repaso espaciado con las mismas reglas.';
  if (mode === 'review') return 'El repaso quedó registrado; los intervalos se recalcularon con las mismas reglas de siempre.';
  if (mode === 'boss') return 'Duelo de dominio cerrado. La clave se muestra ahora, en el informe final.';
  if (mode === 'practice') return 'Práctica libre completada. El detalle queda en tu errorario, sin presión de reloj.';
  return 'Misión cerrada. Los fallos vuelven al repaso espaciado con las mismas reglas.';
}
function v2smVerdictLine(result) {
  if (!result) return '';
  var correct = v2smNumber(result.correct);
  var total = v2smNumber(result.total);
  var accuracy = v2smAccuracy(result);
  var pieces = [];
  if (total > 0) pieces.push(correct + ' de ' + total + ' respuestas correctas');
  else if (result.total > 0) pieces.push(correct + ' de ' + result.total + ' respuestas correctas');
  pieces.push('precisión ' + accuracy + ' %');
  pieces.push('puntuación ' + v2smFormat(v2smScore(result)) + ' pts');
  return pieces.join(' · ') + '.';
}
function v2smExplainBadge(question, explanation) {
  if (!explanation) return '';
  if (explanation.missing) return '<em class="v2-summary__tag is-warn">Sin explicación registrada</em>';
  if (question && question.explanationGenerated) return '<em class="v2-summary__tag">Explicación breve</em>';
  return '';
}
function v2smTotalsHTML(result) {
  var score = v2smScore(result);
  var accuracy = v2smAccuracy(result);
  var correct = v2smNumber(result.correct);
  var total = v2smNumber(result.total) || v2smNumber(result.answered) || v2smNumber(result.correct) + v2smNumber(result.wrong);
  var xp = v2smNumber(result.xpEarned);
  var coins = v2smNumber(result.coinsEarned);
  var questionXp = v2smNumber(result.questionXp);
  var questionCoins = v2smNumber(result.questionCoins);
  var completion = (result && result.completion) || {};
  var completionXp = v2smNumber(completion.xp);
  var completionCoins = v2smNumber(completion.coins);
  var achievementXp = 0;
  var achievementCoins = 0;
  if (result && Array.isArray(result.achievements)) {
    for (var i = 0; i < result.achievements.length; i++) {
      achievementXp += v2smNumber(result.achievements[i] && result.achievements[i].xp);
      achievementCoins += v2smNumber(result.achievements[i] && result.achievements[i].coins);
    }
  }
  var xpDetail = [];
  if (questionXp) xpDetail.push('respuestas +' + v2smFormat(questionXp));
  if (completionXp) xpDetail.push('cierre +' + v2smFormat(completionXp));
  if (achievementXp) xpDetail.push('logros +' + v2smFormat(achievementXp));
  var coinDetail = [];
  if (questionCoins) coinDetail.push('respuestas +' + v2smFormat(questionCoins));
  if (completionCoins) coinDetail.push('cierre +' + v2smFormat(completionCoins));
  if (achievementCoins) coinDetail.push('logros +' + v2smFormat(achievementCoins));
  var html = '<div class="v2-summary__totals">' +
    '<div class="v2-summary__stat v2-summary__stat--score"><span>Puntuación</span><b>' + v2smEsc(v2smFormat(score)) + '</b><small>pts</small></div>' +
    '<div class="v2-summary__stat"><span>Aciertos</span><b>' + v2smEsc(correct + '/' + (total || 0)) + '</b><small>' + accuracy + ' % de precisión</small></div>' +
    '<div class="v2-summary__stat"><span>XP</span><b>+' + v2smEsc(v2smFormat(xp)) + '</b>' + (xpDetail.length ? '<small>' + v2smEsc(xpDetail.join(' · ')) + '</small>' : '<small>sin XP de sesión</small>') + '</div>' +
    '<div class="v2-summary__stat v2-summary__stat--gold"><span>Monedas</span><b>+' + v2smEsc(v2smFormat(coins)) + '</b>' + (coinDetail.length ? '<small>' + v2smEsc(coinDetail.join(' · ')) + '</small>' : '<small>sin monedas nuevas</small>') + '</div>' +
  '</div>';
  return html;
}
function v2smToolbarHTML(counts) {
  function button(filter, label, count, active) {
    return '<button type="button" class="v2-summary__filter' + (active ? ' is-active' : '') + '" data-action="v2-summary-filter" data-filter="' + filter + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
      label + ' <em>' + v2smEsc(count) + '</em></button>';
  }
  return '<div class="v2-summary__toolbar">' +
    '<div class="v2-summary__filters" role="group" aria-label="Filtrar preguntas del resumen">' +
      button('wrong', 'Solo errores', counts.errors, false) +
      button('all', 'Todas', counts.total, true) +
    '</div>' +
    '<span class="v2-summary__hint">Errores primero · ' + v2smIcon('arrowDown', 11) + ' después los aciertos</span>' +
  '</div>';
}
function v2smStatusText(counts, filter) {
  if (!counts.total) return 'Esta sesión no registró respuestas.';
  if (filter === 'wrong') {
    if (!counts.errors) return 'No hay errores entre las ' + counts.total + ' preguntas: todas fueron correctas.';
    return 'Mostrando ' + counts.errors + ' de ' + counts.total + ' preguntas · solo errores.';
  }
  return 'Mostrando las ' + counts.total + ' preguntas · errores primero.';
}
function v2smItemHTML(result, item, position, listLength) {
  var question = item.question;
  var entry = item.entry;
  var correct = !!entry.correct;
  var omitted = !!entry.omitted;
  var stateName = omitted ? 'omitted' : (correct ? 'correct' : 'wrong');
  var statusLabel = omitted ? 'Sin responder' : (correct ? 'Correcta' : 'Fallada');
  var chosenId = entry.chosen == null ? '' : String(entry.chosen);
  var chosenOption = chosenId ? v2smOption(question, chosenId) : null;
  var chosenText = chosenOption ? chosenOption.text : (entry.chosenText || '');
  var keyOption = v2smOption(question, question.answer);
  var keyText = keyOption ? keyOption.text : (entry.answerText || '');
  var explanation = v2smExplanation(question);
  var why = stateName === 'wrong' ? v2smWhy(question, entry) : '';
  var difficult = v2smIsDifficult(question.id);
  var areaId = question.areaId || (result && result.areaId) || '';
  var chips = '<span class="v2-summary__area" style="--v2sm-area:' + v2smEsc(v2smAreaAccent(areaId)) + '"><i></i>' + v2smEsc(v2smAreaLabel(areaId)) + '</span>';
  if (v2smGenerated(question)) chips += '<span class="v2-summary__flag">Generada</span>';
  if (question.difficulty) chips += '<span class="v2-summary__chip">' + v2smEsc(V2SM_DIFFICULTY_LABELS[question.difficulty] || question.difficulty) + '</span>';
  var chosenLabel = omitted ? 'Sin marcar' : chosenId;
  var chosenClass = 'is-chosen';
  if (correct) chosenClass += ' is-good';
  else if (omitted) chosenClass += ' is-omitted';
  else chosenClass += ' is-bad';
  var html = '<li class="v2-summary__item is-' + stateName + '" data-v2-summary-item data-question="' + v2smEsc(question.id) + '">' +
    '<div class="v2-summary__itemHead">' +
      '<span class="v2-summary__status is-' + stateName + '">' + v2smIcon(omitted ? 'clock' : (correct ? 'checkCircle' : 'close'), 13) + statusLabel + '</span>' +
      '<div class="v2-summary__chips">' + chips + '</div>' +
      '<span class="v2-summary__num">' + (position + 1) + '/' + listLength + '</span>' +
    '</div>' +
    '<p class="v2-summary__stem">' + v2smEsc(question.stem || '') + '</p>' +
    '<div class="v2-summary__choices">' +
      '<div class="v2-summary__choice ' + chosenClass + '" data-v2-summary-chosen>' +
        '<span class="v2-summary__choiceKey">Tu respuesta · ' + v2smEsc(chosenLabel) + '</span>' +
        '<span class="v2-summary__choiceText">' + (chosenText ? v2smEsc(chosenText) : 'Sin respuesta registrada.') + '</span>' +
      '</div>' +
      '<div class="v2-summary__choice is-key" data-v2-summary-key>' +
        '<span class="v2-summary__choiceKey">Correcta · ' + v2smEsc(question.answer || '—') + '</span>' +
        '<span class="v2-summary__choiceText">' + (keyText ? v2smEsc(keyText) : '—') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="v2-summary__explain" data-v2-summary-explanation>' +
      '<div class="v2-summary__blockHead"><span>Explicación</span>' + v2smExplainBadge(question, explanation) + '</div>' +
      '<p>' + v2smEsc(explanation.text) + '</p>' +
    '</div>';
  if (why) {
    html += '<div class="v2-summary__why" data-v2-summary-why>' +
      '<div class="v2-summary__blockHead"><span>Por qué la elegida no encaja</span></div>' +
      '<p>' + v2smEsc(why) + '</p>' +
    '</div>';
  }
  var source = question.examTitle || question.origin || '';
  if (question.page != null && question.page !== '') source += (source ? ' · ' : '') + 'p. ' + question.page;
  html += '<div class="v2-summary__itemFoot">' +
    '<span class="v2-summary__source">' + v2smEsc(source || 'Contenido local') + (question.cycle ? ' · ' + v2smEsc(question.cycle) : '') + ' · ' + v2smEsc(v2smSourceLabel(question)) + '</span>' +
    '<div class="v2-summary__actions">' +
      '<button type="button" class="btn btn--ghost btn--sm v2-summary__btn' + (difficult ? ' is-on' : '') + '" data-action="v2-summary-difficult" data-question="' + v2smEsc(question.id) + '" aria-pressed="' + (difficult ? 'true' : 'false') + '">' +
        v2smIcon('flag', 12) + ' <span data-v2-summary-difficult-label>' + (difficult ? 'Marcada como difícil' : 'Marcar como difícil') + '</span></button>' +
      '<button type="button" class="btn btn--ghost btn--sm v2-summary__btn" data-action="v2-summary-flashcard" data-question="' + v2smEsc(question.id) + '">' +
        v2smIcon('bookOpen', 12) + ' Ver en flashcard</button>' +
    '</div>' +
  '</div>' +
  '</li>';
  return html;
}
function v2smEmptyHTML(counts, filter) {
  if (!counts.total) return '<li class="v2-summary__empty">' + v2smIcon('info', 16) + '<span>Esta sesión no registró respuestas. El resumen aparecerá cuando contestes al menos una pregunta.</span></li>';
  if (filter === 'wrong') return '<li class="v2-summary__empty">' + v2smIcon('checkCircle', 16) + '<span>No hay errores entre las ' + counts.total + ' preguntas. Cambia a «Todas» para repasar también los aciertos.</span></li>';
  return '<li class="v2-summary__empty">' + v2smIcon('info', 16) + '<span>No hay preguntas disponibles para este resumen.</span></li>';
}
function v2smListHTML(result, items, filter) {
  var counts = v2smCounts(items);
  var list = v2smFiltered(items, filter);
  if (!list.length) return v2smEmptyHTML(counts, filter);
  var html = '';
  for (var i = 0; i < list.length; i++) {
    html += v2smItemHTML(result, list[i], i, list.length);
  }
  return html;
}
function v2smHtml(result) {
  try {
    if (!result) return '';
    var items = v2smSorted(v2smEntriesFrom(result));
    var counts = v2smCounts(items);
    var modeLabel = v2smModeLabel(result);
    var verdict = v2smVerdictLine(result);
    var note = v2smModeNote(result);
    return '<section class="v2-summary" data-v2-summary data-mode="' + v2smEsc(result.mode || '') + '" data-filter="all" aria-labelledby="v2-summary-title">' +
      '<div class="v2-summary__head">' +
        '<div class="v2-summary__headText">' +
          '<span class="v2-summary__eyebrow"><span class="v2-summary__eyebrowDot"></span>Resumen del nivel · ' + v2smEsc(modeLabel) + '</span>' +
          '<h2 class="v2-summary__title" id="v2-summary-title">Preguntas y corrección</h2>' +
          '<p class="v2-summary__sub">' + v2smEsc(verdict) + ' ' + v2smEsc(note) + '</p>' +
        '</div>' +
        '<div class="v2-summary__score" aria-label="Puntuación ' + v2smEsc(v2smFormat(v2smScore(result))) + ' puntos"><b>' + v2smEsc(v2smFormat(v2smScore(result))) + '</b><small>pts</small><em>' + v2smAccuracy(result) + ' %</em></div>' +
      '</div>' +
      v2smTotalsHTML(result) +
      v2smToolbarHTML(counts) +
      '<ol class="v2-summary__list" data-v2-summary-list>' + v2smListHTML(result, items, 'all') + '</ol>' +
      '<p class="v2-summary__status" role="status" aria-live="polite" data-v2-summary-status>' + v2smEsc(v2smStatusText(counts, 'all')) + '</p>' +
      '<p class="v2-summary__foot">' + v2smIcon('shield', 11) + ' Las respuestas ya quedaron guardadas y los fallos conservan su cita de repaso. Esta pantalla no cambia recompensas ni el tope diario.</p>' +
    '</section>';
  } catch (error) {
    v2smSoft(error);
    return '';
  }
}

/* -------------------------------------------------------------------------
   Flashcard local
   ------------------------------------------------------------------------- */
function v2smSourceLine(question) {
  var bits = [];
  if (question.examTitle) bits.push(question.examTitle);
  if (question.origin && question.origin !== question.examTitle) bits.push(question.origin);
  if (question.page != null && question.page !== '') bits.push('p. ' + question.page);
  if (question.cycle) bits.push(question.cycle);
  bits.push(v2smSourceLabel(question));
  if (v2smGenerated(question)) bits.push('Generada');
  return bits.join(' · ');
}
function v2smFlashHTML(question) {
  var keyOption = v2smOption(question, question.answer);
  var keyText = keyOption ? keyOption.text : '';
  var full = question.explanation ? String(question.explanation).replace(/\s+/g, ' ').trim() : '';
  var explanation = full ? v2smSmartTrim(full, 1400) : v2smExplanation(question).text;
  var options = '';
  var i;
  if (question.options && question.options.length) {
    for (i = 0; i < question.options.length; i++) {
      var option = question.options[i];
      var isKey = option && String(option.id) === String(question.answer);
      options += '<li class="v2-summary-flash__option' + (isKey ? ' is-key' : '') + '">' +
        '<span class="v2-summary-flash__letter">' + v2smEsc(option && option.id) + '</span>' +
        '<span>' + v2smEsc(option && option.text) + '</span></li>';
    }
    options = '<ol class="v2-summary-flash__options">' + options + '</ol>';
  }
  var tags = '';
  if (question.tags && question.tags.length) {
    tags = '<div class="v2-summary-flash__tags">';
    for (i = 0; i < question.tags.length && i < 8; i++) {
      tags += '<span class="v2-summary-flash__tag">' + v2smEsc(question.tags[i]) + '</span>';
    }
    tags += '</div>';
  }
  return '<div class="v2-summary-flash__backdrop" data-action="v2-summary-flash-close" aria-hidden="true"></div>' +
    '<div class="v2-summary-flash__panel" role="document">' +
      '<div class="v2-summary-flash__head">' +
        '<div><span class="v2-summary-flash__eyebrow">Flashcard local · ' + v2smEsc(v2smAreaLabel(question.areaId)) + '</span>' +
          '<h2 class="v2-summary-flash__title" id="v2-summary-flash-title">Ficha de estudio</h2></div>' +
        '<button type="button" class="v2-summary-flash__close" data-action="v2-summary-flash-close" aria-label="Cerrar la flashcard">' + v2smIcon('close', 16) + '</button>' +
      '</div>' +
      '<div class="v2-summary-flash__body">' +
        (v2smGenerated(question) ? '<p class="v2-summary-flash__generated">' + v2smIcon('info', 11) + ' Pregunta generada desde una ficha o tarjeta de estudio.</p>' : '') +
        '<p class="v2-summary-flash__stem">' + v2smEsc(question.stem || '') + '</p>' +
        '<div class="v2-summary-flash__key"><span>Correcta · ' + v2smEsc(question.answer || '—') + '</span><b>' + v2smEsc(keyText || '—') + '</b></div>' +
        options +
        '<div class="v2-summary-flash__block"><span class="v2-summary-flash__blockTitle">Explicación</span><p>' + v2smEsc(explanation) + '</p></div>' +
        '<div class="v2-summary-flash__block"><span class="v2-summary-flash__blockTitle">Fuente</span><p>' + v2smEsc(v2smSourceLine(question)) + '</p></div>' +
        tags +
      '</div>' +
      '<div class="v2-summary-flash__foot"><span>Contenido local · sin conexión</span><button type="button" class="btn btn--ghost btn--sm" data-action="v2-summary-flash-close">Volver al resumen</button></div>' +
    '</div>';
}
function v2smFlashFocusables() {
  var layer = v2smState.flashRoot;
  var out = [];
  if (!layer || !layer.querySelectorAll) return out;
  var nodes = [];
  try { nodes = layer.querySelectorAll('button'); } catch (e) { nodes = []; }
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && !nodes[i].disabled) out.push(nodes[i]);
  }
  return out;
}
function v2smTrapFocus(backwards) {
  var layer = v2smState.flashRoot;
  if (!layer) return;
  var nodes = v2smFlashFocusables();
  if (!nodes.length) {
    try { layer.focus(); } catch (e) {}
    return;
  }
  var active = null;
  try { active = document.activeElement; } catch (e) {}
  var index = -1;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] === active) { index = i; break; }
  }
  var next;
  if (index === -1) next = backwards ? nodes.length - 1 : 0;
  else next = (index + (backwards ? -1 : 1) + nodes.length) % nodes.length;
  try { nodes[next].focus({ preventScroll: true }); } catch (e) {
    try { nodes[next].focus(); } catch (e2) {}
  }
}
function v2smOpenFlashcard(questionId, trigger) {
  try {
    if (!questionId) return false;
    var question = v2smQuestion(questionId);
    if (!question) return false;
    if (v2smState.flashRoot) v2smCloseFlashcard(false);
    if (typeof document === 'undefined' || !document.body) return false;
    var layer = document.createElement('div');
    layer.className = 'v2-summary-flash';
    layer.setAttribute('data-v2-summary-flash', 'overlay');
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'v2-summary-flash-title');
    layer.setAttribute('tabindex', '-1');
    layer.innerHTML = v2smFlashHTML(question);
    if (v2smState.clickHandler) layer.addEventListener('click', v2smState.clickHandler, false);
    document.body.appendChild(layer);
    v2smState.flashRoot = layer;
    v2smState.flashReturnFocus = trigger || (document.activeElement || null);
    var closeButton = null;
    try { closeButton = layer.querySelector('[data-action="v2-summary-flash-close"]'); } catch (e) {}
    if (closeButton && closeButton.focus) {
      try { closeButton.focus({ preventScroll: true }); } catch (e) {
        try { closeButton.focus(); } catch (e2) {}
      }
    } else {
      try { layer.focus(); } catch (e) {}
    }
    v2smEmit('flashcard:open', { questionId: questionId });
    return true;
  } catch (error) {
    v2smSoft(error);
    return false;
  }
}
function v2smCloseFlashcard(restoreFocus) {
  var layer = v2smState.flashRoot;
  if (!layer) return false;
  v2smState.flashRoot = null;
  try {
    if (layer.removeEventListener && v2smState.clickHandler) layer.removeEventListener('click', v2smState.clickHandler, false);
  } catch (e) {}
  if (layer.parentNode) {
    try { layer.parentNode.removeChild(layer); } catch (e) {}
  }
  var target = v2smState.flashReturnFocus;
  v2smState.flashReturnFocus = null;
  if (restoreFocus && target && target.focus) {
    try {
      var focusTarget = target;
      window.setTimeout(function () {
        try {
          if (!focusTarget || !focusTarget.focus) return;
          if (document.contains && !document.contains(focusTarget)) return;
          focusTarget.focus();
        } catch (e) {}
      }, 0);
    } catch (e) {}
  }
  v2smEmit('flashcard:close');
  return true;
}

/* -------------------------------------------------------------------------
   Filtros y ajustes del resumen
   ------------------------------------------------------------------------- */
function v2smSetFilter(filter) {
  var next = filter === 'wrong' ? 'wrong' : 'all';
  v2smState.filter = next;
  v2smSyncFilterUI();
  v2smEmit('filter', { filter: next });
  return next;
}
function v2smSyncFilterUI() {
  var root = v2smState.root;
  if (!root) return;
  try { root.setAttribute('data-filter', v2smState.filter); } catch (e) {}
  var items = v2smState.items || [];
  var counts = v2smCounts(items);
  var buttons = [];
  try { buttons = root.querySelectorAll('[data-action="v2-summary-filter"]'); } catch (e) { buttons = []; }
  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    if (!button) continue;
    var filter = button.getAttribute('data-filter');
    var active = filter === v2smState.filter;
    if (active) button.classList.add('is-active');
    else button.classList.remove('is-active');
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    var counter = null;
    try { counter = button.querySelector('em'); } catch (e) {}
    if (counter) counter.textContent = String(filter === 'wrong' ? counts.errors : counts.total);
  }
  var listEl = null;
  try { listEl = root.querySelector('[data-v2-summary-list]'); } catch (e) {}
  if (listEl) listEl.innerHTML = v2smListHTML(v2smState.result, items, v2smState.filter);
  var statusEl = null;
  try { statusEl = root.querySelector('[data-v2-summary-status]'); } catch (e) {}
  if (statusEl) statusEl.textContent = v2smStatusText(counts, v2smState.filter);
}
function v2smApplyDifficultButton(button, on) {
  if (!button || !button.classList) return;
  if (on) button.classList.add('is-on');
  else button.classList.remove('is-on');
  button.setAttribute('aria-pressed', on ? 'true' : 'false');
  var label = null;
  try { label = button.querySelector('[data-v2-summary-difficult-label]'); } catch (e) {}
  if (label) label.textContent = on ? 'Marcada como difícil' : 'Marcar como difícil';
}
function v2smFallbackDifficult(questionId) {
  try {
    if (typeof state === 'undefined' || !state) return false;
    state.questionTags = state.questionTags || {};
    var tag = state.questionTags[questionId] || { difficult: false, favorite: false };
    tag.difficult = !tag.difficult;
    tag.updatedAt = new Date().toISOString();
    if (!tag.difficult && !tag.favorite) delete state.questionTags[questionId];
    else state.questionTags[questionId] = tag;
    if (typeof persist === 'function') persist();
    return !!tag.difficult;
  } catch (e) {
    return false;
  }
}
function v2smToggleDifficult(button) {
  var questionId = button ? button.getAttribute('data-question') : '';
  if (!questionId || !v2smQuestion(questionId)) return false;
  try {
    if (typeof toggleQuestionTag === 'function') {
      toggleQuestionTag(questionId, 'difficult');
    } else {
      v2smFallbackDifficult(questionId);
      try {
        if (typeof toast === 'function') toast(v2smIsDifficult(questionId) ? 'Marcada como difícil.' : 'Marca retirada.', 'success', 1800);
      } catch (e) {}
    }
  } catch (error) {
    v2smSoft(error);
  }
  var on = v2smIsDifficult(questionId);
  v2smApplyDifficultButton(button, on);
  v2smEmit('difficult', { questionId: questionId, difficult: on });
  return on;
}

/* -------------------------------------------------------------------------
   Eventos
   ------------------------------------------------------------------------- */
function v2smOnClick(event) {
  var node = event && event.target;
  var actionEl = node && node.closest ? node.closest('[data-action]') : null;
  if (!actionEl) return;
  var action = actionEl.getAttribute('data-action') || '';
  if (action.indexOf('v2-summary-') !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  try {
    if (typeof initAudio === 'function') initAudio();
  } catch (e) {}
  switch (action) {
    case 'v2-summary-filter':
      v2smSetFilter(actionEl.getAttribute('data-filter'));
      break;
    case 'v2-summary-difficult':
      v2smToggleDifficult(actionEl);
      break;
    case 'v2-summary-flashcard':
      v2smOpenFlashcard(actionEl.getAttribute('data-question'), actionEl);
      break;
    case 'v2-summary-flash-close':
      v2smCloseFlashcard(true);
      break;
  }
}
function v2smFilterButtons() {
  var root = v2smState.root;
  var out = [];
  if (!root || !root.querySelectorAll) return out;
  try { out = root.querySelectorAll('[data-action="v2-summary-filter"]'); } catch (e) { out = []; }
  return out;
}
function v2smOnKeydown(event) {
  var key = event.key || '';
  var code = event.code || '';
  if (key === 'Escape' || key === 'Esc' || code === 'Escape') {
    if (v2smState.flashRoot) {
      event.preventDefault();
      event.stopPropagation();
      v2smCloseFlashcard(true);
    }
    return;
  }
  if (code === 'ArrowLeft' || code === 'ArrowRight' || key === 'ArrowLeft' || key === 'ArrowRight') {
    var node = event.target;
    var button = node && node.closest ? node.closest('[data-action="v2-summary-filter"]') : null;
    if (!button) return;
    var buttons = v2smFilterButtons();
    if (!buttons.length) return;
    var index = -1;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i] === button) { index = i; break; }
    }
    if (index === -1) return;
    var backwards = code === 'ArrowLeft' || key === 'ArrowLeft';
    var next = (index + (backwards ? -1 : 1) + buttons.length) % buttons.length;
    event.preventDefault();
    event.stopPropagation();
    try { buttons[next].focus(); } catch (e) {}
  }
}
function v2smOnDocKeydown(event) {
  if (!v2smState.flashRoot) return;
  var key = event.key || '';
  var code = event.code || '';
  if (key === 'Escape' || key === 'Esc' || code === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    v2smCloseFlashcard(true);
    return;
  }
  if (key === 'Tab' || code === 'Tab') {
    event.preventDefault();
    event.stopPropagation();
    v2smTrapFocus(!!event.shiftKey);
    return;
  }
  if (key === 'Enter' || code === 'Enter' || code === 'NumpadEnter' || key === ' ' || code === 'Space' || key === 'Spacebar') {
    /* El botón enfocado conserva su activación nativa; el juego no recibe la tecla. */
    event.stopPropagation();
    return;
  }
  if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight' ||
      key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
    event.preventDefault();
    event.stopPropagation();
  }
}

/* -------------------------------------------------------------------------
   Montaje y desmontaje
   ------------------------------------------------------------------------- */
function v2smMount(result) {
  try {
    v2smUnmount();
    if (typeof document === 'undefined' || !document.querySelector) return false;
    var root = document.querySelector('[data-v2-summary]');
    if (!root) return false;
    var current = result;
    if (!current) {
      try { if (typeof lastResult !== 'undefined' && lastResult) current = lastResult; } catch (e) {}
    }
    v2smState.root = root;
    v2smState.result = current || null;
    v2smState.items = v2smSorted(v2smEntriesFrom(v2smState.result));
    v2smState.filter = 'all';
    v2smState.clickHandler = function (event) { v2smOnClick(event); };
    v2smState.keyHandler = function (event) { v2smOnKeydown(event); };
    v2smState.docKeyHandler = function (event) { v2smOnDocKeydown(event); };
    if (root.addEventListener) {
      root.addEventListener('click', v2smState.clickHandler, false);
      root.addEventListener('keydown', v2smState.keyHandler, false);
    }
    if (document.addEventListener) document.addEventListener('keydown', v2smState.docKeyHandler, true);
    v2smState.mounted = true;
    v2smSyncFilterUI();
    v2smEmit('mount', {
      mode: current ? current.mode : null,
      questions: v2smState.items.length
    });
    return true;
  } catch (error) {
    v2smSoft(error);
    return false;
  }
}
function v2smUnmount() {
  try { v2smCloseFlashcard(false); } catch (e) {}
  var root = v2smState.root;
  if (root && root.removeEventListener) {
    if (v2smState.clickHandler) {
      try { root.removeEventListener('click', v2smState.clickHandler, false); } catch (e) {}
    }
    if (v2smState.keyHandler) {
      try { root.removeEventListener('keydown', v2smState.keyHandler, false); } catch (e) {}
    }
  }
  if (v2smState.docKeyHandler && typeof document !== 'undefined' && document.removeEventListener) {
    try { document.removeEventListener('keydown', v2smState.docKeyHandler, true); } catch (e) {}
  }
  v2smState.root = null;
  v2smState.result = null;
  v2smState.items = [];
  v2smState.filter = 'all';
  v2smState.mounted = false;
  v2smState.clickHandler = null;
  v2smState.keyHandler = null;
  v2smState.docKeyHandler = null;
  return true;
}
function v2smRefresh() {
  if (!v2smState.mounted || !v2smState.root) return false;
  try {
    var current = v2smState.result;
    if (!current) {
      try { if (typeof lastResult !== 'undefined' && lastResult) current = lastResult; } catch (e) {}
    }
    v2smState.result = current || null;
    v2smState.items = v2smSorted(v2smEntriesFrom(v2smState.result));
    v2smSyncFilterUI();
    v2smEmit('refresh', { questions: v2smState.items.length });
    return true;
  } catch (error) {
    v2smSoft(error);
    return false;
  }
}

/* -------------------------------------------------------------------------
   API pública
   ------------------------------------------------------------------------- */
var v2smAPI = {
  html: v2smHtml,
  mount: v2smMount,
  unmount: v2smUnmount,
  refresh: v2smRefresh
};

try {
  if (typeof V2 !== 'undefined' && V2) {
    if (typeof V2.register === 'function') V2.register('summary', v2smAPI);
    else V2.summary = v2smAPI;
  }
} catch (error) {
  v2smSoft(error);
}
