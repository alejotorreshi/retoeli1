---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-14T01:40:31Z
depth: standard
review_kind: incremental-gap-closure
scope: "planes 02-15 a 02-18 (cierre de brechas de UAT), diff 41111d7..HEAD"
diff_base: 41111d7fd414fe4f5bed303391b6cf98b82f9d5b
files_reviewed: 18
files_reviewed_list:
  - .qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-T04-clasificador-confirmacion.ts
  - agent/prompt.md
  - src/config/constants/confirmation.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/config/strings.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/policies/confirmacion.policy.ts
  - src/domain/types/compuerta.type.ts
  - src/knowledge/registro-proveedor.md
  - src/loop/services/ejecutar-turno.service.ts
  - src/loop/services/guardado-turno.service.ts
  - src/loop/types/turno.type.ts
  - tests/contract/env-agente.test.ts
  - tests/contract/instrucciones-agente.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/confirmacion.policy.test.ts
findings:
  critical: 1
  warning: 2
  info: 5
  total: 8
status: issues_found
---

# Fase 02: informe de code review (cierre de brechas 02-15 a 02-18)

**Revisado:** 2026-10-14T01:40:31Z
**Profundidad:** standard
**Archivos revisados:** 18
**Estado:** issues_found

## Resumen

Esta ronda revisa los cuatro planes de cierre de brechas de UAT: el estado "enviado" de la compuerta (02-15, D-63.4), el clasificador endurecido (02-16, D-63.5), los mensajes de configuración al arrancar (02-17) y la alineación del prompt y del conocimiento con la pregunta de cierre que pone el servidor (02-18).

La lógica nueva de la compuerta es correcta en lo que cubre. `plegarEventos` respeta el orden de los eventos, un `ARMADO` borra la marca de enviado, un `BLOQUEADO` de un caso enviado no lo reabre y un turno abortado igual registra sus envíos. El clasificador hace lo que dice D-63.5.

El defecto principal está en el contrato entre el prompt y el servidor. 02-18 le ordena al modelo que, ante un "ok" o una respuesta dudosa, pida él mismo la confirmación explícita. Pero el servidor ya liberó la compuerta en ese turno y no repite la pregunta. Por eso el "sí" o el "envía" que la analista escribe a continuación queda bloqueado con `CONFIRMACION_REQUERIDA`. Lo reproduje de punta a punta con el LLM falso. Las pruebas y la semilla T04 no lo detectan, porque su guion siempre hace que el modelo llame a `simular_envio` tras el "ok", que es justo lo que el prompt le prohíbe.

También encontré estos problemas:

- El arreglo de puntuación de 02-17 queda incompleto cuando hay más de un issue de configuración.
- Un envío autorizado que falla saca el caso de la compuerta, aunque el conocimiento nuevo promete que "el servidor vuelve a pedir la confirmación".

Para verificar ejecuté pruebas temporales (sondas) que borré al terminar, así que no queda ningún archivo fuente modificado.

## Hallazgos narrativos (revisor IA)

## Problemas críticos

### CR-01: [BLOCKER] el prompt manda al modelo a pedir la confirmación, pero el servidor ya liberó la compuerta y bloquea la confirmación siguiente

**Archivos:** `agent/prompt.md:50`, `agent/prompt.md:53`, `src/domain/policies/compuerta.policy.ts:42-44`, `src/domain/policies/compuerta.policy.ts:59`, `src/loop/services/ejecutar-turno.service.ts:47-50`

**Problema:** cuando hay un caso pendiente y el mensaje se clasifica como `otro`, `abrirTurno` devuelve `sinAutorizacion()` con `siguiente: estadoLibre()`. Así pasa con "ok", "listo", "si todo bien", "si por favor" o "si si", que tras D-63.5 dan `otro`. Además `arrastradosDe` devuelve `[]` porque `preguntarCual` es `false`. Si el modelo no llama ninguna herramienta, `cerrarTurno` termina en LIBRE, `needsConfirmation` queda en `false` y el servidor no agrega la pregunta.

Sin embargo, 02-18 escribió en `agent/prompt.md:50` "Un "ok" o un "listo" sueltos ... no llames a proveedor_simular_envio y pide una confirmación explícita, como "envía" o "sí"", y la línea 53 dice "vuelve a preguntar en lugar de enviar". El modelo obedece y pregunta en prosa. La analista responde "sí", pero como la compuerta está LIBRE, `abrirTurno` no autoriza nada. El modelo llama a `simular_envio`, recibe `CONFIRMACION_REQUERIDA`, el `BLOQUEADO` reabre el caso y recién entonces el servidor pregunta otra vez. La analista confirmó de forma explícita, como le pidió el agente, y el envío se rechazó. Tiene que confirmar una segunda vez.

Este es justo el camino que va a recorrer el re-test de UAT H2.

Reproducción con el LLM falso (sonda temporal):

```
T1 "Procesa ... No envíes nada todavía."  -> needsConfirmation: true
T2 "ok" (el modelo responde "Responde envía o sí.", sin herramientas) -> needsConfirmation: false
T3 "sí" -> simular_envio ok:false CONFIRMACION_REQUERIDA, needsConfirmation: true, sin ENVIO-SIMULADO.md
```

Las pruebas no lo detectan. `tests/loop/compuerta.test.ts:201-216` (CR-01 con "ok", "listo", "si todo bien") y la semilla `02-T04-clasificador-confirmacion.ts:26-30` y `:52` guionan un modelo que llama a `simular_envio` tras la frase dudosa. Ese `BLOQUEADO` reabre el caso, y el escenario que el prompt pide nunca se ejecuta.

Además se contradice con `agent/prompt.md:33` y con el conocimiento (`registro-proveedor.md:55`, `:63`), que dicen "No escribas tú la pregunta de cierre".

**Arreglo:** que una respuesta `otro` mantenga el caso pendiente y que el servidor repita la pregunta en ese mismo turno. Así RN4 se sigue cumpliendo, porque la pregunta del servidor queda inmediatamente antes del mensaje siguiente. `rechaza` sí libera la compuerta.

```ts
function mantenerPendiente(estado: EstadoCompuerta): AperturaTurno {
  return { autorizado: null, siguiente: estado, preguntarCual: false };
}

export function abrirTurno(estado: EstadoCompuerta, decision: DecisionConfirmacion): AperturaTurno {
  if (estado.tipo === ESTADO_COMPUERTA.LIBRE) return sinAutorizacion();
  if (decision.decision === DECISION_CONFIRMACION.FALTA_CASO) return preguntarCual(estado);
  if (decision.decision === DECISION_CONFIRMACION.CONFIRMA && casosPendientes(estado).includes(decision.caso)) {
    return { autorizado: decision.caso, siguiente: estadoLibre(), preguntarCual: false };
  }
  if (decision.decision === DECISION_CONFIRMACION.OTRO) return mantenerPendiente(estado);
  return sinAutorizacion();
}
```

Con este cambio, `arrastradosDe` (`ejecutar-turno.service.ts:47-50`) debe arrastrar los casos siempre que `siguiente` esté PENDIENTE, no solo cuando `preguntarCual` es `true`. Además hay que cambiar `agent/prompt.md:50` y `:53` a "no llames a proveedor_simular_envio ni escribas tú la pregunta: el servidor vuelve a pedir la confirmación".

Si en cambio se quiere conservar que un `otro` cancele la confirmación pendiente, el prompt no puede decirle al modelo que pida la confirmación. Tiene que decirle que explique que la confirmación quedó cancelada y que hay que volver a armar el paquete.

En cualquiera de las dos opciones, agrega una prueba de bucle con el guion que exige el prompt: "ok" sin herramientas y luego "sí".

## Advertencias

### WR-01: [WARNING] G-02-19 está incompleto: con dos o más issues, el mensaje de arranque sigue teniendo puntuación doble (".;")

**Archivos:** `src/config/strings.ts:331-338`, `src/domain/utils/formatear-issues.util.ts:4-12`, `tests/contract/env-agente.test.ts:378-394`

**Problema:** `cerrarOracion` solo revisa el final del texto completo. Cada mensaje de `TEXTO_ENV` (`urlNoSegura`, `urlRequerida`, `modeloRequerido`) ya termina en punto, y `formatearIssues` los une con `"; "`. Lo verifiqué con dos sondas:

- `LLM_PROVIDER=otro-proveedor` sin URL ni modelo (el caso más común de proveedor propio) da `"...no tiene valores por defecto.; LLM_MODEL: Falta el modelo: ..."`.
- Las dos URLs con `http://` dan `"...[::1].; LLM_FALLBACK_BASE_URL: ..."`.

La prueba `not.toContain("..")` no cubre este caso, porque solo prueba un issue.

**Arreglo:** quita el punto final de cada mensaje antes de unirlos. La regla del proyecto pone las regex en `patterns.constants.ts`, así que conviene hacerlo con `endsWith`:

```ts
const sinPunto = (texto: string) => (texto.endsWith(".") ? texto.slice(0, -1) : texto);
return `${ruta}: ${sinPunto(issue.message)}`;
```

Agrega a `env-agente.test.ts` una prueba con dos issues que fije el literal completo.

### WR-02: [WARNING] un envío autorizado que falla saca el caso de la compuerta, aunque el conocimiento dice que el servidor vuelve a preguntar

**Archivos:** `src/domain/policies/compuerta.policy.ts:62-65`, `src/domain/policies/compuerta.policy.ts:125-135`, `src/loop/services/despacho-llamada.service.ts:67-81`, `src/knowledge/registro-proveedor.md:53-54`

**Problema:** `evaluarEnvio` marca `usada: true` antes de ejecutar la herramienta. Si `simular_envio` falla después de la confirmación, por ejemplo con `PAQUETE_DESACTUALIZADO`, `PAQUETE_NO_ARMADO` (disco efímero de Render) o `ERROR_INTERNO`, pasa esto:

- `despacharEnvio` no emite ningún evento (`evento: resultado.ok ? ENVIADO : null`).
- `recuperarAutorizado` devuelve `[]` porque `usada` es `true`.
- `arrastrados` está vacío porque la apertura autorizó y dejó `estadoLibre()`.

Si el modelo no vuelve a armar el paquete en ese mismo turno, el caso desaparece de la compuerta aunque su paquete siga en `paquetesConocidos` y nunca se haya enviado. Eso pasa si llega al tope de iteraciones, si el turno termina en error o si `armar_paquete` falla. Contradice D-63.2 ("La pregunta y el estado pendiente también se aplican si el turno termina en error o en un tope, siempre que el paquete esté armado"). También contradice el texto que 02-18 agregó en `registro-proveedor.md:53-54`: "el servidor vuelve a pedir la confirmación".

La lógica es anterior a esta ronda, pero esta ronda la documenta como garantía.

**Arreglo:** que un envío autorizado que falla deje al caso igual que un bloqueo, para que `cerrarTurno` lo reabra desde los paquetes conocidos (salvo que esté en `enviados`):

```ts
evento: resultado.ok
  ? { tipo: EVENTO_COMPUERTA.ENVIADO, caso }
  : { tipo: EVENTO_COMPUERTA.BLOQUEADO, caso },
```

Otra opción es un evento `FALLIDO` propio que `aplicarEvento` trate como `BLOQUEADO`. Agrega una prueba de bucle: confirmar, borrar el checklist, enviar (falla `PAQUETE_NO_ARMADO`), terminar el turno y comprobar que `needsConfirmation` vale `true`.

## Info

### IN-01: [INFO] clasificador: agregar el caso a "si" lo degrada, y confirmaciones naturales sin tilde dan `otro`

**Archivo:** `src/domain/policies/confirmacion.policy.ts:53-55`

**Problema:** con un solo caso pendiente, "si" confirma, pero "si ec-corp-andina" da `otro`, porque `esSiSuelto` exige `slugs.length === 0`. Un mensaje más específico vale menos que uno genérico. "si por favor", "si si" y "si gracias" también dan `otro` (sondeado). Esto sigue la letra de D-63.5, pero junto con CR-01 cada uno de esos mensajes cancela la confirmación pendiente sin que el servidor vuelva a preguntar. Hay además falsos rechazos anteriores a esta ronda: "dale no más" y "envíalo para firma" dan `rechaza` por "no" y "para" en `NEGACIONES`. Todos fallan de forma segura (no envían).

**Arreglo:** acepta "si" + un único slug pendiente como confirmación de ese caso, o deja registrada en D-63.5 la razón de rechazarlo. Si CR-01 se resuelve manteniendo el caso pendiente ante `otro`, el costo de estos falsos negativos baja a una repregunta.

### IN-02: [INFO] el pliegue de eventos se calcula dos veces y `cerrarTurno` descarta su resultado

**Archivos:** `src/domain/policies/compuerta.policy.ts:111-123`, `src/loop/services/guardado-turno.service.ts:29`, `src/loop/services/guardado-turno.service.ts:48`

**Problema:** `cerrarTurno` llama a `plegarEventos` y descarta el conjunto `enviados` que devuelve. Después `guardarSesion` vuelve a plegar los mismos eventos con `enviadosTrasEventos(..., {})`. Hoy los dos pliegues coinciden, pero son dos fuentes de verdad que deben mantenerse sincronizadas. La diferencia con el aborto (que registra los envíos pero no los pendientes) queda implícita en el orden de las llamadas.

**Arreglo:** que `cerrarTurno` devuelva `{ estado, enviados }` (con el aborto haciendo el pliegue de enviados de todos modos) y que `CierreTurnoCompuerta` lo lleve hasta `guardarSesion`.

### IN-03: [INFO] el prompt fija a mano el nombre `ENVIO-SIMULADO.md` y los ejemplos de confirmación, sin una prueba que los ate a sus constantes

**Archivos:** `agent/prompt.md:49-50`, `agent/prompt.md:54`, `tests/contract/instrucciones-agente.test.ts:110-130`

**Problema:** la línea 54 escribe `out/<caso>/ENVIO-SIMULADO.md`, y las líneas 49-50 citan "envía" y "sí". Esos valores salen de `ARCHIVOS_SALIDA.ENVIO_SIMULADO` y `EJEMPLOS_CONFIRMACION`, pero el contrato del prompt no los comprueba. Si alguien renombra el archivo o cambia los ejemplos del servidor, el prompt queda desalineado sin que falle ninguna prueba. Además el prompt prohíbe afirmar rutas que no vengan de una herramienta (línea 13) y aquí le da una ruta fija.

**Arreglo:** en `instrucciones-agente.test.ts`, comprueba que el prompt contiene `ARCHIVOS_SALIDA.ENVIO_SIMULADO` y cada `EJEMPLOS_CONFIRMACION`, o cambia la línea 54 a "la ruta que devolvió proveedor_simular_envio".

### IN-04: [INFO] la semilla T04 compara con literales, importa un archivo que no existe en su carpeta y descarta un campo que calcula

**Archivo:** `.qa/evidence/02-agente-y-compuerta-de-confirmaci-n/seeds/02-T04-clasificador-confirmacion.ts:5`, `:14-20`, `:38`, `:46-56`

**Problema:**

- Compara con `"otro"`, `"rechaza"`, `"confirma"` y `"CONFIRMACION_REQUERIDA"` en vez de `DECISION_CONFIRMACION.*` y `CODIGO_ERROR.*`, cuando la regla del proyecto exige comparar siempre contra el objeto `as const`.
- Importa `./qa-comun.ts`, un archivo que solo existe después de que `02-B-run.sh` copie `02-B-common-qa-comun.ts` con otro nombre, así que la semilla no se puede ejecutar ni tipar donde está.
- Calcula `preguntaServidor` (línea 38) y lo descarta en las dos salidas.
- Sus casos de punta a punta guionan un `simular_envio` tras la frase dudosa, así que no reproducen el comportamiento que exige el prompt (ver CR-01).

**Arreglo:** usa las constantes, quita `preguntaServidor` o compruébalo, y agrega un caso de punta a punta con "ok" sin herramientas seguido de "sí".

### IN-05: [INFO] `FINES_DE_ORACION` vive en `confirmation.constants.ts` pero lo usa el constructor de cierres de texto

**Archivos:** `src/config/constants/confirmation.constants.ts:9`, `src/domain/builders/cierre-turno.builder.ts:1`

**Problema:** es una constante de texto (cortes de oración) que no tiene que ver con clasificar confirmaciones. Ya existe `text.constants.ts` con `SEPARADOR_PARRAFOS` y `SALTO_DE_LINEA`. Además `strings.ts:30` declara aparte un `FIN_DE_ORACION = "."` privado. Son dos fuentes para el mismo concepto.

**Arreglo:** mueve `FINES_DE_ORACION` a `text.constants.ts` y deriva de ahí el punto que usa `cerrarOracion`.

---

_Revisado: 2026-10-14T01:40:31Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
