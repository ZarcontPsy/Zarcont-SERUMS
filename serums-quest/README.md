# SERUMS QUEST

**Versión vigente del proyecto SERUMS QUEST.** RPG 3D voxel construido sobre la campaña, los personajes, la progresión, los cosméticos y las cinco islas flotantes de SERUMS QUEST 1.2.

| | |
| --- | --- |
| **Proyecto principal** | `ZARCONT SERUMS\serums-quest` (esta carpeta; ruta `.` en Game Studio) |
| **Versión anterior (archivo)** | [`../serums-quest-legacy`](../serums-quest-legacy/README-ARCHIVO.md) — solo consulta |
| **Entrega jugable** | [`dist/index.html`](dist/index.html) · [`export/serums-quest.html`](export/serums-quest.html) (HTML único sin conexión) |
| **Estado** | **V2.2 · Tienda 3D e interfaz** (7 de noviembre de 2026) · build `b6ab87f0a86a` · 951 preguntas (111 campaña + 210 fichas dashboard + 630 flashcards) |
| **Copia de seguridad** | `ZARCONT SERUMS\_backups\2026-11-06_pre-migracion` (SHA-256 verificado) · copias V2/V2.1/V2.2 en `Documents\ZARCONT SERUMS-BACKUPS` |

**Checkpoint de desarrollo:** *V2.2 · Tienda 3D e interfaz*. La entrega anterior es [`docs/V2.1-FINAL.md`](docs/V2.1-FINAL.md).

## V2.2 · Tienda 3D e interfaz (7 de noviembre de 2026)

> Versión vigente. Convierte la tienda y el inventario en una cuadrícula de tarjetas con miniatura 3D, visor giratorio y compra/equipado sin recargar la pantalla; corrige el panel del duelo y el resumen en ventanas reducidas; da arquitectura propia a las cinco puertas y limpia etiquetas, props e islas del atrio; añade avisos con cierre/auto-ocultado. Versión visible en Ajustes: **V2.2 · Tienda 3D e interfaz**. Exportación única: [`export/serums-quest.html`](export/serums-quest.html), 3.448.508 B.

- **Tienda e inventario 3D:** 33 originales en tarjetas con miniatura, rareza, estado y precio; visor 3D del héroe con «Probar sin comprar», «Comparar» y «Equipar»; filtros por ranura/rareza. La selección actualiza solo la tarjeta y el detalle (`renderCount` sin cambios) y conserva scroll, filtros y selección.
- **Miniaturas:** un único renderizador fuera de pantalla genera las 69 miniaturas (160 px, fondo por rareza, caché en memoria); el HTML no crece por ellas. 61 piezas 3D con geometría propia + 8 títulos de texto.
- **Cosméticos:** motivos por área en los tocados de dominio, perneras de ruta, reliquia del criterio, zorro de tinta, cinco armas de efecto y marcos de bronce/platino con silueta propia. 690 montajes (69 × 10 héroes) sin errores.
- **Cambio de cosméticos:** el visor reutiliza el avatar y cambia solo los grupos de la ranura afectada; no se reconstruye el héroe ni el renderizador. No se cuantificó el parpadeo con un banco de frames a 60 fps.
- **Duelo responsivo:** panel dentro de `100dvh`; en apaisado bajo pasa a hoja lateral ultracompacta de una columna; 4 alternativas visibles en 480×320, 640×360, 844×390, 1024×600, 1308×662, 768×1024, 1280×720 y 1920×1080.
- **Resumen:** tarjeta a `100dvh`, cabecera y pie fijos, lista con scroll propio, anillo escalado, scrollbars del juego y microtexto «Respondiste 4 de 5 · 1 correcta · 25 % de precisión».
- **Atrio:** cinco arquitecturas (ramas, linterna, balanza, prisma, engranajes), etiquetas uniformes con rol corto y desvanecimiento por distancia, 4 props y 10 plantas por puerta, islas exteriores ocultas y restauración sin aros/columnas que tapen las puertas.
- **Avisos:** «El navegador bloquea el guardado local» sale una vez, tiene cierre, se auto-oculta a los 6,2 s y deja un indicador pequeño en el HUD; al cerrar un nivel aparece «Exportar ahora».
- **QA final (build `b6ab87f0a86a`):** 17 casos · **17 PASS · 0 FAIL · 0 issues** · 690 montajes de cosméticos · 56 frames del visor sin vacíos · 6 pantallas × 5 tamaños sin desbordes · export `file://` con 0 red/errores · 75 FPS mín./med. en atrio y duelo.
- **Tamaño y hash:** `dist/index.html` = `export/serums-quest.html` = **3.448.508 B**, SHA-256 `B6AB87F0A86A2F7ACB5C0074CDCC71E38677B5E0DC4DD9050407D88CCB7AC6D8`.
- **Game Studio:** versión **96**; 12 slots intactos; sin imágenes de IA. HUB, `serums-quest-legacy`, `archivo/`, `_backups/` e `INTEGRITY.sha256` no se tocaron.

Evidencia V2.2: [`.work/v2.2/evidence/`](.work/v2.2/evidence), [`.work/v2.2/qa/`](.work/v2.2/qa). Informe: [`docs/V2.2-FINAL.md`](docs/V2.2-FINAL.md). Progreso: [`.work/v2.2/PROGRESO.md`](.work/v2.2/PROGRESO.md).

## V2.1 · Correcciones y pulido (6–7 de noviembre de 2026) · histórico

> Versión anterior. Corrige el parpadeo voxel, los banderines, el ritmo del feedback, el duelo en tablet/móvil y el rendimiento; añade resumen de nivel y opciones de banco. Exportación única: [`export/serums-quest.html`](export/serums-quest.html), 3.369.535 B.

- **Z-fighting:** `mergedVoxels` ahora deduplica cajas, descarta contenidas y culla caras interiores/contacto; capas `polygonOffset` por pieza/cosmético, ocultación real de pelo/capa base, cámara 0.2/320, `PCFShadowMap` con `normalBias 0.028`. Banco estricto de Agent 1: **0 parpadeo, 0 coplanares sin resolver** en 10 héroes × todas las ranuras, 5 guardianes y 610 cosméticos.
- **Feedback al final por defecto:** entre preguntas no hay pantalla; solo ataque, destello breve y sonido. Auto-avance 900 ms. Pantalla final con puntuación/XP/monedas y lista de preguntas con tu respuesta, clave, explicación y «por qué no encaja»; errores primero, filtros «Solo errores/Todas», «Marcar como difícil» y «Ver en flashcard». Opción «Tras cada pregunta» en Ajustes.
- **Resumen de nivel** en todos los modos; Simulacro mantiene la clave al final; Supervivencia resume al caer; Contrarreloj al terminar.
- **Duelo responsivo:** hoja lateral en apaisado (37–44 % del ancho) o inferior ≤40 % en retrato, cámara reencuadrada al área libre, panel contraído desde el mismo tick del ataque durante 650 ms, safe-area. Probado de 390×844 a 1920×1080; 4 alternativas visibles.
- **Banderines:** malla plana con pivote en la driza, tela media anchura hacia fuera, doble cara y onda anclada al palo; sin atravesar el mástil.
- **Rendimiento/mundo:** sin warnings de Three.js (PCF), culling del atrio (≈71 % de draw calls decorativos ocultos con todo completado), restauración máxima persistente («nunca retrocede»), etiqueta «Generada» y opción «Usar solo preguntas del banco original».
- **Guardado:** cambios aditivos (`restored`, `feedbackMode`, `onlyOriginalBank`); compatible con el guardado anterior y la importación 1.2.
- **QA final (build `ffc4e8ebd3d2`):** 56 casos automatizados · **55 PASS · 0 FAIL · 0 BLOCKED · 1 NOTE** (señal auxiliar de ojos B08c, no bloqueante) · 0 peticiones de red no locales de 168 · 0 errores · PCF=0 warnings · 75 FPS mínimo/medio en atrio, mapa y duelo. La pasada inicial detectó B07b (la contracción del duelo empezaba en la pregunta siguiente) y se corrigió antes de esta pasada.
- **Tamaño y hash:** `dist/index.html` = `export/serums-quest.html` = **3.369.535 B**, SHA-256 `FFC4E8EBD3D25C2BCA761EEBCD3D0F0392C72895A3E8F2961484C67403319AC6`.
- **Game Studio:** 12 slots intactos; sin imágenes de IA. HUB, `serums-quest-legacy`, `archivo/`, `_backups/` e `INTEGRITY.sha256` no se tocaron.

Evidencia V2.1: [`.work/v2/evidence/`](.work/v2/evidence), [`.work/v21/`](.work/v21). Informe: [`docs/V2.1-FINAL.md`](docs/V2.1-FINAL.md). Progreso de la sesión: [`.work/v2.1/PROGRESO.md`](.work/v2.1/PROGRESO.md).

## V2 · Final (6 de noviembre de 2026) · histórico

> Versión final de la tarea V2. Incluye todo el Checkpoint 1 y el mundo interactivo del Agente 6. Versión visible en Ajustes: **V2 · Final**. Exportación única: [`export/serums-quest.html`](export/serums-quest.html), 3.173.871 B.

- **Mundo interactivo en el atrio**: 5 cofres escondidos (uno por isla, recompensa única), 15 fragmentos de conocimiento (10 libres + 5 en cofres), 5 personajes guía (Killa, Nampi, Atoq, Suni, Tawa) con mini-lecciones de 3 pantallas, telescopio de repaso espaciado, biblioteca local de flashcards, 5 sombras del error y restauración visual de cada puerta en 3 niveles según dominio.
- **Cómo se interactúa**: acércate hasta que aparezca el aviso `E` y pulsa `E`/`Enter` (o el botón táctil de acción). Los marcadores flotan y se atenúan con la distancia para no saturar el atrio.
- **Aprender, no repetir**: cofres/fragmentos/guías dan recompensa una sola vez (+5 XP, +5 monedas de cofre dentro del tope diario de 120); las sombras solo se disipan cuando el repaso deja el área sin errores vencidos; el telescopio y la biblioteca no dan monedas.
- **Contenido y aprendizaje**: 951 preguntas, feedback tras cada respuesta, pesos de fuente 60/15/25, explicaciones en las 951, 321 marcadas como generadas. Repaso espaciado y guardado intactos.
- **Rendimiento**: 75 FPS mínimo/medio en atrio (en reposo y con panel), mapa y duelo (calidad alta); 0 peticiones de red y 0 errores en QA. La restauración usa `InstancedMesh`; los 22 marcadores se cullan a 6,5 u (8 ocultos en el spawn).
- **QA final**: 54 casos · **53 PASS · 0 FAIL · 1 NOTE** (warnings preexistentes de Three.js). Importación 1.2, exportación/reimportación con `v2.world`, export por `file://`, paneles a 960×540 y 390×844: PASS. Informe: [`.work/v2/evidence/agent7-cp2-report.md`](.work/v2/evidence/agent7-cp2-report.md).
- **Tamaño y hash**: `dist/index.html` y `export/serums-quest.html` = **3.173.871 B**, SHA-256 `b32f14899538c979b8a3317bb94feb91704f80b338115289a4dabe94567ca048`.
- **Guardado**: `state.v2.world` es aditivo y compatible con el guardado anterior y la importación 1.2. Incluye cofres, fragmentos, guías, estaciones y visitas; no altera XP/monedas/desbloqueos existentes.
- **Game Studio**: 12 slots intactos; sin imágenes de IA. El HUB, `serums-quest-legacy`, `archivo/`, `_backups/` e `INTEGRITY.sha256` no se tocaron.

Evidencia final: [`.work/v2/evidence/`](.work/v2/evidence), [`.work/v2/qa/`](.work/v2/qa), informe [`docs/V2-FINAL.md`](docs/V2-FINAL.md). Capturas de referencia: [atrio con mundo](.work/v2/evidence/w01-atrio-mundo.png), [cofre](.work/v2/evidence/w04-cofre.png), [guía](.work/v2/evidence/w06-guia.png), [biblioteca](.work/v2/evidence/w11-biblioteca-con-ficha.png), [sombra](.work/v2/evidence/w13-sombra-panel.png), [restauración nivel 3](.work/v2/evidence/w18-atrio-mastery-etica.png).

## V2 · Checkpoint 1 (6 de noviembre de 2026) · histórico

> Entrega de checkpoint. **No es la versión final V2**: el mundo interactivo (Agente 6) se integra después del OK del usuario. Versión visible en Ajustes: **V2 · Checkpoint 1**.

- **Selector de héroes** en carrusel: tarjeta central con fondo propio, modelo 3D giratorio con arma y cosméticos equipados, laterales parciales, avatar y monedas arriba, nombre/clase/descripción/rareza/atributos y botón **Elegir / En ruta / Comprar ◇ / Bloqueado con requisito**. Gestos táctiles, arrastre de ratón, rueda y teclado (`←` `→`, `Home/End`, `Enter`, `Esc`).
- **Combate V2**: aviso y golpe propio de cada guardián (raíces y hojas; pulso de luz; reflejos y balanzas; rayos de prisma; engranajes y planos), ataques de héroe por arma, escudos, partículas, sacudida suave ≤ 0.14, números de daño, derrota y cambio de fase en jefes. Sin violencia explícita.
- **Mundo visual**: 60 props nuevos (12 por isla) + 5 esbirros decorativos + 5 variantes de arena + cielo/auroras/polvo. Todo en código, con `InstancedMesh`/`mergedVoxels` y presupuesto por calidad (bajo/medio/alto).
- **Banco pedagógico**: 951 preguntas. 111 originales de campaña, 210 de fichas de Study Dashboard (generadas desde texto literal) y 630 de Study Flashcards (420 MCQ literales + 210 tarjetas abiertas convertidas con distractores del propio banco). Explicaciones en las 951; 321 marcadas como generadas (210 fichas + 111 originales).
- **Feedback tras cada respuesta**: veredicto neutro, clave, explicación breve, «por qué no encaja tu opción» cuando falla, **Continuar** (Enter/Espacio), **Marcar como difícil** y **Ver en flashcard** local. En Simulacro no hay overlay (clave al final); en Contrarreloj el reloj se congela mientras se lee.
- **Mezcla de fuentes** configurable en Ajustes (por defecto 60 % campaña / 15 % fichas / 25 % flashcards), normalizada a 100 % y persistente. Solo cambia la procedencia: XP, monedas, repaso espaciado y tope diario de 120 no se tocan.
- **Rendimiento**: 75 FPS mínimo/medio en atrio, mapa y duelo a 960×540 con GPU; 0 peticiones de red y 0 errores de script en la pasada de QA. Calidad de efectos y «reducir movimiento» siguen funcionando y persisten.
- **QA final**: 51 casos · 50 PASS · 0 FAIL · 1 NOTE (warnings preexistentes de Three.js). Build `850400a8e762` (SHA-256 `850400a8e762534abdd66588538326d0462f221f49c4676da14cf618c2e13a6e`). Informe: [`.work/v2/evidence/agent7-report.md`](.work/v2/evidence/agent7-report.md); capturas definitivas `agent7-cp1-*` en [`.work/v2/evidence/`](.work/v2/evidence).
- **Guardado**: compatible con el guardado anterior y con la importación 1.2; los pesos y el estado nuevo son campos opcionales. Importación/exportación verificadas.
- **Copia de seguridad de esta entrega**: `C:\Users\USARIO\Documents\ZARCONT SERUMS-BACKUPS\SERUMS-QUEST_v66_2026-11-06_0727.zip` (SHA-256 `753ECA3D9C29BC9853151C910900EFB86BD79103D049D62D648422A086BFCFBE`).

Evidencia: [`.work/v2/content-report.md`](.work/v2/content-report.md), [`.work/v2/evidence/`](.work/v2/evidence), [`.work/v2/qa/`](.work/v2/qa). Informe del checkpoint: [`docs/V2-CHECKPOINT1.md`](docs/V2-CHECKPOINT1.md). Capturas de referencia: [selector](.work/v2/evidence/01-selector-heroes.png), [feedback de error](.work/v2/evidence/05-feedback-error-1-territorio.png), [ataque de territorio](.work/v2/evidence/04-ataque-1-territorio-b.png), [mapa con props](.work/v2/evidence/07-mapa-completo.png).

**Continuación:** el mundo interactivo, la exportación final y la regresión completa se integraron en la sección **V2 · Final** de arriba. No se generaron imágenes con IA; los 12 slots de Game Studio no cambian.

## Fase 4 · mapa 3D

- **Mapa 3D** de las cinco islas con 18 nodos (13 misiones y 5 jefes), puentes de luz, caminos por isla y anillos de dominio.
- **Cuatro estados**: bloqueado, disponible, completado y dominado (≥80 %). Los jefes tienen puerta, arco y puertas correderas que se abren al cumplir requisitos.
- **Ficha de nodo**: nombre, área, mejor precisión, intentos, XP, monedas, cosmético posible, requisitos neutros y entrada al duelo.
- **Siguiente paso**: el repaso vencido tiene prioridad; si no hay repaso, se recomienda la próxima misión disponible. Los nodos afectados llevan marcador discreto.
- **Progreso**: anillo por isla y resumen global de misiones completadas, dominadas y jefes.
- **Navegación**: rotación con arrastre, zoom con rueda/pinza, teclado (`1–5` islas, `0` mapa completo, flechas, `+/-`), botones de isla y de mapa completo.
- **Acceso**: botón **Mapa** del HUD (`M`), pausa y tecla. Arena y Bitácora siguen disponibles desde el mapa.
- **Sincronía**: estados calculados desde `missionUnlockInfo`, misiones, precisión, errores y guardado importado.
- **Animación**: caminos iluminados por tramo y puertas que se abren; sin pantalla bloqueante, la interacción sigue disponible.
- **FPS**: mapa 75/75; transición mapa → duelo 74/75; jefe 74/75 en Chrome headless 960×540.

### Capturas de Fase 4

- [Mapa completo con progreso importado](docs/fase4-mapa-completo.jpg)
- [Cinco islas](docs/fase4-islas.jpg)
- [Ficha de nodo bloqueado](docs/fase4-nodo-bloqueado.jpg)
- [Misión completada desde el mapa](docs/fase4-mision-desde-mapa.jpg)
- [Jefe derrotado](docs/fase4-jefe-mapa.jpg)

### Evidencia de estados y animación

- [Ficha Disponible: Territorio y decisión](docs/fase4-nodo-disponible.jpg)
- [Ficha Dominado: Ronda comunitaria](docs/fase4-nodo-dominado.jpg)
- [Fotograma de animación: puerta y camino al 55 %](docs/fase4-animacion-puerta-camino.jpg)

Para capturar la animación sin que el autoplay volviera al resultado se añadieron dos reglas de QA:
`devMapFocusGate` centra la cámara en la puerta del jefe y `devMapAnimFreeze` fija el fotograma en un punto intermedio (55 %). En la captura, las hojas de la puerta están a medio abrir y los caminos iluminados conservan la intensidad intermedia. El comportamiento normal no usa ninguna de estas reglas.

## Abrir

- **Game Studio:** proyecto `serums-quest`, carpeta de trabajo `.` (esta misma carpeta). Aparece como **SERUMS QUEST** en la barra lateral.
- **Build autónoma:** [`dist/index.html`](dist/index.html).
- **HUB:** el enlace histórico `./serums-quest/index.html` abre `index.html`, que redirige a `dist/index.html`.
- **Exportación de un solo archivo:** [`export/serums-quest-final.html`](export/serums-quest-final.html).
- El juego no usa red, servidores ni recursos externos.

## Migración de nombre (6 de noviembre de 2026)

- `serums-quest-voxel` pasó a ser el proyecto principal: su contenido se promovió a `ZARCONT SERUMS\serums-quest`. En Game Studio la ruta ahora es `.`.
- La versión 2D anterior se movió íntegra a `ZARCONT SERUMS\serums-quest-legacy`, con [`README-ARCHIVO.md`](../serums-quest-legacy/README-ARCHIVO.md). No se editó ninguno de sus archivos; solo se añadió ese aviso.
- El título visible del manifiesto y de Game Studio pasó a **SERUMS QUEST**; el subtítulo «Observatorio de las cinco rutas» se conserva en pantalla.
- Se conservan el arte, la campaña, las versiones de Game Studio y los guardados. La barra lateral muestra las 15 últimas versiones (51–65); el resto sigue en `.studio/versions` y se puede restaurar por número.
- `index.html` en esta carpeta redirige a `dist/index.html` para que el enlace del HUB siga funcionando.
- Copia previa verificada byte a byte: 419 archivos del espacio de trabajo y 374 del proyecto voxel, más los ZIP equivalentes.

## Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Moverse por el observatorio | `WASD` / flechas | D-pad |
| Hablar con una puerta o el atlas | `E` / `Enter` | Botón de acción |
| Abrir la bitácora | `M` | Botones del HUD |
| Elegir héroe | `H` / `C` | Botones del HUD |
| Carrusel de héroes | `←` `→` / `Home` `End` / `Enter` / `Esc` | Deslizar, tocar laterales, botones |
| Abrir inventario y equipador | `I` | Icono de capas del HUD |
| Tienda de ecos | Botón del HUD / pausa | Botón del HUD / pausa |
| Repaso de errores | `R` | Botón del HUD |
| Pausa / volver | `Esc` | Botón de pausa |
| Responder en un duelo | `A B C D` o `1 2 3 4` | Tarjetas |
| Continuar tras responder | `Enter` / `Espacio` | Botón «Continuar» |

## Fase 3

### Catálogo

- **69 cosméticos**: los **33 originales** con sus nombres, ranuras, precios y requisitos, más **36 extras**.
- **12 ranuras de equipamiento**: las 9 originales (`cabeza`, `peinado`, `torso`, `piernas`, accesorio principal, accesorio adicional, amuleto, efecto, marco) y tres nuevas:
  - **Mascota**: Luciérnaga, Búho cometa y Zorro de tinta; una activa a la vez.
  - **Estela**: Estela de racha.
  - **Título**: ocho textos junto al nombre, ligados a logros.
- Los 33 originales y los extras con cuerpo se modelan con geometría voxel modular. Los títulos son texto de interfaz, no una pieza 3D.
- **Compatibilidad abierta a los 10 héroes**, con anclajes por proporción para Kian (ancho), Zenón (capucha), Mara (sombrero), Amaru (capucha), Noa, Teo, Lía, Ilan, Ona e Iris.

### Conflictos y silueta

- La pieza de `cabeza` prevalece sobre el tocado base; se oculta solo la pieza base que choca. Cada héroe conserva arma, proporciones y anclas de identidad.
- Mara conserva poncho, mochila y bastón; Amaru conserva capa, gafas y poncho; Zenón conserva barba, hombros y bastón; Kian conserva hombros y martillo. La calva de Kian se puede cubrir con tocado o peinado.
- Los cosméticos de torso son capas externas; los accesorios de brazo siguen el hueso del brazo y los efectos de arma se anclan al arma. Mascota, estela y marco van en capas que no cruzan el cuerpo.
- **Marcos**: aro holográfico 3D detrás del héroe y marco del retrato 2D. Ajustes permite ocultar solo el aro 3D.

### Rareza

Común, poco común, raro, épico y legendario se muestran con color, borde y brillo en la interfaz. Las piezas raras o superiores reciben un acento luminoso; las legendarias, un brillo adicional. La rareza es estética: no cambia estadísticas.

Luciérnaga empieza **rara** y pasa a **legendaria** en su etapa de 60 días. Los tocados de dominio base son épicos; sus versiones doradas, legendarios.

### Inventario y equipador

- Vista previa 3D en vivo con arrastre para girar.
- Comparación entre **atuendo guardado** y **borrador** antes de guardar.
- Filtros por ranura y rareza; estados **Bloqueado / Poseído / Equipado / Probando / Actual**.
- Ficha con descripción, rareza, ranura, procedencia, progreso, etapas y requisitos.
- Guardar, descartar y quitar piezas. El borrador no modifica al héroe hasta guardar.

### Tienda

- Los **33 originales** conservan precio y requisitos originales:
  - Tienda directa para la mayoría.
  - Corona de constelaciones: nivel 10 + ◇900.
  - Reliquia del criterio: logro Criterio + ◇600.
  - Constelación de logros: logro Semana completa + ◇950.
  - Marco de constelación: logro Cartógrafo + ◇1.000.
- Confirmación de compra con precio, saldo posterior y comprobante. No se puede comprar dos veces ni dejar saldo negativo.
- Los extras no se venden: se desbloquean jugando.

### Desbloqueos extra

- **Constancia**: Estela de racha (7/14/30 días), Luciérnaga (7/21/60) y Aura del amanecer (14).
- **Repaso**: Capa del Errorario (10 recuperaciones), Reloj de arena flotante (10 repasos en fecha) y Cuaderno orbital (5 repasos anticipados).
- **Dominio**: 5 tocados base (≥80 % en todas las misiones regulares del área) y 5 dorados (base + ≥90 % en el jefe).
- **Jefes**: 5 trofeos flotantes por guardián derrotado y 5 efectos de arma con ≥80 % en el jefe.
- **Mascotas**: Búho cometa (nivel 5; etapas 15/30) y Zorro de tinta (3 logros; accesorios a 8/13).
- **Títulos**: Primer paso, En ruta, Cartógrafo, Criterio, Primer custodio, Semana completa, Círculo cerrado y Maestro SERUMS.

La racha usa días con al menos una misión o repaso, con **un día de gracia por semana ISO**. Los cosméticos de racha usan el **mejor registro**, de modo que un cosmético ya ganado nunca se pierde. No hay cuentas regresivas ni lenguaje de culpa.

### Recompensas y anti-sobreuso

- Tope de **120 monedas al día**; las recompensas de cierre y los logros se pagan una sola vez.
- El resultado de misión y de repaso muestra un aviso neutro con el siguiente cosmético ganable y su progreso.
- No hay compras con dinero real ni cosméticos que alteren preguntas, claves o recompensas.

### Ajustes

- Calidad de efectos **baja / media / alta**: cambia la densidad de partículas y brillos.
- Mostrar u ocultar marcos holográficos 3D. El marco del retrato se conserva.
- Sonido, ambiente, importación, exportación y reinicio local.

## Persistencia e importación

- Guardado del juego: `serumsquest:voxel:state:v1`; ajustes: `serumsquest:voxel:settings:v1`.
- Snapshot para el HUB: `serumsquest:snapshot:v1`. Se deriva del guardado y se reescribe al ganar XP, al subir de nivel, al guardar y al abrir una partida con progreso. No se incluye en el JSON de exportación ni sustituye al guardado. El HUB no se modificó.
- El equipamiento de cada héroe se guarda por ranura y se restaura al abrir.
- Importador del JSON de **SERUMS QUEST 1.2** con progreso, misiones, errores, logros, personajes, cosméticos y equipamiento. Los cosméticos importados aparecen poseídos y se pueden equipar; el equipamiento antiguo se valida y se conserva si la pieza pertenece al héroe.
- **Usar partida local:** en la pantalla de importación, la versión nueva detecta las claves antiguas `serumsquest:state:v1`, `serumsquest:backup:v1` y `serumsquest:journal:v1` del mismo navegador y ofrece importarlas sin archivo. Las claves viven en `localStorage`, no en la carpeta, así que no cambian al mover los proyectos.
- Antes de importar se conserva una copia del estado actual (`serumsquest:voxel:preimport:v1`).

## Snapshot para el HUB

El panel «Nivel y XP» del HUB llama a `applyQuestSnapshot()` y lee la clave `serumsquest:snapshot:v1`. El juego la escribe con el formato exacto que ese panel consume:

| Campo | Uso en el HUB |
| --- | --- |
| `level` | «Nv N» |
| `levelPercent` | ancho de la barra de nivel (0–100) |
| `rank` | primera parte de la nota: «rango · XP · respuestas» |
| `xp` | segunda parte de la nota: «… XP …» |
| `answered` | tercera parte de la nota: «… respuestas» |
| `hasActivity` | si es `false`, la nota muestra «Sin actividad registrada todavía» |
| `lastSession.title` | fila «Última sesión» (opcional) |

Además se escriben `version`, `schemaVersion`, `updatedAt`, `xpToNext`, `coins`, `stage`, `stageName`, `accuracy`, `missions`, `bosses`, `mastered`, `streak`, el personaje activo y los tamaños de colección. Son contexto compatible con el snapshot de la app 1.2; el HUB no los necesita.

Cuándo se escribe:

- En cada `persist()`: respuestas, cierre de misión, ajustes, importación, reinicio y exportación.
- En `applyXpCoins()`, inmediatamente después de sumar XP o monedas; el nivel y `levelPercent` se recalculan en la misma escritura.
- Al terminar una sesión, con `lastSession` de esa sesión.
- Al abrir el juego con un guardado que ya tiene progreso, para regenerar un panel antiguo.

No se escribe si el guardado está corrupto (`recoveryLock`) o si el navegador bloquea `localStorage`. El snapshot nunca reemplaza al guardado: si falla su escritura, la partida sigue funcionando.

## Rendimiento

Medido en Google Chrome headless, 960×540:

- **Peor caso de 12 ranuras a calidad alta**: mínimo **67 FPS**, media **74 FPS**, sin errores de script.
- Partida limpia final: mínimo **68 FPS**, media **74 FPS**.
- Derrota con equipo completo: mínimo **68 FPS**, media **72 FPS**.
- El atuendo completo incluye cabeza, peinado, torso, piernas, accesorios, extras, amuleto, efecto, marco, mascota, estela y título. Ningún conjunto probado bajó de 60 FPS. Los números pueden variar en otros equipos.

## Capturas del checkpoint

- Close-ups con cosméticos:
  - [Kian y Noa](docs/fase3-closeups-1.jpg)
  - [Lía y Zenón](docs/fase3-closeups-2.jpg)
- Una pieza por ranura:
  - [Ranuras 1–6](docs/fase3-ranuras-1.jpg)
  - [Ranuras 7–12](docs/fase3-ranuras-2.jpg)
- [Duelo con el atuendo completo](docs/fase3-duelo-equipado.jpg)
- [Victoria con equipo](docs/fase3-victoria-equipada.jpg)
- [Derrota con equipo y escudo](docs/fase3-derrota-equipada.jpg)
- [Compra en la tienda](docs/fase3-tienda-compra.jpg)
- [Cosmético importado equipado](docs/fase3-importado-equipado.jpg)
- [Aviso de progreso en el resultado](docs/fase3-resultado-pista.jpg)

## Arquitectura

```
game.js                         Build jugable (generada)
game.json                       Título, orientación, slots de arte y reglas
src/campaign.json               Campaña y 33 cosméticos originales
src/extras.json                 36 cosméticos extra y 3 ranuras nuevas
.work/src/part1-core.js         Estado, economía, guardado, logros y snapshot del HUB
.work/src/part2-world.js        Escena, héroes, guardianes, retratos
.work/src/part3-ui.js           HUD, bitácora, héroes, resultado
.work/src/part3b-cosmetics-core.js  Catálogo, progreso, propiedad, tienda
.work/src/part3c-cosmetics-models.js Modelos 3D, acople y animación
.work/src/part3d-cosmetics-ui.js Inventario, tienda, ajustes y galerías
.work/src/part3e-cosmetics.css  Estilos de Fase 3
.work/src/part4-flow.js         Campaña, duelos, repaso, importación y bucle
.work/build-game.js             Ensambla fuentes, campaña y extras
docs/                           Capturas y evidencia de aprobación
dist/index.html                 Build autónoma
```

Para modificar:

```powershell
node .work/build-game.js
```

Después, reconstruir desde Game Studio.

## Verificación

- `node --check game.js`: correcto.
- Playtest final: título → duelo → resultado, 100 %, sin errores.
- Derrota con un corazón y escudo: estado `lost`, sin errores.
- Compra de Brújula de muñeca por ◇85 probada: saldo 2.510 → 2.425 y pieza en colección.
- Importación de una partida con cinco cosméticos: aparecen poseídos y Mara los conserva equipados.
- Las 12 ranuras tienen captura con una pieza equipada.
- Kian, Noa, Lía y Zenón tienen close-up con cosméticos.
- No se generaron imágenes con IA en esta fase.

### Migración verificada (6 de noviembre de 2026)

Copia previa: **419 archivos** del espacio de trabajo y **374** del proyecto voxel, idénticos por SHA-256 (0 faltantes, 0 extra, 0 distintos). Los dos ZIP se extrajeron y compararon con el mismo resultado. La carpeta legacy conserva sus **45 archivos** originales; solo se le añadió `README-ARCHIVO.md`.

Pruebas con Chrome headless y perfiles limpios, sobre el HTML exportado [`export/serums-quest.html`](export/serums-quest.html) (1.522.208 bytes):

| Comprobación | Resultado |
| --- | --- |
| Importar el JSON antiguo (fixture `Offline QA`) | Vista previa reconocida; importó perfil, 1.640 XP y 2.510 monedas; `importedFrom: SERUMS QUEST 1.2.x` |
| Importar un JSON exportado por la app 1.2 (archivo real) | Exportado desde `#/ajustes` de la versión archivada; perfil «Serumista»; `importedFrom: SERUMS QUEST 1.2.0` |
| «Usar partida local» con la clave antigua sembrada | Aviso y botón presentes; misma importación; la clave antigua queda intacta |
| «Usar partida local» real, con la app 1.2 cerrada y reabierta | La app archivada escribió `serumsquest:state:v1`; el nuevo HTML, en el mismo perfil y ruta distinta, la detectó, previsualizó e importó |
| Persistencia tras recargar | Perfil, XP y monedas se conservan; aparece «Continuar en el observatorio» |
| Persistencia tras cerrar y reabrir el navegador | Perfil, XP y monedas se conservan (cierre ordenado de Chrome) |
| Guardado de ajustes | El cambio de sonido se escribe en `serumsquest:voxel:settings:v1` y persiste al recargar |
| Red y consola | 0 peticiones de red del juego, 0 errores de script |
| Enlace del HUB | `serums-quest/index.html` → `dist/index.html`; título «SERUMS QUEST»; el juego carga |
| Versiones de Game Studio | La 65 («Proyecto principal · migración de nombre») y las 64–51 siguen en la barra lateral (15 entradas); `.studio/versions` conserva 26–65 |
| Playtest del build migrado | Fase `playing`, 75 FPS mínimo/medio, sin errores |

Evidencia cruda: [`.work/migration-verify.json`](.work/migration-verify.json), [`.work/migration-verify-legacy-export.json`](.work/migration-verify-legacy-export.json), [`.work/migration-verify-local-real.json`](.work/migration-verify-local-real.json), [`.work/migration-verify-redirect.json`](.work/migration-verify-redirect.json) y [`.work/migration-verify-reopen.json`](.work/migration-verify-reopen.json).

El manifiesto `INTEGRITY.sha256` del HUB se actualizó solo en las **45 rutas** de la versión archivada (`serums-quest/…` → `serums-quest-legacy/…`); ningún hash cambió. La verificación sigue en 673 archivos comprobados, 25 modificados previamente y 0 faltantes.

### Snapshot del HUB (6 de noviembre de 2026)

Prueba automatizada con Chrome headless y perfiles limpios sobre el build `dist/index.html`: [`.work/verify-hub-snapshot.js`](.work/verify-hub-snapshot.js). Evidencia: [`.work/hub-snapshot-verify.json`](.work/hub-snapshot-verify.json). El HUB no se editó.

Secuencia real: HUB → tarjeta de SERUMS QUEST → tutorial → menú → Bitácora → misión «Ronda comunitaria» → 5 respuestas correctas → resultado → volver al HUB → recargar.

| Comprobación | `file://` | `http://127.0.0.1:8124` |
| --- | --- | --- |
| Snapshot tras la 1.ª respuesta | `xp:10`, `answered:1`, `level:1` | `xp:10`, `answered:1`, `level:1` |
| Snapshot al cerrar la misión | `xp:130`, `answered:5`, `level:2`, `lastSession.title: «Ronda comunitaria»` | igual |
| Panel del HUB al volver | «Nv 2» · «Bachiller · 130 XP · 5 respuestas» · barra 38,5 % · «Última sesión: Ronda comunitaria» | igual |
| Panel del HUB tras recargar | igual | igual |
| Guardado tras recargar el juego | `xp:130`, `level:2`, `answered:5`; el snapshot se conserva | — |
| Exportar partida | JSON válido con `xp:130` | — |
| Importar la partida 1.2 «Offline QA» | 1640 XP, nivel 7, 42 respuestas; snapshot y panel del HUB coinciden | — |
| Panel del HUB tras importar y recargar | «Nv 7» · «Bachiller · 1640 XP · 42 respuestas» | — |
| Errores de script | 0 | 0 |

El HTML exportado [`export/serums-quest.html`](export/serums-quest.html) también se comprobó con un guardado sembrado de 130 XP: escribe el snapshot, y el HUB muestra «Nv 2» · «Bachiller · 130 XP · 5 respuestas» antes y después de recargar. Evidencia: [`.work/export-snapshot-verify.json`](.work/export-snapshot-verify.json).

La suite histórica [`.work/verify-hub-entry.js`](.work/verify-hub-entry.js) también se ejecutó: `file://` sin red, importación/exportación y «Usar partida local» pasan con 0 errores; el HTML exportado encuentra el mismo guardado. Su subprueba HTTP del botón de la barra falla por orden de prueba: al volver al HUB la tarjeta QUEST sigue activa (el HUB recuerda la selección), el primer clic ya abre el juego y `#openCurrent` deja de existir. No se modificó el HUB; la prueba HTTP específica del snapshot abre el juego desde la tarjeta y pasa.

## Límites conocidos

- Los cosméticos se dibujan en código; no hay piezas de arte externas ni generación de IA. Los 12 slots de arte de Game Studio no cambian.
- Los títulos son texto junto al nombre, no geometría 3D.
- La racha de constancia se basa en días con actividad de estudio, no en el antiguo Desafío diario.
- La tienda contiene los 33 originales; los extras solo se ganan jugando.
- Los modos Diario, Supervivencia, Contrarreloj, Simulacro y Registro siguen fuera de esta versión.
- El mapa de islas completo y la sustitución visual de todas las pantallas antiguas quedan para fases posteriores.
- Las pruebas de la migración son de escritorio, Chrome headless 960×540. No se repitieron en móvil real, Safari ni Firefox.
- Al guardar la versión 65, el tope normal del plugin (15 entradas visibles, 40 archivos de versión) rotó la **50** fuera de la lista de la barra lateral y el archivo **25.json** fuera de `.studio/versions`. No se perdió contenido: `50.json` sigue en disco y es restaurable por número, y la copia de seguridad conserva las versiones 25–64.
- El manifiesto de integridad del HUB no incluye los archivos del proyecto voxel (nunca los incluyó); solo se repuntaron las rutas de la versión archivada.
- La versión archivada carga Google Fonts desde la red, como hacía originalmente; el juego vigente no hace peticiones externas.
- El HUB y el juego deben abrirse desde el mismo origen para compartir `localStorage`: `file://` con `file://`, o el mismo host y puerto HTTP. Un guardado abierto en `file://` no aparece en `http://` (ni al revés), porque el navegador separa el almacenamiento por origen. La prueba del snapshot se hizo por separado en cada uno.
- La fila «Última sesión» del HUB es opcional y se rellena sin añadir campos nuevos al guardado: muestra la sesión recién terminada y, al reabrir el juego, la última misión registrada (o queda vacía si no hay ninguna). Nivel, XP y respuestas no dependen de esta fila.

