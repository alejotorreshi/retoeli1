---
phase: 03-chat-web-api-sse-y-despliegue
fixed_at: 2026-10-15T06:42:41Z
review_path: .planning/phases/03-chat-web-api-sse-y-despliegue/03-REVIEW.md
iteration: 1
findings_in_scope: 15
fixed: 15
skipped: 0
status: all_fixed
---

# Fase 03: Informe de corrección del code review

**Corregido:** 2026-10-15T06:42:41Z
**Revisión de origen:** `.planning/phases/03-chat-web-api-sse-y-despliegue/03-REVIEW.md`
**Iteración:** 1
**Alcance:** todos los hallazgos (`fix_scope: all`), con cambios proporcionados a un demo de reto técnico.

**Resumen:**
- Hallazgos en alcance: 15 (7 Warning y 8 Info)
- Corregidos: 15. WR-03 quedó **documentado (aceptado para el demo)** y no persiste estado, como pidió la usuaria.
- Omitidos: 0

## Verificación

Las comprobaciones corrieron en el worktree aislado `.claude/worktrees/rf-03-22262-1792045540` (rama `gsd-reviewfix/03-22262`), con `node_modules` propio instalado con `bun install --frozen-lockfile`. Cada commit se adelantó a `main` con fast-forward, así que el árbol es el mismo que queda en la copia principal.

- `bun --env-file=/dev/null test`: **2127 pass, 1 skip, 0 fail** (2128 pruebas en 105 archivos). La línea base antes de las correcciones era de 2109 pass.
- `bun run check` (tsc del backend, tsc del front, Biome y `bun audit`): **exit 0**, sin vulnerabilidades.
- `bun run build:web`: OK.
- Imagen Docker construida dos veces en local (después de WR-07 y al final). Corre como `bun`, solo `out/` es escribible (`src/` y `node_modules/` no lo son), `/api/health` responde 200 y `POST /api/acceso` responde 204 con entorno falso. Los contenedores se detuvieron y las imágenes se borraron.
- No se leyó `.env`, no se llamó a ningún LLM real y no se hizo `git push`.

## Issues corregidos

### WR-01: El frame SSE de error interno no cumple el contrato y el cliente lo descarta en silencio

**Archivos modificados:** `src/http/routes/chat.route.ts`, `tests/http/stream.test.ts`, `tests/web/flujo-chat.test.ts`
**Commit:** 8607c6d
**Fix aplicado:** El `catch` del stream ahora emite un `EventoError` del contrato (`TURNO_INTERRUMPIDO` con `MENSAJE_HTTP.errorInterno`) y un `turn_end` con `motivo: error`, los dos con el último `turnoId` visto y pasados por `toSseFrame`, que redacta. La prueba del servidor verifica los dos frames. La del cliente verifica que el error se despacha y que no aparece `FIN_STREAM`.

### WR-02: El token de acceso no está ligado al código, así que rotar `ACCESS_CODE` no revoca las cookies emitidas

**Archivos modificados:** `src/config/constants/http.constants.ts`, `src/http/services/access-token.service.ts`, `src/http/types/server.type.ts`, `src/http/routes/access.route.ts`, `src/http/middlewares/access.middleware.ts`, `src/http/wiring/server.wiring.ts`, `tests/http/acceso.test.ts`, `tests/unit/access-token.service.test.ts`, `docs/estructura.md`
**Commit:** 6c81270
**Fix aplicado:** La cookie se firma con `accessSigningKey`, un HMAC-SHA256 del código con `ACCESS_TOKEN_SECRET` como clave. Cambiar `ACCESS_CODE` invalida todas las cookies emitidas, y ni el código ni su hash viajan en la cookie. La clave derivada se agregó a los secretos que se redactan en SSE, JSON y logs. Una prueba nueva confirma que, con el mismo secreto, una cookie emitida con el código anterior responde 401.

### WR-03: El tope diario de tokens vive en memoria y se reinicia con cada reinicio o spin-down de Render

**Archivos modificados:** `docs/estructura.md`, `docs/limites-del-demo.md` (nuevo)
**Commit:** c730d17
**Estado:** documentado (aceptado para el demo)
**Fix aplicado:** Siguiendo la indicación de la usuaria, no se construyó persistencia. Se hicieron dos cambios:
- Se corrigió `docs/estructura.md`: el tope diario no solo se reinicia a medianoche, también con cada reinicio del proceso, y en Render free eso incluye cada spin-down y cada redespliegue.
- Se creó `docs/limites-del-demo.md`, con lo siguiente:
  - Qué estado se pierde al reiniciar: el tope diario (con su desborde por concurrencia), los tres limitadores por IP, los cupos de turno, las sesiones y su presupuesto, y `out/` en disco efímero.
  - Por qué eso es aceptable en el reto: hay una sola instancia free, la clave es personal y prepaga (el 402 es el tope real), la ventana de defensa es corta y el acceso pasa por el código.
  - Qué haría un despliegue real: un almacén compartido y persistente (Redis o una base de datos), reservar tokens antes de cada llamada, límites de gasto y alertas en el proveedor, una instancia paga siempre encendida o varias detrás del almacén, almacenamiento de objetos para `out/` y un solo camino de entrada.

**`SOLUCION.md` (fase 4) debe llevar esta sección.** El documento lo dice de forma explícita.

### WR-04: El limitador previo a la autenticación no tiene cota de claves y se evade rotando direcciones IPv6

**Archivos modificados:** `src/config/constants/http.constants.ts`, `src/config/constants/patterns.constants.ts`, `src/http/services/client-ip.service.ts`, `src/http/services/rate-limiter.service.ts`, `src/http/types/server.type.ts`, `src/http/wiring/server.wiring.ts`, `tests/unit/client-ip.service.test.ts`, `tests/unit/rate-limiter.service.test.ts`, `tests/http/stream.test.ts`, `docs/estructura.md`
**Commit:** a654bfe
**Fix aplicado:** Se aplicaron tres de las cuatro sugerencias:
1. Las IPv6 se normalizan a su prefijo /64 con `rateLimitKeyOf`, que acepta la forma comprimida y la completa. Una IPv4 mapeada (`::ffff:a.b.c.d`) se cuenta como IPv4.
2. El limitador tiene un tope de claves, `maxKeys` (`MAX_CLAVES_LIMITADOR` = 10 000). Al pasarlo desaloja la clave más antigua.
3. `sweep` corta en la primera ventana vigente, porque el `Map` está ordenado por inicio.

No se aplicó la cuarta, el limitador global de intentos fallidos. Con él, cualquiera podría bloquear el acceso de quienes evalúan con 50 códigos errados, y la fuerza bruta ya es inviable con un código de 12 caracteres o más y el bloqueo por /64. Para el demo, ese riesgo de denegación pesa más que el beneficio.

### WR-05: `TRUSTED_PROXY_HOPS=3` solo es correcto para un camino de entrada; por otro camino la IP del cliente se puede falsificar

**Archivos modificados:** `src/http/services/client-ip.service.ts`, `tests/unit/client-ip.service.test.ts`, `docs/limites-del-demo.md`, `docs/estructura.md`
**Commit:** cf526b7
**Estado:** corregido. Requiere verificación humana, porque depende de cómo se publique el servicio.
**Fix aplicado:** Si la entrada elegida de `X-Forwarded-For` no es una IP válida, el servidor cuenta por la dirección del socket. En `docs/limites-del-demo.md` quedó documentado el único camino de entrada medido en vivo (`registro-proveedor-bfnt.onrender.com`, que pasa por Cloudflare y por el borde de Render, con `TRUSTED_PROXY_HOPS=3` = `SALTOS_PROXY_RENDER`), junto con el procedimiento para volver a medir si se agrega otro hostname. `render.yaml` sigue con `"3"` y el comportamiento verificado en vivo no cambia. No se agregó la cabecera de borde (`CF-Connecting-IP`) porque no está verificado que Render la reenvíe.

### WR-06: Un 404 de vista previa se confunde con "archivo borrado" y dispara un falso aviso de disco efímero

**Archivos modificados:** `src/config/constants/files.constants.ts`, `src/config/constants/http.constants.ts`, `src/config/strings.ts`, `src/application/types/artefactos.type.ts`, `src/infra/output/artifact-reader.adapter.ts`, `src/http/routes/artifacts.route.ts`, `tests/unit/artifact-reader.adapter.test.ts`, `tests/http/artefactos.test.ts`, `tests/web/archivos.test.ts`, `docs/estructura.md`
**Commit:** 8526c8a
**Fix aplicado:** `vistaPrevia` devuelve `ResultadoVistaPrevia`, con tres estados (`lista`, `no_encontrado` y `no_disponible`) definidos en el objeto `RESULTADO_VISTA_PREVIA`. La ruta responde así:
- 404 con `archivoNoEncontrado`, solo cuando el archivo no existe;
- 422 (`RESPUESTA_HTTP.NO_PROCESABLE`) con un texto nuevo, sin la pista de reinicio, cuando el archivo existe pero no tiene vista previa (un soporte, o un formulario sin `mapeo.json` legible).

El cliente ya marcaba "disco borrado" solo con un 404, y una prueba nueva fija que un 422 no lo hace.

### WR-07: El Dockerfile deja el código y `node_modules` escribibles por el usuario del proceso y duplica la capa

**Archivos modificados:** `Dockerfile`, `tests/despliegue/contrato-despliegue.test.ts`
**Commit:** ce8f1b1
**Fix aplicado:** `RUN mkdir -p out && chown bun:bun out` reemplaza el `chown -R bun:bun /app`. El contrato de despliegue exige ese RUN y prohíbe cualquier `chown -R` o un `chown` sobre `/app`. Se verificó en una imagen real (ver Verificación).

### IN-01: Los errores registrados pierden la pila

**Archivos modificados:** `src/domain/types/redaccion.type.ts` (nuevo), `src/domain/policies/redaccion.policy.ts`, `src/infra/logging/logger.adapter.ts`, `tests/unit/redaccion.policy.test.ts`, `tests/unit/logger.adapter.test.ts`
**Commit:** 18518df
**Fix aplicado:** `redactar` acepta `OpcionesRedaccion { conPila }`. Solo el logger lo activa, así que los logs llevan `stack` con los secretos limpios, y las respuestas SSE y JSON siguen sin pila (la opción está apagada por defecto).

### IN-02: Textos que repiten un dato sin derivarlo de su constante, y un texto muerto

**Archivos modificados:** `src/config/strings.ts`, `tests/http/acceso.test.ts`
**Commit:** cfa0301
**Fix aplicado:** `demasiadosMensajes` se arma desde `VENTANA_MENSAJES_CHAT_MINUTOS` y `demasiadasSesiones` desde `VENTANA_SESIONES_NUEVAS_HORAS`, con singular y plural. Con los valores actuales el texto queda igual. Se eliminó `MENSAJE_HTTP.demasiadosIntentos`, y las pruebas usan `TEXTO_HTTP.demasiadosIntentos(VENTANA_FALLOS_ACCESO_MINUTOS_POR_DEFECTO)`.

### IN-03: `businessCalendar()` ignora el entorno inyectado

**Archivos modificados:** `src/loop/wiring/agente.wiring.ts`, `src/http/wiring/server.wiring.ts`, `tests/http/acceso.test.ts`, `docs/estructura.md`
**Commit:** 3d56706
**Estado:** corregido. Requiere verificación humana, porque el arreglo se aparta de la sugerencia.
**Fix aplicado:** No se aplicó la sugerencia literal (leer `parseToolEnv(envSource)` en el servidor) porque crearía una inconsistencia real. Las herramientas leen la fecha y la zona del proceso, porque su contrato `execute(args, ctx)` no recibe entorno, y el agente ya comparte ese reloj con ellas. Si el servidor leyera el entorno inyectado, `/api/config` podría mostrar una fecha distinta de la que usan las herramientas.

Lo que se hizo:
- Se eliminó el `businessCalendar` duplicado del servidor.
- `/api/config` y el mensaje del tope diario usan `relojDeNegocio` y `zonaDeNegocio`, exportados desde `agente.wiring.ts`, que son la misma fuente que las herramientas.
- El comportamiento quedó documentado en `docs/estructura.md` y fijado con una prueba: un `envSource` inyectado no cambia la fecha ni la zona.

### IN-04: `release()` con `Math.max(0, …)` oculta una doble liberación, e `inUse` y `trackedKeys` solo existen para las pruebas

**Archivos modificados:** `src/http/types/server.type.ts`, `src/http/services/turn-slots.service.ts`, `src/http/services/rate-limiter.service.ts`, `src/http/routes/chat.route.ts`, `tests/unit/turn-slots.service.test.ts`, `tests/unit/rate-limiter.service.test.ts`, `docs/estructura.md`
**Commit:** 0c4e025
**Fix aplicado:** `tryAcquire()` devuelve una `ReleaseSlot` de un solo uso, o `null` si no hay cupo, y la ruta del chat la guarda en `TurnDeps`. `inUse` y `trackedKeys` pasan a un puerto de observación (`ObservableTurnSlots`, `ObservableRateLimiter`) que devuelven las fábricas. Los tipos que reciben las rutas (`TurnSlots`, `RateLimiter`) ya no los incluyen.

### IN-05: En las pruebas, la demora del proveedor falso empieza al armar el guion, no al recibir el pedido

**Archivos modificados:** `tests/helpers/types/fetch-falso.type.ts`, `tests/helpers/fetch-falso.helper.ts`, `tests/http/stream.test.ts`, `tests/http/topes.test.ts`, `tests/loop/sesion.test.ts`
**Commit:** e1de609
**Fix aplicado:** `demora` pasa a ser una fábrica (`() => Promise<void>`) que el fetch falso invoca al recibir el pedido. Se actualizaron todos los guiones que la usan.

### IN-06: La etapa de build del Dockerfile depende de que los imports de `api.type.ts` sean solo de tipos

**Archivos modificados:** `tests/despliegue/contrato-despliegue.test.ts`
**Commit:** 579bffa
**Fix aplicado:** Ya existía un guardián en `tests/despliegue/contrato-despliegue.test.ts` que recorre las importaciones de valor de `web/` y quedaba fuera del alcance de la revisión. Pero comparaba contra una lista fija (`config/`, `http/types/`). Se hicieron tres cambios:
- La lista ahora se deriva de los `COPY src/…` reales de la etapa `build` del Dockerfile, así que no puede desalinearse.
- El escáner también sigue los `export … from`.
- Se agregó una prueba que demuestra que el guardián distingue las importaciones de valor de las de tipo y detecta una ruta fuera del build.

Se prefirió esto a `COPY src ./src` porque así un cambio solo de backend no invalida la capa del build web, que cuesta minutos de build en Render free.

### IN-07: Una constante de otro ámbito en el middleware HTTP

**Archivos modificados:** `src/config/constants/llm.constants.ts`, `src/config/constants/http.constants.ts`, `src/http/middlewares/json-only.middleware.ts`, `src/llm/adapters/openai-compatible.adapter.ts`, `web/src/config/constants/ui.constants.ts`
**Commit:** db7e710
**Fix aplicado:** `METODO_POST` se movió a `http.constants.ts`. El middleware, el adaptador del proveedor y la SPA lo importan desde ahí.

### IN-08: Si `/api/config` falla justo después de entrar, la UI queda sin configuración y no reintenta

**Archivos modificados:** `web/src/hooks/usar-reintento-config.ts` (nuevo), `web/src/app.tsx`, `web/src/state/conversacion.ts`, `web/src/config/constants/ui.constants.ts`, `tests/web/conversacion.test.ts`, `docs/estructura.md`
**Commit:** 99b2510
**Fix aplicado:** Cuando el acceso está concedido y falta la config (`faltaConfig`), `useReintentoConfig` vuelve a pedir `/api/config` cada `REINTENTO_CONFIG_MS` (10 s) y al volver a la pestaña. Solo despacha si llega una config válida o un 401 (`configResuelta`), y lo cancela todo al desmontarse o cuando la config llega. Las funciones puras tienen pruebas.

## Notas para la disposición

- `03-REVIEW-DISPOSITION.md` no se tocó. Le toca al orquestador marcar WR-01, WR-02 y WR-04 a WR-07 e IN-01 a IN-08 como `fixed`, y WR-03 como `accepted` (documentado en `docs/limites-del-demo.md`, y debe pasar a `SOLUCION.md` en la fase 4).
- No hubo `git push`. Un push redespliega Render, y lo decide la usuaria.

---

_Corregido: 2026-10-15T06:42:41Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteración: 1_
