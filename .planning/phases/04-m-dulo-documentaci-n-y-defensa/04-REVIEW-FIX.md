---
phase: 04-m-dulo-documentaci-n-y-defensa
fixed_at: 2026-10-16T07:10:00Z
review_path: .planning/phases/04-m-dulo-documentaci-n-y-defensa/04-REVIEW.md
iteration: 2
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-10-16T07:10:00Z
**Source review:** .planning/phases/04-m-dulo-documentaci-n-y-defensa/04-REVIEW.md (incremental re-review, diff base 72feb23)
**Iteration:** 2

## Iteración 1 (history)

Iteration 1 (2026-10-16T05:58:00Z) fixed all 12 findings of the first full review: 1 critical, 3 warning and 8 info, with no skips. The commits were 97c0dc8, f496e9b, 962358d, e304440, 1ca2555, 0ca0ca8, eb4cdd2, fcfa023, aa0cc7d, 4be4d4b, 91851d8 and 202b454. The main changes were:
- CR-01: the pre-flight stopped requiring `X-Accel-Buffering` and started checking the arrival gap between `turn_start` and `turn_end`.
- WR-01: every failure branch of the guion validator got a test.
- WR-02: `.gitattributes` now pins LF.
- WR-03: each turn must end with the motive `final`.
- IN-01 to IN-08: `--no-env-file`, fail-fast on a malformed health body, doc fixes, `persist-credentials: false`, the generator root resolved from `import.meta.dir` with temp-and-rename writes, and `--url` validation.

The incremental re-review found that every prior finding was resolved. It filed the 5 findings below.

## Summary (iteration 2)

- Findings in scope: 5 (2 warning, 3 info; fix_scope = all)
- Fixed: 5
- Skipped: 0

**Verification:** every fix was checked in the isolated worktree (`.claude/worktrees/rf-04-22218-…`, with its own `bun install --frozen-lockfile`). Each fix ran `bun run check` plus the suites it affects. For WR-01, IN-01 and IN-02 I also ran a mutation check: I broke the new code on purpose and confirmed the new tests fail, then restored the code. I ran a full `bun test` in the worktree after the last fix. After `main` was fast-forwarded and the worktree removed, I ran the gates again **in the main checkout**. `bun run check` passes, and `bun test` reports 2495 pass, 2 skip and 0 fail across 118 files. The baseline before these fixes was 2484 pass.

## Fixed Issues

### WR-01: The CR-01 fix stopped checking `no-transform`, and the "Render edge" test fixture contradicts the project's own evidence

**Files modified:** `src/config/constants/http.constants.ts`, `src/cli/runners/preflight.runner.ts`, `tests/cli/preflight.test.ts`, `README.md`, `docs/estructura.md`
**Commit:** 07dd7ea
**Status:** fixed: requires human verification (this tightens the pass criterion of the SSE check)
**Applied fix:**
- The new `DIRECTIVA_CACHE = { SIN_CACHE: "no-cache", SIN_TRANSFORMACION: "no-transform" }` holds the directives. `VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION` is now built from it with `SEPARADOR_DIRECTIVAS`, which is still `"no-cache, no-transform"`, so the duplicated literal is gone. `DIRECTIVA_SIN_CACHE` was removed.
- The pre-flight helper is now `prohibeCacheYTransformacion`. It splits the received `Cache-Control` on the separator and requires every directive in `DIRECTIVA_CACHE`, ignoring case and spaces. `X-Accel-Buffering` is still not required.
- The `comoElBordeDeRender` fixture now only deletes `X-Accel-Buffering` and keeps the server's `Cache-Control`. This matches the live evidence, where `cache-control: no-cache, no-transform` arrives intact and X-Accel-Buffering is stripped.
- New tests:
  - A `Cache-Control` of `no-cache` without `no-transform` fails with `cabeceraSse(Cache-Control)`.
  - The server value equals the header seen on Render, `"no-cache, no-transform"`.
- README and `docs/estructura.md` now say the check requires `no-cache` and `no-transform`.

**Human check:** run `bun run preflight -- --url https://registro-proveedor-bfnt.onrender.com --guion` once to confirm Render still passes with the stricter check. The 2026-10-16 evidence says it should.

### WR-02: The T-04-22 secret-assignment scanner misses `LLM_FALLBACK_API_KEY` and `PREFLIGHT_ACCESS_CODE`, and only matches `VAR=` at the start of a line

**Files modified:** `tests/helpers/documentos.helper.ts`, `tests/helpers/costo.helper.ts`, `tests/docs/readme.test.ts`, `tests/docs/evidencia-costo.test.ts`
**Commit:** d2a28b0
**Applied fix:**
- `VARIABLES_CLAVE` is now exported and includes `LLM_FALLBACK_API_KEY`.
- The new exported `VARIABLES_SECRETAS` is `[...VARIABLES_CLAVE, VARIABLE_SECRETO_TOKEN, "ACCESS_CODE", "PREFLIGHT_ACCESS_CODE"]`.
- `asignacionesSecretas` now uses a single regex built from that list: `\b(?:VARS)\s*=\s*["']?[^\s"'`<]`. It matches anywhere in the line, so `export`, backticks, bullets and quotes are all caught. A value is required, so empty assignments and `<placeholder>` values do not match.
- New tests:
  - A sync test requires every `.env.example` variable ending in `_API_KEY`, `_SECRET` or `ACCESS_CODE` to be in `VARIABLES_SECRETAS`, and every listed name to exist in `.env.example`.
  - A positive control uses six lines, one per secret variable, covering the plain, `export`, backtick, `-` bullet, double-quote and `*` bullet single-quote forms. All six are flagged.
  - A negative control: `.env.example` and the README pass. The README still has its literal `Código de acceso: …` line (D-94), which is not an assignment.
- `clavesLlm` has a test for the fallback key.
- I checked all forms by hand, including the review's six sample lines. None were missed, and there were no false positives on `LLM_API_KEY=`, `LLM_API_KEY=""`, `` `ACCESS_CODE=` ``, `OTHER_LLM_API_KEY=…` or the README access-code line.

### IN-01: The 250 ms production threshold is never exercised, and the docs repeat it as a literal

**Files modified:** `src/config/strings.ts`, `src/cli/runners/preflight.runner.ts`, `tests/cli/preflight.test.ts`, `tests/docs/readme.test.ts`
**Commit:** 372e795
**Applied fix:**
- Two guion tests now run with `separacionSseMs: SEPARACION_MINIMA_SSE_MS`, the production value. The fake LLM waits that long on every call.
  - The test with a streamed body passes.
  - The test with a fully buffered body fails with `sseAcumulado`.
  - Both use the real clock and a 15 s test timeout. Each run takes about 1.7 s.
- A doc test requires `README.md` and `docs/estructura.md` to contain `al menos ${SEPARACION_MINIMA_SSE_MS} ms`.
- `TEXTO_PREFLIGHT.sseAcumulado(ms, minimoMs)` now states the threshold and words the cause as a suspicion: "posiblemente un proxy acumula el SSE". The runner passes `plazos.separacionSseMs`.

### IN-02: Writing the pair is not atomic as claimed, and a leftover `.tmp` is not gitignored

**Files modified:** `src/cli/runners/generar-modulo.runner.ts`, `tests/modulo/generador.test.ts`, `docs/estructura.md`, `.gitignore`
**Commit:** 49b134e
**Status:** fixed: requires human verification (new rollback logic)
**Applied fix:**
- `escribirJuntos` reads each destination's previous bytes first, or `null` if the file does not exist. It then writes both `.tmp` files and renames them one by one.
- If a temp write or a rename fails, every file already renamed is restored: its previous bytes are written back, or it is removed if it did not exist before. Then the error is rethrown.
- A `finally` always removes the temp files, using `Promise.allSettled` so cleanup cannot hide the original error.
- New tests:
  - The SKILL.md rename is forced to fail by making `SKILL.md` a non-empty directory. `agent.md` keeps its previous bytes and no `.tmp` remains.
  - A temp write is forced to fail by making `SKILL.md.tmp` a directory. `agent.md` is unchanged, `SKILL.md` is not created, and `agent.md.tmp` is removed.
- `.gitignore` now has `modulo/**/*.tmp`. I checked it with `git status --ignored`.
- `docs/estructura.md` now describes the rollback. It also says that a process killed mid-way can leave `.tmp` files, which are gitignored, and that rerunning `bun run modulo` fixes it.

**Human check:** two renames still cannot be fully atomic. If the process is killed (not a thrown error) between the two renames, the pair can be left mixed. The byte-for-byte CI test catches that state, and rerunning `bun run modulo` repairs it.

### IN-03: `TEXTO_MODULO.fueraDeLaRaiz` still tells the user to run from the project root, which no longer matters

**Files modified:** `src/config/strings.ts`, `src/cli/runners/generar-modulo.runner.ts`, `tests/modulo/generador.test.ts`
**Commit:** db767c4
**Applied fix:** `fueraDeLaRaiz` is now `(raiz) => …`. It says that `package.json` was not found in `raiz`, the root the generator deduces from its own location and not from the working directory. It asks the user to check that the generator is still inside the repository, and says that nothing was written. The runner passes `raiz`, and the test expects `fueraDeLaRaiz(raiz)`.

## Notes

- None of these fixes changes agent, API or SPA behavior.
  - The server still sends the same `Cache-Control` value, now built from constants.
  - The other changes are limited to the pre-flight and module CLI, their strings and constants, test helpers and tests, docs, and `.gitignore`.
  - `reto-01/` was not modified.
- Every commit uses the local identity `elianatorres5772 <elianatorres5772@gmail.com>`, follows Conventional Commits `fix(04): …`, and ends with the requested trailers.
- Nothing was pushed, and `--no-verify` was never used.
- The pre-existing changes to `.planning/STATE.md` and `.planning/config.json` and the untracked `.planning/` files were left as they were.
- Worktree lifecycle: `workflow.use_worktrees` is unset, so it defaults to true. I created the worktree on `gsd-reviewfix/04-22218` and wrote the recovery sentinel. At the end I fast-forwarded `main` to db767c4, removed the worktree, deleted the temp branch, and then removed the sentinel.

---

_Fixed: 2026-10-16T07:10:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
