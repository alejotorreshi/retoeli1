---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 08
subsystem: agent
tags: [loop, resilience, retry, timeout, fallback, deadline, abort, logging, pino, ca5, seg-03, llm-03, llm-04]
status: complete
requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-01: AgentEnv timeoutMs/maxRetries/turnDeadlineMs/logLevel, CODIGO_AGENTE; 02-04: withTimeout, withRetry, withFallback, BACKOFF_*; 02-05: createLogger, redactar; 02-06: crearAgentePrueba, historialIntegro, sensiblesDelMaestro; 02-07: budget and cap endings"
provides:
  - "crearAgente composes withFallback(withRetry(withObservacion(withTimeout(primary))), same over the fallback slot only when it has its own key)"
  - "sleepWithSignal (abortable, never rejects) and OpcionesAgente.esperar / destinoLogs seams"
  - "One turn signal AbortSignal.any(caller, AbortSignal.timeout(deadlineMs)) passed to every provider call, including the cap summary"
  - "Abort handling by cause (TIEMPO_TURNO_AGOTADO vs abortado), step discarding, finally-commit of abandoned turns, ARGUMENTOS_TRUNCADOS answers for fin limite steps"
  - "Correlated pino log lines: turn_start, llm_call, llm_error, llm_fallback, tool_exec, gate_blocked, gate_granted, turn_end (EVENTO_BITACORA)"
  - "withObservacion decorator and ObservadorLlm/FalloLlm on OpcionesEnvio; ResultadoDespacho.envioPermitido"
  - "tests/loop/resiliencia.test.ts, fallback.test.ts, bitacora.test.ts; tests/unit/sleep.util.test.ts, observacion.decorator.test.ts"
affects: [02-09, phase-03-api-sse, phase-04-solucion]
actuals:
  tokens: 20129
  tasks: 3
  commits: 7
plan_head_before: 69ded236ad55a985f0905a489832a62ecd975b7c
plan_head_after: ad53107015dbc401d72822ce31e50797c6df7ab1
tech-stack:
  added: []
  patterns:
    - "Per-attempt observation travels in OpcionesEnvio.observador, so decorators stay stateless and every llm_error/llm_fallback line carries the turn's sesionId and turnoId"
    - "Turno.guardado plus a finally-commit: every turn, even an abandoned one, leaves user + complete steps + one assistant message without tool calls"
    - "A step is checked against the turn signal before each tool dispatch; an aborted step never reaches turno.pasos"
key-files:
  created:
    - src/infra/clock/sleep.util.ts
    - src/llm/decorators/observacion.decorator.ts
    - src/loop/services/bitacora-turno.service.ts
    - tests/helpers/agente-fetch.helper.ts
    - tests/helpers/types/agente-fetch.type.ts
    - tests/helpers/bitacora.helper.ts
    - tests/helpers/types/bitacora.type.ts
    - tests/loop/resiliencia.test.ts
    - tests/loop/fallback.test.ts
    - tests/loop/bitacora.test.ts
    - tests/unit/sleep.util.test.ts
    - tests/unit/observacion.decorator.test.ts
  modified:
    - src/config/constants/agent.constants.ts
    - src/config/strings.ts
    - src/llm/decorators/fallback.decorator.ts
    - src/llm/types/llm.type.ts
    - src/llm/types/resiliencia.type.ts
    - src/loop/services/despacho-llamada.service.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/loop/services/tope-iteraciones.service.ts
    - src/loop/types/agente.type.ts
    - src/loop/types/turno.type.ts
    - src/loop/wiring/agente.wiring.ts
    - tests/helpers/agente-prueba.helper.ts
    - tests/helpers/types/agente-prueba.type.ts
    - tests/helpers/eventos.helper.ts
    - tests/helpers/fetch-falso.helper.ts
    - tests/helpers/types/fetch-falso.type.ts
    - tests/helpers/historial.helper.ts
    - tests/loop/sesion.test.ts
    - tests/loop/trazador-agente.test.ts
    - tests/unit/fallback.decorator.test.ts
key-decisions:
  - "Failed attempts and the provider switch are logged through an optional OpcionesEnvio.observador (withObservacion per attempt, alCambiar now receives the send options), so llm_error and llm_fallback lines are correlated with sesionId and turnoId instead of coming from a root logger in the wiring"
  - "llm_call is logged by the loop once per successful model call (duration includes retries); llm_error is logged once per failed attempt by withObservacion between withTimeout and withRetry"
  - "A caller abort ends with motivo abortado, no error event and no text event; the saved assistant text is MENSAJE_AGENTE.TURNO_INTERRUMPIDO and the gate closes LIBRE. The deadline gives an error event TIEMPO_TURNO_AGOTADO and the normal gate closing"
  - "gate lines carry caso only when it names a package the server armed (paquetesConocidos); any other model-written caso logs as null"
  - "CODIGO_AGENTE.TOPE_ITERACIONES and its MENSAJE_AGENTE entry were removed: since 02-07 the cap closes through MOTIVO_FIN.TOPE_ITERACIONES with a summary, never an error code"
  - "crearAgente tests pass LOG_LEVEL silent; production defaults to info on stdout"
requirements-completed: [AGT-04, AGT-05, LLM-03, SEG-03]
coverage:
  - id: D1
    description: "CA5 for provider failures through the real decorators: 503 after 1 + LLM_MAX_RETRIES requests, 402 with one request (with and without fallback) and 'Saldo agotado', per-call timeout, each followed by a working turn with an intact replayed history"
    requirement: LLM-03
    verification:
      - kind: integration
        ref: "tests/loop/resiliencia.test.ts#los fallos del proveedor nunca matan la sesión (CA5, LLM-03, AGT-05)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Fallback composed in crearAgente: 4th request to deepseek-v4-pro on the same URL and key, usage reports the fallback model and counts in totalSesion; a fallback on another host without its own key is never called, with its own key it gets only that key"
    requirement: LLM-04
    verification:
      - kind: integration
        ref: "tests/loop/fallback.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Turn deadline, caller abort mid-step, abandoned generator and fin limite truncation never corrupt the session; each is followed by a turn that passes historialIntegro"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/resiliencia.test.ts#las interrupciones nunca corrompen la sesión (AGT-04, CA5)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Correlated JSON log lines with the full event set, no key tail, no message text and no sensitive maestro value; one llm_error per failed attempt and one llm_fallback; tool_start arguments redacted"
    requirement: SEG-03
    verification:
      - kind: integration
        ref: "tests/loop/bitacora.test.ts"
        status: pass
      - kind: unit
        ref: "tests/unit/observacion.decorator.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "sleepWithSignal resolves after the delay, early on abort, never rejects and removes its listener"
    verification:
      - kind: unit
        ref: "tests/unit/sleep.util.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Whole suite and static checks green; reto-01 untouched; no console.* in src/loop or src/llm"
    verification:
      - kind: command
        ref: "bun run check && bun test (933 pass, 0 fail); git status --porcelain -- reto-01 (empty); grep -rn console src/loop src/llm (empty)"
        status: pass
    human_judgment: false
duration: 13 min
completed: 2026-10-13
---

# Phase 2 Plan 08: Resilient, interruptible and observable turns Summary

**`crearAgente` now composes timeout, retry with jitter and the `deepseek-v4-pro` fallback. Each turn runs under one deadline signal. A caller abort, an abandoned generator or a truncated step leaves a valid history. Every step writes a correlated pino JSON line with ids, codes, counts and durations, and never the key or the user's text.**

## Performance

- **Duration:** 13 min (2026-10-13T20:06:03Z to 2026-10-13T20:19:34Z)
- **Tasks:** 3 (TDD, each with a RED and a GREEN commit), plus one refactor commit
- **Files:** 32 (12 created, 20 modified)

## Accomplishments

- **Provider failures (CA5, LLM-03, LLM-04).** Each slot is built as `withRetry(withObservacion(withTimeout(adapter, LLM_TIMEOUT_MS)), {BACKOFF_*, esperar, Math.random})`, and the two slots are joined with `withFallback`. The fallback slot exists only when `config.fallback.apiKey` is not null (Pitfall 7). A 503 that persists makes `1 + LLM_MAX_RETRIES` requests and then shows `PROVEEDOR_NO_DISPONIBLE`. A 402 makes one request and shows "Saldo agotado…". A hanging provider ends in `PROVEEDOR_TIMEOUT`. In every case the next turn works.
- **Interruptions (AGT-04).** `AbortSignal.any([caller, AbortSignal.timeout(deadlineMs)])` is created once per turn. The loop checks it before each provider call, before each tool dispatch and around the cap summary. If the deadline fires and the caller did not abort, the turn shows `TIEMPO_TURNO_AGOTADO` and closes the gate normally. A caller abort ends with `abortado`, makes no further provider call, discards the step in progress and leaves the gate `LIBRE`. If the consumer abandons the generator, `finally` saves the user message, the complete steps and an assistant `TURNO_INTERRUMPIDO` message before releasing the lock. A step that ends with `fin limite` runs no tool. Each of its calls gets `{ok:false, codigo: ARGUMENTOS_TRUNCADOS, error}`, and the loop continues.
- **Logs (SEG-03).** The logger is `createLogger({level, destination?, secrets: [primary key, fallback key]})`, with child loggers `hijo({sesionId}) → hijo({turnoId}) → hijo({llamadaId, herramienta})`. The lines are `turn_start` (with `mensajeLargo` only), `llm_call`, `llm_error` (one per failed attempt), `llm_fallback`, `tool_exec`, `gate_blocked`/`gate_granted` (taken from `ResultadoDespacho.envioPermitido`) and `turn_end`. The `argumentos` of `tool_start` go through `redactar(args, secretos)`.

## Task Commits

1. **Task 1: Provider failures and fallback composition.** `8fad635` (test, RED) and `f52533f` (feat, GREEN)
2. **Task 2: Deadline, abort, abandonment and truncation.** `17dc11f` (test, RED) and `d8aad6c` (feat, GREEN)
3. **Task 3: Correlated JSON logs.** `3cba72a` (test, RED) and `34b0a65` (feat, GREEN)
4. **Cleanup: unused TOPE_ITERACIONES code.** `ad53107` (refactor)

## TDD Gate Compliance

- **Task 1 RED:** the target tests failed on request counts: 1 instead of 4 for the 503 case and the fallback case, and a missing 4th request for the foreign host with its own key. The timeout test hit bun's 5 s test timeout because no per-call timeout existed yet. The two 402 tests passed, because they check invariants that already held (a 402 was never retried). `sleep.util.test.ts` failed on module load because the module did not exist. Semantic assessment: valid for the behavior targets. The sleep test's RED is a load failure, the same style as plans 02-01 to 02-04.
- **Task 2 RED:** all four targets failed on their planned assertions. The deadline test failed on the bun timeout and on elapsed time. The abort test failed because the motivo was `final`. The abandonment test failed because the history was empty. The truncation test failed because the tools ran and wrote `log.jsonl` lines. Valid.
- **Task 3 RED:** the first run failed on load (`EVENTO_BITACORA` was missing). Following the 02-05 approach, I added the constant and an identity `withObservacion` stub without committing them. After that, 5 targets failed on assertions: no lines written, no attempt reported, `alCambiar` without options, and arguments not redacted. The 3 observer tests that passed (success not reported, works without an observer, keeps proveedor/modelo) are invariants an identity satisfies trivially. Only test files went into the RED commit. Valid.
- **GREEN:** `f52533f`, `d8aad6c` and `34b0a65`. All targets pass.
- **REFACTOR:** `ad53107`, which removes the dead constants. The suite stays green.
- The plan is `type: execute` with `tdd="true"` tasks, so the formal `tdd-red-evidence` classifier was not applied, the same as plans 02-01 to 02-07.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Per-attempt, correlated provider logs via an observer in OpcionesEnvio**
- **Found during:** Task 3
- **Issue:** The plan asks for one `llm_error` line per failed attempt and wires `alCambiar` in `crearAgente` to `advertir(CAMBIO_PROVEEDOR)`. The loop only sees the final result of the decorator chain, so it cannot log each attempt. A logger in the wiring has no `sesionId` or `turnoId`, which breaks the "every turn's lines carry the correlation ids" truth.
- **Fix:** `OpcionesEnvio` gains an optional `observador: ObservadorLlm` ({fallo, cambio}). The new `withObservacion` decorator, placed between `withTimeout` and `withRetry`, reports each failed attempt. `AlCambiarProveedor` now receives `(error, opciones)`. The wiring's `alCambiar` forwards to `opciones.observador?.cambio`. The loop builds the observer from the turn's child logger. The existing decorator tests still pass, and one new test covers the options pass-through.
- **Files modified:** src/llm/types/llm.type.ts, src/llm/types/resiliencia.type.ts, src/llm/decorators/fallback.decorator.ts, src/llm/decorators/observacion.decorator.ts, tests/unit/fallback.decorator.test.ts, tests/unit/observacion.decorator.test.ts
- **Commit:** 34b0a65

**2. [Rule 2 - Correctness] gate lines come from an explicit `envioPermitido` on the dispatch result**
- **Found during:** Task 3
- **Issue:** `evento` is null for a blocked send without a caso and for an authorized send the tool rejected, so it cannot tell "blocked" from "granted".
- **Fix:** `ResultadoDespacho.envioPermitido: boolean | null` is false when blocked, true when the gate let the call through, and null for non-send calls. `caso` is logged only when it names an armed package.
- **Files modified:** src/loop/types/turno.type.ts, src/loop/services/despacho-llamada.service.ts
- **Commit:** 34b0a65

**3. [Rule 3 - Blocking] Hand-built DependenciasTurno in the tracer test**
- **Found during:** Tasks 2 and 3
- **Issue:** The new required fields `deadlineMs`, `bitacora` and `secretos` broke `tests/loop/trazador-agente.test.ts` at type-check time.
- **Fix:** Added the defaults there (`DEADLINE_TURNO_MS_POR_DEFECTO`, `bitacoraMuda()`, `[CLAVE]`).
- **Commits:** d8aad6c, 34b0a65

**4. [Rule 3 - Blocking] Test helpers not listed in files_modified**
- **Found during:** Tasks 1 to 3
- **Issue:** The behaviors need a fake fetch that hangs until aborted, a wire-level history check, a fetch-backed agent with a session, a raw event stream and session access in `crearAgentePrueba`, and a log capture.
- **Fix:** `RespuestaGuion.colgar`, `historialWireIntegro`, `crearAgenteFetch`, `AgentePrueba.iniciar` and `AgentePrueba.sesionActual`, `errores`/`usos`, and `capturarLogs`/`bitacoraMuda`. Each helper type is in `tests/helpers/types/*.type.ts` (G3).
- **Commits:** 8fad635, 17dc11f, 3cba72a

**5. [Cleanup] Log-point helpers live in `src/loop/services/bitacora-turno.service.ts`**
- **Issue:** Putting the log calls inline would push `ejecutar-turno.service.ts` past readable size.
- **Fix:** `bitacoraDelTurno`, `observadorDelTurno`, `anotarLlamadaLlm` and `anotarHerramienta` live in their own service. `turn_start`, `turn_end` and the abandoned `turn_end` stay in the turn service.
- **Commit:** 34b0a65

**6. [Cleanup] Existing crearAgente tests run with LOG_LEVEL silent**
- **Issue:** With the logger wired, `sesion.test.ts` and the tracer's `crearAgente` path would print pino lines to stdout during `bun test`.
- **Fix:** Both now pass `LOG_LEVEL: "silent"`. `crearAgenteFetch` defaults to silent, and `bitacora.test.ts` opts into `info`.
- **Commit:** 34b0a65

**7. [Orchestrator note] TOPE_ITERACIONES removed**
- `CODIGO_AGENTE.TOPE_ITERACIONES` and `MENSAJE_AGENTE[TOPE_ITERACIONES]` had no emitter after 02-07, so I deleted them. `MOTIVO_FIN.TOPE_ITERACIONES` stays. Commit `ad53107`.

**Total deviations:** 7 (2 correctness, 2 blocking, 2 cleanup, 1 requested cleanup). **Impact:** the plan's contract holds. Every listed artifact, export and key link is present. The grep acceptance checks give exactly one `withFallback(` in the wiring, one `AbortSignal.any(` in the turn service and no `console.*` in `src/loop` or `src/llm`.

## Requirements

- Marked complete: **AGT-04** (already checked; this plan adds the abort and abandonment truths), **AGT-05**, **LLM-03** and **SEG-03**. Plan 02-09 does not claim any of them.
- Left open: **LLM-04** and **DEMO-03**, because plan 02-09 also claims them. This plan covers the fallback composition (LLM-04) and the CA5 part of the fake-LLM loop tests (DEMO-03).

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None new. T-02-25 (logs) is mitigated: only ids, codes, counts, lengths and durations are logged, both keys are scrubbing secrets, and `bitacora.test` asserts that the key tail, the message text and the maestro values are absent. T-02-26 (session corruption) is mitigated: steps are atomic, a finally-commit runs on abandonment, and the deadline bounds wall time. T-02-27 (fallback host) is mitigated: the fallback slot is composed only with its own key, and `fallback.test` asserts no request goes to the other host.

## Notes for Later Plans

- Phase 3 SSE: a caller abort (tab closed) emits only `turn_end` with motivo `abortado`. The deadline emits an `error` event with `TIEMPO_TURNO_AGOTADO`. Each `llm_call` line carries `fin` and the tool-call count, which helps diagnose truncation (`fin: "limite"`).
- Phase 4 SOLUCION.md: Pitfall 12 still applies. Tools still write plain `console.error` lines on internal errors, and the loop's `tool_exec` keeps the structured stream complete.
- A truncated step replays its incomplete `arguments` string in history. If a live provider rejects that with a 400, the step should store the calls with `arguments: "{}"` instead.

## Next Phase Readiness

Ready for 02-09.

## Self-Check: PASSED

- FOUND: all 12 created files are on disk.
- FOUND: commits 8fad635, f52533f, 17dc11f, d8aad6c, 3cba72a, 34b0a65 and ad53107 are ancestors of HEAD (7 = `git rev-list --count 69ded23..HEAD`).
- `bun run check` exits 0. `bun test` gives 933 pass, 0 fail. `git status --porcelain -- reto-01` is empty.
