---
phase: 03-chat-web-api-sse-y-despliegue
plan: 13
subsystem: api
tags: [llm, decorators, cost-cap, hono, rate-limit, resilience]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-12 ESTADO_LLM, createHealthMonitor, withHealthReport y Agente.estadoLlm()"
provides:
  - "createDailyBudget y withDailyBudget (llm/decorators/daily-budget.decorator.ts)"
  - "DailyBudget y DailyBudgetOptions (llm/types/resilience.type.ts)"
  - "AGENT_DAILY_TOKEN_BUDGET → AgentEnv.dailyTokenBudget (2 000 000 por defecto)"
  - "TIPO_ERROR_LLM.TOPE_DIARIO, CODIGO_AGENTE.TOPE_DIARIO_ALCANZADO, MENSAJE_HTTP.topeDiario(zona)"
  - "POST /api/chat responde 429 antes de abrir el turno cuando el tope está agotado; health reporta tope_diario"
  - "tests/http/topes.test.ts con el describe 'tope diario' (un bloque por defensa de costo)"
affects: [03-17 banner de disponibilidad del LLM (tope_diario), SOLUCION.md (contador en memoria)]

actuals:
  tokens: 7500
  tasks: 2
  commits: 2
plan_head_before: 804f84b0e7e920d4052cc1f24843f31b935ae448
plan_head_after: 9121d7d4bf8598e4ea6ff5e233003090981b0dc0

tech-stack:
  added: []
  patterns:
    - "Decorador de presupuesto por fuera de todo: withDailyBudget(withHealthReport(withFallback(...))) cuenta primario, respaldo y la llamada de resumen del tope de iteraciones"
    - "Clave de día inyectada (today) construida en el composition root con systemClock(TZ_NEGOCIO), nunca con el reloj fijado por FECHA_EJECUCION"

key-files:
  created:
    - src/llm/decorators/daily-budget.decorator.ts
    - tests/unit/daily-budget.decorator.test.ts
    - tests/http/topes.test.ts
  modified:
    - src/config/env.ts
    - .env.example
    - src/config/constants/llm.constants.ts
    - src/config/constants/agent.constants.ts
    - src/config/strings.ts
    - src/llm/types/resilience.type.ts
    - src/loop/wiring/agente.wiring.ts
    - src/http/routes/chat.route.ts
    - src/http/wiring/server.wiring.ts
    - tests/http/stream.test.ts
    - docs/estructura.md

key-decisions:
  - "El contador del tope diario vive en memoria y se pierde en cada reinicio o spin-down de Render; se acepta (D-73.6) y debe constar en SOLUCION.md"
  - "La zona del día y la del mensaje 429 se leen de TZ_NEGOCIO en cada uso (readToolEnv), igual que /api/config, así que el corte cae a la medianoche de negocio y no a la de UTC"
  - "El texto del agente y el del 429 comparten una sola constante base en strings.ts; el 429 agrega la zona"

patterns-established:
  - "El pre-check HTTP del tope consulta agente.estadoLlm() después del acceso, del cuerpo y de la clave, y antes de abrir el turno"

requirements-completed: [API-04, LLM-06]

coverage:
  - id: D1
    description: "Con el tope diario agotado, POST /api/chat responde 429 con la zona de negocio (JSON y SSE) sin pedir nada al proveedor, y health reporta tope_diario"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#después de un turno que agota el tope, el siguiente mensaje recibe 429 con la zona y health reporta tope_diario"
        status: pass
    human_judgment: false
  - id: D2
    description: "Los tokens del modelo de respaldo cuentan para el tope diario"
    requirement: "LLM-06"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#los tokens del modelo de respaldo también cuentan para el tope"
        status: pass
    human_judgment: false
  - id: D3
    description: "Un turno que cruza el tope entre dos llamadas termina con el error TOPE_DIARIO_ALCANZADO del catálogo y turn_end, y la sesión sigue usable después de la medianoche en TZ_NEGOCIO"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "tests/http/topes.test.ts#un turno que cruza el tope entre dos llamadas termina con el error del catálogo y turn_end, y la sesión sigue usable tras la medianoche de negocio"
        status: pass
    human_judgment: false
  - id: D4
    description: "El presupuesto se agota al alcanzar el límite, rechaza sin llamar a la base, se reinicia al cambiar el día y no cuenta errores ni abortos"
    requirement: "LLM-06"
    verification:
      - kind: unit
        ref: "tests/unit/daily-budget.decorator.test.ts#con 600 y 600 la segunda llamada pasa y la tercera se rechaza sin llamar a la base"
        status: pass
      - kind: unit
        ref: "tests/unit/daily-budget.decorator.test.ts#cuando today cambia al día siguiente el contador vuelve a cero"
        status: pass
    human_judgment: false
  - id: D5
    description: "Los topes de la fase 2 (300 000 tokens por sesión, 25 iteraciones, max_tokens, timeouts) no cambian"
    requirement: "API-04"
    verification:
      - kind: integration
        ref: "bun test tests/loop"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 13: Tope diario global de tokens Summary

**`withDailyBudget` envuelve todo el adaptador (`withDailyBudget(withHealthReport(withFallback(...)))`) y suma `entrada + salida` de cada llamada exitosa, también la del respaldo, contra `AGENT_DAILY_TOKEN_BUDGET` (2 M por defecto). El día sale de `systemClock(TZ_NEGOCIO)`, así que el contador se reinicia a la medianoche de negocio. Con el tope agotado, health reporta `tope_diario` y `POST /api/chat` responde 429 en español con la zona antes de abrir un turno. Un turno que cruza el tope a mitad termina con el error del catálogo y `turn_end`, no con un 500.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T01:58:19Z
- **Completed:** 2026-10-15T02:03:39Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- `createDailyBudget({ limit, today })` guarda en un closure el día y lo usado, y se reinicia cuando `today()` cambia. `withDailyBudget` responde `{ ok: false, tipo: TOPE_DIARIO, reintentable: false }` sin llamar a la base cuando el presupuesto está agotado, y registra el uso solo después de un resultado ok.
- `agente.wiring.ts` arma `controlDelModelo` (monitor de salud y presupuesto diario) y `estadoLlm()` devuelve `TOPE_DIARIO` mientras el presupuesto esté agotado, y si no, el estado del monitor.
- `TIPO_ERROR_LLM.TOPE_DIARIO` llega al mapa exhaustivo `CODIGO_AGENTE_POR_ERROR_LLM` (`TOPE_DIARIO_ALCANZADO`) y a `ESTADO_LLM_TRAS_ERROR` (`null`, porque el rechazo nunca llega al monitor). `MENSAJE_AGENTE` y `MENSAJE_HTTP.topeDiario(zona)` comparten la misma base de texto.
- `POST /api/chat`, después del acceso, del cuerpo y de la comprobación de clave, responde 429 `{ mensaje: "Se alcanzó el tope diario de uso del modelo. Vuelve a intentarlo después de la medianoche ({zona})." }` en JSON y en SSE.
- `AGENT_DAILY_TOKEN_BUDGET=` está en `.env.example`, y `docs/estructura.md` nombra `daily-budget`.

## Task Commits

1. **Task 1: Tracer, el tope diario gastado rechaza con 429 y health reporta tope_diario** - `d3a83b5` (feat)
2. **Task 2: El tope cuenta el respaldo, se reinicia a la medianoche de negocio y corta un turno a mitad (TDD)** - `9121d7d` (test)

El commit de metadata se registra al cerrar el plan.

## TDD (Task 2)

- **RED:** no se pudo producir. El tracer de la Task 1 ya había implementado el decorador y la composición completos, que es lo que pedía su `<action>`, así que las 10 pruebas nuevas (6 unitarias y 3 de integración, más el caso de la Task 1) pasaron al primer intento. Para no aceptar pruebas que pasan sin discriminar, se hizo una comprobación por mutación y se revirtió cada mutación sin dejar diff:
  - La clave de día con el reloj fijado (`relojVigente().hoy()`) hace fallar el caso de la medianoche de negocio.
  - La clave de día en UTC (`systemClock("UTC")`) también hace fallar ese caso: a las 04:59Z y 05:01Z UTC está en el mismo día, mientras que Lima cruza la medianoche.
  - Si `withDailyBudget` envuelve solo al primario (por dentro de `withFallback`), falla el caso de los tokens del respaldo.
- **GREEN:** sin cambios de producción en la Task 2. La suite completa pasa.
- **REFACTOR:** no hizo falta.

## Files Created/Modified

- `src/llm/decorators/daily-budget.decorator.ts`: presupuesto por closure y el decorador que rechaza antes de llamar.
- `src/llm/types/resilience.type.ts`: `DailyBudget` y `DailyBudgetOptions`.
- `src/config/env.ts` y `.env.example`: `AGENT_DAILY_TOKEN_BUDGET` → `dailyTokenBudget`.
- `src/config/constants/agent.constants.ts`: `TOPE_TOKENS_DIARIO_POR_DEFECTO`, `CODIGO_AGENTE.TOPE_DIARIO_ALCANZADO` y su entrada en el mapa.
- `src/config/constants/llm.constants.ts`: `TIPO_ERROR_LLM.TOPE_DIARIO` y su entrada `null` en `ESTADO_LLM_TRAS_ERROR`.
- `src/config/strings.ts`: el texto del agente y `MENSAJE_HTTP.topeDiario(zona)`.
- `src/loop/wiring/agente.wiring.ts`: `zonaDeNegocio`, `hoyDeNegocio`, `controlDelModelo` y `estadoDelModelo`.
- `src/http/routes/chat.route.ts`: `businessZone()` en `ChatDeps` y el 429 previo al turno.
- `src/http/wiring/server.wiring.ts`: pasa `businessZone: () => businessCalendar().zone`.
- `tests/http/stream.test.ts`: el `ChatDeps` armado a mano incluye `businessZone`.
- `tests/unit/daily-budget.decorator.test.ts` y `tests/http/topes.test.ts`: pruebas nuevas.
- `docs/estructura.md`: `daily-budget` en `llm/decorators`.

## Decisions Made

- El contador vive en memoria y se pierde en cada reinicio, redeploy o spin-down de Render. D-73.6 lo acepta, y **SOLUCION.md debe documentarlo** en la sección de costos y defensas.
- La zona se lee de `TZ_NEGOCIO` en cada uso (con `ZONA_HORARIA_POR_DEFECTO` si la config de herramientas no es válida), igual que `/api/config`. La clave de día nunca usa `FECHA_EJECUCION`.
- El 429 va después de la comprobación de clave: sin clave, el estado sigue siendo `sin_clave` y responde 503, como en 03-12.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El `ChatDeps` armado a mano en `tests/http/stream.test.ts` no tenía `businessZone`**
- **Found during:** Task 1
- **Issue:** `tsc` fallaba porque `ChatDeps` ahora exige `businessZone()`.
- **Fix:** se agregó `businessZone: () => ZONA_HORARIA_POR_DEFECTO`.
- **Files modified:** tests/http/stream.test.ts
- **Verification:** `bun run check` pasa.
- **Committed in:** d3a83b5

### Otras notas

- `src/loop/types/agente.type.ts` aparecía en `files_modified`, pero no hizo falta cambiarlo: `estadoLlm()` ya devuelve cualquier `ESTADO_LLM`, `TOPE_DIARIO` incluido.
- La zona llega a la ruta como función (`businessZone()`) y no como un texto fijo, para que el 429 siga a `TZ_NEGOCIO` igual que `/api/config`.
- La Task 2 no tuvo RED (ver la sección TDD). Se suplió con la comprobación por mutación.

---

**Total deviations:** 1 auto-fixed (de bloqueo).
**Impact on plan:** ninguno en el alcance.

## Issues Encountered

None.

## Threat Flags

None. T-03-22 (el contador nunca se reinicia) está mitigado con la clave de día desde `systemClock(TZ_NEGOCIO)` y probado con `setSystemTime` y la comprobación por mutación. T-03-23 (llamadas de respaldo fuera del tope) está mitigado porque `withDailyBudget` va por fuera de `withFallback`, y lo prueba el caso de integración del respaldo. T-03-SC: no se instalaron paquetes y `bun audit` está limpio.

## User Setup Required

None. Opcional: definir `AGENT_DAILY_TOKEN_BUDGET` en Render si se quiere un tope distinto de 2 000 000.

## Next Phase Readiness

- 03-17 puede mostrar el banner `tope_diario` leyendo `llm` de `/api/health`. El texto del banner de UI-SPEC es distinto del 429 y se arma en el front.
- No se hizo `git push`, así que Render no se redesplegó.

## Self-Check: PASSED

- FOUND: src/llm/decorators/daily-budget.decorator.ts
- FOUND: tests/unit/daily-budget.decorator.test.ts
- FOUND: tests/http/topes.test.ts
- FOUND commits: d3a83b5, 9121d7d
- Acceptance: `withDailyBudget(withHealthReport(` aparece 1 vez en agente.wiring.ts; `.env.example` tiene `AGENT_DAILY_TOKEN_BUDGET=` vacío; `docs/estructura.md` nombra `` `daily-budget` ``; `clockFromToolEnv` aparece 0 veces en el decorador; la prueba unitaria cambia `today` y el contador se reinicia.
- Plan verification: `bun test` da 1782 pass, 1 skip y 0 fail. `bun run check` termina con exit 0.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
