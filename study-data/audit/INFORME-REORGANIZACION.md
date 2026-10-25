# Informe de reorganización y profundización — Psicología SERUMS 2026-II

**Fecha:** 24 de octubre de 2026  
**Alcance:** Study Dashboard de Psicología, `study-data/temario.js` y documentación de auditoría.  
**Versión:** 2.5.0.  
**Línea base:** commit `0ef718b` (v2.3.0).  
**Fuente maestra:** `study-data/fuentes/psicologia-temario-serums-2026-ii.pdf`, 3 páginas.

> **Actualización de navegación (24/10/2026):** este informe conserva su alcance de contenido (fichas, fuentes y profundidad). La reorganización de la interfaz en 5 áreas oficiales, 20 categorías y rutas nuevas se documenta en `INFORME-REORGANIZACION-5-AREAS.md` y `MAPA-MAESTRO-5-AREAS.csv`. Las 92 fichas psi y las 118 heredadas siguen existiendo con sus IDs originales.

> **Actualización APS (v2.5.0):** se examinaron 55 fichas APS o directamente relacionadas; 30 se modificaron en esta iteración y 37 acumulan cambios desde `HEAD`. El total de fichas modificadas desde `HEAD` es 49. Ver `INFORME-APS-PROFUNDIZACION.md`.

## 1. Estructura oficial verificada

Se reconstruyó la jerarquía visual con PyMuPDF (posición, tamaño y estilo de fuente), no solo con el texto lineal. Resultado:

- **5 áreas**: Salud pública; Cuidado integral de salud; Ética e interculturalidad; Investigación; Gestión de servicios de salud.
- **14 subáreas**: SP 3; CI 2; ET 2; IN 3; GE 4.
- **90 ítems únicos**:
  - SP: 1.1–1.13; 2.1–2.13; 3.1–3.4 (30).
  - CI: 1.1–1.6; 2.1–2.21 (27).
  - ET: 1.1–1.3; 2.1–2.5; línea sin número sobre estigma (9).
  - IN: 1.1–1.3; 2.1–2.2; 3.1–3.2 (7).
  - GE: 1.1–1.3; 2.1–2.7; 3.1–3.5; 4.1–4.2 (17).

**Hallazgos de extracción:** el PDF duplica SP 2.1; la línea de estigma de ET no tiene número; el orden visual de IN es correcto (Subárea 2 antes de 3). No se reasignaron ítems. La propuesta que ubicaba SP 2.12 y SP 2.13 en la Subárea 3 no coincide con el PDF: ambas están en la **Subárea 2** y se mantuvieron allí.

## 2. Fichas y cobertura

- **92 fichas** de Psicología, **276 tarjetas** (3 por ficha), **630 tarjetas** en todo el temario.
- **44 fichas modificadas** en la reorganización inicial; **49** tras la iteración APS de v2.5.0.
- **0 fichas nuevas**, **0 fichas eliminadas**, **0 ítems sin ficha**.
- **8 ítems parciales**, **1 con limitación estructural** y **37 mapeados sin revisión exhaustiva** de profundidad.

La matriz completa, con código, subárea, fichas, tarjetas, estado y brecha, está en `MAPA-MAESTRO-PSICOLOGIA.csv` y `MAPA-MAESTRO-PSICOLOGIA.md`.

### Resumen por área y subárea

| Área | Subárea | Ítems | Desarrollados | Parciales | Limitación | Mapeados |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Salud pública | Métodos y aplicaciones | 13 | 3 | 1 | 0 | 9 |
| Salud pública | Salud comunitaria | 13 | 9 | 1 | 0 | 3 |
| Salud pública | Promoción y prevención | 4 | 2 | 2 | 0 | 0 |
| Cuidado integral | Temas específicos | 6 | 3 | 0 | 0 | 3 |
| Cuidado integral | Temas transversales | 21 | 9 | 3 | 0 | 9 |
| Ética e interculturalidad | Ética y bioética | 3 | 0 | 0 | 0 | 3 |
| Ética e interculturalidad | Atención intercultural | 6 | 5 | 0 | 0 | 1 |
| Investigación | Conceptos y clasificación | 3 | 0 | 0 | 0 | 3 |
| Investigación | Metodología | 2 | 2 | 0 | 0 | 0 |
| Investigación | Ejecución | 2 | 2 | 0 | 0 | 0 |
| Gestión | Planificación y presupuesto | 3 | 1 | 0 | 0 | 2 |
| Gestión | Organización de servicios | 7 | 5 | 1 | 0 | 1 |
| Gestión | Administración de servicios | 5 | 2 | 0 | 1 | 2 |
| Gestión | Gestión de la calidad | 2 | 1 | 0 | 0 | 1 |

**Lectura correcta:** la cobertura estructural es 90/90; la cobertura temática **no** se declara total. El estado “Mapeado” significa que el ítem tiene ficha, no que su profundidad haya sido validada en esta iteración.

## 3. PDF y fuentes consultadas

### PDF locales efectivamente abiertos y procesados

- `psicologia-temario-serums-2026-ii.pdf` — jerarquía oficial.
- `psi-salud-publica.pdf` — SP 1.1–3.4.
- `psi-cuidado-integral.pdf` — CI 1.1–2.21 y APS/MCI.
- `psi-etica-interculturalidad.pdf` — ET 1.1–2.s.
- `psi-investigacion.pdf` — IN 1.1–3.2.
- `psi-gestion-servicios.pdf` — GE 1.1–4.2.
- `modelo-cuidado-integral-curso-vida.pdf` — MCI, curso de vida, componentes, territorio y RIS.
- `politica-promocion-salud.pdf` — promoción, determinantes, gestión territorial y participación.
- `carta-ottawa-promocion-salud.pdf` — Carta de Ottawa.
- `atencion-primaria-salud.pdf` — atributos de APS (Starfield).
- `abordaje-promocion-salud.pdf` — antecedentes de promoción y participación.

### Fuentes oficiales complementarias

- OMS — Declaración de Alma-Ata, 12/09/1978.
- OMS — Carta de Ottawa, 21/11/1986.
- OMS — Declaración de Yakarta, 21-25/07/1997.
- OMS — Informe sobre la salud en el mundo 2008: APS, más necesaria que nunca.
- ONU — Agenda 2030, A/RES/70/1, 25/09/2015.
- OMS/UNICEF — Declaración de Astaná, 25-26/10/2018.
- MINSA — RM 030-2020/MINSA, MCI, 27/01/2020.
- MINSA — RM 220-2021/MINSA, Manual de Implementación del MCI, 12/02/2021.
- MINSA — RM 464-2011/MINSA, MAIS-BFC, 14/06/2011.
- MINSA — RM 729-2003-SA/DM, MAIS, 20/06/2003.
- Perú — Ley 30885, RIS, publicada 19/12/2018; vigente 20/12/2018.
- Perú — DS 019-2024-SA, Reglamento vigente de la Ley 30885, 19/10/2024 (deroga el DS 019-2020-SA).
- Perú — Ley 26842, Ley General de Salud, 15/07/1997.
- Perú — Ley 29344, Aseguramiento Universal en Salud, 09/04/2009.
- Perú — Ley 29889, 23/06/2012; publicada 24/06/2012.
- Perú — Ley 30947, Ley de Salud Mental, 22/05/2019; publicada 23/05/2019.
- MINSA — RM 366-2017/MINSA, Lineamientos de Política de Promoción de la Salud, 19/05/2017.
- MINSA — RM 546-2011/MINSA, NTS 021, categorías de establecimientos, 13/07/2011.
- MINSA — RM 625-2026/MINSA, NTS 249, cartera de servicios, 16/07/2026.
- MINSA — NTS 213-MINSA/DGIESP-2024, anemia, RM 251-2024/MINSA, modificada por RM 429-2024/MINSA.
- CONCYTEC — Código Nacional de Integridad Científica, RP 028-2024-CONCYTEC-P, 07/03/2024.
- Perú — Ley 26772 (17/04/1997), Ley 27270 (26/05/2000), DS 003-2015-MC (28/10/2015).

## 4. Mejoras académicas incorporadas

### Salud pública

- **SP 1.13:** arquitectura nacional/regional/local, unidad notificante, RENACE, NOTISP/SIEPIBROTE, notificación inmediata (24 h), semanal y mensual, envío al CDC y difusión.
- **SP 2.10:** diferencia residuos intrahospitalarios (NTS 144) del ciclo municipal (generación, recolección, transferencia, disposición final, reciclaje informal y vigilancia comunitaria).
- **SP 2.12:** recentrada en CSMC, primer nivel, crisis, recuperación y continuidad; la orfandad queda como componente de red.
- **SP 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.13, 1.6, 1.12, 3.1 y 3.2:** se añadió la aplicación explícita a APS, territorio, participación, determinantes, promoción y continuidad.

### Cuidado integral

- **CI 2.1:** ficha ancla de APS con cronología global, hitos peruanos, APS vs primer nivel, principios/atributos, APS renovada, MAIS-BFC/MCI, RIS, determinantes, rol del psicólogo, prevención, siglas, caso y preguntas.
- **CI 2.2:** MCI con antecedentes, principios, cuatro componentes, curso de vida, familia, APOC, RIS, gestión/financiamiento y rol del psicólogo.
- **CI 1.4:** se incorporó violencia (tipos, detección, seguridad, ruta CEM/PNP/Ministerio Público, no revictimización) sin duplicar CI 1.6.
- **CI 1.6:** se incorporó la Ley 30947 y su reglamento, modelo comunitario, derechos, capacidad/apoyos e internamiento involuntario excepcional.
- **CI 2.3:** se añadieron componentes prenatales y puerperales; se corrigió la atribución errónea de la NTS 246 a la consejería en lactancia.
- **CI 2.12:** se amplió a desnutrición, sobrepeso, obesidad, micronutrientes y doble carga; se corrigió la NTS 159 por la NTS 213-2024.
- **CI 2.3–2.8:** se añadió la aplicación en APS y continuidad de cada paquete por etapa.

### Ética e interculturalidad

- **ET 2.s** fue reescrita: estigma étnico-cultural, racismo, discriminación directa/indirecta/estructural, poblaciones clave y vulnerables, interseccionalidad, marco peruano, ruta institucional y caso.
- **ET 2.4:** rol del psicólogo en el parto vertical.
- **ET 2.5:** distinción complementaria/alternativa, regulación, interacciones y rol psicológico.
- **ET 2.1 y 2.3:** se precisó el alcance de la NTS 121 (parto vertical) y se usó la DA 261 para adecuación cultural general.

### Investigación

- **IN 2.1:** instrumentos cualitativos y psicométricos, validación cualitativa y COSMIN.
- **IN 2.2:** análisis cualitativo, saturación, triangulación e integración mixta; precisión sobre el valor p.
- **IN 3.1:** proceso editorial, revisión por pares, respuesta a revisores, acceso abierto, preprints y revistas predatorias.
- **IN 3.2:** marco peruano de integridad científica, comités de ética, datos y poblaciones vulnerables.

### Gestión de servicios

- **GE 2.6:** RIS con Ley 30885 y DS 019-2024-SA; se retiraron NTS 021/139 como fuentes tangenciales.
- **GE 2.4:** niveles de referencia, criterios y cierre del circuito.
- **GE 3.2:** cadena peruana de suministro, SISMED, almacenamiento, controlados y baja.
- **GE 3.4/3.5:** se añadió trabajo colaborativo y eficacia a la ficha compartida.
- **GE 1.1:** marco legal concreto y ciclo PEI/POI/presupuesto.
- **GE 2.3, 2.7 y 4.2:** cartera, telesalud y criterios para no mezclar marcos.

## 5. Errores y duplicaciones corregidos

- NTS 246 mal atribuida a consejería en lactancia en CI 2.3.
- NTS 159 mal atribuida a anemia materna en CI 2.12.
- NTS 021/139 usadas como fuentes de RIS en GE 2.6.
- Referencia al DS 019-2020-SA como vigente; el vigente es el DS 019-2024-SA.
- ET 2.s centrada en salud mental y no en estigma étnico-cultural/poblaciones clave.
- CI 1.6 sin Ley 30947 ni su reglamento.
- Duplicación de fuente NTS 235 en GE 2.7.
- Fuente tangencial RM 850-2016 retirada de IN 3.1.
- Título de CI 2.12 ampliado a “Anemia y otros problemas de malnutrición”.

## 6. Pruebas

- `validate_curriculum.py`: **0 errores, 0 advertencias**; 48 fuentes, 23 áreas, 86 temas, 210 fichas, 630 tarjetas; 210 de cada tipo; `correctIndex` 105/105/105/105.
- Comparación profunda contra `HEAD`: **630/630 tarjetas idénticas**; 276 tarjetas de Psicología; 3 por ficha.
- **49 fichas modificadas** desde `HEAD`, 0 no psicológicas; 5 áreas y 14 temas renombrados para explicitar la jerarquía; solo cambió el título de CI 2.12 entre las fichas.
- Navegador: **184/184** combinaciones ficha × modo (rápido/completo) con títulos y secciones exactos; 0 errores de consola; 0 fallos de red.
- Flashcards: 210 mazos, 630 tarjetas, 3 tarjetas en CI 2.1; carga correcta.
- `git diff --check`: OK.
- `verificar_integridad.py`: se regeneró el manifiesto y se verificó al final.

## 7. Agentes

Se usaron **5 agentes de auditoría en paralelo**, sin permiso de edición, uno por área: Salud Pública, Cuidado Integral, Ética/Interculturalidad, Investigación y Gestión. Cada uno leyó el PDF oficial, la guía local, `temario.js` y la matriz, y devolvió incidencias y prioridades. La integración, redacción y validación fueron centralizadas para evitar conflictos de edición. No se usaron agentes para editar el mismo archivo simultáneamente.

## 8. Límites

- **8 ítems parciales** y **1 con limitación estructural**: CI 2.9, CI 2.11, CI 2.16, SP 1.9, SP 2.2, SP 3.3, SP 3.4, GE 2.5 y GE 3.5 (comparte ficha/tarjetas con GE 3.4).
- **37 ítems** quedaron mapeados sin revisión exhaustiva de profundidad.
- No se modificaron las 630 tarjetas ni se añadieron tarjetas. Por eso, GE 3.5 no tiene tarjetas propias y ET 2.s conserva tarjetas antiguas que no reflejan todo el nuevo enfoque; corregirlas habría alterado el requisito de integridad.
- Algunas referencias normativas requieren verificación externa final en el portal oficial, especialmente las más recientes (NTS 246-2026, NTS 249-2026, NTS 235-2025).
- No se hizo una revisión experta clínica de las 92 fichas; se priorizaron las 49 fichas modificadas y los casos sospechosos.

## 9. Archivos modificados

- `study-data/temario.js` — contenido, títulos de áreas/subáreas, versión 2.5.0.
- `study-dashboard/index.html` — caché `?v=2.5.0`.
- `study-flashcards/index.html` — caché `?v=2.5.0`.
- `study-data/audit/COBERTURA-PSICOLOGIA.md` — nota de cobertura estructural y corrección de procedencia.
- `study-data/audit/MAPA-MAESTRO-PSICOLOGIA.csv` — matriz de 90 ítems.
- `study-data/audit/MAPA-MAESTRO-PSICOLOGIA.md` — resumen y brechas.
- `study-data/audit/INFORME-REORGANIZACION.md` — este informe.
- `INTEGRITY.sha256` — manifiesto regenerado.

No se modificaron los PDF, `study-shared/*`, `study-dashboard/app.js`, `study-flashcards/app.js` ni las tarjetas. Tampoco se alteró `store.js` ni las claves de progreso compartido (`study-state-v1`).
