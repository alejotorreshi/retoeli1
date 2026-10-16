# Estructura de `src/`

Cada archivo vive en la carpeta de su rol y lleva el sufijo de ese rol. `tests/architecture.test.ts` lo exige con G5 (tabla de sufijos por carpeta), G13 (ningún archivo suelto en `src/` ni en la raíz de una capa) y G14 (cada prueba unitaria es espejo de un módulo).

## Roles del dominio

| Carpeta | Sufijo | Rol |
|---|---|---|
| `domain/engines/` | `.engine.ts` | Algoritmo central que conduce un flujo: el mapeo de etiquetas (`mapeo`) y el motor de plantillas (`motor-plantillas`). |
| `domain/builders/` | `.builder.ts` | Arma una estructura de salida con datos ya decididos: formulario (`formulario`), checklist (`checklist`), borrador (`borrador`), portal (`portal`), índice del glosario (`glosario`), campo presentado (`campo-presentado`), texto de cierre del turno con la pregunta de confirmación (`cierre-turno`) y frontmatter del agente y de la skill de OpenCode que se antepone, sin tocar un byte, al prompt y al conocimiento del proceso (`modulo`). |
| `domain/policies/` | `.policy.ts` | Decide o valida según una regla de negocio: soportes (`soportes`), vigencias (`vigencias`), PII (`pii`), identificador tributario (`identificador-tributario`), plantilla del caso (`plantilla-caso`), comparación de mapeos (`comparar-mapeo`), textos de reglas (`validar-reglas`), vigencia del paquete armado (`paquete-vigente`), compuerta de confirmación (`compuerta`), clasificación de la respuesta de la analista (`confirmacion`) y redacción de secretos y claves sensibles (`redaccion`). |
| `domain/selectors/` | `.selector.ts` | Lee o proyecta datos de una entrada sin decidir nada: maestro y solicitud. |
| `domain/utils/` | `.util.ts` | Función genérica sin regla de negocio: fecha (`fecha`), normalización (`normalizar`), resultado (`resultado`), formato de issues (`formatear-issues`), nombre de error (`nombre-error`), texto plano sin markdown (`texto-plano`), lectura de JSON (`json`) y sobre de fallo de una herramienta (`respuesta-herramienta`). |
| `domain/types/` | `.type.ts` | Solo tipos, en una carpeta plana en la raíz de la capa. |

`motor-plantillas.engine.ts` se mantiene entero: `plantillaInvalida` es el `Fallo` que emite el motor y `seccionSi` codifica el protocolo de secciones `[{}]`/`[]` que solo este motor interpreta.

`formatear-issues.util.ts` y `nombre-error.util.ts` solo los importan infra y tools. Viven en el dominio porque es la única capa a la que ambas pueden llegar sin romper la dirección de las dependencias.

## Herramientas, demo y config

- `tools/proveedor.ts` queda en la raíz de `tools/` porque el PRD (6.2) fija su nombre.
- `tools/factories/*.factory.ts` construye las herramientas, y `tools/wiring/entorno.wiring.ts` es el único composition root que importa infra. El guardián de capas lo reconoce por su ruta exacta; cualquier otro archivo de `tools/` sigue sin poder importar infra.
- `demo/runners/ejecutar-demo.runner.ts` ejecuta la demo que lanza `demo.ts`.
- `config/env.ts` y `config/strings.ts` son las otras dos excepciones permitidas en la raíz de una capa. `env.ts` es la única frontera con el entorno (esquema, lector y `pinExecutionDate`), así que ningún sufijo de rol lo describe. La usuaria fijó `strings.ts` como fuente única de textos.

## Capas del agente

El agente agrega dos capas. El guardián de capas de `tests/architecture.test.ts` las declara con sus importaciones permitidas, y cada regla tiene su prueba de violación.

| Carpeta | Sufijo | Rol |
|---|---|---|
| `llm/types/` | `.type.ts` | El puerto neutral `AdaptadorLlm` (`enviar(mensajes, herramientas, opciones)`) y los tipos del protocolo compatible con OpenAI. |
| `llm/schemas/` | `.schema.ts` | Validación zod tolerante de la respuesta del proveedor. |
| `llm/adapters/` | `.adapter.ts` | El adaptador genérico compatible con OpenAI. Lo propio de cada proveedor llega como flags de capacidad, nunca como ramas por nombre. |
| `llm/decorators/` | `.decorator.ts` | Envoltorios sobre un `AdaptadorLlm`: resiliencia (`timeout`, reintentos en `retry` y respaldo en `fallback`) aviso de cada fallo al observador del turno (`observation`) publicación del último estado del modelo para `/api/health` (`health-report`) y tope diario global de tokens, que cuenta también el respaldo y vive en la memoria del proceso: se reinicia a medianoche en `TZ_NEGOCIO` y también con cada reinicio del proceso, que en Render free incluye cada spin-down y cada redespliegue (`daily-budget`; ver [límites del demo](limites-del-demo.md)). |
| `llm/mappers/` | `.mapper.ts` | Traducción entre el modelo neutral y el formato del proveedor, y de estados HTTP a errores tipados. |
| `loop/types/` | `.type.ts` | Eventos del turno, sesión, estado y dependencias del turno, registro de herramientas, lectura tolerante del resultado de una herramienta, su resultado visible (`ResultadoVisible`) y la vista redactada de una sesión para recargar el chat (`vista-sesion`: `VistaSesion`, `TurnoVista`, `HerramientaVista`, `PendienteVista`). |
| `loop/schemas/` | `.schema.ts` | Lectura tolerante del resultado JSON de una herramienta y del resultado visible que se proyecta de él (`resultado-herramienta`), y la forma de la vista de sesión, con la que se vuelve a validar después de redactarla (`vista-sesion`). |
| `loop/services/` | `.service.ts` | El bucle del agente, un generador de eventos tipados: orquestación del turno (`ejecutar-turno`), conversación con el modelo (`conversacion-turno`), pasos de herramientas (`paso-herramientas`), despacho con la compuerta (`despacho-llamada`), proyección del resultado visible de cada herramienta para la UI, sin valores del maestro (`resultado-visible`), vista de una sesión guardada para recargar el chat: agrupa el historial por mensaje de la usuaria con sus llamadas (caso, argumentos redactados, ok, código, resumen y el mismo resultado visible del `tool_end`) y el texto final, más los casos pendientes con sus bloqueos legibles, sin mensajes de sistema ni razonamiento del modelo y redactada con los secretos del proceso (`vista-sesion`), cierres por error o aborto (`cierre-error`), cierre con la compuerta (`cierre-turno`), guardado de la sesión (`guardado-turno`), bitácora (`bitacora-turno`), presupuesto de tokens (`presupuesto`), tope de iteraciones (`tope-iteraciones`), respuesta no streaming (`respuesta-turno`) y registro de herramientas `proveedor_<export>` (`registro-herramientas`). |
| `loop/wiring/` | `.wiring.ts` | `agente.wiring.ts`, el composition root del agente: lee el entorno y arma adaptadores, sesiones e instrucciones. |

Idioma: `loop` va en español. En `llm`, el puerto neutral (`llm.type.ts`) va en español porque lo consume el bucle; el protocolo del proveedor (`provider.type.ts`, `adapters/`, `mappers/`, `schemas/`) y los decoradores (`decorators/` y `resilience.type.ts`) van en inglés, como infra. Un archivo en inglés sigue usando los miembros en español del puerto (`enviar`, `proveedor`, `rol`).

Direcciones permitidas:

- `llm` solo importa `llm`, la config pura y zod. No conoce el dominio, el bucle, infra ni `node:`.
- `loop` importa `loop`, `llm`, dominio, aplicación, los tipos de las herramientas, la config pura y zod. Nunca importa infra, `config/env.ts` ni `tools/proveedor.ts`: el módulo de herramientas le llega inyectado.
- `loop/wiring/agente.wiring.ts` es el segundo composition root. Además de lo anterior puede importar infra, `config/env.ts` y `tools/proveedor.ts`. Cualquier otro archivo de `loop/wiring/` sigue las reglas de `loop`.
- pino solo se importa desde infra.
- `config/env.ts` lo importan infra, tools, demo, `cli`, `loop/wiring/agente.wiring.ts` y `http/wiring/server.wiring.ts`.

## Capa HTTP

La API agrega la capa `http` y la entrada del proceso `src/server.ts`. El guardián de capas de `tests/architecture.test.ts` las declara con sus importaciones permitidas, y cada regla tiene su prueba de violación.

| Carpeta | Sufijo | Rol |
|---|---|---|
| `http/routes/` | `.route.ts` | Una ruta Hono por recurso: salud del servicio sin acceso y sin llamar al modelo (`health`) y el turno del chat por SSE con latido, timeout de inactividad desactivado, corte al cerrar la pestaña y respaldo JSON del PRD §6.4; cuenta como sesión nueva todo pedido con `sessionId` null o con un id que el almacén no tiene (`Agente.existeSesion`, que lee sin crear ni renovar) y responde 429 `{ mensaje }` cuando la IP real del cliente ya abrió `NEW_SESSIONS_PER_HOUR` en la última hora; el rechazo se decide antes del cupo de turno y la sesión se cuenta solo si el turno obtiene cupo (`chat`), la entrada con el código compartido, comparado en tiempo constante, que responde con la cookie firmada `HttpOnly; Secure; SameSite=Strict; Path=/api` (`access`), y los datos que la SPA no inventa, tras el acceso: la fecha efectiva del reloj de negocio, la zona, los casos de los fixtures, el presupuesto de tokens por sesión y el largo máximo del mensaje, `mensajeMaximo` (`config`), la vista redactada de una sesión, tras el acceso, que lee el almacén sin crear la sesión, sin renovar su TTL y sin esperar el candado del turno (responde `ocupada: true` con el último historial guardado mientras corre un turno) y responde 404 `{ mensaje }` con el texto de sesión expirada ante un id desconocido o vencido (`sessions`), y la SPA construida, pública, servida con `serveStatic` desde `web/dist` resuelto como ruta absoluta, con respaldo a `index.html` para toda ruta GET fuera de `/api`; una ruta con `%` o `..` nunca sale de `web/dist` y cae en `index.html` (`static`). La SPA deja pasar toda ruta bajo `/api`, así que una ruta `/api` desconocida sigue respondiendo 404 `{ mensaje }`. Los archivos generados de cada caso, tras el acceso (`artifacts`): `GET /api/casos/:caso/archivos` lista solo la lista blanca que existe en disco en ese momento (`formulario.xlsx`, `formulario.pdf`, `valores-portal.md`, `paquete/checklist.md`, `paquete/borrador-correo.md`, `ENVIO-SIMULADO.md` y los soportes copiados en `paquete/`; nunca `mapeo.json`, `log.jsonl` ni las copias del formulario en `paquete/`), y `GET /api/casos/:caso/archivos/:nombre` (o `…/archivos/paquete/:nombre`) entrega el archivo real byte a byte con `Content-Disposition: attachment`, el `Content-Type` de su extensión y `Cache-Control: no-store`, y `GET /api/casos/:caso/vista-previa/:nombre` (o `…/vista-previa/paquete/:nombre`) responde la vista previa que nunca muestra un valor completo: el formulario (`formulario.xlsx` o `formulario.pdf`) y `valores-portal.md` salen como tabla de `etiqueta`, `valor_enmascarado`, `estado` y `nota` leída de `mapeo.json` con el esquema tolerante `infra/output/schemas/mapeo-guardado.schema.ts` (sin parsear el xlsx ni renderizar el PDF), y `paquete/checklist.md`, `paquete/borrador-correo.md` y `ENVIO-SIMULADO.md` salen como texto plano; el borrador conserva completos el nombre y el cargo del firmante por decisión de la usuaria (D-74). Los soportes no tienen vista previa. Un archivo que no existe responde 404 (la SPA lo toma como disco borrado) y uno que existe pero no tiene vista previa, como un soporte o un formulario sin `mapeo.json` legible, responde 422, para no simular un disco borrado. La ruta recibe el puerto `LectorArtefactos` (`application/types/artefactos.type.ts`), que implementa `infra/output/artifact-reader.adapter.ts`: valida el caso con `PATRON_CASO` y contra los casos de los fixtures, compara el nombre pedido con la lista blanca calculada (nunca lo concatena a una ruta), descarta enlaces simbólicos y contiene la ruta real dentro del caso con `safe-paths.util.ts`. Todo lo demás responde 404 `{ mensaje }`. |
| `http/middlewares/` | `.middleware.ts` | Middlewares Hono que se aplican antes de las rutas: la IP real del cliente, resuelta una vez por pedido en la variable de contexto `clientIp` con un log de depuración que registra solo cuántas entradas trae `X-Forwarded-For` y los saltos configurados, nunca una dirección (`client-ip`), la guardia de acceso de todo `/api` salvo health y la entrada, que acepta la cookie firmada y vigente o `Authorization: Bearer` con el código, comparado en tiempo constante, y responde 429 al cliente bloqueado por intentos fallidos (`access`), y el filtro de todo POST de `/api` que responde 415 `{ mensaje }` si el `Content-Type` no empieza con `application/json`, defensa CSRF junto a `SameSite=Strict` porque obliga a un preflight entre orígenes (`json-only`), y el tope de mensajes por IP real del cliente, que en `POST /api/chat`, después del acceso, cuenta cada pedido autenticado, válido o no, y responde 429 `{ mensaje }` al pasar `RATE_LIMIT_CHAT_PER_MINUTE` en un minuto (`rate-limit`). |
| `http/services/` | `.service.ts` | Lógica HTTP pura, sin Hono, que las rutas reutilizan: proyección de cada evento del bucle a un frame SSE redactado y el temporizador del latido (`sse`), la emisión y la validación del token de acceso `v1.<vence en ms>` con el reloj inyectado, y la clave con la que se firma la cookie, un HMAC-SHA256 del código con `ACCESS_TOKEN_SECRET`, para que rotar `ACCESS_CODE` invalide las cookies ya emitidas sin poner el código en la cookie (`access-token`), la IP del cliente tomada de `X-Forwarded-For` contando `TRUSTED_PROXY_HOPS` desde la derecha, con el socket como respaldo cuando faltan entradas o la elegida no es una IP, y normalizada a su prefijo /64 si es IPv6 (el valor de Render y su único camino de entrada están en [límites del demo](limites-del-demo.md)), para que rotar direcciones de un mismo host no evada los topes (`client-ip`), y el contador de ventana fija por clave, con reloj inyectado, limpieza de ventanas vencidas y un tope de claves (`MAX_CLAVES_LIMITADOR`) que desaloja la más antigua, que corta los intentos fallidos de acceso y los mensajes por minuto (`rate-limiter`), y el semáforo global de turnos simultáneos, que la ruta del chat adquiere antes de abrir el turno (503 `{ mensaje }` si no hay cupo) y libera en el `finally` del stream, después del pliegue JSON y al abortar, con la función de un solo uso que devuelve `tryAcquire`, así que una doble liberación no abre un cupo de más (`turn-slots`). `inUse` del semáforo y `trackedKeys` del limitador son un puerto de observación (`ObservableTurnSlots`, `ObservableRateLimiter`): los usan las pruebas y no forman parte del contrato que reciben las rutas. |
| `http/schemas/` | `.schema.ts` | Validación zod de los cuerpos que recibe la API, con `satisfies z.ZodType<T>`: el del chat (`chat-body`) y el de la entrada (`access-body`). |
| `http/types/` | `.type.ts` | El contrato del cable (`api.type.ts`, que el front importa con `import type`) y los tipos del servidor (`server.type.ts`: `HttpBindings`, `HttpEnv`, `ServerOptions`, `ServerCreation`, `AccessSettings`, `StaticSettings`, `RateLimiter` y los datos de la IP del cliente). |
| `http/wiring/` | `.wiring.ts` | `server.wiring.ts`, el tercer composition root: lee `ServerEnv` (puerto, `NODE_ENV`, `ACCESS_CODE`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_TTL_HOURS`, `TRUSTED_PROXY_HOPS`, `ACCESS_MAX_FAILED_ATTEMPTS`, `ACCESS_FAILED_WINDOW_MINUTES`, `MAX_MESSAGE_CHARS`, `MAX_BODY_BYTES`, `RATE_LIMIT_CHAT_PER_MINUTE`, `MAX_CONCURRENT_TURNS` y `NEW_SESSIONS_PER_HOUR`; en desarrollo, sin secreto, genera uno efímero de 256 bits; en producción lo exige y en todo entorno lo rechaza si repite el código o la clave del modelo), arma el agente con `crearAgente` y la app Hono, aplica `secureHeaders` a toda respuesta, con una CSP que limita `default-src`, `script-src`, `style-src` y `connect-src` a `'self'` y fija `object-src 'none'` y `frame-ancestors 'none'`, y en cada pedido a `/api` aplica `json-only` y luego `bodyLimit` (413 `{ mensaje }` antes de parsear el JSON). La ruta del chat responde 413 si el mensaje supera `MAX_MESSAGE_CHARS`. Además registra la SPA de `webDirectory` (por defecto `rootDirectory/web/dist`) después de las rutas `/api` y de su 404, suma el código, el secreto y la clave de firma derivada a los secretos que se redactan en SSE y en los logs. La fecha y la zona de `/api/config` y del mensaje del tope diario salen de `relojDeNegocio` y `zonaDeNegocio` de `agente.wiring.ts`, el mismo calendario del proceso que usan las herramientas (su contrato `execute(args, ctx)` no recibe entorno), así que un `envSource` inyectado no las cambia y la SPA nunca muestra una fecha distinta de la que usan las herramientas, y `startServer` levanta `Bun.serve` en `0.0.0.0:PORT`. |
| `src/server.ts` | (sin sufijo) | Entrada del proceso: deriva la raíz del proyecto de `import.meta.dir` y llama a `startServer`. Con el entorno inválido escribe el motivo y sale con código 1. |

Idioma: `src/http` va en inglés, como infra, porque es un adaptador. El contrato del cable conserva los nombres del PRD (`sessionId`, `message`, `reply`, `toolCalls`, `needsConfirmation`) y los que fijó la usuaria (`accion`, `tipo`, `caso`, `mensaje`).

Direcciones permitidas:

- `http` importa `http`, `loop`, `llm`, dominio, aplicación, la config pura, zod y hono. Nunca importa infra, `config/env.ts`, el wiring del agente ni `node:`.
- `http/wiring/server.wiring.ts` es el tercer composition root. Además de lo anterior puede importar infra, `config/env.ts`, `loop/wiring/agente.wiring.ts` y `node:`. Cualquier otro archivo de `http/wiring/` sigue las reglas de `http`.
- `src/server.ts` solo importa `http/wiring/server.wiring.ts` y `node:`, y no lee el entorno: el puerto llega del `ServerEnv` que parsea el wiring.
- hono solo se importa desde `http` y su wiring. Ninguna capa interior importa `http`.
- `src/server.ts` es la cuarta excepción permitida fuera de una carpeta de rol, porque el PRD (6.5) sugiere ese nombre.

## Capa CLI

Los comandos de línea de comandos viven en la capa `cli`. El guardián de capas de `tests/architecture.test.ts` la declara con sus importaciones permitidas, y cada regla tiene su prueba de violación.

| Carpeta | Sufijo | Rol |
|---|---|---|
| `cli/runners/` | `.runner.ts` | Un comando por archivo, con funciones exportadas que se prueban sin proceso y la entrada del comando bajo `import.meta.main`: el generador de `modulo/` que corre `bun run modulo` (`generar-modulo`). Lee los bytes crudos de `agent/prompt.md` y del conocimiento del proceso, les antepone el frontmatter de OpenCode con el builder `modulo` y escribe `modulo/agent.md` y `modulo/skill/registro-proveedor/SKILL.md`. Se niega a correr fuera de la raíz del proyecto y, si una fuente falta o está vacía, sale con código 1 sin escribir nada. `tests/modulo/generador.test.ts` compara byte a byte lo commiteado con su salida, así que editar el prompt o el conocimiento sin regenerar hace fallar la CI. El pre-flight de la defensa que corre `bun run preflight -- --url <url>` (`preflight`) despierta el servicio pidiendo `GET /api/health` cada 5 s hasta que responda 200 o pasen 180 s, exige el modelo `disponible` y prueba el código de acceso una sola vez con `GET /api/config` y `Authorization: Bearer`: un 401 o un 429 cortan sin reintentar, para no bloquear la IP. Comprueba que la fecha de ejecución sea `2026-09-03` y que esté el caso `ec-corp-andina`, y en este modo nunca abre un turno del chat, así que no gasta tokens del modelo. Con `--guion` corre además el guion del PRD §11 en dos turnos SSE. La URL llega por `--url` o `PREFLIGHT_URL`, y el código solo por `PREFLIGHT_ACCESS_CODE`, leído con `config/env.ts`. El comando no acepta el código como argumento y nunca lo imprime. Cualquier paso fallido imprime una línea en español y sale con código 1. `tests/cli/preflight.test.ts` lo prueba contra un socket real de la app con un proveedor falso. |
| `cli/schemas/` | `.schema.ts` | Validación zod de lo que un comando lee de afuera, con `satisfies z.ZodType<T>` (`preflight`: la salud, la configuración, la lista de archivos y los frames SSE que lee el pre-flight; los objetos no son estrictos, así que un campo de más no rompe la lectura). |
| `cli/types/` | `.type.ts` | Solo tipos, con `import type` (`modulo`: `ArchivoModulo`, `LecturaModulo`, `OpcionesGeneracion` y `ResultadoGeneracion`; `preflight`: `OpcionesPreflight`, `PlazosPreflight`, `ResultadoPreflight`, `UsoGuion` y los frames que el pre-flight lee del SSE). |

Idioma: los identificadores de `src/cli` van en español, como el dominio y la demo.

Direcciones permitidas:

- `cli` importa `cli`, dominio, la config pura, `config/env.ts`, zod, `node:` y el paquete `eventsource-parser`. De `http` solo toma tipos de `http/types/**` con `import type`; nunca rutas, servicios, esquemas ni el wiring del servidor.
- `cli` nunca importa infra, `loop`, `llm`, las herramientas ni hono, y ninguna otra capa importa `cli`.
- Como el resto de `src/`, no usa APIs de shell (`Bun.spawn`, `Bun.$`, `child_process`).

## Módulo reutilizable (`modulo/`)

El PRD (§9.4) pide que las mismas herramientas se puedan montar en otro host de agentes sin el servidor. `modulo/` tiene tres piezas y ninguna es una copia a mano:

| Pieza | De dónde sale | Qué la mantiene igual a la app |
|---|---|---|
| `modulo/agent.md` | `bun run modulo`: frontmatter de OpenCode más los bytes exactos de `agent/prompt.md`. | `tests/modulo/generador.test.ts` compara byte a byte lo commiteado con la salida del generador. |
| `modulo/skill/registro-proveedor/SKILL.md` | `bun run modulo`: frontmatter de la skill más los bytes exactos de `src/knowledge/registro-proveedor.md`. | La misma prueba de bytes de `tests/modulo/generador.test.ts`. |
| `modulo/tools/proveedor.ts` | Una reexportación con nombre de las cinco herramientas de `@/tools/proveedor.ts`, sin copia ni empaquetado. | `tests/modulo/herramientas.test.ts` exige que cada export sea la misma referencia (`===`) que la de la app, que el archivo se importe con el entorno vacío y que `proveedor_simular_envio` siga rechazando una llamada sin `confirmado: true`. |

Reglas del guardián para `modulo/`:

- `modulo/tools/proveedor.ts` es la capa `modulo` de `tests/architecture.test.ts`: solo puede importar `@/tools/proveedor.ts`. Un import de `@/tools/factories/…`, infra, `config/env.ts` o `node:` se reporta.
- En `modulo/` el único `.ts` permitido es `modulo/tools/proveedor.ts` (G5), y cumple el mismo contrato de las cinco herramientas que `src/tools/proveedor.ts` (CAL-04).
- `tsconfig.json` incluye `modulo`, así que `tsc` lo comprueba, y `tests/sin-comentarios.test.ts` también lo recorre.
- Ninguna capa de `src/` importa `modulo/`.

### Enlace de OpenCode (`.opencode/` y `opencode.json`)

OpenCode solo carga herramientas desde `.opencode/tools/` y agentes en markdown desde `.opencode/agents/`, así que el repo agrega dos archivos que apuntan a `modulo/` sin duplicarlo:

| Archivo | Qué hace | Qué lo prueba |
|---|---|---|
| `.opencode/tools/proveedor.ts` | Reexporta con nombre las cinco herramientas de `@modulo/tools/proveedor.ts`. OpenCode nombra cada export `<archivo>_<export>`, así que expone los mismos `proveedor_<export>` que el servidor. | `tests/modulo/herramientas.test.ts`: misma referencia que la app, importación con el entorno vacío y nombres iguales a `NOMBRE_VISIBLE`. |
| `opencode.json` | Declara `$schema`, `default_agent: "registro-proveedor"`, `skills: ["./modulo/skill"]` y el agente `registro-proveedor` con `prompt` `{file:./modulo/agent.md}` y la misma descripción, el mismo modo y los mismos permisos que el frontmatter de `modulo/agent.md`. | `tests/modulo/opencode.test.ts`: esquema estricto, igualdad con el frontmatter y con `TEXTO_MODULO.descripcionAgente`, y existencia de cada ruta. |

- `.opencode/tools/proveedor.ts` es la capa `opencode` del guardián: solo puede importar `@modulo/…`. Un import directo de `@/tools/proveedor.ts` se reporta, así que `.opencode/` nunca se salta `modulo/`.
- El alias `@modulo/*` → `./modulo/*` vive en `tsconfig.json` y en la tabla de alias del guardián. Solo lo usa `.opencode/`.
- `tsconfig.json` incluye `.opencode/**/*.ts` con el glob explícito, porque `tsc` ignora una carpeta que empieza con punto si se nombra sola. El guardián y `tests/sin-comentarios.test.ts` la recorren con su propio patrón `.opencode/**/*.ts`.
- `modulo/README.md` explica cómo montar el módulo y sus límites: fuera del servidor nadie escribe la pregunta de confirmación (D-80), y el formato se verificó contra la documentación de OpenCode sin ensayarlo en vivo (D-83).

## Front web (`web/`)

El chat del navegador vive en `web/` (Vite + React) y tiene su propio guardián, `tests/arquitectura-web.test.ts` (W1–W13), con una prueba de violación por regla. `tests/sin-comentarios.test.ts` también recorre `web/**/*.{ts,tsx,css}` y `web/index.html`, sin contar `web/dist`.

| Carpeta | Sufijo | Rol |
|---|---|---|
| `web/src/api/` | `.ts` | Cliente del servidor: `cliente-api` (`obtenerConfig` y `entrar`, que convierten todo 401 en "acceso vencido" y el resto de rechazos en el `mensaje` del servidor), el `POST /api/chat` leído como SSE (`flujo-chat`) `obtenerSesion` (`GET /api/sessions/:id`, que valida la forma de la vista antes de usarla), `obtenerSesionAsentada` (la misma vista con un solo reintento tras `REINTENTO_OCUPADA_MS` si el servidor todavía la marca `ocupada`, para Detener y Recargar conversación) y el `sessionId` en `localStorage` (`sesion-local`: `leerSesionGuardada`, `guardarSesionId` y `olvidarSesion`; es el único módulo que puede tocarlo y nunca guarda el código de acceso). Los archivos de cada caso salen de `listarArchivos` (`GET /api/casos/:caso/archivos`, validada), y `descargarArchivo` pide el archivo real por la ruta de la lista blanca para poder ver un 404 antes de guardarlo; el guardado en el equipo (`descarga-local`: un enlace temporal con `download` y una URL de objeto que se libera después) es lo único que toca el `document`. `obtenerVistaPrevia` valida la tabla enmascarada o el texto que manda el servidor. |
| `web/src/state/` | `.ts` | Reductores puros alimentados por los eventos SSE y las acciones de la UI (`conversacion`), y `hidratacion`: `estadoDesdeVista` pliega la vista de `GET /api/sessions/:id` en la misma línea de tiempo, tarjetas de resultado y de confirmación y progreso que arma el stream, reusando `reducirConfirmaciones`. No importan React ni tocan `document`, `window`, `localStorage` ni `fetch`. |
| `web/src/hooks/` | `.ts` | Hooks de React que conectan el estado con el navegador (`usar-chat`: el reductor de la conversación y el envío, que solo sale de una acción de la usuaria y nunca de un efecto; también carga la vista de la sesión cuando el estado pide hidratar, y expone Detener, Recargar conversación y Nueva sesión) y `usar-archivos` (`useArchivos`: la lista de archivos de un caso, pedida al expandir su bloque y después de cada turno terminado que tocó el caso; recuerda si un archivo respondió 404) y `usar-reintento-config` (`useReintentoConfig`: si `/api/config` falló justo después de entrar, la vuelve a pedir cada `REINTENTO_CONFIG_MS` y al volver a la pestaña hasta que llega o el acceso vence). El nombre exportado empieza con `use` (`useChat`) aunque el archivo esté en español, porque React y la regla `useHookAtTopLevel` de Biome reconocen los hooks solo por ese prefijo. |
| `web/src/components/` | `.tsx` y `.module.css` | Componentes de la UI-SPEC con su módulo CSS: los avisos `AvisoError` (`role="alert"`) y `AvisoSistema` (`role="status"`) en `aviso`, más `PantallaAcceso` (el código vive solo en el estado del componente y nunca en el almacenamiento del navegador), `Encabezado` (con la fecha de ejecución de `/api/config`), `LineaDeTiempo`, `MensajeUsuaria`/`MensajeAgente` (`mensaje`), `IndicadorPensando` `ListaArchivos` (`lista-archivos`: una fila por archivo existente en disco con "Ver" y "Descargar", con su nombre accesible), `DialogoVistaPrevia` (`dialogo-vista-previa`: `<dialog>` modal con la tabla enmascarada o el texto plano del `.md`, todo como texto de React; el foco vuelve a "Ver" al cerrar), `AvisoDiscoEfimero` (`aviso-disco-efimero`: el aviso de D-67 con el chip que manda "procesa el caso {caso}" por el envío normal del chat; nada se regenera solo) y `DialogoNuevaSesion` (`dialogo-nueva-sesion`: `<dialog>` modal con el foco inicial en "Seguir en esta sesión" y el único botón destructivo de la UI). |
| `web/src/components/icons/` | `.tsx` | El set cerrado de íconos SVG en línea (`iconos`): `check`, `x`, `alerta`, `chevron`, `descargar`, `ojo`, `reloj`, `girando` e `info`, a 16 y 20 px, con `stroke: currentColor` y `aria-hidden`. |
| `web/src/config/` | `strings.ts` | Única fuente de los textos propios del front. Los mensajes del servidor no se duplican: se muestran tal como llegan. La única copia que también existe en el servidor es la de acceso vencido, que la UI-SPEC asigna al front y se usa solo si un 401 llega sin `mensaje` legible. |
| `web/src/config/constants/` | `.constants.ts` | Constantes del front (`ui`: acciones de la UI, tecla de envío, tamaño de los íconos). Las regex irían solo en `patterns.constants.ts`. |
| `web/src/types/` | `.type.ts` | Solo tipos, con `import type` (`chat`, `ui`). |
| `web/src/styles/` | `.css` | `tokens.css`, con todas las variables de la UI-SPEC (espaciado, tipografía, colores, radios, bordes, tamaños fijos, foco y fuentes), y `global.css` (layout de `100dvh` sin scroll del `body`, `.sr-only`, transiciones de 150 ms y `prefers-reduced-motion`). |
| `web/src/main.tsx`, `web/src/app.tsx` | (sin sufijo) | Los dos únicos archivos sueltos: la entrada que monta React e importa los estilos, y la pantalla. |

Direcciones permitidas:

- Solo los alias `@web/` (`web/src/`) y `@/` (`src/`), nunca `./` ni `../`. Paquetes: `react`, `react-dom` y `eventsource-parser`.
- `@/` llega a `src/config/constants/**` y `src/config/types/**`, y con `import type` a `src/http/types/**`. Nada más de `src/`: el bundle es público y no puede arrastrar `src/config/strings.ts`, el entorno ni secretos. Por la misma razón `import.meta.env` está prohibido.
- El texto del modelo y del servidor se pinta como nodo de texto de React con `white-space: pre-wrap`. Nunca `dangerouslySetInnerHTML`, `innerHTML` ni markdown.
- `sessionStorage` está prohibido y `localStorage` solo vive en `web/src/api/sesion-local.ts`.
- Los `*.module.css` no llevan colores hex, `rgb()` ni `px` sueltos: todo valor sale de un `var(--…)` de `tokens.css`.

Idioma: los identificadores del front van en español, con los nombres de componente de la UI-SPEC.

## Esquemas

Cada `export const …Schema` de `schemas/*.schema.ts` se comprueba con `satisfies z.ZodType<T>` contra un tipo escrito a mano en `types/`, que es la fuente de verdad (G16). Los `args*` de `tools/schemas/argumentos.schema.ts` son formas crudas (`ZodRawShape`) del contrato de herramientas y no entran. Los `z.enum` se construyen desde su constante (`z.enum(X)` o `Object.values(X)`), nunca enumerando sus miembros (G15).

## Pruebas unitarias

`tests/unit/` es plana y cada archivo se llama `<módulo>.<rol>.test.ts`, espejo de un `src/**/<módulo>.<rol>.ts`. La carpeta no se anida porque varias pruebas resuelven fixtures con `new URL("../../…", import.meta.url)`. Las pruebas de contrato, golden y e2e se nombran por escenario.

## Dobles del modelo en las pruebas

Hay dos LLM falsos porque prueban capas distintas:

- `crearAdaptadorGuion` (`tests/helpers/adaptador-guion.helper.ts`) prueba los decoradores de `llm`. Cada paso es un `ResultadoEnvio` o una función de las `OpcionesEnvio`, para simular errores, esperas y abortos por señal. Repite el último paso y registra las opciones de cada llamada. Trae dos pares proveedor y modelo (primario y respaldo) porque `withFallback` cambia de uno a otro.
- `crearLlmFalso` (`tests/helpers/llm-falso.helper.ts`) prueba el bucle. Cada paso es una `RespuestaLlm` (o un `ErrorLlm`) que puede construirse con los mensajes previos, para encadenar herramientas reales con sus resultados. Guarda una copia de los mensajes de cada pedido y falla si el guion se agota.

Las utilidades comunes de eventos (`recoger`, `inicioDe`, `sesionDe`, `SIMULAR`) viven en `tests/helpers/eventos.helper.ts`.

Los escáneres que comparten los guardianes viven en `tests/helpers/escaner-fuentes.helper.ts` (importaciones con su `import type`, literales de texto, regex, enums y tipos exportados) y `tests/helpers/comentarios.helper.ts` (comentarios de TS y TSX, de CSS y de HTML). Así `tests/architecture.test.ts`, `tests/arquitectura-web.test.ts` y `tests/sin-comentarios.test.ts` aplican la misma lectura del código.
