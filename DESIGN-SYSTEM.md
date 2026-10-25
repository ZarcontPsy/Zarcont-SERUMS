# SERUMS HUB — Sistema de diseño (Premium Glass UI)

Estándar visual del lanzador **SERUMS HUB** y de sus cinco aplicaciones:
**BANQUEO · Examen Studio**, **PLAZAS SERUMS**, **Study Dashboard**, **Study Flashcards**
y **SERUMS QUEST**.
Toda modificación futura debe respetar estas reglas y reutilizar los tokens definidos
en `index.html` (HUB), `EXAMEN STUDIO/styles.css` (Banqueo) y `study-shared/base.css` (Study).

---

## 1. Referencias y su función

| Referencia | Función obligatoria |
|---|---|
| Imagen 1 (MOKOTO) | Identidad: paleta negro/blanco/rojo, tipografía geométrica, transparencias controladas, esquinas muy redondeadas. |
| Imagen 2 (lanzador de referencia) | HUB: escena cálida envolvente, barra superior flotante, carrusel coverflow de cinco tarjetas y control inferior con profundidad. |
| Imagen 3 (Steary) | Interfaces interiores: cristal selectivo + densidad informativa, paneles amplios, jerarquía clara y controles compactos. |
| Banco de preguntas | La información manda: listado denso, detalle legible, evidencia documental y estados visibles sin decoración que compita con el contenido. |
| Study | Lectura y recuperación activa: fichas resumidas, tarjetas, progreso verificable y navegación cruzada sin convertir ambas apps en un dashboard único. |

## 2. Paleta

### HUB

| Token | Valor | Uso |
|---|---|---|
| `--black` | `#000000` | Negro estructural |
| `--bg` | `#080808` | Fondo base |
| `--surface` | `#151515` | Superficies sólidas |
| `--white` | `#FFFFFF` | Máxima legibilidad, botones primarios |
| `--red` | `#DF2531` | Identidad, selección, énfasis |
| `--red-dark` | `#741B1E` | Profundidad roja |
| `--text-2` | `#B8B8B8` | Texto secundario |
| `--text-3` | `#858585` | Metadatos (mínimo 12 px) |

El HUB conserva la identidad negro/blanco/rojo, pero la escena de fondo añade luz cálida
mediante degradados radiales, lámpara, mesa y grano. Es ambiente, no una segunda paleta:
el rojo sigue reservado para selección, foco y acento.

### Study · acentos de identidad

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#E6B566` | Ámbar de Study Dashboard: lectura, progreso y fichas. |
| `--green` | `#8FD3B0` | Verde menta de Study Flashcards: práctica y recuperación. |
| `--quest` | `#7A9CFF` | Azul eléctrico de SERUMS QUEST: progresión y acción principal. |
| `--quest-violet` | `#B79BFF` | Violeta de hitos, jefes y logros de SERUMS QUEST. |
| `--bg` (claro) | `#F3F0E8` | Fondo claro de Study. |
| `--text` (claro) | `#1D1B17` | Texto principal en tema claro. |

Los acentos identifican cada aplicación; no se mezclan dentro de una misma vista salvo
en la navegación cruzada, donde el contexto se conserva mediante texto y no solo color.

### Study · tema oscuro

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0B0B0D` | Fondo base |
| `--surface` | `#141417` | Paneles y tarjetas |
| `--text` | `#F4F1E9` | Texto principal |
| `--muted` | `#88837A` | Metadatos |
| `--line` | `rgba(255,255,255,.09)` | Bordes discretos |

### Banqueo · tema oscuro

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#070708` | Fondo base |
| `--panel` | `rgba(22,22,26,.62)` | Cristal de paneles |
| `--panel-solid` | `#111115` | Superficie opaca (móvil, modales) |
| `--text` | `#F4F2EE` | Texto principal |
| `--text-2` | `#B4B1AC` | Texto secundario |
| `--muted` | `#7D7A80` | Metadatos |
| `--accent` | `#E52A3B` | Selección y énfasis |
| `--ok` | `#78D6A4` | Clave válida / éxito |
| `--warn` | `#F0C96A` | Incidencias y revisión |

### Banqueo · tema claro

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F1EFE9` | Fondo base |
| `--panel` | `rgba(255,255,255,.68)` | Cristal de paneles |
| `--panel-solid` | `#FBFAF7` | Superficie opaca |
| `--text` | `#161618` | Texto principal |
| `--accent` | `#C81428` | Selección y énfasis |
| `--ok` | `#177A4B` | Clave válida / éxito |
| `--warn` | `#92610B` | Incidencias y revisión |

El rojo **no** domina: se usa para selección, acento y énfasis. Ningún estado depende solo
del color; siempre se acompaña de texto, icono, borde o posición.

## 3. Tipografía

- `--display` / `--font-display`: **Zen Dots** → solo wordmark y momentos de marca.
- `--font` / `--font-ui`: **Inter** → toda la interfaz; fallback Segoe UI / system-ui.
- Escala HUB: 9.5 / 10.5 / 12.5 / 14.5 / 16 / 20 / `clamp()` para el título.
- Escala Banqueo: 11 / 12 / 13 / 14 / 15 / 17 / 20 / 24 / 30 px y `clamp()` para héroes.
- Escala Study: 9.5 / 11 / 12.5 / 14.5 / 18 / 24 / 34 px y `clamp()` para héroes de lectura.
- Cifras con `tabular-nums`. No mezclar más familias.
- Mayúsculas espaciadas solo en etiquetas breves; nunca en párrafos.

## 4. Superficies de cristal

- `--glass` / `--panel`: superficies translúcidas para paneles y controles.
- `--panel-solid`: obligatorio cuando hay contenido interactivo sobre el panel
  (hoja de detalle móvil, modales, barras fijas).
- `--line` / `--line-strong`: bordes discretos; nunca brillantes.
- Blur moderado: 12 / 20 / 28 px. Los paneles con texto conservan fondo suficiente.
- Sin degradados aleatorios ni luces permanentes animadas.

## 5. Radios, sombras, movimiento

- Radios: 8 / 12 / 18 / 24 / 32 / 999 px. Tarjeta protagonista del HUB: 28 px.
- Sombras difusas (`--shadow-sm/md/lg`, `--shadow`, `--shadow-soft`) + acento rojo solo
  para elementos activos.
- Transiciones: 160 / 220 / 520 ms con ease-out. Entrada escalonada, hover discreto,
  selección con transformación. Nada de movimiento ornamental.
- `prefers-reduced-motion: reduce` reduce todo a duración ~0 sin romper la funcionalidad.
  Las capturas visuales se toman con movimiento desactivado.

## 6. Componentes

### HUB

- **Barra superior** flotante: marca + acceso anterior/siguiente + aplicación actual + posición
  (`1 / 5`) + acciones (pantalla completa, atajos, acerca de). En ≤1020 px se oculta el centro.
- **Carrusel coverflow** de cinco tarjetas: la activa ocupa el centro; las laterales se
  desplazan `0.88 × ancho de tarjeta`, con escala `.78`, opacidad `.72` y perspectiva.
  Cada tarjeta combina arte CSS, categoría, nombre, descripción, metadatos y CTA.
  BANQUEO/PLAZAS conservan su identidad; Study usa ámbar y verde menta.
- **Arte propio sin fotos**: examen para BANQUEO, mapa topográfico para PLAZAS, ficha/libro
  para Dashboard y mazo para Flashcards. El arte ocupa el 60% de la tarjeta activa; los
  laterales muestran el arte completo con el título al pie.
- **Navegación**: clic en lateral para seleccionar; clic central para abrir; flechas de la
  barra superior e inferior, puntos, swipe horizontal y teclado
  (`←`/`→`, `1`–`5`, `Enter`/`Espacio`). La selección se refleja en barra y puntos.
  El dock lateral se retiró en la revisión 2026-10-25; sus funciones ya estaban cubiertas.
- **Control inferior** glass: app actual, resumen contextual (progreso real de Study) y
  botón «Abrir». Los laterales del carrusel se ocultan ≤900 px. En ventanas de escritorio
  de poca altura (≤720 px) la cartilla se compacta y la barra/puntos permanecen visibles.
- **Progreso y reanudación**: barra + `completadas/total`, nota de actividad y último punto.
  Sin actividad se muestra `—` y un estado informativo, nunca cifras ficticias. Las tarjetas
  abren la portada de cada aplicación; la reanudación del último punto vive dentro de la app
  («Retomar lectura», «Continuar sesión») y en las rutas directas `?sheet=`/`?deck=&resume=1`.
- **Modales** de atajos y «Acerca de»: scrim, foco atrapado, `Esc` para cerrar,
  regiones de fondo `inert` y retorno del foco al disparador.
- **Overlay de apertura** desde la tarjeta elegida, con el color de la aplicación.

### Banqueo

- **Topbar** con marca, navegación (Hub, Banco, Revisión, Importar, Progreso),
  contador de incidencias, tema y menú móvil.
- **HUB de Banqueo**: héroe, métricas, catálogo de profesiones y detalle por profesión.
- **Banco**: toolbar (examen, búsqueda, convocatoria, filtros), listado de preguntas y
  panel de detalle. En escritorio, maestro-detalle; en móvil, hoja fija bajo el topbar.
- **Tarjeta de pregunta**: número, enunciado, alternativas A–D, clave, evidencia de
  resaltado y enlace al PDF original en su página.
- **Revisión**: pestañas de cola, observaciones, auditoría y duplicadas; estados
  «pendiente / validada / incidencia» siempre textuales.
- **Importación**: cola, análisis por página, auditoría, clasificación editable y
  guardado explícito. Nunca guarda automáticamente un PDF sin confirmación.
- **Práctica**: configuración, sesión con cronómetro, feedback, entrega, resultado,
  historial y ranking local.
- **Estados vacíos y de error**: icono, título, explicación y acción real.

### Study Dashboard

- **Topbar** con marca, navegación (Panel, Biblioteca, Progreso, Flashcards), tema y controles
  compartidos de Inicio, HUB y pantalla completa.
- **Panel**: objetivo diario, progreso verificable, recomendaciones reales, actividad y último punto.
- **Biblioteca**: búsqueda, filtros (todas, en curso, completadas, favoritas), áreas y fichas;
  los temas se despliegan con `<details>` y conservan su estado durante la sesión.
- **Lector**: modo rápido/completo, conceptos clave, procedimientos, tablas, referencias
  enlazadas al PDF original, favorito, completada y enlace «Practicar con flashcards»
  conservando el tema. La posición de lectura se restaura tras refrescar o reabrir la ficha.
- **Progreso e historial**: solo acciones registradas; sin métricas decorativas.

### Study Flashcards

- **Biblioteca** como portada: resumen compacto de progreso, búsqueda y filtros
  (todas/pendientes/en curso/completadas), áreas plegables y filas de mazo con dominio,
  pendientes y última práctica. Sin una tarjeta por dato ni 210 mazos siempre desplegados.
- **Vista de mazo** con estado, dominio, tarjetas nuevas/revisadas y modos en una sola lista.
- **Sesión**: tarjeta conceptual (revelar/calificar), opción múltiple (seleccionar/comprobar)
  y aplicación; respuesta explicada, referencia y enlace «Consultar ficha resumen».
- **Modos**: libre, repaso rápido, examen (respuestas al final) y errores (solo falladas).
- **Resumen**: acierto, respondidas, refuerzo, revisión de respuestas e historial.
- **Programación e historial**: intervalos por tarjeta, vencimientos y sesiones reales.
- **Navegación**: biblioteca ↔ mazo ↔ sesión por hash, sin recargar el documento; se conservan
  filtros, grupos abiertos y posición al volver. «Volver a la biblioteca» es distinto de
  «Volver al HUB»; la fila de acceso directo mantiene su URL (`#/mazo/…`).
- **Navegación cruzada**: conserva mazo, ficha y origen; si no hay contenido, estado
  informativo con alternativas.

### SERUMS QUEST

- **Identidad**: azul eléctrico `#7A9CFF` y violeta `#B79BFF` sobre fondo negro azulado;
  tipografía Inter para la interfaz y Zen Dots para la marca.
- **Inicio**: recomendación prioritaria, nivel/rango/racha, cinco áreas y accesos a modos.
- **Mapa**: cinco rutas con nodos de misión, jefes, estados textuales y requisitos visibles.
- **Juego**: una pregunta por pantalla, alternativas amplias, cronómetro, vidas y feedback
  inmediato o diferido según el modo. La clave y la fuente nunca se inventan.
- **Resultados**: precisión, cobertura, XP, monedas, logros, etapa, rango y revisión de las
  respuestas realmente registradas.
- **Recuperación**: errores programados, enlace real a la ficha de Study y registro de la
  recuperación posterior; abrir una ficha no marca dominio.
- **Perfil, logros y registro local**: métricas reales, sin usuarios simulados.
- **Estados**: carga, error de contenido, contenido insuficiente, sesión bloqueada,
  recuperación de estado dañado, vacío y finalización.

## 7. Accesibilidad y responsive

- Teclado en HUB: `1`–`5` abre cada acceso; `←` `→` `↑` `↓` recorre las tarjetas;
  `Enter` abre la enfocada; `Esc` cierra modales. Los modales atrapan el foco y las
  regiones de fondo quedan `inert`.
- Teclado en Study: `/` busca en la biblioteca; `Espacio` revela; `1`–`4` califica o
  elige alternativa; `Enter` avanza; `Esc` cierra/retrocede cuando corresponde.
- Foco visible de marca, contraste suficiente, `aria-current`, `aria-label`,
  `aria-pressed`, `aria-live` y estados textuales además del color.
- Breakpoints principales: 1100 px, 1020 px, 940 px, 900 px, 820 px, 780 px, 640 px, 480 px.
- HUB: centro del topbar ≤1020 px, laterales del carrusel ≤900 px, topbar compacta y
  tarjeta de ancho fluido ≤600 px; en ventanas de escritorio de poca altura (≤720 px) se
  compacta la cartilla y se oculta solo la cita decorativa para mantener barra y puntos visibles.
- Controles comunes en el topbar de cada app: **Inicio**, **Volver al HUB** y **Pantalla
  completa** (44/40 px, etiquetas y estados propios, pantalla completa nativa). En Study la
  navegación móvil conserva sus iconos (solo se oculta la etiqueta) y la marca mantiene su
  `aria-label`; en QUEST el topbar pasa a dos filas ≤620/≤380 px sin perder tema ni audio.
- En `max-width: 820px` el topbar mide `--topbar: 91px`; el detalle del banco se abre
  como hoja fija bajo el topbar, con fondo opaco y cierre por botón o `Escape`.
- Nada de scroll horizontal. Las tablas y toolbars se apilan antes de desbordar.

## 8. Reglas permanentes

1. Reutilizar tokens y componentes antes de crear nuevos.
2. Toda acción visible debe funcionar; sin controles decorativos.
3. Estados obligatorios: normal, hover, focus-visible, activo, carga, vacío y error.
4. No inventar datos ni claves: la interfaz debe distinguir «identificada»,
   «pendiente» y «revisada por una persona».
5. No declarar cobertura humana si `reviewed = 0`.
6. Responsive real: escritorio amplio y móvil utilizable, sin encoger el escritorio.
7. Sin contenido ficticio: los textos describen funciones reales.
8. Al terminar cualquier cambio, revisar teclado, móvil, tema claro/oscuro y movimiento
   reducido.

## 9. SERUMS QUEST · capa RPG

La app conserva la base oscura y el azul eléctrico/violeta de su identidad. La capa RPG
no introduce una segunda paleta: organiza la misma identidad en torno a una vitrina de
personajes.

- **Escena antes que tarjetas.** El Game Home usa un escenario grande con el personaje
  protagonista, no un dashboard de tarjetas pequeñas. Los accesos son compactos y el
  progreso secundario queda debajo.
- **Navegación de juego:** cinco destinos primarios (Inicio, Personajes, Inventario,
  Tienda, Progreso), **Jugar** como acción destacada y barra inferior fija en móvil. La
  barra superior incluye héroe, monedas, audio y tema; no mezcla progreso con juego.
- **Profundidad:** escenarios SVG por área con cielo, arquitectura, suelo, niebla,
  partículas y viñeta. El grado oscuro garantiza contraste; el parallax solo responde a
  puntero fino y se apaga con movimiento reducido.
- **Rarezas:** Inicial gris azulado, Común azul acero, Poco común verde azulado, Raro azul
  eléctrico, Épico violeta, Legendario ámbar. La rareza siempre lleva etiqueta textual;
  nunca depende solo del color.
- **Precios:** una sola fuente (`QUEST_CONFIG.rpg.prices`). Las bandas se documentan en
  `serums-quest/docs/RPG-SYSTEM.md`. No hay moneda real ni moneda paralela.
- **Personajes:** SVG vectoriales originales con silueta, vestuario, rostro y prop propios.
  La build 1.2 añade proporciones más adultas, degradados, contornos, pliegues, botas y
  detalles de identidad. Los cosméticos se componen por capas en el mismo sistema de
  coordenadas. No se usan emojis como sustituto de ilustración.
- **Cambio de personaje localizado:** la selección actualiza solo retrato del appbar, nombre,
  nivel, rareza, atributos, detalle, vecinos, indicadores y escena; no se reemplaza `#view`,
  no se reinicia la sesión y se conservan scroll, foco y animaciones ajenas. La preferencia de
  movimiento reducido anula la transición. El estado se guarda con `collection.selectedCharacterId`.
- **Arena de héroes:** escenario central con vecinos difuminados, flechas y puntos; paneles
  laterales de identidad y atributos; tira de elenco. La inspección no cambia el personaje
  activo. En móvil el escenario va primero y los filtros después.
- **Estudio de equipamiento:** personaje grande con ranuras alrededor, grilla de objetos y
  barra de guardado fija. El borrador se previsualiza sin guardar; «Guardar atuendo» es
  explícito y «Restaurar anterior» recupera un nivel de historial.
- **Audio:** controles discretos, silencio global, sliders separados y prueba de sonido.
  Nada suena antes de un gesto; la música empieza apagada. El estado del botón se comunica
  con icono, `aria-pressed` y color.
- **Movimiento:** respiración sutil en reposo y gestos breves por estado. No hay brillo
  permanente ni animaciones que tapen preguntas. `prefers-reduced-motion` y las
  preferencias de presentación desactivan el movimiento sin quitar información. Las
  animaciones fuera de pantalla se pausan.
- **Reacciones:** franja estable con retrato, nombre y mensaje breve; se anuncia por
  `aria-live` y no mueve el foco ni el botón de continuar.
- **Tema claro:** la barra superior, las tarjetas y el HUD tienen variante clara legible;
  el escenario del héroe conserva su cine oscuro con texto blanco y no depende de un
  degradado para ser legible.
- **Responsive:** a 1280 px se simplifica la arena; a 1120 px el Home pasa a dos columnas;
  a 900 px el héroe y el equipamiento se apilan, la navegación superior se oculta y aparece
  la barra inferior de cinco destinos; a 680 px se compactan filtros, ranuras y modales.
  Sin scroll horizontal.

---

### Estado actual

- `index.html` - SERUMS HUB v2.3.0: carrusel coverflow de cinco accesos, progreso real y
  navegación por clic, flechas, puntos, swipe y teclado. Dock retirado en la revisión
  2026-10-25; el hub abre la portada de cada app y muestra el último punto sin inyectar query.
- `EXAMEN STUDIO/` — BANQUEO v2.1.1: 51 exámenes reales, 5.100 preguntas, banco por
  profesión, revisión, importación, práctica, historial y ranking local. Controles de Inicio,
  HUB y pantalla completa; el intento en curso se recupera al refrescar.
- `serums map/serums-map-explorer/` — PLAZAS SERUMS: mapa, filtros y adjudicación; ficha con
  foco atrapado y cierre por `Esc`; favoritos/adjudicadas persistentes.
- `study-dashboard/` — Study Dashboard: temario, fichas, lector, favoritos, objetivos,
  progreso, historial y enlaces a Flashcards; restaura la lectura y conserva los temas abiertos.
- `study-flashcards/` — Study Flashcards: biblioteca jerárquica con filtros, mazos, sesiones,
  examen, errores, programación, historial y enlaces al Dashboard.
- `serums-quest/` — SERUMS QUEST v1.2.0: Game Home con escenario, 10 personajes originales,
  33 cosméticos, arena de héroes, estudio de equipamiento, tienda, audio opcional,
  desbloqueo cinematográfico y reacciones; cambio de personaje localizado; conserva XP,
  misiones, recuperación y logros del banco oficial.
- `serums-chrome.js` + `serums-chrome.css` — controles compartidos de Inicio, HUB y pantalla
  completa, integrados en el topbar existente de las cinco aplicaciones.
- `study-shared/` + `study-data/` — base visual, persistencia compartida, temario y fuentes.
- `tests/e2e/` — arnés QA de navegación, persistencia, responsive, pantalla completa y
  regresión de contenido (Node 24 + CDP, sin dependencias).
- `AUDIT/` — evidencias, matrices de persistencia y rutas, informes por agente e informe final.

---

© 2026 ZARCONT — Todos los derechos reservados · Documento interno del proyecto.
Licencia: `LICENSE` · Autoría y versiones: `AUTORIA.md` · Terceros: `NOTICE.md`.
