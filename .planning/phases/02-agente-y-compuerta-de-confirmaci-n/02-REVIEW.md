---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-13T22:27:07Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - src/application/types/puertos-agente.type.ts
  - src/config/constants/agent.constants.ts
  - src/config/constants/confirmacion.constants.ts
  - src/config/constants/llm.constants.ts
  - src/config/strings.ts
  - src/domain/builders/cierre-turno.builder.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/policies/confirmacion.policy.ts
  - src/infra/sessions/memory-session-store.adapter.ts
  - src/llm/mappers/wire-messages.mapper.ts
  - src/loop/services/cierre-turno.service.ts
  - src/loop/services/ejecutar-turno.service.ts
  - tests/helpers/fetch-falso.helper.ts
  - tests/helpers/types/fetch-falso.type.ts
  - tests/live/agente-en-vivo.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/loop/resiliencia.test.ts
  - tests/loop/sesion.test.ts
  - tests/unit/cierre-turno.builder.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/confirmacion.policy.test.ts
  - tests/unit/memory-session-store.adapter.test.ts
  - tests/unit/wire-messages.mapper.test.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 02: Code Review Report (re-revisión incremental tras 02-10..02-14)

**Reviewed:** 2026-10-13T22:27:07Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Esta revisión cubre el diff `421e859..HEAD` de los 24 archivos de los planes de cierre de brechas 02-10 a 02-14. Leí completos `ejecutar-turno.service.ts`, `compuerta.policy.ts`, `confirmacion.policy.ts`, `cierre-turno.builder.ts`, `cierre-turno.service.ts`, `memory-session-store.adapter.ts` y `wire-messages.mapper.ts`, además de `despacho-llamada.service.ts` y `presupuesto.service.ts` como dependencias. Probé el clasificador y `cierreConPregunta` con un script temporal que ya borré. `bun run check` (tsc, Biome y audit) pasa, y `bun test` da 1079 pass, 1 skip y 0 fail.

**Estado de los hallazgos anteriores:**

| ID | Estado | Evidencia |
|---|---|---|
| CR-01 | **Resuelto** para las frases reportadas | `"envio"` salió de `VERBOS_ENVIO` y sigue solo en `RELLENO`. `ok`, `listo`, `claro`, `vale` y `correcto` pasaron a `ACUSES` y confirman solo cuando el mensaje no tiene nada más. Lo comprobé: "y el envío", "el envío", "todo bien con el envío", "ok, gracias" y "listo, ya" dan `otro`. Queda un riesgo residual con los acuses sueltos (WR-01). |
| CR-02 | **Resuelto** | `cierreConPregunta` cierra siempre con `preguntaConfirmacion` como último párrafo cuando hay casos pendientes, y `necesitaPreguntaDeterminista` se retiró. La pregunta del modelo que nombra el caso ya no reemplaza a la del servidor. El arreglo trae un defecto nuevo: el recorte de la pregunta del modelo borra texto que no es pregunta (WR-02). |
| CR-03 | **Resuelto** | `pasoTruncado` guarda las llamadas con `ARGUMENTOS_VACIOS` (`"{}"`) y conserva `id` y `nombre`. Además, `toWireToolCall` cambia cualquier `arguments` que no sea un objeto JSON por `"{}"`. El test nuevo usa de verdad JSON cortado (`expect(() => JSON.parse(TRUNCADO)).toThrow()`), pasa por el adaptador real y comprueba que cada pedido siguiente lleve argumentos válidos. El falso verde anterior quedó corregido. |
| WR-02 | **Resuelto** para error, deadline, falta de instrucciones y tope de iteraciones | `recuperarAutorizado` devuelve el caso autorizado y no usado a pendiente cuando el motivo no es `FINAL` ni `ABORTADO`. Lo cubren los tests de `compuerta-casos.test.ts` y la tabla de `compuerta.policy.test.ts`. Con el tope de tokens, la recuperación deja la sesión preguntando para siempre algo que nunca puede cumplirse (WR-03). El cierre `FINAL` sin envío descarta la autorización en silencio (WR-04). |
| WR-03 | **Resuelto** | El candado ahora es un lease cercado (`token`, `since`, `leaseMs = deadlineMs + MARGEN_CANDADO_SESION_MS`). `liberar` y `guardar` exigen el token vigente, y un titular vencido no libera ni sobrescribe la sesión del nuevo titular. `isExpired` y `evictBeyondCapacity` respetan el lease. Hay observaciones menores en IN-02 e IN-03. |

**Reglas del proyecto (CLAUDE.md):** no hay comentarios en el código, `any` ni `enum`. Todos los imports usan alias `@/` (las únicas apariciones de `../` son datos de prueba). No hay regex nuevas fuera de `patterns.constants.ts`. Los textos nuevos (`EJEMPLOS_CONFIRMACION`, `MARCADOR_CASO`, `SIN_CONFIRMACION_NO_ENVIA`) viven en `src/config/strings.ts`, y las comparaciones usan los objetos `as const` (`MOTIVO_FIN.FINAL`, etc.). No encontré violaciones.

No hay hallazgos críticos nuevos. Las cuatro advertencias tocan el valor central del producto: confirmación humana explícita y nunca ocultar ni inventar datos.

## Warnings

### WR-01: Un acuse suelto ("ok", "listo", "claro", "correcto", "vale") sigue autorizando el envío

**File:** `src/domain/policies/confirmacion.policy.ts:50-58`, `src/config/constants/confirmacion.constants.ts:25`
**Issue:** `soloAcuses` hace que un mensaje formado solo por acuses cuente como confirmación. Con `ec-corp-andina` pendiente comprobé que `"ok"`, `"listo"`, `"claro"`, `"correcto"`, `"ok ok"` y `"vale listo"` devuelven `confirma`. Es una decisión explícita de 02-14 (D-39, "three-tier grammar"), pero choca con dos cosas:
- La pregunta del servidor ahora pide "una confirmación explícita, como "envía" o "sí"" (`strings.ts:219-226`), y un "listo" o un "ok" es justamente el acuse ambiguo que señaló CR-01.
- La misma pregunta dice "El paquete de X queda LISTO para firma". Si la analista contesta "listo" para indicar que lo leyó, o "correcto" para validar el resumen, se escribe `ENVIO-SIMULADO.md`.

La regla también es incoherente: "listo" confirma, pero "listo, ya" y "ok, gracias" dan `otro`. Un relleno de cortesía no debería convertir una confirmación en no confirmación, ni al revés.
**Fix:** Para confirmar, exige al menos una afirmación fuerte o un verbo de envío. Con eso, `ACUSES` queda permitido como palabra pero ya no basta por sí solo:
```ts
function esConfirmacionClara(palabras: readonly string[]): boolean {
  if (palabras.length > MAX_PALABRAS_CONFIRMACION) return false;
  if (palabras.some((palabra) => CONDICIONALES.has(palabra))) return false;
  return palabras.every(esPermitida) && palabras.some(esAfirmacionFuerte);
}
```
Hay que mover las filas `"ok"`, `"vale"`, `"listo"` y `"claro, ok"` de `tests/unit/confirmacion.policy.test.ts` a `OTRO`. "OK, envía" y "sí, ok" siguen confirmando. Si se decide mantener los acuses, conviene al menos retirar `listo` y `correcto`, que la analista usa para validar un resumen, y documentar el riesgo en `SOLUCION.md`.

### WR-02: `sinPreguntaFinal` borra texto que no es pregunta, incluidas advertencias de campos `requiere_confirmacion`

**File:** `src/domain/builders/cierre-turno.builder.ts:22-46`
**Issue:** El recorte trata como pregunta final cualquier línea que contenga `?` o `¿` en cualquier posición. Corta en el último ". " o "! " anterior al signo y descarta todo lo que viene después, incluidas las oraciones afirmativas. Si no encuentra fin de oración, borra la línea entera y sigue con la anterior. Resultados reales con `ec-corp-andina` pendiente:
- `"Resultado del mapeo de ec-corp-andina:\n- Régimen tributario: requiere_confirmacion (¿RIMPE o general?)\n- Actividad económica: requiere_confirmacion (¿cuál CIIU?)"` → solo queda `"Resultado del mapeo de ec-corp-andina:"`. Las dos advertencias desaparecen.
- `"Armé el paquete de ec-corp-andina. Falta el certificado (¿lo tienes?), sin él queda bloqueado."` → queda `"Armé el paquete de ec-corp-andina."`.
- `"Paquete armado: ¿lo envío?"` → no queda nada del texto del modelo.

El modelo suele formular entre paréntesis las dudas sobre campos dudosos, y el valor central exige que lo dudoso llegue a la analista como `requiere_confirmacion`. Este recorte lo oculta en silencio, justo en el turno donde se pide confirmar el envío. La fila "pregunta entre paréntesis" de `tests/unit/cierre-turno.builder.test.ts` fija este comportamiento como correcto. CR-02 solo requería que la pregunta del servidor fuera el último párrafo, y eso ya lo garantiza `cierreConPregunta`.
**Fix:** Recorta solo las líneas finales cuyo texto, sin espacios al final, termine en `?`. Dentro de esa línea, corta solo la última oración interrogativa. Las líneas con `?` en medio se conservan:
```ts
function sinPreguntaFinal(texto: string): string {
  const lineas = texto.trimEnd().split(SALTO_DE_LINEA);
  for (let ultima = lineas.pop(); ultima !== undefined; ultima = lineas.pop()) {
    const recortada = ultima.trimEnd();
    if (recortada === "") continue;
    if (!recortada.endsWith(SIGNO_CIERRE_PREGUNTA)) {
      lineas.push(ultima);
      break;
    }
    const corte = corteEnFinDeOracion(recortada, recortada.lastIndexOf(SIGNO_APERTURA_PREGUNTA));
    if (corte !== null) {
      lineas.push(recortada.slice(0, corte).trim());
      break;
    }
  }
  return lineas.join(SALTO_DE_LINEA).trimEnd();
}
```
Los signos irían como constantes en `confirmacion.constants.ts`. Añade filas de prueba con una lista de `requiere_confirmacion` que lleve `(¿…?)` y comprueba que sobrevive.

### WR-03: Con el presupuesto agotado, la recuperación de WR-02 deja la sesión pidiendo para siempre una confirmación que nunca se cumplirá

**File:** `src/domain/policies/compuerta.policy.ts:93-103`, `src/loop/services/ejecutar-turno.service.ts:310-312,318-329`, `src/loop/services/presupuesto.service.ts:8-10`
**Issue:** `recuperarAutorizado` recupera el caso cuando el motivo es `TOPE_TOKENS`. `presupuestoAgotado` es permanente para la sesión, porque `tokensUsados` nunca baja. Cada "envía" cierra entonces con `"Esta sesión agotó su presupuesto de tokens. Abre una sesión nueva para continuar.\n\n…¿Confirmas el envío simulado de ec-corp-andina?"`, `needsConfirmation: true` y un evento `confirmation_required`. La UI muestra un botón de confirmar que nunca puede funcionar, y el texto se contradice: pide abrir otra sesión y a la vez confirmar en esta. El test `compuerta-casos.test.ts` ("con el presupuesto agotado 'envía' … sigue preguntando y nunca envía") fija esa contradicción como esperada.
**Fix:** No recuperes el caso cuando el corte es irrecuperable dentro de la sesión. Deja que `recuperarAutorizado` reciba la condición, o excluye `TOPE_TOKENS` cuando el presupuesto ya está agotado al cerrar:
```ts
if (motivo === MOTIVO_FIN.FINAL || motivo === MOTIVO_FIN.ABORTADO || motivo === MOTIVO_FIN.TOPE_TOKENS) return [];
```
Si se prefiere conservar el pendiente, suprime en ese caso la pregunta y `eventosConfirmacion` (`needsConfirmation: false`) y deja solo el mensaje de presupuesto.

### WR-04: Un cierre `FINAL` con la autorización sin usar descarta en silencio la confirmación de la analista

**File:** `src/domain/policies/compuerta.policy.ts:99`, `src/loop/services/ejecutar-turno.service.ts:299-301`
**Issue:** Cuando la analista confirma y el modelo cierra el turno con solo texto, sin llamar a `proveedor_simular_envio`, `recuperarAutorizado` devuelve `[]`. La compuerta queda `LIBRE` y la respuesta es exactamente el texto del modelo. Si ese texto dice "Listo, registré el envío simulado", nada lo contradice: no hubo envío, no queda pendiente y el servidor no avisa nada. Es la forma más directa de que el agente "invente" una acción externa. La decisión está fijada en el test de control "si el modelo solo responde texto tras 'envía', el turno cierra LIBRE sin preguntar". Ahora que WR-02 recupera el caso en los cortes por error, la asimetría resulta más visible.
**Fix:** Cuando el turno cierra `FINAL` con `autorizacion.caso !== null && !autorizacion.usada`, conserva el caso como pendiente, igual que en los demás motivos. Así el servidor vuelve a cerrar con su pregunta y el último párrafo nunca respalda un envío que no ocurrió. Como mínimo, añade un aviso determinista en `strings.ts` (por ejemplo, "No se registró ningún envío simulado de X.").

## Info

### IN-01: Si el envío autorizado se ejecuta y falla, el caso desaparece de los pendientes

**File:** `src/loop/services/despacho-llamada.service.ts:79-93`, `src/domain/policies/compuerta.policy.ts:100`
**Issue:** `evaluarEnvio` marca `usada: true` antes de ejecutar la herramienta. Si `simular_envio` devuelve `ok: false` (error de E/S, `PAQUETE_NO_ARMADO`, plantilla ausente…), no se emite `ENVIADO` y `recuperarAutorizado` descarta el caso porque ya está `usada`. El turno cierra `LIBRE`, salvo que el modelo reintente y provoque un `BLOQUEADO`. Es la misma pérdida que describía WR-02, en el camino de "enviado pero fallido".
**Fix:** Recupera también cuando `envioPermitido && !resultado.ok`, por ejemplo con un evento `BLOQUEADO` para ese caso en `despacharEnvio`.

### IN-02: Cuando `guardar` es rechazado, el turno igual anuncia texto y `confirmation_required` como si el estado se hubiera guardado

**File:** `src/loop/services/ejecutar-turno.service.ts:410-419`
**Issue:** `sesionGuardada: false` solo se registra en la bitácora. `emitirCierre` emite igual la pregunta y los eventos de confirmación, y `FIN_TURNO` lleva `needsConfirmation: true` aunque la sesión guardada no tenga ese pendiente. Solo ocurre con un titular vencido, cuyo consumidor normalmente ya se fue, así que el impacto es bajo.
**Fix:** Si `guardarSesion` devuelve `false`, emite un error `SESION_OCUPADA` o un cierre sin eventos de confirmación.

### IN-03: El cercado depende de que el deadline (temporizador monotónico) venza antes que el lease (reloj de pared), y el cercado solo protege `guardar`

**File:** `src/infra/sessions/memory-session-store.adapter.ts:14-16,57-63`, `src/loop/services/ejecutar-turno.service.ts:439-442`
**Issue:** El lease se mide con `Date.now()` y el deadline con `AbortSignal.timeout`. Si el reloj de pared salta hacia adelante (por ejemplo, un ajuste NTP), el lease puede vencer mientras el turno legítimo sigue vivo. Entonces corren dos turnos sobre la misma sesión y ambos ejecutan herramientas, incluido `simular_envio`, aunque solo uno pueda guardar. El test "un titular vencido que se reanuda…" de `sesion.test.ts` lo muestra: con el reloj adelantado, el turno A sigue ejecutando la herramienta y llamando al LLM después de perder el candado.
**Fix:** Mide el lease con `performance.now()`, o antes de cada herramienta comprueba que el turno siga siendo titular (por ejemplo, con un `vigente(id, candado)` en el puerto).

### IN-04: "si" sin tilde se clasifica siempre como afirmación, aunque pueda ser el condicional "si"

**File:** `src/domain/policies/confirmacion.policy.ts:25-27`, `src/config/constants/confirmacion.constants.ts:12`
**Issue:** `normalizar` quita las tildes, así que "si todo bien" y "si, todo bien con el paquete" dan `confirma`. "si todo bien" puede leerse como condicional ("si todo está bien…"). Es un caso límite, porque la mayoría de los condicionales llevan palabras fuera de la lista permitida.
**Fix:** Considera exigir que "si" vaya solo o acompañado de un verbo de envío, o agrega "si todo bien" a la tabla como `otro`.

### IN-05: La instrucción de siguiente paso dice "envía" o "sí" aunque haya varios casos pendientes

**File:** `src/config/strings.ts:245-246`, `src/loop/services/presupuesto.service.ts:16-18`
**Issue:** `SIGUIENTE_PASO[SIMULAR_ENVIO]` usa siempre `CONFIRMA_UN_CASO`. Con dos paquetes armados, `cierreDeterminista` y `cierrePorPresupuesto` muestran por cada caso "como "envía" o "sí"", mientras que la pregunta del servidor pide `"envía <caso>"`. Un "sí" da `falta_caso`, así que no hay riesgo de envío, pero sí un paso de más y texto duplicado con la pregunta final.
**Fix:** Usa `CONFIRMA_VARIOS_CASOS` con el caso ya sustituido (`envía ${caso}`) en `SIGUIENTE_PASO`, u omite esa línea cuando el servidor ya agrega su pregunta.

---

_Reviewed: 2026-10-13T22:27:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
