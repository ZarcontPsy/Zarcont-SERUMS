# Reorganización de Study Dashboard en las cinco áreas oficiales

**Fecha:** 24 de octubre de 2026  
**Alcance:** Study Dashboard, Study Flashcards, taxonomía compartida y documentación de auditoría.  
**Base de contenido:** `study-data/temario.js` v2.5.0 (sin cambios).  
**Fuente curricular:** `study-data/fuentes/psicologia-temario-serums-2026-ii.pdf`, 3 páginas.  
**Matriz de fichas:** `MAPA-MAESTRO-5-AREAS.csv` (210 filas).

---

## 1. Resultado ejecutivo

La pantalla principal y la biblioteca dejaron de mostrar las **23 áreas de datos** como categorías equivalentes. Ahora la aplicación se organiza en:

- **5 áreas oficiales** visibles.
- **20 categorías** internas.
- **86 temas/módulos curriculares**.
- **210 fichas** (92 de Psicología + 118 complementarias).
- **630 tarjetas** (3 por ficha), sin cambios.

Las **18 áreas temáticas heredadas** (APS, MCI, AUDIT, materna, mental, adulto, depresión, perinatal, violencia, ITS/VIH, hepatitis, seguridad del paciente, nutrición, promoción, ambiental, materno-neonatal, crónicas y adolescencia/VIH pediátrico) siguen existiendo en los datos y sus **118 fichas siguen accesibles**, pero ya no compiten como categorías principales: fueron absorbidas por las cinco áreas oficiales mediante categorías y referencias cruzadas.

No se eliminó ninguna ficha, tema, tarjeta, fuente ni progreso. No se creó contenido nuevo ni se renombró ningún ID.

---

## 2. Inventario inicial y destino

### 2.1 Dashboards/categorías encontrados

| Elemento | Cantidad | Situación inicial | Destino |
| --- | ---: | --- | --- |
| Áreas oficiales del PDF | 5 | Mostradas al final de una lista de 23 | Categorías principales |
| Áreas temáticas heredadas | 18 | Mostradas como áreas independientes | Categorías/módulos dentro de las 5 áreas |
| Áreas totales en `temario.js` | 23 | 23 tarjetas en Inicio, 23 grupos en Biblioteca, 23 filas en Progreso, 23 secciones en Flashcards | 5 áreas principales |
| Superficies que repetían las 23 áreas | 4 | Inicio, Biblioteca, Progreso y mazos | 4 superficies reorganizadas |

No existen 18 aplicaciones HTML separadas. Los “dashboards temáticos” eran **18 áreas de datos** renderizadas por los mismos componentes en cuatro superficies. El problema era de arquitectura de información, no de aplicaciones duplicadas.

### 2.2 Correspondencia de las 18 áreas heredadas

| Área heredada | Fichas | Área oficial | Categoría final | Estado |
| --- | ---: | --- | --- | --- |
| `area-aps` | 4 | II · Cuidado integral | Atención primaria y modelo de cuidado | D |
| `area-mci` | 8 | II · Cuidado integral | Atención primaria y modelo de cuidado | D |
| `area-mental` | 6 | II · Cuidado integral | Salud mental, consumo y violencias | A |
| `area-depresion` | 8 | II · Cuidado integral | Salud mental, consumo y violencias | A |
| `area-audit` | 6 | II · Cuidado integral | Salud mental, consumo y violencias | A |
| `area-violencia` | 8 | II · Cuidado integral | Salud mental, consumo y violencias | A |
| `area-perinatal` | 4 | II · Cuidado integral | Salud mental, consumo y violencias | A |
| `area-materna` | 6 | II · Cuidado integral | Gestación, infancia y adolescencia | A |
| `area-materno-neonatal` | 5 | II · Cuidado integral | Gestación, infancia y adolescencia | A |
| `area-nutricion` | 14 | II · Cuidado integral | Gestación, infancia y adolescencia / Adultez, vejez, crónicas y nutrición | A |
| `area-adolescencia-vih` | 5 | II · Cuidado integral | Gestación, infancia y adolescencia / ITS, VIH, hepatitis y transmisión vertical | A |
| `area-adulto` | 8 | II · Cuidado integral | Adultez, vejez, crónicas y nutrición | A / E |
| `area-cronicas` | 5 | II · Cuidado integral | Adultez, vejez, crónicas y nutrición | A / D |
| `area-itsvih` | 6 | II · Cuidado integral | ITS, VIH, hepatitis y transmisión vertical | A |
| `area-hepatitis` | 4 | II · Cuidado integral | ITS, VIH, hepatitis y transmisión vertical | A |
| `area-seguridad-paciente` | 8 | II · Cuidado integral | Seguridad del paciente e IAAS | A |
| `area-promocion` | 7 | I · Salud pública | Promoción de la salud y prevención del daño | A / D |
| `area-ambiental` | 6 | I · Salud pública | Salud comunitaria y determinantes ambientales | A / E |

**Leyenda:** A = incorporado completamente; D = duplicado potencial conservado como ampliación; E = referencia cruzada.

---

## 3. Clasificación final por área

| Área | Categorías | Temas/módulos | Fichas | Categorías internas |
| --- | ---: | ---: | ---: | --- |
| I · Salud pública | 3 | 15 | 43 | Métodos; Comunidad y ambiente; Promoción y prevención |
| II · Cuidado integral | 8 | 62 | 135 | APS/MCI; Evaluación y clínica; Salud mental; Curso de vida temprano; Adultez y crónicas; Prevención; ITS/VIH; Seguridad e IAAS |
| III · Ética e interculturalidad | 2 | 2 | 9 | Ética y bioética; Interculturalidad |
| IV · Investigación | 3 | 3 | 7 | Conceptos; Metodología; Ejecución |
| V · Gestión de servicios | 4 | 4 | 16 | Planificación; Organización; Administración; Calidad |
| **Total** | **20** | **86** | **210** | |

### 3.1 Detalle del Área II

El área II concentra el 64 % de las fichas porque absorbe la mayoría del contenido clínico heredado. Se dividió en ocho categorías para evitar una lista plana:

| Categoría | Temas | Fichas oficiales | Fichas totales |
| --- | ---: | ---: | ---: |
| Atención primaria y modelo de cuidado | 7 | 2 (CI 2.1–2.2) | 14 |
| Evaluación y clínica psicológica | 1 | 8 (CI 1.1–1.6) | 8 |
| Salud mental, consumo y violencias | 16 | 0 | 32 |
| Gestación, infancia y adolescencia | 13 | 4 (CI 2.3–2.6) | 26 |
| Adultez, vejez, crónicas y nutrición | 12 | 8 (CI 2.7–2.8b, 2.12, 2.16–2.18, 2.20) | 26 |
| Prevención y detección temprana | 0 | 4 (CI 2.9–2.11, 2.21) | 4 |
| ITS, VIH, hepatitis y transmisión vertical | 8 | 3 (CI 2.13–2.15) | 16 |
| Seguridad del paciente e IAAS | 4 | 1 (CI 2.19) | 9 |
| **Total** | **61 + contenedor CI-2** | **22** | **135** |

El módulo oficial **CI 2 · Temas transversales** (`topic-psi-ci-2`) es un contenedor de 22 fichas. Para no crear temas ni IDs nuevos, sus fichas se repartieron por categoría a nivel de ficha; el contenedor conserva su ID y su progreso agregado. Por eso hay **86 temas** pero **107 entradas de pantalla**: 85 bloques de tema + 22 fichas oficiales del contenedor.

---

## 4. Cobertura del temario oficial

| Área | Ítems del PDF | Fichas psi | Sin ficha | Parciales | Compartidas |
| --- | ---: | ---: | ---: | ---: | ---: |
| I · Salud pública | 30 | 30 | 0 | 4 (SP 1.9, 2.2, 3.3, 3.4) | 0 |
| II · Cuidado integral | 27 | 30 | 0 | 3 (CI 2.9, 2.11, 2.16) | 0 |
| III · Ética e interculturalidad | 9 | 9 | 0 | 0 | 0 |
| IV · Investigación | 7 | 7 | 0 | 0 | 0 |
| V · Gestión de servicios | 17 | 16 | 0 | 1 (GE 2.5) | 1 (GE 3.5 → `sheet-psi-ge-3-4`) |
| **Total** | **90** | **92** | **0** | **8** | **1** |

- **90/90 ítems oficiales tienen ficha accesible.** El PDF contiene 91 líneas: 90 numeradas + ET 2.s sin número; SP 2.1 está duplicado literalmente y se trató una sola vez.
- **92 fichas psi** porque CI 1.1, CI 1.4 y CI 2.8 se desdoblan en dos fichas cada uno.
- **8 parciales** y **37 ítems mapeados sin revisión de profundidad**; no se declaran “completamente desarrollados”.
- **GE 3.5** comparte ficha y tarjetas con GE 3.4; no tiene tarjetas propias.
- **ET 2.s** tiene ficha propia, pero su componente de prevención primaria es limitado.
- **SP 2.12 y 2.13** se mantuvieron en la Subárea 2, como indica el PDF, y no en la Subárea 3.

---

## 5. Duplicados y referencias cruzadas

### 5.1 Duplicados potenciales conservados (D)

Se marcaron **16 fichas** como duplicado potencial, no como duplicados confirmados. Ninguna se eliminó ni fusionó.

| Grupo | Fichas | Contraparte | Decisión |
| --- | --- | --- | --- |
| APS | `sheet-aps-01`…`04` | CI 2.1 · `sheet-psi-ci-2-1` | Conservar como ampliación; enlazar a la ficha oficial |
| MCI | `sheet-mci-01`…`08` | CI 2.2 · `sheet-psi-ci-2-2` | Conservar como ampliación; enlazar a la ficha oficial |
| Carta de Ottawa | `sheet-ottawa-01` | SP 3.1 · `sheet-psi-sp-3-1` | Conservar; evitar duplicar el contenido en futuras fichas |
| Sujetos y escenarios | `sheet-modelo-sujetos-01` | SP 3.1 · `sheet-psi-sp-3-1` | Conservar; corregir la discrepancia 4/8 vs 5/7 |
| Referencia y continuidad | `sheet-adulto-07` | GE 2.4 · `sheet-psi-ge-2-4` | Conservar; la ficha oficial es la fuente principal |
| Climaterio | `sheet-climaterio-01` | CI 2.20 · `sheet-psi-ci-2-20` | Conservar; aporta terapia hormonal y manejo clínico |

### 5.2 Referencias cruzadas (E)

Se conservó una ubicación principal y se documentó la relación con otra área para:

- Metales pesados: `sheet-metales-01/02` (I.2) ↔ CI 2.18 (II.5).
- Trabajo intersectorial: `sheet-psi-sp-2-6` (I.2) ↔ GE 3.3 (V.3).
- Salud ocupacional: `sheet-psi-sp-2-11` (I.2) ↔ GE 3.1 (V.3).
- Alianzas intersectoriales: `sheet-psi-ge-3-3` (V.3) ↔ SP 2.6 (I.2).
- Financiamiento/organización del adulto: `sheet-adulto-08` (II.5) ↔ GE 1/2 (V).
- Bioseguridad: `sheet-psi-sp-3-3` (I.3) ↔ CI 2.19 (II.8).
- IAAS: `sheet-psi-ci-2-19` (II.8) ↔ SP 3.3 (I.3).

---

## 6. Fichas antes y después

| Métrica | Antes | Después | Variación |
| --- | ---: | ---: | ---: |
| Fuentes | 48 | 48 | 0 |
| Áreas en datos | 23 | 23 | 0 |
| Áreas principales visibles | 23 | 5 | −18 |
| Categorías internas | 0 | 20 | +20 |
| Temas/módulos | 86 | 86 | 0 |
| Fichas | 210 | 210 | 0 |
| Tarjetas | 630 | 630 | 0 |
| Fichas psi | 92 | 92 | 0 |
| Fichas heredadas | 118 | 118 | 0 |
| Tarjetas por ficha | 3 | 3 | 0 |

**Hashes de protección (byte-idénticos):**

- `study-data/temario.js`: `cc9a0885994b43d74d7b7cd09284c9e2b2380ba11fc0b88093635fd729b8c15a`
- `study-shared/store.js`: `a77a9793f099ec3e843fb2a8486d1cd5032b99d3f4a6d31787e229d8ca81bbb4`

El hash idéntico de `temario.js` demuestra que no cambiaron contenidos, IDs, referencias ni tarjetas. El de `store.js` demuestra que no cambió el almacenamiento.

---

## 7. Flashcards y progreso

- **210 mazos**, **630 tarjetas**, **3 por mazo**; sin cambios de contenido.
- Las 210 rutas `#/mazo/<sheetId>` abren con su título y sus 3 tarjetas.
- Se probó una sesión real en `sheet-aps-01`: la cola conservó `card-aps-01-1`, `card-aps-01-2` y `card-aps-01-3`.
- Los mazos ahora se agrupan por **5 áreas → 20 categorías**; el breadcrumb muestra área y categoría.
- **Progreso:** claves `study-state-v1` (localStorage), IndexedDB `study-serums` v1 (`state/main`) y snapshot `studyhub:snapshot:v1` intactas.
- Se simuló un estado histórico con `sheet-aps-01` completada y favorita, y `sheet-psi-sp-1-1` vista. Tras recargar: 1/210 completadas, 1 favorita, 2 vistas; Flashcards leyó el mismo estado. No se perdió nada.
- El progreso por tema se calcula con los IDs originales; no se guarda por categoría, así que la reorganización no exige migración de datos.

---

## 8. Interfaz implementada

### Inicio

- Hero con el temario oficial.
- **5 tarjetas de área** como acceso principal, antes de recomendaciones.
- Cada tarjeta muestra categorías, módulos, fichas, progreso y hasta tres categorías + “+N”.
- Se eliminaron las 23 tarjetas y el texto “23 perspectivas”.

### Biblioteca

- Índice de **5 áreas** con **20 tarjetas de categoría**.
- Ruta de área: `#/biblioteca/<areaId>`.
- Ruta de categoría: `#/biblioteca/<areaId>/<categoryId>`.
- Dentro de una categoría se muestran sus temas y sus fichas oficiales.
- Búsqueda global y por ámbito; filtros Todas / En curso / Completadas / Favoritas.
- Rutas heredadas como `#/biblioteca/area-aps` redirigen a `#/biblioteca/area-psi-cuidado-integral` sin 404.

### Lector

- Breadcrumb de tres niveles: **área → categoría → tema**.
- Botón “Categoría” que vuelve a la categoría exacta.
- Tarjeta lateral con enlace a la categoría completa.
- Se conservaron modos rápido/completo, favoritos, completado, fuentes y navegación anterior/siguiente.

### Progreso

- Cinco filas de área, con fichas completadas, total y número de categorías.
- Se conservaron actividad, objetivo, historial, favoritas y almacenamiento.

### Flashcards

- Mazos agrupados por 5 áreas y 20 categorías.
- Etiqueta de categoría en cada mazo.
- Breadcrumb área → categoría → ficha.
- Se conservaron los cuatro modos y la sesión.

### HUB raíz

- Tarjeta de Study Dashboard actualizada a **210 fichas / 86 módulos / 5 áreas**.
- Tarjeta de Study Flashcards actualizada a **630 tarjetas / 210 mazos**.

---

## 9. Pruebas ejecutadas

| Prueba | Resultado |
| --- | --- |
| `validate_curriculum.py` sobre JSON actual derivado de `temario.js` | **0 errores, 0 advertencias**; 48/23/86/210/630; 210 de cada tipo; `correctIndex` 105/105/105/105 |
| Integridad de datos | 0 IDs duplicados; 0 fichas sin tema; 0 temas sin ficha; 0 fichas sin tarjetas; 0 tarjetas huérfanas; 0 `sourceRefs` inválidas |
| Taxonomía | 5 áreas principales, 18 heredadas, 20 categorías, 210/210 fichas clasificadas, 0 sin clasificar, `issues=[]` |
| Categorías | 20/20 rutas; 210 filas de ficha; 210 únicas; 0 duplicadas entre categorías; 0 faltantes |
| Fichas | 210/210 rutas `#/ficha/<id>` con título correcto y breadcrumb de 3 niveles |
| Flashcards | 210/210 rutas `#/mazo/<id>` con título correcto y 3 tarjetas |
| Búsqueda | 9 consultas (VIH, APS, depresión, metales, parto, calidad, ética, vacunación, agua); 0 duplicados; búsqueda por categoría sin resultados fuera de ella |
| Filtros | Completadas mostró 1 ficha tras completar `sheet-aps-01`; Favoritas mostró 1; Todas restauró |
| Progreso histórico | Estado legado simulado cargado tras recarga: 1 completada, 2 vistas, 1 favorita |
| Sesión de flashcards | Cola de 3 tarjetas con IDs originales; pantalla de sesión correcta |
| Móvil 390 px | 7 páginas medidas (Inicio, Biblioteca, Categoría, Ficha, Progreso, Flashcards, Mazo): `scrollWidth = clientWidth`, 0 elementos desbordados |
| Escritorio | Capturas de Inicio, Biblioteca, Categoría y Lector sin errores de renderizado |
| Consola | 0 errores de la aplicación |
| `git diff --check` | Sin errores; solo avisos de CRLF |
| `verificar_integridad.py` | Manifiesto regenerado y verificado al final (ver sección 11) |

### Capturas de evidencia

- `study-data/audit/evidencias/01-inicio-5-areas.png` — Inicio con 5 áreas.
- `study-data/audit/evidencias/02-biblioteca-5-areas-20-categorias.png` — Biblioteca con 5 áreas y 20 categorías.
- `study-data/audit/evidencias/03-categoria-aps.png` — Categoría APS/MCI con temas y fichas oficiales.
- `study-data/audit/evidencias/04-movil-biblioteca-390.png` — Biblioteca a 390 px.

---

## 10. Archivos modificados

- `study-shared/taxonomy.js` — **nuevo**; capa de taxonomía, categorías y helper de navegación.
- `study-dashboard/app.js` — Inicio, Biblioteca, rutas, lector y Progreso.
- `study-dashboard/styles.css` — tarjetas de área/categoría, categorías de biblioteca y responsive.
- `study-dashboard/index.html` — carga de `taxonomy.js` y versiones de caché.
- `study-flashcards/app.js` — agrupación por área/categoría y breadcrumbs.
- `study-flashcards/styles.css` — subgrupos de categoría.
- `study-flashcards/index.html` — carga de `taxonomy.js` y versiones de caché.
- `index.html` — cifras del HUB.
- `study-data/audit/MAPA-MAESTRO-5-AREAS.csv` — **nuevo**; 210 filas de trazabilidad.
- `study-data/audit/MAPA-MAESTRO-PSICOLOGIA.csv` — paginación de SP 2.9–2.13 corregida a página 1.
- `study-data/audit/MAPA-MAESTRO-PSICOLOGIA.md` — nota de enlace al nuevo mapa.
- `study-data/audit/INFORME-REORGANIZACION.md` — nota de alcance de la nueva reorganización.
- `study-data/audit/INFORME-REORGANIZACION-5-AREAS.md` — este informe.
- `study-data/audit/evidencias/` — cuatro capturas de la interfaz final.
- `INTEGRITY.sha256` — manifiesto regenerado.

**No se modificaron:** `study-data/temario.js`, `study-shared/store.js`, `study-shared/ui.js`, `study-shared/base.css`, PDFs, tarjetas, IDs, claves de progreso ni datos de otras aplicaciones.

---

## 11. Integridad final

Comando ejecutado al cierre:

```text
python verificar_integridad.py --generar
python verificar_integridad.py
```

Resultado comprobado al cierre:

```text
Manifiesto regenerado: 278 archivos.
Verificados: 278 | modificados: 0 | faltantes: 0
Integridad correcta: ningún archivo difiere del manifiesto.
```

El manifiesto incluye `study-shared/taxonomy.js`, `MAPA-MAESTRO-5-AREAS.csv` y los archivos modificados.

---

## 12. Errores pendientes y limitaciones

1. **8 ítems parciales** de contenido: SP 1.9, SP 2.2, SP 3.3, SP 3.4, CI 2.9, CI 2.11, CI 2.16 y GE 2.5. Tienen ficha, pero falta profundidad o precisión.
2. **37 ítems** siguen en estado “Mapeado”: tienen ficha, pero no se revisó su profundidad en esta iteración.
3. **GE 3.5** comparte ficha y tarjetas con GE 3.4; no tiene tarjetas propias. No se crearon para no alterar el banco de 630 tarjetas.
4. **ET 2.s** requiere ampliar la prevención primaria del estigma (contacto social, educación y participación), según la fuente.
5. Brechas de contenido detectadas y no corregidas en esta tarea: SP 1.1 no enumera las 11 FESP; SP 3.4 no ubica SINAGERD/INDECI/COEN/EDAN; SP 2.3 no distingue participación social/comunitaria ni CLAS; IN 1.3 no cubre pre/cuasi-experimental; GE 1.1 no desarrolla el ciclo presupuestal completo.
6. **Duplicados potenciales:** 16 fichas marcadas D se conservaron como ampliación. No se fusionaron porque no son copias literales y eliminarlas habría perdido profundidad y progreso.
7. **Progreso histórico:** se probó con un estado sintético compatible, no con un perfil real de varios meses. Las claves y los IDs no cambiaron, por lo que la compatibilidad es estructural.
8. **Revisión clínica:** no se hizo una validación experta línea por línea de las 210 fichas; se priorizó la arquitectura y la cobertura.
9. **Referencias normativas:** algunas normas recientes requieren verificación externa final en el portal oficial, como ya advertía el informe de contenido anterior.
10. **CSS móvil:** se corrigió el campo de búsqueda que se estiraba a 290 px de alto en la biblioteca; las 7 vistas medidas a 390 px ya no desbordan.

---

## 13. Orquestación de agentes

Se usaron **12 agentes**: 1 coordinador y 11 agentes de trabajo/auditoría. Todos los agentes de auditoría trabajaron en **solo lectura**; la escritura se centralizó para evitar conflictos sobre `temario.js`, `app.js` y `store.js`. Dos agentes fueron bloqueados por el proveedor al devolver respuestas largas y se relanzaron con alcance acotado.

| Agente | Función | Resultado principal |
| ---: | --- | --- |
| 1 | Coordinador y arquitecto | Estructura 5/20/86/210/630; decisiones y consolidación |
| 2 | Auditor de dashboards | 23 áreas en 4 superficies; 18 heredadas; rutas afectadas |
| 3 | Auditor de fichas | 0 huérfanos; 10 pares de solape; 90/90 con ficha |
| 4 | Temario oficial | 90/90; 8 parciales; GE 3.5 compartida; ET 2.s |
| 5 | Área I | 30 oficiales + 13 heredadas; 3 categorías; brechas |
| 6 | Área II | 16 áreas heredadas/105 fichas; 8 categorías; duplicados APS/MCI |
| 7 | Área III | 9/9; 0 ausentes; 2 categorías |
| 8 | Área IV | 7/7; 0 ausentes; 3 categorías |
| 9 | Área V | 17/17 cubiertos; GE 3.5 compartida; 4 categorías |
| 10 | Arquitectura de información | 20 categorías; 107 entradas; 0 huérfanos; dudas resueltas |
| 11 | Revisión de implementación | Puntos exactos de cambio, riesgos y plan de pruebas |
| 12 | Auditoría independiente | Línea base y auditoría final; detectó manifiesto pendiente y metadato de conteo, corregidos |

**Evidencia de la auditoría final independiente:** confirmó 210/210 fichas y 210/210 mazos, 18/18 redirecciones heredadas, 0 errores de validador, 0 desbordamiento a 390 px y ausencia de cambios en `temario.js`/`store.js`. Su única objeción de release fue el manifiesto de integridad, que se regeneró después.
