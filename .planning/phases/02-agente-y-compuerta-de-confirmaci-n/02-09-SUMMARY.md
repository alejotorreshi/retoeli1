---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 09
subsystem: agent
tags: [prompt, knowledge, hot-edit, pii, ca2, live, deepseek, agt-02, agt-03, llm-01, llm-02, llm-04, demo-03]
status: complete
requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "02-01: createInstructionsLoader and the first prompt and knowledge drafts; 02-06: crearAgentePrueba, historialIntegro, sensiblesDelMaestro, limpiarMarkdown and the server gate; 02-07: session budget; 02-08: crearAgente with destinoLogs, resilience and correlated logs"
provides:
  - "Final agent/prompt.md (behavior: role, CA2 rules, untrusted data, D-43 plain-text summary headings, D-45 detail, D-47 masked value answers, confirmation protocol)"
  - "Final src/knowledge/registro-proveedor.md (process: five tools in order, field states, supports and bloqueos, formats, RN1 to RN5 in prose, one action per CODIGO_ERROR value plus HERRAMIENTA_DESCONOCIDA and ARGUMENTOS_TRUNCADOS, several cases)"
  - "tests/contract/instrucciones-agente.test.ts, tests/loop/instrucciones.test.ts, tests/loop/pii-modelo.test.ts"
  - "tests/live/agente-en-vivo.test.ts and the package.json script test:vivo (LLM_EN_VIVO=1)"
  - "REQUIREMENTS.md LLM-01, LLM-02 and LLM-04 reworded to the D-59 design; SEG-02 row records redactar() for logs and tool summaries"
affects: [phase-03-api-sse, phase-04-modulo, phase-04-solucion]
actuals:
  tokens: 11918
  tasks: 2
  commits: 4
plan_head_before: 2a3405f70d54003ebe944d6f191aac61357e9fdd
plan_head_after: a03c52c29f5275e12ef336e5a4c1193fc608dcd7
tech-stack:
  added: []
  patterns:
    - "Prompt and knowledge are content-contracted by a test: each CODIGO_ERROR value must be explained, every tool name carries proveedor_, and no reglas.json threshold is copied"
    - "Live tests are opt-in by one condition only (LLM_EN_VIVO), so a missing key fails loudly instead of skipping"
    - "A recording fetch keeps request bodies in memory (never headers), so the live run proves the model only sees paths and masked values"
key-files:
  created:
    - tests/contract/instrucciones-agente.test.ts
    - tests/loop/instrucciones.test.ts
    - tests/loop/pii-modelo.test.ts
    - tests/live/agente-en-vivo.test.ts
  modified:
    - agent/prompt.md
    - src/knowledge/registro-proveedor.md
    - package.json
    - .planning/REQUIREMENTS.md
key-decisions:
  - "02-09: the prompt tells the model to name supports in readable words derived from the tool's tipo (certificado_cumplimiento_tributario becomes Certificado de cumplimiento tributario); tools keep returning raw ids (contract v1)"
  - "02-09: the closing question must be the last sentence and no sections outside the D-43 shape are allowed; avisos of present supports go as bullets under Soportes por actualizar"
  - "02-09: the live test runs both sessions on one temp project, so 'ENVIO-SIMULADO.md only under ec' is checked against a real co package too"
requirements-completed: [AGT-02, AGT-03, LLM-01, LLM-02, LLM-04, DEMO-03]
duration: 6 min
completed: 2026-10-13
---

# Phase 2 Plan 09: Prompt, conocimiento y corrida en vivo Summary

The prompt and knowledge are final, can be edited hot without code, and are covered by a content contract. A fake-LLM test shows the model never receives a maestro value or a solicitud cuerpo. Criterion 1 and the PRD §11 script both passed live against deepseek-flash.

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-13T20:23:55Z
- **Completed:** 2026-10-13T20:30:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- agent/prompt.md defines behavior only: the D-09 role; the CA2 rules (no value that did not come from a tool, never fill a faltante, only masks); tool and fixture data as untrusted (D-48); the D-43 summary with the headings "Caso:", "Conteos:", "Faltantes:", "Por confirmar:", "Soportes por actualizar:" and "Estado:"; plain text (D-46); the masked value plus maestro ruta plus output file (D-47, with the CONTEXT example); and the confirmation protocol, including CONFIRMACION_REQUERIDA meaning "ask, do not retry".
- src/knowledge/registro-proveedor.md defines the process only. It covers the five tools in order (listing cases with CASO_NO_ENCONTRADO, a campos subset for punctual questions, never passing values to generar), the field states, supports and bloqueos, the formats (portal gets "formato no soportado"), RN1 to RN5 in prose, and one action per code: the 14 CODIGO_ERROR values, plus HERRAMIENTA_DESCONOCIDA and ARGUMENTOS_TRUNCADOS. PAQUETE_DESACTUALIZADO means regenerate, re-arm, show the new state and ask again (D-42). It contains none of the reglas.json thresholds.
- Hot edit: a marker appended to the prompt or the knowledge copy appears in the next request's system prefix. A deleted prompt.md or a whitespace-only registro-proveedor.md gives INSTRUCCIONES_NO_DISPONIBLES with no provider call, and restoring the file recovers the session (AGT-02, ROADMAP criterion 5).
- PII to the model: the full flow runs for co, ec, hn and pa, followed by "¿cuál es el NIT de co-industrias-delta?" with campos ["NIT"]. No sensiblesDelMaestro value and no cuerpo fragment appears in any request message (any role, including tool-call arguments) or in any event. Masks ("•") do reach tool messages, and every request history is intact (AGT-03, CA2, MAP-05).
- The live run of criterion 1 and PRD §11 passed against deepseek-flash. The default `bun test` reports the live test as skipped (950 pass, 1 skip).

## Task Commits

1. **Task 1: prompt and knowledge, plus content, hot-edit and PII tests.** `11c11c8` (docs) and `1883b70` (test).
2. **Task 2: live test, test:vivo script, requirements rewording and the post-run prompt tune.** `9dadd1d` (test) and `a03c52c` (docs).

## Files Created/Modified

- `agent/prompt.md`: the final behavior prompt.
- `src/knowledge/registro-proveedor.md`: the final process knowledge.
- `tests/contract/instrucciones-agente.test.ts`: content contract, with a self-test proving the bare-name detector catches violations.
- `tests/loop/instrucciones.test.ts`: hot-edit and missing or blank file tests.
- `tests/loop/pii-modelo.test.ts`: four real cases plus the NIT follow-up through the fake LLM.
- `tests/live/agente-en-vivo.test.ts`: the opt-in live run of criterion 1 and §11, with the VIVO PASS evidence line.
- `package.json`: the `test:vivo` script.
- `.planning/REQUIREMENTS.md`: LLM-01, LLM-02 and LLM-04 reworded to D-59, and the SEG-02 traceability note.

## Corrida en vivo

| Corrida | Resultado | Modelo | Llamadas | Tokens | Aserción fallida |
|---------|-----------|--------|----------|--------|------------------|
| 1 | PASS | deepseek-flash | 12 | 77468 | ninguna |
| 2 | PASS | deepseek-flash | 12 | 79320 | ninguna |

Run 1 passed with the Task 1 prompt. Its human check found two weak spots. First, the ec reply listed the missing support by its raw id (`certificado_cumplimiento_tributario`) instead of "Certificado de cumplimiento tributario". Second, the co reply added a sentence after its closing question, so the server also appended the deterministic question. Only agent/prompt.md changed (three formatting lines), and run 2 passed with the committed prompt. The third run was not used.

Final evidence line (run 2, verbatim):

VIVO PASS modelo=deepseek-flash llamadas=12 tokens=79320

Human check of the run 2 replies:
- co-industrias-delta: plain Spanish built from tool results only. It gives Caso with out/co-industrias-delta/, 17 llenos, 0 faltantes, 0 por confirmar, the "vence en 27 días" aviso for the Cámara de comercio, LISTO and one closing question. It shows no values.
- PRD §11 turn 1 (ec-corp-andina): plain text with no asterisks, # or tables. It gives Caso with out/ec-corp-andina/, then 13 llenos, 1 faltante and 1 por confirmar. The faltante is "Número de contribuyente especial", and RUC is por confirmar with the "Identificador extranjero" note. The support to update is "Certificado de cumplimiento tributario", the estado is BLOQUEADO with that reason, and the reply closes with a question. No value appears unmasked; in fact no value appears at all. The model's question did not name the caso ("este paquete"), so the server's D-44 net appended the deterministic question with ec-corp-andina and the bloqueo. The gate held either way.
- PRD §11 turn 2 ("envía"): the reply confirms the simulated send for ec-corp-andina only, in out/ec-corp-andina/ENVIO-SIMULADO.md with the bloqueo still in force. It explicitly says no real email was sent and the package was not signed.

## Decisions Made

- Support names: the model renders the tool's tipo in readable words. The tools and the contract v1 ids stay unchanged.
- The closing question is the last sentence, and no sections outside the D-43 shape are allowed. Avisos of present supports go under Soportes por actualizar.
- Both live sessions share one temp project. That way "ENVIO-SIMULADO.md only under ec" is checked with a real co package present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The live reply named the missing support by its raw id and wrote text after the closing question**
- **Found during:** Task 2, human check of live run 1. The automated assertions passed.
- **Issue:** The §11 human check expects "Certificado de cumplimiento tributario", but the model copied the raw tipo from the tool result. In the co reply a sentence followed the question, which caused a duplicated closing question.
- **Fix:** Added three formatting lines to agent/prompt.md: readable support names derived from the tipo, no sections outside the shape, and nothing after the closing question. Then reran live (run 2 PASS). No server code changed.
- **Files modified:** agent/prompt.md
- **Commit:** a03c52c

---

**Total deviations:** 1 auto-fixed (prompt-only, within the plan's "adjust only agent/prompt.md or the knowledge" rule)
**Impact on plan:** None on scope; it spent one of the three allowed live runs.

## Issues Encountered

- 02-08 flagged a risk that a truncated step replays its incomplete arguments in history and the provider answers 400. It did not show up live: neither run produced a `length` finish or a provider error, so this run could not confirm or rule out the risk. It stays open for Phase 3.
- In ec turn 1 the model's closing question did not name the caso, so the server appended the deterministic question (D-44). That is by design. A future prompt line ("la pregunta de cierre nombra el caso") could avoid the double question, but it was not added: it would have left the committed prompt without a passing live run.

## User Setup Required

None. The key was already in the gitignored .env. The test checked it only as a boolean, never printed it, and no command named the file.

## Known Stubs

None.

## Next Phase Readiness

- Phase 2 is complete. Phase 3 can wrap crearAgente and respuestaDeTurno in the API and SSE, and should apply redactar() there (SEG-02 is still partial).
- `bun run test:vivo` is the smoke test to repeat before the defense (cost per run is about 80k tokens on deepseek-flash).

## Self-Check: PASSED

- FOUND: agent/prompt.md, src/knowledge/registro-proveedor.md, tests/contract/instrucciones-agente.test.ts, tests/loop/instrucciones.test.ts, tests/loop/pii-modelo.test.ts, tests/live/agente-en-vivo.test.ts
- FOUND commits: 11c11c8, 1883b70, 9dadd1d, a03c52c
- `bun run check` exit 0; `bun test` 950 pass, 1 skip, 0 fail; `git status --porcelain -- reto-01` empty
