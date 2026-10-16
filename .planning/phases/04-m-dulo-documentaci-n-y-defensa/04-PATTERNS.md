# Phase 4: Módulo, documentación y defensa - Pattern Map

**Mapped:** 2026-10-15
**Files analyzed:** 27
**Analogs found:** 22 / 27

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `modulo/tools/proveedor.ts` | re-export (library surface) | — | `src/tools/proveedor.ts` | exact |
| `.opencode/tools/proveedor.ts` (D-96) | re-export | — | `src/tools/proveedor.ts` | exact |
| `modulo/agent.md`, `modulo/skill/registro-proveedor/SKILL.md` | generated artifact | file-I/O | (generated; bodies = `agent/prompt.md`, `src/knowledge/registro-proveedor.md`) | n/a |
| `modulo/README.md`, `opencode.json` | doc / config | — | none | no analog |
| `src/domain/builders/modulo.builder.ts` | builder (pure) | transform | `src/domain/builders/cierre-turno.builder.ts` | role-match |
| `src/cli/runners/generar-modulo.runner.ts` | runner (CLI) | file-I/O | `src/demo/runners/ejecutar-demo.runner.ts` + `demo.ts` | exact |
| `src/cli/runners/preflight.runner.ts` | runner (CLI) | request-response / streaming | `src/demo/runners/ejecutar-demo.runner.ts`; SSE parse from `web/src/api/flujo-chat.ts` | role-match |
| `src/cli/schemas/*.schema.ts`, `src/cli/types/*.type.ts` | schema / type | — | `src/http/schemas/*`, `src/demo/types/demo.type.ts` | exact |
| `src/config/constants/modulo.constants.ts`, `costo.constants.ts` | config | — | `src/config/constants/files.constants.ts` | exact |
| `src/config/constants/files.constants.ts` (+ `DIRECTORIO_CONOCIMIENTO`) | config (modify) | — | itself, lines 24-26 | exact |
| `src/config/strings.ts` (+ descripciones, textos preflight) | config (modify) | — | `TEXTO_DEMO` at line 431 | exact |
| `src/config/env.ts` (+ preflight env) | config (modify) | — | existing `parseAgentEnv` / `pinExecutionDate` | exact |
| `tests/architecture.test.ts` | guardian (modify) | — | itself, lines 60-110, 195-245, 464-528 | exact |
| `tests/sin-comentarios.test.ts` | guardian (modify) | — | itself, lines 29-35 | exact |
| `tests/modulo/modulo.test.ts` | test | file-I/O | `tests/contract/instrucciones-agente.test.ts` + `tests/e2e/trazador.test.ts:253-264` | exact |
| `tests/cli/preflight.test.ts` | test | request-response | `tests/helpers/servidor-prueba.helper.ts`, `tests/helpers/llm-falso.helper.ts` | role-match |
| `tests/live/costo-por-caso.test.ts` | live test | request-response | `tests/live/agente-en-vivo.test.ts` | exact |
| `tests/despliegue/contrato-despliegue.test.ts` | test (modify) | — | itself lines 70, 245-257 | exact |
| `tests/despliegue/ci.test.ts` | test | file-I/O (yaml parse) | `tests/despliegue/contrato-despliegue.test.ts` | exact |
| `tests/docs/*.test.ts` | test | file-I/O | `tests/contract/instrucciones-agente.test.ts` | role-match |
| `.github/workflows/ci.yml` | config | batch | none (RESEARCH Pattern 4) | no analog |
| `render.yaml` | config (modify) | — | itself (`autoDeploy: true` → `autoDeployTrigger: checksPass`) | exact |
| `package.json` | config (modify) | — | itself (`check`, `audit`, `test:vivo`) | exact |
| `README.md`, `SOLUCION.md`, `docs/evidencia/costo-por-caso.json` | doc / evidence | — | `docs/*.md` (existing) | partial |
| `.claude/CLAUDE.md`, `docs/estructura.md` | doc (modify, D-62) | — | existing layer rules | exact |
| `.qa/suites/04.suite.json` (Render browser §11) | QA suite | — | `.qa/suites/03.suite.json` | exact |

## Pattern Assignments

### `modulo/tools/proveedor.ts` and `.opencode/tools/proveedor.ts`

**Analog:** `src/tools/proveedor.ts` (whole file, 4 lines)
```typescript
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

export const { leer_solicitud, mapear_campos, generar_formulario, armar_paquete, simular_envio } =
  crearHerramientas();
```
New file must be a pure re-export so identity holds (`===`, D-81):
`export { armar_paquete, generar_formulario, leer_solicitud, mapear_campos, simular_envio } from "@/tools/proveedor.ts";`
`.opencode/tools/proveedor.ts` re-exports from `modulo/tools/proveedor.ts`. Alias only, never `../`. No comments. Note tsconfig `include` is `["src","tests","demo.ts"]` — add `modulo` and `.opencode` (RESEARCH Pattern 3) so they get type-checked.

### `src/cli/runners/generar-modulo.runner.ts` / `preflight.runner.ts` (runner, file-I/O / HTTP)

**Analog:** `src/demo/runners/ejecutar-demo.runner.ts` (lines 1-40) + `demo.ts`
Imports convention (constants, env, strings, types via alias):
```typescript
import { rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { FECHA_DEMO, GRUPOS_MAPEO, SESION_DEMO } from "@/config/constants/demo.constants.ts";
import { ARCHIVO_PROYECTO, OUT_DIR } from "@/config/constants/files.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { TEXTO_CHECKLIST, TEXTO_COMUN, TEXTO_DEMO } from "@/config/strings.ts";
import type { OpcionesDemo, ResultadoDemo } from "@/demo/types/demo.type.ts";
```
Entry pattern (`demo.ts`): injectable `escribir`, returns `{ fallido }`, sets `process.exitCode`:
```typescript
const resultado = await ejecutarDemo({ directorio: import.meta.dir, escribir: console.log });
if (resultado.fallido) process.exitCode = 1;
```
For cli runners: export pure testable functions (`archivosDelModulo(raiz)`, preflight steps) and put the CLI under `if (import.meta.main)`. Local types (`type Registro = …`) stay non-exported inside the runner; exported types go to `src/cli/types/*.type.ts`.
Guardian G-shell (`API_SHELL`, architecture.test.ts:60) forbids `Bun.spawn`/`Bun.$`/`child_process` in `src/` — preflight uses `fetch` only. SSE parsing: reuse `eventsource-parser/stream` the way `web/src/api/flujo-chat.ts:4` does.

### `src/domain/builders/modulo.builder.ts` (builder, transform, pure)

**Analog:** `src/domain/builders/cierre-turno.builder.ts` lines 1-20 — imports only config-pure + domain types, small pure functions, texts from `@/config/strings.ts`:
```typescript
import { DESENLACE_ENVIO, FINES_DE_ORACION } from "@/config/constants/confirmation.constants.ts";
import { TEXTO_CIERRE, TEXTO_CONFIRMACION } from "@/config/strings.ts";
import type { CasoPendiente, DesenlaceEnvio } from "@/domain/types/compuerta.type.ts";
```
Domain may import only `domain` + `config-pure` (PERMITIDOS, architecture.test.ts:81) — no `node:`, no zod, no `Bun.YAML`. Byte rule: frontmatter + raw body bytes; do NOT reuse `createInstructionsLoader` (it `.trim()`s).

### `src/config/constants/modulo.constants.ts`, `costo.constants.ts`, `files.constants.ts`

**Analog:** `src/config/constants/files.constants.ts:24-26`
```typescript
export const DIRECTORIO_AGENTE = "agent";
export const ARCHIVO_PROMPT = "prompt.md";
export const ARCHIVO_CONOCIMIENTO_PROCESO = "registro-proveedor.md";
```
Add `DIRECTORIO_CONOCIMIENTO` (today tests use literal `"src","knowledge"`). Codes as `as const` objects, never `enum`. No zod/`node:` in config-pure.

### `src/config/strings.ts` (modify)

**Analog:** `TEXTO_DEMO` (line 431):
```typescript
export const TEXTO_DEMO = {
  fechaEfectiva: (fecha: string): string => `Fecha de ejecución efectiva: ${fecha}`,
  encabezadoCaso: (caso: string): string => `== ${caso} ==`,
```
Add `TEXTO_MODULO` (agent/skill `description`) and `TEXTO_PREFLIGHT` (report lines, §11 messages). The §11 message literal already exists in `tests/live/agente-en-vivo.test.ts` as `MENSAJE_PRD_11` — move it to strings if shared.

### `tests/architecture.test.ts` (guardian, modify per D-62)

Edit points:
- `PERMITIDOS` (lines 81-110): add `cli: [...]` (pattern `DESTINOS_DE_DEMO = ["demo","proveedor","config-pure","config-env","node"]` line 76 — cli likely `["cli","domain","config-pure","config-env","node","zod"]`) and a `modulo` origin allowing only `proveedor`. Update layer detection near line 294 (`if (base === "demo") return "raiz-demo";`).
- `CARPETAS_DE_ROL` (203-223): add `"cli/runners": "runner"`.
- `NOMBRES_CON_ROL` (227-243): add `cli` to the `types/` (line 233) and `schemas/` (line 235) alternations; add `/^modulo\/tools\/proveedor\.ts$/` and `/^\.opencode\/tools\/proveedor\.ts$/`.
- `listarFuentes` (464-468) and `listarTodasLasFuentes` (522-528): add `modulo/**/*.ts` (+ `.opencode/**/*.ts`):
```typescript
function listarTodasLasFuentes(): string[] {
  const rutas = ["src", "tests"]
    .filter((carpeta) => existsSync(join(RAIZ, carpeta)))
    .flatMap((carpeta) => [...new Bun.Glob(`${carpeta}/**/*.ts`).scanSync({ cwd: RAIZ })]);
  if (existsSync(join(RAIZ, "demo.ts"))) rutas.push("demo.ts");
```
- Add violation-proof tests mirroring line ~799 (`expect(violacionesDeCapas("src/demo/runners/ejecutar-demo.runner.ts", permitido)).toEqual([])`).
- Existing `violacionesDeHerramientas` / `contratoIncompleto` (lines ~485-512) can be applied to the `modulo/` module.

### `tests/sin-comentarios.test.ts` (modify)

Lines 29-35 `listarFuentes` — add `"modulo"` (and `.opencode`) to the scanned folder list:
```typescript
const rutas = ["src", "tests"]
  .filter((carpeta) => existsSync(join(RAIZ, carpeta)))
  .flatMap((carpeta) => escanear(`${carpeta}/**/*.ts`));
```
Plus an assertion that the scan includes `modulo/tools/proveedor.ts` (like line 57-60 does for web).

### `tests/modulo/modulo.test.ts` (test)

**Analog A:** `tests/contract/instrucciones-agente.test.ts` lines 1-32 — reading prompt/knowledge via constants:
```typescript
import { ARCHIVO_CONOCIMIENTO_PROCESO, ARCHIVO_PROMPT, DIRECTORIO_AGENTE } from "@/config/constants/files.constants.ts";
const RAIZ_REPO = join(import.meta.dir, "..", "..");
const RUTA_PROMPT = join(RAIZ_REPO, DIRECTORIO_AGENTE, ARCHIVO_PROMPT);
const RUTA_CONOCIMIENTO = join(RAIZ_REPO, "src", "knowledge", ARCHIVO_CONOCIMIENTO_PROCESO);
const prompt = await readFile(RUTA_PROMPT, "utf8");
```
(replace the `"src","knowledge"` literal with the new constant). For byte equality compare `Uint8Array`/`Buffer` (`readFile` without encoding) against `archivosDelModulo(raiz)`.

**Analog B (import sin env):** `tests/e2e/trazador.test.ts:253-264`:
```typescript
const proceso = Bun.spawn(
  [process.execPath, "-e", 'const m = await import("@/tools/proveedor.ts"); console.log(Object.keys(m).join(","));'],
  { cwd: RAIZ_REPO, env: {}, stdout: "pipe", stderr: "pipe" },
);
const salida = await new Response(proceso.stdout).text();
expect(await proceso.exited).toBe(0);
expect(salida.trim()).toBe("armar_paquete,generar_formulario,leer_solicitud,mapear_campos,simular_envio");
```
Point to `modulo/tools/proveedor.ts`. Identity: `import * as app from "@/tools/proveedor.ts"` vs modulo, `expect(m[k]).toBe(app[k])`. Drift-bites test: builder with a modified prompt must differ from committed file.

### `tests/live/costo-por-caso.test.ts` (live, opt-in)

**Analog:** `tests/live/agente-en-vivo.test.ts` (lines 1-60): uses `crearAgente` from `@/loop/wiring/agente.wiring.ts`, `parseAgentEnv`, `pinExecutionDate`, `crearProyectoTemporal`, `usos(...)` from `@tests/helpers/eventos.helper.ts`, `TIMEOUT_MS = 300_000`, constants `PRESUPUESTO_SESION`, `MAX_TOKENS_SALIDA`. Gate behind its own flag (e.g. `COSTO_EN_VIVO=1`) like `test:vivo` (`LLM_EN_VIVO=1 bun test tests/live`) so `test:vivo` doesn't run it unintentionally; write `docs/evidencia/costo-por-caso.json` (D-98) after `sensiblesDelProyecto` PII check (`@tests/helpers/pii.helper.ts`). Prices from `costo.constants.ts`.

### `tests/despliegue/contrato-despliegue.test.ts` (modify) and `tests/despliegue/ci.test.ts` (new)

Change schema line 70 `autoDeploy: z.boolean()` → `autoDeployTrigger: z.literal("checksPass")` (or string) and lines 245-257:
```typescript
expect(servicio).toMatchObject({
  type: "web", name: "registro-proveedor", runtime: "docker", plan: "free",
  dockerfilePath: "./Dockerfile", healthCheckPath: RUTA_API.SALUD,
  autoDeploy: true,
});
```
→ `autoDeployTrigger: "checksPass"` and assert `autoDeploy` absent. `ci.test.ts` copies this file's structure: `RAIZ = join(import.meta.dir, "..", "..")`, `readFileSync`, zod schema of the parsed YAML (`Bun.YAML.parse`), module-level constants for expected values (action SHAs, steps `bun run demo.ts`, `build:web`, audit job with `continue-on-error`, no `container:`).

### `package.json` (modify)

Current `check` includes audit: `"check": "tsc --noEmit && tsc --noEmit -p web/tsconfig.json && biome check . && bun audit --audit-level=moderate"`. Split: `check` without audit; keep `audit`. Add `modulo`, `preflight`, `costo` scripts following `"demo": "bun run demo.ts"` / `"test:vivo": "LLM_EN_VIVO=1 bun test tests/live"`.

### `.qa/suites/04.suite.json` (eli-qa §11 on Render, D-95)

**Analog:** `.qa/suites/03.suite.json` — keys `phase, generated_at, group, setup, tests, last_run, last_rerun`; `setup` documents base_url / access code. Phase 4 targets public URL `https://registro-proveedor-bfnt.onrender.com` with code from env (never committed), Playwright browser recipe with screenshots as evidence.

## Shared Patterns

- **Alias imports only** (`@/`, `@tests/`), never `../` (G1). Applies to all new `.ts`, including `modulo/` and `.opencode/`.
- **No comments** (sin-comentarios guardian) in all `.ts`; explanations in README/SOLUCION/`modulo/README.md`.
- **Text in `src/config/strings.ts`; constants in `src/config/constants/*.constants.ts`; regex only in `patterns.constants.ts`.**
- **Env only via `src/config/env.ts`** (preflight URL/code); importable from cli only after adding cli to its allowed importers in CLAUDE.md + guardian.
- **Exported schemas** `satisfies z.ZodType<T>` (G16); `z.enum` from constants (G15).
- **Test root resolution:** `const RAIZ = join(import.meta.dir, "..", "..")`.
- **D-62:** any new layer/rule updates `.claude/CLAUDE.md`, `docs/estructura.md` and the guardian (with a violation-proof test) in the same task.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `.github/workflows/ci.yml` | CI config | No workflows exist; use RESEARCH Pattern 4 (ubuntu-24.04, SHA-pinned checkout v7.0.1 + setup-bun v2.2.0, no `container:` because root breaks chmod tests). |
| `opencode.json` | host config | Use RESEARCH Pattern 2 (agent `prompt: "{file:…}"`, `skills: [paths]`). |
| `modulo/README.md`, `README.md`, `SOLUCION.md` | docs | Follow D-84..D-88 and PRD §9.1 order. |
| `modulo/agent.md`, `SKILL.md` | generated | Output of generator; frontmatter per RESEARCH Pattern 1. |
| `docs/evidencia/costo-por-caso.json` | evidence | Written by live cost test. |

## Metadata

**Analog search scope:** `src/`, `tests/`, `demo.ts`, `package.json`, `render.yaml`, `.qa/suites/`
**Files scanned:** ~20
**Pattern extraction date:** 2026-10-15
