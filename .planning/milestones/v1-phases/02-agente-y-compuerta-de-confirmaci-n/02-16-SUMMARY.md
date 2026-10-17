---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 16
subsystem: confirmation-gate
tags: [classifier, confirmation, unicode, nfc, tdd, gap-closure]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "clasificarConfirmacion with ACUSES and the acknowledgement-only branch (02-14); D-63.4 sent-case memory (02-15)"
provides:
  - "clasificarConfirmacion that needs a strong affirmation, a send verb, an accented 'sí' or a bare 'si'"
  - "SI_CON_TILDE and SI_SIN_TILDE constants; AFIRMACIONES without 'si'"
  - "PATRON_NO_PALABRA_UNICODE for the accent-aware word split"
  - "T04 replay seed asserts for the H2 block"
  - "D-63.5 decision record"
affects: [phase-03-confirmation-card, solucion-md-risks, 02-18-model-reask]

actuals:
  tokens: 4100
  tasks: 2
  commits: 4
plan_head_before: b21803dc1b1ebac976b0632c9d5ad03eff21fd18
plan_head_after: 911877bac2501f5b05f2d25d020c13af108c843d

tech-stack:
  added: []
  patterns:
    - "Accent-sensitive word checks run on NFC + lowercase raw text before sinDiacriticos"
    - "Acknowledgements are allowed-but-never-sufficient vocabulary"

key-files:
  created: []
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/config/constants/patterns.constants.ts
    - src/domain/policies/confirmacion.policy.ts
    - tests/unit/confirmacion.policy.test.ts
    - tests/loop/compuerta.test.ts
    - .qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-T04-clasificador-confirmacion.ts
    - .planning/milestones/v1-phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md
    - .planning/milestones/v1-phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md
    - .planning/STATE.md

key-decisions:
  - "D-63.5: un acuse suelto nunca confirma; 'sí' con tilde es afirmación fuerte en cualquier posición; 'si' sin tilde confirma solo como mensaje entero (G-02-18)"
  - "The accented 'sí' is detected by splitting NFC lowercase text with PATRON_NO_PALABRA_UNICODE, independently of sinDiacriticos"
  - "Bare 'si' requires no slugs, so 'si ec-corp-andina' is otro while 'sí ec-corp-andina' confirms"

patterns-established:
  - "Unicode-aware tokenization: /[^\\p{L}\\p{M}\\p{N}]+/u lives in patterns.constants.ts (G11)"
  - "Test strings that must be NFD are written with \\u escapes so source files stay NFC"

requirements-completed: [ENV-02, ENV-03, DEMO-03]

coverage:
  - id: D1
    description: "Bare acknowledgements (ok, okay, vale, listo, claro, correcto and combinations) classify as otro"
    requirement: ENV-02
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: filas adicionales"
        status: pass
    human_judgment: false
  - id: D2
    description: "Unaccented 'si' confirms only as the whole message; accented 'sí' (incl. uppercase and NFD) confirms anywhere"
    requirement: ENV-02
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: filas adicionales"
        status: pass
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#la pregunta del servidor y el clasificador coinciden (ENV-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "End to end through the loop, 'ok', 'listo' and 'si todo bien' leave simular_envio blocked; 'si' and 'SÍ' send exactly once"
    requirement: DEMO-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#CR-01: una frase dudosa con un caso pendiente no envía (ENV-02, D-39)"
        status: pass
      - kind: e2e
        ref: "zsh .qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-B-run.sh <scratch> T04 (6/6)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Server question examples (EJEMPLOS_CONFIRMACION) still confirm, strings.ts unchanged"
    requirement: ENV-03
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#la pregunta del servidor y el clasificador coinciden (ENV-02)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 16: Hardened confirmation classifier Summary

**clasificarConfirmacion now needs a strong affirmation, a send verb, an accented "sí" (detected on NFC text before diacritics are stripped) or a bare "si" to authorize the simulated send; bare acknowledgements and the conditional "si" give otro end to end (G-02-18, D-63.5)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-14T01:14:34Z
- **Completed:** 2026-10-14T01:18:20Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Removed the acknowledgement-only branch (`soloAcuses`) from `esConfirmacionClara`. Acknowledgements stay allowed words that never suffice alone.
- Split "sí" from "si". `tieneSiConTilde` applies `normalize("NFC")` and `toLowerCase` to the raw text and splits it with `PATRON_NO_PALABRA_UNICODE` to find `SI_CON_TILDE`. `esSiSuelto` accepts the unaccented `SI_SIN_TILDE` only when it is the whole message with no slug. `esPermitida` accepts `SI_SIN_TILDE`, so "si, envía" passes the allow-list and confirms because of the verb.
- Flipped 5 table rows and added 15 otro rows plus 17 confirma or falta_caso rows. TABLA_INVESTIGACION still has 43 rows, and the alignment describe is unchanged and green.
- Extended CR-01 in the loop. "ok", "listo" and "si todo bien" end blocked with CONFIRMACION_REQUERIDA and write no ENVIO-SIMULADO.md. The "si" and "SÍ" controls each send exactly once.
- The T04 replay seed now asserts the H2 block and passes 6/6.
- Recorded D-63.5 in 02-CONTEXT, added a closing note to 02-14-SUMMARY, and updated STATE.

## Task Commits

1. **Task 1 RED: pin bare acknowledgements and the conditional 'si' as otro** - `8809bee` (test)
2. **Task 1 GREEN: require a strong affirmation, a send verb, an accented 'sí' or a bare 'si'** - `025395f` (fix)
3. **Task 2: assert the H2 block of the T04 replay seed** - `146e4ed` (test)
4. **Task 2: record D-63.5 and supersede the 02-14 acknowledgement decision** - `911877b` (docs)

## TDD Gate Compliance (Task 1, tdd="true")

- **RED:** `8809bee` added the rows and loop cases. `bun test tests/unit/confirmacion.policy.test.ts` exited 1 with 20 failing rows. The JUnit record was checked with `gsd-tools check tdd-red-evidence` and returned `RED_EVIDENCE_OK` (target `"si todo bien" con pendientes [ "ec-corp-andina" ]`). The loop file failed on "ok", "listo" and "si todo bien". **Semantic assessment:** each target test ran and failed on the planned `toEqual` decision assertion (expected `{decision: "otro"}`, received `{decision: "confirma", caso: "ec-corp-andina"}`). There were no load, syntax or fixture errors. The confirma rows that must keep passing were already green.
- **GREEN:** `025395f`. The plan named this commit `fix(02-16)` because it closes a gap, not a new feature. The verify set gives 298 pass, 0 fail, and `bun run check` exits 0.
- **REFACTOR:** none needed.

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts`: SI_CON_TILDE, SI_SIN_TILDE; "si" removed from AFIRMACIONES
- `src/config/constants/patterns.constants.ts`: PATRON_NO_PALABRA_UNICODE `/[^\p{L}\p{M}\p{N}]+/u`
- `src/domain/policies/confirmacion.policy.ts`: no soloAcuses; tieneSiConTilde, esSiSuelto, tieneFuerza; esConfirmacionClara takes the raw text and the phrase
- `tests/unit/confirmacion.policy.test.ts`: flipped and new rows; NFD row as `"sí"`
- `tests/loop/compuerta.test.ts`: CR-01 extended plus the "si"/"SÍ" control test.each
- `.qa/evidence/.../02-T04-clasificador-confirmacion.ts`: two chequear asserts replace H2_registro
- `02-CONTEXT.md`, `02-14-SUMMARY.md`, `.planning/STATE.md`: decision records

## Decisions Made

- D-63.5, as the user locked it in UAT H2. The edge rows the plan flagged were pinned exactly as listed: "si ec-corp-andina" is otro, "sí ec-corp-andina" confirms, "si si" and "si ok" are otro, and "Si.", "si!" and "¡si!" confirm.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The NFD test row was written as a literal combining mark instead of an escape**
- **Found during:** Task 1 (GREEN verification)
- **Issue:** The edit tool wrote U+0301 as a raw byte, so `tests/unit/confirmacion.policy.test.ts` was not NFC, against the plan's explicit requirement.
- **Fix:** Replaced the literal with the `́` escape. The file is now NFC, and the row still exercises the NFD path at runtime.
- **Files modified:** tests/unit/confirmacion.policy.test.ts
- **Verification:** Python `unicodedata.normalize("NFC", s) == s` is True, and the row passes.
- **Committed in:** 025395f

**2. [Plan count] The T04 seed has 6 asserts, not the 5 the plan stated**
- **Found during:** Task 2
- **Issue:** The seed already had 4 chequear asserts. The plan adds 2, so the total is 6. The plan's "5" was a miscount.
- **Fix:** None needed. Both planned asserts were added as specified, and the run printed `"pasados": 6, "total": 6`. The acceptance intent (pasados equal to total, no H2_registro) holds.
- **Committed in:** 146e4ed

---

**Total deviations:** 2 (1 auto-fixed bug, 1 plan count correction)
**Impact on plan:** None on behavior. No scope creep.

## Issues Encountered

None.

## Verification

- `bun run check` exits 0, and `bun test` gives 1156 pass, 1 skip (live suite) and 0 fail.
- T04 replay ran in a fresh scratchpad directory outside the repo and passed 6/6.
- `git status --porcelain -- reto-01` prints nothing.
- Acceptance greps: soloAcuses 0; `export const SI_CON_TILDE` 1; `export const PATRON_NO_PALABRA_UNICODE` 1; SI_SIN_TILDE in the policy 3; PATRON_NO_PALABRA_UNICODE in the policy 2.
- The 02-14-SUMMARY frontmatter is byte-identical (sha1 d07fe52 before and after).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- G-02-18 is closed. The orchestrator reconciles the disposition ledger (WR-01, IN-04).
- Plan 02-18 covers how the model re-asks after an otro (G-02-21). After an otro the pending state is cancelled (D-37). This carries to the Phase 3 confirmation card and the SOLUCION.md risks.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-14*

## Self-Check: PASSED
