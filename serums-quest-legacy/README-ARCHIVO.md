# SERUMS QUEST · versión anterior (archivo)

> **Esto es la versión anterior de SERUMS QUEST.** Se conserva **solo para consulta**.
> No es la versión vigente y no debe editarse.

**Estado:** archivada el **6 de noviembre de 2026**.
**Build original:** `ZARCONT-SQ-1.2.0` (RPG 2D estático, HTML/CSS/JS sin compilación).
**Versión vigente:** [`../serums-quest`](../serums-quest/README.md) — el observatorio 3D voxel, anteriormente `serums-quest-voxel`.

## Reglas del archivo

1. **No modificar** nada de esta carpeta. El contenido quedó idéntico al original; solo se movió aquí.
2. Para consultar la versión antigua, abre `index.html` con doble clic. Funciona sin servidor.
3. Las partidas antiguas viven en `localStorage` (claves `serumsquest:state:v1`, `serumsquest:backup:v1`, `serumsquest:journal:v1`) y **no se borran** al mover la carpeta: el navegador las guarda por origen, no por ruta.
4. Para llevar una partida antigua a la versión vigente:
   - abre la versión nueva y usa **Importar → Usar partida local**, o
   - exporta desde aquí con **Ajustes → Exportar progreso** e importa el JSON en la versión nueva.

## Copia de seguridad

Antes de mover nada se hizo una copia verificada con SHA-256 de los dos proyectos:

`C:\Users\USARIO\Documents\ZARCONT SERUMS\_backups\2026-11-06_pre-migracion\`

- `serums-quest\` — copia completa del espacio de trabajo original.
- `serums-quest-voxel\` — copia completa del proyecto voxel.
- `serums-quest_pre-migracion_2026-11-06.zip` y `serums-quest-voxel_pre-migracion_2026-11-06.zip` — los mismos árboles comprimidos.

Los manifiestos `SHA256SUMS.txt` de cada copia se compararon contra el original: **419/419 archivos idénticos** (espacio de trabajo) y **374/374** (voxel). Los ZIP también se extrajeron y compararon: **420/420** y **375/375** sin diferencias.

## Relación con el HUB

El HUB (`../index.html`) sigue apuntando a `../serums-quest/index.html`, que ahora abre la versión vigente. Esta carpeta de archivo **no** forma parte del HUB ni de Game Studio.
