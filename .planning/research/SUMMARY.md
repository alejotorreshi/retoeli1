# Project Research Summary

**Project:** Agente "Registro como Proveedor" (Reto 01 · Perxia 2.0)
**Domain:** Conversational tool-calling LLM agent that fills supplier-registration forms (xlsx/pdf/portal values) from a master-data repository, with PII minimization and a human confirmation gate. Bun + Hono + DeepSeek + React/Vite SSE, Render free deploy. Graded by rubric + live defense.
**Researched:** 2026-10-12
**Confidence:** HIGH (scope, fixtures, library behavior exec-verified), MEDIUM (hosted DeepSeek/Render facts)

## Executive Summary

This is a small agent graded by a rubric. Its real value is **deterministic tooling with a thin LLM orchestrator on top**. Experts build this kind of system with a hand-written agent loop rather than LangChain or the AI SDK, because the loop, the iteration cap, the adapter and the confirmation gate are exactly what gets graded. Pure domain functions do the mapping, the country rules and the expiry checks. The tools are thin wrappers that validate with zod and never throw. The LLM only decides the order of tool calls and writes prose. The glossary plus normalization resolves every fixture field, so the model never needs to map fields or carry values, and it must not.

The recommended approach is to **build from the tools outward**:
1. A pure domain, the 5 PRD tools and `demo.ts`. These need no API key to verify, and they lock the contract.
2. The DeepSeek adapter (raw `fetch`, `deepseek-flash`, `thinking: disabled`) and an async-generator loop with a **confirmation gate enforced by the server**.
3. A Hono SSE endpoint that streams step-level events to a minimal React chat. The LLM calls themselves are non-streaming.
4. An early Render deploy, then docs and the `modulo/` bonus, generated from single sources.

Two design choices make the solution easy to defend:
- **The model never sees or supplies values.** `generar_formulario` reads the values back from the maestro by `ruta`, so CA2 holds by construction.
- **RN4 is a session-level grant, not a model argument.** The grant is scoped to one caso and one turn. The model's `confirmado: true` is never trusted on its own.

The key risks are concrete and known:
- **Date sensitivity.** With today's clock every case is blocked, because the cámara de comercio expired on 2026-09-30. An injectable clock pinned to 2026-09-03 in the demo and tests is mandatory.
- **Stale DeepSeek knowledge.** `deepseek-chat` and `deepseek-reasoner` were retired on 2026-07-24. Thinking mode is on by default and returns 400 if `reasoning_content` is not echoed back.
- **SSE on Bun/Render.** Bun closes idle connections after 10 s, and Render's proxy may buffer the stream.
- **Over-engineering.** A 9-layer Clean Architecture does not fit a 1–2 day window.
- **Leaks.** Both PII and the API key can leak through several channels.

The phase plan below lists the mitigations.

## Key Findings

### Recommended Stack

Every library was exec-verified on Bun 1.4.3. Dependencies are minimal and Bun built-ins cover the rest, so there is no dotenv, uuid, axios, concurrently or jest.

**Core technologies:**
- **Bun 1.4.3**: runtime, test runner (`setSystemTime`), and `bun run --parallel` for one-command dev. Pin the version in `.bun-version` and in the Docker tag `oven/bun:1.4.3-slim`.
- **TypeScript 7.0.2 + Biome 2.5**: Bun runs TypeScript without type-checking, so `tsc --noEmit` must run in `check` and in CI to honor "sin `any`". Use `strict` and `noUncheckedIndexedAccess`.
- **Hono 4.13** on `Bun.serve`:
  - `streamSSE` with `onAbort`.
  - Timing-safe `bearerAuth` for the access code.
  - `serveStatic` for `web/dist`.
  - `app.request()` for tests without a port.
  - Set `idleTimeout: 255` and send a heartbeat every 15 s.
- **zod 4.6.7**: tool args, env, and provider responses. Use the native `z.toJSONSchema` (draft-07, strip `$schema`), not `zod-to-json-schema`.
- **DeepSeek via raw `fetch`**, behind an `LlmAdapter`:
  - Model `deepseek-flash`, read from env.
  - `thinking: {type:"disabled"}` and an explicit `max_tokens`.
  - Don't use the `openai` SDK: its types reject `thinking` and `reasoning_content` (exec-verified), so it would need casts.
- **exceljs 4.4.0** for xlsx: cell-by-cell writes, and strings stay strings.
- **pdf-lib 1.17.1** for the PDF: Helvetica (WinAnsi) covers Spanish characters, but anything outside WinAnsi, including `\n`, throws. Don't use npm `xlsx@0.18.5` (known CVEs) or Puppeteer.
- **React 19.3 + Vite 8.3**: send messages with a `fetch` POST and parse the stream with **eventsource-parser 4.1**. Browser `EventSource` is GET-only and cannot send headers.
- **pino 10.4**: JSON to stdout, `child()` loggers for correlation, and `redact.paths`. Don't configure `transport:` in production.
- **Rate limiting**: a hand-written in-memory limiter of about 30 lines.
- **Render free, Docker runtime**: one service serves the API and the SPA from the same origin, so there is no CORS. Expect a 15-min spin-down, an ephemeral disk and 512 MB of RAM.

The estimated cost is about $0.003–0.013 per case.

### Expected Features

The expected result per case, derived from the fixtures with the date set to 2026-09-03:

| Caso | lleno / faltante / requiere_confirmacion | Result |
|---|---|---|
| `co-industrias-delta` | 17 / 0 / 0 | listo |
| `ec-corp-andina` | 13 / 1 / 1 | always blocked (a required certificate is absent) |
| `hn-agroexport-sula` | 9 / 1 / 1 | blocked (parafiscales expired 2026-08-31) |
| `pa-logistica-istmo` | 8 / 0 / 1 | listo, portal path |

Use this table as the oracle for the golden tests.

**Must have (table stakes):**
- **Tool contract.** Exactly 5 tools named `proveedor_<export>`, with zod `.describe()` on every arg. They never throw and return `{ok,data}` or `{ok:false,error}`. The `caso` argument is validated against path traversal.
- **Three-state mapping.** Only exact or normalized glossary matches count as `lleno`. RN1 sends foreign tax ids to `requiere_confirmacion` with the note "identificador extranjero". "Número de contribuyente especial" and "Referencias comerciales" must end as `faltante`.
- **Form outputs:**
  - xlsx at the exact sheet and cell, label and value, including both CO sheets.
  - A generated PDF in template order, with visible markers for pending fields.
  - Portal: reply "formato no soportado" and write `valores-portal.md`.
- **`armar_paquete`.** The checklist lists presentes, ausentes and vencidos. Faltantes are listed but do not block. `borrador-correo.md` contains no bank data, enforced by an allowlist template and a test.
- **`simular_envio`** runs only after explicit confirmation.
- **Two logs:** `out/log.jsonl` (CA4) and `out/<caso>/log.jsonl` (RN5).
- **Loop and API.** Own loop with a cap of 25, the DeepSeek adapter, sessions, `POST /api/chat` over SSE, `GET /api/sessions/:id`, and `GET /api/health` returning `{ok,provider,model}`.
- **Separation and determinism.** Prompt, knowledge and tools live apart. The clock is injectable. `demo.ts` is deterministic and runs with no key.
- **Chat UI.** History, a "pensando" indicator, tool-call cards (name, redacted args, summary), a confirmation highlight, and clear errors in Spanish.
- **Operations and delivery.** Access code, token and iteration caps, an LLM timeout, a public link, the README, and SOLUCION.md with all 10 sections.

**Should have (differentiators; cheap if done early):**
- **DF-02, value-free `mapeo`:** the LLM never receives values, which makes CA2 structural. This is the strongest differentiator.
- **DF-01 + DF-12:** the confirmation gate is enforced by the server, with Confirmar/Cancelar buttons in the UI.
- **DF-18 + DF-03:** one `redactar()` policy that hides any maestro path not explicitly allowed, plus traceability per value (`ruta`, `regla`, `confianza`).
- **DF-16:** golden tests + CI.
- **DF-17:** `modulo/` generated from the app's sources, with drift and identity tests. Worth the +10 bonus.
- **DF-05:** an artifact panel. Without it, evaluators can't see the generated files on Render's disk.
- **DF-04 + DF-11:** a result card rendered from tool data, plus quick-action chips.
- **DF-08:** treat the solicitud `cuerpo` as untrusted data, as a defense against prompt injection.

**Defer (v2+, only if time allows):**
- DF-15, a degraded mode that works without the LLM.
- DF-06 near-expiry warnings, DF-07 currency notes, DF-10 token meter, DF-13/14 progress and session persistence.

**Anti-features (never build):**
- LLM or fuzzy auto-mapping.
- Real email or portal automation.
- An approval modal for every tool call.
- Showing `reasoning_content`.
- Token-level streaming of tool arguments.
- Inline editing of values.
- Auth or a database.
- **Blocking `simular_envio` when the package is not `listo_para_firma`.** It breaks the PRD §11 script.

### Architecture Approach

Dependencies point inward:
- **Mandated paths stay literal.** These are `agent/prompt.md`, `src/knowledge/registro-proveedor.md`, `src/tools/proveedor.ts`, `src/llm/adapter.ts`, `src/llm/deepseek.ts`, `src/server.ts`, `web/`, `demo.ts` and `modulo/`. Layers are added around them, never instead of them.
- **Business rules live in `src/domain`.** It is pure code with Spanish identifiers.
- **Tools are thin `defineTool` wrappers.** They are wired lazily, so they import with no server and no secrets.
- **The loop is an `async function*`.** It yields typed events, and the HTTP layer maps them to SSE.

**Reconciling with Pitfall 17 (over-engineering):** keep the boundaries from ARCHITECTURE.md but drop the ceremony:
- Directories: `domain/`, `tools/` (use cases inline or in a small `application/`), `llm/`, `loop/`, `http/`, `infra/`.
- Only two real ports, `LlmAdapter` and `Clock`. Everything else gets plain function-typed dependencies.
- No DI framework, and no interface until a second implementation exists.

**Major components:**
1. **`src/domain/*`** (pure rules):
   - Glossary normalization.
   - Mapping into the 3 states, with confianza.
   - Country rules (RN1).
   - Expiry: compares ISO strings, and `null` means "no aplica".
   - Checklist (RN3).
   - Email draft (RN2): its input type excludes `banco`.
   - PII policy.
   - Confirmation classifier: recognizes negations.
2. **`src/tools/proveedor.ts`** + `define-tool.ts` + `wiring.ts`: the 5 exports. Each call runs zod validation, then the use case, then catches any error. Next it builds a PII-safe view with `present()` and a short `resumen`, and writes both jsonl logs. It returns a JSON string and never throws.
3. **`src/infra/*`**: fixture readers validated with zod, a `safe-path` resolver, exceljs/pdf-lib/markdown writers behind a per-caso mutex, the clock, the logger + redaction, and an in-memory session store with TTL/LRU.
4. **`src/llm/*`**:
   - A neutral message model that keeps `llamadaId` pairing and an optional `razonamiento`.
   - An OpenAI-compatible `fetch` client and a DeepSeek factory.
   - `withTimeout`, `withRetry` and optional `withFallback` decorators.
   - A typed `LlmError` (402 → "saldo agotado").
5. **`src/loop/*`**:
   - The `runTurn` generator and a tool registry (`proveedor_<export>`).
   - The confirmation-gate state machine: idle → awaiting{caso} → granted for one turn.
   - Budgets.
   - A stable system prompt (prompt.md + knowledge) so DeepSeek's prefix cache hits.
   - A Spanish error catalog.
   - Sequential dispatch, with an invariant that keeps the tool-call history valid.
6. **`src/http` + `server.ts`** (composition root): routes, SSE framing and heartbeat, access code, rate limit, the static SPA, and an optional JSON fallback. `src/contracts/` holds the event and API types that `web/` imports as types only.
7. **`modulo/`**:
   - `scripts/build-modulo.ts` generates `agent.md` and `SKILL.md` (frontmatter plus the verbatim source body).
   - `tools/proveedor.ts` is a named re-export of the app's tools.
   - A test asserts byte equality and reference identity.
   - The tool context accepts `sessionId` or `sessionID` (OpenCode uses the latter).

### Critical Pitfalls

1. **The execution date flips every outcome.** Today all 4 cases are blocked.
   - Inject a `Clock` with a `FECHA_EJECUCION` override, and compute "today" in `America/Bogota`.
   - Compare ISO strings with a strict `<`, and treat `null` (RUT) as valid.
   - Pin `demo.ts` and the tests to 2026-09-03.
   - Print the effective date in the demo, the checklist and the UI.
2. **Values from the model reach the forms (breaks CA2).**
   - `mapeo` items are `{etiqueta, ruta, estado}` with `.strict()`, so a `valor` key is rejected.
   - `generar_formulario` recomputes the canonical mapping and reads values from the maestro.
   - Write every scalar as a string, so leading zeros survive in `03100012345` and `050021`.
3. **Confirmation decided by the model, or by a naive keyword match.** "No envíes nada todavía" must never count as confirmation.
   - The server grants one confirmation, for one caso and one turn. The grant comes from a deterministic classifier that recognizes negations, or from the UI button.
   - `needsConfirmation` is computed by the server.
   - Don't trust `confirmado:true` alone.
   - Don't require `listo_para_firma`: PRD §11 expects a send for ec-corp-andina, which is always blocked.
4. **Coding against a stale DeepSeek API.**
   - Read the model (`deepseek-flash`) from env, and send `thinking: disabled`.
   - Carry `reasoning_content` in the message type anyway.
   - Retry only 429/500/503 and network errors (max 2, with jitter). Never retry 400/401/402/422.
   - Run a live tool-call spike on day 1.
5. **A broken transcript kills the session (CA5), or the SSE stream dies.**
   - Commit the assistant message and all its tool results together, as one transaction.
   - Run tool calls sequentially, and discard uncommitted steps on abort.
   - For SSE, set `idleTimeout 255` or `server.timeout(req,0)`, send a heartbeat and `X-Accel-Buffering: no`, and smoke-test with `curl -N` on Render on day 1.

Also critical:
- **No `.gitignore` exists yet.** Commit it, with a `.dockerignore`, before anything else.
- **`VITE_`-prefixed env vars** are inlined into the public bundle. The key must not appear in `web/dist`.
- **Path traversal** through `caso`.
- **PII grep:** `71555123|03100012345|COLOCOBM` must return nothing in the logs, the SSE stream or `borrador-correo.md`.
- **Config split:** `demo.ts` must run without a key.
- **Render cold start:** warm `/api/health` and run a pre-flight check before the defense.

## Implications for Roadmap

The structure is coarse: 4 phases over 1–2 days. The critical path is domain → tools → loop → HTTP → deploy. The LLM adapter can be built in parallel with the tools. Deploy a walking skeleton early.

### Phase 1: Foundations + Domain + Tools (deterministic core, no LLM)
**Rationale:** This carries the most rubric weight and the riskiest logic, and everything else depends on the tool contract. It can be verified without spending tokens. Day 1 morning.
**Delivers:**
- Repo hygiene: `.gitignore`, `.dockerignore`, `.env.example`, strict tsconfig, Biome, a `check` script.
- Two-tier config, the Clock, the safe-path helper.
- The pure domain rules and the PII policy/redaction.
- The 5 tools through `defineTool`, in this order: xlsx (P0), markdown, PDF (P1), portal (P2). Plus the paquete and both jsonl logs.
- `demo.ts` and golden tests built from the expected-results table.
- Synthetic fixtures for HU-1 and HU-5 under `tests/fixtures/`.
- `agent/prompt.md` and `src/knowledge/registro-proveedor.md` created in their canonical locations.

**Addresses:** TS-01..TS-16, TS-23, TS-24, TS-29, TS-36, DF-02, DF-03, DF-16, DF-18.
**Avoids:** Pitfalls 1, 2, 3, 9 (gitignore), 10, 12, 13, 15, 18 (domain rules).

### Phase 2: LLM Adapter + Agent Loop + Confirmation Gate
**Rationale:** The loop needs the final tool names and contracts. The adapter part can start in parallel with Phase 1. Day 1 afternoon.
**Delivers:**
- A live DeepSeek spike first.
- The neutral message model, the fetch adapter, the resilience decorators, typed errors, and a FakeLlm for tests.
- The `runTurn` generator, the registry, the gate and its classifier, iteration and token budgets, and a loop guard.
- At the cap, a summary composed by the server.
- The session store and the Spanish error catalog.
- Loop tests:
  - The iteration cap.
  - The gate, including "No envíes…" and the §11 two-message script.
  - CA5: after a timeout or a 503, the next message in the same session works.
  - Parallel tool calls with malformed arguments.
  - A prompt-injection attempt.

**Uses:** zod `toJSONSchema`, raw fetch, `AbortSignal.any`.
**Implements:** `src/llm/*`, `src/loop/*`.
**Avoids:** Pitfalls 4, 5, 6, 7, 8 (retry policy).

### Phase 3: HTTP/SSE API + React Chat + Early Deploy
**Rationale:** This is a thin layer over the generator. Deploy to Render as soon as the SSE endpoint exists, so buffering, cold-start and port problems show up early. End of day 1 or start of day 2.
**Delivers:**
- Hono routes: `/api/chat` (SSE plus a JSON fallback), `/api/sessions/:id` (redacted), and `/api/health`.
- Access code; rate limiting keyed on the first `X-Forwarded-For` hop; a global daily cap.
- Session ids issued by the server, and the static SPA.
- React chat: tool cards, a confirmation banner with Confirmar/Cancelar, error bubbles, a result card, quick chips, and the effective date.
- An artifact panel backed by a download route with a filename whitelist, behind the access code.
- Dockerfile + `render.yaml`, and a live public URL.

**Addresses:** TS-20..TS-22, TS-25..TS-28, TS-30..TS-34, DF-01 UI, DF-04, DF-05, DF-09, DF-11, DF-12.
**Avoids:** Pitfalls 8, 9 (dist grep), 10 (SSE/session redaction), 11, 14.

### Phase 4: Bonus `modulo/` + Docs + Defense Readiness
**Rationale:** This phase depends on the final prompt, knowledge and tools, and the docs need the final decisions. Reserve at least 2 h for SOLUCION.md.
**Delivers:**
- `scripts/build-modulo.ts`, the generated `agent.md` and `SKILL.md`, the re-export, sync/identity/import-without-env tests, and `modulo/README.md`.
- README: link, access code, the one command, and the demo command.
- SOLUCION.md with all 10 sections:
  - Cost per case, from the logged `usage`.
  - The portal design.
  - At least 3 trade-offs, each with the discarded alternative.
  - An HU coverage table.
  - AI usage, including what was discarded.
  - Assumptions: execution date, sending while blocked, and the rubric missing from §10.
- CI running `bun test`, the demo and `tsc`.
- A pre-flight/warm-up script, and a rehearsal of the §11 script on the public link.
- Optional polish: DF-06/07/08/10/14, then DF-15.

**Avoids:** Pitfalls 16, 18, and 14 (defense protocol).

### Phase Ordering Rationale

- **Tools before the loop.** The prompt and registry need the exact tool names. `demo.ts` also gives a rubric-scoring artifact even if the LLM fails.
- **DF-02, DF-18 and the clock go in Phase 1.** Adding them later would mean rewriting the generators, the logs and the snapshots.
- **The `modulo/` layout is decided in Phase 1, even though it is built in Phase 4.** That means canonical file locations and tools free of server imports from the start.
- **Deploy inside Phase 3, not at the end.** Confidence in Render's SSE behavior is LOW, so it must be verified early.

### Research Flags

Needs research or a spike during planning:
- **Phase 2:** a live DeepSeek tool-call round trip covering the model name, thinking disabled, `tool_choice` and error shapes. The model lineup changed 3 times in 2026.
- **Phase 3:** SSE through Render's proxy (community reports conflict) and how Bun behaves when the client disconnects.
- **Phase 4 (light):** OpenCode tool/agent/skill frontmatter and its `sessionID` context field. The docs are first-party but the seam rates them LOW.

Standard patterns (skip research):
- **Phase 1:** the PRD and the fixtures fully specify it, and the library behavior is already exec-verified.

## Open Decisions for the User

All four were **resolved by the user on 2026-10-12** during initialization.

1. **Execution date for the demo and the defense: RESOLVED.** `FECHA_EJECUCION` is configurable through env and defaults to the real date in `America/Bogota`. `demo.ts` and the tests pin 2026-09-03 (the PRD date). The deployed defense instance sets `FECHA_EJECUCION=2026-09-03`. The effective date shows in the UI and in `checklist.md`, and the choice is documented as an assumption in SOLUCION.md.
2. **Can a blocked package be "sent" after explicit confirmation? RESOLVED: yes.** The confirmation question lists the blockers. On explicit confirmation, `ENVIO-SIMULADO.md` is written with the blockers recorded prominently. This keeps the PRD §11 script working for ec-corp-andina.
3. **Portal case: RESOLVED, `ok:true` plus a notice.** `generar_formulario` returns `ok:true, data:{ ruta: "out/<caso>/valores-portal.md", formato: "portal", aviso: "formato no soportado" }`. The agent surfaces the notice and the flow continues to `armar_paquete` (HU-3 P2, HU-5 "continúa", §6.2 `{ruta, formato}`).
4. **Recipient of `borrador-correo.md`: RESOLVED, a reply to the client.** Per PRD §2.1 ("armado del correo de respuesta") and the client emails ("remitirlo firmado… junto con…"), it is drafted now and sent after the signature:
   - To: `solicitud.de`.
   - Subject: "RE: <asunto>".
   - Lists the signed form plus the supports.
   - Never contains bank data (RN2).
   - Blockers and faltantes go in `checklist.md`, not in the email.

Secondary decisions, deferred to planning:
- Write `País` as the raw `"CO"`, or map it to a country name?
- For non-CO clients, should "Ingresos anuales" get a COP note or be marked `requiere_confirmacion`?
- What marker goes in a `faltante` cell: empty, or "[PENDIENTE]"?
- Should the PA portal values file include bank data? RN2 allows it in the file, but it must never be echoed in the chat.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Every library was exec-verified on Bun 1.4.3. DeepSeek and Render facts are MEDIUM: official, but they change. |
| Features | HIGH | Derived from the binding PRD and fixtures inspected by hand. UX/HITL patterns are MEDIUM. The rubric's point table is missing from PRD §10. |
| Architecture | HIGH | The boundaries follow the PRD-mandated paths. Some external API details (OpenCode, Bun SSE) come from first-party docs that the seam rates LOW. |
| Pitfalls | MEDIUM-HIGH | Fixture and date pitfalls are HIGH. Platform pitfalls are MEDIUM. Bun abort and pdf-lib edge cases are LOW to MEDIUM. |

**Overall confidence:** HIGH for what to build and in what order. MEDIUM for how the hosted platforms will behave on defense day.

### Gaps to Address

- **Rubric weights are unknown** (PRD §10 has no point table). Treat every "debe", "obligatorio" and "evaluamos" as a line item, keep a traceability checklist, and record the assumption in SOLUCION.md §7.
- **Render SSE buffering:** verify with `curl -N` in Phase 3. If it buffers, fall back to the JSON endpoint, then to Koyeb or Fly with the same Dockerfile.
- **DeepSeek live behavior:** flash may sequence tools badly or reject `tool_choice`. Verify in the Phase 2 spike. Fallbacks are `deepseek-v4-pro` through config, or a deterministic pipeline.
- **Architecture depth vs time:** ARCHITECTURE.md proposes about 9 layers and PITFALLS.md warns against the ceremony. Resolve it at planning time: keep the boundaries with few files.
- **Minor conflicts:**
  - Sources disagree on Render's native Bun default (1.3.4 vs 1.4.2). It doesn't matter with the Docker runtime.
  - PITFALLS.md mentions `@microsoft/fetch-event-source` and STACK.md prefers eventsource-parser, which is maintained. Use eventsource-parser.
- **Git identity:** the local repo config is already set to `elianatorres5772 <elianatorres5772@gmail.com>`.

## Sources

### Primary (HIGH confidence)
- `reto-01/PRD.md` v2.0: HU-1..5, CA1..5, RN1..5, §6.1–6.6, §7.4, §8, §9, §11.
- `reto-01/fixtures/reto-01/**`: maestro, glossary, supports index and the 4 cases, inspected by hand.
- Local exec spikes on Bun 1.4.3 and 1.3.10:
  - zod `toJSONSchema`.
  - exceljs and SheetJS.
  - pdf-lib and pdfkit.
  - pino.
  - Hono SSE.
  - Vite 8 build.
  - `tsc` 7 against the `openai` SDK types.
- npm registry versions (2026-10-12).

### Secondary (MEDIUM confidence)
- api-docs.deepseek.com: pricing, updates/retirements, tool_calls, thinking_mode, create-chat-completion, error codes, rate limit, KV cache.
- Platform docs:
  - render.com/docs: free, web-services, bun-version.
  - bun.com/docs: HTTP server, SSE guide, Docker.
  - hono.dev streaming, zod.dev json-schema, Vite `envPrefix`.
- HITL and tool-UI patterns: LangChain frontend, MUI X, Ably, n8n, HeroUI.
- Document-AI confidence scoring: Landing AI, Nutrient.
- PII redaction: MLflow, Wavect.
- opencode.ai docs: custom tools, agents, skills (seam-rated LOW).

### Tertiary (LOW confidence)
- Render community threads on SSE buffering; a third-party review of Render's plan (512 MB, build minutes).
- Secondary coverage of the Bun 1.4 rewrite and the TS 7 API; the pdf-lib WinAnsi issue thread; Bun abort-on-disconnect (Harper PR).

---
*Research completed: 2026-10-12*
*Ready for roadmap: yes*
