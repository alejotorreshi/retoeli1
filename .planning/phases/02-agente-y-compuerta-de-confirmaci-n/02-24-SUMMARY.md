---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 24
subsystem: confirmation-gate
tags: [classifier, confirmation, gate, prompt, gap-closure, generated-corpus, linear-time]
gap_closure: true
gap_ids: [G-02-2]
status: complete

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "D-63.9 classifier, generated corpus and 10a43ad differential of 02-23"
provides:
  - "D-63.10 rejection in clasificarConfirmacion: trasMotivo tokens, complement tail with the server wording and reason cuts, cancellation through the same tail, pending-aware wait clause with the contrast rule, eximeLaEspera, whole-message wait with the pending case"
  - "COMPLEMENTOS_DE_ENVIO, CORTES_DE_COMPLEMENTO, SIGNO_DE_MOTIVO, VERBOS_DE_PEDIDO; CANCELACIONES + deten/detente; RELLENO_DE_ESPERA + hoy"
  - "PATRON_SLUG_EN_TEXTO left-anchored with (?<![a-z0-9]) so the whole classifier is linear (WR-25, T-02-77)"
  - "siempreCancelan with 519 more messages (1565), estresMismaClausula / estresClausulaAparte, RELLENO_10A43AD"
  - "FILAS_D6310 (58 rows), CANCELAN_POR_CASO_PENDIENTE (3 pairs), pinned mixtures, fourth differential direction, core-in-its-own-clause test, frozen vocabularies, end-to-end linear-time describe"
  - "Prompt S51 and S53 aligned with D-63.10, pinned with RETIRADOS_G024 and a server-wording contract describe"
  - "D-63.10 recorded in 02-CONTEXT.md as a user-approved amendment of D-63.9"
affects: [phase-03-api, confirmation-gate, agent-prompt]

actuals:
  tokens: 18800
  tasks: 3
  commits: 7
plan_head_before: a9f18a9ee464b417a996375318b619b5855f6d14
plan_head_after: d2a91c0482524c85ccde9895afdbf23572b4726d

tech-stack:
  added: []
  patterns:
    - "Token gap scan: a token is trasMotivo when the text between it and the previous token of its segment holds ':'; only the gap is sliced, so it stays linear"
    - "One suffix array of complement tails per affirmed clause, shared by the negation and the cancellation checks"
    - "Exemptions pinned as declared message-pendientes pairs instead of editing the generated corpus"
    - "Mixture decisions frozen through decisionDeMezcla so the fourth differential direction only exempts pinned-otro mixtures"

key-files:
  created: []
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/config/constants/patterns.constants.ts
    - src/domain/policies/confirmacion.policy.ts
    - tests/helpers/corpus-confirmacion.helper.ts
    - tests/unit/confirmacion.policy.test.ts
    - tests/loop/compuerta.test.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/contract/instrucciones-agente.test.ts
    - agent/prompt.md
    - .planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md

key-decisions:
  - "02-24: D-63.10 (enmienda de D-63.9, CR-05, aprobada por la usuaria el 2026-10-14) — una negación del envío con la redacción del servidor (\"simulado\", \"confirmación\") o con un motivo (\"porque\", \"hasta\", \"sin\", \"pues\", \"mientras\", \":\") rechaza; \"detén\" cancela y \"hoy\" es relleno de espera; un caso pendiente cuenta como palabra de espera (con rellenos) salvo en la contraposición \"no <caso>\"; la exención por nombrar un caso vale para un caso no pendiente y para una cláusula encabezada por un verbo de pedido; \"No, el de <caso pendiente>\" pasa a rechazo (tres pares, aprobados); cuarta dirección del diferencial con mezclas de decisión fija; PATRON_SLUG_EN_TEXTO anclado con lookbehind (WR-25, T-02-77); siguen abiertos WR-17, WR-23 (resto), WR-24, IN-31, IN-32 e IN-33"

patterns-established:
  - "Declared exceptions to a generated class live as [mensaje, pendientes] tuples next to the class test"

requirements-completed: [ENV-02, ENV-03, AGT-02, DEMO-03]

coverage:
  - deliverable: "The 16 CR-05 phrases and the D-63.10 forms reject; requests that name a case and contrasts stay otro"
    human_judgment: false
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#la redacción del servidor, un motivo y el caso pendiente no salvan un rechazo"
        status: pass
  - deliverable: "Generated classes, pinned mixtures and the four-direction differential against 10a43ad"
    human_judgment: false
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clases generadas que nunca y siempre cancelan"
        status: pass
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#comparación con el clasificador anterior a 02-22"
        status: pass
  - deliverable: "End-to-end linear time (WR-25, T-02-77)"
    human_judgment: false
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#tiempo lineal de punta a punta"
        status: pass
  - deliverable: "Loop: one and two pending cases cancel or stay pending through the gate"
    human_judgment: false
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#G-02-2 (D-63.8, D-63.9, CR-05, D-63.10)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#G-02-2 (D-63.9, CR-05, D-63.10)"
        status: pass
  - deliverable: "Prompt S51/S53 match the server rule"
    human_judgment: false
    verification:
      - kind: contract
        ref: "tests/contract/instrucciones-agente.test.ts#el 'no confirmo' del prompt cubre la redacción de la pregunta del servidor y un motivo"
        status: pass
  - deliverable: "The live model follows the new S51/S53 wording in the §11 demo (D5, HV2 replay)"
    human_judgment: true
    rationale: "Model behavior is not asserted by any deterministic test; the live run and the HV2 replay are human items after re-verification"

duration: 11 min
completed: 2026-10-14
---

# Phase 02 Plan 24: D-63.10 rejection (server wording, reasons, pending case) and linear slug scan Summary

**"no confirmo el envío simulado", "no confirmo porque falta el certificado", "ec-corp-andina no" and "detén el envío" now cancel the pending case. The complement tail accepts the server wording and is cut at a reason, and a wait clause counts the pending case. Requests that name a case stay exempt. A left-anchored slug pattern makes the classifier linear on 200 KB inputs.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-14T18:39:35Z
- **Completed:** 2026-10-14T18:50:52Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- **Classifier (D-63.10).** `clasificarConfirmacion` changes in six ways:
  - Tokens carry `trasMotivo`, so a token right after a ":" starts the reason.
  - The send complement accepts `simulado` and `confirmacion`.
  - `porque`, `hasta`, `pues`, `sin`, `mientras` and ":" cut the complement tail, so whatever follows is the reason and does not count.
  - Cancellation uses the same tail and now includes `deten` and `detente`. `hoy` is a wait filler.
  - The wait clause and the whole-message wait admit a pending case, plus the fillers when a pending case is named. The "no <caso>" contrast still never forms a wait clause.
  - `eximeLaEspera` keeps the exemption for a case that is not pending, and for a clause led by a request verb (`VERBOS_DE_PEDIDO`) that names any case.
- **Linear time (WR-25, T-02-77).** `PATRON_SLUG_EN_TEXTO` is anchored with `(?<![a-z0-9])` and its matches do not change. A 200 KB input took about 55 s per test before this change and now takes milliseconds.
- **Tests.**
  - FILAS_D6310 adds 58 rows: 33 rechaza and 25 otro.
  - The three user-approved pairs are declared in CANCELAN_POR_CASO_PENDIENTE.
  - `siempreCancelan` grows from 1046 to 1565 messages.
  - The 3180 mixture pairs have fixed decisions.
  - New tests: the fourth differential direction, the core-in-its-own-clause test, frozen RELLENO, and checks that the new vocabularies stay disjoint from the confirmation and rejection vocabularies.
  - Loop rows: 7 cancel and 2 keep with one pending case, and 3 cancel and 2 keep with two pending cases.
- **Prompt and contract.** S51 now covers the server wording, a reason, "detén el envío" and the pending case's name. S53 says "junto al nombre de otro caso". The contract derives the server question from `TEXTO_CONFIRMACION.unCaso` and checks that negating it rejects. RN4 is unchanged.
- **Record.** D-63.10 is recorded in 02-CONTEXT.md as a user-approved amendment of D-63.9, with cross-references in D-39 and in items 6 and 9.

## Task Commits

1. **Task 1: CR-05 cancels end to end (tracer)**
   - RED `548ddd9` (test)
   - GREEN `2017eec` (fix)
2. **Task 2: class, differential, vocabularies, two pending cases, linear slug**
   - RED `0ba7387` (test)
   - GREEN `6db6a86` (fix)
3. **Task 3: prompt, contract and D-63.10 record**
   - RED `e401bd2` (test)
   - GREEN `e4712fa` (docs, prompt)
   - Record `d2a91c0` (docs, 02-CONTEXT.md)

## TDD Gate Compliance

- **Task 1 RED.** `bun test` reported 41 failures, all expected: the 33 RECHAZA rows of FILAS_D6310, the declared-pairs test and the 7 new cancel loop rows. The 25 OTRO rows and every existing row passed. JUnit evidence for `"no confirmo el envío simulado" con pendientes [ "ec-corp-andina" ]` returned `RED_EVIDENCE_OK`.
  - Semantic check: the target ran and failed on `toEqual(RECHAZA)`, receiving `otro`. This is the planned assertion; there were no load or syntax errors.
- **Task 2 RED.** Only the three no-pending 200 KB tests failed, at about 55 s each against the 1000 ms limit. Everything else passed, as the plan predicted. JUnit evidence for `'a' repetida 200000 veces sin caso pendiente da otro en menos de un segundo` returned `RED_EVIDENCE_OK`.
  - Semantic check: the failure was on `expect(ms).toBeLessThan(1000)`, and the decision was already `otro`. This is the intended timing assertion.
- **Task 3 RED.** Three tests failed: the two "está entera en su archivo" pins (S51 and S53) and the RETIRADOS_G024 absence test. JUnit evidence for `prompt S51 está entera en su archivo` returned `RED_EVIDENCE_OK`.
- **GREEN commit type.** The GREEN commits use `fix(02-24)` for the code and `docs(02-24)` for the prompt, because the plan prescribes those types. The generic TDD convention uses `feat(...)`. Every `test(...)` commit comes before its GREEN commit.

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts`:
  - new sets COMPLEMENTOS_DE_ENVIO, CORTES_DE_COMPLEMENTO and VERBOS_DE_PEDIDO, and the constant SIGNO_DE_MOTIVO;
  - CANCELACIONES gains deten and detente, and RELLENO_DE_ESPERA gains hoy.
- `src/config/constants/patterns.constants.ts`: PATRON_SLUG_EN_TEXTO gets the left lookbehind.
- `src/domain/policies/confirmacion.policy.ts`: the D-63.10 rejection (tokensDe, colasDeComplemento, esCancelacion, rechazaLaClausula, esClausulaDeEspera, eximeLaEspera, esEsperaCompleta).
- `tests/helpers/corpus-confirmacion.helper.ts`: rechazosConRedaccionYCaso, estresMismaClausula, estresClausulaAparte and RELLENO_10A43AD.
- `tests/unit/confirmacion.policy.test.ts`: FILAS_D6310, the declared pairs, the mixtures, the fourth direction, the vocabulary invariants and the end-to-end timing.
- `tests/loop/compuerta.test.ts` and `tests/loop/compuerta-casos.test.ts`: the CR-05 loop rows.
- `tests/contract/instrucciones-agente.test.ts`: CANCELAN_CON_EC, RETIRADOS_G024, the updated S51 and S53, and the server-wording describe.
- `agent/prompt.md`: S51 and S53.
- `02-CONTEXT.md`: D-63.10.

## Decisions Made

- D-63.10 is applied as the plan specifies, including the user's decision "Acotar la regla" (2026-10-14): a request led by a request verb that names any case is never a rejection, and only the three "No, el de <caso pendiente>" pairs change to rechaza. See the key-decisions line in the frontmatter.
- The timing test.each rows are `[nombre, texto]` tuples, so each 200 KB test has its own short name. Without them, the three tests would share one title, and the RED evidence classifier rejects repeated names as ambiguous.

## Deviations from Plan

None. The plan was executed as written. One cosmetic detail: the timing tests are named by tuple, as described under Decisions Made.

## Issues Encountered

None.

## Closed Findings

- **CR-05**, and gaps 1 and 2 of 02-VERIFICATION.md (truths 38 and 41).
- **WR-25**, which mitigates T-02-77.
- **WR-23 in part.** "hoy no", "cancela el envío simulado", "cancela la confirmación", "no quiero enviarlo sin el certificado" and "no quiero confirmar el envío simulado" now reject.

## Still Open

- WR-17, WR-18, WR-03, the rest of WR-23, WR-24, IN-01(a), IN-23, IN-30(b), IN-31, IN-32 and IN-33.
- Human items: D5 (the live run) and the HV2 replay with the CR-04 and CR-05 phrases.

### Explicit items for the human HV2 replay (declared behavior to accept or reopen)

- "no, envía ec-corp-andina" now gives rechaza: a rejection core in its own clause cancels even next to a confirmation of the pending case. Under D-63.9 it gave otro.
- Word order decides whether a reason counts. "no confirmo porque el NIT está mal" gives rechaza because the reason comes first. "no confirmo el NIT porque está mal" gives otro because a foreign object comes first.
- The three user-approved flips give rechaza and cancel every pending case: "No, el de ec-corp-andina" with one or two pending cases, and "No, el de co-industrias-delta" with two.
- A request that names the pending case keeps it pending: "No, consulta el NIT de co-industrias-delta" with two pending cases, and "No, procesa ec-corp-andina".

## Verification

- `bun run check` passes: tsc, Biome and `bun audit` are clean.
- `bun test`: 1523 pass, 1 skip, 0 fail. After Task 1 alone it was 1505 pass, and after Task 2 it was 1520 pass, matching the planner's prototype.
- Filtered runs:

  | Filter | Pass |
  |---|---|
  | `-t "CR-05"` on tests/loop/compuerta.test.ts | 31 |
  | `-t "CR-05"` on the unit test file | 59 |
  | `-t "D-63.10"` on the unit test file | 64 |
  | `-t "WR-25"` on the unit test file | 5 |
  | `-t "CR-05"` on tests/loop/compuerta-casos.test.ts | 11 |
  | `-t "CR-05"` on the contract test file | 30 |
  | architecture + no-comments guardians | 70 |

- `git diff --name-only fe35813..HEAD` over src/knowledge, src/domain/types, compuerta.policy.ts, ejecutar-turno.service.ts, src/config/strings.ts and reto-01 prints nothing.

## Next Phase Readiness

Gap closure 02-24 is complete. Phase 02 is ready for re-verification (`/gsd-verify-work 02`), followed by the human items D5 and the HV2 replay.

## Self-Check: PASSED

- All 10 modified files exist on disk.
- All 7 task commits are ancestors of HEAD: 548ddd9, 2017eec, 0ba7387, 6db6a86, e401bd2, e4712fa and d2a91c0.
- Acceptance criteria re-run:
  - each grep count matches;
  - forbidden paths are unchanged;
  - `git status --porcelain -- reto-01` is empty.
