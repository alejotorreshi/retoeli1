---
phase: 03-chat-web-api-sse-y-despliegue
plan: 28
subsystem: ui
tags: [zod, react, sse, panel-casos, gap-closure, G-03-17]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: panel de casos (progresoPorCaso, marcasDeArchivos), vista de sesión y eventos tool_start/tool_end con caso
provides:
  - argumentosConCasoSchema con el caso validado por PATRON_CASO (el servidor nunca publica caso "")
  - casoDelPanel(llamada, casosConocidos), el único predicado de caso real del front
  - CODIGOS_DE_CASO_REFUTADO (CASO_NO_ENCONTRADO, CASO_INVALIDO) en web/src/config/constants/ui.constants.ts
  - progresoPorCaso y marcasDeArchivos con config opcional (casos de /api/config)
  - indicador y región viva que no cuelgan separador ni preposición con el listado
affects: [panel-casos, lista-archivos, tarjeta-resultado, hidratacion, indicador-pensando, bitacora, compuerta]

actuals:
  tokens: 6400
  tasks: 2
  commits: 3
plan_head_before: 6431b13cfdb41994a5f3a6475aa6c790eeb72f57
plan_head_after: ab850c7a180e3c37ab7c660cc21d59363f60d9ec

tech-stack:
  added: []
  patterns:
    - "Normalizar en la fuente: el caso del modelo pasa PATRON_CASO en el esquema antes de llegar a cualquier superficie (SSE, vista de sesión, bitácora, compuerta)"
    - "Un solo predicado de caso real en el front (casoDelPanel) para panel, marcas de archivos, tarjetas de resultado e indicador"

key-files:
  created:
    - tests/unit/despacho-llamada.service.test.ts
  modified:
    - src/loop/schemas/resultado-herramienta.schema.ts
    - web/src/state/casos.ts
    - web/src/state/conversacion.ts
    - web/src/config/constants/ui.constants.ts
    - tests/loop/listar-casos.test.ts
    - tests/unit/vista-sesion.service.test.ts
    - tests/web/progreso.test.ts

key-decisions:
  - "G-03-17: un caso no vacío que no está en /api/config, o cuyo tool_end falló con CASO_NO_ENCONTRADO o CASO_INVALIDO, no entra al panel ni a las marcas de archivos; sin config cargada rigen solo el patrón y la refutación"
  - "El indicador y la región viva nombran un caso desconocido con patrón válido mientras su llamada corre (casoDelPanel con casosConocidos null); el caso vacío no se nombra"
  - "La refutación es por llamada: un caso real con otro fallo (p. ej. ERROR_INTERNO) sigue en el panel con su etapa en error"

patterns-established:
  - "casoDelPanel: todo selector del front que decide si una llamada pertenece a un caso pasa por este predicado, nunca compara llamada.caso con null"

requirements-completed: [UI-07, UI-08, UI-06, UI-05, UI-02, UI-01, API-01, API-02]

coverage:
  - id: D1
    description: "El servidor publica caso null para el listado (caso \"\") y para cualquier caso que no cumpla PATRON_CASO, en tool_start, tool_end y la vista de sesión"
    requirement: "API-01"
    verification:
      - kind: unit
        ref: "tests/unit/despacho-llamada.service.test.ts"
        status: pass
      - kind: integration
        ref: "tests/loop/listar-casos.test.ts#el tool_start y el tool_end del listado salen con caso null, nunca con el caso vacío (G-03-17)"
        status: pass
      - kind: unit
        ref: "tests/unit/vista-sesion.service.test.ts#el listado de casos (leer_solicitud con caso vacío) vuelve con caso null (G-03-17)"
        status: pass
    human_judgment: false
  - id: D2
    description: "El listado con la forma real del cable no agrega bloques al panel ni marcas de archivos, en vivo, al cerrar el turno y al recargar"
    requirement: "UI-07"
    verification:
      - kind: unit
        ref: "tests/web/progreso.test.ts#el listado de casos no agrega bloques al panel ni pide archivos (G-03-17)"
        status: pass
      - kind: unit
        ref: "tests/web/progreso.test.ts#al recargar, el listado tampoco agrega bloques ni marcas (G-03-17)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Un caso desconocido (fuera de /api/config) o refutado (CASO_NO_ENCONTRADO, CASO_INVALIDO) no entra al panel ni a las marcas"
    requirement: "UI-08"
    verification:
      - kind: unit
        ref: "tests/web/progreso.test.ts#un caso desconocido o refutado no entra al panel ni a las marcas (G-03-17, T-03-46)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Con el listado en curso el indicador dice 'Leyendo la solicitud…' y la región viva 'Ejecutando Leer solicitud'"
    requirement: "UI-01"
    verification:
      - kind: unit
        ref: "tests/web/progreso.test.ts#el indicador y la región viva con el listado en curso (G-03-17)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Receta T12 en el navegador con el LLM falso: tras '¿Qué casos hay?' el panel no muestra un bloque nuevo y la consola no registra GET /api/casos//archivos"
    requirement: "UI-07"
    verification: []
    human_judgment: true
    rationale: "La receta T12 de .qa/suites/03.suite.json necesita el navegador (Playwright MCP), que el ejecutor no tuvo disponible; las pruebas de reductor y bucle cubren la causa raíz, pero la ausencia del 404 en la consola real queda para la UAT"

duration: 5min
completed: 2026-10-15
status: complete
---

# Phase 03 Plan 28: Listado de casos sin caso fantasma en el panel (G-03-17) Summary

**El servidor valida el caso del modelo con PATRON_CASO (el listado sale con caso null) y el front decide qué es un caso real con un solo predicado, casoDelPanel, que además descarta casos refutados o fuera de /api/config.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-15T16:48:00Z
- **Completed:** 2026-10-15T16:52:38Z
- **Tasks:** 2
- **Files modified:** 8 (1 creado, 7 modificados)

## Accomplishments

- `argumentosConCasoSchema` valida `caso` con `PATRON_CASO`. `casoDeArgumentos` da null para `""`, `"../x"`, mayúsculas, números o argumentos sin caso, y las demás superficies heredan el null sin cambiar código: el SSE, la vista de sesión, la bitácora, el cierre del turno y la compuerta.
- `casoDelPanel(llamada, casosConocidos)` en `web/src/state/casos.ts` es el único predicado de caso real. Lo usan el progreso (`plegarTurno`), las marcas de archivos (`casosDelTurno`), las tarjetas de resultado (`plegarPorCaso`), el indicador y la región viva.
- `progresoPorCaso` y `marcasDeArchivos` aceptan un `config` opcional. `app.tsx` no cambia, porque ya les pasa el estado completo, y las llamadas sin config de los otros tests siguen compilando.
- El listado con la forma real del cable (caso `""`, ok false, `CASO_NO_ENCONTRADO`, resultado null) queda probado en vivo, al cerrar el turno, en las marcas y al recargar, con caso `""` y con caso null.

## Task Commits

1. **Task 1: Trazador: el listado sale del servidor con caso null y el panel no agrega un bloque.** `162002f` (fix)
2. **Task 2: Caso desconocido, recarga e indicador con el mismo predicado.** RED `7403e73` (test), GREEN `ab850c7` (feat)

**Plan metadata:** commit de docs que cierra este plan.

## Files Created/Modified

- `src/loop/schemas/resultado-herramienta.schema.ts`: `caso` con `.regex(PATRON_CASO)`.
- `web/src/state/casos.ts`: `casoDelPanel`, `resultadoConCaso`, y `config` opcional en `progresoPorCaso` y `marcasDeArchivos`.
- `web/src/state/conversacion.ts`: `etiquetaPensando` y `anuncioDeEstado` usan `casoDelPanel(llamada, null)`.
- `web/src/config/constants/ui.constants.ts`: `CODIGOS_DE_CASO_REFUTADO`.
- `tests/unit/despacho-llamada.service.test.ts` (nuevo): espejo de `casoDeArgumentos` y `casoDeLlamada`.
- `tests/loop/listar-casos.test.ts`: tool_start y tool_end del listado con caso null.
- `tests/unit/vista-sesion.service.test.ts`: el listado vuelve con caso null en la vista de sesión.
- `tests/web/progreso.test.ts`: el listado real (en vivo, al cerrar, en marcas, al recargar), el caso desconocido con config, la refutación sin config, el fallo no refutado y el indicador.

## Decisions Made

- **Supuesto de G-03-17 (quinta verdad de must_haves):** un caso no vacío que no está entre los casos de `/api/config`, o cuyo `tool_end` falló con `CASO_NO_ENCONTRADO` o `CASO_INVALIDO`, no entra al panel ni a las marcas de archivos. Sin config cargada rigen solo el patrón y la refutación. Con eso, sin config, un `tool_start` de un caso desconocido con patrón válido se ve en curso a mitad del turno y desaparece con su `tool_end` refutado.
- La refutación se evalúa por llamada. Un caso real con otro código de fallo (por ejemplo `ERROR_INTERNO`) sigue en el panel con su etapa en error. Por eso el helper `fin` de `tests/web/progreso.test.ts` usa ahora `ERROR_INTERNO` para los fallos genéricos.
- El indicador y la región viva siguen nombrando un caso desconocido con patrón válido mientras su llamada corre, porque describen lo que hace el agente. El caso vacío no se nombra, y `web/src/config/strings.ts` no cambió.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El helper de fallos de progreso.test.ts usaba CASO_NO_ENCONTRADO para todo fallo**
- **Found during:** Task 1 (al diseñar la refutación de la tarea 2)
- **Issue:** `fin(..., ok=false)` emitía `CASO_NO_ENCONTRADO` en cualquier fallo, así que con la refutación las filas de "etapa en error" (generar, armar, enviar) habrían dejado de ver el error de un caso real.
- **Fix:** `fin` usa `CODIGO_ERROR.ERROR_INTERNO` para los fallos genéricos. El listado y el caso refutado usan `lecturaRefutada(caso, codigo)` con el código explícito.
- **Files modified:** tests/web/progreso.test.ts
- **Verification:** las filas de error de las etapas siguen en verde y hay una fila nueva de "un caso real con otro fallo sigue en el panel".
- **Committed in:** 162002f

**2. [Rule 1 - Bug] Comparaciones con null dentro de los pliegues**
- **Found during:** Task 1 (criterio de aceptación 3)
- **Issue:** tras el primer cambio, `plegarPorCaso` y `plegarTurno` seguían comparando con null el resultado de `casoDelPanel`, y el grep del criterio las encontraba.
- **Fix:** `plegarPorCaso` itera sobre `resultadoConCaso` y `PlegadoDeProgreso.registrar` acepta `caso: string | null`. Los tres pliegues solo llaman a `casoDelPanel`.
- **Files modified:** web/src/state/casos.ts
- **Verification:** el grep de `caso === null|caso !== null` solo imprime líneas de `casoDelPanel`, `resultadoConCaso` y `registrar`.
- **Committed in:** 162002f

---

**Total deviations:** 2 auto-fixed (2 Rule 1)
**Impact on plan:** las dos eran necesarias para cumplir los criterios sin regresiones. No amplían el alcance.

## Issues Encountered

- La guarda de rama protegida del ejecutor marca `main` como protegida (`git.base-branch --is-protected main` → true). El orquestador despachó la ejecución secuencial sobre el árbol principal, `git.branching_strategy` es `none` y toda la fase se commitea en `main`, así que los commits quedaron en `main`. No se hizo push. Para que la guarda no lo marque de nuevo, alguien con autoridad sobre el repo puede agregar `git.allow_default_branch_commits: true` en `.planning/config.json`.
- La fila de recarga de la tarea 2 ya pasaba en RED, porque el patrón de la tarea 1 descarta el `""`. Las filas rojas fueron el caso desconocido con config, la refutación sin config y el indicador.
- No se corrió la receta T12 en el navegador (verificación del plan). Queda como D5 con `human_judgment: true`.

## User Setup Required

None. No hace falta configurar servicios externos.

## Next Phase Readiness

- G-03-17 queda cerrado a nivel de código y pruebas. Falta confirmar la receta T12 en la UAT, con el navegador y el LLM falso.
- Siguen los planes de cierre de brechas 03-29 a 03-37.

## Self-Check: PASSED

- Los 8 archivos de key-files existen en disco.
- Los commits 162002f, 7403e73 y ab850c7 son ancestros de HEAD.
- `bun test`: 2148 pass, 0 fail. `bun run check` (tsc, tsc web, Biome y bun audit) en verde. Guardianes G1–G16, W1–W13 y sin-comentarios: 106 pass.
- Criterios de aceptación de las tareas 1 y 2 verificados por grep y por pruebas.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*
