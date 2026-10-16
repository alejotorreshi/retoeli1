---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 11
subsystem: web-encabezado
status: complete
gap_closure: true
tags: [front, encabezado, angosto, marca, uat-gap, ui-spec]
requires:
  - phase: 05-front-web-por-features-e-identidad-de-marca
    provides: "05-10 (both plans edit web/src/types/ui.type.ts)"
provides:
  - "UI-SPEC narrow header contract recomputed for 288 px (line 1 at 320) and 343 px in Montserrat (line 2 at 375)"
  - "--alto-logo-encabezado-angosto: 20px and 8 px gaps around the brand divisor in angosto"
  - "IconoMas (plus icon on the 24 grid) in web/src/compartido/iconos/iconos.tsx"
  - "Icon-only 40 x 40 Nueva sesión pill in angosto, with its text kept inside the button as CLASE_GLOBAL.OCULTO"
  - "Fixed (flex none) date chip in angosto"
  - "Hook field claseOcultaEnAngosto (renamed from clasePrefijo)"
affects: [encabezado, eli-qa UAT test 2, 05-UI-SPEC]
tech-stack:
  added: []
  patterns:
    - "Narrow-only visual hiding through the hook's claseOcultaEnAngosto, so the accessible name is the same in every layout"
    - "Icon wrapper hidden with display none by default and shown only under [data-diseno=\"angosto\"]"
key-files:
  created: []
  modified:
    - .planning/phases/05-front-web-por-features-e-identidad-de-marca/05-UI-SPEC.md
    - web/src/styles/tokens.css
    - web/src/features/encabezado/encabezado/encabezado.module.css
    - web/src/features/encabezado/encabezado/encabezado.tsx
    - web/src/features/encabezado/encabezado/usar-encabezado.ts
    - web/src/compartido/iconos/iconos.tsx
    - web/src/types/ui.type.ts
    - tests/web/dom/app-angosto.test.tsx
    - tests/web/dom/app.test.tsx
key-decisions:
  - "Line 1 in angosto: logo 20 px high (80 px wide) with 8 px on each side of the 1 x 24 divisor, title kept at Outfit 16 (279,2 px in 288 px); the header stays 88 px"
  - "Line 2 in angosto: the date chip never shrinks and Nueva sesión becomes a 40 x 40 icon-only pill; its text stays in the button with CLASE_GLOBAL.OCULTO, so the name, the dialog and the disabled state do not change"
  - "No new breakpoint: CONSULTA_DE_ANCHO (W25) is unchanged and the header at 640 px and wider is untouched"
requirements-completed: [FE-05, FE-06, FE-03]
requirements: [FE-05, FE-06, FE-03]
metrics:
  duration: "14 min"
  completed: 2026-10-16
actuals:
  tokens: 2935
  tasks: 2
  commits: 4
plan_head_before: 933f9e82c44d132bafd92caf24785965d05d551f
plan_head_after: 2dd45a9bc3c5ab4fe1c2ee770bbcd175502905b6
coverage:
  - id: D1
    description: "UI-SPEC narrow header sizes that fit 288 px and 343 px, with the overflow backstop row and eli-qa item 10"
    requirement: FE-05
    verification:
      - kind: other
        ref: "grep 279,2 / 298,6 / 288 px in 05-UI-SPEC.md (2, 2, 3); old wording counts 0"
        status: pass
  - id: D2
    description: "Header line 1 fits at 320 px: 20 px logo and 8 px divisor gaps from tokens"
    requirement: FE-05
    verification:
      - kind: unit
        ref: "bun test tests/arquitectura-web.test.ts tests/web/marca.test.ts tests/sin-comentarios.test.ts"
        status: pass
      - kind: automated_ui
        ref: "eli-qa regression re-run of UAT test 2 at 320 x 568 and 375 x 667"
        status: unknown
  - id: D3
    description: "Icon-only Nueva sesión in angosto keeps its accessible name and opens the confirmation dialog; text visible at 1280"
    requirement: FE-06
    verification:
      - kind: integration
        ref: "tests/web/dom/app-angosto.test.tsx#Nueva sesión va solo con ícono, conserva su nombre accesible y abre el diálogo de confirmación"
        status: pass
      - kind: integration
        ref: "tests/web/dom/app.test.tsx#Nueva sesión muestra su texto en escritorio"
        status: pass
  - id: D4
    description: "Line 2 at 375 shows the full date and model label in all five model states; at 320 only No disponible and Sin clave válida may cut the label"
    requirement: FE-06
    verification:
      - kind: automated_ui
        ref: "eli-qa with Playwright MCP, five llm states forced through /api/health, scrollWidth vs clientWidth"
        status: unknown
---

# Phase 5 Plan 11: Narrow header fits at 320 and 375 px Summary

The narrow header uses a 20 px logo with 8 px gaps around the divisor, so the title stays on one line at 320 px. Line 2 keeps a fixed date chip and shows Nueva sesión as a 40 x 40 icon-only pill (IconoMas), so the full date and every model state fit at 375 px. The UI-SPEC was amended first, and the button's accessible name, dialog and disabled state did not change.

## Performance

- Duration: about 14 min
- Completed: 2026-10-16
- Tasks: 2 of 2
- Files modified: 9

## Accomplishments

- 05-UI-SPEC.md amended before any code. It adds the amendment note under the header blockquote, the new narrow mockup and its arithmetic paragraph (279,2 px in 288 px; 255,7 to 298,6 px on line 2), the Spacing Scale and fixed dimensions, the component inventory and populated rows, the Encabezado interaction bullet, the Accesibilidad bullet, the rewritten overflow backstop row and eli-qa item 10. The long-text row now says the label can only take an ellipsis at 320 px.
- `--alto-logo-encabezado-angosto` goes from 24px to 20px. The narrow `.marca` uses `gap: 0 var(--espacio-sm)`.
- `IconoMas` (path `M12 5v14M5 12h14`) is built on `SvgIcono`, so it is aria-hidden and not focusable.
- `Encabezado`: the button keeps its type, className, disabled and onClick. Its children are now a `.iconoNuevaSesion` span with `IconoMas` at `TAMANO_ICONO.GRANDE` and a span with `claseOcultaEnAngosto` holding `TEXTO_NUEVA_SESION.abrir`. No aria-label was added.
- CSS in angosto: `.fecha { flex: none }`, `.nuevaSesion` is inline-flex and centered with `min-width: var(--alto-control)` and `padding-inline: 0`, and `.iconoNuevaSesion` is inline-flex. Outside angosto `.iconoNuevaSesion` is `display: none`, so the 640 px and wider header is unchanged.
- `clasePrefijo` is renamed to `claseOcultaEnAngosto` in `ControlEncabezado`, `PropsEstadoDelModelo`, the hook helper and its returned field, and the view.

## Task Commits

1. Task 1 (tracer): UI-SPEC amendment `c06a5b7` (docs), tokens and narrow CSS `e8c9d84` (fix)
2. Task 2: RED tests `252bd61` (test), implementation `2dd45a9` (fix)

Tracer feedback gate after Task 1: interactive mode with `human_verify_mode: end-of-phase` and an automated-only `<verify>`. Re-run passed (84 pass, 0 fail; Vite build OK), so execution continued with no checkpoint.

## RED evidence (Task 2)

`bun test tests/web/dom/app-angosto.test.tsx tests/web/dom/app.test.tsx` before the implementation:

```
error: expect(received).not.toBe(expected)
Expected: not HTMLButtonElement {}
      at <anonymous> (tests/web/dom/app.test.tsx:417:23)
(fail) App en escritorio, con la red simulada en fetch > Nueva sesión muestra su texto en escritorio [3316.87ms]
error: expect(received).toBe(expected)
Expected: "true"
Received: undefined
      at <anonymous> (tests/web/dom/app-angosto.test.tsx:139:48)
(fail) App en un teléfono de 375 px > Nueva sesión va solo con ícono, conserva su nombre accesible y abre el diálogo de confirmación [34.02ms]
 22 pass
 2 fail
```

## Final gate outputs (for the eli-qa handoff)

- `bun test tests/web/dom tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts`: 114 pass, 0 fail across 7 files.
- `bun run check`: exit 0. `tsc --noEmit` (root, web and dom) passed, and `biome check .` reported "Checked 520 files ... No fixes applied."
- `bun test`: exit 0, 2668 pass, 2 skip (the existing `skipIf` live/costo tests), 0 fail. Ran 2670 tests across 132 files.
- `bun run build:web`: exit 0 (`index-BsZ58Qrt.js` 315.73 kB, built in 164 ms).
- `bun run demo.ts`: exit 0. The truth table is unchanged: co-industrias-delta xlsx 17/0/0 LISTO; ec-corp-andina pdf 13/1/1 BLOQUEADO; hn-agroexport-sula xlsx 9/1/1 BLOQUEADO; pa-logistica-istmo portal 8/0/1 LISTO.
- `git diff --stat -- reto-01`: empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The RED test at 1280 passed vacuously at first**
- Found during: Task 2 (RED)
- Issue: Testing Library's `getByText` inside the button also matches the container itself. With the old markup the button was the text element, so it had no `sr-only` class and the "text is visible" assertion passed before any change.
- Fix: both new tests also assert `expect(texto).not.toBe(abrir)`, so the text must be a descendant span. After that, both tests failed for the right reason.
- Files modified: tests/web/dom/app-angosto.test.tsx, tests/web/dom/app.test.tsx
- Commit: 252bd61

**2. [Rule 3 - Blocking] Biome formatting after the rename**
- Found during: Task 2 (gate)
- Issue: the longer identifier `claseOcultaEnAngosto` pushed two lines of encabezado.tsx past the line width, so `bun run check` failed on format.
- Fix: ran `biome format --write` on the file (layout only).
- Files modified: web/src/features/encabezado/encabezado/encabezado.tsx
- Commit: 2dd45a9

**3. [Spec consistency] long-text row of UI Considerations**
- The row said the model label "va con elipsis en la línea 2". It now says the label can only take an ellipsis at 320 px (see the overflow row), which matches the amended arithmetic. This came out of the plan's own "grep for remaining old wording" step.
- Commit: c06a5b7

## Known Stubs

None.

## Backstop handoff (eli-qa, Playwright MCP, production build)

- At 320 x 568 and 375 x 667: the h1 height is one line, its box does not overlap the logo, and the header is 88 px.
- At 375 x 667: force each of the five llm states through the `/api/health` response. For both the date text and the model label, `scrollWidth <= clientWidth` (no ellipsis).
- At 320 x 568: the date is full. Only No disponible and Sin clave válida may cut the label. No horizontal scroll.
- At 1280 x 720 and 800 x 900: header screenshots compared with the previous run show no change.

## Self-Check: PASSED

- FOUND: web/src/compartido/iconos/iconos.tsx (export function IconoMas), web/src/styles/tokens.css (--alto-logo-encabezado-angosto: 20px), 05-UI-SPEC.md (279,2)
- FOUND commits: c06a5b7, e8c9d84, 252bd61, 2dd45a9 (all ancestors of HEAD, author elianatorres5772 <elianatorres5772@gmail.com>)
