# Fixture de estado v1 — procedencia

`v1-state.json` es un estado **real** del esquema 1, reconstruido a partir de la
evidencia persistida de la auditoría del 2026-10-25, no inventado:

- `AUDIT/evidencias/agent2-dash-antes.json` → paso «7 claves y snapshot»:
  - entrada real de `sheets["sheet-aps-02"]` (views 4, viewedAt, lastOpenedAt,
    completedAt null, favorite false, scroll 0, readSeconds 0, topicId);
  - `last.dashboard` y snapshot con `viewedSheets: 1`, `goal: 2`, `contentVersion 2.5.0`.
- `AUDIT/evidencias/agent2-flash-antes.json` → paso «10 estado persistido»:
  - `flashSession` completo (`session-1792965965453`, queue de 3 tarjetas,
    una respuesta «again» de `card-aps-01-1`);
  - `last.flashcards`;
  - `cards: 1` y snapshot con `reviewedCards: 1`, `todayReviews: 1`.
- La entrada `cards["card-aps-01-1"]` es la que produce `applyReview()` del store
  v1 al calificar «again»: box 0, dueAt +10 min, reviews 1, wrong 1, lapses 1.
- `activity` usa los únicos contadores que la evidencia confirma: 1 vista de
  ficha, 1 repaso, 1 fallo. No se añadieron fichas, tarjetas ni sesiones que la
  auditoría no hubiera registrado; `sessions` queda en `[]` y `history` en `[]`
  porque el volcado de auditoría no los incluía.

No contiene datos clínicos inventados: las fichas y tarjetas referidas existen
en `study-data/temario.js` y el progreso es el que quedó registrado en AUDIT.

© 2026 ZARCONT — Material interno de pruebas.
