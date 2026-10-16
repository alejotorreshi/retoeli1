---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 03
subsystem: ui
tags: [react, store, useSyncExternalStore, features, guardians, happy-dom, bun-test]

requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-01 DOM characterization (prepararDom, crearRedWeb, montarApp) and 05-02 store (crearInstancia, dependenciasReales, useSeleccion, useAcciones, useSincronizacion, ProveedorAlmacen, seleccionar*)"
provides:
  - "main.tsx creates the store instance once; App({ instancia }) renders ProveedorAlmacen around Pantalla, which reads only named selectors and actions"
  - "usar-chat, usar-salud and usar-reintento-config deleted; ControlChat and ControlSalud removed; one config-retry interval left (useSincronizacion)"
  - "three migrated component folders: features/sesion/dialogo-nueva-sesion, features/encabezado/encabezado, features/encabezado/aviso-modelo (view, usar-<c>.ts, CSS module)"
  - "guardians W14, W15, W16, W17, W18 and W20 with negative samples, and the CARPETAS_EN_MUDANZA exemption plan 05-07 empties"
  - "montarApp returns the instancia and fails a test on any console.error"
affects: [05-04, 05-05, 05-06, 05-07, 05-08, 05-09]

actuals:
  tokens: 16684
  tasks: 3
  commits: 6
plan_head_before: a18d8ad0f4270e0872719c43e79a3669678d93e9
plan_head_after: a0d5565f6228aa9accef6e46592ff4e3aa4ab0ba

tech-stack:
  added: []
  patterns:
    - "A component folder holds the view <c>.tsx (JSX, aria, classes, TEXTO_*), the hook usar-<c>.ts (store reads, actions, refs, ids, effects) and <c>.module.css; the view calls only its own hook"
    - "A view with no props reads everything through its hook; layout-only values (Encabezado's angosto) stay as props"
    - "DOM tests get the store instance from montarApp and can drive or read it directly (instancia.acciones, instancia.almacen.leer())"
    - "New guardian rules ship as stubs plus samples in a RED commit, then the real rule in GREEN"

key-files:
  created:
    - web/src/features/sesion/dialogo-nueva-sesion/usar-dialogo-nueva-sesion.ts
    - web/src/features/encabezado/encabezado/usar-encabezado.ts
    - web/src/features/encabezado/aviso-modelo/usar-aviso-modelo.ts
    - tests/web/store/app-con-almacen.test.tsx
  modified:
    - web/src/main.tsx
    - web/src/app.tsx
    - web/src/types/ui.type.ts
    - web/src/types/chat.type.ts
    - web/src/features/sesion/dialogo-nueva-sesion/dialogo-nueva-sesion.tsx (moved from web/src/components)
    - web/src/features/encabezado/encabezado/encabezado.tsx (moved)
    - web/src/features/encabezado/aviso-modelo/aviso-modelo.tsx (moved)
    - web/src/features/*/*/*.module.css (three moved CSS modules)
    - tests/helpers/app-dom.helper.ts
    - tests/helpers/types/dom.type.ts
    - tests/web/estado-del-modelo.test.ts
    - tests/arquitectura-web.test.ts
    - tsconfig.json
    - tsconfig.dom.json
    - docs/convenciones.md

key-decisions:
  - "The console.error guard uses onTestFinished inside montarApp, because bun:test hooks registered at module level of a shared helper would bind only to the first test file; a throw in onTestFinished fails the test and runs after rtl.cleanup, so unmount warnings count too"
  - "tsconfig.dom.json now includes tests/**/*.tsx and the root tsconfig excludes them, so a DOM test can live next to the code it covers (tests/web/store/app-con-almacen.test.tsx)"
  - "useAvisoModelo returns estado as EstadoModeloConAviso | null, so the decision 'disponible hides the banner' moved from the view to the hook"
  - "useEncabezado(angosto) returns the computed prefix class, and EstadoDelModelo now takes clasePrefijo instead of angosto"
  - "W15 lets any .module.css import through and W17 alone decides CSS ownership, so a wrong CSS import is reported once"
  - "W18 strips string and template literal contents from the raw source (keeping newlines) before looking for numbers and style=, instead of using Bun.Transpiler output"

patterns-established:
  - "VISTA regex: ^web/src/(features/KEBAB|compartido)/(KEBAB)/\\1\\.tsx$ identifies a view; W15 and W18 apply only to views"
  - "CARPETAS_EN_MUDANZA = [web/src/components/, web/src/hooks/] is the single named exemption for W15, W16 and W20 during the move"

requirements-completed: [FE-01, FE-02, FE-03, FE-04, FE-06]

coverage:
  - id: D1
    description: "The running App reads and writes only through the store: main.tsx creates the instance once, App wraps Pantalla in ProveedorAlmacen, and the dialog and a turn react to store actions"
    requirement: FE-02
    verification:
      - kind: automated_ui
        ref: "tests/web/store/app-con-almacen.test.tsx (3 tests)"
        status: pass
      - kind: other
        ref: "bun run build:web"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every 05-01 characterization test passes with only the helper changed, and no console.error is emitted while mounting and using the App"
    requirement: FE-06
    verification:
      - kind: automated_ui
        ref: "tests/web/dom (13 tests, montarApp fails on any console.error)"
        status: pass
      - kind: other
        ref: "git diff --name-only a18d8ad..HEAD -- tests/web/dom (empty)"
        status: pass
    human_judgment: false
  - id: D3
    description: "usar-chat, usar-salud and usar-reintento-config deleted, ControlChat and ControlSalud removed; one setInterval left in web/src"
    requirement: FE-02
    verification:
      - kind: other
        ref: "test ! -f web/src/hooks/usar-{chat,salud,reintento-config}.ts; grep -rn setInterval web/src (1 hit, usar-almacen.ts)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Nueva sesión dialog, header and model banner live as view, hook and CSS in their feature folders, with roles, names, focus on Seguir and focus return unchanged"
    requirement: FE-01
    verification:
      - kind: automated_ui
        ref: "tests/web/dom/app.test.tsx#Nueva sesión pide confirmación: Seguir conserva la conversación y Empezar vuelve al estado vacío"
        status: pass
      - kind: automated_ui
        ref: "tests/web/dom/app.test.tsx#el aviso del modelo sin clave pausa los chips y Comprobar de nuevo vuelve a pedir la salud"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W14: cada carpeta de componente de features/ y compartido/ tiene su vista"
        status: pass
    human_judgment: false
  - id: D5
    description: "Guardians W14, W15, W16, W17, W18 and W20 run on the real code and bite their negative samples; read-only and idempotent"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts (-t W14, W15, W16, W17, W18, W20: 2 pass each)"
        status: pass
      - kind: other
        ref: "bun test tests/arquitectura-web.test.ts twice; git status --porcelain unchanged"
        status: pass
    human_judgment: false
  - id: D6
    description: "Views carry no network, store, state or React hooks, and no magic values (FE-03)"
    requirement: FE-03
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W15: las vistas solo importan su hook, otras vistas, la config y tipos"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W18: las vistas no llevan números mágicos, style= ni colores sueltos"
        status: pass
    human_judgment: false
  - id: D7
    description: "docs/convenciones.md names W14, W15, W16, W17, W18 and W20 with rule and reason"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/docs/continuidad.test.ts"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 03: El front corre sobre el almacén Summary

**`main.tsx` now creates one store instance and `App({ instancia })` renders the screen through `ProveedorAlmacen`, named selectors and actions. The three old hooks are gone, the Nueva sesión dialog, header and model banner live as view, hook and CSS in their feature folders, and six new guardians (W14 to W18 and W20) check every component that migrates next.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-16T18:11:26Z
- **Completed:** 2026-10-16T18:20:17Z
- **Tasks:** 3 (Task 1 was a tracer)
- **Files modified:** 25

## Accomplishments

- `main.tsx` calls `crearInstancia(dependenciasReales)` once at module level, before `createRoot`. `App` is now `ProveedorAlmacen` around a local `Pantalla`. `Pantalla` keeps the old layout, calls `useSincronizacion()` once, reads every value with `useSeleccion(seleccionar*)` and calls every action through `useAcciones()`. The Nueva sesión `useState` became the `dialogoSesion` slice.
- `usar-chat.ts`, `usar-salud.ts` and `usar-reintento-config.ts` are deleted, and `ControlChat` and `ControlSalud` are gone from `chat.type.ts`. `web/src` has exactly one `setInterval` left, the config retry in `useSincronizacion`, which closes the double-interval risk 05-02 flagged.
- `montarApp` builds the instance, passes it to `App` and returns it. It also spies on `console.error` and fails the test from `onTestFinished` if any call was recorded. All 13 characterization tests passed unchanged, with no `getSnapshot` or act warning.
- `DialogoNuevaSesion`, `Encabezado` and `AvisoModelo` moved with `git mv` into `features/sesion/dialogo-nueva-sesion` and `features/encabezado/{encabezado,aviso-modelo}`. Their hooks own the store reads, the actions, the refs, the `useId` ids, the open/close effect and the focus return. The views keep only markup, aria, classes and `TEXTO_*`.
- The new guardians:
  - W14: a component folder with a hook or CSS needs its view, and `estado` is reserved.
  - W15: a view imports only its hook, other views, config and type-only imports.
  - W16: only `usar-*.ts` hooks, the store and the api folder import `@web/api`.
  - W17: CSS is owned by the same-named view.
  - W18: no magic numbers, `style=` or colors in views.
  - W20: the store primitives stay in `web/src/store`.

  Each rule has real-code and "muerde" tests with exact messages and a row in `docs/convenciones.md`.

## Task Commits

1. **Task 1 (tracer): the App on the store.** `6b0e6c2` (test, RED) and `5d1a96a` (feat, GREEN)
2. **Task 2: three components in feature folders, W14, W15 and W17.** `e3f9ae5` (test, RED) and `1561a81` (feat, GREEN)
3. **Task 3: W16, W18 and W20.** `c6c73c7` (test, RED) and `a0d5565` (feat, GREEN)

No REFACTOR commit was needed.

## TDD Gate Compliance

Each RED ran `bun test ... --reporter=junit`, and the unchanged JUnit report went to `gsd-tools check tdd-red-evidence`. Every RED returned `RED_EVIDENCE_OK` (`target_test_failed`).

- **Task 1 RED (`6b0e6c2`).**
  - Target: `abrir Nueva sesión desde las acciones del almacén muestra el diálogo` in `tests/web/store/app-con-almacen.test.tsx`.
  - Expected: the dialog opens after `instancia.acciones.abrirNuevaSesion()`.
  - Actual: `Unable to find role="dialog"`, because the old `App` ignored the instance and kept its own `useState`. The other two tests in the file also failed on their assertions: the store's dialog flag stayed false, and the turn sent through the store never reached the screen.
  - Semantic assessment: valid RED. The target ran and failed on the planned assertion for the intended reason.
- **Task 2 RED (`e3f9ae5`).**
  - Target: `W14: cada carpeta de componente de features/ y compartido/ tiene su vista`.
  - Expected: the three migrated folders exist and W14 reports nothing.
  - Actual: `toContain` failed because the folders did not exist yet. The W15 and W17 real-code tests failed the same way.
  - Semantic assessment: valid RED on the planned behavior, which is the migration. The rule bodies live in the test file, so their samples were already green in this commit.
- **Task 3 RED (`c6c73c7`).**
  - Target: `W16: reporta la api importada desde un estado de feature o una vista`.
  - Expected: two violations.
  - Actual: `[]`, because the three rules were stubs that report nothing. The W18 and W20 samples failed the same way.
  - Semantic assessment: valid RED.
- **Tracer gate (auto mode).** After `5d1a96a`, the Task 1 `<verify>` ran end to end before Task 2 started: `bun test tests/web/dom tests/web/store tests/web` gave 368 pass and 0 fail, `bun run check` was green, and `bun run build:web` built. The tracer was verified end to end before expanding.

## Files Created/Modified

- `web/src/main.tsx`: the instance is created once, and `<App instancia={instancia} />` is rendered.
- `web/src/app.tsx`: contains `App({ instancia })` and `Pantalla`. `BarraDePestanas`, `pestanaPorTecla`, `atributosDeVista`, `useDiseno` and `usePestanas` are unchanged, because plan 05-07 moves them.
- `web/src/types/ui.type.ts`:
  - Added: `PropsApp`, `ControlDialogoNuevaSesion`, `ControlEncabezado` and `ControlAvisoModelo`.
  - Changed: `PropsEncabezado` is now `{ angosto }`, and `PropsEstadoDelModelo` now takes `clasePrefijo`.
  - Removed: `PropsDialogoNuevaSesion` and `PropsAvisoModelo`.
- `web/src/types/chat.type.ts`: `ControlChat` and `ControlSalud` are removed.
- `web/src/features/sesion/dialogo-nueva-sesion/*`, `web/src/features/encabezado/encabezado/*` and `web/src/features/encabezado/aviso-modelo/*`: the three component triples.
- `tests/helpers/app-dom.helper.ts` and `tests/helpers/types/dom.type.ts`: the instance and the `console.error` guard.
- `tests/web/store/app-con-almacen.test.tsx`: drives the mounted App through the store.
- `tests/web/estado-del-modelo.test.ts`: the describe that read `aviso-modelo.tsx` as source is gone. W15 and the "Comprobar de nuevo" characterization replace it.
- `tests/arquitectura-web.test.ts`:
  - Constants: `CARPETAS_EN_MUDANZA`, `VISTA`, `VISTAS_MIGRADAS`, `NUMERO_MAGICO`, `ATRIBUTO_STYLE`, `PRIMITIVAS_DEL_ALMACEN` and `PRIMITIVAS_PERMITIDAS`.
  - Functions: the six `violacionesDe...` rules, `sinCadenas` and `nombresImportadosDeReact`.
- `tsconfig.json` and `tsconfig.dom.json`: `tests/**/*.tsx` moved to the DOM project.
- `docs/convenciones.md`: rows W14, W15, W16, W17, W18 and W20.

## Decisions Made

See `key-decisions` in the frontmatter. The main judgment calls:
- The `console.error` guard lives in `onTestFinished`. An experiment showed that a throw there fails the test, and that `test.failing` cannot invert it. A module-level `afterEach` in the shared helper would only bind to the first file that imports it.
- The rule "the `disponible` state hides the banner" moved into `useAvisoModelo`, so the view no longer imports `ESTADO_LLM`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The DOM TypeScript project covered only `tests/web/dom`**
- **Found during:** Task 1 RED
- **Issue:** The new store-mounted DOM test could not go in `tests/web/dom`, because the plan requires that folder to stay unchanged. In any other folder, a `.tsx` test would have been type-checked by the root project, which has no DOM or JSX.
- **Fix:** `tsconfig.dom.json` now includes `tests/**/*.tsx`, and the root `tsconfig.json` excludes it. The helper entries are unchanged.
- **Verification:** `bun run check` passes all three `tsc` runs. G5 already accepted `tests/**/<kebab>.test.tsx`.
- **Committed in:** 6b0e6c2

**2. [Rule 2 - Missing coverage] A test that the mounted App really uses the store**
- **Found during:** Task 1
- **Issue:** The characterization tests alone pass with or without the store, so they cannot fail first. The tracer needed a RED.
- **Fix:** `tests/web/store/app-con-almacen.test.tsx` adds 3 tests. They drive the dialog and a turn through `instancia.acciones` and read `instancia.almacen`. `AppMontada` now also returns `instancia`. This is an additive change to the helper, and no assertion in `tests/web/dom` changed.
- **Committed in:** 6b0e6c2

**3. [Plan wording] `grep -c "crearInstancia" web/src/main.tsx` prints 2, not 1**
- The import line also contains the name. There is exactly one call (`crearInstancia(dependenciasReales)`), at module level, before `createRoot`.

**4. [Plan wording] `CARPETAS_EN_MUDANZA` counts**
- W15, W16 and W20 reach the constant through `enMudanza()`. The W16 and W20 samples iterate it directly, so `grep -c` prints 4.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing coverage), plus 2 notes on plan wording.
**Impact on plan:** None on scope. Both fixes serve the tracer's RED and keep `tests/web/dom` untouched.

## Issues Encountered

- Git recorded `dialogo-nueva-sesion.tsx` as a delete plus an add, because the split removed most of its body into the hook. Its CSS module and the other two components were recorded as renames. The old file's history is still reachable at `web/src/components/dialogo-nueva-sesion.tsx` before `1561a81`.
- As in 05-01 and 05-02, the commits are on local `main` (`branching_strategy: none`, sequential executor). Nothing was pushed.
- `docs/estructura.md` still describes `web/src/state/` and the deleted hooks. Plans 05-07 and 05-08 own that file, so I left it for them.

## Known Stubs

None. The Task 3 RED stubs were replaced in `a0d5565`.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plans 05-04 to 05-06 can migrate each component the same way: `git mv` into `features/<f>/<c>/`, then split the logic into `usar-<c>.ts`. W14, W15, W17 and W18 check each one as it lands. A new view must be added to `VISTAS_MIGRADAS` only if a real-code test should assert that it exists.
- Plan 05-07 empties `CARPETAS_EN_MUDANZA` once `web/src/components` and `web/src/hooks` are gone. It also creates `features/disposicion/columnas/usar-columnas.ts`, the only place outside the store where W20 allows `useSyncExternalStore`.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED

All 10 created or moved files listed in the plan exist, and the 6 task commits (6b0e6c2, 5d1a96a, e3f9ae5, 1561a81, c6c73c7, a0d5565) are ancestors of HEAD (`check evaluation-scope --plan 05-03` resolves them). Plan verification: `bun test` gave 2583 pass, 2 skip (the existing live tests) and 0 fail across 128 files; `bun run check` is green; `bun run build:web` built; `tests/docs/continuidad.test.ts` passes; `tests/arquitectura-web.test.ts` ran twice with the same summary and no change to `git status --porcelain`.
