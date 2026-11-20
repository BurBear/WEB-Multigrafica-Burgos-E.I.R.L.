# Multigráfica Burgos

Web corporativa estática en HTML, CSS y JavaScript nativo. La publicación por ZIP y cPanel no requiere Node.js, instalación de paquetes ni compilación. El formulario utiliza FormSubmit como servicio externo de recepción.

## Vista local y comprobaciones

Desde la raíz del repositorio, con Node.js instalado:

```powershell
node scripts/serve.mjs
```

Abrir `http://127.0.0.1:8000`. Detener el servidor con `Ctrl+C`.
El servidor solo escucha en la máquina local y no interpreta `.htaccess`.

```powershell
node scripts/check.mjs
node scripts/check-hero.mjs
```

Comprueba sintaxis JavaScript, recursos locales, anclas, identificadores del catálogo,
imágenes del visor, formato y dimensiones reales de PNG/WebP, srcset, contrato del formulario,
logos, canonical y sitemap. La prueba del hero comprueba estados y no sustituye pruebas en navegador.
No envía formularios ni modifica archivos.

## Archivos y mantenimiento

- `index.html`: introducción de la empresa y accesos a las páginas principales.
- `nosotros.html`: trayectoria, atención al cliente, procesos y clientes.
- `productos.html`: catálogo y visor de productos.
- `servicios.html`: servicios y enlaces de cotización. Los procesos están en Nosotros y los sectores en Inicio.
- `cotizacion.html`: formulario, con referencia opcional al producto o servicio elegido.
- `gracias.html`: destino de confirmación configurado para FormSubmit; no se navega a esta página desde JavaScript para simular un envío.
- `css/style.css`: sistema visual compartido. Orden: variables, base, navegación, secciones, modal y reglas adaptables.
- `js/main.js`: mejoras independientes de navegación, catálogo, procesos, video y animaciones.
- `js/validacion.js`: validación accesible y estado de envío. El envío sigue siendo un POST HTML tradicional.
- `img/optimized/`: recursos utilizados por las páginas. Los cuatro servicios optimizados en Fase 1 tienen WebP real a 480, 800 y resolución original; sus originales están respaldados fuera del proyecto. Ver `docs/FASE-1-OPTIMIZACION.md`.
- `img/nosotros/`: las tres imágenes originales de Asesoría directa, Revisión previa y Presentación final, utilizadas en las tarjetas de `nosotros.html`.
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

La portada reproduce `video/hero-inicio.mp4?v=20261119-1` una sola vez, sin sonido.
Al terminar muestra `video/hero-poster-20261119.webp`, también utilizado como poster y
priorizado durante la carga. El video espera a que termine la imagen prioritaria y a que
el hero esté visible; no se instala ninguna biblioteca para este comportamiento.
La copia web conserva H.264, 1080p y 30 fps. Los originales MOV, PNG y el MP4 anterior
se conservan en un respaldo externo identificado en el informe de Fase 1.
El visitante puede pausar y reanudar el fondo; al salir de pantalla o cambiar de pestaña
se pausa. Sin JavaScript, con movimiento reducido o si falla la reproducción, se muestra
la imagen estática. El video no se repite al terminar.

### Formulario

Se conservaron el destino de FormSubmit, método POST, campos, opciones, `_captcha` y `_next`.
La validación no representa una confirmación de recepción. El navegador debe recibir la respuesta
del servicio externo. El botón recupera su estado al volver a la página; una espera prolongada
informa que la recepción no ha sido confirmada y permite revisar antes de reenviar.

El teléfono de contacto y WhatsApp utilizan el mismo número: **949 943 587**.
Los enlaces de WhatsApp usan el formato internacional `51949943587`.

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

Las páginas enlazan CSS y JavaScript con versiones explícitas en sus URL. Al cambiar un
recurso en futuras publicaciones, incrementar su versión en todas las páginas que lo cargan. Los derivados de imágenes tienen rutas
propias; para reemplazarlos en producción, usar una ruta nueva o versionar también su URL.

La publicación sigue siendo estática. Incluir las páginas, CSS, JS y recursos referenciados;
excluir `.git`, `.local`, `docs`, herramientas de revisión, archivos `.rar` y originales de respaldo. En un clon nuevo, recuperar los objetos
Git LFS antes de publicar videos. No se ha publicado la Fase 1 ni se han activado redirecciones en el hosting.

`REVISION-REDISENO.md` conserva el informe de la versión anterior (7 de octubre).
La Fase 1 prepara sitemap y robots para `https://www.multigraficaburgos.pe/`.
`.htaccess` permanece sin cambios; revisar reglas de cPanel y proxy antes de activar redirecciones.
El informe `docs/FASE-1-OPTIMIZACION.md` incluye medidas, limitaciones y recuperación.
