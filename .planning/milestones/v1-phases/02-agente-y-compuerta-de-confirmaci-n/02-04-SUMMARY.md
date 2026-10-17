---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 04
subsystem: llm
tags: [llm, resilience, retry, timeout, fallback, error-taxonomy, deepseek, openai-compatible]

requires:
  - phase: 02-01
    provides: AdaptadorLlm port, OpenAI-compatible adapter, provider-error and wire-messages mappers, llm constants
provides:
  - Retry-After-aware errorFromStatus and errorFromFinishReason (content_filter, insufficient_system_resource, error)
  - Usage estimation from characters when the provider omits usage
  - withTimeout, withRetry (full-jitter backoff) and withFallback decorators over the neutral port
  - OpcionesReintento and AlCambiarProveedor types
  - Spike-captured DeepSeek fixtures (tool_calls and text bodies)
affects: [02-08 crearAgente composition, 02-09 provider switching, phase 03 SSE error events]

actuals:
  tokens: 11546
  tasks: 2
  commits: 4
plan_head_before: edd6881d7a6cdeb9282b343ec4536be222d9e1da
plan_head_after: 03d7235dea9651d9d80fb1df2c3b0e99fd3240fc

tech-stack:
  added: []
  patterns:
    - "Resilience as pure result-transforming decorators over AdaptadorLlm; sleep and randomness injected"
    - "Provider errors classified by status, header and finish_reason only; non-2xx bodies cancelled unread"

key-files:
  created:
    - src/llm/types/resiliencia.type.ts
    - src/llm/decorators/timeout.decorator.ts
    - src/llm/decorators/retry.decorator.ts
    - src/llm/decorators/fallback.decorator.ts
    - tests/fixtures/llm/completion-tool-calls.json
    - tests/fixtures/llm/completion-texto.json
    - tests/helpers/adaptador-guion.helper.ts
    - tests/helpers/types/adaptador-guion.type.ts
    - tests/unit/openai-compatible.adapter.test.ts
    - tests/unit/provider-error.mapper.test.ts
    - tests/unit/timeout.decorator.test.ts
    - tests/unit/retry.decorator.test.ts
    - tests/unit/fallback.decorator.test.ts
  modified:
    - src/config/constants/llm.constants.ts
    - src/config/constants/patterns.constants.ts
    - src/llm/mappers/provider-error.mapper.ts
    - src/llm/mappers/wire-messages.mapper.ts
    - src/llm/adapters/openai-compatible.adapter.ts

key-decisions:
  - "Retry-After is honored only as a non-negative integer of seconds (PATRON_ENTERO_NO_NEGATIVO), capped at BACKOFF_TOPE_MS, for any status; HTTP dates, decimals and empty values give null and the backoff formula applies"
  - "TIPO_ERROR_POR_FIN is a ReadonlyMap keyed by finish_reason so unknown provider reasons fall through to a normal response"
  - "fromChatCompletion receives the serialized request length so missing usage is estimated as ceil(chars / CARACTERES_POR_TOKEN) for input and content plus tool arguments for output"
  - "withRetry treats a rejected esperar or an aborted caller signal as abortado and never throws; withFallback also skips the fallback when the caller signal is already aborted"

patterns-established:
  - "Decorator pattern: withX(base, ...) returns an AdaptadorLlm that keeps base proveedor/modelo; the respuesta reports which slot answered"
  - "Scripted base adapter test helper (crearAdaptadorGuion) for deterministic decorator tests without real sleeps"

requirements-completed: []

coverage:
  - id: D1
    description: "Every provider failure becomes a typed, key-free ErrorLlm (status, Retry-After, finish_reason, transport, invalid 200), and the F1/F2 401 bodies never leak the key tail"
    requirement: LLM-03
    verification:
      - kind: unit
        ref: "tests/unit/provider-error.mapper.test.ts"
        status: pass
      - kind: unit
        ref: "tests/unit/openai-compatible.adapter.test.ts#F1: un 401 JSON que repite la cola de la clave no la filtra"
        status: pass
      - kind: unit
        ref: "tests/unit/openai-compatible.adapter.test.ts#F2: un 401 de texto plano sin content-type es autenticacion"
        status: pass
    human_judgment: false
  - id: D2
    description: "Spike bodies parse (texto null, tool call, usage, cacheHit fallback, keep-alive prefix) and missing usage is estimated from characters"
    requirement: LLM-03
    verification:
      - kind: unit
        ref: "tests/unit/openai-compatible.adapter.test.ts#cuerpos capturados en el spike"
        status: pass
      - kind: unit
        ref: "tests/unit/openai-compatible.adapter.test.ts#sin usage se estima el uso por caracteres para que el presupuesto muerda"
        status: pass
    human_judgment: false
  - id: D3
    description: "Capability flags shape the request body (max_completion_tokens, null temperature/thinking, tool_choice none vs omitted tools, reasoning passback) and the adapter source never names a provider"
    requirement: LLM-02
    verification:
      - kind: unit
        ref: "tests/unit/openai-compatible.adapter.test.ts#el cuerpo sigue las capacidades del slot"
        status: pass
    human_judgment: false
  - id: D4
    description: "withTimeout, withRetry and withFallback implement LLM-03/LLM-04/D-52, including the composed primary-then-fallback case and the never-fall-back kinds"
    requirement: LLM-04
    verification:
      - kind: unit
        ref: "tests/unit/timeout.decorator.test.ts"
        status: pass
      - kind: unit
        ref: "tests/unit/retry.decorator.test.ts"
        status: pass
      - kind: unit
        ref: "tests/unit/fallback.decorator.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every TIPO_ERROR_LLM resolves to a non-empty Spanish MENSAJE_AGENTE, and saldo reads 'Saldo agotado'"
    requirement: AGT-05
    verification:
      - kind: unit
        ref: "tests/unit/provider-error.mapper.test.ts#catálogo en español"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-13
status: complete
---

# Phase 02 Plan 04: Resilient provider adapter and decorators Summary

**Status-, header- and finish-reason-based error taxonomy that never reads a provider error body, character-based usage estimation, and injected-clock withTimeout/withRetry/withFallback decorators over the AdaptadorLlm port.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-13T19:30:29Z
- **Completed:** 2026-10-13T19:35:05Z
- **Tasks:** 2
- **Files modified:** 18 (13 created, 5 modified)

## Accomplishments

- `errorFromStatus(status, retryAfter)` maps 400/404/422 to peticion_invalida, 401/403 to autenticacion, 402 to saldo, 429 to limite_tasa and 5xx to servidor. An integer `Retry-After` becomes `reintentarTrasMs`, capped at `BACKOFF_TOPE_MS`.
- `errorFromFinishReason` maps content_filter to filtro_contenido (not retryable) and insufficient_system_resource and error to servidor (retryable). `fromChatCompletion` checks it before building a response, and length with tool_calls still yields fin limite with the calls kept.
- The adapter still cancels every non-2xx body unread and passes only the `Retry-After` header to the mapper. The F1 (JSON 401 echoing `****Zq9X`) and F2 (plain-text 401) tests show the key tail never reaches the result.
- When the provider omits usage, the token counts are estimated from the serialized request and from response content plus tool arguments, so the budget still applies (Pitfall 11).
- `withTimeout` combines the caller signal with `AbortSignal.timeout(ms)`. It rewrites the result to a retryable timeout only when the deadline fired and the caller did not abort.
- `withRetry` uses full-jitter backoff `min(tope, reintentarTrasMs ?? azar() * min(tope, base * 2^n))` and retries only retryable kinds. It stops on caller abort or a rejected `esperar`, and it never throws.
- `withFallback` switches to the fallback slot once, and only after a retryable primary error. It never switches for saldo, autenticacion, peticion_invalida or filtro_contenido, or when the caller signal is already aborted.

## Task Commits

1. **Task 1: Typed key-free provider errors and capability-shaped bodies**
   - `eead48e` test(02-04): add failing tests for the provider error taxonomy and capability-shaped bodies
   - `023dbe5` feat(02-04): map every provider outcome to a typed key-free error and estimate missing usage
2. **Task 2: Timeout, retry and fallback decorators**
   - `d752b15` test(02-04): add failing tests for the timeout, retry and fallback decorators
   - `03d7235` feat(02-04): absorb timeouts, transient errors and a falling primary with composable decorators

## TDD Gate Compliance

- RED: both tasks committed the tests first (`eead48e`, `d752b15`). The RED runs failed because the new symbols did not exist yet: `CARACTERES_POR_TOKEN`/`BACKOFF_TOPE_MS` exports and the `@/llm/decorators/*` modules. This is a module-load failure rather than a per-assertion failure. It is the same RED style used in plans 02-01 to 02-03. The plan is `type: execute` with `tdd="true"` tasks, not a `type: tdd` plan, so the formal classifier gate was not applied.
- GREEN: `023dbe5` and `03d7235`. Every targeted test passes.
- REFACTOR: none needed.

## Files Created/Modified

- `src/config/constants/llm.constants.ts`: adds `TIPO_ERROR_POR_FIN`, `MS_POR_SEGUNDO`, `CARACTERES_POR_TOKEN`, `BACKOFF_BASE_MS` and `BACKOFF_TOPE_MS`.
- `src/config/constants/patterns.constants.ts`: adds `PATRON_ENTERO_NO_NEGATIVO` for parsing Retry-After.
- `src/llm/mappers/provider-error.mapper.ts`: Retry-After-aware `errorFromStatus` and the new `errorFromFinishReason`.
- `src/llm/mappers/wire-messages.mapper.ts`: finish_reason routing and usage estimation.
- `src/llm/adapters/openai-compatible.adapter.ts`: serializes the body once, passes `Retry-After` to the mapper and passes the request length for estimation.
- `src/llm/types/resiliencia.type.ts`: `OpcionesReintento` and `AlCambiarProveedor`.
- `src/llm/decorators/{timeout,retry,fallback}.decorator.ts`: the three decorators.
- `tests/fixtures/llm/completion-{tool-calls,texto}.json`: spike bodies, with the id and fingerprint redacted.
- `tests/helpers/adaptador-guion.helper.ts` and `tests/helpers/types/adaptador-guion.type.ts`: a scripted base adapter.
- `tests/unit/*.test.ts`: five unit files.

## Decisions Made

- Retry-After is accepted only as a non-negative integer of seconds and capped at `BACKOFF_TOPE_MS`. An HTTP date gives null and the backoff formula is used instead (RESEARCH A4).
- The finish-reason taxonomy is a `ReadonlyMap`, so an unknown provider finish_reason is not treated as an error.
- The estimated usage keeps `cacheHit` at 0.
- The decorators hold no module state. `withFallback` also checks the caller signal before switching, which covers the "already aborted never calls the fallback" truth even when a scripted primary returns a retryable error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `PATRON_ENTERO_NO_NEGATIVO` to patterns.constants.ts**
- **Found during:** Task 1
- **Issue:** Guardian G11 requires regexes to live in `patterns.constants.ts`, and the integer check for Retry-After needs one.
- **Fix:** Added the pattern there and imported it into the mapper.
- **Files modified:** src/config/constants/patterns.constants.ts
- **Committed in:** 023dbe5

**2. [Rule 3 - Blocking] Added a shared scripted-adapter test helper**
- **Found during:** Task 2
- **Issue:** All three decorator test files need the same scripted `AdaptadorLlm`. Rule G3 requires exported helper types to live in `tests/helpers/types/*.type.ts`.
- **Fix:** Created `tests/helpers/adaptador-guion.helper.ts` and its type file. These were not listed in `files_modified`.
- **Files modified:** tests/helpers/adaptador-guion.helper.ts, tests/helpers/types/adaptador-guion.type.ts
- **Committed in:** d752b15

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both follow project conventions. No change in scope.

## Requirements

`requirements-completed` is empty on purpose. Every ID in this plan is also claimed by a later plan in the phase, so they all stay open:
- LLM-03, LLM-04 and AGT-05 are also in 02-08 (the composition inside `crearAgente`, the end-to-end CA5 message and the error events).
- LLM-02 and LLM-04 are also in 02-09 (provider switching).

This plan delivers the adapter-level and decorator-level part of each.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Verification

- `bun run check` (tsc, Biome, audit) exits 0.
- `bun test`: 838 pass, 0 fail, across 51 files. That includes the five new unit files, `tests/loop/trazador-agente.test.ts`, `tests/architecture.test.ts` and `tests/sin-comentarios.test.ts`.
- `grep -in deepseek src/llm/adapters/openai-compatible.adapter.ts src/llm/mappers/*.ts` prints nothing.
- `grep -n "\.text()\|\.json()" src/llm/adapters/openai-compatible.adapter.ts` finds exactly one occurrence, on the 2xx path.
- `grep -rn "setTimeout\|Bun.sleep" src/llm/decorators` prints nothing.

## Next Phase Readiness

- Plan 02-08 can compose `withFallback(withRetry(withTimeout(primario, LLM_TIMEOUT_MS), opts), respaldo && withRetry(withTimeout(respaldo, ...), opts), alCambiar)`. It needs a real `esperar` that resolves early on signal abort, and `azar = Math.random`.
- 402, 429, 500 and 503 were tested with a fake fetch from the documented codes, not observed live (RESEARCH A4).

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-13*

## Self-Check: PASSED
