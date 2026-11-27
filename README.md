# guillermojaume.dev

```
 ██████╗ ██╗   ██╗██╗██╗     ██╗     ███████╗██████╗ ███╗   ███╗ ██████╗
██╔════╝ ██║   ██║██║██║     ██║     ██╔════╝██╔══██╗████╗ ████║██╔═══██╗
██║  ███╗██║   ██║██║██║     ██║     █████╗  ██████╔╝██╔████╔██║██║   ██║
██║   ██║██║   ██║██║██║     ██║     ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║
╚██████╔╝╚██████╔╝██║███████╗███████╗███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝
 ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝
```

> Portfolio personal y blog — Técnico en Ciberseguridad & Desarrollador de Software.
> **Live:** [guillermojaume.dev](https://guillermojaume.dev/) · **Blog:** [guillermojaume.dev/blog](https://guillermojaume.dev/blog)

---

```
$ cat about.txt
```

Sitio web personal y blog construido con Astro, servido desde un contenedor
Docker en un homelab propio y expuesto a internet mediante Cloudflare Tunnel.
Sin servidores en la nube, sin puertos abiertos en el router, sin IP pública expuesta.

---

```
$ tree --stack
```

## Stack & Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  Framework      Astro 6            (SSG · zero-JS por def.)  │
│  Lenguaje       TypeScript                                   │
│  Estilos        Tailwind CSS 4 + typography                  │
│  Contenido      Markdown (content collections + Zod)         │
│  i18n           ES / EN (rutas estáticas)                    │
│  Hosting        Homelab · Debian 13 · Docker Compose         │
│  Servidor web   nginx-unprivileged (read-only, sin root)     │
│  Exposición     Cloudflare Tunnel (gestionado en el panel)   │
│  TLS            Cloudflare (edge)                            │
│  Despliegue     PR → merge → git pull → docker compose build │
└──────────────────────────────────────────────────────────────┘
```

**Flujo de petición:**

```
   Usuario ──HTTPS──► Cloudflare Edge ──Tunnel──► cloudflared ──red Docker──► nginx (dist/)
                             │                     (contenedor)               (contenedor)
                             └─ TLS, DDoS, cache, WAF, HTTP→HTTPS
```

---

```
$ man decisiones
```

## Decisiones de diseño

### Por qué Astro

- **Zero-JS por defecto.** El sitio es contenido estático; no necesita hidratación de React/Vue. Astro entrega solo HTML+CSS, lo que se traduce en tiempos de carga mínimos y un perfil de seguridad muy reducido (menos JS = menos superficie).
- **Islas de interactividad bajo demanda.** Si en el futuro necesito un componente interactivo concreto, puedo añadirlo sin migrar el resto del proyecto.
- **DX sin fricción.** Componentes `.astro` con sintaxis cercana a HTML, soporte nativo de TypeScript y rutas basadas en filesystem.

### Por qué self-hosted en homelab

- **Aprendizaje.** Gestionar mi propia infraestructura forma parte del perfil que quiero proyectar en ciberseguridad: networking, exposición de servicios, hardening, logs.
- **Control total.** Sin vendor lock-in, sin límites artificiales de plan gratuito, sin telemetría de terceros en el origen.
- **Coste.** El homelab ya está corriendo otros servicios; añadir este sitio tiene coste marginal cero.

### Por qué Cloudflare Tunnel (en lugar de port-forwarding)

- **No expongo mi IP pública** ni abro puertos `80/443` en el router doméstico.
- **El túnel es saliente:** el daemon `cloudflared` inicia la conexión hacia Cloudflare, eliminando la necesidad de reglas NAT entrantes.
- **TLS terminado en el edge** de Cloudflare, con certificados gestionados automáticamente.
- **Mitigación DDoS y WAF** incluidas sin configuración adicional.
- **Reducción de superficie de ataque:** ningún escaneo desde internet llega al host real.

### Por qué Docker (y nginx sin privilegios)

- **Build reproducible.** Un Dockerfile multi-stage compila la web con `node:24-alpine` y la sirve con `nginxinc/nginx-unprivileged:1.30-alpine`. Node solo existe durante el build: la imagen final es nginx con archivos estáticos.
- **Contenedor endurecido.** nginx corre como usuario sin privilegios en el `8080`, con el sistema de archivos en solo lectura, `cap_drop: ALL` y `no-new-privileges`.
- **Sin puertos publicados.** El contenedor solo está en una red interna de Docker compartida con `cloudflared`; nada en el host escucha para la web.
- **Infraestructura separada del código.** El Dockerfile, la configuración de nginx y los `compose.yml` viven en el repositorio de infraestructura del homelab, no aquí. Este repo solo contiene la web.

### Por qué un blog en Markdown

- **Cada post es un archivo `.md`** validado con un esquema (Zod): si falta la portada, su texto alternativo o la fecha, el build falla en lugar de publicar algo roto.
- **Imágenes optimizadas** por Astro (WebP en varios tamaños) y etiquetas Open Graph para que cada post se comparta con su portada.
- **Sin CMS ni base de datos:** escribir un post es abrir una PR.

### Por qué bilingüe ES/EN

Rutas estáticas separadas (`/` y `/en`) en lugar de detección por header o JS. Más simple, más cacheable, y SEO-friendly en ambos idiomas. El blog sigue el mismo esquema (`/blog` y `/en/blog`); mientras no haya posts en inglés, `/en/blog` muestra los de español con un aviso.

---

```
$ ls ~/blog
```

## Blog

- **Portada por post**, optimizada automáticamente y usada también como `og:image`.
- **Índice lateral** generado a partir de los `##` / `###`, con la sección activa resaltada (`IntersectionObserver`); en móvil, desplegable.
- **Filtro por tema** en un botón desplegable, sin recargar la página y guardado en la URL (`/blog?tag=docker`).
- **Borradores:** `draft: true` oculta el post en producción y lo muestra en `npm run dev`.

### Escribir un post

1. Portada de **1200×630** en `src/assets/blog/mi-post.png`.
2. Archivo `src/content/blog/mi-post.md` (el nombre del archivo es la URL: `/blog/mi-post`):

   ```markdown
   ---
   title: "Título del post"
   description: "Resumen de una o dos frases (lista del blog y vista previa al compartir)."
   date: 2026-12-01
   image: ../../assets/blog/mi-post.png
   imageAlt: "Descripción de la imagen"
   tags: [homelab, seguridad]
   lang: es
   draft: false
   ---

   ## Primera sección
   ```

3. Reutilizar etiquetas existentes para que el filtro sea útil. Para ordenar dos posts del mismo día, añadir hora a la fecha (`2026-12-01T12:00:00Z`).
4. Abrir una PR; al fusionarla, se despliega en el homelab.

---

```
$ ls -la
```

## Estructura del proyecto

```
guillermojaume.dev/
├── public/                    # Assets estáticos sin procesar (CV, favicon)
│   └── cv.pdf
├── src/
│   ├── assets/blog/           # Portadas de los posts (optimizadas en el build)
│   ├── components/            # Componentes .astro (Nav, BlogList, TableOfContents…)
│   ├── content/blog/          # Posts en Markdown
│   ├── content.config.ts      # Esquema de la colección del blog
│   ├── i18n/content.ts        # Textos ES / EN
│   ├── layouts/               # Layout base (meta, Open Graph, canonical)
│   ├── lib/blog.ts            # Consulta y orden de posts, formato de fechas
│   ├── pages/                 # Rutas
│   │   ├── index.astro        # ES (raíz)
│   │   ├── blog/              # /blog y /blog/<post>
│   │   └── en/                # EN (/en y /en/blog)
│   └── styles/global.css      # Tailwind + tema
├── astro.config.mjs           # site, Tailwind, tema de Shiki
├── tsconfig.json
└── package.json
```

---

```
$ make run
```

## Desarrollo local

```bash
# Clonar
git clone https://github.com/Guilleee50/guillermojaume.dev.git
cd guillermojaume.dev

# Instalar dependencias
npm install

# Servidor de desarrollo en http://localhost:4321
npm run dev

# Build de producción a ./dist
npm run build

# Preview del build
npm run preview
```

**Requisitos:** Node.js ≥ 22.12.

## Despliegue

La web se sirve desde el homelab. Al fusionar cambios en `main`:

```bash
git pull --ff-only
docker compose up -d --build   # en el directorio del servicio, en el repo de infraestructura
```

La imagen se construye antes de recrear el contenedor, así que el corte es de un par de segundos. El proceso completo está contado en el blog: [Mi web, de vuelta en casa (y con blog)](https://guillermojaume.dev/blog/mi-web-de-vuelta-en-casa).

---

```
$ cat LICENSE
```

## Licencia

El **código** de este repositorio se publica bajo licencia [MIT](./LICENSE) — siéntete libre de inspirarte o reutilizar partes.

El **contenido** (textos, CV, biografía, imágenes personales) es propiedad del autor y **no** está cubierto por la licencia MIT. Si quieres usar la estructura como base para tu propio portfolio, reemplaza todo el contenido personal por el tuyo.

---

```
$ whoami
```

**Guillermo Jaume Murciano** · Barcelona, ES
[guillermojaume.dev](https://guillermojaume.dev/) · [LinkedIn](https://linkedin.com/in/guillermo-jaume-murciano) · [GitHub](https://github.com/Guilleee50)
