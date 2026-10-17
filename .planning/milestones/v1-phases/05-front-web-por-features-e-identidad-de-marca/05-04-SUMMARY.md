---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 04
subsystem: ui
tags: [react, features, compartido, hooks, guardians, happy-dom, bun-test]

requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-03 store mounted in the App, the view/hook/CSS folder pattern, and guardians W14 to W18 and W20 with the CARPETAS_EN_MUDANZA exemption"
provides:
  - "compartido/iconos (the closed set of icons) and compartido/aviso (AvisoError with role alert, AvisoSistema with role status)"
  - "chat/mensaje and chat/indicador-pensando (useAvisoDespertar owns the 10 s wake-up timer)"
  - "herramientas/grupo-herramientas (useGrupoHerramientas) and herramientas/tarjeta-herramienta (useTarjetaHerramienta)"
  - "confirmacion/tarjeta-confirmacion (useTarjetaConfirmacion, usePilaConfirmaciones) and casos/tarjeta-resultado (useTarjetaResultado)"
  - "a DOM characterization that an SSE error event renders a role alert with the server message"
affects: [05-05, 05-06, 05-07, 05-08]

actuals:
  tokens: 10048
  tasks: 3
  commits: 6
plan_head_before: c65b4be1087113deab1cf50edb38bdef067c3a23
plan_head_after: 5d1993a31ff0b243caa3c34250933f21fc7e5601

tech-stack:
  added: []
  patterns:
    - "A view that branches on a computed decision gets a key from its hook (TonoContador) and keeps the key-to-class map, so the decision is in the hook and the class lookup stays in the view"
    - "A list container calls its hook before the early return (usePilaConfirmaciones, then if pila.length === 0 return null)"
    - "A view with several hook-using sub-components keeps them presentational and calls one hook per component (AvisoDespertar calls useAvisoDespertar)"

key-files:
  created:
    - web/src/features/chat/indicador-pensando/usar-indicador-pensando.ts
    - web/src/features/herramientas/grupo-herramientas/usar-grupo-herramientas.ts
    - web/src/features/herramientas/tarjeta-herramienta/usar-tarjeta-herramienta.ts
    - web/src/features/confirmacion/tarjeta-confirmacion/usar-tarjeta-confirmacion.ts
    - web/src/features/casos/tarjeta-resultado/usar-tarjeta-resultado.ts
  modified:
    - web/src/compartido/iconos/iconos.tsx (moved from web/src/components/icons)
    - web/src/compartido/aviso/aviso.tsx and aviso.module.css (moved)
    - web/src/features/chat/mensaje/* (moved)
    - web/src/features/chat/indicador-pensando/indicador-pensando.tsx and .module.css (moved)
    - web/src/features/herramientas/grupo-herramientas/grupo-herramientas.tsx and .module.css (moved)
    - web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx and .module.css (moved)
    - web/src/features/confirmacion/tarjeta-confirmacion/tarjeta-confirmacion.tsx and .module.css (moved)
    - web/src/features/casos/tarjeta-resultado/tarjeta-resultado.tsx and .module.css (moved)
    - web/src/types/ui.type.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/components/linea-de-tiempo.tsx and eight other legacy importers
    - web/src/features/encabezado/aviso-modelo/aviso-modelo.tsx
    - web/src/app.tsx
    - tests/web/dom/app.test.tsx
    - tests/arquitectura-web.test.ts

key-decisions:
  - "Only compartido/aviso joins VISTAS_MIGRADAS from Task 1. compartido/iconos has no CSS module, so listing it would make W17's real-code test demand a CSS file that should not exist"
  - "useGrupoHerramientas returns the finished summary text (TEXTO_HERRAMIENTA.grupo(resumenDeLlamadas(llamadas))) and the toggle handler, so the view only renders"
  - "useTarjetaResultado expresses claseDelNumero as a TonoContador key (an EstadoCampoUi, or TONO_CONTADOR.TENUE when the count is null or 0). The view maps the key to a class through CLASE_DE_TONO"
  - "useTarjetaConfirmacion takes PropsTarjetaConfirmacion as is and returns ready texts (ayuda, textoConfirmar, textoCancelar), so ayudaDeBloqueo and textoDelBoton moved to the hook file"
  - "Each RED is a guardian expectation (the new view paths in VISTAS_MIGRADAS), because the moved components already behave correctly and a missing-module failure would be INVALID_RED"

patterns-established:
  - "Leaves migrate before containers: legacy containers in web/src/components only change import paths, and W15 lets a migrated view import a legacy .tsx while CARPETAS_EN_MUDANZA lasts"

requirements-completed: [FE-01, FE-03, FE-06]

coverage:
  - id: D1
    description: "Icons and notices are shared views under web/src/compartido, with the same exports, and no import of components/icons or components/aviso is left"
    requirement: FE-01
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W14: cada carpeta de componente de features/ y compartido/ tiene su vista"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W12: los módulos CSS usan tokens para colores y tamaños"
        status: pass
      - kind: other
        ref: "test ! -d web/src/components/icons && test ! -f web/src/components/aviso.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "An SSE error event renders a role alert with the server message end to end"
    requirement: FE-06
    verification:
      - kind: automated_ui
        ref: "tests/web/dom/app.test.tsx#un evento de error del servidor se muestra como alerta con su mensaje"
        status: pass
    human_judgment: false
  - id: D3
    description: "Message bubbles, thinking indicator, tool group and tool card live as feature component folders with their logic in usar-<c>.ts hooks"
    requirement: FE-01
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts (W14, W15, W17, W18 with the four new views in VISTAS_MIGRADAS)"
        status: pass
      - kind: automated_ui
        ref: "tests/web/dom (14 tests, unchanged assertions)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The confirmation stack and the result card are feature components; Confirmar and Cancelar still send the structured accion and the result card shows the same counters, firma and bloqueos"
    requirement: FE-03
    verification:
      - kind: automated_ui
        ref: "tests/web/dom/app.test.tsx#la tarjeta de confirmación envía la acción estructurada confirmar / cancelar"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W15: las vistas solo importan su hook, otras vistas, la config y tipos"
        status: pass
      - kind: other
        ref: "bun run build:web"
        status: pass
    human_judgment: false
  - id: D5
    description: "Migrated views import nothing from features/*/estado, the api folder or react values (FE-03), and no visible text was added outside strings.ts"
    requirement: FE-03
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts (W5, W8, W15, W16, W18)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 04: Hojas de la conversación en sus features Summary

**The icons and notices moved to `web/src/compartido`, and the message bubbles, thinking indicator, tool group, tool card, confirmation stack and result card each moved into a feature folder with view, hook and CSS. The 10 s wake-up timer, the group's open state, the firma and bloqueo decisions and the counter tones now live in `usar-*.ts` hooks. A new DOM test checks that a server error event renders as an alert.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-10-16T18:23:21Z
- **Completed:** 2026-10-16T18:29:30Z
- **Tasks:** 3 (Task 1 was a tracer)
- **Files modified:** 33

## Accomplishments

- `iconos.tsx` moved to `compartido/iconos/`, and `aviso.tsx` moved with its CSS to `compartido/aviso/`. Both were moved with `git mv` and neither has a hook. Eleven importers now point at `@web/compartido/...`:
  - the legacy components;
  - `aviso-modelo.tsx`;
  - the moved views.
- `tests/web/dom/app.test.tsx` has a new test. Its guion sends `turn_start`, then an `error` event with `PROVEEDOR_TIMEOUT` and a message, then `turn_end`. The test checks that `findByRole("alert")` contains that message.
- `chat/mensaje` has no hook. `chat/indicador-pensando` gets `useAvisoDespertar()`, which holds the same `useState` and `setTimeout(ESPERA_DESPERTAR_MS)`. `AvisoDespertar` is still a presentational component and still remounts with `key={marca}`.
- `herramientas/grupo-herramientas` gets `useGrupoHerramientas(llamadas, enCurso)`. It returns `abierto`, the summary text and `alAlternar`. `herramientas/tarjeta-herramienta` gets `useTarjetaHerramienta(llamada)`, which returns `fallida` and the readable arguments. `IconoDeEstado` and `CLASE_DE_ESTADO` stay in the view.
- `confirmacion/tarjeta-confirmacion` has two hooks:
  - `useTarjetaConfirmacion(props)` returns both ids, `firma`, `abierta`, `bloqueada`, `cantidadBloqueos`, the help text, both button texts and `responder`.
  - `usePilaConfirmaciones(tarjetas, turnos)` pairs each card with `listoParaFirmaHasta`.

  The view keeps the roles, the `aria-describedby` links, `CLASE_DE_FIRMA` and `CLASE_DE_DESENLACE`.
- `casos/tarjeta-resultado` gets `useTarjetaResultado(resultado)`. It returns the id, `firma`, `paqueteArmado` and the counters, each with a `tono` key. The view maps each key to a class through `CLASE_DE_TONO`.
- `bun test` gave 2584 pass, 2 skip and 0 fail. `bun run check` and `bun run build:web` are green.

## Task Commits

1. **Task 1 (tracer): icons and notices to compartido, and the error alert characterization.** `93ac261` (test, RED) and `36d1a31` (feat, GREEN)
2. **Task 2: message, thinking indicator and tool views.** `5bc8c8e` (test, RED) and `a77db26` (feat, GREEN)
3. **Task 3: confirmation stack and result card.** `55d9ec9` (test, RED) and `5d1993a` (feat, GREEN)

No REFACTOR commit was needed.

## TDD Gate Compliance

Each RED ran `bun test tests/arquitectura-web.test.ts --reporter=junit`, and the unchanged JUnit report went to `gsd-tools check tdd-red-evidence`. Every RED returned `RED_EVIDENCE_OK` (`target_test_failed`).

- **Task 1 RED (`93ac261`).**
  - Target: `W14: cada carpeta de componente de features/ y compartido/ tiene su vista`.
  - Expected: `compartido/aviso` exists as a component folder.
  - Actual: `toContain` failed because the folder did not exist yet. W12, W15 and W17 failed the same way, on the new `compartido/aviso` path.
  - The new error-alert characterization passed in RED. It pins behavior that already exists, so it guards the move and is not the RED target.
  - Semantic assessment: valid RED. The target ran and failed on the planned assertion for the intended reason.
- **Task 2 RED (`5bc8c8e`).**
  - Target: W14.
  - Expected: the four chat and herramientas folders exist.
  - Actual: `toContain` failed. W15 and W17 failed the same way.
  - Semantic assessment: valid RED.
- **Task 3 RED (`55d9ec9`).**
  - Target: W14.
  - Expected: the `confirmacion/tarjeta-confirmacion` and `casos/tarjeta-resultado` folders exist.
  - Actual: `toContain` failed. W15 and W17 failed the same way.
  - Semantic assessment: valid RED.
- **Tracer gate (auto mode).** After `36d1a31`, the Task 1 `<verify>` ran again before Task 2 started. `bun test tests/web/dom tests/arquitectura-web.test.ts` gave 55 pass and 0 fail, and `bun run check` was green. The tracer was verified end to end before expanding.

## Files Created/Modified

- `web/src/compartido/iconos/iconos.tsx` and `web/src/compartido/aviso/{aviso.tsx, aviso.module.css}`: the shared views. Only their paths changed.
- `web/src/features/chat/{mensaje, indicador-pensando}/*`, `web/src/features/herramientas/{grupo-herramientas, tarjeta-herramienta}/*`, `web/src/features/confirmacion/tarjeta-confirmacion/*` and `web/src/features/casos/tarjeta-resultado/*`: views, hooks and CSS modules.
- `web/src/types/ui.type.ts`: adds `ControlGrupoHerramientas`, `ControlTarjetaHerramienta`, `TarjetaEnPila`, `ControlTarjetaConfirmacion`, `TonoContador`, `ContadorConTono` and `ControlTarjetaResultado`.
- `web/src/config/constants/ui.constants.ts`: adds `TONO_CONTADOR = { TENUE: "tenue" }`.
- Importers whose import lines changed:
  - `web/src/components/linea-de-tiempo.tsx`, `aviso-disco-efimero.tsx`, `lista-archivos.tsx`, `panel-casos.tsx`, `progreso-caso.tsx` and `pantalla-acceso.tsx`;
  - `web/src/features/encabezado/aviso-modelo/aviso-modelo.tsx`;
  - `web/src/app.tsx`.
- `tests/web/dom/app.test.tsx`: one new test. No existing assertion changed, and `git diff` shows no removed lines under `tests/web/dom`.
- `tests/arquitectura-web.test.ts`: W12 now expects `compartido/aviso/aviso.module.css`, and `VISTAS_MIGRADAS` has 7 new views.

## Decisions Made

See `key-decisions` in the frontmatter. The main judgment call is the tone key for the result counters. `claseDelNumero` mixed a decision (dim a count that is null or 0) with a class lookup. The decision moved to the hook as `TonoContador`. The lookup stayed in the view as a constant-to-class map, which the plan explicitly allows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] W12 named the old path of the notice CSS**
- **Found during:** Task 1
- **Issue:** The W12 real-code test asserted that `web/src/components/aviso.module.css` exists, so the planned move would have broken it.
- **Fix:** The assertion now names `web/src/compartido/aviso/aviso.module.css`. The rule body is unchanged.
- **Files modified:** `tests/arquitectura-web.test.ts`
- **Committed in:** `93ac261`

**2. [Rule 2 - Missing constant] `TONO_CONTADOR` for the dimmed counter**
- **Found during:** Task 3
- **Issue:** The plan asks for "a tone key the view maps to a class". The dimmed tone had no constant, and a bare `"tenue"` literal would break the project's constants rule.
- **Fix:** Added `TONO_CONTADOR` to `ui.constants.ts`. `TonoContador` is derived from it with `ValorDe`.
- **Committed in:** `5d1993a`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing constant).
**Impact on plan:** None on scope or behavior.

## Issues Encountered

- Git recorded `grupo-herramientas.tsx` as a delete plus an add, because most of its body moved into the hook. Every other component and every CSS module was recorded as a rename.
- `docs/estructura.md` still mentions `web/src/components/icons/`. Plans 05-07 and 05-08 own that file, so I left it for them, as 05-03 did.
- The commits are on local `main` (`branching_strategy: none`, sequential executor). Nothing was pushed.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 05-05 can move the containers: `linea-de-tiempo`, `panel-casos`, `progreso-caso`, `lista-archivos` and the others. All their leaves already live in `features/` or `compartido/`, so each container moves once and only its own imports change.
- `UBICACIONES_WEB` still accepts `web/src/components/(icons/)?`. Plan 05-07 removes that when it empties `CARPETAS_EN_MUDANZA`.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED

All 9 created or moved key files exist. The 6 task commits (93ac261, 36d1a31, 5bc8c8e, a77db26, 55d9ec9 and 5d1993a) are ancestors of HEAD, and `check evaluation-scope --plan 05-04 --commits-only` resolves them.

Plan verification:
- `bun test`: 2584 pass, 2 skip (the existing live tests) and 0 fail across 128 files.
- `bun run check` is green.
- `bun run build:web` built.
- `tests/arquitectura-web.test.ts` passes with the new folders scanned.
