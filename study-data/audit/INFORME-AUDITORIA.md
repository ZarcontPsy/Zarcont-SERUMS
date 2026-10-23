# Informe de auditoría — Study Dashboard y Study Flashcards

> **Actualización (22/10/2026):** este informe describe la auditoría de los 42 PDF clínicos. La integración posterior de las cinco guías de Psicología se documenta en `INFORME-PSICOLOGIA.md`; los totales vigentes son 48 fuentes, 23 áreas, 86 temas, 210 fichas y 630 tarjetas, con 90/90 ítems del temario de Psicología cubiertos.

**Fecha:** 22 de octubre de 2026  
**Alcance:** 42 PDF de `study-data/fuentes/`, currículo compartido `study-data/temario.js`, dashboard, flashcards y persistencia.  
**Objetivo:** verificar incorporación de temas y subtemas, detectar defectos, corregirlos y medir cobertura real sin inventar métricas.

---

## 1. Veredicto

El temario pasó de **5 fuentes, 5 áreas, 14 temas, 28 fichas y 84 tarjetas** a:

| Métrica | Antes | Después |
| --- | ---: | ---: |
| PDF inventariados | 42 | 42 |
| Fuentes registradas | 5 | 42 |
| Áreas | 5 | 18 |
| Temas | 14 | 72 |
| Fichas | 28 (24 ocultas por `pendiente`) | 118 |
| Tarjetas | 84 | 354 |
| Tarjetas por tipo | 28 / 28 / 28 | 118 concepto / 118 múltiple / 118 aplicación |
| Distribución de respuesta correcta | 0:5, 1:105, 2:21, 3:1 | 59 en cada índice (0, 1, 2 y 3) |

**No se declara una cobertura temática del 100%.** Se logró representar las 42 fuentes, pero 13 de ellas tienen cobertura parcial de subtemas y una es un acto normativo que no aporta contenido distinto. La cobertura de páginas es una medida de profundidad, no de exhaustividad temática.

**Estado estructural:** 118/118 fichas completas y 354/354 tarjetas completas. **0 errores estructurales, 0 IDs duplicados, 0 preguntas duplicadas, 0 referencias fuera de rango.** El detalle está en `study-data/audit/COBERTURA.md` y en las matrices CSV.

---

## 2. Método

1. Se inventariaron los 42 PDF y se extrajo texto con PyMuPDF; los escaneados se trabajaron con OCR acotado (`study-data/audit/ocr/`) y digests por página (`study-data/audit/digest/`).
2. Se auditó el currículo original y los borradores `_add-01..04.json`.
3. Se generaron y validaron lotes de contenido nuevo para las fuentes sin cobertura, con referencias de página reales.
4. Se fusionó todo en `study-data/audit/merged.json` y se generó `study-data/temario.js`.
5. Se validó estructura, referencias, páginas, opciones, duplicados y distribución de respuestas con `study-data/tools/validate_curriculum.py`.
6. Se probaron las rutas de las 118 fichas y de los 118 mazos de ficha y 72 mazos de tema en navegador, además de sesiones, respuesta, calificación, recarga, historial y navegación cruzada.
7. Se generó la matriz PDF → tema → ficha → tarjeta y el informe de cobertura con `study-data/tools/build_coverage.py`.

---

## 3. Inventario y cobertura global

- **PDF en `study-data/fuentes/`:** 42.
- **PDF mapeados a una fuente:** 42/42.
- **Fuentes con al menos una ficha:** 41/42 (97,6%).
- **Fuente sin fichas:** `gt-nutricion-ninos-0-11-anterior.pdf`, acto resolutivo que aprueba la guía 2025; no se duplicó su contenido.
- **Áreas:** 18.
- **Temas:** 72.
- **Fichas:** 118.
- **Tarjetas:** 354.
- **Páginas citadas (únicas por fuente):** 494 de 2.514 páginas totales (19,7% global).
- **Cobertura promedio simple por fuente:** 29,5%.
- **Fuentes con temática principal cubierta:** 28.
- **Fuentes con cobertura parcial:** 13.
- **Actos normativos sin duplicación:** 1.

La diferencia entre 19,7% global y 29,5% promedio se explica porque el promedio simple da el mismo peso a cada PDF, mientras que el global está dominado por documentos extensos como la guía de parto (210 páginas) o el modelo de abordaje (221 páginas).

---

## 4. Cobertura por fuente

| Fuente | PDF | Págs. | Temas | Fichas | Tarjetas | Págs. citadas | Cobertura | Estado |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| APS | atencion-primaria-salud.pdf | 6 | 2 | 4 | 12 | 5 | 83,3% | Temática principal |
| MCI | modelo-cuidado-integral-curso-vida.pdf | 82 | 5 | 8 | 24 | 27 | 32,9% | Temática principal |
| AUDIT | audit-consumo-alcohol.pdf | 41 | 3 | 6 | 18 | 16 | 39,0% | Temática principal |
| Materna | atencion-integral-salud-materna.pdf | 59 | 3 | 6 | 18 | 19 | 32,2% | Temática principal |
| Continuidad | continuidad-trastornos-mentales.pdf | 69 | 3 | 6 | 18 | 22 | 31,9% | Temática principal |
| Adulto | cuidado-integral-persona-adulta.pdf | 90 | 4 | 8 | 24 | 23 | 25,6% | Temática principal |
| Depresión | gpc-episodio-depresivo-leve.pdf | 140 | 4 | 8 | 24 | 6 | 4,3% | Temática principal |
| Perinatal | salud-mental-gestantes-madres.pdf | 41 | 3 | 5 | 15 | 15 | 36,6% | Temática principal |
| Ley 30364 | ley-violencia-contra-mujer.pdf | 76 | 1 | 2 | 6 | 12 | 15,8% | Parcial |
| GT violencia | gt-salud-mental-mujeres-violencia.pdf | 66 | 2 | 4 | 12 | 24 | 36,4% | Temática principal |
| Violencia sexual | nt-afectados-violencia-sexual.pdf | 70 | 1 | 2 | 6 | 14 | 20,0% | Parcial |
| ITS | nt-prevencion-control-its.pdf | 39 | 1 | 2 | 6 | 11 | 28,2% | Temática principal |
| VIH adulto | nt-atencion-integral-adulto-vih.pdf | 74 | 1 | 2 | 6 | 8 | 10,8% | Parcial |
| Prevención combinada | nt-prevencion-combinada-vih-alto-riesgo.pdf | 24 | 1 | 2 | 6 | 10 | 41,7% | Temática principal |
| Hepatitis B | nt-prevencion-hepatitis-b.pdf | 65 | 1 | 2 | 6 | 14 | 21,5% | Parcial |
| Hepatitis C | nt-prevencion-hepatitis-c.pdf | 49 | 1 | 2 | 6 | 8 | 16,3% | Parcial |
| Higiene de manos | higiene-manos-oms.pdf | 32 | 2 | 4 | 12 | 17 | 53,1% | Temática principal |
| Vigilancia IAAS | vigilancia-iaas.pdf | 42 | 2 | 4 | 12 | 11 | 26,2% | Temática principal |
| Nutrición infantil | gt-nutricion-ninos-0-11.pdf | 88 | 2 | 6 | 18 | 12 | 13,6% | Temática principal |
| Nutrición adultos | gt-nutricion-adultos.pdf | 36 | 2 | 4 | 12 | 11 | 30,6% | Temática principal |
| Lactancia | gt-consejeria-lactancia-materna.pdf | 59 | 3 | 5 | 15 | 11 | 18,6% | Temática principal |
| Guía 2024 (acto resolutivo) | gt-nutricion-ninos-0-11-anterior.pdf | 69 | 0 | 0 | 0 | 0 | 0,0% | Sin duplicación |
| Ottawa | carta-ottawa-promocion-salud.pdf | 4 | 1 | 1 | 3 | 4 | 100,0% | Temática principal |
| Política de promoción | politica-promocion-salud.pdf | 34 | 1 | 1 | 3 | 12 | 35,3% | Temática principal |
| Modelo de abordaje | abordaje-promocion-salud.pdf | 221 | 2 | 2 | 6 | 17 | 7,7% | Parcial |
| Municipios saludables | municipios-comunidades-saludables.pdf | 49 | 1 | 1 | 3 | 8 | 16,3% | Parcial |
| Escuelas saludables | instituciones-educativas-saludables.pdf | 38 | 1 | 1 | 3 | 5 | 13,2% | Parcial |
| Agente comunitario | labor-agente-comunitario-salud.pdf | 49 | 1 | 1 | 3 | 10 | 20,4% | Parcial |
| Calidad del agua | calidad-del-agua.pdf | 46 | 2 | 2 | 6 | 15 | 32,6% | Temática principal |
| Política salud ambiental | politica-nacional-salud-ambiental.pdf | 34 | 1 | 2 | 6 | 15 | 44,1% | Temática principal |
| Metales pesados | vigilancia-metales-pesados.pdf | 52 | 2 | 2 | 6 | 15 | 28,8% | Temática principal |
| Cuidados del parto | cuidados-durante-el-parto.pdf | 210 | 1 | 1 | 3 | 6 | 2,9% | Parcial |
| Atención neonatal | nt-neonatal.pdf | 71 | 2 | 2 | 6 | 13 | 18,3% | Parcial |
| Tamizaje neonatal | tamizaje-neonatal.pdf | 37 | 1 | 1 | 3 | 6 | 16,2% | Temática principal |
| Enfermedades raras | enfermedades-raras-huerfanas.pdf | 9 | 1 | 1 | 3 | 6 | 66,7% | Temática principal |
| DM2 | gpc-dm2.pdf | 100 | 2 | 2 | 6 | 13 | 13,0% | Temática principal |
| HTA | gpc-hta.pdf | 27 | 2 | 2 | 6 | 10 | 37,0% | Temática principal |
| Climaterio | gpc-climaterio-menopausia.pdf | 42 | 1 | 1 | 3 | 11 | 26,2% | Parcial |
| Adolescentes | nt-adolescente.pdf | 74 | 2 | 2 | 6 | 12 | 16,2% | Temática principal |
| Niño expuesto al VIH | gpc-nino-expuesto-vih.pdf | 9 | 1 | 1 | 3 | 5 | 55,6% | Temática principal |
| Sífilis congénita | gpc-sifilis-congenita.pdf | 9 | 1 | 1 | 3 | 5 | 55,6% | Temática principal |
| VIH pediátrico | nt-nino-adolescente-vih.pdf | 82 | 1 | 1 | 3 | 10 | 12,2% | Parcial |

**Lectura:** “Temática principal” significa que los grandes ejes del documento están representados, no que cada subtema, anexo o recomendación haya sido desarrollado. “Parcial” significa que quedan subtemas identificados sin ficha propia.

---

## 5. Cobertura por área

| Área | Temas | Fichas | Tarjetas |
| --- | ---: | ---: | ---: |
| Atención Primaria de Salud | 2 | 4 | 12 |
| Modelo de Cuidado Integral | 5 | 8 | 24 |
| Consumo de alcohol | 3 | 6 | 18 |
| Salud materna | 3 | 6 | 18 |
| Continuidad de cuidados | 3 | 6 | 18 |
| Cuidado integral del adulto | 4 | 8 | 24 |
| Depresión en atención primaria | 4 | 8 | 24 |
| Salud mental perinatal | 2 | 4 | 12 |
| Violencia de género | 4 | 8 | 24 |
| ITS y VIH | 3 | 6 | 18 |
| Hepatitis virales | 2 | 4 | 12 |
| Seguridad del paciente e IAAS | 4 | 8 | 24 |
| Nutrición y lactancia materna | 6 | 14 | 42 |
| Promoción de la salud y participación comunitaria | 7 | 7 | 21 |
| Salud ambiental y determinantes del entorno | 5 | 6 | 18 |
| Maternidad, recién nacido y tamizaje | 5 | 5 | 15 |
| Enfermedades crónicas y salud de la mujer adulta | 5 | 5 | 15 |
| Adolescencia y VIH pediátrico | 5 | 5 | 15 |
| **Total** | **72** | **118** | **354** |

---

## 6. Fichas y tarjetas: completas, incompletas y pendientes

| Nivel | Completas | Incompletas | Pendientes |
| --- | ---: | ---: | ---: |
| Fichas (estructura: 3 secciones, conceptos, referencias, 3 tarjetas) | 118 | 0 | 0 |
| Tarjetas (concepto con respuesta; múltiple/aplicación con 4 opciones y una correcta) | 354 | 0 | 0 |
| Preguntas duplicadas | 0 | — | — |
| IDs duplicados | 0 | — | — |
| Referencias de página fuera de rango | 0 | — | — |
| Fichas con campos legados (`pendiente`, `categoriaLegacy`) | 0 | — | — |

**Cobertura temática, no estructural:** 28 fuentes con temática principal cubierta (98 fichas / 294 tarjetas), 13 con cobertura parcial (20 fichas / 60 tarjetas), 1 acto normativo sin duplicación (0 fichas). Por eso no se afirma un 100% temático.

---

## 7. Pruebas funcionales

### Dashboard

- Carga con **42 fuentes, 18 áreas, 72 temas, 118 fichas y 354 tarjetas**.
- Las **118/118 rutas de ficha** (`#/ficha/<sheetId>`) renderizan un `h1` válido; 0 fallos.
- Biblioteca: 18 áreas y 72 temas visibles; búsqueda por “climaterio” devuelve 1 tema y 1 ficha.
- Modos rápido/completo: las tablas y llamados se muestran en modo completo.
- Guardar, marcar completada, progreso y recarga: la ficha completada persiste (`completedAt`) y el dashboard la cuenta.
- Navegación anterior/siguiente entre fichas: funciona.
- Enlaces “Practicar con flashcards” y “Volver a flashcards”: conservan `deck`/`sheet` y el contexto.
- Sin errores de consola.

### Flashcards

- Las **118/118 rutas de mazo de ficha** (`#/mazo/<sheetId>`) muestran 3 tarjetas y controles de estudio; 0 fallos.
- Los **72/72 mazos de tema** renderizan con tarjetas; 0 fallos.
- Sesión libre: muestra tarjeta, respuesta, explicación, referencia de página y calificación (1–4).
- Opción múltiple: selección, comprobación, respuesta correcta y explicación funcionan.
- Persistencia: tras calificar y recargar, el dashboard conserva fichas completadas, tarjetas revisadas y racha.
- Historial: muestra 354 tarjetas totales, revisadas, programación y errores.
- Navegación cruzada Dashboard ↔ Flashcards: funciona en ambos sentidos sin volver al HUB.
- Sin errores de consola.

**Límite de la prueba:** se validaron las 118 fichas y los 190 mazos (118 de ficha + 72 de tema) en navegador; no se hizo una sesión manual de las 354 tarjetas una por una. La validación estructural cubre las 354.

---

## 8. Correcciones aplicadas

1. **Fusión de contenido:** se incorporaron los borradores `_add-01..04.json` (11 fuentes, 38 fichas, 114 tarjetas) y los lotes de seguridad, nutrición, promoción, salud ambiental, materno-neonatal, crónicas y adolescencia/VIH.
2. **Fichas ocultas:** se eliminaron `pendiente` y `categoriaLegacy`; las 24 fichas que no se mostraban ahora forman parte del temario.
3. **Typo:** `lack de pertinencia` → `falta de pertinencia` en `sheet-aps-02`.
4. **Citación:** `sheet-adulto-08` citaba páginas 37, 38 y 40 para “vigilancia”; se corrigió a 38, 40, 45 y 46, donde están financiamiento, supervisión y gestión de la información.
5. **MCI:** se añadieron dos fichas para organización territorial/redes y para gestión, calidad y financiamiento (páginas 59–73), que no estaban cubiertas.
6. **Sesgo de respuesta:** se rebalancearon las opciones de 223 tarjetas no numéricas; las 13 numéricas se dejaron en orden. Distribución final: **59/59/59/59**.
7. **Contadores fijos:** el dashboard decía “cinco áreas / catorce temas”; ahora usa `C.areas.length`, `C.topics.length` y `C.sheets.length`.
8. **Pluralización:** “1 días activos” → “1 día activo”.
9. **Codificación:** se corrigieron cadenas del `meta` y del encabezado de `temario.js` que habían quedado con `?` en lugar de tildes.
10. **Caché:** se añadieron parámetros de versión a `temario.js`, `store.js` y `app.js` en ambos `index.html`.
11. **Integridad:** se actualizaron los hashes de `INTEGRITY.sha256` para los archivos modificados; `python verificar_integridad.py` pasa con 0 diferencias.
12. **Trazabilidad:** se creó `study-data/audit/merged.json`, `COBERTURA.md`, `cobertura-fuentes.csv` y `matriz-pdf-tema-ficha-tarjeta.csv`.

---

## 9. Omisiones, duplicaciones y límites

### Omisiones temáticas conocidas (13 fuentes parciales)

- **Ley 30364:** marco legal y medidas de protección; faltan desarrollos procedimentales y articulación interinstitucional.
- **Violencia sexual:** atención inmediata y profilaxis; faltan seguimiento longitudinal, salud mental y ruta legal detallada.
- **VIH adulto:** diagnóstico, TAR y monitoreo; faltan coinfecciones, falla terapéutica y poblaciones especiales.
- **Hepatitis B:** prevención, diagnóstico y tratamiento; faltan escenarios especiales y seguimiento de contactos.
- **Hepatitis C:** tamizaje, diagnóstico y tratamiento; faltan grupos especiales y reinfección.
- **Modelo de abordaje:** sujetos, escenarios, ejes y programas; los siete anexos temáticos no se desarrollan ficha por ficha.
- **Municipios saludables:** definición, fases y evaluación; faltan actores, líneas de acción y herramientas de gestión.
- **Escuelas saludables:** concepto, líneas y organización; faltan instrumentos de diagnóstico y evaluación escolar.
- **Agente comunitario:** roles, capacitación y sostenibilidad; faltan instrumentos de supervisión y registro.
- **Cuidados del parto:** atención respetuosa, fases y prácticas clave; no se detallan las 56 recomendaciones una por una.
- **Atención neonatal:** atención inmediata, alojamiento y signos de alarma; faltan UCIN, prematurez y referencia.
- **Climaterio:** diagnóstico, MRS y terapia hormonal; faltan manejo no hormonal y seguimiento a largo plazo.
- **VIH pediátrico:** equipo, diagnóstico, TAR y adherencia; faltan infecciones oportunistas, TB y revelación del diagnóstico.

### Duplicaciones

- **IDs duplicados:** 0.
- **Preguntas duplicadas:** 0.
- **Títulos de ficha/tema/área duplicados:** 0.
- **Contenido compartido:** 2 fichas citan dos fuentes cada una (`sheet-violencia-03` y `sheet-nutricion-ninos-04`). La matriz por fuente tiene 120 filas para 118 fichas por esa razón; no es contenido duplicado.
- **Guía 2024 de nutrición:** es el acto resolutivo de la guía 2025; se registró como fuente, pero no se duplicaron fichas.

### Límites

- **Cobertura de páginas:** 19,7% global; 29,5% promedio por fuente. Es profundidad documental, no exhaustividad temática.
- **Escaneados:** varias fuentes no tienen capa de texto; se usó OCR acotado. La verificación de páginas es estructural y depende de la calidad del OCR.
- **Validación clínica:** el contenido es una síntesis de estudio; no reemplaza la norma ni el juicio clínico. No hubo revisión por un experto humano.
- **Pruebas:** se validaron todas las rutas de ficha y todos los mazos, pero no se respondió manualmente cada una de las 354 tarjetas.
- **Cobertura temática:** no se alcanza el 100%; las 13 fuentes parciales requieren una segunda fase si se quiere exhaustividad.

---

## 10. Conclusión

El temario quedó **estructuralmente completo y funcional**: 42 fuentes inventariadas, 42 mapeadas, 18 áreas, 72 temas, 118 fichas y 354 tarjetas, con 0 errores estructurales y 0 duplicados. Las dos apps cargan, navegan, guardan progreso y se comunican entre sí.

La cobertura **temática** es amplia pero **no exhaustiva**: 28 fuentes tienen sus temas principales cubiertos, 13 tienen subtemas pendientes y 1 es un acto normativo sin contenido distinto. La afirmación honesta es: **“42/42 fuentes representadas; 28 con temática principal, 13 parciales y 1 sin duplicación; 118/118 fichas y 354/354 tarjetas estructuralmente completas; cobertura de páginas 19,7% global (29,5% promedio por fuente)”**.

### Archivos de evidencia

- `study-data/audit/COBERTURA.md` — matriz completa por fuente y notas.
- `study-data/audit/cobertura-fuentes.csv` — 42 filas, métricas por PDF.
- `study-data/audit/matriz-pdf-tema-ficha-tarjeta.csv` — 120 filas PDF → tema → ficha → tarjetas.
- `study-data/audit/merged.json` — dataset fusionado y validado.
- `study-data/tools/validate_curriculum.py` — validador estructural.
- `study-data/tools/build_coverage.py` — generador de matrices.
- `study-data/tools/ocr_pages.py` — OCR acotado para escaneados.
