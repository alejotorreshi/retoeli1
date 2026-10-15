---
phase: 03-chat-web-api-sse-y-despliegue
plan: 32
subsystem: ui
tags: [react, sse, health, gap-closure, G-03-14]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: useSalud().refrescar (03-17), enviarMensaje que nunca rechaza (03-03), casoDelPanel y panel de casos (03-28)
provides:
  - enviarTurno(pedido, despachar, signal, alTerminarTurno) en web/src/api/flujo-chat.ts, que llama al callback una vez al cerrar el pedido, sea cual sea el desenlace
  - useChat(alTerminarTurno) sin el predicado de turno fallido; app.tsx sigue pasando useSalud().refrescar
  - web/src/state/conversacion.ts sin esFalloDeTurno
affects: [encabezado, aviso-modelo, usar-salud, usar-chat, ui-spec-03-39]

actuals:
  tokens: 2460
  tasks: 2
  commits: 3
plan_head_before: 85d41f28b8a2894afa00e78521e77f94033a2eee
plan_head_after: 898aa358438ffe141da10ec624721cc9336e22b2

tech-stack:
  added: []
  patterns:
    - "Refresco por evento, nunca por intervalo: health se pide al cargar, en visibilitychange y al cerrar cada pedido de chat"
    - "El cierre del pedido se avisa en un finally de enviarTurno, así el aviso no depende de leer el desenlace en el hook"

key-files:
  created: []
  modified:
    - web/src/api/flujo-chat.ts
    - web/src/hooks/usar-chat.ts
    - web/src/state/conversacion.ts
    - tests/web/flujo-chat.test.ts
    - tests/web/conversacion.test.ts

key-decisions:
  - "G-03-14: la UI pide /api/health al cerrar cada pedido de chat (turno correcto, error, rechazo HTTP, red caída, stream cortado o Detener), porque el servidor ya publica la recuperación y el cruce del tope diario dentro del turno correcto"
  - "El setInterval de usar-reintento-config.ts (IN-08) se conserva: reintenta /api/config solo mientras falta la config y no consulta /api/health"

patterns-established:
  - "enviarTurno envuelve enviarMensaje y avisa el cierre en un finally; el hook solo libera turnoActivo"

requirements-completed: [LLM-06, UI-04]

coverage:
  - id: D1
    description: "enviarTurno llama alTerminarTurno exactamente una vez, después del último despacho, en un turno completo, con un 429, con un 401, con la red caída, con un stream cortado y con la señal abortada, y la promesa no rechaza"
    requirement: "LLM-06"
    verification:
      - kind: unit
        ref: "tests/web/flujo-chat.test.ts#enviarTurno"
        status: pass
    human_judgment: false
  - id: D2
    description: "useChat(alTerminarTurno) usa enviarTurno y desaparecen la marca de turno fallido y el predicado esFalloDeTurno, con sus pruebas"
    requirement: "UI-04"
    verification:
      - kind: other
        ref: "grep -rn esFalloDeTurno web/src tests/web (sin salida); grep -n turnoFallido web/src/hooks/usar-chat.ts (sin salida)"
        status: pass
      - kind: unit
        ref: "bun test tests/web (241 pass)"
        status: pass
      - kind: other
        ref: "bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts (38 pass); bun run check (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "En el navegador, tras un 500 el turno correcto siguiente deja el encabezado en 'Disponible' sin cambiar de pestaña, y con AGENT_DAILY_TOKEN_BUDGET=1 el primer turno correcto termina mostrando 'Tope diario'"
    requirement: "LLM-06"
    verification: []
    human_judgment: true
    rationale: "Human-check de la tarea 2 (recetas T09 y T10 de .qa/suites/03.suite.json con Playwright MCP y el LLM falso). Ninguna prueba automatizada monta App con useSalud y useChat juntos en un navegador."

duration: 2min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 32: Refrescar health al cerrar cada pedido de chat (G-03-14) Summary

**`enviarTurno` avisa con un finally el cierre de cada pedido de chat, y `useChat(alTerminarTurno)` conecta ese aviso con `useSalud().refrescar`. Así el encabezado y el banner del modelo muestran la recuperación tras un 500 y el cruce del tope diario apenas termina el turno correcto, sin sondeo por intervalo.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-10-15T17:18:50Z
- **Completed:** 2026-10-15T17:20:38Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `enviarTurno(pedido, despachar, signal, alTerminarTurno)` en `web/src/api/flujo-chat.ts` espera `enviarMensaje` y llama al callback en un `finally`: exactamente una vez por pedido, después del último despacho y sin rechazar.
- `useChat` recibe `alTerminarTurno`, usa `enviarTurno` y su `finally` solo libera `turnoActivo`. Desaparece la marca de turno fallido. `app.tsx` no cambia y sigue pasando `refrescar`.
- Se borró `esFalloDeTurno` de `web/src/state/conversacion.ts`, junto con su `describe` y la fila de Detener en `tests/web/conversacion.test.ts`.
- Seis filas nuevas en `tests/web/flujo-chat.test.ts` cubren el aviso de cierre en cada desenlace: turno completo, 429, 401, red caída, stream cortado y señal abortada.

## Task Commits

1. **Task 1: Trazador, cada pedido de chat termina pidiendo health una vez**
   - `2d42f4a` (test, RED: falta la exportación `enviarTurno`)
   - `53a055a` (feat, GREEN: 16/16)
2. **Task 2: Quitar el predicado de turno fallido y sus pruebas, sin sondeo**: `898aa35` (refactor)

**Plan metadata:** commit `docs(03-32)` de este SUMMARY

## Files Created/Modified

- `web/src/api/flujo-chat.ts`: nueva exportación `enviarTurno`.
- `web/src/hooks/usar-chat.ts`: `useChat(alTerminarTurno)`, `iniciarTurno` usa `enviarTurno`, sin `turnoFallido`.
- `web/src/state/conversacion.ts`: sin `esFalloDeTurno`.
- `tests/web/flujo-chat.test.ts`: `describe("enviarTurno")` con seis desenlaces.
- `tests/web/conversacion.test.ts`: sin el `describe` del predicado ni la fila de Detener.

## Decisions Made

- El aviso de cierre vive en `enviarTurno` (capa `api/`) y no en el hook. Así queda probado sin React y el hook no necesita interpretar el desenlace.
- Detener también refresca health: el `finally` corre aunque la señal esté abortada. Es un GET barato que no llama al modelo.

## Deviations from Plan

### Criterio de aceptación con alcance mayor que su intención

**1. [Alcance] `grep -rn "setInterval" web/src` imprime una línea preexistente**
- **Found during:** Task 2 (verificación de los criterios)
- **Issue:** el criterio pide que el grep no imprima nada, pero `web/src/hooks/usar-reintento-config.ts:23` ya tenía un `setInterval` (commit `99b2510`, fix IN-08 del code review). Reintenta `/api/config` cada `REINTENTO_CONFIG_MS` solo mientras la config falta. No consulta `/api/health` ni gasta cupo del chat.
- **Fix:** ninguno. Borrarlo rompería IN-08, un comportamiento que este plan no toca. Lo que el criterio busca proteger (la prohibición "MUST NOT consultar /api/health por intervalo") se comprobó directamente: `obtenerSalud` tiene un solo llamador, `useSalud().refrescar`, y `refrescar` solo corre al montar, en `visibilitychange` y al cerrar cada pedido de chat. Ningún temporizador llega a health.
- **Files modified:** ninguno
- **Verification:** `grep -rn "obtenerSalud" web/src` muestra solo `usar-salud.ts` y su definición en `cliente-api.ts`.
- **Committed in:** no aplica

---

**Total deviations:** 1 (criterio de grep más amplio que su intención; no se cambió código)
**Impact on plan:** ninguno sobre G-03-14. Se respeta la prohibición de sondear health por intervalo.

## Issues Encountered

None

## Verification

- `bun test tests/web/flujo-chat.test.ts`: 16 pass, 0 fail (y otra vez en la compuerta del trazador)
- `bun test tests/web`: 241 pass, 0 fail
- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts`: 38 pass, 0 fail
- `bun run check`: exit 0 (tsc, tsc web, Biome y bun audit)
- `bun test` completo: 2196 pass, 1 skip (preexistente), 0 fail
- Pendiente para la verificación de fin de fase: human-check con Playwright, recetas T09 y T10 (ver coverage D3)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- G-03-14 queda cerrado en el código. El plan 03-39 debe reescribir la UI-SPEC L203 a "al cargar, en visibilitychange y al cerrar cada pedido de chat". El plan 03-33 agrega el botón de comprobar, que reutiliza `refrescar`.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
