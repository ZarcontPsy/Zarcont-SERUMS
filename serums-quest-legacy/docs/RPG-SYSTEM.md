# SERUMS QUEST · Sistema RPG

**Build:** `ZARCONT-SQ-1.2.0` · **Esquema:** `2` · **Catálogo:** 10 personajes · 33 cosméticos · 9 ranuras  
Este documento describe la capa de juego construida sobre la aplicación académica existente. Las reglas de XP, monedas, misiones y evaluación siguen en `docs/GAME-RULES.md`; aquí se documenta la presentación, la colección, el equipamiento, los escenarios y el audio.

---

## 1. Alcance

La aplicación conserva el banco oficial de Psicología, el temario de Study, XP, niveles, rangos, etapas, misiones, monedas, recuperación, logros, historial y persistencia. La capa RPG añade:

1. **Game Home cinematográfico** con escenario por área, protagonista a gran escala, misión recomendada, elenco, modos y resumen semanal.
2. **Colección de 10 personajes originales** con rareza, precio, requisito, atributos, personalidad, ranuras y animaciones.
3. **Selector de héroes tipo arena** con escenario, vecinos, puntos, flechas, teclado, tira de elenco, filtros y detalle.
4. **Estudio de equipamiento** que unifica inventario y personalización: vista previa en vivo, ranuras alrededor del personaje, filtros, compra contextual, guardado, descarte y restauración.
5. **Tienda** conectada al saldo real, con confirmación, faltante exacto e historial de transacciones.
6. **Escenarios SVG originales** por área, con profundidad, luz, niebla y partículas; se usan en inicio, selector, equipamiento, resultado y desbloqueo.
7. **Audio original opcional** sintetizado en WebAudio: 17 efectos y un pad ambiental; sin archivos binarios, sin autoplay y con volumen independiente.
8. **Navegación de juego en cinco secciones** (Inicio, Personajes, Inventario, Tienda, Progreso) con barra inferior en móvil y subnavegación de Progreso.
9. **Reacciones y animaciones** conectadas a respuestas, rachas, errores, resultados, subidas de nivel y desbloqueos.
10. **Preferencias de presentación y audio**, respeto a `prefers-reduced-motion`, pausa de animaciones fuera de pantalla y caché de arte.

---

## 2. Arquitectura

### 2.1 Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `js/characters.js` | Catálogo puro de personajes y cosméticos; precios desde configuración; compatibilidades y metadatos de ranura. No lee estado. |
| `js/character-art.js` | Ilustraciones SVG por capas, degradados, detalles de vestuario, 33 overlays cosméticos, maniquí neutro, caché de retratos y previews. |
| `js/scenes.js` | Cinco escenarios SVG originales por área de afinidad; capas de cielo, arquitectura, suelo, niebla y partículas. Sin recursos externos. |
| `js/audio.js` | Síntesis WebAudio de 17 efectos y pad ambiental procedural; compresor, reverb por convolución generada, preferencias y desbloqueo por gesto. |
| `js/collection.js` | Colección, compras, equipamiento, filtros, requisitos, normalización y validación. |
| `js/reactions.js` | Mensajes por personalidad y evento; frases de inicio y desbloqueo. |
| `js/app.js` | Router, pantallas, Game Home, selector, estudio de equipamiento, tienda, acciones, audio e integración con el motor. |
| `styles-rpg.css` | Base RPG heredada: rarezas, vitrina, atributos, reacciones, tienda, responsive. |
| `styles-game.css` | Capa de juego 1.2: HUD, navegación, escenarios, Game Home, arena de héroes, estudio de equipamiento, audio y resultado. |

### 2.2 Archivos extendidos

`js/config.js` (versión 1.2.0, preferencias de audio por defecto), `js/store.js` (normalización y snapshot), `js/engine.js` (entrega de personajes de recompensa), `index.html` (HUD, navegación de cinco secciones, scripts y versiones), `tests/*` y documentación.

### 2.3 Estado persistido

El documento sigue en `serumsquest:state:v1` con `schemaVersion: 2`.

```js
collection: {
  ownedCharacterIds: ["ilan"],
  ownedCosmeticIds: [],
  selectedCharacterId: "ilan",
  equipped: { "ilan": { "cabeza": "c-cabeza-diadema" } },
  previousOutfits: { "ilan": { "torso": "c-torso-chaleco" } },
  unlockedBy: { "ilan": { method: "starter", at: null, price: 0 } }
},
economy: {
  transactions: [{ id, at, kind: "character|cosmetic", itemId, name, price, balanceAfter }],
  lifetimeSpent: 0
},
presentation: {
  animationPreferences: { idle: true, reactions: true, celebrate: true },
  visualPreferences: { rarityFrames: true, particles: true },
  audioPreferences: { muted: false, sfxVolume: 0.55, musicVolume: 0.22, music: false }
}
```

- El equipamiento se guarda **por personaje**; cambiar de personaje recupera su atuendo.
- `previousOutfits` conserva el atuendo inmediatamente anterior por personaje.
- `unlockedBy` distingue `starter`, `purchase` y `reward`.
- `audioPreferences.music` empieza en `false`: la música ambiental es opcional y no se reproduce sin decisión explícita.
- Los volúmenes se normalizan al rango `0..1`; el silencio no borra los valores elegidos.

### 2.4 Migración y validación

- Un estado con esquema 1 se normaliza a esquema 2 sin reiniciar XP, monedas, preguntas, errores, misiones, logros, sesiones ni perfil.
- La normalización descarta equipamiento no poseído, incompatible o de una ranura inexistente; **no** elimina cosméticos del inventario.
- La validación comprueba que el personaje seleccionado esté en la colección y que todo lo equipado pertenezca al inventario.
- Las compras se ejecutan dentro de un único `commit`: si una comprobación falla, el almacén restaura el estado anterior.
- Las preferencias de audio ausentes se completan con los valores por defecto; una preferencia inválida se recorta, no se guarda tal cual.

### 2.5 Estados del personaje

Los retratos exponen `data-state`: `idle`, `correct`, `streak`, `wrong`, `defeat`, `victory`, `levelup`, `unlock`. Cada personaje declara además una variante de victoria (`availableAnimations`, por ejemplo `victory-staff`), implementada con animaciones CSS específicas de su prop.

---

## 3. Navegación y pantallas

### 3.1 Cinco secciones primarias

| Sección | Ruta | Contenido |
| --- | --- | --- |
| Inicio | `#/` | Game Home: héroe, escenario, misión recomendada, elenco, modos, semana y actividad. |
| Personajes | `#/personajes` | Arena de héroes, filtros, detalle, equipo, animaciones y tira de elenco. |
| Inventario | `#/inventario` y `#/inventario/:id` | Estudio de equipamiento del personaje elegido. |
| Tienda | `#/tienda` | Destacados, personajes y cosméticos con compra real. |
| Progreso | `#/perfil` | Perfil y subnavegación a Logros, Registro, Recuperación y Ajustes. |

La barra superior mantiene Inicio, Personajes, Inventario, Tienda y Progreso, además de héroe activo, monedas, **Jugar**, audio, tema y reanudación. En móvil la navegación principal se sustituye por una barra inferior fija de cinco destinos. `#/personalizar/:id` sigue funcionando como alias del estudio para enlaces antiguos.

### 3.2 Jugar

El botón **Jugar** abre `#/mapa` y queda marcado mientras el jugador está en mapa, misión, modo o sesión. Es visualmente distinto de las pestañas de colección y no sustituye la navegación principal.

### 3.3 Subnavegación de Progreso

Perfil, Logros, Registro local, Recuperación y Ajustes comparten una subnavegación con estado activo y `aria-current`. El destino «Progreso» de la barra principal apunta a `#/perfil`.

---

## 4. Game Home

- Escenario SVG del área del héroe con capas de profundidad, niebla y partículas; `data-parallax` mueve escena y figura con el puntero.
- Saludo contextual, rango, etapa, nivel, héroe y estrellas de rareza.
- Retrato grande con placa de nombre; el atuendo guardado se refleja.
- Frase de personalidad, nivel/XP, CTA principal y cambio de héroe.
- Misión recomendada calculada con el estado real; enlace a mapa y a la misión.
- Accesos HUD a Héroes, Inventario, Tienda y Progreso.
- Próximo desbloqueo con progreso real (por ejemplo, Zenón: nivel 8 y 5.400 monedas).
- Tira de elenco con todos los personajes; los bloqueados muestran candado, rareza y nombre, sin arte inventado.
- Modos, semana (racha, sesiones, misión, precisión, dominio) y últimas sesiones.

---

## 5. Colección y personajes

| id | Nombre | Título | Personalidad | Rareza | Precio | Desbloqueo | Ranuras |
| --- | --- | --- | --- | --- | ---: | --- | ---: |
| `ilan` | Ilan Vega | Brújula del Alba | Estratega | Inicial | 0 | Inicial | 9 |
| `mara` | Mara Solís | Exploradora de Territorio | Exploradora | Común | 480 | Compra | 9 |
| `noa` | Noa Iturbe | Ojo de la Evidencia | Investigadora | Poco común | 950 | Compra | 9 |
| `teo` | Teo Alcázar | Mentor de la Escucha | Mentor | Poco común | 1.100 | Compra | 9 |
| `lia` | Lía Márquez | Chispa del Criterio | Prodigio | Raro | 1.750 | Compra | 9 |
| `kian` | Kian Ferro | Guardián del Método | Guardián | Raro | 1.950 | Compra | 8 (sin peinado) |
| `amaru` | Amaru Cielo | Vigía de la Ruta | Exploradora | Raro | 0 | 5 misiones completadas | 8 (sin cabeza) |
| `ona` | Ona Beltrán | Arquitecta del Sistema | Estratega | Épico | 3.200 | Compra | 9 |
| `iris` | Iris Calderón | Custodia de la Confianza | Guardián | Épico | 3.600 | Compra | 9 |
| `zenon` | Zenón Atlas | Cronista del Dominio | Mentor | Legendario | 5.400 | Nivel 8 + compra | 8 (sin peinado) |

Cada personaje define descripción, cita, área de afinidad, cinco atributos descriptivos, ventaja de presentación, ranuras, cosméticos compatibles, animaciones y referencias de arte.

### 5.1 Arena de héroes

- Escenario con héroe central, vecinos difuminados, flechas anterior/siguiente, puntos y `aria-current`.
- Panel izquierdo: personalidad, descripción, cita, afinidad temática y armario compatible con progreso.
- Panel derecho: atributos, rareza, precio, compatibles, equipo por ranura, ventaja, gesto y previsualización de estados.
- Tira inferior con todo el elenco; filtros por estado, rareza y orden.
- Inspeccionar **no** cambia el personaje activo. Cambiar de héroe es una acción explícita.
- Teclado: `←`/`→` cambian el héroe inspeccionado; `Home`/`End` van a los extremos.
- En móvil el escenario pasa primero y los filtros después, para no enterrar al héroe bajo una pared de controles.

---

## 6. Cosméticos y estudio de equipamiento

### 6.1 Categorías

Nueve ranuras: cabeza, peinado, torso, piernas, accesorios, extras (accesorio adicional), amuletos, efectos y marcos. Cada cosmético declara compatibilidad por personaje y rareza; los incompatibles se muestran con explicación y no se pueden equipar.

### 6.2 Estudio

- Vista previa grande del personaje con su atuendo **borrador** (sin guardar), alrededor de las ranuras.
- Ranuras clicables: seleccionan categoría y abren su inventario.
- Filtros por categoría, propiedad (todos/obtenidos/no obtenidos) y orden (rareza, precio, nombre).
- Tarjetas con recorte del cosmético, rareza, estado y precio/requisito.
- Detalle con descripción, compatibilidad, requisitos y acción: probar, quitar o comprar.
- Hacer clic en un objeto compatible y obtenido lo aplica al borrador de inmediato; el personaje se actualiza en vivo.
- Barra de guardado fija con estado «cambios sin guardar / atuendo guardado», descartar, restaurar anterior y guardar.
- Al guardar se actualiza el atuendo del personaje sin cambiar el personaje activo.
- Rutas `#/inventario/:id` y alias `#/personalizar/:id`.

### 6.3 Compatibilidad y seguridad

- No se puede equipar un objeto no poseído, incompatible o de una ranura inexistente.
- La normalización vuelve a validar todo lo equipado al cargar.
- Comprar no equipa automáticamente; el jugador decide.
- Los objetos incompatibles siguen visibles para explicar por qué no se pueden usar.

---

## 7. Arte, escenarios y audio

### 7.1 Arte vectorial

- **10 personajes originales** dibujados en SVG por capas; **33 cosméticos** dibujados en el mismo sistema de coordenadas.
- Proporciones revisadas en 1.2: cabeza escalada respecto al torso, cuello separado, hombros y piernas más largos, botas con suela y costuras, mangas con contorno y puños, pliegues y detalles de tela.
- Degradados de piel, tela y cabello; luz de contorno, sombra de cuello, rubor, línea de labios y detalles faciales.
- Detalles de identidad por personaje (bufanda y cuaderno de Ilan, patrón del poncho de Amaru, armadura de Kian, constelaciones de Zenón, etc.).
- **Caché** de retratos (180 variantes) y maniquíes (120) por clave de personaje + atuendo + estado + formato. Reduce trabajo repetido en rejillas y carruseles.
- Los retratos fuera del viewport pausan animaciones con `IntersectionObserver`.
- El arte es **provisional**: código original, no un encargo de ilustración. Cada personaje conserva `assetReferences.upgradePath` para sustituirlo por arte final.

### 7.2 Escenarios

Cinco escenarios originales, uno por área de afinidad:

| Área | Escenario |
| --- | --- |
| Salud pública | Ciudad nocturna, luna, azoteas, luces y niebla. |
| Cuidado integral | Sala cálida con lámpara, ventanas y estanterías. |
| Ética e interculturalidad | Salón de columnas, vitrales y luz violeta. |
| Investigación | Laboratorio con paneles, gráficas y mesas. |
| Gestión de servicios | Sala de mapas, tableros y mesa de planificación metálica. |

Cada escena incluye `data-scene`, cielo/degradados, arquitectura, suelo, niebla, partículas y viñeta. Se insertan como fondo absoluto con una capa de grado para garantizar contraste del texto. No usan imágenes, fuentes ni URLs externas.

### 7.3 Audio

- **17 efectos originales** sintetizados con osciladores, ruido y filtros: `click`, `hover`, `page`, `select`, `confirm`, `buy`, `equip`, `unequip`, `correct`, `error`, `streak`, `victory`, `defeat`, `levelup`, `unlock`, `toggle`, `coin`.
- **Pad ambiental procedural** de cinco voces con LFOs de afinación y amplitud, filtro lowpass y fundido de entrada.
- Bus con compresor y reverb por convolución generada en código (sin impulse response externa).
- **Sin autoplay:** el contexto se crea/desbloquea con el primer gesto real (`pointerdown` o `keydown`). `play()` devuelve `false` antes de ese gesto.
- **Silencio global** y volúmenes independientes de efectos y música; la música comienza desactivada.
- Preferencias persistidas en el estado y reflejadas en la barra superior y en Ajustes.
- La música se detiene al silenciar y se reanuda solo si el jugador la había activado.
- No hay archivos de audio, samples, CDN ni atribución de audio de terceros.

### 7.4 Estados de animación

| Estado | Disparador | Respuesta visual |
| --- | --- | --- |
| `idle` | Reposo / inicio / sesión | Respiración sutil y parpadeo |
| `correct` | Respuesta correcta | Pequeño salto, asentimiento, sonrisa, brazo |
| `streak` | 3+ aciertos consecutivos | Salto mayor, brazo elevado, brillo |
| `wrong` | Respuesta incorrecta u omitida | Inclinación de cabeza, boca pequeña, brazo baja |
| `defeat` | Resultado no superado o abandono | Cuerpo inclinado, cabeza baja, mensaje comprensivo |
| `victory` | Sesión superada | Celebración, sonrisa, brillo, variante por personaje |
| `levelup` | Subida de nivel al cerrar sesión | Celebración con brillo, boca abierta y placa de nivel |
| `unlock` | Compra o recompensa de personaje | Aparición con escala/desenfoque y celebración |

### 7.5 Movimiento reducido y rendimiento

- `prefers-reduced-motion: reduce`, la clase `reduce-motion` y la preferencia de la app desactivan animaciones y transiciones.
- La preferencia «Animación ambiental» pausa partículas y niebla; «Partículas y auras» oculta motes; «Marcos de rareza» oculta marcos.
- El parallax solo se enlaza en punteros finos y se desactiva con movimiento reducido.
- Las animaciones fuera de pantalla se pausan.
- El arte se cachea; las escenas se generan bajo demanda.
- Medición local (`tests/perf-check.html`): 60 retratos en frío ~7 ms, 600 lecturas cacheadas <1 ms, 500 escenas ~9 ms, retrato ~11,5 KB, 10 retratos en DOM ~5,6 ms y 1.399 nodos SVG.

---

## 8. Economía

- Una sola moneda; no hay dinero real ni segunda divisa.
- Precios centralizados en `QUEST_CONFIG.rpg.prices`; el catálogo no los duplica.
- Compra atómica: comprueba existencia, propiedad, requisito y saldo; descuenta y concede en un `commit`.
- No se puede comprar dos veces, no hay saldo negativo y cada compra queda en `economy.transactions`.
- Amaru se entrega como recompensa al completar cinco misiones; Zenón exige nivel 8 y compra.
- Cosméticos y personajes no otorgan ventajas académicas.

---

## 9. Pruebas

| Herramienta | Qué comprueba | Resultado |
| --- | --- | --- |
| `tests/tests.html` | Reglas académicas, catálogo, economía, colección, arte, escenas, audio, migración, acciones | **61/61** |
| `tests/ui-check.html` | Compra, equipamiento, guardado, recarga, teclado, reacciones, audio, tema y preferencias | **44/44** |
| `tests/launcher-check.html` | Apertura real desde el HUB por clic y por tecla `5` | **7/7** |
| `tests/responsive.html` | 390 px automatizado, 768/1280 conmutables, navegación inferior, arena y sin desbordamiento | **15/15** |
| `tests/perf-check.html` | Caché de arte, escenas y nodos SVG | **9/9** |
| `tests/art-preview.html` | Revisión visual de personajes y capas | Revisado |

La suite expone `window.__QUEST_TESTS__`; la interfaz, `window.__QUEST_UI__`; el HUB, `window.__QUEST_HUB__`; rendimiento, `window.__QUEST_PERF__`.

---

## 10. Límites conocidos

- El arte es vectorial original y **provisional**, no arte final encargado; no hay animación de esqueleto, video ni 3D.
- Los escenarios son SVG generados; no son mapas jugables ni tilemaps.
- El audio es síntesis original, no música grabada; puede sonar distinto según el navegador y el dispositivo.
- No hay backend, cuentas, multijugador ni clasificación mundial.
- La app está pensada para una pestaña activa; el almacén detecta estados dañados y bloquea escrituras inseguras.
- Las fuentes tipográficas se cargan desde Google Fonts (CDN); el resto de la app funciona sin red.
- Los detalles de licencias y la auditoría de assets están en `docs/ASSETS.md`, `NOTICE.md` y `AUTORIA.md`.
