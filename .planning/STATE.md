---
gsd_state_version: "1.0"
current_phase: 02
current_phase_name: Agente y compuerta de confirmación
status: executing
stopped_at: Completed 02-09-PLAN.md
last_updated: "2026-10-13T21:32:00.596Z"
last_activity: 2026-10-13
last_activity_desc: Phase 02 execution started
state_head: db84e60d952e86bb6e064a9e45824908b808d13f
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 29
  completed_plans: 24
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-13)

**Core value:** El agente nunca inventa un dato: cada valor sale de una herramienta tipada que lo lee del maestro, y ninguna acción externa ocurre sin confirmación humana explícita.
**Current focus:** Phase 02 — Agente y compuerta de confirmación

## Current Position

Phase: 02 (Agente y compuerta de confirmación) — READY TO EXECUTE
Plan: 9 of 9
Status: Ready to execute
Last activity: 2026-10-13 — Phase 02 execution started

Progress: [███░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 15 | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 3min | 2 tasks | 9 files |
| Phase 01 P02 | 6min | 3 tasks | 14 files |
| Phase 01 P03 | 6min | 3 tasks | 17 files |
| Phase 01 P04 | 6min | 2 tasks | 10 files |
| Phase 01 P05 | 6min | 2 tasks | 19 files |
| Phase 01 P06 | 2min | 2 tasks | 14 files |
| Phase 01 P07 | 5min | 2 tasks | 18 files |
| Phase 01 P08 | 6min | 2 tasks | 17 files |
| Phase 01 P09 | 8min | 2 tasks | 18 files |
| Phase 01 P10 | 4min | 2 tasks | 16 files |
| Phase 01 P11 | 5min | 2 tasks | 7 files |
| Phase 01 P12 | 4min | 2 tasks | 6 files |
| Phase 01 P13 | 4min | 2 tasks | 8 files |
| Phase 01 P14 | 3min | 2 tasks | 10 files |
| Phase 01 P15 | 3 min | 2 tasks | 4 files |
| Phase 02 P01 | 12 min | 2 tasks | 28 files |
| Phase 02 P02 | 6 min | 2 tasks | 15 files |
| Phase 02 P03 | 6 min | 2 tasks | 14 files |
| Phase 02 P04 | 5 min | 2 tasks | 18 files |
| Phase 02 P05 | 3 min | 2 tasks | 9 files |
| Phase 02 P06 | 10 min | 3 tasks | 29 files |
| Phase 02 P07 | 4 min | 2 tasks | 10 files |
| Phase 02 P08 | 13 min | 3 tasks | 32 files |
| Phase 02 P09 | 6 min | 2 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: `FECHA_EJECUCION` configurable por env (por defecto, la fecha real en America/Bogota). `demo.ts`, los tests y la instancia de la defensa fijan 2026-09-03.
- [Init]: Se puede "enviar" un paquete bloqueado tras confirmación explícita, y los bloqueos quedan registrados en `ENVIO-SIMULADO.md` (guion §11 con ec-corp-andina).
- [Init]: El caso portal devuelve `ok: true` con el aviso "formato no soportado" y el flujo sigue hasta el paquete.
- [Init]: `borrador-correo.md` es una respuesta al cliente (`solicitud.de`, "RE: <asunto>") y nunca lleva datos bancarios.
- [Roadmap]: El layout de `modulo/` (rutas canónicas de prompt, conocimiento y herramientas sin imports del servidor) se respeta desde la Phase 1, aunque `modulo/` se construye en la Phase 4.
- [Phase 01]: 01-01: Supply-chain gate approved with D-35 pins unchanged; Bun upgraded to 1.4.3 before first install
- [Phase 01]: 01-01: Any src/ folder outside the architecture layer table fails tests/architecture.test.ts; new layers must be declared in PERMITIDOS
- [Phase 01]: 01-02: Tool contract v1 locked as option-a (uniform parcial carrier); codigo/parcial/resumen are additive supersets of PRD 6.2
- [Phase 01]: 01-02: caso regex reaches application via Entorno.patronCaso; node:path only in infra; Plantilla discriminated by tipo; ports return Lectura<T>
- [Phase 01]: 01-03: crearEntorno returns {registrar, entorno: Resultado<Entorno>}; invalid env is still logged globally
- [Phase 01]: 01-03: defineTool re-resolves the caso after the use case to decide the per-caso log; listarCasos offers only real directories
- [Phase 01]: 01-03: formatearIssues lives in src/tools/issues.ts, shared by defineTool and wiring
- [Phase 01]: 01-04: SWIFT mask follows D-07 last-4 (COLOCOBM gives ••••COBM); the plan literal ••••OCBM was a typo
- [Phase 01]: 01-04: mapearCampos computes moneda/ano/pais/identificador itself; variablesNota only adds allowlisted extras (pais_emisor) and cannot override them
- [Phase 01]: 01-04: multiple notes on a field join with '. '; RN1 leaves propuesta null; clave_directa is single-segment only
- [Phase 01]: 01-05: CAMPOS_FUERA_DE_PLANTILLA carries parcial.etiquetas_esperadas plus parcial.indices_fuera_de_plantilla (positions only, never the unknown text)
- [Phase 01]: 01-05: Application addresses output files by the ArchivoSalida key; writers run inside entorno.candado(caso) and call entorno.salida.escribir, which returns the relative path
- [Phase 01]: 01-05: reglas.json is loaded per execution via cargarReglas (z.literal version, REGLAS_INVALIDAS with key path); crearHerramientas({ directorioConocimiento }) is the code-only seam
- [Phase 01]: 01-05: For a subset request conteo counts the returned subset; mapeo.json always persists the full canonical mapping and a bad subset writes nothing
- [Phase 01]: 01-06: leer_solicitud loads reglas.json after the case loads, so CASO_*/DATOS_INVALIDOS/PLANTILLA_INVALIDA take precedence over REGLAS_INVALIDAS
- [Phase 01]: 01-06: detectarAmbiguos keeps template label text and order and looks up por_pais with Object.hasOwn (unknown country gives propuesta null)
- [Phase 01]: 01-07: generar_formulario recomputes the canonical mapping, compares the rutas-only mapping (compararMapeo, per-label multiplicity) before writing or cleaning, and re-reads every value from the maestro
- [Phase 01]: 01-07: xlsx marks are FFFFC7CE faltante / FFFFEB9C por confirmar, centralized in MARCAS_XLSX with the D-01 note and AUTOR_DOCUMENTOS
- [Phase 01]: 01-07: limpiarArtefactosPrevios (D-12) uses the writer's realpath containment; only ENOENT counts as absent
- [Phase 01]: PDF layout: A4 two columns (label 190pt, value 290pt), Helvetica 10/12pt, [FALTANTE] rgb(0.75,0,0), [POR CONFIRMAR] rgb(0.8,0.5,0), final Notas section; constants in DISENO_PDF/TEXTOS_PDF
- [Phase 01]: PDF metadata fixed to registro-proveedor and FECHA_EJECUCION 00:00Z; renders are byte-identical
- [Phase 01]: Knowledge templates load per call via Entorno.plantillas.cargar(reglas, clave) and render against a code-built allowlisted context (valores-portal: caso, cliente, fecha_ejecucion, aviso, campos, pendientes)
- [Phase 01]: generar_formulario presents aviso only for portal: {ruta, formato, aviso: 'formato no soportado'}; xlsx/pdf stay {ruta, formato}
- [Phase 01]: 01-09: Port salida.copiar(caso, origen: OrigenCopia) derives the destination from a typed origin; copiarAlPaquete realpath-checks it inside repositorio/soportes or out/<caso> outside paquete/
- [Phase 01]: 01-09: evaluarSoportes returns Resultado because the D-22 emitter warning renders from reglas.json; ausente soportes carry archivo and vigencia null and render as —
- [Phase 01]: 01-09: armar_paquete renders checklist.md before touching disk, then recreates only paquete/; index.json entries cannot use reserved paquete names or impossible dates
- [Phase 01]: 01-10: borrador-correo.md reads only RUTAS_BORRADOR (razon_social, contacto_financiero.nombre/cargo); vencido soportes join pendientes and are never announced as attached
- [Phase 01]: 01-10: simular_envio order is caso guard (cargarSolicitudCaso), confirmado, paquete/checklist.md, then completarContextoCaso; it writes only ENVIO-SIMULADO.md with bloqueos recomputed at confirmation
- [Phase 01]: 01-10: ports salida.nombre and salida.listarPaquete let application name the formulario and list paquete/ without importing config
- [Phase 01]: ejecutarDemo returns {fallido} and prints the reason instead of throwing outside a project root; nothing is deleted
- [Phase 01]: A failed demo case still gets a Resumen row with ERROR (<codigo>) as estado
- [Phase 01]: Determinism compares xlsx semantically, jsonl without ts and every other output by bytes; the PII scan has a minimum corpus size and a positive control in the formularios
- [Phase 01]: xlsx: ANCHO_COLUMNA_XLSX {minimo 10, maximo 60, margen 2}; ancho por columna usada = clamp(largo en puntos de código + margen); wrapText solo si largo + margen > maximo (GC-4, G-01-H1)
- [Phase 01]: 01-13: Borrador firma state from the checklist alone: firma_lista (listo y nada por confirmar), firma_tras_confirmar (listo con por confirmar), firma_bloqueada (no listo); no signed claim (GC-1, G-01-H4b)
- [Phase 01]: 01-13: Portal: valores-portal.md is the analyst's guide, never attached in the borrador nor listed as sent in ENVIO-SIMULADO.md
- [Phase 01]: 01-13: ENVIO-SIMULADO sent list = formulario xlsx/pdf + presente soportes intersected with the real paquete/ listing; checklist.md and borrador-correo.md never listed (GC-3, G-01-H4a)
- [Phase 01]: 01-13: PAQ-04 wording 'lista el formulario firmado' superseded by GC-1; requirement text left for orchestrator to reconcile
- [Phase 01]: 01-14 (GC-2): nombres de soportes en NOMBRE_SOPORTE de strings.ts; TEXTO_SOPORTE.nombre usa Object.hasOwn y devuelve el id crudo si no existe; solo las salidas para personas (borrador, checklist) usan el nombre, y bloqueos, resumen, logs y demo conservan el tipo crudo
- [Phase 01]: 01-14: motivosDeBloqueo(soportes) exportado de checklist.builder.ts con los mismos bloqueos y orden que Checklist.bloqueos pero con nombres; lo reutiliza 01-15 para ENVIO-SIMULADO.md
- [Phase 01]: 01-15: los bloqueos de ENVIO-SIMULADO.md usan el nombre legible vía motivosDeBloqueo; data.bloqueos, resumen y log.jsonl de simular_envio conservan los ids crudos (contrato v1)
- [Phase 01]: 01-15: la guarda transversal (tests/golden/nombres-soporte.test.ts) prohíbe las claves de NOMBRE_SOPORTE con guion bajo en borrador, checklist y ENVIO-SIMULADO; junto con 01-14 cierra G-01-H4c
- [Phase 01]: Revisión de código (2 ciclos): simular_envio re-deriva el paquete esperado (archivos + borrador) desde el repositorio y rechaza con PAQUETE_DESACTUALIZADO si hay faltantes, sobrantes o borrador distinto; no compara checklist.md (lleva fecha); ignora .DS_Store/Thumbs.db/desktop.ini
- [Phase 01]: UAT (eli-qa run 2, 20/20): la consola de demo.ts conserva ids crudos de soporte (PRD §6.6); frase aprobada para validación bancaria interna: "Validaremos internamente algunos datos del formulario antes de pasarlo a la firma de nuestro representante legal."
- [Phase 02]: 02-01: el adaptador devuelve abortado antes de llamar a fetch si la señal ya está abortada
- [Phase 02]: 02-01: una respuesta con tool_calls cuenta como paso de herramientas aunque finish_reason no sea tool_calls (length gana como limite)
- [Phase 02]: 02-01: un respaldo sobre la URL de DeepSeek puede usar el alias DEEPSEEK_API_KEY; cualquier otra herencia de clave exige URL base idéntica
- [Phase 02]: 02-01: NIVELES_LOG es un objeto as const y, como BOOLEANO_ENV, está registrado en FAMILIAS_DE_CODIGOS
- [Phase 02]: 02-02: el almacén de sesiones registra la sesión nueva en abrir y nunca la desaloja por su propia creación; una sesión ocupada no expira ni se desaloja
- [Phase 02]: 02-02: el turno libera la sesión tras guardar el historial y antes de emitir turn_end; un turno rechazado por SESION_OCUPADA nunca libera
- [Phase 02]: 02-02: el reloj del agente relee el entorno de herramientas en cada llamada (clockFromToolEnv), así modelo y herramientas usan la misma fecha
- [Phase 02]: 02-03: el clasificador de confirmación es una gramática de lista blanca; la negación se evalúa primero y cualquier duda da otro, que nunca autoriza
- [Phase 02]: 02-03: abrirTurno con confirma de un caso no pendiente no autoriza y cancela a LIBRE; falta_caso conserva los casos
- [Phase 02]: 02-03: cerrarTurno solo vuelve pendiente un bloqueado si su paquete está en conocidos; el bucle debe registrar cada paquete armado en conocidos
- [Phase 02]: 02-03: necesitaPreguntaDeterminista exige que el último párrafo termine en ? y nombre cada caso pendiente
- [Phase 02]: 02-04: Retry-After honored only as a non-negative integer of seconds, capped at BACKOFF_TOPE_MS; HTTP dates fall back to full-jitter backoff
- [Phase 02]: 02-04: Missing provider usage is estimated as ceil(chars / CARACTERES_POR_TOKEN) so the session budget still bites
- [Phase 02]: 02-04: Resilience is three stateless decorators (withTimeout, withRetry, withFallback) with injected esperar/azar; fallback only after a retryable primary error and never on caller abort
- [Phase 02]: redactar() tracks ancestors, not all visited objects: only real cycles become [dato oculto], shared references survive
- [Phase 02]: redactar() turns an Error into { name, message } with secrets scrubbed and never throws (try/catch around the walk)
- [Phase 02]: createLogger emits the level label (formatters.level) and redacts child bindings too; pino 10.3.1 exact, no transport, no pino-pretty
- [Phase 02]: SEG-03 stays open until plan 02-08 wires the log points in the loop
- [Phase 02]: 02-06: el ciclo construye {caso, confirmado: true} desde la autorización y nunca reenvía los args del modelo; un simular_envio bloqueado devuelve el rechazo literal de la herramienta y escribe la línea CA4
- [Phase 02]: 02-06: revocarAlArmar se aplica a toda llamada a armar_paquete del caso, no solo a las ok; un envío autorizado que la herramienta rechaza consume la autorización
- [Phase 02]: 02-06: paquetesConocidos conserva el caso tras enviar, así un reintento bloqueado vuelve a preguntar en vez de enviar dos veces
- [Phase 02]: 02-06: cerrarTurnoConCompuerta limpia el markdown antes de decidir y agregar la pregunta; en error o tope el texto emitido es solo la pregunta y el historial guarda error + pregunta
- [Phase 02]: 02-07: una sesión sin presupuesto responde al abrir el turno con PRESUPUESTO_AGOTADO y cero llamadas; a mitad de turno cierra con tope_tokens, el mensaje y cierreDeterminista
- [Phase 02]: 02-07: al tope de iteraciones hay una sola llamada sin herramientas con instruccionTope al final (no persistida); si falla, pide herramientas, trae texto vacío o no cabe en el presupuesto, el servidor usa cierreDeterminista con motivo tope_iteraciones
- [Phase 02]: 02-07: ResultadoTope lleva la RespuestaLlm completa para que el evento usage conserve proveedor y modelo; todo uso pasa por acumularUso
- [Phase 02]: 02-08: los fallos por intento y el cambio de proveedor se registran vía OpcionesEnvio.observador (withObservacion entre withTimeout y withRetry; alCambiar recibe las opciones), así llm_error y llm_fallback llevan sesionId y turnoId
- [Phase 02]: 02-08: un aborto del llamante cierra con motivo abortado, sin evento error ni texto, guarda TURNO_INTERRUMPIDO y deja la compuerta LIBRE; el deadline del turno emite TIEMPO_TURNO_AGOTADO y cierra la compuerta normalmente
- [Phase 02]: 02-08: un turno abandonado se guarda en finally como usuario + pasos completos + TURNO_INTERRUMPIDO antes de liberar; un paso fin limite no ejecuta herramientas y responde ARGUMENTOS_TRUNCADOS por llamada
- [Phase 02]: 02-08: las líneas gate_* llevan caso solo si es un paquete armado por el servidor; CODIGO_AGENTE.TOPE_ITERACIONES y su mensaje se eliminaron por no tener emisor
- [Phase 02]: 02-09: el prompt nombra los soportes en palabras legibles derivadas del tipo; las herramientas conservan los ids crudos (contrato v1)
- [Phase 02]: 02-09: la pregunta de cierre es la última oración y no hay secciones fuera del formato D-43; los avisos de soportes presentes van en Soportes por actualizar
- [Phase 02]: 02-09: la prueba en vivo es opt-in solo por LLM_EN_VIVO; sin clave falla en la primera aserción y nunca se salta

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: El prompt del agente debe responder a `PAQUETE_DESACTUALIZADO` re-ejecutando `proveedor_armar_paquete`, mostrando el nuevo estado y pidiendo confirmación de nuevo (CR-01).
- [Phase 2]: Al enviar no se compara el contenido del formulario en `paquete/`; si el maestro cambia tras armar, el agente debe regenerar el formulario y re-armar antes de enviar.
- [Phase 2]: Hacer un spike en vivo con DeepSeek antes del ciclo (modelo vigente, thinking desactivado, `tool_choice`, forma de los errores).
- [Phase 3]: Hay que verificar con `curl -N` que el proxy de Render no bufferice el SSE apenas exista el endpoint.
- [Phase 3]: El servicio en Render free duerme por inactividad y su disco es efímero; hay que calentarlo antes de la defensa.
- [Phase 4]: SOLUCION.md debe explicar los ids canónicos en la consola de la demo y el `resumen` (WR-03), mover desde docs/plantillas.md la nota de NOMBRE_SOPORTE (IN-01) y registrar SEG-02 como parcial hasta que exista `redactar()`.
- [General]: PRD §10 no trae la tabla de puntos de la rúbrica; cada "debe/obligatorio/evaluamos" se trata como ítem y el supuesto va en SOLUCION.md §7.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-13T20:30:46.242Z
Stopped at: Completed 02-09-PLAN.md
Resume file: None
