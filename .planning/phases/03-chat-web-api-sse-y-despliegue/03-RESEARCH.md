# Phase 3: Chat web, API SSE y despliegue - Research

**Researched:** 2026-10-14
**Domain:** API HTTP con SSE sobre Bun + Hono, acceso por cookie firmada, topes de costo en memoria, chat React 19 + Vite 8 y despliegue Docker en Render free
**Confidence:** HIGH en Bun, Hono, Vite y el código del repo (spikes ejecutados en esta sesión con Bun 1.4.3). MEDIUM o LOW en el comportamiento del proxy de Render (no está documentado y se verifica con el walking skeleton).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Artefactos y PII (API-05, UI-06)
- **D-64:** **La descarga entrega el archivo real** (xlsx, pdf o .md tal como se generó), porque es el entregable del reto. **La vista previa en el navegador nunca muestra un valor completo**, en coherencia con D-47. En pantalla, igual que en el chat, solo aparecen valores enmascarados.
- **D-65:** La vista previa del formulario (xlsx, pdf o valores de portal) **se construye en el servidor desde `out/<caso>/mapeo.json`**. Es una tabla de etiqueta, `valor_enmascarado` y estado (`lleno` / `faltante` / `requiere_confirmacion`, con su nota), igual para los tres formatos. No se parsea el xlsx ni se renderiza el PDF. Los `.md` del paquete (checklist, borrador de correo, ENVIO-SIMULADO) se previsualizan como texto plano, porque la Fase 1 ya garantiza que no llevan valores reales (grep de PII vacío). Hay que verificar en la investigación que eso también vale para `valores-portal.md`. Si no vale, su preview sale de mapeo.json como el formulario.
- **D-66:** La **lista blanca** de nombres servibles es: `formulario.xlsx`, `formulario.pdf`, `valores-portal.md`, `paquete/checklist.md`, `paquete/borrador-correo.md`, `ENVIO-SIMULADO.md` y los soportes copiados en `paquete/`. **Quedan fuera** `mapeo.json` y `log.jsonl`, que son internos. El caso se valida contra los casos conocidos y la ruta se resuelve con `safe-paths.util.ts` (sin traversal). Todo va detrás del acceso (D-72). — **Reversibility:** reversible.
- **D-67:** **Disco efímero de Render:** el panel lista lo que existe en disco en ese momento. Si falta un archivo esperado (por un reinicio o porque el servicio se durmió), muestra "El servidor se reinició y los archivos se borraron; vuelve a procesar el caso", con un chip que manda "procesa el caso X". **No se regenera al vuelo**, para no ocultar el reinicio ni tapar un paquete desactualizado.

#### Confirmar / Cancelar (UI-03, D-39, D-40, D-63.11)
- **D-68:** `POST /api/chat` acepta, además de `{ sessionId, message }`, un campo opcional **`accion: { tipo: "confirmar" | "cancelar", caso }`** (los tipos se definen como constante `as const` y `z.enum` construido desde ella). Los botones mandan un texto visible (por ejemplo "Sí, envía co-industrias-delta" o "Cancela el envío de co-industrias-delta"), que queda en el historial para el modelo y la analista, **y** la acción estructurada. El servidor decide con `accion` **sin pasar por el clasificador de texto** (precedencia de D-39). Una `accion` vale solo si su `caso` está pendiente en la sesión. Si no lo está, no autoriza nada y se trata como texto normal, y el servidor vuelve a preguntar si corresponde. — **Reversibility:** costly — cambia el contrato de `EntradaTurno` del ciclo, el body de la API, la UI y los tests de la compuerta.
- **D-69:** **Hay una tarjeta por caso pendiente**, con su caso, la acción y los bloqueos (del evento `confirmacion_requerida`) y sus botones Confirmar y Cancelar. **Cancelar estructurado cancela solo ese caso** y los demás pendientes siguen igual, a diferencia del rechazo por texto, que cancela todos (D-63.11). El input del chat **sigue activo** con tarjetas abiertas, y la tarjeta **refleja lo que decide el servidor**: se cierra o sigue abierta según los eventos del turno siguiente, nunca por una decisión local de la UI. `GET /api/sessions/:id` devuelve también los **pendientes vigentes** (`{ caso, bloqueos }[]`), así que al recargar la UI vuelve a pintar las tarjetas activas con botones. Las tarjetas de turnos ya resueltos quedan en el historial sin botones.

#### Modo degradado (LLM-06, reducido)
- **D-70:** El PRD **no pide** modo degradado. Lo que exige es CA5 (errores del proveedor en lenguaje claro y la sesión sigue viva), Robustez (timeout con mensaje claro) y que `demo.ts` corra sin clave (hecho en la Fase 1). Por eso **LLM-06 se reduce a health y aviso**: `/api/health` reporta la disponibilidad del LLM y la UI muestra un banner claro cuando no está disponible. **No hay flujo sin IA en la UI**, y para correr sin clave está `demo.ts`. Hay que **reformular LLM-06 en REQUIREMENTS.md** y ajustar el criterio de éxito 4 del ROADMAP en la misma tarea. El "procesar sin IA" pasa a ideas diferidas.
- **D-71 (health):** `/api/health` sigue barato y **nunca llama al LLM**. Devuelve `{ ok, provider, model, llm }`, donde `llm` es una constante `as const` con estos valores:
  - `disponible`;
  - `sin_clave`, cuando falta la clave en la config;
  - `saldo_agotado`, cuando la última llamada recibió un 402;
  - `no_disponible`, cuando la última llamada agotó los reintentos y el fallback;
  - `tope_diario`, cuando se alcanzó el tope diario global (D-74).

  El estado observado se limpia cuando una llamada vuelve a funcionar. Nunca expone claves ni detalles internos del error.

#### Acceso (API-04, UI-09, SEG-01)
- **D-72:** El acceso sigue las prácticas de OWASP para una SPA del mismo origen:
  - La pantalla de entrada envía el código **una vez** a `POST /api/acceso`. El servidor lo compara **en tiempo constante** con el de la env var y responde con una **cookie `HttpOnly; Secure; SameSite=Strict; Path=/api`** que contiene un **token firmado con HMAC y vencimiento a las 12 h** (configurable). La cookie no lleva el código.
  - El código **nunca se guarda en el navegador** (ni `localStorage` ni `sessionStorage`), y el JS no puede leer la cookie.
  - Contra CSRF: `SameSite=Strict` y además exigir `Content-Type: application/json` en los POST.
  - Para `curl -N` y el futuro pre-flight se acepta también `Authorization: Bearer <código>`, comparado en tiempo constante.
  - Si cualquier endpoint protegido responde 401, la UI vuelve a la pantalla de entrada.
  - En local (`bun run dev`, http) la cookie no puede ser `Secure` en todos los navegadores, así que el flag `Secure` depende del entorno (config), nunca está apagado en producción.
  - La clave de firma HMAC es una env var propia (secret en Render), distinta del código de acceso y de la clave del LLM.

  Todo excepto `/api/health` (y los estáticos de la SPA) exige acceso. — **Reversibility:** costly — define las variables de entorno documentadas (`.env.example`, `render.yaml`, README) y el flujo de la UI.

#### Topes de costo y abuso (API-04, D-51)
- **D-73:** Los usuarios no deben poder consumir la API ni el LLM sin control. Las defensas van en capas y todas tienen valor por defecto configurable por env y mensaje claro en español (en `strings.ts`):
  1. **Rate limit por IP en `/api/chat`: 10 mensajes por minuto.**
  2. **`/api/acceso`: 5 intentos fallidos cada 15 min por IP** (anti fuerza bruta). Al superarlo responde 429.
  3. **Un turno activo por sesión** (un segundo mensaje mientras corre un turno se rechaza con mensaje claro) y **3 turnos simultáneos en total**.
  4. **Mensaje de hasta 2000 caracteres y body HTTP de hasta 16 KB**, verificados antes de parsear el JSON.
  5. **5 sesiones nuevas por hora por IP**, para que crear sesiones no sirva para reiniciar el tope de 300 k tokens por sesión.
  6. **Tope diario global de 2 M tokens** (prompt + completion de todas las llamadas, incluido el fallback). Es un corte duro: al alcanzarlo los turnos responden con un mensaje claro, health reporta `tope_diario` (D-71) y el contador se reinicia a medianoche (UTC o la zona configurada, a criterio del planner). Vive en memoria, y un reinicio lo pone en cero, lo que se acepta y se documenta.
  7. Se mantienen el tope de 300 k por sesión (D-51), las 25 iteraciones por turno (CA1), `max_tokens` por llamada y los timeouts.

  `/api/health` y los estáticos quedan fuera del rate limit. La IP del cliente detrás del proxy de Render se toma del salto correcto de `X-Forwarded-For` (no del primer valor, que el cliente puede falsificar). Esto lo confirma la investigación. Fuera del código, el README recomienda mantener bajo el saldo prepagado del proveedor como último cortafuegos.

### Claude's Discretion
- La forma exacta del protocolo SSE (nombres de eventos sobre el `TIPO_EVENTO` existente, heartbeat cada ~15 s y los headers `no-cache`/`X-Accel-Buffering`) y del fallback JSON `{ reply, toolCalls[], needsConfirmation }`, siguiendo STACK.md y PRD §6.4.
- El indicador de progreso por etapas (leído → mapeado → generado → paquete → confirmación → envío) y la tarjeta de resultado se derivan de los eventos de herramienta (`herramienta` + `ok` + `resumen`). El planner decide si el resumen estructurado lo arma el servidor o la UI, siempre desde los resultados de las herramientas y nunca desde el texto del modelo.
- La forma de los chips de acción rápida (UI-07): prompt §11, procesar los 4 casos y listar los casos.
- La estrategia de despliegue sigue el research flag: desplegar un walking skeleton SSE en Render temprano y probarlo con `curl -N`. Si bufferiza, se usa el fallback JSON y, como plan B, Koyeb o Fly con el mismo Dockerfile.
- Todo el diseño visual (layout, colores, componentes) lo define `/gsd-ui-phase 3`.

### Deferred Ideas (OUT OF SCOPE)
- **Flujo sin IA desde la UI** ("procesar sin IA" con las herramientas de `demo.ts`, incluido el envío con el botón Confirmar): era LLM-06 completo y DF-15. El PRD no lo pide y se redujo a health y aviso (D-70). Se puede retomar si sobra tiempo antes de la defensa.
- **Regenerar artefactos al vuelo** cuando el disco efímero los borró: descartado en favor del aviso honesto (D-67).
- Vienen de la Fase 2 y siguen diferidos: revelar el valor real en la UI por un canal aparte del modelo, y cambiar el proveedor o el modelo desde la UI en vivo.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | `POST /api/chat` con stream SSE de eventos por paso y heartbeat, más fallback JSON `{ reply, toolCalls[], needsConfirmation }` | Patrón 1 (SSE con `streamSSE`, `c.env.timeout(req, 0)`, latido de 8 s, headers parchados), Patrón 2 (fallback JSON con `respuestaDeTurno` existente), Pitfalls 1 a 4 |
| API-02 | `GET /api/sessions/:id` con historial completo y PII redactada | Patrón 5 (puerto `leer` sin crear sesión y proyección `VistaSesion` desde `Sesion.historial`, más `pendientes`) |
| API-03 | `GET /api/health` `{ ok, provider, model }` sin claves ni acceso | Patrón 6 (decoradores `withHealthReport` y `withDailyBudget`, `llm` de D-71, siempre 200) |
| API-04 | Código de acceso en tiempo constante, rate limit por IP, límite de tamaño y headers de seguridad | Patrones 7 y 8 (cookie HMAC con vencimiento, `bearerAuth`, `bodyLimit`, `secureHeaders` con CSP estricta, limitadores en memoria, IP desde la derecha de XFF) |
| API-05 | Descarga de `out/<caso>/` con lista blanca, detrás del acceso | Patrón 9 (puerto de artefactos, lista blanca de D-66, vista previa desde `mapeo.json`) y el hallazgo de PII en `valores-portal.md` y `borrador-correo.md` |
| UI-01 | Historial, input e indicador "pensando" con la herramienta en curso | Patrón 10 (`useReducer` sobre eventos SSE, `caso` en `tool_start`) |
| UI-02 | Tarjetas colapsables de tool call con args redactados, resultado y estado | `tool_start.argumentos` ya llega redactado (`paso-herramientas.service.ts:45-49`); patrón 4 agrega `caso` y `resultado` estructurado |
| UI-03 | Tarjeta de confirmación con Confirmar/Cancelar que mandan un mensaje explícito | Patrón 3 (`accion` en `EntradaTurno`, decisión `CANCELA_CASO`, cambio de tests de `compuerta-casos.test.ts:415-455`) |
| UI-04 | Errores en lenguaje claro y sesión usable | Eventos `error` existentes con `MENSAJE_AGENTE`; errores HTTP con `{ mensaje }` (UI-SPEC punto 6) |
| UI-05 | Tarjeta de resultado con contadores, `listo_para_firma`, bloqueos y ruta | Patrón 4 (`resultado` estructurado en `tool_end` desde `DatosMapeo`, `DatosFormulario`, `DatosPaquete`) |
| UI-06 | Panel de artefactos con descarga y vista previa | Patrón 9 |
| UI-07 | Chips: prompt §11, los 4 casos y listar casos | `GET /api/config` con `casos`; "¿Qué casos hay?" usa `leer_solicitud` con `caso: ""` (`contexto-caso.service.ts:17`), sin herramienta nueva (HERR-01) |
| UI-08 | Progreso por etapas, `sessionId` persistente, recarga e "Nueva sesión" | Patrones 4, 5 y 10 |
| UI-09 | Fecha de ejecución efectiva y código pedido una vez | `GET /api/config` con `fechaEjecucion` desde `clockFromToolEnv`; cookie de 12 h (patrón 7) |
| LLM-06 | (Reducido por D-70) health con estado del LLM y aviso en la UI | Patrón 6 y el texto de reformulación de la sección "Reformulación de LLM-06" |
| SEG-01 | Clave solo en el backend; test sobre `web/dist`, respuestas y SSE | Patrón 11 (test con clave centinela, build de Vite en el test, `redactar` sobre cada evento saliente) |
| DEP-01 | `bun run dev` levanta todo con un comando | `bun run --parallel dev:api dev:web` (flag verificado en Bun 1.4.3) y el proxy de Vite `/api` |
| DEP-02 | Dockerfile y `render.yaml` en Render free con secrets, `FECHA_EJECUCION=2026-09-03` y health | Patrón 12 (Dockerfile multi-stage `oven/bun:1.4.3-slim`, `USER bun`, `render.yaml` con `sync: false` y `generateValue: true`) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directivas de `.claude/CLAUDE.md` que el plan debe cumplir. Tienen la misma autoridad que las decisiones bloqueadas.

- TypeScript estricto, sin `any`. `bun run check` (tsc, Biome y `bun audit` desde moderate) tiene que pasar. Hay que sumar el `tsc -p web/tsconfig.json`.
- **Sin comentarios en el código.** Las `description` y los `.describe()` son contrato. La regla vale también para `web/` (hoy el guardián solo escanea `src/`, `tests/` y `demo.ts`).
- Dependencias hacia adentro: dominio → aplicación/herramientas → infraestructura → HTTP. Las herramientas no importan el servidor ni el bucle.
- Hay dos composition roots que importan infra: `tools/wiring/entorno.wiring.ts` y `loop/wiring/agente.wiring.ts`. Una capa HTTP nueva necesita su propio root declarado en el guardián por ruta exacta.
- pino solo se importa desde infra. `config/env.ts` es el único lector de `process.env` (G10): `PORT` y las variables nuevas se leen allí, nunca con `Bun.env` en el servidor.
- Tipos exportados solo en `types/*.type.ts`, con `type` e `import type`. Las uniones de códigos se derivan de su constante (`ValorDe<typeof X>`), los esquemas llevan `satisfies z.ZodType<T>` (G16) y los `z.enum` se construyen desde su constante (G15).
- Códigos como objetos `as const`, nunca `enum`. Las comparaciones usan el objeto (G6), y eso vale para `TIPO_ACCION.CONFIRMAR` y para los estados del LLM.
- Archivos en kebab-case, en la carpeta de su rol y con su sufijo (G5, G13 y G14). Las únicas excepciones sueltas son `src/tools/proveedor.ts`, `src/config/env.ts` y `src/config/strings.ts`. Para agregar `src/server.ts` hay que declararlo.
- Regex solo en `patterns.constants.ts` (G11). Texto legible solo en `src/config/strings.ts` (G8). Alias `@/` y `@tests/`, nunca rutas relativas (G1). El Dockerfile copia `tsconfig.json`.
- Nunca modificar `reto-01/`. Commits con Conventional Commits e identidad `elianatorres5772 <elianatorres5772@gmail.com>`.
- Una regla nueva de arquitectura se aplica **en la misma tarea** en `.claude/CLAUDE.md`, en `tests/architecture.test.ts` (con su prueba de violación) y en `docs/estructura.md` (patrón D-62).
- Dependencias: versiones exactas sin `^`, `bun.lock` commiteado, `--frozen-lockfile`, madurez de 7 días o más (D-35) y `npm view <pkg> time` más `bun audit` al instalar (D-31).

## Summary

La fase se apoya en un ciclo del agente que ya está listo: `crearAgente` devuelve `turno(entrada)`, un `AsyncGenerator` de eventos tipados que ya cubren los nombres SSE de API-01 (`turn_start`, `tool_start`, `tool_end`, `text`, `confirmation_required`, `usage`, `error`, `turn_end`). También ya existen `respuestaDeTurno` (fallback JSON), `EntradaTurno.signal` y una confirmación estructurada `{ aprobada, caso }`. El trabajo es una capa HTTP nueva (`src/http/**` más `src/server.ts`) con Hono 4.13.13, un chat React 19.3.0 + Vite 8.3.3 en `web/` y el despliegue Docker. Hay además **cinco cambios en el núcleo**: `accion` con cancelación de un solo caso (D-68/D-69), `caso` y `resultado` estructurado en los eventos de herramienta, una lectura de sesión que no la crea, dos decoradores LLM (salud y tope diario) y un puerto de artefactos.

Los spikes de esta sesión (Bun 1.4.3, Hono 4.13.13) cerraron la mitad local del research flag. **Bun corta un stream que pasa más de 10 s sin escribir** (`idleTimeout` por defecto), y el corte llega como aborto del cliente (`c.req.raw.signal` y `stream.onAbort`). Eso abortaría el turno y, por `cerrarTurno` (`abortado → estadoLibre`), **borraría las confirmaciones pendientes**. `c.env.timeout(c.req.raw, 0)` lo evita para SSE y para el fallback JSON (verificado). La desconexión real del cliente sí propaga el aborto en ~1 ms, lo que permite cortar el gasto. `streamSSE` pisa `Cache-Control` con `no-cache` y su `onError` escribe `e.message` crudo al cliente, así que hay que parchar los headers en la `Response` devuelta y nunca dejar que el generador lance. Del lado de Render no hay documentación: su borde usa Cloudflare (compresión Brotli) y, según reportes de usuarios, **agrega** al `X-Forwarded-For` del cliente en vez de reescribirlo. `Cache-Control: no-cache, no-transform` y el walking skeleton con `curl -N` en la primera ola resuelven lo que falta.

Dos supuestos de CONTEXT.md no se sostienen y el planner debe tratarlos. (1) `valores-portal.md` **lleva valores reales** (número de cuenta, SWIFT, correo y teléfono completos), así que su vista previa sale de `mapeo.json` (D-65 lo prevé). (2) `borrador-correo.md` **también lleva un valor del maestro en claro**: `contacto_financiero.nombre` (y el cargo), que el grep de PII de la Fase 1 permite a propósito en el borrador (`tests/e2e/pii.test.ts:32-34`). La política de PII lo enmascara como iniciales, así que mostrarlo en la vista previa contradice D-64. Además, HERR-01 y el guardián fijan exactamente 5 herramientas, así que "¿Qué casos hay?" no puede llevar una herramienta nueva: usa `leer_solicitud` con `caso: ""`, que ya devuelve `CASO_NO_ENCONTRADO` con `casos_disponibles`.

**Primary recommendation:** Construir primero el esqueleto `src/server.ts` → `src/http` → `/api/health` + `/api/chat` SSE (con `c.env.timeout(req, 0)`, latido de 8 s y `no-cache, no-transform`) y desplegarlo en Render en la ola 1 para probar `curl -N` y la forma de `X-Forwarded-For`. Después se agregan acceso, topes, sesiones, artefactos y el front sobre ese esqueleto ya validado.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stream SSE, latido, headers y timeout por request | API / Backend (`src/http`) | — | Es transporte. El ciclo emite eventos neutrales y no sabe de HTTP |
| Decidir confirmar o cancelar (`accion`) | API / Backend (`src/loop` + `domain/policies/compuerta`) | Browser (solo manda la intención) | La compuerta es del servidor (D-44, D-69). La UI nunca cierra una tarjeta por su cuenta |
| Resultado estructurado por caso (contadores, firma, bloqueos, ruta) | API / Backend (`src/loop`, desde el resultado de la herramienta) | Browser (pinta) | UI-SPEC prohíbe derivarlo del texto del modelo. El servidor ya tiene el JSON de la herramienta |
| Historial redactado y pendientes vigentes | API / Backend (`src/loop` proyección + `infra/sessions`) | Browser (rehidrata) | La sesión vive en memoria en el servidor (D-58) |
| Acceso (código, cookie HMAC, 401) | API / Backend (`src/http` middleware) | Browser (pantalla de acceso, sin guardar el código) | OWASP: la cookie `HttpOnly` no la lee el JS (D-72) |
| Topes (IP, sesión, turnos, sesiones nuevas, diario) | API / Backend (`src/http` + decorador `llm`) | — | El cliente no es confiable. El tope diario cuenta dentro del adaptador para incluir el fallback |
| Estado del LLM para health | API / Backend (decorador `llm` + `src/http/routes/health`) | Browser (banner) | Health no llama al LLM (D-71) y observa la última llamada real |
| Listado, descarga y vista previa de artefactos | API / Backend (`infra/output` vía puerto + `src/http`) | Browser (panel y diálogo) | El disco lo lee infra. La vista previa enmascarada sale de `mapeo.json` (D-65) |
| Render del chat, reducer y progreso por etapas | Browser / Client (`web/`) | — | Solo pinta eventos del servidor |
| SPA estática (`web/dist`) | API / Backend (Hono `serveStatic`) | CDN de Render/Cloudflare | Mismo origen, sin CORS y CSP `'self'` |
| Fecha efectiva y casos conocidos | API / Backend (`GET /api/config`) | — | UI-09: nunca del reloj del navegador |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| hono | **4.13.13** (2026-10-04, 10 días) | Rutas, `streamSSE`, `bodyLimit`, `bearerAuth`, `secureHeaders`, `getSignedCookie`/`setSignedCookie`, `serveStatic` (de `hono/bun`) y `app.request()` para tests | Elegido en STACK.md. Spikes de esta sesión: SSE, aborto, 413, cookie firmada, SPA fallback y CSP [VERIFIED: local spike Bun 1.4.3 + npm registry] |
| react / react-dom | **19.3.0** (2026-09-09) | Chat UI | Elección de la usuaria y del PRD. **No 19.3.1**: salió hoy (2026-10-14) junto con 19.0.9, 19.1.10, 19.2.9 y `react-server-dom-webpack` 19.3.1, el patrón de los parches de seguridad de RSC. Esta app no usa RSC [VERIFIED: npm registry; patrón RSC: ASSUMED] |
| vite | **8.3.3** (2026-10-06, 8 días) | Dev server con proxy `/api` y build de `web/dist` | **No 8.3.4** (2026-10-08, 6 días, no cumple D-35). `bun --bun vite build` construyó React 19.3.0 en 1.5 s sin scripts inline [VERIFIED: local spike + npm registry] |
| @vitejs/plugin-react | **6.1.2** (2026-10-05, 9 días) | JSX y refresh en Vite 8 | Peer `vite ^8` [VERIFIED: npm registry + local build] |
| eventsource-parser | **4.1.1** (2026-09-15) | Parseo SSE en el navegador sobre `fetch` (POST con body) | **No 4.1.2** (2026-10-12, 2 días). `eventsource-parser/stream` exporta `EventSourceParserStream` con `onComment` (sirve para observar el latido) y `maxBufferSize` [VERIFIED: local spike + npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react, @types/react-dom | **19.3.0** (2026-09-09) | Tipos | Siempre (devDependencies) [VERIFIED: npm registry, verdict OK] |
| zod 4.6.5, pino 10.3.1, @types/bun 1.4.2, typescript 7.0.2, @biomejs/biome 2.5.15 | ya fijados | Body, env, logs y chequeo | Sin cambio. `tsc` 7.0.2 compila `web/tsconfig.json` con `jsx: react-jsx`, DOM y `vite/client` [VERIFIED: local spike] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `serveStatic` de `hono/bun` (marcado `@deprecated`: "will be removed in v5. Install `@hono/bun`") | `@hono/bun` 1.0.1 | `@hono/bun` tiene 16 días (1.0.0 del 2026-09-28) y es una dependencia más. Con hono fijado en 4.13.13 la deprecación no rompe nada. Se cambia al migrar a v5 [VERIFIED: código de `hono/dist/adapter/bun/*.js` y npm registry] |
| `getConnInfo` de `hono/bun` | `c.env.requestIP(c.req.raw)` con `Bindings: Server` | Evita el import deprecado. Con `Bun.serve({ fetch: app.fetch })`, `c.env` **es** el `Server` [VERIFIED: local spike] |
| Limitador propio en memoria | `hono-rate-limiter` 0.5.x | Pre-1.0. Solo vale con Redis y varias instancias, y Render free tiene una (STACK.md) |
| `eventsource-parser` | Parser propio de ~40 líneas | El paquete ya cubre los cortes entre chunks, `\r\n`, comentarios y `data:` multilínea |

**Installation (fijar exacto, sin `^`):**
```bash
bun add --exact hono@4.13.13
bun add --exact --dev react@19.3.0 react-dom@19.3.0 eventsource-parser@4.1.1 vite@8.3.3 @vitejs/plugin-react@6.1.2 @types/react@19.3.0 @types/react-dom@19.3.0
bun audit --audit-level=moderate
```
React, react-dom y eventsource-parser van como **devDependencies** porque la SPA se construye en la etapa de build de Docker. La imagen final solo instala `--production` (zod, exceljs, pdf-lib, pino y hono). **Version verification:** `npm view` corrido el 2026-10-14. Con estas versiones exactas, `bun install` más `bun audit --audit-level=moderate` dio **"No vulnerabilities found (checked 53 packages)"** [VERIFIED: local spike].

## Package Legitimacy Audit

| Package | Registry | Age (versión fijada) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| hono | npm | 4.13.13: 10 días; proyecto de años | 74 M/sem | github.com/honojs/hono | SUS (`too-new`, por la última versión) | Flagged — checkpoint |
| react | npm | 19.3.0: 35 días | 188 M/sem | github.com/react/react | SUS (`too-new`: 19.3.1 de hoy) | Flagged — checkpoint |
| react-dom | npm | 19.3.0: 35 días | 177 M/sem | github.com/react/react | SUS (`too-new`) | Flagged — checkpoint |
| vite | npm | 8.3.3: 8 días | 195 M/sem | github.com/vitejs/vite | SUS (`too-new`) | Flagged — checkpoint |
| @vitejs/plugin-react | npm | 6.1.2: 9 días | 97 M/sem | github.com/vitejs/vite-plugin-react | SUS (`too-new`) | Flagged — checkpoint |
| eventsource-parser | npm | 4.1.1: 29 días | 84 M/sem | github.com/rexxars/eventsource-parser (ASSUMED) | SUS (`too-new`: 4.1.2 de hace 2 días) | Flagged — checkpoint |
| @types/react | npm | 19.3.0: 35 días | 171 M/sem | DefinitelyTyped | OK | Approved |
| @types/react-dom | npm | 19.3.0: 35 días | 146 M/sem | DefinitelyTyped | OK | Approved |

Ninguno tiene `postinstall` (`npm view <pkg> scripts.postinstall` vacío). Todos los SUS lo son **solo** por `too-new` sobre la última versión publicada. Son paquetes masivos con repo oficial, y las versiones fijadas cumplen D-35.

**Packages removed due to [SLOP] verdict:** ninguno.
**Packages flagged as suspicious [SUS]:** hono, react, react-dom, vite, @vitejs/plugin-react, eventsource-parser. El planner agrega **un** `checkpoint:human-verify` antes de instalarlos, el mismo "supply-chain gate" que aprobó 01-01. En él se vuelve a correr `npm view <pkg> time` y `bun audit`, y se confirma que 19.3.1 de React no corrige algo de `react-dom` cliente.

## Architecture Patterns

### System Architecture Diagram

```
 Navegador (web/, React 19)
   │  1) POST /api/acceso {codigo} ──────────────┐
   │  2) GET /api/config, /api/health            │
   │  3) POST /api/chat {sessionId,message,accion?} (fetch + EventSourceParserStream)
   │  4) GET /api/sessions/:id  (recarga, tras abortar)
   │  5) GET /api/casos/:caso/archivos[/…] , /vista-previa/…
   ▼                                              ▼
 Render edge (Cloudflare: TLS, Brotli; agrega a X-Forwarded-For)
   ▼
 src/server.ts ── Bun.serve({ fetch: app.fetch, hostname 0.0.0.0, port PORT })
   ▼
 src/http (Hono)
   secureHeaders(CSP 'self') → [/api/health: público] → acceso (cookie HMAC | Bearer)
   → JSON-only (Content-Type) → bodyLimit 16 KB → limitadores (IP chat, sesiones nuevas, cupos de turno, tope diario)
   ├─ /api/chat ── c.env.timeout(req,0) ──► Agente.turno({sesionId, mensaje, accion, signal})
   │                 │                          │ (src/loop: compuerta → LLM → herramientas)
   │                 │                          │     LLM: withDailyBudget(withHealthReport(withFallback(retry/obs/timeout)))
   │                 │                          │     herramientas: src/tools/proveedor.ts → out/<caso>/
   │                 ▼                          ▼
   │      SSE: redactar(evento) → writeSSE(event=tipo)  + ": ping" cada 8 s  ── o ── JSON respuestaDeTurno
   ├─ /api/sessions/:id ──► Agente.consultarSesion(id) → VistaSesion (historial proyectado + pendientes)
   ├─ /api/config ──► { fechaEjecucion (Reloj), casos (listCases), presupuestoSesion, zona }
   ├─ /api/casos/:caso/archivos ──► puerto LectorArtefactos (infra) → lista blanca D-66
   │        └─ descarga (archivo real, attachment) │ vista previa (mapeo.json enmascarado | texto)
   └─ /* ──► serveStatic(web/dist) → fallback index.html
```

### Recommended Project Structure

```
src/
├── server.ts                         # entrada: readServerEnv() → crearServidor() → Bun.serve (sufijo libre, declarado como suelto permitido)
├── http/
│   ├── wiring/servidor.wiring.ts     # 3er composition root: env, infra, crearAgente, logger, puertos
│   ├── routes/                       # *.route.ts: chat, sessions, health, access, config, artifacts
│   ├── middlewares/                  # *.middleware.ts: access, json-only, rate-limit, client-ip
│   ├── services/                     # *.service.ts: sse (proyección + latido), limitador (puro, reloj inyectado), cupos de turno, token de acceso
│   ├── schemas/                      # *.schema.ts: body de chat y de acceso (satisfies z.ZodType<T>)
│   └── types/                        # *.type.ts: DTOs del cable, Bindings (Server de Bun), opciones
├── loop/services/vista-sesion.service.ts, resultado-visible.service.ts   # proyecciones puras
├── llm/decorators/health-report.decorator.ts, daily-budget.decorator.ts
├── application/types/artefactos.type.ts                                   # puerto LectorArtefactos
├── infra/output/artifact-reader.adapter.ts                                # lista blanca, lectura, mapeo.json
└── config/constants/http.constants.ts (+ strings.ts)                     # cookies, latido, topes por defecto, estados LLM
web/
├── index.html, vite.config.ts, tsconfig.json
└── src/ main.tsx, app.tsx, api/ (cliente SSE y fetch), state/ (reducer puro), components/ (*.tsx kebab-case), config/strings.ts, styles/tokens.css
tests/http/*.test.ts (app.request), tests/web/*.test.ts (reducer puro), tests/seguridad/clave.test.ts (SEG-01)
Dockerfile, render.yaml, .dockerignore, .env.example
```

`src/server.ts` está en la estructura **sugerida** del PRD §6.5 ("`server.ts` # API HTTP y ciclo del agente") [VERIFIED: reto-01/PRD.md §6.5]. Que los evaluadores la busquen lo afirma ARCHITECTURE.md [ASSUMED]. El guardián hoy la prohíbe, así que hay que cambiarlo (ver "Guardianes").

**Idioma de `src/http`:** se recomienda inglés, como infra y los decoradores (es un adaptador), conservando el contrato del cable fijado por la usuaria (`accion`, `tipo`, `caso`, `mensaje`) y el del PRD (`sessionId`, `message`, `reply`, `toolCalls`, `needsConfirmation`). Esto es una regla nueva y se registra en `CLAUDE.md` y `docs/estructura.md` en la misma tarea [ASSUMED: la elección de idioma es discreción].

### Guardianes que hay que cambiar (en la misma tarea, patrón D-62)

Valores actuales, citados de `tests/architecture.test.ts` (leído en esta sesión):

- Línea 244: `const CAPAS_FUTURAS = /^src\/(?:server[^/]*|http)(?:\/|$)/;`. Hoy cualquier archivo en `src/http/` o `src/server*.ts` cae en la capa `"prohibida"` (línea 282). Hay que **quitar `http`** y dejar reservado solo `server` distinto de `src/server.ts`, o borrar la regla.
- Línea 46: `const PAQUETES_CON_CAPA = new Set(["zod", "exceljs", "pdf-lib", "pino"]);`. Hay que agregar `"hono"` para poder permitirlo solo en `http`.
- Líneas 63-88, `PERMITIDOS`. Hay que agregar `http` (`http`, `config-pure`, `domain`, tipos de `loop`/`application`, `zod`, `hono`), `wiring-http` (lo anterior más `config-env`, `infra`, `wiring-agente`) y `servidor` (`wiring-http`, `config-env`).
- Líneas 230-234, `SUELTOS_PERMITIDOS = new Set(["src/tools/proveedor.ts", "src/config/env.ts", "src/config/strings.ts"])`. Hay que agregar `src/server.ts`.
- Líneas 191-207, `CARPETAS_DE_ROL`. Hay que agregar `"http/routes": "route"`, `"http/middlewares": "middleware"`, `"http/services": "service"` y `"http/wiring": "wiring"`. Las regex de `types` y `schemas` (líneas 216 y 218) tienen que incluir `http`.
- Línea 283: `/^src\/(domain|application|infra|tools|demo|llm|loop)\//`. Hay que agregar `http` y reconocer por ruta exacta `src/http/wiring/servidor.wiring.ts` y `src/server.ts` (como en las líneas 276-277).
- **`web/` no lo escanea nadie.** `listarFuentes` (líneas 568-572) solo recorre `src/**/*.ts` más `demo.ts`, y `tests/sin-comentarios.test.ts:130-136` solo recorre `src` y `tests` con `*.ts`. Se recomienda un guardián nuevo para `web/src/**/*.{ts,tsx}`: sin comentarios; imports permitidos `react`, `react-dom`, `eventsource-parser`, `@/config/constants/**` (valores) y `import type` de `@/http/types/**`; prohibidos `dangerouslySetInnerHTML`, `import.meta.env`, `localStorage` fuera del módulo de sesión y `sessionStorage`. Cada regla con su prueba de violación.

### Pattern 1: Turno por SSE con timeout desactivado, latido y aborto

**What:** La ruta desactiva el idle timeout de Bun para ese request, enlaza el aborto del cliente con el turno, proyecta y redacta cada evento y manda `: ping` cada 8 s.
**When to use:** `POST /api/chat` sin `Accept: application/json`.
**Example (verificado por spike; nombres de constantes nuevos son propuestas):**
```typescript
// Fuente: spikes de esta sesión (hono/dist/helper/streaming/sse.js, Bun 1.4.3)
app.post("/api/chat", async (c) => {
  c.env.timeout(c.req.raw, 0);
  const entrada = chatBodySchema.safeParse(await c.req.json());
  if (!entrada.success) return c.json({ mensaje: MENSAJE_HTTP.cuerpoInvalido }, 400);
  const respuesta = streamSSE(c, async (stream) => {
    const corte = new AbortController();
    stream.onAbort(() => corte.abort());
    const latido = setInterval(() => void stream.write(SSE_LATIDO).catch(() => undefined), LATIDO_SSE_MS);
    try {
      for await (const evento of agente.turno({ ...aEntradaTurno(entrada.data), signal: corte.signal })) {
        await stream.writeSSE({ event: evento.tipo, data: JSON.stringify(redactar(evento, secretos)) });
      }
    } catch (error) {
      bitacora.error(EVENTO_HTTP.STREAM_FALLIDO, { error });
      await stream.writeSSE({ event: TIPO_EVENTO.ERROR, data: JSON.stringify(errorGenerico()) });
    } finally {
      clearInterval(latido);
      cupos.liberar();
    }
  });
  respuesta.headers.set("Cache-Control", "no-cache, no-transform");
  respuesta.headers.set("X-Accel-Buffering", "no");
  return respuesta;
});
```
Hechos verificados que justifican cada línea:
- `streamSSE` fija `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive` y `Transfer-Encoding: chunked` **antes** de crear la `Response`, y pisa cualquier `c.header` previo. Parchar `respuesta.headers` después funciona (`no-cache, no-transform` llegó al cliente) [VERIFIED: local spike].
- Sin `c.env.timeout(req, 0)`, 13 s de silencio con `idleTimeout: 10` cortaron el stream (curl exit 18) y dispararon `req.raw.signal ABORT` y `stream.onAbort`. Con `timeout(req, 0)`, el mismo silencio terminó bien [VERIFIED: local spike].
- Cortar el cliente (curl `--max-time 2.5`) disparó `req.raw.signal` y `onAbort` en el mismo milisegundo. El callback siguió hasta su `finally`, así que el bucle tiene que mirar la señal [VERIFIED: local spike].
- `writeSSE` parte `data` en líneas y valida que `event`/`id` no tengan saltos. `JSON.stringify` nunca emite saltos crudos [VERIFIED: código de hono].

### Pattern 2: Fallback JSON del PRD §6.4

**What:** Con `Accept: application/json` se recogen los eventos del mismo turno y se pliegan con `respuestaDeTurno` (`src/loop/services/respuesta-turno.service.ts:24-40`, ya existe), más `sessionId` (superset: el cliente necesita el id que emite el servidor).
**Clave:** también lleva `c.env.timeout(c.req.raw, 0)`. Sin eso, un turno de más de 10 s muere con exit 52 (respuesta vacía) [VERIFIED: local spike]. La señal del turno es `c.req.raw.signal`.

### Pattern 3: `accion` estructurada con cancelación de un solo caso (D-68, D-69)

Estado actual, citado verbatim:
- `src/loop/types/turno.type.ts:42-49`: `export type ConfirmacionEstructurada = { readonly aprobada: boolean; readonly caso: string };` y `EntradaTurno = { sesionId: string | null; mensaje: string; signal?: AbortSignal; confirmacion?: ConfirmacionEstructurada }`.
- `src/loop/services/ejecutar-turno.service.ts:52-60`: sin `confirmacion` clasifica el texto. Con `aprobada` devuelve `CONFIRMA` con el caso, y si no, `{ decision: DECISION_CONFIRMACION.RECHAZA }`.
- `src/domain/policies/compuerta.policy.ts:46-57`: `RECHAZA` devuelve `{ autorizado: null, siguiente: estadoLibre() }`, es decir, **cancela todos**. Un `CONFIRMA` de un caso no pendiente deja el estado igual.

Brechas contra D-68/D-69: (a) cancelar estructurado hoy cancela **todos** (D-69 pide uno); (b) una `accion` sobre un caso no pendiente hoy no pasa por el clasificador (D-68 pide tratarla "como texto normal").

Cambio recomendado:
1. Constante nueva `TIPO_ACCION = { CONFIRMAR: "confirmar", CANCELAR: "cancelar" } as const` en `confirmation.constants.ts`, registrada en `FAMILIAS_DE_CODIGOS` del guardián (G6). Esquema del body con `z.enum(TIPO_ACCION)` (G15).
2. `EntradaTurno.confirmacion` se reemplaza por `accion?: { tipo: ValorDe<typeof TIPO_ACCION>; caso: string }`.
3. Una variante nueva `DECISION_CONFIRMACION.CANCELA_CASO` con `caso` en `DecisionConfirmacion`. `abrirTurno` la resuelve con `estadoSin(estado, caso)` (la función ya existe, `compuerta.policy.ts:42-44`).
4. `decisionDe`: si `accion` está presente **y** `accion.caso ∈ casosPendientes(compuerta)`, devuelve `CONFIRMA` o `CANCELA_CASO`. En cualquier otro caso, `clasificarConfirmacion(entrada.mensaje, …)`. El clasificador nunca devuelve `CANCELA_CASO`, así que el corpus de D-63.x no cambia.
5. Hay que actualizar `tests/loop/compuerta-casos.test.ts:415-455` ("D-39: la confirmación estructurada…"): `{aprobada: false}` hoy "cancela lo pendiente" y pasa a cancelar solo ese caso. Con dos pendientes se prueba que el otro sigue. La prueba "con solo ec pendiente no autoriza nada" (línea 444) sigue igual, ahora vía clasificador.

### Pattern 4: `caso` y `resultado` estructurado en los eventos de herramienta

Hoy `EventoInicioHerramienta` (`evento.type.ts:16-22`) trae `herramienta` y `argumentos`, y `EventoFinHerramienta` (`:24-32`) trae `ok`, `codigo` y `resumen` (texto). UI-SPEC (punto 1 del contrato de datos) pide `caso` y un resumen estructurado y redactado.

Recomendación: agregar `caso: string | null` a ambos (de `casoDeLlamada`, `despacho-llamada.service.ts:21-24`) y `resultado: ResultadoVisible | null` a `tool_end`, con lectura zod tolerante de `resultado.respuesta` según la herramienta. Los datos ya existen en los tipos de aplicación:
- `DatosSolicitud` (`leer-solicitud.type.ts:5-14`): `pais`, `cliente`, `formato`.
- `DatosMapeo` (`mapear-campos.type.ts:6-14`): `conteo`.
- `DatosFormulario` (`generar-formulario.type.ts:11-17`): `ruta`, `formato`, `conteo`, `aviso`.
- `DatosPaquete` (`armar-paquete.type.ts:13-20`): `ruta`, `listo_para_firma`, `bloqueos`, `checklist`.
- `DatosEnvio` (`simular-envio.type.ts:3-7`): `ruta`, `bloqueos`.

Los `bloqueos` de las herramientas y de `confirmation_required` son ids crudos (el log muestra `"BLOQUEADO (ausente: certificado_cumplimiento_tributario)"`). La forma legible ya existe: `motivosDeBloqueo({ motivos_bloqueo: motivos })`, usada en `cierre-turno.builder.ts:10-19`. UI-SPEC pide "bloqueos legibles", así que se recomienda proyectar los legibles en `resultado` y en `confirmation_required` (hoy `cierre-turno.service.ts:15` pasa `pendiente.bloqueos` crudo). La **misma** función de proyección se reutiliza en la hidratación (patrón 5).

### Pattern 5: Lectura de sesión sin crearla y vista redactada

Puerto actual (`src/application/types/puertos-agente.type.ts:11-16`): `abrir(id)`, `ocupar(id, plazoMs)`, `liberar(id, candado)`, `guardar(sesion, candado)`. **`abrir` crea una sesión nueva ante un id desconocido** (`memory-session-store.adapter.ts:48-55`), así que no sirve para un GET.

Recomendación:
- `AlmacenSesiones.leer(id): { sesion: S; ocupada: boolean } | null`. No crea ni renueva el TTL (decisión discrecional) y respeta el `sweep`.
- `Agente.consultarSesion(id)` devuelve `VistaSesion`: los turnos agrupados por cada `MensajeUsuario` del `historial`; por herramienta, nombre, `caso`, args redactados, `ok`, `codigo`, `resumen` y `resultado` (proyectado del `contenido` del mensaje `herramienta`); el texto final del asistente; `pendientes` (`pendientesDe(compuerta)` con bloqueos legibles); `tokensUsados`; y `ocupada`. **Nunca** `razonamiento` ni el mensaje de sistema. Todo pasa por `redactar(…, secretos)`.
- `Agente.existeSesion(id)` sirve para contar "sesión nueva" **antes** del turno (D-73.5).
- `ocupada: true` deja que la UI reintente una vez tras un "Detener" (el turno abortado se guarda en el `finally` mientras tiene el candado).

Las tarjetas de confirmación resueltas de turnos viejos no se pueden reconstruir del historial, que no guarda los eventos `confirmation_required`. Al recargar se pintan las vigentes con botones y "Envío registrado" donde haya un `simular_envio` ok [ASSUMED: alcance aceptable; ver Open Questions].

### Pattern 6: Salud del LLM y tope diario como decoradores

Hoy el adaptador se arma en `agente.wiring.ts:84-87`: `withFallback(resiliente(primario), respaldoDe(...), avisarCambio)`. `withFallback` solo cambia de ranura ante un error `reintentable` (`fallback.decorator.ts:12-18`).

- `withHealthReport(base, monitor)` (`llm/decorators/health-report.decorator.ts`) envuelve el adaptador ya con fallback. Con `ok` publica `disponible`, con `TIPO_ERROR_LLM.SALDO` publica `saldo_agotado` y con otro error que no sea `ABORTADO` publica `no_disponible`. Afuera del fallback, un error significa que el primario y el respaldo se agotaron (o que el error no era reintentable).
- `withDailyBudget(base, contador)` va **por fuera de todo**, para sumar `uso.entrada + uso.salida` de cada respuesta ok, incluida la del respaldo y la llamada final del tope de iteraciones. Antes de llamar, si el contador del día ya pasó el tope, devuelve `{ ok: false, error: { tipo: TIPO_ERROR_LLM.TOPE_DIARIO, reintentable: false, … } }`. Es un tipo nuevo que mapea a un `CODIGO_AGENTE` nuevo con su mensaje en `MENSAJE_AGENTE` (por `CODIGO_AGENTE_POR_ERROR_LLM`, `agent.constants.ts:59-70`, que exige cubrir cada tipo con `satisfies Record<…>`).
- **Llave del día:** `systemClock(TZ_NEGOCIO).hoy()` (`clock.adapter.ts:25-37`), **nunca** `clockFromToolEnv` (`:44-48`), que con `FECHA_EJECUCION=2026-09-03` devuelve siempre la misma fecha y el contador no se reiniciaría jamás.
- Los estados del monitor y del contador los crea `agente.wiring.ts` y se exponen como `Agente.estadoLlm()`. `sin_clave` sale de `crearAgente` → `{ ok: false, codigo: CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE }` (`agente.wiring.ts:136-139`): el servidor arranca igual y health lo reporta.
- La capa `llm` solo importa `llm`, config pura y zod, así que el reloj y el tope llegan inyectados.
- **Health siempre responde 200 con `ok: true`** (el servidor vive), aunque `llm ≠ disponible`. Si respondiera 5xx, Render daría el deploy por fallido o reiniciaría el servicio [ASSUMED: comportamiento estándar de health checks de Render].

### Pattern 7: Acceso con cookie HMAC y vencimiento dentro del valor

```typescript
// Fuente: spike de esta sesión (hono/cookie 4.13.13)
await setSignedCookie(c, NOMBRE_COOKIE_ACCESO, `${VERSION_TOKEN}.${vence}`, secretoHmac, {
  httpOnly: true, secure: cookieSegura, sameSite: "Strict", path: "/api", maxAge: segundosDeVigencia,
});
const valor = await getSignedCookie(c, secretoHmac, NOMBRE_COOKIE_ACCESO);
```
- `getSignedCookie` verifica con `crypto.subtle.verify` (HMAC-SHA256, tiempo constante) y devuelve `false` si se adulteró y `undefined` si no hay cookie. **No guarda vencimiento**: `Max-Age` solo lo cumple el navegador. Hay que meter `vence` en el valor y compararlo en el servidor. El spike dio 401 al adulterar y al vencer [VERIFIED: local spike].
- La cookie emitida quedó así: `acceso=v1.<exp>.<firma>; Max-Age=43200; Path=/api; HttpOnly; Secure; SameSite=Strict` [VERIFIED: local spike]. No se puede usar el prefijo `__Host-` porque exige `Path=/`.
- El Bearer para `curl` se compara con el `timingSafeEqual` de hono (`bearerAuth` hashea ambos lados con SHA-256 y compara en tiempo constante) [VERIFIED: código `hono/dist/utils/buffer.js`]. Un middleware propio acepta cookie **o** Bearer.
- El intento de `/api/acceso` también se compara en tiempo constante y solo los **fallidos** cuentan para el tope de 5 cada 15 min.
- Env nuevas en `config/env.ts`: código de acceso (obligatorio), secreto HMAC (obligatorio en producción; en desarrollo puede generarse uno efímero al arrancar), vigencia en horas (12) y modo de entorno (`production` fuerza `secure: true`) [ASSUMED: nombres exactos a decidir por el planner].
- Con el proxy de Vite, `Set-Cookie` de `/api/acceso` llega al origen `localhost:5173`. La cookie no distingue puertos y con `SameSite=Strict` se reenvía en los fetch a `/api/*`. Chrome y Firefox aceptan `Secure` en `http://localhost`, Safari no [ASSUMED: verificar en el primer `bun run dev`].

### Pattern 8: Topes en memoria e IP real

- **Límite de body:** `bodyLimit({ maxSize: 16 * 1024, onError: (c) => c.json({ mensaje }, 413) })` cortó un body de 20 KB con 413 antes del parse [VERIFIED: local spike]. El largo del mensaje (2000) se valida con zod después y responde 413 con el texto de UI-SPEC.
- **Content-Type:** un middleware rechaza con 415 todo POST que no sea `application/json` (CSRF, D-72).
- **Limitador propio** (servicio puro con reloj inyectado, ventana fija o deslizante en un `Map` con limpieza): un bucket por IP para `/api/chat` (10/min), uno de fallos de `/api/acceso` (5/15 min) y uno de sesiones nuevas por IP (5/h, contado solo si `sessionId` es null o `!existeSesion(id)`).
- **Cupos de turno:** contador global (3) adquirido antes del turno y liberado en el `finally` del stream. El tope por sesión ya existe (`SESION_OCUPADA` vía `ocupar`).
- **IP:** `X-Forwarded-For` contado **desde la derecha** con saltos de proxy configurables. Si falta el header o el índice queda fuera, se usa el socket (`c.env.requestIP(c.req.raw)`, que en el spike devolvió `127.0.0.1` mientras el XFF falsificado decía `1.2.3.4, 5.6.7.8`) [VERIFIED: local spike].
  - Render: un usuario reportó en 2024 que su proxy **no limpia** el XFF del cliente y solo agrega, así que el primer valor es falsificable. Un empleado de Render dijo en 2021 que "we set the first IP in the list to the real client IP". Las dos fuentes se contradicen y ninguna es documentación [CITED: feedback.render.com/features/p/send-the-correct-xforwardedfor, LOW].
  - Por eso: el valor por defecto es 1 salto desde la derecha, y el walking skeleton lo confirma con `curl -H "X-Forwarded-For: 203.0.113.9"` registrando (solo en un log de depuración temporal) la forma del header. PITFALLS.md recomendaba "the first X-Forwarded-For hop on Render", que contradice D-73 y esta evidencia, así que **no** se sigue.

### Pattern 9: Artefactos con lista blanca y vista previa enmascarada

Nombres (citados de `src/config/constants/files.constants.ts:34-45`): `ARCHIVOS_SALIDA = { MAPEO: "mapeo.json", FORMULARIO_XLSX: "formulario.xlsx", FORMULARIO_PDF: "formulario.pdf", VALORES_PORTAL: "valores-portal.md", ENVIO_SIMULADO: "ENVIO-SIMULADO.md" }` y `ARCHIVOS_PAQUETE = { CHECKLIST: "checklist.md", BORRADOR_CORREO: "borrador-correo.md" }`. `DIRECTORIO_PAQUETE = "paquete"` (línea 32).

- **Hallazgo 1 (D-65):** `out/pa-logistica-istmo/valores-portal.md` tiene una tabla `| Etiqueta | Valor | Estado | Nota |` con valores **completos**: `| Número de cuenta | 03100012345 | lleno |  |`, `| SWIFT | COLOCOBM | lleno |  |`, `| Correo electrónico | lgomez@periferia-ficticia.com | lleno |  |`, `| Teléfono | +57 604 555 0100 | lleno |  |` y `| Representante legal | Roberto Andrade Salazar | lleno |  |` [VERIFIED: lectura de out/pa-logistica-istmo/valores-portal.md]. El test de PII de la Fase 1 no lo escanea: `ARCHIVOS_ESCANEADOS` (`tests/e2e/pii.test.ts:21-28`) solo incluye `log.jsonl`, `mapeo.json`, `paquete/checklist.md`, `paquete/borrador-correo.md` y `ENVIO-SIMULADO.md`. **Su vista previa sale de `mapeo.json`.** Lo mismo vale para su copia `paquete/valores-portal.md`, que existe en ese caso.
- **Hallazgo 2 (D-64, no previsto en CONTEXT):** `borrador-correo.md` firma con `contacto_financiero.nombre` y su cargo completos ("Camila Ortiz Vélez", "Analista Administrativa"). Lo permite a propósito `permitidaEn` (`pii.test.ts:32-34`) con `RUTAS_BORRADOR = [RUTA_MAESTRO.RAZON_SOCIAL, RUTA_MAESTRO.CONTACTO_FINANCIERO_NOMBRE, RUTA_MAESTRO.CONTACTO_FINANCIERO_CARGO]` (`maestro.constants.ts:13-17`). La política de PII enmascara ese nombre como `iniciales` (`pii.constants.ts:42-45`). Recomendación: en la vista previa del borrador, el servidor reemplaza cada valor no público de `RUTAS_BORRADOR`, leído del maestro, por `enmascarar(ruta, valor)`. La descarga sigue intacta (D-64) [ASSUMED: requiere confirmación de la usuaria; ver Open Questions].
- `checklist.md` y `ENVIO-SIMULADO.md` sí están cubiertos por el grep de PII y se previsualizan como texto plano.
- `mapeo.json` trae por campo `etiqueta`, `estado`, `valor_enmascarado` (por ejemplo `"•••••3456"`, `"[dato oculto]"`, `null` si es faltante) y `nota` [VERIFIED: lectura de out/ec-corp-andina/mapeo.json]. Es la fuente exacta de la tabla de la vista previa.
- **Lista servible:** los nombres fijos de D-66 que existan, más los soportes de `paquete/` (los `.txt` que lista `listPackage`). La copia `paquete/formulario.*` y `paquete/valores-portal.md` son duplicados. Se recomienda no listarlos en el panel (decisión discrecional).
- **Validación:** `caso` contra `PATRON_CASO` (`patterns.constants.ts:3`, `^[a-z0-9-]{1,N}$`) **y** contra `listCases(raiz)` (`case-resolver.adapter.ts:27-37`). La ruta pasa por `realCaseDirectory`/`realPackageDirectory` (`safe-paths.util.ts:31-48`, con contención por `realpath`). El nombre debe estar en la lista blanca calculada; nunca se concatena lo que manda el cliente.
- **Descarga:** `Content-Disposition: attachment`, `Content-Type` por extensión y `nosniff` (de `secureHeaders`). El archivo sale por stream con `Bun.file` desde infra.
- **Arquitectura:** puerto `LectorArtefactos` en `application/types`, implementación en `infra/output/artifact-reader.adapter.ts` e inyección desde `servidor.wiring.ts`. La capa HTTP no toca `node:fs`.

### Pattern 10: Front con `useReducer` sobre eventos del servidor

- `fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body, signal })`, después `res.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream({ onComment }))`. Cada mensaje se despacha al reducer.
- "Detener respuesta" hace `abort()` sobre el `AbortController` del fetch. **El cliente no recibe `turn_end`**, así que después del aborto hace `GET /api/sessions/:id` (reintentando una vez si `ocupada`) para reconciliar. El servidor dejó la compuerta libre (`cerrarTurno` con `abortado` → `estadoLibre()`, `compuerta.policy.ts:119-120`), y las tarjetas abiertas tienen que desaparecer.
- Envíos solo por acción de la usuaria, nunca en `useEffect` (StrictMode duplica efectos en desarrollo y duplicaría gasto).
- El reducer y los selectores van en módulos `.ts` puros, probados con `bun test` sin DOM (`tests/web/*.test.ts`). Los componentes `.tsx` se verifican a mano (end-of-phase).
- Constantes compartidas: `web/` importa de `src/config/constants/**` (config pura: sin `node:`, `Bun` ni zod, G9), con alias en `web/tsconfig.json` y `resolve.alias` de Vite, más `import type` de `src/http/types/**`. Así no se duplican `TIPO_EVENTO`, `NOMBRE_VISIBLE`, `ESTADO_CAMPO` ni los estados del LLM.

### Pattern 11: SEG-01 verificable

- **Build:** el test corre `vite build` con `LLM_API_KEY`, el código de acceso y el secreto HMAC puestos a valores centinela en el entorno del proceso de build, hacia un `outDir` temporal, y busca los centinelas en todos los archivos de salida. Vite solo inyecta `VITE_*`, así que no deberían aparecer [CITED: PITFALLS.md Pitfall 9].
- **API y SSE:** `crearServidor({ fuenteEntorno: { LLM_API_KEY: CLAVE_PRUEBA, … }, fetch: fetchFalso })` más `app.request()` sobre health, config, sessions, chat SSE, chat JSON, archivos y errores (incluido un 402 falso del proveedor). Ningún header ni body contiene `CLAVE_PRUEBA` (ya existe en `tests/helpers/agente-fetch.helper.ts`), el código ni el secreto.
- **Repo:** cada línea de `.env.example` es `NOMBRE=` sin valor, y ninguna variable secreta lleva prefijo `VITE_`.
- **Defensa en profundidad:** `redactar(evento, secretos)` sobre cada evento saliente, con el código de acceso y el secreto HMAC agregados a `secretos` y a la redacción de pino.

### Pattern 12: Dockerfile y `render.yaml`

```dockerfile
FROM oven/bun:1.4.3-slim AS build
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile
COPY web ./web
COPY src/config ./src/config
COPY src/http/types ./src/http/types
RUN bun --bun vite build --config web/vite.config.ts

FROM oven/bun:1.4.3-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile --production
COPY src ./src
COPY agent ./agent
COPY reto-01/fixtures ./reto-01/fixtures
COPY --from=build /app/web/dist ./web/dist
RUN mkdir -p out && chown -R bun:bun /app
USER bun
EXPOSE 10000
CMD ["bun", "src/server.ts"]
```
- El tag `oven/bun:1.4.3-slim` existe (amd64 y arm64, actualizado 2026-10-10) [VERIFIED: Docker Hub API]. Su Dockerfile crea el usuario `bun` pero **no** declara `USER`, así que el contenedor corre como root salvo que se agregue `USER bun`. `WORKDIR` por defecto es `/home/bun/app` [VERIFIED: github.com/oven-sh/bun dockerhub/debian-slim/Dockerfile]. Con `USER bun`, `out/` tiene que ser del usuario porque las herramientas escriben bajo `ctx.directory`.
- **La raíz del proyecto** (`ctx.directory`) la pasa el servidor: `resolveRoot(directorio)` solo hace `resolve(directorio)` (`fixtures-reader.adapter.ts:24-26`). `src/server.ts` la deriva de `import.meta.url` (dos niveles arriba), como hace `demo.ts` con `import.meta.dir`. No conviene usar `process.cwd()`, que depende de cómo se arranque el proceso.
- `FIXTURES_DIR = "reto-01/fixtures/reto-01"` (`files.constants.ts:3`) se resuelve desde la raíz, así que hay que copiar `reto-01/fixtures` (no `reto-01/PRD.md`).
- `.dockerignore` hoy contiene `node_modules/`, `out/`, `.env`, `.env.*`, `!.env.example`, `.DS_Store`, `*.log`, `web/dist/`, `.git`, `.planning` y `tests`. Conviene sumar `.qa`, `.codegraph`, `.gsd`, `.claude`, `.agents` y `web/node_modules`.
- `render.yaml`: `type: web`, `runtime: docker`, `plan: free`, `healthCheckPath: /api/health` y `envVars` con `FECHA_EJECUCION` = `2026-09-03` y `TZ_NEGOCIO`. Los secretos (`LLM_API_KEY` o `DEEPSEEK_API_KEY` y el código de acceso) van con `sync: false`, y el secreto HMAC con `generateValue: true`, que genera "a randomized, base64-encoded, 256-bit value" [CITED: render.com/docs/blueprint-spec]. `PORT` lo inyecta Render (10000 por defecto) y el servidor escucha en `0.0.0.0` [CITED: render.com/docs/web-services].

### Anti-Patterns to Avoid

- **Dejar el `idleTimeout` por defecto en `/api/chat`:** corta a los 10 s y aborta el turno, lo que borra las confirmaciones pendientes.
- **`c.header("Cache-Control", …)` antes de `streamSSE`:** se pisa. Hay que parchar la `Response`.
- **Confiar en `onError` de `streamSSE`:** escribe `data: e.message` al cliente (fuga de detalles internos) y, sin `onError`, hace `console.error(e)` saltándose pino y la redacción. Se usa `try/catch` propio dentro del callback.
- **`X-Forwarded-For[0]` en Render:** es falsificable.
- **Contar el tope diario con `clockFromToolEnv().hoy()`:** la fecha está fijada y el contador nunca se reinicia.
- **Health que devuelve 5xx cuando el LLM está caído:** Render reinicia el servicio o rechaza el deploy.
- **Leer `Bun.env.PORT` en `src/server.ts`:** rompe G10. Se lee en `config/env.ts`.
- **Renderizar texto del agente o `.md` con HTML:** está prohibido `dangerouslySetInnerHTML` (UI-SPEC). Todo va como texto `pre-wrap`.
- **Una sexta herramienta `listar_casos`:** rompe HERR-01 y la prueba `proveedor.ts exporta exactamente las cinco herramientas`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Marcos SSE en el servidor | Escritura manual `event:/data:` | `streamSSE` + `writeSSE` de hono | Parte `data` multilínea y valida `event`/`id` |
| Parseo SSE en el navegador | Splitter de `\n\n` | `EventSourceParserStream` | Cortes entre chunks, `\r\n`, comentarios y límite de buffer |
| Firma de la cookie | HMAC a mano con `createHmac` + comparación con `===` | `setSignedCookie`/`getSignedCookie` | `crypto.subtle.verify` es de tiempo constante |
| Comparar el código de acceso | `a === b` | `timingSafeEqual` de hono (o `node:crypto` sobre digests en infra) | Ataque de tiempo |
| Límite de body | Leer el body y medir | `bodyLimit` | Corta por `Content-Length` y por stream sin cargar todo |
| Headers de seguridad y CSP | Lista manual | `secureHeaders({ contentSecurityPolicy })` | Defaults probados (HSTS, nosniff, COOP, CORP, `X-Frame-Options`) |
| Servir la SPA con fallback | Resolver rutas de archivo a mano | `serveStatic` (`hono/bun`) + fallback a `index.html` | El spike mostró que `/..%2f..%2fpackage.json` cae en el fallback, no en el archivo |
| Contención de rutas en `out/` | `path.join` + `startsWith` nuevo | `safe-paths.util.ts` (`realpath` + `isInside`) | Ya está probado contra symlinks y traversal |
| Redacción de secretos | Regex nuevas | `redactar(valor, secretos)` (`redaccion.policy.ts:51-57`) | Ya maneja ciclos, `Error` y `CLAVES_SENSIBLES` |
| Enmascarar valores | Máscaras nuevas | `enmascarar(ruta, valor)` (`pii.policy.ts:56-58`) | La misma política del chat (D-47) |

**Key insight:** casi todo lo de seguridad ya existe en el repo (redacción, máscaras, rutas seguras) o en hono (firma, comparación constante, límites y headers). El riesgo real está en **cómo se combinan** (orden de middlewares, `timeout(req, 0)`, headers después de `streamSSE`), y eso se cubre con tests `app.request()`.

## Runtime State Inventory

No aplica: la fase no renombra ni migra nada. Las sesiones viven en memoria (D-58) y `out/` es efímero en Render.

## Common Pitfalls

### Pitfall 1: El idle timeout de Bun corta el turno y borra las confirmaciones
**What goes wrong:** Una llamada al LLM tarda más de 10 s sin bytes, Bun cierra la conexión, el turno recibe aborto y `cerrarTurno` deja la compuerta en `LIBRE`.
**Why it happens:** `idleTimeout` vale 10 s por defecto y cuenta durante el streaming. El corte se ve igual que una desconexión del cliente (verificado).
**How to avoid:** `c.env.timeout(c.req.raw, 0)` en `/api/chat` (SSE y JSON) más un latido cada 8 s, por debajo de los 10 s de Bun como red de seguridad y lejos de cualquier timeout de proxy. Un test de contrato con un LLM falso que espere 12 s no es viable en `app.request()` (no hay socket), así que se prueba con un `Bun.serve` real en puerto efímero dentro de `tests/http`.
**Warning signs:** "Pensando…" que muere a los ~10 s en local y tarjetas que desaparecen solas.

### Pitfall 2: Buffering o compresión en el borde de Render
**What goes wrong:** Los eventos llegan todos juntos al final.
**Why it happens:** Render usa Cloudflare (Brotli). Comprimir un stream junta los chunks [CITED: hilo de Render sobre Brotli; reporte análogo en Railway, LOW].
**How to avoid:** `Cache-Control: no-cache, no-transform` y `X-Accel-Buffering: no`. Walking skeleton en la ola 1 con `curl -N` midiendo que `turn_start` llegue antes que `turn_end`. Plan B (fallback JSON, después Koyeb o Fly) según el research flag.
**Warning signs:** En `curl -N` contra Render todo aparece de golpe.

### Pitfall 3: Recargar o cerrar la pestaña a mitad del turno lo aborta
**What goes wrong:** La analista recarga mientras corre "procesa los 4 casos". El turno se aborta, se guarda como `TURNO_INTERRUMPIDO` y las confirmaciones pendientes se pierden.
**Why it happens:** Es la semántica de la Fase 2 (aborto del llamante → `abortado` → `estadoLibre`), elegida por costo.
**How to avoid:** Se mantiene, porque no gastar tokens sin nadie mirando es lo que pidió la usuaria. La UI lo deja visible al rehidratar (el último turno termina con el aviso de interrupción) y SOLUCION.md lo documenta.
**Warning signs:** Al recargar no hay tarjeta de confirmación aunque el paquete se armó.

### Pitfall 4: Cloudflare 524 en el fallback JSON
**What goes wrong:** Un turno largo con `Accept: application/json` no manda headers hasta terminar. Cloudflare corta con 524 si el origen no responde dentro del "Proxy Read Timeout" de 125 s [CITED: developers.cloudflare.com error 524, LOW sobre si aplica igual en Render].
**Why it happens:** `AGENT_TURN_DEADLINE_MS` vale 120 000 (`agent.constants.ts:74`), apenas debajo de 125 s.
**How to avoid:** SSE es el camino principal (los headers salen al instante). El JSON queda para `curl` y pruebas. Si se usa en Render, conviene un deadline menor por env.
**Warning signs:** 524 solo en turnos de varios casos.

### Pitfall 5: "Procesar los 4 casos" cerca del deadline del turno
**What goes wrong:** Cuatro casos son ~17 tool calls. Con DeepSeek en 0.1 CPU (Render free) y exceljs y pdf-lib, el turno puede pasar de 120 s y cerrar con `TIEMPO_TURNO_AGOTADO`.
**How to avoid:** Medir en el walking skeleton y en el ensayo. El modelo puede emitir varias `tool_calls` por respuesta, y el ciclo ya las ejecuta en serie dentro de un paso. Si hace falta, se ajusta el deadline por env [ASSUMED: tiempos no medidos en Render].
**Warning signs:** `turn_end` con motivo `error` y código de tiempo agotado en el ensayo.

### Pitfall 6: Vista previa que filtra PII
**What goes wrong:** Previsualizar `valores-portal.md` o `borrador-correo.md` tal cual muestra el número de cuenta, el SWIFT o el nombre completo.
**How to avoid:** Patrón 9 (hallazgos 1 y 2), con un test que recorra las vistas previas de los 4 casos y busque los valores sensibles del maestro (reutilizando `sensiblesDelProyecto` de `tests/helpers/pii.helper.ts`).

### Pitfall 7: `accion` sobre un caso no pendiente que autoriza o cancela de más
**What goes wrong:** Un botón viejo (otra pestaña o una tarjeta ya resuelta) manda `accion` sobre un caso que ya no está pendiente.
**How to avoid:** D-68: si el caso no está en `casosPendientes`, se ignora la `accion` y se clasifica el texto visible. Hay tests para confirmar y cancelar un caso no pendiente, y para cancelar uno entre dos.

### Pitfall 8: Contador de sesiones nuevas evadible
**What goes wrong:** Mandar un `sessionId` inventado crea una sesión nueva (`abrir` crea ante un id desconocido), y si solo se cuentan los `null` el tope se evade.
**How to avoid:** Se cuenta como nueva toda petición con `sessionId` null **o** con `!existeSesion(id)`, antes de llamar a `turno`.

### Pitfall 9: Errores HTTP sin `mensaje` o con detalles internos
**How to avoid:** Un `app.onError` y `app.notFound` globales devuelven `{ mensaje }` desde `strings.ts`, con el error completo solo en pino (redactado). UI-SPEC punto 6.

## Code Examples

### Middleware de acceso (cookie o Bearer)
```typescript
// Fuente: API verificada de hono/cookie y hono/utils/buffer 4.13.13 (spike)
export function exigirAcceso(config: AccessConfig): MiddlewareHandler<HttpEnv> {
  return async (c, next) => {
    const portador = c.req.header("Authorization");
    if (portador !== undefined && (await codigoValido(portador, config))) return next();
    const valor = await getSignedCookie(c, config.hmacSecret, NOMBRE_COOKIE_ACCESO);
    if (typeof valor === "string" && tokenVigente(valor, config.ahora())) return next();
    return c.json({ mensaje: MENSAJE_HTTP.accesoVencido }, 401);
  };
}
```

### Proyección del evento con `caso` y resultado visible (loop)
```typescript
// Fuente: tipos existentes (evento.type.ts:24-32, armar-paquete.type.ts:13-20)
yield {
  tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
  ...base,
  caso: casoDeLlamada(llamada),
  ok: resultado.ok,
  codigo: resultado.codigo,
  resumen: resultado.resumen,
  resultado: resultadoVisible(llamada.nombre, resultado.respuesta),
};
```

### Cliente SSE en el navegador
```typescript
// Fuente: eventsource-parser 4.1.1 (dist/stream.d.ts), verificado por build
const res = await fetch(RUTA_API.chat, { method: "POST", headers: CABECERAS_JSON, body, signal });
if (!res.ok || res.body === null) return despacharErrorHttp(res);
const eventos = res.body
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new EventSourceParserStream({ onComment: () => despachar({ tipo: ACCION_UI.LATIDO }) }));
for await (const mensaje of eventos) despachar(eventoDelServidor(mensaje.event, mensaje.data));
```

### `bun run dev`
```json
"dev": "bun run --parallel dev:api dev:web",
"dev:api": "bun --watch src/server.ts",
"dev:web": "bun --bun vite --config web/vite.config.ts",
"build:web": "bun --bun vite build --config web/vite.config.ts",
"check": "tsc --noEmit && tsc --noEmit -p web/tsconfig.json && biome check . && bun audit --audit-level=moderate"
```
`--parallel` y `--watch` existen en `bun run --help` de 1.4.3 [VERIFIED: local]. El proxy de Vite `server.proxy: { "/api": "http://localhost:3000" }` evita CORS en desarrollo [CITED: STACK.md].

## Reformulación de LLM-06 (D-70)

Texto propuesto para `REQUIREMENTS.md`:
> **LLM-06**: `/api/health` reporta la disponibilidad del LLM (`disponible`, `sin_clave`, `saldo_agotado`, `no_disponible` o `tope_diario`) sin llamar al modelo ni exponer claves, y la UI muestra un aviso claro cuando no está disponible. El flujo sin modelo se corre con `demo.ts`.

Criterio 4 del ROADMAP, segunda oración:
> Si no hay clave, se agotó el saldo, el proveedor cayó o se alcanzó el tope diario, `/api/health` lo reporta y la UI muestra un aviso claro; el flujo sin modelo sigue disponible con `demo.ts`.

API-03 también cambia de forma: pasa a `{ ok: true, provider, model, llm }`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `serveStatic`/`getConnInfo` desde `hono/bun` | `@hono/bun` aparte | hono 4.13 (deprecación) y 5.0 (rc del 2026-10-08) | Funciona fijado en 4.13.13. Al migrar a v5 hay que cambiar el import |
| `EventSource` nativo | `fetch` + `EventSourceParserStream` | — | POST con body y cookie en el mismo origen |
| Token en `localStorage` | Cookie `HttpOnly` firmada | práctica OWASP vigente | El JS no puede leer el acceso (D-72) |

**Deprecated/outdated:**
- `hono/bun`: marcado `@deprecated`, "will be removed in v5".
- PITFALLS.md "first X-Forwarded-For hop on Render": reemplazado por contar desde la derecha (D-73 y evidencia de esta sesión).
- STACK.md "heartbeat cada 15 s": insuficiente sin `timeout(req, 0)` por el idle de 10 s de Bun. Se recomiendan 8 s más `timeout(req, 0)`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React 19.3.1 es un parche de RSC que no afecta a `react-dom` cliente | Standard Stack | Si corrige algo de `react-dom` cliente, habría que esperar 7 días o excepcionar D-35 con la aprobación de la usuaria |
| A2 | El proxy de Render agrega una sola IP a la derecha de XFF | Pattern 8 | Rate limit por IP mal calculado (bucket compartido o falsificable). Se mitiga verificándolo en el walking skeleton |
| A3 | `Cache-Control: no-transform` desactiva la compresión de Cloudflare en Render | Pitfall 2 | SSE con buffering. Plan B: fallback JSON y Koyeb o Fly |
| A4 | Render trata un health no 2xx como deploy fallido o reinicia | Pattern 6 | Bajo: health responde 200 igual |
| A5 | Enmascarar `RUTAS_BORRADOR` en la vista previa del borrador es lo que quiere la usuaria | Pattern 9 | Si no, se muestra el nombre del firmante completo (contradice D-64 al pie de la letra) |
| A6 | Safari rechaza cookies `Secure` en `http://localhost` | Pattern 7 | Solo afecta al desarrollo local. El flag es configurable |
| A7 | Las tarjetas resueltas de turnos viejos pueden omitirse al recargar | Pattern 5 | UX: al recargar no se ve "Envío cancelado" de turnos viejos |
| A8 | `src/http` en inglés | Structure | Convención. Se registra en CLAUDE.md |
| A9 | Los nombres de env nuevos (código, HMAC, topes, saltos de proxy) | Patterns 7 y 8 | Bajo: solo nombres |
| A10 | El turno de los 4 casos cabe en 120 s en Render free | Pitfall 5 | Turno cortado en la demo. Se mide en el ensayo |

## Open Questions (RESOLVED)

1. **¿La vista previa del borrador enmascara el nombre y el cargo del firmante?**
   - What we know: el borrador lleva `contacto_financiero.nombre` y `.cargo` completos, permitidos por la Fase 1. D-64 dice que la vista previa nunca muestra un valor completo.
   - What's unclear: si la usuaria considera "valor" la firma de su propia analista.
   - RESOLVED: enmascarar en la vista previa con `enmascarar(ruta, valor)` (las iniciales). Es barato, coherente con D-64 y la descarga no cambia. Se confirma con la usuaria en el checkpoint de la ola de artefactos.
2. **¿Cuántos saltos agrega Render a `X-Forwarded-For`?**
   - RESOLVED: valor por defecto de 1 desde la derecha, configurable por env, y verificación con un XFF falsificado en el walking skeleton (ola 1) antes de cerrar los limitadores.
3. **¿`paquete/formulario.*` y `paquete/valores-portal.md` aparecen en el panel?**
   - RESOLVED: no se listan (son copias). Se sirven solo los de la raíz del caso más los soportes y los `.md` de `paquete/`. Es reversible (D-66).
4. **¿El tope diario se reinicia a medianoche UTC o en `TZ_NEGOCIO`?**
   - RESOLVED: `TZ_NEGOCIO` (America/Bogota por defecto), porque la copia de UI-SPEC dice "después de la medianoche ({zona})" y health puede informar la zona.
5. **¿"¿Qué casos hay?" funciona con el prompt actual?**
   - What we know: `registro-proveedor.md:15-17` dice "llama a proveedor_leer_solicitud con el caso pedido". `leer_solicitud({ caso: "" })` devuelve `casos_disponibles` (`contexto-caso.service.ts:17`).
   - RESOLVED: ajustar una oración del conocimiento para que, si la analista pregunta qué casos hay, el modelo llame con `caso: ""`. Va fijado por `tests/contract/instrucciones-agente.test.ts`, con una prueba de LLM falso y una corrida en vivo.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | Todo | ✓ | 1.4.3 | — |
| Node | No requerido (Vite corre con `bun --bun`) | ✓ | 24.16.0 | — |
| npm registry y Docker Hub | Instalar y construir | ✓ | — | — |
| Docker CLI | Probar la imagen en local | ✓ CLI 29.6.2, **daemon apagado** (OrbStack no corre) | — | Encender OrbStack, o construir directamente en Render |
| Cuenta de Render + repo conectado | DEP-02 | no verificable desde aquí | — | Checkpoint humano: crear el Blueprint y cargar los secrets |
| Clave del LLM | Corrida en vivo y Render | presente en `.env` local (no se leyó) | — | Health `sin_clave` y `demo.ts` |
| `curl` | Smoke test SSE | ✓ | sistema | — |

**Missing dependencies with no fallback:** ninguna que bloquee el código. El deploy necesita acciones humanas en Render (crear el servicio, pegar los secrets con `sync: false` y mantenerlo caliente).

**Missing dependencies with fallback:** daemon de Docker (encender OrbStack para `docker build` local o validar en Render).

## Validation Architecture

Omitida: `workflow.nyquist_validation` es `false` en `.planning/config.json`. Igual sirve como referencia: `bun test` es el framework, `tests/architecture.test.ts` más `tests/sin-comentarios.test.ts` corren en 0.5 s (70 pass, línea base de esta sesión), y los contratos HTTP se escriben con `app.request()` en `tests/http/`.

## Security Domain

`security_enforcement: true`, nivel ASVS 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sí | Código compartido comparado en tiempo constante. 5 intentos fallidos cada 15 min por IP |
| V3 Session Management | sí | Cookie `HttpOnly; Secure; SameSite=Strict; Path=/api`, HMAC-SHA256 (`setSignedCookie`) con vencimiento dentro del valor. `sessionId` emitido por el servidor |
| V4 Access Control | sí | Middleware de acceso en todo `/api/*` salvo health. Lista blanca de artefactos y `caso` validado contra `listCases` |
| V5 Input Validation | sí | zod en el body (`z.enum(TIPO_ACCION)`, largo máximo), `bodyLimit` de 16 KB y `Content-Type: application/json` |
| V6 Cryptography | sí | Web Crypto vía hono (HMAC, SHA-256), nunca a mano. Secreto HMAC de 256 bits (`generateValue`) |
| V7 Errors and Logging | sí | `{ mensaje }` del catálogo. Errores solo en pino con `redactar`, y el código y el secreto HMAC en `secretos` |
| V12 Files | sí | `realpath` + contención (`safe-paths.util.ts`), nombres de la lista blanca y `attachment` + `nosniff` |
| V14 Config | sí | `secureHeaders` con CSP `'self'` (el build no tiene scripts inline, verificado), HSTS y sin claves `VITE_` |

### Known Threat Patterns for Bun + Hono + React SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fuerza bruta del código de acceso | Spoofing | Limitador de fallos por IP (desde la derecha de XFF) y código largo |
| CSRF sobre `/api/chat` | Tampering | `SameSite=Strict` + exigir `application/json` (preflight en cross-origin) |
| Falsificar IP con XFF para evadir topes | Spoofing / DoS | Contar desde la derecha y verificarlo en Render |
| Drenaje del saldo (sesiones nuevas, concurrencia) | DoS / Repudiation | Topes de D-73 por capas, tope diario en el adaptador y saldo bajo |
| Traversal en la descarga | Information disclosure | Lista blanca + `realpath` y nunca concatenar la entrada |
| PII en la vista previa o en SSE | Information disclosure | `mapeo.json` enmascarado, máscara del borrador y `redactar` por evento |
| Fuga de la clave en el bundle, los logs o las respuestas | Information disclosure | Clave solo en `config/env.ts`, test SEG-01 sobre `web/dist`, API y SSE |
| XSS por texto del modelo | Tampering | Texto plano `pre-wrap`, sin `dangerouslySetInnerHTML` y CSP `script-src 'self'` |
| Error interno filtrado por `streamSSE.onError` | Information disclosure | `try/catch` propio en el callback |

## Sources

### Primary (HIGH confidence)
- Spikes ejecutados en esta sesión (scratchpad, Bun 1.4.3, hono 4.13.13, vite 8.3.3, react 19.3.0, eventsource-parser 4.1.1). Cubrieron: SSE normal; desconexión del cliente (`req.raw.signal` y `onAbort` en ~1 ms); idle de 10 s que corta con y sin latido; `c.env.timeout(req, 0)` en SSE y JSON; `bodyLimit` 413; `requestIP` contra XFF; cookie firmada (adulterada y vencida); parche de headers después de `streamSSE`; `serveStatic` + fallback + traversal; `secureHeaders`; `vite build` sin inline; `tsc` 7.0.2 sobre `web/tsconfig.json`; `bun audit` limpio.
- Código del repo leído en esta sesión (rutas y líneas citadas en cada patrón).
- npm registry (`npm view <pkg> time`, 2026-10-14) y GSD `package-legitimacy check`.
- Docker Hub API (`oven/bun` tag `1.4.3-slim`) y `oven-sh/bun` `dockerhub/debian-slim/Dockerfile`.

### Secondary (MEDIUM confidence)
- reto-01/PRD.md §6.1, §6.4 y §6.5.
- .planning/research/STACK.md, ARCHITECTURE.md y PITFALLS.md (proyecto; corregidos donde se indica).

### Tertiary (LOW confidence; tier del seam: websearch/webfetch = LOW)
- [render.com/docs/blueprint-spec](https://render.com/docs/blueprint-spec): campos de `render.yaml`, `generateValue`, `sync: false`.
- [render.com/docs/web-services](https://render.com/docs/web-services): `0.0.0.0`, `PORT` 10000, Brotli.
- [feedback.render.com: Send the correct X_FORWARDED_FOR](https://feedback.render.com/features/p/send-the-correct-xforwardedfor): agrega vs. "first IP".
- [community.render.com: Server Sent Events and Cloudflare](https://community.render.com/t/server-sent-events-and-cloudflare/3238) y [Brotli compression thread](https://community.render.com/t/brotli-compression-not-enabled-for-pck-file/11508).
- [Cloudflare error 524](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/): Proxy Read Timeout de 125 s.
- [Railway: edge proxy gzip buffers streaming](https://station.railway.com/questions/edge-proxy-gzip-buffers-chunked-streamin-f5b7bbfd): `no-transform` (otra plataforma).
- [AhnLab: avisos de React Server Components](https://asec.ahnlab.com/en/92377/): el patrón de parches de RSC.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Versiones, fechas y `bun audit` verificados. La compatibilidad está probada con builds y tests reales.
- Architecture: HIGH. Se apoya en el código existente leído línea a línea y en spikes de Hono/Bun.
- Pitfalls: HIGH en Bun y Hono (reproducidos). MEDIUM o LOW en Render y Cloudflare (sin documentación oficial; se verifican en la ola 1).

**Research date:** 2026-10-14
**Valid until:** 2026-10-21 para versiones (React y hono 5 se mueven rápido) y 2026-11-14 para la arquitectura.
