# SERUMS HUB — Sistema de diseño (Premium Glass UI)

Estándar visual obligatorio del proyecto. Toda modificación futura debe respetar estas reglas
y reutilizar los tokens definidos en el bloque `:root` de `index.html`.

---

## 1. Referencias y su función

| Referencia | Función obligatoria |
|---|---|
| Imagen 1 (MOKOTO) | Identidad: paleta negro/blanco/rojo, tipografía geométrica, transparencias controladas, esquinas muy redondeadas. |
| Imagen 2 (Rome Explorer) | HUB: composición envolvente con superficie flotante, navegación superior integrada, tarjetas protagonistas con profundidad, control inferior y dock lateral. |
| Imagen 3 (Steary) | Interfaces interiores: superficie de cristal + densidad informativa, paneles amplios redondeados, jerarquía clara, controles compactos. |

## 2. Paleta

| Token | Valor | Uso |
|---|---|---|
| `--black` | `#000000` | Negro estructural |
| `--bg` | `#080808` | Fondo base de la aplicación |
| `--surface` | `#151515` | Superficies sólidas |
| `--white` | `#FFFFFF` | Máxima legibilidad, botones primarios |
| `--red` | `#DF2531` | Identidad, selección, énfasis |
| `--red-dark` | `#741B1E` | Profundidad roja |
| `--red-deep` | `#481416` | Fondos rojos profundos |
| `--text-2` | `#B8B8B8` | Texto secundario |
| `--text-3` | `#858585` | Metadatos (mínimo 12 px) |

El rojo **no** domina: se usa para selección, acento y énfasis. La selección nunca depende solo del color (también posición, borde y etiqueta `aria-current`).

## 3. Tipografía

- `--font-display`: **Zen Dots** (geométrica tecnológica) → solo wordmark y momentos de marca.
- `--font-ui`: **Inter** → toda la interfaz; fallback Open Sans / system-ui.
- Escala: 11 / 12.5 / 14.5 / 16 / 20 / 26 / clamp() para títulos. Cifras con `tabular-nums`.
- No mezclar más familias. Mayúsculas espaciadas solo en etiquetas breves.

## 4. Superficies de cristal

- `--glass` / `--glass-strong`: superficies claras translúcidas (hover, controles).
- `--glass-dark` `rgba(10,10,10,.72)`: paneles flotantes (topbar, dock, dockbar, modal).
- `--border-soft` / `--border`: bordes discretos; nunca brillantes.
- Blur moderado: 12 / 20 / 28 px. Los paneles importantes conservan fondo suficientemente sólido.
- Sin degradados aleatorios ni luces permanentes animadas.

## 5. Radios, sombras, movimiento

- Radios: 8 / 10 / 16 / 24 / 32 / 999 px. Tarjeta protagonista: 28 px.
- Sombras difusas (`--shadow-sm/md/lg`) + `--shadow-red` solo para elementos activos.
- Transiciones: `--t-fast` 160 ms, `--t-base` 220 ms, `--t-slow` 520 ms con `--ease-out`.
- Entrada escalonada, hover discreto, selección con transformación. Nada de movimiento ornamental.
- `prefers-reduced-motion` reduce todo a duración ~0 sin romper la funcionalidad.

## 6. Componentes del sistema

- **Barra superior** (pill flotante): marca + estado + acciones (pantalla completa, ayuda).
- **Dock lateral** (desktop): logo + accesos a aplicaciones con `aria-current`. En móvil se sustituye por controles inferiores + swipe.
- **Carrusel de tarjetas**: tarjeta activa centrada; secundaria en perspectiva (translateZ/rotateY), clicable para traerla al frente. Estados `.content-full` / `.content-mini` por opacidad.
- **Barra de control inferior**: anterior / cápsula de contexto (`aria-live`) / siguiente + indicadores de punto.
- **Modal de atajos**: scrim + panel de cristal, gestión de foco, `Esc` para cerrar.
- **Overlay de apertura**: se expande desde la tarjeta elegida (clip-path) con acento rojo.
- **Tooltips** `[data-tip]`, **kbd**, **chips/badges**, **botón primario blanco**.

## 7. Reglas permanentes

1. Reutilizar tokens y componentes antes de crear nuevos.
2. Toda acción visible debe funcionar (sin controles decorativos).
3. Estados obligatorios: normal, hover, focus-visible, activo, y carga cuando aplique.
4. Accesibilidad: teclado (← →, Enter, 1/2, Esc), foco visible rojo, contraste suficiente, `aria`.
5. Responsive: escritorio con composición amplia; móvil con una tarjeta y controles táctiles (swipe), sin encoger el escritorio.
6. Sin contenido ficticio: los textos describen funciones reales y las URLs provienen de `CONFIG`.
7. Al terminar cualquier cambio, repasar la lista de evaluación del prompt maestro.

---

### Estado actual

- `index.html` — SERUMS HUB: implementa este sistema como primera aplicación del estándar.
- Pendiente (futura tarea): trasladar el lenguaje de la imagen 3 a las interfaces interiores
  (`EXAMEN STUDIO` y `serums-map-explorer`) reutilizando estos tokens.

---

© 2026 ZARCONT — Todos los derechos reservados · Documento interno del proyecto.
Licencia: `LICENSE` · Autoría y versiones: `AUTORIA.md` · Componentes de terceros: `NOTICE.md`.
