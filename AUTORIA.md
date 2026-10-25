# AUTORIA.md — Registro central de autoría y versiones

**Titular y marca:** ZARCONT
**Repositorio:** `LAUNCHER SERUMS` (lanzador + cinco aplicaciones)
**Licencia:** propietaria — © 2026 ZARCONT, todos los derechos reservados (ver `LICENSE`)
**Última revisión de este registro:** 2026-10-20

---

## 1. Componentes del repositorio

| Componente | Ruta | Versión | Autoría | Origen |
|---|---|---|---|---|
| SERUMS HUB (lanzador) | `index.html` | 2.3.0 | ZARCONT | Desarrollo original; carrusel coverflow de cinco accesos, progreso real y reanudación; diseño conforme a `DESIGN-SYSTEM.md`. |
| BANQUEO · Examen Studio | `EXAMEN STUDIO/` | 2.1.1 | ZARCONT | Desarrollo original. Interfaz, banco, revisión, importación, práctica, historial y ranking local. |
| Dataset del banco | `EXAMEN STUDIO/datos/banco-oficial.js` | 2.1.1 | ZARCONT (compilación) | Generado por `tools/build_banco.py` a partir de 51 PDFs de evaluaciones SERUMS. |
| PDFs originales | `EXAMEN STUDIO/documentos/` | — | Documentos públicos de origen | Copias intactas de los 51 PDFs aportados; no se modifican. |
| Auditoría documental | `EXAMEN STUDIO/datos/auditoria-oficial.json` | 2.1.1 | ZARCONT (compilación) | Generada por el mismo script; cobertura, páginas, claves e incidencias por documento. |
| SERUMS Map Explorer — PLAZAS SERUMS | `serums map/serums-map-explorer/` | 2.0.0 | ZARCONT | Desarrollo original; datos derivados de fuentes públicas (ver §3). |
| Study Dashboard | `study-dashboard/` | 2.2.0 | ZARCONT | Desarrollo original. Temario, lector rápido/completo, favoritos, objetivos, progreso e historial. |
| Study Flashcards | `study-flashcards/` | 2.1.0 | ZARCONT | Desarrollo original. Mazos, estudio libre, repaso, examen, errores, programación e historial. |
| SERUMS QUEST | `serums-quest/` | 1.0.0 | ZARCONT | Aprendizaje gamificado: misiones, desafíos, XP, rangos, logros, recuperación de errores y persistencia local versionada. Reutiliza el banco y el temario por referencia. |
| Capa compartida de Study | `study-shared/` | 2.0.0 | ZARCONT | Tokens, iconos, almacén, sincronización entre pestañas y utilidades comunes. |
| Temario compartido | `study-data/temario.js` | 2.5.0 | ZARCONT (síntesis) | 5 áreas oficiales, 20 categorías, 86 módulos, 210 fichas y 630 flashcards con IDs estables. |
| Fuentes documentales de Study | `study-data/fuentes/` | — | MINSA, OMS y artículo académico | Copias de los cinco PDFs aportados; no se modifican (ver §3). |
| Sistema de diseño | `DESIGN-SYSTEM.md` | 2.3 | ZARCONT | Documento interno del proyecto. |
| Datos de plazas | `datos/datos_plazas.js`, `datos/datos_adjudicados.js` | — | ZARCONT (compilación) | Generados por scripts propios a partir de las fuentes públicas de §3. |

## 2. Identificadores técnicos

- SERUMS HUB: `ZARCONT-SRH-2.3.0` (visible en «Acerca de»).
- SERUMS QUEST: `ZARCONT-SQ-1.0.0`, mapa de contenido `1.0.2`, esquema de datos `1`.
- BANQUEO: `Examen Studio 2.1.1`; scripts y estilos locales versionados con `?v=2.1.5`
  para evitar cachés antiguas durante la actualización.
- Study: contenido `2.5.0` (5 áreas oficiales, 20 categorías, 86 módulos, 210 fichas y 630 tarjetas);
  aplicaciones `Study Dashboard` y `Study Flashcards`, sin prefijos de convocatoria ni años en nombres,
  encabezados o textos de interfaz.
- Encabezado de autoría: cada archivo propio incluye una línea `© 2026 ZARCONT`.
- Metadatos: `<meta name="author" content="ZARCONT">` en las interfaces.
- Persistencia local de BANQUEO: IndexedDB `examenstudio` versión 2
  (`attempts`, `review`, `imports`, `files`, `audits`, `issues`, `questions`, `exams`).
  La revisión y el tema usan `localStorage`.
- Persistencia compartida de Study: IndexedDB `study-serums` versión 1,
  respaldo `study-state-v1` y snapshot `studyhub:snapshot:v1` en `localStorage`.
  El tema visual usa `study-theme`. No reutiliza ni modifica las claves de BANQUEO
  ni de PLAZAS SERUMS.
- Persistencia de SERUMS QUEST: `localStorage` con estado versionado
  `serumsquest:state:v1`, respaldo `serumsquest:backup:v1`, diario `serumsquest:journal:v1`,
  snapshot para el HUB `serumsquest:snapshot:v1` y archivos `serumsquest:archive:*`.
  No escribe en las claves de Study, Examen Studio ni Plazas.

## 3. Procedencia de datos y terceros

- Los 51 PDFs de evaluaciones SERUMS (2025-I, 2026-I y 2026-II) fueron aportados al
  proyecto como documentos públicos de origen. El proyecto no reclama autoría sobre
  ellos; conserva copias intactas y enlaza cada pregunta a su documento y página.
- El dataset se compiló con **PyMuPDF** (extracción offline) y un script propio.
  Los resaltados amarillos de los PDFs son rellenos vectoriales, no anotaciones PDF;
  el script los detecta por geometría y color. No se inventaron claves.
- Cobertura actual: **51 exámenes · 17 profesiones · 5.100 preguntas · 5.100 claves
  identificadas**. Once profesiones generales y seis áreas de Tecnología Médica.
  Hay 2.695 registros duplicados en 580 grupos; se detectan y muestran, no se eliminan.
- **Revisión humana: 0 preguntas.** La cobertura del 100% significa que cada pregunta
  tiene una clave identificada automáticamente, no que haya sido revisada por una
  persona. La interfaz muestra `reviewed = 0` y no declara lo contrario.
- Los conjuntos de plazas provienen de documentos y listados públicos oficiales (MINSA):
  oferta de plazas remuneradas SERUMS, listado RENIPRESS, listado de adjudicados y
  resultados finales. El proyecto no reclama autoría sobre ellos.
- El temario de Study se sintetizó a partir de cinco PDFs aportados: el artículo
  académico sobre atributos de la APS, el documento técnico MCI, el manual AUDIT de la
  OMS, la norma técnica de salud materna y la guía técnica de continuidad de cuidados
  en salud mental comunitaria. Las fichas son una **síntesis de estudio**: no sustituyen
  la norma vigente ni el juicio clínico. Cada referencia enlaza al documento y página.
- Clasificación editorial aplicada: MCI, salud materna y continuidad de trastornos
  mentales se identifican como documentos técnicos o normas MINSA; AUDIT como manual de
  referencia de la OMS; el artículo de APS como revisión académica, **no** como norma
  MINSA. No se inventaron claves, estadísticas, fuentes ni contenido «oficial».
- SERUMS QUEST consume el banco de Psicología de Examen Studio y el temario de Study por
  referencia. `serums-quest/data/quest-map.js` solo contiene IDs y una afinidad temática
  editorial; no copia enunciados, alternativas ni claves. Las preguntas con afinidad baja
  o sin área no se usan en misiones ni modos puntuables.
- Dataset de Study: 5 áreas oficiales, 20 categorías, 86 módulos, 210 fichas y 630 flashcards
  (tres por ficha: conceptual, opción múltiple y aplicación), con IDs únicos para áreas,
  temas, subtemas, fichas, tarjetas, referencias y fuentes.
- Librerías, fuentes tipográficas y servicios de terceros: ver `NOTICE.md`.
  - PDF.js 3.11.174 (CDN de cdnjs) para leer PDFs al importar.
  - Tesseract.js 5.1.1 (CDN de jsDelivr), solo si se activa OCR.
  - Google Fonts: Inter y Zen Dots.
  Las licencias de terceros prevalecen para dichos componentes.

## 4. Funciones y límites de esta revisión (2026-10-20)

### Incluido

- HUB con carrusel coverflow y cinco accesos diferenciados: BANQUEO, PLAZAS SERUMS,
  Study Dashboard, Study Flashcards y SERUMS QUEST. La tarjeta central abre la aplicación; las laterales
  se seleccionan con clic, flechas, dock, puntos, swipe o teclado. Muestra progreso real y
  último punto de Study, permite reanudar y se actualiza entre pestañas.
- Study Dashboard: panel, biblioteca, búsqueda y filtros, lector rápido/completo, fichas,
  conceptos, procedimientos, tablas, favoritos, objetivos, progreso, historial y recomendaciones.
- Study Flashcards: mazos jerárquicos, tarjetas conceptuales/de opción múltiple/aplicación,
  estudio libre, repaso rápido, examen, errores, dominio, programación, historial y respuestas explicadas.
- SERUMS QUEST: cinco rutas de área, misiones, jefes, desafío diario, supervivencia,
  contrarreloj, recuperación espaciada, XP, niveles, rangos, monedas, logros, resultados
  verificables, registro local y ajustes. Integra el banco de Psicología y las fichas de
  Study por referencia; no copia ni modifica las fuentes.
- Navegación cruzada Dashboard ↔ Flashcards con conservación de tema, mazo, ficha y sesión;
  estados informativos con alternativas cuando el destino no tiene contenido.
- Persistencia compartida por mismo origen HTTP y sincronización entre pestañas; las
  estadísticas se calculan solo con actividad real. Cada aplicación conserva su interfaz.
- Banco real por profesión y convocatoria, con búsqueda, filtros, duplicadas e incidencias.
- Detalle de pregunta con alternativas, clave, evidencia y enlace al PDF original en su página.
- Revisión con cola, observaciones, auditoría y estados; no se autodeclara revisión humana.
- Importación local de PDFs: análisis de todas las páginas, clasificación por contenido,
  detección de resaltados vectoriales, auditoría y guardado explícito.
- Práctica con configuración, cronómetro, feedback, entrega, resultado, historial y ranking.
- Persistencia local tolerante a fallos: si IndexedDB no responde, la app sigue sin
  persistencia y lo indica en el pie.

### Límites conocidos

- La importación requiere conexión para cargar PDF.js desde el CDN. El banco oficial,
  la revisión y la práctica funcionan con los archivos locales.
- El OCR depende de Tesseract.js y de poder rasterizar la página; si no es posible,
  la importación marca la incidencia y no inventa texto ni claves.
- La detección automática de claves puede fallar en PDFs con resaltados sobre el
  enunciado, más de una alternativa resaltada o maquetaciones atípicas. Esos casos se
  envían a revisión; la clave nunca se completa por suposición.
- La app no es multiusuario ni sincroniza entre dispositivos: el progreso vive en el
  navegador. Borrar los datos del sitio elimina intentos, revisión e importaciones.
- El contenido de Study es una síntesis editable sujeta a verificación en la fuente
  original; no es una publicación oficial ni reemplaza protocolos, normas o decisiones
  clínicas. La interfaz no muestra años ni números de convocatoria.
- El progreso compartido de Study requiere servir el HUB y las dos aplicaciones desde el
  mismo origen HTTP. Abrir los archivos con `file://` puede aislar el almacenamiento y
  romper la reanudación; la app no presenta ese estado como si hubiera progreso.
- Si IndexedDB no está disponible, Study usa `localStorage` como respaldo. La
  sincronización entre pestañas fusiona tarjetas, sesiones, actividad, historial y último
  punto para reducir sobrescrituras; no sustituye una cuenta ni un servidor.
- No se afirma ninguna protección anticopia. El manifiesto de integridad permite
  detectar cambios, no impedir copias.

## 5. Integridad verificable

```bash
python verificar_integridad.py            # verifica
python verificar_integridad.py --generar  # regenera el manifiesto
```

`INTEGRITY.sha256` cubre los archivos propios del repositorio. **Exclusiones
deliberadas:** los JSON crudos de entrada en `serums map/` (datos fuente sin procesar),
carpetas `__pycache__/`, `node_modules/`, `.git/` y el propio manifiesto.

El manifiesto permite **detectar** modificaciones accidentales o no autorizadas; **no
impide la copia** del código: ninguna medida del lado del cliente puede impedirlo. Su
valor es probatorio y de mantenimiento, no anticopia.

## 6. Recomendaciones de protección (no implementadas en esta revisión)

1. Mantener el proyecto en un **repositorio privado** con historial de cambios.
2. Restringir las claves de Google Maps por referrer y por API; no usar la clave de
   demostración en producción (la propia app lo advierte).
3. En distribución pública: conservar avisos, `AUTORIA.md` y el manifiesto; valorar
   minificar sin eliminar los metadatos de autoría.
4. Si se explota comercialmente, registrar la marca «ZARCONT» ante la autoridad
   competente y formalizar licencias por escrito.
