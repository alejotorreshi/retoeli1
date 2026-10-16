---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 02
subsystem: ui
tags: [react, store, useSyncExternalStore, selectors, reducers, guardians, bun-test]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: the pure reducers of web/src/state and the hooks useChat, useSalud and useReintentoConfig
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: 05-01 behavior safety net (DOM characterization) that must stay green
provides:
  - "web/src/store: crearAlmacen, estadoRaizInicial/reducirRaiz, crearAcciones, crearInstancia, dependenciasReales, 27 memoized selectors"
  - "React bridge ready to mount: ContextoAlmacen, useAlmacen, useSeleccion, useAcciones, useSincronizacion, ProveedorAlmacen"
  - "the seven pure reducers under web/src/features/*/estado (git mv, same bodies) plus the salud and dialogoSesion slices"
  - "W4 guards features/*/estado and the pure store core; W13 accepts store, feature state and component folders"
affects: [05-03, 05-04, 05-05, 05-06, 05-07]

actuals:
  tokens: 23633
  tasks: 3
  commits: 6
plan_head_before: 3598d38c52ca8add6f69437ea15f3fb673100e3a
plan_head_after: 3c016ad3e194e15db150b3dc969b20854a7c7eda

tech-stack:
  added: []
  patterns:
    - "Store core is a closure with a Set of listeners and an Object.is short-circuit; the Context carries the instance, never the state"
    - "Actions take the network and session storage as an injected Dependencias object; only store/dependencias.ts imports web/src/api"
    - "Every selector is a named seleccionar* function over EstadoRaiz; derived objects are memoized with memoizarPorReferencia keyed by the slice they read"
    - "Root reducer routes action families by Sets of each constant's values and keeps the root reference when the slice is unchanged"
    - "Component folders must repeat the folder name: features/<f>/<c>/{<c>.tsx, usar-<c>.ts, <c>.module.css} and compartido/<c>/..."

key-files:
  created:
    - web/src/types/store.type.ts
    - web/src/store/almacen.ts
    - web/src/store/raiz.ts
    - web/src/store/acciones.ts
    - web/src/store/instancia.ts
    - web/src/store/selectores.ts
    - web/src/store/dependencias.ts
    - web/src/store/usar-almacen.ts
    - web/src/store/proveedor-almacen.tsx
    - web/src/features/encabezado/estado/salud.ts
    - web/src/features/sesion/estado/dialogo-sesion.ts
    - tests/web/store/almacen.test.ts
    - tests/web/store/acciones.test.ts
    - tests/web/store/slices.test.ts
    - tests/web/store/selectores.test.ts
  modified:
    - web/src/features/chat/estado/conversacion.ts (moved from web/src/state)
    - web/src/features/chat/estado/seguimiento.ts (moved)
    - web/src/features/confirmacion/estado/confirmaciones.ts (moved)
    - web/src/features/casos/estado/casos.ts (moved)
    - web/src/features/archivos/estado/vista-previa.ts (moved)
    - web/src/features/sesion/estado/hidratacion.ts (moved)
    - web/src/features/encabezado/estado/modelo.ts (moved)
    - web/src/config/constants/ui.constants.ts
    - web/src/config/strings.ts
    - web/src/api/cliente-api.ts
    - web/src/app.tsx
    - web/src/hooks/usar-chat.ts
    - web/src/hooks/usar-archivos.ts
    - web/src/hooks/usar-reintento-config.ts
    - web/src/components/*.tsx (seven import paths)
    - tests/arquitectura-web.test.ts
    - tests/web/*.test.ts (eight import paths)

key-decisions:
  - "Selectors are exported as named seleccionar* functions so a property test can walk every export of selectores.ts and prove Object.is stability; memoizarPorReferencia is the only other export"
  - "Slice reducers take only their own action family; reducirRaiz routes by ACCIONES_DE_SALUD and ACCIONES_DE_DIALOGO_SESION Sets and leaves reducirConversacion as the single conversacion slice"
  - "ACCION_SALUD and ACCION_DIALOGO_SESION values carry a salud_/dialogo_sesion_ prefix, and a test proves no value collides with ACCION_UI"
  - "cancelarSalud only aborts; the finally of the active request still clears comprobando, matching useSalud's cleanup"
  - "EVENTO_VISIBILIDAD, VISIBILIDAD_VISIBLE and SIN_CASOS are constants in ui.constants.ts, and the out-of-provider error text lives in TEXTO_ALMACEN"

patterns-established:
  - "Store tests run without a DOM: crearInstancia(fakes) with a held-open enviarTurno built from Promise.withResolvers"
  - "A guardian rule change ships with a negative sample in the same RED commit"

requirements-completed: [FE-02, FE-04]

coverage:
  - id: D1
    description: "Pure store core crearAlmacen: read, notify once per listener, skip same-reference results, unsubscribe; no react import"
    requirement: FE-02
    verification:
      - kind: unit
        ref: "tests/web/store/almacen.test.ts (4 tests)"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W4: el núcleo puro del almacén tampoco importa react ni toca el navegador"
        status: pass
    human_judgment: false
  - id: D2
    description: "Actions reproduce useChat, useSalud and the config retry with injected dependencies: send guards and order, detener, sessions, confirmation, health abort semantics, config and session loading, dialog"
    requirement: FE-02
    verification:
      - kind: unit
        ref: "tests/web/store/acciones.test.ts (30 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Root reducer with three slices (conversacion unchanged, salud, dialogoSesion), identity on no-ops and idempotent dispatch"
    requirement: FE-02
    verification:
      - kind: unit
        ref: "tests/web/store/slices.test.ts (13 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "27 memoized selectors with Object.is stability on the same state and across roots that share the conversacion slice"
    requirement: FE-02
    verification:
      - kind: unit
        ref: "tests/web/store/selectores.test.ts (7 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Seven reducers moved with git mv next to their features; web/src/state removed; every import rewritten; the whole suite still green"
    requirement: FE-04
    verification:
      - kind: integration
        ref: "bun test (2569 pass, 2 skip, 0 fail across 127 files)"
        status: pass
      - kind: other
        ref: "git log --follow web/src/features/chat/estado/conversacion.ts (cf80bae, c402c45, 14692e8, ...)"
        status: pass
    human_judgment: false
  - id: D6
    description: "W4 and W13 learn the new homes with negative samples (feature state with react or browser APIs, loose or misnamed feature files, the legacy state path)"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts (W4 and W13 samples and real-code assertions)"
        status: pass
    human_judgment: false
  - id: D7
    description: "React bridge (ContextoAlmacen, useSeleccion over useSyncExternalStore, useSincronizacion effects, ProveedorAlmacen) type-checks but is not mounted yet"
    requirement: FE-02
    verification:
      - kind: other
        ref: "bun run check (tsc root, web, dom and biome)"
        status: pass
    human_judgment: true
    rationale: "The plan defers mounting and DOM-testing the bridge to 05-03; until then only the type checker covers it"

duration: 13min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 02: Store propio del front Summary

**The front now has its own dependency-free store: a closure core, a root reducer that keeps reducirConversacion as one slice next to new salud and dialogoSesion slices, actions that absorb useChat and useSalud with the network injected, 27 memoized selectors, and a React bridge ready to mount. The seven pure reducers moved with `git mv` to `web/src/features/*/estado/` under the architecture guardian.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-16T17:53:35Z
- **Completed:** 2026-10-16T18:06:30Z
- **Tasks:** 3 (Task 1 was a tracer)
- **Files modified:** 45

## Accomplishments

- `crearAlmacen(reducir, inicial)` is about 20 lines with no import from React. It skips listeners when the reducer returns the same reference.
- `crearInstancia(dependencias)` runs a whole chip turn with a fake `enviarTurno`. It dispatches ENVIAR before the POST, keeps the guards for a blank message, a turn in progress and hydration, saves the `sesionId` and passes `refrescarSalud` as `alTerminarTurno`.
- The actions cover everything `useChat`, `useSalud`, `useReintentoConfig` and the dialog state of `app.tsx` did. Detener drops later events. A second refresh aborts the first, and its late answer never overwrites `salud`. Sessions sync through `sesionGuardadaTras`.
- `selectores.ts` exports `memoizarPorReferencia` and 27 `seleccionar*` functions. A property test walks every export and proves the result is `Object.is`-stable on three sample states, and across two roots that share the same `conversacion`.
- The seven reducers live under `web/src/features/{chat,confirmacion,casos,archivos,sesion,encabezado}/estado/` with their bodies unchanged and their history kept. `web/src/state/` is gone.
- W4 now guards `features/*/estado/**` and `store/{almacen,raiz,selectores}.ts`. W13 accepts `store/<kebab>.ts`, `store/proveedor-almacen.tsx`, `features/<f>/estado/<x>.ts` and component folders whose files repeat the folder name. It rejects the old `state/` path, and it still accepts `components/` and `hooks/` until 05-07.

## Task Commits

1. **Task 1 (tracer): store core and send path.** `ea1cd3c` (test, RED) and `8f4445c` (feat, GREEN)
2. **Task 2: reducers next to features, salud and dialogoSesion slices.** `3d949b3` (test, RED) and `cf80bae` (feat, GREEN)
3. **Task 3: remaining actions, memoized selectors, React bridge.** `a6da5a7` (test, RED) and `3c016ad` (feat, GREEN)

No REFACTOR commit was needed.

## TDD Gate Compliance

Each RED ran `bun test ... --reporter=junit`. The unchanged JUnit report went to `gsd-tools check tdd-red-evidence`, and every task returned `RED_EVIDENCE_OK` (`target_test_failed`):

- **Task 1 RED (`ea1cd3c`).** Target: `W4: el núcleo puro del almacén tampoco importa react ni toca el navegador`. Expected: violations for the react import and `window` in `web/src/store/raiz.ts`. Actual: `[]`, because the rule only covered `web/src/state/`. The W13 sample also failed on an assertion diff. The two store test files failed at module resolution, as expected, because `web/src/store/*` did not exist yet. Semantic assessment: the target ran and failed on the planned assertion for the intended reason. The load failures belong to files whose module was the thing being built, so they were not the RED target.
- **Task 2 RED (`3d949b3`).** Target: `W4: reporta react y las APIs del navegador dentro del estado`, using a sample in `web/src/features/chat/estado/x.ts`. Actual: `[]`, because the rule still pointed at `state/`. The real-code scanner, the W4 real-code test and the W13 samples also failed on assertions. `slices.test.ts` failed at module resolution, because the features folder did not exist yet. Semantic assessment: valid RED.
- **Task 3 RED (`a6da5a7`).** Target: `refrescarSalud marca la comprobación y guarda la respuesta al terminar`. Expected: `comprobando` is true. Actual: false, because Task 1's `refrescarSalud` was a no-op placeholder. 23 action tests failed, either on assertions or because a member was missing (`not a function`). `selectores.test.ts` failed at module resolution. Semantic assessment: valid RED on the planned behavior.
- **Tracer gate (auto mode).** After `8f4445c`, the Task 1 `<verify>` ran again end to end (95 pass, `bun run check` green) before Task 2 started.

## Files Created/Modified

- `web/src/types/store.type.ts`: `Almacen`, `AlmacenRaiz`, `EstadoRaiz`, `AccionRaiz`, `EstadoSalud`, `AccionSalud`, `EstadoDialogoSesion`, `AccionDialogoSesion`, `Dependencias`, `Acciones`, `InstanciaAlmacen` and `PropsProveedorAlmacen`.
- `web/src/store/almacen.ts`, `raiz.ts` and `selectores.ts`: the pure core, guarded by W4.
- `web/src/store/acciones.ts` and `instancia.ts`: the actions and the instance, which receive their dependencies by parameter.
- `web/src/store/dependencias.ts`: `dependenciasReales ... satisfies Dependencias`, the only store module that imports `@web/api`.
- `web/src/store/usar-almacen.ts` and `proveedor-almacen.tsx`: the Context, the hooks and the provider.
- `web/src/features/encabezado/estado/salud.ts` and `web/src/features/sesion/estado/dialogo-sesion.ts`: the two new pure slices.
- `web/src/config/constants/ui.constants.ts`: `ACCION_SALUD`, `ACCIONES_DE_SALUD`, `ACCION_DIALOGO_SESION`, `ACCIONES_DE_DIALOGO_SESION`, `EVENTO_VISIBILIDAD`, `VISIBILIDAD_VISIBLE` and `SIN_CASOS`. `CLAVE_SESION_LOCAL` is unchanged.
- `web/src/config/strings.ts`: `TEXTO_ALMACEN.fueraDelProveedor`.
- `tests/arquitectura-web.test.ts`: `esEstadoPuro`, `ESTADO_DE_FEATURE`, `carpetaDeComponente` with a back-reference, the new W13 patterns and the samples.
- `tests/web/estado-del-modelo.test.ts`: the banner's forbidden imports now also cover `@web/store/` and `/estado/`, because `@web/state/` no longer exists.

## Decisions Made

- I chose named `seleccionar*` exports over an object of selectors. That lets the stability test enumerate them, and it requires every export except `memoizarPorReferencia` to carry the prefix.
- The slice reducers are typed to their own action family, and `reducirRaiz` narrows with type predicates over Sets built from each constant. The "unknown action keeps the reference" case is covered at the root (an AccionUi leaves `salud` and `dialogoSesion` untouched) and through no-op actions on each slice.
- `firmaDelProgreso` and `usoDeSesion` are memoized by the `conversacion` reference, together with `progresoPorCaso` and `marcasDeArchivos`. Primitives and existing references are returned directly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `web/src/api/cliente-api.ts` imported `@web/state/hidratacion.ts`**
- **Found during:** Task 2
- **Issue:** The file was not in the task's file list, but it imports `sigueOcupada` from the moved module, so the move would break it.
- **Fix:** Its import now points at `@web/features/sesion/estado/hidratacion.ts`.
- **Committed in:** cf80bae

**2. [Rule 3 - Blocking] The banner test listed `@web/state/` as a forbidden import**
- **Found during:** Task 2
- **Fix:** The forbidden list is now `@web/api/`, `@web/hooks/`, `@web/store/` and `/estado/`, so the check still means something after the move.
- **Committed in:** cf80bae

**3. [Rule 2 - CLAUDE.md] Text and magic values for the bridge**
- **Found during:** Task 3
- **Issue:** `useAlmacen` needs an error message, which W8 requires to live in strings.ts. The visibility effects would also have repeated the `"visibilitychange"` and `"visible"` literals.
- **Fix:** I added `TEXTO_ALMACEN.fueraDelProveedor`, plus `EVENTO_VISIBILIDAD`, `VISIBILIDAD_VISIBLE` and `SIN_CASOS` in ui.constants.ts. The old hooks keep their literals until 05-03 deletes them.
- **Committed in:** 3c016ad

**4. [Plan wording] Acceptance check `grep -c "createContext" web/src/store/usar-almacen.ts` prints 2, not 1**
- The import line also contains the word. There is exactly one `createContext<...>(null)` call (`grep -c "createContext<"` prints 1).

**5. [Naming] Initial states follow the plan's names**
- The plan names them `estadoSaludInicial` and `estadoDialogoSesionInicial`. My first RED draft used `estadoInicial*`, and I aligned it before GREEN.

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 CLAUDE.md), plus 2 notes on plan wording.
**Impact on plan:** None on scope. Every fix keeps an existing rule or test meaningful after the move.

## Issues Encountered

- `main` is reported as a protected branch by `git.base-branch --is-protected`. The project runs with `branching_strategy: none`, every earlier plan (including 05-01 in this phase) committed to `main`, and the orchestrator dispatched this executor sequentially on the main working tree with normal commits. So I committed there and did not push. The orchestrator owns push.
- Until 05-03 deletes `web/src/hooks/usar-reintento-config.ts`, `web/src` has two `setInterval` call sites: the old hook and `useSincronizacion`. Only the mounted one runs, and the store bridge is not mounted yet, so at runtime there is still exactly one config retry interval and no health polling (T33). 05-03 must delete the old hook when it mounts `useSincronizacion`.

## Known Stubs

None. The Task 1 `refrescarSalud` placeholder was replaced in Task 3 (`3c016ad`), and its call site did not change.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 05-03 can create the instance once in `main.tsx` with `crearInstancia(dependenciasReales)`, wrap `App` in `ProveedorAlmacen`, call `useSincronizacion()` once, and replace `useChat`, `useSalud`, `useReintentoConfig` and the `nuevaSesionAbierta` `useState` with `useSeleccion` and `useAcciones`.
- `ControlChat` and `ControlSalud` remain in chat.type.ts until 05-03 deletes the hooks.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED

All 15 created files exist and the 6 task commits (ea1cd3c, 8f4445c, 3d949b3, cf80bae, a6da5a7, 3c016ad) are ancestors of HEAD. Plan verification: `bun test tests/web tests/arquitectura-web.test.ts` 394 pass, 0 fail; `bun run check` green; `test ! -d web/src/state` succeeds; full suite 2569 pass, 2 skip (pre-existing live tests), 0 fail.
