---
phase: 03-chat-web-api-sse-y-despliegue
plan: 26
subsystem: ui
tags: [react, dialog, abortcontroller, sse, hidratacion, presupuesto, ui-08, ui-04]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-25 obtenerSesion, estadoDesdeVista, accionDeSesion, ACCION_UI.HIDRATAR y sesion-local.ts; 03-08 ConfigResponse.presupuestoSesion; 03-07 AbortController del turno en usarChat; 03-05 ranura de acciones de AvisoError"
provides:
  - "Detener respuesta: aborta el fetch, cierra el turno sin error y rehidrata desde GET /api/sessions/:id con un solo reintento tras REINTENTO_OCUPADA_MS si la vista sigue ocupada"
  - "Recargar conversación en el AvisoError del stream cortado (ErrorVisible.accion = ACCION_AVISO.RECARGAR)"
  - "DialogoNuevaSesion (<dialog> modal destructivo) y el botón Nueva sesión del encabezado; ACCION_UI.NUEVA_SESION"
  - "AvisoSistema para turn_start con sesionExpirada; botón Empezar sesión nueva en el AvisoError de PRESUPUESTO_AGOTADO"
  - "Línea de uso del compositor desde usage.totalSesion o tokensUsados, con el tope de /api/config (usoDeSesion)"
  - "obtenerSesionAsentada en cliente-api.ts y sigueOcupada en hidratacion.ts"
affects: [03-27, verificación con Playwright del chat (Detener, recarga, Nueva sesión, 375 px)]

actuals:
  tokens: 15900
  tasks: 2
  commits: 3
plan_head_before: d7258c13572e80146a720ba46b5a8c4a5a1065b7
plan_head_after: 6071c283973372e8a59d858f7ca9f788f1fd0825

tech-stack:
  added: []
  patterns:
    - "Toda reconciliación (carga inicial, Detener, Recargar conversación) pasa por un solo efecto en useChat: el reductor pone hidratando en true y el efecto pide la vista asentada y despacha HIDRATAR. Nunca se adivina el estado del servidor"
    - "Las acciones de un aviso de error son datos del estado (ErrorVisible.accion), no texto: la línea de tiempo pinta el botón y App decide qué hace"
    - "Un turno abortado por la pantalla no despacha nada más: el despachador del turno descarta toda acción una vez que su señal se abortó"

key-files:
  created:
    - web/src/components/dialogo-nueva-sesion.tsx
    - web/src/components/dialogo-nueva-sesion.module.css
  modified:
    - web/src/state/conversacion.ts
    - web/src/state/hidratacion.ts
    - web/src/hooks/usar-chat.ts
    - web/src/api/cliente-api.ts
    - web/src/app.tsx
    - web/src/components/compositor.tsx
    - web/src/components/compositor.module.css
    - web/src/components/encabezado.tsx
    - web/src/components/encabezado.module.css
    - web/src/components/linea-de-tiempo.tsx
    - web/src/components/linea-de-tiempo.module.css
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - tests/web/conversacion.test.ts
    - tests/web/hidratacion.test.ts
    - tests/web/cliente-api.test.ts
    - docs/estructura.md

key-decisions:
  - "03-26: la carga de la sesión se mudó de App a useChat. DETENER y RECARGAR solo ponen hidratando en true y el mismo efecto de la carga inicial pide la vista, así que los tres caminos reconcilian igual"
  - "03-26: obtenerSesionAsentada reintenta una sola vez tras REINTENTO_OCUPADA_MS (1000 ms) si la vista llega ocupada; si sigue ocupada, usa esa vista sin un tercer pedido (T-03-44)"
  - "03-26: turn_start con sesionExpirada deja en pantalla solo el turno actual (re-clave 0) y descarta las tarjetas de la sesión vencida, porque el servidor ya no tiene ese historial; el texto siguiente del servidor pasa a AvisoSistema al inicio"
  - "03-26: Recargar conversación solo se ofrece si hay sessionId (un corte antes de turn_start no tiene vista que pedir)"
  - "03-26: NUEVA_SESION conserva acceso, config y borrador; olvidarSesion lo llama useChat.nuevaSesion, no el diálogo"

patterns-established:
  - "Diálogos modales: <dialog> con showModal desde un efecto sobre la prop abierto, foco inicial explícito y vuelta al disparador en onClose si sigue en el documento"

requirements-completed: [UI-08, UI-04]

coverage:
  - id: D1
    description: "Detener respuesta cierra el turno sin error, suelta las tarjetas que estaban enviando y pide la vista; HIDRATAR deja la línea de tiempo del servidor y la tarjeta abierta desaparece"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#DETENER cierra el turno sin error, suelta las tarjetas que estaban enviando y pide la vista del servidor"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#después de DETENER, HIDRATAR deja la línea de tiempo que guardó el servidor y la tarjeta abierta desaparece"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#detener no cuenta como falla del turno"
        status: pass
    human_judgment: false
  - id: D2
    description: "Una vista ocupada se pide una sola vez más tras REINTENTO_OCUPADA_MS; abortar durante la espera no repite el pedido"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/cliente-api.test.ts#una vista ocupada se pide una sola vez más, después de la espera"
        status: pass
      - kind: unit
        ref: "tests/web/cliente-api.test.ts#si sigue ocupada después del reintento, devuelve esa vista sin un tercer pedido"
        status: pass
      - kind: unit
        ref: "tests/web/cliente-api.test.ts#abortar durante la espera no repite el pedido"
        status: pass
    human_judgment: false
  - id: D3
    description: "Stream cortado sin turn_end: copia de la UI-SPEC con Recargar conversación, que rehidrata desde la vista del servidor"
    requirement: UI-04
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#FIN_STREAM sin turn_end guarda la copia de stream cortado con la acción de recargar, conserva el texto y cierra el turno"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#FIN_STREAM seguido de RECARGAR y HIDRATAR reemplaza la línea de tiempo por la vista del servidor"
        status: pass
    human_judgment: false
  - id: D4
    description: "turn_start con sesionExpirada: el texto siguiente es AvisoSistema al inicio y la sesión nueva empieza con el turno actual"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#turn_start con sesionExpirada vuelve AvisoSistema el texto siguiente del servidor, no una burbuja del agente"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#la sesión nueva empieza con el turno actual: la conversación vencida y sus tarjetas salen de la pantalla"
        status: pass
    human_judgment: false
  - id: D5
    description: "PRESUPUESTO_AGOTADO marca el aviso con Empezar sesión nueva; NUEVA_SESION vacía conversación y tarjetas y conserva acceso, config y borrador; uso de la sesión desde usage o tokensUsados, en miles, con el tope de la config"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/conversacion.test.ts#el error PRESUPUESTO_AGOTADO marca su aviso con la acción de empezar una sesión nueva"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#NUEVA_SESION vacía conversación, tarjetas, avisos y uso, y conserva acceso, config y borrador"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#usage deja el uso de la sesión en su totalSesion y mueve la marca de eventos del turno"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#HIDRATAR deja el uso de la sesión que guardó el servidor"
        status: pass
      - kind: unit
        ref: "tests/web/conversacion.test.ts#el uso de la sesión se lee en miles hacia abajo, con el tope de la config del servidor"
        status: pass
    human_judgment: false
  - id: D6
    description: "En el navegador: Detener durante un turno largo reconcilia y quita la tarjeta abierta; Nueva sesión abre el diálogo con el foco en Seguir, Esc cierra y el foco vuelve al botón; el encabezado a 1280, 800 y 375 px sin scroll horizontal; dos pestañas con la misma sesión muestran SESION_OCUPADA en la segunda"
    requirement: UI-08
    verification: []
    human_judgment: true
    rationale: "El aborto real del fetch, el foco del <dialog> nativo, el layout del encabezado y del pie del compositor a 375 px y la concurrencia entre pestañas solo se ven en el navegador; los verifica el orquestador con Playwright y el LLM falso"

duration: 9min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 26: Control de la sesión (Detener, Recargar, Nueva sesión, sesión expirada y uso) Summary

**"Detener respuesta" aborta el turno y la línea de tiempo vuelve a ser la que guardó el servidor: el reductor marca la carga, `useChat` pide `GET /api/sessions/:id` con un solo reintento a los 1000 ms si sigue ocupada, y `HIDRATAR` reemplaza turnos y tarjetas. El stream cortado ofrece "Recargar conversación" por el mismo camino. "Nueva sesión" abre un `<dialog>` modal destructivo. `turn_start` con `sesionExpirada` muestra el texto del servidor como AvisoSistema, `PRESUPUESTO_AGOTADO` ofrece "Empezar sesión nueva", y el compositor muestra "Uso de la sesión: {k} k de {max} k tokens" con el tope que manda `/api/config`.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-15T05:22:27Z
- **Completed:** 2026-10-15T05:31:14Z
- **Tasks:** 2
- **Files modified:** 21 (2 creados)

## Accomplishments

- Mientras corre un turno, el compositor cambia "Enviar mensaje" por el secundario "Detener respuesta". El `textarea` sigue editable y Enter no manda nada.
- `detener()` en `useChat` aborta el `AbortController` del turno y despacha `DETENER`. El reductor cierra el turno sin error, suelta las tarjetas que estaban "Enviando…" y, si hay `sessionId`, pone `hidratando` en true. El despachador del turno descarta todo lo que llegue después del aborto, así que un aborto pedido no deja `ERROR_RED`, `FIN_STREAM` ni eventos sueltos.
- La carga de la sesión pasó de `App` a un efecto de `useChat`. Ese efecto atiende la carga inicial, Detener y Recargar con `obtenerSesionAsentada`, que reintenta una sola vez tras `REINTENTO_OCUPADA_MS` si la vista llega `ocupada`. La vista ahora también valida `tokensUsados` y `ocupada`.
- `ErrorVisible` gana `accion` (`ACCION_AVISO.RECARGAR` o `NUEVA_SESION`). El stream cortado con sesión trae "Recargar conversación", y `PRESUPUESTO_AGOTADO` trae "Empezar sesión nueva". `LineaDeTiempo` pinta el botón en la ranura de acciones de `AvisoError`.
- `DialogoNuevaSesion` usa `showModal`, `aria-labelledby` y `aria-describedby`, y lleva la copia de la UI-SPEC. El foco arranca en "Seguir en esta sesión", Esc cierra y el foco vuelve al disparador. "Empezar sesión nueva" usa el color destructivo, solo aquí. Al confirmar, `useChat.nuevaSesion` llama `olvidarSesion` y despacha `NUEVA_SESION`.
- `turn_start` con `sesionExpirada` deja solo el turno actual y descarta las tarjetas de la sesión vencida. El texto siguiente del servidor se convierte en `avisoSesion` de tipo expirada, que `AvisoInicial` pinta como AvisoSistema al inicio de la línea de tiempo.
- `usoDeSesion` calcula `{ usados, tope }` en miles, redondeados hacia abajo, desde `tokensSesion` (que fijan `usage.totalSesion` y `tokensUsados` al hidratar) y `config.presupuestoSesion`. En el front no hay ningún tope escrito.

## Task Commits

1. **Task 1 (tracer): Detener respuesta y Recargar conversación reconcilian con el servidor**: `1d02528` (feat)
2. **Task 2 (TDD): Nueva sesión, sesión expirada, presupuesto agotado y uso**: RED `bc7d7e6` (test), GREEN `6071c28` (feat)

**Gate del tracer:** el `<verify>` automático pasó completo: 88 pruebas de conversación, hidratación y el guardián web, más `build:web` y `bun run check`. La configuración es interactiva y `end-of-phase`, y el tracer trae un `<human-check>`, así que la fila 4 del gate pedía detenerse. Seguí con la Tarea 2 porque el orquestador indicó que él hace la verificación visual después con Playwright y el LLM falso, igual que en 03-22, 03-23 y 03-25.

## TDD (Tarea 2)

- **RED (`bc7d7e6`):** se escribieron 8 pruebas nuevas o cambiadas en `tests/web/conversacion.test.ts` y una en `hidratacion.test.ts`. Para que el archivo cargara se agregó un andamio de `usoDeSesion` que devuelve null. Comando: `bun --env-file=/dev/null test tests/web/conversacion.test.ts --reporter=junit`, con exit 1: 46 pruebas, 38 pasan y 8 fallan. `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`, junit). La prueba objetivo es "turn_start con sesionExpirada vuelve AvisoSistema el texto siguiente del servidor, no una burbuja del agente".
- **Evaluación semántica:** las 8 fallas son aserciones del comportamiento planeado. `avisoSesion` llegó null porque el texto entraba como burbuja. Los turnos vencidos seguían en pantalla. `accion` del presupuesto era null. `tokensSesion` y `esperandoAvisoExpirada` no existían. `NUEVA_SESION` no hacía nada. `usoDeSesion` devolvía null. No hubo fallas de carga, de sintaxis ni de fixtures.
- **GREEN (`6071c28`):** se agregaron los campos `tokensSesion` y `esperandoAvisoExpirada`, `seguirTrasExpirar`, `recibirTexto`, `accionDelError`, el caso `USO`, `empezarSesionNueva`, `hidratar` explícito con `tokensUsados`, y `usoDeSesion`. Encima van la UI (diálogo, encabezado, compositor y App). Resultado: 2082 pruebas en verde en todo el repo. No hubo REFACTOR.

## Files Created/Modified

- `web/src/components/dialogo-nueva-sesion.tsx` y `.module.css`: el diálogo destructivo.
- `web/src/state/conversacion.ts`: `DETENER`, `RECARGAR`, `NUEVA_SESION`, el corte de stream con acción, la sesión expirada, el uso y `usoDeSesion`.
- `web/src/state/hidratacion.ts`: `tokensUsados` en `EstadoHidratado` y `sigueOcupada`.
- `web/src/api/cliente-api.ts`: `obtenerSesionAsentada` con la espera abortable, y la validación de `tokensUsados` y `ocupada`.
- `web/src/hooks/usar-chat.ts`: el efecto de carga (antes en App), `detener`, `recargar`, `nuevaSesion` y el descarte de acciones tras el aborto.
- `web/src/app.tsx`: el estado del diálogo, `alAccionDeAviso` y las props nuevas del encabezado y del compositor.
- `web/src/components/compositor.tsx` y `.module.css`: Detener, Enter inactivo durante el turno y la línea de uso (el pie ahora se envuelve).
- `web/src/components/encabezado.tsx` y `.module.css`: el botón "Nueva sesión".
- `web/src/components/linea-de-tiempo.tsx` y `.module.css`: `ErrorDelTurno` con el botón de la acción.
- `web/src/config/strings.ts` y `web/src/config/constants/ui.constants.ts`: copias, `ACCION_AVISO`, `REINTENTO_OCUPADA_MS`, `TOKENS_POR_MILES`, `EVENTO_ABORTO` y las acciones nuevas.
- `web/src/types/chat.type.ts` y `web/src/types/ui.type.ts`: tipos de las acciones, del estado y de las props.
- `tests/web/conversacion.test.ts`, `tests/web/hidratacion.test.ts`, `tests/web/cliente-api.test.ts` y `docs/estructura.md`.

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

**1. [Rule 2 - Correctitud] `obtenerSesionAsentada` y su prueba en `cliente-api.ts` y `cliente-api.test.ts` (fuera de `files_modified`)**
- **Found during:** Task 1
- **Issue:** el reintento único cuando la vista llega ocupada (T-03-44) necesita una espera abortable y leer `ocupada`, pero la validación de la vista no comprobaba ni `ocupada` ni `tokensUsados`.
- **Fix:** se agregó la validación de los dos campos, la espera que respeta la señal de aborto y cinco pruebas: un solo pedido si la vista está libre, un reintento, ningún tercer pedido, ningún reintento tras abortar y el rechazo de una vista incompleta.
- **Committed in:** `1d02528`

**2. [Rule 3 - Bloqueante] La carga de la sesión se movió de `app.tsx` a `useChat`**
- **Found during:** Task 1
- **Issue:** Detener y Recargar tenían que reusar la carga sin duplicar el efecto ni pedir la vista dos veces.
- **Fix:** el efecto vive en `useChat`. `recibirSesion` ya no sale del hook, y `ControlChat` expone `detener`, `recargar` y `nuevaSesion`.
- **Committed in:** `1d02528`

**3. [Nota] Los key_links pasan por el hook**
- "usar-chat → HIDRATAR": el hook despacha `accionDeSesion(resultado)`, que devuelve `ACCION_UI.HIDRATAR` con `estadoDesdeVista`, el mismo camino de 03-25. El literal `HIDRATAR` no aparece en `usar-chat.ts`.
- "dialogo-nueva-sesion → olvidarSesion(": quien llama `olvidarSesion()` y despacha `NUEVA_SESION` es `useChat.nuevaSesion`. El diálogo solo recibe `alConfirmar`, para que el único módulo con efectos de navegador del chat siga siendo el hook, como `olvidaLaSesion` en 03-25.

**4. [Nota] `docs/estructura.md`, `encabezado.module.css`, `linea-de-tiempo.module.css`, `hidratacion.ts`, `cliente-api.ts`, `chat.type.ts` y `ui.type.ts` no estaban en `files_modified`**, pero hacían falta para las props, los estilos, los tipos y la regla de nombrar los módulos nuevos en la documentación.

---

**Total deviations:** 2 auto-fixed (1 Rule 2, 1 Rule 3) y 2 notas.
**Impact on plan:** ninguno sobre el alcance. Son los ajustes necesarios para que los tres caminos de recarga sean uno solo y el reintento quede probado.

## Issues Encountered

None.

## Pendiente de 03-25 resuelto aquí

- El aviso de la UI-SPEC para `turn_start` con `sesionExpirada: true` quedó resuelto: el texto del servidor ya no aparece como burbuja del agente, sino como AvisoSistema al inicio de la línea de tiempo.

## Verificación pendiente (orquestador)

- Con Playwright y el LLM falso:
  1. Durante un turno largo, "Detener respuesta" debe recargar la línea de tiempo desde el servidor y hacer desaparecer la tarjeta abierta.
  2. "Nueva sesión" debe abrir el diálogo con el foco en "Seguir en esta sesión". Esc lo cierra y el foco vuelve al botón. Confirmar deja el estado vacío y borra `registro-proveedor.sesion-id`.
  3. Un id viejo con el servidor reiniciado, al mandar un mensaje, debe mostrar "La sesión anterior expiró; empezamos de cero." como aviso.
  4. Con dos pestañas en la misma sesión, la segunda debe mostrar el mensaje de sesión ocupada y seguir usable.
- Layout a 1280, 800 y 375 px: el encabezado con "Nueva sesión" y el pie del compositor con la línea de uso (que ahora se envuelve) deben dar `scrollWidth` igual al ancho del viewport. A 375 px el pie puede ocupar hasta tres filas (ayuda, uso y botón).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Listo para 03-27. El chat cubre recarga, Detener, cortes de stream, sesión vencida, presupuesto agotado y Nueva sesión, y en todos los casos termina reconciliado con el servidor.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
