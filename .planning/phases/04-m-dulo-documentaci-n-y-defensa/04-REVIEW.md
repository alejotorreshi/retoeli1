---
phase: 04-m-dulo-documentaci-n-y-defensa
reviewed: 2026-10-16T12:00:00Z
depth: standard
files_reviewed: 50
files_reviewed_list:
  - .claude/CLAUDE.md
  - .env.example
  - .github/workflows/ci.yml
  - .opencode/tools/proveedor.ts
  - README.md
  - SOLUCION.md
  - docs/arquitectura.md
  - docs/convenciones.md
  - docs/entrega.md
  - docs/estructura.md
  - docs/evidencia/costo-por-caso.json
  - docs/plantillas.md
  - modulo/README.md
  - modulo/agent.md
  - modulo/skill/registro-proveedor/SKILL.md
  - modulo/tools/proveedor.ts
  - opencode.json
  - package.json
  - render.yaml
  - src/cli/runners/generar-modulo.runner.ts
  - src/cli/runners/preflight.runner.ts
  - src/cli/schemas/preflight.schema.ts
  - src/cli/types/modulo.type.ts
  - src/cli/types/preflight.type.ts
  - src/config/constants/costo.constants.ts
  - src/config/constants/files.constants.ts
  - src/config/constants/http.constants.ts
  - src/config/constants/modulo.constants.ts
  - src/config/constants/preflight.constants.ts
  - src/config/env.ts
  - src/config/strings.ts
  - src/domain/builders/modulo.builder.ts
  - tests/architecture.test.ts
  - tests/cli/preflight.test.ts
  - tests/despliegue/ci.test.ts
  - tests/despliegue/contrato-despliegue.test.ts
  - tests/docs/continuidad.test.ts
  - tests/docs/evidencia-costo.test.ts
  - tests/docs/readme.test.ts
  - tests/docs/solucion.test.ts
  - tests/helpers/costo.helper.ts
  - tests/helpers/documentos.helper.ts
  - tests/helpers/types/costo.type.ts
  - tests/live/costo-por-caso.test.ts
  - tests/modulo/generador.test.ts
  - tests/modulo/herramientas.test.ts
  - tests/modulo/opencode.test.ts
  - tests/sin-comentarios.test.ts
  - tests/unit/modulo.builder.test.ts
  - tsconfig.json
findings:
  critical: 1
  warning: 3
  info: 8
  total: 12
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-10-16T12:00:00Z
**Depth:** standard
**Files Reviewed:** 50
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the new `src/cli` layer (the pre-flight runner and the module generator), the CI workflow, `render.yaml`, the `modulo/` and `.opencode/` re-exports, `opencode.json`, README, SOLUCION and the `docs/` files against the code, the cost evidence JSON, and the new tests. The phase test suites pass locally: 124 tests across `tests/cli`, `tests/modulo`, `tests/docs`, `tests/despliegue` and `tests/unit/modulo.builder.test.ts`.

What checked out:
- The access code is never printed. It is read only from `PREFLIGHT_ACCESS_CODE`. A failed argv parse prints only the usage text. Zod issue messages never echo the value. The URL is printed only as `origin`, so userinfo is dropped. I confirmed by running it that Bun's `fetch` drops `Authorization` on a cross-origin redirect, and that `AbortSignal.timeout` also aborts a stalled SSE body.
- URL validation requires `https`, or `http` only for loopback hosts.
- The SSE stream is parsed with `eventsource-parser`. An early return cancels the stream.
- The module generator does a byte-exact concatenation. It fails before writing anything when a source is empty or missing, or when it runs outside the project root.
- The CI actions are pinned to full SHAs. The audit job does not block, because `continue-on-error` is set at step level and the job still succeeds.
- `render.yaml` uses `autoDeployTrigger: checksPass`.
- The cost evidence JSON has no PII or keys. Its numbers add up per scenario and in total, and the SOLUCION §4 table matches them.
- `.qa/render.token` is gitignored and dockerignored.
- As instructed, the literal access code in the README (D-94) is not flagged.

The main defect: the repository's own Phase 3 QA evidence shows that Render or Cloudflare strips `X-Accel-Buffering` before the response reaches the client. `bun run preflight --guion` requires that header. So the scripted §11 rehearsal fails every time it runs against the production link, after it has already spent tokens on turn 1.

## Critical Issues

### CR-01: `preflight --guion` always fails against Render because it requires `X-Accel-Buffering: no` at the client, and Render's edge strips it

**File:** `src/cli/runners/preflight.runner.ts:78-81`, `src/cli/runners/preflight.runner.ts:247-252`, `src/cli/runners/preflight.runner.ts:279-287` (also `README.md:173`, `docs/entrega.md:25`, `tests/cli/preflight.test.ts:300-357`)

**Issue:** `cabeceraSseFaltante` fails the turn unless the client sees `X-Accel-Buffering: no`, with an exact match on the value (`CABECERAS_SSE`). `X-Accel-Buffering` is an instruction to the reverse proxy, and nginx-style proxies remove it by default (`proxy_hide_header`). The project's own live evidence shows this happens on the production link. In `.qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md:66-72,403` the local response carries the header, but the Render/Cloudflare response (`HTTP/2 200 | content-type: text/event-stream | cache-control: no-cache, no-transform | cf-cache-status: DYNAMIC`) does not. The note there reads: "`X-Accel-Buffering: no` no llega al cliente (Cloudflare o el borde de Render lo quitan), aunque no hubo buffering."

The consequences:
- `bun run preflight -- --url https://registro-proveedor-bfnt.onrender.com --guion` prints `cabeceraSse(X-Accel-Buffering)` and "Pre-flight fallido" every time, even though streaming works. `docs/entrega.md:25` plans exactly this step (eli-qa runs it against Render) before the defense.
- The check runs after the `POST /api/chat` response arrives, so the turn has already started on the server. That spends tokens and one of the `NEW_SESSIONS_PER_HOUR` slots before the turn is cancelled.
- The unit test `si el SSE llega sin X-Accel-Buffering no, falla…` writes this wrong expectation into the suite.
- The README promise that it "comprueba los encabezados SSE sin buffering" cannot be met by a header check through this proxy chain.

**Fix:** Stop requiring the proxy-consumed header at the client. Check what is observable end to end instead: the content type, `Cache-Control`, and that frames arrive incrementally. For example, `turn_start` must arrive well before `turn_end`:
```ts
const CABECERAS_SSE = [
  [CABECERA.CACHE_CONTROL, VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION],
] as const;

// in leerTurno: record opciones.ahora() at the first frame and at turn_end;
// if turn_end arrives in the same instant as the first frame on a multi-tool turn,
// fail with TEXTO_PREFLIGHT.cabeceraSse / a new "sseAcumulado" message.
```
Then update the unit test, `README.md:173` and `docs/estructura.md:83`. Treat a missing `X-Accel-Buffering` as informational at most.

## Warnings

### WR-01: Most of the guion validator's failure branches have no tests

**File:** `tests/cli/preflight.test.ts:312-363` (branches in `src/cli/runners/preflight.runner.ts:237-239, 290-294, 309-316, 321-322, 357-359, 374-376`)

**Issue:** The `--guion` suite covers only the happy path, `sinConfirmacion` and the X-Accel header case. These failure branches are never exercised:
- `envioAntesDeTiempo` (the model sends in turn 1);
- `bloqueoAusente`;
- `herramientaFaltante`;
- `errorDelAgente` (an `error` frame);
- `turnoIncompleto` (no `turn_end`, or no `turn_start`);
- `respuestaInvalida` for a malformed SSE frame;
- `archivoInesperado` and `archivoFaltante`;
- `confirmacionAbierta`;
- the `turnoMs` timeout and abort path;
- a wrong `Content-Type`.

These checks are the reason the pre-flight exists: it is supposed to prove the §11 flow is safe before the defense. A regression in any of them, such as an inverted condition, would go unnoticed. CR-01 shows that a header assumption also slipped through without a realistic test.

**Fix:** Add one test per branch. Use the existing `crearFetchFalso` script, or wrap the fetch so it rewrites the SSE body (drop `turn_end`, inject `event: error`, inject a non-JSON `data:`). For the timeout, use a server that never closes the stream together with `plazos.turnoMs` of a few hundred ms.

### WR-02: The module byte-equality guarantee depends on line endings, and the repo has no `.gitattributes`

**File:** `tests/modulo/generador.test.ts:102-109,137-144`; `src/cli/runners/generar-modulo.runner.ts:36-44`; `src/domain/builders/modulo.builder.ts:10-14` (repository root: `.gitattributes` missing)

**Issue:** The generator writes an LF-only frontmatter followed by the raw bytes of `agent/prompt.md` and `src/knowledge/registro-proveedor.md`. The test then compares the committed `modulo/agent.md` and `SKILL.md` byte for byte. Consider a Windows checkout with `core.autocrlf=true`, which is the Git for Windows default:
- every committed `.md` file gets CRLF, frontmatter included;
- the regenerated output has an LF frontmatter followed by a CRLF body;
- the byte-equality tests therefore fail on a clean checkout;
- `bun run modulo` writes files with mixed line endings.

An evaluator cloning on Windows gets a red `bun test` without touching anything.

**Fix:** Add a `.gitattributes` that pins these files to LF, for example:
```
* text=auto eol=lf
*.md text eol=lf
```
Optionally, also make the generator normalize nothing but assert LF in the source and fail loudly when it finds CRLF.

### WR-03: The pre-flight reports a turn as OK even when it ended on a cap rather than normally

**File:** `src/cli/runners/preflight.runner.ts:292-294, 304-324`

**Issue:** `enviarTurno` only checks that `turn_end` arrived. It never checks `fin.motivo`. In the agent loop, `TOPE_ITERACIONES` and `TOPE_TOKENS` close the turn without an `error` event (`src/loop/services/cierre-error.service.ts:18-20`, `cerrarSinError`). A turn that hits the iteration or token cap after the required tool calls succeeded therefore passes as "Turno N del guion del PRD §11 OK". That is exactly the degraded behavior the defense rehearsal should catch: the analyst gets a truncated answer.

**Fix:** Require `lectura.valor.fin.motivo === MOTIVO_FIN.FINAL` in both turns:
```ts
if (lectura.valor.fin.motivo !== MOTIVO_FIN.FINAL) {
  return fallido(TEXTO_PREFLIGHT.turnoCortado(lectura.valor.fin.motivo));
}
```

## Info

### IN-01: Spawned-process tests claim an "empty environment", but Bun auto-loads `.env` from `cwd`

**File:** `tests/modulo/herramientas.test.ts:34-45`, `tests/cli/preflight.test.ts:240-249`

**Issue:** `Bun.spawn(..., { cwd: RAIZ, env: {} })` still loads `RAIZ/.env`. On a developer machine with a filled `.env`, the test "se importa con el entorno vacío" does not prove what it claims. It only holds in CI, where there is no `.env`.

**Fix:** Pass `--no-env-file` to the child `bun` (`[process.execPath, "--no-env-file", "-e", …]`).

### IN-02: The README overstates what the default pre-flight waits for, and an invalid health body keeps the loop polling

**File:** `README.md:172`; `src/cli/runners/preflight.runner.ts:136-151,158`

**Issue:** The README says the pre-flight "espera `/api/health` con el modelo disponible". In fact it waits only for a 200 response and then fails immediately if `llm !== disponible`. Separately, a 200 response whose body fails `saludSchema` (for example a future `llm` state, or `ok: false`) keeps the loop polling for the full 180 s. It then reports `respuestaInvalida` instead of failing fast.

**Fix:** Reword the README ("espera a que `/api/health` responda 200 y exige el modelo `disponible`"). Stop polling as soon as a 200 response fails the schema.

### IN-03: The README says the cookie is always `Secure`, but the code drops `Secure` in development

**File:** `README.md:139` (vs `src/http/wiring/server.wiring.ts:110`, `SOLUCION.md:133`)

**Issue:** `secureCookie` is `NODE_ENV !== development`. SOLUCION states this correctly ("`Secure` fuera de desarrollo"), but the README lists `Secure` unconditionally.

**Fix:** Write "`Secure` fuera de desarrollo" in the README.

### IN-04: `docs/convenciones.md` G1 omits the `@modulo/` alias

**File:** `docs/convenciones.md:20`

**Issue:** G1 lists only `@/`, `@tests/` and `@web/`. `.claude/CLAUDE.md` (the canonical source) and the guardian both allow `@modulo/`, which `.opencode/` uses.

**Fix:** Add `@modulo/` (used only by `.opencode/`) to the G1 row.

### IN-05: SOLUCION's peak-hour window and its "valle" claim are not backed by any constant or by the evidence

**File:** `SOLUCION.md:76,90`; `src/config/constants/costo.constants.ts:1-8`

**Issue:** The peak hours ("01:00–04:00 y 06:00–10:00 UTC, lunes a viernes") and the statement that the run fell in off-peak hours exist only in prose. `PRECIOS_DEEPSEEK_FLASH` and the evidence JSON do not record the window, so `tests/docs/solucion.test.ts` cannot keep this claim honest. Also, `fechaCorridaUtc` is taken at the end of the run (`tests/live/costo-por-caso.test.ts:110`), not at its start.

**Fix:** Add the window to `PRECIOS_DEEPSEEK_FLASH`, or drop the window and the "cayó en horario valle" sentence and just present both prices.

### IN-06: `actions/checkout` keeps the default `persist-credentials: true`

**File:** `.github/workflows/ci.yml:18-19,39-40`

**Issue:** The `GITHUB_TOKEN` stays in `.git/config` for every later step, including `bun install` and `bun test` with third-party code. Impact is low because `permissions: contents: read`, but it is unnecessary.

**Fix:** Add `with: { persist-credentials: false }` to both checkout steps.

### IN-07: The module generator resolves the root from `process.cwd()` and writes its two files non-atomically

**File:** `src/cli/runners/generar-modulo.runner.ts:69-89`

**Issue:** Running the runner directly from another directory that contains a `package.json` would write `modulo/` there. A failure between the two `Bun.write` calls leaves `agent.md` regenerated and `SKILL.md` stale.

**Fix:** Derive the root from `import.meta.dir`. Optionally, build both buffers first (already done), then write each one to a temp path and rename it.

### IN-08: `--url ""` silently overrides `PREFLIGHT_URL`, and a URL path is silently dropped

**File:** `src/cli/runners/preflight.runner.ts:106,435`; `src/config/env.ts:425-428`

**Issue:** `readPreflightEnv("")` replaces the env value with `""`, which `emptyAsUndefined` then turns into "Falta la URL", even when `PREFLIGHT_URL` is set. Separately, `new URL(RUTA_API.SALUD, url)` discards any path in `--url` (`https://host/prefix` probes `https://host/api/health`) without warning.

**Fix:** Fall back to `process.env.PREFLIGHT_URL` when the argument is empty. Reject a URL with a non-root path, or print a warning for it.

---

_Reviewed: 2026-10-16T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
