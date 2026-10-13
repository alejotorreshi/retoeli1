---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 11
subsystem: agent-loop
tags: [llm, tool-calls, history, wire, resilience, cr-03]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "pasoTruncado and ARGUMENTOS_TRUNCADOS (02-08), wire mapper and adapter (02-01), fetch-backed test helpers (02-08)"
provides:
  - "ARGUMENTOS_VACIOS ('{}') in llm.constants.ts, shared by the loop and the llm layer"
  - "pasoTruncado stores cut tool calls with ARGUMENTOS_VACIOS and keeps id and nombre"
  - "toWireToolCall sends only JSON-object arguments (private esObjetoJson guard)"
  - "cuerpoConArgumentosCrudos test helper for verbatim tool-call arguments and any finish_reason"
  - "pedidosSanos / historialesSanos also require JSON-object arguments in every request"
affects: [phase-03-http-sse, phase-04-solucion-md, AGT-04, DEMO-03]

actuals:
  tokens: 5290
  tasks: 2
  commits: 4
plan_head_before: c693850487554f0ee84b41fd9442b9774555ea48
plan_head_after: 2f5a929a0eca98051cd53f03b5d3d6ba167d8449

tech-stack:
  added: []
  patterns:
    - "Defense in depth: unusable model arguments are neutralized when stored (loop) and again at the single wire choke point (mapper)"
    - "Fetch-backed loop tests assert on the real wire bodies, not only on the neutral history"

key-files:
  created:
    - tests/unit/wire-messages.mapper.test.ts
  modified:
    - src/config/constants/llm.constants.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/llm/mappers/wire-messages.mapper.ts
    - tests/loop/resiliencia.test.ts
    - tests/helpers/fetch-falso.helper.ts
    - tests/helpers/types/fetch-falso.type.ts

key-decisions:
  - "02-11: ARGUMENTOS_VACIOS lives in llm.constants.ts (not agent.constants.ts) because the llm-layer wire mapper needs it too, and agent.constants already imports llm.constants"
  - "02-11: a step cut by finish_reason=length is stored with ARGUMENTOS_VACIOS per call; id and nombre stay so the ARGUMENTOS_TRUNCADOS results pair (CR-03 closed)"
  - "02-11: toWireToolCall forwards arguments byte for byte only when they parse to a plain JSON object; anything else (truncated, empty, array, number, null, string) goes out as ARGUMENTOS_VACIOS. The neutral history keeps the raw malformed string of an executed step; only the wire is normalized"

patterns-established:
  - "Every resiliencia test checks JSON-object tool-call arguments on every request (neutral via pedidosSanos, wire via historialesSanos)"

requirements-completed: [AGT-04, DEMO-03]

coverage:
  - id: D1
    description: "A step cut by finish_reason=length is stored with ARGUMENTOS_VACIOS per call, keeps id and nombre, runs no tool, and every later request and sesion.historial carry valid JSON arguments"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/resiliencia.test.ts#un paso cortado por limite no ejecuta herramientas, responde ARGUMENTOS_TRUNCADOS y guarda argumentos JSON válidos (CR-03)"
        status: pass
      - kind: integration
        ref: "tests/loop/resiliencia.test.ts#con el adaptador real, un finish_reason length con argumentos cortados deja JSON válido en cada pedido siguiente (CR-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The wire mapper never sends tool-call arguments that are not a JSON object; valid objects go out byte for byte"
    requirement: AGT-04
    verification:
      - kind: unit
        ref: "tests/unit/wire-messages.mapper.test.ts"
        status: pass
      - kind: integration
        ref: "tests/loop/resiliencia.test.ts#unos argumentos mal formados con finish_reason tool_calls se reenvían como ARGUMENTOS_VACIOS en cada pedido siguiente"
        status: pass
    human_judgment: false
  - id: D3
    description: "The DEMO-03 false-green truncation test is replaced by one built from a literal truncated string, with a JSON.parse positive control, and it failed on the old code"
    requirement: DEMO-03
    verification:
      - kind: unit
        ref: "node_modules/.cache/gsd-red/red1.json (gsd check tdd-red-evidence: RED_EVIDENCE_OK)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-10-13
status: complete
---

# Phase 02 Plan 11: Truncated and malformed tool-call arguments never reach the provider (CR-03) Summary

**pasoTruncado stores cut calls with `ARGUMENTOS_VACIOS` ("{}") and keeps id and nombre. `toWireToolCall` sends only JSON-object arguments. A really truncated string now proves that every later request of the session is valid, both in the neutral history and on the wire through the real adapter.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-13T21:56:53Z
- **Completed:** 2026-10-13T22:00:41Z
- **Tasks:** 2 (both TDD: RED, then GREEN)
- **Files modified:** 7 (1 created)

## Accomplishments

- **CR-03 closed (VERIFICATION gap 3).** A step cut by `finish_reason=length` no longer leaves invalid JSON in `sesion.historial`. Each cut call keeps its `id` and `nombre`, so the `ARGUMENTOS_TRUNCADOS` tool results still pair, and its arguments become `ARGUMENTOS_VACIOS`. Neither the cut string nor a backend 400 (`PETICION_INVALIDA`) can lock the session any more.
- **The wire mapper is a single choke point.** `toWireToolCall` checks every request with a private `esObjetoJson` (`JSON.parse` in try/catch; non-null, non-array object). It also covers malformed model arguments on steps that ran: the tool answered `ARGS_INVALIDOS`, and the call is replayed as `{}`.
- **DEMO-03 false green removed.** The truncation test uses the literal `'{"caso":"co-industrias-delta","mapeo":[{"etiq'` with a positive control (`JSON.parse` throws). It checks every later neutral request and `sesionActual().historial`. A fetch-backed twin checks the real wire bodies.
- **Every resiliencia test is stricter.** `pedidosSanos` and `historialesSanos` now also assert JSON-object arguments on every recorded request.

## Task Commits

1. **Task 1 (tracer): a truncated step is stored with valid JSON arguments (CR-03)**
   - RED `87ad81e`: `test(02-11): add failing CR-03 tests for truncated tool-call arguments`
   - GREEN `319794e`: `fix(02-11): store truncated tool calls with valid JSON arguments (CR-03)`
2. **Task 2: the wire mapper never sends non-object arguments**
   - RED `281470e`: `test(02-11): add failing tests for the wire mapper argument guard`
   - GREEN `2f5a929`: `fix(02-11): send only JSON-object tool-call arguments on the wire`

## TDD Evidence

- **RED, Task 1.** Target: "un paso cortado por limite no ejecuta herramientas, responde ARGUMENTOS_TRUNCADOS y guarda argumentos JSON válidos (CR-03)". JUnit report: 9 tests, 7 pass, 2 fail (the target and its fetch-backed twin). `gsd check tdd-red-evidence` returned `RED_EVIDENCE_OK` (target_test_failed). Semantic assessment: the target ran and failed on the planned `toEqual(vacias)` assertion, because the stored calls still held the truncated string verbatim. There was no load, syntax or fixture fault.
- **GREEN, Task 1.** The verify set (resiliencia, sesion, compuerta, tope, architecture) passed 89 of 89, and `bun run check` exited 0.
- **Tracer gate.** The run was interactive in `end-of-phase` mode and the verify step was automated only. It was re-run end to end and passed before Task 2 started.
- **RED, Task 2.** Target: "unos argumentos truncados salen como ARGUMENTOS_VACIOS con el mismo id y nombre". JUnit report: 9 tests, 2 pass, 7 fail. The byte-for-byte case and the unchanged-messages case passed, which shows the missing guard is the only cause. The classifier returned `RED_EVIDENCE_OK`. The fetch-backed malformed-arguments loop test also failed before GREEN.
- **GREEN, Task 2.** The verify set passed 124 of 124, `bun run check` exited 0, and the full `bun test` gave 1021 pass, 0 fail and 1 skip. The skip is the pre-existing opt-in live test `describe.skipIf(LLM_EN_VIVO !== "1")`.
- RED records are kept outside git in `node_modules/.cache/gsd-red/red{1,2}.json` along with their JUnit XML.

## Files Created/Modified

- `src/config/constants/llm.constants.ts`: adds `ARGUMENTOS_VACIOS = "{}"`.
- `src/loop/services/ejecutar-turno.service.ts`: `pasoTruncado` maps each call to `{...llamada, argumentos: ARGUMENTOS_VACIOS}` and stores the assistant message with those calls.
- `src/llm/mappers/wire-messages.mapper.ts`: private `esObjetoJson`, and `toWireToolCall` falls back to `ARGUMENTOS_VACIOS`.
- `tests/unit/wire-messages.mapper.test.ts` (new, the mapper's mirror): covers the valid, truncated, empty, array, number, null and string cases, unchanged system/user/tool messages, and reasoning_content passback.
- `tests/loop/resiliencia.test.ts`: the truncation test is rewritten, two fetch-backed tests are added (length, and malformed `tool_calls`), and the stricter `pedidosSanos` and `historialesSanos` helpers are in place.
- `tests/helpers/fetch-falso.helper.ts`: `cuerpoConArgumentosCrudos(finishReason, ...llamadas)`. `cuerpoConHerramientas` now delegates to it, with the same envelope and usage as before.
- `tests/helpers/types/fetch-falso.type.ts`: `MensajeWire.tool_calls[]` gains an optional `function: {name, arguments}`.

## Decisions Made

- `ARGUMENTOS_VACIOS` goes in `llm.constants.ts` because both layers need it. The review had suggested `agent.constants.ts`.
- Neutral-history policy: for a step that ran with malformed model arguments, the raw string stays in `sesion.historial` because it is what the tool received. Only the wire normalizes it. Truncated steps are normalized at storage time as well.

## Deviations from Plan

**1. [Process] `ARGUMENTOS_VACIOS` went into the RED commit**
- **Found during:** Task 1 RED.
- **Issue:** if the tests imported a constant that did not exist yet, Bun would fail at module link time. That gives an INVALID_RED (load failure) instead of an assertion failure.
- **Fix:** the constant (data only, no behavior) was added in the RED commit `87ad81e`. The behavior change itself, `pasoTruncado`, landed in GREEN `319794e`.
- **Verification:** the classifier returned RED_EVIDENCE_OK on an assertion failure.

**2. [Process] The GREEN commits use the `fix(02-11)` type**
- The plan prescribes `fix(02-11)` because this is a gap closure. The generic TDD gate grep looks for `feat(...)`. Each GREEN commit directly follows its own `test(02-11)` RED commit, so the RED-then-GREEN order holds.

**Total deviations:** 2 process notes and 0 code auto-fixes. **Impact:** none on scope or behavior.

## TDD Gate Compliance

- RED: `87ad81e`, `281470e` (`test(02-11)`). Both returned RED_EVIDENCE_OK.
- GREEN: `319794e`, `2f5a929` (`fix(02-11)`, as the plan prescribes; there is no `feat` commit because this is a fix).
- REFACTOR: none was needed.

## Issues Encountered

- The first version of the mapper unit test typed its expected tool call as `unknown`, and `tsc` rejected it against `WireMessage`. It was retyped as `WireToolCall` before the RED commit.

## Threat Surface

- T-02-34 (DoS through a non-retryable 400) is mitigated by both guards and asserted with `JSON.parse` on every neutral and wire request.
- T-02-35 (replay of partial model output) is mitigated: cut and malformed strings are no longer echoed to the provider.
- No new endpoints, auth paths or file access.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- CR-03 is closed, which re-closes AGT-04 and DEMO-03 for this gap. Plans 02-12, 02-13 and 02-14 remain in this phase.
- Live DeepSeek behavior with invalid `arguments` is still unverified. It no longer matters, because invalid arguments never reach the provider.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-13*
