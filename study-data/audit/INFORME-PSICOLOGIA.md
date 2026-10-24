# Informe — Temario de Psicología SERUMS 2026-II

**Fecha:** 22 de octubre de 2026
**Alcance:** PDF oficial del temario (3 páginas, 90 ítems), cinco guías de estudio de Psicología, Study Dashboard, Study Flashcards y `study-data/temario.js`.
**Resultado:** **90/90 ítems del temario cubiertos** por **92 fichas** y **276 tarjetas**, sin ninguna mención a la marca en el contenido de las aplicaciones.

> **Actualización del 24/10/2026:** las 92 fichas de Psicología fueron profundizadas (9-12 secciones, caso razonado y errores frecuentes por ficha), sin cambiar IDs, tarjetas ni fuentes. Ver `INFORME-PROFUNDIZACION.md`.

## 1. Fuentes incorporadas

Se copiaron a `study-data/fuentes/` con nombres neutros y se registraron como fuentes del temario:

| Fuente | Archivo | Páginas | Fichas |
| --- | --- | ---: | ---: |
| Salud pública | `psi-salud-publica.pdf` | 76 | 30 |
| Cuidado integral de salud | `psi-cuidado-integral.pdf` | 68 | 30 |
| Ética e interculturalidad | `psi-etica-interculturalidad.pdf` | 27 | 9 |
| Investigación | `psi-investigacion.pdf` | 28 | 7 |
| Gestión de servicios de salud | `psi-gestion-servicios.pdf` | 46 | 16 |
| **Total** | | **245** | **92** |

Los PDFs archivados se limpiaron: se eliminaron metadatos de marca y se redactaron las marcas de agua y avisos de uso personal. La verificación de texto sobre las cinco copias da **0 coincidencias** de “Auria”, “material de uso personal” y “derechos reservados”.

## 2. Contenido integrado

- **92 fichas**: 20 actualizadas en su lugar (conservan identificador y progreso) y 72 nuevas.
- **276 tarjetas**: 92 de concepto, 92 de opción múltiple y 92 de aplicación.
- Cada ficha conserva la estructura académica de la guía: resumen, 4-8 conceptos clave, 4-7 secciones con definiciones, clasificaciones, tablas, ejemplos y tips.
- Se conservaron las “Anclas para recordar” como **Puntos clave** y las “Claves de examen” como **Tips de examen**.
- Los casos se rotularon como **Caso de estudio** o **Ejemplo práctico**. No queda “Caso aplicado AURIA” ni “Original AURIA”.

### Correspondencia con el temario

- **Salud pública:** 30 fichas para SP 1.1-1.13, SP 2.1-2.13 y SP 3.1-3.4.
- **Cuidado integral:** 30 fichas para CI 1.1-1.6 y CI 2.1-2.21.
- **Ética e interculturalidad:** 9 fichas para ET 1.1-1.3, ET 2.1-2.5 y el ítem de estigma.
- **Investigación:** 7 fichas para IN 1.1-1.3, IN 2.1-2.2 y IN 3.1-3.2.
- **Gestión de servicios:** 16 fichas para GE 1.1-1.3, GE 2.1-2.7, GE 3.1-3.5 y GE 4.1-4.2.

La matriz completa está en `matriz-psicologia.csv` y `COBERTURA-PSICOLOGIA.md`.

## 3. Atribución de fuentes

Cada ficha termina con una sección **“Fuentes y Referencias”** con 2-6 referencias a instituciones originales, por ejemplo:

- `Fuente: MINSA — NTS N.° 021-MINSA/DGSP-V.03, categorías de establecimientos.`
- `Fuente: OMS — mhGAP guideline, tercera edición, 2023.`
- `Fuente: CDC — Principles of Epidemiology in Public Health Practice, 3rd edition.`
- `Fuente: CEPLAN — Guía para el Planeamiento Institucional, 2024.`
- `Fuente: SERVIR — RPE N.° 150-2017-SERVIR-PE, cultura y clima organizacional.`

Las referencias se construyeron a partir de las líneas de fuente de cada tema y de las listas de referencias de las guías. No se atribuye el contenido a la marca ni a un “compendio”; se citan las instituciones y documentos originales.

## 4. Validación

### Estructura y contenido

- Validador del proyecto: **0 errores y 0 advertencias**.
- Totales: **48 fuentes, 23 áreas, 86 temas, 210 fichas y 630 tarjetas**.
- Tarjetas del temario completo: 210 concepto, 210 opción múltiple y 210 aplicación.
- Distribución de respuesta correcta: **105 / 105 / 105 / 105**.
- Fichas de Psicología: 92/92 con 3 tarjetas, sección final de fuentes y al menos 2 referencias.
- Cobertura del PDF: **90/90 ítems** (incluido el duplicado 2.1 y la línea sin número de estigma).
- Sin IDs duplicados, sin preguntas duplicadas y sin referencias de página fuera de rango.
- Marcas prohibidas en `temario.js`: **0**.
- Nombres antiguos de secciones: **0**.

### Prueba en navegador

- El panel muestra **23 áreas**, incluidas Salud pública, Cuidado integral de salud, Ética e interculturalidad, Investigación y Gestión de servicios de salud.
- Una ficha nueva de Ética muestra la sección **Fuentes y Referencias** en modo rápido, con cuatro referencias originales.
- El mazo de flashcards de la ficha carga **3 tarjetas** y la sesión libre muestra la pregunta conceptual.
- Una ficha nueva se marca como completada y **persiste tras recargar** (`study-state-v1`).
- Sin errores de carga en las rutas probadas.

### Integridad

- `python verificar_integridad.py` verifica el manifiesto completo sin diferencias.
- Los cinco PDFs nuevos y sus fuentes quedaron incluidos en `INTEGRITY.sha256`.

## 5. Decisiones de organización

- **CI 1.1** se divide en dos fichas: evaluación psicológica y entrevista/examen mental.
- **CI 1.4** se divide en problemas prioritarios y riesgo suicida.
- **CI 2.8** se divide en persona adulta mayor y VACAM.
- **SP 1.5 y SP 1.6** se dividen en historia natural y niveles de prevención.
- **GE 3.4 y GE 3.5** comparten una ficha de liderazgo y trabajo en equipo.
- Por eso hay 92 fichas para 90 líneas del PDF (que incluyen un duplicado y una línea sin número).

## 6. Pendientes y límites

- **Cobertura temática:** no quedan ítems del PDF sin ficha.
- **Revisión experta:** las guías son síntesis de estudio; conviene que un especialista valide las referencias normativas específicas (por ejemplo, números de RM, NTS o artículos) antes de usarlas como fuente única.
- **Contenido clínico:** las fichas son material de estudio y no sustituyen la norma vigente ni el juicio profesional.
- **Marca:** el contenido de las aplicaciones está limpio. Los archivos originales descargados por el usuario, fuera del repositorio, no forman parte de esta limpieza.

## 7. Archivos de evidencia

- `study-data/audit/matriz-psicologia.csv` — 90 ítems con estado, fichas y tarjetas.
- `study-data/audit/COBERTURA-PSICOLOGIA.md` — resumen y matriz completa.
- `study-data/audit/INFORME-PSICOLOGIA.md` — este informe.
- `study-data/temario.js` — temario fusionado (48 fuentes, 210 fichas, 630 tarjetas).
- `study-data/fuentes/psi-*.pdf` — cinco guías archivadas y limpias.
