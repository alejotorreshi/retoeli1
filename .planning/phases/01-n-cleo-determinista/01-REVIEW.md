---
phase: 01-n-cleo-determinista
reviewed: 2026-10-12T23:30:00Z
depth: standard
files_reviewed: 97
files_reviewed_list:
  - .bun-version
  - .dockerignore
  - .gitignore
  - biome.json
  - demo.ts
  - package.json
  - src/application/armar-paquete.ts
  - src/application/contexto-caso.ts
  - src/application/generar-formulario.ts
  - src/application/leer-solicitud.ts
  - src/application/mapear-campos.ts
  - src/application/puertos.ts
  - src/application/simular-envio.ts
  - src/config/constantes.ts
  - src/config/env.ts
  - src/demo/ejecutar-demo.ts
  - src/domain/borrador.ts
  - src/domain/checklist.ts
  - src/domain/comparar-mapeo.ts
  - src/domain/errores.ts
  - src/domain/formulario.ts
  - src/domain/mapeo.ts
  - src/domain/normalizar.ts
  - src/domain/pii.ts
  - src/domain/plantillas.ts
  - src/domain/portal.ts
  - src/domain/reglas.ts
  - src/domain/resultado.ts
  - src/domain/solicitud.ts
  - src/domain/tipos.ts
  - src/domain/vigencias.ts
  - src/infra/bitacora.ts
  - src/infra/fixtures/esquemas.ts
  - src/infra/fixtures/lector.ts
  - src/infra/knowledge/plantillas.ts
  - src/infra/knowledge/reglas.ts
  - src/infra/reloj.ts
  - src/infra/salida/archivos.ts
  - src/infra/salida/copias.ts
  - src/infra/salida/mutex.ts
  - src/infra/salida/pdf/layout.ts
  - src/infra/salida/pdf/render.ts
  - src/infra/salida/rutas-seguras.ts
  - src/infra/salida/xlsx.ts
  - src/knowledge/plantillas/borrador-correo.md
  - src/knowledge/plantillas/checklist.md
  - src/knowledge/plantillas/envio-simulado.md
  - src/knowledge/plantillas/valores-portal.md
  - src/knowledge/reglas.json
  - src/tools/argumentos.ts
  - src/tools/define-tool.ts
  - src/tools/fabrica.ts
  - src/tools/issues.ts
  - src/tools/proveedor.ts
  - src/tools/wiring.ts
  - tests/architecture.test.ts
  - tests/contract/generar-formulario.test.ts
  - tests/contract/reglas.test.ts
  - tests/contract/simular-envio.test.ts
  - tests/contract/sinteticos.test.ts
  - tests/e2e/demo.test.ts
  - tests/e2e/determinismo.test.ts
  - tests/e2e/pii.test.ts
  - tests/e2e/trazador.test.ts
  - tests/fixtures/casos/zz-generica-co/plantilla-campos.json
  - tests/fixtures/casos/zz-generica-co/solicitud.json
  - tests/fixtures/casos/zz-generica-co/soportes-exigidos.json
  - tests/fixtures/casos/zz-generica-ec/plantilla-campos.json
  - tests/fixtures/casos/zz-generica-ec/solicitud.json
  - tests/fixtures/casos/zz-generica-ec/soportes-exigidos.json
  - tests/fixtures/casos/zz-plantilla-corrupta/plantilla-celdas.json
  - tests/fixtures/casos/zz-plantilla-corrupta/solicitud.json
  - tests/fixtures/casos/zz-plantilla-corrupta/soportes-exigidos.json
  - tests/golden/borrador-envio.test.ts
  - tests/golden/formulario-pdf.test.ts
  - tests/golden/formulario-portal.test.ts
  - tests/golden/formulario-xlsx.test.ts
  - tests/golden/mapear-campos.test.ts
  - tests/golden/paquete.test.ts
  - tests/helpers/correr-demo.ts
  - tests/helpers/flujo.ts
  - tests/helpers/instantanea.ts
  - tests/helpers/pdf-texto.ts
  - tests/helpers/proyecto-temporal.ts
  - tests/helpers/xlsx-leer.ts
  - tests/sin-comentarios.test.ts
  - tests/unit/comparar-mapeo.test.ts
  - tests/unit/copias.test.ts
  - tests/unit/mapeo.test.ts
  - tests/unit/normalizar.test.ts
  - tests/unit/pdf-layout.test.ts
  - tests/unit/pii.test.ts
  - tests/unit/plantillas.test.ts
  - tests/unit/salida.test.ts
  - tests/unit/solicitud.test.ts
  - tests/unit/vigencias.test.ts
  - tsconfig.json
findings:
  critical: 1
  warning: 9
  info: 12
  total: 22
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-10-12T23:30:00Z
**Depth:** standard
**Files Reviewed:** 97
**Status:** issues_found

## Summary

I reviewed the deterministic core: domain, application use cases, infra adapters (fixtures, knowledge, xlsx/pdf output, safe paths, mutex, log), tool wiring, the demo, and the test suite. The baseline is strong. `bun test` passes (345/345), `bun run check` passes (tsc + Biome + audit), path traversal is closed at every write/copy point, the tool envelope never throws, and a live demo run confirmed that no tool response carries unmasked PII.

The defects sit at the edges of the "never invent / never misreport" invariant, in inputs the schemas accept but the fixtures don't use:

- Blank master values are reported as `lleno`. This is the one BLOCKER.
- Booleans and arrays are reported as "no existe en el maestro".
- RN1 holds only as long as `reglas.json` keeps its current confidence numbers.
- The PDF silently swaps non-WinAnsi characters for `?`.
- Expired supports are shipped in the package while the email says they will be sent later.
- A failed regeneration leaves a stale form that `armar_paquete` accepts.

I verified the edge cases by running the domain functions directly (whitespace value → `lleno`, boolean → `faltante`, generic label without a glossary entry → `faltante` in `mapear` but `requiere_confirmacion` in `leer_solicitud`, `textoVence(1)` → "vence en 1 días").

## Critical Issues

### CR-01: Empty or whitespace-only master values are mapped as `lleno`

**File:** `src/domain/mapeo.ts:84-94` (consumed at `src/domain/mapeo.ts:188-200`)
**Issue:** `leerRuta` returns any string as-is, including `""` and `"   "`. `esquemaMaestro` (`src/infra/fixtures/esquemas.ts:86-97`) accepts empty strings. So a key that exists but is blank (a very common shape, e.g. `"ciiu_secundario": ""`) produces `estado: "lleno"` with confidence 1, 0.95 or 0.85. The consequences:

- The xlsx/pdf writes a blank cell with no "faltante" fill or note.
- `construirChecklist` does not list the field under "Campos faltantes".
- The borrador does not mention it as pending.
- The package can be `LISTO` with a blank required field.

This breaks the core invariant ("lo que no existe queda como `faltante`") and PRD HU-2. I reproduced it: `maestro: { ciudad: "  " }` with label "Ciudad" → `{"estado":"lleno","valor":"  ","confianza":0.85}`.
**Fix:**
```ts
export function leerRuta(maestro: Maestro, ruta: string): string | null {
  ...
  if (typeof actual === "number") return Number.isFinite(actual) ? aTexto(actual) : null;
  if (typeof actual !== "string") return null;
  return actual.trim() === "" ? null : actual;
}
```
Add a unit test for `""` and `"  "` → `faltante`.

## Warnings

### WR-01: PDF silently replaces characters outside WinAnsi with `?` in filled values

**File:** `src/infra/salida/pdf/render.ts:13-17`, `src/infra/salida/pdf/layout.ts:91-97`
**Issue:** `sanearWinAnsi` maps every code point Helvetica can't encode to `TEXTOS_PDF.reemplazo` ("?"). A `lleno` value such as a name or address with `Ł`, `ő`, `Đ`, `≥` or an emoji ends up in the signed form as a different value (`"?ód?"`) with no marking. The row still shows as `lleno`, and nothing in the notes, the checklist or the tool response tells the analyst the printed value differs from the master. This is silent data corruption in a legal document.
**Fix:** Detect substitution per row and surface it. If `sanearWinAnsi(valor) !== valor.normalize("NFC")`, render the row with the `por_confirmar` style plus a note such as "contiene caracteres no representables en el PDF". Alternatively, embed a Unicode TTF via `@pdf-lib/fontkit`. Either way, add a golden test with a non-WinAnsi value.

### WR-02: Boolean and array master values are reported as "no existe en el maestro"

**File:** `src/domain/mapeo.ts:93`
**Issue:** `leerRuta` returns `null` for anything that isn't a string or number. The fixture master has `gran_contribuyente: false`, `autorretenedor: false` and `certificaciones: [...]`. A template label "Gran contribuyente", "Autorretenedor" or "Certificaciones" resolves by `clave_directa` to an existing key. It is then reported as `faltante`, the checklist renders "no existe en el maestro", and the action "Conseguir el dato … y completarlo" is shown. That is false: the data exists. The tool misreports the master, and the agent will tell the analyst to hunt for data she already has.
**Fix:** Map these to `requiere_confirmacion` with a note, not `faltante`. For example, have `leerRuta` return a discriminated result `{ tipo: "escalar", valor } | { tipo: "no_escalar" } | { tipo: "ausente" }`. Then `mapearEtiqueta` turns `no_escalar` into `requiere_confirmacion` (nota: "el maestro tiene el dato pero no es texto"). Only `ausente` becomes `faltante`.

### WR-03: RN1 holds only while `reglas.json` keeps `regla_pais`/`etiqueta_generica` below the threshold

**File:** `src/domain/mapeo.ts:195-200`, `src/infra/knowledge/reglas.ts:31-41`
**Issue:** The state comes only from `confianza >= umbral`. RN1 and HU-1 require the foreign identifier and generic labels to be `requiere_confirmacion` regardless of tuning. If someone edits `reglas.json` to `"regla_pais": 0.9` (the schema allows any 0..1), the EC/PA/HN NIT is emitted as `lleno` with only a note. It then drops out of the checklist "por confirmar" list and gets no xlsx fill or PDF marker. A knowledge-file edit should not be able to disable a business rule.
**Fix:** Either force the state in code:
```ts
const forzada = ajuste.data.regla === "regla_pais" || ajuste.data.regla === "etiqueta_generica";
estado: forzada || confianza < reglas.confianza.umbral ? "requiere_confirmacion" : "lleno",
```
or add a `superRefine` to `esquemaReglas` that rejects `regla_pais >= umbral` or `etiqueta_generica >= umbral` with REGLAS_INVALIDAS.

### WR-04: A generic label with no glossary entry is `requiere_confirmacion` in `leer_solicitud` but `faltante` in `mapear_campos`

**File:** `src/domain/mapeo.ts:185-190`, `src/domain/solicitud.ts:26-37`
**Issue:** `detectarAmbiguos` flags any label in `reglas.etiquetas_genericas` as `requiere_confirmacion` with `propuesta`. `mapearEtiqueta` only reaches `ajustarPorIdentificador` after `rutaCandidata` and `leerRuta` succeed. A generic label that the glossary doesn't cover (`etiquetas_genericas` is configured separately from `glosario-campos.json`) falls to `clave_directa` (e.g. `identificacion_tributaria`), finds nothing, and returns `faltante` with no proposal. The two tools then contradict each other. The agent tells the analyst "ambiguous, propose RUC" and then generates a form with the field blank and listed as missing. Reproduced with an empty glossary: `leer` → `{"estado":"requiere_confirmacion","propuesta":"RUC"}`, `mapear` → `{"estado":"faltante"}`.
**Fix:** In `mapearEtiqueta`, check `contexto.genericas.has(normalizarEtiqueta(etiqueta))` before the source lookup. For generic labels, use `fuente = { ruta: tributario.ruta, regla: "etiqueta_generica" }` so they always read the identifier route. You could also make `esquemaReglas` (or `completarContextoCaso`) verify that each generic label resolves.

### WR-05: Support evaluation uses the first index entry per `tipo` and ignores newer duplicates

**File:** `src/domain/checklist.ts:94-95`, `src/infra/fixtures/esquemas.ts:64-76`
**Issue:** `indice.find((c) => c.tipo === tipo)` takes the first entry. The index schema doesn't enforce unique `tipo`, and a realistic repository keeps old and renewed versions side by side (e.g. `camara-comercio-2026-07.txt` expired and `-08` current). If the expired one is listed first, the package is marked BLOQUEADO and the expired file is copied. If the first entry's file is missing, the support is reported `ausente` even though a later entry exists. Both are wrong blocking decisions under RN3.
**Fix:** Either reject duplicate `tipo` in `esquemaIndiceSoportes` (`.superRefine` → DATOS_INVALIDOS), or select among present candidates by the latest `vigencia_hasta`, with `null` counting as non-expiring:
```ts
const candidatas = indice.filter((c) => c.tipo === tipo && presentes.has(c.archivo));
const entrada = candidatas.sort((a, b) => (b.vigencia_hasta ?? "9999-12-31").localeCompare(a.vigencia_hasta ?? "9999-12-31"))[0];
```

### WR-06: Expired supports are copied into the package and listed as sent, while the email says they will follow

**File:** `src/application/armar-paquete.ts:95-99`, `src/domain/borrador.ts:40-56`, `src/application/simular-envio.ts:31-32`
**Issue:** `copiarContenido` copies every support whose `archivo !== null`, and that includes `estado: "vencido"`. The borrador lists only `presente` supports as attachments and puts the expired one under "Quedan pendientes … (vencido, enviaremos la versión actualizada)". `ENVIO-SIMULADO.md` then lists `paquete/parafiscales-2026-07.txt` among the files sent. The HN demo output shows exactly this. The package contradicts its own email, and in a real send the client would receive the expired certificate.
**Fix:** Copy only `estado === "presente"` supports. Keep the expired file referenced in `checklist.md` (it already is) and leave it out of the package:
```ts
soportes.flatMap((s) => (s.estado === "presente" && s.archivo !== null ? [s.archivo] : []))
```

### WR-07: Failed regeneration leaves a stale form that `armar_paquete` accepts

**File:** `src/application/generar-formulario.ts:105-106`, `src/infra/salida/archivos.ts:89-99`, `src/application/armar-paquete.ts:113-114`
**Issue:** `limpiarPrevios` deletes `paquete/` and `ENVIO-SIMULADO.md` before rendering, but not the previous `formulario.xlsx`/`.pdf`/`valores-portal.md` or `mapeo.json`. If the new render fails (see WR-08, or any throw → ERROR_INTERNO), the old form survives. `armar_paquete` only checks `existe(caso, formulario)`, so it packages a form built from an earlier master or template, next to a checklist computed from the current one. Nothing ties the form to the mapping it was built from.
**Fix:** Also remove the form files and `mapeo.json` in `limpiarArtefactosPrevios`. Better still, write to a temp name and rename on success. For a stronger guarantee, record a hash of the canonical mapping next to the form and have `armar_paquete` compare it with `mapeoCanonico` (FORMULARIO_NO_GENERADO on mismatch).

### WR-08: Template schema accepts sheet names and cells that crash or corrupt the xlsx writer

**File:** `src/infra/fixtures/esquemas.ts:35-47`, `src/config/constantes.ts:80`, `src/infra/salida/xlsx.ts:12-18, 33-38`
**Issue:** `hoja` is `textoCorto` (0–500 chars, any characters). exceljs throws on `""`, on names containing `* ? : \ / [ ]`, on a leading or trailing `'`, on `"History"`, and on a case-insensitive duplicate (`"Datos"` vs `"datos"`: `hojaPara` keys the Map case-sensitively, exceljs compares lower-case). Names over 31 chars are truncated, so two long names can collide and throw. Each of these surfaces as `ERROR_INTERNO` ("inténtalo de nuevo"), which is misleading because retrying cannot help, and it happens after `limpiarPrevios` has already deleted the package. Separately, `PATRON_CELDA` accepts columns past `XFD` and rows past 1 048 576, and nothing rejects two entries that share a `celda_valor` or a label cell overlapping another value cell. Those are silently overwritten, so one field's value disappears from the workbook.
**Fix:** Validate in `esquemaPlantillaCeldas`:
```ts
hoja: z.string().min(1).max(31).regex(/^[^*?:\\/\[\]']([^*?:\\/\[\]]*[^*?:\\/\[\]'])?$/).refine((h) => h !== "History"),
```
Add a `.superRefine` on the array that rejects duplicate `(hoja.toLowerCase(), celda)` pairs across label and value cells, and bound column ≤ XFD and row ≤ 1048576. All of these should become PLANTILLA_INVALIDA, before anything is deleted.

### WR-09: The PII-absence e2e proof only checks four identifiers

**File:** `tests/e2e/pii.test.ts:11`
**Issue:** `VALORES_SENSIBLES = /71555123|03100012345|COLOCOBM|900123456/` covers the NIT, legal-rep ID, account and SWIFT. It does not cover names (`Roberto Andrade Salazar`, `Laura Gómez Restrepo`), emails (`lgomez@…`, `gerencia@…`), phones (`604 555 0100`, `300 555 0101`), the address (`Calle 10 # 43A-25`) or revenue (`98000000000`), all of which `POLITICA_PII` masks. A regression that leaked an email or the full phone into `mapear_campos`, `mapeo.json` or `log.jsonl` would pass this "proof". I checked the current run by hand and it is clean today, but the test would not catch a regression.
**Fix:** Build the pattern from every leaf of `maestro.json` whose policy is not `publico`, using `POLITICA_PII` plus the default `oculto` and escaping each value. Scope the borrador exception to the fields it intentionally includes (`contacto_financiero.nombre`/`cargo`, `razon_social`).

## Info

### IN-01: Spanish plural bug in the expiry notice

**File:** `src/domain/vigencias.ts:11-13`
**Issue:** `textoVence(1)` → "vence en 1 días". `textoVence(0)` → "vence en 0 días".
**Fix:** `dias === 0 ? "vence hoy" : dias === 1 ? "vence en 1 día" : \`vence en ${dias} días\``.

### IN-02: Markdown-table escaping is applied to the plain-text email

**File:** `src/domain/plantillas.ts:28-30`
**Issue:** `escapar` turns `|` into `\|` for every template, including `borrador-correo.md` and the header lines of the checklist and portal. A `razon_social` or client name with `|` would show up altered (`\|`) in the email body.
**Fix:** Let each template, or each call, choose the escaping mode: table cells vs plain text.

### IN-03: `relojFijo.ahora()` uses real wall-clock time

**File:** `src/infra/reloj.ts:14-16, 28-31`
**Issue:** With `FECHA_EJECUCION=2026-09-03`, log entries carry `ts: 2026-10-12T…` while every artifact says 2026-09-03. Tests work around this by stripping `ts`.
**Fix:** Either document that `ts` is real time on purpose, or derive `ahora()` from the fixed date plus the elapsed time.

### IN-04: Demo has a dead safety check, mutates `process.env` globally and wipes all audit logs

**File:** `src/demo/ejecutar-demo.ts:92-96, 225-226`
**Issue:**
- `salidaLimpiable` can never return `null`, because `relative(raiz, resolve(raiz, "out"))` is always `"out"`.
- `process.env.FECHA_EJECUCION = FECHA_DEMO` is never restored. Any later tool call in the same process (e.g. if a future server imports the demo) runs pinned to 2026-09-03.
- `rm(out, { recursive: true })` deletes every case's `log.jsonl`, i.e. the RN5 audit trail.

**Fix:** Remove the no-op check, restore the env var in a `finally` (as `tests/helpers/correr-demo.ts` does), and document or narrow the deletion.

### IN-05: The per-case log is skipped when args fail validation

**File:** `src/tools/define-tool.ts:88-98`
**Issue:** On `ARGS_INVALIDOS` (e.g. a valid `caso` with a malformed `mapeo`), `casoValidoDe` is never reached, so only `out/log.jsonl` gets an entry. RN5 says every execution writes to `out/<caso>/log.jsonl`.
**Fix:** Extract `caso` from the raw args when it is a string matching `PATRON_CASO`, even if the full parse fails.

### IN-06: The system clock relies on the `en-CA` locale's date format

**File:** `src/infra/reloj.ts:18-26`
**Issue:** `Intl.DateTimeFormat("en-CA").format()` returns `YYYY-MM-DD` today, but that format has changed across ICU versions before. If it changes again, `comoFechaISO` throws and every tool returns ERROR_INTERNO.
**Fix:** Use `formatToParts` and assemble `year-month-day` explicitly.

### IN-07: A case with both templates is rejected instead of choosing by format

**File:** `src/domain/solicitud.ts:13-17`
**Issue:** `presentes.celdas === presentes.campos` → `null` → PLANTILLA_INVALIDA, even for `xlsx` (which clearly wants `celdas`) or `pdf` (which clearly wants `campos`). This is locked in the 01-02 matrix, but PRD HU-1 reads as format-driven selection.
**Fix:** If you keep the current behavior, record the reasoning in SOLUCION.md. Otherwise prefer `celdas` for xlsx and `campos` for pdf/portal when both exist.

### IN-08: `soportesPresentes` swallows directory errors

**File:** `src/infra/fixtures/lector.ts:79-93`
**Issue:** A missing or unreadable `repositorio/soportes/` returns an empty set, so every support is reported `ausente` and the package is blocked for the wrong reason. A missing `index.json`, by contrast, yields DATOS_INVALIDOS.
**Fix:** Return `Lectura<ReadonlySet<string>>` and fail with DATOS_INVALIDOS on non-ENOENT errors.

### IN-09: Note variables are a mostly dead path, and the rules' templates are not validated at load

**File:** `src/domain/mapeo.ts:110-124`, `src/application/mapear-campos.ts:66`
**Issue:** `variablesNota` is always `{}`, so `pais_emisor` is in `VARIABLES_NOTA_PERMITIDAS` but can never be set. A `notas_contexto` text using `{{pais_emisor}}`, or a typo such as `{{monedaa}}`, passes `esquemaReglas` and only fails with REGLAS_INVALIDAS when that specific label is mapped.
**Fix:** In `cargarReglas`, check each note template's variables against the allowed set, and drop the unused `variablesNota` input.

### IN-10: Type-only import cycle, and config enums duplicated from domain types

**File:** `src/tools/define-tool.ts:6`, `src/tools/wiring.ts:44`, `src/config/constantes.ts:83-84`
**Issue:**
- `define-tool` imports `wiring`, and `wiring` imports a type from `define-tool`. The cycle is erased at runtime but is still coupling.
- `FORMATOS` and `ESTADOS_CAMPO` in config repeat `Formato` and `EstadoCampo` from the domain with no compile-time link. Adding a domain state would not fail the zod enums.

**Fix:** Move `ContextoNormalizado` to `application/puertos.ts` or a `tools/tipos.ts`. Derive the domain unions from the const arrays, or add `satisfies readonly EstadoCampo[]`.

### IN-11: Dependency versions drift from the documented stack, and `check` needs the network

**File:** `package.json:14, 17, 24`
**Issue:**
- `zod` is pinned to 4.6.5 and `@types/bun` to 1.4.2, while CLAUDE.md prescribes 4.6.7 and 1.4.3.
- `bun run check` includes `bun audit`, which fails offline or in a sandboxed CI.

**Fix:** Align the versions, or document why they differ. Keep `audit` as a separate script outside `check`.

### IN-12: `sessionId` has no length bound before it is written to every log line

**File:** `src/tools/define-tool.ts:37`
**Issue:** `z.string().min(1)` with no `.max()`. A multi-megabyte session id would be appended to two log files on every call. This becomes a real concern once the HTTP layer forwards client-supplied ids.
**Fix:** `.max(128).regex(/^[A-Za-z0-9_-]+$/)`, falling back to `SESION_POR_DEFECTO` on failure (the `.catch` already exists).

---

_Reviewed: 2026-10-12T23:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
