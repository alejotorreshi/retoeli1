---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-14T19:40:58Z
status: human_needed
score: 56/56 must-haves verified
covered_files: [".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-22-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-23-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-23-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-24-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-24-SUMMARY.md","agent/prompt.md","src/config/constants/confirmation.constants.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/knowledge/registro-proveedor.md","src/loop/services/ejecutar-turno.service.ts","tests/contract/instrucciones-agente.test.ts","tests/unit/confirmacion.policy.test.ts"]
covered_digest: "v3:sha256:22d77947af7ea0ed94499f7a9f1cbb937d2534e745fec082a8c283addf297e7a"
behavior_unverified: 0
overrides_applied: 2
overrides:
  - must_have: "Verdad 31: solo un rechazo explícito saca el caso de la compuerta; un pedido que nombra un caso no cancela"
    reason: "La usuaria acepta la regla de primera palabra (D-63.11, 2026-10-14, 'cortar el ciclo' tras 02-22, 02-23 y 02-24). Tras una respuesta de espera, un pedido que nombra el caso pendiente solo lo deja pendiente si empieza con una palabra de VERBOS_DE_PEDIDO; con un relleno, un conector, un modal o un enclítico delante, cancela. Es el lado seguro: nunca envía, y el 'sí' siguiente queda bloqueado con CONFIRMACION_REQUERIDA. Está fijado en FILAS_D6311, el riesgo aceptado es AR-02-06 (T-02-83), la limitación conocida se lleva a SOLUCION.md en la Fase 4 y el botón (D-39) llega en la Fase 3."
    accepted_by: "elianatorres5772"
    accepted_at: "2026-10-14T19:37:31Z"
  - must_have: "Verdad 41: agent/prompt.md y src/knowledge/registro-proveedor.md describen el mismo rechazo que aplica el servidor"
    reason: "Los dos archivos quedaron acotados a D-63.11. prompt.md:54 ya no promete que un pedido deja el paquete pendiente, describe la regla de primera palabra y le pide al modelo no afirmar el estado de la compuerta en ese pedido. RN4 dice 'de otro caso', como el prompt (WR-27), y describe la misma regla. instrucciones-agente.test.ts fija cada oración y clasifica cada cita con uno y con dos pendientes. La prosa da la regla con ejemplos (consulta, procesa, revisa) y no con la lista cerrada VERBOS_DE_PEDIDO; esa diferencia es la limitación aceptada en D-63.11."
    accepted_by: "elianatorres5772"
    accepted_at: "2026-10-14T19:37:31Z"
re_verification:
  previous_status: gaps_found
  previous_score: 54/56
  gaps_closed:
    - "Verdad 31 (CR-06 = T-02-83): cerrada por override. La usuaria aceptó la regla de primera palabra (D-63.11). El clasificador no cambió (git diff 9207112..HEAD vacío en src/domain, src/config y reto-01), y FILAS_D6311 fija la conducta aceptada con 16 filas en verde"
    - "Verdad 41 (WR-27): cerrada por override, con evidencia propia. prompt.md:54 ya no promete pendiente para un pedido de consulta: condiciona la re-pregunta ('Si el paquete sigue pendiente…'), describe la regla de primera palabra y pide no afirmar el estado. RN4 dice 'de otro caso' y agrega RN4c. Las 7 oraciones fijadas, cada cita clasificada con uno y con dos pendientes, y RETIRADOS_D6311 ausentes del prompt y del conocimiento"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "D5 en vivo: con DEEPSEEK_API_KEY real, correr el guion §11 hasta el paquete pendiente de ec-corp-andina y enviar, en turnos separados, 'No, consulta el NIT de ec-corp-andina', 'No, por favor consulta el NIT de ec-corp-andina' y 'No envíes nada todavía, ¿qué falta?'"
    expected: "En ninguno de los pedidos el modelo afirma 'sigue pendiente' ni 'quedó cancelada' (prompt.md:54). Con el primero el servidor agrega su pregunta al final; con el segundo no hay pregunta y el 'sí' siguiente queda bloqueado; con el tercero el modelo dice en una frase que la confirmación quedó cancelada y responde qué falta"
    why_human: "Es conducta del modelo en vivo. Ninguna prueba determinista la afirma: el LLM falso devuelve textos fijos. 02-24-SUMMARY lo declara como entregable con human_judgment: true (D5)"
  - test: "Repetir HV2 de la UAT con las frases de CR-04, CR-05 y CR-06, y aceptar o reabrir la conducta declarada: 'no, envía ec-corp-andina' da rechaza; 'no confirmo porque el NIT está mal' da rechaza y 'no confirmo el NIT porque está mal' da otro; 'No, el de ec-corp-andina' cancela; 'No, procesa ec-corp-andina' deja el caso pendiente; y, por D-63.11, 'No, por favor consulta el NIT de ec-corp-andina' cancela"
    expected: "La analista acepta cada conducta como está, o la reabre. HV2 sigue en 'issue' en 02-UAT.md desde la ronda 02-19, y 02-22, 02-23 y 02-24 lo dejan para después de la re-verificación"
    why_human: "Es una decisión de aceptación de la usuaria sobre conducta declarada, no un hecho que se pueda comprobar con grep o con una prueba. Comprobé que cada frase da la decisión declarada (sonda propia), pero la aceptación sigue pendiente"
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-14T19:40:58Z
**Estado:** human_needed
**Re-verificación:** Sí. Viene después de la tarea rápida 261014-jz4 (commits `230beb0`, `d241352` y `7b5ed7d`), en la que la usuaria aceptó la regla de primera palabra (D-63.11, AR-02-06).

## Logro del objetivo

Comprobé cada afirmación de la tarea rápida en el código, con las pruebas nombradas y con sondas propias en el scratchpad. No me fié del SUMMARY.

- **(a) El clasificador no cambió.**
  - `git diff --quiet 9207112 HEAD -- src/domain src/config reto-01` sale con exit 0.
  - `git diff --name-only 9207112 HEAD -- src reto-01` lista solo `src/knowledge/registro-proveedor.md`.
  - El último commit que toca `confirmacion.policy.ts` y `confirmation.constants.ts` sigue siendo `2017eec` (02-24).
  - El árbol de trabajo no tiene cambios en `src/`, `agent/` ni `tests/`.
  - Los cuatro commits nuevos van con la identidad `elianatorres5772 <elianatorres5772@gmail.com>`.
- **(b) La prosa describe lo que hace el servidor.**
  - En `prompt.md:54` ya no está la oración "Ese paquete sigue pendiente y el servidor vuelve a agregar su pregunta…". Ahora la re-pregunta está condicionada ("Si el paquete sigue pendiente, el servidor vuelve a agregar su pregunta al final de tu respuesta"). Se agregó SCASO, que describe la regla de primera palabra, y la instrucción "En ese pedido no digas si el paquete sigue pendiente ni si la confirmación quedó cancelada".
  - RN4 dice "junto al nombre de otro caso" (WR-27) y agrega RN4c con la misma regla.
  - `instrucciones-agente.test.ts` lee los archivos reales (`readFile` sobre `RUTA_PROMPT` y `RUTA_CONOCIMIENTO`, no copias). Fija las 7 oraciones palabra por palabra y clasifica cada cita de rechazo y de pedido con uno y con dos pendientes. Además comprueba que ninguna frase de `RETIRADOS_D6311` siga en el prompt ni en el conocimiento: `-t "D-63.11"` da 39 pass y 0 fail.
- **(c) `FILAS_D6311` fija la conducta aceptada.** Las 16 filas del plan están en ese orden, entran en `TABLAS` (así el diferencial las ve como declaradas) y su describe da 16 pass y 0 fail.
- **(d) Barreras.**
  - `bun test`, corrido una sola vez: 1551 pass, 1 skip, 0 fail (1552 pruebas en 72 archivos, 6822 expect).
  - `bun run check`: exit 0. tsc, Biome sobre 282 archivos y `bun audit` sin vulnerabilidades.
- **(e) Regresión.** Las verdades 1–30, 32–40 y 42–56 siguen en verde dentro de la suite completa. El código del bucle, de la compuerta, del adaptador LLM y del clasificador es idéntico al de la verificación anterior. El cableado sigue igual: `agente.wiring.ts` importa `instructions-loader.adapter.ts`, que carga `ARCHIVO_PROMPT` y `ARCHIVO_CONOCIMIENTO_PROCESO`, y `ejecutar-turno.service.ts:55` llama a `clasificarConfirmacion` con los pendientes.

**Sondas propias (clasificador de HEAD, con uno y con dos pendientes):**

- Cada cita de `prompt.md:54` y de RN4 da en el servidor la decisión que la prosa le asigna.
  - "No, por favor consulta…", "Todavía no, pero dame…" y "No, quiero…" dan `rechaza`.
  - "No, consulta el NIT de ec-corp-andina" da `otro`.
  - "consulta el NIT para tenerlo a mano", "dame el NIT, no el RUC", "procesa co-industrias-delta, no pe-andes" y "No, el de pe-andes" dan `otro`.
- **Dirección peligrosa: la prosa dice "pendiente" y el servidor cancela.** Probé 224 combinaciones: 7 respuestas de espera × 8 pedidos con el verbo en primera posición, con y sin mayúscula, con y sin punto, con uno y con dos pendientes. Ninguna da algo distinto de `otro`. Los verbos que nombra la prosa (consulta, procesa, revisa) están en `VERBOS_DE_PEDIDO`.
- **Dirección segura: la prosa dice "cancela".** "Espera, por favor consulta…", "No, el de ec-corp-andina" y "No, calcula el NIT de ec-corp-andina" dan `rechaza`, como dice "con otra palabra delante, o sin un verbo de pedido, cancela". Un verbo fuera de la lista ("calcula") cancela. Es la diferencia entre los ejemplos de la prosa y la lista cerrada, que el override de la verdad 41 acepta de forma explícita.
- **Lo que autoriza un envío no cambió.** "sí", "envía", "confirmo", "dale" y "ok, envíalo" dan `confirma` con un pendiente y `falta_caso` con dos. "sí, envía ec-corp-andina" da `confirma` con dos.

**Conclusión:** las dos brechas de la verificación anterior quedan cerradas por los overrides que aceptó la usuaria, y la evidencia del código respalda cada uno. El clasificador está intacto y fijado. La prosa ya no promete al modelo algo que el servidor no hace, y cada cita está comprobada contra el servidor. No encontré regresiones. Los criterios 1 a 5 del ROADMAP se cumplen. El estado es `human_needed` y no `passed` porque quedan dos puntos humanos declarados desde 02-22: D5 en vivo y la repetición de HV2. La sección "Verificación humana requerida" explica por qué no los puedo dar por cerrados.

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: ciclo propio, `deepseek-flash` con thinking desactivado y solo rutas y valores enmascarados hacia el modelo | ✓ VERIFIED | Regresión: la suite completa sigue en verde. La tarea rápida no toca `llm/` ni `loop/` |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en §11 la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez y solo para ese caso; `confirmado: true` del modelo no basta | ✓ VERIFIED | `compuerta.test.ts` en verde, y la sonda da `rechaza` para "No envíes nada todavía" y "No envíes nada todavía, ¿qué falta?" |
| 3 | **ROADMAP C3**: reintentos, respaldo, mensajes en español (402) y CA5 | ✓ VERIFIED | Regresión en verde; sin cambios en `llm/` |
| 4 | **ROADMAP C4**: topes con respuesta clara; la inyección no cambia la conducta | ✓ VERIFIED | Regresión en verde (WR-03 sigue abierto como advertencia) |
| 5 | **ROADMAP C5**: prompt y conocimiento editables; logs JSON correlacionados sin clave ni PII; `bun test` cubre el ciclo con un LLM falso | ✓ VERIFIED | La tarea rápida volvió a cambiar la conducta del modelo solo con texto (`prompt.md`, `registro-proveedor.md`). La suite está en verde |
| 6–20, 22 | Verdades de los planes 02-01 a 02-14 | ✓ VERIFIED | Regresión: la suite completa sigue en verde |
| 21, 28, 35 | Corrida en vivo y su lectura humana (HV1) | ✓ VERIFIED | Aceptadas en la UAT (prueba 1) |
| 23–27, 29, 32–34 | Verdades de 02-15 a 02-21 | ✓ VERIFIED | `compuerta`, `compuerta-casos` y `compuerta.policy` en verde |
| 30 | **02-19 V4**: un pedido ajeno no secuestra la confirmación | ✓ VERIFIED | `compuerta-casos.test.ts` en verde |
| 31 | **02-19 V10, prohibición 4 y G-02-2 (lado CR-04)**: solo un rechazo explícito saca el caso de la compuerta; un pedido que nombra un caso no cancela | ✓ PASSED (override) | Override: la usuaria aceptó la regla de primera palabra (D-63.11), aceptado por elianatorres5772 el 2026-10-14T19:37:31Z. Evidencia propia: el clasificador no cambió, `FILAS_D6311` da 16 pass y la regla está declarada en D-63.11 (02-CONTEXT.md, ítem 11). La frase retirada "ningún pedido que nombra un caso cancela" aparece una sola vez, citada como retirada. Va al lado seguro: nunca envía |
| 36 | **02-22 V1**: "…para tenerlo a mano" deja el caso pendiente y el "sí" envía una vez | ✓ VERIFIED | Fila del `test.each` de mantener pendiente en verde |
| 37 | **02-22 V2**: "No envíes nada todavía, ¿qué falta?" cancela sin pregunta | ✓ VERIFIED | Fila del `test.each` de cancelación en verde; la sonda da `rechaza` |
| 38 | **02-22 V3**: `otro` para las preguntas y los pedidos con conectores; `rechaza` para una negación que rige el envío y para una cláusula de espera | ✓ VERIFIED (con la advertencia WR-26) | Sin cambios desde la verificación anterior |
| 39 | **02-22 V4**: toda fila previa del clasificador conserva su resultado | ✓ VERIFIED | El diff de la tarea rápida en `confirmacion.policy.test.ts` solo agrega `FILAS_D6311`, su describe y la entrada en `TABLAS`. No toca filas existentes, `CANCELAN_POR_CASO_PENDIENTE` ni los generadores |
| 40 | **02-22 V5**: el conjunto de frases que confirman no cambia | ✓ VERIFIED | El clasificador no cambió, y mi sonda da los mismos `confirma` |
| 41 | **02-22 V6 = 02-23 V8 = 02-24 V8**: el prompt y el conocimiento describen el mismo rechazo que aplica el servidor | ✓ PASSED (override) | Override: los dos archivos quedaron acotados a D-63.11, aceptado por elianatorres5772 el 2026-10-14T19:37:31Z. Evidencia propia: lo fijado en el contrato (39 pass) y mi sonda de 224 combinaciones sin ninguna discrepancia en la dirección "pendiente". Lo que queda es que los ejemplos de la prosa no recorren la lista cerrada de verbos, y eso es lo que el override acepta |
| 42 | **02-22 V7**: D-63.8 registrado | ✓ VERIFIED | Sin cambios |
| 43–49 | **02-23 V1 a V7** | ✓ VERIFIED | Las filas D-63.9 siguen en verde dentro de la suite completa |
| 50–53 | **02-24 V1 a V4** (CR-05 de punta a punta, mantener pendiente, dos pendientes y `FILAS_D6310`) | ✓ VERIFIED | Regresión en verde; ni el bucle ni el clasificador cambiaron |
| 54 | **02-24 V5**: clases generadas | ✓ VERIFIED (tal como está escrita) | En verde. La tarea rápida no toca los generadores (es una decisión de la usuaria) |
| 55 | **02-24 V6**: diferencial en cuatro direcciones contra `10a43ad` | ✓ VERIFIED | En verde. Ahora `TABLAS` incluye `FILAS_D6311`, así que la cuarta dirección ve declarada "No, ahora consulta el NIT de co-industrias-delta" con un solo pendiente |
| 56 | **02-24 V7**: tiempo lineal de punta a punta | ✓ VERIFIED | Sin cambios en el clasificador; `-t WR-25` sigue en verde en la suite |

**Verdades propias de la tarea rápida 261014-jz4 (sumadas al control):**

| Verdad del plan | Estado | Evidencia |
|---|---|---|
| El clasificador no cambia | ✓ VERIFIED | `git diff --quiet 9207112 HEAD -- src/domain src/config reto-01` sale con exit 0, y solo cambia `src/knowledge/registro-proveedor.md` |
| `FILAS_D6311` fija la conducta actual | ✓ VERIFIED | 16 pass, y mi sonda reproduce cada fila |
| D-63.11 registrada y frase retirada citada una sola vez | ✓ VERIFIED | `02-CONTEXT.md:72`, ítem `  11.`; `grep -c` da 1 |
| prompt.md:54 acotado y neutral | ✓ VERIFIED | El diff y el describe "el prompt no afirma el estado de la compuerta…" (2 pass) |
| RN4 dice "de otro caso" y describe la misma regla | ✓ VERIFIED | El diff, más "conocimiento RN4b" y "conocimiento RN4c" fijados y clasificados |
| Registros: overrides, AR-02-06, ledger | ✓ VERIFIED | SECURITY: T-02-83 en `accept` con AR-02-06, T-02-84 y T-02-85 en `mitigate`, `threats_open: 0`. Ledger: CR-06 en `skipped`, WR-27 en `fixed`, `open: 34` |
| `bun test` y `bun run check` pasan | ✓ VERIFIED | Corridos una vez cada uno por mí (ver Comprobaciones) |

**Puntaje:** 56 de 56 verdades verificadas: 54 VERIFIED y 2 PASSED (override), las verdades 31 y 41. No hay verdades con comportamiento sin verificar. Las verdades de la tarea rápida se comprueban arriba y no cambian el denominador de la fase.

### Elementos diferidos

Ninguno como brecha. La Fase 3 trae el botón estructurado (D-39), que no pasa por el clasificador de texto. La Fase 4 lleva la limitación AR-02-06 a SOLUCION.md. Ninguna de las dos es una brecha de esta fase, porque los overrides la cubren.

### Advisory (alcance nuevo, sin evidencia)

Ninguno. Esta ronda no levantó hallazgos nuevos.

### Artefactos requeridos (tarea rápida 261014-jz4 y regresión de 02-24)

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `tests/unit/confirmacion.policy.test.ts` | `FILAS_D6311`, su describe y `...FILAS_D6311` en `TABLAS` | ✓ VERIFIED | Líneas 351-368, 446-450 y 482 |
| `agent/prompt.md` | Línea 54 acotada, con SCASO y la instrucción de neutralidad | ✓ VERIFIED | Coincide palabra por palabra con TX-P54 |
| `src/knowledge/registro-proveedor.md` | RN4 con "de otro caso" y RN4c | ✓ VERIFIED | Línea 42 |
| `tests/contract/instrucciones-agente.test.ts` | 7 oraciones, rechazos con uno y dos pendientes, `RETIRADOS_D6311` | ✓ VERIFIED | 39 pass con `-t D-63.11` |
| `02-CONTEXT.md` | D-63.11 | ✓ VERIFIED | Línea 72 |
| `src/domain/policies/confirmacion.policy.ts`, `src/config/constants/confirmation.constants.ts` | Sin cambios | ✓ VERIFIED | `git diff` vacío contra `9207112` |
| Artefactos de 02-24 | Constantes, patrón, política y pruebas de bucle | ✓ VERIFIED (regresión) | Idénticos a la verificación anterior |

### Verificación de enlaces clave

| De | A | Vía | Estado |
|----|---|-----|--------|
| `instrucciones-agente.test.ts` | `confirmacion.policy.ts` | `clasificarConfirmacion` sobre cada cita de SCASO, RN4b y RN4c con `PENDIENTE_EC` y `DOS_PENDIENTES` | WIRED |
| `confirmacion.policy.test.ts` | `TABLAS` | `...FILAS_D6311` | WIRED |
| `instrucciones-agente.test.ts` | `agent/prompt.md`, `registro-proveedor.md` | `readFile(RUTA_PROMPT)` y `readFile(RUTA_CONOCIMIENTO)` | WIRED |
| `agente.wiring.ts` | `instructions-loader.adapter.ts` | import en la línea 21; el adaptador carga `ARCHIVO_PROMPT` y `ARCHIVO_CONOCIMIENTO_PROCESO` | WIRED |
| `ejecutar-turno.service.ts` | `confirmacion.policy.ts` | `clasificarConfirmacion(entrada.mensaje, casosPendientes(compuerta))` en la línea 55 | WIRED |

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `needsConfirmation` y `confirmation_required` después de un pedido que nombra el caso pendiente | Estado de la compuerta | mensaje → `clasificarConfirmacion` → `abrirTurno` → `pendientesDe` → `cerrarTurno` | Sí. Con la familia CR-06 la decisión es `rechaza`, que ahora es la conducta declarada (D-63.11) | ✓ FLOWING |
| Texto del prompt y del conocimiento que recibe el modelo | Instrucciones de sistema | `agent/prompt.md` y `src/knowledge/**` → `instructions-loader.adapter.ts` → `agente.wiring.ts` | Sí, archivos editables leídos en el arranque | ✓ FLOWING |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | exit 0; 282 archivos; 0 vulnerabilidades (220 paquetes) | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 1551 pass, 1 skip, 0 fail, 72 archivos, 6822 expect | ✓ PASS |
| `FILAS_D6311` | `bun test tests/unit/confirmacion.policy.test.ts -t "D-63.11"` | 16 pass, 0 fail | ✓ PASS |
| Contrato D-63.11 (SCASO, RN4b, RN4c, retiradas y neutralidad) | `bun test tests/contract/instrucciones-agente.test.ts -t "D-63.11"` | 39 pass, 0 fail | ✓ PASS |
| Clasificador intacto | `git diff --quiet 9207112 HEAD -- src/domain src/config reto-01` | exit 0 | ✓ PASS |
| Citas de la prosa contra el servidor (scratchpad, `probe.ts`) | 26 frases con uno y con dos pendientes | Todas dan la decisión que la prosa les asigna | ✓ PASS |
| Dirección "pendiente" de la regla (scratchpad, `probe2.ts`) | 224 pedidos con el verbo primero que nombran el caso pendiente | 0 discrepancias (todos `otro`) | ✓ PASS |
| Conducta declarada para HV2 (scratchpad, `probe3.ts`) | "no, envía ec-corp-andina", el orden del motivo, "No, el de …" y "No, consulta …" con dos pendientes | Todas dan la decisión declarada en 02-24-SUMMARY | ✓ PASS |

### Ejecución de probes

No aplica. La fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Planes | Descripción (resumen) | Estado | Evidencia |
|-----------|--------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo | ✓ SATISFIED | `inyeccion.test.ts` en verde |
| ENV-02 | 02-03…02-24, 261014-jz4 | El servidor hace cumplir la compuerta; el clasificador entiende negaciones | ✓ SATISFIED | Nunca autoriza sin una confirmación explícita. La precisión en la dirección de los pedidos sigue la regla aceptada en D-63.11 (AR-02-06) |
| ENV-03 | 02-03…02-24, 261014-jz4 | El turno termina con la pregunta; el servidor calcula `needsConfirmation` | ✓ SATISFIED | Después de "No, por favor consulta el NIT de ec-corp-andina", el `needsConfirmation=false` es ahora la conducta declarada: el paquete se cancela por D-63.11. El prompt ya no le pide al modelo afirmar lo contrario |
| AGT-01 | 02-01, 02-07 | Ciclo propio y tope | ✓ SATISFIED | Regresión |
| AGT-02 | 02-01…02-24, 261014-jz4 | Prompt y conocimiento separados y editables | ✓ SATISFIED | Editables y coherentes con el servidor (verdad 41 por override, con evidencia) |
| AGT-03 | 02-09…02-21 | No afirmar sin herramienta | ✓ SATISFIED | HV1 |
| AGT-04 | 02-02…02-20 | Sesiones e historial íntegro | ✓ SATISFIED | `historialSano` en verde |
| AGT-05 | 02-04…02-20 | Errores en español | ✓ SATISFIED | Regresión |
| LLM-01 a LLM-04 | 02-01…02-20 | Puerto, adaptador, resiliencia y respaldo | ✓ SATISFIED | Regresión |
| LLM-05 | 02-07 | Topes configurables | ✓ SATISFIED (⚠️ WR-03) | Sin cambios |
| SEG-03 | 02-05…02-21 | Logs sin clave ni PII | ✓ SATISFIED | Regresión |
| DEMO-03 | todos | Tests con un LLM falso | ✓ SATISFIED | Existen y pasan. `FILAS_D6311` fija la conducta aceptada |

Requisitos huérfanos: ninguno. Los 15 IDs que REQUIREMENTS.md asigna a la fase coinciden con la unión de los `requirements:` de los 24 planes. Nota de trazabilidad (ℹ️): la tabla de REQUIREMENTS.md marca SOLI-03 como "Pending" y los otros 14 como "Gaps Found". Ninguno de los dos estados refleja este informe. La actualiza el orquestador.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `confirmacion.policy.ts`, `confirmation.constants.ts` | 256-262 / 204-223 | **CR-06 (= T-02-83)**: la exención solo mira el primer token | ℹ️ Info (aceptado, AR-02-06) | Override de la verdad 31. Va al lado seguro y está fijado en `FILAS_D6311` |
| `agent/prompt.md`, `registro-proveedor.md` | 54 / 42 | La prosa da la regla con ejemplos ("consulta, procesa o revisa") y no con la lista cerrada; "No, calcula el NIT de ec-corp-andina" cancela | ℹ️ Info (aceptado en el override de la verdad 41) | El prompt pide no afirmar el estado en ese pedido, así que el modelo no contradice al servidor |
| `tests/helpers/corpus-confirmacion.helper.ts`, `tests/unit/confirmacion.policy.test.ts` | 50-54, 248 / diferencial | El corpus de pedidos empieza siempre con el verbo; no hay dirección contra `6c2dba3` | ⚠️ Warning | Fuera de alcance por decisión de la usuaria (D-63.11). Las formas aceptadas quedan fijadas por fila |
| `confirmacion.policy.ts`, `patterns.constants.ts` | 256-259 / 25-26 | **WR-26**: una palabra con guion ("e-mail") cuenta como caso no pendiente y exime la espera | ⚠️ Warning | Sin cambios; ya pasaba en 02-23 |
| `confirmacion.policy.ts` | — | IN-34, IN-35, IN-36, WR-23 (resto), WR-24, IN-31, IN-32, IN-33, WR-17, WR-18 y WR-03 | ⚠️/ℹ️ abiertos | Declarados en D-63.10 o fuera de alcance por decisión de la usuaria (ledger: `open: 34`) |

No hay marcadores TBD, FIXME, XXX, TODO, HACK ni PLACEHOLDER en los cuatro archivos que modificó la tarea rápida. `reto-01/` no tiene diferencias.

### Prohibiciones

| Prohibición | Nivel | Disposición |
|-------------|-------|-------------|
| No ampliar lo que autoriza un envío (02-24) | test | **Cumplida.** El clasificador no cambió, y la sonda da los mismos `confirma` |
| No cambiar la decisión esperada de una fila previa (02-24) | test | **Cumplida.** El diff solo agrega `FILAS_D6311` |
| No cancelar un caso pendiente con un pedido que nombra un caso (02-19 y 02-24, prohibición 4) | test | **Cumplida por override** (verdad 31, D-63.11). Su forma acotada, la de un pedido encabezado por una palabra de `VERBOS_DE_PEDIDO`, se cumple a la letra: 224 combinaciones, todas `otro` |
| No cambiar `compuerta.policy.ts`, `ejecutar-turno.service.ts`, `src/domain/types/` ni `strings.ts` | test | **Cumplida.** El `git diff` contra `9207112` sale vacío |
| No modificar el clasificador en una tarea de documentación y pruebas (T-02-85) | test | **Cumplida.** El `git diff` está vacío en `src/domain` y `src/config` |
| No modificar `reto-01/` | test | **Cumplida** |

### Verificación humana requerida

Todas las comprobaciones automáticas pasan. Quedan dos puntos que el propio ciclo 02-22…02-24 dejó para después de la re-verificación. 02-24-SUMMARY declara el primero como entregable con `human_judgment: true`, y en 02-UAT.md HV2 sigue en `issue`. Por la regla de estados, con puntos humanos abiertos el estado no puede ser `passed`. Si la usuaria los da por cerrados o los acepta como varianza del modelo (AR-02-01), la fase queda aprobada sin más cambios de código.

1. **D5 en vivo (conducta del modelo frente a D-63.11)**
   - **Prueba:** con la clave real, corre el guion §11 hasta que ec-corp-andina quede pendiente. Después envía, en turnos separados, "No, consulta el NIT de ec-corp-andina", "No, por favor consulta el NIT de ec-corp-andina" y "No envíes nada todavía, ¿qué falta?".
   - **Esperado:**
     - En los dos primeros, el modelo no dice "sigue pendiente" ni "quedó cancelada".
     - Con el primero, el servidor agrega su pregunta al final y el "sí" siguiente envía una vez.
     - Con el segundo, no hay pregunta y el "sí" siguiente queda bloqueado.
     - Con el tercero, el modelo dice en una frase que la confirmación quedó cancelada y responde qué falta.
   - **Por qué es humano:** es la obediencia del modelo en vivo a `prompt.md:54`. El LLM falso de las pruebas devuelve textos fijos, así que ninguna prueba determinista la mide.
2. **Repetir HV2 de la UAT**
   - **Prueba:** repite las frases de CR-04, CR-05 y CR-06, y acepta o reabre la conducta declarada:
     - "no, envía ec-corp-andina" da `rechaza`;
     - "no confirmo porque el NIT está mal" da `rechaza`, y "no confirmo el NIT porque está mal" da `otro`;
     - "No, el de ec-corp-andina" cancela;
     - "No, procesa ec-corp-andina" deja el caso pendiente;
     - "No, por favor consulta el NIT de ec-corp-andina" cancela (D-63.11).
   - **Esperado:** la analista acepta cada conducta o la reabre.
   - **Por qué es humano:** es una decisión de aceptación de la usuaria. Comprobé con la sonda que cada frase da la decisión declarada, pero aceptarla le toca a ella.

### Resumen de brechas

No quedan brechas.

- La regresión CR-06 (verdad 31) y la incoherencia entre el prompt y el servidor (verdad 41) se cierran con los overrides que aceptó la usuaria el 2026-10-14 (D-63.11, AR-02-06).
- La evidencia del código respalda cada override. El clasificador no cambió, la conducta aceptada está fijada en 16 filas, y `prompt.md:54` y RN4 ya no prometen "pendiente" donde el servidor cancela: se comprobó con el contrato y con 224 combinaciones propias.
- Todo lo verificado en el informe anterior se mantiene. La suite da 1551 pass, `bun run check` está limpio y no hay regresiones.

**Seguridad.** Ningún camino envía sin una confirmación explícita posterior. CR-06 va al lado seguro y quedó registrado como riesgo aceptado AR-02-06.

**Lo que falta.** Para cerrar la fase faltan solo los dos puntos humanos: D5 en vivo y la repetición de HV2.

---

_Verificado: 2026-10-14T19:40:58Z_
_Verificador: Claude (gsd-verifier)_
