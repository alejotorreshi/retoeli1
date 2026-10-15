---
phase: 03-chat-web-api-sse-y-despliegue
plan: 25
subsystem: ui
tags: [react, recarga, hidratacion, localstorage, confirmaciones, d-69, ui-08]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-20 GET /api/sessions/:id con la VistaSesion redactada y 404 { mensaje: TEXTO_SESION.expirada }; 03-21/03-22 resultadosPorCaso y progresoPorCaso; 03-23 reducirConfirmaciones y las tarjetas por caso"
provides:
  - "web/src/api/sesion-local.ts: leerSesionGuardada, guardarSesionId y olvidarSesion (único acceso a localStorage, solo el sessionId)"
  - "obtenerSesion(id, signal) en cliente-api.ts, con validación de la forma de la vista"
  - "web/src/state/hidratacion.ts: estadoDesdeVista(vista), accionDeSesion(resultado) y olvidaLaSesion(accion)"
  - "ACCION_UI.HIDRATAR, SESION_EXPIRADA y SESION_NO_CARGADA; estado hidratando y avisoSesion; estadoAlCargar(sesionGuardada) y sesionDelEvento(accion)"
  - "useChat expone recibirSesion; LineaDeTiempo recibe cargando y aviso; Compositor recibe bloqueado"
affects: [03-26 Detener y "Recargar conversación" (reusan obtenerSesion y recibirSesion), verificación con Playwright de la recarga]

actuals:
  tokens: 13000
  tasks: 2
  commits: 3
plan_head_before: 46597456a4b066a07c303d0cf9cf8a24a5929aca
plan_head_after: 166a2828e3c734b9191ec2b7c763172b042208c1

tech-stack:
  added: []
  patterns:
    - "La recarga reusa los reductores del vivo: estadoDesdeVista arma cada turno con las mismas formas que el stream y pliega las tarjetas con reducirConfirmaciones, así que tarjetas, resultados y progreso no pueden divergir"
    - "Los pendientes de cada turno intermedio se reconstruyen desde las llamadas correctas (armar abre, simular cierra, el texto exacto del botón Cancelar cierra); el último turno usa los pendientes vigentes del servidor, que mandan"
    - "La prueba de igualdad: un mismo guion se reproduce como eventos SSE por reducirConversacion y como VistaSesion por estadoDesdeVista, y se comparan turnos, tarjetas, resultados y progreso"

key-files:
  created:
    - web/src/api/sesion-local.ts
    - web/src/state/hidratacion.ts
    - tests/web/hidratacion.test.ts
  modified:
    - web/src/api/cliente-api.ts
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - web/src/state/conversacion.ts
    - web/src/hooks/usar-chat.ts
    - web/src/app.tsx
    - web/src/components/linea-de-tiempo.tsx
    - web/src/components/compositor.tsx
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - tests/web/conversacion.test.ts
    - docs/estructura.md

key-decisions:
  - "03-25: estadoDesdeVista no inventa eventos SSE: construye los TurnoConversacion directamente y reusa reducirConfirmaciones turno a turno, con las confirmaciones de cada turno puestas tras la última llamada, igual que cierre-turno.service emite confirmation_required"
  - "03-25: los pendientes del último turno salen de vista.pendientes (autoridad del servidor); los de turnos intermedios se reconstruyen desde las llamadas correctas y el texto exacto del botón Cancelar. Un paquete que el servidor ya no tiene pendiente y no se envió queda como Envío cancelado, no como abierto"
  - "03-25 (A7): una tarjeta resuelta cuyo turno de resolución no deja rastro (rechazo por texto) se marca en el último turno guardado en vez del turno real; el desenlace visible es el mismo"
  - "03-25: un 404 al cargar es SESION_EXPIRADA (AvisoSistema con el mensaje del servidor, sessionId null y olvidarSesion); cualquier otro rechazo o la red caída es SESION_NO_CARGADA (AvisoError) y conserva el id para seguir en la misma sesión"
  - "03-25: un 401 al cargar pide el acceso y deja hidratando en true, así que la carga se repite sola después de entrar"
  - "03-25: mientras carga, la línea de tiempo muestra IndicadorPensando con 'Cargando la conversación…' (reusa el aviso de servidor despertando a los 10 s) y el compositor queda deshabilitado (textarea y botón)"

patterns-established:
  - "Los efectos de navegador de una acción (olvidar el id) los decide un predicado puro del estado (olvidaLaSesion) y los ejecuta el hook"

requirements-completed: [UI-08, UI-03]

coverage:
  - id: D1
    description: "Tras recargar, el turno del §11 vuelve con sus cuatro tarjetas de herramienta Correctas, el texto del agente, la tarjeta de resultado con contadores, el progreso con la confirmación esperando y la tarjeta de confirmación abierta con botones"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#el turno del §11 vuelve con sus cuatro tarjetas de herramienta, Correctas, y el texto del agente"
        status: pass
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#la tarjeta de confirmación del caso pendiente vuelve abierta, con botones y sus bloqueos"
        status: pass
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#la tarjeta de resultado vuelve con sus contadores, el formato, el país y la carpeta"
        status: pass
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#el progreso del caso vuelve con cuatro etapas hechas y la confirmación esperando"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dos casos procesados y uno confirmado: turnos, tarjetas (Envío registrado y abierta), resultados y panel recargados son iguales a los que pintó el stream en vivo"
    requirement: UI-03
    verification:
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#dos casos y un envío: las tarjetas, los resultados y el panel recargados son iguales a los del vivo"
        status: pass
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#un caso enviado vuelve como Envío registrado, sin botones, en el turno donde se pidió"
        status: pass
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#una vista sin pendientes no deja ninguna tarjeta abierta"
        status: pass
    human_judgment: false
  - id: D3
    description: "Un id vencido o desconocido responde 404: AvisoSistema con el mensaje del servidor, el id se olvida y el próximo mensaje abre sesión nueva"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#un 404 al cargar deja el aviso del servidor al inicio y olvida el id: el próximo mensaje abre sesión nueva"
        status: pass
      - kind: unit
        ref: "tests/web/hidratacion.test.ts#solo el 404 pide olvidar el id guardado en el navegador"
        status: pass
    human_judgment: false
  - id: D4
    description: "localStorage solo en web/src/api/sesion-local.ts y solo con el sessionId"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/arquitectura-web.test.ts#W7: sin sessionStorage, y localStorage solo en sesion-local.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "En el navegador: procesar dos casos, confirmar uno y recargar devuelve la misma línea de tiempo, el panel y las tarjetas; durante la carga se ve 'Cargando la conversación…' con el compositor deshabilitado"
    requirement: UI-08
    verification: []
    human_judgment: true
    rationale: "La recarga real (localStorage, efecto tras el acceso, render y scroll) solo se ve en el navegador; la verifica el orquestador con Playwright y el LLM falso"

duration: 6min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 25: La conversación sobrevive a la recarga Summary

**El navegador guarda solo el `sessionId` (en `sesion-local.ts`). Al cargar, si hay uno, la línea de tiempo muestra "Cargando la conversación…" con el compositor deshabilitado, pide `GET /api/sessions/:id` y `estadoDesdeVista` pliega la vista redactada en los mismos turnos, tarjetas de herramienta, tarjetas de resultado, progreso y tarjetas de confirmación que arma el stream. Las tarjetas se pliegan con el mismo `reducirConfirmaciones` del vivo, así que los pendientes vuelven abiertos con botones y los enviados como "Envío registrado". Un id que el servidor ya no conoce (404) se avisa una vez con el texto del servidor y se olvida, y el próximo mensaje abre una sesión nueva.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-15T05:13:10Z
- **Completed:** 2026-10-15T05:19:22Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- `sesion-local.ts` es el único módulo que toca `localStorage` (`grep -rc localStorage web/src` lista solo ese archivo). Guarda el id en cada `turn_start` (`sesionDelEvento` en `usar-chat`) y nunca el código de acceso.
- `obtenerSesion` construye la ruta desde `RUTA_API.SESION` y `PARAMETRO_SESION`, valida la forma de la vista (turnos, herramientas, pendientes y enviados) antes de usarla, y devuelve el 401 como acceso vencido y el 404 como rechazo con el `mensaje` del servidor.
- `estadoDesdeVista` pasa cada `HerramientaVista` a `LlamadaDelTurno` con Correcta o Error (una llamada sin respuesta guardada queda como Error, sin resultado inventado). Reconstruye las confirmaciones de cada turno tras su última llamada y pliega las tarjetas con `reducirConfirmaciones`. El último turno usa los pendientes vigentes del servidor.
- `reducirConversacion` gana `HIDRATAR` (reemplaza sesión, turnos y tarjetas, y conserva acceso, config y borrador), `SESION_EXPIRADA` y `SESION_NO_CARGADA`. `estadoAlCargar` arranca con `hidratando: true` cuando hay un id guardado.
- `App` pide la sesión en un efecto que corre solo con el acceso concedido y la carga pendiente, y la cancela al desmontar. `LineaDeTiempo` pinta el aviso de sesión al inicio (`AvisoSistema` si venció, `AvisoError` si no se pudo cargar) y el indicador de carga en lugar del estado vacío.
- Pruebas de igualdad: el mismo guion pasa como eventos SSE por `reducirConversacion` y como vista por `estadoDesdeVista`, y se comparan turnos, tarjetas, resultados y progreso para el §11, para dos casos con un envío y para una cancelación con la tarjeta.

## Task Commits

1. **Task 1 (tracer): al recargar, la conversación y sus confirmaciones abiertas vuelven del servidor (UI-08, D-69)**: `02fc289` (feat)
2. **Task 2 (TDD): sesión vencida avisada y olvidada; tarjetas resueltas sin botones**: RED `97dd710` (test), GREEN `166a282` (feat)

**Gate del tracer:** el `<verify>` automático pasó completo (14 pruebas de hidratación más el guardián web, `build:web` y `bun run check`). La configuración es interactiva y `end-of-phase`, y el tracer trae un `<human-check>`, así que la fila 4 del gate pedía detenerse. Seguí con la Tarea 2 porque el orquestador indicó que él hace la verificación visual después con Playwright y el LLM falso, igual que en 03-10, 03-19, 03-22 y 03-23.

## TDD (Tarea 2)

- **RED (`97dd710`):** seis pruebas nuevas. El objetivo, "un 404 al cargar deja el aviso del servidor al inicio y olvida el id…", falló en su aserción planeada: `avisoSesion.tipo` llegó como `no_cargada` en lugar de `expirada`, porque el 404 se trataba como cualquier rechazo y conservaba el id. El reporte JUnit de `bun test` dio 20 pruebas, 19 en verde y 1 roja. `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`). **Evaluación semántica:** la prueba objetivo corrió y falló en la aserción del comportamiento planeado, no por carga, sintaxis o fixtures.
- Las pruebas de "Envío registrado", del pendiente abierto junto al enviado, de la vista sin pendientes, del paquete que el servidor ya no tiene pendiente y de "otro rechazo conserva el id" pasaron desde el RED. La Tarea 1 ya pliega las tarjetas con `reducirConfirmaciones`, que resuelve `REGISTRADA` por la llamada correcta a `simular_envio`. Funcionan como pruebas de caracterización, no como RED.
- **GREEN (`166a282`):** `accionDeSesion` separa el 404 (`SESION_EXPIRADA`), el reductor deja `sessionId` en null con el aviso del servidor, y `useChat` llama `olvidarSesion` cuando `olvidaLaSesion(accion)` es verdadero. Se agregó la prueba del predicado. No hubo REFACTOR.

## Files Created/Modified

- `web/src/api/sesion-local.ts`: leer, guardar y olvidar el `sessionId`, tolerando un `localStorage` no disponible.
- `web/src/api/cliente-api.ts`: `obtenerSesion` y los guardias de la vista.
- `web/src/state/hidratacion.ts`: `estadoDesdeVista`, `accionDeSesion` y `olvidaLaSesion`.
- `web/src/state/conversacion.ts`: `estadoAlCargar`, `sesionDelEvento`, y los casos `HIDRATAR`, `SESION_EXPIRADA` y `SESION_NO_CARGADA`.
- `web/src/hooks/usar-chat.ts`: estado inicial desde el id guardado, guardado del id en `turn_start`, `recibirSesion` y bloqueo del envío mientras carga.
- `web/src/app.tsx`: efecto de carga tras el acceso; pasa `cargando`, `aviso` y `bloqueado`.
- `web/src/components/linea-de-tiempo.tsx`: `AvisoInicial` y `CuerpoLinea` (carga, vacío o lista).
- `web/src/components/compositor.tsx`: prop `bloqueado` que deshabilita el textarea y el botón.
- `web/src/types/chat.type.ts` y `web/src/types/ui.type.ts`: tipos de la vista, del estado hidratado, del aviso y de las acciones nuevas.
- `web/src/config/strings.ts` ("Cargando la conversación…") y `web/src/config/constants/ui.constants.ts` (`AVISO_SESION`, `CLAVE_SESION_LOCAL` y las acciones).
- `tests/web/hidratacion.test.ts` (21 pruebas), `tests/web/conversacion.test.ts` (estado inicial con los campos nuevos) y `docs/estructura.md`.

## Decisions Made

Ver `key-decisions` en el frontmatter. Sobre la suposición A7: con la reconstrucción por turnos no se omite ninguna tarjeta que deje rastro. Los enviados vuelven como "Envío registrado" y los cancelados con el botón como "Envío cancelado" en su turno. Un paquete que el servidor dejó de tener pendiente por un rechazo escrito vuelve como "Envío cancelado", pero marcado en el último turno guardado, porque el historial no dice en qué turno se rechazó.

## Deviations from Plan

**1. [Rule 3 - Bloqueante] `compositor.tsx`, `ui.type.ts`, `conversacion.test.ts` y `docs/estructura.md` no estaban en `files_modified`**
- **Found during:** Task 1
- **Issue:** para que el compositor quede deshabilitado durante la carga hacía falta una prop nueva. Las props viven en `ui.type.ts`. La prueba del estado inicial compara con `toEqual`, así que fallaba con los campos nuevos. Y la regla del proyecto pide nombrar los módulos nuevos en `docs/estructura.md`.
- **Fix:** se agregaron la prop `bloqueado`, los tipos `PropsAvisoInicial` y `PropsCuerpoLinea`, `hidratando` y `avisoSesion` en la prueba del estado inicial, y las filas de `web/src/api` y `web/src/state` en la documentación.
- **Committed in:** `02fc289`

**2. [Nota] El key_link "app.tsx → estadoDesdeVista" pasa por `accionDeSesion`**
- `app.tsx` pide la vista y se la entrega a `recibirSesion` de `useChat`, que llama `accionDeSesion` en `hidratacion.ts`, y esa función llama `estadoDesdeVista`. Así 03-26 puede reusar `obtenerSesion` y `recibirSesion` después de Detener y en "Recargar conversación" sin repetir el mapeo.

**3. [Nota] Fallos de carga distintos del 404**
- El plan solo pedía el 404. Para no dejar a la analista con una línea de tiempo vacía sin explicación, la red caída o un rechazo distinto del 404 muestran un `AvisoError` (`TEXTO_ERROR.sinConexion` o el `mensaje` del servidor) y conservan el id, así que el próximo mensaje sigue en la misma sesión del servidor.

---

**Total deviations:** 1 auto-fixed (Rule 3) y 2 notas de diseño.
**Impact on plan:** ninguno sobre el alcance; son ajustes necesarios para que la carga deshabilite el compositor y la recarga no deje fallos mudos.

## Issues Encountered

None.

## Deferred

- La UI-SPEC también pide el `AvisoSistema` cuando `turn_start` llega con `sesionExpirada: true` (la sesión venció entre la carga y el siguiente mensaje). Este plan no lo pedía y no se tocó. Hoy el servidor ya emite `TEXTO_SESION.expirada` como un evento `text` en ese caso, así que la analista igual lo ve como mensaje del agente.

## Verificación pendiente (orquestador)

- Con Playwright y el LLM falso (`fake-llm-03-23.ts`, puerto 4023): procesar dos casos, confirmar uno y recargar. Deben volver idénticos la línea de tiempo con sus tarjetas de herramienta y de resultado, las etapas del panel y las tarjetas de confirmación (la registrada sin botones, la pendiente con botones). Durante la carga se debe ver "Cargando la conversación…" con el compositor deshabilitado. Con un id inventado en `localStorage` (`registro-proveedor.sesion-id`), al recargar debe aparecer "La sesión anterior expiró; empezamos de cero." y el id debe desaparecer.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Listo para 03-26 (Detener y "Recargar conversación"): `obtenerSesion` y `recibirSesion` ya rehidratan desde cualquier punto.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
