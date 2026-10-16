---
phase: 04-m-dulo-documentaci-n-y-defensa
plan: 05
subsystem: testing-evidence
tags: [costo, deepseek-flash, usage, evidencia, doc-02, bun-test, biome]
status: complete

requires:
  - phase: 04-04
    provides: TEXTO_PREFLIGHT.mensajeGuion / mensajeConfirmacion and CASO_GUION_PRD for the PRD §11 scenario
  - phase: 03
    provides: usage events (entrada, cacheHit, salida, proveedor, modelo) per model call, crearAgente wiring, live-test setup
provides:
  - "src/config/constants/costo.constants.ts: deepseek-flash peak/off-peak prices with source and consult date, evidence states, guion id, evidence path, decimals"
  - "tests/helpers/costo.helper.ts: costoUsd, redondear, acumular, escenarioDesdeUsos, evidenciaMedida, evidenciaPendiente, preciosEvidencia, formatoUsd, escribirEvidencia, casosEn, clavesLlm, fugasDeEvidencia"
  - "`bun run costo` (COSTO_EN_VIVO=1): opt-in live run that measures the four fixture cases and PRD §11 and writes the evidence"
  - "docs/evidencia/costo-por-caso.json in estado medido (5 scenarios, run 2026-10-16T04:54:20.125Z)"
  - "tests/docs/evidencia-costo.test.ts: strict-schema contract that recomputes every cost and total and scans for master values and the key"
affects: [04-06 docs/entrega.md, 04-07 SOLUCION.md §4]

actuals:
  tokens: 6458
  tasks: 2
  commits: 3
plan_head_before: 8f0e9737a2fdf8fa6620bf44e0910eb5113ab3c9
plan_head_after: d982dbf357a781297da6a15390086762161c688a

tech-stack:
  added: []
  patterns:
    - "Measured evidence as a committed JSON file with a discriminated-union strict schema (medido | pendiente_de_corrida), recomputed in a contract test from the stored tokens and the price constants"
    - "Opt-in live runs gated by their own env flag (COSTO_EN_VIVO), separate from LLM_EN_VIVO, so test:vivo never spends twice"
    - "Generated JSON goes through `biome format --write` so `biome check .` stays green"

key-files:
  created:
    - src/config/constants/costo.constants.ts
    - tests/helpers/types/costo.type.ts
    - tests/helpers/costo.helper.ts
    - tests/live/costo-por-caso.test.ts
    - tests/docs/evidencia-costo.test.ts
    - docs/evidencia/costo-por-caso.json
  modified:
    - package.json

key-decisions:
  - "The evidence price block is a camelCase projection of PRECIOS_DEEPSEEK_FLASH (fuente, consultado, moneda, tokensPorUnidad, pico, valle), so the JSON reads in Spanish and the test compares it to the constants"
  - "The scenario and total costs are computed from the summed tokens (not by adding rounded per-call costs) and rounded to 6 decimals, so the contract test can recompute them exactly"
  - "The pending evidence has proveedor and modelo null too: nothing in a pending file looks measured"
  - "The cost run happened once, at 04:54 UTC on a Friday. That is outside the peak windows cited in research (01:00–04:00 and 06:00–10:00 UTC, Mon–Fri), so the off-peak column is the tariff that applied, and the evidence reports both"

patterns-established:
  - "Evidence files under docs/evidencia/: numbers, ids, model names and source URLs only, with a test that scans for sensiblesDelProyecto values and the LLM keys"

requirements-completed: [DOC-02]

coverage:
  - id: D1
    description: "Cost math and evidence builders (costoUsd peak/off-peak, escenarioDesdeUsos, evidenciaMedida, evidenciaPendiente, formatoUsd, leak scan)"
    requirement: "DOC-02"
    verification:
      - kind: unit
        ref: "tests/docs/evidencia-costo.test.ts#cálculo del costo por caso (D-86)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Committed docs/evidencia/costo-por-caso.json in estado medido: strict schema, ids = fixture cases + guion-11, every cost and the total recomputed, no master values or key"
    requirement: "DOC-02"
    verification:
      - kind: unit
        ref: "tests/docs/evidencia-costo.test.ts#docs/evidencia/costo-por-caso.json (D-98)"
        status: pass
    human_judgment: false
  - id: D3
    description: "`bun run costo` opt-in live run against DeepSeek (skipped without COSTO_EN_VIVO=1, never in CI)"
    requirement: "DOC-02"
    verification:
      - kind: integration
        ref: "bun run costo (1 pass, 44.12 s, 2026-10-16T04:54Z)"
        status: pass
      - kind: other
        ref: "bun test tests/live/costo-por-caso.test.ts (skipped without the flag)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-10-16
---

# Phase 04 Plan 05: Costo medido por caso Summary

**The cost per case was measured from real DeepSeek `usage`. One `bun run costo` run covered the four fixture cases and the PRD §11 guion: 27 calls, 207,951 input tokens (197,376 cache hits) and 4,460 output tokens, for 0.009709 USD at the peak tariff and 0.004854 USD off-peak. The result is committed as schema-checked, recomputable evidence in `docs/evidencia/costo-por-caso.json`.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-16T04:48:15Z
- **Completed:** 2026-10-16T04:55:30Z
- **Tasks:** 2 (Task 1 tracer with TDD, Task 2 auto)
- **Files modified:** 7

## Accomplishments

- **Price constants.** `PRECIOS_DEEPSEEK_FLASH` holds the deepseek-flash prices per 1M tokens. Peak is 0.006 / 0.30 / 1.20 and off-peak is 0.003 / 0.15 / 0.60. The source is `https://api-docs.deepseek.com/quick_start/pricing`, consulted 2026-10-15.
- **Shared cost helper.** The live run and the contract test use the same helper: cost per tariff, a scenario from its usage events, the total, the measured or pending evidence, Biome-formatted writing and a leak scan.
- **`bun run costo`.** It runs behind `COSTO_EN_VIVO=1` in-process with the Render-default LLM configuration (only the key comes from `.env`). Each fixture case gets a fresh session, and the guion runs in one session of 2 turns. Before any number is written, the run requires `proveedor_armar_paquete` ok per case and `proveedor_simular_envio` ok on "envía".
- **Contract test.** It validates the committed evidence in both states with a strict schema. It recomputes every cost and total, requires ids to be the fixture cases plus `guion-11`, and scans for master values and the LLM keys.

### Measured run (2026-10-16T04:54:20.125Z UTC, deepseek / deepseek-flash, once)

| Scenario | Turns | Calls | Input | Cache hit | Cache miss | Output | Peak USD | Off-peak USD |
|---|---|---|---|---|---|---|---|---|
| co-industrias-delta | 1 | 5 | 38,788 | 36,480 | 2,308 | 922 | 0.002018 | 0.001009 |
| ec-corp-andina | 1 | 5 | 38,322 | 35,584 | 2,738 | 948 | 0.002173 | 0.001086 |
| hn-agroexport-sula | 1 | 5 | 36,937 | 34,688 | 2,249 | 800 | 0.001843 | 0.000921 |
| pa-logistica-istmo | 1 | 5 | 36,194 | 34,304 | 1,890 | 708 | 0.001622 | 0.000811 |
| guion-11 | 2 | 7 | 57,710 | 56,320 | 1,390 | 1,082 | 0.002053 | 0.001027 |
| **Total** | 6 | 27 | 207,951 | 197,376 | 10,575 | 4,460 | 0.009709 | 0.004854 |

These numbers are one dated sample, not an average, because the model can take a different tool path on each run. The run started 04:53:36Z on a Friday. That is outside the peak windows cited in research, so off-peak is the tariff that applied.

## Task Commits

1. **Task 1 RED:** `e62a4f2` test(04-05): agregar pruebas que fallan de la evidencia de costo por caso
2. **Task 1 GREEN:** `249f9a4` feat(04-05): medir el costo por caso con usage real y dejar la evidencia pendiente
3. **Task 2:** `d982dbf` docs(04-05): registrar el costo medido por caso contra deepseek-flash

## TDD Evidence

- **Task 1 RED:** `bun test tests/docs/evidencia-costo.test.ts --reporter=junit` exited 1 with 0 pass and 11 fail. The classifier (`check tdd-red-evidence`) returned `RED_EVIDENCE_OK` with reason `target_test_failed` for "escenarioDesdeUsos suma las llamadas y deriva el cache miss y los dos costos". Semantic assessment: the target failed on its `toEqual` assertion, because the stub helper returned every accumulator as 0 instead of `llamadas 2, entrada 42000, cacheMiss 8000, costoPicoUsd 0.003564`. There was no load, import or syntax fault. The three file-contract tests failed with ENOENT because the evidence file did not exist yet, which was expected in RED.
- **Task 1 GREEN:** after the helper was implemented and the pending evidence written, 11 pass and 0 fail.
- **Tracer gate (auto mode):** the verify was re-run end to end after GREEN. The evidence test passed, the live test was skipped without the flag, and `bun run check` was green. Expansion continued.

## Files Created/Modified

- `src/config/constants/costo.constants.ts`: prices, evidence states, `ESCENARIO_GUION`, `RUTA_EVIDENCIA_COSTO`, `DECIMALES_COSTO`.
- `tests/helpers/types/costo.type.ts`: `Tarifa`, `UsoAgregado`, `EstadoEvidenciaCosto`, `PreciosEvidencia`, `CostoAcumulado`, `EscenarioCosto`, `EvidenciaCosto`.
- `tests/helpers/costo.helper.ts`: the cost math, the evidence builders, the writer (Biome via `Bun.spawn`), `casosEn`, `clavesLlm` and `fugasDeEvidencia`.
- `tests/live/costo-por-caso.test.ts`: the opt-in measured run.
- `tests/docs/evidencia-costo.test.ts`: the evidence contract.
- `docs/evidencia/costo-por-caso.json`: the measured evidence.
- `package.json`: the script `"costo": "COSTO_EN_VIVO=1 bun test tests/live/costo-por-caso.test.ts"`.

## Decisions Made

- **Spanish price block.** The JSON price block is a camelCase projection of the constants, so it reads in Spanish and stays comparable to the constants.
- **Costs from summed tokens.** Scenario and total costs come from summed tokens, rounded to 6 decimals, so they can be recomputed exactly.
- **Pending means nothing measured.** In the pending state `proveedor` and `modelo` are null as well as the date, scenarios and total.
- **Five extra helper exports.** The plan's export list was extended with `preciosEvidencia`, `acumular`, `casosEn`, `clavesLlm` and `fugasDeEvidencia`, so the live run and the contract test share a single implementation of the price projection, the total, the case listing and the leak scan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Leak scan made testable and shown to catch a planted value**
- **Found during:** Task 1 (RED design)
- **Issue:** The plan asked for a key and PII scan in two places (the live run before writing, and the evidence test). Two copies of the scan could drift apart, and nothing proved the scan works.
- **Fix:** One `fugasDeEvidencia(serializada, sensibles, claves)` in the helper is used by both. A test plants a master value and a key and checks that both are reported. `clavesLlm` reads only non-empty `LLM_API_KEY` / `DEEPSEEK_API_KEY`.
- **Files modified:** tests/helpers/costo.helper.ts, tests/docs/evidencia-costo.test.ts
- **Verification:** `bun test tests/docs/evidencia-costo.test.ts` passes, including "fugasDeEvidencia detecta un valor del maestro y una clave plantados".
- **Committed in:** e62a4f2 (RED) and 249f9a4 (GREEN)

**2. [Rule 3 - Blocking] Scaffolding committed with the RED tests**
- **Found during:** Task 1 RED
- **Issue:** Without the constants, types and helper, Bun fails at link time. That would be an INVALID_RED load failure.
- **Fix:** The RED commit carries the constants, the types and a stub helper that returns zeros and empty values. All behavior arrived in GREEN `249f9a4`.
- **Files modified:** src/config/constants/costo.constants.ts, tests/helpers/types/costo.type.ts, tests/helpers/costo.helper.ts
- **Verification:** The classifier returned RED_EVIDENCE_OK, with every failure an assertion failure or the expected missing file.
- **Committed in:** e62a4f2

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking). **Impact:** both strengthen the privacy guard and the TDD discipline. The delivered interface is unchanged, plus five extra helper exports.

## Issues Encountered

None. The single live run passed on the first attempt (1 pass, 44.12 s, exit 0), so no retry was needed. No key, message text or master value reached the evidence, the console output or any commit. `.env` is not tracked.

## Known Stubs

None. The RED stub helper was fully replaced in GREEN.

## User Setup Required

None. The run used the key already present in the local `.env`. To reproduce: `bun run costo` with `LLM_API_KEY` or `DEEPSEEK_API_KEY` in `.env`. It rewrites `docs/evidencia/costo-por-caso.json` with a new dated sample.

## Next Phase Readiness

- Plan 04-06 (`docs/entrega.md`) has no pending human item to copy for cost. The evidence is measured.
- Plan 04-07 (SOLUCION.md §4) can cite `docs/evidencia/costo-por-caso.json` in estado `medido`, using `formatoUsd` for both tariffs. Per case, that is about 0.0016–0.0022 USD at the peak tariff and 0.0008–0.0011 USD off-peak.
- `bun run check` is green. `bun test` gives 2416 pass, 2 skip (the two opt-in live suites) and 0 fail.

---
*Phase: 04-m-dulo-documentaci-n-y-defensa*
*Completed: 2026-10-16*

## Self-Check: PASSED

- FOUND: src/config/constants/costo.constants.ts, tests/helpers/types/costo.type.ts, tests/helpers/costo.helper.ts, tests/live/costo-por-caso.test.ts, tests/docs/evidencia-costo.test.ts, docs/evidencia/costo-por-caso.json
- FOUND commits: e62a4f2, 249f9a4, d982dbf (ancestors of HEAD)
- Plan verification: `bun test tests/docs/evidencia-costo.test.ts tests/live/costo-por-caso.test.ts` gave 11 pass and 1 skip; ESTADO_EVIDENCIA=medido with ESCENARIOS=5; ENV_NO_TRACKED; `bun run check` exit 0.
