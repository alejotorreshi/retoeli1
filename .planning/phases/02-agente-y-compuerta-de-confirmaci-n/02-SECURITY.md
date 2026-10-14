---
phase: "02"
slug: "agente-y-compuerta-de-confirmaci-n"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-13"
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| backend → LLM provider (HTTPS) | the API key leaves only in the Authorization header; provider error bodies are untrusted | messages, tool schemas, key (header only) |
| LLM provider → agent loop | tool calls, arguments and prose are untrusted model output | tool names, JSON args, assistant text |
| fixture text (solicitud) → model | the request body may carry prompt injection | summarized request fields (no `cuerpo`) |
| analyst message → confirmation gate | only a clear affirmation or send verb may authorize the simulated send | free text, structured confirmation |
| agent loop → simular_envio | the server, never the model, builds `{caso, confirmado:true}` | caso id, grant |
| client session id → session store | ids are untrusted; unknown ids open a new session | session id, turn lease token |
| env / config → crearAgente | URLs, keys and limits validated with zod; errors never echo values | LLM_* settings |
| agent → logs (pino) | logs are read by humans; PII and secrets must be redacted | events, codes, counts |
| live test → console | opt-in, budgeted run against the real provider | replies, VIVO PASS line |
| prompt.md / knowledge (editable) → model | edits are untrusted; the gate lives in code | instructions, rule texts |
| package registry → repo | third-party code enters through bun install | npm packages |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Info disclosure | adapter non-2xx path | high | mitigate | src/llm/adapters/openai-compatible.adapter.ts:79-85,125-128; src/llm/mappers/provider-error.mapper.ts:25-42; tests/loop/trazador-agente.test.ts:270-297 | closed |
| T-02-02 | Info disclosure | API key in events/bodies | high | mitigate | openai-compatible.adapter.ts:67-76; src/loop/wiring/agente.wiring.ts:94-97; trazador-agente.test.ts:226-230 | closed |
| T-02-03 | Tampering | registro-herramientas | medium | mitigate | src/loop/services/registro-herramientas.service.ts:82-97; src/tools/factories/definir-herramienta.factory.ts:61,100-102 | closed |
| T-02-04 | Info disclosure | env.ts key resolution | high | mitigate | src/config/env.ts:122-135,229-234; tests/contract/env-agente.test.ts:53-90,161-191 | closed |
| T-02-05 | EoP | fixture text → model | medium | mitigate | src/application/use-cases/leer-solicitud.use-case.ts:18-27; agent/prompt.md:16; tests/loop/inyeccion.test.ts:88-99 | closed |
| T-02-06 | DoS | memory session store | medium | mitigate | src/infra/sessions/memory-session-store.adapter.ts:22-39,50,71; tests/unit/memory-session-store.adapter.test.ts:78-124 | closed |
| T-02-07 | Tampering | concurrent turns | high | mitigate | src/loop/services/ejecutar-turno.service.ts:147-156; tests/loop/sesion.test.ts:215-240 | closed |
| T-02-08 | Spoofing | client session ids | medium | mitigate | memory-session-store.adapter.ts:48-55; agente.wiring.ts:38-40; sesion.test.ts:185-213 | closed |
| T-02-09 | Info disclosure | crearAgente config errors | medium | mitigate | agente.wiring.ts:128-139; src/config/strings.ts:312-321; env-agente.test.ts:347-359 | closed |
| T-02-10 | EoP | confirmacion.policy | high | mitigate | src/domain/policies/confirmacion.policy.ts:61-89; tests/unit/confirmacion.policy.test.ts:22-65 | closed |
| T-02-11 | Tampering | grant reuse | high | mitigate | src/domain/policies/compuerta.policy.ts:51,62-69; tests/unit/compuerta.policy.test.ts:69-140 | closed |
| T-02-12 | Repudiation | closing question | low | mitigate | src/domain/builders/cierre-turno.builder.ts:10-20; strings.ts:227-238 | closed |
| T-02-13 | Info disclosure | adapter error path | high | mitigate | as T-02-01; tests/unit/openai-compatible.adapter.test.ts:205-233 | closed |
| T-02-14 | DoS (cost) | retry decorator | medium | mitigate | src/llm/decorators/retry.decorator.ts:14-43; src/config/constants/llm.constants.ts:38-44,54,120 | closed |
| T-02-15 | DoS | timeout decorator | medium | mitigate | src/llm/decorators/timeout.decorator.ts:11-17; tests/unit/timeout.decorator.test.ts:23-60 | closed |
| T-02-16 | Info disclosure | fallback decorator | medium | mitigate | src/llm/decorators/fallback.decorator.ts:14-17; env.ts:229-234; tests/unit/fallback.decorator.test.ts:58-124 | closed |
| T-02-17 | Info disclosure | logger adapter | high | mitigate | src/infra/logging/logger.adapter.ts:9-37; src/domain/policies/redaccion.policy.ts:10-57; tests/unit/logger.adapter.test.ts:86-111 | closed |
| T-02-18 | Info disclosure | PII in logs | medium | mitigate | src/config/constants/redaction.constants.ts:11-12; src/loop/services/bitacora-turno.service.ts:17-61; tests/loop/bitacora.test.ts:122-126 | closed |
| T-02-19 | Log injection | logger | low | mitigate | pino escaped JSON; message length only (ejecutar-turno.service.ts:142-146) | closed |
| T-02-20 | EoP | despacho-llamada | high | mitigate | src/loop/services/despacho-llamada.service.ts:61-82; tests/loop/compuerta.test.ts:129-198 | closed |
| T-02-21 | EoP | prompt injection | high | mitigate | leer-solicitud.use-case.ts:18-27; prompt.md:16; inyeccion.test.ts:73-127 | closed |
| T-02-22 | Repudiation | blocked attempts | medium | mitigate | despacho-llamada.service.ts:43-51; inyeccion.test.ts:108-114 | closed |
| T-02-23 | Tampering | grant carry-over | high | mitigate | ejecutar-turno.service.ts:83; src/loop/types/turno.type.ts:33-40; compuerta.policy.ts:59 | closed |
| T-02-24 | DoS (cost) | turn/budget/cap | high | mitigate | src/loop/services/conversacion-turno.service.ts:35-102; tests/loop/tope.test.ts:118-195; tests/loop/presupuesto.test.ts:87-156 | closed |
| T-02-25 | Info disclosure | loop logging | high | mitigate | bitacora-turno.service.ts:9-61; agente.wiring.ts:89-97,122; bitacora.test.ts:63-127 | closed |
| T-02-26 | DoS | session corruption | medium | mitigate | ejecutar-turno.service.ts:68,151-156; src/loop/services/guardado-turno.service.ts:65-74; tests/loop/resiliencia.test.ts:270-357 | closed |
| T-02-27 | Info disclosure | fallback composition | high | mitigate | agente.wiring.ts:74-78; tests/loop/fallback.test.ts:96-123 | closed |
| T-02-28 | Info disclosure | live test | high | mitigate | tests/live/agente-en-vivo.test.ts:67,123,129-132,215-226 | closed |
| T-02-29 | EoP | prompt/knowledge edits | medium | mitigate | gate in code: despacho-llamada.service.ts:61-68; compuerta.policy.ts:50-65 | closed |
| T-02-30 | DoS (cost) | live run | low | mitigate | agente-en-vivo.test.ts:50-51,117,133-138 (opt-in, budget, output cap, 3 turns) | closed |
| T-02-31 | EoP | clasificarConfirmacion | high | mitigate | src/config/constants/confirmation.constants.ts:29-61; confirmacion.policy.test.ts:79-102 | closed |
| T-02-32 | Spoofing | closing question | high | mitigate | cierre-turno.builder.ts:22-53; src/loop/services/cierre-turno.service.ts:25; compuerta.test.ts:232-310 | closed |
| T-02-33 | Repudiation | reply without bloqueos | medium | mitigate | strings.ts:227-231; compuerta.test.ts:283 | closed |
| T-02-34 | DoS | pasoTruncado / toWireToolCall | high | mitigate | src/loop/services/paso-herramientas.service.ts:29-39,88; src/llm/mappers/wire-messages.mapper.ts:37-51 | closed |
| T-02-35 | Info disclosure | replay of partial output | low | mitigate | same as T-02-34 | closed |
| T-02-36 | DoS | session lock lease | medium | mitigate | memory-session-store.adapter.ts:14-20,28-33,57-63; sesion.test.ts:273-326 | closed |
| T-02-37 | Tampering | stale lock holder | high | mitigate | memory-session-store.adapter.ts:65-76; sesion.test.ts:328-380 | closed |
| T-02-38 | Repudiation | failed confirmation turn | medium | mitigate | guardado-turno.service.ts:19-31; tests/loop/compuerta-casos.test.ts:540-592 | closed |
| T-02-39 | EoP | recuperarAutorizado | high | mitigate | compuerta.policy.ts:38-40,125-135; compuerta-casos.test.ts:593-620 | closed |
| T-02-40 | Info disclosure | live run | high | mitigate | agente-en-vivo.test.ts:67,123,215-226; trazador-agente.test.ts:226-227 (see audit note 1) | closed |
| T-02-41 | Spoofing | model lines above server question | low | accept | AR-02-01 | closed |
| T-02-42 | Repudiation | question wording | medium | mitigate | strings.ts:211-238; confirmacion.policy.test.ts:186-225 | closed |
| T-02-43 | EoP | cerrarTurno / aplicarEvento | high | mitigate | compuerta.policy.ts:87,95; guardado-turno.service.ts:48; compuerta-casos.test.ts:309-393 | closed |
| T-02-44 | Repudiation | blocked sends after a send | medium | mitigate | despacho-llamada.service.ts:38-51; compuerta-casos.test.ts:345-361 | closed |
| T-02-45 | Tampering | Sesion.casosEnviados | low | accept | AR-02-02 | closed |
| T-02-46 | EoP | acknowledgement branch | high | mitigate | confirmacion.policy.ts:57-59; confirmacion.policy.test.ts:92-102; compuerta.test.ts:200-217 | closed |
| T-02-47 | EoP | "si"/"sí" folding | high | mitigate | confirmacion.policy.ts:49-55; confirmacion.policy.test.ts:103-116 | closed |
| T-02-48 | Tampering | Unicode variants | low | mitigate | confirmacion.policy.ts:50; src/config/constants/patterns.constants.ts:25 | closed |
| T-02-49 | Info disclosure | config messages | medium | mitigate | strings.ts:312-321,337; env-agente.test.ts:378-395 | closed |
| T-02-50 | Repudiation | startup wording | low | mitigate | env-agente.test.ts:362-404 | closed |
| T-02-51 | EoP | prompt confirmation protocol | low | mitigate | agent/prompt.md:48-57; tests/contract/instrucciones-agente.test.ts:110-131 | closed |
| T-02-52 | Repudiation | model prose about sends | medium | mitigate | prompt.md:55,57; instrucciones-agente.test.ts:111-126 (see audit note 2) | closed |
| T-02-53 | Info disclosure | live run | high | mitigate | same as T-02-40 | closed |
| T-02-54 | EoP | abrirTurno / recuperarAutorizado | high | mitigate | compuerta.policy.ts:46-57,133-143; ejecutar-turno.service.ts:83; compuerta.policy.test.ts:86-110,326-340; compuerta-casos.test.ts:613-640; compuerta.test.ts:225-257 | closed |
| T-02-55 | Spoofing | carried pending case plus new work | high | mitigate | confirmacion.policy.ts:77-79; strings.ts:230-236; confirmacion.policy.test.ts:41; compuerta-casos.test.ts:177-182,664-703 | closed |
| T-02-56 | Repudiation | turn after a non-confirming reply | medium | mitigate | ejecutar-turno.service.ts:80; cierre-turno.service.ts:19-28; compuerta.test.ts:236-245,259-284 | closed |
| T-02-57 | DoS | persisting pending state | low | accept | AR-02-04 | closed |
| T-02-58 | EoP | prompt confirmation protocol (D-63.6) | low | mitigate | despacho-llamada.service.ts:65-68; agent/prompt.md:33,48-54; instrucciones-agente.test.ts:133-159 | closed |
| T-02-59 | EoP | despacharEnvio after a failed send | high | mitigate | despacho-llamada.service.ts:77-78; compuerta.policy.ts:140; compuerta.policy.test.ts:113-120,267-269; compuerta-casos.test.ts:768-873 | closed |
| T-02-60 | Repudiation | failed confirmed send | medium | mitigate | compuerta.policy.ts:102-104; compuerta-casos.test.ts:783-788 | closed |
| T-02-61 | Tampering | FALLIDO for an already-sent case | low | mitigate | compuerta.policy.ts:82; compuerta.policy.test.ts:249-253,262-265 | closed |
| T-02-62 | Info disclosure | multi-issue startup message | medium | mitigate | formatear-issues.util.ts:5-20; env-agente.test.ts:422-425,446,450 | closed |
| T-02-63 | Info disclosure | live run request bodies | high | mitigate | agente-en-vivo.test.ts:230-231,255-259 (commit 87fabe7); closes audit note 1 | closed |
| T-02-64 | DoS (cost) | extra live turns | low | mitigate | agente-en-vivo.test.ts:54-55,129,147-148; single run after the user's "correr" (02-21-SUMMARY.md) | closed |
| T-02-65 | Repudiation | live evidence | medium | mitigate | no assertion relaxed in 87fabe7; VIVO PASS copied verbatim in 02-21-SUMMARY.md and STATE.md | closed |
| T-02-66 | Elevation of privilege | clasificarConfirmacion (rejection before question) | high | mitigate | confirmacion.policy.ts:108-120 (esRechazoExplicito only returns RECHAZA; confirma only via unchanged esConfirmacionClara); allow-list disjoint from NEGACIONES/NEGADORES (confirmation.constants.ts:14-91); confirmacion.policy.test.ts:240-259; old-vs-new sweep of 555,900 messages: 0 changes to confirma/falta_caso | closed |
| T-02-67 | Repudiation | unrelated request with connector word while pending (WR-16) | medium | mitigate | compuerta.test.ts:291-333 (5 phrasings stay pending, one confirmation_required, next "sí" sends exactly once) | closed |
| T-02-68 | Repudiation | negation followed by a question (WR-15) | medium | mitigate | confirmacion.policy.ts:90-106,118-119; compuerta.test.ts:335-369 (5 phrasings cancel, later "sí" blocked with CONFIRMACION_REQUERIDA) | closed |
| T-02-69 | Spoofing | model text vs gate state | low | mitigate | agent/prompt.md:51,53; registro-proveedor.md:42 (RN4); instrucciones-agente.test.ts:163-235 classifies every quoted example; residual covered by AR-02-01 | closed |
| T-02-70 | DoS | PATRON_CLAUSULA on analyst text | low | accept | patterns.constants.ts:23 has no nested quantifier and a single split; 1 MB adversarial inputs ≤ 18 ms; AR-02-05 | closed |
| T-02-71 | DoS | esRechazoExplicito `palabras.slice` per negator (unregistered, found by the 02-22 audit) | low | pending decision | confirmacion.policy.ts:86-95 is quadratic: 60 KB "no lo …" takes 58 ms, 300 KB takes 1,073 ms; runs before any LLM call or budget; no message-size limit until API-04 (Phase 3). Fix: index loop, or accept with API-04 as a dependency | open — below high threshold (non-blocking) |
| T-02-SC | Tampering | npm installs | high | mitigate (02-05) / accept (other plans) | pino pinned 10.3.1; bun.lock committed; `bun audit` clean; AR-02-03 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-41 | Non-question model lines above the server question stay in the reply. The gate still authorizes only the pending case, and the last paragraph is always the server question naming the case and its bloqueos. Carried to SOLUCION.md in Phase 4. | plan 02-10 | 2026-10-13 |
| AR-02-02 | T-02-45 | `Sesion.casosEnviados` lives only in the in-memory store behind the fenced lease; the client cannot write it. A lost session loses the mark together with the packages, so a new armado is required before any send. | plan 02-15 | 2026-10-13 |
| AR-02-03 | T-02-SC | 20 of 21 plans installed no package; package.json and bun.lock changed only in the pino commit (46fe7ba) plus one script line (9dadd1d). `git diff 882f418..HEAD` of the manifests is empty for 02-19..02-21, and `git diff 10a43ad..696e2bb` is empty for 02-22. | plans 02-01..02-22 | 2026-10-13 |
| AR-02-04 | T-02-57 | A pending case persists across turns until a send, an explicit rejection, a caller abort or the session TTL clears it. While pending, every turn re-appends one server paragraph and one event per case, with no extra LLM call (compuerta.test.ts:234). | plan 02-19 | 2026-10-13 |
| AR-02-05 | T-02-70 | `PATRON_CLAUSULA` is one negated character class between optional single marks, so it can split only one way and runs in linear time (1 MB adversarial inputs ≤ 18 ms). The rationale's message-size bound (API-04) is still pending in Phase 3. | plan 02-22 | 2026-10-14 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-13 | 54 | 54 | 0 | gsd-security-auditor |
| 2026-10-13 | 66 | 66 | 0 | gsd-security-auditor (gap closure 02-19..02-21) |
| 2026-10-14 | 72 | 71 | 0 (1 low open, non-blocking: T-02-71) | gsd-security-auditor (gap closure 02-22) |

### Audit notes (non-blocking)

1. **T-02-40 / T-02-53 (resolved by T-02-63):** the live test now checks events, logs and every recorded request body for the key (`tests/live/agente-en-vivo.test.ts:255-259`), with non-empty `cuerpos` and `claves` guarding against a vacuous pass. The authorized run after 02-21 printed VIVO PASS.
2. **T-02-52:** the latest reading of live replies (after 02-18) was done by the executor; the human UAT reading (H1) predates 02-18.
3. **Review ledger:** 02-REVIEW-DISPOSITION.md still lists WR-01 as open; 02-16 fixed it (T-02-46).
4. **Phase 3:** `EntradaTurno.confirmacion` (button) skips the text classifier by design (D-39) and must stay behind auth once exposed over HTTP; R1-WR-04 (per-session budget sidestepped by new sessions) also lands in the Phase 3 HTTP layer.
5. **T-02-71 (open, low, non-blocking):** the 02-22 audit found that the new rejection check is quadratic in message length. It needs a decision: fix it with an index loop, or accept it with the Phase 3 API-04 message limit as a dependency (an 8 KB limit costs about 2 ms).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer), except T-02-71 (low, below the high threshold), which awaits a fix-or-accept decision
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-13; re-verified 2026-10-14 after 02-22
