---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 05
subsystem: ui
tags: [react, features, hooks, store, auto-scroll, happy-dom, bun-test]

requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-04 leaves in features/ and compartido/ (mensaje, indicador-pensando, grupo-herramientas, tarjeta-confirmacion, tarjeta-resultado, aviso, iconos); 05-02/05-03 store with named selectors and actions"
provides:
  - "chat/compositor with useCompositor (draft, limit, counter, keyboard contract, submit and Detener from the store)"
  - "chat/acciones-rapidas with useAccionesRapidas (cases, disabled state and enviarTexto from the store)"
  - "chat/linea-de-tiempo with useLineaDeTiempo (follow-the-end refs, resize observer, layout effect, scroll signals, per-turn derivations, notice actions, thinking indicator data, live announcement)"
  - "chat/estado-vacio extracted from the timeline, rendering the same copy and the full-label chips itself"
  - "Pantalla renders LineaDeTiempo, AccionesRapidas and Compositor without threading store data"
  - "DOM characterizations: compact chips at 375 px, and the empty state and thinking indicator inside the timeline"
affects: [05-06, 05-07, 05-08, 05-09]

actuals:
  tokens: 13250
  tasks: 3
  commits: 8
plan_head_before: 433ebc40647d5325c27bfd1b9db658fff34d2771
plan_head_after: ccbbfcf146f60510adb527b158bc291776380c70

tech-stack:
  added: []
  patterns:
    - "A container hook returns ready props for its child views (TurnoEnLinea.confirmaciones is a PropsPilaConfirmaciones), so the view spreads them and computes nothing"
    - "A hook returns finished text for conditional copy (ayuda, uso, contador.texto) and a null when the piece is hidden; the view only branches on null"
    - "A container that needs a ref on its own DOM gets RefObject values from its hook (zona, contenido) and only attaches them"

key-files:
  created:
    - web/src/features/chat/compositor/usar-compositor.ts
    - web/src/features/chat/acciones-rapidas/usar-acciones-rapidas.ts
    - web/src/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts
    - web/src/features/chat/estado-vacio/estado-vacio.tsx
    - web/src/features/chat/estado-vacio/estado-vacio.module.css
  modified:
    - web/src/features/chat/compositor/compositor.tsx and compositor.module.css (moved from web/src/components)
    - web/src/features/chat/acciones-rapidas/acciones-rapidas.tsx and acciones-rapidas.module.css (moved)
    - web/src/features/chat/linea-de-tiempo/linea-de-tiempo.tsx and linea-de-tiempo.module.css (moved; vacio* classes moved out)
    - web/src/app.tsx
    - web/src/types/ui.type.ts
    - tests/arquitectura-web.test.ts
    - tests/web/acciones-rapidas.test.ts
    - tests/web/dom/app-angosto.test.tsx
    - tests/web/dom/app.test.tsx

key-decisions:
  - "useCompositor returns the counter as { texto, enElLimite } or null, the help text, the usage text or null, and the aria-describedby string, so the view never calls TEXTO_CHAT.contador or decides which ids describe the field"
  - "useAccionesRapidas returns corta, deshabilitadas, cantidadCasos and three click handlers; the view keeps the label and aria-label conditionals and the disabled conditions exactly as before (todos also off with zero cases)"
  - "useLineaDeTiempo returns per turn a TurnoEnLinea { turno, enCurso, resultados, confirmaciones } where confirmaciones are the full PilaConfirmaciones props; Turno spreads them, so the per-turn derivations live in the hook"
  - "The thinking indicator moved from a Pantalla child into the timeline: the hook returns { etiqueta, marca } or null, and the view renders it after the body inside the content, the same DOM position it had"
  - "The hydrating characterization was not added: the network helper answers session GETs synchronously, so the loading indicator cannot be held on screen without changing the helper. The branch moved verbatim (CuerpoLinea renders it when cargando)"

patterns-established:
  - "A container migration first adds the view to VISTAS_MIGRADAS (RED on W14), then moves the files with git mv and empties the props of the call site in app.tsx"

requirements-completed: [FE-01, FE-02, FE-03, FE-06]

coverage:
  - id: D1
    description: "The composer is a store-backed feature component: Enter sends, Shift+Enter breaks without a POST, Detener ends a held-open turn and Enviar is gone while it runs"
    requirement: FE-03
    verification:
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#Enter en el compositor envía el borrador"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#Shift+Enter inserta un salto de línea y no envía nada"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#con el turno en curso no sale un segundo envío, y Detener descarta lo que llegue después"
        status: pass
    human_judgment: false
  - id: D2
    description: "The compact chips at 375 px show the short labels, are named with the full labels and send the same PRD demo message"
    requirement: FE-06
    verification:
      - kind: integration
        ref: "tests/web/dom/app-angosto.test.tsx#los chips compactos muestran la etiqueta corta, se anuncian con el nombre completo y mandan el mismo mensaje"
        status: pass
      - kind: unit
        ref: "tests/web/acciones-rapidas.test.ts#el componente no escribe ningún id de caso"
        status: pass
      - kind: unit
        ref: "tests/cli/preflight.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "The timeline and the empty state are feature components; the empty state copy and chips sit inside the timeline, and the thinking indicator appears inside it during a held-open turn and leaves after turn_end"
    requirement: FE-01
    verification:
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#la línea de tiempo muestra el estado vacío con los tres chips y el indicador mientras corre el turno"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W14: cada carpeta de componente de features/ y compartido/ tiene su vista"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W15: las vistas solo importan su hook, otras vistas, la config y tipos"
        status: pass
    human_judgment: false
  - id: D4
    description: "The auto-scroll contract (D-78, D-78.1) is unchanged after moving the follow-the-end logic into useLineaDeTiempo"
    requirement: FE-06
    verification:
      - kind: unit
        ref: "tests/web/seguimiento.test.ts"
        status: pass
    human_judgment: true
    rationale: "reducirSeguimiento keeps its tests, but happy-dom has no layout, so the real scroll following, the Ir al final button and the resize-driven re-pinning can only be observed in a browser"
  - id: D5
    description: "Each container reads only its own slice (the timeline does not select the draft), so typing re-renders the composer and not the timeline"
    requirement: FE-02
    verification:
      - kind: other
        ref: "grep seleccionarBorrador web/src/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts (no match)"
        status: pass
    human_judgment: true
    rationale: "No test measures render counts; the property follows from the selectors each hook calls and is a code-review judgment"

duration: 6min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 05: Chat containers into features Summary

**The composer, the quick-action chips, the timeline and an extracted empty state are now store-backed components under `web/src/features/chat/`. All their logic lives in `useCompositor`, `useAccionesRapidas` and `useLineaDeTiempo`, and `app.tsx` passes them nothing but the two layout flags of the chips.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-16T18:31:57Z
- **Completed:** 2026-10-16T18:38:04Z
- **Tasks:** 3
- **Files modified:** 21 (11 component files under `features/chat`, 4 legacy files moved or removed, `app.tsx`, `ui.type.ts` and 4 test files)

## Accomplishments

- **`chat/compositor`.**
  - `useCompositor` reads `borrador`, `mensajeMaximo`, `enCurso`, `hidratando`, `envioEnPausa` and `usoDeSesion`, and takes `cambiarBorrador`, `enviar` and `detener` from the actions.
  - The hook owns the `useId` ids, `esEnvioPorTeclado`, `contadorVisible` and the submit and keydown handlers.
  - The disabled condition is still `bloqueado || pausado`, and Enter still submits only when neither `enCurso` nor disabled holds.
- **`chat/acciones-rapidas`.**
  - `useAccionesRapidas({ compactas, angosto })` reads `casos` and `envioDeshabilitado` and sends through `enviarTexto`.
  - The fieldset, labels, aria-labels and disabled conditions are unchanged.
- **`chat/linea-de-tiempo`.**
  - `useLineaDeTiempo` owns the refs, `reducirSeguimiento` dispatch, the `ResizeObserver` on the content, the `useLayoutEffect` on the turn count, the scroll handler and `irAlFinal`.
  - It also maps the notice actions (`ACCION_AVISO`), builds every turn's results and confirmation stack, and computes `anuncioDeEstado` and the thinking indicator data.
  - The view keeps `ErrorDelTurno`, `Turno`, `AvisoInicial` and `CuerpoLinea` as presentational pieces.
- **`chat/estado-vacio`.** The heading, body and full-label chips, with the `vacio*` classes moved into their own CSS module.
- **Tests.**
  - The chip test that read source fragments is now a DOM characterization at 375 px.
  - The no-case-id check reads the migrated view and hook.
  - A new DOM characterization pins the empty state inside the timeline and the thinking indicator during a held-open turn.

## Task Commits

1. **Task 1 (tracer): composer.**
   - RED `a36ee87` (test)
   - GREEN `a41e64b` (feat)
2. **Task 2: quick-action chips.**
   - RED `b7a1bc9` (test)
   - GREEN `48e9ac7` (feat)
   - Follow-up `1b365e9` (test: the folder path is written as one literal so the acceptance grep matches)
3. **Task 3: timeline and empty state.**
   - RED `54b7389` (test)
   - GREEN `ccbbfcf` (feat)

`c4da89b` (`docs(05): sumar D-123 y D-124…`) falls inside the plan range, but the user committed it while this plan ran, and it touches only `05-CONTEXT.md`. The measured `commits: 8` includes it, so 7 of the commits are this plan's.

## TDD Evidence

Each RED is a guardian expectation (the new view path in `VISTAS_MIGRADAS`), as in 05-04. The components already behave correctly, so a missing-module failure would be INVALID_RED. Each RED was captured as a JUnit XML report from `bun test --reporter=junit` and passed to `check tdd-red-evidence`.

- **Task 1 RED.**
  - Classifier: `RED_EVIDENCE_OK` (target_test_failed).
  - Target: W14. Expected: the folders include `features/chat/compositor`. Actual: `toContain` failed. W15 and W17 failed the same way, and 38 tests passed.
  - Semantic assessment: valid RED. The target ran and failed on the planned assertion for the intended reason.
- **Task 2 RED.**
  - Classifier: `RED_EVIDENCE_OK`.
  - Target: W14 for `features/chat/acciones-rapidas`. The no-case-id test failed with ENOENT inside the test body, because it now reads the files lazily.
  - The compact-chip DOM test passed in RED, as a characterization of existing behavior should.
  - Semantic assessment: valid RED.
- **Task 3 RED.**
  - Classifier: `RED_EVIDENCE_OK`.
  - Target: W14 for `linea-de-tiempo` and `estado-vacio`.
  - The new timeline DOM characterization passed in RED against the legacy component, which is its purpose.
  - Semantic assessment: valid RED.
- **Tracer gate (auto mode).** After `a41e64b`, the Task 1 `<verify>` ran again before Task 2 started. `bun test tests/web/dom tests/arquitectura-web.test.ts` gave 55 pass and 0 fail, and `bun run check` was green.

## Files Created/Modified

- `web/src/features/chat/compositor/{compositor.tsx, usar-compositor.ts, compositor.module.css}`: the composer view, its hook and its moved styles.
- `web/src/features/chat/acciones-rapidas/{acciones-rapidas.tsx, usar-acciones-rapidas.ts, acciones-rapidas.module.css}`: the chips.
- `web/src/features/chat/linea-de-tiempo/{linea-de-tiempo.tsx, usar-linea-de-tiempo.ts, linea-de-tiempo.module.css}`: the timeline.
- `web/src/features/chat/estado-vacio/{estado-vacio.tsx, estado-vacio.module.css}`: the extracted empty state.
- `web/src/app.tsx`: `Pantalla` no longer selects turns, draft, limit, usage, notices, cards, the thinking label or the cases, and `alAccionDeAviso` moved to the timeline hook.
- `web/src/types/ui.type.ts`:
  - adds `ContadorCompositor`, `ControlCompositor`, `ControlAccionesRapidas`, `TurnoEnLinea` and `ControlLineaDeTiempo`;
  - narrows `PropsAccionesRapidas`, `PropsCuerpoLinea` and `PropsTurno`;
  - drops `PropsCompositor`, `PropsLineaDeTiempo` and `PropsEstadoVacio`.
- `tests/arquitectura-web.test.ts`: 4 new entries in `VISTAS_MIGRADAS`.
- `tests/web/acciones-rapidas.test.ts`: the source-fragment test is gone, and the no-case-id check reads the two migrated files.
- `tests/web/dom/app-angosto.test.tsx`: the compact-chip characterization.
- `tests/web/dom/app.test.tsx`: the timeline characterization. No existing assertion changed. The only removed lines under `tests/web/dom` are two import lines that were expanded.

## Decisions Made

See `key-decisions` in the frontmatter. The main judgment call is where the thinking indicator lives. Before this plan, `Pantalla` passed it as a child of the timeline. Now the timeline hook decides whether it shows (`enCurso`) and with which label and marker. The view renders it in the same DOM position, after the body inside the content.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A stray guardian line in the Task 2 RED commit**
- **Found during:** Task 2 RED
- **Issue:** The text replacement that adds the chips view to `VISTAS_MIGRADAS` also matched an identical line inside a W13 sample list, and Biome flagged the indentation.
- **Fix:** The stray line was removed and the RED commit amended before anything built on it.
- **Files modified:** `tests/arquitectura-web.test.ts`
- **Committed in:** `b7a1bc9`

**2. [Rule 3 - Blocking] The acceptance grep for the chip folder path**
- **Found during:** Task 2 acceptance criteria
- **Issue:** `grep -c "features/chat/acciones-rapidas"` printed 0, because the test built the path from separate `join` segments.
- **Fix:** The folder is now one literal path in `join(RAIZ, "web/src/features/chat/acciones-rapidas")`.
- **Files modified:** `tests/web/acciones-rapidas.test.ts`
- **Committed in:** `1b365e9`

**3. [Rule 2 - Missing characterization] Timeline behaviors had no DOM test**
- **Found during:** Task 3 RED
- **Issue:** The plan's Task 3 behaviors (the empty-state copy and chips inside the timeline, the thinking indicator inside it during a held-open turn and gone after turn_end) had no characterization. The move would have been unproven.
- **Fix:** Added one DOM test to `tests/web/dom/app.test.tsx` before moving the component.
- **Committed in:** `54b7389`

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 missing characterization).
**Impact on plan:** None on scope or behavior.

## Issues Encountered

- The hydrating branch (`TEXTO_CHAT.cargandoConversacion`) has no DOM characterization. The network helper answers session GETs synchronously, so the indicator cannot be held on screen without extending `tests/helpers/red-web.helper.ts`. The branch moved verbatim.
- While this plan ran, the user committed D-123 (comparisons against `as const` objects) and D-124 (the front does not reimplement business rules). The new hooks already comply: they compare against `ACCION_AVISO`, `AVISO_SESION` and `TECLA_ENVIAR`, and decide no business state.
- The commits are on local `main` (`branching_strategy: none`, sequential executor). Nothing was pushed.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- The only containers left in `web/src/components/` are `panel-casos`, `progreso-caso`, `lista-archivos`, `dialogo-vista-previa`, `aviso-disco-efimero` and `pantalla-acceso`. `Pantalla` still passes `PanelCasos` its progress, markers and callbacks.
- Plan 05-09 can add the case cards to `EstadoVacio` without touching the timeline.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED

- All 11 component files under `features/chat/{compositor, acciones-rapidas, linea-de-tiempo, estado-vacio}` exist, and the 3 legacy `.tsx` files are gone.
- The 7 plan commits (a36ee87, a41e64b, b7a1bc9, 48e9ac7, 1b365e9, 54b7389 and ccbbfcf) are ancestors of HEAD, and `check evaluation-scope --plan 05-05 --commits-only` resolves them.

Plan verification:
- `bun test`: 2585 pass, 2 skip (the existing live tests) and 0 fail across 128 files.
- `bun run check` is green.
- `bun run build:web` built.
- `bun test tests/web/seguimiento.test.ts tests/web/dom` gave 44 pass and 0 fail.
