---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-14T03:18:08Z
depth: standard
review_kind: incremental-gap-closure
scope: "planes 02-19 a 02-21 (cierre de CR-01, WR-01 y WR-02), diff 524051a..HEAD"
diff_base: 524051aa9c9cd066f26ff4c3134feb4294cdae1c
files_reviewed: 17
files_reviewed_list:
  - agent/prompt.md
  - src/config/constants/confirmation.constants.ts
  - src/config/constants/text.constants.ts
  - src/config/strings.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/types/compuerta.type.ts
  - src/domain/utils/formatear-issues.util.ts
  - src/knowledge/registro-proveedor.md
  - src/loop/services/despacho-llamada.service.ts
  - src/loop/services/ejecutar-turno.service.ts
  - tests/contract/env-agente.test.ts
  - tests/contract/instrucciones-agente.test.ts
  - tests/live/agente-en-vivo.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/formatear-issues.util.test.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Fase 02: informe de code review (cierre de brechas 02-19 a 02-21)

**Revisado:** 2026-10-14T03:18:08Z
**Profundidad:** standard
**Archivos revisados:** 17
**Estado:** issues_found

## Resumen

Esta ronda revisa los tres planes que cierran los hallazgos de la ronda anterior:

- 02-19 implementa la opción A de CR-01 (D-63.6): solo un rechazo explícito cancela lo pendiente, y el servidor vuelve a preguntar.
- 02-20 agrega el evento `FALLIDO` para un envío autorizado que falla (WR-02, D-63.7) y une los issues de configuración con un solo punto final (WR-01).
- 02-21 actualiza la prueba en vivo con el guion "ok" y luego "sí".

Verificación de los tres hallazgos:

- **CR-01: resuelto.** `abrirTurno` conserva el estado ante `otro`, `falta_caso` o la confirmación de un caso no pendiente. `crearTurno` arrastra siempre `pendientesDe(apertura.siguiente)`. `recuperarAutorizado` devuelve a pendiente una autorización que no se usó también en el cierre `FINAL`. `agent/prompt.md:50` y `:54` ya no le piden al modelo que pregunte. La prueba `tests/loop/compuerta.test.ts` "CR-01 (D-63.6)" ejecuta el guion que exige el prompt ("ok" sin herramientas y luego "sí") y comprueba que se envía una sola vez.
- **WR-01: resuelto.** `formatearIssues` quita el punto final de todos los issues salvo el último. Para el arranque, `cerrarOracion` agrega el punto si falta. Dos literales completos de `env-agente.test.ts` lo fijan.
- **WR-02: resuelto.** `despacharEnvio` emite `FALLIDO` cuando `resultado.ok` es falso, y `aplicarEvento` lo trata como `BLOQUEADO`. Se cubren los casos `PAQUETE_NO_ARMADO`, `PAQUETE_DESACTUALIZADO`, `ERROR_INTERNO` seguido de un error del proveedor, y dos fallos seguidos.

Ejecuté las 8 suites del alcance más los guardianes (250 pruebas, 0 fallos) y también `bun run check` (tsc, Biome y audit), todo en verde. Probé el clasificador con `bun -e`, sin crear archivos. Ningún archivo fuente quedó modificado.

D-63.6 cambió la consecuencia de clasificar un mensaje: antes `otro` y `rechaza` terminaban igual (LIBRE), y ahora uno conserva el caso pendiente y el otro lo cancela. Eso vuelve críticas para el comportamiento dos imprecisiones del clasificador que antes no tenían efecto (WR-15 y WR-16). Además, el rechazo estructurado de la tarjeta cancela todos los casos, no solo el que nombra (WR-17). Por último, D-63.7 vuelve a ofrecer el envío de un paquete que la herramienta acaba de declarar inexistente o desactualizado, con un texto del servidor que lo describe como vigente (WR-18). Ninguno permite un envío sin confirmación explícita, así que no hay BLOCKER.

## Rondas anteriores

| ID | Severidad | Estado actual | Evidencia |
|----|-----------|---------------|-----------|
| CR-01 | critical | **resuelto** (02-19, D-63.6) | `compuerta.policy.ts:46-57`, `ejecutar-turno.service.ts:80`, `prompt.md:50,54`, `tests/loop/compuerta.test.ts` "CR-01 (D-63.6)" |
| WR-01 | warning | **resuelto** (02-20) | `formatear-issues.util.ts:10-20`, `tests/contract/env-agente.test.ts` "varios issues de configuración" |
| WR-02 | warning | **resuelto** (02-20, D-63.7) | `despacho-llamada.service.ts:78`, `compuerta.policy.ts:102-104`; efecto lateral en WR-18 |
| IN-01 | info | abierto, mitigado | Una frase de tipo `otro` ahora solo cuesta una repregunta. Los falsos `rechaza` siguen y ahora contradicen D-63.6 (ver WR-16) |
| IN-02 | info | abierto | `guardado-turno.service.ts` no cambió: el pliegue se sigue calculando dos veces |
| IN-03 | info | abierto | `prompt.md:49,55` siguen fijando "envía", "sí" y `ENVIO-SIMULADO.md` sin una prueba que los ate a sus constantes |
| IN-04 | info | abierto | La semilla T04 está fuera del alcance de esta ronda y no cambió |
| IN-05 | info | parcial | `FIN_DE_ORACION` pasó a `text.constants.ts`, pero `FINES_DE_ORACION` sigue en `confirmation.constants.ts:9` |
| R2-IN-01 | info | **resuelto** (es el mismo defecto que WR-02, cerrado por 02-20) | `despacho-llamada.service.ts:78` |
| WR-03 | warning | abierto, **agravado por D-63.6** | Con el presupuesto agotado, `resolverTurno` cierra en `TOPE_TOKENS` sin llamar al modelo. Antes, cualquier mensaje `otro` liberaba la compuerta; ahora todo mensaje que no sea una negación (por ejemplo "hola") recibe otra vez "¿Confirmas el envío simulado…?", y un "sí" nunca puede enviar. La única salida es una negación |
| WR-04, WR-05, WR-06, IN-07, IN-08 | — | abiertos | Fuera del alcance de este diff |
| R2-WR-02, R2-IN-02, R2-IN-03, R2-IN-05 | — | abiertos | Fuera del alcance de este diff |
| R1-WR-01, R1-WR-04, R1-IN-01, R1-IN-02, R1-IN-04, R1-IN-05 | — | abiertos | Fuera del alcance de este diff |
| WR-07 a WR-14, IN-06, IN-09 a IN-22, CR-02, CR-03, R2-CR-01, R2-WR-01, R2-IN-04, R1-WR-02, R1-WR-03, R1-IN-03 | — | resueltos (sin cambios) | Ver `02-REVIEW-DISPOSITION.md` |

## Hallazgos narrativos (revisor IA)

Los IDs nuevos siguen la numeración del ledger (WR-15 en adelante, IN-23 en adelante) para no reutilizar los de rondas anteriores.

## Advertencias

### WR-15: [WARNING] "No envíes nada todavía" seguido de una pregunta ya no cancela: el servidor vuelve a pedir la confirmación justo después de la negación

**Archivos:** `src/domain/policies/confirmacion.policy.ts:84-86`, `src/domain/policies/compuerta.policy.ts:56`, `agent/prompt.md:51`, `src/knowledge/registro-proveedor.md:42`

**Problema:** `clasificarConfirmacion` evalúa `PATRON_PREGUNTA` antes que `NEGACIONES`, así que cualquier mensaje con "?" o "¿" da `otro` aunque tenga una negación explícita. Lo comprobé con el clasificador real:

```
"No envíes nada todavía, ¿qué falta?"            -> otro
"¿Qué falta? No envíes nada todavía."             -> otro
"no lo envíes aún, ¿puedes revisar el NIT?"      -> otro
"No envíes nada todavía."                         -> rechaza
```

Antes de D-63.6 esto no tenía efecto, porque `otro` también liberaba la compuerta. Ahora `abrirTurno` (línea 56) mantiene el caso pendiente, y el servidor agrega "¿Confirmas el envío simulado de …?" en la respuesta al mensaje en el que la analista pidió no enviar. Además, `prompt.md:51` le indica al modelo que, ante esa negación, diga que la confirmación quedó cancelada. La respuesta termina diciendo "queda cancelada" y, en el párrafo siguiente, pide confirmar el envío. Eso contradice RN4 en el conocimiento (línea 42: "una negación como 'no envíes nada todavía' la cancela"). No hay envío sin confirmación, porque el mensaje siguiente todavía tiene que confirmar, pero la defensa del guion §11 con una pregunta agregada lo muestra en pantalla.

**Arreglo:** que la negación tenga precedencia sobre la pregunta, y fijarlo con pruebas de unidad y de bucle:

```ts
export function clasificarConfirmacion(texto: string, pendientes: readonly string[]): DecisionConfirmacion {
  const normalizado = sinDiacriticos(texto).toLowerCase().trim();
  if (normalizado === "") return OTRO;
  const frase = separar(normalizado);
  if (frase.palabras.some((palabra) => NEGACIONES.has(palabra))) return RECHAZA;
  if (PATRON_PREGUNTA.test(texto)) return OTRO;
  if (!esConfirmacionClara(texto, frase)) return OTRO;
  return casoConfirmado(frase.slugs, pendientes);
}
```

Hay que registrar el cambio en D-63.5/D-63.6, porque "¿no hay nada más?" pasaría a cancelar. Es el lado seguro.

### WR-16: [WARNING] un pedido distinto que contiene "para", "no", "luego", "mejor" o "después" se clasifica como rechazo y cancela el caso pendiente, aunque D-63.6 y el prompt prometen que sigue pendiente

**Archivos:** `src/config/constants/confirmation.constants.ts:63-89`, `src/domain/policies/confirmacion.policy.ts:86`, `src/domain/policies/compuerta.policy.ts:47-48`, `agent/prompt.md:53`, `src/knowledge/registro-proveedor.md:42`, `:63`

**Problema:** `NEGACIONES` se busca en todo el mensaje, sin importar el contexto. Probado con `ec-corp-andina` pendiente:

```
"Procesa el caso co-industrias-delta para tenerlo listo"  -> rechaza
"Procesa co-industrias-delta, luego vemos el otro"         -> rechaza
"dame el NIT de ec-corp-andina, no el RUC"                 -> rechaza
"mejor procesa pe-andes"                                   -> rechaza
"envía el paquete de ec-corp-andina para firma"            -> rechaza
```

D-63.6 dice que "un pedido distinto como 'procesa el caso Y'" deja pendientes todos los casos. `prompt.md:53` le dice al modelo que en ese caso "Ese paquete sigue pendiente y el servidor vuelve a agregar su pregunta". Pero el servidor lo cancela y el modelo no lo sabe. La respuesta pregunta solo por el caso nuevo, y el caso anterior desaparece de la compuerta sin que nadie lo diga. Cuando la analista confirma después ese caso, recibe `CONFIRMACION_REQUERIDA` y tiene que confirmar otra vez: es el mismo costo que tenía CR-01, ahora en otra familia de frases. El último ejemplo es una confirmación explícita que se trata como rechazo (ya estaba anotado en IN-01).

**Arreglo:** que una negación cancele solo cuando el mensaje habla del envío, o sea, cuando la frase no contiene un verbo de otra tarea. Lo mínimo:

- Quitar de `NEGACIONES` las palabras que son conectores comunes ("para", "luego", "despues", "mejor", "momento", "aun"), o exigir que acompañen a un verbo de envío o a "nada".
- Que `clasificarConfirmacion` devuelva `rechaza` solo si hay una negación y, además, un verbo de `VERBOS_ENVIO` o una palabra del grupo "nada/todavía/espera/cancela".

Agrega pruebas de bucle con "procesa el caso Y para …" y un caso pendiente, que comprueben que la pregunta del servidor nombra los dos casos.

### WR-17: [WARNING] el rechazo estructurado de un caso (`{ aprobada: false, caso }`) cancela todos los casos pendientes

**Archivos:** `src/loop/services/ejecutar-turno.service.ts:57-59`, `src/domain/policies/compuerta.policy.ts:47-48`, `src/loop/types/turno.type.ts:42`

**Problema:** el servidor emite un `confirmation_required` por caso pendiente (`cierre-turno.service.ts:26`), y la UI de la Fase 3 los va a mostrar como tarjetas separadas. La confirmación estructurada lleva el `caso`. Sin embargo, `decisionDe` lo descarta cuando `aprobada` es `false` y devuelve un `RECHAZA` global, y `abrirTurno` cierra la compuerta en LIBRE. Con `ec-corp-andina` y `co-industrias-delta` pendientes, pulsar "No" en la tarjeta de EC también cancela CO. Esto no cuadra con D-63.6, donde la aprobación es por caso ("Al confirmar un caso entre varios se autoriza solo ese, y los demás siguen pendientes"). Tampoco hay ninguna prueba que fije el comportamiento del botón de rechazo con varios casos.

**Arreglo:** un rechazo con caso quita solo ese caso. El rechazo por texto puede seguir siendo global.

```ts
// confirmacion.type.ts
| { readonly decision: typeof DECISION_CONFIRMACION.RECHAZA; readonly caso: string | null }

// ejecutar-turno.service.ts
: { decision: DECISION_CONFIRMACION.RECHAZA, caso: confirmacion.caso };

// compuerta.policy.ts
if (decision.decision === DECISION_CONFIRMACION.RECHAZA && decision.caso !== null) {
  return { autorizado: null, siguiente: estadoSin(estado, decision.caso) };
}
```

Agrega una prueba de unidad para `abrirTurno` y una de bucle con dos casos y `confirmacion: { aprobada: false, caso: EC }`.

### WR-18: [WARNING] D-63.7 vuelve a ofrecer el envío de un paquete que la herramienta acaba de declarar no armado o desactualizado, y el texto del servidor lo describe como vigente

**Archivos:** `src/loop/services/despacho-llamada.service.ts:78`, `src/domain/policies/compuerta.policy.ts:76-85`, `:102-104`, `src/config/strings.ts:226-229`, `src/knowledge/registro-proveedor.md:53-54`, `tests/loop/compuerta-casos.test.ts` ("dos envíos autorizados que fallan seguidos…")

**Problema:** `FALLIDO` reabre el caso con el `CasoPendiente` de `paquetesConocidos`, sin importar el código del fallo. Con `PAQUETE_NO_ARMADO` (falta el checklist) o `PAQUETE_DESACTUALIZADO` (el paquete ya no coincide con el maestro), si el modelo no vuelve a armar el paquete en ese turno pasa esto:

- El servidor agrega `TEXTO_CONFIRMACION.unCaso`: "El paquete de X queda LISTO para firma. Para registrar el envío simulado … ¿Confirmas…?", o "queda BLOQUEADO: <bloqueos viejos>". Lo dice justo después de que la herramienta informó que ese paquete no existe o no está al día. Es una afirmación de estado del servidor que ninguna herramienta respalda y que la contradice, contra el principio "nunca inventa un dato".
- El conocimiento (líneas 53 y 54) dice "La confirmación anterior ya no vale" y manda volver a armar el paquete antes de pedir confirmación. El servidor, en cambio, la pide sobre el paquete viejo.
- Cada "sí" posterior vuelve a fallar con el mismo código y vuelve a preguntar. La prueba "dos envíos autorizados que fallan seguidos vuelven a preguntar cada vez" fija ese bucle como comportamiento esperado.

`simularEnvio` vuelve a validar el paquete, así que no se envía nada viejo. El defecto está en el texto y en el bucle, no en la seguridad.

**Arreglo:** que solo los fallos transitorios reabran el caso. Para los fallos que exigen volver a armar el paquete, el caso sale de la compuerta, y el `ARMADO` siguiente abre un ciclo nuevo, como ya dice el conocimiento.

```ts
const REQUIERE_REARMAR: ReadonlySet<string> = new Set([
  CODIGO_ERROR.PAQUETE_NO_ARMADO,
  CODIGO_ERROR.PAQUETE_DESACTUALIZADO,
]);

evento: resultado.ok
  ? { tipo: EVENTO_COMPUERTA.ENVIADO, caso }
  : REQUIERE_REARMAR.has(resultado.codigo ?? "")
    ? null
    : { tipo: EVENTO_COMPUERTA.FALLIDO, caso },
```

(Pon la constante en `confirmation.constants.ts`.) Otra opción es conservar la reapertura pero con una pregunta distinta, que diga que hay que volver a armar el paquete en lugar de "queda LISTO". Cualquiera de las dos exige enmendar D-63.7, que hoy enumera esos dos códigos.

## Info

### IN-23: [INFO] un `simular_envio` desobediente en el mismo turno de un rechazo explícito deshace el rechazo

**Archivos:** `src/domain/policies/compuerta.policy.ts:47-48`, `:76-85`, `:102-104`, `src/loop/services/despacho-llamada.service.ts:55`

**Problema:** "No envíes nada todavía" da `rechaza`, y `abrirTurno` cierra en LIBRE. Pero si el modelo desobedece y llama a `simular_envio` en ese mismo turno, `bloquearEnvio` emite `BLOQUEADO`, `reabrirConocido` vuelve a poner el caso en pendiente desde `paquetesConocidos`, y el servidor termina el turno preguntando "¿Confirmas el envío simulado…?" justo después de la negación. D-63.6 dice que solo tres caminos sacan un caso de la compuerta, y un rechazo es uno de ellos. Que un intento bloqueado lo deshaga contradice esa regla. Ninguna prueba cubre este caso: la del rechazo usa un modelo obediente.

**Arreglo:** que el turno recuerde qué casos rechazó en la apertura (por ejemplo, `AperturaTurno.rechazados`) y que `reabrirConocido` no los reabra en ese turno.

### IN-24: [INFO] `SEPARADOR_ISSUES` es el mismo "; " que usa `TEXTO_ENV.urlNoSegura` dentro de su oración

**Archivos:** `src/config/constants/text.constants.ts:6`, `src/config/strings.ts:315`, `tests/contract/env-agente.test.ts` (`MENSAJE_DOS_URLS_NO_SEGURAS`)

**Problema:** "…debe usar https; solo estos hosts… [::1]; LLM_FALLBACK_BASE_URL: …" usa el mismo separador para los dos niveles. El literal fijado en la prueba deja la ambigüedad a la vista: solo el prefijo `RUTA:` indica dónde empieza el issue siguiente.

**Arreglo:** cambia el separador interno de `urlNoSegura` por ":" o por una coma, o une los issues con " | ".

### IN-25: [INFO] la prueba "PAQUETE_DESACTUALIZADO y un re-armado en el mismo turno dejan el caso pendiente con los bloqueos nuevos" no comprueba ningún bloqueo

**Archivo:** `tests/loop/compuerta-casos.test.ts` (describe "WR-02 (D-63.7)", segundo test)

**Problema:** el re-armado produce los mismos bloqueos que el armado original, y la prueba solo comprueba el código del fallo, `vuelvePreguntandoPorEc` y el envío del turno siguiente. Si el pliegue dejara los bloqueos viejos en lugar de los nuevos, la prueba pasaría igual. El caso de unidad equivalente (`compuerta.policy.test.ts`, `reArmado` con `bloqueos: []`) sí lo cubre.

**Arreglo:** cambia el maestro o el soporte entre el armado y el re-armado para que los bloqueos difieran y comprueba `confirmaciones(turno2)[0].bloqueos`, o renombra la prueba.

### IN-26: [INFO] los contratos nuevos del prompt y del conocimiento comprueban fragmentos tan cortos que no fijan la regla

**Archivo:** `tests/contract/instrucciones-agente.test.ts` (describe "la re-pregunta es del servidor" y "un envío que falla vuelve a quedar pendiente")

**Problema:** `expect(conocimiento).toContain("la cancela")` y `toContain("vuelve a quedar pendiente")` pasan con cualquier frase que contenga esas palabras. La regla que deberían fijar es que "una negación la cancela" y que "un simular_envio fallido no se reintenta". Si alguien reescribe RN4 en sentido contrario y conserva las palabras, por ejemplo "un pedido distinto la cancela", la prueba sigue en verde.

**Arreglo:** comprueba la oración completa, o al menos el fragmento que lleva el sujeto ("una negación como \"no envíes nada todavía\" la cancela", "Si falló proveedor_simular_envio, no lo reintentes en ese turno").

### IN-27: [INFO] `FALLIDO` trata cualquier `ok: false` como "no se envió", incluido un fallo posterior a escribir `ENVIO-SIMULADO.md`

**Archivos:** `src/loop/services/despacho-llamada.service.ts:78`, `src/application/use-cases/simular-envio.use-case.ts:48-49`, `src/tools/factories/definir-herramienta.factory.ts:108-118`, `:165-176`, `src/loop/services/registro-herramientas.service.ts:62`

**Problema:** `simularBajoCandado` escribe el archivo y después devuelve éxito. Si luego falla algo, `execute` devuelve `ERROR_INTERNO` aunque el archivo ya quedó escrito: por ejemplo, si `entorno.casos.resolver` lanza dentro de `ejecutarConCaso`, si fallan `spec.presentar` o `resumir`, o si la respuesta no cumple `resultadoHerramientaSchema` (línea 62). En ese caso `FALLIDO` reabre el caso, el conocimiento le dice al modelo que "vuelve a quedar pendiente", y un "sí" posterior registra un segundo envío. La ventana es estrecha, pero D-63.7 la convirtió en una invitación explícita a repetir el envío. En un envío real sería un duplicado.

**Arreglo:** que la escritura de `ENVIO-SIMULADO.md` sea lo último que pueda fallar (resolver el caso y presentar antes de escribir), o que `despacharEnvio` emita `FALLIDO` solo si el archivo no existe después del fallo.

---

_Revisado: 2026-10-14T03:18:08Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
