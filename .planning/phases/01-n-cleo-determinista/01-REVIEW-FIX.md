---
phase: 01-n-cleo-determinista
fixed_at: 2026-10-13T00:40:00Z
review_path: .planning/phases/01-n-cleo-determinista/01-REVIEW.md
iteration: 1
findings_in_scope: 22
fixed: 21
skipped: 1
status: partial
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-10-13T00:40:00Z
**Source review:** .planning/phases/01-n-cleo-determinista/01-REVIEW.md
**Iteration:** 1
**Scope:** all (critical, warning and info)

**Summary:**
- Findings in scope: 22
- Fixed: 21, one atomic `fix(01): <ID> ...` commit each
- Skipped: 1 (IN-11)

## Verification

The gates ran in the isolated worktree `.claude/worktrees/rf-01-*` on the temp branch `gsd-reviewfix/01-*`. The worktree had its own `bun install --frozen-lockfile`, so the dependency tree matches `bun.lock`. After the fast-forward, the same commits are on `main`. `bun run check` and `bun test` were run again in the main checkout and gave the same results: green, and 404 pass / 0 fail.

- Baseline before any fix: `bun run check` green, `bun test` 345 pass / 0 fail.
- After every commit: `bun run check` (tsc + Biome + `bun audit`) green and the whole `bun test` suite green.
- Final: `bun run check` green. `bun test` gives 404 pass / 0 fail across 31 files.
- `env -u DEEPSEEK_API_KEY -u FECHA_EJECUCION bun run demo.ts` exits 0. Two runs produce byte-identical stdout. The truth table is unchanged: co 17/0/0 LISTO, ec 13/1/1 BLOQUEADO (ausente), hn 9/1/1 BLOQUEADO (vencido), pa 8/0/1 LISTO (portal).
- Comment scan: no `//`, `/* */` or JSDoc in `src/`, `tests/`, `demo.ts`, `tsconfig.json` or `biome.json`. The only `//` hits are the existing string fixtures in `tests/sin-comentarios.test.ts` and two `"src/**/*.ts"`-style glob strings. The no-comments guard is green.
- `reto-01/` is untouched. No commit stages `.planning/config.json`, `.planning/state.json` or `.planning/milestone.lock`.
- Public tool contract: the five exports and the `{ ok, data, resumen }` / `{ ok:false, error, codigo, parcial?, resumen }` envelopes are unchanged. No new `parcial` fields were added. Some values now differ only where a finding required it: `regla`/`estado` combinations (WR-02, WR-03), the `"vence hoy"` and `"vence en 1 día"` notices (IN-01), and DATOS_INVALIDOS on unreadable supports (IN-08).

## Fixed Issues

### CR-01: Empty or whitespace-only master values are mapped as `lleno`

**Files modified:** `src/domain/mapeo.ts`, `tests/unit/mapeo.test.ts`, `tests/contract/maestro-incompleto.test.ts` (new)
**Commit:** bd523c0
**Status:** fixed (logic change, needs human verification)
**Applied fix:** `leerRuta` returns `null` for a string leaf with no non-whitespace character, so the field becomes `faltante` / `sin_fuente` / confianza 0. The verifier asked for two tests, and both were added:
- A unit test showing that `""`, `"   "` and `"\t\n"` give `null` and `faltante`.
- A contract test in a temp project (`ciudad: "   "`, `ciiu_principal: ""`, case co). It checks four things: `mapear_campos` gives 15/2/0; the xlsx cells C7 and C14 are empty and carry the red fill and the "Faltante" note; `checklist.md` lists both fields under "Campos faltantes" while the case stays LISTO (RN3); and the borrador lists both as pending.

### WR-01: PDF silently replaces characters outside WinAnsi with `?` in filled values

**Files modified:** `src/infra/salida/pdf/render.ts`, `src/infra/salida/pdf/layout.ts`, `src/config/constantes.ts`, `tests/unit/pdf-layout.test.ts`, `tests/golden/formulario-pdf.test.ts`
**Commit:** 6085217
**Applied fix:** Before layout, `marcarNoRepresentables` turns any row whose value has characters outside the embedded Helvetica set into `requiere_confirmacion`. That row is drawn in amber with `[POR CONFIRMAR]`, and the Notas section gets `TEXTOS_PDF.motivoNoRepresentable` ("salen como ?; revisarlo contra el maestro"). A golden test runs ec with `razon_social: "Łódź Logística S.A."` and asserts the amber mark and the note. Embedding a Unicode TTF was not done because it would add a dependency and a font file. The marking affects the PDF only; the checklist and the tool response still say `lleno`, since the renderer does not report back to the use case.

### WR-02: Boolean and array master values are reported as "no existe en el maestro"

**Files modified:** `src/domain/mapeo.ts`, `tests/unit/mapeo.test.ts`, `tests/contract/sinteticos.test.ts`
**Commit:** 8e549db
**Status:** fixed (logic change, needs human verification)
**Applied fix:** The new `leerHoja` returns `texto | no_textual | ausente`. `leerRuta` keeps its `string | null` contract on top of it. Booleans, non-empty arrays and non-empty objects are `no_textual`. Those fields are now `requiere_confirmacion` with `valor: null`, the regla/confianza of the route that found them, and the note `NOTA_DATO_NO_TEXTUAL` ("El maestro tiene este dato, pero no como texto: confirmar qué valor escribir"). Null and empty arrays/objects stay `faltante`.
- **Decision:** I followed the reviewer's option and did not format booleans as "Sí/No" or join lists. Writing text the master doesn't hold would edge toward inventing a datum. Asking for confirmation matches the Core Value ("lo dudoso como `requiere_confirmacion`").
- **Tests:** the synthetic `zz-generica-co` "Gran contribuyente" changed from faltante to por confirmar (counts 3/1/2). A contract test generates its PDF and checks the row shows only `[POR CONFIRMAR]`.

### WR-03: RN1 holds only while `reglas.json` keeps `regla_pais`/`etiqueta_generica` below the threshold

**Files modified:** `src/domain/reglas.ts`, `src/domain/mapeo.ts`, `tests/unit/mapeo.test.ts`, `tests/contract/reglas.test.ts`, `tests/golden/mapear-campos.test.ts`
**Commit:** 4bb8fd6
**Status:** fixed (logic change, needs human verification)
**Applied fix:** `REGLAS_SIEMPRE_POR_CONFIRMAR = {regla_pais, etiqueta_generica}`. The new `estadoDeValor` forces `requiere_confirmacion` for those rules no matter the confidence; every other rule still uses the threshold.
- **Decision:** I enforced the rule in code instead of adding a schema `superRefine`. That way a knowledge-file edit can never disable RN1, and `confianza` still reports whatever the file says.
- **Test changes:** the golden "hot reload" test used `regla_pais = 0.9 → lleno` as its probe. It now edits `glosario_exacto = 0.7`, which gives 0/1/14. A new contract test sets both rules to 0.95 and checks that the ec RUC and the generic label stay por confirmar.

### WR-04: A generic label with no glossary entry is `requiere_confirmacion` in `leer_solicitud` but `faltante` in `mapear_campos`

**Files modified:** `src/domain/mapeo.ts`, `tests/unit/mapeo.test.ts`
**Commit:** 5dc7ebb
**Status:** fixed (logic change, needs human verification)
**Applied fix:** The new `fuenteDe` checks `etiquetas_genericas` before the glossary and sends generic labels to `identificador_tributario.ruta` with regla `etiqueta_generica`. A unit test with an empty glossary gives `requiere_confirmacion`, `nit`, 0.5 and `propuesta: "RUC"`, which matches `detectarAmbiguos`.

### WR-05: Support evaluation uses the first index entry per `tipo` and ignores newer duplicates

**Files modified:** `src/domain/checklist.ts`, `tests/unit/vigencias.test.ts`
**Commit:** 3642d1b
**Status:** fixed (logic change, needs human verification)
**Applied fix:** `entradaMasVigente` looks only at entries of that `tipo` whose file is present. It picks the latest `vigencia_hasta`, treats `null` as non-expiring, and breaks ties by file name so the result is deterministic. Two tests cover this: the result does not depend on index order, and a first entry with a missing file falls through to the next one that is present.

### WR-06: Expired supports are copied into the package and listed as sent, while the email says they will follow

**Files modified:** `src/domain/borrador.ts`, `src/knowledge/plantillas/envio-simulado.md`, `tests/golden/borrador-envio.test.ts`
**Commit:** fa85303
**Status:** fixed (product decision, needs human verification)
**Decision:** PRD HU-4 says `paquete/` holds "copias de los soportes exigidos que existan en `repositorio/soportes/`". The expired file exists, so it stays in `paquete/` for the signer (01-09/D-27 intent). The inconsistency the review found was in the simulated send, so the fix is there. `construirDatosEnvio` splits the package files into `archivos` (sent) and `retenidos` (files of `vencido` supports). `ENVIO-SIMULADO.md` now lists the expired file under "Soportes vencidos que no se envían" with a one-line reason. It matches the borrador, which already announced it as pending. The reviewer's option was to drop the copy from `paquete/`. I didn't take it because it would contradict HU-4's literal wording.
**Test:** hn confirmed `simular_envio` sends `formulario.xlsx`, holds back `parafiscales-2026-07.txt`, and the copy still exists in `paquete/`.

### WR-07: Failed regeneration leaves a stale form that `armar_paquete` accepts

**Files modified:** `src/infra/salida/archivos.ts`, `tests/unit/salida.test.ts`
**Commit:** c0cc486
**Applied fix:** `limpiarArtefactosPrevios` now also deletes `formulario.xlsx`, `formulario.pdf` and `valores-portal.md`, along with `paquete/` and `ENVIO-SIMULADO.md`. A render that fails after cleanup therefore leaves no form, and `armar_paquete` answers FORMULARIO_NO_GENERADO. This is consistent with D-12, where `generar_formulario` overwrites `formulario.*`.
- **Not deleted:** `mapeo.json`. It is the mapping trace that `mapear_campos` also writes, nothing consumes it, and it is rewritten on success.
- **Not done:** the optional stronger guarantee, a hash of the canonical mapping stored next to the form and compared by `armar_paquete`.

### WR-08: Template schema accepts sheet names and cells that crash or corrupt the xlsx writer

**Files modified:** `src/config/constantes.ts`, `src/infra/fixtures/esquemas.ts`, `tests/unit/esquemas.test.ts` (new), `tests/contract/generar-formulario.test.ts`
**Commit:** c781260
**Applied fix:** `hoja` is now 1–31 chars and matches `PATRON_NOMBRE_HOJA`: no `* ? : \ / [ ]` and no leading or trailing `'`. It also cannot be `history` in any casing. A cell must fall within `XFD1048576` (`LIMITES_XLSX`). Two refinements apply to the array: one sheet must keep the same casing everywhere, and no two label/value cells can share a (sheet, cell) pair. All of these become PLANTILLA_INVALIDA at template load, before anything is deleted. A contract test checks that a `History` sheet returns PLANTILLA_INVALIDA and keeps the previous form.

### WR-09: The PII-absence e2e proof only checks four identifiers

**Files modified:** `tests/e2e/pii.test.ts`
**Commit:** 1b42ca7
**Applied fix:** The sensitive set now comes from every leaf of `maestro.json` whose `POLITICA_PII` policy is not `publico`, with `oculto` as the default. Three kinds of leaf are left out:
- leaves whose value equals a public value (`banco.titular` equals `razon_social`);
- values shorter than 5 characters;
- the note variables (`moneda`, `ano`).

The borrador is the only place allowed to carry its allowlisted `RUTAS_BORRADOR` fields. A coverage assertion checks that the set includes the NIT, address, phone, names, emails, revenue and bank data. I confirmed the check catches leaks: with the borrador allowlist disabled, it flags the signer's name.

### IN-01: Spanish plural bug in the expiry notice

**Files modified:** `src/domain/vigencias.ts`, `tests/unit/vigencias.test.ts`
**Commit:** f59f208
**Applied fix:** The notice is "vence hoy" at 0 days, "vence en 1 día" at 1 day and "vence en N días" otherwise. The truth-table text "vence en 27 días" is unchanged.

### IN-02: Markdown-table escaping is applied to the plain-text email

**Files modified:** `src/domain/plantillas.ts`, `src/application/armar-paquete.ts`, `src/domain/mapeo.ts`, `src/domain/checklist.ts`, `tests/unit/plantillas.test.ts`, `tests/golden/borrador-envio.test.ts`
**Commit:** 69ddf2b
**Applied fix:** The renderer now takes an escape strategy and exposes two entry points. `renderizarPlantilla` keeps Markdown escaping and is used for the checklist, portal values and ENVIO. `renderizarTextoPlano` only flattens newlines and is used for the borrador, field notes and the issuer notice. Notes used to be escaped twice when they landed in a Markdown table; now that happens once. A golden test with `razon_social: "Periferia | IT Group"` checks that the borrador shows a plain `|`.

### IN-03: `relojFijo.ahora()` uses real wall-clock time

**Files modified:** `src/application/puertos.ts`, `src/infra/reloj.ts`, `src/infra/bitacora.ts`, `tests/e2e/trazador.test.ts`, `tests/unit/reloj.test.ts` (new)
**Commit:** 7696a6f
**Decision:** I kept the behavior on purpose. `FECHA_EJECUCION` pins only the business date. The audit `ts` must stay the real instant (RN5). To make that visible in the code without a comment, I renamed the port method `Reloj.ahora` to `Reloj.instanteReal`. A unit test with `setSystemTime` pins both clocks.

### IN-04: Demo has a dead safety check, mutates `process.env` globally and wipes all audit logs

**Files modified:** `src/demo/ejecutar-demo.ts`, `tests/e2e/demo.test.ts`, `tests/e2e/pii.test.ts`
**Commit:** 6c1d751
**Applied fix:**
- Removed the `salidaLimpiable` no-op check.
- `ejecutarDemo` now pins `FECHA_EJECUCION` only while the cases run and restores the previous value, or deletes it, in a `finally`. A new e2e test covers both cases.
- The PII e2e test's post-demo `simular_envio` now pins the date itself.

**Decision:** the demo still wipes all of `out/`, including the `log.jsonl` files. SC1 / DEMO-01 require the demo to start from a clean `out/`, and the verifier checks this with a planted marker.

### IN-05: The per-case log is skipped when args fail validation

**Files modified:** `src/tools/define-tool.ts`, `tests/e2e/trazador.test.ts`
**Commit:** b5ac4b1
**Applied fix:** The case for logging now comes from the raw args when it is a string matching `PATRON_CASO`, so an ARGS_INVALIDOS call on an existing case is also appended to `out/<caso>/log.jsonl` (RN5). The old trazador test locked in the opposite behavior and was rewritten. A second test checks that an invalid or non-string `caso` still logs only globally, without `caso`.

### IN-06: The system clock relies on the `en-CA` locale's date format

**Files modified:** `src/infra/reloj.ts`, `tests/unit/reloj.test.ts`
**Commit:** a056f1c
**Applied fix:** `relojSistema` builds `YYYY-MM-DD` from `formatToParts` (year, month, day). Tests use `setSystemTime` to check the zone-correct date in Bogotá and Tokyo, and that leading zeros are kept.

### IN-07: A case with both templates is rejected instead of choosing by format

**Files modified:** `src/domain/solicitud.ts`, `tests/unit/solicitud.test.ts`, `tests/contract/sinteticos.test.ts`
**Commit:** 77e850d
**Status:** fixed (logic change, needs human verification)
**Decision:** PRD HU-1 and the data dictionary pair `plantilla-celdas.json` with xlsx and `plantilla-campos.json` with pdf. When both files exist, xlsx now uses celdas and pdf/portal use campos. All other rows of the 01-02 matrix are unchanged, and the matrix grows from 6 to 7 rows. A contract test copies the other template into co and ec and checks each still picks its own.

### IN-08: `soportesPresentes` swallows directory errors

**Files modified:** `src/application/puertos.ts`, `src/application/armar-paquete.ts`, `src/infra/fixtures/lector.ts`, `tests/unit/lector.test.ts` (new), `tests/golden/paquete.test.ts`
**Commit:** 8eee1ae
**Applied fix:** `soportesPresentes` returns `Lectura<ReadonlySet<string>>`. `evaluarEstadoPaquete`, which `armar_paquete` and `simular_envio` share, returns DATOS_INVALIDOS when the directory is missing or unreadable. Tests use a directory that can be traversed but not listed (`chmod 0o300`).

### IN-09: Note variables are a mostly dead path, and the rules' templates are not validated at load

**Files modified:** `src/domain/validar-reglas.ts` (new), `src/infra/knowledge/reglas.ts`, `src/domain/mapeo.ts`, `src/domain/pii.ts`, `src/application/mapear-campos.ts`, `tests/unit/validar-reglas.test.ts` (new), `tests/unit/mapeo.test.ts`, `tests/unit/pii.test.ts`, `tests/contract/reglas.test.ts`
**Commit:** 6af3453
**Applied fix:**
- After schema validation, `cargarReglas` renders every rule text with sample values for its allowed variables:
  - field notes (`nota_extranjero`, `nota_generica`, `notas_contexto[*]`) can use `moneda`, `ano`, `pais` and `identificador`;
  - `aviso_emisor_distinto` can use only `pais_emisor`.
- Typos, misplaced variables and unclosed tags are now REGLAS_INVALIDAS at load.
- The always-empty `variablesNota` input was removed from `EntradaMapeo`, along with its two unit tests.

### IN-10: Type-only import cycle, and config enums duplicated from domain types

**Files modified:** `src/tools/wiring.ts`, `src/tools/define-tool.ts`, `src/domain/tipos.ts`, `src/domain/reglas.ts`, `src/domain/pii.ts`, `src/domain/mapeo.ts`, `src/domain/validar-reglas.ts`, `src/config/constantes.ts`, `src/infra/fixtures/esquemas.ts`, `src/tools/argumentos.ts`, `tests/architecture.test.ts`, `tests/unit/pii.test.ts`, `tests/e2e/pii.test.ts`
**Commit:** 752b314
**Applied fix:**
- `ContextoNormalizado` moved to `wiring.ts`, which consumes it, and that breaks the `define-tool` ↔ `wiring` cycle.
- The new cycle guard found a second type-only cycle, `pii` ↔ `mapeo`. I moved the note-variable lists to `domain/reglas.ts` to break it.
- `FORMATOS` and `ESTADOS_CAMPO` are now defined once in the domain. `Formato` and `EstadoCampo` derive from them, and the duplicates were removed from config.
- `tests/architecture.test.ts` now fails on any import cycle in `src/` and `demo.ts`, and includes a sample-graph test showing the detector catches a cycle.

### IN-12: `sessionId` has no length bound before it is written to every log line

**Files modified:** `src/config/constantes.ts`, `src/tools/define-tool.ts`, `tests/e2e/trazador.test.ts`
**Commit:** 0878a96
**Applied fix:** `PATRON_SESION = ^[A-Za-z0-9_-]{1,128}$`, defined in config. An invalid `sessionId` or `sessionID` falls back to `sin-sesion` through the existing `.catch`. When `sessionId` is invalid but `sessionID` is valid, `sessionID` is used. Tests cover a 129-char id, spaces, a newline, `../`, the fallback to `sessionID`, and a 128-char id.

## Skipped Issues

### IN-11: Dependency versions drift from the documented stack, and `check` needs the network

**File:** `package.json:14, 17, 24`
**Reason:** Skipped on purpose; both halves come from recorded, human-approved decisions.
- **Version pins:** `zod 4.6.5` and `@types/bun 1.4.2` were approved at the 01-01 supply-chain gate under the D-35 maturity policy (versions at least 7 days old). The 4.6.7 and 1.4.3 pins in CLAUDE.md come from the generated stack research. Changing the pins would bypass that human gate, and this fixer is not authorized to edit CLAUDE.md.
- **Audit inside check:** `bun audit` inside `bun run check` is the T-01-SC threat mitigation registered in 01-01 and 01-SECURITY. Taking it out would weaken a recorded control. A separate `bun run audit` script already exists.

**Recommendation:** decide this in a later plan. Either re-run the legitimacy gate for 4.6.7 / 1.4.3, or have the stack doc regenerated to match the approved pins.
**Original issue:** `zod` is pinned to 4.6.5 and `@types/bun` to 1.4.2 while CLAUDE.md prescribes 4.6.7 and 1.4.3, and `bun run check` includes `bun audit`, which fails offline.

---

_Fixed: 2026-10-13T00:40:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
