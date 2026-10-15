---
phase: 03-chat-web-api-sse-y-despliegue
plan: 47
subsystem: ui
tags: [seguimiento, linea-de-tiempo, scroll, d-78.1, wr-04, reductor-puro, bun-test]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "reducirSeguimiento con AJUSTE_PROPIO y posición (03-43, D-78); fila de avisos de 03-UI-SPEC.md editada por 03-46"
provides:
  - "TOLERANCIA_FONDO = 1 en web/src/config/constants/ui.constants.ts"
  - "desplazar con precedencia fondo → subida → umbral → solo anotar posición (enElFondo, cercaDelFinal, pegarEn)"
  - "describe 'D-78.1: gana la dirección' con la secuencia de WR-04, trackpad lento, tolerancia del fondo, umbral de vuelta y UI-08"
  - "03-UI-SPEC.md: viñeta de auto-scroll y fila overflow de LineaDeTiempo alineadas con D-78.1"
affects: [linea-de-tiempo, verificacion-fase-03, receta-T16]

actuals:
  tokens: 3590
  tasks: 2
  commits: 2
plan_head_before: 3bdbe246a90a22e5ee6c432ec10e886e0efddbff
plan_head_after: eb4a91c6490f9250b3b0b761db11b026c152bfad

tech-stack:
  added: []
  patterns:
    - "Precedencia explícita en el reductor: el fondo (tolerancia de 1 px) gana a la dirección, la dirección gana al umbral, y el umbral solo sirve para volver a pegar"

key-files:
  created: []
  modified:
    - web/src/state/seguimiento.ts
    - web/src/config/constants/ui.constants.ts
    - tests/web/seguimiento.test.ts
    - .planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md

key-decisions:
  - "D-78.1 aplicado: la tolerancia del fondo (1 px) va antes que la dirección, así un encogimiento o un scrollTop fraccionario al fondo no despegan; cualquier otra subida despega aunque quede a 96 px o menos"
  - "La rama final de desplazar reutiliza anotarPosicion, así una señal sin cambios sigue devolviendo el mismo objeto"

patterns-established:
  - "Funciones con nombre para cada umbral del seguimiento (enElFondo, cercaDelFinal) en lugar de comparaciones sueltas"

requirements-completed: [UI-01, UI-08]

coverage:
  - id: D1
    description: "WR-04: 10 flechas de 40 px con CRECIMIENTO y AJUSTE_PROPIO intercalados despegan en la primera, la vista queda despegada hasta el final y contenidoNuevo es true"
    requirement: "UI-01"
    verification:
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78.1: gana la dirección > WR-04: 10 flechas de 40 px con crecimiento y ajuste propio intercalados despegan en la primera y no vuelven a pegar"
        status: pass
    human_judgment: false
  - id: D2
    description: "Trackpad lento (4 px con crecimiento intercalado) y cualquier subida dentro del umbral despegan; la barra y las flechas despegan en el primer tramo"
    requirement: "UI-01"
    verification:
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78.1: gana la dirección > trackpad lento: una subida de 4 px con crecimiento intercalado despega"
        status: pass
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78: el seguimiento se despega con cualquier subida de la usuaria > una subida que deja la vista dentro del umbral despega (D-78.1)"
        status: pass
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78: el seguimiento se despega con cualquier subida de la usuaria > flechas (D-78.1): con 40 px por pulsación, la primera ya despega y las siguientes siguen despegadas"
        status: pass
    human_judgment: false
  - id: D3
    description: "El umbral de 96 px solo vuelve a pegar al bajar (97 px sigue despegada, 96 px pega y apaga el contenido nuevo); 1 px o menos cuenta como el fondo; tipo A, tipo B, encogimiento y la regresión de 375×667 siguen sin despegar"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78.1: gana la dirección > el umbral solo vuelve a pegar al bajar: a 97 px sigue despegada y a 96 px pega y apaga el contenido nuevo"
        status: pass
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78.1: gana la dirección > tolerancia del fondo: una posición fraccionaria a 1 px o menos del fondo no despega"
        status: pass
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78: el seguimiento se despega con cualquier subida de la usuaria > regresión de 2 o más casos a 375×667: 16 crecimientos con sus scrolls propios dejan la vista pegada"
        status: pass
    human_judgment: false
  - id: D4
    description: "Edge UI-08 concurrency: con crecimientos intercalados ni AJUSTE_PROPIO ni CRECIMIENTO vuelven a pegar; ENVIO sí"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/seguimiento.test.ts#D-78.1: gana la dirección > UI-08: con crecimientos intercalados, ni el ajuste propio ni el crecimiento vuelven a pegar; ENVIO sí"
        status: pass
    human_judgment: false
  - id: D5
    description: "state/ sigue puro y linea-de-tiempo.tsx y ui.type.ts no cambian"
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts"
        status: pass
      - kind: other
        ref: "git status --porcelain -- web/src/components/linea-de-tiempo.tsx web/src/types/ui.type.ts (vacío)"
        status: pass
    human_judgment: false
  - id: D6
    description: "03-UI-SPEC.md dice que cualquier subida despega aunque quede a 96 px o menos y que el umbral solo vuelve a pegar (D-78.1)"
    verification:
      - kind: other
        ref: "grep -c 'D-78.1' 03-UI-SPEC.md = 2; grep -c 'la deja a más de 96 px del fondo la despega' = 0"
        status: pass
    human_judgment: false
  - id: D7
    description: "En Chromium real (receta T16, 375×667 y 1280×720), la flecha arriba de a una durante el streaming despega en la primera pulsación y aparece 'Ir al final'; sin tocar, la vista sigue el final; enviar la vuelve a pegar"
    requirement: "UI-01"
    verification: []
    human_judgment: true
    rationale: "Backstop de navegador: el ResizeObserver, el scroll anchoring de Chromium, la cadencia real de eventos SSE y las medidas de layout solo se ven con Playwright MCP en la verificación de la fase"

duration: 2min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 47: Gana la dirección en el seguimiento (WR-04, D-78.1) Summary

**`desplazar` decide fondo (1 px) → subida → umbral de 96 px, así una sola flecha de 40 px con eventos SSE intercalados despega la línea de tiempo y el umbral solo sirve para volver a pegar**

## Performance

- **Duration:** 2 min
- **Started:** 2026-10-15T23:13:15Z
- **Completed:** 2026-10-15T23:15:03Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- WR-04 cerrado: la reproducción del verificador (10 flechas de 40 px con crecimientos de 50 px y AJUSTE_PROPIO entre cada una) es ahora una fila de reductor que despega en la primera flecha y queda despegada hasta el final con `contenidoNuevo` true.
- `TOLERANCIA_FONDO = 1`: un encogimiento o un `scrollTop` fraccionario al fondo no despegan, y el trackpad lento (4 px) sí.
- Las tres filas que fijaban la precedencia vieja (barra, flechas y subida dentro del umbral) quedan reescritas con D-78.1 en el nombre. Tipo A, tipo B, la inercia táctil, PageUp, la regresión de 375×667, ENVIO e IR_AL_FINAL siguen en verde sin cambios.
- La UI-SPEC dice lo mismo que el reductor: cualquier subida despega y el umbral solo vuelve a pegar.

## Task Commits

1. **Task 1 (tracer): la flecha arriba con crecimientos intercalados despega en la primera pulsación** - `98a6747` (fix)
2. **Task 2: la UI-SPEC describe el seguimiento con la dirección por delante del umbral** - `eb4a91c` (docs)

## Files Created/Modified
- `web/src/config/constants/ui.constants.ts` - `TOLERANCIA_FONDO = 1` después de `DISTANCIA_PEGADO_AL_FINAL`
- `web/src/state/seguimiento.ts` - `enElFondo`, `cercaDelFinal`, `pegarEn` y `desplazar` con la precedencia de D-78.1
- `tests/web/seguimiento.test.ts` - describe "D-78.1: gana la dirección" (6 filas, con el helper `secuenciaWr04`) y las tres filas reescritas
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md` - viñeta de auto-scroll de LineaDeTiempo y fila overflow de UI Considerations

## Decisions Made
- La tolerancia del fondo va antes que la dirección (el review lo proponía igual): una subida a 1 px o menos del fondo no despega.
- La rama "en otro caso" reutiliza `anotarPosicion`, así `conCambios` sigue devolviendo el mismo objeto cuando nada cambia.

## Deviations from Plan

None - plan executed exactly as written. Además de las filas pedidas se agregó una fila explícita para la verdad "Edge UI-08 concurrency" (AJUSTE_PROPIO y CRECIMIENTO no vuelven a pegar; ENVIO sí), que el must_have nombra y la secuencia de WR-04 cubría solo de forma implícita.

## Issues Encountered
None. El `1 skip` de `bun test` es `tests/live/agente-en-vivo.test.ts` (`describe.skipIf(LLM_EN_VIVO !== "1")`), anterior a este plan.

## Verification
- RED: 6 filas fallaron antes del cambio del reductor.
- `bun test tests/web/seguimiento.test.ts tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts`: 61 pass, 0 fail.
- `bun run build:web` y `bun run check` (tsc + Biome + audit): exit 0.
- `bun test` completo: 2320 tests, 0 fail, 1 skip.
- Tracer feedback gate (interactive, end-of-phase, verify solo automatizado): re-ejecutado y en verde antes de la tarea 2.
- `git status --porcelain -- web/src/components/linea-de-tiempo.tsx web/src/types/ui.type.ts`: vacío.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Queda el human-check de la tarea 2 (receta T16 con Playwright MCP y el LLM falso a 375×667 y 1280×720: flechas de a una y un tirón de rueda durante el streaming) para la verificación de la fase.
- IN-04 sigue diferido de forma explícita (flagged_assumptions del plan).

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
