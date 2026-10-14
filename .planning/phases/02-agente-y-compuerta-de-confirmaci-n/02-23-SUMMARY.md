---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 23
subsystem: confirmation-gate
tags: [classifier, confirmation, gate, prompt, knowledge, gap-closure, generated-corpus]
gap_closure: true
gap_ids: [G-02-2]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "D-63.6 gate (rechaza cancels every pending case, otro keeps it with the server question) and the D-63.8 classifier of 02-22"
provides:
  - "D-63.9 rejection in clasificarConfirmacion: affirmed clauses only, send negation with restricted complements and no preterite, cancel clause, wait clause with the case-naming exemption, whole-message wait, linear index scans"
  - "NUCLEOS_DE_RECHAZO, CANCELACIONES, RELLENO_DE_ESPERA, VERBOS_GENERICOS_NEGABLES, INFINITIVOS_NEGABLES, MODALES_NEGABLES, ENLACES_MODALES, INTERROGATIVOS, SUFIJO_PRETERITO; VERBOS_NEGABLES reduced to send subjunctives"
  - "PATRON_CLAUSULA without ':', PATRON_APERTURA_PREGUNTA, PATRON_SLUG_COMPLETO, PATRON_PALABRA_O_CASO"
  - "tests/helpers/corpus-confirmacion.helper.ts: never-cancel (2107) and always-cancel (1046) generators, confirmation stress set, atajoPrevio (10a43ad oracle)"
  - "Prompt S51, SCON, S53 and RN4a, RN4b pinned whole by a contract test with full quotation accounting"
  - "D-63.9 recorded in 02-CONTEXT.md and STATE.md"
affects: [phase-03-api, confirmation-gate, agent-prompt]

actuals:
  tokens: 18400
  tasks: 3
  commits: 6
plan_head_before: 732644a6372d2b7067715722b31827cc34fa4659
plan_head_after: 2e23696485ca5343c15801192ce8d2c8647f456e

tech-stack:
  added: []
  patterns:
    - "Rejection looked for only in affirmed clauses; a question head without '¿' splits at its first interrogative"
    - "Class invariants from vocabulary-driven generators plus a differential against the pre-02-22 classifier, instead of sample rows"
    - "Precomputed complement-tail array so each negator check is O(1) after one linear pass (T-02-71)"
    - "Contract test pins defining prose sentences whole, accounts for every quotation, and expands quoted single words through the generated classes"

key-files:
  created:
    - tests/helpers/corpus-confirmacion.helper.ts
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/config/constants/patterns.constants.ts
    - src/domain/policies/confirmacion.policy.ts
    - tests/unit/confirmacion.policy.test.ts
    - tests/loop/compuerta.test.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/contract/instrucciones-agente.test.ts
    - agent/prompt.md
    - src/knowledge/registro-proveedor.md
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md
    - .planning/STATE.md

key-decisions:
  - "D-63.9: an explicit rejection is looked for only in affirmed clauses; (a) negator + pronouns + send subjunctive with any complement, or generic verb / modal + optional a|que + send-confirm-authorize form only with a send-only complement, and a verb ending in 'é' is a preterite that never counts; (b) cancela/cancelar/cancelo/cancelado with only cases, NEGACIONES or RELLENO; (c) a case-free wait clause of NEGACIONES and wait fillers with a core word, unless another affirmed clause names a case; connectors reject only as the whole message"
  - "':' no longer cuts clauses, so words quoted after ':' are not the analyst's answer (IN-30(a))"
  - "confirmo and autorizo moved from VERBOS_NEGABLES to VERBOS_GENERICOS_NEGABLES; NEGACIONES and RELLENO keep their members, so the set of confirming phrases is unchanged"
  - "The text rejection stays global; WR-17 per-case rejection stays out by user decision"

patterns-established:
  - "Generated class corpus in tests/helpers/*.helper.ts reused by unit and contract tests"

requirements-completed: [ENV-02, ENV-03, AGT-02, DEMO-03]

coverage:
  - id: D1
    description: "Questions and requests headed by a connector or naming a case keep the case pending, and the next 'sí' sends once (CR-04)"
    requirement: ENV-02
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: rechazo explícito por cláusulas afirmadas (G-02-2, CR-04, D-63.9)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#G-02-2 (D-63.8, D-63.9): un pedido o una pregunta no cancela y una negación del envío sí cancela"
        status: pass
    human_judgment: false
  - id: D2
    description: "Explicit WR-19 rejections cancel with no server question, with one and two pending cases"
    requirement: ENV-03
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: clases generadas que nunca y siempre cancelan (G-02-2, IN-29, D-63.9)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#G-02-2 (D-63.9): con dos casos pendientes, un pedido que nombra un caso no cancela y un rechazo explícito cancela los dos"
        status: pass
    human_judgment: false
  - id: D3
    description: "No message moves into confirma, and no old question becomes a rejection unless declared (differential against 10a43ad); linear time"
    requirement: DEMO-03
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: comparación con el clasificador anterior a 02-22 (10a43ad, D-63.9)"
        status: pass
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: tiempo lineal (T-02-71, IN-28)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Prompt and RN4 state the D-63.9 rejection; every defining sentence pinned whole and checked against the classifier"
    requirement: AGT-02
    verification:
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#el prompt y el conocimiento describen el rechazo de D-63.9 (G-02-2, WR-22, IN-29)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The live model follows the prompt and does not claim the confirmation was cancelled after a case-naming request (HV2 replay)"
    verification: []
    human_judgment: true
    rationale: "Model variance (T-02-41, AR-02-01); no live run is part of this plan. HV2 replay with the 02-VERIFICATION.md phrases is a human UAT item after re-verification."

duration: 8min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 23: D-63.9 scoped rejection grammar Summary

**The confirmation gate now looks for an explicit rejection only in what the analyst affirms. "Para pe-andes, ¿qué falta?", "Luego ¿qué sigue?" and "No, el de pe-andes" keep the case pending, and the next "sí" sends once. "no quiero enviarlo todavía", "espera un momento" and "todavía no qué falta?" cancel it. All of this is pinned by 2107 never-cancel and 1046 always-cancel generated messages and a differential against 10a43ad, and the check runs in linear time.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-14T16:08:58Z
- **Completed:** 2026-10-14T16:17:14Z
- **Tasks:** 3
- **Files modified:** 12 (1 created)

## Accomplishments

- Replaced the 02-22 rejection code (`verboTrasNegador`, which copied the tail per negator, plus the old `niegaElEnvio`, `esPalabraDeEspera` and `esClausulaDeEspera`) with the D-63.9 clause model:
  - `segmentar` splits the text into clauses and separates a question head that has no "¿".
  - form (a) is `niegaElEnvio` with `niegaDesde` and `niegaTrasModal`, and uses a precomputed complement tail.
  - form (b) is `esCancelacion`.
  - form (c) is `esClausulaDeEspera`, with the case-naming exemption.
  - `esEsperaCompleta` handles the whole-message wait.
- The confirmation grammar is untouched: `esConfirmacionClara`, `casoConfirmado`, RELLENO and NEGACIONES did not change.
- Generated corpora:
  - On the pre-fix policy they give 1440 never-cancel violations and 269 always-cancel violations. On D-63.9 they give 0 and 0.
  - The differential against 10a43ad is clean.
  - "no ".repeat(200000), "no lo ".repeat(100000) and "No, ".repeat(100000) + "¿qué falta?" each classify in well under 1 s.
- Loop coverage:
  - With one pending case: 22 rows (13 keep-pending, 9 cancel).
  - With two pending cases: 6 rows. A case-naming request keeps both pending, and an explicit rejection cancels both.
- Prompt and RN4 (knowledge file):
  - New sentences: S51, the connector bullet SCON, S53, RN4a and RN4b.
  - RN4 no longer contradicts the rule (WR-22).
  - The four 02-22 sentences are retired and pinned absent.

## Task Commits

1. **Task 1: tracer, D-63.9 classifier end to end**
   - `6eddc88` (test, RED): 9 unit rows and 4 loop rows. All 13 failed on the 02-22 code (RED_EVIDENCE_OK, JUnit).
   - `e0316d7` (fix, GREEN): constants, patterns, policy, and the retargeted structural assertion.
2. **Task 2: generated classes, differential, linear time, two-pending loop.** `b5991b9` (test). These tests characterize the behavior Task 1 already delivered, so they passed on first run. The pre-fix sanity run above shows they would have failed on the old code.
3. **Task 3: prompt, RN4 and records**
   - `f5db176` (test, RED): 6 text pins failed (RED_EVIDENCE_OK, JUnit).
   - `ce175da` (docs, GREEN): prompt and knowledge.
   - `2e23696` (docs): 02-CONTEXT.md and STATE.md.

The tracer feedback gate ran after Task 1: end-of-phase mode with an automated-only verify. The verify set was re-run, came back green, and expansion continued.

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts`: the nine new D-63.9 sets and SUFIJO_PRETERITO. VERBOS_NEGABLES now holds only the send subjunctives.
- `src/config/constants/patterns.constants.ts`: PATRON_CLAUSULA no longer cuts at ":". Added PATRON_APERTURA_PREGUNTA, PATRON_SLUG_COMPLETO and PATRON_PALABRA_O_CASO.
- `src/domain/policies/confirmacion.policy.ts`: the D-63.9 rejection, with the Token and Clausula local types.
- `tests/helpers/corpus-confirmacion.helper.ts`: the class generators, `estresDeConfirmacion`, `atajoPrevio` and the frozen `NEGACIONES_10A43AD`.
- `tests/unit/confirmacion.policy.test.ts`: FILAS_D639 (69 rows) plus the class, differential, vocabulary and linear-time describes.
- `tests/loop/compuerta.test.ts`: renamed describe with 22 rows.
- `tests/loop/compuerta-casos.test.ts`: the new two-pending describe (6 rows).
- `tests/contract/instrucciones-agente.test.ts`: ORACIONES_D639 (5 entries) and RETIRADOS_G023 (4 sentences).
- `agent/prompt.md`: S51, SCON and S53.
- `src/knowledge/registro-proveedor.md`: RN4a and RN4b.
- `02-CONTEXT.md`: D-63 now announces nine readings, with item 9 added and cross-references in D-39, item 6 and item 8.
- `STATE.md`: the 02-22 line is marked ACOTADO, and a 02-23 D-63.9 line is added.

## Closes

- The rest of G-02-2 (02-UAT.md).
- From 02-REVIEW.md:
  - CR-04 and WR-19 to WR-22.
  - IN-28 (T-02-71, mitigated).
  - IN-29 and IN-30(a).
- Truths 31, 38 and 41 of 02-VERIFICATION.md.
- IN-30(b) is kept as documented: "no¿" gives rechaza and "no ?" gives otro.

## Still Open

- WR-17, WR-18, WR-03, IN-01(a), IN-23 and IN-30(b).
- Two human UAT items remain for after re-verification:
  - the live check of D5 from 02-22;
  - the HV2 replay with the phrases of 02-VERIFICATION.md.

## Decisions Made

- D-63.9 is implemented exactly as the plan specifies. See the key-decisions above and 02-CONTEXT.md D-63 item 9.
- The complement check is a suffix array computed once per clause (`colasDeComplemento`). It does not re-walk the tail for each negator, so the check is strictly linear (T-02-71, T-02-76).

## TDD Gate Compliance

- **Task 1:**
  - RED `6eddc88`: the target "Para pe-andes, ¿qué falta?" failed on toEqual (expected otro, actual rechaza). The 13 target rows failed and 230 others passed. RED_EVIDENCE_OK.
  - GREEN `e0316d7` uses `fix(...)`, as the plan specifies, instead of `feat(...)`.
- **Task 2:** test-only characterization of the behavior Task 1 delivered. The plan expects this.
- **Task 3:**
  - RED `f5db176`: the target "prompt S51 está entera en su archivo" failed on toContain. The 6 text pins failed. The classifier checks were already green from Task 1, which is correct because they test the server, not the prose. RED_EVIDENCE_OK.
  - GREEN `ce175da` uses `docs(...)`, as the plan specifies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `test.each` typing on a readonly object array**
- **Found during:** Task 3 RED.
- **Issue:** `bun run check` (tsc) rejected `test.each(ORACIONES_D639)` because a readonly array of objects does not match the mutable overload.
- **Fix:** `test.each([...ORACIONES_D639])`.
- **Files modified:** tests/contract/instrucciones-agente.test.ts
- **Commit:** f5db176

**2. [Minor] `NEGACIONES_10A43AD` exported from the helper**
- **Found during:** Task 2.
- **Issue:** the plan calls it a "frozen local copy" in the helper, but the vocabulary describe needs the same 25 words.
- **Fix:** the helper exports the set, and the unit test reuses it instead of duplicating the list.
- **Commit:** b5991b9

### Process notes

- **Commits on `main`:** the GSD protected-branch probe reports `main` as protected. The orchestrator dispatched this plan explicitly as a sequential executor on `main`, the project uses `branching_strategy: none`, and every earlier plan committed to `main`. Commits were made there under the local identity `elianatorres5772`.
- **REQUIREMENTS.md left untouched:** `requirements.mark-complete` was not run. Commit b87acdd reverted exactly that premature "Complete" marking after verification found gaps, so ENV-02, ENV-03, AGT-02 and DEMO-03 should flip only after phase re-verification. `requirements-completed` above copies the plan's list as the template requires.

**Total deviations:** 2 minor auto-fixes. **Impact:** none on behavior or scope.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

All 23 plans of phase 02 have a SUMMARY. The phase is ready for re-verification (`/gsd-verify-work 02`) and the HV2 human replay.

## Self-Check: PASSED

- FOUND: tests/helpers/corpus-confirmacion.helper.ts and every modified file.
- FOUND commits: 6eddc88, e0316d7, b5991b9, f5db176, ce175da and 2e23696, all ancestors of HEAD.
- `bun run check` exits 0. `bun test` reports 1437 pass, 1 skip, 0 fail.
- `git diff --name-only b87acdd..HEAD` over src/domain/types, compuerta.policy.ts, ejecutar-turno.service.ts and strings.ts is empty.
- `git status --porcelain -- reto-01` is empty.
- The 02-REVIEW-DISPOSITION.md, 02-UAT.md, 02-VERIFICATION.md and 02-SECURITY.md files appear in no 02-23 commit.
