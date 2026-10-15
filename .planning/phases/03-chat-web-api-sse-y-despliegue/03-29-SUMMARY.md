---
phase: 03-chat-web-api-sse-y-despliegue
plan: 29
subsystem: agent-loop
tags: [compuerta, cierre-turno, simular-envio, gap-closure, G-03-26, AGT-03, T-02-41]

requires:
  - phase: 02
    provides: compuerta de confirmación (cerrarTurno, reabrirConocido, eventos ARMADO/BLOQUEADO/ENVIADO/FALLIDO) y cierreConPregunta
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: casoDeArgumentos con PATRON_CASO (03-28), así que los eventos de compuerta solo traen casos legibles
provides:
  - DESENLACE_ENVIO (REQUIERE_CONFIRMACION, SIN_PAQUETE, YA_ENVIADO, FALLIDO, SIN_CASO) y el tipo DesenlaceEnvio
  - TEXTO_ENVIO_NO_REGISTRADO, un aviso sin signos de pregunta por desenlace (YA_ENVIADO deriva ENVIO-SIMULADO.md de ARCHIVOS_SALIDA)
  - desenlacesDeEnvio(entrada), un desenlace por simular_envio de un caso legible que no terminó ENVIADO, plegado como cerrarTurno
  - cierreDelTurno(texto, desenlaces, pendientes), que arma el texto del modelo, el aviso y la pregunta; cierreConPregunta es el caso sin desenlaces
  - cerrarTurnoConCompuerta agrega el aviso en cada cierre de turno, con o sin pendiente
affects: [03-30, compuerta, cierre-turno, respuesta-turno, sse, ui-04]

actuals:
  tokens: 7600
  tasks: 2
  commits: 3
plan_head_before: 27e766a0fd4e9eb9b2dc852feb7425c5c8798fc1
plan_head_after: 6c54bf3f9b01444e759671e0f3e0c8ecc7f355bc

tech-stack:
  added: []
  patterns:
    - "El servidor agrega texto determinista al cierre y nunca reescribe la prosa del modelo: texto del modelo, luego el aviso y luego la pregunta, cada parte en su párrafo"
    - "Los desenlaces se calculan plegando los mismos eventos y mapas que la compuerta y se clasifican antes de aplicar cada evento"

key-files:
  created: []
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/domain/types/compuerta.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/config/strings.ts
    - src/domain/builders/cierre-turno.builder.ts
    - src/loop/services/cierre-turno.service.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/loop/compuerta.test.ts
    - tests/unit/compuerta.policy.test.ts
    - tests/unit/cierre-turno.builder.test.ts

key-decisions:
  - "G-03-26 (parte 1): cada proveedor_simular_envio de un caso legible que no terminó ENVIADO agrega un aviso determinista del servidor al cierre del turno, haya o no pendiente; la prosa del modelo queda intacta (AGT-03 y T-02-41 se mantienen)"
  - "Orden del cierre: texto del modelo (sin su pregunta final si hay pendiente), aviso y pregunta del servidor; la pregunta sigue siendo el último párrafo (D-44)"
  - "Un BLOQUEADO de un caso enviado da YA_ENVIADO; de un caso con paquete conocido o pendiente, REQUIERE_CONFIRMACION; de otro caso, SIN_PAQUETE. Un FALLIDO da FALLIDO. ARMADO, ENVIADO y un turno abortado no dan aviso"
  - "Los avisos repetidos (mismo desenlace y caso) salen una vez, en líneas del mismo párrafo"

patterns-established:
  - "cierreDelTurno es el único armado del texto final del turno; cierreConPregunta queda como atajo sin desenlaces para las pruebas"

requirements-completed: [UI-04, UI-03, API-01]

coverage:
  - id: D1
    description: "Escenario A (G-03-26): una sesión nueva que pide 'Sí, envía co-industrias-delta' queda bloqueada y la afirmación del modelo sale seguida del aviso SIN_PAQUETE, con needsConfirmation false y sin ENVIO-SIMULADO.md"
    requirement: "UI-04"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#escenario A: 'Sí, envía co' en una sesión nueva queda bloqueado y la afirmación del modelo sale seguida del aviso"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#simular(ec) en una sesión nueva queda bloqueado y needsConfirmation es false"
        status: pass
      - kind: e2e
        ref: "HTTP local_stack (scratch copy, fake LLM, NODE_ENV=production): POST /api/chat {sessionId:null, message:'Sí, envía co-industrias-delta'} -> reply termina con el aviso SIN_PAQUETE, needsConfirmation false, sin ENVIO-SIMULADO.md"
        status: pass
    human_judgment: false
  - id: D2
    description: "Escenarios B, C y FALLIDO: REQUIERE_CONFIRMACION antes de la pregunta, YA_ENVIADO sin reabrir el caso y FALLIDO antes de la pregunta con la que el caso vuelve a quedar pendiente"
    requirement: "API-01"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#escenario B: armar ec y simular ec en el mismo turno deja el aviso de confirmación antes de la pregunta (D-44)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#escenario C: un reintento sobre un caso ya enviado dice que ya tiene un envío registrado y no lo reabre (D-63.4)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#FALLIDO: un envío autorizado que la herramienta rechaza deja el aviso antes de la pregunta (D-63.7)"
        status: pass
    human_judgment: false
  - id: D3
    description: "desenlacesDeEnvio clasifica cada evento con la misma lógica de pliegue que cerrarTurno, y un turno abortado no da desenlaces"
    requirement: "API-01"
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#desenlacesDeEnvio (G-03-26, D-44, D-63.4, D-63.7)"
        status: pass
    human_judgment: false
  - id: D4
    description: "cierreDelTurno: sin desenlaces es igual a cierreConPregunta; aviso tras el texto, pregunta al final, texto vacío, repetidos una vez, SIN_CASO pintado y ningún aviso con signos de pregunta"
    requirement: "UI-03"
    verification:
      - kind: unit
        ref: "tests/unit/cierre-turno.builder.test.ts#cierreDelTurno: texto del modelo, aviso del servidor y pregunta (G-03-26, D-44)"
        status: pass
      - kind: unit
        ref: "tests/loop/compuerta-casos.test.ts#ningún aviso pregunta: los cinco desenlaces se dicen sin signos de pregunta"
        status: pass
    human_judgment: false
  - id: D5
    description: "Un turno sin simular_envio, o cuyo simular_envio terminó ENVIADO, responde con el mismo texto que antes"
    requirement: "UI-03"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un turno sin simular_envio responde igual que antes"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un turno cuyo simular_envio terminó ENVIADO responde igual que antes"
        status: pass
    human_judgment: false
  - id: D6
    description: "En la UI el aviso se lee como lenguaje claro en el último mensaje del agente (UI-04, supuesto de la sonda de bordes)"
    requirement: "UI-04"
    verification: []
    human_judgment: true
    rationale: "Que el aviso sea el 'lenguaje claro' que pide UI-04 y se lea bien como texto del agente, sin tarjeta propia, es un juicio de producto en el navegador que ninguna prueba afirma"

duration: 9min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 29: Aviso del servidor para envíos simulados que no ocurrieron Summary

**El cierre del turno agrega un aviso determinista por cada proveedor_simular_envio de un caso legible que no terminó ENVIADO (requiere confirmación, sin paquete, ya enviado o fallido). La prosa del modelo no se toca y la pregunta del servidor sigue siendo el último párrafo.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-15T16:54:38Z
- **Completed:** 2026-10-15T17:03:41Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Escenario A de G-03-26 cerrado. En una sesión nueva, "Sí, envía co-industrias-delta" con una afirmación falsa del modelo termina con "No se registró el envío simulado de co-industrias-delta: su paquete no está armado en esta sesión; primero hay que armarlo y después confirmar el envío.", con needsConfirmation false. Se comprobó por el bucle y por HTTP (receta T24).
- Escenarios B, C y FALLIDO. El aviso REQUIERE_CONFIRMACION o FALLIDO va antes de la pregunta del servidor. YA_ENVIADO nombra ENVIO-SIMULADO.md y no reabre el caso.
- El dominio del aviso queda completo: `DESENLACE_ENVIO`, `DesenlaceEnvio`, `TEXTO_ENVIO_NO_REGISTRADO` (cinco textos, SIN_CASO incluido) y `cierreDelTurno`, que sabe pintar SIN_CASO para cuando 03-30 lo produzca.
- Un turno sin simular_envio, con un simular_envio ENVIADO o abortado responde igual que antes.

## Task Commits

1. **Task 1: Trazador, escenario A** - `a8f0658` (feat)
2. **Task 2: Todos los desenlaces y filas fijadas.** RED `1e7070e` (test), GREEN `6c54bf3` (feat). No hizo falta refactor.

**Plan metadata:** commit docs(03-29) de este SUMMARY

## TDD Gate Compliance (Task 2)

- **RED** `1e7070e`: 14 fallos, todos en aserciones de desenlace o de texto final y ninguno de carga: 8 filas de `desenlacesDeEnvio`, D-38 (G-02-3), AGT-04, "tras cancelar ec", y los escenarios B, C y FALLIDO. El clasificador `gsd_run check tdd-red-evidence` sobre el reporte JUnit de `bun test tests/unit/compuerta.policy.test.ts --reporter=junit` devolvió `RED_EVIDENCE_OK` (target_test_failed; target "un bloqueado de un caso ya enviado en la sesión da YA_ENVIADO", 79 tests, 8 fail). Evaluación semántica: el objetivo corrió y falló porque esperaba `[{tipo: ya_enviado, caso: ec-corp-andina}]` y recibió `[]`, que es el motivo planeado (la tarea 1 solo clasificaba SIN_PAQUETE).
- Las filas unitarias de `cierreDelTurno` ya pasaban en RED, porque la tarea 1 dejó el builder completo. Las filas rojas fueron las de la política y las del bucle.
- **GREEN** `6c54bf3`: `desenlacesDeEnvio` clasifica las cuatro ramas de un caso legible. Pasan 2174 pruebas, con 0 fallos.

## Filas fijadas que cambiaron (con su motivo)

Todas cambian por la misma razón: un simular_envio de un caso legible que no terminó ENVIADO ahora deja el aviso del servidor en el texto final.

| Fila | Antes | Ahora |
|------|-------|-------|
| D-63.1 `simular(ec) en una sesión nueva…` (compuerta-casos) | `"Hecho."` | `"Hecho."` + párrafo + aviso SIN_PAQUETE de ec |
| D-38 `dos simular(ec) en el turno confirmado…` (G-02-3), turno 2 | `"Hecho."` | `"Hecho."` + párrafo + aviso YA_ENVIADO de ec |
| AGT-04 `los reintentos tras el envío…`, turno 3 | `"Hecho."` | `"Hecho."` + párrafo + aviso YA_ENVIADO de ec |
| D-69 `tras cancelar ec, un confirmado true…` | sin aserción de texto | se agrega `"Hecho."` + aviso REQUIERE_CONFIRMACION + pregunta de ec |
| CR-02 `un texto del modelo sin pregunta sigue cerrando…` (tests/loop/compuerta.test.ts) | texto del turno 1 + pregunta | texto del turno 1 + aviso REQUIERE_CONFIRMACION + pregunta (el guion arma y simula en el mismo turno, que es la forma del escenario B) |

Las filas que solo miran el último párrafo (`terminaPreguntandoPor`, `vuelvePreguntandoPorEc`, `ultimoParrafo` en tests/live) no cambian, porque la pregunta sigue al final.

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts`: `DESENLACE_ENVIO` as const.
- `src/domain/types/compuerta.type.ts`: unión `DesenlaceEnvio` (SIN_CASO con caso null, el resto con caso string).
- `src/domain/policies/compuerta.policy.ts`: `desenlaceDeEvento` y `desenlacesDeEnvio`, que reusan `conocido` y `aplicarEvento`.
- `src/config/strings.ts`: `TEXTO_ENVIO_NO_REGISTRADO` con `satisfies Record<ValorDe<typeof DESENLACE_ENVIO>, …>`.
- `src/domain/builders/cierre-turno.builder.ts`: `cierreDelTurno`; `cierreConPregunta` delega en él.
- `src/loop/services/cierre-turno.service.ts`: `cerrarTurnoConCompuerta` usa `cierreDelTurno(…, desenlacesDeEnvio(entrada), pendientes)`.
- `tests/loop/compuerta-casos.test.ts`, `tests/loop/compuerta.test.ts`, `tests/unit/compuerta.policy.test.ts` y `tests/unit/cierre-turno.builder.test.ts`: escenarios, filas unitarias y filas fijadas actualizadas.

## Decisions Made

- `cierreDelTurno` devuelve el texto del modelo tal cual cuando no hay ni desenlaces ni pendientes, y así conserva byte a byte la salida de antes. Con aviso y sin pendiente usa `trimEnd()` antes de unir los párrafos.
- La deduplicación se hace sobre el texto del aviso, que es función pura de (desenlace, caso). Equivale a deduplicar por desenlace y caso.
- `needsConfirmation`, `eventosConfirmacion`, `EntradaCierreTurno` y `agent/prompt.md` no cambian.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] La clasificación de la tarea 1 se limitó a SIN_PAQUETE**
- **Found during:** Task 1
- **Issue:** al implementar todas las ramas en la tarea 1, D-38 y AGT-04 (filas que el plan actualiza en la tarea 2) fallaban, y el verify del trazador (`bun test tests/loop/compuerta-casos.test.ts`) no quedaba en verde. Tampoco habría quedado un RED real para la tarea 2.
- **Fix:** en la tarea 1, `desenlaceDeEvento` solo devuelve SIN_PAQUETE. Las demás ramas llegan en el GREEN de la tarea 2, como pide el plan ("en esta tarea basta que la clasificación cubra el escenario A").
- **Files modified:** src/domain/policies/compuerta.policy.ts
- **Verification:** el trazador quedó en 44 pass / 0 fail y la suite completa en 2150 pass. El RED de la tarea 2 fue válido.
- **Committed in:** a8f0658

**2. [Rule 1 - Bug] Una fila fijada fuera de compuerta-casos (CR-02 en tests/loop/compuerta.test.ts)**
- **Found during:** Task 2 (GREEN, corrida completa)
- **Issue:** la fila fija el texto final exacto tras armar y simular en el mismo turno, que es la forma del escenario B, y no incluía el aviso.
- **Fix:** se agregó el aviso REQUIERE_CONFIRMACION entre el texto del modelo y la pregunta. El plan prevé este caso: "cualquier otra fila que la corrida completa de `bun test` muestre con el mismo motivo".
- **Files modified:** tests/loop/compuerta.test.ts
- **Verification:** `bun test` dio 2174 pass / 0 fail.
- **Committed in:** 6c54bf3

**3. [Rule 3 - Blocking] Orden de imports de Biome en el commit RED**
- **Found during:** Task 2
- **Issue:** el commit RED `1e7070e` quedó con el import de `ValorDe` fuera del orden de Biome. `bun run check` falló y el pipe con `tail` lo ocultó.
- **Fix:** se aplicó `biome check --write` al archivo, dentro del commit GREEN.
- **Files modified:** tests/loop/compuerta-casos.test.ts
- **Verification:** `bun run check` sale con código 0.
- **Committed in:** 6c54bf3

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking).
**Impact on plan:** ninguno de alcance. El plan preveía las filas actualizadas y el orden de las ramas entre tareas.

## Issues Encountered

- Durante la evidencia RED, un intento de hacer `source` del resolver en markdown dejó la shell colgada. Se pasó a un script en el scratchpad. No tocó el repo.

## Verification

- `bun test`: 2174 pass, 1 skip (live), 0 fail.
- `bun run check` (tsc, tsc web, Biome y bun audit): código 0.
- `bun test tests/architecture.test.ts tests/sin-comentarios.test.ts`: 79 pass.
- Receta T24 por HTTP, con copia scratch, LLM falso y servidor en producción en el puerto 3029. `POST /api/chat {"sessionId":null,"message":"Sí, envía co-industrias-delta"}` devuelve `toolCalls` `[proveedor_simular_envio, ok:false, CONFIRMACION_REQUERIDA]`, needsConfirmation false, sin ENVIO-SIMULADO.md en `out/`, y el reply termina con el aviso SIN_PAQUETE. La línea `gate_blocked` sigue sin caso, porque eso es de 03-30.
- `agent/prompt.md` y `reto-01/` sin cambios.

## User Setup Required

None. No hace falta configurar servicios externos.

## Next Phase Readiness

- Listo para 03-30: falta contar los simular_envio sin caso legible (escenario D, que ya tiene `DESENLACE_ENVIO.SIN_CASO`, su texto y su pintado), escribir la línea `gate_blocked` con el caso y probar el escenario A por HTTP. G-03-26 queda cerrado del todo con 03-30.
- Supuesto abierto (D6): el aviso como "lenguaje claro" de UI-04, revisado en el navegador al final de la fase.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

- Commits a8f0658, 1e7070e y 6c54bf3 presentes en HEAD.
- Archivos modificados presentes; `bun test` 2174 pass / 0 fail y `bun run check` en verde.
