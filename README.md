# Multigráfica Burgos

Web corporativa estática en HTML, CSS y JavaScript nativo. No requiere instalación de paquetes, compilación, backend ni base de datos.

## Vista local y comprobaciones

Desde la raíz del repositorio, con Node.js instalado:

```powershell
node scripts/serve.mjs
```

Abrir `http://127.0.0.1:8000`. Detener el servidor con `Ctrl+C`.
El servidor solo escucha en la máquina local y no interpreta `.htaccess`.

```powershell
node scripts/check.mjs
```

Comprueba sintaxis JavaScript, recursos locales, anclas, identificadores del catálogo,
imágenes del visor, dimensiones, campos y destino del formulario, logos y carga de video.
No envía formularios ni modifica archivos.

## Archivos y mantenimiento

- `index.html`: introducción de la empresa y accesos a las páginas principales.
- `nosotros.html`: trayectoria, atención al cliente, diferenciales y clientes.
- `productos.html`: catálogo con filtros y visor de productos.
- `servicios.html`: servicios, etapas de producción y sectores atendidos.
- `cotizacion.html`: formulario, con referencia opcional al producto o servicio elegido.
- `gracias.html`: destino de confirmación configurado para FormSubmit; no se navega a esta página desde JavaScript para simular un envío.
- `css/style.css`: sistema visual compartido. Orden: variables, base, navegación, secciones, modal y reglas adaptables.
- `js/main.js`: mejoras independientes de navegación, catálogo, procesos, video y animaciones.
- `js/validacion.js`: validación accesible y estado de envío. El envío sigue siendo un POST HTML tradicional.
- `img/optimized/`: copias reducidas de recursos existentes y un poster del video; se conservaron todos los originales.
- `.htaccess`: compresión, caché de recursos, revalidación de HTML y cabeceras existentes.
- `.gitattributes`: los videos continúan gestionados con Git LFS.
- `.local/`: capturas, mediciones y herramientas temporales de revisión; no se versiona ni se publica.

### Catálogo

La información vive **una sola vez**, dentro de cada `.product-card` en `productos.html`.
El `summary` tiene un `data-product-index` único y estable. No cambiar ese ID al reordenar tarjetas.
Los datos del modal se leen de la tarjeta, y las tres imágenes de detalle se toman de sus enlaces
`.product-image-links`. Sin JavaScript, los mismos datos se consultan en un desplegable nativo.

### Navegación y procesos

El menú de escritorio y el desplegable móvil contienen los mismos cinco enlaces a páginas HTML;
al cambiarlos, actualizar ambos en las cinco páginas. El enlace actual usa `aria-current="page"`.
CSS muestra únicamente la navegación correspondiente al ancho de pantalla.
El menú móvil usa `details/summary`: puede abrirse sin JavaScript y no cambia la altura de la cabecera al inicializarse.

Los procesos tienen tres artículos con fotos diferentes. JavaScript los convierte en pestañas
con flechas, Inicio y Fin; sin JavaScript, los tres artículos siguen disponibles.

El video `video/fondo-720.mp4` es una demostración general de producción, no tres grabaciones
distintas. Se reproduce solo por acción del visitante, usa `preload="none"`, tiene poster y se pausa
al salir de pantalla, cerrar el desplegable o dejar la pestaña. No se reanuda automáticamente.

### Formulario

Se conservaron el destino de FormSubmit, método POST, campos, opciones, `_captcha` y `_next`.
La validación no representa una confirmación de recepción. El navegador debe recibir la respuesta
del servicio externo. El botón recupera su estado al volver a la página; una espera prolongada
informa que la recepción no ha sido confirmada y permite revisar antes de reenviar.

El teléfono de contacto **949 943 587** y WhatsApp **903 025 062** son distintos y se conservaron.
Confirmar con la empresa antes de unificarlos.

### Animación y accesibilidad

Las entradas usan IntersectionObserver y Web Animations API, sin GSAP ni dependencias de animación.
No se intercepta la rueda de desplazamiento ni se fijan secciones durante recorridos.
El contenido es visible por defecto. Las animaciones son mejoras opcionales y se desactivan con
`prefers-reduced-motion`, incluso al cambiar esa preferencia durante la visita.

El modal usa `dialog.showModal()`, que bloquea la interacción con el fondo, y añade contención
de foco, Escape, flechas, Inicio/Fin y restauración del foco. El CTA de producto abre
`cotizacion.html?producto=...` y completa el mensaje únicamente si todavía está vacío.
Los enlaces de servicio pueden añadir `servicio`, validado contra las opciones del formulario.
Los enlaces antiguos como `index.html#productos` se redirigen a la página correspondiente.

### Versionado y publicación

Las páginas enlazan CSS y JavaScript con `?v=20261008-1`. Al cambiar estos archivos en futuras
publicaciones, incrementar la versión en todas las páginas. Los derivados de imágenes tienen rutas
propias; para reemplazarlos en producción, usar una ruta nueva o versionar también su URL.

La publicación sigue siendo estática. Incluir las páginas, CSS, JS y recursos referenciados;
excluir `.git`, `.local` y herramientas de revisión. En un clon nuevo, recuperar los objetos
Git LFS antes de publicar videos. No se publicó ningún cambio durante el rediseño.

`REVISION-REDISENO.md` conserva el informe de la versión anterior (7 de octubre).
Antes de publicar las nuevas páginas, revisar su incorporación al sitemap; no se modificó
`sitemap.xml`, `robots.txt` ni `.htaccess` durante esta actualización visual.
