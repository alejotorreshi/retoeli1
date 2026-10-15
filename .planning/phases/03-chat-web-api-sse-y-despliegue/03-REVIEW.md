---
phase: 03-chat-web-api-sse-y-despliegue
reviewed: 2026-10-15T20:35:04Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - docs/limites-del-demo.md
  - src/config/constants/confirmation.constants.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/types/compuerta.type.ts
  - src/http/services/rate-limiter.service.ts
  - src/loop/services/paso-herramientas.service.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/rate-limiter.service.test.ts
  - tests/web/conversacion.test.ts
  - tests/web/seguimiento.test.ts
  - web/src/components/linea-de-tiempo.tsx
  - web/src/config/constants/ui.constants.ts
  - web/src/hooks/usar-chat.ts
  - web/src/state/conversacion.ts
  - web/src/state/seguimiento.ts
  - web/src/types/ui.type.ts
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-10-15T20:35:04Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Revisión incremental del segundo cierre de brechas (planes 03-40 a 03-43) desde `e64e87b`. Abarca D-76.1 (aviso del `simular_envio` truncado), D-77 (el limitador no suelta claves bloqueadas, más el cupo de desalojos que el ejecutor agregó como desvío Rule 2), D-73.5.2 (nueva sesión olvida el `sessionId` guardado) y D-78 (el seguimiento del final se despega según la dirección del scroll).

Las 259 pruebas de los cinco archivos de prueba del alcance pasan, y la lógica de pliegue de la compuerta es coherente. Los problemas están en tres lugares:

1. **El cupo de desalojos del limitador (desvío de 03-41)** cambia en silencio la premisa con que se aceptó la falla cerrada de D-77. Antes, saturar un limitador exigía tener las K claves bloqueadas (K × L golpes). Ahora alcanzan K + L golpes de una sola petición por clave. Lo verifiqué con un script temporal: con K = 100 y L = 5, el limitador queda saturado para toda IP nueva tras 105 peticiones, no 500. La tabla de `docs/limites-del-demo.md` describe un costo de ataque que no es el real.
2. **La cota de "50 005 intentos evaluados por ventana"** que documenta D-77 no se cumple con peticiones concurrentes. `isLocked` y `hit` están separados por `await` en las rutas de acceso.
3. **Los textos de D-76.1 afirman cosas falsas** en dos caminos que el plan exige y las pruebas fijan. Además, **el umbral de 96 px de D-78** anula las subidas cortas de la usuaria cuando hay crecimiento entre ellas.

Los scripts de verificación se escribieron en `tests/` de forma temporal y se borraron. No se modificó ningún archivo fuente.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: El cupo de desalojos permite saturar cualquier limitador con K + L peticiones de un golpe y no con K × L, y la documentación subestima ese costo cinco veces

**File:** `src/http/services/rate-limiter.service.ts:32-52` (también `docs/limites-del-demo.md:62-72`)

**Issue:** `fitsEvictionBudget` suma los golpes de todas las claves desalojadas en un único `evicted` global, con un máximo de `options.limit`. Cuando el siguiente desalojo superaría ese cupo, `evictableEntry()` devuelve `undefined`, `isSaturated()` da `true` y toda clave nueva queda bloqueada (`isLocked` → `true`, `hit` → `false`). Un atacante no necesita bloquear ninguna clave para llegar ahí:

- K peticiones, una por IP o prefijo /64, llenan la tabla con claves de `count = 1`;
- L peticiones más, desde L claves nuevas, gastan el cupo (`1 + 1 + … = L`);
- desde ese momento, toda IP no rastreada recibe 429 durante hasta una ventana completa.

Con los valores de producción, eso son 10 005 peticiones contra el limitador de acceso: toda IP nueva queda fuera de `/api/acceso` durante 15 minutos, aun con el código correcto. Mantener el ataque cuesta unas K + L peticiones por ventana, frente a las K × L = 50 000 que suponía D-77 ("nunca una bloqueada"). El script temporal lo confirma: con `maxKeys = 100` y `limit = 5`, `isLocked("legit")` es `true` tras 105 peticiones, y `retryAfterMs` da la ventana entera. El propio documento reconoce que un /48 da 65 536 prefijos /64, y un /48 se consigue gratis en un tunnel broker.

La tabla de `docs/limites-del-demo.md:71` dice que el limitador de mensajes se satura "con 10 000 IP o prefijos /64 que agotan su tope en el mismo minuto", y eso es falso: basta un mensaje por IP más L. La línea 64 menciona el cupo agotado, pero no dice que se agota sin bloquear ninguna clave. Por eso la usuaria aceptó el riesgo con un costo de ataque que no es el real. En la defensa, cualquiera sin el código puede dejar fuera de la pantalla de acceso a quien evalúa y todavía no tiene la cookie.

**Fix:** no fallar cerrado por el cupo, sino trasladar los golpes desalojados a la clave que entra. Así la rotación no reinicia contadores y la saturación vuelve a exigir K claves bloqueadas:

```ts
function evictOldestUnlocked(): number | null {
  const entry = oldestUnlocked();
  if (entry === undefined) return null;
  windows.delete(entry[0]);
  return entry[1].count;
}

hit(key) {
  const now = options.now();
  sweep(now);
  const existing = windows.get(key);
  let inherited = 0;
  if (existing === undefined && isFull()) {
    const carried = evictOldestUnlocked();
    if (carried === null) return false;
    inherited = carried;
  }
  const window = existing ?? { count: inherited, start: now };
  window.count += 1;
  windows.set(key, window);
  return window.count <= options.limit;
}
```

`isSaturated()` vuelve a ser `isFull() && oldestUnlocked() === undefined`, y desaparecen `evicted`, `fitsEvictionBudget` y la rama del cupo en `msUntilAdmission`. Cada golpe evaluado sigue contado en una ventana viva, así que la cota vuelve a K × L. Hay que corregir la tabla del documento y agregar una prueba que rote K + L claves de un golpe y compruebe que una IP nueva sigue entrando.

## Warnings

### WR-01: La cota documentada de intentos evaluados no se cumple con concurrencia, porque `isLocked` y `hit` están separados por `await`

**File:** `docs/limites-del-demo.md:62` (causa en `src/http/routes/access.route.ts:57-63` y `src/http/middlewares/access.middleware.ts:20-22`)

**Issue:** el documento y el SUMMARY de 03-41 afirman que el máximo es "unos 50 000 intentos evaluados por ventana (50 005 …)" y "(K + 1) × L en cualquier orden". En `/api/acceso` el flujo es `isLocked(ip)`, luego `await readCode(c)` (lee el cuerpo de la red), luego `await timingSafeEqual(...)` y recién después `hit(ip)`. Un cliente puede abrir N conexiones, pasar todas por `isLocked` mientras su `count` sigue en 0 y después mandar los N cuerpos: se evalúan N códigos y se registran N golpes cuando ya es tarde. El middleware Bearer tiene la misma ventana alrededor del `await timingSafeEqual`. La prueba "rotar claves en ronda … (K + 1) × L" usa un flujo secuencial y no cubre este caso. Lo mismo pasa entre claves: con la tabla llena, N claves nuevas pasan por `isLocked` (no saturado) y solo L de ellas se registran en `hit`, que devuelve `false` sin guardar las demás después de que ya se evaluaron. La entropía de un código de 12 o más caracteres mitiga el riesgo práctico, pero la garantía documentada es falsa.

**Fix:** reservar el golpe antes del primer `await` y devolverlo si el código es correcto. Por ejemplo, agregar `release(key)` al `RateLimiter`: `if (!failedAttempts.hit(ip)) return 429;` antes de leer el cuerpo, y `failedAttempts.release(ip)` cuando el código es válido. Otra opción es ajustar el texto del documento para que diga que la cota es secuencial.

### WR-02: SIN_CASO afirma "No se registró ningún envío simulado" en un turno que sí registró uno

**File:** `src/domain/policies/compuerta.policy.ts:194-208` (texto en `src/config/strings.ts:257-258`; la prueba lo fija en `tests/unit/compuerta.policy.test.ts:575-576`)

**Issue:** `hayEnvioSinCaso` agrega `SIN_CASO` siempre que hay un `TRUNCADO` con `caso: null`, aunque un reintento posterior del mismo turno termine en `ENVIADO`. La prueba `truncado(null), enviado(EC)` exige justamente `[SIN_CASO]`. El texto asociado es "No se registró ningún envío simulado: el pedido no indicó un caso válido.", así que el servidor afirma que no hubo ningún envío en un turno que escribió `ENVIO-SIMULADO.md` para EC, después de que el modelo dijo "Registré el envío simulado de EC". Es el mismo tipo de afirmación falsa que D-76 quería eliminar, pero esta vez la escribe el servidor (Core Value: nunca inventar un dato). El plan 03-40 lo exige (MUST NOT suprimir), pero lo que falla es el texto, no la regla.

**Fix:** dejar la regla (el aviso no se suprime) y cambiar el texto para que no niegue lo que sí ocurrió, por ejemplo `"Un pedido de envío simulado no se registró: no indicó un caso válido."`. Si se quiere conservar el texto actual para el caso sin envíos, crear un desenlace distinto cuando `eventos` contiene un `ENVIADO`.

### WR-03: Un `simular_envio` truncado de un caso que la usuaria confirmó responde "falta tu confirmación explícita"

**File:** `src/domain/policies/compuerta.policy.ts:135-144,160-162` (texto en `src/config/strings.ts:249-250`)

**Issue:** `desenlaceDeEvento` trata el `TRUNCADO` legible igual que un `BLOQUEADO` y devuelve `REQUIERE_CONFIRMACION`. En el caso que describe el plan 03-40 (la usuaria escribe "Sí, envía X", el paso se corta por `FIN_LLM.LIMITE` y el modelo no reintenta), la autorización del turno queda sin usar y la respuesta termina con "No se registró el envío simulado de X: falta tu confirmación explícita." La usuaria sí confirmó. La causa real es que la respuesta del modelo se cortó, y el texto la lleva a pensar que su confirmación no se entendió. Es un dato falso sobre la causa.

**Fix:** distinguir el truncado autorizado. Por ejemplo, agregar a `EntradaDesenlaces` el caso autorizado del turno y, cuando `evento.tipo === EVENTO_COMPUERTA.TRUNCADO && evento.caso === autorizado`, emitir un desenlace con un texto como "No se registró el envío simulado de X: la respuesta del modelo se cortó antes de ejecutarlo; confirma de nuevo para registrarlo."

### WR-04: Con crecimiento entre pulsaciones, una subida de menos de 96 px se deshace y la usuaria no logra despegarse con flechas, la rueda de Firefox o el trackpad lento

**File:** `web/src/state/seguimiento.ts:30-36` (efecto en `web/src/components/linea-de-tiempo.tsx:149-167`; la prueba incompleta está en `tests/web/seguimiento.test.ts:154`)

**Issue:** `desplazar` revisa primero `distancia <= DISTANCIA_PEGADO_AL_FINAL` y vuelve a pegar, sin importar la dirección. Si la usuaria sube 40 px con una flecha, la vista sigue pegada. Si llega un evento SSE que hace crecer el contenido, el `ResizeObserver` llama a `seguirAlFinal`, que la baja al fondo y anota una posición nueva con `AJUSTE_PROPIO`. La siguiente pulsación parte de nuevo del fondo. Lo verifiqué con el reductor: 10 pulsaciones de 40 px intercaladas con crecimientos de 50 px dejan `pegado === true`. La prueba "flechas: … la tercera despega" no intercala crecimientos, así que solo cubre el caso sin streaming. D-78 pide que cualquier subida de la usuaria despegue la vista, incluidas las flechas, y eso no se cumple justo mientras llegan eventos, que es cuando importa.

**Fix:** dar prioridad a la dirección y dejar el umbral solo para volver a pegar al bajar. El encogimiento que deja la vista al fondo se cubre con una tolerancia mínima:

```ts
function desplazar(estado: EstadoSeguimiento, posicion: number, distancia: number): EstadoSeguimiento {
  if (distancia <= TOLERANCIA_FONDO) return conCambios(estado, { pegado: true, contenidoNuevo: false, posicion });
  if (subio(estado, posicion)) return conCambios(estado, { ...estado, pegado: false, posicion });
  if (distancia <= DISTANCIA_PEGADO_AL_FINAL) return conCambios(estado, { pegado: true, contenidoNuevo: false, posicion });
  return conCambios(estado, { ...estado, posicion });
}
```

`TOLERANCIA_FONDO` (1 o 2 px) va en `ui.constants.ts`. Hay que agregar una prueba de flechas con `CRECIMIENTO` y `AJUSTE_PROPIO` entre cada pulsación.

## Info

### IN-01: El cupo de desalojos solo prueba la clave libre más antigua

**File:** `src/http/services/rate-limiter.service.ts:36-39`

**Issue:** `evictableEntry` toma `oldestUnlocked()` y, si esa clave no cabe en el cupo, declara la tabla saturada, aunque una clave libre más nueva con `count = 1` sí cabría. Basta una clave al frente con `count = L - 1` para que, con 2 golpes ya desalojados, se cierre el limitador para todos. Esto desaparece si se aplica el arreglo de CR-01.

**Fix:** con el diseño actual, buscar la primera clave libre que quepa en el cupo. Mejor aún, aplicar el traslado de CR-01.

### IN-02: "Por ventana" es por ventana fija: en un intervalo móvil de la misma longitud caben unas dos veces K × L

**File:** `docs/limites-del-demo.md:62`

**Issue:** cada clave tiene una ventana fija que nace con su primer golpe. Si un atacante concentra L - 1 golpes al final de las ventanas de K claves y L golpes al inicio de las ventanas siguientes, consigue cerca de 2 × K × L evaluaciones en un intervalo de longitud W. El documento presenta la cifra como un máximo sin esa aclaración.

**Fix:** aclarar en el documento que la cota es por ventana de cada clave y que en un intervalo móvil puede llegar al doble.

### IN-03: Una IP sin ningún intento ve "demasiados intentos" cuando el limitador está saturado

**File:** `src/http/services/rate-limiter.service.ts:78-82`

**Issue:** `isLocked` de una clave no rastreada devuelve `isSaturated()`, y `access.route.ts` responde con `access.lockedMessage` (`TEXTO_HTTP.demasiadosIntentos`). La usuaria legítima lee que hizo demasiados intentos cuando no hizo ninguno.

**Fix:** exponer en el puerto un método `isSaturated()`, o un resultado que distinga los dos casos, y usar un texto propio como "El acceso está limitado temporalmente; intenta de nuevo en N minutos."

### IN-04: La guarda de "turno en curso" de nueva sesión y volver está repetida en tres lugares

**File:** `web/src/hooks/usar-chat.ts:123-135`, `web/src/state/conversacion.ts:284-286,372-381`

**Issue:** `nuevaSesion` y `volverASesionAnterior` revisan `estado.enCurso`, y `sesionGuardadaTras` y `sesionAnteriorDisponible` lo vuelven a revisar, igual que el reductor. Por ahora coinciden, pero si una de las copias cambia, el id guardado en `localStorage` y el estado en memoria pueden divergir sin que ninguna prueba lo detecte.

**Fix:** derivar el id guardado del estado siguiente (`sesionGuardadaTras(guardada, estado, reducirConversacion(estado, accion))`) o que el hook solo consulte una función pura que decida si la acción aplica.

### IN-05: `aplicarEvento` no tiene comprobación de exhaustividad

**File:** `src/domain/policies/compuerta.policy.ts:93-115`

**Issue:** el `switch` devuelve `void`, así que el compilador no habría avisado si el caso `TRUNCADO` se olvidaba. `desenlaceDeEvento` sí está protegido por su tipo de retorno. Una variante futura de `EventoCompuerta` caería en silencio en "no hacer nada" justo en el pliegue que decide si la compuerta queda pendiente.

**Fix:** agregar al final `default: { const _sinCubrir: never = evento; return _sinCubrir; }`, o hacer que `aplicarEvento` devuelva un valor tipado.

---

_Reviewed: 2026-10-15T20:35:04Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
