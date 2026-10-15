---
phase: 03-chat-web-api-sse-y-despliegue
plan: 23
subsystem: ui
tags: [react, confirmacion, compuerta, accion, progreso, a11y, d-68, d-69]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-18: accion { tipo, caso } en POST /api/chat y CANCELA_CASO en la compuerta; 03-16: confirmation_required con caso y bloqueosLegibles; 03-21: resultadosPorCaso y TarjetaResultado; 03-22: progresoPorCaso, TurnoConversacion.confirmaciones y ESTADO_ETAPA.CANCELADA"
provides:
  - "reducirConfirmaciones(tarjetas, { turno, completo }) en web/src/state/confirmaciones.ts: máquina pura de tarjetas que solo avanza con los eventos del turno terminado (abierta, registrada, reemplazada, cancelada)"
  - "EstadoConversacion.tarjetasConfirmacion y el enviando por tarjeta (ENVIAR con accion)"
  - "TarjetaConfirmacion y PilaConfirmaciones con Confirmar y Cancelar; useChat.responderConfirmacion manda el texto visible más la accion"
  - "enviarMensaje manda { sessionId, message, accion } solo cuando hay accion"
  - "progresoPorCaso({ turnos, enCurso, tarjetasConfirmacion }): etapa 5 cancelada al cierre del turno en que la tarjeta quedó 'Envío cancelado'"
  - "anuncioDeEstado agrega 'Confirmación requerida para {casos}' cuando el turno abrió tarjetas"
affects: [03-25 hidratación de tarjetas vigentes, 03-26, 03-27, SOLUCION.md]

actuals:
  tokens: 11427
  tasks: 2
  commits: 3
plan_head_before: 533b922eade7a56c6734a4b88cf5a2920f4e172a
plan_head_after: c3304c7eb9123f830d25bd2c6b1d05e1bf99738c

tech-stack:
  added: []
  patterns:
    - "Las tarjetas se deciden solo al cerrar el turno (turn_end, o el corte del stream como turno incompleto) y desde sus eventos; el clic solo marca 'enviando'"
    - "Un turno incompleto (corte, error de red o HTTP, o SESION_OCUPADA) nunca cancela una tarjeta, porque sin la repetición de pendientes del cierre no se sabe qué quedó pendiente"

key-files:
  created:
    - web/src/state/confirmaciones.ts
    - web/src/components/tarjeta-confirmacion.tsx
    - web/src/components/tarjeta-confirmacion.module.css
    - tests/web/confirmaciones.test.ts
  modified:
    - web/src/types/chat.type.ts
    - web/src/types/ui.type.ts
    - web/src/state/conversacion.ts
    - web/src/state/casos.ts
    - web/src/api/flujo-chat.ts
    - web/src/hooks/usar-chat.ts
    - web/src/components/linea-de-tiempo.tsx
    - web/src/app.tsx
    - web/src/config/strings.ts
    - web/src/config/constants/ui.constants.ts
    - tests/web/progreso.test.ts
    - tests/web/conversacion.test.ts

key-decisions:
  - "03-23: la tarjeta pertenece al turno que la abrió y se queda ahí. Si un turno posterior repite la confirmation_required del caso, la tarjeta no se duplica: sigue abierta y refresca sus bloqueos. Se abre otra solo tras un paquete nuevo (la anterior pasa a 'Reemplazada por una confirmación nueva') o cuando el caso vuelve a quedar pendiente después de cerrarse"
  - "03-23: 'Envío cancelado' solo se decide en un turno completo, porque el servidor repite en cada cierre todos los pendientes (cerrarTurnoConCompuerta). Por eso un corte del stream, un error de red o HTTP, o el rechazo por SESION_OCUPADA (que cierra sin repetir pendientes) dejan la tarjeta abierta. Un simular_envio ok sí se refleja aunque el turno se corte"
  - "03-23: un botón viejo no puede mandar una accion obsoleta. Las tarjetas resueltas no tienen botones y responderConfirmacion solo envía si la tarjeta del caso sigue abierta. Los botones usan aria-disabled (siguen enfocables) mientras corre cualquier turno, y el clic se ignora en ese estado"
  - "03-23: la etapa 5 conserva lo de 03-22 (esperando por confirmation_required y hecha por simular_envio ok), que coincide con la tarjeta abierta y la registrada, y agrega cancelada al cierre del turno en que la tarjeta quedó cancelada. Un armar_paquete posterior la reinicia como antes"
  - "03-23: el badge de firma de cada tarjeta se calcula con los turnos hasta el que la resolvió (listoParaFirmaHasta), así una tarjeta del historial no cambia si después se rearma el paquete"
  - "03-23: las tarjetas resueltas pasan a fondo blanco con borde neutro y un badge (éxito o información), con opacidad normal, para que la única tarjeta con fondo de atención sea la abierta (punto focal)"

patterns-established:
  - "Estado derivado de eventos con turno incompleto: el reductor recibe { turno, completo } y solo las reglas que necesitan el cierre completo esperan a completo"

requirements-completed: [UI-03, UI-08]

coverage:
  - id: D1
    description: "reducirConfirmaciones abre una tarjeta por confirmation_required al cerrar el turno, la mantiene abierta refrescando bloqueos, la deja 'Envío registrado' con un simular_envio ok, 'Reemplazada' más una tarjeta nueva tras un paquete nuevo y 'Envío cancelado' cuando el caso sale sin envío"
    requirement: UI-03
    verification:
      - kind: unit
        ref: "tests/web/confirmaciones.test.ts#reducirConfirmaciones: la tarjeta sigue solo los eventos del servidor (D-69)"
        status: pass
    human_judgment: false
  - id: D2
    description: "El botón pulsado queda 'Enviando…' hasta turn_end; un error HTTP o un turno cortado sueltan el enviando sin cerrar la tarjeta; la sesión ocupada no cancela"
    requirement: UI-03
    verification:
      - kind: unit
        ref: "tests/web/confirmaciones.test.ts#el botón de la tarjeta queda 'Enviando…' hasta turn_end (UI-03)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cancelar en hn termina solo su tarjeta y ec sigue abierta; después Confirmar en ec registra su envío; el rechazo por texto cierra todas"
    requirement: UI-03
    verification:
      - kind: unit
        ref: "tests/web/confirmaciones.test.ts#Cancelar envío termina solo su tarjeta y varias tarjetas conviven (D-69)"
        status: pass
    human_judgment: false
  - id: D4
    description: "La etapa 5 sigue a la tarjeta: esperando con la tarjeta abierta, hecha con el envío registrado y cancelada con 'Envío cancelado'; la cancelación no se marca por el clic"
    requirement: UI-08
    verification:
      - kind: unit
        ref: "tests/web/progreso.test.ts#la etapa 5 sigue a la tarjeta de confirmación (D-69)"
        status: pass
    human_judgment: false
  - id: D5
    description: "enviarMensaje manda el texto visible junto con la accion { tipo, caso } y omite la clave si no hay accion; la copia del contrato ('No se envía ningún correo real.')"
    requirement: UI-03
    verification:
      - kind: unit
        ref: "tests/web/confirmaciones.test.ts#enviarMensaje con la accion estructurada (D-68)"
        status: pass
      - kind: unit
        ref: "tests/web/confirmaciones.test.ts#copia de la tarjeta de confirmación"
        status: pass
    human_judgment: false
  - id: D6
    description: "En el navegador: la tarjeta va después de la TarjetaResultado del turno, Confirmar muestra 'Enviando…' con ambos botones aria-disabled y termina en 'Envío registrado'; dos tarjetas apiladas a 8 px; Cancelar en hn la deja 'Envío cancelado' con su etapa 5 cancelada y ec sigue esperando"
    requirement: UI-03
    verification:
      - kind: automated_ui
        ref: "scratchpad/cdp-23.ts (chrome-headless-shell por CDP, servidor en 3023 con --env-file=/dev/null y el LLM falso fake-llm-03-23.ts en 4023)"
        status: pass
    human_judgment: true
    rationale: "Lo visual (peso de la tarjeta como punto focal, contraste de los badges resueltos y aspecto a 375 px) lo confirma el orquestador con Playwright"

duration: 10min
completed: 2026-10-15
status: complete
---

# Phase 3 Plan 23: Tarjetas de confirmación por caso Summary

**Hay una tarjeta por caso pendiente con "Confirmar envío simulado" y "Cancelar envío". Cada botón manda su texto visible y la `accion { tipo, caso }` de 03-18. La tarjeta solo abre, sigue, se registra, se reemplaza o se cancela con los eventos del turno que cierra el servidor, y la etapa 5 del progreso la sigue.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-15T04:55:51Z
- **Completed:** 2026-10-15T05:05:36Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- `reducirConfirmaciones` es una función pura. Recibe las tarjetas y el turno terminado (`{ turno, completo }`) y aplica las reglas de D-69:
  - Un `simular_envio` ok del caso deja la tarjeta en "Envío registrado".
  - Un paquete nuevo con confirmación la deja en "Reemplazada por una confirmación nueva" y abre otra tarjeta.
  - Una confirmación repetida la mantiene abierta con los bloqueos al día.
  - Si el turno se completó y el caso ya no aparece, queda en "Envío cancelado".
  - Una confirmación sin tarjeta abierta abre una nueva.
- `EstadoConversacion.tarjetasConfirmacion` guarda las tarjetas. `ENVIAR` con `accion` marca "enviando" solo la tarjeta de ese caso, y el cierre del turno (`turn_end`, corte, error de red o error HTTP) lo suelta. Un 401 también.
- `TarjetaConfirmacion` sigue el contrato de UI-SPEC: `<article>` con fondo de atención, borde de 1 px más borde izquierdo de 4 px, ícono de alerta y título. Muestra "Caso:" en monoespaciada, "Acción: Envío simulado", el badge de firma, los "Bloqueos" en color de error, "Se registrará con {n} bloqueo(s).", la nota de ENVIO-SIMULADO.md y los dos botones: el primario con acento y el secundario blanco. El botón pulsado dice "Enviando…". Mientras corre cualquier turno, los botones quedan con `aria-disabled` y aparece la ayuda "Espera a que termine la respuesta actual.". Las tarjetas resueltas no tienen botones y muestran su badge.
- La línea de tiempo muestra cada turno en este orden: usuaria, herramientas, texto, `TarjetaResultado` y `PilaConfirmaciones`. La pila es un `<li>` con las tarjetas a 8 px. La región viva anuncia "Respuesta lista. Confirmación requerida para {casos}".
- `progresoPorCaso` recibe las tarjetas. La etapa 5 queda `cancelada` al cierre del turno en que la tarjeta se canceló, cuenta como actividad del caso y se reinicia con un paquete nuevo.

## Task Commits

1. **Task 1: Tracer, "Confirmar envío simulado" en una tarjeta autoriza ese caso y la tarjeta pasa a "Envío registrado" (D-68, D-69)**: `f01e218` (feat)
2. **Task 2 (TDD): Cancelar termina solo su tarjeta, varias tarjetas conviven y la etapa 5 sigue a cada tarjeta (D-69)**
   - RED: `6665346` (test)
   - GREEN: `c3304c7` (feat)

**Gate del tracer:** el `<verify>` automático pasó completo: 50 pruebas, `build:web` y `bun run check`. La configuración es interactiva y `end-of-phase`, y el tracer trae un `<human-check>`, así que la fila 4 del gate pedía detenerse. Seguí con la Tarea 2 porque el orquestador indicó que él hace la verificación visual después con Playwright y el LLM falso, igual que en 03-19 y 03-22.

### RED de la Tarea 2

- Comando: `bun --env-file=/dev/null test tests/web/progreso.test.ts --reporter=junit --reporter-outfile=<scratchpad>/red-03-23.xml`. Salió con código 1: 26 pruebas, 24 pasan y 2 fallan.
- Prueba objetivo: "la etapa 5 sigue a la tarjeta de confirmación (D-69) > Cancelar en co deja su etapa 5 cancelada y la de ec sigue esperando". Se esperaba la etapa 5 de co en `cancelada` y llegó `esperando`.
- `gsd-tools check tdd-red-evidence` dio `RED_EVIDENCE_OK` (`target_test_failed`, formato junit).
- Revisión semántica: la prueba objetivo corrió y falló en la aserción de la etapa 5, porque `casos.ts` todavía no leía las tarjetas. No hubo fallos de carga, de sintaxis ni de fixtures. La otra prueba que falló ("la cancelación cuenta como actividad") tiene la misma causa. Las pruebas de dos tarjetas en `confirmaciones.test.ts` ya pasaban, porque el reductor completo es de la Tarea 1. Lo que agregó la Tarea 2 fue el botón Cancelar y la etapa 5.

## Files Created/Modified

- `web/src/state/confirmaciones.ts`: `reducirConfirmaciones`, `marcarEnviando`, `soltarEnvios`, `tarjetasDelTurno`, `casosAbiertosEnTurno` y `hayTarjetaAbierta`.
- `web/src/components/tarjeta-confirmacion.tsx` y `.module.css`: `TarjetaConfirmacion` y `PilaConfirmaciones`.
- `web/src/state/conversacion.ts`: `tarjetasConfirmacion` en el estado, `terminarTurno` (completo salvo `SESION_OCUPADA`), turno incompleto en `cerrarConError` y el anuncio de confirmación.
- `web/src/state/casos.ts`: `listoParaFirmaHasta` y la etapa 5 cancelada en `progresoPorCaso`.
- `web/src/api/flujo-chat.ts`: `cuerpoDelPedido` arma el cuerpo con `accion` solo si viene.
- `web/src/hooks/usar-chat.ts`: `iniciarTurno(texto, accion)` y `responderConfirmacion`.
- `web/src/components/linea-de-tiempo.tsx` y `web/src/app.tsx`: la pila de tarjetas por turno y el cableado del botón.
- `web/src/config/strings.ts`: `TEXTO_CONFIRMACION`. La nota toma el nombre del archivo de `ARCHIVOS_SALIDA.ENVIO_SIMULADO`.
- `web/src/config/constants/ui.constants.ts`: `ESTADO_TARJETA_CONFIRMACION` y `SEPARADOR_ANUNCIOS`.
- `web/src/types/chat.type.ts` y `ui.type.ts`: `AccionDeTarjeta`, `TipoAccion`, `TarjetaDeConfirmacion`, `TurnoTerminado`, `VistaConConfirmaciones` y las props.
- `tests/web/confirmaciones.test.ts` (29 pruebas), `tests/web/progreso.test.ts` (6 pruebas nuevas) y `tests/web/conversacion.test.ts` (estado inicial).

## Cómo ver la tarjeta y los dos botones sin un proveedor real

El LLM falso de 03-19 repite el flujo completo en cada mensaje, así que con él los botones terminan en "Reemplazada". Para esta revisión hay otro en `scratchpad/fake-llm-03-23.ts` (puerto 4023):

- Si el mensaje empieza con "Sí, envía X", llama a `proveedor_simular_envio { caso: X, confirmado: true }`.
- Si empieza con "Cancela el envío de X", solo responde con texto.
- Con cualquier otro mensaje, corre leer, mapear, generar y armar para cada caso que aparezca.

`scratchpad/cdp-23.ts` levanta ese LLM falso, el servidor en el 3023 (`bun --env-file=/dev/null src/server.ts` con `LLM_PROVIDER=falso`, `LLM_BASE_URL=http://127.0.0.1:4023`, `LLM_MODEL=modelo-falso`, `LLM_API_KEY=clave-falsa`, `LLM_FALLBACK_ENABLED=false`, `ACCESS_CODE=codigo-local-de-prueba` y `ACCESS_TOKEN_SECRET`, que es obligatorio en producción) y chrome-headless-shell. Al terminar cierra los tres. El servidor sirve `web/dist`, así que antes hay que correr `bun run build:web`. Resultado de la corrida:

- Chip "Demo §11" sobre ec-corp-andina. Orden en la línea de tiempo: usuaria, "4 llamadas a herramientas", agente, ec-corp-andina (resultado) y "Confirmación requerida · Envío simulado". La región viva dijo "Respuesta lista. Confirmación requerida para ec-corp-andina". Etapa 5: "esperando confirmación".
- "Confirmar envío simulado": al pulsarlo, los botones pasaron a "Enviando… [aria-disabled]" y "Cancelar envío [aria-disabled]" con la ayuda visible. Apareció el mensaje "Sí, envía ec-corp-andina" y la herramienta "Simular envío" terminó Correcta. La tarjeta quedó en "Envío registrado", sin botones, y las etapas 5 y 6 quedaron hechas.
- "Procesa estos casos: ec-corp-andina, hn-agroexport-sula": abrió dos tarjetas abiertas, a 8 px una de otra. La tarjeta registrada anterior quedó igual.
- "Cancelar envío" en hn: hn quedó en "Envío cancelado", con la etapa 5 en "cancelado". ec siguió abierta con sus botones y su etapa 5 en "esperando confirmación".
- A 375 px, scrollWidth da 375.
- Capturas en `scratchpad/shot-23-*.png`.

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] La sesión ocupada habría cancelado las tarjetas**
- **Found during:** Task 1, al leer `ejecutar-turno.service.ts`.
- **Issue:** `rechazarOcupada` emite `error` y `turn_end` sin repetir los pendientes. Con la regla "si el caso desaparece en un turno completo, se cancela", un clic durante un turno de otra pestaña habría dejado la tarjeta en "Envío cancelado" aunque el servidor la sigue teniendo pendiente.
- **Fix:** un turno con error `SESION_OCUPADA`, uno cortado o uno que termina en error de red o HTTP se aplica como incompleto: refleja lo que el servidor informó y no cancela nada.
- **Files modified:** web/src/state/conversacion.ts, web/src/state/confirmaciones.ts
- **Verification:** las pruebas "la sesión ocupada responde sin repetir pendientes…" y "un turno cortado no cancela ni cierra la tarjeta…".
- **Committed in:** f01e218

**2. [Rule 1 - Fixture] La prueba del simular_envio fallido de 03-22 no traía la confirmación que el servidor repite**
- **Found during:** Task 2 (GREEN).
- **Issue:** la secuencia terminaba el turno sin la `confirmation_required` que `cerrarTurnoConCompuerta` emite siempre para un caso que sigue pendiente. Con las tarjetas, ese turno imposible se lee como "el caso salió sin envío" y la etapa 5 pasaba a cancelada.
- **Fix:** se agregó `confirmacion(EC)` antes de `finDeTurno`, igual que hace el servidor. El nombre y lo que afirma la prueba no cambian: la etapa 6 queda en error y la 5 sigue esperando.
- **Files modified:** tests/web/progreso.test.ts
- **Committed in:** c3304c7

**3. [Desvío de forma] El reductor completo entró en la Tarea 1**
- La Tarea 1 pedía probar abierta, refrescada, registrada, reemplazada, cancelada y enviando, así que `reducirConfirmaciones` quedó completo ahí. La Tarea 2 agregó el botón Cancelar, la etapa 5 desde las tarjetas y las pruebas de dos tarjetas y de la etapa 5.

**4. [Rule 2 - Correctness] Ningún botón manda una accion sobre una tarjeta que ya no está abierta**
- Lo pidió el orquestador por el caso de 03-18: un "Cancelar" viejo pasa por el clasificador y cancela lo pendiente. Las tarjetas resueltas no tienen botones, `responderConfirmacion` revisa `hayTarjetaAbierta` y el clic se ignora mientras corre un turno.
- **Committed in:** f01e218

---

**Total deviations:** 4 (2 de corrección, 1 de fixture, 1 de forma).
**Impact on plan:** todas mantienen el principio de que la tarjeta solo refleja al servidor. No hay alcance nuevo.

## Issues Encountered

- En la corrida por CDP, después del turno de dos casos (8 llamadas, así que el grupo se pliega), la línea de tiempo dejó de seguir el final y apareció "Ir al final". No se confirmó si viene de 03-19. Quedó anotado en `deferred-items.md` y no se tocó.

## User Setup Required

None. No hace falta configurar ningún servicio externo.

## Verification

- `bun test tests/web/confirmaciones.test.ts tests/web/progreso.test.ts tests/arquitectura-web.test.ts`: 82 pass, 0 fail.
- `bun --env-file=/dev/null test`: 2039 pass, 1 skip y 0 fail, sobre 2040 pruebas en 103 archivos.
- `bun run build:web` y `bun run check` (tsc, tsc web, Biome y bun audit): pasan.
- Criterios de aceptación:
  - `grep -c "accion" web/src/api/flujo-chat.ts` da 2.
  - `strings.ts` contiene "No se envía ningún correo real.".
  - `confirmaciones.test.ts` cubre abierta, refrescada, registrada, reemplazada, cancelada y enviando, además del escenario de dos tarjetas en el que solo la cancelada termina.
  - `progreso.test.ts` comprueba la etapa 5 cancelada del caso cancelado y la esperando del otro.

## Next Phase Readiness

- 03-25 puede hidratar las tarjetas vigentes armando `tarjetasConfirmacion` con `estado: abierta` para cada `pendientes[]` de `GET /api/sessions/:id`, y con `registrada` para los casos con un `simular_envio` ok. El resto de la UI ya pinta desde ese estado.

## Self-Check: PASSED

- Archivos creados presentes: web/src/state/confirmaciones.ts, web/src/components/tarjeta-confirmacion.tsx, web/src/components/tarjeta-confirmacion.module.css, tests/web/confirmaciones.test.ts.
- Commits presentes en HEAD: f01e218, 6665346 y c3304c7.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
