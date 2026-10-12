---
phase: 01-n-cleo-determinista
plan: 01
subsystem: infra
tags: [bun, typescript, biome, zod, exceljs, pdf-lib, supply-chain, architecture-guard]

requires: []
provides:
  - "reto-01/ tracked exactly as delivered, with Finder metadata ignored"
  - "Pinned toolchain (exact versions, uuid override, committed bun.lock) and bun run check = tsc + biome + bun audit"
  - "tests/architecture.test.ts: layer table over src/**/*.ts and demo.ts, type-only imports included, no-shell scan"
  - "tests/sin-comentarios.test.ts: comment detector over src/, tests/ and demo.ts that skips strings, templates and regex literals"
affects: [01-02, 01-03, 01-04, 01-05, phase-02, phase-03]

actuals:
  tokens: 17527
  tasks: 2
  commits: 2
plan_head_before: 5beb4d97dc9c1f0a67d89b4b3c1a90509c2ab533
plan_head_after: bdfecd3696a22366a7545599ad3fc397d50fb179

tech-stack:
  added: [zod@4.6.5, exceljs@4.4.0, pdf-lib@1.17.1, typescript@7.0.2, "@biomejs/biome@2.5.15", "@types/bun@1.4.2", "uuid@11.1.1 (override)"]
  patterns:
    - "Exact pins with no caret, bun.lock committed, bun audit --audit-level=moderate inside bun run check"
    - "Static guards as bun tests that prove they bite on inline sample sources"

key-files:
  created:
    - .gitignore
    - .dockerignore
    - .bun-version
    - package.json
    - bun.lock
    - tsconfig.json
    - biome.json
    - tests/architecture.test.ts
    - tests/sin-comentarios.test.ts
  modified: []

key-decisions:
  - "Package-legitimacy gate approved by the human with the D-35 pins unchanged (resume signal: approved with bun upgrade); Bun upgraded to 1.4.3 before the first install"
  - "Any src/ file outside a declared layer (domain, application, infra, config, tools, demo) fails the architecture test, so new folders must be added to the layer table explicitly"
  - "The architecture test classifies bare imports: node:* as node, zod/exceljs/pdf-lib by name, anything else (including bare fs or bun) is never allowed"
  - "The no-comments scanner understands regex literals and nested template interpolations, so regex sources with quotes do not confuse it"

patterns-established:
  - "Layer table lives in tests/architecture.test.ts (PERMITIDOS); later plans extend it rather than bypass it"
  - "Guard tests keep an inline-sample describe block proving each rule reports a violation"

requirements-completed: [CAL-01, CAL-02, CAL-04, HERR-04]

coverage:
  - id: D1
    description: "Package-legitimacy and Bun runtime gate resolved before the first install"
    verification: []
    human_judgment: true
    rationale: "A human approved the registry evidence table (blocking-human gate); approval is a judgment, not a test"
  - id: D2
    description: "reto-01/ tracked unchanged and no .DS_Store tracked"
    verification:
      - kind: other
        ref: "git ls-files --error-unmatch reto-01/PRD.md reto-01/fixtures/reto-01/repositorio/maestro.json reto-01/fixtures/reto-01/glosario-campos.json && git status --porcelain -- reto-01 && git ls-files -- '*.DS_Store'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pinned toolchain with bun run check (tsc strict, Biome noExplicitAny, bun audit moderate) green"
    requirement: CAL-01
    verification:
      - kind: other
        ref: "bun run check"
        status: pass
    human_judgment: false
  - id: D4
    description: "Architecture guard: layer table, type-only imports, no shell APIs, proven on inline samples"
    requirement: CAL-04
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "No-comments guard over src/, tests/ and demo.ts, proven on inline samples"
    requirement: CAL-02
    verification:
      - kind: unit
        ref: "tests/sin-comentarios.test.ts"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 01: Gate, repository hygiene and guards Summary

**The pinned Bun 1.4.3 toolchain (zod 4.6.5, exceljs 4.4.0, pdf-lib 1.17.1, TS 7.0.2, Biome 2.5.15) is installed behind a human-approved supply-chain gate, with `bun run check` green, reto-01 versioned unchanged, and two guard tests that are proven to catch violations (layer imports plus no shell, and no comments).**

## Performance

- **Duration:** 3 min (continuation after the Task 1 checkpoint)
- **Started:** 2026-10-12T21:46:26Z
- **Completed:** 2026-10-12T21:49:30Z
- **Tasks:** 2 (Task 1 checkpoint resolved, Task 2 executed)
- **Files modified:** 9 created, plus 22 reto-01 files versioned unchanged

## Task 1: package-legitimacy gate (resolved)

Evidence table, gathered by the previous executor with read-only `npm view` on 2026-10-12:

| Package | Version | Published | Age (days) | Install scripts (pre/install/post) | Repository | Provenance |
|---|---|---|---|---|---|---|
| zod | 4.6.5 | 2026-09-13 | 29 | none | github.com/colinhacks/zod | SLSA v1 attestation |
| @types/bun | 1.4.2 | 2026-09-08 | 34 | none | github.com/DefinitelyTyped/DefinitelyTyped | none |
| @biomejs/biome | 2.5.15 | 2026-09-30 | 12 | none | github.com/biomejs/biome | SLSA v1 attestation |
| typescript | 7.0.2 | 2026-07-08 | 96 | none | github.com/microsoft/TypeScript | none |
| exceljs | 4.4.0 | 2023-10-19 | 1089 | none | github.com/exceljs/exceljs | none |
| pdf-lib | 1.17.1 | 2021-11-06 | 1801 | none | github.com/Hopding/pdf-lib | none |
| uuid (override ^11.1.1) | 11.1.1 | 2026-04-29 | 166 | none | github.com/uuidjs/uuid | SLSA v1 attestation |

All seven pass D-35 (7 days or older), none has an install script, and every repository is the expected upstream.

- **Human resume signal (verbatim):** "approved with bun upgrade"
- **Bun upgrade:** yes. The orchestrator ran `bun upgrade` at the user's explicit request after the approval. The version was 1.3.10 before the gate.
- **`bun --version` after the gate:** `1.4.3` (re-run by this executor, and confirmed again by `bun install v1.4.3 (c6da4a4d3)`).

## Accomplishments

- `reto-01/` is committed alone and byte-for-byte as delivered (22 files). The project `.gitignore` lists `.DS_Store` first, so the three Finder files stay untracked.
- `bun install` resolved exactly the approved pins, and uuid resolves to 11.1.1 in `bun.lock`. `bun audit --audit-level=moderate` reports "No vulnerabilities found (checked 207 packages)".
- `bun run check` (tsc strict with noUncheckedIndexedAccess and exactOptionalPropertyTypes, Biome with noExplicitAny=error, bun audit) exits 0 with no Biome diagnostics.
- `tests/architecture.test.ts` enforces the layer table over `src/**/*.ts` and `demo.ts`. It catches `import type`, `export type ... from`, side-effect, multi-line and dynamic imports, files in an undeclared layer, imports into future layers (server, http, loop, llm), and shell APIs (child_process, Bun.spawn, Bun.$). An empty `src/` is not an error.
- `tests/sin-comentarios.test.ts` runs a state machine that skips quoted strings, template literals (with nested `${}` code), and regex literals, and reports line and block comments.
- Both guards are non-vacuous. The inline-sample tests pass (19 pass, 0 fail). A throwaway `src/domain/x.ts` with an infra `import type`, a `Bun.spawn` and a line comment made all three real-tree tests fail, and it was then deleted, never committed.

## Task Commits

1. **Task 1: package-legitimacy gate plus Bun upgrade.** Checkpoint, no commit. Resolved by the human.
2. **Task 2: hygiene, pinned toolchain and guards.**
   - `e13a7b5`: chore: versionar PRD y fixtures de reto-01 sin cambios (message as the plan dictates)
   - `bdfecd3`: chore(01-01): toolchain fijado y guardas de arquitectura y sin comentarios

**Plan metadata:** recorded in the docs(01-01) commit that follows this SUMMARY.

## Files Created/Modified

- `.gitignore`: node_modules/, out/, .env, .env.*, !.env.example, .DS_Store, *.log, web/dist/
- `.dockerignore`: the same lines plus .git, .planning, tests
- `.bun-version`: 1.4.3
- `package.json`: exact pins, uuid override, engines.bun 1.4.3, scripts demo/test/typecheck/lint/audit/check
- `bun.lock`: committed lockfile
- `tsconfig.json`: verbatim from RESEARCH "Scaffolding"
- `biome.json`: as in RESEARCH, with `!.planning` and `!.claude` added to files.includes
- `tests/architecture.test.ts`: layer and no-shell guard
- `tests/sin-comentarios.test.ts`: no-comments guard

## Decisions Made

- A `src/` file in a folder outside the table fails the test (`capa no declarada`). New folders, such as `src/contracts` in Phase 3 or the Phase 2 layers, must be added to `PERMITIDOS` on purpose.
- Bare specifiers other than `node:*`, zod, exceljs and pdf-lib (for example bare `fs` or `bun`) are never allowed. This forces the `node:` prefix and keeps `import { $ } from "bun"` out.
- `src/demo` may also import other `src/demo` files, and the root `demo.ts` may import `src/demo`, `src/tools/proveedor.ts`, config and `node:`. The plan's table did not cover the root `demo.ts` explicitly, so this follows plan 01-03's demo.ts → src/demo/ejecutar-demo.ts link.
- The no-shell scan matches raw source lines, so even a string literal "child_process" in `src/` fails. This is strict on purpose.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome warning on a template-placeholder sample string**
- **Found during:** Task 2 (bun run check)
- **Issue:** The template-interpolation sample in `tests/sin-comentarios.test.ts` was a plain string containing `${`, which triggered `lint/suspicious/noTemplateCurlyInString`. That is a Biome diagnostic, so it fails the plan's "any Biome diagnostic" criterion.
- **Fix:** The sample is now built with `[...].join("$")`, so the source never holds a literal `${` in a plain string. The sample still checks the same behavior.
- **Files modified:** tests/sin-comentarios.test.ts
- **Verification:** `bun run check` reports no diagnostics, and the 19 guard tests pass.
- **Committed in:** bdfecd3

### Process notes

- The commits landed on `main`. `git.base-branch --is-protected main` returns true, but the project uses `branching_strategy: none`, every earlier planning commit is on `main`, and the orchestrator explicitly dispatched this as a sequential executor on the main working tree with normal commits. So this was not treated as drift. The root-pin guard passed before every commit.

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Lint hygiene only, no scope change.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required. `bun run check` needs registry network access for `bun audit`.

## Next Phase Readiness

- Plan 01-02 can start. The toolchain, `bun test` and the guards are in place, and Bun 1.4.3 is installed locally, so the end-of-phase Bun upgrade reminder (plan 01-11) is already satisfied.
- Plan 01-03 Task 3 adds the export-name assertion on `src/tools/proveedor.ts` to `tests/architecture.test.ts`.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-12*

## Self-Check: PASSED
