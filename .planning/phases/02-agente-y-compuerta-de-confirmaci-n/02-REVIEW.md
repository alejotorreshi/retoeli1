---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-13T20:39:55Z
depth: standard
files_reviewed: 111
files_reviewed_list:
  - .claude/CLAUDE.md
  - .env.example
  - agent/prompt.md
  - docs/estructura.md
  - package.json
  - src/application/types/puertos-agente.type.ts
  - src/config/constants/agent.constants.ts
  - src/config/constants/confirmacion.constants.ts
  - src/config/constants/files.constants.ts
  - src/config/constants/llm.constants.ts
  - src/config/constants/logging.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/config/constants/redaccion.constants.ts
  - src/config/constants/tools.constants.ts
  - src/config/env.ts
  - src/config/strings.ts
  - src/domain/builders/cierre-turno.builder.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/policies/confirmacion.policy.ts
  - src/domain/policies/redaccion.policy.ts
  - src/domain/types/cierre-turno.type.ts
  - src/domain/types/compuerta.type.ts
  - src/domain/types/confirmacion.type.ts
  - src/domain/utils/texto-plano.util.ts
  - src/infra/clock/clock.adapter.ts
  - src/infra/clock/sleep.util.ts
  - src/infra/knowledge/instructions-loader.adapter.ts
  - src/infra/logging/logger.adapter.ts
  - src/infra/sessions/memory-session-store.adapter.ts
  - src/infra/types/logger.type.ts
  - src/infra/types/session-store.type.ts
  - src/knowledge/registro-proveedor.md
  - src/llm/adapters/openai-compatible.adapter.ts
  - src/llm/decorators/fallback.decorator.ts
  - src/llm/decorators/observacion.decorator.ts
  - src/llm/decorators/retry.decorator.ts
  - src/llm/decorators/timeout.decorator.ts
  - src/llm/mappers/provider-error.mapper.ts
  - src/llm/mappers/wire-messages.mapper.ts
  - src/llm/schemas/chat-completion.schema.ts
  - src/llm/types/llm.type.ts
  - src/llm/types/provider.type.ts
  - src/llm/types/resiliencia.type.ts
  - src/loop/schemas/resultado-herramienta.schema.ts
  - src/loop/services/bitacora-turno.service.ts
  - src/loop/services/cierre-turno.service.ts
  - src/loop/services/despacho-llamada.service.ts
  - src/loop/services/ejecutar-turno.service.ts
  - src/loop/services/presupuesto.service.ts
  - src/loop/services/registro-herramientas.service.ts
  - src/loop/services/respuesta-turno.service.ts
  - src/loop/services/tope-iteraciones.service.ts
  - src/loop/types/agente.type.ts
  - src/loop/types/evento.type.ts
  - src/loop/types/turno.type.ts
  - src/loop/wiring/agente.wiring.ts
  - src/tools/wiring/entorno.wiring.ts
  - tests/architecture.test.ts
  - tests/contract/env-agente.test.ts
  - tests/contract/instrucciones-agente.test.ts
  - tests/e2e/pii.test.ts
  - tests/fixtures/casos/zz-inyeccion/plantilla-campos.json
  - tests/fixtures/casos/zz-inyeccion/solicitud.json
  - tests/fixtures/casos/zz-inyeccion/soportes-exigidos.json
  - tests/fixtures/llm/completion-texto.json
  - tests/fixtures/llm/completion-tool-calls.json
  - tests/helpers/adaptador-guion.helper.ts
  - tests/helpers/agente-fetch.helper.ts
  - tests/helpers/agente-prueba.helper.ts
  - tests/helpers/bitacora.helper.ts
  - tests/helpers/eventos.helper.ts
  - tests/helpers/fetch-falso.helper.ts
  - tests/helpers/historial.helper.ts
  - tests/helpers/llm-falso.helper.ts
  - tests/helpers/pii.helper.ts
  - tests/helpers/types/adaptador-guion.type.ts
  - tests/helpers/types/agente-fetch.type.ts
  - tests/helpers/types/agente-prueba.type.ts
  - tests/helpers/types/bitacora.type.ts
  - tests/helpers/types/eventos.type.ts
  - tests/helpers/types/fetch-falso.type.ts
  - tests/helpers/types/llm-falso.type.ts
  - tests/helpers/types/pii.type.ts
  - tests/live/agente-en-vivo.test.ts
  - tests/loop/bitacora.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/loop/fallback.test.ts
  - tests/loop/instrucciones.test.ts
  - tests/loop/inyeccion.test.ts
  - tests/loop/pii-modelo.test.ts
  - tests/loop/presupuesto.test.ts
  - tests/loop/resiliencia.test.ts
  - tests/loop/sesion.test.ts
  - tests/loop/tope.test.ts
  - tests/loop/trazador-agente.test.ts
  - tests/unit/cierre-turno.builder.test.ts
  - tests/unit/clock.adapter.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/confirmacion.policy.test.ts
  - tests/unit/fallback.decorator.test.ts
  - tests/unit/logger.adapter.test.ts
  - tests/unit/memory-session-store.adapter.test.ts
  - tests/unit/observacion.decorator.test.ts
  - tests/unit/openai-compatible.adapter.test.ts
  - tests/unit/provider-error.mapper.test.ts
  - tests/unit/redaccion.policy.test.ts
  - tests/unit/retry.decorator.test.ts
  - tests/unit/sleep.util.test.ts
  - tests/unit/texto-plano.util.test.ts
  - tests/unit/timeout.decorator.test.ts
findings:
  critical: 3
  warning: 6
  info: 8
  total: 17
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-10-13T20:39:55Z
**Depth:** standard
**Files Reviewed:** 111
**Status:** issues_found

## Summary

The review covered the agent loop, the server-side confirmation gate, the OpenAI-compatible adapter and its decorators (timeout, retry, fallback, observation), redaction and logging, the in-memory session store, env parsing, and the tests that claim to prove these. Effort went mostly to `src/**` and to the loop and gate tests. Some unit tests and type-only helpers were only skimmed. `bun run check` and `bun test` pass (950 pass, 1 skip). Several findings below are cases that the passing tests do not cover.

What holds up:
- The model cannot call `proveedor_simular_envio` on its own. An authorization exists only when the server classifies the user's message as a confirmation of a pending case. It is consumed once, revoked if the same case is re-armed, and the dispatcher rewrites the arguments to `{caso, confirmado: true}`. Tool names must match the registry exactly.
- The API key never leaves the process. The adapter discards provider error bodies, swallows fetch exceptions without logging them, keeps zod issues free of input values, and the logger plus `redactar` mask any key at least 8 characters long.

The real gaps are elsewhere:
1. The confirmation classifier treats noun phrases and acknowledgements ("el envío", "ok, gracias") as explicit confirmation.
2. A question written by the model replaces the deterministic question whenever it names the case, so a "sí" to an unrelated question becomes send authorization, and the bloqueos may never be listed.
3. A step that ends with `finish_reason=length` is stored in the session with invalid-JSON tool arguments and is replayed in every later request of that session. The test that claims to cover this uses complete JSON, so it is a false green.

## Critical Issues

### CR-01: "envio" counts as an affirmative verb, so noun phrases and acknowledgements authorize the send

**File:** `src/config/constants/confirmacion.constants.ts:11-41,55` (with `src/domain/policies/confirmacion.policy.ts:37-49`, `src/config/strings.ts:210`)
**Issue:** `"envio"` is in both `VERBOS_ENVIO` (line 36) and `RELLENO` (line 55). It was meant as a noun filler but ends up as an affirmation. Bare acknowledgements like `ok`, `listo`, `claro` and `vale` are also in `AFIRMACIONES`, and `gracias`, `el`, `paquete`, `todo`, `bien` and `con` are filler. Running the classifier with one pending case `ec-corp-andina` gave:
- `"y el envío"`, `"el envío"`, `"envío"`, `"entonces el envío"`, `"todo bien con el envío"` → `confirma`
- `"ok, gracias"`, `"listo, gracias"`, `"vale, el paquete"` → `confirma`

"y el envío" is a status question typed without "?". "ok, gracias" is how people acknowledge a summary. Both trigger a real `simular_envio` that writes `ENVIO-SIMULADO.md`. The server's own deterministic question promises the opposite: `Responde "envía" para registrar el envío simulado, o cualquier otra cosa para no enviarlo`. This breaks the core value ("ninguna acción externa sin confirmación humana explícita") and criterion 2. The 43-row table in `tests/unit/confirmacion.policy.test.ts` has no row for these phrases.
**Fix:** Remove `"envio"` from `VERBOS_ENVIO`, since the noun and the first-person verb cannot be told apart. Require an explicit send verb or a strong affirmation, and stop counting `ok`/`listo`/`claro`/`vale` as authorization when they are paired only with filler. At minimum, make the question text match what the classifier accepts. Add table rows:
```ts
export const VERBOS_ENVIO: ReadonlySet<string> = new Set([
  "envia", "envialo", "enviala", "envie", "enviar", "manda", "mandalo", "despacha",
]);
export const AFIRMACIONES: ReadonlySet<string> = new Set([
  "si", "confirmo", "confirmado", "confirma", "procede", "proceda", "adelante", "hazlo", "autorizo", "autorizado",
]);
```
```ts
["y el envío", UNO, OTRO],
["el envío", UNO, OTRO],
["ok, gracias", UNO, OTRO],
["todo bien con el envío", UNO, OTRO],
```

### CR-02: Any model question that names the case suppresses the deterministic question, so "sí" to an unrelated question authorizes the send and the bloqueos can go unlisted

**File:** `src/domain/policies/compuerta.policy.ts:98-104`, `src/loop/services/cierre-turno.service.ts:18-24`
**Issue:** `necesitaPreguntaDeterminista` returns `false` whenever the model's text ends in `?` and its last paragraph contains every pending slug. Two failure modes follow:
- The model (or fixture text steering it) can end with "¿Quieres que vuelva a generar el formulario de ec-corp-andina?". The server then appends nothing. The analyst's "sí" is classified as `confirma` (the pending state is the only context), and the next turn sends.
- The model can end with "¿Confirmo el envío de ec-corp-andina?" and leave out the blocking reasons. Criterion 2 requires the closing question to list the bloqueos. The structured `confirmation_required` event carries them, but the plain-text contract (and the PRD 6.4 `reply`) does not.

The tests only cover models whose final text does not name the case (`compuerta.test.ts`), so the deterministic question is always appended there. `tests/live/agente-en-vivo.test.ts` asserts only `endsWith("?")` and never checks for the bloqueos in `reply`.
**Fix:** The gate should not rely on text the model wrote. Whenever cases are pending, always append the deterministic question (`preguntaConfirmacion`) as the final paragraph, or replace the model's final question with it:
```ts
function conPregunta(texto: string, pendientes: readonly CasoPendiente[]): string {
  if (pendientes.length === 0) return texto;
  const pregunta = preguntaConfirmacion(pendientes);
  const previo = texto.trimEnd();
  return previo === "" ? pregunta : `${previo}${SEPARADOR_PARRAFOS}${pregunta}`;
}
```
Add a loop test in which the model ends with its own question that names the case but asks about something else, then the user says "sí". Assert that no `ENVIO-SIMULADO.md` is written, or that the server's question is the last paragraph.

### CR-03: A truncated step (`finish_reason=length`) persists invalid-JSON tool arguments that are replayed in every later request of the session

**File:** `src/loop/services/ejecutar-turno.service.ts:193-202`, `src/llm/mappers/wire-messages.mapper.ts:27-33`
**Issue:** `pasoTruncado` stores `asistenteDelPaso(respuesta)` with the original `llamadas`, including the partial `argumentos` string. `guardarSesion` writes it into `sesion.historial`, and `toWireToolCall` sends `arguments` verbatim. A scratch run confirmed it: a turn cut at `{"caso":"co-industrias-delta","mapeo":[{"etiq` sends that exact string as `tool_calls[0].function.arguments` in the next turn's request. OpenAI-compatible backends that parse `function.arguments`, and possibly DeepSeek (not verified live), reject such a request with 400. The adapter maps 400 to `PETICION_INVALIDA`, which is neither retried nor sent to the fallback. Because the bad message is persisted, every later turn of the session fails the same way. That breaks CA5 ("el siguiente mensaje de la misma sesión funciona con el historial íntegro"). This is a realistic path: `generar_formulario` must echo the whole `mapeo` array in its arguments, and the default `LLM_MAX_OUTPUT_TOKENS` is 2048.

The test `tests/loop/resiliencia.test.ts:288-322` is a false green. It builds the "truncated" call with `llamar(...)`, which uses `JSON.stringify` and produces complete JSON, and the fake LLM never validates the replayed history.
**Fix:** Never store truncated arguments. Keep id and name so the tool results still pair, and replace the arguments with valid JSON:
```ts
function pasoTruncado(respuesta: RespuestaLlm): readonly Mensaje[] {
  const codigo = CODIGO_AGENTE.ARGUMENTOS_TRUNCADOS;
  const contenido = JSON.stringify({ ok: false, codigo, error: MENSAJE_AGENTE[codigo] });
  const llamadas = respuesta.llamadas.map((llamada) => ({ ...llamada, argumentos: ARGUMENTOS_VACIOS }));
  return [
    { ...asistenteDelPaso(respuesta), llamadas },
    ...llamadas.map((llamada) => ({ rol: ROL_MENSAJE.HERRAMIENTA, llamadaId: llamada.id, contenido })),
  ];
}
```
(`ARGUMENTOS_VACIOS = "{}"` belongs in `agent.constants.ts`.) Rewrite the test so the argument string really is truncated, and assert that `JSON.parse` succeeds on every `tool_calls[].function.arguments` in every later request.

## Warnings

### WR-01: An abort or deadline in the middle of a step drops the results of tools that already ran (including `simular_envio`) from history, while their gate events still apply

**File:** `src/loop/services/ejecutar-turno.service.ts:204-243,294-296`
**Issue:** `ejecutarPaso` checks `turno.signal.aborted` before each call and returns `null` for the whole step. Calls earlier in the same step have already run, emitted `tool_end` events to the client, and pushed `ARMADO`/`ENVIADO` into `eventosCompuerta`. Their results are never added to `turno.pasos`. On a deadline abort (`motivo: error`, so `abortado: false`), `cerrarTurno` still applies those events:
- the session can end with a pending confirmation and the deterministic question about a package whose `armar_paquete` result the model never saw;
- an executed `simular_envio` is missing from history, so the model may later say nothing was sent. The client's tool cards and the stored history also disagree.
**Fix:** On abort, return the partial step: the assistant message, the results of the calls that ran, and a synthetic `{ok:false, codigo: TURNO_INTERRUMPIDO}` result for each call that did not. That keeps the history valid and faithful:
```ts
if (turno.signal.aborted) return { mensajes: [asistenteDelPaso(respuesta), ...respuestasHerramienta, ...noEjecutadas(resto)], cortado: true };
```

### WR-02: A confirmation turn that fails before sending (provider error, budget, missing instructions, deadline) silently drops the pending case

**File:** `src/domain/policies/compuerta.policy.ts:43-48`, `src/loop/services/ejecutar-turno.service.ts:416,428,310-318`
**Issue:** On `confirma`, `abrirTurno` returns `siguiente: libre` and `arrastrados` is empty, so the authorized case survives only as the per-turn `autorizacion`. If the turn ends before `simular_envio` runs (a 503 after retries and fallback, `TOPE_TOKENS` at turn start, `INSTRUCCIONES_NO_DISPONIBLES`, or the deadline), `cerrarTurno` returns `LIBRE` and `needsConfirmation: false`. The analyst sees a provider error and no question. If they retry with "envía", it is classified against an empty pending set and blocked. Recovering takes a third round trip, through a blocked attempt that re-adds the case from `paquetesConocidos`. That contradicts CA5 for the confirmation step.
**Fix:** In `cerrarCompuerta`, when the turn ends with `porError` or `TOPE_TOKENS` and `turno.autorizacion` is set and unused, carry the authorized case back as pending (from `turno.conocidos`):
```ts
const sinUsar = cierre.porError && turno.autorizacion.caso !== null && !turno.autorizacion.usada;
const arrastrados = sinUsar ? [...turno.arrastrados, ...conocidoDe(turno.autorizacion.caso)] : turno.arrastrados;
```

### WR-03: Session locks have no lease, so a consumer that stops iterating without `return()` locks the session forever

**File:** `src/infra/sessions/memory-session-store.adapter.ts:12-27,56-65`, `src/loop/services/ejecutar-turno.service.ts:412-441`
**Issue:** `liberar` runs only in the generator's `finally`, which runs only when the consumer drains the generator or calls `return()`/`throw()`. A consumer that just stops pulling, for example an SSE handler whose client disconnected while it awaits a write, leaves `locked: true` for good. `isExpired` and `evictBeyondCapacity` both skip locked entries, so that session never expires and never leaves the capacity count. Every later turn gets `SESION_OCUPADA`. The deadline signal does not help, because a suspended generator never observes it. Phase 3's SSE layer will be exactly this kind of consumer.
**Fix:** Store `lockedAt` in the entry and treat a lock older than `deadlineMs` plus a margin as stale in `ocupar`, `isExpired` and eviction. Alternatively, document and test that the HTTP layer must call `iterator.return()` on disconnect.

### WR-04: The cost cap can be bypassed: the token budget is per session, sessions are free to create, and invalid responses are retried without counting their tokens

**File:** `src/loop/services/presupuesto.service.ts:8-14`, `src/infra/sessions/memory-session-store.adapter.ts:35-47`, `src/llm/adapters/openai-compatible.adapter.ts:82-92`, `src/config/constants/llm.constants.ts:38-44`
**Issue:** CLAUDE.md requires a cost cap because "el link es público y la clave es personal". `AGENT_SESSION_TOKEN_BUDGET` resets with each new session, and `abrir(null)` or any unknown id creates one, so no process-wide ceiling exists. Separately, `RESPUESTA_INVALIDA` is retryable. A 200 response that fails `chatCompletionSchema` was already billed, but `parseCompletion` drops its `usage`, so `maxRetries` plus a fallback call can each spend tokens that never reach `tokensUsados`.
**Fix:** Add a global token budget (per process or per day) to `DependenciasTurno` next to the per-session one, checked in `presupuestoAgotado`. Parse `usage` before validating the full schema so a malformed response still counts, or make `RESPUESTA_INVALIDA` non-retryable.

### WR-05: The test helper `sesionActual()` mutates the store and silently creates a new session when the expected one is missing

**File:** `tests/helpers/agente-prueba.helper.ts:81-84`
**Issue:** `sesionActual()` calls `deps.sesiones.abrir(sesionId)`. That refreshes `lastActivity`, can reorder the LRU, and when the session is missing returns a brand-new empty session (`compuerta: LIBRE`, empty history). An assertion such as `expect(sesion.compuerta.tipo).toBe(ESTADO_COMPUERTA.LIBRE)` (`resiliencia.test.ts:246,272`) then passes vacuously if the session was lost. The neighbouring history assertions happen to catch that today, but the helper is a false-green trap for future tests.
**Fix:** Read the session without side effects. Expose a test-only `leer(id)` through the store options, or check that `abrir` returned `nueva: false` and throw otherwise:
```ts
const abierta = deps.sesiones.abrir(sesionId);
if (abierta.nueva) throw new Error("la sesión esperada no existe");
return abierta.sesion;
```

### WR-06: An empty final answer from the model is emitted and stored as an empty reply

**File:** `src/loop/services/ejecutar-turno.service.ts:291-293`
**Issue:** When the model returns no tool calls and `content` is empty or null (STACK.md notes DeepSeek "may occasionally return empty content"), the turn closes with `texto: ""`. `emitirCierre` sends a `text` event with an empty string, and an empty assistant message is saved. Unless a package is pending, the analyst gets a blank reply with `motivo: final` and no explanation.
**Fix:** If the final text is empty, fall back to `cierreDeterminista(turno.llamadas)`, as the iteration-cap path already does:
```ts
const texto = (respuesta.texto ?? "").trim() === "" ? cierreDeterminista(turno.llamadas) : (respuesta.texto ?? "");
return cerrarSinError(MOTIVO_FIN.FINAL, texto, respuesta.razonamiento);
```

## Info

### IN-01: `LONGITUD_MAXIMA_NOMBRE_HERRAMIENTA` is dead, and model-controlled tool names are unbounded

**File:** `src/config/constants/agent.constants.ts:81`, `src/loop/services/ejecutar-turno.service.ts:207`, `src/loop/services/bitacora-turno.service.ts:57`
**Issue:** The constant is never used. `llamada.nombre` comes straight from the model and goes unbounded into `tool_start`/`tool_end` events and log bindings.
**Fix:** Truncate or reject names longer than the constant in `fromToolCall` or the registry, or delete the constant.

### IN-02: The gate re-parses the `armar_paquete` output with a local schema and duplicates the checklist's blocking-reason logic

**File:** `src/loop/services/despacho-llamada.service.ts:96-110`, `src/loop/schemas/resultado-herramienta.schema.ts:13-27`
**Issue:** `motivoDe` re-implements `checklist.builder.ts:21`. If the tool's output shape drifts, `armarPaqueteSchema` fails and no `ARMADO` event is produced. The send still fails closed, but the confirmation question and event disappear without any log line.
**Fix:** Have `armar_paquete` return `motivos_bloqueo` and parse only that, or log a warning when an `ok: true` armado fails the schema.

### IN-03: Agent-creation errors say the session is still open when no session exists

**File:** `src/config/strings.ts:267-272`
**Issue:** `PROVEEDOR_SIN_CLAVE` and `CONFIGURACION_LLM_INVALIDA` are wrapped with `conSesionAbierta` ("La sesión sigue abierta; puedes volver a intentarlo."), but they come back from `crearAgente`, before any session exists, and retrying cannot fix a missing key.
**Fix:** Drop the `conSesionAbierta` wrapper for these two codes.

### IN-04: An unknown or malformed session id is reported as "expired"

**File:** `src/infra/sessions/memory-session-store.adapter.ts:45-47`
**Issue:** Any id the store does not know, including `""` or one that never existed, yields `expirada: true` and the text "La sesión anterior expiró; empezamos de cero."
**Fix:** Treat an empty or malformed id as `null`, meaning a new session without the expiry notice.

### IN-05: The agent clock re-parses the environment on every call and silently diverges from the tools when `FECHA_EJECUCION` is invalid

**File:** `src/loop/wiring/agente.wiring.ts:42-52`
**Issue:** With an invalid `FECHA_EJECUCION`, the system date message falls back to the system clock while every tool returns `CONFIGURACION_INVALIDA`. The model is told one date and the tools refuse to run.
**Fix:** Parse once in `crearAgente` and fail creation with `CONFIGURACION_LLM_INVALIDA` when `readToolEnv()` fails.

### IN-06: Packages already sent stay in `paquetesConocidos`, so a blocked retry re-opens the confirmation for a package that was already sent

**File:** `src/domain/policies/compuerta.policy.ts:61-84`, `src/loop/services/ejecutar-turno.service.ts:227`
**Issue:** After `ENVIADO`, the case stays in `conocidos`. A later blocked `simular_envio` re-adds it as pending, and one more "sí" writes a second simulated send.
**Fix:** Remove the case from `conocidos` when an `ENVIADO` event is applied, or mark it as sent.

### IN-07: Case ids without a hyphen can never be named in a text confirmation

**File:** `src/config/constants/patterns.constants.ts:3,23`, `src/domain/policies/confirmacion.policy.ts:28-35`
**Issue:** `PATRON_CASO` allows `acme`, but `PATRON_SLUG_EN_TEXTO` requires at least one hyphen. With two pending cases, "envía acme" gives `otro`, so such a case can only be confirmed with the structured button.
**Fix:** Match the pending case ids against the words directly instead of relying on the slug regex.

### IN-08: Two system messages are sent, which the generic adapter does not guarantee every provider accepts

**File:** `src/loop/services/ejecutar-turno.service.ts:108-116`
**Issue:** DeepSeek accepts this, but some OpenAI-compatible backends accept only one leading system message. The adapter is presented as provider-agnostic.
**Fix:** Add a capability flag, or document the assumption in `docs/`. Merging the messages would break the cached prefix, so a flag is the cheaper option.

---

_Reviewed: 2026-10-13T20:39:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
