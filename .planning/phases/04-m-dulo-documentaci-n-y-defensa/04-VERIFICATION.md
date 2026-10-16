---
phase: 04-m-dulo-documentaci-n-y-defensa
verified: 2026-10-16T07:00:10Z
status: passed
score: 13/15 must-haves verified (criterios 1, 2, 3 y 5 del ROADMAP y 9 de las 10 truths del 04-08; el criterio 4 en remoto y la truth operativa de G-04-2 esperan a una persona)
covered_files: [".claude/CLAUDE.md",".env.example",".gitattributes",".github/workflows/ci.yml",".gitignore",".opencode/tools/proveedor.ts",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-01-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-01-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-02-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-02-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-03-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-03-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-04-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-04-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-05-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-05-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-06-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-06-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-07-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-07-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-08-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-08-SUMMARY.md",".qa/evidence/04-m-dulo-documentaci-n-y-defensa/04-QA-EVIDENCE-2026-10-16T05-53-02Z.md",".qa/evidence/04-m-dulo-documentaci-n-y-defensa/04-QA-EVIDENCE-2026-10-16T06-26-20Z.md",".qa/evidence/04-m-dulo-documentaci-n-y-defensa/04-QA-EVIDENCE-2026-10-16T06-56-31Z.md","README.md","SOLUCION.md","docs/arquitectura.md","docs/convenciones.md","docs/entrega.md","docs/estructura.md","docs/evidencia/costo-por-caso.json","docs/limites-del-demo.md","docs/plantillas.md","modulo/README.md","modulo/agent.md","modulo/skill/registro-proveedor/SKILL.md","modulo/tools/proveedor.ts","opencode.json","package.json","render.yaml","src/cli/runners/generar-modulo.runner.ts","src/cli/runners/preflight.runner.ts","src/cli/schemas/preflight.schema.ts","src/cli/types/modulo.type.ts","src/cli/types/preflight.type.ts","src/config/constants/costo.constants.ts","src/config/constants/files.constants.ts","src/config/constants/http.constants.ts","src/config/constants/modulo.constants.ts","src/config/constants/preflight.constants.ts","src/config/env.ts","src/config/strings.ts","src/domain/builders/modulo.builder.ts","src/infra/output/output-files.adapter.ts","tests/architecture.test.ts","tests/cli/preflight.test.ts","tests/despliegue/ci.test.ts","tests/despliegue/contrato-despliegue.test.ts","tests/docs/continuidad.test.ts","tests/docs/evidencia-costo.test.ts","tests/docs/readme.test.ts","tests/docs/solucion.test.ts","tests/helpers/costo.helper.ts","tests/helpers/documentos.helper.ts","tests/helpers/types/costo.type.ts","tests/live/costo-por-caso.test.ts","tests/modulo/generador.test.ts","tests/modulo/herramientas.test.ts","tests/modulo/opencode.test.ts","tests/sin-comentarios.test.ts","tests/unit/modulo.builder.test.ts","tsconfig.json"]
covered_digest: "v3:sha256:f6abd66d08406fb0506be56a342f1f71e09431fe84cbd41dad80c97b653fdbf5"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 12/15
  gaps_closed:
    - "Criterio 5 (DEP-03): el pre-flight por defecto y el --guion corrieron en vivo contra Render con exit 0 después del chequeo SSE estricto (no-cache y no-transform), con la salida cruda registrada en 04-QA-EVIDENCE-2026-10-16T06-56-31Z.md"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Abrir https://github.com/alejotorreshi/retoeli1/actions y mirar la corrida del workflow CI sobre 7186c2b (el HEAD publicado), y el badge en el README de GitHub"
    expected: "El job Verificar (check, test, demo.ts, build:web) termina en verde, el job de auditoría no lo bloquea y el badge se ve verde"
    why_human: "No hay ninguna corrida remota de Actions registrada en el repo, y este verificador no puede verla (sin gh, repo privado). La evidencia indirecta de la UAT T06, que Render sirve el bundle de HEAD, no sirve: web/ no cambia desde 04e0b03 (fase 3), así que el mismo bundle ya se servía antes de que existieran la CI y checksPass"
  - test: "En Render Events, comprobar que el último deploy esperó a checksPass y corresponde a un commit de la fase 4; en el panel, que ACCESS_CODE es exactamente el código del README"
    expected: "Hay un deploy disparado por checks verdes de un commit de la fase 4, y el código coincide (eli-qa ya lo confirmó en memoria contra .qa/render.token)"
    why_human: "Render Events y las variables con sync: false solo se ven en el panel"
  - test: "El día de la defensa, mirar el panel 'Archivos de ec-corp-andina' antes del turno 1"
    expected: "No aparece ENVIO-SIMULADO.md ni el paquete de una corrida anterior; si aparecen, la analista los explica como dice docs/entrega.md y el turno 1 los reemplaza"
    why_human: "La truth operativa de G-04-2 no la garantiza el código, por diseño (AR-02); depende de que el --guion se haya corrido la víspera y de que Render vacíe el disco al dormir"
  - test: "Revisar los veredictos automáticos de 04-UAT.md (T01 a T10, decididos por el orquestador en una corrida nocturna) y las prohibiciones de nivel judgment: (a) modulo/README.md no afirma un ensayo en vivo en OpenCode; (b) no se reescribió historia publicada; (c) el 04-08 y la iteración 2 del fix no cambiaron la conducta del agente, la API ni la SPA"
    expected: "La usuaria acepta los pass. El verificador da PASS no autoritativo a las tres prohibiciones: modulo/README.md:33 dice 'no ensayado en vivo (D-83)'; origin/main solo avanzó por push fast-forward (dec6481 → 9642da4 → 950e626 → 7186c2b); git diff 552162e..HEAD no toca src/http, loop, llm, tools, domain, application, infra, web, agent, modulo ni reto-01, y la cabecera del servidor sigue siendo 'no-cache, no-transform'"
    why_human: "unverified-prohibition — human review recommended (judgment tier, ADR-550 D4); los veredictos de la UAT se decidieron sin una persona presente"
  - test: "La usuaria revisa el texto de SOLUCION.md §9 (Uso de IA) y hace una vez a mano el ensayo del §11 en el navegador la víspera"
    expected: "§9 refleja con fidelidad el uso de la IA (D-87); el ensayo muestra tool calls, faltantes, listo_para_firma y la pregunta de cierre, y 'envía' produce ENVIO-SIMULADO.md solo tras la confirmación"
    why_human: "Juicio de autoría y ensayo propio de la defensa (D-95); no bloquean el criterio 5, que ya cubren T08 y T09 en vivo"
  - test: "Opcional: cargar el módulo en una sesión real de OpenCode (UAT T11, diferido por D-83)"
    expected: "Aparecen el agente, la skill y las herramientas proveedor_*"
    why_human: "No se instala OpenCode en la fase; la evidencia automática es tests/modulo/opencode.test.ts"
---

# Phase 4: Módulo, documentación y defensa: informe de verificación

**Phase Goal:** Los evaluadores pueden reutilizar el agente como módulo desde la misma fuente que usa la app, entender y continuar la solución leyendo la documentación, y ver la defensa en vivo correr sobre el link público sin sorpresas.
**Verified:** 2026-10-16T07:00:10Z
**Status:** human_needed
**Re-verification:** Sí. El informe anterior quedó viejo por 6c54c18 (escáner T-04-22) y la iteración 2 del fix de la revisión (07dd7ea a db767c4).

## Goal Achievement

### Observable Truths

Criterios de éxito del ROADMAP (contrato):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `modulo/` tiene las tres piezas con su frontmatter, el generador las actualiza, y los tests de igualdad byte a byte, identidad e importación sin env pasan y fallan con deriva | ✓ VERIFIED | `bun test tests/modulo tests/cli tests/docs` en el checkout: 134 pass, 0 fail, 0 skip. En una copia sin `.git` (`git archive HEAD`, `NO_GIT`, `bun install --frozen-lockfile`), `tests/modulo tests/cli` dio 75 pass, 1 skip (el `check-attr`, que es lo correcto fuera de git) y 0 fail. El cambio IN-02 del generador (restaurar el par si falla un temporal o un renombre) lo probé con una mutación: al quitar la restauración falla "si falla el renombre de SKILL.md, agent.md vuelve a su contenido previo…" |
| 2 | Un dev nuevo levanta el proyecto con el README; arquitectura y convenciones permiten retomar; historial convencional con la identidad `elianatorres5772` | ✓ VERIFIED | `tests/docs` verde (README §9.2, continuidad). Auditoría de todo el historial: 840 commits, todos con autor y committer `elianatorres5772 <elianatorres5772@gmail.com>`, y 0 asuntos fuera de Conventional Commits. La copia sin `.git` sigue en 0 fail (G-04-1 sin regresión tras el cambio en `generador.test.ts`) |
| 3 | `SOLUCION.md` con las 10 secciones del PRD, costo real, portal, ≥3 trade-offs, supuestos, cobertura por HU y uso de IA | ✓ VERIFIED | `tests/docs/solucion.test.ts` pasa (orden, §4 contra `docs/evidencia/costo-por-caso.json` en estado `medido`, trade-offs, §10). Ahora también corre `asignacionesSecretas` con el patrón ampliado |
| 4 | GitHub Actions corre `bun test`, `bun run demo.ts`, `tsc --noEmit` y lint en verde, y el README muestra el badge | ? UNCERTAIN (humano) | En el repo está en orden: `ci.yml` con los pasos y pines (contrato en `tests/despliegue/ci.test.ts`, verde), y el badge es la línea 1 del README. Corrí los mismos pasos en local sobre HEAD: `bun run check` exit 0 (453 archivos), `bun test` 2495 pass, 2 skip (los opt-in `COSTO_EN_VIVO` y `LLM_EN_VIVO`) y 0 fail, `bun run demo.ts` exit 0 y `bun run build:web` exit 0. Pero la corrida remota en verde no está observada: no hay ninguna URL ni resultado de Actions en `.qa/` ni en `.planning/`, y no tengo `gh`. Además, la evidencia indirecta de la UAT T06 no prueba nada, porque `web/` no cambia desde 04e0b03 (fase 3). El bundle `index-DMkAAHK6.js` que sirve Render hoy ya existía antes de la CI y de `checksPass` |
| 5 | El pre-flight calienta Render y verifica health y SSE, y el guion §11 completo se ensaya con éxito sobre el link público | ✓ VERIFIED | El script está verificado en el repo (tests contra un socket real). En vivo hay salida cruda registrada, no solo un veredicto. En 04-QA-EVIDENCE-2026-10-16T06-56-31Z.md (sobre 7186c2b, ya con el chequeo estricto): T07 dio exit 0 con un arranque en frío absorbido en 21,7 s, y T08 `--guion` dio exit 0 con "Turno 1 … OK", "Turno 2 … OK" y los tokens. El ensayo en el navegador con Playwright (T09) pasó antes. Mi propio `GET /api/health` respondió `{"ok":true,…,"llm":"disponible"}`. El ensayo manual de la usuaria es un seguimiento, no una condición del criterio |

Truths del plan 04-08:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | G-04-1: un dev nuevo que descarga el repo y corre `bun test` obtiene 0 fallos | ✓ VERIFIED | Copia sin `.git` de HEAD, 0 fail en `tests/modulo tests/cli` (las suites que cambiaron). El `bun test` completo sin git ya había dado 0 fail sobre el árbol anterior, y los cambios posteriores no tocan el chequeo de `.gitattributes` |
| 7 | G-04-1: en una copia sin `.git`, `bun test tests/modulo` y el completo dan 0 fail | ✓ VERIFIED | Ver fila 6 |
| 8 | G-04-1: WR-02 se comprueba sin git leyendo `.gitattributes` | ✓ VERIFIED | El test ".gitattributes fija LF … sin depender de git" (`generador.test.ts:160`) pasa en la copia sin git. Las mutaciones `eol=crlf` y "sin regla `*.md`" ya se probaron en la verificación anterior, y ese test no cambió |
| 9 | G-04-1: en el checkout, `git check-attr` corre sin skip | ✓ VERIFIED | `test.skipIf(!ES_CHECKOUT_DEL_PROYECTO)` (`generador.test.ts:168`). En el checkout `tests/modulo` dio 0 skip, y fuera de git, 1 skip |
| 10 | G-04-1: un `.gitattributes` con `*.md text eol=crlf` hace fallar el test sin git | ✓ VERIFIED | Mutación de la verificación anterior. El test y el helper no cambiaron desde entonces |
| 11 | G-04-2: en la defensa, una sesión nueva no muestra archivos viejos que puedan confundirse con un envío | ? UNCERTAIN (humano) | Por diseño, el código no lo garantiza: `out/<caso>/` es del caso según el PRD, y el riesgo está aceptado como AR-02 en 04-SECURITY.md. La mitigación es operativa (`--guion` la víspera y el sueño de Render, que vacía el disco), y solo se puede observar el día de la defensa. Ver la sugerencia de override abajo |
| 12 | G-04-2: `docs/entrega.md` pone el `--guion` y los ensayos la víspera y explica la corrida anterior | ✓ VERIFIED | Sin cambios desde la verificación anterior, y `tests/docs/readme.test.ts` lo fija |
| 13 | G-04-2: SOLUCION.md §10 registra el riesgo y el arreglo de producción | ✓ VERIFIED | MENCIONES[10] de `solucion.test.ts` en verde |
| 14 | G-04-2: el README pone el `--guion` la víspera | ✓ VERIFIED | La línea 174 sigue igual. La 173 cambió solo para nombrar `no-transform`, y coincide con el código (`prohibeCacheYTransformacion`) |
| 15 | `bun run check` y el `bun test` completo siguen en verde, y tests/docs fija entrega, README y §10 | ✓ VERIFIED | Corrida propia: check exit 0, y test 2495/2/0 en 118 archivos. Es lo mismo que reporta el orquestador (2497 tests) |

**Score:** 13/15 verificadas. Las 2 inciertas van a revisión humana. Hay 0 truths presentes con la conducta sin verificar.

**Override sugerido (truth 11).** La desviación es intencional: el plan 04-08 la cerró solo con documentación, y el riesgo AR-02 lo aceptó la usuaria. Si la usuaria lo acepta, puede agregar al frontmatter:

```yaml
overrides:
  - must_have: "G-04-2 (DEP-03): En la defensa, una sesión nueva no muestra archivos viejos de otra sesión que puedan confundirse con un envío ya hecho"
    reason: "out/<caso>/ es del caso por el PRD; riesgo aceptado AR-02, mitigado con --guion la víspera y documentado en docs/entrega.md y SOLUCION.md §10"
    accepted_by: "elianatorres5772"
    accepted_at: "<ISO timestamp>"
```

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `modulo/agent.md`, `modulo/skill/registro-proveedor/SKILL.md`, `modulo/tools/proveedor.ts`, `opencode.json`, `.opencode/tools/proveedor.ts` | Módulo como fuente única | ✓ VERIFIED | Sin cambios desde 552162e. Los tests de igualdad e identidad pasan |
| `src/cli/runners/generar-modulo.runner.ts` | Generador con escritura segura del par | ✓ VERIFIED | `escribirJuntos` lee los bytes previos, renombra uno por uno, restaura lo ya renombrado si algo falla y borra los temporales en `finally`. La mutación lo confirma |
| `src/cli/runners/preflight.runner.ts` | Pre-flight con chequeo SSE estricto | ✓ VERIFIED | `prohibeCacheYTransformacion` exige `no-cache` y `no-transform` (`every`). Al mutarlo a `some`, falla "si el Cache-Control llega con no-cache pero sin no-transform…" |
| `src/config/constants/http.constants.ts` | Valor del servidor derivado | ✓ VERIFIED | `SIN_CACHE_NI_TRANSFORMACION` sale de `DIRECTIVA_CACHE` con `", "`, así que sigue valiendo `"no-cache, no-transform"`, y `chat.route.ts:124` lo usa |
| `tests/helpers/documentos.helper.ts` | Escáner de asignaciones secretas | ✓ VERIFIED | `VARIABLES_SECRETAS` incluye `LLM_FALLBACK_API_KEY` y `PREFLIGHT_ACCESS_CODE`, y el patrón busca en cualquier parte de la línea. `readme.test.ts:225` lo aplica a README, `docs/**/*.md` y `modulo/README.md`, con control positivo, control negativo y sincronía con `.env.example` |
| `.github/workflows/ci.yml`, `render.yaml`, `README.md` (badge) | CI y despliegue tras checks | ✓ VERIFIED (repo) | Contratos en verde. Lo remoto queda en el ítem humano 1 |
| `docs/*`, `SOLUCION.md`, `README.md` | Documentación | ✓ VERIFIED | `tests/docs` en verde |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| `src/http/routes/chat.route.ts` | `VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION` | `response.headers.set(CABECERA.CACHE_CONTROL, …)` | ✓ WIRED |
| `preflight.runner.ts` | `DIRECTIVA_CACHE` | `cabeceraSseFaltante` → `prohibeCacheYTransformacion` | ✓ WIRED |
| `tests/docs/readme.test.ts` | `docs/**/*.md`, `modulo/README.md` | `documentosMarkdown(RAIZ, CARPETA_DOCS)` + `asignacionesSecretas` | ✓ WIRED |
| `tests/docs/readme.test.ts` | `SEPARACION_MINIMA_SSE_MS` | El README y `docs/estructura.md` deben decir `al menos ${…} ms` | ✓ WIRED |
| `tests/modulo/generador.test.ts` | `.gitattributes` y `git rev-parse` | Chequeo sin git más `skipIf` | ✓ WIRED |
| `package.json` | runners `modulo`, `preflight`, `costo` | scripts | ✓ WIRED (sin cambios) |

### Data-Flow Trace (Level 4)

Sin cambios. SOLUCION.md §4 sale de `docs/evidencia/costo-por-caso.json` (`medido`), y `agent.md` y `SKILL.md` salen de `agent/prompt.md` y del conocimiento, byte a byte. Todo ✓ FLOWING.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Tipado y lint | `bun run check` | exit 0, 453 archivos | ✓ PASS |
| Suite completa (una sola corrida) | `bun test` | 2495 pass, 2 skip (live opt-in), 0 fail | ✓ PASS |
| Demo determinista | `bun run demo.ts` | exit 0 | ✓ PASS |
| Build del front | `bun run build:web` | exit 0, `index-DMkAAHK6.js` | ✓ PASS |
| Módulo, CLI y docs | `bun test tests/modulo tests/cli tests/docs` | 134/0/0 | ✓ PASS |
| Copia sin `.git` | `git archive HEAD` → `bun install --frozen-lockfile` → `bun test tests/modulo tests/cli` | 75 pass, 1 skip, 0 fail | ✓ PASS |
| Mutación WR-01 (`every` → `some`) | `bun test tests/cli/preflight.test.ts` en la copia | 1 fail en el test sin `no-transform` | ✓ PASS |
| Mutación IN-02 (sin restaurar) | `bun test tests/modulo/generador.test.ts` en la copia | 1 fail en el test del renombre | ✓ PASS |
| Link público vivo | `curl /api/health` | `{"ok":true,"provider":"deepseek","model":"deepseek-flash","llm":"disponible"}` | ✓ PASS |
| CI remota en verde | — | no observable (sin `gh`, repo privado, sin registro) | ? SKIP → humano |

Borré la copia de scratch al terminar. No modifiqué el checkout.

### Probe Execution

No hay probes `scripts/*/tests/probe-*.sh` en el repo ni declarados en los planes, así que no aplica.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| MOD-01 | 04-01, 04-02 | Las tres piezas de `modulo/` con su frontmatter | ✓ SATISFIED | Tests de frontmatter e igualdad verdes |
| MOD-02 | 04-01, 04-02, 04-08 | Fuente única con tests de igualdad, identidad y sin env | ✓ SATISFIED | Verde en el checkout y sin `.git`. El generador ahora además deja el par intacto si falla |
| DOC-01 | 04-06 | README con un comando, variables, demo, link y código | ✓ SATISFIED | `tests/docs/readme.test.ts` |
| DOC-02 | 04-05, 04-07, 04-08 | SOLUCION.md con las 10 secciones | ✓ SATISFIED | `tests/docs/solucion.test.ts` |
| DEP-03 | 04-04, 04-08 | Pre-flight y ensayo §11 sobre el link | ✓ SATISFIED | T07 y T08 en vivo con exit 0 después del chequeo estricto, y T09 con Playwright |
| DEMO-05 | 04-03, 04-06 | CI en verde y badge | ✓ SATISFIED (repo) / ? NEEDS HUMAN (CI remota) | Workflow, contrato y badge verificados. La corrida remota no está observada |
| CAL-05 | 04-06 | Continuidad e historial convencional | ✓ SATISFIED | 840 de 840 commits con la identidad, 0 asuntos no convencionales |

REQUIREMENTS.md mapea a la Fase 4 exactamente estos 7 IDs, y todos tienen plan. No hay requisitos huérfanos.

### Prohibitions

| Prohibition | Tier | Disposition |
|---|---|---|
| Módulo sin `edit` ni `bash`; sin reescribir prompt ni conocimiento; `simular_envio` con confirmación; CI sin modelo en vivo; pre-flight sin reintentos tras 401/429 y sin tokens por defecto; costo honesto; sin secretos ni PII; no debilitar WR-02 | test | ✓ cumplidas: tests verdes y mutaciones detectadas |
| 04-08 / iteración 2: no cambiar la conducta del agente, la API ni la SPA | judgment | PASS no autoritativo: el diff 552162e..HEAD no toca capas de conducta, y la cabecera del servidor tiene el mismo valor. Marcada "unverified-prohibition — human review recommended" |
| `modulo/README.md` no afirma un ensayo en vivo en OpenCode | judgment | PASS no autoritativo (`modulo/README.md:33`). Marcada "unverified-prohibition — human review recommended" |
| No reescribir historia publicada | judgment | PASS no autoritativo: el reflog de `origin/main` solo muestra pushes, y dec6481 y 552162e son ancestros de `origin/main`. Marcada "unverified-prohibition — human review recommended" |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | Sin TBD, FIXME, XXX ni HACK en los archivos que cambiaron. Las coincidencias de "TODO" son falsos positivos dentro de `METODO_POST` | — | — |
| `src/cli/runners/generar-modulo.runner.ts` | 110-132 | Dos renombres seguidos no son atómicos si el proceso muere entre ambos | ℹ️ Info | Está documentado en `docs/estructura.md`. El test de igualdad de la CI detecta el par mezclado, y `bun run modulo` lo repara |
| `.qa/evidence/.../04-QA-EVIDENCE-2026-10-16T05-53-02Z.md` | T06 | Toma "Render sirve el bundle de HEAD" como evidencia indirecta de una CI verde | ⚠️ Warning | El razonamiento no se sostiene, porque `web/` no cambió en la fase 4. Por eso el criterio 4 queda incierto y no verificado |
| `src/cli/runners/preflight.runner.ts` | — | El runner no imprime el `Cache-Control` ni la separación SSE que observó | ℹ️ Info | La evidencia en vivo de T08 se infiere del exit 0. El código y los tests muestran que ese exit 0 implica los dos chequeos |

`reto-01/` no se modificó.

### Human Verification Required

1. **CI remota y badge.** Abrir Actions y mirar la corrida sobre 7186c2b. Esperado: el job Verificar en verde y el badge verde. Este ítem es el que mantiene el estado `human_needed`, porque nadie lo ha observado y la evidencia indirecta no sirve.
2. **Render Events y ACCESS_CODE.** Esperado: un deploy de la fase 4 después de `checksPass`, y el código igual al del README.
3. **Panel de ec-corp-andina el día de la defensa** (truth 11). Esperado: sin remanente, o con el remanente explicado. También se puede cerrar con el override sugerido.
4. **Veredictos automáticos de la UAT y las tres prohibiciones judgment.** Esperado: la usuaria acepta los PASS.
5. **Seguimientos que no bloquean el criterio 5:** revisión de SOLUCION.md §9 (D-87) y ensayo manual del §11 la víspera.
6. **Opcional:** el módulo en una sesión real de OpenCode (T11, D-83).

### Gaps Summary

No hay gaps. Los cambios posteriores a la verificación anterior (6c54c18 y la iteración 2 del fix) están en el código, cableados y cubiertos por tests. Comprobé con mutaciones que el chequeo SSE estricto y la restauración del par atrapan su regresión, y Render sigue pasando el `--guion` en vivo con el chequeo estricto. Con esa corrida, el criterio 5 pasa a verificado. El criterio 4 sigue incierto por un motivo concreto: no hay ninguna observación de una corrida de GitHub Actions en verde, y la evidencia indirecta de la UAT T06 es inválida, porque el bundle que sirve Render es anterior a la fase 4. Basta con que una persona mire la página de Actions para cerrarlo. La truth operativa de G-04-2 es un riesgo aceptado (AR-02) que solo se observa el día de la defensa, y se puede cerrar con el override sugerido.

---

_Verified: 2026-10-16T07:00:10Z_
_Verifier: Claude (gsd-verifier)_
