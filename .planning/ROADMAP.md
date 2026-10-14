# Roadmap: Agente "Registro como Proveedor" (Reto 01 · Perxia 2.0)

## Overview

El trabajo va de adentro hacia afuera, por capas. Primero se construye un núcleo determinista: dominio puro, las 5 herramientas tipadas del PRD y `demo.ts`. Ese núcleo ya produce formularios, paquetes y logs correctos para los 4 casos sin gastar un token, y fija el contrato que todo lo demás consume. Encima va el agente: adaptador DeepSeek propio, ciclo con topes y una compuerta de confirmación que hace cumplir el servidor. Después, la capa HTTP/SSE y el chat React, desplegados temprano en Render para descubrir a tiempo los problemas de SSE y de arranque en frío. Al final, el bonus `modulo/` generado desde las mismas fuentes, la documentación de entrega y el ensayo de la defensa sobre el link público.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Núcleo determinista** - Dominio puro, las 5 herramientas `proveedor_*`, formularios xlsx/pdf/portal, paquete para firma, logs y `demo.ts` con golden tests, sin LLM (completed 2026-10-13)
- [ ] **Phase 2: Agente y compuerta de confirmación** - Adaptador DeepSeek con resiliencia, ciclo propio con topes, sesiones y compuerta de confirmación decidida por el servidor
- [ ] **Phase 3: Chat web, API SSE y despliegue** - API Hono con SSE y código de acceso, chat React con tool calls visibles y link público activo en Render
- [ ] **Phase 4: Módulo, documentación y defensa** - Bonus `modulo/` como fuente única, README, SOLUCION.md, CI y pre-flight de la defensa

## Phase Details

### Phase 1: Núcleo determinista

**Goal**: Cualquiera puede correr `bun run demo.ts` sin clave LLM y obtener, para los 4 casos, formularios, paquetes para firma y logs correctos y reproducibles. Cada valor sale de una herramienta tipada que lo lee del maestro, y ninguna inventa un dato.
**Depends on**: Nothing (first phase)
**Requirements**: HERR-01, HERR-02, HERR-03, HERR-04, HERR-05, SOLI-01, SOLI-02, MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, FORM-01, FORM-02, FORM-03, FORM-04, PAQ-01, PAQ-02, PAQ-03, PAQ-04, PAQ-05, ENV-01, SEG-02, SEG-04, DEMO-01, DEMO-02, DEMO-04, CAL-01, CAL-02, CAL-03, CAL-04
**Success Criteria** (what must be TRUE):
  1. `bun run demo.ts`, sin clave LLM, limpia `out/`, imprime la fecha efectiva 2026-09-03 y muestra por caso el resultado de la tabla de verdad: co 17/0/0 listo; ec 13/1/1 bloqueado por soporte ausente; hn 9/1/1 bloqueado por parafiscales vencidos; pa 8/0/1 listo por la vía del portal. Dos ejecuciones seguidas dan el mismo resultado, salvo timestamps.
  2. Los formularios abren con el contenido exacto. En `out/co-industrias-delta/formulario.xlsx`, cada etiqueta y valor están en la hoja y celda de `plantilla-celdas.json` (ambas hojas), con los ceros a la izquierda intactos. `out/ec-corp-andina/formulario.pdf` lista los campos en el orden de la plantilla, con una marca visible en faltantes y por confirmar. `out/pa-logistica-istmo/valores-portal.md` existe y la herramienta responde `ok: true` con el aviso "formato no soportado".
  3. Cada `out/<caso>/paquete/` trae el formulario, las copias de los soportes existentes, `checklist.md` (presentes, ausentes, vencidos, faltantes, por confirmar, fecha efectiva y avisos "vence en N días") y `borrador-correo.md`, dirigido a `solicitud.de` con asunto "RE: <asunto>" y sin datos bancarios. `out/<caso>/mapeo.json` traza cada valor con `ruta`, `regla` y `confianza`. Un grep de `71555123|03100012345|COLOCOBM` sobre los logs, los borradores y las respuestas de las herramientas no devuelve nada.
  4. Las 5 herramientas `proveedor_*` se importan sin servidor ni secretos y nunca lanzan. Con args inválidos, un `mapeo` que trae valores, un `caso` con path traversal, un caso inexistente o una plantilla corrupta devuelven `{ ok: false, error }` con código estable y mensaje en español, sin traza cruda. `simular_envio` sin confirmación devuelve "requiere confirmación explícita". Cada llamada queda registrada, con resumen redactado, en `out/log.jsonl` y en `out/<caso>/log.jsonl`.
  5. `bun run check` (tsc estricto sin `any` y con `noUncheckedIndexedAccess`, más Biome) y `bun test` pasan. Eso incluye los golden tests por caso, los fixtures sintéticos de `tests/fixtures/` (una etiqueta ambigua da `requiere_confirmacion` con el equivalente del país) y el test de arquitectura que verifica la dirección de los imports. El código no tiene comentarios, y las constantes y la configuración viven centralizadas y validadas con zod.

**Plans:** 15/15 plans complete

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Compuerta de cadena de suministro y runtime (con la actualización opcional de Bun), `reto-01/` versionado intacto, toolchain fijado y guardas de arquitectura y sin comentarios

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Compuerta del contrato de herramientas (D-11, D-16) y trazador: invocador → `proveedor_leer_solicitud` → config → fixtures validados → dominio → JSON, con sus estados de error

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Expansión del trazador: resolución con realpath, listado de casos (D-14), plantilla corrupta (D-17), env por ejecución, reloj inyectable, ambos `log.jsonl` y `demo.ts` mínimo

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-04-PLAN.md — Motor puro de mapeo: `reglas.json` como datos, normalización, motor de plantillas, glosario/RN1/etiquetas genéricas y política de PII en código

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 01-05-PLAN.md — `proveedor_mapear_campos` de punta a punta para los 4 casos, con `mapeo.json` sin valores, candado por caso y subconjuntos (D-15)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 01-06-PLAN.md — `ambiguos` en `leer_solicitud`, fixtures sintéticos, reglas inválidas o editadas en caliente y concurrencia

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 01-07-PLAN.md — `proveedor_generar_formulario` en xlsx con recálculo canónico del mapeo (D-11) y limpieza al reprocesar (D-12)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 01-08-PLAN.md — `generar_formulario` en pdf (marcas WinAnsi, determinista) y portal (`valores-portal.md` desde plantilla editable)

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 01-09-PLAN.md — `proveedor_armar_paquete`: vigencias, evaluación de soportes, copias y `checklist.md`

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 01-10-PLAN.md — Borrador de correo sin datos bancarios, `proveedor_simular_envio` con confirmación explícita y guarda de exactamente 5 exportaciones

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 01-11-PLAN.md — `demo.ts` completo con la tabla de verdad, prueba de determinismo y grep de PII con control positivo

**Cierre de brechas de la UAT, Wave 1** *(gap closure)*
- [x] 01-12-PLAN.md — Anchos de columna del xlsx calculados a partir del texto escrito en cada columna usada, con tope y wrapText (G-01-H1)
- [x] 01-13-PLAN.md — `ENVIO-SIMULADO.md` solo lista lo que va al cliente. El borrador depende del estado, nunca afirma una firma y pregunta por los campos por confirmar (G-01-H4a, G-01-H4b)

**Cierre de brechas de la UAT, Wave 2** *(blocked on 01-13)*
- [x] 01-14-PLAN.md — Nombres legibles de los soportes, tomados de `strings.ts`, en el borrador y el checklist. Los datos de las herramientas conservan el `tipo` (G-01-H4c)

**Cierre de brechas de la UAT, Wave 3** *(blocked on 01-14)*
- [x] 01-15-PLAN.md — Bloqueos de `ENVIO-SIMULADO.md` con nombres legibles y guarda transversal: ningún id snake_case en las salidas para personas y cobertura de la tabla de nombres sobre los fixtures (G-01-H4c)

### Phase 2: Agente y compuerta de confirmación

**Goal**: Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Depends on**: Phase 1
**Requirements**: SOLI-03, ENV-02, ENV-03, AGT-01, AGT-02, AGT-03, AGT-04, AGT-05, LLM-01, LLM-02, LLM-03, LLM-04, LLM-05, SEG-03, DEMO-03
**Success Criteria** (what must be TRUE):
  1. Con la clave de DeepSeek en env, "procesa el caso co-industrias-delta" ejecuta las herramientas en secuencia por el ciclo propio, sin framework de agentes, y responde en español solo con resultados que salieron de las herramientas. El modelo (`deepseek-flash` leído de env, thinking desactivado) solo recibe rutas y valores enmascarados.
  2. "No envíes nada todavía" nunca autoriza un envío. En el guion §11, el agente procesa el caso, termina el turno con una pregunta que lista los bloqueos, y la confirmación explícita en el mensaje inmediatamente siguiente escribe `ENVIO-SIMULADO.md` una sola vez y solo para ese caso. Que el modelo pase `confirmado: true` por su cuenta nunca basta.
  3. Ante un timeout, un 429/503 o un error de red del proveedor, el agente reintenta con backoff o cae al modelo de respaldo. Si aun así falla, muestra un mensaje claro en español (un 402 se informa como "saldo agotado"), y el siguiente mensaje de la misma sesión funciona con el historial íntegro (CA5).
  4. Al llegar al tope de iteraciones (25 por defecto) o al de tokens por sesión, el usuario recibe en lenguaje claro lo que se tiene y lo que falta, no un error. Una instrucción inyectada en el cuerpo del correo del cliente no cambia el comportamiento del agente.
  5. Un cambio en `src/knowledge/registro-proveedor.md` o en `agent/prompt.md` cambia el comportamiento del agente sin tocar código del servidor. Los logs JSON llevan IDs de sesión, turno y tool call, sin clave ni PII. `bun test` cubre el ciclo con un LLM falso (tope, compuerta con "No envíes…" y el guion §11, CA5 e inyección) sin gastar tokens.

**Plans:** 19/21 plans executed

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Trazador: "procesa el caso" de punta a punta por el ciclo propio, el adaptador genérico compatible con OpenAI y la herramienta real; capas `llm`/`loop` con sus guardianes (D-62) y contrato de entorno D-59 completo

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-02-PLAN.md — `crearAgente` como composition root, sesiones en memoria con TTL, LRU y candado, mensaje aparte con la fecha efectiva y aviso de sesión expirada
- [x] 02-03-PLAN.md — Compuerta en el dominio: clasificador determinista con negaciones (43 frases), máquina de estados de un solo paso y pregunta de cierre determinista
- [x] 02-04-PLAN.md — Resiliencia del proveedor: taxonomía de errores sin eco de la clave, timeout, reintentos con backoff y fallback de modelo
- [x] 02-05-PLAN.md — `redactar()` única y logs JSON con pino 10.3.1 y correlación sesión/turno/tool call

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 02-06-PLAN.md — Compuerta aplicada en el ciclo: guion §11, casos D-38 a D-63, botón estructurado, texto plano con limpieza determinista del servidor (D-60), forma PRD 6.4 e inyección con fixture sintético

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 02-07-PLAN.md — Topes con respuesta clara: presupuesto de tokens por sesión y tope de iteraciones con llamada de resumen sin herramientas y cierre determinista

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 02-08-PLAN.md — CA5 con decoradores compuestos y respaldo de modelo, deadline de turno, abortos y argumentos truncados, y bitácora JSON integrada

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 02-09-PLAN.md — `agent/prompt.md` y `registro-proveedor.md` finales, edición en caliente, PII hacia el modelo, redacción de requisitos D-59 y corrida en vivo obligatoria (criterio 1 y guion §11) con línea de evidencia VIVO PASS

**Cierre de brechas de la verificación, Wave 1** *(gap closure)*
- [x] 02-10-PLAN.md — Con un caso pendiente, la pregunta del servidor siempre cierra el turno y lista los bloqueos legibles; la pregunta final del modelo se quita cortando solo en fin de oración (CR-02)
- [x] 02-11-PLAN.md — Un paso cortado por `finish_reason=length` se guarda con argumentos JSON válidos, y el mapeador nunca envía argumentos que no sean un objeto JSON (CR-03)

**Cierre de brechas de la verificación, Wave 2** *(02-12 blocked on 02-11; 02-14 blocked on 02-10)*
- [x] 02-12-PLAN.md — Candado de sesión con lease atado a `AGENT_TURN_DEADLINE_MS` y token de propiedad: un consumidor que abandona el turno ya no bloquea ni pisa la sesión (WR-03)
- [x] 02-14-PLAN.md — El clasificador deja de aceptar el sustantivo "envío" y los acuses con relleno, y la pregunta del servidor promete solo lo que el clasificador acepta (CR-01)

**Cierre de brechas de la verificación, Wave 3** *(blocked on 02-10, 02-12 and 02-14)*
- [x] 02-13-PLAN.md — Un turno de confirmación que falla antes de enviar conserva el caso pendiente y termina con la pregunta del servidor; nueva corrida en vivo con línea VIVO PASS (WR-02)

**Cierre de brechas de la UAT, Wave 1** *(gap closure)*
- [x] 02-15-PLAN.md — Un caso ya enviado no se reabre con un reintento bloqueado del modelo; solo un armado nuevo abre otro ciclo y vuelve a pedir confirmación (G-02-3, D-63.4)
- [x] 02-17-PLAN.md — Los errores de configuración al crear el agente terminan en un solo punto y no prometen una sesión abierta (G-02-19)

**Cierre de brechas de la UAT, Wave 2** *(blocked on 02-15)*
- [x] 02-16-PLAN.md — Un acuse suelto o un "si" condicional ya no autorizan el envío; "sí" con tilde en cualquier posición y "si" como mensaje entero sí confirman (G-02-18, D-63.5)

**Cierre de brechas de la UAT, Wave 3** *(blocked on 02-15, 02-16 and 02-17)*
- [x] 02-18-PLAN.md — `agent/prompt.md` y el conocimiento siguen la compuerta del servidor (pregunta de cierre del servidor, turno de confirmación breve, acuses que no confirman) y una corrida en vivo final con línea VIVO PASS (G-02-21)

**Cierre de brechas de la re-verificación, Wave 1** *(gap closure)*
- [x] 02-19-PLAN.md — Una respuesta que no confirma ("ok", "listo", una pregunta o un pedido distinto) deja el caso pendiente y el servidor vuelve a preguntar con `needsConfirmation`; solo un rechazo explícito cancela, y el prompt ya no le pide al modelo pedir la confirmación (CR-01, D-63.6)

**Cierre de brechas de la re-verificación, Wave 2** *(blocked on 02-19)*
- [ ] 02-20-PLAN.md — Un envío autorizado que falla vuelve a dejar el caso pendiente con la pregunta del servidor (WR-02, D-63.7), y el mensaje de arranque con varios errores de configuración termina en un solo punto (WR-01)

**Cierre de brechas de la re-verificación, Wave 3** *(blocked on 02-19 and 02-20)*
- [ ] 02-21-PLAN.md — La prueba en vivo revisa la clave también en los cuerpos de los pedidos y recorre "ok" → "sí"; una corrida en vivo final con línea VIVO PASS (nota 1 de SECURITY)

**Research flag**: Spike en vivo con DeepSeek antes de construir el ciclo: nombre de modelo vigente, thinking desactivado, `tool_choice`, forma de los tool calls y de los errores. La línea de modelos cambió 3 veces en 2026 y `deepseek-chat`/`deepseek-reasoner` se retiraron el 2026-07-24.

### Phase 3: Chat web, API SSE y despliegue

**Goal**: La analista abre el link público en Render, ingresa el código de acceso y conversa con el agente en un chat React que muestra en vivo cada tool call, el estado de confirmación, el resultado por caso y los archivos generados.
**Depends on**: Phase 2
**Requirements**: API-01, API-02, API-03, API-04, API-05, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, LLM-06, SEG-01, DEP-01, DEP-02
**Success Criteria** (what must be TRUE):
  1. `bun run dev` levanta front y backend con un solo comando, en menos de 2 minutos, en una máquina limpia con las variables de `.env.example`. El link público en Render (servicio Docker único, `FECHA_EJECUCION=2026-09-03`) responde `GET /api/health` con `{ ok, provider, model }` sin claves, y `curl -N` contra `POST /api/chat` recibe los eventos SSE en vivo, sin buffering.
  2. En el chat, la analista ingresa el código de acceso una sola vez, ve la fecha de ejecución efectiva y escribe "procesa el caso X" o usa un chip de acción rápida. Ve el indicador "pensando" con la herramienta en curso, cada tool call como tarjeta colapsable (nombre, args redactados, resultado resumido y estado), el progreso del caso por etapas y una tarjeta de resultado con contadores lleno/faltante/por confirmar, el badge `listo_para_firma`, los bloqueos y la ruta de salida.
  3. Cuando el agente pide confirmación, la UI muestra una tarjeta con caso, acción y bloqueos, más los botones Confirmar y Cancelar. Los errores de herramienta o de proveedor aparecen en lenguaje claro y la sesión sigue usable. Al recargar el navegador, el historial vuelve desde `GET /api/sessions/:id` con la PII redactada, y "Nueva sesión" empieza de cero.
  4. Desde el panel de artefactos, la analista descarga o previsualiza los archivos generados del caso; solo se sirven nombres en lista blanca y detrás del código de acceso. Si no hay clave, se agotó el saldo o el proveedor cayó, `/api/health` lo reporta y la UI deja correr el flujo determinista de un caso.
  5. Sin código de acceso, la API rechaza toda petición salvo `/api/health`. El rate limit por IP y el límite de tamaño de mensaje responden con un mensaje claro. Un test verifica que la clave del LLM no aparece en `web/dist`, en las respuestas de la API ni en el stream SSE.

**Plans**: TBD
**UI hint**: yes
**Research flag**: SSE a través del proxy de Render (los reportes de la comunidad se contradicen) y comportamiento de Bun cuando el cliente se desconecta. Desplegar apenas exista el endpoint SSE y probar con `curl -N`. Si bufferiza, usar el fallback JSON y luego Koyeb o Fly con el mismo Dockerfile.

### Phase 4: Módulo, documentación y defensa

**Goal**: Los evaluadores pueden reutilizar el agente como módulo desde la misma fuente que usa la app, entender y continuar la solución leyendo la documentación, y ver la defensa en vivo correr sobre el link público sin sorpresas.
**Depends on**: Phase 3
**Requirements**: MOD-01, MOD-02, DOC-01, DOC-02, DEP-03, DEMO-05, CAL-05
**Success Criteria** (what must be TRUE):
  1. `modulo/` contiene `agent.md`, `tools/proveedor.ts` y `skill/registro-proveedor/SKILL.md` con el frontmatter exigido. Tras editar `agent/prompt.md` o `src/knowledge/`, el script de generación los actualiza, y los tests de igualdad byte a byte, identidad de referencia e importación sin env pasan. Si hay deriva, fallan.
  2. Un dev nuevo levanta el proyecto siguiendo solo el `README.md` (un comando, variables de entorno, demo, link y código de acceso). `docs/arquitectura.md` y `docs/convenciones.md` le permiten retomar el trabajo, y el historial de git sigue Conventional Commits con la identidad `elianatorres5772`.
  3. `SOLUCION.md` tiene las 10 secciones obligatorias del PRD: el costo por caso calculado del `usage` real, el diseño del portal web (§7.4), al menos 3 trade-offs con la alternativa descartada, los supuestos (fecha de ejecución, envío con bloqueos y rúbrica ausente en §10), la cobertura por historia de usuario y el uso de IA.
  4. GitHub Actions corre `bun test`, `bun run demo.ts`, `tsc --noEmit` y lint en verde, y el README muestra el badge.
  5. El script de pre-flight calienta el servicio en Render y verifica health y SSE, y el guion §11 completo se ensaya con éxito sobre el link público.

**Plans**: TBD
**Research flag**: (ligero) Frontmatter de agente, herramienta y skill de OpenCode, y el campo `sessionID` de su contexto.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Núcleo determinista | 15/15 | Complete    | 2026-10-13 |
| 2. Agente y compuerta de confirmación | 19/21 | In Progress | - |
| 3. Chat web, API SSE y despliegue | 0/TBD | Not started | - |
| 4. Módulo, documentación y defensa | 0/TBD | Not started | - |
