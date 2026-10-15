---
phase: 03-chat-web-api-sse-y-despliegue
plan: 39
subsystem: spec
tags: [especificacion, ui-spec, context, requirements, roadmap, gap-closure, G-03-15, G-03-14, G-03-10, G-03-04, G-03-20, G-03-17, G-03-26]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "código del cierre de brechas 03-28 a 03-38 (copia final de web/src/config/strings.ts y src/config/strings.ts)"
provides:
  - "D-70 reescrita con la opción C+ de G-03-15 y la opción A como idea diferida"
  - "D-71.1, D-73.5.1, D-75 y D-76 en 03-CONTEXT.md"
  - "LLM-06 (REQUIREMENTS.md) y el criterio de éxito 4 de la Fase 3 (ROADMAP.md) alineados con D-70 reescrita"
  - "03-UI-SPEC.md con los contratos y la copia que el código implementa tras el cierre de brechas"
affects: [fase-4, solucion-md, readme, ui-review, verify-work]

actuals:
  tokens: 12600
  tasks: 2
  commits: 2
plan_head_before: 1b58fe737d33509e4b97beccee62bd0ee7f4f0c3
plan_head_after: 6619387e398109645b26c65ae34d78f899c9a07f

tech-stack:
  added: []
  patterns:
    - "La especificación se reconcilia al final del cierre de brechas, citando los literales tal como quedaron en los strings.ts"

key-files:
  created: []
  modified:
    - .planning/phases/03-chat-web-api-sse-y-despliegue/03-CONTEXT.md
    - .planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md

key-decisions:
  - "D-70 reescrita (opción C+, G-03-15): demo.ts es la verificación sin modelo del evaluador, documentada en el README y SOLUCION.md; la UI explica por estado qué pasa, qué sigue funcionando, qué hacer y cuándo vuelve, ofrece 'Comprobar de nuevo' y pausa el envío solo en sin_clave y tope_diario; la opción A queda diferida"
  - "D-71.1: AUTENTICACION se publica como sin_clave (riesgo aceptado de un 401 transitorio) y health se pide al cargar, en visibilitychange, al terminar cada pedido de chat y con 'Comprobar de nuevo', nunca por intervalo"
  - "D-73.5.1: 20 sesiones nuevas por hora en Render (local 5), 429 con los minutos de espera y 'Volver a la sesión anterior'; la SPA conserva el sessionId anterior hasta el turn_start de la sesión nueva"
  - "D-75: el servidor publica solo casos que cumplen PATRON_CASO (el listado sale con caso null) y el panel muestra solo casos reales"
  - "D-76: aviso determinista de TEXTO_ENVIO_NO_REGISTRADO por cada simular_envio que no terminó ENVIADO, antes de la pregunta, sin reescribir la prosa del modelo"

patterns-established:
  - "Las filas de copia de la UI-SPEC citan el literal del strings.ts que lo implementa, y las del servidor se marcan (servidor)"

requirements-completed: [LLM-06, UI-06, UI-07, UI-08]

coverage:
  - id: D1
    description: "D-70, LLM-06 y el criterio 4 dicen la opción C+ y ya no presentan demo.ts como el flujo sin modelo de la analista; la UI-SPEC no menciona el script"
    requirement: "LLM-06"
    verification:
      - kind: other
        ref: "grep -n 'demo.ts' 03-UI-SPEC.md (sin salida); grep -n 'D-70 (reescrita' 03-CONTEXT.md; grep -n 'LLM-06' REQUIREMENTS.md | grep -c 'Comprobar de nuevo' (1); grep 'flujo sin modelo se corre' REQUIREMENTS.md (sin salida); criterio 4 sin 'sigue disponible con'"
        status: pass
    human_judgment: false
  - id: D2
    description: "03-CONTEXT.md registra D-71.1, D-73.5.1, D-75 y D-76 y la opción A como idea diferida"
    requirement: "UI-08"
    verification:
      - kind: other
        ref: "grep -c 'D-75\\|D-76\\|D-71.1\\|D-73.5.1' 03-CONTEXT.md (4)"
        status: pass
    human_judgment: false
  - id: D3
    description: "La UI-SPEC cita la copia implementada: 'Comprobar de nuevo', 'Comprobando…', 'Sin clave válida', la frase 'Mientras tanto…', las ayudas de pausa, 'Volver a la sesión anterior', el error de vista previa sin conexión y 'Demo §11', cada una presente también en el strings.ts"
    requirement: "UI-06"
    verification:
      - kind: other
        ref: "grep -cF de cada literal en 03-UI-SPEC.md y web/src/config/strings.ts (>= 1 en ambos); grep -c de los cinco literales de la tarea 2 en 03-UI-SPEC.md (12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Las reglas viejas que originaron las brechas ya no están: el refresco solo tras un turn_end con error y 'el compositor sigue habilitado en todos los estados'"
    requirement: "UI-07"
    verification:
      - kind: other
        ref: "grep de 'después de cada `turn_end` que trajo un evento `error`' y de 'sigue habilitado** en todos los estados' en 03-UI-SPEC.md (sin salida)"
        status: pass
    human_judgment: false
  - id: D5
    description: "La UI-SPEC reescrita describe con fidelidad el comportamiento del código (auto-scroll por intención, pantallas angostas, panel, vista previa, Nueva sesión)"
    verification: []
    human_judgment: true
    rationale: "Que la prosa de cada contrato coincida con el comportamiento real en el navegador es un juicio de lectura; los greps solo comprueban los literales y la ausencia de las reglas viejas"

duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 39: Especificación de la Fase 3 reconciliada con el cierre de brechas Summary

**D-70 queda reescrita con la opción C+ (demo.ts solo para el evaluador, banner por estado con "Comprobar de nuevo" y pausa del envío solo en sin_clave y tope_diario). LLM-06 y el criterio 4 dicen lo mismo, CONTEXT registra D-71.1, D-73.5.1, D-75 y D-76, y la UI-SPEC cita la copia tal como quedó en los dos strings.ts.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T17:52:33Z
- **Completed:** 2026-10-15T17:57:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- **D-70 reescrita** (03-CONTEXT.md). `demo.ts` es la verificación sin modelo del evaluador (PRD §6.6) y se documenta en el README y SOLUCION.md. Para la analista, el banner explica por estado qué pasa, qué sigue funcionando, qué hacer y cuándo vuelve, con "Comprobar de nuevo". El envío se pausa solo en `sin_clave` y `tope_diario`. La opción A ("Procesar sin el modelo") pasa a Deferred Ideas como fase 3.1 o 4. La línea de requisitos del dominio dice "LLM-06 (ver D-70, reescrita)".
- **LLM-06** (REQUIREMENTS.md) y el **criterio 4 de la Fase 3** (ROADMAP.md) se reescribieron sin tocar la casilla ni la tabla de trazabilidad. Ya no presentan `demo.ts` como el flujo de la analista.
- **Decisiones nuevas** en una subsección "Cierre de brechas de la UAT": D-71.1 (AUTENTICACION como `sin_clave` y refresco de health por evento), D-73.5.1 (20 sesiones nuevas por hora en Render, 429 con minutos y volver a la sesión anterior), D-75 (solo casos reales) y D-76 (aviso de envío no registrado sin reescribir la prosa del modelo).
- **03-UI-SPEC.md**:
  - Contratos actualizados: AvisoModelo (refresco, título y detalle, botón, pausa), pantallas < 640 px (encabezado en dos líneas con prefijos ocultos a la vista, chips con `flex-wrap` y etiquetas cortas, "Ir al final" solo con ícono), LineaDeTiempo (auto-scroll por intención, re-anclaje al enviar, `overflow-anchor: none`), TarjetaConfirmacion y Compositor (pausa), PanelCasos (D-75), DialogoVistaPrevia (error según la causa) y DialogoNuevaSesion (el id anterior se conserva hasta el `turn_start`).
  - Copywriting: el banner de cada estado como título y detalle, el botón y "Comprobando…", las ayudas de pausa, los `MENSAJE_AGENTE` de saldo y de clave rechazada, el error de vista previa separado en 404, 422 y sin conexión, el 429 de sesiones con "{m}" y "Volver a la sesión anterior", los cinco avisos de D-76 y los chips cortos.
  - Contrato de datos, punto 7: el listado sale con caso `null`.
  - UI Considerations: filas de vista previa por causa, Estado del LLM, error de turno, 429, AccionesRapidas y overflow de la línea de tiempo. El conteo pasó a 27 covered y 4 backstop.

## Task Commits

1. **Task 1 (trazador): D-70, LLM-06, el criterio 4 y el contrato de AvisoModelo dicen la opción C+ (G-03-15).** `eea1748` (docs)
2. **Task 2: D-71.1, D-73.5.1, D-75, D-76 y el resto de la UI-SPEC alineados con el código.** `6619387` (docs)

**Plan metadata:** el commit `docs(03-39)` de este SUMMARY.

## Tracer gate (Task 1)

El modo es interactivo, con `human_verify_mode` end-of-phase y un verify solo automatizado. Se volvieron a correr los tres greps del verify y los cuatro criterios de aceptación, todos en verde, y se siguió con la tarea 2 sin checkpoint.

## Files Created/Modified

- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-CONTEXT.md`: D-70 reescrita, línea de requisitos del dominio, subsección con D-71.1, D-73.5.1, D-75 y D-76, idea diferida de la opción A y la nota de G-03-15 en Specific Ideas.
- `.planning/REQUIREMENTS.md`: el texto de LLM-06.
- `.planning/ROADMAP.md`: el criterio de éxito 4 de la Fase 3.
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md`: los contratos, las filas de copia, el contrato de datos y UI Considerations.

## Copia citada (fuente)

- `web/src/config/strings.ts`: `ETIQUETA_DEL_MODELO` ("Sin clave válida"), `MIENTRAS_TANTO`, `AVISO_DEL_MODELO` (título y pasos de los cuatro estados), `TEXTO_MODELO.comprobar` / `comprobando`, `TEXTO_CHAT.enPausa`, `TEXTO_CONFIRMACION.enPausa`, `TEXTO_VISTA_PREVIA.error` / `errorSinConexion`, `ACCION_DEL_AVISO[VOLVER_SESION_ANTERIOR]`, `TEXTO_ACCIONES.demoCorto` / `todosCorto` y `TEXTO_CHAT.irAlFinal`.
- `src/config/strings.ts`: `MENSAJE_AGENTE[PROVEEDOR_SALDO_AGOTADO]` y `[PROVEEDOR_AUTENTICACION]`, `MENSAJE_HTTP.demasiadasSesiones` (con `cantidadDeMinutos`), `MENSAJE_HTTP.vistaPreviaNoDisponible` y `TEXTO_ENVIO_NO_REGISTRADO` (los cinco desenlaces, con `ENVIO-SIMULADO.md` derivado de `ARCHIVOS_SALIDA`).

## Decisions Made

- Las decisiones nuevas van en su propia subsección ("Cierre de brechas de la UAT (2026-10-15, posterior a D-74)"), después de D-73 y antes de Claude's Discretion. D-74 está dentro de "Artefactos y PII", y poner D-71.1 o D-76 ahí habría mezclado temas.
- En la UI-SPEC, las filas que antes eran una sola se separaron en varias cuando el código distingue casos: error de vista previa en 404, 422 y sin conexión, y el banner en título y detalle por estado. Por eso el conteo de UI Considerations pasó de 25 a 27 covered.
- La fila "Errores del agente" sigue citando "La sesión sigue abierta; puedes volver a intentarlo.", porque todavía vale para los demás códigos. Saldo y clave rechazada tienen ahora filas propias.

## Deviations from Plan

### Ajustes menores

**1. [Ubicación] Las decisiones nuevas van en una subsección después de D-73, no pegadas a la línea de D-74**
- **Found during:** Task 2
- **Issue:** el plan dice "agregar después de D-74", pero D-74 está en la sección "Artefactos y PII" (L34), y D-71.1, D-73.5.1, D-75 y D-76 no son de esa sección.
- **Fix:** se creó la subsección "Cierre de brechas de la UAT (2026-10-15, posterior a D-74)" al final de las decisiones. Todas quedan después de D-74 en orden de numeración y agrupadas por tema.
- **Files modified:** 03-CONTEXT.md
- **Committed in:** 6619387

**2. [Coherencia] Dos líneas que el plan no nombraba**
- **Found during:** Tasks 1 y 2
- **Issue:** la cabecera de fuentes de la UI-SPEC decía "LLM-06 reducido", el conteo de UI Considerations quedaba desactualizado al separar filas, y "Specific Ideas" de CONTEXT solo decía "se redujo (D-70)".
- **Fix:** la cabecera dice "LLM-06 según D-70 reescrita", el conteo dice 27 covered y 4 backstop, y Specific Ideas suma la decisión de la usuaria en G-03-15.
- **Files modified:** 03-UI-SPEC.md, 03-CONTEXT.md
- **Committed in:** eea1748, 6619387

---

**Total deviations:** 2 ajustes menores, ninguno de alcance.
**Impact on plan:** ninguno. Solo se tocaron los cuatro documentos del plan.

## Issues Encountered

- La guarda de rama protegida marca `main` como protegida. El orquestador aprobó la ejecución secuencial sobre `main` (`branching_strategy: none`), así que los commits quedaron en `main`. No se hizo push.

## Verification

- Greps de la tarea 1: la UI-SPEC no tiene `demo.ts`; LLM-06 contiene "Comprobar de nuevo"; "Comprobar de nuevo" aparece 5 veces en la UI-SPEC y 1 en `web/src/config/strings.ts`.
- Criterios de la tarea 1: "D-70 (reescrita" presente; "flujo sin modelo se corre" ausente; el criterio 4 no contiene "sigue disponible con"; la frase "Mientras tanto…" está en la UI-SPEC (6) y en `web/src/config/strings.ts` (1).
- Greps de la tarea 2: CONTEXT da 4 líneas con D-75, D-76, D-71.1 o D-73.5.1, y la UI-SPEC da 12 líneas con los cinco literales.
- Criterios de la tarea 2: los seis literales están en la UI-SPEC y en `web/src/config/strings.ts`. Las dos reglas viejas no aparecen. Los commits del plan no tocan 03-01 a 03-27.
- `bun run check`: exit 0. `bun test`: 2234 pass, 1 skip y 0 fail. Este plan no toca código.
- `reto-01/` sin cambios.

## User Setup Required

None. No hace falta configurar ningún servicio externo.

## Next Phase Readiness

- Con este plan, los 39 planes de la Fase 3 tienen SUMMARY. Para cerrar la fase falta la verificación (`/gsd-verify-work 3`) con las human-checks pendientes de 03-28 a 03-38 en el navegador.
- La Fase 4 debe documentar `demo.ts` en el README y SOLUCION.md como la verificación sin modelo del evaluador (D-70 reescrita).
- La opción A ("Procesar sin el modelo") sigue diferida y necesita una decisión de la usuaria (fase 3.1 o 4).

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

- Los cuatro archivos de key-files existen en disco.
- Los commits eea1748 y 6619387 son ancestros de HEAD.
