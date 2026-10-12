---
phase: 01-n-cleo-determinista
plan: 06
subsystem: tools
tags: [leer-solicitud, ambiguos, sinteticos, reglas-json, concurrencia, demo-04, soli-02]

requires:
  - phase: 01-02
    provides: "elegirPlantilla six-row matrix, locked option-a contract with leer_solicitud ambiguos"
  - phase: 01-05
    provides: "cargarSolicitudCaso, entorno.reglas(), crearHerramientas({ directorioConocimiento }), copiarConocimiento, conCandadoCaso"
provides:
  - "detectarAmbiguos(campos, reglas, pais) in src/domain/solicitud.ts"
  - "leer_solicitud data field ambiguos {etiqueta, estado: requiere_confirmacion, propuesta}[]; reglas.json read on every leer_solicitud call"
  - "Synthetic cases tests/fixtures/casos/zz-generica-co, zz-generica-ec, zz-plantilla-corrupta"
  - "tests/unit/solicitud.test.ts (matrix + detectarAmbiguos), tests/contract/sinteticos.test.ts, tests/contract/reglas.test.ts"
affects: [01-07, 01-08, 01-09, 01-10, 01-11, phase-02, phase-03]

actuals:
  tokens: 6800
  tasks: 2
  commits: 2
plan_head_before: 81fc321ea80f2bc885d13cffb8ec5ff990e9451f
plan_head_after: 8a2a20c48ff14dc2c53cc8f01ed726d1f7447abe

tech-stack:
  added: []
  patterns:
    - "Synthetic cases live in tests/fixtures/casos/<id>/ (folder name equals solicitud id) and are copied into temp projects with crearProyectoTemporal({ sinteticos })"
    - "Contract suites under tests/contract/ exercise only the exported tools (proveedor.ts or crearHerramientas)"

key-files:
  created:
    - tests/unit/solicitud.test.ts
    - tests/contract/sinteticos.test.ts
    - tests/contract/reglas.test.ts
    - tests/fixtures/casos/zz-generica-co/solicitud.json
    - tests/fixtures/casos/zz-generica-co/plantilla-campos.json
    - tests/fixtures/casos/zz-generica-co/soportes-exigidos.json
    - tests/fixtures/casos/zz-generica-ec/solicitud.json
    - tests/fixtures/casos/zz-generica-ec/plantilla-campos.json
    - tests/fixtures/casos/zz-generica-ec/soportes-exigidos.json
    - tests/fixtures/casos/zz-plantilla-corrupta/solicitud.json
    - tests/fixtures/casos/zz-plantilla-corrupta/plantilla-celdas.json
    - tests/fixtures/casos/zz-plantilla-corrupta/soportes-exigidos.json
  modified:
    - src/domain/solicitud.ts
    - src/application/leer-solicitud.ts

key-decisions:
  - "leer_solicitud loads reglas.json after the case loads, so case and plantilla errors (CASO_*, DATOS_INVALIDOS, PLANTILLA_INVALIDA) take precedence over REGLAS_INVALIDAS"
  - "detectarAmbiguos looks up por_pais with Object.hasOwn, so an unknown country or a prototype key gives propuesta null instead of an inherited value"
  - "ambiguos keeps the template's original label text and order; matching uses normalizarEtiqueta, the same normalization as the glossary"

patterns-established:
  - "Rules-file contract tests: copia() wraps copiarConocimiento + crearHerramientas and edits reglas.json between calls in the same process"

requirements-completed: [SOLI-01, SOLI-02, MAP-02, DEMO-04, HERR-03, CAL-03]

coverage:
  - id: D1
    description: "leer_solicitud reports ambiguos with NIT for zz-generica-co and RUC for zz-generica-ec; the four real cases give []"
    requirement: "SOLI-02"
    verification:
      - kind: integration
        ref: "tests/contract/sinteticos.test.ts#sintéticos: leer_solicitud reporta etiquetas ambiguas (SOLI-02)"
        status: pass
      - kind: unit
        ref: "tests/unit/solicitud.test.ts#detectarAmbiguos: etiquetas genéricas (SOLI-02, D-20)"
        status: pass
    human_judgment: false
  - id: D2
    description: "elegirPlantilla asserted for all six matrix rows, including the three no real case hits"
    requirement: "SOLI-01"
    verification:
      - kind: unit
        ref: "tests/unit/solicitud.test.ts#elegirPlantilla: matriz de selección de plantilla (SOLI-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "zz-generica-co maps etiqueta_generica 0.5, glosario_normalizado 0.95, clave_directa 0.85 and two faltantes (boolean and prototype key); zz-generica-ec carries the foreign-identifier note"
    requirement: "DEMO-04"
    verification:
      - kind: integration
        ref: "tests/contract/sinteticos.test.ts#sintéticos: mapear_campos ejercita las reglas que los casos reales no tocan (DEMO-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "zz-plantilla-corrupta gives PLANTILLA_INVALIDA with parcial {pais CO, cliente, formato xlsx, soportes} from both tools"
    requirement: "HERR-03"
    verification:
      - kind: integration
        ref: "tests/contract/sinteticos.test.ts#sintéticos: plantilla con forma inválida (D-17)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Two concurrent mapear_campos calls on co both succeed, mapeo.json has 17 campos and the per-caso log has exactly two parseable lines"
    requirement: "HERR-03"
    verification:
      - kind: integration
        ref: "tests/contract/sinteticos.test.ts#sintéticos: concurrencia sobre el mismo caso (SEG-02)"
        status: pass
    human_judgment: false
  - id: D6
    description: "reglas.json with umbral 2, truncated JSON or an unknown key gives REGLAS_INVALIDAS in Spanish without a stack; a nota_extranjero edit shows on the next call"
    requirement: "CAL-03"
    verification:
      - kind: integration
        ref: "tests/contract/reglas.test.ts#reglas.json inválido da REGLAS_INVALIDAS en español y sin traza (CAL-03, D-29)"
        status: pass
      - kind: integration
        ref: "tests/contract/reglas.test.ts#reglas.json se lee en cada ejecución, sin caché (D-28)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Umbral 0.86 turns zz-generica-co Sitio web into requiere_confirmacion and 0.85 keeps it lleno, through the file"
    requirement: "MAP-02"
    verification:
      - kind: integration
        ref: "tests/contract/reglas.test.ts#el umbral de confianza se aplica desde el archivo (MAP-02)"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 06: etiquetas ambiguas, casos sintéticos y reglas editables Summary

**`leer_solicitud` now reports `ambiguos` (generic tax-id labels with the country equivalent: NIT, RUC or RTN). Three synthetic cases prove through the exported tools every mapping rule the real cases skip. A copied `reglas.json` proves rules are validated on every call, editable without a restart, and that the MAP-02 threshold boundary is applied from the file.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-10-12T22:29:34Z
- **Completed:** 2026-10-12T22:31:45Z
- **Tasks:** 2
- **Files modified:** 14 (12 created, 2 modified)

## Accomplishments

- `detectarAmbiguos(campos, reglas, pais)` returns `{etiqueta, estado: "requiere_confirmacion", propuesta}` for each template label whose normalized form is in `reglas.etiquetas_genericas`. It keeps template order and applies even for CO. The unit suite asserts CO→NIT, EC/PE/PA→RUC and HN→RTN against the repo `reglas.json`, and an unknown or prototype country gives `null`.
- `leer_solicitud` reads `reglas.json` on every call and adds `ambiguos` to its data, as the 01-02 locked contract requires. The four real cases give `[]`.
- All six rows of the `elegirPlantilla` matrix are asserted, including portal with either file, pdf with only `plantilla-celdas.json`, and xlsx with only `plantilla-campos.json`.
- `zz-generica-co` maps through the tool in template order:

  | Label | Regla | Confianza | Estado |
  |---|---|---|---|
  | Identificación tributaria | etiqueta_generica | 0.5 | requiere_confirmacion, propuesta NIT, no foreign note |
  | RAZON SOCIAL: | glosario_normalizado | 0.95 | lleno |
  | Teléfono * | glosario_normalizado | 0.95 | lleno |
  | Sitio web | clave_directa | 0.85 | lleno |
  | Gran contribuyente (boolean in the maestro) | sin_fuente | 0 | faltante |
  | constructor | sin_fuente | 0 | faltante |

- `zz-generica-ec` marks "Número de identificación fiscal" as `etiqueta_generica` with propuesta RUC and a note containing "Identificador extranjero".
- `zz-plantilla-corrupta` (valid JSON, items without `celda_valor`) gives `PLANTILLA_INVALIDA` with parcial `{pais: "CO", cliente, formato: "xlsx", soportes}` from both `leer_solicitud` and `mapear_campos`.
- Two concurrent `mapear_campos` calls on co-industrias-delta both return ok. `mapeo.json` holds 17 campos, and `out/co-industrias-delta/log.jsonl` has exactly two lines, each of which parses as JSON.
- In a copied `reglas.json`:
  - `umbral: 2`, a truncated file and an unknown top-level key each give `REGLAS_INVALIDAS`, starting with the Spanish catalog message and with no `    at ` line. This holds for both tools.
  - Rewriting `nota_extranjero` changes the ec RUC note on the next call in the same process.
  - With `umbral: 0.86` "Sitio web" becomes `requiere_confirmacion`, and with 0.85 it stays `lleno`.
- `bun run check` exits 0. `bun test` gives 203 pass and 0 fail across 13 files, up from 168.

## Task Commits

1. **Task 1: generic labels in `leer_solicitud`, the template-selection matrix, and the generic-label synthetic cases** - `910debb` (feat)
2. **Task 2: corrupt-plantilla fixture, invalid and hot-edited reglas, and same-caso concurrency** - `8a2a20c` (test)

## Files Created/Modified

- `src/domain/solicitud.ts`: adds `CampoAmbiguo` and `detectarAmbiguos`.
- `src/application/leer-solicitud.ts`: loads reglas per execution and adds `ambiguos` to `DatosSolicitud`.
- `tests/unit/solicitud.test.ts`: the six-row matrix and the `detectarAmbiguos` cases, 16 tests.
- `tests/contract/sinteticos.test.ts`: synthetic cases, corrupt plantilla and concurrency, 13 tests.
- `tests/contract/reglas.test.ts`: invalid, hot-edited and threshold-shifted rules, 6 tests.
- `tests/fixtures/casos/zz-generica-co/`, `zz-generica-ec/` and `zz-plantilla-corrupta/`: fictitious synthetic cases with only labels, ids, country codes and `.example` addresses.

## Decisions Made

The frontmatter `key-decisions` list has them all. The one later plans need: `leer_solicitud` now fails with `REGLAS_INVALIDAS` when `reglas.json` is broken, but only after the case and plantilla loaded, so case errors keep their priority.

## Overlap with 01-05

01-05 already tested `umbral: 2` and a live edit (`regla_pais`) on `mapear_campos`. This plan's `reglas.test.ts` keeps its own required assertions. To avoid pure duplication, it also covers `leer_solicitud` (which only now reads reglas), the truncated JSON and unknown-key variants, a note edit instead of a confidence edit, and the 0.85/0.86 boundary. 01-05's concurrency test checked `mapeo.json` across five calls on hn. This one checks the per-caso log line count on co.

## Deviations from Plan

None. The plan executed as written. The only additions are extra assertions within the planned files: PE, PA and HN equivalents, null propuesta for an unknown country or prototype key, normalized matching, and `REGLAS_INVALIDAS` through `leer_solicitud`.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Later plans can add synthetic cases under `tests/fixtures/casos/` and load them with `crearProyectoTemporal({ sinteticos })`.
- `generar_formulario` (01-07 onward) can use `zz-generica-co` as a pdf case with requiere_confirmacion and faltante fields, and `zz-plantilla-corrupta` for its PLANTILLA_INVALIDA path.

## Self-Check: PASSED

- All 12 created files exist on disk.
- Commits 910debb and 8a2a20c are ancestors of HEAD.
- `bun run check` exits 0, and `bun test` gives 203 pass and 0 fail.
