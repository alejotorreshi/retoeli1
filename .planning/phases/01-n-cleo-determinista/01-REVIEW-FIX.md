---
phase: 01-n-cleo-determinista
fixed_at: 2026-10-13T01:12:19Z
review_path: .planning/phases/01-n-cleo-determinista/01-REVIEW.md
iteration: 1
findings_in_scope: 18
fixed: 18
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-10-13T01:12:19Z
**Source review:** .planning/phases/01-n-cleo-determinista/01-REVIEW.md (conventions and clarity, WR-10..WR-20, IN-13..IN-19)
**Iteration:** 1
**Scope:** all (warnings and info)

**Summary:**
- Findings in scope: 18
- Fixed: 18 (WR-17 is flagged `fixed: requires human verification` because it changes visible output)
- Skipped: 0
- Commits: 45, from `db3ff13` to `bfdedd5`. They follow the review's eight-step migration order, and each one is an atomic Conventional Commit.
- The 12 proposed guards (G1–G12) are in `tests/architecture.test.ts`. Each guard has a test that shows it catches a violation. Biome now also enforces `style/noEnum` and `style/useFilenamingConvention` (kebab-case, ASCII).
- `.claude/CLAUDE.md` "Reglas de código del proyecto" records the new conventions, with the user's explicit authorization. No other section changed.

## Verification

**Where verification ran.** The per-commit gates ran in an isolated git worktree, `.claude/worktrees/rf-01-15658-*`. It had no `node_modules` of its own and resolved the main checkout's through the parent directories. The final gates ran again in the **main checkout** after the fast-forward, so the numbers below can be reproduced from `main` at `bfdedd5`. The worktree, its temp branch and the recovery sentinel were removed.

Each commit was checked with `bun run check` (tsc, Biome with zero warnings, `bun audit`), `bun test`, two `bun run demo.ts` runs compared byte for byte against each other and against the pre-fix baseline, a diff of `out/` (xlsx compared by unzipped XML, `log.jsonl` excluded), and a snapshot of the tool contract (description plus `z.toJSONSchema` of every tool's args).

Final run in the main checkout:
- `bun run check`: green. `bun audit` found no vulnerabilities.
- `bun test`: 436 pass, 0 fail, 31 files. Baseline before the fixes: 404.
- `bun run demo.ts` twice: byte-identical. stdout is also byte-identical to the pre-fix baseline.
- Truth table unchanged:

  | Case | Llenos / Faltantes / Por confirmar | State |
  |---|---|---|
  | co | 17 / 0 / 0 | LISTO |
  | ec | 13 / 1 / 1 | BLOQUEADO |
  | hn | 9 / 1 / 1 | BLOQUEADO |
  | pa | 8 / 0 / 1 | LISTO |

- `out/`: identical through step 7. Only WR-17 changed the four `paquete/checklist.md` files.
- Tool contract: identical through step 7. WR-18 changed exactly four arg `description` strings (`mapear_campos` became `proveedor_mapear_campos`). The five export names, the tool descriptions, the shapes and the JSON Schemas are otherwise unchanged.
- No comments anywhere (the guard enforces this), no `any`, and `reto-01/` was not touched.

## Fixed Issues

### WR-10: Exported types live in logic files (rule 1)

**Files modified:**
- new `src/domain/types/*.type.ts` (16 files)
- new `src/application/types/*.type.ts`; `puertos.ts` moved there with `git mv`
- new `src/infra/types/{pdf-layout,fs}.type.ts`
- new `src/tools/types/{herramienta,entorno}.type.ts`
- new `src/demo/types/demo.type.ts`
- new `tests/helpers/types/*.type.ts`
- deleted `src/domain/{errores,reglas,tipos}.ts`
- every importer of the moved types

**Commits:** `02efc54`, `7dc8b5e`, `367aa10`, `f033635`, `ba6585a`; guards G3 and G4 in `ba91dd7`

**Applied fix:**
- Every exported type now lives in a type-only `types/<name>.type.ts` file of its own layer. Those files contain only `type` declarations and `import type` lines.
- Code and state unions derive from their constant objects through `ValorDe<typeof X>`, defined in `src/config/types/valor-de.type.ts`.
- `ValorMaestro` moved to `domain/types/maestro.type.ts`, and `Maestro = Readonly<Record<string, ValorMaestro>>`.
- The solicitud, maestro and glosario schemas now also check against their domain types with `satisfies z.ZodType<T>`.
- `OpcionesHerramientas`, a pure alias of `OpcionesEntorno`, was removed.
- `ToolEnv` stays next to its schema in `config/env.ts`, which is the only file on the G3 allowlist.

### WR-11: Magic strings for codes and states, and enums built from arrays instead of `as const` objects (rule 2)

**Files modified:** `src/config/constants/*.constants.ts`, plus every domain, application, infra, tools and demo file that compared or assigned a code literal.

**Commits:** `944719b`, `3a74e6e`, `7bfb1cf`, `6d81247`, `33a4275`, `c162f70`, `1077a50`, `74f975b`, `e63470e`; guards G6, G7 and G11 in `24f9425`

**Applied fix:**
- One commit per family, in the review's order. Each family is now an `as const` object:
  - `CODIGO_ERROR`, `ESTADO_CAMPO`
  - `FORMATO`, `TIPO_PLANTILLA`
  - `ESTADO_SOPORTE`, `ESTADO_VIGENCIA`
  - `ESTADO_LECTURA`, `ORIGEN_COPIA`
  - `REGLA_MAPEO`, `TIPO_HOJA_MAESTRO`, `APLICA_NOTA`, `VARIABLE_NOTA`, `NOMBRE_TEXTO_REGLA`
  - `ARCHIVOS_SALIDA`, `ARCHIVOS_PAQUETE`, `CLAVE_PLANTILLA`
  - `HERRAMIENTA`
  - `TIPO_MASCARA`, `COLOR_TRAZO`, `CODIGO_FS`
- Every comparison, assignment, `case`, discriminant and `fallo(...)` uses the object.
- zod uses `z.enum(OBJ)`. The JSON Schema it produces is identical.
- The rules schema builds its `confianza` and `plantillas` keys from `REGLA_MAPEO` and `CLAVE_PLANTILLA`.
- `Lectura` and `ResolucionCaso` share one `LecturaFallida` union.
- Biome `style/noEnum` is on.

**Deviation:** the schema keys and the `contarEstados` initializer use computed keys plus `satisfies Record<Union, …>` instead of `Object.fromEntries`. Both prevent key drift, but this way also keeps the exact types without a cast.

### WR-12: File names do not encode their role, and roles are not separated by folder (rule 3)

**Files modified:** every move in the review's rename table, done with `git mv` and specifier-only diffs. Untouched, as the PRD requires: `demo.ts`, `src/tools/proveedor.ts`, `src/knowledge/**` and the `*.test.ts` files.

**Commits:** `ce19276` (domain), `10a573f` (application), `073f1d8` (infra), `100cc06` (tools), `71b2084` (demo and test helpers); guard G5 in `093d492`

**Applied fix:**
- **Application:**
  - The use cases moved to `application/use-cases/*.use-case.ts`.
  - The case-context loader moved to `services/contexto-caso.service.ts`.
  - New `services/mapeo-canonico.service.ts` and `services/estado-paquete.service.ts`.
- **Infra:** files now carry English `*.adapter.ts` / `*.util.ts` names under `clock/`, `fixtures/`, `fs/`, `knowledge/`, `logging/` and `output/`.
  - `rutas-seguras` was split into `fixtures/case-resolver.adapter.ts` and `fs/safe-paths.util.ts`.
  - The rules schema moved to `knowledge/schemas/rules.schema.ts`.
  - The fixture schemas moved to `fixtures/schemas/fixtures.schema.ts`.
- **Tools:**
  - `schemas/argumentos.schema.ts`
  - `definir-herramienta.factory.ts`
  - `herramientas.factory.ts`
  - `entorno.wiring.ts`
- **Demo and tests:**
  - `demo/ejecutar-demo.runner.ts`
  - `tests/helpers/*.helper.ts`
- **Guard:** the composition-root special case in `capaDeRuta` follows `src/tools/entorno.wiring`. G5 checks every file against the suffix table, forbids role suffixes in domain modules, and requires each use case to export exactly one function.
- **Knowledge directory:** `DEFAULT_KNOWLEDGE_DIRECTORY` stays in `src/infra/knowledge/`, so its `new URL("../../knowledge/")` is still correct. The demo e2e test confirms it.

### WR-13: One `constantes.ts` for everything, plus about 40 scattered constants (rule 4)

**Files modified:** `src/config/constants/{files,limits,patterns,errors,mapping,maestro,forms,supports,pii,io,knowledge,tools,runtime,demo,xlsx,pdf}.constants.ts`. `src/config/constantes.ts` was deleted.

**Commits:** `06937ac` (verbatim split); the per-family commits listed under WR-11; `808baad` (the remaining scattered constants)

**Applied fix:**
- The split follows the review's table.
- Scattered constants and regexes moved into their scope files:
  - `PATRON_*` regexes, including one `PATRON_ESPACIOS` shared by normalizar, pii and the PDF layout
  - `SANGRIA_JSON`
  - `RELLENO_XLSX`, `FORMATO_CELDA_TEXTO` and the column arithmetic
  - `VIGENCIA_SIN_VENCIMIENTO`, `MILISEGUNDOS_POR_DIA`
  - `LARGO_VISIBLE` and the PII route lists
  - `ARCHIVO_PROYECTO`, `GRUPOS_MAPEO`
- One `LOCALE_INTL` now replaces the `en-CA`/`en-US` pair.
- **Judgment call:** as the reviewer recommended, the mustache grammar regexes stay private to `src/domain/motor-plantillas.ts`, which is on G11's allowlist.

### WR-14: User-facing text is hardcoded in 22 files, with copies of the same sentence (rule 5)

**Files modified:** new `src/config/strings.ts`, plus every file that held text.

**Commits:** `7be56c8`, `0f22a4d`, `5af8836`, `7b95dfa`, `1668551`, `3fd4b16` (one per area); guard G8 in `772abb6`

**Applied fix:**
- **Groups:** `strings.ts` is the single source, made of pure `as const` groups:
  - `MENSAJE_ERROR` and `TEXTO_ERROR`
  - `TEXTO_COMUN`, `TEXTO_PDF`, `TEXTO_XLSX`
  - `TEXTO_CHECKLIST`, `TEXTO_BORRADOR`, `TEXTO_PORTAL`, `TEXTO_VIGENCIA`
  - `TEXTO_MAPEO`, `TEXTO_MASCARA`, `TEXTO_COMPARACION`, `TEXTO_MOTOR_PLANTILLAS`
  - `DESCRIPCION_HERRAMIENTA`, `DESCRIPCION_ARG`, `RESUMEN_HERRAMIENTA`
  - `TEXTO_ENV`, `TEXTO_CONOCIMIENTO`, `TEXTO_INFRA`
  - `TEXTO_DEMO`

  Interpolated messages are small pure functions.
- **Derived texts:**
  - "64 caracteres" now comes from `LONGITUD_MAXIMA_CASO`.
  - "out/" comes from `OUT_DIR`.
  - "ENVIO-SIMULADO.md" comes from `ARCHIVOS_SALIDA`.
  - "package.json" comes from `ARCHIVO_PROYECTO`.
- **Duplicates written once:** "confirmar con el cliente", "no existe en el maestro", "—", ". ", "(raíz)", the out/ escape message and "no existe, no es un archivo…".
- **Unchanged:** `CONFIRMACION_REQUERIDA` keeps the PRD literal "requiere confirmación explícita", and `src/knowledge/plantillas/*.md` stays in place.
- **Safety net:** the goldens and the tool-contract snapshot stayed byte-identical through every area.

### WR-15: Config is not split into pure and env parts, and layering workarounds follow from that (rule 6)

**Files modified:**
- `src/config/env.ts` (adds `readToolEnv` and `pinExecutionDate`)
- new `src/domain/fecha.ts`
- `src/application/types/puertos.type.ts`
- `src/application/services/contexto-caso.service.ts`
- `src/tools/entorno.wiring.ts`
- `src/demo/ejecutar-demo.runner.ts`
- `tests/architecture.test.ts`

**Commit:** `06937ac`, which includes G9 and G10

**Applied fix:**
- **New layers in the guard:**
  - `config-pure` is `config/constants/**`, `config/types/**` and `strings.ts`, and it may import only `config-pure`.
  - `config-env` is `env.ts`.
  - `tests` may import anything. `src` can never import `@tests/`.
- **Matrix:** the review's `PERMITIDOS` matrix is in place.
- **`esFechaReal`:** moved to `domain/fecha.ts`.
- **Reading the environment:**
  - `env.ts` is now the only reader of `process.env`. It exposes `readToolEnv()`, and the demo's FECHA pin goes through `pinExecutionDate()`.
  - G10 needs no allowlist beyond `env.ts`.
- **`Entorno.patronCaso` removed:** the application imports `PATRON_CASO` directly, and the demo uses `CODIGO_ERROR` and the shared texts.

**Deviation:** `config-env` may also import `domain`, because `env.ts` validates dates with the pure `esFechaReal`. That dependency still points inward.

### WR-16: 227 relative parent imports; adopt one `@/*` alias (rule 7)

**Files modified:** `tsconfig.json` (`paths` with `@/*` and `@tests/*`, no `baseUrl`), every `src/`, `tests/` and `demo.ts` file, and `tests/architecture.test.ts`.

**Commit:** `db3ff13`, which includes G1 and G2

**Applied fix:**
- Every relative specifier is now `@/` or `@tests/`, including the `./` imports, the dynamic `import()` calls and the `bun -e` sample in `trazador.test.ts`.
- `capaDeDestino` and `dependenciasLocales` share one alias-aware `rutaLocal`, so the cycle detector still sees every edge.
- New bite tests cover an aliased two-file cycle (G2) and relative static, re-export and dynamic imports (G1).
- Checked that aliases resolve from another cwd (`bun run /abs/demo.ts` from `/`) and in `bun -e`.

**Deployment note:** no `Dockerfile` or `SOLUCION.md` exists yet. The requirement to `COPY tsconfig.json`, and to build a distributable module with `bun build`, is recorded as a rule in CLAUDE.md.

### WR-17: The checklist column "País emisor" shows the issuer warning, never the country

**Files modified:**
- `src/domain/types/checklist.type.ts`
- `src/domain/checklist.ts`
- `src/knowledge/plantillas/checklist.md`
- `tests/golden/paquete.test.ts`
- `tests/unit/vigencias.test.ts`

**Commit:** `e1ef6df`

**Status:** fixed: requires human verification

**Applied fix:**
- `SoporteEvaluado` now carries `pais_emisor`, filled from the support index. It is `null` when the support is missing.
- The checklist row exposes `pais_emisor` and `aviso_emisor`, and `checklist.md` renders them as two columns, "País emisor" and "Aviso de emisor".
- New golden assertions pin the co row (`| CO | — |`), the hn row (`| CO | Emitido en CO: … |`) and the ec missing-support row.
- **Output impact:** only the four `out/*/paquete/checklist.md` files change. The demo stdout and the truth table do not.
- **Additive change in the tool response:** `armar_paquete` `data.checklist.soportes[]` gains the `pais_emisor` field. Please review the new checklist table in `out/hn-agroexport-sula/paquete/checklist.md`.

### WR-18: Model-facing text names the tools inconsistently (`generar_formulario` vs `proveedor_mapear_campos`)

**Files modified:** `src/config/strings.ts`, `tests/contract/generar-formulario.test.ts`, `tests/contract/simular-envio.test.ts`, `tests/golden/paquete.test.ts`.

**Commits:** `5659a43`; guard G12 in `3c3b0e3`

**Applied fix:**
- Every tool reference in `strings.ts` is built as `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.X}`.
- `MAPEO_INCONSISTENTE`, `FORMULARIO_NO_GENERADO`, `PAQUETE_NO_ARMADO` and the four mapping arg descriptions now say `proveedor_mapear_campos`, `proveedor_generar_formulario` and `proveedor_armar_paquete`.
- The contract tests now assert the full prefixed messages.
- G12 scans both the source lines of `strings.ts` and every string it exports.
- The demo output and the truth table are unchanged.

**Out of scope, not changed:** the failure `resumen` ("generar_formulario: CODE") still uses the bare export name. It is built by the factory, not taken from `strings.ts`, and the contract tests pin it. This is a possible follow-up.

### WR-19: Path-containment and FS-error helpers are duplicated across infra, with diverging semantics

**Files modified:**
- `src/infra/fs/safe-paths.util.ts`
- new `src/infra/fs/fs.util.ts`
- `src/infra/output/{output-files,package-copy}.adapter.ts`
- `src/infra/fixtures/{case-resolver,fixtures-reader}.adapter.ts`
- `src/infra/knowledge/rules-loader.adapter.ts`
- `src/config/constants/io.constants.ts`
- `tests/unit/salida.test.ts`

**Commit:** `37c2023`

**Applied fix:**
- **One containment module.** `safe-paths.util.ts` owns:
  - `isInside`
  - `ensureRealCaseDirectory` (mkdir plus containment)
  - `realCaseDirectory`
  - `existingRealCaseDirectory`
  - `realPackageDirectory`
- **One fs helper module.** `fs.util.ts` owns `isNotFound`, `parseJson`, `readBoundedText` and `readText`. `isNotFound` treats ENOENT and ENOTDIR the same everywhere, which closes the ENOENT-only drift in the cleanup path.
- `LECTURA_NO_ENCONTRADA` and `LECTURA_INVALIDA` are shared constants.
- The existing traversal tests pass unchanged, and a new test pins the `isNotFound` semantics.

### WR-20: Infra and tools naming language contradicts CLAUDE.md

**Files modified:** the infra file moves in `073f1d8`, plus the exported infra, env and tools identifiers and their importers.

**Commits:** `073f1d8` (files), `c4a5fb2` (identifiers)

**Applied fix:**
- **Infra (English):** file names and exported identifiers are now English, for example `writeOutputFile`, `readValidatedJson`, `resolveCase`, `createAuditLog`, `systemClock`, `rulesSchema`, `PdfLine` and `DEFAULT_KNOWLEDGE_DIRECTORY`.
- **`env.ts` (English):** uses `EnvSource`, `emptyAsUndefined` and `isTimeZone`.
- **Tools (Spanish):** read in Spanish, for example `definirHerramienta`, `herramientas.factory.ts` and `entorno.wiring.ts`.
- **Unchanged on purpose:** domain type names in infra signatures and the application port members stay Spanish.
- **Scope:** as the review prescribed, only exported infra identifiers were renamed. Module-private helpers inside infra files keep their names.
- **CLAUDE.md:** the language rule now states this split explicitly.

### IN-13: Exported constants are re-hardcoded instead of imported, and summary phrases are duplicated

**Files modified:** `src/config/strings.ts`, `src/tools/herramientas.factory.ts`, `src/tools/definir-herramienta.factory.ts`, `src/demo/ejecutar-demo.runner.ts`.

**Commits:** `7b95dfa`, `3fd4b16`, `cd8d459`

**Applied fix:**
- LISTO/BLOQUEADO and "BLOQUEADO (…)" now come from `TEXTO_CHECKLIST` in the tool summaries and in the demo.
- The counts phrase is one `conteo()` helper.
- `responderFallo` returns the `{ texto, resumen }` pair, and the summary text comes from one `RESUMEN_HERRAMIENTA.fallo`.

**Deviation:** the demo's "Campos: X llenos · Y faltantes · Z por confirmar" line uses "·" as its separator, not ",", so it stays its own `TEXTO_DEMO.campos`. Sharing the helper would change the demo stdout, which had to stay byte-identical.

### IN-14: Small helper duplicates

**Files modified:**
- new `src/domain/nombre-error.ts`
- new `src/domain/formatear-issues.ts` (moved from `tools/formatear-issues.util.ts`)
- new `src/domain/types/validacion.type.ts`
- `src/domain/motor-plantillas.ts`
- `src/infra/knowledge/{rules,template}-loader.adapter.ts`
- `src/infra/logging/audit-log.adapter.ts`
- `src/tools/*`
- `src/config/constants/limits.constants.ts`

**Commits:** `37c2023` (`parsearJson`/`leerTexto`), `e56143b`

**Applied fix:**
- **`nombreDeError`:** one copy, in the domain.
- **`formatearIssues`:** one copy, in the domain. It works over a structural `IssueDeValidacion` type and takes an explicit cap: the tools pass `MAX_ISSUES_ARGS`, and the rules loader passes `MAX_ISSUES_REGLAS = 1`, so its output stays identical.
- **`plantillaInvalida`:** one, exported by the template engine and reused by the template loader.
- **`parseJson` and `readText`:** live in `fs.util.ts`.

### IN-15: Port fields and exports with no consumer

**Files modified:** `src/application/types/puertos.type.ts`, `src/tools/entorno.wiring.ts`, `src/config/env.ts`, `src/domain/borrador.ts`.

**Commits:** `06937ac` (`patronCaso`), `c849f54`

**Applied fix:**
- `Entorno.raiz` and `Entorno.patronCaso` were removed.
- `toolEnvSchema`, `parseToolEnv` and `asuntoRespuesta` are now module-private.
- The rest of the listed dead exports disappeared when they moved into `constants`/`strings`: `CODIGOS_ERROR`, `REGLAS_MAPEO`, `ESTADO_LISTO`, `ESTADO_BLOQUEADO`, `NOTA_POR_CONFIRMAR`, `PREFIJO_RESPUESTA`, `TEXTO_PENDIENTE_VENCIDO` and `TEXTO_SIN_VIGENCIA`.
- `esquemaReglas` (now `rulesSchema`) and `LONGITUD_MAXIMA_SESION` stay exported because they now have consumers in other files.

### IN-16: Overloaded names: "plantilla" means three things, "reglas" two

**Files modified:**
- `src/domain/motor-plantillas.ts` (renamed)
- `src/domain/types/plantilla-caso.type.ts`
- `src/application/types/puertos.type.ts`
- `src/application/**`
- `src/tools/entorno.wiring.ts`
- the infra `template-loader`/`rules-loader` adapters

**Commits:** `ce19276`, `073f1d8`, `9f78653`

**Applied fix:**
- **Renderer:** now `motor-plantillas.ts`.
- **Form template:**
  - The type is `PlantillaCaso`.
  - The fixtures port uses `existePlantillaCaso` and `leerPlantillaCaso`.
- **Knowledge templates:** hang off `Entorno.conocimiento`.
- **Infra loaders:** `template-loader.adapter.ts` and `rules-loader.adapter.ts`.
- **"reglas":** `domain/reglas.ts` is gone. Its types live in `domain/types/reglas.type.ts`, and its constants are in `mapping.constants.ts`.

### IN-17: Function shape and naming

**Files modified:**
- `src/domain/checklist.ts`
- `src/application/use-cases/generar-formulario.use-case.ts`
- `src/tools/definir-herramienta.factory.ts`
- `src/domain/{mapeo,maestro,glosario}.ts`
- `src/tools/entorno.wiring.ts`
- `src/domain/motor-plantillas.ts`
- `src/domain/borrador.ts`
- new `docs/plantillas.md`
- `tests/unit/vigencias.test.ts`

**Commits:** `cd8d459`, `9f78653`, `8a35a4f`, `05c7b1b`, `9963b44`

**Applied fix:**
- **Parameter objects:** `EntradaEvaluacionSoportes` (for `evaluarSoportes`/`evaluarSoporte`) and `CierreFormulario` (for `cerrar`).
- **Tool factory:**
  - The `definirHerramienta` closures became module functions over a `HerramientaInterna` bundle.
  - `Desenlace`/`desenlazar` became `ResultadoEjecucion`/`ejecutarConCaso`.
- **`mapeo.ts` split three ways:** `maestro.ts` (reading the master), `glosario.ts` (the index) and `mapeo.ts` (mapping).
- **Verb pattern:** the domain mapper is now `mapearEtiquetas`, so the use case can be `mapearCampos`.
- **Wiring:** the two identical template-reader branches collapsed into one helper.
- **Section-as-boolean:** `hay_pendientes` uses `seccionSi(condicion)` with a `SeccionCondicional` type, and the idiom is documented in the new `docs/plantillas.md`.

### IN-18: Use cases import other use cases

**Files modified:** `src/application/services/{mapeo-canonico,estado-paquete}.service.ts`, `src/application/use-cases/*`, `src/application/types/mapeo-canonico.type.ts`.

**Commit:** `10a573f`

**Applied fix:**
- `mapeoCanonico`/`escribirMapeo` (with `DocumentoMapeo`) and `evaluarEstadoPaquete` were extracted into services.
- No use case imports another use case, and each `*.use-case.ts` exports exactly one function (G5 checks this).

### IN-19: `ARCHIVOS_SALIDA` mixes names and `paquete/` paths, and the write whitelist is wider than its callers

**Files modified:** `src/config/constants/files.constants.ts`, `src/application/**`, `src/infra/output/*`, `src/infra/logging/audit-log.adapter.ts`, `src/tools/entorno.wiring.ts`, `tests/unit/salida.test.ts`.

**Commit:** `1077a50`

**Applied fix:**
- **Constants split:**
  - `ARCHIVOS_SALIDA` now holds only the writable files at the case root.
  - `ARCHIVOS_PAQUETE` holds the files written under `DIRECTORIO_PAQUETE`.
  - `ARCHIVO_FORMULARIO` maps each format to its form file.
  - `ARCHIVO_BITACORA` is its own constant.
- **Port:**
  - The port identifiers are the file names themselves, typed from those objects.
  - The port gains `escribirEnPaquete`/`existeEnPaquete` and loses `nombre()`.
- **Whitelist:** derived only from the writable files. New tests show that `"paquete"` and `"log.jsonl"` are rejected.

**Deviation:** the review placed this in step 7. It landed together with the WR-11 output-file family, because converting the same keys twice would have meant churning the port twice.

## Guards added (tests/architecture.test.ts)

| Guard | Rule | Commit |
|---|---|---|
| G1 | No relative specifiers (static, re-export, dynamic) in `src/`, `tests/` or `demo.ts` | `db3ff13` |
| G2 | `@/` and `@tests/` resolution for the layer check and the cycle detector (aliased-cycle bite test) | `db3ff13` |
| G3 | Exported types only in `types/*.type.ts` (`ToolEnv` allowlisted) | `ba91dd7` |
| G4 | Type files are type-only, with `import type` only | `ba91dd7` |
| G5 | Suffix table per folder, kebab-case, no suffix in domain, one function per use case (plus Biome `useFilenamingConvention`) | `093d492` |
| G6 | No code-family literals in comparisons, `case`, discriminants or `fallo("…")`, with the set built from the constant objects | `24f9425` |
| G7 | No TS `enum` (Biome `noEnum` plus a scan) | `24f9425` |
| G8 | Human-readable text only in `strings.ts`, including literals nested in `${…}` | `772abb6` |
| G9 | `config-pure` purity: no env, `node:`, `Bun`, `import.meta` or zod | `06937ac` |
| G10 | Env reads only in `config/env.ts` | `06937ac` |
| G11 | Regex literals and `new RegExp` only in `patterns.constants.ts` (template engine allowlisted) | `24f9425` |
| G12 | Tool names in `strings.ts` always carry `proveedor_` | `3c3b0e3` |

---

_Fixed: 2026-10-13T01:12:19Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
