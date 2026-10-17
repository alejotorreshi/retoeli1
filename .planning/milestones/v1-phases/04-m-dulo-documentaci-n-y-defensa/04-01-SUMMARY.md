---
phase: 04-m-dulo-documentaci-n-y-defensa
plan: 01
subsystem: modulo
tags: [opencode, generator, cli, byte-equality, bun-yaml, guardian]

requires:
  - phase: 02
    provides: agent/prompt.md and src/knowledge/registro-proveedor.md (the bodies the module reuses byte for byte)
  - phase: 03
    provides: guardian layout (G1-G16, layer rules, IN-21) the new cli layer plugs into
provides:
  - src/cli layer (runners, schemas, types) declared, guarded and documented
  - "`bun run modulo` generator: archivosDelModulo(raiz) and generarModulo({ raiz, escribir })"
  - modulo/agent.md (OpenCode agent frontmatter + exact bytes of agent/prompt.md)
  - modulo/skill/registro-proveedor/SKILL.md (skill frontmatter + exact bytes of the process knowledge)
  - byte-equality, drift, empty/missing-source and idempotency tests
affects: [04-02, 04-03, 04-04, modulo/README, SOLUCION.md, CI]

actuals:
  tokens: 16330
  tasks: 2
  commits: 4
plan_head_before: ebb49454fd2644537d541a496fdf54a2cb19c7b9
plan_head_after: fb19b44540325c7046e4e35fe5ff91f362df8eac

tech-stack:
  added: []
  patterns:
    - "Generated-and-committed artifact with a byte-equality test against the generator (single source, drift fails CI)"
    - "YAML frontmatter values emitted with JSON.stringify (JSON strings are valid YAML double-quoted scalars)"
    - "cli runner: exported pure-ish functions plus an import.meta.main entry that sets process.exitCode"

key-files:
  created:
    - src/config/constants/modulo.constants.ts
    - src/domain/builders/modulo.builder.ts
    - src/cli/types/modulo.type.ts
    - src/cli/runners/generar-modulo.runner.ts
    - modulo/agent.md
    - modulo/skill/registro-proveedor/SKILL.md
    - tests/modulo/generador.test.ts
    - tests/unit/modulo.builder.test.ts
  modified:
    - src/config/constants/files.constants.ts
    - src/config/strings.ts
    - package.json
    - tests/architecture.test.ts
    - .claude/CLAUDE.md
    - docs/estructura.md

key-decisions:
  - "src/cli may import http only as `import type` from src/http/types/** (guarded by violacionesDeHttpEnCli); every other cli target is in PERMITIDOS.cli"
  - "Sources are read as raw bytes with Bun.file().bytes(); the trimming instructions loader is never used, so the body is byte-identical"
  - "Both sources are validated (missing -> ausente, whitespace-only -> vacia) before anything is written; a broken source leaves no modulo/ at all"
  - "descripcionSkill derives the tool names from NOMBRE_VISIBLE and ORDEN_FLUJO_HERRAMIENTAS instead of repeating them"

patterns-established:
  - "cli layer: cli/runners/*.runner.ts, cli/schemas/*.schema.ts, cli/types/*.type.ts; nobody imports cli"
  - "Generator tests run in a mkdtemp root with package.json plus copied sources, and compare Buffer bytes, never decoded strings"

requirements-completed: [MOD-01, MOD-02]

coverage:
  - id: D1
    description: "modulo/agent.md is the OpenCode agent: frontmatter (description, mode primary, permission edit/bash deny) followed by the exact bytes of agent/prompt.md"
    requirement: MOD-01
    verification:
      - kind: unit
        ref: "tests/modulo/generador.test.ts#el cuerpo después del frontmatter es exactamente agent/prompt.md"
        status: pass
      - kind: unit
        ref: "tests/modulo/generador.test.ts#el frontmatter declara descripción, modo primario y niega edición y shell"
        status: pass
    human_judgment: false
  - id: D2
    description: "modulo/skill/registro-proveedor/SKILL.md is the OpenCode skill: name equal to its directory, description, and the exact bytes of src/knowledge/registro-proveedor.md"
    requirement: MOD-01
    verification:
      - kind: unit
        ref: "tests/modulo/generador.test.ts#el cuerpo después del frontmatter es exactamente el conocimiento del proceso"
        status: pass
      - kind: unit
        ref: "tests/modulo/generador.test.ts#name coincide con su carpeta y cumple la regla de nombres de skills de OpenCode"
        status: pass
    human_judgment: false
  - id: D3
    description: "`bun run modulo` regenerates both files idempotently and the committed files equal the generator output byte for byte; drift fails the test"
    requirement: MOD-02
    verification:
      - kind: unit
        ref: "tests/modulo/generador.test.ts#el archivo commiteado es byte a byte la salida del generador"
        status: pass
      - kind: unit
        ref: "tests/modulo/generador.test.ts#la deriva muerde: un byte más en el conocimiento ya no coincide con el commiteado"
        status: pass
      - kind: other
        ref: "bun run modulo && bun run modulo && git diff --exit-code -- modulo"
        status: pass
    human_judgment: false
  - id: D4
    description: "The generator fails with exit code 1 and a clear message, writing nothing, when a source is missing, empty or whitespace-only, or when run outside the project root"
    requirement: MOD-02
    verification:
      - kind: integration
        ref: "tests/modulo/generador.test.ts#un conocimiento ausente devuelve fallido, avisa fuenteAusente y no escribe agent.md"
        status: pass
      - kind: integration
        ref: "tests/modulo/generador.test.ts#un prompt vacío devuelve fallido, avisa fuenteVacia y no crea modulo/"
        status: pass
    human_judgment: false
  - id: D5
    description: "The src/cli layer is declared in the guardian with violation-proof tests and documented in .claude/CLAUDE.md and docs/estructura.md"
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts#la capa cli solo toma tipos de http/types con import type"
        status: pass
      - kind: unit
        ref: "tests/architecture.test.ts#G5 y G13: roles y sufijos de la capa cli"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-10-16
status: complete
---

# Phase 4 Plan 01: Generador del módulo OpenCode Summary

**`bun run modulo` writes `modulo/agent.md` and `modulo/skill/registro-proveedor/SKILL.md` as an OpenCode frontmatter plus the raw bytes of `agent/prompt.md` and `src/knowledge/registro-proveedor.md`. A byte-equality test fails on any drift, and the generator lives in a new guarded `src/cli` layer.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-10-16T04:12:37Z
- **Completed:** 2026-10-16T04:19:23Z
- **Tasks:** 2 (Task 1 tracer, Task 2 expansion)
- **Files modified:** 14 (8 created, 6 modified)

## Accomplishments

- `modulo/agent.md`: frontmatter `description` / `mode: primary` / `permission { edit: deny, bash: deny }` followed by the exact bytes of `agent/prompt.md` (MOD-01, D-79).
- `modulo/skill/registro-proveedor/SKILL.md`: frontmatter `name: registro-proveedor` / `description` followed by the exact bytes of the process knowledge (MOD-01, D-79).
- The `bun run modulo` generator is idempotent, refuses to run outside the root, and exits with code 1 without writing anything when a source is missing, empty or whitespace-only (MOD-02, D-82).
- The new `src/cli` layer is in the guardian: `PERMITIDOS.cli`, layer detection, the `cli/runners` role, `cli` in the types and schemas alternations, IN-21 coverage, and `MOTIVO_FUENTE_MODULO` in G6. A rule allows `http` only as `import type` from `http/types/**`. Every rule has a violation-proof test. The layer is documented in `.claude/CLAUDE.md` and `docs/estructura.md` (D-62).

## Task Commits

1. **Task 1 (tracer): `bun run modulo` writes modulo/agent.md inside a guarded src/cli layer**
   - RED `f4f516b` (test): generator test (agent part) + cli guardian samples
   - GREEN `dde1b53` (feat): constants, strings, builder, types, runner, script, agent.md, guardian, CLAUDE.md, docs
2. **Task 2: skill + loud failure on missing/empty source**
   - RED `efc529d` (test): skill, drift, empty/missing, idempotency and builder unit tests
   - GREEN `fb19b44` (feat): frontmatterSkill, two-source validation, descripcionSkill, SKILL.md

No REFACTOR commits were needed.

## TDD Evidence

- **Task 1 RED:** 4 guardian sample tests failed on their `toEqual` assertions because the cli layer was not declared. "ninguna otra capa importa cli" already passed, as expected for a regression guard: undeclared targets are rejected. `tests/modulo/generador.test.ts` failed to load (`Cannot find module '@/cli/runners/generar-modulo.runner.ts'`). That is a load failure, not an assertion RED. Semantic assessment: the guardian RED is valid. The generator RED only shows that the module was absent.
- **Task 2 RED:** the committed RED run was a load failure (`Export named 'frontmatterSkill' not found`). After adding only `frontmatterSkill` and before touching the runner, 10 runner tests failed on their planned assertions: the skill files, the drift, the empty prompt (both cases), the empty and missing knowledge, and idempotency. The 14 builder and agent tests passed. Semantic assessment: valid assertion-level RED for the runner behavior.
- `workflow.tdd_mode` is not enabled. No JUnit RED record was submitted to `tdd-red-evidence`, so the evidence above comes from the actual `bun test` output.
- **GREEN:** `bun test` passed 2355 tests with 0 failures (2356 total, 1 skipped live test). `bun run check` is green.

## Files Created/Modified

- `src/config/constants/modulo.constants.ts`: directories, file names, skill name, frontmatter delimiter, YAML indent, `CLAVE_FRONTMATTER`, `MODO_AGENTE_MODULO`, `PERMISO_MODULO`, `MOTIVO_FUENTE_MODULO`
- `src/config/constants/files.constants.ts`: `DIRECTORIO_CONOCIMIENTO = "src/knowledge"`
- `src/config/strings.ts`: `TEXTO_MODULO` (descripcionAgente, descripcionSkill, generado, fuenteAusente, fuenteVacia, fueraDeLaRaiz)
- `src/domain/builders/modulo.builder.ts`: `frontmatterAgente`, `frontmatterSkill`, `conFrontmatter` (pure, byte concatenation)
- `src/cli/types/modulo.type.ts`: `ArchivoModulo`, `MotivoFuenteModulo`, `LecturaModulo`, `OpcionesGeneracion`, `ResultadoGeneracion`
- `src/cli/runners/generar-modulo.runner.ts`: `archivosDelModulo`, `generarModulo`, CLI entry under `import.meta.main`
- `package.json`: script `"modulo": "bun src/cli/runners/generar-modulo.runner.ts"`
- `modulo/agent.md`, `modulo/skill/registro-proveedor/SKILL.md`: generated and committed
- `tests/modulo/generador.test.ts`: byte equality, frontmatter contract, drift, empty/missing source, outside root, idempotency
- `tests/unit/modulo.builder.test.ts`: YAML round-trip with colon, quotes, backslash and ñ; BOM and CRLF body kept intact
- `tests/architecture.test.ts`: cli layer rules plus violation-proof tests
- `.claude/CLAUDE.md`, `docs/estructura.md`: cli layer documented ("Capa CLI" section, `modulo` in builders)

## Decisions Made

- `cli` gets `http` only through `import type` from `src/http/types/**`. The rule is stricter than "any type-only import": a type import from `http/schemas` or `http/services` is also reported.
- Missing or empty sources are checked for both files before anything is returned, so a broken knowledge file never leaves a fresh `agent.md` behind.
- The descriptions are JSON-quoted (`JSON.stringify`) so colons, quotes and accents survive `Bun.YAML.parse` unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Two extra failure tests (missing prompt, outside root)**
- **Found during:** Task 2
- **Issue:** The plan listed empty prompt and missing knowledge. It did not list the symmetric missing prompt or the outside-root refusal, which Task 1 had implemented without a test.
- **Fix:** Added tests for both, plus an "agent first, then skill" order test.
- **Files modified:** tests/modulo/generador.test.ts
- **Committed in:** efc529d

---

**Total deviations:** 1 auto-fixed (Rule 2, test coverage only)
**Impact on plan:** None on scope. The extra coverage pins behavior that was already implemented.

## Issues Encountered

- Biome reformatted one long `RegExp` line in `tests/architecture.test.ts` and one string in the unit test. These were format-only fixes, applied before each commit.
- Commits land on `main` because the orchestrator ran this sequential executor on the main working tree (`branching_strategy: none`), as in phases 1 to 3.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- `modulo/` now has `agent.md` and `SKILL.md`. Plan 04-02 can add `modulo/tools/proveedor.ts`, `modulo/README.md` and `opencode.json` on top of them.
- The `src/cli` layer is ready for the pre-flight runner of plan 04-04. `config/env.ts`, `eventsource-parser` and `import type` from `http/types` are already allowed.
- CI (plan 04-03) only needs to run `bun test`. The drift test is part of the normal suite.

## Self-Check: PASSED

- FOUND: src/config/constants/modulo.constants.ts, src/domain/builders/modulo.builder.ts, src/cli/types/modulo.type.ts, src/cli/runners/generar-modulo.runner.ts, modulo/agent.md, modulo/skill/registro-proveedor/SKILL.md, tests/modulo/generador.test.ts, tests/unit/modulo.builder.test.ts
- FOUND commits: f4f516b, dde1b53, efc529d, fb19b44
- Plan verification: `bun test tests/modulo tests/unit/modulo.builder.test.ts tests/architecture.test.ts tests/sin-comentarios.test.ts` green; `bun run modulo` twice leaves `git diff -- modulo` empty; `bun run check` green.

---
*Phase: 04-m-dulo-documentaci-n-y-defensa*
*Completed: 2026-10-16*
