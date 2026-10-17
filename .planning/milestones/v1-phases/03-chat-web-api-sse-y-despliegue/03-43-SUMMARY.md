---
phase: 03-chat-web-api-sse-y-despliegue
plan: 43
subsystem: web
status: complete
tags: [seguimiento, scroll, d-78, wr-03, g-03-04, g-03-20, linea-de-tiempo]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "reducirSeguimiento puro con ref síncrono y overflow-anchor: none mientras sigue el final (03-36)"
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-UI-SPEC.md alineada con D-73.5.2 (03-42)"
provides:
  - "reducirSeguimiento por dirección del desplazamiento: AJUSTE_PROPIO anota la posición y DESPLAZAMIENTO { posicion, distancia } despega solo si la posición baja y la distancia supera 96 px"
  - "seguirAlFinal(zona) en LineaDeTiempo: única bajada propia (ResizeObserver, turno nuevo e 'Ir al final') que despacha AJUSTE_PROPIO con el scrollTop que fijó"
  - "Describe 'D-78: el seguimiento se despega con cualquier subida de la usuaria' con una fila por señal"
  - "03-UI-SPEC.md describe el seguimiento por dirección (viñeta de LineaDeTiempo y fila overflow)"
affects: [verificación de la fase 03, human-check T16 con Playwright]

actuals:
  tokens: 7193
  tasks: 2
  commits: 3
plan_head_before: ba4611bc367afed193f5db38ae7e815513b3e8f9
plan_head_after: 3be6388ca3722cb770369edcc01a45a04dc2c2b9

tech-stack:
  added: []
  patterns:
    - "El scroll propio se distingue del de la usuaria por posición y dirección, no por tiempo: la vista anota la posición que fija y solo una posición menor con distancia mayor que el umbral despega"
    - "El reductor devuelve el mismo objeto si ningún campo cambia (conCambios), así el ref síncrono no provoca repintados de más"

key-files:
  created: []
  modified:
    - web/src/state/seguimiento.ts
    - web/src/types/ui.type.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/components/linea-de-tiempo.tsx
    - tests/web/seguimiento.test.ts
    - .planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md

key-decisions:
  - "D-78 aplicado por posición: cualquier subida que deja la vista a más de 96 px del fondo despega, sin ventana de tiempo; la bajada propia anota AJUSTE_PROPIO, el anclaje mueve la vista hacia abajo y un encogimiento deja la distancia en el umbral, así que ninguno despega"
  - "Sin posición conocida, el primer DESPLAZAMIENTO lejos del fondo solo anota la posición y conserva el estado"
  - "Se quitan VENTANA_INTENCION_USUARIA_MS, TECLAS_DE_DESPLAZAMIENTO, la señal INTENCION y los manejadores onWheel, onTouchStart, onPointerDown y onKeyDown"

requirements-completed: [UI-01, UI-08]

duration: 4min
completed: 2026-10-15
---

# Phase 03 Plan 43: Seguimiento del final por dirección del desplazamiento (D-78) Summary

**`reducirSeguimiento` despega la vista con cualquier subida de la usuaria más allá de 96 px (barra, PageUp sin foco, flechas, inercia táctil) comparando `scrollTop` con la posición que anotó la bajada propia (`AJUSTE_PROPIO`), sin la ventana de intención de 600 ms.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-10-15T20:15:55Z
- **Completed:** 2026-10-15T20:19:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- WR-03 cerrado según D-78: el arrastre lento de la barra, PageUp o las flechas con el foco en la página y la inercia táctil despegan la vista, y el siguiente crecimiento ya no la devuelve al final mientras la analista lee.
- El auto-scroll propio (tipo A del debug autoscroll-375), el scroll anchoring (tipo B) y un encogimiento que deja la vista al fondo no despegan. La regresión de 16 crecimientos a 375×667 sigue pegada.
- `LineaDeTiempo` queda con un solo manejador de scroll y una sola función de bajada (`seguirAlFinal`). Conserva el ref síncrono, el repintado solo cuando cambian `pegado` o `contenidoNuevo` y `overflow-anchor: none` en `.siguiendo`.
- 17 pruebas de reductor: 7 generales y 10 en el describe D-78, una por señal (barra, PageUp, flechas, inercia táctil, auto-scroll propio, scroll anchoring, encogimiento, sin posición conocida, subida dentro del umbral y regresión 375×667).

## Task Commits

1. **Task 1 (RED): filas de reductor con la forma nueva de señales** - `4724623` (test)
2. **Task 1 (GREEN): seguimiento por dirección con AJUSTE_PROPIO y sin manejadores de intención** - `78686f2` (fix)
3. **Task 2: una prueba por señal de D-78 y la UI-SPEC alineada** - `3be6388` (test)

## Files Created/Modified

- `web/src/state/seguimiento.ts` - Reductor por posición: `anotarPosicion`, `desplazar` con `subio`, `crecer`, `volverAlFinal` y `conCambios` para devolver el mismo objeto.
- `web/src/types/ui.type.ts` - `EstadoSeguimiento.posicion` y `SenalSeguimiento` con AJUSTE_PROPIO y DESPLAZAMIENTO `{ posicion, distancia }`.
- `web/src/config/constants/ui.constants.ts` - `SENAL_SEGUIMIENTO.AJUSTE_PROPIO`; fuera la señal de intención, la ventana de 600 ms y el conjunto de teclas.
- `web/src/components/linea-de-tiempo.tsx` - `seguirAlFinal` y `alDesplazar` con `scrollTop`; sin `onWheel`, `onTouchStart`, `onPointerDown` ni `onKeyDown`.
- `tests/web/seguimiento.test.ts` - Filas reescritas y describe D-78.
- `.planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md` - Viñeta de auto-scroll de LineaDeTiempo y fila overflow de UI Considerations.

## Decisions Made

- La regla de despegue es `distancia > 96` y `posicion < posicionConocida`. Una distancia de 96 px o menos siempre vuelve a pegar y apaga el contenido nuevo, así que el encogimiento y la vuelta al fondo quedan cubiertos por la misma rama.
- `ENVIO` e `IR_AL_FINAL` conservan la posición; la bajada que sigue anota la nueva con `AJUSTE_PROPIO`.
- El tracer gate se resolvió en modo interactivo con `human_verify_mode` end-of-phase: se volvió a correr el `<verify>` automático (tests, build y check) y pasó, así que se siguió con la tarea 2. El human-check con Playwright (receta T16) queda para el cierre de la fase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Helpers con bucle en lugar de `reduce` con spread en las pruebas**
- **Found during:** Task 2
- **Issue:** Biome marcó `lint/performance/noAccumulatingSpread` en las filas de flechas e inercia táctil.
- **Fix:** Funciones `recorrer(estado, senales)` y `posicionesDeInercia()` con `for…of` y `push`.
- **Files modified:** tests/web/seguimiento.test.ts
- **Commit:** 3be6388

**2. [Organización] Filas de barra, tipo A y tipo B creadas en el describe D-78 desde la tarea 1**
- La tarea 1 ya abrió el describe D-78 con esas tres filas, y la tarea 2 le sumó las demás y movió ahí la regresión de 375×667. El contrato y el número de filas por señal son los del plan.

## Issues Encountered

- La tarea 2 es `tdd="true"`, pero sus filas pasaron al escribirse porque el reductor de la tarea 1 ya cumplía el contrato. Antes de esa tarea (con el reductor por intención), las filas de PageUp, flechas e inercia habrían fallado, porque no hay ninguna señal de intención.

## Known Stubs

Ninguno.

## TDD Gate Compliance

- RED: `4724623` (test), con 11 filas en rojo contra el reductor por intención.
- GREEN: `78686f2` (fix), con 49 pruebas en verde entre seguimiento, arquitectura web y sin comentarios.
- REFACTOR: no hizo falta.

## Verification

- `bun test`: 2281 pass, 1 skip (preexistente), 0 fail.
- `bun run check` (tsc, tsc web, Biome, bun audit) y `bun run build:web` en verde.
- Greps de aceptación: no quedan `VENTANA_INTENCION_USUARIA_MS`, `TECLAS_DE_DESPLAZAMIENTO` ni `intencionMs`; hay 0 manejadores de intención en `linea-de-tiempo.tsx`; `AJUSTE_PROPIO` aparece en los tres archivos; sigue `overflow-anchor: none`; `test(` aparece 17 veces; D-78 aparece 2 veces en la UI-SPEC y "por intención de la usuaria" 0.
- Pendiente para el cierre de la fase: el human-check de la receta T16 en Chromium real (barra durante más de 600 ms, PageUp después de un clic en un mensaje e inercia táctil a 375×667 y 1280×720).

## Next Phase Readiness

- WR-03 queda resuelto. G-03-04 y G-03-20 quedan cerrados en la parte de seguimiento del final, también para la barra, el teclado sin foco y la inercia táctil.
- Siguen abiertos el edge UI-01 sin clasificar (revisión manual) e IN-05 (CRECIMIENTO también al achicarse), que está fuera de alcance.

## Self-Check: PASSED
