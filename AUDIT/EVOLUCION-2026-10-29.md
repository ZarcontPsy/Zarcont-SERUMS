# EVOLUCIÓN SERUMS — Ola 1 (2026-10-29)

**Alcance:** legibilidad, contraste, movimiento, feedback y dos correcciones de flujo.
**Modo:** cambios locales de bajo riesgo; sin tocar datos, claves, rutas ni persistencia.
**Estado de partida:** árbol con cambios del usuario sin commitear (21 archivos `M` + `serums-mobile.css` sin seguimiento). Se conservaron íntegramente.

## 1. Línea base

| Prueba | Resultado | Evidencia |
|---|---|---|
| Suite E2E completa (85 casos) | **83 PASS · 0 FAIL · 2 SKIP** | `AUDIT/evidencias/baseline-2026-10-29/run.json` |
| Unit tests QUEST | **61 PASS · 0 FAIL** | `AUDIT/evidencias/baseline-2026-10-29/quest-unit.json` |
| SKIP conocidos | HUB-11 (selección del carrusel), QUEST-10 (héroe alternativo) | — |

## 2. Cambios aplicados

### 2.1 Tipografía real

- Los 6 puntos de entrada cargan ahora **Inter variable 400–800**:
  `index.html`, `EXAMEN STUDIO/Examen Studio.html`, `serums map/.../index.html`,
  `study-dashboard/index.html`, `study-flashcards/index.html`, `serums-quest/index.html`.
- Motivo: había pesos 550/620/650/680 declarados en CSS que no existían en la fuente cargada.
- No se cambió ninguna familia ni escala global.

### 2.2 Contraste (medido con WCAG sobre fondo efectivo)

| App / token | Antes | Después | Ratio resultante |
|---|---|---|---|
| Banqueo claro `--muted` | `#827F84` | `#6B666B` | 3.43 → **4.89** (panel 5.38) |
| Study claro `--muted` | `#7B7367` | `#6E675C` | 4.11 → **4.91** (superficie 5.27) |
| Plazas claro `--faint` | `#9B8F90` | `#76696B` | 2.75 → **4.63** (blanco 5.25) |
| HUB metadatos | rgba .26–.40 | `--text-3` `#858585` | 2.17–3.31 → **5.19** |
| QUEST «Jugar» | `#4F74FF → #8A62F0` | `#3D5CE0 → #6D4AD8` | 3.98–4.13 → **5.52–5.80** |

- HUB: `.app-meta` 9 → 9.5 px, `.app-last` 9 → 9.5 px, `.app-tag` 8 → 9 px,
  `.app-progress-note` 8.5 → 9 px, `.tb-count` 9 → 9.5 px.
- QUEST: rarezas de 6–6.5 px → **9 px**; metadatos de equipo/elenco de 6.5–7.5 px → **8.5 px**.
- Se mantuvieron los tamaños decorativos del arte de las tarjetas del HUB (no son texto de interfaz).

### 2.3 Movimiento

- **HUB:** entrada de 420 ms → **300 ms**, sin `scale`, delays 0/40 ms. Con
  `prefers-reduced-motion` la apertura navega de inmediato (antes mostraba un overlay vacío 80 ms).
- **QUEST:**
  - Respuesta correcta/incorrecta: solo cabeza, **160 ms**; se retiraron salto de cuerpo y brazo.
  - Racha: cabeza **180 ms**, glow **200 ms**; se conserva la respiración.
  - `q-xp-pop` y `q-companion-streak`: sin animación (el dato sigue visible).
  - Pulso de selección de héroe: 500 → **180 ms**; entrada de personaje: 240 → **180 ms** y 4 px.
  - Motas ambientales: estáticas; rayos de desbloqueo: estáticos.
  - `q-no-idle` detiene también el parpadeo; ojos/props se pausan fuera de pantalla.
  - Celebraciones `victory`, `levelup`, `unlock` se mantienen.
- **Reduced motion:** se anulan también `animation-delay` y `transition-delay` en HUB,
  Banqueo, Study, Plazas y Quest.

### 2.4 Feedback y foco

- `:active` inmediato en tarjetas/opciones de Study, Banqueo y Quest (transform de 0.985–0.995).
- `serums-mobile.css`: la atenuación al pulsar se limita a `(hover: none) and (pointer: coarse)`
  y baja de `.8` a `.9`; ya no afecta a híbridos con ratón.
- Flashcards: `.lib-select:focus-within` recupera anillo de foco.
- Plazas: `.sugbox button:focus` recupera anillo interior.

### 2.5 Responsive

- **Plazas ≤520 px:** los grupos de `.maptools` envuelven y los selects pueden encogerse.
  Se elimina el recorte horizontal de 26 px a 320 px.
  Contrapartida medida: los grupos se apilan y el overlay ocupa 222 px de alto a 320×568.
- **HUB:** sin scroll horizontal; tarjeta 366 px a 390, 296 px a 320.
  Queda un desbordamiento interno de 3 px en `.app-body` a 320×568, sin pérdida visible.

### 2.6 Simplificación del HUB

- Se retiró el pill «Abrir» superpuesto en las 5 tarjetas y su CSS muerto.
  Quedan dos acciones coherentes: CTA de la tarjeta y botón de la barra inferior.
- No se tocaron `CONFIG.apps`, `href`, carrusel, teclado, swipe ni progreso.

### 2.7 Banqueo: salida de la última pregunta

- En la pregunta final, «Siguiente» deshabilitado se sustituye por **«Ver resultados»**,
  que llama a `practice-finish`. La barra superior conserva «Terminar».
- Con preguntas sin responder se mantiene la confirmación existente.

## 3. Archivos tocados en esta ola

| Archivo | Bloques |
|---|---|
| `index.html` | `<link>` de Inter; metadatos/tokens del HUB; entrada 300 ms; reduced-motion; retirada del pill; `:active` de tarjeta |
| `EXAMEN STUDIO/Examen Studio.html` | `<link>` de Inter |
| `EXAMEN STUDIO/styles.css` | `--muted` claro; `:active` de opciones; reduced-motion delays |
| `EXAMEN STUDIO/js/app.js` | botón «Ver resultados» en la última pregunta |
| `serums map/.../index.html` | `<link>` de Inter |
| `serums map/.../styles.css` | `--faint` claro; foco de sugerencias; wrap de `.maptools`; reduced-motion |
| `study-dashboard/index.html` | `<link>` de Inter |
| `study-dashboard/styles.css` | `:active` de tarjetas |
| `study-flashcards/index.html` | `<link>` de Inter |
| `study-flashcards/styles.css` | foco de select; `:active` de tarjetas/opciones |
| `study-shared/base.css` | `--muted` claro; `:active` de iconos; reduced-motion delays |
| `serums-quest/index.html` | `<link>` de Inter |
| `serums-quest/styles.css` | reacción XP estática; `:active` de opciones; reduced-motion delays |
| `serums-quest/styles-game.css` | gradiente «Jugar»; motas/rayos estáticos; pausa offscreen; rarezas; `:active` |
| `serums-quest/styles-rpg.css` | reacciones breves; `q-no-idle`; racha sin animación |
| `serums-mobile.css` | alcance y opacidad del feedback táctil |

## 4. Validación ejecutada

| Comando | Resultado |
|---|---|
| `node tests/e2e/run.mjs --quick --out=wave1-quick` | 69 PASS · 0 FAIL · 2 SKIP |
| `node tests/e2e/run.mjs --suite=banq --out=wave1-banq` | 10 PASS · 0 FAIL |
| `node tests/e2e/run.mjs --out=wave1-final` | **83 PASS · 0 FAIL · 2 SKIP** |
| `serums-quest/tests/tests.html` en Chrome | **61/61, 0 fallos** (repetición tras los cambios) |
| Sonda específica última pregunta Banqueo | 25/25, «Ver resultados», confirmación y `#practice/result/...` |
| Medición de contraste en navegador | `#6E675C`, `#6B666B`, `#76696B`, `#858585`, 5.5+ |
| Capturas | HUB 1440/390/320, Plazas 320, QUEST 390, Study/Banqueo/Plazas en claro |

Evidencias nuevas:
`AUDIT/evidencias/wave1-quick/`, `wave1-banq/`, `wave1-final/`.
Capturas de trabajo: `%TEMP%\serums-a1\cdp\`.

## 5. Pendientes (no implementados en esta ola)

### Riesgo medio — requieren prueba específica

1. **Plazas:** el importador no es diálogo (sin `role`, foco inicial, trap ni Escape);
   la ficha tiene `aria-modal` pero el foco escapa; el drawer cerrado sigue siendo tabulable.
2. **Banqueo:** la hoja de detalle móvil no es diálogo; el foco queda detrás de la capa.
3. **Salidas de modales/menús:** varias cierran por `display:none` sin transición de salida.
4. **Topbars:** alturas 54–74 px y objetivos 32–38 px frente a 40/44 documentados.
5. **Breakpoints:** 26 anchos en CSS frente a 8 documentados.

### Riesgo alto / decisión de producto

6. HUB: no recuerda la tarjeta activa y no reanuda el último punto; siempre abre Banqueo.
7. Plazas: sin rutas por hash ni historial de vista/filtros.
8. Flashcards: «Terminar» cierra la sesión sin confirmar.
9. HUB: BANQUEO/PLAZAS no muestran estado real (solo Study/Quest).
10. `prefers-reduced-transparency` y `prefers-contrast` sin reglas.

### Limitaciones conocidas

- A 320×568 el cuerpo de la tarjeta del HUB desborda 3 px internos (sin corte visible).
- En Plazas 320 el overlay de filtros ocupa 222 px; es funcional, pero reduce el mapa.
- Google Maps puede fallar por cuota/clave externa; el fallback está verificado por `MAP-04`.
- No se probó Safari/iOS, lector de pantalla real ni zoom 200 %.
- `INTEGRITY.sha256` no se regeneró: ya estaba desincronizado por los cambios locales previos.

## 6. Próxima ola propuesta

**Ola 2 — diálogos y foco (medio):** `panels.js` (importador), `app.js` (ficha y hoja Banqueo),
`index.html`/`styles.css` de Plazas y Banqueo. Añadir `role="dialog"`, `aria-modal`,
foco inicial, trap, `inert`, Escape y retorno de foco. Prueba: teclado real + suite completa.

**Ola 3 — continuidad (decisión):** HUB `sessionStorage`/`?app=` y CTA «Continuar»;
rutas hash en Plazas; confirmación de fin de sesión en Flashcards.
Requiere aprobar contratos de URL y persistencia.

**Ola 4 — sistema:** consolidar alturas de topbar y objetivos táctiles; reducir breakpoints;
añadir `prefers-reduced-transparency`/`contrast`. No tocar stores ni contenido.
