---
title: "Asegurando mi homelab antes de publicar nada"
date: 2026-11-27
image: ../../assets/blog/asegurando-mi-homelab.png
imageAlt: "Terminal del servidor mostrando ufw activo, root sin acceso por SSH, el puerto 8080 solo en localhost y fail2ban activo"
description: "Cómo revisé y endurecí SSH, el firewall, las actualizaciones, fail2ban y Docker en mi servidor casero antes de subir el primer servicio."
tags: [homelab, seguridad, linux, docker, debian]
lang: es
draft: false
---

Hace poco monté un servidor en casa: un HP EliteDesk 800 G4 Mini con Debian 13, sin entorno gráfico y administrado solo por SSH. La idea es ir alojando ahí mis proyectos (empezando por esta misma web) con Docker Compose y publicarlos a través de Cloudflare Tunnel, sin abrir puertos en el router.

Antes de subir el primer contenedor quise hacer una cosa: **revisar la seguridad de la base**. Es mucho más fácil hacerlo ahora, con el servidor vacío, que cuando ya haya cinco servicios corriendo y miedo a romper algo.

Este post es el resumen de esa revisión: qué encontré, qué cambié y, sobre todo, las cosas que aprendí por el camino.

## Cómo lo planteé

Lo hice con Claude Code como copiloto, pero con unas reglas claras desde el principio, escritas en el `CLAUDE.md` del repositorio:

- **Primero auditar, luego cambiar.** Nada de tocar el sistema sin explicar antes qué y por qué.
- **Sudo limitado.** Creé un archivo en `/etc/sudoers.d/` que solo le permite ejecutar sin contraseña comandos de lectura concretos (`ufw status`, `sshd -T`, `fail2ban-client status`, `ss -tulpn`...). Cualquier cambio con `sudo` me lo propone y lo ejecuto yo.
- **Todo versionado.** Cada archivo de configuración vive en `~/homelab/system/` dentro de un repo git, se instala con `install` y se hace un commit por cada cambio que funciona.

Esto último me ha gustado mucho: ahora puedo ver la configuración de seguridad del servidor entera en un `git log`.

## El punto de partida

La base no estaba mal:

- **SSH** solo aceptaba claves; las contraseñas ya estaban desactivadas.
- **ufw** activo, denegando todo lo entrante por defecto y permitiendo el puerto 22 solo desde mi red local.
- **unattended-upgrades** instalado y aplicando las actualizaciones de seguridad de Debian.
- **fail2ban** activo con la jail de SSH.
- **Docker** instalado desde el repositorio oficial, todavía sin contenedores.

Pero había detalles que mejorar. Los fui atacando de uno en uno, del más importante al menos.

## 1. Docker se salta el firewall

Este era el más importante y el menos evidente. Docker gestiona sus propias reglas de iptables, y las inserta **antes** que las de ufw. Así que si en un `docker-compose.yml` pones:

```yaml
ports:
  - "8080:80"
```

ese puerto queda abierto a toda la red, **aunque ufw diga que no**. Es un comportamiento conocido, pero es fácil no darse cuenta hasta que alguien escanea tu IP.

En mi caso todo se va a publicar por Cloudflare Tunnel, así que los servicios no necesitan puertos publicados: el contenedor de `cloudflared` llega a ellos por la red interna de Docker. Aun así, quería una red de seguridad por si algún día se me escapa un `ports:`. La solución fue crear `/etc/docker/daemon.json`:

```json
{
  "ip": "127.0.0.1",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true
}
```

- `"ip": "127.0.0.1"` hace que cualquier puerto publicado sin IP explícita escuche solo en localhost.
- `log-opts` limita los logs de cada contenedor a 30 MB, para que uno muy hablador no llene el disco.
- `live-restore` mantiene los contenedores vivos aunque se reinicie o actualice el daemon de Docker (esto será importante en el punto 3).

Antes de dar nada por bueno, lo probé:

```bash
docker run --rm -d --name porttest -p 8080:80 nginx:alpine
ss -tln | grep 8080
# LISTEN 0  4096  127.0.0.1:8080  0.0.0.0:*
```

Solo `127.0.0.1`. Ni `0.0.0.0` ni `[::]`. Perfecto.

Ojo: esto no protege si escribes explícitamente `"0.0.0.0:8080:80"`. Por eso también lo dejé como regla en el `CLAUDE.md`: en los compose no se publican puertos, y si hace falta uno para pruebas, solo en `127.0.0.1`.

## 2. Endurecer SSH

SSH ya estaba bien en lo básico, pero `sshd -T` (que muestra la configuración *efectiva*, no solo lo que hay escrito en el archivo) reveló algunos valores por defecto mejorables:

- `PermitRootLogin` estaba en `without-password`: root podía entrar con clave.
- `X11Forwarding yes`, en un servidor sin entorno gráfico.
- Cualquier usuario del sistema podía intentar entrar.

En vez de editar `/etc/ssh/sshd_config`, creé un archivo aparte en `sshd_config.d/`. En Debian el `Include` de ese directorio está al principio del archivo principal, y en `sshd` gana el **primer** valor que se lee, así que lo que pongas ahí prevalece:

```
# /etc/ssh/sshd_config.d/10-hardening.conf
PermitRootLogin no
AllowUsers <mi-usuario>
X11Forwarding no
AllowAgentForwarding no
MaxAuthTries 3
LoginGraceTime 30
```

Dejé `AllowTcpForwarding` activado porque uso túneles SSH para acceder a cosas del servidor desde mi PC.

Para aplicarlo sin riesgo de quedarme fuera, usé un comando que valida antes de recargar y deshace el cambio si algo falla:

```bash
sudo install -m 644 -o root -g root 10-hardening.conf /etc/ssh/sshd_config.d/ && \
{ sudo sshd -t && sudo systemctl reload ssh || sudo rm /etc/ssh/sshd_config.d/10-hardening.conf; }
```

Y la regla de oro: **no cerrar la sesión actual** hasta comprobar que puedes abrir una nueva. `reload` no corta las sesiones existentes, así que si algo sale mal sigues dentro para arreglarlo.

## 3. Actualizaciones automáticas de verdad

`unattended-upgrades` estaba funcionando, pero con tres huecos:

1. **Docker no se actualizaba solo.** Viene de su propio repositorio, que no estaba entre los orígenes permitidos.
2. **El kernel se actualizaba pero nunca se aplicaba**, porque el servidor no se reiniciaba.
3. **Los kernels antiguos se iban acumulando.**

Igual que con SSH, en lugar de modificar el archivo de Debian añadí uno propio que se suma a él:

```
// /etc/apt/apt.conf.d/52unattended-upgrades-local
Unattended-Upgrade::Origins-Pattern {
        "origin=Docker,label=Docker CE";
};
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-WithUsers "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
```

El `origin` y el `label` no me los inventé: salen del archivo `InRelease` del repositorio de Docker en `/var/lib/apt/lists/`. Con `apt-config dump` comprobé que se sumaba a los orígenes de Debian en lugar de sustituirlos, y con `unattended-upgrade --dry-run --debug` que lo reconocía:

```
Allowed origins are: origin=Debian,codename=trixie,label=Debian, ..., origin=Docker,label=Docker CE
```

También instalé `needrestart`, configurado para reiniciar automáticamente los servicios afectados después de cada actualización (`$nrconf{restart} = 'a';`).

¿Y el reinicio automático? Solo ocurre si una actualización lo necesita, a las 4 de la mañana. Gracias a `live-restore` y a `restart: unless-stopped` en los compose, los servicios vuelven solos. Prefiero un par de minutos de caída de madrugada a tener un kernel sin parchear durante semanas.

## 4. fail2ban: no bloquearme a mí mismo

fail2ban ya vigilaba SSH, pero con los valores por defecto (bloqueo de 10 minutos) y sin excepciones. Añadí `/etc/fail2ban/jail.d/homelab.local`:

```ini
[DEFAULT]
ignoreip = 127.0.0.1/8 ::1 192.168.1.201 192.168.1.202
findtime = 10m
maxretry = 5
bantime = 1h
bantime.increment = true
bantime.maxtime = 1w
```

- `ignoreip` excluye mi PC y mi portátil, para que un despiste mío nunca me deje fuera.
- `bantime.increment` hace que los reincidentes reciban bloqueos cada vez más largos (1h, 2h, 4h...) hasta una semana.

Para que `ignoreip` tenga sentido, esas IPs tienen que ser fijas, así que antes tuve que reservarlas en el router. Ahí aparecieron dos de los aprendizajes del final.

Un detalle: antes de instalar el archivo, probé la configuración con `fail2ban-client -t` sobre una copia de `/etc/fail2ban`. Así, si tenía un error, no rompía el servicio real.

## 5. El grupo `docker` equivale a root

Estar en el grupo `docker` permite lanzar un contenedor que monte `/` del host, y con eso eres root a efectos prácticos. Las alternativas son usar `sudo docker` para todo o Docker *rootless*.

Para mi caso decidí **quedarme en el grupo**: soy el único usuario, SSH solo acepta claves y solo es accesible desde mi red local. Con `sudo docker` cada `docker ps` pediría contraseña, y rootless me obligaría a rehacer la configuración del daemon. A cambio, dejé por escrito en el `CLAUDE.md` qué no se hace sin preguntar: `privileged`, `network_mode: host`, `pid: host`, montar `/`, `/etc` o el socket de Docker.

No es una protección técnica, es una regla. Pero conocer el riesgo y decidir conscientemente ya es mucho mejor que no saber que existe.

## Lo que aprendí por el camino

Lo más interesante no fueron los cambios en sí, sino los tropiezos:

- **`systemctl` me mintió (o yo lo leí mal).** En la primera revisión, `systemctl` decía que el servicio `ufw` estaba `inactive (dead)` y pensé que el firewall no estaba funcionando. Con `ufw status verbose` vi que estaba perfectamente activo. Lección: comprueba el estado con la herramienta del propio servicio, no solo con systemd.
- **`sudo` necesita una terminal.** Si lanzas un comando con `sudo` desde un entorno sin TTY (como el `!` de Claude Code), no puede pedirte la contraseña y falla. Esos comandos los acabé ejecutando en una sesión SSH normal.
- **La MAC del Mac era aleatoria.** macOS usa por defecto una "dirección Wi-Fi privada" que puede rotar, y una reserva DHCP basada en una MAC que cambia no sirve de nada. Hay que ponerla en *Fija* para tu red antes de reservar la IP.
- **Windows tiene más adaptadores de los que crees.** Después de reservar la IP del PC, `ipconfig` me enseñaba una que no reconocía y pensé que la reserva no funcionaba. Era el adaptador virtual de VirtualBox (`192.168.56.1`). El adaptador Ethernet real tenía la IP correcta.
- **Los grupos no se aplican hasta que vuelves a entrar.** Me añadí al grupo `docker` pero seguía recibiendo `permission denied`. Las sesiones abiertas conservan los grupos que tenían al iniciarse.
- **Tenía una sesión abierta en la consola física desde el día de la instalación.** Una shell con mi usuario esperando a que alguien conectara un teclado. Se cierra con `loginctl terminate-session`.

## Cómo queda

| Área | Antes | Después |
|---|---|---|
| Docker | Los puertos publicados se saltaban ufw | Solo en `127.0.0.1`, logs limitados, `live-restore` |
| SSH | Root con clave, X11, cualquier usuario | Sin root, un solo usuario, sin X11 ni reenvío del agente |
| Actualizaciones | Solo Debian, sin reinicio | Debian + Docker, limpieza de kernels, reinicio a las 04:00 |
| fail2ban | 10 min, sin excepciones | Mis equipos excluidos, bloqueos crecientes hasta 1 semana |
| Grupo `docker` | Sin pensar en ello | Decisión consciente, con reglas escritas |

Todo está en el repositorio, con un commit por cambio. Si algún día tengo que reinstalar el servidor, solo tengo que volver a copiar los archivos de `system/`.

El siguiente paso es montar el primer servicio de verdad: `cloudflared` y esta web. Pero eso ya será otro post.
