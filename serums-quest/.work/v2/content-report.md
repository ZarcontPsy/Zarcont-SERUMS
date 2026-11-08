# Informe de contenido V2 — banco pedagógico de Study Dashboard y Study Flashcards

**Agente 4 · SERUMS QUEST V2 · 6 de noviembre de 2026**
Fuente de datos: `study-data/temario.js` (`window.STUDY_CONTENT` v2.5.0), compartido por las apps del HUB.
Salidas: `serums-quest/.work/v2/questions-v2.json`, `serums-quest/.work/v2/explanations-original.json` y este informe.
Sin red, sin generación de imágenes y sin ediciones fuera de los archivos asignados al Agente 4.

---

## 1. Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Fichas (sheets) en el dataset | **210** |
| Tarjetas (cards) en el dataset | **630** (210 concept, 210 multiple, 210 application) |
| Preguntas nuevas normalizadas en `questions-v2.json` | **840** |
| — desde Study Flashcards | **630** (420 cerradas + 210 concept convertidas) |
| — desde Study Dashboard (fichas) | **210** |
| Preguntas de campaña existentes (referencia de deduplicación) | **111** |
| Preguntas nuevas marcadas `generated: true` | **420** (210 concept convertidas + 210 fichas) |
| Preguntas nuevas con explicación generada (`explanationGenerated: true`) | **210** (las 210 de ficha) |
| Explicaciones generadas para las 111 originales | **111** (todas; no tenían explicación) |
| Duplicados eliminados contra la campaña o entre sí | **0** |
| Preguntas descartadas por calidad/mapeo | **0** |
| Muestra de claves verificada contra las fuentes | **37 filas, 37 OK** |
| Comprobaciones automáticas | **13/13 booleanas en verde, 0 errores** |

**Hallazgo principal:** **Study Dashboard no tiene preguntas MCQ**. Su `app.js` no contiene ninguna referencia a `answer`, `options`, `correctIndex`, `pregunta` ni `quiz`; es una app de fichas/temario (rutas `home`, `biblioteca`, `progreso` y `ficha`) que solo lee `STUDY_CONTENT.sheets` y registra progreso de lectura. Por eso las 210 preguntas de origen `dashboard` son **generadas** a partir del texto literal de cada ficha (enunciado + idea clave exacta + distractores exactos de otras fichas del área). Las únicas preguntas MCQ reales del ecosistema STUDY son las 420 tarjetas `multiple`/`application`, que ya traen `options` + `correctIndex` y se integraron tal cual.

---

## 2. Apps localizadas

| App | Ruta | Entrada | Formato de datos | Cómo se carga |
|---|---|---|---|---|
| **Study Dashboard** | `study-dashboard/` (`index.html`, `app.js` 67 742 B, `styles.css`) | `study-dashboard/index.html` | Fichas de estudio (`sheets`): `title`, `kicker`, `summary`, `keyConcepts[]`, `sections[]`, `sourceRefs[]`. **No hay MCQ.** | `<script src="../study-data/temario.js?v=2.5.0">` → `taxonomy.js` → `icons.js` → `ui.js` → `store.js` → `serums-chrome.js` → `app.js`. `app.js` toma `window.STUDY_CONTENT`, lo enriquece con `StudyTaxonomy` y navega por hash (`#/`, `#/biblioteca`, `#/ficha/<id>`, `#/progreso`). |
| **Study Flashcards** | `study-flashcards/` (`index.html`, `app.js` 85 373 B, `styles.css`) | `study-flashcards/index.html` | Tarjetas (`cards`): `prompt`, `answer`, `explanation`, `tags`, `sourceRefs`; las de tipo `multiple`/`application` añaden `options[4]` + `correctIndex`. | Mismo orden de `script` que el dashboard. `app.js` arma mazos por ficha o tema (`C.cards.filter(...)`), modos `free`, `quick`, `exam` y `errors`; el modo examen usa solo `multiple` + `application` (`app.js:207`). |

Ambas apps entran desde el HUB raíz (`index.html`, tarjetas `data-app="dashboard"` y `data-app="flashcards"`). El dataset es el mismo archivo para las dos, de modo que cualquier corrección de contenido las afecta por igual.

**Formato del dataset (v2.5.0):** objeto global `window.STUDY_CONTENT` con `version`, `meta`, `sources` (48), `areas` (23), `topics` (86), `sheets` (210) y `cards` (630). `study-shared/taxonomy.js` (v1.0.0) añade en tiempo de ejecución `categoryId`, `primaryAreaId` y `legacyAreaId` a cada tema y ficha, y publica `content.taxonomy` con los conteos por categoría y las incidencias de mapeo (0 incidencias).

---

## 3. Recuento de fuentes del dataset

| Elemento | Total | Detalle |
|---|---|---|
| Fuentes documentales (`sources`) | **48** | 11 guías de práctica clínica, 9 normas técnicas, 6 documentos técnicos, 5 normas técnicas de salud, 5 materiales de estudio, 2 guías técnicas, 2 reglamentos, 1 artículo de revisión, 1 manual, 1 manual de referencia, 1 directiva sanitaria, 1 ley y reglamento, 1 declaración internacional, 1 política nacional, 1 temario oficial |
| Áreas de datos (`areas`) | **23** | 18 heredadas + 5 oficiales del temario de Psicología |
| Temas (`topics`) | **86** | 85 temas + 1 contenedor (`topic-psi-ci-2`, el módulo oficial CI-2 con 21 fichas) |
| Categorías (taxonomía) | **20** | 3 SP + 8 CI + 2 ET + 3 IN + 4 GE |
| Fichas (`sheets`) | **210** | Todas con `summary`, `keyConcepts` (1 231 en total, todos únicos) y `sections`; niveles Base 80, Intermedio 92, Avanzado 38 |
| Tarjetas (`cards`) | **630** | `concept` **210**, `multiple` **210**, `application` **210**. Las 420 cerradas traen `options` de 4 y `correctIndex` válido (0 incidencias detectadas); las 630 traen `explanation` |
| Preguntas de campaña | **111** | 2026-I 47, 2026-II 36, 2025-I 28 (fuente: `serums-quest/src/campaign.json`) |

---

## 4. Mapeo de las 18 áreas heredadas a las 5 oficiales

El mapeo **no es inventado**: sale de `study-shared/taxonomy.js` (`LEGACY_AREA_CATEGORY` → `CATEGORIES` → `areaId`) y se contrastó fila por fila con `study-data/audit/MAPA-MAESTRO-5-AREAS.csv`: **210/210 fichas coinciden** en `area_id` (0 ausentes, 0 discrepancias). Las 5 áreas oficiales también se mapean a sí mismas (`PRIMARY_IDS`).

| Área heredada | Categoría | Área oficial | Fichas |
|---|---|---|---|
| `area-aps` (APS) | `cat-ci-aps` · Atención primaria y modelo de cuidado | `area-psi-cuidado-integral` | 4 |
| `area-mci` (MCI) | `cat-ci-aps` · Atención primaria y modelo de cuidado | `area-psi-cuidado-integral` | 8 |
| `area-audit` (AUDIT) | `cat-ci-mental` · Salud mental, consumo y violencias | `area-psi-cuidado-integral` | 6 |
| `area-materna` (Materna) | `cat-ci-curso` · Gestación, infancia y adolescencia | `area-psi-cuidado-integral` | 6 |
| `area-mental` (Salud mental) | `cat-ci-mental` · Salud mental, consumo y violencias | `area-psi-cuidado-integral` | 6 |
| `area-adulto` (Adulto) | `cat-ci-adulto` · Adultez, vejez, crónicas y nutrición | `area-psi-cuidado-integral` | 8 |
| `area-depresion` (Depresión) | `cat-ci-mental` · Salud mental, consumo y violencias | `area-psi-cuidado-integral` | 8 |
| `area-perinatal` (Perinatal) | `cat-ci-mental` · Salud mental, consumo y violencias | `area-psi-cuidado-integral` | 4 |
| `area-violencia` (Violencia) | `cat-ci-mental` · Salud mental, consumo y violencias | `area-psi-cuidado-integral` | 8 |
| `area-itsvih` (ITS/VIH) | `cat-ci-its` · ITS, VIH, hepatitis y transmisión vertical | `area-psi-cuidado-integral` | 6 |
| `area-hepatitis` (Hepatitis) | `cat-ci-its` · ITS, VIH, hepatitis y transmisión vertical | `area-psi-cuidado-integral` | 4 |
| `area-seguridad-paciente` (Seguridad e IAAS) | `cat-ci-iaas` · Seguridad del paciente e IAAS | `area-psi-cuidado-integral` | 8 |
| `area-nutricion` (Nutrición) | `cat-ci-curso` · Gestación, infancia y adolescencia | `area-psi-cuidado-integral` | 14 |
| `area-promocion` (Promoción) | `cat-sp-promocion` · Promoción de la salud y prevención del daño | `area-psi-salud-publica` | 7 |
| `area-ambiental` (Salud ambiental) | `cat-sp-comunidad` · Salud comunitaria y determinantes ambientales | `area-psi-salud-publica` | 6 |
| `area-materno-neonatal` (Materno-neonatal) | `cat-ci-curso` · Gestación, infancia y adolescencia | `area-psi-cuidado-integral` | 5 |
| `area-cronicas` (Crónicas) | `cat-ci-adulto` · Adultez, vejez, crónicas y nutrición | `area-psi-cuidado-integral` | 5 |
| `area-adolescencia-vih` (Adolescencia y VIH) | `cat-ci-curso` · Gestación, infancia y adolescencia | `area-psi-cuidado-integral` | 5 |

Además, las 5 áreas oficiales aportan sus propias fichas: Salud pública 43, Cuidado integral 135, Ética 9, Investigación 7, Gestión 16 (total 210). Excepciones puntuales del mapeo, ya previstas en `taxonomy.js`: los temas oficiales `topic-psi-*` usan `OFFICIAL_TOPIC_CATEGORY`, y las 21 fichas del contenedor CI-2 usan `CONTAINER_SHEET_CATEGORY`. **No quedó ninguna ficha sin área**.

---

## 5. Método de extracción y normalización

### 5.1 Esquema de salida
Cada objeto de `questions-v2.json` sigue el esquema runtime:

```
id, areaId, stem, options[{id:"A".."D", text}], answer, examTitle, cycle, page,
complexity, confidence, source, origin, explanation, explanationGenerated,
difficulty, tags[], flashcardId?, sheetId?, sourceRefs?, generated
```

`questions-v2.json` es un **arreglo JSON** ordenado por área oficial, luego por origen (`flashcards` antes que `dashboard`) y luego por id. Todos los registros incluyen `sheetId`; los 630 de flashcards incluyen además `flashcardId` y `sourceRefs` de la tarjeta.

Valores de `origin` (procedencia pedagógica): `tarjeta-multiple`, `tarjeta-application`, `tarjeta-concepto-convertida`, `ficha`.
Metadatos derivados: `examTitle` = `Study Flashcards · tarjetas 2.5.0` / `Study Dashboard · fichas 2.5.0`; `cycle` = `study-2.5.0`; `page` = `null` (no hay página de examen para contenido no examinado; las páginas reales del PDF viajan en `sourceRefs`); `complexity` = **18 (base) / 28 (media) / 38 (alta)**, alineado con los valores del contrato runtime (`CONTRACTS.md` §5); `confidence` = `alta` en texto literal, `media` en conversiones.

### 5.2 Flashcards cerradas (420)
`multiple` y `application` se integraron **sin reescribir nada**: `options[0..3]` → letras A–D en el mismo orden de la fuente, `answer` = letra de `correctIndex`, `stem` = `prompt`, `explanation` = `explanation` de la tarjeta (`explanationGenerated: false`), `generated: false`. Se comprobó que las 4 opciones conservan el conjunto exacto de la tarjeta y que la clave coincide con `options[correctIndex]` (420/420 OK).

### 5.3 Flashcards concept (210 → MCQ)
- Correcta: `card.answer` completo si tiene ≤ 260 caracteres; si es más larga, la **primera oración completa** (o el primer tramo de una enumeración cortado en `; `). Siempre es un fragmento **exacto** al inicio de la respuesta de la fuente.
- Distractores: respuestas (con la misma regla de corte) de **otras tarjetas `concept` de la misma área**, con longitud comparable (0,35×–2,8×), similitud Jaccard < 0,55 y misma familia gramatical de enunciado cuando es posible (¿Qué…?, ¿Por qué…?, ¿Cómo…?, Explica…).
- `generated: true` en las 210; `explanation` = la de la tarjeta (`explanationGenerated: false`). **117** respuestas se acortaron a su primera oración o primer tramo (registrado en `agent4-build-stats.json`).

### 5.4 Dashboard: una pregunta de ficha por sheet (210)
No existiendo MCQ en la app, se generó **una pregunta por ficha** con texto literal exclusivamente:
- Enunciado: `Según la ficha «<title>», ¿cuál de estas ideas clave le corresponde?`
- Correcta: un `keyConcept` **exacto** de esa ficha, elegido como el más distintivo (menor solapamiento con los `keyConcepts` de las demás fichas del área, sin aparecer literalmente en otra ficha y sin repetirse entre preguntas).
- Distractores: `keyConcepts` **exactos** de **otras fichas de la misma área**, filtrados para que no aparezcan en el texto de la ficha objetivo, no se parezcan a la correcta (Jaccard < 0,42) ni a las demás ideas clave de la propia ficha (≤ 0,40), con longitud comparable (0,45×–2,2×) y provenientes de tres fichas distintas.
- `generated: true`, `explanationGenerated: true`; `explanation` = 2 frases construidas desde `summary` y la idea clave, entre comillas y literales.
- `difficulty` derivada del campo `level` de la ficha (Base→base, Intermedio→media, Avanzado→alta); `tags` = `["ficha", <categoría corta>]`.

### 5.5 Deduplicación
Contra las 111 preguntas de campaña y entre las nuevas: se compara el `stem` normalizado (minúsculas, sin tildes, sin puntuación) y la similitud Jaccard de palabras con umbral 0,9. Prioridad de conservación: `multiple` → `application` → `concept convertida` → `ficha`. Si dos opciones de una pregunta quedan idénticas tras normalizar, se descarta la pregunta.

### 5.6 Explicaciones de las 111 originales
`explanations-original.json` contiene `{ id: { explanation, explanationGenerated: true, difficulty, tags } }` para las 111 preguntas de `campaign.json` (que no traían explicación). Cada explicación es de 1–2 frases y se construyó **solo** con el enunciado, la clave y el texto de las opciones: no se añadieron cifras, normas ni datos clínicos externos. `difficulty` se deriva por terciles del campo `complexity` de las 111 (cortes 23 y 29 → 38 base, 37 media, 36 alta) y `tags` combina 2–3 etiquetas temáticas con el área oficial. Longitud media: 228 caracteres.

---

## 6. Recuento por área y por origen

### 6.1 Banco nuevo (`questions-v2.json`, 840)

| Área oficial | Dashboard (ficha) | Flashcards `multiple` | Flashcards `application` | Flashcards `concept` | Total |
|---|---:|---:|---:|---:|---:|
| `area-psi-salud-publica` | 43 | 43 | 43 | 43 | **172** |
| `area-psi-cuidado-integral` | 135 | 135 | 135 | 135 | **540** |
| `area-psi-etica` | 9 | 9 | 9 | 9 | **36** |
| `area-psi-investigacion` | 7 | 7 | 7 | 7 | **28** |
| `area-psi-gestion` | 16 | 16 | 16 | 16 | **64** |
| **Total** | **210** | **210** | **210** | **210** | **840** |

Por origen: `dashboard` 210 · `flashcards` 630. Por fuente de datos: 210 fichas y 630 tarjetas, es decir, **el 100 % de las fichas y el 100 % de las tarjetas del dataset quedaron representadas** (cada ficha aporta 1 pregunta de ficha + sus 3 tarjetas).

### 6.2 Campaña (aparte, no se incluye en `questions-v2.json`)

| Área oficial | Preguntas |
|---|---:|
| `area-psi-salud-publica` | 25 |
| `area-psi-cuidado-integral` | 25 |
| `area-psi-etica` | 18 |
| `area-psi-investigacion` | 18 |
| `area-psi-gestion` | 25 |
| **Total** | **111** |

Banco total disponible si se suma campaña + V2: **951 preguntas**.

### 6.3 Distribución de dificultad y confianza del banco nuevo

| Dificultad | Preguntas |
|---|---:|
| `base` | 80 |
| `media` | 512 |
| `alta` | 248 |

`confidence`: `alta` 630 · `media` 210. Distribución de la clave: A 223 · B 198 · C 210 · D 209 (sin sesgo de posición).

---

## 7. Generadas vs. no generadas

| Concepto | Valor |
|---|---|
| Preguntas con `generated: true` | **420** = 210 `concept` convertidas a MCQ + 210 preguntas de ficha |
| Preguntas con `generated: false` | **420** = 210 `multiple` + 210 `application` (texto y clave literales de la fuente) |
| Preguntas con `explanationGenerated: true` | **210** (todas las de ficha) |
| Preguntas con `explanationGenerated: false` | **630** (las de flashcards usan la explicación ya existente en la fuente) |
| Explicaciones generadas para las 111 originales | **111** (100 %) |
| Respuestas abiertas acortadas a su primera oración | **117** de 210 |

---

## 8. Duplicados y descartes

- **Duplicados eliminados: 0.** La similitud máxima de cualquier pregunta nueva contra las 111 de campaña es **0,333** (muy por debajo del umbral 0,9) y no hay dos `stem` normalizados iguales entre las 840 nuevas. No había solapamiento real que recortar.
- **Preguntas descartadas: 0.** Las 210 fichas encontraron una idea clave distintiva y 3 distractores válidos; las 630 tarjetas tenían 4 opciones válidas (cerradas) o 3 distractores del mismo tipo y área (concept). No hubo que eliminar opciones duplicadas en ninguna pregunta.
- Filtros que se aplicaron y que podrían haber descartado contenido (no llegó a activarse ninguno): menos de 3 distractores defendibles, opciones duplicadas, `correctIndex` inválido, ficha sin área oficial, respuesta abierta demasiado corta.

---

## 9. Verificación automática

Script: `serums-quest/.work/v2/tools/agent4-verify.js` → deja el informe completo en `agent4-verify-report.js` (módulo `module.exports`) y lo resume por consola. `node agent4-verify.js --sample` imprime además la tabla de la sección 10.
Resultado: **13/13 comprobaciones booleanas en verde, 0 errores, 0 problemas de procedencia, 0 problemas en las explicaciones originales**.

| Comprobación | Resultado |
|---|---|
| JSON válido y arreglo de nivel superior | OK |
| ids únicos | OK (840/840) |
| 4 opciones no vacías | OK (840/840) |
| `answer` presente y una de A–D | OK (840/840) |
| `explanation` no vacía en todas | OK (840/840) |
| `areaId` dentro de las 5 áreas oficiales | OK (840/840) |
| Campos obligatorios del esquema | OK (840/840) |
| Opciones duplicadas dentro de una pregunta | 0 |
| Correcta de flashcard cerrada = `options[correctIndex]` de la tarjeta | OK (420/420) |
| Conjunto de opciones de flashcard cerrada = el de la tarjeta | OK (420/420) |
| Correcta de `concept` = fragmento exacto al inicio de `card.answer`, cortado en límite de oración/cláusula | OK (210/210) |
| Distractores de `concept` = respuestas de otras tarjetas del mismo tipo | OK (630/630) |
| Correcta de ficha = `keyConcept` exacto de esa ficha | OK (210/210) |
| Distractores de ficha = `keyConcept` exacto de otra ficha de la misma área | OK (630/630) |
| Sin duplicados contra campaña ni internos | OK |
| `explanations-original.json`: 111 entradas, ids existentes, explicación, `explanationGenerated: true`, `difficulty` válida, `tags` | OK |
| Muestra verificada | 37 filas, 37 OK |

Reproducción:

```powershell
node serums-quest\.work\v2\tools\agent4-build.js
node serums-quest\.work\v2\tools\agent4-original-build.js
node serums-quest\.work\v2\tools\agent4-verify.js
```

---

## 10. Muestra verificada de claves (37 filas)

Las 10 primeras filas provienen de `serums-quest/.work/key-sample.json`, **muestra ya verificada en una fase anterior** contra el banco original de 5 100 preguntas; aquí se reverificaron contra `campaign.json` (clave y texto de la opción idénticos). Las 27 restantes son muestras propias de flashcards y dashboard comprobadas contra el dataset v2.5.0.

| # | id | fuente | clave | comprobación | OK |
|---|---|---|---|---|---|
| 1 | `2025-i-psicologia-q008` | campaña (111 originales) | Opción D: interna / externa. | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 2 | `2025-i-psicologia-q013` | campaña (111 originales) | Opción D: Natural | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 3 | `2025-i-psicologia-q025` | campaña (111 originales) | Opción D: promoción - prevención | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 4 | `2025-i-psicologia-q033` | campaña (111 originales) | Opción A: Recuperación, rehabilitación y promoción de su salud mental | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 5 | `2025-i-psicologia-q041` | campaña (111 originales) | Opción B: visión | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 6 | `2025-i-psicologia-q054` | campaña (111 originales) | Opción D: el rapport | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 7 | `2025-i-psicologia-q067` | campaña (111 originales) | Opción D: El acceso a los servicios de salud | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 8 | `2025-i-psicologia-q086` | campaña (111 originales) | Opción C: Probidad - idoneidad - profesionalismo | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 9 | `2025-i-psicologia-q094` | campaña (111 originales) | Opción D: Ficha familiar | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 10 | `2025-i-psicologia-q097` | campaña (111 originales) | Opción D: Sobrecorrección | key-sample.json (fase previa): clave y texto idénticos; reverificado contra campaign.json | OK |
| 11 | `v2-fc-card-agente-01-2` | flashcards · multiple (card-agente-01-2) | Educador sanitario. | options[correctIndex=0] de la tarjeta = opción A | OK |
| 12 | `v2-fc-card-psi-sp-2-6-2` | flashcards · multiple (card-psi-sp-2-6-2) | Perder la continuidad del cuidado y diluir la responsabilidad | options[correctIndex=0] de la tarjeta = opción A | OK |
| 13 | `v2-fc-card-psi-sp-2-10-3` | flashcards · application (card-psi-sp-2-10-3) | Retirar las bolsas al alcanzar las tres cuartas partes y prohibir la compactación manual. | options[correctIndex=1] de la tarjeta = opción B | OK |
| 14 | `v2-fc-card-audit-06-2` | flashcards · multiple (card-audit-06-2) | Porque puede desencadenar un síndrome de abstinencia que requiere manejo médico. | options[correctIndex=3] de la tarjeta = opción D | OK |
| 15 | `v2-fc-card-materna-04-2` | flashcards · multiple (card-materna-04-2) | Hemorragia obstétrica | options[correctIndex=3] de la tarjeta = opción D | OK |
| 16 | `v2-fc-card-psi-ci-1-1a-2` | flashcards · multiple (card-psi-ci-1-1a-2) | Recuperar entrevista y observación, contrastar la evidencia y reformular la conclusión con sus límites. | options[correctIndex=0] de la tarjeta = opción A | OK |
| 17 | `v2-fc-card-vih-03-2` | flashcards · multiple (card-vih-03-2) | TDF/3TC/DTG una tableta al día. | options[correctIndex=0] de la tarjeta = opción A | OK |
| 18 | `v2-fc-card-depresion-04-3` | flashcards · application (card-depresion-04-3) | Valorar el riesgo de forma urgente y activar la ruta de seguridad y derivación. | options[correctIndex=3] de la tarjeta = opción D | OK |
| 19 | `v2-fc-card-mci-03-3` | flashcards · application (card-mci-03-3) | Coordinar una casa de espera materna o un alojamiento cercano al establecimiento con capacidad resolutiva. | options[correctIndex=2] de la tarjeta = opción C | OK |
| 20 | `v2-fc-card-psi-ci-1-4b-3` | flashcards · application (card-psi-ci-1-4b-3) | Explorar ideación, plan, medios y protección, reducir el acceso a medios y coordinar atención urgente con acompañamiento. | options[correctIndex=3] de la tarjeta = opción D | OK |
| 21 | `v2-fc-card-violencia-03-3` | flashcards · application (card-violencia-03-3) | Buscar un momento a solas, con una excusa clínica, y preguntar en privado. | options[correctIndex=3] de la tarjeta = opción D | OK |
| 22 | `v2-fc-card-psi-in-2-2-3` | flashcards · application (card-psi-in-2-2-3) | Se estima alrededor de 26 % menos riesgo y el intervalo no incluye el valor nulo, aunque deben valorarse relevancias. | options[correctIndex=3] de la tarjeta = opción D | OK |
| 23 | `v2-fc-card-agente-01-1` | flashcards · concept (card-agente-01-1) | Es una persona elegida o reconocida por su comunidad que realiza acciones voluntarias de promoción y prevención… | fragmento exacto al inicio de card.answer (293 → 175 caracteres) | OK |
| 24 | `v2-fc-card-psi-sp-2-1-1` | flashcards · concept (card-psi-sp-2-1-1) | Porque actúa después de la estratificación social, sobre la exposición y sobre las consecuencias de enfermar. | fragmento exacto al inicio de card.answer (295 → 109 caracteres) | OK |
| 25 | `v2-fc-card-adulto-08-1` | flashcards · concept (card-adulto-08-1) | El priorizado se brinda en establecimientos I-1 e I-2 según capacidad resolutiva; el completo, en I-3 e I-4 y… | fragmento exacto al inicio de card.answer (127 → 127 caracteres) | OK |
| 26 | `v2-fc-card-higiene-manos-01-1` | flashcards · concept (card-higiene-manos-01-1) | Dos momentos se realizan antes del riesgo (antes del contacto con el paciente y antes de una tarea limpia o aséptica)… | fragmento exacto al inicio de card.answer (339 → 242 caracteres) | OK |
| 27 | `v2-fc-card-mci-05-1` | flashcards · concept (card-mci-05-1) | Porque la familia es a la vez destinataria de intervenciones y el espacio donde ocurre gran parte del cuidado… | fragmento exacto al inicio de card.answer (272 → 120 caracteres) | OK |
| 28 | `v2-fc-card-perinatal-03-1` | flashcards · concept (card-perinatal-03-1) | Es un pilar del tratamiento, especialmente en casos leves o moderados. La TCC y la psicoterapia interpersonal… | fragmento exacto al inicio de card.answer (175 → 175 caracteres) | OK |
| 29 | `v2-fc-card-psi-ci-2-5-1` | flashcards · concept (card-psi-ci-2-5-1) | Implica reconocer su capacidad creciente de decisión y acompañarlo con información comprensible y participación… | fragmento exacto al inicio de card.answer (290 → 122 caracteres) | OK |
| 30 | `v2-fc-card-psi-et-2-2-1` | flashcards · concept (card-psi-et-2-2-1) | La diversidad cultural describe la existencia de distintas expresiones, lenguas, prácticas y perspectivas… | fragmento exacto al inicio de card.answer (496 → 195 caracteres) | OK |
| 31 | `v2-dash-sheet-agente-01` | dashboard · sheet-agente-01 | La capacitación inicial, la continua y la recalificación sostienen su labor. | keyConcept exacto de la ficha sheet-agente-01 (4 keyConcepts) | OK |
| 32 | `v2-dash-sheet-psi-sp-2-13` | dashboard · sheet-psi-sp-2-13 | Acceso efectivo: disponibilidad, accesibilidad, aceptabilidad, calidad y protección financiera. | keyConcept exacto de la ficha sheet-psi-sp-2-13 (9 keyConcepts) | OK |
| 33 | `v2-dash-sheet-audit-04` | dashboard · sheet-audit-04 | Zona II: consejo simple y materiales educativos. | keyConcept exacto de la ficha sheet-audit-04 (4 keyConcepts) | OK |
| 34 | `v2-dash-sheet-lactancia-01` | dashboard · sheet-lactancia-01 | El aseo y otras atenciones se postergan para no interrumpir el apego. | keyConcept exacto de la ficha sheet-lactancia-01 (4 keyConcepts) | OK |
| 35 | `v2-dash-sheet-nutricion-adultos-04` | dashboard · sheet-nutricion-adultos-04 | En delgadez se descarta enfermedad asociada y se busca recuperar el rango normal de IMC. | keyConcept exacto de la ficha sheet-nutricion-adultos-04 (4 keyConcepts) | OK |
| 36 | `v2-dash-sheet-psi-ci-2-19` | dashboard · sheet-psi-ci-2-19 | Cadena de infección: agente, reservorio, puerta de salida, transmisión, puerta de entrada y huésped susceptible. | keyConcept exacto de la ficha sheet-psi-ci-2-19 (8 keyConcepts) | OK |
| 37 | `v2-dash-sheet-psi-et-1-3` | dashboard · sheet-psi-et-1-3 | Consentimiento informado: proceso de información, comprensión y decisión libre, no un formulario firmado. | keyConcept exacto de la ficha sheet-psi-et-1-3 (7 keyConcepts) | OK |

---

## 11. Limitaciones, riesgos y problemas conocidos

1. **El dashboard no tiene preguntas.** No se inventó una app de MCQ: se documenta que Study Dashboard es fichas/temario y que sus 210 preguntas son una **capa pedagógica generada** a partir de texto literal. No deben presentarse como preguntas oficiales ni como banco de examen. Son útiles para repaso activo de fichas.
2. **Las preguntas de ficha son reconocibles por su enunciado** (`Según la ficha «…»`). Si el juego las mezcla con preguntas de examen, conviene filtrarlas por `source: "dashboard"` o por `generated: true` para no romper la ilusión de examen.
3. **El banco está desbalanceado por área**, porque el contenido de origen lo está: Cuidado integral 540 de 840 frente a Investigación 28. No se fabricó contenido para equilibrar; si se necesita nivelar la campaña, hay que decidir cuántas preguntas por área usar.
4. **Alcance del corte en `concept`**: 117 de 210 correctas usan la primera oración o el primer tramo de la respuesta. Son fragmentos exactos de la fuente, pero pueden omitir matices de la respuesta completa; el texto íntegro sigue disponible en la tarjeta original (`flashcardId`).
5. **Riesgo de ambigüedad en las preguntas de ficha**: se midió el solapamiento de cada distractor con las ideas clave de la propia ficha. El máximo es 0,36 y solo 3 de 210 superan 0,30 (por ejemplo `v2-dash-sheet-vih-04`); no hay ningún caso > 0,40. Son defendibles, pero no imposibles de discutir.
6. **Dos preguntas `concept` tienen correcta corta** (`v2-fc-card-depresion-04-1`, 33 caracteres; `v2-fc-card-psi-ci-2-13-1`, 25 caracteres) frente a distractores de hasta 92; se mantienen porque el texto es exacto.
7. **32 preguntas tienen alguna opción de menos de 10 caracteres** (respuestas numéricas o fórmulas breves, p. ej. `0 ufc/100 ml`, `I-4`). Vienen así de la fuente y no se alteraron; algunas se contienen entre sí como cadena (`0 ufc/100 ml` dentro de `10 ufc/100 ml`), una particularidad del banco original.
8. **Clave de la fuente que admite debate**: `2026-i-psicologia-q026` ("búsqueda intencionada y sistemática de casos… en historias clínicas y archivos estadísticos" → clave **pasiva**). La verificación de la fase previa confirmó que la clave es fiel al examen original; la explicación se redactó para sostenerla, pero un revisor podría preferir "activa". No se cambió la clave.
9. **Los campos `examTitle`, `cycle`, `page`, `complexity` y `confidence` de las preguntas nuevas son metadatos derivados**, no datos de examen. `page` es `null` a propósito: estas preguntas no pertenecen a un examen y las páginas del PDF están en `sourceRefs`. `complexity` sigue los valores del contrato (18/28/38) para que el orden de dificultad y los modos del juego funcionen sin ajustes.
10. **No se pudo verificar contra el PDF original** (sin red y sin extracción de PDF en esta fase): la verificación es contra `study-data/temario.js` v2.5.0, que es la fuente que consumen ambas apps. La trazabilidad al PDF queda en `sourceRefs`.
11. **Las 111 preguntas de campaña no se incluyen en `questions-v2.json`** (son la referencia de deduplicación). Solo se entregan sus explicaciones en `explanations-original.json`.
12. **Ruta y forma de integración.** `CONTRACTS.md` (§3, Agente 4) menciona `src/content-v2.json`, pero mi alcance de escritura termina en `.work/v2/`. Lo entregado es `serums-quest/.work/v2/questions-v2.json` como **arreglo JSON**; si el runtime espera un objeto `{ id: q }` como `CAMP.questions`, la conversión es directa (`Object.fromEntries(bank.map(q => [q.id, q]))`) y la forma de cada pregunta ya es la del contrato (`CONTRACTS.md` §5): mismos campos, `source` ∈ {`dashboard`,`flashcards`}, `complexity` ∈ {18,28,38}, `page: null` y `sourceRefs` presente.
13. **Archivos de otros agentes en la misma carpeta.** `.work/v2/CONTRACTS.md`, `.work/v2/CONTRATO-AGENTE-6.md` y `.work/v2/qa/` (perfil de navegador y capturas de QA) los crearon otros agentes mientras yo trabajaba. No los he tocado ni forman parte de mi entrega.

---

## 12. Archivos entregados

| Archivo | Contenido |
|---|---|
| `serums-quest/.work/v2/questions-v2.json` | 840 preguntas nuevas normalizadas (1,36 MB, UTF-8 sin BOM) |
| `serums-quest/.work/v2/explanations-original.json` | 111 explicaciones de las preguntas de campaña (50 KB) |
| `serums-quest/.work/v2/content-report.md` | Este informe |
| `serums-quest/.work/v2/tools/agent4-load.js` | Cargador del dataset y de la campaña en `vm` aislado |
| `serums-quest/.work/v2/tools/agent4-inspect.js` | Inspección del dataset y contraste con `MAPA-MAESTRO-5-AREAS.csv` |
| `serums-quest/.work/v2/tools/agent4-build.js` | Constructor de `questions-v2.json` |
| `serums-quest/.work/v2/tools/agent4-original-es.js` | Explicaciones redactadas de las 111 originales |
| `serums-quest/.work/v2/tools/agent4-original-build.js` | Constructor de `explanations-original.json` (valida cobertura) |
| `serums-quest/.work/v2/tools/agent4-verify.js` | Verificación automática completa |
| `serums-quest/.work/v2/tools/agent4-review.js` | Muestras legibles para revisión manual |
| `serums-quest/.work/v2/tools/agent4-ambiguity.js` | Medición de solapamiento de distractores de ficha |
| `serums-quest/.work/v2/tools/agent4-tables.js` | Tablas de mapeo y recuentos |
| `serums-quest/.work/v2/tools/agent4-sample-md.js` | Tabla Markdown de la muestra verificada |
| `serums-quest/.work/v2/tools/agent4-build-stats.js` | Estadísticas internas de la construcción (módulo `module.exports`) |
| `serums-quest/.work/v2/tools/agent4-verify-report.js` | Informe completo de la verificación (módulo `module.exports`) |

No se modificó ningún archivo fuera de los asignados: ni el HUB, ni `serums-quest-legacy/`, ni `archivo/`, ni `_backups/`, ni `INTEGRITY.sha256`, ni `game.js`, `game.json`, `.work/build-game.js`, `src/campaign.json`, `study-dashboard/`, `study-flashcards/`.
