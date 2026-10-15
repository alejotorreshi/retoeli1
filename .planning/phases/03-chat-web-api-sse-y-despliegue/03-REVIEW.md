---
phase: 03-chat-web-api-sse-y-despliegue
reviewed: 2026-10-15T23:23:37Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - docs/limites-del-demo.md
  - src/config/constants/confirmation.constants.ts
  - src/config/strings.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/types/compuerta.type.ts
  - src/http/middlewares/access.middleware.ts
  - src/http/routes/access.route.ts
  - src/http/services/rate-limiter.service.ts
  - src/http/types/server.type.ts
  - src/loop/services/paso-herramientas.service.ts
  - tests/http/acceso.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/rate-limiter.service.test.ts
  - tests/web/seguimiento.test.ts
  - web/src/config/constants/ui.constants.ts
  - web/src/state/seguimiento.ts
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 03: Code Review Report (incremental, planes 03-44 a 03-47)

**Reviewed:** 2026-10-15T23:23:37Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Se revisó el diff desde `cc1b7fa` de los cuatro planes de cierre de brechas: D-77.1 (herencia de golpes en `createRateLimiter`), D-77.2 (reserva del intento antes del primer `await` en `/api/acceso` y en el Bearer), D-76.2 (evento y desenlace `TRUNCADO_CONFIRMADO` y texto nuevo de `SIN_CASO`) y D-78.1 (en el seguimiento de la línea de tiempo gana la dirección).

Lo central quedó bien:

- **Limitador.** La herencia conserva la suma de golpes vivos, así que la cota K × L se sostiene. El orden de inserción del `Map` sigue siendo el orden de `start`, de modo que `sweep` y `msUntilAdmission` siguen valiendo. `hit` comprueba y cuenta en un solo paso síncrono.
- **Seguimiento.** El reductor es correcto. Con `overflow-anchor: none` en `linea-de-tiempo.module.css`, la única forma de que la posición baje sin una acción de la usuaria es que el contenido se encoja y la vista quede recortada al fondo. Ese caso lo cubre `TOLERANCIA_FONDO`, y también la distancia negativa del rebote elástico de Safari.

Quedan dos defectos de conducta:

1. La reserva de D-77.2 rechaza credenciales **válidas** con 429 cuando llegan pedidos simultáneos, aunque el cliente no tenga ningún fallo, y la respuesta dice que hay que esperar 15 minutos. Se reprodujo: 10 Bearer correctos simultáneos sin fallos previos dan 5 respuestas 400 y 5 respuestas 429 con "Demasiados intentos fallidos. Espera 15 minutos…", y el pedido siguiente entra con 204.
2. `eventoDeTruncado` marca como `TRUNCADO_CONFIRMADO` un truncado cuya autorización ya se gastó (`usada: true`), así que el aviso atribuye al corte un envío que igual habría quedado bloqueado.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: La reserva de D-77.2 responde 429 a credenciales válidas cuando llegan juntas, y el texto anuncia un bloqueo de 15 minutos que no existe

**File:** `src/http/middlewares/access.middleware.ts:20-24`, `src/http/routes/access.route.ts:57-69`, `docs/limites-del-demo.md:68`
**Issue:** Cada pedido con Bearer (y cada `POST /api/acceso`) ocupa un golpe del limitador de intentos fallidos mientras dura su `await`, aunque traiga el código correcto. Con L = 5, el sexto pedido simultáneo desde la misma IP (o el mismo /64, o la misma NAT de oficina) recibe `RESULTADO_BEARER.BLOQUEADO` aunque nadie haya fallado. La respuesta lleva `access.lockedMessage`: "Demasiados intentos fallidos. Espera 15 minutos y vuelve a intentarlo." Eso es falso, porque el pedido siguiente entra de inmediato.

Se reprodujo con `crearServidorPrueba`, sin fallos previos, lanzando 10 `POST /api/chat` simultáneos con `Bearer <código correcto>`:

```
[400, 400, 400, 400, 400, 429, 429, 429, 429, 429]
{ mensaje: "Demasiados intentos fallidos. Espera 15 minutos y vuelve a intentarlo." }
acceso después: 204
```

Mientras duran esas reservas, `/api/acceso` también le responde 429 a cualquier otra persona detrás de la misma IP. El documento (`limites-del-demo.md`, párrafo D-77.2) dice que "Un código o un Bearer correctos devuelven su reserva", pero no advierte que mientras la tienen pueden dejar fuera a pedidos válidos. La prueba `tras cuatro fallos, diez Bearer correctos simultáneos pasan al menos una vez` fija esta conducta en lugar de señalarla: acepta que 9 de 10 credenciales válidas reciban 429.

La SPA no manda Bearer, así que el chat web no se ve afectado. Sí se ven afectados el acceso programático (curl, scripts de humo, la defensa) y varias analistas que entren a la vez detrás de una NAT.

**Fix:** Distinguir "sin cupo de reserva" de "bloqueado". La forma mínima es que el limitador exponga los golpes en vuelo aparte de los fallos ya evaluados, y que el 429 por falta de reserva use un texto propio sin el plazo de 15 minutos (y un `Retry-After` corto):

```ts
// server.type.ts
export type RateLimiter = {
  hit(key: string): boolean;
  release(key: string): void;
  isLocked(key: string): boolean;
  retryAfterMs(key: string): number;
};
// access.middleware.ts
if (!access.failedAttempts.hit(clientIp)) {
  return access.failedAttempts.isLocked(clientIp) ? RESULTADO_BEARER.BLOQUEADO : RESULTADO_BEARER.OCUPADO;
}
```

Hoy eso no alcanza, porque las reservas en vuelo cuentan en `count`, así que `isLocked` también da `true` durante la carrera. Habría que llevar un `pending` separado en `Window`, con `hit` comparando `count + pending < limit` y `release` restando de `pending`, y que un 401 pase el golpe de `pending` a `count`. Si se decide aceptar la conducta, al menos hay que documentarla en `limites-del-demo.md` y en el texto del 429 ("Hay otro intento en curso desde tu red; vuelve a intentarlo en unos segundos"), y la prueba con 0 fallos previos debería afirmarla explícitamente.

### WR-02: `eventoDeTruncado` marca como "confirmado" un truncado cuya autorización ya se gastó, y el aviso miente sobre la causa

**File:** `src/loop/services/paso-herramientas.service.ts:40-46`
**Issue:** El predicado es `caso === turno.autorizacion.caso` e ignora `turno.autorizacion.usada`. `evaluarEnvio` (`compuerta.policy.ts:65-68`) marca `usada: true` siempre que permite el envío, también cuando la herramienta falla después (`despacho-llamada.service.ts:71-83` emite `FALLIDO` con `evaluacion.siguiente`).

En la secuencia "envía EC" → `simular_envio(EC)` que falla (`FALLIDO`) → el modelo reintenta y la respuesta se corta por `length` con `simular_envio(EC)` legible, la llamada cortada se anota como `TRUNCADO_CONFIRMADO`. El cierre muestra dos avisos para el mismo caso:

- "No se registró el envío simulado de EC: la herramienta no pudo registrarlo."
- "No se registró el envío simulado de EC: se cortó antes de ejecutarse y hay que pedirlo de nuevo."

El segundo es inexacto. Aunque no se hubiera cortado, esa llamada habría quedado `BLOQUEADO`, porque la confirmación ya se había usado. Antes de 03-46 el desenlace era `REQUIERE_CONFIRMACION`, que sí era exacto. Esto contradice el objetivo de D-76.2 ("los avisos del servidor son exactos"). Ninguna fila de `compuerta-casos.test.ts` ni de `compuerta.policy.test.ts` cubre un `TRUNCADO_CONFIRMADO` con la autorización gastada.

**Fix:** Usar la misma regla que decide el envío real:

```ts
import { evaluarEnvio } from "@/domain/policies/compuerta.policy.ts";

function eventoDeTruncado(turno: Turno, llamada: LlamadaHerramienta): EventoCompuerta {
  const caso = casoDeLlamada(llamada);
  if (caso !== null && evaluarEnvio(turno.autorizacion, caso).permitido) {
    return { tipo: EVENTO_COMPUERTA.TRUNCADO_CONFIRMADO, caso };
  }
  return { tipo: EVENTO_COMPUERTA.TRUNCADO, caso };
}
```

También hay que sumar una fila de integración: confirmar → `FALLIDO` → truncado legible del mismo caso, que debe dar `FALLIDO` y `REQUIERE_CONFIRMACION`, no `TRUNCADO_CONFIRMADO`.

## Info

### IN-01: Una reserva cuya clave se desaloja durante el `await` queda como golpe fantasma en otra IP

**File:** `src/http/services/rate-limiter.service.ts:30-42, 69-75`
**Issue:** Con la tabla llena, si la clave X reserva y la desalojan antes de su `release` (porque pasó a ser la libre más antigua mientras se leía el cuerpo), su golpe reservado pasa por herencia a la clave nueva Y. Después, `release(X)` no hace nada (X ya no está rastreada) o resta de la ventana que X heredó al volver a entrar. La suma global se conserva, así que la cota K × L no se rompe. Pero Y, que puede ser una IP legítima, carga un golpe que nunca se evaluó. El escenario es improbable: hacen falta K admisiones durante la lectura de un cuerpo. No está documentado.
**Fix:** Documentarlo junto al "costo de la herencia" en `limites-del-demo.md`, o no permitir desalojar una clave con reservas en vuelo (lo que requiere el `pending` de WR-01).

### IN-02: El documento acota los 50 000 intentos "contra `/api/acceso`", pero el Bearer comparte el mismo limitador

**File:** `docs/limites-del-demo.md:66`
**Issue:** "la cota es K × L = 50 000 intentos evaluados contra `/api/acceso`". El mismo `failedAttempts` lo consume `checkBearer` en todas las rutas protegidas, así que la cota es conjunta entre `/api/acceso` y `Authorization: Bearer`. El número no cambia, pero la redacción sugiere que el Bearer queda fuera.
**Fix:** Cambiar a "intentos evaluados contra el código de acceso (`/api/acceso` y `Authorization: Bearer` juntos)".

### IN-03: Las filas de concurrencia de D-77.2 con códigos correctos afirman "al menos una vez" en vez del valor determinista

**File:** `tests/http/acceso.test.ts:624-641, 676-694`
**Issue:** Con L − 1 fallos previos, todas las reservas ocurren antes del primer `release`, así que el resultado es determinista: exactamente 1 entrada y 9 respuestas 429. `toBeGreaterThanOrEqual(1)` deja pasar una regresión que haga entrar a más pedidos de los que caben en el cupo. Además, ninguna fila cubre la conducta de WR-01 con 0 fallos.
**Fix:** Afirmar `entradas === 1` y `bloqueadas === PEDIDOS_CORRECTOS_SIMULTANEOS - 1`, y sumar una fila sin fallos previos que fije lo que se decida en WR-01.

### IN-04: La comprobación exhaustiva con `never` está solo en `aplicarEvento`

**File:** `src/domain/policies/compuerta.policy.ts:116-118`
**Issue:** `aplicarEvento` agrega `default: { const _sinCubrir: never = evento; }`, pero `desenlaceDeEvento` (líneas 168-181) depende solo del tipo de retorno para detectar una variante nueva. Funciona, porque TS exige retorno en todos los caminos, pero hay dos patrones para la misma garantía en el mismo archivo, y la variable `_sinCubrir` existe solo para engañar al linter.
**Fix:** Unificar con un helper `function sinCubrir(valor: never): never { return valor; }` en `domain/utils/`, y usarlo en los dos `switch`.

---

_Reviewed: 2026-10-15T23:23:37Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
