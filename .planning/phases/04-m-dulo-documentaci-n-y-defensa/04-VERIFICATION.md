---
phase: 04-m-dulo-documentaci-n-y-defensa
verified: 2026-10-16T06:55:00Z
status: human_needed
score: 12/15 must-haves verified (criterios 1-3 del ROADMAP y 9 de las 10 truths del 04-08; los criterios 4 y 5 y la parte operativa de G-04-2 esperan revisión humana)
covered_files: [".claude/CLAUDE.md",".env.example",".gitattributes",".github/workflows/ci.yml",".opencode/tools/proveedor.ts",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-01-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-01-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-02-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-02-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-03-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-03-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-04-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-04-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-05-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-05-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-06-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-06-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-07-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-07-SUMMARY.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-08-PLAN.md",".planning/phases/04-m-dulo-documentaci-n-y-defensa/04-08-SUMMARY.md","README.md","SOLUCION.md","docs/arquitectura.md","docs/convenciones.md","docs/entrega.md","docs/estructura.md","docs/evidencia/costo-por-caso.json","docs/limites-del-demo.md","docs/plantillas.md","modulo/README.md","modulo/agent.md","modulo/skill/registro-proveedor/SKILL.md","modulo/tools/proveedor.ts","opencode.json","package.json","render.yaml","src/cli/runners/generar-modulo.runner.ts","src/cli/runners/preflight.runner.ts","src/cli/schemas/preflight.schema.ts","src/cli/types/modulo.type.ts","src/cli/types/preflight.type.ts","src/config/constants/costo.constants.ts","src/config/constants/files.constants.ts","src/config/constants/http.constants.ts","src/config/constants/modulo.constants.ts","src/config/constants/preflight.constants.ts","src/config/env.ts","src/config/strings.ts","src/domain/builders/modulo.builder.ts","src/infra/output/output-files.adapter.ts","tests/architecture.test.ts","tests/cli/preflight.test.ts","tests/despliegue/ci.test.ts","tests/despliegue/contrato-despliegue.test.ts","tests/docs/continuidad.test.ts","tests/docs/evidencia-costo.test.ts","tests/docs/readme.test.ts","tests/docs/solucion.test.ts","tests/helpers/costo.helper.ts","tests/helpers/documentos.helper.ts","tests/helpers/types/costo.type.ts","tests/live/costo-por-caso.test.ts","tests/modulo/generador.test.ts","tests/modulo/herramientas.test.ts","tests/modulo/opencode.test.ts","tests/sin-comentarios.test.ts","tests/unit/modulo.builder.test.ts","tsconfig.json"]
covered_digest: "v3:sha256:9b6266e6f069467d45ca5fbb78ca254683e741a8ea5311785aded13a6f216898"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 3/5 roadmap success criteria verified in repo
  gaps_closed:
    - "G-04-1 (MOD-02): un dev nuevo que descarga el repo sin .git y corre bun test obtiene 0 fallos"
    - "G-04-2 (DEP-03, DOC-02), parte documental: docs/entrega.md, README y SOLUCION.md §10 programan el --guion y los ensayos la víspera, explican los archivos de la corrida anterior y registran el riesgo de out/<caso>/ compartido entre sesiones"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Revisar los veredictos automáticos de la UAT 04-UAT.md (corrida nocturna desatendida, evidencia .qa/evidence/04-m-dulo-documentaci-n-y-defensa/04-QA-EVIDENCE-2026-10-16T05-53-02Z.md): T06 Render sirve el bundle de dec6481, T07 pre-flight por defecto exit 0, T08 --guion exit 0 con el §11 por SSE, T09 ensayo §11 con Playwright"
    expected: "La usuaria acepta los veredictos pass; con eso quedan cubiertas en vivo las partes de los criterios 4 y 5"
    why_human: "Los decidió el orquestador sin una persona presente; quedan pendientes de revisión humana"
  - test: "Hacer push de los 8 commits locales (main está ahead 8 de origin/main = dec6481) y abrir https://github.com/alejotorreshi/retoeli1/actions y el README en GitHub"
    expected: "El job Verificar (check, test, demo.ts, build:web) termina en verde sobre el HEAD nuevo, incluido el test WR-02 con git check-attr sin skip, el badge se ve verde y Render despliega después de checksPass"
    why_human: "La corrida de Actions y los eventos de Render son remotos; la evidencia de dec6481 es indirecta (Render sirve su bundle) y el código del 04-08 todavía no llegó al remoto"
  - test: "Comprobar en el panel de Render que ACCESS_CODE es exactamente el código del README"
    expected: "Coinciden; el README coincide con .qa/render.token (eli-qa lo verificó en memoria, sin imprimirlo)"
    why_human: "El valor de Render vive solo en el panel (sync: false)"
  - test: "La víspera de la defensa, la usuaria hace una vez a mano el ensayo del §11 en el navegador sobre el link público"
    expected: "Resumen estructurado, tool calls visibles, ruta out/ec-corp-andina/, faltantes, estado listo_para_firma y la pregunta de cierre; 'envía' produce ENVIO-SIMULADO.md solo después de la confirmación"
    why_human: "Flujo visual en vivo de la defensa (D-95)"
  - test: "Al abrir la sesión de la demo en la defensa, mirar el panel 'Archivos de ec-corp-andina' antes del turno 1"
    expected: "No aparece ENVIO-SIMULADO.md ni el paquete de una corrida anterior, porque el --guion y los ensayos se hicieron la víspera y Render vació su disco al dormir. Si aparecen, la analista los explica como dice docs/entrega.md y el turno 1 los reemplaza"
    why_human: "La truth operativa de G-04-2 no la garantiza el código (por diseño, out/<caso>/ es del caso); depende de que Render duerma entre la víspera y la defensa, y solo se observa ese día"
  - test: "La usuaria revisa el texto de SOLUCION.md §9 (Uso de IA) antes de entregar (D-87)"
    expected: "El texto refleja con fidelidad cómo se usó la IA"
    why_human: "Juicio de autoría; figura como pendiente humano en docs/entrega.md"
  - test: "Prohibiciones de nivel judgment (veredicto no autoritativo del verificador): (a) modulo/README.md no afirma un ensayo en vivo en OpenCode; (b) no se reescribió historia ya publicada; (c) el 04-08 no cambió la conducta del agente, la API ni la SPA"
    expected: "Confirmar el PASS del verificador: (a) modulo/README.md y SOLUCION.md §10 dicen que el módulo no se ensayó en vivo en OpenCode (D-83); (b) origin/main sigue en dec6481 y los 8 commits nuevos están encima, sin reescritura; (c) git diff 8f288d7..HEAD toca solo README.md, SOLUCION.md, docs/entrega.md, tests/docs, tests/modulo y .planning; nada en src/, web/, agent/, modulo/ ni reto-01/"
    why_human: "unverified-prohibition — human review recommended (judgment tier, ADR-550 D4)"
  - test: "Opcional: cargar el módulo en una sesión real de OpenCode (UAT T11, skipped por D-83)"
    expected: "Aparecen el agente, la skill y las herramientas proveedor_*"
    why_human: "No se instala OpenCode en la fase; la evidencia automática es tests/modulo/opencode.test.ts"
---

# Phase 4: Módulo, documentación y defensa — Verification Report

**Phase Goal:** Los evaluadores pueden reutilizar el agente como módulo desde la misma fuente que usa la app, entender y continuar la solución leyendo la documentación, y ver la defensa en vivo correr sobre el link público sin sorpresas.
**Verified:** 2026-10-16T06:55:00Z
**Status:** human_needed
**Re-verification:** Sí, después del plan de cierre de gaps 04-08 (gaps G-04-1 y G-04-2 de la UAT)

## Goal Achievement

### Observable Truths

Criterios de éxito del ROADMAP (contrato), con una regresión rápida de los que ya estaban verificados:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `modulo/` tiene `agent.md`, `tools/proveedor.ts` y `skill/registro-proveedor/SKILL.md` con el frontmatter exigido. El generador los actualiza, y los tests de igualdad byte a byte, identidad de referencia e importación sin env pasan y fallan con deriva | ✓ VERIFIED | Regresión: `bun test tests/modulo tests/docs` en el checkout da 79 pass, 0 fail y 0 skip. El 04-08 no tocó `modulo/` ni `src/` (`git status --porcelain -- src web agent modulo reto-01 .gitattributes` vacío; `git diff --stat 8f288d7..HEAD` sin esas rutas). La verificación inicial ya había comprobado la igualdad y la identidad de forma independiente |
| 2 | Un dev nuevo levanta el proyecto solo con el README; `docs/arquitectura.md` y `docs/convenciones.md` permiten retomar; el historial sigue Conventional Commits con la identidad `elianatorres5772` | ✓ VERIFIED | Lo de la verificación inicial sigue en pie. Además, con G-04-1 cerrado, una copia sin `.git` también da 0 fallos (truth 6). Los 4 commits nuevos (6ed1804, 0d42f41, fdd86f1, 650b924) tienen autor y committer `elianatorres5772 <elianatorres5772@gmail.com>` y asunto convencional |
| 3 | `SOLUCION.md` tiene las 10 secciones del PRD con el costo real, el diseño del portal, ≥3 trade-offs, los supuestos, la cobertura por HU y el uso de IA | ✓ VERIFIED | Regresión: `tests/docs/solucion.test.ts` pasa, incluido el orden de las secciones. §10 suma el riesgo de `out/<caso>/` compartido entre sesiones sin mover ningún encabezado |
| 4 | GitHub Actions corre `bun test`, `bun run demo.ts`, `tsc --noEmit` y lint en verde, y el README muestra el badge | ? UNCERTAIN (humano) | En el repo todo está en orden (verificación inicial). Gate local de hoy: corrí `bun run check` y dio exit 0 (453 archivos). La CI sobre dec6481 solo tiene evidencia indirecta (Render sirve su bundle con `checksPass`, UAT T06). Los 8 commits nuevos no se publicaron (`main` va ahead 8 de `origin/main`), así que la CI todavía no corrió sobre el HEAD actual |
| 5 | El pre-flight calienta Render y verifica health y SSE, y el guion §11 se ensaya con éxito sobre el link público | ? UNCERTAIN (humano) | El script está verificado en el repo (inicial). En vivo, eli-qa registró: pre-flight por defecto exit 0 (T07), `--guion` exit 0 con el §11 por SSE (T08) y el ensayo con Playwright en pass (T09). Esos veredictos los decidió el orquestador sin supervisión y esperan revisión humana; además falta el ensayo manual de la usuaria |

Truths del plan 04-08 (cierre de G-04-1 y G-04-2):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | G-04-1: un dev nuevo que descarga el repo y corre `bun test` obtiene 0 fallos | ✓ VERIFIED | Corrida propia: hice `git archive HEAD` en un directorio de scratch y comprobé que no estaba dentro de un repo (`NO_GIT`). Después `bun install --frozen-lockfile` (exit 0), `bun test tests/modulo` (31 pass, 1 skip, 0 fail) y el `bun test` completo (2477 pass, 3 skip, 0 fail) |
| 7 | G-04-1: en una copia sin `.git`, `bun test tests/modulo` y el `bun test` completo dan 0 fail | ✓ VERIFIED | Es la misma corrida de la fila 6 |
| 8 | G-04-1 / D-79 / D-82: la garantía WR-02 se comprueba sin git leyendo `.gitattributes` (reglas `* text=auto eol=lf` y `*.md text eol=lf`, eol efectivo `eol=lf` en las 4 rutas, sin bytes CR) | ✓ VERIFIED | `tests/modulo/generador.test.ts`: `leerReglasDeAtributos`, `eolEfectivo` (última regla que nombra eol, con `Bun.Glob` sobre el basename) y el test ".gitattributes fija LF … sin depender de git", que pide `arrayContaining` con las dos reglas y `eol=lf` para las 4 rutas. El escaneo de CR se mantiene sin cambios. Hay un solo `.gitattributes` versionado |
| 9 | G-04-1: dentro del checkout de git del proyecto, el test `git check-attr` corre sin skip; solo se salta sin git o fuera del top level | ✓ VERIFIED | `test.skipIf(!ES_CHECKOUT_DEL_PROYECTO)`, donde `esCheckoutDelProyecto` hace `Bun.which("git")` y después `git rev-parse --show-toplevel`, y compara con `realpathSync(RAIZ)`. En el checkout principal, `tests/modulo` + `tests/docs` dieron 0 skip |
| 10 | G-04-1: un `.gitattributes` con `*.md text eol=crlf` hace fallar `generador.test.ts` en una copia sin `.git` | ✓ VERIFIED | Mutación propia en la copia de scratch: 20 pass, 1 skip, 1 fail, `(fail) … sin depender de git`. Una segunda mutación que borra la regla `*.md` también falla en el mismo test |
| 11 | G-04-2: en la defensa, una sesión nueva no muestra archivos viejos de otra sesión que puedan confundirse con un envío | ? UNCERTAIN (humano) | El plan lo acota a documentación, a propósito: el código no lo garantiza, porque `out/<caso>/` es del caso por el PRD. La mitigación es operativa (la víspera, más el sueño de Render que vacía el disco efímero), y el texto que explica el remanente está verificado (filas 12-14). Que se cumpla solo se puede ver el día de la defensa |
| 12 | G-04-2: `docs/entrega.md` pone el `--guion` y los dos ensayos la víspera, deja el pre-flight por defecto 10 minutos antes y explica los archivos de la corrida anterior | ✓ VERIFIED | Leí el texto. El ítem de eli-qa y el ensayo manual dicen "La víspera de la defensa o antes". La línea "Unos 10 minutos antes…" incluye "sin `--guion`", "no abre ningún chat, no escribe nada en `out/`". Un párrafo da el porqué de la víspera, y otro la "corrida anterior", con enlace a SOLUCION.md §10. Comprobé los hechos que cita contra el código: `clearPreviousArtifacts` borra `paquete/` y `ARCHIVOS_REGENERABLES` (incluido `ENVIO_SIMULADO`) y lo llama `generar-formulario.use-case.ts:105`, `paquetesConocidos` vive en la sesión y `docs/limites-del-demo.md` tiene la fila de `out/<caso>/` |
| 13 | G-04-2 / D-84 / D-88: SOLUCION.md §10 registra el riesgo de `out/<caso>/` compartido entre sesiones y lo que haría un despliegue real | ✓ VERIFIED | Está la viñeta "**`out/<caso>/` compartido entre sesiones.**" con el porqué, por qué se acepta y cómo se evita en la defensa. También la viñeta de despliegue real con `out/<sesión>/<caso>/` o un prefijo por sesión, y "El modo `--guion` se corre la víspera" en Operación de la defensa |
| 14 | G-04-2: el README ya no sugiere el `--guion` 10 minutos antes y dice que va la víspera | ✓ VERIFIED | En "## Pre-flight de la defensa", el modo por defecto va unos 10 minutos antes y el `--guion` la víspera, con enlace a docs/entrega.md. La frase del cron se mantiene |
| 15 | `bun run check` y el `bun test` completo siguen en verde, y tests/docs fija entrega, README y §10 | ✓ VERIFIED | Corrí `bun run check` (exit 0). El `bun test` completo dio 0 fail en la copia sin `.git`, y el orquestador reporta 2478 pass, 2 skip y 0 fail en el checkout. El test "programa el --guion la víspera … (G-04-2)" está en `tests/docs/readme.test.ts:170` y MENCIONES[10] suma "compartido entre sesiones" y "out/<sesión>/<caso>/" en `tests/docs/solucion.test.ts:65-66`. Los dos pasan |

**Score:** 12/15 must-haves verificadas. Hay 3 inciertas que van a revisión humana: los criterios 4 y 5 en vivo y la truth operativa de G-04-2. Hay 0 truths presentes con la conducta sin verificar.

### Required Artifacts (04-08)

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `tests/modulo/generador.test.ts` | Chequeo WR-02 sin git + `check-attr` condicional + escaneo de CR | ✓ VERIFIED | Contiene `skipIf`, `rev-parse` y `check-attr`; la mutación lo hace fallar |
| `docs/entrega.md` | `--guion` y ensayos la víspera, nota de la corrida anterior | ✓ VERIFIED | "víspera" ×2, "corrida anterior", enlace a `../SOLUCION.md` |
| `SOLUCION.md` | Riesgo §10 y arreglo de producción | ✓ VERIFIED | "compartido entre sesiones", "out/<sesión>/<caso>/" |
| `README.md` | Pre-flight con `--guion` la víspera | ✓ VERIFIED | "víspera" en la sección del pre-flight |
| `tests/docs/readme.test.ts`, `tests/docs/solucion.test.ts` | Contratos de G-04-2 | ✓ VERIFIED | Pasan; los artefactos de los planes 04-01 a 04-07 no cambiaron (regresión vía tests) |

### Key Link Verification (04-08)

| From | To | Via | Status |
|---|---|---|---|
| `tests/modulo/generador.test.ts` | `.gitattributes` | `readFile(join(RAIZ, ".gitattributes"))` + `leerReglasDeAtributos` | ✓ WIRED |
| `tests/modulo/generador.test.ts` | `git rev-parse --show-toplevel` | `esCheckoutDelProyecto` → `ES_CHECKOUT_DEL_PROYECTO` → `test.skipIf` | ✓ WIRED |
| `docs/entrega.md` | `SOLUCION.md` | `[SOLUCION.md](../SOLUCION.md) §10`; el test de enlaces relativos pasa | ✓ WIRED |

Los key links de los planes 04-01 a 04-07 se verificaron en la verificación inicial, y ningún archivo que los sostiene cambió fuera de los docs revisados aquí.

### Data-Flow Trace (Level 4)

No cambió desde la verificación inicial. SOLUCION.md §4 sale de `docs/evidencia/costo-por-caso.json` (`medido`), y `modulo/agent.md` y `SKILL.md` salen de `agent/prompt.md` y `src/knowledge/registro-proveedor.md`, todos ✓ FLOWING. El 04-08 no agrega datos dinámicos.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Tests de módulo y docs en el checkout | `bun test tests/modulo tests/docs` | 79 pass, 0 fail, 0 skip | ✓ PASS |
| Suite completa en una copia sin `.git` | `git archive HEAD` → tar → `bun install --frozen-lockfile` → `bun test tests/modulo` y `bun test` | 31/1/0 y 2477/3/0 (pass/skip/fail) | ✓ PASS |
| La mutación crlf se detecta sin git | `.gitattributes` con `*.md text eol=crlf` → `bun test tests/modulo/generador.test.ts` | 1 fail en "sin depender de git" | ✓ PASS |
| La regla `*.md` ausente se detecta sin git | `.gitattributes` solo con `* text=auto eol=lf` | 1 fail en el mismo test | ✓ PASS |
| Tipado y lint | `bun run check` | exit 0 | ✓ PASS |
| CI remota, Render y ensayo §11 en vivo | — | requieren red y el link público; eli-qa ya los corrió sobre dec6481 | ? SKIP → humano |

Borré el directorio de scratch al terminar.

### Probe Execution

No hay probes `scripts/*/tests/probe-*.sh` en el repo ni declarados en los planes, así que no aplica.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| MOD-01 | 04-01, 04-02 | Las tres piezas de `modulo/` con su frontmatter | ✓ SATISFIED | Regresión verde |
| MOD-02 | 04-01, 04-02, 04-08 | Fuente única con tests de igualdad, identidad y sin env | ✓ SATISFIED | G-04-1 cerrado: los tests también pasan sin `.git` |
| DOC-01 | 04-06 | README con un comando, variables, demo, link y código | ✓ SATISFIED | Sin cambios salvo el pre-flight |
| DOC-02 | 04-05, 04-07, 04-08 | SOLUCION.md con 10 secciones | ✓ SATISFIED | §10 suma el riesgo de `out/` compartido |
| DEP-03 | 04-04, 04-08 | Pre-flight y ensayo §11 sobre el link | ✓ SATISFIED (repo) / ? NEEDS HUMAN (en vivo) | Script y docs verificados; T07, T08 y T09 de eli-qa en pass sin revisión humana |
| DEMO-05 | 04-03, 04-06 | CI en verde y badge | ✓ SATISFIED (repo) / ? NEEDS HUMAN (CI remota) | La CI del HEAD nuevo aún no corrió (commits sin push) |
| CAL-05 | 04-06 | Continuidad e historial convencional | ✓ SATISFIED | Los 4 commits nuevos cumplen la identidad y el formato |

Los 7 IDs de la fase tienen un plan, y REQUIREMENTS.md mapea a la Fase 4 exactamente estos 7 (todos "Complete"). No hay requisitos huérfanos.

### Prohibitions

| Prohibition | Tier | Disposition |
|---|---|---|
| (04-01 a 04-07) módulo sin edit ni bash, sin reescribir prompt ni conocimiento, `simular_envio` con confirmación, CI sin modelo en vivo, pre-flight sin reintentos, evidencia de costo honesta, sin secretos ni PII | test | ✓ cumplidas; la regresión de tests/modulo y tests/docs sigue verde |
| 04-08: no debilitar WR-02 (el chequeo sin git falla si no resuelve eol=lf; `check-attr` se conserva condicional) | test | ✓ cumplida con evidencia: las dos mutaciones fallan y `check-attr` sigue presente y corre en el checkout |
| 04-08: no escribir datos del maestro, claves ni el código más allá de la línea del README | test | ✓ cumplida: los escaneos `sensiblesDelProyecto` y de secretos de `tests/docs` pasan sobre README, entrega y SOLUCION |
| 04-08: no cambiar la conducta del agente, la API ni la SPA | judgment | PASS no autoritativo: el diff de 8f288d7 a HEAD solo toca docs, tests y `.planning`. Va marcado "unverified-prohibition — human review recommended" |
| modulo/README no afirma un ensayo en vivo en OpenCode | judgment | PASS no autoritativo. Va marcado "unverified-prohibition — human review recommended" |
| No reescribir historia publicada | judgment | PASS no autoritativo: `origin/main` = dec6481 y los commits nuevos van encima. Va marcado "unverified-prohibition — human review recommended" |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | Sin TBD, FIXME, XXX, TODO ni HACK en los 6 archivos que modificó el 04-08 | — | — |
| `tests/modulo/generador.test.ts` | 129-140 | El chequeo sin git lee solo el `.gitattributes` de la raíz; uno anidado no se vería sin git | ℹ️ Info | Hoy hay un solo `.gitattributes` versionado. En el checkout y en la CI, `git check-attr` cubre los anidados, y el escaneo de CR atrapa los bytes reales |
| `src/cli/runners/preflight.runner.ts` | 262-266 | Sin `X-Accel-Buffering` en el cliente (04-04 lo pedía) | ℹ️ Info | Desviación intencional CR-01 con un chequeo más fuerte (sigue igual) |
| `modulo/tools/proveedor.ts` | 1-7 | Depende de los alias de `tsconfig.json` de la raíz | ℹ️ Info | Límite documentado (sigue igual) |

`reto-01/` no se modificó.

### Human Verification Required

1. **Revisar los veredictos automáticos de la UAT** (T06 a T09 sobre dec6481). Esperado: la usuaria los acepta.
2. **Push y CI del HEAD nuevo.** Hay 8 commits locales sin publicar. Esperado: el job Verificar en verde, con `git check-attr` sin skip, el badge verde y el deploy de Render tras `checksPass`.
3. **ACCESS_CODE de Render igual al del README.**
4. **Ensayo manual del §11 por la usuaria, la víspera.**
5. **El día de la defensa, el panel de ec-corp-andina antes del turno 1.** Esperado: sin archivos de una corrida anterior, o con el remanente explicado como dice docs/entrega.md.
6. **Revisión de SOLUCION.md §9 (D-87).**
7. **Confirmar los tres veredictos no autoritativos** de las prohibiciones de nivel judgment.
8. **Opcional:** el módulo en una sesión real de OpenCode.

### Gaps Summary

Los dos gaps de la UAT quedan cerrados en el código y en los docs, y no hay gaps nuevos ni regresiones. G-04-1 lo comprobé por mi cuenta: una copia de HEAD sin `.git` corre la suite completa con 0 fallos, el chequeo de finales de línea sin git detecta dos mutaciones de `.gitattributes`, y el test con `git check-attr` sigue corriendo, sin skip, en el checkout del proyecto. G-04-2 se cerró como lo acotó el plan: no cambió ninguna conducta, y la checklist, el README y SOLUCION.md §10 llevan el `--guion` y los ensayos a la víspera, explican el remanente y registran el riesgo con su arreglo de producción, con hechos que contrasté contra el código. Falta lo que solo puede confirmar una persona: los veredictos en vivo de eli-qa (que se decidieron sin supervisión), la CI sobre el HEAD nuevo cuando se haga el push, el ensayo manual, cómo se ve el panel el día de la defensa y la revisión de autoría de §9.

---

_Verified: 2026-10-16T06:55:00Z_
_Verifier: Claude (gsd-verifier)_
