---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 10
subsystem: agent
tags: [gate, confirmation, d-44, cr-02, env-02, env-03, demo-03, gap-closure, tdd]
status: complete
requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-03: preguntaConfirmacion and motivosDeBloqueo (readable bloqueos); 02-06: cerrarTurnoConCompuerta, limpiarMarkdown and the §11 harness; 02-09: the live test and the prompt that asks the model to close with a question"
provides:
  - "cierreConPregunta(texto, pendientes) in src/domain/builders/cierre-turno.builder.ts: strips the model's trailing question lines (cutting only at FINES_DE_ORACION) and appends preguntaConfirmacion when a case is pending"
  - "FINES_DE_ORACION in src/config/constants/confirmacion.constants.ts; SIGNO_PREGUNTA removed"
  - "cerrarTurnoConCompuerta calls cierreConPregunta(limpiarMarkdown(texto), pendientes); necesitaPreguntaDeterminista removed from compuerta.policy.ts"
  - "CR-02 loop describe (a), (a-control), (b) and the no-question case in tests/loop/compuerta.test.ts"
  - "19-row cierreConPregunta table plus last-paragraph and no-mangling properties in tests/unit/cierre-turno.builder.test.ts"
  - "Live assertions: last paragraph of both replies equals the server question, and the ec reply names the readable bloqueo"
affects: [02-14-classifier, 02-13-live-run, phase-03-confirmation-card, phase-04-solucion-riesgos]
actuals:
  tokens: 6478
  tasks: 2
  commits: 4
plan_head_before: cce11cb5776d1db189aa8beb106a3889b99a3623
plan_head_after: aa77cd3809f57ce9ce64ab8c12c5118e6c4527f0
tech-stack:
  added: []
  patterns:
    - "With a case pending, the server owns the closing text: the model's trailing question block is removed and the deterministic question is always the last paragraph"
    - "Model text is cut only at a sentence end (terminator plus space) before the first question mark; otherwise the whole question line is dropped, so no fragment is left"
key-files:
  created: []
  modified:
    - src/config/constants/confirmacion.constants.ts
    - src/domain/builders/cierre-turno.builder.ts
    - src/loop/services/cierre-turno.service.ts
    - src/domain/policies/compuerta.policy.ts
    - tests/loop/compuerta.test.ts
    - tests/live/agente-en-vivo.test.ts
    - tests/unit/cierre-turno.builder.test.ts
    - tests/unit/compuerta.policy.test.ts
key-decisions:
  - "02-10: with at least one pending case, every turn ends with preguntaConfirmacion(pendientes) as its last paragraph; any trailing model question is removed first, even one that names the case (D-44 enforced strictly, RESEARCH Pattern 8 superseded)"
  - "02-10: sinPreguntaFinal works on lines and cuts only at FINES_DE_ORACION ('. ', '! ') before the first question mark; with no sentence end before it, the whole line is dropped"
  - "02-10: gap-2 text '(a) ... plus si gives no ENVIO-SIMULADO.md' is satisfied through the verifier's alternative clause (server question is the last paragraph and lists the bloqueos); the literal no-send expectation is asserted in (a-control)"
  - "02-10: agent/prompt.md is not edited; it stays standalone for modulo/ and keeps asking the model for a closing question, which the server replaces in this app"
requirements-completed: [ENV-02, ENV-03, DEMO-03]
coverage:
  - id: D1
    description: "A turn with a pending case always ends with the server question; an unrelated model question naming the case is removed and the following 'sí' sends exactly once"
    requirement: ENV-02
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#(a) la pregunta ajena del modelo se quita, la del servidor es el último párrafo y el 'sí' siguiente la responde y envía una vez (vía alternativa del gap 2)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#(a-control) sin caso pendiente la pregunta del modelo queda al final y un 'sí' no autoriza el envío"
        status: pass
    human_judgment: false
  - id: D2
    description: "The reply text names the case and lists the readable bloqueos even when the model closed with its own send question; the Estado line above it is kept"
    requirement: ENV-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#(b) la pregunta de envío del modelo se quita, la línea de estado queda y la respuesta lista los bloqueos legibles"
        status: pass
    human_judgment: false
  - id: D3
    description: "cierreConPregunta stripping rules pinned row by row, with last-paragraph and no-mangling properties"
    requirement: ENV-03
    verification:
      - kind: unit
        ref: "tests/unit/cierre-turno.builder.test.ts#cierreConPregunta (D-44, CR-02)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Live test asserts the server question is the last paragraph of both live replies, with the readable bloqueo for ec-corp-andina"
    requirement: DEMO-03
    verification:
      - kind: other
        ref: "bun test tests/live (1 skip, 0 fail by default)"
        status: pass
    human_judgment: true
    rationale: "The live assertions only type-check and skip here; they run against the real model once in plan 02-13"
duration: 4 min
completed: 2026-10-13
---

# Phase 2 Plan 10: The server question always closes a pending turn (CR-02) Summary

When a case is pending, the turn now always ends with the server's question, which names the case and lists the readable bloqueos. Any trailing question the model wrote is removed first, so the next "sí" or "envía" can only answer server-written text. The removal cuts only at sentence ends and never leaves half a sentence of the model's text.

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-13T21:50:17Z
- **Completed:** 2026-10-13T21:54:38Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- `cierreConPregunta(texto, pendientes)` returns `texto` byte for byte when nothing is pending. Otherwise it returns `sinPreguntaFinal(texto)`, a blank line and `preguntaConfirmacion(pendientes)`. Because the server question never contains `SEPARADOR_PARRAFOS`, the last paragraph is always exactly that question (D-44, D-63.2). This holds for final, cap, budget and error endings, since the loop passes `""` for error endings.
- `sinPreguntaFinal` works on lines. Blank trailing lines are dropped. A trailing question line is cut after the last `". "` or `"! "` that comes before its first `¿`/`?`. If there is no such sentence end, the whole line is dropped and the loop continues. It stops at the first line without a question mark. So `"Estado: BLOQUEADO. ¿Confirmas el envío?"` keeps `"Estado: BLOQUEADO."`, while `"Revisa el RUC (¿es el correcto?)."`, `"Si te parece bien, ¿lo envío?"`, `"Revisa la versión 2.1, ¿la envío?"` and `"BLOQUEADO.¿Lo envío?"` are dropped whole.
- `cerrarTurnoConCompuerta` no longer asks whether the model's question "names the case". The model-trusting predicate `necesitaPreguntaDeterminista`, its paragraph helper and `SIGNO_PREGUNTA` are gone, and `cierreConPregunta` is the only path that decides the closing text.
- The CR-02 loop tests run end to end through the real tools. (a) The unrelated model question is gone, and the last paragraph of the text event, of the PRD 6.4 reply and of the saved assistant message (as seen in the turn-2 request) is the server question. The following "sí" writes ENVIO-SIMULADO.md once. (a-control) With nothing pending, the model question stays last and "sí" plus a model simular_envio is blocked with CONFIRMACION_REQUERIDA, with no ENVIO-SIMULADO.md written. (b) The model's send question is removed, the Estado line stays, and "Certificado de cumplimiento tributario" is in the reply.
- The live test replaces the weak `endsWith("?")` with exact last-paragraph assertions for both replies (`PENDIENTE_CO` for co-industrias-delta, `PENDIENTE_EC` for ec-corp-andina), plus `TEXTO_SOPORTE.nombre("certificado_cumplimiento_tributario")` in the ec reply. It stays skipped by default.

## Task Commits

1. **Task 1 (tracer, TDD): the server question always closes a turn with a pending case.** `7e3d7ca` (test, RED) and `219085b` (fix, GREEN).
2. **Task 2 (TDD): retire the model-trusting predicate and pin cierreConPregunta.** `b745267` (test) and `aa77cd3` (refactor).

## TDD Gate Compliance

- **RED (Task 1):** `7e3d7ca` added the CR-02 describe. `bun test tests/loop/compuerta.test.ts --reporter=junit` exited 1 with 5 pass and 2 fail. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format junit) for target "(a) la pregunta ajena del modelo se quita…". Semantic assessment: the target ran and failed on its planned assertion, `expect(texto).not.toContain("¿Quieres que vuelva a generar")`, because the reply still ended with the model question. (b) failed for the same reason on `not.toContain("¿Confirmo el envío de ec-corp-andina?")`. There were no load, fixture or syntax faults. The controls ((a-control) and the no-question case) passed, as intended.
- **GREEN (Task 1):** `219085b`. The loop verify set gave 98 pass and 0 fail, `bun test tests/live` gave 1 skip and 0 fail, and `bun run check` exited 0.
- **Task 2:** the unit table pins behavior that Task 1 had already implemented, so it could not go RED (Fail-Fast rule 1: the feature exists by design). To prove the table is not vacuous, a temporary mutation that cuts at the first question mark when no sentence end precedes it was run. It failed 12 rows (parenthetical, mid-sentence, decimal, glued period, two question lines, line without "¿") and was then reverted with `git checkout` on that single file. The REFACTOR commit `aa77cd3` deleted the predicate, and all 1010 tests passed afterwards.

## Files Created/Modified

- `src/config/constants/confirmacion.constants.ts`: adds `FINES_DE_ORACION = [". ", "! "] as const` and removes `SIGNO_PREGUNTA`.
- `src/domain/builders/cierre-turno.builder.ts`: adds `cierreConPregunta`, the private `sinPreguntaFinal` and `corteEnFinDeOracion`.
- `src/loop/services/cierre-turno.service.ts`: the closing goes through `cierreConPregunta(limpiarMarkdown(texto), pendientes)`.
- `src/domain/policies/compuerta.policy.ts`: `necesitaPreguntaDeterminista` and `ultimoParrafo` are deleted.
- `tests/loop/compuerta.test.ts`: adds `guionTurno1(texto)`, `PASOS_HASTA_GENERAR` and `PENDIENTE_EC`, and the CR-02 describe.
- `tests/unit/cierre-turno.builder.test.ts`: adds the 19-row `FILAS_CIERRE` table and its properties.
- `tests/unit/compuerta.policy.test.ts`: the predicate describe is removed.
- `tests/live/agente-en-vivo.test.ts`: adds the last-paragraph and readable-bloqueo assertions.

## Decisions Made

- With a case pending, the server question always closes the turn, even when the model's question names the case. This supersedes RESEARCH Pattern 8 ("append only when the text does not end in '?'"), which was the source of CR-02.
- The cut happens only at a sentence end that has a space after it, so "2.1" and "BLOQUEADO.¿" are never sentence ends. Dropping the whole line can remove a non-question clause on the same line (for example "Si te parece bien,"). That is the conservative choice, because the server question restates the case, the state and the bloqueos.
- **Reconciliación del gap 2.** The gap text "(a) … plus 'sí' gives no ENVIO-SIMULADO.md" is met through the verifier's alternative clause: "o la pregunta del servidor es el último párrafo y lista los bloqueos". After this fix the server question is the last thing the analyst sees, so the following "sí" is an explicit confirmation of that question under D-37, and it sends once. The test name for (a) says so ("vía alternativa del gap 2"). The literal no-send expectation is asserted in (a-control), where a model question really is the last text shown.
- agent/prompt.md is not edited. It must stay standalone for modulo/ (Phase 4), so it keeps asking the model to close with a question, and the server replaces that question when this app runs the loop.

## Riesgo residual (T-02-41, aceptado)

- `cierreConPregunta` solo quita las líneas de pregunta finales del modelo. Las líneas del modelo que están por encima de la pregunta del servidor y no son preguntas se quedan en la respuesta. Esas líneas podrían condicionar lo que la analista entiende que significa su siguiente "sí", por ejemplo: "Si respondes sí, solo regenero el formulario.".
- Lo que la compuerta autoriza lo sigue decidiendo solo el servidor: el caso pendiente según D-37 y un único `simular_envio` para ese caso, después de una confirmación explícita. La pregunta del servidor es siempre el último párrafo y nombra el caso, el envío simulado y los bloqueos legibles.
- El riesgo se acepta para la Phase 2. Pasa a la sección de riesgos de SOLUCION.md (Phase 4). Además, la tarjeta de confirmación de la Phase 3, construida desde el evento estructurado de D-44 (`confirmation_required`), muestra el caso, la acción y los bloqueos aparte del texto del modelo.
- Reconciliación del gap 2: el texto "(a) … más 'sí' no produce ENVIO-SIMULADO.md" se cumple por la cláusula alternativa del verificador (la pregunta del servidor es el último párrafo y lista los bloqueos). El "sí" que sigue confirma la pregunta del servidor y envía una sola vez. La expectativa literal de que no haya envío se comprueba en (a-control), donde la última línea visible sí es una pregunta del modelo.

## Deviations from Plan

### Process deviations

**1. [Process] Commits on the protected default branch `main`**
- **Found during:** Task 1 (first commit)
- **Issue:** The executor's pre-commit HEAD assertion reports `main` as protected (`git.base-branch --is-protected` returned true).
- **Fix:** I followed the orchestrator's dispatch. It ran this plan as a sequential executor on the main working tree with branch `main` and `git.branching_strategy: none`, which is how every earlier plan in this phase was committed. I made no ref rewrites and no force operations.
- **Commits:** 7e3d7ca, 219085b, b745267, aa77cd3

**2. [Process] Task 2 landed as two commits instead of one**
- **Found during:** Task 2
- **Issue:** The plan asked for a single `refactor(02-10)` commit for Task 2.
- **Fix:** The pinned unit table went in as `test(02-10)` (`b745267`) and the predicate removal as `refactor(02-10)` (`aa77cd3`), so the TDD history shows the characterization tests separately from the deletion. The content is the same as planned.

**Total deviations:** 2 process deviations, 0 code auto-fixes. **Impact on plan:** none on behavior. All acceptance criteria pass.

## Issues Encountered

None.

## Verification

- `bun test tests/loop/compuerta.test.ts tests/loop/compuerta-casos.test.ts tests/loop/tope.test.ts tests/loop/presupuesto.test.ts tests/loop/inyeccion.test.ts tests/architecture.test.ts`: 98 pass, 0 fail.
- `bun test tests/unit/cierre-turno.builder.test.ts tests/unit/compuerta.policy.test.ts tests/loop/compuerta.test.ts tests/loop/compuerta-casos.test.ts tests/architecture.test.ts tests/sin-comentarios.test.ts`: 179 pass, 0 fail.
- `bun test tests/live`: 0 pass, 1 skip, 0 fail.
- `bun test` (full suite): 1010 pass, 1 skip, 0 fail.
- `bun run check` (tsc, Biome and bun audit): exit 0.
- `grep -c "cierreConPregunta(" src/loop/services/cierre-turno.service.ts` gives 1. `grep -c "export function cierreConPregunta" src/domain/builders/cierre-turno.builder.ts` gives 1. `grep -c "preguntaConfirmacion" tests/live/agente-en-vivo.test.ts` gives 3.
- `grep -rnw "necesitaPreguntaDeterminista" src tests` and `grep -rnw "SIGNO_PREGUNTA" src tests` print nothing. `grep -c "export const FINES_DE_ORACION"` gives 1.
- The parenthetical and mid-sentence rows are pinned: each grep gives 2.
- `git status --porcelain -- reto-01` prints nothing.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 02-14 (wave 2) can now edit `confirmacion.constants.ts` for the CR-01 classifier and the wording of the server question. The unit table and the loop tests compare against `preguntaConfirmacion(...)` rather than literal text, so a wording change does not break them.
- Plan 02-13 runs the live suite once, now with the strict last-paragraph assertions.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-13*

## Self-Check: PASSED
