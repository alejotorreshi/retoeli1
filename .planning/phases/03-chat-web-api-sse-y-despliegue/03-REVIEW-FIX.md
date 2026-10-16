---
phase: 03-chat-web-api-sse-y-despliegue
fixed_at: 2026-10-16T00:05:04Z
review_path: .planning/phases/03-chat-web-api-sse-y-despliegue/03-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report (incremental, planes 03-44 a 03-47)

**Fixed at:** 2026-10-16T00:05:04Z
**Source review:** .planning/phases/03-chat-web-api-sse-y-despliegue/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (WR-01, WR-02; alcance `critical_warning`, los IN-01 a IN-04 quedan fuera)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: La reserva de D-77.2 responde 429 a credenciales válidas cuando llegan juntas, y el texto anuncia un bloqueo de 15 minutos que no existe

**Files modified:** `src/http/services/rate-limiter.service.ts`, `src/http/types/server.type.ts`, `src/http/middlewares/access.middleware.ts`, `src/http/routes/access.route.ts`, `src/config/constants/http.constants.ts`, `src/config/strings.ts`, `tests/unit/rate-limiter.service.test.ts`, `tests/http/acceso.test.ts`, `tests/architecture.test.ts`, `docs/limites-del-demo.md`, `docs/estructura.md`
**Commit:** 71d8d20
**Applied fix:**
- Cada ventana del limitador lleva ahora `pending` (reservas en vuelo) aparte de `count` (fallos evaluados). El puerto nuevo `AttemptLimiter` (`reserve`, `release`, `confirmFailure`) extiende `RateLimiter`, que pierde `release`. Los limitadores de mensajes y de sesiones nuevas siguen usando solo `hit`, `isLocked` y `retryAfterMs`, sin cambios de conducta.
- `reserve(key)` sigue comprobando y contando en un solo paso síncrono antes del primer `await`, así que D-77.2 queda intacta. Admite solo si `count + pending < L`, de modo que la cota de L intentos evaluados por IP se sostiene con pedidos simultáneos. Devuelve `RESULTADO_RESERVA.RESERVADO`, `.BLOQUEADO` (L fallos evaluados, o la tabla saturada de claves bloqueadas) u `.OCUPADO` (cupo lleno de intentos que todavía se evalúan). `isLocked` mira solo los fallos evaluados.
- Un código errado pasa su reserva a fallo (`confirmFailure`). Un código correcto o un cuerpo inválido la devuelven (`release`). Si la clave ya no tiene reservas en vuelo, ninguna de las dos operaciones hace nada.
- La herencia por desalojo (D-77.1) traspasa `count + pending` como golpes a la clave nueva, así que la suma global se conserva igual que antes. Una clave es desalojable solo si `count + pending < L`, y una bloqueada nunca se desaloja (D-77 intacta).
- El 429 por cupo ocupado usa el texto propio `MENSAJE_HTTP.intentoEnCurso` ("Hay otros intentos de acceso en curso desde tu red. Vuelve a intentarlo en unos segundos."), sin el plazo de 15 minutos y con `Retry-After: 1` (`CABECERA.REINTENTAR_TRAS`, `SEGUNDOS_REINTENTO_INTENTO_EN_CURSO`). El 429 por bloqueo sigue con `access.lockedMessage`. `RESULTADO_BEARER` suma `OCUPADO`, y `RESULTADO_RESERVA` quedó registrado en el guardián de familias de códigos.
- Pruebas de regresión con `app.request`, deterministas en 8 corridas repetidas:
  - Sin fallos previos, 10 `POST /api/acceso` correctos simultáneos dan exactamente 5 respuestas 204 y 5 respuestas 429 de intentos en curso con `Retry-After`. El pedido siguiente entra y la IP conserva sus 5 intentos.
  - Lo mismo con 10 Bearer correctos simultáneos.
  - Con L − 1 fallos entra exactamente uno y nueve reciben el 429 de intentos en curso. Esto cubre también IN-03.
  - Con 50 errados simultáneos, 5 dan 401 y 45 reciben el 429 de intentos en curso. El pedido siguiente recibe el 429 de bloqueo de 15 minutos.
  - Las pruebas unitarias del limitador se reescribieron para la API de reservas: ocupado frente a bloqueado, la cota con reservas simultáneas, el desalojo de una clave con reservas en vuelo y la tabla saturada.
- Se actualizaron `docs/limites-del-demo.md` (el párrafo D-77.2, con el costo para una NAT o un script con muchos Bearer simultáneos) y las filas del limitador y del middleware de acceso en `docs/estructura.md`.

### WR-02: `eventoDeTruncado` marca como "confirmado" un truncado cuya autorización ya se gastó, y el aviso miente sobre la causa

**Files modified:** `src/loop/services/paso-herramientas.service.ts`, `tests/loop/compuerta-casos.test.ts`
**Commit:** fec1e85
**Applied fix:** `eventoDeTruncado` ahora decide con `evaluarEnvio(turno.autorizacion, caso).permitido`, la misma regla que decide el envío real, en lugar de comparar solo el caso. Así, un truncado legible después de que se gastó la autorización queda como `TRUNCADO` y su desenlace es `REQUIERE_CONFIRMACION`. Se agregó una fila de integración que primero falló contra el código previo: confirmar EC, `simular_envio(EC)` falla con `ERROR_INTERNO` (`FALLIDO`) y después llega un truncado legible de EC. El cierre muestra los avisos FALLIDO y REQUIERE_CONFIRMACION y no el de "se cortó antes de ejecutarse", vuelve a preguntar por EC y el "envía" siguiente envía una sola vez. Es un cambio de lógica (predicado de decisión): **fixed: requires human verification** para confirmar que la semántica coincide con D-76.2.

## Verification

Las comprobaciones corrieron en el checkout principal (`/Users/alejo/Developer/Alejo/reto-eli-1`, rama `main`, sin worktree, como se pidió), así que se pueden reproducir desde el árbol actual.

- `bun run check` (tsc del backend y del front, Biome y `bun audit`): pasa, con salida 0 y sin vulnerabilidades.
- `bun test` completo: 2326 pass, 1 skip, 0 fail (9461 `expect()`, 107 archivos).

---

_Fixed: 2026-10-16T00:05:04Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
