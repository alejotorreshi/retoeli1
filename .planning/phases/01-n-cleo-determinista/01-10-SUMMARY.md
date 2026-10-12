---
phase: 01-n-cleo-determinista
plan: 10
subsystem: tools
tags: [borrador-correo, simular-envio, confirmacion, envio-simulado, herr-01, rn2, rn4, d-12, d-13, d-25, d-26, d-28]

requires:
  - phase: 01-08
    provides: "plantillas.cargar(reglas, clave) per-call template loader, claves borrador_correo and envio_simulado in reglas.json"
  - phase: 01-09
    provides: "armarPaquete, evaluarEstadoPaquete, Checklist, paquete/ allowlist, conCandadoCaso via entorno.candado"
provides:
  - "proveedor_simular_envio: {ruta: out/<caso>/ENVIO-SIMULADO.md, bloqueos}; CONFIRMACION_REQUERIDA with the literal 'requiere confirmación explícita'; PAQUETE_NO_ARMADO"
  - "out/<caso>/paquete/borrador-correo.md written by armar_paquete"
  - "RUTAS_BORRADOR, DatosBorradorCorreo, construirDatosBorrador, asuntoRespuesta, DatosEnvioSimulado, construirDatosEnvio (src/domain/borrador.ts)"
  - "completarContextoCaso (src/application/contexto-caso.ts)"
  - "Entorno.salida.nombre(archivo) and Entorno.salida.listarPaquete(caso); existe accepts any output key"
  - "Editable templates src/knowledge/plantillas/borrador-correo.md and envio-simulado.md"
  - "src/tools/proveedor.ts exports exactly the five PRD tools"
affects: [01-11, phase-02, phase-04]

actuals:
  tokens: 9400
  tasks: 2
  commits: 2
plan_head_before: 726c67a610d632c57bee25536bfda740d5d1319b
plan_head_after: 9dec848d8f14a62c4d83bd45715e34d0b11b12d1

tech-stack:
  added: []
  patterns:
    - "Draft and send record are rendered from code-built allowlisted contexts; templates cannot reach the maestro, so an unknown variable such as {{banco.numero_cuenta}} gives REGLAS_INVALIDAS"
    - "A conditional paragraph around a list uses a 0-or-1 row section (hay_pendientes) opened before and after the item section, since the renderer has no nested sections"
    - "simular_envio check order: args, caso guard (cargarSolicitudCaso), confirmado, paquete existence, full context, current bloqueos, render, single write"

key-files:
  created:
    - src/domain/borrador.ts
    - src/application/simular-envio.ts
    - src/knowledge/plantillas/borrador-correo.md
    - src/knowledge/plantillas/envio-simulado.md
    - tests/golden/borrador-envio.test.ts
    - tests/contract/simular-envio.test.ts
  modified:
    - src/application/armar-paquete.ts
    - src/application/contexto-caso.ts
    - src/application/puertos.ts
    - src/infra/salida/archivos.ts
    - src/tools/wiring.ts
    - src/tools/fabrica.ts
    - src/tools/proveedor.ts
    - tests/golden/paquete.test.ts
    - tests/architecture.test.ts
    - tests/e2e/trazador.test.ts

key-decisions:
  - "Vencido soportes join the borrador pendientes as '<tipo> (vencido, enviaremos la versión actualizada)' and are never listed as attached; D-26 named only faltantes and ausentes"
  - "Missing signer fields in the maestro render as — instead of being invented"
  - "Port salida.nombre(archivo) gives the application the formulario file name for the borrador without importing config"
  - "ENVIO-SIMULADO.md lists the actual paquete/ files via salida.listarPaquete and the bloqueos recomputed at confirmation time"
  - "The caso guard for simular_envio is cargarSolicitudCaso; completarContextoCaso loads reglas, maestro and glosario only after confirmado and the paquete check pass"

patterns-established:
  - "Reply draft: construirDatosBorrador (allowlist RUTAS_BORRADOR through leerRuta) then renderizarPlantilla, rendered before reiniciarPaquete so a template failure writes nothing"

requirements-completed: [PAQ-01, PAQ-04, ENV-01, HERR-01, SEG-04]

coverage:
  - id: D1
    description: "paquete/ also contains borrador-correo.md, addressed to solicitud.de with 'RE: <asunto>', listing formulario and presente soportes, signed by contacto_financiero and razon_social"
    requirement: PAQ-04
    verification:
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#co responde al cliente y lo firma la analista con la razón social del maestro"
        status: pass
      - kind: e2e
        ref: "tests/golden/paquete.test.ts#co: paquete/ trae el formulario, los cuatro soportes, el checklist y el borrador, y data.archivos los lista"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pendientes paragraph for faltantes, ausentes and vencidos; nothing when empty"
    requirement: PAQ-04
    verification:
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#ec lista los pendientes y no anuncia como adjunto el certificado ausente"
        status: pass
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#hn anuncia el soporte vencido como pendiente y no como adjunto"
        status: pass
    human_judgment: false
  - id: D3
    description: "No bank data or identifiers in borrador-correo.md, checklist.md or ENVIO-SIMULADO.md; a template asking for banco.* gives REGLAS_INVALIDAS and writes no borrador"
    requirement: PAQ-04
    verification:
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#co borrador-correo.md y checklist.md no traen datos bancarios ni identificaciones"
        status: pass
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#ENVIO-SIMULADO.md de co confirmado no trae datos bancarios ni identificaciones (RN2)"
        status: pass
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#una plantilla editada con {{banco.numero_cuenta}} da REGLAS_INVALIDAS y no escribe el borrador"
        status: pass
    human_judgment: false
  - id: D4
    description: "reglas.json text edits show up in the next output with no code change (D-28)"
    verification:
      - kind: e2e
        ref: "tests/golden/borrador-envio.test.ts#un texto de aviso cambiado en reglas.json aparece en la siguiente salida sin tocar código (D-28)"
        status: pass
    human_judgment: false
  - id: D5
    description: "simular_envio refuses without confirmado true (false or missing) with the exact literal, rejects the string 'true', refuses PAQUETE_NO_ARMADO, and when confirmed writes only ENVIO-SIMULADO.md with current bloqueos, without requiring listo_para_firma"
    requirement: ENV-01
    verification:
      - kind: contract
        ref: "tests/contract/simular-envio.test.ts#contrato: proveedor_simular_envio (ENV-01, D-13, RN4)"
        status: pass
    human_judgment: false
  - id: D6
    description: "generar_formulario after a send removes paquete/ and ENVIO-SIMULADO.md (D-12)"
    verification:
      - kind: contract
        ref: "tests/contract/simular-envio.test.ts#generar_formulario sobre ec después del envío borra paquete/ y ENVIO-SIMULADO.md (D-12)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Every simular_envio call appends one line to both log files with a states-and-codes resumen"
    requirement: SEG-04
    verification:
      - kind: contract
        ref: "tests/contract/simular-envio.test.ts#cada llamada agrega una línea a los dos log.jsonl con un resumen de estados y códigos (SEG-04)"
        status: pass
    human_judgment: false
  - id: D8
    description: "proveedor.ts exports exactly the five PRD tools, each with a one-sentence description, args and execute"
    requirement: HERR-01
    verification:
      - kind: unit
        ref: "tests/architecture.test.ts#proveedor.ts exporta exactamente las cinco herramientas con description, args y execute (HERR-01)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/trazador.test.ts#importar proveedor.ts con el entorno vacío expone las herramientas sin leer el entorno"
        status: pass
    human_judgment: false
  - id: D9
    description: "Tone and wording of the reply draft and the send record for the client and analyst"
    verification: []
    human_judgment: true
    rationale: "Wording is a judgment call; the executor read the rendered ec and co drafts and the ec send record, but no test asserts tone"

duration: 4min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 10: reply draft and simular_envio Summary

**`armar_paquete` now also writes `paquete/borrador-correo.md`, a reply to `solicitud.de` with "RE: <asunto>" built only from razon_social and contacto_financiero. `proveedor_simular_envio` refuses with the exact "requiere confirmación explícita" unless `confirmado` is true. Once confirmed, it writes only `ENVIO-SIMULADO.md` with the bloqueos current at that moment. `proveedor.ts` exports exactly the five PRD tools.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-12T23:01:50Z
- **Completed:** 2026-10-12T23:06:28Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- **Reply draft (PAQ-04, D-25, D-26, RN2).**
  - `construirDatosBorrador` reads the maestro only through `leerRuta` over `RUTAS_BORRADOR` (razon_social, contacto_financiero.nombre, contacto_financiero.cargo).
  - `DatosBorradorCorreo` has no banco field and carries no formulario values.
  - The template lists the formulario file and the presente soportes. When there are faltantes, ausentes or vencidos, it adds "Quedan pendientes: … Los enviaremos por separado."
- **Render before disk.** `armar_paquete` renders the checklist and the borrador before `reiniciarPaquete`. A template that asks for `{{banco.numero_cuenta}}` gives REGLAS_INVALIDAS, and no borrador is written.
- **simular_envio (ENV-01, D-13, RN4 tool half).**
  - Check order: args, then caso, then `confirmado !== true` (CONFIRMACION_REQUERIDA), then a missing `paquete/checklist.md` (PAQUETE_NO_ARMADO).
  - It then recomputes the bloqueos with `evaluarEstadoPaquete` and writes only `ENVIO-SIMULADO.md`, which lists the paquete files and the current bloqueos.
  - `listo_para_firma` is not required.
- **HERR-01.** The architecture test pins the sorted export list of `proveedor.ts` to the five PRD names and checks that each one has a one-sentence description, an args object and an execute function.
- **D-12 and D-28 confirmed end to end.** A regenerated formulario removes the earlier send record. An edited reglas.json text shows up in the next output.

## Task Commits

1. **Task 1: Reply-email draft without bank data, rendered from an editable template** - `429a88e` (feat, tests included)
2. **Task 2: simular_envio behind explicit confirmation, and the exact five-export guard** - `9dec848` (feat, tests included)

## Files Created/Modified

- `src/domain/borrador.ts`: `RUTAS_BORRADOR`, `DatosBorradorCorreo`, `construirDatosBorrador`, `asuntoRespuesta`, `DatosEnvioSimulado`, `construirDatosEnvio`
- `src/application/simular-envio.ts`: `simularEnvio`, `DatosEnvio`
- `src/application/armar-paquete.ts`: renders and writes `paquete/borrador-correo.md`
- `src/application/contexto-caso.ts`: `completarContextoCaso`, split out of `cargarContextoCaso`
- `src/application/puertos.ts`: `ArchivoSalida` gains borradorCorreo and envioSimulado. `existe` accepts any output key. Adds `nombre` and `listarPaquete`.
- `src/infra/salida/archivos.ts`: `listarPaquete`, with the same realpath containment as the writers
- `src/tools/wiring.ts`, `src/tools/fabrica.ts`, `src/tools/proveedor.ts`: bind and export `simular_envio`
- `src/knowledge/plantillas/borrador-correo.md`, `src/knowledge/plantillas/envio-simulado.md`: editable templates
- `tests/golden/borrador-envio.test.ts`, `tests/contract/simular-envio.test.ts`: new
- `tests/golden/paquete.test.ts`, `tests/architecture.test.ts`, `tests/e2e/trazador.test.ts`: updated expectations

## Decisions Made

See `key-decisions` in the frontmatter. The content of ENVIO-SIMULADO.md was left to Claude's discretion. It shows the header (caso, cliente, destinatario, asunto, fecha de ejecución), a statement that no real email was sent, the paquete files, the current bloqueos or "Sin bloqueos.", and the explicit-confirmation line.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The trazador e2e pinned the four-tool export list**
- **Found during:** Task 2
- **Issue:** `tests/e2e/trazador.test.ts` expected `armar_paquete,generar_formulario,leer_solicitud,mapear_campos`.
- **Fix:** The expected list now includes `simular_envio`.
- **Files modified:** tests/e2e/trazador.test.ts
- **Commit:** 9dec848

### Interface refinements (files outside the plan list)

**2. `salida.nombre(archivo)` and `salida.listarPaquete(caso)` ports**
- **Reason:** The application layer cannot import `config/` (layer rule), but the borrador needs the formulario file name, and ENVIO-SIMULADO.md lists the real paquete contents. `listarPaquete` lives in `src/infra/salida/archivos.ts` and reuses its realpath containment helper.
- **Commits:** 429a88e, 9dec848

**3. `completarContextoCaso` split out of `cargarContextoCaso`**
- **Reason:** It honors the locked check order (caso, then confirmado, then paquete) without loading the solicitud twice. `cargarContextoCaso` keeps its behavior.
- **Commit:** 9dec848

**4. `hay_pendientes` 0-or-1 row section in DatosBorradorCorreo**
- **Reason:** The template renderer has no nested sections. The "Quedan pendientes:" header and the "Los enviaremos por separado." footer have to be conditional around the itemized `pendientes` list. The row carries no fields, so it cannot leak data.
- **Commit:** 429a88e

---

**Total deviations:** 1 auto-fixed (Rule 3) and 3 interface refinements. **Impact:** no scope change. All earlier goldens pass unchanged except the planned paquete list update.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model.
- **T-01-15:** mitigated by the allowlisted context, plus goldens that check the six forbidden strings are absent from the borrador, the checklist and ENVIO-SIMULADO.md, and that the banco template edit is rejected.
- **T-01-17:** mitigated by the confirmation-first order (after the caso guard), the single allowlisted write, and a per-caso log line for every attempt.
- **T-01-SC:** no new packages, and `bun audit` is clean.

## Verification

- `bun test`: 330 pass, 0 fail (24 files)
- `bun run check`: tsc, Biome and `bun audit` all clean
- I read back the rendered ec and co borradores and the ec ENVIO-SIMULADO.md, and they look correct.

## User Setup Required

None.

## Next Phase Readiness

- 01-11 can drive all five tools end to end, for example demo.ts walking the four cases through `simular_envio`.
- Phase 2 adds the server-side confirmation gate (ENV-02) on top of the tool-level CONFIRMACION_REQUERIDA.

---
*Phase: 01-n-cleo-determinista*
*Completed: 2026-10-12*

## Self-Check: PASSED
