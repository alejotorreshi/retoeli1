---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-14T19:12:28Z
status: gaps_found
score: 54/56 must-haves verified
covered_files: [".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-23-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-23-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-24-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-24-SUMMARY.md","agent/prompt.md","src/config/constants/confirmation.constants.ts","src/config/constants/patterns.constants.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/knowledge/registro-proveedor.md","src/loop/services/ejecutar-turno.service.ts","tests/contract/instrucciones-agente.test.ts","tests/helpers/corpus-confirmacion.helper.ts","tests/loop/compuerta-casos.test.ts","tests/loop/compuerta.test.ts","tests/unit/confirmacion.policy.test.ts"]
covered_digest: "v3:sha256:e9caf322c53d3d00b2fbc70eee2071de1823c359427d22fefbbf5fef2f143ecd"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 47/49
  gaps_closed:
    - "Brecha 1 (CR-05): las 16 frases de CR-05 y 'no, ec-corp-andina no' dan rechaza con uno y con dos pendientes; de punta a punta, en el §11, 'no confirmo el envío simulado', 'no confirmo porque falta el certificado', 'no confirmo: falta el certificado', 'ec-corp-andina no', 'todavía no, ec-corp-andina', 'Todavía no, falta el certificado de ec-corp-andina' y 'detén el envío' cierran con needsConfirmation=false, sin confirmation_required, y el 'sí' siguiente queda bloqueado con CONFIRMACION_REQUERIDA"
    - "Brecha 2 en su forma literal: prompt.md:51 ya cita 'no confirmo el envío simulado' y 'no confirmo porque falta el certificado', y cada cita de rechazo y de no rechazo de las líneas 51, 52 y 54 coincide con el servidor (uno y dos pendientes)"
    - "WR-25 / T-02-77: PATRON_SLUG_EN_TEXTO anclado; 200 000 caracteres en 2,5-4 ms"
  gaps_remaining: []
  regressions:
    - "CR-06 (= T-02-83), confirmado de forma independiente contra 6c2dba3 (02-23) y 10a43ad en worktrees temporales del scratchpad, ya eliminados: un pedido que nombra el caso pendiente y no empieza con una palabra de VERBOS_DE_PEDIDO pasa de otro (02-23) a rechaza (HEAD). Ejemplos: 'No, por favor consulta el NIT de ec-corp-andina', 'Todavía no. Por favor revisa el NIT de ec-corp-andina.', 'No, ahora consulta el NIT de co-industrias-delta' (dos pendientes), 'No, mejor procesa ec-corp-andina', 'No, quiero el NIT de ec-corp-andina', 'No, envíame el NIT de ec-corp-andina', 'detente, procesa ec-corp-andina' y dos variantes propias: 'Todavía no, pero dame el NIT de ec-corp-andina' y 'Espera, antes genera el pdf de ec-corp-andina'. Reproducido de punta a punta con el agente y el LLM falso"
gaps:
  - truth: "Verdad 31 (02-19 V10, prohibición 4 de 02-19 y de 02-24, G-02-2 lado CR-04) y D-63.10(d): solo un rechazo explícito saca el caso de la compuerta; un pedido que nombra un caso no cancela, aunque traiga 'no', 'espera', 'todavía no', 'mejor' o un relleno delante"
    status: failed
    reason: "Regresión de 02-24 (CR-06 = T-02-83), reproducida de punta a punta. eximeLaEspera (confirmacion.policy.ts:256-262) solo exime la cláusula de espera si el PRIMER token de otra cláusula afirmada está en VERBOS_DE_PEDIDO. Un pedido con un relleno o conector delante ('por favor', 'ahora', 'entonces', 'primero', 'mejor', 'y', 'pero', 'antes'), con un verbo fuera de la lista ('quiero', 'necesito') o con enclítico ('envíame', 'procésalo') ya no exime, y la cláusula 'No' o 'Todavía no' cancela todos los pendientes. Con 02-23 (6c2dba3) esas frases daban otro. En el §11, tras 'No, por favor consulta el NIT de ec-corp-andina', 'No, ahora consulta el NIT de ec-corp-andina' y 'Todavía no. Por favor revisa el NIT de ec-corp-andina.', el turno 2 cierra con needsConfirmation=false y sin confirmation_required mientras el modelo dice 'El paquete sigue pendiente', y el 'sí' del turno 3 queda bloqueado con CONFIRMACION_REQUERIDA; con 'No, consulta el NIT de ec-corp-andina' (verbo en primera posición) el mismo guion deja el caso pendiente y el 'sí' envía. D-63.10(d) afirma 'ningún pedido que nombra un caso cancela', y eso hoy es falso. Ninguna prueba lo ve: todos los pedidos generados empiezan con el verbo, y el diferencial solo compara contra 10a43ad, que también rechazaba estas frases. Nunca envía sin confirmación (va al lado seguro), pero es la misma clase que CR-04, que la usuaria trató como bloqueante en HV2"
    artifacts:
      - path: "src/domain/policies/confirmacion.policy.ts"
        issue: "256-262: eximeLaEspera decide con VERBOS_DE_PEDIDO.has(tokens[0]?.base); no salta rellenos ni conectores, no reconoce enclíticos ni modales de pedido, y la exención no se aplica al camino de cancelación ('detente, procesa ec-corp-andina')"
      - path: "src/config/constants/confirmation.constants.ts"
        issue: "204-223: VERBOS_DE_PEDIDO es una lista cerrada de 18 formas sin enclíticos ni modales; no hay un conjunto de cabezas de pedido que se puedan saltar"
      - path: "tests/helpers/corpus-confirmacion.helper.ts"
        issue: "50-54 y 248: PEDIDOS_CON_CASO siempre empieza con el verbo; ningún mensaje generado tiene un relleno o conector delante del pedido"
      - path: "tests/unit/confirmacion.policy.test.ts"
        issue: "569-584: la cuarta dirección compara solo contra 10a43ad; no hay una dirección contra la versión entregada inmediatamente antes (02-23), así que un 'otro → rechaza' de una frase que 10a43ad rechazaba pasa en verde"
    missing:
      - "Que la exención (d) mida la cabeza del pedido después de saltar rellenos y conectores ('por favor', 'ahora', 'entonces', 'primero', 'mejor', 'y', 'pero', 'antes', 'ya'), con un conjunto propio en confirmation.constants.ts, y que reconozca enclíticos ('envíame', 'procésalo', 'muéstramelo') y modales de pedido ('quiero', 'necesito'); y que 'detente' en su propia cláusula tenga la misma exención que 'espera'"
      - "Un generador nuncaCancelanPedidoDelPendiente(): cada respuesta de espera × prefijos ['', 'ahora ', 'por favor ', 'entonces ', 'primero ', 'y '] × pedidos ['consulta el NIT de', 'procesa', 'revisa', 'dame el NIT de', 'quiero el NIT de'] × el caso pendiente, con coma y con punto, con uno y dos pendientes, siempre otro"
      - "Una quinta dirección del diferencial: lo que 6c2dba3 dejaba en otro solo pasa a rechaza si está en siempreCancelan(), en una fila RECHAZA o en CANCELAN_POR_CASO_PENDIENTE"
      - "Filas de bucle en compuerta.test.ts para 'No, por favor consulta el NIT de ec-corp-andina' y 'Todavía no. Por favor revisa el NIT de ec-corp-andina.' (caso pendiente, pregunta del servidor, 'sí' envía una vez) y en compuerta-casos.test.ts para 'No, ahora consulta el NIT de co-industrias-delta'"
      - "O bien, si la usuaria acepta la regla de primera palabra: declararla en D-63.10(d) con estas frases como filas RECHAZA, retirar 'ningún pedido que nombra un caso cancela' y acotar prompt.md:54 (y registrar un override de esta verdad)"
  - truth: "Verdad 41 (02-22 V6 = 02-23 V8 = 02-24 V8): agent/prompt.md y src/knowledge/registro-proveedor.md describen el mismo rechazo que aplica el servidor"
    status: partial
    reason: "La brecha 2 anterior está cerrada: S51 cita la redacción del servidor y el motivo, y todas las citas de prompt.md:51, 52 y 54 dan la decisión que el prompt les asigna (sonda propia con uno y dos pendientes, contrato 30 pass con -t CR-05). Pero prompt.md:54 dice que, si la analista pide 'consultar un valor' mientras un paquete espera, 'ese paquete sigue pendiente y el servidor vuelve a agregar su pregunta', y S51 limita el rechazo de una respuesta de espera a 'un pedido que no nombra un caso'. Para 'No, por favor consulta el NIT de ec-corp-andina' el prompt indica pendiente y el servidor cancela (CR-06). Reproducido: el modelo responde 'El paquete sigue pendiente' y el servidor cierra con needsConfirmation=false y sin pregunta. Además RN4 dice 'junto al nombre de un caso' y el prompt 'de otro caso' (WR-27). Depende de la brecha anterior: si el servidor exime todo pedido que nombra un caso, la prosa vuelve a coincidir"
    artifacts:
      - path: "agent/prompt.md"
        issue: "54: promete pendiente y re-pregunta del servidor para un pedido de consulta; el servidor cancela cuando el pedido nombra el caso pendiente y no empieza con un verbo de VERBOS_DE_PEDIDO"
      - path: "src/knowledge/registro-proveedor.md"
        issue: "42 (RN4): 'junto al nombre de un caso', más amplio que el prompt ('de otro caso') y que el servidor"
      - path: "tests/contract/instrucciones-agente.test.ts"
        issue: "las citas de S53 nombran solo casos no pendientes; ninguna prueba cubre un pedido sobre el caso pendiente con un relleno delante"
    missing:
      - "Después de cerrar la brecha anterior, agregar a S53 un ejemplo con el caso pendiente ('No, consulta el NIT de ec-corp-andina', 'No, por favor consulta el NIT de ec-corp-andina') fijado en el contrato como otro, y alinear RN4 con el prompt; o, si se acepta la regla de primera palabra, acotar prompt.md:54 a lo que hace el servidor"
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-14T19:12:28Z
**Estado:** gaps_found
**Re-verificación:** Sí. Viene después del plan de cierre 02-24 (D-63.10, commits `548ddd9..d2a91c0`), de la auditoría de seguridad posterior (`721d169`) y del code review de esa ronda (`faa86b2`, disposición en `577db09`).

## Logro del objetivo

Lo verifiqué en el código, con las pruebas nombradas y con sondas propias en el scratchpad. No me fié del SUMMARY, del review ni de la auditoría: reproduje cada afirmación. Para comparar versiones usé worktrees temporales de `6c2dba3` (02-23) y `10a43ad` en el scratchpad. Para la prueba de punta a punta escribí un test aparte en el scratchpad que usa los helpers del repositorio con el LLM falso. Eliminé los worktrees al terminar, y `git status` no muestra cambios nuevos fuera de los que ya estaban.

- **Lo que 02-24 cerró (las dos brechas del informe anterior):**
  - **CR-05.** Las 16 frases dan `rechaza` con uno y con dos pendientes, y también "no, ec-corp-andina no" y mis variantes ("No confirmo el envío simulado de ec-corp-andina.", "no confirmo el envío simulado de ec-corp-andina."). En `6c2dba3` daban `otro`, y en `10a43ad` daban `rechaza`.
  - De punta a punta: `compuerta.test.ts -t CR-05` da 31 pass y `compuerta-casos.test.ts -t CR-05` da 11 pass, los dos con 0 fail. Las 7 frases nuevas de cancelación cierran el turno sin pregunta y el "sí" siguiente queda bloqueado.
  - **Brecha 2, en su forma literal.** `prompt.md:51` cita "no confirmo el envío simulado" y "no confirmo porque falta el certificado". Cada cita de rechazo de las líneas 51 y 52, y cada cita de no rechazo de las líneas 52 y 54, da en el servidor la decisión que el prompt le asigna. Lo comprobé con mi sonda (36 frases, con uno y con dos pendientes, sin discrepancias) y con el contrato (30 pass).
  - **WR-25 / T-02-77.** Con el lookbehind, 200 000 caracteres tardan entre 2,5 y 4 ms. En la ronda anterior, 40 000 tardaban 2,2 s.
  - El conjunto de frases que confirman no cambió: "sí", "envía", "confirmo", "dale", "sí, envía ec-corp-andina" y "ok, envíalo" dan `confirma` en las tres versiones.
  - Archivos prohibidos: `git diff fe35813..HEAD` sale vacío para `src/domain/types`, `compuerta.policy.ts`, `ejecutar-turno.service.ts`, `strings.ts`, `src/knowledge` y `reto-01/`.
  - Barreras: `bun run check` sale con exit 0 (tsc, Biome sobre 282 archivos y `bun audit` sin vulnerabilidades). `bun test`, corrido una sola vez, da 1523 pass, 1 skip y 0 fail.
- **Lo que 02-24 rompió (CR-06, confirmado y bloqueante según el criterio que se usó para CR-04):**
  - La exención (d) solo mira la primera palabra de la cláusula. Un pedido que nombra el caso pendiente pasa de `otro` (02-23) a `rechaza` (HEAD) si empieza con un relleno o un conector, si usa un verbo fuera de la lista o si lleva enclítico. Pasa con "No, por favor consulta el NIT de ec-corp-andina", "Todavía no. Por favor revisa el NIT de ec-corp-andina.", "No, mejor procesa ec-corp-andina", "No, quiero el NIT de ec-corp-andina", "No, envíame el NIT de ec-corp-andina" y "detente, procesa ec-corp-andina". Con dos pendientes, también con "No, ahora consulta el NIT de co-industrias-delta". Encontré además dos variantes que el review no lista: "Todavía no, pero dame el NIT de ec-corp-andina" y "Espera, antes genera el pdf de ec-corp-andina".
  - Lo reproduje de punta a punta en el §11. Después de "No, por favor consulta el NIT de ec-corp-andina", el modelo responde "El paquete sigue pendiente", como le indica `prompt.md:54`. El servidor, en cambio, cierra con `needsConfirmation=false` y sin `confirmation_required`, y en el turno 3 el "sí" queda bloqueado con `CONFIRMACION_REQUERIDA`. Con "No, consulta el NIT de ec-corp-andina" (el verbo en primera posición), el mismo guion deja el caso pendiente y el "sí" envía.

**Conclusión:** las dos brechas del informe anterior están cerradas, y la clase CR-05 queda fijada por clase. Pero la misma enmienda reabre G-02-2 en la dirección de CR-04: un pedido cotidiano vuelve a cancelar en silencio, y el modelo y el servidor se contradicen. Ningún camino envía sin una confirmación explícita posterior, así que los criterios 1 a 5 del ROADMAP se cumplen a la letra. Lo que falla es la promesa de D-63.6 y de D-63.10(d) ("ningún pedido que nombra un caso cancela"), la verdad 31, que pasa de ✓ a ✗, y la coherencia entre el prompt y el servidor (verdad 41).

**Si CR-06 bloquea el objetivo.** La compuerta en sí, es decir, que nunca se envíe sin una confirmación explícita, se cumple y no tiene ningún camino inseguro. Aun así, lo clasifico como brecha y no como advertencia por tres razones:

- Es la misma clase de defecto que CR-04, que la usuaria trató como bloqueante en HV2 y que en la ronda 02-22 hizo fallar la verdad 31.
- Contradice una decisión que la propia fase registró como aprobada: D-63.10(d) dice que "ningún pedido que nombra un caso cancela".
- Ocurre en el escenario de la demo §11 con frases cotidianas ("No, por favor consulta…"), y el modelo le dice a la analista algo falso sobre el estado de la compuerta.

Si la usuaria prefiere aceptar la regla de primera palabra, la vía es un override de la verdad 31 junto con la enmienda de D-63.10(d) y de `prompt.md:54`. Abajo propongo el texto.

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: ciclo propio, `deepseek-flash` con thinking desactivado y solo rutas y valores enmascarados hacia el modelo | ✓ VERIFIED | Regresión: la suite completa sigue en verde. 02-24 no toca `llm/` ni `loop/` |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en §11 la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez y solo para ese caso; `confirmado: true` del modelo no basta | ✓ VERIFIED | `compuerta.test.ts` en verde, y la sonda da `rechaza` para "No envíes nada todavía". En CR-06 el error va al lado seguro: cancela y el "sí" siguiente no envía |
| 3 | **ROADMAP C3**: reintentos, respaldo, mensajes en español (402) y CA5 | ✓ VERIFIED | Regresión en verde; sin cambios en `llm/` |
| 4 | **ROADMAP C4**: topes con respuesta clara; la inyección no cambia la conducta | ✓ VERIFIED | Regresión en verde (WR-03 sigue abierto como advertencia) |
| 5 | **ROADMAP C5**: prompt y conocimiento editables; logs JSON correlacionados sin clave ni PII; `bun test` cubre el ciclo con un LLM falso | ✓ VERIFIED | 02-24 cambió la conducta del modelo solo con texto (`e4712fa`), y la suite está en verde |
| 6–20, 22 | Verdades de los planes 02-01 a 02-14 | ✓ VERIFIED | Regresión: la suite completa sigue en verde |
| 21, 28, 35 | Corrida en vivo y su lectura humana (HV1) | ✓ VERIFIED | Aceptadas en la UAT (prueba 1) |
| 23–27, 29, 32–34 | Verdades de 02-15 a 02-21 | ✓ VERIFIED | `compuerta`, `compuerta-casos` y `compuerta.policy` en verde |
| 30 | **02-19 V4**: un pedido ajeno no secuestra la confirmación | ✓ VERIFIED | `compuerta-casos.test.ts` en verde |
| 31 | **02-19 V10, prohibición 4 y G-02-2 (lado CR-04)**: solo un rechazo explícito saca el caso de la compuerta; un pedido con "no", "para", "luego", "mejor" o "después" lo deja pendiente | ✗ FAILED (regresión) | **CR-06.** "No, por favor consulta el NIT de ec-corp-andina", "No, mejor procesa ec-corp-andina", "Todavía no. Por favor revisa el NIT de ec-corp-andina." y 14 frases más pasan de `otro` (02-23) a `rechaza` (15 con uno y con dos pendientes, 2 solo con dos). Reproducido de punta a punta (ver Comprobaciones) |
| 36 | **02-22 V1**: "…para tenerlo a mano" deja el caso pendiente y el "sí" envía una vez | ✓ VERIFIED | Fila del `test.each` de mantener pendiente en verde |
| 37 | **02-22 V2**: "No envíes nada todavía, ¿qué falta?" cancela sin pregunta | ✓ VERIFIED | Fila del `test.each` de cancelación en verde; la sonda da `rechaza` |
| 38 | **02-22 V3**: `otro` para las preguntas y los pedidos con conectores; `rechaza` para una negación que rige el envío y para una cláusula de espera | ✓ VERIFIED (con la advertencia WR-26) | Cerrada por 02-24: la mitad del rechazo vuelve (CR-05). Lo que queda de la mitad `otro` está en la verdad 31. Advertencia WR-26: "Todavía no, falta el e-mail del contacto" da `otro`, porque "e-mail" cuenta como un caso no pendiente. No es una regresión respecto de 02-23 |
| 39 | **02-22 V4**: toda fila previa del clasificador conserva su resultado | ✓ VERIFIED | `confirmacion.policy.test.ts` completo en verde. El diff de 02-24 en las pruebas solo reformatea o agrega filas |
| 40 | **02-22 V5**: el conjunto de frases que confirman no cambia | ✓ VERIFIED | Invariantes de vocabulario y `RELLENO` congelado en verde, y mi sonda da los mismos `confirma` en las tres versiones |
| 41 | **02-22 V6 = 02-23 V8 = 02-24 V8**: el prompt y el conocimiento describen el mismo rechazo que aplica el servidor | ✗ FAILED (parcial) | La brecha 2 anterior está cerrada: todas las citas coinciden. Pero `prompt.md:54` promete "sigue pendiente y el servidor vuelve a agregar su pregunta" para un pedido de consulta, y el servidor cancela con "No, por favor consulta el NIT de ec-corp-andina" (CR-06). RN4 dice "de un caso" y el prompt "de otro caso" (WR-27). Depende de la verdad 31 |
| 42 | **02-22 V7**: D-63.8 registrado | ✓ VERIFIED | Sin cambios |
| 43–49 | **02-23 V1 a V7** | ✓ VERIFIED | Las filas D-63.9 de bucle, de clasificador, de clases y del diferencial siguen en verde dentro de la suite completa |
| 50 | **02-24 V1**: §11 y luego las 7 frases de CR-05 cancelan sin la pregunta del servidor, y el "sí" queda bloqueado con `CONFIRMACION_REQUERIDA` | ✓ VERIFIED | `compuerta.test.ts -t CR-05`: 31 pass. Leí la tabla de cancelación (filas 350-397): comprueba `needsConfirmation=false`, cero confirmaciones, el texto igual al del modelo y el turno 3 bloqueado |
| 51 | **02-24 V2**: "procesa co-industrias-delta, no ec-corp-andina" y "No ec-corp-andina, ¿qué falta?" dejan el caso pendiente con una pregunta, y el "sí" envía una vez | ✓ VERIFIED | Las mismas 31 pruebas (tabla de mantener pendiente) |
| 52 | **02-24 V3**: con dos pendientes, tres frases cancelan los dos y dos frases no cancelan ninguno | ✓ VERIFIED | `compuerta-casos.test.ts -t CR-05`: 11 pass |
| 53 | **02-24 V4**: `FILAS_D6310` (58 filas) | ✓ VERIFIED | `-t CR-05` en la prueba unitaria: 60 pass. Mi sonda coincide en todas las frases que comprobé |
| 54 | **02-24 V5**: clases generadas (corpus que nunca cancela, salvo los 3 pares aprobados; `siempreCancelan` ≥ 1500) | ✓ VERIFIED (tal como está escrita) | En verde dentro de `-t D-63.10` (64 pass). El corpus no tiene pedidos con un relleno delante, y por eso CR-06 escapa |
| 55 | **02-24 V6**: diferencial en cuatro direcciones contra `10a43ad`, mezclas con decisión fija | ✓ VERIFIED (tal como está escrita) | En verde. No hay una dirección contra `6c2dba3`, y por eso CR-06 pasa |
| 56 | **02-24 V7**: tiempo lineal de punta a punta | ✓ VERIFIED | `-t WR-25`: 5 pass. Mi sonda: 200 000 caracteres en 2,5-4,1 ms; "no, " × 50 000 + pedido en 28,8 ms |

**Puntaje:** 54 de 56 verdades verificadas. Fallan 2: la verdad 31, por la regresión CR-06, y la 41, que es parcial y depende de la 31. No hay verdades con comportamiento sin verificar. La verdad 8 de 02-24 repite la 41 y se cuenta una sola vez. Su parte literal (oraciones fijadas, citas clasificadas y la redacción del servidor negada da `rechaza`) sí se cumple.

### Elementos diferidos

Ninguno. La Fase 3 trae la tarjeta con Confirmar y Cancelar (botón estructurado, que tiene precedencia sobre el texto) y API-04, pero no redefine el rechazo por texto. CR-06 sigue ocurriendo en el chat por texto.

### Advisory (alcance nuevo, sin evidencia)

Ninguno. CR-06 tiene evidencia determinista: una sonda reproducible contra tres versiones del clasificador y una prueba de punta a punta por el bucle. Además, cae sobre una verdad arrastrada (31, G-02-2) en un archivo modificado en esta ronda (`confirmacion.policy.ts`).

### Artefactos requeridos (plan 02-24)

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `src/config/constants/confirmation.constants.ts` | Los 3 conjuntos nuevos y `SIGNO_DE_MOTIVO`, más los cambios en `CANCELACIONES` y `RELLENO_DE_ESPERA` | ✓ VERIFIED (⚠️ contenido) | Existen y se usan. `VERBOS_DE_PEDIDO` (204-223) es una lista cerrada sin enclíticos ni modales (CR-06) |
| `src/config/constants/patterns.constants.ts` | Lookbehind en `PATRON_SLUG_EN_TEXTO` | ✓ VERIFIED | Línea 25. Las derivadas no cambian |
| `src/domain/policies/confirmacion.policy.ts` | Rechazo D-63.10 con `eximeLaEspera` | ✗ Conducta incorrecta (en parte) | Es sustancial y está conectado. El lado CR-05 es correcto. La exención retrocede (líneas 256-262) |
| `tests/helpers/corpus-confirmacion.helper.ts` | Familias de CR-05, generadores de estrés y `RELLENO_10A43AD` | ✓ VERIFIED (⚠️ cobertura) | No genera pedidos con un relleno o conector delante |
| `tests/unit/confirmacion.policy.test.ts` | `FILAS_D6310`, pares, mezclas, cuarta dirección, vocabulario y tiempo | ✓ VERIFIED (⚠️ cobertura) | No compara contra 02-23 |
| `tests/loop/compuerta.test.ts` | 7 filas de cancelación y 2 de mantener pendiente | ✓ VERIFIED | 31 pass |
| `tests/loop/compuerta-casos.test.ts` | 3 filas de cancelación y 2 de mantener pendiente | ✓ VERIFIED | 11 pass |
| `agent/prompt.md` | S51 y S53 de D-63.10 | ⚠️ PARCIAL | Las citas coinciden. La línea 54 no se cumple para CR-06 (verdad 41) |
| `tests/contract/instrucciones-agente.test.ts` | Pines, redacción del servidor y `RETIRADOS_G024` | ✓ VERIFIED | 30 pass |

`verify.artifacts` da 9/9 (exit 0). Solo comprueba existencia y patrones.

### Verificación de enlaces clave

| De | A | Vía | Estado |
|----|---|-----|--------|
| confirmacion.policy | confirmation.constants | `CORTES_DE_COMPLEMENTO`, `VERBOS_DE_PEDIDO` y el resto | WIRED |
| confirmacion.policy | patterns.constants | `PATRON_SLUG_EN_TEXTO` | WIRED |
| ejecutar-turno.service | confirmacion.policy | `clasificarConfirmacion(` con los pendientes | WIRED |
| confirmacion.policy.test | corpus-confirmacion.helper | `estresMismaClausula` y el resto | WIRED |
| instrucciones-agente.test | strings.ts | `TEXTO_CONFIRMACION.unCaso` | WIRED |

`verify.key-links` da 5/5 (exit 0).

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `needsConfirmation` y `confirmation_required` después de un pedido que nombra el caso pendiente | Estado de la compuerta | mensaje → `clasificarConfirmacion` → `abrirTurno` → `pendientesDe` → `cerrarTurno` | Sí. Con la familia CR-06 la decisión llega mal (`rechaza`) | ⚠️ El flujo funciona, pero la entrada llega mal clasificada |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | exit 0; 282 archivos; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 1523 pass, 1 skip, 0 fail, 72 archivos | ✓ PASS |
| Bucle CR-05 (un pendiente) | `bun test tests/loop/compuerta.test.ts -t CR-05` | 31 pass, 0 fail | ✓ PASS |
| Bucle CR-05 (dos pendientes) | `bun test tests/loop/compuerta-casos.test.ts -t CR-05` | 11 pass, 0 fail | ✓ PASS |
| Clasificador CR-05 / D-63.10 / WR-25 | `bun test tests/unit/confirmacion.policy.test.ts -t …` | 60 / 64 / 5 pass, 0 fail | ✓ PASS |
| Contrato CR-05 | `bun test tests/contract/instrucciones-agente.test.ts -t CR-05` | 30 pass, 0 fail | ✓ PASS |
| Comparación entre versiones (scratchpad, `cmp.ts`) | `clasificarConfirmacion` de HEAD, `6c2dba3` y `10a43ad` | CR-05: las 16 frases, "no, ec-corp-andina no" y mis variantes pasan de `otro` (02-23) a `rechaza`. Los `confirma` no cambian. **CR-06: 15 frases pasan de `otro` (02-23) a `rechaza` (HEAD), con uno y con dos pendientes**, más "No, ahora consulta…" y "No, entonces procesa co-industrias-delta" con dos pendientes | ✗ FAIL (CR-06) |
| Citas del prompt contra el servidor (scratchpad, `prompt.ts`) | 27 citas de rechazo y 9 de no rechazo de las líneas 51, 52 y 54, con uno y con dos pendientes | Sin discrepancias | ✓ PASS |
| De punta a punta (test en el scratchpad, LLM falso, helpers del repositorio) | §11 T1, luego cada frase, luego "sí" | "No, por favor consulta el NIT de ec-corp-andina", "No, ahora consulta el NIT de ec-corp-andina" y "Todavía no. Por favor revisa el NIT de ec-corp-andina.": T2 da `needsConfirmation=false` y 0 confirmaciones, con el texto del modelo "El paquete sigue pendiente", y T3 "sí" da `CONFIRMACION_REQUERIDA` sin envío. Control: "No, consulta el NIT de ec-corp-andina" da T2 `needsConfirmation=true` con la pregunta del servidor, y T3 envía | ✗ FAIL (CR-06) |
| WR-26 (sonda) | "Todavía no, falta el e-mail del contacto", "No, espera, falta el pre-registro", "No. Te aviso por e-mail." | `otro` en 02-23 y en HEAD (`rechaza` en `10a43ad`) | ⚠️ Warning, no es regresión de esta ronda |
| Tiempo (sonda) | 200 000 caracteres en 7 formas | 0,5-28,8 ms | ✓ PASS |
| Alcance de 02-24 | `git diff --name-only a9f18a9..d2a91c0` y `fe35813..HEAD` sobre los archivos prohibidos | Solo los 10 archivos declarados; los prohibidos salen vacíos | ✓ PASS |

### Ejecución de probes

No aplica. La fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Planes | Descripción (resumen) | Estado | Evidencia |
|-----------|--------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo | ✓ SATISFIED | `inyeccion.test.ts` en verde |
| ENV-02 | 02-03…02-24 | El servidor hace cumplir la compuerta; el clasificador entiende negaciones | ✓ SATISFIED en lo que exige el requisito (⚠️ precisión) | Nunca autoriza sin una confirmación explícita, y CR-05 está cerrado. Falla la precisión de G-02-2 en la dirección de los pedidos (CR-06) |
| ENV-03 | 02-03…02-24 | El turno termina con la pregunta; el servidor calcula `needsConfirmation` | ✗ BLOCKED (parcial) | Después de "No, por favor consulta el NIT de ec-corp-andina", el servidor da `needsConfirmation=false` y no pregunta, aunque el paquete no se rechazó |
| AGT-01 | 02-01, 02-07 | Ciclo propio y tope | ✓ SATISFIED | Regresión |
| AGT-02 | 02-01…02-24 | Prompt y conocimiento separados y editables | ✓ SATISFIED (⚠️ verdad 41) | La editabilidad se cumple; la coherencia de la prosa con el servidor es parcial (CR-06, WR-27) |
| AGT-03 | 02-09…02-21 | No afirmar sin herramienta | ✓ SATISFIED | HV1 |
| AGT-04 | 02-02…02-20 | Sesiones e historial íntegro | ✓ SATISFIED | `historialSano` en verde |
| AGT-05 | 02-04…02-20 | Errores en español | ✓ SATISFIED | Regresión |
| LLM-01 a LLM-04 | 02-01…02-20 | Puerto, adaptador, resiliencia y respaldo | ✓ SATISFIED | Regresión |
| LLM-05 | 02-07 | Topes configurables | ✓ SATISFIED (⚠️ WR-03) | Sin cambios |
| SEG-03 | 02-05…02-21 | Logs sin clave ni PII | ✓ SATISFIED | Regresión |
| DEMO-03 | todos, 02-24 | Tests con un LLM falso | ✓ SATISFIED (⚠️ cobertura) | Existen y pasan, pero el corpus y el diferencial no cubren CR-06 |

Requisitos huérfanos: ninguno. Los 15 IDs que REQUIREMENTS.md asigna a la fase coinciden con la unión de los `requirements:` de los 24 planes. Nota de trazabilidad (ℹ️): la tabla de REQUIREMENTS.md marca ENV-02, ENV-03, AGT-02 y DEMO-03 como "Complete" después de 02-24, y los demás IDs de la fase como "Gaps Found". Ninguno de los dos estados refleja este informe: ENV-03 queda bloqueado en parte y los otros IDs están satisfechos.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `confirmacion.policy.ts`, `confirmation.constants.ts` | 256-262 / 204-223 | **CR-06 (= T-02-83)**: la exención solo mira el primer token; un pedido con un relleno, un conector, un modal o un enclítico delante cancela | 🛑 Blocker | Brecha 1. Después de un pedido, el servidor cancela en silencio y contradice al modelo y a D-63.10(d) |
| `agent/prompt.md`, `src/knowledge/registro-proveedor.md` | 54 / 42 | **WR-27** y la verdad 41: la prosa promete pendiente para un pedido de consulta; RN4 dice "un caso" y el prompt "otro caso" | 🛑 Blocker (parte de la brecha 2) | El modelo dice "sigue pendiente" mientras el servidor ya canceló |
| `tests/helpers/corpus-confirmacion.helper.ts`, `tests/unit/confirmacion.policy.test.ts` | 50-54, 248 / 569-584 | Corpus de pedidos siempre con el verbo primero; el diferencial no compara contra 02-23 | ⚠️ Warning | Por eso CR-06 pasa en verde |
| `confirmacion.policy.ts`, `patterns.constants.ts` | 256-259 / 25-26 | **WR-26**: cualquier palabra con guion ("e-mail", "pre-registro") cuenta como caso no pendiente y exime la espera | ⚠️ Warning | "Todavía no, falta el e-mail del contacto" da `otro` y el servidor vuelve a preguntar. Ya pasaba en 02-23 |
| `confirmacion.policy.ts` | 228-233, 152-164 | **IN-34**: "no, todo bien con ec-corp-andina" y "no lo hagas sin el logo" cancelan | ℹ️ Info | Lado seguro; `10a43ad` también las rechazaba |
| `confirmacion.policy.ts` | 246-262, 277-284 | **IN-35**: con dos pendientes, "envía ec-corp-andina. co-industrias-delta no." cancela los dos | ℹ️ Info | Coherente con "un núcleo en su propia cláusula cancela" y con WR-17 fuera |
| `tests/unit/confirmacion.policy.test.ts` | 561, 650-675 | **IN-36**: umbrales absolutos de 1 s y conteos fijos | ℹ️ Info | Hoy pasan con margen (3-29 ms) |
| `confirmation.constants.ts`, `confirmacion.policy.ts` | — | WR-23 (resto), WR-24, IN-31, IN-32, IN-33, WR-17, WR-18, WR-03 | ⚠️/ℹ️ abiertos | Declarados en D-63.10 o fuera de alcance por decisión de la usuaria |

No hay marcadores TBD, FIXME, XXX, TODO, HACK ni PLACEHOLDER en los 9 archivos de código y pruebas que modificó 02-24. `reto-01/` no tiene diferencias.

### Prohibiciones (02-24)

| Prohibición | Nivel | Disposición |
|-------------|-------|-------------|
| No ampliar lo que autoriza un envío | test | **Cumplida.** `RELLENO` congelado, los vocabularios nuevos son disjuntos y mi sonda da los mismos `confirma` en tres versiones |
| No cambiar la decisión esperada de una fila previa | test | **Cumplida.** El diff solo reformatea o agrega filas, y la suite está en verde |
| No editar plantillas del corpus que nunca cancela; solo los 3 pares aprobados cancelan | test | **Cumplida** dentro del corpus. CR-06 queda fuera del corpus |
| No cancelar un caso pendiente con un pedido que nombra un caso | test | **Incumplida en su enunciado general** (CR-06). Su precisión ("una cláusula encabezada por una palabra de VERBOS_DE_PEDIDO") sí se cumple a la letra. Queda marcada y forma parte de la brecha 1 |
| No cambiar `compuerta.policy.ts`, `ejecutar-turno.service.ts`, `src/domain/types/` ni `strings.ts` | test | **Cumplida.** El `git diff` sale vacío |
| No modificar `reto-01/`, 02-REVIEW-DISPOSITION, 02-UAT, 02-VERIFICATION ni 02-SECURITY | test | **Cumplida.** `a9f18a9..d2a91c0` solo toca los 10 archivos declarados |

### Verificación humana requerida

Ningún punto bloquea esta verificación, porque el estado es `gaps_found`. Después del cierre conviene repetir dos cosas:

1. **D5 de 02-22 a 02-24:** comprobar que el modelo en vivo solo dice "cancelada" cuando el servidor cancela, y "sigue pendiente" cuando el servidor vuelve a preguntar.
2. **Repetir HV2 de la UAT** con las frases de CR-04, CR-05 y CR-06, y con los cambios declarados que el SUMMARY de 02-24 pide aceptar o reabrir ("no, envía ec-corp-andina" da `rechaza`, el orden de las palabras decide si un motivo cuenta, y los 3 pares aprobados).

### Decisión pendiente para la usuaria (puerta de escalamiento)

CR-06 se puede cerrar de dos formas, y elegir entre ellas le toca a la usuaria:

- **Corregir (recomendado; es lo que dice D-63.10(d)).** Que la exención salte los rellenos y conectores iniciales y reconozca los enclíticos y los modales de pedido. Hay que sumar el generador `nuncaCancelanPedidoDelPendiente` y una quinta dirección del diferencial contra `6c2dba3`. Es la vía de 02-REVIEW.md (CR-06) para un plan 02-25 con `/gsd-plan-phase --gaps`. Esa misma corrección deja coherentes la línea 54 del prompt y RN4.
- **Aceptar la regla de primera palabra.** Hay que enmendar D-63.10(d): retirar "ningún pedido que nombra un caso cancela", declarar estas frases como filas RECHAZA y acotar `prompt.md:54`. Después se agrega a este informe:

```yaml
overrides:
  - must_have: "Verdad 31: solo un rechazo explícito saca el caso de la compuerta; un pedido que nombra un caso no cancela"
    reason: "La usuaria acepta que solo un pedido encabezado por una palabra de VERBOS_DE_PEDIDO exime la espera; los pedidos con relleno, modal o enclítico delante cancelan (lado seguro, nunca envía), declarados en D-63.10(d) y en prompt.md:54"
    accepted_by: "elianatorres5772"
    accepted_at: "<ISO timestamp>"
```

Con esa opción, la verdad 41 se cierra solo si `prompt.md:54` y RN4 se acotan a la misma regla.

### Resumen de brechas

El plan 02-24 cerró las dos brechas que tenía el informe anterior. Los rechazos de CR-05 vuelven a cancelar, el prompt cita la redacción del servidor y el clasificador corre en tiempo lineal. Pero, al acotar la exención por nombrar un caso a "una cláusula encabezada por un verbo de pedido", la exención depende de la primera palabra. Un pedido cotidiano sobre el caso pendiente vuelve a cancelar en silencio. Es la clase G-02-2 en la dirección de CR-04, y la usuaria ya la había tratado como bloqueante.

1. **Brecha 1 (bloqueante, CR-06 = T-02-83, regresión respecto de 02-23).** Estas frases dan `rechaza`: "No, por favor consulta el NIT de ec-corp-andina", "Todavía no. Por favor revisa el NIT de ec-corp-andina.", "No, mejor procesa ec-corp-andina", "No, quiero el NIT de ec-corp-andina", "Todavía no, pero dame el NIT de ec-corp-andina" y, con dos pendientes, "No, ahora consulta el NIT de co-industrias-delta". El servidor cancela sin pregunta y el "sí" siguiente queda bloqueado. La raíz es una sola: `eximeLaEspera` mira solo `tokens[0]`.
2. **Brecha 2 (parcial, depende de la 1).** `prompt.md:54` le dice al modelo que un pedido de consulta deja el paquete pendiente con la pregunta del servidor. Para la familia CR-06, el modelo dice "sigue pendiente" y el servidor ya canceló. RN4 y el prompt describen además reglas distintas (WR-27).

**Seguridad.** Ninguna brecha permite un envío sin una confirmación explícita posterior. CR-06 va al lado seguro. Los criterios 1 a 5 del ROADMAP se cumplen a la letra. La compuerta que el servidor hace cumplir no tiene ningún camino inseguro. Lo que falla es la precisión de la decisión "rechaza / otro" que fijaron D-63.6 y D-63.10(d), y la coherencia entre el modelo y el servidor.

**Pruebas.** Todas pasan porque los pedidos generados siempre empiezan con el verbo y el diferencial no compara contra la versión entregada inmediatamente antes. El arreglo que propone 02-REVIEW.md para CR-06 sirve como punto de partida, siempre que la usuaria no elija aceptar la regla de primera palabra.

---

_Verificado: 2026-10-14T19:12:28Z_
_Verificador: Claude (gsd-verifier)_
