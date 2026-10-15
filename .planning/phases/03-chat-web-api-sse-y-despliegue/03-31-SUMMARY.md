---
phase: 03-chat-web-api-sse-y-despliegue
plan: 31
subsystem: ui
tags: [vista-previa, dialogo, gap-closure, G-03-10, WR-06, UI-06, API-05, react]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: servidor con 404 (archivoNoEncontrado) y 422 (vistaPreviaNoDisponible) separados en artifacts.route.ts (WR-06), y esArchivoNoEncontrado solo para 404
provides:
  - estadoDeVistaPreviaFallida(resultado) en web/src/state/vista-previa.ts, el estado de error del diálogo con el texto según la causa
  - variante ERROR de EstadoVistaPrevia con texto
  - TEXTO_VISTA_PREVIA.errorSinConexion para la red caída
  - DialogoVistaPrevia pinta estado.texto como nodo de texto con pre-wrap
affects: [03-39, ui-spec, dialogo-vista-previa, ui-06, api-05]

actuals:
  tokens: 2400
  tasks: 2
  commits: 4
plan_head_before: 297a960b33fc6cccd0c010b25fc763c97e659050
plan_head_after: 61243a49ac1c05ffc91a0c4d977e75827bb86ea1

tech-stack:
  added: []
  patterns:
    - "El diálogo no elige textos: un reductor puro de web/src/state convierte el ResultadoFallido en el estado que se pinta"
    - "La pista de reinicio y el aviso de disco efímero quedan atados al mismo predicado (esArchivoNoEncontrado, solo 404)"

key-files:
  created:
    - web/src/state/vista-previa.ts
  modified:
    - web/src/types/chat.type.ts
    - web/src/components/dialogo-vista-previa.tsx
    - web/src/components/dialogo-vista-previa.module.css
    - web/src/config/strings.ts
    - tests/web/archivos.test.ts

key-decisions:
  - "G-03-10: el texto de error de la vista previa viaja en el estado (ERROR con texto). 404 da TEXTO_VISTA_PREVIA.error con la pista de reinicio; 422, 500, 503 y cualquier otro rechazo dan el mensaje del servidor tal cual; SIN_RED da errorSinConexion; ACCESO_VENCIDO da el mensaje del acceso (el diálogo además lleva a la pantalla de acceso)"
  - "estadoDeVistaPreviaFallida decide el 404 con esArchivoNoEncontrado, el mismo predicado que dispara alNoEncontrado, para que la pista y el aviso de disco no se separen"
  - "El párrafo de error del diálogo lleva white-space: pre-wrap porque ahora pinta un mensaje del servidor (regla del front de CLAUDE.md)"

patterns-established:
  - "Un estado de error de la UI que puede mostrar un mensaje del servidor lleva el texto en el estado, no una constante del componente"

requirements-completed: [UI-06, API-05]

coverage:
  - id: D1
    description: "Un 422 de vista previa muestra en el diálogo el mensaje del servidor, sin la pista de reinicio, y no marca el disco como borrado"
    requirement: "UI-06"
    verification:
      - kind: unit
        ref: "tests/web/archivos.test.ts#un 422 muestra el mensaje del servidor tal como llega, sin la pista de reinicio"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#ninguna causa distinta del 404 acusa un reinicio ni marca el disco como borrado"
        status: pass
    human_judgment: false
  - id: D2
    description: "Solo un 404 muestra TEXTO_VISTA_PREVIA.error con la pista de reinicio (y esArchivoNoEncontrado, que dispara el aviso de disco efímero, sigue siendo true solo con 404)"
    requirement: "UI-06"
    verification:
      - kind: unit
        ref: "tests/web/archivos.test.ts#solo un 404 muestra el texto con la pista de reinicio"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#solo un rechazo 404 cuenta como archivo borrado"
        status: pass
    human_judgment: false
  - id: D3
    description: "Red caída con su texto propio; 500 y 503 con el mensaje del servidor; acceso vencido con el mensaje del acceso; ninguno con la pista de reinicio"
    requirement: "API-05"
    verification:
      - kind: unit
        ref: "tests/web/archivos.test.ts#un fallo de red muestra su propio texto, sin la pista de reinicio"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#un 500 o un 503 muestran el mensaje del servidor"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#un acceso vencido muestra el mensaje del acceso"
        status: pass
      - kind: unit
        ref: "tests/web/archivos.test.ts#vista previa: columnas, estados, nulos, nota, carga, error y botones"
        status: pass
    human_judgment: false
  - id: D4
    description: "En el navegador (receta T05): con mapeo.json borrado, 'Ver' en formulario.pdf muestra 'Este archivo no tiene vista previa. Puedes descargarlo para revisarlo.' sin pista ni aviso de disco; con el archivo borrado (404) aparecen la pista y el aviso"
    requirement: "UI-06"
    verification: []
    human_judgment: true
    rationale: "Human-check de la tarea 2 con Playwright MCP; no se corrió en esta ejecución (human_verify_mode end-of-phase). El componente no se monta en las pruebas (sin DOM), así que el cableado efecto → estado → JSX solo se cubre por tipos, grep y build."

duration: 3min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 31: Vista previa 422 sin pista de reinicio Summary

**El diálogo de vista previa lleva la causa en su estado: un 422 muestra el mensaje del servidor, la red caída tiene su propio texto, y la pista "Si el servidor se reinició" junto con el aviso de disco efímero quedan solo para el 404 (G-03-10).**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-15T17:06:43Z
- **Completed:** 2026-10-15T17:09:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `estadoDeVistaPreviaFallida(resultado)` (nuevo, `web/src/state/vista-previa.ts`), un reductor puro sin React ni DOM. Con 404 da `TEXTO_VISTA_PREVIA.error`. Con cualquier otro RECHAZO (422, 500, 503) y con ACCESO_VENCIDO da el `mensaje` tal cual llega. Con SIN_RED da `TEXTO_VISTA_PREVIA.errorSinConexion`.
- La variante ERROR de `EstadoVistaPrevia` ahora lleva `texto`. `DialogoVistaPrevia` pinta `estado.texto` como nodo de texto y desaparece la constante `VISTA_CON_ERROR`. El efecto sigue llamando a `alVencerAcceso` (401) y a `alNoEncontrado` (solo 404), igual que antes.
- `TEXTO_VISTA_PREVIA.errorSinConexion` = "No se pudo cargar la vista previa por un problema de conexión. Inténtalo de nuevo.".
- Nuevas pruebas en `tests/web/archivos.test.ts` para 422, 404, SIN_RED, 500, 503 y acceso vencido. Otra recorre las causas distintas del 404 y comprueba que ninguna menciona un reinicio ni marca el disco como borrado.

## Task Commits

1. **Task 1: Trazador, 422 con el mensaje del servidor y 404 con la pista**
   - `b93d9c7` (test, RED)
   - `15752c7` (feat, GREEN)
2. **Task 2: Red caída y otros rechazos sin pista de reinicio**
   - `f854ea5` (test, RED)
   - `61243a4` (feat, GREEN)

**Plan metadata:** commit docs(03-31) de este SUMMARY

## Files Created/Modified

- `web/src/state/vista-previa.ts`: `estadoDeVistaPreviaFallida`, el texto del error según la causa.
- `web/src/types/chat.type.ts`: `EstadoVistaPrevia` ERROR con `texto`.
- `web/src/components/dialogo-vista-previa.tsx`: el efecto pasa todo fallo por `estadoDeVistaPreviaFallida`, y el bloque de error pinta `estado.texto`.
- `web/src/components/dialogo-vista-previa.module.css`: `.error` con `white-space: pre-wrap` y `overflow-wrap: anywhere`.
- `web/src/config/strings.ts`: `TEXTO_VISTA_PREVIA.errorSinConexion`.
- `tests/web/archivos.test.ts`: las filas por causa y la copia de `errorSinConexion`.

## Decisions Made

- El 404 se decide con `esArchivoNoEncontrado`, el mismo predicado que dispara `alNoEncontrado`. Así la pista de reinicio y el aviso de disco efímero no pueden separarse.
- ACCESO_VENCIDO muestra el mensaje del acceso en el diálogo. Igual el diálogo lleva a la pantalla de acceso con su aviso, y no se inventa un texto nuevo.
- El texto de 404 queda como estaba (lo fijan la prueba de copia y el UI-SPEC). La fila 422 del UI-SPEC la reconcilia el plan 03-39, y este plan no toca `03-UI-SPEC.md`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - CLAUDE.md] pre-wrap en el párrafo de error del diálogo**
- **Found during:** Task 1
- **Issue:** el párrafo `.error` del diálogo ahora pinta un mensaje del servidor y no tenía `white-space: pre-wrap`. CLAUDE.md exige que los mensajes del servidor se muestren como nodos de texto con pre-wrap, y lo mismo dice el must-have "El texto de error se pinta como nodo de texto de React (pre-wrap)".
- **Fix:** `white-space: pre-wrap` y `overflow-wrap: anywhere` en `.error` de `dialogo-vista-previa.module.css`, sin valores sueltos (W-rules).
- **Files modified:** web/src/components/dialogo-vista-previa.module.css (no estaba en `files_modified` del plan)
- **Verification:** `bun run check` (exit 0), `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts` en verde, `bun run build:web` (exit 0)
- **Committed in:** 15752c7

---

**Total deviations:** 1 auto-fixed (1 Rule 2)
**Impact on plan:** necesario para cumplir el must-have de pre-wrap. Sin cambio de alcance.

## Issues Encountered

- Al escribir las filas RED de la tarea 2, las de 500 y 503 ya pasaban, porque la tarea 1 ya devolvía el mensaje de cualquier RECHAZO distinto del 404. Las que estaban en rojo fueron SIN_RED, acceso vencido, la de "ninguna causa acusa un reinicio" y la copia de `errorSinConexion`.

## Verification

- Tracer (tarea 1): `bun test tests/web/archivos.test.ts` dio 29 pass y 0 fail. Corre en modo interactivo con end-of-phase y su verify es solo automated, así que siguió sin checkpoint.
- `bun test tests/web` dio 241 pass y 0 fail.
- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts` dio 38 pass y 0 fail.
- `bun run build:web` salió con exit 0, y `bun run check` (tsc, tsc web, Biome y audit) también con exit 0.
- `bun test` completo dio 2180 pass, 1 skip y 0 fail.
- No se corrió el human-check con Playwright (receta T05). Queda como D4 con `human_judgment: true` y está registrado en `.planning/WINDOWS.md` como `unrun-verify`.

## User Setup Required

None. No hace falta configurar ningún servicio externo.

## Next Phase Readiness

- G-03-10 queda cerrado en el código. Falta la verificación en el navegador (D4) al final de la fase y la reconciliación de la fila 422 del UI-SPEC (03-39).

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

- FOUND: web/src/state/vista-previa.ts
- FOUND: b93d9c7, 15752c7, f854ea5, 61243a4 (ancestros de HEAD)
