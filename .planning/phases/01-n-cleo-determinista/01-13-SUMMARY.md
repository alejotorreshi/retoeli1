---
phase: 01-n-cleo-determinista
plan: 13
subsystem: paquete-envio
tags: [borrador, envio-simulado, motor-plantillas, gap-closure, bun-test]

requires:
  - phase: 01-n-cleo-determinista
    provides: "armar_paquete (01-09/01-10), simular_envio (01-10), WR-06 retenidos section, strict template engine whose builder context is the allowlist"
provides:
  - "One domain rule for what goes to the client (formulario xlsx/pdf + presente soportes) shared by the borrador and ENVIO-SIMULADO.md"
  - "ENVIO-SIMULADO.md 'Archivos que se envían' = client file set intersected with the real paquete/ listing; portal line explains valores-portal.md is the analyst's guide"
  - "State-aware borrador context: adjunta_formulario, por_confirmar, hay_por_confirmar, firma_lista, firma_tras_confirmar, firma_bloqueada"
  - "borrador-correo.md without any signed-form claim, with por-confirmar questions to the client and one state sentence"
affects: [01-14, 01-15, fase-2-agente, modulo]

actuals:
  tokens: 7037
  tasks: 2
  commits: 3
plan_head_before: 8756b571ef5d58cc2396297ab10858416c275858
plan_head_after: 2611187a55a680a3a03f55ccf86f5ddb317a26e5

tech-stack:
  added: []
  patterns:
    - "Mutually exclusive state flags as flat SeccionCondicional keys (the engine cannot nest sections)"
    - "Sent list = domain client-file set ∩ actual paquete/ listing, in listing order"

key-files:
  created:
    - tests/unit/borrador.builder.test.ts
  modified:
    - src/domain/builders/borrador.builder.ts
    - src/domain/types/borrador.type.ts
    - src/application/use-cases/simular-envio.use-case.ts
    - src/knowledge/plantillas/envio-simulado.md
    - src/knowledge/plantillas/borrador-correo.md
    - tests/contract/simular-envio.test.ts
    - tests/golden/borrador-envio.test.ts

key-decisions:
  - "Borrador firma state from the checklist alone: firma_lista = listo_para_firma y nada por confirmar; firma_tras_confirmar = listo_para_firma con campos por confirmar; firma_bloqueada = no listo_para_firma (GC-1, G-01-H4b)"
  - "Portal: the form is filled in the client's portal; valores-portal.md is the analyst's guide, never attached in the borrador nor listed as sent in ENVIO-SIMULADO.md (GC-1, GC-3)"
  - "ENVIO-SIMULADO 'Archivos que se envían' lists only formulario xlsx/pdf + presente soportes that exist in paquete/; checklist.md and borrador-correo.md stay in paquete/ but are never listed as sent (GC-3, G-01-H4a)"
  - "PAQ-04 wording 'lista el formulario firmado' in REQUIREMENTS.md is superseded by GC-1; the text is left for the orchestrator to reconcile"

patterns-established:
  - "adjuntaFormulario(formato) is the single rule for whether the formulario goes to the client; both builders read it"

requirements-completed: [PAQ-04, ENV-01, SEG-02]

coverage:
  - id: D1
    description: "ENVIO-SIMULADO.md lists as sent only the formulario (xlsx/pdf) and the presente soportes present in paquete/, never checklist.md or borrador-correo.md, for co, ec, hn and pa"
    requirement: "ENV-01"
    verification:
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts#<caso> confirmado lista como enviados solo el formulario y los soportes presentes (GC-3)"
        status: pass
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts#un soporte borrado de paquete/ no aparece como enviado"
        status: pass
      - kind: unit
        ref: "tests/unit/borrador.builder.test.ts#construirDatosEnvio: archivos que van al cliente (GC-3, G-01-H4a)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Portal case: ENVIO-SIMULADO.md explains valores-portal.md is the analyst's guide and does not list it as sent; WR-06 expired section unchanged"
    requirement: "ENV-01"
    verification:
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts#pa confirmado explica que valores-portal.md es la guía de la analista y no lo lista como enviado"
        status: pass
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts#hn deja el soporte vencido en su sección y en paquete/ (WR-06)"
        status: pass
    human_judgment: false
  - id: D3
    description: "borrador-correo.md never claims the form is signed and states exactly one tool-produced firma state per case"
    requirement: "PAQ-04"
    verification:
      - kind: unit
        ref: "tests/unit/borrador.builder.test.ts#en las cuatro combinaciones hay exactamente una bandera de firma activa"
        status: pass
      - kind: integration
        ref: "tests/golden/borrador-envio.test.ts#ningún borrador de los cuatro casos afirma que el formulario está firmado (GC-1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "borrador asks the client about each por-confirmar field with its reglas.json note (ec RUC, hn RTN, pa RUC) and carries no bank data"
    requirement: "SEG-02"
    verification:
      - kind: integration
        ref: "tests/golden/borrador-envio.test.ts#ec pregunta por el RUC y dice que el formulario todavía no está listo para la firma"
        status: pass
      - kind: unit
        ref: "tests/unit/borrador.builder.test.ts#el contexto tiene exactamente las claves permitidas y ningún dato bancario"
        status: pass
      - kind: e2e
        ref: "tests/e2e/pii.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Tone of the client email and of the por-confirmar questions reads naturally in professional Spanish (QA recipe H4)"
    verification: []
    human_judgment: true
    rationale: "Wording quality for an external client is a human judgment; the plan's <human-check> asks to read the ec, pa borradores and the confirmed hn ENVIO-SIMULADO.md"

duration: 4min
completed: 2026-10-13
status: complete
---

# Phase 01 Plan 13: Borrador y envío que solo afirman lo que las herramientas produjeron

**Una sola regla de dominio decide qué va al cliente (formulario xlsx/pdf + soportes presentes que existen en paquete/), ENVIO-SIMULADO.md deja de listar checklist.md y borrador-correo.md, y borrador-correo.md ya no afirma que el formulario está firmado: elige una de tres frases de firma según el checklist y pregunta al cliente por cada campo por confirmar con su nota de reglas.json. Cierra G-01-H4a y G-01-H4b.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-13T04:02:30Z
- **Completed:** 2026-10-13T04:06:24Z
- **Tasks:** 2
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments

- G-01-H4a closed. `construirDatosEnvio(caso, solicitud, checklist, formulario, listado)` intersects the client file set with the real `paquete/` listing. The sent list for each case at 2026-09-03 is:
  - co: camara, certificacion-bancaria, estados-financieros, formulario.xlsx, rut
  - ec: the same set with formulario.pdf
  - hn: camara, formulario.xlsx, rut (parafiscales stays retenido)
  - pa: camara, rut, plus the portal line
- G-01-H4b closed. The borrador context carries three mutually exclusive firma flags:
  - **firma_lista** (co): "El formulario queda listo para la firma de nuestro representante legal."
  - **firma_tras_confirmar** (pa): "Con su confirmación pasaremos el formulario a la firma de nuestro representante legal."
  - **firma_bloqueada** (ec, hn): "El formulario todavía no está listo para la firma de nuestro representante legal: falta completar los pendientes indicados."
- The por-confirmar questions render as `- <etiqueta>: <nota>`. For ec that is `- RUC: Identificador extranjero: confirmar si el cliente acepta el NIT colombiano`, hn asks about RTN and pa about RUC.
- In the portal case the borrador opens with "El formulario de registro como proveedor se diligencia en su portal." and never mentions valores-portal.md.
- Tool data did not change: the `simular_envio` response `{caso, ruta, bloqueos}`, the resumen strings, the logs and the demo truth table (co 17/0/0 LISTO, ec 13/1/1, hn 9/1/1, pa 8/0/1) are all the same as before.

## Task Commits

1. **Task 1: One client-file rule drives the ENVIO-SIMULADO sent list (tracer)**: `656fb3f` (fix)
2. **Task 2: State-aware borrador with por-confirmar questions and no signed claim (TDD)**
   - RED: `481ff08` (test)
   - GREEN: `2611187` (feat)
   - REFACTOR: none needed

## TDD Gate Compliance

- **RED** `481ff08`: added `tests/unit/borrador.builder.test.ts` and the per-case golden assertions. `bun test` exited 1 with 12 failing tests, all of them new targets. The JUnit report went through `gsd_run check tdd-red-evidence`, which returned `RED_EVIDENCE_OK` (target_test_failed). The target was "listo y sin campos por confirmar solo activa firma_lista".
  - Semantic assessment: the target ran and failed on the planned assertion (`firma_lista` was `undefined`, expected `[{}]`). The golden tests failed because the rendered borrador still contained "firmado por el representante legal" and lacked the new sentences. There were no load, syntax or fixture faults. The `construirDatosEnvio` unit tests already passed because Task 1 had implemented that rule, which is the expected outcome.
- **GREEN** `2611187`: 31/31 in the targeted files, then 484/484 across the full suite.
- **REFACTOR:** none.

## Files Created/Modified

- `src/domain/builders/borrador.builder.ts`: `adjuntaFormulario`, `archivosAlCliente`, the new `construirDatosEnvio` signature and the state-aware `construirDatosBorrador`
- `src/domain/types/borrador.type.ts`: the `DatosBorradorCorreo` and `DatosEnvioSimulado` target types
- `src/application/use-cases/simular-envio.use-case.ts`: passes `ARCHIVO_FORMULARIO[formato]` and the `paquete/` listing. The guard order and `DatosEnvio` are unchanged.
- `src/knowledge/plantillas/envio-simulado.md`: adds the conditional portal line only. Every other line is byte-identical.
- `src/knowledge/plantillas/borrador-correo.md`: replaced with the plan's exact target text (verified byte-equal)
- `tests/unit/borrador.builder.test.ts`: new pure builder tests, with an exact key allowlist and synthetic non-PII data
- `tests/contract/simular-envio.test.ts`: sent lists for the four cases, the portal sentence, the deleted-file case and WR-06. The old checklist-line assertion is now negated.
- `tests/golden/borrador-envio.test.ts`: rendered per-case assertions and the `/firmad[oa]/i` check over all four borradores

## Decisions Made

- The three firma states are listed under Accomplishments. They are computed from `listo_para_firma` and `requiere_confirmacion` only, so pa (LISTO with RUC por confirmar) gets its own sentence.
- **Portal interpretation:** this was Claude's discretion, consistent with GC-1. For formato portal the form is filled in the client's portal, so the "formulario" in the client file set means only xlsx or pdf. valores-portal.md stays in `paquete/` as the analyst's copy guide, and ENVIO-SIMULADO.md says so in one line.
- **PAQ-04 wording note:** the REQUIREMENTS.md text "lista el formulario firmado" is superseded by GC-1, because the borrador never claims a signature. The requirement text is left unchanged for the orchestrator to reconcile.
- Soportes rows keep `{{tipo}}`. Plan 01-14 swaps in readable names (H4c).

## Deviations from Plan

None. The plan was executed as written. The only extra step was Biome formatting, which reflowed the new code to satisfy `biome check`. That was part of the planned `bun run check` verification and is not a deviation.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- G-01-H4a and G-01-H4b are closed. Plan 01-14 (H4c support names) can rename `tipo` to `nombre` in the `soportes_adjuntos` rows. The unit test deliberately does not assert on that field name.
- Human check still pending, to be harvested at end of phase. Read `out/ec-corp-andina/paquete/borrador-correo.md`, `out/pa-logistica-istmo/paquete/borrador-correo.md` and a confirmed `out/hn-agroexport-sula/ENVIO-SIMULADO.md`, and check that the tone is professional, no signature is claimed and no bank data appears.

## Self-Check: PASSED

- The 8 key files exist on disk.
- Commits `656fb3f`, `481ff08` and `2611187` are ancestors of HEAD, and `check evaluation-scope --plan 01-13` resolves them.
- `bun run check` exits 0 (tsc, Biome, bun audit). `bun test` passes 484/484, including the architecture guards G1–G14, sin-comentarios, the e2e demo truth table and the PII scan.
- `grep -iE 'firmad[oa]' src/knowledge/plantillas/borrador-correo.md` finds nothing.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-13*
