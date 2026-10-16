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

## Tope de claves de los limitadores

Los tres limitadores por IP (intentos fallidos de acceso, mensajes por minuto y sesiones nuevas por hora) usan `http/services/rate-limiter.service.ts`, y cada uno guarda como máximo `MAX_CLAVES_LIMITADOR` (10 000) claves. La clave es la IP del cliente. Las IPv6 se agrupan por prefijo /64 (`GRUPOS_PREFIJO_IPV6`), porque un solo cliente suele tener un /64 entero.

El tope existe para que la memoria no crezca sin límite, y su regla es la de D-77 precisada por D-77.1. Al llegar a 10 000 claves, una clave nueva desaloja la clave **no bloqueada** más antigua y **hereda sus golpes**: no arranca en cero, sino con el contador de la desalojada más el golpe actual. La ventana heredada empieza cuando entra la clave nueva, así que nunca dura menos que la original. Por eso ninguna rotación reinicia contadores: cada intento evaluado queda contado en una ventana viva. Una clave bloqueada nunca se desaloja antes de que venza su ventana (D-77). Quien tiene un bloque /48 dispone de 65 536 prefijos /64, pero rotarlos no le devuelve intentos.

Con K = 10 000 claves y L = 5 intentos, la cota es K × L = 50 000 intentos evaluados contra `/api/acceso`, en cualquier orden de rotación (en serie o en ronda), contra un código de al menos 12 caracteres. Esa cota se cuenta por la ventana fija de cada clave, que nace con su primer golpe. En un intervalo móvil de la misma longitud (15 minutos) caben hasta unas dos veces esa cifra: quien concentra L − 1 golpes al final de las ventanas de sus claves y L al inicio de las siguientes junta cerca de 2 × K × L evaluaciones en 15 minutos.

La cota vale también con pedidos simultáneos (D-77.2). `/api/acceso` y `Authorization: Bearer` reservan el intento antes de leer el cuerpo o comparar el código: el golpe se comprueba y se cuenta en un solo paso, sin esperas en medio. Un pedido que no consigue reserva responde 429 sin evaluar nada, así que 50 pedidos errados simultáneos desde una IP dan 5 respuestas 401 y 45 respuestas 429. Un código o un Bearer correctos devuelven su reserva, y un cuerpo inválido también, porque no se evaluó ningún código. Un pedido rechazado por el tope no suma, de modo que un doble envío con el código correcto tras L − 1 fallos no deja bloqueada a la propia IP.

El tope de 5 por IP es aproximado con pedidos lentos o que cruzan la ventana, y se acepta así para el demo:

- Una reserva cuenta como golpe mientras su pedido no termina, y la lectura del cuerpo de `/api/acceso` no tiene plazo propio. Quien retiene a propósito el cuerpo de 5 pedidos deja en 429 a las demás personas de su misma IP mientras los sostiene.
- La reserva se devuelve contra la ventana vigente de la IP, no contra la ventana en que se tomó. Un pedido que se reserva al final de una ventana y termina con cuerpo inválido en la siguiente libera un lugar de la ventana nueva, así que esa IP puede evaluar algún código más que 5 en esa ventana.
- Si llegan juntas más credenciales correctas que lugares libres, las que no consiguen reserva reciben el mismo 429 de intentos fallidos con su espera de 15 minutos, aunque el pedido siguiente entra. La SPA no lo provoca: entra con un solo `POST /api/acceso`, deshabilita "Entrar" mientras espera y después usa la cookie, que no pasa por este limitador.

Ninguno de los tres casos inventa un dato ni salta la confirmación humana, y los tres exigen pedidos fabricados a propósito o simultáneos desde la misma red.

Un limitador solo **falla cerrado** cuando sus 10 000 claves están bloqueadas a la vez. En el de intentos eso exige 50 000 golpes (códigos errados evaluados o pedidos que siguen abiertos) desde al menos 10 000 IP o prefijos /64, y sostenerlo cuesta unos 50 000 por ventana, porque las claves bloqueadas vencen y liberan lugar. En ese estado una IP nueva no se guarda y queda bloqueada hasta que vence la ventana más antigua. Todo se recupera solo, a lo sumo una ventana después de que el ataque se detiene. Mientras quede una clave libre, una IP nueva siempre entra y tiene al menos un intento.

La herencia tiene un costo. Con la tabla llena, una IP legítima puede heredar hasta L − 1 golpes ajenos. En `/api/acceso` le queda al menos un intento, y con el código correcto entra. En mensajes por minuto le queda al menos un mensaje en ese minuto, y en sesiones nuevas al menos una sesión en esa hora. Solo pasa con 10 000 claves rastreadas a la vez.

Quien llega mientras el limitador de intentos está saturado ve en el 429 de `/api/acceso` el mismo texto de demasiados intentos, aunque su IP no haya fallado ninguno. Un texto propio para ese caso (IN-03) queda diferido.

El costo de saturar cada limitador y el alcance de su falla cerrada:

| Limitador | Quién lo puede llenar | Qué pasa saturado |
|---|---|---|
| Intentos fallidos de acceso (`ACCESS_MAX_FAILED_ATTEMPTS` en `ACCESS_FAILED_WINDOW_MINUTES`, 5 cada 15 min por defecto) | Cualquiera que falle el código, sin acceso previo, con K × L = 50 000 códigos errados evaluados en 15 minutos desde al menos 10 000 IP o prefijos /64. | `/api/acceso` y `Authorization: Bearer` responden 429 a toda IP, aun con el código correcto, hasta 15 minutos después del ataque. Quien ya tiene la cookie firmada no pasa por este limitador y sigue entrando. |
| Mensajes por minuto (`RATE_LIMIT_CHAT_PER_MINUTE`, ventana de 1 min) | Solo quien ya pasó el acceso, porque va después de `requireAccess`, con `MAX_CLAVES_LIMITADOR` × `RATE_LIMIT_CHAT_PER_MINUTE` pedidos autenticados en un minuto: unos 100 000 con los valores por defecto. | `POST /api/chat` responde 429 a toda IP, **también con la cookie de acceso**. Nadie puede mandar mensajes ni seguir su sesión hasta a lo sumo un minuto después de que el ataque se detiene. |
| Sesiones nuevas por hora (`NEW_SESSIONS_PER_HOUR`, ventana de 1 h) | Solo quien ya pasó el acceso, igual que el anterior, con `MAX_CLAVES_LIMITADOR` × `NEW_SESSIONS_PER_HOUR` sesiones nuevas en una hora: 200 000 en Render. | Nadie abre una sesión nueva, tampoco con la cookie: el 429 dice los minutos de espera, hasta 60. Quien ya tiene una sesión abierta sigue conversando en ella, mientras el limitador de mensajes no esté saturado. |

Se acepta por dos motivos. Los dos limitadores de `/api/chat` solo los satura alguien que ya conoce el código de acceso. Y las alternativas son peores: soltar claves bloqueadas reabre la fuerza bruta contra el código, y crecer sin tope reabre el agotamiento de memoria. Un balde compartido de desborde tampoco ayuda, porque también deja fuera a los recién llegados y suma estado.

Un despliegue real movería estos contadores a un almacén compartido con vencimiento (Redis o equivalente), sin tope de claves en la memoria del proceso.

## Qué haría un despliegue real

- Guardar contadores, bloqueos y sesiones en un almacén compartido y persistente (Redis o una base de datos), con claves que venzan solas, para que sobrevivan a reinicios y valgan entre varias instancias.
- Reservar tokens antes de llamar al modelo y ajustar con el uso real, para que la concurrencia no pase el tope diario.
- Dar a cada reserva de intento de acceso un recibo de un solo uso atado a su ventana, liquidarla en un `finally`, separar los intentos en curso de los fallos evaluados con un 429 propio, y poner un plazo de lectura al cuerpo de `/api/acceso`.
- Poner límites de gasto y alertas del lado del proveedor sobre la clave, y usar una clave de servicio en lugar de una personal.
- Correr en una instancia paga que no se duerma, o en varias instancias detrás del almacén compartido.
- Guardar los archivos generados en almacenamiento de objetos persistente (S3 o equivalente) con URLs firmadas y vencimiento.
- Tener un solo camino de entrada (un dominio detrás del borde) y tomar la IP del cliente de la cabecera que ese borde fija.
