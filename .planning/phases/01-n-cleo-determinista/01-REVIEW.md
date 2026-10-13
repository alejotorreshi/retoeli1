---
phase: 01-n-cleo-determinista
reviewed: 2026-10-13T01:33:48Z
depth: standard
review_kind: layout-role-folders
supersedes: "previous 01-REVIEW.md (conventions and clarity, WR-10..WR-20 and IN-13..IN-19, all fixed per 01-REVIEW-FIX.md; preserved in git at ade826f)"
diff_base: ade826f
files_reviewed: 79
files_reviewed_list:
  - .claude/CLAUDE.md
  - src/config/constants/demo.constants.ts
  - src/config/constants/errors.constants.ts
  - src/config/constants/files.constants.ts
  - src/config/constants/forms.constants.ts
  - src/config/constants/io.constants.ts
  - src/config/constants/knowledge.constants.ts
  - src/config/constants/limits.constants.ts
  - src/config/constants/maestro.constants.ts
  - src/config/constants/mapping.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/config/constants/pdf.constants.ts
  - src/config/constants/pii.constants.ts
  - src/config/constants/runtime.constants.ts
  - src/config/constants/supports.constants.ts
  - src/config/constants/tools.constants.ts
  - src/config/constants/xlsx.constants.ts
  - src/config/env.ts
  - src/config/strings.ts
  - src/config/types/valor-de.type.ts
  - src/demo/ejecutar-demo.runner.ts
  - src/demo/types/demo.type.ts
  - src/domain/borrador.ts
  - src/domain/checklist.ts
  - src/domain/comparar-mapeo.ts
  - src/domain/fecha.ts
  - src/domain/formatear-issues.ts
  - src/domain/formulario.ts
  - src/domain/glosario.ts
  - src/domain/maestro.ts
  - src/domain/mapeo.ts
  - src/domain/motor-plantillas.ts
  - src/domain/nombre-error.ts
  - src/domain/normalizar.ts
  - src/domain/pii.ts
  - src/domain/portal.ts
  - src/domain/resultado.ts
  - src/domain/solicitud.ts
  - src/domain/types/borrador.type.ts
  - src/domain/types/checklist.type.ts
  - src/domain/types/comparar-mapeo.type.ts
  - src/domain/types/errores.type.ts
  - src/domain/types/fecha.type.ts
  - src/domain/types/formulario.type.ts
  - src/domain/types/maestro.type.ts
  - src/domain/types/mapeo.type.ts
  - src/domain/types/motor-plantillas.type.ts
  - src/domain/types/pii.type.ts
  - src/domain/types/plantilla-caso.type.ts
  - src/domain/types/portal.type.ts
  - src/domain/types/reglas.type.ts
  - src/domain/types/resultado.type.ts
  - src/domain/types/solicitud.type.ts
  - src/domain/types/validacion.type.ts
  - src/domain/types/vigencias.type.ts
  - src/domain/validar-reglas.ts
  - src/domain/vigencias.ts
  - src/tools/definir-herramienta.factory.ts
  - src/tools/entorno.wiring.ts
  - src/tools/herramientas.factory.ts
  - src/tools/proveedor.ts
  - src/tools/schemas/argumentos.schema.ts
  - src/tools/types/entorno.type.ts
  - src/tools/types/herramienta.type.ts
  - tests/architecture.test.ts
  - tests/unit/comparar-mapeo.test.ts
  - tests/unit/copias.test.ts
  - tests/unit/esquemas.test.ts
  - tests/unit/lector.test.ts
  - tests/unit/mapeo.test.ts
  - tests/unit/normalizar.test.ts
  - tests/unit/pdf-layout.test.ts
  - tests/unit/pii.test.ts
  - tests/unit/plantillas.test.ts
  - tests/unit/reloj.test.ts
  - tests/unit/salida.test.ts
  - tests/unit/solicitud.test.ts
  - tests/unit/validar-reglas.test.ts
  - tests/unit/vigencias.test.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 01: Code Review Report (layout: role folders for domain and tools)

**Reviewed:** 2026-10-13T01:33:48Z
**Depth:** standard (with an importer map for every moved module)
**Files Reviewed:** 79
**Status:** issues_found

## Summary

This review covers layout only. The user asked: "Esos archivos de domain que se ven sueltos no hicieron falta también los ajustes, y no sé si también los de tools". The user has already chosen the target scheme: role folders with role suffixes, mirroring `application/`. I read every file the scheme would move, so I could check that each file's content matches its assigned role. I also mapped every importer in `src/`, `tests/`, `demo.ts` and `docs/`, and checked which guards in `tests/architecture.test.ts` are keyed by exact path or forbid the new names.

Baseline: `bun test tests/architecture.test.ts` gives 46 pass, 0 fail at `ade826f`.

Main conclusions:

1. **Most of the proposed assignment fits the content. Four files do not**, and the fix is a minimal split or a role change (WR-21):
   - `checklist.ts` mixes a policy (`evaluarSoportes` and its six helpers) with two builders.
   - `pii.ts` mixes the PII policy (`POLITICA_PII` plus `enmascarar`) with a projection (`presentarCampo`). The constant and the masking belong together. The projection does not.
   - `solicitud.ts` mixes a decision table (`elegirPlantilla`, a policy) with two selectors.
   - `glosario.ts` is not a selector. `construirIndiceGlosario` builds and validates an index, so it is a builder.
   - `motor-plantillas.ts` stays whole. `plantillaInvalida` is the `Fallo` the engine emits. `seccionSi` encodes the `[{}]`/`[]` section protocol that only this engine interprets. Both are part of the engine's public vocabulary, so moving them out would scatter the engine's contract.
2. **The guards forbid the target layout today.** G5's pattern `^src/domain/<kebab>\.ts$` only accepts root files, so the first `git mv` into `domain/engines/` turns G5 red. Three exact-path keys then break: `DUENOS_DE_REGEX` (motor-plantillas), the `capaDeRuta` composition-root check (`src/tools/entorno.wiring`), and the sample paths in the bite tests. The `wiring` key is the dangerous one. After the move, the wiring file is classified as layer `tools`, and its 13 `@/infra/**` import statements fail the layer guard. The tempting "fix" is to add `infra` to the `tools` allow-list, which would silently let every tool import infrastructure (WR-22).
3. **The unit tests cannot mirror the new names under the current G5.** The test pattern `<kebab>\.test\.ts` rejects `mapeo.engine.test.ts`. Five unit tests use `new URL("../../reto-01/…", import.meta.url)`, so mirroring by nested folder would break them. A flat `tests/unit/<módulo>.<rol>.test.ts` layout plus a mirror guard is the safe option (WR-23).
4. **The split exposes one duplicated business rule.** The generic-label set and the per-country tax-identifier lookup are computed twice, in `solicitud.ts` and in `mapeo.ts`. The new `policies/` folder is their natural single home (WR-24).

Known roots: `src/tools/proveedor.ts` (fixed by the PRD) and `src/config/strings.ts` (fixed by the user) stay where they are. `src/config/env.ts` should **stay** as an explicit allow-listed file (reasoning in WR-21). `src/demo/ejecutar-demo.runner.ts` should move to `src/demo/runners/`, so that the no-loose-file guard keeps only fixed exceptions.

## Warnings

### WR-21: Domain, tools and demo logic sit loose at their layer root with no role folder (complete rename and split table)

**Files:** the 18 `.ts` files at `src/domain/` root; `src/tools/definir-herramienta.factory.ts`, `src/tools/herramientas.factory.ts`, `src/tools/entorno.wiring.ts`; `src/demo/ejecutar-demo.runner.ts`.

**Issue:** `application/` separates roles by folder (`use-cases/`, `services/`, `types/`). In contrast, `domain/` has 18 files loose next to `types/`, and `tools/` has factories and the composition root loose next to `proveedor.ts`, `schemas/` and `types/`. The CLAUDE.md rule "El dominio va sin sufijo" made the role invisible in names and imports. Today `@/domain/maestro.ts` and `@/domain/mapeo.ts` look like peers, even though one is a selector and the other is the mapping engine.

**Role definitions** used to verify the assignment (also proposed for CLAUDE.md, see WR-22):
- **engine**: the central algorithm that drives a flow (mapping, template rendering).
- **builder**: assembles an output structure from data that is already decided.
- **policy**: decides or validates according to a business rule.
- **selector**: reads or projects data from an input without deciding anything.
- **util**: a generic function with no business rule.

**Domain verdicts and exact targets** (lines refer to `ade826f`):

| Today | Target | Exports there | Verdict |
|---|---|---|---|
| `src/domain/mapeo.ts` | `src/domain/engines/mapeo.engine.ts` | `mapearEtiquetas`, `contarEstados` | Fits. `contarEstados` is a small aggregate (see IN-21). |
| `src/domain/motor-plantillas.ts` | `src/domain/engines/motor-plantillas.engine.ts` | `renderizarPlantilla`, `renderizarTextoPlano`, `plantillaInvalida`, `seccionSi` | Fits. Keep it whole (see Summary). |
| `src/domain/borrador.ts` | `src/domain/builders/borrador.builder.ts` | `construirDatosBorrador`, `construirDatosEnvio` | Fits. The simulated send is the same email, and both builders share `asuntoRespuesta`. |
| `src/domain/checklist.ts:98-160` | `src/domain/builders/checklist.builder.ts` | `construirChecklist`, `construirDatosChecklist` (+ private `bloqueoDe`, `vigenciaVisible`, `filaSoporte`) | **Split.** `git mv` the file here. |
| `src/domain/checklist.ts:25-96` | `src/domain/policies/soportes.policy.ts` (new) | `evaluarSoportes` (+ private `avisoEmisor`, `soporteAusente`, `vigenciaComparable`, `masVigentePrimero`, `entradaMasVigente`, `evaluarSoporte`) | **Split.** This code decides present, absent or expired, picks the entry with the latest validity, and applies the issuer rule. That is a policy. |
| `src/domain/formulario.ts` | `src/domain/builders/formulario.builder.ts` | `construirFilas` | Fits (rename suggested in IN-21). |
| `src/domain/portal.ts` | `src/domain/builders/portal.builder.ts` | `construirDatosPortal` | Fits. |
| `src/domain/glosario.ts` | **`src/domain/builders/glosario.builder.ts`** (not `selectors/`) | `construirIndiceGlosario` | **Role corrected.** It builds the `{exacto, normalizado}` index and rejects collisions. It never reads or selects anything. |
| `src/domain/pii.ts:1-60` | `src/domain/policies/pii.policy.ts` | `POLITICA_PII`, `enmascarar` (+ private mask strategies) | Fits. The table says which mask applies to which path, and `enmascarar` applies it, so they are one policy. |
| `src/domain/pii.ts:62-78` | `src/domain/builders/campo-presentado.builder.ts` (new) | `presentarCampo` (+ private `valorEnmascarado`) | **Split.** It is a projection `CampoMapeado → CampoPresentado` that calls the policy. It makes no decision of its own. |
| `src/domain/vigencias.ts` | `src/domain/policies/vigencias.policy.ts` | `evaluarVigencia`, `textoVence` | Fits (`textoVence` export: IN-22). |
| `src/domain/comparar-mapeo.ts` | `src/domain/policies/comparar-mapeo.policy.ts` | `compararMapeo` | Fits. It enforces "el modelo no inventa un mapeo". |
| `src/domain/validar-reglas.ts` | `src/domain/policies/validar-reglas.policy.ts` | `validarTextosDeReglas` | Fits. |
| `src/domain/solicitud.ts:13-20` | `src/domain/policies/plantilla-caso.policy.ts` (new) | `elegirPlantilla` | **Split.** It is a decision table (format × present templates). The name mirrors `types/plantilla-caso.type.ts` and avoids the overloaded word "plantilla" (IN-16). |
| `src/domain/solicitud.ts:22-40` | `src/domain/selectors/solicitud.selector.ts` | `camposSolicitados`, `detectarAmbiguos` | Fits once `elegirPlantilla` leaves (rule duplication: WR-24). |
| `src/domain/maestro.ts` | `src/domain/selectors/maestro.selector.ts` | `segmentoValido`, `leerHoja`, `leerRuta` | Fits. `segmentoValido` is the predicate that makes the selection safe, so it stays. |
| `src/domain/fecha.ts` | `src/domain/utils/fecha.util.ts` | `esFechaReal` | Fits. |
| `src/domain/normalizar.ts` | `src/domain/utils/normalizar.util.ts` | `normalizarEtiqueta`, `aTexto` | Fits (`aTexto`: IN-22). |
| `src/domain/resultado.ts` | `src/domain/utils/resultado.util.ts` | `exito`, `fallo` | Fits. |
| `src/domain/formatear-issues.ts` | `src/domain/utils/formatear-issues.util.ts` | `formatearIssues` | Fits. Only infra and tools import it. It lives in domain because that is the one layer both can reach. Say so in `docs/`. |
| `src/domain/nombre-error.ts` | `src/domain/utils/nombre-error.util.ts` | `nombreDeError` | Fits (same note as above). |
| `src/domain/types/*.type.ts` | unchanged (flat) | — | See IN-20 for the three types that no longer sit next to their module's name. |

Result: `engines/` 2, `builders/` 6, `policies/` 6, `selectors/` 2, `utils/` 5. That is 21 files from 18, no cycles, and every intra-domain edge allowed.

**Importers to rewrite for the splits:**
- `evaluarSoportes`: `src/application/services/estado-paquete.service.ts:6` and `tests/unit/vigencias.test.ts:2`.
- `presentarCampo`: `src/application/use-cases/mapear-campos.use-case.ts:9`, `src/application/services/mapeo-canonico.service.ts:7` and `tests/unit/pii.test.ts:5`.
- `elegirPlantilla`: `src/application/services/contexto-caso.service.ts:9` and `tests/unit/solicitud.test.ts:2`.

**Tools, demo and config:**

| Today | Target | Importers to rewrite |
|---|---|---|
| `src/tools/definir-herramienta.factory.ts` | `src/tools/factories/definir-herramienta.factory.ts` | `src/tools/herramientas.factory.ts:8`, `tests/e2e/trazador.test.ts:12` |
| `src/tools/herramientas.factory.ts` | `src/tools/factories/herramientas.factory.ts` | `src/tools/proveedor.ts:1`, `tests/helpers/types/flujo.type.ts:1`, 9 contract/golden tests |
| `src/tools/entorno.wiring.ts` | `src/tools/wiring/entorno.wiring.ts` | `src/tools/definir-herramienta.factory.ts:13` |
| `src/tools/proveedor.ts` | **unchanged** (PRD 6.2) | — |
| `src/tools/schemas/argumentos.schema.ts`, `src/tools/types/*` | unchanged | — |
| `src/demo/ejecutar-demo.runner.ts` | `src/demo/runners/ejecutar-demo.runner.ts` | `demo.ts:1`, `tests/helpers/correr-demo.helper.ts:2`, `tests/e2e/demo.test.ts:11` |
| `src/config/env.ts` | **unchanged, allow-listed** | — |
| `src/config/strings.ts` | **unchanged** (user-fixed) | — |

**Why `config/env.ts` stays:**
- It is the single env boundary. G3 (`TIPOS_JUNTO_A_SU_ESQUEMA`), G10 (`LECTORES_DE_ENTORNO`), `capaDeRuta` ("config-env") and CLAUDE.md all name it by path.
- Its content is a schema, a reader and `pinExecutionDate`. That mix means no single role suffix would be true.
- A folder holding one file adds a path segment and nothing else.

**Why the demo runner moves:** without the move, the no-loose-file guard needs a fourth exception that neither the PRD nor the user fixed.

**Fix:** apply both tables with `git mv`, in the commit order given under "Migration order". For each split, `git mv` the file to the target that keeps most of the lines, so history follows it. Then create the new file with the extracted functions, moved verbatim.

### WR-22: The G5 suffix table, three exact-path guard keys and the CLAUDE.md rule encode "el dominio va sin sufijo"

**Files:**
- `tests/architecture.test.ts:118-121` (`DUENOS_DE_REGEX` holds `"src/domain/motor-plantillas.ts"`).
- `:142-158` (`NOMBRES_CON_ROL`: `:152` accepts only `^src/domain/<kebab>\.ts$`, `:154` accepts only `^src/tools/<kebab>\.(factory|wiring|util)\.ts$`, `:155` `src/demo/<kebab>.runner.ts`, `:147` allows `types/` nested at any depth, `:153` allows `src/infra/x.adapter.ts` at infra root, `:156` rejects `<m>.<rol>.test.ts`).
- `:175` (`capaDeRuta`: `base === "src/tools/entorno.wiring"`).
- `:532`, `:646-648`, `:711-733` (sample paths).
- `.claude/CLAUDE.md` (the "Archivos en kebab-case" bullet, the regex exception `domain/motor-plantillas.ts`, the count "G1–G12").
- `docs/plantillas.md:3`.

**Issue:** the guards enforce the old layout. Moving any domain file turns G5 red. Moving `motor-plantillas.ts` turns G11 red. Moving `entorno.wiring.ts` reclassifies it from `wiring` to `tools`, and the layer guard then reports all its `@/infra/**` imports. That failure is loud, but the obvious workaround (add `"infra"` to `DESTINOS_DE_HERRAMIENTAS`) would silently erase the rule "solo el composition root importa infra". Nothing forbids a loose `.ts` at a layer root today, which is how the 18 domain files got there.

**Fix: exact changes to `tests/architecture.test.ts`:**

```ts
const CARPETAS_DE_ROL: Readonly<Record<string, string>> = {
  "domain/engines": "engine",
  "domain/builders": "builder",
  "domain/policies": "policy",
  "domain/selectors": "selector",
  "domain/utils": "util",
  "application/use-cases": "use-case",
  "application/services": "service",
  "tools/factories": "factory",
  "tools/wiring": "wiring",
  "demo/runners": "runner",
};

const ROLES_DE_PRUEBA = [...new Set([...Object.values(CARPETAS_DE_ROL), "adapter", "schema"])].join("|");

const NOMBRES_CON_ROL: readonly RegExp[] = [
  /^demo\.ts$/,
  /^src\/tools\/proveedor\.ts$/,
  /^src\/config\/(?:strings|env)\.ts$/,
  new RegExp(`^src/config/constants/${KEBAB}\\.constants\\.ts$`),
  new RegExp(`^src/(?:config|domain|application|infra|tools|demo)/types/${KEBAB}\\.type\\.ts$`),
  new RegExp(`^tests/helpers/types/${KEBAB}\\.type\\.ts$`),
  new RegExp(`^src/(?:infra|tools)/(?:${KEBAB}/)*schemas/${KEBAB}\\.schema\\.ts$`),
  ...Object.entries(CARPETAS_DE_ROL).map(
    ([carpeta, rol]) => new RegExp(`^src/${carpeta}/${KEBAB}\\.${rol}\\.ts$`),
  ),
  new RegExp(`^src/infra/${KEBAB}/(?:${KEBAB}/)*${KEBAB}\\.(?:adapter|util)\\.ts$`),
  new RegExp(`^tests/unit/${KEBAB}\\.(?:${ROLES_DE_PRUEBA})\\.test\\.ts$`),
  new RegExp(`^tests/(?!unit/)(?:${KEBAB}/)*${KEBAB}\\.test\\.ts$`),
  new RegExp(`^tests/helpers/${KEBAB}\\.helper\\.ts$`),
];
```

What this changes:
- It removes `^src/domain/<kebab>\.ts$` and the root-level `tools`/`demo` patterns.
- It drops `tools/*.util.ts`, which has no file since `formatear-issues` moved to domain.
- It pins `types/` to the layer root, so `domain/policies/types/` is rejected.
- It requires an area folder under `infra/`.

Point the remaining exact-path keys at the new paths:

```ts
const DUENOS_DE_REGEX: ReadonlySet<string> = new Set([
  "src/config/constants/patterns.constants.ts",
  "src/domain/engines/motor-plantillas.engine.ts",
]);
// capaDeRuta: keep the composition root keyed by exact path, never widen tools → infra
if (base === "src/tools/wiring/entorno.wiring") return "wiring";
```

(The comment above is review notation only. The code itself stays comment-free.)

**New G13: no loose `.ts` at `src/` or at a layer root.**

```ts
const SUELTO_EN_CAPA = /^src\/(?:[^/]+\/)?[^/]+\.ts$/;

const SUELTOS_PERMITIDOS: ReadonlySet<string> = new Set([
  "src/tools/proveedor.ts",
  "src/config/env.ts",
  "src/config/strings.ts",
]);

function violacionesDeArchivoSuelto(ruta: string): string[] {
  return SUELTO_EN_CAPA.test(ruta) && !SUELTOS_PERMITIDOS.has(ruta)
    ? [`${ruta}: archivo suelto en la raíz de su capa; va en una carpeta de rol`]
    : [];
}

test("G13: ningún .ts queda suelto en src/ ni en la raíz de una capa", () => {
  expect(listarFuentes().flatMap(violacionesDeArchivoSuelto)).toEqual([]);
});

test("G13: reporta archivos sueltos y deja pasar los fijados por el PRD y la usuaria", () => {
  const rutas = [
    "src/domain/mapeo.ts",
    "src/tools/entorno.wiring.ts",
    "src/infra/x.adapter.ts",
    "src/x.ts",
    "src/tools/proveedor.ts",
    "src/config/env.ts",
    "src/config/strings.ts",
    "src/domain/engines/mapeo.engine.ts",
  ];
  expect(rutas.flatMap(violacionesDeArchivoSuelto)).toEqual([
    "src/domain/mapeo.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
    "src/tools/entorno.wiring.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
    "src/infra/x.adapter.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
    "src/x.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
  ]);
});
```

`demo.ts` lives at the repo root, outside `src/`. `tests/architecture.test.ts` and `tests/sin-comentarios.test.ts` are repo-wide guards at `tests/` root. Both are outside G13's scope by construction.

**G5 bite test (`:883-904`):** add these as rejected:
- `src/domain/mapeo.ts` (now loose)
- `src/domain/engines/mapeo.policy.ts` (suffix from another folder)
- `src/domain/policies/pii.ts` (no suffix)
- `src/tools/factories/entorno.wiring.ts`
- `src/domain/policies/types/x.type.ts`
- `tests/unit/mapeo.test.ts`

Add these as accepted:
- `src/domain/engines/mapeo.engine.ts`
- `src/tools/wiring/entorno.wiring.ts`
- `tests/unit/mapeo.engine.test.ts`

**Sample paths to retarget:**
- `:532` → `src/demo/runners/ejecutar-demo.runner.ts`.
- `:646-648` → the same path.
- `:711-714` → `src/domain/engines/mapeo.engine.ts` and `@/domain/utils/normalizar.util`.
- `:717-723` → `src/tools/wiring/entorno.wiring.ts` (must stay `[]`) and `src/tools/factories/definir-herramienta.factory.ts` (must keep the violation).
- `:726-731` → the runner path and `@/tools/wiring/entorno.wiring` (still rejected for demo).

**Exact CLAUDE.md change.** Replace the "Archivos en kebab-case…" bullet, including its sub-list and the "El dominio va sin sufijo…" paragraph, with:

```markdown
- Archivos en kebab-case, cada uno en la carpeta de su rol y con el sufijo de ese rol:
  - `src/<capa>/types/*.type.ts` y `tests/helpers/types/*.type.ts`; `config/constants/*.constants.ts`; `schemas/*.schema.ts`;
  - `domain/engines/*.engine.ts` (algoritmo central), `domain/builders/*.builder.ts` (arma una estructura de salida),
    `domain/policies/*.policy.ts` (decide o valida según una regla de negocio), `domain/selectors/*.selector.ts`
    (lee o proyecta sin decidir) y `domain/utils/*.util.ts` (función genérica sin regla de negocio);
  - `application/use-cases/*.use-case.ts` (una sola función exportada) y `application/services/*.service.ts`;
  - `infra/<área>/**/*.adapter.ts` o `*.util.ts`;
  - `tools/factories/*.factory.ts`, `tools/wiring/*.wiring.ts` (único composition root que importa infra) y `demo/runners/*.runner.ts`;
  - `tests/unit/<módulo>.<rol>.test.ts`, espejo de un `src/**/<módulo>.<rol>.ts`; el resto `tests/**/*.test.ts`; `tests/helpers/*.helper.ts`.

  Ningún `.ts` va suelto en `src/` ni en la raíz de `src/<capa>/`; las únicas excepciones son `src/tools/proveedor.ts`,
  `src/config/env.ts` y `src/config/strings.ts`. Los nombres que fija el PRD no cambian: `demo.ts`,
  `src/tools/proveedor.ts` y `src/knowledge/**`.
```

Also make these edits:
- In the regex bullet, replace `domain/motor-plantillas.ts` with `domain/engines/motor-plantillas.engine.ts`.
- In the guards bullet, replace "(G1–G12)" with "(G1–G14)".
- In `docs/plantillas.md:3`, replace `src/domain/motor-plantillas.ts` with `src/domain/engines/motor-plantillas.engine.ts`.

### WR-23: Unit test names do not mirror the modules they test, and G5 forbids the mirrored names

**Files:** `tests/unit/*.test.ts` (14 files); `tests/architecture.test.ts:156`.

**Issue:**
- Six of the 14 unit tests are named after a Spanish concept, while the module they test is an English infra adapter: `copias`, `lector`, `reloj`, `salida`, `esquemas`, `pdf-layout`.
- `vigencias.test.ts` mostly tests `evaluarSoportes`, which lives in `checklist.ts`.
- `solicitud.test.ts` tests a policy and a selector.
- G5's test pattern `<kebab>\.test\.ts` rejects `mapeo.engine.test.ts`, so tests cannot carry the module's role today.

Mirroring by nested folder (`tests/unit/domain/engines/…`) is unsafe. Five of these files resolve fixtures with `new URL("../../reto-01/…", import.meta.url)` or `"../../src/knowledge/reglas.json"`: `mapeo`, `pii`, `plantillas`, `vigencias`, `esquemas`. Any extra depth breaks them at runtime, and `tsc` does not catch that.

**Fix: keep `tests/unit/` flat, using `<módulo>.<rol>.test.ts`:**

| Today | Target | Extraction |
|---|---|---|
| `tests/unit/comparar-mapeo.test.ts` | `tests/unit/comparar-mapeo.policy.test.ts` | — |
| `tests/unit/copias.test.ts` | `tests/unit/package-copy.adapter.test.ts` | Move `describe("supportIndexSchema")` (`:108-end`, self-contained) to `fixtures.schema.test.ts`. `resetPackage` stays, because `escenario()` uses it. |
| `tests/unit/esquemas.test.ts` | `tests/unit/fixtures.schema.test.ts` | — |
| `tests/unit/lector.test.ts` | `tests/unit/fixtures-reader.adapter.test.ts` | — |
| `tests/unit/mapeo.test.ts` | `tests/unit/mapeo.engine.test.ts` | Keep the `leerRuta`/`construirIndiceGlosario` describes, because they share the real-fixture loaders. |
| `tests/unit/normalizar.test.ts` | `tests/unit/normalizar.util.test.ts` | — |
| `tests/unit/pdf-layout.test.ts` | `tests/unit/pdf-layout.util.test.ts` | — |
| `tests/unit/pii.test.ts` | `tests/unit/pii.policy.test.ts` | Keep `presentarCampo`, which shares the mapping fixtures. |
| `tests/unit/plantillas.test.ts` | `tests/unit/motor-plantillas.engine.test.ts` | — |
| `tests/unit/reloj.test.ts` | `tests/unit/clock.adapter.test.ts` | — |
| `tests/unit/salida.test.ts` | `tests/unit/output-files.adapter.test.ts` | — |
| `tests/unit/solicitud.test.ts` | `tests/unit/solicitud.selector.test.ts` | Move `:8-59` (`SOLO_*`, `MATRIZ`, `describe("elegirPlantilla")`, self-contained) to `plantilla-caso.policy.test.ts`. |
| `tests/unit/validar-reglas.test.ts` | `tests/unit/validar-reglas.policy.test.ts` | — |
| `tests/unit/vigencias.test.ts` | `tests/unit/soportes.policy.test.ts` | Move `describe("evaluarVigencia")` (`:60-109`, which needs only `HOY`/`DIAS_AVISO`) to `vigencias.policy.test.ts`. `construirChecklist` stays, because it consumes `evaluarSoportes` output and the shared fixtures. |

Contract, golden and e2e tests stay as they are. They are named after scenarios, not modules.

**New G14 (mirror guard):**

```ts
const PRUEBA_UNITARIA = /^tests\/unit\/([a-z0-9-]+\.[a-z-]+)\.test\.ts$/;

function violacionesDeEspejo(ruta: string, fuentes: readonly string[]): string[] {
  if (!ruta.startsWith("tests/unit/")) return [];
  const modulo = PRUEBA_UNITARIA.exec(ruta)?.[1];
  if (modulo === undefined) return [`${ruta}: la prueba unitaria no nombra un módulo <nombre>.<rol>`];
  return fuentes.some((fuente) => fuente.endsWith(`/${modulo}.ts`))
    ? []
    : [`${ruta}: no existe src/**/${modulo}.ts`];
}

test("G14: cada prueba unitaria es espejo de un módulo de src/", () => {
  const fuentes = listarFuentes();
  expect(listarTodasLasFuentes().flatMap((ruta) => violacionesDeEspejo(ruta, fuentes))).toEqual([]);
});

test("G14: reporta una prueba unitaria sin módulo espejo", () => {
  const fuentes = ["src/domain/engines/mapeo.engine.ts"];
  expect(
    ["tests/unit/mapeo.engine.test.ts", "tests/unit/mapeo.policy.test.ts", "tests/unit/mapeo.test.ts"].flatMap(
      (ruta) => violacionesDeEspejo(ruta, fuentes),
    ),
  ).toEqual([
    "tests/unit/mapeo.policy.test.ts: no existe src/**/mapeo.policy.ts",
    "tests/unit/mapeo.test.ts: la prueba unitaria no nombra un módulo <nombre>.<rol>",
  ]);
});
```

### WR-24: The tax-identifier rule is computed twice, in `solicitud.ts` and in `mapeo.ts`

**Files:** `src/domain/solicitud.ts:34-36`; `src/domain/mapeo.ts:54-56` (`propia`), `:203`, `:207`.

**Issue:** two use cases evaluate the same business rule independently:
- `leer_solicitud` reports the ambiguous generic labels and their `propuesta` through `detectarAmbiguos`. It builds `new Set(reglas.etiquetas_genericas.map(normalizarEtiqueta))` and looks up `Object.hasOwn(porPais, pais) ? (porPais[pais] ?? null) : null`.
- `mapear_campos` builds the same set (`mapeo.ts:207`) and the same lookup through `propia(tributario.por_pais, entrada.pais)` (`:203`).

If one copy changes (for example, normalizing `pais` or adding an alias), the two use cases tell the analyst different things about the same field. Today the copies are identical, so this is a maintainability risk, not a bug.

**Fix:** with the split in WR-21, the rule gets its own policy file. Both sides import it, and `propia` is deleted:

```ts
// src/domain/policies/identificador-tributario.policy.ts
export function etiquetasGenericas(reglas: Reglas): ReadonlySet<string> {
  return new Set(reglas.etiquetas_genericas.map(normalizarEtiqueta));
}

export function identificadorDelPais(reglas: Reglas, pais: string): string | null {
  const porPais = reglas.identificador_tributario.por_pais;
  return Object.hasOwn(porPais, pais) ? (porPais[pais] ?? null) : null;
}
```

`selectors/solicitud.selector.ts` (`detectarAmbiguos`) and `engines/mapeo.engine.ts` (`contextoDeMapeo`) call these functions. Its unit test is `tests/unit/identificador-tributario.policy.test.ts`: move the per-country equivalence cases out of `detectarAmbiguos` so G14 has a mirror.

## Info

### IN-20: Three groups of domain types no longer sit next to their module's name

**Files:** `src/domain/types/mapeo.type.ts:5-11,33` and `src/domain/types/checklist.type.ts:6-24,62`.

**Issue:**
- `HojaMaestro` is defined in `mapeo.type.ts`, but its producer is `maestro.ts` (soon `maestro.selector.ts`), and `maestro.type.ts` already exists.
- `Glosario` and `IndiceGlosario` are defined in `mapeo.type.ts`, but `glosario.ts` (soon `glosario.builder.ts`) produces them. This is left over from the IN-17 split of `mapeo.ts`.
- After WR-21, `SoporteIndice`, `EstadoSoporte`, `SoporteEvaluado` and `EntradaEvaluacionSoportes` would describe `soportes.policy.ts` while living in `checklist.type.ts`.

**Fix:**
- Move `HojaMaestro` to `types/maestro.type.ts`.
- Move `Glosario` and `IndiceGlosario` to a new `types/glosario.type.ts`.
- Move the four soporte types to a new `types/soportes.type.ts`. `checklist.type.ts` then imports `SoporteEvaluado` with `import type`.
- Keep `types/` flat. The tightened G5 pattern in WR-22 enforces this.

### IN-21: Exported names that no longer match their role

**Files:**
- `src/domain/formulario.ts:38` (`construirFilas` returns `Resultado<Formulario>`, not rows).
- `src/domain/pii.ts:67` (`presentarCampo` would be the only builder export that does not start with `construir*`).
- `src/domain/mapeo.ts:224` (`contarEstados`, an aggregate inside the engine).

**Fix:**
- Rename `construirFilas` to `construirFormulario`. It has one importer, `generar-formulario.use-case.ts:16`.
- Optionally rename `presentarCampo` to `construirCampoPresentado` (2 src importers, 1 test) to keep the builders' verb uniform.
- Leave `contarEstados` in the engine. It summarizes the engine's own output, and a selector file for one 8-line function would be speculative.

### IN-22: Test-only exports and a dead branch

**Files:**
- `src/domain/normalizar.ts:17-19` (`aTexto`): its only production caller, `maestro.ts:27`, passes a `number`, so the `string` branch runs only in `tests/unit/normalizar.test.ts:36-37`.
- `src/domain/vigencias.ts:4` (`textoVence`): exported only for `tests/unit/vigencias.test.ts:85`.

**Fix:**
- Replace `aTexto(valor)` with `String(valor)` in `maestro.selector.ts`, delete `aTexto` and its `describe`, and keep the number cases as `leerHoja` assertions.
- Un-export `textoVence`. Assert the plural through `evaluarVigencia("2026-09-05", HOY, DIAS_AVISO).aviso === "vence en 2 días"`.
- `POLITICA_PII` is also consumed only by tests (`tests/unit/pii.test.ts`, `tests/e2e/pii.test.ts`), but it is the policy's public table. Keep it exported.

## Migration order

Each commit must leave `bun run check` (tsc + Biome + audit) and `bun test` green.

Two mechanics matter in every step:
- **Biome's `organizeImports` is on** (`biome.json`). Rewriting a specifier changes the sort order (for example, `@/domain/engines/…` now sorts before `@/domain/maestro…`), so `biome check` fails until you run `bunx biome check --write .`. Run it after every rewrite.
- **Rewrite specifiers with the closing quote included**, so `"@/domain/mapeo.ts"` cannot match `comparar-mapeo` or `types/mapeo.type.ts`. On macOS:
  ```sh
  mkdir -p src/domain/utils && git mv src/domain/fecha.ts src/domain/utils/fecha.util.ts
  grep -rl '"@/domain/fecha\.ts"' src tests demo.ts | xargs sed -i '' 's#"@/domain/fecha\.ts"#"@/domain/utils/fecha.util.ts"#g'
  ```

`tsc` covers `src`, `tests` and `demo.ts` (`tsconfig.json` `include`), so it catches every missed import. It does **not** catch the string paths in `tests/architecture.test.ts` or in `docs/`. Those paths are listed explicitly in the steps below.

1. `test(01): G5 accepts the role folders before any file moves`. Add the `CARPETAS_DE_ROL` patterns, the `tests/unit/<m>.<rol>.test.ts` pattern and the infra area-folder pattern. **Keep** the old `^src/domain/<kebab>\.ts$`, `^src/tools/<kebab>\.(factory|wiring|util)\.ts$` and `^src/demo/<kebab>\.runner\.ts$` patterns for now. Make `DUENOS_DE_REGEX` hold both motor-plantillas paths, and make `capaDeRuta` accept both `src/tools/entorno.wiring` and `src/tools/wiring/entorno.wiring`. Nothing has moved yet, so the suite stays green.
2. `refactor(01): move domain helpers to domain/utils`: `fecha`, `normalizar`, `resultado`, `formatear-issues`, `nombre-error` (WR-21).
3. `refactor(01): move the mapping and template engines to domain/engines`: `mapeo`, `motor-plantillas`. Update `docs/plantillas.md:3` and the CLAUDE.md regex-exception path.
4. `refactor(01): move builders, policies and selectors that need no split`: `borrador`, `formulario`, `portal`, `glosario` → `builders/`; `vigencias`, `comparar-mapeo`, `validar-reglas` → `policies/`; `maestro` → `selectors/`.
5. `refactor(01): split soportes policy out of the checklist builder`. `git mv checklist.ts builders/checklist.builder.ts`, then extract `:25-96` verbatim into `policies/soportes.policy.ts`, and repoint `estado-paquete.service.ts` and `tests/unit/vigencias.test.ts`.
6. `refactor(01): split campo-presentado builder out of the pii policy`. `git mv pii.ts policies/pii.policy.ts`, then extract `:62-78`.
7. `refactor(01): split plantilla-caso policy out of the solicitud selector`. `git mv solicitud.ts selectors/solicitud.selector.ts`, then extract `:13-20`. After this step `src/domain/` has only `types/` and the five role folders.
8. `refactor(01): move tool factories and the composition root into role folders`. Move the three tools files and retarget `architecture.test.ts:717-723` and `:728-731`.
9. `refactor(01): move the demo runner to demo/runners`. Update `demo.ts:1`, `tests/helpers/correr-demo.helper.ts:2`, `tests/e2e/demo.test.ts:11` and `architecture.test.ts:532,646-648,726-731`.
10. `test(01): unit tests mirror their module names`. Do the pure `git mv` of the 14 files from the WR-23 table in this commit, then extract the three describes (`supportIndexSchema`, `elegirPlantilla`, `evaluarVigencia`) into their mirror files in a follow-up commit. The relative `new URL("../../…")` paths stay valid because depth does not change.
11. `test(01): G5, G13 and G14 forbid loose files and require mirrored unit tests`. Delete the transitional patterns and the dual paths from step 1, add G13 and G14 with their bite tests, extend the G5 bite test, and rewrite the CLAUDE.md bullet (WR-22). This is the first commit where a loose file fails.
12. `refactor(01): one tax-identifier policy for solicitud and mapeo` (WR-24), with its mirror test.
13. `refactor(01): types follow their modules, names follow their roles` (IN-20, IN-21, IN-22).

Before step 11, check that `src/domain/*.ts` and `src/tools/*.ts` minus `proveedor.ts` match nothing, so G13 lands green.

Check the output after steps 7, 9 and 13: `bun run demo.ts` must produce a byte-identical `out/` (aside from timestamps in `log.jsonl`), and the e2e determinism test must pass. Every step is a pure move, a verbatim extraction or a rename. The only step that changes behavior is IN-22's removal of `aTexto`, which is equivalent for every input its caller can pass.

---

_Reviewed: 2026-10-13T01:33:48Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
