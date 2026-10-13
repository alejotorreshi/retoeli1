---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "Un acuse suelto (\"ok\", \"listo\", \"claro\", \"correcto\", \"vale\") sigue autorizando el envío"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`sinPreguntaFinal` borra texto que no es pregunta, incluidas advertencias de campos `requiere_confirmacion`"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Con el presupuesto agotado, la recuperación de WR-02 deja la sesión pidiendo para siempre una confirmación que nunca se cumplirá"
  - id: WR-04
    severity: warning
    disposition: open
    title: "Un cierre `FINAL` con la autorización sin usar descarta en silencio la confirmación de la analista"
  - id: IN-01
    severity: info
    disposition: open
    title: "Si el envío autorizado se ejecuta y falla, el caso desaparece de los pendientes"
  - id: IN-02
    severity: info
    disposition: open
    title: "Cuando `guardar` es rechazado, el turno igual anuncia texto y `confirmation_required` como si el estado se hubiera guardado"
  - id: IN-03
    severity: info
    disposition: open
    title: "El cercado depende de que el deadline (temporizador monotónico) venza antes que el lease (reloj de pared), y el cercado solo protege `guardar`"
  - id: IN-04
    severity: info
    disposition: open
    title: "\"si\" sin tilde se clasifica siempre como afirmación, aunque pueda ser el condicional \"si\""
  - id: IN-05
    severity: info
    disposition: open
    title: "La instrucción de siguiente paso dice \"envía\" o \"sí\" aunque haya varios casos pendientes"
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "\"envio\" counts as an affirmative verb, so noun phrases and acknowledgements authorize the send"
  - id: CR-02
    severity: critical
    disposition: fixed
    title: "Any model question that names the case suppresses the deterministic question, so \"sí\" to an unrelated question authorizes the send and the bloqueos can go unlisted"
  - id: CR-03
    severity: critical
    disposition: fixed
    title: "A truncated step (`finish_reason=length`) persists invalid-JSON tool arguments that are replayed in every later request of the session"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The test helper `sesionActual()` mutates the store and silently creates a new session when the expected one is missing"
  - id: WR-06
    severity: warning
    disposition: open
    title: "An empty final answer from the model is emitted and stored as an empty reply"
  - id: IN-06
    severity: info
    disposition: open
    title: "Packages already sent stay in `paquetesConocidos`, so a blocked retry re-opens the confirmation for a package that was already sent"
  - id: IN-07
    severity: info
    disposition: open
    title: "Case ids without a hyphen can never be named in a text confirmation"
  - id: IN-08
    severity: info
    disposition: open
    title: "Two system messages are sent, which the generic adapter does not guarantee every provider accepts"
  - id: R1-WR-01
    severity: warning
    disposition: open
    title: "An abort or deadline in the middle of a step drops the results of tools that already ran (including `simular_envio`) from history, while their gate events still apply"
  - id: R1-WR-02
    severity: warning
    disposition: fixed
    title: "A confirmation turn that fails before sending silently drops the pending case"
  - id: R1-WR-03
    severity: warning
    disposition: fixed
    title: "Session locks have no lease, so a consumer that stops iterating without `return()` locks the session forever"
  - id: R1-WR-04
    severity: warning
    disposition: open
    title: "The cost cap can be bypassed: the token budget is per session, sessions are free to create, and invalid responses are retried without counting their tokens"
  - id: R1-IN-01
    severity: info
    disposition: open
    title: "`LONGITUD_MAXIMA_NOMBRE_HERRAMIENTA` is dead, and model-controlled tool names are unbounded"
  - id: R1-IN-02
    severity: info
    disposition: open
    title: "The gate re-parses the `armar_paquete` output with a local schema and duplicates the checklist blocking-reason logic"
  - id: R1-IN-03
    severity: info
    disposition: open
    title: "Agent-creation errors say the session is still open when no session exists"
  - id: R1-IN-04
    severity: info
    disposition: open
    title: "An unknown or malformed session id is reported as \"expired\""
  - id: R1-IN-05
    severity: info
    disposition: open
    title: "The agent clock re-parses the environment on every call and silently diverges from the tools when `FECHA_EJECUCION` is invalid"
open: 21
total: 26
recorded: 2026-10-13T22:28:44.457Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| CR-01 | critical | fixed | fixed by 02-14 (verified in re-review 4c30e81) |
| CR-02 | critical | fixed | fixed by 02-10 (verified in re-review 4c30e81) |
| CR-03 | critical | fixed | fixed by 02-11 (verified in re-review 4c30e81) |
| WR-05 | warning | open | - (not in the current review) |
| WR-06 | warning | open | - (not in the current review) |
| IN-06 | info | open | - (not in the current review) |
| IN-07 | info | open | - (not in the current review) |
| IN-08 | info | open | - (not in the current review) |
| R1-WR-01 | warning | open | prior round (id reused by re-review); not in gap-closure scope |
| R1-WR-02 | warning | fixed | prior round; fixed by 02-13 (verified in re-review 4c30e81) |
| R1-WR-03 | warning | fixed | prior round; fixed by 02-12 (verified in re-review 4c30e81) |
| R1-WR-04 | warning | open | prior round (id reused by re-review); not in gap-closure scope |
| R1-IN-01 | info | open | prior round (id reused by re-review) |
| R1-IN-02 | info | open | prior round (id reused by re-review) |
| R1-IN-03 | info | open | prior round (id reused by re-review) |
| R1-IN-04 | info | open | prior round (id reused by re-review) |
| R1-IN-05 | info | open | prior round (id reused by re-review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
