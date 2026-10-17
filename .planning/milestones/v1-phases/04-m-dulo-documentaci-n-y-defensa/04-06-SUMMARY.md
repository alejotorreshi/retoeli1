---
phase: 04-m-dulo-documentaci-n-y-defensa
plan: 06
subsystem: docs
tags: [readme, docs, ci-badge, doc-contract-tests, continuidad, bun-test]

requires:
  - phase: 04-m-dulo-documentaci-n-y-defensa
    provides: "04-02 modulo/ and opencode.json, 04-03 CI workflow and checksPass, 04-04 preflight CLI, 04-05 measured cost evidence"
provides:
  - "README.md (Spanish) with the CI badge on the first line, the Render link, the literal access code, one-command start, every .env.example variable, demo, tests, API, pre-flight, module, deploy and docs links"
  - "docs/entrega.md: delivery checklist with the 'Pendientes humanos' task list (D-89, D-93, D-94, D-95, D-87, D-99, A5/A6)"
  - "docs/arquitectura.md: request path in Mermaid, layers and allowed directions, composition roots, cli, modulo/, CI to Render, how to resume"
  - "docs/convenciones.md: the why of each rule and its guardian (G1-G16, W1-W13, sin-comentarios), language, commits, D-62, D-35"
  - "tests/docs/readme.test.ts and tests/docs/continuidad.test.ts: doc-contract tests derived from .env.example, RUTA_API, TIPO_EVENTO, package.json, the guardian test names and src/ folders"
  - "tests/helpers/documentos.helper.ts: shared reader and relative-link resolver for doc tests"
affects: [04-07 SOLUCION.md, eli-qa fresh-clone README walkthrough, defense]

actuals:
  tokens: 12267
  tasks: 2
  commits: 4

plan_head_before: d52dec92639abd60fa3840a4855db9b46869565a
plan_head_after: 02be3ce2483cf38e383f4eb14174c5ad44471eb8

tech-stack:
  added: []
  patterns:
    - "Doc-contract tests: docs are checked against the repo's own sources (env example, route and event constants, package.json, guardian test names, src/ folders), so they cannot drift silently"
    - "Secret injection without echo: a one-off bun -e reads the gitignored token file and replaces a marker, printing only CODIGO_INYECTADO; the test checks only the code's shape with boolean assertions so a failure never prints it"

key-files:
  created:
    - README.md
    - docs/entrega.md
    - docs/arquitectura.md
    - docs/convenciones.md
    - tests/docs/readme.test.ts
    - tests/docs/continuidad.test.ts
    - tests/helpers/documentos.helper.ts
  modified: []

key-decisions:
  - "The README test also requires 'name version' for every runtime dependency of package.json, so the README cannot cite the stale versions of CLAUDE.md's stack table (Pitfall 7)"
  - "docs/entrega.md mentions `bun run costo` only when the cost evidence is pendiente_de_corrida; the test asserts that equality both ways, and today the evidence is medido"
  - "Continuity docs never link README.md or SOLUCION.md (they mention them in backticks), so their link test stays strict with no tolerated paths"

patterns-established:
  - "tests/docs/*.test.ts: one contract test per delivered doc, reading files with leerDocumento and resolving relative links with enlacesRotos"

requirements-completed: [DOC-01, DEMO-05, CAL-05]

coverage:
  - id: D1
    description: "README.md with the CI badge first, the Render link and the literal access code that must match ACCESS_CODE in Render"
    requirement: DOC-01
    verification:
      - kind: unit
        ref: "tests/docs/readme.test.ts#la primera línea es el badge de la CI que enlaza al workflow"
        status: pass
      - kind: unit
        ref: "tests/docs/readme.test.ts#da el link público y un código de acceso real que debe coincidir con ACCESS_CODE de Render"
        status: pass
    human_judgment: false
  - id: D2
    description: "README.md covers one-command start, every .env.example variable, demo, tests, every RUTA_API route, every SSE event, the JSON fallback, pre-flight, module, deploy, docs links and package.json versions"
    requirement: DOC-01
    verification:
      - kind: unit
        ref: "tests/docs/readme.test.ts#nombra entre backticks cada variable de .env.example"
        status: pass
      - kind: unit
        ref: "tests/docs/readme.test.ts#documenta cada ruta de la API y cada evento SSE"
        status: pass
      - kind: unit
        ref: "tests/docs/readme.test.ts#explica cada comando de arranque, pruebas, pre-flight, módulo y despliegue"
        status: pass
      - kind: unit
        ref: "tests/docs/readme.test.ts#cita las versiones de las dependencias de package.json"
        status: pass
    human_judgment: false
  - id: D3
    description: "README.md and docs/entrega.md have no retired model names, no non-empty secret assignments, no provider key and no master values; every relative link resolves"
    requirement: DOC-01
    verification:
      - kind: unit
        ref: "tests/docs/readme.test.ts#%s no trae modelos retirados, claves, secretos ni datos del maestro"
        status: pass
      - kind: unit
        ref: "tests/docs/readme.test.ts#cada enlace relativo de %s apunta a una ruta que existe"
        status: pass
    human_judgment: false
  - id: D4
    description: "The access code in README.md equals ACCESS_CODE in Render, and the CI badge renders green"
    requirement: DEMO-05
    verification: []
    human_judgment: true
    rationale: "The test can only check the code's shape; equality with the Render panel and the badge color after the first push are human checks listed in docs/entrega.md"
  - id: D5
    description: "docs/entrega.md lists every human step of the delivery as a task list"
    verification:
      - kind: unit
        ref: "tests/docs/readme.test.ts#lista los pendientes humanos como tareas"
        status: pass
      - kind: unit
        ref: "tests/docs/readme.test.ts#pide correr el costo solo si la evidencia quedó pendiente"
        status: pass
    human_judgment: false
  - id: D6
    description: "docs/convenciones.md names every guardian id (G1-G16, W1-W13) read from the guardian test names, the no-comments guard, the canonical source, commits, D-62 and D-35"
    requirement: CAL-05
    verification:
      - kind: unit
        ref: "tests/docs/continuidad.test.ts#nombra cada id de guardián que aparece en los nombres de las pruebas guardianas"
        status: pass
      - kind: unit
        ref: "tests/docs/continuidad.test.ts#declara su fuente canónica, los guardianes, los commits y el procedimiento D-62"
        status: pass
    human_judgment: false
  - id: D7
    description: "docs/arquitectura.md names every src/ folder plus web/, modulo/ and .opencode/, has a Mermaid diagram and links estructura, convenciones and limites-del-demo"
    requirement: CAL-05
    verification:
      - kind: unit
        ref: "tests/docs/continuidad.test.ts#nombra entre backticks cada carpeta de src/ y las carpetas de fuera de src/"
        status: pass
      - kind: unit
        ref: "tests/docs/continuidad.test.ts#trae un diagrama Mermaid y enlaza la estructura, las convenciones y los límites del demo"
        status: pass
    human_judgment: false
  - id: D8
    description: "Whole git history is Conventional Commits authored and committed by elianatorres5772"
    requirement: CAL-05
    verification:
      - kind: other
        ref: "git log --format='autor=%an <%ae> committer=%cn <%ce>' | sort -u ; git log --format=%s | grep -vcE '^(feat|fix|docs|test|chore|refactor|style|perf|build|ci|revert)(\\(.+\\))?!?: '"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-10-16
status: complete
---

# Phase 4 Plan 06: README de entrega, checklist y documentación de continuidad Summary

**README en español con el badge de la CI arriba, el link de Render, el código de acceso literal inyectado sin imprimirlo, el arranque en un comando, las 47 variables de `.env.example`, la API con sus eventos SSE, el pre-flight y el módulo. Además, `docs/entrega.md` con los pendientes humanos y `docs/arquitectura.md` y `docs/convenciones.md` para retomar el trabajo. Las cuatro piezas quedan protegidas por pruebas de contrato que se derivan del propio repo.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-16T04:57:11Z
- **Completed:** 2026-10-16T05:08:21Z
- **Tasks:** 2
- **Files modified:** 7 (all created)

## Accomplishments

- `README.md` sigue el orden de la Pattern 8. La primera línea es el badge que enlaza a `actions/workflows/ci.yml`. Después vienen el link `https://registro-proveedor-bfnt.onrender.com` con la línea "Código de acceso: `…`" (con la advertencia de que debe coincidir con `ACCESS_CODE` de Render y de que se rota tras la evaluación), el arranque en un comando, las tablas de variables por grupo con su valor por defecto real de `src/config/env.ts` y las constantes, la demo, las pruebas, la API (las 10 rutas de `RUTA_API`, los 8 eventos de `TIPO_EVENTO`, el latido `: ping` y el respaldo JSON), el pre-flight (`--guion`, unos 10 min antes y el cron como opción), el módulo, el despliegue y los enlaces de la documentación. Las versiones salen de `package.json`.
- `docs/entrega.md` describe qué se entrega (PRD §9.5, con el comando que comprueba que no se commitearon `node_modules/`, `out/` ni `.env`) y trae la lista de tareas "Pendientes humanos" en orden seguro para el bloqueo por IP.
- `docs/arquitectura.md` tiene un diagrama Mermaid del recorrido de un pedido y otro de la CI a Render, la tabla de capas con las direcciones exactas de `PERMITIDOS` del guardián, los tres composition roots, `src/server.ts`, la capa `cli`, `modulo/` con `.opencode/`, el front y la sección "Cómo retomar".
- `docs/convenciones.md` explica el porqué de cada regla en una tabla, cada una con su id: G1–G16, W1–W13, las reglas de capas sin número y la regla sin comentarios. También cubre el idioma, las constantes, los commits con la identidad, D-62 y D-35, y deja `.claude/CLAUDE.md` como fuente canónica.
- Auditoría del historial (CAL-05): 796 commits. Todos tienen autora y committer `elianatorres5772 <elianatorres5772@gmail.com>`, y hay 0 asuntos que no siguen Conventional Commits.

## Task Commits

1. **Task 1 RED:** `bbee038` test(04-06): agregar pruebas que fallan del contrato del README y la entrega
2. **Task 2 RED:** `efa6ac2` test(04-06): agregar pruebas que fallan de la documentación de continuidad
3. **Task 2 GREEN:** `d33cba3` docs(04-06): escribir la arquitectura y las convenciones para retomar el proyecto
4. **Task 1 GREEN:** `02be3ce` docs(04-06): escribir el README de entrega con badge, link, código y API, y la checklist de entrega

**Plan metadata:** se registra en el commit docs(04-06) de cierre.

### TDD evidence

- **Task 1 RED:** `bun test tests/docs/readme.test.ts --reporter=junit` salió con código 1: 0 pass y 13 fail. El clasificador (`check tdd-red-evidence`) devolvió `RED_EVIDENCE_OK` con `target_test_failed` para "la primera línea es el badge de la CI que enlaza al workflow". Evaluación semántica: el objetivo falló en su aserción `toBe(true)` sobre `startsWith("[![")` porque README.md no existía. El helper de lectura devuelve `""` en lugar de lanzar ENOENT, así que todas las fallas son de aserción, sin errores de carga, importación ni sintaxis.
- **Task 2 RED:** `bun test tests/docs/continuidad.test.ts --reporter=junit` salió con código 1: 0 pass y 6 fail. El clasificador devolvió `RED_EVIDENCE_OK` con `target_test_failed` para "nombra cada id de guardián que aparece en los nombres de las pruebas guardianas". Evaluación semántica: el objetivo pasó sus dos `toContain` (encontró G16 y W13 en los guardianes reales) y falló en el `toEqual([])` con la lista G1–G16 y W1–W13 que faltaban, porque docs/convenciones.md no existía.
- **GREEN:** `bun test tests/docs` da 30 pass y 0 fail.
- **REFACTOR:** no hizo falta. El helper compartido `documentos.helper.ts` entró con el RED de la Task 2 y la prueba del README pasó a usarlo en ese mismo commit, solo con cambios de prueba.

## Files Created/Modified

- `README.md`: README de entrega (DOC-01, DEMO-05, D-89, D-93, D-94).
- `docs/entrega.md`: checklist de entrega y pendientes humanos (D-99).
- `docs/arquitectura.md`: vista de continuidad de la arquitectura (CAL-05).
- `docs/convenciones.md`: el porqué de cada regla y qué guardián la vigila (CAL-05).
- `tests/docs/readme.test.ts`: contrato del README y de la entrega.
- `tests/docs/continuidad.test.ts`: contrato de la documentación de continuidad.
- `tests/helpers/documentos.helper.ts`: `leerDocumento`, `enlacesRelativos`, `destinosResueltos` y `enlacesRotos`.

## Decisions Made

- La prueba del README también exige `nombre versión` para cada dependencia de ejecución de `package.json` (exceljs 4.4.0, hono 4.13.13, pdf-lib 1.17.1, pino 10.3.1 y zod 4.6.5). Así el README no puede citar las versiones viejas de CLAUDE.md (Pitfall 7).
- La prueba del código de acceso afirma solo con booleanos (largo ≥ `LONGITUD_MINIMA_CODIGO_ACCESO`, distinto del marcador, marcador ausente). Una falla nunca imprime el código en la salida de la prueba ni en los logs de la CI.
- `docs/entrega.md` incluye `bun run costo` solo cuando la evidencia está en `pendiente_de_corrida`, y la prueba lo exige en ambos sentidos. Hoy la evidencia está `medido`, así que la entrega dice que no queda ninguna corrida de costo pendiente.
- El README explica el `.env` en prosa y no con líneas `LLM_API_KEY=<…>`. Así la regla "ninguna asignación no vacía de una variable secreta" sigue estricta y sin excepciones.
- La documentación de continuidad nombra `README.md` y `SOLUCION.md` entre backticks y no los enlaza. Su prueba de enlaces no tolera ninguna ruta faltante.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Orden de los commits: el GREEN de la Task 2 antes que el GREEN de la Task 1**
- **Found during:** Task 1 (GREEN)
- **Issue:** El README debe enlazar `docs/arquitectura.md` y `docs/convenciones.md`, que crea la Task 2, y la prueba de enlaces del README solo tolera la ausencia de `SOLUCION.md`. Commitear el README primero habría dejado roja su propia verificación.
- **Fix:** Los RED se commitearon en el orden del plan. Después se escribieron y commitearon las docs de la Task 2 (`d33cba3`), y al final el README y la entrega (`02be3ce`). El gate del tracer (re-correr `bun test tests/docs/readme.test.ts`, el grep del marcador y `bun run check`) pasó antes del commit del README.
- **Files modified:** ninguno extra.
- **Verification:** `bun test tests/docs` da 30 pass y 0 fail.
- **Committed in:** `d33cba3` y `02be3ce`

**2. [Rule 2 - Missing Critical] Helper compartido para las pruebas de documentación**
- **Found during:** Task 2 (RED)
- **Issue:** Las dos pruebas de docs necesitaban el mismo lector y el mismo resolvedor de enlaces relativos. Duplicarlos habría dejado dos reglas de enlace que podían divergir.
- **Fix:** Se creó `tests/helpers/documentos.helper.ts`, y `readme.test.ts` pasó a usarlo en el mismo commit RED de la Task 2 (`efa6ac2`).
- **Files modified:** `tests/helpers/documentos.helper.ts` y `tests/docs/readme.test.ts`.
- **Verification:** las dos pruebas pasan, y `bun run check` sale con código 0.
- **Committed in:** `efa6ac2`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** solo cambian el orden de los commits y un helper de prueba. El alcance es el mismo.

## Issues Encountered

- `source` sobre un archivo de referencia en markdown colgó un comando de shell en segundo plano. Se terminó el proceso y el clasificador se corrió directo con `node … < /dev/null`. No afectó al repositorio.

## User Setup Required

Ninguno nuevo. Los pasos manuales de la entrega están en `docs/entrega.md`, en la sección "Pendientes humanos": invitar a los evaluadores, comprobar `ACCESS_CODE` en Render, comprobar la CI y el badge, comprobar el deploy después de los checks, revisar el saldo, hacer el ensayo de eli-qa y el ensayo a mano, revisar SOLUCION.md §9, correr el pre-flight antes de la defensa y rotar el código después.

## Next Phase Readiness

- El plan 04-07 crea `SOLUCION.md`. El README y `docs/entrega.md` ya lo enlazan, y la prueba tolera su ausencia hasta entonces.
- Después del push, alguien tiene que comprobar que el badge sale verde y que Render desplegó después de los checks (A5 y A6, en `docs/entrega.md`).
- `bun run check` está verde. `bun test` da 2435 pass, 2 skip (las suites en vivo opcionales) y 0 fail.

---
*Phase: 04-m-dulo-documentaci-n-y-defensa*
*Completed: 2026-10-16*

## Self-Check: PASSED

- FOUND: README.md, docs/entrega.md, docs/arquitectura.md, docs/convenciones.md, tests/docs/readme.test.ts, tests/docs/continuidad.test.ts, tests/helpers/documentos.helper.ts
- FOUND commits: bbee038, efa6ac2, d33cba3, 02be3ce (ancestros de HEAD)
- Verificación del plan: `bun test tests/docs` da 30 pass y 0 fail. Auditoría del historial: una sola línea de identidad (elianatorres5772 como autora y como committer) y 0 asuntos no convencionales. `bun run check` sale con código 0.
