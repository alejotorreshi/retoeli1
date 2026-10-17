---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 12
subsystem: loop
tags: [sessions, lock, lease, fencing-token, bun-test, WR-03]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-02 in-memory session store with per-session lock; 02-11 ejecutar-turno.service.ts after the CR-03 truncation fix"
provides:
  - "AlmacenSesiones port with ocupar(id, plazoMs): string | null, liberar(id, candado) and guardar(sesion, candado): boolean"
  - "Leased, fenced per-session lock {token, since, leaseMs} in createMemorySessionStore, without timers"
  - "MARGEN_CANDADO_SESION_MS = 30_000; the turn leases for AGENT_TURN_DEADLINE_MS + margin"
  - "turn_end log line carries sesionGuardada"
affects: [03-http-sse, phase-3 SSE consumer, AGT-04, DEMO-03]

actuals:
  tokens: 7357
  tasks: 2
  commits: 3
plan_head_before: 0c1c9ba6fde79e0cc5735a5ef7654ae9ee9f1828
plan_head_after: 8ed350ed08d27f206994e5ef7a6fd06fedab7d82

tech-stack:
  added: []
  patterns:
    - "Lease plus fencing token for in-memory locks: a lock expires by time, not by consumer cooperation, and only the current token may save or release"
    - "Store writes return whether they stored, and the turn logs the outcome"

key-files:
  created: []
  modified:
    - src/application/types/puertos-agente.type.ts
    - src/infra/sessions/memory-session-store.adapter.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/config/constants/agent.constants.ts
    - tests/unit/memory-session-store.adapter.test.ts
    - tests/loop/sesion.test.ts

key-decisions:
  - "The session lock is a lease of AGENT_TURN_DEADLINE_MS + MARGEN_CANDADO_SESION_MS (30 s), passed per ocupar call. SessionStoreOptions and every place that builds the store are unchanged, and no new env knob was added"
  - "Fencing token from options.newId(): liberar and guardar act only when the token matches, so a resumed stale turn can neither free the new holder's lock nor overwrite its history or gate state"
  - "A lease is held while now - since <= leaseMs (boundary inclusive). An expired lease no longer protects the entry from takeover, TTL sweep or LRU eviction"
  - "anotarFin takes a {needsConfirmation, abandonado, sesionGuardada} object instead of positional booleans"

patterns-established:
  - "Lease + fencing token for any per-key lock that a non-cooperating consumer can strand"

requirements-completed: [AGT-04, DEMO-03]

coverage:
  - id: D1
    description: "Leased, fenced session lock in the store: token on ocupar, null while held, takeover after the lease, stale liberar and guardar rejected, held lease blocks TTL and LRU, expired one does not"
    requirement: AGT-04
    verification:
      - kind: unit
        ref: "tests/unit/memory-session-store.adapter.test.ts#el candado de sesión es un plazo con ficha (AGT-04, WR-03)"
        status: pass
      - kind: unit
        ref: "tests/unit/memory-session-store.adapter.test.ts#almacén de sesiones en memoria (D-58)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A consumer that stops iterating without return() blocks the session only until deadline plus margin, and the lease follows AGENT_TURN_DEADLINE_MS"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/sesion.test.ts#un consumidor que deja de iterar sin return() bloquea la sesión solo mientras dura el plazo"
        status: pass
      - kind: integration
        ref: "tests/loop/sesion.test.ts#el plazo del candado sigue a AGENT_TURN_DEADLINE_MS"
        status: pass
    human_judgment: false
  - id: D3
    description: "A stale holder that resumes neither releases the new holder's lock nor overwrites its history, and its turn_end logs sesionGuardada false"
    requirement: DEMO-03
    verification:
      - kind: integration
        ref: "tests/loop/sesion.test.ts#un titular vencido que se reanuda no libera ni pisa la sesión del nuevo titular"
        status: pass
      - kind: integration
        ref: "tests/loop/sesion.test.ts#un titular vencido que termina después del nuevo titular no recupera su historial"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-13
status: complete
---

# Phase 02 Plan 12: Leased, fenced session locks (WR-03) Summary

**The session lock is now a lease of the turn deadline plus 30 s, carrying a fencing token. A consumer that stops pulling without return() frees the session once the lease ends, and a resumed stale turn cannot release or overwrite the new holder's session.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-13T22:03:12Z
- **Completed:** 2026-10-13T22:08:22Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- `AlmacenSesiones` now has `ocupar(id, plazoMs): string | null`, `liberar(id, candado)` and `guardar(sesion, candado): boolean`. The lease is passed on each `ocupar` call, so `SessionStoreOptions`, `agente.wiring.ts` and the test helpers did not change.
- `createMemorySessionStore` keeps `lock: {token, since, leaseMs} | null`. `isHeld` replaces the old `locked` flag in the TTL sweep and in LRU eviction. The store uses no timers.
- `ejecutarTurno` takes the lease for `deps.deadlineMs + MARGEN_CANDADO_SESION_MS`, keeps its token in `Turno.candado`, and saves and releases with it. The `turn_end` log line now has `sesionGuardada`.
- WR-03 is closed for the abandoned-consumer path that Phase 3's SSE layer will exercise.

## Task Commits

1. **Task 1 (RED): failing store tests for leased, fenced locks** - `b46881f` (test)
2. **Task 1 (GREEN): leased, fenced lock from the port through the store to the turn** - `b416a8b` (fix)
3. **Task 2: loop tests through crearAgente for abandoned and stale turns** - `8ed350e` (test)

## TDD Gate Compliance

- **RED** (`b46881f`): the store tests were rewritten for the new signatures, and the lease and fencing tests were added. Run: `bun test tests/unit/memory-session-store.adapter.test.ts --reporter=junit`, which exited 1 with 14 fail and 5 pass. The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`, format junit) for the target `el titular vencido no puede pisar la sesión; el nuevo titular sí guarda`. Semantic assessment: the target ran and failed in the planned assertion. The old `ocupar` returned boolean `true` where a string token was expected, so `tomar` threw "se esperaba un candado". There were no syntax, import or fixture faults. The 5 passing tests do not touch the lock (abrir, live, unknown and malformed ids, LRU order), as expected.
- **GREEN** (`b416a8b`): the plan specifies `fix(02-12)` rather than `feat(02-12)` because WR-03 is a code-review bug. The whole verify set passes: 109 pass, 0 fail.
- **REFACTOR:** none needed.
- **Task 2** adds tests only. It proves Task 1's behavior through `crearAgente`, so its tests passed on first run. Their sensitivity was checked with three temporary mutants of the store, each reverted with `git checkout -- <file>`:
  - `liberar` ignoring the token: caught by the stale-holder test.
  - `guardar` ignoring the token: caught by the "termina después" test.
  - Lock with no lease: all 4 WR-03 tests fail.

## Files Created/Modified
- `src/application/types/puertos-agente.type.ts`: the leased, fenced `AlmacenSesiones` port.
- `src/infra/sessions/memory-session-store.adapter.ts`: the lease (`isHeld`), takeover, token-checked `liberar` and `guardar`.
- `src/config/constants/agent.constants.ts`: `MARGEN_CANDADO_SESION_MS = 30_000`.
- `src/loop/services/ejecutar-turno.service.ts`: `Turno.candado`, the lease of deadline plus margin, `guardarSesion` returning a boolean, `sesionGuardada` in `turn_end`.
- `tests/unit/memory-session-store.adapter.test.ts`: all existing tests ported, plus a WR-03 describe with 5 tests.
- `tests/loop/sesion.test.ts`: a WR-03 describe with 4 tests and the helpers `avanzarHasta`, `enInstante`, `esOcupada`, `contenidosDe` and `guionConHerramientaPendiente`.

## Decisions Made
- The lease covers deadline plus margin (30 s) and is configurable only through the existing `AGENT_TURN_DEADLINE_MS`.
- The token comes from `options.newId()`, which is `crypto.randomUUID` in production, so no new option was added.
- The lease boundary is inclusive: the lock is still held at exactly `since + leaseMs` and free 1 ms later. The loop test pins this through the env deadline.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical test] Added a fourth loop test for stale-write fencing**
- **Found during:** Task 2
- **Issue:** In the plan's stale-holder scenario, B saves after A's rejected write. A mutant whose `guardar` ignores the token therefore still passed, because B's later save overwrote A's illegal write. The scenario did not pin the T-02-37 stale-overwrite rule through `crearAgente`.
- **Fix:** Added "un titular vencido que termina después del nuevo titular no recupera su historial". B completes before A resumes, C's history must exclude A, and the captured `turn_end` lines must show `sesionGuardada` `[true, false, true]`. The plan's three scenarios are kept as written.
- **Files modified:** tests/loop/sesion.test.ts
- **Verification:** the `guardar` mutant now fails this test, and the real implementation passes.
- **Committed in:** 8ed350e

**2. [Rule 1 - Test port] Sweep test triggers its second sweep through a held guardar**
- **Found during:** Task 1
- **Issue:** The old test stored an unknown id with `guardar` to trigger a sweep, which the fenced `guardar` now rightly rejects.
- **Fix:** The first sweep is triggered by `abrir(null)` as the plan says. The second goes through a `guardar` with a valid long lease, so the test still proves that `guardar` sweeps. A separate test covers that `guardar` without a valid token stores nothing.
- **Files modified:** tests/unit/memory-session-store.adapter.test.ts
- **Committed in:** b46881f

---

**Total deviations:** 2 auto-fixed (1 missing critical test, 1 test port).
**Impact on plan:** Both strengthen coverage of the planned behavior. There is no scope creep and no production change beyond the plan.

## Issues Encountered
- The executor's pre-commit HEAD assertion reports `main` as a protected branch. This project runs with `branching_strategy: none`, the orchestrator dispatched this plan sequentially on `main`, and plans 02-10 and 02-11 committed there too, so the commits were made on `main` as instructed.

## Threat Flags

None. The change narrows existing surface (T-02-36 and T-02-37 mitigated as planned) and adds no new endpoint, file access or trust boundary.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness
- Phase 3's SSE layer can drop a consumer without calling `return()`. The session becomes usable again after `AGENT_TURN_DEADLINE_MS + 30 s` and keeps its saved history.
- Calling `iterator.return()` on disconnect is still preferable, because it frees the session at once.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-13*

## Self-Check: PASSED
- All 6 modified files exist on disk.
- Commits b46881f, b416a8b and 8ed350e are ancestors of HEAD (3 commits measured from plan_head_before).
- `bun run check` exits 0. `bun test` gives 1032 pass, 1 skip and 0 fail; the skip is pre-existing. `git status --porcelain -- reto-01` is empty.
