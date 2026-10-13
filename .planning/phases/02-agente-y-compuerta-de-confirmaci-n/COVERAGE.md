# API Coverage — OpenAI-compatible Chat Completions (DeepSeek preset)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.

Scope: the generic OpenAI-compatible adapter of Phase 2 (D-59). DeepSeek is the default preset and the only provider verified live, in the 2026-10-13 spike recorded in 02-RESEARCH.md. The other providers are configuration over the same capability surface.

| capability | decision | reason |
|---|---|---|
| chat-completions-non-streaming (POST /chat/completions, stream false) | INTEGRATE | |
| tool-calling (tools, tool_calls, tool messages) | INTEGRATE | |
| tool-choice-auto | INTEGRATE | |
| tool-choice-none (tools-disabled summary call at the cap) | INTEGRATE | |
| tool-choice-required-or-named-function | OPT-OUT | not needed: the gate is enforced by the server, and DeepSeek rejects it in thinking mode |
| parallel-tool-calls parameter | OPT-OUT | not needed: the loop executes the returned calls sequentially by design (AGT-01), so the parameter is never sent |
| thinking-mode toggle (thinking {type}) | INTEGRATE | |
| reasoning-content pass-back | INTEGRATE | |
| reasoning-effort parameter | OPT-OUT | not needed: thinking is disabled in the preset; providers that need it use the thinking capability flag |
| max-tokens / max-completion-tokens | INTEGRATE | |
| temperature | INTEGRATE | |
| top-p, presence/frequency penalties, stop sequences, seed | OPT-OUT | not needed: temperature 0 and server-side caps cover determinism and cost |
| usage reporting (prompt, completion, cache hit fields) | INTEGRATE | |
| automatic context caching (stable system prefix) | INTEGRATE | |
| streaming responses (stream true, token deltas) | OPT-OUT | explicitly out of scope: REQUIREMENTS "Streaming token a token de los args de las tools"; Phase 3 streams per step over SSE |
| json-output mode (response_format json_object) | OPT-OUT | not needed: the tools return JSON and the model writes prose (STACK.md) |
| strict tool schemas (/beta endpoint, strict true) | OPT-OUT | not needed: server-side zod validation is the guarantee; schemas stay strict-compatible for a later flip |
| logprobs / top-logprobs | OPT-OUT | not needed: no consumer, and Groq rejects them |
| fim-completion (beta) | OPT-OUT | not needed: not a chat use case |
| chat-prefix-completion (beta) | OPT-OUT | not needed: not a chat use case |
| list-models (GET /models) | OPT-OUT | not needed: the model comes from env, /api/health (Phase 3) reports the configured model without a provider call, and the live test asserts the answering model |
| user-balance (GET /user/balance) | OPT-OUT | not needed yet: DeepSeek-only, which breaks D-59 genericity; a 402 maps to "saldo agotado", and Phase 3 (LLM-06) decides how health reports balance |
| anthropic-format endpoint (/anthropic) | OPT-OUT | not needed: the OpenAI-compatible format covers every configured provider |
| error statuses 400, 401, 402, 403, 404, 422, 429, 5xx | INTEGRATE | |
| Retry-After header on 429 | INTEGRATE | |
| keep-alive blank lines before the JSON body | INTEGRATE | |
| finish-reasons (stop, length, tool_calls, content_filter, insufficient_*, error) | INTEGRATE | |

## Second slot (fallback, D-52)

The fallback slot (LLM_FALLBACK_*) uses the same adapter and the same capability surface as the primary. No capability is opted out only for the fallback: every INTEGRATE row above applies to both slots through the same per-slot capability flags.
