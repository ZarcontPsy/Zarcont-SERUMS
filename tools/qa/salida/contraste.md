# Informe de contraste — tokens de Study (Fase 0)

Generado por `tools/qa/contraste.mjs` el 2026-11-10T15:04:10.594Z.

## Cómo se mide

1. Cada token se lee de `study-shared/base.css` como color literal (hex o `rgba`). No se aceptan `var()` ni `color-mix()` en los tokens medidos.
2. Un fondo translúcido (`--*-soft`, `--*-bg`, `--*-line`) se compone sobre la superficie real en la que se pinta: `resultado = alpha·frente + (1 − alpha)·fondo`. Así, `--green-soft` sobre `--surface-2` produce un color opaco medido, no el token aislado.
3. Luminancia relativa WCAG 2.2: cada canal sRGB se normaliza (`c/255`), se linealiza con `c <= 0.03928 ? c/12.92 : ((c + 0.055)/1.055)^2.4` y se combina como `L = 0.2126·R + 0.7152·G + 0.0722·B`.
4. Ratio: `(L_claro + 0.05) / (L_oscuro + 0.05)`.
5. Umbrales: **4,5:1** para texto, **3:1** para iconos, puntos y líneas con significado. Los bordes decorativos se miden como aviso y no bloquean.

El tema claro se evalúa como `:root` + overrides de `html[data-theme="light"]`, igual que el navegador; los refuerzos de `prefers-contrast: more` solo suben valores y no se usan en la medición base.

## Resumen

- Comprobaciones: **100**
- Requeridas que fallan: **0**
- Avisos (no bloquean): **8**
- Resultado: **OK**

### Tema oscuro

| Comprobación | Categoría | Fondo efectivo | Frente efectivo | Ratio | Mínimo | Estado |
|---|---|---|---|---:|---:|---|
| Texto principal sobre el fondo | texto | `--bg` = #0B0B0D | #F4F1E9 | 17.42:1 | 4.5:1 | PASA |
| Texto principal sobre superficie | texto | `--surface` = #141417 | #F4F1E9 | 16.29:1 | 4.5:1 | PASA |
| Texto suave sobre superficie | texto | `--surface` = #141417 | #BDB8AE | 9.31:1 | 4.5:1 | PASA |
| Texto suave sobre el fondo | texto | `--bg` = #0B0B0D | #BDB8AE | 9.96:1 | 4.5:1 | PASA |
| Texto atenuado sobre superficie | texto | `--surface` = #141417 | #88837A | 4.88:1 | 4.5:1 | PASA |
| Texto atenuado sobre superficie 2 | texto | `--surface-2` = #1A1A1E | #88837A | 4.61:1 | 4.5:1 | PASA |
| Texto atenuado sobre el fondo | texto | `--bg` = #0B0B0D | #88837A | 5.22:1 | 4.5:1 | PASA |
| Acento sobre accent-soft (badge «Ampliación», chips) | texto | `--accent-soft sobre --surface` = #2F2921 | #E6B566 | 7.64:1 | 4.5:1 | PASA |
| Acento sobre bg-soft (números de concepto del lector) | texto | `--bg-soft` = #0E0E11 | #E6B566 | 10.25:1 | 4.5:1 | PASA |
| Texto del botón principal sobre el acento | texto | `--accent` = #E6B566 | #1B1205 | 9.84:1 | 4.5:1 | PASA |
| Acento en iconos sobre superficie | icono | `--surface` = #141417 | #E6B566 | 9.78:1 | 3:1 | PASA |
| Acento en iconos sobre el fondo | icono | `--bg` = #0B0B0D | #E6B566 | 10.46:1 | 3:1 | PASA |
| Texto de alerta sobre su fondo | texto | `--accent-soft sobre --surface-2` = #352E27 | #BDB8AE | 6.76:1 | 4.5:1 | PASA |
| Verde del chip «Completada» sobre green-soft | texto | `--green-soft sobre --surface-2` = #283030 | #8FD3B0 | 7.77:1 | 4.5:1 | PASA |
| Verde en iconos sobre superficie | icono | `--surface` = #141417 | #8FD3B0 | 10.60:1 | 3:1 | PASA |
| Verde en iconos sobre el fondo | icono | `--bg` = #0B0B0D | #8FD3B0 | 11.34:1 | 3:1 | PASA |
| Icono de check sobre el verde de completada | icono | `--green` = #8FD3B0 | #1B1205 | 10.67:1 | 4.5:1 | PASA |
| Peligro sobre danger-soft (aviso del lector) | texto | `--danger-soft sobre --surface-2` = #322528 | #F07A7A | 5.46:1 | 4.5:1 | PASA |
| Peligro sobre superficie (botón/etiqueta) | texto | `--surface` = #141417 | #F07A7A | 6.80:1 | 4.5:1 | PASA |
| Peligro sobre el fondo | texto | `--bg` = #0B0B0D | #F07A7A | 7.28:1 | 4.5:1 | PASA |
| Icono de aviso sobre el fondo | icono | `--danger-soft sobre --surface` = #2C1F22 | #F07A7A | 5.85:1 | 3:1 | PASA |
| Importante: texto sobre su fondo (superficie) | texto | `--mark-important-bg sobre --surface` = #3A3125 | #FFE7B8 | 10.56:1 | 4.5:1 | PASA |
| Importante: texto sobre su fondo (fondo de página) | texto | `--mark-important-bg sobre --bg` = #322A1D | #FFE7B8 | 11.73:1 | 4.5:1 | PASA |
| Importante: color de marca sobre superficie | icono | `--surface` = #141417 | #E6B566 | 9.78:1 | 3:1 | PASA |
| Importante: color de marca sobre el fondo | icono | `--bg` = #0B0B0D | #E6B566 | 10.46:1 | 3:1 | PASA |
| Importante: línea sobre superficie | grafico | `--surface` = #141417 | #927546 | 4.24:1 | 3:1 | PASA |
| Importante: línea sobre el fondo | grafico | `--bg` = #0B0B0D | #8E7142 | 4.31:1 | 3:1 | PASA |
| Entender: texto sobre su fondo (superficie) | texto | `--mark-understand-bg sobre --surface` = #2A3633 | #D6F5E4 | 10.73:1 | 4.5:1 | PASA |
| Entender: texto sobre su fondo (fondo de página) | texto | `--mark-understand-bg sobre --bg` = #232F2A | #D6F5E4 | 11.94:1 | 4.5:1 | PASA |
| Entender: color de marca sobre superficie | icono | `--surface` = #141417 | #8FD3B0 | 10.60:1 | 3:1 | PASA |
| Entender: color de marca sobre el fondo | icono | `--bg` = #0B0B0D | #8FD3B0 | 11.34:1 | 3:1 | PASA |
| Entender: línea sobre superficie | grafico | `--surface` = #141417 | #5E8773 | 4.52:1 | 3:1 | PASA |
| Entender: línea sobre el fondo | grafico | `--bg` = #0B0B0D | #5A836F | 4.60:1 | 3:1 | PASA |
| Repasar: texto sobre su fondo (superficie) | texto | `--mark-review-bg sobre --surface` = #2A323F | #D6E6FF | 10.17:1 | 4.5:1 | PASA |
| Repasar: texto sobre su fondo (fondo de página) | texto | `--mark-review-bg sobre --bg` = #232B37 | #D6E6FF | 11.30:1 | 4.5:1 | PASA |
| Repasar: color de marca sobre superficie | icono | `--surface` = #141417 | #8FBDF5 | 9.43:1 | 3:1 | PASA |
| Repasar: color de marca sobre el fondo | icono | `--bg` = #0B0B0D | #8FBDF5 | 10.08:1 | 3:1 | PASA |
| Repasar: línea sobre superficie | grafico | `--surface` = #141417 | #5E799C | 4.12:1 | 3:1 | PASA |
| Repasar: línea sobre el fondo | grafico | `--bg` = #0B0B0D | #5A7698 | 4.19:1 | 3:1 | PASA |
| Duda: texto sobre su fondo (superficie) | texto | `--mark-doubt-bg sobre --surface` = #372E3D | #F0DAFA | 9.90:1 | 4.5:1 | PASA |
| Duda: texto sobre su fondo (fondo de página) | texto | `--mark-doubt-bg sobre --bg` = #302735 | #F0DAFA | 10.99:1 | 4.5:1 | PASA |
| Duda: color de marca sobre superficie | icono | `--surface` = #141417 | #D9A6EC | 9.29:1 | 3:1 | PASA |
| Duda: color de marca sobre el fondo | icono | `--bg` = #0B0B0D | #D9A6EC | 9.94:1 | 3:1 | PASA |
| Duda: línea sobre superficie | grafico | `--surface` = #141417 | #8A6C97 | 4.08:1 | 3:1 | PASA |
| Duda: línea sobre el fondo | grafico | `--bg` = #0B0B0D | #876893 | 4.14:1 | 3:1 | PASA |
| Borde de acento sobre superficie (decorativo) | adorno | `--surface` = #141417 | #5B4B32 | 2.18:1 | 3:1 | aviso |
| Borde verde sobre superficie (decorativo) | adorno | `--surface` = #141417 | #3E554B | 2.28:1 | 3:1 | aviso |
| Borde de peligro sobre superficie (decorativo) | adorno | `--surface` = #141417 | #5A3537 | 1.75:1 | 3:1 | aviso |
| Texto atenuado sobre superficie 3 | adorno | `--surface-3` = #222227 | #88837A | 4.20:1 | 4.5:1 | aviso |
| Texto suave sobre superficie 2 | adorno | `--surface-2` = #1A1A1E | #BDB8AE | 8.78:1 | 4.5:1 | PASA |

### Tema claro

| Comprobación | Categoría | Fondo efectivo | Frente efectivo | Ratio | Mínimo | Estado |
|---|---|---|---|---:|---:|---|
| Texto principal sobre el fondo | texto | `--bg` = #F3F0E8 | #1D1B17 | 15.10:1 | 4.5:1 | PASA |
| Texto principal sobre superficie | texto | `--surface` = #FBF8F1 | #1D1B17 | 16.21:1 | 4.5:1 | PASA |
| Texto suave sobre superficie | texto | `--surface` = #FBF8F1 | #575148 | 7.40:1 | 4.5:1 | PASA |
| Texto suave sobre el fondo | texto | `--bg` = #F3F0E8 | #575148 | 6.89:1 | 4.5:1 | PASA |
| Texto atenuado sobre superficie | texto | `--surface` = #FBF8F1 | #6E675C | 5.27:1 | 4.5:1 | PASA |
| Texto atenuado sobre superficie 2 | texto | `--surface-2` = #F1ECE1 | #6E675C | 4.74:1 | 4.5:1 | PASA |
| Texto atenuado sobre el fondo | texto | `--bg` = #F3F0E8 | #6E675C | 4.91:1 | 4.5:1 | PASA |
| Acento sobre accent-soft (badge «Ampliación», chips) | texto | `--accent-soft sobre --surface` = #EFE6D8 | #8F520E | 5.01:1 | 4.5:1 | PASA |
| Acento sobre bg-soft (números de concepto del lector) | texto | `--bg-soft` = #ECE8DE | #8F520E | 5.08:1 | 4.5:1 | PASA |
| Texto del botón principal sobre el acento | texto | `--accent` = #8F520E | #FFF9F0 | 5.93:1 | 4.5:1 | PASA |
| Acento en iconos sobre superficie | icono | `--surface` = #FBF8F1 | #8F520E | 5.86:1 | 3:1 | PASA |
| Acento en iconos sobre el fondo | icono | `--bg` = #F3F0E8 | #8F520E | 5.45:1 | 3:1 | PASA |
| Texto de alerta sobre su fondo | texto | `--accent-soft sobre --surface-2` = #E6DBCA | #575148 | 5.74:1 | 4.5:1 | PASA |
| Verde del chip «Completada» sobre green-soft | texto | `--green-soft sobre --surface-2` = #D7DBCE | #186043 | 5.35:1 | 4.5:1 | PASA |
| Verde en iconos sobre superficie | icono | `--surface` = #FBF8F1 | #186043 | 7.09:1 | 3:1 | PASA |
| Verde en iconos sobre el fondo | icono | `--bg` = #F3F0E8 | #186043 | 6.60:1 | 3:1 | PASA |
| Icono de check sobre el verde de completada | icono | `--green` = #186043 | #FFF9F0 | 7.18:1 | 4.5:1 | PASA |
| Peligro sobre danger-soft (aviso del lector) | texto | `--danger-soft sobre --surface-2` = #E9D6CB | #A92016 | 5.13:1 | 4.5:1 | PASA |
| Peligro sobre superficie (botón/etiqueta) | texto | `--surface` = #FBF8F1 | #A92016 | 6.82:1 | 4.5:1 | PASA |
| Peligro sobre el fondo | texto | `--bg` = #F3F0E8 | #A92016 | 6.35:1 | 4.5:1 | PASA |
| Icono de aviso sobre el fondo | icono | `--danger-soft sobre --surface` = #F2E0D9 | #A92016 | 5.67:1 | 3:1 | PASA |
| Importante: texto sobre su fondo (superficie) | texto | `--mark-important-bg sobre --surface` = #ECE1D1 | #6B3A05 | 7.27:1 | 4.5:1 | PASA |
| Importante: texto sobre su fondo (fondo de página) | texto | `--mark-important-bg sobre --bg` = #E5DAC9 | #6B3A05 | 6.81:1 | 4.5:1 | PASA |
| Importante: color de marca sobre superficie | icono | `--surface` = #FBF8F1 | #8F520E | 5.86:1 | 3:1 | PASA |
| Importante: color de marca sobre el fondo | icono | `--bg` = #F3F0E8 | #8F520E | 5.45:1 | 3:1 | PASA |
| Importante: línea sobre superficie | grafico | `--surface` = #FBF8F1 | #AD804E | 3.30:1 | 3:1 | PASA |
| Importante: línea sobre el fondo | grafico | `--bg` = #F3F0E8 | #AB7E4B | 3.16:1 | 3:1 | PASA |
| Entender: texto sobre su fondo (superficie) | texto | `--mark-understand-bg sobre --surface` = #DBE3D9 | #0F4A32 | 7.81:1 | 4.5:1 | PASA |
| Entender: texto sobre su fondo (fondo de página) | texto | `--mark-understand-bg sobre --bg` = #D4DCD1 | #0F4A32 | 7.31:1 | 4.5:1 | PASA |
| Entender: color de marca sobre superficie | icono | `--surface` = #FBF8F1 | #186043 | 7.09:1 | 3:1 | PASA |
| Entender: color de marca sobre el fondo | icono | `--bg` = #F3F0E8 | #186043 | 6.60:1 | 3:1 | PASA |
| Entender: línea sobre superficie | grafico | `--surface` = #FBF8F1 | #588B74 | 3.72:1 | 3:1 | PASA |
| Entender: línea sobre el fondo | grafico | `--bg` = #F3F0E8 | #558871 | 3.57:1 | 3:1 | PASA |
| Repasar: texto sobre su fondo (superficie) | texto | `--mark-review-bg sobre --surface` = #DCE2E5 | #14406B | 8.15:1 | 4.5:1 | PASA |
| Repasar: texto sobre su fondo (fondo de página) | texto | `--mark-review-bg sobre --bg` = #D5DCDD | #14406B | 7.63:1 | 4.5:1 | PASA |
| Repasar: color de marca sobre superficie | icono | `--surface` = #FBF8F1 | #1F5E9C | 6.31:1 | 3:1 | PASA |
| Repasar: color de marca sobre el fondo | icono | `--bg` = #F3F0E8 | #1F5E9C | 5.87:1 | 3:1 | PASA |
| Repasar: línea sobre superficie | grafico | `--surface` = #FBF8F1 | #5D89B4 | 3.47:1 | 3:1 | PASA |
| Repasar: línea sobre el fondo | grafico | `--bg` = #F3F0E8 | #5A87B1 | 3.33:1 | 3:1 | PASA |
| Duda: texto sobre su fondo (superficie) | texto | `--mark-doubt-bg sobre --surface` = #E9DEE5 | #4E2A6B | 8.59:1 | 4.5:1 | PASA |
| Duda: texto sobre su fondo (fondo de página) | texto | `--mark-doubt-bg sobre --bg` = #E2D7DD | #4E2A6B | 8.04:1 | 4.5:1 | PASA |
| Duda: color de marca sobre superficie | icono | `--surface` = #FBF8F1 | #7A3E9C | 6.61:1 | 3:1 | PASA |
| Duda: color de marca sobre el fondo | icono | `--bg` = #F3F0E8 | #7A3E9C | 6.15:1 | 3:1 | PASA |
| Duda: línea sobre superficie | grafico | `--surface` = #FBF8F1 | #9E72B4 | 3.58:1 | 3:1 | PASA |
| Duda: línea sobre el fondo | grafico | `--bg` = #F3F0E8 | #9C70B1 | 3.44:1 | 3:1 | PASA |
| Borde de acento sobre superficie (decorativo) | adorno | `--surface` = #FBF8F1 | #DDCAB1 | 1.51:1 | 3:1 | aviso |
| Borde verde sobre superficie (decorativo) | adorno | `--surface` = #FBF8F1 | #AEC4B6 | 1.74:1 | 3:1 | aviso |
| Borde de peligro sobre superficie (decorativo) | adorno | `--surface` = #FBF8F1 | #E2B7AF | 1.70:1 | 3:1 | aviso |
| Texto atenuado sobre superficie 3 | adorno | `--surface-3` = #E7E1D4 | #6E675C | 4.29:1 | 4.5:1 | aviso |
| Texto suave sobre superficie 2 | adorno | `--surface-2` = #F1ECE1 | #575148 | 6.66:1 | 4.5:1 | PASA |

## Tokens medidos

| Token | Oscuro | Claro |
|---|---|---|
| `--bg` | `#0B0B0D` | `#F3F0E8` |
| `--bg-soft` | `#0E0E11` | `#ECE8DE` |
| `--surface` | `#141417` | `#FBF8F1` |
| `--surface-2` | `#1A1A1E` | `#F1ECE1` |
| `--surface-3` | `#222227` | `#E7E1D4` |
| `--text` | `#F4F1E9` | `#1D1B17` |
| `--text-soft` | `#BDB8AE` | `#575148` |
| `--muted` | `#88837A` | `#6E675C` |
| `--accent` | `#E6B566` | `#8F520E` |
| `--accent-ink` | `#1B1205` | `#FFF9F0` |
| `--green` | `#8FD3B0` | `#186043` |
| `--green-soft` | `rgba(143, 211, 176, .12)` | `rgba(24, 96, 67, .12)` |
| `--danger` | `#F07A7A` | `#A92016` |
| `--danger-soft` | `rgba(240, 122, 122, .11)` | `rgba(169, 32, 22, .11)` |
| `--target-min` | `44px` | `44px` |
| `--z-appbar` | `50` | `50` |
| `--z-sheet` | `80` | `80` |
| `--z-popover` | `100` | `100` |
| `--z-modal` | `120` | `120` |
| `--z-toast` | `160` | `160` |
| `--mark-important` | `#E6B566` | `#8F520E` |
| `--mark-important-bg` | `rgba(230, 181, 102, .18)` | `rgba(143, 82, 14, .14)` |
| `--mark-important-line` | `rgba(230, 181, 102, .60)` | `rgba(143, 82, 14, .72)` |
| `--mark-important-ink` | `#FFE7B8` | `#6B3A05` |
| `--mark-understand` | `#8FD3B0` | `#186043` |
| `--mark-understand-bg` | `rgba(143, 211, 176, .18)` | `rgba(24, 96, 67, .14)` |
| `--mark-understand-line` | `rgba(143, 211, 176, .60)` | `rgba(24, 96, 67, .72)` |
| `--mark-understand-ink` | `#D6F5E4` | `#0F4A32` |
| `--mark-review` | `#8FBDF5` | `#1F5E9C` |
| `--mark-review-bg` | `rgba(143, 189, 245, .18)` | `rgba(31, 94, 156, .14)` |
| `--mark-review-line` | `rgba(143, 189, 245, .60)` | `rgba(31, 94, 156, .72)` |
| `--mark-review-ink` | `#D6E6FF` | `#14406B` |
| `--mark-doubt` | `#D9A6EC` | `#7A3E9C` |
| `--mark-doubt-bg` | `rgba(217, 166, 236, .18)` | `rgba(122, 62, 156, .14)` |
| `--mark-doubt-line` | `rgba(217, 166, 236, .60)` | `rgba(122, 62, 156, .72)` |
| `--mark-doubt-ink` | `#F0DAFA` | `#4E2A6B` |

---

© 2026 ZARCONT — Evidencia interna de QA.
