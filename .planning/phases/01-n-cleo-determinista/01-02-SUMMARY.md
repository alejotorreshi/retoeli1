---
phase: 01-n-cleo-determinista
plan: 02
subsystem: tools
tags: [zod, bun, tool-contract, never-throw, fixtures, tracer, tdd]

requires:
  - phase: 01-01
    provides: "Pinned toolchain, bun run check, architecture and no-comments guards"
provides:
  - "Locked public tool contract v1 (option-a: uniform parcial carrier)"
  - "src/config/constantes.ts with every phase constant as typed exports"
  - "Domain error catalog (13 codes, Spanish), Resultado/exito/fallo, fixture types, elegirPlantilla and camposSolicitados"
  - "Size-limited, zod-validated fixture reader that separates not-found from invalid"
  - "defineTool never-throw boundary: strict args, Spanish ARGS_INVALIDOS detail, CONFIGURACION_INVALIDA, ERROR_INTERNO"
  - "The five locked arg shapes in src/tools/argumentos.ts"
  - "Exported tool leer_solicitud (model name proveedor_leer_solicitud), proven end to end by tests/e2e/trazador.test.ts"
affects: [01-03, 01-05, 01-06, 01-07, 01-08, 01-09, 01-10, phase-02, phase-03, phase-04]

actuals:
  tokens: 8626
  tasks: 3
  commits: 3
plan_head_before: 9c97afebf096344b3c057f1541e8fe079a091802
plan_head_after: ea264e9695973b360f5fb8d833b24d7acfd5350d

tech-stack:
  added: []
  patterns:
    - "Use cases return Resultado<D>; defineTool serializes {ok,data,resumen} or {ok,error,codigo,parcial?,resumen}"
    - "Ports return Lectura<T> (ok | no_encontrado | invalido) so the application, not infra, picks the error code"
    - "Per-parse Spanish zod locale (z.locales.es().localeError), global zod config untouched"
    - "Anything that needs node:path lives in infra; tools and wiring stay free of node imports"

key-files:
  created:
    - src/config/constantes.ts
    - src/domain/errores.ts
    - src/domain/resultado.ts
    - src/domain/tipos.ts
    - src/domain/solicitud.ts
    - src/application/puertos.ts
    - src/application/leer-solicitud.ts
    - src/infra/fixtures/esquemas.ts
    - src/infra/fixtures/lector.ts
    - src/tools/argumentos.ts
    - src/tools/define-tool.ts
    - src/tools/wiring.ts
    - src/tools/proveedor.ts
    - tests/e2e/trazador.test.ts
  modified: []

key-decisions:
  - "Tool contract v1 locked as option-a (uniform parcial carrier): casos_disponibles, etiquetas_esperadas, diferencias and {pais,cliente,formato,soportes} all travel inside parcial"
  - "The caso regex reaches the application through Entorno.patronCaso, because the layer table forbids application -> config"
  - "Plantilla is discriminated by tipo (celdas|campos) with archivo filled by infra from ARCHIVOS_CASO, because domain cannot import config file names"
  - "path.resolve for ctx.directory runs in infra (resolverRaiz, rutaArchivoCaso), because tools and wiring may not import node:"
  - "Fixture readers return Lectura<T> instead of Resultado so leer-solicitud maps not-found to CASO_NO_ENCONTRADO and invalid to DATOS_INVALIDOS itself"

patterns-established:
  - "Every tool is built with defineTool; failure resumen is '<nombre>: <CODIGO>', success resumen comes from resumir(data)"
  - "Error detail is appended only for ARGS_INVALIDOS, CONFIGURACION_INVALIDA and REGLAS_INVALIDAS, built from zod issue paths and messages"
  - "Schema bounds and regexes live in constantes.ts (LIMITES_ARGS, LIMITES_FIXTURES, PATRON_*)"

requirements-completed: [HERR-02, HERR-03, HERR-04, HERR-05, SOLI-01, CAL-03]

coverage:
  - id: D1
    description: "Public tool contract v1 locked by a human at the Task 1 checkpoint (option-a)"
    verification: []
    human_judgment: true
    rationale: "The contract choice is a human decision recorded at a blocking checkpoint, not a test outcome"
  - id: D2
    description: "proveedor_leer_solicitud returns the contract data for co (xlsx, 17 campos, 4 soportes), ec (pdf) and pa (portal)"
    requirement: SOLI-01
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: proveedor_leer_solicitud de punta a punta"
        status: pass
    human_judgment: false
  - id: D3
    description: "Junk args, extra keys and wrong types give ARGS_INVALIDOS with a value-free Spanish detail capped at MAX_ISSUES_ARGS"
    requirement: HERR-02
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: argumentos basura"
        status: pass
    human_judgment: false
  - id: D4
    description: "Execute never throws: internal throws become ERROR_INTERNO with no stack, and only error.name reaches stderr"
    requirement: HERR-03
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: excepciones internas"
        status: pass
    human_judgment: false
  - id: D5
    description: "Traversal-shaped casos give CASO_INVALIDO before IO, and unknown casos give CASO_NO_ENCONTRADO; paths are built from ctx.directory"
    requirement: HERR-04
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: casos con forma de recorrido"
        status: pass
    human_judgment: false
  - id: D6
    description: "Import with an empty environment works; ctx is validated (CONFIGURACION_INVALIDA) and sessionId|sessionID is normalized"
    requirement: HERR-05
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: contexto de ejecución"
        status: pass
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#importar proveedor.ts con el entorno vacío expone leer_solicitud"
        status: pass
    human_judgment: false
  - id: D7
    description: "Invalid or oversized fixtures give DATOS_INVALIDOS, and a template mismatch gives PLANTILLA_INVALIDA with parcial"
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: fixtures inválidos en un proyecto temporal"
        status: pass
    human_judgment: false
  - id: D8
    description: "Constants centralized in src/config/constantes.ts; layers respected (only wiring.ts imports infra); no comments"
    requirement: CAL-03
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts"
        status: pass
      - kind: other
        ref: "bun run check"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 02: Tool contract lock and leer_solicitud tracer Summary

**`proveedor_leer_solicitud` works end to end: a strict zod boundary that never throws, per-execution wiring, a size-limited zod-validated fixture read, and a pure template-selection decision. It returns the locked v1 JSON contract (`{ok,data,resumen}` or `{ok,error,codigo,parcial?,resumen}`) with a Spanish error catalog of 13 stable codes.**

## Performance

- **Duration:** 6 min (continuation after the Task 1 checkpoint)
- **Started:** 2026-10-12T21:53:28Z
- **Completed:** 2026-10-12T21:59:08Z
- **Tasks:** 3 (Task 1 checkpoint resolved, Tasks 2 and 3 executed)
- **Files modified:** 14 created

## contrato_herramientas

- **Chosen option:** `option-a`, "Lock the full proposal (uniform parcial carrier)", exactly as written in the Task 1 `<context>`. No field edits.
- **Human resume signal (verbatim):** "Option A (Recommended)"
- **Context the human asked for before deciding:** PRD §6.2 only mandates three things. Responses are `{ ok: true, data }` or `{ ok: false, error }` as a JSON string that never throws. Each tool has minimum `data` keys. `simular_envio` returns the literal `error: "requiere confirmación explícita"`. `codigo`, `parcial` and `resumen` are additive supersets of that. The rubric the PRD cites ("sección 10") is not present in the file.
- **What is now locked (consumed by phases 2-4):**
  - Success is `{ ok: true, data, resumen }`. Failure is `{ ok: false, error, codigo, parcial?, resumen }`, where `error` comes from the Spanish catalog and `codigo` is UPPER_CASE.
  - `parcial` is the single optional structured carrier. It holds `casos_disponibles` (D-14), `etiquetas_esperadas` (D-15), `diferencias` (D-11) and `{ pais, cliente, formato, soportes }` (D-17).
  - The five arg shapes are in `src/tools/argumentos.ts`:
    - `caso` is `z.string().max(64)`.
    - `campos` holds at most 200 strings of 1 to 200 chars, and `[]` means all.
    - `mapeo` items are `.strict()` `{etiqueta, estado, ruta: PATRON_RUTA_MAESTRO | null}`.
    - `confirmado` is `z.boolean().default(false)`.
  - The template matrix, the `simular_envio` check order, the data shapes and the two extra codes (CONFIGURACION_INVALIDA, DATOS_INVALIDOS) are as listed in the plan's Task 1 context.

## Accomplishments

- `src/config/constantes.ts` holds every constant the plan lists. It also has bounds and regexes for schemas and args (`LONGITUD_MAXIMA_CASO`, `LIMITES_ARGS`, `LIMITES_FIXTURES`, `PATRON_PAIS`, `PATRON_FECHA`, `PATRON_CELDA`, `PATRON_TIPO_SOPORTE`, `FORMATOS`, `ESTADOS_CAMPO`), so no magic values sit elsewhere. `PATRON_CASO` is derived from `LONGITUD_MAXIMA_CASO`.
- The domain is pure:
  - `errores.ts` covers the 13 codes. `CONFIRMACION_REQUERIDA` maps byte-exactly to "requiere confirmación explícita", and `FORMULARIO_NO_GENERADO` starts with "Primero genera el formulario".
  - `resultado.ts` appends a detail only for ARGS_INVALIDOS, CONFIGURACION_INVALIDA and REGLAS_INVALIDAS.
  - `solicitud.ts` implements the locked six-row matrix.
- `leerSolicitud` runs in this order: regex, then solicitud (CASO_NO_ENCONTRADO or DATOS_INVALIDOS), then soportes-exigidos, then template detection and choice, then PLANTILLA_INVALIDA with `parcial`, then the contract data.
- `leerJsonValidado` runs `stat` before reading and rejects non-files and anything over 1 MiB. It parses JSON inside try/catch, then calls `safeParse`, and it never throws.
- `defineTool` builds `z.object(args).strict()` and parses with the per-parse Spanish locale. It validates ctx with zod, formats issues as `ruta: mensaje` with `(raíz)` and a cap of 5, and maps any throw to ERROR_INTERNO, logging only `error.name` to stderr.
- Sample wire outputs:
  - `{"ok":false,"error":"Los argumentos de la herramienta no son válidos. Detalle: (raíz): Llave desconocida: \"extra\"","codigo":"ARGS_INVALIDOS","resumen":"leer_solicitud: ARGS_INVALIDOS"}`
  - The co success resumen is `co-industrias-delta: xlsx, CO, 17 campos, 4 soportes exigidos`.
- `bun run check` is green. `bun test` gives 48 pass and 0 fail (29 trazador, 19 guards). The test suite creates no `out/`.

## Task Commits

1. **Task 1: lock the public tool contract v1.** Checkpoint, no commit. Resolved as option-a by the human.
2. **Task 2: tracer.** `e8974a7` feat(01-02): trazador proveedor_leer_solicitud de punta a punta. The tracer feedback gate re-ran the automated verify (trazador 4/4, guards 19/19, check exit 0), and expansion went ahead.
3. **Task 3: error states (TDD).**
   - RED `b323fb1` test(01-02): pruebas en rojo de la frontera de errores del trazador
   - GREEN `ea264e9` feat(01-02): frontera de errores del trazador que nunca lanza
   - No REFACTOR commit was needed.

## TDD Gate Compliance (Task 3)

- **RED:** `bun test tests/e2e/trazador.test.ts --reporter=junit` exited 1 with 29 tests, 20 passing and 9 failing. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (format junit, target "normalizarContexto acepta sessionID").
- **Semantic assessment:** all 9 failures are assertion failures on the planned behavior:
  - There was no Spanish detail, so "Llave desconocida", `caso: ` and `(raíz)` were missing and the cap could not be checked.
  - ctx `{}`, `""` or `undefined` gave ERROR_INTERNO instead of CONFIGURACION_INVALIDA.
  - sessionID was ignored.
  - console.error was never called.
  - There were no load, syntax or fixture faults. The 20 passing tests cover behavior Task 2 already delivered (junk args code, CASO_INVALIDO, DATOS_INVALIDOS, PLANTILLA_INVALIDA with parcial, import with an empty env).
- **GREEN:** 29/29 pass after the define-tool.ts change only. `leer-solicitud.ts` already met its Task 3 bullets from Task 2, so it was not changed.

## Files Created/Modified

- `src/config/constantes.ts`: all typed constants
- `src/domain/errores.ts`, `resultado.ts`, `tipos.ts`, `solicitud.ts`: catalog, result, types, template choice
- `src/application/puertos.ts`, `leer-solicitud.ts`: Entorno, Lectura and the use case
- `src/infra/fixtures/esquemas.ts`, `lector.ts`: strict schemas, the size-limited reader and path helpers
- `src/tools/argumentos.ts`, `define-tool.ts`, `wiring.ts`, `proveedor.ts`: the contract surface
- `tests/e2e/trazador.test.ts`: the tracer plus the error boundary. Invalid-fixture cases run in mkdtemp projects outside the repo.

## Decisions Made

See key-decisions in the frontmatter. The layering ones are the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] application cannot import PATRON_CASO from config**
- **Found during:** Task 2
- **Issue:** The plan has `leer-solicitud.ts` check PATRON_CASO, but the 01-01 layer table only lets application import domain and application.
- **Fix:** `Entorno` gained `patronCaso: RegExp`, which `crearEntorno` binds to `PATRON_CASO`. The check still runs before any IO.
- **Files modified:** src/application/puertos.ts, src/tools/wiring.ts, src/application/leer-solicitud.ts
- **Commit:** e8974a7

**2. [Rule 3 - Blocking] tools may not import node:path**
- **Found during:** Task 2
- **Issue:** The plan says `normalizarContexto` uses `path.resolve`, but `src/tools/**` (wiring included) may not import `node:`.
- **Fix:** `normalizarContexto` validates and passes `directory` through. `path.resolve` runs in infra (`resolverRaiz`, `rutaArchivoCaso` in lector.ts).
- **Files modified:** src/infra/fixtures/lector.ts, src/tools/define-tool.ts, src/tools/wiring.ts
- **Commit:** e8974a7

**3. [Rule 3 - Blocking] Plantilla discriminant**
- **Found during:** Task 2
- **Issue:** The plan says Plantilla is "discriminated by archivo", but the domain cannot import config's file names.
- **Fix:** The union is discriminated by `tipo: "celdas" | "campos"` and carries `archivo: string`, which infra fills from `ARCHIVOS_CASO`. `elegirPlantilla` returns `TipoPlantilla | null`, and the application turns null into PLANTILLA_INVALIDA with parcial.
- **Files modified:** src/domain/tipos.ts, src/domain/solicitud.ts, src/tools/wiring.ts
- **Commit:** e8974a7

**4. [Rule 2 - Missing critical] Port result type**
- **Found during:** Task 2
- **Issue:** The plan says the IO ports return `Resultado`, but Task 3 needs the application to tell not-found from invalid.
- **Fix:** The ports return `Lectura<T>` (`ok | no_encontrado | invalido`), and `existePlantilla` returns `Promise<boolean>`. The application maps these to CASO_NO_ENCONTRADO, DATOS_INVALIDOS and PLANTILLA_INVALIDA.
- **Files modified:** src/application/puertos.ts, src/infra/fixtures/lector.ts
- **Commit:** e8974a7

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 missing critical).
**Impact:** Layering only. The public contract (output shape, arg schemas, codes) is exactly option-a. Plans 01-03 and later should extend `Entorno` (which now includes `patronCaso`), read `Plantilla.tipo`, and keep `node:` usage in infra.

## Known Stubs

- `leer_solicitud` data has no `ambiguos` yet. That is intentional: plan 01-06 Task 1 adds it together with reglas.json (SOLI-02). Empty-caso handling and `casos_disponibles` (D-14) belong to plan 01-03 Task 1. `src/tools/proveedor.ts` exports only `leer_solicitud`, and later plans add the other four tools.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-03 can extend `Entorno` (reloj, casos.resolver and casos.disponibles), replace the plain join with realpath containment, and move the tracer to temp projects.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-12*

## Self-Check: PASSED

- All 14 key files are present on disk.
- Commits e8974a7, b323fb1 and ea264e9 are ancestors of HEAD, and evaluation-scope resolves the 01-02 commits on this branch.
- `bun run check` exits 0, and `bun test` gives 48 pass and 0 fail.
