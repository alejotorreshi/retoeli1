# Stack Research

**Domain:** Conversational LLM agent with typed tool calling that fills supplier-registration forms (TypeScript/Bun backend, React+Vite SSE chat, DeepSeek, xlsx/pdf output, Render free deploy)
**Researched:** 2026-10-12
**Confidence:** HIGH overall. Library behavior was verified by running code locally on Bun 1.4.3 and Bun 1.3.10. Versions come from the npm registry on 2026-10-12. Provider and hosting facts come from official docs, which the GSD seam rates LOW/MEDIUM by source type; they are flagged below.

> **Confidence legend used in this file**
> - **HIGH (exec-verified)**: I installed it and ran it in a scratch project under Bun 1.4.3 on 2026-10-12: zod→JSON Schema, exceljs and SheetJS write/readback, pdf-lib and pdfkit with Spanish accents, pino redaction, Hono `streamSSE` over `Bun.serve`, `app.request()`, `bun test` + `setSystemTime`, a Vite 8 build under `bun --bun`, `bun run --parallel`, `tsc` 7.0.2, and an `openai` SDK type check.
> - **MEDIUM**: official vendor docs fetched today (api-docs.deepseek.com, render.com/docs, bun.com/docs, zod.dev, hono.dev). The GSD `classify-confidence` seam returns LOW for `webfetch` and MEDIUM for verified `websearch`. I raise official vendor docs to MEDIUM. They are not raised to HIGH because hosted APIs change without a version bump.
> - **LOW**: third-party blogs only. These are marked inline.

---

## TL;DR (prescriptive)

1. **Runtime:** Bun **1.4.3**, pinned in `.bun-version`, `packageManager` and the Docker tag `oven/bun:1.4.3-slim`.
2. **HTTP:** **Hono 4.13** on `Bun.serve`. Use it for `streamSSE`, the built-in `bearerAuth` (access code, timing-safe), `serveStatic` for `web/dist`, and `app.request()` for API tests without a port. Set `idleTimeout: 255` and send an SSE heartbeat every 15 s.
3. **LLM:** DeepSeek through **raw `fetch`** behind your own `LlmAdapter`. Do not use the `openai` SDK. Model **`deepseek-flash`** with **`thinking: { type: "disabled" }`**. `deepseek-chat` and `deepseek-reasoner` were **retired on 2026-07-24**.
4. **Schemas:** **zod 4.6.7**. Tool JSON Schema is built with the native `z.toJSONSchema(z.object(tool.args))`. Do not add `zod-to-json-schema`.
5. **xlsx:** **exceljs 4.4.0**, written cell by cell with `ws.getCell("C3").value = …`. Do not use `xlsx` from npm, which is stuck at 0.18.5 with known CVEs.
6. **PDF:** **pdf-lib 1.17.1** with standard Helvetica (WinAnsi covers á é í ó ú ñ Ñ ¿ ¡ € — “”) plus a ~40-line label/value layout helper with wrapping and pagination.
7. **Front:** **React 19.3 + Vite 8.3 + @vitejs/plugin-react 6.1**. Use `fetch` POST with a streamed body parsed by **eventsource-parser 4.1**. Do not use `EventSource`, which is GET-only and cannot send headers.
8. **Logs:** **pino 10.4** writing JSON to stdout, with `child()` loggers for session/turn/tool correlation and `redact.paths` as defense-in-depth on top of one shared domain `redact()` module. Audit logs (`out/log.jsonl`, `out/<caso>/log.jsonl`) are a separate port written with `appendFile`.
9. **Rate limit:** a hand-written in-memory fixed-window limiter (~30 lines). It is correct because Render free runs a single instance. Add a per-session token budget from DeepSeek `usage`.
10. **Deploy:** Render free with the **Docker runtime** and a `render.yaml` blueprint. One service serves the API and the built SPA from the same origin, so there is no CORS. Note the 15-minute spin-down, ~1 min cold start, ephemeral disk and 512 MB RAM.
11. **Dev:** `bun run dev` runs `bun run --parallel dev:api dev:web`, which is built in, so you don't need `concurrently`. `bun test` is the only test runner. `tsc` 7 (native) or `bun check` handles type checking, and Biome 2.5 handles lint and format.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|---|---|---|---|---|
| **Bun** | **1.4.3** (released 2026-10-10) | Runtime, package manager, test runner, `.env` loader, script runner | The PRD uses `bun run demo.ts`. Bun runs TS natively with no build step for the backend, has `bun test` with `setSystemTime` (needed for the injectable `vigencia_hasta` clock), `bun run --parallel` (one-command dev), and `bun check` (type check, new in 1.4.3). 1.4 is the first Rust-rewrite release. By 1.4.3 the team reports the known regressions are fixed, and every library below was exec-verified on 1.4.3. | HIGH (exec-verified) |
| **TypeScript** | **7.0.2** (native Go `tsc`) | Type checking only (`tsc --noEmit`); Bun strips types at runtime | The PRD requires "sin `any`". TS 7 is the current `latest` and the native compiler is fast. Strict is on by default in 7.x (secondary sources, LOW), but set `"strict": true` explicitly anyway. Exec-verified: `tsc` 7.0.2 runs against `@types/bun` 1.4.3. | HIGH (exec-verified) for running; LOW for the TS7 changelog details |
| **Hono** | **4.13.13** | HTTP routing, middleware, SSE helper, static serving | It is zero-dependency and Bun-first. `streamSSE(c, async s => …)` sets the SSE headers and gives `s.onAbort` (cancel the agent turn when the tab closes) and `s.sleep`. `bearerAuth` is built in and compares timing-safe, which covers the access code. `serveStatic` from `hono/bun` serves `web/dist`. `app.request()` makes API contract tests run without a port. The same app runs on Node if Bun ever blocks you (Docker plan B). Exec-verified SSE over `Bun.serve` and `app.request()` on 1.4.3. | HIGH (exec-verified) |
| **zod** | **4.6.7** | Tool args (PRD-mandated), env/config validation, LLM response validation, API body validation | Native `z.toJSONSchema()` turns each tool's `args` shape into the `parameters` sent to DeepSeek. `.describe()` becomes `description`, `z.object` emits `additionalProperties: false`, and non-optional keys go into `required` (exec-verified). This gives one schema for both runtime validation and the model contract. | HIGH (exec-verified) |
| **DeepSeek API** | model **`deepseek-flash`** (DeepSeek-V4.1-Flash), base URL `https://api.deepseek.com` | LLM behind `LlmAdapter.enviar(mensajes, herramientas)` | It is the user's choice. It is OpenAI-compatible `/chat/completions` with tool calls and has a 1M context. It is very cheap: per 1M tokens at peak, $0.30 input cache-miss, $0.006 cache-hit, $1.20 output, and off-peak is half. Concurrency is 2500 per account. | MEDIUM (official docs) |
| **React** | **19.3.0** | Chat UI | It is the user's and PRD's choice. `useReducer` is enough for chat state, so no state library is needed. | HIGH (exec-verified build) |
| **Vite** | **8.3.4** (Rolldown-based) + **@vitejs/plugin-react 6.1.2** | Front dev server and build | It is the standard React toolchain. Exec-verified: `bun --bun vite build` builds React 19 under Bun 1.4.3 in ~80 ms, with no Node needed inside the `oven/bun` image. The dev proxy `/api → http://localhost:3000` avoids CORS in development. | HIGH (exec-verified) |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---|---|---|---|---|
| **exceljs** | **4.4.0** | Write `out/<caso>/formulario.xlsx` at the exact `hoja`/`celda_etiqueta`/`celda_valor` | P0 xlsx generation. It is MIT, available on npm (no URL dependency) and ships its own `.d.ts`. `ws.getCell("C3").value = v` is the whole API you need, and it can bold the labels. Its main advantage for the "production" story in SOLUCION.md: it **reads and writes real client templates while preserving styles**, which SheetJS Community Edition drops. Caveat: it is dormant (last release Oct 2023). `bun audit` shows one moderate transitive advisory (`uuid` <11.1.1, a v3/v5/v6 `buf` path exceljs doesn't use). It is 22 MB on disk. Exec-verified write and readback on Bun 1.4.3. | HIGH (exec-verified) |
| **pdf-lib** | **1.17.1** | Generate `out/<caso>/formulario.pdf` (label + value in template order) | P1 PDF. It is pure JS, ships TS types, and is promise-based. It writes to `Uint8Array` and from there to `Bun.write`. `StandardFonts.Helvetica` and `HelveticaBold` cover all Spanish characters (WinAnsi). Characters outside WinAnsi (e.g. `✓`, `→`) **throw** `WinAnsi cannot encode`, which fails loudly instead of corrupting silently, so sanitize them or avoid them in PDF text. You write a small layout helper: `font.widthOfTextAtSize` for wrapping and a new page when `y < margin`. Set `setCreationDate`/`setModificationDate` from the injected clock for determinism. Exec-verified. | HIGH (exec-verified) |
| **eventsource-parser** | **4.1.2** | Parse the SSE stream from `fetch` in the browser | The front must POST `{ sessionId, message }` and send the `Authorization` header, which `EventSource` cannot do. Use `res.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream())` (from `eventsource-parser/stream`). It is ~2 KB, has zero deps, is actively maintained (published 2026-10-12) and handles chunk boundaries, comments (heartbeats) and multi-line `data:`. | HIGH (exec-verified import/build); MEDIUM for the stream sub-export (docs) |
| **pino** | **10.4.0** | Structured JSON app logs to stdout (Render captures stdout) | `logger.child({ sessionId, turnId })` and then `.child({ tool })` give the required correlation. `redact: { paths, censor }` is defense-in-depth for known PII paths (exec-verified on Bun). **Do not configure `transport:`** in production, because it uses worker threads and you don't need them. Pipe to `pino-pretty` only in local dev. | HIGH (exec-verified) |
| **pino-pretty** (dev) | **13.2.0** | Human-readable local logs | `bun run src/server.ts \| pino-pretty` in the `dev:api` script only. | MEDIUM |
| **@biomejs/biome** (dev) | **2.5.15** | Lint + format, a single binary | It avoids typescript-eslint, which depends on the TS programmatic API (reportedly not in TS 7.0 until 7.1, LOW). It is fast and needs zero config. Optional but cheap. | MEDIUM (version), LOW (TS7 API claim) |
| **@types/bun** (dev) | **1.4.3** | Types for `Bun.*`, `bun:test` | Always. | HIGH |
| **@types/react**, **@types/react-dom** (dev) | **19.3.0** | React types | Always. | HIGH |

**Built-ins replace these:** `crypto.randomUUID()` (not uuid), `fetch` + `AbortSignal.timeout()` + `AbortSignal.any()` (not axios), Bun's automatic `.env` loading (not dotenv), `bun --watch` (not nodemon or tsx), `bun run --parallel` (not concurrently), `bun test` (not jest or vitest), `node:fs/promises` `appendFile`/`cp`/`rm` (audit logs, copying supports, cleaning `out/`), `Intl.DateTimeFormat` with an explicit `timeZone` (not dayjs or moment).

### Development Tools

| Tool | Purpose | Notes |
|---|---|---|
| `bun test` | Unit, contract, agent-loop-with-fake-LLM and e2e (`demo.ts`) tests | Use `setSystemTime(new Date("2026-09-15"))` from `bun:test` only for the e2e. Domain code should take an injected `Clock` port, not read `Date.now()`. Exec-verified on 1.4.3. 1.4 adds `--parallel`, `--isolate`, `retry`. |
| `tsc --noEmit` (TS 7.0.2) or `bun check` | Type check | Run it in `bun run check` and before the Docker build. `bun run --check demo.ts` refuses to run on type errors (1.4.3). |
| Vite dev server | HMR for `web/` | `server.proxy: { "/api": "http://localhost:3000" }`. |
| Biome | `biome check --write` | Optional; keep the config minimal. |
| `curl -N` | Smoke-test SSE on Render | `curl -N -H "Authorization: Bearer $CODE" -X POST …/api/chat` shows whether the proxy buffers (see Pitfalls). |

---

## DeepSeek API: verified details for the adapter

Source: api-docs.deepseek.com (pricing, tool_calls, thinking_mode, json_mode, create-chat-completion, rate_limit, error_codes, updates), fetched 2026-10-12. **MEDIUM confidence** (official, but hosted and changing fast: the model lineup changed 3 times between April and September 2026).

| Topic | Fact | Implication for the project |
|---|---|---|
| **Model names** | Current: `deepseek-flash` (V4.1-Flash, 2026-09-10) and `deepseek-v4-pro` (V4-Pro-0813). **`deepseek-chat` / `deepseek-reasoner` were retired on 2026-07-24.** `deepseek-v4-flash` still routes to V4.1-Flash temporarily. | Default `DEEPSEEK_MODEL=deepseek-flash`. Keep the model in env/config, never hard-coded in the loop. `/api/health` reports it. Don't write `deepseek-chat` in docs or SOLUCION.md. |
| **Base URL** | `https://api.deepseek.com` (OpenAI format, `POST /chat/completions`). `https://api.deepseek.com/beta` is needed for strict tools. An Anthropic-format endpoint is also at `/anthropic`. | `DEEPSEEK_BASE_URL` in config. |
| **Thinking mode** | **Enabled by default** (`thinking: {type: "enabled"}`, effort `high`). With `tools`, `reasoning_content` **must be passed back on all later requests or the API returns 400**. In thinking mode `temperature` is ignored and `tool_choice: "required"` or a named tool gives 400. | Send **`thinking: { type: "disabled" }`** for the tool loop. It is cheaper, faster, honors `temperature: 0`, and avoids the reasoning round-trip. Still model `reasoning_content?: string` on the assistant message type and echo it back, so that flipping `DEEPSEEK_THINKING=enabled` doesn't break with a 400. |
| **Tool calling** | OpenAI-style `tools: [{type:"function", function:{name, description, parameters}}]` with `tool_choice: none/auto/required/{function}`. Tool names must be unique. The response has `message.tool_calls[].function.arguments` as a **JSON string**. Results go back as `{role:"tool", tool_call_id, content}`. | Parse `arguments` with `JSON.parse` in try/catch, then `z.object(tool.args).safeParse`. On failure, return `{ok:false,error}` as the tool message (PRD 6.2). Tool names: `proveedor_leer_solicitud`, etc. (`[a-zA-Z0-9_-]`). |
| **Strict mode (beta)** | It requires the `/beta` base URL and `strict: true` on every function. Every property must be in `required`, with `additionalProperties: false`. `minLength`/`maxLength`/`minItems`/`maxItems` are **unsupported** (schema rejected). Supported: string `pattern`/`format`, number bounds, `enum`, `anyOf`, `$ref`. | **Don't depend on strict mode.** Zod validation on the server is the real guarantee. Make the schemas strict-compatible anyway: no `.optional()` (use `.nullable()`), and strip the unsupported keywords in a `toJSONSchema` `override`. Then `DEEPSEEK_STRICT_TOOLS=true` becomes a config flip, not a refactor. |
| **JSON output** | `response_format: {type:"json_object"}` needs the word "json" in the prompt, and it "may occasionally return empty content". | **Not needed.** The tools return JSON and the model writes prose. Don't use it for the final answer. |
| **max_tokens** | Default 8K in non-thinking mode, max 384K. | Set `max_tokens` explicitly (e.g. 2048) as a cost cap per call. |
| **Usage** | `usage.prompt_tokens` (= `prompt_cache_hit_tokens` + `prompt_cache_miss_tokens`), `completion_tokens`, `completion_tokens_details.reasoning_tokens`. | Use these for the per-session token budget, cost estimates in logs, and SOLUCION.md §4. Disk context caching is automatic, so a stable system prompt prefix (prompt.md + knowledge) gets cache hits from turn 2 on. |
| **finish_reason** | `stop`, `length`, `content_filter`, `tool_calls`, `insufficient_system_resource`, `aborted`. | Map `insufficient_system_resource`, `length` and `content_filter` to clear Spanish messages (CA5). |
| **Errors** | 400 format, 401 auth, **402 insufficient balance**, 422 params, 429 rate, 500 server, 503 overloaded. | **Retry only 429/500/503 and network/timeout errors** (exponential backoff with jitter, max 2 retries). Never retry 400/401/402/422. 402 gets a dedicated message ("saldo del proveedor agotado"), which matters because the key is prepaid. |
| **Timeouts / keep-alive** | Under load the server sends **empty lines** (non-streaming) or `: keep-alive` comments (streaming). The connection closes if inference hasn't started after 10 min. | Non-streaming + `await res.json()` tolerates leading whitespace. Set your own `AbortSignal.timeout(LLM_TIMEOUT_MS ≈ 45 s)` per call plus a turn deadline (≈ 120 s). Use `AbortSignal.any([timeout, clientAbort])` so a closed tab cancels the call. |
| **Chat Completions limitation** | It does "not support inserting tool calls mid-conversation" (the Responses/Anthropic APIs do). | The standard loop (assistant `tool_calls` → `tool` results → next call) works. Just don't splice synthetic tool calls into history; replay history exactly. |

**Streaming decision:** call DeepSeek **non-streaming** and stream to the browser **at event granularity**: `turn_start`, `thinking`, `tool_call`, `tool_result`, `assistant_message`, `needs_confirmation`, `error`, `done`. You avoid assembling incremental `tool_calls` deltas, and the UI still shows every tool call live, which is what the rubric scores. Token-level text streaming can be added later behind the adapter (`stream: true` + `stream_options.include_usage`).

**Cost estimate (for SOLUCION.md §4, MEDIUM):** about 6 model calls per case × ~6K input tokens (system prompt + knowledge + history; masked values keep the tool results small) ≈ 36K input + ~1.5K output. At peak flash prices the worst case (all cache misses) is about 36K × $0.30/M + 1.5K × $1.20/M ≈ **$0.013 per case**. With prefix cache hits, and off-peak at half price, it lands around **$0.003–0.006**. Recompute from logged `usage` after the first real runs.

### Why raw `fetch` instead of the `openai` npm SDK (7.32.0)

Exec-verified with `tsc` 7.0.2 under `strict`: `client.chat.completions.create({ …, thinking: { type: "disabled" } })` **fails to compile** (TS2769: `thinking` doesn't exist on the params type), and `message.reasoning_content` **doesn't exist** on `ChatCompletionMessage` (TS2339). Using the SDK with DeepSeek's required extras therefore means casts, which go against the PRD's "sin `any`" rule and the project's typed-contracts goal. The SDK's built-in retries (`maxRetries`) would also overlap with the explicit, logged backoff policy the NFRs ask you to show. Raw `fetch` + a zod schema for the response is ~120 lines, has zero dependencies and fully typed DeepSeek fields, and makes the adapter boundary obvious to evaluators. The `OpenAICompatibleAdapter` can still serve OpenAI, Groq or others by changing base URL, model and key.

---

## Installation

Use a single root `package.json` (no workspaces). The front lives in `web/` with its own `vite.config.ts` but shares the root lockfile. That keeps the PRD's "un comando, < 2 min" install to one `bun install`.

```bash
# Runtime deps (backend + tools; needed in the production image)
bun add hono@4.13.13 zod@4.6.7 exceljs@4.4.0 pdf-lib@1.17.1 pino@10.4.0

# Front + tooling (devDependencies: the SPA is prebuilt, so prod install skips them)
bun add -d react@19.3.0 react-dom@19.3.0 eventsource-parser@4.1.2 \
  vite@8.3.4 @vitejs/plugin-react@6.1.2 \
  @types/react@19.3.0 @types/react-dom@19.3.0 @types/bun@1.4.3 \
  typescript@7.0.2 @biomejs/biome@2.5.15 pino-pretty@13.2.0
```

Suggested `package.json` scripts:

```jsonc
{
  "packageManager": "bun@1.4.3",
  "scripts": {
    "dev": "bun run --parallel dev:api dev:web",
    "dev:api": "bun --watch src/server.ts | pino-pretty",
    "dev:web": "bun --bun vite --config web/vite.config.ts",
    "build:web": "bun --bun vite build --config web/vite.config.ts",
    "start": "bun src/server.ts",
    "demo": "bun run demo.ts",
    "test": "bun test",
    "check": "tsc --noEmit && biome check ."
  }
}
```

`tsconfig.json` essentials: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"module": "Preserve"`, `"moduleResolution": "bundler"`, `"verbatimModuleSyntax": true`, `"noEmit": true`, `"types": ["bun"]`, `"jsx": "react-jsx"` (or a separate `web/tsconfig.json` with `"lib": ["DOM", "ESNext"]`). Pair this with Biome's `noExplicitAny: error`.

### Dockerfile (Render plan A and portable plan B)

```dockerfile
FROM oven/bun:1.4.3-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run build:web            # -> web/dist

FROM oven/bun:1.4.3-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4.3-slim AS release
WORKDIR /app
ENV NODE_ENV=production TZ=America/Bogota
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY agent ./agent
COPY modulo ./modulo
COPY reto-01/fixtures ./reto-01/fixtures
COPY --from=build /app/web/dist ./web/dist
RUN mkdir -p /app/out && chown -R bun:bun /app/out
USER bun
EXPOSE 10000
CMD ["bun", "src/server.ts"]
```

- Tags `1.4.3`, `1.4.3-slim`, `1.4.3-alpine` and `1.4.3-distroless` exist on Docker Hub (verified 2026-10-12). Use `-slim` (Debian, glibc) for a small image without musl surprises.
- The server must bind `hostname: "0.0.0.0"` and `port: Number(Bun.env.PORT ?? 3000)`. Render injects `PORT` (default 10000).
- **Fixtures are runtime data**, so copy `reto-01/fixtures`. A missing copy is a classic "works locally, empty on Render" bug.

### `render.yaml` (blueprint)

```yaml
services:
  - type: web
    name: agente-registro-proveedor
    runtime: docker
    plan: free
    healthCheckPath: /api/health
    envVars:
      - key: DEEPSEEK_API_KEY
        sync: false          # entered in dashboard, never in repo
      - key: ACCESS_CODE
        sync: false
      - key: DEEPSEEK_MODEL
        value: deepseek-flash
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| Hono 4.13 on `Bun.serve` | **Plain `Bun.serve({ routes })`** | It is also viable: `routes` supports `/api/sessions/:id` and per-method handlers, and an async generator body gives SSE. Choose it if you want zero HTTP deps. You'd hand-write middleware composition, the SSE framing, abort handling and the timing-safe auth compare (~80 extra lines), and you'd lose `app.request()` for tests. |
| Raw `fetch` DeepSeek adapter | `openai` SDK 7.32 with `baseURL: "https://api.deepseek.com"` | For a quick prototype where TS casts are acceptable. Not here, because of the strict typing and explicit retry requirements (see above). |
| `deepseek-flash`, thinking disabled | `deepseek-v4-pro` (output ~3.3× more expensive) or thinking enabled | Use these if evals show flash mis-sequences tools or skips the confirmation step. Both are a config flip because the adapter carries `reasoning_content`. |
| exceljs 4.4.0 | **SheetJS CE 0.20.3** from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` | It is Apache-2.0, actively maintained, zero deps and 8 MB, and `sheet_add_aoa(ws, [[v]], { origin: "C3" })` works (exec-verified). Choose it if you want an actively maintained lib and don't need styles. Downsides: it is a URL dependency outside npm (Render and Docker build depend on cdn.sheetjs.com), and the Community Edition drops cell styling on read/write, which hurts the "fill the client's real template" production story. |
| pdf-lib 1.17.1 | **pdfkit 0.20.2** | It is actively maintained (Aug–Sep 2026), with automatic text flow, wrapping and pagination. Choose it if the PDF grows into rich layout. Downsides today: 0.20 shipped breaking changes in Aug 2026 while `@types/pdfkit` is still 0.17.6 (types lag the API), and standard fonts **silently** mis-encode non-WinAnsi characters (exec-verified: `✓` renders without error). |
| eventsource-parser | Hand-rolled SSE parser (~40 lines) | It's fine if you want zero front deps. You must handle `\r\n`, multi-line `data:`, comments and chunk splits, which is the bug surface eventsource-parser already covers. |
| pino 10 | Custom ~60-line JSON logger | Acceptable, because PII redaction lives in your own `redact()` module either way. pino wins on `child()` correlation, fast serialization and path-based redaction as a second line of defense, and Bun compatibility is verified. |
| Custom in-memory rate limiter | `hono-rate-limiter` 0.5.4 | It is a pre-1.0 third-party package. Only worth it with multiple instances plus a Redis store, which the free tier never has. |
| Render free (Docker runtime) | Render **native Bun runtime** (auto-detected from `bun.lock`, version via `BUN_VERSION`/`.bun-version`; default 1.3.4 for new services) | It deploys faster with no image build. Use it if Docker builds eat too many of the 500 free build minutes per month. You lose local/prod parity and the portable plan B. |
| Render free | Koyeb / Fly.io / Hugging Face Spaces (Docker) | Same Dockerfile, so this is the fallback if Render cold starts or SSE buffering cause trouble in the defense. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| Model names `deepseek-chat` / `deepseek-reasoner` | **Retired 2026-07-24** (DeepSeek change log). Old tutorials and LLM training data still use them. | `deepseek-flash` via `DEEPSEEK_MODEL` env |
| DeepSeek thinking mode (the default!) in the tool loop without handling `reasoning_content` | It returns **400** on the next request if `reasoning_content` isn't echoed back when tools are present. `tool_choice: "required"` is also rejected. | Send `thinking: {type:"disabled"}` explicitly; carry `reasoning_content` in the message type anyway |
| LangChain, Vercel AI SDK, OpenAI Agents SDK, Mastra | They hide the agent loop, the iteration cap and the provider adapter, which are exactly what the PRD scores (§6.1 "Adaptador LLM", CA1–CA5). They add heavy deps you must justify in SOLUCION.md and explain line by line in the defense. | A hand-written loop (~150 lines) + `LlmAdapter` port |
| `zod-to-json-schema` | It targets zod v3 internals, and zod 4 has native `z.toJSONSchema` (exec-verified output). | `z.toJSONSchema(z.object(args), { target: "draft-07" })`, then delete `$schema` before sending |
| `xlsx` from the npm registry (0.18.5) | It is frozen on npm since 2022 and carries known advisories (prototype pollution CVE-2023-30533, ReDoS CVE-2024-22363). SheetJS publishes only on its own CDN now. Reviewers running `npm audit` will flag it. | exceljs 4.4.0 (or SheetJS 0.20.3 from the CDN tarball) |
| Puppeteer/Playwright HTML→PDF | It downloads Chromium (~300 MB) and won't fit Render free's 512 MB RAM. Slow cold starts. | pdf-lib |
| Filling a real AcroForm | Out of scope per PRD 7/HU-3 (a generated PDF is accepted). | pdf-lib generated document |
| Browser `EventSource` | GET-only, so it can't POST the message body or send `Authorization`. | `fetch` + `ReadableStream` + eventsource-parser |
| WebSockets / socket.io | Bidirectional transport you don't need. Server→client events over one POST is simpler, and Hono has a first-class helper. | SSE via `streamSSE` |
| Express / Fastify on Bun | Node-centric, with heavier middleware chains. Express's streaming ergonomics are worse and you gain nothing on Bun. | Hono |
| dotenv, nodemon, ts-node/tsx, concurrently, jest/vitest, axios, uuid, dayjs/moment | Bun or the platform already provides each of these, and every extra dep must be justified in SOLUCION.md. | Bun built-ins (see the list under Supporting Libraries) |
| pino `transport:` option in production | It spawns worker threads (thread-stream). It's unneeded on stdout and is the historically flaky path on Bun. | Plain `pino()` to stdout; `pino-pretty` only via a dev pipe |
| Databases, Redis, persistent disks | They are a PRD no-goal, and Render free has no persistent disk anyway. | In-memory session store behind a `SessionRepository` port (optionally a JSON file in `out/`), accepting loss on spin-down |
| Tailwind / component kits (MUI, shadcn) | Setup time and deps for a single-screen chat. | Plain CSS (or CSS modules); the UI has 4 components |
| `react-markdown` + plugins | A large dep and an XSS surface if you render model output as HTML. | `white-space: pre-wrap` text; the backend structures the summary |

---

## Stack Patterns by Variant

**If Render SSE turns out to be buffered (events arrive all at once):**
- Send `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`, and emit a `: ping` comment every 15 s.
- Keep a **non-streaming fallback**: `POST /api/chat` with `Accept: application/json` returns `{ reply, toolCalls[], needsConfirmation }` (the PRD 6.4 reference shape) from the same use case. The client can also reconcile through `GET /api/sessions/:id`.
- Because Render community reports conflict (some see buffering, others say SSE works), deploy a walking-skeleton SSE endpoint to Render **in phase 1** and test with `curl -N`.

**If the evaluator's cold start is a risk (free tier spins down after 15 min idle, ~1 min wake):**
- Ping `/api/health` with an external cron (cron-job.org or UptimeRobot) every 10 min during the defense window. One service uses ≤ 744 h of the 750 free h per month.
- Make `/api/health` cheap: no LLM call; it returns `{ ok, provider, model }`.

**If you need to switch LLM provider at the defense:**
- The adapter reads `LLM_PROVIDER`, `*_BASE_URL`, `*_MODEL` and `*_API_KEY`. Any OpenAI-compatible provider reuses `OpenAICompatibleAdapter`. The loop never changes.

**If the PDF template grows beyond label/value lists:**
- Switch to pdfkit 0.20 for flow layout. Keep the `FormRenderer` port so only the renderer changes.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|---|---|---|
| bun@1.4.3 | hono@4.13.13, zod@4.6.7, exceljs@4.4.0, pdf-lib@1.17.1, pdfkit@0.20.2, pino@10.4.0, SheetJS 0.20.3 | All exec-verified on 1.4.3 (and on 1.3.10) on 2026-10-12. |
| vite@8.3.4 | @vitejs/plugin-react@6.1.2 (peer `vite ^8`), react@19.3.0 | Vite declares `node ^20.19 \|\| >=22.12`, but `bun --bun vite build` works without Node (exec-verified), which matters inside `oven/bun` images. |
| typescript@7.0.2 | @types/bun@1.4.3, @types/react@19.3.0 | The native compiler. Tools that need the TS JS API (typescript-eslint, some IDE plugins) may lag (LOW). Biome avoids this. If something breaks, pin `typescript@6.0.2`. |
| zod@4.6.7 | `z.toJSONSchema` default target draft-2020-12 | DeepSeek accepts plain JSON Schema objects. Use `target: "draft-07"` (most widely compatible), strip the `$schema` key, and keep `io: "output"` (the default) so `additionalProperties: false` is emitted. |
| openai@7.32.0 | — | Not used. If you add it later, note `engines.node >= 22` and that its types lack DeepSeek extras. |
| exceljs@4.4.0 | uuid@8 (transitive) | One moderate `bun audit` advisory, not exploitable here. You can add `"overrides": { "uuid": "^11.1.1" }` (uuid 11 still ships CJS), but test it first. |
| Render native Bun runtime | Defaults to Bun 1.3.4 for new services | Irrelevant with the Docker runtime. With native, set `BUN_VERSION=1.4.3` (full semver only). |

---

## Render Free Tier: current limits (for planning)

| Limit | Value | Source / Confidence |
|---|---|---|
| Spin-down | After **15 min** without inbound traffic; wake takes **~1 min** (a loading page is shown to browsers) | render.com/docs/free (MEDIUM) |
| Instance hours | **750 h/month per workspace**; exceeding them suspends all free services until next month | render.com/docs/free (MEDIUM) |
| Filesystem | **Ephemeral**, wiped on redeploy, restart or spin-down. No persistent disk on free. Render "might restart a Free web service at any time" | render.com/docs/free (MEDIUM) |
| Instance size | 512 MB RAM, 0.1 CPU | third-party review, Aug 2026 (LOW) |
| Bandwidth / builds (Hobby workspace, since 2026-08-01) | 5 GB outbound/month; 500 build minutes/month. With no payment method, overage suspends services or disables builds for the month | third-party review (LOW); the official page confirms the overage behavior but not the amounts |
| Networking | Bind `0.0.0.0:$PORT` (default 10000). Outbound SMTP ports blocked. No shell access on free | render.com/docs/web-services, /free (MEDIUM) |
| Secrets | Dashboard env vars; `sync: false` in `render.yaml` keeps values out of the repo | MEDIUM (training knowledge, consistent with docs) |
| SSE | Not documented officially. Community threads conflict (buffering vs works) | community.render.com (LOW). **Verify in phase 1** |

Implications: the `out/` artifacts on Render disappear on spin-down. That's acceptable because the demo is generated live. Say so in SOLUCION.md and README. Sessions in memory are lost on spin-down, so the front should handle an unknown `sessionId` by starting a new session gracefully.

---

## Sources

- npm registry (`npm view`, 2026-10-12): all version numbers and publish dates above. `@microsoft/fetch-event-source` last published 2021, `pdf-lib` last published 2021-11, `exceljs` 4.4.0 2023-10 (HIGH, registry data)
- Local exec spike (scratchpad, Bun 1.4.3 and 1.3.10): zod `toJSONSchema` output; exceljs/SheetJS write + readback at `C3`; pdf-lib Helvetica with "Razón ñ Ñ áéíóú ¿ € — “”" OK, `✓` throws; pdfkit accepts `✓` silently; pino `redact`; Hono `streamSSE` over `Bun.serve` + `app.request`; `bun test` `setSystemTime`; Vite 8 build via `bun --bun`; `bun run --parallel`; `tsc` 7.0.2 rejecting `thinking` and `reasoning_content` on `openai` 7.32 types; `bun audit` (HIGH)
- https://api-docs.deepseek.com/quick_start/pricing: models, 1M context, prices, peak/off-peak, concurrency (MEDIUM)
- https://api-docs.deepseek.com/updates: retirement of deepseek-chat/reasoner (2026-07-24), V4.1-Flash release (2026-09-10) (MEDIUM)
- https://api-docs.deepseek.com/guides/tool_calls: strict mode `/beta`, schema restrictions (MEDIUM)
- https://api-docs.deepseek.com/guides/thinking_mode: default enabled; `reasoning_content` pass-back 400 rule (MEDIUM)
- https://api-docs.deepseek.com/api/create-chat-completion: params, usage fields, finish_reason values (MEDIUM)
- https://api-docs.deepseek.com/guides/json_mode, /quick_start/rate_limit, /quick_start/error_codes (MEDIUM)
- https://bun.com/docs/runtime/http/server: `idleTimeout` default 10 s, max 255, `server.timeout(req, 0)`, routes (MEDIUM)
- https://bun.com/blog, https://bun.com/blog/bun-v1.4: 1.4.0 (2026-08-20, Rust rewrite), 1.4.3 (2026-10-10, `bun check`) (MEDIUM)
- https://bun.com/docs/cli/run (`--parallel`, `--check`) and https://bun.com/docs/guides/ecosystem/docker (MEDIUM). Docker Hub tag API for `oven/bun:1.4.3-*` (HIGH)
- https://zod.dev/json-schema: `toJSONSchema` options (MEDIUM)
- https://hono.dev/docs/helpers/streaming: `streamSSE`, `onAbort` (MEDIUM)
- https://render.com/docs/free, https://render.com/docs/web-services, https://render.com/docs/bun-version (MEDIUM)
- https://jwatte.com/blog/render-com-platform-review.md: Aug 2026 plan change, 512 MB / 0.1 CPU, 5 GB bandwidth, 500 build min (LOW)
- https://community.render.com/t/sse-continually-buffering/3840 and related threads: SSE buffering reports (LOW)
- InfoQ and secondary coverage of the Bun 1.4 Rust rewrite regressions (LOW); secondary coverage of TS 7.0 (strict default, API in 7.1) (LOW)

---
*Stack research for: conversational tool-calling agent (supplier registration), Bun + Hono + DeepSeek + React/Vite, Render free*
*Researched: 2026-10-12*
