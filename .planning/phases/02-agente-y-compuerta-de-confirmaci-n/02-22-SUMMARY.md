---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 22
subsystem: confirmation-gate
tags: [classifier, confirmation, gate, prompt, knowledge, gap-closure]
gap_closure: true
gap_ids: [G-02-2]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "D-63.6 gate (rechaza cancels every pending case, otro keeps it with the server question), clasificarConfirmacion from 02-03 and 02-14"
provides:
  - "Scoped explicit rejection (D-63.8) in clasificarConfirmacion, evaluated before the question check"
  - "NEGADORES, PRONOMBRES_ATONOS and VERBOS_NEGABLES single-word sets; PATRON_CLAUSULA clause segmentation"
  - "Prompt and RN4 that quote only examples the classifier agrees with, pinned by a contract test"
  - "D-63.8 recorded in 02-CONTEXT.md; STATE.md 02-03 classifier line corrected"
affects: [phase-03-api, confirmation-gate, agent-prompt]

actuals:
  tokens: 10400
  tasks: 3
  commits: 6
plan_head_before: 10a43addb3f540c5b14bdb8e38d247f2ae669bc9
plan_head_after: 07e7b2828a9258253b364b14e66d05f06c0c481d

tech-stack:
  added: []
  patterns:
    - "Rejection by scope: a negator that governs a send form, or a non-question clause made only of wait words and fillers"
    - "Contract test runs the domain classifier on every example quoted by the prompt and the knowledge"

key-files:
  created: []
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/config/constants/patterns.constants.ts
    - src/domain/policies/confirmacion.policy.ts
    - tests/unit/confirmacion.policy.test.ts
    - tests/loop/compuerta.test.ts
    - tests/contract/instrucciones-agente.test.ts
    - agent/prompt.md
    - src/knowledge/registro-proveedor.md
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md
    - .planning/STATE.md

key-decisions:
  - "D-63.8: an explicit rejection is (a) no/nunca/jamás/tampoco/ni plus unstressed pronouns plus a send form (envíes, mandes, hagas, confirmo, autorizo...) anywhere in the message, even with a question, or (b) a non-question clause made only of NEGACIONES and RELLENO words with at least one NEGACIONES word; it is checked before the question check"
  - "NEGACIONES keeps its 25 words but is now only the vocabulary of a rejection clause, not a bag searched across the whole message"
  - "The text rejection stays global (cancels every pending case); WR-17 per-case button rejection stays out of scope"

patterns-established:
  - "A classifier rule change ships with an invariant test that pins what it must never widen (no NEGACIONES or NEGADORES word ever confirms)"

requirements-completed: [ENV-02, ENV-03, AGT-02, DEMO-03]

coverage:
  - id: D1
    description: "'Consulta el valor del NIT de co-industrias-delta para tenerlo a mano' and its siblings keep the case pending with one server question, and the next 'sí' sends exactly once"
    requirement: ENV-02
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#G-02-2 (D-63.8): un pedido con 'para' no cancela y una negación con pregunta sí cancela"
        status: pass
    human_judgment: false
  - id: D2
    description: "'No envíes nada todavía, ¿qué falta?' and its siblings cancel the pending case with no server question, and a later bare 'sí' is blocked with CONFIRMACION_REQUERIDA"
    requirement: ENV-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#G-02-2 (D-63.8): un pedido con 'para' no cancela y una negación con pregunta sí cancela"
        status: pass
    human_judgment: false
  - id: D3
    description: "Scoped classifier: 55 rows (eight ordinary questions and connector requests give otro, every rejection form gives rechaza), all pre-existing rows unchanged, and no rejection word ever confirms"
    requirement: DEMO-03
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#rechazo explícito acotado (G-02-2, D-63.8)"
        status: pass
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#una palabra de rechazo nunca confirma (D-63.8, D-39)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Prompt and RN4 define the rejection like the server, and every quoted example is classified the same way by clasificarConfirmacion"
    requirement: AGT-02
    verification:
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#el rechazo explícito es acotado (G-02-2, D-63.8)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The live model follows the aligned prompt (says 'cancelada' only when the server cancels)"
    verification: []
    human_judgment: true
    rationale: "Model behavior is not exercised without a live run; HV1 model variance was accepted by the user and no live run is part of this plan"

duration: 5min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 22: Scoped explicit rejection (G-02-2, D-63.8) Summary

**clasificarConfirmacion now rejects only a negation that governs the send ("no envíes", "no lo mandes", "no confirmo") or a short non-question wait clause ("no", "espera", "todavía no"), and it checks this before the question check. So "...para tenerlo a mano" keeps the case pending and the next "sí" sends once, and "No envíes nada todavía, ¿qué falta?" cancels the case without a server question.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-14T04:50Z
- **Completed:** 2026-10-14T04:56Z
- **Tasks:** 3 of 3
- **Files modified:** 10

## Findings closed

- **G-02-2** of 02-UAT.md (UAT round 2, test 2, major)
- **WR-15** of 02-REVIEW.md: a negation followed by a question now cancels instead of re-asking
- **WR-16** of 02-REVIEW.md: an unrelated request that contains "para", "luego", "mejor", "después" or "no" no longer cancels
- **IN-01(b)**: "envíalo para firma", "dale no más" and similar no longer turn into rejections (they give otro)
- **Truth 31** of 02-VERIFICATION.md

**Still open:** WR-17 (rejecting one case from the button cancels every pending case) and IN-01(a) (esSiSuelto: "si por favor" gives otro).

## Accomplishments

- Single-word sets `NEGADORES`, `PRONOMBRES_ATONOS` and `VERBOS_NEGABLES` were added next to an unchanged `NEGACIONES`, plus `PATRON_CLAUSULA` in patterns.constants.ts (G8 and G11 safe).
- `clasificarConfirmacion` follows a new order: empty input gives otro, then the explicit-rejection check (form a over the words, form b per clause), then the question check, then the unchanged confirmation grammar. The bag-of-words test over `NEGACIONES` is gone.
- Loop tests run through the agent with the scripted fetch: 5 keep-pending rows and 5 cancel rows, each one asserting turn 2 (motivo, needsConfirmation, confirmation_required, exact reply) and turn 3 ('sí' sends once, or 'sí' is blocked).
- The unit table `FILAS_RECHAZO_ACOTADO` has 55 rows. A second describe pins that the confirmation vocabulary and `NEGACIONES`/`NEGADORES` don't overlap, and that no template phrase built with a rejection word confirms, with one or two pending cases.
- The prompt ("Protocolo de confirmación") and the knowledge (RN4) define the same rejection. The contract test classifies every quoted example and pins the two retired sentences.
- D-63.8 is recorded in 02-CONTEXT.md, and D-39 and D-63.6 point to it. STATE.md has the 02-22 decision line, and the 02-03 line is marked "CORREGIDO por 02-22".

## Task Commits

1. **Task 1 (tracer): scoped rejection end to end**
   - `c8b063c` test(02-22): RED unit rows and loop tests for both user scripts
   - `1e3bd30` fix(02-22): constants, PATRON_CLAUSULA and the scoped classifier (GREEN)
2. **Task 2: characterization rows and the never-confirms invariant:** `0e09f7f` test(02-22)
3. **Task 3: prompt, knowledge and records**
   - `65c81f3` test(02-22): RED contract test
   - `ae2e4c3` docs(02-22): prompt and RN4 (GREEN)
   - `07e7b28` docs(02-22): D-63.8 in 02-CONTEXT.md and the STATE.md lines

## TDD Gate Compliance

- **Task 1 RED:** `bun test tests/loop/compuerta.test.ts -t "D-63.8" --reporter=junit` exited 1. The `gsd-tools check tdd-red-evidence` classifier returned `RED_EVIDENCE_OK` (target_test_failed, junit, 2 of 2 target tests failing). Semantic assessment: both loop tests failed on the planned `finDeTurno(turno2)` assertion (needsConfirmation false for "...para tenerlo a mano", true for "No envíes..., ¿qué falta?"). Both unit rows failed on the decision (rechaza and otro, the reverse of the expected values). There were no load, syntax or fixture faults. GREEN `1e3bd30` then passed: 212 pass, 0 fail.
- **Task 2:** a characterization task (the plan says Nothing in src changes). Every row passed on the first run against Task 1's code, which confirms the implementation matches D-63.8.
- **Task 3 RED:** 20 new contract tests failed on the planned assertions (citation absent, retired sentences present). The 3 passing tests that `-t "G-02-2"` also matched belong to the pre-existing "(G-02-21)" describe. GREEN `ae2e4c3` then passed: 23 pass, 0 fail.
- **REFACTOR:** not needed.

## Verification

- `bun run check` (tsc, Biome and audit) exits 0.
- `bun test`: 1311 pass, 1 skip (live suite), 0 fail.
- `bun test tests/loop/compuerta.test.ts -t "D-63.8"`: 10 pass, 0 fail.
- `bun test tests/loop/compuerta.test.ts tests/loop/compuerta-casos.test.ts tests/unit/compuerta.policy.test.ts`: 121 pass, 0 fail. This includes "dos respuestas seguidas...".
- Every TABLA_INVESTIGACION and FILAS_EXTRA row is unchanged and green (including row 78, "no envíes ec-corp-andina" with two pending cases, which gives rechaza).
- `git status --porcelain -- reto-01` is empty.
- No 02-22 commit touches compuerta.policy.ts, ejecutar-turno.service.ts, confirmacion.type.ts, 02-REVIEW-DISPOSITION.md, 02-UAT.md or 02-VERIFICATION.md.

## Deviations from Plan

### Process

**1. [TDD ordering] Task 1 was split into a RED test commit and a GREEN fix commit.**
- **Found during:** Task 1
- **Issue:** The plan asked for one fix(02-22) commit with exactly five files, so that `bun test` would never be red between commits. The orchestrator asked for a RED test commit before GREEN, and plans 02-19 and 02-20 used that same test-then-fix pattern. The repo has no git hooks that would block a red commit.
- **Fix:** `c8b063c` (the 2 test files) and `1e3bd30` (the 3 src files). Together they hold exactly the five planned files, and no file under src/domain/types/, compuerta.policy.ts or ejecutar-turno.service.ts.
- **Impact:** One intermediate commit, `c8b063c`, is intentionally red (4 failing tests). Every other commit is green.

**2. [TDD ordering] The Task 3 contract test landed in its own RED commit.** The plan grouped it with the prompt and knowledge docs commit. It is now `65c81f3` (RED), followed by `ae2e4c3` (docs, GREEN).

**3. [Process] Commits on `main`.** The protected-branch assertion reports `main` as protected. The orchestrator ran this plan as a sequential executor on the main working tree, and every earlier phase-02 plan committed there (see 02-19-SUMMARY), so commits went to `main` and no ref was rewritten.

**4. [Rule 3 - Blocking] `test.each` needs a mutable array.** tsc rejected `test.each(PALABRAS_DE_RECHAZO)` because the array is readonly. It now spreads the array (`[...PALABRAS_DE_RECHAZO]`). This was fixed before the Task 2 commit.

**Total deviations:** 4 (3 process, 1 blocking type fix). **Impact:** none on behavior. Every planned file, row, assertion and pin landed as specified.

## Known Stubs

None.

## Flagged assumptions (carried from the plan, unresolved)

- "espera un momento", "un momento", "no quiero enviarlo todavía" and "ni se te ocurra enviarlo" give otro. That is safe: the case stays pending and the server asks again.
- "no, envía" and "Procesa pe-andes, luego" give rechaza. That is also safe: nothing is sent.
- A text rejection cancels every pending case (WR-17 sibling).
- The model is still not told the gate decision (T-02-41, HV1 accepted).

## Next Phase Readiness

G-02-2 is closed. WR-17 and IN-01(a) remain open for a later decision. Phase 02 has no other open plan in this gap round.

## Self-Check: PASSED

- All 10 modified files exist on disk.
- Commits c8b063c, 1e3bd30, 0e09f7f, 65c81f3, ae2e4c3 and 07e7b28 are ancestors of HEAD (`git rev-list --count 10a43ad..HEAD` = 6).
