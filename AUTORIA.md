# AUTORIA.md — Registro central de autoría y versiones

**Titular y marca:** ZARCONT
**Repositorio:** `LAUNCHER SERUMS` (lanzador + dos aplicaciones)
**Licencia:** propietaria — © 2026 ZARCONT, todos los derechos reservados (ver `LICENSE`)
**Última revisión de este registro:** 2026-10-17

---

## 1. Componentes del repositorio

| Componente | Ruta | Versión | Autoría | Origen |
|---|---|---|---|---|
| SERUMS HUB (lanzador) | `index.html` | 1.0.0 | ZARCONT | Desarrollo original; diseño conforme a `DESIGN-SYSTEM.md`. |
| Examen Studio — BANQUEAR | `EXAMEN STUDIO/Examen Studio.html` | (sin versión declarada en el archivo) | ZARCONT | Desarrollo original; app de un solo archivo, datos del usuario en IndexedDB local. |
| SERUMS Map Explorer — PLAZAS SERUMS | `serums map/serums-map-explorer/` | 1.0.0 (`package.json`) | ZARCONT | Desarrollo original; datos derivados de fuentes públicas (ver §3). |
| Sistema de diseño | `DESIGN-SYSTEM.md` | 1.0 | ZARCONT | Documento interno del proyecto. |
| Datos generados | `datos/datos_plazas.js`, `datos/datos_adjudicados.js` | — | ZARCONT (compilación) | Generados por scripts propios a partir de las fuentes públicas de §3. |

## 2. Identificadores técnicos

- SERUMS HUB: identificador de compilación `ZARCONT-SRH-1.0.0` (visible en «Acerca de»).
- Encabezado de autoría: cada archivo propio incluye una línea `© 2026 ZARCONT`.
- Metadatos: `<meta name="author" content="ZARCONT">` en las tres interfaces.

## 3. Procedencia de datos y terceros

- Los conjuntos de datos provienen de documentos y listados públicos oficiales (MINSA):
  oferta de plazas remuneradas SERUMS 2026-I, listado RENIPRESS, listado de adjudicados y
  resultados finales. El proyecto no reclama autoría sobre ellos; solo los procesa y muestra.
- Librerías, fuentes tipográficas y servicios de terceros: ver `NOTICE.md`. No se reclama
  autoría sobre componentes de terceros; sus licencias prevalecen para dichos componentes.

## 4. Registro de modificaciones de esta revisión (2026-10-17)

Todas las modificaciones son **aditivas** (comentarios, metadatos, textos de interfaz y
archivos nuevos). No alteran lógica, datos ni diseño funcional. Son **reversibles**:
basta eliminar las líneas, botones o archivos indicados.

| Archivo | Cambio |
|---|---|
| `index.html` (raíz) | Comentario de autoría + `meta author`; botón y modal «Acerca de»; crédito de esquina «SERUMS HUB · © 2026 ZARCONT»; marca ZARCONT en la pantalla de carga; `version`/`build` en `CONFIG`; el modal de atajos se generalizó a un util de modales (mismo comportamiento). |
| `EXAMEN STUDIO/Examen Studio.html` | Comentario + `meta author`; «· © 2026 ZARCONT» en el pie existente; comentario de autoría junto al script principal. |
| `serums map/serums-map-explorer/index.html` | Comentario + `meta author`. |
| `serums map/serums-map-explorer/styles.css` y `js/*.js` (7 módulos) | Línea de copyright tras el encabezado existente de cada archivo. |
| `serums map/serums-map-explorer/js/app.js` | Línea de autoría en la tarjeta «Acerca de» (Configuración). |
| `serums map/serums-map-explorer/README.md` | Sección «Autoría y licencia». |
| `serums map/serums-map-explorer/package.json` | `author`, `license` propietaria, `private: true`. |
| `serums map/serums-map-explorer/tests/*.py` (9 archivos) | Línea de copyright al inicio. |
| `DESIGN-SYSTEM.md` | Pie de autoría. |

**Archivos nuevos:** `LICENSE` (+ copias en `EXAMEN STUDIO/` y
`serums-map-explorer/`), `AUTORIA.md` (este archivo), `NOTICE.md`,
`verificar_integridad.py`, `INTEGRITY.sha256` (manifiesto generado).

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
