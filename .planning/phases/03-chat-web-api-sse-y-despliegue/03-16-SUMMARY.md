---
phase: 03-chat-web-api-sse-y-despliegue
plan: 16
subsystem: api
tags: [sse, eventos, loop, zod, pii, ui-contract]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-11 SSE con toSseFrame (el evento completo pasa por redactar); 03-14 cupos de turno y crearServidorPrueba"
  - phase: 02
    provides: "Bucle del agente con eventos tipados, compuerta de confirmación (CasoPendiente con motivos) y motivosDeBloqueo del checklist"
provides:
  - "EventoInicioHerramienta.caso y EventoFinHerramienta.caso (string | null, tomado de los argumentos ya redactados con casoDeArgumentos)"
  - "EventoFinHerramienta.resultado: ResultadoVisible | null proyectado en el servidor solo desde la respuesta JSON de la herramienta y pasado por redactar"
  - "EventoConfirmacionRequerida.bloqueosLegibles (motivosDeBloqueo sobre los motivos del caso pendiente), con bloqueos crudos sin cambios"
  - "ResultadoVisible y ConteoVisible (src/loop/types/resultado-visible.type.ts) y esquemas tolerantes por herramienta en resultado-herramienta.schema.ts"
  - "resultadoVisible(nombreVisible, respuesta) y redactarResultadoVisible(resultado, secretos) en src/loop/services/resultado-visible.service.ts"
  - "motivosDeSoportes y casoDeArgumentos exportados de despacho-llamada.service.ts"
affects: [03-19 tarjetas de herramienta, 03-20 vista de sesión, 03-21 TarjetaResultado, 03-22 ProgresoCaso, 03-23 TarjetaConfirmacion]

actuals:
  tokens: 9100
  tasks: 2
  commits: 3
plan_head_before: 5d5940e746443c67cedfb59b66c81f4cae683319
plan_head_after: d8357715f4c7d3e34935d9c26fcd4308273fcb46

tech-stack:
  added: []
  patterns:
    - "El resumen estructurado para la UI se proyecta en el servidor desde la respuesta JSON de la herramienta, con un esquema tolerante por herramienta, y nunca desde el texto del modelo"
    - "Se estrecha un valor redactado (unknown) volviendo a validarlo con su esquema zod (resultadoVisibleSchema), sin casts"
    - "Tabla Record<HERRAMIENTA, Proyectar> para que agregar una herramienta obligue (por tipos) a declarar su proyección"

key-files:
  created:
    - src/loop/types/resultado-visible.type.ts
    - src/loop/services/resultado-visible.service.ts
    - tests/unit/resultado-visible.service.test.ts
    - tests/loop/eventos-visibles.test.ts
  modified:
    - src/loop/types/evento.type.ts
    - src/loop/types/resultado-herramienta.type.ts
    - src/loop/schemas/resultado-herramienta.schema.ts
    - src/loop/services/despacho-llamada.service.ts
    - src/loop/services/paso-herramientas.service.ts
    - src/loop/services/cierre-turno.service.ts
    - docs/estructura.md
    - tests/loop/compuerta.test.ts

key-decisions:
  - "El caso de tool_start y tool_end sale de los argumentos ya redactados (casoDeArgumentos sobre el mismo valor que viaja en argumentos), no de los crudos"
  - "La respuesta de generar_formulario no trae conteo (su presentar deja solo ruta, formato y aviso), así que en la práctica el conteo de esa herramienta es null. La UI toma los contadores de mapear_campos. No se cambió lo que la herramienta le muestra al modelo"
  - "bloqueosLegibles usa exactamente motivosDeBloqueo del checklist (por ejemplo, 'ausente: Certificado de cumplimiento tributario'), así que el chat y checklist.md nombran igual los bloqueos. bloqueos sigue con los ids crudos del contrato v1"
  - "Una respuesta con ok:false, una que no valida contra su esquema o una herramienta desconocida dan resultado null. Si la redacción rompe la forma, también da null"

patterns-established:
  - "Los campos nuevos de los eventos del bucle son aditivos: las pruebas existentes comparan con expect.objectContaining y siguen pasando"

requirements-completed: []
requirements-contributed: [UI-02, UI-05, UI-08]

coverage:
  - id: D1
    description: "Cada tool_start y tool_end de un turno sobre ec-corp-andina lleva caso = ec-corp-andina"
    requirement: UI-08
    verification:
      - kind: integration
        ref: "tests/loop/eventos-visibles.test.ts#cada tool_start y cada tool_end nombran el caso que tocan"
        status: pass
    human_judgment: false
  - id: D2
    description: "tool_end trae el resultado estructurado de cada herramienta: país y formato de leer, conteo 13/1/1 de mapear, ruta y formato de generar, y bloqueo legible, listoParaFirma y ruta de armar"
    requirement: UI-05
    verification:
      - kind: integration
        ref: "tests/loop/eventos-visibles.test.ts#armar_paquete trae el bloqueo legible, el estado de firma y la ruta; el resumen crudo no cambia"
        status: pass
      - kind: unit
        ref: "tests/unit/resultado-visible.service.test.ts (co 17/0/0 listo, ec 13/1/1, hn 9/1/1 con parafiscales vencidos, pa portal con aviso, fallo y herramienta desconocida dan null)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ningún valor sensible del maestro aparece en ningún evento del turno (D-47, T-03-24)"
    requirement: UI-02
    verification:
      - kind: integration
        ref: "tests/loop/eventos-visibles.test.ts#ningún valor sensible del maestro aparece en ningún evento"
        status: pass
    human_judgment: false
  - id: D4
    description: "confirmation_required lleva bloqueos crudos y bloqueosLegibles en el mismo evento; un caso sin bloqueos lleva bloqueosLegibles []"
    requirement: UI-05
    verification:
      - kind: integration
        ref: "tests/loop/compuerta.test.ts#confirmation_required nombra sus bloqueos de forma legible sin cambiar los ids crudos"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 16: Eventos visibles para la UI Summary

**Cada evento de herramienta nombra su caso, cada tool_end trae un ResultadoVisible redactado y proyectado en el servidor desde el JSON de la herramienta (país, formato, conteo, listoParaFirma, bloqueos legibles, ruta y aviso), y confirmation_required agrega bloqueosLegibles con los nombres del checklist sin tocar los ids crudos.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-15T02:23:58Z
- **Completed:** 2026-10-15T02:29:52Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Se cumplen en el servidor los puntos 1 y 2 del contrato de datos del UI-SPEC. `tool_start` y `tool_end` traen `caso`, y `tool_end` trae `resultado`, un `ResultadoVisible` armado solo con la respuesta tipada de la herramienta. Nunca se arma desde el texto del modelo.
- `ResultadoVisible` lleva solo contadores, banderas, nombres legibles de bloqueos, rutas y el aviso de portal. Nunca lleva un valor del maestro. Pasa por `redactar` y se vuelve a validar con `resultadoVisibleSchema`.
- `confirmation_required.bloqueosLegibles` usa `motivosDeBloqueo`, el mismo texto que `checklist.md`. `bloqueos` conserva los ids crudos de los que dependen la Fase 2, la bitácora y los consumidores del contrato v1.
- La derivación de motivos de `paqueteArmado` se exportó como `motivosDeSoportes`, y la proyección la reutiliza en lugar de copiarla.

## Task Commits

1. **Tarea 1 (tracer): cada evento de herramienta nombra su caso y tool_end trae un resultado visible.** `7a8e1fd` (feat)
2. **Tarea 2 (TDD): confirmation_required con bloqueosLegibles.**
   - RED: `2e46f85` (test)
   - GREEN: `d835771` (feat)

**Plan metadata:** se registra en el commit de docs de este resumen.

## TDD Gate Compliance (Tarea 2)

- **RED:** se escribieron en `tests/loop/compuerta.test.ts` la aserción de `bloqueosLegibles` junto a `bloqueos` en el guion PRD §11 y un bloque nuevo con dos pruebas: ec-corp-andina con ambos campos en el mismo evento, y co-industrias-delta sin bloqueos con `bloqueosLegibles: []`. Corrida: `bun --env-file=/dev/null test tests/loop/compuerta.test.ts --reporter=junit` terminó con exit 1, 54 pruebas, 51 pass y 3 fail. El clasificador `check tdd-red-evidence` dio **RED_EVIDENCE_OK** (`target_test_failed`, formato junit, sin `report_errors`).
- **Evaluación semántica:** las tres fallas son justo las aserciones planeadas, porque `bloqueosLegibles` llega `undefined`. En la prueba de ec, la aserción previa sobre `bloqueos` crudos pasó y la falla está en la línea de `bloqueosLegibles`. No hubo errores de carga, de fixtures ni fallas ajenas.
- **GREEN:** `EventoConfirmacionRequerida.bloqueosLegibles` y `motivosDeBloqueo({ motivos_bloqueo: pendiente.motivos })` en `cierre-turno.service.ts`. tests/loop dio 157 pass y 0 fail.
- **REFACTOR:** no hizo falta.

## Tracer feedback gate (Tarea 1)

El modo interactivo usa `human_verify_mode: end-of-phase` y la verificación de la tarea es solo automática, así que se volvió a correr de punta a punta. `bun test tests/unit/resultado-visible.service.test.ts tests/loop/eventos-visibles.test.ts tests/loop tests/architecture.test.ts tests/sin-comentarios.test.ts` dio 244 pass y 0 fail, y `bun run check` terminó con exit 0. Pasó, así que se siguió con la Tarea 2.

## Files Created/Modified

- `src/loop/types/resultado-visible.type.ts`: `ResultadoVisible` y `ConteoVisible`.
- `src/loop/services/resultado-visible.service.ts`: `resultadoVisible` (una proyección por herramienta) y `redactarResultadoVisible`.
- `src/loop/schemas/resultado-herramienta.schema.ts`: esquemas tolerantes de la respuesta ok de cada herramienta (`formato` con `z.enum(FORMATO)`), `paqueteVisibleSchema` sobre el mismo `datosPaqueteSchema` de `armarPaqueteSchema`, y `resultadoVisibleSchema`. Todos con `satisfies`.
- `src/loop/types/resultado-herramienta.type.ts`: tipos de lectura (`SolicitudLeida`, `MapeoLeido`, `FormularioLeido`, `PaqueteVisibleLeido`, `EnvioLeido` y `DatosPaqueteLeidos`).
- `src/loop/types/evento.type.ts`: `caso` en los eventos de herramienta, `resultado` en `tool_end` y `bloqueosLegibles` en `confirmation_required`.
- `src/loop/services/paso-herramientas.service.ts`: llena `caso` desde los argumentos redactados y `resultado` con `redactarResultadoVisible(resultadoVisible(...))`.
- `src/loop/services/despacho-llamada.service.ts`: exporta `casoDeArgumentos` y `motivosDeSoportes`.
- `src/loop/services/cierre-turno.service.ts`: `bloqueosLegibles`.
- `docs/estructura.md`: nombra `resultado-visible` y `ResultadoVisible`.
- `tests/unit/resultado-visible.service.test.ts`, `tests/loop/eventos-visibles.test.ts` y `tests/loop/compuerta.test.ts`.

## Decisions Made

Están en `key-decisions`. La más relevante para los planes del front: los contadores de `TarjetaResultado` deben salir del `resultado` de `mapear_campos`, porque la respuesta de `generar_formulario` no trae `conteo`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] generar_formulario no expone conteo en su respuesta**
- **Found during:** Tarea 1, al capturar las respuestas reales de las cinco herramientas para los cuatro casos.
- **Issue:** El plan asumía que la respuesta de `generar_formulario` traía `conteo` y `aviso` (por `DatosFormulario`). El `presentar` de la herramienta solo serializa `ruta`, `formato` y `aviso` (este último solo si no es null). Con `conteo` obligatorio, el esquema habría rechazado toda respuesta real y el resultado habría quedado siempre en null.
- **Fix:** en `formularioLeidoSchema`, `conteo` es opcional y `aviso` es nullable y opcional. La proyección los deja en null si faltan. No se cambió lo que la herramienta le muestra al modelo.
- **Files modified:** src/loop/schemas/resultado-herramienta.schema.ts, src/loop/types/resultado-herramienta.type.ts
- **Verification:** `tests/loop/eventos-visibles.test.ts` comprueba el resultado real de generar (ruta y formato, conteo null), y la prueba unitaria cubre el conteo cuando sí viene.
- **Committed in:** 7a8e1fd

**2. [Rule 2 - Critical] Estrechar el resultado redactado sin cast**
- **Found during:** Tarea 1.
- **Issue:** `redactar` devuelve `unknown`, y el plan pedía volver a estrecharlo a `ResultadoVisible | null`. El proyecto no permite casts ni `any`.
- **Fix:** se agregaron `resultadoVisibleSchema` (con `satisfies z.ZodType<ResultadoVisible>`) y `redactarResultadoVisible`, que vuelve a validar el valor redactado y da null si la redacción rompió la forma.
- **Files modified:** src/loop/schemas/resultado-herramienta.schema.ts, src/loop/services/resultado-visible.service.ts
- **Committed in:** 7a8e1fd

**3. [Rule 2 - Critical] El caso sale de los argumentos redactados**
- **Found during:** Tarea 1.
- **Issue:** `casoDeLlamada` lee los argumentos crudos, y el plan pide que el caso se tome de los argumentos redactados.
- **Fix:** `casoDeArgumentos(argumentos)` exportado. `casoDeLlamada` ahora lo usa y `paso-herramientas` lo aplica sobre el mismo valor redactado que viaja en `argumentos`.
- **Files modified:** src/loop/services/despacho-llamada.service.ts, src/loop/services/paso-herramientas.service.ts
- **Committed in:** 7a8e1fd

---

**Total deviations:** 3 auto-fixed (1 bug, 2 critical).
**Impact on plan:** Ninguna amplía el alcance. Las tres sirven para que el resultado exista con las respuestas reales, sin casts y sin leer valores sin redactar.

## Issues Encountered

None.

## User Setup Required

None. No hay configuración externa.

## Next Phase Readiness

- UI-02, UI-05 y UI-08 no se marcaron como completos en REQUIREMENTS.md. Este plan solo entrega los datos del servidor, y las tarjetas, el progreso y la persistencia del `sessionId` llegan con 03-19, 03-21 y 03-22, que también listan esos requisitos. Marcarlos ahora diría que la UI existe y todavía no existe.

- 03-19, 03-21, 03-22 y 03-23 ya pueden leer `caso`, `resultado` y `bloqueosLegibles` desde los eventos SSE. `toSseFrame` serializa el evento completo, así que los campos llegan al cable sin cambios en `src/http`.
- 03-20 (vista de sesión) tendrá que decidir si guarda estos campos por turno para rehidratar las tarjetas, porque hoy el historial guarda mensajes y no eventos.
- No se hizo push. Render no se redespliega hasta que la usuaria lo decida.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
