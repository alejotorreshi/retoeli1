---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 17
subsystem: config
tags: [strings, error-messages, crearAgente, zod-env, tdd]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: crearAgente startup errors (CONFIGURACION_LLM_INVALIDA, PROVEEDOR_SIN_CLAVE) and the WR-13 https rule
provides:
  - TEXTO_AGENTE.conDetalle closes the composed message with exactly one period
  - Startup configuration errors without the open-session sentence
  - Exact-text contract for the startup configuration messages (G-02-19)
affects: [phase-03-api-health, AGT-05, LLM-02]

actuals:
  tokens: 1453
  tasks: 2
  commits: 4
plan_head_before: 8001003473a564140da786e8007090c0042ec7c7
plan_head_after: 040b847141970a3f2be5baed7e63393410466b8e

tech-stack:
  added: []
  patterns:
    - "Startup errors (raised by crearAgente before any session) are plain sentences; turn-time errors keep conSesionAbierta"

key-files:
  created: []
  modified:
    - src/config/strings.ts
    - tests/contract/env-agente.test.ts

key-decisions:
  - "G-02-19: TEXTO_AGENTE.conDetalle adds the final period only when the composed text (after trimEnd) lacks it, via endsWith, no regex"
  - "G-02-19: CONFIGURACION_LLM_INVALIDA and PROVEEDOR_SIN_CLAVE drop the open-session sentence because only crearAgente raises them, before any session exists; no recovery sentence added"

patterns-established:
  - "Startup vs turn-time wording: only errors raised inside a live turn promise that the session stays open"

requirements-completed: [AGT-05, LLM-02, DEMO-03]

coverage:
  - id: D1
    description: "crearAgente with an insecure LLM_BASE_URL returns CONFIGURACION_LLM_INVALIDA with the exact single-period literal, no open-session sentence and no key"
    requirement: AGT-05
    verification:
      - kind: unit
        ref: "tests/contract/env-agente.test.ts#una URL principal no segura da un solo punto final y no promete una sesión abierta"
        status: pass
    human_judgment: false
  - id: D2
    description: "An insecure LLM_FALLBACK_BASE_URL yields the same literal with the LLM_FALLBACK_BASE_URL detail"
    requirement: LLM-02
    verification:
      - kind: unit
        ref: "tests/contract/env-agente.test.ts#una URL de respaldo no segura da el mismo texto con su variable"
        status: pass
    human_judgment: false
  - id: D3
    description: "crearAgente without a key returns PROVEEDOR_SIN_CLAVE with the base sentence alone"
    requirement: AGT-05
    verification:
      - kind: unit
        ref: "tests/contract/env-agente.test.ts#sin clave da una sola oración, sin prometer una sesión abierta"
        status: pass
    human_judgment: false
  - id: D4
    description: "TEXTO_AGENTE.conDetalle ends with exactly one period whether or not the detail already has one; turn-time messages keep the open-session sentence"
    requirement: AGT-05
    verification:
      - kind: unit
        ref: "tests/contract/env-agente.test.ts#conDetalle termina en un solo punto"
        status: pass
      - kind: unit
        ref: "tests/contract/env-agente.test.ts#el error de turno conserva la sesión abierta"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 17: Startup configuration message wording (G-02-19) Summary

**The insecure-URL and no-key startup errors now read as one clean sentence each, ending in a single period and without the false "La sesión sigue abierta" promise. The exact texts are pinned in a contract test.**

## Performance

- **Duration:** about 2 min
- **Started:** 2026-10-14T01:11:10Z
- **Completed:** 2026-10-14T01:12:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `TEXTO_AGENTE.conDetalle` uses a private `cerrarOracion`, which adds `FIN_DE_ORACION` only when the trimmed composed text does not already end with it. This removes the "[::1].." double period.
- `MENSAJE_AGENTE[CONFIGURACION_LLM_INVALIDA]` and `MENSAJE_AGENTE[PROVEEDOR_SIN_CLAVE]` are now the base sentences alone. All 11 turn-time codes keep `conSesionAbierta`, and `grep -c "conSesionAbierta(" src/config/strings.ts` returns 12.
- The new describe "mensajes de configuración al crear el agente (WR-13, G-02-19)" pins these cases:
  - the primary-URL literal;
  - the fallback-URL literal;
  - the no-key literal;
  - both `conDetalle` rows;
  - the turn-time control for PROVEEDOR_NO_DISPONIBLE, TIEMPO_TURNO_AGOTADO and INSTRUCCIONES_NO_DISPONIBLES;
  - absence of the dummy key.

## Task Commits

1. **Task 1 (tracer): insecure-URL startup error**
   - RED `02c00c5` (test): the exact-literal test failed on "… La sesión sigue abierta; … [::1]..".
   - GREEN `7b15005` (fix).
2. **Task 2: startup errors drop the session claim, turn-time errors keep it**
   - RED `d3d82a0` (test): the no-key literal test failed.
   - GREEN `040b847` (fix).

## TDD Gate Compliance

- **Task 1 RED:** `bun test tests/contract/env-agente.test.ts --reporter=junit` exited 1 with 33 pass and 1 fail.
  - Classifier: `RED_EVIDENCE_OK` (target_test_failed, junit).
  - Semantic assessment: the target test ran and failed on the planned `toBe` assertion. Received "…no es válida. La sesión sigue abierta; puedes volver a intentarlo. Detalle: …[::1].." against the single-period literal. There was no load, fixture or syntax fault.
- **Task 1 GREEN:** the verify set passed (117 pass, 0 fail), and `bun run check` exited 0.
  - The acceptance probe printed a line that ends in "[::1].", with no ".." and no "sigue abierta".
  - Tracer gate: end-of-phase mode with automated-only verify, re-run and passed, so expansion continued.
- **Task 2 RED:** the same command exited 1 with 40 pass and 1 fail.
  - Classifier: `RED_EVIDENCE_OK`.
  - Semantic assessment: the target test "sin clave da una sola oración, sin prometer una sesión abierta" failed on `toEqual`, because the mensaje still carried the open-session sentence.
  - The fallback-literal and conDetalle rows already passed. That is expected, because Task 1's conDetalle fix covers them and Task 2 only pins them.
- **Task 2 GREEN:** the verify set passed (159 pass, 0 fail). The full `bun test` run gave 1120 pass, 1 skip (the pre-existing live test in tests/live/agente-en-vivo.test.ts) and 0 fail. `bun run check` exited 0.
- **REFACTOR:** none needed.

## Files Created/Modified

- `src/config/strings.ts`: added `cerrarOracion` and made `TEXTO_AGENTE.conDetalle` add the period only when it is missing. Both startup entries are no longer wrapped.
- `tests/contract/env-agente.test.ts`: added the G-02-19 describe with the exact-text contract.

## Decisions Made

- The period check runs on the composed text after trimEnd. That composed text ends with the detail, so the check is equivalent to checking the detail as the plan specifies. It also handles trailing whitespace in the detail. It uses `endsWith`, not a regex (G11).
- No recovery hint was added, as the plan specified.

## Deviations from Plan

**1. [Process] Separate RED and GREEN commits per task**
- The plan said to commit each task as `fix(02-17)`.
- Following the TDD reference, each task got a `test(02-17)` RED commit before its `fix(02-17)` GREEN commit, so each task has two commits.
- No scope change.

**Total deviations:** 1, process only.
**Impact on plan:** none.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- G-02-19 is closed. Phase 3 can show these startup messages through `/api/health` or a UI banner without implying that a chat session exists.

## Self-Check: PASSED

- FOUND: src/config/strings.ts, tests/contract/env-agente.test.ts
- FOUND commits: 02c00c5, 7b15005, d3d82a0, 040b847
- `git status --porcelain -- reto-01` prints nothing.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-14*
