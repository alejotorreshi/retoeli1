# Phase 1: Núcleo determinista - Research

**Researched:** 2026-10-12
**Domain:** Deterministic TypeScript/Bun core: typed zod tools, glossary-based field mapping, xlsx/pdf/markdown generation, PII masking, jsonl logs, golden tests
**Confidence:** HIGH. Every library behavior that the plans depend on was exec-verified this session on Bun 1.4.3 (scratchpad spike), and the golden oracle was derived by running a prototype over the real fixtures.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Marcas de pendientes en los formularios
- **D-01:** En el xlsx, la celda de valor de un campo `faltante` queda **vacía**, con relleno rojo claro y un comentario de celda: "Faltante: no existe en el maestro". Nunca se escribe un texto marcador que pueda terminar firmado.
- **D-02:** En el xlsx, un campo `requiere_confirmacion` lleva el **valor real del maestro** (por ejemplo, el NIT), con relleno amarillo y un comentario con la nota (por ejemplo, "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano"). El valor de la celda queda limpio, sin sufijos.
- **D-03:** En el PDF generado, un faltante se muestra como `[FALTANTE]` en rojo, y un campo por confirmar como su valor seguido de `[POR CONFIRMAR]` en ámbar. Al final va una sección "Notas" con el motivo de cada uno. Solo se usa texto WinAnsi, sin íconos como ⚠ o ✓, porque pdf-lib lanza con caracteres fuera de WinAnsi. Hay que sanear antes de escribir.
- **D-04:** Los valores se escriben **crudos y exactos del maestro** ("CO", "98000000000"), siempre como texto para preservar los ceros a la izquierda. El contexto va en una nota o comentario aparte (por ejemplo, "COP, año 2025" para Ingresos anuales en clientes no-CO, o la nota de País). Trazabilidad: 1 ruta = 1 valor, sin formateo ni composición.

#### Qué ve el LLM (minimización de PII)
- **D-05:** `valor_enmascarado` muestra en claro **solo una lista blanca de datos corporativos públicos**: `razon_social`, `tipo_sociedad`, `ciudad`, `departamento`, `pais`, `sitio_web`, `actividad_economica`, `ciiu_principal`, `ciiu_secundario`, `regimen_tributario` y `numero_empleados`. Todo lo demás va enmascarado: personas, documentos, banco, contactos y montos. Una ruta nueva del maestro queda **oculta por defecto**. — **Reversibility:** costly — el contrato de salida de `mapear_campos` lo consumen el prompt, los golden tests, la UI y `modulo/`.
- **D-06:** El **NIT va enmascarado** hacia el LLM ("•••••3456").
- **D-07:** El patrón de enmascarado depende del tipo de dato:
  - Números y códigos: últimos 4 caracteres ("••••5123").
  - Nombres de persona: iniciales ("R. A. S.").
  - Correos: "l•••@periferia-ficticia.com".
  - Teléfonos: "+57 ••• ••• 0101".
  - Montos: "[monto oculto]".
  - La cuenta bancaria y el SWIFT nunca muestran más de 4 caracteres.
- **D-08:** La política de PII (lista blanca y patrones) **vive en código** (`src/domain`), no como dato editable. Es una decisión de seguridad y no se puede relajar editando un archivo.
- **D-09:** El rol del LLM, aclarado con la usuaria: orquesta la secuencia de herramientas, conversa y explica en español, responde seguimientos y llega a la pregunta de confirmación. **Nunca** aporta valores, mapea campos, decide vigencias ni autoriza envíos. Este trade-off se documenta en `SOLUCION.md` §6 (Fase 4).

#### Encadenamiento de herramientas
- **D-10:** `armar_paquete` sin un formulario generado devuelve el error guía `FORMULARIO_NO_GENERADO` ("Primero genera el formulario…"). Ninguna herramienta ejecuta pasos de otra a escondidas.
- **D-11:** `generar_formulario` recibe `{ caso, mapeo }`, donde `mapeo` trae solo rutas y es `.strict()`. La herramienta **recalcula el mapeo canónico determinista** y lo compara con el recibido. Si difiere (otra ruta, un estado "subido" de `requiere_confirmacion` a `lleno`, campos de más o de menos), responde `MAPEO_INCONSISTENTE`. Los valores siempre se leen del maestro. — **Reversibility:** one-way — forma parte del contrato público de herramientas que expone `modulo/` y que valida la rúbrica (CA2).
- **D-12:** Al reprocesar un caso, `generar_formulario` sobrescribe `formulario.*` y `mapeo.json` y **borra el `paquete/` y el `ENVIO-SIMULADO.md` previos**. Así nunca queda un paquete armado con un formulario viejo. Los `log.jsonl` se conservan en modo append.
- **D-13:** `simular_envio` exige un paquete armado: si no existe, responde `PAQUETE_NO_ARMADO`. Sin `confirmado: true`, responde "requiere confirmación explícita". No exige `listo_para_firma` (decisión previa) y deja registrados en `ENVIO-SIMULADO.md` los bloqueos vigentes. La compuerta real del servidor llega en la Fase 2.
- **D-14:** Para listar casos: `leer_solicitud` con un caso inexistente (o vacío) responde `CASO_NO_ENCONTRADO` más `casos_disponibles: [...]`. Se mantienen **exactamente 5 herramientas**, y el conocimiento indica que esta es la forma de listar.
- **D-15:** `mapear_campos` acepta en `campos[]` **cualquier subconjunto de las etiquetas de la plantilla del caso**, comparadas con la misma normalización del glosario, para responder preguntas puntuales. Una etiqueta fuera de la plantilla da `CAMPOS_FUERA_DE_PLANTILLA` con la lista esperada. `out/<caso>/mapeo.json` siempre persiste el mapeo canónico **completo**.

#### Errores y continuación (HU-5)
- **D-16:** Forma del error: `{ ok: false, error: "<mensaje en español>", codigo: "<CODIGO_ESTABLE>" }`. `error` sigue siendo un string (literal del PRD §6.2, por ejemplo "requiere confirmación explícita"), y `codigo` es un hermano en MAYÚSCULAS. Los mensajes salen de un catálogo centralizado y nunca llevan traza cruda. — **Reversibility:** one-way — es el contrato de salida de las 5 herramientas, lo consumen tests, UI, el ciclo y `modulo/`.
- **D-17:** Continuación parcial: ante una plantilla corrupta (o una falla similar), la respuesta es `{ ok: false, codigo: "PLANTILLA_INVALIDA", error, parcial: { pais, cliente, formato, soportes } }`, para que el agente pueda reportar los soportes aunque no pueda mapear. Una falla nunca se esconde detrás de `ok: true`.
- **D-18:** Códigos que hay que cubrir como mínimo:
  - De dominio y flujo: `CASO_NO_ENCONTRADO`, `CASO_INVALIDO` (traversal o regex), `PLANTILLA_INVALIDA`, `REGLAS_INVALIDAS`, `ARGS_INVALIDOS`, `MAPEO_INCONSISTENTE`, `CAMPOS_FUERA_DE_PLANTILLA`, `FORMULARIO_NO_GENERADO`, `PAQUETE_NO_ARMADO`, `CONFIRMACION_REQUERIDA`.
  - Genérico: `ERROR_INTERNO`, siempre con un mensaje claro.

#### Mapeo y confianza
- **D-19:** La escala de confianza es fija y se define como dato en `reglas.json` (umbral 0.8):

  | Regla | Confianza | Estado |
  |---|---|---|
  | Glosario exacto | 1.0 | `lleno` |
  | Glosario normalizado | 0.95 | `lleno` |
  | Clave directa del maestro | 0.85 | `lleno` |
  | Regla de país o identificador extranjero | 0.6 | `requiere_confirmacion` |
  | Etiqueta genérica | 0.5 | `requiere_confirmacion` |
  | Sin fuente | 0 | `faltante` |

- **D-20:** Una etiqueta genérica ("Identificación tributaria", "Número de identificación fiscal") es `requiere_confirmacion` **siempre, incluso para CO**, y propone el equivalente del país (NIT/RUC/RTN), literal a HU-1. La lista de etiquetas genéricas vive en `reglas.json` y se prueba con un fixture sintético en `tests/fixtures/`.
- **D-21:** La tabla de verdad (golden) no cambia: co 17/0/0 listo; ec 13/1/1 bloqueado por soporte ausente; hn 9/1/1 bloqueado por parafiscales vencidos; pa 8/0/1 listo por la vía del portal.

#### Soportes y vigencias
- **D-22:** Si un soporte existe pero su `pais_emisor` es distinto del país del cliente, cuenta como **presente** y el checklist agrega un aviso **no bloqueante**: "Emitido en CO: confirmar si el cliente lo acepta". La tabla de verdad no cambia.
- **D-23:** El aviso "vence en N días" aparece cuando faltan **30 días o menos**, un valor configurable en `reglas.json`. Con fecha 2026-09-03, la cámara de comercio avisa "vence en 27 días".

#### Textos de salida
- **D-24:** La consola de `demo.ts` arranca con un encabezado que muestra la fecha efectiva. Luego imprime un **bloque corto por caso** (formato, ruta, conteos lleno/faltante/por confirmar, soportes ausentes y vencidos, LISTO o BLOQUEADO con su motivo) y al final una **tabla resumen** de los 4 casos. Nunca imprime valores reales.
- **D-25:** `borrador-correo.md` lo **firma la analista desde el maestro**: `contacto_financiero.nombre` y `contacto_financiero.cargo` más la razón social. Se arma con una **lista blanca explícita de campos** que excluye `banco.*`. Va dirigido a `solicitud.de` con el asunto "RE: <asunto>". Los valores reales están permitidos en los archivos de salida, pero el LLM nunca los ve.
- **D-26:** El borrador lista el formulario y los soportes adjuntos. Si hay campos faltantes o soportes ausentes, agrega un párrafo breve: "Quedan pendientes: … los enviaremos por separado". Nunca incluye datos bancarios ni valores del formulario.
- **D-27:** `checklist.md` tiene esta estructura:
  - Encabezado con caso, cliente, fecha de ejecución efectiva y estado LISTO o BLOQUEADO con sus motivos.
  - Tabla de soportes con tipo, archivo, vigencia, estado, "vence en N días" y el aviso de país emisor.
  - Listas de campos faltantes y de campos por confirmar, con su nota.
  - Una sección final de acciones con casillas `- [ ]` para la analista.

#### Reglas de negocio como datos (sin tocar el servidor)
- **D-28:** Requisito explícito de la usuaria: las reglas de negocio y los textos tienen que poder cambiar **sin tocar código del servidor**. Viven como datos en `src/knowledge/`: un `reglas.json` validado con zod más plantillas `.md` con placeholders. Las herramientas los **leen en cada ejecución, sin caché**, así que en local un cambio aplica sin reiniciar y en Render basta un push. Si una regla es inválida, la respuesta es `REGLAS_INVALIDAS` en español, nunca un crash. — **Reversibility:** costly — la carga por ejecución y el esquema de `reglas.json` los consumen todas las herramientas y `modulo/`.
- **D-29:** Qué va como dato editable:
  - La tabla país → identificador (CO→NIT; EC, PE y PA→RUC; HN→RTN), la nota "identificador extranjero" y las notas de contexto (moneda y año, país).
  - Umbrales y plazos: confianza 0.8, la escala de D-19 y el aviso de vencimiento de 30 días.
  - La lista de etiquetas genéricas.
  - Las plantillas de `borrador-correo`, `checklist`, `ENVIO-SIMULADO` y `valores-portal`.

  La **política de PII no** va como dato (D-08). El glosario sigue siendo el fixture de solo lectura en `reto-01/`.

#### Librerías y cadena de suministro
- **D-30:** Dependencias de runtime de la Fase 1: **zod 4.6.7**, **exceljs 4.4.0** y **pdf-lib 1.17.1**. Las de desarrollo: **typescript 7.0.2**, **@biomejs/biome 2.5.15** y **@types/bun 1.4.3**. El 2026-10-12 se verificó con `npm view` que todas son la última versión publicada. Los logs jsonl, la redacción y el reloj son código propio, sin dependencias. pino entra en la Fase 2. exceljs se elige sobre SheetJS porque escribe estilos y comentarios de celda, que D-01 y D-02 necesitan.
- **D-31:** Política de cadena de suministro:
  - Versiones **exactas, sin `^`**.
  - `bun.lock` commiteado, y CI y Docker con `--frozen-lockfile`.
  - `"overrides": { "uuid": "^11.1.1" }`. Verificado: `bun audit` pasa de 1 moderate (GHSA-w5hq-g745-h8pq vía exceljs) a 0, y exceljs sigue escribiendo y releyendo `03100012345` con su comentario.
  - **`bun audit` dentro de `bun run check`, que falla desde moderate.**
  - Cada dependencia se justifica en `SOLUCION.md`.

  La usuaria pidió validar siempre versiones y vulnerabilidades y usar lo recomendado y reciente: el planner o el executor deben volver a correr `npm view` y `bun audit` al instalar.
- **D-32:** **Bun 1.4.3 fijo**, en `.bun-version`, `engines` y la imagen `oven/bun:1.4.3-slim`. La máquina local tiene 1.3.10, así que el plan debe incluir `bun upgrade` (o avisar a la usuaria) antes de depender de `bun check`.

#### Validación zero-trust
- **D-33:** No se confía en ninguna entrada, y hay validación zod en cada frontera del backend:
  1. Args con `.strict()`. `caso` debe cumplir `^[a-z0-9-]{1,64}$`, y la ruta resuelta (con `realpath`, contra symlinks) tiene que quedar dentro del directorio de casos.
  2. Todos los fixtures (maestro, solicitud, plantillas, índice de soportes, glosario) y `reglas.json` se validan con esquemas zod al leerlos.
  3. Solo se escribe dentro de `out/<caso>/`, con nombres de archivo en lista blanca.
  4. Hay un límite de tamaño para los archivos leídos.
  5. Los valores van a las celdas como **texto, nunca como fórmulas**. No se antepone `'`, porque alteraría valores como "+57…".
  6. No hay shell.
- **D-34:** El principio para el front (se implementa en la Fase 3, pero queda fijado ya): **el front valida para la UX y el backend decide**. Los esquemas zod se comparten desde `src/contracts/`, y el front nunca renderiza HTML del modelo.

### Claude's Discretion
- El layout del PDF (márgenes, tipografía, wrapping y paginado), dentro de D-03.
- El contenido exacto de `ENVIO-SIMULADO.md` y `valores-portal.md`, siguiendo el espíritu de D-26 y D-27, con plantillas como dato (D-29).
- La estructura interna de carpetas de `src/` (domain, tools, infra), el `defineTool` y el mutex por caso, según `.planning/research/ARCHITECTURE.md` y sin sobreingeniería (Pitfall 17).
- El contenido del `resumen` redactado de cada línea de `log.jsonl`, y dónde se registra una llamada que falla antes de conocer un caso válido (solo en el log global).
- Los colores exactos de los rellenos del xlsx y de las marcas del PDF.

### Deferred Ideas (OUT OF SCOPE)
- **Confirmación campo a campo desde el chat:** que la analista marque un `requiere_confirmacion` como aceptado (por ejemplo, "sí, usa el NIT como RTN") y que el formulario quite la marca. Es una capacidad nueva y se registra para el backlog.
- **Carpeta de reglas externa por env (`REGLAS_DIR`)** para cambiar reglas sin commit. Hoy aporta poco porque Render free no tiene disco persistente. Se reevalúa si cambia el hosting.
- **Validaciones de front:** el principio queda fijado en D-34 y su implementación va en la Fase 3.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (short) | Research Support |
|----|---------------------|------------------|
| HERR-01 | `src/tools/proveedor.ts` exports exactly 5 tools; model sees `proveedor_<export>` | Pattern 1 (`defineTool`), Tool Contract Spec; arch test asserts the export list |
| HERR-02 | zod `args` with `.describe()`; validate before execute | Pattern 1; zod 4 `.strict()` + Spanish `localeError` (exec-verified) |
| HERR-03 | Always a JSON string, never throws, stable codes, Spanish messages | Pattern 1 firewall + Error Catalog; contract tests |
| HERR-04 | Paths from `ctx.directory`, `caso` traversal-safe, no shell | Pattern 3 (safe paths, realpath containment, exec-verified); no-shell grep test |
| HERR-05 | Importable without server or secrets; `sessionId \| sessionID` | Pattern 2 (lazy per-execution wiring); contexto normalizer; arch test |
| SOLI-01 | `leer_solicitud` returns `{pais, cliente, formato, campos[], soportes[]}`; template chosen by file present | Template-selection matrix; golden oracle (pa = portal + `plantilla-campos.json`) |
| SOLI-02 | Ambiguous labels → `requiere_confirmacion` + country equivalent | Mapping algorithm step 4 (generic labels), synthetic fixture |
| MAP-01 | Three states with `ruta` | Mapping algorithm; golden oracle per field |
| MAP-02 | Glossary-only with normalization; no fuzzy | `normalizarEtiqueta` spec; golden shows both no-source labels as `faltante` |
| MAP-03 | RN1 country rule | Mapping step 5; golden ec/hn/pa |
| MAP-04 | Nested paths; non-existent path → `faltante` | `leerRuta` with own-property walk (prototype-safe) |
| MAP-05 | LLM sees `{etiqueta, ruta, estado, confianza, valor_enmascarado}` only | PII masking table (D-05..D-07) with concrete masks |
| MAP-06 | Trace `ruta`, `regla`, `confianza`; persist `mapeo.json` | `mapeo.json` shape (no raw values) |
| MAP-07 | Context notes (Ingresos non-CO, País) | `reglas.json` `notas_contexto` schema |
| FORM-01 | xlsx at exact sheet/cell, text values, multi-sheet | exceljs spike (fills, notes, text, numFmt `@`, 2 sheets) |
| FORM-02 | PDF in template order with visible marks | pdf-lib layout model + sanitizer + extraction helper (exec-verified) |
| FORM-03 | Portal → `ok:true`, `aviso: "formato no soportado"`, `valores-portal.md` | Tool Contract Spec; template engine |
| FORM-04 | `mapeo` with rutas only, strict | zod strict item schema (exec-verified rejects `valor`) + D-11 comparison algorithm |
| PAQ-01 | `paquete/` contents, returns `{ruta, listo_para_firma, checklist}` | Paquete assembly spec |
| PAQ-02 | Checklist content + "vence en N días" | Vigencias algorithm; golden soportes table |
| PAQ-03 | Vencido / ausente block; faltante doesn't | RN3 rule; golden |
| PAQ-04 | Borrador to `solicitud.de`, "RE: <asunto>", no bank data | Template context allowlist (type excludes `banco`) |
| PAQ-05 | Injectable clock, `FECHA_EJECUCION`, America/Bogota, ISO compare, null = valid | Clock spec (Intl `en-CA` exec-verified) |
| ENV-01 | `simular_envio` without confirmation → literal error; with → only `ENVIO-SIMULADO.md` + bloqueos | Tool Contract Spec, check order |
| SEG-02 | Single `redactar()`/masking policy; grep test | PII policy module + grep test design with positive control |
| SEG-04 | `out/log.jsonl` + `out/<caso>/log.jsonl` `{ts, herramienta, ok, resumen}` | Logging spec |
| DEMO-01 | `bun run demo.ts` 4 cases, clean `out/`, fixed date, deterministic | demo spec + determinism definition (xlsx zip timestamps finding) |
| DEMO-02 | Golden tests per case | Golden oracle tables (field-level) |
| DEMO-04 | Synthetic fixtures in `tests/fixtures/` | Synthetic fixture catalog |
| CAL-01 | Strict TS, `noUncheckedIndexedAccess`, Biome, `bun run check` | Exact tsconfig/biome.json/scripts (exec-verified on TS 7.0.2 / Biome 2.5.15) |
| CAL-02 | No comments | No-comment scanner test design |
| CAL-03 | Centralized zod-validated config/constants | Config spec (env tier + constants + reglas.json) |
| CAL-04 | Inward deps; arch test | Import rules table + regex scanner (`scanImports` misses type imports, exec-verified) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- No comments in code. Explanations go in `docs/`, `README.md` or `SOLUCION.md`. Tool `description` and zod `.describe()` are contract, not comments.
- Strict TypeScript without `any`. `bun run check` (tsc + Biome) must pass.
- Constants and configuration centralized, typed and validated with zod. No scattered magic values.
- Dependencies point inward: pure domain → tools/use cases → infrastructure → HTTP. Tools don't import the server.
- Domain identifiers in Spanish (PRD contract), infrastructure in English, documentation in Spanish.
- Never modify `reto-01/` (PRD and fixtures).
- Conventional Commits under the local identity `elianatorres5772 <elianatorres5772@gmail.com>` (verified as the current `git config user.name/email`).
- Tool contract: name `<archivo>_<export>`; `execute(args, ctx: { directory, sessionId }) → string`; paths resolved from `ctx.directory`, never absolute.
- Security: the key lives only in a backend env var; tools never run shell; no real data.
- Delivery: no `node_modules/`, `out/` or `.env` in git.
- Use the GSD workflow entry points before editing files.

## Summary

Phase 1 is a greenfield, LLM-free core. The planner needs four things this research nails down: (1) exact scaffolding that passes `bun run check` on TS 7.0.2 + Biome 2.5.15 + `bun audit`; (2) an exact, data-driven mapping algorithm whose output on the four real fixtures is a field-level golden oracle; (3) verified library mechanics for exceljs (fills, notes, text cells, determinism limits) and pdf-lib (WinAnsi sanitizing, deterministic bytes, a test-side text extractor); and (4) a tool contract (`defineTool`, error catalog, arg schemas, D-11 comparison) that later phases consume unchanged.

Three findings change how tasks should be written. First, **xlsx files are not byte-stable across runs**: exceljs writes wall-clock zip entry timestamps with 2-second DOS resolution, so a byte-compare test passes or fails depending on timing. Compare xlsx semantically (cell values, fills, notes) instead. PDFs from pdf-lib **are** byte-identical across runs once the metadata dates are set from the clock. Second, **pdf-lib throws on `\n`, `\t`, `\r`, NFD combining accents, ✓ ⚠ → and emoji**, but accepts NFC Spanish text, `€`, smart quotes, `—`, `•` and NBSP. A sanitizer built on `font.getCharacterSet()` plus NFC normalization works (exec-verified). Third, **`Bun.Transpiler.scanImports` silently drops `import type`/`export type`**, so the architecture test must use a regex scanner or it misses type-level layering violations.

The truth table holds exactly: co 17/0/0 listo, ec 13/1/1 bloqueado (`certificado_cumplimiento_tributario` ausente), hn 9/1/1 bloqueado (`parafiscales` vencido 2026-08-31), pa 8/0/1 listo. Every `lleno` field in the four cases resolves through **exact glossary match** (confidence 1.0). The normalized-glossary, direct-key and generic-label rules are only exercised by synthetic fixtures, which makes those fixtures mandatory, not optional.

**Primary recommendation:** Build a tracer slice first: scaffolding, then `co-industrias-delta` end-to-end through all 5 real tools into a temp dir with a golden test. Widen to pdf/portal/hn after that, and finish with `demo.ts`, the determinism test and the PII grep test.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Label normalization, glossary resolution, RN1, generic labels, confidence → estado | Domain (pure) | — | Business rules; take `reglas` as a parameter, no IO |
| PII masking policy (allowlist + per-type masks) | Domain (pure) | — | D-08: security policy lives in code, not data |
| Vigencias, checklist, `listo_para_firma` (RN3), D-11 mapeo comparison | Domain (pure) | — | Pure functions over plain types; `hoy` is a parameter |
| Template rendering (placeholder engine) | Domain (pure) | Infra (reads `.md`) | Engine is pure string logic; reading files is IO |
| Use cases per tool (orchestrate read → domain → write) | Application | — | One function per tool; deps passed in |
| Fixture / reglas / template reading + zod validation + size limit | Infra | — | IO adapters; return typed data or typed errors |
| xlsx / pdf / md writers, soporte copies, safe paths, per-caso mutex, jsonl log | Infra | — | IO; never decide business outcomes |
| Clock (system vs fixed) | Infra (impls) | Application (port type) | The only real port in Phase 1 (2 implementations) |
| Tool boundary: zod args, never-throw firewall, presentation, logging, ctx normalization | Tools | — | PRD §6.2 contract lives here |
| Composition (wiring defaults per execution) | Tools (`wiring.ts`) | `demo.ts` | The only files in the tools tier allowed to import infra |
| Deterministic run of 4 cases | `demo.ts` (driver) | — | Calls the exported tools, exactly like an LLM host would |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun | 1.4.3 | Runtime, package manager, test runner, `bun audit` | D-32. Binary exec-verified in scratchpad (`bun --version` → `1.4.3`) [VERIFIED: npm registry `@oven/bun-darwin-aarch64@1.4.3`, exec] |
| zod | 4.6.7 | Tool args, fixture/reglas/env validation, Spanish errors | PRD-mandated. Published 2026-10-12T16:29Z via GitHub Actions trusted publisher with SLSA provenance [VERIFIED: npm registry `_npmUser`, `dist.attestations`] |
| exceljs | 4.4.0 | `formulario.xlsx`: exact cells, fills, cell notes, multi-sheet | D-30. Exec-verified fills, notes, text values, `numFmt: "@"`, readback [VERIFIED: npm registry + exec] |
| pdf-lib | 1.17.1 | `formulario.pdf` generated with StandardFonts | D-30. Exec-verified WinAnsi behavior, `rgb()`, deterministic bytes [VERIFIED: npm registry + exec] |

### Development
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript | 7.0.2 | `tsc --noEmit` (native compiler) | `bun run check`. Exec-verified with the tsconfig below [VERIFIED: exec `tsc --version` → `Version 7.0.2`] |
| @biomejs/biome | 2.5.15 | Lint + format | `bun run check`. `noExplicitAny` is only a *warning* in the recommended preset, so it must be raised to `error` (exec-verified) |
| @types/bun | 1.4.3 | Types for `Bun.*`, `bun:test` | Always |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Own ~50-line placeholder engine | `mustache` / `handlebars` | They add a dep to justify, and handlebars helpers expand the template attack surface. Our templates need only variables + list sections; see Don't Hand-Roll for the boundary |
| `z.locales.es().localeError` per parse | `z.config(z.locales.es())` global | The global call mutates zod config for any host that shares the zod instance (`modulo/` in OpenCode). Per-parse is side-effect free (exec-verified) |
| Regex import scanner | `Bun.Transpiler().scanImports()` | `scanImports` drops type-only imports (exec-verified), so the arch test would miss them |

**Installation:**
```bash
bun add --exact zod@4.6.7 exceljs@4.4.0 pdf-lib@1.17.1
bun add --exact --dev typescript@7.0.2 @biomejs/biome@2.5.15 @types/bun@1.4.3
```
Then add `"overrides": { "uuid": "^11.1.1" }` to `package.json` and run `bun install` again. D-31 says to re-run `npm view <pkg> version` and `bun audit --audit-level=moderate` at install time.

**Version verification (2026-10-12, this session):** `npm view` returned `zod 4.6.7`, `exceljs 4.4.0`, `pdf-lib 1.17.1`, `typescript 7.0.2`, `@biomejs/biome 2.5.15`, `@types/bun 1.4.3`. All are the current `latest` [VERIFIED: npm registry].

> **Superseded by D-35 (post-research, user decision):** pin `zod@4.6.5` and `@types/bun@1.4.2` instead of 4.6.7 and 1.4.3 (maturity policy of 7 days or more). The other pins above are unchanged. See "Open Questions (RESOLVED)" Q1.

## Package Legitimacy Audit

Seam: `gsd-tools query package-legitimacy check --ecosystem npm` (gsd-core 1.16.0, identity verified).

| Package | Registry | Age (pinned version) | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|----------------------|--------------|-------------|---------|-------------|
| zod@4.6.7 | npm | **hours** (2026-10-12T16:29Z) | 346M | github.com/colinhacks/zod | [SUS] too-new | Flagged: planner adds `checkpoint:human-verify` before install. Mitigations: trusted-publisher + SLSA provenance, maintainer approval, `bun audit` 0. Cooldown fallback: `4.6.5` (2026-09-13) |
| exceljs@4.4.0 | npm | 3 yrs (2023-10-19) | 18M | github.com/exceljs/exceljs | [OK] | Approved (with `uuid` override) |
| pdf-lib@1.17.1 | npm | ~5 yrs (2021-11-06) | 18M | github.com/Hopding/pdf-lib | [OK] | Approved (dormant but stable; exec-verified) |
| typescript@7.0.2 | npm | 3 mo (2026-07-08) | 308M | github.com/microsoft/TypeScript | [OK] | Approved |
| @biomejs/biome@2.5.15 | npm | 12 days (2026-09-30) | 18M | github.com/biomejs/biome | [SUS] too-new | Flagged: `checkpoint:human-verify` before install. Low risk (dev-only binary, no postinstall) |
| @types/bun@1.4.3 | npm | hours (2026-10-12T08:04Z) | 16M | DefinitelyTyped (`types <ts-npm-types@microsoft.com>`) | [SUS] too-new | Flagged: `checkpoint:human-verify`. Types only, no runtime code |
| uuid (override → 11.1.1) | npm | 5.5 mo (2026-04-29) | 319M | github.com/uuidjs/uuid | [SUS] reported for `latest` 14.0.3, **not** for the pinned 11.1.1 | Approved for 11.1.1 (resolved as `uuid@11.1.1` in the spike) |

**Postinstall scripts:** none for any of the 7 packages (`npm view <pkg> scripts.postinstall` empty) [VERIFIED: npm registry].
**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** zod@4.6.7, @biomejs/biome@2.5.15, @types/bun@1.4.3. The only reason is release age; every other signal is clean. The planner inserts one `checkpoint:human-verify` covering all three before `bun install`, presenting the zod cooldown option (4.6.5) to the user, because D-30 locks 4.6.7.

**`bun audit` evidence (exec, Bun 1.4.3):**
```
# with "overrides": { "uuid": "^11.1.1" }
No vulnerabilities found (checked 207 packages)        exit=0
# without the override
uuid@8.3.2  exceljs > uuid
  moderate: uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided (<11.1.1) - https://github.com/advisories/GHSA-w5hq-g745-h8pq
1 vulnerability (1 moderate)                            exit=1   (--audit-level=moderate)
No vulnerabilities found (... 1 below --audit-level=high) exit=0 (--audit-level=high)
```
So the gate flag is **`bun audit --audit-level=moderate`**, and it fails with exit 1 from moderate [VERIFIED: exec]. Transitive `tmp` resolves to `0.2.7`.

## Scaffolding (exact files, exec-verified)

### `package.json`
```json
{
  "name": "registro-proveedor",
  "private": true,
  "type": "module",
  "engines": { "bun": "1.4.3" },
  "scripts": {
    "demo": "bun run demo.ts",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "audit": "bun audit --audit-level=moderate",
    "check": "tsc --noEmit && biome check . && bun audit --audit-level=moderate"
  },
  "dependencies": { "zod": "4.6.7", "exceljs": "4.4.0", "pdf-lib": "1.17.1" },
  "devDependencies": { "typescript": "7.0.2", "@biomejs/biome": "2.5.15", "@types/bun": "1.4.3" },
  "overrides": { "uuid": "^11.1.1" }
}
```
Notes:
- **D-35 supersedes the two same-day pins in this snippet:** use `"zod": "4.6.5"` and `"@types/bun": "1.4.2"`. Everything else in the snippet stands.
- D-31 locks `"uuid": "^11.1.1"` verbatim. With `bun.lock` committed and `--frozen-lockfile`, the resolution is frozen at `11.1.1` anyway.
- **`bun check` runs the package.json `check` script** in 1.4.3 (observed: `bun check --help` executed the script). Always document `bun run check`.
- `bun audit` needs network access to the registry. An offline `bun run check` fails at the audit step. Document this.

### `tsconfig.json` (exec-verified on TS 7.0.2 + @types/bun 1.4.3, `tsc` exit 0)
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "types": ["bun"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "tests", "demo.ts"]
}
```
Two behaviors were verified: `noUncheckedIndexedAccess` flags `const x: string = arr[0]`, and `exactOptionalPropertyTypes` rejects `wb.lastPrinted = undefined`, so don't assign `undefined` to optional exceljs props. `import ExcelJS from "exceljs"` and `import { PDFDocument } from "pdf-lib"` both typecheck with this config.

### `biome.json` (exec-verified: a file with `any` gives exit 1, a clean tree gives exit 0)
```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["**", "!reto-01", "!out", "!web/dist"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 110 },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "suspicious": { "noExplicitAny": "error" },
      "style": { "noNonNullAssertion": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } },
  "assist": { "enabled": true, "actions": { "source": { "organizeImports": "on" } } }
}
```
`biome init` on 2.5.15 generates `"rules": { "preset": "recommended" }` (verified). **Pitfall found:** Biome 2.5.15 **panics** ("path is expected to be under the root") when the tree contains a symlink pointing outside the root. Never commit symlinks, and create symlink-escape test fixtures under `os.tmpdir()` at test time.

### `.gitignore` / `.dockerignore` / `.bun-version`
- `.gitignore`: `node_modules/`, `out/`, `.env`, `.env.*`, `!.env.example`, `.DS_Store`, `*.log`, `web/dist/`.
- **`reto-01/` contains three `.DS_Store` files** (`reto-01/.DS_Store`, `reto-01/fixtures/.DS_Store`, `reto-01/fixtures/reto-01/.DS_Store`). They are hidden today only by the user's global `~/.gitignore_global`. The project `.gitignore` must list `.DS_Store` **before** `git add reto-01` (`reto-01/` is untracked today). Commit `reto-01/` unchanged in the first plan.
- `.dockerignore`: same entries plus `.git`, `.planning`, `tests` (Phase 3 refines it).
- `.bun-version`: `1.4.3`.
- **Local Bun is 1.3.10** (`bun --version`). `bun upgrade` installs the latest, which is 1.4.3 today (`npm view bun version` → `1.4.3`, published 2026-10-10). This modifies the user's machine, so make it a `checkpoint:human-action`. The plan doesn't strictly need 1.4.3 to proceed: every spike also ran on the 1.4.3 binary, and nothing in Phase 1 uses a 1.4-only API. Bun doesn't enforce `engines.bun` [ASSUMED].

## Architecture Patterns

### System Architecture Diagram

```
 demo.ts / tests / (Phase 2 loop) / (Phase 4 modulo host)
        │  execute(args, ctx{directory, sessionId|sessionID})
        ▼
 ┌─────────────────────── src/tools ────────────────────────┐
 │ defineTool: normalize ctx → z.object(args).strict()      │
 │   ├─ invalid → ARGS_INVALIDOS (es) ──────────────┐       │
 │   └─ valid → wiring (per-execution deps) → caso ─┤       │
 │ try { use case } catch → ERROR_INTERNO           │       │
 │ present() (masked) + resumen → JSON string ◀─────┘       │
 │ bitácora: out/log.jsonl (+ out/<caso>/log.jsonl)         │
 └───────────────┬──────────────────────────────────────────┘
                 ▼
 ┌──────────── src/application (one fn per tool) ───────────┐
 │ resolve caso (regex → realpath ⊂ casos/) ─ fail → CASO_* │
 │ read reglas.json + templates (no cache) ─ fail → REGLAS_ │
 │ read fixtures (size limit → zod) ─ fail → PLANTILLA_/... │
 │ call domain ───────────────────────────────┐             │
 │ write under out/<caso>/ (per-caso mutex) ◀─┘             │
 └──────┬───────────────────────┬───────────────────────────┘
        ▼                       ▼
 src/domain (pure)          src/infra
 normalizar, mapear,        fixtures reader, reglas loader,
 RN1, genéricas, PII,       xlsx/pdf/md writers, copy,
 vigencias, checklist,      safe paths, mutex, clock,
 comparar mapeo, render     jsonl appender
        │                       │
        │               reto-01/fixtures/reto-01 (read-only)
        │               src/knowledge/reglas.json + plantillas/*.md (read per call)
        └──────────────▶ out/<caso>/{formulario.*, valores-portal.md, mapeo.json,
                                     paquete/, ENVIO-SIMULADO.md, log.jsonl}
```

### Recommended Project Structure
```
src/
├── config/          # env.ts (zod ToolEnv, no secrets), constantes.ts (file-name allowlist, regexes, limits)
├── domain/          # PURE: tipos, resultado, errores (catálogo es), normalizar, mapeo, identificador (RN1),
│                    #   pii (política + máscaras), vigencias, checklist, comparar-mapeo, plantillas (engine)
├── application/     # one use case per tool + puertos.ts (Reloj, Entorno record type)
├── infra/           # fixtures/ (esquemas zod + lector), knowledge/ (reglas + plantillas loader),
│                    #   salida/ (rutas-seguras, mutex, xlsx, pdf/{layout,render}, markdown, copias),
│                    #   reloj.ts, bitacora.ts (jsonl)
├── tools/           # define-tool.ts, contexto.ts, wiring.ts, proveedor.ts (ONLY the 5 exports)
└── knowledge/       # reglas.json, plantillas/{checklist,borrador-correo,envio-simulado,valores-portal}.md
demo.ts
tests/
├── unit/            # domain: normalizar, mapeo, pii, vigencias, checklist, comparar-mapeo, plantillas
├── contract/        # each tool: never throws, shapes, error codes, args strict
├── golden/          # 4 cases, field-level oracle (below)
├── e2e/             # demo twice: determinism, PII grep, artifacts
├── architecture.test.ts   # import direction + exactly 5 exports + no shell APIs
├── sin-comentarios.test.ts
├── helpers/         # proyecto-temporal.ts (mkdtemp + cp fixtures), pdf-texto.ts, xlsx-leer.ts
└── fixtures/casos/  # synthetic cases (copied into the temp project at test time)
```
Rationale: this follows `.planning/research/ARCHITECTURE.md`, trimmed per Pitfall 17. There are no `llm/`, `loop/` or `http/` folders yet. `Reloj` is the only real port, as CAL-04 requires. IO for the use cases is passed as one typed `Entorno` record built in `tools/wiring.ts`, not as four interfaces.

### Pattern 1: Import rules (CAL-04), enforced by `tests/architecture.test.ts`

| Layer (glob) | May import | Must not import |
|---|---|---|
| `src/domain/**` | `src/domain/**` only (no `node:*`, no `bun`, no `zod`, no `exceljs`/`pdf-lib`) | everything else |
| `src/application/**` | `src/domain/**`, `src/application/**` | `src/infra/**`, `src/tools/**`, libs with IO |
| `src/infra/**` | domain, application (port types), config, infra, `node:*`, zod, exceljs, pdf-lib | tools |
| `src/config/**` | config, zod | everything else in `src/` |
| `src/tools/**` except `wiring.ts` | domain, application, config, tools, zod | **infra** |
| `src/tools/wiring.ts` | + infra (composition root) | — |
| any of the above | — | `src/server*`, `src/http/**`, `src/loop/**`, `src/llm/**` (future phases) |
| `src/**`, `demo.ts` | — | `child_process`, `Bun.spawn`, `Bun.$`, `node:child_process` (no-shell rule, grep test) |

The scanner covers type-only imports, so use a regex rather than `Bun.Transpiler().scanImports()`. scanImports returned `[zod, ../infra/x, ../tools/a, ../server, ./side]` and **dropped** `import type … from "../application/puertos"` and `export type … from "../domain/b"` (exec-verified):
```typescript
const IMPORTACION = /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
```
Resolve each relative specifier against the file's directory, map it to a layer, and assert it against the table. Also assert `Object.keys(await import("../src/tools/proveedor"))` equals the 5 names, sorted.

### Pattern 2: `defineTool`: never throws, strict args, Spanish errors, per-execution wiring

```typescript
import { z } from "zod";

export type ContextoHerramienta = { directory: string; sessionId?: string; sessionID?: string };
export type Herramienta<A extends z.ZodRawShape> = {
  description: string;
  args: A;
  execute(args: unknown, ctx: ContextoHerramienta): Promise<string>;
};

const mensajesEs = z.locales.es().localeError;

export function defineTool<A extends z.ZodRawShape, D>(spec: {
  nombre: string;
  description: string;
  args: A;
  ejecutar(args: z.infer<z.ZodObject<A>>, entorno: Entorno): Promise<Resultado<D>>;
  presentar(data: D): unknown;
  resumir(r: Resultado<D>): string;
}): Herramienta<A> {
  const esquema = z.object(spec.args).strict();
  return {
    description: spec.description,
    args: spec.args,
    async execute(crudos, ctx) {
      const entorno = await crearEntorno(normalizarContexto(ctx));
      const parsed = esquema.safeParse(crudos, { error: mensajesEs });
      const resultado = parsed.success
        ? await ejecutarSeguro(() => spec.ejecutar(parsed.data, entorno))
        : fallo("ARGS_INVALIDOS", formatearIssues(parsed.error));
      const resumen = spec.resumir(resultado);
      await entorno.bitacora.registrar({ herramienta: `proveedor_${spec.nombre}`, ok: resultado.ok, resumen, caso: casoValido(parsed) });
      return JSON.stringify(serializar(resultado, spec.presentar, resumen));
    },
  };
}
```
Rules:
- **`ejecutarSeguro`** catches everything and maps it to `ERROR_INTERNO`. Only `error.name` goes to stderr, never the message or stack, because exception messages can embed values.
- **`crearEntorno` must not throw.** An invalid env (for example `FECHA_EJECUCION=2026-13-40`) becomes a typed error result. Recommended code: `CONFIGURACION_INVALIDA` (D-18 is a minimum list).
- **`bitacora.registrar` swallows its own IO errors.** A full disk never turns into a throw.
- **Log only the `caso`**, and only after it passed the regex. Never log raw args: the model may put values in them.
- `.strict()` top-level args are locked (D-33). Prior research suggested strip mode to avoid model retry loops. The mitigation is that the Spanish message names the unknown key (`Llave desconocida: "extra"`), which lets the model self-correct.
- `execute` typed `args: unknown` keeps the PRD shape and forces validation. Phase 2's registry passes `JSON.parse` output straight in.
- `normalizarContexto`: `sessionId ?? sessionID ?? "sin-sesion"`. `directory` must be a non-empty string; resolve it with `path.resolve`.

zod per-parse Spanish output (exec-verified, global config untouched):
```
caso: Cadena inválida: debe coincidir con el patrón /^[a-z0-9-]{1,64}$/
n: Entrada inválida: se esperaba número, recibido texto
: Llave desconocida: "extra"
```
`formatearIssues` should build `ruta: mensaje`, using `"(raíz)"` for an empty path, and cap the result at about 5 issues.

### Pattern 3: Safe paths (HERR-04, D-33)

1. `caso` must match `^[a-z0-9-]{1,64}$` (zod), otherwise `CASO_INVALIDO`. Recommended stricter form: `^[a-z0-9]+(-[a-z0-9]+)*$` with max 64.
2. `casosDir = realpath(resolve(ctx.directory, FIXTURES_DIR, "casos"))`, then `real = realpath(resolve(casosDir, caso))`. `ENOENT` gives `CASO_NO_ENCONTRADO` plus `casos_disponibles` (sorted `readdir` of directories matching the regex). If `!real.startsWith(casosDir + sep)`, the result is `CASO_INVALIDO`. Exec-verified: a symlink `casos/evil → /etc` resolved to `/private/etc` and `inside: false`. macOS `/tmp` → `/private/tmp`, so always compare realpath to realpath.
3. Output: `outCaso = resolve(ctx.directory, OUT_DIR, caso)`, created with `mkdir({recursive:true})`. Writes take only names from an allowlist constant: `formulario.xlsx`, `formulario.pdf`, `valores-portal.md`, `mapeo.json`, `log.jsonl`, `ENVIO-SIMULADO.md`, `paquete/`, `paquete/checklist.md`, `paquete/borrador-correo.md`, plus soporte basenames validated `^[a-z0-9][a-z0-9._-]{0,100}$` without `..`.
4. Soporte `archivo` values come from `index.json` (data), so check them with the same basename regex before `copyFile`.
5. Reads: `stat().size <= LIMITE_LECTURA_BYTES` (recommended 1 MiB) before `Bun.file().text()`. Then `JSON.parse` inside try/catch, then the zod schema.
6. `demo.ts` cleanup deletes only `resolve(root, OUT_DIR)` after asserting that it is inside `root`, that its basename is `out`, and that `root/package.json` exists.

### Pattern 4: Mapping algorithm (MAP-01..04, SOLI-02, D-19, D-20)

```
normalizarEtiqueta(s) = s.normalize("NFD").replace(/[̀-ͯ]/g, "")
                         .toLowerCase().replace(/\s+/g, " ").trim()
                         .replace(/[\s:*]+$/u, "").trim()
```
For each template label `e`, in template order, with client country `p`:
1. **Exact glossary**: own-property lookup of `e.normalize("NFC")` in a `Map` built from the glossary entries (NFC-normalized keys). Hit → `ruta`, `regla="glosario_exacto"`, confidence `reglas.confianza.glosario_exacto` (1.0).
2. Else **normalized glossary**: a `Map(normalizarEtiqueta(k) → ruta)`. Hit → `glosario_normalizado` (0.95). At load time, a normalization collision mapping to two different rutas is a `DATOS_INVALIDOS`/glossary schema refinement error.
3. Else **direct key**: `k = normalizarEtiqueta(e).replace(/ /g, "_")`. If `Object.hasOwn(maestro, k)` and the value is a scalar (string or number) → `clave_directa` (0.85).
4. Resolve the value with `leerRuta(maestro, ruta)`. Walk segments with `Object.hasOwn`. Each segment must match `^[a-z_]+$`. Accept only `string` or `number` leaves. Missing or non-scalar (object, array, boolean) → **no source**: `ruta=null`, `faltante`, confidence 0.
5. **Generic label override** (checked first among the overrides): if `normalizarEtiqueta(e)` is in `reglas.etiquetas_genericas` (normalized) and a ruta resolved → `regla="etiqueta_generica"`, confidence 0.5, `nota` proposing `reglas.identificador_tributario.por_pais[p]`. For `p ≠ origen`, also append the foreign-identifier note. This applies **even for CO** (D-20).
6. Else **RN1**: if `ruta === reglas.identificador_tributario.ruta` (`"nit"`) and `p !== reglas.identificador_tributario.pais_origen` (`"CO"`) → `regla="regla_pais"`, confidence 0.6, note `nota_extranjero`.
7. `estado = ruta === null ? "faltante" : confianza >= reglas.confianza.umbral ? "lleno" : "requiere_confirmacion"`.
8. **Context notes** (MAP-07): for each `reglas.notas_contexto` entry with a matching `ruta` whose `aplica` condition holds (`"siempre"` or `"extranjero"` when `p !== origen`), attach the rendered `nota`. The state does not change.

**Why `Map` and `Object.hasOwn`:** the glossary and the maestro are JSON-parsed plain objects. `glosario["constructor"]` returns `Object`'s constructor function (truthy), so a template label `"constructor"` or `"toString"` would resolve to a bogus ruta. The same applies to `maestro["__proto__"]` [ASSUMED: standard JS semantics, not exec-tested this session].

**Value to text (D-04):** `typeof v === "number" ? String(v) : v`. `String(98000000000)` is `"98000000000"` with no exponent below 1e21, and `String(480)` is `"480"`. No formatting, no concatenation.

### Pattern 5: PII policy and masks (D-05..D-08, MAP-05, SEG-02)

`src/domain/pii.ts`: a code-owned table from ruta to mask type, **default `oculto`** for any unlisted ruta.

| Mask type | Rutas | Rule | Example (from maestro) |
|---|---|---|---|
| `publico` | `razon_social`, `tipo_sociedad`, `ciudad`, `departamento`, `pais`, `sitio_web`, `actividad_economica`, `ciiu_principal`, `ciiu_secundario`, `regimen_tributario`, `numero_empleados` (D-05, verbatim) | as-is | `"480"` |
| `ultimos4` | `nit`, `digito_verificacion`, `codigo_postal`, `matricula_mercantil`, `representante_legal.identificacion`, `banco.numero_cuenta`, `banco.swift` | `"•".repeat(len-4) + last4`; **if `len <= 4` → `"••••"`** (otherwise the 1-char DV would show in full) | `nit "900123456"` → `•••••3456`; `"71555123"` → `••••5123`; `"03100012345"` → `•••••••2345`; `"COLOCOBM"` → `••••OCBM`; `"7"` → `••••` |
| `iniciales` | `representante_legal.nombre`, `contacto_comercial.nombre`, `contacto_financiero.nombre` | first letter of each word + `". "` | `"Roberto Andrade Salazar"` → `R. A. S.` |
| `correo` | `representante_legal.email`, `contacto_comercial.email`, `contacto_financiero.email` | first char + `•••@` + domain | `"lgomez@periferia-ficticia.com"` → `l•••@periferia-ficticia.com` |
| `telefono` | `telefono`, `contacto_comercial.telefono`, `contacto_financiero.telefono` | keep the leading `+CC` token and the last group; middle groups → `•••` | `"+57 604 555 0100"` → `+57 ••• ••• 0100` |
| `monto` | `ingresos_ultimo_ano.valor` | `[monto oculto]` | |
| `oculto` (default) | everything else: `direccion`, `fecha_constitucion`, `banco.nombre`, `banco.tipo_cuenta`, `banco.titular`, `*.cargo`, … | `[dato oculto]` [ASSUMED literal] | |

Source values [VERIFIED: reto-01/fixtures/reto-01/repositorio/maestro.json:4,10,11,32,34,41,53,55]: `"nit": "900123456"`, `"codigo_postal": "050021"`, `"telefono": "+57 604 555 0100"`, `"nombre": "Roberto Andrade Salazar"`, `"identificacion": "71555123"`, `"email": "lgomez@periferia-ficticia.com"`, `"numero_cuenta": "03100012345"`, `"swift": "COLOCOBM"`.

**The policy covers more than `valor_enmascarado`.** Anything a tool returns, logs or prints must be built from canonical data (rutas, canonical etiquetas, counts, codes), never echoed from input. Concretely:
- `MAPEO_INCONSISTENTE` diferencias list **canonical** etiquetas only. A received item whose etiqueta isn't in the template is reported by array index, not by text, because the model could put a value in `etiqueta`.
- Notes that go to the LLM (`nota` in `present()`) may contain only `reglas` text plus variables from a **code-owned** allowlist (`ingresos_ultimo_ano.moneda`, `ingresos_ultimo_ano.ano`, `pais`) [ASSUMED: D-05 governs `valor_enmascarado`; this extends it conservatively to note variables].

### Pattern 6: `reglas.json` schema and template engine (D-28, D-29)

`src/knowledge/reglas.json` (proposed v1; zod-validated per execution; failure → `REGLAS_INVALIDAS`):
```json
{
  "version": 1,
  "confianza": {
    "umbral": 0.8,
    "glosario_exacto": 1,
    "glosario_normalizado": 0.95,
    "clave_directa": 0.85,
    "regla_pais": 0.6,
    "etiqueta_generica": 0.5,
    "sin_fuente": 0
  },
  "identificador_tributario": {
    "ruta": "nit",
    "pais_origen": "CO",
    "por_pais": { "CO": "NIT", "EC": "RUC", "PE": "RUC", "PA": "RUC", "HN": "RTN" },
    "nota_extranjero": "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano",
    "nota_generica": "Etiqueta genérica: el equivalente en {{pais}} es {{identificador}}; confirmar con el cliente"
  },
  "etiquetas_genericas": ["Identificación tributaria", "Número de identificación fiscal"],
  "notas_contexto": [
    { "ruta": "ingresos_ultimo_ano.valor", "aplica": "extranjero", "texto": "{{moneda}}, año {{ano}}" },
    { "ruta": "pais", "aplica": "siempre", "texto": "Código ISO del país de constitución de Periferia" }
  ],
  "soportes": {
    "dias_aviso_vencimiento": 30,
    "aviso_emisor_distinto": "Emitido en {{pais_emisor}}: confirmar si el cliente lo acepta"
  },
  "plantillas": {
    "checklist": "plantillas/checklist.md",
    "borrador_correo": "plantillas/borrador-correo.md",
    "envio_simulado": "plantillas/envio-simulado.md",
    "valores_portal": "plantillas/valores-portal.md"
  }
}
```
The country/identifier values come from the PRD (RN1) and D-29. The note strings come from D-02, D-04 and D-22. The confidence numbers come from D-19. The `{{moneda}}`/`{{ano}}` placeholder names are a proposal [ASSUMED].

- **Location:** resolve `reglas.json` and the templates relative to the module (`new URL("../knowledge/…", import.meta.url)` from the infra loader). They ship with the code, which is what `modulo/` hosts need, because their `ctx.directory` is a foreign project. The fixtures, by contrast, resolve from `ctx.directory` (PRD §6.2). Pass the reglas path as an `Entorno` field so tests can point at a broken copy (`REGLAS_INVALIDAS` test).
- **Schema refinements:** numbers in `[0,1]`; `por_pais` keys `^[A-Z]{2}$`; template paths match `^plantillas/[a-z-]+\.md$` (no traversal); `dias_aviso_vencimiento` is an int between 0 and 365.
- **Template engine (pure, about 50 lines):** syntax `{{variable}}`, `{{#lista}}…{{/lista}}` (iterate an array of flat records, `{{campo}}` inside), and `{{^lista}}…{{/lista}}` (render when the list is empty). One nesting level only. No expressions, helpers or partials, and nothing like `eval`, `new Function` or `${}`. **An unknown variable or section is an error**, reported as `REGLAS_INVALIDAS` with the template name, never silently left empty. Values are escaped for markdown table cells (`|` → `\|`, `\r?\n` → space). Output is markdown text only. No HTML.
- **Security property:** each template receives a context object **built in code from an explicit allowlist type**. `DatosBorradorCorreo` has no `banco` field, so an edited template that writes `{{banco.numero_cuenta}}` fails with `REGLAS_INVALIDAS` instead of leaking. RN2 is enforced by type plus engine strictness, not by template discipline.

### Pattern 7: xlsx writer (FORM-01, D-01, D-02, D-04, D-33.5)

Exec-verified on Bun 1.4.3 + exceljs 4.4.0:
- `ws.getCell("C5").value = "03100012345"` reads back as `"03100012345"` with `type 3` (string). `"050021"`, `"+57 604 555 0100"` and `"98000000000"` also stay strings.
- **`"=1+1"` written as a string is stored as a shared string (`<c r="C10" t="s">`), not a formula.** No `'` prefix needed. Formulas only come from `{ formula }` objects.
- Fill: `cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } }` (light red) or `"FFFFEB9C"` (light yellow). Reads back identically.
- Comment: `cell.note = "Faltante: no existe en el maestro"` is written to `xl/comments1.xml` and reads back as a string (an object `{ texts: [...] }` also reads back as a plain string).
- `cell.numFmt = "@"` (text format) survives `writeBuffer` → `load` (`bun:test` passed). Recommended on value cells, so Excel keeps treating edits as text.
- Two sheets: `addWorksheet("Datos Proveedor")` plus `addWorksheet("Datos Bancarios")` read back as `["Datos Proveedor", "Datos Bancarios"]`. Group template rows by `hoja` in order of first appearance.
- Labels go in `celda_etiqueta` (bold); values in `celda_valor`. For a `faltante` field, leave the value cell empty (`null`) but give it a fill and a note.
- Metadata: `wb.creator`, `wb.lastModifiedBy`, `wb.created = wb.modified = <clock date at 00:00Z>`. `docProps/core.xml` then contains `2026-09-03T00:00:00Z`.
- **Determinism limit (finding):** zip entry timestamps are wall-clock (`zipinfo`: `26-Oct-12 20:25`) at 2-second DOS resolution. Two runs 1.1 s apart produced equal bytes; 4.5 s apart, they differed. **A byte-compare test is flaky.** Compare semantically: for every template row, cell value, fill ARGB, note and sheet names.

### Pattern 8: PDF writer (FORM-02, D-03)

Exec-verified on Bun 1.4.3 + pdf-lib 1.17.1 (Helvetica):

| Input | Result |
|---|---|
| `Razón social ñ Ñ áéíóú ü ¿¡ Medellín Gómez Vélez` | OK |
| `€ “comillas” ‘simples’ — – … • ° º ª`, NBSP | OK |
| `\n`, `\t`, `\r` | **throws** `WinAnsi cannot encode` |
| NFD `Razón` (combining accent) | **throws** (0x0301) |
| `✓`, `⚠`, `→`, U+200B, emoji | **throws** |

Sanitizer (exec-verified: output `"Razón ? línea nueva ? ? “ok” — €"`, encodes OK):
```typescript
const soportados = new Set(font.getCharacterSet());
const sanear = (t: string) =>
  Array.from(t.normalize("NFC").replace(/[\t\r\n]+/g, " "))
    .map((c) => (soportados.has(c.codePointAt(0) ?? -1) ? c : "?"))
    .join("");
```
- **Layout model, the testable seam:** `componerPdf(entrada, medir: (texto, tamano, negrita) => number) → Pagina[]`. Each `Pagina` is `{ lineas: { x, y, texto, negrita, color: "texto" | "faltante" | "por_confirmar" }[] }`. It is pure; in tests, pass `medir = (t) => t.length * 5`. Content: a header (title, caso, cliente, fecha de ejecución), then one block per template field in order (label bold, an `*` suffix when `obligatorio`, the value wrapped at the column width). `faltante` shows `[FALTANTE]` in the color for faltante. `requiere_confirmacion` shows `<valor> [POR CONFIRMAR]` in the color for por confirmar. A final "Notas" section lists `etiqueta: motivo`. Start a new page when `y < margen`. The 85-char `actividad_economica` must wrap.
- **Render:** map colors with `rgb(0.75, 0, 0)` for faltante, `rgb(0.8, 0.5, 0)` for por confirmar and black for text (discretion). Call `setTitle/Author/Creator/Producer("registro-proveedor")` and `setCreationDate/ModificationDate(<clock date>)`.
- **Determinism:** two renders 1.5 s apart were **byte-identical** (989 bytes). Font resource names carry suffixes (`/Helvetica-7098480789`), yet output is stable across runs because pdf-lib's internal RNG is seeded [ASSUMED mechanism; equality exec-verified]. No `/ID` is written.
- **Reading back in tests:** `PDFDocument.load(bytes, { updateMetadata: false })`. Without that flag, load overwrites Producer with `pdf-lib (https://github.com/Hopding/pdf-lib)`, which was observed. Text extraction helper (exec-verified; returns `{texto, color}` items in draw order, e.g. `{ texto: "[FALTANTE]", color: "0.75 0 0" }`):
```typescript
import { inflateSync } from "node:zlib";
import { PDFArray, PDFDocument, PDFName, PDFRawStream, PDFRef, type PDFObject } from "pdf-lib";

function flujos(doc: PDFDocument, contenido: PDFObject | undefined): PDFRawStream[] {
  const items = contenido instanceof PDFArray ? contenido.asArray() : contenido ? [contenido] : [];
  return items
    .map((it) => (it instanceof PDFRef ? doc.context.lookup(it) : it))
    .filter((o): o is PDFRawStream => o instanceof PDFRawStream);
}

export async function extraerTrazos(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const win1252 = new TextDecoder("windows-1252");
  const trazos: { texto: string; color: string }[] = [];
  for (const page of doc.getPages()) {
    for (const flujo of flujos(doc, page.node.Contents())) {
      const raw = flujo.dict.get(PDFName.of("Filter")) ? inflateSync(flujo.contents) : flujo.contents;
      const ops = new TextDecoder("latin1").decode(raw);
      for (const m of ops.matchAll(/([\d.]+ [\d.]+ [\d.]+) rg[\s\S]*?<([0-9A-Fa-f]*)> Tj/g)) {
        const b = Uint8Array.from((m[2] ?? "").match(/../g) ?? [], (h) => Number.parseInt(h, 16));
        trazos.push({ texto: win1252.decode(b), color: m[1] ?? "" });
      }
    }
  }
  return trazos;
}
```
This helper lives in `tests/helpers/` only. Test code is exempt from layering, but the no-comments rule still applies to it.

### Pattern 9: Clock (PAQ-05) and determinism

- Port `Reloj { hoy(): FechaISO; ahora(): string }`. `relojSistema(tz)` uses `new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())`. Exec-verified: `2026-10-13T03:00Z` in America/Bogota gives `2026-10-12`. `relojFijo("2026-09-03")` returns that date for `hoy()`. `ahora()` stays wall-clock in both (it is only for the `ts` in logs).
- Config: `FECHA_EJECUCION` is optional, matches `^\d{4}-\d{2}-\d{2}$` and is a real calendar date. Preprocess `""` to `undefined`, because Bun auto-loads `.env` and a copied `.env.example` leaves it empty. `TZ_NEGOCIO` defaults to `"America/Bogota"`. Parse config **per execution** (cheap, and consistent with no-cache reglas), so `demo.ts` can set the env var after imports.
- Vigencia: `vencido ⇔ vigencia_hasta !== null && vigencia_hasta < hoy` (ISO string compare; the expiry day itself is still valid). `dias = (Date.parse(vigencia) - Date.parse(hoy)) / 86_400_000` (both parse as UTC midnight, so it's exact). Warn when `0 <= dias <= dias_aviso_vencimiento`.

### Pattern 10: Logs (SEG-04, RN5, CA4)

- `out/<caso>/log.jsonl`: exactly `{ ts, herramienta, ok, resumen }`. Recommended additions: `sesion` and `codigo` (when `ok: false`). `out/log.jsonl`: the same plus `caso`. A failure before a valid caso is known (bad regex, `CASO_NO_ENCONTRADO`) goes to the global log only (discretion).
- `herramienta` is `proveedor_<nombre>`. `resumen` is Spanish built from counts and codes, for example `"co-industrias-delta: 17 llenos, 0 faltantes, 0 por confirmar"` or `"armar_paquete: BLOQUEADO (ausente: certificado_cumplimiento_tributario)"`. Never values.
- Write with `appendFile(path, JSON.stringify(linea) + "\n")`: one call per line, inside the per-caso mutex.
- **Per-caso mutex:** an in-process `Map<string, Promise<void>>` chain (about 15 lines). It wraps `mapear_campos` (writes `mapeo.json`), `generar_formulario`, `armar_paquete` and `simular_envio`. Phase 1 is sequential, but Phase 3 serves concurrent sessions through the same tools.

### Tool Contract Spec (proposed shapes; planner locks them in the tracer plan)

All `data` paths are **relative** (`out/co-industrias-delta/formulario.xlsx`), never absolute. That avoids leaking host paths and keeps outputs deterministic. All responses carry an additive top-level `resumen`.

| Tool | Args (`.strict()`, each `.describe()`d) | `data` on success | Errors |
|---|---|---|---|
| `leer_solicitud` | `caso` | `{ caso, pais, cliente, formato, plantilla, campos: {etiqueta, obligatorio: boolean\|null}[], ambiguos: {etiqueta, estado:"requiere_confirmacion", propuesta}[], soportes: string[] }` | `CASO_INVALIDO`, `CASO_NO_ENCONTRADO` (+`parcial.casos_disponibles`), `PLANTILLA_INVALIDA` (+`parcial:{pais,cliente,formato,soportes}`) |
| `mapear_campos` | `caso`, `campos: string[]` (max 200; **empty = all template labels**, recommended) | `{ caso, pais, conteo:{lleno,faltante,requiere_confirmacion}, llenos[], faltantes[], requiere_confirmacion[], mapeo:"out/<caso>/mapeo.json" }`; items `{etiqueta, ruta, estado, regla, confianza, valor_enmascarado, nota?}` | + `CAMPOS_FUERA_DE_PLANTILLA` (+`parcial.etiquetas_esperadas`) |
| `generar_formulario` | `caso`, `mapeo: {etiqueta, estado, ruta: string\|null}[]` (item `.strict()`; `ruta` matches `^[a-z_]+(\.[a-z_]+)*$`) | xlsx/pdf: `{ ruta, formato }`; portal: `{ ruta: "out/<caso>/valores-portal.md", formato: "portal", aviso: "formato no soportado" }` | + `MAPEO_INCONSISTENTE` (+`parcial.diferencias`), `ARGS_INVALIDOS` (an item with `valor` → zod `unrecognized_keys`, exec-verified) |
| `armar_paquete` | `caso` | `{ ruta:"out/<caso>/paquete", listo_para_firma, bloqueos: string[], checklist:{ soportes:{tipo, estado:"presente"\|"ausente"\|"vencido", vigencia_hasta, archivo\|null, aviso\|null, aviso_emisor\|null}[], faltantes: string[], requiere_confirmacion:{etiqueta,nota}[] }, archivos: string[] }` | + `FORMULARIO_NO_GENERADO` |
| `simular_envio` | `caso`, `confirmado: boolean` | `{ ruta:"out/<caso>/ENVIO-SIMULADO.md", bloqueos: string[] }` | `CONFIRMACION_REQUERIDA` with `error: "requiere confirmación explícita"` (byte-exact PRD literal), `PAQUETE_NO_ARMADO` |

Decisions to lock:
- **Error shape:** `{ ok:false, error, codigo, parcial? }`. Use `parcial` as the single optional structured carrier (D-17), also for `casos_disponibles`, `etiquetas_esperadas` and `diferencias`, so the shape stays uniform.
- **`simular_envio` check order:** args → caso → `confirmado !== true` → `CONFIRMACION_REQUERIDA` → paquete exists → write. Confirmation goes first because the PRD literal is unconditional and success criterion 4 states it unconditionally.
- **D-11 comparison:** canonical mapping vs received, keyed by canonical etiqueta (order-insensitive). Any missing, extra, `ruta` mismatch or `estado` mismatch → `MAPEO_INCONSISTENTE`. Because `generar_formulario` requires the full mapping, the knowledge doc (Phase 2) must say "pass the complete `mapear_campos` result".
- **Template-selection matrix (SOLI-01):**

  | Files present | `formato` | Result |
  |---|---|---|
  | only `plantilla-celdas.json` | `xlsx` | xlsx |
  | only `plantilla-campos.json` | `pdf` | pdf |
  | either | `portal` | `valores-portal.md` (pa uses `plantilla-campos.json`) |
  | only `plantilla-campos.json` | `xlsx` | `PLANTILLA_INVALIDA` ("el formato xlsx requiere plantilla-celdas.json") [ASSUMED] |
  | only `plantilla-celdas.json` | `pdf` | pdf from the labels in order [ASSUMED] |
  | both or none | any | `PLANTILLA_INVALIDA` [ASSUMED] |

- **Paquete (PAQ-01):** copy the formulario (or `valores-portal.md`), then copy every exigido soporte whose `index.json` entry exists **and** whose file exists, vencidos included (they "exist"; the checklist marks them). An index entry whose file is missing counts as `ausente`. Then `checklist.md` and `borrador-correo.md` [ASSUMED interpretation of "copias de los soportes exigidos que existan"].
- **`mapeo.json` (MAP-06):** `{ caso, pais, fecha_ejecucion, campos: [{etiqueta, ruta, estado, regla, confianza, valor_enmascarado, nota?}] }`. **No raw values**, so it is PII-safe and can be served or logged later. MAP-06 requires `ruta`, `regla` and `confianza`, not the value.
- `leer_solicitud` does **not** return `cuerpo` in Phase 1. SOLI-03 (delimited, truncated, untrusted) is Phase 2's decision.

## Golden Oracle (DEMO-02, D-21)

Derived by running a prototype of the algorithm above over `reto-01/fixtures/reto-01` with `hoy = 2026-09-03` [VERIFIED: exec prototype this session]. Every `lleno` field resolves through `glosario_exacto` (1.0).

**co-industrias-delta**: CO, xlsx (`plantilla-celdas.json`, sheets `Datos Proveedor` + `Datos Bancarios`), 17 → **17/0/0**, **listo**.
Rutas in template order: `razon_social, nit, digito_verificacion, direccion, ciudad, codigo_postal, telefono, contacto_comercial.email, representante_legal.nombre, representante_legal.identificacion, actividad_economica, ciiu_principal, regimen_tributario, banco.nombre, banco.tipo_cuenta, banco.numero_cuenta, banco.titular`. NIT stays `lleno` (country CO).

**ec-corp-andina**: EC, pdf (`plantilla-campos.json`), 15 → **13/1/1**, **bloqueado** (ausente `certificado_cumplimiento_tributario`).
- `requiere_confirmacion`: `RUC` → `nit`, `regla_pais`, 0.6.
- `faltante`: `Número de contribuyente especial` (`sin_fuente`, 0).
- `lleno`: Nombre de la empresa→razon_social, Domicilio fiscal→direccion, Ciudad→ciudad, País→pais (+ País note), Teléfono→telefono, Correo electrónico→contacto_comercial.email, Página web→sitio_web, Representante legal→representante_legal.nombre, Cargo del representante legal→representante_legal.cargo, Actividad económica→actividad_economica, Banco→banco.nombre, Número de cuenta→banco.numero_cuenta, SWIFT→banco.swift.

**hn-agroexport-sula**: HN, xlsx (sheet `Registro`), 11 → **9/1/1**, **bloqueado** (vencido `parafiscales`, 3 days past).
- `requiere_confirmacion`: `RTN` → `nit`, `regla_pais`.
- `faltante`: `Referencias comerciales`.
- `lleno`: Razón social, País (+ note), Dirección, Teléfono, Correo electrónico, Representante legal, Fecha de constitución→fecha_constitucion, Número de empleados→numero_empleados (**number** in the maestro → `"480"`), Ingresos anuales→ingresos_ultimo_ano.valor (**number** → `"98000000000"`, + note `COP, año 2025` because HN is foreign).

**pa-logistica-istmo**: PA, **portal** with `plantilla-campos.json`, 9 → **8/0/1**, **listo**.
- `requiere_confirmacion`: `RUC` → `nit`.
- `lleno`: Nombre o razón social del proveedor→razon_social, Dirección, Teléfono, Correo electrónico, Representante legal, Banco, Número de cuenta, SWIFT.

**Soportes at 2026-09-03:**

| Caso | camara_comercio | rut | certificacion_bancaria | estados_financieros | parafiscales | cert_cumplimiento_trib | Emitter warning (D-22) |
|---|---|---|---|---|---|---|---|
| co | presente, **vence en 27 días** | presente (null = no aplica) | presente (119 d) | presente (209 d) | — | — | none (CO = CO) |
| ec | presente, vence en 27 días | presente | presente | presente | — | **ausente** | **on all 4 present** (CO ≠ EC) |
| hn | presente, vence en 27 días | presente | — | — | **vencido** (2026-08-31) | — | on all 3 (CO ≠ HN) |
| pa | presente, vence en 27 días | presente | — | — | — | — | on both (CO ≠ PA) |

Source values [VERIFIED: reto-01/fixtures/reto-01/repositorio/soportes/index.json:3-6,10-13,24-27]: `"tipo": "camara_comercio"`, `"vigencia_hasta": "2026-09-30"`, `"pais_emisor": "CO"`; `"tipo": "rut"`, `"vigencia_hasta": null`; `"tipo": "parafiscales"`, `"vigencia_hasta": "2026-08-31"`. EC requirement [VERIFIED: reto-01/fixtures/reto-01/casos/ec-corp-andina/soportes-exigidos.json:6]: `"certificado_cumplimiento_tributario"`. Portal [VERIFIED: reto-01/fixtures/reto-01/casos/pa-logistica-istmo/solicitud.json:9]: `"formato": "portal"`. Glossary [VERIFIED: reto-01/fixtures/reto-01/glosario-campos.json:6-10]: `"NIT": "nit"`, `"RUC": "nit"`, `"RTN": "nit"`, `"Identificación tributaria": "nit"`, `"Número de identificación fiscal": "nit"`; [:19] `"Correo electrónico": "contacto_comercial.email"`; [:27] `"Ingresos anuales": "ingresos_ultimo_ano.valor"`. Maestro [:21-26]: `"numero_empleados": 480`, `"valor": 98000000000`, `"moneda": "COP"`, `"ano": 2025`.

Consequence: the D-22 emitter warning appears on **every** present soporte for ec, hn and pa. The checklist template should render it as a column, not as separate paragraphs, or the checklist gets noisy.

**Synthetic fixtures (DEMO-04, D-20).** These are mandatory because no real case exercises the rules. They live in `tests/fixtures/casos/`, are copied into a temp project root at test time, and use names that pass the regex:

| Synthetic caso | Content | Expected |
|---|---|---|
| `zz-generica-co` | CO, pdf, `plantilla-campos.json`: `Identificación tributaria`, `RAZON SOCIAL:`, `Teléfono *`, `Sitio web`, `Gran contribuyente`, `constructor` | generic → `requiere_confirmacion` 0.5, proposes `NIT`; `RAZON SOCIAL:` → `glosario_normalizado` 0.95 lleno; `Teléfono *` → normalized lleno; `Sitio web` → `clave_directa` 0.85 lleno (`sitio_web`); `Gran contribuyente` → boolean → `faltante`; `constructor` → `faltante` (prototype safety) |
| `zz-generica-ec` | EC, `Número de identificación fiscal` | `requiere_confirmacion` 0.5, proposes `RUC` + foreign-identifier note |
| `zz-plantilla-corrupta` | `plantilla-celdas.json` with invalid JSON or wrong shape | `PLANTILLA_INVALIDA` + `parcial:{pais,cliente,formato,soportes}` from `leer_solicitud` and `mapear_campos` |
| (no folder) `no-existe` | — | `CASO_NO_ENCONTRADO` + `casos_disponibles` sorted |
| args `../x`, `CO`, `a/b`, `""` | — | `CASO_INVALIDO` (regex) or `ARGS_INVALIDOS`; temp-dir symlink `zz-escape → os.tmpdir()` → `CASO_INVALIDO` (realpath) |
| broken `reglas.json` (temp copy) | `umbral: 2` or a template with `{{banco.numero_cuenta}}` | `REGLAS_INVALIDAS` |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| xlsx writing (OOXML zip, shared strings, comments VML) | Raw XML + zip | exceljs 4.4.0 | Comments need `comments1.xml` + a VML drawing + rels (observed in the unzip) |
| PDF encoding/layout primitives | Raw PDF operators | pdf-lib 1.17.1 (`drawText`, `widthOfTextAtSize`, `getCharacterSet`) | Font metrics and encoding tables |
| Arg/fixture validation and JSON Schema | Manual type guards | zod 4 (`.strict()`, `z.toJSONSchema` in Phase 2, `z.locales.es()`) | One schema for runtime and contract |
| Spanish validation messages | A message table per zod issue code | `z.locales.es().localeError` per parse | Covers every issue code; no global mutation |
| Date-in-timezone | Manual UTC offset math | `Intl.DateTimeFormat("en-CA", { timeZone })` | DST/offset correctness |
| PDF text extraction in tests | A full PDF parser | The 25-line `extraerTrazos` above (pdf-lib + `node:zlib`) | Enough for our own generated PDFs |
| Template engine | Full Mustache/Handlebars semantics | A **minimal** own engine (variables + one-level sections, strict unknown-variable errors) | A dependency would need justifying, and a smaller surface means the RN2 guarantee is easy to explain line by line |
| Path containment | String `includes("..")` checks | `realpath` + `startsWith(base + sep)` | Symlinks and normalization (exec-verified) |

**Key insight:** this phase's risk lives in the data rules (mapping, masking, vigencias) and in IO edge cases (encoding, coercion, paths), not in algorithms. Use the libraries for formats, and keep every business rule as a small pure function with a golden test.

## Common Pitfalls

### Pitfall 1: Flaky xlsx determinism test
**What goes wrong:** Comparing `formulario.xlsx` bytes between two demo runs sometimes passes and sometimes fails.
**Why it happens:** exceljs stamps zip entries with wall-clock time at 2-second resolution (exec-verified: equal at 1.1 s, different at 4.5 s).
**How to avoid:** Compare semantically: sheet names, plus value, fill and note for every template row. Byte-compare `.pdf`, `.md` and `.json` files and the soporte copies. Compare `.jsonl` after dropping `ts`.
**Warning signs:** A determinism test that passes locally and fails in CI.

### Pitfall 2: pdf-lib crashes on real-world strings
**What goes wrong:** `WinAnsi cannot encode` on newlines, NFD accents (common when text comes from macOS file systems or copy-paste), ✓/⚠/→ or emoji.
**How to avoid:** Run every drawn string through the `getCharacterSet` sanitizer after NFC normalization. Unit-test the sanitizer with the table above.

### Pitfall 3: Prototype keys in glossary or maestro lookups
**What goes wrong:** `glosario["constructor"]` is truthy, so a template label named like an `Object.prototype` member maps to garbage.
**How to avoid:** Use `Map` for the glossary, and `Object.hasOwn` plus a `^[a-z_]+$` segment regex in `leerRuta`. Cover it with the synthetic `constructor` label.

### Pitfall 4: Echoing untrusted input into tool responses or logs
**What goes wrong:** A zod message, `MAPEO_INCONSISTENTE` details or a log line repeats something the model sent, such as a value smuggled inside `etiqueta`, and the PII grep fails or the LLM sees PII.
**How to avoid:** Build responses and logs only from canonical data. Log only the regex-validated `caso`. Exec-verified: zod issues for unknown keys and regex mismatches do **not** include the offending value (`Llave desconocida: "valor"`, `Cadena inválida: debe coincidir con el patrón …`).

### Pitfall 5: Reading back PDF metadata through a mutating load
**What goes wrong:** `PDFDocument.load(bytes)` rewrites Producer and ModDate in memory, so a metadata assertion fails or checks the wrong thing.
**How to avoid:** Use `PDFDocument.load(bytes, { updateMetadata: false })` (exec-verified).

### Pitfall 6: Biome panic on escaping symlinks
**What goes wrong:** `biome check .` aborts with "path is expected to be under the root" when a symlink in the tree points outside the root (exec-reproduced).
**How to avoid:** Create symlink-traversal fixtures in `os.tmpdir()` at test time. Never commit symlinks.

### Pitfall 7: `noExplicitAny` silently non-blocking
**What goes wrong:** Biome's recommended preset reports `any` as a warning (`!`) and exits 0, so the "no `any`" rule isn't enforced.
**How to avoid:** Set `"suspicious": { "noExplicitAny": "error" }` (exec-verified exit 1). `tsc` strict separately forbids implicit any.

### Pitfall 8: Architecture test that misses type imports
**What goes wrong:** Using `Bun.Transpiler().scanImports()` lets `import type { X } from "../infra/…"` in domain pass unnoticed.
**How to avoid:** Use the regex scanner (exec-verified to catch `import type` and `export type`).

### Pitfall 9: Clock or config frozen at import time
**What goes wrong:** `demo.ts` sets `FECHA_EJECUCION` but the tools parsed env at import, so they use today's date and every case flips to BLOQUEADO (cámara expired 2026-09-30).
**How to avoid:** Parse config inside `crearEntorno` on every execution. `demo.ts` sets `process.env.FECHA_EJECUCION = "2026-09-03"` unconditionally before the first call and prints it.

### Pitfall 10: Generic labels are only tested by synthetic fixtures
**What goes wrong:** The 4 real cases never hit `glosario_normalizado`, `clave_directa` or `etiqueta_generica`, so a broken rule ships green.
**How to avoid:** Make the synthetic fixtures part of the tracer plan's tests, not the last plan.

### Pitfall 11: Checklist noise from D-22
**What goes wrong:** Emitter warnings repeated as paragraphs swamp the checklist for ec, hn and pa.
**How to avoid:** Render the warning as a column of the soportes table (D-27 already lists it as a column).

## Code Examples

### Normalization and value text
```typescript
export function normalizarEtiqueta(etiqueta: string): string {
  return etiqueta
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s:*]+$/u, "")
    .trim();
}

export function aTexto(valor: string | number): string {
  return typeof valor === "number" ? String(valor) : valor;
}
```

### Masks
```typescript
const PUNTO = "•";
export const ultimos4 = (v: string) => (v.length <= 4 ? PUNTO.repeat(4) : PUNTO.repeat(v.length - 4) + v.slice(-4));
export const iniciales = (v: string) => v.split(/\s+/).filter(Boolean).map((p) => `${p[0] ?? ""}.`).join(" ");
export const correo = (v: string) => {
  const [usuario = "", dominio = ""] = v.split("@");
  return `${usuario.slice(0, 1)}${PUNTO.repeat(3)}@${dominio}`;
};
export const telefono = (v: string) => {
  const partes = v.split(" ");
  return partes.map((p, i) => (i === partes.length - 1 || (i === 0 && p.startsWith("+")) ? p : PUNTO.repeat(3))).join(" ");
};
```
Expected: `ultimos4("900123456") === "•••••3456"`, `ultimos4("71555123") === "••••5123"`, `iniciales("Roberto Andrade Salazar") === "R. A. S."`, `correo("lgomez@periferia-ficticia.com") === "l•••@periferia-ficticia.com"`, `telefono("+57 604 555 0100") === "+57 ••• ••• 0100"`.

### Strict mapeo item (exec-verified: rejects `valor`)
```typescript
const itemMapeo = z
  .object({
    etiqueta: z.string().min(1).max(200).describe("Etiqueta exacta de la plantilla"),
    estado: z.enum(["lleno", "faltante", "requiere_confirmacion"]).describe("Estado devuelto por mapear_campos"),
    ruta: z.string().regex(/^[a-z_]+(\.[a-z_]+)*$/).nullable().describe("Ruta en el maestro, o null si es faltante"),
  })
  .strict();
```
Write `ruta` as `.nullable()`, not `.optional()`, so the Phase 2 strict-tools flip needs no refactor (STACK.md).

### PII grep test (SEG-02) with a positive control
```typescript
const PII = /71555123|03100012345|COLOCOBM/;
```
Scan every tool response string captured during the demo run, `out/log.jsonl`, `out/*/log.jsonl`, `out/*/mapeo.json`, `out/*/paquete/checklist.md`, `out/*/paquete/borrador-correo.md`, `out/*/ENVIO-SIMULADO.md` and the demo stdout. **Positive control:** assert that `out/co-industrias-delta/formulario.xlsx` read back with exceljs **does** contain `03100012345` at `Datos Bancarios!C5`. Otherwise the test could pass vacuously. Values are allowed in `formulario.*` and `valores-portal.md` (D-25).

### No-comments test (CAL-02)
Scan `src/**/*.ts`, `demo.ts` and `tests/**/*.ts` with a small state machine that tracks `'`, `"` and backtick strings and flags `//` or `/*` outside them. Write any regex literal that needs `//` as `\/\/`. A plain regex would false-positive on `https://` inside strings.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `zod-to-json-schema` | `z.toJSONSchema()` native | zod 4 | Phase 2 tool schemas. Exec-verified output includes `additionalProperties: false` and `required` |
| Global `z.setErrorMap` | Per-parse `{ error }` + `z.locales.*` | zod 4 | Spanish messages without global side effects |
| `xlsx@0.18.5` from npm | exceljs 4.4.0, or SheetJS from its CDN | SheetJS left npm in 2022 | No CVE-flagged dep |
| JS `tsc` 5.x | Native `tsc` 7.0.2 | TS 7 (2026-07) | Fast checks; tools needing the TS JS API may lag (Biome doesn't need it) |
| Biome 1 `"recommended": true` | Biome 2.5 `"rules": { "preset": "recommended" }` | Biome 2.x | `biome init` 2.5.15 emits the new key (exec-verified) |

**Deprecated/outdated:** `bun check` as a builtin collides with a `check` script (the script wins). Always call `bun run check`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `glosario["constructor"]` / `__proto__` hazards (standard JS semantics, not exec-tested this session) | Pattern 4, Pitfall 3 | Low. The mitigation (`Map` + `hasOwn`) is harmless either way |
| A2 | `[dato oculto]` as the literal for the default mask | Pattern 5 | Low. Cosmetic, but it is part of the `mapear_campos` output contract (D-05 costly) |
| A3 | Note variables (`moneda`, `ano`, `pais`) may reach the LLM through `nota` | Pattern 5 | Medium. If the user reads D-05 strictly, notes toward the LLM must be static text. **RESOLVED by D-36:** allowed through a code allowlist; amounts stay masked |
| A4 | `campos: []` in `mapear_campos` means "all template labels" | Tool Contract | Low. Convenience semantics; must be documented in `.describe()` |
| A5 | Template-selection edge cases (xlsx with only campos → error; pdf with only celdas → pdf; both or none → error) | Tool Contract | Low. No real fixture hits them |
| A6 | Vencido soportes are copied into `paquete/` (they "exist") | Tool Contract | Low-Medium. The PRD wording supports it; the user might prefer to exclude them |
| A7 | `simular_envio` checks `confirmado` before paquete existence | Tool Contract | Low |
| A8 | `reglas.json` field names and `{{moneda}}`/`{{ano}}` placeholder names | Pattern 6 | Low. The planner can rename before the tracer plan locks it |
| A9 | Bun does not enforce `engines.bun` | Scaffolding | Low. `.bun-version` and CI pin the version anyway |
| A10 | pdf-lib's stable font suffixes come from a seeded RNG (the equality itself is exec-verified) | Pattern 8 | None for the plan. The determinism test verifies equality directly |
| A11 | `CONFIGURACION_INVALIDA` and `DATOS_INVALIDOS` as extra codes beyond D-18's minimum | Pattern 2/4 | Low. D-18 says "como mínimo" |

## Open Questions (RESOLVED)

1. **zod 4.6.7 is hours old (supply-chain cooldown).** RESOLVED by the user in D-35.
   - What we know: it was published 2026-10-12T16:29Z by the GitHub Actions trusted publisher with SLSA provenance and maintainer approval, `bun audit` is clean, and the seam verdict is SUS (too-new). 4.6.6 is from the day before, and 4.6.5 from 2026-09-13.
   - What was unclear: whether the user wants a cooldown policy on top of "latest".
   - Original recommendation: keep 4.6.7 (D-30 locked) behind a `checkpoint:human-verify`, and offer 4.6.5 as the cooldown alternative there.
   - **RESOLVED (D-35, amends D-30):** the user adopted a maturity policy of 7 days or more. The pins are zod **4.6.5**, @types/bun **1.4.2**, @biomejs/biome 2.5.15, typescript 7.0.2, exceljs 4.4.0 and pdf-lib 1.17.1. zod 4.6.7 and @types/bun 1.4.3 are rejected because they were published the same day. Plan 01-01 Task 1 re-checks the publish dates at its legitimacy gate before the first install.
2. **Should notes that reach the LLM carry resolved variables (A3)?** RESOLVED by the user in D-36.
   - Original recommendation: allow only `moneda`, `ano` and `pais` (non-personal corporate context) via a code-owned allowlist, and confirm at the human-verify checkpoint.
   - **RESOLVED (D-36):** notes visible to the LLM may include `ingresos_ultimo_ano.moneda`, `ingresos_ultimo_ano.ano`, `pais` and the fixed `reglas.json` texts, through a code allowlist next to the PII policy. Amounts stay "[monto oculto]". The plans implement this as `VARIABLES_NOTA_PERMITIDAS` in `src/domain/pii.ts` (plan 01-04). That list also carries `identificador` (from reglas) and `pais_emisor` (a country code of the same class as `pais`, needed by D-22).
3. **Bun upgrade on the user's machine (D-32).** RESOLVED as a user action.
   - Original recommendation: a `checkpoint:human-action` in plan 01 (`bun upgrade`, or the official installer pinned to `bun-v1.4.3` [ASSUMED syntax]). Phase 1 code doesn't depend on 1.4-only APIs, so work isn't blocked if the upgrade is postponed.
   - **RESOLVED:** the upgrade is a user action (`bun upgrade`), and the executor never runs it. It is folded into the human gate of plan 01-01 Task 1 as an optional, non-blocking step, and the SUMMARY records `bun --version` after the gate. Phase 1 works on 1.3.10 in the meantime. The end-of-phase human check (plan 01-11) repeats the reminder before Phase 3's Docker image.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | everything | ✓ (wrong version) | 1.3.10 local; 1.4.3 binary verified in scratchpad | Phase 1 code runs on 1.3.10 too. Upgrade via checkpoint |
| npm registry access | `bun install`, `bun audit` in `bun run check` | ✓ | npm 11.13.0 | none for audit; offline check fails |
| Node | not required (Bun-only) | ✓ | v24.16.0 | — |
| git | commit `reto-01/`, Conventional Commits | ✓ | 2.54.0; identity `elianatorres5772 <elianatorres5772@gmail.com>` | — |
| `gh` CLI | not needed in Phase 1 | ✗ | — | — |
| Docker | not needed in Phase 1 | not probed | — | Phase 3 |

**Missing dependencies with no fallback:** none for Phase 1.
**Missing dependencies with fallback:** Bun 1.4.3 (upgrade checkpoint; 1.3.10 works meanwhile).

## Validation Architecture

> `workflow.nyquist_validation` is `false` in `.planning/config.json`, but the orchestrator explicitly requested this section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `bun:test` (Bun 1.4.3), with no extra deps |
| Config file | none needed (Wave 0 may add `bunfig.toml` with `[test] root = "tests"`) |
| Quick run command | `bun test tests/unit tests/contract` |
| Full suite command | `bun test && bun run check` |
| Isolation | Every tool, golden or e2e test runs in `mkdtemp(os.tmpdir())`: copy `reto-01/fixtures/reto-01` to `<tmp>/reto-01/fixtures/reto-01` (`fs.cp` recursive), copy `tests/fixtures/casos/*` into its `casos/`, and set `ctx.directory = <tmp>`. Never touch the repo's `out/` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HERR-01 | exactly 5 exports, `description` is one sentence | architecture | `bun test tests/architecture.test.ts` | ❌ Wave 0 |
| HERR-02/03 | strict args, Spanish `ARGS_INVALIDOS`, JSON string, never throws (including a fuzz of junk args per tool) | contract | `bun test tests/contract` | ❌ |
| HERR-04 | traversal regex, temp symlink escape, no-shell grep | contract + architecture | `bun test tests/contract/rutas.test.ts` | ❌ |
| HERR-05 | import `src/tools/proveedor.ts` with an empty env; `sessionID` accepted | contract | `bun test tests/contract/importacion.test.ts` | ❌ |
| SOLI-01/02 | 4 cases' `leer_solicitud`; generic labels → propuesta | golden + synthetic | `bun test tests/golden` | ❌ |
| MAP-01..07 | field-level oracle (rutas, estado, regla, confianza, masks, notes) | unit + golden | `bun test tests/unit/mapeo.test.ts tests/golden` | ❌ |
| FORM-01 | exceljs readback: every template row, both CO sheets, fills, notes, `"03100012345"` text | golden | `bun test tests/golden/xlsx.test.ts` | ❌ |
| FORM-02 | layout model unit tests + `extraerTrazos` order and colors for ec | unit + golden | `bun test tests/unit/pdf-layout.test.ts tests/golden/pdf.test.ts` | ❌ |
| FORM-03 | pa → `ok:true`, `aviso`, `valores-portal.md` exists | golden | `bun test tests/golden` | ❌ |
| FORM-04 | `mapeo` with `valor` → `ARGS_INVALIDOS`; ruta or estado tampered → `MAPEO_INCONSISTENTE` | contract | `bun test tests/contract/generar.test.ts` | ❌ |
| PAQ-01..04 | paquete files, checklist rows, 27 days, borrador recipient and subject, no `banco.*` values | golden | `bun test tests/golden/paquete.test.ts` | ❌ |
| PAQ-05 | system clock in Bogotá, fixed clock, null vigencia, expiry day still valid | unit | `bun test tests/unit/vigencias.test.ts` | ❌ |
| ENV-01 | literal "requiere confirmación explícita"; `PAQUETE_NO_ARMADO`; only `ENVIO-SIMULADO.md` written | contract | `bun test tests/contract/simular.test.ts` | ❌ |
| SEG-02 | PII grep + positive control | e2e | `bun test tests/e2e/pii.test.ts` | ❌ |
| SEG-04 | both jsonl logs, shape `{ts, herramienta, ok, resumen}` | contract | `bun test tests/contract/bitacora.test.ts` | ❌ |
| DEMO-01 | run demo twice: stdout equal, artifacts equal by the per-type rule | e2e | `bun test tests/e2e/demo.test.ts` | ❌ |
| DEMO-02 | truth table 17/0/0, 13/1/1, 9/1/1, 8/0/1 + listo/bloqueado reasons | golden | `bun test tests/golden` | ❌ |
| DEMO-04 | synthetic fixtures table | contract | `bun test tests/contract/sinteticos.test.ts` | ❌ |
| CAL-01 | tsc + biome + audit | check | `bun run check` | ❌ |
| CAL-02 | no comments | static | `bun test tests/sin-comentarios.test.ts` | ❌ |
| CAL-03 | config schema rejects a bad `FECHA_EJECUCION`; `""` treated as unset | unit | `bun test tests/unit/config.test.ts` | ❌ |
| CAL-04 | import rules table | static | `bun test tests/architecture.test.ts` | ❌ |

The e2e demo test runs `demo.ts` in-process against the temp root or spawns `bun run demo.ts` from the test (spawning is fine in tests; the no-shell rule targets `src/` and `demo.ts`). Prefer exporting a `ejecutarDemo({ directory, escribir })` function from a module that `demo.ts` calls, so the test can capture output without spawning.

### Sampling Rate
- **Per task commit:** `bun test tests/unit tests/contract` (< 5 s expected)
- **Per wave merge:** `bun test && bun run check`
- **Phase gate:** full suite green, plus `bun run demo.ts` twice by hand before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/helpers/proyecto-temporal.ts`: mkdtemp + copy fixtures + synthetic cases
- [ ] `tests/helpers/pdf-texto.ts`: `extraerTrazos`
- [ ] `tests/helpers/xlsx-leer.ts`: readback into `{hoja, celda, valor, relleno, nota}[]`
- [ ] `tests/architecture.test.ts`, `tests/sin-comentarios.test.ts`
- [ ] `tests/fixtures/casos/{zz-generica-co,zz-generica-ec,zz-plantilla-corrupta}/`
- [ ] Install the framework: none (bun:test built in)

## Security Domain

`security_enforcement: true`, ASVS level 1, block on high.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (Phase 3 access code) | — |
| V3 Session Management | no (Phase 2) | — |
| V4 Access Control | partial | Writes confined to `out/<caso>/` with allowlisted names; reads confined to the fixtures root via realpath |
| V5 Input Validation | yes | zod `.strict()` args, fixture/reglas schemas, size limits, regexes for `caso`/`ruta`/soporte names |
| V6 Cryptography | no | — |
| V7 Error Handling and Logging | yes | Catalog codes + Spanish messages, no stack in responses, logs carry codes/counts only |
| V8 Data Protection | yes | Code-owned PII policy, masked tool outputs, value-free `mapeo.json`/logs/borrador, grep test |
| V12 Files and Resources | yes | Path traversal and symlink containment, size limits, no shell, xlsx values as strings (no formulas) |
| V14 Configuration | yes | Pinned exact deps, `bun.lock`, `bun audit --audit-level=moderate` gate, uuid override |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `caso` path traversal / symlink escape | Tampering, Info disclosure | Regex + `realpath` containment (exec-verified) |
| Malicious `archivo` in `index.json` (`../../.env`) | Info disclosure | Basename regex before `copyFile`; copy destination is allowlisted under `paquete/` |
| Spreadsheet formula injection (`=HYPERLINK(...)` in a value) | Tampering | Values written as strings, so they become shared strings, never formulas (exec-verified `"=1+1"`) |
| Model-supplied values reaching the form (CA2) | Tampering | `mapeo` carries rutas only (`.strict()`), the canonical recompute, values read from the maestro |
| Template edited to exfiltrate bank data | Info disclosure | Context type allowlist (no `banco`) + unknown variable → `REGLAS_INVALIDAS` |
| PII in responses or logs via echoed input | Info disclosure | Canonical-only responses, log only the validated `caso`, grep test with a positive control |
| Oversized or hostile fixture (DoS, prototype keys) | DoS, Tampering | Size limit before read, zod schemas, `Map`/`hasOwn` lookups |
| Supply chain (fresh releases, transitive advisories) | Tampering | Exact pins, lockfile, audit gate, provenance check, human-verify checkpoint |

## Recommended Plan Decomposition (coarse granularity)

These waves are sequential, because each plan touches `src/tools/proveedor.ts` or shared domain files, so file-ownership conflicts rule out parallel plans.

| Plan | Wave | Scope | Requirements | Exit evidence |
|---|---|---|---|---|
| **01-01 Fundaciones** | 1 | checkpoints (Bun upgrade, dependency human-verify); `.gitignore`/`.dockerignore`/`.bun-version`; commit `reto-01/` intact; `package.json` (exact pins + override), `tsconfig.json`, `biome.json`, `bun run check`; `src/config` (env zod + constantes); `domain/resultado` + `errores` catalog; `infra/reloj`; fixture zod schemas + reader (size limit); `reglas.json` v1 + loader + template engine + the 4 templates; arch test + no-comments test + test helpers | CAL-01..04, PAQ-05 (clock), parts of HERR-04 | `bun run check` green; arch, no-comments and schema tests green (all 4 real cases + glossary + index + maestro validate) |
| **01-02 Tracer co-industrias-delta** | 2 | domain: normalizar, mapeo (all rules), pii, vigencias, checklist, comparar-mapeo; `defineTool` + contexto + wiring + safe paths + mutex + bitácora; all **5** tools with the xlsx path only; `paquete/` (copies, checklist, borrador); `ENVIO-SIMULADO.md`; synthetic fixtures `zz-generica-*`; golden co | HERR-01..05, SOLI-01/02, MAP-01..07, FORM-01, FORM-04, PAQ-01..04, ENV-01, SEG-04, DEMO-04 (part) | co golden 17/0/0 listo through the real tools in a temp dir; contract tests green |
| **01-03 Formatos y casos restantes** | 3 | PDF layout model + renderer + sanitizer (ec); portal `valores-portal.md` (pa); hn notes + vencido; D-22 emitter column; D-15 subset/`CAMPOS_FUERA_DE_PLANTILLA`; D-17 `parcial` (`zz-plantilla-corrupta`); `REGLAS_INVALIDAS` tests | FORM-02, FORM-03, DEMO-02, DEMO-04 | ec/hn/pa goldens green; pdf `extraerTrazos` order and colors asserted |
| **01-04 demo.ts y cierre** | 4 | `demo.ts` (+ `ejecutarDemo` module): header with the date, per-case block, summary table, safe `out/` clean; e2e determinism (per-type equality rule); PII grep with positive control; final `bun run check` | DEMO-01, SEG-02, DEMO-02 (full) | `bun run demo.ts` twice gives equal output; grep test green; full suite green |

Tracer-first reasoning: plan 01-02 locks the tool contract (shapes, codes, logs, masks) on the simplest case, through the same exported objects that Phase 2's loop and Phase 4's `modulo/` will consume. Plan 01-03 only adds renderers and edge cases behind an already-stable contract.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`, 2026-10-12): versions, publish times, `_npmUser`/trusted publisher, SLSA attestations, postinstall scripts, `uuid@11.1.1` shape
- `gsd-tools query package-legitimacy check` (gsd-core 1.16.0): verdicts and signals
- Exec spike, Bun 1.4.3 binary from `@oven/bun-darwin-aarch64@1.4.3` (scratchpad): install, `bun audit` exit codes with and without the override, TS 7.0.2 tsconfig, Biome 2.5.15 init and config exit codes, the Biome symlink panic, exceljs (text cells, formula-like strings, fills, notes, numFmt, 2 sheets, metadata, zip timestamp nondeterminism), pdf-lib (WinAnsi matrix, sanitizer, byte determinism, `updateMetadata: false`, content-stream extraction), zod 4.6.7 (`.strict()` issues, `z.locales.es()` per parse, `toJSONSchema` draft-07), `Bun.Transpiler.scanImports` vs regex, realpath containment, Bogotá date via Intl, `bun check` script shadowing
- Prototype run of the mapping and vigencia algorithm over `reto-01/fixtures/reto-01` (field-level golden oracle)
- `reto-01/PRD.md` (§5, §6.2, §6.5, §6.6, §7, §8) and the fixture files (read this session)

### Secondary (MEDIUM confidence)
- `.planning/research/{ARCHITECTURE,PITFALLS,STACK,FEATURES,SUMMARY}.md` (project-level research, built upon rather than repeated)

### Tertiary (LOW confidence)
- None used for decisions. Items not exec-verified are listed in the Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Versions, advisories and behaviors were exec-verified on the pinned versions.
- Architecture: HIGH for layering and the contract (PRD + locked decisions + an exec-verified scanner); MEDIUM for the proposed shapes (A4–A8), which the tracer plan locks.
- Pitfalls: HIGH. Most were reproduced in the spike (xlsx zip timestamps, WinAnsi, Biome symlink panic, `noExplicitAny` warning, `scanImports`, `updateMetadata`).
- Golden oracle: HIGH. Derived by executing the algorithm over the real fixtures.

**Research date:** 2026-10-12
**Valid until:** 2026-10-26 (fast-moving pins: zod and @types/bun published the same day). Re-run `npm view` and `bun audit` at install (D-31).
