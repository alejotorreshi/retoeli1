---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 14
subsystem: agent
tags: [gate, confirmation, classifier, d-39, cr-01, env-02, env-03, demo-03, gap-closure, tdd]
status: complete
requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-03: clasificarConfirmacion, TEXTO_CONFIRMACION and preguntaConfirmacion; 02-06: the §11 loop harness; 02-10: cierreConPregunta (server question is the last paragraph) and FINES_DE_ORACION"
provides:
  - "ACUSES (ok, okay, vale, listo, claro, correcto) in src/config/constants/confirmacion.constants.ts; AFIRMACIONES keeps only strong affirmations; VERBOS_ENVIO keeps only imperatives (envio, envie and enviar removed)"
  - "clasificarConfirmacion confirms only with a strong affirmation or send verb, or with acknowledgements alone; acknowledgement plus filler is otro"
  - "EJEMPLOS_CONFIRMACION = ['envía', 'sí'] in src/config/strings.ts; TEXTO_CONFIRMACION.unCaso, variosCasos and the simular_envio next step render their quoted examples from it and no longer promise 'cualquier otra cosa' does not send"
  - "18 new FILAS_EXTRA rows and the alignment describe 'la pregunta del servidor y el clasificador coinciden (ENV-02)' in tests/unit/confirmacion.policy.test.ts"
  - "CR-01 loop describe in tests/loop/compuerta.test.ts: 'y el envío' and 'ok, gracias' leave the model's send blocked"
affects: [02-13-live-run, phase-03-confirmation-card, phase-04-solucion-riesgos]
actuals:
  tokens: 2981
  tasks: 2
  commits: 4
plan_head_before: ee306076f8de8ede8f11effce66dd78f0603cc9c
plan_head_after: fada449983a70aa52f5b1e526f5d85b4fa367b00
tech-stack:
  added: []
  patterns:
    - "Confirmation grammar has three tiers: strong (AFIRMACIONES, VERBOS_ENVIO), weak (ACUSES, valid only on their own) and filler (RELLENO, never sufficient)"
    - "Server-facing confirmation examples derive from one constant, and a test classifies every quoted example so the text and the classifier cannot drift apart"
key-files:
  created: []
  modified:
    - src/config/constants/confirmacion.constants.ts
    - src/domain/policies/confirmacion.policy.ts
    - src/config/strings.ts
    - tests/unit/confirmacion.policy.test.ts
    - tests/loop/compuerta.test.ts
key-decisions:
  - "02-14: weak acknowledgements (ok, okay, vale, listo, claro, correcto) confirm only when the message is made of them alone; with any filler ('ok, gracias', 'vale, el paquete') the decision is otro (D-39 ante la duda, otro)"
  - "02-14: VERBOS_ENVIO keeps only imperatives; the noun 'envío', 'envié' and 'enviar' cannot be told apart from a status statement once diacritics are stripped, so they never confirm"
  - "02-14: the server question promises only that a reply that is not an explicit confirmation sends nothing, and quotes 'envía' and 'sí' (or 'envía <caso>' with several cases) from EJEMPLOS_CONFIRMACION"
requirements-completed: [ENV-02, ENV-03, DEMO-03]
coverage:
  - id: D1
    description: "Doubtful phrases with ec-corp-andina pending ('y el envío', 'el envío', 'envío', 'entonces el envío', 'todo bien con el envío', 'ok, gracias', 'listo, gracias', 'vale, el paquete', 'ya lo envié', 'el paquete por enviar', 'ok, el envío', 'claro, gracias') classify as otro, while every pre-existing row and 'vale', 'listo', 'claro, ok', 'sí, gracias', 'sí, el envío' keep confirming"
    requirement: ENV-02
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: filas adicionales"
        status: pass
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#clasificarConfirmacion: tabla del Patrón 7 (ENV-02, D-39, D-40)"
        status: pass
    human_judgment: false
  - id: D2
    description: "End to end through the loop, 'y el envío' or 'ok, gracias' after the §11 turn 1 leaves the model's proveedor_simular_envio blocked with CONFIRMACION_REQUERIDA and writes no ENVIO-SIMULADO.md; 'envía' still writes it once"
    requirement: ENV-02
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#CR-01: una frase dudosa con un caso pendiente no envía (ENV-02, D-39)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#turno 1 bloquea el envío del modelo y pregunta; turno 2 'envía' escribe ENVIO-SIMULADO.md una vez"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every quoted example in the server question (one case, blocked, several cases) and in the simular_envio next step classifies as confirma for the case it names; the texts drop 'cualquier otra cosa', stay one paragraph, keep their closing questions, 'con esos bloqueos' and 'envía <caso>'"
    requirement: ENV-03
    verification:
      - kind: unit
        ref: "tests/unit/confirmacion.policy.test.ts#la pregunta del servidor y el clasificador coinciden (ENV-02)"
        status: pass
      - kind: unit
        ref: "tests/unit/cierre-turno.builder.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Reworded server question reads naturally to the analyst in Spanish"
    requirement: DEMO-03
    verification: []
    human_judgment: true
    rationale: "Wording quality is a human judgment; the tests only pin its structure and its agreement with the classifier"
duration: 3 min
completed: 2026-10-13
---

# Phase 2 Plan 14: Only an explicit confirmation sends, and the question says so (CR-01) Summary

**The classifier now treats the noun "envío", non-imperative forms of the verb and acknowledgements followed by filler as `otro`. The server question quotes "envía" and "sí" from one constant and now promises only that a reply that is not an explicit confirmation sends nothing.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-13T22:10:20Z
- **Completed:** 2026-10-13T22:13:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- **Three-tier grammar (D-39).** `AFIRMACIONES` keeps only the strong affirmations (si, dale, confirmo, confirmado, confirma, procede, proceda, adelante, hazlo, autorizo, autorizado). The new `ACUSES` set holds the weak acknowledgements (ok, okay, vale, listo, claro, correcto). `VERBOS_ENVIO` keeps only imperatives (envia, envialo, enviala, manda, mandalo, despacha). "envio" stays only in `RELLENO`, which removes the root cause of CR-01. `FINES_DE_ORACION` from 02-10 and the other sets are unchanged.
- **`esConfirmacionClara` change.** Every word must still be allowed. The phrase must also contain a strong affirmation or send verb, or be made only of acknowledgements. So "ok" and "claro, ok" confirm, while "ok, gracias" and "vale, el paquete" do not. Question marks, `NEGACIONES`, the word cap, `CONDICIONALES` and the slug rules keep their order.
- **The question and the classifier agree.** `EJEMPLOS_CONFIRMACION = ["envía", "sí"]` feeds a private `confirmacionExplicita` helper. One case gets `"envía" o "sí"`. Several cases get `"envía <caso>"`. `unCaso` (LISTO and BLOQUEADO), `variosCasos` and `SIGUIENTE_PASO[SIMULAR_ENVIO]` now say "si la respuesta no es una confirmación explícita, no se envía nada/ninguno". The opening sentence with the readable bloqueos, "con esos bloqueos", "¿Confirmas el envío simulado de <caso>?", "envía <caso>" and "¿Cuál caso confirmas para el envío simulado?" are all kept, with no double line break, so 02-10's `cierreConPregunta` still makes the question the last paragraph.
- **Loop proof.** After the §11 turn 1, a turn-2 "y el envío" or "ok, gracias" followed by the model's `proveedor_simular_envio` ends `ok: false` with `CONFIRMACION_REQUERIDA`. No ENVIO-SIMULADO.md and no ok send line are written. The existing "envía" control still writes it once.

## Task Commits

1. **Task 1 (tracer, TDD): a doubtful phrase with a pending case never sends.** `692810a` (test, RED) and `a3c200b` (fix, GREEN).
2. **Task 2 (TDD): the server question promises exactly what the classifier accepts.** `9f1fa80` (test, RED) and `fada449` (fix, GREEN).

## TDD Gate Compliance

- **RED (Task 1):** `692810a`. `bun test tests/unit/confirmacion.policy.test.ts tests/loop/compuerta.test.ts` gave 69 pass and 14 fail. All 12 new `otro` rows failed, and so did both CR-01 loop cases. The boundary rows passed, as intended, because they already confirmed. With `bun test tests/loop/compuerta.test.ts --reporter=junit` (exit 1), `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format junit) for the target "\"y el envío\" en el turno 2 deja bloqueado el envío del modelo". Semantic assessment: the target ran and failed on its planned assertion at compuerta.test.ts:208. `finesDeHerramienta(turno2)` was `ok: true` with the resumen "ec-corp-andina: envío simulado registrado con bloqueos …", so the doubtful phrase really did authorize the send. There were no load, fixture or syntax faults.
- **GREEN (Task 1):** `a3c200b`. The verify set (confirmacion.policy, compuerta, compuerta-casos, inyeccion, architecture, sin-comentarios) gave 170 pass and 0 fail, and `bun run check` exited 0. The tracer gate (interactive, `end-of-phase`, automated-only verify) re-ran the verify set green before Task 2.
- **RED (Task 2):** `9f1fa80`. `bun test tests/unit/confirmacion.policy.test.ts --reporter=junit` exited 1 with 80 pass and 6 fail. `check tdd-red-evidence` returned `RED_EVIDENCE_OK` for the target "la pregunta LISTO cita cada ejemplo de confirmación". Semantic assessment: the target ran and failed on `expect(citas(texto)).toContain("sí")`, because the old wording quoted only "envía". The four "no promete …" cases failed on `not.toContain("cualquier otra cosa")`, as planned. The classification cases passed under the old wording, which was expected because "envía" already confirmed. The commit also declares `EJEMPLOS_CONFIRMACION` in strings.ts, so the test file loads and fails on assertions rather than on a missing export. The wording was not touched.
- **GREEN (Task 2):** `fada449`. The verify set gave 301 pass and 0 fail, `bun run check` exited 0, and `bun test` gave 1064 pass, 1 skip (live) and 0 fail.
- **Commit type note:** the plan asks for `fix(02-14)` GREEN commits (gap closure), so there is no `feat(02-14)` commit. Each `test(02-14)` RED commit comes before its `fix(02-14)` GREEN commit.

## Files Created/Modified

- `src/config/constants/confirmacion.constants.ts`: adds `ACUSES` and narrows `AFIRMACIONES` and `VERBOS_ENVIO`.
- `src/domain/policies/confirmacion.policy.ts`: adds the private predicates `esAfirmacionFuerte`, `esAcuse` and `soloAcuses`. `esConfirmacionClara` needs a strong word or acknowledgements alone.
- `src/config/strings.ts`: adds `EJEMPLOS_CONFIRMACION`, the private `confirmacionExplicita` helper and the reworded `TEXTO_CONFIRMACION` and simular_envio next step.
- `tests/unit/confirmacion.policy.test.ts`: adds 18 `FILAS_EXTRA` rows (`TABLA_INVESTIGACION` is untouched at 43 rows) and the alignment describe with labeled rows.
- `tests/loop/compuerta.test.ts`: adds the CR-01 describe, built on the same harness as the "'¿y si envío?' no autoriza" test.

## Decisions Made

- Weak acknowledgements confirm only when the message contains nothing else, because "ok, gracias" is how people acknowledge a summary (REVIEW CR-01).
- The alignment test titles use labels such as "la pregunta LISTO" instead of `%p` with the rendered text, so the test names stay stable when the wording changes.
- agent/prompt.md is not edited. Its examples "envía" and "sí, envíalo" still confirm.

## Deviations from Plan

None. The plan was executed as written.

Process note: the executor's pre-commit protected-branch check reports `main` as protected. The orchestrator dispatched this plan sequentially on `main` with normal commits (`git.branching_strategy: none`), as it did for 02-10 through 02-12, so the commits went to `main`.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- VERIFICATION gap 1 (CR-01) is covered. Every phrase it names is an `otro` row, and the loop proves that a doubtful phrase leaves the send blocked.
- Together with 02-10, ROADMAP Phase 2 criterion 2 holds under test.
- Plan 02-13's live run will show the reworded question to the real model and analyst flow.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-13*

## Self-Check: PASSED
