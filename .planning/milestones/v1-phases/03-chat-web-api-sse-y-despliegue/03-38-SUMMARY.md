---
phase: 03-chat-web-api-sse-y-despliegue
plan: 38
subsystem: ui
tags: [react, useReducer, localStorage, sse, rate-limit, 429]

requires:
  - phase: 03-32
    provides: "useChat con alTerminarTurno y enviarTurno"
  - phase: 03-35
    provides: "Mensaje del 429 de sesiones nuevas con los minutos de espera ('Podrás abrir otra en {m}.')"
  - phase: 03-37
    provides: "Encabezado y chips a 375 (último cambio de app.tsx)"
provides:
  - "EstadoConversacion.sesionAnterior: NUEVA_SESION la guarda, el turn_start la limpia"
  - "ACCION_UI.VOLVER_SESION_ANTERIOR y ACCION_AVISO.VOLVER_SESION_ANTERIOR con el texto 'Volver a la sesión anterior'"
  - "ERROR_HTTP 429 sin sesión vigente y con sesión anterior marca el AvisoError con VOLVER_SESION_ANTERIOR"
  - "ControlChat.volverASesionAnterior; nuevaSesion ya no borra el sessionId de localStorage"
affects: [03-39, verify-work, ui-review]

actuals:
  tokens: 3285
  tasks: 2
  commits: 2
plan_head_before: 88d04bfafb21f9450f48b65118356cd65e5bc742
plan_head_after: e7f2cb798c4c27725aca042f41e634f2850e0c76

tech-stack:
  added: []
  patterns:
    - "Identidad de sesión transitoria: el id anterior vive en el estado de la UI (y en localStorage) hasta que el servidor confirma la sesión nueva con turn_start"
    - "rechazarPedido(estado, status, mensaje) concentra la decisión de ERROR_HTTP (401 → acceso; 429 con sesión anterior → volver; resto → error sin acción)"

key-files:
  created: []
  modified:
    - web/src/state/conversacion.ts
    - web/src/types/chat.type.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/config/strings.ts
    - web/src/hooks/usar-chat.ts
    - web/src/app.tsx
    - tests/web/conversacion.test.ts

key-decisions:
  - "NUEVA_SESION guarda sesionAnterior = sesionId ?? sesionAnterior: pulsar 'Empezar sesión nueva' dos veces sin mandar nada conserva la misma sesión a la que volver"
  - "El turn_start limpia sesionAnterior también cuando trae sesionExpirada: el servidor ya abrió una sesión y la anterior dejó de ser alcanzable"
  - "VOLVER_SESION_ANTERIOR reutiliza estadoAlCargar(sesionAnterior) y conserva acceso, config y borrador; el efecto de carga existente pide GET /api/sessions/:id porque hidratando vuelve a true, y un 404 ahí la olvida como siempre"
  - "La opción de volver solo se ofrece con 429; 413, 503 y errores de red no la ofrecen aunque haya sesión anterior"

patterns-established:
  - "El id guardado en localStorage solo cambia por una respuesta del servidor (turn_start lo reemplaza, 404 lo olvida), nunca por una acción local de la UI"

requirements-completed: [UI-08, UI-04, API-04]

coverage:
  - id: D1
    description: "NUEVA_SESION conserva la sesión vigente como sesionAnterior y vacía la pantalla con acceso, config y borrador intactos"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#NUEVA_SESION guarda la sesión vigente como anterior y conserva acceso, config y borrador"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#una segunda NUEVA_SESION sin mandar nada conserva la misma sesión anterior"
        status: pass
    human_judgment: false
  - id: D2
    description: "Un 429 del primer mensaje de la sesión nueva muestra el mensaje del servidor con la acción 'Volver a la sesión anterior' y deja el texto en el compositor; sin sesión anterior, o con 413/503, no ofrece volver"
    requirement: API-04
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#un 429 de la sesión nueva ofrece volver a la anterior y deja el texto en el compositor"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#sin sesión anterior un 429 no ofrece volver"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#con sesión anterior un 413 o un 503 no ofrecen volver"
        status: pass
    human_judgment: false
  - id: D3
    description: "VOLVER_SESION_ANTERIOR recupera el id anterior, pide su historial y conserva el borrador; no hace nada sin sesión anterior o con turno en curso; el turn_start de la sesión nueva olvida la anterior"
    requirement: UI-04
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#VOLVER_SESION_ANTERIOR recupera el id anterior, pide su historial y conserva el borrador"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#VOLVER_SESION_ANTERIOR no hace nada sin sesión anterior o con un turno en curso"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#el turn_start de la sesión nueva olvida la anterior"
        status: pass
    human_judgment: false
  - id: D4
    description: "Flujo en navegador con NEW_SESSIONS_PER_HOUR=1: el AvisoError del 429 muestra 'Volver a la sesión anterior', al pulsarlo vuelve el historial de la sesión 1 sin POST /api/chat y el borrador se conserva; recargar tras el 429 vuelve a la sesión 1"
    requirement: UI-08
    verification:
      - kind: other
        ref: "bun run build:web && bun run check"
        status: pass
    human_judgment: true
    rationale: "Human-check de la tarea 2 (Playwright MCP en el stack local con tope de sesiones en 1); con human_verify_mode end-of-phase lo consolida el verificador al cierre de la fase"

duration: 2min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 38: Volver a la sesión anterior tras un 429 de sesión nueva Summary

**"Empezar sesión nueva" ya no borra el sessionId guardado: el id anterior queda en localStorage y en `sesionAnterior` hasta el turn_start de la sesión nueva, y un 429 ofrece "Volver a la sesión anterior", que recarga su historial por GET /api/sessions/:id sin reenviar nada (G-03-04, causa 3b)**

## Performance

- **Duration:** 2 min (medido desde el registro de inicio, tras la lectura del contexto)
- **Started:** 2026-10-15T17:48:16Z
- **Completed:** 2026-10-15T17:50:10Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- El estado de la conversación sabe a qué sesión volver: `NUEVA_SESION` la guarda, el `turn_start` la limpia y `VOLVER_SESION_ANTERIOR` la restaura con `hidratando: true`, conservando acceso, config y borrador.
- Un 429 del primer mensaje de la sesión nueva muestra el mensaje del servidor (con los minutos de 03-35) y el botón "Volver a la sesión anterior". Sin sesión anterior, o con un 413 o un 503, el aviso no lleva botón.
- `nuevaSesion()` ya no llama `olvidarSesion()`. Recargar la página después de un 429 o de un corte antes del `turn_start` vuelve a la sesión anterior. `olvidarSesion` solo queda en la respuesta 404 al cargar.
- `app.tsx` conecta `ACCION_AVISO.VOLVER_SESION_ANTERIOR` con `volverASesionAnterior()`, que solo despacha la acción y no manda nada a `/api/chat`.

## Task Commits

1. **Task 1 (tracer): el estado ofrece volver a la sesión anterior tras un 429** - `14692e8` (feat)
2. **Task 2: Nueva sesión conserva el id guardado y la app conecta el botón** - `e7f2cb7` (feat)

## Files Created/Modified
- `web/src/state/conversacion.ts`: `sesionAnterior` en el estado inicial, `rechazarPedido`, `accionDelRechazo`, `volverASesionAnterior`, NUEVA_SESION que guarda la anterior y turn_start que la limpia.
- `web/src/types/chat.type.ts`: `EstadoConversacion.sesionAnterior`, `AccionVolverSesionAnterior` en `AccionUi` y `ControlChat.volverASesionAnterior`.
- `web/src/config/constants/ui.constants.ts`: `VOLVER_SESION_ANTERIOR` en `ACCION_UI` y en `ACCION_AVISO`.
- `web/src/config/strings.ts`: "Volver a la sesión anterior" en `ACCION_DEL_AVISO`.
- `web/src/hooks/usar-chat.ts`: `nuevaSesion` sin `olvidarSesion()`, y `volverASesionAnterior` nuevo.
- `web/src/app.tsx`: `alAccionDeAviso` llama `volverASesionAnterior()`.
- `tests/web/conversacion.test.ts`: describe nuevo con 8 filas de G-03-04. También se actualizaron las filas del estado inicial y de NUEVA_SESION por el campo nuevo.

## Diff de nuevaSesion (criterio de aceptación de la tarea 2)

```diff
   function nuevaSesion(): void {
     if (estado.enCurso || turnoActivo.current !== null) return;
-    olvidarSesion();
     despachar({ tipo: ACCION_UI.NUEVA_SESION });
   }
```

## Decisions Made
- `sesionAnterior = sesionId ?? sesionAnterior`. Si se pulsa "Empezar sesión nueva" dos veces seguidas sin mandar nada, la sesión a la que se vuelve no se pierde.
- El turn_start limpia `sesionAnterior` también cuando trae `sesionExpirada`, porque el servidor ya abrió otra sesión.
- `VOLVER_SESION_ANTERIOR` reutiliza `estadoAlCargar(sesionAnterior)`. El efecto de carga que ya existía hace el GET, y si responde 404 la SPA olvida el id como antes (T-03-61).
- Solo el 429 ofrece volver. Tal como dice el plan en flagged_assumptions, el front no distingue el 429 de sesiones del 429 de mensajes por minuto. Ofrecer volver en ese caso no hace daño, porque solo recarga la vista.

## Deviations from Plan

Ninguna. El plan se ejecutó tal como estaba escrito.

Las pruebas existentes "el estado inicial ..." y "NUEVA_SESION vacía conversación ..." se actualizaron para incluir el campo nuevo `sesionAnterior`. Eso sale directamente del cambio de estado planeado y no es una desviación.

## Issues Encountered
Ninguno.

## Verification
- `bun test tests/web/conversacion.test.ts`: 50 pass, 0 fail (antes de la implementación estaba en rojo con 6 fail).
- `bun test tests/web`: 273 pass, 0 fail.
- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts`: 38 pass, 0 fail.
- `bun run build:web`: exit 0. `bun run check` (tsc, tsc web, biome, audit): exit 0.
- `bun test` (suite completa): 2234 pass, 1 skip (la prueba en vivo del LLM, condicionada a `LLM_EN_VIVO`), 0 fail.
- Compuerta del trazador: ejecución interactiva, `end-of-phase`, verify solo `<automated>`. Se volvió a correr el verify, pasó y la ejecución siguió con la tarea 2.
- Human-check de la tarea 2 (Playwright con `NEW_SESSIONS_PER_HOUR=1`): pendiente. Lo consolida el verificador al cierre de la fase (`human_verify_mode: end-of-phase`).

## User Setup Required

Ninguno. No hace falta configurar servicios externos.

## Next Phase Readiness
- G-03-04 queda cerrado del lado del cliente junto con 03-35, 03-36 y 03-37. 03-39 registra en la UI-SPEC que recargar después de "Empezar sesión nueva" sin mandar nada vuelve a la sesión anterior.

## Self-Check: PASSED
- FOUND: web/src/state/conversacion.ts, web/src/hooks/usar-chat.ts, web/src/app.tsx, web/src/types/chat.type.ts, web/src/config/constants/ui.constants.ts, web/src/config/strings.ts, tests/web/conversacion.test.ts
- FOUND commits: 14692e8, e7f2cb7 (ancestros de HEAD)

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
