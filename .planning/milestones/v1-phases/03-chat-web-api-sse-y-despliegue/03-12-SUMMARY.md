---
phase: 03-chat-web-api-sse-y-despliegue
plan: 12
subsystem: api
tags: [health, llm, decorators, hono, deepseek, resilience]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-01 registerHealthRoute/HealthResponse; 03-08 chat SSE/JSON; 03-11 despliegue en Render"
provides:
  - "ESTADO_LLM y ESTADO_LLM_TRAS_ERROR (familia registrada en G6)"
  - "createHealthMonitor y withHealthReport (llm/decorators/health-report.decorator.ts)"
  - "Agente.estadoLlm() y /api/health con { ok, provider, model, llm }"
  - "Arranque sin clave del LLM: health sin_clave y chat 503 con el texto PROVEEDOR_SIN_CLAVE"
affects: [03-13 tope diario (tope_diario y withDailyBudget por fuera), 03-17 banner de disponibilidad del LLM]

actuals:
  tokens: 8000
  tasks: 2
  commits: 3
plan_head_before: a37a135b5f2490fabee7afbef327d03d9a02ffb3
plan_head_after: 6c4411e38c8b5d5a2bb11d21ccd1091f18ce6267

tech-stack:
  added: []
  patterns:
    - "Decorador observador fuera del fallback: publica el estado en orden de finalización, ignora resultados nulos del mapa y llamadas abortadas"
    - "Composition root tolerante: PROVEEDOR_SIN_CLAVE no detiene createServer; el agente queda null y las rutas lo resuelven"

key-files:
  created:
    - src/llm/decorators/health-report.decorator.ts
    - tests/unit/health-report.decorator.test.ts
  modified:
    - src/config/constants/llm.constants.ts
    - src/llm/types/resilience.type.ts
    - src/loop/types/agente.type.ts
    - src/loop/wiring/agente.wiring.ts
    - src/http/routes/health.route.ts
    - src/http/routes/chat.route.ts
    - src/http/types/api.type.ts
    - src/http/wiring/server.wiring.ts
    - tests/architecture.test.ts
    - tests/http/salud.test.ts
    - tests/http/stream.test.ts
    - docs/estructura.md

key-decisions:
  - "withHealthReport no publica si la señal de la llamada ya está abortada, además de ignorar ABORTADO/PETICION_INVALIDA/FILTRO_CONTENIDO: withFallback puede devolver un error transitorio después de que la analista abortó, y eso no dice nada del proveedor"
  - "Sin clave, health toma provider y model de la config (config.data.primary) en vez del agente, que es null; el chat valida acceso y cuerpo antes de responder 503"

patterns-established:
  - "Rutas HTTP que dependen del agente aceptan Agente | null y estrechan a TurnDeps antes de abrir un turno"

requirements-completed: [LLM-06, API-03]

coverage:
  - id: D1
    description: "El estado del LLM observado en llamadas reales (402, caída, éxito) llega a /api/health sin llamar al modelo"
    requirement: "LLM-06"
    verification:
      - kind: integration
        ref: "tests/http/salud.test.ts#refleja el saldo agotado de la última llamada y vuelve a disponible tras una llamada exitosa"
        status: pass
      - kind: unit
        ref: "tests/unit/health-report.decorator.test.ts#recorre disponible, saldo agotado, disponible, sin cambio y no disponible según cada resultado"
        status: pass
    human_judgment: false
  - id: D2
    description: "Solo los resultados con señal mueven el estado: abortos, 400 y filtro no lo cambian; con llamadas superpuestas gana la que terminó última"
    requirement: "LLM-06"
    verification:
      - kind: unit
        ref: "tests/unit/health-report.decorator.test.ts#con dos llamadas superpuestas gana la que terminó última aunque haya empezado primero"
        status: pass
      - kind: unit
        ref: "tests/unit/health-report.decorator.test.ts#una llamada que la analista abortó no cambia el estado aunque la base devuelva un error transitorio"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/health responde 200 { ok, provider, model, llm } sin acceso, sin la clave y sin pedidos al proveedor"
    requirement: "API-03"
    verification:
      - kind: integration
        ref: "tests/http/salud.test.ts#responde ok, proveedor y modelo sin acceso, sin llamar al proveedor y sin la clave"
        status: pass
      - kind: integration
        ref: "tests/http/salud.test.ts#responde lo mismo sobre un socket real de Bun.serve"
        status: pass
    human_judgment: false
  - id: D4
    description: "Sin clave el servidor arranca: health sin_clave, chat 503 con el texto PROVEEDOR_SIN_CLAVE (401 y 400 siguen primero); una configuración inválida sigue impidiendo el arranque"
    requirement: "LLM-06"
    verification:
      - kind: integration
        ref: "tests/http/salud.test.ts#servidor sin clave del modelo"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 12: Salud del LLM y arranque sin clave Summary

**El decorador `withHealthReport` va por fuera de `withFallback` y publica el último estado del modelo (disponible, saldo_agotado o no_disponible) en orden de finalización. `/api/health` lo expone como `llm` sin llamar nunca al proveedor, y sin `LLM_API_KEY` el servidor arranca igual: health reporta `sin_clave` y el chat responde 503 con el texto del catálogo.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T01:50:29Z
- **Completed:** 2026-10-15T01:55:41Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- `ESTADO_LLM` tiene los valores `disponible`, `sin_clave`, `saldo_agotado`, `no_disponible` y `tope_diario`. `ESTADO_LLM_TRAS_ERROR` cubre cada `TIPO_ERROR_LLM` con `satisfies Record`, y `ESTADO_LLM` quedó registrado en `FAMILIAS_DE_CODIGOS` (G6).
- `createHealthMonitor` y `withHealthReport` (capa `llm`, en inglés) se componen en `modeloDelAgente` como `withHealthReport(withFallback(...), monitor)` y se exponen como `Agente.estadoLlm()`.
- `/api/health` siempre responde 200 con `ok: true`, `provider`, `model` y `llm`. No expone texto de error, estado HTTP ni clave.
- Sin clave, `createServer` ya no falla: el agente queda en `null`, health reporta `sin_clave` y `POST /api/chat`, después del acceso y de validar el cuerpo, responde 503 `{ mensaje: MENSAJE_AGENTE[PROVEEDOR_SIN_CLAVE] }` tanto en SSE como en JSON. `CONFIGURACION_LLM_INVALIDA` sigue deteniendo el arranque.

## Task Commits

1. **Task 1: Tracer, el estado del LLM observado llega a /api/health** - `02f5be0` (feat)
2. **Task 2: Arranque sin clave y solo los resultados con señal mueven el estado (TDD)**
   - RED: `a6fa951` (test)
   - GREEN: `6c4411e` (feat)
   - REFACTOR: no hizo falta.

El commit de metadata se registra al cerrar el plan.

## TDD (Task 2)

- **RED:** `bun test tests/unit/health-report.decorator.test.ts --reporter=junit` terminó con exit 1, con 14 pruebas que pasaban y 2 que fallaban. `gsd-tools check tdd-red-evidence` dio **RED_EVIDENCE_OK** (`target_test_failed`, formato junit, sin `report_errors`). Las pruebas objetivo eran "una llamada que la analista abortó no cambia el estado..." (con error transitorio y con éxito), que esperaban `disponible` y `saldo_agotado` y recibieron `no_disponible` y `disponible`. Las 5 pruebas del servidor sin clave también fallaron por la razón planeada: `createServer` lanzaba "El proveedor del modelo no tiene una clave configurada en el servidor.". **Evaluación semántica:** los objetivos se ejecutaron y fallaron en la aserción planeada. No hubo errores de carga, de sintaxis ni de fixtures.
- **GREEN:** se agregó el chequeo `options.signal.aborted` en el decorador, `Agente | null` en las rutas de health y chat, y la tolerancia a `PROVEEDOR_SIN_CLAVE` en `server.wiring.ts`. Las 28 pruebas pasan, así como la suite completa.

## Files Created/Modified

- `src/llm/decorators/health-report.decorator.ts`: monitor por closure y decorador que publica después de cada llamada.
- `src/config/constants/llm.constants.ts`: `ESTADO_LLM` y `ESTADO_LLM_TRAS_ERROR`.
- `src/llm/types/resilience.type.ts`: `LlmHealthState` y `LlmHealthMonitor`.
- `src/loop/types/agente.type.ts` y `src/loop/wiring/agente.wiring.ts`: `estadoLlm()` y la composición del decorador.
- `src/http/routes/health.route.ts`: `llm` sale de `agente.estadoLlm()`, o es `sin_clave` cuando no hay agente.
- `src/http/routes/chat.route.ts`: responde 503 sin clave, después del acceso y de validar el cuerpo.
- `src/http/types/api.type.ts`: `HealthResponse.llm`.
- `src/http/wiring/server.wiring.ts`: arranque sin clave; provider y model salen de la config.
- `tests/unit/health-report.decorator.test.ts`: transiciones, superposición y abortos.
- `tests/http/salud.test.ts`: 402, recuperación, sin clave y configuración inválida.
- `tests/architecture.test.ts`: `ESTADO_LLM` en `FAMILIAS_DE_CODIGOS`.
- `tests/http/stream.test.ts`: el agente falso implementa `estadoLlm`.
- `docs/estructura.md`: `health-report` en `llm/decorators`.

## Decisions Made

- Además de las entradas nulas del mapa, una llamada con la señal abortada no publica nada. `withFallback` devuelve el error del primario cuando la analista abortó, y un `SERVIDOR` en ese caso no debe marcar el modelo como `no_disponible`.
- Sin agente, health toma `provider` y `model` de `config.data.primary`, que son los mismos valores que el agente expondría.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El agente falso de `tests/http/stream.test.ts` no implementaba `estadoLlm`**
- **Found during:** Task 1
- **Issue:** `tsc` fallaba porque el tipo `Agente` ahora exige `estadoLlm()`.
- **Fix:** se agregó `estadoLlm: () => ESTADO_LLM.DISPONIBLE` al agente falso.
- **Files modified:** tests/http/stream.test.ts
- **Verification:** `bun run check` pasa.
- **Committed in:** 02f5be0

**2. [Rule 1 - Bug] Una llamada abortada podía publicar `no_disponible`**
- **Found during:** Task 2
- **Issue:** cuando la analista aborta después de que el primario falló con un error transitorio, `withFallback` devuelve ese error (no `ABORTADO`), y el plan solo filtraba por tipo. Eso violaba la verdad "a call aborted by the analyst never changes it".
- **Fix:** `withHealthReport` ignora el resultado si `options.signal.aborted`.
- **Files modified:** src/llm/decorators/health-report.decorator.ts
- **Verification:** las pruebas unitarias de llamadas abortadas pasan (fueron el RED de la tarea).
- **Committed in:** 6c4411e

---

**Total deviations:** 2 auto-fixed (1 de bloqueo, 1 bug)
**Impact on plan:** las dos eran necesarias para la corrección. No hay cambio de alcance.

## Issues Encountered

None.

## Threat Flags

None. Health solo agrega un valor del enum `ESTADO_LLM` (T-03-21, probado en salud.test.ts), y el plan no instaló paquetes (T-03-SC; `bun audit` está limpio).

## User Setup Required

None.

## Next Phase Readiness

- 03-13 puede envolver `withDailyBudget(...)` por fuera y publicar `tope_diario` en el mismo monitor.
- 03-17 puede leer `llm` de `/api/health` para el banner.
- No se tocó `client-ip.*` ni el limitador; el hallazgo de X-Forwarded-For de 03-11 sigue abierto y lo maneja el orquestador.
- No se hizo `git push`, así que Render no se redesplegó.

## Self-Check: PASSED

- FOUND: src/llm/decorators/health-report.decorator.ts
- FOUND: tests/unit/health-report.decorator.test.ts
- FOUND commits: 02f5be0, a6fa951, 6c4411e
- Acceptance: `withHealthReport(withFallback(` aparece 1 vez en agente.wiring.ts; `health-report` aparece en docs/estructura.md; `ESTADO_LLM` está en FAMILIAS_DE_CODIGOS; salud.test.ts afirma `ESTADO_LLM.SIN_CLAVE`; el caso de llamadas superpuestas está presente.
- Plan verification: `bun test` da 1771 pass, 1 skip y 0 fail. `bun run check` termina con exit 0.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
