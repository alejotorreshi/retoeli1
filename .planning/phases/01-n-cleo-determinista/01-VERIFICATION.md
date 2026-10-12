---
phase: 01-n-cleo-determinista
verified: 2026-10-12T23:45:00Z
status: gaps_found
score: 90/91 must-haves verified
covered_files: [".bun-version",".dockerignore",".gitignore",".planning/phases/01-n-cleo-determinista/01-01-PLAN.md",".planning/phases/01-n-cleo-determinista/01-01-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-02-PLAN.md",".planning/phases/01-n-cleo-determinista/01-02-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-03-PLAN.md",".planning/phases/01-n-cleo-determinista/01-03-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-04-PLAN.md",".planning/phases/01-n-cleo-determinista/01-04-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-05-PLAN.md",".planning/phases/01-n-cleo-determinista/01-05-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-06-PLAN.md",".planning/phases/01-n-cleo-determinista/01-06-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-07-PLAN.md",".planning/phases/01-n-cleo-determinista/01-07-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-08-PLAN.md",".planning/phases/01-n-cleo-determinista/01-08-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-09-PLAN.md",".planning/phases/01-n-cleo-determinista/01-09-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-10-PLAN.md",".planning/phases/01-n-cleo-determinista/01-10-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-11-PLAN.md",".planning/phases/01-n-cleo-determinista/01-11-SUMMARY.md","biome.json","bun.lock","demo.ts","package.json","src/application/armar-paquete.ts","src/application/contexto-caso.ts","src/application/generar-formulario.ts","src/application/leer-solicitud.ts","src/application/mapear-campos.ts","src/application/puertos.ts","src/application/simular-envio.ts","src/config/constantes.ts","src/config/env.ts","src/demo/ejecutar-demo.ts","src/domain/borrador.ts","src/domain/checklist.ts","src/domain/comparar-mapeo.ts","src/domain/errores.ts","src/domain/formulario.ts","src/domain/mapeo.ts","src/domain/normalizar.ts","src/domain/pii.ts","src/domain/plantillas.ts","src/domain/portal.ts","src/domain/reglas.ts","src/domain/resultado.ts","src/domain/solicitud.ts","src/domain/tipos.ts","src/domain/vigencias.ts","src/infra/bitacora.ts","src/infra/fixtures/esquemas.ts","src/infra/fixtures/lector.ts","src/infra/knowledge/plantillas.ts","src/infra/knowledge/reglas.ts","src/infra/reloj.ts","src/infra/salida/archivos.ts","src/infra/salida/copias.ts","src/infra/salida/mutex.ts","src/infra/salida/pdf/layout.ts","src/infra/salida/pdf/render.ts","src/infra/salida/rutas-seguras.ts","src/infra/salida/xlsx.ts","src/knowledge/plantillas/borrador-correo.md","src/knowledge/plantillas/checklist.md","src/knowledge/plantillas/envio-simulado.md","src/knowledge/plantillas/valores-portal.md","src/knowledge/reglas.json","src/tools/argumentos.ts","src/tools/define-tool.ts","src/tools/fabrica.ts","src/tools/issues.ts","src/tools/proveedor.ts","src/tools/wiring.ts","tests/architecture.test.ts","tests/contract/generar-formulario.test.ts","tests/contract/reglas.test.ts","tests/contract/simular-envio.test.ts","tests/contract/sinteticos.test.ts","tests/e2e/demo.test.ts","tests/e2e/determinismo.test.ts","tests/e2e/pii.test.ts","tests/e2e/trazador.test.ts","tests/fixtures/casos/zz-generica-co/plantilla-campos.json","tests/fixtures/casos/zz-generica-co/solicitud.json","tests/fixtures/casos/zz-generica-co/soportes-exigidos.json","tests/fixtures/casos/zz-generica-ec/plantilla-campos.json","tests/fixtures/casos/zz-generica-ec/solicitud.json","tests/fixtures/casos/zz-generica-ec/soportes-exigidos.json","tests/fixtures/casos/zz-plantilla-corrupta/plantilla-celdas.json","tests/fixtures/casos/zz-plantilla-corrupta/solicitud.json","tests/fixtures/casos/zz-plantilla-corrupta/soportes-exigidos.json","tests/golden/borrador-envio.test.ts","tests/golden/formulario-pdf.test.ts","tests/golden/formulario-portal.test.ts","tests/golden/formulario-xlsx.test.ts","tests/golden/mapear-campos.test.ts","tests/golden/paquete.test.ts","tests/helpers/correr-demo.ts","tests/helpers/flujo.ts","tests/helpers/instantanea.ts","tests/helpers/pdf-texto.ts","tests/helpers/proyecto-temporal.ts","tests/helpers/xlsx-leer.ts","tests/sin-comentarios.test.ts","tests/unit/comparar-mapeo.test.ts","tests/unit/copias.test.ts","tests/unit/mapeo.test.ts","tests/unit/normalizar.test.ts","tests/unit/pdf-layout.test.ts","tests/unit/pii.test.ts","tests/unit/plantillas.test.ts","tests/unit/salida.test.ts","tests/unit/solicitud.test.ts","tests/unit/vigencias.test.ts","tsconfig.json"]
covered_digest: "v3:sha256:08cb90d9bf009d7dad48789fb9d60ea0a92d1272a83ce95b6c40f209fe804ef9"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Un campo cuyo dato no existe en el maestro termina como `faltante` y aparece en el reporte de faltantes del checklist (Core Value, MAP-01, PRD HU-2 y O2)"
    status: partial
    reason: "leerRuta devuelve cualquier string tal cual, incluidos \"\" y \"   \", y esquemaMaestro acepta strings vacíos. Una clave del maestro que existe pero está en blanco se mapea como `lleno` con confianza 1. El xlsx escribe una celda vacía sin relleno ni nota, el checklist dice \"Campos faltantes: Ninguno\" y el paquete queda LISTO. Lo reproduje en un proyecto temporal con maestro.ciudad = \"   \" y maestro.ciiu_principal = \"\": co-industrias-delta dio 17/0/0, LISTO, listo_para_firma=true, con C7 = \"   \" y C14 = \"\". Es el hallazgo CR-01 del code review, que sigue abierto. Los 4 fixtures entregados no tienen valores en blanco, por eso la tabla de verdad sigue correcta."
    artifacts:
      - path: "src/domain/mapeo.ts"
        issue: "leerRuta (líneas 84-94) devuelve una hoja string vacía o solo con espacios en vez de null, así que mapearEtiqueta la reporta como `lleno`"
      - path: "src/infra/fixtures/esquemas.ts"
        issue: "esquemaMaestro acepta valores string vacíos sin marcarlos"
      - path: "tests/unit/mapeo.test.ts"
        issue: "Ningún test cubre una hoja del maestro vacía o solo con espacios; el caso límite no está especificado"
    missing:
      - "Hacer que leerRuta devuelva null cuando la hoja string, después de trim, queda vacía, para que el campo sea `faltante` con regla sin_fuente y valor null"
      - "Test unitario: \"\" y \"   \" en una ruta existente del maestro dan `faltante` (confianza 0, valor_enmascarado null)"
      - "Test de contrato en un proyecto temporal: un maestro con un valor en blanco hace que el campo aparezca en 'Campos faltantes' de checklist.md, en la celda xlsx con el relleno y la nota de faltante y en los pendientes del borrador"
deferred:
  - truth: "SEG-02: una única función `redactar()` basada en una política de rutas sensibles se aplica a los logs, la API, el SSE y los resúmenes de tool calls"
    addressed_in: "Phase 2 / Phase 3"
    evidence: "Criterio 5 de la Fase 2: 'Los logs JSON llevan IDs de sesión, turno y tool call, sin clave ni PII'. Criterio 2 de la Fase 3: 'cada tool call como tarjeta colapsable (nombre, args redactados…)'. Criterio 3 de la Fase 3: 'el historial vuelve desde GET /api/sessions/:id con la PII redactada'. En la Fase 1 la política (POLITICA_PII, enmascarar, presentarCampo en src/domain/pii.ts) y el test de grep de PII existen. La API y el SSE todavía no existen; 01-11-SUMMARY lo dice explícitamente."
---

# Phase 1: Núcleo determinista Verification Report

**Phase Goal:** Cualquiera puede correr `bun run demo.ts` sin clave LLM y obtener, para los 4 casos, formularios, paquetes para firma y logs correctos y reproducibles. Cada valor sale de una herramienta tipada que lo lee del maestro, y ninguna inventa un dato.
**Verified:** 2026-10-12T23:45:00Z
**Status:** gaps_found
**Re-verification:** No. This is the initial verification.

## Goal Achievement

The verifier ran every check below in its own process. The 11 SUMMARY files were used only to locate code.

- `bun run check` exited 0. That covers tsc strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, Biome over 90 files, and `bun audit`, which found 0 vulnerabilities in 207 packages.
- `bun test` passed 345 tests with 0 failures in 26 files (2333 assertions).
- `bun run demo.ts` ran twice with `DEEPSEEK_API_KEY` and `FECHA_EJECUCION` unset. Both runs exited 0 and produced byte-identical stdout.
- An independent contract probe called all 5 exported tools in a temp project copy: 53 calls, 0 throws, 0 stack traces, 0 PII hits.
- The CR-01 reproduction and the concurrency observation are described below.

The phase goal holds for the 4 delivered cases: correct forms, packages, logs and reproducible output, with no invented values. One general guarantee is still missing: a master key that exists but is blank is reported as `lleno` instead of `faltante` (CR-01).

### Observable Truths

**Roadmap success criteria and the goal / Core Value truths**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1: `bun run demo.ts` without an LLM key cleans `out/`, prints the date 2026-09-03 and the truth table (co 17/0/0 LISTO, ec 13/1/1 BLOQUEADO ausente, hn 9/1/1 BLOQUEADO vencido, pa 8/0/1 LISTO portal). Two runs give the same result apart from timestamps | ✓ VERIFIED | The demo ran twice with no key. A planted `out/zz-marker.txt` and `out/zz-stale-dir` were deleted. The exact table was printed. Stdout was byte-identical across runs. Every non-xlsx, non-log file was byte-identical, including the PDF. The 5 `log.jsonl` files were identical once `ts` was removed. The co and hn xlsx files were semantically identical cell by cell |
| 2 | SC2: the co xlsx holds labels and values at the template cells on both sheets, with leading zeros. The ec PDF lists fields in template order with visible marks. pa `valores-portal.md` exists and the tool returns ok:true with the notice "formato no soportado" | ✓ VERIFIED | The exceljs readback of co has sheets ["Datos Proveedor","Datos Bancarios"]. All 17 label cells match the template, and every value is a text cell (numFmt `@`) equal to `maestro.json`. C8 is "050021" and Datos Bancarios!C5 is "03100012345". The ec PDF text extraction shows all 15 labels in template order, "[POR CONFIRMAR]" in amber after the RUC and "[FALTANTE]" in red, followed by a Notas section. The pa probe returned `data: {"ruta":"out/pa-logistica-istmo/valores-portal.md","formato":"portal","aviso":"formato no soportado"}` |
| 3 | SC3: `paquete/` has the form, soporte copies, `checklist.md` and `borrador-correo.md` (to `solicitud.de`, "RE: <asunto>", no bank data). `mapeo.json` traces ruta, regla and confianza. The PII grep finds nothing | ✓ VERIFIED | `paquete/` holds the form, the soporte copies, the checklist and the borrador for all 4 cases. The ec checklist shows the date, LISTO/BLOQUEADO, presentes/ausentes/vencidos, "vence en 27 días", faltantes and por confirmar. The ec borrador goes `Para: proveedores@corpandina-ficticia.ec` with `Asunto: RE: Calificación de proveedores - Formulario PDF` and has no `banco.*` data. The `mapeo.json` files hold 17, 15, 11 and 9 entries with ruta, regla and confianza. `71555123\|03100012345\|COLOCOBM` gave 0 hits over the logs, mapeo, checklists, borradores, ENVIO-SIMULADO, stdout and all 20 tool responses. A broader scan (names, emails, phones, address, revenue, NIT) also gave 0 hits. The positive control `valores-portal.md` does contain COLOCOBM and 03100012345 |
| 4 | SC4: the 5 tools import without a server or secrets and never throw. Invalid args, a mapeo carrying values, traversal, an unknown case and a corrupt template return `{ok:false,error}` with a stable code and Spanish text. `simular_envio` without confirmation returns "requiere confirmación explícita". Every call is logged in both log files | ✓ VERIFIED | Probe results: 8 bad-arg shapes gave ARGS_INVALIDOS with a Spanish zod detail. `../x`, `a/b`, `CO`, `../../etc` and a symlink escaping `casos/` gave CASO_INVALIDO. `no-existe` and `""` gave CASO_NO_ENCONTRADO plus `casos_disponibles`. The corrupt template gave PLANTILLA_INVALIDA plus `{pais,cliente,formato,soportes}` from both `leer_solicitud` and `mapear_campos`. A `valor` key gave ARGS_INVALIDOS. An upgraded estado, a changed ruta and a dropped item gave MAPEO_INCONSISTENTE. A missing or null ctx gave CONFIGURACION_INVALIDA. Unconfirmed or false `simular_envio` returned exactly `error: "requiere confirmación explícita"`. 0 throws. The global log had 51 lines for 51 calls that had a directory. Caveat IN-05: see warnings |
| 5 | SC5: `bun run check` and `bun test` pass, including the golden, synthetic and architecture tests. No comments. Config is centralized and validated with zod | ✓ VERIFIED | Check exit 0. Tests 345/0. The architecture test enforces layer imports and bans shell APIs. The no-comment guard is green, and a grep for `//` and `/*` in src and demo.ts found nothing. The synthetic `zz-generica-ec` label "Número de identificación fiscal" gives `requiere_confirmacion`, `etiqueta_generica`, 0.5, `propuesta: "RUC"`. `src/config/constantes.ts`, the zod schema in `src/config/env.ts` and the zod-validated `reglas.json` are in place. No `.skip`, `.todo` or `.only` |
| 6 | Goal: every form value comes from a typed tool that reads it from the master | ✓ VERIFIED | `generar_formulario` accepts only strict `{etiqueta,estado,ruta}` items (`argumentos.ts`). It recomputes the canonical mapping from `maestro.json` and calls `compararMapeo` before writing. Tampered mappings are rejected. Every co and hn cell matches `maestro.json` |
| 7 | Goal: no tool invents a datum | ✓ VERIFIED | "Número de contribuyente especial" (ec) and "Referencias comerciales" (hn) are `faltante` with ruta null and value null. The xlsx B12 cell is empty with the red fill and the note "Faltante: no existe en el maestro". The PDF shows [FALTANTE]. No filler values were found anywhere |
| 8 | Core Value / MAP-01: a field with no datum in the master ends as `faltante` and is listed in the checklist | ✗ FAILED (partial) | CR-01 reproduced. A blank or whitespace master value is mapped `lleno` with confianza 1, the xlsx gets a blank cell with no mark, the checklist says "Campos faltantes: Ninguno", and the case is LISTO. See Gaps |
| 9 | Core Value: no external action happens without explicit confirmation (tool level) | ✓ VERIFIED | `confirmado` missing or false gives CONFIRMACION_REQUERIDA, and the string "true" gives ARGS_INVALIDOS. Only `confirmado: true` after `armar_paquete` writes `ENVIO-SIMULADO.md`, which records the current bloqueos. The demo writes no ENVIO file. The server-side gate is Phase 2 (ENV-02) |

**PLAN frontmatter must-haves (82 truths across 11 plans)**

| Plan | Truths | Status | Key evidence |
|------|--------|--------|--------------|
| 01-01 | 5/5 | ✓ VERIFIED | The human gate is recorded verbatim in 01-01-SUMMARY ("approved with bun upgrade"). The pins in `package.json` match. `.bun-version` and runtime are 1.4.3. `git status -- reto-01` is clean, and only commit e13a7b5 touches `reto-01/`. `.DS_Store` is ignored. Check is green. The guards are non-vacuous (sample-source tests in the suite) |
| 01-02 | 9/9 | ✓ VERIFIED | Contract shapes, never-throw behavior, CASO_INVALIDO before any fs access, `sessionId`/`sessionID`, size-limited zod fixture reads and a Spanish `.describe()` on every arg field were all observed through the probe |
| 01-03 | 10/10 | ✓ VERIFIED | Realpath containment (symlink rejected). D-14 listing. No `out/` folder created for an unknown case (only `zz-corrupta` and the real cases got one). Env is parsed per execution: FECHA_EJECUCION "2026-02-30" gave CONFIGURACION_INVALIDA. With it unset the date is the America/Bogota date (2026-10-12 observed) |
| 01-04 | 11/11 | ✓ VERIFIED | The truth-table counts, regla_pais 0.6 with the foreign-identifier note, sin_fuente faltantes, the D-07 masks (`•••••3456`, `R. A. S.`, `l•••@…`, `+57 ••• ••• 0100`, `[monto oculto]`) and the hn "COP, año 2025" note were all observed. The non-scalar leaf → faltante behavior matches the stated truth (see WR-02) |
| 01-05 | 9/9 | ✓ VERIFIED | `mapeo.json` carries the full canonical mapping with no values. Per-call log lines were observed. `crearHerramientas({directorioConocimiento})` works (used in the WR-03 reproduction) |
| 01-06 | 6/6 | ✓ VERIFIED | `ambiguos` with a country proposal. The 4 real cases give `ambiguos: []`. Synthetic and corrupt fixtures are present. The concurrency test is green |
| 01-07 | 5/5 | ✓ VERIFIED | The co and hn xlsx readbacks match the stated cells, fills and notes. D-11 tampering was rejected. D-12 cleanup is covered by `unit/salida` and the golden tests |
| 01-08 | 5/5 | ✓ VERIFIED | PDF order, marks and notes extracted. Two-run PDF output is byte-identical. The portal data object matches exactly |
| 01-09 | 9/9 | ✓ VERIFIED | Bloqueos match exactly for all 4 cases, along with "vence en 27 días", the "Emitido en CO" warning and FORMULARIO_NO_GENERADO before generation |
| 01-10 | 6/6 | ✓ VERIFIED | Exactly 5 exports with one-sentence descriptions. Borrador and simular_envio as above. The backstop truth (CAL-04 concurrency) was **directly observed**: 5 rounds of 4 concurrent tools (`armar` ×2, `mapear`, `simular`) on hn all returned ok, `paquete/` held the same 6 files each round, `mapeo.json` always parsed, and all 22 log lines parsed. The only module-level mutable state is the mutex map in `src/infra/salida/mutex.ts` |
| 01-11 | 7/7 | ✓ VERIFIED | Demo blocks and table, the PRD tool order and a determinism check run by the verifier. The PII scan with a positive control was also re-run by the verifier |

**Prohibitions.** All five are test-tier with wired enforcement:

- 01-07 and 01-08: tampering and value-injection were rejected by the probe, and `contract/generar-formulario.test.ts` covers the same cases.
- 01-10, bank data: the borrador and ENVIO files contain no `banco.*` data (scanned).
- 01-10, knowledge edits: an unknown portal template variable gives REGLAS_INVALIDAS (tested), and the PII policy lives in code. WR-03 below concerns RN1 state, not PII.
- 01-11: the PII scan was clean.

None of them is flagged as unverified.

**Score:** 90/91 truths verified (0 present-but-behavior-unverified).

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | SEG-02 asks for a single `redactar()` function applied to the API, the SSE stream and tool-call summaries. Phase 1 has the route-based policy `POLITICA_PII` and the grep test, but the API and SSE do not exist yet | Phase 2 (SC5) / Phase 3 (SC2, SC3) | "Los logs JSON llevan IDs … sin clave ni PII"; "args redactados"; "historial … con la PII redactada" |

### Required Artifacts

`verify.artifacts` passed 55/55 artifacts across the 11 plans. Each one exists, is substantive and is imported or used. The key files are `src/tools/proveedor.ts`, `define-tool.ts`, `argumentos.ts`, `wiring.ts`, `fabrica.ts`, the 6 application use cases, the 16 domain modules, the infra adapters (`xlsx`, `pdf/render`, `pdf/layout`, `copias`, `rutas-seguras`, `bitacora`, `reloj`, `mutex`), `src/knowledge/reglas.json` with its 4 templates, `src/demo/ejecutar-demo.ts` and `demo.ts`.

### Key Link Verification

`verify.key-links` verified 33/33 links. These include `demo.ts` → `ejecutarDemo` → the 5 tools' `execute`, `define-tool` → `crearEntorno` and `registrar`, `wiring` → `parseToolEnv`, `cargarReglas`, `resolverCaso`, `escribirXlsx`, `renderizarPdf`, `copiarAlPaquete` and `cargarPlantillaTexto`, and `generar-formulario` → `compararMapeo`, `mapearCampos` and `construirDatosPortal`. The links are also exercised at runtime by the demo and the probe.

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| `formulario.xlsx` / `.pdf` / `valores-portal.md` | cell and row values | `maestro.json` via the canonical `mapearCampos` recompute | Yes: every cell equals the maestro leaf | ✓ FLOWING |
| `checklist.md` / `listo_para_firma` | soporte states | `repositorio/soportes/index.json` plus the injected clock | Yes: ec ausente, hn vencido 2026-08-31 | ✓ FLOWING |
| `borrador-correo.md` | recipient, subject, signature | `solicitud.de` / `asunto` plus `RUTAS_BORRADOR` | Yes | ✓ FLOWING |
| demo stdout | counts and states | tool responses | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Type check, lint, audit | `bun run check` | exit 0; 207 packages, 0 vulnerabilities | ✓ PASS |
| Full suite (run once) | `bun test` | 345 pass, 0 fail | ✓ PASS |
| Demo without a key, twice | `env -u DEEPSEEK_API_KEY -u FECHA_EJECUCION bun run demo.ts` | exit 0; identical stdout; truth table exact | ✓ PASS |
| Never-throw contract plus error codes | scratch probe over the 5 tools (temp project) | 53 calls, 0 throws, 0 stacks, 0 PII | ✓ PASS |
| D-11 tamper rejection | probe: valor key, upgraded estado, changed ruta, dropped item | ARGS_INVALIDOS / MAPEO_INCONSISTENTE ×3 | ✓ PASS |
| Confirmation gate | probe: `simular_envio` with confirmado missing, false, "true" and true | CONFIRMACION_REQUERIDA ×2, ARGS_INVALIDOS, ok and only ENVIO-SIMULADO.md written | ✓ PASS |
| CR-01 blank value | temp maestro with `ciudad: "   "` and `ciiu_principal: ""` | 17/0/0 LISTO; blank cells unmarked | ✗ FAIL |

### Probe Execution

Step 7c: no `scripts/*/tests/probe-*.sh` exist, and no plan declares one. N/A.

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| HERR-01 | 01-10 | ✓ SATISFIED | Exactly 5 exports, `proveedor_` prefix, one-sentence descriptions |
| HERR-02 | 01-02 | ✓ SATISFIED | Strict zod args, `.describe()` on every field, validated before execute |
| HERR-03 | 01-02/03/05/06/07 | ✓ SATISFIED | Never throws, stable codes, Spanish messages, no raw stack |
| HERR-04 | 01-01/02/03 | ✓ SATISFIED | Paths from `ctx.directory`, realpath containment, no shell API |
| HERR-05 | 01-02/03 | ✓ SATISFIED | Imports with an empty env. `sessionId`/`sessionID` accepted. Reused by `demo.ts`; `modulo/` is Phase 4 |
| SOLI-01 | 01-02/06 | ✓ SATISFIED | `{pais,cliente,formato,campos,soportes}`. Template chosen by the file present (6-row matrix) |
| SOLI-02 | 01-06 | ✓ SATISFIED | Generic labels give `requiere_confirmacion` with NIT/RUC/RTN |
| MAP-01 | 01-04/05 | ✗ BLOCKED (partial) | Three states are produced and correct for the 4 cases, but a blank or whitespace master value becomes `lleno` instead of `faltante` (CR-01) |
| MAP-02 | 01-04/05/06 | ✓ SATISFIED | Glossary plus normalization only, no fuzzy matching. The two named labels are `faltante`. A blank value is not an invented value; the misclassification is tracked under MAP-01 |
| MAP-03 | 01-04/05 | ✓ SATISFIED | CO NIT `lleno`. EC/PA/HN get the NIT plus `requiere_confirmacion` plus the note, with the shipped `reglas.json` (see WR-03) |
| MAP-04 | 01-04/05 | ✓ SATISFIED | Nested rutas read. A missing ruta gives `faltante` |
| MAP-05 | 01-04/05 | ✓ SATISFIED | `{etiqueta,ruta,estado,confianza,valor_enmascarado,…}`, never a `valor` key |
| MAP-06 | 01-05 | ✓ SATISFIED | `mapeo.json` carries ruta, regla and confianza per field |
| MAP-07 | 01-04/05/07/08 | ✓ SATISFIED | hn "Ingresos anuales" carries "COP, año 2025". "País" carries its note |
| FORM-01 | 01-07 | ✓ SATISFIED | Multi-sheet xlsx with text cells and leading zeros |
| FORM-02 | 01-08 | ✓ SATISFIED | PDF in template order with visible marks |
| FORM-03 | 01-08 | ✓ SATISFIED | Portal ok:true, the notice and `valores-portal.md` |
| FORM-04 | 01-07/08 | ✓ SATISFIED | Strict rutas-only mapping. Values are re-read from the master |
| PAQ-01 | 01-09/10 | ✓ SATISFIED | `paquete/` contents and the `{ruta,listo_para_firma,checklist,…}` return (see WR-06) |
| PAQ-02 | 01-09 | ✓ SATISFIED | Checklist sections, the effective date and "vence en N días" |
| PAQ-03 | 01-09 | ✓ SATISFIED | Vencido or ausente blocks. A faltante does not block |
| PAQ-04 | 01-10 | ✓ SATISFIED | Reply to `solicitud.de` with "RE: …", allowlisted fields, no bank data |
| PAQ-05 | 01-03/09 | ✓ SATISFIED | Injected clock with America/Bogota as the default, overridden by FECHA_EJECUCION. ISO compare. null means no aplica |
| ENV-01 | 01-10 | ✓ SATISFIED | Exact error without confirmation. Only ENVIO-SIMULADO.md is written, with the bloqueos. Does not require `listo_para_firma` |
| SEG-02 | 01-05/11 | ✓ SATISFIED (Phase 1 scope); the API/SSE `redactar()` part is deferred | Code-owned `POLITICA_PII` with masking for tool outputs, `mapeo.json` and logs. Grep test with a positive control (see WR-09) |
| SEG-04 | 01-03/09/10 | ✓ SATISFIED | `{ts,herramienta,ok,resumen}` plus sesion and codigo in both logs (see the IN-05 edge) |
| DEMO-01 | 01-03/11 | ✓ SATISFIED | Verifier-run demo, deterministic |
| DEMO-02 | 01-11 | ✓ SATISFIED | Golden tests and the demo show the exact truth table |
| DEMO-04 | 01-06 | ✓ SATISFIED | `tests/fixtures/casos/zz-generica-co`, `zz-generica-ec`, `zz-plantilla-corrupta`. The unknown-case path is tested through `CASO_NO_ENCONTRADO` |
| CAL-01 | 01-01/11 | ✓ SATISFIED | strict, `noUncheckedIndexedAccess`, Biome `noExplicitAny=error`, check green |
| CAL-02 | 01-01 | ✓ SATISFIED | No-comment guard plus grep |
| CAL-03 | 01-02/03/04/05/06 | ✓ SATISFIED | `constantes.ts` plus zod-validated env and `reglas.json` |
| CAL-04 | 01-01/03/11 | ✓ SATISFIED | Architecture test on import direction; the Reloj port is the only port in Phase 1 |

All 33 phase IDs are claimed by at least one plan, so no requirement is orphaned. REQUIREMENTS.md marks all 33 as `[x]` Complete. MAP-01 should go back to pending until the gap is closed. SEG-02 should carry a note that its API and SSE part lands in Phases 2 and 3.

### Decision Coverage

The decision gate found all 36 trackable CONTEXT.md decisions honored by the shipped artifacts. It is non-blocking.

### Test Quality Audit

| Test File | Linked Req | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|---------|----------|-----------------|---------|
| `tests/golden/mapear-campos.test.ts` | MAP-01..07 | 0 | No (oracle is the PRD truth table plus hand-written masks) | Value | OK, but has no blank-value case (CR-01) |
| `tests/golden/formulario-xlsx.test.ts` / `formulario-pdf.test.ts` / `formulario-portal.test.ts` | FORM-01..04 | 0 | No | Value | OK |
| `tests/contract/generar-formulario.test.ts` | FORM-04, D-11 | 0 | No | Behavioral | OK |
| `tests/golden/paquete.test.ts` / `borrador-envio.test.ts` | PAQ-01..05, ENV-01 | 0 | No | Value / Behavioral | OK |
| `tests/e2e/pii.test.ts` | SEG-02 | 0 | No (has a positive control) | Value | Insufficient breadth: checks only 4 identifiers (WR-09). The verifier's broader manual scan was clean |
| `tests/e2e/determinismo.test.ts` / `demo.test.ts` | DEMO-01/02 | 0 | No | Behavioral | OK |
| `tests/architecture.test.ts` / `sin-comentarios.test.ts` | CAL-02/04, HERR-04 | 0 | No | Behavioral (with non-vacuity samples) | OK |

There are no disabled tests and no circular patterns. One test is insufficient in breadth (WR-09); that is a warning.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/domain/mapeo.ts` | 93 | A blank string leaf is returned as a value (CR-01) | 🛑 Blocker | Breaks the faltante guarantee (gap above) |
| `src/domain/mapeo.ts` / `src/infra/knowledge/reglas.ts` | 195-200 / 31-41 | RN1 state depends only on the numeric confidence in editable data (WR-03) | ⚠️ Warning | Reproduced: setting `regla_pais` to 0.9 in a copied `reglas.json` makes the ec RUC `lleno`. Shipped data is correct |
| `src/domain/mapeo.ts` | 93 | Boolean and array leaves become `faltante` "no existe en el maestro" (WR-02) | ⚠️ Warning | Conservative (never invents) but misreports existing data; plan 01-06 locks this as intended |
| `src/application/armar-paquete.ts` | 95-99 | Expired soporte copied into `paquete/` and listed in ENVIO-SIMULADO while the borrador says it will follow (WR-06) | ⚠️ Warning | Observed in the hn demo output. Plan 01-09 intends it ("expired ones included and marked vencido"); the cross-artifact inconsistency needs a human call |
| `src/tools/define-tool.ts` | 88-98 | ARGS_INVALIDOS with a valid `caso` is logged only globally (IN-05) | ⚠️ Warning | Observed: `confirmado: "true"` was missing from `out/<caso>/log.jsonl`. Weakens RN5 "toda ejecución" at the edge |
| `src/infra/salida/pdf/render.ts` | 13-17 | Non-WinAnsi characters silently become `?` in `lleno` values (WR-01) | ⚠️ Warning | Not hit by the fixtures; a signed PDF value could differ from the master with no mark |
| `src/application/generar-formulario.ts` / `src/infra/salida/archivos.ts` | 105-106 / 89-99 | A failed regeneration leaves a stale form (WR-07) | ⚠️ Warning | Edge path only |
| `src/infra/fixtures/esquemas.ts` | 35-47 | Sheet names and cells can crash or overwrite in the xlsx writer (WR-08) | ⚠️ Warning | Edge path only; surfaces as ERROR_INTERNO |
| `src/domain/checklist.ts` | 94-95 | First index entry per `tipo` wins (WR-05) | ⚠️ Warning | Edge path only |
| `tests/e2e/pii.test.ts` | 11 | Narrow PII pattern (WR-09) | ⚠️ Warning | Regression risk only; currently clean |

No TBD/FIXME/XXX debt markers, TODO/HACK/placeholder text, empty implementations or comments were found in src/, tests/ or demo.ts.

### Human Verification Required

These items should be checked once the gap is closed. They do not change the status, because gaps_found takes precedence.

#### 1. Visual look of the generated forms

**Test:** Open `out/co-industrias-delta/formulario.xlsx`, `out/hn-agroexport-sula/formulario.xlsx` and `out/ec-corp-andina/formulario.pdf` in Excel/Numbers and a PDF viewer.
**Expected:** The labels are readable and the values sit next to them. In hn, the red fill and note on B12 and the yellow fill and note on B3 are visible. In the PDF, the [FALTANTE] and [POR CONFIRMAR] marks stand out and long values wrap without overlapping.
**Why human:** A cell or text-stroke readback cannot judge visual quality.

#### 2. Tone and correctness of `borrador-correo.md`, `checklist.md` and `ENVIO-SIMULADO.md`

**Test:** Read the 4 borradores and checklists in `out/*/paquete/` and an `ENVIO-SIMULADO.md` produced after `simular_envio` with `confirmado: true`.
**Expected:** The Spanish reads as a professional reply from Periferia. The pending items read naturally. ENVIO-SIMULADO states clearly that nothing was sent.
**Why human:** Wording quality is a judgment call.

#### 3. Expired soporte inside the package (WR-06)

**Test:** Compare `out/hn-agroexport-sula/paquete/` (which contains `parafiscales-2026-07.txt`) with its `borrador-correo.md` ("parafiscales (vencido, enviaremos la versión actualizada)").
**Expected:** Decide whether expired soportes should stay in `paquete/` (current plan D-27/01-09) or be excluded so the package matches the email.
**Why human:** This is a product decision where the plan intent and the email semantics conflict.

### Gaps Summary

One gap, from one root cause, blocks a clean pass. `leerRuta` in `src/domain/mapeo.ts` treats an empty or whitespace-only master string as a real value. A field whose master key exists but is blank is therefore reported as `lleno` with full confidence. It is not marked in the xlsx or PDF, it is not listed under "Campos faltantes" in the checklist, it is not mentioned as pending in the borrador, and the package can be LISTO.

This is the review's CR-01, still open in `01-REVIEW-DISPOSITION.md`. The verifier reproduced it end to end through the exported tools. It contradicts the project's Core Value ("lo que no existe queda como `faltante`"), MAP-01 and PRD O2 ("Todo campo solicitado que no exista en el maestro queda listado en un reporte de faltantes").

The 4 delivered fixtures have no blank values, so the demo, the truth table and SC1-SC5 all hold today. The fix is a small, local change in `leerRuta` plus tests.

If you decide the guarantee only needs to hold for the delivered fixtures, you can accept the deviation explicitly. The verifier recommends fixing it instead:

```yaml
overrides:
  - must_have: "Un campo cuyo dato no existe en el maestro termina como faltante y aparece en el reporte de faltantes del checklist"
    reason: "{why blank master values are out of scope}"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

The 9 review warnings do not by themselves break any must-have. WR-02, WR-03, WR-06 and IN-05 were reproduced and touch the edges of MAP-03, PAQ-01 and SEG-04. They are good candidates for the same gap-closure plan. The verifier did not modify any source file. Running `demo.ts` regenerated `out/`.

---

_Verified: 2026-10-12T23:45:00Z_
_Verifier: Claude (gsd-verifier)_
