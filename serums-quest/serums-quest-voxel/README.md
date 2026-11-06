# SERUMS QUEST · Observatorio de las Cinco Rutas

**Fase 4 — Mapa de avance.** RPG 3D voxel construido sobre la campaña, los personajes, la progresión, los cosméticos y las cinco islas flotantes de SERUMS QUEST.

**Checkpoint guardado:** *Fase 4 · mapa de avance · checkpoint*.

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

## Controles

## Abrir

- Vista previa / proyecto: **DSH Game Studio → SERUMS QUEST: Observatorio de las Cinco Rutas**.
- Build autónoma: `dist/index.html`.
- El juego no usa red, servidores ni recursos externos.

## Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Moverse por el observatorio | `WASD` / flechas | D-pad |
| Hablar con una puerta o el atlas | `E` / `Enter` | Botón de acción |
| Abrir la bitácora | `M` | Botones del HUD |
| Elegir héroe | `H` / `C` | Botones del HUD |
| Abrir inventario y equipador | `I` | Icono de capas del HUD |
| Tienda de ecos | Botón del HUD / pausa | Botón del HUD / pausa |
| Repaso de errores | `R` | Botón del HUD |
| Pausa / volver | `Esc` | Botón de pausa |
| Responder en un duelo | `A B C D` o `1 2 3 4` | Tarjetas |
| Continuar tras responder | `Enter` | Botón «Siguiente» |

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
- El equipamiento de cada héroe se guarda por ranura y se restaura al abrir.
- Importador del JSON de **SERUMS QUEST 1.2** con progreso, misiones, errores, logros, personajes, cosméticos y equipamiento. Los cosméticos importados aparecen poseídos y se pueden equipar; el equipamiento antiguo se valida y se conserva si la pieza pertenece al héroe.
- Antes de importar se conserva una copia del estado actual (`serumsquest:voxel:preimport:v1`).

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
.work/src/part1-core.js         Estado, economía, guardado, logros
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

## Límites conocidos

- Los cosméticos se dibujan en código; no hay piezas de arte externas ni generación de IA. Los 12 slots de arte de Game Studio no cambian.
- Los títulos son texto junto al nombre, no geometría 3D.
- La racha de constancia se basa en días con actividad de estudio, no en el antiguo Desafío diario.
- La tienda contiene los 33 originales; los extras solo se ganan jugando.
- Los modos Diario, Supervivencia, Contrarreloj, Simulacro y Registro siguen fuera de esta versión.
- El mapa de islas completo y la sustitución visual de todas las pantallas antiguas quedan para fases posteriores.
