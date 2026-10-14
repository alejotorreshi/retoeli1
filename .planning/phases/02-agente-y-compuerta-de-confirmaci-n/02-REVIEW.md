---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-14T05:06:39Z
depth: standard
review_kind: incremental-gap-closure
scope: "plan 02-22 (G-02-2, D-63.8), diff 10a43ad..HEAD"
diff_base: 10a43addb3f540c5b14bdb8e38d247f2ae669bc9
previous_report: 1a94a86
files_reviewed: 8
files_reviewed_list:
  - agent/prompt.md
  - src/config/constants/confirmation.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/domain/policies/confirmacion.policy.ts
  - src/knowledge/registro-proveedor.md
  - tests/contract/instrucciones-agente.test.ts
  - tests/loop/compuerta.test.ts
  - tests/unit/confirmacion.policy.test.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Fase 02: informe de code review (cierre de brecha 02-22, G-02-2 / D-63.8)

**Revisado:** 2026-10-14T05:06:39Z
**Profundidad:** standard
**Archivos revisados:** 8
**Estado:** issues_found

El informe anterior (ronda 02-19 a 02-21, hallazgos WR-15 a WR-18 e IN-23 a IN-27) está en la commit `1a94a86`.

## Resumen

El plan 02-22 reemplaza la regla "cualquier palabra de `NEGACIONES` en el mensaje es un rechazo" por un rechazo acotado (D-63.8), que se evalúa antes de la comprobación de pregunta:

- (a) un negador (`NEGADORES`), seguido como mucho de pronombres átonos, que rige una forma de `VERBOS_NEGABLES`, en cualquier parte del mensaje;
- (b) una cláusula (`PATRON_CLAUSULA`) que no es pregunta y que está hecha solo de palabras de `NEGACIONES` y `RELLENO`, con al menos una de `NEGACIONES`.

Además, alinea el prompt y RN4 con esa regla y la fija con pruebas de contrato que ejecutan el clasificador sobre los ejemplos citados.

Verifiqué lo siguiente:

- **Ningún camino nuevo lleva a `confirma`.** Las dos reglas nuevas solo devuelven `RECHAZA` antes del resto. La comprobación de pregunta y `esConfirmacionClara` no cambiaron. Ninguna palabra de `NEGACIONES` o `NEGADORES` está en la gramática de confirmación (lo fija la prueba de invariante). Probé guiones con slugs, guiones bajos, espacios de ancho cero y signos sueltos, y ninguno confirma. La autorización sigue siendo segura.
- **Los regex con bandera `g`** (`PATRON_CLAUSULA`, `PATRON_SLUG_EN_TEXTO`) solo se usan con `String.prototype.match` y `replace`, que reinician `lastIndex`. No queda estado entre llamadas.
- **Las reglas del proyecto se cumplen en el diff:** sin comentarios, regex solo en `patterns.constants.ts`, conjuntos de una sola palabra, alias `@/` y sin `any`.
- **Ejecución:** corrí las 5 suites del alcance más los guardianes (337 pruebas, 0 fallos) y `bun run check` (tsc, Biome y audit), todo en verde. Probé el clasificador real con `bun -e`, sin crear archivos. Ningún archivo fuente quedó modificado.

Las frases reportadas en G-02-2 ya se clasifican bien, pero la regla (b) reproduce el mismo defecto con variantes muy cercanas:

- Una cabeza de pregunta separada por coma ("Luego, ¿qué sigue?").
- Un "para <caso>" o "no <caso>", porque el slug se quita antes de evaluar la cláusula.
- Un "…, después el paquete", porque `RELLENO` admite artículos y sustantivos.

Todas dan `rechaza`, cancelan todos los casos pendientes y contradicen la línea 53 del prompt, que le dice al modelo que el caso sigue pendiente. El "sí" siguiente queda bloqueado con `CONFIRMACION_REQUERIDA`, que es el síntoma de doble confirmación de CR-01, y además viola la prohibición explícita del plan (CR-04).

En sentido inverso, varios rechazos claros dan `otro`, y el servidor vuelve a preguntar justo después de un "no quiero enviarlo todavía" (WR-19). La forma (a) se dispara también con pretéritos que pierden la tilde ("No envié el certificado…", WR-20) y con verbos genéricos que rigen otro objeto ("No hagas el PDF", WR-21). RN4 quedó redactada de forma que dice lo contrario de la regla (WR-22).

## Rondas anteriores

| ID | Severidad | Estado actual | Evidencia |
|----|-----------|---------------|-----------|
| WR-15 | warning | **parcial** (02-22) | "No envíes nada todavía, ¿qué falta?" y sus variantes con verbo de envío ya dan `rechaza` (`confirmacion.policy.ts:90-96,118`). Siguen dando `otro` los rechazos sin verbo de `VERBOS_NEGABLES` o sin coma, por ejemplo "no quiero enviarlo todavía", "espera un momento" y "todavía no qué falta?" (ver WR-19) |
| WR-16 | warning | **parcial** (02-22) | Las cinco frases del informe anterior ya dan `otro`, pero la misma clase vuelve por la regla (b), por ejemplo "Para pe-andes, ¿qué falta?" y "Luego, ¿qué sigue?" (ver CR-04) |
| WR-17 | warning | abierto | Fuera del alcance por decisión de la usuaria (plan 02-22). `abrirTurno` (`compuerta.policy.ts:47-48`) sigue cerrando en LIBRE ante cualquier `RECHAZA`, lo que además amplifica CR-04 cuando hay varios casos pendientes |
| WR-18 | warning | abierto | Fuera del alcance de este diff |
| IN-01 | info | (b) **resuelto**, (a) abierto | "envía el paquete de ec-corp-andina para firma" da `otro` (fila nueva en `confirmacion.policy.test.ts`). (a) "si por favor" sigue dando `otro` |
| IN-23 | info | abierto | Sin cambios: un `simular_envio` desobediente después de un rechazo vuelve a abrir el caso |
| IN-24, IN-25, IN-27 | info | abiertos | Fuera del alcance de este diff |
| IN-26 | info | abierto, se repite | Los contratos nuevos vuelven a fijar fragmentos cortos ("no es un rechazo"). Ver IN-29 |
| WR-03 | warning | abierto, agravado por D-63.6 | Sin cambios en este diff |
| Resto (ver `02-REVIEW-DISPOSITION.md`) | — | sin cambios | Fuera del alcance de este diff |

## Hallazgos narrativos (revisor IA)

Los IDs nuevos siguen la numeración del ledger: CR-04 en adelante, WR-19 en adelante e IN-28 en adelante.

## Problemas críticos

### CR-04: [BLOCKER] la regla (b) de D-63.8 sigue cancelando el caso pendiente ante preguntas y pedidos comunes: "Para pe-andes, ¿qué falta?", "Luego, ¿qué sigue?" y "dame primero el NIT, después el paquete" dan `rechaza`

**Archivos:** `src/domain/policies/confirmacion.policy.ts:98-112`, `src/config/constants/confirmation.constants.ts:38-61` (`RELLENO`), `:63-89` (`NEGACIONES`), `src/config/constants/patterns.constants.ts:23`, `agent/prompt.md:53`, `src/knowledge/registro-proveedor.md:42`

**Problema:** `esClausulaDeEspera` acepta cualquier cláusula sin "?" cuyas palabras estén todas en `NEGACIONES` o `RELLENO`. Hay cuatro causas que se combinan:

1. **La coma corta la pregunta.** `PATRON_CLAUSULA` convierte la cabeza de una pregunta en una cláusula propia sin signo de pregunta, así que "Luego, ¿qué sigue?" produce la cláusula `luego,`.
2. **`separar` quita los slugs antes de evaluar la cláusula.** "para pe-andes" queda como `[para]` y "no pe-andes" como `[no]`.
3. **`RELLENO` incluye artículos y sustantivos** (`el`, `la`, `de`, `del`, `caso`, `paquete`). Por eso "para el caso X", "después el paquete" y "no el paquete" quedan hechos solo de palabras permitidas.
4. **Los conectores cuentan solos como núcleo de rechazo.** "para", "luego", "después", "mejor", "momento" y "nada" bastan para que la cláusula sea un rechazo.

Lo probé con `ec-corp-andina` pendiente (`clasificarConfirmacion(f, ["ec-corp-andina"])`):

```
"Para pe-andes, ¿qué falta?"                              -> rechaza
"Para el caso pe-andes, ¿qué falta?"                      -> rechaza
"Y para el caso co-industrias-delta, ¿qué falta?"         -> rechaza
"Consulta el NIT, para el caso co-industrias-delta"       -> rechaza
"Luego, ¿qué sigue?"                                       -> rechaza
"Y después, ¿qué hago?"                                    -> rechaza
"Después, ¿me muestras el checklist?"                      -> rechaza
"Mejor, ¿me das el NIT?"                                   -> rechaza
"Dame primero el NIT, después el paquete"                  -> rechaza
"muéstrame el checklist, no el paquete"                    -> rechaza
"procesa co-industrias-delta, no pe-andes"                 -> rechaza
"lee la solicitud de pe-andes, no la de ec-corp-andina"    -> rechaza
"Procesa pe-andes. Después, el paquete de co-industrias-delta" -> rechaza
```

En cambio, "Ahora, ¿qué falta?" y "Por ahora, ¿qué falta?" dan `otro`. Solo cambia si la cabeza es una palabra de `NEGACIONES`.

**Consecuencia:**

- `abrirTurno` (`compuerta.policy.ts:47-48`) cierra en LIBRE y quita **todos** los casos pendientes.
- `agent/prompt.md:53` le dice al modelo que "Ese pedido no es un rechazo aunque traiga palabras como "no", "para", "luego", "mejor" o "después" … no digas que la confirmación quedó cancelada". El modelo responde, entonces, que el caso sigue pendiente, y el servidor no agrega ninguna pregunta.
- El "sí" siguiente se bloquea con `CONFIRMACION_REQUERIDA`, y la analista tiene que pedir que se arme el paquete otra vez.

Es exactamente el síntoma de CR-01 (doble confirmación, clasificado como crítico) y de G-02-2. Además, viola la prohibición del plan "MUST NOT cancel a pending case because an unrelated request or an ordinary question merely contains a word like 'para', 'no', 'luego', 'mejor' or 'después'" y la verdad 3 de sus must_haves. "Para el caso X, ¿qué falta?" es la forma natural de preguntar por otro caso en el flujo de varios casos que describe "## Varios casos" del conocimiento.

No hay envío sin confirmación, pero el comportamiento que el plan declara cerrado sigue roto en frases más comunes que las de las pruebas. Por eso lo clasifico como BLOCKER.

**Arreglo:** que la regla (b) distinga un núcleo de rechazo de los conectores y de los rellenos nominales:

- Que una cláusula que no es todo el mensaje necesite un núcleo verdadero ("no", "nunca", "espera…", "cancela…", "detente", "alto", "aguarda").
- Que los conectores ("para", "luego", "después", "mejor", "momento", "nada", "aún", "todavía", "ni") solo cuenten cuando la cláusula es todo el mensaje ("Para.", "mejor después").
- Que los rellenos nominales y los slugs solo se admitan junto a un verbo de cancelación.

```ts
// confirmation.constants.ts
export const NUCLEOS_DE_RECHAZO: ReadonlySet<string> = new Set([
  "no", "nunca", "jamas", "tampoco", "espera", "esperes", "esperemos", "espere",
  "cancela", "cancelar", "cancelo", "cancelado", "detente", "deten", "alto", "aguarda",
]);
export const CANCELACIONES: ReadonlySet<string> = new Set(["cancela", "cancelar", "cancelo", "cancelado"]);
export const RELLENO_DE_ESPERA: ReadonlySet<string> = new Set([
  "por", "favor", "porfa", "ya", "ahora", "gracias", "entonces", "y", "un", "una", "vez", "todo",
]);

// confirmacion.policy.ts
function esClausulaDeEspera(clausula: string, esMensajeCompleto: boolean): boolean {
  if (PATRON_PREGUNTA.test(clausula)) return false;
  const { slugs, palabras } = separar(clausula);
  const cancela = palabras.some((palabra) => CANCELACIONES.has(palabra));
  const relleno = cancela ? RELLENO : RELLENO_DE_ESPERA;
  if (slugs.length > 0 && !cancela) return false;
  const nucleo = esMensajeCompleto ? NEGACIONES : NUCLEOS_DE_RECHAZO;
  return (
    palabras.some((palabra) => nucleo.has(palabra)) &&
    palabras.every((palabra) => NEGACIONES.has(palabra) || relleno.has(palabra))
  );
}

function esRechazoExplicito(normalizado: string, frase: Frase): boolean {
  if (niegaElEnvio(frase.palabras)) return true;
  const clausulas = normalizado.match(PATRON_CLAUSULA) ?? [];
  return clausulas.some((clausula) => esClausulaDeEspera(clausula, clausulas.length === 1));
}
```

Agrega cada frase de la tabla anterior como fila `OTRO` en `FILAS_RECHAZO_ACOTADO`, y "Para pe-andes, ¿qué falta?" a la prueba de bucle "deja el caso pendiente". Comprueba que las filas `RECHAZA` actuales sigan en verde: "No, ¿qué falta?", "Espera, ¿qué falta?", "Todavía no. ¿Qué falta?", "Para.", "mejor después", "cancela ec-corp-andina", "no, gracias" y "por ahora no". Registra el ajuste como enmienda de D-63.8.

## Advertencias

### WR-19: [WARNING] rechazos claros siguen dando `otro`, y el servidor vuelve a preguntar justo después de un "no quiero enviarlo todavía" (resto de WR-15)

**Archivos:** `src/config/constants/confirmation.constants.ts:38-61`, `:106-119`, `src/domain/policies/confirmacion.policy.ts:86-112`, `agent/prompt.md:51`, `src/knowledge/registro-proveedor.md:42`

**Problema:** la forma (a) solo reconoce las doce formas exactas de `VERBOS_NEGABLES`. La forma (b) no admite la palabra "un" (`RELLENO` tiene "una", pero no "un") y depende de que la analista puntúe la frase. Lo probé con un caso pendiente:

```
"espera un momento"            -> otro      ("espera, un momento" -> rechaza)
"un momento"                   -> otro
"no quiero enviarlo todavía"   -> otro
"ni se te ocurra enviarlo"     -> otro
"no lo confirmes"              -> otro
"no confirmes" / "no autorices"-> otro
"no puedo confirmar todavía"   -> otro
"todavía no qué falta?"        -> otro      ("todavía no, ¿qué falta?" -> rechaza)
```

`prompt.md:51` le dice al modelo que "una frase corta como … "espera"" es un rechazo y que debe decir que la confirmación quedó cancelada. Ante "espera un momento" o "no quiero enviarlo todavía", el modelo dice "queda cancelada", y el servidor agrega a continuación "¿Confirmas el envío simulado…?" con `needsConfirmation: true`.

Es el mismo síntoma visible que WR-15 y la primera mitad de G-02-2. El SUMMARY lo marca como "seguro" porque no se envía nada, pero el objetivo del plan era precisamente que el prompt y el servidor describieran el mismo rechazo. La diferencia entre "espera un momento" y "espera, un momento" depende solo de una coma.

**Arreglo:**

- Agrega "un" a los rellenos de la regla (b).
- Amplía la forma (a) con estas formas: "confirmes", "autorices", "confirmemos", el infinitivo y sus enclíticos ("enviar", "enviarlo", "enviarla", "mandar", "mandarlo", "confirmar") cuando van después de un modal negado ("no quiero", "no puedo", "no vayas a"), y el patrón "ni se te ocurra".
- Agrega todas las frases anteriores como filas `RECHAZA`.
- Si alguna forma se deja fuera a propósito, que el prompt no cite ejemplos que el servidor no aplica: hoy "espera" sola funciona, pero "espera un momento" no.

### WR-20: [WARNING] al quitar las tildes, el pretérito ("envié", "mandé", "despaché") se confunde con el subjuntivo, y "No envié el certificado, ¿lo puedo agregar?" cancela el caso

**Archivos:** `src/domain/policies/confirmacion.policy.ts:86-96`, `:115`, `src/config/constants/confirmation.constants.ts:106-119`

**Problema:** `niegaElEnvio` trabaja sobre `sinDiacriticos(texto)`. La primera persona del pretérito ("envié", "mandé", "despaché") queda idéntica al subjuntivo de `VERBOS_NEGABLES` ("envie", "mande", "despache"). Lo mismo pasa con "confirmo" y "autorizo" en preguntas, porque la forma (a) ignora el signo de pregunta. Probado:

```
"No envié el certificado, ¿lo puedo agregar?"   -> rechaza
"¿por qué no mandé el RUT?"                      -> rechaza
"todavía no lo envié"                            -> rechaza
"¿no lo envié ya?"                               -> rechaza
"¿no confirmo yo después?"                       -> rechaza
```

Son preguntas y comentarios de la analista sobre su propio trabajo. D-63.8 dice que lo demás es `otro`, pero estas frases cancelan todos los casos pendientes. Ninguna prueba cubre esta colisión.

**Arreglo:** que la forma (a) lea los tokens con tilde, como ya hace `tieneSiConTilde` con `PATRON_NO_PALABRA_UNICODE`, y descarte el token cuando termina en "é". La versión sin tilde ("no envie") se puede seguir aceptando como rechazo, porque es el lado seguro.

```ts
function esPreterito(token: string): boolean {
  return token.endsWith("é");
}

function niegaElEnvio(texto: string): boolean {
  const tokens = texto.normalize("NFC").toLowerCase().split(PATRON_NO_PALABRA_UNICODE);
  return tokens.some((token, indice) => {
    if (!NEGADORES.has(sinDiacriticos(token))) return false;
    const verbo = verboTrasNegador(tokens, indice);
    return verbo !== undefined && !esPreterito(verbo) && VERBOS_NEGABLES.has(sinDiacriticos(verbo));
  });
}
```

(El sufijo "é" puede ir como constante en `confirmation.constants.ts`.) Agrega las cinco frases como filas `OTRO`.

### WR-21: [WARNING] la forma (a) rechaza con "hagas" y "confirmo" aunque rijan otro objeto: "No hagas el PDF, solo el xlsx" cancela el caso pendiente

**Archivos:** `src/config/constants/confirmation.constants.ts:116-118`, `src/domain/policies/confirmacion.policy.ts:86-96`, `agent/prompt.md:51`, `:53`

**Problema:** "hagas", "confirmo" y "autorizo" no son verbos de envío. La forma (a) los acepta con cualquier complemento:

```
"No hagas el PDF, solo el xlsx"                -> rechaza
"procesa pe-andes pero no hagas el pdf"        -> rechaza
"no lo hagas así, usa el NIT del maestro"      -> rechaza
"no confirmo que el RUC esté bien"             -> rechaza
"no confirmo el NIT, revísalo"                 -> rechaza
```

Todos son pedidos distintos sobre otra tarea o sobre un dato. `prompt.md:53` le dice al modelo que un pedido distinto deja el paquete pendiente y que no diga que se canceló, pero el servidor lo cancela en silencio. El "sí" posterior vuelve a dar `CONFIRMACION_REQUERIDA`. Es el mismo mecanismo de CR-04 con otra puerta de entrada.

**Arreglo:** que "hagas", "confirmo" y "autorizo" solo rechacen cuando lo que sigue es el fin de la cláusula, un slug pendiente o palabras de `NEGACIONES` y `RELLENO` ("no lo hagas", "no confirmo", "no autorizo el envío", "no lo hagas todavía"). Los verbos de envío pueden mantener la regla actual.

```ts
export const VERBOS_GENERICOS_NEGABLES: ReadonlySet<string> = new Set(["hagas", "confirmo", "autorizo"]);

function complementoDeEnvio(palabras: readonly string[], desde: number): boolean {
  return palabras.slice(desde + 1).every((palabra) => NEGACIONES.has(palabra) || RELLENO.has(palabra));
}
```

Aplícalo dentro de la cláusula, no del mensaje completo, para que "No hagas el PDF, solo el xlsx" dé `otro`.

### WR-22: [WARNING] RN4 dice lo contrario de la regla: "Un pedido que solo contiene palabras como "no", "para", "luego" o "mejor" no es un rechazo"

**Archivos:** `src/knowledge/registro-proveedor.md:42`, `tests/contract/instrucciones-agente.test.ts:215-229`

**Problema:** "un pedido que solo contiene palabras como 'no'…" se lee como "un mensaje formado solo por esas palabras". Esa es exactamente la forma (b): el servidor clasifica "no", "mejor", "luego" y "para" sueltos como `rechaza`, y la misma oración de RN4 cita "no" como rechazo dos líneas antes. El conocimiento llega al modelo en el prompt de sistema, así que la definición queda contradictoria dentro de un mismo párrafo. La intención, según `prompt.md:53` y D-63.8, era decir "un pedido distinto que además trae alguna de esas palabras". La prueba de contrato solo fija el fragmento "no es un rechazo", así que no lo detecta.

**Arreglo:** redacta la oración como en el prompt y fija la oración completa en el contrato:

```md
Un pedido distinto (por ejemplo "consulta el NIT para tenerlo a mano") no es un rechazo aunque traiga palabras como "no", "para", "luego" o "mejor".
```

## Info

### IN-28: [INFO] `verboTrasNegador` copia la cola del mensaje por cada negador, lo que da tiempo cuadrático (T-02-71)

**Archivo:** `src/domain/policies/confirmacion.policy.ts:86-96`

**Problema:** `palabras.slice(desde + 1)` copia todo el resto del arreglo para cada palabra de `NEGADORES`, aunque `find` se detiene en la primera que no es pronombre. Lo medí con `"no ".repeat(n)`: 5.000 negadores tardan 11 ms, 20.000 tardan 104 ms y 40.000 (120 KB) tardan 382 ms. El crecimiento es cuadrático. No hay límite de tamaño de mensaje hasta API-04 (Fase 3). Está registrado como T-02-71 (bajo, abierto) en la verificación de amenazas.

**Arreglo:** recorre por índice sin copiar.

```ts
function verboTrasNegador(palabras: readonly string[], desde: number): string | undefined {
  for (let indice = desde + 1; indice < palabras.length; indice += 1) {
    const palabra = palabras[indice];
    if (palabra !== undefined && !PRONOMBRES_ATONOS.has(palabra)) return palabra;
  }
  return undefined;
}
```

### IN-29: [INFO] los contratos y las filas nuevas fijan solo los ejemplos citados, no la regla en prosa que el prompt promete, y por eso CR-04 pasa en verde

**Archivos:** `tests/contract/instrucciones-agente.test.ts:163-235`, `tests/unit/confirmacion.policy.test.ts:140-215`

**Problema:**

- `prompt.md:53` promete que ningún pedido con "no", "para", "luego", "mejor" o "después" es un rechazo. El contrato solo ejecuta el clasificador sobre los dos ejemplos citados.
- `FILAS_RECHAZO_ACOTADO` prueba los conectores solo en medio de la frase y sin coma ("¿y luego qué sigue?", "¿qué hago después?"). Nunca los prueba como cabeza separada por coma, ni con "para <caso>" o "no el <sustantivo>", que son las familias de CR-04.
- `citado(prompt, "no")` pasa con cualquier `"no"` entre comillas del prompt.
- Los fragmentos fijados ("no es un rechazo", "aunque después venga una pregunta") son cortos, como ya señalaba IN-26, y no detectaron la inversión de WR-22.

La prueba de invariante "una palabra de rechazo nunca confirma" cubre bien el lado de `confirma`, pero no hay un invariante simétrico para el lado de `otro`.

**Arreglo:** agrega un invariante generado. Para cada palabra de `["no", "para", "luego", "mejor", "despues"]`, las plantillas `"${p}, ¿qué falta?"`, `"Para ${p} pe-andes, ¿qué falta?"`, `"dame el NIT, ${p} el paquete"` y `"procesa pe-andes, ${p} co-industrias-delta"` no dan `rechaza`, salvo las formas que D-63.8 declare a propósito. Fija también la oración completa de RN4 (ver WR-22).

### IN-30: [INFO] la segmentación por cláusulas toma el discurso citado como rechazo, y "no¿" se trata distinto de "no ?"

**Archivos:** `src/config/constants/patterns.constants.ts:23`, `src/domain/policies/confirmacion.policy.ts:102-112`

**Problema:**

- `PATRON_CLAUSULA` corta en ":" y no distingue el discurso citado, así que "el cliente respondió: no." da `rechaza` aunque la analista solo informa lo que dijo otra persona.
- "¿" no está entre los signos de cierre, así que "no¿" y "no ¿" dan `rechaza`, mientras que "no ?" da `otro`.

Son casos de borde de bajo impacto, pero muestran que la frontera de cláusula depende de una puntuación que en un chat es inconsistente.

**Arreglo:** si se conserva la segmentación, documenta en D-63.8 que ":" separa cláusulas, y agrega "¿" como signo que cierra una cláusula previa (`[.,;:!?…¿]?` como lookahead), con filas para ambos casos.

---

_Revisado: 2026-10-14T05:06:39Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
