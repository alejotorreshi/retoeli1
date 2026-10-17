---
phase: 01-n-cleo-determinista
plan: 09
subsystem: tools
tags: [armar-paquete, checklist, vigencias, soportes, plantillas, copias, realpath, d-10, d-21, d-22, d-23, d-27, tdd]

requires:
  - phase: 01-04
    provides: "renderizarPlantilla (unknown variable gives REGLAS_INVALIDAS), mapearCampos, CampoMapeado"
  - phase: 01-05
    provides: "cargarContextoCaso, mapeoCanonico, reglas.soportes (dias_aviso_vencimiento, aviso_emisor_distinto), conCandadoCaso via entorno.candado"
  - phase: 01-07
    provides: "generarCaso test helper, escribirArchivoSalida with realpath containment"
  - phase: 01-08
    provides: "plantillas.cargar(reglas, clave) per-call template loader, formulario.pdf and valores-portal.md outputs"
provides:
  - "proveedor_armar_paquete: {ruta, listo_para_firma, bloqueos, checklist:{fecha_ejecucion, soportes, faltantes, requiere_confirmacion}, archivos}"
  - "evaluarVigencia / textoVence (src/domain/vigencias.ts)"
  - "SoporteIndice, SoporteEvaluado, Checklist, evaluarSoportes, construirChecklist, DatosChecklist, construirDatosChecklist, TEXTO_SIN_VIGENCIA (src/domain/checklist.ts)"
  - "evaluarEstadoPaquete(contexto, entorno) for simular_envio in 01-10, armarPaquete"
  - "esquemaIndiceSoportes, leerIndiceSoportes, soportesPresentes, directorioSoportes"
  - "copiarAlPaquete (realpath-checked), reiniciarPaquete"
  - "Entorno.soportes {indice, presentes}, Entorno.salida {existe, reiniciarPaquete, copiar}, ArchivoFormulario, OrigenCopia, ArchivoSalida 'checklist'"
  - "SOPORTES_DIR, INDICE_SOPORTES, NOMBRES_RESERVADOS_PAQUETE, ARCHIVOS_SALIDA paquete formulario entries"
  - "Editable template src/knowledge/plantillas/checklist.md"
affects: [01-10, 01-11, phase-02, phase-04]

actuals:
  tokens: 15000
  tasks: 2
  commits: 3
plan_head_before: 0e14fa36c2d4cd8bc58ef07d9f256382176da95d
plan_head_after: 1ca39ac093eb2f652d7e17d91072af4afb40d693

tech-stack:
  added: []
  patterns:
    - "Expiry and blocking rules are pure domain functions that take hoy as a parameter; the application passes entorno.reloj.hoy()"
    - "Render the template before touching the filesystem, so a template failure (REGLAS_INVALIDAS) writes nothing"
    - "Copy port takes a typed origin ({tipo: formulario | soporte}); wiring maps it to an absolute path and the copier realpath-checks it"

key-files:
  created:
    - src/domain/vigencias.ts
    - src/domain/checklist.ts
    - src/infra/salida/copias.ts
    - src/application/armar-paquete.ts
    - src/knowledge/plantillas/checklist.md
    - tests/unit/vigencias.test.ts
    - tests/unit/copias.test.ts
    - tests/golden/paquete.test.ts
  modified:
    - src/config/constantes.ts
    - src/config/env.ts
    - src/infra/fixtures/esquemas.ts
    - src/infra/fixtures/lector.ts
    - src/infra/salida/archivos.ts
    - src/application/puertos.ts
    - src/tools/wiring.ts
    - src/tools/fabrica.ts
    - src/tools/proveedor.ts
    - tests/e2e/trazador.test.ts

key-decisions:
  - "Port salida.copiar(caso, origen: OrigenCopia) instead of copiar(caso, origen, destino): the destination name is derived from the typed origin, so a caller cannot pair an origin with a mismatched destination"
  - "evaluarSoportes returns Resultado<SoporteEvaluado[]> because the D-22 emitter warning is rendered from reglas.json and can fail with REGLAS_INVALIDAS"
  - "An ausente soporte has archivo null and vigencia_hasta null; the checklist shows — for its archivo and vigencia, and 'no aplica' only for a present soporte with null vigencia"
  - "Empty table cells render as —; the País emisor column carries the D-22 warning or —"
  - "A por-confirmar field without a nota shows 'confirmar con el cliente'"
  - "index.json entries cannot name a reserved paquete file (formulario.*, valores-portal.md, checklist.md, borrador-correo.md) and vigencia_hasta must be a real calendar date"
  - "armar_paquete recreates only paquete/; it does not delete a previous ENVIO-SIMULADO.md (generar_formulario owns that cleanup per D-12)"

patterns-established:
  - "Checklist pipeline: evaluarSoportes, then construirChecklist, then construirDatosChecklist as the allowlisted template context, then renderizarPlantilla"
  - "Paquete assembly: render first, then reiniciarPaquete, copy formulario plus deduplicated soporte archivos, write checklist, return sorted relative paths"

requirements-completed: [PAQ-01, PAQ-02, PAQ-03, PAQ-05, SEG-04]

coverage:
  - id: D1
    description: "armar_paquete reproduces the truth table: co and pa listo with no bloqueos, ec bloqueado by ausente certificado_cumplimiento_tributario, hn bloqueado by vencido parafiscales (2026-08-31)"
    requirement: PAQ-03
    verification:
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#co-industrias-delta reproduce listo_para_firma y bloqueos de la tabla de verdad"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#ec-corp-andina reproduce listo_para_firma y bloqueos de la tabla de verdad"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#hn-agroexport-sula reproduce listo_para_firma y bloqueos de la tabla de verdad"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#pa-logistica-istmo reproduce listo_para_firma y bloqueos de la tabla de verdad"
        status: pass
    human_judgment: false
  - id: D2
    description: "paquete/ holds the formulario, every presente and vencido soporte (byte-identical copies) and checklist.md; data.archivos lists sorted relative paths"
    requirement: PAQ-01
    verification:
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#co: paquete/ trae el formulario, los cuatro soportes y el checklist, y data.archivos los lista"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#las copias de soportes y del formulario son idénticas a su origen"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#hn copia el soporte vencido, pa copia valores-portal.md y ec copia el pdf sin el certificado ausente"
        status: pass
    human_judgment: false
  - id: D3
    description: "checklist.md shows fecha de ejecución, LISTO/BLOQUEADO with motivos, the soportes table with 'vence en 27 días' and the emitter column, faltantes, por confirmar with nota and '- [ ]' actions"
    requirement: PAQ-02
    verification:
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#co checklist.md muestra la fecha, LISTO y el aviso de vencimiento sin aviso de emisor"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#ec checklist.md muestra el bloqueo, el faltante, el RUC con su nota, el aviso de emisor y casillas"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#hn checklist.md marca parafiscales vencido y pide renovarlo"
        status: pass
    human_judgment: false
  - id: D4
    description: "Expiry rules on ISO dates with the injected clock: expiry day valid, day after vencido, aviso at 0..30 days inclusive, none at 31, null vigencia valid"
    requirement: PAQ-05
    verification:
      - kind: unit
        ref: "tests/unit/vigencias.test.ts#evaluarVigencia (PAQ-05, D-23)"
        status: pass
      - kind: unit
        ref: "tests/unit/vigencias.test.ts#evaluarSoportes (PAQ-03, D-22)"
        status: pass
      - kind: unit
        ref: "tests/unit/vigencias.test.ts#construirChecklist (RN3, PAQ-03)"
        status: pass
    human_judgment: false
  - id: D5
    description: "armar_paquete before generar_formulario returns FORMULARIO_NO_GENERADO ('Primero genera el formulario...') and creates no paquete/"
    requirement: PAQ-01
    verification:
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#armar_paquete sin formulario generado da FORMULARIO_NO_GENERADO y no crea paquete/ (D-10)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Two concurrent armar_paquete calls on co both succeed and leave one expected file set; a re-run removes foreign files from paquete/"
    requirement: PAQ-01
    verification:
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#dos armar_paquete concurrentes sobre co responden ok y dejan un solo juego de archivos (T-01-18)"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#armar_paquete recrea paquete/ vacío y quita archivos ajenos"
        status: pass
    human_judgment: false
  - id: D7
    description: "Each armar_paquete call appends one line to out/log.jsonl and out/<caso>/log.jsonl with a states-and-codes resumen"
    requirement: SEG-04
    verification:
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#cada llamada agrega una línea a out/log.jsonl y a out/<caso>/log.jsonl con un resumen sin valores (SEG-04)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Copier containment: origin realpath inside repositorio/soportes or out/<caso> (not paquete/), destination allowlisted, symlinks out of the repository rejected; index schema rejects '..', reserved names and impossible dates"
    verification:
      - kind: unit
        ref: "tests/unit/copias.test.ts#copiarAlPaquete (T-01-16)"
        status: pass
      - kind: unit
        ref: "tests/unit/copias.test.ts#esquemaIndiceSoportes (T-01-16)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Readability of checklist.md for the analyst (wording of actions, table layout)"
    verification: []
    human_judgment: true
    rationale: "Wording and readability are judgment calls; the executor read the rendered ec and co checklists and they looked correct, but no test asserts tone"

duration: 8min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 09: armar_paquete with soportes, vigencias and checklist Summary

**`proveedor_armar_paquete` builds `out/<caso>/paquete/` with the formulario, copies of every presente and vencido soporte (realpath-checked) and a `checklist.md` rendered from an editable template. It returns listo_para_firma and bloqueos computed by pure expiry rules on the injected date, reproducing the truth table: co and pa LISTO, ec BLOQUEADO (ausente certificado_cumplimiento_tributario), hn BLOQUEADO (vencido parafiscales 2026-08-31).**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-12T22:51:54Z
- **Completed:** 2026-10-12T22:59:40Z
- **Tasks:** 2 (Task 1 as RED + GREEN commits, Task 2 as one commit)
- **Files modified:** 18

## Accomplishments

- **Expiry rules (PAQ-05, D-23).** `evaluarVigencia` is pure and takes `hoy` as a parameter. A soporte is vencido iff `vigencia_hasta < hoy` (ISO string compare), so the expiry day itself is valid. The warning "vence en N días" appears iff `0 <= N <= dias_aviso_vencimiento`, which is 30 inclusive.
- **Soporte evaluation (PAQ-03, D-22).**
  - A soporte is ausente when it has no index entry or its file is missing.
  - The emitter warning is rendered from `reglas.soportes.aviso_emisor_distinto` and never blocks.
  - `construirChecklist` blocks only on ausente or vencido soportes. Faltante fields are listed but never block (RN3).
- **Paquete (PAQ-01, D-10).**
  - `armar_paquete` refuses with FORMULARIO_NO_GENERADO when the case's formulario file is missing.
  - It evaluates and renders the checklist before touching disk, then recreates `paquete/` and copies the formulario plus each deduplicated soporte archivo. Expired soportes are copied, per locked option A6.
  - It writes `checklist.md` and returns sorted relative paths.
- **Checklist (PAQ-02, D-27).** `src/knowledge/plantillas/checklist.md` renders:
  - the header with caso, cliente and fecha de ejecución, and LISTO or BLOQUEADO with motivos
  - the soportes table, where the D-22 warning is a column (Pitfall 11)
  - the faltantes and por-confirmar lists with their nota
  - `- [ ]` actions
- **Containment (T-01-16).** The copier accepts only allowlisted destinations. The origin realpath must sit inside `repositorio/soportes` or `out/<caso>` (outside `paquete/`). The index schema rejects `..`, reserved paquete names and impossible dates.
- **Concurrency and logs (T-01-18, SEG-04).** Everything runs inside `entorno.candado(caso)`. Each call logs one line to both log files, with resumen `<caso>: LISTO` or `<caso>: BLOQUEADO (<bloqueos>)`.

## Task Commits

1. **Task 1: Expiry rules and soporte evaluation as pure domain code**
   - `27d239c` (test, RED)
   - `a2f53d2` (feat, GREEN)
2. **Task 2: proveedor_armar_paquete with soporte copies and an editable checklist.md for the four cases** - `1ca39ac` (feat, tests included)

### TDD evidence (Task 1)

- **RED `27d239c`.** `tests/unit/vigencias.test.ts` ran 15 tests: 2 pass, 13 fail, all on assertions. To get an assertion-level failure instead of a module-load error, the commit also includes type-correct skeletons of `vigencias.ts` and `checklist.ts` that return placeholders. The JUnit report went through `gsd-tools check tdd-red-evidence` and got `RED_EVIDENCE_OK` (`target_test_failed`). The target was "a 27 días del vencimiento está vigente y avisa 'vence en 27 días'": expected `{vigente, 27, "vence en 27 días"}`, received `{vigente, null, null}`.
  - Semantic assessment: the target ran and failed on the planned behavior. The 2 passing tests are the null-vigencia case, which the placeholder happens to satisfy, and a vacuous `every` over an empty list. Neither is the target.
- **GREEN `a2f53d2`.** 15/15 pass, and the architecture and no-comments guards stay clean.
- **REFACTOR.** Not needed.

## Files Created/Modified

- `src/domain/vigencias.ts`: `evaluarVigencia`, `textoVence`
- `src/domain/checklist.ts`: `SoporteIndice`, `SoporteEvaluado`, `Checklist`, `evaluarSoportes`, `construirChecklist`, `DatosChecklist`, `construirDatosChecklist`, `TEXTO_SIN_VIGENCIA`
- `src/application/armar-paquete.ts`: `evaluarEstadoPaquete`, `armarPaquete`, `DatosPaquete`
- `src/application/puertos.ts`: `Entorno.soportes`, `salida.existe`, `salida.reiniciarPaquete`, `salida.copiar`, `ArchivoFormulario`, `OrigenCopia`, plus the `checklist` output key
- `src/infra/salida/copias.ts`: `copiarAlPaquete`
- `src/infra/salida/archivos.ts`: `reiniciarPaquete`, plus the shared containment helper `casoRealDentroDeSalida`
- `src/infra/fixtures/esquemas.ts`: `esquemaIndiceSoportes`
- `src/infra/fixtures/lector.ts`: `directorioSoportes`, `leerIndiceSoportes`, `soportesPresentes`
- `src/config/constantes.ts`: `SOPORTES_DIR`, `INDICE_SOPORTES`, `NOMBRES_RESERVADOS_PAQUETE`, the paquete formulario entries in `ARCHIVOS_SALIDA`
- `src/config/env.ts`: exports `esFechaReal`
- `src/knowledge/plantillas/checklist.md`: editable checklist template
- `src/tools/wiring.ts`, `src/tools/fabrica.ts`, `src/tools/proveedor.ts`: bind and export `armar_paquete`
- `tests/unit/vigencias.test.ts`, `tests/unit/copias.test.ts`, `tests/golden/paquete.test.ts`
- `tests/e2e/trazador.test.ts`: the expected export list now includes `armar_paquete`

## Decisions Made

See `key-decisions` in the frontmatter. CONTEXT left the exact checklist wording to Claude's discretion, within the D-27 structure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The trazador e2e pinned the old export list**
- **Found during:** Task 2
- **Issue:** `tests/e2e/trazador.test.ts` asserted that `proveedor.ts` exports exactly `generar_formulario,leer_solicitud,mapear_campos`. Adding `armar_paquete` as the plan requires broke it.
- **Fix:** Updated the expected list to include `armar_paquete`. Plan 01-10 tightens this to the five PRD tools.
- **Files modified:** tests/e2e/trazador.test.ts
- **Commit:** 1ca39ac

**2. [Rule 2 - Missing critical] The index schema refuses reserved names and impossible dates**
- **Found during:** Task 2
- **Issue:** An index entry named `checklist.md` or `formulario.xlsx` matches PATRON_ARCHIVO_SOPORTE and would overwrite a paquete file. A date like `2026-02-31` passes the format regex but breaks the day count.
- **Fix:** `NOMBRES_RESERVADOS_PAQUETE` is derived from `ARCHIVOS_SALIDA`. The schema refines on it and on `esFechaReal`, which `src/config/env.ts` now exports. The copier also refuses reserved names for soporte copies. `soportesPresentes` excludes `index.json`.
- **Files modified:** src/config/constantes.ts, src/config/env.ts, src/infra/fixtures/esquemas.ts, src/infra/fixtures/lector.ts, src/infra/salida/copias.ts
- **Commit:** 1ca39ac

**3. [Rule 2 - Missing critical] Direct tests for the copier (T-01-16)**
- **Found during:** Task 2
- **Issue:** The threat register marks T-01-16 `mitigate`, but the plan only tested it indirectly through the golden.
- **Fix:** `tests/unit/copias.test.ts` covers rejected destinations, an origin outside the allowed roots, a symlink out of the repository, an origin inside `paquete/`, and the index schema.
- **Commit:** 1ca39ac

**4. [Interface refinement] `salida.copiar(caso, origen)` with a typed origin**
- **Reason:** The plan wrote `copiar(caso, origen, destino)`. The typed `OrigenCopia` makes the destination derivable, which removes a way to pair an origin with the wrong name. `copiarAlPaquete(raiz, caso, origenAbs, nombreDestino)` keeps the plan's infra signature.

**5. [Interface refinement] `evaluarSoportes` returns `Resultado`**
- **Reason:** The emitter warning is rendered from `reglas.json` and can fail with REGLAS_INVALIDAS, which a unit test covers.

**6. [Out-of-list file] `src/infra/salida/archivos.ts`**
- **Reason:** It hosts `reiniciarPaquete`. Its containment logic is now a shared helper, so `escribirContenido` and `reiniciarPaquete` don't duplicate it.

---

**Total deviations:** 3 auto-fixed (1 Rule 3, 2 Rule 2) and 3 interface or placement refinements. **Impact:** no scope change. All earlier goldens are unchanged, and 312 tests pass.

## Issues Encountered

- Under TS 7, `test.each(CASOS)` with a readonly tuple typed the callback argument as `unknown`. Replaced it with a `for` loop over `CASOS` before commit `1ca39ac`.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model. T-01-16 is mitigated by the copier's destination allowlist and realpath origin check, plus the index schema, all unit-tested. T-01-18 is mitigated by the per-caso lock, covered by the concurrency golden. T-01-SC holds: no new packages, and `bun audit` is clean.

## Verification

- `bun test`: 312 pass, 0 fail (22 files)
- `bun run check`: tsc, Biome and `bun audit` all clean
- Rendered ec and co checklists read back correctly. ec shows BLOQUEADO with its motivo, the emitter warning in the País emisor column for the 4 present soportes, the faltante and the RUC nota, and 4 `- [ ]` actions.

## User Setup Required

None.

## Next Phase Readiness

- 01-10 can add `borrador-correo.md` to `paquete/` through `salida.escribir(caso, "borradorCorreo", ...)` once the key joins `ArchivoSalida`, since `paquete/borrador-correo.md` is already allowlisted. `simular_envio` can reuse `evaluarEstadoPaquete(contexto, entorno)` for the current bloqueos.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-12*

## Self-Check: PASSED
