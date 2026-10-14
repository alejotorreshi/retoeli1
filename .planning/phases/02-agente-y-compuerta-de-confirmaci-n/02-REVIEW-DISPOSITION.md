---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: WR-15
    severity: warning
    disposition: open
    title: "[WARNING] \"No envíes nada todavía\" seguido de una pregunta ya no cancela: el servidor vuelve a pedir la confirmación justo después de la negación"
  - id: WR-16
    severity: warning
    disposition: open
    title: "[WARNING] un pedido distinto que contiene \"para\", \"no\", \"luego\", \"mejor\" o \"después\" se clasifica como rechazo y cancela el caso pendiente, aunque D-63.6 y el prompt prometen que sigue pendiente"
  - id: WR-17
    severity: warning
    disposition: open
    title: "[WARNING] el rechazo estructurado de un caso (`{ aprobada: false, caso }`) cancela todos los casos pendientes"
  - id: WR-18
    severity: warning
    disposition: open
    title: "[WARNING] D-63.7 vuelve a ofrecer el envío de un paquete que la herramienta acaba de declarar no armado o desactualizado, y el texto del servidor lo describe como vigente"
  - id: IN-23
    severity: info
    disposition: open
    title: "[INFO] un `simular_envio` desobediente en el mismo turno de un rechazo explícito deshace el rechazo"
  - id: IN-24
    severity: info
    disposition: open
    title: "[INFO] `SEPARADOR_ISSUES` es el mismo \"; \" que usa `TEXTO_ENV.urlNoSegura` dentro de su oración"
  - id: IN-25
    severity: info
    disposition: open
    title: "[INFO] la prueba \"PAQUETE_DESACTUALIZADO y un re-armado en el mismo turno dejan el caso pendiente con los bloqueos nuevos\" no comprueba ningún bloqueo"
  - id: IN-26
    severity: info
    disposition: open
    title: "[INFO] los contratos nuevos del prompt y del conocimiento comprueban fragmentos tan cortos que no fijan la regla"
  - id: IN-27
    severity: info
    disposition: open
    title: "[INFO] `FALLIDO` trata cualquier `ok: false` como \"no se envió\", incluido un fallo posterior a escribir `ENVIO-SIMULADO.md`"
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
open: 23
total: 48
recorded: 2026-10-14T03:20:13.827Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-15 | warning | open | - |
| WR-16 | warning | open | - |
| WR-17 | warning | open | - |
| WR-18 | warning | open | - |
| IN-23 | info | open | - |
| IN-24 | info | open | - |
| IN-25 | info | open | - |
| IN-26 | info | open | - |
| IN-27 | info | open | - |
| CR-01 | critical | open | - (not in the current review) |
| WR-01 | warning | open | - (not in the current review) |
| WR-02 | warning | open | - (not in the current review) |
| IN-01 | info | open | - (not in the current review) |
| IN-02 | info | open | - (not in the current review) |
| IN-03 | info | open | - (not in the current review) |
| IN-04 | info | open | - (not in the current review) |
| IN-05 | info | open | - (not in the current review) |
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

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
