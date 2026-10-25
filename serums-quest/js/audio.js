/* SERUMS QUEST - audio sintetizado original
   © 2026 ZARCONT. Efectos y ambiente generados con Web Audio API: no se
   descargan muestras ni se reproduce audio antes de una interacción real. */
(function () {
  "use strict";

  var DEFAULTS = { muted: false, sfxVolume: 0.55, musicVolume: 0.22, music: false };
  var prefs = Object.assign({}, DEFAULTS);
  var ctx = null;
  var master = null;
  var compressor = null;
  var sfxBus = null;
  var musicBus = null;
  var reverb = null;
  var musicNodes = [];
  var lastPlayed = {};
  var activeVoices = 0;
  var unlocked = false;
  var mutedByVisibility = false;

  function clamp01(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) n = fallback;
    return Math.max(0, Math.min(1, n));
  }

  function sanitize(next) {
    var input = next && typeof next === "object" ? next : {};
    var out = Object.assign({}, prefs);
    if (input.muted !== undefined) out.muted = !!input.muted;
    if (input.sfxVolume !== undefined) out.sfxVolume = clamp01(input.sfxVolume, prefs.sfxVolume);
    if (input.musicVolume !== undefined) out.musicVolume = clamp01(input.musicVolume, prefs.musicVolume);
    if (input.music !== undefined) out.music = !!input.music;
    return out;
  }

  function ensureContext() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.22;
      master.connect(compressor);
      compressor.connect(ctx.destination);
      reverb = ctx.createConvolver();
      reverb.buffer = makeImpulse(1.9, 2.6);
      var reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.16;
      reverb.connect(reverbGain);
      reverbGain.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = prefs.muted ? 0 : prefs.sfxVolume;
      sfxBus.connect(master);
      sfxBus.connect(reverb);
      musicBus = ctx.createGain();
      musicBus.gain.value = prefs.muted || !prefs.music ? 0 : prefs.musicVolume * 0.55;
      musicBus.connect(master);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function makeImpulse(seconds, decay) {
    var rate = ctx.sampleRate;
    var length = Math.max(1, Math.floor(rate * seconds));
    var impulse = ctx.createBuffer(2, length, rate);
    for (var channel = 0; channel < 2; channel += 1) {
      var data = impulse.getChannelData(channel);
      for (var i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  function unlock() {
    var context = ensureContext();
    if (!context) return false;
    unlocked = true;
    if (context.state === "suspended" && typeof context.resume === "function") {
      context.resume().catch(function () {});
    }
    if (prefs.music) startMusic();
    return true;
  }

  function syncGains() {
    if (!ctx) return;
    var now = ctx.currentTime;
    var targetSfx = prefs.muted ? 0 : prefs.sfxVolume;
    var targetMusic = prefs.muted || !prefs.music ? 0 : prefs.musicVolume * 0.55;
    try {
      sfxBus.gain.cancelScheduledValues(now);
      sfxBus.gain.setTargetAtTime(targetSfx, now, 0.04);
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setTargetAtTime(targetMusic, now, 0.12);
    } catch (e) {}
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function tone(freq, duration, options) {
    if (!ctx || activeVoices > 18) return;
    var opts = options || {};
    var t0 = now() + (opts.delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var filter = opts.filter ? ctx.createBiquadFilter() : null;
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.gain || 0.2), t0 + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    if (filter) {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(opts.filter, t0);
      filter.Q.value = 0.7;
      osc.connect(filter); filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(sfxBus);
    activeVoices += 1;
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
    osc.onended = function () {
      activeVoices = Math.max(0, activeVoices - 1);
      try { gain.disconnect(); if (filter) filter.disconnect(); } catch (e) {}
    };
  }

  function noise(duration, options) {
    if (!ctx || activeVoices > 18) return;
    var opts = options || {};
    var sampleRate = ctx.sampleRate;
    var length = Math.max(1, Math.floor(sampleRate * duration));
    var buffer = ctx.createBuffer(1, length, sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = opts.type || "bandpass";
    filter.frequency.value = opts.frequency || 1800;
    filter.Q.value = opts.q || 0.8;
    var gain = ctx.createGain();
    var t0 = now() + (opts.delay || 0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.gain || 0.12), t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    source.connect(filter); filter.connect(gain); gain.connect(sfxBus);
    activeVoices += 1;
    source.start(t0);
    source.stop(t0 + duration);
    source.onended = function () {
      activeVoices = Math.max(0, activeVoices - 1);
      try { gain.disconnect(); filter.disconnect(); } catch (e) {}
    };
  }

  var SOUNDS = {
    click: function () {
      tone(880, 0.05, { type: "triangle", gain: 0.06 });
      tone(1320, 0.035, { type: "sine", gain: 0.035, delay: 0.012 });
    },
    hover: function () {
      tone(1046, 0.035, { type: "sine", gain: 0.022 });
    },
    page: function () {
      noise(0.16, { frequency: 900, gain: 0.05, q: 0.5 });
      tone(320, 0.14, { type: "sine", gain: 0.035, slide: 480 });
    },
    select: function () {
      tone(523.25, 0.1, { type: "triangle", gain: 0.08 });
      tone(783.99, 0.14, { type: "sine", gain: 0.07, delay: 0.06 });
    },
    confirm: function () {
      tone(523.25, 0.14, { type: "sine", gain: 0.08 });
      tone(659.25, 0.16, { type: "sine", gain: 0.07, delay: 0.04 });
      tone(783.99, 0.22, { type: "triangle", gain: 0.06, delay: 0.08 });
    },
    buy: function () {
      tone(1046.5, 0.1, { type: "triangle", gain: 0.08 });
      tone(1318.5, 0.16, { type: "triangle", gain: 0.07, delay: 0.08 });
      noise(0.18, { frequency: 3200, gain: 0.04, q: 1.2, delay: 0.05 });
    },
    equip: function () {
      tone(196, 0.12, { type: "triangle", gain: 0.09 });
      noise(0.1, { frequency: 600, gain: 0.05, type: "lowpass" });
      tone(880, 0.14, { type: "sine", gain: 0.05, delay: 0.08 });
    },
    unequip: function () {
      tone(320, 0.1, { type: "triangle", gain: 0.06 });
      tone(240, 0.14, { type: "sine", gain: 0.05, delay: 0.04 });
    },
    correct: function () {
      tone(659.25, 0.12, { type: "triangle", gain: 0.09 });
      tone(987.77, 0.2, { type: "sine", gain: 0.08, delay: 0.07 });
    },
    error: function () {
      tone(196, 0.2, { type: "triangle", gain: 0.08, slide: 155 });
      tone(146.83, 0.26, { type: "sine", gain: 0.06, delay: 0.06 });
    },
    streak: function () {
      [523.25, 659.25, 783.99].forEach(function (freq, i) {
        tone(freq, 0.16, { type: "triangle", gain: 0.075, delay: i * 0.06 });
      });
      noise(0.22, { frequency: 2800, gain: 0.035, q: 1, delay: 0.1 });
    },
    victory: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
        tone(freq, 0.3, { type: i === 3 ? "sine" : "triangle", gain: 0.08, delay: i * 0.09 });
      });
      noise(0.4, { frequency: 3400, gain: 0.03, q: 0.8, delay: 0.25 });
    },
    defeat: function () {
      [392, 329.63, 261.63].forEach(function (freq, i) {
        tone(freq, 0.3, { type: "sine", gain: 0.065, delay: i * 0.1 });
      });
    },
    levelup: function () {
      [392, 523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
        tone(freq, 0.32, { type: "triangle", gain: 0.075, delay: i * 0.07 });
      });
      noise(0.55, { frequency: 4200, gain: 0.025, q: 0.7, delay: 0.2 });
    },
    unlock: function () {
      [261.63, 392, 523.25, 659.25, 783.99].forEach(function (freq, i) {
        tone(freq, 0.5, { type: "sine", gain: 0.05, delay: i * 0.06, filter: 2400 });
      });
      noise(0.7, { frequency: 2400, gain: 0.04, q: 0.6, delay: 0.05 });
      tone(1046.5, 0.7, { type: "sine", gain: 0.04, delay: 0.32 });
    },
    toggle: function () {
      tone(660, 0.06, { type: "square", gain: 0.035 });
      tone(990, 0.06, { type: "square", gain: 0.03, delay: 0.04 });
    },
    coin: function () {
      tone(1318.5, 0.07, { type: "triangle", gain: 0.055 });
      tone(1760, 0.1, { type: "sine", gain: 0.045, delay: 0.04 });
    }
  };

  function play(name, options) {
    var opts = options || {};
    if (!unlocked) return false;
    if (prefs.muted || prefs.sfxVolume <= 0) return false;
    if (!SOUNDS[name]) return false;
    var stamp = Date.now();
    if (!opts.force && lastPlayed[name] && stamp - lastPlayed[name] < 40) return false;
    lastPlayed[name] = stamp;
    if (!ensureContext()) return false;
    if (ctx.state === "suspended") ctx.resume().catch(function () {});
    try { SOUNDS[name](); } catch (e) { return false; }
    return true;
  }

  function stopMusic() {
    musicNodes.forEach(function (node) {
      try { if (node.stop) node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    musicNodes = [];
  }

  function startMusic() {
    if (!unlocked) return;
    if (!prefs.music || prefs.muted || prefs.musicVolume <= 0) return;
    if (!ensureContext()) return;
    if (musicNodes.length) return;
    if (ctx.state === "suspended") ctx.resume().catch(function () {});
    var t0 = ctx.currentTime;
    var bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t0);
    bus.gain.exponentialRampToValueAtTime(0.14, t0 + 2.4);
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 720;
    filter.Q.value = 0.6;
    var freqs = [110, 164.81, 220, 261.63, 329.63];
    freqs.forEach(function (freq, index) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var lfo = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      var ampLfo = ctx.createOscillator();
      var ampGain = ctx.createGain();
      osc.type = index % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      osc.detune.value = index * 3 - 6;
      gain.gain.value = 0.16 / (index + 1);
      lfo.frequency.value = 0.045 + index * 0.013;
      lfoGain.gain.value = 2.4;
      ampLfo.frequency.value = 0.07 + index * 0.011;
      ampGain.gain.value = 0.03;
      lfo.connect(lfoGain); lfoGain.connect(osc.detune);
      ampLfo.connect(ampGain); ampGain.connect(gain.gain);
      osc.connect(gain); gain.connect(filter);
      osc.start(t0); lfo.start(t0); ampLfo.start(t0);
      musicNodes.push(osc, lfo, lfoGain, ampLfo, ampGain, gain);
    });
    filter.connect(bus);
    bus.connect(musicBus);
    musicNodes.push(filter, bus);
  }

  function setPreferences(next) {
    prefs = sanitize(next);
    syncGains();
    if (prefs.music && !prefs.muted && unlocked) startMusic();
    else stopMusic();
    return getPreferences();
  }

  function getPreferences() { return Object.assign({}, prefs); }

  function toggleMuted() {
    prefs.muted = !prefs.muted;
    syncGains();
    if (prefs.muted) stopMusic();
    else if (prefs.music && unlocked) startMusic();
    return prefs.muted;
  }

  function setMusic(enabled) {
    prefs.music = !!enabled;
    syncGains();
    if (prefs.music && !prefs.muted && unlocked) startMusic();
    else stopMusic();
    return prefs.music;
  }

  function setVolumes(sfx, music) {
    prefs.sfxVolume = clamp01(sfx, prefs.sfxVolume);
    prefs.musicVolume = clamp01(music, prefs.musicVolume);
    syncGains();
    return getPreferences();
  }

  if (typeof document !== "undefined") {
    var unlockOnce = function () { unlock(); };
    document.addEventListener("pointerdown", unlockOnce, { once: true, passive: true });
    document.addEventListener("keydown", unlockOnce, { once: true });
    document.addEventListener("visibilitychange", function () {
      if (!ctx) return;
      if (document.hidden) {
        mutedByVisibility = true;
        try { ctx.suspend(); } catch (e) {}
      } else if (mutedByVisibility) {
        mutedByVisibility = false;
        try { ctx.resume(); } catch (e) {}
      }
    });
  }

  window.QuestAudio = {
    DEFAULTS: DEFAULTS,
    play: play,
    unlock: unlock,
    setPreferences: setPreferences,
    getPreferences: getPreferences,
    setMuted: function (muted) { prefs.muted = !!muted; syncGains(); if (muted) stopMusic(); return prefs.muted; },
    toggleMuted: toggleMuted,
    setMusic: setMusic,
    setVolumes: setVolumes,
    startMusic: startMusic,
    stopMusic: stopMusic,
    isUnlocked: function () { return unlocked; },
    hasContext: function () { return !!ctx; },
    sounds: Object.keys(SOUNDS)
  };
})();
