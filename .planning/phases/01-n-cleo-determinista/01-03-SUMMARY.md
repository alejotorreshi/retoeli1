---
phase: 01-n-cleo-determinista
plan: 03
subsystem: tools
tags: [realpath, bitacora, jsonl, reloj, env, zod, demo, tdd, cal-04]

requires:
  - phase: 01-02
    provides: "Locked tool contract v1, defineTool never-throw boundary, wiring, leer_solicitud tracer"
provides:
  - "Realpath-contained case resolution (resolverCaso) and D-14 case listing (listarCasos)"
  - "Entorno.casos {resolver, disponibles} and Entorno.reloj; fixture readers take the resolved case dir"
  - "Per-execution zod env (toolEnvSchema, parseToolEnv): FECHA_EJECUCION, TZ_NEGOCIO"
  - "Reloj port with relojSistema(tz) and relojFijo(fecha)"
  - "crearBitacora: one line in out/log.jsonl per execution, plus one in out/<caso>/log.jsonl when the caso resolved"
  - "defineTool logs every execution through the registrar handed over by wiring"
  - "ejecutarDemo + demo.ts: deterministic demo over the exported tool, no LLM key"
  - "crearProyectoTemporal test helper; whole trazador suite runs in temp projects"
  - "CAL-04 export-name and one-sentence description guard in tests/architecture.test.ts"
affects: [01-04, 01-05, 01-06, 01-07, 01-08, 01-09, 01-10, phase-02, phase-03, phase-04]

actuals:
  tokens: 12400
  tasks: 3
  commits: 5
plan_head_before: 3e9ef33246bae89b9f130c999fd07f899b598308
plan_head_after: 77f4057843c30318fcff14dcad71bca91bd50c5f

tech-stack:
  added: []
  patterns:
    - "crearEntorno(contexto) returns {registrar, entorno: Resultado<Entorno>}; env is parsed on every execute, never at import"
    - "defineTool: parse args -> ejecutar (internal throws become ERROR_INTERNO) -> resolve caso -> respond -> registrar"
    - "Log lines carry only the regex-valid caso, the codigo and the canonical resumen; raw args never reach a log"
    - "Tests that write never touch the repo: crearProyectoTemporal copies the fixtures to mkdtemp; symlinks and corrupt JSON are created at test time"

key-files:
  created:
    - src/infra/salida/rutas-seguras.ts
    - src/infra/reloj.ts
    - src/infra/bitacora.ts
    - src/config/env.ts
    - src/tools/issues.ts
    - src/demo/ejecutar-demo.ts
    - demo.ts
    - tests/helpers/proyecto-temporal.ts
    - tests/e2e/demo.test.ts
  modified:
    - src/application/puertos.ts
    - src/application/leer-solicitud.ts
    - src/infra/fixtures/lector.ts
    - src/tools/define-tool.ts
    - src/tools/wiring.ts
    - src/config/constantes.ts
    - tests/e2e/trazador.test.ts
    - tests/architecture.test.ts

key-decisions:
  - "crearEntorno returns {registrar, entorno: Resultado<Entorno>} so an invalid env (CONFIGURACION_INVALIDA) is still logged globally, using a system clock for ts"
  - "defineTool resolves the caso a second time after the use case to decide casoResuelto; resolution is cheap and the use case stays unaware of logging"
  - "listarCasos returns only real directories (Dirent.isDirectory), so symlinks in casos/ are never offered as cases"
  - "A case folder without solicitud.json also answers CASO_NO_ENCONTRADO with casos_disponibles (D-14 superset)"
  - "formatearIssues moved to src/tools/issues.ts, shared by defineTool (args, ctx) and wiring (env)"
  - "bitacora re-checks PATRON_CASO before using caso/casoResuelto in a path or a line (defense in depth)"

patterns-established:
  - "Every tool inherits containment, per-execution config, the clock and both logs through defineTool + wiring; no tool writes logs itself"
  - "Global log line {ts, herramienta, ok, resumen, sesion, caso?, codigo?}; per-caso line {ts, herramienta, ok, resumen, sesion, codigo?}"

requirements-completed: [HERR-03, HERR-04, HERR-05, SEG-04, PAQ-05, DEMO-01, CAL-03, CAL-04]

coverage:
  - id: D1
    description: "Realpath-contained case resolution: ../x, a/b, CO and a runtime symlink escaping casos/ give CASO_INVALIDO"
    requirement: HERR-04
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: casos con forma de recorrido"
        status: pass
    human_judgment: false
  - id: D2
    description: "caso \"\" and an unknown caso give CASO_NO_ENCONTRADO with the sorted casos_disponibles; no out/<caso> is created"
    requirement: HERR-03
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: listado de casos (D-14)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A copy of co with a corrupt plantilla-celdas.json gives PLANTILLA_INVALIDA with parcial pais CO, formato xlsx and 4 soportes (D-17)"
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: fixtures inválidos en un proyecto temporal"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both jsonl logs on every execution, sessionID logged as sesion, no raw arg values in any log"
    requirement: SEG-04
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: bitácora global y por caso"
        status: pass
    human_judgment: false
  - id: D5
    description: "Per-execution env: FECHA_EJECUCION \"\" is unset, impossible dates and unknown zones give CONFIGURACION_INVALIDA, and that failure is logged"
    requirement: CAL-03
    verification:
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#trazador: configuración por ejecución"
        status: pass
    human_judgment: false
  - id: D6
    description: "Injectable clock: relojFijo returns the fixed date, relojSistema returns YYYY-MM-DD in America/Bogota"
    requirement: PAQ-05
    verification:
      - kind: unit
        ref: "tests/e2e/trazador.test.ts#reloj inyectable"
        status: pass
    human_judgment: false
  - id: D7
    description: "bun run demo.ts runs without any LLM key, cleans out/, prints the effective date 2026-09-03 and one line per real case, never maestro values"
    requirement: DEMO-01
    verification:
      - kind: e2e
        ref: "tests/e2e/demo.test.ts#ejecutarDemo"
        status: pass
      - kind: other
        ref: "bun run demo.ts (exit 0, 4 cases)"
        status: pass
    human_judgment: false
  - id: D8
    description: "proveedor.ts exports only PRD tool names with one-sentence descriptions; the src/demo layer rule applies to real files"
    requirement: CAL-04
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts#superficie pública de herramientas (CAL-04)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 03: Full tracer surface Summary

**`proveedor_leer_solicitud` now resolves cases by realpath containment and lists real cases for an empty or unknown id (D-14). Config and the clock are parsed on every execution, and every call leaves a redacted line in `out/log.jsonl` (plus `out/<caso>/log.jsonl` when the caso resolved). `bun run demo.ts` runs the four real cases through the exported tool with no LLM key.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-10-12T22:03:06Z
- **Completed:** 2026-10-12T22:08:40Z
- **Tasks:** 3 (Tasks 1 and 2 were TDD with RED and GREEN commits; Task 3 was auto)
- **Files modified:** 17 (9 created, 8 modified)

## Accomplishments

- `resolverCaso(raiz, caso)` compares `realpath(casos/<caso>)` against `realpath(casos) + sep`. `ENOENT`/`ENOTDIR` mean not found, and any other failure or an escape means invalid. `listarCasos` returns sorted real directories that match `PATRON_CASO`.
- `leerSolicitud` now has its final order: empty caso (listing), regex, resolver, solicitud, soportes, template choice (D-17 parcial), data.
- `src/config/env.ts`: `FECHA_EJECUCION` is optional, `""` counts as unset, and it must be a real calendar date. `TZ_NEGOCIO` defaults to America/Bogota and is validated with `Intl.DateTimeFormat`. Errors use the Spanish zod locale. The config holds no secrets.
- `relojSistema(tz)` and `relojFijo(fecha)` sit behind the `Reloj` port. `ahora()` is the wall-clock ISO timestamp, used only for log `ts`.
- `crearBitacora` swallows its own IO errors and writes only `error.name` to stderr.
- `defineTool` logs every execution except an invalid ctx (no root). An invalid env is logged globally.
- `ejecutarDemo` refuses to run without `package.json`. It deletes only `<raiz>/out` with `node:fs` `rm` after a direct-child check. It sets `FECHA_EJECUCION=2026-09-03` before the first call, lists cases through `leer_solicitud({caso: ""})`, and prints counts only. A broken case prints its Spanish error and the loop continues. Sample output:
  ```
  Fecha de ejecución efectiva: 2026-09-03
  co-industrias-delta: formato xlsx, país CO, 17 campos, 4 soportes exigidos
  ec-corp-andina: formato pdf, país EC, 15 campos, 5 soportes exigidos
  hn-agroexport-sula: formato xlsx, país HN, 11 campos, 3 soportes exigidos
  pa-logistica-istmo: formato portal, país PA, 9 campos, 2 soportes exigidos
  ```
- At the end, `bun run check` exits 0, `bun test` gives 71 pass and 0 fail across 4 files, and `bun run demo.ts` exits 0 with 5 global log lines after two consecutive runs.

## Task Commits

1. **Task 1: realpath containment, D-14 listing, D-17 carrier in temp projects**
   - RED `1cd5cec` test(01-03): pruebas en rojo de resolución contenida y listado de casos
   - GREEN `67a642b` feat(01-03): resolución de casos contenida por realpath y listado D-14
2. **Task 2: per-execution env, injectable clock, both jsonl logs**
   - RED `bc013b7` test(01-03): pruebas en rojo de bitácora, configuración por ejecución y reloj
   - GREEN `560ebbf` feat(01-03): configuración por ejecución, reloj inyectable y bitácora en cada llamada
3. **Task 3: demo.ts driver and export-name guard:** `77f4057` feat(01-03): demo.ts sobre la herramienta exportada y guardián de nombres

No REFACTOR commits were needed. The static import of `reloj.ts` in the test file went into the Task 2 GREEN commit.

## TDD Gate Compliance

- **Task 1 RED:** `bun test tests/e2e/trazador.test.ts --reporter=junit` exited 1 with 33 tests, 30 passing and 3 failing. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` for the target `"no-existe" da CASO_NO_ENCONTRADO con los casos disponibles`.
  - **Semantic assessment:** all 3 failures are assertion failures on the planned behavior. `parcial` was undefined (no listing), `""` gave CASO_INVALIDO instead of CASO_NO_ENCONTRADO, and the symlink gave CASO_NO_ENCONTRADO instead of CASO_INVALIDO.
  - The zz-plantilla-rota test already passed, because 01-02 had delivered the D-17 carrier. That is expected and not a RED target.
- **Task 2 RED:** the same command exited 1 with 45 tests, 35 passing and 10 failing. The verdict was `RED_EVIDENCE_OK` for the target `una llamada a co agrega una línea a cada log...`.
  - **Semantic assessment:** 8 failures are assertion failures on missing logs and missing env validation.
  - The 2 clock tests failed inside the test body on a dynamic import of the not-yet-existing `src/infra/reloj.ts`. That is the absent feature, not a collection fault, and the rest of the file ran.
- **GREEN:** Task 1 ended at 33/33 and Task 2 at 45/45. Both gates are present in git (`test(01-03)` precedes each `feat(01-03)`).

## Files Created/Modified

- `src/infra/salida/rutas-seguras.ts`: `resolverCaso`, `listarCasos`, `rutaRelativa`, `directorioSalidaCaso`
- `src/infra/reloj.ts`, `src/infra/bitacora.ts`: the clock and the append-only logs
- `src/config/env.ts`: `toolEnvSchema`, `ToolEnv`, `parseToolEnv`
- `src/tools/issues.ts`: the shared zod issue formatter
- `src/application/puertos.ts`: `ResolucionCaso`, `CasosDisponibles`, `Reloj`, `EntradaBitacora`, `Registrar`; Entorno gains `reloj` and `casos`
- `src/application/leer-solicitud.ts`: the final order with the D-14 listing
- `src/infra/fixtures/lector.ts`: `rutaArchivoCaso` was replaced by `rutaEnCaso(directorioCaso, archivo)`
- `src/tools/wiring.ts`, `src/tools/define-tool.ts`: per-execution env, clock and registrar; every execution is logged
- `src/config/constantes.ts`: `SESION_DEMO`
- `src/demo/ejecutar-demo.ts`, `demo.ts`: the demo driver
- `tests/helpers/proyecto-temporal.ts`, `tests/e2e/trazador.test.ts`, `tests/e2e/demo.test.ts`, `tests/architecture.test.ts`

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Shared issue formatter**
- **Found during:** Task 2
- **Issue:** `wiring.ts` must return CONFIGURACION_INVALIDA with a detail, but `formatearIssues` was private to `define-tool.ts`, and wiring already imports from define-tool. Duplicating it would have broken the "no scattered logic" rule.
- **Fix:** It moved to the new `src/tools/issues.ts`, and both modules import it.
- **Files modified:** src/tools/issues.ts, src/tools/define-tool.ts, src/tools/wiring.ts
- **Commit:** 560ebbf

**2. [Rule 2 - Missing critical] crearEntorno also returns the registrar when env is invalid**
- **Found during:** Task 2
- **Issue:** The must_have says "every execution appends one line to out/log.jsonl", but a config failure has no Entorno, and so no clock.
- **Fix:** `crearEntorno` returns `{registrar, entorno: Resultado<Entorno>}`. On an invalid env the registrar uses `relojSistema(ZONA_HORARIA_POR_DEFECTO)` (only `ahora()` is needed), so CONFIGURACION_INVALIDA is logged globally. The test is "la configuración inválida también queda en el log global".
- **Files modified:** src/tools/wiring.ts, src/tools/define-tool.ts
- **Commit:** 560ebbf

**3. [Rule 2 - Missing critical] An internal throw keeps its log line**
- **Found during:** Task 2
- **Issue:** With the 01-02 structure, a throw inside `ejecutar` skipped any logging.
- **Fix:** `ejecutarProtegido` catches around `spec.ejecutar`, so the ERROR_INTERNO execution is still logged with its caso. The outer try/catch stays as the last firewall.
- **Files modified:** src/tools/define-tool.ts
- **Commit:** 560ebbf

**4. [Rule 2 - Missing critical] Demo test in a temp project**
- **Found during:** Task 3
- **Issue:** The plan verifies the demo only with `bun run demo.ts`. The cleanup threat (T-01-06) and "a failed case continues" had no automated test.
- **Fix:** I added `tests/e2e/demo.test.ts`. It checks that the demo cleans out/, prints the date and the 4 cases, never prints maestro values, refuses to run without package.json (without deleting anything), and continues past a broken case with a Spanish error.
- **Files modified:** tests/e2e/demo.test.ts
- **Commit:** 77f4057

**5. [Rule 1 - Bug] Repo out/ assertion**
- **Found during:** Task 1
- **Issue:** The 01-02 test asserted that the repo `out/` does not exist, which becomes false as soon as `bun run demo.ts` runs.
- **Fix:** The test now asserts that a tool call never changes the repo's `out/log.jsonl`, and every call runs in a temp project.
- **Files modified:** tests/e2e/trazador.test.ts
- **Commit:** 1cd5cec

---

**Total deviations:** 5 auto-fixed (1 blocking, 3 missing critical, 1 bug).
**Impact:** Internal structure and tests only. The public tool contract (option-a) is unchanged.

**Process note:** all commits went to `main`. `git.base-branch --is-protected main` reports `true`, but the project runs `branching_strategy: none`, plans 01-01 and 01-02 committed on `main`, and the orchestrator dispatched this plan sequentially on the main working tree.

## Known Stubs

- `ejecutarDemo` prints one line per case with formato, país, campos and soportes counts. The D-24 per-case block (lleno, faltante and por confirmar counts, LISTO or BLOQUEADO) and the summary table come with the later tools: mapear_campos, generar_formulario and armar_paquete (plans 01-05 to 01-10). This is intentional and matches this plan's Task 3 scope.
- `rutaRelativa` is exported but not used yet. Later plans that report output paths will use it.

## Threat Flags

None. All new surface (case resolution, log writes, demo cleanup) is in the plan's threat register, and its mitigations are tested.

## Issues Encountered

None.

## User Setup Required

None. The demo needs no key.

## Next Phase Readiness

- Later tools get containment, per-execution config, `entorno.reloj` and both logs for free through `defineTool` and `crearEntorno`. Output writers should use `directorioSalidaCaso` and the `ARCHIVOS_SALIDA` allowlist.
- Plan 01-10 tightens the CAL-04 guard to exactly five exports.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-12*

## Self-Check: PASSED

- All 9 created key files exist on disk.
- Commits 1cd5cec, 67a642b, bc013b7, 560ebbf and 77f4057 are ancestors of HEAD.
- `bun run check` exits 0, `bun test` gives 71 pass and 0 fail, and `bun run demo.ts` exits 0 and prints the effective date and the 4 cases.
