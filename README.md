[![CI](https://github.com/alejotorreshi/retoeli1/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/alejotorreshi/retoeli1/actions/workflows/ci.yml)

# Agente "Registro como Proveedor" (Reto 01 · Perxia 2.0)

Agente conversacional que llena los formularios de registro como proveedor de Periferia IT Group ante sus clientes (CO, EC, PE, PA y HN). La analista escribe en un chat web, por ejemplo "procesa el caso ec-corp-andina". El agente lee la solicitud, mapea cada campo contra el repositorio maestro y genera el formulario en el formato pedido (xlsx, pdf o valores para portal). Después arma el paquete para firma con su checklist y un borrador de correo, y pide una confirmación explícita antes de cualquier envío, que en este reto es simulado. El agente nunca inventa un dato: lo que no está en el maestro queda como `faltante` y lo dudoso como `requiere_confirmacion`.

La especificación es `reto-01/PRD.md`, y las decisiones están justificadas en [SOLUCION.md](SOLUCION.md).

## Link de prueba y código de acceso

- Link público: https://registro-proveedor-bfnt.onrender.com

Código de acceso: `periferia-reto-2026`

- El código se escribe en la pantalla de entrada del chat. El valor de este README debe coincidir con `ACCESS_CODE` de Render. Si no coincide, la entrada responde que el código no es válido.
- El código se rota después de la evaluación: rotarlo invalida también las cookies firmadas que ya existan.
- Render free duerme el servicio tras 15 minutos sin tráfico. El primer pedido lo despierta y tarda entre 20 y 60 segundos. Su disco es efímero: los archivos de `out/` se borran al reiniciar (ver [docs/limites-del-demo.md](docs/limites-del-demo.md)).
- Para la demo del PRD §11, el chat ofrece el atajo del caso `ec-corp-andina`.

## Levantar en local (un comando)

Requisito: Bun 1.4.3 (la versión de `.bun-version`).

1. `bun install`
2. `cp .env.example .env`
3. Edita `.env` y completa `ACCESS_CODE` con un código de al menos 12 caracteres. Es obligatorio: sin él, `dev:api` sale con el mensaje "Falta el código de acceso".
4. Opcional: completa `LLM_API_KEY` con tu clave del proveedor. Sin clave el servidor arranca igual, `/api/health` informa `llm: "sin_clave"` y el chat responde que falta la clave.
5. `bun run dev`

`bun run dev` levanta en paralelo la API (`dev:api`, en http://localhost:3000, con recarga) y el front (`dev:web`, Vite en http://localhost:5173, que redirige `/api` a la API). Abre http://localhost:5173 y entra con tu `ACCESS_CODE`. En una máquina limpia tarda menos de 2 minutos.

Para correr como en producción: `bun run build:web` y después `bun run start`, con `NODE_ENV` en `production` y `ACCESS_TOKEN_SECRET` definido.

## Variables de entorno

Todas están en `.env.example` y todas son opcionales salvo `ACCESS_CODE`. Si una variable queda vacía se usa su valor por defecto. `src/config/env.ts` las valida con zod y, si una es inválida, el proceso sale con un mensaje en español. Bun carga el `.env` solo.

### Modelo

| Variable | Qué hace | Por defecto |
|---|---|---|
| `LLM_PROVIDER` | Proveedor del modelo. Con `deepseek` se aplican la URL, el modelo y las capacidades de su preset. | `deepseek` |
| `LLM_BASE_URL` | URL base de una API compatible con OpenAI. Exige `https`, salvo en `localhost`. | La del preset: `https://api.deepseek.com` |
| `LLM_MODEL` | Modelo principal. | `deepseek-flash` |
| `LLM_API_KEY` | Clave del proveedor. Solo vive en el backend y nunca sale en logs ni respuestas. | Vacía: el chat avisa que falta la clave |
| `DEEPSEEK_API_KEY` | Alias de la clave, usado cuando la URL es la de DeepSeek y `LLM_API_KEY` está vacía. | Vacía |
| `LLM_MAX_OUTPUT_TOKENS` | Tope de tokens de salida por llamada. | `2048` (máximo `65536`) |
| `LLM_MAX_TOKENS_PARAM` | Nombre del parámetro del tope: `max_tokens` o `max_completion_tokens`. | El del preset (`max_tokens`) |
| `LLM_TEMPERATURE` | Temperatura entre 0 y 2, u `omit` para no mandarla. | `0` |
| `LLM_THINKING` | Modo de razonamiento: `enabled`, `disabled` u `omit`. | `disabled` en DeepSeek |
| `LLM_REASONING_PASSBACK` | Devuelve el razonamiento del modelo en las llamadas siguientes (`true` o `false`). | `true` en DeepSeek |
| `LLM_TOOL_CHOICE_NONE` | Al cerrar un turno sin herramientas, manda `tool_choice: "none"` (`true`) o directamente no manda herramientas (`false`). | `true` |
| `LLM_TIMEOUT_MS` | Plazo de cada llamada al modelo, en milisegundos. | `45000` |
| `LLM_MAX_RETRIES` | Reintentos ante 429, 500, 503 o errores de red. Nunca se reintenta un 400, 401, 402 o 422. | `2` (máximo `5`) |

### Modelo de respaldo

Si el modelo principal no está disponible, el agente puede pasar a un respaldo. Cada variable vacía hereda del preset o del modelo principal.

| Variable | Qué hace | Por defecto |
|---|---|---|
| `LLM_FALLBACK_ENABLED` | Activa el respaldo (`true` o `false`). | `true` |
| `LLM_FALLBACK_PROVIDER` | Proveedor del respaldo. | El del principal |
| `LLM_FALLBACK_BASE_URL` | URL base del respaldo. | La del preset o la del principal |
| `LLM_FALLBACK_MODEL` | Modelo del respaldo. Si queda igual al principal en la misma URL, no hay respaldo. | `deepseek-v4-pro` en DeepSeek |
| `LLM_FALLBACK_API_KEY` | Clave del respaldo. | La del principal si comparten URL |
| `LLM_FALLBACK_MAX_TOKENS_PARAM` | Igual que `LLM_MAX_TOKENS_PARAM`, para el respaldo. | El del preset |
| `LLM_FALLBACK_TEMPERATURE` | Igual que `LLM_TEMPERATURE`, para el respaldo. | `0` |
| `LLM_FALLBACK_THINKING` | Igual que `LLM_THINKING`, para el respaldo. | El del preset |
| `LLM_FALLBACK_REASONING_PASSBACK` | Igual que `LLM_REASONING_PASSBACK`, para el respaldo. | El del preset |
| `LLM_FALLBACK_TOOL_CHOICE_NONE` | Igual que `LLM_TOOL_CHOICE_NONE`, para el respaldo. | El del preset |

### Agente

| Variable | Qué hace | Por defecto |
|---|---|---|
| `AGENT_TURN_DEADLINE_MS` | Plazo total de un turno, en milisegundos. | `120000` |
| `AGENT_MAX_ITERATIONS` | Tope de iteraciones (llamadas al modelo) por turno. | `25` (máximo `100`) |
| `AGENT_SESSION_TOKEN_BUDGET` | Presupuesto de tokens por sesión. | `300000` |
| `AGENT_DAILY_TOKEN_BUDGET` | Tope global de tokens por día y por proceso. | `2000000` |
| `AGENT_SESSION_TTL_MINUTES` | Minutos sin uso tras los que vence una sesión. | `120` |
| `AGENT_MAX_SESSIONS` | Sesiones que el proceso guarda en memoria a la vez. | `100` |
| `LOG_LEVEL` | Nivel de los logs JSON de pino: `fatal`, `error`, `warn`, `info`, `debug`, `trace` o `silent`. | `info` |
| `FECHA_EJECUCION` | Fecha de negocio fija (`AAAA-MM-DD`) para calcular vigencias. Render la fija en `2026-09-03`, la fecha de los fixtures. | Vacía: la fecha de hoy en `TZ_NEGOCIO` |
| `TZ_NEGOCIO` | Zona horaria del negocio. | `America/Bogota` |

### Servidor y acceso

| Variable | Qué hace | Por defecto |
|---|---|---|
| `PORT` | Puerto de la API. Render lo inyecta. | `3000` |
| `NODE_ENV` | `production`, `development` o `test`. `dev:api` usa `development`. | `production` |
| `ACCESS_CODE` | Código de acceso compartido, de 12 a 256 caracteres. Obligatorio. | Sin valor: el servidor no arranca |
| `ACCESS_TOKEN_SECRET` | Secreto para firmar la cookie de acceso, de al menos 32 caracteres y distinto de `ACCESS_CODE`. Obligatorio en `production`; Render lo genera. | En desarrollo, uno efímero por proceso |
| `ACCESS_TOKEN_TTL_HOURS` | Horas de validez de la cookie de acceso. | `12` (máximo `168`) |
| `TRUSTED_PROXY_HOPS` | Proxies de confianza delante del servidor, para leer la IP real de `X-Forwarded-For`. | `1` (Render usa `3`) |

### Límites

| Variable | Qué hace | Por defecto |
|---|---|---|
| `ACCESS_MAX_FAILED_ATTEMPTS` | Códigos errados por IP antes del bloqueo. | `5` |
| `ACCESS_FAILED_WINDOW_MINUTES` | Ventana y duración del bloqueo por códigos errados, en minutos. | `15` |
| `MAX_MESSAGE_CHARS` | Largo máximo de un mensaje del chat. | `2000` |
| `MAX_BODY_BYTES` | Tamaño máximo del cuerpo de un pedido. | `16384` |
| `RATE_LIMIT_CHAT_PER_MINUTE` | Mensajes por minuto por IP. | `10` |
| `MAX_CONCURRENT_TURNS` | Turnos del agente en curso a la vez en todo el proceso. | `3` |
| `NEW_SESSIONS_PER_HOUR` | Sesiones nuevas por hora por IP. | `5` (Render usa `20`) |

### Pre-flight

| Variable | Qué hace | Por defecto |
|---|---|---|
| `PREFLIGHT_URL` | URL del servicio que revisa `bun run preflight`, si no se pasa `--url`. | Vacía |
| `PREFLIGHT_ACCESS_CODE` | Código de acceso que usa el pre-flight. Nunca se pasa como argumento. | Vacía: el pre-flight no corre |

## Demo sin modelo

```bash
bun run demo.ts
```

Corre los cuatro casos de `reto-01/fixtures` llamando directamente a las herramientas, sin clave de ningún proveedor. Limpia `out/` al empezar, imprime por caso el formato, la ruta de salida, los campos llenos, faltantes y por confirmar, los soportes ausentes o vencidos y el estado del paquete (`LISTO` o `BLOQUEADO`), y cierra con una tabla resumen. Nunca envía nada. Dos corridas seguidas producen el mismo resultado.

## Pruebas y calidad

| Comando | Qué hace |
|---|---|
| `bun test` | Toda la suite sin gastar tokens: unitarias, contrato, el bucle con un modelo falso, HTTP, demo de punta a punta, guardianes de arquitectura y contratos de la documentación. |
| `bun run check` | TypeScript estricto del backend y del front (`tsc --noEmit`) y Biome. |
| `bun run audit` | `bun audit` de las dependencias. En la CI corre en un job aparte que no bloquea el badge. |
| `bun run test:vivo` | Opcional: prueba el agente contra el modelo real. Gasta la clave de `.env`. |
| `bun run costo` | Opcional: mide el costo por caso contra el modelo real y reescribe [docs/evidencia/costo-por-caso.json](docs/evidencia/costo-por-caso.json). Gasta la clave. |

La CI de GitHub Actions corre en cada push a `main`: `bun install --frozen-lockfile`, `bun run check`, `bun test`, `bun run demo.ts` y `bun run build:web`. El costo medido de un caso es de alrededor de 0.002 USD con la tarifa pico de `deepseek-flash`.

## API

El servidor es Hono 4.13.13 sobre Bun. Todas las rutas bajo `/api` piden acceso, salvo `/api/health` y `/api/acceso`. El acceso se da con la cookie firmada que entrega `/api/acceso` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api`) o con la cabecera `Authorization: Bearer <código>`.

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/health` | `{ ok: true, provider, model, llm }`, sin claves y sin llamar al modelo. `llm` es `disponible`, `sin_clave`, `saldo_agotado`, `no_disponible` o `tope_diario`. |
| `POST` | `/api/acceso` | Recibe `{ codigo }` y, si es correcto, entrega la cookie de acceso. |
| `GET` | `/api/config` | La fecha de ejecución efectiva, la zona, los casos disponibles, el presupuesto por sesión y el largo máximo del mensaje. |
| `POST` | `/api/chat` | Recibe `{ sessionId, message }`, con `sessionId: null` para una sesión nueva. Opcionalmente `accion: { tipo, caso }`, con `tipo` igual a `confirmar` o `cancelar`. Responde con eventos SSE. |
| `GET` | `/api/sessions/:id` | El historial redactado de la sesión, para recargar el chat. Responde 404 si venció. |
| `GET` | `/api/casos/:caso/archivos` | Lista los archivos generados del caso. |
| `GET` | `/api/casos/:caso/archivos/:nombre` | Descarga un archivo generado. |
| `GET` | `/api/casos/:caso/archivos/paquete/:nombre` | Descarga un archivo del paquete para firma. |
| `GET` | `/api/casos/:caso/vista-previa/:nombre` | Vista previa de un archivo generado. |
| `GET` | `/api/casos/:caso/vista-previa/paquete/:nombre` | Vista previa de un archivo del paquete. |

Eventos SSE de `POST /api/chat`, en orden: `turn_start`, `tool_start` y `tool_end` por cada herramienta, `text`, `confirmation_required` (si hay un envío esperando confirmación), `usage`, `error` (si el turno falla) y `turn_end`. Mientras el turno corre, el servidor manda un comentario `: ping` cada 8 segundos para que el proxy no corte la conexión.

Respaldo JSON (PRD §6.4): con `Accept: application/json`, `POST /api/chat` responde al terminar el turno con `{ sessionId, reply, toolCalls, needsConfirmation }`.

```bash
curl -N -X POST https://registro-proveedor-bfnt.onrender.com/api/chat \
  -H "Authorization: Bearer $CODIGO" -H "Content-Type: application/json" \
  -d '{"sessionId":null,"message":"Procesa el caso \"ec-corp-andina\". No envíes nada todavía."}'
```

## Pre-flight de la defensa

```bash
bun run preflight -- --url https://registro-proveedor-bfnt.onrender.com
bun run preflight -- --url https://registro-proveedor-bfnt.onrender.com --guion
```

- El código de acceso se lee de `PREFLIGHT_ACCESS_CODE`, en el entorno o en el `.env` local, y nunca va como argumento. La URL puede ir en `--url` o en `PREFLIGHT_URL`.
- Por defecto no gasta tokens: despierta el servicio, espera `/api/health` con el modelo disponible y comprueba el código de acceso con `GET /api/config`.
- Con `--guion` corre el §11 completo en dos turnos: "Procesa el caso ec-corp-andina… No envíes nada todavía", verifica la confirmación pendiente, después "envía" y verifica que aparezca `ENVIO-SIMULADO.md`. También comprueba que el chat llegue como SSE y por partes: `Content-Type: text/event-stream`, `Cache-Control` con `no-cache`, y `turn_end` al menos 250 ms después de `turn_start`. No exige `X-Accel-Buffering`, porque es una instrucción para el proxy y el borde de Render la quita antes de que llegue al cliente. Gasta lo de una corrida del §11 y reporta los tokens.
- Conviene correrlo unos 10 minutos antes de la defensa, porque la propia defensa mantiene despierto el servicio. Un cron externo (cron-job.org o UptimeRobot) que pida `/api/health` cada 10 minutos es una opción, pero no está configurado.
- Un código equivocado cuenta para el bloqueo por IP. No pruebes códigos errados contra Render antes de la defensa.

## Módulo reutilizable

`modulo/` empaqueta el agente para otro host de agentes sin este servidor (PRD §9.4): `agent.md` (frontmatter de OpenCode más el prompt), `skill/registro-proveedor/SKILL.md` (el conocimiento del proceso) y `tools/proveedor.ts` (los mismos objetos de las herramientas de la aplicación). `bun run modulo` regenera `agent.md` y `SKILL.md` desde `agent/prompt.md` y `src/knowledge/`, y una prueba falla si lo commiteado no coincide. `opencode.json` registra el agente y la skill, y `.opencode/tools/proveedor.ts` enlaza las herramientas para que OpenCode las vea como `proveedor_<export>`. Los detalles y límites están en [modulo/README.md](modulo/README.md).

## Despliegue

- Render free con el Blueprint `render.yaml` (runtime Docker). `autoDeployTrigger: checksPass` hace que Render despliegue solo cuando pasan los checks de la CI.
- `LLM_API_KEY` y `ACCESS_CODE` se cargan a mano en el panel de Render (`sync: false`), y `ACCESS_TOKEN_SECRET` lo genera Render.
- El `Dockerfile` (imagen `oven/bun:1.4.3-slim`) es también el plan B portable a otro proveedor: `docker build -t registro-proveedor .` y `docker run --env-file .env -e PORT=10000 -p 10000:10000 registro-proveedor`, con `ACCESS_CODE` y `ACCESS_TOKEN_SECRET` completos en `.env`.

## Stack

Bun 1.4.3, TypeScript 7.0.2 estricto y sin `any`. Dependencias de ejecución: exceljs 4.4.0, hono 4.13.13, pdf-lib 1.17.1, pino 10.3.1 y zod 4.6.5. Front: react 19.3.0, vite 8.3.3 y eventsource-parser 4.1.1. Cada dependencia está justificada en [SOLUCION.md](SOLUCION.md).

## Documentación

- [SOLUCION.md](SOLUCION.md): problema, arquitectura, ciclo del agente, modelo y costo, portal, trade-offs, supuestos, cobertura, uso de IA y riesgos.
- [docs/arquitectura.md](docs/arquitectura.md): recorrido de un pedido, capas y cómo retomar el proyecto.
- [docs/convenciones.md](docs/convenciones.md): por qué existe cada regla y qué guardián la vigila.
- [docs/estructura.md](docs/estructura.md): cada módulo de `src/` por carpeta y rol.
- [docs/limites-del-demo.md](docs/limites-del-demo.md): qué se pierde al reiniciar en Render free.
- [docs/plantillas.md](docs/plantillas.md): las plantillas de los formularios.
- [docs/evidencia/costo-por-caso.json](docs/evidencia/costo-por-caso.json): el costo medido por caso.
- [modulo/README.md](modulo/README.md): el módulo reutilizable.

## Entrega

La checklist de entrega y los pendientes humanos están en [docs/entrega.md](docs/entrega.md).
