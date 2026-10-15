# Estructura de `src/`

Cada archivo vive en la carpeta de su rol y lleva el sufijo de ese rol. `tests/architecture.test.ts` lo exige con G5 (tabla de sufijos por carpeta), G13 (ningún archivo suelto en `src/` ni en la raíz de una capa) y G14 (cada prueba unitaria es espejo de un módulo).

## Roles del dominio

| Carpeta | Sufijo | Rol |
|---|---|---|
| `domain/engines/` | `.engine.ts` | Algoritmo central que conduce un flujo: el mapeo de etiquetas (`mapeo`) y el motor de plantillas (`motor-plantillas`). |
| `domain/builders/` | `.builder.ts` | Arma una estructura de salida con datos ya decididos: formulario (`formulario`), checklist (`checklist`), borrador (`borrador`), portal (`portal`), índice del glosario (`glosario`), campo presentado (`campo-presentado`) y texto de cierre del turno con la pregunta de confirmación (`cierre-turno`). |
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
| `llm/decorators/` | `.decorator.ts` | Envoltorios sobre un `AdaptadorLlm`: resiliencia (`timeout`, reintentos en `retry` y respaldo en `fallback`) y aviso de cada fallo al observador del turno (`observation`). |
| `llm/mappers/` | `.mapper.ts` | Traducción entre el modelo neutral y el formato del proveedor, y de estados HTTP a errores tipados. |
| `loop/types/` | `.type.ts` | Eventos del turno, sesión, estado y dependencias del turno, registro de herramientas y lectura tolerante del resultado de una herramienta. |
| `loop/schemas/` | `.schema.ts` | Lectura tolerante del resultado JSON de una herramienta. |
| `loop/services/` | `.service.ts` | El bucle del agente, un generador de eventos tipados: orquestación del turno (`ejecutar-turno`), conversación con el modelo (`conversacion-turno`), pasos de herramientas (`paso-herramientas`), despacho con la compuerta (`despacho-llamada`), cierres por error o aborto (`cierre-error`), cierre con la compuerta (`cierre-turno`), guardado de la sesión (`guardado-turno`), bitácora (`bitacora-turno`), presupuesto de tokens (`presupuesto`), tope de iteraciones (`tope-iteraciones`), respuesta no streaming (`respuesta-turno`) y registro de herramientas `proveedor_<export>` (`registro-herramientas`). |
| `loop/wiring/` | `.wiring.ts` | `agente.wiring.ts`, el composition root del agente: lee el entorno y arma adaptadores, sesiones e instrucciones. |

Idioma: `loop` va en español. En `llm`, el puerto neutral (`llm.type.ts`) va en español porque lo consume el bucle; el protocolo del proveedor (`provider.type.ts`, `adapters/`, `mappers/`, `schemas/`) y los decoradores (`decorators/` y `resilience.type.ts`) van en inglés, como infra. Un archivo en inglés sigue usando los miembros en español del puerto (`enviar`, `proveedor`, `rol`).

Direcciones permitidas:

- `llm` solo importa `llm`, la config pura y zod. No conoce el dominio, el bucle, infra ni `node:`.
- `loop` importa `loop`, `llm`, dominio, aplicación, los tipos de las herramientas, la config pura y zod. Nunca importa infra, `config/env.ts` ni `tools/proveedor.ts`: el módulo de herramientas le llega inyectado.
- `loop/wiring/agente.wiring.ts` es el segundo composition root. Además de lo anterior puede importar infra, `config/env.ts` y `tools/proveedor.ts`. Cualquier otro archivo de `loop/wiring/` sigue las reglas de `loop`.
- pino solo se importa desde infra.
- `config/env.ts` lo importan infra, tools, demo, `loop/wiring/agente.wiring.ts` y `http/wiring/server.wiring.ts`.

## Capa HTTP

La API agrega la capa `http` y la entrada del proceso `src/server.ts`. El guardián de capas de `tests/architecture.test.ts` las declara con sus importaciones permitidas, y cada regla tiene su prueba de violación.

| Carpeta | Sufijo | Rol |
|---|---|---|
| `http/routes/` | `.route.ts` | Una ruta Hono por recurso: salud del servicio sin acceso y sin llamar al modelo (`health`) y el turno del chat por SSE con latido, timeout de inactividad desactivado, corte al cerrar la pestaña y respaldo JSON del PRD §6.4 (`chat`), y la entrada con el código compartido, comparado en tiempo constante, que responde con la cookie firmada `HttpOnly; Secure; SameSite=Strict; Path=/api` (`access`). |
| `http/middlewares/` | `.middleware.ts` | Middlewares Hono que se aplican antes de las rutas: la IP real del cliente, resuelta una vez por pedido en la variable de contexto `clientIp` con un log de depuración que registra solo cuántas entradas trae `X-Forwarded-For` y los saltos configurados, nunca una dirección (`client-ip`), y la guardia de acceso de todo `/api` salvo health y la entrada, que acepta la cookie firmada y vigente o `Authorization: Bearer` con el código, comparado en tiempo constante, y responde 429 al cliente bloqueado por intentos fallidos (`access`). |
| `http/services/` | `.service.ts` | Lógica HTTP pura, sin Hono, que las rutas reutilizan: proyección de cada evento del bucle a un frame SSE redactado y el temporizador del latido (`sse`), la emisión y la validación del token de acceso `v1.<vence en ms>` con el reloj inyectado (`access-token`), la IP del cliente tomada de `X-Forwarded-For` contando `TRUSTED_PROXY_HOPS` desde la derecha, con el socket como respaldo (`client-ip`), y el contador de ventana fija por clave, con reloj inyectado y limpieza de ventanas vencidas, que corta los intentos fallidos de acceso (`rate-limiter`). |
| `http/schemas/` | `.schema.ts` | Validación zod de los cuerpos que recibe la API, con `satisfies z.ZodType<T>`: el del chat (`chat-body`) y el de la entrada (`access-body`). |
| `http/types/` | `.type.ts` | El contrato del cable (`api.type.ts`, que el front importa con `import type`) y los tipos del servidor (`server.type.ts`: `HttpBindings`, `HttpEnv`, `ServerOptions`, `ServerCreation`, `AccessSettings`, `RateLimiter` y los datos de la IP del cliente). |
| `http/wiring/` | `.wiring.ts` | `server.wiring.ts`, el tercer composition root: lee `ServerEnv` (puerto, `NODE_ENV`, `ACCESS_CODE`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_TTL_HOURS`, `TRUSTED_PROXY_HOPS`, `ACCESS_MAX_FAILED_ATTEMPTS` y `ACCESS_FAILED_WINDOW_MINUTES`; en desarrollo, sin secreto, genera uno efímero de 256 bits; en producción lo exige y en todo entorno lo rechaza si repite el código o la clave del modelo), arma el agente con `crearAgente` y la app Hono, suma el código y el secreto a los secretos que se redactan en SSE y en los logs, y `startServer` levanta `Bun.serve` en `0.0.0.0:PORT`. |
| `src/server.ts` | (sin sufijo) | Entrada del proceso: deriva la raíz del proyecto de `import.meta.dir` y llama a `startServer`. Con el entorno inválido escribe el motivo y sale con código 1. |

Idioma: `src/http` va en inglés, como infra, porque es un adaptador. El contrato del cable conserva los nombres del PRD (`sessionId`, `message`, `reply`, `toolCalls`, `needsConfirmation`) y los que fijó la usuaria (`accion`, `tipo`, `caso`, `mensaje`).

Direcciones permitidas:

- `http` importa `http`, `loop`, `llm`, dominio, aplicación, la config pura, zod y hono. Nunca importa infra, `config/env.ts`, el wiring del agente ni `node:`.
- `http/wiring/server.wiring.ts` es el tercer composition root. Además de lo anterior puede importar infra, `config/env.ts`, `loop/wiring/agente.wiring.ts` y `node:`. Cualquier otro archivo de `http/wiring/` sigue las reglas de `http`.
- `src/server.ts` solo importa `http/wiring/server.wiring.ts` y `node:`, y no lee el entorno: el puerto llega del `ServerEnv` que parsea el wiring.
- hono solo se importa desde `http` y su wiring. Ninguna capa interior importa `http`.
- `src/server.ts` es la cuarta excepción permitida fuera de una carpeta de rol, porque el PRD (6.5) sugiere ese nombre.

## Front web (`web/`)

El chat del navegador vive en `web/` (Vite + React) y tiene su propio guardián, `tests/arquitectura-web.test.ts` (W1–W13), con una prueba de violación por regla. `tests/sin-comentarios.test.ts` también recorre `web/**/*.{ts,tsx,css}` y `web/index.html`, sin contar `web/dist`.

| Carpeta | Sufijo | Rol |
|---|---|---|
| `web/src/api/` | `.ts` | Cliente del servidor: el `POST /api/chat` leído como SSE (`flujo-chat`) y, desde el plan 03-25, el `sessionId` en `localStorage` (`sesion-local`, el único módulo que puede tocarlo). |
| `web/src/state/` | `.ts` | Reductores puros alimentados por los eventos SSE y las acciones de la UI (`conversacion`). No importan React ni tocan `document`, `window`, `localStorage` ni `fetch`. |
| `web/src/hooks/` | `.ts` | Hooks de React que conectan el estado con el navegador. |
| `web/src/components/` | `.tsx` y `.module.css` | Componentes de la UI-SPEC con su módulo CSS: los avisos `AvisoError` (`role="alert"`) y `AvisoSistema` (`role="status"`) en `aviso`. |
| `web/src/components/icons/` | `.tsx` | El set cerrado de íconos SVG en línea (`iconos`): `check`, `x`, `alerta`, `chevron`, `descargar`, `ojo`, `reloj`, `girando` e `info`, a 16 y 20 px, con `stroke: currentColor` y `aria-hidden`. |
| `web/src/config/` | `strings.ts` | Única fuente de los textos propios del front. Los mensajes del servidor no se duplican: se muestran tal como llegan. |
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
