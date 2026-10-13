---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-13T20:47:54Z
status: gaps_found
score: 12/16 must-haves verified
covered_files: [".env.example",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md","agent/prompt.md","docs/estructura.md","package.json","src/application/types/puertos-agente.type.ts","src/config/constants/agent.constants.ts","src/config/constants/confirmacion.constants.ts","src/config/constants/files.constants.ts","src/config/constants/llm.constants.ts","src/config/constants/logging.constants.ts","src/config/constants/patterns.constants.ts","src/config/constants/redaccion.constants.ts","src/config/constants/tools.constants.ts","src/config/env.ts","src/config/strings.ts","src/domain/builders/cierre-turno.builder.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/domain/policies/redaccion.policy.ts","src/domain/types/cierre-turno.type.ts","src/domain/types/compuerta.type.ts","src/domain/types/confirmacion.type.ts","src/domain/utils/texto-plano.util.ts","src/infra/clock/clock.adapter.ts","src/infra/clock/sleep.util.ts","src/infra/knowledge/instructions-loader.adapter.ts","src/infra/logging/logger.adapter.ts","src/infra/sessions/memory-session-store.adapter.ts","src/infra/types/logger.type.ts","src/infra/types/session-store.type.ts","src/knowledge/registro-proveedor.md","src/llm/adapters/openai-compatible.adapter.ts","src/llm/decorators/fallback.decorator.ts","src/llm/decorators/observacion.decorator.ts","src/llm/decorators/retry.decorator.ts","src/llm/decorators/timeout.decorator.ts","src/llm/mappers/provider-error.mapper.ts","src/llm/mappers/wire-messages.mapper.ts","src/llm/schemas/chat-completion.schema.ts","src/llm/types/llm.type.ts","src/llm/types/provider.type.ts","src/llm/types/resiliencia.type.ts","src/loop/schemas/resultado-herramienta.schema.ts","src/loop/services/bitacora-turno.service.ts","src/loop/services/cierre-turno.service.ts","src/loop/services/despacho-llamada.service.ts","src/loop/services/ejecutar-turno.service.ts","src/loop/services/presupuesto.service.ts","src/loop/services/registro-herramientas.service.ts","src/loop/services/respuesta-turno.service.ts","src/loop/services/tope-iteraciones.service.ts","src/loop/types/agente.type.ts","src/loop/types/evento.type.ts","src/loop/types/turno.type.ts","src/loop/wiring/agente.wiring.ts","src/tools/wiring/entorno.wiring.ts","tests/architecture.test.ts","tests/contract/env-agente.test.ts","tests/contract/instrucciones-agente.test.ts","tests/e2e/pii.test.ts","tests/fixtures/casos/zz-inyeccion/plantilla-campos.json","tests/fixtures/casos/zz-inyeccion/solicitud.json","tests/fixtures/casos/zz-inyeccion/soportes-exigidos.json","tests/fixtures/llm/completion-texto.json","tests/fixtures/llm/completion-tool-calls.json","tests/helpers/adaptador-guion.helper.ts","tests/helpers/agente-fetch.helper.ts","tests/helpers/agente-prueba.helper.ts","tests/helpers/bitacora.helper.ts","tests/helpers/eventos.helper.ts","tests/helpers/fetch-falso.helper.ts","tests/helpers/historial.helper.ts","tests/helpers/llm-falso.helper.ts","tests/helpers/pii.helper.ts","tests/helpers/types/adaptador-guion.type.ts","tests/helpers/types/agente-fetch.type.ts","tests/helpers/types/agente-prueba.type.ts","tests/helpers/types/bitacora.type.ts","tests/helpers/types/eventos.type.ts","tests/helpers/types/fetch-falso.type.ts","tests/helpers/types/llm-falso.type.ts","tests/helpers/types/pii.type.ts","tests/live/agente-en-vivo.test.ts","tests/loop/bitacora.test.ts","tests/loop/compuerta-casos.test.ts","tests/loop/compuerta.test.ts","tests/loop/fallback.test.ts","tests/loop/instrucciones.test.ts","tests/loop/inyeccion.test.ts","tests/loop/pii-modelo.test.ts","tests/loop/presupuesto.test.ts","tests/loop/resiliencia.test.ts","tests/loop/sesion.test.ts","tests/loop/tope.test.ts","tests/loop/trazador-agente.test.ts","tests/unit/cierre-turno.builder.test.ts","tests/unit/clock.adapter.test.ts","tests/unit/compuerta.policy.test.ts","tests/unit/confirmacion.policy.test.ts","tests/unit/fallback.decorator.test.ts","tests/unit/logger.adapter.test.ts","tests/unit/memory-session-store.adapter.test.ts","tests/unit/observacion.decorator.test.ts","tests/unit/openai-compatible.adapter.test.ts","tests/unit/provider-error.mapper.test.ts","tests/unit/redaccion.policy.test.ts","tests/unit/retry.decorator.test.ts","tests/unit/sleep.util.test.ts","tests/unit/texto-plano.util.test.ts","tests/unit/timeout.decorator.test.ts"]
covered_digest: "v3:sha256:b5a2e84acb8b7e68c4b9213becfc31a1bcda418b596ff689ec720d3186da6c53"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "ROADMAP criterio 2 / ENV-02: solo una confirmación explícita del mensaje inmediatamente siguiente autoriza el envío (clasificador conservador: ante la duda, otro)"
    status: failed
    reason: "CR-01 confirmado con sonda: 'envio' está a la vez en VERBOS_ENVIO y en RELLENO, y 'ok'/'listo'/'claro'/'vale' combinados con relleno ('gracias', 'el', 'paquete', 'todo', 'bien', 'con', 'y', 'entonces') pasan como confirmación. Con ec-corp-andina pendiente, clasificarConfirmacion devuelve confirma para 'y el envío', 'el envío', 'envío', 'entonces el envío', 'todo bien con el envío', 'ok, gracias', 'listo, gracias' y 'vale, el paquete'. Eso contradice la propia pregunta del servidor ('Responde \"envía\" … o cualquier otra cosa para no enviarlo') y el valor central ('ninguna acción externa sin confirmación humana explícita'). Ninguna fila de tests/unit/confirmacion.policy.test.ts cubre estas frases."
    artifacts:
      - path: "src/config/constants/confirmacion.constants.ts"
        issue: "'envio' (sustantivo) aparece en VERBOS_ENVIO (línea 36) y en RELLENO (línea 55); acuses como 'ok'/'listo' + 'gracias' quedan dentro de la gramática permitida"
      - path: "src/domain/policies/confirmacion.policy.ts"
        issue: "esAfirmativa acepta cualquier palabra de VERBOS_ENVIO, incluido el sustantivo; no exige un verbo de envío ni una afirmación fuerte"
      - path: "tests/unit/confirmacion.policy.test.ts"
        issue: "la tabla de 43 frases no tiene filas para sustantivos ni acuses con relleno"
    missing:
      - "Quitar 'envio' de VERBOS_ENVIO y dejar de autorizar acuses débiles ('ok', 'listo', 'claro', 'vale') cuando solo van con relleno, o alinear el texto de la pregunta con lo que realmente acepta el clasificador"
      - "Filas nuevas en la tabla: 'y el envío', 'el envío', 'envío', 'todo bien con el envío', 'ok, gracias', 'listo, gracias', 'vale, el paquete' → otro"
  - truth: "ROADMAP criterio 2 / ENV-03 / ENV-02: con un caso pendiente, el turno termina con la pregunta del servidor que lista los bloqueos, y la confirmación siguiente responde a ESA pregunta"
    status: failed
    reason: "CR-02 confirmado con sonda en el ciclo (LLM falso + herramientas reales): necesitaPreguntaDeterminista devuelve false cuando el último párrafo del modelo termina en '?' y nombra el caso. (a) El modelo cierra con '¿Quieres que vuelva a generar el formulario de ec-corp-andina?': el servidor no agrega su pregunta, needsConfirmation queda true, y el 'sí' siguiente autoriza un envío que escribió out/ec-corp-andina/ENVIO-SIMULADO.md. (b) El modelo cierra con '¿Confirmo el envío de ec-corp-andina?': el reply no menciona 'Certificado de cumplimiento tributario'; los bloqueos solo viajan en el evento confirmation_required, no en el texto ni en el reply PRD 6.4. El significado de la confirmación depende de texto que escribe el modelo (y que pueden dirigir datos no confiables de los fixtures), así que la compuerta deja de ser decidida solo por el servidor."
    artifacts:
      - path: "src/domain/policies/compuerta.policy.ts"
        issue: "necesitaPreguntaDeterminista (líneas 98-104) confía en la pregunta del modelo si nombra el caso"
      - path: "src/loop/services/cierre-turno.service.ts"
        issue: "conPregunta omite preguntaConfirmacion cuando la función anterior devuelve false"
      - path: "tests/loop/compuerta.test.ts"
        issue: "solo prueba textos del modelo que no nombran el caso; tests/live/agente-en-vivo.test.ts solo verifica endsWith('?') y no busca los bloqueos en el reply"
    missing:
      - "Agregar siempre preguntaConfirmacion como último párrafo cuando hay casos pendientes, o reemplazar la pregunta final del modelo por la del servidor"
      - "Test de ciclo: el modelo termina con una pregunta propia que nombra el caso pero pregunta otra cosa, la analista dice 'sí', y no se escribe ENVIO-SIMULADO.md (o la pregunta del servidor es el último párrafo y lista los bloqueos)"
  - truth: "AGT-04 / CA5: el historial queda íntegro y cada pedido posterior de la sesión es válido, también después de un paso cortado por finish_reason=length"
    status: partial
    reason: "CR-03 confirmado con sonda: pasoTruncado guarda asistenteDelPaso(respuesta) con los argumentos originales. Un paso cortado en '{\"caso\":\"co-industrias-delta\",\"mapeo\":[{\"etiq' queda en sesion.historial y toWireMessages lo reenvía tal cual como tool_calls[].function.arguments, JSON inválido, en el pedido inmediato y en todos los turnos siguientes. Un backend compatible con OpenAI que valide arguments responde 400 (PETICION_INVALIDA, sin reintento ni respaldo), y la sesión queda inservible. Con DeepSeek no se ha verificado. El test resiliencia.test.ts:288 es un falso verde: arma la llamada 'cortada' con llamar(), que usa JSON.stringify, e historialIntegro solo comprueba el emparejamiento, no que arguments sea JSON válido. El caso es realista: generar_formulario repite todo el mapeo y LLM_MAX_OUTPUT_TOKENS vale 2048."
    artifacts:
      - path: "src/loop/services/ejecutar-turno.service.ts"
        issue: "pasoTruncado (líneas 193-202) persiste los argumentos truncados"
      - path: "src/llm/mappers/wire-messages.mapper.ts"
        issue: "toWireToolCall reenvía argumentos sin comprobar que sean JSON válido"
      - path: "tests/loop/resiliencia.test.ts"
        issue: "el test de truncado usa JSON completo"
    missing:
      - "Reemplazar los argumentos truncados por un JSON válido (p. ej. '{}' como constante en agent.constants.ts) y conservar id y nombre para el emparejamiento"
      - "Reescribir el test con una cadena realmente truncada y comprobar con JSON.parse cada tool_calls[].function.arguments de cada pedido posterior"
behavior_unverified_items: []
human_verification:
  - test: "Revisar las transcripciones de la corrida en vivo (bun run test:vivo) y confirmar que el agente nunca presenta un valor como lleno, enviado o firmado sin que una herramienta lo devolviera con ok, ni completa un faltante"
    expected: "Cada afirmación del reply corresponde a un resultado de herramienta"
    why_human: "Prohibición de nivel judgment (02-09). El veredicto del verificador NO es autoritativo: la regla está en agent/prompt.md (líneas 13-17), pero solo una lectura humana de respuestas reales puede confirmarla"
  - test: "Después de cerrar los gaps, volver a correr bun run test:vivo con la clave en .env"
    expected: "Una nueva línea 'VIVO PASS modelo=… llamadas=… tokens=…'; el reply del turno 1 del §11 termina con la pregunta del servidor que lista los bloqueos"
    why_human: "La línea VIVO PASS de 02-09-SUMMARY.md la reportó el ejecutor. El verificador no la reprodujo para no gastar la clave personal, y los arreglos de CR-01 y CR-02 cambian el comportamiento que se probó en vivo"
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-13T20:47:54Z
**Estado:** gaps_found
**Re-verificación:** No, es la verificación inicial

## Logro del objetivo

El ciclo propio, el adaptador, la resiliencia, los topes, los logs y la protección de PII hacia el modelo existen, están conectados y los cubren pruebas que pasan. La compuerta tiene un núcleo sólido: el modelo no puede enviar por su cuenta, el servidor arma `{caso, confirmado: true}`, la autorización vale una vez y solo en el turno siguiente. Pero hay dos caminos alcanzables en los que la analista no confirmó explícitamente el envío y aun así se escribe `ENVIO-SIMULADO.md` (CR-01 y CR-02, ambos reproducidos). Con eso cae el criterio 2 del ROADMAP, que es justo el corazón del valor central del proyecto.

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: "procesa el caso co-industrias-delta" ejecuta las herramientas en secuencia por el ciclo propio, sin framework de agentes; `deepseek-flash` desde env/preset, thinking desactivado; el modelo solo recibe rutas y valores enmascarados | ✓ VERIFIED | `ejecutar-turno.service.ts` (bucle `for` propio, `llm.enviar` línea 279, herramientas en serie en `ejecutarPaso`); `package.json` no tiene frameworks de agentes; `buildRequest` envía `thinking` según el preset `PRESET_DEEPSEEK` (`model: deepseek-flash`, `thinking: disabled`); `trazador-agente.test.ts` pasa por el adaptador real con fetch inyectado; `pii-modelo.test.ts` (4 casos) e `inyeccion.test.ts` prueban que no llega ningún valor del maestro ni el cuerpo. La línea en vivo `VIVO PASS modelo=deepseek-flash llamadas=12 tokens=79320` la reportó el ejecutor y no se reprodujo (ver verificación humana) |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en el §11 el turno termina con una pregunta que lista los bloqueos y solo la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md`, una vez y para ese caso; `confirmado: true` del modelo nunca basta | ✗ FAILED | El camino feliz del §11 pasa (`compuerta.test.ts`) y `confirmado: true` del modelo se bloquea (`despacho-llamada.service.ts:73-94`). Pero las sondas reprodujeron CR-01 ("y el envío", "ok, gracias" → `confirma`) y CR-02 (una pregunta del modelo que nombra el caso suprime la del servidor, "sí" a otra pregunta envía, y los bloqueos no aparecen en el reply) |
| 3 | **ROADMAP C3**: ante timeout, 429/503 o error de red hay reintentos con backoff o respaldo; si falla, mensaje claro en español (402 = "Saldo agotado"); el siguiente mensaje funciona con el historial íntegro (CA5) | ✓ VERIFIED | `retry.decorator.ts`, `timeout.decorator.ts`, `fallback.decorator.ts` compuestos en `agente.wiring.ts:84-87`; `resiliencia.test.ts` (503 agota reintentos + turno siguiente íntegro; 402 un solo pedido; timeout; deadline) y `fallback.test.ts` pasan. El camino `finish_reason=length` queda aparte en la verdad 15 |
| 4 | **ROADMAP C4**: en el tope de iteraciones (25) o de tokens por sesión, respuesta clara con lo hecho y lo que falta; una instrucción inyectada en el correo no cambia el comportamiento | ✓ VERIFIED | `tope-iteraciones.service.ts`, `presupuesto.service.ts`; `tope.test.ts` (7 tests), `presupuesto.test.ts` (4 tests); `inyeccion.test.ts`: el marcador del cuerpo nunca llega al modelo, el envío inyectado se bloquea y la frase inyectada no confirma |
| 5 | **ROADMAP C5**: editar `registro-proveedor.md` o `agent/prompt.md` cambia el comportamiento sin tocar el servidor; logs JSON con IDs de sesión, turno y tool call, sin clave ni PII; `bun test` cubre el ciclo con un LLM falso sin gastar tokens | ✓ VERIFIED | `instructions-loader.adapter.ts` lee en cada turno; `instrucciones.test.ts` (edición en caliente, archivo ausente → `INSTRUCCIONES_NO_DISPONIBLES`); `logger.adapter.ts` (pino 10.3.1 + `redactar`); `bitacora.test.ts`; la suite completa corrió una vez: 950 pass, 1 skip (el test en vivo), 0 fail |
| 6 | 02-01: puerto neutral `enviar(mensajes, herramientas)`; adaptador genérico OpenAI-compatible; cuerpo con model, thinking, temperature 0, max_tokens, stream false, tool_choice auto y las 5 herramientas generadas con `z.toJSONSchema` | ✓ VERIFIED | `llm.type.ts`, `openai-compatible.adapter.ts:44-60`, `registro-herramientas.service.ts`; `openai-compatible.adapter.test.ts` y `trazador-agente.test.ts` |
| 7 | 02-02: `crearAgente` es el único composition root y nunca lanza; store en memoria con TTL, LRU y candado; un id desconocido da un id nuevo del servidor | ✓ VERIFIED | `agente.wiring.ts:128-149` (`createMemorySessionStore<Sesion>(` en la línea 109; el verificador automático dio falso negativo por el genérico `<Sesion>`); `memory-session-store.adapter.test.ts`, `sesion.test.ts` |
| 8 | 02-03 (D-39): clasificador determinista y conservador; ante cualquier duda devuelve `otro`, que nunca autoriza | ✗ FAILED | CR-01: sustantivos y acuses con relleno devuelven `confirma` (ver gaps) |
| 9 | 02-03/02-06: máquina de estados de un solo paso; la autorización vale para un caso, una vez y solo en el turno inmediato; `falta_caso` con varios casos; revocación al re-armar | ✓ VERIFIED | `compuerta.policy.ts` (`abrirTurno`, `evaluarEnvio`, `revocarAlArmar`); `compuerta-casos.test.ts` (13 escenarios D-38 a D-63) |
| 10 | 02-06: el servidor arma los args del envío; ni el `confirmado` del modelo, ni el texto inyectado, ni las frases inyectadas autorizan; el intento bloqueado deja una línea en la bitácora CA4 | ✓ VERIFIED | `despacho-llamada.service.ts:55-94`; `compuerta.test.ts` (literal del rechazo y línea en `out/log.jsonl`), `inyeccion.test.ts` |
| 11 | 02-03/02-06 (ENV-03, D-44): con un caso pendiente, el cierre lleva la pregunta determinista del servidor, que nombra el caso y lista los bloqueos con nombres legibles | ✗ FAILED | CR-02: `necesitaPreguntaDeterminista` cede ante cualquier pregunta del modelo que nombre el caso |
| 12 | 02-04: taxonomía de errores por estado HTTP sin leer el cuerpo; solo se reintentan los transitorios; el respaldo nunca actúa ante peticion_invalida, autenticacion, saldo o filtro_contenido; mensajes del catálogo en español | ✓ VERIFIED | `provider-error.mapper.ts`, `openai-compatible.adapter.ts:124-128` (`discardBody` antes de mapear); `provider-error.mapper.test.ts`, `retry.decorator.test.ts`, `fallback.decorator.test.ts` |
| 13 | 02-05/02-08: un solo `redactar()`; logs JSON con pino sin transport, con `sesionId`/`turnoId`/`llamadaId`, sin la clave, el texto del usuario ni valores del maestro | ✓ VERIFIED | `redaccion.policy.ts`, `logger.adapter.ts`, `bitacora-turno.service.ts`; `redaccion.policy.test.ts`, `logger.adapter.test.ts`, `bitacora.test.ts` |
| 14 | 02-07: el presupuesto cuenta todas las llamadas exitosas (resumen y respaldo incluidos); al tope, una llamada de resumen sin herramientas o un cierre determinista; un paquete armado conserva su pregunta (D-63.2) | ✓ VERIFIED | `presupuesto.service.ts`, `tope-iteraciones.service.ts`, `ejecutar-turno.service.ts:254-299`; `tope.test.ts`, `presupuesto.test.ts` |
| 15 | 02-08 (AGT-04): ningún pedido posterior queda con una tool call sin resultado ni con argumentos inválidos; el paso abortado se descarta; `finish_reason=length` no ejecuta herramientas | ✗ FAILED (partial) | El aborto y el abandono están bien (`resiliencia.test.ts:225,257`). CR-03: el paso truncado persiste y reenvía argumentos con JSON inválido (sonda: `valid JSON: false` en el pedido del turno 2) |
| 16 | 02-09: el modelo no recibe valores sensibles del maestro ni el cuerpo de la solicitud en los 4 casos; los valores enmascarados sí llegan | ✓ VERIFIED | `pii-modelo.test.ts` (5 tests), `tests/e2e/pii.test.ts` |

**Puntaje:** 12/16 verdades verificadas (0 presentes con comportamiento sin verificar)

### Elementos diferidos

Ninguno. La Fase 3 (criterio 3) mostrará una tarjeta con los bloqueos a partir del evento `confirmation_required` y agregará botones estructurados. Eso no corrige que el texto del reply omita los bloqueos, ni que un "sí" escrito a otra pregunta autorice, ni el clasificador de CR-01, porque el chat sigue aceptando texto libre. Por eso ningún gap se difiere.

### Artefactos requeridos

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `src/llm/types/llm.type.ts` | Puerto LLM neutral | ✓ VERIFIED | `AdaptadorLlm`, lo usa el ciclo |
| `src/llm/adapters/openai-compatible.adapter.ts` | Adaptador genérico | ✓ VERIFIED | Conectado en `agente.wiring.ts:64` |
| `src/loop/services/ejecutar-turno.service.ts` | Turno como generador de eventos | ✓ VERIFIED (con defecto CR-03) | `pasoTruncado` persiste argumentos inválidos |
| `src/loop/services/registro-herramientas.service.ts` | Registro `proveedor_<export>` | ✓ VERIFIED | |
| `src/infra/knowledge/instructions-loader.adapter.ts` | Lectura por turno | ✓ VERIFIED | |
| `src/config/env.ts` | Ranuras D-59 y topes | ✓ VERIFIED | `env-agente.test.ts` |
| `src/infra/sessions/memory-session-store.adapter.ts` | TTL, LRU y candado | ✓ VERIFIED | |
| `src/loop/wiring/agente.wiring.ts` | Composition root | ✓ VERIFIED | |
| `src/domain/policies/confirmacion.policy.ts` | Clasificador conservador | ✗ STUB de conducta | Existe y está conectado, pero la gramática acepta frases que no confirman (CR-01) |
| `src/config/constants/confirmacion.constants.ts` | Listas de palabras | ✗ Defecto | `envio` en dos listas |
| `src/domain/policies/compuerta.policy.ts` | Transiciones de la compuerta | ⚠️ Parcial | Transiciones bien; `necesitaPreguntaDeterminista` cede ante el modelo (CR-02) |
| `src/domain/builders/cierre-turno.builder.ts` | Pregunta determinista | ✓ VERIFIED | Correcta cuando se usa |
| `src/loop/services/despacho-llamada.service.ts` | Compuerta por llamada | ✓ VERIFIED | |
| `src/loop/services/cierre-turno.service.ts` | Cierre con pregunta | ⚠️ Parcial | CR-02 |
| `src/llm/decorators/{retry,timeout,fallback}.decorator.ts` | Resiliencia | ✓ VERIFIED | |
| `src/llm/mappers/provider-error.mapper.ts` | Taxonomía | ✓ VERIFIED | |
| `src/domain/policies/redaccion.policy.ts`, `src/infra/logging/logger.adapter.ts` | Redacción y logs | ✓ VERIFIED | |
| `src/loop/services/presupuesto.service.ts`, `tope-iteraciones.service.ts` | Topes | ✓ VERIFIED | |
| `agent/prompt.md`, `src/knowledge/registro-proveedor.md` | Conducta y proceso | ✓ VERIFIED | `instrucciones-agente.test.ts` |
| `tests/live/agente-en-vivo.test.ts` | Corrida en vivo opcional | ✓ VERIFIED (débil) | No verifica que el reply liste los bloqueos |

`verify.artifacts`: 43/43 artefactos de los 9 planes existen y son sustantivos.

### Verificación de enlaces clave

| De | A | Vía | Estado | Detalles |
|----|---|-----|--------|----------|
| ejecutar-turno | llm.type | `llm.enviar(` | WIRED | |
| registro-herramientas | tools/proveedor.ts | `toJSONSchema(` | WIRED | |
| adapter | provider-error.mapper | `errorFromStatus(` / `errorFromFinishReason(` | WIRED | |
| instructions-loader | agent/prompt.md | `ARCHIVO_PROMPT` | WIRED | |
| agente.wiring | env.ts | `readAgentEnv`/`parseAgentEnv` | WIRED | |
| agente.wiring | memory-session-store | `createMemorySessionStore<Sesion>(` | WIRED | La herramienta reportó "not found" por el genérico; se comprobó a mano en la línea 109 |
| ejecutar-turno | puertos-agente | `liberar(` en `finally` | WIRED | |
| despacho-llamada | compuerta.policy | `evaluarEnvio(` | WIRED | |
| ejecutar-turno | confirmacion.policy | `clasificarConfirmacion(` | WIRED | |
| cierre-turno | texto-plano.util | `limpiarMarkdown(` | WIRED | |
| agente.wiring | fallback.decorator | `withFallback(` | WIRED | |
| agente.wiring | logger.adapter | `createLogger(` | WIRED | |
| ejecutar-turno | turno.type | `AbortSignal.any(` | WIRED | |
| tope-iteraciones | cierre-turno.builder | `cierreDeterminista(` | WIRED | |

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| Pedido `/chat/completions` | `messages` | prompt.md + knowledge leídos del disco, historial de la sesión, resultados reales de las herramientas | Sí | ✓ FLOWING |
| Pedido `/chat/completions` | `tool_calls[].function.arguments` del historial | `respuesta.llamadas` del proveedor, sin sanear tras `length` | Sí, pero sin validar | ⚠️ CR-03 |
| Reply del turno | texto final | modelo + `preguntaConfirmacion` condicional | Sí | ⚠️ CR-02 (la pregunta del servidor se puede omitir) |
| `confirmation_required` | `bloqueos` | `armar_paquete` real vía `paqueteArmado` | Sí | ✓ FLOWING |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Suite completa (una sola vez) | `bun test` | 950 pass, 1 skip, 0 fail | ✓ PASS |
| Tipos, lint y auditoría | `bun run check` | tsc + biome sin errores; 0 vulnerabilidades | ✓ PASS |
| CR-01: frases no explícitas | sonda `clasificarConfirmacion` con `["ec-corp-andina"]` | "y el envío", "el envío", "envío", "entonces el envío", "todo bien con el envío", "ok, gracias", "listo, gracias", "vale, el paquete" → `confirma` | ✗ FAIL |
| CR-02a: "sí" a una pregunta ajena | sonda de ciclo: el modelo cierra con "¿Quieres que vuelva a generar el formulario de ec-corp-andina?" y la analista dice "sí" | No se agrega la pregunta del servidor; `ENVIOS after 'sí': ["ec-corp-andina"]` | ✗ FAIL |
| CR-02b: bloqueos en el reply | sonda de ciclo: el modelo cierra con "¿Confirmo el envío de ec-corp-andina?" | `contains bloqueo name: false` (el evento sí trae los bloqueos) | ✗ FAIL |
| CR-03: argumentos truncados | sonda de ciclo: paso `fin: limite` con `{"caso":"co-industrias-delta","mapeo":[{"etiq` | Se reenvía en el pedido del turno 2 con `valid JSON: false`; queda en `historial` | ✗ FAIL |

Las sondas viven solo en el scratchpad y no tocaron el repositorio (`git status` sin cambios nuevos).

### Ejecución de probes

No aplica: la fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Plan | Descripción (resumen) | Estado | Evidencia |
|-----------|------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo; fixture inyectado | ✓ SATISFIED | `inyeccion.test.ts`; `prompt.md:16`. REQUIREMENTS.md lo sigue marcando `[ ]` y "Pending" en la trazabilidad: es una inconsistencia de documentación |
| ENV-02 | 02-03, 02-06 | Compuerta del servidor, clasificador con negaciones, una vez, mensaje siguiente | ✗ BLOCKED | CR-01, CR-02 |
| ENV-03 | 02-03, 02-06 | Pregunta explícita que lista los bloqueos; `needsConfirmation` del servidor | ✗ BLOCKED | CR-02 (`needsConfirmation` sí es correcto) |
| AGT-01 | 02-01, 02-07 | Ciclo propio, secuencial, tope 25 con respuesta | ✓ SATISFIED | Verdades 1 y 14 |
| AGT-02 | 02-01, 02-02, 02-09 | Prompt y conocimiento separados, cambios sin tocar el servidor | ✓ SATISFIED | Verdad 5 |
| AGT-03 | 02-09 | El prompt prohíbe afirmar valores que no salieron de una herramienta | ✓ SATISFIED | `prompt.md:13-17` (la conducta real queda para revisión humana) |
| AGT-04 | 02-02, 02-06, 02-08 | Store con TTL; historial íntegro; sobrevive a errores (CA5) | ⚠️ PARTIAL | CR-03 en el camino `length` |
| AGT-05 | 02-04, 02-08 | Errores en español desde un catálogo | ✓ SATISFIED | `MENSAJE_AGENTE`, `CODIGO_AGENTE_POR_ERROR_LLM` |
| LLM-01 | 02-01, 02-02, 02-09 | Puerto propio y adaptador genérico | ✓ SATISFIED | Verdad 6 |
| LLM-02 | 02-01, 02-04, 02-09 | fetch directo, preset DeepSeek, env, thinking desactivado, flags de capacidad | ✓ SATISFIED | Verdad 6 |
| LLM-03 | 02-04, 02-08 | Timeout, backoff con jitter solo transitorios, 402 = saldo agotado | ✓ SATISFIED | Verdad 12 |
| LLM-04 | 02-01, 02-04, 02-08, 02-09 | Respaldo tras agotar reintentos; clave heredada solo con la misma URL | ✓ SATISFIED | `fallback.test.ts` |
| LLM-05 | 02-07 | Topes configurables con mensaje claro | ✓ SATISFIED | Verdad 14 |
| SEG-03 | 02-05, 02-08 | Logs JSON correlacionados sin clave ni PII | ✓ SATISFIED | Verdad 13 |
| DEMO-03 | 02-03, 02-06, 02-07, 02-08, 02-09 | Tests de dominio, contrato y ciclo con LLM falso | ⚠️ PARTIAL | Los tests existen y pasan, pero ninguno detecta CR-01, CR-02 ni CR-03, y el de truncado es un falso verde |

Requisitos huérfanos: ninguno. Los 15 IDs de la fase aparecen en al menos un plan.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `src/config/constants/confirmacion.constants.ts` | 36, 55 | `envio` en VERBOS_ENVIO y en RELLENO | 🛑 Blocker | CR-01 |
| `src/domain/policies/compuerta.policy.ts` | 98-104 | La pregunta del modelo reemplaza la del servidor | 🛑 Blocker | CR-02 |
| `src/loop/services/ejecutar-turno.service.ts` | 193-202 | Argumentos truncados persistidos | 🛑 Blocker (parcial) | CR-03 |
| `tests/loop/resiliencia.test.ts` | 288-322 | Falso verde: el "truncado" es JSON completo | ⚠️ Warning | Calidad de los tests |
| `src/loop/services/ejecutar-turno.service.ts` | 204-243 | WR-01: un corte a mitad de paso descarta resultados de herramientas que ya corrieron, pero sus eventos de compuerta se aplican | ⚠️ Warning | Coherencia del historial |
| `src/loop/services/ejecutar-turno.service.ts` | 310-318 | WR-02: un turno de confirmación que falla antes del envío pierde el caso pendiente | ⚠️ Warning | Recuperación tipo CA5 en el paso de confirmación |
| `src/infra/sessions/memory-session-store.adapter.ts` | 12-27 | WR-03: candado sin lease | ⚠️ Warning | Riesgo para el SSE de la Fase 3 |
| `src/loop/services/presupuesto.service.ts` | 8-14 | WR-04: sin tope global; las respuestas inválidas reintentadas no cuentan tokens | ⚠️ Warning | Costo con un link público |
| `tests/helpers/agente-prueba.helper.ts` | 81-84 | WR-05: `sesionActual()` crea una sesión si falta | ⚠️ Warning | Trampa de falso verde |
| `src/loop/services/ejecutar-turno.service.ts` | 291-293 | WR-06: respuesta final vacía | ⚠️ Warning | Reply en blanco |
| `.planning/REQUIREMENTS.md` | 22, 185 | SOLI-03 marcado Pending pese a estar implementado | ℹ️ Info | Trazabilidad |

No hay marcadores TBD, FIXME o XXX en `src/`, `tests/` ni `agent/`.

### Cobertura de decisiones

Las 27 decisiones rastreables de CONTEXT.md aparecen en los artefactos entregados (`check.decision-coverage-verify`: 27/27). Esta comprobación no afecta el estado.

### Prohibiciones

| Prohibición | Nivel | Disposición |
|-------------|-------|-------------|
| La clave solo en el header Authorization; no leer cuerpos de error; no enviar la clave a otro host (02-01, 02-04, 02-08) | test | Cumplida: `openai-compatible.adapter.test.ts`, `fallback.test.ts`, `bitacora.test.ts` |
| No exponer el cuerpo de la solicitud al modelo (02-01, 02-06) | test | Cumplida: `inyeccion.test.ts`, `pii-modelo.test.ts` |
| No adoptar ids de sesión del cliente (02-02) | test | Cumplida: `sesion.test.ts` |
| No clasificar como confirmación textos con negación, "?", condicional, palabra fuera de la lista o dos slugs (02-03) | test | Se cumple al pie de la letra, pero la lista permitida es el defecto (CR-01) |
| No ejecutar `simular_envio` sin una autorización vigente del mensaje inmediatamente anterior de la analista (02-06) | test | El mecanismo se cumple, pero la autorización puede salir de un mensaje que no confirmaba (CR-01, CR-02). Se registra como gap |
| No presentar valores como llenos, enviados o firmados sin una herramienta (02-09) | judgment | **unverified-prohibition: se recomienda revisión humana.** Veredicto no autoritativo del verificador: la regla está en el prompt y el código nunca afirma envíos sin `ok` |
| Ninguna edición del prompt relaja la compuerta (02-09) | test | Cumplida: la compuerta está en el código. CR-02 muestra, en cambio, que el *texto* del modelo sí influye en ella |

### Verificación humana requerida

1. **Revisión de la prohibición CA2 (judgment).** Lee las respuestas reales de `bun run test:vivo` y confirma que ningún valor, envío o firma se afirma sin un resultado de herramienta con `ok`. Esperado: cada afirmación sale de una herramienta. Por qué humana: es de nivel judgment y la presencia de la regla en el prompt no prueba la conducta.
2. **Nueva corrida en vivo después de los arreglos.** Corre `bun run test:vivo` con la clave en `.env`. Esperado: una línea `VIVO PASS` nueva y el reply del §11 terminado con la pregunta del servidor que lista los bloqueos. Por qué humana: gasta la clave personal y la evidencia actual la reportó el ejecutor. Si se puede, comprueba también cómo responde DeepSeek a un historial con argumentos inválidos (el impacto real de CR-03).

### Resumen de gaps

Una causa raíz domina: **la compuerta decide bien *quién* puede enviar, pero no garantiza *qué* confirmó la analista.**

- **CR-01 (clasificador):** frases que no son una orden ("el envío", "y el envío", "ok, gracias") cuentan como confirmación explícita. El servidor promete "cualquier otra cosa para no enviarlo" y no lo cumple.
- **CR-02 (pregunta de cierre):** cuando el modelo escribe su propia pregunta y nombra el caso, el servidor deja de agregar la suya. El "sí" de la analista puede responder otra pregunta y aun así autoriza el envío, y el reply puede no listar los bloqueos. CR-01 y CR-02 juntos hacen caer el criterio 2 del ROADMAP, ENV-02 y ENV-03. Conviene planear los dos arreglos juntos: pregunta del servidor siempre presente y gramática de confirmación estricta y alineada con esa pregunta.
- **CR-03 (historial tras `length`):** un paso truncado deja JSON inválido en el historial y lo reenvía en cada pedido. Rompe la integridad del historial (AGT-04) en proveedores que validan `arguments`, y su test es un falso verde. Es independiente de los dos anteriores.

El resto del objetivo está logrado y probado: ciclo propio, adaptador genérico con preset DeepSeek, resiliencia CA5 ante timeout, 429/503, red y 402, topes de iteraciones y tokens, edición en caliente del prompt y del conocimiento, logs correlacionados sin secretos, y un modelo que nunca recibe valores reales. Las advertencias WR-01 a WR-06 no bloquean, pero WR-02 y WR-03 conviene resolverlas antes de la capa SSE de la Fase 3.

---

_Verificado: 2026-10-13T20:47:54Z_
_Verificador: Claude (gsd-verifier)_
