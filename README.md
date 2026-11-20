<div align="center">

# Multigráfica Burgos

### Diseño editorial. Desarrollo frontend. Atención al detalle.

Sitio corporativo para una imprenta de Trujillo, Perú.<br>
Una experiencia digital que conecta productos, procesos y solicitudes de cotización.

![HTML5](https://img.shields.io/badge/HTML5-09232F?style=flat-square&logo=html5&logoColor=BEEF65)
![CSS3](https://img.shields.io/badge/CSS3-09232F?style=flat-square&logo=css&logoColor=BEEF65)
![JavaScript](https://img.shields.io/badge/JavaScript-09232F?style=flat-square&logo=javascript&logoColor=BEEF65)
![Publicación estática](https://img.shields.io/badge/Deploy-ZIP_%2B_cPanel-09232F?style=flat-square)

[Sitio de la empresa](https://www.multigraficaburgos.pe/) · [Explorar Inicio](index.html) · [Decisiones técnicas](#decisiones-técnicas)

</div>

---

## El proyecto

Modernización de una web corporativa de industria gráfica con una dirección visual editorial-industrial: azul profundo, acentos verdes, fotografía de producto y una jerarquía tipográfica clara.

El trabajo combina diseño de interfaz, desarrollo responsive, optimización de recursos e interacciones accesibles. La arquitectura conserva HTML, CSS y JavaScript nativo para facilitar su mantenimiento y la publicación en un hosting tradicional.

**El objetivo:** facilitar que una persona conozca la empresa, explore lo que puede imprimir y llegue a una solicitud de cotización con contexto sobre su proyecto.

| Catálogo | Galería de detalle | Clientes | Publicación |
| :---: | :---: | :---: | :---: |
| **16 productos** | **48 imágenes** | **34 logos** | **ZIP + cPanel** |

## Experiencia e interacción

- **Inicio editorial:** hero con video optimizado, fotografías responsive y animaciones diferenciadas por sección.
- **Proceso interactivo:** Preprensa, Prensa y Postprensa con navegación por teclado, precarga cercana al viewport y transiciones que esperan a que la siguiente imagen esté preparada.
- **Catálogo con visor:** modal nativo con galería, controles de teclado, restauración del foco y enlace de cotización asociado al producto.
- **Contacto contextual:** enlaces de servicios y productos que pueden completar la consulta sin sobrescribir un mensaje ya redactado.
- **Formulario accesible:** validación por campo, mensajes asociados mediante ARIA y estado de envío. La recepción se gestiona mediante FormSubmit.
- **Contenido adaptable:** navegación móvil nativa, cuadrículas responsive y fotografías con dimensiones explícitas para reservar su espacio.

## Decisiones técnicas

| Decisión | Aplicación en el proyecto |
| --- | --- |
| **Mejora progresiva** | El catálogo conserva desplegables nativos y el menú móvil utiliza `details/summary`. El contenido principal sigue disponible sin JavaScript. |
| **Datos sin duplicación** | El visor obtiene nombres, especificaciones e imágenes desde las tarjetas HTML del catálogo. |
| **Animación nativa** | IntersectionObserver y Web Animations API coordinan revelaciones de una sola ejecución, sin bibliotecas adicionales de animación. |
| **Movimiento reducido** | Las animaciones respetan `prefers-reduced-motion`; el hero utiliza una imagen estática cuando corresponde. |
| **Carga de medios controlada** | Imágenes WebP con `srcset`, carga diferida fuera del hero y video que espera al poster prioritario y a la visibilidad de la sección. |
| **Interacciones resistentes** | Las selecciones rápidas del proceso descartan resultados atrasados; una imagen fallida conserva la fotografía anterior. |
| **Separación de responsabilidades** | Estilos y comportamiento de Inicio aislados de los componentes compartidos y de la validación del formulario. |
| **Despliegue sencillo** | Archivos estáticos, sin servidor de aplicación ni compilación obligatoria en producción. |

Estas decisiones permiten revisar competencias de **HTML semántico, CSS responsive, JavaScript asíncrono, accesibilidad, optimización multimedia y mantenimiento de una interfaz existente** directamente en el código.

## Calidad y verificación

El proyecto incluye comprobaciones locales sin dependencias de paquetes:

| Comprobación | Alcance |
| --- | --- |
| `check.mjs` | Sintaxis JavaScript, rutas, anclas, recursos referenciados, formatos y dimensiones de imágenes, `srcset`, catálogo, logos, metadatos y estructura del formulario. |
| `check-hero.mjs` | Diez escenarios del controlador del hero: poster, visibilidad, pausa manual, finalización, errores y movimiento reducido. |
| `check-inicio.mjs` | Teclado, selecciones rápidas, decodificación lenta o fallida, precarga y revelaciones sin objetivos duplicados. |

Las pruebas de estado ejecutan los controladores reales en un entorno simulado. **No sustituyen la revisión visual en navegador, la medición de Core Web Vitals ni una prueba autorizada de recepción del formulario.**

## Ejecutar en local

Se necesitan **Git, Git LFS y Node.js** para clonar con los medios y utilizar las herramientas locales. No hay paquetes npm que instalar.

```bash
git clone --branch redisenio-inicio-fase2 https://github.com/BurBear/WEB-Multigrafica-Burgos-E.I.R.L..git multigrafica-burgos
cd multigrafica-burgos
git lfs pull
node scripts/serve.mjs
```

Abrir **http://127.0.0.1:8000**. Para detener la vista previa, usar `Ctrl+C`.

```bash
node scripts/check.mjs
node scripts/check-hero.mjs
node scripts/check-inicio.mjs
```

> El servidor local solo escucha en la máquina y no interpreta `.htaccess`. Las reglas de Apache deben comprobarse en un entorno compatible.

## Organización del código

```text
├── index.html              # Inicio y proceso interactivo
├── nosotros.html           # Empresa, atención y clientes
├── productos.html          # Catálogo y visor de productos
├── servicios.html          # Servicios y accesos a cotización
├── cotizacion.html         # Ubicación y formulario
├── gracias.html            # Retorno configurado para FormSubmit
├── css/
│   ├── style.css           # Sistema visual compartido
│   └── inicio.css          # Composición y efectos de Inicio
├── js/
│   ├── main.js             # Navegación, catálogo, clientes y hero
│   ├── inicio.js           # Interacciones y animaciones de Inicio
│   └── validacion.js       # Validación y estado del formulario
├── img/                    # Fotografías, variantes WebP y logos
├── video/                  # Video optimizado y poster del hero
├── scripts/                # Vista previa y comprobaciones
├── docs/                   # Informe de optimización técnica
├── .htaccess               # Compresión, caché y cabeceras
├── robots.txt
└── sitemap.xml
```

<details>
<summary><strong>Notas de mantenimiento y publicación</strong></summary>

- Los identificadores `data-product-index` son únicos. El modal lee la información de cada `.product-card`; los enlaces de `.product-image-links` definen su galería.
- Los cambios de navegación deben reflejarse tanto en el menú de escritorio como en el móvil. `aria-current="page"` identifica la página activa.
- Al sustituir CSS o JavaScript, actualizar su versión en las páginas que lo cargan. Las imágenes nuevas deben mantener variantes, referencias y dimensiones coherentes.
- Para publicar, incluir únicamente páginas, CSS, JavaScript, medios, favicon, `robots.txt`, `sitemap.xml` y la configuración del servidor revisada. Excluir `.git`, herramientas locales, documentación y respaldos.
- El código fuente de esta rama conserva enlaces `.html`. Las URL sin extensión requieren adaptar enlaces, metadatos y sitemap, además de configurar las reglas correspondientes en Apache. El paquete de cPanel se preparó por separado.
- Revisar el `.htaccess` existente del hosting antes de integrar reglas; conservar su configuración de HTTPS y dominio para evitar conflictos.
- El formulario realiza un POST a FormSubmit. La validación local no confirma la recepción del correo ni simula una respuesta satisfactoria.
- Los originales de medios y los archivos retirados se conservan en respaldos externos al proyecto.

Consultar el [informe de optimización técnica](docs/FASE-1-OPTIMIZACION.md) para medidas, límites de verificación y recuperación de la Fase 1.

</details>

---

<div align="center">

**Una interfaz corporativa cuidada, con decisiones técnicas visibles en el código.**

[Ver repositorio](https://github.com/BurBear/WEB-Multigrafica-Burgos-E.I.R.L.) · [Perfil de GitHub](https://github.com/BurBear)

</div>
