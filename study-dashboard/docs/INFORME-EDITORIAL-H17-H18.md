# Informe editorial · H17 y H18

**Proyecto:** Study Dashboard 2.3.0 · SERUMS STUDY  
**Fase:** 4 (aprobada) — cierre editorial  
**Fecha:** 10 de noviembre de 2026, 09:10 (America/Lima)  
**Autor:** Agente 8 · análisis y documentación editorial  
**Snapshot observado:** `study-dashboard/app.js` (1.938 líneas), `study-shared/store.js` (2.570 líneas), `study-data/temario.js` (2.587.623 B), `study-shared/taxonomy.js` (437 líneas), `index.html` del HUB e `informe/INFORME-STUDY-DASHBOARD.md`.  
**Alcance:** H17 (conteo editorial de «86 módulos») y H18 (dos fuentes declaradas sin cita en fichas). No se edita producto, contenido clínico ni datos.

> **Regla de alcance.** Este documento no modifica `app.js`, `store.js`, `temario.js`, HTML, CSS, tests ni contenido clínico. Las ubicaciones y los copys son una propuesta editorial para que los aplique el dueño de cada archivo. Los números de línea corresponden al snapshot indicado; si un archivo cambia, localizar la cadena citada, no confiar solo en el número.

---

## 1. Resumen ejecutivo

- La fuente canónica declara **48 fuentes, 86 temas, 210 fichas y 630 tarjetas**. De los 86 temas, **1 es contenedor** (`topic-psi-ci-2`) y **85 son temas con contenido propio**. El contenedor agrupa **22 fichas oficiales**; las otras **188 fichas** cuelgan de los 85 temas.
- **86** es correcto como *registro de tema*, no como *módulo visible*. La biblioteca muestra **107 entradas** (85 bloques de tema + 22 fichas oficiales), y el total de fichas sigue siendo **210** (188 + 22). La etiqueta editorial de H17 es **«85 temas + 22 fichas oficiales»**, siempre junto a **210 fichas** para no perder el total.
- En el snapshot, H17 está aplicado en el producto: `StudyStore.getDashboardStats().totalTopics` cuenta 85, las vistas muestran «85 temas + 22 fichas oficiales · 210 fichas» y el HUB dice «85 temas». No queda ningún «86» ni ningún «módulo» del temario visible en la app. Lo pendiente es la **documentación** que todavía dice «86 módulos» y un refinamiento opcional del hero.
- H18 está comprobado: **46/48 fuentes** aparecen en `sourceRefs` de fichas (254 referencias; 210/210 fichas con al menos una). Las dos no citadas son `src-psico-temario` (temario oficial; función estructural) y `src-nutricion-ninos-anterior` (acto resolutivo de la guía anterior). Ambas están referenciadas en `sourceIds` de áreas/temas, no en fichas. Se documentan como fuentes de estructura o antecedente; **no se añaden citas ni contenido**.

---

## 2. Conteo comprobado

### 2.1 Método

Se cargaron `study-data/temario.js` y `study-shared/taxonomy.js` en Node.js 26.13.0, sin navegador. `taxonomy.js` es necesario porque `isContainer` no está en el archivo canónico: se asigna al aplicar la taxonomía. El script de reproducción está en el Anexo A.

### 2.2 Cifras verificadas

| Métrica | Valor | Cómo se obtiene |
|---|---:|---|
| Fuentes declaradas | **48** | `sources.length` |
| Fuentes referenciadas en fichas | **46** | `sourceRefs[].sourceId` únicos |
| Fuentes sin referencia en fichas | **2** | `src-nutricion-ninos-anterior`, `src-psico-temario` |
| Referencias de fuente totales | **254** | suma de `sourceRefs` |
| Fichas | **210** | `sheets.length` |
| Fichas con al menos una referencia | **210** | 0 fichas sin `sourceRefs` |
| Temas registrados | **86** | `topics.length` |
| Temas contenedores | **1** | `topic-psi-ci-2` |
| Temas con contenido propio | **85** | 86 − 1 |
| Fichas del contenedor | **22** | fichas con `topicId = topic-psi-ci-2` |
| Fichas bajo temas con contenido propio | **188** | 210 − 22 |
| Entradas de biblioteca | **107** | 85 bloques de tema + 22 fichas oficiales |
| Categorías | **20** | `taxonomy.categories` |
| Áreas primarias | **5** | `taxonomy.primaryAreas` |

### 2.3 Descomposición correcta

```
86 registros de tema
├── 85 temas con contenido propio ─────────────── 188 fichas
└── 1 contenedor (topic-psi-ci-2) ────────────── 22 fichas oficiales
                                                  ─────────────
Total de fichas: 188 + 22 = 210
Entradas de biblioteca: 85 bloques + 22 fichas = 107
```

Reglas de lectura que deben respetar todos los copys:

1. **`85 + 22 = 107` entradas de biblioteca**, no 210 fichas.
2. **210 fichas incluye las 22 oficiales**; nunca sumar 85 + 22 + 210.
3. **86** solo se escribe como «86 registros de tema», nunca como «86 módulos» ni «86 temas visibles».
4. **62** era el conteo antiguo del Área II (61 temas + el contenedor). El objetivo es **61 temas + 22 fichas oficiales**.
5. Las 22 oficiales **no forman un tema nuevo** ni se reparten en 22 temas: se agrupan por categoría en la biblioteca.

### 2.4 Distribución por área

| Área | Categorías | Temas | Fichas oficiales | Fichas |
|---|---:|---:|---:|---:|
| I · Salud pública | 3 | 15 | 0 | 43 |
| II · Cuidado integral de salud | 8 | 61 | 22 | 135 |
| III · Ética e interculturalidad | 2 | 2 | 0 | 9 |
| IV · Investigación | 3 | 3 | 0 | 7 |
| V · Gestión de servicios de salud | 4 | 4 | 0 | 16 |
| **Total** | **20** | **85** | **22** | **210** |

### 2.5 Dónde están las 22 fichas oficiales

| Categoría | Temas | Fichas oficiales | Fichas |
|---|---:|---:|---:|
| Atención primaria y modelo de cuidado | 7 | 2 | 14 |
| Gestación, infancia y adolescencia | 13 | 4 | 26 |
| Adultez, vejez, crónicas y nutrición | 12 | 8 | 26 |
| Prevención y detección temprana | **0** | **4** | **4** |
| ITS, VIH, hepatitis y transmisión vertical | 8 | 3 | 16 |
| Seguridad del paciente e IAAS | 4 | 1 | 9 |

La categoría **Prevención y detección temprana** tiene 0 temas y 4 fichas oficiales. Es el caso límite que rompe un resumen que diga solo «0 temas · 4 fichas»; el copy correcto debe nombrar las fichas oficiales.

### 2.6 Regla del contenedor

`study-data/temario.js` **no** marca el contenedor con una bandera. La regla vive en `study-shared/taxonomy.js:328`:

```js
var isContainer = topic.id === "topic-psi-ci-2";
...
topic.isContainer = isContainer;
```

Por eso:

- el conteo verificado depende de ese ID y de que `StudyTaxonomy.apply()` se ejecute antes de leer `totalTopics`;
- `temario.js` conserva sus **86 temas** y sus **210 fichas** sin cambios; no se debe «cuadrar» el número tocando datos;
- si en el futuro cambia el ID o aparece otro contenedor, hay que recalcular y actualizar la taxonomía, no el copy.

---

## 3. H17 · Ubicaciones y copys a corregir

### 3.1 Inventario de producto (snapshot 09:10)

Leyenda: **Aplicado** = ya muestra el conteo correcto en el snapshot; **Patrón** = implementación ya correcta que sirve de referencia; **No tocar** = «módulo» técnico ajeno al temario.

| # | Archivo:línea | Qué muestra ahora | Estado | Acción |
|---:|---|---|---|---|
| 1 | `study-dashboard/app.js:965` | Hero: «85 temas y 210 fichas (22 oficiales)» | Aplicado | Refinamiento opcional: «22 son fichas oficiales del temario». |
| 2 | `study-dashboard/app.js:991` | Aside: «`startedTopics` de 85 temas iniciados» | Aplicado | Ninguna; `startedTopics` ya excluye el contenedor. |
| 3 | `study-dashboard/app.js:1001` | Cifras: «20 categorías · 85 temas + 22 fichas oficiales · 210 fichas» | Aplicado | Ninguna. |
| 4 | `study-dashboard/app.js:1053` | Biblioteca: «85 temas y 210 fichas; 22 son fichas oficiales…» | Aplicado | Ninguna; el 22 ya se deriva. |
| 5 | `study-dashboard/app.js:886` | Tarjeta de área II: «61 temas + 22 fichas oficiales · 135 fichas» | Aplicado | Ninguna. |
| 6 | `study-dashboard/app.js:1255` | Cabecera de área II: «8 categorías · 61 temas + 22 fichas oficiales · 135 fichas» | Aplicado | Ninguna. |
| 7 | `study-dashboard/app.js:1288-1300` | Resumen de biblioteca con `topicCount` + `officialCount`; Prevención: «4 fichas oficiales» | Aplicado | Ninguna; el caso 0 temas + 4 oficiales ya está resuelto. |
| 8 | `study-shared/store.js:1338` | `totalTopics: content().topics.filter(...!isContainer).length` | Aplicado | Ninguna. |
| 9 | `study-shared/store.js:1289-1303` | `startedTopics` y `completedTopics` excluyen contenedor | Aplicado | Ninguna. |
| 10 | `study-shared/store.js:1304-1307` | `totalOfficialSheets` derivado del contenedor | Aplicado | Ninguna. |
| 11 | `ZARCONT SERUMS/index.html:1389` (HUB) | HUB: `<li>85 temas</li>` | Aplicado | Ninguna. |
| 12 | `study-dashboard/app.js:371-374` | `categoryMeta`: «12 temas + 8 fichas oficiales · 26 fichas» | Patrón | Es el patrón que siguen las demás vistas; no cambiar. |
| 13 | `study-dashboard/app.js:840-863` | `compileAreaStats` separa `modules` y `official` | Aplicado | Ninguna. |
| 14 | `study-shared/store.js:1376-1395` | `getRecommendations` excluye el contenedor | Aplicado | Ninguna. |
| 15 | `study-dashboard/app.js:57`, `:1855` | «módulos y atajos», «módulos compartidos de Study» | No tocar | Son módulos de JavaScript, no temas del temario. |

**Conclusión de producto:** en el snapshot no queda ningún «86» ni ningún «módulo» del temario visible en `app.js` ni en el HUB. **H17 está aplicado en producto**: 85 temas, 22 fichas oficiales y 210 fichas. Lo pendiente es la documentación de §3.3 y, opcionalmente, explicitar «fichas oficiales» en el hero.

`study-dashboard/index.html` no contiene copy de conteo; el único «86 módulos» del HUB estaba en `ZARCONT SERUMS/index.html:1389` y ya dice «85 temas».

### 3.2 Copys exactos: objetivo y estado

#### Fórmula canónica

- **Etiqueta H17:** `85 temas + 22 fichas oficiales`
- **Con total:** `85 temas + 22 fichas oficiales · 210 fichas`
- **Compacta:** `85 temas · 210 fichas (22 oficiales)`
- **Frase:** `85 temas y 210 fichas; 22 son fichas oficiales del temario.`

No usar: `86 módulos`, `86 temas`, `85 temas + 22 fichas` sin las 210, ni `85 + 22 = 107 fichas`.

#### Línea de cifras (`app.js:1001`)

Aplicado:

```js
'<span class="s-small s-muted">20 categorías · ' + st.totalTopics + ' temas + ' + st.totalOfficialSheets + ' fichas oficiales · ' + st.totalSheets + ' fichas</span>',
```

Resultado renderizado: **«20 categorías · 85 temas + 22 fichas oficiales · 210 fichas»**.

#### Hero (`app.js:965`)

Actual: «85 temas y 210 fichas (22 oficiales)». Es correcto; refinamiento opcional, no bloqueante:

```js
: "Las cinco áreas oficiales de Psicología organizan " + st.totalTopics + " temas y " + st.totalSheets + " fichas; " + st.totalOfficialSheets + " son fichas oficiales del temario. Entra por el área que necesitas y avanza por sus categorías.";
```

#### Descripción de biblioteca (`app.js:1053`)

Aplicado; el 22 ya se deriva:

```js
"Las cinco áreas oficiales de Psicología organizan 20 categorías, " +
C.topics.filter(function (t) { return !t.isContainer; }).length + " temas y " +
C.sheets.length + " fichas; " +
C.sheets.filter(function (s) {
  var t = C.topicById && C.topicById[s.topicId];
  return !!(t && t.isContainer);
}).length + " son fichas oficiales del temario. Entra por un área, recorre sus categorías y abre la ficha que necesites.";
```

#### Tarjeta y cabecera de área (`app.js:886` y `:1255`)

Aplicado (requiere que `compileAreaStats` devuelva `official`):

```js
'<span class="area-meta">' + a.modules + ' temas' +
  (a.official ? ' + ' + a.official + ' fichas oficiales' : '') +
  ' · ' + a.sheets + ' fichas</span>' +
```

```js
'<span class="library-area-meta">' + as.categories + ' categorías · ' +
  as.modules + ' temas' +
  (as.official ? ' + ' + as.official + ' fichas oficiales' : '') +
  ' · ' + as.sheets + ' fichas</span>' +
```

Resultado para el Área II: **«8 categorías · 61 temas + 22 fichas oficiales · 135 fichas»**. Para las demás áreas, sin el tramo de oficiales.

#### Resumen de biblioteca (`app.js:1288-1300`)

Aplicado. La implementación cuenta las fichas del contenedor en cualquier grupo y arma el encabezado por partes:

```js
var officialCount = 0;
groups.forEach(function (g) {
  g.sheets.forEach(function (sheet) {
    var topic = C.topicById && C.topicById[sheet.topicId];
    if (topic && topic.isContainer) officialCount += 1;
  });
});

var headParts = [];
if (topicCount) headParts.push('<b>' + topicCount + '</b> ' + plural(topicCount, "tema", "temas"));
if (officialCount) headParts.push('<b>' + officialCount + '</b> ' + plural(officialCount, "ficha oficial", "fichas oficiales"));
var head = headParts.length ? headParts.join(" + ") : "0 temas";
if (sheetCount !== officialCount || topicCount) head += " · <b>" + sheetCount + "</b> " + plural(sheetCount, "ficha", "fichas");
```

Resultados:

- Todas: **«85 temas + 22 fichas oficiales · 210 fichas»**.
- Categoría con 12 temas y 8 oficiales: **«12 temas + 8 fichas oficiales · 26 fichas»**.
- Prevención: **«4 fichas oficiales»** (sin repetir «4 fichas»).
- Búsqueda sin oficiales: **«5 temas · 10 fichas»**.

#### Recomendación del contenedor (`store.js:1376-1395`)

Aplicado: `started` y `unstarted` ya excluyen `t.isContainer`, así que el contenedor no aparece como «Empieza por Subárea 2…» ni «Retoma Subárea 2…».

### 3.3 Documentación a corregir

`informe/INFORME-STUDY-DASHBOARD.md` es el informe de la versión observada el 9 de noviembre. Si se reemite como estado actual, aplicar estos cambios; si se conserva como informe histórico, añadir la nota de cierre y no reescribir las mediciones.

| Archivo:línea | Actual | Propuesto |
|---|---|---|
| `informe/INFORME-STUDY-DASHBOARD.md:25` | «5 áreas, 20 categorías, 86 módulos, 210 fichas…» | «5 áreas, 20 categorías, 85 temas + 22 fichas oficiales, 210 fichas y 630 tarjetas…» |
| `informe/INFORME-STUDY-DASHBOARD.md:146` | «categorías, módulos, fichas y barra de progreso» | «categorías, temas, fichas y barra de progreso» |
| `informe/INFORME-STUDY-DASHBOARD.md:169` | «sus módulos o fichas oficiales» | «sus temas o fichas oficiales» |
| `informe/INFORME-STUDY-DASHBOARD.md:176` | «Resumen dinámico de módulos, fichas…» | «Resumen dinámico de temas y fichas oficiales…» |
| `informe/INFORME-STUDY-DASHBOARD.md:177` | «Módulos plegables» | «Temas plegables» |
| `informe/INFORME-STUDY-DASHBOARD.md:243` | «veinte categorías y ochenta y seis módulos» | «veinte categorías y ochenta y cinco temas con contenido propio, más un contenedor de veintidós fichas oficiales» |
| `informe/INFORME-STUDY-DASHBOARD.md:247` | `tema / módulo (86: 85 temas + 1 contenedor)` | `tema (86 registros: 85 temas + 1 contenedor) → 107 entradas de biblioteca (85 temas + 22 fichas oficiales)` |
| `informe/INFORME-STUDY-DASHBOARD.md:258-265` | Tabla «Módulos (UI)» con total 86 | Columnas «Temas», «Fichas oficiales», «Fichas»; totales 85 temas, 22 oficiales y 210 fichas |
| `informe/INFORME-STUDY-DASHBOARD.md:267` | «los 86 “módulos” de la interfaz… Área II muestra 62 módulos» | Ver párrafo exacto abajo |
| `informe/INFORME-STUDY-DASHBOARD.md:304` | «Temas / módulos · 86 (85 + 1 contenedor)» | «Temas (sin contenedor) · 85» + «Fichas oficiales · 22» |
| `informe/INFORME-STUDY-DASHBOARD.md:398` | «Módulos plegables y fichas oficiales» | «Temas plegables y fichas oficiales» |
| `informe/INFORME-STUDY-DASHBOARD.md:524` | «`details`/`summary` nativos para los módulos» | «…para los temas» (opcional; es descripción de UI) |
| `informe/INFORME-STUDY-DASHBOARD.md:619` | «5 módulos, 10 fichas…» | «5 temas, 10 fichas…» |
| `informe/INFORME-STUDY-DASHBOARD.md:678` | H17: «“86 módulos” incluye 1 contenedor…» | Ver fila H17 exacta abajo |
| `informe/INFORME-STUDY-DASHBOARD.md:338-343` | Dos fuentes «no referenciadas» sin explicar su papel | Ver §4.4 de este documento |
| `informe/INFORME-STUDY-DASHBOARD.md:679` | H18: «Citar o retirar del catálogo» | «Documentar como estructura/antecedente; no añadir citas» |

Párrafo exacto para `:267`:

> **Matiz de conteo:** el temario conserva 86 registros de tema: 85 temas con contenido propio y 1 tema contenedor (`topic-psi-ci-2`). El contenedor no se muestra como bloque de tema; aporta 22 fichas oficiales que la biblioteca agrupa por categoría. Por eso la interfaz muestra 107 entradas de biblioteca (85 bloques de tema + 22 fichas oficiales), pero el total de fichas sigue siendo 210 (188 + 22) y el de temas visibles, 85.

Fila H17 exacta para `:678`:

> `| H17 | Info | «86 módulos» contaba 1 contenedor | 85 temas + 22 fichas oficiales (107 entradas); 210 fichas | Etiquetar «85 temas + 22 fichas oficiales · 210 fichas» y no usar «86 módulos» |`

Fila H18 exacta para `:679`:

> `| H18 | Info | 2 fuentes declaradas sin cita en fichas | 46/48 con sourceRefs; 2 de estructura | Documentar como estructura/antecedente; no añadir citas (ver H18: observación editorial) |`

`AUTORIA.md` también usa el conteo visible:

| Archivo:línea | Actual | Propuesto |
|---|---|---|
| `AUTORIA.md:30` | «20 categorías, 86 módulos, 210 fichas» | «20 categorías, 85 temas + 22 fichas oficiales, 210 fichas» |
| `AUTORIA.md:42` | «20 categorías, 86 módulos, 210 fichas» | «20 categorías, 85 temas + 22 fichas oficiales, 210 fichas» |
| `AUTORIA.md:108` | «20 categorías, 86 módulos, 210 fichas» | «20 categorías, 85 temas + 22 fichas oficiales, 210 fichas» |

`informe/INFORME-STUDY-DASHBOARD.html` y `.pdf` se generan desde el Markdown: **regenerar**, no editar a mano. Las líneas equivalentes del HTML son 122, 439, 453, 460, 509, 511, 567, 573, 725-726, 903, 1084, 1328, 1521-1523; el PDF no admite referencias por línea.

### 3.4 No tocar (falsos positivos)

- `app.js:57` («módulos y atajos») y `app.js:1836` («módulos compartidos de Study»): módulos de JavaScript.
- `informe/INFORME-STUDY-DASHBOARD.md:384` («módulos ES») y `:444` («módulos compartidos»): técnica, no temario.
- `study-data/temario.js`: los **86 temas** son el dato canónico; no se cambia el contenido para que el copy cuadre.
- `study-shared/taxonomy.js:328`: la regla del contenedor es la fuente de verdad; no es copy.
- `tests/data/content-split.test.js:179` (`core.topics.length === 86`): comprueba el dato, es correcto; no cambiar el número.
- `tests/e2e/suites/content.mjs:12,45`: la etiqueta «86 módulos» y la aserción de 86 temas son de datos; si se toca, cambiar solo la etiqueta a «86 temas (1 contenedor)», no la aserción.
- `study-data/audit/*`: los informes históricos dicen «86 temas» como dato; es correcto. Solo añadir «(1 contenedor)» si se reemiten. `INFORME-REORGANIZACION-5-AREAS.md:94` ya explica las 107 entradas.

---

<a id="h18-observacion-editorial"></a>

## 4. H18: observación editorial

### H18.1 Qué se comprobó

De las **48 fuentes declaradas**, **46** aparecen al menos una vez en `sourceRefs` de alguna ficha; hay **254 referencias** y **210/210 fichas** tienen al menos una. Las **2** fuentes que no aparecen en fichas son:

| Fuente | Qué es | Referencia estructural | Fichas que la citan |
|---|---|---|---:|
| `src-psico-temario` | Temario oficial del SERUMS 2026-II para Psicología; 3 páginas. Define temas y subtemas, no desarrolla contenido. | `sourceIds` de 5 áreas primarias y 14 temas (incluido el contenedor). | **0** |
| `src-nutricion-ninos-anterior` | Acto resolutivo de aprobación de la guía anterior de valoración nutricional de la niña y el niño de 0 a 11 años; 69 páginas. Su contenido temático se desarrolla en la guía 2025. | `sourceIds` del área heredada `area-nutricion`. | **0** |

Ubicaciones de los dos IDs en el snapshot:

| Archivo:línea | Contenido |
|---|---|
| `study-data/temario.js:202-210` | Declaración de `src-nutricion-ninos-anterior` (con `notes` y `provenance`). |
| `study-data/temario.js:392-399` | Declaración de `src-psico-temario` (temario oficial). |
| `study-data/temario.js:597` | `sourceIds` del área heredada `area-nutricion`. |
| `study-data/temario.js:679, 691, 703, 715, 727` | `sourceIds` de las 5 áreas primarias de Psicología. |
| `study-data/temario.js:1845, 1869, 1892, 1911, 1935, 1963, 1983, 2002, 2021, 2037, 2053, 2070, 2091, 2111` | `sourceIds` de los 14 temas de Psicología (incluido el contenedor). |
| `informe/INFORME-STUDY-DASHBOARD.md:338-343` | Bullets del informe que mencionan ambas fuentes. |
| `informe/INFORME-STUDY-DASHBOARD.html:834-835` | Versión HTML de esos bullets. |
| `docs/CONTRATOS-FASE4.md:82-83` | Definición de H18 en el contrato de Fase 4. |
| `study-data/audit/cobertura-fuentes.csv:23` | Fila de cobertura de la guía anterior (0 temas, 0 fichas, 0 tarjetas). |

Ninguno de esos usos es un `sourceRefs` de ficha; son declaraciones o referencias estructurales.

### H18.2 Por qué no citan fichas

- **`src-psico-temario` no es una fuente de contenido:** es el índice oficial que define el mapa de temas y subtemas. Las 92 fichas de Psicología se apoyan en las cinco síntesis `src-psi-*` (93 referencias; una ficha cita dos) y en fuentes clínicas cuando corresponde. Añadir el temario a `sourceRefs` sugeriría un respaldo textual que el PDF de 3 páginas no tiene; sería una cita falsa.
- **`src-nutricion-ninos-anterior` no aporta temas distintos:** es el acto administrativo que aprobó la versión anterior de la guía. La guía vigente `src-nutricion-ninos` (2025; 88 páginas) es la que citan las 6 fichas de nutrición infantil. Duplicar la cita en esas fichas atribuiría el contenido a un acto resolutivo y repetiría la misma materia; `study-data/audit/cobertura-fuentes.csv:23` ya registra 0 temas, 0 fichas y 0 tarjetas para esa fuente, con la nota `"Acto normativo, sin duplicacion"`.

Ninguna de las dos es una fuente «huérfana»: ambas están referenciadas en la estructura (`sourceIds`). Lo que no tienen es cita de ficha.

### H18.3 Cómo documentarlas sin falsas citas

Usar tres estados distintos y no mezclarlos:

| Estado | Definición | `src-psico-temario` | `src-nutricion-ninos-anterior` |
|---|---|---|---|
| **Declarada** | Está en `sources` de `temario.js`. | Sí | Sí |
| **Referenciada en ficha** | Aparece en algún `sourceRefs` de ficha. | No | No |
| **Estructural** | Aparece en `areas[].sourceIds` o `topics[].sourceIds`, pero no en fichas. | Sí: 5 áreas y 14 temas | Sí: 1 área heredada |

Reglas de edición:

1. **No añadir `sourceRefs`** a ninguna ficha para «cerrar» H18. No hay relación clínica ni página que citar y sería inventarla.
2. **No retirar las fuentes del catálogo.** Conservan la trazabilidad del temario oficial y del antecedente normativo; el contrato de Fase 4 pide documentarlas, no eliminarlas.
3. **No llamarlas «no usadas».** El texto correcto es «fuente de estructura, no citada en fichas» o «antecedente normativo, no citado en fichas».
4. **No mostrar un enlace «Ver en ficha»** si algún día se añade un catálogo de fuentes: no hay ficha de destino. Se puede mostrar «0 fichas» solo con la etiqueta «fuente de estructura».
5. **No tocar `temario.js`.** Su `provenance` y sus `notes` ya explican el papel de ambas fuentes; son la evidencia primaria.
6. **Documentación futura opcional (no aplicada):** si el dueño de datos quiere hacerlo explícito en el esquema, añadir campos aditivos como `catalogRole: "estructura" | "antecedente"` y `citationPolicy: "no-cita"`; requiere decisión de Agente 2 y no forma parte de este cierre. La UI no cambia por ello.

### H18.4 Copy para el informe final

Texto listo para reemplazar los dos bullets de `INFORME-STUDY-DASHBOARD.md:338-343`:

> Dos fuentes declaradas no aparecen en `sourceRefs` de ninguna ficha; no son citas de contenido:
>
> - `src-psico-temario`: temario oficial del SERUMS 2026-II para Psicología (3 páginas). Define los temas y subtemas; lo referencian 5 áreas y 14 temas en `sourceIds`. No desarrolla el contenido que sintetizan las fichas.
> - `src-nutricion-ninos-anterior`: acto resolutivo de aprobación de la guía anterior (69 páginas). Lo referencia el área heredada `area-nutricion`; su contenido temático se desarrolla en la guía 2025 `src-nutricion-ninos`, citada por 6 fichas.
>
> Las 92 fichas de Psicología se apoyan en las cinco síntesis `src-psi-*` (93 referencias; una ficha cita dos). Las otras 46 fuentes sí aparecen en fichas. Ver [H18: observación editorial](../docs/INFORME-EDITORIAL-H17-H18.md#h18-observacion-editorial).

### H18.5 Enlace desde el informe final

En `informe/INFORME-STUDY-DASHBOARD.md`, junto al apartado 5.5 o a la fila H18 de la tabla de hallazgos, añadir:

```md
> **H18: observación editorial.** Las dos fuentes sin cita se documentan, sin añadir citas, en [H18: observación editorial](../docs/INFORME-EDITORIAL-H17-H18.md#h18-observacion-editorial).
```

El ancla estable es `#h18-observacion-editorial` y está declarada con `<a id="h18-observacion-editorial"></a>` antes del encabezado `## 4. H18: observación editorial`; no cambiar el ancla sin actualizar los enlaces.

---

## 5. Riesgos y supuestos

1. **Snapshot y edición concurrente.** `app.js` y `store.js` cambiaron durante el análisis (H17 se estaba aplicando). Los números de línea son del snapshot 09:10 y pueden desplazarse; usar las cadenas citadas para localizar. La comprobación final de la UI corresponde a QA.
2. **El contenedor no está en el dato canónico.** `topic-psi-ci-2` se marca en `taxonomy.js:328`, no en `temario.js`. Si cambia el ID, el conteo de 85/22 deja de ser válido en silencio. Verificar con el script del Anexo A después de cualquier cambio de contenido.
3. **`startedTopics` y `completedTopics` deben excluir el contenedor.** Ya lo hacen en el snapshot. Si se cambiara solo `totalTopics` y no estos dos, podría aparecer «86 de 85 temas iniciados». Si un usuario solo lee fichas oficiales, el aside puede decir «0 de 85 temas iniciados»: no es falso, pero el avance de esas 22 fichas se ve en la biblioteca.
4. **La categoría con 0 temas.** «Prevención y detección temprana» tiene 0 temas y 4 fichas oficiales; cualquier resumen que imprima solo temas dirá «0 temas». Es el caso que obliga a nombrar las fichas oficiales.
5. **`totalOfficialSheets` es aditivo.** No rompe el esquema de estado ni el snapshot del HUB; las pruebas consultadas no comparan la forma completa de `getDashboardStats`. Si alguna prueba futura lo hace, actualizarla.
6. **Recomendaciones.** `getRecommendations` ya excluye el contenedor en el snapshot. Mantener ese filtro: sin él, el contenedor puede aparecer como «Empieza por Subárea 2…» y confundirse con un tema.
7. **H18 no es «citar o retirar».** Las dos fuentes son estructurales; retirarlas perdería trazabilidad y añadirlas a fichas inventaría respaldo. La única acción correcta es documentar su papel.
8. **`src-nutricion-ninos-anterior` tiene `kind: "Guía de práctica clínica"` aunque es un acto resolutivo.** El `short`, el `provenance` y las `notes` lo aclaran; no se cambia el dato en esta fase. Si se reemite el catálogo, considerar un `kind` más preciso.
9. **Las 22 oficiales no se convierten en temas.** No crear 22 temas nuevos ni mover `topicId` de las fichas: cambiaría el progreso y el contenido, y está fuera de alcance.
10. **Los conteos son de la copia local.** No se validó contra el PDF original ni contra el portal del SERUMS; se usó la metadata y el contenido declarado en `temario.js`, más la auditoría existente para el número de páginas.

---

## 6. Anexo A · Reproducción del conteo

Desde la raíz del repositorio:

```js
global.window = global;
require("./study-data/temario.js");
require("./study-shared/taxonomy.js");

const C = window.STUDY_CONTENT;
const containers = C.topics.filter(t => t.isContainer);
const official = C.sheets.filter(s => containers.some(t => t.id === s.topicId));
const cited = new Set();
C.sheets.forEach(s => (s.sourceRefs || []).forEach(r => cited.add(r.sourceId)));
const uncited = C.sources.filter(s => !cited.has(s.id));

console.log({
  sources: C.sources.length,
  topics: C.topics.length,
  containers: containers.length,
  nonContainer: C.topics.length - containers.length,
  officialSheets: official.length,
  sheets: C.sheets.length,
  sourceRefs: C.sheets.reduce((n, s) => n + (s.sourceRefs || []).length, 0),
  citedSources: C.sources.length - uncited.length,
  uncited: uncited.map(s => s.id)
});
```

Salida verificada:

```json
{
  "sources": 48,
  "topics": 86,
  "containers": 1,
  "nonContainer": 85,
  "officialSheets": 22,
  "sheets": 210,
  "sourceRefs": 254,
  "citedSources": 46,
  "uncited": ["src-nutricion-ninos-anterior", "src-psico-temario"]
}
```

---

## 7. Cierre

- **H17:** el conteo está comprobado y el producto ya muestra la etiqueta **«85 temas + 22 fichas oficiales · 210 fichas»**; no queda «86 módulos» visible. Para cerrar del todo, actualizar el informe y `AUTORIA.md` (§3.3). No se toca el temario.
- **H18:** las dos fuentes quedan documentadas como estructura/antecedente, con 0 citas en fichas. No se añaden `sourceRefs` ni relaciones clínicas.
- **Siguiente paso:** el Coordinador decide si reemite el informe con los cambios de §3.3 y enlaza `H18: observación editorial`; QA verifica el copy final en la UI.

---

© 2026 ZARCONT — Documento interno del proyecto.
