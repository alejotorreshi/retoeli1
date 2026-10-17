---
phase: 03-chat-web-api-sse-y-despliegue
plan: 30
subsystem: agent-loop
tags: [compuerta, cierre-turno, simular-envio, bitacora, gap-closure, G-03-26, T-03-64, T-03-49]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: casoDeArgumentos/casoDeLlamada normalizados por PATRON_CASO (03-28); DESENLACE_ENVIO.SIN_CASO, TEXTO_ENVIO_NO_REGISTRADO y cierreDelTurno (03-29)
provides:
  - EntradaDesenlaces = EntradaCierreCompuerta & { enviosSinCaso }
  - desenlacesDeEnvio agrega un solo SIN_CASO al final cuando hubo simular_envio sin caso legible y el turno no se abortó
  - cerrarCompuerta cuenta en turno.llamadas los simular_envio con caso null y ok false (enviosSinCaso)
  - anotarHerramienta registra en gate_permit y gate_blocked el caso normalizado de la llamada (casoDeLlamada)
  - Escenarios A y D por el respaldo JSON y el escenario A por SSE en tests/http/chat.test.ts
affects: [compuerta, cierre-turno, bitacora, respuesta-turno, sse, ui-04, api-01, seg-01]

actuals:
  tokens: 5300
  tasks: 2
  commits: 3
plan_head_before: 47e832e5199efc3ba33db03b8d74477d0c137486
plan_head_after: f2028def8fc6bebf38287973c42727b705276a10

tech-stack:
  added: []
  patterns:
    - "Los envíos sin caso legible no tienen evento de compuerta; se cuentan en turno.llamadas al cerrar y entran a la política como un número, no como eventos"
    - "La bitácora de la compuerta registra el caso que pasó PATRON_CASO, sin depender de que tenga paquete armado"

key-files:
  created: []
  modified:
    - src/domain/types/compuerta.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/loop/types/turno.type.ts
    - src/loop/services/guardado-turno.service.ts
    - src/loop/services/bitacora-turno.service.ts
    - src/loop/services/paso-herramientas.service.ts
    - tests/unit/compuerta.policy.test.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/http/chat.test.ts

key-decisions:
  - "G-03-26 (parte 2): un proveedor_simular_envio sin caso legible ({}, número, \"\", \"../x\" o sin la clave caso) agrega el aviso SIN_CASO una sola vez por turno, después de los avisos de los casos legibles y antes de la pregunta del servidor; un turno abortado no lo agrega"
  - "gate_permit y gate_blocked registran casoDeLlamada (caso normalizado por PATRON_CASO o null), así la auditoría nombra el caso bloqueado aunque no tenga paquete en la sesión (T-03-49)"
  - "HerramientaAnotada deja de cargar los paquetes conocidos, que solo usaba el helper borrado casoConocido"

patterns-established:
  - "desenlacesDeEnvio = desenlaces de los casos legibles (pliegue de eventos) + SIN_CASO agregado; cierre-turno.service.ts no cambia porque EntradaCierreTurno ya cumple EntradaDesenlaces"

requirements-completed: [UI-04, API-01, SEG-01]

coverage:
  - id: D1
    description: "Escenario D (G-03-26): simular_envio sin caso legible termina con el texto del modelo, un párrafo y el aviso SIN_CASO, sin confirmation_required, needsConfirmation false y sin ENVIO-SIMULADO.md"
    requirement: "UI-04"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#escenario D: simular_envio con %j no indica un caso legible y la afirmación del modelo sale seguida del aviso SIN_CASO ({}, {caso: 7}, {caso: \"\"}, {caso: \"../x\"}, {confirmado: true})"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#escenario D: dos simular_envio sin caso legible en el mismo turno dejan el aviso SIN_CASO una sola vez"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#escenario D: el aviso SIN_CASO va después de los avisos de los casos legibles y antes de la pregunta del servidor"
        status: pass
    human_judgment: false
  - id: D2
    description: "desenlacesDeEnvio: con enviosSinCaso 0 da lo mismo que en 03-29, con 2 agrega un solo SIN_CASO al final y con abortado da []"
    requirement: "API-01"
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#desenlacesDeEnvio (G-03-26, D-44, D-63.4, D-63.7)"
        status: pass
    human_judgment: false
  - id: D3
    description: "gate_blocked registra el caso legible (escenario A: co-industrias-delta) o null sin caso legible (escenario D); gate_permit conserva su caso"
    requirement: "SEG-01"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#T-03-49: la línea gate_blocked nombra el caso legible de la llamada"
        status: pass
      - kind: e2e
        ref: "HTTP local_stack (scratch copy, LLM falso, NODE_ENV=production, puerto 3030): gate_blocked con caso co-industrias-delta"
        status: pass
    human_judgment: false
  - id: D4
    description: "Por HTTP: POST /api/chat con Accept JSON responde los escenarios A y D con el aviso como último párrafo y needsConfirmation false; por SSE el text final antes de turn_end termina con el aviso SIN_PAQUETE"
    requirement: "API-01"
    verification:
      - kind: integration
        ref: "tests/http/chat.test.ts#G-03-26: el aviso de un envío que no ocurrió llega por el respaldo JSON y por SSE"
        status: pass
      - kind: e2e
        ref: "Receta T24 por HTTP local_stack: 'Sí, envía co-industrias-delta' por JSON y por SSE termina con el aviso SIN_PAQUETE, needsConfirmation false y sin ENVIO-SIMULADO.md"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 30: Aviso SIN_CASO y bitácora de la compuerta con el caso Summary

**Un proveedor_simular_envio sin caso legible ahora deja el aviso determinista SIN_CASO al cierre del turno, contado en turno.llamadas porque no tiene evento de compuerta. Las líneas gate_permit y gate_blocked registran el caso normalizado por PATRON_CASO, y el aviso se comprueba por el respaldo JSON y por SSE.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T17:11:16Z
- **Completed:** 2026-10-15T17:16:33Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Escenario D de G-03-26 cerrado. Con `{}`, `{caso: 7}`, `{caso: ""}`, `{caso: "../x"}` o `{confirmado: true}`, la respuesta es el texto del modelo, un párrafo y "No se registró ningún envío simulado: el pedido no indicó un caso válido.", sin confirmation_required y con needsConfirmation false.
- El aviso SIN_CASO sale una sola vez por turno. Va después de los avisos de los casos legibles (en el mismo párrafo) y antes de la pregunta del servidor. Un turno abortado no lo agrega, y uno sin intentos sin caso deja el texto de 03-29 sin cambios.
- La bitácora de la compuerta nombra el caso bloqueado: el escenario A da `caso: "co-industrias-delta"` y el D da `caso: null`. gate_permit sigue con su caso.
- Por HTTP, los escenarios A y D llegan por el respaldo JSON con el aviso como último párrafo de `reply`. El escenario A llega por SSE con el aviso en el text final, antes de turn_end.

## Task Commits

1. **Task 1: Trazador, escenario D** - `7ba9e19` (feat)
2. **Task 2: gate_blocked con el caso y el aviso por JSON y SSE.** RED `8958b41` (test), GREEN `f2028de` (feat). No hizo falta refactor.

**Plan metadata:** commit docs(03-30) de este SUMMARY

## TDD Gate Compliance (Task 2)

- **RED** `8958b41`: fallan 2 pruebas, ambas de la bitácora (T-03-49), y ninguna por un error de carga. `gsd-tools check tdd-red-evidence` sobre el reporte JUnit de `bun test tests/loop/compuerta-casos.test.ts --reporter=junit` devolvió `RED_EVIDENCE_OK` (target_test_failed; 58 tests, 2 fail). En la evaluación semántica, el objetivo "escenario A: un caso legible sin paquete en la sesión queda registrado en gate_blocked" esperaba `caso: "co-industrias-delta"` y recibió `caso: null`, que es el motivo planeado.
- Las pruebas HTTP ya pasaban en RED, porque el aviso llega por `respuestaDeTurno` y por los frames SSE desde 03-29 y la tarea 1. Fijan el contrato y no exigen código nuevo.
- **GREEN** `f2028de`: `anotarHerramienta` usa `casoDeLlamada`. La suite completa queda en 2196 pass y 0 fail.

## Tracer gate (Task 1)

Modo interactivo con `human_verify_mode` end-of-phase y un verify solo automatizado. Se volvió a correr `bun test tests/unit/compuerta.policy.test.ts tests/loop/compuerta-casos.test.ts` (139 pass, 0 fail) y se siguió con la tarea 2, sin checkpoint.

## Files Created/Modified

- `src/domain/types/compuerta.type.ts`: `EntradaDesenlaces`.
- `src/domain/policies/compuerta.policy.ts`: `desenlacesDeCasos` (el pliegue de 03-29) y `desenlacesDeEnvio(entrada: EntradaDesenlaces)`, que le agrega SIN_CASO.
- `src/loop/types/turno.type.ts`: `EntradaCierreTurno.enviosSinCaso`. `HerramientaAnotada` pierde `conocidos`.
- `src/loop/services/guardado-turno.service.ts`: `enviosSinCaso(turno)` y su paso a `cerrarTurnoConCompuerta`.
- `src/loop/services/bitacora-turno.service.ts`: `casoDeLlamada` en gate_permit y gate_blocked. Se borró `casoConocido` y los imports que quedaron sin uso.
- `src/loop/services/paso-herramientas.service.ts`: la llamada a `anotarHerramienta` ya no pasa `conocidos`.
- `tests/unit/compuerta.policy.test.ts`: el armador `cierre` devuelve `EntradaDesenlaces` con `enviosSinCaso: 0`, más 4 filas de SIN_CASO.
- `tests/loop/compuerta-casos.test.ts`: el escenario D (5 variantes de argumentos, aviso una vez, orden con aviso legible y pregunta) y T-03-49 con `capturarLogs`.
- `tests/http/chat.test.ts`: los escenarios A y D por JSON y el A por SSE, cada uno sobre un proyecto temporal limpio.

## Decisions Made

- Una llamada cuenta como envío sin caso legible cuando es de `HERRAMIENTA.SIMULAR_ENVIO`, con caso null y ok false. Una con caso null y ok true no puede darse, porque `despacharEnvio` nunca autoriza sin caso.
- El aviso SIN_CASO no repite los argumentos que mandó el modelo. Solo dice que el pedido no indicó un caso válido.
- `cierre-turno.service.ts`, `needsConfirmation`, `eventosConfirmacion`, `TEXTO_ENVIO_NO_REGISTRADO` y `agent/prompt.md` no cambian.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Se quitó un campo que dejó de usarse en HerramientaAnotada**
- **Found during:** Task 2 (GREEN)
- **Issue:** al borrar `casoConocido`, `HerramientaAnotada.conocidos` y el argumento `conocidos: turno.conocidos` de `paso-herramientas.service.ts` quedaron como datos muertos.
- **Fix:** se quitó el campo del tipo y de la llamada. Los dos archivos (`src/loop/types/turno.type.ts` y `src/loop/services/paso-herramientas.service.ts`) no estaban en la lista de la tarea 2.
- **Files modified:** src/loop/types/turno.type.ts, src/loop/services/paso-herramientas.service.ts
- **Verification:** `bun run check` sale con código 0 y `bun test` da 2196 pass.
- **Committed in:** f2028de

**2. [Rule 2 - Missing Critical] El escenario D también cubre `{confirmado: true}`, sin la clave caso**
- **Found during:** Task 1
- **Issue:** el plan lista `{}`, número, `""` y `"../x"`. El pedido real del modelo suele ser `{confirmado: true}` sin caso.
- **Fix:** se agregó como quinta variante del `test.each`, y es el guion del escenario D por HTTP.
- **Files modified:** tests/loop/compuerta-casos.test.ts, tests/http/chat.test.ts
- **Committed in:** 7ba9e19, 8958b41

---

**Total deviations:** 2 auto-fixed (1 de limpieza, 1 de cobertura).
**Impact on plan:** sin cambio de alcance.

## Issues Encountered

- Biome reformateó `tests/loop/compuerta-casos.test.ts` antes de cada commit. Se corrió `biome check --write` y se leyó el código de salida de `bun run check` (0) en cada tarea.
- La prueba JSON esperaba el objeto exacto y no tenía en cuenta `sessionId`. Se agregó `sessionId: expect.any(String)` antes del commit RED.

## Verification

- `bun test`: 2196 pass, 1 skip (live), 0 fail.
- `bun run check` (tsc, tsc web, Biome y bun audit): código 0.
- `bun test tests/architecture.test.ts tests/sin-comentarios.test.ts`: 79 pass.
- `bun test tests/loop/compuerta-casos.test.ts tests/http/chat.test.ts tests/seguridad/clave.test.ts`: 73 pass.
- Receta T24 por HTTP, con una copia scratch, LLM falso y el servidor en NODE_ENV=production en el puerto 3030. `POST /api/chat {"sessionId":null,"message":"Sí, envía co-industrias-delta"}` con Accept JSON devuelve un reply que termina con el aviso SIN_PAQUETE, needsConfirmation false y ningún ENVIO-SIMULADO.md en `out/`. La línea de log es `gate_blocked` con `"caso":"co-industrias-delta"`. Por SSE, el último `event: text` antes de `turn_end` trae el aviso.
- Criterios de aceptación: `enviosSinCaso` está en los 4 archivos, `desenlacesDeEnvio(entrada)` sigue en `cierre-turno.service.ts` y `casoConocido` ya no aparece en `bitacora-turno.service.ts`.
- `agent/prompt.md` y `reto-01/` sin cambios.

## User Setup Required

None. No hace falta configurar servicios externos.

## Next Phase Readiness

- G-03-26 queda cerrado junto con 03-29: todo simular_envio que no terminó ENVIADO, con o sin caso legible, deja su aviso, y la prosa del modelo no se toca.
- Sigue abierto el supuesto D6 de 03-29: que el aviso se lea como lenguaje claro en la UI. Se revisa en el navegador al final de la fase.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

- Commits 7ba9e19, 8958b41 y f2028de presentes en HEAD.
- Archivos modificados presentes; `bun test` 2196 pass / 0 fail y `bun run check` en verde.
