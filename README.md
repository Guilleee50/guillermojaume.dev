# guillermojaume.dev

```
 ██████╗ ██╗   ██╗██╗██╗     ██╗     ███████╗██████╗ ███╗   ███╗ ██████╗
██╔════╝ ██║   ██║██║██║     ██║     ██╔════╝██╔══██╗████╗ ████║██╔═══██╗
██║  ███╗██║   ██║██║██║     ██║     █████╗  ██████╔╝██╔████╔██║██║   ██║
██║   ██║██║   ██║██║██║     ██║     ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║
╚██████╔╝╚██████╔╝██║███████╗███████╗███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝
 ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝
```

> Portfolio personal — Técnico en Ciberseguridad & Desarrollador de Software.
> **Live:** [guillermojaume.dev](https://guillermojaume.dev/)

---

```
$ cat about.txt
```

Sitio web personal construido con Astro, desplegado desde un homelab propio
y expuesto a internet mediante Cloudflare Tunnel. Sin servidores en la nube,
sin puertos abiertos en el router, sin IP pública expuesta.

---

```
$ tree --stack
```

## Stack & Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  Framework      Astro 5            (SSG · zero-JS por def.)  │
│  Lenguaje       TypeScript                                   │
│  Estilos        CSS plano                                    │
│  i18n           ES / EN (rutas estáticas)                    │
│  Hosting        Homelab (self-hosted)                        │
│  Exposición     Cloudflare Tunnel                            │
│  TLS            Cloudflare (edge)                            │
│  CI/CD          Git push → build local → deploy              │
└─────────────────────────────────────────────────────────────┘
```

**Flujo de petición:**

```
   Usuario  ──HTTPS──►  Cloudflare Edge  ──Tunnel──►  Homelab  ──►  Astro build (static)
                              │
                              └─ TLS, DDoS, cache, WAF
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

### Por qué bilingüe ES/EN

Rutas estáticas separadas (`/` y `/en`) en lugar de detección por header o JS. Más simple, más cacheable, y SEO-friendly en ambos idiomas.

---

```
$ ls -la
```

## Estructura del proyecto

```
guillermojaume.dev/
├── public/              # Assets estáticos (CV, favicon, og-image)
│   └── cv.pdf
├── src/
│   ├── components/      # Componentes .astro reutilizables
│   ├── layouts/         # Layouts base
│   ├── pages/           # Rutas
│   │   ├── index.astro  # ES (raíz)
│   │   └── en/          # EN
│   └── styles/          # CSS global
├── astro.config.mjs
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

**Requisitos:** Node.js ≥ 18.

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
