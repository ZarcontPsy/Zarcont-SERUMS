# QA — Study Dashboard (Fases 0–4)

Herramientas de verificación del Agente 6 (Diseño, accesibilidad y QA). Sin dependencias npm,
sin build: Node 24 + Python 3.13 + Chrome headless por CDP, igual que `tests/e2e/`.

Todo se escribe en `tools/qa/salida/` (evidencias). Nada de esta carpeta se carga en la app.

## Comandos

```powershell
# 1) Contraste de tokens (sin navegador, sale 1 si algo falla)
node tools/qa/contraste.mjs

# 2) Auditoría axe-core real sobre las rutas (Chrome headless + CDP)
node tools/qa/axe-audit.mjs

# 3) Capturas y métricas de diseño (escritorio/móvil, claro/oscuro, reduced-motion)
node tools/qa/capturas.mjs

# 4) Peso de apps y coste de H4 (Dashboard, Flashcards, HUB, core y primera área)
node tools/qa/peso-apps.mjs

# 5) Todo, con resumen y código 1 ante fallos
node tools/qa/run-qa.mjs
node tools/qa/run-qa.mjs --quick      # contraste + peso, sin peso-apps, axe ni capturas
node tools/qa/run-qa.mjs --skip-peso-apps
```

Equivalentes con la ruta absoluta de Node del arnés:

```powershell
& 'C:\Users\USARIO\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' tools/qa/run-qa.mjs
```

## Archivos

| Archivo | Qué hace |
|---|---|
| `contraste.mjs` | Lee los tokens de `study-shared/base.css`, compone fondos translúcidos y calcula ratios WCAG. |
| `axe-audit.mjs` | Inyecta `vendor/axe.min.js` en Chrome headless y audita las rutas de Fases 0–4 (`#/`, biblioteca, progreso, ficha, respaldo, rutas de lectura, planificación y las cinco de Fase 3) más sus estados; en Fase 4 retiene/falla el chunk de un área para auditar loading y error de ficha, y comprueba H17. Temas claro/oscuro; 1440×900 y 390×844 con puntero grueso emulado. |
| `capturas.mjs` | Capturas de las rutas de Fases 0–4 en ambos temas y seis viewports, estados abiertos (búsqueda, paleta, barra, hoja, Más, ronda, pendientes, paginación, último día), H17 en Panel/Biblioteca y loading/error de ficha en los seis viewports, y una pasada con `prefers-reduced-motion: reduce`. Mide desborde horizontal y objetivos táctiles. |
| `peso.mjs` | Mide la portada actual y las líneas base de Fase 2/1/0 bloqueando assets por CDP; comprueba que `search.json`, `related.json`, `glossary.json`, `facts.json` y `warnings.json` se piden solo bajo demanda. |
| `peso-apps.mjs` | Mide la carga inicial antes/después de Dashboard, Flashcards y HUB (resto con todos los assets de contenido bloqueados + `temario.js` real), el coste de `temario-core.js` + `content-loader.js` y el de la primera área; verifica que no se pide el temario completo, que el HUB no toca `study-data` y que el área no repite chunk. |
| `run-qa.mjs` | Orquesta los cuatro bloques y escribe `salida/resumen.json` / `resumen.md`. |
| `vendor/axe.min.js` | axe-core 4.10.2 (MPL-2.0), copia local; su licencia está en `vendor/axe.LICENSE.txt`. |
| `lib/color.mjs` | Parseo de color, composición alfa y contraste WCAG 2.2. |
| `lib/css-tokens.mjs` | Lector de niveles superiores de `base.css` (`:root`, `html[data-theme="light"]`). |

Salidas:

- `salida/contraste.json` + `contraste.md`
- `salida/axe.json` + `axe.md`
- `salida/capturas.json` + `capturas.md`
- `salida/capturas/*.png`
- `salida/peso.json` + `peso.md`
- `salida/peso-apps.json` + `peso-apps.md`
- `salida/resumen.json` + `resumen.md`
- `salida/INFORME-QA-FASE0.md`, `INFORME-QA-FASE1.md`, `INFORME-QA-FASE2.md`, `INFORME-QA-FASE3.md` e `INFORME-QA-FASE4.md` (informes por fase; el de Fase 4 se escribe al cierre)

## Fórmulas de contraste

1. Canal sRGB normalizado: `c = canal / 255`.
2. Linealización: `c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4`.
3. Luminancia relativa: `L = 0.2126·R + 0.7152·G + 0.0722·B`.
4. Ratio: `(L_claro + 0.05) / (L_oscuro + 0.05)`.
5. Composición alfa: `resultado = α·frente + (1 − α)·fondo`.

Un token translúcido (`--green-soft`, `--mark-*-bg`, `--*-line`) se compone sobre la superficie
real antes de medir. El tema claro se resuelve como `:root` + overrides de
`html[data-theme="light"]`, igual que el navegador.

Umbrales: **4,5:1** texto, **3:1** iconos/puntos/líneas con significado. Los bordes decorativos
(`--accent-line`, `--green-line`, `--danger-line`, `--line`) se registran como aviso y no
bloquean: no transmiten información por sí solos.

## Tokens añadidos (`study-shared/base.css`)

| Token | Oscuro | Claro |
|---|---|---|
| `--green` | `#8FD3B0` | `#186043` |
| `--green-soft` | `rgba(143,211,176,.12)` | `rgba(24,96,67,.12)` |
| `--green-line` | `rgba(143,211,176,.34)` | `rgba(24,96,67,.34)` |
| `--danger` | `#F07A7A` | `#A92016` |
| `--danger-soft` | `rgba(240,122,122,.11)` | `rgba(169,32,22,.11)` |
| `--danger-line` | `rgba(240,122,122,.32)` | `rgba(169,32,22,.30)` |
| `--mark-important` | `#E6B566` | `#8F520E` |
| `--mark-important-bg` | `rgba(230,181,102,.18)` | `rgba(143,82,14,.14)` |
| `--mark-important-line` | `rgba(230,181,102,.60)` | `rgba(143,82,14,.72)` |
| `--mark-important-ink` | `#FFE7B8` | `#6B3A05` |
| `--mark-understand` | `#8FD3B0` | `#186043` |
| `--mark-understand-ink` | `#D6F5E4` | `#0F4A32` |
| `--mark-review` | `#8FBDF5` | `#1F5E9C` |
| `--mark-review-ink` | `#D6E6FF` | `#14406B` |
| `--mark-doubt` | `#D9A6EC` | `#7A3E9C` |
| `--mark-doubt-ink` | `#F0DAFA` | `#4E2A6B` |
| `--target-min` | `44px` | `44px` |
| `--z-appbar` / `--z-sheet` / `--z-popover` / `--z-modal` / `--z-toast` | `50 / 80 / 100 / 120 / 160` | igual |

`--mark-*-bg` y `--mark-*-line` siguen la misma escala que su color principal
(`understand` y `review`/`doubt` usan `rgba(<principal>, .18)` en oscuro y `.14` en claro;
las líneas usan `.60` / `.72` respectivamente).

El acento del tema claro pasó de `#9A5B12` a `#8F520E` para que badges, chips y números
decorativos del lector superen 4,5:1 sobre sus fondos compuestos (4,41 → 5,32). El tema
oscuro y el acento de Study Flashcards no cambian de identidad.

## Supuestos

- Los tokens medidos son colores literales. Un `var()` o `color-mix()` en un token de los
  medidos haría fallar `contraste.mjs` con un mensaje explícito (preferimos saberlo).
- Los degradados (`dash-hero`, panel «Más») no se modelan en el cálculo estático: sus textos
  se miden con la superficie base, que es el color dominante; axe marca esos nodos como
  `incomplete` y `axe-audit.mjs` los remide en la página real con la pila de fondos.
- La emulación de puntero grueso es la de Chrome (`Emulation.setTouchEmulationEnabled`), no un
  dispositivo real. Los objetivos táctiles se miden con `getBoundingClientRect`.
- `#/respaldo` se audita solo cuando el módulo `js/data/backup.js` está registrado; si no,
  el runner lo registra como pendiente (nunca lo maquilla como PASS).
- axe se ejecuta con las etiquetas WCAG 2.0/2.1/2.2 A y AA; no se cuentan como fallo las
  reglas de mejores prácticas ni las de tipo `incomplete` (se documentan y revisan).

## Límites

- Headless Chrome 157 en Windows; no sustituye NVDA/VoiceOver, iOS/Safari ni Android reales.
- Las capturas no son una revisión visual humana: son evidencia para esa revisión.
- `prefers-contrast: more` y `prefers-reduced-transparency` se implementan en CSS, pero
  `contraste.mjs` mide el tema base; los refuerzos solo suben contraste, nunca lo bajan.

---

© 2026 ZARCONT — Herramientas internas de QA.
