---
phase: 03-chat-web-api-sse-y-despliegue
plan: 18
subsystem: api
tags: [compuerta, confirmacion, accion, zod, hono, d-68, d-69]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-02 chatBodySchema estricto y registerChatRoute; 03-15 store de sesiones con leer; 03-16 eventos visibles (confirmation_required con caso y bloqueosLegibles)"
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "compuerta por caso (D-37, D-38, D-40, D-42), clasificador de texto (D-63.x) y abrirTurno/estadoSin"
provides:
  - "TIPO_ACCION { CONFIRMAR, CANCELAR } as const, registrada en FAMILIAS_DE_CODIGOS (G6)"
  - "DECISION_CONFIRMACION.CANCELA_CASO y su variante { decision, caso } en DecisionConfirmacion"
  - "abrirTurno resuelve CANCELA_CASO con estadoSin: quita solo ese caso (LIBRE sigue LIBRE)"
  - "AccionEstructurada { tipo, caso } y EntradaTurno.accion (reemplaza ConfirmacionEstructurada y el campo confirmacion)"
  - "decisionDe: la accion decide solo si su caso está pendiente; si no, clasificarConfirmacion sobre el texto visible"
  - "POST /api/chat acepta accion opcional y estricta (z.enum(TIPO_ACCION), caso hasta LONGITUD_MAXIMA_CASO); ChatBody.accion"
affects: [03-23 tarjetas de confirmación por caso, GET /api/sessions/:id con pendientes vigentes, SOLUCION.md (AR-02-06, WR-17)]

actuals:
  tokens: 7100
  tasks: 2
  commits: 2
plan_head_before: 85728c01845520b5d6e82e03d49e53aed669c248
plan_head_after: bf198d0e5121007d99700d8c36a07ff63c1b37a9

tech-stack:
  added: []
  patterns:
    - "Intención estructurada del cliente validada contra el estado del servidor: la accion solo cuenta si su caso está pendiente en la sesión; si no, el mensaje se trata como texto normal"
    - "Campo opcional del cuerpo HTTP que se propaga al turno solo cuando viene (turnInput), compatible con exactOptionalPropertyTypes"

key-files:
  created: []
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/domain/types/confirmacion.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/loop/types/turno.type.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/http/schemas/chat-body.schema.ts
    - src/http/types/api.type.ts
    - src/http/routes/chat.route.ts
    - tests/architecture.test.ts
    - tests/unit/compuerta.policy.test.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/http/chat.test.ts

key-decisions:
  - "03-18: D-68 — la accion { tipo, caso } decide sin el clasificador solo cuando su caso está pendiente en la sesión; confirmar devuelve CONFIRMA y cancelar la decisión nueva CANCELA_CASO. Si el caso no está pendiente (botón viejo, otra pestaña, caso ya enviado) la accion se ignora y el texto visible pasa por clasificarConfirmacion como cualquier mensaje. El clasificador nunca devuelve CANCELA_CASO, así que el corpus de D-63.x no cambia"
  - "03-18: D-69 — cancelar estructurado quita solo su caso (abrirTurno con estadoSin) y los demás pendientes siguen con la pregunta del servidor y needsConfirmation true; el rechazo por texto sigue cancelando todos (D-63.11). Así quedan cerrados por la vía estructurada WR-17 y el aviso de cancelación silenciosa de D-63.11"
  - "03-18: ChatBody.accion se declara como AccionEstructurada | undefined porque la salida de zod .optional() incluye undefined bajo exactOptionalPropertyTypes; la ruta arma EntradaTurno con accion solo cuando viene"
  - "03-18: un botón viejo que manda cancelar sobre un caso no pendiente usa su texto visible ('Cancela el envío de <caso>'), que el clasificador toma como rechazo y cancela lo pendiente; es el comportamiento documentado de D-68 (texto normal) y queda probado"

patterns-established:
  - "La UI manda texto visible más accion estructurada; el servidor es la única compuerta y decide con lo que tiene pendiente"

requirements-completed: [UI-03, API-01]

coverage:
  - id: D1
    description: "Confirmar estructurado de un caso pendiente autoriza exactamente ese caso, gana sobre un texto negativo y sobre un 'sí' a secas con dos pendientes"
    requirement: UI-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-68: la acción estructurada de un caso pendiente tiene precedencia sobre el texto"
        status: pass
    human_judgment: false
  - id: D2
    description: "Una accion sobre un caso no pendiente se ignora y el texto visible pasa por el clasificador (confirmar co con solo ec, cancelar co con solo ec, confirmar un caso ya enviado)"
    requirement: UI-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-68 ... confirmar co con solo ec pendiente no autoriza nada"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-69 ... cancelar co con solo ec pendiente se ignora como botón"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-69 ... confirmar un caso ya enviado en la sesión no autoriza nada"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cancelar estructurado quita solo su caso: con ec y co pendientes, cancelar co deja solo ec con la pregunta del servidor"
    requirement: UI-03
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#cancela_caso con dos casos quita solo ese caso y no autoriza nada (D-69)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-69 ... cancelar co deja solo ec pendiente"
        status: pass
    human_judgment: false
  - id: D4
    description: "POST /api/chat acepta accion estricta, la lleva hasta la compuerta y responde 400 ante un tipo desconocido o un campo extra"
    requirement: API-01
    verification:
      - kind: integration
        ref: "tests/http/chat.test.ts#POST /api/chat con accion estructurada (D-68)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Las garantías de la fase 2 siguen: autorización de un solo uso y por caso, confirmado true del modelo nunca basta, corpus del clasificador intacto"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-69 ... tras cancelar ec, un confirmado true del modelo sin autorización pendiente no envía"
        status: pass
      - kind: other
        ref: "bun test (1854 pass, 1 skip en vivo, 0 fail) y bun run check (exit 0)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-14
status: complete
---

# Phase 3 Plan 18: Accion estructurada por caso en la compuerta Summary

**POST /api/chat acepta `accion { tipo, caso }`. La compuerta la honra solo si su caso está pendiente: confirmar autoriza exactamente ese caso y cancelar (la decisión nueva CANCELA_CASO) quita solo ese caso. Si el caso no está pendiente, el texto visible pasa por el clasificador.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-15T02:42:06Z
- **Completed:** 2026-10-15T02:46:01Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- `TIPO_ACCION` (as const, en el guardián G6) y `DECISION_CONFIRMACION.CANCELA_CASO`. `abrirTurno` resuelve la cancelación de un caso con `estadoSin`, que ya existía.
- `EntradaTurno.accion` reemplaza la confirmación estructurada de la fase 2 (`{ aprobada, caso }`), que cancelaba todos los pendientes (WR-17). `decisionDe` aplica la precedencia de D-39 solo para casos pendientes.
- El cuerpo de `POST /api/chat` admite `accion` estricta (`z.enum(TIPO_ACCION)`, G15), y la ruta la lleva al turno tanto por SSE como por JSON.
- Las pruebas cubren la compuerta en los tres niveles: la política (unit), el bucle (D-68 y D-69 en compuerta-casos) y HTTP (confirmar envía; cancelar decide aunque el texto confirme; 400 ante un tipo desconocido o un campo extra).

## Task Commits

1. **Task 1: Tracer, un confirmar estructurado por POST /api/chat autoriza ese caso (D-68)** - `29c8083` (feat)
2. **Task 2: Cancelar quita solo ese caso y las acciones viejas o repetidas no autorizan nada (D-69)** - `bf198d0` (test)

**Plan metadata:** commit docs(03-18) de este resumen, el estado y la hoja de ruta

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts`: `CANCELA_CASO` y `TIPO_ACCION`
- `src/domain/types/confirmacion.type.ts`: variante `{ decision: CANCELA_CASO; caso }`
- `src/domain/policies/compuerta.policy.ts`: `abrirTurno` con CANCELA_CASO → `estadoSin(estado, caso)`
- `src/loop/types/turno.type.ts`: `AccionEstructurada` y `EntradaTurno.accion` (se borra `ConfirmacionEstructurada`)
- `src/loop/services/ejecutar-turno.service.ts`: `decisionDe` usa la accion solo si su caso está pendiente
- `src/http/schemas/chat-body.schema.ts`, `src/http/types/api.type.ts`, `src/http/routes/chat.route.ts`: `accion` en el cuerpo y `turnInput`
- `tests/architecture.test.ts`: `TIPO_ACCION` en `FAMILIAS_DE_CODIGOS`
- `tests/unit/compuerta.policy.test.ts`: tres casos de CANCELA_CASO y LIBRE sigue LIBRE
- `tests/loop/compuerta-casos.test.ts`: el bloque D-39 se reescribe como D-68 y se agrega el describe D-69
- `tests/http/chat.test.ts`: accion por HTTP, con la precedencia y los 400

## Decisions Made

- Una accion vale solo si su caso está pendiente en la sesión del servidor. Si no, se ignora y el mensaje visible se clasifica como texto normal (D-68, Pitfall 7).
- Cancelar estructurado quita solo su caso (D-69). Con eso quedan cerrados por la vía estructurada **WR-17** (el rechazo por botón de un caso cancelaba todos) y el **aviso de cancelación silenciosa de D-63.11** que figura en STATE.md. El rechazo por texto sigue cancelando todos los pendientes (D-63.11), porque el clasificador no cambió y nunca devuelve CANCELA_CASO.
- `ChatBody.accion` admite `undefined` de forma explícita porque así es la salida de zod `.optional()` con `exactOptionalPropertyTypes`. `EntradaTurno.accion` se mantiene estricta y la ruta solo la incluye cuando viene.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Prueba HTTP que demuestra que la accion llega a la compuerta**
- **Found during:** Task 1
- **Issue:** La prueba HTTP del plan (confirmar con el texto "Sí, envía <caso>") pasaría aunque la ruta descartara `accion`, porque el clasificador también confirma ese texto. No probaba el contrato.
- **Fix:** Se agregó "la accion viaja hasta la compuerta: cancelar decide aunque el texto visible confirme". Una prueba de mutación (la ruta sin `accion`) confirmó que esa prueba falla.
- **Files modified:** tests/http/chat.test.ts
- **Verification:** 5 pass en tests/http/chat.test.ts; el mutante falla en 1
- **Committed in:** 29c8083

**2. [Rule 1 - Test] Se agregó el caso de dos pendientes con un "sí" a secas al bloque D-68**
- **Found during:** Task 1
- **Issue:** Ninguna prueba mostraba que confirmar autoriza *exactamente* ese caso cuando hay otro pendiente.
- **Fix:** Con ec y co pendientes y el texto "sí" (que el clasificador toma como FALTA_CASO), confirmar ec envía solo ec y co sigue pendiente con la pregunta del servidor.
- **Files modified:** tests/loop/compuerta-casos.test.ts
- **Committed in:** 29c8083

---

**Total deviations:** 2 auto-fixed (pruebas adicionales; no cambia el alcance del código)
**Impact on plan:** Las dos pruebas extra refuerzan el contrato de D-68. No hay cambios de código fuera del plan.

## TDD Gate Compliance

Task 2 (`tdd="true"`) tiene un commit `test(03-18)` (bf198d0) después del `feat(03-18)` (29c8083), y no tiene un RED observable. El plan pone la implementación de CANCELA_CASO en `abrirTurno` y la rama cancelar de `decisionDe` en la Task 1 (pasos 1 y 2). Por eso las cuatro pruebas de D-69 pasaron al escribirlas, y es un GREEN inesperado que se explica por diseño. Para comprobar que las pruebas detectan la conducta planeada se usaron dos mutantes:
- **Mutante A** (CANCELA_CASO devuelve LIBRE, es decir, cancela todos): falla "con ec y co pendientes, cancelar co deja solo ec pendiente".
- **Mutante B** (la accion se honra aunque su caso no esté pendiente): falla "cancelar co con solo ec pendiente se ignora como botón".

Ambos mutantes se revirtieron. La Task 2 no necesitó cambios en `decisionDe` ni en `abrirTurno`.

## Issues Encountered

None

## User Setup Required

None. No hace falta configurar servicios externos.

## Next Phase Readiness

- El contrato `accion { tipo, caso }` está listo para las tarjetas por caso de 03-23 (botones Confirmar y Cancelar con texto visible y accion).
- SOLUCION.md (fase 4) puede registrar que WR-17 y el aviso de D-63.11 quedan resueltos por la vía estructurada, y que el rechazo por texto sigue cancelando todo (AR-02-06).

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-14*

## Self-Check: PASSED

- Commits 29c8083 y bf198d0 presentes en HEAD; archivos modificados presentes.
- Criterios: ConfirmacionEstructurada 0 en src y tests; CANCELA_CASO en compuerta.policy.ts; TIPO_ACCION.CONFIRMAR y TIPO_ACCION.CANCELAR en compuerta-casos; describe D-69 presente; confirmacion.policy.ts sin commits de este plan.
- Verificación: bun test 1854 pass, 1 skip (en vivo), 0 fail; bun run check exit 0.
