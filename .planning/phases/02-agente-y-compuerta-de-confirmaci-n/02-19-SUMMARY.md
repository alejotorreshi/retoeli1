---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 19
subsystem: confirmation-gate
tags: [compuerta, confirmacion, d-63.6, cr-01, prompt, bun-test]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "abrirTurno/cerrarTurno/recuperarAutorizado gate (02-03, 02-13, 02-15), cierreConPregunta server question (02-09, 02-18), confirmation classifier (02-16)"
provides:
  - "D-63.6 abrirTurno: only rechaza cancels; otro, falta_caso and a non-pending confirma keep every pending case; confirming one of several keeps the others"
  - "recuperarAutorizado returns an unused authorized case to pending on every ending except abortado"
  - "crearTurno seeds arrastrados from pendientesDe(apertura.siguiente), so every non-confirming turn ends with the server question and confirmation_required"
  - "agent/prompt.md and the knowledge leave the re-ask to the server; contract pins for the new and retired sentences"
affects: [phase-03-web-confirmation-card, phase-04-modulo-agent-md]

actuals:
  tokens: 11900
  tasks: 3
  commits: 6
plan_head_before: 882f418d7b064934cc5d8aff38312b6f12ae0fa7
plan_head_after: be71ce8cd47616d3fd73d392faa7c92491297550

tech-stack:
  added: []
  patterns:
    - "The gate state, not a flag, decides what is carried: arrastrados = pendientesDe(apertura.siguiente)"

key-files:
  created: []
  modified:
    - src/domain/types/compuerta.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/loop/services/ejecutar-turno.service.ts
    - tests/unit/compuerta.policy.test.ts
    - tests/loop/compuerta.test.ts
    - tests/loop/compuerta-casos.test.ts
    - agent/prompt.md
    - src/knowledge/registro-proveedor.md
    - tests/contract/instrucciones-agente.test.ts
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md
    - .planning/STATE.md

key-decisions:
  - "D-63.6 (user decision, Option A): with a case pending, only an explicit rejection (rechaza or the button with aprobada false) cancels; any other reply keeps the case and the server re-appends its question with needsConfirmation"
  - "Confirming one of several pending cases authorizes only that case and keeps the others pending; a confirmation of a non-pending case authorizes nothing and keeps the pending cases"
  - "A confirmation turn that ends final without using its grant returns the case to pending (extends D-63.2); only the pending state returns, never the grant (D-38)"
  - "Outside a send, a pending case leaves the gate only by an explicit rejection, a caller abort or the end of the session (D-58)"

patterns-established:
  - "Server owns the confirmation question on every turn while a case is pending; the model never writes or requests it"

requirements-completed: [ENV-02, ENV-03, AGT-02, AGT-03, AGT-04, DEMO-03]

coverage:
  - id: D1
    description: "A non-confirming reply ('ok', 'listo', 'si por favor', 'si gracias', 'si ec-corp-andina') keeps ec-corp-andina pending, ends with the server question, its bloqueos and needsConfirmation, and the next 'sí' writes ENVIO-SIMULADO.md once"
    requirement: ENV-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#CR-01 (D-63.6): una respuesta que no confirma deja el caso pendiente y el 'sí' siguiente envía una vez"
        status: pass
    human_judgment: false
  - id: D2
    description: "abrirTurno and recuperarAutorizado D-63.6 rows"
    requirement: ENV-02
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#abrirTurno (D-37, D-40, D-63.3, D-63.6)"
        status: pass
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#recuperarAutorizado (WR-02, D-63.2, D-63.6, D-38)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unrelated work does not hijack the confirmation; abort closes LIBRE; repeated non-confirmations re-ask; obedient rejection cancels; disobedient send is still blocked"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-63.6: un pedido ajeno con un caso pendiente se atiende y no secuestra la confirmación"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#red de seguridad (D-63.6)"
        status: pass
    human_judgment: false
  - id: D4
    description: "agent/prompt.md and the knowledge leave the re-ask to the server, pinned with the retired sentences"
    requirement: AGT-02
    verification:
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#la re-pregunta es del servidor (CR-01, D-63.6)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 19: CR-01 Option A (D-63.6) Summary

**With a case pending, only an explicit rejection cancels it now. An "ok", a question or an unrelated request keeps the case pending, and the server re-appends its question with the bloqueos and needsConfirmation, so the analyst's next "sí" sends exactly once.**

This plan closes **CR-01** of 02-REVIEW.md and **gap truth 27** of 02-VERIFICATION.md.

## Performance

- **Duration:** about 10 min
- **Started:** 2026-10-14T02:36Z
- **Completed:** 2026-10-14T02:46Z
- **Tasks:** 3 of 3
- **Files modified:** 11

## Accomplishments

- `abrirTurno` follows D-63.6:
  - LIBRE and `rechaza` give LIBRE.
  - A `confirma` of a pending case authorizes only that case and keeps the others.
  - `otro`, `falta_caso` and a `confirma` of a case that is not pending keep the state and authorize nothing.
  - `AperturaTurno` lost `preguntarCual`, and the carried cases now come from `pendientesDe(apertura.siguiente)`.
- `recuperarAutorizado` returns `[]` only for `abortado`. A normal ending that never used the grant now returns the case to pending, so the server asks again. The grant itself is never restored.
- The script the prompt prescribes is now a loop test: §11 turn 1, then an "ok" with no tool call, then "sí". It covers all five phrases the verifier reproduced.
- Companion tests:
  - unrelated work with ec pending (five turns: both cases pending, a bare "sí" sends nothing, "envía co" sends only co, a final "sí" sends ec);
  - an abort during an "ok" turn;
  - two non-confirmations in a row;
  - an obedient "no envíes nada";
  - the CR-01 describe, retitled as the safety net, which now also asserts the server question.
- `agent/prompt.md` no longer asks the model to request a confirmation. A non-confirming or unclear reply leaves the re-ask to the server, an unrelated request is handled normally, and a rejection cancels. RN4 and "Varios casos" in the knowledge say the same. The contract test pins the new sentences and the two retired ones.
- D-63.6 is recorded in 02-CONTEXT.md, with annotations on D-37, D-39 and D-63.2. STATE.md marks the 02-03 and 02-13 decisions as superseded and adds a Phase 3 concern about the card.

## Task Commits

1. **Task 1 (RED): unit rows and loop tests for D-63.6.** `2dba0f1` (test)
2. **Task 1 (GREEN): gate policy, type and turn seeding.** `c8cf640` (fix)
3. **Task 2: D-63.6 edge tests.** `54461d7` (test)
4. **Task 3 (RED): contract pins for CR-01.** `73c0e8f` (test)
5. **Task 3 (GREEN): prompt and knowledge aligned.** `d585b53` (docs)
6. **Task 3: D-63.6 recorded in CONTEXT and STATE.** `be71ce8` (docs)

## TDD record

- **Task 1 RED:** 21 tests failed and 74 passed across the three test files.
  - The JUnit report (`bun test tests/loop/compuerta.test.ts -t "D-63.6" --reporter=junit`) was classified `RED_EVIDENCE_OK` / `target_test_failed`. The target was `"ok" en el turno 2 vuelve a preguntar con needsConfirmation y el 'sí' del turno 3 envía una vez`, and 5 of 5 phrase tests failed.
  - Semantic assessment: each one failed on the planned `finDeTurno(turno2)` assertion, because needsConfirmation was false (`otro` cancelled to LIBRE). The unit rows failed on the extra `preguntarCual` field and on the LIBRE result for OTRO. There were no load, syntax or fixture faults.
  - `bun run check` was red at RED only because of the `preguntarCual` type in the new expectations, which is expected.
- **Task 1 GREEN:** the verify set ran 178 tests with 0 fail. `-t "D-63.6"` gave 5 pass and `-t "sin usar la autorización"` gave 1 pass. `bun run check` exited 0. The full `bun test` ran 1168 pass, 1 skip and 0 fail.
- **Tracer gate:** auto verify was re-run end to end after GREEN, and it passed before the expansion tests of Task 2.
- **Task 3 RED:** 3 of 16 tests failed (the new describe). The JUnit report was classified `RED_EVIDENCE_OK` / `target_test_failed`, with target `ninguna frase que le pedía al modelo pedir la confirmación sigue en los archivos`. Both retired sentences were still in the prompt. The evidence files were written to an untracked temporary folder and removed before commit.
- **Task 3 GREEN:** the verify set ran 62 pass and 0 fail. The full `bun test` ran 1175 pass, 1 skip (the opt-in live test) and 0 fail. `bun run check` exited 0.
- **REFACTOR:** none needed.

## Files Created/Modified

- `src/domain/types/compuerta.type.ts`: `AperturaTurno` is now `{autorizado, siguiente}`.
- `src/domain/policies/compuerta.policy.ts`:
  - `abrirTurno` follows D-63.6.
  - The new private helper `estadoSin` replaces `sinAutorizacion` and `preguntarCual`.
  - `recuperarAutorizado` has an abort-only guard.
- `src/loop/services/ejecutar-turno.service.ts`: `arrastrados: pendientesDe(apertura.siguiente)`. `arrastradosDe` and the unused imports are removed.
- `tests/unit/compuerta.policy.test.ts`: the abrirTurno describe is rewritten, and the recuperarAutorizado table has the re-open row and two new final rows.
- `tests/loop/compuerta.test.ts`:
  - the D-63.6 describe (five phrases plus two non-confirmations);
  - the obedient rejection test;
  - the retitled safety-net describe.
- `tests/loop/compuerta-casos.test.ts`:
  - the D-40 test now keeps co pending;
  - the D-38 late-confirmation test is replaced;
  - the four-turn test replaces the WR-02 LIBRE control;
  - the "no secuestra" describe has the five-turn test and the abort test.
- `agent/prompt.md` and `src/knowledge/registro-proveedor.md`: the D-63.6 wording.
- `tests/contract/instrucciones-agente.test.ts`: the describe "la re-pregunta es del servidor (CR-01, D-63.6)" with `RETIRADOS_CR01`.
- `.planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md` and `.planning/STATE.md`: the decision records.

## Decisions Made

All decisions follow the plan's D-63.6 (user Option A), and they are listed in the frontmatter. No new decision was taken during execution.

## Deviations from Plan

1. **[Process] Task 1 split into a RED commit and a GREEN commit.**
   - Why: the orchestrator required TDD (a RED commit before GREEN), and plans 02-16 and 02-18 already worked this way.
   - Effect: Task 1 has two commits, a `test(02-19)` commit with the three test files and a `fix(02-19)` commit with the three src files. The acceptance line "the fix(02-19) commit lists exactly the six files" does not hold literally, but the six files are exactly the union of the two commits.
   - The cost: `bun test` and `bun run check` are red only at the RED commit `2dba0f1`. Every other commit is green.
2. **[Process] Task 3 also split into RED and GREEN.** The contract test went into its own `test(02-19)` commit before the `docs(02-19)` commit with the prompt and the knowledge. That makes three commits for Task 3 where the plan named two docs commits.
3. **[Process] Commits on `main`.** The protected-branch assertion reports `main` as protected. The orchestrator explicitly ran this plan as a sequential executor on the main working tree, and every earlier phase-02 plan committed there, so commits went to `main` without rewriting any ref.

No source code deviated from the plan, and no other existing test needed changes. The only tests that pinned "otro cancels" or "final recovers nothing" were the ones the plan names: the abrirTurno rows, the recuperarAutorizado row, D-40, the D-38 late confirmation and the WR-02 control.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- Phase 3 (card): while a case is pending, every turn now emits `confirmation_required`, so the card stays visible between turns. Cancelar (aprobada false) cancels every pending case. This is recorded in STATE Blockers/Concerns.
- Phase 4: `modulo/agent.md` is generated from a prompt that now also leaves the re-ask to the server. The 02-18 Phase 4 concern covers it.
- The open items flagged by the plan stay as they are: the broad negation class (IN-01), the T04 QA seed (IN-04) and prose the model writes above the server question (T-02-41).

## Self-Check: PASSED

- All 11 modified files exist, and `reto-01/` is untouched (`git status --porcelain -- reto-01` prints nothing).
- Commits 2dba0f1, c8cf640, 54461d7, 73c0e8f, d585b53 and be71ce8 are ancestors of HEAD.
- 02-REVIEW-DISPOSITION.md is in no 02-19 commit.
