---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 09
subsystem: ui
tags: [react, css-tokens, empty-state, a11y, guardians, bun-test, happy-dom]

requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-07 feature structure, store selectors, W22/W23 and CODIGOS_DEL_FRONT; 05-08 brand tokens, Outfit titles and pill controls"
provides:
  - "PAIS, SEPARADOR_SLUG and SEPARADOR_PALABRAS (pais.constants.ts); Pais, DatosTarjetaCaso, PropsTarjetaCaso, PaisDeTarjeta, ControlTarjetaCaso and ControlEstadoVacio types"
  - "Pure datosDeTarjetaCaso and esPaisConocido in features/chat/estado/tarjeta-caso.ts (indexOf and split, no regex)"
  - "TarjetaCaso (features/chat/tarjeta-caso) with useTarjetaCaso: native button, accessible name, disabled with envioDeshabilitado, sends mensajeDemoDe(slug) through enviarTexto"
  - "EstadoVacio full contract with useEstadoVacio: Casos disponibles and Acciones rápidas sections labelled by h3, Cargando los casos, hidden section for casos [], focus hand-off to the composer"
  - "TEXTO_ACCIONES.mensajeDemoDe (single PRD request template, literal-typed), TEXTO_PAIS, TEXTO_TARJETA_CASO, TEXTO_ESTADO_VACIO, new vacioCuerpo"
  - "seleccionarConfigCargada, ID_CAMPO_MENSAJE, tokens --alto-pildora-pais, --columnas-tarjetas-caso, --columnas-tarjetas-caso-angosto"
  - "W19 guardian (no section sign in web/src/config/strings.ts, src/config/strings.ts or web/index.html) and the complete front range W1–W23 in docs/convenciones.md"
  - "red-web helper option configDisponible and method fijarConfigDisponible"
affects: [eli-qa, phase-05-verification]

actuals:
  tokens: 14800
  tasks: 3
  commits: 6
plan_head_before: ad83b1f0fc84500324ad505a7bcf9c1fb69a029c
plan_head_after: 8f1f8aa7ae312e7a1b5154b30b44bfdb48d81751

tech-stack:
  added: []
  patterns:
    - "A visible-text template that tests compare by literal type is a generic function returning an `as const` template literal, so the applied value keeps its literal type (mensajeDemoDe(CASO_DEMO_PRD))"
    - "Focus hand-off on unmount: a useLayoutEffect cleanup in the container hook checks contains(document.activeElement) and focuses the composer by its stable id; layout cleanups run before React detaches the deleted subtree"
    - "One DOM for two card layouts: CSS grid areas in ancho and medio with the detail wrapper as display: contents, and a row grid in angosto where the same wrapper becomes a flex line"

key-files:
  created:
    - web/src/config/constants/pais.constants.ts
    - web/src/features/chat/estado/tarjeta-caso.ts
    - web/src/features/chat/tarjeta-caso/tarjeta-caso.tsx
    - web/src/features/chat/tarjeta-caso/usar-tarjeta-caso.ts
    - web/src/features/chat/tarjeta-caso/tarjeta-caso.module.css
    - web/src/features/chat/estado-vacio/usar-estado-vacio.ts
    - tests/web/tarjeta-caso.test.ts
  modified:
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/types/ui.type.ts
    - web/src/store/selectores.ts
    - web/src/styles/tokens.css
    - web/src/features/chat/estado-vacio/estado-vacio.tsx and estado-vacio.module.css
    - web/src/features/chat/compositor/compositor.tsx and usar-compositor.ts
    - web/src/features/chat/acciones-rapidas/acciones-rapidas.module.css
    - src/config/strings.ts
    - tests/web/dom/app.test.tsx
    - tests/web/dom/app-angosto.test.tsx
    - tests/web/acciones-rapidas.test.ts
    - tests/arquitectura-web.test.ts
    - tests/helpers/red-web.helper.ts and tests/helpers/types/red-web.type.ts
    - docs/convenciones.md
    - .qa/suites/03.suite.json

key-decisions:
  - "mensajeDemoDe is a generic function returning an as const template literal, so mensajeDemo keeps the PRD literal type and tests/cli/preflight.test.ts still types its toBe against TEXTO_PREFLIGHT.mensajeGuion"
  - "A known prefix with nothing after the hyphen (co-) falls back to the slug-only card, like an unknown prefix, so the client is never empty"
  - "The angosto line renders country, TEXTO_APP.separador and slug as three spans instead of one lineaPaisSlug string, so the slug keeps the mono font"
  - "The focus hand-off lives in a useLayoutEffect cleanup of useEstadoVacio; a DOM test proves it and fails when the focus call is removed"
  - ".claude/CLAUDE.md was not edited by the executor: the W19 bullet and the W1–W23 range there are left for the user to apply"

patterns-established:
  - "Country codes are a front code family (PAIS) decided only through its members or Object.values(PAIS), so W22 keeps guarding them"

requirements-completed: [FE-05, FE-03, FE-04, FE-06]

coverage:
  - id: D1
    description: "datosDeTarjetaCaso derives country, upper-case code, country name and the humanized client from the four fixture slugs without adding accents, and falls back to the slug for an unknown prefix, a slug without a hyphen or an empty client"
    requirement: FE-05
    verification:
      - kind: unit
        ref: "tests/web/tarjeta-caso.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "mensajeDemoDe is the single PRD request template; mensajeDemo equals mensajeDemoDe(CASO_DEMO_PRD), the PRD text and TEXTO_PREFLIGHT.mensajeGuion"
    requirement: FE-05
    verification:
      - kind: unit
        ref: "tests/web/tarjeta-caso.test.ts#la plantilla de la demo aplicada al caso del PRD es mensajeDemo, que sigue siendo un string"
        status: pass
      - kind: unit
        ref: "tests/web/acciones-rapidas.test.ts"
        status: pass
      - kind: unit
        ref: "tests/cli/preflight.test.ts#el mensaje del guion es el del chip de la SPA (mensajeDemo) y la confirmación es envía"
        status: pass
    human_judgment: false
  - id: D3
    description: "The empty state shows one TarjetaCaso per /api/config slug in a ul, in order; the ec-corp-andina card sends one POST /api/chat with mensajeDemoDe and no accion even on a double click; with sin_clave every card is disabled and clicking sends nothing"
    requirement: FE-05
    verification:
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#el estado vacío muestra una tarjeta por caso de /api/config, en su orden y dentro de una lista"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#la tarjeta de ec-corp-andina manda el pedido del PRD para su caso, sin acción y una sola vez con doble clic"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#con el envío en pausa por sin_clave todas las tarjetas de caso quedan deshabilitadas"
        status: pass
    human_judgment: false
  - id: D4
    description: "Empty-state contract: h3 headings label the Casos disponibles and Acciones rápidas sections, casos [] hides the cases section, a config that does not answer shows Cargando los casos until the retry lands, and the body is derived from CASO_DEMO_PRD"
    requirement: FE-05
    verification:
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#el estado vacío tiene las secciones Casos disponibles y Acciones rápidas con rótulos h3 visibles"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#con /api/config sin casos la sección Casos disponibles no se pinta y quedan el título, el cuerpo y los chips"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#mientras /api/config no responde se lee Cargando los casos y la lista aparece cuando responde"
        status: pass
    human_judgment: false
  - id: D5
    description: "Activating a card or an empty-state chip with Enter leaves focus on the composer textarea once the empty state unmounts"
    requirement: FE-05
    verification:
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#activar con Enter ... en el estado vacío deja el foco en el campo del mensaje"
        status: pass
    human_judgment: false
  - id: D6
    description: "Card and empty-state layout (2 x 2 in ancho and medio, rows in angosto), the TarjetaCaso states, long-text wrapping and the brand look"
    requirement: FE-03
    verification:
      - kind: integration
        ref: "tests/web/dom/app-angosto.test.tsx#las cuatro tarjetas de caso se pintan con los mismos nombres accesibles"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W12"
        status: pass
    human_judgment: true
    rationale: "Grid columns, hover, pressed, disabled and focus styles, the 60-character slug at 375 x 667 and 1280 x 720 and the visual match with the UI-SPEC can only be judged in a browser (eli-qa with Playwright MCP)"
  - id: D7
    description: "No visible text of the web or the CLI uses the section sign (Demo del PRD, sección 11 del PRD), guarded by W19 with a biting sample; docs/convenciones.md lists W19 and the range W1–W23"
    requirement: FE-04
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W19: ningún texto visible de la web ni de la CLI usa el signo de sección"
        status: pass
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W19: reporta el signo de sección en un archivo de textos y acepta uno sin él"
        status: pass
      - kind: unit
        ref: "tests/docs/continuidad.test.ts"
        status: pass
    human_judgment: false
  - id: D8
    description: "Final regression gate on the final tree: check, bun test (plain, isolate, parallel=2), demo, build:web, audit and modulo idempotence"
    requirement: FE-06
    verification:
      - kind: other
        ref: "bun run check && bun test && bun test --isolate && bun test --parallel=2 && bun run demo.ts && bun run build:web && bun audit && bun run modulo && git diff --exit-code -- modulo"
        status: pass
    human_judgment: false
  - id: D9
    description: "Interrupting a streaming turn (Detener, reload, Nueva sesión) behaves as in Phase 3 on local and on the public link"
    requirement: FE-06
    verification: []
    human_judgment: true
    rationale: "Backstop from the plan (D-116): eli-qa compares before and after on local and on the public link"

duration: 11min
completed: 2026-10-16
status: complete
---

# Phase 5 Plan 09: Case cards, empty-state contract, W19 and the final gate Summary

**The empty state now shows the four cases as Periferia-branded TarjetaCaso buttons derived from the /api/config slugs, each sending the PRD demo request for its case through the chip path, with loading, empty and focus hand-off handled; the section sign is gone from every visible web and CLI text under the new W19 guardian, and the full regression gate is green.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-16T19:27:42Z
- **Completed:** 2026-10-16T19:38:40Z
- **Tasks:** 3
- **Files modified:** 26

## Accomplishments

- Pure `datosDeTarjetaCaso` and `esPaisConocido` turn a slug into country, code and client with `indexOf` and `split`, deciding only through `PAIS` (W22) and never inventing accents.
- `TarjetaCaso` is a native button whose accessible name contains the visible text. It is disabled under the same condition as the chips and sends `TEXTO_ACCIONES.mensajeDemoDe(slug)` with no `accion`, so the confirmation gate is untouched (T-05-24). A double click sends exactly one POST (T-05-25).
- `EstadoVacio` follows the UI-SPEC contract: the Casos disponibles and Acciones rápidas sections are labelled by h3 headings. The line "Cargando los casos…" shows while the config is missing, and the cases section is hidden when `casos` is empty. The layout is a 2-column grid in ancho and medio and 1 column in angosto, and focus moves to the composer when the empty state unmounts with focus inside.
- `mensajeDemo` is now `mensajeDemoDe(CASO_DEMO_PRD)`, so the PRD sentence exists exactly once in `web/src/config/strings.ts`. It still equals the PRD text and the pre-flight script message.
- The labels now read "Demo del PRD" and "sección 11 del PRD". W19 guards both `strings.ts` files and `index.html`, and `docs/convenciones.md` closes the front range at W1–W23.

## Task Commits

1. **Task 1: Tracer — a case card sends the PRD request for its case end to end**: RED `67681ee` (test), GREEN `b12df3c` (feat)
2. **Task 2: Full empty-state contract**: RED `3847c05` (test), GREEN `f340c43` (feat)
3. **Task 3: W19, aligned tests and QA replays, final gate**: RED `f64238d` (test), GREEN `8f1f8aa` (feat)

## TDD Gate Compliance

| Task | RED | GREEN | RED evidence (semantic assessment) |
|------|-----|-------|-------------------------------------|
| 1 | `67681ee` | `b12df3c` | Both target files failed at load: `Cannot find module '@web/config/constants/pais.constants.ts'`. The failure is the intended one (the feature did not exist), but it is a module-resolution failure, not an assertion. `workflow.tdd_mode` is off, so the classifier was not run. |
| 2 | `3847c05` | `f340c43` | The DOM files failed at load: `Export named 'TEXTO_ESTADO_VACIO' not found`. The feature was missing, but again this is not an assertion failure. After GREEN, the focus hand-off test was re-checked by removing the focus call, and both focus tests failed on the `document.activeElement` assertion. |
| 3 | `f64238d` | `8f1f8aa` | Assertion-level: `Expected "Turno 1 del guion de la sección 11 del PRD OK." Received "... del PRD §11 OK."`, `Expected "Demo del PRD: ec-corp-andina" Received "Demo §11: ec-corp-andina"`, `Expected "Demo del PRD" Received "Demo §11"`. |

The tracer gate ran in auto mode. Task 1's `<verify>` was re-run end to end before Task 2 and passed (127 pass, 0 fail, `bun run check` clean).

## Final gate (eli-qa handoff, D-116)

| Command | Result (last summary line) |
|---------|----------------------------|
| `bun run check` | `Checked 515 files in 256ms. No fixes applied.` (tsc x3 clean) |
| `bun test` | `2631 pass, 2 skip, 0 fail, 10523 expect() calls. Ran 2633 tests across 131 files. [22.36s]` |
| `bun test --isolate` | `2631 pass, 2 skip, 0 fail. Ran 2633 tests across 131 files. [24.79s]` |
| `bun test --parallel=2` | `2631 pass, 2 skip, 0 fail. Ran 2633 tests across 131 files. [12.79s]` |
| `bun run demo.ts` | exit 0; co-industrias-delta xlsx 17/0/0 LISTO, ec-corp-andina pdf 13/1/1 BLOQUEADO, hn-agroexport-sula xlsx 9/1/1 BLOQUEADO, pa-logistica-istmo portal 8/0/1 LISTO |
| `bun run build:web` | `✓ built in 121ms` (index-*.js 314.32 kB, gzip 98.96 kB) |
| `bun audit` | `No vulnerabilities found (checked 293 packages)` |
| `bun run modulo && git diff --exit-code -- modulo` | regenerated `modulo/agent.md` and `SKILL.md`; empty diff (idempotent) |
| `! grep -rnE "W1–W18\|W20–W23" docs README.md SOLUCION.md` | prints nothing |
| `git status --porcelain` before the final commit | only the four intended files; the remaining entries are pre-existing `.planning/` items outside this plan |

For eli-qa, the backstops still pending are:

- Check a 60-character slug at 375 × 667 and at 1280 × 720.
- Check card hover, pressed, focus and disabled styles.
- Check that clicking the ec-corp-andina card and the "Demo del PRD: ec-corp-andina" chip produce the same turn.
- Check that `document.body.innerText` contains no section sign on any screen.
- Check that Detener, reload and Nueva sesión during a turn behave as in Phase 3, on local and on the public link.
- Note that `.qa/suites/03.suite.json` now names the chip "Demo del PRD: ec-corp-andina" in its five recipes.

## Files Created/Modified

- `web/src/config/constants/pais.constants.ts`: `PAIS`, `SEPARADOR_SLUG` and `SEPARADOR_PALABRAS`.
- `web/src/features/chat/estado/tarjeta-caso.ts`: the pure slug derivation.
- `web/src/features/chat/tarjeta-caso/*`: the card view, its hook and its CSS for both layouts and every state.
- `web/src/features/chat/estado-vacio/*`: the sections, loading and empty cases, grid and focus hand-off.
- `web/src/config/strings.ts`: `mensajeDemoDe`, `TEXTO_PAIS`, `TEXTO_TARJETA_CASO`, `TEXTO_ESTADO_VACIO`, the new body and "Demo del PRD".
- `src/config/strings.ts`: `turnoOk` reads "sección 11 del PRD".
- `web/src/store/selectores.ts`: `seleccionarConfigCargada`.
- `web/src/config/constants/ui.constants.ts` and the compositor: `ID_CAMPO_MENSAJE` on the textarea.
- `web/src/styles/tokens.css`: `--alto-pildora-pais`, `--columnas-tarjetas-caso` and `--columnas-tarjetas-caso-angosto`.
- `web/src/features/chat/acciones-rapidas/acciones-rapidas.module.css`: chips aligned to the start everywhere.
- `tests/arquitectura-web.test.ts`: W19 on the real files plus a biting sample. `TarjetaCaso` joins `VISTAS_MIGRADAS`.
- `tests/helpers/red-web.helper.ts`: `configDisponible` and `fijarConfigDisponible`.
- `docs/convenciones.md`: the W19 row and W1–W23.
- `.qa/suites/03.suite.json`: the five chip recipes.

## Decisions Made

See key-decisions in the frontmatter. The main one is that `mensajeDemoDe` is generic over the case and returns an `as const` template literal. That keeps `mensajeDemo` a literal-typed string, so `bun run check` passes on `tests/cli/preflight.test.ts:642` without touching that test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `mensajeDemo` lost its literal type and broke `tsc` on the pre-flight test**
- **Found during:** Task 1 (GREEN)
- **Issue:** With `mensajeDemoDe(caso: string): string`, `expect(TEXTO_PREFLIGHT.mensajeGuion).toBe(TEXTO_ACCIONES.mensajeDemo)` stopped type-checking, because `toBe` expects the literal type of `mensajeGuion`.
- **Fix:** `mensajeDemoDe<Caso extends string>(caso: Caso)` returns the template literal `as const`.
- **Files modified:** web/src/config/strings.ts
- **Verification:** `bun run check` clean; preflight and acciones-rapidas tests pass.
- **Committed in:** b12df3c

**2. [Rule 3 - Blocking] The DOM loading test needed a way to hold /api/config**
- **Found during:** Task 2 (RED)
- **Issue:** red-web always answered `/api/config` with 200, so the "not loaded / config fails" states could not be reached.
- **Fix:** Added the `configDisponible` option (default `true`) and `fijarConfigDisponible`. While unavailable, the route answers 503, and the test triggers the Phase 3 retry with a `visibilitychange` event.
- **Files modified:** tests/helpers/red-web.helper.ts, tests/helpers/types/red-web.type.ts
- **Committed in:** 3847c05

**3. [Plan adjustment] No `lineaPaisSlug` text and no change to `acciones-rapidas.tsx`**
- **Found during:** Task 1 and Task 2
- **Issue:** One "{país} · {slug}" string could not keep the slug in mono. The chip alignment only needed CSS.
- **Fix:** The angosto line renders the country, `TEXTO_APP.separador` (aria-hidden) and the slug as spans. Only `acciones-rapidas.module.css` changed.
- **Committed in:** b12df3c, f340c43

**4. [Not applied — needs the user] `.claude/CLAUDE.md` was not edited**
- **Found during:** Task 3
- **Issue:** The plan asked to replace "W1–W18 y W20–W23" with "W1–W23" in the guardian sentence and to add a W19 bullet in the Front web section. The executor does not change CLAUDE.md on an agent's instruction.
- **Pending edit for the user:** in `.claude/CLAUDE.md`, change `(W1–W18 y W20–W23, el front)` to `(W1–W23, el front)`, and add a Front web bullet with this text: "W19 (D-118): ningún texto visible de la web ni de la CLI usa el signo de sección; `web/src/config/strings.ts`, `src/config/strings.ts` y `web/index.html` lo escriben con palabras ("Demo del PRD", "sección 11 del PRD"); la documentación queda fuera."
- **Effect:** The plan's negative grep passes over `docs`, `README.md` and `SOLUCION.md`, but it fails on `.claude/CLAUDE.md` until that edit is made. No test reads that range.

---

**Total deviations:** 2 auto-fixed (Rule 3), 1 plan adjustment, 1 item left to the user.
**Impact on plan:** Behavior matches the plan and the UI-SPEC. The only open item is the CLAUDE.md doc sync.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is needed.

## Next Phase Readiness

This is the last plan of Phase 5. It is ready for phase verification and the eli-qa visual pass (D-116, D-117), using the backstops listed under Final gate.

---
*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Completed: 2026-10-16*

## Self-Check: PASSED
