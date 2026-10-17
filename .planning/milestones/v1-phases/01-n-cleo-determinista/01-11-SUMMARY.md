---
phase: 01-n-cleo-determinista
plan: 11
subsystem: demo
tags: [demo, determinismo, pii, e2e, demo-01, demo-02, seg-02, cal-01, cal-04, d-21, d-24, d-25, rn4]

requires:
  - phase: 01-03
    provides: "ejecutarDemo skeleton with the safe out/ cleanup and FECHA_EJECUCION handling"
  - phase: 01-10
    provides: "proveedor.ts exporting exactly the five PRD tools, simular_envio with CONFIRMACION_REQUERIDA"
provides:
  - "ejecutarDemo({directorio, escribir, observar?}) -> {fallido}: four cases through the five tools, D-24 console blocks and a Resumen table"
  - "tests/helpers/instantanea.ts: tomarInstantanea(raiz) and listarSalida(raiz), comparing each file type its own way"
  - "tests/helpers/correr-demo.ts: correrDemo(directorio, {despues?}) collects stdout lines and raw tool responses and restores FECHA_EJECUCION"
  - "tests/e2e/determinismo.test.ts and tests/e2e/pii.test.ts"
affects: [phase-02, phase-03, phase-04]

actuals:
  tokens: 6900
  tasks: 2
  commits: 2
plan_head_before: 582c99f8fd10cda9b9422bd23c806f2e3c330209
plan_head_after: 2f3b597be6c9ea45ace59aa4307745e2d438f20e

tech-stack:
  added: []
  patterns:
    - "The demo reads tool responses only through small guards over unknown (esRegistro, textoDe, numeroDe), because the demo layer may not import zod"
    - "Per-file-type snapshot: pdf/md/json/txt by bytes, jsonl parsed without ts, xlsx by sheet names plus value/type/fill/note per cell"
    - "PII scan with a positive control: the scan asserts a minimum corpus size and reads the sensitive values back from the formulario files where D-25 allows them"

key-files:
  created:
    - tests/helpers/instantanea.ts
    - tests/helpers/correr-demo.ts
    - tests/e2e/determinismo.test.ts
    - tests/e2e/pii.test.ts
  modified:
    - src/demo/ejecutar-demo.ts
    - demo.ts
    - tests/e2e/demo.test.ts

key-decisions:
  - "ejecutarDemo returns {fallido} and no longer throws outside a project root; it prints the Spanish reason and deletes nothing"
  - "A failed case still gets a Resumen row with — in each column and 'ERROR (<codigo>)' as estado, so the table shows every listed case"
  - "The demo prints Formato and Salida on two lines, and the Resumen estado column shows LISTO or BLOQUEADO without the reasons (the reasons are in the case block)"
  - "The PII regex adds 900123456 to the research's three values, as the plan requires; the hn Registro B3 readback is its positive control"

patterns-established:
  - "correrDemo is the single way tests run the demo; it restores FECHA_EJECUCION and can run an extra step (despues) while the demo date is still set"

requirements-completed: [DEMO-01, DEMO-02, SEG-02, CAL-01, CAL-04]

coverage:
  - id: D1
    description: "bun run demo.ts runs the four cases through the five tools with no LLM key, prints the fecha line, the per-case blocks and the Resumen table, and exits 0"
    requirement: DEMO-01
    verification:
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#limpia out/, imprime la fecha efectiva y no falla"
        status: pass
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#corre sin ninguna variable de entorno con API_KEY"
        status: pass
      - kind: command
        ref: "bun run demo.ts (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Truth table co 17/0/0 LISTO, ec 13/1/1 BLOQUEADO (ausente), hn 9/1/1 BLOQUEADO (vencido parafiscales 2026-08-31), pa 8/0/1 LISTO with formato no soportado"
    requirement: DEMO-02
    verification:
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#la tabla Resumen trae una fila por caso, en orden"
        status: pass
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#ec: 13/1/1 y BLOQUEADO por el certificado ausente"
        status: pass
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#hn: 9/1/1 y BLOQUEADO por parafiscales vencido"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each case shows the unconfirmed send refused; no ENVIO-SIMULADO.md is written by the demo"
    verification:
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#cada caso muestra el envío rechazado sin confirmación (RN4)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#deja formularios, mapeo, checklist y borrador por caso y ningún ENVIO-SIMULADO.md"
        status: pass
    human_judgment: false
  - id: D4
    description: "A corrupt plantilla case prints its Spanish error, the four real cases finish and the run reports failure; no package.json means nothing is deleted"
    verification:
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#una plantilla corrupta se reporta en español, los cuatro casos reales terminan y la corrida falla"
        status: pass
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#sin package.json no borra nada y reporta fallo"
        status: pass
    human_judgment: false
  - id: D5
    description: "Determinism: two same-root runs identical (stdout, responses, per-type snapshot), a second root gives the same stdout and relative paths, no absolute root path in any text output"
    requirement: DEMO-01
    verification:
      - kind: e2e
        ref: "tests/e2e/determinismo.test.ts#dos corridas seguidas en la misma raíz dan la misma salida y los mismos archivos"
        status: pass
      - kind: e2e
        ref: "tests/e2e/determinismo.test.ts#otra raíz da la misma salida y el mismo conjunto de rutas relativas"
        status: pass
      - kind: e2e
        ref: "tests/e2e/determinismo.test.ts#ninguna salida de texto ni línea de consola trae la ruta absoluta de una raíz (T-01-20)"
        status: pass
      - kind: command
        ref: "test \"$(bun run demo.ts)\" = \"$(bun run demo.ts)\""
        status: pass
    human_judgment: false
  - id: D6
    description: "No sensitive value in responses, stdout, logs, mapeo, checklist, borrador or ENVIO-SIMULADO, with a non-vacuous corpus and a positive control in the formularios"
    requirement: SEG-02
    verification:
      - kind: e2e
        ref: "tests/e2e/pii.test.ts#el corpus no es vacío"
        status: pass
      - kind: e2e
        ref: "tests/e2e/pii.test.ts#ninguna respuesta, línea de consola, bitácora, mapeo, checklist, borrador ni envío trae un valor sensible"
        status: pass
      - kind: e2e
        ref: "tests/e2e/pii.test.ts#control positivo: los valores sí están en los formularios, donde D-25 los permite"
        status: pass
    human_judgment: false
  - id: D7
    description: "Phase gates: bun run check (tsc strict, Biome, bun audit) and the full bun test suite green"
    requirement: CAL-01
    verification:
      - kind: command
        ref: "bun run check (exit 0)"
        status: pass
      - kind: command
        ref: "bun test (345 pass, 0 fail, 26 files)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Visual review of the generated xlsx, pdf, checklist and borrador, and the tone of borrador-correo.md and ENVIO-SIMULADO.md"
    verification: []
    human_judgment: true
    rationale: "The plan's human-check items (opening the files in Excel/Numbers and a PDF viewer, judging the Spanish wording) cannot be asserted by a test"

duration: 5min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 11: full demo, determinism and PII proofs Summary

**`bun run demo.ts` now runs all four cases through the five real tools with no LLM key. It prints a D-24 block per case and a Resumen table that reproduces the truth table (co 17/0/0 LISTO, ec 13/1/1 BLOQUEADO, hn 9/1/1 BLOQUEADO, pa 8/0/1 LISTO with "formato no soportado"). Two new e2e suites prove the run is deterministic across runs and roots, and that none of 71555123, 03100012345, COLOCOBM or 900123456 appears outside the formulario files. A positive control keeps that scan from passing vacuously.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-12T23:08:00Z
- **Completed:** 2026-10-12T23:12:47Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- **Demo driver (DEMO-01, D-24).**
  - For each case listed by `leer_solicitud({caso: ""})`, sorted, `ejecutarDemo` calls `leer_solicitud`, then `mapear_campos` with `campos: []`, then `generar_formulario` with the `{etiqueta, estado, ruta}` projection, then `armar_paquete`, and finally `simular_envio` with `confirmado: false`.
  - It prints "Formato", "Salida", "Campos", "Soportes ausentes · Vencidos", "Estado" and "Envío", built only from counts, rutas, states and codes.
  - The optional `observar(herramienta, respuesta)` hook receives every raw response, including the listing call.
  - The safe cleanup and FECHA_EJECUCION handling from 01-03 are unchanged.
- **Failure isolation (PRD 8, HU-5).**
  - Any `ok:false` other than the expected CONFIRMACION_REQUERIDA prints "Error en <caso> (<codigo>): <error>", skips the rest of that case and sets `fallido`.
  - A root without package.json prints the reason, deletes nothing and returns `{fallido: true}`.
  - `demo.ts` sets `process.exitCode = 1` when the run fails.
- **Determinism (CAL-04 edge, DEMO-01).**
  - `tomarInstantanea` compares pdf, md, json and txt files (the soporte copies) by bytes and `.jsonl` lines without `ts`. It compares `.xlsx` by sheet names plus value, type, fill and note per cell, never by bytes (Pitfall 1).
  - Two runs in the same root give equal stdout, equal raw tool responses and deep-equal snapshots.
  - A second root gives the same stdout and the same relative file set.
  - No .md, .json or .jsonl file, stdout line or tool response contains either root's absolute path, checked both as given and after realpath (T-01-20).
- **PII absence (SEG-02, D-06, T-01-19).**
  - The corpus is 22 raw responses (including a confirmed ec `simular_envio`), the stdout lines, five `log.jsonl` files, four `mapeo.json`, four `checklist.md`, four `borrador-correo.md` and `ec-corp-andina/ENVIO-SIMULADO.md`.
  - The test asserts that minimum corpus size, then finds zero matches.
  - **Positive control:** the readback finds `03100012345` at co Datos Bancarios!C5 and `900123456` at hn Registro!B3, and the pa `valores-portal.md` contains `COLOCOBM`.

## Task Commits

1. **Task 1: Full demo.ts through the five tools, with the D-24 blocks and the Resumen table**: `3df49e6` (feat, tests included)
2. **Task 2: Determinism and PII-absence proofs, then the phase gates**: `2f3b597` (test)

## Files Created/Modified

- `src/demo/ejecutar-demo.ts`: the full four-case driver with `observar` and `{fallido}`
- `demo.ts`: reads `fallido`
- `tests/e2e/demo.test.ts`: rewritten for items (a) to (h) in the plan
- `tests/helpers/instantanea.ts`: `tomarInstantanea`, `listarSalida`
- `tests/helpers/correr-demo.ts`: `correrDemo`
- `tests/e2e/determinismo.test.ts`, `tests/e2e/pii.test.ts`: new

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Interface refinements

**1. Shared `tests/helpers/correr-demo.ts` (a file outside the plan list)**
- **Reason:** All three demo e2e files run the demo, collect the lines and responses, and restore FECHA_EJECUCION. One helper avoids three copies. Its `despues` step lets the PII test send the confirmed ec `simular_envio` while the demo date is still set.
- **Commit:** 2f3b597 (demo.test.ts was switched to the helper in the same commit)

**2. `ejecutarDemo` returns `{fallido}` instead of throwing when there is no package.json**
- **Reason:** Plan item (f) says "deletes nothing and reports failure". The 01-03 version threw an error. The new version writes the Spanish reason, returns `{fallido: true}`, and the guard still runs before `rm`.
- **Commit:** 3df49e6

---

**Total deviations:** 0 auto-fixed bugs and 2 interface refinements. **Impact:** no scope change.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model.
- **T-01-19:** mitigated. The demo prints only counts, rutas, states and codes, and `tests/e2e/pii.test.ts` scans the full corpus against the four values, with a positive control.
- **T-01-20:** mitigated. The cross-root test asserts that no absolute temp path appears in any text output, stdout line or response.
- **T-01-SC:** no new packages, and `bun audit --audit-level=moderate` is clean.
- **T-01-06** (demo cleanup): re-proven by e2e (f).

## Verification

- `bun test tests/e2e/demo.test.ts`: 12 pass, 0 fail
- `bun test tests/e2e/determinismo.test.ts tests/e2e/pii.test.ts`: pass, 0 fail
- `bun test`: 345 pass, 0 fail (26 files)
- `bun run check`: tsc, Biome and `bun audit` clean (exit 0)
- `test "$(bun run demo.ts)" = "$(bun run demo.ts)"`: exit 0
- `bun run demo.ts` exits 0 from the repo root. Its stdout contains "Estado: BLOQUEADO (ausente: certificado_cumplimiento_tributario)", "vencido: parafiscales (2026-08-31)" and "formato no soportado". `out/ec-corp-andina/formulario.pdf` and `out/pa-logistica-istmo/valores-portal.md` exist.
- **D-32 Bun pin:** `bun --version` is 1.4.3. The user approved the upgrade at the 01-01 gate, so this reminder is already satisfied and is not raised again.

## Human Verification Items

These come from the plan's `<human-check>` and carry over from 01-10. No test covers them.

- Open `out/co-industrias-delta/formulario.xlsx` in Excel or Numbers. Expect two sheets, labels and values in the template cells, and 03100012345 with its leading zero.
- Open `out/hn-agroexport-sula/formulario.xlsx`. Expect a yellow RTN cell with a note, and an empty red Referencias comerciales cell with a note.
- Open `out/ec-corp-andina/formulario.pdf`. Expect fields in template order, [FALTANTE] in red, [POR CONFIRMAR] in amber, and a Notas section.
- Read `out/ec-corp-andina/paquete/checklist.md` and `borrador-correo.md`. Expect clear Spanish, no bank data, and the reply addressed to the client.
- **Tone review (from 01-10):** no one has checked the wording of `borrador-correo.md` and `ENVIO-SIMULADO.md` for tone. A person should review it. To produce an ENVIO-SIMULADO.md, call `simular_envio` with `confirmado: true`; the demo never writes one.

## Notes for Phase 2

- SEG-02 is marked complete for its Phase 1 scope: tool responses, logs, outputs and stdout. The single `redactar()` function applied to the API, SSE and tool-call summaries is part of the Phase 2 server. The PII e2e pattern here (corpus, minimum size, positive control) should extend to the HTTP and SSE transcripts.

## User Setup Required

None.

## Next Phase Readiness

Phase 1 is complete, and the next step is phase verification. ROADMAP Phase 1 success criteria 1 to 5 can all be observed: the truth table in the demo, the exact formularios, the paquete with its checklist and borrador, safe tools with logs, and check and test green.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-12*
## Self-Check: PASSED
