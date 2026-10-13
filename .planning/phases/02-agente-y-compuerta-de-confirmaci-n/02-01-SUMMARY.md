---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 01
subsystem: agent
tags: [llm, agent-loop, deepseek, openai-compatible, zod, env, architecture-guardians]

requires:
  - phase: 01-n-cleo-determinista
    provides: "The five never-throwing tools in src/tools/proveedor.ts, the audit log, rules loader, fs utils and the layer guardians G1-G14"
provides:
  - "Neutral LLM port AdaptadorLlm (enviar(mensajes, herramientas, opciones) -> ResultadoEnvio, never throws)"
  - "Generic OpenAI-compatible adapter driven by capability flags (createOpenAICompatibleAdapter)"
  - "Tool registry proveedor_<export> with zod -> JSON Schema (io input, strict) and never-throwing dispatch"
  - "ejecutarTurno: the agent turn as an async generator of typed events (turn_start, usage, tool_start, tool_end, text, error, turn_end)"
  - "Per-turn instructions loader for agent/prompt.md and src/knowledge/registro-proveedor.md"
  - "Full application ports for sessions, instructions and structured logging (puertos-agente.type.ts)"
  - "parseAgentEnv/readAgentEnv: both D-59 provider slots and every cap from env, plus .env.example"
  - "llm, loop and wiring-agente layers declared and guarded, documented in CLAUDE.md and docs/estructura.md"
affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07, 02-08, 02-09, phase-03-api-sse]

actuals:
  tokens: 28940
  tasks: 2
  commits: 3
plan_head_before: ca85aadd10f4fb645e923427d9b1c4a96f916dc5
plan_head_after: adceb345819c553c21012b377b02969a561fa156

tech-stack:
  added: []
  patterns:
    - "Port returns a result union (ResultadoEnvio) and never throws; provider errors map by HTTP status only, the body is cancelled unread"
    - "Provider differences are capability flags in ProviderSlot, never provider-name branches"
    - "Agent turn = async generator; a step (assistant tool_calls + one tool message per id) enters the turn buffer only when complete; every exit saves user + steps + an assistant message without tool calls"
    - "Tool parameters = z.toJSONSchema(z.object(args).strict(), {target: draft-07, io: input}) minus $schema"
    - "Env slots resolved in one zod transform; keys inherited only by identical base URL"

key-files:
  created:
    - src/llm/types/llm.type.ts
    - src/llm/types/provider.type.ts
    - src/llm/schemas/chat-completion.schema.ts
    - src/llm/mappers/wire-messages.mapper.ts
    - src/llm/mappers/provider-error.mapper.ts
    - src/llm/adapters/openai-compatible.adapter.ts
    - src/loop/types/evento.type.ts
    - src/loop/types/turno.type.ts
    - src/loop/schemas/resultado-herramienta.schema.ts
    - src/loop/services/registro-herramientas.service.ts
    - src/loop/services/ejecutar-turno.service.ts
    - src/application/types/puertos-agente.type.ts
    - src/infra/knowledge/instructions-loader.adapter.ts
    - src/config/constants/llm.constants.ts
    - src/config/constants/agent.constants.ts
    - src/config/constants/logging.constants.ts
    - agent/prompt.md
    - src/knowledge/registro-proveedor.md
    - .env.example
    - tests/loop/trazador-agente.test.ts
    - tests/contract/env-agente.test.ts
  modified:
    - src/config/env.ts
    - src/config/strings.ts
    - src/config/constants/files.constants.ts
    - src/config/constants/patterns.constants.ts
    - tests/architecture.test.ts
    - .claude/CLAUDE.md
    - docs/estructura.md

key-decisions:
  - "The adapter returns ABORTADO before calling fetch when the caller's signal is already aborted, so the no-throw contract holds even with fakes that ignore the signal"
  - "fromChatCompletion classifies a response that carries tool_calls as FIN_LLM.HERRAMIENTAS even if finish_reason is not tool_calls (length still wins as LIMITE); missing usage counts as zero until plan 02-04 adds estimation"
  - "A fallback slot on the DeepSeek base URL may also use the DEEPSEEK_API_KEY alias; any other inheritance requires an identical base URL"
  - "NIVELES_LOG is an as-const object (not a tuple) and, like BOOLEANO_ENV, is registered in FAMILIAS_DE_CODIGOS"
  - "argumentosDeLlamada lives in the registry service and is reused by the turn for tool_start.argumentos"

patterns-established:
  - "llm layer imports only llm, pure config and zod; loop imports loop, llm, domain, application, tool types, pure config and zod"
  - "loop/wiring/agente.wiring.ts is the second composition root (the only loop file allowed to import infra, env.ts and tools/proveedor.ts)"
  - "pino is importable only from infra"

requirements-completed: [LLM-01, LLM-02, LLM-04, AGT-01, AGT-02]

coverage:
  - id: D1
    description: "One chat message runs through ejecutarTurno, the real OpenAI-compatible adapter over a fake fetch and the real proveedor_leer_solicitud, yielding typed events in order"
    requirement: AGT-01
    verification:
      - kind: integration
        ref: "tests/loop/trazador-agente.test.ts#procesa el caso co-industrias-delta de punta a punta y un segundo turno reproduce el historial"
        status: pass
    human_judgment: false
  - id: D2
    description: "Request body carries deepseek-flash, thinking disabled, temperature 0, max_tokens 2048, stream false, tool_choice auto, the five proveedor_ tools with io-input schemas, and Bearer auth"
    requirement: LLM-02
    verification:
      - kind: integration
        ref: "tests/loop/trazador-agente.test.ts#procesa el caso co-industrias-delta de punta a punta y un segundo turno reproduce el historial"
        status: pass
    human_judgment: false
  - id: D3
    description: "A 503 becomes a catalog error event without leaking the key tail, and the session keeps working"
    requirement: LLM-01
    verification:
      - kind: integration
        ref: "tests/loop/trazador-agente.test.ts#un 503 del proveedor es un evento del catálogo, no filtra la clave y la sesión sigue viva"
        status: pass
    human_judgment: false
  - id: D4
    description: "Adapter never throws on an aborted signal and keeps no per-call state across concurrent calls"
    requirement: LLM-02
    verification:
      - kind: unit
        ref: "tests/loop/trazador-agente.test.ts#el adaptador no lanza con una señal ya abortada y atiende llamadas concurrentes sin estado compartido"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both D-59 provider slots, capability flags and every cap resolve from env only, with Spanish errors that never echo a key"
    requirement: LLM-04
    verification:
      - kind: unit
        ref: "tests/contract/env-agente.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "New layers, role folders, code families and pino-in-infra are guarded with violation tests"
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts"
        status: pass
    human_judgment: false
  - id: D7
    description: "First drafts of agent/prompt.md (behavior) and src/knowledge/registro-proveedor.md (process), read on every turn"
    requirement: AGT-02
    verification:
      - kind: integration
        ref: "tests/loop/trazador-agente.test.ts#procesa el caso co-industrias-delta de punta a punta y un segundo turno reproduce el historial"
        status: pass
    human_judgment: true
    rationale: "The read path is tested; the wording of the prompt and process knowledge is a first draft whose quality only a human (and the plan 02-09 content contract and live smoke test) can judge"

duration: 12min
completed: 2026-10-13
status: complete
---

# Phase 2 Plan 01: Agent tracer and env contract Summary

**A chat turn now flows through a hand-written async-generator loop, a generic OpenAI-compatible fetch adapter (DeepSeek as a capability preset) and the real Phase 1 tools, returning typed events, while both provider slots and every cost cap are chosen from env only.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-13T19:00:03Z
- **Completed:** 2026-10-13T19:11:37Z
- **Tasks:** 2
- **Files modified:** 28 (21 created, 7 modified)

## Accomplishments

- `ejecutarTurno` yields `turn_start, usage, tool_start, tool_end, usage, text, turn_end` for "procesa el caso co-industrias-delta", over the real adapter and the real `proveedor_leer_solicitud`. The tool writes its CA4 line in `out/log.jsonl` with the turn's `sesionId`.
- The history stays valid across turns: a second turn replays system, user, assistant(tool_calls), tool, assistant(text), user. A provider 503 becomes a `PROVEEDOR_NO_DISPONIBLE` event plus `turn_end` with motivo error, leaks no key tail, and the next turn succeeds.
- The adapter builds the body from capability flags only, posts to `<baseUrl>/chat/completions`, cancels non-2xx bodies unread, maps errors by status, tolerates keep-alive whitespace and never throws.
- `parseAgentEnv` resolves the primary and fallback slots (preset, alias scoped to the DeepSeek URL, https except loopback, key inheritance only on an identical base URL) and all eight caps, with Spanish zod messages.
- The guardians declare `llm`, `loop` and `wiring-agente`, the new role folders and eleven new code families, and allow pino only in infra. Each new rule has a violation test. CLAUDE.md and docs/estructura.md describe the same rules.

## Task Commits

1. **Task 1: Tracer from chat message to typed events** - `793914c` (feat)
2. **Task 2: Agent env slots and caps (TDD)**
   - RED: `dbce33c` (test)
   - GREEN: `adceb34` (feat)

No REFACTOR commit was needed.

## Files Created/Modified

- `src/llm/types/llm.type.ts`: the neutral port (Mensaje, RespuestaLlm, ErrorLlm, ResultadoEnvio, AdaptadorLlm).
- `src/llm/types/provider.type.ts`: ProviderSlot, ProviderCapabilities, FetchLike and the wire types.
- `src/llm/adapters/openai-compatible.adapter.ts`: the generic fetch adapter.
- `src/llm/mappers/wire-messages.mapper.ts` and `provider-error.mapper.ts`: neutral/wire mapping and status-to-error mapping.
- `src/llm/schemas/chat-completion.schema.ts`: lenient 200-response schema.
- `src/loop/services/registro-herramientas.service.ts`: tool registry and dispatch.
- `src/loop/services/ejecutar-turno.service.ts`: the turn generator and `sesionVacia`.
- `src/loop/types/{evento,turno}.type.ts` and `src/loop/schemas/resultado-herramienta.schema.ts`.
- `src/application/types/puertos-agente.type.ts`: instructions, session store and structured-log ports.
- `src/infra/knowledge/instructions-loader.adapter.ts`: per-turn reader of the two instruction files.
- `src/config/env.ts`: `agentEnvSchema`, `parseAgentEnv`, `readAgentEnv`, `AgentEnv`, `ProviderSettings`, `EnvSource`.
- `src/config/constants/{llm,agent,logging}.constants.ts`, `files.constants.ts`, `patterns.constants.ts` and `src/config/strings.ts` (MENSAJE_AGENTE, TEXTO_ENV additions, TEXTO_CONTEXTO, TEXTO_SESION).
- `agent/prompt.md`, `src/knowledge/registro-proveedor.md`: first drafts.
- `.env.example`: 31 variable names, no values.
- `tests/loop/trazador-agente.test.ts`, `tests/contract/env-agente.test.ts`, `tests/architecture.test.ts`.

## Decisions Made

See `key-decisions` in the frontmatter. The two that change behavior are the early ABORTADO return in the adapter and the tool_calls-presence rule in `fromChatCompletion`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Centralized values the plan left implicit**
- **Found during:** Tasks 1 and 2
- **Issue:** CLAUDE.md forbids scattered magic values, and the plan's code needed several that it did not list.
- **Fix:** Added `TIPO_HERRAMIENTA_WIRE`, `ESQUEMA_PARAMETROS` (draft-07, io input), `PROTOCOLO_SEGURO`, `PROTOCOLO_LOOPBACK`, `TEMPERATURA_MAXIMA`, `BOOLEANO_ENV`, `CAPACIDADES_GENERICAS` and `MAX_ITERACIONES_TOPE`. Registered `NIVELES_LOG` and `BOOLEANO_ENV` in `FAMILIAS_DE_CODIGOS`.
- **Files modified:** src/config/constants/llm.constants.ts, agent.constants.ts, logging.constants.ts, tests/architecture.test.ts
- **Commits:** 793914c, adceb34

**2. [Rule 2 - Missing critical] Abort check before fetch**
- **Found during:** Task 1
- **Issue:** The "already-aborted signal resolves to abortado" truth depended on fetch honoring the signal. Injected fakes do not.
- **Fix:** `send` returns `errorFromException(true)` before calling fetch when `opciones.signal.aborted`.
- **Files modified:** src/llm/adapters/openai-compatible.adapter.ts
- **Commit:** 793914c

**3. [Rule 1 - Bug prevention] Tool calls without finish_reason tool_calls**
- **Found during:** Task 1
- **Issue:** Some providers return tool_calls with finish_reason "stop". Classifying those as TEXTO would mislabel the step.
- **Fix:** `finDe` returns HERRAMIENTAS when tool_calls are present, unless finish_reason is length (LIMITE). The loop already branches on the presence of `llamadas`.
- **Files modified:** src/llm/mappers/wire-messages.mapper.ts
- **Commit:** 793914c

### Scope notes (no code impact)

- Scenarios 1 and 2 of the tracer run in one test, because scenario 2 reuses scenario 1's session.
- A fallback slot on the DeepSeek base URL can also use the `DEEPSEEK_API_KEY` alias. This is consistent with the alias rule and never sends a key to another host.
- The commits went to `main`. `gsd-tools git.base-branch` reports `main` as protected, but the orchestrator ran this executor sequentially on the main working tree with no remote, and every earlier phase commit is on `main`.

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug prevention). **Impact:** None on scope. Each fix tightens a contract the plan already stated.

## Issues Encountered

None.

## Known Stubs

None that block this plan's goal. These limits are intentional and owned by later plans:
- `turn_end.needsConfirmation` is always false, and `confirmation_required` is never emitted. The gate arrives in plan 02-06.
- `AlmacenSesiones.ocupar/liberar` are declared, but the loop does not lock yet (plan 02-02). The tracer uses an inline Map store.
- Reaching the iteration cap emits `TOPE_ITERACIONES` without the summary call (plan 02-07).
- Missing `usage` counts as zero tokens until plan 02-04 adds estimation.

## Threat Flags

None beyond the plan's threat model. The new outbound HTTP surface is T-02-01/T-02-02, covered by the tracer's key-leak assertions.

## User Setup Required

None. `.env.example` lists the variable names. Values are a Phase 3/4 deployment concern.

## Next Phase Readiness

Ready for 02-02 (session store, agent wiring and date message). Every later plan can read `AgentEnv` fields, extend `DependenciasTurno` and implement the ports in `puertos-agente.type.ts` without editing this plan's contracts.

## Verification

- `bun run check` (tsc, Biome, bun audit): pass.
- `bun test`: 615 pass, 0 fail (Phase 1 baseline of 573 plus 42 new).
- `git status --porcelain -- reto-01`: empty.
- Task 1 acceptance: `"wiring-agente"` appears twice in tests/architecture.test.ts. There are no env reads and no instruction file names in src/llm or src/loop. CLAUDE.md names `loop/wiring/agente.wiring.ts` and the decorator and mapper suffixes, and docs/estructura.md has "Capas del agente".
- Task 2 acceptance: `process.env` appears only in readToolEnv, pinExecutionDate and readAgentEnv. `.env.example` has 31 lines, all in the `NAME=` form.

## Self-Check: PASSED
