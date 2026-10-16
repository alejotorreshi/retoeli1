---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 07
subsystem: ui
tags: [react, features, store, css-tokens, guardians, bun-test, happy-dom]

requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-02/05-03 store with named selectors and useSincronizacion; 05-04..05-06 every other component migrated into features and compartido; W14-W18 and W20 with CARPETAS_EN_MUDANZA"
provides:
  - "features/disposicion: columnas (useColumnas: screen gate, matchMedia layout, tabs, ids, tabpanel attributes, the single useSincronizacion call), barra-pestanas (useBarraPestanas: roving focus and keys) and estado/pestanas.ts (pure pestanaPorTecla)"
  - "features/acceso: pantalla-acceso (usePantallaAcceso owns the code locally, calls entrar and cargarConfig) and pantalla-carga"
  - "app.tsx renders only ProveedorAlmacen around Columnas; web/src/components, web/src/hooks and web/src/state no longer exist"
  - "Transition closed: CARPETAS_EN_MUDANZA and the legacy W13 patterns removed, samples report the legacy paths"
  - "W12 widened to every web/src CSS except tokens.css (units, percentages, @media exempt) with five new tokens"
  - "W21 (stable named selectors), W22 (D-123, codes only through their as const objects, CODIGOS_DEL_FRONT) and W23 (D-124, no copied business codes, CODIGOS_DE_NEGOCIO)"
  - "TIPO_CAMPO_CODIGO { VISIBLE, OCULTO } for the access field type"
  - "CLAUDE.md, docs/convenciones.md, docs/estructura.md, docs/arquitectura.md and SOLUCION.md describe features, compartido, store and the front guardians; interim range W1–W18 y W20–W23"
affects: [05-08, 05-09]

actuals:
  tokens: 25800
  tasks: 4
  commits: 8
plan_head_before: 021713ebe3529e2338967dbcae35dc22f8b6b5f3
plan_head_after: a846e72d7b4fa45c240342b2707c4b5eb58708b3

tech-stack:
  added: []
  patterns:
    - "A screen gate lives in the root container hook (useColumnas returns the store's acceso union and the view picks PantallaCarga, PantallaAcceso or the layout by comparing against ESTADO_ACCESO)"
    - "A hook that renders a list returns each item ready for the view, with its ref callback and click handler (useBarraPestanas returns PestanaEnBarra[])"
    - "Front code families are detected mechanically: every exported plain object of web/src/config/constants/*.constants.ts whose values are all lower snake case strings"
    - "Positional literal checks run over a line where each plain literal is normalized to an empty or non-empty token, so a ? or : inside a string never reads as a ternary"

key-files:
  created:
    - web/src/features/disposicion/columnas/columnas.tsx
    - web/src/features/disposicion/columnas/columnas.module.css
    - web/src/features/disposicion/barra-pestanas/barra-pestanas.tsx
    - web/src/features/disposicion/barra-pestanas/usar-barra-pestanas.ts
    - web/src/features/disposicion/barra-pestanas/barra-pestanas.module.css
    - web/src/features/disposicion/estado/pestanas.ts
    - web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts
    - web/src/features/acceso/pantalla-carga/pantalla-carga.tsx
    - web/src/features/acceso/pantalla-carga/pantalla-carga.module.css
    - tests/web/pestanas.test.ts
  modified:
    - web/src/features/disposicion/columnas/usar-columnas.ts (moved from web/src/hooks/usar-diseno.ts, absorbs usar-pestanas.ts)
    - web/src/features/acceso/pantalla-acceso/pantalla-acceso.tsx and .module.css (moved from web/src/components)
    - web/src/app.tsx
    - web/src/config/constants/ui.constants.ts
    - web/src/types/ui.type.ts
    - web/src/styles/global.css
    - web/src/styles/tokens.css
    - four module CSS files (bloque-caso, linea-de-tiempo, grupo-herramientas, tarjeta-herramienta)
    - tests/arquitectura-web.test.ts
    - tests/web/dom/app-acceso.test.tsx
    - tests/docs/solucion.test.ts
    - docs/convenciones.md, docs/estructura.md, docs/arquitectura.md, SOLUCION.md, .claude/CLAUDE.md

key-decisions:
  - "usePantallaAcceso takes no arguments: the aviso goes straight from Columnas to the view, and the hook calls cargarConfig from useAcciones after a successful entry (the old alEntrar prop is gone)"
  - "useColumnas returns the store's EstadoAcceso union as the screen to show; the view compares acceso.tipo with ESTADO_ACCESO, so no new screen code family was added"
  - "usePestanas and the matchMedia subscription stay private functions of usar-columnas.ts, the only file the W20 exception names"
  - "#root > main stays in global.css because it lays out the loading and access screens; the column, chat and tab rules moved to the disposicion modules"
  - "W22 and W23 are test code, so the guardian functions went into the RED commit with the samples green and the real-code W22 scan red on the access field ternary; GREEN is the TIPO_CAMPO_CODIGO fix"
  - "W21 filters the exports of selectores.ts by the seleccionar prefix, so memoizarPorReferencia is not called as a selector"

patterns-established:
  - "CODIGOS_DEL_FRONT is built at module load with a top-level await import of every web/src/config/constants file, so the families of 05-08 and 05-09 join W22 with no guardian change"
  - "Docs that are not the canonical guardian lists point to the W table of docs/convenciones.md instead of repeating a range"

requirements-completed: [FE-01, FE-02, FE-03, FE-04, FE-06]

coverage:
  - id: D1
    description: "The layout and tabs are the disposicion feature, app.tsx only provides the store, and the narrow tabs (ArrowRight, ArrowLeft, Home, End) and wide layout behave as before"
    requirement: FE-01
    verification:
      - kind: integration
        ref: "tests/web/dom/app-angosto.test.tsx#las pestañas se recorren con flechas, Inicio y Fin, y solo se ve la vista elegida"
        status: pass
      - kind: unit
        ref: "tests/web/pestanas.test.ts"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W14: cada carpeta de componente de features/ y compartido/ tiene su vista"
        status: pass
    human_judgment: false
  - id: D2
    description: "The access and loading screens are feature components; the access code lives only in usePantallaAcceso local state, is cleared on entry and never reaches localStorage"
    requirement: FE-02
    verification:
      - kind: integration
        ref: "tests/web/dom/app-acceso.test.tsx#un código rechazado muestra el mensaje del servidor y uno aceptado entra sin guardar el código"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app-acceso.test.tsx#mientras verifica el acceso muestra la pantalla de carga y anuncia que está cargando"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W7: sin sessionStorage, y localStorage solo en sesion-local.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "The transition is closed: web/src/components, hooks and state are gone, CARPETAS_EN_MUDANZA and the legacy W13 patterns are removed, and the W13, W15, W16 and W20 samples report the legacy paths"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W13: reporta archivos sueltos o con el sufijo equivocado en web/src"
        status: pass
      - kind: other
        ref: "test ! -d web/src/components && test ! -d web/src/hooks && test ! -d web/src/state; grep -c CARPETAS_EN_MUDANZA tests/arquitectura-web.test.ts = 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every web/src stylesheet except tokens.css obeys the token rule (W12 widened); the loose values became tokens with the same computed values"
    requirement: FE-03
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W12: todo CSS de web/src salvo tokens.css usa tokens para colores, tamaños, unidades y porcentajes"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W12: reporta colores, px, unidades y porcentajes sueltos en cualquier CSS, y salta @media y tokens.css"
        status: pass
    human_judgment: true
    rationale: "The tokens keep the same values, but the rendered rotation, viewport height and argument column width can only be confirmed visually in a browser (eli-qa, D-116)"
  - id: D5
    description: "W21: every exported selector is Object.is-stable on a sample state with a turn, a tool result and a confirmation card, and every useSeleccion gets a named selector"
    requirement: FE-02
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W21: los selectores de web/src/store son estables y useSeleccion solo recibe selectores con nombre"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W21: reporta un selector que crea un valor nuevo en cada llamada y una función en línea en useSeleccion"
        status: pass
    human_judgment: false
  - id: D6
    description: "W22 (D-123) and W23 (D-124): codes travel only through their as const objects and no business code is copied into web/src; the access field type is TIPO_CAMPO_CODIGO"
    requirement: FE-03
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W22: web/src compara, etiqueta, devuelve y asigna códigos solo con su objeto as const"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W22: reporta literales en comparaciones, case, ternarios, retornos y códigos del front, y acepta typeof, in y las constantes"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W23: web/src no copia como literal los códigos de negocio de src/config/constants"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W23: reporta un código de negocio copiado en un hook, en config/constants y en strings.ts, y acepta la constante importada"
        status: pass
    human_judgment: false
  - id: D7
    description: "CLAUDE.md and the docs describe features, compartido, store and the front guardians, with no transition text and the interim range W1–W18 y W20–W23"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/docs/continuidad.test.ts"
        status: pass
      - kind: unit
        ref: "tests/docs/solucion.test.ts#la sección 9 nombra lo que exige el plan"
        status: pass
      - kind: other
        ref: "! grep -rnE 'CARPETAS_EN_MUDANZA|W1–W13|W1-W13|W1 a W13|W1–W23|W1-W23|W1 a W23' docs README.md SOLUCION.md .claude/CLAUDE.md"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 07: Layout, access and the closed transition Summary

**The layout, tabs, access screen and loading screen now live in `features/disposicion` and `features/acceso`, and `app.tsx` only wraps `Columnas` in the store provider. The legacy folders and their guardian exemptions are gone. W12 now covers every stylesheet, and three new guardians cover the front's code: W21 (stable, named selectors), W22 (codes only through their `as const` objects) and W23 (no copied business codes).**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-16T18:56:38Z
- **Completed:** 2026-10-16T19:10:33Z
- **Tasks:** 4
- **Files modified:** 33

## Accomplishments

- **`disposicion`:**
  - `useColumnas` makes the single `useSincronizacion()` call. It also reads `acceso`, `conHistorial` and `firmaDelProgreso` with named selectors, owns the `matchMedia` layout (the W20 exception), the tab state, the ids and the tabpanel attributes, and returns the screen to show.
  - `BarraPestanas` and `useBarraPestanas` handle the roving focus and the keys.
  - `pestanaPorTecla` is a pure helper with its own test.
- **`acceso`:**
  - `usePantallaAcceso` owns the ids, the field ref, `codigo`, `visible`, `pendiente`, `error`, the focus on mount, the call to `entrar` and `cargarConfig` after a successful entry. It returns `tipoCampo` from `TIPO_CAMPO_CODIGO`.
  - `PantallaCarga` is extracted from the old `Pantalla`.
- **Final structure.** `web/src` holds only `api`, `app.tsx`, `compartido`, `config`, `features`, `main.tsx`, `store`, `styles` and `types`.
- **Guardians:**
  - `CARPETAS_EN_MUDANZA` and the legacy patterns are removed.
  - W12 scans every CSS file except `tokens.css`.
  - W21, W22 and W23 each have a real-code scan and negative samples.
- **Docs.** The rules and docs match the code, with the interim range `W1–W18 y W20–W23` until 05-09 adds W19.

## Task Commits

1. **Task 1 (tracer): disposicion feature.**
   - RED `6c9e8c0` (test)
   - GREEN `5298cf4` (feat)
2. **Task 2: access feature and closed transition.**
   - RED `b7bb9be` (test)
   - GREEN `073cfd9` (feat)
3. **Task 3: W22 and W23.**
   - RED `74f0aae` (test)
   - GREEN `b8108b4` (feat)
4. **Task 4: W12 widened, W21, tokens and docs.**
   - RED `d79f612` (test)
   - GREEN `a846e72` (feat)

## TDD Evidence

Each RED was captured as a JUnit report (`bun test --reporter=junit`) and passed to `check tdd-red-evidence`. All four returned `RED_EVIDENCE_OK` (target_test_failed).

- **Task 1.**
  - Target: W14, which expects `features/disposicion/columnas`. W15 and W17 failed the same way, and 38 tests passed.
  - `tests/web/pestanas.test.ts` failed to load in RED because the module did not exist yet. It was not used as the RED target.
  - Semantic assessment: valid. The guardian assertion failed for the intended reason.
- **Task 2.**
  - Target: the W13 sample, which now expects `components/aviso.tsx`, `hooks/usar-x.ts` and `state/x.ts` to be reported. W14, W15, W17 and the W15, W16 and W20 samples also failed.
  - The new loading-screen characterization passed in RED against the legacy markup, as a characterization should.
  - Semantic assessment: valid.
- **Task 3.**
  - Target: the real-code W22 test. It reported exactly `pantalla-acceso.tsx:37`, the access field ternary that the plan predicts. The W22 and W23 samples and the real-code W23 scan were already green.
  - Semantic assessment: valid. The planned assertion failed on the planned line.
- **Task 4.**
  - Target: the real-code W12 test.
  - It reported `global.css` lines 19 (`100dvh`), 73 (`360deg`) and 79 (`0ms`), `90deg` in the four modules and `40%` in `tarjeta-herramienta`. These are exactly the values the plan lists. W21 was green.
  - Semantic assessment: valid.
- **Tracer gate (auto mode).** After `5298cf4`, the Task 1 verify passed again before Task 2 started: `bun test tests/web tests/arquitectura-web.test.ts` gave 417 pass and 0 fail, `bun run check` was green and `bun run build:web` built.

## Files Created/Modified

See `key-files` in the frontmatter. The two deleted hooks (`web/src/hooks/usar-diseno.ts`, moved into `usar-columnas.ts`, and `usar-pestanas.ts`) and `web/src/components/pantalla-acceso.tsx` (moved) are intentional deletions.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The SOLUCION section 9 test required the old range**
- **Found during:** Task 4
- **Issue:** `tests/docs/solucion.test.ts` required `W1–W13` in SOLUCION §9. The plan replaces that range with a pointer to the W table and forbids `W1–W13` anywhere in SOLUCION.md.
- **Fix:** The test now requires `tests/arquitectura-web.test.ts` and `docs/convenciones.md` in that section.
- **Files modified:** `tests/docs/solucion.test.ts`
- **Committed in:** `a846e72`

**2. [Rule 1 - Bug] The W20 real-code check read a deleted file**
- **Found during:** Task 1
- **Issue:** The check read `web/src/hooks/usar-diseno.ts`, which the plan deletes.
- **Fix:** It now reads `usar-columnas.ts` and asserts that `useSyncExternalStore` is imported there and allowed.
- **Committed in:** `5298cf4`

**3. [Rule 2 - Missing characterization] The loading screen had no DOM test**
- **Found during:** Task 2
- **Issue:** The plan moves the VERIFICANDO markup into `PantallaCarga`, but no characterization covered it.
- **Fix:** Added a test that checks `role="status"` with `TEXTO_APP.cargando` inside a busy `main`, then the access heading.
- **Committed in:** `b7bb9be`

**4. [Plan shape] Hook signatures**
- **Issue:** The plan describes `usePantallaAcceso({ aviso })` and `cargarConfig(null)`.
- **What changed:**
  - The hook takes no arguments, because the aviso goes straight to the view.
  - `cargarConfig` keeps its real `AbortSignal` signature, called with a fresh signal as before.
  - `useBarraPestanas` takes `{ control, ids }`, not `control` alone, so it can return each tab's id and panel id ready for the view.
- **Committed in:** `073cfd9`, `5298cf4`

**5. [Acceptance criterion wording] `grep -c "useSincronizacion" usar-columnas.ts` prints 2, not 1**
- **Issue:** One match is the import line and the other is the single call. `grep -c "useSincronizacion()"` prints 1. The intent (one call, from the always-mounted root) holds.

**6. [Scope note] `.qa/evidence` keeps the old paths**
- **Issue:** The final grep in the plan includes `.qa`. The only hits are dated evidence files in `.qa/evidence/` that record Phase 3 runs.
- **Decision:** They were left unchanged, because rewriting them would falsify the evidence. `.qa/suites` has no legacy path, which matches the must-have ("no doc or .qa suite").

---

**Total deviations:** 6 (1 blocking test, 1 bug, 1 missing characterization, 3 shape and scope notes).
**Impact on plan:** None on scope or behavior. Every DOM characterization passes with unchanged assertions.

## Issues Encountered

- Editing `.claude/CLAUDE.md` is listed in the plan and is part of CAL-05. Only the project-rules section changed: the guardian sentence range and the front bullets. No permission or agent configuration changed.

## Known Stubs

- `web/src/features/acceso/pantalla-carga/pantalla-carga.module.css` holds only the layout class. The loading screen stays visually hidden, as before, until plan 05-08 brands it. This is intentional and planned.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 05-08 can brand `PantallaCarga`, `PantallaAcceso` and the header. W22 will pick up `marca.constants.ts` families automatically through `CODIGOS_DEL_FRONT`.
- 05-09 adds W19 and must close the range to `W1–W23` in `docs/convenciones.md` and `.claude/CLAUDE.md`. These are the only two places that still name a range.

Plan verification:
- `bun test`: 2599 pass, 2 skip (the existing live tests) and 0 fail across 129 files.
- `bun run check` is green.
- `bun run build:web` built.
- `bun run demo.ts` exited 0.
- `ls web/src` shows only the nine expected entries.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED

- The created files (columnas, barra-pestanas, pestanas.ts, usar-pantalla-acceso.ts, pantalla-carga and tests/web/pestanas.test.ts) exist.
- The 8 plan commits (6c9e8c0, 5298cf4, b7bb9be, 073cfd9, 74f0aae, b8108b4, d79f612 and a846e72) are ancestors of HEAD.
