---
phase: 01-n-cleo-determinista
reviewed: 2026-10-13T00:26:56Z
depth: deep
review_kind: conventions-and-clarity
supersedes: "previous 01-REVIEW.md (bug review, 22 findings, all dispositioned; preserved in git)"
files_reviewed: 91
files_reviewed_list:
  - biome.json
  - demo.ts
  - package.json
  - src/application/armar-paquete.ts
  - src/application/contexto-caso.ts
  - src/application/generar-formulario.ts
  - src/application/leer-solicitud.ts
  - src/application/mapear-campos.ts
  - src/application/puertos.ts
  - src/application/simular-envio.ts
  - src/config/constantes.ts
  - src/config/env.ts
  - src/demo/ejecutar-demo.ts
  - src/domain/borrador.ts
  - src/domain/checklist.ts
  - src/domain/comparar-mapeo.ts
  - src/domain/errores.ts
  - src/domain/formulario.ts
  - src/domain/mapeo.ts
  - src/domain/normalizar.ts
  - src/domain/pii.ts
  - src/domain/plantillas.ts
  - src/domain/portal.ts
  - src/domain/reglas.ts
  - src/domain/resultado.ts
  - src/domain/solicitud.ts
  - src/domain/tipos.ts
  - src/domain/validar-reglas.ts
  - src/domain/vigencias.ts
  - src/infra/bitacora.ts
  - src/infra/fixtures/esquemas.ts
  - src/infra/fixtures/lector.ts
  - src/infra/knowledge/plantillas.ts
  - src/infra/knowledge/reglas.ts
  - src/infra/reloj.ts
  - src/infra/salida/archivos.ts
  - src/infra/salida/copias.ts
  - src/infra/salida/mutex.ts
  - src/infra/salida/pdf/layout.ts
  - src/infra/salida/pdf/render.ts
  - src/infra/salida/rutas-seguras.ts
  - src/infra/salida/xlsx.ts
  - src/knowledge/plantillas/borrador-correo.md
  - src/knowledge/plantillas/checklist.md
  - src/knowledge/plantillas/envio-simulado.md
  - src/knowledge/plantillas/valores-portal.md
  - src/knowledge/reglas.json
  - src/tools/argumentos.ts
  - src/tools/define-tool.ts
  - src/tools/fabrica.ts
  - src/tools/issues.ts
  - src/tools/proveedor.ts
  - src/tools/wiring.ts
  - tests/architecture.test.ts
  - tests/contract/generar-formulario.test.ts
  - tests/contract/maestro-incompleto.test.ts
  - tests/contract/reglas.test.ts
  - tests/contract/simular-envio.test.ts
  - tests/contract/sinteticos.test.ts
  - tests/e2e/demo.test.ts
  - tests/e2e/determinismo.test.ts
  - tests/e2e/pii.test.ts
  - tests/e2e/trazador.test.ts
  - tests/golden/borrador-envio.test.ts
  - tests/golden/formulario-pdf.test.ts
  - tests/golden/formulario-portal.test.ts
  - tests/golden/formulario-xlsx.test.ts
  - tests/golden/mapear-campos.test.ts
  - tests/golden/paquete.test.ts
  - tests/helpers/correr-demo.ts
  - tests/helpers/flujo.ts
  - tests/helpers/instantanea.ts
  - tests/helpers/pdf-texto.ts
  - tests/helpers/proyecto-temporal.ts
  - tests/helpers/xlsx-leer.ts
  - tests/sin-comentarios.test.ts
  - tests/unit/comparar-mapeo.test.ts
  - tests/unit/copias.test.ts
  - tests/unit/esquemas.test.ts
  - tests/unit/lector.test.ts
  - tests/unit/mapeo.test.ts
  - tests/unit/normalizar.test.ts
  - tests/unit/pdf-layout.test.ts
  - tests/unit/pii.test.ts
  - tests/unit/plantillas.test.ts
  - tests/unit/reloj.test.ts
  - tests/unit/salida.test.ts
  - tests/unit/solicitud.test.ts
  - tests/unit/validar-reglas.test.ts
  - tests/unit/vigencias.test.ts
  - tsconfig.json
findings:
  critical: 0
  warning: 11
  info: 7
  total: 18
status: issues_found
---

# Phase 01: Code Review Report (Conventions + Clarity)

**Reviewed:** 2026-10-13T00:26:56Z
**Depth:** deep (import graph, cross-file duplication, guard behavior and alias resolution checked by running them)
**Files Reviewed:** 91
**Status:** issues_found

## Summary

This is a conventions and clarity pass, layered on top of the bug review that was already fixed. The 22 earlier findings (CR-01, WR-01..WR-09, IN-01..IN-12) are not re-reported. Numbering continues at WR-10 and IN-13. No finding is critical: nothing here breaks correctness, safety or the PRD contract. Every warning is either a violation of a convention the user mandated (rules 1-7) or a written CLAUDE.md rule, or a clarity defect that produces misleading output.

**Baseline checked during this review:**
- `bun test tests/architecture.test.ts tests/sin-comentarios.test.ts` gives 25 pass / 0 fail.
- The no-comments rule holds: there are no `//`, `/* */` or JSDoc comments in `src/`, `tests/` or `demo.ts`. Nothing to report there.

**Main themes:**
- **Types.** 110 exported types are spread across 28 logic files.
- **Magic strings.** Code and state literals appear in about 130 places, and the zod enums come from arrays, not `as const` objects.
- **Constants.** There is a single `constantes.ts`, plus about 40 scattered constants and regexes.
- **User-facing text.** Human-readable text is hardcoded in 22 files, with several copies of the same sentence.
- **Layering.** The domain and application layers cannot import config today, and that gap has produced workarounds: a `patronCaso` port field, error messages living in the domain, and a demo that hardcodes error codes.
- **Imports.** There are 227 relative parent imports (113 `../`, 103 `../../`, 8 `../../../`, 3 dynamic `import("../`).

Two clarity defects affect user-visible output:
- **WR-17.** The checklist column "País emisor" never shows the issuing country.
- **WR-18.** Model-facing text names the tools both with and without the `proveedor_` prefix.

### Path alias verification (rule 7), executed

I ran these in a scratch project that reuses this repo's `tsconfig.json` with `"paths": { "@/*": ["./src/*"] }` and no `baseUrl`, and this repo's `node_modules`:

| Check | Result |
|---|---|
| `bun run demo.ts` (Bun 1.4.3), with static `import … from "@/domain/x.ts"` and dynamic `await import("@/domain/x.ts")` | resolves |
| `bun run /abs/path/demo.ts` from `cwd=/` | resolves (Bun walks up to the nearest `tsconfig.json` from the importing file, not from cwd) |
| `bun test` from the root and from `tests/` | resolves |
| `tsc --noEmit` (TypeScript 7.0.2), `paths` without `baseUrl` | passes |
| `biome check` (2.5.15) | accepts `@/` specifiers. `organizeImports` sorts them as aliases after `node:`/packages and before `./`, and `biome check --write` reorders them. |
| `z.enum(CONST_OBJECT)` (zod 4.6.5) | works. `z.toJSONSchema` emits the same `enum: [...]` as the array form, so the model contract does not change. |

---

## Warnings

### WR-10: Exported types live in logic files (rule 1)

**Files:** 28 `src` files export 110 types. Count per file:
- **domain:**
  - `domain/reglas.ts` 11
  - `domain/checklist.ts` 8
  - `domain/tipos.ts` 8
  - `domain/mapeo.ts` 7
  - `domain/resultado.ts` 5
  - `domain/plantillas.ts` 4
  - `domain/borrador.ts` 3
  - `domain/formulario.ts` 3
  - `domain/portal.ts` 3
  - `domain/comparar-mapeo.ts` 2
  - `domain/pii.ts` 2
  - `domain/solicitud.ts` 2
  - `domain/vigencias.ts` 2
  - `domain/errores.ts` 1
- **application:**
  - `application/puertos.ts` 18
  - `application/armar-paquete.ts` 3
  - `application/mapear-campos.ts` 3
  - `application/contexto-caso.ts` 2
  - `application/generar-formulario.ts` 2
  - `application/leer-solicitud.ts` 2
  - `application/simular-envio.ts` 2
- **infra:**
  - `infra/salida/pdf/layout.ts` 5
  - `infra/fixtures/esquemas.ts` 1
- **tools, config and demo:**
  - `tools/define-tool.ts` 3
  - `tools/wiring.ts` 3
  - `tools/fabrica.ts` 1
  - `config/env.ts` 2
  - `demo/ejecutar-demo.ts` 2

The test helpers export 17 more:
- `tests/helpers/flujo.ts` 5
- `tests/helpers/correr-demo.ts` 3
- `tests/helpers/proyecto-temporal.ts` 3
- `tests/helpers/xlsx-leer.ts` 3
- `tests/helpers/instantanea.ts` 2
- `tests/helpers/pdf-texto.ts` 1

`domain/tipos.ts` and `domain/reglas.ts` are mixed: types plus `as const` arrays.

**Fix:** one `*.type.ts` per module, inside a `types/` folder of the module's own layer. The exact targets are in the "Types" column of the WR-12 table. Rules:
- A `*.type.ts` file exports only `type`s. No values, and no imports other than `import type`.
- Unions of codes and states are **derived** from the WR-11 constant objects (`type EstadoCampo = (typeof ESTADO_CAMPO)[keyof typeof ESTADO_CAMPO]`), so the type file imports the constant with `import type`.
- `ValorMaestro` (`infra/fixtures/esquemas.ts:127-133`) is a domain concept. Move it to `src/domain/types/maestro.type.ts`, and type `Maestro` in terms of it.
- Remove `OpcionesHerramientas` (`tools/fabrica.ts:16`). It is a pure alias of `OpcionesEntorno`.

**Zod judgment (asked for explicitly):**
- Keep `ToolEnv = z.output<typeof toolEnvSchema>` (`config/env.ts:36`) next to its schema. It is a one-line derivation of a value. Moving it would force a `*.type.ts` to depend on a schema value, which inverts the layering. Allowlist it in the guard.
- Keep every other schema in its current direction: the hand-written domain type is the source of truth, and the schema checks against it with `satisfies z.ZodType<T>` (`esquemas.ts:125`, `knowledge/reglas.ts:73`). Do not replace those types with `z.infer`.

### WR-11: Magic strings for codes and states, and enums built from arrays instead of `as const` objects (rule 2)

**Issue:** none of the 15 code families has a constant object. Five use `as const` arrays (`CODIGOS_ERROR`, `FORMATOS`, `ESTADOS_CAMPO`, `REGLAS_MAPEO`, `APLICACIONES_NOTA`), which allow `"faltante"` at call sites but not `ESTADO_CAMPO.FALTANTE`. The rest are hand-written literal unions. Every comparison, assignment and `case` below uses a bare literal. tsc does catch typos on typed unions, so the cost is grep-ability and single-source drift, not runtime safety.

| Family → proposed object | Literal sites today |
|---|---|
| `CODIGO_ERROR` (errors.constants) | 28 `fallo("…")` calls: `application/contexto-caso.ts:23,28,31,37,40,50,53,77,80`, `armar-paquete.ts:48,50,115`, `generar-formulario.ts:44,103`, `mapear-campos.ts:43`, `simular-envio.ts:19,22`, `domain/formulario.ts:41,45`, `domain/mapeo.ts:90`, `domain/plantillas.ts:84`, `infra/knowledge/reglas.ts:76`, `infra/knowledge/plantillas.ts:8`, `tools/define-tool.ts:56,82,89,146`, `tools/wiring.ts:142`. Also `domain/resultado.ts:18-22` and `demo/ejecutar-demo.ts:42,93`. |
| `ESTADO_CAMPO` (`LLENO`, `FALTANTE`, `REQUIERE_CONFIRMACION`) | `domain/formulario.ts:31`, `pii.ts:111`, `portal.ts:34,51`, `checklist.ts:162,164`, `mapeo.ts:206,219,230`, `solicitud.ts:9,43`, `application/mapear-campos.ts:104-106`, `infra/salida/xlsx.ts:22,29`, `pdf/layout.ts:92,94,105,110`, `pdf/render.ts:29,37`, `demo/ejecutar-demo.ts:45,139,174-176` |
| `ESTADO_SOPORTE` / `ESTADO_VIGENCIA` | `domain/borrador.ts:42,49,50,93`, `checklist.ts:16,84,120,146,147,170,196,198`, `vigencias.ts:1,22,24,26`, `demo/ejecutar-demo.ts:146` |
| `FORMATO` / `TIPO_PLANTILLA` | `application/generar-formulario.ts:44,47,60,75,84,86,88`, `contexto-caso.ts:46,47`, `domain/solicitud.ts:14-16,21,22,27`, `formulario.ts:21,22,55,62,65`, `tipos.ts:1,32-36`, `tools/wiring.ts:63` |
| `ESTADO_LECTURA` (`OK`, `NO_ENCONTRADO`, `INVALIDO`) | `application/puertos.ts:9-17` (duplicated in two unions), `contexto-caso.ts:31,32,36,37,40,53,77,80`, `armar-paquete.ts:48,50`, `tools/define-tool.ts:99`, `tools/wiring.ts:65-71`, `infra/fixtures/lector.ts:17,18,57,88`, `infra/salida/rutas-seguras.ts:6,7,26` |
| `REGLA_MAPEO` | `domain/mapeo.ts:130,133,135,184,189,207,260`, `domain/reglas.ts:1-19`, and the hand-copied keys in `infra/knowledge/reglas.ts:35-40` |
| `TIPO_HOJA_MAESTRO` / `APLICA_NOTA` / `VARIABLE_NOTA` | `domain/mapeo.ts:45-47,73,74,112,113,125,151,152,196,270,271`, `domain/reglas.ts:21-34` |
| `ARCHIVO_SALIDA` keys (`ArchivoSalida`, `ArchivoBinario`, `ArchivoFormulario`) | `application/puertos.ts:48-52` (hand-written, not derived from `ARCHIVOS_SALIDA`), `armar-paquete.ts:36-38,126,127`, `generar-formulario.ts:46,59,74`, `simular-envio.ts:22,36`, `mapear-campos.ts:76` |
| `ORIGEN_COPIA` | `application/puertos.ts:55,56`, `armar-paquete.ts:95,100`, `tools/wiring.ts:76` |
| `CLAVE_PLANTILLA` | `application/armar-paquete.ts:69,82`, `generar-formulario.ts:68`, `simular-envio.ts:29`, `domain/reglas.ts:59-66`, and the hand-copied keys in `infra/knowledge/reglas.ts:66-69` |
| `TIPO_MASCARA` | `domain/pii.ts:4,31,47,58-61,107` |
| `COLOR_TRAZO` | `infra/salida/pdf/layout.ts:6,37-41`, `config/constantes.ts:120-123` |
| `HERRAMIENTA` (tool names) | `tools/fabrica.ts:21,35,49,68,88`, `demo/ejecutar-demo.ts:156,158,161,165,168,218` |
| `NOMBRE_TEXTO_REGLA` (rule-text names used in error details) | `domain/mapeo.ts:176,180,197`, `validar-reglas.ts:17,22,27,32`, `checklist.ts:67` |
| `CODIGO_FS` (`ENOENT`, `ENOTDIR`) | `infra/fixtures/lector.ts:19`, `rutas-seguras.ts:8`, `archivos.ts:65` |

**Fix:**
1. Model each family on this pattern:
   ```ts
   export const ESTADO_CAMPO = {
     LLENO: "lleno",
     FALTANTE: "faltante",
     REQUIERE_CONFIRMACION: "requiere_confirmacion",
   } as const;
   ```
   Put the derived `type EstadoCampo = (typeof ESTADO_CAMPO)[keyof typeof ESTADO_CAMPO]` in the matching `*.type.ts`.
2. In zod, use `z.enum(ESTADO_CAMPO)` (`tools/argumentos.ts:17`, `infra/fixtures/esquemas.ts:76`, `infra/knowledge/reglas.ts:56`). Verified: the JSON Schema output is identical.
3. Build `esquemaReglas.confianza` and `.plantillas` from the objects so the keys cannot drift: `Object.fromEntries(Object.values(REGLA_MAPEO).map((r) => [r, confianza]))`.
4. Where a list is needed, use `Object.values(…)`. For example, the `contarEstados` initializer at `mapeo.ts:299` becomes `Object.fromEntries(Object.values(ESTADO_CAMPO).map((e) => [e, 0]))`.
5. Add Biome `style/noEnum: "error"` so a TS `enum` never comes back.

### WR-12: File names do not encode their role, and roles are not separated by folder (rule 3)

**Proposed suffix table.** It covers every file. Suffixes are English role markers, kebab-case base names follow the layer's language (see WR-20), and the guard is in G5.

| Role | Folder | Suffix |
|---|---|---|
| PRD-fixed entry points | `demo.ts`, `src/tools/proveedor.ts` | none (fixed) |
| Knowledge data | `src/knowledge/**` (`.json`, `.md`) | none (data, fixed) |
| Exported types | `src/<layer>/types/`, `tests/helpers/types/` | `.type.ts` |
| Constants | `src/config/constants/` | `.constants.ts` |
| Human-readable text | `src/config/strings.ts` | single file |
| Env reading | `src/config/env.ts` | single file |
| zod schemas | `src/<layer>/**/schemas/` | `.schema.ts` |
| Use cases (one exported use case each) | `src/application/use-cases/` | `.use-case.ts` |
| Logic shared by use cases | `src/application/services/` | `.service.ts` |
| Pure domain logic | `src/domain/` | none (the folder is the role, and G5 forbids suffixes here) |
| Port implementations | `src/infra/<area>/` | `.adapter.ts` |
| Infra/tools-internal helpers | same folder | `.util.ts` |
| Tool factories / composition root | `src/tools/` | `.factory.ts` / `.wiring.ts` |
| Demo runner | `src/demo/` | `.runner.ts` |
| Tests / test helpers | `tests/**` | `.test.ts` / `.helper.ts` |

**Exact renames** (do them with `git mv` in specifier-only commits so git tracks the rename):

| Today | Target | Types → / extracted to |
|---|---|---|
| `src/application/armar-paquete.ts` | `src/application/use-cases/armar-paquete.use-case.ts` | `application/types/armar-paquete.type.ts`; `evaluarEstadoPaquete` → `application/services/estado-paquete.service.ts` |
| `src/application/contexto-caso.ts` | `src/application/services/contexto-caso.service.ts` | `application/types/contexto-caso.type.ts` |
| `src/application/generar-formulario.ts` | `src/application/use-cases/generar-formulario.use-case.ts` | `application/types/generar-formulario.type.ts` |
| `src/application/leer-solicitud.ts` | `src/application/use-cases/leer-solicitud.use-case.ts` | `application/types/leer-solicitud.type.ts` |
| `src/application/mapear-campos.ts` | `src/application/use-cases/mapear-campos.use-case.ts` | `application/types/mapear-campos.type.ts`; `mapeoCanonico`, `escribirMapeo` → `application/services/mapeo-canonico.service.ts` |
| `src/application/puertos.ts` | `src/application/types/puertos.type.ts` | — |
| `src/application/simular-envio.ts` | `src/application/use-cases/simular-envio.use-case.ts` | `application/types/simular-envio.type.ts` |
| `src/config/constantes.ts` | deleted, split per WR-13 | — |
| `src/config/env.ts` | unchanged | `esFechaReal` → `src/domain/fecha.ts` (WR-15) |
| `src/demo/ejecutar-demo.ts` | `src/demo/ejecutar-demo.runner.ts` | `demo/types/demo.type.ts` |
| `src/domain/borrador.ts` | unchanged | `domain/types/borrador.type.ts` |
| `src/domain/checklist.ts` | unchanged | `domain/types/checklist.type.ts` |
| `src/domain/comparar-mapeo.ts` | unchanged | `domain/types/comparar-mapeo.type.ts` |
| `src/domain/errores.ts` | deleted | codes → `errors.constants.ts`, messages → `strings.ts` |
| `src/domain/formulario.ts` | unchanged | `domain/types/formulario.type.ts` |
| `src/domain/mapeo.ts` | unchanged (optional split, IN-17) | `domain/types/mapeo.type.ts` |
| `src/domain/normalizar.ts` | unchanged | — |
| `src/domain/pii.ts` | unchanged | `domain/types/pii.type.ts`; the policy route lists → `pii.constants.ts` |
| `src/domain/plantillas.ts` | `src/domain/motor-plantillas.ts` (IN-16) | `domain/types/motor-plantillas.type.ts` |
| `src/domain/portal.ts` | unchanged | `domain/types/portal.type.ts` |
| `src/domain/reglas.ts` | deleted | `domain/types/reglas.type.ts`; arrays → `mapping.constants.ts` |
| `src/domain/resultado.ts` | unchanged | `domain/types/resultado.type.ts` |
| `src/domain/solicitud.ts` | unchanged | `domain/types/solicitud.type.ts` |
| `src/domain/tipos.ts` | deleted | `Solicitud`, `CampoSolicitado` → `domain/types/solicitud.type.ts`; `FechaISO` → `domain/types/fecha.type.ts`; `CampoCelda`, `CampoLista`, `TipoPlantilla`, `Plantilla` → `domain/types/plantilla-caso.type.ts`; `FORMATOS` → `forms.constants.ts` |
| `src/domain/validar-reglas.ts` | unchanged | — |
| `src/domain/vigencias.ts` | unchanged | `domain/types/vigencias.type.ts` |
| (new) | `src/domain/fecha.ts`, `src/domain/nombre-error.ts` | `esFechaReal`; `nombreDeError` (IN-14) |
| `src/infra/bitacora.ts` | `src/infra/logging/audit-log.adapter.ts` | — |
| `src/infra/fixtures/esquemas.ts` | `src/infra/fixtures/schemas/fixtures.schema.ts` | `ValorMaestro` → `domain/types/maestro.type.ts` |
| `src/infra/fixtures/lector.ts` | `src/infra/fixtures/fixtures-reader.adapter.ts` | `esNoEncontrado`, `parsearJson` → `infra/fs/fs.util.ts` |
| `src/infra/knowledge/plantillas.ts` | `src/infra/knowledge/template-loader.adapter.ts` | — |
| `src/infra/knowledge/reglas.ts` | `src/infra/knowledge/rules-loader.adapter.ts` | `esquemaReglas` → `infra/knowledge/schemas/rules.schema.ts`; `leerTexto` → `infra/fs/fs.util.ts` |
| `src/infra/reloj.ts` | `src/infra/clock/clock.adapter.ts` | — |
| `src/infra/salida/archivos.ts` | `src/infra/output/output-files.adapter.ts` | — |
| `src/infra/salida/copias.ts` | `src/infra/output/package-copy.adapter.ts` | — |
| `src/infra/salida/mutex.ts` | `src/infra/output/case-lock.adapter.ts` | — |
| `src/infra/salida/pdf/layout.ts` | `src/infra/output/pdf/pdf-layout.util.ts` | `infra/types/pdf-layout.type.ts` |
| `src/infra/salida/pdf/render.ts` | `src/infra/output/pdf/pdf-renderer.adapter.ts` | — |
| `src/infra/salida/rutas-seguras.ts` | split: `src/infra/fixtures/case-resolver.adapter.ts` (`resolverCaso`, `listarCasos`) and `src/infra/fs/safe-paths.util.ts` (`rutaRelativa`, `directorioSalidaCaso`, containment helpers, WR-19) | — |
| `src/infra/salida/xlsx.ts` | `src/infra/output/xlsx-writer.adapter.ts` | — |
| `src/tools/argumentos.ts` | `src/tools/schemas/argumentos.schema.ts` | — |
| `src/tools/define-tool.ts` | `src/tools/definir-herramienta.factory.ts` | `tools/types/herramienta.type.ts` |
| `src/tools/fabrica.ts` | `src/tools/herramientas.factory.ts` | — |
| `src/tools/issues.ts` | `src/tools/formatear-issues.util.ts` | — |
| `src/tools/wiring.ts` | `src/tools/entorno.wiring.ts` | `tools/types/entorno.type.ts` |
| `src/tools/proveedor.ts`, `demo.ts`, `src/knowledge/**` | **unchanged (PRD)** | — |
| `tests/helpers/{correr-demo,flujo,instantanea,pdf-texto,proyecto-temporal,xlsx-leer}.ts` | `tests/helpers/<same>.helper.ts` | `tests/helpers/types/<same>.type.ts` |
| `tests/**/*.test.ts` | unchanged | — |

Two consequences:
- `tests/architecture.test.ts:45-46` identifies the composition root and the PRD file by exact path, so the `wiring` path must change when `wiring.ts` is renamed.
- `infra/knowledge/reglas.ts:19-21` derives the default knowledge directory from its own location (`new URL("../../knowledge/", import.meta.url)`). Aliases do not apply to it. The proposed target stays in `src/infra/knowledge/`, so `../../` remains correct, but any other move must update it. The demo e2e catches a wrong value as REGLAS_INVALIDAS.

### WR-13: One `constantes.ts` for everything, plus about 40 scattered constants (rule 4)

**Files:** `src/config/constantes.ts:1-142`. Scattered constants, with no text (text goes to WR-14):
- `domain/mapeo.ts:68-74`
- `domain/normalizar.ts:1-3`
- `domain/pii.ts:18,21`
- `domain/plantillas.ts:17-21`
- `domain/vigencias.ts:9`
- `domain/checklist.ts:68`
- `domain/resultado.ts:18-22`
- `domain/validar-reglas.ts:11`
- `domain/solicitud.ts:13-17`
- `domain/borrador.ts:6-10`
- `application/armar-paquete.ts:35-39`
- `application/mapear-campos.ts:28`
- `tools/wiring.ts:55-58`
- `infra/fixtures/esquemas.ts:21-22`
- `infra/fixtures/lector.ts:17-19`
- `infra/salida/rutas-seguras.ts:6-8`
- `infra/salida/xlsx.ts:6`
- `infra/salida/pdf/layout.ts:29`
- `infra/salida/pdf/render.ts:12`
- `config/env.ts:15` (`"en-CA"`)
- `infra/reloj.ts:23` (`"en-US"`, a different locale for the same purpose)
- `demo/ejecutar-demo.ts:45,88` (`"package.json"`)

**Fix: exact split.** All files are `src/config/constants/*.constants.ts`, pure, `as const`.

| File | Contents |
|---|---|
| `files.constants.ts` | `FIXTURES_DIR`, `CASOS_DIR`, `OUT_DIR`, `SOPORTES_DIR`, `INDICE_SOPORTES`, `ARCHIVOS_CASO`, `ARCHIVOS_REPOSITORIO`, `ARCHIVO_REGLAS`, `ARCHIVOS_SALIDA`, `NOMBRES_RESERVADOS_PAQUETE`, `ARCHIVO_FORMULARIO` (from `armar-paquete.ts:35`), `ARCHIVO_PLANTILLA` (from `wiring.ts:55`), `ARCHIVO_PROYECTO = "package.json"` |
| `limits.constants.ts` | `LONGITUD_MAXIMA_CASO`, `LONGITUD_MAXIMA_SESION`, `LIMITE_LECTURA_BYTES`, `LIMITES_REGLAS`, `LIMITES_ARGS`, `LIMITES_FIXTURES`, `MAX_ISSUES_ARGS`, `SANGRIA_JSON` |
| `patterns.constants.ts` | every `PATRON_*` in `constantes.ts`; `PATRON_SEGMENTO_RUTA` (`mapeo.ts:68`); `PATRON_ESPACIO`/`PATRON_ESPACIOS` (`mapeo.ts:70`, `pii.ts:21`, `layout.ts:29`, `normalizar.ts:2`); `PATRON_TEXTO_NO_VACIO`, which absorbs the duplicate `TEXTO_CON_CONTENIDO` (`mapeo.ts:71`); `PATRON_SEPARADORES_DE_LINEA` (`render.ts:12`); `PATRON_DIACRITICOS`, `PATRON_MARCAS_FINALES` (`normalizar.ts:1,3`) |
| `errors.constants.ts` | `CODIGO_ERROR`, `CODIGOS_CON_DETALLE`, `CODIGO_FS` |
| `mapping.constants.ts` | `ESTADO_CAMPO`, `REGLA_MAPEO`, `REGLAS_SIEMPRE_POR_CONFIRMAR`, `APLICA_NOTA`, `VARIABLE_NOTA` (+ the `VARIABLES_NOTA_CAMPO`/`VARIABLES_AVISO_SOPORTE` groupings), `TIPO_HOJA_MAESTRO`, `CLAVES_PROHIBIDAS`, `NOMBRE_TEXTO_REGLA`, `VALOR_DE_MUESTRA` |
| `maestro.constants.ts` | `RUTA_MAESTRO` (the paths behind `RUTAS_BORRADOR`, `borrador.ts:6-10`, and `VARIABLES_NOTA_DEL_MAESTRO`, `reglas.ts:29-32`) |
| `forms.constants.ts` | `FORMATO`, `TIPO_PLANTILLA`, `PLANTILLA_DEL_FORMATO` (`solicitud.ts:13-17`) |
| `supports.constants.ts` | `ESTADO_SOPORTE`, `ESTADO_VIGENCIA`, `VIGENCIA_SIN_VENCIMIENTO` (`checklist.ts:68`), `MILISEGUNDOS_POR_DIA` (`vigencias.ts:9`) |
| `pii.constants.ts` | `TIPO_MASCARA`, `POLITICA_PII` route lists (`pii.ts:29-62`), `LARGO_VISIBLE` |
| `io.constants.ts` | `ESTADO_LECTURA`, `ORIGEN_COPIA` |
| `knowledge.constants.ts` | `VERSION_REGLAS`, `CLAVE_PLANTILLA` |
| `tools.constants.ts` | `PREFIJO_HERRAMIENTA`, `HERRAMIENTA`, `SESION_POR_DEFECTO` |
| `runtime.constants.ts` | `ZONA_HORARIA_POR_DEFECTO`, `LOCALE_INTL` (one locale for `env.ts:15` and `reloj.ts:23`), `AUTOR_DOCUMENTOS` |
| `demo.constants.ts` | `FECHA_DEMO`, `SESION_DEMO`, `GRUPOS_MAPEO` |
| `xlsx.constants.ts` | `LIMITES_XLSX`, `HOJA_RESERVADA_XLSX`, `RELLENO_XLSX` (the ARGB colors from `MARCAS_XLSX`), `FORMATO_CELDA_TEXTO = "@"`, `LETRAS_DEL_ALFABETO`, `CODIGO_ANTES_DE_A` |
| `pdf.constants.ts` | `DISENO_PDF` (dimensions + colors), `COLOR_TRAZO` |

**Judgment call:** I would keep the mustache grammar regexes (`domain/plantillas.ts:17-21`: `ETIQUETA`, `BLOQUE`, `MARCA_DE_SECCION`, `SALTO_DE_LINEA`, `BARRA_VERTICAL`) private to the template engine. They are its parser, not shared configuration, and moving them splits one algorithm across two files. If you accept that, allowlist `src/domain/motor-plantillas.ts` in G11. Otherwise move them to `patterns.constants.ts` as `PATRON_PLANTILLA_*`.

### WR-14: User-facing text is hardcoded in 22 files, with copies of the same sentence (rule 5)

**Files that hardcode human-readable text today:**
- `src/domain/errores.ts:19-35`: the whole error catalog. `:22` hardcodes "64 caracteres", which duplicates `LONGITUD_MAXIMA_CASO` and will drift silently.
- `src/domain/resultado.ts:31` (`" Detalle: "`)
- `src/domain/borrador.ts:14-15`
- `src/domain/checklist.ts:62-66,146-147` (`"no aplica"`, `"—"`, `LISTO`/`BLOQUEADO`, `"confirmar con el cliente"`, the `ausente:`/`vencido:` blockers)
- `src/domain/comparar-mapeo.ts:29,30,34,35,49`
- `src/domain/mapeo.ts:49-50,72`
- `src/domain/pii.ts:17,19,20` (`"•"`, `"[monto oculto]"`, `"[dato oculto]"`)
- `src/domain/plantillas.ts:52,57,76,84,94`
- `src/domain/portal.ts:5,25-29`
- `src/domain/vigencias.ts:12-14`
- `src/config/constantes.ts:101,106,126-142` (`MARCAS_XLSX.notaFaltante`, `TEXTOS_PDF`)
- `src/config/env.ts:26,27,32`
- `src/tools/fabrica.ts:22-23,36-37,50-51,69-70,89-90` (descriptions) and `:27-28,41-42,56-60,80-81,94-97` (summaries)
- `src/tools/argumentos.ts:9,16,17,23,33,35,44,55` (`.describe()`)
- `src/tools/define-tool.ts:63,81,106,145`
- `src/tools/issues.ts:8` (`"(raíz)"`)
- `src/infra/knowledge/reglas.ts:81,82,108,110`
- `src/infra/knowledge/plantillas.ts:8,18,21`
- `src/infra/reloj.ts:11`
- `src/infra/salida/archivos.ts:25,36,38,78,87,97,102`
- `src/infra/salida/copias.ts:39,41,59,61,66`
- `src/infra/bitacora.ts:38`
- `src/demo/ejecutar-demo.ts:43,44,46,59,64,113,114,124,130,136,137,139,146,148,149,155,170,188,190,216,221,235`

**Copies of the same sentence:**

| Text | Copies |
|---|---|
| "confirmar con el cliente" | `checklist.ts:66`, `constantes.ts:137` |
| "no existe en el maestro" | `constantes.ts:106,136` (plus the `.md` template) |
| "—" | `checklist.ts:63`, `ejecutar-demo.ts:43` |
| `". "` separator | `mapeo.ts:72`, `constantes.ts:140` |
| "no existe, no es un archivo o supera el tamaño permitido" | `knowledge/reglas.ts:108`, `knowledge/plantillas.ts:21` |
| "(raíz)" | `issues.ts:8`, `knowledge/reglas.ts:82` |
| "La carpeta de salida del caso sale de out/." | `archivos.ts:25,102`, `copias.ts:39` |
| `${conteo.lleno} llenos, … por confirmar` | `fabrica.ts:42,57`, `ejecutar-demo.ts:139` |

**Fix:** one `src/config/strings.ts`, pure, made of `as const` groups:
- `MENSAJE_ERROR` (`satisfies Record<CodigoError, string>`, built with `LONGITUD_MAXIMA_CASO`)
- `DESCRIPCION_HERRAMIENTA`, `DESCRIPCION_ARG`, `RESUMEN_HERRAMIENTA`
- `TEXTO_PDF`, `TEXTO_XLSX`, `TEXTO_CHECKLIST`, `TEXTO_BORRADOR`, `TEXTO_PORTAL`, `TEXTO_VIGENCIA`
- `TEXTO_MAPEO`, `TEXTO_MASCARA`, `TEXTO_COMPARACION`, `TEXTO_MOTOR_PLANTILLAS`
- `TEXTO_ENV`, `TEXTO_INFRA` (the `RangeError` messages)
- `TEXTO_DEMO`

Interpolated messages become tiny pure functions inside `strings.ts`, for example `TEXTO_VIGENCIA.venceEn(dias)` and `RESUMEN_HERRAMIENTA.conteo(c)`. The pluralization branch stays in `vigencias.ts`.

What must not change:
- `MENSAJE_ERROR.CONFIRMACION_REQUERIDA` is the PRD's literal "requiere confirmación explícita" (§6.2). Keep it verbatim.
- `.describe()`/`description` texts stay a model contract, only moved. The architecture guard's "one sentence" check keeps passing.
- `src/knowledge/plantillas/*.md` stay where they are.

### WR-15: Config is not split into pure and env parts, and layering workarounds follow from that (rule 6)

**Issue:**
- `tests/architecture.test.ts:16-26` allows `config` only from infra, tools and demo. Domain and application therefore cannot read constants, which has produced workarounds:
  - The regex is injected through the port: `Entorno.patronCaso` (`application/puertos.ts:93`, `contexto-caso.ts:28`, `wiring.ts:92`).
  - The error-message catalog lives in the domain (`domain/errores.ts`).
  - The demo, which can import config but not the domain, re-hardcodes `"CONFIRMACION_REQUERIDA"`, `"CASO_NO_ENCONTRADO"`, `"LISTO"` and `"BLOQUEADO"` (`ejecutar-demo.ts:42,93,113,149`).
- `config/env.ts` mixes a pure date validator (`esFechaReal`, `:8-11`) with env parsing. `infra/fixtures/esquemas.ts:15` imports the validator from the env module.
- The env is not read in `env.ts`. `tools/wiring.ts:138` passes `process.env` itself.

**Fix:**
- Two config layers in the guard: **`config-pure`** = `src/config/constants/**` + `src/config/strings.ts`, and **`config-env`** = `src/config/env.ts`.
- New `PERMITIDOS` matrix:

  | Layer | May import |
  |---|---|
  | `domain` | `domain`, `config-pure` |
  | `application` | `domain`, `application`, `config-pure` |
  | `config-pure` | `config-pure` only |
  | `config-env` | `config-env`, `config-pure`, `zod` |
  | `infra` | today's list with `config-pure` + `config-env` |
  | `tools`, `proveedor` | `DESTINOS_DE_HERRAMIENTAS` with `config-pure` + `config-env` |
  | `demo` | `demo`, `proveedor`, `config-pure`, `config-env`, `node` |
  | `tests` (new) | anything |

  `src` may never import `@tests/`.
- `capaDeRuta` (`architecture.test.ts:42-50`) needs the two config branches before the generic `src/(…)/` regex.
- Move `esFechaReal` to `src/domain/fecha.ts`.
- Give `env.ts` a `leerEntornoHerramienta()` that reads `process.env` itself, so `process.env` appears only in `env.ts`. The demo's FECHA pinning was accepted in IN-04. Allowlist it in G10, or route it through an `env.ts` helper.
- Drop `Entorno.patronCaso`. The application imports `PATRON_CASO` directly.

### WR-16: 227 relative parent imports; adopt one `@/*` alias (rule 7)

**Files:** 59 files with `../` specifiers: 25 in `src` (all of `application/`, `infra/` except `salida/mutex.ts`, `tools/` except `proveedor.ts`, and `demo/`) and 34 in `tests/`. `demo.ts` uses `./src/...`, and the domain and config use only same-folder `./` imports. The counts are 113 `../`, 103 `../../`, 8 `../../../`, plus 3 dynamic `import("../…")`: `tests/architecture.test.ts:200,206`, and line 266, which is a sample string. Another 62 same-folder `./` imports exist in `src`.

**Recommendation:** use a single `"@/*": ["./src/*"]` plus `"@tests/*": ["./tests/*"]` (tests import helpers 36 times), with **no `baseUrl`**.
- Per-layer aliases (`@/domain/*`, …) add five entries and no safety: the layer is already the first path segment after `@/`, and the guard reads it from there.
- Also convert the `./` imports. "Every internal import starts with `@/` or `@tests/`" is one rule that is trivial to guard and grep.
- Keep the `.ts` extensions, which is the current style with `allowImportingTsExtensions`.

**Verified working:** Bun 1.4.3 runtime + `bun test` + dynamic import, tsc 7.0.2, Biome 2.5.15 (see the Summary table).

**Guard changes that are mandatory:**
1. Today `capaDeDestino` (`architecture.test.ts:57-64`) classifies `@/domain/x.ts` as `paquete:@/domain`, so every aliased import fails loudly.
2. Worse, `dependenciasLocales` (`:143-147`) keeps only specifiers that start with `"."`. After the codemod, the cycle detector would see **zero edges and pass silently**.

Both functions must map `@/` → `src/` and `@tests/` → `tests/`. Add a "bites on sample" test with an aliased two-file cycle.

**Deployment notes:**
- Bun resolves `paths` at runtime from `tsconfig.json`, so the future Dockerfile must `COPY tsconfig.json`. Today `.dockerignore` does not exclude it.
- The Node plan B in CLAUDE.md would need a loader (tsx) or a build step once aliases exist. Record this in SOLUCION.md.

### WR-17: The checklist column "País emisor" shows the issuer warning, never the country

**File:** `src/domain/checklist.ts:181` (`pais_emisor: soporte.aviso_emisor ?? TEXTO_CELDA_VACIA`), `src/domain/checklist.ts:38-45`, `src/knowledge/plantillas/checklist.md` (column "País emisor").

**Issue:** `FilaSoporteChecklist.pais_emisor` holds the *warning text*, not the country, and `SoporteEvaluado` does not carry the country at all. In today's `out/`:
- In co, every row shows "—" where the country should read "CO".
- In ec, hn and pa, every row shows "Emitido en CO: confirmar si el cliente lo acepta" under the "País emisor" header.

The analyst cannot see the issuing country of a support that matches the client, and the field name tells the next developer the wrong thing.

**Fix:** add `pais_emisor: string | null` to `SoporteEvaluado`, filled from `entrada.pais_emisor`. Render two columns: "País emisor" (`{{pais_emisor}}`) and "Aviso de emisor" (`{{aviso_emisor}}`). Update the paquete golden in a separate behavior-change commit.

### WR-18: Model-facing text names the tools inconsistently (`generar_formulario` vs `proveedor_mapear_campos`)

**Files:**
- `src/domain/errores.ts:29-30` ("…con generar_formulario.", "…con armar_paquete.")
- `src/tools/argumentos.ts:16,17,23,44` ("tal como la devolvió mapear_campos")
- `src/tools/fabrica.ts:51` ("…que devolvió proveedor_mapear_campos.")

**Issue:** the model only knows the tools as `proveedor_<export>` (PRD §6.2). One description uses the full name, while errors and arg descriptions use the bare export name. The model has to guess that `generar_formulario` means `proveedor_generar_formulario`.

**Fix:** in `strings.ts`, build every tool reference as `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.GENERAR_FORMULARIO}`. Add a guard that fails when a bare tool name appears in `strings.ts` without the prefix. The contract tests that assert these messages need an update.

### WR-19: Path-containment and FS-error helpers are duplicated across infra, with diverging semantics

**Files:**
- `dentroDe` is defined twice (`infra/salida/archivos.ts:15-17`, `infra/salida/copias.ts:19-21`) and inlined once (`rutas-seguras.ts:24`).
- The "realpath out/ + realpath case + containment" sequence appears three times (`archivos.ts:19-28`, `archivos.ts:96-103`, `copias.ts:33-43`).
- The not-found check appears three times (`lector.ts:17-24`, `rutas-seguras.ts:6-13`, `archivos.ts:64-66`), and `noExiste` in `archivos.ts` treats only `ENOENT` while the other two also treat `ENOTDIR`.

**Issue:** these are the path-traversal guards that the previous review confirmed are closed. Three hand-maintained copies of a security invariant will drift. The ENOENT/ENOTDIR split shows that drift has already begun.

**Fix:** one `src/infra/fs/safe-paths.util.ts` with:
- `dentroDe(base, ruta)`
- `casoRealDentroDeSalida(raiz, caso, { crear })`
- `paqueteRealDentroDeCaso(...)`

and one `src/infra/fs/fs.util.ts` with `esNoEncontrado` (using `CODIGO_FS`), `parsearJson` and `leerTexto` (see IN-14). The existing traversal tests (`tests/unit/salida.test.ts`, `copias.test.ts`) cover the refactor.

### WR-20: Infra and tools naming language contradicts CLAUDE.md

**Rule:** CLAUDE.md says "Dominio en español (contrato del PRD), infraestructura en inglés", and the dependency rule groups "herramientas/casos de uso" with the application.

**Files:**
- Every infra file name and exported identifier is Spanish: `bitacora`, `lector`, `esquemas`, `reloj`, `archivos`, `copias`, `rutas-seguras`, `crearBitacora`, `leerJsonValidado`, `relojSistema`, `copiarAlPaquete`, `conCandadoCaso`, `renderizarPdf`, `escribirXlsx`, …
- `src/tools` mixes English (`define-tool.ts`/`defineTool`, `wiring.ts`, `issues.ts`) with Spanish (`fabrica.ts`, `argumentos.ts`).
- `src/config/env.ts` mixes `toolEnvSchema`/`parseToolEnv`/`ToolEnv` with `FuenteEntorno`/`vacioComoAusente`.

**Fix:** pick one rule and apply it everywhere. The WR-12 table already applies CLAUDE.md:
- infra file names in English (`audit-log.adapter.ts`, …);
- tools in Spanish (`definir-herramienta.factory.ts`, `entorno.wiring.ts`, `formatear-issues.util.ts`), while the PRD contract members `description`/`args`/`execute` stay English;
- `env.ts` in English (`EnvSource`, `emptyAsUndefined`).

Rename the exported infra identifiers in their own commit after the file moves. Domain type names in infra signatures stay Spanish. If you prefer Spanish everywhere, amend CLAUDE.md instead. Either way, the rule and the code must agree.

---

## Info

### IN-13: Exported constants are re-hardcoded instead of imported, and summary phrases are duplicated

**Files:**
- `ESTADO_LISTO`/`ESTADO_BLOQUEADO` are exported from `domain/checklist.ts:64-65`, but `tools/fabrica.ts:81` and `demo/ejecutar-demo.ts:113,114,149` spell `"LISTO"`/`"BLOQUEADO"` again.
- The counts phrase appears in `fabrica.ts:42,57` and `ejecutar-demo.ts:139`.
- The failure summary `${nombre}: ${codigo}` is built twice: `define-tool.ts:63` and `:106`.

**Fix:** use `TEXTO_CHECKLIST.estado`, `RESUMEN_HERRAMIENTA.conteo(c)` and a single `resumenFallo(nombre, codigo)` in `strings.ts`. `serializarFallo` should return the `{ texto, resumen }` pair so `responder` does not rebuild it.

### IN-14: Small helper duplicates

**Files:**
- `nombreDeError`: `infra/bitacora.ts:16-18` and `tools/define-tool.ts:43-45`.
- `parsearJson`: `infra/fixtures/lector.ts:26-32` and `infra/knowledge/reglas.ts:96-104`.
- Zod-issue path formatting: `tools/issues.ts:4-12` and `infra/knowledge/reglas.ts:79-84`. One caps at 5 issues, the other keeps only the first.
- `plantillaInvalida`: `domain/plantillas.ts:83-85` and `infra/knowledge/plantillas.ts:7-9`.
- `leerTexto` is exported from the *rules* loader (`infra/knowledge/reglas.ts:86`) and imported by the *template* loader. Its stat+size guard repeats `lector.ts:52-53`.

**Fix:**
- `nombreDeError` → `src/domain/nombre-error.ts`.
- `parsearJson`/`leerTexto` → `src/infra/fs/fs.util.ts`.
- One `formatearIssues(issues, max)` in a place both layers can reach: `src/domain/` if it only needs the issue shape, since infra cannot import tools.
- One `plantillaInvalida` in `motor-plantillas.ts`, reused by the loader.

### IN-15: Port fields and exports with no consumer

**Files:**
- `Entorno.raiz` (`application/puertos.ts:92`) is set in `tools/wiring.ts:91` and never read by the application.
- `Entorno.patronCaso` exists only because of the layering gap (WR-15).
- These values are exported but never imported elsewhere: `CODIGOS_ERROR`, `REGLAS_MAPEO`, `ESTADO_LISTO`, `ESTADO_BLOQUEADO`, `NOTA_POR_CONFIRMAR`, `PREFIJO_RESPUESTA`, `TEXTO_PENDIENTE_VENCIDO`, `TEXTO_SIN_VIGENCIA`, `asuntoRespuesta`, `esquemaReglas`, `toolEnvSchema`, `LONGITUD_MAXIMA_SESION`.

**Fix:** remove `raiz` and `patronCaso` from `Entorno`. Most of the dead exports disappear naturally when they move into `constants`/`strings`. Un-export the rest.

### IN-16: Overloaded names: "plantilla" means three things, "reglas" two

**Files:**
- `domain/plantillas.ts` is a mustache renderer.
- `infra/knowledge/plantillas.ts` loads knowledge `.md` templates.
- `domain/tipos.ts:34` `Plantilla` is the case's form template (`plantilla-celdas.json`).
- In `Entorno`, `plantillas.cargar` (knowledge) sits next to `fixtures.leerPlantilla` (form).
- `domain/reglas.ts` defines both the knowledge rules config (`Reglas`) and the mapping-rule label (`ReglaMapeo`). `infra/knowledge/reglas.ts` shares its base name.

**Fix:**
- Renderer → `motor-plantillas.ts`.
- Form template → `PlantillaCaso` (`plantilla-caso.type.ts`).
- Knowledge templates → `PlantillaConocimiento`.
- Infra loaders → `template-loader` / `rules-loader`.

The `.type.ts` and `.adapter.ts` suffixes then disambiguate the files.

### IN-17: Function shape and naming

**Files:**
- Six positional parameters: `domain/checklist.ts:105-112,128-135` (`evaluarSoporte(s)`) and `application/generar-formulario.ts:25-32` (`cerrar`, with a defaulted 6th).
- `tools/define-tool.ts:70-150`: an 80-line factory with six nested closures.
- `tools/fabrica.ts:18-103`: 85 lines, mostly inline text that WR-14 removes.
- `domain/mapeo.ts` (302 lines) mixes four concerns: glossary index, master reading (`valorEnRuta`/`leerHoja`/`leerRuta`), notes, and mapping.
- `tools/wiring.ts:63-72` has two identical branches.
- `Desenlace`/`desenlazar` (`define-tool.ts:25,94`): "desenlazar" means "untie", not "compute the outcome".
- `mapearCamposCaso` (`application/mapear-campos.ts:111`) breaks the verb pattern of the other four use cases because the domain owns `mapearCampos`.
- `hay_pendientes: [{}]` (`domain/borrador.ts:29,75`) encodes a boolean as a one-element section.

**Fix:**
- Parameter objects (`EntradaEvaluacionSoportes`, `CierreFormulario`).
- Hoist the `defineTool` closures to module functions that take `spec`.
- Split `mapeo.ts` into `maestro.ts` (reading), `glosario.ts` (index) and `mapeo.ts`.
- Rename `Desenlace` → `ResultadoEjecucion`.
- Rename domain `mapearCampos` → `mapearEtiquetas`, so the use case can be `mapearCampos`.
- Add a short note in `docs/` on the section-as-boolean idiom, or add `{{?flag}}` support to the engine.

### IN-18: Use cases import other use cases

**Files:**
- `application/generar-formulario.ts:9` and `armar-paquete.ts:14` import `mapeoCanonico`/`escribirMapeo` from the `mapear-campos` use case.
- `application/simular-envio.ts:4` imports `evaluarEstadoPaquete` from the `armar-paquete` use case.

**Fix:** extract `application/services/mapeo-canonico.service.ts` and `estado-paquete.service.ts` (WR-12). Each `*.use-case.ts` then exports exactly one function. G5 can check that.

### IN-19: `ARCHIVOS_SALIDA` mixes names and `paquete/` paths, and the write whitelist is wider than its callers

**Files:**
- `config/constantes.ts:37-58` holds `paqueteFormularioXlsx: "paquete/formulario.xlsx"`.
- `NOMBRES_RESERVADOS_PAQUETE` strips the prefix, and `infra/salida/copias.ts:23-25` adds it back.
- `infra/salida/archivos.ts:6` whitelists every value, including the directory name `"paquete"` and `"log.jsonl"`, as writable file names. Typed callers never pass those, so this is not exploitable today.

**Fix:**
- Split the table into `ARCHIVOS_SALIDA` (case root: `mapeo`, `formularioXlsx`, …, `envioSimulado`) and `ARCHIVOS_PAQUETE` (`checklist`, `borradorCorreo`, plus the formulario copies reusing `ARCHIVOS_SALIDA` names), with `DIRECTORIO_PAQUETE = "paquete"`.
- Derive the write whitelist from the `ArchivoSalida`/`ArchivoBinario` keys only.

---

## Migration order

Each step is one or more commits, and each must keep `bun run check`, `bun test` and a byte-identical `bun run demo.ts` stdout green. Each step lands its own guard in the same commit, so the convention is locked as soon as it holds. Goldens must not change through step 6. Only step 8 changes output.

1. **Aliases (WR-16).**
   - Add `paths` `@/*`, `@tests/*` to `tsconfig.json`.
   - In the same commit, make `capaDeDestino` and `dependenciasLocales` alias-aware while still accepting relative specifiers, and add the aliased-cycle sample test.
   - Codemod every relative specifier (including `./` and the dynamic imports at `architecture.test.ts:200,206`), then run `biome check --write`.
   - Add **G1** (no relative specifiers).
2. **Config split (WR-15, WR-13 structure).**
   - Move the contents of `constantes.ts` verbatim into `src/config/constants/*.constants.ts` and delete `constantes.ts`.
   - Move `esFechaReal` to `domain/fecha.ts`.
   - Add the `config-pure`/`config-env` layers and the new `PERMITIDOS` matrix.
   - Add **G9** and **G10**.
3. **Code families (WR-11), one commit per family.**
   - Order: errors, campo, formato/plantilla, soporte/vigencia, lectura, regla/hoja/nota, archivos/claves, herramientas, máscara/color.
   - Move the scattered constants into their files, switch zod to `z.enum(OBJ)`, and derive the schema keys.
   - Drop `Entorno.patronCaso`.
   - Add **G6**, **G7** and Biome `noEnum`.
4. **Strings (WR-14), one commit per area.**
   - Order: errors, PDF/XLSX, domain texts, tool descriptions and args, infra messages, demo.
   - Pure moves only. Goldens stay byte-identical, which is the safety net.
   - Add **G8**.
5. **Types (WR-10), one commit per layer.**
   - Order: domain, application, infra, tools/demo, test helpers.
   - Add **G3** and **G4**.
6. **Renames (WR-12, WR-20, IN-16, IN-18).**
   - `git mv` with specifier-only diffs, one commit per layer.
   - Extract the application services.
   - Update the `wiring`/`proveedor` special cases in `capaDeRuta`.
   - Rename the infra identifiers in a separate commit.
   - Add **G5** and Biome `useFilenamingConvention` (`filenameCases: ["kebab-case"]`, `requireAscii: true`).
7. **Clarity refactors** (WR-19, IN-13, IN-14, IN-15, IN-17, IN-19). Behavior-neutral; the goldens prove it.
8. **Behavior-visible fixes:**
   - WR-17 (checklist columns + paquete golden)
   - WR-18 (prefixed tool names + contract test messages)

## New guards for `tests/architecture.test.ts`

Each guard needs a "bites on sample" test, as the existing guards have.

**G1. No relative imports.**
- Applies to `src/**`, `tests/**` and `demo.ts`.
- No specifier may start with `.` (static, `export … from`, or dynamic `import()`).
- The only exceptions are sample strings inside test literals, which the regex already ignores when they are not real import statements.

**G2. Alias resolution.**
- `@/x` → `src/x` and `@tests/x` → `tests/x`, used both by the layer check and by cycle detection.
- Sample: an aliased cycle must be reported.

**G3. Exported types only in `*.type.ts` under `/types/`.**
- Flag `^export\s+(type|interface)\s` and `export\s+(type\s+)?\{[^}]*\btype\b` outside `**/types/*.type.ts`.
- Allowlist: `src/config/env.ts` (`ToolEnv`).

**G4. Type files are type-only.**
- In `*.type.ts`, no `export (const|let|function|class|default)`, and only `import type`.

**G5. Suffix table.**
- Every file must match its folder's row in the WR-12 table.
- Base names must be kebab-case: `^[a-z0-9]+(-[a-z0-9]+)*`.
- `src/domain/*.ts` outside `types/` must have no role suffix.
- Each `use-cases/*.use-case.ts` exports exactly one function.
- Fixed exceptions: `demo.ts`, `src/tools/proveedor.ts`, `src/config/strings.ts`, `src/config/env.ts`, `src/knowledge/**`.

**G6. No string-literal comparisons for known code families.**
- Import every family object and build the set of their values at test time, so the set is exact and always current.
- In `src/**` outside `src/config/**`, flag:
  - `(===|!==)\s*"v"` and `case "v"`
  - `fallo\("`
  - `\b(estado|tipo|regla|codigo|formato|aplica|color)\s*:\s*"v"`
- Exclude `tests/**`. Goldens should keep literal expectations, so a typo in a constant is not mirrored into the assertion.

**G7. No TS `enum`.**
- Biome `noEnum: "error"` plus `/\benum\s+[A-Z]/` in the scan.

**G8. Human-readable text only in `strings.ts`.**
- In `src/**` outside `src/config/strings.ts` and `src/knowledge/**`, flag any string or template literal with two or more alphabetic words: `/[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/`.
- Allowlist: pure formatting tokens and the PRD export names.
- Approximate but useful. Pair it with the sample tests.

**G9. `config-pure` purity.**
- `src/config/constants/**` and `strings.ts` import only `config-pure`.
- They contain no `process.env`, `Bun.env`, `import.meta`, `node:`, `Bun.` or `zod`.

**G10. Env reads only in `env.ts`.**
- `process.env`/`Bun.env` appear only in `src/config/env.ts` (plus the demo FECHA pin, if kept per IN-04).

**G11. (Optional) No regex literals outside `patterns.constants.ts`.**
- Flag `new RegExp(` and regex literals.
- Allowlist: `src/domain/motor-plantillas.ts` (the WR-13 judgment).

**G12. Tool references in model-facing strings carry the `proveedor_` prefix (WR-18).**
- Every `HERRAMIENTA` value that appears in `strings.ts` must be preceded by `PREFIJO_HERRAMIENTA`.

---

_Reviewed: 2026-10-13T00:26:56Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
