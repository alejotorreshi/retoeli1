---
status: diagnosed
trigger: "UAT G-02-2 (phase 02, test 2 HV2): broad NEGACIONES word class cancels pending cases on unrelated requests (WR-16) and a negation followed by a question re-asks instead of rejecting (WR-15)"
goal: find_root_cause_only
symptoms_prefilled: true
created: 2026-10-14T04:20:00Z
updated: 2026-10-14T04:55:00Z
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (pure deterministic function clasificarConfirmacion; same input -> same output)
known_pattern_candidate: none (knowledge-base.md absent; 6 prior sessions unrelated to the classifier)
hypothesis: H1 (WR-15) clasificarConfirmacion returns OTRO on any '?'/'¿' before ever looking at NEGACIONES; H2 (WR-16) NEGACIONES is a bag-of-words test over every token of the message, so connector words ('para', 'luego', 'mejor', 'despues', 'aun', 'momento', 'ni', 'nada', 'no') in an unrelated request trigger RECHAZA, and abrirTurno maps RECHAZA to LIBRE
test: DONE — function-level and loop-level differentials plus a fix-sketch/revert experiment in a throwaway scratch copy (repo untouched)
expecting: n/a (confirmed)
next_action: return ROOT CAUSE FOUND to the orchestrator (goal find_root_cause_only); plan-phase --gaps owns the fix

reasoning_checkpoint:
  hypothesis: "clasificarConfirmacion detects an explicit rejection by bag-of-words membership in a broad NEGACIONES token class, with no scope over the send action, and it short-circuits every '?'/'¿' message to OTRO before looking for a negation. The rule was designed under D-37 when OTRO and RECHAZA had the same effect; D-63.6 made RECHAZA=cancel vs OTRO=keep+re-ask, so its false positives (WR-16) and its masked true rejections (WR-15) became visible."
  confirming_evidence:
    - "Single-token differential: removing only 'para'/'luego'/'mejor' flips rechaza->otro at function level and LIBRE->PENDIENTE(+server question, next 'sí' sends) at loop level"
    - "Single-clause differential: removing only ', ¿qué falta?' flips otro->rechaza and PENDIENTE(+question)->LIBRE; the negation tokens [no,nada,todavia] are present but never consulted"
    - "Reordering alone (02-REVIEW WR-15 fix) turns 7/8 ordinary questions with connector tokens into rechaza -> the question-first check is masking the over-broad bag; the two symptoms share one mechanism"
    - "A scoped-rejection sketch (negator governing a send verb, or a message made only of stop/filler words, evaluated before the question check) resolves every reported phrase in the loop and keeps 228/228 existing gate/classifier tests green; restoring the original reproduces the symptoms again"
  falsification_test: "If some reported phrase were rechaza/otro for a reason other than the NEGACIONES token or the PATRON_PREGUNTA short-circuit (e.g. abrirTurno, cerrarTurno or the loop altering the decision), the single-token/clause differentials would not flip the gate state. They flip in every pair."
  fix_rationale: "Giving RECHAZA a scope (what is negated) addresses why unrelated requests are rejections; only once the rule is scoped can the negation safely run before the question check, which addresses why 'no envíes…, ¿qué falta?' is not a rejection."
  blind_spots: "Real model behavior with the corrected gate not exercised (no provider calls); the exact Spanish grammar of a scoped rejection (which verbs/clitics/stop words) is a product decision; WR-17/IN-23 interplay with a text rejection that names one case not tested."
  candidate_causes:
    - "code: classifier ordering (confirmacion.policy.ts:84 before :86) — CONFIRMED"
    - "data/config: NEGACIONES vocabulary in confirmation.constants.ts:63-89 holds connectors/prepositions — CONFIRMED"
    - "code (spec drift): D-63.6 (02-19) changed the consequence of RECHAZA without re-specifying it; 02-19-PLAN.md:405 deferred it — CONFIRMED as origin"
    - "code: abrirTurno/loop altering the decision — ELIMINATED (abrirTurno faithfully maps RECHAZA->LIBRE, OTRO->keep)"
    - "environment/model: LLM misbehavior — ELIMINATED (scripted fetch reproduces deterministically; model text is not consulted by the gate)"
  and_gate: "yes for the user-visible symptom: (classifier misclassification) AND (D-63.6 making RECHAZA vs OTRO consequential) AND (model never told the gate decision, so its text contradicts the gate). Only the first is the defect; the second is the intended policy; the third is an amplifier."

## Symptoms

expected: per agent/prompt.md:53 and D-63.6 (02-CONTEXT.md), a pending case stays pending on any reply that is not an explicit rejection; an explicit "no envíes…" cancels it even if a question follows.
actual: (user verdict) "no-pass → plan de cierre: acotar NEGACIONES y que la negación gane a la pregunta, con pruebas de bucle ('…para tenerlo a mano', 'No envíes nada todavía, ¿qué falta?'). Mismo síntoma que hizo bloqueante a CR-01."
errors: none (no crash)
reproduction: |
  QA round 2, P01 = UAT test 9; evidence .qa/evidence/02-agente-y-compuerta-de-confirmaci-n/02-QA-EVIDENCE-2026-10-14T03-51-47Z.md block "T09 — P01".
  WR-16: pending co-industrias-delta, then "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano" -> rechaza, gate LIBRE silently, model says the case is still pending, next "sí" blocked with CONFIRMACION_REQUERIDA, server re-asks -> double confirmation. Also "…luego vemos el otro", "mejor procesa pe-andes", "dame el NIT de ec, no el RUC".
  WR-15: "No envíes nada todavía, ¿qué falta?" -> otro, case stays pending, server appends "¿Confirmas el envío simulado…?" right after the user said not to send; the next "sí" sends.
  Seed: .qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-r2-p01.ts (+ 02-r2-qa.helper.ts)
started: discovered during UAT round 2 (02-REVIEW.md WR-15/WR-16; 02-VERIFICATION.md truth 31). Behavior became user-visible with D-63.6 (02-19).

## Eliminated

## Evidence

- timestamp: 2026-10-14T04:22:00Z
  checked: src/domain/policies/confirmacion.policy.ts:82-89 (clasificarConfirmacion)
  found: line 84 `if (normalizado === "" || PATRON_PREGUNTA.test(texto)) return OTRO;` runs BEFORE line 86 `if (frase.palabras.some((palabra) => NEGACIONES.has(palabra))) return RECHAZA;`. PATRON_PREGUNTA = /[?¿]/ (patterns.constants.ts:22) matches any question mark anywhere in the raw text.
  implication: any message with '?' or '¿' is OTRO regardless of an explicit negation. Prior diagnosis 1 (WR-15) is structurally confirmed by reading.

- timestamp: 2026-10-14T04:22:00Z
  checked: src/config/constants/confirmation.constants.ts:63-89 (NEGACIONES) and confirmacion.policy.ts:28-35 (separar)
  found: NEGACIONES is a flat Set of 25 single tokens including ordinary Spanish connectors/adverbs: "para", "luego", "despues", "mejor", "momento", "aun", "ni", "nada", "no", "alto", "todavia". `separar` strips slugs, splits on /[^a-z0-9ñ]+/ and the check is `.some(NEGACIONES.has)` over ALL tokens of the message, with no requirement that the negation scopes an envío verb, and no length cap (MAX_PALABRAS_CONFIRMACION=12 applies only to esConfirmacionClara, after the negation check).
  implication: the classifier treats "contains a negation-ish token anywhere" as "explicit rejection". Prior diagnosis 2 (WR-16) is structurally confirmed by reading. Note "para" is both the imperative of parar AND the most common Spanish preposition.

- timestamp: 2026-10-14T04:22:00Z
  checked: src/domain/policies/compuerta.policy.ts:46-57 (abrirTurno) and src/loop/services/ejecutar-turno.service.ts:52-60,70,80
  found: abrirTurno returns `{autorizado:null, siguiente: estadoLibre()}` whenever decision is RECHAZA (line 47-48), dropping ALL pending cases; OTRO/FALTA_CASO return `siguiente: estado` (line 56). crearTurno seeds `arrastrados = pendientesDe(apertura.siguiente)`, so a RECHAZA turn starts with no carried cases and cerrarTurno adds no server question. decisionDe (52-60) discards confirmacion.caso when aprobada=false.
  implication: since D-63.6 (02-19) the OTRO/RECHAZA distinction decides keep-vs-cancel; before 02-19 both closed LIBRE, so the classifier's imprecision had no observable effect. The classifier defect is latent since 02-03 and was activated by 02-19.

- timestamp: 2026-10-14T04:22:00Z
  checked: agent/prompt.md:50-54 and src/knowledge/registro-proveedor.md:42 vs the gate code paths (grep for any channel that tells the model the gate decision)
  found: the model is never told the server's classification. prompt.md:53 tells the model that "otra cosa, por ejemplo procesar otro caso o consultar un valor" leaves the paquete pending; prompt.md:51 tells it a "no envíes nada todavía" cancels. The server decides independently with clasificarConfirmacion. Two independent classifiers (LLM via prompt, server via word list) can disagree, and nothing reconciles them.
  implication: amplifier, not root cause: when the server misclassifies, the model's text contradicts the gate state (WR-16: model says "sigue pendiente", gate LIBRE; WR-15: model says "queda cancelada", server appends the question).

- timestamp: 2026-10-14T04:22:00Z
  checked: .qa/evidence/.../02-QA-EVIDENCE-2026-10-14T03-51-47Z.md block "T09 — P01"
  found: end-to-end replay with crearAgente + scripted fetch: WR-16 t2 rechaza -> LIBRE with no server question, t3 'sí' -> CONFIRMACION_REQUERIDA then re-opened (double confirmation); WR-15 t2 otro -> PENDIENTE with server question after the negation, t3 'sí' sends.
  implication: loop-level reproduction already exists; symptom is fully explained by classifier output + abrirTurno mapping.

- timestamp: 2026-10-14T04:30:00Z
  checked: scratchpad/debug-g022/probe-clasificador.ts (real clasificarConfirmacion + abrirTurno, pending [co-industrias-delta]); differential pairs that differ by ONE token
  found: |
    "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano" -> rechaza (negTokens [para]) -> LIBRE
    "Consulta el valor del NIT de co-industrias-delta tenerlo a mano"      -> otro                         -> PENDIENTE
    "Procesa co-industrias-delta, luego vemos el otro" -> rechaza [luego];  without "luego" -> otro
    "mejor procesa pe-andes" -> rechaza [mejor];  "procesa pe-andes" -> otro
    also rechaza: "después procesa pe-andes" [despues], "aún falta el RUT, procesa el caso" [aun], "un momento, procesa pe-andes" [momento], "ni idea, procesa pe-andes" [ni], "no sé, procesa pe-andes" [no], "dame el NIT de ec-corp-andina, no el RUC" [no]
    explicit confirmations turned into rejections: "envía el paquete de ec-corp-andina para firma" -> rechaza [para]; "envíalo para firma", "sí, mándalo ya para que lo firmen", "dale no más" -> rechaza
    WR-15: "No envíes nada todavía, ¿qué falta?" -> otro (negTokens [no,nada,todavia] present but never consulted); "No envíes nada todavía. ¿Qué falta?" -> otro; "¿Qué falta? No envíes nada todavía." -> otro; "no lo envíes aún, ¿puedes revisar el NIT?" -> otro; "No envíes nada todavía" -> rechaza
    WR-17 sibling: abrirTurno(two pending, RECHAZA) -> {autorizado:null, siguiente:{tipo:libre}}
  implication: H1 and H2 CONFIRMED at the function level by single-token differentials. Removing exactly the one NEGACIONES token flips rechaza->otro; removing exactly the '¿…?' clause flips otro->rechaza.

- timestamp: 2026-10-14T04:33:00Z
  checked: scratchpad/debug-g022/probe-orden.ts — simulate the 02-REVIEW WR-15 fix ALONE (negation check moved before the question check, NEGACIONES unchanged)
  found: |
    fixes "No envíes nada todavía, ¿qué falta?" -> rechaza, BUT ordinary questions become rejections that cancel the pending case:
    "¿no hay nada más?", "¿para qué sirve el RUT?", "¿por qué no se puede enviar?", "¿cuál es el NIT? no lo encuentro", "¿qué hago después?", "¿y luego qué sigue?", "¿es mejor esperar al certificado?" -> all otro today, all rechaza after reorder (7/8 tested questions)
  implication: WR-15 and WR-16 are NOT two independent bugs: the question-first check is the only thing currently shielding questions from the over-broad NEGACIONES bag. The reorder alone would multiply WR-16. The two must be fixed together by giving the rejection rule a SCOPE (negation governing the send action / whole-message stop), after which the negation can safely precede the question check.

- timestamp: 2026-10-14T04:35:00Z
  checked: design lineage — git log -L on confirmacion.policy.ts:82-89; 02-RESEARCH.md Pattern 7; 02-03-PLAN.md:119-130; 02-19-PLAN.md:405
  found: ordering and NEGACIONES vocabulary landed verbatim in f15a8c7 (02-03) from RESEARCH Pattern 7 ("Empty, or any ?/¿ → OTRO (questions never confirm)"; "Any NEGACION token → RECHAZA"), designed under D-37 where OTRO and RECHAZA had the SAME effect (cancel). The classifier was specified and tested (43-row table) as a CONFIRMATION detector; RECHAZA precision was never a requirement. 02-19 (D-63.6) made RECHAZA (cancel) vs OTRO (keep + re-ask) consequential without re-specifying the rejection rule, and explicitly deferred it: 02-19-PLAN.md:405 "[ENV-02, unresolved] rechaza is the classifier's broad negation category … Narrowing the negations is a classifier change (IN-01, out of scope)".
  implication: root cause is a contract change that the classifier was not redesigned for: D-63.6 turned clasificarConfirmacion into a REJECTION detector as well, but its RECHAZA branch is still the D-37-era "anything negative-sounding" bucket, gated behind a "questions are never confirmations" short-circuit.

- timestamp: 2026-10-14T04:36:00Z
  checked: IN-01 original text (git show 524051a:.../02-REVIEW.md) + probe
  found: IN-01 has two parts. (a) "si co-industrias-delta", "si por favor", "si si", "si gracias" -> otro because esSiSuelto (confirmacion.policy.ts:53-55) requires slugs.length===0 && palabras.length===1 (D-63.5 accent rule). No NEGACIONES token involved. (b) "dale no más", "envíalo para firma" -> rechaza via "no"/"para" in NEGACIONES.
  implication: IN-01(b) shares the G-02-2 root cause exactly (same token class, same line 86). IN-01(a) is a separate mechanism (D-63.5 bare-'si' rule) whose cost after D-63.6 is only a server re-ask; out of scope.

- timestamp: 2026-10-14T04:37:00Z
  checked: WR-17 path — ejecutar-turno.service.ts:57-59 (decisionDe) + DecisionConfirmacion type (confirmacion.type.ts:5: RECHAZA has no caso) + compuerta.policy.ts:47-48
  found: the structured button bypasses clasificarConfirmacion entirely; decisionDe drops confirmacion.caso when aprobada=false; the RECHAZA variant of DecisionConfirmacion cannot carry a caso; abrirTurno maps RECHAZA to LIBRE for all cases. The text classifier has the same globality ("no envíes ec-corp-andina" with two pending -> {decision: rechaza}, no caso -> both cancelled), pinned at function level by FILAS_EXTRA row 78.
  implication: WR-17 is a SEPARATE defect (rejection scope by CASE, in the type + abrirTurno), sharing only the "RECHAZA is global" branch of abrirTurno. It is not caused by NEGACIONES nor by the ordering. Do not widen scope; report as adjacent.

- timestamp: 2026-10-14T04:45:00Z
  checked: loop-level differential in scratch copy (scratchpad/debug-g022/repo/qa-r2/diff-loop.ts, crearAgente + scripted fetch from 02-r2-qa.helper.ts, 3 turns: procesa CO -> message -> 'sí')
  found: |
    wr16-para    "…NIT de co-industrias-delta para tenerlo a mano" -> rechaza; t2 LIBRE, no server question; t3 'sí' -> CONFIRMACION_REQUERIDA, envios=[] (re-opened PENDIENTE: double confirmation)
    wr16-control same without "para"                               -> otro;    t2 PENDIENTE + server question; t3 'sí' -> ok, envios=[co]
    wr16-luego   "Revisa los soportes, luego vemos el otro"        -> rechaza; same as wr16-para
    wr16-luego-control without "luego"                              -> otro;    same as wr16-control
    wr15-neg+preg "No envíes nada todavía, ¿qué falta?"            -> otro;    t2 PENDIENTE + "¿Confirmas…" right after the negation; t3 'sí' sends
    wr15-neg-sola "No envíes nada todavía"                          -> rechaza; t2 LIBRE; t3 'sí' blocked
  implication: loop-level differential reproduces both symptoms and isolates them to the single token / the '¿…?' clause.

- timestamp: 2026-10-14T04:48:00Z
  checked: baseline tests in scratch copy: tests/unit/confirmacion.policy.test.ts, tests/unit/compuerta.policy.test.ts, tests/loop/compuerta.test.ts, tests/loop/compuerta-casos.test.ts, tests/contract/instrucciones-agente.test.ts
  found: 245 pass / 0 fail on unmodified code. No row asserts a false rejection ("para"/"luego"/"mejor" in an unrelated request) nor negation+question -> otro. Loop D-63.6 test uses only "procesa el caso ${CO}" (no connector); the re-ask test uses "¿qué falta?" (no negation).
  implication: the failing truth is UNTESTED rather than pinned; the suite is green because the gap's inputs are absent.

- timestamp: 2026-10-14T04:52:00Z
  checked: fix-sketch experiment in the scratch copy only (repo untouched): scoped rejection = (negator no/nunca/jamas/tampoco/ni followed, skipping clitics/fillers, by a negative-imperative send form envies/mandes/…) OR (message made only of stop words + RELLENO), evaluated BEFORE PATRON_PREGUNTA; NEGACIONES bag no longer consulted. Then restored the original file (diff -q identical).
  found: 228/228 gate+classifier tests still green (all 43-row table rejection rows: "No envíes nada todavía", "no", "todavía no", "espera", "aún no, espera", "no lo envíes", "mejor no", "cancela", "sí, pero no envíes todavía", "no envíes ec-corp-andina" stay rechaza; "¿y si envío?", "¿envío?", "envía?" stay otro). Loop probe: wr16-para and wr16-luego -> otro, PENDIENTE + question, next 'sí' sends once; wr15-neg+preg -> rechaza, LIBRE, no question. Questions "¿no hay nada más?", "¿para qué sirve el RUT?", "¿por qué no se puede enviar?" -> otro (no over-trigger).
  implication: causal confirmation (mechanism changed -> symptom gone; restored -> symptom back). The fix lives entirely in the classifier + its constants; abrirTurno/loop need no change for G-02-2.

## Resolution

root_cause: "clasificarConfirmacion (src/domain/policies/confirmacion.policy.ts:82-89) has no scoped notion of an explicit rejection: it (1) returns OTRO for any message containing '?' or '¿' (line 84) BEFORE checking negations, and (2) returns RECHAZA when ANY token of the message is in NEGACIONES (line 86), a flat bag (src/config/constants/confirmation.constants.ts:63-89) that includes common connectors/prepositions ('para', 'luego', 'despues', 'mejor', 'momento', 'aun', 'ni', 'nada', 'no'). The rule came verbatim from 02-RESEARCH Pattern 7 / 02-03, designed when RECHAZA and OTRO both cancelled (D-37) and only confirmation precision mattered; D-63.6 (02-19) made RECHAZA=cancel-all vs OTRO=keep+server re-ask without re-specifying the rejection rule (deferred at 02-19-PLAN.md:405). The question-first short-circuit is what currently keeps questions from being swept by the over-broad bag, so WR-15 and WR-16 are one defect: an unscoped rejection detector."
fix: ""
verification: ""
files_changed: []
specialist_hint: typescript
