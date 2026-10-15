# Phase 3: Chat web, API SSE y despliegue - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning

<domain>
## Phase Boundary

La analista abre el link público en Render, entra con el código de acceso y conversa con el agente en un chat React. El chat muestra en vivo cada tool call, el estado de confirmación, el resultado por caso y los archivos generados. Esta fase entrega:

- la API HTTP: SSE más el fallback JSON, sesiones, health y descargas;
- el acceso y los topes de costo;
- el chat React que traduce los eventos del ciclo (Fase 2);
- el despliegue de un único servicio Docker en Render.

Requisitos: API-01 a API-05, UI-01 a UI-09, LLM-06 (ver D-70, reescrita), SEG-01, DEP-01 y DEP-02.

Fuera de esta fase:
- `modulo/`, `SOLUCION.md`, la CI y el pre-flight DEP-03 (Fase 4);
- el diseño visual detallado, que lo fija `/gsd-ui-phase 3` en UI-SPEC.md;
- un flujo sin IA en la UI (diferido, D-70).

</domain>

<decisions>
## Implementation Decisions

### Artefactos y PII (API-05, UI-06)
- **D-64:** **La descarga entrega el archivo real** (xlsx, pdf o .md tal como se generó), porque es el entregable del reto. **La vista previa en el navegador nunca muestra un valor completo**, en coherencia con D-47. En pantalla, igual que en el chat, solo aparecen valores enmascarados.
- **D-65:** La vista previa del formulario (xlsx, pdf o valores de portal) **se construye en el servidor desde `out/<caso>/mapeo.json`**. Es una tabla de etiqueta, `valor_enmascarado` y estado (`lleno` / `faltante` / `requiere_confirmacion`, con su nota), igual para los tres formatos. No se parsea el xlsx ni se renderiza el PDF. Los `.md` del paquete (checklist, borrador de correo, ENVIO-SIMULADO) se previsualizan como texto plano, porque la Fase 1 ya garantiza que no llevan valores reales (grep de PII vacío). Hay que verificar en la investigación que eso también vale para `valores-portal.md`. Si no vale, su preview sale de mapeo.json como el formulario.
- **D-66:** La **lista blanca** de nombres servibles es: `formulario.xlsx`, `formulario.pdf`, `valores-portal.md`, `paquete/checklist.md`, `paquete/borrador-correo.md`, `ENVIO-SIMULADO.md` y los soportes copiados en `paquete/`. **Quedan fuera** `mapeo.json` y `log.jsonl`, que son internos. El caso se valida contra los casos conocidos y la ruta se resuelve con `safe-paths.util.ts` (sin traversal). Todo va detrás del acceso (D-72). — **Reversibility:** reversible.
- **D-67:** **Disco efímero de Render:** el panel lista lo que existe en disco en ese momento. Si falta un archivo esperado (por un reinicio o porque el servicio se durmió), muestra "El servidor se reinició y los archivos se borraron; vuelve a procesar el caso", con un chip que manda "procesa el caso X". **No se regenera al vuelo**, para no ocultar el reinicio ni tapar un paquete desactualizado.

- **D-74 (posterior a la investigación, 2026-10-14; precisa D-65):** La investigación encontró que `valores-portal.md` lleva valores completos (cuenta, SWIFT, correo y teléfono), así que su vista previa sale de `mapeo.json` enmascarada, igual que el formulario. `paquete/borrador-correo.md` lleva completos el **nombre y el cargo del contacto financiero** (el firmante), y la usuaria decidió que su vista previa **los muestre completos** como texto plano: son el firmante del correo y la Fase 1 ya los acepta en ese archivo. Ningún otro dato del borrador (ni de los demás `.md` del paquete) puede ir completo. El grep de PII de la Fase 1 sigue siendo la garantía.

### Confirmar / Cancelar (UI-03, D-39, D-40, D-63.11)
- **D-68:** `POST /api/chat` acepta, además de `{ sessionId, message }`, un campo opcional **`accion: { tipo: "confirmar" | "cancelar", caso }`** (los tipos se definen como constante `as const` y `z.enum` construido desde ella). Los botones mandan un texto visible (por ejemplo "Sí, envía co-industrias-delta" o "Cancela el envío de co-industrias-delta"), que queda en el historial para el modelo y la analista, **y** la acción estructurada. El servidor decide con `accion` **sin pasar por el clasificador de texto** (precedencia de D-39). Una `accion` vale solo si su `caso` está pendiente en la sesión. Si no lo está, no autoriza nada y se trata como texto normal, y el servidor vuelve a preguntar si corresponde. — **Reversibility:** costly — cambia el contrato de `EntradaTurno` del ciclo, el body de la API, la UI y los tests de la compuerta.
- **D-69:** **Hay una tarjeta por caso pendiente**, con su caso, la acción y los bloqueos (del evento `confirmacion_requerida`) y sus botones Confirmar y Cancelar. **Cancelar estructurado cancela solo ese caso** y los demás pendientes siguen igual, a diferencia del rechazo por texto, que cancela todos (D-63.11). El input del chat **sigue activo** con tarjetas abiertas, y la tarjeta **refleja lo que decide el servidor**: se cierra o sigue abierta según los eventos del turno siguiente, nunca por una decisión local de la UI. `GET /api/sessions/:id` devuelve también los **pendientes vigentes** (`{ caso, bloqueos }[]`), así que al recargar la UI vuelve a pintar las tarjetas activas con botones. Las tarjetas de turnos ya resueltos quedan en el historial sin botones.

### Modo degradado (LLM-06, ver D-70)
- **D-70 (reescrita el 2026-10-15 por G-03-15, decisión de la usuaria, opción C+):** El PRD **no pide** modo degradado. Lo que exige es CA5 (errores del proveedor en lenguaje claro y la sesión sigue viva), Robustez (timeout con mensaje claro) y que `demo.ts` corra sin clave (hecho en la Fase 1).
  - **`demo.ts` es la verificación sin modelo del evaluador y del desarrollador** (PRD §6.6). Se documenta en el README y en SOLUCION.md (Fase 4). **La UI nunca lo menciona**, ni ningún otro comando o script.
  - **Para la analista**, `/api/health` reporta el estado del modelo (D-71) y el banner `AvisoModelo` explica, por estado y en lenguaje claro, **qué pasa, qué sigue funcionando** (ver y descargar los archivos ya generados en el panel de casos), **qué hacer y cuándo vuelve**. Trae el botón secundario **"Comprobar de nuevo"**, que solo relee `/api/health` y nunca llama al modelo.
  - **El envío se pausa solo en `sin_clave` y `tope_diario`**: el compositor, los chips de acción rápida, el chip de reproceso del panel y los botones de las tarjetas de confirmación. En `saldo_agotado` y `no_disponible` sigue habilitado, porque solo una llamada correcta limpia esos estados. La pausa es solo UX: el servidor sigue siendo la compuerta.
  - La copia de saldo del servidor (`MENSAJE_AGENTE`) y la del banner coinciden ("recargue la cuenta", "vuelve a enviar tu mensaje").
  - **No hay flujo sin modelo en la UI.** La opción A de G-03-15 ("Procesar sin el modelo") queda diferida a una fase posterior (3.1 o 4), ver Deferred Ideas.
- **D-71 (health):** `/api/health` sigue barato y **nunca llama al LLM**. Devuelve `{ ok, provider, model, llm }`, donde `llm` es una constante `as const` con estos valores:
  - `disponible`;
  - `sin_clave`, cuando falta la clave en la config;
  - `saldo_agotado`, cuando la última llamada recibió un 402;
  - `no_disponible`, cuando la última llamada agotó los reintentos y el fallback;
  - `tope_diario`, cuando se alcanzó el tope diario global (D-74).

  El estado observado se limpia cuando una llamada vuelve a funcionar. Nunca expone claves ni detalles internos del error.

### Acceso (API-04, UI-09, SEG-01)
- **D-72:** El acceso sigue las prácticas de OWASP para una SPA del mismo origen:
  - La pantalla de entrada envía el código **una vez** a `POST /api/acceso`. El servidor lo compara **en tiempo constante** con el de la env var y responde con una **cookie `HttpOnly; Secure; SameSite=Strict; Path=/api`** que contiene un **token firmado con HMAC y vencimiento a las 12 h** (configurable). La cookie no lleva el código.
  - El código **nunca se guarda en el navegador** (ni `localStorage` ni `sessionStorage`), y el JS no puede leer la cookie.
  - Contra CSRF: `SameSite=Strict` y además exigir `Content-Type: application/json` en los POST.
  - Para `curl -N` y el futuro pre-flight se acepta también `Authorization: Bearer <código>`, comparado en tiempo constante.
  - Si cualquier endpoint protegido responde 401, la UI vuelve a la pantalla de entrada.
  - En local (`bun run dev`, http) la cookie no puede ser `Secure` en todos los navegadores, así que el flag `Secure` depende del entorno (config), nunca está apagado en producción.
  - La clave de firma HMAC es una env var propia (secret en Render), distinta del código de acceso y de la clave del LLM.

  Todo excepto `/api/health` (y los estáticos de la SPA) exige acceso. — **Reversibility:** costly — define las variables de entorno documentadas (`.env.example`, `render.yaml`, README) y el flujo de la UI.

### Topes de costo y abuso (API-04, D-51)
- **D-73:** Los usuarios no deben poder consumir la API ni el LLM sin control. Las defensas van en capas y todas tienen valor por defecto configurable por env y mensaje claro en español (en `strings.ts`):
  1. **Rate limit por IP en `/api/chat`: 10 mensajes por minuto.**
  2. **`/api/acceso`: 5 intentos fallidos cada 15 min por IP** (anti fuerza bruta). Al superarlo responde 429.
  3. **Un turno activo por sesión** (un segundo mensaje mientras corre un turno se rechaza con mensaje claro) y **3 turnos simultáneos en total**.
  4. **Mensaje de hasta 2000 caracteres y body HTTP de hasta 16 KB**, verificados antes de parsear el JSON.
  5. **5 sesiones nuevas por hora por IP**, para que crear sesiones no sirva para reiniciar el tope de 300 k tokens por sesión.
  6. **Tope diario global de 2 M tokens** (prompt + completion de todas las llamadas, incluido el fallback). Es un corte duro: al alcanzarlo los turnos responden con un mensaje claro, health reporta `tope_diario` (D-71) y el contador se reinicia a medianoche (UTC o la zona configurada, a criterio del planner). Vive en memoria, y un reinicio lo pone en cero, lo que se acepta y se documenta.
  7. Se mantienen el tope de 300 k por sesión (D-51), las 25 iteraciones por turno (CA1), `max_tokens` por llamada y los timeouts.

  `/api/health` y los estáticos quedan fuera del rate limit. La IP del cliente detrás del proxy de Render se toma del salto correcto de `X-Forwarded-For` (no del primer valor, que el cliente puede falsificar). Esto lo confirma la investigación. Fuera del código, el README recomienda mantener bajo el saldo prepagado del proveedor como último cortafuegos.

### Cierre de brechas de la UAT (2026-10-15, posterior a D-74)
- **D-71.1 (precisa D-71; G-03-14 y G-03-15):** Un 401/403 del proveedor (`AUTENTICACION`) se publica en `/api/health` como **`sin_clave`**, porque una clave rechazada no se recupera sola. Riesgo aceptado: un 401 transitorio deja la UI en `sin_clave` (y con el envío en pausa, D-70) hasta un reinicio o hasta que otra llamada al modelo funcione. La UI pide `/api/health` **al cargar, en `visibilitychange`, al terminar cada pedido de chat** (turno correcto, error, rechazo HTTP, red caída, stream cortado o "Detener respuesta") **y con "Comprobar de nuevo"**, nunca por intervalo. El reintento de `/api/config` por intervalo mientras falta la config (IN-08) no consulta health.
- **D-73.5.1 (precisa D-73.5; G-03-04):** En Render el tope es de **20 sesiones nuevas por hora por IP** (`SESIONES_NUEVAS_POR_HORA_RENDER`, `NEW_SESSIONS_PER_HOUR` en `render.yaml`). El default local de `config/env.ts` sigue en 5. Se justifica contra el tope diario global de 2 M tokens (D-73.6), que sigue siendo el límite real de gasto: subir el tope de sesiones no sube el gasto máximo del día y deja margen para ensayos, recargas tras un reinicio y NAT (`docs/limites-del-demo.md`). El 429 dice **los minutos de espera** (techo, mínimo uno), sin cabecera `Retry-After`. La SPA **conserva el `sessionId` anterior** hasta el `turn_start` de la sesión nueva y, ante un 429, ofrece **"Volver a la sesión anterior"**, que solo recarga esa sesión y no manda nada al chat.
- **D-75 (G-03-17):** El servidor publica solo casos que cumplen `PATRON_CASO`: el listado de casos (`leer_solicitud` con caso vacío) y cualquier caso ilegible salen con **caso `null`** en `tool_start`, `tool_end`, la vista de sesión y la bitácora. El panel muestra **solo casos reales**: patrón válido, entre los casos de `/api/config` (si la config ya cargó) y no refutados por `CASO_NO_ENCONTRADO` o `CASO_INVALIDO` en su propia llamada. Un caso real con otro fallo sigue en el panel con su etapa en error.
- **D-76 (G-03-26, decisión de la usuaria):** Por cada `proveedor_simular_envio` que no terminó `ENVIADO`, el servidor agrega al cierre del turno un **aviso determinista** de `TEXTO_ENVIO_NO_REGISTRADO` (requiere confirmación, sin paquete, ya enviado, fallido o sin caso legible). Va después del texto del modelo y **antes de la pregunta del servidor** si la hay, que sigue siendo el último párrafo (D-44). Los avisos repetidos salen una vez y el de sin caso, una sola vez por turno. **No reemplaza ni suprime la prosa del modelo**: AGT-03 y T-02-41 siguen vigentes. La línea `gate_blocked` (y `gate_permit`) registra el caso de la llamada cuando cumple `PATRON_CASO`.

### Claude's Discretion
- La forma exacta del protocolo SSE (nombres de eventos sobre el `TIPO_EVENTO` existente, heartbeat cada ~15 s y los headers `no-cache`/`X-Accel-Buffering`) y del fallback JSON `{ reply, toolCalls[], needsConfirmation }`, siguiendo STACK.md y PRD §6.4.
- El indicador de progreso por etapas (leído → mapeado → generado → paquete → confirmación → envío) y la tarjeta de resultado se derivan de los eventos de herramienta (`herramienta` + `ok` + `resumen`). El planner decide si el resumen estructurado lo arma el servidor o la UI, siempre desde los resultados de las herramientas y nunca desde el texto del modelo.
- La forma de los chips de acción rápida (UI-07): prompt §11, procesar los 4 casos y listar los casos.
- La estrategia de despliegue sigue el research flag: desplegar un walking skeleton SSE en Render temprano y probarlo con `curl -N`. Si bufferiza, se usa el fallback JSON y, como plan B, Koyeb o Fly con el mismo Dockerfile.
- Todo el diseño visual (layout, colores, componentes) lo define `/gsd-ui-phase 3`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificación del reto
- `reto-01/PRD.md` §6.1 — Componentes obligatorios (front de chat: historial, input, "pensando", tool calls visibles, confirmación resaltada; autenticación)
- `reto-01/PRD.md` §6.3 — CA3 (el front resalta la confirmación) y CA5 (errores en lenguaje claro, la sesión no muere)
- `reto-01/PRD.md` §6.4 — API mínima: `POST /api/chat` → `{ reply, toolCalls[], needsConfirmation }`, `GET /api/sessions/:id` y `GET /api/health`
- `reto-01/PRD.md` §7.3 — RN4 (confirmación en el turno inmediatamente anterior)
- `reto-01/PRD.md` §8 — Costo, robustez, seguridad de la clave y arranque en < 2 min
- `reto-01/PRD.md` §11 — Guion de la demo (base del chip de acción rápida y del ensayo en el link público)

### Planeación del proyecto
- `.planning/REQUIREMENTS.md` — API-01 a API-05, UI-01 a UI-09, LLM-06 (reformular según D-70), SEG-01, DEP-01 y DEP-02
- `.planning/ROADMAP.md` — Phase 3: objetivo, criterios de éxito (ajustar el 4 según D-70) y research flag de SSE en Render
- `.planning/PROJECT.md` — Core value, restricciones (Render free, costo, clave solo en el backend)
- `.planning/phases/01-n-cleo-determinista/01-CONTEXT.md` — D-05 a D-07 (enmascarado y lista blanca de datos públicos) y D-24 (fecha efectiva)
- `.planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-CONTEXT.md` — D-37 a D-44 (compuerta, evento `confirmacion_requerida`, `needsConfirmation`), D-46 y D-60 (texto plano, `pre-wrap`), D-47 (nunca el valor real en el chat), D-51 (tope por sesión), D-58 (sesión en memoria, TTL, aviso de expirada), D-59 (proveedor por env y health) y D-63.11 (el rechazo por texto cancela todos; el botón llega en la Fase 3)

### Investigación
- `.planning/research/STACK.md` — Hono `streamSSE`/`onAbort`, `serveStatic`, `app.request()`, eventsource-parser, Vite proxy, Dockerfile `oven/bun:1.4.3-slim` y `render.yaml`, límites de Render free y SSE sin buffering
- `.planning/research/ARCHITECTURE.md` — Capa HTTP como composition root, `useReducer` sobre el stream de eventos, correlación con AsyncLocalStorage
- `.planning/research/FEATURES.md` — TS-22, TS-33, DF-04, DF-05, DF-11, DF-14 y DF-15 (DF-15 reducido por D-70)
- `.planning/research/PITFALLS.md` — Buffering de SSE, desconexión del cliente y fuga de la clave
- `.claude/CLAUDE.md` — Reglas de código (capas, sufijos, `strings.ts`, constantes `as const`, alias `@/`, guardianes G1 a G16). La capa HTTP nueva y `web/` deben declararse en los guardianes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/loop/wiring/agente.wiring.ts` → `crearAgente(opciones)` devuelve `Agente { proveedor, modelo, turno(entrada) }`, donde `turno` es un `AsyncGenerator<EventoAgente>`. La capa HTTP lo traduce a SSE y al JSON del PRD §6.4.
- `src/loop/types/evento.type.ts`: los eventos `inicio_turno` (con `sesionNueva` y `sesionExpirada`), `inicio_herramienta`, `fin_herramienta` (`ok`, `codigo`, `resumen`), `texto`, `confirmacion_requerida` (`caso`, `accion`, `bloqueos`), `uso`, `error` y `fin_turno` (`needsConfirmation`).
- `src/loop/types/turno.type.ts`: el estado de sesión ya tiene `pendientes: CasoPendiente[]`, que es la fuente de los pendientes vigentes de D-69.
- `src/infra/sessions/memory-session-store.adapter.ts`: el store en memoria con TTL y LRU (D-58), detrás de la API de sesiones.
- `src/domain/policies/redaccion.policy.ts` y `pii.policy.ts`: la redacción de la PII para el historial de `GET /api/sessions/:id` y los args de las tarjetas de tool call.
- `src/infra/fs/safe-paths.util.ts`: la resolución de rutas sin traversal para la ruta de descarga (D-66).
- `out/<caso>/mapeo.json`: la fuente de la vista previa enmascarada (D-65).

### Established Patterns
- Capas con dependencias hacia adentro y guardianes en `tests/architecture.test.ts`. `CAPAS_FUTURAS` reserva `src/(server|http|...)`. La capa HTTP debe ser composition root o consumir el agente ya armado, y declararse en `PERMITIDOS`.
- Todo texto visible en `src/config/strings.ts`, los códigos como objetos `as const`, sin comentarios y el dominio en español.
- `config/env.ts` es el único lector de `process.env`. Las variables nuevas (código de acceso, secreto HMAC, topes y flag `Secure`) se validan allí con zod.

### Integration Points
- `EntradaTurno` del ciclo necesita el campo opcional `accion` (D-68). La compuerta de la Fase 2 lo consume con precedencia sobre el clasificador, y Cancelar estructurado cancela un solo caso (D-69).
- El adaptador LLM (decoradores de resiliencia) debe publicar el último estado observado (402 o agotado) para health (D-71), y el contador diario global (D-73.6) envuelve el presupuesto existente.
- `bun run dev` debe levantar en paralelo el backend (Hono sobre `Bun.serve`) y Vite con el proxy `/api`. El Dockerfile copia `tsconfig.json` (alias `@/`) y los fixtures de `reto-01/`.

</code_context>

<specifics>
## Specific Ideas

- La usuaria pidió **lo mejor según las buenas prácticas** para el acceso. Por eso se eligió la cookie HttpOnly firmada en vez de `localStorage`, y SOLUCION.md (Fase 4) debe explicarlo así.
- La usuaria insistió en que **no se cuelen llamados que consuman la API o la IA sin control, porque hay costos**. Las capas de D-73 responden a eso, y cada una necesita un test que demuestre que corta.
- Ante el modo degradado, la usuaria pidió seguir **lo que dicen los requisitos del reto**. El PRD no lo pide, así que se redujo (D-70). En la UAT (G-03-15) la usuaria juzgó que pedirle a la analista correr `demo.ts` era una mala estrategia y eligió la opción C+, con la que se reescribió D-70.

</specifics>

<deferred>
## Deferred Ideas

- **Flujo sin IA desde la UI: opción A de G-03-15, "Procesar sin el modelo"** (03-UAT.md, Deferred Follow-Ups). Una acción determinista del servidor que corre las herramientas en orden fijo (leer → mapear → generar → armar) por `darPaso`, con las mismas tarjetas, la misma compuerta y la misma bitácora, y que deja completar las confirmaciones sin modelo. Era LLM-06 completo y DF-15. Revierte D-70, así que necesita una decisión explícita de la usuaria. Se planea como fase 3.1 o dentro de la Fase 4, antes de la defensa.
- **Regenerar artefactos al vuelo** cuando el disco efímero los borró: descartado en favor del aviso honesto (D-67).
- Vienen de la Fase 2 y siguen diferidos: revelar el valor real en la UI por un canal aparte del modelo, y cambiar el proveedor o el modelo desde la UI en vivo.

</deferred>

---

*Phase: 03-chat-web-api-sse-y-despliegue*
*Context gathered: 2026-10-14*
