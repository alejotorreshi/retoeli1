---
phase: 03-chat-web-api-sse-y-despliegue
reviewed: 2026-10-15T05:59:52Z
depth: standard
files_reviewed: 130
files_reviewed_list:
  - .claude/CLAUDE.md
  - .dockerignore
  - .env.example
  - Dockerfile
  - docs/estructura.md
  - package.json
  - render.yaml
  - src/application/types/puertos-agente.type.ts
  - src/config/constants/agent.constants.ts
  - src/config/constants/confirmation.constants.ts
  - src/config/constants/http.constants.ts
  - src/config/constants/llm.constants.ts
  - src/config/constants/runtime.constants.ts
  - src/config/env.ts
  - src/config/strings.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/types/confirmacion.type.ts
  - src/http/middlewares/access.middleware.ts
  - src/http/middlewares/client-ip.middleware.ts
  - src/http/middlewares/rate-limit.middleware.ts
  - src/http/routes/access.route.ts
  - src/http/routes/chat.route.ts
  - src/http/routes/health.route.ts
  - src/http/schemas/access-body.schema.ts
  - src/http/schemas/chat-body.schema.ts
  - src/http/services/access-token.service.ts
  - src/http/services/client-ip.service.ts
  - src/http/services/rate-limiter.service.ts
  - src/http/services/sse.service.ts
  - src/http/types/api.type.ts
  - src/http/types/server.type.ts
  - src/http/wiring/server.wiring.ts
  - src/infra/logging/logger.adapter.ts
  - src/infra/sessions/memory-session-store.adapter.ts
  - src/llm/decorators/daily-budget.decorator.ts
  - src/llm/decorators/health-report.decorator.ts
  - src/llm/types/resilience.type.ts
  - src/loop/services/ejecutar-turno.service.ts
  - src/loop/types/agente.type.ts
  - src/loop/types/turno.type.ts
  - src/loop/wiring/agente.wiring.ts
  - src/server.ts
  - tests/architecture.test.ts
  - tests/arquitectura-web.test.ts
  - tests/helpers/bitacora.helper.ts
  - tests/helpers/comentarios.helper.ts
  - tests/helpers/escaner-fuentes.helper.ts
  - tests/helpers/servidor-prueba.helper.ts
  - tests/helpers/types/comentarios.type.ts
  - tests/helpers/types/importacion.type.ts
  - tests/helpers/types/servidor-prueba.type.ts
  - tests/http/acceso.test.ts
  - tests/http/chat.test.ts
  - tests/http/salud.test.ts
  - tests/http/stream.test.ts
  - tests/http/topes.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/sin-comentarios.test.ts
  - tests/unit/access-token.service.test.ts
  - tests/unit/client-ip.service.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/daily-budget.decorator.test.ts
  - tests/unit/memory-session-store.adapter.test.ts
  - tests/unit/rate-limiter.service.test.ts
  - tests/web/cliente-api.test.ts
  - tests/web/confirmaciones.test.ts
  - tests/web/conversacion.test.ts
  - tests/web/estado-del-modelo.test.ts
  - tests/web/progreso.test.ts
  - tsconfig.json
  - web/index.html
  - web/src/api/cliente-api.ts
  - web/src/api/flujo-chat.ts
  - web/src/app.tsx
  - web/src/components/aviso-modelo.module.css
  - web/src/components/aviso-modelo.tsx
  - web/src/components/aviso.module.css
  - web/src/components/aviso.tsx
  - web/src/components/compositor.module.css
  - web/src/components/compositor.tsx
  - web/src/components/encabezado.module.css
  - web/src/components/encabezado.tsx
  - web/src/components/icons/iconos.tsx
  - web/src/components/indicador-pensando.module.css
  - web/src/components/indicador-pensando.tsx
  - web/src/components/linea-de-tiempo.module.css
  - web/src/components/linea-de-tiempo.tsx
  - web/src/components/mensaje.module.css
  - web/src/components/mensaje.tsx
  - web/src/components/panel-casos.module.css
  - web/src/components/panel-casos.tsx
  - web/src/components/progreso-caso.module.css
  - web/src/components/progreso-caso.tsx
  - web/src/components/tarjeta-confirmacion.module.css
  - web/src/components/tarjeta-confirmacion.tsx
  - web/src/components/tarjeta-herramienta.module.css
  - web/src/config/constants/ui.constants.ts
  - web/src/config/strings.ts
  - web/src/hooks/usar-chat.ts
  - web/src/hooks/usar-diseno.ts
  - web/src/hooks/usar-pestanas.ts
  - web/src/hooks/usar-salud.ts
  - web/src/main.tsx
  - web/src/state/casos.ts
  - web/src/state/confirmaciones.ts
  - web/src/state/conversacion.ts
  - web/src/styles/global.css
  - web/src/styles/tokens.css
  - web/src/types/chat.type.ts
  - web/src/types/ui.type.ts
  - web/tsconfig.json
  - web/vite.config.ts
  - src/http/routes/artifacts.route.ts
  - src/http/routes/sessions.route.ts
  - src/http/routes/static.route.ts
  - src/http/routes/config.route.ts
  - src/http/middlewares/json-only.middleware.ts
  - src/http/services/turn-slots.service.ts
  - src/infra/output/artifact-reader.adapter.ts
  - src/infra/fs/safe-paths.util.ts
  - src/domain/policies/redaccion.policy.ts
  - src/loop/services/guardado-turno.service.ts
  - src/loop/services/vista-sesion.service.ts
  - web/src/api/descarga-local.ts
  - web/src/api/sesion-local.ts
  - web/src/hooks/usar-archivos.ts
  - web/src/state/hidratacion.ts
  - web/src/components/lista-archivos.tsx
  - web/src/components/dialogo-vista-previa.tsx
  - web/src/components/pantalla-acceso.tsx
findings:
  critical: 0
  warning: 7
  info: 8
  total: 15
status: issues_found
---

# Fase 03: Informe de revisión de código

**Revisado:** 2026-10-15T05:59:52Z
**Profundidad:** standard
**Archivos revisados:** 130
**Estado:** issues_found

## Resumen

Revisé la capa HTTP (Hono sobre Bun), el chat web en React y el despliegue en Render. En la capa HTTP miré acceso con cookie HMAC, IP del cliente, limitadores, topes de costo, SSE, artefactos y CSP. En el despliegue miré el Dockerfile y `render.yaml`.

La lista de alcance que recibí no incluía varios archivos de la fase con superficie de seguridad: `artifacts.route.ts`, `sessions.route.ts`, `static.route.ts`, `config.route.ts`, `json-only.middleware.ts`, `turn-slots.service.ts` y `artifact-reader.adapter.ts`, entre otros. Como el contexto pide escrutar artefactos, aborto y liberación de cupos, también los revisé, y figuran al final de `files_reviewed_list`. Los `.css` solo los revisé por patrones: `url()`, `@import` y orígenes externos que choquen con la CSP. No hubo hallazgos ahí.

Hay varias cosas que están bien:

- La comparación del código usa `timingSafeEqual` de Hono, que hashea con SHA-256 y compara en tiempo constante.
- Los artefactos se sirven por lista blanca, con `lstat` y `realpath` dentro del directorio real, sin seguir enlaces simbólicos. Los nombres de soporte están restringidos por `PATRON_ARCHIVO_SOPORTE`, así que no hay inyección en `Content-Disposition`.
- `serveStatic` de Hono 4.13 rechaza `%`, `..` y las barras dobles.
- El CSRF queda cubierto por `SameSite=Strict` más `Content-Type: application/json` obligatorio.
- El cupo de turnos se libera en `finally` tanto en SSE como en JSON.
- Los secretos se redactan en SSE, JSON, la vista de sesión y los logs.

No encontré ningún BLOCKER. Los problemas reales son siete WARNING:

- Un frame SSE de error interno que el cliente descarta.
- La rotación de `ACCESS_CODE`, que no revoca las cookies emitidas.
- El tope diario de tokens, que se reinicia en cada spin-down de Render.
- Un limitador previo a la autenticación sin cota de claves.
- Una IP del cliente que depende de un único camino de proxies.
- Un 404 de vista previa que dispara un falso aviso de "disco borrado".
- Una imagen Docker que deja el código escribible por el proceso.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: El frame SSE de error interno no cumple el contrato y el cliente lo descarta en silencio

**Archivo:** `src/http/routes/chat.route.ts:86-89`, `src/http/routes/chat.route.ts:99-101`; consumidor en `web/src/api/flujo-chat.ts:11-29`
**Problema:** Cuando el generador del turno lanza, el `catch` escribe `event: error` con `data` = `{"mensaje":"..."}`. Ese objeto no trae `tipo`, `turnoId` ni `codigo`, así que no es un `EventoAgente` de error. En el cliente, `esEventoDelServidor` exige `valor.tipo === nombre`, de modo que `eventoDelServidor` devuelve `null` y el frame se ignora. Además no se emite `turn_end`. Con eso `leerEventos` devuelve `false`, `enviarMensaje` despacha `FIN_STREAM` y la usuaria ve "stream cortado" con el botón "Recargar". El mensaje real del servidor, `MENSAJE_HTTP.errorInterno`, nunca llega a la pantalla. El único camino de error inesperado del SSE queda roto y el contrato del cable deja de ser homogéneo.
**Arreglo:** Emitir un evento con la forma del contrato y cerrar el turno:
```ts
} catch (error) {
  deps.logger.error(EVENTO_HTTP.STREAM_FALLIDO, { error });
  const turnoId = "";
  await stream.writeSSE(toSseFrame(
    { tipo: TIPO_EVENTO.ERROR, turnoId, codigo: CODIGO_AGENTE.TURNO_INTERRUMPIDO, mensaje: MENSAJE_HTTP.errorInterno },
    deps.secrets,
  ));
  await stream.writeSSE(toSseFrame(
    { tipo: TIPO_EVENTO.FIN_TURNO, turnoId, motivo: MOTIVO_FIN.ERROR, needsConfirmation: false },
    deps.secrets,
  ));
}
```
Lo ideal es guardar el último `turnoId` visto en el bucle `for await` y usarlo en lugar de `""`. También hay que agregar una prueba en `tests/http/stream.test.ts` con un agente que lance, y verificar que el cliente (`tests/web/flujo-chat.test.ts`) despacha el error.

### WR-02: El token de acceso no está ligado al código, así que rotar `ACCESS_CODE` no revoca las cookies emitidas

**Archivo:** `src/http/services/access-token.service.ts:7-9`, `src/http/routes/access.route.ts:38-50`, `src/http/wiring/server.wiring.ts:105`, `render.yaml:22-25`
**Problema:** El token es `v1.<vence>`, firmado solo con `ACCESS_TOKEN_SECRET`. En Render ese secreto lo genera `generateValue: true` una sola vez y es estable entre despliegues. Si el código de acceso se filtra (el link es público y la clave del modelo es personal), lo natural es cambiar `ACCESS_CODE` y redesplegar. Pero las cookies que ya se emitieron siguen siendo válidas hasta que vencen, que son 12 h por defecto y hasta 168 h según `VIGENCIA_ACCESO_HORAS_TOPE`. Quien ya entró sigue gastando tokens de la clave personal y nada lo indica. La única revocación posible es rotar a mano también el secreto, y eso no está documentado.
**Arreglo:** Derivar la clave de firma del secreto y del código, para que cambiar el código invalide todo lo emitido:
```ts
function signingKey(env: ServerEnv, tokenSecret: string): string {
  return new Bun.CryptoHasher("sha256").update(`${tokenSecret}\u0000${env.ACCESS_CODE}`).digest("hex");
}
```
Después hay que usar `signingKey(...)` en `setSignedCookie` y en `getSignedCookie`, y agregar a la redacción tanto el secreto derivado como el original. Otra opción es incluir en el token una huella del código (`v1.<vence>.<sha256(code)[0..16]>`) y validarla en `isAccessTokenValid`.

### WR-03: El tope diario de tokens vive en memoria y se reinicia con cada reinicio o spin-down de Render

**Archivo:** `src/llm/decorators/daily-budget.decorator.ts:12-31`, `src/loop/wiring/agente.wiring.ts:104-109`, `render.yaml:5`; la documentación de `docs/estructura.md:36` dice "se reinicia a medianoche"
**Problema:** `createDailyBudget` guarda `used` en una variable de cierre que se crea en `crearAgente` al arrancar. En Render free el servicio se duerme a los 15 min sin tráfico y puede reiniciarse en cualquier momento. Cada arranque deja `used = 0`. Quien tenga el código puede consumir los 2M tokens diarios, esperar 15 min sin tráfico y volver a tener otros 2M. Los topes por IP no lo contienen: con `NEW_SESSIONS_PER_HOUR=5` × `AGENT_SESSION_TOKEN_BUDGET=300k` salen 1,5M tokens por hora por IP. Ese es justamente el control de costo que exige `CLAUDE.md` ("el link es público y la clave es personal"). Hay además un desborde menor: el chequeo es previo a cada llamada y el registro posterior, así que con `MAX_CONCURRENT_TURNS=3` el tope puede pasarse en hasta 3 llamadas completas.
**Arreglo:** Render free no tiene disco persistente, así que no se puede persistir de verdad. Como mínimo hay que:
- Documentar en `SOLUCION.md` y en `docs/estructura.md` que el tope diario es por proceso y no por día calendario.
- Bajar los valores por defecto de `render.yaml` (`AGENT_DAILY_TOKEN_BUDGET`, `NEW_SESSIONS_PER_HOUR`).
- Usar como tope real el saldo prepago del proveedor, o el límite de gasto si el proveedor lo ofrece, y decirlo así en la defensa.

Para el desborde por concurrencia, reservar una estimación antes de llamar (`budget.reserve(maxOutputTokens + promptEstimate)`) y ajustarla con el uso real.

### WR-04: El limitador previo a la autenticación no tiene cota de claves y se evade rotando direcciones IPv6

**Archivo:** `src/http/services/rate-limiter.service.ts:5-35`, `src/http/wiring/server.wiring.ts:109-113`, `src/http/routes/access.route.ts:57-64`, `src/http/middlewares/access.middleware.ts:20-22`
**Problema:** `failedAttempts` se alimenta sin autenticación desde `POST /api/acceso` y desde cualquier `Authorization: Bearer` inválido. La clave es la IP completa. Cloudflare entrega IPv6 completas, y un solo host con un /64 dispone de 2^64 claves distintas. Eso tiene dos efectos:
- El bloqueo por intentos fallidos (5 cada 15 min) no frena a ese atacante.
- `windows` crece sin cota durante toda la ventana, y `sweep` recorre el `Map` completo en cada `hit` e `isLocked`. Con 100k claves cada pedido hace 100k iteraciones, lo que en una instancia de 0,1 CPU y 512 MB es una denegación de servicio sin código de acceso.

El código mínimo de 12 caracteres hace improbable la fuerza bruta, pero la degradación de memoria y CPU es real.
**Arreglo:**
1. Normalizar las IPv6 al prefijo /64 antes de usarlas como clave (en `client-ip.service.ts` o en el middleware).
2. Poner una cota a `windows` (por ejemplo `maxKeys` en `RateLimiterOptions`) y desalojar la más antigua al pasarla.
3. Como la inserción ocurre en orden de `start` y `set` sobre una clave existente no la reordena, `sweep` puede cortar en la primera ventana vigente:
```ts
function sweep(now: number): void {
  for (const [key, window] of windows) {
    if (now - window.start < options.windowMs) return;
    windows.delete(key);
  }
}
```
4. Sumar un limitador global de intentos fallidos (por ejemplo 50 cada 15 min en total), además del limitador por IP.

### WR-05: `TRUSTED_PROXY_HOPS=3` solo es correcto para un camino de entrada; por otro camino la IP del cliente se puede falsificar

**Archivo:** `src/http/services/client-ip.service.ts:12-17`, `render.yaml:18-19`
**Problema:** `clientIpFrom` toma `entries[len - trustedHops]`. Las 3 entradas se midieron en vivo para una ruta concreta (dominio, Cloudflare y el borde de Render). Si el servicio también se alcanza por otra ruta con menos proxies que agreguen entradas (por ejemplo `*.onrender.com` frente a un dominio propio detrás de un Cloudflare adicional, o al revés), quien llama puede anteponer entradas en `X-Forwarded-For` para completar la cuenta. Así elige la "IP" con la que se aplican los tres limitadores (`failedAttempts`, mensajes por minuto y sesiones nuevas por hora). El código no tiene forma de detectar que el número de saltos no coincide.
**Arreglo:** Dejar un solo camino de entrada o derivar la IP de una cabecera que el borde sobrescriba siempre (por ejemplo `CF-Connecting-IP`, si Cloudflare es el único ingreso). Además hay que documentar en `.env.example` y en `SOLUCION.md` que `TRUSTED_PROXY_HOPS` depende del hostname usado, y medirlo con `curl -H "X-Forwarded-For: 1.1.1.1"` en cada hostname público. Como defensa adicional, validar que la entrada elegida sea una IP (`net.isIP`) y si no lo es usar el socket.

### WR-06: Un 404 de vista previa se confunde con "archivo borrado" y dispara un falso aviso de disco efímero

**Archivo:** `src/infra/output/artifact-reader.adapter.ts:141-157`, `src/infra/output/artifact-reader.adapter.ts:164-172`, `src/http/routes/artifacts.route.ts:51-52`, `web/src/components/dialogo-vista-previa.tsx:104`, `web/src/state/casos.ts:278-280`
**Problema:** `previewOf` devuelve `null` en casos donde el archivo sí existe:
- Para `formulario.xlsx`, `formulario.pdf` o `valores-portal.md`, cuando `mapeo.json` falta, no es JSON válido o no cumple `mapeoGuardadoSchema` (por ejemplo, un mapeo guardado por una versión anterior).
- Para los textos, cuando `readOwnRegularText` devuelve `null`.

La ruta responde 404 en todos esos casos, igual que cuando el archivo no existe. En el cliente, `esArchivoNoEncontrado` trata cualquier 404 como pérdida del disco y llama a `marcarBorrados()`. El panel muestra entonces "El servidor se reinició y los archivos se borraron" y sugiere reprocesar, aunque los archivos siguen ahí y se pueden descargar.
**Arreglo:** Distinguir los dos casos. Que `vistaPrevia` devuelva `{ estado: "no_disponible" }` cuando el artefacto existe pero no tiene vista previa, y que la ruta responda 422 (o 200 con `tipo: "sin_vista_previa"`). Así, solo `archivo === null` (`findArtifact`) produce 404. En el cliente, llamar a `alNoEncontrado()` solo con 404.

### WR-07: El Dockerfile deja el código y `node_modules` escribibles por el usuario del proceso y duplica la capa

**Archivo:** `Dockerfile:19`
**Problema:** `RUN mkdir -p out && chown -R bun:bun /app` cambia el dueño de todo `/app` (`src/`, `agent/`, `reto-01/fixtures`, `node_modules/`, `web/dist`) al usuario que ejecuta el servidor. El proceso solo necesita escribir en `out/`. Si una herramienta o ruta tuviera un fallo de escritura de rutas, podría sobrescribir el código del agente, el prompt, los fixtures o dependencias que se cargan en caliente, y la defensa en profundidad se pierde. Además, `chown -R` sobre `node_modules` copia todos los archivos a una capa nueva, lo que casi duplica el tamaño de la imagen y el tiempo de build, que en Render free tiene minutos limitados.
**Arreglo:**
```dockerfile
RUN mkdir -p out && chown bun:bun out
USER bun
```
Si algún otro artefacto necesita escritura (por ejemplo la bitácora), crear solo ese directorio con dueño `bun`.

## Info

### IN-01: Los errores registrados pierden la pila

**Archivo:** `src/domain/policies/redaccion.policy.ts:26-31`, `src/http/routes/chat.route.ts:100`, `src/http/wiring/server.wiring.ts:204`
**Problema:** `redactar` reduce todo `Error` a `{ name, message }`, y `logger.error(..., { error })` pasa por `cleanFields`. Ni `STREAM_FALLIDO` ni `ERROR_NO_CONTROLADO` registran la pila, así que un 500 en Render no se puede diagnosticar.
**Arreglo:** Incluir `stack: limpiarTexto(valor.stack ?? "", secretos)` en la copia del `Error`, o hacerlo solo cuando `LOG_LEVEL` sea `debug`.

### IN-02: Textos que repiten un dato sin derivarlo de su constante, y un texto muerto

**Archivo:** `src/config/strings.ts:357`, `src/config/strings.ts:364-366`
**Problema:** `demasiadosMensajes` dice "Espera un minuto", pero la ventana es `VENTANA_MENSAJES_CHAT_MINUTOS`. `demasiadasSesiones` dice "en la última hora", pero la ventana es `VENTANA_SESIONES_NUEVAS_HORAS`. Las dos cosas violan la regla de `CLAUDE.md` de derivar de su constante los textos que repiten un dato. Además, `MENSAJE_HTTP.demasiadosIntentos` no se usa en ningún lado (el servidor usa `TEXTO_HTTP.demasiadosIntentos(env.ACCESS_FAILED_WINDOW_MINUTES)`) y fija la ventana por defecto. Si alguien lo reutiliza, mostrará un valor equivocado.
**Arreglo:** Construir los dos textos desde sus constantes y eliminar `MENSAJE_HTTP.demasiadosIntentos`.

### IN-03: `businessCalendar()` ignora el entorno inyectado

**Archivo:** `src/http/wiring/server.wiring.ts:146-152`, `src/http/wiring/server.wiring.ts:256`
**Problema:** `createServer` acepta `options.envSource`, pero `configSource` y `businessZone` llaman a `readToolEnv()`, que lee `process.env`. Con un entorno inyectado, `/api/config` y el mensaje del tope diario usan `FECHA_EJECUCION` y `TZ_NEGOCIO` del proceso, no los inyectados. Las pruebas dependen de `pinExecutionDate` porque existe esta inconsistencia.
**Arreglo:** Agregar `parseToolEnv(options.envSource)` y usarlo cuando `envSource !== undefined`, igual que `readEnv` y `readAgentConfig`.

### IN-04: `release()` con `Math.max(0, …)` oculta una doble liberación, e `inUse` y `trackedKeys` solo existen para las pruebas

**Archivo:** `src/http/services/turn-slots.service.ts:11-13`, `src/http/types/server.type.ts:29`, `src/http/types/server.type.ts:35`
**Problema:** Una doble liberación por un cambio futuro en `chat.route.ts` pasaría en silencio y el semáforo dejaría entrar un turno de más de forma temporal. `inUse()` y `trackedKeys()` forman parte del contrato de producción pero solo los usan las pruebas.
**Arreglo:** Que `tryAcquire` devuelva una función `release` de un solo uso (`let liberado = false`), y sacar de los tipos de producción los métodos que solo usan las pruebas, o marcarlos como puerto de observación.

### IN-05: En las pruebas, la demora del proveedor falso empieza al armar el guion, no al recibir el pedido

**Archivo:** `tests/http/stream.test.ts:120`, `tests/http/stream.test.ts:130`, `tests/http/stream.test.ts:186`
**Problema:** `demora: Bun.sleep(DEMORA_SILENCIO_MS)` crea la promesa al construir el arreglo. El tiempo que se tarda en armar el servidor y el socket se descuenta del "silencio" del proveedor. La prueba del latido (1 s de demora y latido corto) y las de `idleTimeout` (2,5 s frente a 1 s) pueden quedar por debajo del umbral en una CI lenta y fallar de forma intermitente, o dejar de probar lo que dicen.
**Arreglo:** Modelar la demora como fábrica, `demora: () => Bun.sleep(ms)`, e invocarla en `crearFetchFalso` cuando llega el pedido.

### IN-06: La etapa de build del Dockerfile depende de que los imports de `api.type.ts` sean solo de tipos

**Archivo:** `Dockerfile:5-8`
**Problema:** Solo se copian `src/config` y `src/http/types`. `web/` importa `@/http/types/api.type.ts`, que a su vez importa `@/application`, `@/llm` y `@/loop`. El build funciona porque son `import type` y Vite los borra. Un import de valor en esa cadena rompería solo el build de Docker, no el local.
**Arreglo:** Copiar `src` completo en la etapa de build (`COPY src ./src`), o agregar un guardián en `tests/arquitectura-web.test.ts` que exija que `web/` solo importe valores de `@/config/**`.

### IN-07: Una constante de otro ámbito en el middleware HTTP

**Archivo:** `src/http/middlewares/json-only.middleware.ts:3`
**Problema:** `METODO_POST` se importa desde `llm.constants.ts`. Es el método HTTP del adaptador del proveedor, no del servidor. El acoplamiento entre ámbitos de constantes contradice la regla de "constantes por ámbito".
**Arreglo:** Mover `METODO_POST` a `http.constants.ts` (o a una constante común) e importarlo desde ahí en el adaptador y en el middleware.

### IN-08: Si `/api/config` falla justo después de entrar, la UI queda sin configuración y no reintenta

**Archivo:** `web/src/app.tsx:154-156`, `web/src/state/conversacion.ts:75-76`, `web/src/state/conversacion.ts:161-163`
**Problema:** `accionDeConfig` convierte `SIN_RED` en `CONFIG_RECIBIDA` con `config: null` y marca el acceso como concedido. Desde ahí no se vuelve a pedir la configuración. Faltan los chips de casos, el `maxLength` del compositor y el uso de la sesión hasta que se recarga la página.
**Arreglo:** Mantener el acceso concedido pero reintentar `obtenerConfig` (por ejemplo, al volver a la pestaña o con un botón de aviso) cuando `estado.config === null`.

---

_Revisado: 2026-10-15T05:59:52Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
