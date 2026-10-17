---
phase: 03-chat-web-api-sse-y-despliegue
plan: 15
subsystem: api
tags: [hono, rate-limit, sessions, cost-cap]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-06 createRateLimiter y clientIp; 03-13 el tope diario y tests/http/topes.test.ts; 03-14 limitByClientIp, createTurnSlots y crearServidorPrueba con ahora y pedirDesde"
provides:
  - "AlmacenSesiones.leer(id): SesionLeida<S> | null ({ sesion, ocupada }), que no crea ni renueva la sesión ni toca el orden de desalojo"
  - "Agente.existeSesion(id), construido sobre sesiones.leer"
  - "Tope D-73.5: 5 sesiones nuevas por hora por IP real del cliente (NEW_SESSIONS_PER_HOUR); sessionId null o desconocido cuenta como nueva; 429 MENSAJE_HTTP.demasiadasSesiones"
  - "tests/http/topes.test.ts con un bloque por defensa (tope diario, mensajes por minuto, turnos simultáneos, misma sesión, sesiones nuevas) y el bloque de cierre 'ningún camino llega al modelo'"
affects: [03-17 mensajes del front para 429, 03-20 vista de sesión (usa leer), SOLUCION.md (defensas de costo)]

actuals:
  tokens: 8600
  tasks: 2
  commits: 2
plan_head_before: c98d6f7eae1a3a037b16edf6eed5eecc3475b8ed
plan_head_after: a588837e5e8310d724db383c1733f29cbd6c4b15

tech-stack:
  added: []
  patterns:
    - "Límite que se comprueba antes del cupo (isLocked) y se cuenta después de obtenerlo (hit): un rechazo por cupo no gasta el límite; mismo par isLocked/hit que la guardia de acceso"
    - "Lectura de sesión sin efectos (leer) separada de abrir, que crea ante un id desconocido"

key-files:
  created: []
  modified:
    - src/application/types/puertos-agente.type.ts
    - src/infra/sessions/memory-session-store.adapter.ts
    - src/loop/types/agente.type.ts
    - src/loop/wiring/agente.wiring.ts
    - src/http/routes/chat.route.ts
    - src/http/wiring/server.wiring.ts
    - src/config/env.ts
    - src/config/constants/http.constants.ts
    - src/config/strings.ts
    - .env.example
    - docs/estructura.md
    - tests/http/topes.test.ts
    - tests/http/stream.test.ts
    - tests/unit/memory-session-store.adapter.test.ts

key-decisions:
  - "El límite de sesiones nuevas se comprueba antes del cupo de turno (isLocked → 429) y se cuenta solo cuando el turno obtiene cupo (hit). Así, un 503 por servidor ocupado no gasta una de las 5 sesiones nuevas de la hora"
  - "Cuenta como nueva toda sesión con sessionId null o con un id que leer no encuentra (expirado, desalojado, inventado o mal formado), así que cambiar de id no vuelve a abrir el tope de 300k por sesión"
  - "El limitador de sesiones nuevas vive en memoria por instancia, con ventana fija de una hora (VENTANA_SESIONES_NUEVAS_HORAS) y reloj options.now, igual que los demás topes (D-73.6)"

patterns-established:
  - "Bloque de cierre de costo: cada camino rechazado se prueba contando los pedidos al proveedor falso, no solo el estado HTTP"

requirements-completed: [API-04]

coverage:
  - id: D1
    description: "Cinco sesiones nuevas de un cliente en una hora pasan, la sexta recibe 429 con demasiadasSesiones (JSON y SSE), otro cliente sigue y al vencer la hora vuelve a pasar (1 ms antes sigue bloqueado)"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#cinco sesiones nuevas de un cliente en una hora pasan, la sexta recibe 429, otro cliente sigue y al vencer la hora vuelve a pasar"
        status: pass
    human_judgment: false
  - id: D2
    description: "Seguir en una sesión existente nunca cuenta y un sessionId inventado cuenta como nueva"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#seguir en una sesión existente nunca cuenta como sesión nueva"
        status: pass
      - kind: integration
        ref: "tests/http/topes.test.ts#un sessionId inventado cuenta como sesión nueva"
        status: pass
      - kind: integration
        ref: "tests/http/topes.test.ts#un pedido rechazado por falta de cupo no gasta una sesión nueva"
        status: pass
    human_judgment: false
  - id: D3
    description: "AlmacenSesiones.leer no crea, no renueva el TTL, no cambia el orden de desalojo y refleja ocupada según el candado"
    requirement: "API-04"
    verification:
      - kind: unit
        ref: "tests/unit/memory-session-store.adapter.test.ts#leer consulta una sesión sin crearla ni renovarla"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ningún camino rechazado (sin acceso, tope por IP, sesiones nuevas, cupos, tope diario, sin clave) pide al proveedor, y health, config, acceso, rutas desconocidas y la SPA nunca llaman al modelo"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#ningún camino llega al modelo"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 15: Tope de sesiones nuevas por IP y cierre de las defensas de costo Summary

**`POST /api/chat` cuenta como sesión nueva todo pedido con `sessionId` null o con un id que `AlmacenSesiones.leer` no encuentra. La sexta sesión nueva de una IP en la última hora recibe 429 "Abriste demasiadas sesiones nuevas en la última hora. Sigue en la sesión actual o vuelve a intentarlo más tarde.", así que inventar o cambiar el id ya no reinicia el tope de 300k tokens por sesión. `tests/http/topes.test.ts` comprueba, contando los pedidos al proveedor falso, que ningún camino rechazado llega al modelo.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T02:16:07Z
- **Completed:** 2026-10-15T02:21:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- `AlmacenSesiones.leer(id)` devuelve `{ sesion, ocupada }` o `null`. Usa el mismo `sweep` y la misma validación con `PATRON_SESION` que `abrir`, pero no guarda nada: no crea la sesión, no renueva `lastActivity` y no la mueve en el orden de desalojo.
- `Agente.existeSesion(id)` es `sesiones.leer(id) !== null`. En la ruta del chat, `opensSession` decide si el pedido abre una sesión. Si la IP ya llegó al tope, el pedido recibe 429 antes de pedir cupo. Si no, la sesión se cuenta recién cuando el turno obtiene cupo.
- `NEW_SESSIONS_PER_HOUR` (5) quedó en `serverEnvSchema`, con su valor por defecto y `VENTANA_SESIONES_NUEVAS_HORAS` en `http.constants.ts`, y vacío en `.env.example`. `server.wiring.ts` arma el limitador con `createRateLimiter` y una ventana de una hora.
- `tests/http/topes.test.ts` tiene ahora un bloque por defensa: tope diario, mensajes por minuto, turnos simultáneos, misma sesión y sesiones nuevas. Cada uno comprueba el estado del rechazo y su texto exacto. El bloque "ningún camino llega al modelo" cubre sin acceso, código errado, tope por IP, sesiones nuevas, cupos, tope diario y sin clave, y también health, config, la entrada, una ruta `/api` desconocida, `GET /api/chat` y la SPA. En ninguno de esos caminos se suma un pedido al proveedor.

## Task Commits

1. **Task 1: Tracer, la sexta sesión nueva de un cliente en una hora recibe 429 y seguir una sesión nunca cuenta (D-73.5)** - `0be6703` (feat)
2. **Task 2: leer no crea, no renueva ni bloquea, y todas las defensas de costo probadas en un lugar** - `a588837` (test)

El commit de metadata se registra al cerrar el plan.

## TDD (Task 2)

- **RED:** las pruebas de la Tarea 2 pasaron desde el principio, porque `leer` y el límite ya se habían implementado en el tracer de la Tarea 1. El plan pedía escribirlas primero y corregir lo que dejara pasar un pedido, y no apareció ningún hueco. Funcionan como pruebas de caracterización y de registro de la prohibición, no como un RED válido.
- **Mutación (en lugar de RED):**
  - Hacer que `leer` renueve la sesión (`store(...)`) hace fallar 2 pruebas unitarias: la del TTL y la del orden de desalojo.
  - Hacer que `leer` cree una sesión ante un id desconocido hace fallar 2 pruebas.
  - Quitar el `isLocked` de sesiones nuevas en la ruta hace fallar 5 pruebas HTTP.
  - Quitar el chequeo del tope diario hace fallar 3 pruebas HTTP.
  - Contar solo `sessionId === null` como nueva hace fallar "un sessionId inventado cuenta como sesión nueva".
  - Todas las mutaciones se revirtieron.
- **GREEN / REFACTOR:** no hizo falta código nuevo.

## Files Created/Modified

- `src/application/types/puertos-agente.type.ts`: `SesionLeida<S>` y `leer` en `AlmacenSesiones`.
- `src/infra/sessions/memory-session-store.adapter.ts`: `leer`.
- `src/loop/types/agente.type.ts` y `src/loop/wiring/agente.wiring.ts`: `existeSesion`.
- `src/http/routes/chat.route.ts`: `newSessions` en `ChatDeps`, `opensSession`, `tooManyNewSessions` (429) y el par `isLocked`/`hit` alrededor de `tryAcquire`.
- `src/http/wiring/server.wiring.ts`: `newSessionsLimiter`.
- `src/config/env.ts`, `src/config/constants/http.constants.ts`, `src/config/strings.ts` y `.env.example`: la variable, sus constantes y el texto de UI-SPEC.
- `docs/estructura.md`: la regla de sesión nueva en la fila de rutas y `NEW_SESSIONS_PER_HOUR` en la del wiring.
- `tests/http/topes.test.ts`, `tests/unit/memory-session-store.adapter.test.ts` y `tests/http/stream.test.ts`: pruebas.

## Decisions Made

- **Comprobar antes del cupo, contar después de obtenerlo.** El plan pide aplicar el límite antes de adquirir el cupo. La comprobación (`isLocked`) va antes, pero el conteo (`hit`) va después de `tryAcquire`. Si se contara antes, cada reintento ante un 503 "servidor ocupado" gastaría una de las 5 sesiones de la hora, y una usuaria legítima quedaría bloqueada por la carga de otros. Todo ocurre de forma síncrona después de leer el cuerpo, así que no hay carrera entre la comprobación y el conteo.
- Un id expirado o desalojado también cuenta como nuevo, porque el agente le abre de verdad una sesión nueva con presupuesto nuevo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El `Agente` falso y el `ChatDeps` de `tests/http/stream.test.ts` no compilaban**
- **Found during:** Task 1
- **Issue:** `Agente` exige ahora `existeSesion` y `ChatDeps` exige `newSessions`.
- **Fix:** el agente falso devuelve `existeSesion: () => false`, y se pasa un `createRateLimiter` con los valores por defecto (`SESIONES_NUEVAS_POR_HORA_POR_DEFECTO`, `MS_POR_HORA`).
- **Files modified:** tests/http/stream.test.ts
- **Committed in:** 0be6703

**2. [Rule 2 - Correctness] Un rechazo por cupo no gasta una sesión nueva**
- **Found during:** Task 1
- **Issue:** contar la sesión antes del cupo, como sugería el plan, castiga los reintentos ante un 503.
- **Fix:** se comprueba con `isLocked` antes del cupo y se cuenta con `hit` después, con su prueba "un pedido rechazado por falta de cupo no gasta una sesión nueva".
- **Files modified:** src/http/routes/chat.route.ts, tests/http/topes.test.ts
- **Committed in:** 0be6703

**3. [Documentación] `docs/estructura.md`**
- Se agregaron la regla de sesión nueva y la variable `NEW_SESSIONS_PER_HOUR`, siguiendo la práctica de 03-14. Commit `0be6703`.

---

**Total deviations:** 2 auto-fixed (1 de bloqueo y 1 de corrección) y 1 de documentación.
**Impact on plan:** ninguno en el alcance.

## Issues Encountered

- En la prueba de rutas sin modelo, un `POST /api/acceso` con un código errado repetido 5 veces bloqueaba la IP por el tope de intentos fallidos (03-06), y las rutas siguientes recibían 429. Se resolvió entrando con el código válido, que responde 204.

## Threat Flags

None. T-03-39 queda mitigado: 5 sesiones nuevas por IP por hora, contando las null y las desconocidas, con una prueba que usa un id inventado. `leer` nunca crea ni renueva una sesión. T-03-SC: no se instaló ningún paquete y `bun audit` está limpio.

## User Setup Required

None. Opcional: definir `NEW_SESSIONS_PER_HOUR` en Render si se quiere un valor distinto de 5.

## Next Phase Readiness

- 03-17 tiene que mostrar el 429 `demasiadasSesiones` con el texto de UI-SPEC, que llega en `{ mensaje }`.
- 03-20 puede usar `AlmacenSesiones.leer` para la vista de sesión sin crearla ni renovarla.
- No se hizo `git push`, así que Render no se redesplegó.

## Self-Check: PASSED

- FOUND: src/infra/sessions/memory-session-store.adapter.ts tiene `leer(` (acceptance: 1 o más).
- FOUND: src/loop/wiring/agente.wiring.ts tiene `existeSesion`, y chat.route.ts tiene `existeSesion(`.
- FOUND: `.env.example` tiene `NEW_SESSIONS_PER_HOUR=` vacío.
- FOUND: topes.test.ts comprueba el caso del sessionId inventado, y memory-session-store.adapter.test.ts el TTL no renovado.
- FOUND commits: 0be6703, a588837.
- Plan verification: `bun test` da 1809 pass, 1 skip y 0 fail. `bun run check` termina con exit 0 (tsc, tsc web, Biome y `bun audit` sin vulnerabilidades).

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
