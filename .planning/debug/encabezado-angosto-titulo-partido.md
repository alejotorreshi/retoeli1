---
status: diagnosed
trigger: "UAT 05 test 2: a 320x568 el título 'Registro como proveedor' se parte en dos líneas (alto 38,4 px, encabezado de 102 px); a 375 y 320 la fecha y el estado del modelo se truncan con elipsis ('2026-09-…', 'Disponi…') porque compiten por 343 px"
created: 2026-10-16T23:00:00Z
updated: 2026-10-16T23:40:00Z
goal: find_root_cause_only
symptoms_prefilled: true
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (deterministic layout arithmetic; same result on every run and width)
hypothesis: CONFIRMED. The implementation matches the UI-SPEC exactly. The UI-SPEC sized line 1 only for 375 px, and its own sizes physically cannot fit at 320 px. Line 2 truncates because Montserrat (with tabular-nums) is wider than the Phase 3 system font, so the three items no longer fit in 343 px.
test: done (headless Chromium, production build, widths 320/340/360/375/390/414, with brand fonts and with fonts blocked; canvas text metrics in Outfit and Montserrat)
expecting: n/a
next_action: return ROOT CAUSE FOUND to the orchestrator; the fix belongs to /gsd-plan-phase --gaps (UI-SPEC amendment first, then CSS)

reasoning_checkpoint:
  hypothesis: "The h1 wraps at 320 because the fixed line 1 content (logo 96 + gap 16 + divider 1 + gap 16 + title 182.2 in Outfit 600 16px = 311.2 px) exceeds the 288 px content box (320 - 2 x 16 padding); the h1 has min-width 0 and normal white-space, so flex shrinks it to 159 px and the text breaks."
  confirming_evidence:
    - "Measured at 320: img 96x24 at x16, divider x128 w1, h1 x145 w159 h38.4 (2 lines), intrinsic max-content 182.3; header 102.4 px."
    - "Threshold sweep: wraps at 320 and 340, one line from 360 up; computed break point 343.2 px viewport."
    - "All computed styles equal the UI-SPEC values (padding 8/16, gap 16, logo 24 high, h1 600 16px Outfit, data-diseno=angosto); Outfit loaded (document.fonts.check true)."
  falsification_test: "If any box were wider than spec (logo > 96, gap > 16, extra padding) or the title fit at 320 with the spec sizes, the hypothesis would be wrong. Neither happened."
  fix_rationale: "Line 1 needs 23.2 px less content at 320; only changing the spec's sizes, layout or breakpoint for that width removes the overflow. Changing CSS alone without the spec would contradict 05-UI-SPEC lines 132, 137, 224-231 and 249."
  blind_spots: "Measured in headless Chromium on macOS only (Outfit is self-hosted, so text metrics should match other engines within about 1 px). Did not test Safari or Firefox subpixel rounding."
  candidate_causes:
    - "spec/config: UI-SPEC sizes computed only for 343 px useful width at 375 (line 137) while the backstop (line 509) also demands 320. CONFIRMED."
    - "code: CSS deviates from spec. ELIMINATED, all values match."
    - "environment/data: font not loaded or fallback font. ELIMINATED, Outfit loaded and the fallback is wider (191 px)."
  and_gate: "yes, for the two symptoms together: line 1 wrap (logo + divider added in 05-08 to a line that held only the title in Phase 3) and line 2 truncation (Montserrat + tabular-nums widen the date, label and button vs the Phase 3 system font). Each one is independent of the other."

## Symptoms

expected: At 320x568 and 375x667 after access, header line 1 = logo + divider + "Registro como proveedor" on one line; line 2 (date chip, model status chip, Nueva sesión) on one row.
actual: At 320x568 the title wraps to two lines (h1 height 38.4 px, header 102 px). At 375 and 320 the date and model status are truncated with ellipsis ('2026-09-…', 'Disponi…') because they compete for 343 px.
errors: None.
reproduction: UAT 05 test 2. Production build, Playwright, fresh context, after access. Screenshots .qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/05-testT02-encabezado-320.png and 05-testT02-encabezado-375.png. With health pending (no model chip) the date fits in full.
started: Header redesign in plan 05-08 (brand identity). Discovered in eli-qa phase 05 on 2026-10-16.

## Eliminated

- hypothesis: The header CSS deviates from the UI-SPEC (wider logo, larger gaps, extra padding, wrong title size)
  evidence: Computed values at 320 equal the spec exactly. Padding 8px 16px, .marca column-gap 16px, img 96x24, divider 1x24, h1 600 16px Outfit, meta gap 8px (encabezado.module.css:6-8, 18, 26, 145; tokens.css:2-4, 27, 99-102).
  timestamp: 2026-10-16T23:25:00Z

- hypothesis: The narrow layout is not applied at 320 (breakpoint or data-diseno issue)
  evidence: data-diseno="angosto" at every width 320-414; the h1 at 16px, the logo at 24px and the prefixes hidden.
  timestamp: 2026-10-16T23:25:00Z

- hypothesis: The brand font failed to load and a wider fallback causes the wrap
  evidence: document.fonts.check('600 16px "Outfit"') true. With fonts blocked the fallback title is wider (191 px), not narrower, and still wraps at 320.
  timestamp: 2026-10-16T23:30:00Z

## Evidence

- timestamp: 2026-10-16T23:00:00Z
  checked: .qa/evidence/.../05-QA-EVIDENCE-2026-10-16T22-05-00Z.md T02
  found: At 375 img 96x24, h1 x145 w182 h19.2 (one line). At 320 h1 x145 w159 h38.4 (two lines), header 102 vs 88. Date chip sw 89 / cw 82 at 375 and 89 / 55 at 320; model label sw 75 / cw 68 at 375 and 75 / 40 at 320.
  implication: The title's intrinsic width is about 182 px; at 320 only 159 px remain after the brand block starts at x=145.

- timestamp: 2026-10-16T23:00:00Z
  checked: 05-UI-SPEC.md lines 128-137, 224-231, 249, 509, 510, 520
  found: Narrow header = logo 96x24, divider 1x24 with 16 px each side (md), h1 Outfit 16/600, header padding 8/16. Line 137 justifies the sizes only "para que la línea 1 quepa en 343 px útiles a 375 px". Line 509 backstop asks to verify at 375 and 320 that the title does not wrap. Lines 133 and 520 accept ellipsis on line 2. Line 510 acknowledges Montserrat is wider than the system font, but only for the quick-action chips. The mockup at line 133 draws "[2026-09-03] [● Sin clave válida] (Nueva sesión)" in full on one row.
  implication: The spec never computed line 1 at 320 (288 px useful) or line 2 with Montserrat. Ellipsis on line 2 is specified behavior.

- timestamp: 2026-10-16T23:10:00Z
  checked: web/src/features/encabezado/encabezado/encabezado.module.css (full), encabezado.tsx, usar-encabezado.ts, compartido/logo-marca/*, tokens.css
  found: .marca is flex nowrap with gap 16 (line 18); .titulo has min-width 0 and no white-space rule (lines 22-30), so it shrinks and wraps; angosto title 16px (line 145). .meta in angosto is nowrap (line 150); .fecha and .modelo are flex 0 1 auto with min-width 0 (lines 51-52, 67-69) and shrink in proportion to their basis; .nuevaSesion is flex none (line 107); angosto .texto gets ellipsis (lines 158-162); chips get padding 4/8 in angosto (lines 164-168).
  implication: The code is a faithful implementation of the spec; the overflow is arithmetic, not a CSS bug.

- timestamp: 2026-10-16T23:20:00Z
  checked: Production build on :3191, headless Chromium, widths 320/340/360/375/390/414, brand fonts loaded
  found: Line 1 boxes constant: img x16 w96, divider x128 w1, h1 x145, h1 intrinsic 182.3. h1 2 lines (h38.4, header 102.4) at 320 and 340; 1 line (h19.2, header 88) at 360, 375, 390, 414. Line 2 intrinsic: date chip 105.1 (text 89 + 16), model chip 107.4 ("Disponible": 8+8 dot+8 gap+75+8), button 129.4 (95.4 + 32 + 2), gaps 2x8. Line 2 shrinks at 320 (date cw 55, label cw 40), 340, 360, 375 (date cw 82, label cw 68); fits in full at 390 and 414.
  implication: Line 1 break point = 16+96+16+1+16+182.3+16 = 343.3 px viewport. Line 2 needs 357.9 px useful (viewport 389.9) with "Disponible".

- timestamp: 2026-10-16T23:30:00Z
  checked: Same sweep with /fuentes/** blocked (system fallback, which is what Phase 3 used)
  found: Title 191 px, still wraps at 320/340. Line 2 at 375 fits in full (date 98.3 + model 100 + button 123.7 + 16 = 338 <= 343).
  implication: Line 1 wrap comes from adding the logo + divider (129 px) to line 1 in 05-08, under any font. Line 2 truncation at 375 is a Phase 5 regression caused by Montserrat + tabular-nums (date 89 vs 82, "Disponible" 75 vs 68, button 129.4 vs 123.7).

- timestamp: 2026-10-16T23:35:00Z
  checked: Canvas metrics in brand fonts
  found: Title Outfit 600: 16px 182.2, 15px 170.8, 14px 159.5, 13px 148.1. Montserrat 400 14px labels: Disponible 75.4, Sin clave válida 105.5, Sin saldo 62.6, No disponible 97.1, Tope diario 77.2. "Nueva sesión" 600 14px 95.4.
  implication: Line 2 total at 375 by state = Sin saldo 345.1, Disponible 357.9, Tope diario 359.7, No disponible 379.6, Sin clave válida 388.0, all > 343. No model state fits line 2 in full at 375, including the one drawn in the spec mockup (45 px over). Line 1 at 320 even with the title at 14px = 288.5 > 288.

- timestamp: 2026-10-16T23:38:00Z
  checked: git show 1561a81 (pre-05-08) encabezado.tsx; git log of encabezado.module.css
  found: Before cfa1aa3/a605ad1 (plan 05-08) line 1 held only h1 + separator + subtitle text; 05-08 replaced them with LogoMarca + divisor and added Montserrat.
  implication: Both symptoms were introduced by plan 05-08, as specified by 05-UI-SPEC.

## Resolution

root_cause: "Spec arithmetic gap (AND-gate, two independent causes). (1) Line 1: 05-UI-SPEC fixes the narrow brand row at logo 96 + 16 + divider 1 + 16 + h1 Outfit 600 16px (182.2 px) = 311.2 px, which fits the 343 px content box at 375 but not the 288 px box at 320 (23.2 px over; break point 343.3 px viewport). encabezado.module.css:18 (nowrap gap 16) and :22-30 (h1 min-width 0, normal white-space) let flex shrink the h1 to 159 px, so it wraps to 2 lines and the header grows from 88 to 102.4 px. The spec's line 509 backstop is unsatisfiable with the spec's own sizes. (2) Line 2: with Montserrat 14 (tabular-nums on the date) the three items need 345-388 px depending on the model state (357.9 with Disponible) against 343 at 375; .fecha and .modelo (flex 0 1 auto, min-width 0, encabezado.module.css:51-52, 67-69) absorb the deficit in proportion while .nuevaSesion is flex none (:107), so both the date and the label get an ellipsis. Under the system font of Phase 3 the same row fits at 375 (338 px)."
fix: ""
verification: ""
files_changed: []
