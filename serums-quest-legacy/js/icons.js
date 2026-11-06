/* SERUMS QUEST - iconos de línea */
(function () {
  "use strict";

  var P = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
    rotate: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1 8 4.5-2.5L16.5 22l-1-8"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2v-4h1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4h-.2a1.7 1.7 0 0 0-1.6 1Z"/>',
    spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="M19 16v5M16.5 18.5h5"/>',
    flag: '<path d="M5 22V4M5 4h11l-1.5 4L16 12H5"/>',
    shield: '<path d="M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    flame: '<path d="M12 22c4.4 0 7-2.8 7-6.5 0-3.1-1.8-5.3-4.4-7.3.2 2-1.1 3.3-2.4 3.8.2-4.6-2.6-7-5.2-8.5.2 4.4-2 6.9-2 10.5C5 19.2 7.6 22 12 22Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    loop: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h5a4 4 0 0 0 4-4V9M6 17V9a4 4 0 0 1 4-4h6"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.7 2.7L16.5 9"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    brain: '<path d="M9.5 4a3 3 0 0 0-5.4 1.8A3 3 0 0 0 3 11a3 3 0 0 0 1.8 5.4A3 3 0 0 0 9.5 20a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 9.5 4Z"/><path d="M14.5 4a3 3 0 0 1 5.4 1.8A3 3 0 0 1 21 11a3 3 0 0 1-1.8 5.4A3 3 0 0 1 14.5 20 2.5 2.5 0 0 1 12 17.5v-11A2.5 2.5 0 0 1 14.5 4Z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14"/><path d="m5 7-3 6h6L5 7ZM19 7l-3 6h6l-3-6Z"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.8-2.5L14 9V3"/><path d="M7 15h10"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M20 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    download: '<path d="M12 3v12M6 11l6 6 6-6"/><path d="M4 21h16"/>',
    upload: '<path d="M12 21V9M6 13l6-6 6 6"/><path d="M4 3h16"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    cards: '<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/><path d="M7 12h6M7 16h4"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    star: '<path d="m12 2 3.1 6.3L22 9.3l-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z"/>',
    crown: '<path d="m3 7 4 4 5-7 5 7 4-4-2 13H5L3 7Z"/><path d="M5 20h14"/>',
    swords: '<path d="m14.5 3.5 6 6-9 9-3-3 9-9Z"/><path d="m3.5 14.5 6 6 3-3-6-6-3 3Z"/><path d="m5 19 3-3M16 19l3-3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"/><path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.1M6.1 6.1A17.6 17.6 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4-.9"/>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.9.7-1.5 1.2-1.5 2.5M12 17h.01"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><circle cx="17.5" cy="9.5" r="2.6"/><path d="M15.6 14.4a5 5 0 0 1 5.6 3.6"/>',
    bag: '<path d="M5 8h14l-1.2 12.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/>',
    volumeOff: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8V22M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2 12h2.2M19.8 12H22M4.4 19.6 6 18M18 6l1.6-1.6"/>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    wand: '<path d="m4 20 9-9"/><path d="m14 4 1.2 2.8L18 8l-2.8 1.2L14 12l-1.2-2.8L10 8l2.8-1.2L14 4Z"/><path d="M18 14v4M16 16h4"/>'
  };

  function svg(name, size, cls) {
    var inner = P[name] || P.circle;
    var s = size || 20;
    var c = cls ? ' class="' + cls + '"' : "";
    return '<svg' + c + ' width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + "</svg>";
  }

  window.QuestIcons = { svg: svg, paths: P };
})();
