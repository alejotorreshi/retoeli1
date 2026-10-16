---
phase: 04-m-dulo-documentaci-n-y-defensa
fixed_at: 2026-10-16T05:58:00Z
review_path: .planning/phases/04-m-dulo-documentaci-n-y-defensa/04-REVIEW.md
iteration: 1
findings_in_scope: 12
fixed: 12
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-10-16T05:58:00Z
**Source review:** .planning/phases/04-m-dulo-documentaci-n-y-defensa/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 12 (1 critical, 3 warning, 8 info; fix_scope = all)
- Fixed: 12
- Skipped: 0

**Verification:** each fix was checked in the isolated worktree (`.claude/worktrees/rf-04-88909-…`, with its own `bun install --frozen-lockfile`) with `bun run check` and the affected suites, plus a full `bun test` after the code-changing fixes. After the fast-forward of `main` and the worktree teardown, the gates were run again **in the main checkout**: `bun run check` passes, and `bun test` reports 2476 pass, 2 skip, 0 fail across 118 files. The baseline before the fixes was 2451 pass.

## Fixed Issues

### CR-01: `preflight --guion` always fails against Render because it requires `X-Accel-Buffering: no` at the client, and Render's edge strips it

**Files modified:** `src/cli/runners/preflight.runner.ts`, `src/cli/types/preflight.type.ts`, `src/config/constants/http.constants.ts`, `src/config/constants/preflight.constants.ts`, `src/config/strings.ts`, `tests/cli/preflight.test.ts`, `README.md`, `docs/estructura.md`
**Commit:** 97c0dc8
**Status:** fixed: requires human verification (this changes the pass criterion of the SSE check)
**Applied fix:**
- The client check no longer looks at `X-Accel-Buffering`. The server still sends it.
- The check now requires `Content-Type: text/event-stream` and a `Cache-Control` that contains the `no-cache` directive (`DIRECTIVA_SIN_CACHE`, split on `SEPARADOR_DIRECTIVAS`).
- `leerTurno` records `opciones.ahora()` when `turn_start` and `turn_end` arrive. `turn_end` must arrive at least `plazos.separacionSseMs` after `turn_start`. The default is `SEPARACION_MINIMA_SSE_MS = 250`. Otherwise the turn fails with the new `TEXTO_PREFLIGHT.sseAcumulado(ms)`.
- New tests:
  - With the real clock and an 80 ms delay per LLM call, a response shaped like Render's edge passes. That response has no X-Accel-Buffering and only `Cache-Control: no-cache`.
  - A missing `Cache-Control` fails with `cabeceraSse(Cache-Control)`.
  - A fully buffered body fails with `sseAcumulado`. The test wrapper reads the whole body and re-emits it as one chunk.
- The old test that expected a failure without X-Accel-Buffering was replaced.
- README and `docs/estructura.md` now describe the new check.

**Human check:** 250 ms is a conservative threshold. On Render, real turns showed about 2.3 s between `turn_start` and `turn_end` for a single-tool turn. Run `bun run preflight -- --url https://registro-proveedor-bfnt.onrender.com --guion` against Render to confirm it now passes.

### WR-01: Most of the guion validator's failure branches have no tests

**Files modified:** `tests/cli/preflight.test.ts`
**Commit:** f496e9b
**Applied fix:** I added one test per failure branch. The tests rewrite the real SSE body from the app (`reescribirTurno`, `antesDelFin`, `sinEvento`, `sinHerramienta`, `ajustarEvento`) or the list of case files (`reescribirArchivos`). The branches covered:
- `envioAntesDeTiempo`
- `bloqueoAusente`
- `herramientaFaltante`
- `errorDelAgente`
- `turnoIncompleto`, once without `turn_end` and once without `turn_start`
- `respuestaInvalida` for a non-JSON frame
- a wrong `Content-Type`
- `archivoInesperado`
- `envioFaltante`
- `confirmacionAbierta`
- `archivoFaltante`
- the `turnoMs` abort, which uses a hanging LLM and `turnoMs: 300` and fails with `errorDeRed`

Each test also asserts how many chat turns were sent.

### WR-02: The module byte-equality guarantee depends on line endings, and the repo has no `.gitattributes`

**Files modified:** `.gitattributes` (new), `tests/modulo/generador.test.ts`, `README.md`
**Commit:** 962358d
**Applied fix:**
- Added `.gitattributes` with `* text=auto eol=lf` and `*.md text eol=lf`. I confirmed beforehand that all 839 tracked files are already LF, so this renormalizes nothing and `reto-01/` is untouched.
- New tests check that `git check-attr eol` reports `lf` for `agent/prompt.md`, the process knowledge file, `modulo/agent.md` and `SKILL.md`, and that none of those files contains a CR byte.
- The README notes that the byte-for-byte check also holds on Windows.
- I did not add the review's optional "fail loudly on CRLF" in the generator.

### WR-03: The pre-flight reports a turn as OK even when it ended on a cap rather than normally

**Files modified:** `src/cli/runners/preflight.runner.ts`, `src/config/strings.ts`, `tests/cli/preflight.test.ts`, `README.md`, `docs/estructura.md`
**Commit:** e304440
**Status:** fixed: requires human verification (new condition)
**Applied fix:**
- After the `turnoIncompleto` check, `enviarTurno` now requires `fin.motivo === MOTIVO_FIN.FINAL`. Otherwise the turn fails with the new `TEXTO_PREFLIGHT.turnoCortado(motivo)`.
- One test uses a real iteration cap (`AGENT_MAX_ITERATIONS` = 4, the number of turn-1 tools). It fails with `turnoCortado(tope_iteraciones)`. I confirmed by mutation that without the check the whole guion passes.
- A second test rewrites the motive to `tope_tokens`.
- The docs were updated.

### IN-01: Spawned-process tests claim an "empty environment", but Bun auto-loads `.env` from `cwd`

**Files modified:** `tests/modulo/herramientas.test.ts`, `tests/cli/preflight.test.ts`
**Commit:** 1ca2555
**Applied fix:** Both child `bun` processes now run with `--no-env-file`. I confirmed on Bun 1.4.3 that the flag stops `.env` from loading.

### IN-02: The README overstates what the default pre-flight waits for, and an invalid health body keeps the loop polling

**Files modified:** `src/cli/runners/preflight.runner.ts`, `README.md`, `tests/cli/preflight.test.ts`
**Commit:** 0ca0ca8
**Status:** fixed: requires human verification (polling logic)
**Applied fix:**
- `esperarSalud` now returns as soon as a 200 JSON response fails `saludSchema`, with `respuestaInvalida(/api/health)` and a single probe.
- A 200 that is not JSON still counts as "not ready", so a wake-up or interstitial page from the edge keeps the polling going until the deadline. Without this guard, the fail-fast change could break the wake-up on Render.
- The README now says the pre-flight waits for a 200 and then requires `disponible`.
- There are tests for both cases.

### IN-03: The README says the cookie is always `Secure`, but the code drops `Secure` in development

**Files modified:** `README.md`
**Commit:** eb4cdd2
**Applied fix:** The README now reads "`Secure` fuera de desarrollo", in line with `secureCookie` and SOLUCION.md. This was a doc-only fix.

### IN-04: `docs/convenciones.md` G1 omits the `@modulo/` alias

**Files modified:** `docs/convenciones.md`
**Commit:** fcfa023
**Applied fix:** The G1 row now lists `@modulo/` and notes that only `.opencode/` uses it. This was a doc-only fix.

### IN-05: SOLUCION's peak-hour window and its "valle" claim are not backed by any constant or by the evidence

**Files modified:** `SOLUCION.md`
**Commit:** aa0cc7d
**Applied fix:** This was a doc-only fix, following the review's second option.
- Removed the peak/valley hour window from the price table and added a note that neither the constant nor the evidence records it.
- Removed the sentence claiming the run fell in off-peak hours.
- The run timestamp is now described as the end of the run.

The cost tables, which a test compares against the evidence, are unchanged.

### IN-06: `actions/checkout` keeps the default `persist-credentials: true`

**Files modified:** `.github/workflows/ci.yml`, `tests/despliegue/ci.test.ts`
**Commit:** 4be4d4b
**Applied fix:** Both checkout steps now set `with: persist-credentials: false`. The workflow schema in the test now accepts boolean `with` values, and a new test requires the setting on both checkouts.

### IN-07: The module generator resolves the root from `process.cwd()` and writes its two files non-atomically

**Files modified:** `src/cli/runners/generar-modulo.runner.ts`, `src/config/constants/modulo.constants.ts`, `tests/modulo/generador.test.ts`, `docs/estructura.md`
**Commit:** 91851d8
**Applied fix:**
- The command entry now resolves the root as `join(import.meta.dir, ...SALTOS_HASTA_LA_RAIZ_DESDE_RUNNERS)` instead of `process.cwd()`. The `package.json` guard stays.
- Both files are first written as `<ruta>.tmp` (`SUFIJO_TEMPORAL_MODULO`) and then renamed. If a write fails, the temp files are removed.
- A new test checks that no temp files are left behind.
- I checked by hand: running the runner from a different directory that has its own `package.json` wrote nothing there and regenerated the project's `modulo/` with identical bytes.

### IN-08: `--url ""` silently overrides `PREFLIGHT_URL`, and a URL path is silently dropped

**Files modified:** `src/config/env.ts`, `src/config/strings.ts`, `src/config/constants/preflight.constants.ts`, `tests/cli/preflight.test.ts`, `README.md`
**Commit:** 202b454
**Status:** fixed: requires human verification (input validation change)
**Applied fix:**
- `readPreflightEnv` now falls back to the environment when the argument is empty or whitespace.
- The `PREFLIGHT_URL` schema now rejects a URL with a path, query or fragment (`isBareOrigin`, `RUTA_RAIZ_URL`). The error is the new `TEXTO_ENV.urlPreflightConRuta`. A trailing `/` is still accepted.
- There are tests for both behaviors, and the README was updated.

## Notes

- None of the fixes touches agent, API or SPA behavior. The changes are limited to the pre-flight and module CLI (`src/cli`), their config constants and strings, `config/env.ts` (pre-flight env only), tests, CI and docs. `reto-01/` was not modified.
- Every commit uses the local identity `elianatorres5772 <elianatorres5772@gmail.com>` and ends with the requested trailers. Nothing was pushed, and `--no-verify` was never used. The pre-existing `.planning/config.json` change and the untracked `.planning/` files were left as they were.
- The worktree was created, fast-forwarded into `main`, removed, and its temp branch and recovery sentinel deleted.

---

_Fixed: 2026-10-16T05:58:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
