---
phase: 01-n-cleo-determinista
fixed_at: 2026-10-13T01:51:12Z
review_path: .planning/phases/01-n-cleo-determinista/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-10-13T01:51:12Z
**Source review:** .planning/phases/01-n-cleo-determinista/01-REVIEW.md (layout: role folders for domain and tools, WR-21..WR-24, IN-20..IN-22)
**Iteration:** 1
**Scope:** all (warnings and info)

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0
- Commits: 17, from `3689a2f` to `2b8148f`. They follow the review's 13-step migration order, and each one is an atomic Conventional Commit. Two steps have more than one commit:
  - Step 10 has two commits (the pure `git mv`, then the describe extraction), as the review asks.
  - Step 13 has three commits, one each for IN-20, IN-21 and IN-22, so each finding can be traced on its own.

  `docs/estructura.md` was added in one more `docs(01)` commit, because WR-21 asks to "say so in `docs/`".
- The guards are now G1–G14 in `tests/architecture.test.ts`:
  - G5 is table-driven.
  - G13 and G14 are new.
  - Each guard has a test that shows it catches a violation.
- `.claude/CLAUDE.md` changed in "Reglas de código del proyecto" only, with the user's authorization. The "El dominio va sin sufijo" bullet was replaced, the regex-exception path was updated, and G1–G12 became G1–G14.

## Verification

**Where verification ran.** The per-commit gates ran in an isolated git worktree, `.claude/worktrees/rf-01-79452-*`, on the temp branch `gsd-reviewfix/01-79452`. It had no `node_modules` of its own and resolved the main checkout's through the parent directories. The final gates ran again in the **main checkout** after the fast-forward, so the numbers below can be reproduced from `main` at `2b8148f`. The worktree, its temp branch and the recovery sentinel were removed.

Before every commit, these ran: `bunx biome check --write .`, `bun run check` (tsc, Biome, `bun audit`) and `bun test`. After steps 7, 9, 12 and 13 and at the end, these also ran:
- two `bun run demo.ts` runs, compared byte for byte against each other and against the pre-fix baseline;
- a diff of `out/` (xlsx compared by unzipped XML, `log.jsonl` excluded);
- a snapshot of the tool contract (description plus `z.toJSONSchema` of every tool's args).

Final run in the main checkout:
- `bun run check`: green. `bun audit` found no vulnerabilities.
- `bun test`: 442 pass, 0 fail, 34 files. Before the fixes: 436 pass, 31 files.
  - +4 from the G13 and G14 checks on real code and their bite tests.
  - +3 from the identificador-tributario policy tests (5 per-country cases moved there, 1 null case and 1 etiquetasGenericas case added; detectarAmbiguos keeps 1 end-to-end case).
  - -1 net from IN-22 (the two `aTexto` tests became one `leerHoja` test).
- `bun run demo.ts` twice: byte-identical. stdout, `out/` and the tool contract are also byte-identical to the pre-fix baseline.
- Truth table unchanged:

  | Case | Llenos / Faltantes / Por confirmar | State |
  |---|---|---|
  | co | 17 / 0 / 0 | LISTO |
  | ec | 13 / 1 / 1 | BLOQUEADO |
  | hn | 9 / 1 / 1 | BLOQUEADO |
  | pa | 8 / 0 / 1 | LISTO |

- Public tool contract unchanged: the same five exports, descriptions and JSON Schemas.
- No comments anywhere (the guard enforces this), no `any`, only `@/` and `@tests/` aliases, and every move used `git mv`. `reto-01/` and `.planning/` were not touched by any commit. All commits are authored by `elianatorres5772 <elianatorres5772@gmail.com>`.
- Guard probes: a temporary `src/domain/zz.ts` plus `tests/unit/zz.policy.test.ts` turned G5, G13 and G14 red. Both files were then deleted.

## Fixed Issues

### WR-21: Domain, tools and demo logic sit loose at their layer root with no role folder (complete rename and split table)

**Files modified:**
- every file in the review's domain, tools and demo tables, moved with `git mv`
- new `src/domain/policies/soportes.policy.ts`, `src/domain/builders/campo-presentado.builder.ts`, `src/domain/policies/plantilla-caso.policy.ts`
- every importer of the moved modules
- `docs/plantillas.md`
- new `docs/estructura.md`

**Commits:** `910c7c9` (utils), `c72ad9d` (engines), `838e648` (builders, policies and selectors that need no split), `5b8b172` (soportes split), `ae7b19a` (campo-presentado split), `80af1f7` (plantilla-caso split), `de85246` (tools), `650512c` (demo runner), `2b8148f` (docs)

**Applied fix:**
- **Domain:** `src/domain/` now holds only `types/` and five role folders:
  - `engines/`: `mapeo`, `motor-plantillas`, kept whole.
  - `builders/`: `borrador`, `campo-presentado`, `checklist`, `formulario`, `glosario`, `portal`. `glosario` is a builder, as the review corrected.
  - `policies/`: `comparar-mapeo`, `identificador-tributario`, `pii`, `plantilla-caso`, `soportes`, `validar-reglas`, `vigencias`.
  - `selectors/`: `maestro`, `solicitud`.
  - `utils/`: `fecha`, `formatear-issues`, `nombre-error`, `normalizar`, `resultado`.
- **Splits:** for each split, the file was moved with `git mv` to the target the review named, and the extracted functions were moved verbatim into the new file:
  - `evaluarSoportes` and its six helpers
  - `presentarCampo` and `valorEnmascarado`
  - `elegirPlantilla`

  The importers listed in the review were repointed: `estado-paquete.service.ts`, `mapear-campos.use-case.ts`, `mapeo-canonico.service.ts`, `contexto-caso.service.ts` and the unit tests.
- **Tools:** `tools/factories/definir-herramienta.factory.ts`, `tools/factories/herramientas.factory.ts` and `tools/wiring/entorno.wiring.ts`. `tools/proveedor.ts` stays at the tools root, as PRD 6.2 requires.
- **Demo:** `demo/runners/ejecutar-demo.runner.ts`.
- **Config:** `config/env.ts` and `config/strings.ts` stay where they are and are allow-listed.
- **Docs:** `docs/plantillas.md` points at `src/domain/engines/motor-plantillas.engine.ts`. The new `docs/estructura.md` documents the roles, why `motor-plantillas` stays whole, why `formatear-issues` and `nombre-error` live in `domain/utils`, and the three root exceptions.

### WR-22: The G5 suffix table, three exact-path guard keys and the CLAUDE.md rule encode "el dominio va sin sufijo"

**Files modified:** `tests/architecture.test.ts`, `.claude/CLAUDE.md`

**Commits:** `3689a2f` (step 1, transitional G5); `c72ad9d` (CLAUDE.md regex-exception path); `de85246` and `650512c` (sample paths); `ef7d4b0` (step 11, final guards and the CLAUDE.md rule)

**Applied fix:**
- **G5:** built from `CARPETAS_DE_ROL`, the review's table of 10 role folders. It now:
  - pins `types/` to the layer root;
  - requires an area folder under `infra/`;
  - accepts `tests/unit/<kebab>.<rol>.test.ts` and keeps every other test under `tests/(?!unit/)`.
- **Transitional patterns:** the loose-file patterns (`src/domain/<kebab>.ts`, `src/tools/*.(factory|wiring|util).ts`, `src/demo/*.runner.ts`) and the dual paths stayed in place through step 10 and were removed in step 11.
- **G5 bite test:** extended with the six rejected and three accepted paths the review lists.
- **G13 (new):** `SUELTO_EN_CAPA` with `SUELTOS_PERMITIDOS` (`tools/proveedor.ts`, `config/env.ts`, `config/strings.ts`), plus its bite test.
- **Exact-path keys:**
  - `DUENOS_DE_REGEX` now holds only `src/domain/engines/motor-plantillas.engine.ts`.
  - `capaDeRuta` treats only `src/tools/wiring/entorno.wiring` as `wiring`.
  - `DESTINOS_DE_HERRAMIENTAS` was **not** widened, so tools still cannot import infra. A new expectation shows that another `src/tools/wiring/otro.wiring.ts` is still layer `tools` and is rejected when it imports `@/infra/**`.
- **Sample paths retargeted:**
  - `src/domain/engines/mapeo.engine.ts` and `@/domain/utils/normalizar.util`
  - `src/tools/wiring/entorno.wiring.ts` and `src/tools/factories/definir-herramienta.factory.ts`
  - `src/demo/runners/ejecutar-demo.runner.ts` and `@/tools/wiring/entorno.wiring`
- **CLAUDE.md:** the kebab-case bullet, including "El dominio va sin sufijo", was replaced with the review's text. That text covers the domain role folders, `tools/factories`, `tools/wiring`, `demo/runners`, the three allowed loose files and the `tests/unit/<módulo>.<rol>.test.ts` rule. The regex exception and "(G1–G14)" were also updated.

### WR-23: Unit test names do not mirror the modules they test, and G5 forbids the mirrored names

**Files modified:** the 14 files in `tests/unit/` (renamed with `git mv`); new `tests/unit/plantilla-caso.policy.test.ts` and `tests/unit/vigencias.policy.test.ts`; `tests/architecture.test.ts`

**Commits:** `aeaa1a5` (pure renames), `deb85ae` (describe extraction), `ef7d4b0` (G14)

**Applied fix:**
- All 14 files were renamed with `git mv` according to the review's table. `tests/unit/` stays flat, so the relative `new URL("../../…")` fixture paths are unchanged.
- **Describes moved verbatim:**
  - `supportIndexSchema` to `fixtures.schema.test.ts`
  - `elegirPlantilla` and its matrix to `plantilla-caso.policy.test.ts`
  - `evaluarVigencia` to `vigencias.policy.test.ts`, with its own `HOY` and `DIAS_AVISO`

  The test count did not change at that commit (436).
- **G14 (new):** `violacionesDeEspejo` with `PRUEBA_UNITARIA`. Its check on real code also asserts that at least one unit test exists, and it has its own bite test.

### WR-24: The tax-identifier rule is computed twice, in `solicitud.ts` and in `mapeo.ts`

**Files modified:** new `src/domain/policies/identificador-tributario.policy.ts`, `src/domain/selectors/solicitud.selector.ts`, `src/domain/engines/mapeo.engine.ts`, new `tests/unit/identificador-tributario.policy.test.ts`, `tests/unit/solicitud.selector.test.ts`

**Commit:** `9d43a5b`

**Applied fix:**
- `etiquetasGenericas(reglas)` and `identificadorDelPais(reglas, pais)` are now the single source of the rule.
- `detectarAmbiguos` (used by `leer_solicitud`) and `contextoDeMapeo` (used by `mapear_campos`) both call them. The private `propia` was deleted.
- **Tests:**
  - The five per-country equivalence cases moved to the policy's mirror test.
  - The policy test also covers the null cases (unknown country, prototype key) and the normalization of the generic labels.
  - `detectarAmbiguos` keeps one end-to-end case (`HN` proposes `RTN`) next to its existing null and prototype-key cases.
- Output is byte-identical.

### IN-20: Three groups of domain types no longer sit next to their module's name

**Files modified:** `src/domain/types/{maestro,mapeo,checklist}.type.ts`, new `src/domain/types/{glosario,soportes}.type.ts`, and every `import type` of the moved types (15 files)

**Commit:** `a4dd1be`

**Applied fix:**
- `HojaMaestro` moved to `maestro.type.ts`.
- `Glosario` and `IndiceGlosario` moved to `glosario.type.ts`. `mapeo.type.ts` imports `IndiceGlosario` for `EntradaMapeo`.
- `SoporteIndice`, `EstadoSoporte`, `SoporteEvaluado` and `EntradaEvaluacionSoportes` moved to `soportes.type.ts`. `checklist.type.ts` imports `EstadoSoporte` and `SoporteEvaluado` with `import type`, because `FilaSoporteChecklist` also uses `EstadoSoporte`.
- `types/` stays flat, as the tightened G5 requires.

### IN-21: Exported names that no longer match their role

**Files modified:** `src/domain/builders/formulario.builder.ts`, `src/domain/builders/campo-presentado.builder.ts`, `src/application/use-cases/generar-formulario.use-case.ts`, `src/application/use-cases/mapear-campos.use-case.ts`, `src/application/services/mapeo-canonico.service.ts`, `tests/unit/pii.policy.test.ts`

**Commit:** `875cdf3`

**Applied fix:**
- `construirFilas` was renamed to `construirFormulario`.
- `presentarCampo` was renamed to `construirCampoPresentado` (the optional rename, applied), so every builder export starts with `construir*`.
- `contarEstados` stays in the mapping engine, as the review recommends.

### IN-22: Test-only exports and a dead branch

**Files modified:** `src/domain/selectors/maestro.selector.ts`, `src/domain/utils/normalizar.util.ts`, `src/domain/policies/vigencias.policy.ts`, `tests/unit/normalizar.util.test.ts`, `tests/unit/mapeo.engine.test.ts`, `tests/unit/vigencias.policy.test.ts`

**Commit:** `d44d616`

**Applied fix:**
- `maestro.selector` now uses `String(valor)` for numeric leaves. `aTexto` and its describe were deleted.
- The number and text cases (`98000000000`, `480`, `2025`, `"050021"`, `"+57 604 555 0100"`) are now `leerHoja` assertions in the existing `leerRuta` describe.
- `textoVence` is no longer exported. The plural is asserted through `evaluarVigencia("2026-09-05", HOY, DIAS_AVISO).aviso === "vence en 2 días"`.
- `POLITICA_PII` stays exported, as the review says.
- This is the only change in behavior. It is equivalent for every input the caller can pass, and the demo output stayed byte-identical.

---

_Fixed: 2026-10-13T01:51:12Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
