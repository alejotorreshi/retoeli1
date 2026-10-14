---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-14T16:47:54Z
status: gaps_found
score: 47/49 must-haves verified
covered_files: [".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-23-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-23-SUMMARY.md","agent/prompt.md","src/config/constants/confirmation.constants.ts","src/config/constants/patterns.constants.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/knowledge/registro-proveedor.md","src/loop/services/ejecutar-turno.service.ts","tests/contract/instrucciones-agente.test.ts","tests/helpers/corpus-confirmacion.helper.ts","tests/loop/compuerta-casos.test.ts","tests/loop/compuerta.test.ts","tests/unit/confirmacion.policy.test.ts"]
covered_digest: "v3:sha256:a894853a3d0727eba15b0e2b2a1e95196f9c178bebd625b6ab61180b6100a15a"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 39/42
  gaps_closed:
    - "Verdad 31 / brecha 1 (CR-04): una pregunta o un pedido encabezado por un conector, o con 'no'/'para'/'luego'/'mejor'/'después' junto a un objeto o un caso, ya no cancela el caso pendiente. Las 13 frases de CR-04 y las variantes del informe anterior dan otro con uno y con dos pendientes; 22 filas de bucle y 6 de dos pendientes en verde; mis variantes propias también dan otro"
    - "WR-19 en sus frases: 'no quiero enviarlo todavía', 'espera un momento', 'no lo confirmes' y 'todavía no qué falta?' cancelan sin la pregunta del servidor"
    - "WR-20 y WR-21 en sus frases (pretérito con tilde y verbos genéricos con objeto ajeno dan otro)"
    - "WR-22: RN4 ya no se contradice (RN4a/RN4b fijadas enteras)"
    - "T-02-71 / IN-28: el chequeo de rechazo ya no copia la cola por negador"
  gaps_remaining:
    - "Verdad 38 (segunda mitad) y prohibición 2 de 02-22: una negación que rige el envío o una respuesta de espera que nombra el caso pendiente da otro y el servidor vuelve a preguntar (CR-05)"
    - "Verdad 41: la prosa del prompt sigue siendo más amplia que el servidor ('no confirmo' es rechazo en el prompt; 'no confirmo el envío simulado' es otro en el servidor)"
  regressions:
    - "CR-05, confirmado de forma independiente contra cec32ac y 10a43ad (worktrees temporales en el scratchpad, ya eliminados): 16 rechazos explícitos que daban rechaza en las dos versiones anteriores ahora dan otro: 'no confirmo el envío simulado', 'no confirmo el envío simulado de ec-corp-andina', 'no autorizo el envío simulado', 'no confirmo porque falta el certificado', 'no confirmo hasta tener el certificado', 'no lo hagas hasta tener el certificado', 'no confirmo: falta el certificado', 'ec-corp-andina no', 'no, ec-corp-andina', 'todavía no, ec-corp-andina', 'espera, ec-corp-andina', 'Todavía no, falta el certificado de ec-corp-andina', 'mejor no el paquete de ec-corp-andina', 'no, el de ec-corp-andina tiene bloqueos', 'co-industrias-delta todavía no' (dos pendientes) y 'detén el envío'"
gaps:
  - truth: "02-22 verdad 3 (segunda mitad) y prohibición 2 de 02-22, parte de G-02-2: una negación que rige el envío, o una respuesta corta de espera, cancela el caso pendiente sin la pregunta del servidor. 'no confirmo el envío simulado', 'no confirmo porque falta el certificado', 'ec-corp-andina no', 'todavía no, ec-corp-andina' y 'detén el envío' deben dar rechaza"
    status: failed
    reason: "Regresión de 02-23 (CR-05), reproducida de punta a punta. Tres mecanismos de D-63.9 la causan: (1) colasDeComplemento solo admite casos, NEGACIONES y RELLENO tras un verbo genérico, y 'simulado' (la redacción de la propia pregunta del servidor), 'porque' o 'hasta' no están; como ':' ya no corta, el motivo tras ':' también entra en la cola; (2) esPalabraDeEspera excluye todo token de caso y esRechazoExplicito ignora la cláusula de espera si otra cláusula afirmada nombra un caso, sin distinguir el caso pendiente; (3) 'detén' es núcleo de rechazo pero no está en CANCELACIONES, y 'el envío' no cabe en una cláusula de espera. En el escenario §11 (ec-corp-andina BLOQUEADO por falta del certificado), con el agente y el LLM falso: tras 'no confirmo el envío simulado', el turno 2 cierra con needsConfirmation=true, una confirmation_required y la pregunta '¿Confirmas el envío simulado de ec-corp-andina?' pegada a la respuesta del modelo 'la confirmación quedó cancelada'; el 'sí' siguiente envía. Mismo resultado con 'no confirmo porque falta el certificado', 'ec-corp-andina no', 'todavía no, ec-corp-andina' y 'detén el envío'. Esas 16 frases daban rechaza en cec32ac y en 10a43ad. El diferencial de 02-23 no las ve porque no comprueba la dirección rechaza → otro, y siempreCancelan no usa la redacción del servidor, motivos ni el caso pendiente"
    artifacts:
      - path: "src/domain/policies/confirmacion.policy.ts"
        issue: "125-136 (esComplementoDeEnvio/colasDeComplemento sin la redacción del servidor ni conectores de motivo), 177-183 (esPalabraDeEspera excluye el caso pendiente), 195-201 (esRechazoExplicito usa nombraCaso sin distinguir el caso pendiente)"
      - path: "src/config/constants/confirmation.constants.ts"
        issue: "183: CANCELACIONES no incluye 'deten'/'detente'; no hay un conjunto propio de complementos de envío ('simulado', 'confirmacion') ni de cortes de complemento ('porque', 'hasta', 'sin', 'pues', 'mientras')"
      - path: "src/config/constants/patterns.constants.ts"
        issue: "23: sin ':' como frontera, 'no confirmo: falta el certificado' convierte el motivo en complemento"
      - path: "tests/unit/confirmacion.policy.test.ts"
        issue: "398 en adelante: el diferencial contra 10a43ad no comprueba 'antes rechaza, ahora otro' fuera de las filas declaradas otro"
      - path: "tests/helpers/corpus-confirmacion.helper.ts"
        issue: "siempreCancelan no genera la redacción del servidor ('el envío simulado'), motivos ('porque…', 'hasta…', ': …') ni el caso pendiente antes o después de una respuesta de espera"
    missing:
      - "Un conjunto propio de complementos de envío ('simulado', 'confirmacion'), sin tocar RELLENO, y conectores de motivo que cierren la cola ('porque', 'hasta', 'sin', 'pues', 'mientras'), de modo que 'no confirmo el envío simulado', 'no autorizo el envío simulado', 'no confirmo porque falta el certificado' y 'no confirmo: falta el certificado' den rechaza, y 'no confirmo el NIT' y 'No hagas el PDF' sigan en otro"
      - "Que una cláusula hecha solo de palabras de espera y de casos pendientes sea rechazo, y que la exención por nombrar un caso aplique solo a un caso que no está pendiente ('ec-corp-andina no', 'todavía no, ec-corp-andina' y 'no, ec-corp-andina no' dan rechaza; 'No, el de pe-andes' y 'procesa co-industrias-delta, no pe-andes' siguen en otro)"
      - "'deten' y 'detente' en el camino de cancelación ('detén el envío' da rechaza)"
      - "Una cuarta dirección en el diferencial: atajoPrevio daba rechaza y la decisión es otro solo si el mensaje está declarado otro (nuncaCancelan o fila OTRO)"
      - "Ampliar siempreCancelan con las colas ' el envío simulado', ' porque falta el certificado', ': falta el certificado', ' hasta tener el certificado' y el caso pendiente antes y después de cada respuesta de espera"
      - "Filas RECHAZA para las 16 frases de CR-05 y filas en la tabla de cancelación de tests/loop/compuerta.test.ts para al menos 'no confirmo el envío simulado', 'no confirmo porque falta el certificado', 'ec-corp-andina no' y 'detén el envío'; con dos pendientes, 'co-industrias-delta todavía no'"
      - "Mantener en verde todo el corpus nuncaCancelan y las filas OTRO de D-63.9, y registrar el ajuste como enmienda de D-63.9"
  - truth: "02-22 V6 y 02-23 verdad 8: agent/prompt.md y src/knowledge/registro-proveedor.md describen el mismo rechazo que aplica el servidor"
    status: partial
    reason: "Los ejemplos citados coinciden con el servidor (el contrato da 27 pass con -t D-63.9) y RN4 ya no se contradice. Pero la prosa de S51 (prompt.md:51) dice que 'no confirmo' es un rechazo sin la restricción de complemento que aplica D-63.9, y el servidor da otro con 'no confirmo el envío simulado', que es la respuesta natural a la pregunta del servidor. Reproducido de punta a punta: el modelo escribe 'la confirmación quedó cancelada' y en la misma respuesta el servidor agrega '¿Confirmas el envío simulado de ec-corp-andina?' con needsConfirmation=true. Es la contradicción modelo-servidor que T-02-75 debía mitigar. Depende de la brecha anterior: si el servidor se corrige, la prosa vuelve a coincidir"
    artifacts:
      - path: "agent/prompt.md"
        issue: "51: 'no confirmo' citado como rechazo sin la restricción de complemento; la prosa promete una conducta que el servidor no cumple para 'no confirmo el envío simulado' y 'no confirmo porque…'"
      - path: "tests/contract/instrucciones-agente.test.ts"
        issue: "clasifica solo las citas literales ('no confirmo'), no la redacción del servidor ni las variantes con motivo"
    missing:
      - "Después de cerrar la brecha anterior, agregar al contrato la clasificación de 'no confirmo el envío simulado' y 'no confirmo porque falta el certificado' como rechazo, o, si se decide no cerrarla, acotar S51 a lo que el servidor hace"
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-14T16:47:54Z
**Estado:** gaps_found
**Re-verificación:** Sí. Viene después del plan de cierre 02-23 (D-63.9, commits `6eddc88..a92ecf2`), del code review de esa ronda (`6c2dba3`) y de la auditoría de seguridad posterior (`bb521cc`).

## Logro del objetivo

Lo verifiqué en el código, con las pruebas nombradas y con sondas propias en el scratchpad. No me fié del SUMMARY ni del review: reproduje cada afirmación. Para comparar versiones usé worktrees temporales de `cec32ac` y `10a43ad` en el scratchpad, y una copia de HEAD para la prueba de punta a punta. Los eliminé al terminar, y `git status` no muestra cambios nuevos.

- **Lo que 02-23 sí logró (la mitad CR-04 de G-02-2):**
  - Las preguntas y pedidos con conectores ya no cancelan. Las 13 frases de CR-04, las variantes del informe anterior y mis variantes propias ("Después de eso, ¿qué falta?", "Para co-industrias-delta, genera el pdf", "Luego revisa el NIT", "No entiendo, explícame qué falta", "Procesa pe-andes y luego co-industrias-delta", "No hay problema, procesa pe-andes") dan `otro` con uno y con dos pendientes.
  - De punta a punta: `bun test tests/loop/compuerta.test.ts -t D-63.9` da 22 pass, y `compuerta-casos.test.ts -t D-63.9` da 6 pass. Los dos tienen 0 fail.
  - Las frases de WR-19 cancelan.
  - El conjunto de frases que confirman no cambió. Mi sonda da los mismos `confirma` en las tres versiones.
  - Los archivos prohibidos no cambiaron: `git diff b87acdd..HEAD` sale vacío para `compuerta.policy.ts`, `ejecutar-turno.service.ts`, `src/domain/types`, `strings.ts` y `reto-01/`.
  - Barreras: `bun run check` sale con exit 0 (Biome revisó 282 archivos, 0 vulnerabilidades). `bun test`, corrido una sola vez, da 1437 pass, 1 skip y 0 fail.
- **Lo que 02-23 rompió (CR-05, confirmado y bloqueante):**
  - D-63.9 convirtió en `otro` 16 rechazos explícitos que daban `rechaza` en `cec32ac` y en `10a43ad`. Entre ellos están "no confirmo el envío simulado" (la redacción de la pregunta del propio servidor), "no confirmo porque falta el certificado", "ec-corp-andina no", "todavía no, ec-corp-andina" y "detén el envío".
  - Lo reproduje de punta a punta en el §11 con el agente y el LLM falso. Después de cada una de esas 5 frases, el turno cierra con `needsConfirmation=true` y una `confirmation_required`. La respuesta junta el texto del modelo "la confirmación quedó cancelada" con la pregunta del servidor "¿Confirmas el envío simulado de ec-corp-andina?". El "sí" siguiente envía.
  - Es la primera mitad de G-02-2 (después de una negación, el servidor vuelve a preguntar) y la contradicción entre el modelo y el servidor que la usuaria trató como bloqueante en HV2.

**Conclusión:** la clase G-02-2 **no** está cerrada. Se cerró la dirección "un pedido o una pregunta no cancela", y por eso la verdad 31 pasa a ✓. Pero la dirección "una negación explícita cancela sin re-pregunta" retrocedió respecto de las dos versiones anteriores. Las verdades 38 (su segunda mitad) y 41 siguen fallando, ahora por CR-05 en lugar de CR-04. Ningún camino envía sin una confirmación explícita posterior, así que el criterio 2 del ROADMAP se sigue cumpliendo a la letra. Lo que falla es la promesa de D-63.6, D-63.8 y D-63.9, y la decisión de la usuaria en HV2.

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: ciclo propio, `deepseek-flash` con thinking desactivado y solo rutas y valores enmascarados hacia el modelo | ✓ VERIFIED | Regresión: la suite completa sigue en verde. 02-23 no toca `llm/` ni `loop/` |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en §11 la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez y solo para ese caso; `confirmado: true` del modelo no basta | ✓ VERIFIED | `compuerta.test.ts` en verde. Sonda: "No envíes nada todavía" y "No envíes nada todavía, ¿qué falta?" dan `rechaza`. En CR-05 el envío ocurre solo después de un "sí" explícito |
| 3 | **ROADMAP C3**: reintentos, respaldo, mensajes en español (402) y CA5 | ✓ VERIFIED | Regresión en verde; sin cambios en `llm/` |
| 4 | **ROADMAP C4**: topes con respuesta clara; la inyección no cambia la conducta | ✓ VERIFIED | Regresión en verde (WR-03 sigue abierto como advertencia) |
| 5 | **ROADMAP C5**: prompt y conocimiento editables; logs JSON correlacionados sin clave ni PII; `bun test` cubre el ciclo con un LLM falso | ✓ VERIFIED | 02-23 cambió la conducta del modelo solo con texto (`ce175da`), y la suite está en verde |
| 6–20, 22 | Verdades de los planes 02-01 a 02-14 | ✓ VERIFIED | Regresión: la suite completa sigue en verde |
| 21, 28, 35 | Corrida en vivo y su lectura humana (HV1) | ✓ VERIFIED | Aceptadas en la UAT (prueba 1) |
| 23–27, 29, 32–34 | Verdades de 02-15 a 02-21 | ✓ VERIFIED | `compuerta`, `compuerta-casos` y `compuerta.policy` en verde |
| 30 | **02-19 V4**: un pedido ajeno no secuestra la confirmación | ✓ VERIFIED | `compuerta-casos.test.ts` en verde. "procesa co-industrias-delta, no pe-andes" ya da `otro` con dos pendientes |
| 31 | **02-19 V10, prohibición 4 y G-02-2 (lado CR-04)**: solo un rechazo explícito saca el caso de la compuerta; un pedido con "para", "no", "luego", "mejor" o "después" lo deja pendiente | ✓ VERIFIED | Cerrada por 02-23. Las 13 frases de CR-04 y las variantes del informe anterior dan `otro`, y también mis variantes nuevas. Se fijan con 22 filas de bucle (un pendiente) y 6 (dos pendientes), más el corpus generado de 2107 mensajes. Quedan como advertencia las excepciones declaradas en D-63.9: WR-24 ("no me envíes tantas preguntas" da `rechaza`, igual que en `10a43ad`) e IN-31 ("No, ¿qué falta en pe-andes?") |
| 36 | **02-22 V1**: "…para tenerlo a mano" deja el caso pendiente y el "sí" envía una vez | ✓ VERIFIED | Fila del `test.each` de mantener pendiente en verde |
| 37 | **02-22 V2**: "No envíes nada todavía, ¿qué falta?" cancela sin pregunta | ✓ VERIFIED | Fila del `test.each` de cancelación en verde; sonda `rechaza` |
| 38 | **02-22 V3**: `otro` para las preguntas y los pedidos con conectores; **`rechaza` para una negación que rige el envío y para una cláusula de espera** | ✗ FAILED | La primera mitad ya se cumple. La segunda no: "no confirmo el envío simulado", "no autorizo el envío simulado" y "no confirmo porque falta el certificado" (negaciones que rigen el envío) dan `otro`, y lo mismo pasa con "todavía no, ec-corp-andina" y "ec-corp-andina no" (respuestas de espera con el caso pendiente). Es una regresión respecto de `cec32ac` y `10a43ad` (CR-05), reproducida de punta a punta |
| 39 | **02-22 V4**: toda fila previa del clasificador conserva su resultado | ✓ VERIFIED | `confirmacion.policy.test.ts` completo en verde. El único cambio en las líneas existentes es la aserción estructural que el plan reapuntó |
| 40 | **02-22 V5**: el conjunto de frases que confirman no cambia | ✓ VERIFIED | Invariantes de vocabulario y diferencial en verde. Mi sonda da `confirma` para "sí", "envía", "confirmo", "dale" y "sí, envía ec-corp-andina" en las tres versiones |
| 41 | **02-22 V6 = 02-23 V8**: el prompt y el conocimiento describen el mismo rechazo que aplica el servidor | ✗ FAILED (parcial) | Las oraciones están fijadas enteras y las citas clasificadas (27 pass), y RN4 ya no se contradice. Pero `prompt.md:51` dice que "no confirmo" es un rechazo, y el servidor da `otro` con "no confirmo el envío simulado". Reproducido de punta a punta: el modelo dice "cancelada" y el servidor vuelve a preguntar en la misma respuesta |
| 42 | **02-22 V7**: D-63.8 registrado | ✓ VERIFIED | Sin cambios |
| 43 | **02-23 V1**: §11 y luego 8 frases de CR-04, WR-20 y WR-21 dejan el caso pendiente con una sola `confirmation_required`, y el "sí" envía una vez | ✓ VERIFIED | `compuerta.test.ts -t D-63.9`: 22 pass |
| 44 | **02-23 V2**: "no quiero enviarlo todavía", "espera un momento", "no lo confirmes" y "todavía no qué falta?" cancelan sin la pregunta del servidor | ✓ VERIFIED | Las mismas 22 pruebas (tabla de cancelación) |
| 45 | **02-23 V3**: con dos pendientes, un pedido que nombra un caso no cancela y un rechazo explícito cancela los dos | ✓ VERIFIED | `compuerta-casos.test.ts -t D-63.9`: 6 pass |
| 46 | **02-23 V4**: filas del clasificador para CR-04, las variantes, WR-20, WR-21, IN-30 y WR-19 | ✓ VERIFIED | `confirmacion.policy.test.ts -t D-63.9`: 78 pass, y mi sonda coincide |
| 47 | **02-23 V5**: clases generadas (≥2000 que nunca cancelan, ≥1000 que siempre cancelan) | ✓ VERIFIED | En verde dentro de las 78 pruebas. Advertencia: `siempreCancelan` no genera la familia de CR-05 |
| 48 | **02-23 V6**: diferencial contra `10a43ad` en las tres direcciones declaradas | ✓ VERIFIED (tal como está escrita) | Las tres direcciones pasan. La verdad no pide la dirección `rechaza` → `otro`, y por eso CR-05 pasa en verde (ver la brecha 1) |
| 49 | **02-23 V7**: el chequeo de **rechazo** corre en tiempo lineal | ✓ VERIFIED | La prueba de tiempo pasa. Advertencia WR-25 / T-02-77: la función completa sigue siendo cuadrática por `separar` en corridas largas de letras. Lo medí: `"a".repeat(40000)` tarda 2185 ms |

**Puntaje:** 47 de 49 verdades verificadas. Fallan 2: la verdad 38 (CR-05) y la 41, que es parcial y depende de la 38. No hay verdades con comportamiento sin verificar. La verdad 8 de 02-23 repite la 41 y se cuenta una sola vez.

### Elementos diferidos

Ninguno. La Fase 3 pide la tarjeta con Confirmar y Cancelar y el límite de tamaño de mensaje (API-04), pero no redefine el rechazo por texto. API-04 mitiga en parte WR-25 / T-02-77, que es una advertencia, no una brecha.

### Advisory (alcance nuevo, sin evidencia)

Ninguno. Los dos hallazgos que bloquean tienen evidencia determinista: una sonda reproducible contra tres versiones del clasificador y una prueba de punta a punta por el bucle. Además, caen sobre brechas arrastradas (G-02-2, y la brecha 3 del informe anterior) en archivos que se modificaron en esta ronda.

### Artefactos requeridos (plan 02-23)

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `src/config/constants/confirmation.constants.ts` | Los 9 conjuntos nuevos y `SUFIJO_PRETERITO` | ✓ VERIFIED (⚠️ contenido) | Existen y se usan. `CANCELACIONES` (183) no incluye "deten" y no hay complementos de envío para la redacción del servidor (CR-05) |
| `src/config/constants/patterns.constants.ts` | `PATRON_CLAUSULA` sin ":", más los tres patrones nuevos | ✓ VERIFIED (⚠️ conducta) | Línea 23. Al quitar ":" aparece la regresión "no confirmo: falta el certificado". `PATRON_SLUG_EN_TEXTO` (25) sigue sin ancla (T-02-77) |
| `src/domain/policies/confirmacion.policy.ts` | Rechazo D-63.9 | ✗ Conducta incorrecta (en parte) | Es sustancial y está conectado. El lado CR-04 es correcto; el lado del rechazo retrocede (líneas 125-136, 177-183 y 195-201) |
| `tests/helpers/corpus-confirmacion.helper.ts` | Generadores y `atajoPrevio` | ✓ VERIFIED (⚠️ cobertura) | No genera la familia de CR-05 |
| `tests/unit/confirmacion.policy.test.ts` | FILAS_D639, clases, diferencial, vocabulario y tiempo | ✓ VERIFIED (⚠️ cobertura) | El diferencial no comprueba la dirección `rechaza` → `otro` |
| `tests/loop/compuerta.test.ts` | 22 filas D-63.9 | ✓ VERIFIED | 22 pass |
| `tests/loop/compuerta-casos.test.ts` | 6 filas con dos pendientes | ✓ VERIFIED | 6 pass |
| `agent/prompt.md` | S51, SCON y S53 | ⚠️ PARCIAL | La línea 51 cita "no confirmo" sin la restricción (verdad 41) |
| `src/knowledge/registro-proveedor.md` | RN4a y RN4b | ✓ VERIFIED | WR-22 cerrado |
| `tests/contract/instrucciones-agente.test.ts` | ORACIONES_D639 y RETIRADOS_G023 | ✓ VERIFIED | 27 pass |

`verify.artifacts` da 10/10 (exit 0). Solo comprueba existencia y patrones.

### Verificación de enlaces clave

| De | A | Vía | Estado |
|----|---|-----|--------|
| confirmacion.policy | confirmation.constants | `RELLENO_DE_ESPERA` y el resto de los conjuntos | WIRED |
| confirmacion.policy | patterns.constants | `PATRON_PALABRA_O_CASO` | WIRED |
| ejecutar-turno.service | confirmacion.policy | `clasificarConfirmacion(` en `decisionDe` | WIRED |
| instrucciones-agente.test | corpus-confirmacion.helper | expansión de las palabras citadas | WIRED |
| confirmacion.policy.test | corpus-confirmacion.helper | `atajoPrevio` | WIRED |

`verify.key-links` da 5/5 (exit 0).

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `needsConfirmation` y `confirmation_required` después de un rechazo explícito | Estado de la compuerta | mensaje → `clasificarConfirmacion` → `abrirTurno` → `pendientesDe` → `cerrarTurno` | Sí. Con la familia CR-05 la decisión llega mal (`otro`) | ⚠️ El flujo funciona, pero la entrada llega mal clasificada |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | exit 0; 282 archivos; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 1437 pass, 1 skip, 0 fail, 72 archivos | ✓ PASS |
| Bucle D-63.9 (un pendiente) | `bun test tests/loop/compuerta.test.ts -t D-63.9` | 22 pass, 0 fail | ✓ PASS |
| Bucle D-63.9 (dos pendientes) | `bun test tests/loop/compuerta-casos.test.ts -t D-63.9` | 6 pass, 0 fail | ✓ PASS |
| Clasificador D-63.9 | `bun test tests/unit/confirmacion.policy.test.ts -t D-63.9` | 78 pass, 0 fail | ✓ PASS |
| Contrato D-63.9 | `bun test tests/contract/instrucciones-agente.test.ts -t D-63.9` | 27 pass, 0 fail | ✓ PASS |
| Comparación entre versiones (scratchpad, `cmp.ts`) | `clasificarConfirmacion` de HEAD, `cec32ac` y `10a43ad` sobre 46 frases | 16 frases de CR-05 pasan de `rechaza` (en las dos versiones anteriores) a `otro`; CR-04 y WR-19 se corrigen; los `confirma` no cambian | ✗ FAIL (CR-05) |
| De punta a punta (copia de HEAD en el scratchpad, LLM falso) | §11 T1, luego cada frase de CR-05 y luego "sí" | Con las 5 frases, T2 da `needsConfirmation=true`, 1 `confirmation_required` y el texto "la confirmación quedó cancelada" seguido de "¿Confirmas el envío simulado de ec-corp-andina?". T3 "sí" envía (`enviados=[ec-corp-andina]`) | ✗ FAIL (síntoma de G-02-2) |
| Variantes propias (scratchpad, `own.ts`) | 23 frases que deberían dar `otro` y 21 que deberían dar `rechaza`, con uno y con dos pendientes | Del lado de `otro`, solo fallan las excepciones declaradas (WR-24 e IN-31). Del lado de `rechaza`, fallan las de CR-05, más "no, ec-corp-andina no" | ✗ FAIL (CR-05) |
| Tiempo de `separar` | `clasificarConfirmacion("a".repeat(n), [])` | 10k: 137 ms, 20k: 573 ms, 40k: 2185 ms (cuadrático) | ⚠️ WR-25 / T-02-77 |
| Alcance de 02-23 | `git diff --name-only b87acdd..HEAD` sobre los archivos prohibidos y `reto-01` | vacío | ✓ PASS |

### Ejecución de probes

No aplica. La fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Planes | Descripción (resumen) | Estado | Evidencia |
|-----------|--------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo | ✓ SATISFIED | `inyeccion.test.ts` en verde |
| ENV-02 | 02-03…02-23 | El servidor hace cumplir la compuerta; el clasificador entiende negaciones | ✓ SATISFIED en lo que exige el requisito (⚠️ precisión) | Nunca autoriza sin una confirmación explícita. La precisión del rechazo que exige G-02-2 falla (CR-05) |
| ENV-03 | 02-03…02-23 | El turno termina con la pregunta; el servidor calcula `needsConfirmation` | ✗ BLOCKED (parcial) | Después de "no confirmo el envío simulado", el servidor agrega su pregunta y `needsConfirmation=true` aunque la analista rechazó |
| AGT-01 | 02-01, 02-07 | Ciclo propio y tope | ✓ SATISFIED | Regresión |
| AGT-02 | 02-01…02-23 | Prompt y conocimiento separados y editables | ✓ SATISFIED (⚠️ verdad 41) | La editabilidad se cumple; la coherencia de la prosa con el servidor es parcial |
| AGT-03 | 02-09…02-21 | No afirmar sin herramienta | ✓ SATISFIED | HV1 |
| AGT-04 | 02-02…02-20 | Sesiones e historial íntegro | ✓ SATISFIED | `historialSano` en verde |
| AGT-05 | 02-04…02-20 | Errores en español | ✓ SATISFIED | Regresión |
| LLM-01 a LLM-04 | 02-01…02-20 | Puerto, adaptador, resiliencia y respaldo | ✓ SATISFIED | Regresión |
| LLM-05 | 02-07 | Topes configurables | ✓ SATISFIED (⚠️ WR-03) | Sin cambios |
| SEG-03 | 02-05…02-21 | Logs sin clave ni PII | ✓ SATISFIED | Regresión |
| DEMO-03 | todos, 02-23 | Tests con un LLM falso | ✓ SATISFIED (⚠️ cobertura) | Existen y pasan, pero el diferencial y `siempreCancelan` no cubren CR-05 |

Requisitos huérfanos: ninguno. Los 15 IDs que REQUIREMENTS.md asigna a la fase coinciden con la unión de los `requirements:` de los 23 planes. REQUIREMENTS.md marca ENV-02, ENV-03, AGT-02 y DEMO-03 como "Gaps Found", lo que coincide con este informe.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `confirmacion.policy.ts`, `confirmation.constants.ts`, `patterns.constants.ts` | 125-136, 177-183 y 195-201 / 183 / 23 | **CR-05**: rechazos explícitos que dan `otro` (regresión) | 🛑 Blocker | Brecha 1. Después de un "no", el servidor vuelve a preguntar, y el modelo y el servidor se contradicen |
| `agent/prompt.md` | 51 | La prosa es más amplia que el servidor ("no confirmo") | 🛑 Blocker (parte de la brecha 2) | El modelo dice "cancelada" mientras el caso sigue pendiente |
| `tests/unit/confirmacion.policy.test.ts`, `tests/helpers/corpus-confirmacion.helper.ts` | 398 en adelante / `siempreCancelan` | Al diferencial le falta la dirección `rechaza` → `otro`, y el corpus no tiene la redacción del servidor | ⚠️ Warning | Por eso CR-05 pasa en verde |
| `confirmation.constants.ts`, `confirmacion.policy.ts` | 151-194 / 149-155 | **WR-23**: "espérate", "cancélalo", "hoy no" y "no quiero enviarlo sin el certificado" dan `otro` | ⚠️ Warning | No es regresión. El servidor vuelve a preguntar y nunca envía sin un "sí" |
| `confirmacion.policy.ts` | 157-161 | **WR-24**: "no me envíes tantas preguntas" da `rechaza` | ⚠️ Warning | Está declarado por D-63.9 (a) y ya pasaba en `10a43ad`. Cancela en silencio y el "sí" siguiente queda bloqueado |
| `patterns.constants.ts`, `confirmacion.policy.ts` | 25 / 46-53 | **WR-25 / T-02-77**: `separar` es cuadrático | ⚠️ Warning | 40 KB tardan 2,2 s por turno, sin límite de tamaño hasta API-04. Es bajo y no bloquea según SECURITY |
| `confirmacion.policy.ts` | 104-114 y 195-201 | **IN-31**: "No, ¿qué falta en pe-andes?" da `rechaza` | ℹ️ Info | Está declarado en las suposiciones del plan |
| `ejecutar-turno.service.ts`, `compuerta.policy.ts` | — | WR-17, WR-18 y WR-03 | ⚠️ Warning, abierto | Fuera de alcance por decisión de la usuaria |

No hay marcadores TBD, FIXME, XXX, TODO, HACK ni PLACEHOLDER en los 10 archivos que modificó 02-23. `reto-01/` no tiene diferencias.

### Prohibiciones (02-23)

| Prohibición | Nivel | Disposición |
|-------------|-------|-------------|
| No ampliar lo que autoriza un envío | test | **Cumplida.** Lo confirman las invariantes de vocabulario, el diferencial y mi sonda en tres versiones |
| No cancelar con una pregunta, un pedido que nombra un caso, una cabeza de conector, ni un "no" o un conector unido a un objeto o un caso | test | **Cumplida dentro de lo declarado.** El corpus de 2107 mensajes está en verde. Las excepciones declaradas (WR-24 e IN-31) quedan como advertencia |
| No dejar pendiente con la pregunta del servidor un rechazo listado en WR-19 | test | **Cumplida** en sus frases. La prohibición 2 de 02-22, más amplia, sigue incumplida por CR-05 (brecha 1) |
| No cambiar `compuerta.policy.ts`, `ejecutar-turno.service.ts`, `src/domain/types/` ni `strings.ts` | test | **Cumplida.** El `git diff` sale vacío |
| No cambiar la decisión esperada de una fila previa | test | **Cumplida.** Solo cambió la aserción estructural reapuntada |

### Verificación humana requerida

No hay puntos que bloqueen esta verificación, porque el estado es `gaps_found`. Después del cierre conviene repetir dos cosas:

1. **D5 de 02-22 y 02-23:** comprobar que el modelo en vivo solo dice "cancelada" cuando el servidor cancela.
2. **Repetir HV2 de la UAT** con las frases de CR-04 y de CR-05.

### Resumen de brechas

El plan 02-23 cerró la mitad CR-04 de G-02-2: las preguntas y los pedidos con conectores ya no cancelan, y eso queda fijado por clase, no por muestra. Pero al acotar el rechazo, D-63.9 dejó fuera rechazos explícitos que las dos versiones anteriores sí reconocían. La clase G-02-2 sigue abierta en la dirección contraria.

1. **Brecha 1 (bloqueante, CR-05, regresión).** "no confirmo el envío simulado", "no confirmo porque falta el certificado", "ec-corp-andina no", "todavía no, ec-corp-andina" y "detén el envío" dan `otro`, y el servidor vuelve a preguntar justo después del "no". Hay tres raíces:
   - la cola restringida de los verbos genéricos no admite la redacción del servidor ni un motivo;
   - la exención por nombrar un caso no distingue el caso pendiente;
   - "detén" no tiene camino de cancelación.

   Es el caso de la demo (§11, `ec-corp-andina` BLOQUEADO) y la respuesta natural a la pregunta del servidor.
2. **Brecha 2 (parcial, depende de la 1).** `prompt.md:51` le dice al modelo que "no confirmo" es un rechazo. En la misma respuesta, el modelo dice "cancelada" y el servidor vuelve a preguntar.

**Seguridad.** Ninguna brecha permite un envío sin una confirmación explícita posterior. Los criterios 1 a 5 del ROADMAP se cumplen a la letra.

**Pruebas.** Todas pasan porque el diferencial no mira la dirección `rechaza` → `otro` y `siempreCancelan` no genera la familia de CR-05. El arreglo que propone 02-REVIEW.md para CR-05 sirve como punto de partida para un plan 02-24 con `/gsd-plan-phase --gaps`. Propone un conjunto de complementos de envío, cortes de motivo, la exención solo para casos no pendientes, "deten" en `CANCELACIONES` y la cuarta dirección del diferencial. El plan debe mantener en verde todo el corpus `nuncaCancelan`.

---

_Verificado: 2026-10-14T16:47:54Z_
_Verificador: Claude (gsd-verifier)_
