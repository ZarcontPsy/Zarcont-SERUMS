# Informe — Profundización académica de las fichas de Psicología

**Fecha:** 24 de octubre de 2026
**Alcance:** 92 fichas del temario de Psicología SERUMS 2026-II en `study-data/temario.js` (áreas Salud pública, Cuidado integral de salud, Ética e interculturalidad, Investigación y Gestión de servicios de salud).
**Resultado:** 92/92 fichas ampliadas, **0 tarjetas modificadas**, **0 referencias nuevas inventadas** y cobertura del temario mantenida en 90/90 ítems.

## 1. Motivo de la intervención

La auditoría de las 92 fichas encontró una cobertura completa pero una profundidad desigual:

- 86 fichas no tenían ningún caso razonado.
- 90 fichas no tenían sección de errores frecuentes ni distinciones.
- La mediana era de 5-6 secciones y 372-600 palabras de prosa; varias fichas se limitaban a definir términos y repetir la definición en "Puntos clave".
- Los temas con mayor peso clínico (evaluación psicológica, riesgo suicida, continuidad de cuidados, esquema de vacunación, referencia y contrarreferencia) tenían el mismo formato breve que temas descriptivos.

No se rediseñó la interfaz ni se cambió la estructura de datos. Se conservaron IDs, títulos, área, tema, nivel, referencias y las 630 tarjetas existentes.

## 2. Método

1. Se extrajo el contenido de `temario.js` y se midió cada ficha (palabras de prosa, secciones, conceptos clave, tablas y ausencia de caso/errores).
2. Se priorizaron las 50 fichas con menos de 700 palabras y, dentro de ellas, los temas de mayor rendimiento académico.
3. Cada ficha se contrastó con la guía fuente correspondiente (`psi-salud-publica.pdf`, `psi-cuidado-integral.pdf`, `psi-etica-interculturalidad.pdf`, `psi-investigacion.pdf`, `psi-gestion-servicios.pdf`) para verificar alcance, definiciones y normas ya citadas.
4. Se reescribieron el resumen, los conceptos clave y las secciones con una estructura común de 9 a 12 secciones: conceptos, fundamentos y mecanismos, clasificación y criterios (tabla), procedimiento y criterios de decisión, caso razonado, errores frecuentes y distinciones, puntos clave, tips de examen y fuentes.
5. Se mantuvieron literalmente las líneas "Fuente: ..." y la sección **Fuentes y Referencias** de cada ficha. No se añadió ninguna referencia, norma, fecha, cifra ni porcentaje nuevo.
6. Se validó cada lote con un validador específico y, al final, con el validador del proyecto (`study-data/tools/validate_curriculum.py`).

## 3. Resultados cuantitativos

| Área | Fichas | Palabras antes | Palabras después | Variación |
| --- | ---: | ---: | ---: | ---: |
| Salud pública | 30 | 20 707 | 45 851 | +121 % |
| Cuidado integral de salud | 30 | 16 962 | 45 887 | +171 % |
| Ética e interculturalidad | 9 | 5 446 | 14 713 | +170 % |
| Investigación | 7 | 4 634 | 10 012 | +116 % |
| Gestión de servicios de salud | 16 | 9 799 | 23 702 | +142 % |
| **Total Psicología** | **92** | **57 548** | **140 165** | **+143 %** |

- Palabras de prosa por ficha: mínimo 1 208, mediana 1 497, máximo 2 053.
- Secciones por ficha: 9 a 12 (media 10,7); 6 a 8 secciones marcadas como `core`, visibles en modo rápido.
- 92 casos razonados ficticios con contexto peruano y lectura del caso.
- 92 secciones de errores frecuentes y distinciones (5 a 7 pares por ficha).
- 154 tablas de clasificación, criterios o procedimientos.
- 293 líneas de fuente, idénticas a las originales.

## 4. Qué se añadió en cada ficha

- **Fundamentos teóricos y mecanismos:** modelos explicativos y cadena causal (por ejemplo, diátesis-estrés y teoría interpersonal en riesgo suicida; modelos psicométrico, clínico, cognitivo-conductual y sistémico en evaluación; Andersen y Tanahashi en acceso; Ottawa y determinantes en promoción; PHVA y análisis causa-raíz en calidad).
- **Clasificación y criterios:** tablas con tipos, criterios de uso, límites y errores de aplicación.
- **Procedimiento:** pasos numerados con responsable, registro y criterio de derivación, adaptados al primer nivel de atención.
- **Caso razonado:** situación ficticia en un establecimiento peruano (puesto de salud, centro de salud, CSMC, hospital, DIRESA/GERESA, escuela o comunidad), con lectura razonada, alternativa descartada y error que se evita.
- **Errores frecuentes y distinciones:** pares conceptuales evaluables explicados con "por qué" (incidencia/prevalencia, sensibilidad/especificidad, prevención primaria/secundaria, evaluación/psicodiagnóstico, ideación/intento, confidencialidad/excepción, clima/cultura, eficacia/efectividad, entre otros).
- **Puntos clave y tips de examen:** se conservaron y ampliaron para explicar la consecuencia y el distractor típico, no solo enumerar.

## 5. Validación

- Validador específico de los 92 parches: **0 errores**.
- `python study-data/tools/validate_curriculum.py`: **0 errores y 0 advertencias**.
- Conteos intactos: 48 fuentes, 23 áreas, 86 temas, 210 fichas y 630 tarjetas.
- Tarjetas: 210 de concepto, 210 de opción múltiple y 210 de aplicación; distribución de `correctIndex` 105/105/105/105, sin cambios.
- Comparación contra el respaldo: ninguna tarjeta, fuente, área, tema, título, `topicId`, `areaId`, `level` ni `sourceRefs` modificado.
- Fichas con 3 tarjetas: 92/92.
- Páginas de `sourceRefs` dentro del rango de cada PDF: 0 errores.
- Sin Markdown, HTML, marca ni preguntas duplicadas.
- Cobertura: 90/90 ítems del PDF oficial, 92 fichas (incluye las divisiones CI 1.1, CI 1.4 y CI 2.8 y la línea sin número de estigma).
- Se mantiene una sola ficha para GE 3.4 y GE 3.5 (liderazgo y trabajo colaborativo) porque el temario los presenta como un bloque y la ficha diferencia ambos conceptos; no se duplicó contenido.

## 6. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `study-data/temario.js` | 92 fichas reescritas y ampliadas; versión 2.3.0; tarjetas y metadatos intactos |
| `study-dashboard/index.html` | Caché del temario actualizada a `?v=2.3.0` |
| `study-flashcards/index.html` | Caché del temario actualizada a `?v=2.3.0` |
| `study-data/audit/INFORME-PROFUNDIZACION.md` | Este informe |
| `study-data/audit/COBERTURA-PSICOLOGIA.md` | Nota de profundización |
| `study-data/audit/INFORME-PSICOLOGIA.md` | Nota de actualización |
| `INTEGRITY.sha256` | Manifiesto regenerado |

No se modificaron `study-dashboard/app.js`, `study-dashboard/styles.css`, `study-flashcards/app.js`, `study-shared/*`, los PDF ni las tarjetas.

## 7. Límites y pendientes

- **Revisión experta:** las fichas son material de estudio. Antes de usar una referencia normativa como fuente única (RM, NTS, DS, ley), conviene verificarla en el portal oficial, porque las guías fuente pueden quedar desactualizadas.
- **Bibliografía:** no se añadieron citas nuevas para no inventar referencias. Los modelos teóricos se mencionan por su nombre y las fuentes por ficha se mantienen; una revisión editorial puede incorporar bibliografía primaria verificada si se desea.
- **Contenido clínico:** no sustituye la norma vigente, el juicio profesional ni la atención directa.
- **Otras áreas:** las 18 áreas no psicológicas del temario (118 fichas) no se tocaron en esta intervención.
- **Datos históricos:** `study-data/audit/merged.json` sigue siendo el artefacto de la versión 2.0 y no se usa en las aplicaciones; la fuente vigente es `study-data/temario.js`.
- **Verificación en navegador:** la estructura de datos y el validador del proyecto pasan sin errores; conviene abrir una ficha en modo rápido y completo para confirmar la lectura visual en el equipo del usuario.
