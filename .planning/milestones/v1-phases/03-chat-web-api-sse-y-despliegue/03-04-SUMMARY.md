---
phase: 03-chat-web-api-sse-y-despliegue
plan: 04
subsystem: api
tags: [hono, cookie-hmac, setSignedCookie, timingSafeEqual, zod, acceso, seguridad]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "createServer/startServer, registerChatRoute, toSseFrame con secretos, helper crearServidorPrueba (03-01 y 03-02)"
provides:
  - "POST /api/acceso: código comparado en tiempo constante y cookie `acceso` firmada con HMAC (v1.<vence en ms>), HttpOnly, SameSite=Strict, Path=/api, Max-Age según ACCESS_TOKEN_TTL_HOURS y Secure salvo en desarrollo"
  - "requireAccess: guardia de todo /api salvo health y acceso; acepta la cookie firmada y vigente o Authorization: Bearer <ACCESS_CODE>"
  - "issueAccessToken / isAccessTokenValid con reloj inyectado (ServerOptions.now)"
  - "Env NODE_ENV, ACCESS_CODE, ACCESS_TOKEN_SECRET y ACCESS_TOKEN_TTL_HOURS en serverEnvSchema"
  - "El código y el secreto se suman a los secretos que se redactan en los frames SSE, en el JSON y en el logger http"
  - "Helper de pruebas: CODIGO_PRUEBA, SECRETO_PRUEBA, ENTORNO_SERVIDOR_PRUEBA y Bearer por defecto en cabecerasPrueba"
affects: [03-06, 03-08, 03-09, 03-10, 03-11]

actuals:
  tokens: 10500
  tasks: 2
  commits: 3

plan_head_before: 75f9b4a5bcd986ccc7a92c6338c4e5999db72eca
plan_head_after: afa6d7d37d405ecbd91c1e1968caf3195c863f03

tech-stack:
  added: []
  patterns:
    - "Guardia de acceso registrada con app.use(RUTA_API_PROTEGIDA) después de health y acceso: los handlers públicos responden antes y el resto de /api pasa por requireAccess"
    - "Vencimiento dentro del valor firmado y comparado en el servidor como milisegundos enteros, porque getSignedCookie no aplica Max-Age"
    - "Pruebas que necesitan reloj o NODE_ENV arman el servidor con createServer directo y ENTORNO_SERVIDOR_PRUEBA"

key-files:
  created:
    - src/http/routes/access.route.ts
    - src/http/middlewares/access.middleware.ts
    - src/http/services/access-token.service.ts
    - src/http/schemas/access-body.schema.ts
    - tests/http/acceso.test.ts
    - tests/unit/access-token.service.test.ts
  modified:
    - src/config/env.ts
    - src/config/constants/http.constants.ts
    - src/config/constants/runtime.constants.ts
    - src/config/strings.ts
    - src/http/types/api.type.ts
    - src/http/types/server.type.ts
    - src/http/wiring/server.wiring.ts
    - tests/helpers/servidor-prueba.helper.ts
    - docs/estructura.md

key-decisions:
  - "ACCESS_CODE es obligatorio en todos los entornos (12 a 256 caracteres) y NODE_ENV vale production por defecto, así que un despliegue sin NODE_ENV exige el secreto"
  - "ACCESS_TOKEN_SECRET (32+ caracteres) no puede repetir ACCESS_CODE (refinamiento en env.ts) ni la clave del modelo (chequeo en server.wiring.ts): el servidor no arranca"
  - "isAccessTokenValid exige exactamente dos partes, la versión v1 y un vencimiento entero canónico (String(Number(x)) === x) mayor que ahora"
  - "El cuerpo de /api/acceso se recorta (trim) antes de comparar, para tolerar un código pegado con espacios"
  - "ACCESS_TOKEN_TTL_HOURS tiene tope de 168 h (VIGENCIA_ACCESO_HORAS_TOPE)"

patterns-established:
  - "Bearer por defecto en cabecerasPrueba: toda prueba HTTP nueva pasa la guardia sin código extra; las pruebas sin acceso usan app.request con sus propias cabeceras"

requirements-completed: [API-04, SEG-01]

coverage:
  - id: D1
    description: "POST /api/acceso: código errado 401 con codigoInvalido, cuerpo inválido 400 y código correcto 204 con cookie firmada HttpOnly, SameSite=Strict, Path=/api, Max-Age=43200 y Secure, sin el código en el valor"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#POST /api/acceso (D-72)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Guardia de /api: sin acceso 401 accesoVencido en /api/chat y en rutas desconocidas, health 200, Bearer correcto abre y Bearer errado no, la cookie sola abre /api/chat"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#guardia de acceso sobre /api (D-72)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cookie adulterada, sin firma o firmada con otro secreto responde 401; 1 ms después del vencimiento y en el vencimiento 401, 1 ms antes 200; TTL configurable"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#cookies adulteradas o ajenas (D-72, T-03-10)"
        status: pass
      - kind: integration
        ref: "tests/http/acceso.test.ts#vencimiento en milisegundos enteros del servidor (API-04)"
        status: pass
      - kind: unit
        ref: "tests/unit/access-token.service.test.ts#isAccessTokenValid"
        status: pass
    human_judgment: false
  - id: D4
    description: "Producción sin secreto o sin código no arranca con mensaje en español; secreto repetido con el código o la clave del modelo no arranca; Secure en producción y ausente en desarrollo con secreto efímero"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#configuración del acceso que falla cerrada (D-72)"
        status: pass
    human_judgment: false
  - id: D5
    description: "CODIGO_PRUEBA y SECRETO_PRUEBA no aparecen en ningún body, cabecera ni frame SSE, aunque el modelo los repita"
    requirement: SEG-01
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#el código y el secreto no salen en ningún body, cabecera ni frame SSE (SEG-01)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 04: Acceso con código compartido y cookie firmada Summary

**La API queda cerrada tras un código compartido: `POST /api/acceso` lo compara en tiempo constante y entrega una cookie HMAC `acceso=v1.<vence en ms>` (HttpOnly, SameSite=Strict, Path=/api, 12 h). Todo `/api` salvo health exige esa cookie vigente o `Bearer <código>`, y producción no arranca sin sus secretos.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-14T23:58:28Z
- **Completed:** 2026-10-15T00:06:48Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Tracer D-72 de punta a punta. El código se envía una vez y la cookie firmada abre `/api/chat`. Sin acceso todo `/api` responde 401 con `accesoVencido`, y health sigue público.
- Falla cerrado ante una cookie adulterada, sin firma, de otro secreto o vencida. El vencimiento se compara como milisegundos enteros, con precisión de 1 ms.
- Configuración segura. En producción (el valor por defecto) faltar `ACCESS_TOKEN_SECRET` o `ACCESS_CODE` detiene el arranque con un mensaje en español. En desarrollo el secreto efímero es de 256 bits y la cookie va sin `Secure`.
- SEG-01 (mitad http): el código y el secreto se redactan en SSE, en el JSON y en el logger http. La prueba lo demuestra con un modelo falso que los repite.

## Task Commits

1. **Task 1: Tracer del código, la cookie firmada y la guardia de /api** - `33a826f` (feat)
2. **Task 2: Acceso adulterado, vencido o mal configurado falla cerrado** - RED `ad667f2` (test), GREEN `afa6d7d` (feat)

## Files Created/Modified

- `src/http/routes/access.route.ts`: `registerAccessRoute`. Valida el cuerpo estricto, compara con `timingSafeEqual` y emite la cookie con `setSignedCookie`.
- `src/http/middlewares/access.middleware.ts`: `requireAccess`. Acepta un Bearer en tiempo constante o `getSignedCookie` seguido de `isAccessTokenValid(valor, now())`.
- `src/http/services/access-token.service.ts`: `issueAccessToken` e `isAccessTokenValid`, puros y con el reloj inyectado.
- `src/http/schemas/access-body.schema.ts`: `accessBodySchema` (`{ codigo }` estricto, con largo máximo).
- `src/http/types/api.type.ts`, `src/http/types/server.type.ts`: `AccessBody`, `AccessSettings` y `ServerOptions.now`.
- `src/http/wiring/server.wiring.ts`: `accessSettings`, el secreto efímero, el chequeo de secreto repetido, el orden health → acceso → `app.use(/api/*, requireAccess)` → chat, y los secretos ampliados.
- `src/config/env.ts`: `NODE_ENV`, `ACCESS_CODE`, `ACCESS_TOKEN_SECRET` y `ACCESS_TOKEN_TTL_HOURS`, con refinamientos.
- `src/config/constants/http.constants.ts`, `runtime.constants.ts` y `strings.ts`: `ENTORNO_APP`, `RUTA_API.ACCESO`, los nombres y largos del token y la cookie, `MS_POR_HORA`, `MENSAJE_HTTP.codigoInvalido`, `accesoVencido` y `cuerpoAccesoInvalido`, y los mensajes de `TEXTO_ENV`.
- `tests/helpers/servidor-prueba.helper.ts`: `CODIGO_PRUEBA`, `SECRETO_PRUEBA`, `ENTORNO_SERVIDOR_PRUEBA` y Bearer por defecto.
- `tests/http/acceso.test.ts` y `tests/unit/access-token.service.test.ts`: 28 casos nuevos.
- `docs/estructura.md`: documenta `access` (route y middleware), `access-token` y `access-body`.

## Decisions Made

Ver `key-decisions` en el frontmatter. Las principales:
- `ACCESS_CODE` es obligatorio en todo entorno y `NODE_ENV` vale `production` por defecto, así que el modo seguro es el que rige si nadie lo configura.
- El secreto de firma no puede repetir el código ni la clave del modelo. Así se cumple literalmente que sea "distinto del código y de la clave del LLM" (D-72).

## TDD Gate Compliance

- **RED** (`ad667f2`): `bun test tests/unit/access-token.service.test.ts --reporter=junit`. El clasificador `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`, formato junit, 8 pruebas, 2 fallidas). Evaluación semántica: la prueba objetivo "rechaza un vencimiento futuro que no es un entero de milisegundos" se ejecutó y falló en la aserción planeada, porque la versión del Task 1 aceptaba `v1.1e20` (`Number("1e20") > ahora`). También fallaron, por la aserción esperada, "partes de más", "secreto igual al código" y "secreto igual a la clave del modelo" (`creacion.ok` era `true`). No hubo errores de carga ni de sintaxis. Los casos de adulteración, 1 ms, producción sin secretos y Secure pasaron desde el RED porque el Task 1 ya los cubría. Quedan como regresión, como anticipaba el plan.
- **GREEN** (`afa6d7d`): las 28 pruebas pasan. `bun run check` sale con 0 y la suite completa da 1620 pass y 0 fail.
- **REFACTOR**: no hizo falta.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] El secreto de firma no puede repetir el código ni la clave del modelo**
- **Found during:** Task 2
- **Issue:** D-72 y la verdad del plan piden que `ACCESS_TOKEN_SECRET` sea distinto de `ACCESS_CODE` y de la clave del LLM, pero ninguna tarea lo exigía. Con el mismo valor, quien conoce el código podría falsificar cookies.
- **Fix:** un refinamiento en `serverEnvSchema` (secreto igual al código) y un chequeo en `createServer` contra `secretosDelAgente` (secreto igual a la clave). Los dos cortan el arranque con `TEXTO_ENV.secretoTokenRepetido`.
- **Files modified:** src/config/env.ts, src/http/wiring/server.wiring.ts, src/config/strings.ts, src/config/constants/http.constants.ts
- **Verification:** dos casos en `tests/http/acceso.test.ts`, fallidos en RED y verdes en GREEN.
- **Committed in:** afa6d7d

**2. [Rule 2 - Missing Critical] Mensaje propio para el cuerpo inválido de /api/acceso**
- **Found during:** Task 1
- **Issue:** `MENSAJE_HTTP.cuerpoInvalido` describe el cuerpo del chat (`sessionId`/`message`), así que habría confundido a quien llama a `/api/acceso`.
- **Fix:** se agregó `MENSAJE_HTTP.cuerpoAccesoInvalido` (400) y el código del cuerpo se recorta antes de comparar.
- **Files modified:** src/config/strings.ts, src/http/routes/access.route.ts, src/http/schemas/access-body.schema.ts
- **Committed in:** 33a826f

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** las dos refuerzan D-72 sin cambiar el contrato ni los nombres de las env. No amplían el alcance.

## Issues Encountered

- `Response.json()` devuelve `unknown` en los tipos de Bun, y `tsc` rechazó leer `.reply`. Se cambió por `toMatchObject`.

## Prueba de humo

- Se arrancó `bun --env-file=/dev/null src/server.ts` con un entorno falso y un LLM inalcanzable, sin mandar ningún mensaje de chat.
  - En producción sin secreto, el proceso sale con código 1 y muestra "ACCESS_TOKEN_SECRET: Falta el secreto de firma…".
  - En desarrollo, health responde 200, `/api/acceso` responde 204 con `Set-Cookie` sin `Secure` y `/api/chat` sin cookie responde 401 con el mensaje de acceso vencido.
- Después se detuvo el servidor.

## User Setup Required

- **`.env` local:** `bun run dev` necesita ahora `ACCESS_CODE` (al menos 12 caracteres). Sin él, la API no arranca y lo explica en español. `ACCESS_TOKEN_SECRET` es opcional en desarrollo, y sin él se genera uno efímero en cada arranque, por eso las cookies no sobreviven a un `--watch`. El plan 03-08 documenta estas variables en `.env.example`, y el 03-11 en Render, donde el secreto es obligatorio.
- **Chat del navegador:** hasta que llegue la pantalla de acceso (03-10), el SPA de 03-03 recibe 401 en `/api/chat` y muestra el error. Es el orden previsto por el plan.

## Next Phase Readiness

- Sobre esta guardia construyen 03-06 (tope de 5 fallos cada 15 min en `/api/acceso`), 03-08 (endpoint de config, redacción del lado del agente y `ENTORNO_APP` en `FAMILIAS_DE_CODIGOS`), 03-09 (estáticos públicos del SPA y borde de entrada) y 03-10 (pantalla de acceso).
- Sin bloqueos.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
