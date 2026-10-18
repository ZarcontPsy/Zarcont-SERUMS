MOKOTO (tipografía de títulos)
==============================

La app usa esta pila para títulos, cifras destacadas y el logotipo de la barra lateral:

    'Mokoto', 'Michroma', 'Open Sans', system-ui, sans-serif

- **Michroma** se carga desde Google Fonts y es la que se ve por defecto.
- **Mokoto** es una fuente comercial de Drizy Studio (gratuita solo para uso personal), por lo
  que no se incluye en este repositorio. Si la tienes instalada en el sistema, la app la usará
  automáticamente porque la declaración `@font-face` incluye `local('Mokoto')`.

Cómo usarla desde el proyecto
-----------------------------

1. Copia el archivo de la fuente en esta carpeta con el nombre `Mokoto.ttf`.
2. Abre `styles.css` y descomenta la línea indicada en el bloque de `@font-face`:

       @font-face{font-family:'Mokoto';src:url('fonts/Mokoto.ttf') format('truetype');font-display:swap}

3. Recarga la página. No hace falta ningún otro cambio: toda la interfaz que usa `--font-display`
   pasará a Mokoto.

Nota: si el archivo no existe y la URL queda descomentada, la página seguirá funcionando (la
fuente se ignora y cae en Michroma), pero el navegador mostrará un aviso 404 en la consola.
