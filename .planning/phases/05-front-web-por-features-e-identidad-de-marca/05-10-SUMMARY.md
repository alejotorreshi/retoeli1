---
phase: 05-front-web-por-features-e-identidad-de-marca
plan: 10
subsystem: web-chat-linea-de-tiempo
status: complete
gap_closure: true
tags: [front, seguimiento, scroll, estado-vacio, uat-gap]
requires: []
provides:
  - "SENAL_SEGUIMIENTO.VACIO and the turnos field of CRECIMIENTO"
  - "debeSeguirAlFinal and volvioAlVacio (pure, web/src/features/chat/estado/seguimiento.ts)"
  - "useLineaDeTiempo follows to the end only with turns and resets on return to empty"
affects: [usar-linea-de-tiempo, seguimiento reducer, eli-qa UAT test 1]
tech-stack:
  added: []
  patterns:
    - "Turn-aware follow rule in the pure reducer module; the hook only wires it"
    - "DOM regression with a controllable fake ResizeObserver and simulated scrollHeight/clientHeight getters"
key-files:
  created:
    - tests/web/dom/seguimiento-vacio.test.tsx
  modified:
    - web/src/config/constants/ui.constants.ts
    - web/src/types/ui.type.ts
    - web/src/features/chat/estado/seguimiento.ts
    - web/src/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts
    - tests/web/seguimiento.test.ts
decisions:
  - "Follow-to-end never acts while the timeline has no turns: CRECIMIENTO carries the turn count and debeSeguirAlFinal gates the ResizeObserver"
  - "Returning from turns to zero turns dispatches VACIO (back to seguimientoInicial, same reference when already initial) and scrolls the zone to the top"
requirements: [FE-06, FE-05, FE-02]
metrics:
  duration: "6 min"
  completed: 2026-10-16
actuals:
  tokens: 4700
  tasks: 2
  commits: 4
plan_head_before: 3b51af977c9a5e246bb335f85996d8e9e24f1744
plan_head_after: ac1a0508f0b7382ab9c91aba8a9e60c8a7e93540
commits: 4
---

# Phase 5 Plan 10: Empty state stays at the top (UAT gap 1) Summary

The timeline's follow-to-end now acts only with turns. On entry, with a late grid (WR-03), after Nueva sesión (stuck or scrolled up) and after reloading a session with no turns, the empty state opens at scrollTop 0 without Ir al final. A conversation still follows to the end as before.

## What changed

- `web/src/types/ui.type.ts`: the CRECIMIENTO signal gains `turnos`, and the union gains the VACIO member.
- `web/src/config/constants/ui.constants.ts`: `SENAL_SEGUIMIENTO.VACIO = "vacio"`.
- `web/src/features/chat/estado/seguimiento.ts` (pure): private `hayTurnos`. `crecer` returns the same state when there are no turns. VACIO returns `conCambios(estado, seguimientoInicial)`. New exports `debeSeguirAlFinal(estado, turnos)` and `volvioAlVacio(anteriores, actuales)`. `seguimientoInicial` is unchanged.
- `web/src/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts`: the ResizeObserver callback reads `turnosVistos.current` once, sends it in CRECIMIENTO and calls `seguirAlFinal` only when `debeSeguirAlFinal` is true. The turn-count layout effect dispatches VACIO and calls the module-level `subirAlInicio` when `volvioAlVacio`; otherwise its growth branch (ENVIO plus seguirAlFinal) is unchanged. Dependencies unchanged.

## Tasks

| Task | Name | Commits |
| ---- | ---- | ------- |
| 1 | Empty state at the top on entry (tracer) | bcb3f71 (test RED), 6a8a96a (fix GREEN) |
| 2 | Return to empty resets the follow state | f5f313f (test RED), ac1a050 (fix GREEN) |

Tracer gate (Task 1): `bun test tests/web/seguimiento.test.ts tests/web/dom/seguimiento-vacio.test.tsx && bun run check` was re-run green (36 pass, 0 fail; check exit 0) before expanding to Task 2.

## RED evidence

Task 1, `bun test tests/web/dom/seguimiento-vacio.test.tsx` against the pre-fix code:

```
Expected: 0
Received: 678
(fail) seguimiento al final con el estado vacío > al entrar a 1280x720 el estado vacío queda arriba y sin Ir al final
Expected: 0
Received: 789
(fail) seguimiento al final con el estado vacío > al entrar a 375x667 el estado vacío queda arriba y sin Ir al final
Expected: 0
Received: 495
(fail) seguimiento al final con el estado vacío > si el estado vacío primero cabe y después crece, sigue arriba
 1 pass
 3 fail
```

(Together with tests/web/seguimiento.test.ts the run also reported `SyntaxError: Export named 'debeSeguirAlFinal' not found`.) The passing case was "con un turno la conversación sigue al final cuando crece", the guard against overcorrection.

Task 2, both files against the Task 1 code:

```
SyntaxError: Export named 'volvioAlVacio' not found in module '.../web/src/features/chat/estado/seguimiento.ts'.
Expected: 0
Received: 2400
(fail) seguimiento al final con el estado vacío > Nueva sesión con la vista pegada al final vuelve al estado vacío desde arriba
Expected: 0
Received: 1000
(fail) seguimiento al final con el estado vacío > Nueva sesión con la vista subida quita Ir al final y vuelve al estado vacío desde arriba
 5 pass
 3 fail
 1 error
```

The reload case already passed after Task 1, because the turn count stays at 0 and the Task 1 gate covers it. It stays as a regression test.

## Test counts

- `tests/web/seguimiento.test.ts`: 28 `test(` before, 35 after (4 empty-state cases from Task 1, 3 from Task 2). The first 28 names are byte-identical to the pre-plan list. The only edit to existing code is the `crecimiento` helper, which now takes `turnos` with the default `TURNOS_DE_UNA_CONVERSACION = 1`.
- `tests/web/dom/seguimiento-vacio.test.tsx`: 6 `test(` declarations and 7 tests run (the entry case loops over 1280x720 678/495 and 375x667 789/330, then late growth, following with turns at 2400, Nueva sesión stuck, Nueva sesión scrolled up, reload with no turns).
- Both files: 42 pass, 0 fail.

## Final gate (for the eli-qa handoff)

- `bun run check`: exit 0. `tsc --noEmit` (root, web, dom) and `biome check .`: "Checked 520 files in 266ms. No fixes applied."
- `bun test`: exit 0. "2666 pass, 2 skip, 0 fail, 10638 expect() calls. Ran 2668 tests across 132 files." This covers G1-G16, W1-W27 and sin-comentarios. The 2 skips are the existing live tests.
- `bun run build:web`: exit 0. 136 modules, `web/dist/assets/index-wockoCCh.js` 315.39 kB (gzip 99.58 kB), CSS 51.18 kB, built in 150ms.
- Backstop pending (not run by the executor): eli-qa regression-scoped re-run of UAT test 1 with Playwright MCP on the production build, at 1280x720 and 375x667. Check scrollTop 0 and `¿Qué caso procesamos?` in view on entry, after Nueva sesión stuck, after Nueva sesión scrolled up (no Ir al final) and after reloading a session with no turns.

## Deviations from Plan

None. The plan was executed as written. One minor test-side choice: the `crecimiento` helper takes an optional `turnos` argument that defaults to the one-turn constant. This keeps every existing test body untouched and lets the empty-state cases pass `SIN_TURNOS`. Biome formatting was applied to the two test files before the GREEN commits.

## Notes

- happy-dom does not clamp `scrollTop` to `scrollHeight - clientHeight`, so the DOM tests see the raw written value (for example 495 for the 495/495 case and 2400 with turns). This makes the tests stricter than the browser: any write of scrollTop on the empty state fails them.
- The actual token count (chars/4 over the 18.8 KB diff, about 4.7K) is far below the 70K estimate (confidence low). The estimate likely counted reading context, not the realized diff.

## Self-Check: PASSED

- FOUND: tests/web/dom/seguimiento-vacio.test.tsx
- FOUND: bcb3f71, 6a8a96a, f5f313f, ac1a050 (all ancestors of HEAD)
- `git rev-list --count 3b51af9..HEAD` = 4
