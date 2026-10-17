---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 06
subsystem: ui
tags: [react, features, hooks, store, files, preview, happy-dom, bun-test]

requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-05 chat containers in features; 05-02/05-03 store with named selectors and actions (useSeleccion, useAcciones); W14-W18 and W20 guardians with CARPETAS_EN_MUDANZA"
provides:
  - "casos/panel-casos with usePanelCasos (progresos, marcas, envioDeshabilitado and the title id, returned as ready block props)"
  - "casos/bloque-caso extracted from the panel, with useBloqueCaso (open and preview state, the files control, the disk-notice decision, enviarTexto)"
  - "casos/progreso-caso and archivos/aviso-disco-efimero as feature components with no hook"
  - "archivos/lista-archivos with useArchivos (moved from web/src/hooks/usar-archivos.ts) and useFilaArchivo (download href, name and click)"
  - "archivos/dialogo-vista-previa with useDialogoVistaPrevia (refs, title id, open/close effect, the preview request with its 404 and 401 handling)"
  - "DOM characterizations: a 401 while listing or previewing returns to the access screen; the D-67 disk notice and its chip; the stage labels"
affects: [05-07, 05-08, 05-09]

actuals:
  tokens: 10400
  tasks: 3
  commits: 7
plan_head_before: e9f4f151fc4424916d7f32e0f846b93c9462b05e
plan_head_after: f966510e14d8101f5062b027dae9d2ea00e7279d

tech-stack:
  added: []
  patterns:
    - "A list container hook returns the child props already computed (ControlPanelCasos.bloques is a PropsBloqueCaso[]), so the view spreads them"
    - "A row inside a view gets its network-derived values (href, download name) and its click handler from the folder's own hook, so the view never imports the api folder"
    - "A hook that needs a store action reads it with useAcciones instead of receiving it as a prop (vencerAcceso in useBloqueCaso and useDialogoVistaPrevia)"

key-files:
  created:
    - web/src/features/casos/panel-casos/usar-panel-casos.ts
    - web/src/features/casos/bloque-caso/bloque-caso.tsx
    - web/src/features/casos/bloque-caso/usar-bloque-caso.ts
    - web/src/features/casos/bloque-caso/bloque-caso.module.css
    - web/src/features/archivos/dialogo-vista-previa/usar-dialogo-vista-previa.ts
  modified:
    - web/src/features/casos/panel-casos/panel-casos.tsx and panel-casos.module.css (moved from web/src/components; block classes moved out)
    - web/src/features/casos/progreso-caso/progreso-caso.tsx and .module.css (moved)
    - web/src/features/archivos/lista-archivos/lista-archivos.tsx and .module.css (moved)
    - web/src/features/archivos/lista-archivos/usar-lista-archivos.ts (moved from web/src/hooks/usar-archivos.ts)
    - web/src/features/archivos/dialogo-vista-previa/dialogo-vista-previa.tsx and .module.css (moved)
    - web/src/features/archivos/aviso-disco-efimero/aviso-disco-efimero.tsx and .module.css (moved)
    - web/src/app.tsx
    - web/src/types/ui.type.ts
    - web/src/types/chat.type.ts
    - tests/arquitectura-web.test.ts
    - tests/web/dom/app-panel.test.tsx

key-decisions:
  - "usePanelCasos returns { idTitulo, bloques }, where each bloque is the full PropsBloqueCaso (progreso, reciente, marca, envioDeshabilitado); the panel view only checks bloques.length and spreads each one"
  - "envioDeshabilitado still flows from the panel to the block as a prop (the panel reads it, per D-101), while enviarTexto and vencerAcceso come from useAcciones inside the hooks"
  - "OpcionesArchivos and ControlArchivos moved from chat.type.ts to ui.type.ts, because they are hook types; EstadoListaArchivos stays in chat.type.ts"
  - "useDialogoVistaPrevia takes { caso, abierta, alDescargar, alNoEncontrado } and also returns a descargar handler, so the view no longer carries the inline null check; alCerrar stays a view prop wired to onClose"

patterns-established:
  - "Each RED in this plan is a guardian expectation (the new view path in VISTAS_MIGRADAS) plus, where a behavior had no DOM test, a characterization that passes against the legacy component"

requirements-completed: [FE-01, FE-03, FE-06]

coverage:
  - id: D1
    description: "The cases panel, the extracted case block and the files list are feature components; listing and downloading happen only in hooks, and the files-panel flow (list after armar_paquete, Ver opens the modal preview, focus returns to Ver) is unchanged"
    requirement: FE-01
    verification:
      - kind: integration
        ref: "tests/web/dom/app-panel.test.tsx#tras armar el paquete el panel lista el caso, trae sus archivos y Ver abre la vista previa"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W14: cada carpeta de componente de features/ y compartido/ tiene su vista"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W15: las vistas solo importan su hook, otras vistas, la config y tipos"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W17: cada módulo CSS lo importa solo la vista de su carpeta con el mismo nombre"
        status: pass
    human_judgment: false
  - id: D2
    description: "No view under web/src/features imports the api folder: rutaDeDescarga and nombreDeDescarga live in usar-lista-archivos.ts and obtenerVistaPrevia lives in usar-dialogo-vista-previa.ts"
    requirement: FE-03
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W16: la carpeta api solo la importan los hooks usar-*.ts, el almacén y la propia api"
        status: pass
      - kind: other
        ref: "grep -c rutaDeDescarga lista-archivos.tsx = 0; grep -c obtenerVistaPrevia dialogo-vista-previa.tsx = 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "A 401 while listing files or while previewing sends the analyst back to the access screen with the server notice"
    requirement: FE-06
    verification:
      - kind: integration
        ref: "tests/web/dom/app-panel.test.tsx#un 401 al listar los archivos devuelve a la pantalla de acceso con el aviso del servidor"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app-panel.test.tsx#un 401 al pedir la vista previa devuelve a la pantalla de acceso con el aviso del servidor"
        status: pass
    human_judgment: false
  - id: D4
    description: "The D-67 ephemeral-disk notice appears for a done case whose files are missing, and its chip sends exactly one TEXTO_DISCO.mensaje(caso) and is disabled during the turn; the stage list shows each label with its state"
    requirement: FE-06
    verification:
      - kind: integration
        ref: "tests/web/dom/app-panel.test.tsx#un caso hecho sin sus archivos en disco muestra el aviso de reinicio y su chip lo vuelve a procesar"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "The preview dialog is a feature component: the masked table and text stay React text nodes, a 404 shows the restart hint and marks the files as deleted"
    requirement: FE-06
    verification:
      - kind: integration
        ref: "tests/web/dom/app-panel.test.tsx#un 404 al pedir la vista previa muestra la pista de reinicio del servidor"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W5: sin dangerouslySetInnerHTML ni innerHTML"
        status: pass
    human_judgment: true
    rationale: "happy-dom proves the markup and the flow, but the modal look, the masked table layout and the real download to disk can only be judged in a browser (eli-qa, D-116)"

duration: 7min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 06: Cases panel and files into features Summary

**The cases panel, a case block extracted from it, the stage progress, the files list, the preview dialog and the ephemeral-disk notice now live in `web/src/features/casos/` and `web/src/features/archivos/`. Listing, downloading and previewing happen only in `usar-*.ts` hooks, so no view in this area imports `web/src/api/`.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-16T18:40:57Z
- **Completed:** 2026-10-16T18:47:31Z
- **Tasks:** 3
- **Files modified:** 25 (17 component files under `features/casos` and `features/archivos`, 9 legacy files moved or removed, `app.tsx`, 2 type files and 2 test files)

## Accomplishments

- **`casos/panel-casos`.** `usePanelCasos()` reads `progresos`, `marcasDeArchivos` and `envioDeshabilitado` with named selectors and owns the title id. It returns the props of each block ready to use. `PanelCasos` takes no props, and `Pantalla` renders `<PanelCasos />`.
- **`casos/bloque-caso`.**
  - Extracted from the panel, with its own CSS module (`bloque`, `resumen`, `chevron`, `caso`, `detalle`).
  - `useBloqueCaso({ progreso, reciente, marca })` owns `abierto` (synced from `reciente`), the open preview, `alVer`, `alCerrarVistaPrevia` (focus back to the trigger) and `alAlternar`.
  - It calls `useArchivos` with `vencerAcceso` from `useAcciones` and returns the `discoBorrado` decision and `enviarTexto`.
- **`archivos/lista-archivos`.**
  - `useArchivos` moved from `web/src/hooks/usar-archivos.ts` without a behavior change.
  - `useFilaArchivo(caso, archivo, alDescargar)` returns the download href, the download name and the click handler that prevents the default and downloads.
- **`casos/progreso-caso` and `archivos/aviso-disco-efimero`.** Moved as is. `IconoDeEtapa` stays a presentational switch, and the notice keeps its inline click.
- **`archivos/dialogo-vista-previa`.**
  - `useDialogoVistaPrevia` owns the dialog and close-button refs, the state, the title id and the open/close effect.
  - It also owns the request effect: `obtenerVistaPrevia` with an `AbortController`, then `vencerAcceso` on `ACCESO_VENCIDO`, `alNoEncontrado` on 404 and `estadoDeVistaPreviaFallida`.
  - The view keeps `BadgeDeFila` and `CuerpoVistaPrevia` with the same markup.
- **Tests.** Three new DOM characterizations: a 401 while listing, a 401 while previewing, and the disk notice with its chip and the stage labels. No existing assertion changed.

## Task Commits

1. **Task 1 (tracer): panel, case block and files list.**
   - RED `aa39a9f` (test)
   - GREEN `969e91d` (feat)
2. **Task 2: stage progress and disk notice.**
   - RED `78a47a6` (test)
   - GREEN `db655d0` (feat)
3. **Task 3: preview dialog.**
   - RED `7ee5a43` (test)
   - GREEN `f966510` (feat)

`e9230a9` (`docs(05): sumar W22 y W23 al plan 05-07…`) falls inside the plan range. A planner committed it while this plan ran, and it touches only `05-07-PLAN.md`. The measured `commits: 7` includes it, so 6 of the commits are this plan's.

## TDD Evidence

Each RED is a guardian expectation (the new view paths in `VISTAS_MIGRADAS`), as in 05-04 and 05-05. The components already behave correctly, so a missing-module failure would be INVALID_RED. Each RED was captured as a JUnit XML report from `bun test --reporter=junit` and passed to `check tdd-red-evidence`.

- **Task 1 RED.**
  - Classifier: `RED_EVIDENCE_OK` (target_test_failed).
  - Target: W14. Expected: the folders include `features/casos/panel-casos`. Actual: `toContain` failed. W15 and W17 failed the same way, and 41 tests passed.
  - The new 401-on-list characterization passed in RED against the legacy component, as it should.
  - Semantic assessment: valid RED. The target ran and failed on the planned assertion for the intended reason.
- **Task 2 RED.**
  - Classifier: `RED_EVIDENCE_OK`.
  - Target: W14 for `features/casos/progreso-caso`. W15 and W17 also failed, and 42 tests passed.
  - The disk-notice characterization passed in RED.
  - Semantic assessment: valid RED.
- **Task 3 RED.**
  - Classifier: `RED_EVIDENCE_OK`.
  - Target: W14 for `features/archivos/dialogo-vista-previa`. W15 and W17 also failed, and 43 tests passed.
  - The 401-on-preview characterization passed in RED.
  - Semantic assessment: valid RED.
- **Tracer gate (auto mode).** After `969e91d`, the Task 1 `<verify>` ran again before Task 2 started. `bun test tests/web/dom tests/web/archivos.test.ts tests/arquitectura-web.test.ts` gave 91 pass and 0 fail, and `bun run check` was green.

## Files Created/Modified

- `web/src/features/casos/panel-casos/{panel-casos.tsx, usar-panel-casos.ts, panel-casos.module.css}`: the panel.
- `web/src/features/casos/bloque-caso/{bloque-caso.tsx, usar-bloque-caso.ts, bloque-caso.module.css}`: the extracted case block.
- `web/src/features/casos/progreso-caso/{progreso-caso.tsx, progreso-caso.module.css}`: the stage list.
- `web/src/features/archivos/lista-archivos/{lista-archivos.tsx, usar-lista-archivos.ts, lista-archivos.module.css}`: the list, `useArchivos` and `useFilaArchivo`.
- `web/src/features/archivos/dialogo-vista-previa/{dialogo-vista-previa.tsx, usar-dialogo-vista-previa.ts, dialogo-vista-previa.module.css}`: the preview modal.
- `web/src/features/archivos/aviso-disco-efimero/{aviso-disco-efimero.tsx, aviso-disco-efimero.module.css}`: the D-67 notice.
- `web/src/app.tsx`: `Pantalla` no longer selects progress, markers or the send-disabled flag for the panel.
- `web/src/types/ui.type.ts`:
  - adds `OpcionesBloqueCaso`, `ControlPanelCasos`, `ControlBloqueCaso`, `ControlFilaArchivo`, `OpcionesDialogoVistaPrevia` and `ControlDialogoVistaPrevia`;
  - receives `OpcionesArchivos` and `ControlArchivos`;
  - narrows `PropsBloqueCaso` and `PropsDialogoVistaPrevia`;
  - drops `PropsPanelCasos`.
- `web/src/types/chat.type.ts`: `OpcionesArchivos` and `ControlArchivos` removed (moved).
- `tests/arquitectura-web.test.ts`: 6 new entries in `VISTAS_MIGRADAS`.
- `tests/web/dom/app-panel.test.tsx`: 3 new characterizations. The mount-and-list steps were split into `pedirElListado` so the 401-on-list test does not wait for the reply text. `procesarCaso` and the existing assertions are unchanged.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing characterization] 401 handling in this area had no DOM test**
- **Found during:** Task 1 RED (and Task 3 RED)
- **Issue:** The plan's behaviors require that a 401 while listing or previewing returns to the access screen. No DOM test covered either case, so moving `useArchivos` and the preview request would have been unproven.
- **Fix:** Added two characterizations before moving the components. Both passed against the legacy code.
- **Files modified:** `tests/web/dom/app-panel.test.tsx`
- **Committed in:** `aa39a9f`, `7ee5a43`

**2. [Rule 3 - Blocking] The 401-on-list test could not wait for the reply text**
- **Found during:** Task 1 RED
- **Issue:** The block opens as soon as the case appears, so the 401 on the list moves the App to the access screen before the reply text renders. A test built on `procesarCaso` timed out.
- **Fix:** Extracted `pedirElListado` (mount and click the list chip). `procesarCaso` now calls it and then waits for the reply as before.
- **Files modified:** `tests/web/dom/app-panel.test.tsx`
- **Committed in:** `aa39a9f`

**3. [Plan shape] `useDialogoVistaPrevia` options**
- **Found during:** Task 3
- **Issue:** The plan named the options `{ caso, abierta, alCerrar, alNoEncontrado }`. The hook does not use `alCerrar`, which stays wired to the dialog's `onClose`. It does need `alDescargar`, to move the inline download null-check out of the view.
- **Fix:** The options are `{ caso, abierta, alDescargar, alNoEncontrado }`, and the hook returns `descargar`.
- **Committed in:** `f966510`

---

**Total deviations:** 3 (1 missing characterization, 1 blocking test shape, 1 hook-signature adjustment).
**Impact on plan:** None on scope or behavior.

## Issues Encountered

- `docs/estructura.md` still names the old `web/src/components/` files of this area. The phase docs update belongs to 05-07 (rules and docs), so it was left for that plan.
- D-123 and D-124 compliance:
  - A grep finds no `===`, `!==` or `case` against a string literal in the six new folders.
  - The hooks compare against `RESULTADO_API`, `ESTADO_VISTA_PREVIA` and `ESTADO_LISTA_ARCHIVOS`.
  - The view maps `ESTADO_CAMPO` from the shared `src/config/constants`.
- The commits are on local `main` (`branching_strategy: none`, sequential executor). Nothing was pushed.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- `web/src/components/` now holds only `pantalla-acceso`, and `web/src/hooks/` holds only `usar-diseno` and `usar-pestanas`. Both are left for 05-07 (access screen and layout).
- `Pantalla` still uses `seleccionarFirmaDelProgreso` for the tab change dot.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED

- All 17 component files under the six new folders exist, and the 10 legacy files (`web/src/hooks/usar-archivos.ts` and the five `.tsx` plus `.module.css` pairs) are gone.
- The 6 plan commits (aa39a9f, 969e91d, 78a47a6, db655d0, 7ee5a43 and f966510) are ancestors of HEAD, and `check evaluation-scope --plan 05-06 --commits-only` resolves them.

Plan verification:
- `bun test`: 2588 pass, 2 skip (the existing live tests) and 0 fail across 128 files.
- `bun run check` is green.
- `bun run build:web` built.
- W16 is green.
