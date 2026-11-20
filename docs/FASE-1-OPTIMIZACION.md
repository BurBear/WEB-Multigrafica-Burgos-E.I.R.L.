# Fase 1 — Optimización técnica

Fecha: 19 de noviembre de 2026. Base: `21b8613`.
Rama de trabajo: `optimizacion-tecnica-fase1`.

Esta fase conserva HTML, CSS y JavaScript estáticos. No instala bibliotecas, no requiere
compilación y no cambia la publicación mediante ZIP y cPanel. No se ha subido a producción.

## Cambios y respaldo

El respaldo completo de los 22 archivos iniciales relevantes está fuera del proyecto:

`C:/Users/luisb/OneDrive/Escritorio/Respaldos-Multigrafica-Burgos/fase1-20261119/`

`baseline.json` identifica la base, las rutas, los tamaños y SHA-256 de esos archivos.
Los originales con extensión WebP conservan allí sus bytes PNG originales. No se recrearon
ni modificaron las fotografías mediante generación de imágenes.

Los originales `video/Fondo.PNG` y `video/Fondo.MOV` se retiraron del directorio público
del proyecto únicamente después de copiar y verificar sus respaldos. El MOV es la fuente
de la copia web; no necesita publicarse. Esto no elimina versiones del historial de Git.

Los cambios de catálogo, Nosotros y Cotizar se limitan al identificador de caché de `main.js`.
Se verificó que el formulario completo, su destino y sus campos son idénticos a la base.
`css/style.css`, `js/validacion.js`, `.htaccess` y `gracias.html` conservan sus SHA-256 iniciales.

## Imágenes: medidas y calidad

Los cuatro archivos de Servicios eran PNG, aunque su nombre terminaba en `.webp`.
Ahora contienen WebP real, codificado con calidad 92 y método 6. Se conserva el perfil ICC
cuando la fuente lo incluye. Las variantes pequeñas mantienen la proporción del original.
La resolución completa sigue disponible en `srcset` para pantallas de mayor densidad.

Unidades decimales: 1 KB = 1000 bytes; 1 MB = 1000000 bytes.

| Recurso anterior | Antes | Recurso principal nuevo | Ahora | Reducción |
| --- | ---: | --- | ---: | ---: |
| `servicios-encolado-800.webp` (PNG) | 2.506 MB | Mismo nombre, WebP 800 × 600 | 124.904 KB | 95.0 % |
| `servicios-doblado-800.webp` (PNG) | 2.448 MB | Mismo nombre, WebP 800 × 533 | 119.776 KB | 95.1 % |
| `servicios-compaginado-800.webp` (PNG) | 2.394 MB | Mismo nombre, WebP 800 × 533 | 101.260 KB | 95.8 % |
| `servicios-barnizado-800.webp` (PNG) | 2.420 MB | Mismo nombre, WebP 800 × 600 | 140.152 KB | 94.2 % |
| `video/Fondo.PNG` | 2.193 MB | `video/hero-poster-20261119.webp`, 1672 × 941 | 314.044 KB | 85.7 % |
| `video/hero-inicio.mp4` | 3.442 MB | Mismo nombre, MP4 optimizado | 2.728 MB | 20.7 % |

Las URLs de los recursos reemplazados incluyen `?v=20261119-1`; las nuevas variantes
incluyen la fecha en el nombre. Así se evita reutilizar los archivos anteriores con caché larga.

Variantes responsive nuevas, además de las cuatro versiones de 800 px:

| Servicio | Variante de 480 px | Variante a resolución original |
| --- | ---: | ---: |
| Encolado | 52.072 KB | 1448 px: 325.800 KB |
| Doblado | 50.754 KB | 1536 px: 333.632 KB |
| Compaginado | 43.252 KB | 1536 px: 288.758 KB |
| Barnizado | 61.038 KB | 1448 px: 325.810 KB |

`sizes` refleja la cuadrícula existente; el navegador selecciona una variante por imagen,
no necesita descargar las tres. No se añadieron variantes del poster: su uso como fondo
con `object-fit: cover` requiere considerar la altura del hero, no solo el ancho del móvil.
Se conserva su resolución completa y se reduce el peso mediante codificación WebP.

Las conversiones son con pérdida. Se revisaron comparaciones a tamaños de presentación;
no sustituyen los originales de imprenta. PSNR RGB de las versiones principales: 35.70–39.67 dB;
poster: 38.34 dB. Estas medidas complementan la revisión visual, no certifican por sí solas la calidad.

## Video y comportamiento

Se recodificó desde el MOV original, conservando H.264, 1920 × 1080, 30 fps, duración
aproximada de 6.87 s, ausencia de sonido y reproducción única. Parámetros principales:

```text
-map 0:v:0 -vf scale=1920:-2,fps=30 -c:v libx264 -preset slow -crf 24
-pix_fmt yuv420p -an -map_metadata -1 -movflags +faststart
```

SSIM respecto al MOV original, con la misma escala y cadencia: copia anterior 0.982623;
copia nueva 0.981263. Se revisaron pares de fotogramas de los segundos 1, 3 y 6 y se
decodificó el MP4 completo sin errores.

El video espera a que termine la carga de la imagen prioritaria y a conocer la visibilidad
del hero. No se asigna su fuente mientras la imagen carga, el documento está oculto o se
prefiere movimiento reducido. Se mantienen pausa manual, reanudación, final estático y
respaldo ante errores o reproducción bloqueada. No se cambió CSS ni la composición del hero.

## SEO y HTTPS

Se preparó `https://www.multigraficaburgos.pe/` como dominio principal:

- Los canonical y `og:url` ya usaban ese dominio y se comprueban automáticamente.
- Sitemap con las cinco páginas públicas: Inicio, Nosotros, Productos, Servicios y Cotizar.
- `robots.txt` apunta al sitemap con `www`.
- `gracias.html` conserva `noindex` y no se incluye en el sitemap.
- La descripción de Servicios se ajustó al contenido actual, sin cambiar texto visible.

**No se activó ninguna redirección.** En la inspección del 19 de noviembre, las cuatro
combinaciones HTTP/HTTPS y www/sin www respondieron 200 sin redirigir. Eso describe la
respuesta externa, pero no permite inspeccionar reglas internas de cPanel, proxy o CDN.
`.htaccess` sigue idéntico al de la base.

Antes de activar HTTPS/canonical en el hosting:

1. Respaldar la configuración real del servidor, incluida `.htaccess`.
2. Confirmar SSL válido y DNS de ambos nombres.
3. Revisar cPanel → Dominios → Force HTTPS Redirect y la sección de redirecciones.
4. Confirmar con el proveedor si existe proxy/CDN y dónde termina TLS.
5. Elegir un solo mecanismo coherente; evitar reglas contradictorias entre capas.
6. Probar las cuatro combinaciones, rutas internas y parámetros: deben llegar a la URL
   canónica sin bucles y preservando ruta y consulta. Comprobar también el retorno del formulario.

Referencia: https://docs.cpanel.net/cpanel/domains/domains/

## Formulario: revisión sin activación de cambios

Se conservaron endpoint, POST, `_captcha=false`, `_next`, validación, mensajes y campos.
No se enviaron solicitudes de prueba ni se accedió a correos.

FormSubmit documenta reCAPTCHA, `_honey` y `_blacklist`. No se activó ninguna opción.
La siguiente prueba requiere autorización adicional y coordinación con quien recibe el correo:

1. Confirmar activación del endpoint y buzón receptor.
2. Enviar una solicitud claramente identificada como prueba, con datos acordados.
3. Comprobar recepción, contenido, retorno, duplicados y carpeta de spam.
4. Evaluar reCAPTCHA u otra medida y repetir la prueba antes de modificar producción.

Referencia: https://formsubmit.co/documentation

## Comprobaciones y límites

Comandos opcionales de desarrollo; no forman parte del despliegue:

```text
node scripts/check.mjs
node scripts/check-hero.mjs
git diff --check
```

La comprobación general ahora lee firmas y dimensiones de PNG/WebP, valida descriptores
`srcset` con URLs versionadas, rutas, anclas, 16 productos, 48 imágenes de galería,
34 logos, contrato del formulario, canonical y sitemap.
La prueba del hero ejecuta su inicializador real en un entorno simulado y cubre diez
escenarios de carga, visibilidad, pausa, finalización, errores y movimiento reducido.

Pendiente en un navegador real: reproducción y políticas de Safari/iOS/Chrome,
elección real de `srcset` según densidad y viewport, carga con caché y red limitada,
comparación del layout, teclado y medición de LCP/INP/CLS.
Los resultados de estado y las comparaciones de imágenes no se presentan como una
certificación de accesibilidad ni como mediciones de Core Web Vitals.

## Publicación y reversión

El ZIP mantiene `index.html` en la raíz y contiene solo páginas y recursos utilizados,
favicon, sitemap y robots. Excluye `.htaccess` deliberadamente para conservar la configuración
actual del hosting hasta revisarla en cPanel. Al extraer, conservar `.htaccess` y `.well-known`
del servidor. No debe incluir `.git`, `.local`, `docs`, `scripts`,
el respaldo externo, el MOV original ni archivos `.rar`. No hay compilación obligatoria.
El paquete de esta fase es para revisión local; no se ha cargado a cPanel.

Para revertir localmente:

1. Conservar aparte cualquier trabajo posterior que se quiera mantener.
2. Copiar los archivos enumerados en `baseline.json` desde el respaldo externo a las mismas
   rutas relativas del proyecto, reemplazando únicamente los archivos de esta fase.
   Esto recupera también `Fondo.PNG`, `Fondo.MOV` y el MP4 anterior.
3. Retirar solamente los derivados y archivos nuevos enumerados en
   `phase1-created-files.json`, junto a `baseline.json`. No borrar carpetas completas.
4. Ejecutar `node scripts/check.mjs` de la versión restaurada. La prueba de hero de esta
   fase no es aplicable al código anterior.

El respaldo incluye hashes para verificar la recuperación. No se ha reescrito historial
de Git ni se ha creado un commit o un push de esta fase.
