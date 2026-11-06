# SERUMS QUEST · Observatorio de las Cinco Rutas — versión final

## Abrir

Archivo único y autónomo:

`export/serums-quest-final.html`

- Ábrelo con doble clic en **Chrome o Edge** actualizado, o arrástralo a una pestaña.
- No necesita internet, servidor, instalador ni Game Studio.
- Tamaño: **1.423.690 bytes** (aprox. 1,36 MiB).
- Incluye las **111 preguntas** con sus claves y toda la campaña, los héroes, los 69 cosméticos, el mapa y los guardianes.

## Importar la partida de la app antigua

1. Abre la app antigua **SERUMS QUEST 1.2**.
2. Ve a **Progreso → Ajustes → Exportar progreso**.
3. En esta versión, pulsa **Importar** en el menú principal.
4. Elige el archivo JSON o pega su contenido.
5. Revisa la vista previa y confirma.
6. La versión actual guarda una copia de seguridad antes de importar.

La partida conserva XP, nivel, monedas, etapa, misiones, errores, logros, personajes, cosméticos y equipamiento compatible.

## Guardado

- El juego guarda automáticamente en `localStorage` de este navegador.
- Estado: `serumsquest:voxel:state:v1`.
- Ajustes: `serumsquest:voxel:settings:v1`.
- Si limpias los datos del navegador, exporta un respaldo antes desde **Ajustes → Exportar partida**.
- La pausa conserva la pregunta, los corazones y las respuestas del duelo si vuelves al mapa o al menú. El botón **Reanudar duelo** aparece en el mapa y en el menú.

## Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Moverse por el atrio | WASD / flechas | D-pad |
| Hablar / interactuar | E / Enter | Botón de acción |
| Mapa de avance | M | Botón **Mapa** |
| Bitácora | J | Menú / pausa |
| Héroes | H / C | HUD |
| Inventario | I | HUD |
| Repaso | R | HUD / pausa |
| Pausa | Esc | Botón de pausa |
| Responder en duelo | A B C D / 1–4 | Tarjetas |
| Siguiente pregunta | Enter | Botón **Siguiente** |
| Mapa: rotar / zoom | Flechas / + − | Arrastrar / pinza |
| Mapa: islas 1–5 / vista completa | 1–5 / 0 | Botones de isla |

## Verificación de esta entrega

Probado sobre el HTML exportado abierto con Chrome en `file://`, en un perfil aislado sin Game Studio:

- Menú principal completo y héroe equipado en escena.
- Mapa 3D, 18 nodos y sus estados; compra en tienda; inventario y guardado de atuendo.
- Misión ganada desde el mapa; 100 % de precisión.
- Repaso iniciado y derrota registrada; errores conservados para repaso.
- Pausa en duelo, vuelta al mapa y salida al menú sin perder la pregunta ni los corazones.
- Importación del JSON antiguo y persistencia del estado tras cerrar y reabrir el navegador.
- **Sin peticiones de red**: el registro de red del HTML exportado quedó vacío.
- FPS con aceleración WebGL en este equipo: **mín. 72 FPS · media 75 FPS** en duelo; **mín. 74 · media 75** en mapa.

### Salvedad de rendimiento

En un arranque forzado a render por software (`--disable-gpu`), el duelo bajó a **57 FPS**. La versión funciona, pero **no puedo garantizar 60 FPS en equipos sin aceleración gráfica**. Con WebGL normal, la medición de esta entrega está por encima de 60.

No se generaron imágenes con IA.

## Capturas de la entrega

- [Menú principal](docs/offline-final-menu.png)
- [Mapa](docs/offline-final-map.png)
- [Victoria](docs/offline-final-victory.png)
- [Tienda](docs/offline-final-shop.png)
- [Inventario](docs/offline-final-wardrobe.png)
- [Pausa y vuelta al mapa](docs/offline-final-pause-map.png)
- [Derrota en repaso](docs/offline-final-review-defeat.png)
