---
phase: 03-chat-web-api-sse-y-despliegue
plan: 41
subsystem: http
status: complete
tags: [limitador, d-77, wr-01, fuerza-bruta, ipv6, falla-cerrada]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "createRateLimiter con ventana fija, barrido y tope de claves MAX_CLAVES_LIMITADOR (D-73)"
provides:
  - "evictOldestUnlocked: el tope de claves desaloja solo la clave no bloqueada más antigua"
  - "Falla cerrada: con la tabla llena de claves bloqueadas (o el cupo de desalojos agotado), la clave nueva no entra, isLocked da true y retryAfterMs da la espera hasta poder entrar"
  - "Cupo de desalojos: los golpes descartados al desalojar claves libres no pasan de `limit` por ventana"
  - "Sección 'Tope de claves de los limitadores' en docs/limites-del-demo.md con el alcance de la falla cerrada en los tres limitadores"
affects: [acceso, chat, verificación de la fase 03, SOLUCION.md]

actuals:
  tokens: 3583
  tasks: 2
  commits: 2
plan_head_before: 81a0cc9bc1035eeb6dd135ea9f5782ab3787a490
plan_head_after: fc028b26d1af5901c68574b64fc045bca8cbb2b4

tech-stack:
  added: []
  patterns:
    - "Desalojo seguro: el limitador nunca suelta una clave bloqueada y, sin lugar seguro, falla cerrado para la clave nueva sin guardarla"
    - "Cupo de golpes desalojados por ventana para que la rotación en ronda no reinicie contadores sin límite"

key-files:
  created: []
  modified:
    - src/http/services/rate-limiter.service.ts
    - tests/unit/rate-limiter.service.test.ts
    - docs/limites-del-demo.md

key-decisions:
  - "D-77 aplicado: al llegar a maxKeys se desaloja la clave no bloqueada más antigua; una bloqueada solo sale cuando vence su ventana (barrido)"
  - "Con todas las claves bloqueadas el limitador falla cerrado: hit da false sin guardar la clave, isLocked da true y retryAfterMs es lo que falta para que venza la ventana más antigua"
  - "Cupo de desalojos (desvío Rule 2): la suma de golpes de las claves libres desalojadas no pasa de `limit` por ventana; si el siguiente desalojo lo superaría, el limitador también falla cerrado. Sin el cupo, rotar en ronda más de maxKeys claves daba intentos ilimitados"
  - "La interfaz RateLimiter, server.wiring.ts, las rutas y los middlewares no cambian"

patterns-established:
  - "isSaturated() = tabla llena y sin clave desalojable; es la respuesta de isLocked para una clave no rastreada"

requirements-completed: [API-04]

coverage:
  - id: D1
    description: "El desalojo por tope de claves nunca suelta una clave bloqueada; desaloja la libre más antigua"
    requirement: "API-04"
    verification:
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#con el tope lleno, la clave nueva desaloja la libre más antigua y la bloqueada sigue bloqueada"
        status: pass
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#con una clave menos que el tope, la clave nueva entra sin desalojar"
        status: pass
    human_judgment: false
  - id: D2
    description: "Con la tabla llena de claves bloqueadas, la clave nueva falla cerrado, no crece la memoria y entra al vencer la ventana más antigua"
    requirement: "API-04"
    verification:
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#con el tope lleno de claves bloqueadas, la clave nueva no entra y queda bloqueada (falla cerrado)"
        status: pass
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#saturado, 1 ms antes de que venza la ventana más antigua sigue bloqueada y al vencer entra"
        status: pass
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#retryAfterMs de una clave nueva no es negativo ni mayor que la ventana"
        status: pass
    human_judgment: false
  - id: D3
    description: "Rotar claves con el flujo de /api/acceso queda acotado: K × L en serie y (K + 1) × L en ronda"
    requirement: "API-04"
    verification:
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#rotar claves de a una con el flujo de /api/acceso deja K × L intentos evaluados"
        status: pass
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#rotar claves en ronda con el flujo de /api/acceso queda acotado: los golpes desalojados no pasan de L por ventana"
        status: pass
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#con los golpes desalojados en el tope, la clave nueva espera lo que falta para el primer desalojo o la ventana más antigua"
        status: pass
    human_judgment: false
  - id: D4
    description: "docs/limites-del-demo.md explica el tope de claves, el desalojo seguro, la falla cerrada y su alcance en los tres limitadores"
    requirement: "API-04"
    verification:
      - kind: command
        ref: "sed -n '/^## Tope de claves de los limitadores/,/^## Qué haría un despliegue real/p' docs/limites-del-demo.md | grep ACCESS_MAX_FAILED_ATTEMPTS|RATE_LIMIT_CHAT_PER_MINUTE|NEW_SESSIONS_PER_HOUR"
        status: pass
    human_judgment: true
    rationale: "La claridad y el tono de la sección para la defensa son juicio humano; la presencia de los tres limitadores la comprueba el comando"

duration: 4 min
completed: 2026-10-15
---

# Phase 03 Plan 41: Tope de claves del limitador sin desbloqueo por rotación (D-77) Summary

**`createRateLimiter` desaloja solo la clave no bloqueada más antigua, limita a `limit` los golpes desalojados por ventana y falla cerrado cuando no hay lugar seguro. Así ninguna rotación de prefijos IPv6, en serie ni en ronda, da intentos ilimitados contra `/api/acceso`.**

## Performance

- **Duración:** 4 min
- **Inicio:** 2026-10-15T20:05:59Z
- **Fin:** 2026-10-15T20:09:34Z
- **Tareas:** 2
- **Archivos modificados:** 3

## Accomplishments

- WR-01 cerrado. La clave más antigua bloqueada ya no sale para hacer lugar. Con la tabla llena de bloqueadas, la clave nueva queda bloqueada sin guardarse, y `trackedKeys()` nunca supera `maxKeys`.
- `retryAfterMs` de una clave nueva rechazada da la espera exacta hasta poder entrar: el vencimiento de la ventana más antigua o el del cupo de desalojos si vence antes. Nunca es negativo ni mayor que la ventana, y `chat.route.ts` lo sigue pasando por `minutesUntilRetry`.
- Se reemplazó la fila que exigía el desalojo inseguro por ocho filas D-77: desalojo seguro, bajo el tope, saturación, borde de la ventana, rotación en serie, rotación en ronda, cupo de desalojos y rango de `retryAfterMs`.
- `docs/limites-del-demo.md` tiene la sección "Tope de claves de los limitadores". Incluye una tabla por limitador: el de intentos falla cerrado para `/api/acceso` y Bearer, pero la cookie sigue entrando; el de mensajes da 429 en `/api/chat` también con la cookie; el de sesiones bloquea las sesiones nuevas, pero la sesión abierta sigue.

## Task Commits

1. **Tarea 1: trazador D-77, desalojo seguro y falla cerrada:** `b2b623b` (fix)
2. **Tarea 2: documentación del tope de claves en los tres limitadores:** `fc028b2` (docs)

## Files Created/Modified

- `src/http/services/rate-limiter.service.ts`: `evictOldestUnlocked`, `isSaturated`, el cupo de desalojos (`evicted`) y la espera de admisión (`msUntilAdmission`).
- `tests/unit/rate-limiter.service.test.ts`: el describe "D-77: el tope de claves nunca libera una clave bloqueada".
- `docs/limites-del-demo.md`: la sección "Tope de claves de los limitadores".

## Decisions Made

- Ver `key-decisions`. La más relevante es el cupo de desalojos, que se agregó como desvío (ver abajo).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Seguridad] La rotación en ronda seguía dando intentos ilimitados con solo desalojar claves libres**
- **Encontrado en:** Tarea 1, al escribir la fila de rotación.
- **Problema:** el diseño del plan acota la rotación en serie (K × L), pero no la rotación en ronda. Con K + 1 claves y un intento en cada una por vuelta, cada clave nueva desaloja una libre con un solo golpe, ninguna llega a bloquearse y los intentos no tienen límite. La fila en ronda daba 240 intentos evaluados con 40 claves, K = 3 y L = 5. Eso viola el criterio de éxito ("ninguna rotación de claves da intentos ilimitados") y la mitigación de T-03-69.
- **Arreglo:** se agregó un cupo de golpes desalojados por ventana. Una clave libre solo se desaloja si la suma de golpes ya desalojados más los suyos no pasa de `limit`. Si la pasaría, el limitador falla cerrado como con todas bloqueadas, y el cupo vence una ventana después del primer desalojo. El tope queda en K × L en serie y en (K + 1) × L en cualquier orden (50 005 con los valores de producción). Las filas del plan no cambian de resultado.
- **Archivos modificados:** `src/http/services/rate-limiter.service.ts`, `tests/unit/rate-limiter.service.test.ts` y `docs/limites-del-demo.md` (el cupo se explica en la sección nueva).
- **Commit:** `b2b623b`

**2. [Nota] La fila de rotación afirma `toBe(CLAVES_RASTREADAS * LIMITE)`**
- `CLAVES_RASTREADAS` vale 3, así que equivale al `toBe(3 * LIMITE)` del criterio y evita un número mágico.

**3. [Nota] Commits en `main`**
- `git.base-branch --is-protected main` responde true, pero el proyecto usa `branching_strategy: none` y el orquestador pidió ejecución secuencial sobre el árbol principal. Los 40 planes anteriores de la fase también se commitearon en `main`.

**Total de desvíos:** 1 auto-arreglado (Rule 2) y 2 notas. **Impacto:** el cupo agrega un estado de una ventana al limitador. La interfaz y los consumidores no cambian, y la memoria sigue acotada.

## Issues Encountered

- Biome pidió quitar una línea en blanco que dejó el reemplazo de la fila vieja. Se arregló con `biome check --write`.

## Verification

- `bun test tests/unit/rate-limiter.service.test.ts tests/architecture.test.ts tests/sin-comentarios.test.ts`: 97 pasan, 0 fallan.
- `bun test tests/http/topes.test.ts tests/http/acceso.test.ts tests/unit/rate-limiter.service.test.ts`: 78 pasan, 0 fallan.
- `bun run check`: tsc, tsc web, Biome y bun audit en verde.
- `bun test`: 2267 pasan, 1 se omite (ya estaba omitida), 0 fallan.
- El diff no toca `server.wiring.ts`, `access.route.ts`, `access.middleware.ts`, `rate-limit.middleware.ts` ni `chat.route.ts`.

## Next Phase Readiness

- WR-01 resuelto. Listo para el siguiente plan de cierre de brechas de la fase 03.

## Self-Check: PASSED

- FOUND: src/http/services/rate-limiter.service.ts, tests/unit/rate-limiter.service.test.ts, docs/limites-del-demo.md
- FOUND: b2b623b y fc028b2 en HEAD
