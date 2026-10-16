---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 01
subsystem: testing
tags: [happy-dom, testing-library, user-event, react, bun-test, characterization, guardians]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: the React chat SPA (App, api client, SSE flow) and its API contract
provides:
  - five pinned test-only devDependencies with SOLUCION.md section 6 rows
  - tsconfig.dom.json and a third tsc run in `bun run check`
  - prepararDom (per-file happy-dom), crearRedWeb (fake API at fetch), montarApp (real App in StrictMode)
  - 13 black-box characterization tests of the current UI (FE-06 baseline)
  - a backend sentinel proving native globals
  - code guardians and comment scanner that cover tests/**/*.tsx
affects: [05-02, 05-03, 05-04, 05-05, 05-06, 05-07, 05-08, 05-09]

actuals:
  tokens: 10853
  tasks: 3
  commits: 4
plan_head_before: 17ed0b5cfc2739d296fc3873fd67d1f262d4388e
plan_head_after: 484fd88d07377ea25a34d3579b99e42d919ba4bb

tech-stack:
  added:
    - "@testing-library/react 16.3.3 (dev)"
    - "@testing-library/dom 10.4.2 (dev)"
    - "@testing-library/user-event 14.6.7 (dev)"
    - "happy-dom 20.14.6 (dev)"
    - "@happy-dom/global-registrator 20.14.6 (dev)"
  patterns:
    - "DOM tests register happy-dom per file through prepararDom() and unregister in afterAll; no bunfig preload"
    - "DOM tests query through within(document.body) and userEvent.setup({ document }); RTL and the App load with await import() after register"
    - "The fake network answers at the fetch boundary with native Response objects, so the same assertions survive the refactor"
    - "Characterization tests reference only constants from web/src/config/strings.ts and src/config, never copy literals or class names"

key-files:
  created:
    - tsconfig.dom.json
    - tests/helpers/dom.helper.ts
    - tests/helpers/app-dom.helper.ts
    - tests/helpers/red-web.helper.ts
    - tests/helpers/types/dom.type.ts
    - tests/helpers/types/red-web.type.ts
    - tests/web/dom/app.test.tsx
    - tests/web/dom/app-acceso.test.tsx
    - tests/web/dom/app-angosto.test.tsx
    - tests/web/dom/app-panel.test.tsx
    - tests/globales-nativos.test.ts
  modified:
    - package.json
    - bun.lock
    - SOLUCION.md
    - tsconfig.json
    - tests/architecture.test.ts
    - tests/sin-comentarios.test.ts

key-decisions:
  - "prepararDom keeps the native TransformStream, WritableStream and queueMicrotask after GlobalRegistrator.register(): happy-dom replaces them, which breaks the SSE pipeThrough and freezes React work in the second DOM file of a process"
  - "crearRedWeb takes the native Response captured by prepararDom, plus fijarSalud and fijarRuta setters instead of answer queues, because StrictMode runs effects twice and makes queue order fragile"
  - "Characterization pins actual behavior: during a turn the composer swaps Enviar mensaje for Detener respuesta (Enviar is absent, not disabled), and the most recent case block opens by itself and requests its files"

patterns-established:
  - "prepararDom({ ancho }) at module top of every tests/web/dom/*.test.tsx, one crearRedWeb + montarApp per test"
  - "Exact request counts only for POST /api/chat and POST /api/acceso; never for GET /api/health or /api/config (StrictMode)"

requirements-completed: [FE-04, FE-06]

coverage:
  - id: D1
    description: "Five test-only devDependencies pinned after an automated supply-chain gate and justified in SOLUCION.md section 6; no runtime dependency added"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/docs/solucion.test.ts#§6 justifica cada dependencia de package.json con su versión exacta"
        status: pass
      - kind: other
        ref: "bun audit (No vulnerabilities found, 293 packages); npm view time/scripts/repository.url"
        status: pass
    human_judgment: false
  - id: D2
    description: "Per-file happy-dom setup that leaves backend tests with native globals, type-checked by a third tsc run"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/globales-nativos.test.ts#fetch y Response son los nativos de Bun"
        status: pass
      - kind: other
        ref: "bun run check (tsc root, tsc web, tsc tsconfig.dom.json, biome)"
        status: pass
      - kind: integration
        ref: "bun test && bun test --isolate && bun test --parallel=2 (2513 pass, 0 fail each)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Guardians G1/G3/G4/G5/G13 and the comment scanner enumerate .tsx tests, with negative samples"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts#G5: acepta pruebas .test.tsx en kebab-case y reporta las demás .tsx de tests/"
        status: pass
      - kind: unit
        ref: "tests/architecture.test.ts#G1, G3, G4 y G5: el escáner de tests/ incluye las pruebas .tsx"
        status: pass
      - kind: unit
        ref: "tests/sin-comentarios.test.ts#reporta un comentario JSX dentro de una prueba .tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "Black-box characterization of the real App at the fetch boundary: demo chip, composer keys, held-open turn and Detener, confirmation card, Nueva sesión, model banner, access, narrow tabs and case panel"
    requirement: FE-06
    verification:
      - kind: automated_ui
        ref: "tests/web/dom/app.test.tsx (8 tests)"
        status: pass
      - kind: automated_ui
        ref: "tests/web/dom/app-acceso.test.tsx (2 tests)"
        status: pass
      - kind: automated_ui
        ref: "tests/web/dom/app-angosto.test.tsx (1 test)"
        status: pass
      - kind: automated_ui
        ref: "tests/web/dom/app-panel.test.tsx (2 tests)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 01: Red de seguridad de comportamiento del front Summary

**The real React App now runs under per-file happy-dom with only `fetch` faked, and 13 black-box tests pin its chips, composer, turn control, confirmation, sessions, model banner, access, tabs and file panel before the refactor moves anything.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-10-16T17:36:15Z
- **Completed:** 2026-10-16T17:51:00Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments

- An automated, fail-closed supply-chain gate ran before the install. It pinned the five devDependencies the user approved (D-115) at versions at least 7 days old, with no install scripts and a clean `bun audit`. Each package is justified in SOLUCION.md §6, and `dependencies` is unchanged.
- `tsconfig.dom.json` and a third `tsc` run in `bun run check`. The root `tsconfig.json` excludes exactly the DOM tests and helpers.
- `prepararDom`, `crearRedWeb` and `montarApp` mount the real `App` in StrictMode, as `main.tsx` does. The network is faked at `fetch` with native `Response` objects, and SSE scripts can be held open and released.
- 13 characterization tests cover four files and both layouts (1280 px and 375 px). They also cover the FE-02 concurrency edge: no second POST while a turn is in progress, and nothing renders after Detener.
- The guardians (G1, G3, G4, G5, G13) and the comment scanner now see `.tsx` tests, and negative samples prove it.
- The suite passes under `bun test`, `bun test --isolate` and `bun test --parallel=2` (2513 pass, 0 fail each).

## Supply-chain evidence (D-104, D-115, T-05-01, T-05-SC)

Run on 2026-10-16, before `bun add`. The gate checked the publish date with `npm view <name> time --json`, the lifecycle scripts with `npm view <spec> scripts --json`, and the repository with `npm view <spec> repository.url`:

| Package | Published | Age (days) | preinstall / install / postinstall | Repository |
|---|---|---|---|---|
| @testing-library/react@16.3.3 | 2026-08-27T17:41:18.735Z | 50.0 | absent / absent / absent | git+https://github.com/testing-library/react-testing-library.git |
| @testing-library/dom@10.4.2 | 2026-09-13T18:08:36.116Z | 33.0 | absent / absent / absent | git+https://github.com/testing-library/dom-testing-library.git |
| @testing-library/user-event@14.6.7 | 2026-09-02T01:56:32.109Z | 44.7 | absent / absent / absent | git+https://github.com/testing-library/user-event.git |
| @happy-dom/global-registrator@20.14.6 | 2026-10-08T23:16:36.938Z | 7.8 | absent / absent / absent | git+https://github.com/capricorn86/happy-dom.git |
| happy-dom@20.14.6 | 2026-10-08T23:18:02.688Z | 7.8 | absent / absent / absent | git+https://github.com/capricorn86/happy-dom.git |

None of the packages declares a lifecycle script. Their scripts are only build, test, lint and the like, for example `install:csb`, which is not a lifecycle hook. The versions left out on purpose are user-event 14.6.8 and happy-dom 21.x.

Install and audit:

```
bun add v1.4.3 (c6da4a4d3)
installed @testing-library/react@16.3.3
installed @testing-library/dom@10.4.2
installed @testing-library/user-event@14.6.7
installed @happy-dom/global-registrator@20.14.6
installed happy-dom@20.14.6
24 packages installed [509.00ms]

bun audit v1.4.3 (c6da4a4d3)
No vulnerabilities found (checked 293 packages) [277.00ms]

bun pm untrusted
Found 0 untrusted dependencies with scripts.
```

New lockfile packages: @babel/code-frame 7.29.7, @babel/helper-validator-identifier 7.29.7, @babel/runtime 7.29.10, @types/aria-query 5.0.4, @types/whatwg-mimetype 3.0.2, @types/ws 8.18.2, ansi-regex 5.0.1, ansi-styles 5.2.0, aria-query 5.3.0, buffer-image-size 0.6.4, dequal 2.0.3, dom-accessibility-api 0.5.16, entities 7.0.1, js-tokens 4.0.0, lz-string 1.5.0, pretty-format 27.5.1, react-is 17.0.2, whatwg-mimetype 3.0.0 and ws 8.22.0, plus the five direct packages. No D-117 browser end-to-end runner was added.

## Task Commits

1. **Task 1: Tracer, the real App in happy-dom with a fake network** - `36727e4` (test)
2. **Task 2: Guardians cover .tsx tests** - `0d8846d` (test, RED) and `d9ccb86` (feat, GREEN)
3. **Task 3: Characterize the remaining UI flows** - `484fd88` (test)

## TDD Gate Compliance

- **Task 2 RED (`0d8846d`):** 4 target assertions failed before the implementation: the scanner did not list `tests/web/dom/app.test.tsx`, G5 rejected `app.test.tsx`, G13 missed `src/x.tsx`, and the comment scanner did not list the `.tsx` test. The JUnit report from `bun test ... --reporter=junit` went to `gsd-tools check tdd-red-evidence`, which returned `RED_EVIDENCE_OK` (`target_test_failed`) for the G5 target. Semantic assessment: every failure was an assertion on the planned behavior (`toContain` and `toEqual` diffs), with no load, syntax or fixture fault. **GREEN (`d9ccb86`)** made all 99 tests of both files pass.
- **Tasks 1 and 3 (characterization):** these tests pin behavior that already exists (FE-06), so an immediate pass is the intended result, not an "unexpected GREEN". The only new code is test infrastructure. To prove the tracer can fail, a mutation that expected the body `TEXTO_ACCIONES.mensajeListar` made it fail with a precise message diff. No REFACTOR commit was needed.
- **Tracer gate:** in auto mode the tracer `<verify>` ran again end to end after commit `36727e4` (check green, 35 pass, 0 fail) before Task 2 started.

## Files Created/Modified

- `tsconfig.dom.json`: strict type check with lib DOM and react-jsx for the DOM tests and helpers.
- `tests/helpers/dom.helper.ts`: `prepararDom({ ancho })` registers happy-dom per file, keeps the native streams and `queueMicrotask`, and exposes render, act, esperar, pantalla, dentroDe, usuario and nativos.
- `tests/helpers/red-web.helper.ts`: `crearRedWeb` fakes config, health, access, chat SSE (including held-open scripts), sessions, files and preview, and records `pedidos`. It also builds the SSE events.
- `tests/helpers/app-dom.helper.ts`: `montarApp` installs the fake fetch and renders `<StrictMode><App /></StrictMode>`.
- `tests/helpers/types/dom.type.ts` and `tests/helpers/types/red-web.type.ts`: helper types.
- `tests/web/dom/app.test.tsx`, `app-acceso.test.tsx`, `app-angosto.test.tsx` and `app-panel.test.tsx`: the characterization suite.
- `tests/globales-nativos.test.ts`: the backend sentinel.
- `tests/architecture.test.ts` and `tests/sin-comentarios.test.ts`: scan `{ts,tsx}`, the `.test.tsx` name pattern, a `.tsx` G13 rule and negative samples.
- `package.json`, `bun.lock`, `SOLUCION.md` and `tsconfig.json`: the devDependencies, the `check` script, the §6 rows and the root exclude.

## Decisions Made

- Keep the native `TransformStream`, `WritableStream` and `queueMicrotask` after registering happy-dom. A real browser has one coherent stream implementation and one microtask queue, and only the test registrator splits them.
- The fake network uses setters (`fijarSalud`, `fijarRuta`) and a held-open script with `soltar()` instead of response queues, because StrictMode makes the order of GET requests nondeterministic.
- Assertions use roles, accessible names, `disabled`, `aria-*`, `hidden` and `textContent`, built only from constants.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] happy-dom replaces TransformStream and WritableStream, which breaks the SSE reader**
- **Found during:** Task 1 (tracer)
- **Issue:** `GlobalRegistrator.register()` swaps `TransformStream` and `WritableStream`. `EventSourceParserStream` loads after register and extends the happy-dom class, so the native `ReadableStream.pipeThrough` throws `The transform's 'readable' property must be a ReadableStream`, and the UI showed "Se perdió la conexión…".
- **Fix:** `prepararDom` captures those two classes before register and restores them right after. No app code changed.
- **Files modified:** tests/helpers/dom.helper.ts
- **Verification:** the tracer passes, and `tests/web/flujo-chat.test.ts` still passes.
- **Committed in:** 36727e4

**2. [Rule 3 - Blocking] React froze in the second DOM file of a process**
- **Found during:** Task 3
- **Issue:** every DOM file after the first one in the same process timed out. React DOM captures `queueMicrotask` when the module loads. happy-dom replaces that function, and the first window stops running its microtasks once it closes, so later files rendered only inside `act`.
- **Fix:** add `queueMicrotask` to the native globals that `prepararDom` restores after register.
- **Files modified:** tests/helpers/dom.helper.ts
- **Verification:** all 4 DOM files together, with `--rerun-each 3` (39 pass), and the full suite in the three modes.
- **Committed in:** 484fd88

**3. [Rule 1 - Bug] The panel heading query was ambiguous**
- **Found during:** Task 3
- **Issue:** the case name also appears as a heading in the chat timeline, so `findByRole("heading", { name: caso })` matched twice.
- **Fix:** the query is scoped to the `complementary` region named `TEXTO_PANEL.titulo` through a new `dentroDe(elemento)` in the DOM helper.
- **Files modified:** tests/helpers/dom.helper.ts, tests/helpers/types/dom.type.ts, tests/web/dom/app-panel.test.tsx
- **Committed in:** 484fd88

**4. [Characterization] Two behavior lines in the plan differ from the actual UI, and the tests pin the actual UI**
- During a turn, Enviar mensaje is replaced by Detener respuesta (it is absent, not disabled). The test asserts that it is absent.
- The most recent case block in the panel opens by itself and requests `GET /api/casos/:caso/archivos` with no click. The test asserts that request.
- The plan's "queue of /api/health answers" and "/api/acceso responder keyed by code" became `fijarSalud(...)` and a single `codigoAcceso` (right code gets 204, any other gets 401 with `MENSAJE_HTTP.codigoInvalido`). StrictMode makes queues fragile, and the behavior covered is the same.

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug) and 1 characterization note.
**Impact on plan:** all fixes live in test infrastructure. No application code changed, and the FE-06 baseline reflects real behavior.

## Issues Encountered

- `bun test --randomize` fails 1 to 10 tests in `tests/e2e/demo.test.ts` and `tests/e2e/determinismo.test.ts`, even when those files run alone without DOM files. This order dependence is older than this phase and outside its scope. It is logged in `deferred-items.md`. `--randomize` is not part of the plan's verification.
- Commits land on `main` because this sequential executor ran on the main working tree (`branching_strategy: none`), as in earlier phases.

## Known Stubs

None. The plan only touches tests, and no UI data source was stubbed.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plans 05-02 to 05-07 can refactor under this suite. When `App` becomes `App({ instancia })` in 05-03, only `tests/helpers/app-dom.helper.ts` changes.
- New DOM tests should follow the pattern: `const dom = await prepararDom({ ancho })` at module top, query through `dom.pantalla()` and `dom.dentroDe()`, and never use `screen` or `userEvent.setup()` without `{ document }`.

## Self-Check: PASSED

- FOUND: all 11 created files (tsconfig.dom.json, 5 helpers and types, 4 DOM tests, the sentinel)
- FOUND: commits 36727e4, 0d8846d, d9ccb86 and 484fd88 on HEAD
- Plan verification: `bun run check` is green, and `bun test`, `bun test --isolate` and `bun test --parallel=2` give 2513 pass, 0 fail each. `bun test tests/docs/solucion.test.ts` passes.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*
