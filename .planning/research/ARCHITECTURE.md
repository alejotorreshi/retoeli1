# Architecture Research

**Domain:** Conversational LLM agent with typed tools (form-filling / document generation), TypeScript + Bun, SSE chat API, React front, reusable `modulo/` package
**Researched:** 2026-10-12
**Confidence:** HIGH for structure and boundaries, which come straight from the binding PRD (sections 6, 7, 9.4) and the fixture files I inspected. External API facts (OpenCode tool/agent/skill format, Bun SSE idle timeout, Zod 4 `toJSONSchema`, DeepSeek errors, caching and thinking mode) come from first-party vendor docs, but the GSD `classify-confidence` seam rates them **LOW** (webfetch provider). Verify them in the phase that uses them.

---

## Standard Architecture

### Guiding rule (the one the PRD actually grades)

> **Behavior** lives in `agent/prompt.md`. **Knowledge** lives in `src/knowledge/`. **Execution** lives in `src/tools/`. "Un cambio de reglas de negocio no debería tocar el servidor."

Clean Architecture maps onto that rule as follows. Dependencies point **inward only**:

```
 interface (drivers)        application                 domain (pure)
 ───────────────────        ───────────                 ─────────────
 web/ (React)  ──HTTP/SSE─▶ src/http + src/server.ts
                            │
 demo.ts ───────────────┐   ▼
 modulo/tools ──────────┼─▶ src/tools/proveedor.ts ──▶ src/application/* ──▶ src/domain/*
 (OpenCode etc.)        │   (tool adapter: zod,         (use cases +        (mapeo, reglas país,
                        │    never-throw, logs)          ports)              vigencias, checklist,
 src/loop (agent) ──────┘                                  │                 correo, PII policy)
        │                                                  │ ports
        ▼ port                                             ▼
 src/llm/adapter.ts ◀── src/llm/deepseek.ts      src/infra/* (fixtures reader, xlsx/pdf/md
                        (infrastructure)                     writers, safe out/ fs, clock, jsonl)
```

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ INTERFACE / DRIVERS                                                           │
│  ┌──────────────┐   ┌───────────────────────┐   ┌──────────┐  ┌────────────┐ │
│  │ web/ (React) │──▶│ src/server.ts         │   │ demo.ts  │  │ modulo/    │ │
│  │ fetch+SSE    │◀──│  src/http/* (routes,  │   │ (no LLM) │  │ (OpenCode) │ │
│  └──────────────┘   │  SSE, access, limits) │   └────┬─────┘  └─────┬──────┘ │
│                     └──────────┬────────────┘        │              │        │
├────────────────────────────────┼─────────────────────┼──────────────┼────────┤
│ APPLICATION                    ▼                     │              │        │
│  ┌────────────────────────────────────────┐          │              │        │
│  │ src/loop/  agent turn (async generator)│          │              │        │
│  │  registry · confirmation gate · budget │          │              │        │
│  │  prompt loader · error→message catalog │          │              │        │
│  └──────┬───────────────────────┬─────────┘          │              │        │
│         │ LlmAdapter port       │ ToolRegistry       ▼              ▼        │
│         │                ┌──────▼──────────────────────────────────────────┐ │
│         │                │ src/tools/proveedor.ts  (5 exports = 5 tools)    │ │
│         │                │  define-tool wrapper: zod → run → never throw →  │ │
│         │                │  PII-safe JSON string + RN5/CA4 jsonl records    │ │
│         │                └──────┬──────────────────────────────────────────┘ │
│         │                ┌──────▼──────────────────────────────────────────┐ │
│         │                │ src/application/  use cases (one per tool)       │ │
│         │                │  + ports: FixtureRepo, OutputWriter, Clock, Log  │ │
│         │                └──────┬──────────────────────────────────────────┘ │
├─────────┼───────────────────────┼────────────────────────────────────────────┤
│ DOMAIN  │                ┌──────▼──────────────────────────────────────────┐ │
│ (pure)  │                │ src/domain/  mapeo · glosario · reglas-pais ·    │ │
│         │                │ vigencias · checklist · correo · portal · pii ·  │ │
│         │                │ confirmacion · errores · resultado · tipos       │ │
│         │                └─────────────────────────────────────────────────┘ │
├─────────┼────────────────────────────────────────────────────────────────────┤
│ INFRA   ▼                                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ src/llm/deepseek │ │ infra/fixtures   │ │ infra/out │ │ infra/logging  │  │
│  │ + resilient.ts   │ │ (zod-validated   │ │ xlsx/pdf/ │ │ logger, jsonl, │  │
│  │ (timeout/retry/  │ │  JSON readers)   │ │ md, safe  │ │ ALS correlation│  │
│  │  fallback)       │ │                  │ │ paths     │ │ redaction      │  │
│  └────────┬─────────┘ └────────┬─────────┘ └─────┬─────┘ └───────┬────────┘  │
│           ▼                    ▼                 ▼               ▼           │
│     DeepSeek API      reto-01/fixtures/reto-01   out/<caso>/   out/log.jsonl │
│     (HTTPS)           (read-only)                (write)       stdout JSON   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Owns | Must NOT | Typical implementation |
|-----------|------|----------|------------------------|
| `src/domain/*` | Pure business rules: label normalization and glossary resolution, field mapping with confidence, RN1 country tax-id rule, expiry evaluation, checklist and `listo_para_firma` (RN3), email draft without bank data (RN2), portal values doc, PII sensitivity policy and masking, confirmation-text classifier, error catalog, `Result` type | Import `fs`, `Bun`, `zod`-for-IO, `Date.now()`, env, logger | Plain TS functions over plain types. 100% unit-testable. |
| `src/application/*` | One use case per tool (`leerSolicitud`, `mapearCampos`, `generarFormulario`, `armarPaquete`, `simularEnvio`). Orchestrates domain + ports. Defines **ports** (`FixtureRepository`, `OutputWriter`, `FormWriter`, `Clock`, `ExecutionLog`) | Know about LLMs, HTTP, sessions, SSE | Functions `(deps) => (input) => Promise<Result<…>>` |
| `src/tools/proveedor.ts` | **Only** the 5 PRD tool objects `{ description, args, execute }`. Nothing else is exported from this file | Import `server`, `http`, `loop`, `llm`, or require the LLM key | `defineTool({...})` wrapping a use case |
| `src/tools/define-tool.ts` | The tool boundary: zod validation, exception firewall, timeout, PII-safe presentation, `resumen`, writing `out/log.jsonl` (CA4) + `out/<caso>/log.jsonl` (RN5) | Contain business logic | Generic higher-order function |
| `src/tools/wiring.ts` | Lazy default dependencies for tools (mini composition root, so tools work from `demo.ts`/`modulo/` with no server) | Parse server-only env (API key) | Memoized `getToolDeps()` |
| `src/infra/*` | IO adapters: fixture JSON readers validated with zod, safe path resolution under `out/`, xlsx writer, pdf writer, markdown writers, file copy, clock, jsonl sink, structured logger, session stores | Make business decisions | Thin classes/functions implementing ports |
| `src/llm/adapter.ts` | **Port**: provider-agnostic message model + `LlmAdapter.enviar(mensajes, herramientas, opciones)` + typed `LlmError` | Mention DeepSeek | Types only |
| `src/llm/deepseek.ts` (+ `openai-compatible.ts`) | Translate the neutral model ↔ OpenAI-compatible wire format, map HTTP status → `LlmError`, pass back `reasoning_content` | Retry, log PII, know about tools' semantics | `fetch`-based client |
| `src/llm/resilient.ts` | Decorators: `withTimeout`, `withRetry` (backoff + jitter), `withFallback(primary, secondary)` | Change message semantics | Decorator pattern over `LlmAdapter` |
| `src/loop/*` | Agent turn: build system prompt, call LLM, dispatch tool calls through the registry, confirmation gate (CA3/RN4), iteration cap (CA1), token budget, event emission, error→Spanish message mapping (CA5) | Know HTTP/SSE or React; contain business rules | `async function*` generator yielding typed events |
| `src/contracts/*` | Wire contracts shared with `web/`: API request/response zod schemas, SSE event discriminated union | Import runtime server code | Types + zod schemas, type-only imports from web |
| `src/http/*` + `src/server.ts` | Routes, body validation, access code, rate limit, SSE framing + heartbeat, static `web/dist`. `server.ts` = **composition root** (wires config, LLM, stores, loop) | Contain agent or business logic | `Bun.serve({ routes })` |
| `src/sessions` (port in loop, impls in infra) | Session history, confirmation state, token usage, per-session lock | Persist secrets or unmasked PII | `Map` with TTL/LRU; optional file store |
| `agent/prompt.md` | Behavior (system prompt) | Contain business data tables that code enforces | Markdown |
| `src/knowledge/registro-proveedor.md` | Process knowledge the agent consults | Be the only enforcement of a rule | Markdown |
| `web/` | Chat UI, tool-call cards, "pensando", confirmation highlight + buttons | Hold the API key; call the LLM | React + Vite |
| `modulo/` | Packaged agent: `agent.md`, `skill/registro-proveedor/SKILL.md`, `tools/proveedor.ts` | Be a hand-maintained copy | Generated md + re-export ts |
| `demo.ts` | Deterministic run of 4 cases by calling the tools directly, cleans `out/` | Need an LLM key | Script over `src/tools/proveedor.ts` |

---

## Recommended Project Structure

```
reto-eli-1/
├── agent/
│   └── prompt.md                      # BEHAVIOR (system prompt). Single source for modulo/agent.md body
├── src/
│   ├── config/
│   │   ├── constants.ts               # non-env invariants: file names, tool module prefix, CONFIANZA_MINIMA=0.8, SSE event names
│   │   ├── env.ts                     # zod schemas: ToolEnv (no secrets) + ServerEnv (extends, needs key)
│   │   └── index.ts                   # loadToolConfig() / loadServerConfig(): memoized, frozen, typed
│   ├── contracts/                     # shared with web/ (type-only imports from the front)
│   │   ├── api.ts                     # ChatRequest/HealthResponse/SessionView zod schemas
│   │   └── events.ts                  # AgentEvent discriminated union (SSE payloads)
│   ├── domain/                        # PURE. Spanish identifiers. No IO, no Date.now(), no env
│   │   ├── tipos.ts                   # Solicitud, Plantilla, CampoSolicitado, EstadoCampo, Mapeo, Soporte, Checklist
│   │   ├── resultado.ts               # Result<T> = { ok: true; data } | { ok: false; error; codigo; data? }
│   │   ├── errores.ts                 # CodigoError enum + catálogo de mensajes claros (es)
│   │   ├── glosario.ts                # normalizarEtiqueta (lowercase, sin tildes), resolverSinonimo
│   │   ├── mapeo.ts                   # mapearCampos(campos, glosario, maestro, pais) → {llenos, faltantes, requiere_confirmacion}
│   │   ├── reglas-pais.ts             # RN1: IDENTIFICADOR_POR_PAIS {CO:'NIT',EC:'RUC',PE:'RUC',PA:'RUC',HN:'RTN'}
│   │   ├── vigencias.ts               # evaluarSoportes(exigidos, index, hoy: FechaISO) → presentes/ausentes/vencidos
│   │   ├── checklist.ts               # RN3: listo_para_firma = !vencidos && !ausentes; faltantes listados, no bloquean
│   │   ├── correo.ts                  # RN2: borrador typed to EXCLUDE banco.*; never receives bank values
│   │   ├── portal.ts                  # P2: valores-portal.md content
│   │   ├── pii.ts                     # política por ruta (publico|parcial|oculto), enmascarar(), default-deny
│   │   └── confirmacion.ts            # clasificarConfirmacion(texto) → 'confirma'|'rechaza'|'otro' (negation-aware)
│   ├── application/                   # USE CASES + PORTS
│   │   ├── ports.ts                   # FixtureRepository, OutputWriter, FormWriter, Clock, ExecutionLog
│   │   ├── leer-solicitud.ts
│   │   ├── mapear-campos.ts
│   │   ├── generar-formulario.ts      # recomputes canonical mapping; LLM 'mapeo' never supplies values
│   │   ├── armar-paquete.ts
│   │   └── simular-envio.ts
│   ├── infra/
│   │   ├── fixtures/
│   │   │   ├── schemas.ts             # zod schemas for solicitud/plantillas/maestro/index/glosario files
│   │   │   └── fixture-repository.ts  # reads + validates; corrupt template → typed error, never throws upward
│   │   ├── output/
│   │   │   ├── safe-path.ts           # resolveInside(root, ...segments); rejects traversal
│   │   │   ├── output-writer.ts       # write/copy/clean under out/<caso>/, per-caso mutex
│   │   │   ├── xlsx-writer.ts         # P0: sheet+cell exact from plantilla-celdas.json
│   │   │   ├── pdf-writer.ts          # P1: generated PDF, label+value in order
│   │   │   └── markdown-writer.ts     # checklist.md, borrador-correo.md, valores-portal.md, ENVIO-SIMULADO.md
│   │   ├── clock.ts                   # systemClock(tz) | fixedClock('2026-09-15') ; FECHA_EJECUCION override
│   │   ├── logging/
│   │   │   ├── correlation.ts         # AsyncLocalStorage<{sessionId, turnId, toolCallId?, caso?}>
│   │   │   ├── logger.ts              # JSON lines to stdout, level, merges correlation ctx
│   │   │   ├── redact.ts              # defense-in-depth key/regex scrubber
│   │   │   └── jsonl-execution-log.ts # appends to out/log.jsonl and out/<caso>/log.jsonl
│   │   └── sessions/
│   │       ├── memory-session-store.ts  # Map + TTL + max entries (LRU)
│   │       └── file-session-store.ts    # optional: out/.sessions/<id>.json, atomic write (tmp+rename)
│   ├── tools/
│   │   ├── proveedor.ts               # EXECUTION. exports exactly: leer_solicitud, mapear_campos,
│   │   │                              #   generar_formulario, armar_paquete, simular_envio
│   │   ├── define-tool.ts             # validate → run → catch → present → log → JSON string
│   │   ├── tool-context.ts            # ToolContext type; normalizes sessionId | sessionID (OpenCode)
│   │   └── wiring.ts                  # lazy default deps for tools (no secrets needed)
│   ├── llm/
│   │   ├── adapter.ts                 # PORT: Mensaje, LlamadaHerramienta, RespuestaLlm, LlmAdapter, LlmError
│   │   ├── tool-schema.ts             # zod args → JSON Schema (z.toJSONSchema, draft-07, strip $schema)
│   │   ├── openai-compatible.ts       # generic chat-completions client over fetch
│   │   ├── deepseek.ts                # DeepSeek factory: baseURL, model, thinking flag, reasoning passback
│   │   └── resilient.ts               # withTimeout / withRetry / withFallback decorators
│   ├── loop/
│   │   ├── run-turn.ts                # async function* runTurn(deps, session, input) → AgentEvent
│   │   ├── tool-registry.ts           # builds {proveedor_<export>} from tool modules; JSON-parses args
│   │   ├── confirmation-gate.ts       # state machine + policy table for gated tools
│   │   ├── budget.ts                  # iteration cap (25) + per-session token budget
│   │   ├── system-prompt.ts           # loads agent/prompt.md + src/knowledge/*.md once, stable prefix
│   │   ├── user-messages.ts           # LlmError/tool error → mensaje claro (es) for CA5
│   │   └── session.ts                 # Session type + SessionStore port + withSessionLock
│   ├── http/
│   │   ├── routes.ts                  # POST /api/chat, GET /api/sessions/:id, GET /api/health
│   │   ├── sse.ts                     # event framing, heartbeat, server.timeout(req, 0), abort on disconnect
│   │   ├── access-code.ts             # shared access code check (header/cookie), constant-time compare
│   │   └── rate-limit.ts              # token bucket per IP (X-Forwarded-For aware)
│   ├── knowledge/
│   │   └── registro-proveedor.md      # KNOWLEDGE. Single source for SKILL.md body
│   └── server.ts                      # COMPOSITION ROOT: loadServerConfig → adapters → loop → Bun.serve
├── web/                               # React + Vite (own package.json or workspace)
│   ├── src/ (api/stream-client.ts, state/useChat.ts, components/{ToolCallCard,ConfirmBanner,…})
│   └── vite.config.ts                 # dev proxy /api → backend; build → web/dist served by Bun in prod
├── modulo/
│   ├── agent.md                       # GENERATED: frontmatter + agent/prompt.md verbatim
│   ├── tools/proveedor.ts             # HAND-WRITTEN 1 line: named re-export of src/tools/proveedor.ts
│   ├── skill/registro-proveedor/SKILL.md  # GENERATED: frontmatter + src/knowledge/registro-proveedor.md verbatim
│   ├── modulo.meta.ts                 # frontmatter values (description, name, permission) — single place
│   └── README.md                      # how to install into OpenCode (.opencode/agents|skills|tools)
├── scripts/
│   └── build-modulo.ts                # generates modulo/*.md; `--check` exits 1 on drift
├── tests/
│   ├── unit/domain/*.test.ts          # mapeo, reglas-pais, vigencias, checklist, correo, pii, confirmacion
│   ├── contract/tools.test.ts         # each tool: never throws, {ok,data}|{ok:false,error}, PII-safe output
│   ├── loop/run-turn.test.ts          # scripted FakeLlm: cap, gate, errors, budget, history integrity
│   ├── http/*.test.ts                 # SSE framing, access code, health without secrets
│   ├── modulo-sync.test.ts            # generated md == regenerated; re-exports are the SAME references
│   ├── architecture.test.ts           # import-rule fitness test (domain imports nothing outward, etc.)
│   └── e2e/demo.test.ts               # runs demo with fixedClock, asserts out/ artifacts
├── demo.ts
├── Dockerfile
├── .env.example
└── package.json
```

### Structure Rationale

- **PRD-mandated paths are kept literally** (`agent/prompt.md`, `src/server.ts`, `src/llm/adapter.ts`, `src/llm/deepseek.ts`, `src/tools/proveedor.ts`, `src/knowledge/registro-proveedor.md`, `web/`, `demo.ts`, `modulo/`). Clean Architecture layers are **added around them**, never instead of them. Evaluators look for those paths.
- **`src/tools/proveedor.ts` is a thin adapter.** The PRD grades "execution in `src/tools/`". Keeping use cases in `src/application/` and pure rules in `src/domain/` still satisfies that: the tool file is the execution entry point, and nothing in `server.ts`/`loop/` encodes a business rule. A rule change touches `domain/` (and maybe `knowledge/`), never `server.ts`.
- **The loop lives in `src/loop/`, not `src/agent/`.** That avoids a name clash with the top-level `agent/` (prompt) folder. A future reader seeing `agent/` vs `src/agent/` would otherwise guess wrong about which one holds behavior.
- **`src/contracts/` exists so `web/` never imports server runtime code.** Type-only imports keep the API key and Node-only modules out of the browser bundle.
- **Spanish for domain identifiers, English for infrastructure.** This is the project decision. The PRD contract names (`leer_solicitud`, `listo_para_firma`, `requiere_confirmacion`) stay byte-exact.
- **One file per use case and one file per rule** keeps files small. That helps AI continuation: each file fits in context and has one reason to change (SRP).

---

## Architectural Patterns

### Pattern 1: Tool = thin adapter over a use case, built by a never-throw `defineTool`

**What:** Each PRD tool is `defineTool({ description, args, run, summarize })`. The wrapper owns all cross-cutting concerns, so the use case only returns a `Result`.
**When to use:** Always. It is the single place that guarantees HU-5 ("ninguna herramienta lanza"), CA4 and RN5 logging, zod validation (PRD 6.2), and PII-safe output.
**Trade-offs:** One extra indirection. In return, every tool is uniform, and adding a 6th tool is "add an export" (Open/Closed).

```typescript
// src/tools/define-tool.ts
import { z, type ZodRawShape } from "zod";

export type ToolContext = { directory: string; sessionId?: string; sessionID?: string };
export type Tool<S extends ZodRawShape> = {
  description: string;
  args: S;
  execute(args: z.infer<z.ZodObject<S>>, ctx: ToolContext): Promise<string>;
};

export function defineTool<S extends ZodRawShape, D>(spec: {
  name: string;                                   // "leer_solicitud" (for logs)
  description: string;
  args: S;
  run(args: z.infer<z.ZodObject<S>>, deps: ToolDeps, ctx: NormalizedCtx): Promise<Result<D>>;
  present(data: D): unknown;                      // PII-safe projection for the LLM/front
  summarize(r: Result<D>): string;                // short Spanish summary for RN5/CA4 + UI
}): Tool<S> {
  const schema = z.object(spec.args);
  return {
    description: spec.description,
    args: spec.args,
    async execute(rawArgs, rawCtx) {
      const started = performance.now();
      const ctx = normalizeCtx(rawCtx);           // sessionId | sessionID → sessionId
      let result: Result<D>;
      try {
        const parsed = schema.safeParse(rawArgs);
        result = parsed.success
          ? await withTimeout(spec.run(parsed.data, await getToolDeps(), ctx), TOOL_TIMEOUT_MS)
          : fail("ARGS_INVALIDOS", formatZodIssues(parsed.error));
      } catch (e) {
        result = fail("ERROR_INTERNO");          // stack goes to server log only, never to the model
        logger.error("tool_crash", { tool: spec.name, err: e });
      }
      const resumen = spec.summarize(result);
      await recordExecution({ herramienta: `proveedor_${spec.name}`, ok: result.ok, resumen,
                              caso: (rawArgs as { caso?: string }).caso, ms: performance.now() - started });
      return JSON.stringify(result.ok
        ? { ok: true, data: spec.present(result.data), resumen }
        : { ok: false, error: result.error, codigo: result.codigo, ...(result.data ? { data: spec.present(result.data) } : {}), resumen });
    },
  };
}
```

Notes:
- `resumen` is an **additive** field. The PRD contract `{ ok, data } | { ok: false, error }` stays satisfied. The loop reads it for the tool-call card and the RN5/CA4 log, so there is no second summarizer.
- `{ ok: false, error, data? }` lets HU-5 "continue with what it can" work. Example: portal → `error: "formato no soportado"` plus `data.ruta` of `valores-portal.md`.
- `recordExecution` itself must swallow its own IO errors. A full disk must never make a tool throw.

### Pattern 2: Lazy tool wiring (tools importable with zero server, zero secrets)

**What:** `src/tools/proveedor.ts` must work when imported from `demo.ts`, the tests, or an external agent host (OpenCode). Dependencies (fixture repo, writers, clock, execution log) are resolved **lazily on first `execute`** from `loadToolConfig()`. That config contains no secrets and has defaults for everything.
**Why:** If `proveedor.ts` parsed the full env at import time, `bun run demo.ts` would crash without `DEEPSEEK_API_KEY`. The bonus `modulo/` would also break.
**Testability:** export a factory too: `createProveedorTools(deps)` returns the same 5 objects. `proveedor.ts` does `export const { leer_solicitud, … } = createProveedorTools(lazyDefaultDeps)`. Unit and contract tests call the factory with `fixedClock` and in-memory or temp writers.

```typescript
// src/tools/proveedor.ts — exports ONLY tools (the registry turns every export into a tool)
import { createProveedorTools } from "./proveedor.factory";
import { lazyDefaultDeps } from "./wiring";
export const { leer_solicitud, mapear_campos, generar_formulario, armar_paquete, simular_envio } =
  createProveedorTools(lazyDefaultDeps);
```

### Pattern 3: Agent turn as an async generator of typed events (transport-agnostic loop)

**What:** `runTurn(deps, session, input)` is an `AsyncGenerator<AgentEvent>`. The HTTP layer maps events to SSE. Tests consume the generator directly with a scripted `FakeLlm`. A non-streaming `POST /api/chat` (`Accept: application/json`) folds the same events into `{ reply, toolCalls[], needsConfirmation }`, which is the PRD 6.4 reference shape, for almost no extra cost.
**Trade-offs:** Generators need care with cleanup. Use `try/finally` to release the session lock and persist the session. Bun runs a generator's `finally` when the client disconnects (Bun SSE guide).

```typescript
// src/loop/run-turn.ts (shape, not final code)
export async function* runTurn(d: LoopDeps, s: Session, input: TurnInput): AsyncGenerator<AgentEvent, TurnOutcome> {
  const gate = openGate(s.confirmation, input);          // consumes "awaiting" → confirmed | lapsed
  s.messages.push({ rol: "user", contenido: input.message });
  yield { type: "turn_started", sessionId: s.id, turnId: input.turnId };

  for (let i = 1; i <= d.cfg.maxIterations; i++) {        // CA1 (default 25)
    if (!d.budget.canSpend(s)) return yield* finish(s, "token_budget", gate);
    yield { type: "thinking", iteration: i };
    const r = await d.llm.enviar([d.systemPrompt, ...s.messages], d.registry.definitions, { signal: input.signal });
    d.budget.record(s, r.uso);
    s.messages.push({ rol: "assistant", contenido: r.texto, llamadas: r.llamadas, razonamiento: r.razonamiento });
    if (r.llamadas.length === 0) {
      if (r.texto) yield { type: "message", text: r.texto };
      return yield* finish(s, "final", gate);
    }
    for (const call of r.llamadas) {                      // sequential: tools write to out/<caso>/
      yield { type: "tool_call", id: call.id, name: call.nombre, args: redactArgs(call.argumentos) };
      const out = await dispatch(d.registry, gate, call, s); // gate → JSON.parse → execute (never throws)
      s.messages.push({ rol: "tool", llamadaId: call.id, nombre: call.nombre, contenido: out.raw });
      yield { type: "tool_result", id: call.id, name: call.nombre, ok: out.ok, summary: out.resumen, ms: out.ms };
    }
  }
  return yield* summarizeAtCap(d, s, gate);               // one final call with tools disabled; deterministic fallback
}
```

Rules baked into the loop:
- **Sequential tool execution**, even if the model returns parallel `tool_calls`. Tools write to the same `out/<caso>/`, and order matters (generate, then package).
- **History integrity invariant:** every assistant `tool_call.id` gets exactly one `tool` message before the next assistant/user message. If the LLM fails mid-turn, the loop appends a synthetic assistant message ("turno interrumpido: …") so the next request is valid for the provider.
- **LLM errors never kill the session (CA5).** Catch `LlmError`, `yield { type: "error", code, message }` with a Spanish message from `user-messages.ts`, then `done`.
- **Cap behavior (CA1):** at 25 tool iterations, make one more call with tools disabled, asking for "lo que tengo y lo que falta". If that fails or the budget is exhausted, build a deterministic summary from the `resumen` of the tool results gathered so far.

### Pattern 4: Provider-agnostic message model + adapter port + resilience decorators

**What:** The loop speaks only the neutral model. `deepseek.ts` translates it to OpenAI-compatible chat-completions. Resilience is **composed**, not embedded: `withFallback(withRetry(withTimeout(deepseek)), withRetry(withTimeout(secondary)))`.

```typescript
// src/llm/adapter.ts — the port (types only)
export type Mensaje =
  | { rol: "system"; contenido: string }
  | { rol: "user"; contenido: string }
  | { rol: "assistant"; contenido: string | null; llamadas?: LlamadaHerramienta[]; razonamiento?: string }
  | { rol: "tool"; llamadaId: string; nombre: string; contenido: string };
export type LlamadaHerramienta = { id: string; nombre: string; argumentos: string /* raw JSON from model */ };
export type DefinicionHerramienta = { nombre: string; descripcion: string; parametros: Record<string, unknown> };
export type Uso = { entrada: number; salida: number; cacheHit?: number };
export type RespuestaLlm = { texto: string | null; llamadas: LlamadaHerramienta[]; uso: Uso; razonamiento?: string;
                             fin: "stop" | "tool_calls" | "length" | "other" };
export type OpcionesEnvio = { signal?: AbortSignal; maxTokens?: number; herramientasDesactivadas?: boolean };
export interface LlmAdapter {
  readonly proveedor: string;
  readonly modelo: string;
  enviar(m: readonly Mensaje[], h: readonly DefinicionHerramienta[], o?: OpcionesEnvio): Promise<RespuestaLlm>;
}
export type LlmErrorKind = "timeout" | "rate_limit" | "auth" | "saldo" | "servidor" | "peticion_invalida" | "red" | "abortado";
export class LlmError extends Error { constructor(readonly kind: LlmErrorKind, readonly retryable: boolean, readonly status?: number) { super(kind); } }
```

DeepSeek-specific facts the adapter must handle (DeepSeek docs, seam tier LOW, so verify in the LLM phase):
- **Status mapping:** 400 → `peticion_invalida`, 401 → `auth`, **402 → `saldo`** (insufficient balance; the user's prepaid key will hit this), 422 → `peticion_invalida`, 429 → `rate_limit` (retryable; DeepSeek itself suggests switching provider, which justifies `withFallback`), 500/503 → `servidor` (retryable). Network/abort errors map to `red`/`timeout`.
- **Thinking mode is ON by default, and with tools `reasoning_content` must be passed back in every later request, otherwise the API returns 400.** That is why `Mensaje.assistant` has an optional `razonamiento` that the session persists and the DeepSeek adapter re-emits. Other adapters ignore it. **Recommendation:** default `LLM_THINKING=disabled` (`thinking: { type: "disabled" }`) for cost and latency on this structured task, while keeping passback support so enabling it is a config flip. Never send `razonamiento` to the front or the logs.
- **Current model names** in DeepSeek docs (Oct 2026): `deepseek-flash` and `deepseek-v4-pro`. Keep the model in env (`LLM_MODEL`), never hard-coded.
- **Prefix caching is automatic.** Keep the system prompt (prompt.md + knowledge) **byte-stable and first**, and never inject per-turn data such as the date or the session id into it. Read `usage.prompt_cache_hit_tokens` into `Uso.cacheHit` to report cost.

Retry policy (`withRetry`): retry only `retryable` kinds, at most 2 retries, exponential backoff `base 500ms × 2^n` with full jitter, honor `Retry-After`, and **never exceed the turn deadline** (`LLM_TIMEOUT_MS` per attempt, `TURN_DEADLINE_MS` overall). Combine the client-disconnect signal with the timeout via `AbortSignal.any([req.signal, AbortSignal.timeout(ms)])`. Never retry `auth`, `saldo`, `peticion_invalida` or `abortado`. Fallback triggers only after the primary's retries are exhausted for `rate_limit|servidor|timeout|red`, and only if a secondary is configured. Report the active provider in logs and in the `done` event.

### Pattern 5: Deterministic confirmation gate (CA3 / RN4) enforced in code, not by the prompt

**What:** A per-session state machine plus a policy table. The model's `confirmado: true` argument is **never trusted on its own**.

```
                 armar_paquete ok (caso X)            next user msg classified 'confirma'
                 OR gated tool attempted w/o grant    (or front button decision='aprobar')
   ┌──────┐ ──────────────────────────────────▶ ┌──────────────────────────┐ ─────────────▶ ┌───────────────────────┐
   │ idle │                                     │ awaiting {caso X, envio} │                │ granted {caso X} (this│
   └──────┘ ◀────────────────────────────────── └──────────────────────────┘                │ turn only)            │
      ▲        next user msg = anything else (lapses)                                       └──────────┬────────────┘
      └──────────────────────────────── end of turn (grant consumed or expired) ────────────────────────┘
```

- **Policy table** in `src/loop/confirmation-gate.ts`: `{ proveedor_simular_envio: { requires: "envio", scopeArg: "caso" } }`. The tool objects stay exactly PRD-shaped, with no extra metadata on them.
- **Gated call without grant:** the loop does **not** call `execute`. It returns `{ ok:false, error:"requiere confirmación explícita" }` to the model, logs the attempt (CA4), and moves the session to `awaiting`. The turn ends with `needsConfirmation: true`.
- **Gated call with grant:** the loop forces `confirmado: true` and checks that `args.caso` equals the granted caso. A grant for caso X cannot send caso Y.
- **Grant lifetime = the immediately next user message only** (RN4 "en el turno inmediatamente anterior"). It is consumed at turn end whether used or not.
- **Classifier** `domain/confirmacion.ts` is pure and conservative. It is negation-aware ("no envíes", "todavía no", "espera" → `rechaza`). Ambiguous input → `otro` → not granted. The front's Confirmar/Cancelar buttons send a structured `confirmation: "aprobar" | "rechazar"` that takes precedence over text.
- **Defense in depth:** the tool itself still refuses unless `confirmado === true`. That covers `demo.ts` and `modulo/` hosts, which use their own permission systems.
- The `done` event carries `needsConfirmation` and `pending: { caso, accion }` so the front can highlight the state (PRD 6.1).

### Pattern 6: PII minimization: values flow to files, paths and masks flow to the model

**What:** The redaction boundary is the **tool presentation step** (`present()` in `defineTool`). Everything downstream of the tool's JSON string (LLM context, session history, SSE, `GET /api/sessions/:id`, logs) is PII-safe **by construction**. Only `src/application` → `src/infra/output` writers ever handle real values.

```
maestro.json ─▶ FixtureRepository ─▶ use case (real values) ─┬─▶ FormWriter/markdown writers ─▶ out/<caso>/* (REAL values)
                                                             │
                                                             └─▶ present(): domain/pii.ts policy ─▶ JSON string
                                                                     { etiqueta, ruta, valor_mostrado: "•••• 2345" }
                                                                         │
                                         LLM ◀── session history ◀───────┤──▶ SSE tool_result ──▶ web
                                                                         └──▶ out/log.jsonl, stdout (+ redact.ts 2nd pass)
```

- **Policy by maestro path, default-deny.** An allowlist of public company fields (`razon_social`, `ciudad`, `departamento`, `pais`, `actividad_economica`, `ciiu_*`, `regimen_tributario`, `tipo_sociedad`, `sitio_web`) is shown as-is. Partially masked: `nit`, `banco.numero_cuenta`, `representante_legal.identificacion`, `telefono`, `*.email`. Hidden entirely: anything unknown. A new maestro field is masked until someone classifies it.
- **CA2 becomes structural.** `generar_formulario` **re-derives values from the maestro by `ruta` (path)**. The LLM-supplied `mapeo` carries no values at all, only `etiqueta`, `estado` and `ruta`. **Recommended default:** `generarFormulario` recomputes the canonical mapping with the same `domain/mapeo.ts`, and uses `mapeo` only to detect discrepancies (any `ruta` that disagrees is ignored and reported). The model then cannot inject or swap a value, even by mistake.
- **RN2 is enforced by type.** `construirBorradorCorreo(input: DatosCorreo)`, where `DatosCorreo` structurally excludes `banco`. A unit test asserts that no bank value string appears in `borrador-correo.md`.
- **Layer 2:** `infra/logging/redact.ts` scrubs by key name (`numero_cuenta`, `identificacion`, `email`, `telefono`, `authorization`, `api_key`) and by regex (runs of 8+ digits) before any log line is written. User chat messages are logged as `{ length, hash }` at info level, not as content.
- **Secrets:** load the API key into a `Secret` wrapper whose `toJSON()`/`toString()` return `"[REDACTED]"`. Then logging the config object by accident is harmless. `/api/health` returns `{ ok, provider, model }` only.

### Pattern 7: Centralized, typed, validated configuration (two tiers)

**What:** `src/config/env.ts` defines **ToolEnv** (no secrets, every field defaulted) and **ServerEnv = ToolEnv.extend(...)** (requires the key). It is parsed once, frozen, and memoized. `src/config/constants.ts` holds non-env invariants.

| Key | Tier | Default | Notes |
|-----|------|---------|-------|
| `PROJECT_ROOT` | tool | `process.cwd()` | becomes `ctx.directory` for the server; tools resolve from `ctx.directory` (PRD 6.2) |
| `FIXTURES_DIR` | tool | `reto-01/fixtures/reto-01` | relative to `ctx.directory`; PRD text says `fixtures/reto-01/`, repo layout differs, hence a constant |
| `OUT_DIR` | tool | `out` | relative to `ctx.directory` |
| `FECHA_EJECUCION` | tool | unset → system clock | `YYYY-MM-DD`; drives `fixedClock` for deterministic expiry |
| `TZ_NEGOCIO` | tool | `America/Bogota` | used to compute "today"; avoids UTC off-by-one |
| `TOOL_TIMEOUT_MS` | tool | `15000` | |
| `CONFIANZA_MINIMA` | constant | `0.8` | HU-2; constant, not env (it is a business rule) |
| `IDENTIFICADOR_POR_PAIS` | domain const | CO→NIT, EC/PE/PA→RUC, HN→RTN | RN1 lives in `domain/reglas-pais.ts`, not in env |
| `LLM_PROVIDER` / `LLM_MODEL` / `LLM_BASE_URL` | server | `deepseek` / `deepseek-flash` / `https://api.deepseek.com` | |
| `DEEPSEEK_API_KEY` | server | **required** | `Secret` wrapper |
| `LLM_FALLBACK_*` | server | unset → no fallback | provider/model/base/key |
| `LLM_THINKING` | server | `disabled` | |
| `LLM_TIMEOUT_MS` / `LLM_MAX_RETRIES` / `TURN_DEADLINE_MS` | server | `30000` / `2` / `90000` | |
| `MAX_ITERACIONES` | server | `25` | CA1 |
| `MAX_TOKENS_RESPUESTA` / `MAX_TOKENS_SESION` / `MAX_TOKENS_DIA` | server | e.g. `2048` / `60000` / `1500000` | the daily global cap protects the prepaid balance across sessions |
| `ACCESS_CODE` | server | required in prod | |
| `RATE_LIMIT_PER_MIN` | server | `20` | |
| `SESSION_STORE` / `SESSION_TTL_MIN` / `MAX_SESSIONS` | server | `memory` / `120` / `200` | |
| `PORT` / `LOG_LEVEL` | server | `3000` / `info` | |

Gotchas: use `z.coerce.number()` for numerics. **Preprocess empty strings to `undefined`**: Bun auto-loads `.env`, and a copied `.env.example` with `FECHA_EJECUCION=` would otherwise fail date validation or pin an empty date. On invalid config the server fails fast at boot with a readable zod issue list. Tools return `{ ok:false, error:"configuración inválida: …" }` instead of throwing.

### Pattern 8: Injected clock

`interface Clock { today(): FechaISO }`. `systemClock(tz)` computes the local date with `Intl.DateTimeFormat("en-CA", { timeZone: tz })`. `fixedClock(date)` is for tests and the demo. Domain `vigencias.ts` takes `hoy: FechaISO` as a **parameter** and never reads a clock. Rule: `vencido ⇔ vigencia_hasta !== null && vigencia_hasta < hoy` (string comparison on ISO dates; the same day is still valid).

**Important finding:** today (2026-10-12), `camara_comercio` (`vigencia_hasta: 2026-09-30`) is expired, and **all four cases require it**. With the system clock, every case is `listo_para_firma: false`. The solicitudes are dated 2026-08-27 to 2026-09-01. So "fecha de ejecución" semantics change the visible outcome a lot, and `FECHA_EJECUCION` must be first-class and printed by `demo.ts` and shown in the checklist header. Flagged for the requirements and features decision.

### Pattern 9: Observability with correlation via AsyncLocalStorage

- **IDs:** `sessionId` (client-provided UUID or server-generated), `turnId` (per POST), `toolCallId` (the LLM's `tool_call.id`; `demo-<n>` in the demo), and `caso` when known.
- **Propagation:** `infra/logging/correlation.ts` holds an `AsyncLocalStorage` context set by the HTTP handler (`sessionId`, `turnId`) and narrowed by the loop around each dispatch (`toolCallId`, `caso`). The logger merges it into every line, so the **tool contract `ctx` stays exactly PRD-shaped**. Tools still get `sessionId` from `ctx` when ALS is empty (demo, OpenCode).
- **Sinks:**
  - stdout: JSON lines (`ts, level, event, sessionId, turnId, toolCallId, …`). Events: `http_request`, `turn_start/end`, `llm_call` (provider, model, ms, tokens, cacheHit, attempt), `llm_retry`, `llm_fallback`, `tool_exec`, `gate_blocked`, `budget_exceeded`.
  - `out/log.jsonl` (CA4): every tool call, including gate-blocked ones: `{ ts, sessionId, turnId, toolCallId, herramienta, args(redacted), ok, resumen, ms }`.
  - `out/<caso>/log.jsonl` (RN5): exactly `{ ts, herramienta, ok, resumen }` (+ optional ids). It is written by the **tool wrapper**, so `demo.ts` produces it too.
- Appends use `fs.appendFile` with one line per write, so lines stay atomic for typical sizes. Per-caso writes go through the same per-caso mutex as the writers.

### Pattern 10: `modulo/` single source: generate the markdown, re-export the code, prove it in a test

| Option | Verdict | Why |
|--------|---------|-----|
| Symlinks | **Reject** | Cannot add the required frontmatter to a symlinked `prompt.md`. Breaks in `.zip` delivery (PRD 9.5 allows zip) and on Windows checkouts without `core.symlinks`. Evaluators may download a zip. |
| Make `modulo/` the source and have the app read it | **Reject** | Violates the mandated `agent/prompt.md` and `src/knowledge/` locations. |
| Hand-copied files | **Reject** | This is exactly the "copias divergentes" the PRD penalizes. |
| **Generated md + committed + drift test; tools as named re-export** | **Adopt** | Byte-identical bodies, frontmatter in one place, no runtime coupling, verifiable by CI. |

Implementation:
- `modulo/tools/proveedor.ts`: `export { leer_solicitud, mapear_campos, generar_formulario, armar_paquete, simular_envio } from "../../src/tools/proveedor";`. Use named exports, not `export *`, so readers see the five tools. Because the filename stays `proveedor.ts`, OpenCode names them `proveedor_<export>`, the same names the app's model sees.
- `scripts/build-modulo.ts` writes `modulo/agent.md` (frontmatter `description`, `mode: primary`, `permission: { edit: deny, bash: deny }`, then `agent/prompt.md` verbatim) and `modulo/skill/registro-proveedor/SKILL.md` (frontmatter `name: registro-proveedor`, matching the directory and the OpenCode regex `^[a-z0-9]+(-[a-z0-9]+)*$`, plus `description` of 1 to 1024 chars, then `src/knowledge/registro-proveedor.md` verbatim). Add a `<!-- GENERADO por scripts/build-modulo.ts — no editar -->` marker after the frontmatter, or as a YAML comment.
- Run it from `predev`/`prebuild`, and commit the outputs so evaluators see them without running anything.
- `tests/modulo-sync.test.ts`: (1) regenerate in memory and assert equality with the committed files; (2) `import * as mod from "../modulo/tools/proveedor"` and `import * as app from "../src/tools/proveedor"`, then `expect(mod.leer_solicitud).toBe(app.leer_solicitud)` for every export. **Reference identity is the strongest possible "not a divergent copy" proof.**
- **OpenCode compatibility** (opencode.ai docs; seam LOW, verify): plain-object tools with your own `zod` import are supported. The context provides `directory`, `worktree`, **`sessionID`** (capital "ID"), `messageID`, `agent`. So `tool-context.ts` must accept `sessionId | sessionID`. Agents go in `.opencode/agents/`, skills in `.opencode/skills/<name>/SKILL.md`, tools in `.opencode/tools/`. Document the install in `modulo/README.md`.
- **Portability caveat:** the re-export works when `modulo/` sits inside this repo. Copying `modulo/` alone into another project breaks the relative import. An optional `bun run modulo:bundle` (`Bun.build` → self-contained `modulo/dist/proveedor.js`) can solve that later. It is not required for the bonus.

---

## Data Flow

### Request flow (chat turn over SSE)

```
web: POST /api/chat {sessionId, message, confirmation?}  (fetch + ReadableStream; NOT EventSource: it is GET-only)
  │
  ▼
http/routes ─▶ access-code ─▶ rate-limit ─▶ zod(ChatRequest) ─▶ ALS.run({sessionId, turnId})
  │                                                             │
  │                         sessions.withLock(sessionId) ◀──────┘ (409 if a turn is already running)
  ▼
loop.runTurn ── gate.open(state, msg) ──▶ [LLM] llm.enviar(system+history, toolDefs, {signal})
  │                                            │  (resilient: timeout → retry/backoff → fallback)
  │◀──────────── RespuestaLlm ─────────────────┘
  ├─ no tool calls ─▶ event: message ─▶ done{needsConfirmation, stoppedBy, usage}
  └─ tool calls ──▶ for each (sequential):
        gate.check ─ blocked ─▶ {ok:false,"requiere confirmación explícita"} (logged, state→awaiting)
           │ allowed
           ▼
        registry: JSON.parse(argumentos) ─fail─▶ {ok:false,"argumentos no son JSON válido"}
           ▼
        tools/proveedor.<x>.execute(args, {directory, sessionId})
           ▼ defineTool: zod → use case → domain + infra (read fixtures / write out/) → present() → log
        JSON string ─▶ history (tool msg) ─▶ event: tool_result ─▶ loop again (≤ 25)
  ▼
http/sse: "event: <type>\ndata: <json>\n\n" + ": ping" every 15s; server.timeout(req, 0)
  ▼
web: reducer appends message / tool cards / confirmation banner
```

### Tool data flow (inside one call)

```
args (zod-validated) ─▶ use case
   ├─▶ FixtureRepository.read*(caso)  ── zod-validated JSON (corrupt → PLANTILLA_CORRUPTA)
   ├─▶ domain functions (pure)        ── mapping / RN1 / expiry(hoy from Clock) / checklist / correo
   ├─▶ OutputWriter / FormWriter      ── out/<caso>/{formulario.xlsx|pdf, valores-portal.md, paquete/*}
   └─▶ Result<data with REAL values>
          ▼ present() (PII policy)            ▼ summarize()
      data for model (paths, masks)       resumen (es) ─▶ out/<caso>/log.jsonl + out/log.jsonl
```

### State management

```
Session { id, createdAt, lastActiveAt,
          messages: Mensaje[]            // masked tool outputs only; no system prompt stored
          confirmation: idle | awaiting{caso,accion,turnId} | granted{caso}   // granted lives only within a turn
          usage: { input, output, cacheHit }
          busy: boolean }                // per-session lock
SessionStore port: get(id) / save(session)   impl: memory (TTL+LRU) | file (atomic tmp+rename)
Front state: useReducer over AgentEvent stream; sessionId in localStorage; GET /api/sessions/:id rehydrates.
```

### SSE event contract (`src/contracts/events.ts`)

| `type` | Payload | Front behavior |
|--------|---------|----------------|
| `turn_started` | `sessionId, turnId` | store ids |
| `thinking` | `iteration` | show "pensando…" |
| `tool_call` | `id, name, args` (redacted) | open a tool card |
| `tool_result` | `id, name, ok, summary, ms` | fill the card; red if `ok:false` |
| `message` | `text` | assistant bubble |
| `confirmation_required` | `caso, accion, question?` | highlight the banner + Confirmar/Cancelar |
| `error` | `code, message` (es), `retryable` | inline error bubble; the session stays usable |
| `done` | `needsConfirmation, stoppedBy: final \| iteration_cap \| token_budget \| error \| aborted, iterations, usage, provider` | stop the spinner |

Recommendation: **no token-level streaming in v1.** The PRD's `enviar(mensajes, herramientas) → respuesta` is request/response, and streaming partial `tool_calls` deltas adds parsing complexity with little evaluative value. Event-level streaming already makes every tool call visible live. Token deltas can be added later as an optional `onDelta` without changing the port.

### Key data flows

1. **Happy path (ec-corp-andina):** leer_solicitud → mapear_campos ("RUC" → `nit` via glossary + RN1 `requiere_confirmacion`, "identificador extranjero"; "Número de contribuyente especial" → `faltante`) → generar_formulario (pdf) → armar_paquete (`certificado_cumplimiento_tributario` absent → blocks; expiry depends on the clock) → state `awaiting` → turn ends with a question → next message "envía" / button → `granted` → simular_envio → `ENVIO-SIMULADO.md`.
2. **Demo flow (no LLM):** `demo.ts` → clean `out/` → for each case in `FIXTURES_DIR/casos/*` call the 5 tools in order with `ctx = { directory: PROJECT_ROOT, sessionId: "demo" }` → print a summary per case → one failing case never stops the others (each tool already returns `Result`).
3. **Module flow:** an external host loads `modulo/agent.md` (prompt), `SKILL.md` (knowledge on demand), and `modulo/tools/proveedor.ts`, which resolves to the identical tool objects. The host's permission system takes over the confirmation role.

---

## Suggested Build Order (dependency-driven)

| # | Block | Depends on | Why this order | Deliverable proves |
|---|-------|-----------|----------------|--------------------|
| 1 | **Foundation**: `config/` (ToolEnv), `domain/` types + Result + errores, fixture zod schemas, clock, safe-path | none | Everything imports these. Pure and fast to test | unit tests green |
| 2 | **Domain rules**: glosario, mapeo (+confianza), reglas-pais, vigencias, checklist, correo, portal, pii, confirmacion | 1 | Highest-risk logic (rubric O1/O2, RN1-RN3). No IO | unit tests per rule |
| 3 | **Tools vertical slice**: application use cases, infra readers/writers (xlsx P0 first, then md, then pdf P1), `defineTool`, `proveedor.ts`, execution logs, **`demo.ts`** | 1-2 | A rubric-scoring artifact that needs **no LLM key**. Locks the tool contract before the loop depends on it | contract tests + demo e2e with fixedClock |
| 4 | **Prompt + knowledge + `modulo/` generator** | 3 (tool names/descriptions final) | Prompt must reference the exact tool names. modulo depends only on prompt, knowledge and tools | `modulo-sync.test.ts` |
| 5 | **LLM port + DeepSeek adapter + resilience + FakeLlm** | 1 | Independent of tools. Can run in parallel with 3-4 | adapter unit tests with mocked fetch |
| 6 | **Agent loop**: registry, gate, budget, system-prompt, error catalog, sessions port + memory store | 3, 4, 5 | Needs real tools and the port | loop tests with scripted FakeLlm (cap, gate, CA5, history integrity) |
| 7 | **HTTP/SSE server**: routes, SSE framing + heartbeat, access code, rate limit, health, static web, JSON fallback | 6 | Thin layer over the generator | http tests + a manual curl stream |
| 8 | **Web front** | 7 (contracts can be stubbed earlier) | Consumes `contracts/events.ts` | UAT in browser |
| 9 | **Deploy + docs**: Dockerfile, Render, `.env.example`, README, SOLUCION.md (10 sections) | 7-8 | Needs a working system and final decisions | public link with access code |

Parallelizable: 5 runs alongside 2-4, and 8 can start on stubbed contracts once 7's event union is fixed. Critical path: 1 → 2 → 3 → 6 → 7 → 9.

---

## Scaling Considerations

| Scale | Architecture adjustments |
|-------|--------------------------|
| Reto / defense (1 analyst, a few evaluators) | Single Bun process on Render free serving API + `web/dist`. In-memory sessions. `out/` on ephemeral disk. Perfectly adequate |
| Real Periferia use (8-12 requests/month, a handful of users) | File session store or SQLite. Persistent volume or object storage for `out/`. Real auth instead of a shared code |
| Multi-tenant / many clients | Shared session store (Redis). Per-caso work as queued jobs. Writers behind a storage port (S3). Secrets in a vault. Real portal automation as a separate worker |

### Scaling priorities (what breaks first)

1. **LLM cost/latency and the prepaid balance:** this is the first real limit on a public link. Mitigated by the access code, rate limit, per-session and daily token caps, thinking disabled, and a stable cached system prompt.
2. **Render free sleep/restart:** this wipes memory sessions and `out/`. Acceptable here (document it, warm up before the defense). The `SessionStore` port makes a persistent store a drop-in change.
3. **Concurrent writes to the same `out/<caso>/`** from two sessions: handled by a per-caso mutex. A multi-instance deployment would need storage-level locking.

---

## Anti-Patterns

### Anti-Pattern 1: Tools that import server config or secrets
**What people do:** `proveedor.ts` imports a global `config` that parses `DEEPSEEK_API_KEY` at import time, or imports the logger from `server.ts`.
**Why it's wrong:** `bun run demo.ts` and `modulo/` break without a key, which fails PRD 6.1 "importables desde demo.ts" and the 9.4 bonus.
**Do this instead:** two config tiers, lazy tool wiring, and an `architecture.test.ts` that fails if `src/tools|application|domain` import `src/http|server|loop|llm`.

### Anti-Pattern 2: Letting the model carry values into the writers
**What people do:** `generar_formulario({ mapeo: [{ etiqueta, valor }] })` and write whatever the model sends.
**Why it's wrong:** it breaks the core value ("nunca inventa un dato") and CA2. One hallucinated account number ends up in a form to be signed.
**Do this instead:** `mapeo` holds `ruta`s only. The tool recomputes or validates against the domain mapping and reads values from the maestro.

### Anti-Pattern 3: Confirmation enforced only by the prompt or the `confirmado` argument
**What people do:** trust `simular_envio({ confirmado: true })` from the model.
**Why it's wrong:** prompt injection or the model's eagerness bypasses RN4. Graders will literally test "envía" without a prior question.
**Do this instead:** the session-level gate (Pattern 5), with the grant scoped to caso and one turn.

### Anti-Pattern 4: Business rules in the server, the loop or the prompt only
**What people do:** put the country tax-id map in `prompt.md` or a `switch` in `server.ts`.
**Why it's wrong:** it violates the graded separation ("cambio de reglas de negocio no debería tocar el servidor"), and the model can ignore the prompt.
**Do this instead:** enforce in `domain/`, explain in `knowledge/`, and add a small consistency test (every country in `IDENTIFICADOR_POR_PAIS` is mentioned in the knowledge doc).

### Anti-Pattern 5: Leaking traces or raw values
**What people do:** `catch (e) { return JSON.stringify({ ok:false, error: e.stack }) }`, log full tool results, or put the user message in the URL (EventSource GET).
**Why it's wrong:** it breaks HU-5 ("sin traza cruda"), the PII requirement and the security NFR.
**Do this instead:** coded errors with a Spanish catalog, stack only in the server log, POST + streamed fetch, and redaction at the tool boundary plus in the logger.

### Anti-Pattern 6: `new Date()` inside domain or use cases
**Why it's wrong:** demo and test results change by date. Today it flips every case to "camara_comercio vencida".
**Do this instead:** an injected `Clock`, `FECHA_EJECUCION`, and a business timezone.

### Anti-Pattern 7: Hand-maintained copies in `modulo/`
**Do this instead:** the generator, committed outputs, a drift test, and a reference-identity test (Pattern 10).

### Anti-Pattern 8: Dropping provider-specific state from the neutral message model
**What people do:** reduce messages to `{ role, content }` and forget `tool_call_id` pairing or DeepSeek `reasoning_content`.
**Why it's wrong:** DeepSeek returns 400 when reasoning isn't passed back with tools, and on orphan tool calls. The session then "dies" on the next turn (breaks CA5).
**Do this instead:** keep `llamadaId` pairing and optional `razonamiento` in the model, and enforce the history-integrity invariant.

### Anti-Pattern 9: Running parallel tool calls concurrently
**Why it's wrong:** generar and armar race on `out/<caso>/`, so the package may copy a half-written form.
**Do this instead:** sequential dispatch in model order.

---

## Integration Points

### External services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| DeepSeek (OpenAI-compatible) | `fetch` POST `/chat/completions` through `openai-compatible.ts`, wrapped by the resilience decorators | 402 = no balance (non-retryable, clear message). 429/500/503 retryable. Thinking on by default (disable, or pass back `reasoning_content`). Prefix cache automatic |
| Optional fallback LLM | Same `openai-compatible.ts` with a different base URL/key | Activated only when configured. Health reports the primary |
| OpenCode (module host) | `modulo/agent.md`, `modulo/skill/registro-proveedor/SKILL.md`, `modulo/tools/proveedor.ts` | Context uses `sessionID`. Fixtures path is resolved from host `directory` + `FIXTURES_DIR` |
| Render free | Docker or native Bun service; single origin serves API + static web | Sleeps when idle and has an ephemeral disk. SSE needs heartbeats through the proxy |

### Internal boundaries

| Boundary | Communication | Rule |
|----------|---------------|------|
| web ↔ http | HTTP POST + SSE; GET session/health | Types from `src/contracts` only (type-only import) |
| http ↔ loop | `runTurn` async generator | http knows nothing about tools or LLM |
| loop ↔ llm | `LlmAdapter` port | loop never imports `deepseek.ts`; `server.ts` injects it |
| loop ↔ tools | `ToolRegistry` built from `{ proveedor: import("…/tools/proveedor") }` | name = `${moduleKey}_${exportKey}`; only objects passing an `isTool` guard; schemas via `z.toJSONSchema(z.object(args), { target: "draft-07" })` |
| tools ↔ application | direct function call with deps | tools add validation, firewall and presentation only |
| application ↔ infra | ports in `application/ports.ts` | infra implements; tests substitute fakes |
| application ↔ domain | direct pure calls | domain imports nothing outward |
| everything → logging | logger + ALS correlation | redaction before write |

Enforce the dependency rule with `tests/architecture.test.ts`: glob `src/**/*.ts`, regex the import specifiers, and assert the allowed directions (domain → none; application → domain; tools → application/domain/infra/config; loop → llm(port)/tools/contracts/domain; http → loop/contracts; only `server.ts` imports concrete LLM adapters). It is cheap, has no dependencies, and protects the architecture for future AI or dev contributors.

---

## Sources

- `reto-01/PRD.md` sections 5, 6.1-6.6, 7.1-7.4, 8, 9.4 (binding spec, read in full). HIGH: primary source.
- `reto-01/fixtures/reto-01/**` (maestro, soportes index, glosario, the 4 cases), inspected directly. HIGH: they show that every case requires `camara_comercio` (expired as of 2026-10-12), that "Número de contribuyente especial" and "Referencias comerciales" have no glossary entry, and that the EC case requires the absent `certificado_cumplimiento_tributario`.
- `.planning/PROJECT.md`: project decisions (DeepSeek, Bun, SSE, PII minimization, injectable clock, modulo as single source).
- OpenCode custom tools: https://opencode.ai/docs/custom-tools/ (naming `<file>_<export>`, plain object + own zod, context `{agent, sessionID, messageID, directory, worktree}`). Seam tier LOW (webfetch), first-party doc.
- OpenCode agents: https://opencode.ai/docs/agents/ (frontmatter `description`, `mode`, `permission`). Seam tier LOW, first-party.
- OpenCode skills: https://opencode.ai/docs/skills/ (`name` regex, must match the directory; on-demand loading). Seam tier LOW, first-party.
- Bun SSE guide: https://bun.com/docs/guides/http/sse (10s default idle timeout; `server.timeout(req, 0)`; generator `finally` on disconnect). Seam tier LOW, first-party.
- Zod 4 JSON Schema: https://zod.dev/json-schema (`z.toJSONSchema`, targets, `additionalProperties:false` default, unrepresentable types throw). Seam tier LOW, first-party.
- DeepSeek error codes: https://api-docs.deepseek.com/quick_start/error_codes. Seam tier LOW, first-party.
- DeepSeek context caching: https://api-docs.deepseek.com/guides/kv_cache. Seam tier LOW, first-party.
- DeepSeek thinking mode: https://api-docs.deepseek.com/guides/thinking_mode (reasoning passback with tools or 400; disable via `thinking.type=disabled`). Seam tier LOW, first-party.

---
*Architecture research for: conversational LLM agent with typed tools (Registro como Proveedor, Reto 01)*
*Researched: 2026-10-12*
