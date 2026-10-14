---
phase: 03-chat-web-api-sse-y-despliegue
plan: 03
subsystem: ui
tags: [react, vite, sse, eventsource-parser, useReducer, bun-run-parallel]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "POST /api/chat por SSE con eventos redactados, ErrorResponse { mensaje } en todo no-2xx, RUTA_API, PREFIJO_API, PUERTO_API_POR_DEFECTO, PUERTO_WEB_DEV, DIRECTORIO_WEB_DIST y el script dev:api (03-01, 03-02)"
provides:
  - "web/ con Vite 8 + React 19: index.html, vite.config.ts con alias @web y @, proxy /api y build a web/dist desde las constantes http"
  - "enviarMensaje: POST JSON a RUTA_API.CHAT leído con TextDecoderStream + EventSourceParserStream; despacha EVENTO por cada evento válido, ERROR_HTTP con status y mensaje del servidor, ERROR_RED ante falla de red o rechazo sin mensaje legible y FIN_STREAM si el stream termina o se corta sin turn_end; un pedido abortado no despacha nada"
  - "reducirConversacion puro (sin React ni DOM): burbuja de la usuaria, texto del agente, sesionId de turn_start, error del turno, cierre de enCurso por turn_end, ERROR_HTTP, ERROR_RED y FIN_STREAM"
  - "Pantalla mínima: título, línea de tiempo con texto pre-wrap, Pensando… mientras enCurso, línea de error con role=alert, Enter envía y Shift+Enter inserta salto"
  - "Scripts dev (bun run --parallel dev:api dev:web), dev:web y build:web; check suma tsc -p web/tsconfig.json; alias @web/ en tsconfig raíz y en el ALIAS del guardián"
affects: [03-04, 03-05, 03-07, 03-09, 03-10]

actuals:
  tokens: 6830
  tasks: 2
  commits: 3
plan_head_before: 284de2ccf242713219b5dc5e3e51fe2a216557ac
plan_head_after: 5b05e6c49c9f842e8f649d9bf5fb4919961a23bb

tech-stack:
  added: []
  patterns:
    - "Cliente SSE del navegador: fetch POST + TextDecoderStream + EventSourceParserStream, nunca EventSource; cada frame se valida contra TIPO_EVENTO antes de despachar"
    - "enviarMensaje nunca rechaza: toda falla se traduce a una acción de UI (ERROR_HTTP, ERROR_RED o FIN_STREAM), así la pantalla jamás queda en Pensando…"
    - "El reductor ignora FIN_STREAM si el turno ya cerró, así el cliente puede despachar FIN_STREAM ante cualquier lectura fallida sin pisar un turno completo"
    - "Copia propia del front (red caída, stream cortado) solo en web/src/config/strings.ts; los mensajes del servidor se muestran tal como llegan"
    - "Pruebas del cliente SSE con spyOn(globalThis, 'fetch') y restauración en afterEach"

key-files:
  created:
    - web/index.html
    - web/vite.config.ts
    - web/tsconfig.json
    - web/src/main.tsx
    - web/src/app.tsx
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/types/chat.type.ts
    - web/src/api/flujo-chat.ts
    - web/src/state/conversacion.ts
    - tests/web/conversacion.test.ts
    - tests/web/flujo-chat.test.ts
  modified:
    - package.json
    - tsconfig.json
    - tests/architecture.test.ts

key-decisions:
  - "Un rechazo HTTP cuyo cuerpo no trae { mensaje } legible (p. ej. el 502 del proxy de Vite con la API caída) se trata como ERROR_RED y muestra la copia de red caída, en lugar de inventar una copia nueva fuera del contrato de la UI-SPEC"
  - "Un stream que se corta con error (lector que rechaza) se trata igual que uno que termina sin turn_end: FIN_STREAM con la copia de stream cortado"
  - "El evento error no cierra enCurso: el turno sigue hasta su turn_end, y el error queda visible después"

patterns-established:
  - "Front con useReducer puro alimentado por eventos SSE y acciones de UI (ACCION_UI as const)"
  - "Reglas del guardián web (03-05) ya aplicadas: sin comentarios, solo alias @web/ y @/, @/ solo para config pura y import type de http/types, textos solo en web/src/config/strings.ts, texto solo como nodos de texto de React"

requirements-completed: [DEP-01, UI-01]

coverage:
  - id: D1
    description: "bun run dev levanta API y Vite en paralelo; el SPA y /api/health por el proxy responden en menos de 90 s"
    requirement: "DEP-01"
    verification:
      - kind: integration
        ref: "bun run dev + sondeo de http://localhost:5173/api/health y http://localhost:5173/ (DEV_OK al 2.º intento, SPA 200)"
        status: pass
    human_judgment: false
  - id: D2
    description: "El reductor puro pliega ENVIAR, turn_start, text y turn_end en una burbuja, un texto del agente, la sesión reutilizada y el turno cerrado"
    requirement: "UI-01"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#turn_start, text y turn_end dejan una burbuja, un texto del agente, la sesión y el turno cerrado"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#un segundo ENVIAR conserva el sessionId del turno anterior"
        status: pass
    human_judgment: false
  - id: D3
    description: "La analista conversa con el agente real desde el navegador: burbuja inmediata, Pensando…, respuesta en texto plano con saltos de línea, y un segundo mensaje continúa la misma sesión"
    requirement: "UI-01"
    verification:
      - kind: automated_ui
        ref: "Playwright MCP contra bun run dev (ejecutado por el orquestador, señal: approved)"
        status: pass
    human_judgment: true
    rationale: "La experiencia con el proveedor real (tiempos de 30–60 s por turno, legibilidad de la respuesta) la juzga una persona; se verificó en navegador real y la usuaria aprobó"
  - id: D4
    description: "Cada falla del turno termina Pensando… con un mensaje claro: evento error, ERROR_HTTP 413, ERROR_RED y FIN_STREAM"
    requirement: "UI-01"
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#el evento error conserva el turno y guarda su código y su mensaje"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#ERROR_HTTP 413 guarda el mensaje del servidor y cierra el turno"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#ERROR_RED guarda la copia de red caída del front y cierra el turno"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#FIN_STREAM sin turn_end guarda la copia de stream cortado, conserva el texto y cierra el turno"
        status: pass
    human_judgment: false
  - id: D5
    description: "El cliente SSE despacha la acción correcta para turno completo, stream sin turn_end, stream cortado, rechazo 413, rechazo sin mensaje, falla de red y pedido abortado"
    requirement: "UI-01"
    verification:
      - kind: unit
        ref: "tests/web/flujo-chat.test.ts#enviarMensaje"
        status: pass
    human_judgment: false

duration: 29min
completed: 2026-10-14
status: complete
---

# Phase 3 Plan 03: Chat en el navegador Summary

**Chat web con Vite 8 + React 19 que lee POST /api/chat con EventSourceParserStream y lo pliega con un reductor puro. Arranca con un solo `bun run dev` y cada falla del turno (evento error, rechazo HTTP, red caída, stream cortado) cierra "Pensando…" con un mensaje claro.**

## Performance

- **Duration:** 29 min (las dos tareas, incluida la verificación en navegador del tracer)
- **Started:** 2026-10-14T23:26:54Z
- **Completed:** 2026-10-14T23:56:11Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- `bun run dev` levanta la API (`bun --watch src/server.ts`) y Vite (puerto `PUERTO_WEB_DEV`, proxy `/api`) en paralelo. El SPA y `/api/health` responden por el proxy al segundo intento.
- El navegador conversa con el agente real. `enviarMensaje` usa fetch POST + `TextDecoderStream` + `EventSourceParserStream` y reutiliza el `sessionId` de `turn_start`.
- `reducirConversacion` es puro y cubre el ciclo feliz y los cuatro caminos de error. `enviarMensaje` nunca rechaza: toda falla se convierte en una acción de UI.
- `bun run check` ahora tipa también `web/` (`tsc -p web/tsconfig.json`), y el alias `@web/` existe en tsconfig y en el guardián.

## Task Commits

1. **Task 1: Tracer, la analista chatea con el agente desde el navegador con un solo comando** - `caa8f7a` (feat)
2. **Task 2: El chat del navegador informa errores del servidor, rechazos HTTP, fallas de red y streams cortados en lugar de colgarse**
   - RED: `80decf8` (test)
   - GREEN: `5b05e6c` (feat)
   - REFACTOR: no hizo falta

## Verificación del tracer (gate después de Task 1)

- **Método:** el orquestador la ejecutó en un navegador real con Playwright MCP contra `bun run dev`, a pedido de la usuaria. **Señal de la usuaria:** "approved".
- La página carga con el título "Registro como proveedor · Periferia IT Group", el encabezado y el estado vacío "¿Qué caso procesamos?".
- Shift+Enter no envía. Enter envía, y la burbuja propia y "Pensando…" aparecen de inmediato.
- La respuesta del agente se pinta como texto plano con los saltos de línea preservados (pre-wrap). Fue el resumen de co-industrias-delta: 17 llenos, BLOQUEADO por cámara vencida, y pide confirmación explícita.
- El segundo mensaje, "no, todavía no", siguió en la misma sesión. El agente respondió "Entendido, no envío nada".
- Cada turno tardó ~30–60 s con el proveedor real.
- El único error de consola fue un 404 de `/favicon.ico` (ver Next Phase Readiness).

## TDD (Task 2)

- **RED:** cinco pruebas nuevas del reductor: evento error, error visible tras turn_end, ERROR_HTTP 413, ERROR_RED y FIN_STREAM sin turn_end. Fallaron 5 de 11, todas por aserción (por ejemplo, `enCurso` esperado `false` y recibido `true`), sin errores de carga ni de sintaxis. Con el reporte JUnit de `bun test` el clasificador dio `RED_EVIDENCE_OK` (`target_test_failed`, objetivo "ERROR_HTTP 413 guarda el mensaje del servidor y cierra el turno"). **Evaluación semántica:** la prueba objetivo se ejecutó y falló en la aserción planeada porque el reductor ignoraba ERROR_HTTP. La guarda "FIN_STREAM después de turn_end no cambia el estado" pasó desde el inicio, como se esperaba, porque no es objetivo RED.
- **GREEN:** `registrarError` y `cerrarConError` en el reductor, y el cliente SSE con `pedirChat`, `informarRechazo` y `leerEventos` tolerante a cortes. 11/11 en el reductor, más 8 pruebas nuevas del cliente con fetch simulado.

## Files Created/Modified

- `web/src/api/flujo-chat.ts`: cliente SSE. Despacha EVENTO, ERROR_HTTP, ERROR_RED y FIN_STREAM, y no despacha nada si el pedido se abortó.
- `web/src/state/conversacion.ts`: reductor puro con el error por turno y el cierre de `enCurso` en todos los caminos de falla.
- `web/src/app.tsx`: pinta la línea de error del turno con `role="alert"` como texto de React (plan 03-05 la convierte en AvisoError).
- `tests/web/conversacion.test.ts`: pruebas del reductor (ciclo feliz y errores).
- `tests/web/flujo-chat.test.ts`: pruebas de `enviarMensaje` con `spyOn(globalThis, "fetch")`.
- Task 1: `web/index.html`, `web/vite.config.ts`, `web/tsconfig.json`, `web/src/main.tsx`, `web/src/config/strings.ts`, `web/src/config/constants/ui.constants.ts`, `web/src/types/chat.type.ts`, `package.json`, `tsconfig.json` y `tests/architecture.test.ts`.

## Decisions Made

- Un rechazo HTTP sin `{ mensaje }` legible (por ejemplo, el 502 del proxy de Vite con la API caída) se trata como ERROR_RED con la copia de red caída. Así no hace falta inventar una copia fuera del contrato de la UI-SPEC.
- Un stream que se corta con error se trata como uno que termina sin `turn_end`: FIN_STREAM. Si el corte llega después de `turn_end`, el reductor lo ignora.
- El evento `error` no cierra `enCurso`. El servidor siempre cierra con `turn_end`, y el error sigue visible después.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Pruebas del cliente SSE además de las del reductor**
- **Found during:** Task 2
- **Issue:** el plan solo pedía pruebas del reductor. El despacho de ERROR_HTTP, ERROR_RED y FIN_STREAM en `flujo-chat.ts` (que es lo que evita que la pantalla se cuelgue) quedaba sin prueba automática.
- **Fix:** se agregó `tests/web/flujo-chat.test.ts` con fetch simulado y 8 casos: POST JSON a la ruta, turno completo, stream sin turn_end, stream cortado, 413, rechazo sin mensaje, red caída y pedido abortado.
- **Files modified:** tests/web/flujo-chat.test.ts
- **Verification:** `bun test tests/web` 19/19.
- **Committed in:** 5b05e6c

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** solo suma cobertura. No hay cambios de alcance ni dependencias nuevas.

## Issues Encountered

- La raíz (tipos de Bun) y `web/` (tipos DOM) tipan distinto los lectores de streams (`ReadableStreamReadResult` y `readMany`). Se resolvió sin nombrar tipos de stream: `leerEventos` envuelve el recorrido en try/catch.
- El `bun run dev` del ejecutor anterior se detuvo antes de la verificación final, que corrió con claves falsas y solo tocó `/api/health`.

## Verificación del plan

- `bun test`: 1592 pass, 1 skip (prueba en vivo existente), 0 fail.
- `bun run check` (tsc raíz, tsc web, biome y audit): exit 0.
- `bun run build:web` genera `web/dist/index.html`: BUILD_OK.
- `bun run dev` sirve el SPA (200) y `/api/health` por el proxy dentro de los 90 s: DEV_OK.

## User Setup Required

None. No hace falta configurar servicios externos.

## Next Phase Readiness

- Listo para 03-04 (la pantalla de acceso llega en 03-10; desde 03-04 el chat necesita el código de acceso).
- Seguimiento menor: el navegador pide `/favicon.ico` y recibe 404. Ninguna sección de este plan ni de la UI-SPEC cubre el favicon, así que queda para los planes de UI (03-05, 03-07) o para el endurecimiento de 03-09.
- La UI-SPEC pide que, con un 413, el texto escrito no se pierda del compositor. Hoy `app.tsx` vacía el borrador al enviar. Lo resuelve el compositor de 03-05 y 03-07.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-14*

## Self-Check: PASSED

- Los 12 archivos creados existen en disco.
- Los commits caa8f7a, 80decf8 y 5b05e6c son ancestros de HEAD.
- Los criterios de aceptación de ambas tareas se volvieron a correr y pasan.
