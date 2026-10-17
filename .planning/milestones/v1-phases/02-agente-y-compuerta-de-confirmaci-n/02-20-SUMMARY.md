---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 20
subsystem: confirmation-gate
tags: [compuerta, confirmacion, d-63.7, wr-02, wr-01, formatear-issues, bun-test]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "D-63.6 gate (02-19): abrirTurno, cerrarTurno fold, recuperarAutorizado, server question on every pending turn; conDetalle single-period close (02-17)"
provides:
  - "EVENTO_COMPUERTA.FALLIDO: a failed authorized proveedor_simular_envio re-opens the case with its known package in every turn ending except abort; the used grant is never restored"
  - "aplicarEvento shares one reabrirConocido branch for BLOQUEADO and FALLIDO; a sent case is never re-opened"
  - "formatearIssues drops FIN_DE_ORACION from every issue except the last before joining with SEPARADOR_ISSUES"
  - "FIN_DE_ORACION and SEPARADOR_ISSUES live in text.constants.ts; strings.ts imports FIN_DE_ORACION"
  - "Knowledge line: a failed proveedor_simular_envio is not retried in the same turn and the case vuelve a quedar pendiente"
affects: [phase-03-web-confirmation-card, phase-04-modulo-agent-md]

actuals:
  tokens: 9600
  tasks: 3
  commits: 8
plan_head_before: c2f644668a00b02de818d4ed198eb471d189fb89
plan_head_after: 0c52d79afc54d0c9b8317df1c075610e420b9ce0

tech-stack:
  added: []
  patterns:
    - "A failed external action is its own gate event (FALLIDO), folded like a blocked attempt, so logs and a future UI can tell the two apart"
    - "Issue joiner owns punctuation between parts; the last part keeps its own ending and conDetalle closes the sentence"

key-files:
  created:
    - tests/unit/formatear-issues.util.test.ts
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/domain/types/compuerta.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/loop/services/despacho-llamada.service.ts
    - src/config/constants/text.constants.ts
    - src/config/strings.ts
    - src/domain/utils/formatear-issues.util.ts
    - src/knowledge/registro-proveedor.md
    - tests/unit/compuerta.policy.test.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/contract/env-agente.test.ts
    - tests/contract/instrucciones-agente.test.ts
    - .planning/milestones/v1-phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md
    - .planning/STATE.md

key-decisions:
  - "D-63.7 (user decision): a failed authorized send emits FALLIDO and the case returns to pending with the server question, except on abort; the used grant is never restored (D-38)"
  - "WR-01 is fixed at the joiner: every issue except the last drops its trailing FIN_DE_ORACION before SEPARADOR_ISSUES; single-issue outputs are byte-identical"

patterns-established:
  - "reabrirConocido: the single named re-open branch for any gate event that did not send"

requirements-completed: [ENV-02, ENV-03, AGT-04, AGT-05, LLM-02, DEMO-03]

coverage:
  - id: D1
    description: "With ec-corp-andina pending, 'envía' authorizes; proveedor_simular_envio fails with PAQUETE_NO_ARMADO; the turn ends final with needsConfirmation, one confirmation_required with the bloqueos and the server question; nothing is written, casosEnviados stays []; re-arm then 'sí' writes ENVIO-SIMULADO.md once"
    requirement: ENV-02
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#PAQUETE_NO_ARMADO tras 'envía' vuelve a preguntar; re-armar y 'sí' envía una vez"
        status: pass
    human_judgment: false
  - id: D2
    description: "PAQUETE_DESACTUALIZADO plus re-arm in the same turn, ERROR_INTERNO plus provider error, and two failed sends in a row all end pending with the server question and send exactly once only after a new confirmation"
    requirement: ENV-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#WR-02 (D-63.7): un envío autorizado que falla vuelve a dejar el caso pendiente"
        status: pass
    human_judgment: false
  - id: D3
    description: "cerrarTurno, enviadosTrasEventos and recuperarAutorizado rows for FALLIDO: re-open with known package, LIBRE without one, fresh re-arm wins, carried cases kept, abort LIBRE, sent case stays closed, used grant not recovered"
    requirement: AGT-04
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#cerrarTurno con un envío autorizado que falla (WR-02, D-63.7)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Multi-issue startup messages (custom provider without URL nor model; both URLs on http) are exact single sentences with one final period and no period before the separator"
    requirement: AGT-05
    verification:
      - kind: unit
        ref: "tests/unit/formatear-issues.util.test.ts#formatearIssues (WR-01)"
        status: pass
      - kind: integration
        ref: "tests/contract/env-agente.test.ts#varios issues de configuración al crear el agente (WR-01)"
        status: pass
      - kind: other
        ref: "bun -e probe from the plan: revisados=2 malos=0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Knowledge tells the model not to retry a failed proveedor_simular_envio in the same turn and that the case vuelve a quedar pendiente"
    requirement: DEMO-03
    verification:
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#el conocimiento dice que un envío que falla vuelve a quedar pendiente (WR-02, D-63.7)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 20: Failed confirmed send stays pending (WR-02) and one-period config messages (WR-01) Summary

**A confirmed `proveedor_simular_envio` that the tool rejects now emits a FALLIDO gate event. The case goes back to pending with the server question, and only a new explicit confirmation can send it. Startup messages with several configuration issues are now one clean sentence with a single final period.**

This plan closes **WR-02** and **WR-01** of 02-REVIEW.md, which are also the two warnings in 02-VERIFICATION.md.

## Performance

- **Duration:** about 6 min
- **Started:** 2026-10-14T02:48Z
- **Completed:** 2026-10-14T02:54Z
- **Tasks:** 3 of 3
- **Files modified:** 15 (1 created)

## Accomplishments

- **WR-02, D-63.7.** `despacharEnvio` now emits `{tipo: FALLIDO, caso}` when an authorized send returns `ok: false`. The fold handles FALLIDO through the same `reabrirConocido` branch as BLOQUEADO:
  - The case re-opens with its known package in every ending except a caller abort.
  - A sent case is never re-opened.
  - A successful re-arm later in the same turn replaces the bloqueos with the fresh ones.
  - The grant stays used (`evaluacion.siguiente`), so sending again needs a new server question and a new explicit confirmation.
- Four loop tests cover every failure path. The two-failures test checks that nothing is written and `casosEnviados` stays `[]`.
  - PAQUETE_NO_ARMADO, then re-arm, then "sí".
  - PAQUETE_DESACTUALIZADO plus a re-arm in the same turn.
  - ERROR_INTERNO (a test double around the real registry) followed by a provider error.
  - Two failures in a row.
- **WR-01.** `formatearIssues` builds the `ruta: mensaje` parts as before, removes the trailing period from every part except the last, and joins them with `SEPARADOR_ISSUES`. Both multi-issue literals from the must_haves are pinned exactly. The G-02-19 single-issue literals are unchanged.
- The knowledge (ERROR_INTERNO line) tells the model not to retry a failed send in the same turn. D-63.7 is recorded in 02-CONTEXT.md (seven readings), and STATE.md has the two 02-20 decisions and the annotated 02-06 and 02-13 lines.

## Task Commits

1. **Task 1 (RED): unit rows and the PAQUETE_NO_ARMADO loop test.** `817643d` (test)
2. **Task 1 (GREEN): FALLIDO constant, type, fold and dispatcher.** `803d74c` (fix)
3. **Task 2 (RED): formatter table and multi-issue literals, plus the two constants.** `1e4ed9d` (test)
4. **Task 2 (GREEN): period-aware join, with strings.ts importing FIN_DE_ORACION.** `63a06b9` (fix)
5. **Task 3: the three remaining D-63.7 loop tests.** `cc9e36a` (test)
6. **Task 3 (RED): knowledge contract pin.** `dd80251` (test)
7. **Task 3 (GREEN): knowledge line.** `de1d0ab` (docs)
8. **Task 3: D-63.7 in CONTEXT and the decisions in STATE.** `0c52d79` (docs)

## TDD record

- **Task 1 RED:** the JUnit report of `bun test tests/loop/compuerta-casos.test.ts -t "D-63.7" --reporter=junit` was classified `RED_EVIDENCE_OK` / `target_test_failed`.
  - Target: `PAQUETE_NO_ARMADO tras 'envía' vuelve a preguntar; re-armar y 'sí' envía una vez`.
  - Semantic assessment: it failed on the planned assertion in `vuelvePreguntandoPorEc`. Turn 2 ended `final` with `needsConfirmation: false`, so the failed send had dropped the case. There were no load or fixture faults.
  - The unit rows already passed at runtime, because the old catch-all branch treated the undefined `FALLIDO` tag as a re-open. At RED they failed only at `tsc`, since the member did not exist yet. The loop test is the behavioral RED.
- **Task 1 GREEN:** the verify set ran 181 pass and 0 fail, `-t "D-63.7"` gave 1 pass, `bun run check` exited 0, and the full suite ran 1184 pass, 1 skip and 0 fail.
- **Tracer gate:** the mode is end-of-phase and the verify step is automated-only, so the verify set was re-run end to end after GREEN. It passed before the expansion tasks.
- **Task 2 RED:** `RED_EVIDENCE_OK` / `target_test_failed`, with target `dos issues con punto: solo el último lo conserva` (expected `A: Uno; B: Dos.`, got `A: Uno.; B: Dos.`). 6 tests failed: 4 formatter rows and both contract literals.
- **Task 2 GREEN:** the verify set ran 135 pass and 0 fail, the `bun -e` probe printed `revisados=2 malos=0`, and the full suite ran 1195 pass, 1 skip and 0 fail.
- **Task 3:** the three loop tests passed against the Task 1 code. A mutation check (restoring `evento: resultado.ok ? ENVIADO : null` for a moment) made three of the four D-63.7 tests fail. The PAQUETE_DESACTUALIZADO-plus-re-arm test still passed, which is expected: its re-arm's ARMADO event re-opens the case without FALLIDO. The file was restored with `git checkout -- <file>`, and the FALLIDO grep was confirmed at 1.
- **Task 3 knowledge RED:** `RED_EVIDENCE_OK` / `target_test_failed`, because the sentence was absent. GREEN came after the knowledge edit. The RED evidence files went to an untracked `.red-evidence/` folder that was removed before each commit.
- **Final:** `bun test` ran 1199 pass, 1 skip (the opt-in live test) and 0 fail. `bun run check` exited 0.
- **REFACTOR:** none needed.

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts`: `EVENTO_COMPUERTA.FALLIDO`.
- `src/domain/types/compuerta.type.ts`: the FALLIDO member of `EventoCompuerta`.
- `src/domain/policies/compuerta.policy.ts`: the private `reabrirConocido`. `aplicarEvento` is now a `switch` on `EVENTO_COMPUERTA` members, and BLOQUEADO and FALLIDO share the re-open branch.
- `src/loop/services/despacho-llamada.service.ts`: `despacharEnvio` emits ENVIADO or FALLIDO. The grant and `envioPermitido` are unchanged.
- `src/config/constants/text.constants.ts`: `FIN_DE_ORACION` and `SEPARADOR_ISSUES`.
- `src/config/strings.ts`: imports `FIN_DE_ORACION`, and the private copy is gone.
- `src/domain/utils/formatear-issues.util.ts`: `describirIssue`, `sinFinDeOracion` and the period-aware join.
- `src/knowledge/registro-proveedor.md`: the ERROR_INTERNO line for a failed send.
- `tests/unit/compuerta.policy.test.ts`: the `fallido` helper and an 8-test D-63.7 describe.
- `tests/loop/compuerta-casos.test.ts`: the D-63.7 describe (4 tests) and the local helpers `lineasDeSimularDelCaso`, `falloDeEnvio`, `quitarChecklist`, `codigosDeSimular` and `envioConErrorInterno`.
- `tests/unit/formatear-issues.util.test.ts` (new): the row table plus a no-mutation test.
- `tests/contract/env-agente.test.ts`: the WR-01 describe with both literals.
- `tests/contract/instrucciones-agente.test.ts`: the WR-02 knowledge pin.
- `02-CONTEXT.md` and `STATE.md`: the decision records.

## Decisions Made

All decisions follow the plan (D-63.7 is the user's decision). They are listed in the frontmatter. No new decision was taken during execution.

## Deviations from Plan

1. **[Process] Task 1 split into a RED commit and a GREEN commit.**
   - Why: TDD requires a RED commit before GREEN.
   - Effect: the plan's acceptance line ("the fix(02-20) commit lists exactly the six files") does not hold literally. The six files are exactly the union of `817643d` (2 test files) and `803d74c` (4 src files).
   - Cost: `tsc` is red only at `817643d`, because the FALLIDO member is missing there.
2. **[Process] Task 2's RED commit also contains the two constants in `text.constants.ts`.**
   - Why: both new test files import `FIN_DE_ORACION` and `SEPARADOR_ISSUES`. Without the exports, RED would be a module-load failure (INVALID_RED) instead of an assertion failure.
   - Effect: the constants alone change no behavior, and both the type check and Biome passed at that commit. The behavior change is entirely in `63a06b9`.
3. **[Process] Task 3 has four commits where the plan named three.** The knowledge contract test went into its own `test(02-20)` commit (RED) before the `docs(02-20)` knowledge commit, the same pattern as 02-19.
4. **[Process] Commits on `main`.** The orchestrator ran this plan as a sequential executor on the main working tree, as with every earlier phase-02 plan. No ref was rewritten.

No source code deviated from the plan, and no existing test needed changes.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- WR-01 and WR-02 are closed. The orchestrator owns 02-REVIEW-DISPOSITION.md and the re-verification. REQUIREMENTS.md was not touched, as instructed.
- The flagged assumptions stay as the plan lists them:
  - After a failed send with no re-arm, the re-opened case shows the last known bloqueos.
  - `gate_granted` stays logged for a send that then fails.
  - The iteration-cap ending has no dedicated loop test.
  - ERROR_INTERNO comes from a test double.
- Phase 3 (card): a failed confirmed send now emits `confirmation_required` again, so the card reappears.

## Self-Check: PASSED

- The created file `tests/unit/formatear-issues.util.test.ts` and all modified files exist. `git status --porcelain -- reto-01` prints nothing.
- Commits 817643d, 803d74c, 1e4ed9d, 63a06b9, cc9e36a, dd80251, de1d0ab and 0c52d79 are ancestors of HEAD. `git rev-list --count c2f6446..HEAD` = 8.
- 02-REVIEW-DISPOSITION.md is in no 02-20 commit.
- Every acceptance criterion was re-run: the grep counts are 1/1/1, 1/1/0 and ≥1. `-t "D-63.7"` gives 4 loop passes and 8 unit passes. The probe prints `revisados=2 malos=0`. `bun test` and `bun run check` are green.
