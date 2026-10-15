---
phase: 03-chat-web-api-sse-y-despliegue
plan: 33
subsystem: ui
tags: [react, banner, health, llm-estado, copia, g-03-15]

requires:
  - phase: 03-29
    provides: "AvisoModelo y TONO_DEL_MODELO por estado del modelo"
  - phase: 03-31
    provides: "useSalud con refrescar que aborta el pedido anterior"
provides:
  - "Banner del modelo con { titulo, detalle } por estado: qué pasa, qué sigue funcionando, qué hacer y cuándo vuelve, sin comandos"
  - "Botón secundario 'Comprobar de nuevo' que solo relee GET /api/health, con 'Comprobando…' y disabled mientras corre"
  - "useSalud().comprobando"
  - "ESTADO_LLM_TRAS_ERROR[AUTENTICACION] = SIN_CLAVE"
  - "MENSAJE_AGENTE de saldo y de autenticación coherentes con el banner"
affects: [03-34, 03-39, UI-SPEC, LLM-06]

actuals:
  tokens: 5600
  tasks: 3
  commits: 4
plan_head_before: 4d65680932b2fa66043519b59b92028c146992ab
plan_head_after: 5250044a616e198efb8d4f97abdfd2b4c4e92d14

tech-stack:
  added: []
  patterns:
    - "Aviso del modelo como { titulo, detalle } armado por avisoDelModelo(titulo, ...pasos), con la frase común 'Mientras tanto…' en una constante"
    - "Pedido en vuelo marcado con un booleano que solo apaga el último pedido (finally + comparación con pedidoActivo)"

key-files:
  created: []
  modified:
    - web/src/config/strings.ts
    - web/src/types/ui.type.ts
    - web/src/types/chat.type.ts
    - web/src/components/aviso-modelo.tsx
    - web/src/components/aviso-modelo.module.css
    - web/src/hooks/usar-salud.ts
    - web/src/app.tsx
    - src/config/strings.ts
    - src/config/constants/llm.constants.ts
    - tests/web/estado-del-modelo.test.ts
    - tests/unit/health-report.decorator.test.ts

key-decisions:
  - "Un 401/403 del proveedor (AUTENTICACION) se publica en /api/health como sin_clave porque una clave rechazada no se recupera sola. Riesgo aceptado: un 401 transitorio deja la UI en sin_clave hasta un reinicio o hasta que otra llamada al modelo funcione."
  - "El banner de saldo y MENSAJE_AGENTE de saldo comparten 'recargue la cuenta' y 'vuelve a enviar tu mensaje' y ya no dicen 'puedes volver a intentarlo'."
  - "'Comprobar de nuevo' solo llama a refrescar de useSalud; el banner no importa @web/api, @web/hooks ni @web/state."
  - "comprobando también se enciende con los refrescos automáticos (al volver a la pestaña y al cerrar cada pedido de chat), porque el texto describe el pedido de health en vuelo, sin importar quién lo lanzó."

patterns-established:
  - "Copia del banner del modelo por estado: título con qué pasa; detalle con qué sigue funcionando, qué hacer y cuándo vuelve."

requirements-completed: [LLM-06, UI-04, API-03]

coverage:
  - id: D1
    description: "El banner de cada estado sin modelo dice qué pasa, qué sigue funcionando, qué hacer y cuándo vuelve, con la copia C+ exacta y sin comandos; el encabezado dice 'Sin clave válida'"
    requirement: LLM-06
    verification:
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#banner del modelo"
        status: pass
      - kind: other
        ref: "grep -rn \"demo\\.ts\\|bun run\" web/src (sin resultados)"
        status: pass
    human_judgment: false
  - id: D2
    description: "AUTENTICACION se publica como sin_clave y una llamada correcta posterior vuelve a disponible"
    requirement: API-03
    verification:
      - kind: unit
        ref: "tests/unit/health-report.decorator.test.ts#una clave rechazada publica sin clave y una llamada correcta posterior vuelve a disponible"
        status: pass
      - kind: integration
        ref: "tests/http/salud.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "MENSAJE_AGENTE de saldo y de autenticación con la copia exacta, coherentes con el banner de saldo"
    requirement: LLM-06
    verification:
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#coherencia entre el banner y el aviso del turno"
        status: pass
      - kind: unit
        ref: "tests/unit/provider-error.mapper.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Botón 'Comprobar de nuevo' que solo relee GET /api/health, con 'Comprobando…' y disabled mientras corre; desaparece con disponible"
    requirement: UI-04
    verification:
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#botón Comprobar de nuevo"
        status: pass
    human_judgment: true
    rationale: "La human-check de la tarea 3 (receta T10 con Playwright MCP: red solo con un GET /api/health al pulsar, banner y AvisoError de saldo con FAKE_FORCE_STATUS=402, capturas a 1280 y 375) se consolida en la UAT de fin de fase (human_verify_mode=end-of-phase)."

duration: 4min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 33: Banner del modelo sin comandos y botón "Comprobar de nuevo" Summary

**El banner de cada estado sin modelo explica qué pasa, qué sigue funcionando, qué hacer y cuándo vuelve (copia C+ de G-03-15). Trae un botón "Comprobar de nuevo" que solo relee /api/health. Un 401/403 del proveedor se publica como sin_clave, y el aviso de saldo del turno ya no contradice al banner.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-10-15T17:22:28Z
- **Completed:** 2026-10-15T17:26:10Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- `AVISO_DEL_MODELO` arma `{ titulo, detalle }` con la copia exacta de los cuatro estados. Cada detalle empieza con "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos.". Desaparecen el comando de demostración y el `<code>` del banner, y la etiqueta del encabezado pasa a "Sin clave válida".
- `ESTADO_LLM_TRAS_ERROR[AUTENTICACION] = SIN_CLAVE`. `MENSAJE_AGENTE` de saldo y de autenticación usan la copia nueva, con "La sesión sigue abierta" tomada de una constante compartida.
- `useSalud` expone `comprobando`. `AvisoModelo` pinta el botón secundario "Comprobar de nuevo" (fondo dominante, borde `--borde`, alto `--alto-control`, anillo de foco global), que muestra "Comprobando…" y queda deshabilitado mientras hay un pedido de health en vuelo. `app.tsx` lo conecta a `refrescar`.

## Task Commits

1. **Task 1: Trazador: el banner explica cada estado sin comandos.** `15bd21c` (feat)
2. **Task 2: Copia de saldo y de clave rechazada coherente; AUTENTICACION como sin_clave.** `042d120` (test, RED), `ca03502` (feat, GREEN)
3. **Task 3: Botón "Comprobar de nuevo" que solo relee /api/health.** `5250044` (feat)

## Files Created/Modified
- `web/src/config/strings.ts`: `AVISO_DEL_MODELO` con `{ titulo, detalle }`, `avisoDelModelo`, `MIENTRAS_TANTO`, "Sin clave válida", `TEXTO_MODELO.comprobar` y `comprobando`. Ya no tiene `COMANDO_DEMO` ni `avisoSinComando`.
- `web/src/types/ui.type.ts`: `PartesAvisoModelo = { titulo, detalle }`. `PropsAvisoModelo` y `PropsCuerpoAvisoModelo` suman `comprobando` y `alComprobar`.
- `web/src/types/chat.type.ts`: `ControlSalud.comprobando`.
- `web/src/components/aviso-modelo.tsx` y `.module.css`: título a 600, detalle y botón secundario. Se quitan `.comando` y el `<code>`.
- `web/src/hooks/usar-salud.ts`: `comprobando` se apaga en `finally` solo si el pedido sigue siendo el activo.
- `web/src/app.tsx`: pasa `comprobando` y `alComprobar={refrescar}` al banner.
- `src/config/constants/llm.constants.ts`: AUTENTICACION → SIN_CLAVE.
- `src/config/strings.ts`: `SESION_ABIERTA` compartida y copia nueva de saldo y autenticación.
- `tests/web/estado-del-modelo.test.ts`: copia por estado, ausencia de comandos, coherencia de saldo entre servidor y banner, y que el banner no importe el chat.
- `tests/unit/health-report.decorator.test.ts`: fila AUTENTICACION → SIN_CLAVE y recuperación a disponible.

## Decisions Made
- **AUTENTICACION → sin_clave (riesgo aceptado).** Una clave rechazada no se recupera sola, así que health la publica como sin_clave. Un 401 transitorio deja la UI en sin_clave hasta un reinicio o hasta que otra llamada al modelo funcione. 03-34 pausa el envío en sin_clave, y con eso esa recuperación solo llega con un reinicio. Es el riesgo que el plan acepta.
- `comprobando` refleja cualquier pedido de health en vuelo, también los automáticos (al volver a la pestaña y al cerrar un pedido de chat). Así el botón no lanza un pedido duplicado mientras otro corre (T-03-54).

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing Critical] Prueba de la prohibición "el botón no toca el chat"**
- **Found during:** Task 3
- **Issue:** La prohibición del plan exige `verification: test`, pero la tarea solo traía un grep de aceptación.
- **Fix:** Se agregó a `tests/web/estado-del-modelo.test.ts` una prueba que lee `aviso-modelo.tsx`. Verifica que no importe `@web/api/`, `@web/hooks/` ni `@web/state/` y que el botón use `onClick={alComprobar}` y `disabled={comprobando}`.
- **Files modified:** tests/web/estado-del-modelo.test.ts
- **Committed in:** 5250044

**2. [Rule 1 - Robustez] `comprobando` se apaga en `finally`**
- **Found during:** Task 3
- **Issue:** Si `obtenerSalud` rechazara, apagar el estado solo dentro de `then` dejaría el botón deshabilitado para siempre.
- **Fix:** El apagado vive en `.finally` y solo ocurre si el pedido sigue siendo `pedidoActivo`. Un pedido abortado por uno nuevo no lo apaga.
- **Committed in:** 5250044

La tarea 1 (tracer) fue en un solo commit con su prueba porque una prueba roja con `titulo`/`detalle` rompía `tsc` en `bun run check`. Se verificó en rojo antes de implementar (7 fallas).

**Total deviations:** 2 auto-fixed (1 missing critical, 1 robustez). **Impact:** sin cambio de alcance.

## Issues Encountered
- Biome reformateó dos líneas largas de `MIENTRAS_TANTO`. Se arregló con `biome format --write` antes del commit, y `bun run check` terminó con exit 0 en cada commit.

## User Setup Required
None. No hace falta configurar ningún servicio externo.

## Next Phase Readiness
- 03-34 puede leer `salud.llm` para pausar el envío en sin_clave y tope_diario, y 03-39 debe reescribir D-70, LLM-06, SC4 y la UI-SPEC con esta copia.
- La human-check de la tarea 3 (receta T10 con Playwright) queda para la UAT de fin de fase.
- La opción A ("Procesar sin el modelo") sigue diferida y no se implementó.

## Verification
- `bun test`: 2204 pass, 0 fail (2205 tests en 106 archivos).
- `bun run build:web`: exit 0. `bun run check`: exit 0.
- `bun test tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts tests/architecture.test.ts`: 106 pass, 0 fail.
- `grep -rn "demo\.ts\|bun run" web/src`: sin resultados. `grep -n "usar-chat\|flujo-chat" web/src/components/aviso-modelo.tsx`: sin resultados.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
