---
title: "Mi web, de vuelta en casa (y con blog)"
description: "Cómo traje esta web al nuevo servidor con Docker y Cloudflare Tunnel, los tropiezos por el camino y cómo construí el blog que estás leyendo."
date: 2026-11-27T12:00:00Z
image: ../../assets/blog/mi-web-de-vuelta-en-casa.png
imageAlt: "Terminal del servidor mostrando el contenedor de la web arrancado, el túnel con 4 conexiones, la web respondiendo y la rama del blog subida a GitHub"
tags: [homelab, docker, cloudflare, astro]
lang: es
draft: false
---

En el [post anterior](/blog/asegurando-mi-homelab) conté cómo dejé asegurado mi nuevo servidor antes de subir nada. Este es el siguiente paso: traer de vuelta esta web, que antes vivía en un servidor con Proxmox que ya no existe, y aprovechar para añadirle el blog en el que estás leyendo esto.

Igual que la otra vez, lo hice con Claude Code como copiloto y la misma regla: primero explicar, luego cambiar, y un commit por cada cosa que funciona.

## La web en un contenedor

La web es un proyecto de [Astro](https://astro.build) con Tailwind que genera HTML estático. No necesita un servidor de Node en producción: basta con compilarla y servir la carpeta `dist/` con nginx. Eso encaja perfecto con un Dockerfile en dos etapas:

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.30-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=nginxconf nginx.conf /etc/nginx/conf.d/default.conf
```

Node solo existe durante el build: la imagen final es nginx con unos pocos archivos estáticos.

Un par de decisiones de las que estoy contento:

- **El Dockerfile no vive en el repo de la web, sino en el del homelab.** El código de la web no sabe nada de cómo se despliega, y la infraestructura no se mezcla con el contenido. El `nginx.conf` entra en el build con `additional_contexts` de Compose, y un `Dockerfile.dockerignore` junto al Dockerfile evita copiar `node_modules`, `dist` o `.git`.
- **`ASTRO_TELEMETRY_DISABLED=1`.** Astro envía telemetría anónima por defecto. En un build de servidor no aporta nada, así que fuera.

### nginx, pero sin privilegios

Uso `nginx-unprivileged`, una variante de la imagen oficial que corre como usuario `nginx` y escucha en el 8080, así que no necesita root ni ninguna capability. Eso permite apretar bastante el contenedor:

```yaml
services:
  portfolio:
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true
    networks: [tunnel]
```

El sistema de archivos es de solo lectura, salvo dos `tmpfs` donde nginx necesita escribir. Y no hay ningún `ports:`: nadie llega a la web salvo a través del túnel.

En el `nginx.conf` añadí las cabeceras de seguridad básicas (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) y caché de un año para `/_astro/`, donde Astro deja los recursos con un hash en el nombre.

## Un único cloudflared para todo

En vez de meter `cloudflared` en el compose de la web, le di su propio directorio y una red de Docker compartida llamada `tunnel`. Cualquier servicio que quiera publicarse solo tiene que unirse a esa red; en Cloudflare se apunta a él por su nombre de contenedor (`http://portfolio:8080`).

La red la creo una vez a mano (`docker network create tunnel`) y los dos compose la declaran como `external`. Si la crea uno de ellos, el otro no puede arrancar sin él, y Compose protesta cuando se encuentra una red con su nombre que no ha creado él.

## El túnel que no se podía migrar

Mi plan era reutilizar el túnel de Cloudflare que ya tenía: el DNS ya apuntaba a él y solo habría que cambiar el destino. Al abrirlo en el panel me encontré esto:

> This tunnel is locally managed. Routes are configured via the local configuration file and cannot be modified from the dashboard.

En su día lo había creado como túnel **local**: las rutas vivían en un `config.yml` dentro del servidor de Proxmox, junto con las credenciales del túnel. Ese servidor ya no existía, así que tampoco el archivo ni las credenciales.

Así que creé un túnel nuevo, esta vez **gestionado desde el panel**. Es mucho más cómodo: las rutas se editan en Cloudflare y `cloudflared` solo necesita un token. Los pasos fueron:

1. Crear el túnel y copiar su token.
2. Borrar los registros DNS antiguos que apuntaban al túnel viejo (`<id>.cfargotunnel.com`). Si no, Cloudflare no deja crear la ruta nueva.
3. Añadir la ruta: `guillermojaume.dev` → `http://portfolio:8080`.
4. Borrar el túnel antiguo cuando todo funcionaba.

Dos detalles de la ruta en los que es fácil equivocarse. El servicio es **`http://`**, no `https://`: dentro de Docker nginx sirve en claro, y el HTTPS lo pone Cloudflare de cara al visitante. Y no vale `localhost`: dentro del contenedor de `cloudflared`, `localhost` es el propio `cloudflared`.

### El token que no era un token

El token va en un `.env` con permisos `600` que no se sube a git y que Claude no tenía permitido leer. Aun así, antes de arrancar el conector comprobamos el tamaño del archivo: **50 bytes**.

`TUNNEL_TOKEN=` son 13 caracteres; quedaban 36 más el salto de línea. 36 caracteres es exactamente un UUID, el **ID del túnel**, que aparece en la lista de túneles. Un token real es una cadena de unos 180 caracteres que empieza por `eyJ`. Había copiado lo que no era.

Me gustó la idea: verificar un secreto sin mirarlo, solo por su forma. Con el token bueno (198 bytes), el conector registró cuatro conexiones con Cloudflare (Marsella y Barcelona) y recibió la ruta al momento.

## HTTPS y www

Con la web ya en marcha faltaban dos detalles:

- `http://guillermojaume.dev` respondía 200 sin cifrar. Se arregla con **Always Use HTTPS** en *SSL/TLS → Edge Certificates*: ahora redirige con un 301.
- `www` no existía. Bastó con una segunda ruta en el túnel con el mismo destino.

Lo curioso fue que, después de crear `www`, unas peticiones funcionaban y otras daban `Could not resolve host`. Pregunté a los servidores DNS de Cloudflare directamente (`dig @tina.ns.cloudflare.com`) y respondían bien siempre. El problema era uno de los dos DNS de mi proveedor: había guardado en caché que `www` *no existía* porque lo consulté antes de crearlo. Es una caché negativa, y caduca sola. El servidor iba alternando entre los dos DNS, y de ahí el "a veces sí, a veces no".

## El blog

Con la web ya funcionando, le añadí el blog.

### Posts en Markdown con esquema

Astro tiene *content collections*: cada post es un archivo Markdown y el frontmatter se valida con un esquema. Si falta un campo, el build falla en lugar de publicar algo roto:

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image(),
      imageAlt: z.string(),
      tags: z.array(z.string()).default([]),
      lang: z.enum(['es', 'en']).default('es'),
      draft: z.boolean().default(false),
    }),
});
```

Hice obligatorias la portada **y** su texto alternativo, para que ningún post salga sin imagen ni sin accesibilidad. `image()` hace que Astro optimice la portada: la de este post pasa de 100 kB en PNG a entre 12 y 26 kB en WebP, según el tamaño de pantalla.

### Índice y filtro

- **Índice lateral.** Se genera solo a partir de los `##` y `###` de cada post. Un `IntersectionObserver` va marcando en cyan la sección que estás leyendo. En móvil se convierte en un desplegable al principio del post.
- **Filtro por tema.** En `/blog`, el botón del embudo abre las etiquetas de todos los posts. El filtro se aplica en el navegador, sin recargar, y queda guardado en la URL (`/blog?tag=docker`), así que se puede compartir ya filtrado.

También añadí etiquetas Open Graph, para que al compartir un post en LinkedIn o WhatsApp salga con su portada, título y descripción.

### Portadas generadas desde SVG

Las portadas las diseño en SVG con el mismo estilo que la web y las convierto a PNG con [sharp](https://sharp.pixelplumbing.com/), que ya viene con Astro. Las fuentes (Inter y JetBrains Mono) se instalan en un contenedor Alpine solo para renderizar.

Un detalle que me costó una iteración: en SVG, **un espacio al principio de un `<tspan>` se descarta**. Mi `$ sudo ufw status` salía como `$sudo ufw status`. Se soluciona separando con `dx` en lugar de con un espacio.

### Probar sin publicar

Antes de tocar la web real, levanté una vista previa en el servidor, **solo en `127.0.0.1`**, y la abrí desde mi PC con un túnel SSH:

```bash
ssh -L 4321:localhost:4321 usuario@servidor
```

Fue útil enseguida: encontré un fallo que en producción habría sido feo. Al pedir `/blog`, sin barra final, nginx redirigía a `/blog/`, pero construía la URL con **su** puerto, el 8080. Detrás de Cloudflare eso habría mandado a los visitantes a `guillermojaume.dev:8080`, que no existe. Lo arreglan dos líneas:

```nginx
absolute_redirect off;
try_files $uri $uri/index.html $uri.html =404;
```

La primera hace que las redirecciones sean relativas. La segunda sirve `/blog/index.html` directamente, sin redirigir.

## Del servidor a GitHub: una deploy key

El servidor podía *leer* el repo de la web, que es público, pero no subir cambios. Darle mi clave personal de GitHub habría sido darle acceso a **todos** mis repos. La solución es una **deploy key**: una clave SSH que GitHub asocia a un único repositorio.

```
# ~/.ssh/config
Host github-portfolio
    HostName github.com
    User git
    IdentityFile ~/.ssh/deploy_guillermojaume_dev
    IdentitiesOnly yes
```

El remoto del repo apunta a `git@github-portfolio:...`, e `IdentitiesOnly` hace que solo se use esa clave. Si algún día alguien la robara, solo podría tocar este repositorio, y se revoca en dos clics.

Antes de usarla comprobé que la huella de GitHub que había guardado el servidor era la oficial. Debian guarda `known_hosts` con los nombres cifrados, así que `grep github` no encuentra nada; hay que usar `ssh-keygen -F github.com -l`.

El flujo para publicar queda así:

1. Los cambios se hacen en una rama en el servidor y se suben con la deploy key.
2. Yo reviso y fusiono la *pull request* en GitHub.
3. En el servidor: `git pull` y `docker compose up -d --build`. La imagen se construye antes de recrear el contenedor, así que el corte es de un par de segundos.

Este post, de hecho, ha llegado aquí exactamente así.

## Cómo queda

```
Visitante ──HTTPS──► Cloudflare ──túnel (saliente)──► cloudflared ──red "tunnel"──► nginx (portfolio)
```

- Ningún puerto abierto en el router ni en el servidor para la web.
- Una web estática en un contenedor de solo lectura, sin root y sin capabilities.
- Un túnel gestionado desde el panel, fácil de ampliar con más servicios.
- Un blog en Markdown, con portada, índice y filtros, que se despliega con una PR.

Y todo versionado: la infraestructura en el repo del homelab y la web en el suyo.
