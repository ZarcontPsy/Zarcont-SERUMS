# Informe de QA — SERUMS QUEST

**Fecha:** 2026-10-25  
**Entorno:** Chromium headless local, servidor `python -m http.server 8765 --bind 127.0.0.1`, Windows.  
**Build:** `ZARCONT-SQ-1.2.0` · mapa `1.0.2` · esquema `2` · catálogo RPG `1.2.0` (10 personajes, 33 cosméticos).

## 1. Resultado ejecutivo

- **61/61 pruebas automatizadas** (`tests/tests.html`).
- **44/44 comprobaciones de interfaz real** (`tests/ui-check.html`): compras, equipamiento, guardado, recarga, teclado, reacciones, audio, tema y preferencias.
- **7/7 verificaciones de apertura desde el HUB** (`tests/launcher-check.html`), por clic y por tecla `5`.
- **15/15 comprobaciones responsive automatizadas a 390 px** (`tests/responsive.html`), más revisión visual de 768 y 1280/1440 px; incluye la navegación inferior de cinco destinos.
- **9/9 métricas de rendimiento gráfico** (`tests/perf-check.html`).
- **Cero regresiones académicas:** XP, monedas, niveles, etapas, misiones, recuperación, logros, historial, importación/exportación y bloqueo seguro siguen funcionando.
- **Capa RPG 1.2:** Game Home cinematográfico, arena de héroes, estudio de equipamiento, escenarios SVG, audio sintetizado opcional, navegación de cinco secciones y presentación de desbloqueo.

## 2. Suite automatizada

Archivo: `serums-quest/tests/tests.js` (61 pruebas). Resultado de la última ejecución:

```
61 superadas · 0 fallidas
```

Cobertura por área:

| Área | Pruebas |
| --- | ---: |
| Curva de nivel, rangos, etapas y dominio espaciado | 7 |
| XP, anti-repetición, ledger y finalización única | 4 |
| Persistencia, migración, transacciones, import/export y estado dañado | 7 |
| Contenido, misiones, referencias y exclusión de claves inválidas | 5 |
| Desafío diario, misión 0 %, recuperación, temporizador, contrarreloj | 7 |
| Resultados, respuestas registradas, feedback y nivel máximo | 4 |
| Catálogo RPG, arte y compatibilidad | 6 |
| Colección, economía, equipamiento, filtros y migración RPG | 10 |
| Reacciones, preferencias, interfaz, escenas, audio y acciones declaradas | 8 |
| Recompensa de personaje al cerrar misión (motor→colección) | 1 |
| Launcher, viewport y CSS responsive | 2 |

Comprobaciones nuevas de 1.2:

- **Escenas:** las 5 áreas generan SVG con `data-scene`, capa de grado y partículas; no hay URLs externas; `forCharacter` respeta el área de afinidad.
- **Audio:** existen los 17 sonidos declarados; valores por defecto; recorte de volúmenes; `play()` devuelve `false` sin desbloqueo y con silencio; la música está apagada por defecto.
- **Persistencia de audio:** silencio, música y volúmenes sobreviven a una nueva instancia del almacén.
- **Arte:** el mismo retrato reutiliza la caché, los estados generan variantes y el equipamiento cambia el SVG.
- **Navegación:** cinco enlaces principales y cinco inferiores, ruta `#/progreso` y acción real de equipamiento.
- **Acciones:** 43 acciones declaradas en el DOM; todas tienen controlador; el umbral de la prueba subió a 42.

Además se mantienen las comprobaciones anteriores: 10 personajes únicos, 33 cosméticos, precios centralizados, compra única, saldo insuficiente sin negativo, equipamiento por personaje, 9 ranuras (8 en Kian/Amaru/Zenón), incompatibilidades, Zenón nivel 8, Amaru por 5 misiones, filtros, migración 1→2, normalización, reacciones y snapshot.

## 3. Interfaz real

Archivo: `tests/ui-check.html`. Resultado:

```
44 comprobaciones correctas · 0 fallidas
```

Flujo verificado:

1. Arranque con estado sembrado (20.000 monedas, Ilan).
2. Filtros de personajes: 7 comprables, 2 bloqueados; la tira de elenco se usa para contar, no los duplicados de la arena.
3. Enlace profundo a Mara: inspeccionar a Ilan después no queda bloqueado por la URL.
4. Flechas del teclado recorren el elenco y actualizan el detalle.
5. Inspeccionar a Mara no cambia el personaje activo.
6. Diálogo de compra con precio; presentación de desbloqueo; saldo 20.000 → 19.520 una sola vez; una transacción; Mara en la colección.
7. Barra superior actualizada con el personaje activo.
8. Tienda: filtro legendario deja solo a Zenón; compra de cosmético con descuento y transacción.
9. Categoría «Accesorio adicional» muestra sus dos objetos.
10. **Estudio de equipamiento:** clic en cosmético aplica el borrador, «Guardar atuendo» persiste, la recarga conserva saldo, equipamiento y selección.
11. **Alias `#/personalizar/mara`:** renderiza el estudio, marca el objeto equipado y «Quitar» + guardar elimina la ranura.
12. Sesión real con reacción `wrong`, mensaje propio y continuación disponible; resultado con reacción.
13. Movimiento reducido y reacciones desactivadas se aplican al documento y persisten.
14. Tema claro y oscuro se aplican y persisten.
15. **Audio:** silenciar/reactivar, `aria-pressed` coherente en la barra, volumen de efectos guardado, música activable y prueba de sonido presente.

## 4. HUB, responsive y rendimiento

- **HUB (`tests/launcher-check.html`):** 7/7. La quinta tarjeta abre SERUMS QUEST por clic (doble activación) y por tecla `5`; se comprueba el hash y el título.
- **Responsive (`tests/responsive.html`):** 15/15 a 390 px: sin desbordamiento, hero en una columna, navegación superior oculta, barra inferior con 5 enlaces, personaje visible, arena en una columna, escenario ≥400 px, flechas presentes, tira deslizable y detalle apilado. La misma página permite conmutar a 768 y 1280 px; se revisaron capturas a 768, 1280 y 1440 px. A 1280 se comprueba la navegación superior y la ocultación de la inferior.
- **Rendimiento (`tests/perf-check.html`):** 9/9. En esta máquina:
  - 60 retratos únicos en frío: ~7 ms.
  - 600 lecturas con caché: <1 ms (~91× por retrato).
  - Retrato: ~11,5 KB de SVG en memoria.
  - 500 escenas: ~9 ms; ~6 KB por escena.
  - 10 retratos insertados en DOM: ~5,6 ms; 1.399 nodos SVG.

  Son mediciones locales de Chromium; no son un benchmark universal.

## 5. Integridad visual revisada

Capturas actualizadas en `docs/`:

- `vista-inicio.png`: escenario, héroe, misión, elenco, modos y semana.
- `vista-personajes.png`: arena, paneles, filtros y tira.
- `vista-inventario.png`: estudio con ranuras, grilla y barra de guardado.
- `vista-tienda.png`: destacados y catálogo.
- `vista-progreso.png`: perfil, rango, precisión por área y actividad.
- `vista-ajustes.png`: audio, perfil, experiencia, colección y datos.
- `vista-tema-claro.png`: tema claro con HUD legible.
- `vista-tablet-inicio.png` y `vista-tablet-personajes.png`: 768 px con barra inferior.

Correcciones visuales detectadas y aplicadas durante la revisión:

- El saludo del Game Home se colocaba al pie por auto-placement del grid; se fijó `grid-row: 1`.
- La barra superior en tema claro tenía fondo oscuro y texto oscuro; se añadió una variante clara.
- El perfil tenía un `div` de grid sin cerrar y provocaba una tercera columna recortada; se reestructuró en «rango + personaje» y «área» a ancho completo.
- En móvil, el foco del elenco hacía `scrollIntoView` vertical y saltaba la cabecera; ahora solo desplaza horizontalmente la tira.
- La barra de audio tenía `aria-pressed` invertido; ahora `true` significa silenciado.
- Los filtros de personajes se movieron después de la arena en móvil.

## 6. Límites de esta verificación

- **No se probó en Firefox, Safari ni dispositivos físicos.** Las comprobaciones responsive usan iframes de Chromium con anchos reales.
- **El audio no se evalúa acústicamente en headless.** Se comprueban estado, preferencias, desbloqueo, silencio, volúmenes y presencia de controles; la calidad tímbrica requiere escucha humana.
- **El arte es provisional.** La revisión visual es de composición y legibilidad, no una validación de calidad de ilustración final.
- **No se descargó ni auditó visualmente ningún pack de terceros.** La decisión está en `docs/ASSETS.md`.
- La integridad SHA-256 detecta cambios; no impide copias.
- El estado es local y de una pestaña; no hay cuentas ni backend.

## 7. Conclusión

La build 1.2.0 está **funcionalmente completa** para el alcance solicitado: la experiencia se siente un RPG coherente (escenarios, héroe, colección, equipamiento, audio opcional y progresión), sin sacrificar el núcleo académico. Quedan como **provisionales** el arte vectorial (pendiente de ilustración final) y la validación cross-browser/auditiva. No hay funciones presentadas como terminadas que carezcan de flujo real y prueba.
