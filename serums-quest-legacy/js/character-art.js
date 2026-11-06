/* SERUMS QUEST - arte vectorial original de personajes y cosméticos
   © 2026 ZARCONT. Ilustraciones SVG originales generadas por capas:
   cuerpo base + vestuario del personaje + cosméticos (cabeza, peinado, torso,
   piernas, accesorio, amuleto, efecto y marco). Sin recursos externos ni emojis.
   Las capas cosméticas usan el mismo sistema de coordenadas que el personaje,
   de modo que se pueden sustituir por ilustraciones definitivas más adelante. */
(function () {
  "use strict";

  var Chars = window.QuestCharacters;
  var seq = 0;
  var portraitCache = {};
  var portraitOrder = [];
  var mannequinCache = {};
  var mannequinOrder = [];

  function outfitKey(equipped) {
    if (!equipped || typeof equipped !== "object") return "";
    return Object.keys(equipped).sort().map(function (slot) {
      return slot + "=" + equipped[slot];
    }).join("|");
  }

  function cacheGet(cache, key) {
    return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
  }

  function cacheSet(cache, key, value, order, limit) {
    cache[key] = value;
    order.push(key);
    while (order.length > limit) {
      var oldest = order.shift();
      delete cache[oldest];
    }
    return value;
  }

  function uid(prefix) {
    seq += 1;
    return "qca-" + prefix + "-" + seq;
  }

  function limb(points, color, width) {
    return '<path d="' + points + '" fill="none" stroke="' + color + '" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  function sleeve(points, color, width, outline) {
    return limb(points, outline || "#060A12", width + 4) +
      limb(points, color, width) +
      '<path d="' + points + '" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity=".1"/>';
  }

  function hand(x, y, size, skin, shade) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + size + '" fill="' + skin + '"/>' +
      '<path d="M' + (x - size * 0.6) + ' ' + (y + size * 0.55) + ' q' + (size * 0.6) + ' ' + (size * 0.5) + ' ' + (size * 1.2) + ' 0" stroke="' + shade + '" stroke-width="1.4" fill="none" opacity=".6"/>' +
      '<path d="M' + (x - size * 0.45) + ' ' + (y - size * 0.2) + ' q' + (size * 0.35) + ' -' + (size * 0.45) + ' ' + (size * 0.7) + ' 0" stroke="#FFFFFF" stroke-width="1.1" fill="none" opacity=".18"/>';
  }

  /* ------------------------------------------------------------------ */
  /* Fichas de arte por personaje                                       */
  /* ------------------------------------------------------------------ */
  var ART = {
    ilan: {
      skin: "#C08A63", shade: "#A26C48", hair: "#1C2336", hairLight: "#2C3856",
      pal: { main: "#26345C", dark: "#1A2440", light: "#33456F", trim: "#7AA2FF", accent: "#69D3C1", pants: "#1A2136", boots: "#0E1524", metal: "#B9C6E2" },
      build: { shoulder: 112, hip: 92, stance: 0, headRx: 39, headRy: 45 },
      hairStyle: "short-streak", outfit: "coat", prop: "notebook", headgear: "none", armPose: "standard",
      marks: ["thin-brows"]
    },
    mara: {
      skin: "#D9A074", shade: "#B98056", hair: "#5A3520", hairLight: "#7A4A2B",
      pal: { main: "#8A5A2B", dark: "#6B431F", light: "#A9713B", trim: "#F5B85C", accent: "#B8D46A", pants: "#3B4A3A", boots: "#2A241C", metal: "#D8C29A" },
      build: { shoulder: 110, hip: 96, stance: 2, headRx: 40, headRy: 44 },
      hairStyle: "braid", outfit: "field", prop: "map", headgear: "field-hat", armPose: "standard",
      marks: ["freckles"]
    },
    noa: {
      skin: "#B87B52", shade: "#98603D", hair: "#161A26", hairLight: "#242A3C",
      pal: { main: "#E8EDF5", dark: "#CDD7E6", light: "#F6F9FF", trim: "#69D3C1", accent: "#7AA2FF", pants: "#23303E", boots: "#17212C", metal: "#8FA6BF" },
      build: { shoulder: 104, hip: 88, stance: 0, headRx: 38, headRy: 45 },
      hairStyle: "bun", outfit: "lab", prop: "tablet", headgear: "none", armPose: "forward",
      marks: ["sharp-eyes"]
    },
    teo: {
      skin: "#A9714A", shade: "#8A5836", hair: "#6B6B72", hairLight: "#8C8C95",
      pal: { main: "#7A4B34", dark: "#5F3A28", light: "#96613F", trim: "#F3B562", accent: "#E8D5B7", pants: "#3E3229", boots: "#2A211A", metal: "#C9A25A" },
      build: { shoulder: 122, hip: 100, stance: 0, headRx: 41, headRy: 46 },
      hairStyle: "mentor", outfit: "cardigan", prop: "book", headgear: "none", armPose: "standard",
      marks: ["beard", "warm-brows"]
    },
    lia: {
      skin: "#E0AE86", shade: "#C08F68", hair: "#2A1630", hairLight: "#432352",
      pal: { main: "#6A2A7A", dark: "#4A1E5E", light: "#8A3A9C", trim: "#E86AA6", accent: "#B79BFF", pants: "#231E33", boots: "#12101C", metal: "#E4C4F0" },
      build: { shoulder: 102, hip: 86, stance: 3, headRx: 38, headRy: 44 },
      hairStyle: "ponytail", outfit: "sport", prop: "stopwatch", headgear: "none", armPose: "raised",
      marks: ["smirk"]
    },
    kian: {
      skin: "#8C5A3C", shade: "#6F452C", hair: "#141414", hairLight: "#2A2A2A",
      pal: { main: "#4A5A70", dark: "#33404F", light: "#61738C", trim: "#C9A25A", accent: "#7AA2FF", pants: "#26303D", boots: "#171E28", metal: "#B9C4D2" },
      build: { shoulder: 128, hip: 104, stance: 2, headRx: 41, headRy: 45 },
      hairStyle: "shaved", outfit: "armor", prop: "seal", headgear: "none", armPose: "standard",
      marks: ["scar", "stern"]
    },
    amaru: {
      skin: "#C98F63", shade: "#A97148", hair: "#2B2118", hairLight: "#463524",
      pal: { main: "#1E7A78", dark: "#145E5C", light: "#2A9391", trim: "#E8A24C", accent: "#C9524A", pants: "#2C3A34", boots: "#241F1A", metal: "#D8C29A" },
      build: { shoulder: 108, hip: 90, stance: 4, headRx: 39, headRy: 43 },
      hairStyle: "side-tuck", outfit: "poncho", prop: "lantern", headgear: "woven-cap", armPose: "forward",
      marks: ["dimple"]
    },
    ona: {
      skin: "#E3B48F", shade: "#C4946F", hair: "#D7DCE8", hairLight: "#F0F3FA",
      pal: { main: "#2A3140", dark: "#1C2230", light: "#3A4557", trim: "#7AA2FF", accent: "#E8EDF5", pants: "#1A1F2A", boots: "#10141C", metal: "#B9C6E2" },
      build: { shoulder: 106, hip: 84, stance: 1, headRx: 38, headRy: 45 },
      hairStyle: "silver-slick", outfit: "structured", prop: "blueprint", headgear: "none", armPose: "standard",
      marks: ["sharp-eyes"]
    },
    iris: {
      skin: "#6E4732", shade: "#553322", hair: "#1A1420", hairLight: "#2C2336",
      pal: { main: "#E9E4DA", dark: "#C9C0D8", light: "#F7F4EE", trim: "#B79BFF", accent: "#F5B85C", pants: "#2B2438", boots: "#241E2E", metal: "#D8C29A" },
      build: { shoulder: 106, hip: 92, stance: 0, headRx: 39, headRy: 45 },
      hairStyle: "hood", outfit: "robe", prop: "lantern", headgear: "hood", armPose: "raised",
      marks: ["calm"]
    },
    zenon: {
      skin: "#B98A62", shade: "#9A6C46", hair: "#E8E4DA", hairLight: "#FFFFFF",
      pal: { main: "#1C2A4A", dark: "#131E36", light: "#2A3C62", trim: "#F5B85C", accent: "#B79BFF", pants: "#1A2136", boots: "#101624", metal: "#C9A25A" },
      build: { shoulder: 118, hip: 98, stance: 0, headRx: 40, headRy: 46 },
      hairStyle: "long-white", outfit: "archivist", prop: "staff", headgear: "circlet", armPose: "standard",
      marks: ["beard-long", "wise"]
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cabeza                                                            */
  /* ------------------------------------------------------------------ */
  function facePath(a) {
    var rx = a.build.headRx;
    var top = 78;
    var bottom = 182;
    return "M" + (160 - rx) + " 122 C" + (160 - rx) + " 92 " + (160 - rx * 0.62) + " " + top + " 160 " + top +
      " C" + (160 + rx * 0.62) + " " + top + " " + (160 + rx) + " 92 " + (160 + rx) + " 122" +
      " C" + (160 + rx) + " 154 " + (160 + rx * 0.6) + " " + bottom + " 160 " + bottom +
      " C" + (160 - rx * 0.6) + " " + bottom + " " + (160 - rx) + " 154 " + (160 - rx) + " 122 Z";
  }

  function lighten(hex, amount) {
    var h = String(hex || "").replace("#", "");
    if (h.length !== 6) return hex;
    var n = parseInt(h, 16);
    var r = Math.min(255, ((n >> 16) & 255) + amount);
    var g = Math.min(255, ((n >> 8) & 255) + amount);
    var b = Math.min(255, (n & 255) + amount);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function darken(hex, amount) {
    return lighten(hex, -amount);
  }

  function faceDetail(a) {
    var rx = a.build.headRx;
    return '<path d="M' + (160 - rx * 0.82) + ' 118 q6 44 26 58 q-26 -2 -34 -40 Z" fill="' + a.shade + '" opacity=".12"/>' +
      '<path d="M' + (160 + rx * 0.2) + ' 84 q' + (rx * 0.55) + ' 12 ' + (rx * 0.62) + ' 40" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".16"/>' +
      '<ellipse cx="136" cy="146" rx="11" ry="6" fill="' + a.shade + '" opacity=".13"/>' +
      '<ellipse cx="184" cy="146" rx="11" ry="6" fill="' + a.shade + '" opacity=".13"/>' +
      '<path d="M150 163 q10 3 20 0" stroke="' + a.shade + '" stroke-width="1.2" fill="none" opacity=".45"/>' +
      '<path d="M156 151 q4 2 8 0" stroke="' + a.shade + '" stroke-width="1.5" fill="none" opacity=".45" stroke-linecap="round"/>' +
      '<circle cx="' + (160 - a.build.headRx - 3) + '" cy="134" r="2.4" fill="' + a.shade + '" opacity=".4"/>' +
      '<circle cx="' + (160 + a.build.headRx + 3) + '" cy="134" r="2.4" fill="' + a.shade + '" opacity=".4"/>' +
      '<path d="M142 168 q18 10 36 0" stroke="' + a.shade + '" stroke-width="2.6" fill="none" opacity=".18"/>';
  }

  function hairSheen(a) {
    var style = a.hairStyle;
    if (style === "shaved") {
      return '<path d="M128 104 q18 -14 38 -14" stroke="' + a.hairLight + '" stroke-width="2" fill="none" opacity=".45"/>';
    }
    if (style === "hood" || style === "long-white" || style === "mentor") {
      return '<path d="M130 92 q20 -12 44 -4" stroke="' + a.hairLight + '" stroke-width="2.6" fill="none" opacity=".5"/>' +
        '<path d="M120 116 q-4 40 6 62" stroke="' + a.hairLight + '" stroke-width="2" fill="none" opacity=".35"/>';
    }
    return '<path d="M128 94 q18 -12 40 -8" stroke="' + a.hairLight + '" stroke-width="2.4" fill="none" opacity=".55"/>' +
      '<path d="M136 86 q14 -6 28 -2" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity=".22"/>';
  }

  function eyes(a) {
    var iris = a.pal.dark;
    return '<g class="q-ca-eyes" data-part="eyes">' +
      '<ellipse cx="142" cy="128" rx="6.1" ry="7" fill="#F7F4EE"/>' +
      '<ellipse cx="178" cy="128" rx="6.1" ry="7" fill="#F7F4EE"/>' +
      '<circle cx="142.6" cy="128.6" r="3.3" fill="' + iris + '"/>' +
      '<circle cx="177.4" cy="128.6" r="3.3" fill="' + iris + '"/>' +
      '<circle cx="142.6" cy="128.8" r="1.5" fill="#1A1420"/>' +
      '<circle cx="177.4" cy="128.8" r="1.5" fill="#1A1420"/>' +
      '<circle cx="143.8" cy="127.2" r="1.15" fill="#FFFFFF"/>' +
      '<circle cx="178.6" cy="127.2" r="1.15" fill="#FFFFFF"/>' +
      '<path d="M136 121.6 q6 -2.8 12 0" stroke="' + a.shade + '" stroke-width="1.6" fill="none" opacity=".65" stroke-linecap="round"/>' +
      '<path d="M172 121.6 q6 -2.8 12 0" stroke="' + a.shade + '" stroke-width="1.6" fill="none" opacity=".65" stroke-linecap="round"/>' +
      '<path d="M136.5 133.8 q5.5 2 11 0" stroke="' + a.shade + '" stroke-width="1" fill="none" opacity=".28" stroke-linecap="round"/>' +
      '<path d="M172.5 133.8 q5.5 2 11 0" stroke="' + a.shade + '" stroke-width="1" fill="none" opacity=".28" stroke-linecap="round"/>' +
      '</g>';
  }

  function brows(a, variant) {
    var color = a.hair;
    if (variant === "thin-brows") {
      return '<path d="M132 112 q9 -4 18 -1" stroke="' + color + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M170 111 q9 -3 18 1" stroke="' + color + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    }
    if (variant === "warm-brows") {
      return '<path d="M131 112 q10 -5 19 0" stroke="' + color + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M170 112 q9 -5 19 0" stroke="' + color + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    }
    return '<path d="M132 112 q9 -4 18 0" stroke="' + color + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M170 112 q9 -4 18 0" stroke="' + color + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }

  function mouthSet(a, variant) {
    var line = a.shade;
    var dark = "#3A2228";
    var neutral = '<path d="M150 158 q10 4 20 0" stroke="' + line + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    var smile = '<path d="M147 155 q13 13 26 0" stroke="' + line + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    var open = '<path d="M148 154 q12 16 24 0 q-12 6 -24 0 Z" fill="' + dark + '"/>' +
      '<path d="M154 160 q6 3 12 0" stroke="#E27F8B" stroke-width="2" fill="none" stroke-linecap="round"/>';
    var small = '<path d="M153 158 q7 3 14 0" stroke="' + line + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    if (variant === "smirk") {
      return '<g class="q-mouth q-mouth--neutral">' + '<path d="M150 157 q11 2 20 -3" stroke="' + line + '" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>' +
        '<g class="q-mouth q-mouth--smile">' + '<path d="M148 154 q12 7 24 -3" stroke="' + line + '" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>' +
        '<g class="q-mouth q-mouth--open">' + open + '</g>' +
        '<g class="q-mouth q-mouth--small">' + small + '</g>';
    }
    if (variant === "stern") {
      return '<g class="q-mouth q-mouth--neutral">' + '<path d="M150 158 h20" stroke="' + line + '" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>' +
        '<g class="q-mouth q-mouth--smile">' + '<path d="M150 158 q10 2 20 -2" stroke="' + line + '" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>' +
        '<g class="q-mouth q-mouth--open">' + open + '</g>' +
        '<g class="q-mouth q-mouth--small">' + small + '</g>';
    }
    return '<g class="q-mouth q-mouth--neutral">' + neutral + '</g>' +
      '<g class="q-mouth q-mouth--smile">' + smile + '</g>' +
      '<g class="q-mouth q-mouth--open">' + open + '</g>' +
      '<g class="q-mouth q-mouth--small">' + small + '</g>';
  }

  function facialMarks(a) {
    var marks = a.marks || [];
    var out = "";
    if (marks.indexOf("freckles") !== -1) {
      [[129, 143], [135, 147], [192, 143], [186, 147], [124, 137], [196, 137]].forEach(function (pt) {
        out += '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="1.5" fill="' + a.shade + '" opacity=".75"/>';
      });
    }
    if (marks.indexOf("scar") !== -1) {
      out += '<path d="M184 104 l6 10 M182 109 l9 1" stroke="' + a.shade + '" stroke-width="1.8" stroke-linecap="round"/>';
    }
    if (marks.indexOf("dimple") !== -1) {
      out += '<circle cx="146" cy="154" r="1.4" fill="' + a.shade + '" opacity=".6"/>';
      out += '<circle cx="174" cy="154" r="1.4" fill="' + a.shade + '" opacity=".6"/>';
    }
    return out;
  }

  function hairBack(a) {
    var style = a.hairStyle;
    var hair = a.hair;
    if (style === "mentor" || style === "long-white") {
      return '<path d="M118 108 q-6 62 14 92 q28 14 56 0 q20 -30 14 -92 q-42 -26 -84 0 Z" fill="' + hair + '"/>';
    }
    if (style === "hood") {
      return '<path d="M104 132 q0 -66 56 -70 q56 4 56 70 q0 44 -20 70 q-36 18 -72 0 q-20 -26 -20 -70 Z" fill="#2B2438"/>' +
        '<path d="M118 120 q8 -40 42 -42 q34 2 42 42 q-20 -18 -42 -16 q-22 -2 -42 16 Z" fill="#3A2E4E"/>';
    }
    if (style === "ponytail") {
      return '<path d="M196 96 q40 -18 46 22 q6 34 -18 50 q16 -32 -10 -46 Z" fill="' + hair + '"/>' +
        '<path d="M118 112 q-6 42 8 66 q30 12 68 0 q14 -24 8 -66 Z" fill="' + hair + '"/>';
    }
    if (style === "braid") {
      return '<path d="M118 110 q-4 56 12 82 q26 14 60 0 q16 -26 12 -82 Z" fill="' + hair + '"/>' +
        '<path d="M198 150 q18 6 14 28 q-2 18 -14 24 q10 -16 4 -26 q-6 -10 -10 -26 Z" fill="' + a.hairLight + '"/>';
    }
    return '<path d="M118 116 q-2 40 10 56 q32 12 64 0 q12 -16 10 -56 Z" fill="' + hair + '"/>';
  }

  function hairFront(a) {
    var style = a.hairStyle;
    var hair = a.hair;
    var light = a.hairLight;
    if (style === "short-streak") {
      return '<path d="M120 118 q0 -38 40 -42 q40 4 40 42 q-8 -18 -22 -24 q-4 18 -20 20 q4 -12 -2 -18 q-18 2 -26 24 q-6 -2 -10 -2 Z" fill="' + hair + '"/>' +
        '<path d="M170 82 q10 6 12 20 q-8 -8 -16 -10 Z" fill="' + light + '"/>' +
        '<path d="M126 96 q10 -12 24 -14" stroke="' + light + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>';
    }
    if (style === "braid") {
      return '<path d="M120 116 q2 -34 40 -40 q38 6 40 40 q-10 -20 -24 -22 q-6 16 -22 18 q2 -10 -4 -16 q-18 4 -22 24 q-4 -2 -8 -4 Z" fill="' + hair + '"/>' +
        '<path d="M192 150 q12 10 8 24 q-2 12 -8 18 q6 -16 0 -24 Z" fill="' + light + '"/>' +
        '<circle cx="199" cy="156" r="5" fill="' + a.pal.trim + '" opacity=".85"/>';
    }
    if (style === "bun") {
      return '<path d="M118 116 q0 -38 42 -40 q42 2 42 40 q-10 -22 -26 -24 q-2 14 -16 16 q-6 -10 -6 -14 q-22 2 -28 22 q-4 0 -8 0 Z" fill="' + hair + '"/>' +
        '<circle cx="160" cy="70" r="17" fill="' + hair + '"/>' +
        '<path d="M148 66 q12 -8 24 0" stroke="' + light + '" stroke-width="2" fill="none"/>' +
        '<path d="M196 96 l10 -4" stroke="' + a.pal.trim + '" stroke-width="3" stroke-linecap="round"/>';
    }
    if (style === "ponytail") {
      return '<path d="M118 116 q4 -36 42 -40 q38 4 42 40 q-12 -18 -24 -22 q-2 16 -18 18 q0 -10 -6 -16 q-16 4 -24 22 q-6 -1 -12 -2 Z" fill="' + hair + '"/>' +
        '<path d="M174 80 q22 -14 28 4 q-14 -2 -22 10 Z" fill="' + light + '"/>' +
        '<circle cx="196" cy="92" r="6" fill="' + a.pal.trim + '"/>';
    }
    if (style === "shaved") {
      return '<path d="M120 112 q6 -30 40 -32 q34 2 40 32 q-14 -14 -40 -14 q-26 0 -40 14 Z" fill="' + hair + '" opacity=".9"/>' +
        '<path d="M176 92 q8 2 12 8 M182 98 q6 4 8 10" stroke="' + a.pal.trim + '" stroke-width="1.6" fill="none" opacity=".7"/>';
    }
    if (style === "side-tuck") {
      return '<path d="M118 116 q2 -34 42 -40 q40 6 42 40 q-16 -20 -38 -18 q-24 2 -38 22 q-4 -2 -8 -4 Z" fill="' + hair + '"/>' +
        '<path d="M132 96 q20 -10 44 -2" stroke="' + light + '" stroke-width="2.4" fill="none" opacity=".7"/>';
    }
    if (style === "silver-slick") {
      return '<path d="M120 118 q2 -40 40 -44 q38 4 40 44 q-6 -10 -18 -16 q-20 -6 -34 4 q-14 8 -20 20 Z" fill="' + hair + '"/>' +
        '<path d="M146 84 q22 -4 36 10" stroke="' + light + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M188 118 q8 4 8 14" stroke="' + light + '" stroke-width="2" fill="none" opacity=".7"/>';
    }
    if (style === "hood") {
      return '<path d="M126 104 q10 -24 34 -26 q24 2 34 26 q-8 -8 -18 -10 q-4 10 -16 12 q-2 -8 -6 -12 q-16 2 -22 12 q-3 -1 -6 -2 Z" fill="' + hair + '"/>';
    }
    if (style === "long-white") {
      return '<path d="M116 120 q0 -44 44 -48 q44 4 44 48 q-10 -26 -30 -30 q-4 18 -16 20 q0 -12 -8 -18 q-22 4 -26 28 q-4 0 -8 0 Z" fill="' + hair + '"/>' +
        '<path d="M138 82 q16 -8 36 0" stroke="' + light + '" stroke-width="2.4" fill="none" opacity=".8"/>' +
        '<path d="M118 118 q-4 52 10 76" stroke="' + hair + '" stroke-width="14" fill="none" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M202 118 q6 50 -8 76" stroke="' + hair + '" stroke-width="14" fill="none" stroke-linecap="round" opacity=".85"/>';
    }
    if (style === "mentor") {
      return '<path d="M118 118 q0 -36 42 -42 q42 6 42 42 q-12 -22 -28 -24 q-6 14 -20 16 q-2 -10 -8 -14 q-16 4 -22 24 q-4 -1 -6 -2 Z" fill="' + hair + '"/>' +
        '<path d="M186 96 q10 4 14 16" stroke="' + light + '" stroke-width="2.4" fill="none" opacity=".7"/>';
    }
    return '<path d="M120 116 q2 -36 40 -40 q38 4 40 40 q-10 -20 -26 -22 q-4 12 -16 14 q-2 -8 -8 -12 q-18 4 -24 22 Z" fill="' + hair + '"/>';
  }

  function beard(a, variant) {
    if (variant === "beard-long") {
      return '<path d="M126 154 q4 36 34 44 q30 -8 34 -44 q-6 22 -34 24 q-28 -2 -34 -24 Z" fill="' + a.hair + '"/>' +
        '<path d="M138 160 q22 12 44 0 q-6 30 -22 34 q-16 -4 -22 -34 Z" fill="' + a.hairLight + '" opacity=".9"/>' +
        '<path d="M150 158 q10 6 20 0" stroke="' + a.shade + '" stroke-width="2" fill="none"/>';
    }
    if (variant === "beard") {
      return '<path d="M127 150 q6 30 33 36 q27 -6 33 -36 q-8 18 -33 18 q-25 0 -33 -18 Z" fill="' + a.hair + '" opacity=".95"/>' +
        '<path d="M146 158 q14 8 28 0" stroke="' + a.shade + '" stroke-width="2" fill="none" opacity=".6"/>';
    }
    return "";
  }

  function headgear(a) {
    var gear = a.headgear;
    var pal = a.pal;
    if (gear === "field-hat") {
      return '<ellipse cx="160" cy="102" rx="58" ry="13" fill="' + pal.trim + '"/>' +
        '<ellipse cx="160" cy="99" rx="58" ry="11" fill="' + pal.light + '"/>' +
        '<path d="M124 100 q6 -32 36 -34 q30 2 36 34 q-36 10 -72 0 Z" fill="' + pal.trim + '"/>' +
        '<path d="M124 98 q36 10 72 0 l-2 9 q-34 9 -68 0 Z" fill="' + pal.dark + '"/>' +
        '<rect x="152" y="74" width="16" height="8" rx="3" fill="' + pal.accent + '"/>';
    }
    if (gear === "woven-cap") {
      return '<path d="M120 106 q4 -40 40 -42 q36 2 40 42 q-40 12 -80 0 Z" fill="' + pal.trim + '"/>' +
        '<path d="M118 106 q42 14 84 0 l2 8 q-44 14 -88 0 Z" fill="' + pal.dark + '"/>' +
        '<path d="M128 84 q32 8 64 0 M126 94 q34 8 68 0" stroke="' + pal.accent + '" stroke-width="2.4" fill="none" opacity=".85"/>' +
        '<path d="M120 104 q-8 6 -6 20 q2 10 10 10 q4 -6 2 -14 Z" fill="' + pal.trim + '"/>' +
        '<path d="M200 104 q8 6 6 20 q-2 10 -10 10 q-4 -6 -2 -14 Z" fill="' + pal.trim + '"/>';
    }
    if (gear === "hood") {
      return '<path d="M104 138 q0 -72 56 -76 q56 4 56 76 q-10 -36 -28 -44 q-28 -12 -56 0 q-18 8 -28 44 Z" fill="#332A46"/>' +
        '<path d="M112 134 q6 -50 48 -54 q42 4 48 54 q-12 -26 -30 -32 q-18 -8 -36 0 q-18 6 -30 32 Z" fill="#463A5E"/>' +
        '<path d="M118 138 q8 -34 42 -36 q34 2 42 36" stroke="#B79BFF" stroke-width="2.6" fill="none" opacity=".85"/>' +
        '<path d="M160 62 q10 4 16 14" stroke="#7A5FBF" stroke-width="2" fill="none" opacity=".7"/>';
    }
    if (gear === "circlet") {
      return '<path d="M124 100 q36 -16 72 0" stroke="' + pal.trim + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="160" cy="90" r="7" fill="' + pal.accent + '"/>' +
        '<path d="M160 83 v-10 M154 86 l-6 -8 M166 86 l6 -8" stroke="' + pal.trim + '" stroke-width="2.4" stroke-linecap="round"/>';
    }
    return "";
  }

  function headGroup(a) {
    var style = a.hairStyle;
    var hairExtra = "";
    if (style === "mentor") hairExtra = beard(a, "beard");
    if (style === "long-white") hairExtra = beard(a, "beard-long");
    return '<g data-part="head" class="q-ca-head">' +
      '<g transform="translate(160 190) scale(.86) translate(-160 -190)">' +
      hairBack(a) +
      '<path d="M' + (160 - a.build.headRx - 3) + ' 128 a7 8 0 1 0 0 12" fill="' + a.shade + '"/>' +
      '<path d="M' + (160 + a.build.headRx + 3) + ' 128 a7 8 0 1 1 0 12" fill="' + a.shade + '"/>' +
      '<path d="' + facePath(a) + '" fill="' + a.skin + '"/>' +
      '<path d="' + facePath(a) + '" fill="none" stroke="' + a.shade + '" stroke-width="1.3" opacity=".35"/>' +
      faceDetail(a) +
      eyes(a) +
      brows(a, (a.marks || []).filter(function (m) { return /brows/.test(m); })[0]) +
      '<path d="M160 138 q-3 6 1 8 q4 1 6 -1" stroke="' + a.shade + '" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
      mouthSet(a, (a.marks || []).filter(function (m) { return /^(smirk|stern)$/.test(m); })[0]) +
      facialMarks(a) +
      hairFront(a) +
      hairSheen(a) +
      '<g data-part="head-cosmetic"></g>' +
      hairExtra +
      headgear(a) +
      '<g data-part="head-cosmetic-top"></g>' +
      '</g>' +
      '</g>';
  }

  /* ------------------------------------------------------------------ */
  /* Cuerpo y vestuario                                                 */
  /* ------------------------------------------------------------------ */
  function legBase(a) {
    var pal = a.pal;
    var stance = a.build.stance || 0;
    var lx = 145 - stance;
    var rx = 175 + stance;
    var out = '<g data-part="legs" class="q-ca-legs">';
    out += '<path d="M' + (lx - 18) + ' 336 q18 6 34 0" stroke="' + pal.dark + '" stroke-width="2" opacity=".18"/>';
    out += limb("M" + lx + " 312 L" + (lx - 5 + stance * 0.5) + " 404", "#05080E", 30);
    out += limb("M" + rx + " 312 L" + (rx + 5 - stance * 0.5) + " 404", "#05080E", 30);
    out += limb("M" + lx + " 312 L" + (lx - 5 + stance * 0.5) + " 404", pal.pants, 25);
    out += limb("M" + rx + " 312 L" + (rx + 5 - stance * 0.5) + " 404", pal.pants, 25);
    out += '<path d="M' + (lx - 9) + ' 330 q3 34 0 58 M' + (rx + 9) + ' 330 q-3 34 0 58" stroke="#FFFFFF" stroke-width="1.4" opacity=".12"/>';
    out += '<path d="M' + (lx + 7) + ' 338 q-2 34 0 56 M' + (rx - 7) + ' 338 q2 34 0 56" stroke="#000000" stroke-width="1.6" opacity=".14"/>';
    out += '<rect x="' + (lx - 22) + '" y="398" width="36" height="28" rx="10" fill="' + pal.boots + '"/>';
    out += '<rect x="' + (rx - 14) + '" y="398" width="36" height="28" rx="10" fill="' + pal.boots + '"/>';
    out += '<path d="M' + (lx - 22) + ' 410 h36 M' + (rx - 14) + ' 410 h36" stroke="' + pal.dark + '" stroke-width="2" opacity=".65"/>';
    out += '<path d="M' + (lx - 18) + ' 422 h28 M' + (rx - 10) + ' 422 h28" stroke="#000000" stroke-width="2" opacity=".3"/>';
    out += '<path d="M' + (lx - 12) + ' 402 l8 8 M' + (lx - 2) + ' 402 l8 8 M' + (rx - 4) + ' 402 l8 8 M' + (rx + 6) + ' 402 l8 8" stroke="#FFFFFF" stroke-width="1.3" opacity=".18"/>';
    out += '</g>';
    return out;
  }

  function torsoBase(a) {
    var pal = a.pal;
    var b = a.build;
    var sh = b.shoulder / 2;
    var hp = b.hip / 2;
    return '<path d="M' + (160 - sh) + ' 216 Q160 198 ' + (160 + sh) + ' 216 L' + (160 + hp + 8) + ' 306 Q160 322 ' + (160 - hp - 8) + ' 306 Z" fill="' + pal.dark + '"/>' +
      '<path d="M' + (160 - sh + 10) + ' 218 Q160 204 ' + (160 + sh - 10) + ' 218 L' + (160 + hp - 2) + ' 300 Q160 312 ' + (160 - hp + 2) + ' 300 Z" fill="' + (a.outfit === "lab" ? "#22484C" : pal.main) + '" opacity=".95"/>' +
      '<path d="M' + (160 - sh + 18) + ' 224 q16 34 10 68" stroke="#000000" stroke-width="2" fill="none" opacity=".12"/>' +
      '<path d="M' + (160 + sh - 26) + ' 226 q-8 36 -2 64" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".12"/>';
  }

  function belt(a, y, color) {
    var pal = a.pal;
    return '<path d="M' + (160 - a.build.hip / 2 - 10) + ' ' + y + ' q' + (a.build.hip / 2 + 10) + ' 10 ' + (a.build.hip + 20) + ' 0" stroke="' + (color || pal.dark) + '" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      '<rect x="150" y="' + (y - 5) + '" width="20" height="15" rx="4" fill="' + pal.trim + '"/>';
  }

  function outfit(a) {
    var pal = a.pal;
    var b = a.build;
    var sh = b.shoulder / 2;
    var out = "";
    if (a.outfit === "coat") {
      out += '<path d="M' + (160 - sh - 4) + ' 218 Q160 200 ' + (160 + sh + 4) + ' 218 L' + (160 + sh + 8) + ' 356 L' + (160 + 18) + ' 344 L' + (160 + 12) + ' 246 L' + (160 - 12) + ' 246 L' + (160 - 18) + ' 344 L' + (160 - sh - 8) + ' 356 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - sh) + ' 218 Q160 206 ' + (160 + sh) + ' 218 L' + (160 + sh - 12) + ' 238 L' + (160 + 10) + ' 240 L' + (160 - 10) + ' 240 L' + (160 - sh + 12) + ' 238 Z" fill="' + pal.light + '"/>' +
        '<path d="M' + (160 - 12) + ' 242 L' + (160 - 18) + ' 344 M' + (160 + 12) + ' 242 L' + (160 + 18) + ' 344" stroke="' + pal.trim + '" stroke-width="2.4" opacity=".8"/>' +
        belt(a, 300, pal.dark) +
        '<circle cx="160" cy="272" r="3" fill="' + pal.trim + '"/><circle cx="160" cy="286" r="3" fill="' + pal.trim + '"/>' +
        '<path d="M' + (160 - sh + 26) + ' 236 q-16 10 -16 30" stroke="' + pal.trim + '" stroke-width="2" fill="none" opacity=".45"/>';
    } else if (a.outfit === "field") {
      out += '<path d="M' + (160 - sh - 2) + ' 218 Q160 202 ' + (160 + sh + 2) + ' 218 L' + (160 + sh - 2) + ' 314 Q160 326 ' + (160 - sh + 2) + ' 314 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - 14) + ' 220 L' + (160 - 22) + ' 310 L' + (160 - 2) + ' 316 L' + (160 + 6) + ' 232 Z" fill="' + pal.light + '"/>' +
        '<path d="M' + (160 - 10) + ' 232 L' + (160 - 16) + ' 300" stroke="' + pal.dark + '" stroke-width="3"/>' +
        belt(a, 300, "#3A2A18") +
        '<rect x="' + (160 - sh + 18) + '" y="248" width="30" height="24" rx="5" fill="' + pal.dark + '"/>' +
        '<rect x="' + (160 + sh - 48) + '" y="248" width="30" height="24" rx="5" fill="' + pal.dark + '"/>' +
        '<path d="M' + (160 + 30) + ' 218 L' + (160 + 8) + ' 310" stroke="' + pal.trim + '" stroke-width="7" opacity=".9"/>' +
        '<path d="M' + (160 - sh + 22) + ' 226 q10 6 14 16" stroke="' + pal.trim + '" stroke-width="2" fill="none" opacity=".5"/>';
    } else if (a.outfit === "lab") {
      out += '<path d="M' + (160 - sh - 3) + ' 218 Q160 202 ' + (160 + sh + 3) + ' 218 L' + (160 + sh + 1) + ' 322 L' + (160 + 16) + ' 326 L' + (160 + 12) + ' 232 L' + (160 - 12) + ' 232 L' + (160 - 16) + ' 326 L' + (160 - sh - 1) + ' 322 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - sh) + ' 218 Q160 208 ' + (160 + sh) + ' 218 L' + (160 + sh - 14) + ' 240 L' + (160 + 10) + ' 242 L' + (160 - 10) + ' 242 L' + (160 - sh + 14) + ' 240 Z" fill="' + pal.light + '"/>' +
        '<path d="M' + (160 - 12) + ' 244 L' + (160 - 20) + ' 320 M' + (160 + 12) + ' 244 L' + (160 + 20) + ' 320" stroke="' + pal.dark + '" stroke-width="2" opacity=".8"/>' +
        '<rect x="' + (160 + 20) + '" y="268" width="30" height="26" rx="4" fill="' + pal.dark + '"/>' +
        '<path d="M' + (160 + 24) + ' 274 v14 M' + (160 + 31) + ' 270 v18 M' + (160 + 38) + ' 276 v12" stroke="' + pal.trim + '" stroke-width="2" stroke-linecap="round"/>' +
        '<ellipse cx="160" cy="230" rx="20" ry="11" fill="' + pal.accent + '" opacity=".9"/>' +
        '<path d="M146 230 q14 8 28 0" stroke="' + pal.dark + '" stroke-width="2" fill="none" opacity=".6"/>';
    } else if (a.outfit === "cardigan") {
      out += '<path d="M' + (160 - sh - 4) + ' 216 Q160 200 ' + (160 + sh + 4) + ' 216 L' + (160 + sh) + ' 348 L' + (160 + 18) + ' 356 L' + (160 + 14) + ' 232 L' + (160 - 14) + ' 232 L' + (160 - 18) + ' 356 L' + (160 - sh) + ' 348 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - 16) + ' 230 L' + (160 - 6) + ' 322 L' + (160 + 6) + ' 322 L' + (160 + 16) + ' 230 Z" fill="' + pal.accent + '" opacity=".92"/>' +
        '<path d="M' + (160 - 14) + ' 232 L' + (160 - 20) + ' 344 M' + (160 + 14) + ' 232 L' + (160 + 20) + ' 344" stroke="' + pal.trim + '" stroke-width="2" opacity=".55"/>' +
        '<circle cx="160" cy="258" r="3" fill="' + pal.dark + '"/><circle cx="160" cy="280" r="3" fill="' + pal.dark + '"/><circle cx="160" cy="302" r="3" fill="' + pal.dark + '"/>' +
        '<path d="M' + (160 - sh + 16) + ' 224 q14 30 10 62" stroke="' + pal.light + '" stroke-width="3" fill="none" opacity=".5"/>';
    } else if (a.outfit === "sport") {
      out += '<path d="M' + (160 - sh - 2) + ' 216 Q160 200 ' + (160 + sh + 2) + ' 216 L' + (160 + sh - 2) + ' 296 Q160 308 ' + (160 - sh + 2) + ' 296 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - sh) + ' 218 Q160 206 ' + (160 + sh) + ' 218 L' + (160 + sh - 8) + ' 240 Q160 250 ' + (160 - sh + 8) + ' 240 Z" fill="' + pal.light + '"/>' +
        '<path d="M160 238 L160 296" stroke="' + pal.trim + '" stroke-width="4"/>' +
        '<circle cx="160" cy="250" r="4" fill="' + pal.trim + '"/>' +
        '<path d="M' + (160 - sh + 16) + ' 262 q22 8 44 0" stroke="' + pal.accent + '" stroke-width="5" fill="none" opacity=".85"/>' +
        '<path d="M' + (160 - sh + 4) + ' 216 q-8 4 -10 14" stroke="' + pal.accent + '" stroke-width="6" fill="none"/>' +
        '<path d="M' + (160 + sh - 4) + ' 216 q8 4 10 14" stroke="' + pal.accent + '" stroke-width="6" fill="none"/>';
    } else if (a.outfit === "armor") {
      out += '<path d="M' + (160 - sh) + ' 216 Q160 200 ' + (160 + sh) + ' 216 L' + (160 + sh - 6) + ' 292 Q160 306 ' + (160 - sh + 6) + ' 292 Z" fill="' + pal.dark + '"/>' +
        '<path d="M' + (160 - sh + 8) + ' 220 Q160 208 ' + (160 + sh - 8) + ' 220 L' + (160 + sh - 14) + ' 284 Q160 296 ' + (160 - sh + 14) + ' 284 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - sh + 12) + ' 230 q' + (sh - 12) + ' 12 ' + (sh * 2 - 24) + ' 0" stroke="' + pal.light + '" stroke-width="2" fill="none" opacity=".7"/>' +
        '<path d="M160 222 v58 M136 226 v50 M184 226 v50" stroke="' + pal.dark + '" stroke-width="2" opacity=".7"/>' +
        '<path d="M' + (160 + sh - 4) + ' 212 q26 -4 30 20 q2 20 -14 26 q-14 4 -18 -8 q-4 -16 2 -38 Z" fill="' + pal.metal + '"/>' +
        '<path d="M' + (160 + sh + 2) + ' 216 l24 4 l4 18 q-14 12 -30 6 Z" fill="' + pal.light + '" opacity=".65"/>' +
        '<path d="M' + (160 + sh + 4) + ' 220 q14 2 16 14" stroke="' + pal.dark + '" stroke-width="2" fill="none" opacity=".5"/>' +
        belt(a, 294, "#222B36") +
        '<path d="M' + (160 - sh + 20) + ' 250 h18 M' + (160 + sh - 38) + ' 250 h18" stroke="' + pal.trim + '" stroke-width="3" stroke-linecap="round"/>';
    } else if (a.outfit === "poncho") {
      out += '<path d="M' + (160 - sh - 12) + ' 214 Q160 196 ' + (160 + sh + 12) + ' 214 L' + (160 + sh + 24) + ' 330 Q160 350 ' + (160 - sh - 24) + ' 330 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - sh - 4) + ' 250 Q160 262 ' + (160 + sh + 4) + ' 250 L' + (160 + sh + 8) + ' 270 Q160 282 ' + (160 - sh - 8) + ' 270 Z" fill="' + pal.trim + '" opacity=".9"/>' +
        '<path d="M' + (160 - sh) + ' 286 Q160 298 ' + (160 + sh) + ' 286 L' + (160 + sh - 4) + ' 300 Q160 312 ' + (160 - sh + 4) + ' 300 Z" fill="' + pal.accent + '" opacity=".85"/>' +
        '<path d="M' + (160 - sh - 6) + ' 244 l10 -10 l10 10 l-10 10 Z M' + (160 + sh - 26) + ' 244 l10 -10 l10 10 l-10 10 Z" fill="' + pal.dark + '" opacity=".7"/>' +
        '<path d="M160 214 v120" stroke="' + pal.dark + '" stroke-width="2" opacity=".45"/>';
    } else if (a.outfit === "structured") {
      out += '<path d="M' + (160 - sh - 4) + ' 214 Q160 198 ' + (160 + sh + 4) + ' 214 L' + (160 + sh + 2) + ' 356 L' + (160 + 22) + ' 348 L' + (160 + 16) + ' 236 L' + (160 - 16) + ' 236 L' + (160 - 22) + ' 348 L' + (160 - sh - 2) + ' 356 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - sh) + ' 216 Q160 204 ' + (160 + sh) + ' 216 L' + (160 + sh - 18) + ' 244 L' + (160 + 12) + ' 240 L' + (160 - 12) + ' 240 L' + (160 - sh + 18) + ' 244 Z" fill="' + pal.light + '"/>' +
        '<path d="M' + (160 - 12) + ' 244 L' + (160 - 20) + ' 344 M' + (160 + 12) + ' 244 L' + (160 + 20) + ' 344" stroke="' + pal.trim + '" stroke-width="2" opacity=".85"/>' +
        '<path d="M' + (160 - sh + 18) + ' 228 h14 v40 h-14 Z M' + (160 + sh - 32) + ' 228 h14 v40 h-14 Z" fill="' + pal.dark + '" opacity=".8"/>' +
        belt(a, 302, "#0F141C") +
        '<path d="M' + (160 - sh + 30) + ' 286 q20 6 40 0" stroke="' + pal.accent + '" stroke-width="2" fill="none" opacity=".6"/>';
    } else if (a.outfit === "robe") {
      out += '<path d="M' + (160 - sh - 6) + ' 214 Q160 196 ' + (160 + sh + 6) + ' 214 L' + (160 + sh + 12) + ' 366 L' + (160 + 24) + ' 372 L' + (160 + 14) + ' 236 L' + (160 - 14) + ' 236 L' + (160 - 24) + ' 372 L' + (160 - sh - 12) + ' 366 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - 14) + ' 236 L' + (160 - 26) + ' 366 L' + (160 - 40) + ' 368 L' + (160 - 30) + ' 300 Z" fill="' + pal.dark + '" opacity=".8"/>' +
        '<path d="M' + (160 + 14) + ' 236 L' + (160 + 26) + ' 366 L' + (160 + 40) + ' 368 L' + (160 + 30) + ' 300 Z" fill="' + pal.dark + '" opacity=".8"/>' +
        '<path d="M' + (160 - sh - 2) + ' 220 Q160 208 ' + (160 + sh + 2) + ' 220 L' + (160 + 10) + ' 248 L' + (160 - 10) + ' 248 Z" fill="' + pal.trim + '" opacity=".8"/>' +
        '<path d="M146 236 L152 362 L168 362 L174 236 Z" fill="' + pal.trim + '" opacity=".55"/>' +
        '<path d="M' + (160 - 46) + ' 358 q46 12 92 0 l2 10 q-48 12 -96 0 Z" fill="' + pal.accent + '" opacity=".85"/>' +
        '<path d="M' + (160 - 32) + ' 254 q32 14 64 0" stroke="' + pal.accent + '" stroke-width="3" fill="none" opacity=".9"/>' +
        '<circle cx="160" cy="262" r="9" fill="' + pal.accent + '"/>' +
        '<circle cx="160" cy="262" r="4" fill="' + pal.dark + '"/>' +
        '<path d="M' + (160 - sh) + ' 300 q-10 6 -12 16 M' + (160 + sh) + ' 300 q10 6 12 16" stroke="' + pal.trim + '" stroke-width="2.4" fill="none" opacity=".7"/>' +
        belt(a, 308, pal.dark);
    } else if (a.outfit === "archivist") {
      out += '<path d="M' + (160 - sh - 4) + ' 214 Q160 198 ' + (160 + sh + 4) + ' 214 L' + (160 + sh + 6) + ' 358 L' + (160 + 20) + ' 352 L' + (160 + 14) + ' 238 L' + (160 - 14) + ' 238 L' + (160 - 20) + ' 352 L' + (160 - sh - 6) + ' 358 Z" fill="' + pal.main + '"/>' +
        '<path d="M' + (160 - sh) + ' 216 Q160 204 ' + (160 + sh) + ' 216 L' + (160 + sh - 16) + ' 246 L' + (160 + 12) + ' 240 L' + (160 - 12) + ' 240 L' + (160 - sh + 16) + ' 246 Z" fill="' + pal.light + '"/>' +
        '<path d="M' + (160 - 12) + ' 242 L' + (160 - 18) + ' 348 M' + (160 + 12) + ' 242 L' + (160 + 18) + ' 348" stroke="' + pal.trim + '" stroke-width="2" opacity=".85"/>' +
        '<path d="M' + (160 - 44) + ' 270 q44 12 88 0 L' + (160 + 40) + ' 284 q-40 10 -80 0 Z" fill="' + pal.trim + '" opacity=".18"/>' +
        [[132, 268], [150, 286], [182, 266], [196, 292], [160, 304], [140, 258]].forEach(function (pt) {
          out += '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="1.8" fill="' + pal.accent + '" opacity=".9"/>';
        });
      out += '<path d="M160 258 l10 8 l-10 8 l-10 -8 Z" fill="' + pal.accent + '" opacity=".9"/>';
    }
    return out;
  }

  function armBack(a) {
    var pal = a.pal;
    var skin = a.skin;
    var sh = a.build.shoulder / 2;
    if (a.armPose === "crossed") return "";
    var hx = 160 - sh + 2;
    return sleeve("M" + (160 - sh - 3) + " 222 q-18 42 -6 74", pal.dark, 21, "#04070D") +
      '<path d="M' + (160 - sh - 2) + " 224 q-18 30 -8 62" + '" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity=".12"/>' +
      '<ellipse cx="' + (160 - sh - 4) + '" cy="' + 296 + '" rx="10" ry="5" fill="' + pal.trim + '" opacity=".35"/>' +
      hand(hx, 300, 9, skin, a.shade) +
      '<path d="M' + (hx - 5) + " 303 q5 5 10 0 M" + (hx - 3) + " 307 q3 3 6 0" + '" stroke="' + a.shade + '" stroke-width="1" fill="none" opacity=".5"/>';
  }

  function armFront(a) {
    var pal = a.pal;
    var skin = a.skin;
    var sh = a.build.shoulder / 2;
    var pose = a.armPose || "standard";
    if (pose === "crossed") {
      return sleeve("M" + (160 - sh + 4) + " 224 q-14 40 18 56", pal.main, 20, "#04070D") +
        sleeve("M" + (160 + sh - 4) + " 224 q14 40 -18 56", pal.main, 20, "#04070D") +
        limb("M" + (160 - sh + 10) + " 272 q42 16 84 -12", pal.dark, 17) +
        limb("M" + (160 + sh - 10) + " 272 q-42 14 -80 -14", pal.main, 17) +
        hand(160 + sh - 12, 262, 8, skin, a.shade) +
        hand(160 - sh + 10, 264, 8, skin, a.shade);
    }
    if (pose === "raised") {
      return sleeve("M" + (160 + sh + 1) + " 222 q24 8 26 32 q2 16 -8 24", pal.main, 21, "#04070D") +
        '<path d="M' + (160 + sh + 4) + " 236 q16 12 13 28" + '" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".14"/>' +
        '<ellipse cx="' + (160 + sh + 17) + '" cy="' + 270 + '" rx="10" ry="5" fill="' + pal.trim + '" opacity=".35" transform="rotate(-28 ' + (160 + sh + 17) + ' 270)"/>' +
        hand(160 + sh + 18, 264, 10, skin, a.shade) +
        '<path d="M' + (160 + sh + 14) + " 268 q5 5 10 1" + '" stroke="' + a.shade + '" stroke-width="1" fill="none" opacity=".5"/>';
    }
    if (pose === "forward") {
      return sleeve("M" + (160 + sh + 1) + " 222 q26 22 12 58", pal.main, 21, "#04070D") +
        '<path d="M' + (160 + sh + 2) + " 238 q16 18 9 40" + '" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".14"/>' +
        '<ellipse cx="' + (160 + sh - 6) + '" cy="' + 278 + '" rx="10" ry="5" fill="' + pal.trim + '" opacity=".35"/>' +
        hand(160 + sh - 8, 284, 10, skin, a.shade) +
        '<path d="M' + (160 + sh - 13) + " 288 q6 5 12 0" + '" stroke="' + a.shade + '" stroke-width="1" fill="none" opacity=".5"/>';
    }
    return sleeve("M" + (160 + sh + 1) + " 222 q18 34 6 66", pal.main, 21, "#04070D") +
      '<path d="M' + (160 + sh + 1) + " 236 q12 24 4 46" + '" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".14"/>' +
      '<ellipse cx="' + (160 + sh - 12) + '" cy="' + 284 + '" rx="10" ry="5" fill="' + pal.trim + '" opacity=".35"/>' +
      hand(160 + sh - 14, 292, 9, skin, a.shade) +
      '<path d="M' + (160 + sh - 19) + " 296 q6 4 11 0" + '" stroke="' + a.shade + '" stroke-width="1" fill="none" opacity=".5"/>';
  }

  /* ------------------------------------------------------------------ */
  /* Props                                                              */
  /* ------------------------------------------------------------------ */
  function prop(a) {
    var pal = a.pal;
    var out = "";
    if (a.prop === "notebook") {
      out += '<g data-part="prop" transform="translate(196 268) rotate(-12)">' +
        '<rect x="0" y="0" width="44" height="56" rx="5" fill="#F3EFE4" stroke="' + pal.dark + '" stroke-width="2"/>' +
        '<rect x="0" y="0" width="10" height="56" rx="5" fill="' + pal.trim + '"/>' +
        '<path d="M14 12 h22 M14 20 h26 M14 28 h18 M14 36 h24" stroke="' + pal.metal + '" stroke-width="2" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M34 46 l14 6 l2 10" stroke="' + pal.accent + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '</g>';
    } else if (a.prop === "map") {
      out += '<g data-part="prop" transform="translate(178 258) rotate(8)">' +
        '<path d="M0 0 q20 -8 44 0 q20 8 40 0 l0 42 q-20 8 -40 0 q-24 -8 -44 0 Z" fill="#E9DFC4" stroke="' + pal.dark + '" stroke-width="2"/>' +
        '<path d="M0 0 q20 -8 44 0 q20 8 40 0" stroke="' + pal.dark + '" stroke-width="2" fill="none" opacity=".5"/>' +
        '<path d="M12 30 q10 -14 22 -8 q10 6 20 -4" stroke="' + pal.accent + '" stroke-width="2.4" fill="none" stroke-dasharray="3 3"/>' +
        '<circle cx="34" cy="24" r="3" fill="' + pal.accent + '"/>' +
        '<path d="M56 6 l6 40" stroke="' + pal.dark + '" stroke-width="1.5" opacity=".4"/>' +
        '</g>';
    } else if (a.prop === "tablet") {
      out += '<g data-part="prop" transform="translate(174 252) rotate(6)">' +
        '<rect x="0" y="0" width="50" height="66" rx="7" fill="#1B2A36" stroke="' + pal.trim + '" stroke-width="2"/>' +
        '<rect x="5" y="6" width="40" height="46" rx="3" fill="#DCEBF2" opacity=".92"/>' +
        '<path d="M10 44 v-10 M18 44 v-18 M26 44 v-8 M34 44 v-22 M41 44 v-14" stroke="' + pal.trim + '" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="25" cy="59" r="3" fill="' + pal.trim + '"/>' +
        '</g>';
    } else if (a.prop === "book") {
      out += '<g data-part="prop" transform="translate(196 266) rotate(-6)">' +
        '<path d="M0 6 q16 -10 30 0 v44 q-14 -10 -30 0 Z" fill="' + pal.accent + '" stroke="' + pal.dark + '" stroke-width="2"/>' +
        '<path d="M30 6 q14 -10 30 0 v44 q-16 -10 -30 0 Z" fill="' + pal.light + '" stroke="' + pal.dark + '" stroke-width="2"/>' +
        '<path d="M30 6 v44" stroke="' + pal.dark + '" stroke-width="2"/>' +
        '<path d="M8 18 h14 M8 26 h14 M38 18 h14 M38 26 h14" stroke="' + pal.dark + '" stroke-width="1.6" opacity=".5"/>' +
        '<path d="M54 22 l10 -12" stroke="' + pal.trim + '" stroke-width="3" stroke-linecap="round"/>' +
        '</g>';
    } else if (a.prop === "stopwatch") {
      out += '<g data-part="prop" transform="translate(196 236)">' +
        '<circle cx="0" cy="0" r="18" fill="#E9E4F2" stroke="' + pal.dark + '" stroke-width="3"/>' +
        '<circle cx="0" cy="0" r="13" fill="none" stroke="' + pal.trim + '" stroke-width="1.6"/>' +
        '<path d="M0 0 v-9 M0 0 l7 4" stroke="' + pal.dark + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<rect x="-4" y="-24" width="8" height="6" rx="2" fill="' + pal.trim + '"/>' +
        '</g>';
    } else if (a.prop === "seal") {
      out += '<g data-part="prop" transform="translate(118 292)">' +
        '<path d="M0 0 q-8 20 2 32" stroke="' + pal.trim + '" stroke-width="3" fill="none"/>' +
        '<circle cx="2" cy="40" r="12" fill="' + pal.metal + '" stroke="' + pal.dark + '" stroke-width="2"/>' +
        '<rect x="-4" y="34" width="12" height="12" rx="2" fill="' + pal.trim + '"/>' +
        '</g>';
    } else if (a.prop === "lantern") {
      var raised = a.id === "iris";
      var tx = raised ? 200 : 208;
      var ty = raised ? 246 : 288;
      out += '<g data-part="prop" class="q-ca-lantern" transform="translate(' + tx + ' ' + ty + ')">' +
        '<circle cx="0" cy="26" r="26" fill="#F5B85C" opacity=".18"/>' +
        '<path d="M0 0 v10" stroke="' + pal.metal + '" stroke-width="3"/>' +
        '<path d="M-13 12 h26 l-3 28 h-20 Z" fill="#1B2430" stroke="' + pal.metal + '" stroke-width="2"/>' +
        '<ellipse cx="0" cy="26" rx="8" ry="11" fill="#FFDCA8"/>' +
        '<ellipse cx="0" cy="26" rx="14" ry="16" fill="' + pal.trim + '" opacity=".22"/>' +
        '<path d="M-13 12 q13 7 26 0" stroke="' + pal.metal + '" stroke-width="2" fill="none"/>' +
        '<path d="M-13 40 h26" stroke="' + pal.metal + '" stroke-width="2" fill="none"/>' +
        '<path d="M0 44 v6" stroke="' + pal.metal + '" stroke-width="2.5"/>' +
        '</g>';
    } else if (a.prop === "blueprint") {
      out += '<g data-part="prop" transform="translate(190 262) rotate(10)">' +
        '<rect x="0" y="0" width="52" height="22" rx="6" fill="#2F5FA8" stroke="#BFD4F5" stroke-width="1.6"/>' +
        '<path d="M6 6 h40 M6 11 h30 M6 16 h36" stroke="#DFE9FA" stroke-width="1.4" opacity=".8"/>' +
        '<circle cx="46" cy="16" r="2" fill="#7FD4FF"/>' +
        '</g>';
    } else if (a.prop === "staff") {
      out += '<g data-part="prop" class="q-ca-staff" transform="translate(206 300)">' +
        '<path d="M0 36 v-168" stroke="' + pal.metal + '" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="0" cy="-148" r="16" fill="none" stroke="' + pal.trim + '" stroke-width="3"/>' +
        '<circle cx="0" cy="-148" r="8" fill="' + pal.accent + '" opacity=".9"/>' +
        '<ellipse cx="0" cy="-148" rx="26" ry="9" fill="none" stroke="' + pal.accent + '" stroke-width="1.6" opacity=".8" transform="rotate(-18 0 -148)"/>' +
        '<circle cx="0" cy="-148" r="2.5" fill="#FFFFFF"/>' +
        '</g>';
    }
    return out;
  }

  function chestEmblem(a) {
    if (a.outfit === "armor" || a.outfit === "archivist") return "";
    return '<path d="M160 240 l7 7 l-7 7 l-7 -7 Z" fill="' + a.pal.trim + '" opacity=".9"/>';
  }

  function fabricAccents(a) {
    var pal = a.pal;
    var sh = a.build.shoulder / 2;
    var out = '<path d="M' + (160 - sh + 22) + ' 238 q10 40 2 64" stroke="#000000" stroke-width="2" fill="none" opacity=".16"/>' +
      '<path d="M' + (160 + sh - 24) + ' 240 q-8 40 -2 62" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".12"/>' +
      '<path d="M' + (160 - 34) + ' 304 q34 8 68 0" stroke="#000000" stroke-width="2" fill="none" opacity=".14"/>';
    if (a.outfit === "coat") {
      out += '<path d="M' + (160 - sh + 30) + ' 244 q8 30 4 56 M' + (160 + sh - 38) + ' 244 q-6 32 -2 56" stroke="' + pal.trim + '" stroke-width="1.4" fill="none" opacity=".35"/>' +
        '<path d="M' + (160 - 44) + ' 268 q16 4 32 0 M' + (160 + 12) + ' 268 q16 4 32 0" stroke="#000000" stroke-width="1.6" fill="none" opacity=".16"/>' +
        '<circle cx="' + (160 - 22) + '" cy="266" r="2" fill="' + pal.trim + '" opacity=".8"/><circle cx="' + (160 + 22) + '" cy="280" r="2" fill="' + pal.trim + '" opacity=".8"/>';
    } else if (a.outfit === "field") {
      out += '<path d="M' + (160 - sh + 24) + ' 252 h30 v22 h-30 Z M' + (160 + sh - 54) + ' 252 h30 v22 h-30 Z" fill="none" stroke="' + pal.trim + '" stroke-width="1.4" opacity=".45"/>' +
        '<path d="M' + (160 - 52) + ' 292 q52 8 104 0" stroke="' + pal.dark + '" stroke-width="4" fill="none" opacity=".55"/>';
    } else if (a.outfit === "lab") {
      out += '<path d="M' + (160 + 18) + ' 258 h32 v26 h-32 Z" fill="none" stroke="' + pal.dark + '" stroke-width="1.4" opacity=".5"/>' +
        '<path d="M' + (160 + 25) + ' 250 v34 M' + (160 + 36) + ' 248 v38" stroke="' + pal.trim + '" stroke-width="2"/>' +
        '<circle cx="' + (160 - 30) + '" cy="240" r="4" fill="' + pal.trim + '" opacity=".9"/>';
    } else if (a.outfit === "cardigan") {
      for (var i = -3; i <= 3; i += 1) {
        out += '<path d="M' + (160 + i * 11) + ' 238 q-2 32 0 64" stroke="' + pal.light + '" stroke-width="1.2" fill="none" opacity=".28"/>';
      }
      out += '<circle cx="160" cy="296" r="2.6" fill="' + pal.trim + '"/><circle cx="160" cy="286" r="2.6" fill="' + pal.trim + '"/>';
    } else if (a.outfit === "sport") {
      out += '<path d="M' + (160 - sh + 24) + ' 268 q10 -12 24 -4 M' + (160 + sh - 48) + ' 268 q10 -12 24 -4" stroke="' + pal.accent + '" stroke-width="3" fill="none" opacity=".8"/>' +
        '<path d="M160 242 v62" stroke="' + pal.dark + '" stroke-width="2" opacity=".5"/>' +
        '<rect x="156" y="248" width="8" height="12" rx="3" fill="' + pal.trim + '"/>';
    } else if (a.outfit === "armor") {
      out += '<path d="M' + (160 - sh + 20) + ' 230 q' + (sh - 20) + ' 10 ' + (sh * 2 - 40) + ' 0" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".18"/>' +
        '<circle cx="' + (160 - sh + 30) + '" cy="244" r="2.4" fill="' + pal.trim + '"/><circle cx="' + (160 + sh - 30) + '" cy="244" r="2.4" fill="' + pal.trim + '"/>' +
        '<path d="M' + (160 - 30) + ' 264 l18 8 M' + (160 + 10) + ' 278 l16 6" stroke="' + pal.light + '" stroke-width="1.2" opacity=".35"/>';
    } else if (a.outfit === "poncho") {
      out += '<path d="M' + (160 - sh - 6) + ' 270 q' + (sh + 6) + ' 10 ' + (sh * 2 + 12) + ' 0" stroke="' + pal.dark + '" stroke-width="2" fill="none" opacity=".45"/>' +
        '<path d="M' + (160 - sh - 2) + ' 300 q' + (sh + 2) + ' 10 ' + (sh * 2 + 4) + ' 0" stroke="' + pal.dark + '" stroke-width="2" fill="none" opacity=".45"/>' +
        '<circle cx="' + (160 - 14) + '" cy="256" r="2" fill="' + pal.accent + '"/><circle cx="' + (160 + 14) + '" cy="256" r="2" fill="' + pal.accent + '"/>';
    } else if (a.outfit === "structured") {
      out += '<path d="M' + (160 - sh + 26) + ' 228 l18 18 M' + (160 + sh - 26) + ' 228 l-18 18" stroke="' + pal.trim + '" stroke-width="2" opacity=".55"/>' +
        '<path d="M' + (160 - 42) + ' 258 h84" stroke="' + pal.accent + '" stroke-width="1.4" opacity=".35"/>' +
        '<rect x="' + (160 - 40) + '" y="268" width="18" height="3" rx="1.5" fill="' + pal.accent + '" opacity=".6"/>';
    } else if (a.outfit === "robe") {
      out += '<path d="M' + (160 - 20) + ' 246 q20 8 40 0 M' + (160 - 24) + ' 332 q24 8 48 0" stroke="' + pal.trim + '" stroke-width="1.6" fill="none" opacity=".55"/>' +
        '<path d="M' + (160 - 34) + ' 292 l8 -8 l8 8 l-8 8 Z" fill="' + pal.accent + '" opacity=".5"/>';
    } else if (a.outfit === "archivist") {
      out += '<path d="M' + (160 - 44) + ' 250 q44 12 88 0" stroke="' + pal.trim + '" stroke-width="1.4" fill="none" opacity=".45"/>' +
        '<circle cx="' + (160 - 14) + '" cy="282" r="2" fill="' + pal.accent + '"/><circle cx="' + (160 + 18) + '" cy="294" r="1.6" fill="' + pal.accent + '"/><circle cx="' + (160 + 36) + '" cy="276" r="1.6" fill="' + pal.accent + '"/>';
    }
    out += '<path d="M' + (160 - sh + 14) + ' 224 q-6 8 -6 20 M' + (160 + sh - 14) + ' 224 q6 8 6 20" stroke="' + pal.trim + '" stroke-width="1.8" fill="none" opacity=".35"/>';
    out += '<circle cx="' + (160 + sh - 15) + '" cy="294" r="10" fill="none" stroke="' + pal.trim + '" stroke-width="2" opacity=".28"/>';
    return out;
  }

  function signatureDetails(a) {
    var pal = a.pal;
    var out = "";
    if (a.id === "ilan") {
      out += '<path d="M138 206 q22 14 44 0 l4 10 q-26 14 -52 0 Z" fill="' + pal.accent + '" opacity=".9"/>' +
        '<path d="M180 206 q10 8 4 18" stroke="' + pal.accent + '" stroke-width="4" fill="none" opacity=".7"/>' +
        '<rect x="' + (160 + 22) + '" y="252" width="28" height="20" rx="2" fill="' + pal.dark + '" stroke="' + pal.trim + '" stroke-width="1" transform="rotate(-6 174 262)"/>' +
        '<path d="M148 232 l10 6" stroke="' + pal.trim + '" stroke-width="1.4" opacity=".7"/>';
    } else if (a.id === "mara") {
      out += '<path d="M116 224 L206 300" stroke="' + pal.dark + '" stroke-width="8" opacity=".55"/>' +
        '<rect x="' + (160 + 32) + '" y="284" width="38" height="30" rx="6" fill="' + pal.trim + '" stroke="' + pal.dark + '" stroke-width="1.6"/>' +
        '<path d="M' + (160 + 38) + ' 290 h26 M' + (160 + 38) + ' 298 h18" stroke="' + pal.dark + '" stroke-width="1.2" opacity=".55"/>' +
        '<path d="M128 226 q10 6 12 18 M196 226 q-8 6 -10 16" stroke="' + pal.accent + '" stroke-width="2" fill="none" opacity=".55"/>' +
        '<path d="M118 120 l12 8" stroke="' + pal.accent + '" stroke-width="2"/>';
    } else if (a.id === "noa") {
      out += '<rect x="' + (160 + 20) + '" y="236" width="34" height="26" rx="3" fill="#F6F9FF" stroke="' + pal.dark + '" stroke-width="1.2"/>' +
        '<path d="M' + (160 + 26) + ' 242 h22 M' + (160 + 26) + ' 248 h16 M' + (160 + 26) + ' 254 h20" stroke="' + pal.trim + '" stroke-width="1.4"/>' +
        '<circle cx="' + (160 - 28) + '" cy="238" r="5" fill="' + pal.trim + '" opacity=".9"/>' +
        '<path d="M' + (160 - 30) + ' 234 v-8 M' + (160 - 24) + ' 236 v-6" stroke="' + pal.dark + '" stroke-width="1.4"/>';
    } else if (a.id === "teo") {
      out += '<path d="M138 204 q22 16 44 0 l6 14 q-28 16 -56 0 Z" fill="' + pal.trim + '" opacity=".55"/>' +
        '<path d="M' + (160 + 26) + ' 250 v24 M' + (160 + 32) + ' 248 v28" stroke="' + pal.accent + '" stroke-width="3" opacity=".35"/>' +
        '<path d="M148 292 q12 8 24 0" stroke="' + pal.trim + '" stroke-width="1.4" fill="none" opacity=".5"/>';
    } else if (a.id === "lia") {
      out += '<path d="M160 232 v64" stroke="' + pal.trim + '" stroke-width="3"/>' +
        '<rect x="155" y="238" width="10" height="14" rx="4" fill="' + pal.accent + '"/>' +
        '<path d="M126 284 q34 10 68 0" stroke="' + pal.accent + '" stroke-width="4" fill="none" opacity=".75"/>' +
        '<circle cx="' + (160 + 30) + '" cy="274" r="5" fill="none" stroke="' + pal.trim + '" stroke-width="2"/>';
    } else if (a.id === "kian") {
      out += '<path d="M' + (160 + a.build.shoulder / 2 - 2) + ' 214 l34 6 l4 22 q-18 12 -34 4 Z" fill="' + pal.metal + '"/>' +
        '<path d="M' + (160 + a.build.shoulder / 2 + 4) + ' 220 l24 4" stroke="#FFFFFF" stroke-width="1.8" opacity=".3"/>' +
        '<circle cx="' + (160 - 20) + '" cy="248" r="2.6" fill="' + pal.trim + '"/><circle cx="' + (160 + 20) + '" cy="248" r="2.6" fill="' + pal.trim + '"/>' +
        '<path d="M124 250 h20 M176 250 h20" stroke="' + pal.trim + '" stroke-width="2.4"/>' +
        '<path d="M158 214 l10 8 l-10 8 l-10 -8 Z" fill="' + pal.accent + '" opacity=".8"/>';
    } else if (a.id === "amaru") {
      out += '<path d="M112 244 l10 -10 l10 10 l-10 10 Z M188 244 l10 -10 l10 10 l-10 10 Z" fill="' + pal.accent + '" opacity=".8"/>' +
        '<path d="M136 206 q24 12 48 0" stroke="' + pal.trim + '" stroke-width="3" fill="none"/>' +
        '<path d="M' + (160 + 20) + ' 230 q14 22 6 48" stroke="' + pal.dark + '" stroke-width="5" fill="none" opacity=".45"/>' +
        '<circle cx="' + (160 + 28) + '" cy="288" r="4" fill="' + pal.accent + '" opacity=".8"/>';
    } else if (a.id === "ona") {
      out += '<path d="M126 206 l14 10 l-14 10 Z M194 206 l-14 10 l14 10 Z" fill="' + pal.trim + '" opacity=".55"/>' +
        '<path d="M' + (160 + 34) + ' 238 q18 0 20 18 q-2 18 -20 20" stroke="' + pal.trim + '" stroke-width="2" fill="none" opacity=".7"/>' +
        '<path d="M' + (160 + 34) + ' 244 h14 M' + (160 + 34) + ' 252 h18 M' + (160 + 34) + ' 260 h12" stroke="' + pal.accent + '" stroke-width="1.6" opacity=".8"/>' +
        '<circle cx="' + (160 + a.build.headRx) + '" cy="128" r="3" fill="' + pal.trim + '"/>';
    } else if (a.id === "iris") {
      out += '<path d="M134 204 q26 18 52 0 l-6 18 q-20 10 -40 0 Z" fill="' + pal.trim + '" opacity=".6"/>' +
        '<path d="M128 254 q32 12 64 0" stroke="' + pal.accent + '" stroke-width="2" fill="none" opacity=".8"/>' +
        '<circle cx="160" cy="260" r="8" fill="' + pal.accent + '" opacity=".9"/><circle cx="160" cy="260" r="3.4" fill="' + pal.dark + '"/>' +
        '<path d="M196 300 q10 8 8 24" stroke="' + pal.accent + '" stroke-width="2" fill="none" opacity=".5"/>';
    } else if (a.id === "zenon") {
      out += '<path d="M126 212 q34 12 68 0" stroke="' + pal.trim + '" stroke-width="2" fill="none" opacity=".7"/>' +
        '<path d="M136 236 l10 6 l-4 12 l-10 -6 Z M184 252 l10 -6 l6 10 l-10 6 Z" stroke="' + pal.accent + '" stroke-width="1.2" fill="none" opacity=".7"/>' +
        '<path d="M' + (160 - 30) + ' 274 q30 10 60 0" stroke="' + pal.trim + '" stroke-width="1.4" fill="none" opacity=".55"/>' +
        '<circle cx="' + (160 - 20) + '" cy="290" r="2" fill="' + pal.accent + '"/><circle cx="' + (160 + 18) + '" cy="300" r="1.6" fill="' + pal.accent + '"/>' +
        '<path d="M120 208 q-8 40 4 64" stroke="' + pal.trim + '" stroke-width="1.8" fill="none" opacity=".45"/>';
    }
    out += '<path d="M' + (160 + a.build.shoulder / 2 - 8) + ' 222 q10 26 2 52" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".12"/>';
    return out;
  }

  function drawCharacter(a) {
    var out = "";
    out += '<ellipse cx="160" cy="438" rx="94" ry="11" fill="#000000" opacity=".4"/>';
    out += '<ellipse cx="160" cy="438" rx="56" ry="6" fill="#000000" opacity=".35"/>';
    out += '<g data-part="figure" class="q-ca-figure" stroke="#05080E" stroke-width="1" stroke-opacity=".22" stroke-linejoin="round">';
    out += '<g data-part="cos-legs">' + legBase(a) + '</g>';
    out += '<g data-part="arm-back" class="q-ca-arm-back">' + armBack(a) + '</g>';
    out += torsoBase(a);
    out += outfit(a);
    out += fabricAccents(a);
    out += chestEmblem(a);
    out += signatureDetails(a);
    out += '<g data-part="cos-torso"></g>';
    out += '<g data-part="arm-front" class="q-ca-arm-front">' + armFront(a) + '</g>';
    out += prop(a);
    out += '<path d="M145 168 h30 v42 h-30 z" fill="' + a.shade + '"/>' +
      '<path d="M145 168 h30 v12 h-30 z" fill="#000000" opacity=".2"/>';
    out += headGroup(a);
    out += '<g data-part="cos-front"></g>';
    out += '</g>';
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Capas cosméticas                                                   */
  /* ------------------------------------------------------------------ */
  var COSMETIC_ART = {
    "cabeza-diadema": '<path d="M118 112 Q160 86 202 112" stroke="#9FC4FF" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<circle cx="134" cy="101" r="4.5" fill="#7AA2FF"/><circle cx="160" cy="94" r="5.5" fill="#B79BFF"/><circle cx="186" cy="101" r="4.5" fill="#7AA2FF"/>' +
      '<circle cx="160" cy="94" r="12" fill="#B79BFF" opacity=".22"/>',
    "cabeza-casco": '<path d="M116 116 Q120 76 160 72 Q200 76 204 116 L204 124 Q160 138 116 124 Z" fill="#5C6F86" stroke="#B9C4D2" stroke-width="2"/>' +
      '<path d="M116 114 Q160 128 204 114 L204 122 Q160 136 116 122 Z" fill="#2B3746"/>' +
      '<rect x="130" y="108" width="60" height="9" rx="4" fill="#7FD4FF" opacity=".55"/>' +
      '<path d="M122 96 q14 -16 38 -16" stroke="#E8EDF5" stroke-width="2" fill="none" opacity=".7"/>' +
      '<path d="M204 100 q10 6 8 18" stroke="#C9A25A" stroke-width="3" fill="none"/>',
    "cabeza-gorro": '<ellipse cx="160" cy="104" rx="50" ry="11" fill="#6B431F"/>' +
      '<path d="M124 102 q6 -26 36 -28 q30 2 36 28 q-36 10 -72 0 Z" fill="#A9713B"/>' +
      '<path d="M124 100 q36 10 72 0 l-2 9 q-34 9 -68 0 Z" fill="#8A5A2B"/>' +
      '<circle cx="160" cy="86" r="5" fill="#F5B85C"/>',
    "cabeza-corona": '<path d="M124 100 L130 70 L144 86 L160 58 L176 86 L190 70 L196 100 Q160 112 124 100 Z" fill="#F5B85C" stroke="#C98A3E" stroke-width="2"/>' +
      '<circle cx="160" cy="88" r="5" fill="#B79BFF"/>' +
      '<circle cx="136" cy="88" r="3.4" fill="#7AA2FF"/><circle cx="184" cy="88" r="3.4" fill="#7AA2FF"/>' +
      '<path d="M124 100 q36 12 72 0" stroke="#FFF0C9" stroke-width="2" fill="none" opacity=".8"/>',
    "cabeza-auriculares": '<path d="M116 124 Q118 78 160 76 Q202 78 204 124" stroke="#2A3140" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<rect x="102" y="112" width="20" height="38" rx="9" fill="#2A3140" stroke="#7AA2FF" stroke-width="2"/>' +
      '<rect x="198" y="112" width="20" height="38" rx="9" fill="#2A3140" stroke="#7AA2FF" stroke-width="2"/>' +
      '<path d="M110 128 h6 M204 128 h6" stroke="#7AA2FF" stroke-width="3" stroke-linecap="round"/>',
    "peinado-coleta": '<path d="M186 90 q46 -20 52 22 q4 30 -20 44 q18 -30 -6 -46 q-18 -10 -26 -20 Z" fill="#6B3A2A"/>' +
      '<path d="M196 96 q26 -6 32 16" stroke="#9A5A3E" stroke-width="3" fill="none" opacity=".8"/>' +
      '<path d="M120 110 q10 -22 34 -26" stroke="#6B3A2A" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<circle cx="188" cy="92" r="6" fill="#F5B85C"/>',
    "peinado-rizos": '<g fill="#241E33">' +
      '<circle cx="124" cy="102" r="16"/><circle cx="142" cy="86" r="18"/><circle cx="164" cy="82" r="18"/>' +
      '<circle cx="186" cy="90" r="16"/><circle cx="200" cy="108" r="13"/><circle cx="118" cy="120" r="12"/>' +
      '</g><path d="M132 82 q16 -8 30 -2" stroke="#4A4066" stroke-width="2.4" fill="none" opacity=".8"/>',
    "peinado-mecha": '<path d="M150 80 q18 4 24 28 q-12 -8 -22 -10 q0 -10 -2 -18 Z" fill="#B79BFF"/>' +
      '<path d="M176 82 q10 6 12 18" stroke="#D8C6FF" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M118 116 q6 -18 20 -24" stroke="#B79BFF" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>',
    "peinado-mono": '<circle cx="160" cy="68" r="18" fill="#2B2333"/>' +
      '<path d="M146 64 q14 -8 28 0" stroke="#4E3F5C" stroke-width="2.4" fill="none"/>' +
      '<path d="M120 114 q8 -20 28 -26" stroke="#2B2333" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      '<path d="M200 114 q-8 -20 -28 -26" stroke="#2B2333" stroke-width="10" fill="none" stroke-linecap="round"/>',
    "torso-abrigo": '<path d="M104 216 Q160 198 216 216 L224 352 L196 358 L188 262 L132 262 L124 358 L96 352 Z" fill="#1E2A45" opacity=".97"/>' +
      '<path d="M132 220 L160 258 L188 220 L200 226 L168 276 L160 314 L152 276 L120 226 Z" fill="#141C30"/>' +
      '<path d="M132 262 L126 352 M188 262 L194 352" stroke="#7AA2FF" stroke-width="2" opacity=".8"/>' +
      '<circle cx="196" cy="286" r="3.4" fill="#7AA2FF"/><circle cx="198" cy="302" r="3.4" fill="#7AA2FF"/>' +
      '<path d="M104 232 q18 12 22 34" stroke="#3A4E78" stroke-width="2" fill="none" opacity=".7"/>',
    "torso-bata": '<path d="M102 214 Q160 198 218 214 L216 320 L196 326 L188 240 L132 240 L124 326 L104 320 Z" fill="#EEF2F8" opacity=".96"/>' +
      '<path d="M132 216 L160 252 L188 216 L198 222 L168 270 L160 316 L152 270 L122 222 Z" fill="#D5DFEC"/>' +
      '<path d="M132 240 L126 320 M188 240 L194 320" stroke="#B9C6DA" stroke-width="2"/>' +
      '<rect x="196" y="266" width="24" height="22" rx="3" fill="#D5DFEC" stroke="#B9C6DA" stroke-width="1.5"/>' +
      '<path d="M200 272 v12 M207 270 v14 M214 274 v10" stroke="#69D3C1" stroke-width="2"/>' +
      '<circle cx="160" cy="236" r="4" fill="#B9C6DA"/>',
    "torso-manto": '<path d="M92 212 Q160 190 228 212 L240 306 Q160 336 80 306 Z" fill="#2A2140" opacity=".97"/>' +
      '<path d="M92 212 Q160 194 228 212 L232 228 Q160 212 88 228 Z" fill="#3C2F5C"/>' +
      '<path d="M100 240 Q160 254 220 240" stroke="#B79BFF" stroke-width="2" fill="none" opacity=".6"/>' +
      [[120, 270], [146, 284], [182, 268], [204, 288], [160, 300], [132, 306]].map(function (pt) {
        return '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="2" fill="#E8DEFF"/>';
      }).join("") +
      '<path d="M96 300 q64 26 128 0" stroke="#B79BFF" stroke-width="2.4" fill="none" opacity=".5"/>',
    "torso-chaleco": '<path d="M118 212 Q160 200 202 212 L198 302 Q160 314 122 302 Z" fill="#2E4A3E" opacity=".95"/>' +
      '<path d="M160 206 v100" stroke="#B8D46A" stroke-width="3"/>' +
      '<rect x="126" y="256" width="24" height="18" rx="3" fill="#223A30"/><rect x="170" y="256" width="24" height="18" rx="3" fill="#223A30"/>' +
      '<path d="M122 228 q38 12 76 0" stroke="#B8D46A" stroke-width="2" fill="none" opacity=".6"/>' +
      '<circle cx="160" cy="216" r="3.6" fill="#B8D46A"/>',
    "torso-poncho": '<path d="M100 212 Q160 194 220 212 L236 330 Q160 348 84 330 Z" fill="#1E7A78" opacity=".97"/>' +
      '<path d="M104 252 Q160 264 216 252 L220 272 Q160 284 100 272 Z" fill="#E8A24C"/>' +
      '<path d="M98 290 Q160 302 222 290 L226 306 Q160 318 94 306 Z" fill="#C9524A" opacity=".92"/>' +
      [[118, 240], [138, 240], [158, 240], [178, 240], [198, 240]].map(function (pt, i) {
        return '<path d="M' + pt[0] + ' 236 l7 7 l-7 7 l-7 -7 Z" fill="#145E5C" opacity="' + (0.5 + i * 0.08) + '"/>';
      }).join("") +
      '<path d="M100 212 q60 12 120 0" stroke="#2A9391" stroke-width="3" fill="none"/>',
    "piernas-ruta": '<path d="M132 330 q18 8 16 34 M188 330 q-14 8 -12 34" stroke="#3A2A18" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<rect x="124" y="356" width="40" height="16" rx="7" fill="#2A241C"/>' +
      '<rect x="160" y="356" width="40" height="16" rx="7" fill="#2A241C"/>' +
      '<circle cx="144" cy="364" r="4" fill="#F5B85C"/><circle cx="180" cy="364" r="4" fill="#F5B85C"/>',
    "piernas-falda": '<path d="M124 302 L100 372 Q160 386 220 372 L196 302 Q160 314 124 302 Z" fill="#3C4A5C" opacity=".96"/>' +
      '<path d="M118 320 Q160 332 202 320 M108 346 Q160 360 212 346" stroke="#8FA6BF" stroke-width="2" fill="none" opacity=".65"/>' +
      '<path d="M124 302 Q160 312 196 302" stroke="#B9C6DA" stroke-width="2" fill="none"/>' +
      '<rect x="154" y="308" width="12" height="16" rx="3" fill="#F5B85C" opacity=".9"/>',
    "piernas-grebas": '<path d="M128 344 q6 30 2 58 M192 344 q-6 30 -2 58" stroke="#8FA6BF" stroke-width="11" fill="none" stroke-linecap="round"/>' +
      '<path d="M124 350 h24 v14 h-24 Z M172 350 h24 v14 h-24 Z" fill="#C9A25A"/>' +
      '<path d="M132 388 q8 6 16 0 M172 388 q8 6 16 0" stroke="#5C6F86" stroke-width="3" fill="none"/>',
    "accesorios-gafas": '<path d="M124 124 h30 q6 0 6 7 v6 q0 8 -8 8 h-22 q-8 0 -8 -8 v-5 q0 -8 8 -8 Z" fill="#9FC4FF" opacity=".22" stroke="#C9D4E5" stroke-width="2.4"/>' +
      '<path d="M166 124 h30 q6 0 6 7 v6 q0 8 -8 8 h-22 q-8 0 -8 -8 v-5 q0 -8 8 -8 Z" fill="#9FC4FF" opacity=".22" stroke="#C9D4E5" stroke-width="2.4"/>' +
      '<path d="M160 130 h6" stroke="#C9D4E5" stroke-width="2.4"/>' +
      '<path d="M124 128 l-8 -2 M196 128 l8 -2" stroke="#C9D4E5" stroke-width="2"/>',
    "accesorios-brujula": '<circle cx="104" cy="298" r="11" fill="#C9A25A" stroke="#3A2A18" stroke-width="2"/>' +
      '<circle cx="104" cy="298" r="6" fill="#F3EFE4"/>' +
      '<path d="M104 293 v10 M101 298 h6" stroke="#C9524A" stroke-width="1.8"/>' +
      '<path d="M96 286 q8 -4 16 0" stroke="#3A2A18" stroke-width="4" fill="none"/>',
    "accesorios-bolso": '<path d="M196 220 L222 310" stroke="#3A2A18" stroke-width="9" opacity=".95"/>' +
      '<rect x="204" y="292" width="42" height="34" rx="7" fill="#7A4B34" stroke="#3A2A18" stroke-width="2"/>' +
      '<path d="M204 302 h42" stroke="#3A2A18" stroke-width="2" opacity=".7"/>' +
      '<circle cx="225" cy="302" r="3.4" fill="#F5B85C"/>' +
      '<rect x="212" y="286" width="20" height="10" rx="3" fill="#8A5A2B"/>',
    "accesorios-pluma": '<path d="M206 236 q18 -16 26 2 q-12 16 -26 10 Z" fill="#B79BFF" stroke="#7A5FBF" stroke-width="1.6"/>' +
      '<path d="M208 244 l-12 26" stroke="#E8DEFF" stroke-width="2.4"/>' +
      '<path d="M198 266 l-3 8 l6 -3 Z" fill="#F5B85C"/>' +
      '<path d="M212 240 q10 0 14 4" stroke="#E8DEFF" stroke-width="1.6" fill="none"/>',
    "amuleto-enfoque": '<path d="M148 210 q12 8 24 0" stroke="#C9A25A" stroke-width="2" fill="none"/>' +
      '<path d="M160 216 v26" stroke="#C9A25A" stroke-width="2"/>' +
      '<path d="M160 242 l11 14 l-11 18 l-11 -18 Z" fill="#7AA2FF" stroke="#DCE6FF" stroke-width="1.6"/>' +
      '<path d="M160 246 v20" stroke="#DCE6FF" stroke-width="1.4" opacity=".7"/>' +
      '<circle cx="160" cy="258" r="22" fill="#7AA2FF" opacity=".16"/>',
    "amuleto-sello": '<path d="M148 210 q12 8 24 0" stroke="#C9A25A" stroke-width="2" fill="none"/>' +
      '<circle cx="160" cy="258" r="17" fill="#8C6A32" stroke="#F5D9A0" stroke-width="2"/>' +
      '<rect x="152" y="250" width="16" height="16" rx="2" fill="#F5D9A0" opacity=".85"/>' +
      '<path d="M156 254 h8 M156 258 h8 M156 262 h8" stroke="#8C6A32" stroke-width="1.4"/>' +
      '<circle cx="160" cy="258" r="25" fill="#F5B85C" opacity=".12"/>',
    "amuleto-nudo": '<path d="M146 212 q14 10 28 0" stroke="#C9A25A" stroke-width="2" fill="none"/>' +
      '<path d="M160 218 v20" stroke="#DCE6FF" stroke-width="2"/>' +
      '<circle cx="160" cy="246" r="8" fill="none" stroke="#69D3C1" stroke-width="5"/>' +
      '<path d="M152 252 q8 16 16 0" stroke="#69D3C1" stroke-width="4" fill="none"/>' +
      '<circle cx="160" cy="246" r="14" fill="#69D3C1" opacity=".16"/>',
    "amuleto-criterio": '<path d="M146 212 q14 10 28 0" stroke="#C9A25A" stroke-width="2" fill="none"/>' +
      '<path d="M160 220 v20" stroke="#C9A25A" stroke-width="2"/>' +
      '<path d="M160 238 l13 12 l-13 24 l-13 -24 Z" fill="#B79BFF" stroke="#F0E6FF" stroke-width="1.8"/>' +
      '<path d="M160 242 v26 M150 250 h20" stroke="#F0E6FF" stroke-width="1.2" opacity=".7"/>' +
      '<circle cx="160" cy="260" r="28" fill="#B79BFF" opacity=".2"/>',
    "efecto-aura": '<defs><radialGradient id="qca-aura-g" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="#F5B85C" stop-opacity=".55"/><stop offset="60%" stop-color="#B79BFF" stop-opacity=".18"/><stop offset="100%" stop-color="#B79BFF" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="160" cy="250" rx="128" ry="176" fill="url(#qca-aura-g)"/>' +
      '<circle cx="160" cy="250" r="120" fill="none" stroke="#F5B85C" stroke-width="1.2" opacity=".35"/>',
    "efecto-chispas": '<g fill="#F5B85C">' +
      [[92, 190, 4], [232, 204, 3], [108, 316, 3], [222, 330, 4], [80, 260, 2.5], [246, 268, 2.5], [130, 150, 2.5], [196, 148, 3]].map(function (s) {
        return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '"/>';
      }).join("") + '</g>' +
      '<g stroke="#FFE1AE" stroke-width="1.6" opacity=".8"><path d="M92 178 v24 M80 190 h24"/><path d="M232 192 v24 M220 204 h24"/></g>',
    "efecto-bruma": '<ellipse cx="160" cy="414" rx="112" ry="24" fill="#9FC4FF" opacity=".16"/>' +
      '<ellipse cx="122" cy="398" rx="62" ry="16" fill="#9FC4FF" opacity=".12"/>' +
      '<ellipse cx="204" cy="404" rx="58" ry="14" fill="#D8C6FF" opacity=".12"/>',
    "efecto-constelacion": '<g stroke="#B79BFF" stroke-width="1.2" opacity=".75"><path d="M92 120 L124 96 L152 116 L190 88 L232 112"/></g>' +
      '<g fill="#F5D9A0">' +
      [[92, 120, 3], [124, 96, 4], [152, 116, 2.6], [190, 88, 4], [232, 112, 3], [70, 248, 2.4], [250, 236, 2.4]].map(function (s) {
        return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '"/>';
      }).join("") + '</g>' +
      '<circle cx="190" cy="88" r="12" fill="#F5D9A0" opacity=".16"/>',
    "marco-bronce": '<rect x="10" y="10" width="300" height="440" rx="22" fill="none" stroke="#A9713F" stroke-width="3"/>' +
      '<path d="M10 50 V32 q0 -22 22 -22 h18 M300 50 V32 q0 -22 -22 -22 h-18 M10 410 v18 q0 22 22 22 h18 M300 410 v18 q0 22 -22 22 h-18" fill="none" stroke="#E0B57A" stroke-width="3" stroke-linecap="round"/>',
    "marco-platino": '<rect x="10" y="10" width="300" height="440" rx="18" fill="none" stroke="#C9D4E5" stroke-width="2"/>' +
      '<rect x="17" y="17" width="286" height="426" rx="14" fill="none" stroke="#7AA2FF" stroke-width="1" opacity=".7"/>' +
      '<path d="M10 70 h16 M10 90 h10 M310 70 h-16 M310 90 h-10 M10 390 h16 M10 370 h10 M310 390 h-16 M310 370 h-10" stroke="#E8EDF5" stroke-width="2"/>',
    "marco-vacio": '<rect x="9" y="9" width="302" height="442" rx="24" fill="none" stroke="#1A1328" stroke-width="10"/>' +
      '<rect x="9" y="9" width="302" height="442" rx="24" fill="none" stroke="#B79BFF" stroke-width="2" opacity=".9"/>' +
      '<rect x="18" y="18" width="284" height="424" rx="18" fill="none" stroke="#6A3FA8" stroke-width="1.4" opacity=".7"/>' +
      '<path d="M9 120 v-70 q0 -28 28 -28 h60 M311 120 v-70 q0 -28 -28 -28 h-60 M9 340 v70 q0 28 28 28 h60 M311 340 v70 q0 28 -28 28 h-60" fill="none" stroke="#E8DEFF" stroke-width="2.4" stroke-linecap="round"/>',
    "marco-constelacion": '<rect x="10" y="10" width="300" height="440" rx="26" fill="none" stroke="#F5B85C" stroke-width="2.4"/>' +
      '<path d="M10 150 q150 -70 300 0" fill="none" stroke="#B79BFF" stroke-width="1.2" opacity=".6"/>' +
      '<g fill="#F5D9A0"><circle cx="34" cy="34" r="4"/><circle cx="286" cy="34" r="3"/><circle cx="34" cy="426" r="3"/><circle cx="286" cy="426" r="4"/><circle cx="160" cy="18" r="2.6"/></g>' +
      '<path d="M28 46 l8 8 M292 46 l-8 8 M28 414 l8 -8 M292 414 l-8 -8" stroke="#F5D9A0" stroke-width="1.6"/>'
  };

  var LAYER_OF = {
    cabeza: "head",
    peinado: "hair",
    torso: "torso",
    piernas: "legs",
    accesorios: "accessory",
    extras: "accessory",
    amuletos: "amulet",
    efectos: "effect",
    marcos: "frame"
  };

  function cosmeticLayer(cosmeticOrId) {
    var cosmetic = typeof cosmeticOrId === "string" ? Chars.cosmeticById(cosmeticOrId) : cosmeticOrId;
    if (!cosmetic || !cosmetic.assetReferences) return "";
    return COSMETIC_ART[cosmetic.assetReferences.artKey] || "";
  }

  function layerMarkup(layers, layer) {
    return '<g data-cos-layer="' + layer + '">' + (layers[layer] || []).map(cosmeticLayer).join("") + '</g>';
  }

  /* ------------------------------------------------------------------ */
  /* Retrato                                                            */
  /* ------------------------------------------------------------------ */
  function resolveLayers(characterId, equipped) {
    var layers = { effect: [], legs: [], torso: [], hair: [], head: [], accessory: [], amulet: [], frame: [] };
    var map = equipped && typeof equipped === "object" ? equipped : {};
    Object.keys(map).forEach(function (slotId) {
      var cosmetic = Chars.cosmeticById(map[slotId]);
      if (!cosmetic) return;
      if (!Chars.isCompatible(characterId, cosmetic.id)) return;
      var layer = LAYER_OF[cosmetic.category] || "torso";
      layers[layer].push(cosmetic);
    });
    return layers;
  }

  function insertCosmetics(markup, characterId, layers) {
    // Inserta cada capa cosmética en su anclaje real dentro del retrato.
    var out = markup.replace('<g data-part="cos-legs">', '<g data-part="cos-legs">' + layerMarkup(layers, "legs"));
    out = out.replace('<g data-part="cos-torso"></g>', layerMarkup(layers, "torso"));
    out = out.replace('<g data-part="head-cosmetic"></g>', layerMarkup(layers, "hair"));
    out = out.replace('<g data-part="head-cosmetic-top"></g>', layerMarkup(layers, "head"));
    out = out.replace('<g data-part="cos-front"></g>', layerMarkup(layers, "accessory") + layerMarkup(layers, "amulet"));
    return out;
  }

  function portraitWithCosmetics(characterId, equipped, options) {
    var opts = options || {};
    var character = Chars.byId(characterId) || Chars.byId(Chars.starterId);
    var cacheKey = character.id + "|" + outfitKey(equipped) + "|" + (opts.state || "idle") + "|" +
      (opts.hero ? "h" : "") + (opts.compact ? "c" : "") + (opts.thumb ? "t" : "") + "|" +
      (opts.tag || "div") + "|" + (opts.viewBox || "") + "|" + (opts.className || "") + "|" + (opts.ariaLabel || "");
    var cached = cacheGet(portraitCache, cacheKey);
    if (cached) return cached;
    var baseArt = ART[character.id] || ART.ilan;
    var art = Object.assign({}, baseArt, { id: character.id, pal: Object.assign({}, baseArt.pal) });
    var layers = resolveLayers(character.id, equipped);
    var rarity = character.rarityMeta;
    var state = opts.state || "idle";
    var glowId = uid("glow");
    var skinId = uid("skin");
    var mainId = uid("main");
    var hairId = uid("hair");
    var skinTop = lighten(baseArt.skin, 22);
    var skinShade = darken(baseArt.skin, 26);
    var mainLight = baseArt.pal.light || lighten(baseArt.pal.main, 18);
    var mainDark = baseArt.pal.dark || darken(baseArt.pal.main, 22);
    art.skin = "url(#" + skinId + ")";
    art.hair = "url(#" + hairId + ")";
    art.pal.main = "url(#" + mainId + ")";
    art.pal.light = mainLight;
    art.pal.dark = mainDark;
    var classes = ["q-char", "q-rarity--" + character.rarity];
    if (opts.compact) classes.push("q-char--compact");
    if (opts.hero) classes.push("q-char--hero");
    if (opts.thumb) classes.push("q-char--thumb");
    if (opts.className) classes.push(opts.className);
    var aria = opts.ariaLabel || (character.name + ", " + character.title + ". " + character.rarityLabel + ".");
    var figure = drawCharacter(art);
    figure = insertCosmetics(figure, character.id, layers);
    var tag = opts.tag === "span" ? "span" : "div";
    var viewBox = opts.viewBox || "0 0 320 460";
    var dims = [["skin", skinTop, baseArt.skin, skinShade], ["main", mainLight, baseArt.pal.main, mainDark], ["hair", baseArt.hairLight || lighten(baseArt.hair, 18), baseArt.hair, darken(baseArt.hair, 16)]];
    var defs = '<defs>' + dims.map(function (entry) {
      var id = entry[0] === "skin" ? skinId : (entry[0] === "main" ? mainId : hairId);
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="' + entry[1] + '"/><stop offset="52%" stop-color="' + entry[2] + '"/><stop offset="100%" stop-color="' + entry[3] + '"/>' +
        '</linearGradient>';
    }).join("") +
      '<radialGradient id="' + glowId + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="' + rarity.color + '" stop-opacity=".32"/><stop offset="100%" stop-color="' + rarity.color + '" stop-opacity="0"/>' +
      '</radialGradient></defs>';
    var svg = '<svg class="q-ca" viewBox="' + viewBox + '" role="img" aria-label="' + aria.replace(/"/g, "&quot;") + '" preserveAspectRatio="xMidYMid meet">' +
      defs +
      '<ellipse cx="160" cy="220" rx="150" ry="200" fill="url(#' + glowId + ')" opacity=".6" data-part="rarity-glow"/>' +
      layerMarkup(layers, "effect") +
      figure +
      layerMarkup(layers, "frame") +
      '</svg>';
    return cacheSet(portraitCache, cacheKey, '<' + tag + ' class="' + classes.join(" ") + '" data-char="' + character.id + '" data-rarity="' + character.rarity + '" data-state="' + state + '">' + svg + '</' + tag + '>', portraitOrder, 180);
  }

  /* ------------------------------------------------------------------ */
  /* Vista previa neutra para el inventario                             */
  /* ------------------------------------------------------------------ */
  function mannequin(cosmeticId, options) {
    var opts = options || {};
    var cosmetic = Chars.cosmeticById(cosmeticId);
    var cacheKey = cosmeticId + "|" + (opts.full ? "full" : "crop");
    var cached = cacheGet(mannequinCache, cacheKey);
    if (cached) return cached;
    var layers = { effect: [], legs: [], torso: [], hair: [], head: [], accessory: [], amulet: [], frame: [] };
    if (cosmetic) {
      var layer = LAYER_OF[cosmetic.category] || "torso";
      layers[layer].push(cosmetic);
    }
    var skin = "#CBB9A7";
    var shade = "#A48C76";
    var pal = { main: "#5B6980", dark: "#3E495B", light: "#74859E", trim: "#9FB6CF", accent: "#B9CADF", pants: "#3C4859", boots: "#242C38", metal: "#B6C3D3" };
    var art = {
      skin: skin, shade: shade, hair: "#46536A", hairLight: "#5E6D86", pal: pal,
      build: { shoulder: 108, hip: 90, stance: 0, headRx: 39, headRy: 45 },
      outfit: "plain", hairStyle: "neutral", prop: "", headgear: "none", marks: [], id: "mannequin"
    };
    var body = '<ellipse cx="160" cy="432" rx="80" ry="10" fill="#000000" opacity=".3"/>' +
      '<g data-part="cos-legs">' + legBase(art) + '</g><g data-part="figure">' + torsoBase(art) +
      '<path d="M160 240 l6 6 l-6 6 l-6 -6 Z" fill="' + pal.trim + '" opacity=".7"/>' +
      limb("M112 224 q-12 34 -2 60", pal.dark, 22) + limb("M208 224 q12 34 2 60", pal.dark, 22) +
      '<g data-part="cos-torso"></g>' + headGroup(art) + '<g data-part="cos-front"></g></g>';
    body = insertCosmetics(body, "mannequin", layers);
    var crop = {
      cabeza: "78 48 164 182",
      peinado: "78 42 164 186",
      accesorios: "66 70 190 300",
      extras: "66 70 190 300",
      torso: "56 178 208 218",
      piernas: "68 278 184 176",
      amuletos: "104 196 112 128",
      efectos: "30 40 260 400",
      marcos: "0 0 320 460"
    };
    var specific = {
      "c-accesorios-gafas": "104 92 112 96",
      "c-accesorios-brujula": "70 244 124 124",
      "c-accesorios-bolso": "154 232 138 138",
      "c-accesorios-pluma": "150 188 116 116"
    };
    var box = opts.full ? "30 40 260 400" : (cosmetic ? (specific[cosmetic.id] || crop[cosmetic.category] || "30 40 260 400") : "30 40 260 400");
    var markup = '<svg class="q-ca q-ca--preview" viewBox="' + box + '" aria-hidden="true" preserveAspectRatio="xMidYMid meet">' +
      layerMarkup(layers, "effect") + body + layerMarkup(layers, "frame") + '</svg>';
    return cacheSet(mannequinCache, cacheKey, markup, mannequinOrder, 120);
  }

  function thumb(characterId, equipped, state) {
    return portraitWithCosmetics(characterId, equipped, { compact: true, thumb: true, state: state || "idle", ariaLabel: "Retrato de " + (Chars.byId(characterId) || { name: "personaje" }).name });
  }

  window.QuestCharacterArt = {
    portrait: portraitWithCosmetics,
    mannequin: mannequin,
    thumb: thumb,
    cosmeticLayer: cosmeticLayer,
    resolveLayers: resolveLayers,
    layerOf: function (category) { return LAYER_OF[category] || "torso"; },
    hasArt: function (cosmeticId) {
      var cosmetic = Chars.cosmeticById(cosmeticId);
      return !!(cosmetic && COSMETIC_ART[cosmetic.assetReferences.artKey]);
    },
    artSpec: function (characterId) { return ART[characterId] || null; },
    states: ["idle", "correct", "streak", "wrong", "defeat", "victory", "levelup", "unlock"]
  };
})();
