/* Study Dashboard — Lectura activa · iconos de la biblioteca
   © 2026 ZARCONT
   Los iconos que ya existen en study-shared/icons.js se reutilizan desde ahí;
   aquí solo viven los trazos nuevos. Mismo lenguaje: 24×24, trazo 1.7, sin relleno. */
(function (global) {
  "use strict";

  var A = global.StudyActive = global.StudyActive || {};

  var P = {
    highlighter: '<path d="M14 4.5 19.5 10 12 17.5H7.5v-4.5L14 4.5Z"/><path d="M4 20h16"/><path d="m12 6.5 5.5 5.5"/>',
    note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/>',
    eyeOff: '<path d="m3 3 18 18"/><path d="M6.7 6.8C4.2 8.4 2.5 12 2.5 12s3.5 7 9.5 7c1.7 0 3.2-.5 4.5-1.2"/><path d="M10.6 5.2A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17.3 17.3 0 0 1-2.3 3.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    skip: '<path d="M5 4v16l10-8L5 4Z"/><path d="M19 5v14"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-1"/>',
    circleHalf: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" opacity=".45"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9.5 14h5"/>',
    cornerDown: '<path d="M7 4v9a3 3 0 0 0 3 3h8"/><path d="m15 13 3 3-3 3"/>',
    lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v2"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    arrowDownRight: '<path d="M7 7l10 10"/><path d="M17 8v9H8"/>',
    linkOff: '<path d="M4 4l16 16"/><path d="M10.5 13.5A4 4 0 0 0 16 14l1.5-1.5a4.5 4.5 0 0 0-1.6-7.3"/><path d="M13.5 10.5A4 4 0 0 0 8 10l-1.5 1.5a4.5 4.5 0 0 0 1.6 7.3"/>'
  };

  function svg(name, size, cls) {
    var shared = global.StudyIcons;
    if (shared && typeof shared.svg === "function" && shared.paths && shared.paths[name]) {
      return shared.svg(name, size, cls);
    }
    var inner = P[name] || P.highlighter;
    var s = Number(size) || 20;
    var c = cls ? ' class="' + cls + '"' : "";
    return '<svg' + c + ' width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + inner + "</svg>";
  }

  A.icon = svg;
  A.icons = { svg: svg, paths: P };
})(window);
