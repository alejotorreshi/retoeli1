---
phase: 03-chat-web-api-sse-y-despliegue
plan: 34
subsystem: ui
tags: [react, web, llm-health, pausa, accesibilidad, G-03-15]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-28: panel de casos con chip de reproceso (AvisoDiscoEfimero) y tarjetas de confirmación; 03-33: banner del modelo por estado, 'Comprobar de nuevo' y AUTENTICACION publicada como sin_clave"
provides:
  - "envioEnPausa(llm) en web/src/state/modelo.ts: el único predicado de pausa por estado del modelo"
  - "ESTADOS_LLM_SIN_ENVIO (sin_clave, tope_diario) en web/src/config/constants/ui.constants.ts"
  - "Compositor con pausado: campo, 'Enviar mensaje' y Enter deshabilitados, ayuda TEXTO_CHAT.enPausa en el mismo <p> de aria-describedby"
  - "AccionesRapidas con deshabilitadas, PanelCasos/BloqueCaso con envioDeshabilitado y LineaDeTiempo → CuerpoLinea → PilaConfirmaciones → TarjetaConfirmacion con pausada"
  - "TEXTO_CONFIRMACION.enPausa en la tarjeta cuando la causa del bloqueo es la pausa"
affects: [03-39, UI-SPEC AvisoModelo, verify-work fase 3 (receta T10)]

actuals:
  tokens: 4900
  tasks: 2
  commits: 3
plan_head_before: 071430265ff905857783d7326c524a580fe9ec7f
plan_head_after: f673f5b5250813477489f181254222ec86a7735b

tech-stack:
  added: []
  patterns:
    - "La pausa por estado del modelo es un predicado puro en web/src/state que app.tsx calcula una vez y reparte como prop booleana; los componentes no conocen ESTADO_LLM"
    - "Cada componente recibe una prop con el nombre de lo que deshabilita (deshabilitadas, envioDeshabilitado, pausada), no el motivo (enCurso)"

key-files:
  created:
    - web/src/state/modelo.ts
  modified:
    - web/src/config/constants/ui.constants.ts
    - web/src/config/strings.ts
    - web/src/types/ui.type.ts
    - web/src/app.tsx
    - web/src/components/compositor.tsx
    - web/src/components/acciones-rapidas.tsx
    - web/src/components/panel-casos.tsx
    - web/src/components/linea-de-tiempo.tsx
    - web/src/components/tarjeta-confirmacion.tsx
    - tests/web/estado-del-modelo.test.ts

key-decisions:
  - "El envío queda en pausa solo en sin_clave y tope_diario (ESTADOS_LLM_SIN_ENVIO). En saldo_agotado, no_disponible, disponible y mientras health no respondió (null) la entrada sigue habilitada, porque solo una llamada correcta limpia esos estados (G-03-15, opción C+)"
  - "Si una tarjeta está bloqueada por un turno en curso o un envío propio, su ayuda dice 'ocupada' antes que 'en pausa', porque el turno termina antes y entonces queda la pausa"
  - "ESTADOS_LLM_SIN_ENVIO se tipa como ReadonlySet<ValorDe<typeof ESTADO_LLM>>, que es el mismo tipo que EstadoModelo, para no importar tipos de web/src/types desde las constantes"
  - "La pausa es solo UX: el servidor sigue siendo la compuerta (503 sin clave, 429 por tope diario), y el plan no toca código del servidor"

patterns-established:
  - "Pausa por estado del modelo: envioEnPausa(salud?.llm ?? null) en app.tsx, combinada con estado.enCurso solo donde el control también espera al turno"

requirements-completed: [LLM-06, UI-01, UI-03, UI-07]

coverage:
  - id: D1
    description: "envioEnPausa devuelve true solo en sin_clave y tope_diario, y false en saldo_agotado, no_disponible, disponible y null"
    requirement: LLM-06
    verification:
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#solo sin clave y tope diario pausan el envío; sin respuesta de health no hay pausa"
        status: pass
    human_judgment: false
  - id: D2
    description: "Copias exactas de la pausa: TEXTO_CHAT.enPausa y TEXTO_CONFIRMACION.enPausa"
    requirement: UI-07
    verification:
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#la ayuda del compositor explica la pausa y remite al aviso"
        status: pass
      - kind: unit
        ref: "tests/web/estado-del-modelo.test.ts#la tarjeta de confirmación en pausa dice cuándo se podrá responder"
        status: pass
    human_judgment: false
  - id: D3
    description: "En sin_clave y tope_diario el compositor, los tres chips, el chip de reproceso y los botones de las tarjetas quedan deshabilitados con su ayuda; ver, descargar, Reintentar, Nueva sesión y Detener siguen disponibles, y todo vuelve al pasar health a disponible sin recargar"
    requirement: UI-03
    verification:
      - kind: other
        ref: "bun run build:web && bun run check (exit 0); bun test (2207 pass, 0 fail)"
        status: pass
    human_judgment: true
    rationale: "Ninguna prueba renderiza los componentes. El comportamiento en el navegador (controles deshabilitados, aria-describedby, rehabilitación tras 'Comprobar de nuevo', saldo_agotado sin pausa) queda para el human-check de la tarea 2 (receta T10 con Playwright) en la UAT de fin de fase"

duration: 3min
completed: 2026-10-15
status: complete
---

# Phase 3 Plan 34: Envío en pausa sin clave o con el tope diario Summary

**Un predicado puro `envioEnPausa` (sin_clave y tope_diario) deshabilita el compositor, los chips de acción rápida, el chip de reproceso y Confirmar/Cancelar de las tarjetas, con una ayuda que explica la pausa. Todo vuelve solo cuando health pasa a disponible.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-15T17:28:20Z
- **Completed:** 2026-10-15T17:31:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- `envioEnPausa(llm)` en `web/src/state/modelo.ts` y `ESTADOS_LLM_SIN_ENVIO` en las constantes de la UI. Es el único lugar que decide la pausa, y `app.tsx` la calcula desde `salud?.llm ?? null`.
- Con `pausado`, el `Compositor` deshabilita el campo, "Enviar mensaje" y el envío con Enter. Su línea de ayuda, que el campo ya referencia con `aria-describedby`, muestra "El envío está en pausa mientras el modelo no esté disponible; el aviso de arriba explica qué hacer.".
- `AccionesRapidas` (las dos franjas) y el chip de reproceso del panel se deshabilitan con `estado.enCurso || enPausa`.
- Las tarjetas de confirmación abiertas bloquean Confirmar y Cancelar en pausa y dicen "Podrás confirmar o cancelar cuando el modelo vuelva a estar disponible.". Durante un turno siguen diciendo "Espera a que termine la respuesta actual.". Ningún componente cambia el estado de una tarjeta (D-69).
- "Nueva sesión" (`estado.enCurso`), "Detener respuesta", ver y descargar archivos y "Reintentar" de la lista no dependen de la pausa.

## Task Commits

1. **Task 1 (tracer): sin clave o con el tope diario, el compositor queda en pausa y dice por qué.** RED en `21d600d` (test) y GREEN en `4e1b777` (feat). Tras el tracer se volvió a correr su verify.
2. **Task 2: chips, chip de reproceso y tarjetas de confirmación en pausa con el mismo predicado.** `f673f5b` (feat).

**Plan metadata:** se registra en el commit docs(03-34) que cierra el plan.

## Files Created/Modified
- `web/src/state/modelo.ts`: `envioEnPausa`, un predicado puro sin React ni DOM.
- `web/src/config/constants/ui.constants.ts`: `ESTADOS_LLM_SIN_ENVIO`.
- `web/src/config/strings.ts`: `TEXTO_CHAT.enPausa` y `TEXTO_CONFIRMACION.enPausa`.
- `web/src/types/ui.type.ts`: `pausado` en `PropsCompositor`, `deshabilitadas` en `PropsAccionesRapidas`, `envioDeshabilitado` en `PropsPanelCasos` y `PropsBloqueCaso`, y `pausada` en `PropsLineaDeTiempo`, `PropsCuerpoLinea`, `PropsPilaConfirmaciones` y `PropsTarjetaConfirmacion`.
- `web/src/app.tsx`: calcula `enPausa` y `envioDeshabilitado` y los reparte.
- `web/src/components/compositor.tsx`: deshabilitado = `bloqueado || pausado`, más la ayuda de pausa.
- `web/src/components/acciones-rapidas.tsx`: la prop `enCurso` pasa a llamarse `deshabilitadas`.
- `web/src/components/panel-casos.tsx`: la prop `enCurso` pasa a llamarse `envioDeshabilitado` y solo afecta a `AvisoDiscoEfimero`.
- `web/src/components/linea-de-tiempo.tsx`: pasa `pausada` hasta `PilaConfirmaciones`.
- `web/src/components/tarjeta-confirmacion.tsx`: bloquea con `ocupada || pausada || enviando` y elige la ayuda con `ayudaDeBloqueo`.
- `tests/web/estado-del-modelo.test.ts`: la tabla de `envioEnPausa` y las dos copias.

## Decisions Made
- La pausa cubre solo sin_clave y tope_diario. saldo_agotado y no_disponible se limpian únicamente con una llamada correcta, porque health nunca llama al modelo. Si se pausaran, la analista no tendría cómo salir de ese estado (opción C+ de la usuaria).
- Si una tarjeta está a la vez ocupada y en pausa, la ayuda dice "ocupada", porque es la causa inmediata y la pausa sigue al terminar el turno.
- El campo de texto también se deshabilita, no solo el botón (supuesto del plan).
- La opción A ("Procesar sin el modelo") no se implementó porque está diferida por la usuaria.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Formato de Biome en panel-casos.tsx**
- **Found during:** Task 2
- **Issue:** Al renombrar las props, las firmas de `BloqueCaso` y `PanelCasos` y la línea de `AvisoDiscoEfimero` superaban el ancho de línea, y `bun run check` salió con código 1.
- **Fix:** Se aplicó `biome format --write` al archivo. Solo cambió el formato.
- **Files modified:** web/src/components/panel-casos.tsx
- **Verification:** `bun run check`: exit 0.
- **Committed in:** f673f5b

**2. [Ajuste menor] Tipo de ESTADOS_LLM_SIN_ENVIO**
- El plan pedía `ReadonlySet<EstadoModelo>`. Se usó `ReadonlySet<ValorDe<typeof ESTADO_LLM>>`, que es el mismo tipo, siguiendo el estilo de `TONO_DEL_MODELO` y sin importar tipos de `web/src/types` desde las constantes.

---

**Total deviations:** 1 auto-fixed (formato) y 1 ajuste de tipo equivalente.
**Impact on plan:** Ninguno. No se amplió el alcance.

## Issues Encountered
- La revisión en el navegador ("Nueva sesión" y "Detener respuesta" habilitados en pausa, y la receta T10 con Playwright) no se hizo en esta ejecución, porque el executor no tiene Playwright MCP. Como `human_verify_mode` es `end-of-phase`, el `<human-check>` de la tarea 2 se consolida en la UAT de fin de fase. Por código, "Nueva sesión" sigue usando solo `estado.enCurso`, y "Detener respuesta" se muestra mientras corre un turno sin que `pausado` lo afecte.

## User Setup Required

None. No hace falta configurar servicios externos.

## Next Phase Readiness
- G-03-15 queda cerrado en código junto con 03-33. La reescritura de D-70, LLM-06, el criterio 4 y la UI-SPEC (incluidas estas copias) le corresponde a 03-39.
- Para la UAT queda pendiente la receta T10: sin `LLM_API_KEY`, con `FAKE_FORCE_STATUS=402` y con `AGENT_DAILY_TOKEN_BUDGET=1`.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED
