---
phase: 04-m-dulo-documentaci-n-y-defensa
plan: 02
subsystem: modulo
tags: [opencode, re-export, tsconfig-alias, guardian, mod-02]

requires:
  - phase: 04-01
    provides: modulo/agent.md, modulo/skill/registro-proveedor/SKILL.md, modulo.constants.ts and TEXTO_MODULO.descripcionAgente
  - phase: 01
    provides: src/tools/proveedor.ts (the five tools) and the confirmado guard of simular_envio
provides:
  - modulo/tools/proveedor.ts (named re-export of the five app tools, identity-tested)
  - .opencode/tools/proveedor.ts (OpenCode discovery link through the @modulo/ alias)
  - opencode.json (agent registro-proveedor + skills ./modulo/skill + default_agent)
  - modulo/README.md (pieces, mounting, D-80 limit, D-83 not rehearsed live)
  - guardian layers modulo and opencode, alias @modulo/, tsconfig coverage of modulo and .opencode
affects: [04-03, 04-04, SOLUCION.md, README.md, CI]

actuals:
  tokens: 6706
  tasks: 2
  commits: 4
plan_head_before: 082e45dab761b7475f1a75b1af7cc9c5293e4f62
plan_head_after: 786e47bf71c63329b26b458896453968e48b4e30

tech-stack:
  added: []
  patterns:
    - "Re-export, never copy: the module's tools are asserted === to the app's exports"
    - "Dot-directory coverage: tsc needs the explicit glob .opencode/**/*.ts; guardians scan it as its own pattern"
    - "Config contract test: opencode.json parsed with a strict zod object and compared with the generated frontmatter"

key-files:
  created:
    - modulo/tools/proveedor.ts
    - .opencode/tools/proveedor.ts
    - opencode.json
    - modulo/README.md
    - tests/modulo/herramientas.test.ts
    - tests/modulo/opencode.test.ts
  modified:
    - tsconfig.json
    - tests/architecture.test.ts
    - tests/sin-comentarios.test.ts
    - .claude/CLAUDE.md
    - docs/estructura.md

key-decisions:
  - "Layer modulo may import only the proveedor layer (src/tools/proveedor.ts); layer opencode may import only modulo, so .opencode never bypasses modulo/"
  - "The @modulo/ alias exists in tsconfig and in the guardian alias table, and only .opencode/ uses it; no src/ layer lists modulo as a target"
  - "opencode.json prompt stays {file:./modulo/agent.md} per D-96; the frontmatter preamble and the one-line switch to agent/prompt.md are documented in modulo/README.md"
  - "The OpenCode naming test derives <archivo>_<export> from the link's own filename and compares it with NOMBRE_VISIBLE"

patterns-established:
  - "Each fixed-name file outside src/ (modulo/tools/proveedor.ts, .opencode/tools/proveedor.ts) gets its own layer, its own exact NOMBRES_CON_ROL entry and violation samples"

requirements-completed: [MOD-01, MOD-02]

coverage:
  - id: D1
    description: "modulo/tools/proveedor.ts re-exports the five app tools; each export is === the app's and the list is exactly the five PRD names"
    requirement: MOD-02
    verification:
      - kind: unit
        ref: "tests/modulo/herramientas.test.ts#exporta exactamente las cinco herramientas y cada una es la misma referencia que la app"
        status: pass
      - kind: unit
        ref: "tests/architecture.test.ts#modulo/tools/proveedor.ts cumple el mismo contrato de las cinco herramientas (MOD-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "modulo/tools/proveedor.ts and .opencode/tools/proveedor.ts import in a Bun process with an empty environment, exit 0 and list the five tools"
    requirement: MOD-02
    verification:
      - kind: integration
        ref: "tests/modulo/herramientas.test.ts#se importa con el entorno vacío, sin servidor, y lista las cinco herramientas"
        status: pass
      - kind: integration
        ref: "tests/modulo/herramientas.test.ts#se importa con el entorno vacío y lista las cinco herramientas"
        status: pass
    human_judgment: false
  - id: D3
    description: "proveedor_simular_envio reached through the module still rejects a call without confirmado: true (T-04-03)"
    requirement: MOD-02
    verification:
      - kind: integration
        ref: "tests/modulo/herramientas.test.ts#proveedor_simular_envio del módulo rechaza la llamada sin confirmado: true"
        status: pass
    human_judgment: false
  - id: D4
    description: ".opencode/tools/proveedor.ts links modulo/ through @modulo/; OpenCode's <archivo>_<export> names equal NOMBRE_VISIBLE"
    requirement: MOD-01
    verification:
      - kind: unit
        ref: "tests/modulo/herramientas.test.ts#OpenCode nombra cada herramienta <archivo>_<export> y coincide con proveedor_<export> de la app"
        status: pass
      - kind: unit
        ref: "tests/architecture.test.ts#la capa opencode solo enlaza modulo/ y nunca salta a src/"
        status: pass
    human_judgment: false
  - id: D5
    description: "opencode.json declares $schema, default_agent, skills ./modulo/skill and agent registro-proveedor whose description, mode and permission equal modulo/agent.md frontmatter; every referenced path exists"
    requirement: MOD-01
    verification:
      - kind: unit
        ref: "tests/modulo/opencode.test.ts#la descripción, el modo y los permisos del agente son los del frontmatter de modulo/agent.md"
        status: pass
      - kind: unit
        ref: "tests/modulo/opencode.test.ts#cada ruta que nombra existe desde la raíz del repo"
        status: pass
    human_judgment: false
  - id: D6
    description: "OpenCode actually discovers the agent, skill and tools when opened at the repo root"
    requirement: MOD-01
    verification: []
    human_judgment: true
    rationale: "D-83 forbids a live OpenCode run; the format is verified against the docs only (assumptions A1/A2 in RESEARCH). Only a live session can confirm skill discovery and alias resolution."
  - id: D7
    description: "modulo/README.md documents mounting, the D-80 confirmation limit, the {file:} frontmatter preamble and that the format was not rehearsed live"
    requirement: MOD-01
    verification:
      - kind: other
        ref: "grep -ci confirmado modulo/README.md (2); grep -ci opencode modulo/README.md (11)"
        status: pass
    human_judgment: true
    rationale: "Whether the Spanish text is clear and makes no live-run claim is an editorial judgment for the user."

duration: 5min
completed: 2026-10-16
status: complete
---

# Phase 4 Plan 02: Herramientas del módulo y enlace de OpenCode Summary

**`modulo/tools/proveedor.ts` re-exports the app's five tools by reference (`===`, importable with an empty env), `.opencode/tools/proveedor.ts` links it through a new `@modulo/` alias, and `opencode.json` registers the `registro-proveedor` agent (`{file:./modulo/agent.md}`) and the `./modulo/skill` folder. Every link has a guardian layer, a contract test and Spanish docs in `modulo/README.md`.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-10-16T04:21:31Z
- **Completed:** 2026-10-16T04:26:37Z
- **Tasks:** 2 (Task 1 tracer, Task 2 expansion)
- **Files modified:** 11 (6 created, 5 modified)

## Accomplishments

- `modulo/tools/proveedor.ts` is a 7-line named re-export of `@/tools/proveedor.ts`. Each export is the app's own object, so the `confirmado: true` guard of `proveedor_simular_envio` comes along with it (MOD-01, MOD-02, D-81, T-04-03).
- Both `modulo/tools/proveedor.ts` and `.opencode/tools/proveedor.ts` import in a Bun process with `env: {}`, exit 0 and list the five tools (D-82, T-04-05).
- `.opencode/tools/proveedor.ts` re-exports `@modulo/tools/proveedor.ts`, so OpenCode names the tools `proveedor_<export>`, the same as `NOMBRE_VISIBLE` (D-96).
- `opencode.json` is pinned by a strict zod contract test against the generated frontmatter and `TEXTO_MODULO.descripcionAgente`. The test also checks that the agent, skill and tool-link paths exist (D-83, D-96).
- Guardian: the new layers `modulo` (only `proveedor`) and `opencode` (only `modulo`), the `@modulo/` alias, exact names, scans of `modulo/**/*.ts` and `.opencode/**/*.ts` (layers, G1, G3–G16, shell, no comments) and violation samples for each rule (T-04-04). tsc type-checks both files (D-62).
- `modulo/README.md` covers the three pieces, their tests, how to mount the module in OpenCode, the D-80 limit, the `{file:}` frontmatter preamble, and that the format was not rehearsed live (D-83).

## Task Commits

1. **Task 1 (tracer): host imports modulo/tools/proveedor.ts without server or env**
   - RED `0b6b06c` (test): identity, empty-env import, confirmation guard, modulo guardian samples, no-comments scan assertion
   - GREEN `55319cf` (feat): re-export, tsconfig `modulo`, guardian layer/name/scan, CLAUDE.md, docs/estructura.md
2. **Task 2: OpenCode wiring**
   - RED `9b667f6` (test): .opencode identity/env/naming tests, opencode.json contract, opencode guardian samples
   - GREEN `786e47b` (feat): .opencode link, opencode.json, modulo/README.md, `@modulo/*` alias and `.opencode/**/*.ts` include, guardian layer/alias/scan, docs

No REFACTOR commits were needed.

## TDD Evidence

- **Task 1 RED:** 8 tests failed. In the 3 module tests, two loaded a module that did not exist (`Cannot find module …/modulo/tools/proveedor.ts`), and the empty-env spawn exited 1 where the test expected 0. That RED only shows the file was absent. The 5 guardian and scan tests failed on their `toEqual` and `toContain` assertions, because the `modulo` layer, its name and its scan were not declared. Semantic assessment: the guardian RED is valid and assertion-level. The module RED shows absence.
- **Task 2 RED:** 11 tests failed. The .opencode and opencode.json tests failed on a missing module or file (ENOENT), and on assertions: the empty-env exit code and `existsSync`. The guardian samples failed on their assertions: the alias resolved to `null`, the layer was undeclared and the name was rejected. "ninguna capa de src/ importa modulo/" already passed in RED. That is expected for a regression guard, because an unknown specifier is rejected anyway.
- `workflow.tdd_mode` is not enabled, so no `tdd-red-evidence` record was submitted. The evidence above comes from the actual `bun test` output.
- **GREEN:** `bun test` passed 2375 tests with 0 failures (1 live test skipped). `bun run check` is green: tsc, the web tsc, Biome on 437 files and audit.

## Files Created/Modified

- `modulo/tools/proveedor.ts`: named re-export of `armar_paquete`, `generar_formulario`, `leer_solicitud`, `mapear_campos`, `simular_envio` from `@/tools/proveedor.ts`
- `.opencode/tools/proveedor.ts`: the same five names re-exported from `@modulo/tools/proveedor.ts`
- `opencode.json`: `$schema`, `default_agent`, `skills: ["./modulo/skill"]`, agent `registro-proveedor` (Biome-formatted, written by hand)
- `modulo/README.md`: Spanish guide to the module and its limits
- `tsconfig.json`: `@modulo/*` alias; include `modulo` and `.opencode/**/*.ts`
- `tests/architecture.test.ts`: layers `modulo` and `opencode`, alias, `escanearCarpetas` helper, exact names, CAL-04 module contract, real-code and violation tests
- `tests/sin-comentarios.test.ts`: scans `modulo` and `.opencode`
- `tests/modulo/herramientas.test.ts`, `tests/modulo/opencode.test.ts`: new
- `.claude/CLAUDE.md`, `docs/estructura.md`: module and OpenCode link rules, `@modulo/` alias

## Decisions Made

- `modulo` → `proveedor` only and `opencode` → `modulo` only. A direct `.opencode` → `@/tools/proveedor.ts` import is reported, so `modulo/` stays the single source (D-96).
- The confirmation-guard test calls the module's own `simular_envio` (narrowed with a type guard), not the app's, so it proves the guard travels with the re-export.
- `opencode.json` follows D-96 with `{file:./modulo/agent.md}`. The frontmatter preamble is documented, and the one-line alternative `{file:./agent/prompt.md}` is flagged for the user.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extra guardian samples beyond the plan's list**
- **Found during:** Tasks 1 and 2
- **Issue:** The plan listed one forbidden import per layer. The safety boundary (T-04-04) also covers `config/env.ts` and `node:` in `modulo`, and needs a check that no `src/` layer can import `@modulo/`.
- **Fix:** Added those samples, a `dependenciasLocales` assertion that the real link points only at `modulo/tools/proveedor.ts`, and a strict-schema bite test for `opencode.json` (foreign key, agent without prompt).
- **Files modified:** tests/architecture.test.ts, tests/modulo/opencode.test.ts
- **Committed in:** 0b6b06c, 9b667f6

---

**Total deviations:** 1 auto-fixed (Rule 2, test coverage only)
**Impact on plan:** None on scope. The extra tests pin boundaries the plan's threat model already requires.

## Issues Encountered

- Biome reformatted one long line in each RED test file before its commit. The changes were format-only.
- Commits land on `main` because this sequential executor ran on the main working tree (`branching_strategy: none`), as in earlier plans.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- `modulo/` is complete: `agent.md`, `skill/`, `tools/proveedor.ts` and `README.md`. SOLUCION.md and README.md (later plans) can cite `modulo/README.md` for the D-80 and D-83 limits.
- For the user's D-96 review: the prompt uses `{file:./modulo/agent.md}`, so OpenCode receives the frontmatter as a preamble. The clean alternative is a one-line change.
- CI (plan 04-03) runs these tests as part of `bun test`. Nothing extra is needed.

## Self-Check: PASSED

- FOUND: modulo/tools/proveedor.ts, .opencode/tools/proveedor.ts, opencode.json, modulo/README.md, tests/modulo/herramientas.test.ts, tests/modulo/opencode.test.ts
- FOUND commits: 0b6b06c, 55319cf, 9b667f6, 786e47b
- Plan verification: `bun test tests/modulo tests/architecture.test.ts tests/sin-comentarios.test.ts` 123 pass / 0 fail; tsc `--listFilesOnly` lists both `modulo/tools/proveedor.ts` and `.opencode/tools/proveedor.ts`; `bun run check` green; full `bun test` 2375 pass / 0 fail.

---
*Phase: 04-m-dulo-documentaci-n-y-defensa*
*Completed: 2026-10-16*
