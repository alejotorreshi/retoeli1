# Phase 3: Chat web, API SSE y despliegue - Pattern Map

**Mapped:** 2026-10-14
**Files analyzed:** 34 (nuevos y modificados, agrupados por rol)
**Analogs found:** 27 / 34

Todas las rutas de análogos son fuentes rastreadas por git (`git ls-files`).

## File Classification

| Archivo nuevo/modificado | Rol | Data Flow | Análogo más cercano | Calidad |
|---|---|---|---|---|
| `src/http/wiring/servidor.wiring.ts` | wiring (3er composition root) | request-response | `src/loop/wiring/agente.wiring.ts` | exact (rol) |
| `src/server.ts` | entrada | request-response | `demo.ts` | role-match |
| `src/http/routes/chat.route.ts` | route | streaming (SSE) + JSON | `src/loop/services/respuesta-turno.service.ts` (fallback) + RESEARCH Pattern 1 | partial |
| `src/http/routes/{sessions,health,access,config,artifacts}.route.ts` | route | request-response | ninguno (no hay HTTP) | none |
| `src/http/middlewares/{access,json-only,rate-limit,client-ip}.middleware.ts` | middleware | request-response | ninguno | none |
| `src/http/services/limitador.service.ts`, `cupos-turno.service.ts`, `token-acceso.service.ts`, `sse.service.ts` | service puro (reloj inyectado) | transform | `src/loop/services/presupuesto.service.ts` | role-match |
| `src/http/schemas/{chat,acceso}.schema.ts` | schema | validación | `src/infra/knowledge/schemas/rules.schema.ts`, `src/tools/schemas/argumentos.schema.ts` | exact |
| `src/http/types/*.type.ts` | types | — | `src/loop/types/agente.type.ts` | exact |
| `src/llm/decorators/health-report.decorator.ts` | decorator | event (observa resultado) | `src/llm/decorators/observation.decorator.ts` | exact |
| `src/llm/decorators/daily-budget.decorator.ts` | decorator | corte previo + acumulado | `src/llm/decorators/fallback.decorator.ts` + `presupuesto.service.ts` | exact |
| `src/loop/services/vista-sesion.service.ts`, `resultado-visible.service.ts` | service puro | transform | `src/loop/services/respuesta-turno.service.ts` | exact |
| `src/loop/wiring/agente.wiring.ts` (mod: `estadoLlm`, `consultarSesion`, `existeSesion`, decoradores) | wiring | — | sí mismo | exact |
| `src/loop/types/agente.type.ts` (mod: `Agente`) | types | — | sí mismo | exact |
| `src/loop/types/turno.type.ts` (mod: `confirmacion` → `accion`) | types | — | sí mismo (líneas 42-49) | exact |
| `src/loop/types/evento.type.ts` (mod: `caso`, `resultado`) | types | — | sí mismo | exact |
| `src/loop/services/ejecutar-turno.service.ts` / `src/domain/policies/compuerta.policy.ts` (mod: `CANCELA_CASO`) | service/policy | — | sí mismos (52-60 / 42-57) | exact |
| `src/application/types/puertos-agente.type.ts` (mod: `leer`) y `application/types/artefactos.type.ts` | types (puerto) | — | `puertos-agente.type.ts` | exact |
| `src/infra/sessions/memory-session-store.adapter.ts` (mod: `leer`) | adapter | CRUD en memoria | sí mismo | exact |
| `src/infra/output/artifact-reader.adapter.ts` | adapter | file-I/O | `src/infra/fs/safe-paths.util.ts` + `src/infra/fixtures/case-resolver.adapter.ts` | role-match |
| `src/config/env.ts` (mod: acceso, HMAC, topes, `Secure`, PORT) | config | — | sí mismo (`agentEnvSchema`) | exact |
| `src/config/constants/http.constants.ts`, `confirmation.constants.ts` (+`TIPO_ACCION`), `agent.constants.ts` (+código tope diario) | constants | — | `agent.constants.ts` | exact |
| `src/config/strings.ts` (mod: `MENSAJE_HTTP`, textos UI compartidos) | strings | — | sí mismo | exact |
| `tests/architecture.test.ts`, `tests/sin-comentarios.test.ts` (mod guardianes) | test | — | sí mismos (44-88, 191-290) | exact |
| `tests/http/*.test.ts` (`app.request`) | test | request-response | `tests/loop/sesion.test.ts` + `tests/helpers/agente-fetch.helper.ts` | role-match |
| `tests/helpers/servidor-prueba.helper.ts` | test helper | — | `tests/helpers/agente-fetch.helper.ts` | exact |
| `tests/loop/compuerta-casos.test.ts` (mod 415-455) | test | — | sí mismo | exact |
| `tests/web/*.test.ts` (reducer puro) | test | transform | `tests/loop/*.test.ts` | partial |
| `tests/seguridad/clave.test.ts` (SEG-01) | test | — | `tests/e2e/pii.test.ts`, `agente-fetch.helper.ts` (`CLAVE_PRUEBA`) | role-match |
| `web/src/state/*.ts` (reducer, selectores) | store puro | event-driven | `respuesta-turno.service.ts` (pliegue de eventos) | partial |
| `web/src/api/*.ts` (cliente SSE/fetch) | client | streaming | ninguno | none |
| `web/src/components/*.tsx`, `app.tsx`, `main.tsx`, `styles/tokens.css`, `web/src/config/strings.ts` | component | — | ninguno (UI-SPEC manda) | none |
| `web/vite.config.ts`, `web/tsconfig.json`, `web/index.html` | config | — | `tsconfig.json` raíz (alias) | partial |
| `package.json` (mod: hono, eventsource-parser, react, vite, scripts `dev`) | config | — | sí mismo | exact |
| `Dockerfile`, `render.yaml`, `.dockerignore` (mod), `.env.example` | config deploy | — | `.dockerignore` existente; RESEARCH Pattern 12 | partial |

## Pattern Assignments

### `src/http/wiring/servidor.wiring.ts` (composition root HTTP)

**Análogo:** `src/loop/wiring/agente.wiring.ts`

Patrón: funciones privadas pequeñas que arman dependencias y una única función exportada que devuelve un resultado discriminado `{ ok }`. Leer la config con `fuenteEntorno` opcional para tests (líneas 54-56):
```typescript
function leerConfiguracion(opciones: OpcionesAgente) {
  return opciones.fuenteEntorno === undefined ? readAgentEnv() : parseAgentEnv(opciones.fuenteEntorno);
}
```
Error de config al armar (líneas 128-139), ojo: con `PROVEEDOR_SIN_CLAVE` el servidor debe arrancar igual y health reportar `sin_clave` (D-71):
```typescript
export function crearAgente(opciones: OpcionesAgente): CreacionAgente {
  const config = leerConfiguracion(opciones);
  if (!config.success) {
    const codigo = CODIGO_AGENTE.CONFIGURACION_LLM_INVALIDA;
    const detalle = formatearIssues(config.error.issues, MAX_ISSUES_ARGS);
    return { ok: false, codigo, mensaje: TEXTO_AGENTE.conDetalle(MENSAJE_AGENTE[codigo], detalle) };
  }
  const { primary } = config.data;
  if (primary.apiKey === null) { ... return { ok: false, codigo, mensaje: MENSAJE_AGENTE[codigo] }; }
```
Secretos para redacción y logger (líneas 89-97): añadir código de acceso y secreto HMAC a la lista `secretos` y pasarla a `createLogger({ level, secrets })`. Las dependencias inyectables (`fetch`, `esperar`, `destinoLogs`) siguen el tipo `OpcionesAgente` (`src/loop/types/agente.type.ts` 7-15); `crearServidor` debe aceptar las mismas más `fuenteEntorno` para `app.request()` en tests.

### `src/server.ts` (entrada)

**Análogo:** `demo.ts` (4 líneas):
```typescript
const resultado = await ejecutarDemo({ directorio: import.meta.dir, escribir: console.log });
if (resultado.fallido) process.exitCode = 1;
```
Copiar la forma mínima: importar solo `crearServidor` desde wiring y la env ya parseada; raíz derivada de `import.meta.dir` (dos niveles: `src/` → raíz), nunca `process.cwd()`. No leer `Bun.env.PORT` aquí (G10); el puerto viene de `config/env.ts`. `Bun.serve({ hostname: "0.0.0.0", port, fetch: app.fetch, idleTimeout })`.

### `src/http/routes/chat.route.ts` (SSE + fallback JSON)

**Análogo parcial:** `src/loop/services/respuesta-turno.service.ts` (24-40) ya pliega eventos al shape del PRD §6.4; el fallback JSON lo reutiliza:
```typescript
export function respuestaDeTurno(eventos: readonly EventoAgente[]): RespuestaTurno {
  const textos: string[] = [];
  ...
  for (const evento of eventos) {
    if (evento.tipo === TIPO_EVENTO.TEXTO) textos.push(evento.texto);
```
Para el stream, usar el ejemplo verificado de RESEARCH Pattern 1 (`c.env.timeout(c.req.raw, 0)`, `streamSSE`, `onAbort` → `AbortController`, latido con `setInterval`, `try/catch/finally` propio que libera cupo, parchar `Cache-Control: no-cache, no-transform` y `X-Accel-Buffering: no` en la `Response`). Nombres de evento SSE = valores de `TIPO_EVENTO` (`src/config/constants/agent.constants.ts` 4-13). Nunca usar `onError` de `streamSSE`.

### Rutas `sessions/health/access/config/artifacts` y middlewares

**Sin análogo.** Usar RESEARCH Patterns 5, 6, 7, 8, 9 y el ejemplo "Middleware de acceso (cookie o Bearer)" (RESEARCH ~línea 526). Reglas: toda respuesta de error `{ mensaje }` con texto de `strings.ts` (Pitfall 9); health siempre 200 con `{ ok, provider, model, llm }`.

### `src/http/services/*.service.ts` (limitador, cupos, token)

**Análogo:** `src/loop/services/presupuesto.service.ts` (funciones puras, sin I/O, mensajes de `strings.ts`):
```typescript
export function presupuestoAgotado(sesion: Sesion, tope: number): boolean {
  return sesion.tokensUsados >= tope;
}
export function acumularUso(sesion: Sesion, uso: Uso): Sesion {
  return { ...sesion, tokensUsados: sesion.tokensUsados + uso.entrada + uso.salida };
}
```
Para el limitador con `Map` y limpieza por tiempo, copiar la forma de closure + `now` inyectado de `memory-session-store.adapter.ts` 9-26 (`sweep(now)` sobre `entries`).

### `src/http/schemas/{chat,acceso}.schema.ts`

**Análogos:** `src/tools/schemas/argumentos.schema.ts` (z.enum desde constante, límites desde constantes) y `src/infra/knowledge/schemas/rules.schema.ts:62` (G16):
```typescript
const caso = z.string().max(LONGITUD_MAXIMA_CASO).describe(DESCRIPCION_ARG.caso);
...
estado: z.enum(ESTADO_CAMPO).describe(DESCRIPCION_ARG.estadoMapeo),
...
  .strict() satisfies z.ZodType<Reglas>;
```
Aplicar: `accion: z.object({ tipo: z.enum(TIPO_ACCION), caso }).strict().optional()`, `message: z.string().max(LONGITUD_MAXIMA_MENSAJE)`, `export const chatBodySchema = … satisfies z.ZodType<ChatBody>` con `ChatBody` en `src/http/types/`.

### `src/http/types/*.type.ts`

**Análogo:** `src/loop/types/agente.type.ts`: solo `type` e `import type`, `readonly` en todos los campos, uniones discriminadas `{ ok: true … } | { ok: false; codigo; mensaje }`.

### `src/llm/decorators/health-report.decorator.ts`

**Análogo exacto:** `src/llm/decorators/observation.decorator.ts` (completo, 21 líneas):
```typescript
export function withObservation(base: AdaptadorLlm): AdaptadorLlm {
  return {
    proveedor: base.proveedor,
    modelo: base.modelo,
    enviar: async (messages, tools, options) => {
      const startedAt = Date.now();
      const result = await base.enviar(messages, tools, options);
      if (!result.ok) { options.observador?.fallo({ ... }); }
      return result;
    },
  };
}
```
Mismo esqueleto: tras `base.enviar`, publicar `disponible` si `ok`, `saldo_agotado` si `TIPO_ERROR_LLM.SALDO`, `no_disponible` en otro error salvo `ABORTADO`. Identificadores en inglés (capa decoradores). Solo importa `llm`, config pura y zod; el monitor llega inyectado.

### `src/llm/decorators/daily-budget.decorator.ts`

**Análogo:** `src/llm/decorators/fallback.decorator.ts` (cortocircuito antes de delegar, líneas 12-18):
```typescript
enviar: async (messages, tools, options) => {
  const result = await primary.enviar(messages, tools, options);
  if (result.ok || !result.error.reintentable) return result;
  if (fallback === null || options.signal.aborted) return result;
```
Invertir: si el contador del día ≥ tope, devolver `{ ok: false, error: { tipo: TIPO_ERROR_LLM.TOPE_DIARIO, reintentable: false, … } }` sin llamar; si `ok`, sumar `uso.entrada + uso.salida` (igual que `acumularUso`). Agregar el nuevo tipo a `CODIGO_AGENTE_POR_ERROR_LLM` (`agent.constants.ts` 59-70, `satisfies Record<…>`). Llave del día con `systemClock(TZ_NEGOCIO).hoy()` (`src/infra/clock/clock.adapter.ts` 25+), inyectada desde `agente.wiring.ts`.

### Composición en `src/loop/wiring/agente.wiring.ts` (modificación)

Punto de inserción, líneas 84-87:
```typescript
function modeloDelAgente(opciones: OpcionesAgente, config: AgentEnv, apiKey: string): AdaptadorLlm {
  const primario = resiliente(config.primary, apiKey, config, opciones);
  return withFallback(primario, respaldoDe(config, opciones), avisarCambio);
}
```
Envolver: `withDailyBudget(withHealthReport(withFallback(...), monitor), contador)`. Exponer en el objeto `agente` (líneas 141-147) `estadoLlm()`, `consultarSesion(id)` y `existeSesion(id)`, junto a `turno`.

### `src/loop/services/vista-sesion.service.ts`, `resultado-visible.service.ts`

**Análogo:** `src/loop/services/respuesta-turno.service.ts` 10-22 (proyección pura de eventos/llamadas):
```typescript
function llamadaRespondida(inicio: EventoInicioHerramienta, fines: ReadonlyMap<string, EventoFinHerramienta>): LlamadaRespondida {
  const fin = fines.get(inicio.llamadaId);
  return { herramienta: inicio.herramienta, argumentos: inicio.argumentos, ok: fin?.ok ?? false, codigo: fin?.codigo ?? null, resumen: fin?.resumen ?? null };
}
```
Toda salida pasa por `redactar(…, secretos)` (`src/domain/policies/redaccion.policy.ts`); bloqueos legibles con `motivosDeBloqueo` (como `src/domain/builders/cierre-turno.builder.ts` 10-19). Nunca `razonamiento` ni mensaje de sistema.

### `src/loop/types/turno.type.ts` (modificación D-68)

Estado actual (líneas 42-49) a reemplazar:
```typescript
export type ConfirmacionEstructurada = { readonly aprobada: boolean; readonly caso: string };
export type EntradaTurno = { readonly sesionId: string | null; readonly mensaje: string; readonly signal?: AbortSignal; readonly confirmacion?: ConfirmacionEstructurada; };
```
→ `readonly accion?: { readonly tipo: ValorDe<typeof TIPO_ACCION>; readonly caso: string }` (`ValorDe` de `src/config/types/valor-de.type.ts`). Ver RESEARCH Pattern 3 para `ejecutar-turno.service.ts:52-60` y `compuerta.policy.ts:42-57` (`estadoSin`).

### Puerto `AlmacenSesiones.leer` + adaptador

**Análogo:** `src/application/types/puertos-agente.type.ts` 11-16 y `src/infra/sessions/memory-session-store.adapter.ts` 47-56:
```typescript
abrir(id) {
  const now = options.now();
  sweep(now);
  if (id === null) return openNew(now, false);
  const entry = PATRON_SESION.test(id) ? entries.get(id) : undefined;
  if (entry === undefined) return openNew(now, true);
```
`leer(id)`: mismo `sweep(now)` + `PATRON_SESION.test`, pero devuelve `{ sesion, ocupada: isHeld(entry, now) } | null`, sin `store()` (no crea ni renueva TTL).

### `src/infra/output/artifact-reader.adapter.ts` (+ puerto `application/types/artefactos.type.ts`)

**Análogos:** `src/infra/fs/safe-paths.util.ts` 31-48 y `src/infra/fixtures/case-resolver.adapter.ts` 14-20:
```typescript
export async function existingRealCaseDirectory(raiz: string, caso: string): Promise<string | null> {
  try { return await realCaseDirectory(raiz, caso); }
  catch (error) { if (isNotFound(error)) return null; throw error; }
}
export async function realPackageDirectory(casoReal: string): Promise<string> { ... }
```
```typescript
export async function resolveCase(raiz: string, caso: string): Promise<ResolucionCaso> {
  if (!PATRON_CASO.test(caso)) return LECTURA_INVALIDA;
```
Validar caso con `PATRON_CASO` y `listCases`, lista blanca desde `ARCHIVOS_SALIDA`/`ARCHIVOS_PAQUETE`/`DIRECTORIO_PAQUETE` (`files.constants.ts` 32-45), excluir `mapeo.json` y `log.jsonl`; vista previa de formulario y `valores-portal.md` desde `mapeo.json` (`valor_enmascarado`) por D-74; borrador como texto plano (D-74). Identificadores en inglés (infra), `node:` permitido solo aquí.

### `src/config/env.ts` (modificación)

**Análogo:** `agentEnvSchema` (líneas 158-192), mismo estilo de helpers:
```typescript
AGENT_SESSION_TTL_MINUTES: withDefault(positiveInt(), TTL_SESION_MINUTOS_POR_DEFECTO),
AGENT_MAX_SESSIONS: withDefault(positiveInt(), MAX_SESIONES_POR_DEFECTO),
LOG_LEVEL: withDefault(z.enum(NIVELES_LOG), NIVEL_LOG_POR_DEFECTO),
```
Nuevo `serverEnvSchema` + `parseServerEnv(source: EnvSource)` / `readServerEnv()` igual que `parseToolEnv`/`readToolEnv` (líneas 73-79, con `{ error: z.locales.es().localeError }`). Defaults en `http.constants.ts`; mensajes en `TEXTO_ENV`. Tipo `ServerEnv` junto al esquema (excepción de CLAUDE.md, ampliarla).

### Constantes (`http.constants.ts`, `TIPO_ACCION`, estados LLM)

**Análogo:** `src/config/constants/agent.constants.ts` 4-13:
```typescript
export const TIPO_EVENTO = { INICIO_TURNO: "turn_start", ..., FIN_TURNO: "turn_end" } as const;
```
`ESTADO_LLM = { DISPONIBLE: "disponible", SIN_CLAVE: "sin_clave", SALDO_AGOTADO: "saldo_agotado", NO_DISPONIBLE: "no_disponible", TOPE_DIARIO: "tope_diario" } as const`, `TIPO_ACCION` en `confirmation.constants.ts`. Registrar familias nuevas en `FAMILIAS_DE_CODIGOS` (G6). Regex nuevas solo en `patterns.constants.ts`.

### `tests/architecture.test.ts` y `tests/sin-comentarios.test.ts` (guardianes)

Puntos exactos (citados arriba en este análisis):
- Línea 46 `PAQUETES_CON_CAPA` → agregar `"hono"` (y paquetes del front si `web/` se escanea).
- Líneas 63-88 `PERMITIDOS` → `http`, `wiring-http`, `servidor`; `llm` sigue `["llm", "config-pure", "zod"]`.
- Líneas 191-207 `CARPETAS_DE_ROL` → `"http/routes": "route"`, `"http/middlewares": "middleware"`, `"http/services": "service"`, `"http/wiring": "wiring"`; regex de `types` (216) y `schemas` (218) con `http`.
- Líneas 230-234 `SUELTOS_PERMITIDOS` → `src/server.ts`.
- Línea 244 `CAPAS_FUTURAS` → quitar `http`.
- Líneas 270-283 `capaDeRuta` → ruta exacta de `src/http/wiring/servidor.wiring` y `src/server`, `http` en la regex de capas:
```typescript
if (base === "src/loop/wiring/agente.wiring") return "wiring-agente";
...
const capa = /^src\/(domain|application|infra|tools|demo|llm|loop)\//.exec(base)?.[1];
```
- Guardián nuevo de `web/src/**/*.{ts,tsx}` con prueba de violación por regla (RESEARCH "Guardianes"). Actualizar `docs/estructura.md` (`CARPETAS_ENUMERADAS_EN_DOCS`).

### `tests/http/*.test.ts` y `tests/helpers/servidor-prueba.helper.ts`

**Análogo:** `tests/helpers/agente-fetch.helper.ts` (completo):
```typescript
export const CLAVE_PRUEBA = "clave-de-prueba-Zq9X";
export function crearAgenteFetch(opciones: OpcionesAgenteFetch): AgenteFetch {
  const creacion = crearAgente({
    directorio: opciones.raiz,
    fetch: opciones.fetch,
    fuenteEntorno: { LLM_API_KEY: CLAVE_PRUEBA, LOG_LEVEL: NIVELES_LOG.SILENCIO, ...opciones.entorno },
    esperar: async (ms) => { esperas.push(ms); },
  });
  if (!creacion.ok) throw new Error(creacion.mensaje);
```
Copiar para `crearServidorPrueba` (agregar código de acceso y secreto HMAC centinela) y usar `app.request()`. Imports de tests como en `tests/loop/sesion.test.ts` 1-30: `bun:test` (`setSystemTime`), `crearFetchFalso`/`cuerpoConHerramientas` de `@tests/helpers/fetch-falso.helper.ts`, `crearProyectoTemporal` de `@tests/helpers/proyecto-temporal.helper.ts`, constantes vía `@/config/constants/*`. Tipos de helpers en `tests/helpers/types/*.type.ts`. Cada capa de D-73 con un test que demuestre que corta.

### `tests/seguridad/clave.test.ts`

**Análogos:** `tests/e2e/pii.test.ts` (grep de valores prohibidos en salidas) + `CLAVE_PRUEBA`/`MARCA_CLAVE`. Ver RESEARCH Pattern 11.

### `web/src/state/*.ts` y `tests/web/*.test.ts`

**Análogo parcial:** el pliegue `for (const evento of eventos)` de `respuesta-turno.service.ts` 24-40; el reducer es una función pura `(estado, evento) => estado` conmutando por `TIPO_EVENTO.*` (nunca literales). Importar constantes de `@/config/constants/**` y `import type` de `@/http/types/**`. Tests sin DOM con `bun test`.

### `package.json`, `.dockerignore`, `Dockerfile`, `render.yaml`, `.env.example`

`package.json`: versiones fijadas exactas como las existentes (`"zod": "4.6.5"`), runtime en `dependencies` (hono), front en `devDependencies`; añadir `dev` con `bun run --parallel`, `build:web`; `check` debe incluir `tsc -p web/tsconfig.json`. `.dockerignore` actual: `node_modules/ out/ .env .env.* !.env.example .DS_Store *.log web/dist/ .git .planning tests` → sumar `.qa .codegraph .gsd .claude .agents web/node_modules`. Dockerfile/render.yaml: copiar RESEARCH Pattern 12 (copia `tsconfig.json` y `reto-01/fixtures`, `USER bun`, `chown out`).

## Shared Patterns

### Resultado discriminado y mensajes centralizados
**Fuente:** `src/loop/types/agente.type.ts` 23-25 y `agente.wiring.ts` 130-139. **Aplica a:** wiring, servicios HTTP, adaptador de artefactos.
```typescript
| { readonly ok: true; readonly agente: Agente }
| { readonly ok: false; readonly codigo: CodigoAgente; readonly mensaje: string };
```
Todo `mensaje` sale de `src/config/strings.ts` (nuevo bloque `MENSAJE_HTTP`, indexado por constante de códigos).

### Redacción de secretos y PII
**Fuente:** `agente.wiring.ts` 89-97 (`secretosDe`, `createLogger({ secrets })`) + `src/domain/policies/redaccion.policy.ts`. **Aplica a:** cada evento SSE, JSON de fallback, vista de sesión y logs HTTP. pino solo desde infra.

### Inyección de reloj y `now`
**Fuente:** `memory-session-store.adapter.ts` (`options.now()`), `clock.adapter.ts` (`systemClock(zona)`). **Aplica a:** limitador, tope diario, token de acceso (vencimiento).

### Imports y estilo
Solo alias `@/` y `@tests/`, sufijo `.ts` explícito en imports, sin comentarios, `as const` en vez de `enum`, `z.enum(CONSTANTE)`, `satisfies z.ZodType<T>` en `export const …Schema`.

## No Analog Found

| Archivo | Rol | Data Flow | Motivo |
|---|---|---|---|
| `src/http/routes/*.route.ts` (salvo fallback de chat) | route | request-response | No existe capa HTTP; usar RESEARCH Patterns 1, 2, 5-9 |
| `src/http/middlewares/*.middleware.ts` | middleware | request-response | Idem; RESEARCH "Middleware de acceso" y Pattern 8 |
| `web/src/api/*.ts` | cliente | streaming | No hay front; RESEARCH "Cliente SSE en el navegador" (eventsource-parser) |
| `web/src/components/*.tsx`, `app.tsx`, `main.tsx` | component | — | Seguir 03-UI-SPEC.md (componentes, copy, accesibilidad) |
| `web/src/styles/tokens.css` | estilos | — | Tokens de UI-SPEC (Spacing, Typography, Color) |
| `web/vite.config.ts` | config | — | STACK.md: proxy `/api`, `resolve.alias` para `@/` |
| `Dockerfile`, `render.yaml` | deploy | — | RESEARCH Pattern 12 |

## Metadata

**Analog search scope:** `src/**`, `tests/**`, `demo.ts`, `package.json`, `.dockerignore`
**Files scanned:** ~20 leídos, ~200 listados
**Pattern extraction date:** 2026-10-14
