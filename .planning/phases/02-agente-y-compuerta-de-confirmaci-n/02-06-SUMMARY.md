---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 06
subsystem: agent
tags: [confirmation-gate, loop, fake-llm, prompt-injection, plain-text, prd-6.4, d-37, d-38, d-39, d-40, d-42, d-44, d-48, d-49, d-50, d-60, d-63]
status: complete
requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-02: ejecutarTurno with the session lock, crearAgente; 02-03: clasificarConfirmacion, compuerta.policy, preguntaConfirmacion; Phase 1: createAuditLog, the five tools, MENSAJE_ERROR/RESUMEN_HERRAMIENTA"
provides:
  - "despacharLlamada: the server decides every proveedor_simular_envio, builds {caso, confirmado: true} itself, writes the CA4 line for blocked attempts and tracks armar_paquete results"
  - "cerrarTurnoConCompuerta: gate state at turn end, one confirmation_required per pending caso, markdown strip and the deterministic question"
  - "respuestaDeTurno: PRD 6.4 {reply, toolCalls, needsConfirmation} from the event stream"
  - "limpiarMarkdown plus PATRON_NEGRITA, PATRON_ENCABEZADO_MD, PATRON_SEPARADOR_TABLA_MD, PATRON_BORDE_TABLA_MD, SEPARADOR_CELDA_PLANO (D-60)"
  - "Session state: Sesion.compuerta and Sesion.paquetesConocidos; EntradaTurno.confirmacion (Phase 3 button); DependenciasTurno.registrar wired to createAuditLog"
  - "Test harness: crearLlmFalso, llamar, respuestaHerramientas, respuestaTexto, pasoGenerarConMapeo, historialIntegro, crearAgentePrueba, eventos.helper, pii.helper (sensiblesDelMaestro)"
  - "Fixture tests/fixtures/casos/zz-inyeccion with injected orders in cliente and cuerpo"
affects: [02-07, 02-08, 02-09, phase-03-api-sse, phase-04-modulo]
actuals:
  tokens: 16179
  tasks: 3
  commits: 6
plan_head_before: 47c7e6dbfd41e900bf3613044927d7259bbd5f48
plan_head_after: 5279eb2febbe97eaa986cad89cab75023f1e0d3e
tech-stack:
  added: []
  patterns:
    - "Server-built tool call: a granted send never spreads the model's args; it builds {caso, confirmado: true} from the grant"
    - "Gate events (armado, bloqueado, enviado) are collected per call and folded once at turn end, for every non-abort ending"
    - "The final text event is emitted after the session is saved, so the closing question and the confirmation events are derived from tool results, not from the model text"
    - "Fake-LLM loop tests over the real tools in a temp project, with historialIntegro on every recorded request"
key-files:
  created:
    - src/loop/services/despacho-llamada.service.ts
    - src/loop/services/cierre-turno.service.ts
    - src/loop/services/respuesta-turno.service.ts
    - src/domain/utils/texto-plano.util.ts
    - tests/unit/texto-plano.util.test.ts
    - tests/helpers/llm-falso.helper.ts
    - tests/helpers/types/llm-falso.type.ts
    - tests/helpers/historial.helper.ts
    - tests/helpers/agente-prueba.helper.ts
    - tests/helpers/types/agente-prueba.type.ts
    - tests/helpers/eventos.helper.ts
    - tests/helpers/types/eventos.type.ts
    - tests/helpers/pii.helper.ts
    - tests/helpers/types/pii.type.ts
    - tests/loop/compuerta.test.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/loop/inyeccion.test.ts
    - tests/fixtures/casos/zz-inyeccion/solicitud.json
    - tests/fixtures/casos/zz-inyeccion/plantilla-campos.json
    - tests/fixtures/casos/zz-inyeccion/soportes-exigidos.json
  modified:
    - src/loop/types/turno.type.ts
    - src/loop/schemas/resultado-herramienta.schema.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/loop/wiring/agente.wiring.ts
    - src/config/constants/agent.constants.ts
    - src/config/constants/patterns.constants.ts
    - tests/loop/trazador-agente.test.ts
    - tests/e2e/pii.test.ts
    - .planning/REQUIREMENTS.md
key-decisions:
  - "A blocked proveedor_simular_envio returns the tool's own refusal JSON byte for byte and writes the CA4 line through the injected Registrar, with casoResuelto only when the caso has a known package"
  - "revocarAlArmar runs on every armar_paquete call that names the caso, not only on ok results, so a failed re-arm also drops the grant"
  - "A granted send that the tool rejects (for example PAQUETE_DESACTUALIZADO) consumes the grant and emits no gate event; the agent must re-arm and ask again"
  - "paquetesConocidos keeps a caso after a successful send, so a later blocked retry re-opens the question instead of sending twice (AGT-04 idempotency)"
  - "On error or cap endings the text event carries only the question; the saved assistant message is the error text plus the question, so the next turn's history shows that the agent asked"
  - "limpiarMarkdown works line by line: separator rows go first, then bold and heading marks, then row borders are trimmed and inner pipes become ' - '"
patterns-established:
  - "crearAgentePrueba({raiz, guion, ...Partial<DependenciasTurno>}) is the loop test entry point; later plans override caps or the deadline without touching the helper types"
  - "One describe per gate rule in tests/loop/compuerta-casos.test.ts"
requirements-completed: [ENV-02, ENV-03, SOLI-03, AGT-04, DEMO-03]
coverage:
  - id: D1
    description: "PRD §11 end to end: turn 1 blocks the model's send and asks with the bloqueos; turn 2 'envía' writes ENVIO-SIMULADO.md once; 'No envíes nada todavía' and '¿y si envío?' grant nothing"
    requirement: ENV-02
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gate edge cases D-40, D-42, D-63.1, D-63.2, D-38, idempotency and the D-39 button"
    requirement: ENV-02
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Closing question, confirmation_required events and needsConfirmation computed by the server, also after a provider error"
    requirement: ENV-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-63.2"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Plain-text final replies (D-60) and the PRD 6.4 fold"
    requirement: ENV-03
    verification:
      - kind: unit
        ref: "tests/unit/texto-plano.util.test.ts"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-60"
        status: pass
    human_judgment: false
  - id: D5
    description: "Injected orders in cliente, cuerpo and the chat change nothing; no sensitive maestro value in any request or event"
    requirement: SOLI-03
    verification:
      - kind: integration
        ref: "tests/loop/inyeccion.test.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/pii.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Guardians G1-G14, no-comments, tsc, Biome and audit pass"
    requirement: DEMO-03
    verification:
      - kind: command
        ref: "bun run check"
        status: pass
      - kind: unit
        ref: "tests/architecture.test.ts"
        status: pass
    human_judgment: false
duration: 10 min
completed: 2026-10-13
---

# Phase 02 Plan 06: Confirmation gate in the loop Summary

**The server, not the model, now decides every simulated send. It builds `{caso, confirmado: true}` from a one-shot grant, ends every turn that armed a package with the question and a `confirmation_required` event, strips markdown from the reply, and PRD §11 plus injected orders pass deterministically with a fake LLM.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-10-13T19:44:29Z
- **Completed:** 2026-10-13T19:54Z
- **Tasks:** 3
- **Files modified:** 29 (20 created, 9 modified)

## Accomplishments

- `despacharLlamada` applies the gate per call. Without an unused grant for exactly that caso, `proveedor_simular_envio` never runs. The model gets the tool's literal refusal ("requiere confirmación explícita") and `out/log.jsonl` gets the CA4 line. With a grant, the server builds the arguments, so extra keys from the model don't burn it and a different caso is blocked. `proveedor_armar_paquete` results register a known package with its bloqueos and readable motivos, and revoke a grant for that caso (D-42).
- `ejecutarTurno` classifies the new message (or takes the structured button decision, which wins over the text) and opens the turn with `abrirTurno`. It keeps the pending casos for a "¿cuál?" follow-up (D-63.3) and closes every non-abort ending through `cerrarTurnoConCompuerta`, provider errors included (D-63.2). The session saves `compuerta` and `paquetesConocidos`. The grant is never persisted.
- `cerrarTurnoConCompuerta` runs `limpiarMarkdown` on the model text, appends the deterministic question when the last paragraph doesn't already ask about every pending caso, and emits one `confirmation_required {caso, accion, bloqueos}` per pending caso.
- `respuestaDeTurno` folds the events into the PRD 6.4 `{reply, toolCalls, needsConfirmation}` that the Phase 3 non-streaming endpoint will return.
- Test harness: a scripted fake LLM that records every request, `historialIntegro`, and `crearAgentePrueba` over the real tools, audit log and session store. The suites cover §11, every gate rule, D-60, PRD 6.4 and the injection fixture.
- SOLI-03 now states what the system actually does (D-50).

## Task Commits

1. **Task 1: PRD §11 end to end.** `eee69c0` (test, RED) and `0252a1b` (feat, GREEN)
2. **Task 2: gate edge cases, plain text and PRD 6.4.** `8443edd` (test, RED) and `05d65ad` (feat, GREEN)
3. **Task 3: injected instructions change nothing.** `2e14fa7` (test) and `5279eb2` (docs, SOLI-03 wording)

## TDD Gate Compliance

- RED `eee69c0`: 3 fail, 0 pass. The model's eager `simular_envio` ran and wrote `ENVIO-SIMULADO.md`, which is the real gap. GREEN `0252a1b`: 16 pass in `tests/loop`, 863 pass across the full suite.
- RED `8443edd`: both files failed on the missing `texto-plano.util.ts` and `respuesta-turno.service.ts` modules. GREEN `05d65ad`: 43 pass in the verify set, 890 pass across the full suite. The D-38/D-40/D-42/D-63 cases in the same file pin behavior built in Task 1.
- Task 3 is a characterization proof. Its tests passed on the first run because the defense exists by construction: the Task 1 gate, plus D-48 (the `leer_solicitud` v1 contract has no `cuerpo`). Positive controls make sure the assertions can fail: the cliente order does reach the model, the maestro yields more than 10 sensitive values, and the log holds both blocked attempts.
- REFACTOR: none needed.

## Files Created/Modified

- `src/loop/services/despacho-llamada.service.ts`: gate application per call, the server-built send, the synthetic refusal with the CA4 line, and `armar_paquete` tracking.
- `src/loop/services/cierre-turno.service.ts`: turn closing with the gate state, the strip, the question and the confirmation events.
- `src/loop/services/respuesta-turno.service.ts`: the PRD 6.4 fold.
- `src/loop/services/ejecutar-turno.service.ts`: the classifier or button decision after the lock, dispatch through the gate, and the closing after save.
- `src/loop/types/turno.type.ts`: `Sesion.compuerta`, `Sesion.paquetesConocidos`, `ConfirmacionEstructurada`, `EntradaTurno.confirmacion`, `DependenciasTurno.registrar`, `ContextoDespacho`, `ResultadoDespacho`, `EntradaCierreTurno`, `CierreTurnoCompuerta`, `LlamadaRespondida` and `RespuestaTurno`.
- `src/loop/schemas/resultado-herramienta.schema.ts`: `argumentosConCasoSchema` and the lenient `armarPaqueteSchema`.
- `src/loop/wiring/agente.wiring.ts`: `registrar = createAuditLog(resolveRoot(directorio), reloj)`.
- `src/domain/utils/texto-plano.util.ts`: `limpiarMarkdown`.
- `src/config/constants/patterns.constants.ts`: the four markdown patterns. `src/config/constants/agent.constants.ts`: `SALTO_DE_LINEA`, `SEPARADOR_CELDA_MD` and `SEPARADOR_CELDA_PLANO`.
- Tests: `tests/loop/{compuerta,compuerta-casos,inyeccion}.test.ts`, `tests/unit/texto-plano.util.test.ts`, the helpers `llm-falso`, `historial`, `agente-prueba`, `eventos` and `pii` with their types, and the `zz-inyeccion` fixture. `tests/e2e/pii.test.ts` now imports `sensiblesDelProyecto`.
- `.planning/REQUIREMENTS.md`: the SOLI-03 wording from D-50.

## Decisions Made

See `key-decisions` in the frontmatter. In short: a blocked send returns the tool's refusal byte for byte and writes the CA4 line. Any re-arm of the caso revokes the grant. A granted send that the tool rejects consumes the grant. Known packages survive a successful send, so a retry asks again instead of sending twice. Error endings save the error text plus the question.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The tracer test built `DependenciasTurno` by hand**
- **Found during:** Task 1
- **Issue:** `DependenciasTurno.registrar` is now required, so `tests/loop/trazador-agente.test.ts` stopped type-checking.
- **Fix:** The test passes `createAuditLog(proyecto.raiz, reloj)`.
- **Files modified:** tests/loop/trazador-agente.test.ts
- **Commit:** 0252a1b

**2. [Rule 2 - Missing critical] The grant is revoked on any re-arm of the caso**
- **Found during:** Task 1
- **Issue:** The plan revokes the grant only after an `ok` `armar_paquete`. A failed re-arm can still reset `paquete/`, which leaves the old grant pointing at a package that changed.
- **Fix:** `revocarAlArmar` runs for every `armar_paquete` call that names the caso. The D-42 test covers it.
- **Files modified:** src/loop/services/despacho-llamada.service.ts
- **Commit:** 0252a1b

### Shape adjustments (no behavior change)

- `ContextoDespacho` carries `directorio` and `sesionId` instead of a ready `ctx` object. `cerrarTurnoConCompuerta` also takes `turnoId` so it can emit complete `confirmation_required` events.
- `historialIntegro` returns `string[]`, so `tests/helpers/types/historial.type.ts` wasn't needed and wasn't created. `tests/helpers/eventos.helper.ts` (with its type file) was added so the three loop suites share their event and log queries.
- `SALTO_DE_LINEA` and `SEPARADOR_CELDA_MD` joined `SEPARADOR_CELDA_PLANO` in `agent.constants.ts`, so `limpiarMarkdown` holds no literal separators.

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical), plus 3 shape adjustments. **Impact:** none on scope. The gate is stricter than the plan text where it differs.

## Issues Encountered

None.

## Requirements

- ENV-02 and ENV-03 are marked complete. No later plan in this phase claims them.
- SOLI-03 is reworded and stays Pending, as the plan instructs: the verifier marks it, and plan 02-09 finalizes the prompt's declaration.
- AGT-04 was already Complete, and plan 02-08 claims it again.
- DEMO-03 stays open because plans 02-07, 02-08 and 02-09 also claim it.

## Known Stubs

None.

## Next Phase Readiness

- Plan 02-07 (iteration and token caps) can override `maxIteraciones` and its new deps through `crearAgentePrueba`. Cap endings already close through the gate.
- Plan 02-08 (abort and deadline) has to produce `MOTIVO_FIN.ABORTADO` for an aborted turn. `cerrarTurnoConCompuerta` already clears the pending state when `abortado` is true.
- Phase 3 can call `respuestaDeTurno` for the non-streaming endpoint, render `confirmation_required` as a card and send `confirmacion {aprobada, caso}` from the button.

## Self-Check: PASSED

- All 20 created files exist on disk.
- Commits eee69c0, 0252a1b, 8443edd, 05d65ad, 2e14fa7 and 5279eb2 are ancestors of HEAD.
- `bun run check` exits 0, and `bun test` gives 898 pass, 0 fail.
- `git status --porcelain -- reto-01` prints nothing.
- Acceptance greps: no `...args`/`...argumentos` in despacho-llamada.service.ts; `limpiarMarkdown(` appears 1 time in cierre-turno.service.ts; the 4 patterns are in patterns.constants.ts; there is no `**` in strings.ts; there are 0 `function sensiblesDelMaestro` in pii.test.ts and 2 references in pii.helper.ts; the SOLI-03 line contains "no se expone al modelo".
