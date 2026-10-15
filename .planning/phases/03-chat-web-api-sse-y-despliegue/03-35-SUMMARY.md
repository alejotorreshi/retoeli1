---
phase: 03-chat-web-api-sse-y-despliegue
plan: 35
subsystem: api
tags: [hono, rate-limit, render, g-03-04, sesiones-nuevas]

requires:
  - phase: 03-15
    provides: "Tope de sesiones nuevas por IP en chat.route.ts (newSessions.isLocked antes del cupo de turno)"
  - phase: 03-33
    provides: "Copia coherente de los mensajes del servidor y del banner del modelo"
provides:
  - "RateLimiter.retryAfterMs(key): ms que faltan para que venza la ventana de una clave bloqueada (0 si no lo está)"
  - "MENSAJE_HTTP.demasiadasSesiones(minutos): el 429 dice 'Podrás abrir otra en un minuto' o '{m} minutos'"
  - "SESIONES_NUEVAS_POR_HORA_RENDER = 20 y NEW_SESSIONS_PER_HOUR en render.yaml, exigido por el contrato de despliegue"
  - "Justificación del tope en docs/limites-del-demo.md contra el tope diario global de 2 M tokens"
affects: [03-38, API-04, DEP-02, SOLUCION.md]

actuals:
  tokens: 4300
  tasks: 2
  commits: 3
plan_head_before: b655ad6a2b2a1dc9ab0851b17d7759703e616e80
plan_head_after: b1cceabbddf519cea23efa5c88f1d2b3fdd7be1b

tech-stack:
  added: []
  patterns:
    - "Minutos de espera de un 429 = max(1, techo(retryAfterMs / MS_POR_MINUTO)), calculados en la ruta con una función pequeña"
    - "Valores del blueprint de Render como constantes *_RENDER que el contrato de despliegue compara con render.yaml"

key-files:
  created: []
  modified:
    - src/http/services/rate-limiter.service.ts
    - src/http/types/server.type.ts
    - src/http/routes/chat.route.ts
    - src/config/strings.ts
    - src/config/constants/http.constants.ts
    - render.yaml
    - docs/limites-del-demo.md
    - tests/unit/rate-limiter.service.test.ts
    - tests/http/topes.test.ts
    - tests/despliegue/contrato-despliegue.test.ts

key-decisions:
  - "NEW_SESSIONS_PER_HOUR = 20 solo en Render (SESIONES_NUEVAS_POR_HORA_RENDER); el default local de config/env.ts sigue en 5 y el tope diario global de 2 M tokens no se declara en el blueprint, sigue con su default y es el límite real de gasto."
  - "El 429 de sesiones nuevas informa los minutos con techo y mínimo 1 (60 min con la ventana recién abierta, 'un minuto' con 60 s o 1 ms restantes), sin cabecera Retry-After (sigue diferida en la UAT) y sin cambiar el orden de los rechazos."
  - "retryAfterMs barre las ventanas vencidas antes de medir y devuelve 0 si la clave no llegó al tope, así nunca da un valor negativo ni una espera para una clave libre."

patterns-established:
  - "Un 429 por ventana de tiempo dice cuánto falta, con el tiempo derivado del limitador y el texto en MENSAJE_HTTP."

requirements-completed: [API-04, DEP-02]

coverage:
  - id: D1
    description: "retryAfterMs del limitador: 0 sin bloqueo, la ventana completa al bloquear, 1 ms antes de vencer y 0 al vencer"
    requirement: API-04
    verification:
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#retryAfterMs"
        status: pass
    human_judgment: false
  - id: D2
    description: "El 429 de sesiones nuevas dice en cuántos minutos se puede abrir otra; borde N/N+1 con NEW_SESSIONS_PER_HOUR=2 y precisión de los minutos (59 min 59 s → 60 minutos, 60 s → un minuto, 1 ms → un minuto); seguir en una sesión conocida no cuenta"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#con NEW_SESSIONS_PER_HOUR=2 la primera y la segunda sesión nueva pasan, la tercera recibe 429 con los minutos de espera y la primera sesión sigue"
        status: pass
      - kind: integration
        ref: "tests/http/topes.test.ts#el 429 de sesiones nuevas dice en cuántos minutos se puede abrir otra"
        status: pass
      - kind: integration
        ref: "tests/http/topes.test.ts#seguir en una sesión existente nunca cuenta como sesión nueva"
        status: pass
    human_judgment: false
  - id: D3
    description: "render.yaml fija NEW_SESSIONS_PER_HOUR = 20 y el contrato de despliegue lo exige; AGENT_DAILY_TOKEN_BUDGET no está en el blueprint"
    requirement: DEP-02
    verification:
      - kind: unit
        ref: "tests/despliegue/contrato-despliegue.test.ts#fija la fecha de ejecución, la zona, el entorno, el nivel de log, los saltos del proxy y el tope de sesiones nuevas"
        status: pass
    human_judgment: false
  - id: D4
    description: "Justificación del tope de 20 sesiones por hora en docs/limites-del-demo.md y valor efectivo en el panel de Render tras el push"
    requirement: DEP-02
    verification: []
    human_judgment: true
    rationale: "La claridad del texto es juicio humano, y que el panel de Render muestre NEW_SESSIONS_PER_HOUR=20 solo se ve después del push y el autodeploy, que este plan no hace."

duration: 3min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 35: Tope de sesiones nuevas con tiempo de espera y 20 por hora en Render Summary

**El 429 de sesiones nuevas ahora dice "Podrás abrir otra en {m} minutos" con los minutos tomados del limitador (`retryAfterMs`, techo y mínimo 1), y Render sube el tope a 20 sesiones por hora por IP, fijado en render.yaml, exigido por el contrato de despliegue y justificado contra el tope diario de 2 M tokens.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-15T17:32:52Z
- **Completed:** 2026-10-15T17:35:48Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- `RateLimiter.retryAfterMs(key)` en el tipo y en `createRateLimiter`: mide `start + windowMs - now` de la clave bloqueada, nunca negativo, y da 0 para una clave libre o con la ventana vencida.
- `MENSAJE_HTTP.demasiadasSesiones(minutos)`: "Abriste demasiadas sesiones nuevas en la última hora. Podrás abrir otra en un minuto." o "en 60 minutos.". Reemplaza el texto "Sigue en la sesión actual o vuelve a intentarlo más tarde", que no decía cuánto esperar.
- `chat.route.ts`: `tooManyNewSessions(c, minutesUntilRetry(deps.newSessions.retryAfterMs(clientIp)))`, con el mismo orden de rechazos de antes.
- `SESIONES_NUEVAS_POR_HORA_RENDER = 20` en http.constants.ts, `NEW_SESSIONS_PER_HOUR: "20"` en render.yaml y su fila en el contrato de despliegue.
- docs/limites-del-demo.md: una sección nueva que explica por qué 20 sesiones de 300 k tokens no pueden pasar el tope diario global de 2 M (que sigue siendo el límite real de gasto) y para qué se deja margen: ensayos, recargas tras un reinicio y NAT.

## Task Commits

1. **Task 1 (tracer): el 429 de sesiones nuevas dice en cuántos minutos se puede abrir otra.** RED `e719f2c` (test), GREEN `1a273fe` (feat).
2. **Task 2: NEW_SESSIONS_PER_HOUR = 20 en Render, con contrato y justificación.** `b1cceab` (feat).

**Plan metadata:** commit docs(03-35) de este SUMMARY.

## Files Created/Modified
- `src/http/services/rate-limiter.service.ts`: `retryAfterMs`.
- `src/http/types/server.type.ts`: `retryAfterMs(key): number` en `RateLimiter`.
- `src/http/routes/chat.route.ts`: `minutesUntilRetry` y `tooManyNewSessions(c, minutes)`.
- `src/config/strings.ts`: `demasiadasSesiones` pasa a ser una función de los minutos.
- `src/config/constants/http.constants.ts`: `SESIONES_NUEVAS_POR_HORA_RENDER`.
- `render.yaml`: `NEW_SESSIONS_PER_HOUR: "20"`.
- `docs/limites-del-demo.md`: la sección "Tope de sesiones nuevas en Render" y la fila de la tabla con 5 por defecto y 20 en Render.
- `tests/unit/rate-limiter.service.test.ts`: describe `retryAfterMs`. `crearBanco` ahora acepta el límite y la ventana.
- `tests/http/topes.test.ts`: el texto del 429, el borde N/N+1 con NEW_SESSIONS_PER_HOUR=2 y la precisión de los minutos. `esRechazoDeSesiones` recibe los minutos esperados.
- `tests/despliegue/contrato-despliegue.test.ts`: `NEW_SESSIONS_PER_HOUR: String(SESIONES_NUEVAS_POR_HORA_RENDER)`.

## Decisions Made
- El tope de 20 por hora vive solo en el blueprint de Render. En local sigue en 5 para que las pruebas y la operación local conserven el comportamiento estricto.
- No se agrega `Retry-After`, que sigue diferido en la UAT. El tiempo de espera solo viaja en el texto del 429.
- La fila existente del test de topes que verificaba "1 ms antes de vencer" ahora exige "un minuto", la sonda de precisión del must_have.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None in this plan. After the push, the Render autodeploy should apply `NEW_SESSIONS_PER_HOUR=20` from the blueprint. The user checks it in the Render dashboard. This plan does not push or deploy.

## Next Phase Readiness
- The server side of G-03-04 is closed. Plan 03-38 still has to add the "Volver a la sesión anterior" button and keep the previous id until the server accepts the new session.
- The doc already mentions the SPA option to go back to the previous session, credited to 03-38.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
