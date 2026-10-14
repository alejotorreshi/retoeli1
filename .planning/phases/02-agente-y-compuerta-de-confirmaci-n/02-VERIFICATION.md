---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-14T05:40:00Z
status: gaps_found
score: 39/42 must-haves verified
covered_files: [".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-SUMMARY.md","agent/prompt.md","src/config/constants/confirmation.constants.ts","src/config/constants/patterns.constants.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/knowledge/registro-proveedor.md","src/loop/services/ejecutar-turno.service.ts","tests/contract/instrucciones-agente.test.ts","tests/loop/compuerta.test.ts","tests/unit/confirmacion.policy.test.ts"]
covered_digest: "v3:sha256:e8f445ccb9f4595bd764266a90f19c3204c7d230ab107ed2895dc58bb4b2b7f5"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 31/35
  gaps_closed:
    - "HV1 (verdades 21, 28 y 35): la usuaria leyó la corrida en vivo de 02-21 y la aceptó; A2 queda como varianza del modelo (02-UAT.md prueba 1, T-02-41 / AR-02-01)"
    - "G-02-2, frases reportadas: 'Consulta el valor del NIT de co-industrias-delta para tenerlo a mano' deja el caso pendiente con la pregunta del servidor y el 'sí' siguiente envía una vez; 'No envíes nada todavía, ¿qué falta?' cancela sin pregunta del servidor (02-22, D-63.8)"
    - "WR-15 en su forma con verbo de envío: 'no envíes / no lo mandes / no lo envíes aún' seguidos de una pregunta ya dan rechaza"
    - "IN-01(b): 'envía el paquete de ec-corp-andina para firma', 'envíalo para firma' y 'dale no más' ya no son rechazos (dan otro)"
  gaps_remaining:
    - "G-02-2 / verdad 31: un pedido o una pregunta común que contiene 'para', 'no', 'luego', 'mejor' o 'después' sigue cancelando el caso pendiente (CR-04)"
  regressions:
    - "02-22 convirtió en rechazo preguntas que antes dejaban el caso pendiente (otro → rechaza): 'Para pe-andes, ¿qué falta?', 'Luego, ¿qué sigue?', 'Luego ¿qué sigue?' (sin coma), 'Y después, ¿qué hago?', 'Mejor, ¿me das el NIT?', 'Momento, ¿cuál es el NIT?', 'No envié el certificado, ¿lo puedo agregar?', '¿por qué no mandé el RUT?', '¿no lo envié ya?', '¿no confirmo yo después?'. Comparado contra el clasificador de 10a43ad en el scratchpad"
    - "02-22 convirtió en re-pregunta rechazos que antes cancelaban (rechaza → otro): 'no quiero enviarlo todavía' y 'espera un momento' (WR-19)"
gaps:
  - truth: "G-02-2 (02-UAT.md) y verdad 31: con un caso pendiente, solo un rechazo explícito lo cancela; un pedido o una pregunta que solo contiene una palabra como 'para', 'no', 'luego', 'mejor' o 'después' deja el caso pendiente con la pregunta del servidor. También la verdad 3 y la prohibición 3 de 02-22 ('MUST NOT cancel a pending case because an unrelated request or an ordinary question merely contains a word like…')"
    status: failed
    reason: "La regla (b) de D-63.8 (cláusula que no es pregunta hecha solo de NEGACIONES y RELLENO) dispara con la cabeza de una pregunta o con un complemento: PATRON_CLAUSULA corta en ',' y también en '¿' sin signo previo, separar() quita los slugs antes de evaluar la cláusula, RELLENO admite 'el', 'la', 'de', 'caso' y 'paquete', y los conectores 'para', 'luego', 'después', 'mejor', 'momento' y 'nada' bastan como núcleo. La forma (a) además toma el pretérito sin tilde ('envié', 'mandé') y 'hagas'/'confirmo' con otro objeto como rechazo. Reproducido de punta a punta con el agente y el LLM falso: el modelo dice 'Sigue pendiente el envío de ec-corp-andina', el turno cierra con needsConfirmation=false y 0 confirmation_required, y el 'sí' siguiente da CONFIRMACION_REQUERIDA con enviados=[]. Es el síntoma de doble confirmación de CR-01 y de G-02-2, y diez de estas preguntas daban 'otro' antes de 02-22 (regresión)"
    artifacts:
      - path: "src/domain/policies/confirmacion.policy.ts"
        issue: "líneas 98-112: esClausulaDeEspera acepta conectores sueltos y rellenos nominales como cláusula de rechazo, y evalúa la cláusula sin los slugs; líneas 86-96: niegaElEnvio no distingue el pretérito ni el objeto de 'hagas'/'confirmo'"
      - path: "src/config/constants/patterns.constants.ts"
        issue: "línea 23: PATRON_CLAUSULA convierte la cabeza de una pregunta ('Luego, ', 'Luego ') en una cláusula sin signo de pregunta"
      - path: "src/config/constants/confirmation.constants.ts"
        issue: "NEGACIONES (63-89) mezcla núcleos de rechazo con conectores; RELLENO (38-61) incluye artículos y sustantivos; VERBOS_NEGABLES (106-119) incluye 'envie', 'mande', 'despache' (colisión con el pretérito) y 'hagas', 'confirmo', 'autorizo' sin restricción de objeto"
      - path: "tests/unit/confirmacion.policy.test.ts"
        issue: "FILAS_RECHAZO_ACOTADO nunca prueba un conector como cabeza separada por coma o por '¿', ni 'para <caso>', 'no <caso>', 'después el paquete' ni el pretérito; no hay invariante simétrico del lado de otro (IN-29)"
    missing:
      - "Que un conector ('para', 'luego', 'después', 'mejor', 'momento', 'nada', 'aún', 'todavía', 'ni') solo cuente como rechazo cuando la cláusula es todo el mensaje ('Para.', 'mejor después'), y que una cláusula parcial necesite un núcleo verdadero ('no', 'nunca', 'espera', 'cancela', 'alto', 'detente', 'aguarda')"
      - "Que la cabeza de una pregunta no sea una cláusula de rechazo: 'Luego ¿qué sigue?' y 'Luego, ¿qué sigue?' dan otro (tratar '¿' como inicio de la cláusula siguiente y la cabeza como parte de la pregunta, o exigir núcleo verdadero)"
      - "Que un slug o un relleno nominal ('el', 'caso', 'paquete') no quepa en una cláusula de rechazo salvo junto a un verbo de cancelación ('cancela ec-corp-andina')"
      - "Que la forma (a) descarte el pretérito leyendo los tokens con tilde ('envié', 'mandé', 'despaché') y que 'hagas', 'confirmo' y 'autorizo' solo rechacen sin complemento ajeno ('no lo hagas', 'no confirmo', 'no autorizo el envío' sí; 'No hagas el PDF', 'no confirmo el NIT' no)"
      - "Filas OTRO para todas las frases de la tabla de CR-04 y de este informe (incluidas 'Luego ¿qué sigue?' sin coma, 'Para pe-andes ¿qué falta?', 'Momento, ¿cuál es el NIT?', 'No envié el certificado, ¿lo puedo agregar?') y un invariante generado del lado de otro (plantillas '${p}, ¿qué falta?', '${p} ¿qué falta?', 'dame el NIT, ${p} el paquete', 'procesa pe-andes, ${p} co-industrias-delta' para p en no/para/luego/mejor/después)"
      - "Pruebas de bucle 'deja el caso pendiente' para 'Para pe-andes, ¿qué falta?', 'Luego ¿qué sigue?' y 'procesa co-industrias-delta, no pe-andes' (con dos casos pendientes, ninguno se cancela)"
      - "Mantener en verde las filas RECHAZA actuales ('No, ¿qué falta?', 'Espera, ¿qué falta?', 'Todavía no. ¿Qué falta?', 'Para.', 'mejor después', 'cancela ec-corp-andina', 'no, gracias', 'por ahora no') y registrar el ajuste como enmienda de D-63.8"
  - truth: "02-22 verdad 6: agent/prompt.md y src/knowledge/registro-proveedor.md describen el mismo rechazo que aplica el servidor"
    status: partial
    reason: "Los ejemplos citados coinciden con el clasificador (el contrato pasa), pero la regla en prosa no: prompt.md:53 promete que un pedido 'no es un rechazo aunque traiga palabras como \"no\", \"para\", \"luego\", \"mejor\" o \"después\"' y el servidor cancela con 'procesa co-industrias-delta, no pe-andes' o 'Para pe-andes, ¿qué falta?'; prompt.md:51 cita 'espera' como rechazo y el servidor da otro con 'espera un momento'. RN4 (registro-proveedor.md:42) termina con 'Un pedido que solo contiene palabras como \"no\", \"para\", \"luego\" o \"mejor\" no es un rechazo', que se lee como lo contrario de la forma (b) y contradice la misma oración, que cita 'no' como rechazo (WR-22)"
    artifacts:
      - path: "src/knowledge/registro-proveedor.md"
        issue: "línea 42: la última oración de RN4 dice lo contrario de la regla (b)"
      - path: "agent/prompt.md"
        issue: "líneas 51 y 53: la prosa promete conductas que el servidor no cumple (depende del cierre de la brecha anterior)"
      - path: "tests/contract/instrucciones-agente.test.ts"
        issue: "fija fragmentos cortos ('no es un rechazo') y solo los ejemplos citados; no detecta la inversión de RN4 (IN-26, IN-29)"
    missing:
      - "Redactar RN4 como el prompt: 'Un pedido distinto (por ejemplo \"consulta el NIT para tenerlo a mano\") no es un rechazo aunque traiga palabras como \"no\", \"para\", \"luego\" o \"mejor\".' y fijar la oración completa en el contrato"
      - "Después de cerrar la brecha anterior, comprobar que la prosa de prompt.md:51,53 coincide con el clasificador corregido"
  - truth: "02-22 prohibición 2: MUST NOT leave a case pending with a server confirmation question after a message that negates the send"
    status: partial
    reason: "La forma (a) solo reconoce doce formas exactas. 'no quiero enviarlo todavía', 'ni se te ocurra enviarlo', 'no lo confirmes', 'no confirmes', 'no autorices' y 'no puedo confirmar todavía' dan otro, así que el servidor agrega '¿Confirmas el envío simulado…?' justo después de que la analista negó el envío. 'no quiero enviarlo todavía' y 'espera un momento' cancelaban antes de 02-22 (regresión). El plan lo marcó como supuesto no resuelto, pero choca con la prohibición tal como está escrita (WR-19). Nunca envía sin un 'sí' posterior"
    artifacts:
      - path: "src/config/constants/confirmation.constants.ts"
        issue: "VERBOS_NEGABLES (106-119) no incluye 'confirmes', 'autorices' ni infinitivos con enclítico tras un modal negado; RELLENO no tiene 'un'"
    missing:
      - "Ampliar la forma (a) con 'confirmes', 'autorices' y los infinitivos 'enviar(lo|la)', 'mandar(lo)', 'confirmar' tras 'no quiero', 'no puedo', 'no vayas a', 'ni se te ocurra'; agregar 'un' a los rellenos de espera"
      - "Filas RECHAZA para las frases de WR-19 y una prueba de bucle para 'no quiero enviarlo todavía'"
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-14T05:40:00Z
**Estado:** gaps_found
**Re-verificación:** Sí. Viene después del plan de cierre 02-22 (G-02-2, D-63.8), del code review 02-REVIEW.md (`cec32ac`) y de la auditoría de seguridad posterior.

## Logro del objetivo

Lo verifiqué en el código, con las pruebas nombradas y con sondas propias en el scratchpad (sin tocar el repo). No me fié del SUMMARY ni del review: reproduje cada afirmación.

- **Lo que 02-22 sí logró:**
  - Las dos frases de la UAT funcionan de punta a punta. `bun test tests/loop/compuerta.test.ts -t "D-63.8"` da 10 pass y 0 fail.
  - "No envíes nada todavía, ¿qué falta?" da `rechaza` y cancela sin la pregunta del servidor.
  - El conjunto de frases que confirman no cambió: la prueba de invariante pasa, mi sonda da los mismos `confirma`, y la auditoría barrió 555.900 mensajes sin cambios en `confirma` ni en `falta_caso`.
  - No se tocaron la máquina de estados ni el botón: `git diff 10a43ad..HEAD` no lista `compuerta.policy.ts`, `ejecutar-turno.service.ts`, `src/domain/types/` ni `reto-01/`.
  - Barreras: `bun run check` sale con exit 0 (tsc, Biome con 281 archivos, `bun audit` sin vulnerabilidades). `bun test`, corrido una sola vez, da 1311 pass, 1 skip y 0 fail.
- **Lo que no logró (CR-04 confirmado, y más amplio de lo que dice el review):**
  - La regla (b) de D-63.8 cancela el caso pendiente con preguntas y pedidos comunes que solo contienen "para", "no", "luego", "mejor" o "después".
  - Reproduje las 13 frases de CR-04 (12 dan `rechaza`; "Ahora, ¿qué falta?" da `otro`) y encontré otras nuevas. "**Luego ¿qué sigue?**", **sin coma**, también da `rechaza`, porque `PATRON_CLAUSULA` corta antes de "¿". Lo mismo pasa con "Para pe-andes ¿qué falta?", "Después ¿qué hago?", "Mejor ¿me das el NIT?", "Momento, ¿cuál es el NIT?" y "No, el de pe-andes".
  - Con dos casos pendientes, "procesa pe-andes, no co-industrias-delta" cancela los dos.
- **De punta a punta (scratchpad, con el agente y el LLM falso).** Probé el §11 T1, luego cada frase con un modelo que contesta "Sigue pendiente el envío de ec-corp-andina.", y luego "sí".
  - Con 6 frases ("Para pe-andes, ¿qué falta?", "Luego, ¿qué sigue?", "Luego ¿qué sigue?", "Dame primero el NIT, después el paquete", "procesa co-industrias-delta, no pe-andes" y "Mejor, ¿me das el NIT?"), T2 cierra con `needsConfirmation=false` y 0 `confirmation_required`, y el texto del modelo dice que sigue pendiente. T3 "sí" da `CONFIRMACION_REQUERIDA` y `enviados=[]`.
  - La fila de control ("…para tenerlo a mano") sí sigue pendiente y envía una vez.
  - Es exactamente el síntoma de G-02-2 y de CR-01: doble confirmación, y el modelo afirma un estado que el servidor no tiene.
- **Regresión introducida por 02-22.** Extraje el clasificador de `10a43ad` al scratchpad y comparé.
  - Diez preguntas que antes daban `otro` (el caso seguía pendiente con la pregunta del servidor) ahora dan `rechaza` y cancelan: "Para pe-andes, ¿qué falta?", "Luego, ¿qué sigue?", "Luego ¿qué sigue?", "Y después, ¿qué hago?", "Mejor, ¿me das el NIT?", "Momento, ¿cuál es el NIT?", "No envié el certificado, ¿lo puedo agregar?", "¿por qué no mandé el RUT?", "¿no lo envié ya?" y "¿no confirmo yo después?".
  - A la inversa, "no quiero enviarlo todavía" y "espera un momento" cancelaban y ahora vuelven a recibir la pregunta.

**Conclusión:** la brecha G-02-2 se cerró para las frases citadas, pero no para la clase que describe su verdad. La usuaria ya decidió en la UAT (HV2: "no-pass → plan de cierre… Mismo síntoma que hizo bloqueante a CR-01") que esta clase es bloqueante, así que la verdad 31 pasa de ? UNCERTAIN a ✗ FAILED. Ningún camino envía sin una confirmación explícita, así que el criterio 2 del ROADMAP sigue cumplido. Lo que falla es la promesa de D-63.6 y D-63.8 de que "un pedido o una pregunta que solo contiene esas palabras da otro", que el propio STATE.md registra como la decisión.

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: ciclo propio, `deepseek-flash` con thinking desactivado y solo rutas y valores enmascarados hacia el modelo | ✓ VERIFIED | Regresión: suite completa en verde (`trazador-agente`, `pii-modelo`, `inyeccion`). La corrida en vivo de 02-21 se aceptó en la UAT (prueba 1) |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en §11 la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez y solo para ese caso; `confirmado: true` del modelo no basta | ✓ VERIFIED | `compuerta.test.ts` en verde. Sonda: "No envíes nada todavía" y "No envíes nada todavía, ¿qué falta?" dan `rechaza`. Ninguna frase de CR-04 ni de WR-19 autoriza un envío |
| 3 | **ROADMAP C3**: reintentos, respaldo, mensajes en español (402) y CA5 | ✓ VERIFIED | Regresión en verde; 02-22 no toca `llm/` |
| 4 | **ROADMAP C4**: topes con respuesta clara; la inyección no cambia la conducta | ✓ VERIFIED | Regresión en verde (WR-03 agravado sigue abierto, como advertencia) |
| 5 | **ROADMAP C5**: prompt y conocimiento editables; logs JSON correlacionados sin clave ni PII; `bun test` cubre el ciclo con un LLM falso | ✓ VERIFIED | 02-22 cambió la conducta del modelo solo con texto (`ae2e4c3`); `instrucciones-agente` da 23 pass con `-t G-02-2`; suite en verde |
| 6–20, 22 | Verdades de los planes 02-01 a 02-14 | ✓ VERIFIED | Regresión: suite completa en verde y sin cambios en esos archivos desde la verificación anterior |
| 21, 28, 35 | Corrida en vivo de 02-13, 02-18 y 02-21 y su lectura humana | ✓ VERIFIED | La usuaria la leyó y la aceptó en la UAT, prueba 1 (HV1, `pass`), con la nota de que A2 es varianza del modelo (T-02-41 / AR-02-01) |
| 23–27, 29, 32–34 | Verdades de 02-15 a 02-21 (casos enviados, tabla del clasificador, punto final, re-pregunta CR-01, D-63.6, D-63.7, WR-01, prueba en vivo endurecida) | ✓ VERIFIED | Regresión: `compuerta`, `compuerta-casos` y `compuerta.policy` en verde (121 pass según SUMMARY; mi corrida completa da 0 fail). La fila 24 se cumple porque toda fila de `TABLA_INVESTIGACION` y `FILAS_EXTRA` sigue en verde (199 pass) |
| 30 | **02-19 verdad 4**: un pedido ajeno no secuestra la confirmación ("procesa el caso co-industrias-delta" deja los dos casos pendientes) | ✓ VERIFIED | `compuerta-casos.test.ts` en verde y sonda `otro`. Con "procesa co-industrias-delta, no pe-andes" sí cancela (ver verdad 31) |
| 31 | **02-19 verdad 10, prohibición 4 y G-02-2**: un caso pendiente sale de la compuerta solo por un rechazo explícito; un pedido con "para", "no", "luego", "mejor" o "después" lo deja pendiente | ✗ FAILED | Ver el resumen y la brecha 1. Reproducido de punta a punta con 6 frases y por clasificador con más de 20. La usuaria eligió (b), corregir, en HV2. 02-22 no cerró la clase y además agregó regresiones |
| 36 | **02-22 V1**: §11, luego "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano", luego "sí": T2 con `needsConfirmation` true, una sola `confirmation_required` y el texto exacto; T3 envía una vez | ✓ VERIFIED | `compuerta.test.ts:291-333` pasa (5 filas). Mi prueba de punta a punta la reproduce: T2 da `t2nc=true` y `t2conf=1`, T3 da `ok` con `enviados=[EC]` |
| 37 | **02-22 V2**: "No envíes nada todavía, ¿qué falta?" cancela sin pregunta y el "sí" siguiente da `CONFIRMACION_REQUERIDA` | ✓ VERIFIED | `compuerta.test.ts:335-369` pasa (5 filas); sonda `rechaza` |
| 38 | **02-22 V3**: `otro` para las ocho preguntas comunes **y para los pedidos ajenos que solo contienen "para", "no", "luego", "mejor" o "después"**; `rechaza` para una negación que rige el envío y para una cláusula de espera | ✗ FAILED | Las ocho preguntas listadas sí dan `otro`, pero los pedidos ajenos con esas palabras no: "Dame primero el NIT, después el paquete", "procesa co-industrias-delta, no pe-andes", "lee la solicitud de pe-andes, no la de ec-corp-andina", "Para el paquete de pe-andes, revisa el NIT" y "nada, procesa pe-andes" dan `rechaza`. La misma raíz que la verdad 31 |
| 39 | **02-22 V4**: toda fila previa del clasificador conserva su resultado; "dos respuestas seguidas…" sigue en verde | ✓ VERIFIED | `confirmacion.policy.test.ts` da 199 pass; `compuerta.test.ts` completo en verde |
| 40 | **02-22 V5**: el conjunto de frases que confirman no cambia; ninguna palabra de NEGACIONES o NEGADORES confirma | ✓ VERIFIED | Describe "una palabra de rechazo nunca confirma (D-63.8, D-39)" en verde. La sonda da los mismos `confirma` ("sí", "envía", "confirmo", "dale", "sí, envía ec-corp-andina"). La auditoría barrió 555.900 mensajes sin cambios (T-02-66) |
| 41 | **02-22 V6**: el prompt y el conocimiento describen el mismo rechazo que aplica el servidor; cada ejemplo citado se clasifica igual | ✗ FAILED (parcial) | Los ejemplos citados coinciden (el contrato da 23 pass). La prosa no: `prompt.md:53` promete que un pedido con "no", "para", "luego", "mejor" o "después" no es un rechazo, y el servidor sí lo trata como rechazo. `prompt.md:51` cita "espera", y "espera un momento" da `otro`. La última oración de RN4 (`registro-proveedor.md:42`) dice lo contrario de la forma (b) (WR-22, confirmado leyendo el archivo) |
| 42 | **02-22 V7**: D-63.8 registrado en 02-CONTEXT.md y la línea 02-03 de STATE.md corregida | ✓ VERIFIED | `02-CONTEXT.md:61` dice "ocho lecturas" y D-39 dice "lo define D-63.8". `STATE.md:159` dice "CORREGIDO por 02-22" y `STATE.md:204` tiene la línea 02-22 |

**Puntaje:** 39 de 42 verdades verificadas. Fallan 3: las verdades 31 y 38 tienen la misma raíz, y la 41 es parcial y depende de ellas. No hay verdades con comportamiento sin verificar.

### Elementos diferidos

Ninguno. La Fase 3 (criterio 3) pide la tarjeta con Confirmar y Cancelar, pero no toca el clasificador de texto ni define el rechazo. No hay evidencia específica para diferir la brecha.

### Advisory (alcance nuevo, sin evidencia)

Ninguno. Cada hallazgo nuevo que uso (CR-04, WR-19, WR-20, WR-21 y WR-22) tiene evidencia determinista: sondas reproducibles del clasificador, una prueba de punta a punta por el bucle y la comparación con el código de `10a43ad`. Además, CR-04 cae sobre una brecha arrastrada (G-02-2), y los archivos marcados se modificaron en esta ronda.

### Artefactos requeridos (plan 02-22)

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `src/config/constants/confirmation.constants.ts` | `NEGADORES`, `PRONOMBRES_ATONOS` y `VERBOS_NEGABLES`; `NEGACIONES` sin cambios | ✓ VERIFIED (⚠️ contenido) | Existen y se importan. `VERBOS_NEGABLES` incluye "envie", "mande" y "despache" (colisionan con el pretérito, WR-20) y "hagas", "confirmo" y "autorizo" sin objeto (WR-21) |
| `src/config/constants/patterns.constants.ts` | `PATRON_CLAUSULA` | ✓ VERIFIED (⚠️ conducta) | Línea 23. Corta la cabeza de una pregunta como cláusula propia (raíz de CR-04) |
| `src/domain/policies/confirmacion.policy.ts` | Rechazo acotado antes de la pregunta | ✗ Conducta incorrecta | Existe, es sustancial y está conectado (`decisionDe` en `ejecutar-turno.service.ts:55`). La regla (b) es demasiado amplia (brecha 1) |
| `tests/unit/confirmacion.policy.test.ts` | Filas D-63.8 e invariante | ✓ VERIFIED (⚠️ cobertura) | 199 pass. Ninguna fila cubre las familias de CR-04 (IN-29) |
| `tests/loop/compuerta.test.ts` | Pruebas de bucle D-63.8 | ✓ VERIFIED | 10 pass |
| `agent/prompt.md` | Rechazo definido como el servidor | ⚠️ PARCIAL | Líneas 51 y 53, ver la verdad 41 |
| `src/knowledge/registro-proveedor.md` | RN4 acotada | ⚠️ PARCIAL | La última oración de la línea 42 se contradice (WR-22) |
| `tests/contract/instrucciones-agente.test.ts` | Ejemplos citados contra el clasificador | ✓ VERIFIED (⚠️ fragmentos cortos) | 23 pass. No detecta WR-22 (IN-26, IN-29) |

`verify.artifacts` da 8/8 para 02-22 (exit 0). Solo comprueba existencia y patrones, y la conducta falla como se describe arriba.

### Verificación de enlaces clave

| De | A | Vía | Estado | Detalles |
|----|---|-----|--------|----------|
| confirmacion.policy | confirmation.constants | `VERBOS_NEGABLES`, `NEGADORES`, `PRONOMBRES_ATONOS`, `NEGACIONES` y `RELLENO` | WIRED | |
| confirmacion.policy | patterns.constants | `PATRON_CLAUSULA` | WIRED | |
| ejecutar-turno.service | confirmacion.policy | `clasificarConfirmacion(` en `decisionDe` | WIRED | `abrirTurno` (`compuerta.policy.ts:46-49`) convierte cada `rechaza` falso en LIBRE para todos los casos |
| instrucciones-agente.test | confirmacion.policy | `clasificarConfirmacion` | WIRED | |

`verify.key-links` da 4/4 (exit 0).

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `needsConfirmation` y `confirmation_required` tras un pedido ajeno | Estado de la compuerta | mensaje → `clasificarConfirmacion` → `abrirTurno` → `pendientesDe` → `cerrarTurno` | Sí, pero la decisión es incorrecta para la familia CR-04 | ⚠️ El flujo funciona y la entrada viene mal clasificada |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | exit 0; Biome revisó 281 archivos; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 1311 pass, 1 skip, 0 fail, 5929 expect, 72 archivos | ✓ PASS |
| Bucle D-63.8 | `bun test tests/loop/compuerta.test.ts -t "D-63.8"` | 10 pruebas, 0 fail | ✓ PASS |
| Clasificador | `bun test tests/unit/confirmacion.policy.test.ts` | 199 pass, 0 fail | ✓ PASS |
| Contrato G-02-2 | `bun test tests/contract/instrucciones-agente.test.ts -t "G-02-2"` | 23 pruebas, 0 fail | ✓ PASS |
| Sonda del clasificador (scratchpad, `bun run probe.ts`) | `clasificarConfirmacion(f, ["ec-corp-andina"])` con las frases de CR-04, WR-19, WR-20 y WR-21, los ejemplos del prompt y las confirmaciones | Coincide con el review, sin excepción: 12 de 13 frases de CR-04 dan `rechaza`, las de WR-19 dan `otro`, y las de WR-20 y WR-21 dan `rechaza`. Las confirmaciones no cambian | ✗ FAIL (CR-04) |
| Variantes propias (scratchpad) | Igual | "Luego ¿qué sigue?", "Para pe-andes ¿qué falta?", "Después ¿qué hago?", "Mejor ¿me das el NIT?", "Momento, ¿cuál es el NIT?", "Y luego ¿qué?", "Bueno, luego ¿qué sigue?", "No, el de pe-andes" y "nada, procesa pe-andes" dan `rechaza`. Con dos pendientes, "procesa pe-andes, no co-industrias-delta" da `rechaza` | ✗ FAIL |
| De punta a punta (scratchpad, `bun test e2e-cr04.test.ts`, LLM falso) | §11 T1, luego la frase y luego "sí" | 6 frases de CR-04: T2 da `needsConfirmation=false`, 0 confirmaciones y el modelo dice "Sigue pendiente…"; T3 da `CONFIRMACION_REQUERIDA` y `enviados=[]`. La fila de control envía una vez | ✗ FAIL (síntoma de G-02-2) |
| Regresión contra `10a43ad` (scratchpad, `bun run comparar.ts`) | Clasificador viejo contra el nuevo | 10 preguntas pasan de `otro` a `rechaza`; "no quiero enviarlo todavía" y "espera un momento" pasan de `rechaza` a `otro` | ✗ Regresión |
| Alcance de 02-22 | `git diff --name-only 10a43ad..HEAD -- compuerta.policy.ts ejecutar-turno.service.ts src/domain/types reto-01` | vacío | ✓ PASS |

Las sondas viven solo en el scratchpad de la sesión. `git status` no muestra cambios fuera de `.planning/`.

### Ejecución de probes

No aplica. La fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Planes | Descripción (resumen) | Estado | Evidencia |
|-----------|--------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo; fixture inyectado | ✓ SATISFIED | `inyeccion.test.ts` en verde. REQUIREMENTS.md:185 sigue diciendo "Pending" (ℹ️ trazabilidad) |
| ENV-02 | 02-03, 02-06, 02-10, 02-13 a 02-16, 02-18 a 02-22 | El servidor hace cumplir la compuerta; clasificador determinista que entiende negaciones | ✓ SATISFIED en lo que exige el requisito (⚠️ precisión) | Ninguna autorización sin confirmación explícita. La precisión del rechazo que exige la brecha G-02-2 falla (brecha 1), y REQUIREMENTS.md:203 la marca "Complete" de forma prematura |
| ENV-03 | 02-03, 02-06, 02-10, 02-13 a 02-16, 02-18 a 02-22 | El turno termina con la pregunta que lista los bloqueos; el servidor calcula `needsConfirmation` | ✗ BLOCKED (parcial) | Con la familia CR-04, el turno de un caso que sigue esperando no trae la pregunta ni `needsConfirmation`, porque el servidor lo canceló sin un rechazo real. Con WR-19, la pregunta aparece después de una negación |
| AGT-01 | 02-01, 02-07 | Ciclo propio y tope de 25 | ✓ SATISFIED | Regresión |
| AGT-02 | 02-01, 02-02, 02-09, 02-18, 02-19, 02-22 | Prompt y conocimiento separados y editables | ✓ SATISFIED (⚠️ verdad 41) | La editabilidad se cumple. La coherencia del texto con el servidor es parcial (WR-22) |
| AGT-03 | 02-09, 02-18, 02-19, 02-21 | El prompt prohíbe afirmar sin herramienta | ✓ SATISFIED | HV1 aceptada en la UAT |
| AGT-04 | 02-02, 02-06, 02-08, 02-11 a 02-13, 02-15, 02-19, 02-20 | Sesiones; historial íntegro; CA5 | ✓ SATISFIED | `historialSano` en las pruebas nuevas |
| AGT-05 | 02-04, 02-08, 02-17, 02-20 | Errores en español desde un catálogo | ✓ SATISFIED | Regresión |
| LLM-01 a LLM-04 | 02-01, 02-02, 02-04, 02-08, 02-09, 02-17, 02-20 | Puerto, adaptador, resiliencia y respaldo | ✓ SATISFIED | Regresión |
| LLM-05 | 02-07 | Topes configurables con mensaje claro | ✓ SATISFIED (⚠️ WR-03) | Sin cambios |
| SEG-03 | 02-05, 02-08, 02-15, 02-21 | Logs JSON sin clave ni PII | ✓ SATISFIED | Regresión |
| DEMO-03 | todos, 02-22 | Tests con un LLM falso | ✓ SATISFIED (⚠️ IN-29) | Las pruebas existen y pasan, pero no cubren las familias de CR-04, y por eso la brecha pasa en verde |

Requisitos huérfanos: ninguno. Los 15 IDs de la fase en REQUIREMENTS.md coinciden con la unión de los `requirements:` de los 22 planes.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `confirmacion.policy.ts`, `patterns.constants.ts`, `confirmation.constants.ts` | 98-112 / 23 / 38-89 | **CR-04**: la regla (b) toma conectores y rellenos nominales como rechazo y corta la cabeza de una pregunta | 🛑 Blocker | Es la brecha 1: síntoma de doble confirmación, regresión respecto de `10a43ad` y una brecha arrastrada (G-02-2) |
| `confirmacion.policy.ts`, `confirmation.constants.ts` | 86-96 / 106-119 | **WR-20 y WR-21**: el pretérito sin tilde y "hagas"/"confirmo" con otro objeto dan `rechaza` | 🛑 Blocker (parte de la brecha 1) | "No envié el certificado, ¿lo puedo agregar?" y "No hagas el PDF, solo el xlsx" cancelan. La misma consecuencia que CR-04 |
| `confirmation.constants.ts` | 106-119 | **WR-19**: rechazos claros dan `otro` y el servidor vuelve a preguntar | ⚠️ Warning (brecha 3, parcial) | Nunca envía sin un "sí" posterior. Choca con la prohibición 2 de 02-22. "no quiero enviarlo todavía" y "espera un momento" son regresiones |
| `src/knowledge/registro-proveedor.md` | 42 | **WR-22**: RN4 se contradice | ⚠️ Warning (brecha 2) | El modelo recibe una definición contradictoria |
| `confirmacion.policy.ts` | 86-88 | **IN-28 / T-02-71**: `slice` por negador, tiempo cuadrático | ℹ️ Info | Sigue abierto en SECURITY como bajo y no bloqueante. Depende de API-04 (Fase 3) |
| `tests/contract/instrucciones-agente.test.ts`, `tests/unit/confirmacion.policy.test.ts` | — | **IN-29 e IN-26**: fragmentos cortos y sin invariante del lado de `otro` | ℹ️ Info | Por eso CR-04 pasa en verde |
| `patterns.constants.ts` | 23 | **IN-30**: ":" corta las cláusulas ("el cliente respondió: no." da `rechaza`); "no¿" se trata distinto de "no ?" | ℹ️ Info | Se resuelve junto con la brecha 1 |
| `ejecutar-turno.service.ts`, `compuerta.policy.ts` | 57-59 / 47-48 | WR-17 (el rechazo por botón de un caso cancela todos) y WR-18 | ⚠️ Warning, abierto | Fuera de alcance por decisión de la usuaria. Amplifica CR-04 cuando hay varios casos pendientes |
| `conversacion-turno.service.ts` | — | WR-03 agravado | ⚠️ Warning, abierto | Sin cambios |

No hay marcadores TBD, FIXME, XXX, TODO, HACK ni PLACEHOLDER en los 8 archivos que modificó 02-22. `reto-01/` no tiene diferencias.

### Prohibiciones (02-22)

| Prohibición | Nivel | Disposición |
|-------------|-------|-------------|
| No ampliar lo que autoriza un envío | test | **Cumplida.** La prueba de invariante, mi sonda y el barrido de 555.900 mensajes de la auditoría lo confirman |
| No dejar un caso pendiente con la pregunta del servidor después de un mensaje que niega el envío | test | **Incumplida en parte (brecha 3).** Las formas citadas cumplen. "no quiero enviarlo todavía", "no lo confirmes" y "ni se te ocurra enviarlo" dan `otro` con la pregunta del servidor |
| No cancelar un caso pendiente porque un pedido o una pregunta solo contiene "para", "no", "luego", "mejor" o "después" | test | **Incumplida (brecha 1).** Hay un contraejemplo determinista, reproducido de punta a punta |
| No cambiar el camino del botón ni la máquina de estados | test | **Cumplida.** `git diff` vacío para `compuerta.policy.ts`, `ejecutar-turno.service.ts` y `confirmacion.type.ts` |

### Verificación humana requerida

No hay puntos que bloqueen esta verificación: el estado es `gaps_found`. Después del cierre de las brechas, conviene repetir dos cosas:

1. **D5 de 02-22:** comprobar que el modelo en vivo sigue el prompt alineado y solo dice "cancelada" cuando el servidor cancela. El SUMMARY lo dejó como `human_judgment: true` y no hubo corrida en vivo.
2. **Repetir HV2 de la UAT** con las frases de este informe.

### Resumen de brechas

El plan 02-22 cerró las dos frases que reportó la usuaria, pero no la clase de frases que describe la verdad de G-02-2. Además, agregó regresiones.

1. **Brecha 1 (bloqueante, raíz única: la regla (b) y la forma (a) de D-63.8 son demasiado amplias).**
   - **Qué pasa.** Preguntas y pedidos comunes con "para", "no", "luego", "mejor", "después" o "momento" cancelan el caso pendiente. Por ejemplo: "Luego ¿qué sigue?" (sin coma), "Para pe-andes, ¿qué falta?", "Dame primero el NIT, después el paquete" y "procesa co-industrias-delta, no pe-andes". También lo cancelan las preguntas en pretérito ("No envié el certificado, ¿lo puedo agregar?") y "No hagas el PDF".
   - **Consecuencia.** El modelo dice que el caso sigue pendiente y el "sí" siguiente queda bloqueado. Es la doble confirmación de CR-01, que la usuaria trató como bloqueante en HV2.
   - **Regresión.** Diez de esas preguntas dejaban el caso pendiente antes de 02-22.
2. **Brecha 2 (parcial).** RN4 se contradice (WR-22), y la prosa de `prompt.md:51,53` promete conductas que el servidor no cumple. Se corrige junto con la brecha 1.
3. **Brecha 3 (parcial).** Rechazos claros sin una de las doce formas exactas ("no quiero enviarlo todavía", "espera un momento" o "no lo confirmes") reciben la pregunta del servidor justo después de la negación (WR-19). Dos de ellas son regresiones.

**Seguridad.** Ninguna brecha permite un envío sin confirmación explícita, así que los criterios 1 a 5 del ROADMAP se siguen cumpliendo a la letra. Lo que falla es la promesa de D-63.6 y D-63.8 y la decisión que la usuaria tomó en la UAT.

**Pruebas.** Todas pasan (1311 pass y 0 fail) porque no cubren estas familias (IN-29). El arreglo propuesto en CR-04 (núcleos de rechazo frente a conectores, cláusula completa frente a parcial, slugs solo junto a "cancela") y los de WR-19 a WR-21 son un buen punto de partida para un plan 02-23 con `/gsd-plan-phase --gaps`. Ese plan debe incluir un invariante generado del lado de `otro`.

---

_Verificado: 2026-10-14T05:40:00Z_
_Verificador: Claude (gsd-verifier)_
