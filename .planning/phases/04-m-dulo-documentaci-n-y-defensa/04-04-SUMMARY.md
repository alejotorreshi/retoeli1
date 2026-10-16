---
phase: 04-m-dulo-documentaci-n-y-defensa
plan: 04
subsystem: cli-preflight
tags: [preflight, cli, sse, eventsource-parser, zod, render, dep-03]
status: complete

requires:
  - phase: 04-01
    provides: the src/cli layer (runners, schemas, types) declared in the guardian, with http allowed only as import type
  - phase: 03
    provides: the HTTP contract (/api/health, /api/config, /api/chat SSE, /api/casos/:caso/archivos), Bearer access with lockout, test helpers crearServidorPrueba and crearFetchFalso
provides:
  - "`bun run preflight -- --url <url>`: wakes the service, waits for health with llm disponible, checks the access code once, spends no tokens"
  - "`bun run preflight -- --guion`: runs PRD §11 in two SSE turns (headers, tools, confirmation, block, simulated send) and prints the tokens"
  - ejecutarPreflight(opciones) with injectable fetch, clock, sleep and deadlines
  - preflightEnvSchema / parsePreflightEnv / readPreflightEnv (PREFLIGHT_URL, PREFLIGHT_ACCESS_CODE)
  - TEXTO_PREFLIGHT (mensajeGuion equal to the SPA chip mensajeDemo, mensajeConfirmacion "envía")
affects: [04-05 cost measurement, 04-06 docs/entrega.md, eli-qa phase 4 suite, defense warm-up]

actuals:
  tokens: 13137
  tasks: 2
  commits: 5
plan_head_before: 4e5863cda5e6fe5ba0b6f3e14fd8fbac79fc6574
plan_head_after: d717e83b5c52007820bbcbffadf57e180ef5ba70

tech-stack:
  added: []
  patterns:
    - "CLI probe as a black-box client of the public API: fetch, clock (ahora), sleep (esperar) and deadlines are injected, so tests use a fake clock and a real Bun.serve socket of createServer"
    - "Each step returns PasoPreflight<T> (ok + valor | FalloPreflight); the first failure prints one Spanish line plus the verdict and exits 1"
    - "SSE frames parsed with EventSourceParserStream and validated per event type with non-strict zod schemas (extra fields ignored)"

key-files:
  created:
    - src/config/constants/preflight.constants.ts
    - src/cli/types/preflight.type.ts
    - src/cli/schemas/preflight.schema.ts
    - src/cli/runners/preflight.runner.ts
    - tests/cli/preflight.test.ts
  modified:
    - src/config/env.ts
    - src/config/strings.ts
    - .env.example
    - package.json
    - docs/estructura.md

key-decisions:
  - "PREFLIGHT_URL reuses the provider-URL rule: https anywhere, http only to a loopback host, so the access code never travels in clear text to a remote host"
  - "readPreflightEnv(urlArgument) validates --url with the same zod rule as PREFLIGHT_URL; the CLI parses argv with parseArgs strict and no positionals, and a parse error prints only the usage line (never the offending argument)"
  - "Health polling treats a 200 with an invalid body as not ready yet (Render's wake page) and reports respuestaInvalida only if that was the last state when the deadline expires"
  - "In --guion, the confirmation check runs before the tool list, so a turn without armar_paquete reports the missing confirmation; an error SSE event or a missing turn_end fails the turn"

patterns-established:
  - "Run-once access probe: one GET /api/config with Bearer, 401 and 429 final, no retry (T-04-11)"

requirements-completed: [DEP-03]

coverage:
  - id: D1
    description: "Default pre-flight wakes the service (polls /api/health until 200 within the deadline), requires llm disponible, checks the code once with GET /api/config, validates fecha 2026-09-03 and ec-corp-andina, and never POSTs /api/chat"
    requirement: DEP-03
    verification:
      - kind: integration
        ref: "tests/cli/preflight.test.ts#despierta el servicio, valida la salud y el código, y nunca abre un turno del chat"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#sin clave del modelo falla nombrando el estado y nunca prueba el código"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#un servicio que nunca responde 200 falla con servicioDormido al vencer el plazo"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#una fecha de ejecución distinta de la del guion falla con fechaInesperada"
        status: pass
      - kind: other
        ref: "local server on :3998 with a fake key: bun run preflight -- --url http://localhost:3998 -> PREFLIGHT_EXIT=0, code absent from output"
        status: pass
    human_judgment: false
  - id: D2
    description: "401 and 429 from the access check are final with exactly one config request (no self-lockout)"
    requirement: DEP-03
    verification:
      - kind: integration
        ref: "tests/cli/preflight.test.ts#un código rechazado falla con codigoRechazado y pide la configuración una sola vez"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#una IP bloqueada falla con ipBloqueada sin reintentar"
        status: pass
    human_judgment: false
  - id: D3
    description: "The access code only comes from PREFLIGHT_ACCESS_CODE via env.ts, is never accepted as an argument and never printed"
    requirement: DEP-03
    verification:
      - kind: unit
        ref: "tests/cli/preflight.test.ts#sin PREFLIGHT_ACCESS_CODE falla nombrando la variable"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#una opción desconocida con el código sale con 1 y no lo imprime"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#un argumento suelto sale con 1 y no lo imprime"
        status: pass
    human_judgment: false
  - id: D4
    description: "--guion runs PRD §11 in two SSE turns of one session: headers, four flow tools ok, confirmation with certificado_cumplimiento_tributario, no early send, ENVIO-SIMULADO.md absent then present, needsConfirmation false after envía, and prints the tokens"
    requirement: DEP-03
    verification:
      - kind: integration
        ref: "tests/cli/preflight.test.ts#corre el guion completo en una sola sesión y reporta los tokens"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#si el turno 1 no deja la confirmación pendiente falla y nunca manda el segundo turno"
        status: pass
      - kind: integration
        ref: "tests/cli/preflight.test.ts#si el SSE llega sin X-Accel-Buffering no, falla nombrando la cabecera"
        status: pass
      - kind: unit
        ref: "tests/cli/preflight.test.ts#el mensaje del guion es el del chip de la SPA (mensajeDemo) y la confirmación es envía"
        status: pass
    human_judgment: false
  - id: D5
    description: "Run against the public Render link (default and --guion) and the browser rehearsal of §11"
    requirement: DEP-03
    verification: []
    human_judgment: true
    rationale: "Needs the real model and the deployed service after the orchestrator pushes; executed by eli-qa and then the user (D-95), listed in docs/entrega.md by plan 04-06"

duration: 10min
completed: 2026-10-16
---

# Phase 4 Plan 04: Pre-flight de la defensa Summary

**`bun run preflight` wakes the Render service, waits for `/api/health` with the model `disponible`, and checks the access code once with `GET /api/config`, all without model tokens. `--guion` replays PRD §11 over SSE in two turns of one session and prints the tokens used. The code only comes from `PREFLIGHT_ACCESS_CODE` and is never printed.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-16T04:35:52Z
- **Completed:** 2026-10-16T04:45:58Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto, both TDD)
- **Files modified:** 10 (5 created, 5 modified)

## Accomplishments

- Default mode (D-92, D-97). It polls `GET /api/health` every 5 s, with a 30 s timeout per request, until it gets 200 or 180 s pass. It requires `llm: disponible`, then makes one `GET /api/config` with `Authorization: Bearer`. A 401 (`codigoRechazado`) or 429 (`ipBloqueada`) ends the run with no retry. It checks `fechaEjecucion === 2026-09-03` and that `ec-corp-andina` is listed. It never calls `POST /api/chat`.
- `--guion` mode (D-92). Turn 1 sends the §11 message, which equals the SPA chip `mensajeDemo`. It requires:
  - status 200, `text/event-stream`, `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`;
  - a confirmation pending for `ec-corp-andina` whose block names `certificado_cumplimiento_tributario`;
  - leer, mapear, generar and armar ending ok;
  - no `proveedor_simular_envio` call;
  - `ENVIO-SIMULADO.md` absent from the file list.

  Turn 2 sends `envía` with the `sesionId` from `turn_start`. It requires `proveedor_simular_envio` ok, `needsConfirmation: false` and `ENVIO-SIMULADO.md` present. At the end it prints the summed entrada, caché and salida plus the last `totalSesion`.
- Entry point. `parseArgs` runs strict with only `--url` and `--guion`. An unknown flag or a positional argument prints the usage line and exits 1, without echoing the argument. `PREFLIGHT_URL` and `PREFLIGHT_ACCESS_CODE` are read through `readPreflightEnv`. `.env.example` lists both with no value.
- `docs/estructura.md` names `preflight` in the cli runners, schemas and types rows (IN-21), and adds `cli` to the `config/env.ts` importer list.

## Task Commits

1. **Task 1 RED:** `37b7147` test(04-04): agregar pruebas que fallan del pre-flight por defecto
2. **Task 1 GREEN:** `77a87a2` feat(04-04): pre-flight que despierta el servicio y prueba el código sin gastar tokens
3. **Task 2 RED:** `1fc5a50` test(04-04): agregar pruebas que fallan del guion PRD §11 del pre-flight
4. **Task 2 GREEN:** `5d415c8` feat(04-04): --guion corre el PRD §11 en dos turnos SSE y reporta los tokens
5. **REFACTOR:** `d717e83` refactor(04-04): nombrar FalloPreflight en vez de repetir la forma del fallo

## TDD Evidence

- **Task 1 RED:** `bun test tests/cli/preflight.test.ts --reporter=junit` exited 1, with 9 of 13 tests failing. The classifier returned `RED_EVIDENCE_OK` for "despierta el servicio, valida la salud y el código, y nunca abre un turno del chat". Semantic assessment: the target failed on its first assertion, `expect(resultado).toEqual({ fallido: false, tokens: null })`. It received `{ fallido: true }` from the stub runner, which never contacted the server. There was no load, import or syntax fault. The 4 tests that passed in RED were the env-schema tests: the schema was committed as scaffolding with RED so the file could load (see Deviations).
- **Task 1 GREEN:** 13/13 pass.
- **Tracer gate:** auto mode is active and `<verify>` is automated-only. It was re-run end to end before the work expanded to Task 2: 4 suites with 115 pass and 0 fail, the local server smoke gave `PREFLIGHT_EXIT=0` with the code absent from the output, and `bun run check` exited 0.
- **Task 2 RED:** the same command exited 1 with 3 of 17 failing. The classifier returned `RED_EVIDENCE_OK` for "corre el guion completo en una sola sesión y reporta los tokens". Semantic assessment: the target failed on `expect(tokens).not.toBeNull()` because the runner ignored `guion` and returned `tokens: null`. The other two guion tests failed on `expect(resultado.fallido).toBe(true)`. The text-equality test passed in RED because `TEXTO_PREFLIGHT.mensajeGuion` had been written in Task 1.
- **Task 2 GREEN:** 17/17 pass.

## Verification

- `bun test tests/cli/preflight.test.ts tests/architecture.test.ts tests/seguridad/clave.test.ts tests/sin-comentarios.test.ts`: 119 pass, 0 fail.
- Local smoke against `bun src/server.ts` on port 3998 with a fake LLM key:
  - correct code: `PREFLIGHT_EXIT=0`;
  - wrong code: exit 1 with the 401 line;
  - neither code appears in the output.
- `bun run check`: exit 0.
- Full `bun test`: 2406 tests, 2405 pass, 1 skip (live), 0 fail.
- Acceptance greps all pass:
  - `PREFLIGHT_URL=` and `PREFLIGHT_ACCESS_CODE=` in `.env.example`: 1 each;
  - the `preflight` script in `package.json`: 1;
  - `satisfies z.ZodType<HealthResponse>`: 1;
  - `preflight` in `docs/estructura.md`: 4;
  - `EventSourceParserStream` in the runner: 2;
  - `import type` in the schema: 2;
  - `mensajeDemo` in the test: 2;
  - no `@/http` import in `src/cli` without `import type`.

## Decisions Made

- The URL rule is https everywhere and http only for `localhost`, `127.0.0.1` and `[::1]`, reusing `isAllowedProtocol` from the provider URL.
- Deadlines are injected as `PlazosPreflight` and time as `ahora`/`esperar`, so the sleeping-service test runs on a fake clock in milliseconds.
- A 200 health response with an unparseable body counts as "not ready" during polling. This is for Render's wake behavior. It is reported as `respuestaInvalida` only if it is still the state when the deadline expires.
- The guion run uses exactly one new session: turn 2 reuses the `sesionId` from turn 1. This matters because Render allows `NEW_SESSIONS_PER_HOUR=20`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] PREFLIGHT_URL accepts http only toward a loopback host**
- **Found during:** Task 1.
- **Issue:** The plan said "an http or https URL". Plain http to a remote host would send the access code over the network in clear text (T-04-10).
- **Fix:** The schema reuses the provider-URL rule (https anywhere, http only to a loopback host), with its own Spanish messages `urlPreflightInvalida` and `urlPreflightNoSegura`. The local smoke (`http://localhost:3998`) and Render (`https://…`) both pass.
- **Files modified:** src/config/env.ts, src/config/strings.ts.
- **Verification:** the test "la URL, si viene, es https o http solo hacia un host local".
- **Committed in:** 37b7147.

**2. [Rule 3 - Blocking] Scaffolding committed with the RED tests**
- **Found during:** Task 1 RED.
- **Issue:** The test imports `ejecutarPreflight`, `parsePreflightEnv`, `TEXTO_PREFLIGHT` and the types. Without them Bun fails at link time, which is an INVALID_RED load failure.
- **Fix:** The RED commit `37b7147` carries the constants, the texts, the types, the env schema and a stub runner that returns `fallido: true`. All runner behavior is in GREEN `77a87a2`.
- **Files modified:** see commit 37b7147.

**3. [Rule 2 - Missing critical] Extra checks beyond the plan's list**
- **Found during:** Tasks 1 and 2.
- **Fix:** Added tests for a wrong `fechaEjecucion`, a port that does not listen, and an IP that is already locked (429 with one request). The CLI rejects positional arguments, which is where a pasted code would land. An `error` SSE event or a missing `turn_end` fails the turn.
- **Committed in:** 77a87a2, 5d415c8.

**4. [Rule 1 - Bug] Test type fix in GREEN**
- **Found during:** Task 2 GREEN (`bun run check`).
- **Issue:** The test's file-list recorder assigned `unknown` from `Response.json()` to a typed variable.
- **Fix:** It now parses with `archivosGuionSchema`.
- **Committed in:** 5d415c8.

---

**Total deviations:** 4 (2 Rule 2, 1 Rule 3, 1 Rule 1). **Impact:** all of them tighten security or testability. The delivered interface is unchanged.

## Issues Encountered

None.

## Known Stubs

None. The RED stub runner was replaced in GREEN.

## User Setup Required

None in the repo. To run against Render, put `PREFLIGHT_ACCESS_CODE` in the shell or the local env file and run `bun run preflight -- --url https://registro-proveedor-bfnt.onrender.com [--guion]`. This run is for eli-qa and the user (D-95). It was not run against Render or a real model here.

## Next Phase Readiness

- Plan 04-06 should list in `docs/entrega.md` the warm-up (`bun run preflight` about 10 min before the defense, D-93) and the `--guion` rehearsal for eli-qa and the user.
- `--guion` costs one §11 run of the real model. Plan 04-05 measures that cost.

## Self-Check: PASSED

- FOUND: src/config/constants/preflight.constants.ts, src/cli/types/preflight.type.ts, src/cli/schemas/preflight.schema.ts, src/cli/runners/preflight.runner.ts, tests/cli/preflight.test.ts
- FOUND commits: 37b7147, 77a87a2, 1fc5a50, 5d415c8, d717e83 (ancestors of HEAD)
