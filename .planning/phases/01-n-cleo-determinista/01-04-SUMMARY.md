---
phase: 01-n-cleo-determinista
plan: 04
subsystem: domain
tags: [mapeo, glosario, rn1, pii, plantillas, reglas-json, tdd, prototype-safety]

requires:
  - phase: 01-02
    provides: "Resultado/exito/fallo, CodigoError catalog (REGLAS_INVALIDAS, DATOS_INVALIDOS), domain types"
  - phase: 01-03
    provides: "Architecture and no-comments guards that gate every src/domain file"
provides:
  - "src/knowledge/reglas.json v1: D-19 confidence scale, D-29 country-identifier table, generic labels, context notes, soporte warnings, template paths (no PII policy)"
  - "Reglas, ReglaMapeo, EstadoCampo domain types (src/domain/reglas.ts)"
  - "normalizarEtiqueta and aTexto (src/domain/normalizar.ts)"
  - "renderizarPlantilla: strict single-pass engine with variables and one-level #/^ sections (src/domain/plantillas.ts)"
  - "construirIndiceGlosario, leerRuta, mapearCampos, contarEstados, EntradaMapeo, CampoMapeado, Maestro, Glosario, VariablesNota (src/domain/mapeo.ts)"
  - "POLITICA_PII, enmascarar, presentarCampo, CampoPresentado, VARIABLES_NOTA_PERMITIDAS, VARIABLES_NOTA_DEL_MAESTRO (src/domain/pii.ts)"
affects: [01-05, 01-06, 01-07, 01-08, 01-09, 01-11, phase-02, phase-03, phase-04]

actuals:
  tokens: 12600
  tasks: 2
  commits: 4
plan_head_before: 303e5f89a7fe9e601a836c90e1042823b899e9ac
plan_head_after: a150b1d61f92df211a00dd3224534fb169752a18

tech-stack:
  added: []
  patterns:
    - "Business rules as data in src/knowledge/reglas.json; the PII policy stays in code (src/domain/pii.ts)"
    - "Template engine renders in one regex pass, so substituted values are never re-scanned (no template injection)"
    - "Glossary lookups go through Map; maestro walks use own property descriptors plus ^[a-z_]+$ segments and a prototype-key denylist"
    - "Note variables are built in code: caller extras filtered by VARIABLES_NOTA_PERMITIDAS, then moneda/ano/pais/identificador computed and overriding"
    - "presentarCampo builds its output key by key, so a valor key can never leak through a spread"

key-files:
  created:
    - src/knowledge/reglas.json
    - src/domain/reglas.ts
    - src/domain/normalizar.ts
    - src/domain/plantillas.ts
    - src/domain/mapeo.ts
    - src/domain/pii.ts
    - tests/unit/normalizar.test.ts
    - tests/unit/plantillas.test.ts
    - tests/unit/mapeo.test.ts
    - tests/unit/pii.test.ts
  modified: []

key-decisions:
  - "SWIFT mask follows the D-07 last-4 rule: COLOCOBM gives ••••COBM; the plan's ••••OCBM literal was a typo"
  - "mapearCampos computes moneda, ano (from maestro ingresos_ultimo_ano), pais and identificador itself; EntradaMapeo.variablesNota only adds allowlisted extras such as pais_emisor and cannot override the computed ones"
  - "Several notes on one field are joined with '. ' (generic note first, then the foreign-identifier note, then context notes)"
  - "RN1 (regla_pais) leaves propuesta null; only generic labels propose the country identifier"
  - "Direct maestro keys (clave_directa) are single-segment only, so a label can never reach a nested ruta without the glossary"
  - "leerRuta also rejects __proto__, constructor and prototype as own keys, which covers a JSON.parse-created own __proto__"
  - "A country missing from por_pais makes a generic-label note fail with REGLAS_INVALIDAS instead of rendering an empty identifier"

patterns-established:
  - "Domain engines return Resultado and stop at the first rule-rendering failure, naming the reglas.json path (identificador_tributario.nota_generica, notas_contexto[i])"
  - "Unit tests load real fixtures and reglas.json through Bun.file + JSON.parse into typed variables; zod validation of these files arrives with the infra loader in 01-05"

requirements-completed: [MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-07, CAL-03]

coverage:
  - id: D1
    description: "reglas.json carries the D-19 scale, umbral 0.8, D-29 country table, generic labels, context notes, 30-day warning and template paths, without PII policy"
    requirement: "MAP-02"
    verification:
      - kind: unit
        ref: "tests/unit/plantillas.test.ts#src/knowledge/reglas.json"
        status: pass
    human_judgment: false
  - id: D2
    description: "Label normalization (NFD/NFC equivalent) and String-only number conversion"
    requirement: "MAP-02"
    verification:
      - kind: unit
        ref: "tests/unit/normalizar.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Strict template engine: unknown variable or section gives REGLAS_INVALIDAS naming the template, pipes escaped, newlines flattened, no re-interpretation of values"
    requirement: "CAL-03"
    verification:
      - kind: unit
        ref: "tests/unit/plantillas.test.ts#variables, secciones"
        status: pass
    human_judgment: false
  - id: D4
    description: "Mapping engine reproduces the four-case truth table 17/0/0, 13/1/1, 9/1/1, 8/0/1 with RN1, faltantes and context notes"
    requirement: "MAP-01"
    verification:
      - kind: unit
        ref: "tests/unit/mapeo.test.ts#tabla de verdad de los cuatro casos reales (D-21)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Synthetic rules: generic labels (CO and EC), normalized glossary, direct key, threshold boundary, prototype keys, note variable allowlist"
    requirement: "MAP-03"
    verification:
      - kind: unit
        ref: "tests/unit/mapeo.test.ts#reglas sobre etiquetas sintéticas, umbral de confianza (D-19), notas de contexto como datos (D-36)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Nested ruta reads with own-property walk; missing, non-scalar and prototype segments give faltante"
    requirement: "MAP-04"
    verification:
      - kind: unit
        ref: "tests/unit/mapeo.test.ts#leerRuta"
        status: pass
    human_judgment: false
  - id: D7
    description: "Code-owned PII policy: D-05 public list, D-07 masks, default [dato oculto], presentarCampo without valor; no non-public raw value in the four real cases"
    requirement: "MAP-05"
    verification:
      - kind: unit
        ref: "tests/unit/pii.test.ts"
        status: pass
    human_judgment: false
  - id: D8
    description: "Context notes (hn Ingresos 'COP, año 2025', País note) rendered only from reglas text plus allowlisted variables"
    requirement: "MAP-07"
    verification:
      - kind: unit
        ref: "tests/unit/mapeo.test.ts#hn-agroexport-sula da 9/1/1 con RTN por regla de país y notas de contexto"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-12
status: complete
---

# Phase 1 Plan 04: Núcleo de mapeo y política de PII Summary

**Pure deterministic mapping engine (exact/normalized glossary, direct key, generic labels, RN1, threshold 0.8, context notes from reglas.json) that reproduces the 17/0/0, 13/1/1, 9/1/1 and 8/0/1 golden counts, plus a code-owned PII projection that never carries a valor key.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-12T22:12:31Z
- **Completed:** 2026-10-12T22:18:30Z
- **Tasks:** 2
- **Files modified:** 10 (all created)

## Accomplishments

- `src/knowledge/reglas.json` holds the editable business rules (D-28, D-29): the confidence scale, the country-identifier table, generic labels, context notes, soporte warnings and template paths. The PII policy is deliberately absent, and a test asserts that.
- `renderizarPlantilla` is a strict template engine of about 100 lines. It renders in a single pass, rejects unknown variables or sections, unclosed tags and nested sections with `REGLAS_INVALIDAS` naming the template, and escapes `|` and newlines. A value containing `{{b}}` is never re-interpreted.
- `mapearCampos` reproduces the golden oracle field by field for the four real cases. Every `lleno` field comes from `glosario_exacto` with confianza 1. RUC and RTN are `regla_pais` 0.6 with the foreign-identifier note. "Número de contribuyente especial" and "Referencias comerciales" are `faltante` with ruta null and valor null. The hn Ingresos field is "98000000000" with the note "COP, año 2025".
- `leerRuta` resists prototype keys: `constructor`, `toString`, `__proto__` (including an own `__proto__` created by JSON.parse), `hasOwnProperty`, malformed segments and non-scalar leaves all give `null`.
- `presentarCampo` builds the masked projection the model will see. Only the D-05 public list stays in clear. The NIT shows as `•••••3456`, names as initials, emails as `l•••@domain`, phones as `+57 ••• ••• 0100` and amounts as `[monto oculto]`. Every other ruta becomes `[dato oculto]`. A test across all four real cases checks that no non-public raw value appears.

## Task Commits

1. **Task 1: Rules as data, label normalization and the strict template engine**
   - RED `4347340` (test)
   - GREEN `7c04d65` (feat)
2. **Task 2: Mapping engine and the code-owned PII policy against the four-case oracle**
   - RED `91559d0` (test)
   - GREEN `a150b1d` (feat)

No REFACTOR commits were made, because both GREEN implementations were already in their final shape (tdd.md: refactor commits only when something changes).

## Files Created/Modified

- `src/knowledge/reglas.json`: business rules v1 as data.
- `src/domain/reglas.ts`: the `Reglas` type mirroring the JSON, plus `ReglaMapeo`, `EstadoCampo` and `REGLAS_MAPEO`.
- `src/domain/normalizar.ts`: `normalizarEtiqueta` (NFD, strip U+0300-U+036F, lowercase, collapse spaces, drop trailing `:`/`*`) and `aTexto`.
- `src/domain/plantillas.ts`: `renderizarPlantilla` and the `ContextoPlantilla` types.
- `src/domain/mapeo.ts`: glossary index, `leerRuta`, `mapearCampos`, `contarEstados`.
- `src/domain/pii.ts`: `POLITICA_PII`, `enmascarar`, `presentarCampo`, `VARIABLES_NOTA_PERMITIDAS`, `VARIABLES_NOTA_DEL_MAESTRO`.
- `tests/unit/{normalizar,plantillas,mapeo,pii}.test.ts`: 4 suites with 85 tests. The full suite has 132 tests.

## Decisions Made

See `key-decisions` in the frontmatter. These shape the plan 01-05 contract:
- `EntradaMapeo.variablesNota` is for caller extras only (for example `pais_emisor`). The engine computes moneda, ano, pais and identificador itself.
- When a field has several notes, they are joined with `". "`.
- A country missing from `por_pais` surfaces as `REGLAS_INVALIDAS` on a generic label rather than a silent gap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SWIFT mask literal in the plan contradicted D-07**
- **Found during:** Task 2 (GREEN run)
- **Issue:** The plan's must_haves and behavior say `COLOCOBM → ••••OCBM`, but the last four characters of `COLOCOBM` are `COBM`. The D-07 rule ("últimos 4 caracteres") and the RESEARCH mask function both give `••••COBM`.
- **Fix:** The test expectation now follows the rule (`••••COBM`). The implementation was not bent to match the typo.
- **Files modified:** tests/unit/pii.test.ts
- **Verification:** `bun test tests/unit/pii.test.ts` passes. The other mask literals (`•••••3456`, `•••••••2345`, `••••5123`, `••••`) match the plan exactly.
- **Commit:** a150b1d

**2. [Rule 2 - Missing critical] Hardened mask edge cases not listed in the plan**
- **Found during:** Task 2
- **Issue:** The RESEARCH mask helpers would leak a whole value in two edge cases: a phone without spaces (the single group is "the last group") and an email without `@`.
- **Fix:** A phone with a single group falls back to last-4. An email without a local part or without `@` becomes `[dato oculto]`. Both cases are covered by tests.
- **Files modified:** src/domain/pii.ts, tests/unit/pii.test.ts
- **Commit:** a150b1d

---

**Total deviations:** 2 auto-fixed (1 bug in a plan literal, 1 missing-critical hardening). **Impact:** The masked output contract (D-05) follows the documented rule. Plan 01-05 goldens should use `••••COBM` for SWIFT.

## Issues Encountered

None.

## Known Stubs

None. `plantillas.*` paths in reglas.json point to `.md` templates that later plans (01-07 and onward) create. They are data references, not wired stubs.

## Threat Flags

None. No new network, filesystem or auth surface was added. All six modules are pure domain code, with no `node:`, zod or library imports (verified by tests/architecture.test.ts).

## Verification

- `bun test tests/unit`: 85 pass, 0 fail.
- `bun test`: 132 pass, 0 fail across 8 files.
- `bun run check` (tsc + biome + bun audit): exit 0, no vulnerabilities.
- The engine counts for the four real cases equal the truth table (17/0/0, 13/1/1, 9/1/1, 8/0/1).

## Next Phase Readiness

Ready for 01-05. That plan should do three things: expose `mapearCampos` + `presentarCampo` as `proveedor_mapear_campos`, add the zod loader for reglas.json, the glossary and the maestro (`REGLAS_INVALIDAS` and `DATOS_INVALIDOS`), and pass `pais_emisor` only where D-22 needs it.

## Self-Check: PASSED
