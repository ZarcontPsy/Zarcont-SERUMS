# SERUMS QUEST · Observatorio de las Cinco Rutas — Versión final completa

**Archivo único:** `export/serums-quest-final.html`  
**Tamaño:** 1.522.274 bytes (≈ 1,45 MiB)  
**Versión:** 64 · «Versión final completa» · compilada el 2026-11-06.  
**Sin conexión, sin cuentas y sin recursos externos.** Incluye 111 preguntas con sus claves.

## Abrir

Abre el HTML con doble clic en **Chrome o Edge** actualizado, o arrástralo a una pestaña. No necesita servidor, instalador ni internet.

El guardado vive en `localStorage` de ese navegador. Si borras los datos del sitio, se pierde el guardado local: exporta un respaldo antes.

## Guardar, exportar e importar

- **Exportar partida:** Ajustes → Exportar partida. Genera un JSON nuevo con `saveSchema: 2`.
- **Importar:** Ajustes → Importar partida. Acepta tanto la partida antigua de SERUMS QUEST 1.2 como un respaldo nuevo. Primero muestra una vista previa y conserva una copia previa antes de reemplazar.
- **Copia local:** Ajustes → Guardar copia local. Sirve para recuperación desde el mismo navegador.
- **Recordatorio semanal:** aviso neutral si llevas días sin exportar. Puedes posponerlo o silenciarlo.
- **Recuperación:** si el guardado se corrompe, la app no lo sobrescribe: ofrece recuperar una copia, importar un archivo, descargar los datos dañados o empezar de cero (archivando antes el contenido dañado).
- **Almacenamiento bloqueado:** si el navegador no permite guardar, aparece un aviso claro y la app mantiene la sesión abierta para que puedas exportar.

## Modos

| Modo | Regla |
| --- | --- |
| Diario | 6 preguntas mezcladas, una vez al día; cuenta para la racha. |
| Supervivencia | 10 preguntas, 3 oportunidades, 45 s por pregunta; récord personal. |
| Contrarreloj | 3/5/8 min y 8/12/18 preguntas; 70 % del total y mínimo 8 respuestas. |
| Simulacro | 20 preguntas, 15 min, etapa Dominio; clave al final, informe por área e historial. |
| Práctica libre | 10 preguntas de un área, sin corazones ni reloj; sin bono de cierre. |

Las recompensas de cierre se registran una vez al día. Nunca se restan monedas. Los errores entran al repaso espaciado. Los modos no completan misiones ni desbloquean jefes.

## Aprendizaje

- Feedback inmediato con la clave correcta en campaña, Diario, Supervivencia, Contrarreloj y Práctica libre. El Simulacro reserva la clave para el informe final.
- Marcas **difíciles** y **favoritas** desde la pregunta; aparecen en el panel Marcadas del Repaso.
- **Estadísticas:** precisión y tendencia por área, tiempo medio, errores frecuentes, historial de simulacros y una recomendación neutra.
- **Repaso espaciado:** 20 minutos, 1, 3, 7, 14 y 30 días.

## Audio y accesibilidad

- Audio WebAudio **apagado por defecto**. Activa efectos y ambiente en Ajustes; incluye volumen y **silencio total**.
- Efectos sintetizados de acierto, fallo, ataque, compra y logro; ambiente generado en código. Sin archivos de audio externos.
- **Reducir movimiento**, **texto grande**, **alto contraste** y **calidad de efectos** (baja/media/alta, con explicación de cada nivel).
- En táctil o sin aceleración gráfica la calidad arranca en baja/media automáticamente; puedes cambiarla.
- Teclado completo y foco visible. En móvil, joystick, botones de mapa/pausa y aviso de giro a horizontal.

## Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Moverse | WASD / flechas | Joystick |
| Interactuar | E / Enter | Botón de acción |
| Mapa | M | Mapa |
| Bitácora | J | HUD / pausa |
| Repaso | R | HUD / pausa |
| Modos | G | Menú / pausa |
| Responder | A–D / 1–4 | Tarjetas |
| Pausa | Esc | Pausa |

## Ayuda y créditos

- Tutorial de primer inicio saltable y repetible desde Ajustes.
- Pantalla de Ayuda con controles, repaso, modos y cosméticos.
- Créditos con la licencia MIT de three.js y el aviso del proyecto.
- Versión y fecha de compilación visibles en Ajustes.

## Verificación de la entrega

Archivo final abierto con Chrome en `file://`, perfil limpio, sin Game Studio:

- Tutorial, menú, pausa, mapa, campaña, victoria, tienda, inventario, repaso y ajustes.
- Exportación nueva e importación con vista previa: mismos datos (XP, monedas, marcas, historial).
- Importación de la partida antigua: perfil «Offline QA · 1.2.x».
- Persistencia tras cerrar y reabrir el navegador.
- Móvil horizontal 844×390: joystick de 118 px, sin desbordamiento; vertical 390×844: aviso de giro y controles ocultos.
- **Sin peticiones de red** (registro de red vacío).
- **FPS final:** mapa 75; duelo mínimo 71, media ≈ 75. Sin errores de consola.
- 111 preguntas incrustadas; 30/30 claves de muestra cotejadas contra el banco original.

### Decisiones y límites conocidos

- **Simulacro:** la app original no impone cuotas fijas por área; conservé su selección por etapa y muestro el reparto real. Si se quieren cuotas iguales, es un ajuste de producto.
- **Banco:** están las 111 preguntas de esta campaña. El banco oficial general tiene 5.100 preguntas de otras carreras; no se incrustaron para no inflar el HTML.
- **Contrarreloj:** el Bloque 2 pidió feedback tras cada respuesta; se muestra inmediatamente. La app antigua lo difería al final.
- **Los datos de las capturas de estadísticas** usaron un estado de prueba realista; el panel real lee el guardado del jugador.
- No se generaron imágenes con IA.

## Evidencia

- [Menú](docs/final-menu.png)
- [Tutorial](docs/final-tutorial.png)
- [Mapa](docs/final-map.png)
- [Resultado de campaña](docs/final-result.png)
- [Tienda](docs/final-shop.png)
- [Inventario](docs/final-wardrobe.png)
- [Repaso](docs/final-review.png)
- [Ajustes](docs/final-settings.png)
- [Móvil horizontal](docs/final-mobile.png)
- [Aviso de giro](docs/final-mobile-portrait.png)
- [Estadísticas con datos](docs/bloque2-estadisticas.png)
- [Retroalimentación](docs/bloque2-retroalimentacion.png)
- [Práctica libre](docs/bloque2-practica-libre.png)
- [Marcadas en repaso](docs/bloque2-repaso-marcadas.png)
- [Ayuda](docs/bloque3-ayuda.png)
- [Créditos](docs/bloque3-creditos.png)
- [Recuperación](docs/bloque3-recuperacion.png)
- [Recordatorio de respaldo](docs/bloque3-recordatorio-respaldo.png)
