---
phase: 04-m-dulo-documentaci-n-y-defensa
plan: 08
subsystem: testing
tags: [gap-closure, wr-02, gitattributes, bun-test, skipIf, defensa, out-compartido]

requires:
  - phase: 04-m-dulo-documentaci-n-y-defensa
    provides: "WR-02 fix (.gitattributes + git check-attr test, 04-REVIEW-FIX), pre-flight --guion (04-04), docs/entrega.md checklist (D-99)"
provides:
  - "WR-02 line-ending check that passes in a copy without .git (git-free .gitattributes parse plus CR scan)"
  - "git check-attr test kept, gated on being the project's own git checkout"
  - "Defense checklist that runs --guion and both §11 rehearsals on the eve and explains a leftover package"
  - "SOLUCION.md §10 risk: out/<caso>/ shared between sessions and the out/<sesión>/<caso>/ production fix"
affects: [verify-work 04, defensa, entrega]

actuals:
  tokens: 4162
  tasks: 2
  commits: 2
plan_head_before: 8f288d7d741b5ae2f8426a9c7d2d987d82549164
plan_head_after: 0d42f410bcfa58047a2eb95ec3c57505b467423c

tech-stack:
  added: []
  patterns:
    - "Test that depends on an external binary: compute a module-scope boolean (Bun.which + git rev-parse --show-toplevel compared with realpathSync) and gate with test.skipIf, keeping a git-free check that always runs"

key-files:
  created: []
  modified:
    - tests/modulo/generador.test.ts
    - docs/entrega.md
    - SOLUCION.md
    - README.md
    - tests/docs/readme.test.ts
    - tests/docs/solucion.test.ts

key-decisions:
  - "G-04-1: the WR-02 guarantee is checked without git by parsing .gitattributes and resolving the effective eol per path (last matching rule that names eol, Bun.Glob on the basename for patterns without /); git check-attr runs only when git rev-parse --show-toplevel resolves to the project root, so an export extracted under another repo does not count"
  - "G-04-2 closed by documentation only: --guion and both §11 rehearsals run the eve so Render's sleep empties out/ before the defense; the default pre-flight (no chat, nothing written to out/) stays for the 10 minutes before"

requirements-completed: [MOD-02, DEP-03, DOC-02]

coverage:
  - id: D1
    description: "A copy of the repo without .git runs bun test with 0 failures; the git check-attr test still runs in the project's git checkout"
    requirement: MOD-02
    verification:
      - kind: unit
        ref: "tests/modulo/generador.test.ts#.gitattributes fija LF en las fuentes y en lo generado sin depender de git"
        status: pass
      - kind: other
        ref: "git archive HEAD into a mktemp dir, bun install --frozen-lockfile, bun test tests/modulo (31 pass, 1 skip, 0 fail) and bun test (2477 pass, 3 skip, 0 fail)"
        status: pass
      - kind: other
        ref: "bun test tests/modulo in the main checkout: 32 pass, 0 skip, 0 fail"
        status: pass
    human_judgment: false
  - id: D2
    description: "A .gitattributes with *.md text eol=crlf is caught without git"
    requirement: MOD-02
    verification:
      - kind: other
        ref: "mutation acceptance command in a git-less export: MUTACION_DETECTADA (1 fail, the 'sin depender de git' test)"
        status: pass
    human_judgment: false
  - id: D3
    description: "docs/entrega.md, README and SOLUCION.md §10 schedule --guion on the eve, explain the previous run's files and record the shared out/<caso>/ risk with its per-session fix"
    requirement: DEP-03
    verification:
      - kind: unit
        ref: "tests/docs/readme.test.ts#programa el --guion la víspera y avisa de los archivos de la corrida anterior (G-04-2)"
        status: pass
      - kind: unit
        ref: "tests/docs/solucion.test.ts#la sección 10 nombra lo que exige el plan"
        status: pass
    human_judgment: true
    rationale: "Whether a new session at the live defense actually shows no stale files depends on Render sleeping between the eve rehearsals and the defense; the docs are pinned by tests, but the operational outcome is only observable at the defense"

duration: 4min
completed: 2026-10-16
status: complete
---

# Phase 4 Plan 08: Gap closure G-04-1 y G-04-2 Summary

**El test WR-02 valida `.gitattributes` sin git y deja `git check-attr` detrás de `test.skipIf` (solo en el checkout de git del proyecto); la checklist de la defensa corre el `--guion` y los ensayos la víspera, y SOLUCION.md §10 registra el riesgo de `out/<caso>/` compartido entre sesiones con `out/<sesión>/<caso>/` como arreglo real.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-16T06:15:05Z
- **Completed:** 2026-10-16T06:19:13Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- G-04-1 cerrado: en una copia sin `.git`, `bun test` da 0 fallos. Antes daba 1 fallo porque `git check-attr` salía con 128.
- La garantía WR-02 se comprueba ahora sin git. El test parsea `.gitattributes`, exige las reglas `* text=auto eol=lf` y `*.md text eol=lf`, y resuelve el eol efectivo de las cuatro rutas comparadas. Una mutación `*.md text eol=crlf` lo hace fallar.
- G-04-2 cerrado con documentación. docs/entrega.md, README y SOLUCION.md §10 explican el riesgo, y tests/docs los fija.

## TDD / tracer evidence

**RED, en HEAD 8f288d7 antes del cambio.** Corrí el segundo `<automated>` de la Task 1: `git archive HEAD` en un directorio de mktemp, `bun install --frozen-lockfile` y `bun test tests/modulo`. El resultado fue **30 pass, 1 fail**. El test que falló fue `(fail) los finales de línea no rompen la igualdad byte a byte (WR-02) > .gitattributes fija LF en las fuentes y en lo generado, también en un checkout de Windows`, con `expect(consulta.exitCode).toBe(0)` → `Received: 128` (`git check-attr` fuera de un repo de git).

Evaluación semántica: el test objetivo corrió y falló en la aserción del gap (`exitCode` 128), no por una falla de carga ni por otro test. El gap quedó reproducido de punta a punta. No hubo un commit de test RED aparte, porque el test que falla ya estaba commiteado (HEAD); el plan pide reproducir el gap y luego commitear el fix solo.

**GREEN, en HEAD 6ed1804 y luego en el HEAD final 0d42f41.**

| Corrida | Resultado |
| --- | --- |
| Checkout principal, `bun test tests/modulo` | 32 pass, 0 skip, 0 fail. `git check-attr` corre: no aparece SKIP_EN_EL_CHECKOUT. |
| Copia sin `.git` en 6ed1804, `bun test tests/modulo` | 31 pass, 1 skip, 0 fail |
| Copia sin `.git` en 6ed1804, `bun test` | 2476 pass, 3 skip, 0 fail |
| Copia sin `.git` en 0d42f41, `bun test tests/modulo` | 31 pass, 1 skip, 0 fail |
| Copia sin `.git` en 0d42f41, `bun test` | 2477 pass, 3 skip, 0 fail |
| Mutación `*.md text eol=crlf` en la copia sin `.git` | MUTACION_DETECTADA: 1 fail, `(fail) … sin depender de git` |
| Checkout con `PATH` sin git (`PATH=~/.bun/bin`) | 21 pass, 1 skip, 0 fail. `Bun.which` devuelve null y no se lanza nada. |

**Puerta del tracer:** volví a correr el `<verify>` de punta a punta en modo auto y pasó, así que seguí con la expansión (Task 2).

**REFACTOR:** no hizo falta. Lo único fue `biome format` sobre el archivo, que entró en el mismo commit.

## Task Commits

1. **Task 1: Tracer, las comprobaciones WR-02 pasan en una copia sin .git (G-04-1)**: `6ed1804` (test)
2. **Task 2: out/<caso>/ compartido entre sesiones, --guion la víspera y su fijación en tests/docs (G-04-2)**: `0d42f41` (docs)

## Files Created/Modified

- `tests/modulo/generador.test.ts`: el describe WR-02 ahora tiene tres tests: el chequeo de `.gitattributes` sin git, `git check-attr` detrás de `test.skipIf(!ES_CHECKOUT_DEL_PROYECTO)` y el escaneo de CR sin cambios. Suma los helpers locales `leerReglasDeAtributos`, `eolEfectivo`, `patronCoincide`, `nombraEol` y `esCheckoutDelProyecto`.
- `docs/entrega.md`: el ítem de eli-qa y el ensayo manual van "la víspera de la defensa o antes". El ítem de los 10 minutos antes es el pre-flight `sin --guion`. Hay un párrafo que explica por qué la víspera y otro sobre los archivos de la corrida anterior, con enlace a SOLUCION.md §10.
- `SOLUCION.md`: §10 suma el riesgo aceptado "`out/<caso>/` compartido entre sesiones", la viñeta de despliegue real `out/<sesión>/<caso>/` (o un prefijo por sesión en el almacenamiento de objetos) y "`--guion` la víspera" en Operación de la defensa.
- `README.md`: en el pre-flight, el modo por defecto va 10 minutos antes y el `--guion` la víspera, con enlace a docs/entrega.md.
- `tests/docs/readme.test.ts`: suma el test G-04-2 para entrega y README.
- `tests/docs/solucion.test.ts`: MENCIONES[10] suma "compartido entre sesiones" y "out/<sesión>/<caso>/".

## Decisions Made

- La condición del skip es más estricta que el `--is-inside-work-tree` de la UAT. Usa `git rev-parse --show-toplevel` y compara con `realpathSync(RAIZ)`, así que una copia extraída dentro de otro repo no cuenta como checkout del proyecto.
- Antes de escribir el texto de G-04-2, volví a comprobar en el código cada hecho que usa: `clearPreviousArtifacts` borra `paquete/` y `ARCHIVOS_REGENERABLES` (incluido ENVIO-SIMULADO.md); `FIXED_ENTRIES` lista los archivos del panel; `TEXTO_ARCHIVOS.lista` muestra "Archivos de {caso}"; `appendFile` escribe en log.jsonl; `paquetesConocidos` es por sesión; y docs/limites-del-demo.md tiene la fila de `out/<caso>/`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `bun run check` falló una vez solo por el formato de Biome (el `test.skipIf(...)(nombre, fn)` partido en varias líneas). Lo resolví con `bunx biome format --write tests/modulo/generador.test.ts` antes del commit de la Task 1.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Los dos gaps de la UAT de la Fase 4 (G-04-1 y G-04-2) están cerrados. Falta el `/gsd-verify-work 04` para volver a verificar la UAT.
- Pendiente humano (no bloquea): en la defensa, correr el `--guion` y los ensayos la víspera, como dice docs/entrega.md.

## Self-Check: PASSED

- FOUND: tests/modulo/generador.test.ts, docs/entrega.md, SOLUCION.md, README.md, tests/docs/readme.test.ts, tests/docs/solucion.test.ts
- FOUND: 6ed1804, 0d42f41 (ancestros de HEAD)
- `bun run check` pasa. `bun test` en el checkout da 2478 pass, 2 skip, 0 fail. `git status --porcelain -- reto-01 src web agent modulo .gitattributes` no imprime nada.

---
*Phase: 04-m-dulo-documentaci-n-y-defensa*
*Completed: 2026-10-16*
