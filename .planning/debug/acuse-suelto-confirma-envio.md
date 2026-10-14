---
status: diagnosed
trigger: "G-02-18 (UAT H2/test 18, major, decisión de producto: endurecer): bare acknowledgements ('ok', 'listo', 'vale', 'claro', 'correcto', 'ok ok', 'si todo bien') must not count as explicit confirmation — per RN4, CA3, ENV-02 and D-39 (conservative; doubt gives 'otro' and the agent asks again)"
created: 2026-10-14T00:17:38Z
updated: 2026-10-14T00:22:02Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (determinista: función pura, el mismo texto da siempre la misma decisión)
known_pattern_candidate: ninguno (no existe .planning/debug/knowledge-base.md y MemPalace no está disponible; se siguió sin candidatos previos)
hypothesis: CONFIRMADA. Hay dos causas independientes (OR) en clasificarConfirmacion. (1) La rama `soloAcuses` de esConfirmacionClara, que añadió el plan 02-14, acepta como confirmación cualquier mensaje formado solo por ACUSES (ok, okay, vale, listo, claro, correcto). (2) sinDiacriticos borra la tilde antes de buscar en AFIRMACIONES, así que "si" (condicional) y "sí" (afirmación) son la misma palabra fuerte; con "todo" y "bien" en RELLENO, "si todo bien" confirma.
test: hecho (reproducción con el seed T04, sonda de ramas por frase, diferencial A sin soloAcuses y diferencial B con "si" sensible a la tilde, suite completa en la copia scratch)
expecting: n/a
next_action: devolver ROOT CAUSE FOUND (goal: find_root_cause_only); el arreglo lo planifica plan-phase --gaps

reasoning_checkpoint:
  hypothesis: "Los acuses sueltos confirman porque esConfirmacionClara devuelve `some(esAfirmacionFuerte) || soloAcuses(palabras)`. 'si todo bien' confirma porque el clasificador normaliza diacríticos antes de buscar 'si' en AFIRMACIONES, y 'todo' y 'bien' son relleno permitido."
  confirming_evidence:
    - "Sonda de ramas (código actual): 'ok','okay','listo','vale','claro','correcto','ok ok','vale listo','Listo.','OK!','claro, ok' confirman con fuerte=[] y acuse=[...], o sea solo por soloAcuses. 'si todo bien','si gracias','si por favor','si el paquete','si ya','si, el envío' confirman con fuerte=[si]. 'sí', 'si', 'SÍ' y el NFD 's+i+U+0301' dan todos fuerte=[si]."
    - "Seed T04 sin cambios: E2E 'ok' y 'si todo bien' dan simular ok:true y escriben out/ec-corp-andina/ENVIO-SIMULADO.md."
    - "Diferencial A (sin la rama soloAcuses, solo en scratch): 'ok','listo','vale','claro','correcto','ok ok' dan otro; 'ok, envía','listo, envíalo','vale, procede','claro, adelante','ok confirmo','sí, ok','correcto, envía' siguen confirmando."
    - "Diferencial B (A + 'si' sin tilde fuerte solo si es la única palabra): 'si todo bien','si, todo bien con el paquete','si gracias' dan otro; 'si','Si.','sí','SÍ','sí, todo bien','si, envía' confirman. E2E del seed T04: 'ok' y 'si todo bien' dejan simular_envio en CONFIRMACION_REQUERIDA y casosConEnvio=[]."
    - "Suite completa con B en scratch: 1091 pass, 1 skip, 6 fail. 5 fallos son filas de tabla que fijan el comportamiento actual y el sexto es G11, provocado por la regex inline del parche scratch, no por el comportamiento."
  falsification_test: "Si con la rama soloAcuses quitada 'ok' siguiera registrando el envío de punta a punta, la causa estaría en el bucle o en la compuerta (decisionDe, abrirTurno o el confirmado del modelo). No ocurrió: el envío quedó bloqueado con CONFIRMACION_REQUERIDA."
  fix_rationale: "decisionDe (ejecutar-turno.service.ts:45-53) es el único punto donde el texto se vuelve autorización. Endurecer la gramática allí (exigir una afirmación fuerte o un verbo de envío, y no tratar 'si' sin tilde como afirmación fuerte salvo cuando va solo) ataca la causa. La compuerta, el bucle y el prompt no deciden nada sobre el texto."
  blind_spots: "No probé en vivo con DeepSeek (no hace falta: el clasificador es puro). La lectura de 'si' sola es una decisión de producto (ver Resolution). 'si envía' sin coma sigue confirmando por el verbo 'envía'; D-39 exige que 'envía' solo confirme, así que se acepta como residual. Tras un 'otro' la compuerta queda LIBRE, y volver a preguntar depende del modelo (prompt, G-02-21) o de un intento bloqueado; es un comportamiento que ya existía para 'ok, gracias'."
  candidate_causes:
    - "code: la rama soloAcuses en esConfirmacionClara (confirmacion.policy.ts:46-55), añadida en a3c200b (02-14)."
    - "code: el lookup de AFIRMACIONES después de sinDiacriticos (confirmacion.policy.ts:71) hace a 'si' indistinguible de 'sí'; 'si' está en AFIRMACIONES (confirmation.constants.ts:12) desde f15a8c7 (02-03)."
    - "config/vocabulario: RELLENO incluye 'todo' y 'bien' (confirmation.constants.ts, desde f15a8c7). Por eso 'si todo bien' es 100% vocabulario permitido y cae el supuesto de RESEARCH Pattern 7 (línea 485), según el cual las condicionales siempre llevan palabras fuera de la lista."
    - "especificación/plan: 02-RESEARCH Pattern 7 fijó 'ok' → confirma (línea 493) y el plan 02-14 mantuvo los acuses solos a propósito, ambos contra D-39 (que no lista acuses). Las filas de test lo cementaron."
    - "environment/model (descartado): el envío no depende del modelo; el confirmado del modelo nunca se usa (02-06) y el diferencial aislado en el clasificador elimina el síntoma."
  and_gate: "No. Son dos causas independientes (OR), cada una suficiente para su familia de frases: los acuses dependen solo de soloAcuses, y 'si todo bien' solo de la colisión de tilde más el relleno. Hay que arreglar las dos; root_cause las lista juntas."

## Symptoms

expected: según PRD RN4 ("confirmación explícita del usuario"), CA3 ("solo procede si el siguiente mensaje del usuario confirma"), ENV-02 (clasificador determinista) y D-39 ("conservador… Confirma solo con afirmaciones o verbos claros ('envía', 'sí', 'confirmo', 'procede', 'dale', 'adelante', 'sí, envía')… La duda da `otro` y no autoriza"): un acuse suelto o un 'si' condicional nunca autoriza el envío simulado
actual: 'ok', 'listo', 'vale', 'claro', 'correcto', 'ok ok', 'si todo bien' clasifican como confirma; de punta a punta 'ok' y 'si todo bien' registran el envío. Riesgo extra: la pregunta del servidor dice "queda LISTO para firma", así que 'listo' como acuse de lectura dispara el envío; 'si' sin tilde es el condicional
errors: ninguno (comportamiento)
reproduction: UAT test 18; seed .qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-T04-clasificador-confirmacion.ts (seeds/02-B-run.sh <scratch-dir> T04)
started: descubierto en UAT; WR-01 de la revisión 4c30e81 lo señaló; el plan 02-14 (arreglo CR-01) mantuvo a propósito los acuses solos como confirmación

## Eliminated

- hypothesis: el envío lo autoriza el bucle o el modelo (confirmado:true en los args, o el prompt que induce a llamar simular_envio), no el clasificador
  evidence: decisionDe (src/loop/services/ejecutar-turno.service.ts:45-53) es el único camino de texto a autorización, y el ciclo construye {caso, confirmado:true} desde la autorización del servidor (02-06). El diferencial que solo cambió confirmacion.policy.ts dejó el mismo guion del modelo bloqueado con CONFIRMACION_REQUERIDA.
  timestamp: 2026-10-14T00:21:30Z

- hypothesis: la palabra "listo" de la pregunta del servidor ("queda LISTO para firma") se cuela de algún modo en la clasificación
  evidence: clasificarConfirmacion solo recibe entrada.mensaje (el texto de la analista); la pregunta del servidor nunca se clasifica. "listo" confirma por soloAcuses cuando la analista lo escribe. La pregunta solo hace más probable ese acuse.
  timestamp: 2026-10-14T00:21:40Z

## Evidence

- timestamp: 2026-10-14T00:20:00Z
  checked: src/domain/policies/confirmacion.policy.ts:50-55 (esConfirmacionClara) y src/config/constants/confirmation.constants.ts (AFIRMACIONES, ACUSES, RELLENO)
  found: esConfirmacionClara devuelve `palabras.some(esAfirmacionFuerte) || soloAcuses(palabras)`. soloAcuses es true cuando el mensaje tiene al menos una palabra y todas están en ACUSES (ok, okay, vale, listo, claro, correcto). AFIRMACIONES contiene "si", y el texto pasa por sinDiacriticos antes de buscar, así que "sí" y "si" son indistinguibles. "todo" y "bien" están en RELLENO.
  implication: 'ok', 'listo', 'vale', 'claro', 'correcto' y 'ok ok' confirman por la rama soloAcuses; 'si todo bien' confirma por esAfirmacionFuerte("si") más relleno permitido.

- timestamp: 2026-10-14T00:21:00Z
  checked: historia de la decisión (02-14-PLAN.md:119,127; 02-14-SUMMARY.md key-decisions; 02-REVIEW.md de 4c30e81, WR-01 e IN-04; 02-VERIFICATION.md:175-176,211; 02-CONTEXT.md D-39; 02-RESEARCH.md:485,493; git log -S)
  found: "ok" confirma desde f15a8c7 (02-03), cuando estaba en AFIRMACIONES por la fila de RESEARCH Pattern 7 (línea 493). a3c200b (02-14) lo movió a ACUSES con la rama soloAcuses ("weak acknowledgements confirm only when the message is made of them alone"). RESEARCH:485 justificó la colisión sí/si con el supuesto de que las condicionales siempre traen palabras no permitidas o "?", y "si todo bien" lo refuta. La revisión 4c30e81 propuso WR-01 (exigir siempre afirmación fuerte o verbo de envío y mover "ok", "vale", "listo" y "claro, ok" a OTRO) e IN-04 ("si" solo, o con un verbo de envío). Ambos quedaron abiertos en 02-REVIEW-DISPOSITION a la espera de la usuaria. D-39 lista solo afirmaciones o verbos claros y no menciona acuses.
  implication: no es un accidente de implementación. Es una decisión de plan (02-03 y luego 02-14) que contradice D-39, y en UAT H2 la usuaria ya decidió endurecer.

- timestamp: 2026-10-14T00:24:00Z
  checked: reproducción con seeds/02-B-run.sh <scratch>/dbg-g0218 T04 (código sin cambios)
  found: la tabla 'ok','listo','vale','claro','correcto','ok ok','si todo bien' da confirma (ec-corp-andina). De punta a punta, 'ok' y 'si todo bien' tras el turno 1 dan simular_envio ok:true y escriben out/ec-corp-andina/ENVIO-SIMULADO.md. La pregunta del servidor cita "envía" o "sí".
  implication: síntoma reproducido de forma determinista.

- timestamp: 2026-10-14T00:25:00Z
  checked: codegraph node clasificarConfirmacion / decisionDe
  found: el único consumidor productivo es decisionDe (src/loop/services/ejecutar-turno.service.ts:45-53). Si entrada.confirmacion (el botón estructurado de D-39, Fase 3) existe, el clasificador no se usa.
  implication: el arreglo vive solo en la política y las constantes; el bucle, la compuerta y el botón de la Fase 3 no cambian.

- timestamp: 2026-10-14T00:27:00Z
  checked: sonda de ramas por frase en la copia scratch (código sin cambios), 55 frases
  found: los acuses solos tienen fuerte=[] (confirman solo por soloAcuses), incluidos 'claro, ok', 'vale listo', 'Listo.' y 'OK!'. Toda frase con 'si' sin tilde y solo relleno confirma: 'si gracias', 'si por favor', 'si el paquete', 'si ya', 'si, el envío'. Las combinaciones con verbo o afirmación fuerte ('ok, envía', 'listo, envíalo', 'vale, procede', 'claro, adelante', 'ok confirmo', 'listo, dale', 'correcto, envía', 'ok envía el paquete') confirman por la palabra fuerte, no por el acuse. 'ok, gracias' y 'listo, ya' dan otro, así que la regla es incoherente: 'listo' confirma pero 'listo, ya' no.
  implication: quitar soloAcuses no afecta las combinaciones con verbo o afirmación fuerte.

- timestamp: 2026-10-14T00:28:00Z
  checked: diferencial A (solo scratch): quitar soloAcuses y devolver `palabras.some(esAfirmacionFuerte)`; correr confirmacion.policy, compuerta, compuerta-casos, inyeccion y compuerta.policy (baseline 160/160)
  found: 155 pass y 5 fail. Fallan exactamente las filas que fijan el comportamiento actual: TABLA_INVESTIGACION "ok"/UNO→confirma (test:34), FILAS_EXTRA "vale"/UNO (test:91), "listo"/UNO (test:92), "claro, ok"/UNO (test:93) y "ok"/DOS→FALTA_CASO (test:96, pasa a OTRO). Ningún test de loop o e2e fija acuses sueltos; los loops usan "envía" y "sí", y la prueba en vivo usa "envía".
  implication: el comportamiento está fijado solo por esas 5 filas de tests/unit/confirmacion.policy.test.ts.

- timestamp: 2026-10-14T00:30:00Z
  checked: diferencial B (solo scratch): A más "si" sin tilde, que cuenta como afirmación fuerte solo si es la única palabra; "sí" con tilde, detectado sobre el texto NFC antes de sinDiacriticos, sigue fuerte en cualquier posición. Se corrieron la sonda, la suite completa y el seed T04.
  found: 'si todo bien', 'si, todo bien con el paquete', 'si gracias', 'si por favor', 'si ya', 'si el paquete' y 'si, el envío' dan otro. 'si', 'Si.', 'si!', 'sí', 'SÍ', NFD 'sí', 'sí, todo bien', 'sí, gracias', 'sí, el envío', 'si, envía', 'si confirmo' y 'sí, envíalo' confirman. Suite completa: 1091 pass, 1 skip, 6 fail (las 5 filas de A más G11, que se debe a la regex inline del parche scratch). Seed T04: E2E 'ok' y 'si todo bien' dan simular CONFIRMACION_REQUERIDA y casosConEnvio=[]. Los 4 asserts de T04 y la alineación "cada ejemplo citado confirma" ("envía", "sí") siguen en verde.
  implication: la causa queda confirmada. Para B el arreglo necesita un patrón Unicode en patterns.constants.ts (G11), porque PATRON_NO_PALABRA es ASCII y trata la marca combinante U+0301 como separador.

- timestamp: 2026-10-14T00:31:00Z
  checked: src/domain/policies/compuerta.policy.ts abrirTurno/cerrarTurno
  found: con decision otro, abrirTurno devuelve sinAutorizacion() y la compuerta queda LIBRE. cerrarTurno solo vuelve a poner el caso pendiente si en el turno hubo un evento BLOQUEADO (un intento del modelo) y el caso está en conocidos.
  implication: tras el endurecimiento, un 'ok' cancela el pendiente (coherente con CA3: el mensaje siguiente tiene que confirmar). Volver a preguntar depende de que el modelo lo haga (prompt, G-02-21) o de un intento bloqueado que reabra el caso. Ya pasaba con 'ok, gracias' y no forma parte de este gap.

## Resolution

root_cause: "clasificarConfirmacion (src/domain/policies/confirmacion.policy.ts) acepta como confirmación explícita (1) todo mensaje formado solo por acuses (ok, okay, vale, listo, claro, correcto), por la rama `soloAcuses` que el plan 02-14 añadió a esConfirmacionClara; y (2) toda frase con 'si' sin tilde más relleno ('si todo bien'), porque sinDiacriticos borra la tilde antes de buscar en AFIRMACIONES y 'si' cuenta como afirmación fuerte, mientras 'todo' y 'bien' son RELLENO. Ambas contradicen D-39 y las fijan 5 filas de tests/unit/confirmacion.policy.test.ts."
si_sin_tilde_lectura: "Ambigüedad: D-39 y EJEMPLOS_CONFIRMACION citan 'sí' con tilde, pero RESEARCH Pattern 7 (y la fila test:27) fija 'si' → confirma, y la usuaria solo vetó el 'si' condicional ('si todo bien'). Lectura más segura que no rompe el uso real: 'sí' con tilde sigue siendo afirmación fuerte en cualquier posición. 'si' sin tilde confirma solo cuando es el mensaje entero (sin signos), porque un 'si' solo no puede ser condicional. En cualquier otra frase, 'si' sin tilde es permitido pero nunca suficiente: necesita otro verbo de envío o afirmación fuerte ('si, envía' y 'si confirmo' confirman; 'si todo bien', 'si gracias' y 'si por favor' dan otro). La lectura más estricta ('si' sin tilde nunca confirma) también es defendible, pero rompe la fila test:27 y obliga a escribir la tilde. La usuaria debe confirmarla en el plan."
fix: (no aplica: goal find_root_cause_only)
verification: "Diferencial en scratch: sin soloAcuses y con 'si' sensible a la tilde, 'ok' y 'si todo bien' quedan bloqueados de punta a punta. Solo fallan las 5 filas que fijan el comportamiento (más G11 por la regex inline del parche, que el arreglo real debe llevar a patterns.constants.ts)."
files_changed: []
