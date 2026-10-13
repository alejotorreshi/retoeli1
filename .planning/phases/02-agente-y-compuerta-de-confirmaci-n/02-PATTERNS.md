# Phase 2: Agente y compuerta de confirmación - Pattern Map

**Mapped:** 2026-10-13
**Files analyzed:** 52 (new + modified, from RESEARCH.md "Recommended Project Structure" and the Validation test map)
**Analogs found:** 45 / 52

All analog paths below are git-tracked Phase 1 sources (verified with `git ls-files`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/config/constants/llm.constants.ts` | config (codes) | — | `src/config/constants/errors.constants.ts` | exact |
| `src/config/constants/agent.constants.ts` | config (codes, caps) | — | `src/config/constants/errors.constants.ts`, `limits.constants.ts` | exact |
| `src/config/constants/confirmacion.constants.ts` | config (word lists) | — | `src/config/constants/pii.constants.ts` (`TIPO_MASCARA` + table) | exact |
| `src/config/constants/patterns.constants.ts` (mod) | config (regex) | — | itself (lines 1-20) | exact |
| `src/config/env.ts` (mod: `readAgentEnv`) | config-env | transform | itself: `toolEnvSchema`/`parseToolEnv`/`readToolEnv` | exact |
| `src/config/strings.ts` (mod) | config (text) | — | itself: `MENSAJE_ERROR`, `TEXTO_ERROR` | exact |
| `src/domain/policies/confirmacion.policy.ts` | policy | transform (pure) | `src/domain/policies/pii.policy.ts` + `domain/utils/normalizar.util.ts` | exact |
| `src/domain/policies/compuerta.policy.ts` | policy | state transition (pure) | `src/domain/policies/paquete-vigente.policy.ts` | role-match |
| `src/domain/policies/redaccion.policy.ts` | policy | transform | `src/domain/policies/pii.policy.ts` | exact |
| `src/domain/builders/cierre-turno.builder.ts` | builder | transform | `src/domain/builders/borrador.builder.ts` | exact |
| `src/domain/types/{confirmacion,compuerta,redaccion}.type.ts` | type | — | `src/domain/types/pii.type.ts`, `resultado.type.ts` | exact |
| `src/llm/types/llm.type.ts` | port type | request-response | `src/application/types/puertos.type.ts`, `src/domain/types/resultado.type.ts` | role-match |
| `src/llm/types/provider-config.type.ts` | type | — | `src/tools/types/entorno.type.ts` | role-match |
| `src/llm/adapters/openai-compatible.adapter.ts` | adapter | request-response (HTTP) | `src/infra/knowledge/rules-loader.adapter.ts` (read → zod → Resultado) | partial |
| `src/llm/mappers/wire-messages.mapper.ts` | mapper | transform | `src/domain/builders/campo-presentado.builder.ts` | partial |
| `src/llm/mappers/provider-error.mapper.ts` | mapper | transform | `src/domain/utils/resultado.util.ts` (`fallo`/`mensajeDe`) | partial |
| `src/llm/schemas/chat-completion.schema.ts` | schema | validation | `src/infra/fixtures/schemas/fixtures.schema.ts` | exact |
| `src/llm/decorators/{timeout,retry,fallback}.decorator.ts` | decorator | request-response | `definirHerramienta` wrapping (`ejecutarProtegido`) | partial |
| `src/loop/types/{evento,sesion,turno,registro,bitacora}.type.ts` | type | — | `src/application/types/puertos.type.ts` | exact |
| `src/loop/schemas/resultado-herramienta.schema.ts` | schema | validation | `src/infra/fixtures/schemas/fixtures.schema.ts` | exact |
| `src/loop/services/ejecutar-turno.service.ts` | service | streaming (async generator) | `src/demo/runners/ejecutar-demo.runner.ts` (sequential tool orchestration) | partial |
| `src/loop/services/registro-herramientas.service.ts` | service | transform | `src/tools/factories/herramientas.factory.ts` + `definir-herramienta.factory.ts` | role-match |
| `src/loop/services/despacho-llamada.service.ts` | service | request-response | `definir-herramienta.factory.ts` (`resolverArgs`/`responderFallo`) | role-match |
| `src/loop/services/mensajes-sistema.service.ts` | service | transform | `src/application/services/contexto-caso.service.ts` | role-match |
| `src/loop/services/presupuesto.service.ts` | service | transform | `src/application/services/estado-paquete.service.ts` | role-match |
| `src/loop/wiring/agente.wiring.ts` | wiring (composition root) | config | `src/tools/wiring/entorno.wiring.ts` | exact |
| `src/infra/sessions/memory-session-store.adapter.ts` | adapter | CRUD (in-memory) | `src/infra/output/case-lock.adapter.ts` (in-memory map + lock) | role-match |
| `src/infra/logging/logger.adapter.ts` | adapter | event (log) | `src/infra/logging/audit-log.adapter.ts` | exact |
| `src/infra/knowledge/instructions-loader.adapter.ts` | adapter | file-I/O | `src/infra/knowledge/rules-loader.adapter.ts` | exact |
| `src/config/constants/errors.constants.ts` (mod) | config | — | itself | exact |
| `agent/prompt.md` | knowledge (md) | — | `src/knowledge/plantillas/*.md` (format only) | partial |
| `src/knowledge/registro-proveedor.md` | knowledge (md) | — | `src/knowledge/plantillas/checklist.md` | partial |
| `tests/architecture.test.ts` (mod) | test (guardian) | — | itself (lines 25-75, 140-215) | exact |
| `.claude/CLAUDE.md`, `docs/estructura.md` (mod, D-62) | docs | — | themselves | exact |
| `tests/unit/{confirmacion,compuerta,redaccion}.policy.test.ts` | test unit | — | `tests/unit/pii.policy.test.ts` | exact |
| `tests/unit/cierre-turno.builder.test.ts` | test unit | — | `tests/unit/borrador.builder.test.ts` | exact |
| `tests/unit/openai-compatible.adapter.test.ts`, `memory-session-store.adapter.test.ts` | test unit | — | `tests/unit/clock.adapter.test.ts`, `output-files.adapter.test.ts` | exact |
| `tests/unit/{timeout,retry,fallback}.decorator.test.ts` | test unit | — | `tests/unit/clock.adapter.test.ts` | role-match |
| `tests/helpers/llm-falso.helper.ts` (+ `types/llm-falso.type.ts`) | test helper | — | `tests/helpers/flujo.helper.ts` + `types/flujo.type.ts` | role-match |
| `tests/helpers/historial.helper.ts` (+ type) | test helper | — | `tests/helpers/instantanea.helper.ts`; `sensibles` logic from `tests/e2e/pii.test.ts` | role-match |
| `tests/loop/*.test.ts` (compuerta, tope, presupuesto, resiliencia, instrucciones, pii-modelo, sesion, bitacora, inyeccion) | test loop | — | `tests/contract/simular-envio.test.ts`, `tests/e2e/pii.test.ts` | role-match |
| `tests/fixtures/casos/zz-inyeccion/*.json` | fixture | — | `tests/fixtures/casos/zz-generica-ec/*` | exact |
| `tests/live/agente-en-vivo.test.ts` | test (opt-in) | — | none | no analog |

## Pattern Assignments

### Constants families (`llm`, `agent`, `confirmacion`, errors additions)

**Analog:** `src/config/constants/errors.constants.ts` lines 1-22

```typescript
export const CODIGO_ERROR = {
  CASO_NO_ENCONTRADO: "CASO_NO_ENCONTRADO",
  ...
  CONFIRMACION_REQUERIDA: "CONFIRMACION_REQUERIDA",
} as const;

export const CODIGOS_CON_DETALLE: ReadonlySet<string> = new Set([
  CODIGO_ERROR.ARGS_INVALIDOS,
  ...
]);
```
- Every family is `as const` (never `enum`), its type is `ValorDe<typeof X>` in a `types/*.type.ts` (see `src/domain/types/pii.type.ts` line 5: `export type TipoMascara = ValorDe<typeof TIPO_MASCARA>;`).
- Register every new family in `FAMILIAS_DE_CODIGOS` (`tests/architecture.test.ts` ~line 73).
- No imports of zod/node/Bun here (G10, `IMPURO_EN_CONFIG`). Pure constants only; numeric defaults (iterations 25, tokens 300000, TTL 2h, timeouts) live here and env.ts uses them as `.default(...)`.
- Word lists for D-39 follow `pii.constants.ts` table style (`RUTAS_POR_MASCARA` = readonly tuple array).

### `src/config/constants/patterns.constants.ts` (modify)

**Analog:** itself, lines 3-20. One `export const PATRON_X: RegExp = ...;` per line, typed `RegExp`. Add `PATRON_PREGUNTA`, `PATRON_SLUG_EN_TEXTO`, `PATRON_NO_PALABRA`, markdown-strip patterns (D-60: `**`/`__`, leading `#`, table `|`), redaction patterns. Reuse `PATRON_DIACRITICOS` (line 17) for classifier normalization.

### `src/config/env.ts` (modify: `readAgentEnv`)

**Analog:** itself, lines 1-50

```typescript
function emptyAsUndefined(valor: unknown): unknown {
  return valor === "" ? undefined : valor;
}

const toolEnvSchema = z.object({
  TZ_NEGOCIO: z.preprocess(
    emptyAsUndefined,
    z.string().refine(isTimeZone, TEXTO_ENV.zonaHorariaInvalida).default(ZONA_HORARIA_POR_DEFECTO),
  ),
});

export type ToolEnv = z.output<typeof toolEnvSchema>;
type EnvSource = Readonly<Record<string, string | undefined>>;

function parseToolEnv(source: EnvSource) {
  return toolEnvSchema.safeParse(source, { error: z.locales.es().localeError });
}

export function readToolEnv() {
  return parseToolEnv(process.env);
}
```
- Add `agentEnvSchema` (LLM_*, LLM_FALLBACK_*, `DEEPSEEK_API_KEY` alias, caps, TTL) with the same `preprocess(emptyAsUndefined, ...)`, an exported `parseAgentEnv(source: EnvSource)` for tests, and `readAgentEnv()` reading `process.env`. English identifiers. `AgentEnv` type may live next to schema (same exception as `ToolEnv`, confirm in CLAUDE.md edit). Error texts go to `TEXTO_ENV` in strings.ts.

### `src/config/strings.ts` (modify)

**Analog:** itself, lines 8-35

```typescript
function nombreVisible(herramienta: ValorDe<typeof HERRAMIENTA>): string {
  return `${PREFIJO_HERRAMIENTA}${herramienta}`;
}

export const MENSAJE_ERROR = {
  [CODIGO_ERROR.CONFIRMACION_REQUERIDA]: "requiere confirmación explícita",
  ...
} as const satisfies Record<ValorDe<typeof CODIGO_ERROR>, string>;

export const TEXTO_ERROR = {
  conDetalle: (mensaje: string, detalle: string): string => `${mensaje} Detalle: ${detalle}`,
} as const;
```
- New blocks `MENSAJE_AGENTE` (keyed by `CODIGO_AGENTE`/`TIPO_ERROR_LLM`, `satisfies Record<...>` for exhaustiveness; 402 = "saldo agotado"), `TEXTO_CONFIRMACION`, `TEXTO_CIERRE`, `TEXTO_SESION` ("La sesión anterior expiró; empezamos de cero"), `TEXTO_CONTEXTO`. Parametrized texts are arrow functions as in `TEXTO_ERROR`. Reuse `TEXTO_SOPORTE.nombre` for blocking-support names (RESEARCH Pattern 8). Tool names via `nombreVisible(HERRAMIENTA.X)`, never literal `proveedor_...` (G12).

### `src/domain/policies/confirmacion.policy.ts`, `redaccion.policy.ts`

**Analog:** `src/domain/policies/pii.policy.ts` lines 1-40

```typescript
import { PATRON_ESPACIOS } from "@/config/constants/patterns.constants.ts";
import { LARGO_VISIBLE, RUTAS_POR_MASCARA, TIPO_MASCARA } from "@/config/constants/pii.constants.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";
import type { TipoMascara } from "@/domain/types/pii.type.ts";

export const POLITICA_PII: ReadonlyMap<string, TipoMascara> = politica(RUTAS_POR_MASCARA);

function ultimos4(valor: string): string { ... }
```
- Imports only `config-pure` + `domain` (PERMITIDOS.domain). Small private functions, one exported entry (`clasificarConfirmacion(texto, pendientes)`, `redactar(valor)`). Normalization mirrors `normalizarEtiqueta` in `src/domain/utils/normalizar.util.ts` (NFD + `PATRON_DIACRITICOS` + lowercase + trim). Return codes are `DECISION_CONFIRMACION.X` objects, never literals.

### `src/domain/policies/compuerta.policy.ts`

**Analog:** `src/domain/policies/paquete-vigente.policy.ts` (pure decision over typed state). Pure transitions `(estado, evento) → estado` using `ESTADO_COMPUERTA`/`ACCION` objects; no I/O; grant consumed at end of turn (D-38), revoked on re-arm (D-42), FALTA_CASO carry (D-63.3).

### `src/domain/builders/cierre-turno.builder.ts`

**Analog:** `src/domain/builders/borrador.builder.ts` lines 1-30

```typescript
import { TEXTO_BORRADOR, TEXTO_COMUN, TEXTO_SOPORTE } from "@/config/strings.ts";
import type { Checklist } from "@/domain/types/checklist.type.ts";

function asuntoRespuesta(solicitud: Solicitud): string {
  return `${TEXTO_BORRADOR.prefijoRespuesta}${solicitud.asunto}`;
}
```
- All text from `strings.ts`; builder only assembles. Exports the deterministic question (D-44) and the "Completé/Falta" fallback (D-53).

### `src/llm/types/llm.type.ts`, `src/loop/types/*.type.ts`

**Analog:** `src/domain/types/resultado.type.ts` (whole file) + `src/tools/types/herramienta.type.ts`

```typescript
export type Exito<D> = { readonly ok: true; readonly data: D };
export type Fallo = { readonly ok: false; readonly codigo: CodigoError; readonly error: string; readonly parcial?: Parcial };
export type Resultado<D> = Exito<D> | Fallo;
```
- Only `type` + `import type`; `readonly` fields. The LLM port returns a result union (`ResultadoEnvio`) and never throws; its error side is keyed by `TIPO_ERROR_LLM` (a separate union, not `CodigoError`). Events are a discriminated union on `tipo: ValorDe<typeof TIPO_EVENTO>`.

### `src/llm/schemas/chat-completion.schema.ts`, `src/loop/schemas/resultado-herramienta.schema.ts`

**Analog:** `src/infra/fixtures/schemas/fixtures.schema.ts` (zod schemas exported in English, consumed with `safeParse(x, { error: z.locales.es().localeError })`). Lenient on unknown keys for provider responses; check against port types with `satisfies z.ZodType<T>` where a type exists.

### `src/llm/adapters/openai-compatible.adapter.ts`

**Analog:** `src/infra/knowledge/rules-loader.adapter.ts` lines 17-36

```typescript
export async function loadRules(directorio: string): Promise<Resultado<Reglas>> {
  const contenido = await readText(join(directorio, ARCHIVO_REGLAS));
  if (contenido === null) return reglasInvalidas(TEXTO_CONOCIMIENTO.archivoNoLegible);
  const json = parseJson(contenido);
  if (!json.ok) return reglasInvalidas(TEXTO_CONOCIMIENTO.jsonInvalido);
  const validado = rulesSchema.safeParse(json.valor, { error: z.locales.es().localeError });
  if (!validado.success) return reglasInvalidas(detalleDe(validado.error.issues));
  return validarTextosDeReglas(validado.data);
}
```
- Same ladder: `fetch` (injected) → status check → `json` parse → zod schema → normalized neutral response. Each failure early-returns a typed error through `provider-error.mapper.ts`. English export name `createOpenAICompatibleAdapter(slot, { fetch })`. Never include the key or raw body in errors (Pitfall 1). Capability flags from slot config, no provider branches (D-59).

### `src/llm/decorators/*.decorator.ts`

**Analog:** `definir-herramienta.factory.ts` lines 82-95 (wrap and convert failure into a result)

```typescript
async function ejecutarProtegido<A extends z.ZodRawShape, D>(...): Promise<Resultado<D>> {
  try {
    return await interna.spec.ejecutar(datos, entorno);
  } catch (error) {
    registrarErrorInterno(interna.nombreVisible, error);
    return fallo(CODIGO_ERROR.ERROR_INTERNO);
  }
}
```
- Each decorator takes an `AdaptadorLlm` and returns an `AdaptadorLlm`; retry/fallback only on transient `TIPO_ERROR_LLM` kinds (D-52). Inject sleep/random for deterministic tests.

### `src/loop/services/registro-herramientas.service.ts`

**Analogs:** `src/tools/factories/definir-herramienta.factory.ts` lines 59-61 and 172-176; `src/config/constants/tools.constants.ts`

```typescript
function esquemaDeArgs<A extends z.ZodRawShape>(args: A) {
  return z.object(args).strict();
}
...
nombreVisible: `${PREFIJO_HERRAMIENTA}${spec.nombre}`,
```
- Iterate the exports of `@/tools/proveedor.ts`, name = `PREFIJO_HERRAMIENTA + export`, `parameters = z.toJSONSchema(z.object(args).strict(), { io: "input", target: "draft-07" })` minus `$schema` (RESEARCH Pattern 5, Pitfall 3).

### `src/loop/services/despacho-llamada.service.ts`

**Analog:** `definir-herramienta.factory.ts` lines 63-80 (`responderFallo`) and 97-110 (`resolverArgs`)

```typescript
function responderFallo(nombre: string, resultado: Fallo): Respuesta {
  const resumen = RESUMEN_HERRAMIENTA.fallo(nombre, resultado.codigo);
  const base = { ok: false, error: resultado.error, codigo: resultado.codigo };
  ...
  return { texto: JSON.stringify(cuerpo), resumen };
}
```
- Blocked `simular_envio`: return `JSON.stringify({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA, error: MENSAJE_ERROR[CODIGO_ERROR.CONFIRMACION_REQUERIDA], resumen })` without executing, and write CA4 via the `Registrar` from `createAuditLog` (Pitfall 10). With grant: force `confirmado: true` and check `args.caso`. `JSON.parse` of model args in try/catch → `ARGS_INVALIDOS` shape.

### `src/loop/services/ejecutar-turno.service.ts`

**Analog (partial):** `src/demo/runners/ejecutar-demo.runner.ts` lines 1-30 (imports the five tools from `@/tools/proveedor.ts`, runs them sequentially, parses JSON results via local `Registro`/`Exitosa` types). New shape is `async function* ejecutarTurno(...)` yielding typed events; no analog for the generator itself (use RESEARCH System Architecture + Patterns 6-12). Must not import infra or env (loop PERMITIDOS).

### `src/loop/wiring/agente.wiring.ts`

**Analog:** `src/tools/wiring/entorno.wiring.ts` lines 79-85 and 141-160

```typescript
function relojDe(config: ToolEnv): Reloj {
  return config.FECHA_EJECUCION === undefined
    ? systemClock(config.TZ_NEGOCIO)
    : fixedClock(config.FECHA_EJECUCION);
}

export function crearEntorno(contexto: ContextoNormalizado, opciones: OpcionesEntorno = {}): EntornoEjecucion {
  const raiz = resolveRoot(contexto.directorio);
  const config = readToolEnv();
  if (!config.success) {
    return { registrar: ..., entorno: fallo(CODIGO_ERROR.CONFIGURACION_INVALIDA, { detalle: formatearIssues(config.error.issues, MAX_ISSUES_ARGS) }) };
  }
  ...
}
```
- Single place reading `readAgentEnv()`, building adapter + decorators (primary/fallback slots), session store, pino logger, instructions loader, and returning the turn runner. Invalid config → `CONFIGURACION_INVALIDA` result, never throw. Needs its own layer `"wiring-agente"` in `capaDeRuta` (copy the `entorno.wiring` special case, architecture.test.ts line ~200).

### `src/infra/knowledge/instructions-loader.adapter.ts`

**Analog:** `src/infra/knowledge/rules-loader.adapter.ts` line 16 + lines 31-33

```typescript
export const DEFAULT_KNOWLEDGE_DIRECTORY = fileURLToPath(new URL("../../knowledge/", import.meta.url));
...
const contenido = await readText(join(directorio, ARCHIVO_REGLAS));
if (contenido === null) return reglasInvalidas(TEXTO_CONOCIMIENTO.archivoNoLegible);
```
- Read `agent/prompt.md` (resolve `new URL("../../../agent/", import.meta.url)`) and `src/knowledge/registro-proveedor.md` every turn with `readText` from `@/infra/fs/fs.util.ts`; missing/empty (`PATRON_TEXTO_NO_VACIO`) or over limit → `Resultado` failure. File names in `files.constants.ts`. Accept directory overrides (as `OpcionesEntorno.directorioConocimiento`) for the AGT-02 hot-edit test.

### `src/infra/logging/logger.adapter.ts`

**Analog:** `src/infra/logging/audit-log.adapter.ts` lines 19-44 (factory `createAuditLog(raiz, reloj)` returning a closure; failures swallowed with `console.error(TEXTO_INFRA.errorDeBitacora(...))`). Pino: `pino({ redact: {...} })` without `transport`, child loggers per session/turn/toolCall, values passed through `redactar()`.

### `src/infra/sessions/memory-session-store.adapter.ts`

**Analog:** `src/infra/output/case-lock.adapter.ts` (module-scoped `Map` with per-key serialization). English export `createMemorySessionStore({ ttlMs, maxSessions, clock })`; TTL by inactivity, LRU eviction, per-session lock; implements port type from `src/loop/types/sesion.type.ts`. Inject time (use `Reloj.instanteReal` or a `now()` function) for tests.

### `agent/prompt.md`, `src/knowledge/registro-proveedor.md`

**Analog (format only):** `src/knowledge/plantillas/checklist.md`. Self-contained markdown, no server placeholders (Phase 4 copies them into `modulo/`). Tool names written as `proveedor_<export>`. Content per D-43..D-48, D-55, D-56.

### `tests/architecture.test.ts` (modify)

**Analog:** itself, lines 29-55 and 142-205

```typescript
const PAQUETES_CON_CAPA = new Set(["zod", "exceljs", "pdf-lib"]);
const PERMITIDOS: Readonly<Record<string, readonly string[]>> = {
  domain: ["domain", "config-pure"],
  infra: ["domain", "application", "config-pure", "config-env", "infra", "node", "zod", "exceljs", "pdf-lib"],
  wiring: [...DESTINOS_DE_HERRAMIENTAS, "infra"],
  ...
};
const CARPETAS_DE_ROL = { "tools/wiring": "wiring", "demo/runners": "runner", ... };
const CAPAS_FUTURAS = /^src\/(?:server[^/]*|http|loop|llm)(?:\/|$)/;
const capa = /^src\/(domain|application|infra|tools|demo)\//.exec(base)?.[1];
```
- Apply the exact list in RESEARCH lines 297-304 (add `llm`, `loop`, `wiring-agente`; `pino`; role folders `llm/adapters|decorators|mappers`, `loop/services|wiring`; extend `types/`/`schemas/` regexes; `decorator|mapper` in `ROLES_DE_PRUEBA`; new families in `FAMILIAS_DE_CODIGOS`; `LECTORES_DE_ENTORNO` unchanged since only env.ts reads env). Each new rule gets a violation test. Same task edits `.claude/CLAUDE.md` and `docs/estructura.md` (D-62).

### Unit tests (`tests/unit/*.policy|builder|adapter|decorator.test.ts`)

**Analog:** `tests/unit/pii.policy.test.ts` lines 1-12

```typescript
import { describe, expect, test } from "bun:test";
import { enmascarar, POLITICA_PII } from "@/domain/policies/pii.policy.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
```
- Mirror name `tests/unit/<módulo>.<rol>.test.ts` (enforced by `PRUEBA_UNITARIA`). Table-driven `test.each` for the 43 classifier phrases. Adapter tests inject a fake `fetch` returning the spike fixture (RESEARCH "Code Examples").

### `tests/helpers/llm-falso.helper.ts`, `historial.helper.ts`

**Analog:** `tests/helpers/flujo.helper.ts` lines 1-30 (types imported from `@tests/helpers/types/*.type.ts`, small exported functions). Move `sensibles` logic from `tests/e2e/pii.test.ts` (uses `POLITICA_PII`, `LARGO_MINIMO_SENSIBLE = 5`) into `historial.helper.ts`. FakeLlm shape per RESEARCH lines 701-718.

### Loop tests (`tests/loop/*.test.ts`)

**Analog:** `tests/contract/simular-envio.test.ts` lines 1-12 and `tests/helpers/proyecto-temporal.helper.ts` lines 15-25

```typescript
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
...
const raiz = await mkdtemp(join(tmpdir(), "proveedor-"));
for (const nombre of opciones.sinteticos ?? []) { await cp(join(CASOS_SINTETICOS, nombre), ...) }
```
- Temp project per suite, `sinteticos: ["zz-inyeccion"]` for the injection test, pin date with `pinExecutionDate` from `@/config/env.ts` (as `demo.ts` does). Assert literal `"requiere confirmación explícita"` as in `simular-envio.test.ts` (`const LITERAL`).

### `tests/fixtures/casos/zz-inyeccion/`

**Analog:** `tests/fixtures/casos/zz-generica-ec/{solicitud,plantilla-campos,soportes-exigidos}.json`. Copy and inject instructions in `cuerpo` and `cliente` (D-49).

## Shared Patterns

### Resultado instead of exceptions
**Source:** `src/domain/utils/resultado.util.ts` (`exito`, `fallo(codigo, { detalle, parcial })`)
**Apply to:** loaders, wiring, adapters, gate. Messages resolved from `MENSAJE_ERROR[codigo]`, detail appended only for `CODIGOS_CON_DETALLE`.

### Zod parsing in Spanish
**Source:** `definir-herramienta.factory.ts` line 32 `const mensajesEs = z.locales.es().localeError;` + `formatearIssues(issues, MAX_ISSUES_ARGS)`
**Apply to:** env, provider response schema, tool-result schema, model args.

### Imports
**Source:** every file: alias `@/...` / `@tests/...` with explicit `.ts` extension, `import type` for types, no relative paths.

### Text and codes
All human/model text in `src/config/strings.ts`; all regex in `patterns.constants.ts`; codes as `as const` objects compared via the object (`CODIGO_ERROR.X`). No comments in code.

### CA4 audit
**Source:** `src/infra/logging/audit-log.adapter.ts` `createAuditLog(raiz, reloj)` returning `Registrar` with `EntradaBitacora { herramienta, ok, resumen, sesion, caso?, codigo? }`. Blocked gate attempts must go through it.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/loop/services/ejecutar-turno.service.ts` (generator core) | service | streaming | No async generator / agent loop exists; use RESEARCH diagram + Patterns 6-12 |
| `src/llm/decorators/retry.decorator.ts` (backoff, Retry-After) | decorator | request-response | No retry logic in Phase 1 |
| `src/llm/decorators/fallback.decorator.ts` | decorator | request-response | No multi-provider code |
| `src/infra/sessions/memory-session-store.adapter.ts` (TTL/LRU) | adapter | CRUD | Only case-lock map is close |
| `src/infra/logging/logger.adapter.ts` (pino) | adapter | event | First pino use; follow STACK.md |
| `tests/live/agente-en-vivo.test.ts` | test | — | No opt-in live tests yet |
| `agent/prompt.md` | knowledge | — | No prior system prompt |

## Metadata

**Analog search scope:** `src/**`, `tests/**`, `demo.ts`
**Files scanned:** ~150 tracked files listed; 20 read
**Pattern extraction date:** 2026-10-13
