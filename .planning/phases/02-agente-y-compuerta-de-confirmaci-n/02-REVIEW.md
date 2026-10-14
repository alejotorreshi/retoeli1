---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-14T19:05:22Z
depth: standard
review_kind: incremental-gap-closure
scope: "plan 02-24 (CR-05, WR-25, D-63.10), commits 548ddd9..e4712fa, diff 6c2dba3..HEAD"
diff_base: 6c2dba3a45167eccb3861b30b9402439f24e4866
previous_report: 6c2dba3
files_reviewed: 9
files_reviewed_list:
  - agent/prompt.md
  - src/config/constants/confirmation.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/domain/policies/confirmacion.policy.ts
  - tests/contract/instrucciones-agente.test.ts
  - tests/helpers/corpus-confirmacion.helper.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/unit/confirmacion.policy.test.ts
findings:
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Fase 02: informe de code review (cierre de brecha 02-24, CR-05 / WR-25 / D-63.10)

**Revisado:** 2026-10-14T19:05:22Z
**Profundidad:** standard
**Archivos revisados:** 9
**Estado:** issues_found

El informe anterior (ronda 02-23, hallazgos CR-05, WR-23 a WR-25 e IN-31 a IN-33) está en la commit `6c2dba3`.

## Resumen

El plan 02-24 aplica la enmienda D-63.10 a la gramática de rechazo de D-63.9. Cambia cuatro cosas:

- (a) El complemento de una negación genérica, de un modal o de "cancela…" admite la redacción del servidor (`COMPLEMENTOS_DE_ENVIO`), y un conector de motivo o ":" cierra el complemento (`CORTES_DE_COMPLEMENTO`, `trasMotivo`).
- (b) "detén" y "detente" cancelan, y "hoy" es relleno de espera.
- (c) Un caso pendiente cuenta como palabra de espera. Si la cláusula lo nombra, también cuentan los `RELLENO`. Un negador seguido de un caso o de un relleno es una contraposición.
- (d) La exención por nombrar un caso queda para un caso que no está pendiente y para una cláusula "encabezada" por un verbo de `VERBOS_DE_PEDIDO`.

Además, `PATRON_SLUG_EN_TEXTO` se ancla a la izquierda, y las pruebas suman una cuarta dirección al diferencial contra `10a43ad`, decisiones fijas para las mezclas y pruebas de tiempo de punta a punta.

Verifiqué lo siguiente:

- **La autorización sigue siendo segura.** `esConfirmacionClara`, `casoConfirmado`, `RELLENO` y `NEGACIONES` no cambiaron. `esRechazoExplicito` solo puede devolver `RECHAZA` antes que la gramática de confirmación, así que ningún cambio de este diff puede llevar un mensaje a `confirma`.
- **CR-05 está resuelto en sus frases.** Las 7 frases de la parte 1, la familia de la parte 2 (respuestas de espera junto al caso pendiente) y "detén el envío" dan `rechaza` con uno y con dos pendientes. `FILAS_D6310`, `rechazosConRedaccionYCaso` y las filas de bucle de `compuerta.test.ts` y `compuerta-casos.test.ts` las fijan.
- **WR-25 está resuelto.** El lookbehind `(?<![a-z0-9])` no cambia el conjunto de coincidencias: un slug que empieza dentro de una corrida alfanumérica también coincide desde el inicio de esa corrida, que es la coincidencia más a la izquierda. Medí `clasificarConfirmacion` con 200 000 caracteres en 12 formas adversas ("a", "a-", "-a", "a-a ", "aé-", "ñ-a", "no lo ", "no ec-corp-andina, ", "a:", "no confirmo a: …", "sí ", "envía "). Todas tardan entre 3 y 25 ms.
- **Reglas del proyecto.** No hay comentarios, las regex están en `patterns.constants.ts`, los conjuntos nuevos están en `confirmation.constants.ts`, se usan los alias `@/` y no hay `any`.
- **Ejecución.** Las 4 suites del alcance más `architecture` y `sin-comentarios` pasan (576 pruebas, 0 fallos), y `bun run check` (tsc, Biome y `bun audit`) también. Comparé el clasificador de HEAD con el de `6c2dba3` (igual al de `a9f18a9` en `src/`) y con el de `10a43ad`, en worktrees temporales del scratchpad que ya eliminé. No modifiqué ningún archivo fuente.

El problema principal es una **regresión en el sentido opuesto al de CR-05**. D-63.10(d) dice que "ningún pedido que nombra un caso cancela", pero `eximeLaEspera` solo mira la **primera palabra** de la cláusula. Un pedido que nombra el caso pendiente y empieza con un relleno ("ahora", "por favor", "entonces", "primero") o con un verbo fuera de la lista ("quiero", "necesito", "envíame", "procésalo") vuelve a cancelar. Daba `otro` en 02-23, y el diferencial no lo puede ver porque solo compara contra `10a43ad`, que lo rechazaba (CR-06). Confirmé la afirmación del auditor de seguridad (T-02-83) con la fuente y la amplié.

## Rondas anteriores

| ID | Severidad | Estado actual | Evidencia |
|----|-----------|---------------|-----------|
| CR-05 | critical | **resuelto en sus frases, con regresión inversa** (02-24) | "no confirmo el envío simulado [de ec-corp-andina]", "no autorizo el envío simulado", "no confirmo porque/hasta…", "no lo hagas hasta…", "no confirmo: falta el certificado", "ec-corp-andina no", "no, ec-corp-andina", "todavía no, ec-corp-andina", "espera, ec-corp-andina", "Todavía no, falta el certificado de ec-corp-andina", "mejor no el paquete de ec-corp-andina", "no, el de ec-corp-andina tiene bloqueos", "co-industrias-delta todavía no" (con dos pendientes) y "detén el envío" dan `rechaza`. El diferencial ya tiene la cuarta dirección que pedía el informe anterior. Pero la misma enmienda abre CR-06 |
| WR-25 | warning | **resuelto** (T-02-77) | `patterns.constants.ts:25` tiene el lookbehind, y 200 000 caracteres tardan 3 ms (antes eran 13,8 s con 100 000). `confirmacion.policy.test.ts:650-675` lo cubre por la gramática de confirmación |
| WR-23 | warning | **parcial** (declarado) | "hoy no", "cancela el envío simulado", "cancela la confirmación", "no quiero enviarlo sin el certificado" y "no quiero confirmar el envío simulado" rechazan. "espérate", "cancélalo", "aguanta", "anula el envío", "olvídalo" y "no quiero que lo envíes al cliente" siguen en `otro`, y D-63.10 los declara fuera |
| WR-24 | warning | abierto (declarado) | Sin cambios. D-63.10 lo deja fuera. Los cortes de motivo lo amplían a los verbos genéricos (IN-34) |
| IN-29 | info | **parcial** | Hay cuarta dirección contra `10a43ad`. Sigue sin haber comparación contra la versión entregada inmediatamente antes (02-23), y por eso CR-06 pasa |
| IN-31, IN-32 | info | abiertos (declarados) | Sin cambios: "No, ¿qué falta en ec-corp-andina?" sigue en `rechaza` y "el cliente dijo: no confirmo" sigue en `rechaza` |
| IN-33 | info | abierto, empeorado | Quedan las aserciones de fragmentos de D-63.8, y hay 5 umbrales absolutos de 1 s nuevos (IN-36) |
| WR-17, WR-18, WR-03, IN-01(a), IN-23, IN-30(b) | — | abiertos | Fuera del alcance de este diff (ver `02-REVIEW-DISPOSITION.md`). WR-17 gana superficie (IN-35) |

## Hallazgos narrativos (revisor IA)

Los IDs nuevos siguen la numeración del ledger: CR-06, WR-26 en adelante e IN-34 en adelante.

## Problemas críticos

### CR-06: [BLOCKER] la exención de D-63.10(d) solo mira la primera palabra de la cláusula. "No, ahora consulta el NIT de co-industrias-delta" (con dos pendientes), "No, por favor consulta el NIT de ec-corp-andina" y "Todavía no. Por favor revisa el NIT de ec-corp-andina." pasan de `otro` a `rechaza` (external: gsd-security-auditor, T-02-83)

**Archivos:**
- `src/domain/policies/confirmacion.policy.ts:256-262` (`eximeLaEspera`) y `:277-284` (`esRechazoExplicito`)
- `src/config/constants/confirmation.constants.ts:204-223` (`VERBOS_DE_PEDIDO`)
- `tests/helpers/corpus-confirmacion.helper.ts:50-54`, `:248`
- `tests/unit/confirmacion.policy.test.ts:569-584`

**Problema:** `eximeLaEspera` decide con `VERBOS_DE_PEDIDO.has(tokens[0]?.base ?? "")`. Un pedido que nombra el caso pendiente solo queda exento si su **primer token** es una forma exacta de la lista. En cualquier otro caso, la cláusula "No" o "Todavía no" del mismo mensaje cuenta como cláusula de espera y cancela todos los pendientes. Comparé HEAD con `6c2dba3` (02-23):

```
                                                            pendientes  02-23  HEAD
"No, ahora consulta el NIT de co-industrias-delta"          dos         otro   rechaza
"No, entonces procesa co-industrias-delta"                  dos         otro   rechaza
"No, por favor consulta el NIT de ec-corp-andina"           uno / dos   otro   rechaza
"Todavía no. Por favor revisa el NIT de ec-corp-andina."    uno / dos   otro   rechaza
"No, primero procesa ec-corp-andina"                        uno / dos   otro   rechaza
"No, mejor procesa ec-corp-andina"                          uno / dos   otro   rechaza
"No, y procesa ec-corp-andina"                              uno / dos   otro   rechaza
"No. Ahora dame el NIT de ec-corp-andina."                  uno / dos   otro   rechaza
"Espera, ahora revisa ec-corp-andina"                       uno / dos   otro   rechaza
"No, quiero el NIT de ec-corp-andina"                       uno / dos   otro   rechaza
"No, necesito el NIT de ec-corp-andina"                     uno / dos   otro   rechaza
"No, quiero ver el checklist de ec-corp-andina"             uno / dos   otro   rechaza
"No, envíame el NIT de ec-corp-andina"                      uno / dos   otro   rechaza
"No, procésalo: ec-corp-andina"                             uno / dos   otro   rechaza
"No, muéstramelo: ec-corp-andina"                           uno / dos   otro   rechaza
"No, reprocesa ec-corp-andina" / "No, vuelve a procesar …"  uno / dos   otro   rechaza
"detente, procesa ec-corp-andina"                           uno / dos   otro   rechaza
```

Las dos primeras filas y la cuarta son variantes de una palabra de filas que el propio plan declara `otro`:

- `["No, consulta el NIT de co-industrias-delta", DOS, OTRO]` (`confirmacion.policy.test.ts:327`)
- `["Todavía no, revisa el NIT de ec-corp-andina", UNO, OTRO]` (`:330`)
- la fila de bucle de `compuerta-casos.test.ts:774`

Agregar "ahora" (de `RELLENO`), "entonces" o "por favor", o cambiar la coma por un punto, invierte la decisión. El texto de D-63.10(d) es universal ("ningún pedido que nombra un caso cancela"), y la regla implementada es una lista cerrada de 18 formas en primera posición, sin enclíticos ("procésalo", "muéstramelo", "envíame") ni modales de pedido ("quiero", "necesito").

En "detente, procesa ec-corp-andina", "detente" ahora está en `CANCELACIONES` (camino (b)) y la exención no se aplica a ese camino. "Espera, procesa ec-corp-andina" da `otro`, pero "detente, procesa ec-corp-andina" da `rechaza`.

Afirmaciones como "No, el NIT de ec-corp-andina" o "No, el pdf de ec-corp-andina" también pasan a `rechaza`. Tienen la misma forma que el par aprobado "No, el de ec-corp-andina", así que las tomo como consecuencia declarada y no las cuento en este hallazgo.

**Por qué no lo detectan las pruebas:**

- Todos los pedidos generados empiezan con el verbo de la lista: `PEDIDOS_CON_CASO` es "procesa …", "lee …" y "consulta …" (`corpus-confirmacion.helper.ts:50-54`), y `nuncaCancelanDentro` los antepone tal cual con `${P}, ${pedido}` (`:248`). Ningún mensaje generado tiene un relleno ni un verbo fuera de la lista delante del pedido.
- La cuarta dirección del diferencial (`confirmacion.policy.test.ts:569-584`) solo prohíbe pasar de `rechaza` a `otro` respecto de `10a43ad`. Las frases de la tabla daban `rechaza` en `10a43ad`, así que volver a `rechaza` no es infracción, aunque la versión entregada inmediatamente antes (02-23) daba `otro`. La tercera dirección solo cubre preguntas.

**Consecuencia:** el escenario es el de §11. `ec-corp-andina` espera confirmación y la analista pide un dato: "No, por favor consulta el NIT de ec-corp-andina". `prompt.md:54` le dice al modelo que un pedido para "consultar un valor" deja el paquete pendiente y que "el servidor vuelve a agregar su pregunta". El servidor, en cambio, ya canceló. No agrega la pregunta y responde `needsConfirmation: false`, así que el modelo describe un estado que no existe. El "sí" siguiente no autoriza (`CONFIRMACION_REQUERIDA`), y la analista tiene que volver a armar el paquete.

Es el síntoma de doble confirmación de CR-01 y CR-04 (CR-04 se clasificó BLOCKER), ahora en la dirección opuesta a CR-05 y para la clase que D-63.10(d) declara cerrada. Nunca envía, pero contradice la decisión aprobada y rompe el flujo de la demo con frases cotidianas. Por eso lo clasifico como BLOCKER. El auditor lo registró como T-02-83 (medium, pendiente de decisión), y este informe confirma la evidencia contra la fuente.

**Arreglo:** mide la cabeza de la cláusula después de saltar rellenos y conectores, y reconoce los enclíticos y los modales de pedido. Que `detente` en su propia cláusula use la misma exención que "espera":

```ts
// confirmation.constants.ts
export const MODALES_DE_PEDIDO: ReadonlySet<string> = new Set(["quiero", "necesito", "queremos", "necesitamos"]);
export const CABEZAS_DE_PEDIDO: ReadonlySet<string> = new Set(["y", "ahora", "entonces", "primero", "mejor", "por", "favor", "porfa", "ya"]);

// confirmacion.policy.ts
function esVerboDePedido(token: Token | undefined): boolean {
  if (token === undefined) return false;
  const base = token.base;
  return (
    VERBOS_DE_PEDIDO.has(base) ||
    MODALES_DE_PEDIDO.has(base) ||
    [...VERBOS_DE_PEDIDO].some((verbo) => base.startsWith(verbo) && PRONOMBRES_ATONOS.has(base.slice(verbo.length)))
  );
}

function cabezaDePedido(tokens: readonly Token[]): Token | undefined {
  let indice = 0;
  while (indice < tokens.length && CABEZAS_DE_PEDIDO.has(tokens[indice]?.base ?? "")) indice += 1;
  return tokens[indice];
}

function eximeLaEspera(pendientes: readonly string[]): (clausula: Clausula) => boolean {
  return ({ tokens }) => {
    const casos = tokens.filter((token) => token.caso);
    if (casos.some((token) => !pendientes.includes(token.crudo))) return true;
    return casos.length > 0 && esVerboDePedido(cabezaDePedido(tokens));
  };
}
```

Para enclíticos dobles ("muéstramelo") hace falta una lista de sufijos (`ENCLITICOS`: "me", "lo", "la", "melo", "mela"…) en lugar de `PRONOMBRES_ATONOS`. Todo va en constantes. Además:

- Amplía el corpus con un generador `nuncaCancelanPedidoDelPendiente()`: cada respuesta de `ESPERAS` × los prefijos `["", "ahora ", "por favor ", "entonces ", "primero ", "y "]` × los pedidos `["consulta el NIT de", "procesa", "revisa", "dame el NIT de", "quiero el NIT de"]` × el caso pendiente, con coma y con punto, para uno y dos pendientes. Debe dar siempre `otro`.
- Agrega una quinta dirección al diferencial: lo que 02-23 (`6c2dba3`) dejaba en `otro` solo pasa a `rechaza` si está en `siempreCancelan()`, en una fila `RECHAZA` o en `CANCELAN_POR_CASO_PENDIENTE`.
- Si la usuaria prefiere aceptar la regla de primera palabra, decláralo en D-63.10(d) con estas frases como filas `RECHAZA` y retira "ningún pedido que nombra un caso cancela", que hoy es falso.

## Advertencias

### WR-26: [WARNING] cualquier palabra con guion cuenta como "caso que no está pendiente" y exime la espera: "Todavía no, falta el e-mail del contacto" y "No, espera, falta el pre-registro" dan `otro`, sin declarar

**Archivos:**
- `src/domain/policies/confirmacion.policy.ts:256-259` (`eximeLaEspera`) y `:109-120` (`tokensDe`, `caso: PATRON_SLUG_COMPLETO.test(crudo)`)
- `src/config/constants/patterns.constants.ts:25-26`
- `tests/unit/confirmacion.policy.test.ts:569-584`

**Problema:** `eximeLaEspera` exime todo el mensaje si una cláusula afirmada tiene un token "caso" que no está pendiente (línea 259). Pero un token es caso por pura forma: cualquier palabra ASCII con guion ("e-mail", "pre-registro", "co-titular", "sub-cuenta"). Respuestas de rechazo normales en un formulario de proveedor dan `otro`:

```
                                                pendientes  10a43ad  02-23  HEAD
"Todavía no, falta el e-mail del contacto"      uno / dos   rechaza  otro   otro
"No, espera, falta el pre-registro"             uno / dos   rechaza  otro   otro
"No. Te aviso por e-mail."                      uno / dos   rechaza  otro   otro
```

No es una regresión respecto de 02-23 (que eximía con cualquier caso). Pero D-63.10 sostiene que "un mensaje que 10a43ad rechazaba solo deja de rechazar si está declarado otro", y la prueba de la cuarta dirección lo afirma solo para su corpus, que no tiene ninguna palabra con guion que no sea un caso. El servidor vuelve a agregar "¿Confirmas el envío simulado…?" justo después de "Todavía no", que es el síntoma de CR-05.

**Arreglo:** que la exención por "caso no pendiente" exija un slug con forma de caso, es decir, con el prefijo de país del dominio (`co`, `ec`, `pe`, `pa`, `hn`). Hoy no hay una constante de países en `src/config/constants`, así que hay que crearla (`PREFIJOS_PAIS` en un `*.constants.ts`) y derivar de ella el patrón en `patterns.constants.ts`:

```ts
export const PATRON_SLUG_DE_CASO: RegExp = new RegExp(`^(?:${PREFIJOS_PAIS.join("|")})-[a-z0-9]+(?:-[a-z0-9]+)*$`);
```

La otra opción es que el bucle pase la lista de casos conocidos del repositorio. Agrega las tres frases como filas `RECHAZA` (o decláralas `otro` en D-63.10).

### WR-27: [WARNING] el prompt no describe la exención (d) para el caso pendiente, y RN4 dice "un caso" mientras el prompt dice "otro caso": para "No, procesa ec-corp-andina" el modelo y el servidor pueden contradecirse

**Archivos:**
- `agent/prompt.md:51`, `:54`
- `src/knowledge/registro-proveedor.md:42` (RN4, fuera del diff pero cargado en el mismo contexto del modelo)
- `tests/contract/instrucciones-agente.test.ts:304-318`

**Problema:**

- `prompt.md:51` dice que una respuesta de espera rechaza "sola, junto al nombre del caso que espera confirmación o separada del resto por una coma o un punto, aunque después venga una pregunta o un pedido que no nombra un caso".
- `prompt.md:54` limita la regla del pedido a "junto al nombre de **otro** caso".
- No hay ninguna oración ni ejemplo que diga que "No, procesa ec-corp-andina" o "No, consulta el NIT de ec-corp-andina" (con el caso **pendiente**) no rechazan. El servidor, en cambio, da `otro` para esas dos frases y vuelve a preguntar (filas de `confirmacion.policy.test.ts:329` y `:331`).

Con la redacción actual, el modelo puede leer "No" + caso pendiente como rechazo (S51), decir que la confirmación quedó cancelada, y el servidor agrega "¿Confirmas el envío simulado de ec-corp-andina?" en la misma respuesta. Es el síntoma de CR-05 con otras frases.

RN4 (`registro-proveedor.md:42`), que el modelo también recibe, dice "junto al nombre de **un** caso", una regla más amplia que la del prompt. Así el modelo tiene en contexto dos reglas distintas para el mismo mensaje. Además, la diferencia que hace el servidor (verbo de pedido en primera posición) no se puede explicar en prosa, así que el prompt no puede seguirla con exactitud.

El contrato fija las citas de S53, pero todas nombran un caso **no** pendiente ("procesa co-industrias-delta, no pe-andes", "No, el de pe-andes"). Ninguna prueba exige que el prompt cubra el pedido con el caso pendiente.

**Arreglo:** agrega a S53 un ejemplo con el caso pendiente ("No, consulta el NIT de ec-corp-andina") y fíjalo en `otros` de `ORACIONES_D639`. Alinea RN4 con el prompt ("de otro caso" o "un pedido que nombra un caso, aunque sea el pendiente") o declara en D-63.10 por qué difieren. Con el arreglo de CR-06, la regla del servidor queda expresable en prosa: "un pedido no rechaza aunque empiece con 'no' y nombre el caso pendiente".

## Info

### IN-34: [INFO] los rellenos y cortes nuevos aceptan palabras con contenido: "no, todo bien con ec-corp-andina", "No, de una vez ec-corp-andina" y "no lo hagas sin el logo" cancelan

**Archivos:**
- `src/domain/policies/confirmacion.policy.ts:228-233` (`admiteEnEspera` con `RELLENO`) y `:152-164` (`cortaElComplemento`, `colasDeComplemento`)
- `src/config/constants/confirmation.constants.ts:38-61`, `:196-202`

**Problema:**

- D-63.10(c) admite "también los rellenos ('el', 'paquete', 'de'…)" cuando la cláusula nombra el caso pendiente. La implementación usa `RELLENO` completo, que incluye "todo", "bien", "una", "vez", "y", "con" y "ya". Por eso "no, todo bien con ec-corp-andina" ("no hay problema, todo bien") y "No, de una vez ec-corp-andina" ("no, ya, de una vez") dan `rechaza` (en 02-23 daban `otro`).
- Un corte de motivo acepta **cualquier** cola, así que "no lo hagas sin el logo" (sobre el PDF) da `rechaza`, mientras que "No hagas el PDF sin el logo" da `otro`. Es la misma puerta que WR-24, ahora también con los verbos genéricos.

Ambos casos van al lado seguro y `10a43ad` también los rechazaba, pero la regla dice más de lo que D-63.10 declara.

**Arreglo:** usa un conjunto propio de rellenos nominales para (c) (`RELLENO_NOMINAL`: "el", "la", "los", "de", "del", "caso", "paquete", "envio", "por", "favor"), sin tocar `RELLENO`. Fija la decisión sobre "no lo hagas sin …" con una fila.

### IN-35: [INFO] con dos pendientes, una respuesta por caso ("envía ec-corp-andina. co-industrias-delta no.", "co-industrias-delta sí, ec-corp-andina no") ahora cancela los dos (en 02-23 daban `otro`)

**Archivos:** `src/domain/policies/confirmacion.policy.ts:246-254`, `:256-262`, `:277-284`

**Problema:** como un caso pendiente cuenta como palabra de espera, "co-industrias-delta no" forma una cláusula de espera, y una confirmación del otro caso en el mismo mensaje no la exime. El servidor cancela **también** el caso que la analista acaba de confirmar. Si el modelo sigue la confirmación y llama a `proveedor_simular_envio` para `ec-corp-andina`, la compuerta lo bloquea. Es consistente con "el rechazo por texto cancela todos los casos pendientes" y con la decisión fija "no, envía ec-corp-andina", pero amplía el alcance de WR-17 a una forma natural de responder con dos paquetes.

**Arreglo:** decláralo en D-63.10 con una fila de bucle (dos pendientes, respuesta por caso, ninguno enviado y sin pregunta), o resuélvelo junto con WR-17 (rechazo por caso).

### IN-36: [INFO] las pruebas nuevas suman umbrales absolutos de reloj y conteos mágicos (sigue IN-33)

**Archivos:**
- `tests/unit/confirmacion.policy.test.ts:561`, `:650-675`
- `tests/contract/instrucciones-agente.test.ts:445`

**Problema:**

- La suite de WR-25 agrega 5 aserciones `toBeLessThan(UN_SEGUNDO_MS)`. Hoy pasan con margen (3-25 ms), pero siguen siendo umbrales absolutos que en CI lento pueden fallar. Tampoco detectan un retorno a O(n²) por debajo de 1 s con 200 000 caracteres (por ejemplo, un O(n log n) mal escrito).
- `expect(MEZCLAS).toHaveLength(1590)` y `expect(mensajes).toHaveLength(15)` fijan conteos derivados de listas: cualquier palabra nueva en `PALABRAS_DENTRO_DE_FRASE` o en `NEGACIONES_DE_LA_PREGUNTA` rompe la prueba sin que cambie el comportamiento.

**Arreglo:** para el tiempo, compara la razón entre n y 2n (menos de 3×). Para los conteos, deriva el valor esperado del producto de las listas, o usa `toBeGreaterThanOrEqual`.

---

_Revisado: 2026-10-14T19:05:22Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
