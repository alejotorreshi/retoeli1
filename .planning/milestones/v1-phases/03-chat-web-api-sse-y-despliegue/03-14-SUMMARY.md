---
phase: 03-chat-web-api-sse-y-despliegue
plan: 14
subsystem: api
tags: [hono, rate-limit, concurrency, cost-cap, sse]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-06 createRateLimiter y la variable de contexto clientIp; 03-13 el pre-check del tope diario y tests/http/topes.test.ts"
provides:
  - "limitByClientIp(limiter, mensaje) (http/middlewares/rate-limit.middleware.ts): 429 { mensaje } por IP real del cliente"
  - "Tope D-73.1: 10 POST /api/chat por minuto por IP (RATE_LIMIT_CHAT_PER_MINUTE), montado después del acceso, json-only y bodyLimit"
  - "createTurnSlots(max) → TurnSlots { tryAcquire, release, inUse } (http/services/turn-slots.service.ts)"
  - "Tope D-73.3: 3 turnos simultáneos en todo el servidor (MAX_CONCURRENT_TURNS); el cuarto recibe 503 MENSAJE_HTTP.servidorOcupado"
  - "MENSAJE_HTTP.demasiadosMensajes y MENSAJE_HTTP.servidorOcupado con el texto de UI-SPEC"
  - "Pruebas HTTP de un turno por sesión (SESION_OCUPADA) y de health bajo carga completa"
  - "crearServidorPrueba acepta ahora (reloj inyectado) y expone pedirDesde(ip, ruta, init)"
affects: [03-15 sesiones nuevas por IP por hora, 03-17 mensajes del front para 429 y 503, SOLUCION.md (defensas de costo)]

actuals:
  tokens: 9400
  tasks: 2
  commits: 3
plan_head_before: cba47cc8d4e6ba044cfdf21ceb7bca6fa27505fb
plan_head_after: 0bcbdd38991d28e90af274fcd761623f5e02c05a

tech-stack:
  added: []
  patterns:
    - "Límite por cliente como middleware de método y ruta (app.post(RUTA_API.CHAT, limitByClientIp(...))) en el composition root, entre la guardia de acceso y la ruta"
    - "Semáforo de turnos con contador que nunca baja de cero; la ruta adquiere después de todos los rechazos baratos y libera en un finally por cada camino (SSE y JSON)"

key-files:
  created:
    - src/http/middlewares/rate-limit.middleware.ts
    - src/http/services/turn-slots.service.ts
    - tests/unit/turn-slots.service.test.ts
  modified:
    - src/config/env.ts
    - .env.example
    - src/config/strings.ts
    - src/config/constants/http.constants.ts
    - src/http/routes/chat.route.ts
    - src/http/types/server.type.ts
    - src/http/wiring/server.wiring.ts
    - tests/http/topes.test.ts
    - tests/http/stream.test.ts
    - tests/helpers/servidor-prueba.helper.ts
    - tests/helpers/types/servidor-prueba.type.ts
    - docs/estructura.md

key-decisions:
  - "El tope de mensajes cuenta cada POST /api/chat autenticado, válido o no (un 400 también suma), porque va antes de la validación del cuerpo; los Bearer errados no llegan a él y siguen contando solo para el tope de acceso de 03-06"
  - "Orden en la ruta del chat: cuerpo (400/413), sin clave (503), tope diario (429) y recién entonces el cupo de turno (503 servidorOcupado); un rechazo barato nunca ocupa un cupo"
  - "El cupo se libera en el finally del callback SSE (cubre fin normal, error del proveedor, excepción y aborto del cliente) y en un finally alrededor del pliegue JSON"
  - "El limitador y los cupos viven en memoria por instancia, igual que el tope diario; un reinicio o spin-down de Render los vacía (D-73.6)"

patterns-established:
  - "Pruebas de concurrencia en proceso: turnos colgados con COLGADO, liberación por body.cancel() y espera activa acotada (hastaQueHayaCupo) en vez de pausas fijas"

requirements-completed: [API-04, API-01, API-03]

coverage:
  - id: D1
    description: "Diez POST /api/chat de un cliente en un minuto pasan, el undécimo recibe 429 con demasiadosMensajes, otro cliente sigue y al vencer el minuto vuelve a pasar (1 ms antes sigue bloqueado)"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#diez POST /api/chat de un cliente pasan, el undécimo recibe 429, otro cliente sigue y al vencer el minuto vuelve a pasar"
        status: pass
      - kind: integration
        ref: "tests/http/topes.test.ts#RATE_LIMIT_CHAT_PER_MINUTE cambia el tope y los mensajes válidos también cuentan"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tres turnos colgados ocupan los cupos, el cuarto recibe 503 con servidorOcupado (JSON y SSE) y abortar uno libera su cupo"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#tres turnos colgados ocupan los cupos, el cuarto recibe 503, health responde 200 sin pedir al proveedor y abortar uno libera su cupo"
        status: pass
      - kind: unit
        ref: "tests/unit/turn-slots.service.test.ts#createTurnSlots"
        status: pass
    human_judgment: false
  - id: D3
    description: "El cupo se libera cuando el turno termina (SSE y JSON), cuando falla, cuando lanza una excepción y cuando el cliente lo aborta"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#un cupo se libera cuando el turno termina por SSE o JSON, cuando falla y cuando el cliente lo aborta"
        status: pass
      - kind: integration
        ref: "tests/http/stream.test.ts#una excepción dentro del stream llega solo como un frame error con el mensaje genérico"
        status: pass
    human_judgment: false
  - id: D4
    description: "Un segundo mensaje en la misma sesión mientras su turno corre recibe turn_start, SESION_OCUPADA y turn_end sin pedir al proveedor, y el primero termina con motivo final"
    requirement: "API-01"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#un segundo mensaje en la sesión mientras su turno corre recibe SESION_OCUPADA y turn_end, y el primero termina normal"
        status: pass
    human_judgment: false
  - id: D5
    description: "GET /api/health responde 200 con los tres cupos ocupados y el proveedor falso no registra ningún pedido por health"
    requirement: "API-03"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#tres turnos colgados ocupan los cupos, el cuarto recibe 503, health responde 200 sin pedir al proveedor y abortar uno libera su cupo"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 14: Tope de mensajes por IP y cupos de turno simultáneos Summary

**`POST /api/chat` acepta 10 mensajes por minuto por IP real del cliente (`limitByClientIp` sobre `createRateLimiter`, después del acceso) y el undécimo recibe 429 "Enviaste muchos mensajes seguidos. Espera un minuto y vuelve a intentarlo.". Además, `createTurnSlots(3)` limita a tres los turnos pagos simultáneos en todo el servidor: el cuarto recibe 503 "El servidor está atendiendo otras conversaciones. Vuelve a intentarlo en unos segundos.". El cupo se libera al terminar, al fallar y al abortar, y health sigue respondiendo con la carga completa.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-15T02:05:23Z
- **Completed:** 2026-10-15T02:14:07Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- `limitByClientIp(limiter, mensaje)` lee `c.get("clientIp")`, que resuelve el middleware de 03-06 con `TRUSTED_PROXY_HOPS` (3 en Render), y responde 429 `{ mensaje }` cuando el limitador rechaza. `server.wiring.ts` lo monta con `app.post(RUTA_API.CHAT, ...)` después de `requireAccess`, `json-only` y `bodyLimit`, con una ventana de `VENTANA_MENSAJES_CHAT_MINUTOS` (1) y el reloj `options.now`.
- `createTurnSlots(max)` es un contador que nunca baja de cero. La ruta del chat lo adquiere después del cuerpo, de la clave y del tope diario, y lo libera en el `finally` del callback SSE y en un `finally` alrededor del pliegue JSON.
- `RATE_LIMIT_CHAT_PER_MINUTE` (10) y `MAX_CONCURRENT_TURNS` (3) están en `serverEnvSchema`, con sus valores por defecto en `http.constants.ts`, y vacíos en `.env.example`.
- `tests/http/topes.test.ts` suma los bloques "mensajes por minuto", "turnos simultáneos" y "misma sesión". `docs/estructura.md` nombra `rate-limit` y `turn-slots`.

## Task Commits

1. **Task 1: Tracer, el undécimo mensaje en un minuto de un cliente recibe 429 (D-73.1)** - `b765647` (feat)
2. **Task 2: Tres turnos simultáneos como máximo, uno por sesión, y health responde (D-73.3)**
   - RED: `4cd55be` (test)
   - GREEN: `0bcbdd3` (feat)

El commit de metadata se registra al cerrar el plan.

## TDD (Task 2)

- **RED:** `tests/http/topes.test.ts#MAX_CONCURRENT_TURNS cambia la cantidad de cupos` falló en la aserción planificada: `expect(segundo.status).toBe(503)` recibió 200, porque todavía no había cupos de turno. La evidencia se capturó con `bun test --reporter=junit` y `gsd-tools check tdd-red-evidence` devolvió `RED_EVIDENCE_OK` (`target_test_failed`). semanticAssessment: el objetivo se ejecutó y falló por la razón buscada (no hay semáforo), no por un error de carga ni de fixture. Las otras dos pruebas de "turnos simultáneos" también fallaron en el estado HTTP. `tests/unit/turn-slots.service.test.ts` falló por carga (el módulo no existía); eso no cuenta como RED válido y no se usó como evidencia. El caso "misma sesión" pasó desde el principio, porque `SESION_OCUPADA` ya existía en el bucle (fase 2): es una prueba de caracterización sobre HTTP, como pedía el plan.
- **GREEN:** `turn-slots.service.ts`, la adquisición y la liberación en `chat.route.ts`, la env y los textos. Pasan las 1793 pruebas.
- **Mutación:** quitar `release()` del `finally` SSE hace fallar 3 pruebas, y quitarlo del pliegue JSON hace fallar 2. Las dos mutaciones se revirtieron.
- **REFACTOR:** no hizo falta.

## Files Created/Modified

- `src/http/middlewares/rate-limit.middleware.ts`: `limitByClientIp`.
- `src/http/services/turn-slots.service.ts`: `createTurnSlots`.
- `src/http/types/server.type.ts`: `TurnSlots`.
- `src/http/routes/chat.route.ts`: `turnSlots` en `ChatDeps`, `serverBusy` (503), `foldTurn` con `finally` y la liberación en el `finally` SSE.
- `src/http/wiring/server.wiring.ts`: `clockOf`, `chatMessagesLimiter`, el montaje del límite y `createTurnSlots(MAX_CONCURRENT_TURNS)`.
- `src/config/env.ts`, `.env.example`, `src/config/constants/http.constants.ts`, `src/config/strings.ts`: las dos variables, sus valores por defecto y los dos textos.
- `tests/http/topes.test.ts`, `tests/unit/turn-slots.service.test.ts`, `tests/http/stream.test.ts`: pruebas.
- `tests/helpers/servidor-prueba.helper.ts` y su tipo: `ahora`, `bindingsDesde` y `pedirDesde`.
- `docs/estructura.md`: `rate-limit`, `turn-slots` y las variables nuevas del wiring.

## Decisions Made

- El tope de mensajes cuenta todo POST autenticado al chat, válido o no, como pide el plan. Los Bearer errados se cortan antes en `requireAccess` y solo suman al tope de acceso.
- Un rechazo barato (400, 413, 503 sin clave, 429 por tope diario) nunca ocupa un cupo, porque el cupo se adquiere al final, justo antes del turno.
- El limitador y los cupos viven en memoria y se pierden en cada reinicio o spin-down. Es el mismo criterio que el tope diario (D-73.6), y SOLUCION.md debe documentarlo junto a las demás defensas de costo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El helper de servidor de prueba no podía inyectar el reloj ni la IP**
- **Found during:** Task 1
- **Issue:** para probar el vencimiento de la ventana y la independencia entre clientes, `crearServidorPrueba` tenía que aceptar `now` y pedir desde otra IP.
- **Fix:** se agregaron `ahora` a `OpcionesServidorPrueba`, `bindingsDesde(ip)` y `pedirDesde(ip, ruta, init)`.
- **Files modified:** tests/helpers/servidor-prueba.helper.ts, tests/helpers/types/servidor-prueba.type.ts
- **Committed in:** b765647

**2. [Rule 3 - Blocking] El `ChatDeps` armado a mano en `tests/http/stream.test.ts` no tenía `turnSlots`**
- **Found during:** Task 2
- **Issue:** `tsc` fallaba porque `ChatDeps` ahora exige `turnSlots`.
- **Fix:** se pasa `createTurnSlots(1)`, y la prueba de excepción comprueba además que el cupo vuelve a 0 por SSE y por JSON (500). Se agregó un `onError` local para que el 500 JSON no ensucie la salida.
- **Files modified:** tests/http/stream.test.ts
- **Committed in:** 0bcbdd3

---

**Total deviations:** 2 auto-fixed (de bloqueo).
**Impact on plan:** ninguno en el alcance.

## Issues Encountered

None.

## Threat Flags

None. T-03-20 queda mitigado en las partes de este plan: el tope por IP, los 3 cupos globales y un turno por sesión, cada uno con su prueba en `tests/http/topes.test.ts`. Las sesiones nuevas por IP quedan para 03-15. T-03-SC: no se instalaron paquetes y `bun audit` está limpio.

## User Setup Required

None. Opcional: definir `RATE_LIMIT_CHAT_PER_MINUTE` o `MAX_CONCURRENT_TURNS` en Render si se quieren valores distintos de 10 y 3.

## Next Phase Readiness

- 03-15 puede reutilizar `limitByClientIp` o `createRateLimiter` con `clientIp` para el tope de sesiones nuevas por hora.
- 03-17 tiene que mostrar el 429 y el 503 del chat con los textos de UI-SPEC, que ya llegan en `{ mensaje }`.
- No se hizo `git push`, así que Render no se redesplegó.

## Self-Check: PASSED

- FOUND: src/http/middlewares/rate-limit.middleware.ts
- FOUND: src/http/services/turn-slots.service.ts
- FOUND: tests/unit/turn-slots.service.test.ts
- FOUND commits: b765647, 4cd55be, 0bcbdd3
- Acceptance: `.env.example` tiene `RATE_LIMIT_CHAT_PER_MINUTE=` y `MAX_CONCURRENT_TURNS=` vacíos; `docs/estructura.md` nombra `` `rate-limit` `` y `` `turn-slots` ``; topes.test.ts comprueba el décimo aceptado y el undécimo 429 con el texto exacto, y el 503 servidorOcupado con health 200 bajo carga.
- Plan verification: `bun test` da 1793 pass, 1 skip y 0 fail. `bun run check` termina con exit 0.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
