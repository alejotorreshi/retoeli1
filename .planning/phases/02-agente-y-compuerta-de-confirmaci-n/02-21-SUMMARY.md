---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 21
subsystem: live-evidence
tags: [vivo, seg-03, cr-01, d-63.6, d-63.7, deepseek, bun-test]
status: complete

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "D-63.6 gate (02-19) and D-63.7 failed-send re-open plus WR-01 joiner (02-20)"
provides:
  - "Live test checks the key in request bodies, events and logs, with non-vacuity asserts on cuerpos and claves (SECURITY audit note 1, T-02-63)"
  - "Session A of the live test runs criterion 1, then 'ok' (stays pending, server question) and then 'sí' (one simulated send)"
  - "Fresh live evidence after CR-01, WR-01 and WR-02: VIVO PASS modelo=deepseek-flash llamadas=15 tokens=113249"
affects: [phase-03-web-confirmation-card, phase-04-modulo-agent-md]

actuals:
  tokens: 12000
  tasks: 3
  commits: 2
plan_head_before: 093e2afd5e129e617311b392d9c4bf4217c609c0
plan_head_after: ebf2562271255ab160b614ff2aedfb2edb178966

tech-stack:
  added: []
  patterns:
    - "A secret-absence check asserts non-empty inputs first, so it cannot pass on empty data"

key-files:
  created: []
  modified:
    - tests/live/agente-en-vivo.test.ts
    - .planning/STATE.md

key-decisions:
  - "The user answered 'correr' at the Task 2 blocking-human checkpoint; exactly one live run was spent, and it passed"
  - "agent/prompt.md was not changed: every automated assertion passed, so no prompt adjustment or second run was made"
  - "The A2 reply wrote its own confirmation request (without '¿'). It is recorded as an open human-check observation for the end-of-phase UAT, not fixed here, because a fix would need a new go-ahead for a second run"

requirements-completed: []

duration: ~8 min (Task 3; the live run took 25.59 s, 03:03:26Z to 03:03:51Z)
completed: 2026-10-14
---

# Phase 02 Plan 21: Live evidence after CR-01, WR-01 and WR-02 Summary

**The live test now checks the key in request bodies as well as events and logs, and it runs "ok" and then "sí" on co-industrias-delta. One authorized run against deepseek-flash passed: VIVO PASS modelo=deepseek-flash llamadas=15 tokens=113249.**

This plan closes **SECURITY.md audit note 1** (T-02-40, T-02-53) and gives the live evidence for **02-VERIFICATION truths 21 and 28** (and human item 1).

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | The live test checks the key in request bodies too, and session A runs "ok" then "sí" | 87fabe7 | tests/live/agente-en-vivo.test.ts |
| 2 | checkpoint:decision (blocking-human): go-ahead for the single live run | user answered "correr" | none |
| 3 | One opt-in live run, with evidence and a human check of the five replies | ebf2562 | .planning/STATE.md |

## Corrida en vivo

The user's answer at Task 2 was **"correr"**.

| Corrida | Resultado | Modelo | Llamadas | Tokens | Aserción fallida | Clase |
|---------|-----------|--------|----------|--------|------------------|-------|
| 1 | PASS (1 pass, 0 fail, 81 expect() calls) | deepseek-flash | 15 | 113249 | ninguna | n/a |

Only one run was spent. It took 25.59 s (03:03:26Z to 03:03:51Z). The output stayed in the session scratchpad and never entered the repo. No command named the env file, and the key was never printed. A scan of the log found 0 key-like strings, 0 email addresses, and one run of six or more digits, which is the token count in the VIVO PASS line itself. After the commits, `git status --porcelain --untracked-files=all -- . ':!.planning'` prints nothing, and `reto-01/` has no changes.

The run cost 113249 tokens against an estimate of about 90000. The 02-18 baseline was 83531 tokens for A plus B, and the two extra A turns replay the whole session A history.

Final evidence line (run 1, verbatim):

VIVO PASS modelo=deepseek-flash llamadas=15 tokens=113249

## Human check of the five replies (executor reading, for the verifier)

- **(A1) co-industrias-delta, criterion 1:** PASS.
  - The reply is plain Spanish built only from tool results: Caso with out/co-industrias-delta/, 17 llenos, 0 faltantes, 0 por confirmar, the Cámara de comercio present with its 27-day aviso, and "Estado: LISTO para firma."
  - The last paragraph is the server's LISTO question, and it holds the only "¿".
- **(A2) "ok":** PASS on the automated checks, with one **OBSERVATION** for the UAT.
  - The model made no tool call and did not repeat the summary. It wrote no "¿" of its own, and the last paragraph is the server question.
  - It does say that "ok" is not an explicit confirmation and that co-industrias-delta stays pending, which is correct.
  - **However**, the model added its own confirmation request: "Si quieres que registre el envío simulado, dime de forma explícita algo como "sí, envía co-industrias-delta"." It is an imperative request, not a question, so the "¿" count does not catch it. It duplicates what the server's closing paragraph already asks. The human check item "no question or request for confirmation written by the model" is therefore **not fully met**. The reply is three short sentences rather than one or two.
- **(A3) "sí":** PASS. The reply reports only the simulated send of co-industrias-delta: the case, the path out/co-industrias-delta/ENVIO-SIMULADO.md and "Bloqueos registrados: ninguno". It says that no real email was sent and nothing was signed. It does not repeat the summary.
- **(B1) PRD §11 turn 1, ec-corp-andina:** PASS.
  - The reply has no asterisks, no # and no tables. It has Caso and out/ec-corp-andina/, the counts 13/1/1, and "Número de contribuyente especial" as the faltante.
  - RUC is por confirmar, with its note (identificador extranjero, NIT colombiano).
  - It names "Certificado de cumplimiento tributario" as ausente and as the support that blocks the package, and gives BLOQUEADO with that reason. It says "No envié nada."
  - The only "¿" is the server's, in the last paragraph.
- **(B2) "envía":** PASS. The reply reports only the simulated send of ec-corp-andina, with the path and the recorded bloqueo ("ausente: Certificado de cumplimiento tributario"). There is no "Conteos:" or "Faltantes:" heading and no question. It says that no real email was sent and nothing was signed.
- **All five replies:** no unmasked maestro value appears (no identifiers, accounts or emails at all). Nothing is claimed as filled, sent or signed without a tool result that says so (CA2).

Summary of the specific questions: A2 did **not** write its own question with "¿", but it **did** write its own request for confirmation. Neither A3 nor B2 repeated the summary.

## Deviations from Plan

**1. [Rule 2 - Visibility] A2 observation recorded in STATE.md Blockers/Concerns**
- **Found during:** Task 3 (human reading of the replies)
- **Issue:** The plan only asked for the VIVO PASS decision line in STATE.md. The A2 reply partly misses one human-check item without failing any assertion.
- **Fix:** I added a Phase 2 concern line to STATE.md so the end-of-phase UAT sees it. I did not change the prompt, made no second run and relaxed no assertion. Under T-02-41 and ENV-03 this is a model-behavior matter, and a prompt-only fix would need the user's new go-ahead.
- **Files modified:** .planning/STATE.md
- **Commit:** ebf2562

Otherwise the plan ran as written. TIMEOUT_MS, PRESUPUESTO_SESION (120000 per session) and MAX_TOKENS_SALIDA (1500) were not changed.

## Verification

- `bun run test:vivo`: exit 0, 1 pass, 0 fail, exactly one VIVO PASS line.
- `bun test tests/contract/instrucciones-agente.test.ts`: 17 pass, 0 fail (the prompt was not changed).
- Task 1 (commit 87fabe7) already verified that `bun test tests/live` without LLM_EN_VIVO reports 1 skip and 0 fail, that `bun run check` exits 0 and that `bun test` has 0 fail.

## Flagged assumptions (carried from the plan)

- SEG-03: the recording fetch captures bodies, not headers. The Authorization header remains the key's only sink and is not inspected.
- AGT-03: one live sample per behavior, so model variance is not measured. The A2 observation is an example of variance that the human check catches and the assertions do not.

## Self-Check: PASSED

- FOUND: tests/live/agente-en-vivo.test.ts
- FOUND: .planning/STATE.md (02-21 decision line and A2 concern)
- FOUND: 87fabe7 (ancestor of HEAD)
- FOUND: ebf2562 (ancestor of HEAD)
