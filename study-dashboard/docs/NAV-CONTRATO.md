# NAV-CONTRATO · Navegación del lector y búsqueda en el cuerpo

**Agente:** 5 · Navegación y referencias  
**Fase:** 1 · integración real; Fase 2 · planificación; Fase 3 · última hora (Study Dashboard 2.3.0)  
**Estado:** integrado en `index.html` por el Coordinador; el previsualizador de Fase 0 se conserva como material interno  
**Fecha:** 10 nov 2026

Este documento describe los componentes de `study-dashboard/js/nav/*`, la integración `study-dashboard/js/nav/nav.integration.js` y `study-dashboard/css/nav.css`. La Fase 0 entregó la biblioteca y el previsualizador `docs/preview-nav.html`; la Fase 1 los conecta con `StudyApp`, el lector y la biblioteca reales; la Fase 2 añade las cuatro vistas de planificación a la paleta (§12) y la Fase 3 las cinco vistas de última hora (§13). **El previsualizador no se enlaza desde la app.**

---

## 1. Archivos y orden de carga

```
study-dashboard/
  js/nav/
    core.js         utilidades, capas, foco, scroll lock, portales
    search.js       índice, ranking, fragmento, panel de búsqueda
    sections.js     índice de secciones + scrollspy + hoja móvil
    palette.js      paleta Ctrl+K (combobox/listbox)
    nav.integration.js  integración Fase 1: búsqueda, índice, paleta y relacionadas
    glossary.js     extracción, decoración y popover de glosario (Fase 3)
    sources.js      panel de fuentes PDF (Fase 3)
    preview.js      solo demo del previsualizador (no cargar en la app)
  css/nav.css
  docs/
    preview-nav.html
    NAV-CONTRATO.md
```

Orden obligatorio en la app (Fase 1):

```html
<link rel="stylesheet" href="css/nav.css?v=2.3.0">
<!-- shared: temario, taxonomy, icons, ui, store; app.js; derived-loader.js -->
<script src="js/nav/core.js?v=2.3.0"></script>
<script src="js/nav/search.js?v=2.3.0"></script>
<script src="js/nav/sections.js?v=2.3.0"></script>
<script src="js/nav/palette.js?v=2.3.0"></script>
<script src="js/nav/nav.integration.js?v=2.3.0"></script>
```

`glossary.js` y `sources.js` no forman parte de esta integración de navegación: el Coordinador decide qué scripts de referencia/carga entran en `index.html` para Fase 3. `palette.js` comprueba que `StudyNav.search` exista; no hay módulos ES, dependencias externas ni `eval`. El previsualizador conserva su orden con `preview.js` y sin `nav.integration.js`.

Todos los textos dinámicos de los componentes pasan por `StudyUI.escapeHTML` (o por `StudyNav.escape`, que delega en él). La única cadena con HTML confiable es el `<mark class="navx-mark">` generado por el propio generador de fragmentos.

---

## 2. Previsualizador

Desde la raíz del repositorio, por HTTP:

```powershell
cd "C:\Users\USARIO\Documents\ZARCONT SERUMS"
python -m http.server 8787
```

Abrir:

```
http://127.0.0.1:8787/study-dashboard/docs/preview-nav.html
```

El documento:

- Carga el temario real (`study-data/temario.js`, 210 fichas y 48 fuentes).
- Tiene selector de ficha, búsqueda con estados de QA, lector realista, índice, fuentes, glosario y paleta.
- Cambia de tema con `data-theme-toggle` y conserva la preferencia compartida `study-theme`.
- Expone `window.__navPreview` solo para QA (`provider`, `panel`, `palette`, `openSheet`, estados).
- No está enlazado desde la app, no se carga al arrancar y no forma parte de la navegación del producto.
- `preview.js` fija `scroll-behavior: auto` en el documento para que las pruebas automáticas con clic real no reinicien `scrollIntoView`; los componentes conservan su desplazamiento suave propio.

Verificación realizada con Chrome headless servido por HTTP: sin excepciones, sin errores de consola, sin scroll horizontal en 360/390/768/1024/1440 y con los estados vacío/cargando/error. Las capturas finales corresponden a QA.

---

## 3. Búsqueda en el cuerpo · `StudyNav.search`

### 3.1 API pura

```js
StudyNav.search = {
  normalize(text),                 // minúsculas, sin diacríticos
  normalizeWithMap(text),          // {text, map} para mapear índices al original
  tokenize(query),                 // hasta 8 términos, sin duplicados
  tokenRegex(token),               // coincidencia por inicio de palabra
  buildIndex(content, {taxonomy}),
  buildIndexAsync(content, {taxonomy, chunkSize, onProgress, signal}),
  searchIndex(index, query, {areaId, limit, hrefFor, snippetLength}),
  buildSnippet(text, matchers, {maxLength}),
  makeSnippet(text, query, {maxLength}),
  highlightText(text, tokensOrMatchers),
  findRanges(text, tokensOrMatchers),
  renderResultsHTML(results, tokensOrMatchers, {hrefFor}),
  adaptDerivedIndex(data, {content, taxonomy}),
  createIndexProvider({content, taxonomy, chunkSize, load}),
  createPanel(options)
};
```

**Ranking.** Los documentos deben contener todos los términos (AND). El peso dominante es el título; después conceptos, títulos de sección, resumen y, por último, cuerpo/viñetas/tablas/avisos. Una coincidencia de frase completa en el título recibe la prima mayor. Los términos de 3 o más caracteres funcionan por prefijo (`vacun` → `vacunación`, `vacunaciones`); los más cortos exigen palabra completa. La búsqueda no distingue mayúsculas ni tildes.

**Campos indexados por ficha.** `title`, `summary`, `keyConcepts`, títulos de sección, párrafos, viñetas, cabeceras y filas de tabla y avisos. Cada coincidencia conserva `sectionIndex`, `sectionTitle` y `paragraphIndex` en el bloque de origen para una futura navegación al párrafo.

**Resultado** (`searchIndex`):

```js
{
  id, type: "sheet", title, titleHTML,
  areaId, areaTitle, categoryId, categoryTitle, topicTitle, path: [area, category],
  href, snippet, snippetPlain, matches, matchLabel, counts, score, minutes
}
```

`counts` separa `title`, `concepts`, `summary`, `sections`, `body`, `bullets`, `tables` y `callout`. El fragmento prefiere el bloque con más coincidencias; si el término solo aparece en el título, el fragmento usa el título para no perder el resaltado.

**Seguridad del fragmento.** `snippet` es HTML ya seguro: el texto se escapa por tramos y solo se insertan etiquetas `<mark class="navx-mark">` alrededor de los rangos encontrados. Ningún texto del temario se inyecta sin escapar. `titleHTML` sigue la misma regla.

### 3.2 Índice perezoso y compartido

El índice **no se construye al crear el panel ni al cargar la página**. `createPanel` pinta el estado inicial y solo llama `provider.ensure()` en el `focus` del campo o del filtro.

```js
const provider = StudyNav.search.createIndexProvider({
  content: window.STUDY_CONTENT,
  taxonomy: window.StudyTaxonomy,
  chunkSize: 18
});

const panel = StudyNav.search.createPanel({
  mount: "#nav-search",
  provider,
  content: window.STUDY_CONTENT,
  taxonomy: window.StudyTaxonomy,
  hrefFor: (id) => "#/ficha/" + encodeURIComponent(id),
  onOpenSheet: (id, result) => { /* la app decide: navegar o previsualizar */ }
});
```

`provider`:

- `ensure()` devuelve una promesa; construye en trozos con `setTimeout(0)` (no bloquea el foco).
- `subscribe(fn)` avisa de `idle`, `loading` con `progress`, `ready` y `error`.
- `reset()` permite reintentar desde el estado de error.
- `getState()` devuelve `{state, index, error, progress, source, counts}`.
- Compartir un `provider` entre panel y paleta evita indexar dos veces.

Estados del panel: inicial perezoso, cargando con progreso y esqueleto, error con reintento, vacío con limpiar búsqueda/quitar filtro, resultados.

### 3.3 Adaptador para el índice derivado (Agente 2)

**Formato real publicado (Fase 1).** `study-data/derived/search.json` es un documento compacto con `entries[]` de la forma `{k, sid, s, p, t, f}`. `StudyNav.search.adaptDerivedIndex` lo acepta directamente:

| `k` | Significado | `s` / `p` | Texto |
|---|---|---|---|
| `m` | Título de la ficha | `-1` / `-1` | `f` con acentos; `t` normalizado |
| `y` | Resumen | `-1` / `-1` | `f` con acentos (puede ir recortado); `t` completo |
| `s` | Título de sección | sección / `-1` | `f` con acentos; `t` normalizado |
| `p` | Párrafo del cuerpo | sección / párrafo | `f` visible con acentos; `t` completo normalizado |
| `b` | Viñeta | sección / índice | `t` (en el archivo real `f` suele estar vacío) |
| `t` | Fila de tabla | sección / fila | `t` (celdas unidas); `f` si existe |
| `w` | Aviso / idea para retener | sección / índice | `f` con acentos; `t` completo |
| `c` | Concepto clave | `-1` / índice | `t`; el adaptador usa los conceptos del temario si existen |

Reglas aplicadas:

- **Texto indexado:** `t` (completo, normalizado); **texto visible:** `f` si existe y no está vacío, si no `t`. El fragmento usa `f` cuando contiene la coincidencia y cae a `t` cuando `f` está recortado y no alcanza el término; así nunca se pierde el `<mark>`.
- **Metadatos:** título, resumen, conceptos, área, categoría y tema se completan desde `STUDY_CONTENT`/`StudyTaxonomy`; no se inventan fichas ni secciones. Una entrada con `sid` desconocido se omite.
- **Versión:** si `contentVersion` no coincide con `StudyContent.version`, el adaptador rechaza el documento y la integración usa el respaldo local. Así un derivado viejo no muestra enlaces a fichas que ya no existen.
- **Estructura:** los índices `s`/`p`/`b`/`t` se conservan; los huecos no se reempaquetan. Las tablas se indexan por fila y los avisos por `section.callouts` (el temario real tiene un caso con dos avisos).
- **Coste medido:** 10.014 entradas → 210 documentos en ~320 ms en el equipo de desarrollo, una sola vez por sesión.

El adaptador conserva compatibilidad con los formatos de Fase 0: `docs[]` por ficha y `entries[]` genéricas con `sheetId`, `sectionIndex`, `paragraphIndex` y `text`.

```json
{
  "version": 1,
  "entries": [
    { "sheetId": "sheet-aps-01", "sectionIndex": 0, "paragraphIndex": 0, "text": "…" }
  ]
}
```

Formato documental de Fase 0 (compatibilidad, no es el que publica el generador actual):

```json
{
  "version": 1,
  "generatedAt": "2026-11-09T00:00:00.000Z",
  "docs": [
    {
      "sheetId": "sheet-aps-01",
      "title": "…",
      "summary": "…",
      "keyConcepts": ["…"],
      "sections": [
        { "title": "…", "body": ["…"], "bullets": ["…"] }
      ]
    }
  ]
}
```

También se aceptan entradas planas ya agrupables, útiles si el generador prefiere no duplicar metadatos:

```json
{
  "version": 1,
  "entries": [
    {
      "sheetId": "sheet-aps-01",
      "sectionIndex": 0,
      "paragraphIndex": 0,
      "sectionTitle": "…",
      "text": "…"
    }
  ]
}
```

El adaptador completa área, categoría, tema y título desde `STUDY_CONTENT`/`StudyTaxonomy`; no inventa contenido. Si la entrada solo trae un fragmento y no el párrafo completo, la búsqueda funciona pero el cuerpo disponible queda limitado al fragmento. **Recomendación para el Agente 2:** incluir el texto completo de párrafos/viñetas/tablas, no solo el snippet ya recortado.

Uso real en `nav.integration.js`:

```js
const provider = StudyNav.search.createIndexProvider({
  content: window.STUDY_CONTENT,
  taxonomy: window.StudyTaxonomy,
  chunkSize: 18,
  load: async () => {
    try {
      const raw = await window.StudyDerived.load("search");
      return StudyNav.search.adaptDerivedIndex(raw, {
        content: window.STUDY_CONTENT,
        taxonomy: window.StudyTaxonomy
      });
    } catch (error) {
      // Respaldo declarado: indexar el temario una sola vez.
      const index = await StudyNav.search.buildIndexAsync(window.STUDY_CONTENT, {
        taxonomy: window.StudyTaxonomy,
        chunkSize: 18,
        source: "content-fallback"
      });
      index.derivedFallback = true;
      return index;
    }
  }
});
```

**Estrategia de carga y error:** el provider no se activa al arrancar. `createPanel` solo llama `ensure()` en el `focusin` del campo o del selector de área; la paleta lo llama al escribir la primera consulta (`lazyIndex:true`). Si `StudyDerived` falla, no encaja la versión o el adaptador rechaza el documento, se construye el índice desde el temario con `buildIndexAsync`; el panel solo muestra el estado de error y el botón de reintento si también falla ese respaldo. `provider.reset()` permite reintentar desde cero y vuelve a pedir `search.json`.

### 3.4 Panel de búsqueda: opciones y métodos

```js
StudyNav.search.createPanel({
  mount, provider, content, taxonomy,
  value, areaId, limit,
  resultsMount,     // host externo opcional para el cuerpo de resultados
  inputAttributes,  // atributos extra del campo (la app pasa data-library-search-input)
  onQueryChange,    // (query, {active, areaId}) => void
  hrefFor,          // (sheetId) => href
  onOpenSheet,      // (sheetId, result) => void; si existe se evita la navegación por defecto
  chunkSize
}) -> {
  root, provider,
  focus(), setQuery(value, {focus}), setArea(areaId),
  getArea(), getQuery(), run(), getResult(), destroy(),
  setDebugState("loading" | "error" | "empty" | null) // solo previsualizador/QA
}
```

El markup incluye campo `type="search"`, filtro nativo por área, `role="status"` para el recuento y `aria-busy` en el cuerpo. Enter abre el primer resultado. Escape en el campo limpia la consulta. Los enlaces de resultado llevan `href="#/ficha/<id>"`; con `onOpenSheet` el componente previene la navegación y entrega la ficha al host.

Con `resultsMount`, el cuerpo no se pinta dentro del host del campo: el panel usa el nodo externo (la app pasa `#library-body-results`), le añade `data-navx-search-body`, `aria-busy` y la delegación de clic de sus estados (reintento/limpiar/todas las áreas). El campo recibe `aria-controls` con el id del host externo. `onQueryChange` avisa en cada cambio real de consulta para que el host oculte/restaure la biblioteca sin leer el DOM.

**Decisión de interacción:** el `focusin` del panel solo reacciona al campo y al selector de área. Reaccionar a cualquier foco dentro del panel reemplazaba el DOM al enfocar un resultado y cancelaba el clic (detectado y corregido en la verificación real).

---

## 4. Índice flotante de secciones · `StudyNav.sections`

```js
const sections = StudyNav.sections.collect(readerRoot, {
  selector: ".reader-section",
  headingSelector: "h2, h3"
});

const index = StudyNav.sections.create({
  mount: "#reader-index",       // rail de escritorio / contenedor móvil
  root: readerRoot,             // alternativa a sections:
  selector: ".reader-section",
  offset: 84,                   // appbar + margen
  mobileBreakpoint: 900,
  onSelect: (index, section) => {}
});

index.destroy();
index.open(); index.close(); index.refresh();
```

- **Rail de escritorio:** la cápsula es sticky (`top: var(--navx-sections-top, 84px)`) y no invade la columna de lectura. El host debe montarlo en una columna lateral que sea sticky (la app ya tiene `.reader-rail` con `position: sticky`); el previsualizador usa la misma estructura.
- **Hoja inferior móvil (≤900 px):** botón circular visible de 46×46 (`aria-expanded`, `aria-controls`), hoja `role="dialog" aria-modal="true"`, cierre con Esc, botón visible y clic en el velo, bloqueo de scroll, foco al botón de cierre y retorno al disparador. El foco queda atrapado dentro de la hoja. No se usan gestos exclusivos.
- **Scrollspy:** `IntersectionObserver` con `rootMargin` superior negativo; una lectura de scroll por `requestAnimationFrame` completa el estado y la barra. Si no existe `IntersectionObserver`, el listener de scroll sigue funcionando.
- **Estado activo textual:** `aria-current="location"`, etiqueta visible **Leyendo** en el elemento activo y `Sección N de M`. La barra de avance es `role="progressbar" aria-valuenow`; el porcentaje se calcula sobre el tramo de secciones, no sobre toda la página.
- **Sin hash:** los elementos son `<button>`, nunca enlaces `#seccion`; así no se dispara el router de la app.
- **Foco al saltar:** el `h2` de destino recibe `tabindex="-1"` y foco con `preventScroll`, después del desplazamiento. El host no necesita añadir nada.
- **Sin secciones:** el contenedor se oculta y no se pinta botón ni hoja. `visible:false`.
- **No tapa contenido:** en escritorio el índice vive en la columna lateral; en móvil el botón circular es pequeño y el lector debe reservar espacio inferior (ver PEDIDOS). La hoja es una capa temporal, no un panel permanente.

**Integración requerida:** las secciones necesitan `id` estables. El lector actual ya renderiza `id="section-N"`; el componente usa esos IDs para `aria-controls` y para enfocar el encabezado. Si en Fase 1 cambia el render, conservar IDs únicos.

---

## 5. Paleta Ctrl+K · `StudyNav.palette`

```js
const palette = StudyNav.palette.create({
  provider: searchProvider,
  content: window.STUDY_CONTENT,
  taxonomy: window.StudyTaxonomy,
  bindShortcut: false,            // en la app se registra con StudyApp.shortcuts
  lazyIndex: true,                // no pedir search.json al abrir; sí al escribir
  actions: [ /* descriptor */ ],
  views: [ /* descriptor */ ],
  onOpenSheet: (sheetId) => {},
  onNavigate: (href, meta) => {}
});

palette.open(trigger);
palette.close();
palette.destroy();
```

- **Atajo:** `Ctrl+K` / `⌘K`. No se registra `/`, que sigue siendo el atajo del campo de biblioteca de la app. En Fase 1, registrar con `StudyApp.shortcuts` para respetar el enrutador y `allowInInputs`; el `bindShortcut:true` del previsualizador es solo para la demo.
- **Apertura desde Más:** la app cierra su panel y emite `StudyApp.events.emit("palette:open", {trigger})`; `nav.integration.js` escucha ese evento y llama `palette.open(trigger)`. Si el `trigger` recibido es el botón interior del panel (queda oculto al cerrarlo), se normaliza al botón visible `[data-action="more-open"]`; si Más no es visible en el viewport, el foco vuelve a `#main`. No se añade un listener de clic directo sobre `[data-navx-open-palette]`.
- **Combobox real:** `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`; el listbox contiene grupos (`role="group"`) con opciones (`role="option"`, `aria-selected`).
- **Teclado:** ↑/↓ con retorno circular, Home/End, Enter, Esc; Tab queda atrapado entre el campo y el cierre. Los clics y el movimiento de puntero actualizan la opción activa.
- **Grupos:** Vistas (Panel, Biblioteca, Progreso, Mis subrayados, Dudas, Respaldo y datos), Acciones (tema, abrir respaldo, exportar respaldo), Áreas (5), Categorías (solo con consulta) y Fichas (solo con consulta). La primera opción activa es la coincidencia exacta o por prefijo del texto escrito, para que «progreso» active «Progreso» aunque haya fichas que mencionen la palabra.
- **Foco:** el diálogo es modal, el fondo queda `inert`, el scroll se bloquea y el foco se restaura al disparador al cerrar con Esc, velo o botón. Al abrir una ficha, el foco pasa a la vista de destino (el host decide); no se devuelve al disparador.
- **Móvil:** hoja inferior a ancho completo, entrada de 16 px para evitar zoom en iOS, cierre visible; no depende de gestos.
- **Acciones reales:** por defecto usa `StudyUI.toggleTheme()` y `StudyStore.exportProgress()`; si esta última no existe (Fase 0), genera un JSON con `StudyStore.getState()` y el formato de respaldo documentado. En Fase 1 el host debe pasar las acciones definitivas. Descriptor:

```js
{
  id: "backup",
  kind: "action",
  label: "Exportar respaldo",
  hint: "Descarga tu progreso en JSON",
  icon: "external",
  keywords: "respaldo backup exportar json",
  run() {}
}
```

Las vistas usan `href`; las fichas usan `sheetId` y `onOpenSheet`.

---

## 5 bis. Fichas relacionadas · `nav.integration.js`

El bloque se monta al final de `.reader-main`, en `[data-module-mount="reader-related"]`, antes del paginador. Solo carga `study-data/derived/related.json` al abrir una ficha (`StudyDerived.load("related")`, cacheado por sesión) y no se pide al arrancar.

**Regla de composición (aprobada en Fase 1), sin inventar contenido clínico:**

1. **Evidencia textual primero.** Se usan las entradas de `related.json` de la ficha actual, como máximo 4. Cada tarjeta muestra el motivo con los términos de `sharedTerms` (o `evidence.source.term`/`evidence.target.term`) y, si se puede resolver, la sección de origen: «Comparten el término «abstinencia» en la sección «…»». Solo se enlaza un `sheetId` que exista en `STUDY_CONTENT`.
2. **Respaldo estructural.** Si hay menos de 4, se completa con fichas existentes del **mismo tema** (`topicId`), hasta 3, con el motivo «Comparten el tema: «…»». Si el tema solo tiene esa ficha, se usan fichas de la **misma categoría** (`categoryId`), hasta 3, con «Comparten la categoría: «…»».
3. Sin duplicados, sin la ficha actual y sin superar 4 tarjetas. `related.json` manda: una relación con evidencia nunca se sustituye por una estructural.
4. Si no hay evidencia ni fichas de tema/categoría, el host queda vacío y no se pinta un bloque vacío. En el temario real todas las fichas tienen categoría compartida, por lo que el bloque aparece en las 210.
5. Si `related.json` falla, se usa el respaldo estructural y no se rompe el lector; no se muestra un error por una relación auxiliar.

El motivo siempre es texto real del temario o del índice derivado (`topicTitle`, `category.title`, `sharedTerms`); no se redactan relaciones clínicas nuevas. Los enlaces son `#/ficha/<id>` con `data-nav`, por lo que usan el router existente.

---

## 6. Glosario emergente · `StudyNav.glossary`

### 6.1 Extracción literal

```js
const glossary = StudyNav.glossary.fromContent(window.STUDY_CONTENT, {
  terms: [
    { term: "atención primaria de salud", display: "Atención primaria de salud" },
    { term: "longitudinalidad", display: "Longitudinalidad" },
    { term: "integralidad", display: "Integralidad" },
    { term: "coordinación", display: "Coordinación" }
  ]
});
// { terms: [...], missing: [...] }
```

`fromContent` busca una oración textual del temario en la que el término vaya seguido de una fórmula definitoria (`es`, `implica`, `significa`, `se refiere a`, `consiste`, `se entiende por`…). La definición publicada es la **oración literal**, no una redacción nueva. Si no hay definición, el término va a `missing` y no se publica.

Cada término lleva `sheetId`, `sheetTitle`, `sectionIndex`, `sectionTitle` y `paragraphIndex`. El popover enlaza a la ficha de origen.

### 6.2 Helper de primera aparición

```js
StudyNav.glossary.decorate(root, glossary, {
  scopeSelector: ".reader-section",
  oncePerSection: true
}); // devuelve el número de términos decorados
```

- Recorre nodos de texto y salta encabezados, enlaces, botones, código, formularios y el propio glosario.
- Por defecto decora **solo la primera aparición de cada término en cada sección**. `oncePerSection:false` lo limita a una vez por contenedor global.
- El disparador es un `<button type="button">` con subrayado punteado discreto, icono de información `aria-hidden` y nombre accesible «Ver definición de …». En puntero grueso se amplía el área táctil sin mover el texto.
- No se decora la primera aparición si cae dentro de un encabezado o un enlace: se busca la siguiente aparición en cuerpo.

### 6.3 Popover

```js
const view = StudyNav.glossary.enhance({
  root: readerRoot,
  glossary,
  scopeSelector: ".reader-section",
  onOpenSheet: (sheetId) => {}
});
view.destroy();
```

- Activación por click, Enter o tap; nunca solo hover.
- Una sola definición visible (capas); cierre con Esc, clic fuera y botón. Esc y el botón devuelven el foco al término; un clic fuera lo devuelve cuando el clic no fue sobre otro control (si el usuario pulsa otro botón o enlace, el foco respeta ese control).
- `role="dialog" aria-modal="false"`, título, definición y fuente. En ≤900 px se presenta como hoja inferior para que no desborde; no es un gesto exclusivo.
- En el previsualizador se muestran las cuatro definiciones extraídas del temario real; no hay texto clínico redactado para la demo.

---

## 7. Fuentes PDF · `StudyNav.sources`

```js
const sources = StudyNav.sources.create({
  mount: "#reader-sources",
  sheet,
  resolveSource: (id) => StudyStore.getSource(id),
  baseHref: window.location.href, // en el preview: URL de study-dashboard/index.html
  wideMin: 1180
});
sources.refresh(nextSheet); sources.destroy();
```

- **≥1180 px:** tarjeta lateral con botón visible «Ver fuentes y páginas». Al abrir, el panel es un acordeón dentro de la columna de la ficha (no tapa la lectura); muestra **título, procedencia y páginas**, con enlace al PDF en pestaña nueva. El foco pasa al botón de cierre; Esc y clic fuera cierran y devuelven el foco al disparador.
- **<1180 px:** enlaces directos `target="_blank" rel="noopener"` a cada PDF y página. Sin panel emergente.
- Estados: sin `sourceRefs` («Sin referencia documental») y referencias no resueltas («Las fuentes no están disponibles»).
- El enlace añade `#page=<primera página>` igual que el lector actual. La apertura de esa ancla depende del visor de PDF del navegador.

---

## 8. H6 · Scroll por ruta

**Estado:** el Coordinador aplicó H6 en `app.js` (`DASH-15/16/17` verdes). La navegación de esta fase no tocó `app.js`; este apartado queda como contrato de comportamiento para la integración y para futuras regresiones.

El informe H6 documenta que la biblioteca volvía de 1200 px a 0 px. El comportamiento que se necesita y ya está aplicado es:

1. **Memoria por ruta canónica.** Guardar `scrollY` al salir de `#/biblioteca`, `#/biblioteca/:area`, `#/biblioteca/:area/:categoria` y `#/progreso`, y restaurarlo al volver a la misma ruta (incluido atrás/adelante del navegador).
2. **Filtros y búsqueda no resetean.** Cambiar filtro, consulta, área o categoría no debe llevar al inicio; si el contenido se acorta, el navegador debe poder recortar la posición al nuevo máximo, no forzar 0.
3. **Ficha con su propio scroll.** Al volver de una ficha a la biblioteca se recupera la posición de la lista; al abrir una ficha se usa el `scroll` persistido de esa ficha, no la posición de la biblioteca. El paginador anterior/siguiente sigue abriendo desde el inicio.
4. **Navegación nueva sin memoria** empieza arriba; una ruta de módulo puede declarar `restoreScroll:true`.
5. **No guardar posiciones provisionales** de la restauración: usar el mismo patrón de `scrollToInstant` que ya usa el lector.

El comportamiento H6 está aplicado en `app.js` (DASH-15/16/17 verdes). La integración de la biblioteca no sustituye el scroll ni llama `scrollTo`: solo oculta/restaura nodos con `hidden` y una clase, por lo que la memoria por ruta sigue siendo de la app.

---

## 9. Decisiones de interacción y ARIA

| Decisión | Motivo |
|---|---|
| Ctrl+K / ⌘K, nunca `/` | `/` ya enfoca la búsqueda de biblioteca; no se duplica el atajo. |
| Índice sin hash | Los enlaces internos habrían disparado `hashchange` del router de la app. |
| Fuentes como acordeón lateral ≥1180 y enlaces directos por debajo | Se conserva el contexto de la ficha; el móvil abre el PDF sin panel intermedio. |
| Una sola capa interactiva | `StudyNav.layers` cierra la capa anterior al abrir otra (paleta, glosario, hoja del índice). |
| Fondo `inert` en paleta | Es un diálogo modal; el fondo no debe recibir foco ni lecturas. |
| Hoja del índice sin `inert` de fondo | El panel vive dentro del contenedor montado, no en un portal; se usa `aria-modal`, bloqueo de scroll y trampa de foco. Queda documentado como límite. |
| Búsqueda AND, prefijo desde 3 caracteres | Equilibrio entre precisión editorial y descubrimiento de variantes (`vacun`). |
| Fragmento escapado con `<mark>` propio | Ningún contenido del temario se inyecta como HTML. |
| Foco al `h1`/`h2` tras abrir ficha o sección | El cambio de contexto se anuncia al lector de pantalla sin depender de live regions ruidosas. |
| Objetivos ≥44 px en `(pointer: coarse)` | Controles nuevos; el glosario en línea amplía el área con un pseudo-elemento. |
| 140/220/420 ms y `prefers-reduced-motion` | Se respetan los tokens de movimiento del sistema. |

---

## 10. Integración en Fase 1

La app carga `css/nav.css` y, al final de `index.html`, `js/nav/core.js`, `search.js`, `sections.js`, `palette.js` y `nav.integration.js` con `?v=2.3.0`. `nav.integration.js` registra un único módulo `nav` sin rutas:

```js
StudyApp.registerModule({
  id: "nav",
  init,            // idempotente; la integración también se prepara al cargar
  onRoute,         // monta biblioteca, limpia lector, cierra capas
  onSheetRender    // monta índice y relacionadas con el artículo ya renderizado
});
```

**Nota de arranque:** `app.js` llama `initModule()` con el registro y ejecuta `module.def.init(...)`; `init` se conserva y es idempotente. Aun así, `nav.integration.js` prepara provider, atajos y listeners al cargar el script (crear el provider no descarga nada) y repite la comprobación en `onRoute`/`onSheetRender`. Además, tras registrarse llama `syncInitialRoute()`: si la app ya pintó la ruta antes de que el script se registrara, monta la superficie con el contexto público de `StudyApp` sin forzar `refresh`. La doble preparación es segura y evita depender del orden de carga.

### 10.1 Búsqueda en la biblioteca

- Al entrar en `#/biblioteca`, `onRoute` monta `StudyNav.search.createPanel` en `[data-module-mount="library-search"]`, con `resultsMount:"#library-body-results"`, `inputAttributes:{"data-library-search-input":""}` y un único provider compartido con la paleta.
- El índice **no se pide al arrancar**. Se activa con `focusin` en el campo o en el select de área; la paleta lo pide al escribir la primera consulta. `search.json` se descarga una vez por sesión y se reutiliza.
- Con consulta activa, `syncSearchSurface()` pone `hidden = true` en `#library-summary`, `#library-results` y `.library-filters` (además de la clase `.navx-library-searching` y del CSS). Al limpiar o salir de la ruta, retira la clase y deja `hidden = false`. La app conserva sus filtros y su memoria de scroll (H6); la integración no llama `scrollTo`.
- El cuerpo externo se muestra con consulta, carga o error, y se repliega al quedar listo sin consulta. Los estados vacío/cargando/error y el reintento son los del panel. Enter abre el primer resultado con `ctx.app.navigate`; el clic también.
- La consulta y el área se conservan en memoria de sesión de la integración y se restauran al remontar la biblioteca (refresh de ruta, volver de una ficha o cambio de visibilidad), igual que hacía `state.libraryQuery` en el campo fallback.
- El atajo `/` de la app sigue siendo el único que enfoca el campo: busca primero `[data-library-search-input]`.

### 10.2 Índice de secciones

- Se monta en `[data-module-mount="reader-index"]` con `root` limitado al `article.reader`, `selector:".reader-section"`, `offset:84` y `mobileBreakpoint:900`. Usa los `id="section-N"` existentes y el scrollspy/hoja del componente.
- La etiqueta «Leyendo» se renderiza solo en la sección activa: las demás la mantienen con `hidden`. Así `aria-current="location"`, la clase `.is-active`, el texto visible y la barra/porcentaje describen la misma sección, sin dos etiquetas simultáneas.
- Si hay secciones, `nav.integration.js` añade `.navx-reader-main--indexed` a `.reader-main`; en ≤900 px reserva `padding-bottom: calc(88px + env(safe-area-inset-bottom))` para el FAB de 46×46. Si no hay secciones, no se pinta botón ni hoja y no se añade la clase.
- Al cambiar de ruta se destruyen índice, hoja, listeners y clase; el lector no recibe scroll horizontal.

### 10.3 Paleta Ctrl+K

- Se registran dos atajos con `StudyApp.shortcuts` (`Ctrl+K` y `⌘K`), `allowInInputs:true`, nunca `/`. El botón de Más no se escucha por clic: la app cierra Más y emite `palette:open`, y la integración abre la paleta con el disparador visible (o `#main` si Más no es visible).
- Vistas reales: Panel, Biblioteca, Progreso, **Ruta de hoy**, **Plan de estudio**, **Mapa de dominio**, **Repaso de fichas**, **Repaso relámpago**, **Hoja de último día**, **Glosario**, **Datos para memorizar**, **Trampas frecuentes**, Mis subrayados, Dudas y Respaldo y datos. Acciones: cambiar tema, abrir respaldo y exportar respaldo (`StudyStore.exportProgress` vía `StudyNav.palette.downloadBackup`). Fichas desde el índice compartido.
- Las cuatro vistas de Fase 2 usan los iconos existentes `compass`, `calendar`, `target` y `rotate`; las cinco de Fase 3 usan `flame`, `calendar`, `book`, `list` y `alert`. Todas llevan motivo y palabras clave propios. `uniquePaletteViews()` elimina duplicados por `id`, `href` o etiqueta antes de entregar la lista al componente; los enlaces se abren con `onNavigate` → `StudyApp.navigate`, nunca con recarga. Mientras los módulos de cada fase no estén registrados en `index.html`, el router muestra su 404 editorial: eso no invalida la entrada de la paleta y la verificación final de contenido la hace QA.
- El índice de la paleta es perezoso (`lazyIndex:true`): abrirla no descarga `search.json`; escribir sí. Combobox/listbox, foco modal, `inert`, bloqueo de scroll, Esc/velo/cierre y retorno de foco se conservan del componente. Paleta e índice comparten `StudyNav.layers`.

### 10.4 Fichas relacionadas

Ver la regla completa en §5 bis. Se cargan al abrir una ficha, máximo 4 tarjetas, evidencia de `related.json` primero y respaldo de mismo tema/categoría después. Si no hay candidatos, no se pinta bloque. Si el derivado falla, se usa el respaldo estructural y no se bloquea el lector.

### 10.5 Eventos y estado

`nav.integration.js` escucha `route:change` (cierra la paleta y evita capas huérfanas), `sheet:rendered` (montaje de seguridad si el hook no llegó) y `store:change` (refresca la paleta si está abierta). Usa `ctx.app.navigate` y `ctx.announce`; no necesita `refresh` porque trabaja sobre el DOM ya renderizado por la app. No inventa eventos globales. Todo texto del temario pasa por `StudyUI.escapeHTML`/`StudyNav.escape`.

### 10.6 CSS

Todo lo nuevo vive en `css/nav.css` bajo `.navx-*`:

- `.navx-search-host`, `.navx-search-results-host`, `.navx-search-results-host--visible`, `.navx-library-searching` (ocultación explícita y clase).
- `.navx-reader-index`, `.navx-reader-main--indexed`.
- `.navx-related`, `.navx-related-*`.

Se probaron ambos temas y 360/390/768/1024/1440 sin scroll horizontal; `prefers-reduced-motion` cubre los nuevos bloques y `(pointer:coarse)` mantiene objetivos ≥44 px.

### 10.7 Verificación de esta entrega

- `node --test tests/nav/adapt.test.mjs` — 6/6: adaptador compacto real, 210 fichas, búsqueda con/sin tildes, `<mark>`, filtro de área, versión y `sid` desconocido.
- `node tests/nav/probe-nav.mjs` — 62 comprobaciones en Chrome headless + HTTP: panel, carga solo al enfocar, `search.json` una vez, estados, `hidden` explícito, persistencia de la consulta tras `refresh`, `/`, Ctrl+K, paleta perezosa, **cuatro vistas de Fase 2 y cinco de Fase 3 con iconos/motivos, sin duplicados y navegación a `#/ruta` y `#/glosario` sin recarga**, foco de retorno, índice/scrollspy sin hash, una sola sección «Leyendo», relacionadas con evidencia y respaldo, hoja móvil, 360/390/768/1024/1440, host móvil sin hueco vertical y consola sin excepciones.
- `node tests/nav/related-coverage.mjs` — 210/210 fichas con bloque de relacionadas (≤4 tarjetas, sin duplicados, solo IDs existentes, motivo textual en todas).
- Respaldo comprobado con CDP bloqueando `*search.json*`: el panel pasa a `buildIndexAsync`, busca «vacunación» y devuelve las mismas 19 fichas con «Esquema Nacional de Vacunación» primero, sin estado de error.
- H6 comprobado con el panel montado: biblioteca a `scrollY=1200` → ficha → atrás → `scrollY=1200`, con `#library-summary` visible y el panel de búsqueda presente.
- axe `color-contrast` sobre la paleta abierta con opción activa (tema oscuro y claro): 0 violaciones; la pista activa usa `--text-soft` sobre `--accent-soft`. El índice de secciones muestra una sola etiqueta «Leyendo» y un solo `aria-current="location"` en scroll 0 y tras saltar de sección.
- La búsqueda real «vacunación» devuelve 19 fichas (mismo resultado sin tilde) y el primer título es «Esquema Nacional de Vacunación». «atención primaria» devuelve 13.
- Concurrencia: `js/active/active.integration.js` y `js/plan/today.integration.js` terminaron de escribirse durante la verificación. Al cierre ambos pasan `node --check`; el probe de navegación no registra excepciones de otros módulos. Las tres rutas de la paleta responden con su `h1` real: `#/subrayados` → «Mis subrayados», `#/dudas` → «Bandeja de dudas», `#/respaldo` → «Tus datos, bajo tu control.».

---

## 11. Supuestos, riesgos y límites

- **Formato derivado confirmado.** El `search.json` real es compacto (`entries[] {k,sid,s,p,t,f}`); el adaptador lo consume y omite fichas que no existen en el temario. Si el generador cambia el formato, la integración cae al índice local y la búsqueda sigue funcionando.
- **Coste del índice.** Adaptar 10.014 entradas tarda ~320 ms y descargar el JSON ~2,3 MB; por eso es perezoso, async y con estado de carga. El respaldo `buildIndexAsync` tarda más pero no inventa datos.
- **Memoria.** El índice conserva cadenas normalizadas de párrafos para buscar y recortar; se construye una sola vez por sesión y se comparte entre búsqueda y paleta.
- **PDF `#page=`.** Depende del visor del navegador; es el mismo comportamiento que ya usa el lector actual.
- **Hoja del índice.** No inerta el fondo por la ubicación del montaje; la trampa de foco y el bloqueo de scroll cubren el uso con teclado. Si QA exige `inert` real, en una fase posterior se puede portalizar la hoja.
- **Botón flotante móvil.** Es de 46×46; la clase `.navx-reader-main--indexed` reserva espacio en ≤900 px. Si un tema cambia `.reader-main`, revisar esa reserva.
- **Orden de arranque.** `init`/`onRoute`/`onSheetRender` son idempotentes y la integración también se prepara al cargar; si un cambio futuro en `app.js` altera el orden, `syncInitialRoute()` cubre la ruta ya pintada sin forzar `refresh`.
- **Rutas de Fase 1, 2 y 3.** La paleta enlaza `#/subrayados`, `#/dudas` y `#/respaldo` (Fase 1, operativas), las cuatro rutas de planificación de Fase 2 y las cinco de última hora de Fase 3. El contenido pertenece a los módulos `plan.*` y de referencia; mientras no estén registrados, el router muestra su 404 editorial. No se implementa producto de las vistas ni una fase posterior.
- **Verificación de QA.** Las capturas y axe definitivos son del Agente 6; esta entrega aporta los dos comandos smoke anteriores y las mediciones de layout.

---

## 12. Fase 2 · Paleta de planificación

La paleta incorpora las cuatro vistas de `CONTRATOS-FASE2.md` §6 con los iconos existentes. No se añade nada a la appbar ni se edita `plan/*`.

| Ruta | Vista | Icono | Motivo (`hint`) | Palabras clave |
|---|---|---|---|---|
| `#/ruta` | Ruta de hoy | `compass` | «Qué toca hoy y resumen semanal» | `ruta hoy planificacion diaria resumen semanal tareas` |
| `#/plan` | Plan de estudio | `calendar` | «Examen, minutos diarios y prioridad por área» | `plan estudio examen fecha minutos diarios prioridad areas` |
| `#/dominio` | Mapa de dominio | `target` | «Fuerzas, huecos y cobertura real» | `dominio mapa mastery areas categorias cobertura` |
| `#/repaso` | Repaso de fichas | `rotate` | «Vencimientos y autoevaluación» | `repaso fichas espaciado vencimiento autoevaluacion` |

- **Sin duplicados:** `uniquePaletteViews()` descarta entradas repetidas por `id`, `href` o etiqueta (normalizada a minúsculas). Las nuevas conviven con Panel, Biblioteca, Progreso, Mis subrayados, Dudas y Respaldo.
- **Router:** cada entrada es `kind:"view"` con `href`; la paleta la entrega a `onNavigate` y este llama a `StudyApp.navigate`. No hay listener de clic ni recarga. El probe abre «Ruta de hoy», pulsa Enter y comprueba `location.hash === "#/ruta"` y que un marcador de `window` sobrevive.
- **Estado de rutas:** `index.html` ya carga `plan.runtime.js` y las cuatro vistas (`plan.ruta.js`, `plan.editor.js`, `plan.mastery.js`, `plan.review.js`); sus módulos registran `ruta`, `plan`, `dominio` y `repaso`. La entrada de paleta ya es la definitiva; la verificación de contenido (h1, estados, lazy `plan-model.js`, axe) la hace QA.
- **Selectores QA de navegación:** `.navx-palette-input`, `[data-navx-palette-group="views"] [data-navx-palette-kind="view"]`, `.navx-palette-option-label`, `.navx-palette-option-hint`; para las rutas, los selectores `section[data-plan-view="ruta|plan|dominio|repaso"]` de `CONTRATOS-FASE2.md` §4.
- **Pruebas propias:** `tests/nav/probe-nav.mjs` verifica las cuatro etiquetas de Fase 2 y las cinco de Fase 3, sus motivos, que los nueve iconos existen, que no hay duplicados (15 vistas únicas) y que la paleta navega con el router sin recargar. La cobertura final de las rutas queda en QA/Agentes 4, 7, 8 y R1/R2/R3.

---

## 13. Fase 3 · Última hora en la paleta

La paleta incorpora las cinco vistas de `CONTRATOS-FASE3.md` §5 con iconos existentes. No se toca el producto de las vistas, la appbar ni el grupo «Última hora» del panel Más, que añade el Coordinador.

| Ruta | Vista | Icono | Motivo (`hint`) | Palabras clave |
|---|---|---|---|---|
| `#/relampago` | Repaso relámpago | `flame` | «Diez preguntas rápidas para activar el recuerdo» | `relampago repaso rapido preguntas quiz memoria` |
| `#/ultimo-dia` | Hoja de último día | `calendar` | «Datos, glosario y trampas en una hoja imprimible» | `ultimo dia hoja examen resumen imprimir` |
| `#/glosario` | Glosario | `book` | «Definiciones literales del temario por área» | `glosario definiciones terminos vocabulario` |
| `#/datos` | Datos para memorizar | `list` | «Cifras y datos clave con seguimiento» | `datos memorizar cifras numeros hechos` |
| `#/trampas` | Trampas frecuentes | `alert` | «Distinciones y avisos para no confundir» | `trampas errores avisos distinciones frecuentes` |

- **15 vistas únicas:** las cinco conviven con las diez anteriores (seis de Fase 1, cuatro de Fase 2). `uniquePaletteViews()` descarta duplicados por `id`, `href` o etiqueta; el probe comprueba que hay 15 etiquetas y 15 únicas.
- **Router:** cada entrada es `kind:"view"` con `href` y se abre con `onNavigate` → `StudyApp.navigate`. El probe navega a `#/ruta` y `#/glosario`, comprueba el hash y que un marcador de `window` sobrevive (sin recarga).
- **Dependencia de rutas:** en esta copia aún no están cargados `js/nav/glossary.integration.js`, `facts.integration.js`, `traps.integration.js`, `js/plan/plan.relampago.js` ni `plan.lastday.js` (reference.js existe, pero `index.html` todavía no lo carga). Hasta que esos módulos registren sus rutas, el router muestra el 404 editorial; la entrada de paleta ya es la definitiva. La verificación de contenido (carga perezosa de derivados, estados, axe) es de QA con los módulos integrados.
- **Selectores QA de navegación:** los mismos del §12 para la paleta; para contenido, `section[data-plan-view="relampago|ultimo-dia"]` y `section[data-ref-view="glosario|datos|trampas"]`, con los demás selectores de `CONTRATOS-FASE3.md` §4.
- No se edita `index.html` ni CSS de las vistas; el grupo «Más → Última hora» lo monta el Coordinador.

---

© 2026 ZARCONT — Documento interno del proyecto.
