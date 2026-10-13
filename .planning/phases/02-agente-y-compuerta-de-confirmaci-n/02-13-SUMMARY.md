---
phase: 02-agente-y-compuerta-de-confirmaci-n
plan: 13
subsystem: agent-loop
tags: [confirmation-gate, wr-02, d-63, d-38, live-run, deepseek]

requires:
  - phase: 02-agente-y-compuerta-de-confirmaci-n
    provides: "cierreConPregunta closes every turn with a pending case with the server question (02-10, CR-02); explicit-only confirmations (02-14, CR-01); ARGUMENTOS_VACIOS wire normalization (02-11, CR-03); leased session locks (02-12, WR-03)"
provides:
  - "recuperarAutorizado(motivo, autorizacion, conocidos): the unused authorized case of a confirmation turn cut by an error or a cap"
  - "cerrarCompuerta carries the recovered case into cerrarTurno, so a failed confirmation turn ends with the server question, confirmation_required and needsConfirmation true"
  - "Fresh live evidence (criterion 1 and PRD §11) after all five gap fixes"
affects: [phase-03-ui, confirmation-card, needsConfirmation, SOLUCION.md]

actuals:
  tokens: 3600
  tasks: 2
  commits: 2

plan_head_before: 997e2f769f1c7054c8f847ac5fa61649d48b981b
plan_head_after: 2dbd3082071c5d687ff2756b37ad17be336a66f1

tech-stack:
  added: []
  patterns:
    - "Recover the pending state, never the grant: the authorization stays turn-local and is consumed at turn end (D-38)"
    - "A RED stub that returns the neutral value keeps a unit file loadable so it fails on assertions, not on a missing export"

key-files:
  created: []
  modified:
    - src/domain/policies/compuerta.policy.ts
    - src/loop/services/ejecutar-turno.service.ts
    - tests/unit/compuerta.policy.test.ts
    - tests/loop/compuerta-casos.test.ts

key-decisions:
  - "02-13: a confirmation turn that ends in error, tope_tokens or tope_iteraciones before using its authorization returns that case to pending (D-63.2); final and abortado endings recover nothing"
  - "02-13: only the pending state is recovered, never the grant; the next turn needs a new explicit confirmation (D-38). Revoked (D-42), used, unknown and inherited-key cases (Object.hasOwn) are never recovered"
  - "02-13: a budget-exhausted session keeps the case pending and keeps asking with PRESUPUESTO_AGOTADO plus the server question, with zero provider calls and no send"
  - "02-13: live run 1 passed with the committed prompt (VIVO PASS modelo=deepseek-flash llamadas=12 tokens=79292); agent/prompt.md unchanged"

patterns-established:
  - "WR-02 loop scenarios: provider error, missing instructions (loader failing on its Nth call) and budget, each with a 'turn 3 sends once' or 'never sends' check"

requirements-completed: [ENV-02, ENV-03, AGT-04, DEMO-03]

coverage:
  - id: D1
    description: "recuperarAutorizado recovers the unused authorized case only on error and cap endings, and never a revoked, used, unknown or inherited-key case"
    requirement: ENV-02
    verification:
      - kind: unit
        ref: "tests/unit/compuerta.policy.test.ts#recuperarAutorizado (WR-02, D-63.2, D-38)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A confirmation turn cut by a provider error or missing instructions ends with the error, the server question as last paragraph, one confirmation_required and needsConfirmation true; the next 'envía' sends exactly once"
    requirement: ENV-03
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#un error del proveedor tras 'envía' vuelve a preguntar por ec y el siguiente 'envía' envía una vez"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#sin instrucciones tras 'envía' no llama al proveedor, vuelve a preguntar y el siguiente 'envía' envía una vez"
        status: pass
    human_judgment: false
  - id: D3
    description: "A budget-exhausted session keeps the case pending, keeps asking and never sends; a text-only final turn and a caller abort close LIBRE (controls)"
    requirement: AGT-04
    verification:
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#con el presupuesto agotado 'envía' no llama al proveedor, sigue preguntando y nunca envía"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#control: si el modelo solo responde texto tras 'envía', el turno cierra LIBRE sin preguntar"
        status: pass
      - kind: integration
        ref: "tests/loop/compuerta-casos.test.ts#control: un aborto del llamante tras 'envía' no recupera la autorización y el siguiente 'envía' queda bloqueado"
        status: pass
    human_judgment: false
  - id: D4
    description: "Live run against the real provider passes criterion 1 and the PRD §11 script after all gap fixes, with the server question closing each pending reply"
    requirement: DEMO-03
    verification:
      - kind: e2e
        ref: "bun run test:vivo (tests/live/agente-en-vivo.test.ts)"
        status: pass
    human_judgment: true
    rationale: "CA2 judgment check (02-VERIFICATION.md human_verification item 1): whether the replies are faithful to the tool results needs a human reading; the executor's reading is recorded below for the verifier to confirm"

duration: 3min
completed: 2026-10-13
status: complete
---

# Phase 2 Plan 13: WR-02 recovery and fresh live evidence Summary

**A confirmation turn cut by a provider error, missing instructions, the token budget or the iteration cap now returns its unused authorized case to pending and ends with the server question. The live run against deepseek-flash passes again after all five gap fixes.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-13T22:16:58Z
- **Completed:** 2026-10-13T22:20:11Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `recuperarAutorizado` in the gate policy returns `[conocidos[caso]]` only for `MOTIVO_FIN.ERROR`, `TOPE_TOKENS` and `TOPE_ITERACIONES`, and only when the authorization is unused and the case is a known package (`Object.hasOwn`).
- `cerrarCompuerta` passes `arrastrados: [...turno.arrastrados, ...recuperarAutorizado(cierre.motivo, turno.autorizacion, turno.conocidos)]`. Plan 02-10's `cierreConPregunta` then ends the failed turn with the server question. That keeps D-37's rule that a pending case exists only when the previous turn asked about it.
- The abandoned-turn path (`guardarInterrumpido`, motivo `abortado`) recovers nothing, and the grant is never carried across turns.
- Live evidence after CR-01, CR-02, CR-03, WR-02 and WR-03: one run, PASS.

## Task Commits

1. **Task 1 (tracer, TDD): a confirmation turn cut before the send keeps the case pending (WR-02).** `63fd7ad` (test, RED) and `2dbd308` (fix, GREEN).
2. **Task 2: fresh live evidence.** No tracked file changed: run 1 passed with the committed prompt, so `agent/prompt.md` was not touched and there is no commit.

## TDD Gate Compliance

- **RED:** `63fd7ad`. `bun test tests/unit/compuerta.policy.test.ts` gave 31 pass and 4 fail: the four recovering rows (error, tope_tokens, tope_iteraciones, several known packages) got `[]` from the stub. The six "recovers nothing" rows passed, as intended. `bun test tests/loop/compuerta-casos.test.ts --reporter=junit` exited 1 with 17 pass and 3 fail. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`, format junit) for the target "un error del proveedor tras 'envía' vuelve a preguntar por ec y el siguiente 'envía' envía una vez". Semantic assessment: the target ran and failed on its planned assertion, `finDeTurno(...)` with `needsConfirmation: false` where `true` was expected (compuerta-casos.test.ts:428). The instructions and budget scenarios failed on the same assertion. Both controls passed, which is expected because final and abort endings already closed LIBRE. There were no load, fixture or syntax faults. The RED commit adds a stub `recuperarAutorizado` that returns `[]`, so the unit file loads and fails on assertions instead of a missing export.
- **GREEN:** `2dbd308`. The verify set gave 162 pass and 0 fail across 9 files.
- **Commit type note:** the plan asks for a `fix(02-13)` GREEN commit (gap closure), so there is no `feat(02-13)` commit. The `test(02-13)` RED commit comes before it.
- **Tracer gate:** this is an interactive run with `human_verify_mode: end-of-phase` and an automated-only `<verify>`, so the executor re-ran verify (162/162, `bun run check` exit 0, `bun test` 1079 pass and 0 fail) and continued without a checkpoint.

## Corrida en vivo

| Corrida | Resultado | Modelo | Llamadas | Tokens | Aserción fallida |
|---------|-----------|--------|----------|--------|------------------|
| 1 | PASS | deepseek-flash | 12 | 79292 | ninguna |

Run 1 passed with the committed prompt, so the second allowed run was not used. The output stayed in the session scratchpad. No command named the .env file, and the key was never printed: the test checks it only as a boolean and asserts that it is absent from request bodies, events and logs.

Final evidence line (run 1, verbatim):

VIVO PASS modelo=deepseek-flash llamadas=12 tokens=79292

Human check of the run 1 replies (CA2 judgment check, 02-VERIFICATION.md human_verification item 1):
- **co-industrias-delta:** plain Spanish built only from tool results. It gives Caso with out/co-industrias-delta/; 17 llenos, 0 faltantes, 0 por confirmar; the Cámara de comercio is present and expires in 27 days (vigencia hasta 2026-09-30); LISTO with no bloqueos. Its last paragraph is the LISTO server question: "El paquete de co-industrias-delta queda LISTO para firma. Para registrar el envío simulado responde con una confirmación explícita, como "envía" o "sí"; … ¿Confirmas el envío simulado de co-industrias-delta?". No values appear. One sentence repeats the state ("El paquete quedó armado y listo para firma, sin bloqueos vigentes."), which is harmless.
- **PRD §11, turn 1 (ec-corp-andina):** plain text with no asterisks, # or tables (dash lists only). It contains Caso and out/ec-corp-andina/; 13 llenos, 1 faltante, 1 por confirmar; "Número de contribuyente especial" as the faltante; RUC por confirmar with the note "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano"; "Certificado de cumplimiento tributario" as the support to update (ausente, the reason for the bloqueo); "BLOQUEADO para firma, porque falta el soporte exigido Certificado de cumplimiento tributario". The model's text ends with "No envié nada." and has no second, model-written closing question. The last paragraph is the server question with the readable bloqueo: "El paquete de ec-corp-andina queda BLOQUEADO: ausente: Certificado de cumplimiento tributario. … ¿Confirmas el envío simulado de ec-corp-andina?". No value appears unmasked; in fact no maestro value appears at all.
- **PRD §11, turn 2 ("envía"):** the reply confirms the simulated send for ec-corp-andina only, in out/ec-corp-andina/ENVIO-SIMULADO.md with the bloqueo still in force. It says explicitly that no real email was sent and the package was not signed. It ends with a model question offering more work. That is allowed because nothing is pending after the send (needsConfirmation false). The reply restates the turn-1 summary, which is verbose but accurate.
- No claim of filled, sent or signed appears without a tool result that says so.

## Files Created/Modified

- `src/domain/policies/compuerta.policy.ts`: `recuperarAutorizado`, a pure function that compares against the `MOTIVO_FIN` object (G6).
- `src/loop/services/ejecutar-turno.service.ts`: `cerrarCompuerta` appends the recovered case to `arrastrados`.
- `tests/unit/compuerta.policy.test.ts`: a 10-row `recuperarAutorizado` table.
- `tests/loop/compuerta-casos.test.ts`: the WR-02 describe with the provider-error, missing-instructions and budget scenarios plus the final and abort controls. It has its own copy of `gastando` and an instructions loader that fails on its Nth call.

## Decisions Made

- Recovery is offered on error and cap endings only. A final ending means the model chose not to send, and an abort means the caller left. Both close LIBRE, as before (D-37, D-38).
- Only the pending state comes back. The authorization stays turn-local and is consumed at turn end, so the failed turn never sends and the analyst confirms again (D-38, T-02-39).
- A budget-exhausted session keeps asking with `PRESUPUESTO_AGOTADO` followed by the server question. The message already tells the analyst to open a new session, and no provider call or send happens.

## Deviations from Plan

None in the code. The plan was executed as written. Process notes:
- The plan asks for a single fix commit for Task 1. Following the TDD contract (and plans 02-10 to 02-14), it is split into a `test(02-13)` RED commit and a `fix(02-13)` GREEN commit.
- The GSD protected-branch check reports `main` as protected. Commits were made on `main` anyway, because this project uses `branching_strategy: none`, every earlier plan in this phase committed on `main`, and the orchestrator dispatched this plan as a sequential executor on `main`.

**Total deviations:** 0 auto-fixed. **Impact on plan:** none.

## Issues Encountered

- Biome reformatted a module-level constant between two scripted edits, which left it unused. `bun run check` reported the unused variable and the constant was removed before the GREEN commit. The final shape compares `motivo` against `MOTIVO_FIN.FINAL` and `MOTIVO_FIN.ABORTADO` inline.

## User Setup Required

None new. The opt-in live run reused the existing gitignored .env key (user_setup in the plan frontmatter, already configured).

## Next Phase Readiness

- All five gap closures (CR-01, CR-02, CR-03, WR-02, WR-03) have passing tests, and the live run reproduces criterion 1 and the §11 script with the server question at the end of each pending reply.
- Phase 3 UI note: after a failed confirmation turn, the stream now carries `error`, then `text` (the server question), then `confirmation_required`, then `turn_end` with `needsConfirmation: true`. The confirmation card must reappear in that case.
- `git status --porcelain -- reto-01` prints nothing.

## Self-Check: PASSED

- FOUND: src/domain/policies/compuerta.policy.ts, src/loop/services/ejecutar-turno.service.ts, tests/unit/compuerta.policy.test.ts, tests/loop/compuerta-casos.test.ts
- FOUND: 63fd7ad, 2dbd308 (ancestors of HEAD)
- Acceptance: `grep -c "export function recuperarAutorizado"` = 1; `grep -c "recuperarAutorizado("` in ejecutar-turno.service.ts = 1; the unit table has 10 rows; `bun test` 1079 pass and 0 fail; `bun run check` exit 0; `bun run test:vivo` 1 pass, 0 fail, one VIVO PASS line; one live run spent.

---
*Phase: 02-agente-y-compuerta-de-confirmaci-n*
*Completed: 2026-10-13*
