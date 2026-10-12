# Roadmap: Agente "Registro como Proveedor" (Reto 01 · Perxia 2.0)

## Overview

El trabajo va de adentro hacia afuera, por capas. Primero se construye un núcleo determinista: dominio puro, las 5 herramientas tipadas del PRD y `demo.ts`. Ese núcleo ya produce formularios, paquetes y logs correctos para los 4 casos sin gastar un token, y fija el contrato que todo lo demás consume. Encima va el agente: adaptador DeepSeek propio, ciclo con topes y una compuerta de confirmación que hace cumplir el servidor. Después, la capa HTTP/SSE y el chat React, desplegados temprano en Render para descubrir a tiempo los problemas de SSE y de arranque en frío. Al final, el bonus `modulo/` generado desde las mismas fuentes, la documentación de entrega y el ensayo de la defensa sobre el link público.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Núcleo determinista** - Dominio puro, las 5 herramientas `proveedor_*`, formularios xlsx/pdf/portal, paquete para firma, logs y `demo.ts` con golden tests, sin LLM
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
**Plans:** 5 plans

Plans:
- [ ] 01-01-PLAN.md — Compuertas (cadena de suministro y contrato de herramientas) y trazador `demo.ts` → `proveedor_leer_solicitud` → fixtures → `out/log.jsonl`, con andamiaje y guardas de arquitectura y sin comentarios
- [ ] 01-02-PLAN.md — Mapeo al maestro: motor puro y política de PII, `proveedor_mapear_campos` con `mapeo.json` sin valores, reglas como datos y fixtures sintéticos
- [ ] 01-03-PLAN.md — `proveedor_generar_formulario` en xlsx, pdf y portal, con recálculo canónico del mapeo (D-11) y limpieza al reprocesar (D-12)
- [ ] 01-04-PLAN.md — `proveedor_armar_paquete` (vigencias, checklist, copias y borrador sin datos bancarios) y `proveedor_simular_envio` con confirmación explícita
- [ ] 01-05-PLAN.md — `demo.ts` completo con la tabla de verdad, prueba de determinismo y grep de PII con control positivo

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
**Plans**: TBD
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
| 1. Núcleo determinista | 0/5 | Planned | - |
| 2. Agente y compuerta de confirmación | 0/TBD | Not started | - |
| 3. Chat web, API SSE y despliegue | 0/TBD | Not started | - |
| 4. Módulo, documentación y defensa | 0/TBD | Not started | - |
