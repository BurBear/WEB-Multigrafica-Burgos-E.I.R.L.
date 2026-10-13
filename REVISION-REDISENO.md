# Revisión del rediseño — 7 de octubre de 2026

## Implementación

- Identidad con azul oscuro, verde y superficies claras; se conserva el logo original.
- Inicio con imagen real existente, prioridad de carga y variante móvil.
- Jerarquía y espaciado comunes; composiciones distintas para valores, catálogo, servicios,
  procesos, sectores, clientes y cotización.
- Cuatro diferenciales completos en desplegables nativos, accesibles con teclado y pantalla táctil.
- Las 16 categorías conservan nombres, materiales, tamaños, gramajes y acabados. Se verificó
  la equivalencia textual con los datos anteriores. El HTML es ahora su única fuente.
- Asociación estable del catálogo; modal accesible con galería, controles y paso a cotización.
- Tres fotografías distintas para las etapas de producción. Los cuatro MP4 de 122.026.073 bytes
  tienen el mismo SHA-256 y se conservaron sin cambios, sin enlazarlos como etapas distintas.
- Se reutiliza el video ya existente `fondo-720.mp4`: 973.059 bytes, 1280 × 720, 16 segundos.
  No se encontró FFmpeg disponible. No fue necesaria otra transcodificación para ofrecer una
  demostración opcional de menos de 1 MB. Se generó su poster a partir de un fotograma.
- Se compararon visualmente los 34 pares de logos PNG/WebP y se comprobó el canal alfa.
  Los WebP conservan los diseños y fondos transparentes, con márgenes de un lienzo 320 × 180;
  no son copias de idénticas dimensiones. Se muestran sin deformar su proporción.
- Diez referencias rotas retiradas: sectores utiliza una composición tipográfica y cotización
  una fotografía de acabados existente. No se dejaron placeholders ni imágenes inexistentes.
- Formulario con etiquetas, ayudas, errores asociados por `aria-describedby`, estados de envío
  y recuperación. Se conserva FormSubmit y su POST; no se simula una respuesta satisfactoria.
- Estilos anteriores sustituidos por un único sistema para las dos páginas y los elementos
  creados por JavaScript. No se añadió otra capa de sobrescrituras.
- Metadatos, nueve anclas principales, campos, opciones de servicio y enlaces de contacto preservados.

## Verificación

Se verificó en Chrome local mediante su protocolo DevTools, con perfiles aislados y sin enviar
solicitudes comerciales. `FormSubmit` se bloqueó en la sesión de pruebas y el evento de envío válido
se interceptó después de ejecutar el validador, antes de cualquier solicitud de red.

- Viewports: 360, 390, 768 y 1440 px, alto 900 px, DPR 1.
- Sin desbordamiento horizontal, imágenes rotas, respuestas locales 404 ni excepciones JavaScript.
- Menú, anclas visibles bajo la cabecera, catálogo completo, reordenamiento de tarjetas,
  detalles de los 16 productos y navegación del modal.
- Tab y Shift+Tab contenidos dentro del modal; Escape y restauración del foco;
  imposibilidad de enfocar el formulario del fondo mientras el modal está abierto.
- Procesos con tres fotos diferentes y navegación por flechas, Inicio y Fin.
- Validación de campos, ayudas asociadas, conservación del mensaje existente,
  comportamiento del POST y recuperación al regresar con el historial.
- Los 34 logos están accesibles; el desplegable evita mostrar todos de entrada.
- Video sin carga inicial, reproducción solicitada por el usuario, pausa fuera de pantalla
  y al cerrar su contenedor.
- Movimiento reducido al cargar y al cambiar la preferencia durante la visita; sin animaciones
  activas ni contenido oculto tras ese cambio.
- Sin GSAP: la interfaz y el catálogo funcionan. Sin JavaScript: menú y fichas nativos,
  contenido visible, tres procesos y validación HTML disponibles.
- `gracias.html` comprobada en los cuatro anchos.
- Prueba adicional con eventos táctiles de DevTools: 390 × 844, DPR 2, menú, ancla, producto y cierre.
- `node scripts/check.mjs` y `git diff --check`.

## Mediciones

| Ancho | Transferencia antes | Transferencia despues | LCP antes / despues | CLS antes / despues |
| --- | --- | --- | --- | --- |
| 1440 px | 34.02 MB | 0.59 MB | 460 / 560 ms | 0.0512 / 0.0008 |
| 390 px | 33.98 MB | 0.52 MB | 324 / 260 ms | 0.0053 / 0.0008 |

No se solicitaron MP4 durante la carga inicial de la nueva version.


Los 34 logos pasaron de **31.750.651 bytes de PNG** a **429.730 bytes de WebP**: reducción del 98,6 %
del conjunto. Además, ya no se duplica la lista ni se descarga completa al iniciar.
El CSS pasó de **139.285 bytes** a aproximadamente **30 KB**, sin minificar ni comprimir.

No se ejecutó Lighthouse: no estaba instalado en el entorno. Los valores de carga y estabilidad
se obtuvieron con Network y PerformanceObserver de Chrome, no son puntuaciones Lighthouse.
La prueba utiliza el mismo equipo, navegador, servidor HTTP local, caché desactivada, sin limitación
artificial de CPU/red, seis segundos sin desplazarse y las mismas dimensiones por comparación.
Es una muestra local por configuración; los tiempos absolutos no representan una conexión móvil
real ni resultados de campo. Las fuentes y bibliotecas de CDN pueden introducir variación.

## Capturas

Las capturas son archivos locales, excluidos de Git:

- [Inicio, escritorio](.local/screenshots/inicio-escritorio.png)
- [Inicio, móvil](.local/screenshots/inicio-movil.png)
- [Inicio, tablet](.local/screenshots/inicio-tablet.png)
- [Página completa, escritorio](.local/screenshots/completa-1440.png)
- [Página completa, móvil](.local/screenshots/completa-390.png)
- [Modal, móvil](.local/screenshots/modal-390.png)
- [Cotización, móvil](.local/screenshots/cotizacion-390.png)
- [Confirmación, móvil](.local/screenshots/thanks-390.png)

## Recursos específicos todavía no suministrados

**Ninguno de estos archivos es necesario para que la versión implementada funcione.**
Las composiciones actuales usan recursos disponibles y no los referencian. Si se desea sustituirlas
por fotografías propias de cada sector o del equipo de la empresa, estos son nombres y formatos sugeridos:

| Recurso opcional | Ruta sugerida | Proporción | Dimensiones |
| --- | --- | --- | --- |
| Empresas corporativas | `img/sectores/empresas-corporativas.webp` | 4:3 | 1200 × 900 |
| Educación e instituciones | `img/sectores/educacion-instituciones.webp` | 4:3 | 1200 × 900 |
| Restaurantes y negocios | `img/sectores/restaurantes-negocios.webp` | 4:3 | 1200 × 900 |
| Clínicas y laboratorios | `img/sectores/clinicas-laboratorios.webp` | 4:3 | 1200 × 900 |
| Editoriales y autores | `img/sectores/editoriales-autores.webp` | 4:3 | 1200 × 900 |
| Comercios y emprendedores | `img/sectores/comercios-emprendedores.webp` | 4:3 | 1200 × 900 |
| Equipo o producción para cotización | `img/cotizacion/cotizacion-principal.webp` | 4:3 | 1200 × 900 |
| Preprensa propia | `img/cotizacion/preprensa.webp` | 8:5 | 800 × 500 |
| Prensa propia | `img/cotizacion/prensa.webp` | 8:5 | 800 × 500 |
| Postprensa propia | `img/cotizacion/postprensa.webp` | 8:5 | 800 × 500 |

Si se requieren videos por etapa, aportar **tres grabaciones auténticamente diferentes**;
usar nombres nuevos como `video/preprensa-720-v1.mp4`, `video/prensa-720-v1.mp4` y
`video/postprensa-720-v1.mp4`, 16:9, 1280 × 720, más posters con el mismo nombre en WebP.
No sobrescribir los originales conservados. Para servicios, una foto específica del encolado
(`img/servicios/encolado-proceso.webp`, 8:5, 1200 × 750) permitiría sustituir la imagen actual
de libros terminados; no se presenta esa imagen como una máquina encoladora.

## Límites y datos por confirmar

- Teléfono del footer: **949 943 587**. WhatsApp: **903 025 062**. Ambos conservados.
- Entrega efectiva de correo, activación de FormSubmit y redirección pública: no probadas con un envío real.
- El servicio local no interpreta `.htaccess`; comprobar cabeceras y caché en el alojamiento Apache.
- No se verificaron Safari/Firefox ni dispositivos físicos; los anchos y eventos táctiles son emulados.
- No se midió rendimiento en producción ni en redes móviles reales.
- No se publicaron los cambios.
