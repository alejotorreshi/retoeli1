---
phase: 03-chat-web-api-sse-y-despliegue
plan: 45
subsystem: api
tags: [rate-limiter, hono, bun-test, d-77.2, wr-01, concurrency]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "createRateLimiter con herencia de golpes al desalojar y cota K × L (03-44, D-77.1)"
provides:
  - "RateLimiter.release(key): resta un golpe, nunca baja de cero, saca la clave en cero y no hace nada con una clave no rastreada"
  - "hit comprueba y cuenta en un solo paso síncrono y no cuenta un golpe rechazado (clave rastreada en el límite da false sin sumar)"
  - "POST /api/acceso reserva el intento antes de await readCode y lo devuelve ante cuerpo inválido (400) o código correcto"
  - "requireAccess (checkBearer) reserva el intento antes de await timingSafeEqual y lo devuelve ante Bearer correcto"
  - "Pruebas de concurrencia por app.request: 50 pedidos simultáneos (código y Bearer) dan exactamente 5 respuestas 401 y 45 respuestas 429"
  - "Párrafo D-77.2 en docs/limites-del-demo.md: la cota vale también con pedidos simultáneos"
affects: [access-route, access-middleware, limites-del-demo, 03-VERIFICATION]

actuals:
  tokens: 2636
  tasks: 2
  commits: 2
plan_head_before: 51c207871dd96a49b2630d72961fa1b1d3455e1d
plan_head_after: 894781af2fd695bb38ba1a03908fb6a7f0cd7f8d

tech-stack:
  added: []
  patterns:
    - "Reserva del intento: hit síncrono antes del primer await y release cuando el resultado no es un fallo evaluado"
    - "Pruebas de carrera con Promise.all sobre app.request desde la misma IP (lanzarJuntos, conEstado)"

key-files:
  created: []
  modified:
    - src/http/types/server.type.ts
    - src/http/services/rate-limiter.service.ts
    - src/http/routes/access.route.ts
    - src/http/middlewares/access.middleware.ts
    - tests/unit/rate-limiter.service.test.ts
    - tests/http/acceso.test.ts
    - docs/limites-del-demo.md

key-decisions:
  - "D-77.2 aplicada: la consulta previa isLocked de access.route.ts y access.middleware.ts se reemplaza por la reserva hit antes del primer await; un pedido sin reserva responde 429 sin leer el cuerpo ni comparar"
  - "hit deja de contar un golpe rechazado, así un doble envío con el código correcto tras L − 1 fallos no deja bloqueada a la propia IP; isLocked y retryAfterMs responden igual"
  - "Un cuerpo inválido (400) también devuelve su reserva, porque no se evaluó ningún código (D-73.2 cuenta intentos fallidos)"
  - "rate-limit.middleware.ts, chat.route.ts y server.wiring.ts no cambian: el limitador de sesiones nuevas no tiene await entre isLocked y hit"

patterns-established:
  - "Reserva y devolución: todo limitador que protege una evaluación asíncrona cuenta el golpe antes del await y lo devuelve si el resultado no debe contar"

requirements-completed: [API-04, UI-09]

coverage:
  - id: D1
    description: "50 POST /api/acceso simultáneos con un código errado desde una IP dan exactamente 5 respuestas 401 y 45 respuestas 429 con el texto de demasiados intentos; después el correcto da 429 y otra IP entra con 204"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#D-77.2: el intento se reserva antes del primer await > 50 códigos errados simultáneos desde un cliente evalúan exactamente cinco y el resto responde 429; después el correcto da 429 y otro cliente entra"
        status: pass
    human_judgment: false
  - id: D2
    description: "50 POST /api/chat simultáneos con un Bearer errado desde una IP dan exactamente 5 respuestas 401 y 45 respuestas 429; después el Bearer correcto da 429 y otra IP pasa el acceso"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#D-77.2: el intento se reserva antes del primer await > 50 Bearer errados simultáneos desde un cliente evalúan exactamente cinco y el resto responde 429; después el Bearer correcto da 429 y otro cliente pasa"
        status: pass
    human_judgment: false
  - id: D3
    description: "Un código o un Bearer correctos simultáneos tras L − 1 fallos entran al menos una vez y el cliente conserva su último intento; un cuerpo inválido nunca suma"
    requirement: UI-09
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#D-77.2: el intento se reserva antes del primer await > tras cuatro fallos, diez códigos correctos simultáneos entran al menos una vez y el cliente conserva su último intento"
        status: pass
      - kind: integration
        ref: "tests/http/acceso.test.ts#D-77.2: el intento se reserva antes del primer await > tras cuatro fallos, diez Bearer correctos simultáneos pasan al menos una vez y el cliente conserva su último intento"
        status: pass
      - kind: integration
        ref: "tests/http/acceso.test.ts#D-77.2: el intento se reserva antes del primer await > un cuerpo inválido devuelve su reserva: seis responden 400 y después quedan los cinco intentos"
        status: pass
    human_judgment: false
  - id: D4
    description: "release y hit sin cuenta del rechazo en createRateLimiter, con la herencia de 03-44 conservada y la cota K × L intacta con el flujo de reserva"
    requirement: API-04
    verification:
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#D-77.2: reserva y devolución del intento"
        status: pass
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#D-77: el tope de claves nunca libera una clave bloqueada"
        status: pass
    human_judgment: false
  - id: D5
    description: "docs/limites-del-demo.md dice que la cota de intentos vale también con pedidos simultáneos (D-77.2)"
    verification:
      - kind: other
        ref: "sed -n '/^## Tope de claves de los limitadores/,/^## Qué haría un despliegue real/p' docs/limites-del-demo.md | grep -c 'D-77.2'"
        status: pass
    human_judgment: false
  - id: D6
    description: "La pantalla de acceso sigue dejando entrar a quien tiene el código (UI-09 edge sin clasificar)"
    verification: []
    human_judgment: true
    rationale: "El plan deja la arista UI-09 para revisión manual en la verificación de la fase; la conducta de la SPA ante un 429 transitorio no la cubre ninguna prueba de este plan"

duration: 3min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 45: Reserva del intento antes del primer await (D-77.2) Summary

**`/api/acceso` y el Bearer reservan el intento con un `hit` síncrono antes de leer el cuerpo o comparar, y lo devuelven con el `release` nuevo del limitador. Así 50 pedidos errados simultáneos desde una IP evalúan exactamente 5 códigos y los otros 45 reciben 429.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-15T23:08:28Z
- **Completed:** 2026-10-15T23:11:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- WR-01 (segundo review) quedó cerrado según D-77.2. Ya no hay un `await` entre la comprobación del tope y la cuenta del intento, ni en `access.route.ts` ni en `access.middleware.ts`.
- `RateLimiter` tiene `release(key)`. `hit` deja de contar un golpe rechazado, así que un doble envío con el código correcto tras L − 1 fallos no deja bloqueada a la propia IP.
- La reproducción de concurrencia de 03-VERIFICATION.md (50 POST simultáneos con tope 5) ahora es una prueba para el código y otra para el Bearer. Las dos afirman exactamente 5 respuestas 401 y 45 respuestas 429.
- `docs/limites-del-demo.md` dice que la cota vale también con pedidos simultáneos.

## Task Commits

1. **Task 1: el trazador. 50 POST /api/acceso simultáneos evalúan como máximo L códigos.** `c8f63e3` (fix)
2. **Task 2: el Bearer reserva antes de comparar y el documento cita D-77.2.** `894781a` (fix)

## Files Created/Modified
- `src/http/types/server.type.ts`: `release(key: string): void` en el puerto `RateLimiter`.
- `src/http/services/rate-limiter.service.ts`: `hit` devuelve false sin sumar si la clave ya está en el límite. `release` barre la tabla, resta un golpe sin bajar de cero y saca la clave cuando llega a cero.
- `src/http/routes/access.route.ts`: reserva antes de `await readCode`. Hace `release` ante un 400 o un código correcto. El código errado deja el golpe contado.
- `src/http/middlewares/access.middleware.ts`: `checkBearer` reserva antes de `await timingSafeEqual` y hace `release` ante un Bearer correcto. Sin cabecera no toca el limitador.
- `tests/unit/rate-limiter.service.test.ts`: `contarEvaluados` sigue el flujo de reserva. Suma el describe "D-77.2: reserva y devolución del intento", con cinco filas: rechazo sin cuenta, la frontera L − 1, `release` en cero, una clave no rastreada y la herencia.
- `tests/http/acceso.test.ts`: describe "D-77.2: el intento se reserva antes del primer await", con `PEDIDOS_SIMULTANEOS = 50` y cinco filas. Son 50 códigos errados, 10 códigos correctos tras cuatro fallos, cuerpos inválidos, 50 Bearer errados y 10 Bearer correctos tras cuatro fallos.
- `docs/limites-del-demo.md`: párrafo D-77.2 en "Tope de claves de los limitadores".

## Decisions Made
- La reserva reemplaza a la consulta previa con `isLocked` en la ruta y en el middleware. `grep failedAttempts.isLocked` da 0 en los dos archivos.
- Un cuerpo inválido devuelve su reserva, porque no se evaluó ningún código. Es la conducta que tenía antes.
- No cambian `rate-limit.middleware.ts`, `chat.route.ts` ni `server.wiring.ts`. Para ellos, que `hit` no cuente un rechazo no cambia nada hacia afuera: `isLocked` y `retryAfterMs` responden igual.
- En `checkBearer` el Bearer recortado va en la variable `presented`, para que la comparación quepa en una línea con el formato de Biome.

## Deviations from Plan

Ninguna. El plan se ejecutó tal como estaba escrito.

## Issues Encountered
- Las filas de concurrencia se corrieron cinco veces seguidas y no mostraron intermitencias. La fila de cuerpos inválidos va en serie a propósito: en paralelo, los pedidos se quedarían sin reserva y recibirían 429 antes de que se lea su cuerpo, que es la conducta buscada.

## User Setup Required

Ninguna. No hace falta configurar ningún servicio externo.

## Next Phase Readiness
- Quedan cerradas las dos brechas bloqueantes de 03-VERIFICATION.md: CR-01 con 03-44 y WR-01 con este plan. La fase puede pasar a re-verificación.
- La arista UI-09 (cómo se ve un 429 transitorio en la pantalla de acceso) queda para la verificación manual de la fase.

## Threat Flags

Ninguna. No se agregó superficie nueva. T-03-80 y T-03-81 quedan mitigados con pruebas, y T-03-82 está aceptado con filas de unidad.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
- Verificado en disco con `[ -f ]`: los 7 archivos de key-files y este SUMMARY.
- `git merge-base --is-ancestor` confirma que los commits `c8f63e3` y `894781a` están en HEAD.
- Pasaron los criterios de aceptación de las dos tareas, `bun run check` y `bun test` completo (2313 pass, 0 fail).
