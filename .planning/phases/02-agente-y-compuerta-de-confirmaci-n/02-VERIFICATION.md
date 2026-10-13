---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-13T22:45:00Z
status: human_needed
score: 21/22 must-haves verified
covered_files: [".env.example",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md","agent/prompt.md","docs/estructura.md","package.json","src/application/types/puertos-agente.type.ts","src/config/constants/agent.constants.ts","src/config/constants/confirmacion.constants.ts","src/config/constants/files.constants.ts","src/config/constants/llm.constants.ts","src/config/constants/logging.constants.ts","src/config/constants/patterns.constants.ts","src/config/constants/redaccion.constants.ts","src/config/constants/tools.constants.ts","src/config/env.ts","src/config/strings.ts","src/domain/builders/cierre-turno.builder.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/domain/policies/redaccion.policy.ts","src/domain/types/cierre-turno.type.ts","src/domain/types/compuerta.type.ts","src/domain/types/confirmacion.type.ts","src/domain/utils/texto-plano.util.ts","src/infra/clock/clock.adapter.ts","src/infra/clock/sleep.util.ts","src/infra/knowledge/instructions-loader.adapter.ts","src/infra/logging/logger.adapter.ts","src/infra/sessions/memory-session-store.adapter.ts","src/infra/types/logger.type.ts","src/infra/types/session-store.type.ts","src/knowledge/registro-proveedor.md","src/llm/adapters/openai-compatible.adapter.ts","src/llm/decorators/fallback.decorator.ts","src/llm/decorators/observacion.decorator.ts","src/llm/decorators/retry.decorator.ts","src/llm/decorators/timeout.decorator.ts","src/llm/mappers/provider-error.mapper.ts","src/llm/mappers/wire-messages.mapper.ts","src/llm/schemas/chat-completion.schema.ts","src/llm/types/llm.type.ts","src/llm/types/provider.type.ts","src/llm/types/resiliencia.type.ts","src/loop/schemas/resultado-herramienta.schema.ts","src/loop/services/bitacora-turno.service.ts","src/loop/services/cierre-turno.service.ts","src/loop/services/despacho-llamada.service.ts","src/loop/services/ejecutar-turno.service.ts","src/loop/services/presupuesto.service.ts","src/loop/services/registro-herramientas.service.ts","src/loop/services/respuesta-turno.service.ts","src/loop/services/tope-iteraciones.service.ts","src/loop/types/agente.type.ts","src/loop/types/evento.type.ts","src/loop/types/turno.type.ts","src/loop/wiring/agente.wiring.ts","src/tools/wiring/entorno.wiring.ts","tests/architecture.test.ts","tests/contract/env-agente.test.ts","tests/contract/instrucciones-agente.test.ts","tests/e2e/pii.test.ts","tests/fixtures/casos/zz-inyeccion/plantilla-campos.json","tests/fixtures/casos/zz-inyeccion/solicitud.json","tests/fixtures/casos/zz-inyeccion/soportes-exigidos.json","tests/fixtures/llm/completion-texto.json","tests/fixtures/llm/completion-tool-calls.json","tests/helpers/adaptador-guion.helper.ts","tests/helpers/agente-fetch.helper.ts","tests/helpers/agente-prueba.helper.ts","tests/helpers/bitacora.helper.ts","tests/helpers/eventos.helper.ts","tests/helpers/fetch-falso.helper.ts","tests/helpers/historial.helper.ts","tests/helpers/llm-falso.helper.ts","tests/helpers/pii.helper.ts","tests/helpers/types/adaptador-guion.type.ts","tests/helpers/types/agente-fetch.type.ts","tests/helpers/types/agente-prueba.type.ts","tests/helpers/types/bitacora.type.ts","tests/helpers/types/eventos.type.ts","tests/helpers/types/fetch-falso.type.ts","tests/helpers/types/llm-falso.type.ts","tests/helpers/types/pii.type.ts","tests/live/agente-en-vivo.test.ts","tests/loop/bitacora.test.ts","tests/loop/compuerta-casos.test.ts","tests/loop/compuerta.test.ts","tests/loop/fallback.test.ts","tests/loop/instrucciones.test.ts","tests/loop/inyeccion.test.ts","tests/loop/pii-modelo.test.ts","tests/loop/presupuesto.test.ts","tests/loop/resiliencia.test.ts","tests/loop/sesion.test.ts","tests/loop/tope.test.ts","tests/loop/trazador-agente.test.ts","tests/unit/cierre-turno.builder.test.ts","tests/unit/clock.adapter.test.ts","tests/unit/compuerta.policy.test.ts","tests/unit/confirmacion.policy.test.ts","tests/unit/fallback.decorator.test.ts","tests/unit/logger.adapter.test.ts","tests/unit/memory-session-store.adapter.test.ts","tests/unit/observacion.decorator.test.ts","tests/unit/openai-compatible.adapter.test.ts","tests/unit/provider-error.mapper.test.ts","tests/unit/redaccion.policy.test.ts","tests/unit/retry.decorator.test.ts","tests/unit/sleep.util.test.ts","tests/unit/texto-plano.util.test.ts","tests/unit/timeout.decorator.test.ts","tests/unit/wire-messages.mapper.test.ts"]
covered_digest: "v3:sha256:aa3417a1f6f8257a18c61694cf9975fefd791e76646d5170531d39098c7238ee"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 12/16
  gaps_closed:
    - "ROADMAP criterio 2 / ENV-02: solo una confirmación explícita del mensaje inmediatamente siguiente autoriza el envío (clasificador conservador: ante la duda, otro). CR-01, cerrado por 02-14"
    - "ROADMAP criterio 2 / ENV-03 / ENV-02: con un caso pendiente, el turno termina con la pregunta del servidor que lista los bloqueos, y la confirmación siguiente responde a ESA pregunta. CR-02, cerrado por 02-10"
    - "AGT-04 / CA5: el historial queda íntegro y cada pedido posterior de la sesión es válido, también después de un paso cortado por finish_reason=length. CR-03, cerrado por 02-11"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Revisión CA2 de las respuestas en vivo (prohibición de nivel judgment de 02-09 y human-check diferido de 02-13). Lee las tres respuestas de `bun run test:vivo`, ya sea de la corrida de 02-13 o de una nueva con la clave en .env"
    expected: "co-industrias-delta: texto plano construido solo con resultados de herramientas, cuyo último párrafo es la pregunta LISTO del servidor. §11 turno 1: caso y out/ec-corp-andina/, 13 llenos, 1 faltante, 1 por confirmar, 'Número de contribuyente especial', RUC por confirmar con su nota, 'Certificado de cumplimiento tributario' y BLOQUEADO; sin segunda pregunta del modelo, y como último párrafo la pregunta del servidor con el bloqueo legible. Turno 2: envío simulado solo de ec-corp-andina, sin correo real ni firma. Ningún valor sin máscara, y ninguna afirmación de lleno, enviado o firmado sin un resultado ok de una herramienta. En particular, el modelo nunca dice que registró un envío si no llamó a proveedor_simular_envio (riesgo WR-04)"
    why_human: "Es una prohibición de nivel judgment. La lectura que registró 02-13-SUMMARY.md la hizo el ejecutor, que es un LLM, así que ese veredicto no es autoritativo. Además, la línea 'VIVO PASS modelo=deepseek-flash llamadas=12 tokens=79292' la reportó el ejecutor, y el verificador no la reprodujo para no gastar la clave personal"
  - test: "Decisión de producto sobre WR-01: ¿un acuse suelto ('ok', 'listo', 'vale', 'claro', 'correcto', 'ok ok') o 'si todo bien', en respuesta a '¿Confirmas el envío simulado de <caso>?', cuenta como confirmación explícita?"
    expected: "Una de dos. (a) Se acepta tal como está implementado (tabla D-39 que conserva 02-14) y el riesgo queda documentado en SOLUCION.md. (b) Se endurece la gramática para exigir una afirmación fuerte o un verbo de envío; mover 'ok', 'vale', 'listo' y 'claro, ok' a OTRO en tests/unit/confirmacion.policy.test.ts es un cambio de pocas líneas"
    why_human: "El código hace exactamente lo que fija el plan 02-14 ('ok' sigue confirmando). Que un acuse suelto sea una confirmación explícita es una decisión de producto sobre el valor central (ninguna acción externa sin confirmación humana explícita), no un defecto que se pueda resolver con grep o con tests"
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-13T22:45:00Z
**Estado:** human_needed
**Re-verificación:** Sí, después del cierre de gaps (planes 02-10 a 02-14)

## Logro del objetivo

Los tres gaps de la verificación anterior (CR-01, CR-02 y CR-03) quedaron cerrados en el código. Los comprobé con pruebas nombradas y con mis propias sondas, no con lo que dicen los SUMMARY:

- **CR-01:** "y el envío", "el envío", "envío", "entonces el envío", "todo bien con el envío", "ok, gracias", "listo, gracias" y "vale, el paquete" dan ahora `otro`. "No envíes nada todavía" y "todavía no" dan `rechaza`.
- **CR-02:** cuando hay un caso pendiente, `cierreConPregunta` deja siempre `preguntaConfirmacion(pendientes)` como último párrafo, y la pregunta propia del modelo ya no la reemplaza. Lo cubren los tests de ciclo (a), (a-control) y (b).
- **CR-03:** un paso cortado se guarda con `ARGUMENTOS_VACIOS` y conserva `id` y `nombre`. Además, `toWireToolCall` nunca envía argumentos que no sean un objeto JSON. El test usa una cadena realmente truncada y pasa por el adaptador real.

También quedaron resueltas las advertencias WR-02 y WR-03 de la ronda anterior: un turno de confirmación que falla devuelve el caso a pendiente, y el candado de sesión ahora es un lease con ficha.

Ninguna verdad obligatoria falla. El estado es `human_needed` por dos razones. La prohibición CA2 es de nivel judgment y la única lectura de las respuestas en vivo la hizo el ejecutor, que es un LLM. Y WR-01 es una decisión de producto que toca el valor central.

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: "procesa el caso co-industrias-delta" ejecuta las herramientas en secuencia por el ciclo propio, sin framework de agentes; `deepseek-flash` desde env/preset con thinking desactivado; el modelo solo recibe rutas y valores enmascarados | ✓ VERIFIED | `ejecutar-turno.service.ts:279-307` (bucle `for` propio, `deps.llm.enviar`); `package.json` sin langchain, ai-sdk, openai ni mastra; `llm.constants.ts:89,93` (`deepseek-flash`, `MODO_THINKING.DESHABILITADO`); `trazador-agente.test.ts`, `pii-modelo.test.ts` e `inyeccion.test.ts` pasan. La parte de la verdad que depende del modelo real ("responde solo con resultados de herramientas") se deriva a la revisión humana 1 |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en el §11 el turno termina con una pregunta que lista los bloqueos, y solo la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md`, una vez y para ese caso; el `confirmado: true` del modelo nunca basta | ✓ VERIFIED | Sonda: "No envíes nada todavía" da `rechaza`, y las 8 frases de CR-01 dan `otro`. `compuerta.test.ts` (§11, "No envíes…", "¿y si envío?", la describe CR-01 y las 4 pruebas CR-02) pasa (6/6 con `-t "CR-0"`). `despacho-llamada.service.ts` arma `{caso, confirmado: true}` en el servidor. Los acuses sueltos siguen confirmando por decisión del plan 02-14 (ver WR-01 y la revisión humana 2) |
| 3 | **ROADMAP C3**: ante timeout, 429/503 o error de red hay reintentos con backoff o respaldo; si aun así falla, mensaje claro en español (402 = "Saldo agotado"); el siguiente mensaje funciona con el historial íntegro (CA5) | ✓ VERIFIED | `agente.wiring.ts:65,86` (`withRetry(withObservacion(withTimeout(...)))` y `withFallback`). `resiliencia.test.ts` (503, 402, timeout y deadline) y `fallback.test.ts` pasan dentro de la suite completa |
| 4 | **ROADMAP C4**: al llegar al tope de iteraciones o de tokens, respuesta clara con lo hecho y lo que falta; una instrucción inyectada en el correo no cambia la conducta | ✓ VERIFIED | `tope-iteraciones.service.ts`, `presupuesto.service.ts`, `tope.test.ts`, `presupuesto.test.ts` e `inyeccion.test.ts` pasan. Con la sesión ya agotada, el texto pide abrir otra sesión y a la vez confirmar el envío (WR-03). Es incoherente, pero no envía nada y no rompe el criterio |
| 5 | **ROADMAP C5**: editar `registro-proveedor.md` o `agent/prompt.md` cambia la conducta sin tocar el servidor; logs JSON con IDs, sin clave ni PII; `bun test` cubre el ciclo con un LLM falso | ✓ VERIFIED | `instrucciones.test.ts`, `bitacora.test.ts` y `logger.adapter.test.ts`. Corrida única de la suite: 1079 pass, 1 skip (el test en vivo), 0 fail |
| 6 | 02-01: puerto neutral `enviar(mensajes, herramientas)` y adaptador genérico compatible con OpenAI con el cuerpo esperado | ✓ VERIFIED | Regresión: `verify.artifacts` 9/9 y `verify.key-links` 4/4; los tests pasan |
| 7 | 02-02: `crearAgente` como composition root; store con TTL, LRU y candado; un id desconocido recibe un id nuevo del servidor | ✓ VERIFIED | `agente.wiring.ts:109` (`createMemorySessionStore<Sesion>(`). La herramienta vuelve a dar el mismo falso negativo por el genérico; `sesion.test.ts` pasa |
| 8 | 02-03 (D-39): clasificador determinista y conservador; ante la duda, `otro`, que nunca autoriza | ✓ VERIFIED | `confirmacion.policy.ts:38-81`, con tres niveles (afirmación fuerte, acuse solo y relleno nunca suficiente). La sonda reproduce todas las filas de CR-01 como `otro` y las negaciones como `rechaza`. `confirmacion.policy.test.ts` pasa 86/86. Advertencias WR-01 e IN-04 |
| 9 | 02-03/02-06: máquina de estados de un solo paso; la autorización vale para un caso, una vez y solo en el turno inmediato; `falta_caso`; revocación al re-armar | ✓ VERIFIED | `compuerta.policy.ts:40-59`; `compuerta-casos.test.ts` |
| 10 | 02-06: el servidor arma los args del envío; ni el `confirmado` del modelo ni el texto inyectado autorizan; el bloqueo deja una línea CA4 | ✓ VERIFIED | Regresión: `compuerta.test.ts` e `inyeccion.test.ts` pasan |
| 11 | ENV-03, D-44: con un caso pendiente, el cierre lleva la pregunta determinista del servidor, que nombra el caso y lista los bloqueos legibles | ✓ VERIFIED | `cierre-turno.service.ts:30` llama a `cierreConPregunta(limpiarMarkdown(texto), pendientes)`, y `cierre-turno.builder.ts:48-53` la agrega siempre como último párrafo. `necesitaPreguntaDeterminista` se retiró. Los tests CR-02 (a) y (b) comprueban el reply PRD 6.4 y el evento de texto |
| 12 | 02-04: taxonomía de errores por estado HTTP; solo se reintentan los transitorios; el respaldo nunca actúa ante errores no recuperables | ✓ VERIFIED | Regresión: `verify` 5/5 y 2/2; los tests pasan |
| 13 | 02-05/02-08: un solo `redactar()`; logs con pino sin transport y con correlación, sin clave ni PII | ✓ VERIFIED | Regresión: `verify` 3/3 y 2/2; los tests pasan |
| 14 | 02-07: el presupuesto cuenta todas las llamadas; al tope, resumen sin herramientas o cierre determinista; un paquete armado conserva su pregunta | ✓ VERIFIED | Regresión: `verify` 4/4 y 3/3; `tope.test.ts` y `presupuesto.test.ts` pasan |
| 15 | 02-08 (AGT-04): ningún pedido posterior lleva una tool call sin resultado ni argumentos inválidos; el paso abortado se descarta; `finish_reason=length` no ejecuta herramientas | ✓ VERIFIED | `ejecutar-turno.service.ts:200-210` (`pasoTruncado` con `ARGUMENTOS_VACIOS` que conserva `id` y `nombre`); `wire-messages.mapper.ts:28-44` (`esObjetoJson`). `resiliencia.test.ts` con `-t "CR-03\|ARGUMENTOS_VACIOS"` da 3/3 pass; el test se arma con `TRUNCADO` literal y un control `JSON.parse(...).toThrow()` |
| 16 | 02-09: el modelo no recibe valores sensibles del maestro ni el cuerpo de la solicitud en los 4 casos | ✓ VERIFIED | Regresión: `pii-modelo.test.ts` y `tests/e2e/pii.test.ts` pasan |
| 17 | 02-10: la pregunta del modelo se quita antes de agregar la del servidor; el recorte corta solo en fin de oración o descarta la línea entera, sin dejar fragmentos | ✓ VERIFIED | `cierre-turno.builder.ts:22-46`; sonda: "Armé el paquete de ec-corp-andina. Falta el certificado (¿lo tienes?)…" conserva "Armé el paquete de ec-corp-andina.". Cumple la semántica que el plan define. Advertencia WR-02: la regla descarta líneas enteras que solo contienen un `¿…?`, incluidas viñetas por confirmar cuando quedan al final |
| 18 | 02-11: el mapeador nunca envía argumentos que no sean un objeto JSON; los objetos válidos salen byte a byte | ✓ VERIFIED | `wire-messages.mapper.ts:37-44`; `tests/unit/wire-messages.mapper.test.ts` (nuevo); test de ciclo con `MALFORMADO` y `finish_reason tool_calls` |
| 19 | 02-12: el candado es un lease (`deadline + MARGEN_CANDADO_SESION_MS`) con ficha; un titular vencido no libera ni pisa la sesión; un lease vigente no se barre ni se desaloja | ✓ VERIFIED | `memory-session-store.adapter.ts:5-76` (`isHeld`, `ocupar` devuelve un token, `liberar` y `guardar` comparan el token); `ejecutar-turno.service.ts:439,469`. `sesion.test.ts` con `-t "plazo\|vencido\|consumidor"` da 4/4 pass |
| 20 | 02-13: un turno de confirmación cortado por error, falta de instrucciones o tope devuelve el caso a pendiente y cierra con la pregunta del servidor; nunca se recupera la autorización; FINAL y ABORTADO no recuperan nada | ✓ VERIFIED | `compuerta.policy.ts:93-103` y `ejecutar-turno.service.ts:318-330`. `compuerta-casos.test.ts` con `-t "WR-02\|control"` da 5/5 pass, y la tabla de 10 filas de `compuerta.policy.test.ts` también pasa. Advertencias WR-03 y WR-04 |
| 21 | 02-13: después de los arreglos, `bun run test:vivo` vuelve a pasar contra el proveedor real con una línea VIVO PASS nueva, y el último párrafo de cada respuesta pendiente es la pregunta del servidor | ? UNCERTAIN | `tests/live/agente-en-vivo.test.ts:166,181` comprueba `ultimoParrafo(reply) === preguntaConfirmacion(...)`. La línea `VIVO PASS modelo=deepseek-flash llamadas=12 tokens=79292` la reportó el ejecutor; el verificador no la reprodujo para no gastar la clave personal. Va a la revisión humana 1 |
| 22 | 02-14: la pregunta del servidor y el clasificador coinciden; cada ejemplo citado en `TEXTO_CONFIRMACION` se clasifica como `confirma`; la pregunta conserva los bloqueos, "con esos bloqueos" y "envía <caso>" en un solo párrafo | ✓ VERIFIED | `strings.ts:210-234` (`EJEMPLOS_CONFIRMACION`, ya sin "cualquier otra cosa"); describe de alineación en `confirmacion.policy.test.ts` |

**Puntaje:** 21/22 verdades verificadas (0 presentes con comportamiento sin verificar; 1 incierta que va a revisión humana)

### Elementos diferidos

Ninguno. Ninguna advertencia abierta aparece de forma específica en los criterios de las fases 3 o 4, salvo la tarjeta de confirmación de la Fase 3, que no cambia el clasificador de texto libre.

### Advisory (alcance nuevo, sin evidencia)

Ninguno. Los hallazgos nuevos de la revisión (WR-01 a WR-04) tienen evidencia reproducible: sonda propia para WR-01 y WR-02, y tests que fijan el comportamiento para WR-03 y WR-04. Por eso se clasifican como ⚠️ Warning en la tabla de antipatrones y no como advisory. No los cuento como bloqueantes porque ninguno hace caer una verdad obligatoria (ver el análisis abajo).

### Artefactos requeridos

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `src/domain/policies/confirmacion.policy.ts` | Clasificador conservador | ✓ VERIFIED | Gramática de tres niveles, conectada desde `ejecutar-turno.service.ts:108` |
| `src/config/constants/confirmacion.constants.ts` | `ACUSES`, `VERBOS_ENVIO` solo imperativos, `FINES_DE_ORACION` | ✓ VERIFIED | "envio" queda solo en `RELLENO` |
| `src/domain/builders/cierre-turno.builder.ts` | `cierreConPregunta` y `preguntaConfirmacion` | ✓ VERIFIED (WR-02) | |
| `src/loop/services/cierre-turno.service.ts` | El cierre siempre termina con la pregunta del servidor | ✓ VERIFIED | |
| `src/domain/policies/compuerta.policy.ts` | Transiciones y `recuperarAutorizado` | ✓ VERIFIED | `necesitaPreguntaDeterminista` se retiró a propósito (02-10). El `verify.artifacts` de 02-03 la reporta como faltante: es un artefacto reemplazado, no una regresión |
| `src/loop/services/ejecutar-turno.service.ts` | `pasoTruncado` saneado, lease, recuperación | ✓ VERIFIED | |
| `src/llm/mappers/wire-messages.mapper.ts` | Guarda de argumentos | ✓ VERIFIED | |
| `src/infra/sessions/memory-session-store.adapter.ts` | Lease con ficha | ✓ VERIFIED | |
| `src/config/strings.ts` | `EJEMPLOS_CONFIRMACION` y `TEXTO_CONFIRMACION` alineados | ✓ VERIFIED | |
| `tests/unit/wire-messages.mapper.test.ts` | Test espejo del mapeador | ✓ VERIFIED | Nuevo |
| `tests/live/agente-en-vivo.test.ts` | Aserción del último párrafo | ✓ VERIFIED | Omitido por defecto (`LLM_EN_VIVO`) |

`verify.artifacts`: 02-10 6/6, 02-11 5/5, 02-12 5/5, 02-13 3/3 y 02-14 5/5. De los planes 01 a 09, todos pasan salvo el falso negativo de 02-03 explicado arriba.

### Verificación de enlaces clave

| De | A | Vía | Estado | Detalles |
|----|---|-----|--------|----------|
| cierre-turno.service | cierre-turno.builder | `cierreConPregunta(` | WIRED | |
| cierre-turno.builder | strings | `TEXTO_CONFIRMACION.` | WIRED | |
| ejecutar-turno | llm.constants | `ARGUMENTOS_VACIOS` | WIRED | |
| wire-messages.mapper | llm.constants | `ARGUMENTOS_VACIOS` | WIRED | |
| ejecutar-turno | puertos-agente | `ocupar(…, deadlineMs + MARGEN_CANDADO_SESION_MS)`, `guardar(sesion, candado)`, `liberar(id, candado)` | WIRED | |
| memory-session-store | puertos-agente | `AlmacenSesiones` | WIRED | |
| ejecutar-turno | compuerta.policy | `recuperarAutorizado(` | WIRED | |
| confirmacion.policy | confirmacion.constants | `ACUSES` | WIRED | |
| confirmacion.policy.test | strings | `EJEMPLOS_CONFIRMACION` | WIRED | |
| agente.wiring | memory-session-store | `createMemorySessionStore<Sesion>(` | WIRED | Falso negativo de la herramienta por el genérico; comprobado en la línea 109 |

`verify.key-links`: los 11 enlaces de 02-10 a 02-14 dan WIRED.

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| Pedido `/chat/completions` | `tool_calls[].function.arguments` | `respuesta.llamadas`, saneado en `pasoTruncado` y en `toWireToolCall` | Sí, siempre un objeto JSON | ✓ FLOWING |
| Reply del turno | Último párrafo | `preguntaConfirmacion(pendientes)`, derivada de `armar_paquete` real mediante `conocidos` | Sí | ✓ FLOWING |
| `confirmation_required` | `bloqueos` | `paqueteArmado` | Sí | ✓ FLOWING |
| Reply del turno | Texto del modelo sobre la pregunta | Modelo → `limpiarMarkdown` → `sinPreguntaFinal` | Sí, pero el recorte puede descartar viñetas al final (WR-02) | ⚠️ WR-02 |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | exit 0; Biome revisó 268 archivos; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 1079 pass, 1 skip, 0 fail, 4779 expect | ✓ PASS |
| CR-01 y CR-02 en el ciclo | `bun test tests/loop/compuerta.test.ts -t "CR-0"` | 6 pass, 0 fail | ✓ PASS |
| CR-03 y guarda del mapeador | `bun test tests/loop/resiliencia.test.ts -t "CR-03\|ARGUMENTOS_VACIOS"` | 3 pass, 0 fail | ✓ PASS |
| Recuperación WR-02 y controles | `bun test tests/loop/compuerta-casos.test.ts -t "WR-02\|control"` | 5 pass, 0 fail | ✓ PASS |
| Lease del candado | `bun test tests/loop/sesion.test.ts -t "plazo\|vencido\|consumidor"` | 4 pass, 0 fail | ✓ PASS |
| Tabla del clasificador | `bun test tests/unit/confirmacion.policy.test.ts` | 86 pass, 0 fail | ✓ PASS |
| Sonda CR-01 (scratchpad) | `clasificarConfirmacion(frase, ["ec-corp-andina"])` | Las 8 frases del gap dan `otro`; "No envíes nada todavía" da `rechaza`; "envía" y "sí" dan `confirma` | ✓ PASS |
| Sonda WR-01 (scratchpad) | Mismo comando con acuses | "ok", "listo", "claro", "correcto", "vale", "ok ok", "si todo bien" y "si, todo bien con el paquete" dan `confirma` | ⚠️ Warning (decisión humana) |
| Sonda WR-02 (scratchpad) | `cierreConPregunta(texto, pendiente)` | Con viñetas `requiere_confirmacion (¿…?)` al final, solo queda la línea de encabezado. Con el formato de `agent/prompt.md` (Por confirmar → Soportes → Estado), la viñeta "RUC: ¿el cliente acepta…?" se conserva | ⚠️ Warning |

Las sondas viven solo en el scratchpad. `git status` no muestra cambios fuera de `.planning/`.

### Ejecución de probes

No aplica: la fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Plan | Descripción (resumen) | Estado | Evidencia |
|-----------|------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo; fixture inyectado | ✓ SATISFIED | `inyeccion.test.ts`; `prompt.md:16`. REQUIREMENTS.md lo sigue marcando `[ ]` y "Pending" (líneas 22 y 185): inconsistencia de documentación (ℹ️) |
| ENV-02 | 02-03, 02-06, 02-10, 02-13, 02-14 | Compuerta del servidor, clasificador con negaciones, una vez, mensaje siguiente | ✓ SATISFIED | Verdades 2, 8, 9, 10 y 22. WR-01 queda como decisión humana |
| ENV-03 | 02-03, 02-06, 02-10, 02-13, 02-14 | Pregunta explícita que lista los bloqueos; `needsConfirmation` del servidor | ✓ SATISFIED | Verdades 11 y 17 |
| AGT-01 | 02-01, 02-07 | Ciclo propio, secuencial, tope 25 | ✓ SATISFIED | Verdades 1 y 14 |
| AGT-02 | 02-01, 02-02, 02-09 | Prompt y conocimiento separados y editables | ✓ SATISFIED | Verdad 5 |
| AGT-03 | 02-09 | El prompt prohíbe afirmar valores que no salieron de una herramienta | ✓ SATISFIED (conducta → revisión humana 1) | `prompt.md:13-17,54` |
| AGT-04 | 02-02, 02-06, 02-08, 02-11, 02-12, 02-13 | Store con TTL; historial íntegro; CA5 | ✓ SATISFIED | Verdades 15, 19 y 20 |
| AGT-05 | 02-04, 02-08 | Errores en español desde un catálogo | ✓ SATISFIED | `MENSAJE_AGENTE` |
| LLM-01 | 02-01, 02-02, 02-09 | Puerto propio y adaptador genérico | ✓ SATISFIED | Verdad 6 |
| LLM-02 | 02-01, 02-04, 02-09 | fetch directo, preset DeepSeek, thinking desactivado | ✓ SATISFIED | Verdad 1 |
| LLM-03 | 02-04, 02-08 | Timeout, backoff con jitter, 402 = saldo agotado | ✓ SATISFIED | Verdad 12 |
| LLM-04 | 02-01, 02-04, 02-08, 02-09 | Respaldo después de agotar los reintentos | ✓ SATISFIED | `fallback.test.ts` |
| LLM-05 | 02-07 | Topes configurables con mensaje claro | ✓ SATISFIED | Verdad 14 (WR-03 y R1-WR-04 quedan como advertencias) |
| SEG-03 | 02-05, 02-08 | Logs JSON correlacionados sin clave ni PII | ✓ SATISFIED | Verdad 13 |
| DEMO-03 | 02-03, 02-06 a 02-14 | Tests de dominio, contrato y ciclo con LLM falso | ✓ SATISFIED | El falso verde de truncado quedó reemplazado; los tests nuevos detectan CR-01, CR-02 y CR-03 |

Requisitos huérfanos: ninguno. Los 15 IDs de la fase en REQUIREMENTS.md coinciden con la unión de los `requirements:` de los 14 planes.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `src/domain/policies/confirmacion.policy.ts` | 50-58 | WR-01: un acuse suelto ("ok", "listo", "correcto", "vale", "claro") confirma | ⚠️ Warning | Reproducido con sonda. Es la decisión explícita de 02-14. Como respuesta inmediata a "¿Confirmas el envío simulado de X?", un acuse suelto es una afirmación convencional en español, y la acción es un envío *simulado*. Por eso no lo cuento como verdad fallida, pero lo derivo a decisión humana |
| `src/domain/policies/confirmacion.policy.ts` | 25-27 | IN-04: "si todo bien" confirma ("si" sin tilde) | ℹ️ Info | Reproducido. Va junto con la decisión de WR-01 |
| `src/domain/builders/cierre-turno.builder.ts` | 30-46 | WR-02: `sinPreguntaFinal` descarta líneas finales que contienen `¿…?` aunque sean afirmativas | ⚠️ Warning | Reproducido. El recorte puede ocultar en el chat las notas de campos `requiere_confirmacion` si el modelo las deja al final. Es latente: el formato de `prompt.md` pone Soportes y Estado después de Por confirmar, y el dato sigue marcado en los artefactos (`por_confirmar` del checklist). Conviene corregirlo antes de la UI de la Fase 3 con el arreglo que propone 02-REVIEW.md |
| `src/domain/policies/compuerta.policy.ts` | 93-103 | WR-03: con el presupuesto agotado, la sesión pide para siempre una confirmación imposible | ⚠️ Warning | Diseño explícito de 02-13. Nunca envía, pero el texto se contradice ("abre una sesión nueva" junto a "¿Confirmas…?"), y la Fase 3 mostraría una tarjeta inútil |
| `src/domain/policies/compuerta.policy.ts` | 99 | WR-04: si el turno cierra en FINAL con la autorización sin usar, se descarta en silencio | ⚠️ Warning | Coherente con D-38 ("se consume al final del turno, se haya usado o no"). El riesgo es que el modelo afirme un envío que no ocurrió y el servidor no lo contradiga. Eso lo gobierna la regla del prompt (`prompt.md:54`), así que va a la revisión humana 1 |
| `src/loop/services/despacho-llamada.service.ts` | 79-93 | IN-01: un envío autorizado que falla saca el caso de los pendientes | ℹ️ Info | No envía nada sin confirmación |
| `src/loop/services/ejecutar-turno.service.ts` | 410-419 | IN-02: `guardar` rechazado y aun así se anuncia `confirmation_required` | ℹ️ Info | Solo con un titular vencido |
| `src/infra/sessions/memory-session-store.adapter.ts` | 14-16 | IN-03: lease con reloj de pared | ℹ️ Info | Caso límite de saltos NTP |
| `src/config/strings.ts` | 245-246 | IN-05: el siguiente paso con varios casos cita "envía" o "sí" | ℹ️ Info | "sí" da `falta_caso` y no envía |
| `src/loop/services/ejecutar-turno.service.ts` | 212-251 | R1-WR-01 (abierto desde la ronda anterior): un corte a mitad de paso descarta resultados ya ejecutados | ⚠️ Warning | Coherencia del historial; no habilita envíos |
| `src/loop/services/presupuesto.service.ts` | — | R1-WR-04 (abierto): el tope es por sesión y crear sesiones es gratis | ⚠️ Warning | Cumple LLM-05 al pie de la letra; el control de abuso queda para la capa HTTP |
| `tests/helpers/agente-prueba.helper.ts`, `ejecutar-turno.service.ts:300` | — | WR-05 y WR-06 (abiertos) | ⚠️ Warning | Sin cambios desde la ronda anterior |
| `.planning/REQUIREMENTS.md` | 22, 185 | SOLI-03 sigue "Pending" | ℹ️ Info | Trazabilidad |

No hay marcadores TBD, FIXME, XXX, TODO ni HACK en los 24 archivos que cambiaron desde la verificación anterior. La única coincidencia, `METODO_POST`, es un falso positivo. Tampoco hay comentarios en `src/`.

**¿Alguna advertencia derrota el objetivo de la fase?** Las juzgué contra el valor central:
- *Ninguna acción externa sin confirmación humana explícita.* WR-01 es el único hallazgo que toca este punto, y solo si se considera que un "ok" o un "listo" en respuesta directa a "¿Confirmas el envío simulado de X?" no es explícito. La pregunta ahora es siempre del servidor (CR-02 cerrado), así que el acuse responde a esa pregunta y no a otra. WR-03 y WR-04 van en la dirección opuesta: confirmación sin acción, nunca acción sin confirmación.
- *Nunca inventar ni ocultar un dato.* WR-02 puede ocultar texto del modelo en el chat, pero no altera ningún valor ni estado de los artefactos, y no se activa con el formato prescrito. WR-04 permitiría una afirmación falsa del modelo que el servidor no corrige; eso es la prohibición CA2 de nivel judgment, que ya va a revisión humana.
- *El modelo nunca ve valores reales.* Ninguna advertencia lo toca.

### Prohibiciones

| Prohibición | Nivel | Disposición |
|-------------|-------|-------------|
| La clave solo en el header Authorization; no se leen cuerpos de error; la clave no se envía a otro host | test | Cumplida: `openai-compatible.adapter.test.ts`, `fallback.test.ts`, `bitacora.test.ts` |
| No exponer el cuerpo de la solicitud al modelo | test | Cumplida: `inyeccion.test.ts`, `pii-modelo.test.ts` |
| No adoptar ids de sesión del cliente | test | Cumplida: `sesion.test.ts` |
| No clasificar como confirmación textos con negación, "?", condicional, palabra fuera de la lista o dos slugs | test | Cumplida, y ahora con la lista corregida (CR-01) |
| No ejecutar `simular_envio` sin una autorización vigente del mensaje inmediatamente anterior | test | Cumplida: la autorización sale solo de una confirmación clasificada contra la pregunta del servidor (CR-01 y CR-02 cerrados) |
| Ninguna edición del prompt relaja la compuerta | test | Cumplida: la compuerta y la pregunta final son del servidor, y el texto del modelo ya no decide nada |
| No presentar valores como llenos, enviados o firmados sin una herramienta | judgment | **unverified-prohibition: se recomienda revisión humana.** Veredicto no autoritativo: el ejecutor (un LLM) leyó la corrida de 02-13 y no encontró afirmaciones sin respaldo; el código nunca afirma un envío sin `ok`. Ver la revisión humana 1 |

### Verificación humana requerida

1. **Revisión CA2 de las respuestas en vivo.** Lee las tres respuestas de `bun run test:vivo` (o vuelve a correrlo con la clave en `.env`). Esperado: el contenido que fija el human-check de 02-13: conteos, faltante, por confirmar con su nota, bloqueo legible, pregunta del servidor como último párrafo y envío solo de ec-corp-andina sin correo real ni firma. Ningún valor sin máscara, y ninguna afirmación de lleno, enviado o firmado sin un resultado `ok`. En particular, el modelo nunca dice que registró un envío si no llamó a `proveedor_simular_envio` (WR-04). Por qué humana: es de nivel judgment, y tanto la lectura como la línea `VIVO PASS … tokens=79292` las registró el ejecutor, no una persona.
2. **Decisión sobre WR-01.** Decide si un acuse suelto ("ok", "listo", "vale", "claro", "correcto") o "si todo bien", en respuesta a "¿Confirmas el envío simulado de X?", es una confirmación explícita. Esperado: aceptarlo y documentarlo en SOLUCION.md, o endurecer la gramática con el arreglo de 02-REVIEW.md, que son pocas líneas y unas filas de tabla. Por qué humana: el código cumple lo que fija el plan 02-14, y es una decisión de producto sobre el valor central.

### Resumen

El objetivo de la fase está logrado en el código. El ciclo es propio, el adaptador es genérico con preset DeepSeek y thinking desactivado, y la resiliencia CA5 cubre timeout, 429/503, red y 402, con el historial ahora válido también después de `length`. Hay topes de iteraciones y de tokens, el prompt y el conocimiento se editan en caliente, los logs van correlacionados y sin secretos, y el modelo nunca recibe valores reales. La compuerta cumple el criterio 2: el servidor decide quién envía, qué pregunta cierra el turno y qué frases cuentan como confirmación.

Los tres gaps anteriores están cerrados, sin regresiones, y sus tests ya no son falsos verdes. Quedan dos puntos para una persona: la lectura CA2 de las respuestas reales y la decisión sobre los acuses sueltos (WR-01). Recomiendo además corregir WR-02 y WR-03 antes de construir la tarjeta de confirmación de la Fase 3, porque los dos afectan lo que la UI mostrará. No bloquean esta fase.

---

_Verificado: 2026-10-13T22:45:00Z_
_Verificador: Claude (gsd-verifier)_
