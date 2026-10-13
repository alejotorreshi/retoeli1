---
phase: 01-n-cleo-determinista
plan: 14
subsystem: paquete
tags: [strings, checklist, borrador, gap-closure, G-01-H4c, GC-2]

requires:
  - phase: 01-13
    provides: borrador builder, type and template that state only tool facts (G-01-H4a, G-01-H4b)
provides:
  - NOMBRE_SOPORTE tipo-to-display-name table in src/config/strings.ts
  - TEXTO_SOPORTE.nombre(tipo) lookup with an Object.hasOwn raw-id fallback
  - borrador-correo.md naming attached and pending soportes in Spanish
  - checklist.md naming soportes in the table (header "Soporte"), motivos and actions
  - motivosDeBloqueo(soportes) exported from checklist.builder.ts for the envío record of plan 01-15
affects: [01-15, simular_envio, ENVIO-SIMULADO.md]

actuals:
  tokens: 5107
  tasks: 2
  commits: 3
plan_head_before: f40384fe6648074c80bda97ec0929c192070669d
plan_head_after: d3747a230737ab4ef9afebe2c4d696b9d15bd60d

tech-stack:
  added: []
  patterns:
    - "Display names resolve only in human-facing builders; tool data and logs keep the machine tipo"
    - "Own-key lookup (Object.hasOwn) before indexing a code-owned table, so prototype-like ids fall back to the raw id"

key-files:
  created:
    - tests/unit/checklist.builder.test.ts
  modified:
    - src/config/strings.ts
    - src/domain/builders/borrador.builder.ts
    - src/domain/types/borrador.type.ts
    - src/knowledge/plantillas/borrador-correo.md
    - src/domain/builders/checklist.builder.ts
    - src/domain/types/checklist.type.ts
    - src/knowledge/plantillas/checklist.md
    - tests/golden/borrador-envio.test.ts
    - tests/golden/paquete.test.ts

key-decisions:
  - "GC-2: the tipo-to-nombre table lives in src/config/strings.ts; an unknown tipo (including constructor, __proto__ and toString) renders as its raw id, nothing is invented"
  - "Checklist.bloqueos, armar_paquete data.bloqueos, data.checklist.soportes[].tipo, resumen, logs and demo stdout keep raw ids (contract v1 unchanged)"
  - "TEXTO_BORRADOR.pendienteVencido takes a display name and reads '<nombre> (soporte vencido, enviaremos la versión actualizada)' so the participle agrees with any name"
  - "motivosDeBloqueo(soportes: readonly SoporteEvaluado[]): readonly string[] gives the same bloqueos in the same order with display names"

patterns-established:
  - "Label function parameter: bloqueoDe(soporte, rotulo) builds both raw tool bloqueos (identity) and human motivos (TEXTO_SOPORTE.nombre) from one rule"

requirements-completed: [PAQ-02, PAQ-04, CAL-03]

coverage:
  - id: D1
    description: "borrador-correo.md names attached and pending soportes by Spanish display name (co, ec, hn)"
    requirement: PAQ-04
    verification:
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#co responde al cliente y lo firma la analista con la razón social del maestro"
        status: pass
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#ec lista los pendientes y no anuncia como adjunto el certificado ausente"
        status: pass
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#hn anuncia el soporte vencido como pendiente y no como adjunto"
        status: pass
    human_judgment: false
  - id: D2
    description: "checklist.md shows the Soporte header, named rows, named motivos and named actions"
    requirement: PAQ-02
    verification:
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#la columna País emisor muestra el país y el aviso va en su propia columna (WR-17)"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#hn checklist.md marca parafiscales vencido y pide renovarlo"
        status: pass
      - kind: unit
        ref: "tests/unit/checklist.builder.test.ts#las filas de soportes muestran el nombre y no traen el tipo"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unknown and prototype-like tipo ids render raw in rows, motivos and actions"
    requirement: CAL-03
    verification:
      - kind: unit
        ref: "tests/unit/checklist.builder.test.ts#un id desconocido o con forma de propiedad heredada se muestra crudo en filas, motivos y acciones"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tool data, resumen, logs and demo stdout keep raw ids; ENVIO-SIMULADO.md unchanged"
    verification:
      - kind: unit
        ref: "tests/unit/checklist.builder.test.ts#construirChecklist conserva los ids crudos en bloqueos y en el orden de los soportes"
        status: pass
      - kind: e2e
        ref: "tests/e2e/demo.test.ts"
        status: pass
      - kind: integration
        ref: "tests/contract/simular-envio.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Readable support names read naturally to the client and the analyst in the delivered borrador and checklist"
    verification: []
    human_judgment: true
    rationale: "Wording quality of the Spanish names in context (QA replay H3/H4) is a human reading judgment"

duration: 3min
completed: 2026-10-13
status: complete
---

# Phase 01 Plan 14: Nombres legibles de soportes en borrador y checklist Summary

**Tabla NOMBRE_SOPORTE en strings.ts con búsqueda segura (Object.hasOwn, id crudo si no existe) que nombra los soportes en español en borrador-correo.md y checklist.md, mientras los datos de las herramientas y los logs conservan el tipo crudo.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-13T04:09:13Z
- **Completed:** 2026-10-13T04:11:57Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `NOMBRE_SOPORTE` (siete pares tipo→nombre) y `TEXTO_SOPORTE.nombre` en `src/config/strings.ts`. Un id desconocido, incluidos `constructor`, `__proto__` y `toString`, sale crudo.
- El borrador nombra los soportes adjuntos ("- Registro Único Tributario (rut-2026.txt)") y los pendientes ("- Certificado de cumplimiento tributario", "- Certificación de aportes parafiscales (soporte vencido, enviaremos la versión actualizada)").
- El checklist muestra la columna "Soporte", filas, motivos ("- ausente: Certificado de cumplimiento tributario") y acciones con el nombre.
- `motivosDeBloqueo(soportes)` exportado para el registro de envío del plan 01-15. `Checklist.bloqueos`, `data.bloqueos`, `resumen`, los logs y el stdout de la demo no cambian.

## Task Commits

1. **Task 1: tabla de nombres en strings.ts, de punta a punta hasta borrador-correo.md** - `1171444` (feat, tracer)
2. **Task 2: checklist con nombres y bloqueos de herramienta crudos**
   - RED: `e3ef656` (test)
   - GREEN: `d3747a2` (feat)

**Plan metadata:** se registra en el commit docs(01-14) de este SUMMARY.

## TDD (Task 2)

- **RED:** `tests/unit/checklist.builder.test.ts` (nuevo, espejo G14) y las aserciones legibles de `tests/golden/paquete.test.ts`. El golden falló en 3 pruebas sobre las aserciones planeadas (esperaba "- ausente: Certificado de cumplimiento tributario", la fila "| Registro Único Tributario | …" y la fila y acción de parafiscales con nombre; recibió los ids crudos y el encabezado "Tipo"). La prueba unitaria falló al cargar porque `motivosDeBloqueo` aún no existía (`SyntaxError: Export named 'motivosDeBloqueo' not found`). Evaluación semántica: el RED del golden es válido (las pruebas objetivo corrieron y fallaron por el comportamiento planeado). El del archivo unitario es una falla de carga, esperable al probar un export nuevo, y no se usó como única evidencia. `workflow.tdd_mode` no está activo, así que no se corrió el clasificador `tdd-red-evidence`.
- **GREEN:** `bloqueoDe(soporte, rotulo)` parametrizado. `construirChecklist` pasa la identidad y `motivosDeBloqueo` pasa `TEXTO_SOPORTE.nombre`. Las filas, `ausentes` y `vencidos` llevan `nombre`, y la plantilla usa `{{nombre}}` con el encabezado "Soporte".
- **REFACTOR:** no hizo falta.

## Files Created/Modified

- `src/config/strings.ts`: `NOMBRE_SOPORTE`, `TEXTO_SOPORTE.nombre` y el nuevo texto de `pendienteVencido`.
- `src/domain/builders/borrador.builder.ts`: adjuntos y pendientes por nombre.
- `src/domain/types/borrador.type.ts`: la fila de `soportes_adjuntos` pasa a `{ nombre, archivo }`.
- `src/knowledge/plantillas/borrador-correo.md`: la fila de adjunto usa `{{nombre}}`.
- `src/domain/builders/checklist.builder.ts`: `bloqueoDe` con rótulo, `motivosDeBloqueo` y filas por nombre.
- `src/domain/types/checklist.type.ts`: `tipo` pasa a `nombre` en `FilaSoporteChecklist`, `ausentes` y `vencidos`.
- `src/knowledge/plantillas/checklist.md`: encabezado "Soporte" y las tres variables a `{{nombre}}`.
- `tests/unit/checklist.builder.test.ts`: bloqueos crudos, motivos con nombre, filas, acciones y fallback crudo.
- `tests/golden/borrador-envio.test.ts` y `tests/golden/paquete.test.ts`: solo las líneas legibles fijadas.

## Decisions Made

- La regla GC-2 se aplica tal como está escrita. Los nombres viven en `strings.ts` y solo se resuelven en las salidas para personas. El contrato v1 (bloqueos, resumen, logs) no cambia.
- `pendienteVencido` dice "soporte vencido" para que la concordancia funcione con cualquier nombre ("Certificación …", "Certificado …").
- En el golden de ec, la aserción que pedía el id crudo en el checklist (`toContain("certificado_cumplimiento_tributario")`) pasó a `not.toContain`. Así se fija la verdad GC-2: ningún id snake_case en checklist.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Formato Biome de la prueba unitaria nueva**
- **Found during:** Task 2 (GREEN, `bun run check`)
- **Issue:** Biome pedía partir en varias líneas un `toEqual` de `tests/unit/checklist.builder.test.ts` que venía del commit RED.
- **Fix:** `biome format --write` sobre ese archivo, incluido en el commit GREEN.
- **Files modified:** tests/unit/checklist.builder.test.ts
- **Verification:** `bun run check` en verde.
- **Committed in:** d3747a2

---

**Total deviations:** 1 auto-fixed (1 blocking, solo formato)
**Impact on plan:** ninguno en el comportamiento ni en el alcance.

## Issues Encountered

None

## Verification

- `bun run check` (tsc, Biome y bun audit) termina con exit 0.
- `bun test` pasa completo: 490 pruebas, 0 fallas, incluidas `tests/architecture.test.ts` (G8, G9, G12, G14), `tests/sin-comentarios.test.ts`, `tests/e2e/demo.test.ts`, `tests/e2e/pii.test.ts`, `tests/e2e/determinismo.test.ts` y `tests/contract/simular-envio.test.ts`, que no se tocó.
- `tests/unit/soportes.policy.test.ts`, `tests/e2e/demo.test.ts` y `tests/contract/simular-envio.test.ts` no tienen cambios en el diff.
- Demo con `FECHA_EJECUCION=2026-09-03`: el stdout conserva los ids crudos ("Soportes ausentes: certificado_cumplimiento_tributario", "BLOQUEADO (vencido: parafiscales (2026-08-31))"). Un escaneo de `out/*/paquete/{checklist,borrador-correo}.md` no encontró ningún id snake_case de soporte.
- No se corrió el replay QA de `.qa/suites/01.suite.json`. Queda para la verificación de fase (H3 y H4 con nombres legibles; T04 y T12 sin cambios).

## Gap status

Cierra la mitad borrador + checklist de **G-01-H4c**. El plan 01-15 cierra el gap: los bloqueos de ENVIO-SIMULADO.md por nombre, con `TEXTO_SOPORTE` y `motivosDeBloqueo`, y la guarda transversal entre salidas. ENVIO-SIMULADO.md sigue sin cambios después de este plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Listo para 01-15, que reutiliza `TEXTO_SOPORTE.nombre` y `motivosDeBloqueo(soportes)` en `construirDatosEnvio` y agrega los casos de ids con forma de prototipo a `borrador.builder.test.ts`.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-13*

## Self-Check: PASSED

- FOUND: tests/unit/checklist.builder.test.ts, src/config/strings.ts, src/domain/builders/checklist.builder.ts, src/knowledge/plantillas/checklist.md
- FOUND commits: 1171444, e3ef656, d3747a2 (ancestors of HEAD)
