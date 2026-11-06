# Bloque 2 · aprendizaje

**Versión de Game Studio:** 59 · `Bloque 2 · aprendizaje`  
**Build:** `b1c8223d5ee1`  
**HTML checkpoint:** `export/serums-quest-bloque2.html`  
**Tamaño:** 1.486.007 bytes (≈ 1,42 MiB)

## Lo añadido

- **Retroalimentación inmediata** en campaña, Diario, Supervivencia, Práctica libre y Contrarreloj. Muestra la clave y el texto de la opción correcta; si una pregunta tuviera `explanation`, también la muestra.
- **Simulacro** conserva la clave oculta hasta el informe final. El informe ya muestra “Clave X: texto” por respuesta.
- **Práctica libre por área:** 10 preguntas de un área, sin corazones ni reloj, con retroalimentación inmediata. No paga recompensa de cierre; los aciertos conservan XP de pregunta y los fallos entran al repaso.
- **Marcas:** cada pregunta se puede marcar como **difícil** o **favorita** desde el duelo. El repaso incorpora un panel “Marcadas” con las marcas y permite cambiarlas allí.
- **Panel de estadísticas:** respuestas, precisión global, tiempo medio, errores guardados, marcas, precisión por área, tendencia reciente, errores frecuentes, historial de simulacros y recomendación neutra.
- **Audio sintetizado WebAudio:** efectos de acierto, fallo, ataque, compra y logro; ambiente opcional generado en código. **Apagado por defecto**; incluye activar sonido, ambiente, volumen, silencio total y persistencia de preferencias.
- **“Silencio total”** corta efectos y ambiente y detiene el pad; al desactivarlo vuelve el audio si estaba activado.

## Decisiones que debes conocer

1. **Contrarreloj ahora da feedback inmediato.** La app original difería la clave hasta el final en este modo; el Bloque 2 pide feedback tras cada respuesta salvo en Simulacro. Cambié solo la presentación, no las preguntas, el tiempo ni la aprobación. El Simulacro sigue sin pistas.
2. **El banco actual no trae campo de explicación.** Se muestra la respuesta correcta de forma clara (“La respuesta correcta era B: …”). El soporte para `explanation` queda preparado si se añade ese campo.
3. **Práctica libre = 10 preguntas por área.** Elegí 10 para que quepa en una sesión corta. No paga bono de cierre; cada acierto conserva su XP. Si prefieres otra cantidad o que tampoco dé XP, dímelo.
4. **Las marcas no alteran recompensas, campaña, desbloqueos ni cosméticos.** Son una capa personal de estudio.
5. **La recomendación usa un umbral mínimo de 3 respuestas por área.** Si no hay datos suficientes, lo dice en vez de inventar una conclusión.
6. **Las capturas de estadísticas usan un estado de prueba realista** de 60 respuestas, 3 errores y 2 simulacros para que el panel se vea con datos. El panel real lee el guardado local del jugador.
7. **Audio apagado por defecto:** las partidas existentes que ya tenían sonido activado conservan su preferencia; las partidas nuevas empiezan en silencio.
8. **QA temporal:** siguen existiendo hooks de prueba para abrir modos/estadísticas y sembrar datos. Se eliminan en el Bloque 3.

## Verificación

- Práctica libre: `mode=practice`, 10 preguntas, sin corazones ni temporizador.
- Feedback de error: “La respuesta correcta era B: Participación comunitaria” y fallo programado.
- Marcas: estado persistido en `questionTags` y panel “Marcadas” visible en el repaso.
- Estadísticas: precisión por área, tiempo medio, tendencias (`+67`, `-33`, estable), errores frecuentes, historial de simulacros y recomendación “Investigación”.
- Audio:
  - Inicial: `context=none`, `sound=false`, `ambient=false`, `muted=false`, sin pad.
  - Sonido activado: contexto `running`.
  - Ambiente activado: `ambientRunning=true`.
  - Volumen 30 %: `volume=0.3`.
  - Silencio: `muted=true`, `ambientRunning=false`.
- Sin errores de consola en las verificaciones.
- **FPS:** Práctica libre **73/75**; Contrarreloj **72/75**; panel de estadísticas **75**; regresión de campaña **61/74**.
- No se generaron imágenes con IA.

## Evidencia

- [Panel de estadísticas con datos](bloque2-estadisticas.png)
- [Retroalimentación tras fallo](bloque2-retroalimentacion.png)
- [Práctica libre por área](bloque2-practica-libre.png) · [Selector de área](bloque2-practica-selector.png)
- [Feedback inmediato en Contrarreloj](bloque2-contrarreloj-feedback.png)
- [Marcadas dentro del repaso](bloque2-repaso-marcadas.png)
- [Audio apagado por defecto](bloque2-audio-apagado.png) · [Silencio total / volumen](bloque2-audio-silencio.png)
