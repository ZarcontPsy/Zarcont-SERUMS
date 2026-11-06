# Bloque 3 · cierre

**Game Studio:** versión **64** · `Versión final completa`  
**Build:** `d418c46644c0`  
**Fecha:** 2026-11-06  
**HTML:** `export/serums-quest-final.html` · **1.522.274 bytes**  
**QA:** ninguna regla `dev*` en `game.json`; build final con `FINAL_RELEASE=true`.

## Cierre implementado

- **Móvil:** joystick de 118 px, botones de mapa/pausa, acción de 64 px, objetivos táctiles de 44–48 px, aviso de giro a horizontal y controles ocultos en vertical.
- **Accesibilidad:** foco visible, teclado completo, texto normal/grande, alto contraste, reducir movimiento, tiempo extra y calidad de efectos explicada.
- **Rendimiento:** la calidad baja/media se elige al arrancar en táctiles o render por software; Baja = 1× sin sombras; Media = 1,5× con sombras suaves; Alta = 2× y efectos completos.
- **Guardado nuevo:** exportación JSON `saveSchema: 2`, importación con vista previa, copia local, recordatorio semanal silenciable y aviso de almacenamiento bloqueado.
- **Migraciones:** esquema 2 con normalización de guardados anteriores; el guardado corrupto no se sobrescribe.
- **Recuperación:** copia previa/importación/descarga de datos dañados/empezar de cero archivando el original.
- **Primer inicio:** tutorial de 5 pasos, saltable y repetible desde Ajustes.
- **Ayuda:** controles, repaso espaciado, modos y cosméticos.
- **Créditos:** licencia MIT de three.js conservada y aviso del proyecto.
- **Versión y fecha:** en Ajustes y Créditos.

## Verificación

### HTML final en `file://`, Chrome limpio
- Tutorial visible, saltable; menú completo; pausa; mapa; campaña y victoria.
- Tienda, inventario, repaso y ajustes abiertos.
- Exportación nueva + importación con vista previa: perfil, XP, monedas y marcas idénticos.
- Importación antigua: perfil «Offline QA», 1.2.x.
- Persistencia después de cerrar y reabrir Chrome.
- Sin peticiones de red en el registro de red.
- **FPS:** mapa 75; duelo mínimo 71, media ≈ 75.
- Sin errores de consola.

### Guardado
- Exportado: `SERUMS QUEST VOXEL`, `saveSchema: 2`.
- Reimportado: nombre «Final Roundtrip», XP 2460, monedas 777, marca difícil/favorita conservada.
- Antiguo: «Offline QA», 2510 monedas, `SERUMS QUEST 1.2.x`.
- Cierre/reapertura del navegador: mismo estado local.

### Móvil
- 844×390: joystick 118×118, sin desbordamiento; joystick/pausa visibles.
- 390×844: aviso de giro, `touchControls: none`, sin desbordamiento.

### Recuperación y respaldo
- Recordatorio semanal aparece y se puede posponer.
- Guardado corrupto: pantalla «No he borrado tu partida», recuperación/importación/descarga y reinicio confirmado con archivo del dañado.
- `--disable-local-storage`: la app abre en recuperación y avisa de que el guardado local no está disponible.

### Regresión
- Campaña, mapa, duelo, pausa/reanudación, tienda, inventario, repaso y ajustes.
- Los cuatro modos y la práctica libre ya quedaron validados en los Bloques 1 y 2; el final conserva su lógica.
- Sin QA activa.
- 111 preguntas incrustadas; 30/30 claves de muestra cotejadas con el banco original.

## Decisiones conocidas

- Simulacro sin cuotas fijas por área (la app original seleccionaba por etapa; se informa el reparto real).
- 111 preguntas de la campaña; no se incrustaron las 5.100 del banco general de otras carreras.
- Contrarreloj con feedback inmediato desde el Bloque 2; el original lo difería.
- La captura de estadísticas con datos usa un estado de prueba representativo.
- No se generaron imágenes con IA.

## Evidencia
- `docs/final-menu.png`, `final-tutorial.png`, `final-map.png`, `final-result.png`, `final-shop.png`, `final-wardrobe.png`, `final-review.png`, `final-settings.png`.
- `docs/final-mobile.png`, `final-mobile-portrait.png`.
- `docs/bloque2-estadisticas.png`, `bloque2-retroalimentacion.png`, `bloque2-practica-libre.png`, `bloque2-repaso-marcadas.png`.
- `docs/bloque3-ayuda.png`, `bloque3-creditos.png`, `bloque3-recuperacion.png`, `bloque3-recordatorio-respaldo.png`.
