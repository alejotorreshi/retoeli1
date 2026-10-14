---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 15
subsystem: agent-gate
tags: [compuerta, confirmacion, simular_envio, idempotencia, bun-test, gap-closure]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-06 gate fold (aplicarEvento/cerrarTurno), paquetesConocidos, CA4 per-case routing; 02-13 recuperarAutorizado"
provides:
  - "CasosEnviados type and EntradaCierreCompuerta.enviados"
  - "enviadosTrasEventos(enviados, eventos) sharing the per-event step with cerrarTurno"
  - "Sent-aware cerrarTurno: a BLOQUEADO of a sent case adds nothing pending; ARMADO clears the mark"
  - "Sesion.casosEnviados, started empty, passed at closing and persisted per turn (also for abandoned turns)"
  - "Rewritten AGT-04 four-turn loop test, the same-turn variant and the D-63.4 re-arm control"
  - "D-63.4 in 02-CONTEXT.md and the 02-06/02-15 decision lines in STATE.md"
affects: [phase-03-ui-confirmation-card, ENV-02, ENV-03, AGT-04, DEMO-03, IN-06]

actuals:
  tokens: 5822
  tasks: 2
  commits: 3
plan_head_before: 6cec1a2b8b1af2f614990623300a34876c4a228e
plan_head_after: 27ffc1331a293da8fc541b3661a3694e8292ea04

tech-stack:
  added: []
  patterns:
    - "Session-scoped sent set folded with the same private per-event step as the pending map, so closing and persisting cannot drift"

key-files:
  created: []
  modified:
    - src/domain/types/compuerta.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/loop/types/turno.type.ts
    - src/loop/services/guardado-turno.service.ts
    - src/loop/services/ejecutar-turno.service.ts
    - tests/unit/compuerta.policy.test.ts
    - tests/loop/compuerta-casos.test.ts
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md
    - .planning/STATE.md

key-decisions:
  - "D-63.4: a blocked simular_envio never re-opens a case already sent in the session; only a new successful armar_paquete opens another cycle (clears the mark, asks again)"
  - "The sent case stays in paquetesConocidos so CA4 per-case log routing and the gate_* caso keep working; the sent state lives apart in Sesion.casosEnviados"
  - "cerrarCompuerta passes the turn-start casosEnviados; this turn's sends travel in the events, and guardarSesion persists enviadosTrasEventos even for aborted or abandoned turns"

patterns-established:
  - "One private fold (plegarEventos/aplicarEvento) feeds both cerrarTurno and enviadosTrasEventos"

requirements-completed: [ENV-02, ENV-03, AGT-04, DEMO-03]

coverage:
  - id: D1
    description: "A blocked retry of an already-sent case does not re-open it, in the same turn or in a later turn; a never-sent known case still re-opens (D-63.1)"
    requirement: ENV-02
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#cerrarTurno con casos ya enviados (G-02-3, D-63.4)"
        status: pass
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#enviadosTrasEventos (G-02-3, D-63.4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four-turn AGT-04: after a send, two more 'envía' turns stay blocked, needsConfirmation false, text 'Hecho.', one ok send line, unchanged ENVIO-SIMULADO.md, CA4 lines in out/ec-corp-andina/log.jsonl and two gate_blocked lines with caso ec"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#AGT-04 (G-02-3, D-63.4): un caso ya enviado no se reabre ni se envía dos veces"
        status: pass
    human_judgment: false
  - id: D3
    description: "Same-turn variant: two simular(ec) in the confirmed turn end without confirmation_required and the next 'envía' sends nothing"
    requirement: ENV-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#dos simular(ec) en el turno confirmado: el primero envía, el segundo queda bloqueado y ec no se reabre (G-02-3)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Re-arm control: a new armar_paquete after the send asks again, clears casosEnviados, and the next 'envía' writes a second ok send"
    requirement: DEMO-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-63.4: un armado nuevo tras el envío abre otro ciclo"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-63.4 recorded in 02-CONTEXT.md and STATE.md 02-06/02-15 lines"
    verification:
      - kind: other
        ref: "grep -c 'UAT G-02-3' .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 15: Sent cases stay sent (G-02-3) Summary

**The gate now remembers sent cases in `Sesion.casosEnviados`. A blocked `simular_envio` retry can no longer re-open an already-sent case, so a later "envía" never writes a second `ENVIO-SIMULADO.md`. Only a new successful `armar_paquete` opens another cycle.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-14T01:05:42Z
- **Completed:** 2026-10-14T01:09:30Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto; both tdd)
- **Files modified:** 9

## Accomplishments
- `CasosEnviados` and `EntradaCierreCompuerta.enviados`. In the gate fold, ENVIADO adds the case to a session-scoped sent set and ARMADO removes it. A BLOQUEADO for a sent case now returns early, so it adds nothing pending.
- `enviadosTrasEventos(enviados, eventos)` reuses the same private `plegarEventos`/`aplicarEvento` step as `cerrarTurno`. It keeps first-send order and never mutates its input.
- `Sesion.casosEnviados` starts as `[]` in `sesionVacia`. `cerrarCompuerta` passes the turn-start value, and `guardarSesion` persists `enviadosTrasEventos(...)`. `guardarInterrumpido` goes through both, so a send made by an abandoned turn is still recorded.
- Tests:
  - 5 new `cerrarTurno` rows and 9 `enviadosTrasEventos` rows (8 table rows plus the no-mutation test).
  - AGT-04 rewritten as a four-turn test that also checks the CA4 per-case lines and the `gate_blocked` lines with caso ec.
  - The D-38 same-turn variant.
  - The D-63.4 re-arm control.
- D-63.4 is recorded in 02-CONTEXT.md, and the STATE.md 02-06 note is rewritten with a new 02-15 line.

## Task Commits

1. **Task 1: A case already sent stays sent; a blocked retry no longer re-opens it** - `566ec32` (fix)
2. **Task 2: Same-turn retry and re-arm control tests** - `c71924d` (test)
3. **Task 2: D-63.4 decision record** - `27ffc13` (docs)

## TDD Evidence

- **RED (Task 1):** I wrote the unit rows and the AGT-04 test first and ran them against the unchanged code: 4 failures.
  - Three were `cerrarTurno` rows: the same-turn retry, the later-turn retry, and the never-sent CO row, which got `pendiente(EC, CO)` because `enviados` was ignored.
  - The fourth was AGT-04. It failed at `expect(confirmaciones(turno3)).toEqual([])`: the old code emitted `confirmation_required` for ec-corp-andina in turn 3.
  - Semantic assessment: each target failed on its planned assertion, for the G-02-3 reason (the sent case re-opened). None of the failures were load, syntax or fixture errors.
  - The `enviadosTrasEventos` rows were added after this run. Before the export existed they could only have failed at import, so they have no separate RED run.
- **GREEN (Task 1):** After the policy, type and loop changes, the 170 verify-set tests pass and `bun run check` exits 0.
- **Task 2 guard check:** Task 1 had already landed, so I could not get an ordinary RED for the Task 2 tests. Instead I deleted the `if (enviados.has(evento.caso)) return;` line, ran the tests, and restored the file with `git checkout -- <file>`.
  - Both the same-turn variant and AGT-04 failed without that line, so they do guard the fix.
  - The re-arm test is a control. It passes both with and without the line, by design.
- **Commit shape:** The plan prescribes one `fix(02-15)` commit with exactly seven files for Task 1, so there is no separate `test(...)` RED commit for Task 1. RED was observed locally and is documented here.

## Files Created/Modified
- `src/domain/types/compuerta.type.ts`: `CasosEnviados`, `EntradaCierreCompuerta.enviados`
- `src/domain/policies/compuerta.policy.ts`: sent-aware `aplicarEvento`, `plegarEventos`, exported `enviadosTrasEventos`
- `src/loop/types/turno.type.ts`: `Sesion.casosEnviados`
- `src/loop/services/ejecutar-turno.service.ts`: `sesionVacia` starts `casosEnviados: []`
- `src/loop/services/guardado-turno.service.ts`: passes `enviados` at closing and persists `casosEnviados`
- `tests/unit/compuerta.policy.test.ts`: `cierre` helper default `enviados: []`, plus the two new describes
- `tests/loop/compuerta-casos.test.ts`: rewritten AGT-04, extended D-38 same-turn test, D-63.4 re-arm describe
- `.planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md`: D-63 now announces four readings and adds item 4
- `.planning/STATE.md`: the 02-06 note is rewritten and a 02-15 decision line is added

## Decisions Made
- I followed D-63.4 as the plan specifies. The sent case stays in `paquetesConocidos`, because CA4 routing and the `gate_*` caso depend on it.
- `enviadosTrasEventos` ignores `abortado`. A send that already happened is recorded even if the turn later aborts.

## Deviations from Plan

None in scope. Two notes on execution:
- **Commits on `main`:** The executor's protected-branch check flags `main`. This repository has only `main`, uses `branching_strategy: none`, and every earlier plan committed there. The orchestrator also dispatched this run sequentially on the main working tree. So the commits landed on `main`, as in all previous plans, and nothing was pushed.
- **Biome:** I ran `bunx biome check --write .`, as the plan asks. It reformatted only the two test files of this task before the Task 1 commit.

## Issues Encountered
None.

## Known Stubs
None.

## Threat Flags
None. T-02-43 and T-02-44 are mitigated as planned and covered by AGT-04 and the unit rows. T-02-45 is accepted.

## User Setup Required
None.

## Next Phase Readiness
- G-02-3 is closed. The disposition ledger entry IN-06 is left for the orchestrator to reconcile.
- The Phase 3 UI can rely on `needsConfirmation: false` and on no `confirmation_required` event after a blocked retry of a sent case.
- Gap-closure plans 02-16 to 02-18 are still pending.

## Verification
- `bun test`: 1112 pass, 1 skip (live), 0 fail.
- `bun run check`: exit 0.
- `git status --porcelain -- reto-01`: empty.

## Self-Check: PASSED
- Key files exist on disk. Commits `566ec32`, `c71924d` and `27ffc13` are ancestors of HEAD.
- The Task 1 commit contains exactly the seven planned files.
- Acceptance greps: `enviadosTrasEventos` export 1, `CasosEnviados` type 1, `enviadosTrasEventos(` call in the saving service 1, `enviados: turno.sesion.casosEnviados` 1, `casosEnviados: []` 1, `D-63.4` in the loop test 2, `UAT G-02-3` in CONTEXT 1, `02-15:` in STATE 1.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-14*
