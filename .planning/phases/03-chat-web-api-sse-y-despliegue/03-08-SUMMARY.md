---
phase: 03-chat-web-api-sse-y-despliegue
plan: 08
subsystem: api
tags: [hono, config, redaccion, seguridad, env]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "requireAccess sobre /api, cookie firmada y Bearer (03-04, 03-06), ENTORNO_APP, CODIGO_PRUEBA y SECRETO_PRUEBA en el helper de pruebas"
provides:
  - "GET /api/config tras el acceso con { fechaEjecucion, zona, casos, presupuestoSesion }"
  - "Puerto ConfigSource y tipo ConfigResponse"
  - "OpcionesAgente.secretosAdicionales: el código de acceso y el secreto HMAC se redactan en el logger del agente y en DependenciasTurno.secretos"
  - ".env.example con NODE_ENV, ACCESS_*, TRUSTED_PROXY_HOPS"
  - "ENTORNO_APP en FAMILIAS_DE_CODIGOS (G6)"
affects: [03-09, 03-10, 03-11, 03-21]

actuals:
  tokens: 4492
  tasks: 2
  commits: 3
plan_head_before: 55baaa47913209b00857a0f4228bede2619b49bc
plan_head_after: b3773b29795a2497c0c76e040a9c78e2449ffc5e

tech-stack:
  added: []
  patterns:
    - "Ruta HTTP que solo consume un puerto (ConfigSource) armado en server.wiring.ts; la ruta no lee reloj, entorno ni archivos"
    - "Secretos de capas externas entran al agente por OpcionesAgente.secretosAdicionales, no por el entorno del agente"

key-files:
  created:
    - src/http/routes/config.route.ts
  modified:
    - src/config/constants/http.constants.ts
    - src/http/types/api.type.ts
    - src/http/types/server.type.ts
    - src/http/wiring/server.wiring.ts
    - src/loop/types/agente.type.ts
    - src/loop/wiring/agente.wiring.ts
    - docs/estructura.md
    - .env.example
    - tests/architecture.test.ts
    - tests/http/acceso.test.ts

key-decisions:
  - "La fecha y la zona de /api/config salen de readToolEnv() (process.env), la misma fuente que leen las herramientas y el reloj del agente, y no de envSource. Así la fecha del encabezado nunca difiere de la que usan las herramientas. Si el entorno de herramientas es inválido, se vuelve al reloj del sistema en America/Bogota, igual que relojVigente del agente."
  - "ConfigSource es una función asíncrona que se evalúa en cada pedido. Con el reloj del sistema, la fecha cambia de día sin reiniciar, y los casos reflejan el disco del momento."
  - "server.wiring arma el acceso antes de crear el agente para pasarle [ACCESS_CODE, secreto del token] como secretosAdicionales. El orden de los mensajes de error de configuración no cambia, porque accessSettings no falla."

patterns-established:
  - "Rutas de datos del servidor como puerto: registerXRoute(app, source) y el wiring construye la fuente desde infra"

requirements-completed: [UI-09, SEG-01]

coverage:
  - id: D1
    description: "GET /api/config responde la fecha efectiva, la zona, los cuatro casos y el presupuesto a un cliente con solo la cookie de acceso"
    requirement: UI-09
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#la cookie sola abre /api/config con la fecha efectiva, la zona, los casos y el presupuesto"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /api/config sin acceso responde 401"
    requirement: UI-09
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#sin acceso /api/config responde 401 con el mensaje de acceso vencido"
        status: pass
    human_judgment: false
  - id: D3
    description: "El código de acceso y el secreto HMAC que el modelo repite no aparecen en los frames SSE ni en los logs del agente"
    requirement: SEG-01
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#un mensaje con el código y el secreto, que el modelo repite en una llamada a herramienta, no los deja en frames SSE ni en logs del agente"
        status: pass
    human_judgment: false
  - id: D4
    description: ".env.example documenta las variables del servidor y ENTORNO_APP está en FAMILIAS_DE_CODIGOS"
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-14
status: complete
---

# Fase 03 Plan 08: /api/config y redacción de los secretos de acceso en el agente

**Se agregó GET /api/config, protegido por el acceso, con la fecha efectiva del reloj de negocio, la zona, los casos de los fixtures y el presupuesto de tokens por sesión. El código de acceso y el secreto HMAC ahora se redactan también en el logger y en los eventos del propio agente, vía `secretosAdicionales`.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-10-15T00:38:32Z
- **Completed:** 2026-10-15T00:46:00Z
- **Tasks:** 2
- **Files modified:** 11 (1 creado)

## Accomplishments

- `GET /api/config` (UI-09) responde `{ fechaEjecucion, zona, casos, presupuestoSesion }` desde el servidor. La ruta solo consume el puerto `ConfigSource`, y `server.wiring.ts` lo arma con `readToolEnv`/`clockFromToolEnv`, `listCases` y `AgentEnv.sessionTokenBudget`. Sin acceso responde 401 y nunca usa el reloj del navegador.
- SEG-01 (cierre parcial): `OpcionesAgente.secretosAdicionales` suma `ACCESS_CODE` y el secreto del token a la redacción del logger del agente y a `DependenciasTurno.secretos`. Antes, la línea `tool_exec` registraba sin redactar el `llamadaId` y el `herramienta` que el modelo repetía.
- `.env.example` documenta `NODE_ENV`, `ACCESS_CODE`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_TTL_HOURS`, `TRUSTED_PROXY_HOPS`, `ACCESS_MAX_FAILED_ATTEMPTS` y `ACCESS_FAILED_WINDOW_MINUTES` junto a `PORT=`, todas vacías.
- `ENTORNO_APP` quedó registrado en `FAMILIAS_DE_CODIGOS` (G6) y no apareció ninguna comparación literal que corregir.

## Task Commits

1. **Task 1 (tracer): GET /api/config (UI-09)**: `1d61083` (feat)
2. **Task 2 (TDD): secretos de acceso en la redacción del agente (SEG-01)**
   - RED: `733500e` (test)
   - GREEN: `b3773b2` (feat)

El gate del tracer se re-ejecutó (`bun test tests/http/acceso.test.ts tests/architecture.test.ts` y `bun run check`, ambos en verde), así que se verificó de punta a punta antes de expandir.

## TDD Gate Compliance

- **RED** (`733500e`): `bun --env-file=/dev/null test tests/http/acceso.test.ts --reporter=junit`. El clasificador `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`, formato junit, 34 pruebas, 1 fallida). Evaluación semántica: la prueba objetivo "un mensaje con el código y el secreto, que el modelo repite en una llamada a herramienta, no los deja en frames SSE ni en logs del agente" se ejecutó y falló en la aserción planeada (`expect(received).not.toContain(expected)` sobre las líneas de log). La línea `tool_exec` del agente llevaba `llamadaId: "call_codigo-acceso-Kp7W"` y `herramienta: "proveedor_secreto-firma-acceso-…"` sin redactar. Los frames SSE ya salían limpios porque la capa HTTP los redacta, y las aserciones previas (hay frames, hay `tool_exec` y `turn_end`) pasaron. No hubo errores de carga, de sintaxis ni de fixture.
- **GREEN** (`b3773b2`): pasan 34 pruebas en acceso.test.ts. `bun test tests/http/acceso.test.ts tests/architecture.test.ts tests/loop` da 251 pass, `bun run check` sale con 0 y la suite completa (`bun --env-file=/dev/null test`) da 1681 pass, 1 skip y 0 fail.
- **REFACTOR**: no hizo falta.

## Files Created/Modified

- `src/http/routes/config.route.ts`: `registerConfigRoute(app, source)`, que responde `ConfigResponse` sin leer reloj ni archivos.
- `src/config/constants/http.constants.ts`: `RUTA_API.CONFIG = "/api/config"`.
- `src/http/types/api.type.ts`: `ConfigResponse`.
- `src/http/types/server.type.ts`: el puerto `ConfigSource`.
- `src/http/wiring/server.wiring.ts`: `businessCalendar` y `configSource` registrados tras `requireAccess`. El acceso se arma antes del agente y le pasa `secretosAdicionales`.
- `src/loop/types/agente.type.ts`: `OpcionesAgente.secretosAdicionales?`.
- `src/loop/wiring/agente.wiring.ts`: los secretos del agente más los adicionales alimentan el logger y `DependenciasTurno.secretos`.
- `docs/estructura.md`: nombra `config` en `http/routes/`.
- `.env.example`: las siete variables nuevas del servidor.
- `tests/architecture.test.ts`: `ENTORNO_APP` en `FAMILIAS_DE_CODIGOS`.
- `tests/http/acceso.test.ts`: dos casos de `/api/config` y el caso de redacción en logs y frames.

## Decisions Made

- La fecha y la zona salen de `readToolEnv()` (process.env), que es la misma fuente de las herramientas y del reloj del agente. Si el entorno de herramientas no es válido, se usa el reloj del sistema en la zona por defecto, igual que `relojVigente`.
- `ConfigSource` se evalúa en cada pedido, no al arrancar.
- El acceso se arma antes del agente. Como `accessSettings` no falla, el orden de los mensajes de configuración inválida no cambia.

## Deviations from Plan

Ninguna. El plan se ejecutó tal como estaba escrito. La prueba de `/api/config` fija `FECHA_EJECUCION=2026-09-03` y además `TZ_NEGOCIO=America/Guayaquil` en process.env durante el pedido, para que la zona esperada no dependa del `.env` local.

Seguimiento de requisitos: `requirements.mark-complete` marcó UI-09 y SEG-01 como completos, pero este plan solo cubre la mitad del servidor de UI-09 y una parte de SEG-01. En REQUIREMENTS.md quedaron como `Partial`, con lo que falta, y sin la casilla marcada.

## Issues Encountered

Ninguno.

## User Setup Required

Ninguno. Las variables nuevas de `.env.example` se completan en Render en el plan 03-11.

## Next Phase Readiness

- El plan 03-09 puede agregar `mensajeMaximo` a `ConfigResponse`. Los planes 03-10 y 03-21 pueden leer la fecha y los casos de `GET /api/config`.
- La redacción de los secretos de acceso ya está completa en los logs HTTP, los logs del agente y los eventos, como requisito previo del despliegue público del plan 03-11.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-14*

## Self-Check: PASSED
