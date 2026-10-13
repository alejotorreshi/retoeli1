---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: WR-07
    severity: warning
    disposition: open
    title: "El nombre visible `proveedor_<export>` se deriva a mano en cuatro módulos de `src/` y en unas quince pruebas"
  - id: WR-08
    severity: warning
    disposition: open
    title: "El bucle arma a mano tres sobres de fallo de herramienta, con formas distintas a la del factory"
  - id: WR-09
    severity: warning
    disposition: open
    title: "La lectura del estado de la compuerta está duplicada entre la política y el servicio de cierre"
  - id: WR-10
    severity: warning
    disposition: open
    title: "`ejecutar-turno.service.ts` creció a 472 líneas con cinco responsabilidades"
  - id: WR-11
    severity: warning
    disposition: open
    title: "La capa `llm` mezcla español e inglés en nombres de archivos, funciones y tipos"
  - id: WR-12
    severity: warning
    disposition: open
    title: "Las capacidades y el slot del proveedor están definidos dos veces, con nombres distintos"
  - id: WR-13
    severity: warning
    disposition: open
    title: "`TEXTO_ENV.urlNoSegura` repite a mano el protocolo y los hosts permitidos, y ya no coincide con ellos"
  - id: WR-14
    severity: warning
    disposition: open
    title: "Dos reglas de CLAUDE.md no tienen guardián, y por ese hueco ya pasaron violaciones"
  - id: IN-09
    severity: info
    disposition: open
    title: "`strings.ts` duplica una constante y un formateador, y arma igual cosas que nombra distinto"
  - id: IN-10
    severity: info
    disposition: open
    title: "Hay cinco `JSON.parse` envueltos en try/catch, dos de ellos en el mismo archivo"
  - id: IN-11
    severity: info
    disposition: open
    title: "`timeout.decorator.ts` construye a mano un `ErrorLlm` que el mapper ya sabe construir"
  - id: IN-12
    severity: info
    disposition: open
    title: "`confirmacion.policy.ts` reimplementa la normalización de `normalizar.util.ts`"
  - id: IN-13
    severity: info
    disposition: open
    title: "`preguntaConfirmacion` se exporta solo para que las pruebas armen el valor esperado"
  - id: IN-14
    severity: info
    disposition: open
    title: "Vuelve el nombre `Desenlace`, que la fase 1 había renombrado"
  - id: IN-15
    severity: info
    disposition: open
    title: "`MENSAJE_AGENTE` se indexa por la clave literal en lugar de por el código"
  - id: IN-16
    severity: info
    disposition: open
    title: "Los tipos de la compuerta se reescriben en lugar de componerse"
  - id: IN-17
    severity: info
    disposition: open
    title: "El destino de logs `{ write(linea): void }` está escrito cuatro veces, y el tipo de infra se exporta sin uso"
  - id: IN-18
    severity: info
    disposition: open
    title: "Hay constantes nuevas en el ámbito o el idioma equivocados"
  - id: IN-19
    severity: info
    disposition: open
    title: "Hay dos listas de claves secretas mantenidas a mano"
  - id: IN-20
    severity: info
    disposition: open
    title: "Hay funciones con cinco parámetros posicionales y booleanos posicionales"
  - id: IN-21
    severity: info
    disposition: open
    title: "`docs/estructura.md` no refleja los módulos que agregó la fase 02"
  - id: IN-22
    severity: info
    disposition: open
    title: "Las pruebas duplican helpers que ya existen y comparan con literales de familia"
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
    title: "The agent clock re-parses the environment on every call and silently diverges from the tools when `FECHA_EJECUCION` is invalid"
open: 36
total: 39
recorded: 2026-10-13T23:25:48.205Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-07 | warning | open | - |
| WR-08 | warning | open | - |
| WR-09 | warning | open | - |
| WR-10 | warning | open | - |
| WR-11 | warning | open | - |
| WR-12 | warning | open | - |
| WR-13 | warning | open | - |
| WR-14 | warning | open | - |
| IN-09 | info | open | - |
| IN-10 | info | open | - |
| IN-11 | info | open | - |
| IN-12 | info | open | - |
| IN-13 | info | open | - |
| IN-14 | info | open | - |
| IN-15 | info | open | - |
| IN-16 | info | open | - |
| IN-17 | info | open | - |
| IN-18 | info | open | - |
| IN-19 | info | open | - |
| IN-20 | info | open | - |
| IN-21 | info | open | - |
| IN-22 | info | open | - |
| WR-01 | warning | open | - (not in the current review) |
| WR-02 | warning | open | - (not in the current review) |
| WR-03 | warning | open | - (not in the current review) |
| WR-04 | warning | open | - (not in the current review) |
| IN-01 | info | open | - (not in the current review) |
| IN-02 | info | open | - (not in the current review) |
| IN-03 | info | open | - (not in the current review) |
| IN-04 | info | open | - (not in the current review) |
| IN-05 | info | open | - (not in the current review) |
| CR-01 | critical | fixed | fixed by 02-14 (verified in re-review 4c30e81) (not in the current review) |
| CR-02 | critical | fixed | fixed by 02-10 (verified in re-review 4c30e81) (not in the current review) |
| CR-03 | critical | fixed | fixed by 02-11 (verified in re-review 4c30e81) (not in the current review) |
| WR-05 | warning | open | - (not in the current review) |
| WR-06 | warning | open | - (not in the current review) |
| IN-06 | info | open | - (not in the current review) |
| IN-07 | info | open | - (not in the current review) |
| IN-08 | info | open | - (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
