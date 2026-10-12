---
gsd_state_version: "1.0"
current_phase: 01
current_phase_name: Núcleo determinista
status: executing
stopped_at: Completed 01-08-PLAN.md
last_updated: "2026-10-12T22:51:00.908Z"
last_activity: 2026-10-12
last_activity_desc: Phase 01 execution started
state_head: 7da5fe70ff73344398e039c992935647289e5f60
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 11
  completed_plans: 8
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-12)

**Core value:** El agente nunca inventa un dato: cada valor sale de una herramienta tipada que lo lee del maestro, y ninguna acción externa ocurre sin confirmación humana explícita.
**Current focus:** Phase 01 — Núcleo determinista

## Current Position

Phase: 01 (Núcleo determinista) — EXECUTING
Plan: 9 of 11
Status: Ready to execute
Last activity: 2026-10-12 — Phase 01 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 2]: Hacer un spike en vivo con DeepSeek antes del ciclo (modelo vigente, thinking desactivado, `tool_choice`, forma de los errores).
- [Phase 3]: Hay que verificar con `curl -N` que el proxy de Render no bufferice el SSE apenas exista el endpoint.
- [Phase 3]: El servicio en Render free duerme por inactividad y su disco es efímero; hay que calentarlo antes de la defensa.
- [General]: PRD §10 no trae la tabla de puntos de la rúbrica; cada "debe/obligatorio/evaluamos" se trata como ítem y el supuesto va en SOLUCION.md §7.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-12T22:51:00.886Z
Stopped at: Completed 01-08-PLAN.md
Resume file: None
