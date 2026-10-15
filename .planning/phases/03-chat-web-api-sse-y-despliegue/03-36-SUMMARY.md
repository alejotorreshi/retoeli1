---
phase: 03-chat-web-api-sse-y-despliegue
plan: 36
subsystem: ui
tags: [react, scroll, overflow-anchor, reducer, a11y, responsive]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-34: PropsLineaDeTiempo con pausada; LineaDeTiempo con ResizeObserver y 'Ir al final'"
provides:
  - "reducirSeguimiento/seguimientoInicial: pegado y contenido nuevo derivados de la intención de la usuaria (rueda, toque, puntero, teclas de navegación) dentro de VENTANA_INTENCION_USUARIA_MS"
  - "LineaDeTiempo se re-ancla al final con cada turno nuevo (enviar o hidratar)"
  - ".zona con overflow-anchor: none mientras sigue el final y position: relative (los sr-only ya no desbordan el documento)"
  - "'Ir al final' solo con ícono de 40×40 px en diseño angosto, con aria-label"
affects: [03-37, 03-38, verify-work 03, qa T16]

actuals:
  tokens: 4358
  tasks: 2
  commits: 2
plan_head_before: aeb98cf84e4fe23ac85df110bdfc9e5b3285ed19
plan_head_after: 1ca4b55c48bced934933f18e34b7ca79c376eab9

tech-stack:
  added: []
  patterns:
    - "Reductor puro de seguimiento en web/src/state con señales as const (SENAL_SEGUIMIENTO) y milisegundos del evento inyectados, sin tocar el navegador"
    - "Estado de seguimiento en un ref como fuente síncrona (lo lee el ResizeObserver) y useState solo para lo que se pinta"

key-files:
  created:
    - web/src/state/seguimiento.ts
    - tests/web/seguimiento.test.ts
  modified:
    - web/src/components/linea-de-tiempo.tsx
    - web/src/components/linea-de-tiempo.module.css
    - web/src/config/constants/ui.constants.ts
    - web/src/types/ui.type.ts

key-decisions:
  - "El seguimiento vive en un ref actualizado de forma síncrona por despachar() y no en useReducer: el ResizeObserver lee el estado vigente sin esperar al commit, y el componente solo se vuelve a pintar cuando cambia pegado o contenidoNuevo (la INTENCION de cada rueda no repinta la lista)"
  - "ENVIO e IR_AL_FINAL limpian también intencionMs, para que el scroll de la propia bajada no se lea como intención de una rueda reciente"
  - "El re-anclaje al enviar usa useLayoutEffect sobre turnos.length, así el estado ya está pegado cuando llega el ResizeObserver del mensaje nuevo"

patterns-established:
  - "Seguimiento del final por intención: un evento scroll solo cambia el estado si hubo rueda, toque, puntero o tecla de navegación dentro de VENTANA_INTENCION_USUARIA_MS"

requirements-completed: [UI-01, UI-08]

coverage:
  - id: D1
    description: "La línea de tiempo no se despega por los scroll del propio auto-scroll (tipo A) ni del scroll anchoring (tipo B); solo la intención de la usuaria la despega"
    requirement: UI-01
    verification:
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#regresión de 2 o más casos a 375×667: 16 crecimientos y scrolls sin intención dejan la vista pegada"
        status: pass
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#tipo A: el scroll de la propia bajada tras un crecimiento de 326 px no despega"
        status: pass
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#tipo B: el ajuste del scroll anchoring con 424 px de distancia no despega"
        status: pass
    human_judgment: false
  - id: D2
    description: "Mandar un mensaje o pulsar 'Ir al final' vuelve a pegar la vista y apaga el contenido nuevo"
    requirement: UI-01
    verification:
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#mandar un mensaje vuelve a pegar y apaga el contenido nuevo"
        status: pass
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#'Ir al final' vuelve a pegar y apaga el contenido nuevo"
        status: pass
    human_judgment: false
  - id: D3
    description: "En el navegador real a 375×667 y 1280×720: la demo de 4 casos sigue el final, overflow-anchor neutralizado, 'Ir al final' de 40×40 solo con ícono a 375 y documento sin desborde (scrollHeight = innerHeight)"
    requirement: UI-08
    verification: []
    human_judgment: true
    rationale: "El comportamiento del scroll, del anchoring de Chromium y del layout angosto solo se observa en un navegador real; queda como human-check de la tarea 2 (receta T16 con Playwright MCP) para la verificación de fin de fase"

duration: 3min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 36: Seguimiento del final por intención de la usuaria Summary

**Reductor puro `reducirSeguimiento` que solo despega la línea de tiempo ante rueda, toque, puntero o teclas de navegación (600 ms), re-anclaje al enviar, `overflow-anchor: none` mientras sigue el final y "Ir al final" de 40×40 solo con ícono a 375**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-15T17:37:56Z
- **Completed:** 2026-10-15T17:40:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- `web/src/state/seguimiento.ts`: estado `{ pegado, contenidoNuevo, intencionMs }` y señales INTENCION, DESPLAZAMIENTO, CRECIMIENTO, ENVIO e IR_AL_FINAL. Un DESPLAZAMIENTO fuera de la ventana de intención se ignora, así que los scroll tipo A (bajada propia) y tipo B (anchoring) del diagnóstico ya no apagan el seguimiento.
- `LineaDeTiempo` despacha INTENCION en `onWheel`, `onTouchStart`, `onPointerDown` y `onKeyDown` (solo `TECLAS_DE_DESPLAZAMIENTO`), DESPLAZAMIENTO en `onScroll` con la distancia medida, CRECIMIENTO desde el ResizeObserver y ENVIO cuando crece la cantidad de turnos (también al hidratar).
- `.zona` lleva `siguiendo` (`overflow-anchor: none`) solo mientras está pegada, y `position: relative`, que la vuelve el bloque contenedor de los sr-only de las burbujas.
- "Ir al final" muestra `IconoChevron` girado hacia abajo más el texto. En `[data-diseno="angosto"]` el texto se oculta y el botón queda de `--alto-control` × `--alto-control`, siempre con `aria-label`.

## Task Commits

1. **Task 1: Trazador, la línea de tiempo sigue el turno salvo que la usuaria suba y se re-ancla al enviar** - `7a5089b` (feat)
2. **Task 2: Anchoring neutralizado mientras sigue el final e 'Ir al final' solo con ícono a 375** - `1ca4b55` (feat)

## Files Created/Modified
- `web/src/state/seguimiento.ts`: reductor puro del seguimiento del final.
- `tests/web/seguimiento.test.ts`: 10 pruebas, con la regresión de 2 o más casos a 375 (16 pares de crecimiento y scroll de 300 a 430 px más el cierre del turno) y los eventos tipo A y B.
- `web/src/config/constants/ui.constants.ts`: `VENTANA_INTENCION_USUARIA_MS = 600`, `SENAL_SEGUIMIENTO` y `TECLAS_DE_DESPLAZAMIENTO`.
- `web/src/types/ui.type.ts`: `EstadoSeguimiento` y la unión `SenalSeguimiento`.
- `web/src/components/linea-de-tiempo.tsx`: manejadores de intención, ref de seguimiento, re-anclaje con `useLayoutEffect` y el botón con ícono.
- `web/src/components/linea-de-tiempo.module.css`: `.zona` relativa, `.siguiendo`, `.iconoIrAlFinal` y la variante angosta del botón.

## Decisions Made
- Fuente síncrona en un ref en lugar de `useReducer`: el ResizeObserver necesita el estado vigente en el mismo frame, y con `useReducer` más un ref espejo actualizado en un efecto quedaba una ventana en la que una rueda ya había despegado la vista pero el observador todavía la bajaba. Sigue pasando por `reducirSeguimiento`, y solo se vuelve a pintar cuando cambia lo visible.
- ENVIO e IR_AL_FINAL vuelven al estado inicial, con `intencionMs` en null.
- El re-anclaje al enviar usa `useLayoutEffect` para que el estado ya esté pegado cuando el ResizeObserver mida el mensaje nuevo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Ref como fuente síncrona en lugar de useReducer más un ref espejo**
- **Found during:** Task 1
- **Issue:** El plan pedía `useReducer(reducirSeguimiento, seguimientoInicial)` con un ref que espeje el estado. Un ref actualizado después del commit deja una ventana de carrera: el ResizeObserver lee `pegado = true` cuando una rueda ya lo había apagado y baja la vista contra la voluntad de la usuaria.
- **Fix:** `despachar()` aplica `reducirSeguimiento` sobre el ref de forma síncrona y llama a `setVista` solo cuando cambian `pegado` o `contenidoNuevo`.
- **Files modified:** web/src/components/linea-de-tiempo.tsx
- **Verification:** las pruebas del reductor, `bun run check` y `bun test` pasan. El criterio de aceptación (`reducirSeguimiento` en linea-de-tiempo.tsx, sin `hayContenidoNuevo`) se cumple.
- **Committed in:** 7a5089b

---

**Total deviations:** 1 auto-fixed (1 Rule 1)
**Impact on plan:** El contrato del plan (reductor puro, señales y key_link) no cambia. Solo cambia cómo el componente guarda el estado. Sin ampliar el alcance.

## Issues Encountered
None

## Verification
- `bun test tests/web/seguimiento.test.ts`: 10 pass, 0 fail.
- `bun test tests/web`: 261 pass. `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts`: 38 pass.
- `bun run build:web`: exit 0. `bun run check`: exit 0, con tsc, Biome y bun audit.
- `bun test` completo: 2222 pass, 1 skip (preexistente), 0 fail.
- Pendiente para el fin de fase: el human-check de la tarea 2, la receta T16 con Playwright MCP a 375×667 y 1280×720 (distancia ≤ 96 px tras cada turno, botón de 40×40 solo con ícono y `scrollHeight` igual a `innerHeight`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Listo para 03-37 (encabezado en dos líneas y chips en una fila a 375) y 03-38 (la parte de sesiones de G-03-04).
- La verificación en navegador de G-03-20 la cubre el human-check de la tarea 2 en la UAT de la fase 03.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
