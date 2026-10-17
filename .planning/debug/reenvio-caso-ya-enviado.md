---
status: diagnosed
trigger: "G-02-3 (UAT T03, major): after a successful send, a model retry of simular_envio re-opens the already-sent case as pending and a later 'envía' rewrites ENVIO-SIMULADO.md (2 send lines in the log)"
created: 2026-10-13T00:00:00Z
updated: 2026-10-13T00:40:00Z
goal: find_root_cause_only
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (determinista: se reproduce siempre con el guion del seed T03 y con la política pura)
hypothesis: CONFIRMADA. cerrarTurno/aplicarEvento (compuerta.policy.ts) reabre como pendiente cualquier caso con evento BLOQUEADO que esté en `conocidos`, y `conocidos` (sesion.paquetesConocidos) conserva el caso después de un ENVIADO porque nada lo quita ni lo marca como enviado; un reintento bloqueado del modelo tras el envío deja el caso pendiente y el siguiente 'envía' autoriza un segundo simular_envio que reescribe ENVIO-SIMULADO.md.
test: hecho (reproducción base, sonda de política pura, variante en el mismo turno y experimento diferencial con parche solo en scratch)
expecting: n/a
next_action: devolver ROOT CAUSE FOUND (goal: find_root_cause_only); el arreglo lo planifica plan-phase --gaps

reasoning_checkpoint:
  hypothesis: "El caso enviado se reabre porque aplicarEvento promueve a pendiente todo BLOQUEADO cuyo caso esté en conocidos, y conocidos nunca registra que el paquete ya se envió (ENVIADO solo borra del mapa local del pliegue)."
  confirming_evidence:
    - "Seed T03 sin cambios: confirmacionesT3=[ec-corp-andina], needsConfirmationT3=true, turno 4 simular ok, 2 líneas ok de simular_envio en la misma sesión en out/ec-corp-andina/log.jsonl, ENVIO-SIMULADO.md reescrito."
    - "Sonda pura: cerrarTurno({eventos:[ENVIADO ec, BLOQUEADO ec], conocidos:{ec}}) y cerrarTurno({eventos:[BLOQUEADO ec], conocidos:{ec}}) dan pendiente [ec]; con conocidos vacío da []."
    - "Variante mismo turno por el ciclo real: 'envía' con dos simular(ec) da [ok, CONFIRMACION_REQUERIDA], confirmation_required(ec) y needsConfirmation=true en el turno del envío; el 'envía' siguiente envía de nuevo (enviosOk=2)."
    - "Diferencial: quitar el caso de turno.conocidos al aplicar ENVIADO (solo en la copia scratch) hace pasar (a), (b) y (c), deja needsConfirmationT3=false, bloquea el turno 4 y deja 1 línea ok."
  falsification_test: "Si con conocidos sin el caso enviado el turno 3 siguiera reabriendo o el turno 4 siguiera enviando, la causa estaría en otro lado (clasificador, abrirTurno o recuperarAutorizado). No ocurrió."
  fix_rationale: "La compuerta es la única barrera contra el doble envío (la herramienta no tiene guarda de idempotencia y no debe tenerla: contrato v1). Hacer que la compuerta recuerde los casos enviados y que BLOQUEADO no los promueva ataca la causa, no el síntoma."
  blind_spots: "No probé en vivo con DeepSeek (no hace falta: es lógica determinista). No decidí si un ARMADO posterior al envío debe abrir un ciclo nuevo; es una decisión de producto para el planner. El parche diferencial cambia el ruteo del log por caso (casoResuelto), así que no es el arreglo final."
  candidate_causes:
    - "code: aplicarEvento (compuerta.policy.ts:78-93) promueve BLOQUEADO desde conocidos sin mirar si el caso ya se envió; ENVIADO solo borra del mapa local."
    - "data/estado de sesión: Sesion.paquetesConocidos (turno.type.ts:37) solo crece (paso-herramientas.service.ts:64) y se persiste entre turnos (guardado-turno.service.ts:46); no existe un estado 'enviado'."
    - "config/especificación: D-38 ('deja la sesión en pendiente') y D-63.1 no excluyen los casos ya enviados, y la decisión 02-06 eligió conservar el caso en conocidos para 'volver a preguntar'."
    - "environment (descartado como causa): el reintento del modelo es solo el disparador; un modelo puede reintentar siempre y la compuerta debe ser robusta a eso."
  and_gate: "Sí, en sentido débil: el defecto se manifiesta solo si (1) conocidos conserva el caso enviado Y (2) BLOQUEADO promueve desde conocidos sin estado 'enviado'; los dos viven en la misma decisión de diseño (02-06) y se arreglan juntos dando a la compuerta un registro de enviados. El reintento del modelo y el segundo 'envía' son disparadores, no causas."

## Symptoms

expected: (a) simular_envio bloqueado sin confirmación explícita; (b) el turno 2 'envía' del guion §11 escribe out/ec-corp-andina/ENVIO-SIMULADO.md una sola vez y solo para ese caso; (c) un 'envía' repetido sin un caso pendiente nuevo no escribe un segundo ENVIO-SIMULADO.md
actual: tras un envío correcto, un reintento del modelo de simular_envio (bloqueado con CONFIRMACION_REQUERIDA) reabre el caso ya enviado como pendiente; el servidor vuelve a preguntar y un 'envía' posterior reescribe ENVIO-SIMULADO.md (2 líneas de envío ok en out/ec-corp-andina/log.jsonl)
errors: ninguno (comportamiento)
reproduction: .qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-T03-compuerta-guion-prd11.ts vía seeds/02-B-run.sh <scratch> T03
started: descubierto en UAT de la fase 02 (evidencia 02-QA-EVIDENCE-2026-10-13T23-51-20Z.md, bloque T03)

## Eliminated

## Evidence

- timestamp: 2026-10-13T00:10:00Z
  checked: Fase 0, base de conocimiento (.planning/debug/knowledge-base.md)
  found: no existe el archivo; MemPalace no consultado (sin coincidencias conocidas). Sesiones activas no relacionadas (borrador-*, envio-lista-internos, xlsx-anchos-columna).
  implication: sin patrón previo; investigación abierta.

- timestamp: 2026-10-13T00:12:00Z
  checked: src/domain/policies/compuerta.policy.ts líneas 70-100 (conocido, aplicarEvento, cerrarTurno)
  found: aplicarEvento trata ARMADO (set), ENVIADO (delete en el mapa local `pendientes`) y, para cualquier otro evento (BLOQUEADO), busca el paquete con conocido(caso, conocidos, pendientes) = paqueteConocido(conocidos) ?? pendientes.get(caso) y lo vuelve a poner pendiente. ENVIADO solo borra del mapa local del fold; no toca `conocidos` ni deja marca de "enviado".
  implication: un BLOQUEADO posterior a un ENVIADO (en el mismo turno o en uno siguiente) reabre el caso enviado, porque `conocidos` sigue teniéndolo.

- timestamp: 2026-10-13T00:14:00Z
  checked: grep de conocidos/paquetesConocidos en src/ (paso-herramientas.service.ts:64, guardado-turno.service.ts:28,46, ejecutar-turno.service.ts:37,77)
  found: el único escritor de conocidos es paso-herramientas.service.ts:64 (`turno.conocidos = {...turno.conocidos, [paquete.caso]: paquete}` tras un armar_paquete ok). Nadie lo borra ni lo marca al enviar; guardarSesion persiste `paquetesConocidos: turno.conocidos` y crearTurno lo vuelve a cargar en el turno siguiente.
  implication: el caso enviado vive en la sesión como "paquete armado conocido" para siempre (hasta expirar la sesión).

- timestamp: 2026-10-13T00:16:00Z
  checked: src/loop/services/despacho-llamada.service.ts despacharEnvio/bloquearEnvio
  found: evaluarEnvio rechaza cuando la autorización está usada o el caso no coincide; bloquearEnvio emite `{tipo: BLOQUEADO, caso}` siempre que el caso sea parseable, sin mirar si el caso ya fue enviado. Con autorización, despacharEnvio fuerza {caso, confirmado:true} y ejecuta la herramienta, que reescribe ENVIO-SIMULADO.md sin guarda de idempotencia propia.
  implication: la única barrera contra el segundo envío es la compuerta; si la compuerta reabre el caso, el siguiente 'envía' autoriza un segundo envío real.

- timestamp: 2026-10-13T00:18:00Z
  checked: decisiones y revisiones (02-06-SUMMARY.md:68, STATE.md decisión 02-06, 02-03-SUMMARY.md:53,150, 02-CONTEXT D-38 y D-63.1, 02-REVIEW.md IN-06 en 421e859)
  found: 02-06 decidió a propósito "paquetesConocidos keeps a caso after a successful send, so a later blocked retry re-opens the question instead of sending twice (AGT-04 idempotency)". D-38 dice que un simular_envio sin autorización "deja la sesión en pendiente"; D-63.1 lo limita a paquetes armados en la sesión, sin excluir los ya enviados. IN-06 (02-REVIEW, info, open): "After ENVIADO, the case stays in conocidos. A later blocked simular_envio re-adds it as pending, and one more 'sí' writes a second simulated send. Fix: Remove the case from conocidos when an ENVIADO event is applied, or mark it as sent."
  implication: el comportamiento es una decisión de diseño de 02-06 que solo miró el turno inmediato (bloquear y volver a preguntar) y no el turno siguiente; IN-06 describe exactamente el mismo mecanismo.

- timestamp: 2026-10-13T00:20:00Z
  checked: tests/loop/compuerta-casos.test.ts:286-302 (AGT-04) y :262-273 (dos simular en el turno confirmado)
  found: el test AGT-04 fija que el turno 3 queda bloqueado, termina preguntando por EC y needsConfirmation === true, y se detiene ahí: nunca manda un cuarto 'envía'. El test de dos simular(ec) en el turno confirmado no comprueba needsConfirmation del turno 2 (eventos [ENVIADO, BLOQUEADO] → el BLOQUEADO reabre EC en el mismo turno).
  implication: la suite actual consagra la reapertura (needsConfirmation true tras el envío) y no tiene ningún test del turno 4, por eso el defecto pasó todos los gates. Un arreglo tiene que cambiar esa aserción.

- timestamp: 2026-10-13T00:25:00Z
  checked: reproducción base con seeds/02-B-run.sh <scratch>/dbg-g023 T03 (copia limpia, sin parches)
  found: asserts (a), (b) y (c) ok; observacionT4 = {confirmacionesT3: [ec-corp-andina], needsConfirmationT3: true, finSimularT4: [{ok: true}], lineasEnvioOkTrasT4: 2, envioReescrito: true}. En out/ec-corp-andina/log.jsonl la sesión del guion b tiene simular_envio ok, bloqueado, ok. El texto del turno 3 termina con "¿Confirmas el envío simulado de ec-corp-andina?" aunque ya se envió en el turno 2.
  implication: reproducido exactamente como lo reportó la UAT (OBS-T03-4).

- timestamp: 2026-10-13T00:27:00Z
  checked: sonda de política pura (qa-politica.ts en scratch) sobre cerrarTurno
  found: {mismoTurno: [ec] con eventos [ENVIADO, BLOQUEADO]; turnoPosterior: [ec] con [BLOQUEADO]; sinConocidos: []}
  implication: el defecto está en la política y en su entrada `conocidos`; el ciclo solo le pasa los eventos en orden.

- timestamp: 2026-10-13T00:30:00Z
  checked: variante en el mismo turno por el ciclo real (qa-mismo-turno.ts en scratch): turno 2 'envía' con dos simular(ec), turno 3 'envía'
  found: t2 fines [[true,null],[false,"CONFIRMACION_REQUERIDA"]], confirmaciones [ec], needsConfirmation true; t3 fines [[true,null]]; enviosOk 2
  implication: no hace falta un turno extra: un reintento del modelo en el mismo turno del envío ya reabre el caso y el siguiente 'envía' lo envía dos veces. El test "dos simular(ec) en el turno confirmado" no lo detecta porque no comprueba needsConfirmation.

- timestamp: 2026-10-13T00:33:00Z
  checked: experimento diferencial solo en la copia scratch (paso-herramientas.service.ts: al recibir un evento ENVIADO, quitar el caso de turno.conocidos) y reejecución limpia del seed T03
  found: (a), (b), (c) ok; needsConfirmationT3 false; confirmacionesT3 []; turno 4 bloqueado con CONFIRMACION_REQUERIDA; lineasEnvioOkTrasT4 1; envioReescrito false. Efecto lateral: los intentos bloqueados del caso ya enviado dejan de copiarse a out/ec-corp-andina/log.jsonl (solo quedan en out/log.jsonl), porque despacho-llamada.service.ts:38-41 (casosDeBitacora → casoResuelto) y bitacora-turno.service.ts:47-50 (caso en gate_*) también usan conocidos.
  implication: causalidad confirmada (quitar la entrada en conocidos elimina el síntoma). Pero borrar de conocidos no es el arreglo adecuado: conocidos también sirve para rutear el log por caso (CA4) y atribuir el caso en las líneas gate_*. El arreglo debe registrar "enviado" aparte (o marcar la entrada) y que BLOQUEADO no promueva casos enviados.

- timestamp: 2026-10-13T00:35:00Z
  checked: src/application/use-cases/simular-envio.use-case.ts
  found: la herramienta escribe ENVIO-SIMULADO.md siempre que reciba confirmado:true y exista paquete/checklist.md; no tiene guarda de idempotencia (contrato v1 de la fase 1, la demo la reejecuta).
  implication: la compuerta del ciclo es la única barrera contra el doble envío; el arreglo va en la compuerta, no en la herramienta.

## Resolution

root_cause: "La compuerta no tiene estado 'enviado': aplicarEvento (src/domain/policies/compuerta.policy.ts:78-93) vuelve pendiente cualquier caso con un evento BLOQUEADO que esté en `conocidos`, y sesion.paquetesConocidos conserva el caso después de un ENVIADO exitoso (decisión 02-06; ENVIADO solo borra del mapa local del pliegue), así que un reintento bloqueado de simular_envio, en el mismo turno o en uno posterior, reabre el caso ya enviado y el 'envía' siguiente autoriza un segundo envío que reescribe ENVIO-SIMULADO.md. Es el mismo defecto que IN-06."
fix: "(no aplica: goal find_root_cause_only)"
verification: "Diagnóstico verificado con reproducción base, sonda de política pura, variante en el mismo turno y experimento diferencial en scratch (parche descartado)."
files_changed: []
oracle_type: specified (ENV-02 / gap truth G-02-3: una sola escritura de ENVIO-SIMULADO.md por caso y ningún pendiente tras el envío)
