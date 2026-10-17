---
phase: 03-chat-web-api-sse-y-despliegue
plan: 02
subsystem: api
tags: [hono, sse, bun-serve, streamSSE, eventsource-parser, zod, redaccion]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "createServer/startServer, ServerOptions.heartbeatMs, HttpBindings, RUTA_API, RESPUESTA_HTTP (03-01)"
  - phase: 02-agente-conversacional
    provides: "Agente.turno como AsyncGenerator<EventoAgente>, respuestaDeTurno, redactar, createLogger, dobles crearFetchFalso"
provides:
  - "POST /api/chat por SSE: c.env.timeout(req, 0), latido ': ping' cada LATIDO_SSE_MS, corte del turno con stream.onAbort, cabeceras anti-buffering parchadas en la Response"
  - "Respaldo JSON del PRD 6.4 con Accept: application/json: { sessionId, reply, toolCalls, needsConfirmation } plegado con respuestaDeTurno"
  - "notFound y onError globales en server.wiring con { mensaje } de MENSAJE_HTTP; el error solo va a pino con redacción"
  - "toSseFrame (evento redactado → frame) y startHeartbeat en http/services/sse.service.ts"
  - "chatBodySchema estricto con satisfies z.ZodType<ChatBody>"
  - "secretosDelAgente(config) exportado desde loop/wiring/agente.wiring.ts"
  - "Helper de pruebas crearServidorPrueba, BINDINGS_PRUEBA, cabecerasPrueba, leerSse (eventos, comentarios y secuencia), eventosSse, eventoDeFrame, inicioDeFrames"
  - "Constantes RUTA_API.CHAT, LATIDO_SSE_MS, COMENTARIO_LATIDO, CABECERA, VALOR_CABECERA, TIPO_CONTENIDO, EVENTO_HTTP y textos MENSAJE_HTTP"
affects: [03-03, 03-04, 03-05, 03-09, 03-12, 03-14]

actuals:
  tokens: 8545
  tasks: 2
  commits: 3
plan_head_before: d6078f94f355cf19d1cdc1f105cc1c4df82ad161
plan_head_after: 405bce2ce2712fb097e8990afacba2feec0c12e8

tech-stack:
  added: []
  patterns:
    - "streamSSE sin onError: try/catch/finally propio que escribe solo MENSAJE_HTTP.errorInterno y registra el error en pino"
    - "Cabeceras de SSE parchadas sobre la Response que devuelve streamSSE, porque streamSSE pisa Cache-Control"
    - "Negociación por Accept en la misma ruta: SSE por defecto, JSON solo si Accept pide application/json sin text/event-stream"
    - "Pruebas de idle timeout, latido y aborto sobre un Bun.serve real en puerto efímero con idleTimeout 1 s"
    - "Toda prueba HTTP arma el servidor con crearServidorPrueba; acceso y variables nuevas se agregan solo ahí"

key-files:
  created:
    - src/http/routes/chat.route.ts
    - src/http/services/sse.service.ts
    - src/http/schemas/chat-body.schema.ts
    - tests/helpers/servidor-prueba.helper.ts
    - tests/helpers/types/servidor-prueba.type.ts
    - tests/http/chat.test.ts
    - tests/http/stream.test.ts
  modified:
    - src/config/constants/http.constants.ts
    - src/config/strings.ts
    - src/loop/wiring/agente.wiring.ts
    - src/http/wiring/server.wiring.ts
    - src/http/types/api.type.ts
    - docs/estructura.md
    - tests/http/salud.test.ts

key-decisions:
  - "El orden de eventos que fija chat.test.ts es el real del bucle (turn_start, usage, tool_start, tool_end, usage, text, turn_end): el bucle emite un usage por cada llamada al modelo"
  - "El respaldo JSON también pasa por redactar con los secretos del agente, igual que cada frame SSE"
  - "El logger http se arma en server.wiring con el nivel y los secretos del AgentEnv (secretosDelAgente), sin duplicar la lógica del wiring del agente"
  - "EVENTO_HTTP (http_stream_failed, http_unhandled_error) nombra los eventos de bitácora de la capa http en http.constants.ts"
  - "crearServidorPrueba lanza si createServer falla, pasa un wait sin espera para no dormir en los reintentos y acepta latidoMs y destinoLogs"

patterns-established:
  - "Un error HTTP siempre responde { mensaje } desde MENSAJE_HTTP; el detalle solo queda en pino redactado"
  - "Los eventos SSE se llaman como los valores de TIPO_EVENTO y su data es el JSON redactado del evento en una sola línea"

requirements-completed: [API-01]

coverage:
  - id: D1
    description: "POST /api/chat transmite por SSE los eventos del bucle en orden, redactados, con Content-Type text/event-stream, Cache-Control no-cache, no-transform y X-Accel-Buffering no, y un segundo POST con el sessionId continúa la sesión"
    requirement: API-01
    verification:
      - kind: integration
        ref: "tests/http/chat.test.ts#transmite los eventos del bucle en orden, redactados y con las cabeceras anti-buffering"
        status: pass
    human_judgment: false
  - id: D2
    description: "Con idleTimeout de 1 s y 2,5 s de silencio del proveedor, el SSE y el respaldo JSON igual terminan; el latido ': ping' aparece antes de turn_end"
    requirement: API-01
    verification:
      - kind: integration
        ref: "tests/http/stream.test.ts#con idleTimeout de 1 s y 2,5 s de silencio del proveedor el SSE igual termina con turn_end"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#con idleTimeout de 1 s y 2,5 s de silencio el respaldo JSON también completa"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#escribe un comentario de latido mientras el turno espera al proveedor"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cerrar la conexión del cliente aborta el pedido colgado al proveedor en menos de 500 ms y el servidor sigue atendiendo la misma sesión"
    requirement: API-01
    verification:
      - kind: integration
        ref: "tests/http/stream.test.ts#cerrar la conexión del cliente aborta el pedido colgado al proveedor y el servidor sigue atendiendo"
        status: pass
    human_judgment: false
  - id: D4
    description: "El respaldo JSON del PRD 6.4 da el mismo reply, toolCalls y needsConfirmation que el SSE plegado, y su sessionId continúa la sesión"
    requirement: API-01
    verification:
      - kind: integration
        ref: "tests/http/stream.test.ts#un mismo turno da igual reply, toolCalls y needsConfirmation por SSE y por JSON"
        status: pass
    human_judgment: false
  - id: D5
    description: "La ñ, las tildes, el ¿ y un salto de línea llegan intactos; un cuerpo no JSON, un mensaje de solo espacios o un campo extra dan 400 { mensaje } sin llamar al proveedor"
    requirement: API-01
    verification:
      - kind: integration
        ref: "tests/http/stream.test.ts#ñ, tildes, ¿ y un salto de línea llegan intactos tras JSON.parse de la línea data:"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#un cuerpo que no es JSON responde 400 con mensaje en español y sin llamar al proveedor"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#un mensaje de solo espacios responde 400 con mensaje en español y sin llamar al proveedor"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#un campo extra responde 400 con mensaje en español y sin llamar al proveedor"
        status: pass
    human_judgment: false
  - id: D6
    description: "Una excepción dentro del stream llega solo como frame error genérico; las rutas /api desconocidas dan 404 y cualquier excepción da 500, ambos con { mensaje } en español y sin el texto interno, registrado en pino"
    verification:
      - kind: integration
        ref: "tests/http/stream.test.ts#una excepción dentro del stream llega solo como un frame error con el mensaje genérico"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#una ruta /api desconocida responde 404 con mensaje en español"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#una excepción en cualquier ruta responde 500 con mensaje genérico y sin la pila"
        status: pass
    human_judgment: false
  - id: D7
    description: "salud.test.ts quedó sobre crearServidorPrueba conservando todas las aserciones de 03-01"
    verification:
      - kind: integration
        ref: "tests/http/salud.test.ts (4 pruebas)"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-10-14
status: complete
---

# Phase 03 Plan 02: Tracer del chat por SSE con respaldo JSON Summary

**`POST /api/chat` lleva el `AsyncGenerator<EventoAgente>` del bucle al cable como frames SSE redactados, con el idle timeout de Bun desactivado, un latido `: ping`, corte del turno al cerrar la conexión y cabeceras anti-buffering. Con `Accept: application/json` el mismo turno se pliega con `respuestaDeTurno` al shape del PRD 6.4, y los 404 y 500 globales responden `{ mensaje }` en español.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-14T23:16:33Z
- **Completed:** 2026-10-14T23:25:27Z
- **Tasks:** 2 (1 tracer + 1 TDD)
- **Files modified:** 14

## Accomplishments

- El tracer cruza todas las capas: el cliente hace POST, pasa por el zod estricto, `agente.turno`, `toSseFrame` y `redactar`, y vuelve como `stream.writeSSE`. Además vuelve a correr sobre el mismo `sessionId`.
- La prueba con `Bun.serve` real e `idleTimeout: 1` muestra que 2,5 s de silencio del proveedor ya no cortan el turno, ni por SSE ni por JSON. Eso evita que un aborto espurio borre las confirmaciones pendientes.
- Cerrar la conexión del cliente aborta el pedido colgado al proveedor en menos de 500 ms, y la misma sesión vuelve a responder normalmente.
- Contención de errores: `streamSSE` no recibe `onError`. El `try/catch` propio escribe solo `MENSAJE_HTTP.errorInterno`, y los `notFound` y `onError` globales nunca devuelven el texto interno.
- Un solo helper (`crearServidorPrueba`) arma todos los servidores de prueba. Los planes de acceso y topes cambian solo sus valores por defecto.

## Task Commits

1. **Task 1: Tracer, un mensaje del chat llega al agente por HTTP y vuelve como eventos SSE en vivo.** `d5869f1` (feat)
2. **Task 2: El stream aguanta el silencio, las desconexiones y las fallas, más el respaldo JSON (TDD).**
   - RED: `05c1d42` (test)
   - GREEN: `405bce2` (feat)
   - REFACTOR: no hizo falta.

**Plan metadata:** commit `docs(03-02)` con este SUMMARY, STATE, ROADMAP y REQUIREMENTS.

## Files Created/Modified

- `src/http/routes/chat.route.ts`: `registerChatRoute`. Hace timeout 0, valida el cuerpo, negocia por `Accept`, arma el SSE con latido, corte y su propio try/catch, y el respaldo JSON con `respuestaDeTurno`.
- `src/http/services/sse.service.ts`: `toSseFrame`, `heartbeatComment` y `startHeartbeat`, que se traga el rechazo de una escritura sobre un stream ya cerrado.
- `src/http/schemas/chat-body.schema.ts`: `chatBodySchema` estricto (`sessionId` hasta `LONGITUD_MAXIMA_SESION` o null, `message` recortado y no vacío).
- `src/http/types/api.type.ts`: `ChatBody`, `ErrorResponse`, `VisibleToolCall`, `ChatJsonResponse`, `SseEvent` y `SseFrame`.
- `src/http/wiring/server.wiring.ts`: logger http con `secretosDelAgente`, `notFound` y `onError` globales, y registro del chat con `heartbeatMs ?? LATIDO_SSE_MS`.
- `src/loop/wiring/agente.wiring.ts`: `secretosDelAgente(config)` exportado, sin cambio de comportamiento.
- `src/config/constants/http.constants.ts`: `RUTA_API.CHAT`, `LATIDO_SSE_MS`, `COMENTARIO_LATIDO`, `CABECERA`, `VALOR_CABECERA`, `TIPO_CONTENIDO` y `EVENTO_HTTP`.
- `src/config/strings.ts`: `MENSAJE_HTTP` (`cuerpoInvalido`, `errorInterno`, `rutaNoEncontrada`).
- `docs/estructura.md`: nombra `chat` (http/routes) y `sse` (http/services).
- `tests/helpers/servidor-prueba.helper.ts` y `tests/helpers/types/servidor-prueba.type.ts`: el helper compartido.
- `tests/http/chat.test.ts`: el tracer de orden, cabeceras, redacción y continuidad de sesión.
- `tests/http/stream.test.ts`: idle timeout, latido, aborto, invariante SSE/JSON, codificación, 400, frame de error, 404 y 500.
- `tests/http/salud.test.ts`: migrado al helper.

## TDD (Task 2)

- **RED (`05c1d42`):** se escribieron las 12 pruebas de `stream.test.ts`. Fallaron las 4 objetivo, cada una en la aserción del comportamiento planeado. Las dos del respaldo JSON fallaron porque el cuerpo era SSE (`JSON Parse error: Unexpected identifier "event"`, y en la otra `Content-Type` no empezaba por `application/json`). La del 404 falló porque Hono respondía su texto por defecto (`JSON Parse error`), y la del 500 porque Hono respondía `Internal Server Error`. La evidencia quedó en un reporte JUnit de `bun test --reporter=junit` con 4 `<failure>`, fuera del repo. **Evaluación semántica:** cada prueba objetivo se ejecutó y falló en su aserción, no por imports, sintaxis ni fixtures. Las otras 8 (idle timeout del SSE, aborto, latido, codificación, los tres 400 y el frame de error) ya pasaban, porque el tracer de la tarea 1 construyó ese comportamiento a propósito (el `<action>` de la tarea 1 lo pedía literal).
- **GREEN (`405bce2`):** se agregaron la negociación por `Accept`, `jsonTurn` con `respuestaDeTurno` y `redactar`, y los `notFound`/`onError` globales. 13/13 en `stream.test.ts` + `chat.test.ts`.
- **REFACTOR:** no hizo falta.

## Decisions Made

- La secuencia exacta del tracer es la del bucle (`turn_start, usage, tool_start, tool_end, usage, text, turn_end`). La verdad del plan enumeraba los tipos de evento sin fijar dónde va cada `usage`. La prueba fija el orden real, que es lo que exige "in loop order".
- El respaldo JSON también se redacta (defensa en profundidad para T-03-03).
- Los nombres de los eventos de bitácora de la capa http viven en `EVENTO_HTTP` y no como literales sueltos.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prueba de aborto que cerraba la conexión antes del pedido colgado**
- **Found during:** Task 2 (RED)
- **Issue:** la primera versión hacía `break` del `for await` al ver `tool_start`. Eso cancelaba el cuerpo, cerraba la conexión y abortaba el turno antes del segundo pedido al proveedor, así que la prueba fallaba por diseño propio y no por falta de comportamiento.
- **Fix:** el stream se consume en segundo plano, la prueba espera el pedido colgado con `esperarPedidos` y recién entonces aborta el cliente.
- **Files modified:** tests/http/stream.test.ts
- **Verification:** la prueba pasa y observa `signal.aborted` dentro de 500 ms.
- **Committed in:** 05c1d42

**2. [Rule 3 - Blocking] Tipos de prueba en el commit RED**
- **Found during:** Task 2 (RED → GREEN)
- **Issue:** `tsc` rechazaba `eventosSse(cuerpo: ReadableStream<Uint8Array>)` contra `TextDecoderStream` y la asignación de `respuesta.json()` (`unknown`) a `ChatJsonResponse`.
- **Fix:** el parámetro pasó a `NonNullable<Response["body"]>` y el cuerpo se lee con `JSON.parse(await respuesta.text())`.
- **Files modified:** tests/helpers/servidor-prueba.helper.ts, tests/http/stream.test.ts
- **Committed in:** 405bce2

**3. [Rule 2 - Missing critical] El 500 global también se prueba en la bitácora**
- **Found during:** Task 2 (GREEN)
- **Issue:** el plan exige que `onError` registre el error por el logger http (T-03-01), pero ninguna prueba lo verificaba.
- **Fix:** `crearServidorPrueba` acepta `destinoLogs`. La prueba del 500 comprueba la línea `http_unhandled_error` y que la clave no aparece en los logs.
- **Files modified:** tests/helpers/servidor-prueba.helper.ts, tests/helpers/types/servidor-prueba.type.ts, tests/http/stream.test.ts
- **Committed in:** 405bce2

---

**Total deviations:** 3 auto-fixed (1 bug de prueba, 1 bloqueante de tipos, 1 cobertura crítica)
**Impact on plan:** todos son de pruebas o de cobertura; el código de producción sigue el plan. La tarea 2 tocó el helper de pruebas, que no estaba en su lista `<files>`, porque el plan lo define como el único lugar que se extiende.

## Issues Encountered

- En la tarea 1 el guion del fetch falso recibía cuerpos sueltos en lugar de `{ cuerpo }` y el turno terminaba en `PROVEEDOR_SIN_CONEXION`. Se corrigió la prueba antes del commit.
- El criterio "Bun.serve with idleTimeout set to 1" se cumple a través de la constante `IDLE_TIMEOUT_S = 1` (`idleTimeout: IDLE_TIMEOUT_S`), no con el literal.
- **Smoke manual con gasto real (para que la usuaria lo sepa):** se levantó `bun src/server.ts` con `LLM_BASE_URL=http://127.0.0.1:9`, para que el primario no tuviera salida, y se corrió `curl -N`. Bun cargó el `.env` local (no se leyó su contenido; solo se comprobó que existe) y el turno igual llegó a un proveedor real. Lo más probable es que fuera el respaldo configurado en ese `.env`. Fue un turno corto, con un gasto mínimo de tokens de la clave de la usuaria. El resultado confirma el streaming en vivo: `turn_start, usage, tool_start, tool_end, usage, text, turn_end` llegaron en ese orden. Un cuerpo de solo espacios dio 400 y `/api/nada` dio 404, los dos con `{ mensaje }` en español. El proceso quedó detenido.

## Tracer feedback gate

Fila 3 de la cadena: modo interactivo, `human_verify_mode: end-of-phase` y `<verify>` solo con `<automated>`. La verificación se volvió a correr completa después del commit `d5869f1`. `bun test tests/http/chat.test.ts tests/http/salud.test.ts tests/architecture.test.ts tests/sin-comentarios.test.ts` dio 80 pass y 0 fail, y `bun run check` salió con 0. Quedó registrado: tracer verified end-to-end, expanding.

## Verification

- `bun test` (suite completa): 1573 pass, 1 skip (preexistente), 0 fail.
- `bun run check`: tsc, biome y `bun audit --audit-level=moderate` salen con 0 (269 paquetes, sin vulnerabilidades).
- Criterios de aceptación: `c.env.timeout(c.req.raw, 0)` aparece 1 vez y `onError` 0 veces en `chat.route.ts`; `respuestaDeTurno` aparece 2 veces; `chat` y `sse` están nombrados en `docs/estructura.md`; `salud.test.ts` importa `crearServidorPrueba`; G8 pasa.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 03-03 (web) puede importar `import type { ChatBody, ChatJsonResponse, SseEvent, ErrorResponse }` desde `@/http/types/api.type.ts` y consumir `/api/chat` con `fetch` + `EventSourceParserStream` (patrón ya probado en `eventosSse`).
- 03-04 (acceso) solo tiene que agregar la cabecera o cookie de acceso en `cabecerasPrueba` y los valores por defecto en `crearServidorPrueba`.
- Los topes y cupos de turno (plan posterior) se enganchan en el `finally` de `streamTurn` y en `jsonTurn`.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-14*

## Self-Check: PASSED

Archivos creados presentes (7/7) y commits d5869f1, 05c1d42 y 405bce2 en el historial de HEAD.
