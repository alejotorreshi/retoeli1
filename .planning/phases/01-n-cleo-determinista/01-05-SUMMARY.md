---
phase: 01-n-cleo-determinista
plan: 05
subsystem: tools
tags: [mapear-campos, reglas-json, zod, pii, mapeo-json, mutex, tdd, d-15]

requires:
  - phase: 01-02
    provides: "defineTool, locked option-a contract (parcial carrier), argsMapearCampos, Entorno ports"
  - phase: 01-03
    provides: "crearEntorno with per-execution env, bitácora, crearProyectoTemporal, architecture guard"
  - phase: 01-04
    provides: "mapearCampos, construirIndiceGlosario, contarEstados, presentarCampo, reglas.json v1"
provides:
  - "proveedor_mapear_campos exported from src/tools/proveedor.ts, end to end for the four real cases"
  - "cargarReglas + esquemaReglas + DIRECTORIO_CONOCIMIENTO_POR_DEFECTO (src/infra/knowledge/reglas.ts), reglas.json read on every execution"
  - "esquemaMaestro (recursive), esquemaGlosario, leerMaestro, leerGlosario"
  - "cargarSolicitudCaso / cargarContextoCaso shared case loader (src/application/contexto-caso.ts)"
  - "mapearCamposCaso with D-15 subsets and value-free out/<caso>/mapeo.json"
  - "escribirArchivoSalida (allowlist + realpath containment) and conCandadoCaso (in-process per-key lock)"
  - "crearHerramientas({ directorioConocimiento }) code-level seam in src/tools/fabrica.ts"
  - "copiarConocimiento test helper"
affects: [01-06, 01-07, 01-08, 01-09, 01-10, 01-11, phase-02, phase-03, phase-04]

actuals:
  tokens: 13400
  tasks: 2
  commits: 4
plan_head_before: b4604d35d6d84e8d714e31052f798da8293136d4
plan_head_after: 7756edf9d92e2617a3131aaf5ae5cb43ae54218c

tech-stack:
  added: []
  patterns:
    - "Every tool after leer_solicitud loads its case through cargarContextoCaso (solicitud, plantilla, reglas, maestro, glosario index)"
    - "Output files are addressed by a typed ArchivoSalida key in application; wiring maps the key to ARCHIVOS_SALIDA and infra re-checks the allowlist"
    - "Writers run inside entorno.candado(caso), keyed by the absolute out/<caso> directory so separate projects never contend"
    - "Tools are built by crearHerramientas(opciones); proveedor.ts only destructures the default instance"

key-files:
  created:
    - src/infra/knowledge/reglas.ts
    - src/infra/salida/archivos.ts
    - src/infra/salida/mutex.ts
    - src/application/contexto-caso.ts
    - src/application/mapear-campos.ts
    - src/tools/fabrica.ts
    - tests/golden/mapear-campos.test.ts
    - tests/unit/salida.test.ts
  modified:
    - src/config/constantes.ts
    - src/domain/reglas.ts
    - src/infra/fixtures/esquemas.ts
    - src/infra/fixtures/lector.ts
    - src/application/puertos.ts
    - src/application/leer-solicitud.ts
    - src/tools/define-tool.ts
    - src/tools/wiring.ts
    - src/tools/proveedor.ts
    - tests/helpers/proyecto-temporal.ts
    - tests/e2e/trazador.test.ts

key-decisions:
  - "SWIFT golden uses ••••COBM (D-07 last 4 of COLOCOBM), following the 01-04 correction of the plan typo"
  - "CAMPOS_FUERA_DE_PLANTILLA carries parcial.etiquetas_esperadas plus parcial.indices_fuera_de_plantilla (positions only, never the unknown text)"
  - "For a subset request, conteo counts the returned subset; mapeo.json always holds the full canonical mapping"
  - "Subset errors are raised before persisting, so a bad campos list never writes or overwrites mapeo.json"
  - "reglas.json version is z.literal(VERSION_REGLAS); an unknown version is REGLAS_INVALIDAS rather than a silent best effort"
  - "REGLAS_INVALIDAS detalle is 'reglas.json: <key.path>: <Spanish zod message>' from the first issue only"
  - "Application addresses output files by the ArchivoSalida key ('mapeo'), because the architecture rule forbids application → config; the union grows as later tools add files"
  - "defineTool takes an optional second argument OpcionesEntorno, which is how crearHerramientas threads directorioConocimiento"

patterns-established:
  - "Golden tests run the exported tool against temp projects with FECHA_EJECUCION=2026-09-03, restoring the env afterwards"
  - "Knowledge-folder tests use copiarConocimiento() + crearHerramientas({ directorioConocimiento })"

requirements-completed: [MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, SEG-02, HERR-03, CAL-03]

coverage:
  - id: D1
    description: "proveedor_mapear_campos returns 17/0/0, 13/1/1, 9/1/1 and 8/0/1 for the four real cases through the exported tool"
    requirement: "MAP-01"
    verification:
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#golden: proveedor_mapear_campos sobre los cuatro casos reales (D-21)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ec RUC is regla_pais 0.6 with •••••3456 and the foreign-identifier note; ec and hn faltantes have ruta null"
    requirement: "MAP-03"
    verification:
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#ec RUC queda por regla de país con la nota de identificador extranjero"
        status: pass
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#los faltantes de ec y hn tienen ruta null y sin valor"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only masked values reach the caller: eight contract keys per item, D-07 masks, no valor key, no raw sensitive strings"
    requirement: "MAP-05"
    verification:
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#las máscaras D-07 llegan así al llamador"
        status: pass
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#cada item tiene exactamente las ocho llaves del contrato y ninguna llamada valor"
        status: pass
    human_judgment: false
  - id: D4
    description: "out/<caso>/mapeo.json holds the full canonical mapping {caso, pais, fecha_ejecucion, campos} with ruta, regla and confianza and no raw value"
    requirement: "MAP-06"
    verification:
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#golden: out/<caso>/mapeo.json sin valores (MAP-06, SEG-02)"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-15 subsets: [] means all, normalized matching, CAMPOS_FUERA_DE_PLANTILLA with etiquetas_esperadas and no echo"
    requirement: "HERR-03"
    verification:
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#golden: subconjuntos de etiquetas (D-15)"
        status: pass
    human_judgment: false
  - id: D6
    description: "reglas.json loaded per execution with a strict zod schema; broken rules give REGLAS_INVALIDAS with the key path; the knowledge folder is redirectable by code"
    requirement: "CAL-03"
    verification:
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#golden: reglas cargadas en cada ejecución (D-28)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Allowlisted writer with realpath containment and the per-caso lock"
    requirement: "SEG-02"
    verification:
      - kind: unit
        ref: "tests/unit/salida.test.ts"
        status: pass
    human_judgment: false
  - id: D8
    description: "Context note on hn Ingresos ('COP, año 2025') through the tool"
    requirement: "MAP-07"
    verification:
      - kind: integration
        ref: "tests/golden/mapear-campos.test.ts#las máscaras D-07 llegan así al llamador"
        status: pass
    human_judgment: false
  - id: D9
    description: "leer_solicitud unchanged after moving onto cargarSolicitudCaso"
    requirement: "HERR-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 05: proveedor_mapear_campos de punta a punta Summary

**`proveedor_mapear_campos` works end to end through the exported tool. Every execution reads reglas.json (strict zod schema), the maestro (recursive schema) and the glossary. Only `presentarCampo`-masked items are returned. The full canonical mapping is persisted to a value-free `out/<caso>/mapeo.json` under a per-caso lock, and label subsets are matched with glossary normalization (D-15).**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-12T22:20:17Z
- **Completed:** 2026-10-12T22:26:37Z
- **Tasks:** 2 (both TDD, RED then GREEN)
- **Files modified:** 19 (8 created, 11 modified)

## Accomplishments

- The four real cases return the D-21 truth table through the tool: co 17/0/0, ec 13/1/1, hn 9/1/1 and pa 8/0/1. The resumen reads like `ec-corp-andina: 13 llenos, 1 faltantes, 1 por confirmar`, and each call adds one line to `out/log.jsonl` and one to `out/<caso>/log.jsonl`.
- Values masked as the golden expects:
  - ec RUC: `•••••3456`
  - co Número de cuenta: `•••••••2345`
  - ec SWIFT: `••••COBM`
  - pa Representante legal: `R. A. S.`
  - hn Correo electrónico: `l•••@periferia-ficticia.com`
  - hn Ingresos anuales: `[monto oculto]`, with the note `COP, año 2025`
- No response item and no `mapeo.json` has a `valor` key. The raw strings 03100012345, 71555123, COLOCOBM and 900123456 appear in neither.
- `cargarReglas` reads `reglas.json` on every call. A failure gives the Spanish message `Las reglas de conocimiento no son válidas. Detalle: reglas.json: confianza.umbral: …`, never a stack. A test proves that an edit between two calls takes effect without a restart.
- `crearHerramientas({ directorioConocimiento })` lets hosts and tests point at another knowledge folder. This is only an option in code; no env var controls it.
- `cargarSolicitudCaso` and `cargarContextoCaso` are now the shared case loader. `leer_solicitud` was refactored onto them and the trazador suite is unchanged and green.
- `escribirArchivoSalida` writes only allowlisted names, under `out/<caso>/`, and checks the realpath so a symlinked `out/<caso>` cannot escape. `conCandadoCaso` serializes calls per key, releases the lock on rejection and drops idle entries. Five concurrent calls leave one complete `mapeo.json`.
- `bun run check` exits 0. `bun test` gives 168 pass and 0 fail across 10 files, up from 132.

## Task Commits

1. **Task 1: `proveedor_mapear_campos` end to end, with rules, maestro and glossary loaded per execution**
   - RED `034647f` test(01-05)
   - GREEN `e823b2a` feat(01-05)
2. **Task 2: value-free `mapeo.json` under the per-caso lock, plus D-15 label subsets**
   - RED `e8aa387` test(01-05)
   - GREEN `7756edf` feat(01-05)

There are no REFACTOR commits, because both GREEN implementations were already in their final shape.

## TDD Gate Compliance

- Task 1 RED: the golden suite failed with `Cannot find module '../../src/tools/fabrica.ts'`, meaning the feature was absent (0 pass, 1 fail). GREEN made 72 of 72 pass across the golden, trazador and architecture suites.
- Task 2 RED: `tests/unit/salida.test.ts` failed with `Cannot find module '../../src/infra/salida/archivos.ts'`. The golden suite failed because the `copiarConocimiento` export was missing (0 pass). GREEN made the full suite pass, 168 of 168.

## Files Created/Modified

- `src/infra/knowledge/reglas.ts`: `esquemaReglas` (strict at every level, `satisfies z.ZodType<Reglas>`), `DIRECTORIO_CONOCIMIENTO_POR_DEFECTO` and `cargarReglas`.
- `src/infra/fixtures/esquemas.ts` and `lector.ts`: `esquemaMaestro`, `esquemaGlosario`, `leerMaestro` and `leerGlosario`.
- `src/infra/salida/archivos.ts` and `mutex.ts`: `escribirArchivoSalida` and `conCandadoCaso`.
- `src/application/contexto-caso.ts`, `mapear-campos.ts` and `leer-solicitud.ts`: the shared loader, the use case and the refactor.
- `src/application/puertos.ts`: `Entorno` gains `salida.escribir`, `candado`, `reglas()`, `maestro()` and `glosario()`, plus the `ArchivoSalida` and `Candado` types.
- `src/tools/fabrica.ts`, `proveedor.ts`, `define-tool.ts` and `wiring.ts`: the factory, the destructured exports, the `OpcionesEntorno` passthrough and the bindings.
- `src/config/constantes.ts`: `ARCHIVOS_REPOSITORIO`, `ARCHIVO_REGLAS`, `VERSION_REGLAS`, `PATRON_PLANTILLA_CONOCIMIENTO`, `PATRON_TEXTO_NO_VACIO`, `LIMITES_REGLAS` and `LIMITES_FIXTURES.textoMaestro`.
- `src/domain/reglas.ts`: `APLICACIONES_NOTA`, a const tuple behind `AplicaNota`, so the schema reuses it instead of repeating literals.
- `tests/golden/mapear-campos.test.ts` (22 tests), `tests/unit/salida.test.ts` (14 tests) and `tests/helpers/proyecto-temporal.ts` (adds `copiarConocimiento`).

## Decisions Made

The `key-decisions` list in the frontmatter has them all. These are the ones later plans need:
- Application code addresses output files by the typed `ArchivoSalida` key, which is only `"mapeo"` for now. Plans 01-06 onward add their keys to that union, and wiring maps each key through `ARCHIVOS_SALIDA`.
- Tools that write files should run inside `entorno.candado(caso, …)` and call `entorno.salida.escribir`, which returns the relative path.
- `CAMPOS_FUERA_DE_PLANTILLA` adds `parcial.indices_fuera_de_plantilla` alongside `etiquetas_esperadas`. Both fields are additive within the option-a `parcial` carrier.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The trazador expected the old export list**
- **Found during:** Task 1 GREEN
- **Issue:** `tests/e2e/trazador.test.ts` asserted that importing `proveedor.ts` exposes exactly `leer_solicitud`. The plan adds `mapear_campos`, so the old expectation no longer held.
- **Fix:** The expectation is now `leer_solicitud,mapear_campos`, and the test name now describes what it checks. The env-free import check itself is unchanged.
- **Files modified:** tests/e2e/trazador.test.ts
- **Commit:** e823b2a

**2. [Rule 3 - Blocking] Constants and an application-level file key the plan did not list**
- **Found during:** Task 1
- **Issue:** The architecture guard forbids application → config imports, so `mapear-campos.ts` cannot import `ARCHIVOS_SALIDA` or `OUT_DIR` to build `out/<caso>/mapeo.json`. The CLAUDE.md rule against magic values also needs the maestro, glossary and reglas file names and the reglas limits to be constants.
- **Fix:** Added the constants to `src/config/constantes.ts` and the `ArchivoSalida` key type to `puertos.ts`. Wiring maps the key to the file name, and `salida.escribir` returns the relative path. Task 1 briefly used a `salida.ruta` port, which Task 2 replaced with `salida.escribir`.
- **Files modified:** src/config/constantes.ts, src/application/puertos.ts, src/tools/wiring.ts
- **Commits:** e823b2a, 7756edf

**3. [Rule 2 - Missing critical] The writer checks realpath containment, and the lock is keyed per project**
- **Found during:** Task 2
- **Issue:** The plan's writer only checked the name allowlist. A symlinked `out/<caso>` could still redirect writes outside `out/` (D-33.3). Keying the lock by `caso` alone would also make separate temp projects contend for the same lock.
- **Fix:** `escribirArchivoSalida` resolves the realpath of `out/` and of `out/<caso>` before it creates any nested folder or writes anything. The wiring keys `conCandadoCaso` by the absolute `out/<caso>` directory.
- **Files modified:** src/infra/salida/archivos.ts, src/tools/wiring.ts
- **Verification:** `tests/unit/salida.test.ts` tests the symlink case
- **Commit:** 7756edf

**4. [Rule 2 - Missing critical] Tests the plan did not list**
- **Found during:** Tasks 1 and 2
- **Fix:** Added a `tests/unit/salida.test.ts` suite for the writer and the mutex. The golden suite also gained a broken-reglas test (`umbral: 2` gives `REGLAS_INVALIDAS` with the key path), a live-edit test, a five-way concurrency test, and a check that a bad subset neither writes `mapeo.json` nor logs the unknown label.
- **Commits:** 034647f, e8aa387

**Total deviations:** 4 auto-fixed (1 bug, 1 blocking, 2 missing critical).
**Impact:** The contract surface matches the plan. The only additive field is `parcial.indices_fuera_de_plantilla`. Scope did not grow beyond hardening and tests.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- Plans 01-06, 01-08 and 01-10 can use `copiarConocimiento()` with `crearHerramientas({ directorioConocimiento })` to test invalid rules files.
- `generar_formulario` can compare the received mapping against `mapeo.json` or recompute it through `cargarContextoCaso` and `mapearCampos`. Its writers should use `entorno.candado` and `entorno.salida.escribir`, after extending `ArchivoSalida`.

## Self-Check: PASSED

- All 8 created files exist on disk.
- Commits 034647f, e823b2a, e8aa387 and 7756edf are ancestors of HEAD.
- `bun run check` exits 0, and `bun test` gives 168 pass and 0 fail.
