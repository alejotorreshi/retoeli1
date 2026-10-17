---
status: diagnosed
trigger: "G-03-26 (UAT test 26, major): 'Sí, envía co-industrias-delta' sin confirmación pendiente queda bloqueado (CONFIRMACION_REQUERIDA, sin ENVIO-SIMULADO.md), pero la respuesta final dice 'Registré el envío simulado…' con needsConfirmation:false; la mitigación de fase 2 (pregunta de cierre del servidor) no cubre el camino sin pendiente; el log gate_blocked registra caso:null"
created: 2026-10-15T14:10:00Z
updated: 2026-10-15T14:45:00Z
goal: find_root_cause_only
audit_acknowledged:
  milestone: v1
  at: 2026-10-16
  status: diagnosed
---

## Current Focus

bug_class: Bohrbug (determinista: el mismo guion produce siempre el mismo texto final; se reproduce sin HTTP, solo con el bucle)
known_pattern_candidate: ninguno (no hay knowledge-base.md ni MemPalace)
hypothesis: CONFIRMADA. El servidor no tiene ningún cierre determinista para un proveedor_simular_envio bloqueado o fallido; el único texto del servidor tras la compuerta es la pregunta de confirmación de cierreConPregunta, que solo aparece si cerrarTurno deja un pendiente. Un BLOQUEADO solo deja pendiente si el caso está en sesion.paquetesConocidos (armado en la sesión) y no en casosEnviados. En una sesión nueva (T24), con un caso ya enviado o con argumentos sin caso, pendientes = [] y el texto libre del modelo sale tal cual, con needsConfirmation:false. Es la decisión aceptada en fase 2 (AGT-03 / T-02-41 / AR-02-01: "el servidor nunca reescribe la prosa del modelo"), cuyo supuesto de mitigación ("el último párrafo siempre es la pregunta del servidor") solo vale con pendiente. Aparte, gate_blocked registra caso:null porque bitacora-turno.casoConocido solo escribe casos con paquete armado en la sesión.
test: hecho (reproducción offline A/B/C/D en copia scratch, diferencial con aviso del servidor en el cierre, suite completa base vs parche)
expecting: n/a
next_action: devolver ROOT CAUSE FOUND (goal: find_root_cause_only); el arreglo lo planifica plan-phase --gaps

reasoning_checkpoint:
  hypothesis: "La respuesta afirma un envío que no ocurrió porque cerrarTurnoConCompuerta (cierre-turno.service.ts:21-31) solo agrega texto del servidor cuando hay pendientes (cierreConPregunta, cierre-turno.builder.ts:49), y un simular_envio bloqueado sin paquete armado en la sesión no crea pendiente (reabrirConocido, compuerta.policy.ts:79-88). Nada más en el cierre mira los envíos bloqueados o fallidos, así que el texto del modelo pasa intacto."
  confirming_evidence:
    - "Escenario A (sesión nueva, 'Sí, envía co-industrias-delta', simular {caso, confirmado:true}, luego la mentira): tool_end ok:false CONFIRMACION_REQUERIDA, sin ENVIO-SIMULADO.md, reply = la mentira exacta, needsConfirmation:false, gate_blocked con caso null. Idéntico al T24 por HTTP, así que la capa HTTP no participa."
    - "Escenario B (mismo turno arma y luego intenta enviar): la compuerta reabre el caso, needsConfirmation:true y el servidor agrega su pregunta; la mentira sigue arriba, sin corregir (T-02-41)."
    - "Escenario C (caso ya enviado): reply 'Registré el envío simulado otra vez.', needsConfirmation:false. Escenario D (args sin caso): evento de compuerta null, reply = la mentira."
    - "El modelo sí recibe el bloqueo: el mensaje de herramienta es {ok:false,error:'requiere confirmación explícita',codigo:'CONFIRMACION_REQUERIDA',resumen:'simular_envio: CONFIRMACION_REQUERIDA'}. La única defensa contra la afirmación es agent/prompt.md:59."
    - "Diferencial (solo scratch): un aviso del servidor en cerrarTurnoConCompuerta, calculado desde turno.llamadas (simular_envio con ok:false cuyo caso no quedó pendiente), aparece en A, C y D y no cambia B. Base 2127 pass / 0 fail; con el parche fallan exactamente las 4 pruebas que fijan el paso intacto del texto (D-63.1, D-38, AGT-04, D-68) más G6/G8 por los literales del parche."
  falsification_test: "Si con el aviso del servidor en el cierre el reply de A siguiera sin decir que no hubo envío, o si el texto se alterara en otra capa (respuestaDeTurno, SSE), la causa estaría fuera del cierre. No ocurrió: el aviso aparece en A/C/D y respuestaDeTurno solo concatena eventos TEXTO."
  fix_rationale: "cerrarTurnoConCompuerta es el único punto donde el servidor ya escribe texto determinista al final del turno, y tiene a mano los eventos de compuerta y (vía guardado-turno) turno.llamadas. Que el servidor redacte el desenlace de todo simular_envio que no terminó en ENVIADO, haya o no pendiente, ataca la causa (falta de garantía estructural) y no depende del modelo."
  blind_spots: "No probé DeepSeek en vivo para este mensaje exacto (T25 mostró que el modelo real rechaza bien un 'ok'; la mentira es improbable con el modelo real, pero el servidor no la impide). Agregar un aviso no borra la afirmación falsa (queda arriba, como en B); reemplazar o suprimir la prosa del modelo en ese turno es una decisión de producto que revierte AGT-03/T-02-41. El texto y la forma exacta del aviso (y si needsConfirmation debe seguir false cuando no hay paquete armado) quedan para el planner."
  candidate_causes:
    - "code: cerrarTurnoConCompuerta / cierreConPregunta solo agregan texto con pendientes; no existe un cierre para envíos bloqueados o fallidos (cierre-turno.service.ts:21-31, cierre-turno.builder.ts:48-53)."
    - "code: reabrirConocido promueve BLOQUEADO a pendiente solo con paquete armado y no enviado (compuerta.policy.ts:79-88); despacho-llamada.service.ts:59 no emite evento si el caso no se puede leer. Es correcto para la compuerta (no se puede pedir confirmación de un paquete inexistente), pero deja sin texto del servidor esos caminos."
    - "especificación/decisión: AGT-03 y T-02-41/AR-02-01 aceptaron que el servidor nunca reescribe la prosa del modelo, con la mitigación 'el último párrafo siempre es la pregunta del servidor', que no cubre el camino sin pendiente (02-18-PLAN.md:272, 02-SECURITY.md:79,136)."
    - "data/pruebas: tests/loop/compuerta-casos.test.ts fija textoFinal 'Hecho.' tras bloqueos sin pendiente (D-63.1, AGT-04, D-38, D-68), así que la suite trata el paso intacto como contrato."
    - "environment/model (disparador, no causa): el LLM falso miente por guion; el modelo real recibe CONFIRMACION_REQUERIDA y agent/prompt.md:59 le prohíbe afirmar el envío, pero esa regla no es una garantía."
    - "code (secundaria, log): bitacora-turno.service.ts:47-50 casoConocido devuelve null si el caso no está en paquetesConocidos, por eso gate_blocked registra caso:null aunque el caso sea un id válido; el CA4 de out/ sí guarda el caso (despacho-llamada.service.ts:42-45)."
  and_gate: "Sí. La afirmación falsa llega a la usuaria solo si (1) el modelo escribe una afirmación falsa Y (2) el servidor no agrega ni impone un desenlace determinista porque no hay pendiente. (1) no se puede controlar desde el servidor; (2) es el defecto. El caso:null del log es una causa independiente (OR) de un síntoma secundario."

## Symptoms

expected: Con 'Sí, envía co-industrias-delta' en una sesión SIN confirmación pendiente, el envío queda bloqueado (lo está) y la respuesta visible no afirma que el envío ocurrió; el servidor cierra el turno de forma determinista (p. ej. una pregunta que pide confirmar o que dice que no se envió nada).
actual: Por HTTP (servidor local en modo producción, LLM falso guionado que llama proveedor_simular_envio {caso, confirmado:true} y luego devuelve "Registré el envío simulado de co-industrias-delta (LLM falso)."): la herramienta queda bloqueada (CONFIRMACION_REQUERIDA, sin out/co-industrias-delta/ENVIO-SIMULADO.md), pero la respuesta final contiene "Registré el envío simulado…" y needsConfirmation:false. La mitigación de fase 2 (pregunta de cierre del servidor cuando hay pendiente, OBS-T08) no aplica cuando no hay nada pendiente. El log gate_blocked registra "caso":null.
errors: ninguno (HTTP 200); log gate_blocked caso:null
reproduction: UAT test 26 (QA T24). Bloque T24 en .qa/evidence/03-chat-web-api-sse-y-despliegue/03-QA-EVIDENCE-2026-10-15T13-18-49Z.md; seed .qa/evidence/03-chat-web-api-sse-y-despliegue/seeds/03-fake-llm.ts. Offline con crearAgente + tests/helpers/fetch-falso.helper.ts en copia scratch.
started: descubierto en UAT 2026-10-15; OBS-T08 de fase 2 se mitigó solo para el camino con pendiente.

## Eliminated

- hypothesis: la compuerta deja pasar el envío por HTTP
  evidence: escenarios A/C/D y T24: tool_end ok:false CONFIRMACION_REQUERIDA y no existe out/co-industrias-delta/ENVIO-SIMULADO.md.
  timestamp: 2026-10-15T14:30:00Z

- hypothesis: el modelo no se entera del bloqueo (el resultado de la herramienta no vuelve al historial)
  evidence: el último pedido al LLM en A trae el mensaje de herramienta {"ok":false,"error":"requiere confirmación explícita","codigo":"CONFIRMACION_REQUERIDA",...}.
  timestamp: 2026-10-15T14:30:00Z

- hypothesis: la capa HTTP (respuestaDeTurno o el SSE) altera el texto o needsConfirmation
  evidence: el bucle solo, sin HTTP, da el mismo reply y needsConfirmation:false; respuesta-turno.service.ts:24-39 solo concatena eventos TEXTO y copia needsConfirmation de FIN_TURNO.
  timestamp: 2026-10-15T14:30:00Z

- hypothesis: gate_blocked trae caso:null porque los args de simular_envio (con confirmado:true) no pasan argumentosConCasoSchema
  evidence: el SSE y el CA4 usan el mismo casoDeArgumentos y sí traen el caso; en el escenario B (caso armado) gate_blocked trae caso:"co-industrias-delta". El null sale del filtro casoConocido (paquete armado en la sesión), no del parseo.
  timestamp: 2026-10-15T14:32:00Z

## Evidence

- timestamp: 2026-10-15T14:12:00Z
  checked: knowledge base (Phase 0)
  found: no existe .planning/debug/knowledge-base.md y MemPalace no está disponible. Sesiones relacionadas en .planning/debug/: reenvio-caso-ya-enviado.md (G-02-3, compuerta y casosEnviados) y acuse-suelto-confirma-envio.md (clasificador). Ninguna trata el texto final tras un bloqueo.
  implication: sin candidato conocido; se investiga desde cero.

- timestamp: 2026-10-15T14:14:00Z
  checked: bloque T24 de 03-QA-EVIDENCE y seeds/03-fake-llm.ts
  found: en sesión nueva (sessionId:null), el LLM falso llama proveedor_simular_envio {caso:"co-industrias-delta", confirmado:true}; tool_end ok:false CONFIRMACION_REQUERIDA; luego el texto "Registré el envío simulado de co-industrias-delta (LLM falso)." llega tal cual; turn_end needsConfirmation:false; gate_blocked con caso:null mientras el SSE trae caso:"co-industrias-delta".
  implication: la compuerta dura funciona; el defecto es la veracidad del texto final y el caso en el log.

- timestamp: 2026-10-15T14:18:00Z
  checked: src/loop/services/conversacion-turno.service.ts:89-91, guardado-turno.service.ts:19-32, cierre-turno.service.ts:21-31, domain/builders/cierre-turno.builder.ts:48-53
  found: cuando el modelo responde sin llamadas, el cierre es cerrarSinError(FINAL, respuesta.texto). cerrarCompuerta pasa ese texto a cerrarTurnoConCompuerta, que solo lo transforma con cierreConPregunta(limpiarMarkdown(texto), pendientes). cierreConPregunta devuelve el texto sin tocar si pendientes.length === 0 (línea 49). No hay ninguna otra ruta del servidor que mire los eventos BLOQUEADO/FALLIDO para el texto.
  implication: el único texto determinista del servidor tras un bloqueo es la pregunta de confirmación, y depende de que exista un pendiente.

- timestamp: 2026-10-15T14:20:00Z
  checked: src/domain/policies/compuerta.policy.ts:79-127 (reabrirConocido, aplicarEvento, cerrarTurno)
  found: BLOQUEADO solo crea un pendiente si el caso está en `conocidos` (sesion.paquetesConocidos, que solo se llena con un armar_paquete exitoso en la sesión) y no está en `enviados`. En una sesión nueva conocidos = {} → cerrarTurno devuelve LIBRE → pendientes = [] → needsConfirmation:false y texto intacto.
  implication: hay al menos tres caminos donde un simular_envio bloqueado no deja pendiente: (a) caso sin paquete armado en la sesión (T24), (b) caso ya enviado (AGT-04, D-63.4), (c) argumentos sin caso parseable (evento null en despacho-llamada.service.ts:59).

- timestamp: 2026-10-15T14:22:00Z
  checked: decisiones de fase 2 (02-18-PLAN.md:272, 02-SECURITY.md T-02-41 / AR-02-01, 02-22-PLAN.md T-02-69, STATE.md:216)
  found: "[AGT-03, unresolved] The server never rewrites model prose (T-02-41 accepted). If the model claims a send that the gate blocked (QA OBS-T08), only the prompt rule and the human check guard against it. No server-side text check is added." AR-02-01 aceptó el riesgo apoyándose en que "the last paragraph is always the server question naming the case", supuesto que solo vale con pendiente.
  implication: la ausencia de un cierre determinista tras un bloqueo es una decisión de diseño aceptada en fase 2 cuyo supuesto de mitigación no cubre el camino sin pendiente.

- timestamp: 2026-10-15T14:24:00Z
  checked: tests/loop/compuerta-casos.test.ts:219-231 (D-63.1) y 330-370 (AGT-04)
  found: las pruebas fijan el comportamiento actual: simular(ec) bloqueado en sesión nueva → needsConfirmation false y textoFinal "Hecho."; tras un envío, reintentos bloqueados → textoFinal "Hecho.". Ninguna prueba exige que el texto no afirme un envío.
  implication: la suite cementa el paso del texto del modelo sin tocar; un arreglo deberá actualizar esas filas.

- timestamp: 2026-10-15T14:26:00Z
  checked: src/loop/services/bitacora-turno.service.ts:47-61 y despacho-llamada.service.ts:42-45
  found: anotarHerramienta escribe gate_blocked con caso = casoConocido(llamada, conocidos), que devuelve null si el caso no está en paquetesConocidos. El CA4 (casosDeBitacora) sí guarda `caso` siempre que sea parseable. El SSE usa casoDeArgumentos sin filtro.
  implication: caso:null en gate_blocked es efecto directo de filtrar por "paquete armado en la sesión", no un fallo de parseo de args.

- timestamp: 2026-10-15T14:34:00Z
  checked: reproducción offline en copia scratch (crearAgentePrueba + llm-falso.helper + createLogger con capturarLogs), cuatro escenarios con la misma mentira guionada
  found: A (sesión nueva) reply = mentira, needsConfirmation:false, gate_blocked caso null, sin ENVIO-SIMULADO.md. B (arma y envía en el mismo turno) mentira + pregunta del servidor, needsConfirmation:true, gate_blocked caso co-industrias-delta. C (caso ya enviado) 'Registré el envío simulado otra vez.' intacto, needsConfirmation:false. D (args sin caso) mentira intacta, sin evento de compuerta.
  implication: el síntoma es del bucle, no de HTTP, y aparece en todo camino de bloqueo sin pendiente; con pendiente la afirmación tampoco se corrige, solo queda seguida de la pregunta.

- timestamp: 2026-10-15T14:36:00Z
  checked: mensaje de herramienta que recibe el modelo en A; agent/prompt.md:56-59
  found: el modelo recibe CONFIRMACION_REQUERIDA; la regla "Solo di que el envío simulado quedó registrado si proveedor_simular_envio devolvió ok" vive solo en el prompt. prompt.md:56 ("En el turno en que la analista confirma, responde solo con el resultado del envío simulado…") puede empujar a un modelo real a usar la plantilla de éxito cuando el mensaje parece una confirmación.
  implication: con DeepSeek la mentira es improbable (T25 rechazó bien un 'ok'), pero la veracidad depende del modelo, no del servidor.

- timestamp: 2026-10-15T14:40:00Z
  checked: experimento diferencial solo en scratch: guardado-turno.cerrarCompuerta pasa los casos de simular_envio con ok:false (turno.llamadas) y cerrarTurnoConCompuerta agrega un aviso fijo si alguno no quedó pendiente
  found: A, C y D terminan con el aviso del servidor; B no cambia. Suite base en scratch: 2127 pass, 0 fail. Con el parche: fallan D-63.1, D-38 (G-02-3), AGT-04 y D-68 en tests/loop/compuerta-casos.test.ts (fijan textoFinal 'Hecho.'), más G6/G8 por los literales del parche. Ninguna otra prueba cambia.
  implication: el punto de arreglo es el cierre del turno; el parche diferencial no es el arreglo final (un aviso deja la afirmación falsa arriba y no cumple las reglas de strings/constantes).

## Resolution

root_cause: "(1) Principal: el servidor no garantiza la veracidad del cierre tras un proveedor_simular_envio que no terminó en ENVIADO. cerrarTurnoConCompuerta (src/loop/services/cierre-turno.service.ts:21-31) solo agrega texto del servidor mediante cierreConPregunta (src/domain/builders/cierre-turno.builder.ts:48-53), que devuelve el texto del modelo intacto cuando pendientes = []; y un BLOQUEADO solo crea pendiente si el caso tiene paquete armado en la sesión y no fue enviado (reabrirConocido, src/domain/policies/compuerta.policy.ts:79-88; sin caso legible ni siquiera hay evento, despacho-llamada.service.ts:59). En sesión nueva, caso ya enviado o args sin caso, la afirmación libre del modelo llega tal cual con needsConfirmation:false. Es la decisión aceptada AGT-03 / T-02-41 / AR-02-01 de fase 2 ('el servidor nunca reescribe la prosa del modelo'), cuya mitigación supone que siempre cierra la pregunta del servidor, y las pruebas D-63.1, D-38, AGT-04 y D-68 fijan ese paso intacto; (2) secundaria e independiente: gate_blocked registra caso:null porque casoConocido (src/loop/services/bitacora-turno.service.ts:47-50) solo escribe casos presentes en paquetesConocidos, aunque el caso sea un id válido."
fix: ""
verification: ""
files_changed: []
