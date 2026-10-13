---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 07
subsystem: agent
tags: [loop, budget, iteration-cap, fake-llm, ca1, llm-05, d-51, d-53, d-60, d-63]
status: complete
requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-01: AgentEnv.maxIterations/sessionTokenBudget, MOTIVO_FIN, MENSAJE_AGENTE; 02-03: cierreDeterminista, LlamadaResumida, TEXTO_CIERRE.instruccionTope; 02-06: cerrarTurnoConCompuerta, crearAgentePrueba, crearLlmFalso, historialIntegro"
provides:
  - "presupuesto.service.ts: presupuestoAgotado, acumularUso, cierrePorPresupuesto (the only token arithmetic, D-51)"
  - "tope-iteraciones.service.ts: cerrarPorTope, the one no-tools summary call at the cap with its deterministic fallback (D-53)"
  - "DependenciasTurno.presupuestoTokens wired from AGENT_SESSION_TOKEN_BUDGET; ContextoTope and ResultadoTope types"
  - "ejecutarTurno: budget check at turn start and before every provider call, per-dispatch LlamadaResumida tracking, cap and budget endings through cerrarTurnoConCompuerta with no error event"
  - "casoDeLlamada exported from despacho-llamada.service.ts"
  - "tests/loop/presupuesto.test.ts and tests/loop/tope.test.ts"
affects: [02-08, 02-09, phase-03-api-sse]
actuals:
  tokens: 8935
  tasks: 2
  commits: 4
plan_head_before: 3fd6c4b42f43531e6b32c4f195e6cfc5c01354d4
plan_head_after: 2ed9de17ae7c04f4513bbb2c07920cf4bb4c3b96
tech-stack:
  added: []
  patterns:
    - "Cierre.porError separates endings already announced through an error event from endings whose text is the visible answer (final, tope_tokens, tope_iteraciones)"
    - "Turno.sesion is replaced through acumularUso after every successful call, so the saved session carries the running token total and the history stays the pre-turn one"
    - "The trailing cap instruction exists only in the summary request's array; it never enters turno.pasos or the saved history"
key-files:
  created:
    - src/loop/services/presupuesto.service.ts
    - src/loop/services/tope-iteraciones.service.ts
    - tests/loop/presupuesto.test.ts
    - tests/loop/tope.test.ts
  modified:
    - src/loop/types/turno.type.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/loop/services/despacho-llamada.service.ts
    - src/loop/wiring/agente.wiring.ts
    - tests/helpers/agente-prueba.helper.ts
    - tests/loop/trazador-agente.test.ts
key-decisions:
  - "An exhausted session answers at turn start with exactly MENSAJE_AGENTE.PRESUPUESTO_AGOTADO and zero provider calls; mid-turn it closes with PRESUPUESTO_AGOTADO plus cierreDeterminista of the turn's calls"
  - "When the budget runs out exactly at the iteration cap, the turn ends with cierreDeterminista and motivo tope_iteraciones (no summary call); the next turn reports the budget"
  - "The cap summary falls back to cierreDeterminista when the call fails, returns tool calls, or returns empty text; tool calls from the summary call are never executed nor stored"
  - "ResultadoTope carries the whole RespuestaLlm (not only uso) so the usage event keeps the real proveedor and modelo of the slot that answered"
requirements-completed: [AGT-01, LLM-05]
coverage:
  - id: D1
    description: "Session token budget: mid-turn tope_tokens with the completed summary and no error, zero-request turns after exhaustion, cumulative totalSesion, D-63.2 question after arming ec"
    requirement: LLM-05
    verification:
      - kind: integration
        ref: "tests/loop/presupuesto.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Iteration cap: maxIteraciones + 1 requests, tools disabled and trailing instruction only on the last one and never persisted, deterministic fallback on error, tool calls and no budget, summary usage counted, D-60 strip, D-63.2 question"
    requirement: AGT-01
    verification:
      - kind: integration
        ref: "tests/loop/tope.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Whole suite and static checks stay green after replacing the plan 02-01 TOPE_ITERACIONES error ending"
    verification:
      - kind: command
        ref: "bun run check && bun test (909 pass, 0 fail)"
        status: pass
    human_judgment: false
duration: 4 min
completed: 2026-10-13
---

# Phase 2 Plan 07: Session token budget and iteration cap Summary

**Every turn now has a cost limit. Once a session's token budget runs out it stops calling the provider and answers "Esta sesión agotó su presupuesto…" plus what was completed. At AGENT_MAX_ITERATIONS the model makes one summary call with tools disabled, and if that call fails the server writes a "Completé: … Falta: …" text itself. Both endings close through the confirmation gate and never raise an error event.**

## Performance

- **Duration:** 4 min (2026-10-13T19:58:18Z to 2026-10-13T20:02:33Z)
- **Tasks:** 2 (TDD, each with a RED and a GREEN commit)
- **Files:** 10 (4 created, 6 modified)

## Accomplishments

- `presupuesto.service.ts` is the only place that does token arithmetic. `acumularUso` replaces the inline `tokensUsados +=` from plan 02-01. It runs for loop calls and for the cap summary call through one `contarUso` generator, so every successful call is counted, including fallback-slot calls, which come back through the same `RespuestaLlm.uso`.
- `ejecutarTurno` checks `presupuestoAgotado` twice. The turn-start check runs before the instructions load and needs no LLM call. The second check runs before every provider call. Every budget ending closes with `MOTIVO_FIN.TOPE_TOKENS` through `cerrarTurnoConCompuerta`, so a package armed earlier in the turn still gets its question and `confirmation_required` (D-63.2).
- The turn builds a `LlamadaResumida` list from each dispatch result. The `HERRAMIENTA` value comes from matching the visible name against `Object.values(HERRAMIENTA)`, and the caso comes from the exported `casoDeLlamada`.
- `cerrarPorTope` replaces the plan 02-01 `TOPE_ITERACIONES` error ending. The cap text is shown as the answer and passes through `limpiarMarkdown` (D-60).

## Task Commits

1. **Task 1: Session token budget**: `c6f9539` (test, RED) and `628d39a` (feat, GREEN)
2. **Task 2: Iteration cap summary call**: `f9deae9` (test, RED) and `2ed9de1` (feat, GREEN)

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tests/loop/trazador-agente.test.ts builds DependenciasTurno by hand**
- **Found during:** Task 1
- **Issue:** The new required `presupuestoTokens` field broke the tracer test's hand-built dependencies at type-check time.
- **Fix:** Added `presupuestoTokens: PRESUPUESTO_TOKENS_SESION_POR_DEFECTO` there.
- **Files modified:** tests/loop/trazador-agente.test.ts
- **Commit:** 628d39a

**2. [Rule 1 - Design detail] ResultadoTope carries `respuesta: RespuestaLlm | null` instead of `uso | null`**
- **Found during:** Task 2
- **Issue:** The usage event needs `proveedor` and `modelo` as well as `uso`. With only `uso`, the event would lose which slot answered.
- **Fix:** `ResultadoTope = { texto, respuesta }`. The loop runs `contarUso(turno, respuesta)`, the same path as every other call.
- **Files modified:** src/loop/types/turno.type.ts, src/loop/services/tope-iteraciones.service.ts
- **Commit:** 2ed9de1

**3. [Rule 2 - Correctness] An empty summary text also falls back to cierreDeterminista**
- **Found during:** Task 2
- **Issue:** An ok summary call with null or blank text would have left the analyst with an empty answer at the cap.
- **Fix:** `resumenDelModelo` returns null for tool calls or blank text, and the deterministic text is used instead.
- **Files modified:** src/loop/services/tope-iteraciones.service.ts
- **Commit:** 2ed9de1

**4. [Cleanup] `fallar` lost its `motivo` parameter and `Turno.tokensUsados` was removed**
- **Found during:** Tasks 1 and 2
- **Issue:** After the change, no caller passed `motivo` (only error endings use `fallar`), and the running total now lives in `Turno.sesion.tokensUsados`.
- **Fix:** Removed both. `Cierre` gained `porError`, which replaces the old `esFinal` test that decided whether the closing text is emitted.
- **Commits:** 628d39a, 2ed9de1

**Total deviations:** 4 (1 blocking, 1 design detail, 1 correctness, 1 cleanup). **Impact:** none on the plan's contract. Every listed export and key link is present.

## Issues Encountered

None.

## Notes for Later Plans

- `CODIGO_AGENTE.TOPE_ITERACIONES` and `MENSAJE_AGENTE[TOPE_ITERACIONES]` are no longer emitted by the loop, but they stay in the code family. Plan 02-08 or Phase 3 can reuse or retire them.
- Requirements: AGT-01 and LLM-05 are marked complete. DEMO-03 stays open because plans 02-08 (CA5) and 02-09 also claim it. This plan covers its iteration-cap part.
- Plan 02-08 instruments the same provider-call path. The cap summary call goes through `deps.llm.enviar`, so the timeout, retry and fallback decorators and the logs apply to it automatically.

## Threat Flags

None. T-02-24 (cost denial of service) is mitigated and tested: each turn allows at most maxIteraciones tool rounds plus one summary call, the session budget counts every successful call, and an exhausted session makes zero calls.

## Next Phase Readiness

Ready for 02-08.

## Self-Check: PASSED

- FOUND: src/loop/services/presupuesto.service.ts, src/loop/services/tope-iteraciones.service.ts, tests/loop/presupuesto.test.ts, tests/loop/tope.test.ts
- FOUND commits: c6f9539, 628d39a, f9deae9, 2ed9de1 (all ancestors of HEAD)
- `grep -c "presupuestoAgotado(" ejecutar-turno.service.ts` = 2; `cerrarPorTope(` = 1; `cierreDeterminista(` in tope-iteraciones.service.ts = 1
- `bun run check` exits 0; `bun test`: 909 pass, 0 fail; `git status --porcelain -- reto-01` is empty
