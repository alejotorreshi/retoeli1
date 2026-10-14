---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "[BLOCKER] el prompt manda al modelo a pedir la confirmación, pero el servidor ya liberó la compuerta y bloquea la confirmación siguiente"
  - id: WR-01
    severity: warning
    disposition: open
    title: "[WARNING] G-02-19 está incompleto: con dos o más issues, el mensaje de arranque sigue teniendo puntuación doble (\".;\")"
  - id: WR-02
    severity: warning
    disposition: open
    title: "[WARNING] un envío autorizado que falla saca el caso de la compuerta, aunque el conocimiento dice que el servidor vuelve a preguntar"
  - id: IN-01
    severity: info
    disposition: open
    title: "[INFO] clasificador: agregar el caso a \"si\" lo degrada, y confirmaciones naturales sin tilde dan `otro`"
  - id: IN-02
    severity: info
    disposition: open
    title: "[INFO] el pliegue de eventos se calcula dos veces y `cerrarTurno` descarta su resultado"
  - id: IN-03
    severity: info
    disposition: open
    title: "[INFO] el prompt fija a mano el nombre `ENVIO-SIMULADO.md` y los ejemplos de confirmación, sin una prueba que los ate a sus constantes"
  - id: IN-04
    severity: info
    disposition: open
    title: "[INFO] la semilla T04 compara con literales, importa un archivo que no existe en su carpeta y descarta un campo que calcula"
  - id: IN-05
    severity: info
    disposition: open
    title: "[INFO] `FINES_DE_ORACION` vive en `confirmation.constants.ts` pero lo usa el constructor de cierres de texto"
  - id: WR-07
    severity: warning
    disposition: fixed
    title: "El nombre visible `proveedor_<export>` se deriva a mano en cuatro módulos de `src/` y en unas quince pruebas"
  - id: WR-08
    severity: warning
    disposition: fixed
    title: "El bucle arma a mano tres sobres de fallo de herramienta, con formas distintas a la del factory"
  - id: WR-09
    severity: warning
    disposition: fixed
    title: "La lectura del estado de la compuerta está duplicada entre la política y el servicio de cierre"
  - id: WR-10
    severity: warning
    disposition: fixed
    title: "`ejecutar-turno.service.ts` creció a 472 líneas con cinco responsabilidades"
  - id: WR-11
    severity: warning
    disposition: fixed
    title: "La capa `llm` mezcla español e inglés en nombres de archivos, funciones y tipos"
  - id: WR-12
    severity: warning
    disposition: fixed
    title: "Las capacidades y el slot del proveedor están definidos dos veces, con nombres distintos"
  - id: WR-13
    severity: warning
    disposition: fixed
    title: "`TEXTO_ENV.urlNoSegura` repite a mano el protocolo y los hosts permitidos, y ya no coincide con ellos"
  - id: WR-14
    severity: warning
    disposition: fixed
    title: "Dos reglas de CLAUDE.md no tienen guardián, y por ese hueco ya pasaron violaciones"
  - id: IN-09
    severity: info
    disposition: fixed
    title: "`strings.ts` duplica una constante y un formateador, y arma igual cosas que nombra distinto"
  - id: IN-10
    severity: info
    disposition: fixed
    title: "Hay cinco `JSON.parse` envueltos en try/catch, dos de ellos en el mismo archivo"
  - id: IN-11
    severity: info
    disposition: fixed
    title: "`timeout.decorator.ts` construye a mano un `ErrorLlm` que el mapper ya sabe construir"
  - id: IN-12
    severity: info
    disposition: fixed
    title: "`confirmacion.policy.ts` reimplementa la normalización de `normalizar.util.ts`"
  - id: IN-13
    severity: info
    disposition: fixed
    title: "`preguntaConfirmacion` se exporta solo para que las pruebas armen el valor esperado"
  - id: IN-14
    severity: info
    disposition: fixed
    title: "Vuelve el nombre `Desenlace`, que la fase 1 había renombrado"
  - id: IN-15
    severity: info
    disposition: fixed
    title: "`MENSAJE_AGENTE` se indexa por la clave literal en lugar de por el código"
  - id: IN-16
    severity: info
    disposition: fixed
    title: "Los tipos de la compuerta se reescriben en lugar de componerse"
  - id: IN-17
    severity: info
    disposition: fixed
    title: "El destino de logs `{ write(linea): void }` está escrito cuatro veces, y el tipo de infra se exporta sin uso"
  - id: IN-18
    severity: info
    disposition: fixed
    title: "Hay constantes nuevas en el ámbito o el idioma equivocados"
  - id: IN-19
    severity: info
    disposition: fixed
    title: "Hay dos listas de claves secretas mantenidas a mano"
  - id: IN-20
    severity: info
    disposition: fixed
    title: "Hay funciones con cinco parámetros posicionales y booleanos posicionales"
  - id: IN-21
    severity: info
    disposition: fixed
    title: "`docs/estructura.md` no refleja los módulos que agregó la fase 02"
  - id: IN-22
    severity: info
    disposition: fixed
    title: "`sinPreguntaFinal` borra texto que no es pregunta, incluidas advertencias de campos `requiere_confirmacion`"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Con el presupuesto agotado, la recuperación de WR-02 deja la sesión pidiendo para siempre una confirmación que nunca se cumplirá"
  - id: WR-04
    severity: warning
    disposition: open
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
    disposition: fixed
    title: "Packages already sent stay in `paquetesConocidos`, so a blocked retry re-opens the confirmation for a package that was already sent"
  - id: IN-07
    severity: info
    disposition: open
    title: "Case ids without a hyphen can never be named in a text confirmation"
  - id: IN-08
    severity: info
    disposition: open
    title: "The agent clock re-parses the environment on every call and silently diverges from the tools when `FECHA_EJECUCION` is invalid"
  - id: R2-WR-01
    severity: warning
    disposition: fixed
    title: "Un acuse suelto (\"ok\", \"listo\", \"claro\", \"correcto\", \"vale\") sigue autorizando el envío"
  - id: R2-WR-02
    severity: warning
    disposition: open
    title: "`sinPreguntaFinal` borra texto que no es pregunta, incluidas advertencias de campos `requiere_confirmacion`"
  - id: R2-IN-01
    severity: info
    disposition: open
    title: "Si el envío autorizado se ejecuta y falla, el caso desaparece de los pendientes"
  - id: R2-IN-02
    severity: info
    disposition: open
    title: "Cuando `guardar` es rechazado, el turno igual anuncia texto y `confirmation_required` como si el estado se hubiera guardado"
  - id: R2-IN-03
    severity: info
    disposition: open
    title: "El cercado depende de que el deadline (temporizador monotónico) venza antes que el lease (reloj de pared), y el cercado solo protege `guardar`"
  - id: R2-IN-04
    severity: info
    disposition: fixed
    title: "\"si\" sin tilde se clasifica siempre como afirmación, aunque pueda ser el condicional \"si\""
  - id: R2-IN-05
    severity: info
    disposition: open
    title: "La instrucción de siguiente paso dice \"envía\" o \"sí\" aunque haya varios casos pendientes"
  - id: R2-CR-01
    severity: critical
    disposition: fixed
    title: "\"envio\" counts as an affirmative verb, so noun phrases and acknowledgements authorize the send"
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
    disposition: fixed
    title: "Agent-creation errors say the session is still open when no session exists"
  - id: R1-IN-04
    severity: info
    disposition: open
    title: "An unknown or malformed session id is reported as \"expired\""
  - id: R1-IN-05
    severity: info
    disposition: open
    title: "The agent clock re-parses the environment on every call and silently diverges from the tools when `FECHA_EJECUCION` is invalid"
open: 25
total: 56
recorded: 2026-10-14T01:42:10.286Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| WR-07 | warning | fixed | fixed in f2e7d7c (02-REVIEW-FIX.md) (not in the current review) |
| WR-08 | warning | fixed | fixed in f4c6f14 (02-REVIEW-FIX.md) (not in the current review) |
| WR-09 | warning | fixed | fixed in 3187ddd (02-REVIEW-FIX.md) (not in the current review) |
| WR-10 | warning | fixed | fixed in 4469cc9 (02-REVIEW-FIX.md) (not in the current review) |
| WR-11 | warning | fixed | fixed in e3ce4de (02-REVIEW-FIX.md) (not in the current review) |
| WR-12 | warning | fixed | fixed in a5c299f (02-REVIEW-FIX.md) (not in the current review) |
| WR-13 | warning | fixed | fixed in f0f952d (02-REVIEW-FIX.md) (not in the current review) |
| WR-14 | warning | fixed | fixed in 30c33cd (02-REVIEW-FIX.md) (not in the current review) |
| IN-09 | info | fixed | fixed in bcfe78a (02-REVIEW-FIX.md) (not in the current review) |
| IN-10 | info | fixed | fixed in 802c2f5 (02-REVIEW-FIX.md) (not in the current review) |
| IN-11 | info | fixed | fixed in 9359adb (02-REVIEW-FIX.md) (not in the current review) |
| IN-12 | info | fixed | fixed in b9595a0 (02-REVIEW-FIX.md) (not in the current review) |
| IN-13 | info | fixed | fixed in 78a212d (02-REVIEW-FIX.md) (not in the current review) |
| IN-14 | info | fixed | fixed in 33f83f5 (02-REVIEW-FIX.md) (not in the current review) |
| IN-15 | info | fixed | fixed in 987ecec (02-REVIEW-FIX.md) (not in the current review) |
| IN-16 | info | fixed | fixed in e8f8792 (02-REVIEW-FIX.md) (not in the current review) |
| IN-17 | info | fixed | fixed in 0825cd5 (02-REVIEW-FIX.md) (not in the current review) |
| IN-18 | info | fixed | fixed in 5f9dd44 (02-REVIEW-FIX.md) (not in the current review) |
| IN-19 | info | fixed | fixed in 24ffdf5 (02-REVIEW-FIX.md) (not in the current review) |
| IN-20 | info | fixed | fixed in e942a25 (02-REVIEW-FIX.md) (not in the current review) |
| IN-21 | info | fixed | fixed in 84b7c5c (02-REVIEW-FIX.md) (not in the current review) |
| IN-22 | info | fixed | fixed in 10455ff (02-REVIEW-FIX.md) (not in the current review) |
| WR-03 | warning | open | - (not in the current review) |
| WR-04 | warning | open | - (not in the current review) |
| CR-02 | critical | fixed | fixed by 02-10 (verified in re-review 4c30e81) (not in the current review) |
| CR-03 | critical | fixed | fixed by 02-11 (verified in re-review 4c30e81) (not in the current review) |
| WR-05 | warning | open | - (not in the current review) |
| WR-06 | warning | open | - (not in the current review) |
| IN-06 | info | fixed | prior round; fixed by 02-15 (D-63.4, G-02-3) (not in the current review) |
| IN-07 | info | open | - (not in the current review) |
| IN-08 | info | open | - (not in the current review) |
| R2-WR-01 | warning | fixed | prior round; fixed by 02-16 (D-63.5, G-02-18) |
| R2-WR-02 | warning | open | prior round (id reused by gap-closure review 524051a) |
| R2-IN-01 | info | open | prior round (id reused by gap-closure review 524051a) |
| R2-IN-02 | info | open | prior round (id reused by gap-closure review 524051a) |
| R2-IN-03 | info | open | prior round (id reused by gap-closure review 524051a) |
| R2-IN-04 | info | fixed | prior round; fixed by 02-16 (D-63.5, G-02-18) |
| R2-IN-05 | info | open | prior round (id reused by gap-closure review 524051a) |
| R2-CR-01 | critical | fixed | prior round; fixed by 02-14 (verified in re-review 4c30e81) |
| R1-WR-01 | warning | open | prior round (id reused by re-review); not in gap-closure scope |
| R1-WR-02 | warning | fixed | prior round; fixed by 02-13 (verified in re-review 4c30e81) |
| R1-WR-03 | warning | fixed | prior round; fixed by 02-12 (verified in re-review 4c30e81) |
| R1-WR-04 | warning | open | prior round (id reused by re-review); not in gap-closure scope |
| R1-IN-01 | info | open | prior round (id reused by re-review) |
| R1-IN-02 | info | open | prior round (id reused by re-review) |
| R1-IN-03 | info | fixed | prior round; fixed by 02-17 (G-02-19) |
| R1-IN-04 | info | open | prior round (id reused by re-review) |
| R1-IN-05 | info | open | prior round (id reused by re-review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
