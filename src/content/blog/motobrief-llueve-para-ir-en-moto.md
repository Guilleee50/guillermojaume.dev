---
title: "motobrief.es: ¿llueve para ir en moto?"
description: "Cómo rehíce motobrief.es desde cero: de un blog que nadie iba a leer a una herramienta de lluvia hora a hora para ir en moto por Barcelona, servida con nginx como caché en mi homelab."
date: 2026-11-28T18:00:00Z
image: ../../assets/blog/motobrief-llueve-para-ir-en-moto.png
imageAlt: "Terminal del servidor mostrando el contenedor de motobrief arrancado, los 15 tests pasando, /api/lluvia servida desde la caché y www redirigiendo a motobrief.es"
tags: [homelab, docker, cloudflare, astro]
lang: es
draft: false
---

Con el servidor [asegurado](/blog/asegurando-mi-homelab) y [esta web de vuelta en casa](/blog/mi-web-de-vuelta-en-casa), tocaba el siguiente dominio: **motobrief.es**. También vivía en el antiguo servidor de Proxmox, y también se había quedado sin casa.

Pensaba que sería una mudanza más. Acabó siendo una web nueva: otra idea, otro código y una forma distinta de servirla. Igual que en los posts anteriores, lo hice con Claude Code como copiloto y las mismas reglas: primero explicar, luego cambiar, y un commit por cada cosa que funciona.

## Empezar de cero

La versión anterior era un repositorio de Astro con la idea de un blog de investigación sobre la seguridad de las apps de motos. Antes de desplegarla la revisamos entera, y salieron varias cosas:

- **El borrador se publicaba.** Los listados ocultaban los posts con `draft: true`, pero las páginas de cada post no. El build generaba igualmente la URL del único artículo, que estaba a medias.
- **Dos configuraciones de contenido**: la del formato antiguo y la de Astro 6, conviviendo.
- **Las fuentes probablemente no se aplicaban.** Astro servía Inter con un nombre interno y el CSS la pisaba con `"Inter"` a secas.
- **Español e inglés duplicados a mano**: seis páginas casi idénticas, y cada cambio había que hacerlo dos veces.

Eran solo cuatro commits y un post en borrador, así que salía más barato empezar de cero que arreglarlo.

## ¿Qué web?

Aquí me paré a pensar. Mi primera idea fue un blog de motos: guías para sacarse el A2, elegir la primera moto, mantenimiento... Pero tenía una objeción que me parecía de peso: **cada vez menos gente lee blogs**. Sobre todo la gente joven: para "cuánto cuesta tener moto" le preguntan a una IA, que responde al instante y sin anuncios. No quería hacer algo que solo iba a leer yo.

Así que cambié la pregunta: **¿qué no te puede dar una IA?**

1. **Datos en tiempo real y locales**: si va a llover a las seis de la tarde en tu ciudad.
2. **Cosas que se usan, no que se leen**: una herramienta, un mapa.
3. **Personas**: quedadas, eventos.

De ahí salió la idea: **un parte para ir en moto**. Y lo ajusté a mi caso real. No tengo moto propia: me muevo por Barcelona en una Honda SH125. No hago rutas de domingo, la uso a diario. Y lo que decide si la cojo o no es, sobre todo, **la lluvia**.

Tomé tres decisiones pronto:

- **Empezar pequeño.** Solo lluvia, solo Barcelona, hoy y mañana. Sin prisa.
- **Solo castellano.** Pensé en el catalán, pero entonces tocaría gallego, euskera... Para una web de toda España, el castellano basta.
- **Sin cuentas, sin cookies, sin analítica.**

## Qué hace

Una sola pantalla pensada para el móvil:

- **El veredicto de ahora**, en grande: *Seco*, *Puede llover* o *Lluvia*.
- **Hoy y mañana por horas**, con frases claras: "Lluvia de 18 a 21 h".
- **Aviso de suelo mojado**: si ha llovido en las últimas horas, avisa de que la pintura, los pasos de cebra y las tapas metálicas resbalan, aunque ya no llueva. Es lo que una app del tiempo normal no te dice y lo que más importa en moto.

Las reglas son sencillas y están todas en un sitio:

```ts
export const THRESHOLDS = {
  rainMm: 0.2,      // desde estos mm en una hora, es lluvia
  rainProb: 60,     // desde esta probabilidad (%), es lluvia
  maybeProb: 30,    // desde esta, "puede llover"
  wetRoadHours: 3,  // si ha llovido en estas horas, el suelo sigue mojado
};
```

Son valores iniciales. La idea es ajustarlos con lo que vea en la calle.

## Pensada para crecer

Aunque empiece pequeña, quería que añadir cosas no obligara a rehacerla. Así que separé el código en cuatro piezas que no se conocen entre sí más de lo necesario:

```
Fuente (Open-Meteo)  →  Formato propio  →  Reglas  →  Pantalla
```

- Cada **fuente** de datos tiene un adaptador que la traduce a un formato propio (por hora: lluvia y probabilidad). Si mañana uso AEMET o Meteocat, solo cambia el adaptador.
- Las **reglas** y la **pantalla** solo conocen ese formato.
- Las **zonas** son una lista: añadir el Garraf o el Montseny es añadir una línea con sus coordenadas.

Las reglas, el adaptador y la selección de horas tienen tests con `node --test`, el runner que trae Node, sin dependencias extra. Node 24 ejecuta TypeScript directamente.

## Tres PR, tres pasos

Lo construí en tres pasos, cada uno en su rama y con su *pull request*:

1. **Esqueleto con datos de ejemplo.** Un JSON inventado con un día que tiene de todo (lluvia de madrugada, suelo mojado, chubascos por la tarde) para ver el diseño sin depender de la API.
2. **Datos reales.** La web pide la previsión a `/api/lluvia` y usa la hora real de Barcelona. Si dejas la página abierta, vuelve a pedir datos cada 15 minutos y se repinta al cambiar de hora.
3. **Despliegue.** Docker, nginx y Cloudflare.

En cada paso hice capturas con un Chromium sin interfaz dentro de un contenedor, en tamaño móvil y en modo claro y oscuro, antes de enseñar nada.

## nginx como caché, sin backend

La previsión viene de [Open-Meteo](https://open-meteo.com/), que es gratis para webs sin publicidad ni suscripciones y no necesita clave. Lo fácil habría sido que el navegador de cada visitante llamara directamente a su API. No me gustaba por dos motivos: la IP de cada visitante acabaría en un tercero, y cada visita contaría como una llamada.

La otra opción era escribir un backend. Pero para una sola consulta fija, nginx ya sabe hacerlo todo:

```nginx
location = /api/lluvia {
    limit_except GET { deny all; }

    set $openmeteo api.open-meteo.com;
    proxy_pass https://$openmeteo/v1/forecast?latitude=41.39&longitude=2.17&hourly=...;

    # A Open-Meteo no le llega nada del visitante
    proxy_pass_request_headers off;
    proxy_set_header Host api.open-meteo.com;

    proxy_cache forecast;
    proxy_cache_key "barcelona";
    proxy_cache_valid 200 15m;
    proxy_cache_use_stale error timeout updating http_429 http_500 http_502 http_503 http_504;
    proxy_cache_lock on;
}
```

Lo que consigue:

- **Una llamada a Open-Meteo cada 15 minutos como mucho**, venga quien venga. El límite gratuito es de 10.000 al día; yo hago menos de 100.
- **No es un proxy abierto.** La consulta está escrita en la configuración, y los parámetros que mande el visitante se ignoran. Lo probé pidiendo otras coordenadas: siempre devuelve Barcelona.
- **Privacidad.** Con `proxy_pass_request_headers off`, Open-Meteo no ve ni la IP del visitante ni su navegador. Ni siquiera las cabeceras que añade Cloudflare.
- **Si Open-Meteo falla**, se sirve la última respuesta buena.
- **El nombre de Open-Meteo va en una variable** a propósito. Así nginx lo resuelve en cada petición (con el DNS interno de Docker, `127.0.0.11`) y no al arrancar. Si el servidor se reinicia a las 4 de la mañana sin red, la web arranca igual.

La primera petición tarda unos 150 ms; la siguiente sale de la caché en 1 ms.

### La configuración vive con el código

En el portfolio, el `Dockerfile` y el `nginx.conf` están en el repo del homelab, separados de la web. Aquí hice lo contrario a propósito: **la consulta de nginx tiene que ser exactamente la misma que define el código**. Si algún día añado el viento y cambio una pero no la otra, la web se rompería en silencio.

Con los dos en el mismo repo, un test lo comprueba:

```ts
test('nginx: /api/lluvia hace la misma consulta a Open-Meteo que el código', () => {
  assert.ok(nginx.includes(`proxy_pass https://$openmeteo${openMeteoPath(DEFAULT_ZONE)};`));
});
```

Y el `Dockerfile` ejecuta los tests antes del build (`RUN npm test && npm run build`). Si alguno falla, no hay imagen nueva y la web que está en marcha sigue igual.

### Una CSP estricta

Astro genera los scripts y el CSS como archivos aparte, sin nada incrustado en el HTML. Eso permitió una política de seguridad de contenido que solo deja cargar recursos del propio dominio:

```
default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; ...
```

Para que siga siendo así cuando crezca el CSS, puse `inlineStylesheets: 'never'` en la configuración de Astro: por defecto, Astro incrusta las hojas de estilo pequeñas, y eso rompería la CSP.

## Publicarla

La parte de Cloudflare fue igual que con el portfolio. Borré los registros DNS que quedaban del túnel de Proxmox y añadí dos rutas al túnel actual: `motobrief.es` y `www.motobrief.es` → `http://motobrief:8080`. El contenedor se une a la red `tunnel` y no publica ningún puerto.

Para `www` había dos opciones: una regla de redirección en Cloudflare o un bloque en nginx. Elegí nginx para que quedara versionado con todo lo demás:

```nginx
server {
    listen 8080;
    server_name www.motobrief.es;
    return 301 https://motobrief.es$request_uri;
}
```

Funciona porque `cloudflared` le pasa a nginx el dominio original que pidió el visitante.

## Lo que aprendí por el camino

- **Astro 6 y Vite 8 no se llevan.** Con las versiones del momento, npm instalaba Vite 8 para el plugin de Tailwind mientras Astro 6 usa Vite 7, y el build fallaba con un error críptico (`Missing field tsconfigPaths`). `npm ls vite` lo dejó claro. Lo arregla fijar `vite@^7` en `devDependencies`.
- **"Mañana" eran 36 horas.** Pedía tres días a Open-Meteo para que la caché nunca dejara "mañana" incompleto, y el filtro de "mañana" se quedaba con todo lo que no era hoy, incluido pasado mañana. Lo vi en la primera captura con datos reales. Ahora esa selección está en una función sin DOM, con tests.
- **Node no adivina extensiones.** Vite resuelve `import { spells } from './rules'`, pero Node, ejecutando los tests directamente, no. Todos los imports de `src/lib` llevan `.ts`.
- **nginx solo verifica un nivel de certificados.** Con `proxy_ssl_verify on`, la conexión a Open-Meteo fallaba con `unable to get local issuer certificate`. La causa es que `proxy_ssl_verify_depth` vale 1 por defecto, y la cadena es certificado → intermedio → raíz. La solución es subirlo a 3, no desactivar la verificación.
- **`add_header` no se hereda si añades otro.** En nginx, una `location` con su propio `add_header` pierde todas las cabeceras del `server`, incluidas las de seguridad. Las versiones recientes de nginx (yo uso la 1.30) tienen `add_header_inherit merge;`, que las combina en lugar de sustituirlas.
- **`astro preview` también usa el proxy de desarrollo.** Quise probar el mensaje de error con `astro preview`, suponiendo que ahí no habría `/api/lluvia`, pero Vite hereda el proxy en la vista previa. Para probar el error, lo más fiable fue un contenedor con `--network none`.
- **Los contenedores como root dejan archivos de root.** El servidor de desarrollo de las capturas corría como root y dejó la caché de Vite a su nombre. El siguiente build, con mi usuario, no podía borrarla.
- **"Always Use HTTPS" va por dominio.** En el portfolio lo tenía activado. En `motobrief.es`, `http://` respondía 200 sin cifrar hasta que lo activé también ahí.
- **Las reglas funcionan.** En el `CLAUDE.md` está escrito que no se hace push a `main`. Al crear el repo vacío hacía falta un primer commit en `main` para poder abrir PR, y aunque se lo autoricé en el chat, Claude Code lo bloqueó igualmente. Lo hice yo con un `!` en el prompt. Prefiero eso a una regla que se salta cuando conviene.

## Cómo queda

```
Visitante ──HTTPS──► Cloudflare ──túnel──► cloudflared ──red "tunnel"──► nginx (motobrief)
                                                                            │
                                                            caché 15 min ───┴──► Open-Meteo
```

- [motobrief.es](https://motobrief.es): lluvia hora a hora en Barcelona y aviso de suelo mojado.
- Un contenedor nginx de solo lectura, sin root ni capabilities, que sirve la web y hace de caché de la previsión.
- Una sola salida a Internet: Open-Meteo, por HTTPS verificado, cuatro veces por hora como mucho.
- 15 tests que se ejecutan en cada build.
- Ningún puerto abierto, y otra vez todo versionado.

Lo siguiente es usarla de verdad con la moto unos días y ver si los avisos encajan con lo que pasa en la calle. Después, quizás el viento, que en una 125 se nota. Pero sin prisa.
