---
phase: 03-chat-web-api-sse-y-despliegue
plan: 40
subsystem: loop
status: complete
tags: [compuerta, d-76.1, g-03-26, truncado, finish_reason-length]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "D-76: desenlacesDeEnvio y cierreDelTurno con avisos TEXTO_ENVIO_NO_REGISTRADO (G-03-26)"
provides:
  - "EVENTO_COMPUERTA.TRUNCADO y su variante en EventoCompuerta (caso string | null)"
  - "pasoTruncado(turno, respuesta) anota un TRUNCADO por cada proveedor_simular_envio cortado por FIN_LLM.LIMITE"
  - "Regla del reintento del mismo caso legible (reintentadoDespues) en desenlacesDeCasos"
affects: [compuerta, cierre del turno, respaldo JSON, verificación de la fase 03]

actuals:
  tokens: 5297
  tasks: 2
  commits: 4
plan_head_before: ef584f18afe5dc96505df76b5b90ba57b6872564
plan_head_after: 310fe1157114a514e25565680b48a951836ca1b1

tech-stack:
  added: []
  patterns:
    - "Un evento de compuerta sin ejecución (TRUNCADO) se pliega como BLOQUEADO del caso legible o como envío sin caso"
    - "Un desenlace de un intento truncado se descarta si un intento posterior del mismo caso habla por él"

key-files:
  created: []
  modified:
    - src/config/constants/confirmation.constants.ts
    - src/domain/types/compuerta.type.ts
    - src/domain/policies/compuerta.policy.ts
    - src/loop/services/paso-herramientas.service.ts
    - tests/loop/compuerta-casos.test.ts
    - tests/unit/compuerta.policy.test.ts

key-decisions:
  - "D-76.1 aplicado: un proveedor_simular_envio truncado con caso legible deja el aviso clasificado como un BLOQUEADO (YA_ENVIADO, SIN_PAQUETE o REQUIERE_CONFIRMACION); sin caso legible deja SIN_CASO"
  - "La regla del reintento aplica solo al TRUNCADO con caso legible: un intento posterior del mismo caso (BLOQUEADO, ENVIADO, FALLIDO o TRUNCADO) manda sobre él; un intento de otro caso no lo reemplaza"
  - "El TRUNCADO sin caso legible deja siempre SIN_CASO aunque otro simular_envio del turno termine ENVIADO, igual que el camino {} + envío del escenario D; solo un turno abortado lo quita"
  - "pasoTruncado sigue sin ejecutar nada: no consume ni concede la autorización del turno, no escribe ENVIO-SIMULADO.md ni log.jsonl y no emite gate_blocked"

patterns-established:
  - "casoIntentado(evento) da el caso de cualquier intento de envío (todo evento salvo ARMADO)"

requirements-completed: [UI-04, API-01, SEG-01]

coverage:
  - id: D1
    description: "Un simular_envio truncado sin caso legible que el modelo da por hecho termina con su afirmación seguida del aviso SIN_CASO, también en el respaldo JSON (regresión del verificador)"
    requirement: "API-01"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#regresión del verificador: 'Sí, envía co' con el JSON cortado a mitad deja la afirmación seguida del aviso SIN_CASO"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un paso truncado con generar_formulario y un simular_envio sin caso legible deja un solo aviso SIN_CASO"
        status: pass
    human_judgment: false
  - id: D2
    description: "Un simular_envio truncado con caso legible deja el aviso de ese caso (SIN_PAQUETE o REQUIERE_CONFIRMACION con la pregunta al final) y no quema la autorización"
    requirement: "UI-04"
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un simular_envio truncado con caso legible y sin paquete en la sesión deja el aviso SIN_PAQUETE de ese caso"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un truncado de ec sin reintento no quema la autorización: vuelve a preguntar y el 'envía' siguiente envía una vez"
        status: pass
    human_judgment: false
  - id: D3
    description: "Un reintento del mismo caso legible manda sobre su intento truncado; el truncado sin caso deja siempre SIN_CASO; filas de dominio para desenlacesDeEnvio, cerrarTurno y enviadosTrasEventos"
    requirement: "SEG-01"
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#desenlacesDeEnvio (G-03-26, D-44, D-63.4, D-63.7)"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un truncado de ec seguido de un reintento enviado de ec no deja aviso y envía una sola vez"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un truncado sin caso legible seguido de un envío correcto de ec deja el aviso SIN_CASO y el envío registrado una vez"
        status: pass
    human_judgment: false

duration: 4 min
completed: 2026-10-15
---

# Fase 03 Plan 40: Un simular_envio truncado deja su aviso (D-76.1) Summary

**Evento de compuerta `TRUNCADO` que anota `pasoTruncado` por cada `proveedor_simular_envio` cortado por `FIN_LLM.LIMITE`, plegado como un BLOQUEADO del caso legible o como SIN_CASO, con la regla de que un reintento del mismo caso legible manda sobre el intento truncado. Cierra G-03-26 en el camino truncado y el IN-01 del review.**

## Performance

- **Duración:** 4 min
- **Inicio:** 2026-10-15T20:01:15Z
- **Fin:** 2026-10-15T20:03:59Z
- **Tareas:** 2
- **Archivos modificados:** 6

## Accomplishments

- La regresión exacta del verificador pasa. "Sí, envía co-industrias-delta" con el JSON cortado a mitad y la afirmación "Registré el envío simulado de co-industrias-delta." termina con la afirmación + `SEPARADOR_PARRAFOS` + el aviso SIN_CASO, y `needsConfirmation` queda false. No existe ENVIO-SIMULADO.md y `respuestaDeTurno(eventos).reply` trae el mismo texto.
- Un truncado con caso legible recibe la misma clasificación que un BLOQUEADO. Si el caso tiene paquete conocido y no se envió, vuelve a quedar pendiente con la pregunta del servidor al final. El "envía" siguiente lo envía una sola vez porque el truncado no consumió la autorización.
- Un reintento del mismo caso legible manda sobre el truncado: si termina ENVIADO no queda aviso. Un truncado sin caso legible deja siempre SIN_CASO, una sola vez y al final.

## Task Commits

1. **Tarea 1 (trazador): el simular_envio truncado deja su aviso**
   - `9daa33d` (test): regresión del verificador, caso legible SIN_PAQUETE y paso truncado mixto (RED)
   - `fce80d7` (feat): `EVENTO_COMPUERTA.TRUNCADO`, variante del tipo, pliegue y desenlaces en la política, y `pasoTruncado(turno, respuesta)` (GREEN)
2. **Tarea 2 (TDD): regla del reintento y filas de dominio**
   - `c8eafa3` (test): 18 filas de dominio con `truncado(...)` y 3 pruebas del bucle (RED)
   - `310fe11` (feat): `casoIntentado`, `reintentadoDespues` y `reemplazadoPorReintento` en `desenlacesDeCasos` (GREEN)

No hubo commit de REFACTOR porque no hizo falta limpiar nada.

## TDD

- **RED, tarea 1:** fallaron las 3 pruebas nuevas, cada una en su `expect(textoFinal(...)).toBe(...)`. El texto final salía sin aviso, que era la brecha. 58 pass y 3 fail en `tests/loop/compuerta-casos.test.ts`. Evaluación semántica: las pruebas objetivo se ejecutaron y fallaron en la aserción planeada, sin errores de carga ni de sintaxis.
- **RED, tarea 2:** fallaron exactamente las filas que dependen de la regla del reintento: `[truncado(EC), enviado(EC)]`, `[truncado(EC), truncado(EC)]`, `[truncado(EC), bloqueado(EC)]` y la prueba del bucle del reintento exitoso. Esa prueba recibió la afirmación seguida de "No se registró el envío simulado de ec-corp-andina: falta tu confirmación explícita.". El resto de las filas nuevas ya estaban verdes gracias a la tarea 1. 163 pass y 4 fail. Evaluación semántica: el fallo es el esperado, porque el aviso de un truncado negaba un envío que su reintento sí registró.
- **GREEN:** 308 pass y 0 fail en las suites de la verificación de la tarea 2. `bun run check` también pasa (tsc, tsc web, Biome y bun audit). En `bun test` completo, 2260 pass y 0 fail.
- No se produjo un registro `tdd-red-evidence` en formato TAP, porque el reporter de `bun test` no es uno de los formatos que admite el clasificador. La evidencia es la salida real de `bun test` resumida arriba.

## Files Created/Modified

- `src/config/constants/confirmation.constants.ts`: `EVENTO_COMPUERTA.TRUNCADO`.
- `src/domain/types/compuerta.type.ts`: variante `{ tipo: TRUNCADO; caso: string | null }`.
- `src/domain/policies/compuerta.policy.ts`: TRUNCADO en `aplicarEvento` y `desenlaceDeEvento` (que extrae `desenlaceDeBloqueo`, compartido con BLOQUEADO). `hayEnvioSinCaso` agrega SIN_CASO por un truncado sin caso, y `desenlacesDeCasos` aplica la regla del reintento.
- `src/loop/services/paso-herramientas.service.ts`: `esSimularEnvio` y `anotarEnviosTruncados`. `pasoTruncado(turno, respuesta)` lee el caso de los argumentos originales con `casoDeLlamada`.
- `tests/loop/compuerta-casos.test.ts`: dos describes de D-76.1 con 6 pruebas, y los helpers `simularCrudo` y `pasoCortado`.
- `tests/unit/compuerta.policy.test.ts`: helper `truncado` más filas en `cerrarTurno`, `enviadosTrasEventos` y `desenlacesDeEnvio`.

## Decisions Made

- Se siguió la regla del reintento del plan sin cambios. Para no duplicar la clasificación de BLOQUEADO, se extrajo `desenlaceDeBloqueo`, que reutilizan BLOQUEADO y TRUNCADO.
- El aviso nunca repite los argumentos crudos del modelo (SEG-01). El caso sale siempre de `casoDeLlamada`, que exige PATRON_CASO por igualdad exacta, y un JSON cortado nunca se repara.

## Deviations from Plan

Ninguna. El plan se ejecutó tal como estaba escrito.

Revisión del diff:
- La fila "los desenlaces salen en el orden de los eventos" de `tests/unit/compuerta.policy.test.ts` conserva sus eventos y su resultado. El diff de ese archivo no tiene líneas borradas.
- `guardado-turno.service.ts`, `cierre-turno.builder.ts` y `src/config/strings.ts` no cambian.
- La prueba CR-03 de `tests/loop/resiliencia.test.ts` pasa sin cambios.

## Issues Encountered

Ninguno.

## Known Stubs

Ninguno.

## Next Phase Readiness

- G-03-26 queda cerrado también en el camino truncado. Siguen los planes 03-41 a 03-43 del segundo cierre de brechas.
- Sigue abierto, y se revisa a mano en la verificación de la fase, el edge UI-04 que el informe de cobertura dejó sin clasificar (flagged_assumptions del plan).
- Hay un costo conocido, aceptado por el plan. Si el corte deja el caso ilegible y el modelo reintenta bien en el mismo turno, la respuesta lleva el aviso SIN_CASO junto a un envío que sí se registró.

## Self-Check: PASSED

- Los 6 archivos modificados existen.
- Los commits `9daa33d`, `fce80d7`, `c8eafa3` y `310fe11` están en HEAD.
- Criterios de aceptación: `TRUNCADO: "truncado"` aparece 1 vez. `EVENTO_COMPUERTA.TRUNCADO` aparece en los 3 archivos de src. `FIN_LLM.LIMITE` aparece 1 vez en las pruebas del bucle. `pasoTruncado(turno, respuesta)` aparece 1 vez. `truncado(` aparece 20 veces en la prueba unitaria.
- `bun run check` y `bun test` completo (2260 pass, 0 fail) pasan.
