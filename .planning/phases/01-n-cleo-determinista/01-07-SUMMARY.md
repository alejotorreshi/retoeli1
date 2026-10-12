---
phase: 01-n-cleo-determinista
plan: 07
subsystem: tools
tags: [generar-formulario, xlsx, exceljs, d-11, d-12, tamper-guard, ca2, tdd]

requires:
  - phase: 01-02
    provides: "defineTool, locked option-a contract (parcial carrier), argsGenerarFormulario with strict rutas-only items"
  - phase: 01-04
    provides: "mapearCampos, leerRuta, contarEstados, presentarCampo"
  - phase: 01-05
    provides: "cargarContextoCaso, escribirArchivoSalida (allowlist + realpath), conCandadoCaso, crearHerramientas"
provides:
  - "proveedor_generar_formulario exported from src/tools/proveedor.ts (xlsx arm end to end for co and hn)"
  - "construirFilas / FilaFormulario / FilaCelda / Formulario (src/domain/formulario.ts)"
  - "compararMapeo / ItemMapeo (src/domain/comparar-mapeo.ts), D-11 comparison with per-label multiplicity"
  - "escribirXlsx (src/infra/salida/xlsx.ts), escribirBinarioSalida and limpiarArtefactosPrevios (src/infra/salida/archivos.ts)"
  - "Entorno.formularios.xlsx, Entorno.salida.binario, Entorno.salida.limpiarPrevios"
  - "mapeoCanonico and escribirMapeo shared by mapear_campos and generar_formulario"
  - "Test helpers leerCeldasXlsx, leerMetadatosXlsx, celdaEn, proyectarMapeo, mapearProyectado, generarCaso"
affects: [01-08, 01-09, 01-10, 01-11, phase-02, phase-04]

actuals:
  tokens: 13350
  tasks: 2
  commits: 4
plan_head_before: 7ed17c32b8c7a1e3cb6e2ce9eba161762fa04f98
plan_head_after: c2ae4c6485e9470dba0dfb9a7d2a15e1a02ae139

tech-stack:
  added: []
  patterns:
    - "generar_formulario recomputes the canonical mapping from the maestro, compares the received rutas-only mapping, then cleans and dispatches by formato with an exhaustive switch"
    - "Binary outputs go through a typed ArchivoBinario key (formularioXlsx) mapped to ARCHIVOS_SALIDA in wiring, mirroring ArchivoSalida for text"
    - "xlsx goldens compare workbooks semantically through exceljs readback, never bytes"

key-files:
  created:
    - src/domain/formulario.ts
    - src/domain/comparar-mapeo.ts
    - src/infra/salida/xlsx.ts
    - src/application/generar-formulario.ts
    - tests/helpers/xlsx-leer.ts
    - tests/helpers/flujo.ts
    - tests/golden/formulario-xlsx.test.ts
    - tests/unit/comparar-mapeo.test.ts
    - tests/contract/generar-formulario.test.ts
  modified:
    - src/config/constantes.ts
    - src/application/puertos.ts
    - src/application/mapear-campos.ts
    - src/infra/salida/archivos.ts
    - src/tools/wiring.ts
    - src/tools/fabrica.ts
    - src/tools/proveedor.ts
    - tests/e2e/trazador.test.ts
    - tests/unit/salida.test.ts

key-decisions:
  - "xlsx fills are FFFFC7CE (light red) for faltante and FFFFEB9C (light yellow) for requiere_confirmacion; both, the D-01 note text and the workbook author registro-proveedor live in constantes.ts (MARCAS_XLSX, AUTOR_DOCUMENTOS)"
  - "compararMapeo compares per-label multiplicity, so a template that repeats a label (for example Teléfono on two sheets) still accepts a faithful projection; fewer copies is falta, more is duplicado"
  - "construirFilas returns a Formulario discriminated by the plantilla tipo (celdas rows carry hoja and cells, campos rows carry obligatorio), so 01-08 adds the pdf arm without loosening the xlsx row type"
  - "limpiarArtefactosPrevios applies the same realpath containment as the writer and only treats ENOENT as absent, so a symlinked out/<caso> never deletes outside out/ and an unreadable folder fails loudly instead of leaving a stale paquete"
  - "On MAPEO_INCONSISTENTE nothing is written or cleaned: the comparison runs before limpiarPrevios and before any writer"

patterns-established:
  - "Use cases that write outputs reuse mapeoCanonico(contexto) instead of calling mapearCampos with their own arguments"
  - "Tool tests chain mapear_campos and generar_formulario through tests/helpers/flujo.ts"

requirements-completed: [FORM-01, FORM-04, MAP-07, HERR-03]

coverage:
  - id: D1
    description: "co formulario.xlsx has sheets Datos Proveedor and Datos Bancarios with all 17 labels (bold) and maestro values as text cells at the exact cells, including 03100012345 at Datos Bancarios!C5 and 050021 at Datos Proveedor!C8, created date 2026-09-03T00:00:00Z"
    requirement: FORM-01
    verification:
      - kind: integration
        ref: "tests/golden/formulario-xlsx.test.ts#co-industrias-delta escribe las 17 filas de la plantilla con el valor del maestro como texto"
        status: pass
    human_judgment: false
  - id: D2
    description: "hn formulario.xlsx marks B12 faltante (empty, FFFFC7CE, D-01 note), B3 requiere_confirmacion with raw 900123456 (FFFFEB9C, foreign-identifier note), B11 98000000000 with note COP, año 2025 and B10 480"
    requirement: MAP-07
    verification:
      - kind: integration
        ref: "tests/golden/formulario-xlsx.test.ts#hn-agroexport-sula marca el faltante, el por confirmar y las notas de contexto"
        status: pass
    human_judgment: false
  - id: D3
    description: "A formula-like string reaches the xlsx as a plain text cell, never a formula and without an apostrophe"
    verification:
      - kind: unit
        ref: "tests/golden/formulario-xlsx.test.ts#una cadena con forma de fórmula queda como texto, sin fórmula ni apóstrofo"
        status: pass
    human_judgment: false
  - id: D4
    description: "generar_formulario rejects tampered mappings (ruta, prototype ruta, estado upgrade, faltante promoted, missing, duplicate, extra, empty) with MAPEO_INCONSISTENTE and canonical-label diferencias, writes nothing, never echoes the extra item's text; a valor key gives ARGS_INVALIDOS"
    requirement: FORM-04
    verification:
      - kind: unit
        ref: "tests/unit/comparar-mapeo.test.ts"
        status: pass
      - kind: integration
        ref: "tests/contract/generar-formulario.test.ts#contrato: generar_formulario rechaza mapeos adulterados (D-11, FORM-04, CA2)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Reprocessing overwrites formulario.xlsx and mapeo.json, deletes paquete/ and ENVIO-SIMULADO.md, and appends exactly one line to the existing per-caso log.jsonl"
    requirement: HERR-03
    verification:
      - kind: integration
        ref: "tests/contract/generar-formulario.test.ts#generar borra paquete/ y ENVIO-SIMULADO.md y agrega una sola línea al log del caso"
        status: pass
      - kind: integration
        ref: "tests/golden/formulario-xlsx.test.ts#generar co dos veces sobrescribe formulario.xlsx y mapeo.json con el mismo contenido"
        status: pass
      - kind: unit
        ref: "tests/unit/salida.test.ts#limpiarArtefactosPrevios (D-12)"
        status: pass
    human_judgment: false
  - id: D5b
    description: "The xlsx opens and reads well in Excel or LibreOffice for a human (fill colors, notes and bold labels look right)"
    verification: []
    human_judgment: true
    rationale: "Visual rendering in a spreadsheet application is not asserted by the exceljs readback"

duration: 5min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 07: generar_formulario xlsx con guarda D-11 y limpieza D-12 Summary

**`proveedor_generar_formulario` writes the client xlsx at the exact sheet and cell with exceljs. It re-reads every value from maestro.json after checking that the received rutas-only mapping equals the canonical recompute, so no caller value can reach a signed form. Reprocessing removes any stale paquete and ENVIO-SIMULADO.md.**

## Performance

- **Duration:** 5 min (measured from the first task to the last commit)
- **Started:** 2026-10-12T22:34Z
- **Completed:** 2026-10-12T22:39:52Z
- **Tasks:** 2 (each as a RED and a GREEN commit)
- **Files modified:** 18 (9 created, 9 modified)

## Accomplishments

- **Domain.**
  - `construirFilas(plantilla, canonico)` zips the template rows with the canonical mapping by index and checks the etiqueta. It returns a `Formulario` discriminated by `celdas`/`campos`.
  - Row values come only from `CampoMapeado.valor`, which `leerRuta` read from the maestro, and a faltante is always `null`.
  - `compararMapeo` groups both sides by exact etiqueta. It reports canonical-label differences in template order (`falta`, `duplicado`, `ruta distinta`, `estado distinto`), followed by `sobrante: #<index>` for any non-canonical label. A non-canonical label's text is never echoed.
- **Infra.**
  - `escribirXlsx(filas, fecha)` creates sheets in order of first appearance, makes labels bold, and gives value cells `numFmt "@"` with a plain string value.
  - A faltante cell is empty, with fill FFFFC7CE and the note "Faltante: no existe en el maestro". A requiere_confirmacion cell holds the raw value, with fill FFFFEB9C and the field nota. A lleno cell with a nota gets the note only.
  - `created`/`modified` are set to the clock date at 00:00Z, and creator/lastModifiedBy to `registro-proveedor`.
  - `escribirBinarioSalida` writes the bytes, and `limpiarArtefactosPrevios` handles the D-12 cleanup with realpath containment.
- **Application.** `generarFormulario` runs under the per-caso lock in this order:
  1. `cargarContextoCaso`.
  2. `mapeoCanonico`.
  3. `compararMapeo`, which stops with `MAPEO_INCONSISTENTE` and `parcial.diferencias`.
  4. `salida.limpiarPrevios`.
  5. An exhaustive switch over formato. The xlsx arm writes `formulario.xlsx` and rewrites the value-free `mapeo.json` with the same `escribirMapeo` that mapear_campos uses.
- **Tool.**
  - `generar_formulario` returns `{ ruta, formato }` with a resumen such as `co-industrias-delta: formulario xlsx generado (17 llenos, 0 faltantes, 0 por confirmar)`. For hn the counts are 9/1/1.
  - The description is one Spanish sentence saying that the mapeo carries only the etiquetas, estados and rutas returned by proveedor_mapear_campos.
- **Tests.**
  - 34 new tests.
  - The suite went from 207 to 241 passing tests, and `bun run check` exits 0.

## Task Commits

1. **Task 1: generar_formulario xlsx end to end**
   - `472e4ad` (test, RED)
   - `5d4a9fa` (feat, GREEN)
2. **Task 2: D-11 tamper guard and D-12 cleanup**
   - `0fed2e3` (test, RED)
   - `c2ae4c6` (feat, GREEN)

## TDD Gate Compliance

- **Task 1.**
  - RED `472e4ad` failed at module resolution (`Cannot find module '../../src/infra/salida/xlsx.ts'`, 0 pass, 1 fail).
  - GREEN `5d4a9fa`: 4/4 golden tests pass.
- **Task 2.**
  - RED `0fed2e3`: the unit file failed at module resolution. The contract file ran 3 pass and 10 fail, all on assertions; the tool existed but had no guard and no cleanup.
  - GREEN `c2ae4c6`: all pass.
- No REFACTOR commit was needed.

## Files Created/Modified

- `src/domain/formulario.ts`: FilaFormulario, FilaCelda, Formulario, construirFilas.
- `src/domain/comparar-mapeo.ts`: ItemMapeo, ComparacionMapeo, compararMapeo.
- `src/infra/salida/xlsx.ts`: the exceljs writer.
- `src/infra/salida/archivos.ts`: a private `escribirContenido`, with the public `escribirArchivoSalida` (string), `escribirBinarioSalida` (bytes) and `limpiarArtefactosPrevios`.
- `src/application/generar-formulario.ts`: the use case.
- `src/application/mapear-campos.ts`: extracted `mapeoCanonico` and `escribirMapeo`, with no behavior change.
- `src/application/puertos.ts`: `ArchivoBinario`, `GeneradoresFormulario`, and `SalidaCaso.binario`/`limpiarPrevios`.
- `src/tools/wiring.ts`, `src/tools/fabrica.ts`, `src/tools/proveedor.ts`: bind and export `generar_formulario`.
- `src/config/constantes.ts`: `AUTOR_DOCUMENTOS` and `MARCAS_XLSX`.
- Tests:
  - `tests/helpers/xlsx-leer.ts`
  - `tests/helpers/flujo.ts`
  - `tests/golden/formulario-xlsx.test.ts`
  - `tests/unit/comparar-mapeo.test.ts`
  - `tests/contract/generar-formulario.test.ts`
  - `tests/unit/salida.test.ts` (cleanup tests)
  - `tests/e2e/trazador.test.ts` (the export list)

## Decisions Made

- **Fill colors (discretion).** FFFFC7CE marks faltante and FFFFEB9C marks por confirmar, matching the Excel "bad" and "neutral" presets.
- **Centralized constants.** The fills, the D-01 note literal and the author live in `constantes.ts` rather than in the writer, per the CLAUDE.md rule on centralized constants.
- **Label multiplicity.** The D-11 comparison respects how many times a label appears (see key-decisions).
- **Order of checks.** The comparison happens before cleanup. A rejected mapping therefore leaves the previous paquete intact, and the contract test asserts this.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The tracer e2e test hard-coded the exported tool list**
- **Found during:** Task 1 GREEN.
- **Issue:** `tests/e2e/trazador.test.ts` expected `proveedor.ts` to export exactly `leer_solicitud,mapear_campos`, so adding the planned export broke it.
- **Fix:** The expectation is now `generar_formulario,leer_solicitud,mapear_campos`.
- **Files modified:** tests/e2e/trazador.test.ts
- **Commit:** 5d4a9fa

**2. [Rule 2 - Missing critical] Duplicate-label templates would always be MAPEO_INCONSISTENTE**
- **Found during:** Task 2 GREEN.
- **Issue:** The template schemas do not forbid repeated labels. A naive "more than one received item means duplicado" check would reject a faithful projection of such a template forever.
- **Fix:** `compararMapeo` compares the per-label count against the canonical count. Three unit tests cover it.
- **Files modified:** src/domain/comparar-mapeo.ts, tests/unit/comparar-mapeo.test.ts
- **Commit:** c2ae4c6

**3. [Rule 2 - Missing critical] The recursive delete needed the writer's containment guard**
- **Found during:** Task 2 GREEN.
- **Issue:** `limpiarArtefactosPrevios` deletes recursively under `out/<caso>/`. If that folder is a symlink pointing outside `out/`, the delete would follow it.
- **Fix:**
  - It now validates `caso` against PATRON_CASO.
  - It applies the realpath containment, treats only ENOENT as absent, and otherwise throws `RangeError`, which defineTool maps to ERROR_INTERNO.
  - Unit tests in `tests/unit/salida.test.ts` cover a missing folder, the selective delete, a symlink escape and invalid casos.
- **Files modified:** src/infra/salida/archivos.ts, tests/unit/salida.test.ts
- **Commit:** c2ae4c6

**4. [Rule 1 - Test bug] `__proto__.x` matches the locked ruta pattern**
- **Found during:** Task 2 RED.
- **Issue:** `PATRON_RUTA_MAESTRO` allows underscores, so this ruta passes zod. A test that expected ARGS_INVALIDOS for it was wrong.
- **Fix:**
  - The pattern test now uses `Banco.Nombre`.
  - `__proto__.x` moved to the tamper table, where it gives `MAPEO_INCONSISTENTE` with `ruta distinta: Banco`.
- **Commit:** 0fed2e3

**5. [CLAUDE.md] Constants added to `src/config/constantes.ts`, which is not in the plan's files_modified**
- **Reason:** The project rule says constants must be centralized and typed.
- **Commit:** 5d4a9fa

**Total deviations:** 4 auto-fixed (1 blocking, 2 missing-critical, 1 test bug) and 1 CLAUDE.md-driven placement. **Impact:** None on the contract. All of them tighten correctness.

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| src/application/generar-formulario.ts | `case "pdf": case "portal":` in `despachar` | It returns `ERROR_INTERNO` on purpose so the switch stays exhaustive. Plan 01-08 implements the pdf and portal arms, so ec-corp-andina and pa-logistica-istmo cannot generate yet. |

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: file-deletion | src/infra/salida/archivos.ts | New recursive delete under out/<caso>/ (D-12). Mitigated by the caso regex, a fixed allowlisted name pair (paquete, ENVIO-SIMULADO.md) and realpath containment within out/. Covered by unit tests. |

## Issues Encountered

None.

## Next Phase Readiness

- Ready for 01-08. It replaces the `pdf`/`portal` arms in `despachar` and can reuse `construirFilas` (campos rows carry `obligatorio`), `escribirBinarioSalida` (add `formularioPdf` to `ArchivoBinario`) and the same compare-and-clean prelude.
- Phase 2 must tell the model to pass the complete `mapear_campos` result (etiqueta, estado and ruta of every item) to `generar_formulario`.

## Self-Check: PASSED

- All 9 created files exist on disk.
- Commits 472e4ad, 5d4a9fa, 0fed2e3 and c2ae4c6 are ancestors of HEAD.
- `bun test`: 241 pass, 0 fail.
- `bun run check`: exit 0 (tsc, biome, audit with no vulnerabilities).
