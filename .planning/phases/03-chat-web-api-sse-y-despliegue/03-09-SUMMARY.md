---
phase: 03-chat-web-api-sse-y-despliegue
plan: 09
subsystem: api
tags: [hono, serveStatic, bodyLimit, secureHeaders, csp, csrf, spa]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "createServer, el 404 de la app (03-02), requireAccess (03-04), ConfigResponse y registerConfigRoute (03-08), DIRECTORIO_WEB_DIST y PREFIJO_API (03-01)"
provides:
  - "registerStaticRoutes: la SPA de web/dist servida por el mismo proceso, con respaldo a index.html fuera de /api"
  - "ServerOptions.webDirectory (por defecto rootDirectory/web/dist, resuelto como ruta absoluta)"
  - "requireJson: 415 { mensaje } a todo POST de /api sin application/json"
  - "bodyLimit con MAX_BODY_BYTES (16384 por defecto): 413 { mensaje } antes de parsear"
  - "Límite del mensaje con MAX_MESSAGE_CHARS (2000 por defecto): 413 con el texto de UI-SPEC"
  - "secureHeaders con CSP estricta en toda respuesta, SPA incluida"
  - "ConfigResponse.mensajeMaximo en GET /api/config"
affects: [03-10, 03-11, 03-21]

actuals:
  tokens: 9964
  tasks: 2
  commits: 3
plan_head_before: acb02b03c2db555311999394fbfd1a51ef30b9ad
plan_head_after: d36a9629016ea8be6e06c0649fb84f6e195121a1

tech-stack:
  added: []
  patterns:
    - "Borde de /api en el orden secureHeaders → IP del cliente → json-only → bodyLimit → acceso → ruta"
    - "Rutas estáticas que dejan pasar todo /api con next(), así que una ruta /api registrada después o desconocida sigue en su handler o en el 404 JSON"

key-files:
  created:
    - src/http/routes/static.route.ts
    - src/http/middlewares/json-only.middleware.ts
    - tests/http/estatico.test.ts
    - tests/http/bordes.test.ts
  modified:
    - src/http/wiring/server.wiring.ts
    - src/http/routes/chat.route.ts
    - src/http/types/server.type.ts
    - src/http/types/api.type.ts
    - src/config/constants/http.constants.ts
    - src/config/env.ts
    - src/config/strings.ts
    - .env.example
    - docs/estructura.md
    - tests/helpers/servidor-prueba.helper.ts
    - tests/helpers/types/servidor-prueba.type.ts
    - tests/http/acceso.test.ts
    - tests/http/stream.test.ts

key-decisions:
  - "Las rutas estáticas no dependen del orden de registro: cada handler hace next() en /api y en /api/*. Un app.all('/api/*') de 404 antes de la SPA rompía las rutas /api registradas después de createServer (lo mostró la prueba de 500 de stream.test.ts)."
  - "json-only y bodyLimit van antes de la guardia de acceso y cubren /api/acceso. Un cliente sin acceso que manda text/plain recibe 415 y no 401, y el código nunca se evalúa sobre un cuerpo sin límite."
  - "La CSP sale de FUENTE_CSP (http.constants) y se arma en server.wiring. Además de las directivas del plan agrega img-src 'self' data: para el favicon data: de 03-07, más font-src, base-uri y form-action 'self'."
  - "MAX_MESSAGE_CHARS cuenta unidades UTF-16 del mensaje recortado por zod, igual que el maxlength del textarea del front."

patterns-established:
  - "Pruebas de borde exactas: el cuerpo JSON se rellena con espacios hasta N bytes, porque JSON admite espacio final, y se prueban N y N+1, con Content-Length y en stream"

requirements-completed: [API-04, DEP-02]

coverage:
  - id: D1
    description: "La API sirve la SPA construida desde web/dist con respaldo a index.html; un ../ codificado devuelve index.html y nunca el package.json; /api desconocida sigue en 404 { mensaje }"
    requirement: DEP-02
    verification:
      - kind: integration
        ref: "tests/http/estatico.test.ts#un ../ codificado responde index.html y nunca el package.json de la raíz"
        status: pass
      - kind: integration
        ref: "tests/http/estatico.test.ts#una ruta /api desconocida sigue respondiendo 404 con mensaje"
        status: pass
    human_judgment: false
  - id: D2
    description: "16384 bytes pasan el límite y 16385 responden 413 antes de parsear, con y sin Content-Length"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/bordes.test.ts#un cuerpo de 16385 bytes responde 413 y no empieza el turno"
        status: pass
      - kind: integration
        ref: "tests/http/bordes.test.ts#un cuerpo de 16384 bytes pasa el límite y empieza el turno"
        status: pass
    human_judgment: false
  - id: D3
    description: "2000 caracteres empiezan un turno y 2001 responden 413 con el texto de UI-SPEC, sin llamar al proveedor"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/bordes.test.ts#un mensaje de 2001 caracteres responde 413 con el texto de UI-SPEC y no llama al proveedor"
        status: pass
    human_judgment: false
  - id: D4
    description: "Todo POST de /api sin application/json responde 415 { mensaje }"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/bordes.test.ts#POST /api/chat con text/plain responde 415 y no empieza un turno"
        status: pass
    human_judgment: false
  - id: D5
    description: "CSP estricta, nosniff y HSTS en /api/health, en la SPA y en los errores 413 y 415"
    requirement: API-04
    verification:
      - kind: integration
        ref: "tests/http/bordes.test.ts#GET / de la SPA trae la CSP estricta, nosniff y HSTS"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-14
status: complete
---

# Fase 03 Plan 09: la SPA servida por la API y el borde de /api

**Un solo proceso sirve la SPA de `web/dist` con respaldo a `index.html` y a prueba de traversal. El borde de `/api` responde 415 a lo que no es JSON, 413 a un cuerpo de más de 16384 bytes antes de parsearlo y 413 a un mensaje de más de 2000 caracteres. Toda respuesta lleva `secureHeaders` con una CSP `'self'` y `frame-ancestors 'none'`.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-10-15T00:44:27Z
- **Completed:** 2026-10-15T00:50:31Z
- **Tasks:** 2
- **Files modified:** 17 (4 creados)

## Accomplishments

- `registerStaticRoutes` sirve `web/dist` con `serveStatic` de `hono/bun` desde una ruta absoluta, así que no depende del directorio de trabajo, y cae en `index.html` para toda ruta GET fuera de `/api`. `/..%2f..%2fpackage.json` responde `index.html`. Las rutas estáticas son públicas.
- `requireJson` (415), `bodyLimit` (413 `cuerpoDemasiadoGrande`, antes de parsear) y el límite del mensaje en la ruta del chat (413 `mensajeDemasiadoLargo(max)`) se configuran con `MAX_BODY_BYTES` y `MAX_MESSAGE_CHARS`. Ambas variables están en `serverEnvSchema` y, vacías, en `.env.example`.
- `secureHeaders` cubre la API, la SPA y los errores con `default-src`, `script-src`, `style-src` y `connect-src 'self'`, `object-src 'none'` y `frame-ancestors 'none'`, además de nosniff y HSTS. El `index.html` construido no tiene scripts ni estilos inline, y `web/src` no usa `style={}`, así que la CSP no rompe la SPA.
- `GET /api/config` devuelve `mensajeMaximo`.

## Task Commits

1. **Task 1 (tracer): la API sirve la SPA construida**: `0f82652` (feat)
2. **Task 2 (TDD): el borde de la API (API-04, D-73.4)**
   - RED: `225ba21` (test)
   - GREEN: `d36a962` (feat)

El gate del tracer se re-ejecutó (`bun test tests/http/estatico.test.ts tests/architecture.test.ts` y `bun run check`, ambos en verde) antes de expandir.

## TDD Gate Compliance

- **RED** (`225ba21`): `bun --env-file=/dev/null test tests/http/bordes.test.ts --reporter=junit`. El clasificador `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`, formato junit, 17 pruebas: 3 pasan y 14 fallan). Evaluación semántica: la prueba objetivo "un cuerpo de 16385 bytes responde 413 y no empieza el turno" se ejecutó y falló en la aserción planeada (`Expected: 413, Received: 200`), porque el cuerpo pasaba sin límite. Las tres que ya pasaban son los casos de aceptación del borde (16384 bytes, 2000 caracteres y `application/json; charset=utf-8`), que deben pasar antes y después. No hubo errores de carga, de sintaxis ni de fixture.
- **GREEN** (`d36a962`): `bun test tests/http/bordes.test.ts tests/http/estatico.test.ts tests/http/chat.test.ts tests/http/acceso.test.ts tests/architecture.test.ts` da 127 pass. `bun run check` sale con 0 y la suite completa (`bun --env-file=/dev/null test`) da 1705 pass, 1 skip y 0 fail.
- **REFACTOR**: no hizo falta.

## Files Created/Modified

- `src/http/routes/static.route.ts`: `registerStaticRoutes(app, { webDirectory })` con el filtro `outsideApi`.
- `src/http/middlewares/json-only.middleware.ts`: `requireJson()`.
- `src/http/wiring/server.wiring.ts`: `secureHeaders` global, `requireJson` + `bodyLimit` sobre `/api/*`, `maxMessageChars` hacia el chat, `mensajeMaximo` en `configSource` y la SPA registrada al final.
- `src/http/routes/chat.route.ts`: `ChatDeps.maxMessageChars` y la respuesta 413.
- `src/http/types/server.type.ts`: `ServerOptions.webDirectory` y `StaticSettings`.
- `src/http/types/api.type.ts`: `ConfigResponse.mensajeMaximo`.
- `src/config/constants/http.constants.ts`: `ARCHIVO_INDEX_WEB`, `RUTA_COMODIN`, `MENSAJE_MAXIMO_CARACTERES_POR_DEFECTO`, `CUERPO_MAXIMO_BYTES_POR_DEFECTO`, `FUENTE_CSP` y `CABECERA.TIPO_CONTENIDO`.
- `src/config/env.ts`: `MAX_MESSAGE_CHARS` y `MAX_BODY_BYTES` en `serverEnvSchema`.
- `src/config/strings.ts`: `MENSAJE_HTTP.tipoNoSoportado`, `cuerpoDemasiadoGrande` y `mensajeDemasiadoLargo(maximo)`.
- `.env.example`: `MAX_MESSAGE_CHARS=` y `MAX_BODY_BYTES=`.
- `docs/estructura.md`: nombra `static` y `json-only` y describe el borde, la CSP y las variables nuevas.
- `tests/http/estatico.test.ts` y `tests/http/bordes.test.ts`: pruebas nuevas.
- `tests/helpers/servidor-prueba.helper.ts` y `tests/helpers/types/servidor-prueba.type.ts`: opción `directorioWeb`.
- `tests/http/acceso.test.ts`: la forma exacta de `/api/config` incluye `mensajeMaximo`.
- `tests/http/stream.test.ts`: `registerChatRoute` directo recibe `maxMessageChars`.

## Decisions Made

- Las rutas estáticas dejan pasar `/api` con `next()` en lugar de registrar un 404 comodín de `/api` antes de la SPA. Así el 404 JSON de `app.notFound` sigue siendo el único 404 de la API.
- json-only y bodyLimit van antes del acceso y cubren `/api/acceso`.
- La CSP agrega `img-src 'self' data:` por el favicon `data:` que dejó 03-07.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Un 404 comodín de /api tapaba las rutas registradas después**
- **Found during:** Task 1
- **Issue:** La primera versión registraba `app.all("/api/*", notFound)` antes de la SPA. Una ruta `/api` agregada después de `createServer`, como la de la prueba de 500 de `stream.test.ts`, quedaba detrás del 404.
- **Fix:** `registerStaticRoutes` envuelve cada `serveStatic` en `outsideApi`, que hace `next()` en `/api` y `/api/*`. El 404 de `/api` vuelve a ser `app.notFound`.
- **Files modified:** src/http/routes/static.route.ts, src/http/wiring/server.wiring.ts
- **Verification:** `bun test tests/http` en verde (126 pass).
- **Committed in:** `0f82652`

**2. [Rule 3 - Blocking] Ajuste de dos pruebas existentes al contrato nuevo**
- **Found during:** Task 2
- **Issue:** `acceso.test.ts` comparaba la forma exacta de `/api/config`, y `stream.test.ts` arma `registerChatRoute` sin `maxMessageChars` (error de tsc).
- **Fix:** La prueba de config fija `MAX_MESSAGE_CHARS=1800` y espera `mensajeMaximo`. La de stream pasa `MENSAJE_MAXIMO_CARACTERES_POR_DEFECTO`.
- **Files modified:** tests/http/acceso.test.ts, tests/http/stream.test.ts
- **Committed in:** `d36a962`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Ninguno en el alcance. Las dos correcciones mantienen el contrato del 404 y de las rutas existentes.

## Issues Encountered

- `bodyLimit` reemplaza `c.req.raw` cuando el cuerpo llega sin `Content-Length` (chunked). Después, `c.env.timeout(c.req.raw, 0)` del chat recibe la copia. Un spike con `Bun.serve` mostró que no lanza error, pero en ese caso puede no desactivar el idle timeout. Los navegadores mandan `Content-Length` con un cuerpo string, y el latido SSE de 8 s queda por debajo del idle de 10 s, así que no hay impacto práctico. Queda anotado para 03-11.

## User Setup Required

Ninguno. `MAX_MESSAGE_CHARS` y `MAX_BODY_BYTES` tienen valores por defecto, y en Render se pueden dejar vacías.

## Next Phase Readiness

- 03-10 y 03-21 pueden leer `mensajeMaximo` de `/api/config` para el contador del compositor.
- 03-11 puede desplegar un solo servicio: el mismo `Bun.serve` sirve la SPA y la API con la CSP.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-14*

## Self-Check: PASSED
