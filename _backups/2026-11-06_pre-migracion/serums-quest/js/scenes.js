/* SERUMS QUEST - escenarios ambientales originales
   © 2026 ZARCONT. Escenas SVG por área de afinidad, con capas de profundidad,
   iluminación y partículas. Sin recursos externos ni imágenes de terceros. */
(function () {
  "use strict";

  var C = window.QUEST_CONFIG;
  var seq = 0;

  function uid(prefix) {
    seq += 1;
    return "scene-" + prefix + "-" + seq;
  }

  function windows(x, y, cols, rows, w, h, gapX, gapY, color, opacity) {
    var out = "";
    for (var r = 0; r < rows; r += 1) {
      for (var c = 0; c < cols; c += 1) {
        out += '<rect x="' + (x + c * (w + gapX)) + '" y="' + (y + r * (h + gapY)) + '" width="' + w + '" height="' + h + '" rx="1.5" fill="' + color + '" opacity="' + opacity + '"/>';
      }
    }
    return out;
  }

  function stars(count, seed) {
    var out = "";
    var s = seed || 7;
    for (var i = 0; i < count; i += 1) {
      s = (s * 9301 + 49297) % 233280;
      var x = 40 + (s / 233280) * 1120;
      s = (s * 9301 + 49297) % 233280;
      var y = 30 + (s / 233280) * 300;
      s = (s * 9301 + 49297) % 233280;
      var r = 1 + (s / 233280) * 2.2;
      out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#DCE6FF" opacity="' + (0.25 + r * 0.12).toFixed(2) + '"/>';
    }
    return out;
  }

  function particles(count, color, seed) {
    var out = "";
    var s = seed || 11;
    for (var i = 0; i < count; i += 1) {
      s = (s * 9301 + 49297) % 233280;
      var x = 60 + (s / 233280) * 1080;
      s = (s * 9301 + 49297) % 233280;
      var y = 80 + (s / 233280) * 500;
      s = (s * 9301 + 49297) % 233280;
      var r = 1.2 + (s / 233280) * 2.8;
      s = (s * 9301 + 49297) % 233280;
      var delay = (s / 233280) * 6;
      out += '<circle class="q-scene-mote" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + color + '" opacity=".55" style="animation-delay:-' + delay.toFixed(2) + 's"/>';
    }
    return out;
  }

  function saludBase(id, accent) {
    return '<defs>' +
      '<linearGradient id="' + id + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#071020"/><stop offset="52%" stop-color="#0D2038"/><stop offset="100%" stop-color="#173A4A"/></linearGradient>' +
      '<linearGradient id="' + id + '-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#69D3C1" stop-opacity=".24"/><stop offset="100%" stop-color="#69D3C1" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + id + '-sun" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#F5B85C" stop-opacity=".85"/><stop offset="100%" stop-color="#F5B85C" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + '-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0A1826"/><stop offset="100%" stop-color="#050B14"/></linearGradient>' +
      '</defs>' +
      '<rect width="1200" height="700" fill="url(#' + id + '-sky)"/>' +
      stars(38, 13) +
      '<circle cx="930" cy="196" r="168" fill="url(#' + id + '-sun)"/>' +
      '<circle cx="930" cy="196" r="54" fill="#F8D9A0" opacity=".9"/>' +
      '<circle cx="930" cy="196" r="74" fill="none" stroke="#F5B85C" stroke-width="1.2" opacity=".5"/>' +
      '<path d="M0 330 Q220 290 430 318 T900 306 T1200 322 V700 H0 Z" fill="#0B1B2C"/>' +
      '<path d="M0 364 Q260 330 520 352 T1200 344 V700 H0 Z" fill="url(#' + id + '-haze)"/>' +
      '<g fill="#0A1725">' +
      '<path d="M60 356 h120 v-58 h40 v58 h70 v-96 h64 v96 h74 v-44 h106 v44 h90 v-70 h84 v70 h120 v-50 h96 v50 h90 v70 H60 Z"/>' +
      '<path d="M150 266 l24 -42 l22 42 Z"/><path d="M382 250 l30 -52 l30 52 Z"/><path d="M824 286 l24 -38 l24 38 Z"/>' +
      '</g>' +
      windows(78, 328, 5, 2, 9, 14, 12, 8, "#F5B85C", ".34") +
      windows(566, 300, 4, 3, 8, 12, 12, 8, "#69D3C1", ".28") +
      windows(884, 330, 5, 2, 8, 11, 10, 8, "#C49BFF", ".22") +
      '<g stroke="#A9C3D6" stroke-width="1.2" opacity=".35"><path d="M120 356 v-118 M178 356 v-92"/><path d="M930 188 q32 -20 64 0"/></g>' +
      '<path d="M0 500 Q260 468 520 492 T1200 480 V700 H0 Z" fill="' + accent + '" opacity=".08"/>' +
      '<path d="M0 540 Q300 512 620 536 T1200 524 V700 H0 Z" fill="url(#' + id + '-floor)"/>' +
      '<g fill="#050B13">' +
      '<path d="M92 560 q-12 -86 20 -132 q6 44 30 52 q-18 -54 8 -90 q14 54 44 66 q-22 42 6 104 Z"/>' +
      '<path d="M1088 560 q-14 -70 14 -112 q2 38 24 46 q-14 -44 8 -74 q12 44 34 54 q-18 34 2 86 Z"/>' +
      '</g>' +
      '<g stroke="#050B13" stroke-width="8" stroke-linecap="round"><path d="M1040 560 v-102"/><path d="M114 560 v-86"/></g>' +
      '<g fill="#F5B85C"><circle cx="1040" cy="452" r="7" opacity=".9"/><circle cx="114" cy="468" r="6" opacity=".7"/></g>' +
      '<g stroke="#69D3C1" stroke-width="1" opacity=".22"><path d="M0 590 H1200 M0 636 H1200 M0 682 H1200"/></g>' +
      '<path d="M0 618 Q360 586 680 610 T1200 604 V700 H0 Z" fill="#02060C" opacity=".8"/>' +
      '<ellipse cx="620" cy="628" rx="430" ry="52" fill="' + accent + '" opacity=".12"/>' +
      particles(16, "#F5E3B4", 23);
  }

  function cuidadoBase(id, accent) {
    return '<defs>' +
      '<linearGradient id="' + id + '-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#171324"/><stop offset="55%" stop-color="#2A2030"/><stop offset="100%" stop-color="#0E1620"/></linearGradient>' +
      '<linearGradient id="' + id + '-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFD9A0" stop-opacity=".5"/><stop offset="100%" stop-color="#FFD9A0" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + id + '-lamp" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#F5B85C" stop-opacity=".85"/><stop offset="100%" stop-color="#F5B85C" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + '-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1B1720"/><stop offset="100%" stop-color="#090B10"/></linearGradient>' +
      '</defs>' +
      '<rect width="1200" height="700" fill="url(#' + id + '-wall)"/>' +
      '<path d="M0 0 H1200 V470 Q900 430 600 458 T0 440 Z" fill="#231A2A" opacity=".9"/>' +
      '<g opacity=".9"><path d="M120 90 q40 -38 80 0 v300 q-40 26 -80 0 Z" fill="#0A1220"/><path d="M1000 110 q40 -34 80 0 v286 q-40 24 -80 0 Z" fill="#0A1220"/></g>' +
      '<path d="M150 100 q18 -24 34 0 v284 q-16 18 -34 0 Z" fill="url(#' + id + '-light)" opacity=".55"/>' +
      '<path d="M1030 120 q18 -22 34 0 v270 q-16 16 -34 0 Z" fill="url(#' + id + '-light)" opacity=".35"/>' +
      '<g stroke="#0A0D14" stroke-width="3"><path d="M120 92 q40 -38 80 0 M1000 112 q40 -34 80 0"/></g>' +
      '<path d="M0 470 Q300 446 600 464 T1200 452 V700 H0 Z" fill="url(#' + id + '-floor)"/>' +
      '<ellipse cx="600" cy="250" rx="300" ry="260" fill="' + accent + '" opacity=".055"/>' +
      '<g fill="#141B20">' +
      '<path d="M92 640 q-10 -120 20 -178 q4 56 34 64 q-16 -60 8 -92 q16 58 48 72 q-26 48 -4 134 Z"/>' +
      '<path d="M1100 646 q-8 -100 18 -150 q4 44 28 52 q-14 -48 8 -76 q12 46 38 58 q-20 38 0 116 Z"/>' +
      '</g>' +
      '<g stroke="#141B20" stroke-width="6"><path d="M78 640 h50 M1086 646 h46"/></g>' +
      '<g><rect x="330" y="402" width="230" height="18" rx="9" fill="#2B2130"/><rect x="356" y="420" width="10" height="96" fill="#1A1620"/><rect x="524" y="420" width="10" height="96" fill="#1A1620"/><path d="M330 402 q80 -44 230 0" fill="#3A2A38" opacity=".7"/></g>' +
      '<g><rect x="820" y="330" width="240" height="12" rx="6" fill="#2B2130"/><rect x="842" y="342" width="8" height="94" fill="#1A1620"/><rect x="1030" y="342" width="8" height="94" fill="#1A1620"/><rect x="852" y="300" width="22" height="30" rx="4" fill="#69D3C1" opacity=".5"/><rect x="884" y="292" width="18" height="38" rx="4" fill="#B79BFF" opacity=".5"/><rect x="914" y="306" width="26" height="24" rx="4" fill="#F5B85C" opacity=".5"/></g>' +
      '<path d="M600 0 v112" stroke="#0A0D14" stroke-width="3"/><circle cx="600" cy="126" r="68" fill="url(#' + id + '-lamp)"/><path d="M570 112 h60 l-12 26 h-36 Z" fill="#F5B85C"/><circle cx="600" cy="126" r="46" fill="#F5B85C" opacity=".2"/>' +
      '<g stroke="#F5B85C" stroke-width="1" opacity=".18"><path d="M600 126 L180 700 M600 126 L420 700 M600 126 L780 700 M600 126 L1020 700"/></g>' +
      '<path d="M0 620 Q340 592 660 614 T1200 606 V700 H0 Z" fill="#07090E" opacity=".8"/>' +
      '<ellipse cx="600" cy="628" rx="400" ry="48" fill="' + accent + '" opacity=".14"/>' +
      particles(20, "#F5E3B4", 31);
  }

  function eticaBase(id, accent) {
    return '<defs>' +
      '<linearGradient id="' + id + '-hall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#100C1E"/><stop offset="58%" stop-color="#231A38"/><stop offset="100%" stop-color="#0B0912"/></linearGradient>' +
      '<linearGradient id="' + id + '-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D8C6FF" stop-opacity=".42"/><stop offset="100%" stop-color="#D8C6FF" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id + '-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A1427"/><stop offset="100%" stop-color="#07060C"/></linearGradient>' +
      '</defs>' +
      '<rect width="1200" height="700" fill="url(#' + id + '-hall)"/>' +
      '<g fill="#080611" opacity=".85">' +
      '<path d="M0 0 H1200 V120 H0 Z"/><path d="M90 120 h70 v380 h-70 Z"/><path d="M300 120 h56 v380 h-56 Z"/><path d="M560 120 h80 v380 h-80 Z"/><path d="M844 120 h56 v380 h-56 Z"/><path d="M1040 120 h70 v380 h-70 Z"/>' +
      '</g>' +
      '<g fill="none" stroke="#B79BFF" stroke-width="1.4" opacity=".35">' +
      '<path d="M160 120 q120 -70 240 0 v380 M470 120 q130 -82 260 0 v380 M790 120 q140 -74 280 0 v380"/>' +
      '</g>' +
      '<g fill="url(#' + id + '-ray)" opacity=".8"><path d="M430 0 h110 l-90 620 H300 Z"/><path d="M760 0 h90 l-40 620 H640 Z"/></g>' +
      '<g fill="#2A1D46" opacity=".8"><path d="M520 120 h160 v40 H520 Z"/><path d="M540 160 h120 l12 130 H528 Z"/><path d="M558 290 l-8 26 h104 l-8 -26 Z"/></g>' +
      '<g fill="' + accent + '" opacity=".8"><circle cx="600" cy="210" r="16"/><path d="M600 226 v54 M576 250 h48"/></g>' +
      '<g fill="#0A0812"><path d="M180 500 h150 v-70 h140 v70 h410 v-70 h140 v70 h0 v200 H180 Z"/></g>' +
      '<path d="M0 500 Q300 470 600 494 T1200 482 V700 H0 Z" fill="url(#' + id + '-floor)"/>' +
      '<g stroke="#B79BFF" stroke-width="1" opacity=".25"><path d="M0 540 H1200 M0 586 H1200 M0 632 H1200 M0 678 H1200"/><path d="M260 500 L180 700 M600 494 L600 700 M940 502 L1040 700"/></g>' +
      '<ellipse cx="600" cy="600" rx="380" ry="46" fill="' + accent + '" opacity=".13"/>' +
      '<g fill="#DCE6FF" opacity=".7"><circle cx="510" cy="110" r="2"/><circle cx="690" cy="90" r="1.6"/><circle cx="600" cy="68" r="2.4"/></g>' +
      particles(18, "#E8DEFF", 41);
  }

  function investigacionBase(id, accent) {
    return '<defs>' +
      '<linearGradient id="' + id + '-lab" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#061018"/><stop offset="56%" stop-color="#0B2030"/><stop offset="100%" stop-color="#051018"/></linearGradient>' +
      '<linearGradient id="' + id + '-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#69D3C1" stop-opacity=".45"/><stop offset="100%" stop-color="#69D3C1" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id + '-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0B1A22"/><stop offset="100%" stop-color="#040A0F"/></linearGradient>' +
      '</defs>' +
      '<rect width="1200" height="700" fill="url(#' + id + '-lab)"/>' +
      '<g fill="#06121A">' +
      '<path d="M0 90 h420 v390 H0 Z"/><path d="M780 70 h420 v410 H780 Z"/>' +
      '</g>' +
      '<g stroke="#1C3A46" stroke-width="2">' +
      '<path d="M40 150 h340 M40 210 h340 M40 270 h340 M40 330 h340 M40 390 h340"/>' +
      '<path d="M820 130 h340 M820 190 h340 M820 250 h340 M820 310 h340 M820 370 h340 M820 430 h300"/>' +
      '</g>' +
      '<g fill="#69D3C1" opacity=".35">' +
      '<rect x="58" y="120" width="12" height="24" rx="3"/><rect x="78" y="116" width="10" height="28" rx="3"/><rect x="96" y="124" width="14" height="20" rx="3"/><rect x="850" y="104" width="12" height="20" rx="3"/><rect x="872" y="98" width="10" height="26" rx="3"/><rect x="894" y="108" width="14" height="16" rx="3"/>' +
      '</g>' +
      '<g fill="#B79BFF" opacity=".3"><rect x="130" y="242" width="10" height="24" rx="3"/><rect x="150" y="236" width="14" height="30" rx="3"/><rect x="930" y="226" width="12" height="24" rx="3"/><rect x="952" y="220" width="10" height="30" rx="3"/></g>' +
      '<g stroke="#69D3C1" stroke-width="1.2" opacity=".55"><path d="M480 150 L540 110 L586 146 L648 90 L700 132"/></g>' +
      '<g fill="#DCE6FF"><circle cx="480" cy="150" r="3"/><circle cx="540" cy="110" r="4"/><circle cx="586" cy="146" r="2.6"/><circle cx="648" cy="90" r="4"/><circle cx="700" cy="132" r="3"/></g>' +
      '<g><rect x="300" y="430" width="600" height="20" rx="10" fill="#122A36"/><rect x="330" y="450" width="12" height="120" fill="#0A1922"/><rect x="858" y="450" width="12" height="120" fill="#0A1922"/><path d="M320 430 q280 -40 560 0" fill="#173E4C" opacity=".6"/></g>' +
      '<g><rect x="430" y="392" width="40" height="38" rx="5" fill="#69D3C1" opacity=".35"/><rect x="490" y="382" width="26" height="48" rx="5" fill="#B79BFF" opacity=".35"/><path d="M548 430 v-70 h18 v70 Z" fill="#69D3C1" opacity=".4"/><circle cx="700" cy="410" r="18" fill="#69D3C1" opacity=".25"/><circle cx="700" cy="410" r="8" fill="#DCE6FF" opacity=".6"/></g>' +
      '<path d="M0 500 Q320 472 640 494 T1200 484 V700 H0 Z" fill="url(#' + id + '-floor)"/>' +
      '<g stroke="#69D3C1" stroke-width="1" opacity=".16"><path d="M0 548 H1200 M0 596 H1200 M0 644 H1200 M0 692 H1200"/></g>' +
      '<ellipse cx="600" cy="610" rx="380" ry="46" fill="' + accent + '" opacity=".12"/>' +
      particles(16, "#9FF0E2", 53);
  }

  function gestionBase(id, accent) {
    return '<defs>' +
      '<linearGradient id="' + id + '-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#070B18"/><stop offset="55%" stop-color="#111A30"/><stop offset="100%" stop-color="#060912"/></linearGradient>' +
      '<linearGradient id="' + id + '-map" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7AA2FF" stop-opacity=".5"/><stop offset="100%" stop-color="#B79BFF" stop-opacity=".2"/></linearGradient>' +
      '<linearGradient id="' + id + '-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0D1422"/><stop offset="100%" stop-color="#04070E"/></linearGradient>' +
      '</defs>' +
      '<rect width="1200" height="700" fill="url(#' + id + '-room)"/>' +
      '<g fill="#0A1322"><path d="M0 80 h250 v420 H0 Z"/><path d="M950 60 h250 v440 H950 Z"/></g>' +
      '<g stroke="#243556" stroke-width="2"><path d="M0 140 h250 M0 200 h250 M0 260 h250 M0 320 h250 M0 380 h250 M0 440 h250"/><path d="M950 120 h250 M950 180 h250 M950 240 h250 M950 300 h250 M950 360 h250 M950 420 h250"/></g>' +
      '<g fill="#7AA2FF" opacity=".35"><rect x="34" y="112" width="46" height="22" rx="3"/><rect x="92" y="112" width="46" height="22" rx="3"/><rect x="34" y="172" width="46" height="22" rx="3"/><rect x="1000" y="150" width="60" height="24" rx="3"/><rect x="1072" y="150" width="60" height="24" rx="3"/><rect x="1030" y="246" width="90" height="20" rx="3"/></g>' +
      '<g fill="#F5B85C" opacity=".3"><rect x="34" y="352" width="80" height="14" rx="4"/><rect x="1010" y="330" width="96" height="14" rx="4"/></g>' +
      '<ellipse cx="600" cy="430" rx="340" ry="90" fill="url(#' + id + '-map)" opacity=".55"/>' +
      '<g stroke="#E8EDF5" stroke-width="1" opacity=".3"><path d="M320 430 h560 M600 350 v180 M420 390 l360 100 M780 390 l-360 100"/></g>' +
      '<g fill="#DCE6FF"><circle cx="330" cy="428" r="3"/><circle cx="470" cy="404" r="2"/><circle cx="600" cy="384" r="4"/><circle cx="738" cy="412" r="2.4"/><circle cx="858" cy="434" r="3"/></g>' +
      '<g><rect x="330" y="400" width="540" height="14" rx="7" fill="#162B4A"/><rect x="360" y="414" width="12" height="70" fill="#0B1628"/><rect x="826" y="414" width="12" height="70" fill="#0B1628"/></g>' +
      '<g fill="#0A1120"><path d="M80 560 h120 v-90 h70 v90 h740 v-72 h80 v72 h90 v140 H80 Z"/></g>' +
      '<path d="M0 500 Q300 470 600 494 T1200 482 V700 H0 Z" fill="url(#' + id + '-floor)"/>' +
      '<g stroke="#7AA2FF" stroke-width="1" opacity=".15"><path d="M0 542 H1200 M0 588 H1200 M0 634 H1200 M0 680 H1200"/><path d="M200 500 L120 700 M900 500 L1010 700"/></g>' +
      '<ellipse cx="600" cy="612" rx="400" ry="48" fill="' + accent + '" opacity=".12"/>' +
      particles(16, "#BFD4FF", 61);
  }

  var BUILD = {
    "area-psi-salud-publica": saludBase,
    "area-psi-cuidado-integral": cuidadoBase,
    "area-psi-etica": eticaBase,
    "area-psi-investigacion": investigacionBase,
    "area-psi-gestion": gestionBase
  };

  function scene(areaId, options) {
    var C2 = window.QUEST_CONFIG;
    var opts = options || {};
    var area = BUILD[areaId] ? areaId : "area-psi-salud-publica";
    var meta = C2.areaMeta[area];
    var id = uid(area.split("-").pop());
    var accent = meta ? meta.accent : "#7AA2FF";
    var build = BUILD[area] || saludBase;
    var classes = ["q-scene", "q-scene--" + (meta ? meta.short.toLowerCase().replace(/[^a-z]+/g, "-") : "quest")];
    if (opts.variant) classes.push("q-scene--" + opts.variant);
    return '<div class="' + classes.join(" ") + '" data-scene="' + area + '" aria-hidden="true" style="--scene-accent:' + accent + ';--scene-accent-2:' + (opts.accent2 || "#B79BFF") + '">' +
      '<svg class="q-scene-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" focusable="false">' + build(id, accent) + '</svg>' +
      '<span class="q-scene-grade"></span>' +
      '<span class="q-scene-fog q-scene-fog--a"></span>' +
      '<span class="q-scene-fog q-scene-fog--b"></span>' +
      '<span class="q-scene-vignette"></span>' +
      '</div>';
  }

  function forCharacter(character, options) {
    if (!character) return scene("area-psi-salud-publica", options);
    return scene(character.areaAffinity, Object.assign({ accent2: character.rarityMeta ? character.rarityMeta.color : "#B79BFF" }, options || {}));
  }

  window.QuestScenes = {
    scene: scene,
    forCharacter: forCharacter,
    areas: Object.keys(BUILD)
  };
})();
