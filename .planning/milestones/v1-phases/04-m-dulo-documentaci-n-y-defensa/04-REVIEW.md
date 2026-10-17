---
phase: 04-m-dulo-documentaci-n-y-defensa
reviewed: 2026-10-16T14:00:00Z
depth: standard
review_kind: incremental
diff_base: 72feb23
files_reviewed: 22
files_reviewed_list:
  - .gitattributes
  - .github/workflows/ci.yml
  - README.md
  - SOLUCION.md
  - docs/convenciones.md
  - docs/entrega.md
  - docs/estructura.md
  - src/cli/runners/generar-modulo.runner.ts
  - src/cli/runners/preflight.runner.ts
  - src/cli/types/preflight.type.ts
  - src/config/constants/http.constants.ts
  - src/config/constants/modulo.constants.ts
  - src/config/constants/preflight.constants.ts
  - src/config/env.ts
  - src/config/strings.ts
  - tests/cli/preflight.test.ts
  - tests/despliegue/ci.test.ts
  - tests/docs/readme.test.ts
  - tests/docs/solucion.test.ts
  - tests/helpers/documentos.helper.ts
  - tests/modulo/generador.test.ts
  - tests/modulo/herramientas.test.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 04: Code Review Report (incremental re-review after 04-REVIEW-FIX)

**Reviewed:** 2026-10-16T14:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

This is an incremental re-review. It covers the changes since `72feb23`: the 12 fixes from 04-REVIEW-FIX (commits 97c0dc8 through 202b454), the gap-closure plan 04-08 (G-04-1 and G-04-2), and the T-04-22 test change 6c54c18. It replaces the previous review, whose 12 findings were all addressed.

Gates I ran on the current `main`: `bun run check` passes (tsc for both projects and Biome over 453 files). `bun test tests/cli tests/modulo tests/docs tests/despliegue` gives 151 pass and 0 fail.

How each prior finding stands:

| Prior | State | Notes |
|---|---|---|
| CR-01 | Fixed | The client no longer requires `X-Accel-Buffering`. Arrival times of `turn_start` and `turn_end` are now compared, so a buffering proxy is detected end to end. One new weakening is filed as WR-01 below. |
| WR-01 | Fixed | Every failure branch of the guion validator has a test, and each test asserts how many chat turns were sent. |
| WR-02 | Fixed | `.gitattributes` pins LF. `git ls-files --eol` shows all 850 tracked files as `i/lf w/lf`, and no tracked binary is affected. A test also parses `.gitattributes` without git (G-04-1). |
| WR-03 | Fixed | `fin.motivo === MOTIVO_FIN.FINAL` is required in both turns. A real `AGENT_MAX_ITERATIONS` cap tests it. |
| IN-01 | Fixed | Both spawned `bun` processes get `--no-env-file`. |
| IN-02 | Fixed | A 200 JSON response that fails the schema stops polling at once. A 200 that is not JSON keeps polling. The health route returns `c.json`, so `esJson` matches it. |
| IN-03, IN-04, IN-05 | Fixed | Docs only. I verified the README, convenciones and SOLUCION text against the code. |
| IN-06 | Fixed | `persist-credentials: false` is on both checkouts, and a test guards it. No later step needs git credentials. |
| IN-07 | Fixed | The root is now resolved from `import.meta.dir` (`../../..` from `src/cli/runners/`, which is correct), and writes go through a temp file and a rename. Minor leftovers are filed as IN-02 and IN-03 below. |
| IN-08 | Fixed | An empty or whitespace `--url` falls back to the environment, and a URL with a path, query or fragment is rejected. |

I also checked the G-04-2 doc claim in `docs/entrega.md` that turn 1 replaces the previous run's files. It is true: `generar-formulario.use-case.ts:105` calls `limpiarPrevios`, which removes `paquete/` and every `ARCHIVOS_REGENERABLES` entry, `ENVIO-SIMULADO.md` included. As instructed, the literal access code in README.md (D-94) is not flagged.

I found no blockers. There are two warnings. First, the CR-01 fix loosened the SSE header check more than the evidence justifies. Second, the T-04-22 secret scanner, recorded as closed, misses two of the project's secret variables and most ways of writing an assignment.

## Warnings

### WR-01: The CR-01 fix stopped checking `no-transform`, and the "Render edge" test fixture contradicts the project's own evidence

**File:** `src/cli/runners/preflight.runner.ts:263-272`; `src/config/constants/http.constants.ts:162,167-169`; `tests/cli/preflight.test.ts:403-406`

**Issue:** The original CR-01 problem was only `X-Accel-Buffering`. The QA evidence the fix relies on shows that the Render/Cloudflare edge keeps `cache-control: no-cache, no-transform` intact (`.qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md:395`). The expectation recorded there is "`Cache-Control: no-transform` intacto" (line 389). The fix nevertheless replaced the exact `SIN_CACHE_NI_TRANSFORMACION` check with `prohibeCache`, which accepts any header that contains just `no-cache`. `no-transform` is the directive that tells Cloudflare not to compress or rewrite the body, and compression is a known way an edge ends up buffering SSE. So if the server stopped sending `no-transform`, the pre-flight would no longer report it.

The test fixture `comoElBordeDeRender` makes this worse. It overwrites `Cache-Control` with a bare `no-cache` and labels that "como llega por el borde de Render". The evidence says that is not what Render delivers, so the suite now encodes a false model of production.

There is also a smaller convention issue. `DIRECTIVA_SIN_CACHE = "no-cache"` repeats a substring of `VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION` ("no-cache, no-transform") instead of being derived from it. CLAUDE.md says a text that repeats a datum must be derived from its constant.

**Fix:** Define the directives once, build the server value from them, and require both at the client:
```ts
export const DIRECTIVA_CACHE = { SIN_CACHE: "no-cache", SIN_TRANSFORMACION: "no-transform" } as const;
export const SEPARADOR_DIRECTIVAS = ",";
export const VALOR_CABECERA = {
  SIN_CACHE_NI_TRANSFORMACION: Object.values(DIRECTIVA_CACHE).join(`${SEPARADOR_DIRECTIVAS} `),
};

function directivasFaltantes(respuesta: Response): boolean {
  const presentes = new Set(
    (respuesta.headers.get(CABECERA.CACHE_CONTROL) ?? "")
      .split(SEPARADOR_DIRECTIVAS)
      .map((d) => d.trim().toLowerCase()),
  );
  return Object.values(DIRECTIVA_CACHE).some((d) => !presentes.has(d));
}
```
In `comoElBordeDeRender`, delete only `X-Accel-Buffering` and keep the server's `Cache-Control`. Add a test where a header without `no-transform` fails with `cabeceraSse(Cache-Control)`.

### WR-02: The T-04-22 secret-assignment scanner misses `LLM_FALLBACK_API_KEY` and `PREFLIGHT_ACCESS_CODE`, and only matches `VAR=` at the start of a line

**File:** `tests/helpers/documentos.helper.ts:8,34-41` (used by `tests/docs/readme.test.ts:184` and `tests/docs/solucion.test.ts:210`); `tests/helpers/costo.helper.ts:25`

**Issue:** 04-SECURITY.md marks T-04-22 (information disclosure in the docs) as closed by 6c54c18. The scanner it relies on has three gaps:
- `VARIABLES_SECRETAS` lists only `LLM_API_KEY`, `DEEPSEEK_API_KEY` and `ACCESS_TOKEN_SECRET`. It leaves out two of the project's secret variables from `.env.example`: `LLM_FALLBACK_API_KEY` (line 16) and `PREFLIGHT_ACCESS_CODE` (line 47).
- A line matches only when it starts with `VAR=` after trimming. Markdown docs usually write assignments as `export VAR=…`, inside inline code, or after a list marker.
- The value-based check `clavesLlm` (`VARIABLES_CLAVE`) also leaves out `LLM_FALLBACK_API_KEY`. A real fallback key pasted into a doc would not be caught even on a machine whose `.env` has that key.

I ran the helper against six sample lines. It flagged only the first:
```
LLM_API_KEY=sk-a              -> flagged
LLM_FALLBACK_API_KEY=sk-b     -> missed
export LLM_API_KEY=sk-c       -> missed
PREFLIGHT_ACCESS_CODE=abc...  -> missed
`LLM_API_KEY=sk-d`            -> missed
- DEEPSEEK_API_KEY=sk-e       -> missed
```
The current docs are clean (grep finds no assignment of any of these five variables), so this is a latent gap. The mitigation recorded as closed does not hold.

**Fix:** Match the assignment anywhere in the line and include every secret variable:
```ts
const PATRON_ASIGNACION_SECRETA =
  /\b(LLM_API_KEY|LLM_FALLBACK_API_KEY|DEEPSEEK_API_KEY|ACCESS_TOKEN_SECRET|PREFLIGHT_ACCESS_CODE)\s*[=:]\s*[^\s`'"<]+/;
export function asignacionesSecretas(texto: string): string[] {
  return texto.split("\n").filter((linea) => PATRON_ASIGNACION_SECRETA.test(linea));
}
```
Also add `LLM_FALLBACK_API_KEY` to `VARIABLES_CLAVE`, and add a self-test that proves the helper flags each form above. The other guardians already follow that convention. The literal `ACCESS_CODE` in the README (D-94) is not a match, so this does not conflict with D-94.

## Info

### IN-01: The 250 ms production threshold is never exercised, and the docs repeat it as a literal

**File:** `src/cli/runners/preflight.runner.ts:62-68,321-324`; `tests/cli/preflight.test.ts:60,64-70`; `README.md:54`; `docs/estructura.md:83`; `src/config/strings.ts:511-512`

**Issue:** Every test overrides `separacionSseMs`: 0 in `PLAZOS_PRUEBA` and 50 in `PLAZOS_CON_SEPARACION`. So `PLAZOS_POR_DEFECTO.separacionSseMs = SEPARACION_MINIMA_SSE_MS` is never run. In the fake guion, turn 2 makes two LLM calls of 80 ms each, about 160 ms, which would fail under the real 250 ms default. The test has to lower the threshold to pass. README and estructura state "250 ms" as a literal, and no doc test ties it to the constant.

Separately, `sseAcumulado` reports a proxy as buffering ("un proxy está acumulando el SSE") whenever the turn was simply faster than the threshold. That is a guess presented as a fact.

**Fix:** Add a doc test that checks `README.md` and `docs/estructura.md` contain `${SEPARACION_MINIMA_SSE_MS} ms`. Word the message as a suspicion, for example "llegó a X ms… posiblemente un proxy acumula el SSE". Optionally, add one guion test that uses `PLAZOS_POR_DEFECTO`'s separation with an LLM delay large enough to exceed it.

### IN-02: Writing the pair is not atomic as claimed, and a leftover `.tmp` is not gitignored

**File:** `src/cli/runners/generar-modulo.runner.ts:90-103`; `docs/estructura.md:83`; `.gitignore`

**Issue:** The temp files are cleaned up only when the write step fails. The renames run one after the other (line 102). If the first rename succeeds and the second fails, `agent.md` is new, `SKILL.md` is stale, and `SKILL.md.tmp` stays on disk. That is exactly the mixed state that `docs/estructura.md` says cannot happen ("una falla al escribir no deja un archivo nuevo junto a uno viejo"). Also, if the process is killed between the write and the rename, `modulo/**/*.tmp` files are left behind. `.gitignore` does not cover `*.tmp`, so a later `git add modulo/` could commit them.

**Fix:** Add `*.tmp` (or `modulo/**/*.tmp`) to `.gitignore`. Narrow the doc claim to "una falla al escribir los temporales no toca los archivos commiteados", or wrap the rename loop in a try/finally that removes any remaining temp files.

### IN-03: `TEXTO_MODULO.fueraDeLaRaiz` still tells the user to run from the project root, which no longer matters

**File:** `src/config/strings.ts:473`; `src/cli/runners/generar-modulo.runner.ts:31,76-78,106`

**Issue:** After IN-07, the command entry resolves the root from the runner's own location, so the working directory has no effect. The guard can now fire only when the runner itself has been moved or copied outside the repo. The message still says "debe correr en la raíz del proyecto", and following that advice will not fix the error.

**Fix:** Reword it to something like "No se encontró `${ARCHIVO_PROYECTO}` en `${raiz}`, la raíz que se deduce de la ubicación del generador; no se escribió nada." Pass `raiz` to the message.

---

_Reviewed: 2026-10-16T14:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
