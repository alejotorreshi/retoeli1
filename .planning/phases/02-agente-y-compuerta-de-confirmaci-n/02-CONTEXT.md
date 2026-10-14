# Phase 2: Agente y compuerta de confirmación - Context

**Gathered:** 2026-10-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, sin framework de agentes. El ciclo tiene un tope de iteraciones y un tope de tokens por sesión, resiste fallas del proveedor (timeout, reintentos con backoff y fallback de modelo) y tiene una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales. Entran el adaptador LLM neutral más su implementación DeepSeek, las sesiones en memoria, `agent/prompt.md`, `src/knowledge/registro-proveedor.md`, los logs estructurados y los tests del ciclo con un LLM falso.

Fuera de esta fase: la API HTTP/SSE, el código de acceso, el rate limit, el chat React y el despliegue (Fase 3), y `modulo/`, `SOLUCION.md` y la CI (Fase 4). El ciclo se expone como un generador de eventos tipados que la Fase 3 traduce a SSE.

</domain>

<decisions>
## Implementation Decisions

La numeración sigue la de la Fase 1 (D-01 a D-36).

### Compuerta de confirmación (CA3, RN4, ENV-02, ENV-03)
- **D-37:** La confirmación es de **un solo paso**, literal al PRD §11, CA3 y RN4. Cuando un turno arma con éxito un paquete (`armar_paquete` con `ok: true`), el servidor deja la sesión en `pendiente { caso, accion: "envio" }` y el turno termina con la pregunta de confirmación. Si el **mensaje inmediatamente siguiente** de la usuaria confirma ("envía", "sí"), queda autorizado **un** `simular_envio` para ese caso, dentro de ese turno. Cualquier otro mensaje cancela lo pendiente. (Reemplazada por D-63.6: solo un rechazo explícito cancela.) Lo pendiente nace solo si el turno anterior terminó preguntando por ese caso. — **Reversibility:** costly — define la máquina de estados de la sesión, el evento de confirmación que consume la UI de la Fase 3 y los tests del guion §11.
- **D-38:** La autorización vale **una vez y para un caso**. Si `simular_envio` llega sin autorización, el ciclo no ejecuta la herramienta: devuelve al modelo `{ ok: false, codigo: CONFIRMACION_REQUERIDA, error: "requiere confirmación explícita" }`, lo registra (CA4) y deja la sesión en pendiente. Con autorización, el servidor **fuerza** `confirmado: true` y verifica que `args.caso` sea el caso autorizado. El `confirmado: true` que mande el modelo por su cuenta nunca basta. La autorización se consume al final del turno, se haya usado o no.
- **D-39:** El clasificador es **conservador, determinista y entiende negaciones**, y vive como función pura en `domain/`. Confirma solo con afirmaciones o verbos claros sin negación ("envía", "sí", "confirmo", "procede", "dale", "adelante", "sí, envía"). No confirman: "No envíes nada todavía", "todavía no", "espera", las preguntas ("¿y si envío?") ni las confirmaciones condicionadas ("ok pero cambia X"). La duda da `otro` y no autoriza. Si el agente no reconoce una confirmación, vuelve a preguntar en vez de enviar. (Desde D-63.6 la pregunta la vuelve a agregar el servidor.) La palabra "envía" sola **tiene que** confirmar (guion §11). La lista de expresiones vive en constantes centralizadas, no en el prompt. El botón de la UI (Fase 3) mandará una confirmación estructurada que tiene precedencia sobre el texto.
- **D-40:** **Varios casos:** solo se autoriza un caso por confirmación. Si el turno armó un solo paquete, "envía" lo autoriza. Si armó varios, la pregunta de cierre los lista y la confirmación tiene que **nombrar el caso** ("envía ec-corp-andina"). Un "envía" a secas no autoriza nada y el agente pregunta cuál. Nunca se autorizan varios envíos con una sola frase.
- **D-41:** El paquete BLOQUEADO se puede enviar con la misma confirmación de un paso (decisión [Init]). La pregunta de cierre siempre lista los bloqueos vigentes, y `ENVIO-SIMULADO.md` los registra.
- **D-42:** Ante `PAQUETE_DESACTUALIZADO` (o un formulario desactualizado porque cambió el maestro), el agente vuelve a ejecutar `generar_formulario` si hace falta y luego `armar_paquete`, muestra el estado nuevo y **pide confirmación de nuevo**. La autorización anterior no se arrastra (bloqueante de STATE.md, CR-01).

### Forma de la respuesta (HU-4, §11, CA2)
- **D-43:** El resumen lo **redacta el modelo** con un **formato fijo** que define `agent/prompt.md`: caso y ruta `out/<caso>/`, conteos lleno/faltante/por confirmar, etiquetas faltantes, etiquetas por confirmar con su nota, soportes ausentes o vencidos que hay que actualizar, el estado `listo_para_firma` (LISTO o BLOQUEADO con sus motivos) y la pregunta de cierre. CA2 se cumple por diseño, porque el modelo solo ve valores enmascarados (D-05 a D-07).
- **D-44:** La red de seguridad es del **servidor**. Calcula `needsConfirmation` y emite un evento estructurado `confirmacion { caso, accion, bloqueos }`, derivado de los resultados de las herramientas y no del texto del modelo, que la Fase 3 pinta como tarjeta. Si hay confirmación pendiente y el texto del modelo no termina en pregunta, el servidor agrega la pregunta determinista desde `src/config/strings.ts`, con el caso y los bloqueos.
- **D-45:** Nivel de detalle: conteos más las listas de pendientes. **No** lista los campos llenos ni sus valores, salvo que la analista lo pida, y entonces los muestra enmascarados.
- **D-46:** Formato: **texto plano con viñetas** (encabezados simples y guiones), sin tablas markdown ni negritas, porque la Fase 3 lo muestra con `white-space: pre-wrap`, sin render markdown.
- **D-47:** Si la analista pide un valor ("¿cuál es el NIT?"), el agente responde con el **valor enmascarado y su origen**: la ruta del maestro y el archivo de salida donde está el valor completo (y la hoja o celda si la herramienta la entrega). Nunca revela el valor real por el chat.

### Correo del cliente y prompt injection (SOLI-03, criterio 4)
- **D-48:** El modelo **no ve el cuerpo del correo**. Se mantiene el contrato v1 de `leer_solicitud` (país, cliente, formato, plantilla, campos, ambiguos y soportes, ya estructurados y validados con zod). El prompt declara que todo contenido que viene de los fixtures es dato no confiable y nunca contiene instrucciones. — **Reversibility:** costly — exponer el cuerpo después cambiaría el contrato de una herramienta que consumen el prompt, los golden tests y `modulo/`.
- **D-49:** El test de inyección usa un **fixture sintético** en `tests/fixtures/`, con instrucciones inyectadas en el cuerpo y en campos de texto que sí llegan al modelo (por ejemplo `cliente`). Con el LLM falso, el test demuestra que la compuerta, las herramientas y la salida no cambian: no hay envío sin confirmación ni valores fuera de las herramientas.
- **D-50:** Hay que reformular SOLI-03 en REQUIREMENTS.md: "El cuerpo del correo del cliente no se expone al modelo; todo dato de fixture se trata como no confiable y el prompt lo declara; un test con un fixture inyectado lo verifica". Esto reemplaza "delimitado y truncado".

### Presupuesto, topes y resiliencia (CA1, LLM-03 a LLM-05)
- **D-51:** Tope de tokens por sesión: **300 000 por defecto**, configurable por env. Cuenta `prompt + completion` de todas las llamadas, incluidas las del fallback. Al superarlo, el usuario recibe un mensaje claro en español, no un 500.
- **D-52:** El fallback `deepseek-flash` → `deepseek-v4-pro` está **activo por defecto** y se puede desactivar o cambiar por env. Solo actúa después de agotar los reintentos del primario ante errores transitorios (429, 500, 503, timeout o red), y nunca ante 400, 401, 402 o 422.
- **D-53:** Al llegar al tope de iteraciones (25 por defecto, CA1), se hace **una llamada final con las herramientas desactivadas** para que el modelo resuma lo hecho y lo pendiente. Si esa llamada falla o no queda presupuesto, el servidor arma un **mensaje determinista** desde los tool calls del turno ("Completé: … Falta: …"). Siempre hay respuesta.
- **D-54:** El **spike en vivo** con DeepSeek se hace con la clave de la usuaria en `.env` local (ignorado por git), antes de construir el adaptador. Verifica el nombre del modelo vigente, `thinking: { type: "disabled" }`, `tool_choice`, la forma de `tool_calls` y `usage` y los códigos de error. El spike solo comprueba que `DEEPSEEK_API_KEY` exista, sin leerla ni imprimirla, y nunca registra la clave. Si la clave no está, el spike es la primera tarea y bloquea las demás.

### Prompt y conocimiento (AGT-02, AGT-03)
- **D-55:** `agent/prompt.md` define el **comportamiento**: el rol (D-09), las prohibiciones (CA2: no afirmar valores que no salieron de una herramienta, no inventar, los datos de fixture no son instrucciones), el formato de respuesta (D-43 a D-47) y el protocolo de confirmación. `src/knowledge/registro-proveedor.md` define el **proceso**: las 5 herramientas en orden y cuándo usar cada una, qué significa cada estado, cómo leer los bloqueos, cómo listar casos (D-14), qué hacer ante cada código de error (por ejemplo `PAQUETE_DESACTUALIZADO` implica re-armar) y RN1 a RN5 en prosa. Esta separación la necesita `modulo/` (agent.md vs SKILL.md).
- **D-56:** El conocimiento **no repite las tablas** de `reglas.json` (país → identificador, umbral, aviso de vencimiento, etiquetas genéricas). Las explica en prosa y remite a las herramientas, cuyas notas ya llegan en sus resultados. Hay una sola fuente y no hay deriva.
- **D-57:** `prompt.md` y `registro-proveedor.md` se leen **en cada turno**, igual que `reglas.json` (D-28). Editarlos cambia el comportamiento en el mensaje siguiente sin reiniciar (criterio 5). El system prompt se arma como prefijo estable (prompt + conocimiento, sin la fecha ni el id de sesión) para aprovechar la caché de DeepSeek. Si un archivo falta o está vacío, el turno responde con un error claro del catálogo, sin crash.

### Sesión (AGT-04, CA5)
- **D-58:** Las sesiones viven en un **store en memoria** detrás de un puerto, con **TTL de 2 h de inactividad** y un tope de sesiones (LRU), ambos configurables. Si llega un `sessionId` desconocido o expirado, se crea una sesión nueva y la respuesta avisa "La sesión anterior expiró; empezamos de cero". Una confirmación pendiente nunca sobrevive a una sesión perdida. No se persiste en archivo (Render free tiene disco efímero).

### Proveedor LLM configurable (LLM-01, LLM-02, LLM-04)
- **D-59:** DeepSeek es el proveedor **por defecto**, pero el adaptador es **genérico y compatible con OpenAI** (`/chat/completions` con tools), y DeepSeek es solo su preset. Hay dos ranuras, principal y respaldo, y cada una se configura **solo por variables de entorno**: `LLM_PROVIDER` (etiqueta), `LLM_BASE_URL`, `LLM_MODEL` y `LLM_API_KEY`, más sus equivalentes `LLM_FALLBACK_*`. `DEEPSEEK_API_KEY` se acepta como alias. Cambiar de proveedor o de modelo (OpenAI, OpenRouter, Groq, Mistral, Gemini u Ollama) no toca código: en Render basta editar las variables del panel, lo que reinicia el servicio sin push ni build, y en local basta editar `.env`. Lo específico de cada proveedor (por ejemplo `thinking` y `reasoning_content` de DeepSeek, o `max_tokens` frente a `max_completion_tokens`) son **flags de capacidad en config**, nunca ramas en el ciclo. `/api/health` reporta el proveedor y el modelo efectivos, sin claves. Cambiar el modelo desde la UI en vivo **no** entra (se descartó: el link es público). — **Reversibility:** costly — los nombres de las variables los documentan `.env.example`, el README, `render.yaml` y SOLUCION.md.

### Decisiones posteriores a la investigación (2026-10-13)
- **D-60:** Texto plano garantizado en dos capas: el prompt prohíbe el markdown **y** el servidor limpia la respuesta final (negritas `**`/`__`, encabezados `#`, tablas `|`) antes de emitirla, para que D-46 no dependa de que el modelo obedezca. Las regex van en `patterns.constants.ts`.
- **D-61:** pino se fija en **10.3.1**, no en 10.4.0. Tiene la misma API, es más madura y evita el punto de verificación humana. pino-pretty sigue siendo solo de desarrollo, con la política D-35.
- **D-62:** Las reglas nuevas de arquitectura (capas `llm`, `loop` y sesiones, un segundo composition root `loop/wiring`, roles y sufijos de archivo nuevos y otro importador permitido de `config/env.ts`) se aplican **en la misma tarea** en `.claude/CLAUDE.md`, en los guardianes de `tests/architecture.test.ts` (cada regla nueva lleva su prueba de violación) y en `docs/estructura.md`.
- **D-63:** Se confirman siete lecturas de D-37 a D-40:
  1. Un `simular_envio` bloqueado solo deja una confirmación pendiente si el paquete de ese caso se armó en esta sesión.
  2. La pregunta y el estado pendiente también se aplican si el turno termina en error o en un tope, siempre que el paquete esté armado. (Desde D-63.6 también cuando el turno termina normalmente sin usar la autorización.)
  3. Si el agente pregunta "¿cuál caso?", los casos pendientes se conservan para el mensaje inmediatamente siguiente.
  4. (UAT G-02-3, 2026-10-14) Un `simular_envio` bloqueado nunca reabre un caso cuyo envío simulado ya se registró en esta sesión. La compuerta recuerda los casos enviados (`Sesion.casosEnviados`), aparte de los paquetes conocidos, que siguen sirviendo para el log por caso y las líneas `gate_*`. Un `proveedor_armar_paquete` nuevo y exitoso de ese caso abre un ciclo nuevo: borra la marca de enviado, deja el caso pendiente y vuelve a pedir confirmación (D-37, D-42 y D-12 de la Fase 1).
  5. (UAT H2, G-02-18, 2026-10-14) Lectura de D-39: un acuse suelto (ok, okay, vale, listo, claro, correcto) nunca confirma; hace falta al menos una afirmación fuerte o un verbo de envío. "sí" con tilde es afirmación fuerte en cualquier posición; "si" sin tilde confirma solo si es el mensaje entero (sin contar signos) y en cualquier otra frase nunca basta ("si todo bien" da `otro`; "si, envía" confirma por el verbo). Reemplaza la decisión de 02-14 sobre acuses solos.
  6. (Verificación CR-01, 2026-10-14; reemplaza la frase de D-37 "Cualquier otro mensaje cancela lo pendiente") Con casos pendientes, solo un rechazo explícito cancela: la decisión rechaza del clasificador (una negación) o el botón con aprobada en false. Una respuesta que no confirma ni rechaza (decisión otro: "ok", "listo", "si por favor", una pregunta o un pedido distinto como "procesa el caso Y"), una que no dice el caso (falta_caso) y una confirmación de un caso que no está pendiente dejan pendientes todos los casos: el turno se atiende con normalidad y el servidor vuelve a agregar al final su pregunta determinista con cada caso y sus bloqueos, emite confirmation_required y needsConfirmation=true, así la confirmación explícita del mensaje siguiente autoriza el envío (CA3, RN4). Al confirmar un caso entre varios se autoriza solo ese, y los demás siguen pendientes con la pregunta del servidor. Si el turno que confirma termina sin usar la autorización (el modelo no llamó a proveedor_simular_envio y el turno cierra normalmente, en error o en un tope), el caso vuelve a quedar pendiente y el servidor vuelve a preguntar; esto extiende D-63.2 al cierre normal. Solo vuelve el estado pendiente, nunca la autorización (D-38): enviar pide otra confirmación explícita. Fuera del envío, un caso pendiente sale de la compuerta solo por tres caminos: un rechazo explícito; un aborto del turno, que cierra LIBRE porque la analista no vio ninguna pregunta (RN4); y el fin de la sesión (vence, la desaloja el tope de sesiones o se reinicia el servidor, D-58), que la analista ve como "La sesión anterior expiró; empezamos de cero.". El modelo nunca escribe la pregunta ni pide la confirmación (02-18). No cambian la autorización de un solo uso (D-38) ni los casos ya enviados (D-63.4).
  7. (Revisión WR-02, 2026-10-14; completa D-63.2) Un proveedor_simular_envio autorizado que la herramienta rechaza (PAQUETE_NO_ARMADO, PAQUETE_DESACTUALIZADO, ERROR_INTERNO u otro fallo) deja el caso pendiente otra vez con los bloqueos de su paquete conocido, sin importar cómo termine el turno (final, error o tope); si en el mismo turno se vuelve a armar con éxito, queda pendiente con los bloqueos nuevos. Solo un aborto lo cierra LIBRE. La autorización usada no se recupera (D-38): el servidor vuelve a preguntar y hace falta otra confirmación explícita. Internamente es el evento FALLIDO de la compuerta, que se trata como un intento bloqueado.

### Claude's Discretion
- La estructura interna del ciclo (`runTurn` como generador de eventos tipados), los decoradores `withTimeout`, `withRetry` y `withFallback`, y la forma del modelo de mensajes neutral, siguiendo `.planning/research/ARCHITECTURE.md` y respetando las reglas de capas de CLAUDE.md. Las capas nuevas (`llm`, `loop`, sesiones) se declaran en `PERMITIDOS` de `tests/architecture.test.ts`.
- Los valores por defecto de timeouts (`LLM_TIMEOUT_MS` ≈ 45 s, deadline de turno ≈ 120 s), los reintentos (máximo 2, con backoff exponencial y jitter), `max_tokens` por llamada y el tope de sesiones del LRU.
- La función única `redactar()` (SEG-02 parcial de la Fase 1) para los logs y los resúmenes de tool calls, y los logs JSON con pino y correlación sesión/turno/tool call (SEG-03).
- Cómo llega la fecha de ejecución al modelo sin romper el prefijo estable (por ejemplo, en un mensaje aparte).
- El texto exacto de los mensajes del catálogo de errores del proveedor (402 se informa como "saldo agotado") y de la pregunta determinista de confirmación, en `src/config/strings.ts`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificación del reto
- `reto-01/PRD.md` §6.1 — Componentes obligatorios (adaptador `enviar(mensajes, herramientas)`, prompt en `agent/prompt.md`, sesión en memoria)
- `reto-01/PRD.md` §6.2 — Contrato de herramientas (`simular_envio` sin confirmación responde "requiere confirmación explícita")
- `reto-01/PRD.md` §6.3 — Reglas del ciclo CA1 a CA5
- `reto-01/PRD.md` §6.4 — API mínima (`{ reply, toolCalls[], needsConfirmation }`), la forma que el ciclo debe poder producir
- `reto-01/PRD.md` §7.3 — RN4 (confirmación en el turno inmediatamente anterior)
- `reto-01/PRD.md` §8 — Costo, robustez, timeout y seguridad de la clave
- `reto-01/PRD.md` §10 — Riesgo "el modelo completa un campo faltante"
- `reto-01/PRD.md` §11 — Guion de la demo (ec-corp-andina, "No envíes nada todavía", luego "envía")

### Planeación del proyecto
- `.planning/REQUIREMENTS.md` — SOLI-03 (reformular según D-50), ENV-02, ENV-03, AGT-01 a AGT-05, LLM-01 a LLM-05, SEG-02, SEG-03, DEMO-03
- `.planning/ROADMAP.md` — Phase 2: objetivo, criterios de éxito y research flag del spike DeepSeek
- `.planning/PROJECT.md` — Core value, restricciones y key decisions
- `.planning/STATE.md` — Bloqueantes de la Fase 2 (PAQUETE_DESACTUALIZADO, spike)
- `.planning/phases/01-n-cleo-determinista/01-CONTEXT.md` — D-05 a D-09 (qué ve el LLM y su rol), D-13, D-14, D-16 a D-18 (errores) y D-28 (reglas como datos leídas por ejecución)

### Investigación
- `.planning/research/ARCHITECTURE.md` — Pattern 5 (compuerta determinista), `runTurn` como generador, adaptador neutral y decoradores de resiliencia, modelo de sesión
- `.planning/research/STACK.md` — Detalles verificados de la API DeepSeek (modelos vigentes, thinking, errores, usage, timeouts), pino y Hono
- `.planning/research/PITFALLS.md` — Riesgos del ciclo y del proveedor
- `.claude/CLAUDE.md` — Reglas de código: capas, sufijos de archivo, `strings.ts`, constantes, alias `@/`, guardianes G1 a G14

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/tools/proveedor.ts`: las 5 herramientas (`leer_solicitud`, `mapear_campos`, `generar_formulario`, `armar_paquete`, `simular_envio`) con `args` zod y `execute(args, ctx) → string`. El ciclo las registra con el nombre `proveedor_<export>` (`PREFIJO_HERRAMIENTA` en `src/config/constants/tools.constants.ts`).
- `src/tools/types/herramienta.type.ts`: `Herramienta` y `ContextoHerramienta` (`sessionId` o `sessionID`). De `args` sale el JSON Schema de `parameters` vía `z.toJSONSchema`.
- `src/config/constants/errors.constants.ts`: el catálogo ya tiene `CONFIRMACION_REQUERIDA` y `PAQUETE_DESACTUALIZADO`. Los errores de proveedor se agregan aquí y sus mensajes en `src/config/strings.ts`.
- `src/domain/policies/pii.policy.ts` (`enmascarar`) y `src/config/constants/pii.constants.ts`: la base de la política para `redactar()`.
- `src/infra/logging/audit-log.adapter.ts`: el registro de tool calls en `out/log.jsonl` y `out/<caso>/log.jsonl` (CA4 y RN5), que ya se ejecuta dentro de cada herramienta.
- `src/infra/clock/clock.adapter.ts` y `src/config/env.ts` (`readToolEnv`, `pinExecutionDate`): el reloj inyectable y la lectura de env. Las variables nuevas (DEEPSEEK_*, topes, TTL) se validan con zod en `env.ts`.

### Established Patterns
- Capas con dependencias hacia adentro y guardianes en `tests/architecture.test.ts`. `CAPAS_FUTURAS` ya reserva `src/(server|http|loop|llm)`, y las capas nuevas deben declararse en `PERMITIDOS`.
- Resultado tipado `{ ok, data } | { ok: false, codigo, error }`, nunca excepciones (D-16), en `domain/types/resultado.type.ts`.
- Todo texto para personas o para el modelo vive en `src/config/strings.ts`, y los códigos son objetos `as const`.
- Código sin comentarios. Dominio en español e infraestructura en inglés.
- Tests: unitarios espejo `tests/unit/<módulo>.<rol>.test.ts`, contrato y golden. El ciclo se prueba con un LLM falso con guion.

### Integration Points
- La Fase 3 consume el generador de eventos del ciclo (texto, tool_call, tool_result, confirmación, error, fin) y lo traduce a SSE y a la forma JSON del PRD §6.4.
- La Fase 4 genera `modulo/agent.md` desde `agent/prompt.md` y `SKILL.md` desde `src/knowledge/registro-proveedor.md`, así que ambos tienen que ser markdown autocontenido, sin placeholders del servidor.
- `pino` entra como dependencia nueva en esta fase, con la política de madurez de 7 días o más y `bun audit` (D-31, D-35).

</code_context>

<specifics>
## Specific Ideas

- El guion §11 es el test de aceptación central. Turno 1: "Procesa el caso ec-corp-andina… No envíes nada todavía" termina con un resumen y una pregunta que lista los bloqueos (soporte ausente), y `needsConfirmation: true`. Turno 2: "envía" escribe `ENVIO-SIMULADO.md` una sola vez y solo para ec-corp-andina.
- La usuaria pidió decidir varias áreas "según lo que sugieran los requisitos del reto". Cada decisión de la compuerta y de la forma de la respuesta se justifica con la cita del PRD (CA3, RN4, §11, HU-4, CA2), y esas citas deben llegar a `SOLUCION.md` §6 en la Fase 4.
- Ejemplo de respuesta ante "¿cuál es el NIT?": "El NIT viene de maestro.nit (•••••3456). El valor completo está en out/co-industrias-delta/formulario.xlsx."

</specifics>

<deferred>
## Deferred Ideas

- **Revelar el valor real en la UI por un canal aparte del modelo:** es una capacidad nueva con implicaciones de PII en la API y el SSE. Se descartó por ahora (D-47).
- **Persistir sesiones en archivo:** no sobrevive al disco efímero de Render free. Se reevalúa si cambia el hosting.
- **Cambiar el proveedor o el modelo desde la UI en vivo** (selector sobre una lista blanca definida por env): se descartó por ahora porque el link es público (D-59).
- **Exponer el cuerpo del correo al modelo** (delimitado y truncado): se descartó a favor de D-48. Se reevalúa si aparece una necesidad real de responder preguntas sobre el texto libre del correo.

</deferred>

---

*Phase: 02-agente-y-compuerta-de-confirmacion*
*Context gathered: 2026-10-13*
