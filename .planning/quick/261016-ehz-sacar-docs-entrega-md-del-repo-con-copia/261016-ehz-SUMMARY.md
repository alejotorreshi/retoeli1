---
phase: quick-261016-ehz
plan: 01
subsystem: docs
tags: [docs, gitignore, bun-test, entrega]

requires: []
provides:
  - "docs/entrega.md fuera del repositorio, con copia local ignorada en .local/entrega.md"
  - "Guardián en readme.test.ts que impide que la checklist vuelva (archivo, menciones públicas, regla .local/)"
  - "G-04-2 vigilado sobre la línea del pre-flight del README y sobre SOLUCION.md §10"
affects: [entrega, defensa, README, SOLUCION]

actuals:
  tokens: 4910
  tasks: 2
  commits: 2
plan_head_before: 8a26981224f9eabcd916fecc176f437c0b325342
plan_head_after: ea674298e85498e619a2e199174546c0b9320e2a

tech-stack:
  added: []
  patterns:
    - "Archivos personales de la usuaria viven en .local/, ignorada por git"

key-files:
  created:
    - ".local/entrega.md (sin rastrear, ignorada)"
  modified:
    - ".gitignore"
    - "README.md"
    - "SOLUCION.md"
    - "tests/docs/readme.test.ts"
    - "tests/docs/solucion.test.ts"
  deleted:
    - "docs/entrega.md"

key-decisions:
  - "D-99 queda enmendada por la usuaria (2026-10-16): los pendientes humanos viven solo en .local/entrega.md, ya no en el README ni en una checklist commiteada"
  - "La oración de rotación del código de acceso se conserva en SOLUCION.md §10 y en el README por D-94: es postura de seguridad, no un pendiente personal"
  - "El historial de git conserva las versiones anteriores de docs/entrega.md (riesgo aceptado T-261016-ehz-02); reescribirlo exigiría force-push sobre main, que Render despliega solo"

patterns-established:
  - "Un guardián de ausencia: un documento retirado se vigila por archivo ausente, ninguna mención pública y regla de .gitignore"

requirements-completed: [DOC-01, DOC-02]

coverage:
  - id: D1
    description: "docs/entrega.md fuera del índice y del árbol; copia local byte a byte igual (blob 01b782af) e ignorada por .local/"
    requirement: "DOC-01"
    verification:
      - kind: other
        ref: "git hash-object .local/entrega.md = 01b782af0ed62814531e3393084295674e5919d9; git check-ignore -v .local/entrega.md -> .gitignore:16:.local/; git ls-files docs/entrega.md .local vacío"
        status: pass
      - kind: unit
        ref: "tests/docs/readme.test.ts#checklist de entrega fuera del repositorio"
        status: pass
    human_judgment: false
  - id: D2
    description: "README y SOLUCION sin enlace a la checklist; README sin sección Entrega y con remisión a SOLUCION.md §10"
    requirement: "DOC-01"
    verification:
      - kind: unit
        ref: "tests/docs/readme.test.ts#ningún documento público enlaza ni nombra la checklist"
        status: pass
    human_judgment: false
  - id: D3
    description: "G-04-2: el pre-flight del README programa el modo por defecto 10 minutos antes y el --guion la víspera; SOLUCION §10 exige víspera, --guion, ENVIO-SIMULADO.md y turno 1"
    requirement: "DOC-02"
    verification:
      - kind: unit
        ref: "tests/docs/readme.test.ts#programa el modo por defecto 10 minutos antes y el --guion la víspera (G-04-2)"
        status: pass
      - kind: unit
        ref: "tests/docs/solucion.test.ts#la sección 10 nombra lo que exige el plan"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-10-16
status: complete
---

# Quick 261016-ehz: sacar docs/entrega.md del repo Summary

**La checklist de entrega sale del repositorio público y queda solo como `.local/entrega.md`, ignorada por git. Un guardián en `tests/docs/readme.test.ts` impide que vuelva, y G-04-2 se comprueba ahora sobre el README y SOLUCION.md §10.**

## Performance

- **Duration:** cerca de 3 min
- **Started:** 2026-10-16T15:33:50Z
- **Completed:** 2026-10-16T15:35:33Z
- **Tasks:** 2
- **Files modified:** 6 (5 modificados, 1 borrado), más la copia local sin rastrear

## Accomplishments

- `.local/entrega.md` es idéntica al blob commiteado `01b782af0ed62814531e3393084295674e5919d9`. Git la ignora por la línea `.local/` de `.gitignore` (L16), y `docs/entrega.md` ya no existe en el árbol ni en el índice.
- `README.md` pierde la sección `## Entrega`. La viñeta del pre-flight ahora remite a "(el riesgo está en [SOLUCION.md](SOLUCION.md) §10)". La línea del código de acceso y la viñeta de rotación no cambian (D-94).
- `SOLUCION.md` §10 deja de enlazar la checklist en las viñetas de `out/<caso>/` compartido y de operación de la defensa. Lo demás no cambia.
- `tests/docs/readme.test.ts` ya no exige la checklist. G-04-2 se comprueba sobre la línea del pre-flight del README, y un describe nuevo vigila tres cosas: que el archivo no esté, que ningún documento público lo nombre y que exista la regla `.local/`.
- `tests/docs/solucion.test.ts` exige en §10 "víspera", "`--guion`", "ENVIO-SIMULADO.md" y "turno 1".

## Task Commits

1. **Task 1 (tracer): la checklist sale del índice con copia local ignorada, README y SOLUCION quedan sin el enlace** - `eab00fd` (docs)
2. **Task 2: guardián de la checklist fuera del repositorio y G-04-2 en SOLUCION §10** - `ea67429` (test)

## Comprobación con el documento de control (Task 2, paso 3)

Creé un `docs/zz-control.md` temporal con la línea `Ver [la checklist](entrega.md).` y corrí `bun test tests/docs/readme.test.ts -t "fuera del repositorio"`. El resultado fue 2 pass y 1 fail. Falló "ningún documento público enlaza ni nombra la checklist", y el diff nombró `"docs/zz-control.md"`. Borré el archivo enseguida; no se commiteó. Sin él, el guardián pasa.

## Verificación

- Verify de la Task 1: completo en verde, con `bun test tests/docs` (54 pass, 0 fail) y Biome limpio.
- Verify de la Task 2: completo en verde. `bun run check` (tsc del back, tsc del front y Biome sobre 453 archivos) terminó sin errores. `bun test` dio 2494 pass, 2 skip y 0 fail en 118 archivos. Los 2 skip son pruebas en vivo que ya existían y solo corren con `LLM_EN_VIVO`/`COSTO_EN_VIVO`. `reto-01/` no cambió, `.local/` y `docs/entrega.md` no están rastreados, y el código de acceso sigue en el README.

## Decisions Made

- **Enmienda de D-99.** La usuaria decidió el 2026-10-16 que los pendientes humanos ya no van en el README ni en una checklist commiteada. Viven solo en `.local/entrega.md`, en su máquina.
- **Rotación del código (D-94).** La oración "El código de acceso se rota después de la evaluación." se conserva en SOLUCION.md §10, y la viñeta de rotación se conserva en el README. Es la postura de seguridad del proyecto, no un pendiente personal.
- **Riesgo aceptado T-261016-ehz-02.** El historial de git conserva las versiones anteriores de `docs/entrega.md`. No traen secretos: nombran `ACCESS_CODE` sin valor, y el código ya figura literal en el README por D-94. Reescribir el historial exigiría un force-push sobre `main`, que Render despliega solo, y la usuaria no lo pidió. Queda a su decisión.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None. `.local/entrega.md` ya está en la máquina de la usuaria. Si clona el repositorio en otra máquina, no la va a tener: la copia existe solo en este checkout.

## Self-Check: PASSED

- FOUND: .local/entrega.md (ignorada, blob 01b782af)
- MISSING (esperado): docs/entrega.md
- FOUND: eab00fd
- FOUND: ea67429
