---
phase: 03-chat-web-api-sse-y-despliegue
plan: 46
subsystem: api
tags: [compuerta, avisos-servidor, d-76.2, wr-02, wr-03, in-05, bun-test]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "TRUNCADO en la compuerta, aviso SIN_CASO y regla del reintento para el truncado (03-40, D-76.1)"
provides:
  - "EVENTO_COMPUERTA.TRUNCADO_CONFIRMADO y DESENLACE_ENVIO.TRUNCADO_CONFIRMADO, con su texto propio en TEXTO_ENVIO_NO_REGISTRADO"
  - "anotarEnviosTruncados distingue el caso confirmado del turno (casoDeLlamada === turno.autorizacion.caso)"
  - "Texto SIN_CASO de D-76.2: 'Un intento de envío no indicó un caso válido y no se registró.'"
  - "aplicarEvento con rama default tipada never (IN-05)"
  - "Fila 'Aviso de envío no registrado' de 03-UI-SPEC.md con los textos de D-76.2"
affects: [03-47, cierre-turno, compuerta, chat-route]

actuals:
  tokens: 4840
  tasks: 2
  commits: 2
plan_head_before: 021756f16fc93c26fc56b1cc74089e738d9cb393
plan_head_after: 17f55003379203dd9e3ee9d4af5358bb6ab3b780

tech-stack:
  added: []
  patterns:
    - "Variante de evento nueva en lugar de un booleano en TRUNCADO: los switch con tipo de retorno y el never de aplicarEvento exigen la rama nueva"
    - "Desenlace derivado: TRUNCADO_CONFIRMADO reutiliza desenlaceDeBloqueo y solo reemplaza REQUIERE_CONFIRMACION, así YA_ENVIADO y SIN_PAQUETE conservan su precedencia"

key-files:
  created: []
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/config/strings.ts
    - src/domain/types/compuerta.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/loop/services/paso-herramientas.service.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/unit/compuerta.policy.test.ts
    - .planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md

key-decisions:
  - "El truncado confirmado se decide en el bucle comparando casoDeLlamada (PATRON_CASO sobre los argumentos originales) con turno.autorizacion.caso, usada o no; un JSON cortado nunca se repara"
  - "El never de IN-05 se asigna sin return: Biome (noVoidTypeReturn) prohíbe devolver valor en una función void, y la asignación sola ya hace fallar tsc"

patterns-established:
  - "Exhaustividad de pliegues void: default con const _sinCubrir: never = evento"

requirements-completed: [API-01, UI-04]

coverage:
  - id: D1
    description: "WR-03: un simular_envio cortado por FIN_LLM.LIMITE de un caso confirmado deja 'No se registró el envío simulado de {caso}: se cortó antes de ejecutarse y hay que pedirlo de nuevo.' seguido de la pregunta, sin ejecutar ni consumir la autorización, igual por SSE y JSON"
    requirement: "API-01"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-76.2: los avisos del servidor son exactos > WR-03: un envío confirmado que se corta por el límite dice que se cortó, vuelve a preguntar y el 'envía' siguiente envía una sola vez"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-76.1: un reintento del mismo caso legible manda sobre su intento truncado > un truncado de ec sin reintento no quema la autorización: vuelve a preguntar y el 'envía' siguiente envía una vez"
        status: pass
    human_judgment: false
  - id: D2
    description: "Sin confirmación del caso en el turno, el truncado legible sigue dejando REQUIERE_CONFIRMACION"
    requirement: "UI-04"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-76.2: los avisos del servidor son exactos > sin confirmación del caso en el turno, el truncado legible sigue diciendo que falta la confirmación"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-02: el aviso SIN_CASO habla solo del intento ilegible y no niega el envío registrado en el mismo turno"
    requirement: "UI-04"
    verification:
      - kind: unit
        ref: "tests/loop/compuerta-casos.test.ts#D-76.2: los avisos del servidor son exactos > copia decidida: el aviso sin caso habla solo del intento ilegible y el truncado confirmado dice que se cortó"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#D-76.1: un reintento del mismo caso legible manda sobre su intento truncado > un truncado sin caso legible seguido de un envío correcto de ec deja el aviso SIN_CASO y el envío registrado una vez"
        status: pass
    human_judgment: false
  - id: D4
    description: "Precedencia y regla del reintento del truncado confirmado en el dominio (YA_ENVIADO, SIN_PAQUETE, reintento, otro caso, SIN_CASO, abortado)"
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#desenlacesDeEnvio (G-03-26, D-44, D-63.4, D-63.7)"
        status: pass
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#cerrarTurno (D-37, D-63.1, D-63.2)"
        status: pass
    human_judgment: false
  - id: D5
    description: "IN-05: aplicarEvento exhaustivo; una variante sin rama hace fallar tsc"
    verification:
      - kind: other
        ref: "bun run check (y prueba manual: quitar la rama TRUNCADO_CONFIRMADO da TS2322 'not assignable to type never')"
        status: pass
    human_judgment: false
  - id: D6
    description: "La fila 'Aviso de envío no registrado' de 03-UI-SPEC.md registra los textos de D-76.2"
    verification:
      - kind: other
        ref: "grep -c 'Un intento de envío no indicó un caso válido y no se registró.' 03-UI-SPEC.md = 1"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 46: Avisos exactos del servidor para el envío truncado (D-76.2) Summary

**Evento y desenlace TRUNCADO_CONFIRMADO con texto propio ("se cortó antes de ejecutarse y hay que pedirlo de nuevo") cuando el modelo corta un envío que la usuaria confirmó, aviso SIN_CASO que habla solo del intento ilegible, y aplicarEvento exhaustivo con never**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-15T23:02:03Z
- **Completed:** 2026-10-15T23:05:15Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- WR-03: el truncado de un caso confirmado en el turno ya no dice "falta tu confirmación explícita"; deja el aviso propio seguido de la pregunta del servidor, sin ejecutar, sin escribir ENVIO-SIMULADO.md y sin consumir la autorización. El "envía" siguiente envía una sola vez.
- WR-02: el aviso SIN_CASO es "Un intento de envío no indicó un caso válido y no se registró." y ya no niega un envío registrado en el mismo turno.
- YA_ENVIADO y SIN_PAQUETE conservan su precedencia sobre el truncado confirmado, y la regla del reintento de 03-40 vale para los dos tipos de truncado (`casoDeTruncado`).
- IN-05: `aplicarEvento` termina con `default` que asigna el evento a `never`. Se comprobó que quitar una rama hace fallar tsc.
- 03-UI-SPEC.md registra los dos textos de D-76.2.

## Task Commits

1. **Task 1: Trazador D-76.2 (constantes, textos, variante, política, emisión en el bucle y pruebas del bucle)** - `fbcafa4` (fix)
2. **Task 2: Filas de dominio, exhaustividad de aplicarEvento y UI-SPEC** - `17f5500` (test)

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts` - TRUNCADO_CONFIRMADO en EVENTO_COMPUERTA y DESENLACE_ENVIO
- `src/config/strings.ts` - texto SIN_CASO de D-76.2 y texto del truncado confirmado
- `src/domain/types/compuerta.type.ts` - variante `{ tipo: TRUNCADO_CONFIRMADO; caso: string }`
- `src/domain/policies/compuerta.policy.ts` - pliegue, `desenlaceDeTruncadoConfirmado`, `casoDeTruncado` y `default` never
- `src/loop/services/paso-herramientas.service.ts` - `eventoDeTruncado` compara con `turno.autorizacion.caso`
- `tests/loop/compuerta-casos.test.ts` - describe "D-76.2: los avisos del servidor son exactos" y la expectativa nueva del truncado sin reintento
- `tests/unit/compuerta.policy.test.ts` - helper `truncadoConfirmado` y filas de desenlaces, cierre y enviados
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md` - fila "Aviso de envío no registrado" con D-76.2

## Decisions Made

- El caso confirmado se decide en el bucle en el momento del corte, con igualdad exacta entre `casoDeLlamada(llamada)` y `turno.autorizacion.caso`, se haya usado la autorización o no. Así no cambia `EntradaDesenlaces` ni el builder del cierre.
- La rama never de IN-05 no hace `return`, porque Biome (`noVoidTypeReturn`) lo rechaza en una función void. La asignación sola ya da el error de tipos.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] La rama `default` de IN-05 no devuelve la constante never**
- **Found during:** Task 2
- **Issue:** el plan pedía asignar el evento a una constante `never` y devolverla, pero Biome marca `lint/correctness/noVoidTypeReturn` porque `aplicarEvento` devuelve void, y `bun run check` fallaba.
- **Fix:** `default: { const _sinCubrir: never = evento; }` sin `return`. El guion bajo evita la advertencia de variable sin uso.
- **Files modified:** src/domain/policies/compuerta.policy.ts
- **Verification:** `bun run check` en verde. Quitar temporalmente la rama TRUNCADO_CONFIRMADO da `TS2322: ... is not assignable to type 'never'`.
- **Committed in:** 17f5500

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** ninguno. La garantía de exhaustividad es la misma.

## Issues Encountered

None

## Verification

- `bun test`: 2303 pass, 1 skip (ya existía), 0 fail.
- `bun run check` (tsc, tsc web, Biome y bun audit) en verde.
- `cierre-turno.builder.ts`, `guardado-turno.service.ts`, `cierre-turno.service.ts` y `agent/prompt.md` no cambian.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WR-02, WR-03 e IN-05 están cerrados. Esto también cierra el ítem humano 8 de 03-VERIFICATION.md (copia de D-76.1), que ya decidió la usuaria.
- IN-04 sigue diferido a 03-47.

## Self-Check: PASSED

- Archivos modificados presentes; commits `fbcafa4` y `17f5500` en HEAD.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
