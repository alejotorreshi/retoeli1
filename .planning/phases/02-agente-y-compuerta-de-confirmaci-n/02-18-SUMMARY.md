---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 18
subsystem: agent-instructions
tags: [prompt, knowledge, confirmation-gate, contract-test, live-run, gap-closure]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "cierreConPregunta server question (02-10); D-63.4 sent-case memory (02-15); D-63.5 hardened classifier (02-16); startup message wording (02-17)"
provides:
  - "agent/prompt.md that leaves the closing question to the server, keeps the confirmation turn brief, rejects bare acknowledgements and never re-sends a sent case"
  - "src/knowledge/registro-proveedor.md aligned: RN4, PAQUETE_NO_ARMADO, PAQUETE_DESACTUALIZADO, CONFIRMACION_REQUERIDA (three situations) and Varios casos"
  - "Contract describe 'el prompt y el conocimiento siguen la compuerta del servidor (G-02-21)' with the RETIRADOS list"
  - "Fresh live evidence after the four UAT fixes: VIVO PASS modelo=deepseek-flash llamadas=12 tokens=83531"
  - "STATE.md: 02-09 closing-question decision superseded, 02-18 decision line, Phase 4 modulo/ concern"
affects: [phase-04-modulo-generator, phase-03-confirmation-card, solucion-md-risks]

actuals:
  tokens: 3610
  tasks: 2
  commits: 3
plan_head_before: 5f04d809db9e4c92123967d35464f728f38766d8
plan_head_after: ba48244592a99321992460596aecce2ba7b7b1e2

tech-stack:
  added: []
  patterns:
    - "Retired instruction wording is pinned as absent (RETIRADOS) so an old rule cannot creep back into the prompt"
    - "The prompt describes what the server enforces; it never authorizes anything"

key-files:
  created: []
  modified:
    - agent/prompt.md
    - src/knowledge/registro-proveedor.md
    - tests/contract/instrucciones-agente.test.ts
    - .planning/STATE.md

key-decisions:
  - "02-18: the model never writes the closing confirmation question; the server appends it (cierreConPregunta). The prompt and the knowledge say so, and the contract test pins the retired wording as absent (G-02-21)"
  - "02-18: the prompt names only \"ok\" and \"listo\" as non-confirming examples; the full vocabulary stays in confirmation.constants.ts (D-39)"
  - "02-18: modulo/agent.md (Phase 4) has no server to append the question; carried as a Phase 4 concern in STATE.md, not solved here"

patterns-established:
  - "RETIRADOS list: a contract test asserts that superseded instruction sentences are gone from the prompt and the knowledge"

requirements-completed: [AGT-02, AGT-03, ENV-02, ENV-03]

coverage:
  - id: D1
    description: "agent/prompt.md leaves the closing question to the server, keeps the confirmation turn to the send result, says a bare \"ok\"/\"listo\" is not a confirmation and that a sent case is not sent again without a new armado"
    requirement: AGT-02
    verification:
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#el prompt deja la pregunta de cierre al servidor, acota el turno de confirmación y no acepta acuses"
        status: pass
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#ninguna frase retirada sobre la pregunta de cierre del modelo sigue en los archivos"
        status: pass
    human_judgment: false
  - id: D2
    description: "src/knowledge/registro-proveedor.md says the server appends the question (one question for several cases) and covers the CONFIRMACION_REQUERIDA situations"
    requirement: ENV-03
    verification:
      - kind: unit
        ref: "tests/contract/instrucciones-agente.test.ts#el conocimiento deja la pregunta al servidor y no reenvía un caso ya enviado"
        status: pass
    human_judgment: false
  - id: D3
    description: "Live re-run after the four UAT fixes: the server question closes A and B1, and B2 reports only the simulated send"
    requirement: AGT-03
    verification:
      - kind: e2e
        ref: "bun run test:vivo (tests/live/agente-en-vivo.test.ts)"
        status: pass
    human_judgment: true
    rationale: "CA2 fidelity of model prose (no claim without a tool result, brevity of B2) is a reading judgment that no assertion covers; the executor's reading is recorded below for the human verifier"

duration: 4min
completed: 2026-10-14
status: complete
---

# Phase 02 Plan 18: Prompt and knowledge follow the server gate (G-02-21) Summary

**agent/prompt.md and the process knowledge now leave the closing confirmation question to the server, keep the confirmation turn to the send result, treat a bare "ok"/"listo" as non-confirming and never re-send a sent case. A contract describe pins this, and a fresh live run passed: VIVO PASS modelo=deepseek-flash llamadas=12 tokens=83531.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-14T01:20:50Z
- **Completed:** 2026-10-14T01:24:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Prompt "Formato de respuesta": the summary ends with the Estado line, and the model is told not to write the closing question because the server appends it with the case and its bloqueos.
- Prompt "Protocolo de confirmación":
  - after armar_paquete the model does not ask; the server does;
  - a bare "ok" or "listo" is not a confirmation;
  - with several pending cases the server asks which one;
  - the confirmation turn reports only the case, out/<caso>/ENVIO-SIMULADO.md and the recorded bloqueos;
  - a case whose send "ya quedó registrado" needs a new armado;
  - CONFIRMACION_REQUERIDA defers to the knowledge.
- Knowledge:
  - RN4 now says that a plain acknowledgement is not an explicit confirmation;
  - for PAQUETE_NO_ARMADO and PAQUETE_DESACTUALIZADO, the server asks for the confirmation again;
  - CONFIRMACION_REQUERIDA covers three situations: still pending, already sent, never armed;
  - in "Varios casos", the server appends one question that names every pending package.
- Live run: the redundant state line seen in the previous run (A) and the repeated 17-line summary (B2) are gone.

## Task Commits

1. **Task 1 (RED): contract pins for G-02-21.** `94bb874` (test)
2. **Task 1 (GREEN): prompt and knowledge aligned.** `907ca4f` (docs)
3. **Task 1: STATE.md records.** `ba48244` (docs)
4. **Task 2: live re-run.** No tracked file changed, because the run passed with the Task 1 prompt.

## TDD record (Task 1)

- **RED:** the new describe failed in 3 of 13 tests, and the 10 existing tests passed. The JUnit report (bun `--reporter=junit`) was classified `RED_EVIDENCE_OK` / `target_test_failed`, with target "ninguna frase retirada sobre la pregunta de cierre del modelo sigue en los archivos". Semantic assessment: each failure is a `toContain`/`toEqual` assertion on the planned wording, with all four retired sentences still present. There were no load, syntax or fixture faults. The evidence files were written to a temporary untracked folder and removed before commit.
- **GREEN:** after the edits, the targeted set passed 55 tests with 0 fail, `bun run check` exited 0, and `bun test` ran 1159 pass, 1 skip (the opt-in live test) and 0 fail.
- **REFACTOR:** none needed.

## Corrida en vivo

| Corrida | Resultado | Modelo | Llamadas | Tokens | Aserción fallida |
|---------|-----------|--------|----------|--------|------------------|
| 1 | PASS | deepseek-flash | 12 | 83531 | ninguna |

Run 1 passed, so the second allowed run was not used. It took 19.78 s (01:23:29Z to 01:23:49Z). The output stayed in the session scratchpad. No command named the .env file, and the key was never printed. A scan of the log found 0 key-like strings, 0 runs of six or more digits and 0 email addresses.

Final evidence line (run 1, verbatim):

VIVO PASS modelo=deepseek-flash llamadas=12 tokens=83531

Human check of the run 1 replies (executor reading, for the verifier):
- **(A) co-industrias-delta:**
  - Plain Spanish built only from tool results: Caso with out/co-industrias-delta/, 17 llenos, 0 faltantes, 0 por confirmar, and the Cámara de comercio present with its 27-day aviso. The Estado line reads "LISTO para firma, sin bloqueos".
  - The last paragraph is the LISTO server question, and the reply has exactly one "¿".
  - The redundant "El paquete quedó armado y listo…" line from the previous run is gone.
- **(B1) §11 turn 1, ec-corp-andina:**
  - No asterisks, # or tables.
  - It contains Caso and out/ec-corp-andina/, the counts 13/1/1, "Número de contribuyente especial" as the faltante and RUC por confirmar with its note (identificador extranjero, NIT colombiano).
  - It names "Certificado de cumplimiento tributario" as ausente, the support that blocks the package, and gives BLOQUEADO with that reason.
  - It has exactly one "¿", the server question's, which is the last paragraph.
- **(B2) turn 2, "envía":**
  - It reports only the simulated send: the case ec-corp-andina, the ruta out/ec-corp-andina/ENVIO-SIMULADO.md and the recorded bloqueo ("ausente: Certificado de cumplimiento tributario").
  - It does not repeat the turn-1 summary: there is no "Conteos:" and no "Faltantes:". It has no question.
  - It says that no real email was sent and that the package was not signed.
- **All three:** no maestro value appears, masked or unmasked. Nothing is claimed filled, sent or signed without a tool result. The test asserted that ENVIO-SIMULADO.md exists only for ec-corp-andina, with exactly one ok send line.

## Files Created/Modified

- `agent/prompt.md`: "Formato de respuesta" and "Protocolo de confirmación" rewritten for the server-owned question, the brief confirmation turn, the non-confirming acknowledgements and the no-re-send rule.
- `src/knowledge/registro-proveedor.md`: RN4, PAQUETE_NO_ARMADO, PAQUETE_DESACTUALIZADO, CONFIRMACION_REQUERIDA and "Varios casos" aligned with the server.
- `tests/contract/instrucciones-agente.test.ts`: the G-02-21 describe with the RETIRADOS list (three prompt sentences and one knowledge sentence).
- `.planning/STATE.md`: the 02-09 closing-question decision marked superseded, a new 02-18 decision line and the Phase 4 concern about modulo/agent.md.

## Decisions Made

- The model never writes the closing confirmation question. The server owns it (02-10), and the prompt now says so (G-02-21).
- Only "ok" and "listo" are named as non-confirming examples. The full list stays in constants (D-39).
- The modulo/ consequence (no server in OpenCode) goes to Phase 4 as a concern.

## Deviations from Plan

### Minor process variation

**1. RED and GREEN committed separately**
- **Found during:** Task 1
- **Issue:** the plan asked for one docs(02-18) commit for the prompt, the knowledge and the test. Because the task is `tdd="true"`, the failing test was committed first as `test(02-18)` (94bb874) and the text change second as `docs(02-18)` (907ca4f), so the RED step stays visible in history.
- **Files modified:** the same files, split into two commits.
- **Committed in:** 94bb874, 907ca4f

**2. Added line about where the summary ends (within plan scope)**
- The plan asked to "state that the summary ends with the Estado line". The bullet says so and adds "no agregues después un cierre que la repita ni una pregunta", which targets the redundant line seen in reply A of the previous live run.

**Total deviations:** 2 minor (commit granularity and wording detail). **Impact:** none on behavior or scope. The plan's commits touch only the four allowed files (AGT-02).

## Issues Encountered

None.

## User Setup Required

None. The DeepSeek key was already in the gitignored .env, and the live test's own presence assertion passed.

## Next Phase Readiness

- All 18 plans of phase 02 have summaries. The four UAT gaps (G-02-3, G-02-18, G-02-19, G-02-21) are closed, with live evidence after all fixes. Phase 02 is ready for verification.
- Phase 4 must decide who asks for confirmation in modulo/agent.md (STATE.md concern).
- Still open, as flagged in the plan: after an otro reply the pending state is cancelled (D-37), so the next "envía" is blocked once before the server question returns. This is carried to the Phase 3 confirmation card and the SOLUCION.md risks.

## Self-Check: PASSED

- FOUND: agent/prompt.md, src/knowledge/registro-proveedor.md, tests/contract/instrucciones-agente.test.ts, .planning/STATE.md
- FOUND commits: 94bb874, 907ca4f, ba48244 (`git log 5f04d80..HEAD`)
- Acceptance greps: retired phrases 0/0/0; "el servidor agrega" 2; "no repitas el resumen del caso" 1; "ya quedó registrado" in the knowledge 1
- `git status --porcelain -- reto-01` is empty

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-14*
