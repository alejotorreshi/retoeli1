---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-14T16:42:10Z
depth: standard
review_kind: incremental-gap-closure
scope: "plan 02-23 (G-02-2, D-63.9), commits 6eddc88..a92ecf2, diff cec32ac..HEAD"
diff_base: cec32acff24290fb8ef4d4cdb1f5f13799d50233
previous_report: cec32ac
files_reviewed: 10
files_reviewed_list:
  - agent/prompt.md
  - src/config/constants/confirmation.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/domain/policies/confirmacion.policy.ts
  - src/knowledge/registro-proveedor.md
  - tests/contract/instrucciones-agente.test.ts
  - tests/helpers/corpus-confirmacion.helper.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/unit/confirmacion.policy.test.ts
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Fase 02: informe de code review (cierre de brecha 02-23, G-02-2 / D-63.9)

**Revisado:** 2026-10-14T16:42:10Z
**Profundidad:** standard
**Archivos revisados:** 10
**Estado:** issues_found

El informe anterior (ronda 02-22, hallazgos CR-04, WR-19 a WR-22 e IN-28 a IN-30) está en la commit `cec32ac`.

## Resumen

El plan 02-23 cambia el rechazo de D-63.8 por la gramática D-63.9. El rechazo se busca solo en las cláusulas afirmadas, y una cabeza de pregunta sin "¿" se separa en su primer interrogativo. Hay cuatro formas de rechazo:

- (a) negación del envío. Un subjuntivo de envío acepta cualquier complemento. Un verbo genérico o un modal solo cuentan con un complemento de `NEGACIONES`, `RELLENO` o casos. Un pretérito con "é" nunca cuenta.
- (b) "cancela…" con complemento restringido.
- (c) una cláusula de espera sin caso, que no cuenta si otra cláusula afirmada nombra un caso.
- la espera como mensaje completo.

El plan también agrega un corpus generado (2107 mensajes que nunca cancelan y 1046 que siempre cancelan), un diferencial contra `10a43ad`, pruebas de tiempo y oraciones del prompt y de RN4 fijadas enteras.

Verifiqué lo siguiente:

- **La autorización sigue siendo segura.** `esConfirmacionClara` y `casoConfirmado` no cambiaron, y `esRechazoExplicito` solo puede devolver `RECHAZA` antes que ellos. Toda palabra de `NEGACIONES` sigue fuera de `esPermitida`, así que ningún mensaje que deja de ser rechazo puede pasar a `confirma`: lo probé con mezclas "no, envía", "espera, envía", "no hay problema, envía" y "no, envía ec-corp-andina", y ninguna confirma.
- **Lo que el informe anterior pedía está cerrado.** Las 13 frases de CR-04, las de WR-19, WR-20 y WR-21 y "el cliente respondió: no." dan lo que se esperaba (ver "Rondas anteriores").
- **Reglas del proyecto.** No hay comentarios, las regex nuevas están en `patterns.constants.ts`, los conjuntos son de una palabra, se usan los alias `@/` y no hay `any`.
- **Ejecución.** Las 4 suites del alcance pasan (420 pruebas, 0 fallos), al igual que `architecture` y `sin-comentarios` (70 pruebas) y `tsc --noEmit` y `biome check`. Comparé el clasificador real de HEAD con el de `cec32ac`, este último en un worktree temporal en el scratchpad que ya eliminé. No modifiqué ningún archivo fuente.

El problema principal es una **regresión en sentido inverso** que el diferencial no puede ver: el diferencial comprueba tres direcciones, pero no "antes `rechaza`, ahora `otro`". Hay tres mecanismos nuevos:

- la restricción del complemento de los verbos genéricos;
- la exención por nombrar un caso;
- "detén" sin camino de verbo.

Con ellos, rechazos explícitos que daban `rechaza` en `cec32ac` y en `10a43ad` ahora dan `otro`: "no confirmo el envío simulado" (la redacción literal de la pregunta del servidor), "no confirmo porque falta el certificado", "ec-corp-andina no" y "detén el envío". El servidor vuelve a preguntar "¿Confirmas el envío simulado…?" justo después de que la analista dijo que no. Es la primera mitad de G-02-2, que el plan declara cerrada (CR-05).

Además, quedan rechazos coloquiales que nunca se cubrieron (WR-23). Un subjuntivo de envío con cualquier objeto cancela pedidos sobre el chat o el borrador (WR-24). Y la función completa sigue siendo cuadrática por `separar`: 100 KB tardan 13,8 s en cada turno, aunque la prueba nueva se llama "tiempo lineal" (WR-25).

## Rondas anteriores

| ID | Severidad | Estado actual | Evidencia |
|----|-----------|---------------|-----------|
| CR-04 | critical | **resuelto** (02-23) | Las 13 frases de la tabla dan `otro` con uno y con dos pendientes ("Para pe-andes, ¿qué falta?", "Luego, ¿qué sigue?", "Dame primero el NIT, después el paquete", "procesa co-industrias-delta, no pe-andes"…), y también las variantes sin coma y con punto ("Luego ¿qué sigue?", "Luego. ¿Qué sigue?", "Mejor. Dame el NIT", "nada. procesa pe-andes"). Las fijan `FILAS_D639`, `nuncaCancelanDentro` y `nuncaCancelanCabeza`, y la prueba de bucle `compuerta.test.ts:297-304` |
| WR-19 | warning | **parcial** | Las 8 frases dan `rechaza` ("espera un momento", "un momento", "no quiero enviarlo todavía", "ni se te ocurra enviarlo", "no lo confirmes", "no confirmes", "no autorices", "todavía no qué falta?"). La clase sigue abierta: "espérate", "cancélalo", "hoy no" y "no quiero enviarlo sin el certificado" dan `otro` (WR-23), y aparecen regresiones nuevas (CR-05) |
| WR-20 | warning | **resuelto** | Las 5 frases dan `otro`. `esPreterito` (`confirmacion.policy.ts:121-123`) lee el token NFC con tilde. Sin tilde ("todavía no lo envie"), la frase sigue dando `rechaza`, que el plan declara como el lado seguro |
| WR-21 | warning | **resuelto, con regresión** | Las 5 frases dan `otro` gracias a `VERBOS_GENERICOS_NEGABLES` y `colasDeComplemento`. La restricción del complemento es demasiado estrecha y convierte en `otro` "no confirmo el envío simulado" y "no confirmo porque falta el certificado" (CR-05). El mismo mecanismo sigue abierto para los subjuntivos de envío (WR-24) |
| WR-22 | warning | **resuelto** | RN4 dice ahora "Un pedido distinto (por ejemplo …) no es un rechazo aunque traiga palabras como …" (`registro-proveedor.md:42`). `ORACIONES_D639` fija la oración entera, y `RETIRADOS_G023` fija como ausente la oración invertida |
| IN-28 | info | **resuelto** (T-02-71) | `verboTrasNegador` ya no existe y `colasDeComplemento` se calcula una vez por cláusula. "no lo " repetido 100000 veces tarda 3 ms. La función completa sigue siendo cuadrática por otro camino (WR-25, T-02-77) |
| IN-29 | info | **parcial** | Las oraciones están fijadas enteras, con todas sus citas clasificadas, y hay clases generadas y un diferencial. Pero `siempreCancelan` no incluye la redacción del servidor ("el envío simulado"), los motivos ("porque…", "hasta…") ni el caso pendiente, y el diferencial no comprueba la dirección `rechaza` → `otro` (CR-05) |
| IN-30 | info | (a) **parcial**, (b) abierto (documentado) | (a) "el cliente respondió: no." da `otro`, pero "el cliente respondió: no envíes nada" y 'el cliente dijo "no envíes"' dan `rechaza` (IN-32). Quitar ":" como frontera produjo la regresión "no confirmo: falta el certificado" (CR-05). (b) "no¿" da `rechaza` y "no ?" da `otro`, como está documentado en el SUMMARY |
| WR-15 | warning | **resuelto** en sus frases | Ver WR-19 |
| WR-16 | warning | **resuelto** | Ver CR-04 |
| WR-17 | warning | abierto | Fuera del alcance por decisión de la usuaria. El rechazo por texto sigue cancelando todos los casos pendientes |
| WR-18, WR-03 | warning | abiertos | Fuera del alcance de este diff |
| IN-01 | info | (a) abierto | Sin cambios en la gramática de confirmación |
| IN-23 a IN-27 | info | abiertos | Fuera del alcance de este diff. IN-26 se repite en IN-33 |
| Resto (ver `02-REVIEW-DISPOSITION.md`) | — | sin cambios | Fuera del alcance de este diff |

## Hallazgos narrativos (revisor IA)

Los IDs nuevos siguen la numeración del ledger: CR-05 en adelante, WR-23 en adelante e IN-31 en adelante.

## Problemas críticos

### CR-05: [BLOCKER] D-63.9 convierte en `otro` rechazos explícitos que antes cancelaban: "no confirmo el envío simulado", "no confirmo porque falta el certificado", "ec-corp-andina no" y "detén el envío". El servidor vuelve a pedir confirmación justo después del "no"

**Archivos:**
- `src/domain/policies/confirmacion.policy.ts`: líneas 125-136 (`esComplementoDeEnvio`, `colasDeComplemento`), 157-166 (`niegaDesde`), 177-183 (`esClausulaDeEspera`) y 195-201 (`esRechazoExplicito`)
- `src/config/constants/confirmation.constants.ts`: líneas 118-127 y 183
- `src/config/constants/patterns.constants.ts:23`
- `tests/unit/confirmacion.policy.test.ts:399-437`
- `tests/helpers/corpus-confirmacion.helper.ts:90`
- `agent/prompt.md:51`

**Problema:** comparé el clasificador de HEAD con el de `cec32ac`, con `ec-corp-andina` pendiente. Hay tres mecanismos nuevos que llevan a `otro` frases que antes daban `rechaza`. En `10a43ad` también daban `rechaza`, porque traen "no".

1. **El complemento de los verbos genéricos solo admite `RELLENO`, `NEGACIONES` o casos** (`colasDeComplemento`, líneas 129-136). La pregunta del servidor es "¿Confirmas el envío simulado de ec-corp-andina?" (`strings.ts:222`), pero "simulado" no está en `RELLENO`. Tampoco lo están los conectores de motivo ("porque", "hasta"). Y como ":" ya no corta la cláusula (`patterns.constants.ts:23`), el motivo que va después de ":" pasa a ser complemento.

   ```
   "no confirmo el envío simulado"                    cec32ac: rechaza  HEAD: otro
   "no confirmo el envío simulado de ec-corp-andina"  cec32ac: rechaza  HEAD: otro
   "no autorizo el envío simulado"                    cec32ac: rechaza  HEAD: otro
   "no confirmo porque falta el certificado"          cec32ac: rechaza  HEAD: otro
   "no confirmo hasta tener el certificado"           cec32ac: rechaza  HEAD: otro
   "no lo hagas hasta tener el certificado"           cec32ac: rechaza  HEAD: otro
   "no confirmo: falta el certificado"                cec32ac: rechaza  HEAD: otro
   ```

2. **Nombrar el caso pendiente anula el rechazo.** `esPalabraDeEspera` (línea 178) excluye cualquier token de caso, y `esRechazoExplicito` (línea 199) ignora una cláusula de espera si otra cláusula afirmada nombra un caso. La regla no distingue el caso pendiente de otro caso, y toma como caso cualquier palabra con guion ("e-mail"). Generé 10 respuestas de espera ("no", "todavía no", "aún no", "espera", "mejor no", "alto", "ahora no", "por ahora no", "no, gracias" y "cancela") con 9 plantillas que nombran **solo el caso pendiente**. Con "cancela" no hay regresiones, porque su forma admite casos. Las otras 9 respuestas dan 81 regresiones:

   ```
   "ec-corp-andina no"                                    cec32ac: rechaza  HEAD: otro
   "no, ec-corp-andina"                                   cec32ac: rechaza  HEAD: otro
   "todavía no, ec-corp-andina"                           cec32ac: rechaza  HEAD: otro
   "espera, ec-corp-andina"                               cec32ac: rechaza  HEAD: otro
   "Todavía no, falta el certificado de ec-corp-andina"   cec32ac: rechaza  HEAD: otro
   "mejor no el paquete de ec-corp-andina"                cec32ac: rechaza  HEAD: otro
   "no, el de ec-corp-andina tiene bloqueos"              cec32ac: rechaza  HEAD: otro
   ```

   Con dos casos pendientes, "co-industrias-delta todavía no" tampoco cancela, y el servidor responde "¿Cuál caso confirmas para el envío simulado?".

3. **"detén" es un núcleo de rechazo, pero no tiene camino con complemento.** "detén el envío" daba `rechaza` y ahora da `otro`: "el" y "envio" no están en `RELLENO_DE_ESPERA`, y "deten" no está en `CANCELACIONES`.

**Por qué no lo detectan las pruebas:**

- El diferencial (`confirmacion.policy.test.ts:399-437`) comprueba tres direcciones: gramática → nunca `rechaza`; atajo → nunca `confirma`; pregunta `otro` → `rechaza` solo si está declarada. Ninguna cubre "el atajo antiguo daba `rechaza` y ahora da `otro` sin estar declarado".
- `siempreCancelan` usa como colas de los verbos genéricos solo `""`, `" todavía"`, `" el envío"` y `", ¿qué falta?"` (`corpus-confirmacion.helper.ts:90`). No incluye la redacción del servidor, ni un motivo, ni el caso pendiente.

**Consecuencia:** el escenario §11 es exactamente este: `ec-corp-andina` queda BLOQUEADO porque falta el certificado. "no confirmo porque falta el certificado" o "no confirmo el envío simulado" son las respuestas naturales a la pregunta del servidor. `prompt.md:51` le dice al modelo que "no confirmo" es un rechazo, así que el modelo responde que la confirmación quedó cancelada. Después, `abrirTurno` mantiene el caso pendiente y el servidor agrega "¿Confirmas el envío simulado de ec-corp-andina?" con `needsConfirmation: true`.

En una misma respuesta se contradicen el modelo y el servidor, que es el síntoma visible de la primera mitad de G-02-2. El caso sigue autorizable con el "sí" siguiente después de que la analista lo rechazó explícitamente. El plan declara G-02-2 cerrado, y su propósito era "keep the model's instructions identical to what the server enforces". Las rondas anteriores clasificaron este síntoma como warning (WR-15, WR-19), pero aquí se trata de una **regresión** de frases que la versión entregada manejaba bien, en el caso de la demo, y el diferencial es ciego a ella por diseño. Por eso lo clasifico como BLOCKER.

**Arreglo:**

1. Que el complemento de envío admita la redacción del servidor y que un conector de motivo cierre la cola. Usa un conjunto propio, porque `RELLENO` es compartido con la gramática de confirmación y no puede cambiar.
2. Que una cláusula hecha solo de palabras de espera y de casos **pendientes** sea un rechazo.
3. Que "detén" tome el camino de cancelación.

```ts
// confirmation.constants.ts
export const COMPLEMENTOS_DE_ENVIO: ReadonlySet<string> = new Set(["simulado", "confirmacion"]);
export const CORTES_DE_COMPLEMENTO: ReadonlySet<string> = new Set(["porque", "hasta", "pues", "sin", "mientras"]);
export const CANCELACIONES: ReadonlySet<string> = new Set([
  "cancela", "cancelar", "cancelo", "cancelado", "deten", "detente",
]);

// confirmacion.policy.ts
function esComplementoDeEnvio(token: Token): boolean {
  return token.caso || NEGACIONES.has(token.base) || RELLENO.has(token.base) || COMPLEMENTOS_DE_ENVIO.has(token.base);
}

function colasDeComplemento(tokens: readonly Token[]): readonly boolean[] {
  const colas = new Array<boolean>(tokens.length + 1).fill(true);
  for (let indice = tokens.length - 1; indice >= 0; indice -= 1) {
    const token = tokens[indice];
    if (token === undefined) continue;
    colas[indice] = CORTES_DE_COMPLEMENTO.has(token.base) || (esComplementoDeEnvio(token) && colas[indice + 1] === true);
  }
  return colas;
}

function esPalabraDeEsperaPara(pendientes: readonly string[]) {
  return (token: Token): boolean =>
    token.caso ? pendientes.includes(token.crudo) : NEGACIONES.has(token.base) || RELLENO_DE_ESPERA.has(token.base);
}

function nombraOtroCaso(pendientes: readonly string[]) {
  return ({ tokens }: Clausula): boolean => tokens.some((token) => token.caso && !pendientes.includes(token.crudo));
}
```

`esRechazoExplicito` tiene que recibir `pendientes` y usar `nombraOtroCaso(pendientes)` en lugar de `nombraCaso`. "No, el de co-industrias-delta" con dos pendientes sigue dando `otro`, porque "el" y "de" no son palabras de espera.

Agrega una cuarta prueba al diferencial:

```ts
atajoPrevio(m) === DECISION_CONFIRMACION.RECHAZA && decision === DECISION_CONFIRMACION.OTRO && !declaradosOtro.has(m)
```

Aquí `declaradosOtro` es el conjunto de `nuncaCancelan()` y de las filas `OTRO`. Amplía también `siempreCancelan` con estas colas: `" el envío simulado"`, `" porque falta el certificado"`, `": falta el certificado"`, `" hasta tener el certificado"`, y el caso pendiente antes y después de cada respuesta de `ESPERAS`. Agrega todas las frases de la tabla como filas `RECHAZA` y como filas de bucle en el `test.each` de cancelación de `compuerta.test.ts`.

## Advertencias

### WR-23: [WARNING] la clase de WR-19 sigue abierta: "espérate", "cancélalo", "hoy no" y "no quiero enviarlo sin el certificado" dan `otro`, y el servidor vuelve a preguntar

**Archivos:**
- `src/config/constants/confirmation.constants.ts`: líneas 151-160 (`MODALES_NEGABLES`), 164-183 (`NUCLEOS_DE_RECHAZO`, `CANCELACIONES`) y 185-194 (`RELLENO_DE_ESPERA`)
- `src/domain/policies/confirmacion.policy.ts`: líneas 149-155 y 173-183

**Problema:** el plan cerró WR-19 con sus ocho frases, pero las formas cercanas siguen fuera. Ninguna era `rechaza` en `cec32ac`, así que no son regresiones:

```
"espérate" / "espérame"                       -> otro
"cancélalo" / "cancelalo"                     -> otro   ("cancela" -> rechaza)
"cancela la confirmación"                     -> otro
"cancela el envío simulado"                   -> otro
"hoy no"                                      -> otro   ("ahora no" -> rechaza)
"aguanta" / "un segundo" / "dame un minuto"   -> otro
"anula el envío" / "olvídalo"                 -> otro
"no quiero enviarlo sin el certificado"       -> otro   ("no lo envíes sin el certificado" -> rechaza)
"no quiero que lo envíes al cliente"          -> otro   ("no lo envíes al cliente" -> rechaza)
"no quiero confirmar el envío simulado"       -> otro
```

Hay dos asimetrías:

- El camino modal (`niegaTrasModal`, línea 154) exige el complemento restringido **también para los subjuntivos de envío**, que en el camino directo admiten cualquier complemento.
- "cancela…" no admite enclíticos ("cancélalo") ni la redacción del servidor ("simulado", "confirmación").

**Arreglo:**

- En `niegaTrasModal`, aplica la misma regla que en `niegaDesde`: un subjuntivo de `VERBOS_NEGABLES` rechaza con cualquier complemento.
- Agrega a `CANCELACIONES` y a `NUCLEOS_DE_RECHAZO` las formas "cancelalo", "cancelala", "cancelemos", "anula", "anulalo", "esperate", "esperame" y "aguanta".
- Agrega "hoy" a `RELLENO_DE_ESPERA` y `COMPLEMENTOS_DE_ENVIO` de CR-05 al camino de cancelación.
- Agrega cada frase como fila `RECHAZA`.

Si alguna se deja fuera a propósito, declárala en D-63.9.

### WR-24: [WARNING] un subjuntivo de envío con cualquier objeto cancela pedidos sobre el chat o el borrador: "no me envíes tantas preguntas" y "en el borrador no envíes la cuenta bancaria" dan `rechaza`

**Archivos:**
- `src/domain/policies/confirmacion.policy.ts:157-161`
- `src/config/constants/confirmation.constants.ts:106-116`
- `agent/prompt.md:51`, `:54`

**Problema:** `niegaDesde` acepta un subjuntivo de `VERBOS_NEGABLES` sin mirar el complemento, y D-63.9 lo declara así. Pero "enviar" y "mandar" también son lo que el agente hace en el chat y lo que contiene el borrador del correo (RN2):

```
"no me envíes tantas preguntas"                                     -> rechaza
"no me mandes el resumen otra vez"                                  -> rechaza
"No me envíes el resumen, dame solo los conteos"                    -> rechaza
"en el borrador no envíes la cuenta bancaria"                       -> rechaza
"asegúrate de que no se envíe el número de cuenta en el correo"     -> rechaza
"nunca mandes datos bancarios en el correo"                         -> rechaza
```

Todos son pedidos distintos. `prompt.md:54` dice que un pedido distinto "no es un rechazo aunque traiga palabras como "no"… dentro de la frase", así que el modelo atiende el pedido y no dice que la confirmación quedó cancelada. Pero el servidor ya canceló, y el "sí" siguiente da `CONFIRMACION_REQUERIDA`. Es el síntoma de doble confirmación de CR-01 y CR-04 por la misma puerta que WR-21, ahora con los verbos de envío. Ya existía en `cec32ac` y `10a43ad`, así que no es regresión.

**Arreglo:** que un subjuntivo de envío precedido por un pronombre de destinatario de primera persona ("me", "nos"), o seguido de un objeto que no es complemento de envío, use la cola restringida, igual que los verbos genéricos:

```ts
export const DESTINATARIOS_ANALISTA: ReadonlySet<string> = new Set(["me", "nos"]);

function niegaDesde(tokens: readonly Token[], negador: number, colas: readonly boolean[]): boolean {
  const indice = saltarPronombres(tokens, negador + 1);
  const verbo = tokens[indice];
  if (verbo === undefined) return false;
  const aLaAnalista = tokens.slice(negador + 1, indice).some((t) => DESTINATARIOS_ANALISTA.has(t.base));
  if (esVerboNegable(verbo, [VERBOS_NEGABLES])) return !aLaAnalista || colas[indice + 1] === true;
  // …
}
```

La copia con `slice` está acotada por los pronombres que hay entre el negador y el verbo, así que el tiempo sigue siendo lineal. Agrega las seis frases como filas `OTRO`, o declara en D-63.9 y en el prompt que "no envíes …" siempre cancela, con cualquier objeto.

### WR-25: [WARNING] `clasificarConfirmacion` sigue siendo cuadrática por `separar`: 100 KB de letras tardan 13,8 s en cada turno, aunque la prueba nueva se llama "tiempo lineal" (T-02-77)

**Archivos:**
- `src/domain/policies/confirmacion.policy.ts:46-53`, `:208`
- `src/config/constants/patterns.constants.ts:25`
- `tests/unit/confirmacion.policy.test.ts:465-482`

**Problema:** `PATRON_SLUG_EN_TEXTO` (`/[a-z0-9]+(?:-[a-z0-9]+)+/g`) no está anclado. Dentro de una corrida de letras o dígitos sin guion, cada posición consume la corrida entera y retrocede, y `separar` recorre el texto dos veces (`match` y `replace`). Lo medí con `clasificarConfirmacion("a".repeat(n), [])`:

```
10 000 -> 137 ms
20 000 -> 546 ms
40 000 -> 2 210 ms
60 000 -> 4 912 ms
100 000 -> 13 761 ms
```

Pasa lo mismo con "1".repeat(n), "aé".repeat(n/2) y "no " + "a".repeat(n). `decisionDe` (`ejecutar-turno.service.ts:55`) llama al clasificador en **todos** los turnos, aunque no haya casos pendientes. Bun ejecuta en un solo hilo y el link es público, y no habrá límite de tamaño de mensaje hasta API-04 (Fase 3).

Es un problema anterior a este diff (T-02-77, de 02-03). Pero 02-23 declara "the check runs in linear time" y titula la prueba `clasificarConfirmacion: tiempo lineal`, y esa prueba solo ejercita el camino del rechazo ("no ", "no lo ", "No, "), que no llega a `separar`. La garantía que da la prueba es falsa para la función que nombra.

`PATRON_PALABRA_O_CASO` (`segmentar`) no tiene el problema, porque su segunda alternativa consume la corrida completa: "a".repeat(40000) + "?" tarda 0 ms.

**Arreglo:** ancla el inicio del slug con un lookbehind. Lo verifiqué: las coincidencias son las mismas y 100 000 caracteres tardan 0,2 ms, frente a 6 885 ms por pasada.

```ts
export const PATRON_SLUG_EN_TEXTO: RegExp = /(?<![a-z0-9])[a-z0-9]+(?:-[a-z0-9]+)+/g;
```

`PATRON_SLUG_COMPLETO` y `PATRON_PALABRA_O_CASO` derivan de `.source` y siguen siendo correctos. Agrega a la prueba de tiempo `"a".repeat(200_000)` y `"1".repeat(200_000)` sin pendientes, que pasan por la gramática de confirmación.

## Info

### IN-31: [INFO] una pregunta que nombra un caso cancela, pero un pedido que nombra el mismo caso no: "No, ¿qué falta en pe-andes?" da `rechaza` y "No, dime qué falta en pe-andes" da `otro`

**Archivos:** `src/domain/policies/confirmacion.policy.ts:104-114`, `:195-201`, `agent/prompt.md:51`

**Problema:**

- `nombraCaso` solo se evalúa en las cláusulas afirmadas, así que un caso nombrado dentro de una pregunta no exime. Con dos casos pendientes, "No, ¿qué falta en co-industrias-delta?" cancela los dos.
- `prompt.md:51` dice "aunque después venga una pregunta o un pedido que no nombra un caso". Es ambiguo si "que no nombra un caso" se aplica también a la pregunta.
- La separación de la cabeza de una pregunta toma la conjunción "que" como interrogativo: "espera que reviso el NIT?" da `rechaza`, mientras que la misma frase sin "?" da `otro` (fila declarada).

**Arreglo:** decide en D-63.9 si una pregunta que nombra un caso exime, aplica la misma regla a las preguntas y a los pedidos, y redacta el prompt sin ambigüedad. Para la cabeza, no separes en "que" cuando la palabra anterior es un verbo de espera, o fija el comportamiento con una fila.

### IN-32: [INFO] el discurso citado sigue cancelando cuando trae un subjuntivo de envío: "el cliente respondió: no envíes nada" da `rechaza` (resto de IN-30(a))

**Archivos:** `src/config/constants/patterns.constants.ts:23`, `src/domain/policies/confirmacion.policy.ts:157-171`

**Problema:** al quitar ":" se resolvió "el cliente respondió: no.", pero la forma (a) busca el negador en cualquier posición de la cláusula: "el cliente respondió: no envíes nada", 'el cliente dijo "no envíes"' y "mi jefe dice que no lo envíe" dan `rechaza`. Puede ser razonable tomar como rechazo una negación transmitida, pero no está declarado. Además, la misma eliminación de ":" produjo la regresión "no confirmo: falta el certificado" (CR-05).

**Arreglo:** declara en D-63.9 si una negación citada o transmitida cancela, y fija las dos direcciones con filas.

### IN-33: [INFO] el describe de D-63.8 del contrato quedó duplicado por el de D-63.9 y sigue fijando fragmentos cortos (IN-26)

**Archivo:** `tests/contract/instrucciones-agente.test.ts:164-236`

**Problema:**

- `RECHAZOS_DEL_PROMPT`, `PEDIDOS_DEL_PROMPT`, `RECHAZOS_DEL_CONOCIMIENTO` y `citado()` repiten lo que ahora comprueban `ORACIONES_D639`, con su contabilidad completa de citas, y las pruebas por clasificador.
- La prueba "el prompt y el conocimiento definen el rechazo como el servidor" sigue fijando "no es un rechazo" y "aunque después venga una pregunta". Son los fragmentos cortos que no detectaron la inversión de WR-22.
- Las pruebas de tiempo usan umbrales de reloj de 1 s (`confirmacion.policy.test.ts:465-482`), que pueden fallar en una máquina de CI lenta.

**Arreglo:**

- Retira el describe de D-63.8, o redúcelo a `RETIRADOS_G022`.
- Elimina las aserciones de fragmentos que ya cubren las oraciones enteras.
- Para el tiempo, compara la razón entre n y 2n (por ejemplo, menos de 3×) en lugar de un umbral absoluto.

---

_Revisado: 2026-10-14T16:42:10Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
