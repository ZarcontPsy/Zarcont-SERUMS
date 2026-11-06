/* =========================================================================
   COSMÉTICOS — catálogo final, progreso, propiedad, equipamiento y tienda
   ========================================================================= */
var ALL_COSMETICS = CAMP.cosmetics.slice();
var COSMETIC_SLOT_ORDER = CAMP.cosmeticCategories.map(function (s) { return s.id; });
var COSMETIC_SLOT_LOOKUP = {};
CAMP.cosmeticCategories.forEach(function (s) { COSMETIC_SLOT_LOOKUP[s.id] = s; });
var EXTRA_SLOTS = ['mascota', 'estela', 'titulo'];
var ALL_HERO_IDS = CAMP.characters.map(function (c) { return c.id; });
var RARITY_UI = {
  inicial: { label: 'Inicial', color: '#B8C1D0', glow: '#8B98AF', order: 0 },
  comun: { label: 'Común', color: '#AEB6C8', glow: '#78859A', order: 1 },
  poco_comun: { label: 'Poco común', color: '#78D5A5', glow: '#42B386', order: 2 },
  raro: { label: 'Raro', color: '#7AA2FF', glow: '#4F79E8', order: 3 },
  epico: { label: 'Épico', color: '#C49BFF', glow: '#965DE1', order: 4 },
  legendario: { label: 'Legendario', color: '#F3C978', glow: '#E5A742', order: 5 }
};
var RARITY_ORDER = Object.keys(RARITY_UI).sort(function (a, b) { return RARITY_UI[a].order - RARITY_UI[b].order; });
function rarityUI(key) { return RARITY_UI[key] || RARITY_UI.comun; }
function isExtraCosmetic(c) { return !!(c && c.isExtra); }
function cosmeticOwned(id) { return state.collection.ownedCosmeticIds.indexOf(id) !== -1; }
function cosmeticById(id) { return COSMETIC_BY_ID[id] || null; }
function cosmeticSlotLabel(id) { return COSMETIC_SLOT_LOOKUP[id] ? COSMETIC_SLOT_LOOKUP[id].label : id; }
function cosmeticsInSlot(slot) {
  return ALL_COSMETICS.filter(function (c) { return c.category === slot; });
}
function ownedCosmetics() { return state.collection.ownedCosmeticIds.slice(); }
function countOwnedCosmetics() { return state.collection.ownedCosmeticIds.length; }
function countAllCosmetics() { return ALL_COSMETICS.length; }

/* -------------------------------------------------------------------------
   Métricas de progreso
   ------------------------------------------------------------------------- */
function currentStreakForCosmetics() {
  return Math.max(Number(state.daily.streak) || 0, Number(state.daily.bestStreak) || 0);
}
function recoveredQuestionCount() {
  return Object.keys(state.errors).filter(function (id) {
    return state.errors[id] && state.errors[id].recoveredAt && QUESTION_BY_ID[id];
  }).length;
}
function achievementsOwnedCount() {
  return Object.keys(state.achievements).filter(function (id) { return ACHIEVEMENT_BY_ID[id]; }).length;
}
function areaRegularMissions(areaId) {
  return CAMP.missions.filter(function (m) { return m.areaId === areaId && m.kind === 'mission'; });
}
function areaMasteredCount(areaId, threshold) {
  var list = areaRegularMissions(areaId);
  var best = Number(threshold) || 0.8;
  return list.filter(function (m) {
    var rec = state.missions[m.id];
    return rec && rec.completedAt && Number(rec.bestAccuracy) >= best;
  }).length;
}
function totalRegularMissions(areaId) { return areaRegularMissions(areaId).length; }
function bossRecord(bossId) { return state.missions[bossId] || null; }
function bossCompleted(bossId) {
  var rec = bossRecord(bossId);
  return !!(rec && rec.completedAt);
}
function bossBestAccuracy(bossId) {
  var rec = bossRecord(bossId);
  return rec ? Math.max(0, Number(rec.bestAccuracy) || 0) : 0;
}
function isoWeekKey(date) {
  var d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  var week1 = new Date(d.getFullYear(), 0, 4);
  return d.getFullYear() + '-W' + String(1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0');
}
function recordLearningDay(now) {
  var at = now ? new Date(now) : new Date();
  var today = dateKey(at);
  var previous = state.daily.lastCompletedDate;
  var previousStreak = Number(state.daily.streak) || 0;
  var grace = false;
  if (!previous) state.daily.streak = 1;
  else if (previous === today) return { changed: false, grace: false, streak: state.daily.streak };
  else {
    var prevDate = new Date(previous + 'T00:00:00');
    var diff = Math.round((new Date(today + 'T00:00:00').getTime() - prevDate.getTime()) / 86400000);
    if (diff <= 0) return { changed: false, grace: false, streak: state.daily.streak };
    if (diff === 1) state.daily.streak = previousStreak + 1;
    else if (diff === 2) {
      var week = isoWeekKey(at);
      if (state.daily.graceWeek !== week) {
        state.daily.graceWeek = week;
        grace = true;
        state.daily.streak = previousStreak + 1;
      } else {
        state.daily.streak = 1;
      }
    } else {
      state.daily.streak = 1;
    }
  }
  state.daily.lastCompletedDate = today;
  state.daily.totalCompleted = (Number(state.daily.totalCompleted) || 0) + 1;
  state.daily.bestStreak = Math.max(Number(state.daily.bestStreak) || 0, Number(state.daily.streak) || 0);
  return { changed: true, grace: grace, streak: state.daily.streak, best: state.daily.bestStreak };
}
function achievementMetricFor(id) {
  var def = ACHIEVEMENT_BY_ID[id];
  if (!def) return 0;
  var metrics = achievementMetrics();
  var have = Number(metrics[def.metric]) || 0;
  if (def.metric === 'accuracy' && metrics.answered < 20) have = 0;
  return Math.min(Number(def.target) || 0, Math.max(0, have));
}
function achievementUnlockedFor(id) { return !!(state.achievements[id] && state.achievements[id].unlockedAt); }

/* -------------------------------------------------------------------------
   Requisitos de cada cosmético
   ------------------------------------------------------------------------- */
function originalUnlockInfo(c) {
  var req = c.unlockRequirements || null;
  var level = currentLevel();
  var coins = state.coins;
  var levelNeed = req && req.kind === 'level' ? Number(req.level) || 0 : 0;
  var achievementId = req && req.kind === 'achievement' ? req.achievementId : null;
  var achievementDef = achievementId ? ACHIEVEMENT_BY_ID[achievementId] : null;
  var achievementOk = !achievementId || achievementUnlockedFor(achievementId);
  var levelOk = !levelNeed || level >= levelNeed;
  var price = Number(c.price) || 0;
  var coinsOk = coins >= price;
  var canBuy = levelOk && achievementOk && coinsOk;
  var requirementText = '';
  if (levelNeed) requirementText = 'Nivel ' + levelNeed + ' + ◇' + formatNumber(price);
  else if (achievementDef) requirementText = 'Logro «' + achievementDef.name + '» + ◇' + formatNumber(price);
  else requirementText = 'Tienda · ◇' + formatNumber(price);
  var conditionsTotal = (levelNeed ? 1 : 0) + (achievementId ? 1 : 0) + (price ? 1 : 0);
  var conditionsMet = (levelNeed ? (levelOk ? 1 : 0) : 0) + (achievementId ? (achievementOk ? 1 : 0) : 0) + (price ? (coinsOk ? 1 : 0) : 0);
  return {
    kind: 'shop',
    canUnlock: canBuy,
    canBuy: canBuy,
    price: price,
    levelNeed: levelNeed,
    levelOk: levelOk,
    achievementId: achievementId,
    achievementOk: achievementOk,
    coinsOk: coinsOk,
    requirementText: requirementText,
    pct: conditionsTotal ? conditionsMet / conditionsTotal : 1,
    owned: cosmeticOwned(c.id)
  };
}
function extraRequirementInfo(c) {
  var req = c.unlockRequirements || {};
  var kind = req.kind;
  var current = 0, target = 1, label = '', unit = '', can = false;
  var ext = {};
  if (kind === 'streak') {
    current = currentStreakForCosmetics();
    target = Number(req.target) || 7;
    label = 'días de constancia';
    can = current >= target;
  } else if (kind === 'recoveries') {
    current = recoveredQuestionCount();
    target = Number(req.target) || 10;
    label = 'errores recuperados';
    can = current >= target;
  } else if (kind === 'onTimeReviewSessions') {
    current = Number(state.reviews.onTimeSessions) || 0;
    target = Number(req.target) || 10;
    label = 'repasos en su ventana programada';
    can = current >= target;
  } else if (kind === 'earlyReviewSessions') {
    current = Number(state.reviews.earlySessions) || 0;
    target = Number(req.target) || 5;
    label = 'repasos anticipados';
    can = current >= target;
  } else if (kind === 'areaMastery') {
    var total = totalRegularMissions(req.areaId);
    current = areaMasteredCount(req.areaId, req.accuracy || 0.8);
    target = total;
    label = 'misiones al ' + Math.round((Number(req.accuracy) || 0.8) * 100) + ' %';
    can = total > 0 && current >= total;
    ext.areaId = req.areaId;
    ext.total = total;
  } else if (kind === 'areaMasteryGold') {
    var baseMap = {
      'area-psi-salud-publica': 'x-dominio-salud',
      'area-psi-cuidado-integral': 'x-dominio-cuidado',
      'area-psi-etica': 'x-dominio-etica',
      'area-psi-investigacion': 'x-dominio-investigacion',
      'area-psi-gestion': 'x-dominio-gestion'
    };
    var baseId = baseMap[req.areaId];
    var baseOwned = baseId ? cosmeticOwned(baseId) : false;
    var accuracy = bossBestAccuracy(req.bossId);
    current = Math.round(accuracy * 100);
    target = Math.round((Number(req.bossAccuracy) || 0.9) * 100);
    label = 'precisión en el jefe';
    can = baseOwned && bossCompleted(req.bossId) && accuracy >= (Number(req.bossAccuracy) || 0.9);
    ext.baseOwned = baseOwned;
    ext.bossId = req.bossId;
    ext.baseId = baseId;
    if (!baseOwned) label = 'primero consigue su tocado de maestría';
  } else if (kind === 'bossDefeated') {
    current = bossCompleted(req.bossId) ? 1 : 0;
    target = 1;
    label = 'guardían derrotado';
    can = !!current;
    ext.bossId = req.bossId;
  } else if (kind === 'bossMastery') {
    current = Math.round(bossBestAccuracy(req.bossId) * 100);
    target = Math.round((Number(req.accuracy) || 0.8) * 100);
    label = 'en el jefe';
    can = bossCompleted(req.bossId) && bossBestAccuracy(req.bossId) >= (Number(req.accuracy) || 0.8);
    ext.bossId = req.bossId;
  } else if (kind === 'level') {
    current = currentLevel();
    target = Number(req.target) || 5;
    label = 'nivel global';
    can = current >= target;
  } else if (kind === 'achievements') {
    current = achievementsOwnedCount();
    target = Number(req.target) || 3;
    label = 'logros';
    can = current >= target;
  } else if (kind === 'achievement') {
    current = achievementMetricFor(req.achievementId);
    var def = ACHIEVEMENT_BY_ID[req.achievementId];
    target = def ? Number(def.target) || 1 : 1;
    label = def ? 'logro «' + def.name + '»' : 'logro';
    can = achievementUnlockedFor(req.achievementId);
  } else if (kind === 'rank') {
    current = currentRank().id === req.rankId ? 1 : 0;
    target = 1;
    label = 'rango «' + (CAMP.rules.ranks.find(function (r) { return r.id === req.rankId; }) || {}).name + '»';
    can = current >= 1;
  }
  var nextTier = null;
  if (Array.isArray(req.tiers)) {
    for (var i = 0; i < req.tiers.length; i++) {
      if (Number(req.tiers[i]) > current) { nextTier = Number(req.tiers[i]); break; }
    }
  }
  var requirementText = '';
  if (kind === 'streak') requirementText = 'Mejor racha de constancia: ' + target + ' días';
  else if (kind === 'recoveries') requirementText = 'Recupera ' + target + ' preguntas falladas';
  else if (kind === 'onTimeReviewSessions') requirementText = 'Completa ' + target + ' repasos en su ventana programada';
  else if (kind === 'earlyReviewSessions') requirementText = 'Completa ' + target + ' repasos anticipados';
  else if (kind === 'areaMastery') requirementText = 'Completa todas las misiones del área con ≥' + Math.round((Number(req.accuracy) || 0.8) * 100) + ' %';
  else if (kind === 'areaMasteryGold') requirementText = 'Consigue el tocado base y supera al jefe con ≥' + Math.round((Number(req.bossAccuracy) || 0.9) * 100) + ' %';
  else if (kind === 'bossDefeated') requirementText = 'Derrota al guardián del área';
  else if (kind === 'bossMastery') requirementText = 'Derrota al guardián con ≥' + Math.round((Number(req.accuracy) || 0.8) * 100) + ' %';
  else if (kind === 'level') requirementText = 'Nivel global ' + target;
  else if (kind === 'achievements') requirementText = 'Consigue ' + target + ' logros de aprendizaje';
  else if (kind === 'achievement') requirementText = 'Logro «' + ((ACHIEVEMENT_BY_ID[req.achievementId] || {}).name || req.achievementId) + '»';
  else if (kind === 'rank') requirementText = 'Alcanza el rango «' + ((CAMP.rules.ranks.find(function (r) { return r.id === req.rankId; }) || {}).name || req.rankId) + '»';
  var pct = target > 0 ? Math.min(1, current / target) : 1;
  return {
    kind: kind,
    canUnlock: can,
    requirementText: requirementText,
    pct: pct,
    current: current,
    target: target,
    label: label,
    nextTier: nextTier,
    extra: ext,
    owned: cosmeticOwned(c.id)
  };
}
function cosmeticRequirementInfo(c) {
  if (!c) return null;
  if (isExtraCosmetic(c)) return extraRequirementInfo(c);
  return originalUnlockInfo(c);
}
function cosmeticStage(c) {
  if (!c || !c.unlockRequirements || !Array.isArray(c.unlockRequirements.tiers)) return 1;
  var req = c.unlockRequirements;
  var reqInfo = extraRequirementInfo(c);
  var current = reqInfo ? Number(reqInfo.current) || 0 : 0;
  var stage = 1;
  req.tiers.forEach(function (tier) { if (current >= Number(tier)) stage += 1; });
  return Math.min(req.tiers.length + 1, stage);
}
function cosmeticRarityKey(c) {
  if (!c) return 'comun';
  if (Array.isArray(c.tierRarities)) {
    var stage = cosmeticStage(c) - 1;
    return c.tierRarities[Math.min(c.tierRarities.length - 1, Math.max(0, stage))] || c.rarity;
  }
  return c.rarity || 'comun';
}
function cosmeticRarityLabel(c) { return rarityUI(cosmeticRarityKey(c)).label; }
function cosmeticRarityColor(c) { return rarityUI(cosmeticRarityKey(c)).color; }
function cosmeticStageLabel(c) {
  if (!Array.isArray(c.stageLabels) || cosmeticStage(c) <= 1) return '';
  var stage = cosmeticStage(c);
  return 'Etapa ' + stage + ' · ' + c.stageLabels[Math.min(c.stageLabels.length - 1, stage - 1)];
}
function cosmeticProgressText(c) {
  var info = cosmeticRequirementInfo(c);
  if (!info) return '';
  if (cosmeticOwned(c.id)) {
    if (Array.isArray(c.stageLabels)) {
      var next = info.nextTier;
      return next ? 'Etapa ' + cosmeticStage(c) + ' de ' + (c.unlockRequirements.tiers.length + 1) + ' · siguiente a ' + next : 'Etapa final alcanzada';
    }
    return 'Poseído';
  }
  if (info.kind === 'shop') {
    if (info.levelNeed && !info.levelOk) return 'Nivel ' + info.levelNeed + ' · actual ' + currentLevel();
    if (info.achievementId && !info.achievementOk) {
      var def = ACHIEVEMENT_BY_ID[info.achievementId];
      return 'Logro «' + (def ? def.name : info.achievementId) + '» pendiente';
    }
    if (!info.coinsOk) return 'Te faltan ◇' + formatNumber((Number(c.price) || 0) - state.coins);
    return 'Disponible en la tienda';
  }
  if (info.nextTier) return info.label + ': ' + info.current + '/' + info.target + ' · siguiente ' + info.nextTier;
  return info.label + ': ' + info.current + '/' + info.target;
}
function nextCosmeticHint() {
  var candidates = [];
  ALL_COSMETICS.forEach(function (c) {
    if (cosmeticOwned(c.id)) return;
    var info = cosmeticRequirementInfo(c);
    if (!info) return;
    if (info.kind === 'shop') {
      // Para la tienda se sugiere cuando ya se cumplen los requisitos de nivel/logro.
      if (!info.levelOk || !info.achievementOk) return;
      var coinsRemaining = Math.max(0, (Number(c.price) || 0) - state.coins);
      if (coinsRemaining > 0) {
        candidates.push({
          cosmetic: c,
          priority: isExtraCosmetic(c) ? 1 : 0,
          pct: (Number(c.price) || 1) ? Math.min(1, state.coins / Number(c.price)) : 1,
          text: 'Te ' + (coinsRemaining === 1 ? 'falta' : 'faltan') + ' ◇' + formatNumber(coinsRemaining) + ' para «' + c.name + '».'
        });
      } else {
        candidates.push({ cosmetic: c, priority: 0, pct: 1, text: '«' + c.name + '» ya está disponible en la tienda.' });
      }
      return;
    }
    var remaining = Math.max(0, Number(info.target) - Number(info.current));
    if (remaining <= 0) return;
    var unit = '';
    if (info.kind === 'streak') unit = remaining === 1 ? 'día de constancia' : 'días de constancia';
    else if (info.kind === 'recoveries') unit = remaining === 1 ? 'error recuperado' : 'errores recuperados';
    else if (info.kind === 'onTimeReviewSessions') unit = remaining === 1 ? 'repaso en fecha' : 'repasos en fecha';
    else if (info.kind === 'earlyReviewSessions') unit = remaining === 1 ? 'repaso anticipado' : 'repasos anticipados';
    else if (info.kind === 'areaMastery') unit = remaining === 1 ? 'misión al ' + Math.round((info.extra && info.target ? (info.extra.accuracy || 80) : 80)) + ' %' : 'misiones al ' + Math.round(80) + ' %';
    else if (info.kind === 'level') unit = remaining === 1 ? 'nivel' : 'niveles';
    else if (info.kind === 'achievements') unit = remaining === 1 ? 'logro' : 'logros';
    else unit = 'paso';
    var text;
    if (info.kind === 'areaMastery') {
      var area = AREA_BY_ID[info.extra.areaId];
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' ' + (remaining === 1 ? 'misión al 80 %' : 'misiones al 80 %') + ' en ' + (area ? area.short : 'la ruta') + ' para «' + c.name + '».';
    } else if (info.kind === 'areaMasteryGold') {
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' punto' + (remaining === 1 ? '' : 's') + ' de precisión en el jefe para «' + c.name + '».';
    } else if (info.kind === 'bossDefeated') {
      text = 'Te falta derrotar al guardián para «' + c.name + '».';
    } else if (info.kind === 'bossMastery') {
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' punto' + (remaining === 1 ? '' : 's') + ' de precisión en el jefe para «' + c.name + '».';
    } else if (info.kind === 'achievement' || info.kind === 'rank') {
      text = 'Te falta el logro «' + info.label.replace('logro «', '').replace('»', '') + '» para «' + c.name + '».';
    } else {
      text = 'Te ' + (remaining === 1 ? 'falta' : 'faltan') + ' ' + remaining + ' ' + unit + ' para «' + c.name + '».';
    }
    candidates.push({ cosmetic: c, priority: isExtraCosmetic(c) ? 1 : 0, pct: info.pct, text: text });
  });
  candidates.sort(function (a, b) {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.pct !== a.pct) return b.pct - a.pct;
    return a.cosmetic.name.localeCompare(b.cosmetic.name);
  });
  return candidates[0] || null;
}

/* -------------------------------------------------------------------------
   Desbloqueo automático de extras
   ------------------------------------------------------------------------- */
function unlockProgressCosmetics() {
  var unlocked = [];
  var passes = 0;
  while (passes < 2) {
    ALL_COSMETICS.forEach(function (c) {
      if (!isExtraCosmetic(c) || cosmeticOwned(c.id)) return;
      var info = extraRequirementInfo(c);
      if (info && info.canUnlock) {
        state.collection.ownedCosmeticIds.push(c.id);
        unlocked.push(c);
      }
    });
    passes += 1;
  }
  return unlocked;
}

/* -------------------------------------------------------------------------
   Equipamiento
   ------------------------------------------------------------------------- */
function sanitizeOutfit(characterId, raw) {
  var out = {};
  var source = raw && typeof raw === 'object' ? raw : {};
  COSMETIC_SLOT_ORDER.forEach(function (slot) {
    var id = source[slot];
    var c = id ? COSMETIC_BY_ID[id] : null;
    if (c && c.category === slot && cosmeticOwned(c.id)) out[slot] = c.id;
  });
  return out;
}
function getCharacterOutfit(characterId) {
  var all = state.collection.equipped || {};
  return sanitizeOutfit(characterId || state.collection.selectedCharacterId, all[characterId || state.collection.selectedCharacterId]);
}
function healEquippedOutfits() {
  var raw = state.collection.equipped && typeof state.collection.equipped === 'object' ? state.collection.equipped : {};
  var out = {};
  Object.keys(raw).forEach(function (characterId) {
    if (!CHARACTER_BY_ID[characterId]) return;
    var clean = sanitizeOutfit(characterId, raw[characterId]);
    if (Object.keys(clean).length) out[characterId] = clean;
  });
  state.collection.equipped = out;
  if (state.collection.ownedCharacterIds.indexOf(state.collection.selectedCharacterId) === -1) state.collection.selectedCharacterId = state.collection.ownedCharacterIds[0];
  if (state.collection.ownedCosmeticIds.filter(function (id) { return COSMETIC_BY_ID[id]; }).length !== state.collection.ownedCosmeticIds.length) {
    state.collection.ownedCosmeticIds = state.collection.ownedCosmeticIds.filter(function (id) { return !!COSMETIC_BY_ID[id]; });
  }
}
function setCharacterOutfit(characterId, outfit) {
  var clean = sanitizeOutfit(characterId, outfit);
  state.collection.equipped = state.collection.equipped && typeof state.collection.equipped === 'object' ? state.collection.equipped : {};
  if (Object.keys(clean).length) state.collection.equipped[characterId] = clean;
  else delete state.collection.equipped[characterId];
  persist();
  if (characterId === state.collection.selectedCharacterId && heroAvatar && typeof applyOutfitToAvatar === 'function') {
    applyOutfitToAvatar(heroAvatar, characterId);
  }
  syncHUD();
}
function equippedTitle(characterId) {
  var outfit = getCharacterOutfit(characterId);
  var title = outfit.titulo ? COSMETIC_BY_ID[outfit.titulo] : null;
  return title || null;
}
function titleText(characterId) {
  var t = equippedTitle(characterId);
  return t ? t.name : '';
}

/* -------------------------------------------------------------------------
   Tienda de los 33 originales
   ------------------------------------------------------------------------- */
function shopCosmetics() {
  return ALL_COSMETICS.filter(function (c) { return !isExtraCosmetic(c) && Number(c.price) > 0; });
}
function buyCosmetic(id) {
  var c = COSMETIC_BY_ID[id];
  if (!c) return { ok: false, reason: 'Ese cosmético no existe.' };
  if (isExtraCosmetic(c)) return { ok: false, reason: 'Este cosmético no se compra: se gana jugando.' };
  if (cosmeticOwned(id)) return { ok: false, reason: 'Ya posees este cosmético.' };
  var info = originalUnlockInfo(c);
  if (info.levelNeed && !info.levelOk) return { ok: false, reason: 'Alcanza el nivel ' + info.levelNeed + ' primero.' };
  if (info.achievementId && !info.achievementOk) return { ok: false, reason: 'Primero consigue el logro «' + ((ACHIEVEMENT_BY_ID[info.achievementId] || {}).name || info.achievementId) + '».' };
  if (state.coins < info.price) return { ok: false, reason: 'Te faltan ◇' + formatNumber(info.price - state.coins) + '.' };
  state.coins -= info.price;
  state.collection.ownedCosmeticIds.push(id);
  state.economy = state.economy && typeof state.economy === 'object' ? state.economy : { transactions: [], lifetimeSpent: 0 };
  state.economy.transactions = Array.isArray(state.economy.transactions) ? state.economy.transactions : [];
  state.economy.transactions.unshift({ type: 'cosmetic', id: id, name: c.name, price: info.price, at: nowISO(), balanceAfter: state.coins });
  state.economy.transactions = state.economy.transactions.slice(0, 200);
  state.economy.lifetimeSpent = (Number(state.economy.lifetimeSpent) || 0) + info.price;
  persist();
  return { ok: true, cosmetic: c, price: info.price };
}
function refreshAllPortraits() {
  // Las claves de caché incluyen el atuendo; no es necesario vaciar.
  syncHudPortrait();
}

/* -------------------------------------------------------------------------
   Indicador de racha y avisos neutros
   ------------------------------------------------------------------------- */
function learningStreakText() {
  var streak = Number(state.daily.streak) || 0;
  var best = Number(state.daily.bestStreak) || 0;
  if (!best) return 'Aún sin días de constancia';
  return 'Racha de constancia: ' + streak + (streak === 1 ? ' día' : ' días') + ' · mejor: ' + best;
}
function dailyCoinCapReached() {
  return !!(state.counters && state.counters.date === dateKey() && Number(state.counters.coins) >= 120);
}
