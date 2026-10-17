# Phase 1: Núcleo determinista - Pattern Map

**Mapped:** 2026-10-12
**Files analyzed:** 47 (approx., from 01-RESEARCH.md §Recommended Project Structure and §Validation Architecture)
**Analogs found:** 0 code analogs / 47. The repo is greenfield. The only tracked files are `.claude/CLAUDE.md` and `.planning/**`.

The repo has no application code, so this map uses two kinds of substitute:
1. **Data analogs:** the real fixture JSON in `reto-01/fixtures/reto-01/`. These are the source of truth for the zod fixture schemas. They are **not yet git-tracked** (`?? reto-01/`). Plan 01-01 must commit `reto-01/` intact first. Until then, cite them only as data shapes, never as code to copy.
2. **Reference patterns:** verified snippets in `01-RESEARCH.md` and `.planning/research/ARCHITECTURE.md` (tracked). Use them as the template.

Every file must follow the CLAUDE.md rules: no comments, no `any`, Spanish domain names and English infra names, and imports that point inward.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog / Reference | Match Quality |
|---|---|---|---|---|
| `.gitignore`, `.dockerignore`, `.bun-version` | config | — | RESEARCH §Scaffolding (L339-345) | reference |
| `package.json` | config | — | RESEARCH §Scaffolding `package.json` (L265-288) | reference |
| `tsconfig.json` | config | — | RESEARCH L290-316 (exec-verified) | reference |
| `biome.json` | config | — | RESEARCH L318-337 (exec-verified) | reference |
| `src/config/env.ts` | config | transform (env→typed) | ARCHITECTURE Pattern 7 (L411-438); RESEARCH Pattern 9 (L649) | reference |
| `src/config/constantes.ts` | config | — | RESEARCH Pattern 3 (L483-490) allowlists/regexes | reference |
| `src/domain/resultado.ts` | model | — | RESEARCH Tool Contract "Error shape" (L672) | reference |
| `src/domain/errores.ts` | model (catalog) | — | D-16/D-18 code list | reference |
| `src/domain/tipos.ts` | model | — | fixture shapes below | data-analog |
| `src/domain/normalizar.ts` | utility (pure) | transform | RESEARCH Pattern 4 L494-498, Code Examples L800 | reference |
| `src/domain/mapeo.ts` | service (pure) | transform | RESEARCH Pattern 4 (L492-511) | reference |
| `src/domain/identificador.ts` (RN1) | service (pure) | transform | RESEARCH Pattern 4 steps 5-6 | reference |
| `src/domain/pii.ts` | utility (pure) | transform | RESEARCH Pattern 5 (L513-531), Code Examples "Masks" L818 | reference |
| `src/domain/vigencias.ts` | service (pure) | transform | RESEARCH Pattern 9 L650 | reference |
| `src/domain/checklist.ts` | service (pure) | transform | D-27 + Tool Contract `armar_paquete` data (L668) | reference |
| `src/domain/comparar-mapeo.ts` | service (pure) | transform | RESEARCH L674 (D-11 comparison) | reference |
| `src/domain/plantillas.ts` (template engine) | utility (pure) | transform | RESEARCH Pattern 6 L576-577 | reference |
| `src/application/puertos.ts` | model (ports) | — | RESEARCH Pattern 9 `Reloj`; L406 `Entorno` record | reference |
| `src/application/{leer-solicitud,mapear-campos,generar-formulario,armar-paquete,simular-envio}.ts` | service (use case) | request-response | ARCHITECTURE Pattern 1 (L224-281); Tool Contract Spec (L659-688) | reference |
| `src/infra/fixtures/esquemas.ts` | model (zod) | validation | **fixture JSON (data analog)** | data-analog |
| `src/infra/fixtures/lector.ts` | service | file-I/O (read) | RESEARCH Pattern 3 items 2,5 | reference |
| `src/infra/knowledge/reglas.ts` (loader + schema) | service | file-I/O (read, per call) | RESEARCH Pattern 6 L535-575 | reference |
| `src/infra/salida/rutas-seguras.ts` | utility | file-I/O | RESEARCH Pattern 3 | reference |
| `src/infra/salida/mutex.ts` | utility | event-driven (lock) | RESEARCH Pattern 10 L657 | reference |
| `src/infra/salida/xlsx.ts` | service | file-I/O (write) | RESEARCH Pattern 7 (L579-590) | reference |
| `src/infra/salida/pdf/layout.ts` | utility (pure) | transform | RESEARCH Pattern 8 L612 | reference |
| `src/infra/salida/pdf/render.ts` | service | file-I/O (write) | RESEARCH Pattern 8 L604-614 | reference |
| `src/infra/salida/markdown.ts`, `copias.ts` | service | file-I/O (write) | RESEARCH Pattern 3 item 3-4, L686 | reference |
| `src/infra/reloj.ts` | utility | — | RESEARCH Pattern 9 L648 | reference |
| `src/infra/bitacora.ts` | service | file-I/O (append) | RESEARCH Pattern 10 (L652-657) | reference |
| `src/tools/define-tool.ts` | middleware (wrapper) | request-response | RESEARCH Pattern 2 (L427-481) | reference (near-exact) |
| `src/tools/contexto.ts` | utility | transform | RESEARCH L473 `normalizarContexto` | reference |
| `src/tools/wiring.ts` | config (composition root) | — | ARCHITECTURE Pattern 2 (L282-295) | reference |
| `src/tools/proveedor.ts` | controller (5 exports) | request-response | Tool Contract Spec table (L663-669) | reference |
| `src/knowledge/reglas.json` | config (data) | — | RESEARCH Pattern 6 JSON (L536-570), copy verbatim | reference (exact) |
| `src/knowledge/plantillas/{checklist,borrador-correo,envio-simulado,valores-portal}.md` | config (data) | — | D-25/D-26/D-27 | none |
| `demo.ts` + `src/demo/ejecutar-demo.ts` (or similar) | controller (driver) | batch | RESEARCH L947, L1000; D-24 | reference |
| `tests/helpers/{proyecto-temporal,pdf-texto,xlsx-leer}.ts` | test | file-I/O | RESEARCH L616-642 (`extraerTrazos`, near-exact) | reference |
| `tests/architecture.test.ts` | test | static | RESEARCH Pattern 1 (L408-425), regex L423 | reference |
| `tests/sin-comentarios.test.ts` | test | static | RESEARCH L852-853 | reference |
| `tests/{unit,contract,golden,e2e}/*.test.ts` | test | — | RESEARCH Test Map (L921-945), Golden Oracle (L690-733) | reference |
| `tests/fixtures/casos/*` (synthetic) | test data | — | copy the shape of the real `reto-01` cases | data-analog |

## Pattern Assignments

### `src/infra/fixtures/esquemas.ts` (zod, validation): data analogs

The real fixture shapes. Each schema should use `.strict()` and add a size limit before parsing (D-33.2, D-33.4).

`casos/co-industrias-delta/plantilla-celdas.json` (array):
```json
{ "hoja": "Datos Proveedor", "celda_etiqueta": "B3", "etiqueta": "Razón social", "celda_valor": "C3" }
```
`casos/ec-corp-andina/plantilla-campos.json` (array):
```json
{ "etiqueta": "RUC", "obligatorio": true }
```
`casos/ec-corp-andina/solicitud.json`:
```json
{ "id": "ec-corp-andina", "de": "...", "para": "...", "asunto": "...", "fecha": "2026-08-27",
  "pais": "EC", "cliente": "...", "formato": "pdf", "cuerpo": "...", "adjuntos": ["..."] }
```
`casos/*/soportes-exigidos.json`: `string[]` of tipos (`"camara_comercio"`, `"rut"`, ...).
`repositorio/soportes/index.json` (array):
```json
{ "tipo": "camara_comercio", "archivo": "camara-comercio-2026-08.txt", "vigencia_hasta": "2026-09-30" | null,
  "pais_emisor": "CO", "descripcion": "..." }
```
`glosario-campos.json`: a flat `Record<string, string>` from etiqueta to ruta (`"RUC": "nit"`). Validate that each ruta matches `^[a-z_]+(\.[a-z_]+)*$`. Lookups go through a `Map` (Pitfall 3).
`repositorio/maestro.json`: a nested object of string leaves (`"nit": "900123456"`, `"digito_verificacion": "7"`), plus objects `representante_legal`, `contacto_*`, `banco` and `ingresos_ultimo_ano`. Use a loose recursive schema of `string | number | object`. Access goes only through `leerRuta` with `Object.hasOwn`.

The real cases are `co-industrias-delta`, `ec-corp-andina`, `hn-agroexport-sula` and `pa-logistica-istmo`. The template file is either `plantilla-celdas.json` (co, hn) or `plantilla-campos.json` (ec, pa).

### `src/tools/define-tool.ts` (wrapper, request-response)
**Reference:** 01-RESEARCH.md lines 429-464. Copy this structure: `z.object(spec.args).strict()`, `safeParse(crudos, { error: z.locales.es().localeError })`, `ejecutarSeguro` (maps any throw to `ERROR_INTERNO` and logs only `error.name`), `bitacora.registrar` after every call, and `JSON.stringify` of the result. Rules are at L466-481. Both `crearEntorno` and `bitacora.registrar` must never throw.

### `src/tools/proveedor.ts` (5 exports)
**Reference:** Tool Contract Spec table, RESEARCH L663-669. The file may contain only these exports: `leer_solicitud`, `mapear_campos`, `generar_formulario`, `armar_paquete` and `simular_envio`. `tests/architecture.test.ts` asserts this. `simular_envio` checks in this order: args → caso → `confirmado !== true` → `CONFIRMACION_REQUERIDA` with the literal `"requiere confirmación explícita"` → paquete (L673).

### `src/domain/mapeo.ts` + `normalizar.ts` + `identificador.ts`
**Reference:** RESEARCH L494-511, an 8-step algorithm. Normalize as `NFD` → strip diacritics → lowercase → collapse whitespace → trim trailing `:*`. Precedence: exact glossary (1.0) → normalized glossary (0.95) → direct key (0.85) → override for a generic label (0.5) → RN1 country rule (0.6) → `estado` by threshold. Convert values with `typeof v === "number" ? String(v) : v` and nothing more.

### `src/domain/pii.ts`
**Reference:** the mask table at RESEARCH L517-525. The default for any unlisted ruta is `oculto`. With `ultimos4`, a value of length 4 or less becomes `"••••"`. Note variables come from the code allowlist in D-36.

### `src/infra/knowledge/reglas.ts` + `src/knowledge/reglas.json`
**Reference:** copy the JSON at RESEARCH L536-570. Schema refinements are listed at L575. Load relative to the module with `new URL("../knowledge/…", import.meta.url)`, read on every call with no cache, and map failures to `REGLAS_INVALIDAS`.

### `src/domain/plantillas.ts` (template engine)
**Reference:** RESEARCH L576-577. Supports `{{var}}`, `{{#lista}}…{{/lista}}` and `{{^lista}}`, one nesting level deep. Any unknown variable is an error. Escape `|` and newlines. Each template gets a typed allowlist context: `DatosBorradorCorreo` has no `banco`.

### `src/infra/salida/xlsx.ts`
**Reference:** RESEARCH L582-590. Uses `ws.getCell(celda).value = texto`, `numFmt = "@"`, fill `FFFFC7CE` for faltante or `FFFFEB9C` for por confirmar, and `cell.note`. Sheets go in order of first appearance. Workbook dates come from the clock. Tests compare semantically, never by bytes.

### `src/infra/salida/pdf/{layout,render}.ts`
**Reference:** sanitizer at RESEARCH L605-610, the layout seam `componerPdf(entrada, medir)` at L612, and the render colors and metadata at L613.

### `src/infra/salida/rutas-seguras.ts`
**Reference:** RESEARCH L485-490. Compare realpath against realpath. Output file names come from an allowlist, and soporte basenames must match the regex `^[a-z0-9][a-z0-9._-]{0,100}$`.

### `src/infra/reloj.ts` + `src/config/env.ts`
**Reference:** RESEARCH L648-650. Use `Intl.DateTimeFormat("en-CA", { timeZone })`. `relojFijo(fecha)` returns the fixed date. Parse the env **per execution**, preprocessing `""` to `undefined` (Pitfall 9, L786-788).

### `src/infra/bitacora.ts` + `src/infra/salida/mutex.ts`
**Reference:** RESEARCH L654-657. Each log line is `{ ts, herramienta, ok, resumen, sesion?, codigo? }` and the global log adds `caso`. Write each line with one `appendFile`. The mutex is a chain over `Map<string, Promise<void>>`.

### Tests
- `tests/architecture.test.ts`: the layer table at RESEARCH L410-419 and the regex at L423. It must cover `import type` imports.
- `tests/helpers/pdf-texto.ts`: copy `extraerTrazos` verbatim from RESEARCH L616-642.
- `tests/sin-comentarios.test.ts`: a state machine that skips strings (L853).
- Golden expectations: RESEARCH L690-733 (co 17/0/0 listo, ec 13/1/1 bloqueado, hn 9/1/1 bloqueado, pa 8/0/1 listo).
- e2e PII grep with a positive control (L846) for `71555123|03100012345|COLOCOBM|900123456`.

## Shared Patterns

### Result / error shape (all tools, all use cases)
**Source:** D-16/D-17 and RESEARCH L672.
```typescript
type Resultado<D> = { ok: true; data: D } | { ok: false; codigo: Codigo; error: string; parcial?: unknown };
```
Messages come from the `src/domain/errores.ts` catalog in Spanish. Responses never include a raw trace or echoed input (Pitfall 4).

### Zero-trust validation
**Source:** D-33. Use `.strict()` zod at every boundary. `caso` must match `^[a-z0-9-]{1,64}$`. Check the size limit before `JSON.parse`, then run the schema.

### Import direction (CAL-04)
**Source:** RESEARCH L410-419. Only `tools/wiring.ts` imports infra. Domain code imports no `node:*`, zod or libraries. No shell APIs anywhere.

### Per-execution loading
**Source:** D-28 and Pitfall 9. Config, reglas and templates are read on every `execute`, never at import time.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| All `src/**`, `demo.ts`, `tests/**` | all | Greenfield. Use the RESEARCH/ARCHITECTURE references above |
| `src/knowledge/plantillas/*.md` | data | No reference text. Build from D-25/D-26/D-27, using only allowlisted placeholders |

## Metadata

**Analog search scope:** repo root (`git ls-files`), `reto-01/fixtures/reto-01/**`, `.planning/research/ARCHITECTURE.md`, `01-RESEARCH.md`
**Files scanned:** 23 fixtures + 3 planning docs
**Pattern extraction date:** 2026-10-12
