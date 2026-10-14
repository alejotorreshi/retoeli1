---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-14T01:48:03Z
status: gaps_found
score: 25/28 must-haves verified
covered_files: [".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-SUMMARY.md",".qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-T04-clasificador-confirmacion.ts","agent/prompt.md","src/application/types/puertos-agente.type.ts","src/config/constants/agent.constants.ts","src/config/constants/confirmation.constants.ts","src/config/constants/llm.constants.ts","src/config/constants/logging.constants.ts","src/config/constants/patterns.constants.ts","src/config/constants/redaction.constants.ts","src/config/constants/runtime.constants.ts","src/config/constants/supports.constants.ts","src/config/constants/text.constants.ts","src/config/constants/tools.constants.ts","src/config/env.ts","src/config/strings.ts","src/config/types/provider-capabilities.type.ts","src/domain/builders/cierre-turno.builder.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/domain/policies/redaccion.policy.ts","src/domain/policies/vigencias.policy.ts","src/domain/types/compuerta.type.ts","src/domain/types/confirmacion.type.ts","src/domain/types/json.type.ts","src/domain/types/respuesta-herramienta.type.ts","src/domain/utils/json.util.ts","src/domain/utils/normalizar.util.ts","src/domain/utils/respuesta-herramienta.util.ts","src/domain/utils/texto-plano.util.ts","src/infra/fixtures/fixtures-reader.adapter.ts","src/infra/fixtures/schemas/fixtures.schema.ts","src/infra/fs/fs.util.ts","src/infra/knowledge/rules-loader.adapter.ts","src/infra/logging/logger.adapter.ts","src/infra/types/logger.type.ts","src/knowledge/registro-proveedor.md","src/llm/adapters/openai-compatible.adapter.ts","src/llm/decorators/fallback.decorator.ts","src/llm/decorators/observation.decorator.ts","src/llm/decorators/retry.decorator.ts","src/llm/decorators/timeout.decorator.ts","src/llm/mappers/provider-error.mapper.ts","src/llm/mappers/wire-messages.mapper.ts","src/llm/types/provider.type.ts","src/llm/types/resilience.type.ts","src/loop/schemas/resultado-herramienta.schema.ts","src/loop/services/bitacora-turno.service.ts","src/loop/services/cierre-error.service.ts","src/loop/services/cierre-turno.service.ts","src/loop/services/conversacion-turno.service.ts","src/loop/services/despacho-llamada.service.ts","src/loop/services/ejecutar-turno.service.ts","src/loop/services/guardado-turno.service.ts","src/loop/services/paso-herramientas.service.ts","src/loop/services/presupuesto.service.ts","src/loop/services/registro-herramientas.service.ts","src/loop/services/respuesta-turno.service.ts","src/loop/types/agente.type.ts","src/loop/types/resultado-herramienta.type.ts","src/loop/types/turno.type.ts","src/loop/wiring/agente.wiring.ts","src/tools/factories/definir-herramienta.factory.ts","tests/architecture.test.ts","tests/contract/env-agente.test.ts","tests/contract/instrucciones-agente.test.ts","tests/helpers/agente-fetch.helper.ts","tests/helpers/agente-prueba.helper.ts","tests/helpers/eventos.helper.ts","tests/helpers/llm-falso.helper.ts","tests/helpers/pii.helper.ts","tests/helpers/types/agente-fetch.type.ts","tests/helpers/types/bitacora.type.ts","tests/live/agente-en-vivo.test.ts","tests/loop/bitacora.test.ts","tests/loop/compuerta-casos.test.ts","tests/loop/compuerta.test.ts","tests/loop/fallback.test.ts","tests/loop/pii-modelo.test.ts","tests/loop/presupuesto.test.ts","tests/loop/resiliencia.test.ts","tests/loop/sesion.test.ts","tests/loop/tope.test.ts","tests/loop/trazador-agente.test.ts","tests/unit/cierre-turno.builder.test.ts","tests/unit/compuerta.policy.test.ts","tests/unit/confirmacion.policy.test.ts","tests/unit/fallback.decorator.test.ts","tests/unit/json.util.test.ts","tests/unit/logger.adapter.test.ts","tests/unit/normalizar.util.test.ts","tests/unit/observation.decorator.test.ts","tests/unit/openai-compatible.adapter.test.ts","tests/unit/provider-error.mapper.test.ts","tests/unit/redaccion.policy.test.ts","tests/unit/respuesta-herramienta.util.test.ts","tests/unit/retry.decorator.test.ts","tests/unit/texto-plano.util.test.ts"]
covered_digest: "v3:sha256:f49c223c3839aae80d76a5c47d7157aea35bb2fbf156643ef8a3b9a43ed7cc95"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 21/22
  gaps_closed:
    - "G-02-3 (UAT T03): un caso ya enviado no se reabre con un simular_envio bloqueado, ni en el mismo turno ni en turnos posteriores; un armado nuevo abre otro ciclo (02-15, D-63.4)"
    - "G-02-18 (UAT H2), parte del clasificador: un acuse suelto o un 'si' sin tilde acompañado nunca autoriza; 'sí' con tilde, 'si' solo y los verbos de envío sí (02-16, D-63.5)"
    - "G-02-19 (UAT H3), caso de un solo issue: el mensaje de URL no segura termina con un solo punto y ningún error de arranque promete una sesión abierta (02-17)"
    - "G-02-21 (UAT H5/H1), parte textual: el prompt y el conocimiento dejan la pregunta de cierre al servidor y acotan la respuesta del turno de confirmación (02-18)"
    - "Revisión humana 2 de la verificación anterior (decisión WR-01 sobre acuses): resuelta por la usuaria en UAT H2 (endurecer) e implementada en 02-16"
  gaps_remaining: []
  regressions:
    - "Con 02-16, 'ok', 'listo', 'si por favor', 'si gracias' y 'si ec-corp-andina' pasaron a 'otro' y liberan la compuerta (D-37). Con 02-18, prompt.md:50,53 manda al modelo a pedir él mismo la confirmación. La confirmación explícita que la analista da a continuación queda bloqueada con CONFIRMACION_REQUERIDA (CR-01 de 02-REVIEW.md, reproducido por el verificador)"
gaps:
  - truth: "Después de una respuesta que no confirma ('ok', 'listo', 'si por favor'…), el agente vuelve a preguntar (D-39, UAT G-02-18 'the agent asks again', 02-18 verdad 3) y la confirmación explícita de la analista en el mensaje siguiente escribe ENVIO-SIMULADO.md una sola vez. La pregunta de confirmación la pone siempre el servidor, con needsConfirmation y los bloqueos (ENV-03, prohibición de 02-18)"
    status: failed
    reason: "abrirTurno devuelve sinAutorizacion() con siguiente LIBRE para 'otro' (compuerta.policy.ts:59) y arrastradosDe solo arrastra casos si preguntarCual es true (ejecutar-turno.service.ts:46-49). Así, el turno del 'ok' cierra con needsConfirmation=false y sin la pregunta del servidor. A la vez, agent/prompt.md:50 ('pide una confirmación explícita, como \"envía\" o \"sí\"') y :53 ('vuelve a preguntar en lugar de enviar') hacen que el modelo escriba su propia pregunta, contra prompt.md:33 y contra la prohibición de 02-18. El 'sí' siguiente encuentra la compuerta LIBRE y no autoriza nada; el simular_envio del modelo recibe CONFIRMACION_REQUERIDA, no se escribe ENVIO-SIMULADO.md y el servidor recién entonces vuelve a preguntar. Lo reproduje con el LLM falso para 'ok', 'listo', 'si por favor', 'si gracias' y 'si ec-corp-andina': T2 needsConfirmation=false, T3 'sí' da CONFIRMACION_REQUERIDA, enviados=[] y 0 líneas ok. Ningún test lo cubre, porque el describe CR-01 de tests/loop/compuerta.test.ts:201-216 guiona un simular_envio tras la frase dudosa, que es justo lo que el prompt prohíbe."
    artifacts:
      - path: "src/domain/policies/compuerta.policy.ts"
        issue: "abrirTurno (l.50-60): 'otro' cae en sinAutorizacion() y libera la compuerta en lugar de mantener el caso pendiente"
      - path: "src/loop/services/ejecutar-turno.service.ts"
        issue: "arrastradosDe (l.46-49) solo arrastra casos cuando preguntarCual es true"
      - path: "agent/prompt.md"
        issue: "l.50 y l.53 mandan al modelo a pedir la confirmación él mismo; contradice l.33 ('No escribas tú la pregunta de cierre'), registro-proveedor.md:55,63 y la prohibición de 02-18"
      - path: "tests/loop/compuerta.test.ts"
        issue: "el describe CR-01 (l.201-230) nunca ejecuta el guion que exige el prompt: 'ok' sin herramientas y luego 'sí'"
    missing:
      - "Elegir una sola semántica y aplicarla en el servidor y en el prompt. Opción A (recomendada): ante 'otro' con un caso pendiente, mantenerlo pendiente; el servidor repite su pregunta en ese turno (needsConfirmation=true, confirmation_required con bloqueos) y arrastradosDe arrastra siempre que siguiente sea PENDIENTE; 'rechaza' sigue liberando. Opción B: conservar D-37 ('otro' cancela) y cambiar prompt.md:50,53 para que el modelo diga que la confirmación quedó cancelada y que hay que volver a armar el paquete, sin pedir 'envía' o 'sí'"
      - "En cualquiera de las dos opciones, que prompt.md no le pida al modelo escribir una pregunta de confirmación (prohibición de 02-18) y registrar la decisión en 02-CONTEXT.md (D-37 frente a D-39)"
      - "Agregar una prueba de bucle con el guion del prompt: §11 turno 1, 'ok' sin herramientas, luego 'sí'. Con la opción A, el turno 2 tiene needsConfirmation=true y el turno 3 escribe ENVIO-SIMULADO.md una vez. Con la opción B, el texto del turno 2 no pide 'envía' ni 'sí'. Extender la semilla T04 con el mismo caso"
behavior_unverified_items: []
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-14T01:48:03Z
**Estado:** gaps_found
**Re-verificación:** Sí, después del cierre de las brechas de UAT (planes 02-15 a 02-18)

## Logro del objetivo

Los cuatro planes de cierre hacen lo que dicen sus verdades. Lo comprobé en el código, con pruebas nombradas y con sondas propias en el scratchpad, sin fiarme de los SUMMARY:

- **02-15 (G-02-3):** un caso enviado no se reabre.
- **02-16 (G-02-18):** reproduje las 46 filas del clasificador.
- **02-17 (G-02-19):** los literales exactos para un solo issue están fijados.
- **02-18 (G-02-21):** el cambio es solo de prompt y conocimiento, y el contrato pasa.

Las barreras pasan: `bun run check` sale con exit 0 y `bun test` da 1159 pass, 1 skip y 0 fail.

**Pero la combinación de 02-16 y 02-18 rompe el flujo de re-pregunta (CR-01).** El defecto falla del lado seguro: nada se envía sin confirmación. Aun así lo cuento como bloqueante, por tres razones:

1. Es justo el camino que fija la propia UAT. G-02-18 dice "doubt gives 'otro' and the agent asks again", y G-02-21 pide "hay que volver a preguntar". Ese camino es el del re-test de H2.
2. Si el modelo obedece el prompt, el agente pide una confirmación explícita y el servidor rechaza la que llega. La analista tiene que confirmar dos veces.
3. El turno que pide la confirmación termina con `needsConfirmation=false`, sin la pregunta del servidor y sin los bloqueos (ENV-03). Además viola la prohibición de 02-18: "MUST NOT instruct the model to write its own closing confirmation question".

La raíz es una contradicción entre dos decisiones bloqueadas. D-37 dice "cualquier otro mensaje cancela lo pendiente" y D-39 dice "si el agente no reconoce una confirmación, vuelve a preguntar". Desde que la pregunta es del servidor (02-10), las dos no conviven. Con 02-16, la contradicción pasó de ser un caso raro a darse con cualquier "ok".

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: ciclo propio, `deepseek-flash` con thinking desactivado y solo rutas y valores enmascarados hacia el modelo | ✓ VERIFIED | Regresión: suite verde (`trazador-agente`, `pii-modelo`, `inyeccion`). La lógica se reubicó por WR-10: `deps.llm.enviar` está ahora en `conversacion-turno.service.ts:77`. La parte que depende del modelo real va a la revisión humana 1 |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en el guion §11, la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez y solo para ese caso; el `confirmado: true` del modelo no basta | ✓ VERIFIED | `compuerta.test.ts` (§11, "No envíes…", "¿y si envío?") pasa. Sonda: "No envíes nada todavía" da `rechaza`. Con 02-15, "una sola vez" se cumple también ante reintentos (verdad 23). El flujo de re-pregunta va en la verdad 27 |
| 3 | **ROADMAP C3**: reintentos, respaldo, mensajes en español (402 = saldo agotado) y CA5 | ✓ VERIFIED | Regresión: `resiliencia.test.ts` y `fallback.test.ts` dentro de la suite verde |
| 4 | **ROADMAP C4**: topes de iteraciones y de tokens con respuesta clara; la inyección no cambia la conducta | ✓ VERIFIED | Regresión: `tope`, `presupuesto` e `inyeccion` en verde |
| 5 | **ROADMAP C5**: prompt y conocimiento editables en caliente; logs JSON correlacionados sin clave ni PII; `bun test` cubre el ciclo con un LLM falso | ✓ VERIFIED | Regresión: `instrucciones`, `bitacora` y `logger.adapter` en verde. El 02-18 cambió la conducta solo con texto (commit 907ca4f: `agent/prompt.md` y `registro-proveedor.md`) |
| 6–20, 22 | Verdades de los planes 02-01 a 02-14 de la verificación anterior | ✓ VERIFIED | Regresión: suite completa en verde. Los fallos de `verify.artifacts` y `verify.key-links` de 02-01, 02-02, 02-03, 02-05, 02-10, 02-11, 02-13 y 02-14 son renombres y divisiones de REVIEW-FIX, no regresiones. Comprobé cada uno: `confirmacion.constants`→`confirmation.constants` y `redaccion.constants`→`redaction.constants` (IN-18); `ARGUMENTOS_VACIOS` en `paso-herramientas.service.ts:32`; `recuperarAutorizado(` en `guardado-turno.service.ts:25` (WR-10); `preguntaConfirmacion` ya no se exporta, y las pruebas usan `cierreConPregunta` (IN-13); `createMemorySessionStore<Sesion>(` en `agente.wiring.ts:109` |
| 21 | 02-13: `bun run test:vivo` pasa contra el proveedor real con una línea VIVO PASS nueva | ? UNCERTAIN | 02-18-SUMMARY reporta `VIVO PASS modelo=deepseek-flash llamadas=12 tokens=83531`. No lo reproduje, para no gastar la clave personal. Va a la revisión humana 1 |
| 23 | **02-15 / G-02-3**: tras el envío, un reintento queda bloqueado y no reabre el caso (sin `confirmation_required` y con `needsConfirmation=false`); un "envía" posterior no reescribe nada; se cumple también en el mismo turno; queda la línea CA4 y `gate_blocked` con el caso; un armado nuevo abre otro ciclo; D-63.1 y WR-02 no cambian | ✓ VERIFIED | `compuerta.policy.ts:79-123`: `enviados` en `aplicarEvento` y `enviadosTrasEventos`; `guardado-turno.service.ts:29,48`; `sesionVacia` con `casosEnviados: []`. `bun test compuerta-casos -t "G-02-3\|D-63.4"`: 3 pass, con aserciones de una línea ok, bytes iguales, `casosEnviados=[EC]`, LIBRE y re-armado con `needsConfirmation=true`. `compuerta.policy.test.ts`: 51 pass. Artefactos 5/5 y enlaces 3/3 |
| 24 | **02-16 / G-02-18**: un acuse solo nunca confirma; "si" sin tilde confirma solo si es el mensaje entero; "sí" con tilde (también "SÍ" y la forma NFD) confirma en cualquier posición; acuse + verbo o afirmación confirma; de punta a punta, "ok", "listo" y "si todo bien" no envían y "si" y "SÍ" envían una vez | ✓ VERIFIED | Sonda propia con las 46 filas de la verdad: todas coinciden, incluidas `"sí"` NFD y `"ok"` con dos pendientes, que da `otro`. `confirmacion.policy.test.ts`: 117 pass. `compuerta.test.ts -t CR-01`: 7 pass. Artefactos 5/5 y enlaces 3/3 |
| 25 | **02-17 / G-02-19**: el texto exacto para una URL principal o de respaldo no segura tiene un solo punto final y no habla de una sesión abierta; sin clave, una sola oración; `conDetalle` cierra con un solo punto; los errores de turno conservan "La sesión sigue abierta…" | ✓ VERIFIED (⚠️ WR-01) | `env-agente.test.ts -t G-02-19`: 8 pass. Mi sonda confirma los literales con un solo issue. Con dos issues aparece ".;" (ver WR-01). El must-have "ningún mensaje contiene '..'" se cumple a la letra |
| 26 | **02-18 / G-02-21** (verdades 1, 2, 4 y 5): el prompt dice que el servidor agrega la pregunta y que el modelo no la escribe; en el turno de confirmación responde solo con el resultado; el conocimiento cubre varios casos y las tres situaciones de CONFIRMACION_REQUERIDA; cambio solo de texto | ✓ VERIFIED | `prompt.md:30,33,48,54,55`; `registro-proveedor.md:53-55,63`. `git show --stat` de 94bb874, 907ca4f y ba48244: solo tocan `agent/prompt.md`, `registro-proveedor.md`, `instrucciones-agente.test.ts` y STATE.md. `instrucciones-agente.test.ts`: 13 pass |
| 27 | **Flujo de re-pregunta** (D-39, UAT G-02-18 y G-02-21, 02-18 verdad 3 y su prohibición, ENV-03): ante un "ok" el agente vuelve a preguntar y la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez, con la pregunta y `needsConfirmation` del servidor | ✗ FAILED | Sonda con el LLM falso, en la que el modelo obedece `prompt.md:50`. T1 da `needsConfirmation=true`. T2 "ok" (también "listo", "si por favor", "si gracias", "si ec-corp-andina") da `needsConfirmation=false`, 0 `confirmation_required` y el texto del modelo "Responde envía o sí.". T3 "sí" da `CONFIRMACION_REQUERIDA`, `enviados=[]` y 0 líneas ok. Causa: `compuerta.policy.ts:59` y `ejecutar-turno.service.ts:46-49`, frente a `prompt.md:50,53`. Ver la brecha |
| 28 | **02-18 verdad 6**: después de los cuatro arreglos, `test:vivo` pasa; el último párrafo de A y de B1 es la pregunta del servidor; B2 solo confirma el envío, sin repetir el resumen | ? UNCERTAIN | `agente-en-vivo.test.ts:162,177` comprueba el último párrafo. La línea VIVO PASS y la lectura de B2 las registró el ejecutor. Va a la revisión humana 1. La corrida en vivo no ejercita "ok" y luego "sí", así que no habría detectado la verdad 27 |

**Puntaje:** 25/28 verdades verificadas: 1 fallida (27), 2 inciertas que van a revisión humana (21 y 28) y 0 presentes con comportamiento sin verificar.

### Elementos diferidos

Ninguno. Revisé la Fase 3: su criterio 3 pinta una tarjeta con Confirmar y Cancelar solo cuando el servidor emite `confirmation_required`. Tras un "ok" el servidor no lo emite, así que no hay tarjeta. Además, un botón aprobado con la compuerta LIBRE tampoco autoriza (`abrirTurno` devuelve `sinAutorizacion()` en la línea 51). La Fase 3 no cubre la brecha.

### Advisory (alcance nuevo, sin evidencia)

Ninguno. CR-01, WR-01 y WR-02 tienen evidencia determinista: la sonda propia del verificador, reproducible. CR-01 además toca `agent/prompt.md`, que cambió después de la verificación anterior (commit 907ca4f), así que cumple las dos condiciones de la compuerta de evidencia para bloquear.

### Artefactos requeridos (planes 02-15 a 02-18)

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `src/domain/policies/compuerta.policy.ts` | `enviadosTrasEventos` y un pliegue que no reabre lo enviado | ✓ VERIFIED | Conectado desde `guardado-turno.service.ts:4,48`. `abrirTurno` es la raíz de CR-01 |
| `src/domain/types/compuerta.type.ts` | `CasosEnviados` | ✓ VERIFIED | |
| `src/loop/types/turno.type.ts` | `Sesion.casosEnviados` | ✓ VERIFIED | |
| `src/loop/services/guardado-turno.service.ts` | Pasa y persiste los enviados | ✓ VERIFIED | |
| `src/domain/policies/confirmacion.policy.ts` | Gramática con `SI_CON_TILDE` y `SI_SIN_TILDE` | ✓ VERIFIED | Conectado desde `ejecutar-turno.service.ts:54` |
| `src/config/constants/confirmation.constants.ts` | `SI_CON_TILDE`, `SI_SIN_TILDE` y `AFIRMACIONES` sin "si" | ✓ VERIFIED | |
| `src/config/constants/patterns.constants.ts` | `PATRON_NO_PALABRA_UNICODE` | ✓ VERIFIED | |
| `src/config/strings.ts` | `TEXTO_AGENTE.conDetalle` con un solo punto | ✓ VERIFIED (⚠️ WR-01) | `cerrarOracion` solo mira el final del texto |
| `agent/prompt.md` | Pregunta del servidor, turno breve y acuses que no confirman | ⚠️ PARCIAL | Tiene todo el texto pedido, pero las líneas 50 y 53 contradicen la 33 y al servidor (CR-01) |
| `src/knowledge/registro-proveedor.md` | Varios casos y situaciones de CONFIRMACION_REQUERIDA | ✓ VERIFIED (⚠️ WR-02) | Las líneas 53-54 prometen "el servidor vuelve a pedir la confirmación"; se cumple solo si el modelo vuelve a armar el paquete en el mismo turno |
| Pruebas: `compuerta-casos`, `compuerta`, `confirmacion.policy`, `env-agente` e `instrucciones-agente` | Fijan las verdades | ✓ VERIFIED | Ninguna prueba cubre el guion "ok" sin herramientas y luego "sí" |

`verify.artifacts`: 02-15 5/5, 02-16 5/5, 02-17 2/2 y 02-18 3/3.

### Verificación de enlaces clave

| De | A | Vía | Estado | Detalles |
|----|---|-----|--------|----------|
| guardado-turno.service | compuerta.policy | `enviadosTrasEventos(` | WIRED | |
| cierre-turno.service | compuerta.policy | `cerrarTurno(` con `entrada.enviados` | WIRED | |
| ejecutar-turno.service | turno.type | `casosEnviados: []` | WIRED | |
| confirmacion.policy | confirmation.constants | `SI_SIN_TILDE` | WIRED | |
| confirmacion.policy | patterns.constants | `PATRON_NO_PALABRA_UNICODE` | WIRED | |
| ejecutar-turno.service | confirmacion.policy | `clasificarConfirmacion(` | WIRED | |
| agente.wiring | strings | `TEXTO_AGENTE.conDetalle(` | WIRED | |
| instructions-loader | agent/prompt.md | `ARCHIVO_PROMPT` | WIRED | |
| cierre-turno.service | agent/prompt.md | `cierreConPregunta(` | WIRED, contrato roto | El servidor pone la pregunta solo si el caso sigue PENDIENTE. Tras un "otro", el prompt manda al modelo a preguntar y el servidor no respalda esa pregunta (CR-01) |

`verify.key-links`: 02-15 3/3, 02-16 3/3, 02-17 1/1 y 02-18 2/2.

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `Sesion.casosEnviados` | Casos enviados | Eventos `ENVIADO` del despacho (`despacho-llamada.service.ts:78`) → `enviadosTrasEventos` | Sí | ✓ FLOWING |
| `needsConfirmation` tras un "otro" | Estado de la compuerta | `abrirTurno` → `estadoLibre()` | Sí, pero contradice lo que el prompt hace decir al modelo | ✗ CR-01 |
| Mensaje de arranque | `TEXTO_AGENTE.conDetalle(…, formatearIssues(...))` | Issues de zod unidos con "; " | Sí; con 2 o más issues queda ".;" | ⚠️ WR-01 |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | exit 0; Biome revisó 280 archivos; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 1159 pass, 1 skip, 0 fail, 4992 expect, 71 archivos | ✓ PASS |
| G-02-3 y D-63.4 | `bun test tests/loop/compuerta-casos.test.ts -t "G-02-3\|D-63.4"` | 3 pass, 0 fail | ✓ PASS |
| Política de la compuerta | `bun test tests/unit/compuerta.policy.test.ts` | 51 pass | ✓ PASS |
| Clasificador (tabla) | `bun test tests/unit/confirmacion.policy.test.ts` | 117 pass | ✓ PASS |
| CR-01 de punta a punta, según el guion actual | `bun test tests/loop/compuerta.test.ts -t CR-01` | 7 pass | ✓ PASS |
| Arranque G-02-19 | `bun test tests/contract/env-agente.test.ts -t G-02-19` | 8 pass | ✓ PASS |
| Contrato del prompt | `bun test tests/contract/instrucciones-agente.test.ts` | 13 pass | ✓ PASS |
| Sonda del clasificador (scratchpad) | `clasificarConfirmacion` sobre las 46 filas de las verdades de 02-16 | Todas coinciden | ✓ PASS |
| Sonda CR-01 (scratchpad) | §11 T1, luego "ok" con el modelo sin herramientas que pide "envía o sí", luego "sí" | T2 `needsConfirmation=false`; T3 `CONFIRMACION_REQUERIDA`, sin `ENVIO-SIMULADO.md`. Igual con "listo", "si por favor", "si gracias" y "si ec-corp-andina" | ✗ FAIL |
| Sonda WR-02 (scratchpad) | §11 T1, borrar el checklist y luego "envía" (el envío autorizado falla con `PAQUETE_NO_ARMADO`, sin re-armar) | T2 `needsConfirmation=false`: el caso sale de la compuerta | ⚠️ Warning |
| Sonda WR-01 (scratchpad) | `crearAgente` con las dos URLs en http, y con `LLM_PROVIDER=otro-proveedor` sin URL ni modelo | "…[::1].; LLM_FALLBACK_BASE_URL: …" y "…por defecto.; LLM_MODEL: …" | ⚠️ Warning |

Las sondas viven solo en el scratchpad. `git status` no muestra cambios fuera de `.planning/` antes de este informe.

### Ejecución de probes

No aplica: la fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Planes | Descripción (resumen) | Estado | Evidencia |
|-----------|--------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo; fixture inyectado | ✓ SATISFIED | `inyeccion.test.ts`. REQUIREMENTS.md lo sigue marcando `[ ]` y "Pending" (líneas 22 y 185): ℹ️ trazabilidad |
| ENV-02 | 02-03, 02-06, 02-10, 02-13 a 02-16, 02-18 | La compuerta la hace cumplir el servidor; una vez, ese caso y el mensaje siguiente; clasificador con negaciones | ✓ SATISFIED | Verdades 2, 23 y 24. Nada se envía sin una autorización del servidor |
| ENV-03 | 02-03, 02-06, 02-10, 02-13 a 02-16, 02-18 | Cuando una acción requiere confirmación, el turno termina con una pregunta explícita que lista los bloqueos; el servidor calcula `needsConfirmation` | ✗ BLOCKED (parcial) | En el flujo de la verdad 27, el turno en que el agente pide la confirmación cierra con `needsConfirmation=false`, una pregunta escrita por el modelo y sin bloqueos |
| AGT-01 | 02-01, 02-07 | Ciclo propio y tope de 25 | ✓ SATISFIED | Verdades 1 y 4 |
| AGT-02 | 02-01, 02-02, 02-09, 02-18 | Prompt y conocimiento separados y editables | ✓ SATISFIED | Verdades 5 y 26 |
| AGT-03 | 02-09, 02-18 | El prompt prohíbe afirmar sin herramienta | ✓ SATISFIED (conducta → revisión humana 1) | `prompt.md:13-17,57` |
| AGT-04 | 02-02, 02-06, 02-08, 02-11 a 02-13, 02-15 | Sesiones; historial íntegro; CA5 | ✓ SATISFIED | Verdad 23 y regresión |
| AGT-05 | 02-04, 02-08, 02-17 | Errores en español desde un catálogo | ✓ SATISFIED | Verdad 25 (⚠️ WR-01) |
| LLM-01 | 02-01, 02-02, 02-09 | Puerto propio y adaptador genérico | ✓ SATISFIED | Regresión |
| LLM-02 | 02-01, 02-04, 02-09, 02-17 | fetch directo, preset DeepSeek y thinking desactivado | ✓ SATISFIED | Regresión y verdad 25 |
| LLM-03 | 02-04, 02-08 | Timeout, backoff y 402 | ✓ SATISFIED | Regresión |
| LLM-04 | 02-01, 02-04, 02-08, 02-09 | Respaldo | ✓ SATISFIED | Regresión |
| LLM-05 | 02-07 | Topes configurables | ✓ SATISFIED | Regresión (WR-03 y R1-WR-04 siguen abiertos) |
| SEG-03 | 02-05, 02-08, 02-15 | Logs JSON sin clave ni PII | ✓ SATISFIED | `gate_blocked` con el caso (verdad 23) y regresión |
| DEMO-03 | todos | Tests con un LLM falso | ✓ SATISFIED, con hueco | Falta la prueba del guion que exige el prompt ("ok" sin herramientas y luego "sí"). Por eso CR-01 pasó con la suite en verde |

Requisitos huérfanos: ninguno. Los 15 IDs de la fase en REQUIREMENTS.md coinciden con la unión de los `requirements:` de los 18 planes.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `agent/prompt.md` / `src/domain/policies/compuerta.policy.ts` / `src/loop/services/ejecutar-turno.service.ts` | 50, 53 / 59 / 46-49 | CR-01: el prompt manda a re-preguntar y el servidor ya liberó la compuerta | 🛑 Blocker | Reproducido. La confirmación explícita que pidió el agente se rechaza y la analista tiene que confirmar dos veces. Falla del lado seguro, pero rompe el contrato de G-02-18 y G-02-21 y la prohibición de 02-18 |
| `src/config/strings.ts`, `src/domain/utils/formatear-issues.util.ts` | 331-338 / 4-12 | WR-01: con dos o más issues, el mensaje de arranque lleva ".;" | ⚠️ Warning | Reproducido. G-02-19 queda cerrado para el caso que se probó en UAT (un issue), pero el defecto de puntuación vuelve con varios issues, por ejemplo con un proveedor propio sin URL ni modelo. No afecta el objetivo |
| `src/loop/services/despacho-llamada.service.ts`, `src/domain/policies/compuerta.policy.ts` | 78 / 62-65, 125-135 | WR-02: un envío autorizado que falla saca el caso de la compuerta | ⚠️ Warning | Reproducido con `PAQUETE_NO_ARMADO`. Es anterior a esta ronda (R2-IN-01), pero ahora `registro-proveedor.md:53-54` lo presenta como garantía. Se cumple si el modelo vuelve a armar el paquete en el mismo turno; si el turno termina antes (tope o error), el caso desaparece. Con `PAQUETE_DESACTUALIZADO` y un cierre por error o tope, contradice D-63.2. Nunca envía sin confirmación |
| `src/domain/policies/confirmacion.policy.ts` | 53-55 | IN-01: "si ec-corp-andina" da `otro` y "si" a secas confirma | ℹ️ Info | Sigue la letra de D-63.5. Junto con CR-01, cada uno de estos casos cancela lo pendiente |
| `.qa/evidence/.../02-T04-clasificador-confirmacion.ts` | 5, 14-20, 38 | IN-04: literales en vez de constantes; importa `./qa-comun.ts`, que no existe en su carpeta | ℹ️ Info | Fuera de `src/`, sin efecto en el producto |
| `.planning/REQUIREMENTS.md` | 22, 185 | SOLI-03 sigue "Pending" | ℹ️ Info | Trazabilidad |
| (abiertos de rondas anteriores) | — | WR-03 (sesión agotada que pide confirmación), R1-WR-01, R1-WR-04, WR-05 y WR-06 | ⚠️ Warning | Sin cambios; no bloquean el objetivo (ver la verificación anterior) |

No hay marcadores TBD, FIXME, XXX, TODO, HACK ni PLACEHOLDER en los 97 archivos de `src/`, `agent/`, `tests/` y `.qa/` que cambiaron desde 41111d7, y no hay comentarios en `src/`. `reto-01/` no tiene diferencias.

**¿Bloquea CR-01 el objetivo de la fase?** Lo juzgué contra el objetivo y contra lo que estos planes dicen cerrar:
- *"Compuerta de confirmación que el servidor hace cumplir"*: la mitad de seguridad se cumple, porque nunca hay envío sin autorización. La otra mitad (ENV-03: el turno que pide confirmación termina con la pregunta del servidor, con los bloqueos y con `needsConfirmation`) no se cumple en este flujo.
- *G-02-18*: la UAT lo cerró con "doubt gives 'otro' and the agent asks again". El clasificador cumple la primera parte. La segunda, que el agente vuelva a preguntar y eso funcione, falla. Es lo primero que hará el re-test de H2.
- *G-02-21*: el plan prometía alinear el prompt con el servidor. Corrigió la pregunta de cierre normal, pero abrió una desalineación nueva (las líneas 50 y 53 contra la 33 y contra la compuerta).

Por eso la brecha es bloqueante, aunque el arreglo es chico. Hay dos opciones en la sección de brechas, y una de ellas (B) toca solo el prompt.

### Prohibiciones

| Prohibición | Plan | Nivel | Disposición |
|-------------|------|-------|-------------|
| No escribir un segundo `ENVIO-SIMULADO.md` de un caso ya enviado sin un armado nuevo y una confirmación | 02-15 | test | Cumplida: `compuerta-casos -t "G-02-3\|D-63.4"` |
| No ocultar el registro de un intento bloqueado de un caso ya enviado | 02-15 | test | Cumplida: línea CA4 y `gate_blocked` con el caso |
| No autorizar con acuses solos ni con un "si" sin tilde acompañado | 02-16 | test | Cumplida: sonda de 46 filas y 117 pruebas unitarias |
| No decir que hay una sesión abierta en errores de arranque; no repetir la clave | 02-17 | test | Cumplida: `env-agente -t G-02-19` |
| No indicarle al modelo que escriba su propia pregunta de confirmación, ni tratar un acuse como confirmación | 02-18 | test | **Incumplida en su primera mitad.** `prompt.md:50` ("pide una confirmación explícita, como 'envía' o 'sí'") y `:53` ("vuelve a preguntar") hacen que el modelo escriba una pregunta de confirmación. La segunda mitad sí se cumple. El contrato de `instrucciones-agente.test.ts` fija la redacción retirada de la pregunta de cierre, pero no estas líneas. Forma parte de la brecha |
| No imprimir la clave, no nombrar `.env` en un comando y no guardar la salida de la corrida en vivo en el repo | 02-18 | judgment | **unverified-prohibition: se recomienda revisión humana.** Veredicto no autoritativo: `git status` no muestra salida de la corrida en el repo, y 02-18-SUMMARY no contiene la clave |
| No presentar valores como llenos, enviados o firmados sin una herramienta | 02-09 | judgment | **unverified-prohibition: se recomienda revisión humana** (revisión humana 1) |

### Verificación humana requerida

Además de la brecha, quedan dos puntos para una persona. No cambian el estado, que ya es `gaps_found`.

1. **Lectura CA2 de la corrida en vivo posterior a los cuatro arreglos (verdades 21 y 28).**
   - **Prueba:** lee las respuestas de `bun run test:vivo` registradas en 02-18-SUMMARY.md (VIVO PASS con 12 llamadas y 83531 tokens), o vuelve a correrlo con la clave en `.env`.
   - **Esperado:**
     - A y B1 terminan con la pregunta del servidor, sin una segunda pregunta del modelo.
     - B2 informa solo el envío simulado de ec-corp-andina, sin repetir el resumen.
     - Ningún valor sin máscara, y ninguna afirmación de lleno, enviado o firmado sin un resultado `ok`.
   - **Por qué humana:** es una prohibición de nivel judgment, y la línea VIVO PASS y la lectura las registró el ejecutor (un LLM). Conviene repetir la corrida después de arreglar CR-01 y agregar el turno "ok" y luego "sí".
2. **Decisión de producto para CR-01.**
   - **Prueba:** elige entre la opción A (un "otro" mantiene el caso pendiente y el servidor repite su pregunta) y la opción B (un "otro" cancela, como dice D-37, y el prompt deja de pedir "envía o sí").
   - **Esperado:** la decisión queda en 02-CONTEXT.md y resuelve la tensión entre D-37 y D-39.
   - **Por qué humana:** toca dos decisiones bloqueadas con reversibilidad "costly".

### Resumen de brechas

Hay una sola brecha bloqueante, y su raíz es el contrato entre el prompt y la compuerta. El 02-16 endureció bien el clasificador, así que ahora muchos mensajes naturales ("ok", "listo", "si por favor", "si gracias", "si ec-corp-andina") dan `otro`, y por D-37 liberan la compuerta. El 02-18 le dijo al modelo que, en ese caso, pida él mismo una confirmación explícita. El servidor no respalda esa pregunta: el turno cierra sin `needsConfirmation`, sin la pregunta del servidor y sin los bloqueos, y el "sí" siguiente se bloquea con `CONFIRMACION_REQUERIDA`. La suite no lo detecta, porque sus guiones nunca siguen el camino que el prompt prescribe.

El resto del cierre de brechas se cumple:
- G-02-3: un caso enviado no se reabre.
- G-02-18: la tabla del clasificador se cumple.
- G-02-19: un solo punto final con un issue.
- G-02-21: pregunta de cierre del servidor y turno de confirmación breve.

No hay regresiones en lo verificado antes, y las barreras pasan. Quedan dos advertencias: WR-01, puntuación con varios issues, y WR-02, un envío autorizado que falla saca el caso de la compuerta pese a lo que promete el conocimiento. Conviene corregirlas en el mismo plan de cierre, porque las dos son de pocas líneas.

---

_Verificado: 2026-10-14T01:48:03Z_
_Verificador: Claude (gsd-verifier)_
