---
phase: 03-chat-web-api-sse-y-despliegue
plan: 20
subsystem: api
tags: [sesiones, hono, redaccion, pii, recarga, d-69]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-15 AlmacenSesiones.leer (sin crear ni renovar); 03-16 resultadoVisible y bloqueosLegibles; 03-18 accion estructurada y pendientes por caso"
provides:
  - "GET /api/sessions/:id (RUTA_API.SESION, tras requireAccess): 200 con la VistaSesion redactada o 404 { mensaje: TEXTO_SESION.expirada }"
  - "VistaSesion, TurnoVista, HerramientaVista y PendienteVista (src/loop/types/vista-sesion.type.ts) y vistaSesionSchema (src/loop/schemas/vista-sesion.schema.ts)"
  - "vistaDeSesion(sesion, ocupada, secretos) en src/loop/services/vista-sesion.service.ts"
  - "Agente.consultarSesion(id), construido solo sobre sesiones.leer"
  - "SessionViewResponse en src/http/types/api.type.ts"
  - "OpcionesAgente.ahora: el reloj inyectado del servidor llega al almacén de sesiones"
  - "resultadoDeContenido exportado de registro-herramientas.service.ts"
affects: [03-25 rehidratación de la línea de tiempo, tarjetas y confirmaciones abiertas al recargar, SOLUCION.md (API-02, T-03-28, T-03-29)]

actuals:
  tokens: 11000
  tasks: 2
  commits: 3
plan_head_before: 17f29047e1662f6ec71325ee3da9d7cfa44a856e
plan_head_after: 8086b270a0caeb589a328ac01878c05973874e23

tech-stack:
  added: []
  patterns:
    - "La vista de recarga se reconstruye desde los mensajes del historial con las mismas proyecciones que el stream en vivo (casoDeArgumentos sobre los argumentos redactados, resultadoDeContenido y resultadoVisible); no se guardan eventos"
    - "Redactar todo el objeto y volver a validarlo con su esquema zod para estrechar el unknown sin casts (igual que redactarResultadoVisible)"
    - "Emparejar cada respuesta de herramienta con la última llamada abierta del mismo turno que tiene ese llamadaId, porque los proveedores pueden repetir ids entre pasos"

key-files:
  created:
    - src/loop/types/vista-sesion.type.ts
    - src/loop/schemas/vista-sesion.schema.ts
    - src/loop/services/vista-sesion.service.ts
    - src/http/routes/sessions.route.ts
    - tests/unit/vista-sesion.service.test.ts
    - tests/http/sesiones.test.ts
  modified:
    - src/config/constants/http.constants.ts
    - src/loop/types/agente.type.ts
    - src/loop/wiring/agente.wiring.ts
    - src/loop/services/registro-herramientas.service.ts
    - src/http/types/api.type.ts
    - src/http/wiring/server.wiring.ts
    - docs/estructura.md
    - tests/http/stream.test.ts

key-decisions:
  - "03-20: la recarga se arma desde el historial de mensajes y no desde eventos guardados (la pregunta abierta de 03-16). Cada mensaje de herramienta se proyecta con resultadoDeContenido y resultadoVisible, las mismas funciones que producen el tool_end en vivo, así que la vista y el stream no pueden divergir y la sesión no guarda nada nuevo"
  - "03-20: herramienta lleva el nombre visible (proveedor_<export>), igual que tool_start y tool_end, para que 03-25 pliegue la vista en la misma línea de tiempo"
  - "03-20: una llamada sin respuesta guardada aparece con ok false, codigo, resumen y resultado null; no se omite ni se inventa un resultado"
  - "03-20: si la vista redactada no valida contra vistaSesionSchema, se devuelve solo el id, los tokens y ocupada, sin turnos, pendientes ni enviados. Nunca se devuelve un valor sin redactar"
  - "03-20: un id desconocido, vencido o mal formado y un servidor sin clave (agente null) responden todos 404 con TEXTO_SESION.expirada; el 404 no revela nada más"

patterns-established:
  - "Las lecturas de estado de sesión pasan por AlmacenSesiones.leer y nunca por abrir u ocupar"

requirements-completed: [API-02]

coverage:
  - id: D1
    description: "Tras un turno de ec-corp-andina (leer, mapear, generar, armar), GET devuelve las cuatro llamadas con llamadaId, caso, ok y resultado, el texto final y pendientes [ec] con bloqueos y bloqueosLegibles"
    requirement: API-02
    verification:
      - kind: integration
        ref: "tests/http/sesiones.test.ts#el turno trae las cuatro llamadas con su caso, su resultado y el texto final"
        status: pass
      - kind: integration
        ref: "tests/http/sesiones.test.ts#los pendientes traen ec con sus bloqueos crudos y legibles"
        status: pass
    human_judgment: false
  - id: D2
    description: "La vista no lleva el prompt de sistema, el razonamiento del modelo, valores sensibles del maestro ni los centinelas (clave LLM, código de acceso y secreto HMAC)"
    requirement: API-02
    verification:
      - kind: unit
        ref: "tests/unit/vista-sesion.service.test.ts#nunca lleva el prompt de sistema, el razonamiento del modelo ni un secreto"
        status: pass
      - kind: integration
        ref: "tests/http/sesiones.test.ts#ningún valor sensible del maestro ni centinela aparece en la vista (D-47)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Un id desconocido o mal formado responde 404 con TEXTO_SESION.expirada sin crear la sesión, y el POST siguiente con ese id recibe sesionNueva true"
    requirement: API-02
    verification:
      - kind: integration
        ref: "tests/http/sesiones.test.ts#un id desconocido responde 404 con el texto de sesión expirada y no crea la sesión"
        status: pass
    human_judgment: false
  - id: D4
    description: "Con un turno colgado que tiene el candado, GET responde enseguida con ocupada true y el último historial guardado"
    requirement: API-02
    verification:
      - kind: integration
        ref: "tests/http/sesiones.test.ts#mientras un turno tiene el candado, la lectura responde enseguida con ocupada y el último historial guardado"
        status: pass
    human_judgment: false
  - id: D5
    description: "Una lectura justo antes del TTL no lo renueva, y sin acceso la ruta responde 401"
    requirement: API-02
    verification:
      - kind: integration
        ref: "tests/http/sesiones.test.ts#leer justo antes del TTL no lo renueva: la sesión vence a su hora"
        status: pass
      - kind: integration
        ref: "tests/http/sesiones.test.ts#sin acceso responde 401 y no muestra la sesión"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 20: Vista de sesión para recargar el chat Summary

**`GET /api/sessions/:id`, tras el acceso, devuelve la conversación agrupada por mensaje de la usuaria. Cada turno trae sus llamadas a herramientas (caso, argumentos redactados, ok, código, resumen y el mismo `ResultadoVisible` del `tool_end`) y el texto final, junto con los casos pendientes y sus bloqueos legibles, los casos enviados, los tokens usados y `ocupada`. La vista no lleva mensajes de sistema ni el razonamiento del modelo, pasa por `redactar` con los tres secretos y se lee con `AlmacenSesiones.leer`, así que consultarla no crea la sesión, no renueva su TTL y no espera el candado del turno.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-15T03:01:59Z
- **Completed:** 2026-10-15T03:07:11Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- `vistaDeSesion` recorre el historial y abre un turno en cada mensaje de la usuaria. Empareja cada llamada del asistente con su mensaje de herramienta y toma como `texto` el último mensaje del asistente sin llamadas, del que lee solo `contenido`. Salta los mensajes de sistema. El archivo no menciona el razonamiento (`grep -c razonamiento` da 0).
- Los pendientes salen de `pendientesDe(sesion.compuerta)`, y `bloqueosLegibles` sale de `motivosDeBloqueo`, el mismo texto que `confirmation_required` y `checklist.md`.
- La vista completa pasa por `redactar(vista, secretos)` y se vuelve a validar con `vistaSesionSchema` (con `satisfies z.ZodType<VistaSesion>`), sin casts.
- `Agente.consultarSesion(id)` usa solo `sesiones.leer`. `registerSessionsRoute` responde 200 con la vista o 404 `{ mensaje: "La sesión anterior expiró; empezamos de cero." }`.
- `docs/estructura.md` nombra `vista-sesion` en `loop/types`, `loop/schemas` y `loop/services`, y `sessions` en `http/routes`.

## Task Commits

1. **Tarea 1 (tracer): GET /api/sessions/:id devuelve la conversación redactada con sus llamadas y pendientes.** `92b04da` (feat)
2. **Tarea 2 (TDD): leer no crea, no renueva ni espera, y un id vencido responde 404.**
   - RED: `3d2fb11` (test)
   - GREEN: `8086b27` (fix)

**Plan metadata:** se registra en el commit de docs de este resumen.

## Tracer feedback gate (Tarea 1)

El modo es interactivo con `human_verify_mode: end-of-phase`, y la verificación de la tarea es solo automática, así que se volvió a correr de punta a punta. `bun test tests/unit/vista-sesion.service.test.ts tests/http/sesiones.test.ts tests/architecture.test.ts` dio 78 pass y 0 fail, `bun run check` terminó con exit 0 y la suite completa dio 1888 pass, 1 skip y 0 fail. Pasó, así que se siguió con la Tarea 2.

## TDD Gate Compliance (Tarea 2)

- **RED:** se escribieron en `tests/http/sesiones.test.ts` cinco casos: id desconocido, id mal formado, turno colgado, TTL no renovado y sin acceso. Se corrió `bun --env-file=/dev/null test tests/http/sesiones.test.ts --reporter=junit`, que terminó con exit 1, 8 pruebas, 7 pass y 1 fail. El clasificador `check tdd-red-evidence` dio **RED_EVIDENCE_OK** (`target_test_failed`, formato junit, sin `report_errors`) sobre "leer justo antes del TTL no lo renueva: la sesión vence a su hora".
- **Evaluación semántica:** la falla está en la aserción planeada, que esperaba 404 después del TTL y recibió 200. La lectura previa en TTL−1 pasó. La causa es real y concreta: el almacén de sesiones usaba `Date.now` y no el reloj `now` que se inyecta al servidor, así que el TTL no se podía medir por HTTP. No hubo errores de carga ni fallas ajenas. Las otras cuatro pruebas pasaron desde el principio porque la Tarea 1 ya usaba solo `leer`. Por eso se comprobaron con un mutante (ver abajo).
- **GREEN:** `OpcionesAgente.ahora` llega a `createMemorySessionStore`, y `createServer` lo pasa desde `options.now`. Sin reloj inyectado sigue `Date.now`. Resultado: 32 pass en sesiones y en memory-session-store, y `bun run check` con exit 0.
- **Mutante:** un `consultarSesion` que usa `abrir` en lugar de `leer` hace fallar 4 de las 8 pruebas de `sesiones.test.ts` (id desconocido, id mal formado, turno colgado y TTL). Se revirtió.
- **REFACTOR:** no hizo falta.

## Files Created/Modified

- `src/loop/types/vista-sesion.type.ts`: `HerramientaVista`, `TurnoVista`, `PendienteVista` y `VistaSesion`.
- `src/loop/schemas/vista-sesion.schema.ts`: los esquemas de la vista, cada uno con `satisfies`.
- `src/loop/services/vista-sesion.service.ts`: `vistaDeSesion`.
- `src/loop/services/registro-herramientas.service.ts`: `resultadoDe` se exporta como `resultadoDeContenido`.
- `src/loop/types/agente.type.ts` y `src/loop/wiring/agente.wiring.ts`: `consultarSesion` y `ahora`.
- `src/config/constants/http.constants.ts`: `PARAMETRO_SESION` y `RUTA_API.SESION`.
- `src/http/routes/sessions.route.ts`, `src/http/types/api.type.ts` (`SessionViewResponse`) y `src/http/wiring/server.wiring.ts`: la ruta, registrada después de `requireAccess`, y el reloj que se pasa al agente.
- `docs/estructura.md`: nombra los módulos nuevos.
- `tests/unit/vista-sesion.service.test.ts`, `tests/http/sesiones.test.ts` y `tests/http/stream.test.ts` (agente falso).

## Decisions Made

Están en `key-decisions`. La más relevante para 03-25 es que la vista no guarda eventos. Se reconstruye desde el historial con las mismas proyecciones que el stream, así que lo que la recarga muestra coincide con lo que se vio en vivo, incluido el `herramienta` con el nombre visible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] Validar la vista redactada sin casts**
- **Found during:** Tarea 1
- **Issue:** `redactar` devuelve `unknown`, y el proyecto no permite casts ni `any`.
- **Fix:** se agregó `src/loop/schemas/vista-sesion.schema.ts`. Si la vista redactada no valida, se devuelve solo el id, los tokens y `ocupada`. Nunca se devuelve un valor sin redactar.
- **Files modified:** src/loop/schemas/vista-sesion.schema.ts, src/loop/services/vista-sesion.service.ts
- **Committed in:** 92b04da

**2. [Rule 1 - Bug] Los ids de llamada se repiten entre pasos**
- **Found during:** Tarea 1
- **Issue:** el proveedor falso, y potencialmente el real, repite ids como `call_00_0` en pasos distintos. Si se emparejaran las respuestas por id en toda la sesión, se mezclarían los resultados.
- **Fix:** cada respuesta se empareja con la última llamada abierta del mismo turno que tiene ese id. La prueba unitaria usa un id repetido a propósito.
- **Committed in:** 92b04da

**3. [Rule 3 - Blocking] Reutilizar la lectura del JSON de una herramienta**
- **Found during:** Tarea 1
- **Issue:** la lectura de ok, codigo y resumen ya existía en `registro-herramientas` como función privada.
- **Fix:** se exporta como `resultadoDeContenido` en lugar de duplicarla.
- **Committed in:** 92b04da

**4. [Rule 3 - Blocking] El agente falso de `tests/http/stream.test.ts` no compilaba**
- **Fix:** se le agregó `consultarSesion: () => null`.
- **Committed in:** 92b04da

**5. [Rule 3 - Blocking] El reloj inyectado no llegaba al almacén de sesiones**
- **Found during:** Tarea 2 (RED)
- **Issue:** la prueba del TTL no podía medir el vencimiento por HTTP.
- **Fix:** se agregó `OpcionesAgente.ahora`, que `createServer` pasa desde `options.now`. Esto toca `agente.type.ts` y `server.wiring.ts`, además de los archivos de la tarea.
- **Committed in:** 8086b27

**6. [Archivos] `PARAMETRO_SESION`**
- El nombre del parámetro de ruta es una constante, y la prueba arma la ruta desde `RUTA_API.SESION`.

---

**Total deviations:** 5 auto-fixed (1 de corrección, 1 bug y 3 de bloqueo) y 1 de archivos.
**Impact on plan:** ninguno en el alcance. Todas sirven para que la vista sea exacta, tipada y comprobable.

## Issues Encountered

None.

## Threat Flags

None nuevos. T-03-28 queda mitigado: no hay sistema ni razonamiento en la vista, por cada llamada solo van ok, codigo, resumen y resultado (más los argumentos ya redactados, con las claves `valor` enmascaradas como en `tool_start`), y la redacción usa la clave LLM, el código y el secreto HMAC. `sesiones.test.ts` busca los valores del maestro y los centinelas. T-03-29 también queda mitigado: los ids se validan con `PATRON_SESION` dentro de `leer`, la ruta exige acceso (401 probado), y `leer` nunca crea ni renueva la sesión. T-03-SC: no se instaló ningún paquete y `bun audit` está limpio.

## User Setup Required

None.

## Next Phase Readiness

- 03-25 puede pedir `GET /api/sessions/:id` al montar la página con el `sessionId` guardado y plegar `turnos[].herramientas` en las mismas tarjetas que construyen `tool_start` y `tool_end` (mismos `llamadaId`, `herramienta`, `caso` y `resultado`). `pendientes` abre las tarjetas de confirmación con `bloqueosLegibles`. Ante un 404, se muestra `mensaje` y se borra el id.
- Si `ocupada` es true, el front puede mostrar el historial guardado y avisar que hay un turno en curso.
- No se hizo push, así que Render no se redesplegó.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

- FOUND: los seis archivos creados (tipos, esquema, servicio, ruta y las dos pruebas).
- FOUND commits: 92b04da, 3d2fb11, 8086b27.
- Criterios: `grep -c razonamiento src/loop/services/vista-sesion.service.ts` da 0; `docs/estructura.md` nombra `vista-sesion` y `sessions`; `sesiones.test.ts` comprueba pendientes [ec] con `bloqueosLegibles`, `ocupada` true durante un turno colgado y 404 para un id desconocido; `consultarSesion` aparece 2 veces en `agente.wiring.ts`.
- Verificación del plan: `bun test` da 1892 pass, 1 skip y 0 fail. `bun run check` termina con exit 0 (tsc, tsc web, Biome y `bun audit` sin vulnerabilidades).
