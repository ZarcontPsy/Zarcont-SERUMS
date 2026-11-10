# CONTRATOS · Fase 2 (Estudio activo) — Planificación

**Estado:** contrato de integración de la Fase 2  
**Fecha:** 2026-11-10  
**Base:** `CONTRATOS.md`, `PLAN-MODELO.md` §10–§13 y la entrega de Fase 1.

## 1. Objetivo y alcance

La Fase 2 convierte el modelo de planificación ya probado en cuatro vistas operativas:

| Ruta | Vista | Módulo | Archivo |
|---|---|---|---|
| `#/ruta` | Ruta de hoy completa + resumen semanal | `plan-ruta` | `js/plan/plan.ruta.js` |
| `#/plan` | Editor del plan por examen | `plan-editor` | `js/plan/plan.editor.js` |
| `#/dominio` | Mapa de dominio | `plan-mastery` | `js/plan/plan.mastery.js` |
| `#/repaso` | Repaso espaciado de fichas | `plan-review` | `js/plan/plan.review.js` |

Además:

- `js/plan/plan.runtime.js` es la única puerta al modelo. Carga `js/plan/plan-model.js` **solo** cuando una vista lo pide; nunca en el arranque ni en el Panel.
- `StudyStore.plan.save` conserva `areaPriority` (objeto `{areaId: número > 0}`), además de `examDate`, `minutesPerDay` y `daysPerWeek`.
- La Ruta de hoy del Panel enlaza a `#/ruta`; la ruta completa enlaza a las otras tres vistas.
- La navegación descubre las cuatro rutas desde **Más → Planificación** y desde la paleta; no se añaden iconos a la appbar.
- El resumen semanal se integra en `#/ruta` (bloque informativo) y se persiste con `StudyStore.weekly.save` sin duplicar la semana.
- El repaso de ficha no toca las cajas de Study Flashcards.

No se implementan `#/relampago`, `#/ultimo-dia`, `#/glosario`, `#/datos` ni `#/trampas`: son Fase 3.

## 2. Regla de carga del modelo

El HTML carga `plan.runtime.js` y las cuatro vistas como scripts clásicos al arrancar (son pequeños y no incluyen el modelo). **`plan-model.js` no se incluye en `index.html`**.

- `StudyPlanRuntime.ensureModel()` inyecta `js/plan/plan-model.js?v=2.3.0` una sola vez.
- Solo se llama desde el `mount` de una de las cuatro vistas, nunca desde `init` global ni desde `#/`/`#/biblioteca`/`#/ficha`.
- Si falla, la vista muestra un estado de error con reintento; el fallo no rompe el resto de la app.
- QA verifica con `performance.getEntriesByType("resource")` que no hay petición de `plan-model.js` antes de abrir una ruta.

## 3. Runtime compartido

`js/plan/plan.runtime.js` (propiedad del Coordinador; las vistas no lo editan) expone:

```js
window.StudyPlanRuntime = {
  version,
  ensureModel(): Promise<StudyPlanModel>,
  model(): StudyPlanModel | null,
  input(extra): Input,
  nowIso(): string,
  content(): STUDY_CONTENT,
  sheets(): Sheet[],
  sheetById(id): Sheet | null,
  categories(): Category[],
  plan(): Plan | null,
  areaPriority(): object,
  hasStore(): boolean,
  format: { date(dayKey), minutes(n), weekday(dayKey), days(n) },
  escape(value), icon(name, size), plural(n, one, many)
};
```

`input(extra)` devuelve, como mínimo:

```js
{
  now: "2026-11-10T...Z",
  examDate, minutesPerDay, daysPerWeek, areaPriority,
  sheets: [{ id, title, minutes, areaId, categoryId, priority, done }],
  reviews: [...], doubts: [...], cardsDue: 0,
  states: {
    sheets: state.sheets,
    confidence: { [sheetId]: "solid|partial|weak" },
    cards: state.cards,
    recall: [...]
  },
  cardSheet: { [cardId]: sheetId },
  categories: [{ id, title, areaId }],
  activity: state.activity || {}
}
```

- `extra` se fusiona al final; las vistas pueden añadir `weekStart`, `confidence`, `reviewCount`, etc.
- `sheets()` usa el contenido ya pasado por `StudyTaxonomy.apply` (con `primaryAreaId`/`categoryId`).
- Si una API del store falta, el runtime no inventa una señal: deja la colección ausente o vacía de forma explícita y las vistas muestran el estado de datos incompletos del modelo.
- `ensureModel()` es la única función asíncrona del runtime.
- El runtime no registra rutas ni escribe en el store.

## 4. Contrato de las vistas

Todas las páginas:

- Devuelven HTML desde `render(ctx)` y rellenan/actualizan en `mount(ctx)`; usan `ctx.root`.
- Tienen un `h1` único y `aria-labelledby`.
- Empiezan con una cabecera editorial: enlace «Panel» (`#/`), kicker «Planificación», título, subtítulo y enlaces a las otras vistas.
- Muestran `loading` mientras `ensureModel()` resuelve, `error` con reintento si falla y un estado vacío real si no hay datos.
- Escapan todo texto del usuario/temario.
- Se limpian en `unmount` (timers, listeners, tokens de render).
- Usan solo clases `.plan-*` en CSS; no selectores globales.
- En puntero grueso, cualquier control mide ≥44 px; foco visible; ambos temas.

### 4.1 `#/ruta`

- Módulo `plan-ruta`, `path:"ruta"`, `restoreScroll:true`.
- Cabecera + resumen del plan (fecha de examen, presupuesto, estado `ahead`/`onTrack`/`behind`, fecha estimada, minutos que no caben).
- Lista de ítems de `buildTodayRoute(input)` con tipo, título, minutos, motivo, acción (`#/repaso` para repasos, `#/ficha/:id` para fichas, `#/dudas` para dudas, Flashcards para tarjetas).
- Si no hay plan: se muestra igualmente la ruta de señales disponibles, declarando que no hay presupuesto; CTA a `#/plan`.
- Enlaces «Editar plan» (`#/plan`), «Mapa de dominio» (`#/dominio`) y «Repaso» (`#/repaso`).
- Al pie, resumen semanal (`buildWeeklySummary(input)`), con datos reales; guarda `StudyStore.weekly.save({weekStart, ...resumen})` sin crear duplicados.
- Selectores QA: `section[data-plan-view="ruta"]`, `#plan-ruta-title`, `[data-plan-loading]`, `[data-plan-error]`, `[data-plan-route-status]`, `.plan-route-item[data-type]`, `[data-plan-link="plan"]`, `[data-plan-weekly]`.

### 4.2 `#/plan`

- Módulo `plan-editor`, `path:"plan"`, `restoreScroll:true`.
- Formulario accesible con:
  - fecha de examen (`type="date"`, puede quedar vacía);
  - minutos por día (0–1440; 0 es un valor explícito);
  - días por semana (1–7);
  - prioridad por área oficial (1, 1,5 o 2; control por área).
- Vista previa con `buildPlan(input)`: estado, fecha estimada, si cabe, minutos por delante/detrás; sin prometer nada si no hay fecha.
- Guardar con `StudyStore.plan.save({examDate, minutesPerDay, daysPerWeek, areaPriority})`; no guardar si la validación falla; anuncio en vivo.
- Acción «Quitar plan» con confirmación clara; no borra el progreso.
- Tras guardar, refresca la previsualización y la ruta si está abierta.
- Selectores QA: `section[data-plan-view="plan"]`, `#plan-editor-title`, `form[data-plan-form]`, `[data-plan-field="examDate|minutesPerDay|daysPerWeek"]`, `[data-plan-area-priority]`, `[data-plan-action="save"]`, `[data-plan-action="remove"]`, `[data-plan-preview]`, `[data-plan-form-status]`.

### 4.3 `#/dominio`

- Módulo `plan-mastery`, `path:"dominio"`, `restoreScroll:true`.
- `build`/`masteryFor(input)` con áreas y categorías reales.
- Puntaje global, banda, cobertura de señales y cobertura de fichas; explicación breve de qué falta (confianza/tarjetas/errores).
- Áreas y categorías con barra/medidor, banda textual (no solo color) y `data-band`.
- Destaca el punto más flojo (`weakest`) solo si la cobertura lo permite; si no, lo dice.
- Estado vacío cuando no hay señales; nunca muestra 0 como si fuera una medición.
- Selectores QA: `section[data-plan-view="dominio"]`, `#plan-mastery-title`, `[data-plan-loading]`, `[data-plan-error]`, `[data-mastery-global]`, `[data-mastery-area]`, `[data-mastery-category]`, `[data-mastery-band]`.

### 4.4 `#/repaso`

- Módulo `plan-review`, `path:"repaso"`, `restoreScroll:true`.
- Lista de repasos de ficha (`StudyStore.sheetReview.list()`), ordenados por vencimiento; muestra ficha, área y días de atraso.
- Si hay fichas completadas con confianza declarada y sin `sheetReview`, ofrece una sección acotada para **programar la primera revisión** con `nextSheetReview` y `sheetReview.save`; sin confianza, enlaza a la ficha para declararla, sin inventar una escala.
- Cada fila permite abrir la ficha (`#/ficha/:id`) y autoevaluar el repaso con tres botones: «No lo sabía» (`weak`), «Más o menos» (`partial`), «Lo sabía» (`solid`).
- Al autoevaluar, usa `StudyPlanModel.nextSheetReview(input)` para calcular el próximo vencimiento y guarda `StudyStore.sheetReview.save({sheetId, dueAt, intervalDays, lastReviewedAt, source:"confidence"})`.
- No cambia `cards`, `flashSession` ni las cajas de Study Flashcards.
- Muestra próximos repasos y estado vacío real; anuncia el nuevo vencimiento.
- Selectores QA: `section[data-plan-view="repaso"]`, `#plan-review-title`, `[data-plan-loading]`, `[data-plan-error]`, `.plan-review-item[data-sheet-id]`, `[data-plan-action="review"][data-value="weak|partial|solid"]`, `[data-plan-action="open"]`, `[data-plan-review-status]`.

## 5. Store

`StudyStore.plan.save({examDate, minutesPerDay, daysPerWeek, areaPriority})` debe:

- conservar `areaPriority` como objeto plano de números positivos, ignorando claves no válidas;
- seguir validando `examDate` (`YYYY-MM-DD`), `minutesPerDay` (0–1440) y `daysPerWeek` (1–7);
- mantener la compatibilidad con estados v1/v2 sin `areaPriority` (valor por defecto `{}`);
- exportar/importar el campo sin romper la importación de estados anteriores;
- seguir emitiendo `plan:changed`.

No se modifican `cards`, `flashSession` ni las claves del store existentes.

## 6. Navegación

- **Más → Planificación**: cuatro enlaces con iconos existentes:
  - `#/ruta` · Ruta de hoy · `compass`
  - `#/plan` · Plan de estudio · `calendar`
  - `#/dominio` · Mapa de dominio · `target`
  - `#/repaso` · Repaso de fichas · `rotate`
- La paleta Ctrl+K incluye las cuatro vistas con motivos y palabras clave.
- El bloque «Ruta de hoy» del Panel incluye «Ver ruta completa» → `#/ruta`; los repasos enlazan a `#/repaso` cuando la ruta exista.
- No se añaden controles a la appbar; en móvil sigue con cinco controles visibles.
- Los enlaces internos usan `data-nav`; no deben recargar el documento.

## 7. Pruebas y aceptación

- Node: `node --test "study-dashboard/tests/unit/plan/**/*.test.mjs"` (modelo + integración).
- E2E: `DASH-01…30` y `FLASH-01…09` siguen verdes; se añaden DASH-31… al menos:
  - carga perezosa real de `plan-model.js`;
  - `#/ruta` con/sin plan y enlace de repasos;
  - guardar/borrar plan, prioridad de área y persistencia;
  - `#/dominio` con señales reales y estado vacío;
  - `#/repaso` que guarda un nuevo vencimiento y no toca Flashcards;
  - resumen semanal guardado y descubrible;
  - Más/paleta y layout móvil.
- axe 0 violaciones en las cuatro rutas, ambos temas, 390/1440; capturas y contraste.
- Sin overflow horizontal a 360/390/768/1024/1440/844×390; 44 px en puntero grueso.
- La carga inicial no incluye `plan-model.js`; se mide el aumento de código/CSS y se informa.
- No se inicia la Fase 3.

## 8. Propiedad de archivos

| Archivo | Propietario |
|---|---|
| `js/plan/plan.runtime.js` | Coordinador |
| `js/plan/plan.ruta.js`, `css/plan-ruta.css` | Agente 4 |
| `js/plan/plan.editor.js`, `css/plan-editor.css` | Agente 7 |
| `js/plan/plan.mastery.js`, `css/plan-mastery.css`, `js/plan/plan.review.js`, `css/plan-review.css` | Agente 8 |
| `study-shared/store.js`, tests de datos | Agente 2 |
| `js/nav/nav.integration.js`, `js/nav/palette.js`, `css/nav.css` | Agente 5 |
| `tests/e2e/*`, `tools/qa/*` | Agente 6 |
| `index.html`, `app.js`, `docs/`, `CHANGELOG.md`, `AUTORIA.md`, `INTEGRITY.sha256` | Coordinador |

---

© 2026 ZARCONT — Documento interno del proyecto.
