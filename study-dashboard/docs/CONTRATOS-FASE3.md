# CONTRATOS · Fase 3 (Estudio activo) — Última hora

**Estado:** contrato de integración de la Fase 3  
**Fecha:** 2026-11-10  
**Base:** `CONTRATOS.md` §4, `NAV-CONTRATO.md` §6, `INFORME-FASE0-DATOS.md` §5.4 y la entrega de Fase 2.

## 1. Objetivo y alcance

La Fase 3 añade las cinco herramientas de consulta y repaso final que faltan:

| Ruta | Vista | Módulo | Archivo |
|---|---|---|---|
| `#/relampago` | Repaso relámpago | `plan-relampago` | `js/plan/plan.relampago.js` |
| `#/ultimo-dia` | Hoja de último día | `plan-lastday` | `js/plan/plan.lastday.js` |
| `#/glosario` | Glosario global | `glossary` | `js/nav/glossary.integration.js` |
| `#/datos` | Datos para memorizar | `facts` | `js/nav/facts.integration.js` |
| `#/trampas` | Trampas frecuentes | `traps` | `js/nav/traps.integration.js` |

No se implementa ninguna ruta posterior. No se modifican las cajas de Study Flashcards.

## 2. Datos y carga

- Los derivados `glossary.json` (57), `facts.json` (261) y `warnings.json` (451) se cargan **solo** al abrir la ruta que los necesita. Al arrancar no se pide ninguno.
- `StudyReference` (`js/nav/reference.js`) es el puente compartido: carga perezosa, anotación de área/categoría/ficha, búsqueda sin acentos, filtros, `knownSet`/`setKnown` y escape.
- `StudyDerived` ya está cargado en `index.html`; no se añaden dependencias ni se duplica el cargador.
- `factsKnown` es la única escritura de estado de estas vistas: `StudyStore.factsKnown.set(factId, known)` y `listKnown()`.
- Si un derivado falla, la vista muestra error con reintento; no hay datos falsos ni listas inventadas.

## 3. `StudyReference` (compartido, Coordinador)

Expone:

```js
StudyReference.load(kind)        // "glossary" | "facts" | "warnings" -> Promise<entries>
StudyReference.entries(kind)
StudyReference.state(kind)       // idle | loading | ready | error
StudyReference.filter(entries, {query, areaId, source, knownOnly, pendingOnly})
StudyReference.areaOptions()
StudyReference.areaForSheet(sheetId)
StudyReference.categoryForSheet(sheetId)
StudyReference.sheetFor(sheetId)
StudyReference.sheetHref(sheetId)
StudyReference.knownSet(), setKnown(factId, bool)
StudyReference.sourceOptions(entries), sourceLabel(source)
StudyReference.normalize(value), tokens(value)
StudyReference.escape(value), icon(name, size), plural(n, one, many), clip(value, max)
```

Cada entrada anotada conserva sus campos originales (`term`, `definition`, `detail`, `text`, `title`, `headers`, `source`, `sheetId`, `sectionIndex`, `sectionTitle`) y añade `sheet`, `areaId`, `areaTitle`, `areaShort`, `categoryId`, `categoryTitle`, `searchText`.

## 4. Vistas

### 4.1 `#/glosario`

- Módulo `glossary`, `path:"glosario"`, título «Glosario», `restoreScroll:true`.
- Carga `glossary` en `mount`; estado de carga/error/reintento.
- Cabecera con Panel, kicker «Herramientas», h1, subtítulo y contador.
- Buscador `[data-ref-search]` sin acentos y filtro por área `[data-ref-area]`; contador `[data-ref-count]` con `aria-live`.
- Lista `.ref-glossary-item[data-term-id]` con término, definición, categoría/ficha, sección y enlace `[data-ref-action="goto"]` a `#/ficha/:id`.
- Orden alfabético estable; estado vacío con el término buscado.
- No usa el popover del lector; esta vista es una lista consultable.
- Selectores: `section[data-ref-view="glosario"]`, `#ref-glosario-title`, `[data-ref-loading]`, `[data-ref-error]`, `[data-ref-search]`, `[data-ref-area]`, `[data-ref-count]`, `.ref-glossary-item`.

### 4.2 `#/datos`

- Módulo `facts`, `path:"datos"`, título «Datos para memorizar».
- Carga `facts` en `mount`.
- Buscador y área; filtro «Solo pendientes» `[data-ref-filter="pending"]`.
- Progreso global `[data-ref-progress]`/`[data-ref-known-count]`: fichas/datos conocidos sobre el total de `facts`, aunque el filtro esté activo; no cuenta datos filtrados como total.
- Cada `.ref-fact-item[data-fact-id]` muestra término, detalle, encabezados de tabla, ficha/sección y botón `[data-ref-action="known"]` con `aria-pressed`.
- Marcar/desmarcar persiste con `StudyStore.factsKnown.set`; anuncia el cambio y conserva foco; no toca Flashcards.
- Si `StudyStore.factsKnown` no existe, desactiva el control y explica.
- Selectores: `section[data-ref-view="datos"]`, `#ref-datos-title`, `[data-ref-search]`, `[data-ref-area]`, `[data-ref-filter="pending"]`, `[data-ref-progress]`, `.ref-fact-item`, `[data-ref-action="known"]`.

### 4.3 `#/trampas`

- Módulo `traps`, `path:"trampas"`, título «Trampas frecuentes».
- Carga `warnings` en `mount`; agrupa y etiqueta `source`: `callout` = «Aviso», `bullet` = «Distinción».
- Buscador, área y filtro de fuente `[data-ref-source]` (`todos`, `callout`, `bullet`).
- Lista `.ref-trap-item[data-warning-id]` con título, texto, tono/severidad, fuente, ficha/sección y enlace.
- Límite inicial de 40 resultados; `[data-ref-action="more"]` muestra otros 40; contador visible.
- Estado vacío/error y foco conservado.
- Selectores: `section[data-ref-view="trampas"]`, `#ref-trampas-title`, `[data-ref-search]`, `[data-ref-area]`, `[data-ref-source]`, `[data-ref-count]`, `.ref-trap-item`, `[data-ref-action="more"]`.

### 4.4 `#/relampago`

- Módulo `plan-relampago`, `path:"relampago"`, título «Repaso relámpago», `restoreScroll:true`.
- Carga `facts`, `glossary` y `warnings` solo en `mount`/inicio; estado de carga/error/reintento.
- Pantalla inicial: explicación breve, filtro de área `[data-quick-area]` y botón `[data-quick-start]` («Empezar ronda de 10»). No crea ni modifica tarjetas.
- Ronda de 10 preguntas construida con datos reales: término → detalle/definición, o título de aviso → texto. Pregunta en `[data-quick-prompt]`, respuesta oculta en `[data-quick-answer]`, botón `[data-quick-reveal]`.
- Tras revelar: `[data-quick-rate="known"]` («La sabía») y `[data-quick-rate="again"]` («Repasar»); progreso `[data-quick-progress]`; puntuación final `[data-quick-score]` y `[data-quick-restart]`.
- Navegación con teclado; foco al botón de revelar/siguiente; sin límite de tiempo que expulse al usuario. No persiste la ronda.
- Selectores: `section[data-plan-view="relampago"]`, `#plan-relampago-title`, `[data-quick-area]`, `[data-quick-start]`, `[data-quick-card]`, `[data-quick-prompt]`, `[data-quick-answer]`, `[data-quick-reveal]`, `[data-quick-rate]`, `[data-quick-progress]`, `[data-quick-score]`, `[data-quick-restart]`, `[data-quick-loading]`, `[data-quick-error]`.

### 4.5 `#/ultimo-dia`

- Módulo `plan-lastday`, `path:"ultimo-dia"`, título «Hoja de último día».
- Carga los tres derivados en `mount`; estado de carga/error/reintento.
- Cabecera con fecha de examen y días restantes si hay plan; filtro de área `[data-lastday-area]` y botón `[data-lastday-print]` que llama a `window.print()`.
- Tres bloques compactos: `[data-lastday-facts]` (datos), `[data-lastday-glossary]` (definiciones) y `[data-lastday-traps]` (avisos/distinciones), con límites y contadores para que quepa en una hoja.
- Enlace a `#/plan` si no hay plan; no crea plan. No toca Flashcards.
- Estilos de impresión: ocultar appbar/footers/paneles y dejar solo la hoja; el CSS de impresión puede usar selectores globales **solo dentro de `@media print`** y debe documentarlo.
- Selectores: `section[data-plan-view="ultimo-dia"]`, `#plan-lastday-title`, `[data-lastday-area]`, `[data-lastday-print]`, `[data-lastday-facts]`, `[data-lastday-glossary]`, `[data-lastday-traps]`, `[data-lastday-loading]`, `[data-lastday-error]`.

## 5. Navegación

- **Más → Última hora** (o dos grupos equivalentes) con las cinco rutas, iconos existentes y sin añadir controles a la appbar:
  - `#/relampago` · Repaso relámpago · `flame`
  - `#/ultimo-dia` · Hoja de último día · `calendar`
  - `#/glosario` · Glosario · `book`
  - `#/datos` · Datos para memorizar · `list`
  - `#/trampas` · Trampas frecuentes · `alert`
- La paleta Ctrl+K incluye las cinco vistas con motivos.
- `#/ruta` añade enlaces a `#/relampago` y `#/ultimo-dia` en una franja «Antes del examen», para que también sean descubribles en escritorio.
- Enlaces internos con `data-nav`; el router no recarga.
- La appbar móvil sigue con cinco controles.

## 6. Pruebas y aceptación

- Node: suite existente de plan/store sigue verde; no se añaden dependencias.
- E2E nuevos DASH-39…44:
  - carga perezosa de cada derivado (0 al arrancar; peticiones solo en su ruta);
  - glosario: búsqueda sin acentos, área, enlace a ficha;
  - datos: filtro pendientes, marcar/desmarcar persistente, progreso y no tocar Flashcards;
  - trampas: fuentes, área, paginación y conteo;
  - relámpago: inicio, 10 preguntas, revelar/calificar, puntuación y reinicio;
  - último día: tres secciones, área, print y enlace a plan;
  - Más/paleta/ruta, 6 viewports y 44 px.
- axe 0 violaciones en las cinco rutas, ambos temas; capturas en 6 viewports; contraste AA.
- Sin overflow horizontal; foco visible; reduced motion.
- No se inicia una fase posterior.

## 7. Propiedad de archivos

| Archivo | Propietario |
|---|---|
| `js/nav/reference.js` | Coordinador |
| `js/nav/glossary.integration.js`, `css/glossary.css` | Agente R1 |
| `js/nav/facts.integration.js`, `css/facts.css` | Agente R2 |
| `js/nav/traps.integration.js`, `css/traps.css` | Agente R3 |
| `js/plan/plan.relampago.js`, `js/plan/plan.lastday.js`, `css/plan-relampago.css`, `css/plan-lastday.css` | Agente 4 |
| `js/nav/nav.integration.js`, `js/nav/palette.js`, `css/nav.css` | Agente 5 |
| `tests/e2e/*`, `tools/qa/*` | Agente 6 |
| `index.html`, `app.js`, `docs/`, `CHANGELOG.md`, `AUTORIA.md`, `INTEGRITY.sha256` | Coordinador |

---

© 2026 ZARCONT — Documento interno del proyecto.
