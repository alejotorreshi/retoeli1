---
phase: 03-chat-web-api-sse-y-despliegue
plan: 06
subsystem: api
tags: [hono, rate-limit, x-forwarded-for, fuerza-bruta, acceso, seguridad]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "registerAccessRoute, requireAccess, ServerOptions.now, MENSAJE_HTTP.codigoInvalido y CODIGO_PRUEBA (03-04); HttpBindings.requestIP (03-01)"
provides:
  - "createRateLimiter({ limit, windowMs, now }) → RateLimiter { hit, isLocked, trackedKeys }: ventana fija por clave con reloj inyectado y barrido de ventanas vencidas en cada llamada"
  - "clientIpFrom({ forwardedFor, socketAddress, trustedHops }): IP del cliente contando TRUSTED_PROXY_HOPS desde la derecha de X-Forwarded-For, con el socket como respaldo"
  - "resolveClientIp({ trustedHops, logger }): middleware de todo /api que deja la IP en la variable de contexto clientIp (HttpEnv.Variables) y registra en depuración solo entradasXff y saltosConfiables"
  - "Tope D-73.2: 5 fallos cada 15 min por IP del cliente; /api/acceso y los Bearer errados suman al mismo contador; bloqueado, /api/acceso y cualquier Bearer responden 429 con MENSAJE_HTTP.demasiadosIntentos"
  - "Env TRUSTED_PROXY_HOPS (0 a 10, por defecto 1), ACCESS_MAX_FAILED_ATTEMPTS (por defecto 5) y ACCESS_FAILED_WINDOW_MINUTES (por defecto 15)"
  - "BitacoraEstructurada.depurar (nivel debug) en el puerto, el adaptador pino y bitacoraMuda"
affects: [03-08, 03-11, 03-14, 03-15]

actuals:
  tokens: 10600
  tasks: 2
  commits: 3

plan_head_before: f03251a08e76ce1156ab76c5676d7121c2a6c162
plan_head_after: fb04bb29cfdb19ed8d1fccdab490faa2e3fe15c5

tech-stack:
  added: []
  patterns:
    - "Limitador puro en http/services con reloj inyectado y Map barrido en cada llamada, la misma forma que memory-session-store"
    - "La IP del cliente se resuelve una sola vez por pedido en un middleware y se lee con c.get(\"clientIp\"), una clave que Hono tipa contra HttpVariables"
    - "El texto del 429 sale de TEXTO_HTTP.demasiadosIntentos(minutos) con la ventana configurada; MENSAJE_HTTP.demasiadosIntentos es esa función con la ventana por defecto"

key-files:
  created:
    - src/http/services/rate-limiter.service.ts
    - src/http/services/client-ip.service.ts
    - src/http/middlewares/client-ip.middleware.ts
    - tests/unit/rate-limiter.service.test.ts
    - tests/unit/client-ip.service.test.ts
  modified:
    - src/config/env.ts
    - src/config/strings.ts
    - src/config/constants/http.constants.ts
    - src/http/routes/access.route.ts
    - src/http/middlewares/access.middleware.ts
    - src/http/types/server.type.ts
    - src/http/wiring/server.wiring.ts
    - src/application/types/puertos-agente.type.ts
    - src/infra/logging/logger.adapter.ts
    - tests/helpers/bitacora.helper.ts
    - tests/http/acceso.test.ts
    - tests/architecture.test.ts
    - docs/estructura.md

key-decisions:
  - "Bloqueada la IP, también el código o el Bearer correctos responden 429: si no, el atacante seguiría probando y distinguiría el acierto"
  - "Solo un Authorization con prefijo Bearer y valor errado cuenta como fallo. Un pedido sin Bearer ni cookie responde 401 y no suma, para que una cookie vencida no bloquee a la analista"
  - "Un Bearer errado con una cookie vigente sigue entrando por la cookie, pero el fallo ya quedó contado"
  - "Un cuerpo inválido en /api/acceso (400) no cuenta como fallo; solo un código comparado y errado"
  - "El texto del 429 se deriva de ACCESS_FAILED_WINDOW_MINUTES (TEXTO_HTTP.demasiadosIntentos); con el valor por defecto coincide letra a letra con la UI-SPEC"
  - "Sin dirección de socket ni XFF utilizable la clave es la constante IP_DESCONOCIDA, nunca una cadena vacía"
  - "TRUSTED_PROXY_HOPS tiene tope 10 (SALTOS_PROXY_TOPE)"

patterns-established:
  - "Rutas y middlewares que limitan por cliente leen c.get(\"clientIp\"); 03-14 y 03-15 reutilizan createRateLimiter y esa variable"
  - "Pruebas HTTP por IP con pedirDesde(app, ip, ruta, init), que inyecta HttpBindings con requestIP fijo"

requirements-completed: [API-04]

coverage:
  - id: D1
    description: "Cinco códigos errados desde un cliente responden 401 y el sexto 429 con MENSAJE_HTTP.demasiadosIntentos; otro cliente sigue entrando; bloqueado, el código correcto también responde 429 y sin cookie"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#tope de intentos fallidos por IP del cliente (D-73.2)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Seis códigos errados con seis entradas izquierdas de X-Forwarded-For distintas cortan igual al sexto; otro cliente real entra; TRUSTED_PROXY_HOPS=0 cuenta por el socket"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#X-Forwarded-For falsificado, Bearer errados y vencimiento de la ventana (D-73.2, T-03-14)"
        status: pass
      - kind: unit
        ref: "tests/unit/client-ip.service.test.ts#clientIpFrom"
        status: pass
    human_judgment: false
  - id: D3
    description: "Bearer errados en /api/chat suman al mismo contador que /api/acceso; bloqueado, todo Bearer responde 429; un código o Bearer correctos nunca suman; sin credenciales no suma"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#X-Forwarded-For falsificado, Bearer errados y vencimiento de la ventana (D-73.2, T-03-14)"
        status: pass
    human_judgment: false
  - id: D4
    description: "La ventana vence a los 15 min exactos (1 ms antes sigue bloqueado); ACCESS_MAX_FAILED_ATTEMPTS y ACCESS_FAILED_WINDOW_MINUTES cambian el tope y el texto; el limitador barre las claves vencidas"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#al vencer los 15 minutos el cliente vuelve a entrar, y 1 ms antes sigue bloqueado"
        status: pass
      - kind: unit
        ref: "tests/unit/rate-limiter.service.test.ts#createRateLimiter"
        status: pass
    human_judgment: false
  - id: D5
    description: "El sondeo de depuración registra solo entradasXff y saltosConfiables, nunca una IP"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/acceso.test.ts#el log de depuración registra solo la cantidad de entradas y los saltos, nunca una dirección"
        status: pass
    human_judgment: false
  - id: D6
    description: "Cuántos saltos agrega de verdad el borde de Render a X-Forwarded-For (supuesto A2)"
    verification: []
    human_judgment: true
    rationale: "Depende del proxy real de Render; se verifica con el sondeo de depuración en el despliegue del plan 03-11"

duration: 6min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 06: Tope de intentos fallidos por IP real del cliente Summary

**El código de acceso ya no se puede adivinar por fuerza bruta. Hay 5 fallos cada 15 minutos por IP del cliente, entre `/api/acceso` y los `Bearer` errados, y el sexto responde 429. La IP sale de `X-Forwarded-For` contando `TRUSTED_PROXY_HOPS` desde la derecha, así que falsificar las entradas izquierdas no reinicia el contador.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-15T00:22:33Z
- **Completed:** 2026-10-15T00:28:30Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments

- Tracer D-73.2: cinco códigos errados desde un cliente responden 401 y el sexto 429 con el texto de la UI-SPEC, mientras otro cliente sigue entrando.
- La IP real del cliente se resuelve una vez por pedido (`resolveClientIp`) y queda en `clientIp`, lista para los topes de chat y de sesiones nuevas de 03-14 y 03-15.
- Las entradas falsificadas a la izquierda de `X-Forwarded-For` no cambian el contador. Sin header, con menos entradas que saltos o con `TRUSTED_PROXY_HOPS=0` se usa el socket.
- Los `Bearer` errados suman al mismo contador. Bloqueada la IP, el código y el Bearer correctos también responden 429. Los aciertos nunca suman.
- El sondeo de depuración para Render (03-11) registra solo `entradasXff` y `saltosConfiables`. La prueba confirma que ninguna IP aparece en el log.

## Task Commits

1. **Task 1: Tracer, cinco códigos errados bloquean al cliente con 429**: `39edbc8` (feat)
2. **Task 2: XFF falsificado, Bearer errados y vencimiento no esquivan el tope**: RED `0181f73` (test), GREEN `fb04bb2` (feat)

## Files Created/Modified

- `src/http/services/rate-limiter.service.ts`: `createRateLimiter`, una ventana fija por clave. `hit` cuenta y responde si el pedido pasa, `isLocked` consulta sin contar y `trackedKeys` expone el tamaño. Cada llamada barre las ventanas vencidas.
- `src/http/services/client-ip.service.ts`: `clientIpFrom` y `forwardedEntries` (separa, recorta y descarta entradas vacías).
- `src/http/middlewares/client-ip.middleware.ts`: `resolveClientIp`, con `c.env.requestIP(c.req.raw)` como socket y el sondeo `http_client_ip_resolved` en depuración.
- `src/http/routes/access.route.ts`: si la IP está bloqueada responde 429 antes de leer el cuerpo, y solo cuenta un código comparado y errado.
- `src/http/middlewares/access.middleware.ts`: `checkBearer` devuelve `RESULTADO_BEARER` (ausente, válido, inválido o bloqueado). El inválido suma y el bloqueado responde 429.
- `src/http/types/server.type.ts`: `HttpVariables`, `HttpEnv.Variables`, `RateLimiter`, `RateLimiterOptions`, `ClientIpInput`, `ClientIpSettings`, `BearerCheck` y los campos `failedAttempts` y `lockedMessage` de `AccessSettings`.
- `src/http/wiring/server.wiring.ts`: monta `resolveClientIp` primero en `/api/*` y arma el limitador con los valores del entorno y el reloj inyectado.
- `src/config/env.ts`, `src/config/constants/http.constants.ts` y `src/config/strings.ts`: las tres env, sus valores por defecto y tope, `SEPARADOR_X_FORWARDED_FOR`, `IP_DESCONOCIDA`, `CABECERA.X_FORWARDED_FOR`, `EVENTO_HTTP.IP_CLIENTE_RESUELTA`, `RESULTADO_BEARER`, `TEXTO_HTTP.demasiadosIntentos` y `MENSAJE_HTTP.demasiadosIntentos`.
- `src/application/types/puertos-agente.type.ts`, `src/infra/logging/logger.adapter.ts` y `tests/helpers/bitacora.helper.ts`: `depurar` en la bitácora.
- `tests/unit/rate-limiter.service.test.ts` (6 casos), `tests/unit/client-ip.service.test.ts` (10 casos) y `tests/http/acceso.test.ts` (11 casos nuevos).
- `tests/architecture.test.ts`: `RESULTADO_BEARER` en `FAMILIAS_DE_CODIGOS`.
- `docs/estructura.md`: `client-ip` (middleware y servicio), `rate-limiter`, las env nuevas y los tipos.

## Decisions Made

Ver `key-decisions` en el frontmatter. Las principales:
- Mientras la IP está bloqueada, también el acierto responde 429. Si no fuera así, el bloqueo no cortaría la fuerza bruta.
- Solo cuenta un `Bearer` presente y errado. Un pedido sin credenciales (por ejemplo, con la cookie vencida) responde 401 y no suma, para no bloquear a la analista.

## TDD Gate Compliance

- **RED** (`0181f73`): `bun --env-file=/dev/null test tests/unit/rate-limiter.service.test.ts tests/unit/client-ip.service.test.ts tests/http/acceso.test.ts --reporter=junit`. El clasificador `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`, formato junit, 47 pruebas, 5 fallidas). Evaluación semántica: la prueba objetivo "cinco Bearer errados en /api/chat bloquean al cliente…" se ejecutó y falló en la aserción planeada (`expect(received).toBe(expected)`). El sexto Bearer errado respondió 401 porque la guardia del Task 1 no contaba los Bearer. Por la aserción esperada fallaron también la prueba de suma con `/api/acceso`, el barrido del limitador (`trackedKeys` seguía en 2) y las dos de entradas vacías de `clientIpFrom` (devolvía `""`). No hubo errores de carga, de sintaxis ni de fixture. Los casos de XFF falsificado, vencimiento de la ventana, env configurables, aciertos que no suman y sondeo pasaron desde el RED porque el Task 1 ya los cubría, y quedan como regresión. Antes del RED se corrigió una prueba mal escrita ("la ventana es fija"): esperaba que no hubiera bloqueo con 5 golpes, cuando 5 es justo el tope. No se usó como evidencia.
- **GREEN** (`fb04bb2`): 47 pass. `bun run check` sale con 0 y la suite completa da 1678 pass, 1 skip (en vivo) y 0 fail.
- **REFACTOR**: no hizo falta.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] La bitácora no tenía nivel debug**
- **Found during:** Task 1
- **Issue:** el plan pide registrar el sondeo de `X-Forwarded-For` en nivel debug, pero `BitacoraEstructurada` solo tenía `info`, `advertir` y `error`.
- **Fix:** se agregó `depurar` al puerto, al adaptador pino (`logger.debug`) y a `bitacoraMuda`.
- **Files modified:** src/application/types/puertos-agente.type.ts, src/infra/logging/logger.adapter.ts, tests/helpers/bitacora.helper.ts
- **Verification:** la prueba del sondeo con `LOG_LEVEL=debug` encuentra el evento con `entradasXff: 2` y `saltosConfiables: 1`, y ninguna IP en el log.
- **Committed in:** 39edbc8

**2. [Rule 2 - Missing Critical] El texto del 429 sigue a la ventana configurada**
- **Found during:** Task 1
- **Issue:** el plan fija el texto literal "Espera 15 minutos", pero la ventana es configurable (`ACCESS_FAILED_WINDOW_MINUTES`). Con otro valor el mensaje mentiría, y CLAUDE.md pide derivar de su constante un texto que repite un dato.
- **Fix:** `TEXTO_HTTP.demasiadosIntentos(minutos)`. `MENSAJE_HTTP.demasiadosIntentos` es el mismo texto con la ventana por defecto (idéntico a la UI-SPEC), y el wiring arma `lockedMessage` con la ventana del entorno.
- **Files modified:** src/config/strings.ts, src/http/wiring/server.wiring.ts, src/http/types/server.type.ts
- **Verification:** el caso "ACCESS_MAX_FAILED_ATTEMPTS y ACCESS_FAILED_WINDOW_MINUTES cambian el tope y el mensaje".
- **Committed in:** 39edbc8, fb04bb2

**3. [Rule 2 - Missing Critical] El resultado del Bearer como objeto `as const`**
- **Found during:** Task 2
- **Issue:** el estado de la comprobación del Bearer (ausente, válido, inválido o bloqueado) es un código, y CLAUDE.md prohíbe comparar estados con literales.
- **Fix:** `RESULTADO_BEARER` en `http.constants.ts`, `BearerCheck = ValorDe<typeof RESULTADO_BEARER>` y registro en `FAMILIAS_DE_CODIGOS` del guardián.
- **Files modified:** src/config/constants/http.constants.ts, src/http/types/server.type.ts, src/http/middlewares/access.middleware.ts, tests/architecture.test.ts
- **Committed in:** fb04bb2

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing critical)
**Impact on plan:** ninguna cambia el contrato, los nombres de las env ni el texto de la UI-SPEC. No amplían el alcance.

## Issues Encountered

- Una prueba unitaria propia esperaba mal el umbral (5 golpes es el tope y ya bloquea). Se corrigió antes de tomar la evidencia RED.

## Threat Flags

Ninguna superficie nueva fuera del `<threat_model>`. Queda una nota para 03-11: sin proxy delante (desarrollo local con `TRUSTED_PROXY_HOPS=1`), un cliente directo controla `X-Forwarded-For` y puede rotar su contador. Es el comportamiento esperado de un salto confiable. En una exposición directa corresponde `TRUSTED_PROXY_HOPS=0`.

## User Setup Required

None. Los valores por defecto (1 salto, 5 fallos, 15 min) aplican sin configurar nada. El plan 03-08 agrega las tres variables a `.env.example`, y el 03-11 confirma en Render el número de saltos con el sondeo de depuración.

## Next Phase Readiness

- 03-14 (mensajes por minuto) y 03-15 (sesiones nuevas por hora) reutilizan `createRateLimiter` y `c.get("clientIp")`.
- 03-08 documenta `TRUSTED_PROXY_HOPS`, `ACCESS_MAX_FAILED_ATTEMPTS` y `ACCESS_FAILED_WINDOW_MINUTES` en `.env.example`.
- 03-11 verifica el supuesto A2 (cuántas IP agrega Render) con `LOG_LEVEL=debug` y un `curl -H "X-Forwarded-For: 203.0.113.9"`.
- Sin bloqueos.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
