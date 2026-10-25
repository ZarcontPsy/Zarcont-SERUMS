/* SERUMS QUEST - colección, compras y equipamiento
   © 2026 ZARCONT. Toda mutación recibe un borrador del estado del almacén y se
   confirma en un único commit. Ninguna compra se aplica si falla una comprobación. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var U = window.QuestUtil;
  var P = window.QuestProgression;
  var Chars = window.QuestCharacters;

  function cloneMap(value) {
    var out = {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return out;
    Object.keys(value).forEach(function (key) {
      var item = value[key];
      if (item && typeof item === "object" && !Array.isArray(item)) out[key] = Object.assign({}, item);
    });
    return out;
  }

  function uniqueKnown(list, lookup) {
    var out = [];
    var seen = {};
    (Array.isArray(list) ? list : []).forEach(function (id) {
      if (typeof id !== "string" || seen[id] || !lookup(id)) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  function defaultCollection() {
    return {
      ownedCharacterIds: [Chars.starterId],
      ownedCosmeticIds: [],
      selectedCharacterId: Chars.starterId,
      equipped: {},
      previousOutfits: {},
      unlockedBy: {
        ilan: { method: "starter", at: null, price: 0 }
      }
    };
  }

  function defaultEconomy() {
    return {
      transactions: [],
      lifetimeSpent: 0
    };
  }

  function defaultPresentation() {
    var defaults = C.rpg.presentationDefaults;
    return {
      animationPreferences: Object.assign({}, defaults.animationPreferences),
      visualPreferences: Object.assign({}, defaults.visualPreferences),
      audioPreferences: Object.assign({}, defaults.audioPreferences)
    };
  }

  function sanitizeSlotsFor(character, source, ownedCosmetics) {
    var out = {};
    if (!character || !source || typeof source !== "object") return out;
    character.slotIds.forEach(function (slotId) {
      var cosmeticId = source[slotId];
      if (typeof cosmeticId !== "string") return;
      if (ownedCosmetics.indexOf(cosmeticId) === -1) return;
      var cosmetic = Chars.cosmeticById(cosmeticId);
      if (!cosmetic || cosmetic.category !== slotId) return;
      if (!Chars.isCompatible(character.id, cosmeticId)) return;
      out[slotId] = cosmeticId;
    });
    return out;
  }

  function normalizeCollection(raw, context) {
    var input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    var ownedCharacters = uniqueKnown(input.ownedCharacterIds, Chars.byId);
    if (ownedCharacters.indexOf(Chars.starterId) === -1) ownedCharacters.unshift(Chars.starterId);
    var ownedCosmetics = uniqueKnown(input.ownedCosmeticIds, Chars.cosmeticById);
    var selected = typeof input.selectedCharacterId === "string" && ownedCharacters.indexOf(input.selectedCharacterId) !== -1
      ? input.selectedCharacterId
      : ownedCharacters[0];

    var equippedIn = cloneMap(input.equipped);
    var equipped = {};
    ownedCharacters.forEach(function (characterId) {
      var character = Chars.byId(characterId);
      var slots = sanitizeSlotsFor(character, equippedIn[characterId], ownedCosmetics);
      if (Object.keys(slots).length) equipped[characterId] = slots;
    });

    var previousIn = cloneMap(input.previousOutfits);
    var previousOutfits = {};
    ownedCharacters.forEach(function (characterId) {
      var character = Chars.byId(characterId);
      var slots = sanitizeSlotsFor(character, previousIn[characterId], ownedCosmetics);
      if (Object.keys(slots).length) previousOutfits[characterId] = slots;
    });

    var unlockedBy = {};
    ownedCharacters.forEach(function (characterId) {
      var entry = input.unlockedBy && input.unlockedBy[characterId] ? input.unlockedBy[characterId] : null;
      var character = Chars.byId(characterId);
      unlockedBy[characterId] = {
        method: entry && typeof entry.method === "string" ? entry.method.slice(0, 24) : (character && character.access.kind === "starter" ? "starter" : "unknown"),
        at: entry && entry.at ? String(entry.at).slice(0, 40) : null,
        price: Math.max(0, U.safeInt(entry && entry.price, 0))
      };
    });

    // Contexto opcional: conserva el personaje elegido si sigue siendo válido.
    if (context && context.collection && context.collection.selectedCharacterId &&
        ownedCharacters.indexOf(context.collection.selectedCharacterId) !== -1) {
      selected = context.collection.selectedCharacterId;
    }

    return {
      ownedCharacterIds: ownedCharacters,
      ownedCosmeticIds: ownedCosmetics,
      selectedCharacterId: selected,
      equipped: equipped,
      previousOutfits: previousOutfits,
      unlockedBy: unlockedBy
    };
  }

  function normalizeEconomy(raw) {
    var input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    var max = C.rpg.shop.maxTransactions;
    var transactions = (Array.isArray(input.transactions) ? input.transactions : [])
      .filter(function (tx) {
        return tx && typeof tx === "object" && typeof tx.kind === "string" && typeof tx.itemId === "string";
      })
      .slice(0, max)
      .map(function (tx) {
        return {
          id: String(tx.id || U.uid("tx")).slice(0, 48),
          at: String(tx.at || "").slice(0, 40),
          kind: tx.kind === "cosmetic" ? "cosmetic" : "character",
          itemId: tx.itemId.slice(0, 64),
          name: String(tx.name || "").slice(0, 80),
          price: Math.max(0, U.safeInt(tx.price, 0)),
          balanceAfter: Math.max(0, U.safeInt(tx.balanceAfter, 0))
        };
      });
    return {
      transactions: transactions,
      lifetimeSpent: Math.max(0, U.safeInt(input.lifetimeSpent, 0))
    };
  }

  function normalizePresentation(raw) {
    var input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    var defaults = defaultPresentation();
    var animation = input.animationPreferences && typeof input.animationPreferences === "object" ? input.animationPreferences : {};
    var visual = input.visualPreferences && typeof input.visualPreferences === "object" ? input.visualPreferences : {};
    var audio = input.audioPreferences && typeof input.audioPreferences === "object" ? input.audioPreferences : {};
    Object.keys(defaults.animationPreferences).forEach(function (key) {
      defaults.animationPreferences[key] = animation[key] === undefined ? defaults.animationPreferences[key] : !!animation[key];
    });
    Object.keys(defaults.visualPreferences).forEach(function (key) {
      defaults.visualPreferences[key] = visual[key] === undefined ? defaults.visualPreferences[key] : !!visual[key];
    });
    defaults.audioPreferences.muted = audio.muted === undefined ? defaults.audioPreferences.muted : !!audio.muted;
    defaults.audioPreferences.music = audio.music === undefined ? defaults.audioPreferences.music : !!audio.music;
    var sfx = Number(audio.sfxVolume);
    var musicVol = Number(audio.musicVolume);
    defaults.audioPreferences.sfxVolume = Number.isFinite(sfx) ? Math.max(0, Math.min(1, sfx)) : defaults.audioPreferences.sfxVolume;
    defaults.audioPreferences.musicVolume = Number.isFinite(musicVol) ? Math.max(0, Math.min(1, musicVol)) : defaults.audioPreferences.musicVolume;
    return defaults;
  }

  /* ------------------------------------------------------------------ */
  /* Consultas                                                          */
  /* ------------------------------------------------------------------ */
  function collection(state) {
    return state && state.collection ? state.collection : defaultCollection();
  }

  function ownsCharacter(state, characterId) {
    return collection(state).ownedCharacterIds.indexOf(characterId) !== -1;
  }

  function ownsCosmetic(state, cosmeticId) {
    return collection(state).ownedCosmeticIds.indexOf(cosmeticId) !== -1;
  }

  function selectedCharacterId(state) {
    var coll = collection(state);
    if (coll.selectedCharacterId && ownsCharacter(state, coll.selectedCharacterId)) return coll.selectedCharacterId;
    return coll.ownedCharacterIds[0] || Chars.starterId;
  }

  function selectedCharacter(state) {
    return Chars.byId(selectedCharacterId(state)) || Chars.byId(Chars.starterId);
  }

  function equippedMap(state, characterId) {
    var coll = collection(state);
    return Object.assign({}, coll.equipped && coll.equipped[characterId] ? coll.equipped[characterId] : {});
  }

  function equippedList(state, characterId) {
    var map = equippedMap(state, characterId);
    return Object.keys(map).map(function (slotId) {
      return { slotId: slotId, cosmetic: Chars.cosmeticById(map[slotId]) };
    }).filter(function (entry) { return !!entry.cosmetic; });
  }

  function completedMissions(state) {
    var missions = state && state.missions ? state.missions : {};
    var count = 0;
    Object.keys(missions).forEach(function (id) {
      var mission = missions[id];
      if (mission && mission.completedAt && mission.kind !== "boss") count += 1;
    });
    return count;
  }

  function currentLevel(state) {
    return P.levelFromXp(state && state.xp ? state.xp : 0).level;
  }

  function missionCountFor(state) {
    if (state && state.missions) return completedMissions(state);
    return 0;
  }

  function requirementRows(state, requirements) {
    var rows = [];
    if (!requirements) return rows;
    if (requirements.level) {
      var level = currentLevel(state);
      rows.push({
        id: "level",
        label: "Nivel " + requirements.level,
        have: level,
        need: requirements.level,
        met: level >= requirements.level,
        suffix: ""
      });
    }
    if (requirements.missions) {
      var missions = missionCountFor(state);
      rows.push({
        id: "missions",
        label: "Misiones completadas",
        have: missions,
        need: requirements.missions,
        met: missions >= requirements.missions,
        suffix: ""
      });
    }
    if (requirements.stage) {
      var stage = Number(state && state.stage) || 1;
      rows.push({
        id: "stage",
        label: "Etapa " + (C.stages[requirements.stage] ? C.stages[requirements.stage].name : requirements.stage),
        have: stage,
        need: requirements.stage,
        met: stage >= requirements.stage,
        suffix: ""
      });
    }
    if (requirements.achievementId) {
      var unlocked = !!(state && state.achievements && state.achievements[requirements.achievementId] && state.achievements[requirements.achievementId].unlockedAt);
      var def = C.achievements.filter(function (a) { return a.id === requirements.achievementId; })[0];
      rows.push({
        id: "achievement",
        label: requirements.label || ("Logro «" + (def ? def.name : requirements.achievementId) + "»"),
        have: unlocked ? 1 : 0,
        need: 1,
        met: unlocked,
        suffix: ""
      });
    }
    return rows;
  }

  function characterRequirements(state, character) {
    if (!character) return [];
    var access = character.access || {};
    return requirementRows(state, {
      level: access.level,
      missions: access.missions,
      stage: access.stage,
      achievementId: access.achievementId,
      label: access.label
    });
  }

  function cosmeticRequirements(state, cosmetic) {
    if (!cosmetic || !cosmetic.unlockRequirements) return [];
    return requirementRows(state, cosmetic.unlockRequirements);
  }

  function requirementsMet(rows) {
    return rows.every(function (row) { return row.met; });
  }

  function characterStatus(state, character) {
    if (!character) return { status: "locked", requirements: [], canPurchase: false, reason: "Personaje no disponible." };
    var owned = ownsCharacter(state, character.id);
    var requirements = characterRequirements(state, character);
    var met = requirementsMet(requirements);
    var selected = selectedCharacterId(state) === character.id;
    var isReward = character.access.kind === "reward";
    var canPurchase = !owned && character.forSale && met;
    var status = owned ? "owned" : (canPurchase ? "available" : "locked");
    var reason;
    if (owned) reason = selected ? "Seleccionado." : "En tu colección.";
    else if (isReward && met) reason = "Requisito cumplido: se entregará al cerrar la próxima sesión.";
    else if (isReward) reason = "Recompensa de recorrido: no se compra con monedas.";
    else if (!met) reason = "Aún faltan requisitos para comprarlo.";
    else reason = "Disponible para comprar.";
    return {
      id: character.id,
      owned: owned,
      selected: selected,
      isReward: isReward,
      status: status,
      canPurchase: canPurchase,
      met: met,
      requirements: requirements,
      price: character.price,
      reason: reason
    };
  }

  function cosmeticStatus(state, cosmetic) {
    if (!cosmetic) return { status: "locked", requirements: [], canPurchase: false, reason: "Objeto no disponible." };
    var owned = ownsCosmetic(state, cosmetic.id);
    var requirements = cosmeticRequirements(state, cosmetic);
    var met = requirementsMet(requirements);
    var canPurchase = !owned && !cosmetic.unlockRequirements && cosmetic.price > 0;
    return {
      id: cosmetic.id,
      owned: owned,
      status: owned ? "owned" : (canPurchase && met ? "available" : "locked"),
      canPurchase: canPurchase && met,
      met: met,
      requirements: requirements,
      price: cosmetic.price,
      reason: owned ? "En tu inventario." : (cosmetic.unlockRequirements ? "Se obtiene con un logro." : "Disponible en la tienda.")
    };
  }

  /* ------------------------------------------------------------------ */
  /* Filtros                                                            */
  /* ------------------------------------------------------------------ */
  function sortCharacters(list, sort) {
    var copy = list.slice();
    if (sort === "priceAsc") return copy.sort(function (a, b) { return a.price - b.price || a.name.localeCompare(b.name, "es"); });
    if (sort === "priceDesc") return copy.sort(function (a, b) { return b.price - a.price || a.name.localeCompare(b.name, "es"); });
    if (sort === "name") return copy.sort(function (a, b) { return a.name.localeCompare(b.name, "es"); });
    return copy.sort(function (a, b) {
      var diff = b.rarityMeta.order - a.rarityMeta.order;
      if (diff) return diff;
      return a.name.localeCompare(b.name, "es");
    });
  }

  function filterCharacters(state, options) {
    var opts = options || {};
    var rows = Chars.characters.map(function (character) {
      return { character: character, status: characterStatus(state, character) };
    });
    if (opts.rarity && opts.rarity !== "all") rows = rows.filter(function (row) { return row.character.rarity === opts.rarity; });
    if (opts.filter === "owned") rows = rows.filter(function (row) { return row.status.owned; });
    else if (opts.filter === "buy") rows = rows.filter(function (row) { return !row.status.owned && row.status.canPurchase; });
    else if (opts.filter === "locked") rows = rows.filter(function (row) { return !row.status.owned && !row.status.canPurchase; });
    return sortCharacters(rows.map(function (row) { return row.character; }), opts.sort).map(function (character) {
      return { character: character, status: characterStatus(state, character) };
    });
  }

  function sortCosmetics(list, sort) {
    var copy = list.slice();
    if (sort === "priceAsc") return copy.sort(function (a, b) { return a.price - b.price || a.name.localeCompare(b.name, "es"); });
    if (sort === "priceDesc") return copy.sort(function (a, b) { return b.price - a.price || a.name.localeCompare(b.name, "es"); });
    if (sort === "name") return copy.sort(function (a, b) { return a.name.localeCompare(b.name, "es"); });
    return copy.sort(function (a, b) {
      var diff = b.rarityMeta.order - a.rarityMeta.order;
      if (diff) return diff;
      return a.name.localeCompare(b.name, "es");
    });
  }

  function filterCosmetics(state, options) {
    var opts = options || {};
    var list = Chars.cosmetics.slice();
    if (opts.category && opts.category !== "all") list = list.filter(function (item) { return item.category === opts.category; });
    if (opts.rarity && opts.rarity !== "all") list = list.filter(function (item) { return item.rarity === opts.rarity; });
    if (opts.owned === "owned") list = list.filter(function (item) { return ownsCosmetic(state, item.id); });
    else if (opts.owned === "missing") list = list.filter(function (item) { return !ownsCosmetic(state, item.id); });
    if (opts.characterId) list = list.filter(function (item) { return Chars.isCompatible(opts.characterId, item.id); });
    return sortCosmetics(list, opts.sort).map(function (item) {
      return { cosmetic: item, status: cosmeticStatus(state, item) };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mutaciones                                                         */
  /* ------------------------------------------------------------------ */
  function addTransaction(state, entry) {
    state.economy = normalizeEconomy(state.economy);
    state.economy.transactions.unshift({
      id: U.uid("tx"),
      at: entry.at,
      kind: entry.kind,
      itemId: entry.itemId,
      name: entry.name,
      price: Math.max(0, U.safeInt(entry.price, 0)),
      balanceAfter: Math.max(0, U.safeInt(state.coins, 0))
    });
    state.economy.transactions = state.economy.transactions.slice(0, C.rpg.shop.maxTransactions);
    state.economy.lifetimeSpent += Math.max(0, U.safeInt(entry.price, 0));
  }

  function pushEvent(state, type, data, at) {
    state.events = state.events || [];
    state.events.push({ id: U.uid("evt"), type: type, at: at || U.nowISO(), data: data || {} });
    state.events = state.events.slice(-200);
  }

  function purchaseCharacter(state, characterId, atISO) {
    var character = Chars.byId(characterId);
    if (!character) throw new Error("Ese personaje no existe en el catálogo.");
    if (ownsCharacter(state, characterId)) throw new Error("Ya posees este personaje. La compra no se repite.");
    var status = characterStatus(state, character);
    if (!character.forSale) throw new Error("Este personaje no se compra con monedas: " + (character.access.description || "se desbloquea por recorrido") + ".");
    if (!status.met) {
      var missing = status.requirements.filter(function (r) { return !r.met; })
        .map(function (r) { return r.label + " (" + r.have + "/" + r.need + ")"; });
      throw new Error("Aún no cumples los requisitos: " + missing.join(", ") + ".");
    }
    var price = character.price;
    if (price > Number(state.coins || 0)) {
      throw new Error("Te faltan " + (price - Number(state.coins || 0)) + " monedas para comprar a " + character.name + ".");
    }
    state.coins = Math.max(0, Number(state.coins || 0) - price);
    state.collection = normalizeCollection(state.collection, { collection: { selectedCharacterId: selectedCharacterId(state) } });
    state.collection.ownedCharacterIds.push(character.id);
    state.collection.unlockedBy[character.id] = { method: "purchase", at: atISO, price: price };
    addTransaction(state, { at: atISO, kind: "character", itemId: character.id, name: character.name, price: price });
    pushEvent(state, "characterPurchase", { characterId: character.id, price: price }, atISO);
    return { character: character, price: price, balance: state.coins };
  }

  function purchaseCosmetic(state, cosmeticId, atISO) {
    var cosmetic = Chars.cosmeticById(cosmeticId);
    if (!cosmetic) throw new Error("Ese cosmético no existe en el catálogo.");
    if (ownsCosmetic(state, cosmeticId)) throw new Error("Ya tienes este objeto en el inventario. No se compra dos veces.");
    if (cosmetic.unlockRequirements) throw new Error("Este objeto se obtiene con un logro, no se compra con monedas.");
    var price = cosmetic.price;
    if (price > Number(state.coins || 0)) {
      throw new Error("Te faltan " + (price - Number(state.coins || 0)) + " monedas para comprar «" + cosmetic.name + "».");
    }
    state.coins = Math.max(0, Number(state.coins || 0) - price);
    state.collection = normalizeCollection(state.collection, { collection: { selectedCharacterId: selectedCharacterId(state) } });
    state.collection.ownedCosmeticIds.push(cosmetic.id);
    addTransaction(state, { at: atISO, kind: "cosmetic", itemId: cosmetic.id, name: cosmetic.name, price: price });
    pushEvent(state, "cosmeticPurchase", { cosmeticId: cosmetic.id, price: price }, atISO);
    return { cosmetic: cosmetic, price: price, balance: state.coins };
  }

  function selectCharacter(state, characterId) {
    if (!ownsCharacter(state, characterId)) throw new Error("Solo puedes seleccionar personajes de tu colección.");
    state.collection.selectedCharacterId = characterId;
    return Chars.byId(characterId);
  }

  function assertSlot(character, cosmetic) {
    if (!character.slotIds || character.slotIds.indexOf(cosmetic.category) === -1) {
      throw new Error(character.name + " no tiene ranura de " + (Chars.slotMeta(cosmetic.category) ? Chars.slotMeta(cosmetic.category).label.toLowerCase() : cosmetic.category) + ".");
    }
  }

  function equipCosmetic(state, characterId, cosmeticId) {
    var character = Chars.byId(characterId);
    var cosmetic = Chars.cosmeticById(cosmeticId);
    if (!character || !cosmetic) throw new Error("El personaje o el cosmético no existe.");
    if (!ownsCharacter(state, characterId)) throw new Error("El personaje no pertenece a tu colección.");
    if (!ownsCosmetic(state, cosmeticId)) throw new Error("Todavía no tienes ese objeto en el inventario.");
    assertSlot(character, cosmetic);
    if (!Chars.isCompatible(characterId, cosmeticId)) {
      throw new Error("«" + cosmetic.name + "» no es compatible con " + character.name + ".");
    }
    state.collection = normalizeCollection(state.collection, { collection: { selectedCharacterId: selectedCharacterId(state) } });
    var equipped = state.collection.equipped[characterId] || {};
    equipped[cosmetic.category] = cosmetic.id;
    state.collection.equipped[characterId] = equipped;
    return { characterId: characterId, slot: cosmetic.category, cosmetic: cosmetic };
  }

  function unequipCosmetic(state, characterId, slotId) {
    state.collection = normalizeCollection(state.collection, { collection: { selectedCharacterId: selectedCharacterId(state) } });
    var equipped = state.collection.equipped[characterId];
    if (!equipped || !equipped[slotId]) return false;
    delete equipped[slotId];
    if (!Object.keys(equipped).length) delete state.collection.equipped[characterId];
    return true;
  }

  function cleanOutfit(character, outfit, ownedCosmetics) {
    var out = {};
    if (!character || !outfit) return out;
    Object.keys(outfit).forEach(function (slotId) {
      var cosmeticId = outfit[slotId];
      if (typeof cosmeticId !== "string") return;
      if (character.slotIds.indexOf(slotId) === -1) return;
      if (ownedCosmetics.indexOf(cosmeticId) === -1) return;
      var cosmetic = Chars.cosmeticById(cosmeticId);
      if (!cosmetic || cosmetic.category !== slotId) return;
      if (!Chars.isCompatible(character.id, cosmetic.id)) return;
      out[slotId] = cosmetic.id;
    });
    return out;
  }

  function setOutfit(state, characterId, outfit, atISO) {
    var character = Chars.byId(characterId);
    if (!character) throw new Error("Ese personaje no existe.");
    if (!ownsCharacter(state, characterId)) throw new Error("No puedes editar un personaje que no posees.");
    state.collection = normalizeCollection(state.collection, { collection: { selectedCharacterId: selectedCharacterId(state) } });
    var current = state.collection.equipped[characterId] || {};
    if (Object.keys(current).length) {
      state.collection.previousOutfits[characterId] = Object.assign({}, current);
    }
    var cleaned = cleanOutfit(character, outfit || {}, state.collection.ownedCosmeticIds);
    if (Object.keys(cleaned).length) state.collection.equipped[characterId] = cleaned;
    else delete state.collection.equipped[characterId];
    pushEvent(state, "outfitSaved", { characterId: characterId, slots: Object.keys(cleaned) }, atISO);
    return { characterId: characterId, equipped: cleaned, previousRestorable: !!state.collection.previousOutfits[characterId] };
  }

  function restorePreviousOutfit(state, characterId, atISO) {
    var character = Chars.byId(characterId);
    if (!character) throw new Error("Ese personaje no existe.");
    var previous = state.collection && state.collection.previousOutfits ? state.collection.previousOutfits[characterId] : null;
    if (!previous) throw new Error("Todavía no hay un atuendo anterior guardado para " + character.name + ".");
    return setOutfit(state, characterId, previous, atISO);
  }

  function syncUnlocks(state, atISO) {
    var granted = [];
    Chars.characters.forEach(function (character) {
      if (character.access.kind !== "reward") return;
      if (ownsCharacter(state, character.id)) return;
      var requirements = characterRequirements(state, character);
      if (!requirements.length || !requirementsMet(requirements)) return;
      state.collection = normalizeCollection(state.collection, { collection: { selectedCharacterId: selectedCharacterId(state) } });
      state.collection.ownedCharacterIds.push(character.id);
      state.collection.unlockedBy[character.id] = { method: "reward", at: atISO || U.nowISO(), price: 0 };
      pushEvent(state, "characterUnlock", { characterId: character.id, method: "reward" }, atISO);
      granted.push(character);
    });
    return granted;
  }

  function validate(state) {
    var errors = [];
    var coll = state && state.collection;
    if (!coll || !Array.isArray(coll.ownedCharacterIds) || !coll.ownedCharacterIds.length) {
      errors.push("La colección no tiene personajes válidos.");
      return errors;
    }
    if (coll.ownedCharacterIds.indexOf(coll.selectedCharacterId) === -1) {
      errors.push("El personaje seleccionado no está en la colección.");
    }
    coll.ownedCharacterIds.forEach(function (id) {
      if (!Chars.byId(id)) errors.push("Personaje desconocido en la colección: " + id);
    });
    coll.ownedCosmeticIds.forEach(function (id) {
      if (!Chars.cosmeticById(id)) errors.push("Cosmético desconocido en el inventario: " + id);
    });
    Object.keys(coll.equipped || {}).forEach(function (characterId) {
      if (coll.ownedCharacterIds.indexOf(characterId) === -1) errors.push("Equipamiento de un personaje no poseído: " + characterId);
      Object.keys(coll.equipped[characterId] || {}).forEach(function (slotId) {
        var cosmeticId = coll.equipped[characterId][slotId];
        if (coll.ownedCosmeticIds.indexOf(cosmeticId) === -1) errors.push("Objeto equipado no poseído: " + cosmeticId);
      });
    });
    return errors;
  }

  function shopFeatured() {
    return {
      characters: C.rpg.shop.featuredCharacterIds.map(Chars.byId).filter(Boolean),
      cosmetics: C.rpg.shop.featuredCosmeticIds.map(Chars.cosmeticById).filter(Boolean)
    };
  }

  window.QuestCollection = {
    defaultCollection: defaultCollection,
    defaultEconomy: defaultEconomy,
    defaultPresentation: defaultPresentation,
    normalizeCollection: normalizeCollection,
    normalizeEconomy: normalizeEconomy,
    normalizePresentation: normalizePresentation,
    collection: collection,
    ownsCharacter: ownsCharacter,
    ownsCosmetic: ownsCosmetic,
    selectedCharacterId: selectedCharacterId,
    selectedCharacter: selectedCharacter,
    equippedMap: equippedMap,
    equippedList: equippedList,
    characterStatus: characterStatus,
    cosmeticStatus: cosmeticStatus,
    characterRequirements: characterRequirements,
    cosmeticRequirements: cosmeticRequirements,
    requirementsMet: requirementsMet,
    filterCharacters: filterCharacters,
    filterCosmetics: filterCosmetics,
    purchaseCharacter: purchaseCharacter,
    purchaseCosmetic: purchaseCosmetic,
    selectCharacter: selectCharacter,
    equipCosmetic: equipCosmetic,
    unequipCosmetic: unequipCosmetic,
    setOutfit: setOutfit,
    restorePreviousOutfit: restorePreviousOutfit,
    cleanOutfit: cleanOutfit,
    syncUnlocks: syncUnlocks,
    validate: validate,
    shopFeatured: shopFeatured,
    completedMissions: completedMissions,
    currentLevel: currentLevel
  };
})();
