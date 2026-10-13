---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 02
subsystem: agent
tags: [sessions, composition-root, ttl, lru, lock, clock, d-57, d-58]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-01 tracer: ejecutarTurno, AlmacenSesiones port, parseAgentEnv/readAgentEnv, OpenAI-compatible adapter, instructions loader"
provides:
  - "createMemorySessionStore: in-memory AlmacenSesiones with 2 h TTL, LRU over AGENT_MAX_SESSIONS and a per-session lock"
  - "crearAgente: the agent composition root (env -> adapter, tools, instructions, sessions, clock), never throws"
  - "clockFromToolEnv: one clock selection shared by entorno.wiring and agente.wiring"
  - "ejecutarTurno: SESION_OCUPADA lock path, expiry notice, stable prefix plus a separate date system message"
  - "tests/helpers/fetch-falso.helper.ts: recording fake fetch with spike-shaped bodies and deferred responses"
affects: [02-03, 02-04, 02-05, 02-06, 02-07, 02-08, 02-09, phase-03-api-sse]

actuals:
  tokens: 15496
  tasks: 2
  commits: 4
plan_head_before: 3a2aae9c6700519e01562659333a3c5dae9c5d00
plan_head_after: ebd61474f0cbebb57a41792b3662979d5ae66b7c

tech-stack:
  added: []
  patterns:
    - "Session store = one insertion-ordered Map; a touch is delete + set (LRU); expiry is swept lazily on abrir and guardar, no timers"
    - "The turn takes the session lock after abrir and releases it in finally, after saving the history and before yielding turn_end"
    - "The model's date comes from a Reloj that re-reads the tool env on each call, so the model and the tools agree"

key-files:
  created:
    - src/infra/types/session-store.type.ts
    - src/infra/sessions/memory-session-store.adapter.ts
    - src/loop/types/agente.type.ts
    - src/loop/wiring/agente.wiring.ts
    - tests/unit/memory-session-store.adapter.test.ts
    - tests/helpers/fetch-falso.helper.ts
    - tests/helpers/types/fetch-falso.type.ts
    - tests/loop/sesion.test.ts
  modified:
    - src/infra/clock/clock.adapter.ts
    - src/tools/wiring/entorno.wiring.ts
    - src/loop/types/turno.type.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/config/strings.ts
    - tests/loop/trazador-agente.test.ts
    - tests/unit/clock.adapter.test.ts

key-decisions:
  - "abrir registers a new session in the store immediately, so ocupar right after abrir succeeds; the just-created session is never the LRU victim"
  - "A locked session is neither swept by TTL nor evicted by LRU"
  - "The lock is released after the history is saved and before turn_end is yielded, so a consumer that stops at turn_end never leaves the session locked"
  - "A rejected concurrent turn never calls liberar, so it cannot release the lock held by the turn in flight"
  - "CONFIGURACION_LLM_INVALIDA carries the catalog message plus the formatearIssues detail via TEXTO_AGENTE.conDetalle"

patterns-established:
  - "Tests reach the agent only through crearAgente with an explicit fuenteEntorno and an injected fetch (fetch is a required field)"
  - "Shared fake fetch: crearFetchFalso(respuestas) with {estado?, cuerpo, demora?}; cuerpoConHerramientas / cuerpoConTexto build the bodies"

requirements-completed: [AGT-04, AGT-02, LLM-01]

coverage:
  - id: D1
    description: "Session store: new, live, unknown, malformed and expired ids; LRU eviction skipping locked sessions; ocupar/liberar; lazy sweep; independent stores"
    requirement: AGT-04
    verification:
      - kind: unit
        ref: "tests/unit/memory-session-store.adapter.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "crearAgente returns the agent with proveedor and modelo from env, PROVEEDOR_SIN_CLAVE without a key, CONFIGURACION_LLM_INVALIDA without the key marker, and makes no request at creation"
    requirement: LLM-01
    verification:
      - kind: integration
        ref: "tests/loop/sesion.test.ts#crearAgente compone el agente desde el entorno (LLM-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "messages[1] is TEXTO_CONTEXTO.fecha(FECHA_EJECUCION) and messages[0] is byte-identical across turns, with no date and no session id"
    requirement: AGT-02
    verification:
      - kind: integration
        ref: "tests/loop/sesion.test.ts#messages[1] es la fecha y el prefijo messages[0] es idéntico entre turnos"
        status: pass
    human_judgment: false
  - id: D4
    description: "Unknown, malformed and TTL-expired ids start a new server-generated session with the expiry notice as the first text event"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/sesion.test.ts#sesiones perdidas y expiradas (D-58)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A concurrent turn yields turn_start, SESION_OCUPADA and turn_end and leaves the history intact; an abandoned generator releases the lock"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/sesion.test.ts#dos turnos nunca se intercalan sobre una sesión (AGT-04)"
        status: pass
    human_judgment: false
  - id: D6
    description: "co-industrias-delta runs through crearAgente exactly like the tracer, and the second turn replays an intact history"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/trazador-agente.test.ts#el mismo caso pasa igual por crearAgente con el fetch inyectado"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-13
status: complete
---

# Phase 2 Plan 02: Sessions, agent composition and the date message Summary

**`crearAgente` builds the whole agent from env in one place. Sessions live in an in-memory store with a 2 h TTL, LRU eviction and a per-session lock. Every turn tells the model the effective date in its own system message, after a byte-stable prefix.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-13T19:14:36Z
- **Completed:** 2026-10-13T19:20:30Z
- **Tasks:** 2
- **Files modified:** 15 (8 created, 7 modified)

## Accomplishments

- `createMemorySessionStore` implements `AlmacenSesiones` with one Map and no timers. Unknown, malformed (`PATRON_SESION`) or expired ids are never adopted. The store issues a new id with `expirada: true` instead, so a guessed id cannot reach another session (T-02-08).
- `ejecutarTurno` takes the lock with `ocupar` right after `abrir`. A second turn on the same id yields `turn_start`, `error SESION_OCUPADA` and `turn_end (motivo error)`, and it never writes the history (T-02-07). `liberar` runs in `finally`, so `return()` on the generator also frees the session.
- The turn's system messages are now `[prompt + conocimiento, TEXTO_CONTEXTO.fecha(reloj.hoy())]`. The prefix contains no date and no session id, so it stays cacheable (D-57).
- `crearAgente` reads `AgentEnv` once, from `parseAgentEnv(fuenteEntorno)` or `readAgentEnv()`. It never throws: without a key it returns `PROVEEDOR_SIN_CLAVE`, and with an invalid config it returns `CONFIGURACION_LLM_INVALIDA` with the TEXTO_ENV issue detail. `fetch` is a required option, so a test can never reach the network by accident.
- `clockFromToolEnv` replaces the private `relojDe` in `entorno.wiring.ts` without changing behavior. The agent's clock re-reads the tool env on every call, so the model and the tools agree on the date.

## Task Commits

1. **Task 1: Session store with TTL, LRU and lock (TDD)**
   - RED: `16fb7e5` (test)
   - GREEN: `9677b42` (feat)
2. **Task 2: crearAgente, date message, session lock and expiry notice (TDD)**
   - RED: `462a4be` (test)
   - GREEN: `ebd6147` (feat)

No REFACTOR commit was needed.

## Files Created/Modified

- `src/infra/types/session-store.type.ts`: SessionStoreOptions.
- `src/infra/sessions/memory-session-store.adapter.ts`: createMemorySessionStore.
- `src/infra/clock/clock.adapter.ts`: clockFromToolEnv.
- `src/tools/wiring/entorno.wiring.ts`: uses clockFromToolEnv (relojDe removed).
- `src/loop/types/agente.type.ts`: OpcionesAgente, Agente, CreacionAgente.
- `src/loop/types/turno.type.ts`: DependenciasTurno.reloj.
- `src/loop/services/ejecutar-turno.service.ts`: lock path, expiry notice and two system messages.
- `src/loop/wiring/agente.wiring.ts`: crearAgente.
- `src/config/strings.ts`: TEXTO_AGENTE.conDetalle.
- `tests/helpers/fetch-falso.helper.ts` and `tests/helpers/types/fetch-falso.type.ts`: crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto, diferido, esperarPedidos.
- `tests/loop/sesion.test.ts`, `tests/unit/memory-session-store.adapter.test.ts`, `tests/unit/clock.adapter.test.ts`, `tests/loop/trazador-agente.test.ts`.

## Decisions Made

See `key-decisions` in the frontmatter. The one that changes observable order: the lock is released after the history is saved but before `turn_end` is yielded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The just-created session cannot be evicted by its own creation**
- **Found during:** Task 1
- **Issue:** Suppose every other session is locked and the store is at capacity. Then LRU eviction after `abrir(null)` could pick the new session itself, and the turn's `ocupar` would then fail with a misleading SESION_OCUPADA.
- **Fix:** The eviction skips the id that was just stored.
- **Files modified:** src/infra/sessions/memory-session-store.adapter.ts
- **Commit:** 9677b42

**2. [Rule 2 - Missing critical] Config error detail string centralized**
- **Found during:** Task 2
- **Issue:** The plan asks for "catalog message plus formatearIssues detail", but CLAUDE.md requires every human-facing text to live in strings.ts.
- **Fix:** Added `TEXTO_AGENTE.conDetalle(mensaje, detalle)`.
- **Files modified:** src/config/strings.ts
- **Commit:** ebd6147

**3. [Rule 3 - Test infrastructure] Deferred-response helpers**
- **Found during:** Task 2
- **Issue:** The concurrency scenario needs turn A held mid-fetch.
- **Fix:** Added `diferido()` and `esperarPedidos()` to the fake-fetch helper, plus a raw `texto` and lowercase `cabeceras` on each recorded request. These are test-only.
- **Files modified:** tests/helpers/fetch-falso.helper.ts, tests/helpers/types/fetch-falso.type.ts
- **Commit:** 462a4be

**Total deviations:** 3 auto-fixed. **Impact:** None on scope.

## Issues Encountered

None.

## Known Stubs

None that block this plan's goal. These limits are intentional and owned by later plans:
- The fallback slot is resolved by env but not composed into the adapter (plan 02-08 adds the decorators and the fallback).
- `sessionTokenBudget`, `turnDeadlineMs`, `timeoutMs` and `maxRetries` are read but not enforced yet (plans 02-04/02-07/02-08).

## Threat Flags

None beyond the plan's threat model. T-02-06 to T-02-09 are mitigated and tested as planned.

## User Setup Required

None.

## Next Phase Readiness

Plans 02-03 to 02-09 can build on `crearAgente`, extend `DependenciasTurno`, and drive scenarios with `crearFetchFalso`. Phase 3 can call `crearAgente({ directorio, fetch: globalThis.fetch })` and report degraded mode when it returns `ok: false`.

## Verification

- `bun run check` (tsc, Biome, bun audit): pass.
- `bun test`: 638 pass, 0 fail (615 before this plan, plus 23 new).
- `git status --porcelain -- reto-01`: empty.
- `grep -n "setTimeout\|setInterval" src/infra/sessions/memory-session-store.adapter.ts`: nothing.
- `grep -n "fetch?" src/loop/types/agente.type.ts`: nothing. `grep -n "fetch:"`: one line.
- `readAgentEnv|parseAgentEnv` appears only in src/config/env.ts and src/loop/wiring/agente.wiring.ts.
- `relojDe` is absent from entorno.wiring.ts, and the Phase 1 golden and e2e tests pass.

## Self-Check: PASSED
