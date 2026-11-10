# CONTRATOS · Fase 1 (Estudio activo)

**Versión de trabajo:** Study Dashboard 2.3.0  
**Fecha:** 10 de noviembre de 2026  
**Base:** `CONTRATOS.md` (Fase 0) sigue vigente. Este documento solo añade lo necesario para integrar lectura activa, búsqueda/navegación y el bloque inicial «Ruta de hoy».

La regla de propiedad de archivos no cambia. Solo el Coordinador edita `app.js`, `index.html`, `docs/CONTRATOS-FASE1.md`, versiones y documentación de entrega.

---

## 1. Assets e integración

El Coordinador añadirá al final de `index.html`, después de `app.js` y de `js/data/backup.js`, en este orden:

```html
<link rel="stylesheet" href="css/active.css?v=2.3.0">
<link rel="stylesheet" href="css/nav.css?v=2.3.0">
<link rel="stylesheet" href="css/plan.css?v=2.3.0">

<script src="js/data/derived-loader.js?v=2.3.0"></script>

<script src="js/active/active.icons.js?v=2.3.0"></script>
<script src="js/active/active.core.js?v=2.3.0"></script>
<script src="js/active/active.components.js?v=2.3.0"></script>
<script src="js/active/active.behavior.js?v=2.3.0"></script>
<script src="js/active/active.integration.js?v=2.3.0"></script>

<script src="js/nav/core.js?v=2.3.0"></script>
<script src="js/nav/search.js?v=2.3.0"></script>
<script src="js/nav/sections.js?v=2.3.0"></script>
<script src="js/nav/palette.js?v=2.3.0"></script>
<script src="js/nav/nav.integration.js?v=2.3.0"></script>

<script src="js/plan/today.integration.js?v=2.3.0"></script>
```

- No se cargan `glossary.js`, `sources.js` ni `js/plan/plan-model.js` en el arranque de Fase 1: pertenecen a fases posteriores. `today.integration.js` debe ser autosuficiente y no añadir una descarga inicial grande.
- Todos los módulos son scripts clásicos, se autoregistran con `StudyApp.registerModule` y deben tolerar que `StudyApp` esté cargando. No usan ES modules ni bundler.
- Los CSS nuevos van después de `styles.css` y `css/data.css`; cada uno mantiene su prefijo.
- `?v=2.3.0` se conserva en esta fase de desarrollo. El Coordinador sincroniza versiones al cierre.

---

## 2. Puntos de montaje estables

El Coordinador añadirá estos elementos al HTML generado por `app.js`. Los módulos no deben asumir otros nodos para insertar su interfaz.

### Panel `#/`

```html
<div data-module-mount="today-route"></div>
<div data-module-mount="active-summary"></div>
<div data-module-mount="backup-reminder"></div>
```

- `today-route`: contenedor reutilizable del bloque inicial **Ruta de hoy** (Agente 4).
- `active-summary`: contador/resumen de subrayados y dudas para el Panel (Agente 3).
- El bloque de respaldo existente no cambia.

### Biblioteca

Dentro de `.library-tools`:

```html
<div class="library-search-host" data-module-mount="library-search">
  <!-- fallback existente: label.search-field con #library-search -->
</div>
```

Después de `#library-summary` y antes de `#library-results`:

```html
<div id="library-body-results" data-module-mount="library-search-results" hidden></div>
```

- La integración de navegación reemplaza el contenido del host fallback por su panel de búsqueda. Debe dejar su campo con `data-library-search-input` para que el atajo `/` de la app lo enfoque.
- Mientras la búsqueda en el cuerpo tenga una consulta activa, `nav.integration.js` oculta `#library-summary`, `#library-results` y, si procede, `.library-filters`; muestra `#library-body-results`. Al limpiar la consulta restaura los nodos ocultos. El app no reescribe el host de búsqueda entre renders.
- La búsqueda de biblioteca del app queda como fallback si el módulo de navegación no está registrado.
- El foco `/` busca primero `[data-library-search-input]` y, si no existe, `#library-search`.

### Lector `#/ficha/:id`

Dentro de `.reader-rail`, como primera tarjeta:

```html
<div class="reader-rail-index" data-module-mount="reader-index"></div>
```

Después de la tarjeta `.rail-progress`:

```html
<div class="reader-rail-active" data-module-mount="reader-active"></div>
```

Después de `.reader-refs` y antes de `.reader-pager` dentro de `.reader-main`:

```html
<div data-module-mount="reader-related"></div>
```

La app ya conserva:
- `article.reader[data-sheet-id]`;
- `section.reader-section#section-N[data-section-index][data-section-title]`;
- párrafos con `data-paragraph-index`;
- `.reader-concepts`, `.reader-sections`, `.reader-tools`, `.reader-rail`;
- el foco al `h1` tras navegar.

Los módulos deben retirar sus listeners y nodos efímeros al cambiar de ruta (`onRoute`/`unmount`). El contenedor `.reader-rail` no debe recibir scroll horizontal.

### Más (navegación secundaria)

El Coordinador añadirá al panel «Más»:

```html
<button class="dash-more-item" type="button" data-action="open-palette" data-navx-open-palette>
  … Buscar o ir a… <span class="dash-more-kbd">Ctrl K</span>
</button>
<a class="dash-more-item" href="#/subrayados" data-nav data-more-route>… Mis subrayados …</a>
<a class="dash-more-item" href="#/dudas" data-nav data-more-route>… Dudas pendientes …</a>
```

- La app cierra el panel Más y emite `StudyApp.events.emit("palette:open", {trigger})` al pulsar `[data-action="open-palette"]`. **La paleta debe abrirse escuchando ese evento del bus**, no con un listener directo del botón (evita dobles aperturas y capas superpuestas). El evento `palette:open` está aprobado para Fase 1.
- No se añaden iconos nuevos a la appbar. El botón «Más» sigue siendo el punto de entrada de la navegación secundaria.
- `data-nav` cierra el panel y usa el router existente.

---

## 3. Rutas de la Fase 1

| Ruta | Módulo | Responsable | Estado |
|---|---|---|---|
| `#/subrayados` | `active` | Agente 3 | Pública en Fase 1 |
| `#/dudas` | `active` | Agente 3 | Pública en Fase 1 |

`#/ruta`, `#/plan`, `#/dominio` y `#/repaso` siguen reservadas para Fase 2. La paleta puede ofrecerlas cuando existan.

Las dos rutas deben incluir un `h1` real (el router enfoca el primer `h1`), estados vacío/cargando/error y document.title mediante el `title` del descriptor de ruta.

---

## 4. API del store y eventos de Fase 1

La base es la API v2 de la Fase 0. Se autorizan estas extensiones mínimas:

1. `StudyStore.annotations.list({areaId})` además de `sheetId` y `color` (filtro por área, sin tocar el esquema).
2. `StudyStore.recall.add()` y `remove()` emiten `recall:changed` con `{sheetId, id, rating}` por `StudyApp.events` y por DOM cuando esté disponible. El evento se añade al bus de la app.
3. **Preferencias de lectura activa:** se aprueba la clave externa `study-active-prefs-v1` (JSON versionado propio de `js/active`), porque no es progreso, no se exporta y no debe mezclarse con anotaciones. Ejemplo:
   ```json
   { "version": 1, "recallPause": true, "recallEvery": 2, "shortcuts": true }
   ```
   No se añade una colección de preferencias al estado v2. Si el JSON está dañado, se usan valores por defecto y no se bloquea el lector.
4. No se alteran `sheets`, `cards` ni las cajas de repaso de Flashcards. La pausa escribe solo en `recall`/`sheetConfidence`/`annotations`/`userCards`.

Eventos que consumen los módulos: `route:change`, `sheet:rendered`, `store:change`, `annotation:changed`, `doubt:changed`, `confidence:changed`, `recall:changed`. No se inventan eventos globales fuera de estos sin documentarlo.

---

## 5. Lectura activa (Agente 3)

Archivo de integración obligatorio: `js/active/active.integration.js`.

Debe:
- Registrarse como módulo `active`, rutas `subrayados` y `dudas`; `init`, `onRoute`, `onSheetRender` idempotentes.
- Conectar los componentes de Fase 0 con el store v2 y el bus.
- Rellenar `[data-module-mount="reader-active"]` con el panel del rail y `[data-module-mount="active-summary"]` con el resumen del Panel.
- Usar `[data-module-mount="library-search"]` no; ese host es del Agente 5.
- Montar la capa de selección/hoja una sola vez por lector; retirarla al cambiar de ruta.
- Anclar subrayados con los datos ya guardados (`quote`, `prefix`, `suffix`, `sectionIndex`, `paragraphIndex`, `sectionTitle`). Si el texto cambió, mostrar el subrayado huérfano en el panel y permitir recuperarlo/eliminarlo; nunca descartarlo en silencio.
- Ofrecer alternativa por teclado y botón por párrafo; no depender del menú nativo móvil.
- No tocar `cards`. La pausa usa `STUDY_CONTENT.cards` solo para leer pregunta/respuesta y escribe en `recall`.
- Respetar `study-active-prefs-v1`, con interruptor global persistente y frecuencia 1/2/3.
- Rutas `#/subrayados` y `#/dudas` completas, con filtros, búsqueda sin acentos y vacío/error.
- La confianza se ofrece al completar o desde el rail y es editable.
- Las tarjetas propias se crean desde un subrayado, con vista previa y edición; se guardan en `userCards`.
- Los atajos del lector no pueden usar `/` ni `Ctrl+K`; se desactivan al escribir, en diálogos y en campos. Incluir ayuda con `?`.
- El panel de dudas cuenta las dudas abiertas y enlaza a su ruta. Resolver una duda no debe borrar el subrayado.
- Mantener el diseño de Fase 0 y añadir CSS solo en `css/active.css` bajo `.ac-*`.
- Sus selectores y acciones deben ser estables para las pruebas de Agente 6.

## 6. Navegación (Agente 5)

Archivo de integración obligatorio: `js/nav/nav.integration.js`.

Debe:
- Registrarse como módulo `nav`; no crear rutas nuevas en Fase 1.
- Instalar el panel de búsqueda en `[data-module-mount="library-search"]` y usar `#library-body-results` para los resultados.
- Actualizar `adaptDerivedIndex` para aceptar el formato real compacto de `study-data/derived/search.json`:
  `entries[]` con `{k, sid, s, p, t, f}`. Debe probarse contra el archivo real, no contra un fixture inventado. Si el adaptador no puede cargar el JSON, puede usar `buildIndexAsync` como fallback declarado; nunca descargar el índice al arrancar.
- Cargar el índice solo al enfocar el campo o el selector de área y mostrar progreso/error/reintento.
- Rankear título > conceptos > cuerpo; búsqueda sin acentos; filtro por área; fragmento escapado con `<mark>`; estados vacío/cargando/error.
- Ocultar/restaurar la biblioteca normal al entrar/salir de la consulta; no romper el scroll H6 ni los filtros de la app.
- Montar el índice de secciones en `[data-module-mount="reader-index"]`, con scrollspy, hoja móvil y sin hash. Añadir el padding inferior móvil mediante una clase propia en `.reader-main`.
- Registrar `Ctrl+K`/`⌘K` con `StudyApp.shortcuts` (dos registros o la estrategia que respete el contrato de modificadores), nunca `/`. El botón de Más con `data-navx-open-palette` abre la paleta.
- La paleta incluye vistas reales (Panel, Biblioteca, Progreso, Mis subrayados, Dudas, Respaldo), acciones reales (tema, abrir respaldo) y fichas. No añade dependencias.
- Cargar y mostrar fichas relacionadas en `[data-module-mount="reader-related"]` al final de la ficha. Usa primero la evidencia de `related.json` con su motivo textual. Si no hay evidencia, se aprueba un respaldo estructural factual: hasta 3 fichas del mismo tema y, si el tema solo tiene una, de la misma categoría, con motivo «Comparten el tema: …» o «Comparten la categoría: …». No inventes contenido clínico; si no hay ninguna otra ficha ni motivo, oculta el bloque. La carga de `related.json` es bajo demanda.
- No cargar `glossary.js`/`sources.js` en esta fase.
- CSS solo en `css/nav.css` bajo `.navx-*`. La integración puede añadir/retirar clases `.navx-*` y espaciado con una clase propia.

## 7. Ruta de hoy inicial (Agente 4)

Archivo de integración obligatorio: `js/plan/today.integration.js`.

Debe:
- Registrarse como módulo `today` y llenar `[data-module-mount="today-route"]` solo en `route.name === "home"` (y limpiar al salir).
- Ser un contenedor reutilizable en `StudyPlanToday` (por ejemplo `render(container, context)`), sin rutas nuevas ni plan persistente todavía.
- Combinar datos reales: siguiente/pendientes del recorrido, dudas abiertas y tarjetas vencidas, con tiempo estimado y una razón. Si falta una señal, no inventarla.
- Respetar el presupuesto diario si existe; en Fase 1 no se edita el plan.
- Estados vacío (sin actividad) y no configurado; enlaces operativos a ficha, dudas o repaso de Flashcards.
- No cargar `plan-model.js` completo al arrancar si eso infla la portada; puede hacer una agregación ligera y documentada o cargarlo después del primer render. La lógica completa del modelo se integra en Fase 2.
- CSS en `css/plan.css` bajo `.plan-*`.
- Un `h2`/landmark accesible y botones/enlaces con foco visible; no crear una rejilla de tarjetas vacías.

## 8. QA (Agente 6)

- Añadir pruebas DASH-18 en adelante en `tests/e2e/suites/dash-fase1.mjs` y enlazarlas en `run.mjs`.
- Cubrir: ruta subrayados/dudas, creación y persistencia de subrayado/nota, tarjeta propia, pausa de recuerdo con interruptor, modo recordar, confianza, búsqueda del cuerpo con índice lazy, foco, filtro por área, fragmento, paleta Ctrl+K, índice/scrollspy, relacionadas y contador del Panel.
- Mantener verdes DASH-01…17 y FLASH-01…09.
- Revisar axe/contraste/capturas en ambos temas y 6 viewports, incluyendo estados abiertos (barra, hoja, paleta, búsqueda con resultados).
- Los estilos de layout de la app siguen siendo suyos; los CSS de módulos pertenecen a sus dueños. Los defectos de esos CSS se reportan por `docs/PEDIDOS.md` y se resuelven con el dueño antes del cierre.
- No marcar PASS una función que no esté integrada. Reportar el fallo con selector y ruta.

---

## 9. Criterios de aceptación de Fase 1

1. Las acciones de lectura activa persisten tras refrescar y no tocan las cajas de Flashcards.
2. Los subrayados se anclan a ficha/sección/párrafo y los huérfanos son visibles y recuperables.
3. La pausa de recuerdo se puede apagar y ajustar; no aparece sin tarjeta real.
4. La búsqueda en el cuerpo no descarga el índice al arrancar; encuentra texto sin acentos y resalta el fragmento.
5. La paleta y el índice son operables con teclado y no atrapan el foco de forma incorrecta.
6. Las fichas relacionadas enlazan a fichas existentes y muestran un motivo textual.
7. El Panel muestra una Ruta de hoy inicial con datos reales; no hay métricas inventadas.
8. DASH-01…17, FLASH-01…09 y los nuevos DASH de Fase 1 pasan; axe 0 violaciones; capturas en ambos temas.
9. La carga inicial no incorpora los índices derivados. Cualquier aumento de código/estilos se mide y se informa.

---

© 2026 ZARCONT — Documento interno del proyecto.
