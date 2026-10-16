---
phase: 03-chat-web-api-sse-y-despliegue
reviewed: 2026-10-16T00:13:43Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - docs/estructura.md
  - docs/limites-del-demo.md
  - src/config/constants/http.constants.ts
  - src/config/strings.ts
  - src/http/middlewares/access.middleware.ts
  - src/http/routes/access.route.ts
  - src/http/services/rate-limiter.service.ts
  - src/http/types/server.type.ts
  - src/loop/services/paso-herramientas.service.ts
  - tests/architecture.test.ts
  - tests/http/acceso.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/unit/rate-limiter.service.test.ts
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Fase 03: Informe de code review (incremental: 71d8d20 y fec1e85)

**Revisado:** 2026-10-16T00:13:43Z
**Profundidad:** standard
**Archivos revisados:** 13
**Estado:** issues_found

## Resumen

Revisé los dos commits de corrección del review anterior: 71d8d20 (WR-01, que separa en el limitador de acceso las reservas en vuelo de los fallos evaluados) y fec1e85 (WR-02, que decide el truncado confirmado con `evaluarEnvio`). También leí los archivos que tocan, el diff completo y la implementación de `timingSafeEqual` de Hono. Corrí las cuatro suites afectadas (211 pruebas, todas pasan) y reproduje los casos límite del limitador con un script aparte, sin tocar el repositorio.

Sobre los cuatro puntos que pidió el orquestador:

1. **D-77.2 (reserva síncrona antes del primer `await`, a lo sumo L por IP).** La reserva sigue siendo síncrona y atómica en los dos caminos. En `access.route.ts:68` se reserva antes de `readCode`, y en `access.middleware.ts:22` antes de `timingSafeEqual`. Lo que **no** se cumple siempre es la cota "una IP nunca supera L intentos entre reservados y fallidos". La liquidación (`release`/`confirmFailure`) se hace por clave y no por reserva. Por eso una reserva que sobrevive a su ventana, o al desalojo de su clave, descuenta en la ventana nueva de la misma IP. La reproducción dio 6 evaluaciones con L = 5 en una sola ventana. Ver WR-01.
2. **D-77 y D-77.1.** Ambas se mantienen. `oldestUnlocked` (`rate-limiter.service.ts:28-33`) nunca desaloja una clave con `count + pending >= L`, así que una clave bloqueada nunca sale antes de vencer su ventana. `evictOldestUnlocked` hereda `count + pending` como `count`, reservas en vuelo incluidas. Sin embargo, una reserva puede quedar sin liquidar o liquidarse contra otra ventana en tres casos: (a) la reserva queda huérfana al vencer o al desalojarse su ventana (WR-01); (b) nada acota la vida de una reserva, porque un cuerpo enviado gota a gota la retiene sin plazo (WR-02); (c) no hay `try/finally`, así que una excepción entre `reserve` y la liquidación dejaría la reserva retenida hasta que vence la ventana (WR-03). Con un pedido abortado no hay fuga: `c.req.json()` rechaza, `readCode` devuelve `null` y se llama a `release`.
3. **`tests/architecture.test.ts`.** El cambio solo agrega `RESULTADO_RESERVA` a `FAMILIAS_DE_CODIGOS`. Eso amplía `LITERAL_DE_FAMILIA` a `"reserved"`, `"busy"` y `"locked"`, así que endurece el guardián y no debilita ninguna regla.
4. **WR-02 frente a D-76.2.** El cambio es correcto. `evaluarEnvio(turno.autorizacion, caso).permitido` es exactamente la regla del envío real (`despacho-llamada.service.ts:71-72`): exige el mismo caso y una autorización no usada. Un truncado legible tras un envío confirmado que falló emite ahora `TRUNCADO`, que se resuelve en `REQUIERE_CONFIRMACION`. Tras un envío exitoso, ambos eventos acaban en `YA_ENVIADO`. Y tras un `armar` que revoca, `caso === null`, así que no cambia nada. `evaluarEnvio` es pura y su `siguiente` se descarta a propósito, porque el paso truncado no ejecuta nada. La prueba nueva cubre el caso y comprueba que el envío siguiente ocurre una sola vez. No encontré defectos en este commit.

## Advertencias

### WR-01: la liquidación por clave cruza generaciones de ventana y rompe la cota de L por IP (D-77.2)

**Archivo:** `src/http/services/rate-limiter.service.ts:67-74` (también `:94-107`; los que llaman están en `src/http/routes/access.route.ts:72,76,79` y `src/http/middlewares/access.middleware.ts:27,30`)

**Problema:** `release(key)` y `confirmFailure(key)` restan `pending` de *la ventana que esté en la tabla para esa clave en ese momento*, no de la ventana donde se hizo la reserva. Si una reserva sigue en vuelo cuando su ventana vence (`sweep`) o cuando su clave se desaloja (`evictOldestUnlocked`), y la misma IP vuelve a entrar con una ventana nueva, la liquidación tardía consume una reserva de esa ventana nueva. Hay dos efectos:

- Un `release` huérfano (cuerpo inválido, que no evaluó nada) baja `pending` de la ventana nueva y abre un lugar de más. Reproducción con L = 5: una reserva en t = 0, la ventana vence, 5 reservas nuevas, `release` de la vieja, una 6.ª reserva **admitida** y 6 `confirmFailure`. Resultado: **6 códigos evaluados en una sola ventana**. El sexto `confirmFailure` encuentra `pending === 0` y no hace nada, así que el sexto fallo además se pierde del contador.
- Si la ventana nueva tenía `count 0, pending 1`, el `release` huérfano la deja en `attempts 0` y la borra (`:73`). El `confirmFailure` legítimo que viene después no encuentra la clave y el fallo evaluado no queda registrado en ningún lado.

La cota global K×L se conserva en promedio, porque la reserva huérfana ocupó un lugar sin evaluar en la ventana anterior. Lo que no se cumple es la invariante que afirman el commit y `docs/limites-del-demo.md:65`: "Una IP tiene a lo sumo L intentos entre reservados y fallidos". Para retener la reserva más de 15 minutos alcanza con un cuerpo enviado gota a gota (WR-02). La prueba "su devolución tardía no resta nada" (`tests/unit/rate-limiter.service.test.ts`) solo cubre la liquidación contra una clave **ausente**. Ninguna prueba cubre una clave que vuelve a entrar antes de que se liquide su reserva huérfana. Además, la API por clave deja que un doble `release` accidental de quien llama descuente la reserva de otro pedido simultáneo de la misma IP.

**Corrección:** que `reserve` devuelva un recibo de un solo uso atado al objeto `Window` donde se reservó, con el mismo patrón que `tryAcquire` de `turn-slots`:

```ts
type Reservation =
  | { readonly resultado: typeof RESULTADO_RESERVA.RESERVADO; readonly liquidar: (fallo: boolean) => void }
  | { readonly resultado: typeof RESULTADO_RESERVA.OCUPADO | typeof RESULTADO_RESERVA.BLOQUEADO };

reserve(key) {
  const window = claim(key, options.now());
  if (window === null) return { resultado: lockedNow(key) ? RESULTADO_RESERVA.BLOQUEADO : RESULTADO_RESERVA.OCUPADO };
  window.pending += 1;
  let liquidada = false;
  return {
    resultado: RESULTADO_RESERVA.RESERVADO,
    liquidar(fallo) {
      if (liquidada) return;
      liquidada = true;
      if (windows.get(key) !== window) return;
      window.pending -= 1;
      if (fallo) window.count += 1;
      if (attempts(window) === 0) windows.delete(key);
    },
  };
}
```

Con este recibo, una reserva de una ventana vencida o desalojada no toca la ventana nueva. Su intento ya quedó contado en la ventana vieja o en la heredera, según D-77.1. Agrega una prueba unitaria: reserva, vence la ventana, L reservas nuevas, liquidación de la vieja con `release` y comprobación de que la reserva L + 1 responde `OCUPADO`. Agrega también el mismo escenario con desalojo y vuelta a entrar.

### WR-02: las reservas en vuelo no tienen plazo, cuentan para la saturación, y la saturación responde "bloqueado" con el plazo de 15 minutos

**Archivo:** `src/http/services/rate-limiter.service.ts:28-33,49-57,100,116`; `src/http/routes/access.route.ts:21-28,70`; `docs/limites-del-demo.md:67`

**Problema:** WR-01 separó "ocupado" (cupo lleno de intentos en curso) de "bloqueado" (L fallos evaluados), pero no aplicó esa distinción a todos los caminos:

- `oldestUnlocked` y, por medio de ella, `isSaturated` cuentan `count + pending`. En cambio, `lockedNow` para una clave **ausente** devuelve `isSaturated()` (`:55`). Si la tabla está llena de claves cuyo cupo ocupan reservas en vuelo, sin ningún fallo evaluado, una IP nueva con el código correcto recibe `BLOQUEADO`. El 429 entonces lleva `lockedMessage` ("demasiados intentos fallidos… 15 minutos"), sin `Retry-After`, y además `isLocked(ip) === true` y `retryAfterMs(ip)` igual a la ventana completa. Es el mismo aviso engañoso que WR-01 quería eliminar. Reproducción con `limit 1, maxKeys 1`: `reserve("P")` y luego `reserve("Q")` dan `"locked"`, `isLocked` true y `retryAfterMs` 1000.
- Nada acota la vida de una reserva. `readCode` hace `await c.req.json()` sin plazo. `Bun.serve` (`server.wiring.ts:263`) usa el `idleTimeout` por defecto de 10 s, que se reinicia con cada fragmento, así que un cuerpo enviado a un byte cada pocos segundos hasta `MAX_BODY_BYTES` retiene la reserva durante horas. Por eso:
  - `docs/limites-del-demo.md:67` dice "En el de intentos eso exige 50 000 códigos errados evaluados… y sostenerlo cuesta unos 50 000 por ventana". Ya no es cierto: el cierre por saturación se consigue con 5 conexiones lentas por clave en 10 000 claves (o prefijos /64; un /48 tiene 65 536) **sin evaluar ningún código** y sin gastar la cota K×L. Las conexiones se pueden sostener sin costo de fallos.
  - Desde la misma NAT o el mismo /64, L conexiones lentas dejan a las demás personas de esa red sin `/api/acceso` (y sin Bearer) por tiempo indefinido. Ellas ven "vuelve a intentarlo en unos segundos" con `Retry-After: 1`, un aviso que nunca se cumple.

**Corrección:**

1. En `reserve`, cuando la clave no existe y la tabla está llena sin claves libres, devolver `BLOQUEADO` solo si todas las claves tienen `count >= limit`, y si no, `OCUPADO`. Hacer lo mismo en `isLocked`/`retryAfterMs` para que no anuncien la ventana completa:

```ts
function allEvaluatedLocked(): boolean {
  for (const window of windows.values()) if (window.count < options.limit) return false;
  return true;
}
function lockedNow(key: string): boolean {
  const window = windows.get(key);
  if (window === undefined) return isSaturated() && allEvaluatedLocked();
  return window.count >= options.limit;
}
```

2. Acotar la lectura del cuerpo de `/api/acceso` con un plazo propio (por ejemplo `PLAZO_LECTURA_ACCESO_MS` en `http.constants.ts`, con `Promise.race` contra un temporizador o un `AbortSignal.timeout`). Al vencer, `readCode` devuelve `null` y la reserva se libera.
3. Corregir `docs/limites-del-demo.md:67` para que diga qué cuenta para la saturación (fallos más reservas en vuelo) y cuál es el plazo máximo de una reserva.

### WR-03: ninguna liquidación está protegida con `finally`; una excepción retiene la reserva hasta que vence la ventana

**Archivo:** `src/http/middlewares/access.middleware.ts:22-31`, `src/http/routes/access.route.ts:68-80`

**Problema:** entre `reserve` y `release`/`confirmFailure` hay un `await timingSafeEqual(...)` (y, en la ruta, `readCode`, que sí captura sus errores). Si `timingSafeEqual` lanzara, la reserva quedaría con `pending` positivo y nadie la liquidaría. La implementación actual de Hono (`createHash` con `crypto.subtle.digest`) no lanza en la práctica, pero la garantía depende de un detalle de una dependencia externa y no del código propio. Las consecuencias serían visibles: la IP recibiría `OCUPADO` con "vuelve en unos segundos" durante hasta 15 minutos, y el `sweep` eliminaría la ventana con la reserva aún contada, lo que alimenta la corrupción de WR-01 si después llega una liquidación. El revisor pidió verificar justamente que "no reservation can leak on any code path including thrown errors", y hoy esa propiedad no está garantizada por construcción.

**Corrección:** liquidar en un `finally` con el recibo de un solo uso de WR-01, que convierte la doble liquidación en una operación sin efecto:

```ts
const reserva = access.failedAttempts.reserve(clientIp);
if (reserva.resultado !== RESULTADO_RESERVA.RESERVADO) return rejectReservation(c, access, reserva.resultado);
let fallo = false;
try {
  const codigo = await readCode(c);
  if (codigo === null) return reject(c, MENSAJE_HTTP.cuerpoAccesoInvalido, RESPUESTA_HTTP.PEDIDO_INVALIDO);
  fallo = !(await timingSafeEqual(codigo, access.code));
} finally {
  reserva.liquidar(fallo);
}
```

Agrega una prueba con un `timingSafeEqual` (o un limitador) inyectado que lance, y comprueba que la IP vuelve a reservar.

## Info

### IN-01: `docs/estructura.md` no menciona los tipos nuevos de `server.type.ts`

**Archivo:** `docs/estructura.md:63`
**Problema:** la fila de `http/types/` enumera `RateLimiter`, pero no `AttemptLimiter` ni `Reservation`, que agregó 71d8d20. `AccessSettings.failedAttempts` ahora es `AttemptLimiter`.
**Corrección:** agregar `AttemptLimiter` (reserva, devolución y confirmación de fallo) y `Reservation` a la lista.

### IN-02: la traducción de la reserva rechazada a un 429 está duplicada en la ruta y en el middleware

**Archivo:** `src/http/routes/access.route.ts:57-63`, `src/http/middlewares/access.middleware.ts:34-42,48-49`
**Problema:** los dos archivos deciden por separado qué texto y qué `Retry-After` corresponde a `BLOQUEADO` y a `OCUPADO`. Hoy coinciden, pero cualquier cambio (por ejemplo, agregar `Retry-After` al bloqueo, IN-03) hay que hacerlo dos veces, y las pruebas solo lo detectarían si cubren ambos caminos.
**Corrección:** extraer una función compartida, por ejemplo `http/services/attempt-rejection.service.ts` con `rejectionFor(reservation, lockedMessage): { mensaje, retryAfterSeconds: number | null }`, y que ambos archivos la usen para armar la respuesta.

### IN-03: el 429 de bloqueo no lleva `Retry-After` y el de "ocupado" sí

**Archivo:** `src/http/routes/access.route.ts:58-60`, `src/http/middlewares/access.middleware.ts:48`
**Problema:** el limitador sabe cuánto falta (`retryAfterMs`), pero el 429 de bloqueo no lo anuncia, mientras que el de intentos en curso manda `Retry-After: 1`. Un cliente automático que respeta `Retry-After` reintentará antes de tiempo contra el bloqueo y sumará pedidos rechazados.
**Corrección:** en el bloqueo, poner `Retry-After` con `Math.ceil(failedAttempts.retryAfterMs(clientIp) / MS_POR_SEGUNDO)`.

### IN-04: `AttemptLimiter` hereda `hit` y permite saltarse la contabilidad de reservas

**Archivo:** `src/http/types/server.type.ts:35-39`
**Problema:** `AttemptLimiter = RateLimiter & { reserve, release, confirmFailure }` expone `hit` en `AccessSettings.failedAttempts`. Un `hit` sobre el limitador de acceso sumaría a `count` sin pasar por `pending` ni por las reglas de D-77.2, y nada en el tipo lo impide.
**Corrección:** definir `AttemptLimiter` como un tipo propio (`reserve`, más el recibo de WR-01, `isLocked` y `retryAfterMs`) sin `hit`, y dejar que `createRateLimiter` devuelva la intersección solo en `ObservableRateLimiter` para las pruebas.

---

_Revisado: 2026-10-16T00:13:43Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
