---
phase: 01-n-cleo-determinista
plan: 15
subsystem: paquete
tags: [envio-simulado, borrador, checklist, gap-closure, G-01-H4c, GC-2, guard]

requires:
  - phase: 01-14
    provides: NOMBRE_SOPORTE and TEXTO_SOPORTE in strings.ts, motivosDeBloqueo in checklist.builder.ts
  - phase: 01-13
    provides: construirDatosEnvio with sent and retained files, and the co, ec, hn and pa confirm cases in the contract test
provides:
  - ENVIO-SIMULADO.md lists "Bloqueos vigentes al confirmar" by Spanish display name
  - Unit coverage for unknown and prototype-like tipos (zz_desconocido, constructor, __proto__) in both borrador builders
  - Cross-output guard tests/golden/nombres-soporte.test.ts derived from NOMBRE_SOPORTE
affects: [simular_envio, ENVIO-SIMULADO.md, phase-01-verification]

actuals:
  tokens: 3841
  tasks: 2
  commits: 2
plan_head_before: a61ca920101fca8556782de04ee7a887a1e652e3
plan_head_after: d4d0ea1ecc6b5da818269ab005ead73409dae583

tech-stack:
  added: []
  patterns:
    - "The envío record renders bloqueos with motivosDeBloqueo(checklist.soportes), while DatosEnvio.bloqueos stays checklist.bloqueos"
    - "Guards derive their forbidden ids from the code-owned table (NOMBRE_SOPORTE keys that contain an underscore) instead of copying them"

key-files:
  created:
    - tests/golden/nombres-soporte.test.ts
  modified:
    - src/domain/builders/borrador.builder.ts
    - tests/contract/simular-envio.test.ts
    - tests/unit/borrador.builder.test.ts

key-decisions:
  - "ENVIO-SIMULADO bloqueos use motivosDeBloqueo(checklist.soportes). simular_envio data.bloqueos, resumen and log.jsonl keep checklist.bloqueos with raw ids (contract v1, D-21)"
  - "The cross-output guard forbids every NOMBRE_SOPORTE key that contains an underscore. Ids without one (rut, parafiscales) are ordinary words and stay allowed, so the guard has no false positives"

patterns-established:
  - "Human-facing guard: run the four real cases in one temp project, then assert on the rendered files, the tool data and log.jsonl together"

requirements-completed: [ENV-01, CAL-03]

coverage:
  - id: D1
    description: "ENVIO-SIMULADO.md names the bloqueos in Spanish for ec (ausente) and hn (vencido with date), with no raw id in the ec record"
    requirement: ENV-01
    verification:
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts#ec confirmado registra los bloqueos vigentes y solo agrega ENVIO-SIMULADO.md"
        status: pass
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts#hn confirmado nombra en español el soporte vencido entre los bloqueos vigentes (GC-2)"
        status: pass
    human_judgment: false
  - id: D2
    description: "simular_envio data.bloqueos, resumen and log.jsonl keep the raw tipo ids (contract v1 unchanged)"
    requirement: ENV-01
    verification:
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts#cada llamada agrega una línea a los dos log.jsonl con un resumen de estados y códigos (SEG-04)"
        status: pass
      - kind: integration
        ref: "tests/golden/nombres-soporte.test.ts#los resúmenes de ec y hn en log.jsonl conservan los ids crudos"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unknown and prototype-like tipos render as the raw id in construirDatosEnvio and construirDatosBorrador; known tipos get their name"
    requirement: CAL-03
    verification:
      - kind: unit
        ref: "tests/unit/borrador.builder.test.ts#construirDatosEnvio deja el id crudo en el bloqueo de un tipo desconocido"
        status: pass
      - kind: unit
        ref: "tests/unit/borrador.builder.test.ts#construirDatosBorrador deja el id crudo en adjuntos y pendientes de un tipo desconocido"
        status: pass
    human_judgment: false
  - id: D4
    description: "Cross-output guard: no snake_case soporte id in borrador-correo.md, checklist.md or ENVIO-SIMULADO.md for the four cases; every fixture tipo has a name"
    requirement: CAL-03
    verification:
      - kind: e2e
        ref: "tests/golden/nombres-soporte.test.ts#guardián de nombres de soporte en salidas legibles (GC-2, G-01-H4c)"
        status: pass
      - kind: e2e
        ref: "tests/golden/nombres-soporte.test.ts#cada tipo de index.json y de soportes-exigidos.json tiene un nombre propio distinto del id"
        status: pass
    human_judgment: false
  - id: D5
    description: "Support names read naturally in Spanish in the checklist, the borrador and the send record (QA recipes H3 and H4)"
    verification: []
    human_judgment: true
    rationale: "Whether the wording reads naturally to the analyst is a judgment call that no test asserts"

duration: 3min
completed: 2026-10-13
status: complete
---

# Phase 01 Plan 15: Bloqueos by name in ENVIO-SIMULADO and the cross-output guard Summary

**ENVIO-SIMULADO.md now lists its bloqueos by Spanish display name through motivosDeBloqueo, while simular_envio data and logs keep the raw ids. A golden guard derived from NOMBRE_SOPORTE keeps snake_case soporte ids out of the borrador, the checklist and the send record.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-13T04:14:09Z
- **Completed:** 2026-10-13T04:17:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `construirDatosEnvio` renders the "Bloqueos vigentes al confirmar" section with `motivosDeBloqueo(checklist.soportes)`. ec now reads "- ausente: Certificado de cumplimiento tributario" and hn reads "- vencido: Certificación de aportes parafiscales (2026-08-31)".
- The `simular_envio` tool contract v1 is unchanged. `data.bloqueos`, `resumen` and every `log.jsonl` line keep `checklist.bloqueos` with raw ids, and `BLOQUEO_EC` still pins them.
- Unit cases cover `zz_desconocido`, `constructor` and `__proto__` in both builders: the envío bloqueos, the borrador attachments and the pending items show the raw id, and known tipos show their name.
- `tests/golden/nombres-soporte.test.ts` runs the four real cases in one temp project and checks three things. No snake_case `NOMBRE_SOPORTE` key appears in `paquete/borrador-correo.md`, `paquete/checklist.md` or `ENVIO-SIMULADO.md`. Every tipo in `index.json` and in each `soportes-exigidos.json` has a non-empty name that differs from its id. The tool data and logs keep raw ids.
- Together with 01-14, this closes G-01-H4c.

## Task Commits

1. **Task 1: ENVIO-SIMULADO bloqueos by name, end to end through simular_envio** - `5f1c66e` (feat, tracer)
2. **Task 2: Unknown-id builder cases and the cross-output guard** - `d4d0ea1` (test)

## Files Created/Modified

- `src/domain/builders/borrador.builder.ts` - `construirDatosEnvio` renders bloqueos by display name via `motivosDeBloqueo`
- `tests/contract/simular-envio.test.ts` - name-based record lines for ec and hn, a negative raw-id check in the ec record, and `BLOQUEO_EC` kept as tool data
- `tests/unit/borrador.builder.test.ts` - unknown, prototype-like and known tipo cases for both builders
- `tests/golden/nombres-soporte.test.ts` - cross-output guard, fixture coverage of the name table, and raw ids in tool data and logs

## Decisions Made

- The envío record resolves names only in the builder. `DatosEnvio.bloqueos` stays `checklist.bloqueos`, so the model-facing contract and logs do not change (T-01-31).
- The forbidden-id list is derived as the `NOMBRE_SOPORTE` keys that contain an underscore. Ids such as `rut` and `parafiscales` are plain words that can appear legitimately in prose or file names, so including them would cause false positives.
- `checklist.builder.ts` does not import `borrador.builder.ts`, so the import goes one way only (the IN-10 guard in `tests/architecture.test.ts` passes).

## Deviations from Plan

None - plan executed exactly as written. Biome reformatted the two new test blocks (`biome check --write`) before the Task 2 commit. That is formatting only.

## TDD Gate Compliance

Task 2 (`tdd="true"`) adds tests only, and the plan rules out production changes. The behavior it guards was implemented in Task 1 (`5f1c66e`) and in 01-14, so the new tests passed on first run, which is an expected GREEN rather than a missing feature. To show the tests are not vacuous, three temporary mutations were run against the sources and then restored:

- **M1:** reverting the `construirDatosEnvio` bloqueos to `checklist.bloqueos` fails 2 guard tests: the ec ENVIO-SIMULADO.md contains a snake_case id, and the ec and hn records lose the Spanish names.
- **M2:** making `construirChecklist` produce named bloqueos fails 3 raw-id tests: the ec and hn tool data and the log.jsonl resúmenes.
- **M3:** replacing the `Object.hasOwn` lookup in `nombreDeSoporte` with a plain index fails 2 unit tests: the unknown and prototype-like ids in the envío and the borrador.

For Task 1 (tracer), the new contract assertions failed (2 fail) with the old `checklist.bloqueos` line in place and passed after the change.

## Issues Encountered

None.

## Threat Flags

None. No new network, auth, file-access or schema surface. T-01-31 and T-01-32 are mitigated as planned.

## User Setup Required

None - no external service configuration required.

## Verification

- `bun test tests/golden/nombres-soporte.test.ts tests/contract/simular-envio.test.ts tests/unit/borrador.builder.test.ts`: 58 pass, 0 fail
- `bun run check` (tsc, Biome, bun audit): pass, no vulnerabilities
- `bun test` (full suite, including architecture, sin-comentarios, e2e demo, pii and determinismo): 519 pass, 0 fail

## Next Phase Readiness

- G-01-H4c is closed by 01-14 and 01-15. Every human-facing output (borrador, checklist, ENVIO-SIMULADO) names soportes from `src/config/strings.ts`, unknown ids fall back to the raw id, and tool data and logs are unchanged.
- One item is pending human review (D5): QA recipes H3 and H4, to confirm the names read naturally.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-13*

## Self-Check: PASSED

- FOUND: tests/golden/nombres-soporte.test.ts
- FOUND: src/domain/builders/borrador.builder.ts
- FOUND: 5f1c66e (ancestor of HEAD)
- FOUND: d4d0ea1 (ancestor of HEAD)
