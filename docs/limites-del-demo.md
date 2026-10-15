# Límites del despliegue de demostración

El servicio corre en una sola instancia de Render free. Todo el estado de control vive en la memoria del proceso o en su disco efímero, así que se pierde cuando el proceso se reinicia. En Render free eso pasa en tres momentos:

- cuando el servicio se duerme tras 15 minutos sin tráfico y despierta con el siguiente pedido;
- cuando Render lo reinicia por su cuenta, algo que puede pasar en cualquier momento;
- cuando se redespliega.

Esta sección la debe recoger también `SOLUCION.md` (fase 4).

## Qué se reinicia

| Estado | Dónde vive | Qué pasa al reiniciar |
|---|---|---|
| Tope diario de tokens (`AGENT_DAILY_TOKEN_BUDGET`, 2M por defecto) | Memoria, en `llm/decorators/daily-budget.decorator.ts` | Vuelve a cero. No es un tope por día calendario sino por proceso y día: se reinicia a medianoche en `TZ_NEGOCIO` **y** en cada reinicio. Además, el chequeo ocurre antes de cada llamada y el registro después, así que con `MAX_CONCURRENT_TURNS` turnos a la vez el tope se puede pasar en hasta esa cantidad de llamadas. |
| Intentos fallidos de acceso por IP (`ACCESS_MAX_FAILED_ATTEMPTS` en `ACCESS_FAILED_WINDOW_MINUTES`) | Memoria, `http/services/rate-limiter.service.ts` | Se borra el contador y se levantan los bloqueos. |
| Mensajes por minuto por IP (`RATE_LIMIT_CHAT_PER_MINUTE`) | Memoria | Se borra. |
| Sesiones nuevas por hora por IP (`NEW_SESSIONS_PER_HOUR`, 5 por defecto y 20 en Render) | Memoria | Se borra. |
| Turnos simultáneos (`MAX_CONCURRENT_TURNS`) | Memoria, `http/services/turn-slots.service.ts` | Vuelve a cero, y los turnos en curso se cortan. |
| Sesiones del chat y su presupuesto de tokens (`AGENT_SESSION_TOKEN_BUDGET`) | Memoria, `infra/sessions/memory-session-store.adapter.ts` | Se pierden. La SPA lo detecta y ofrece empezar una sesión nueva. |
| Archivos generados en `out/<caso>/` | Disco efímero del contenedor | Se borran. La SPA avisa que el disco se borró y sugiere reprocesar el caso. |

La cookie de acceso sí sobrevive, porque su firma depende de `ACCESS_TOKEN_SECRET` (estable en Render) y de `ACCESS_CODE`.

## Por qué es aceptable para el reto

- Es una demostración de una sola instancia, con un enlace que solo conoce quien evalúa y protegido por un código de acceso.
- La clave del modelo es personal y prepaga: el saldo del proveedor es el tope real de gasto, y al agotarse la API responde 402, que el agente muestra con su mensaje propio.
- La ventana de uso es corta (la defensa) y el servicio se calienta antes de empezar.
- Persistir los contadores exigiría una base de datos o un Redis externo, y eso es un no-objetivo del PRD. Render free tampoco tiene disco persistente.

Lo que sí limita el gasto aunque el proceso se reinicie: el tope de iteraciones por turno, el presupuesto de tokens por sesión, el `max_tokens` por llamada, el plazo por turno y el código de acceso.

## Tope de sesiones nuevas en Render

En local el tope de sesiones nuevas por IP es 5 por hora (`SESIONES_NUEVAS_POR_HORA_POR_DEFECTO`). En Render, `render.yaml` lo sube a 20 por hora (`SESIONES_NUEVAS_POR_HORA_RENDER`), y el contrato de despliegue lo exige.

Subirlo no aumenta el gasto máximo. Cada sesión tiene un presupuesto de 300 k tokens (`AGENT_SESSION_TOKEN_BUDGET`), así que 20 sesiones podrían pedir hasta 6 M tokens en una hora. Pero el tope diario global de 2 M tokens (`AGENT_DAILY_TOKEN_BUDGET`) corta antes, porque alcanza para unas 6 sesiones agotadas por día. Ese tope diario sigue siendo el límite real de gasto, junto con el código de acceso, los 10 mensajes por minuto por IP y el saldo prepago. El blueprint no lo cambia: sigue con su valor por defecto.

El tope de sesiones solo frena la rotación patológica, es decir, abrir sesiones sin parar para estrenar presupuesto. Con 5 por hora, la defensa podía chocar con él por motivos normales que también cuentan como sesión nueva:

- los ensayos previos desde la misma red;
- las recargas con un id vencido o tras un reinicio de Render, que borra las sesiones;
- varias personas que salen a internet por la misma IP (una oficina o una red con NAT).

Con 20 por hora queda margen para todo eso. Si aun así se llega al tope, el 429 dice en cuántos minutos se puede abrir otra sesión (por ejemplo, "Podrás abrir otra en 12 minutos."), y la SPA ofrece volver a la sesión anterior en lugar de dejar a la analista sin sesión (03-38).

## Un solo camino de entrada

Los topes por IP (intentos fallidos, mensajes por minuto y sesiones nuevas por hora) toman la IP del cliente de `X-Forwarded-For`, contando `TRUSTED_PROXY_HOPS` entradas desde la derecha. En Render el valor es `3` (`SALTOS_PROXY_RENDER`, fijado en `render.yaml`), y se midió en vivo sobre el único hostname público, `registro-proveedor-bfnt.onrender.com`, que pasa por Cloudflare y por el borde de Render.

Ese número solo vale para ese camino. Si el servicio también se publicara por otro hostname con distinta cantidad de proxies (un dominio propio, otro CDN), quien llama podría anteponer entradas falsas a `X-Forwarded-For` y elegir la IP con la que se cuentan sus topes. Por eso:

- el demo se publica por un solo hostname y no se le agrega un dominio propio;
- si se agrega otro hostname, hay que volver a medir los saltos en cada uno (`curl` con y sin `-H "X-Forwarded-For: 203.0.113.9"` y `LOG_LEVEL=debug`, mirando `entradasXff` en el evento `http_client_ip_resolved`) y usar un solo valor que sirva para todos, o dejar uno solo;
- si la entrada elegida no es una IP válida, el servidor cuenta por la dirección del socket en lugar de usar ese texto como clave.

## Qué haría un despliegue real

- Guardar contadores, bloqueos y sesiones en un almacén compartido y persistente (Redis o una base de datos), con claves que venzan solas, para que sobrevivan a reinicios y valgan entre varias instancias.
- Reservar tokens antes de llamar al modelo y ajustar con el uso real, para que la concurrencia no pase el tope diario.
- Poner límites de gasto y alertas del lado del proveedor sobre la clave, y usar una clave de servicio en lugar de una personal.
- Correr en una instancia paga que no se duerma, o en varias instancias detrás del almacén compartido.
- Guardar los archivos generados en almacenamiento de objetos persistente (S3 o equivalente) con URLs firmadas y vencimiento.
- Tener un solo camino de entrada (un dominio detrás del borde) y tomar la IP del cliente de la cabecera que ese borde fija.
