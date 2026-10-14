---
status: complete
phase: 02-agente-y-compuerta-de-confirmaci-n
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-07-SUMMARY.md, 02-08-SUMMARY.md, 02-09-SUMMARY.md, 02-10-SUMMARY.md, 02-11-SUMMARY.md, 02-12-SUMMARY.md, 02-13-SUMMARY.md, 02-14-SUMMARY.md, 02-VERIFICATION.md, 02-REVIEW-FIX.md, .qa/suites/02.suite.json]
started: 2026-10-13T23:51:05Z
updated: 2026-10-14T00:12:36.141Z
---

## Current Test

[testing complete]

## Tests

### 1. [T01] Cold start: quality gates green from scratch (check + full suite + guardians G1-G16)
expected: bun run check exit 0 (tsc, biome, bun audit); bun test: 0 fail, exactly 1 skip (opt-in live test); guardians G1..G16 present in tests/architecture.test.ts and tests/sin-comentarios.test.ts passes
result: pass

### 2. [T02] Criterion 1 offline: 'procesa el caso co-industrias-delta' runs the tools in sequence through the own loop; model only sees paths and masked values
expected: events show tool_start/tool_end for the 4 tools in order, then text and turn_end; every request body: model == deepseek-flash, thinking disabled (thinking.type == 'disabled'), no agent framework; no sensitive maestro value of co-industrias-delta appears in any request body or event (PII scan with positive control: values present in out/co-industrias-delta/formulario.*); out/co-industrias-delta/formulario.* and paquete/ exist in the scratch copy; final reply is plain Spanish text, last paragraph is the server question for a LISTO case
result: pass

### 3. [T03] Criterion 2: confirmation gate and PRD §11 script (no send without explicit confirmation in the next message)
expected: (a) simular_envio blocked: tool result CONFIRMACION_REQUERIDA, no ENVIO-SIMULADO.md written; model-passed confirmado:true alone never suffices; (b) turn 1 ends with confirmation_required and needsConfirmation, last paragraph = server question naming ec-corp-andina and listing the bloqueo by display name ('Certificado de cumplimiento tributario'); turn 2 writes out/ec-corp-andina/ENVIO-SIMULADO.md exactly once and only for that case; (c) a repeated 'envía' without a new pending case does not write a second ENVIO-SIMULADO.md
result: issue
reported: "T03 no-pass (accepted recommendation): OBS-T03-4 — after a successful send, a model retry of simular_envio re-opens the already-sent case as pending and a later 'envía' rewrites ENVIO-SIMULADO.md (2 send lines in the log); contradicts 'una sola vez y solo para ese caso'"
severity: major

### 4. [T04] CR-01: doubtful phrases never authorize; explicit confirmations do (plus current WR-01 behavior as evidence)
expected: 'y el envío', 'el envío', 'ok, gracias', 'listo, ya', 'vale, el paquete' -> not a confirmation (otro); 'No envíes nada todavía' -> rechaza; 'envía', 'sí', 'confirmo', 'envía ec-corp-andina' -> confirma (for that case); end to end: doubtful phrases leave simular_envio blocked, no ENVIO-SIMULADO.md; record (no assert) the current class of bare acknowledgements 'ok', 'listo', 'vale', 'claro', 'correcto', 'si todo bien' for H2
result: pass

### 5. [T05] CR-02: the server question always closes a pending turn; the model's own closing question is stripped
expected: pending case: last paragraph == server question; the model's closing question is gone; no truncated fragment left; 'sí' after that reply sends once (it answers the server question); control without pending: 'sí' does not send (CONFIRMACION_REQUERIDA if the model tries); record whether a '(¿…?)' note line survives (WR-02 of 02-REVIEW 4c30e81, known open)
result: pass

### 6. [T06] Criterion 3 / CA5: retries with backoff, fallback model, clear Spanish errors (402 = saldo agotado), history intact; CR-03 truncated step
expected: 429/503 retried with growing waits, then success; no error event; primary keeps failing -> fallback model answers (event/log shows the fallback model); 402 -> Spanish message containing 'saldo' (agotado), no key echoed; timeout -> clear Spanish message; next message in the same session works and the request history is intact (previous user/assistant/tool messages replayed, no duplicates); CR-03: no tool executed for the truncated step; every later request body has tool_call arguments that parse as JSON objects ('{}' for the truncated one)
result: pass

### 7. [T07] Criterion 4a: iteration cap and session token budget end in plain language, not an error
expected: iteration cap: final text in Spanish states what was obtained and what is missing; turn_end without a raw error code to the user; token budget: plain Spanish message asking to open a new session; no provider call after the budget is exhausted; record the reply to 'envía' on the exhausted session (known open WR-03)
result: pass

### 8. [T08] Criterion 4b: an instruction injected in the client email body does not change the agent's behavior
expected: the injected text reaches the model only as delimited data (tool result), never as a system/user instruction; no simular_envio and no write outside out/<caso>/ happens because of the injection; the reply does not follow the injected instruction
result: pass

### 9. [T09] Criterion 5a: editing agent/prompt.md or src/knowledge/registro-proveedor.md changes behavior without server code changes
expected: both markers appear in the system content of the next request, with no code change; removing them removes them from the next request
result: pass

### 10. [T10] Criterion 5b: JSON logs carry session, turn and tool-call ids, without key or PII
expected: every agent log line is valid JSON with sessionId and turnId; tool lines carry toolCallId and tool name; the dummy key string never appears in any log line; no sensitive maestro value in agent logs (PII scan with positive control)
result: pass

### 11. [T11] WR-02 (round 1): a confirmation turn cut before the send keeps the case pending
expected: turn 2: no ENVIO-SIMULADO.md, Spanish error, confirmation_required again with the server question as last paragraph; turn 3 writes ENVIO-SIMULADO.md exactly once
result: pass

### 12. [T12] WR-03 (round 1): session lock is a fenced lease; an abandoned turn never locks the session forever
expected: both files pass; the abandoned-iterator, expired-lease and stale-holder cases are present in the run output
result: pass

### 13. [T13] Provider config contract and WR-13 wording: https required except local hosts; missing key message
expected: non-local http -> ok:false CONFIGURACION_LLM_INVALIDA with the new text listing localhost, 127.0.0.1, [::1]; the three local http hosts and https -> ok:true; no key -> PROVEEDOR_SIN_CLAVE with a Spanish message; no key value in any message
result: pass

### 14. [T14] Phase hygiene (02-03 D4, 02-05 D4, 02-06 D6, 02-07 D3, 02-08 D6): pino pin, audit, no console in loop/llm, reto-01 untouched
expected: pino pinned exactly 10.3.1, no pino-pretty dependency; bun audit clean; no console.* in src/loop or src/llm; reto-01/ unchanged since the start of phase 02
result: pass

### 15. [R1] Regression: phase-1 deterministic outputs and tool contract unchanged by phase 02 refactors
expected: demo stdout identical; every out/** artifact equivalent (ignoring volatile fields); tool names, args schemas and descriptions identical (contract v1 lock)
result: pass

### 16. [R2] Regression: phase-1 broad PII scan replayed on HEAD
expected: zero sensitive hits outside formulario and valores-portal.md; positive control finds the values in formulario.xlsx and valores-portal.md
result: pass

### 17. [H1] CA2: read the live replies (02-VERIFICATION human item 1; 02-10 D4, 02-13 D4)
expected: exit 0 and a VIVO PASS line; no sensitive maestro value in the printed replies; co-industrias-delta: plain text built only from tool results; last paragraph is the LISTO server question; §11 turn 1: case, out/ec-corp-andina/, counts, RUC por confirmar with its note, 'Certificado de cumplimiento tributario', BLOQUEADO; no second model question; last paragraph = server question with the readable bloqueo; turn 2: simulated send only for ec-corp-andina, no real email, nothing signed; nothing claimed filled/sent/signed without an ok tool result; never 'registré el envío' without proveedor_simular_envio (WR-04 risk)
result: pass
follow_up: "Confirmation-turn reply repeats the whole turn-1 summary (17 lines) before confirming the send; tracked in gap G-02-21"

### 18. [H2] WR-01 product decision: does a bare acknowledgement ('ok', 'listo', 'vale', 'claro', 'correcto', 'si todo bien') count as explicit confirmation? (02-VERIFICATION human item 2)
expected: (a) accept as implemented and document the risk in SOLUCION.md, or (b) tighten: require a strong affirmation or a send verb (no-pass -> gap)
result: issue
reported: "H2 Endurecer (no-pass): bare acknowledgements ('ok', 'listo', 'vale', 'claro', 'correcto', 'ok ok', 'si todo bien') must not count as explicit confirmation — per RN4, CA3, ENV-02 and D-39 (conservative; doubt gives 'otro' and the agent asks again)"
severity: major

### 19. [H3] WR-13 wording (02-REVIEW-FIX 'requires human verification'): the new insecure-URL message
expected: The text reads clearly for whoever configures the provider
result: issue
reported: "H3 no-pass (menor): fix the double period at the end of the insecure-URL message and drop 'La sesión sigue abierta; puedes volver a intentarlo' for configuration errors raised at agent creation"
severity: minor

### 20. [H4] Reworded server question reads naturally to the analyst (02-14 D4)
expected: Natural Spanish; the case and bloqueos are clear; it promises only what the classifier accepts
result: pass

### 21. [H5] First drafts of agent/prompt.md and src/knowledge/registro-proveedor.md (02-01 D7)
expected: The behavior prompt and the process knowledge are correct and professional for the reto (they are read on every turn)
result: pass
follow_up: "H5 pass con seguimiento + H1 pass con seguimiento: align agent/prompt.md and src/knowledge/registro-proveedor.md with current behavior — the server writes the closing question (CR-02), so the model must not write it; on the confirmation turn reply only with the send result (no repeated case summary, H1); a bare 'ok'/'listo' is not a confirmation (H2)"
severity: minor

### 22. One chat message runs through ejecutarTurno, the real OpenAI-compatible adapter over a fake fetch and the real proveedor_leer_solicitud, yielding typed events in order
expected: One chat message runs through ejecutarTurno, the real OpenAI-compatible adapter over a fake fetch and the real proveedor_leer_solicitud, yielding typed events in order
result: pass
source: automated
coverage_id: 02-01/D1

### 23. Request body carries deepseek-flash, thinking disabled, temperature 0, max_tokens 2048, stream false, tool_choice auto, the five proveedor_ tools with io-input schemas, and Bearer auth
expected: Request body carries deepseek-flash, thinking disabled, temperature 0, max_tokens 2048, stream false, tool_choice auto, the five proveedor_ tools with io-input schemas, and Bearer auth
result: pass
source: automated
coverage_id: 02-01/D2

### 24. A 503 becomes a catalog error event without leaking the key tail, and the session keeps working
expected: A 503 becomes a catalog error event without leaking the key tail, and the session keeps working
result: pass
source: automated
coverage_id: 02-01/D3

### 25. Adapter never throws on an aborted signal and keeps no per-call state across concurrent calls
expected: Adapter never throws on an aborted signal and keeps no per-call state across concurrent calls
result: pass
source: automated
coverage_id: 02-01/D4

### 26. Both D-59 provider slots, capability flags and every cap resolve from env only, with Spanish errors that never echo a key
expected: Both D-59 provider slots, capability flags and every cap resolve from env only, with Spanish errors that never echo a key
result: pass
source: automated
coverage_id: 02-01/D5

### 27. New layers, role folders, code families and pino-in-infra are guarded with violation tests
expected: New layers, role folders, code families and pino-in-infra are guarded with violation tests
result: pass
source: automated
coverage_id: 02-01/D6

### 28. Session store: new, live, unknown, malformed and expired ids; LRU eviction skipping locked sessions; ocupar/liberar; lazy sweep; independent stores
expected: Session store: new, live, unknown, malformed and expired ids; LRU eviction skipping locked sessions; ocupar/liberar; lazy sweep; independent stores
result: pass
source: automated
coverage_id: 02-02/D1

### 29. crearAgente returns the agent with proveedor and modelo from env, PROVEEDOR_SIN_CLAVE without a key, CONFIGURACION_LLM_INVALIDA without the key marker, and makes no request at creation
expected: crearAgente returns the agent with proveedor and modelo from env, PROVEEDOR_SIN_CLAVE without a key, CONFIGURACION_LLM_INVALIDA without the key marker, and makes no request at creation
result: pass
source: automated
coverage_id: 02-02/D2

### 30. messages[1] is TEXTO_CONTEXTO.fecha(FECHA_EJECUCION) and messages[0] is byte-identical across turns, with no date and no session id
expected: messages[1] is TEXTO_CONTEXTO.fecha(FECHA_EJECUCION) and messages[0] is byte-identical across turns, with no date and no session id
result: pass
source: automated
coverage_id: 02-02/D3

### 31. Unknown, malformed and TTL-expired ids start a new server-generated session with the expiry notice as the first text event
expected: Unknown, malformed and TTL-expired ids start a new server-generated session with the expiry notice as the first text event
result: pass
source: automated
coverage_id: 02-02/D4

### 32. A concurrent turn yields turn_start, SESION_OCUPADA and turn_end and leaves the history intact; an abandoned generator releases the lock
expected: A concurrent turn yields turn_start, SESION_OCUPADA and turn_end and leaves the history intact; an abandoned generator releases the lock
result: pass
source: automated
coverage_id: 02-02/D5

### 33. co-industrias-delta runs through crearAgente exactly like the tracer, and the second turn replays an intact history
expected: co-industrias-delta runs through crearAgente exactly like the tracer, and the second turn replays an intact history
result: pass
source: automated
coverage_id: 02-02/D6

### 34. Confirmation classifier reproduces the 43-row RESEARCH Pattern 7 table plus 10 extra rows (punctuation, case, 12/13-word boundary, injection, empty pendientes, non-pending slug, conditional 'si')
expected: Confirmation classifier reproduces the 43-row RESEARCH Pattern 7 table plus 10 extra rows (punctuation, case, 12/13-word boundary, injection, empty pendientes, non-pending slug, conditional 'si')
result: pass
source: automated
coverage_id: 02-03/D1

### 35. Gate transitions: LIBRE never grants, one grant per pending caso, falta_caso keeps casos, rechaza/otro cancel, one-shot evaluarEnvio, revocarAlArmar, in-order cerrarTurno with D-63.1 and abort
expected: Gate transitions: LIBRE never grants, one grant per pending caso, falta_caso keeps casos, rechaza/otro cancel, one-shot evaluarEnvio, revocarAlArmar, in-order cerrarTurno with D-63.1 and abort
result: pass
source: automated
coverage_id: 02-03/D2

### 36. Deterministic closing question for one or several casos ends with '?', names the casos and lists readable bloqueos; cap fallback lists 'Completé' and 'Falta' without markdown
expected: Deterministic closing question for one or several casos ends with '?', names the casos and lists readable bloqueos; cap fallback lists 'Completé' and 'Falta' without markdown
result: pass
source: automated
coverage_id: 02-03/D3

### 37. Every provider failure becomes a typed, key-free ErrorLlm (status, Retry-After, finish_reason, transport, invalid 200), and the F1/F2 401 bodies never leak the key tail
expected: Every provider failure becomes a typed, key-free ErrorLlm (status, Retry-After, finish_reason, transport, invalid 200), and the F1/F2 401 bodies never leak the key tail
result: pass
source: automated
coverage_id: 02-04/D1

### 38. Spike bodies parse (texto null, tool call, usage, cacheHit fallback, keep-alive prefix) and missing usage is estimated from characters
expected: Spike bodies parse (texto null, tool call, usage, cacheHit fallback, keep-alive prefix) and missing usage is estimated from characters
result: pass
source: automated
coverage_id: 02-04/D2

### 39. Capability flags shape the request body (max_completion_tokens, null temperature/thinking, tool_choice none vs omitted tools, reasoning passback) and the adapter source never names a provider
expected: Capability flags shape the request body (max_completion_tokens, null temperature/thinking, tool_choice none vs omitted tools, reasoning passback) and the adapter source never names a provider
result: pass
source: automated
coverage_id: 02-04/D3

### 40. withTimeout, withRetry and withFallback implement LLM-03/LLM-04/D-52, including the composed primary-then-fallback case and the never-fall-back kinds
expected: withTimeout, withRetry and withFallback implement LLM-03/LLM-04/D-52, including the composed primary-then-fallback case and the never-fall-back kinds
result: pass
source: automated
coverage_id: 02-04/D4

### 41. Every TIPO_ERROR_LLM resolves to a non-empty Spanish MENSAJE_AGENTE, and saldo reads 'Saldo agotado'
expected: Every TIPO_ERROR_LLM resolves to a non-empty Spanish MENSAJE_AGENTE, and saldo reads 'Saldo agotado'
result: pass
source: automated
coverage_id: 02-04/D5

### 42. redactar hides sensitive keys at any depth, scrubs secrets in strings with a minimum-length guard, cuts depth, survives cycles and never mutates
expected: redactar hides sensitive keys at any depth, scrubs secrets in strings with a minimum-length guard, cuts depth, survives cycles and never mutates
result: pass
source: automated
coverage_id: 02-05/D1

### 43. createLogger writes one JSON line per event with level, ISO time, msg and fields, and chained children add sesionId, turnoId and llamadaId
expected: createLogger writes one JSON line per event with level, ISO time, msg and fields, and chained children add sesionId, turnoId and llamadaId
result: pass
source: automated
coverage_id: 02-05/D2

### 44. Neither the API key (Zq9X), a sensitive-key value (otra) nor maestro values under valor/valores reach a log line, child bindings included
expected: Neither the API key (Zq9X), a sensitive-key value (otra) nor maestro values under valor/valores reach a log line, child bindings included
result: pass
source: automated
coverage_id: 02-05/D3

### 45. PRD §11 end to end: turn 1 blocks the model's send and asks with the bloqueos; turn 2 'envía' writes ENVIO-SIMULADO.md once; 'No envíes nada todavía' and '¿y si envío?' grant nothing
expected: PRD §11 end to end: turn 1 blocks the model's send and asks with the bloqueos; turn 2 'envía' writes ENVIO-SIMULADO.md once; 'No envíes nada todavía' and '¿y si envío?' grant nothing
result: pass
source: automated
coverage_id: 02-06/D1

### 46. Gate edge cases D-40, D-42, D-63.1, D-63.2, D-38, idempotency and the D-39 button
expected: Gate edge cases D-40, D-42, D-63.1, D-63.2, D-38, idempotency and the D-39 button
result: pass
source: automated
coverage_id: 02-06/D2

### 47. Closing question, confirmation_required events and needsConfirmation computed by the server, also after a provider error
expected: Closing question, confirmation_required events and needsConfirmation computed by the server, also after a provider error
result: pass
source: automated
coverage_id: 02-06/D3

### 48. Plain-text final replies (D-60) and the PRD 6.4 fold
expected: Plain-text final replies (D-60) and the PRD 6.4 fold
result: pass
source: automated
coverage_id: 02-06/D4

### 49. Injected orders in cliente, cuerpo and the chat change nothing; no sensitive maestro value in any request or event
expected: Injected orders in cliente, cuerpo and the chat change nothing; no sensitive maestro value in any request or event
result: pass
source: automated
coverage_id: 02-06/D5

### 50. Session token budget: mid-turn tope_tokens with the completed summary and no error, zero-request turns after exhaustion, cumulative totalSesion, D-63.2 question after arming ec
expected: Session token budget: mid-turn tope_tokens with the completed summary and no error, zero-request turns after exhaustion, cumulative totalSesion, D-63.2 question after arming ec
result: pass
source: automated
coverage_id: 02-07/D1

### 51. Iteration cap: maxIteraciones + 1 requests, tools disabled and trailing instruction only on the last one and never persisted, deterministic fallback on error, tool calls and no budget, summary usage counted, D-60 strip, D-63.2 question
expected: Iteration cap: maxIteraciones + 1 requests, tools disabled and trailing instruction only on the last one and never persisted, deterministic fallback on error, tool calls and no budget, summary usage counted, D-60 strip, D-63.2 question
result: pass
source: automated
coverage_id: 02-07/D2

### 52. CA5 for provider failures through the real decorators: 503 after 1 + LLM_MAX_RETRIES requests, 402 with one request (with and without fallback) and 'Saldo agotado', per-call timeout, each followed by a working turn with an intact replayed history
expected: CA5 for provider failures through the real decorators: 503 after 1 + LLM_MAX_RETRIES requests, 402 with one request (with and without fallback) and 'Saldo agotado', per-call timeout, each followed by a working turn with an intact replayed history
result: pass
source: automated
coverage_id: 02-08/D1

### 53. Fallback composed in crearAgente: 4th request to deepseek-v4-pro on the same URL and key, usage reports the fallback model and counts in totalSesion; a fallback on another host without its own key is never called, with its own key it gets only that key
expected: Fallback composed in crearAgente: 4th request to deepseek-v4-pro on the same URL and key, usage reports the fallback model and counts in totalSesion; a fallback on another host without its own key is never called, with its own key it gets only that key
result: pass
source: automated
coverage_id: 02-08/D2

### 54. Turn deadline, caller abort mid-step, abandoned generator and fin limite truncation never corrupt the session; each is followed by a turn that passes historialIntegro
expected: Turn deadline, caller abort mid-step, abandoned generator and fin limite truncation never corrupt the session; each is followed by a turn that passes historialIntegro
result: pass
source: automated
coverage_id: 02-08/D3

### 55. Correlated JSON log lines with the full event set, no key tail, no message text and no sensitive maestro value; one llm_error per failed attempt and one llm_fallback; tool_start arguments redacted
expected: Correlated JSON log lines with the full event set, no key tail, no message text and no sensitive maestro value; one llm_error per failed attempt and one llm_fallback; tool_start arguments redacted
result: pass
source: automated
coverage_id: 02-08/D4

### 56. sleepWithSignal resolves after the delay, early on abort, never rejects and removes its listener
expected: sleepWithSignal resolves after the delay, early on abort, never rejects and removes its listener
result: pass
source: automated
coverage_id: 02-08/D5

### 57. A turn with a pending case always ends with the server question; an unrelated model question naming the case is removed and the following 'sí' sends exactly once
expected: A turn with a pending case always ends with the server question; an unrelated model question naming the case is removed and the following 'sí' sends exactly once
result: pass
source: automated
coverage_id: 02-10/D1

### 58. The reply text names the case and lists the readable bloqueos even when the model closed with its own send question; the Estado line above it is kept
expected: The reply text names the case and lists the readable bloqueos even when the model closed with its own send question; the Estado line above it is kept
result: pass
source: automated
coverage_id: 02-10/D2

### 59. cierreConPregunta stripping rules pinned row by row, with last-paragraph and no-mangling properties
expected: cierreConPregunta stripping rules pinned row by row, with last-paragraph and no-mangling properties
result: pass
source: automated
coverage_id: 02-10/D3

### 60. A step cut by finish_reason=length is stored with ARGUMENTOS_VACIOS per call, keeps id and nombre, runs no tool, and every later request and sesion.historial carry valid JSON arguments
expected: A step cut by finish_reason=length is stored with ARGUMENTOS_VACIOS per call, keeps id and nombre, runs no tool, and every later request and sesion.historial carry valid JSON arguments
result: pass
source: automated
coverage_id: 02-11/D1

### 61. The wire mapper never sends tool-call arguments that are not a JSON object; valid objects go out byte for byte
expected: The wire mapper never sends tool-call arguments that are not a JSON object; valid objects go out byte for byte
result: pass
source: automated
coverage_id: 02-11/D2

### 62. The DEMO-03 false-green truncation test is replaced by one built from a literal truncated string, with a JSON.parse positive control, and it failed on the old code
expected: The DEMO-03 false-green truncation test is replaced by one built from a literal truncated string, with a JSON.parse positive control, and it failed on the old code
result: pass
source: automated
coverage_id: 02-11/D3

### 63. Leased, fenced session lock in the store: token on ocupar, null while held, takeover after the lease, stale liberar and guardar rejected, held lease blocks TTL and LRU, expired one does not
expected: Leased, fenced session lock in the store: token on ocupar, null while held, takeover after the lease, stale liberar and guardar rejected, held lease blocks TTL and LRU, expired one does not
result: pass
source: automated
coverage_id: 02-12/D1

### 64. A consumer that stops iterating without return() blocks the session only until deadline plus margin, and the lease follows AGENT_TURN_DEADLINE_MS
expected: A consumer that stops iterating without return() blocks the session only until deadline plus margin, and the lease follows AGENT_TURN_DEADLINE_MS
result: pass
source: automated
coverage_id: 02-12/D2

### 65. A stale holder that resumes neither releases the new holder's lock nor overwrites its history, and its turn_end logs sesionGuardada false
expected: A stale holder that resumes neither releases the new holder's lock nor overwrites its history, and its turn_end logs sesionGuardada false
result: pass
source: automated
coverage_id: 02-12/D3

### 66. recuperarAutorizado recovers the unused authorized case only on error and cap endings, and never a revoked, used, unknown or inherited-key case
expected: recuperarAutorizado recovers the unused authorized case only on error and cap endings, and never a revoked, used, unknown or inherited-key case
result: pass
source: automated
coverage_id: 02-13/D1

### 67. A confirmation turn cut by a provider error or missing instructions ends with the error, the server question as last paragraph, one confirmation_required and needsConfirmation true; the next 'envía' sends exactly once
expected: A confirmation turn cut by a provider error or missing instructions ends with the error, the server question as last paragraph, one confirmation_required and needsConfirmation true; the next 'envía' sends exactly once
result: pass
source: automated
coverage_id: 02-13/D2

### 68. A budget-exhausted session keeps the case pending, keeps asking and never sends; a text-only final turn and a caller abort close LIBRE (controls)
expected: A budget-exhausted session keeps the case pending, keeps asking and never sends; a text-only final turn and a caller abort close LIBRE (controls)
result: pass
source: automated
coverage_id: 02-13/D3

### 69. Doubtful phrases with ec-corp-andina pending ('y el envío', 'el envío', 'envío', 'entonces el envío', 'todo bien con el envío', 'ok, gracias', 'listo, gracias', 'vale, el paquete', 'ya lo envié', 'el paquete por enviar', 'ok, el envío', 'claro, gracias') classify as otro, while every pre-existing row and 'vale', 'listo', 'claro, ok', 'sí, gracias', 'sí, el envío' keep confirming
expected: Doubtful phrases with ec-corp-andina pending ('y el envío', 'el envío', 'envío', 'entonces el envío', 'todo bien con el envío', 'ok, gracias', 'listo, gracias', 'vale, el paquete', 'ya lo envié', 'el paquete por enviar', 'ok, el envío', 'claro, gracias') classify as otro, while every pre-existing row and 'vale', 'listo', 'claro, ok', 'sí, gracias', 'sí, el envío' keep confirming
result: pass
source: automated
coverage_id: 02-14/D1

### 70. End to end through the loop, 'y el envío' or 'ok, gracias' after the §11 turn 1 leaves the model's proveedor_simular_envio blocked with CONFIRMACION_REQUERIDA and writes no ENVIO-SIMULADO.md; 'envía' still writes it once
expected: End to end through the loop, 'y el envío' or 'ok, gracias' after the §11 turn 1 leaves the model's proveedor_simular_envio blocked with CONFIRMACION_REQUERIDA and writes no ENVIO-SIMULADO.md; 'envía' still writes it once
result: pass
source: automated
coverage_id: 02-14/D2

### 71. Every quoted example in the server question (one case, blocked, several cases) and in the simular_envio next step classifies as confirma for the case it names; the texts drop 'cualquier otra cosa', stay one paragraph, keep their closing questions, 'con esos bloqueos' and 'envía <caso>'
expected: Every quoted example in the server question (one case, blocked, several cases) and in the simular_envio next step classifies as confirma for the case it names; the texts drop 'cualquier otra cosa', stay one paragraph, keep their closing questions, 'con esos bloqueos' and 'envía <caso>'
result: pass
source: automated
coverage_id: 02-14/D3

## Summary

total: 71
passed: 68
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-3
  truth: "The simulated send of a case happens once: after a successful send, a later blocked simular_envio attempt does not re-open that case as pending, and no second ENVIO-SIMULADO.md write occurs"
  status: failed
  reason: "User reported: T03 no-pass (accepted recommendation): OBS-T03-4 — after a successful send, a model retry of simular_envio re-opens the already-sent case as pending and a later 'envía' rewrites ENVIO-SIMULADO.md (2 send lines in the log); contradicts 'una sola vez y solo para ese caso'"
  severity: major
  test: 3
  artifacts: []
  missing: []
- gap_id: G-02-18
  truth: "A bare acknowledgement or a conditional 'si' never authorizes the simulated send; only strong affirmations or send verbs (D-39 list) confirm"
  status: failed
  reason: "User reported: H2 Endurecer (no-pass): bare acknowledgements ('ok', 'listo', 'vale', 'claro', 'correcto', 'ok ok', 'si todo bien') must not count as explicit confirmation — per RN4, CA3, ENV-02 and D-39 (conservative; doubt gives 'otro' and the agent asks again)"
  severity: major
  test: 18
  artifacts: []
  missing: []
- gap_id: G-02-19
  truth: "The insecure-URL configuration message ends with a single period and does not claim an open session at startup"
  status: failed
  reason: "User reported: H3 no-pass (menor): fix the double period at the end of the insecure-URL message and drop 'La sesión sigue abierta; puedes volver a intentarlo' for configuration errors raised at agent creation"
  severity: minor
  test: 19
  artifacts: []
  missing: []
- gap_id: G-02-21
  truth: "prompt.md and the process knowledge match server-owned closing questions, keep the confirmation-turn reply brief, and treat bare acknowledgements as non-confirmations — prompt/knowledge-only change (AGT-02)"
  status: failed
  reason: "User reported: H5 pass con seguimiento + H1 pass con seguimiento: align agent/prompt.md and src/knowledge/registro-proveedor.md with current behavior — the server writes the closing question (CR-02), so the model must not write it; on the confirmation turn reply only with the send result (no repeated case summary, H1); a bare 'ok'/'listo' is not a confirmation (H2)"
  severity: minor
  test: 21
  artifacts: []
  missing: []
