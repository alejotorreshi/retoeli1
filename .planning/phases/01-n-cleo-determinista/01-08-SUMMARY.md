---
phase: 01-n-cleo-determinista
plan: 08
subsystem: tools
tags: [generar-formulario, pdf, pdf-lib, winansi, portal, plantillas, d-03, d-28, d-29, tdd]

requires:
  - phase: 01-04
    provides: "renderizarPlantilla (minimal engine, unknown variable gives REGLAS_INVALIDAS), mapearCampos"
  - phase: 01-05
    provides: "cargarReglas, DIRECTORIO_CONOCIMIENTO_POR_DEFECTO, reglas.plantillas.valores_portal, crearHerramientas({directorioConocimiento})"
  - phase: 01-07
    provides: "generarFormulario pipeline (canonical recompute, compararMapeo D-11, limpiarArtefactosPrevios D-12), construirFilas, escribirBinarioSalida, generarCaso/proyectarMapeo helpers"
provides:
  - "proveedor_generar_formulario complete for the three formats: xlsx (co, hn), pdf (ec), portal (pa)"
  - "componerPdf / Pagina / LineaPdf / Medir / EntradaLayoutPdf (src/infra/salida/pdf/layout.ts), pure layout with injected measurer"
  - "renderizarPdf / sanearWinAnsi (src/infra/salida/pdf/render.ts)"
  - "cargarPlantillaTexto (src/infra/knowledge/plantillas.ts), per-call template text loader"
  - "construirDatosPortal / DatosValoresPortal / AVISO_FORMATO_NO_SOPORTADO (src/domain/portal.ts)"
  - "Editable template src/knowledge/plantillas/valores-portal.md"
  - "Entorno.formularios.pdf, Entorno.plantillas.cargar(reglas, clave), ArchivoSalida valoresPortal, ArchivoBinario formularioPdf, ClavePlantilla"
  - "DatosFormulario.aviso; the tool presents {ruta, formato, aviso} only for portal"
  - "extraerTrazos test helper (tests/helpers/pdf-texto.ts)"
affects: [01-09, 01-10, 01-11, phase-02, phase-04]

actuals:
  tokens: 12300
  tasks: 2
  commits: 3
plan_head_before: 8b916a08ccea9609110f6b5194f0d592d04264db
plan_head_after: b031f27307898a679eba62e55d5a156dd4861b39

tech-stack:
  added: []
  patterns:
    - "PDF split into a pure layout (componerPdf with an injected Medir) and a thin pdf-lib renderer, so layout is unit-tested without fonts"
    - "Every drawn and measured PDF string passes through sanearWinAnsi with the embedded font's own character set"
    - "Editable knowledge templates are read per call through a port (plantillas.cargar) and rendered against a code-built allowlisted context"
    - "Each generar_formulario arm ends in a shared cerrar() that rewrites mapeo.json and builds DatosFormulario"

key-files:
  created:
    - src/infra/salida/pdf/layout.ts
    - src/infra/salida/pdf/render.ts
    - src/infra/knowledge/plantillas.ts
    - src/domain/portal.ts
    - src/knowledge/plantillas/valores-portal.md
    - tests/helpers/pdf-texto.ts
    - tests/unit/pdf-layout.test.ts
    - tests/golden/formulario-pdf.test.ts
    - tests/golden/formulario-portal.test.ts
  modified:
    - src/application/generar-formulario.ts
    - src/application/puertos.ts
    - src/config/constantes.ts
    - src/domain/reglas.ts
    - src/infra/knowledge/reglas.ts
    - src/tools/fabrica.ts
    - src/tools/wiring.ts
    - tests/helpers/flujo.ts

key-decisions:
  - "PDF layout: A4 595x842, margins 50, two columns (bold label 190 pt wide, value from x=255, 290 pt wide), text 10 pt, titles 12 pt, line height 14, 6 pt between fields; all in DISENO_PDF in constantes.ts"
  - "PDF colors: rgb(0.75,0,0) for [FALTANTE], rgb(0.8,0.5,0) for the whole '<valor> [POR CONFIRMAR]' line, black for everything else; texts in TEXTOS_PDF"
  - "PDF Notas lists template order 'etiqueta: motivo': faltante uses 'no existe en el maestro', requiere_confirmacion uses its nota (fallback 'confirmar con el cliente'), lleno lists its context nota; with nothing to list it says 'Sin observaciones.'"
  - "[POR CONFIRMAR] is never split across lines: it joins the last value line when it fits, otherwise it takes its own line"
  - "PDF Title, Author, Creator and Producer are all registro-proveedor and both dates are FECHA_EJECUCION at 00:00Z, which makes two renders byte-identical"
  - "Port is plantillas.cargar(reglas, clave) rather than cargar(clave), so the template path comes from the same reglas.json read that built the case context"
  - "valores-portal.md context is caso, cliente, fecha_ejecucion, aviso, campos and pendientes ({etiqueta, valor, estado, nota}); a faltante valor is an empty string and estado is shown as lleno/faltante/por confirmar"
  - "Portal resumen reads '<caso>: valores para portal generados, formato no soportado (N llenos, ...)'"

patterns-established:
  - "Layout seam: pure function from domain rows to positioned lines, renderer only maps lines to drawing calls"
  - "Template-driven outputs: application loads text via port, domain builds the allowlisted context, domain engine renders"

requirements-completed: [FORM-02, FORM-03, FORM-04, MAP-07]

coverage:
  - id: D1
    description: "ec-corp-andina formulario.pdf lists the 15 labels in template order with [FALTANTE] in red, '<RUC> [POR CONFIRMAR]' in amber and a final Notas section"
    requirement: FORM-02
    verification:
      - kind: e2e
        ref: "tests/golden/formulario-pdf.test.ts#ec-corp-andina escribe formulario.pdf con las 15 etiquetas en el orden de la plantilla"
        status: pass
      - kind: e2e
        ref: "tests/golden/formulario-pdf.test.ts#marca el faltante en rojo, el RUC por confirmar en ámbar y cierra con las Notas"
        status: pass
      - kind: unit
        ref: "tests/unit/pdf-layout.test.ts#componerPdf (FORM-02, D-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "PDF renders are byte-identical for the same FECHA_EJECUCION, with Producer registro-proveedor and dates 2026-09-03"
    requirement: FORM-02
    verification:
      - kind: e2e
        ref: "tests/golden/formulario-pdf.test.ts#dos generaciones con la misma FECHA_EJECUCION dan bytes idénticos y metadatos fijos"
        status: pass
    human_judgment: false
  - id: D3
    description: "No input text can make pdf-lib throw: sanearWinAnsi normalizes NFC, turns CR/LF/TAB into spaces and replaces anything outside the font set with ?"
    requirement: FORM-02
    verification:
      - kind: unit
        ref: "tests/unit/pdf-layout.test.ts#sanearWinAnsi (D-03, Pitfall 2)"
        status: pass
      - kind: unit
        ref: "tests/unit/pdf-layout.test.ts#renderizarPdf (T-01-13)"
        status: pass
    human_judgment: false
  - id: D4
    description: "pa-logistica-istmo returns ok:true with {ruta: out/pa-logistica-istmo/valores-portal.md, formato: portal, aviso: formato no soportado} and the file lists the 9 labels with maestro values"
    requirement: FORM-03
    verification:
      - kind: e2e
        ref: "tests/golden/formulario-portal.test.ts#pa-logistica-istmo responde ok con el aviso y escribe valores-portal.md desde la plantilla"
        status: pass
    human_judgment: false
  - id: D5
    description: "valores-portal.md is editable data: a text edit changes the next output, and {{banco.numero_cuenta}} gives REGLAS_INVALIDAS with no file written"
    requirement: FORM-03
    verification:
      - kind: e2e
        ref: "tests/golden/formulario-portal.test.ts#una plantilla editada con {{banco.numero_cuenta}} da REGLAS_INVALIDAS y no escribe el archivo"
        status: pass
      - kind: e2e
        ref: "tests/golden/formulario-portal.test.ts#cambiar el texto del aviso en la plantilla cambia la salida siguiente sin tocar código"
        status: pass
    human_judgment: false
  - id: D6
    description: "The pdf and portal arms reject a tampered mapping with MAPEO_INCONSISTENTE through the shared D-11 guard"
    requirement: FORM-04
    verification:
      - kind: e2e
        ref: "tests/golden/formulario-portal.test.ts#un mapeo de pa con una ruta cambiada da MAPEO_INCONSISTENTE y no escribe valores-portal.md (FORM-04)"
        status: pass
    human_judgment: false
  - id: D7
    description: "PDF readability and visual quality of the layout (columns, colors, spacing) for the defense"
    verification: []
    human_judgment: true
    rationale: "Visual judgment; the executor rendered ec to PNG and it looked correct, but no test asserts aesthetics"

duration: 6min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 08: PDF and portal formats for generar_formulario Summary

**`proveedor_generar_formulario` now covers all three formats. ec produces a deterministic two-column A4 PDF (pdf-lib, Helvetica) where every string passes through a WinAnsi sanitizer, with `[FALTANTE]` in red, `[POR CONFIRMAR]` in amber and a Notas section. pa returns ok:true with "formato no soportado" and writes `valores-portal.md` from an editable template whose context is built from an allowlist.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-12T22:43:59Z
- **Completed:** 2026-10-12T22:49:40Z
- **Tasks:** 2 (Task 1 as RED + GREEN commits, Task 2 as one commit)
- **Files modified:** 17

## Accomplishments

- **PDF arm (FORM-02, D-03).** `componerPdf` is a pure layout. It writes a header (title, caso, cliente, fecha de ejecución), then one two-column block per field in template order (bold label with ` *` when obligatorio, value wrapped at 290 pt), then a final "Notas" section. It paginates when a block no longer fits above the bottom margin.
- **Renderer (T-01-13).** `renderizarPdf` sanitizes every drawn and measured string with `sanearWinAnsi`, using the font's own `getCharacterSet()`. Text from the maestro, the template or the client can't make pdf-lib throw.
- **Determinism.** Metadata is fixed (`registro-proveedor`, with the dates set to FECHA_EJECUCION), so two generations of `out/ec-corp-andina/formulario.pdf` are byte-identical. That covers the DEMO-01 prerequisite.
- **Portal arm (FORM-03, D-28, D-29).**
  - The arm loads `src/knowledge/plantillas/valores-portal.md` on every call and builds `DatosValoresPortal` in code. It renders the file with the 01-04 engine and returns `{ruta, formato: "portal", aviso: "formato no soportado"}`.
  - A template edit that references `{{banco.numero_cuenta}}` is rejected with REGLAS_INVALIDAS before anything is written.
- **Shared guard (FORM-04).** Both new arms run after the same canonical recompute, D-11 comparison and D-12 cleanup as xlsx. Every arm ends in a shared `cerrar()` that rewrites `mapeo.json`.
- **Broken windows.** The 01-07 stub entry (pdf and portal returned ERROR_INTERNO) is marked fixed in `.planning/WINDOWS.md`.

## Task Commits

1. **Task 1: PDF formulario in template order with WinAnsi-safe marks and notes**
   - `5fd23fd` (test, RED)
   - `c861293` (feat, GREEN)
2. **Task 2: Portal case returns ok:true with "formato no soportado" and writes valores-portal.md** - `b031f27` (feat, tests included)

### TDD evidence (Task 1)

- **RED `5fd23fd`.** `tests/golden/formulario-pdf.test.ts` ran 4 tests: 0 pass, 4 fail, all on the assertion `expect(flujo.respuesta.ok).toBe(true)`, because the pdf arm still returned ERROR_INTERNO. The JUnit report (`bun test --reporter=junit`) went through `gsd-tools check tdd-red-evidence` and got `RED_EVIDENCE_OK` (`target_test_failed`, target "ec-corp-andina escribe formulario.pdf con las 15 etiquetas en el orden de la plantilla").
  - Semantic assessment: the target test ran and failed on the planned behavior, which is a missing pdf output.
  - `tests/unit/pdf-layout.test.ts` failed at module resolution because `layout.ts` and `render.ts` did not exist yet. That is the same pattern 01-07 accepted for new modules, and it is not counted as assertion-level RED evidence.
- **GREEN `c861293`.** Both files pass (14 tests), and so does the full suite.
- **REFACTOR.** Not needed.

## Files Created/Modified

- `src/infra/salida/pdf/layout.ts`: pure layout model (`componerPdf`, `Pagina`, `LineaPdf`, `Medir`)
- `src/infra/salida/pdf/render.ts`: `renderizarPdf` (pdf-lib, Helvetica and Helvetica-Bold, fixed metadata) and `sanearWinAnsi`
- `src/infra/knowledge/plantillas.ts`: `cargarPlantillaTexto`, which re-checks the path regex, applies LIMITE_LECTURA_BYTES and returns REGLAS_INVALIDAS on any failure
- `src/domain/portal.ts`: `construirDatosPortal`, `DatosValoresPortal`, `AVISO_FORMATO_NO_SOPORTADO`
- `src/knowledge/plantillas/valores-portal.md`: editable portal template (heading, date, the analyst-fills-the-portal notice, values table, pending list)
- `src/application/generar-formulario.ts`: pdf and portal arms, shared `cerrar()`, `aviso` in DatosFormulario
- `src/application/puertos.ts`: `EntradaFormularioPdf`, `formularios.pdf`, `PlantillasConocimiento`, `valoresPortal` and `formularioPdf` keys
- `src/config/constantes.ts`: `DISENO_PDF`, `TEXTOS_PDF`
- `src/domain/reglas.ts`: `ClavePlantilla`
- `src/infra/knowledge/reglas.ts`: exports `leerTexto` so the template loader reuses it
- `src/tools/fabrica.ts`: generar_formulario adds `aviso` only for portal, plus the portal resumen
- `src/tools/wiring.ts`: binds `renderizarPdf` and `cargarPlantillaTexto` (with the same knowledge-directory option)
- `tests/helpers/pdf-texto.ts`: `extraerTrazos` (RESEARCH Pattern 8), with a `Trazo` return type added
- `tests/helpers/flujo.ts`: `RespuestaGenerar.data.aviso`
- `tests/unit/pdf-layout.test.ts`, `tests/golden/formulario-pdf.test.ts`, `tests/golden/formulario-portal.test.ts`

## Decisions Made

See `key-decisions` in the frontmatter. The PDF layout, colors and the content of `valores-portal.md` were left to Claude's discretion by CONTEXT, and this plan records them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The tool presenter had to expose `aviso`**
- **Found during:** Task 2
- **Issue:** `src/tools/fabrica.ts` (not in the plan's file list) projected generar_formulario data to `{ruta, formato}` only, so the portal `aviso` could never reach the caller.
- **Fix:** `presentar` adds `aviso` only when it is non-null, so the xlsx and pdf shapes stay exactly `{ruta, formato}`. `resumir` gets a portal phrasing.
- **Files modified:** src/tools/fabrica.ts, tests/helpers/flujo.ts
- **Commit:** b031f27

**2. [Rule 3 - Blocking] Template loader reuses the bounded reader from reglas.ts**
- **Found during:** Task 2
- **Issue:** The bounded file reader (isFile plus LIMITE_LECTURA_BYTES) was private to `src/infra/knowledge/reglas.ts`.
- **Fix:** Export `leerTexto` and reuse it instead of duplicating it.
- **Files modified:** src/infra/knowledge/reglas.ts
- **Commit:** b031f27

**3. [Interface refinement] `plantillas.cargar(reglas, clave)` instead of `cargar(clave)`**
- **Found during:** Task 2
- **Issue:** `cargar(clave)` alone would force wiring to re-read `reglas.json` to find the template path, which is a second read that could disagree with the reglas already loaded for the case.
- **Fix:** The port takes the already-validated `Reglas`. `cargarPlantillaTexto(directorio, reglas, clave)` keeps the plan's signature.
- **Commit:** b031f27

**4. [Type location] `EntradaFormularioPdf` lives in `src/application/puertos.ts` and `ClavePlantilla` in `src/domain/reglas.ts`**
- **Reason:** Port payload types belong next to the port, and `domain/reglas.ts` already owns `RutasPlantillas`. `src/domain/formulario.ts` stays unchanged.

---

**Total deviations:** 2 auto-fixed (both Rule 3) plus 2 interface refinements. **Impact:** none on scope. The xlsx contract and the earlier goldens are unchanged, and all 259 tests pass.

## Issues Encountered

- `tsc` rejected `rgb(...DISENO_PDF.colores[color])`, because a spread of a union of readonly tuples doesn't count as a tuple for a non-rest parameter. Fixed by destructuring before commit `c861293`.

## Known Stubs

None. The 01-07 stub (pdf and portal arms returning ERROR_INTERNO) is resolved, and WINDOWS.md entry 1 is marked fixed.

## Threat Flags

None beyond the plan's threat model. T-01-13 is mitigated by `sanearWinAnsi` on every drawn and measured string. T-01-14 is mitigated by the code-built `DatosValoresPortal` and the engine's unknown-variable rejection, tested with `{{banco.numero_cuenta}}`. T-01-SC holds: no new packages, and `bun audit` is clean.

## Verification

- `bun test`: 259 pass, 0 fail (19 files)
- `bun run check`: tsc, Biome and `bun audit` all clean
- Visual check: ec rendered to PNG. It shows the labels in two columns, an amber `900123456 [POR CONFIRMAR]`, a red `[FALTANTE]`, the actividad económica wrapped to 2 lines and the Notas section at the end.

## User Setup Required

None.

## Next Phase Readiness

- 01-09 (armar_paquete) can copy `formulario.xlsx`, `formulario.pdf` or `valores-portal.md`. All three formats are produced, and `cargarPlantillaTexto` is ready for `checklist.md`, `borrador-correo.md` and `ENVIO-SIMULADO.md` through `plantillas.cargar(reglas, clave)`.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-12*

## Self-Check: PASSED
