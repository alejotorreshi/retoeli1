# Convenciones

La fuente canónica de las reglas es `.claude/CLAUDE.md` (sección "Reglas de código del proyecto"). Este archivo no las reemplaza: explica por qué existe cada una y qué prueba la vigila. Si los dos textos discrepan, manda `.claude/CLAUDE.md`, y la discrepancia se corrige aquí.

Casi todas las reglas de forma tienen un guardián automático con una prueba que demuestra que detecta la violación:

- `tests/architecture.test.ts`: el backend, `modulo/` y `.opencode/` (G1–G16 y las reglas de capas sin número).
- `tests/arquitectura-web.test.ts`: el front `web/` (W1–W18 y W20–W23).
- `tests/sin-comentarios.test.ts`: sin comentarios en `src/`, `tests/`, `modulo/`, `.opencode/`, `demo.ts` y `web/` (TS, TSX, CSS e `index.html`).
- `bun run check`: TypeScript estricto sin `any` (api y web) y Biome.

## Por qué hay tantas reglas

El reto se evalúa leyendo el código y pidiendo explicarlo línea por línea en la defensa. Las reglas buscan dos cosas. La primera es que el agente nunca invente un dato, así que la única fuente de valores son herramientas tipadas y la frontera de cada capa es explícita. La segunda es que otra persona (o una IA) pueda retomar el trabajo sin preguntar, porque cada cosa tiene un único lugar donde vivir. Un guardián convierte la regla en una prueba que falla, en lugar de un acuerdo que se olvida.

## Backend: `tests/architecture.test.ts`

| Id | Regla | Por qué |
|---|---|---|
| G1 | `src/`, `tests/` y `demo.ts` no usan importaciones relativas (`./`, `../`): solo los alias `@/`, `@tests/`, `@web/` y `@modulo/` (este último solo lo usa `.opencode/`). | Mover un archivo no rompe importaciones ajenas, y el guardián de capas puede leer la capa de destino del alias. |
| G2 | El grafo de importaciones resuelve los alias y no tiene ciclos, ni siquiera de solo tipos (IN-10). | Sin ciclos, cada capa se puede entender y probar sola. |
| G3 | Los tipos exportados viven solo en `types/<nombre>.type.ts` de su capa. La excepción son los tipos del entorno junto a sus esquemas en `config/env.ts`. | Un tipo se encuentra siempre en el mismo lugar. |
| G4 | Los archivos de tipos solo tienen `type` e `import type`. | Importar un tipo nunca arrastra código ni efectos. |
| G5 | Cada archivo está en la carpeta de su rol, en kebab-case y con el sufijo de ese rol. Cada caso de uso exporta exactamente una función. | El nombre del archivo dice qué hace y dónde buscarlo (ver [estructura.md](estructura.md)). |
| G6 | `src/` no compara ni asigna códigos de familia con literales: usa el objeto (`ESTADO_CAMPO.FALTANTE`, no `"faltante"`). | Renombrar un código es un cambio de una línea y el compilador encuentra cada uso. |
| G7 | Sin `enum` de TypeScript: los códigos son objetos `as const` y sus uniones se derivan con `ValorDe<typeof X>`. | Los objetos `as const` existen en tiempo de ejecución, se iteran y alimentan a `z.enum`. |
| G8 | Todo texto para personas o para el modelo vive en `src/config/strings.ts`. | Un solo archivo para revisar tono e idioma, y ningún texto duplicado que pueda divergir. |
| G9 | La config pura (`config/constants/**`, `config/types/**`, `config/strings.ts`) no lee el entorno ni importa `node:`, `Bun` o zod. | Cualquier capa la puede importar sin efectos. |
| G10 | Solo `src/config/env.ts` lee el entorno. | Toda variable pasa por un esquema zod con su valor por defecto y su mensaje en español. |
| G11 | Las expresiones regulares viven en `src/config/constants/patterns.constants.ts`. La excepción es el parser del motor de plantillas. | Una regex se revisa y se prueba en un solo lugar. |
| G12 | `strings.ts` nombra las herramientas siempre como `proveedor_<export>`. | Es el nombre que ve el modelo (PRD §6.2), y un nombre distinto confundiría al modelo y a la analista. |
| G13 | Ningún `.ts` queda suelto en `src/` ni en la raíz de una capa, salvo `src/tools/proveedor.ts`, `src/config/env.ts`, `src/config/strings.ts` y `src/server.ts`. | Los nombres fijados por el PRD se respetan y el resto sigue la tabla de roles. |
| G14 | Cada prueba unitaria `tests/unit/<módulo>.<rol>.test.ts` es espejo de un módulo de `src/`. | Una prueba huérfana delata código borrado o renombrado. |
| G15 | Los `z.enum` se construyen desde su constante, no enumerando los miembros a mano. | El esquema y la constante no pueden divergir. |
| G16 | Cada `export const …Schema` de `schemas/*.schema.ts` lleva `satisfies z.ZodType<T>`. | El esquema zod y el tipo de TypeScript se comprueban entre sí al compilar. |

Reglas sin número del mismo archivo, cada una con su prueba de violación:

- Capas: ninguna importación sale de su capa (tabla de [arquitectura.md](arquitectura.md)). Solo los tres composition roots importan infra: `tools/wiring/entorno.wiring.ts`, `loop/wiring/agente.wiring.ts` y `http/wiring/server.wiring.ts`.
- `llm` solo conoce la config pura y zod. Las herramientas no importan el bucle. Ninguna capa interior importa `http`.
- pino solo entra por infra, y hono solo por `http` y su wiring.
- `cli` toma de `http` solo tipos con `import type`.
- `modulo/tools/proveedor.ts` solo reexporta `@/tools/proveedor.ts` (MOD-02), y `.opencode/tools/proveedor.ts` solo enlaza `@modulo/` (D-96).
- `src/` y `demo.ts` no usan APIs de shell (`Bun.spawn`, `Bun.$`, `child_process`): el PRD §8 prohíbe que las herramientas ejecuten comandos.
- `proveedor.ts` exporta exactamente las cinco herramientas del PRD, cada una con `description` de una oración, `args` y `execute` (CAL-04, HERR-01).
- `docs/estructura.md` nombra cada módulo de las carpetas que enumera (IN-21). Por eso ese archivo no se renombra.

## Front: `tests/arquitectura-web.test.ts`

| Id | Regla | Por qué |
|---|---|---|
| W1 | `web/src` no usa importaciones relativas. | El mismo motivo que G1. |
| W2 | Solo importa los paquetes `react`, `react-dom` y `eventsource-parser`. | Cada dependencia del bundle público se justifica. |
| W3 | El alias `@/` solo llega a la config pura y, con `import type`, a `src/http/types/**`. | El front comparte constantes y el contrato del cable, nunca lógica del servidor ni sus textos. |
| W4 | El estado puro de `web/src/features/<f>/estado/` y el núcleo del almacén (`web/src/store/almacen.ts`, `raiz.ts` y `selectores.ts`) no importan React ni tocan el navegador. | Los reductores son puros y se prueban sin DOM. |
| W5 | Sin `dangerouslySetInnerHTML` ni `innerHTML`. | El texto del modelo nunca se interpreta como HTML. |
| W6 | Sin `import.meta.env`. | El bundle es público y no debe cargar configuración secreta. |
| W7 | Sin `sessionStorage`, y `localStorage` solo en `sesion-local.ts` para el `sessionId`. | El código de acceso nunca queda en el navegador. |
| W8 | Todo texto visible vive en `web/src/config/strings.ts`. | El mismo motivo que G8. |
| W9 | Sin `enum` de TypeScript. | El mismo motivo que G7. |
| W10 | Los tipos exportados viven en `web/src/types/*.type.ts`, que solo tienen tipos. | El mismo motivo que G3 y G4. |
| W11 | Las regex viven en `web/src/config/constants/patterns.constants.ts`. | El mismo motivo que G11. |
| W12 | Todo CSS de `web/src` salvo `web/src/styles/tokens.css` usa variables de `tokens.css` para colores, tamaños y espacios: sin hex, `rgb()`, `px`, `rem`, `em`, `vh`, `vw`, `dvh`, `svh`, `lvh`, `ms`, `s` ni `deg` sueltos, y sin porcentajes distintos de `0%`, `50%` y `100%`. Las líneas que empiezan con `@media` quedan fuera, porque una media query no acepta variables. | Un solo lugar para el sistema visual (D-102): `global.css` sigue la misma regla que los módulos. |
| W13 | Cada archivo de `web/src` está en su carpeta de rol con su sufijo: `features/<f>/<c>/`, `features/<f>/estado/`, `compartido/<c>/`, `store/`, `api/`, `config/`, `types/` y `styles/`. Los únicos archivos sueltos son `main.tsx` y `app.tsx`. | El mismo motivo que G5: un componente suelto o una carpeta vieja (`components/`, `hooks/`, `state/`) se reporta. |
| W14 | Cada carpeta de componente de `web/src/features/<f>/` y `web/src/compartido/` que tiene `usar-<c>.ts` o `<c>.module.css` tiene también la vista `<c>.tsx`, y ninguna carpeta de componente se llama `estado`. | La vista, su hook y sus estilos viajan juntos (D-100), y `estado` queda reservado para los reductores puros de la feature. |
| W15 | Una vista de `features/` o `compartido/` solo importa su propio `usar-<c>.ts`, otras vistas, `web/src/config`, la config pura de `src/config` y, con `import type`, `web/src/types`, `react` y `src/http/types`. | La vista solo presenta (D-102): la red, el almacén, el estado y los hooks de React llegan por su hook. |
| W16 | La carpeta `web/src/api/` solo la importan los hooks `usar-*.ts`, `web/src/store` y la propia `api/`. | La red es transversal (D-122): una vista o un reductor nunca hablan con el servidor por su cuenta. |
| W17 | Un `.module.css` lo importa solo la vista `.tsx` de su carpeta con el mismo nombre, y ningún `.ts` importa un módulo CSS. | Cada estilo tiene un único dueño, así que mover o borrar un componente no deja estilos huérfanos ni compartidos por accidente. |
| W18 | Una vista de `features/` o `compartido/` no lleva números distintos de `0`, `1` y `-1` fuera de las cadenas, ni el atributo `style=`, ni colores hex o `rgb()`. | Nada hardcodeado en los componentes (D-102): los valores van en `config/constants` y los colores y tamaños en `tokens.css`. |
| W20 | `createContext`, `useContext`, `useReducer` y `useSyncExternalStore` se importan de `react` solo en `web/src/store`, salvo `useSyncExternalStore` en `features/disposicion/columnas/usar-columnas.ts` (la fuente es `matchMedia`). | El estado vive en un solo almacén con selectores (D-101); un segundo `useReducer` o Context partiría la fuente de verdad. |
| W21 | Cada selector que exporta `web/src/store/selectores.ts` devuelve un valor igual por `Object.is` al llamarlo dos veces sobre el mismo estado, y cada `useSeleccion` de `web/src` recibe un selector con nombre, nunca una función en línea. | `useSyncExternalStore` vuelve a renderizar cuando el valor cambia de referencia: un selector que crea un objeto en cada lectura entra en bucle, y uno en línea esconde esa trampa (FE-02). |
| W22 | En `web/src`, toda comparación (`===`, `!==`, `==`, `!=`), etiqueta `case`, rama de ternario, retorno y asignación de un código o estado usa el miembro de su objeto `as const`, nunca el string literal; un literal igual a un valor de una familia de códigos del front (cada objeto exportado de `web/src/config/constants/*.constants.ts` cuyos valores son todos `snake_case` en minúsculas) también se reporta. Solo `web/src/config/strings.ts` y `web/src/config/constants/**` escriben esos valores. Las únicas excepciones son `typeof` contra sus ocho resultados, el nombre de propiedad antes de `in` y la cadena vacía como rama de ternario o valor de retorno, porque no es un código sino el texto vacío por defecto; en una comparación la cadena vacía sí se reporta, y el vacío se comprueba con `length`. | Es el equivalente en el front de G6 y G15 (D-123): renombrar un código cambia su constante, y ningún literal viejo queda atrás. |
| W23 | Ningún archivo de `web/src`, tampoco `config/strings.ts` ni `config/constants/**`, copia como literal un código de negocio de las familias de `src/config/constants` que nombra la regla (`ESTADO_CAMPO`, `REGLA_MAPEO`, `ESTADO_SOPORTE`, `ESTADO_VIGENCIA`, `FORMATO`, `TIPO_ARCHIVO_CASO`, `TIPO_VISTA_PREVIA`, `HERRAMIENTA`, `NOMBRE_VISIBLE`, `TIPO_ACCION`, `DECISION_CONFIRMACION`, `DESENLACE_ENVIO`, `ESTADO_LLM`, `CODIGO_ERROR` y `CODIGO_AGENTE`), salvo como nombre de propiedad antes de `in`. Entran las familias que llevan por la API un estado, una decisión o un identificador del dominio del PRD; las de transporte e infraestructura, cuyos valores son palabras genéricas que el front reusa para sus propios estados de UI (`TIPO_EVENTO`, `ESTADO_COMPUERTA`, `RESULTADO_VISTA_PREVIA`, los niveles de log), quedan fuera y sus comparaciones las cubre W22. | El servidor decide y el front presenta (D-124): el front importa la constante compartida de la config pura y nunca guarda su propia copia de un código de negocio. Se suma a W3. |

## Sin comentarios: `tests/sin-comentarios.test.ts`

El código no lleva comentarios: se entiende por nombres, tipos y funciones pequeñas. Las explicaciones van en `docs/`, en el `README.md` o en `SOLUCION.md`. Las `description` de las herramientas y los `.describe()` de zod no son comentarios, son contrato con el modelo. El motivo es que un comentario envejece sin que ninguna prueba lo note, y un nombre claro no.

## Idioma

- Dominio, aplicación, herramientas, `loop`, `cli`, demo y front: identificadores en español, porque el PRD está en español y define el vocabulario del negocio.
- Infraestructura, `config/env.ts`, `http`, el protocolo del proveedor y los decoradores de `llm`: identificadores en inglés, como el vocabulario técnico estándar. El contrato del cable conserva los nombres del PRD (`sessionId`, `message`, `reply`, `toolCalls`, `needsConfirmation`).
- Documentación en español.

El idioma por capa no tiene guardián automático: se revisa en code review.

## Constantes, textos y configuración

- Las constantes viven por ámbito en `src/config/constants/<ámbito>.constants.ts`, tipadas y sin valores mágicos dispersos.
- Un texto que repite un dato se deriva de su constante (por ejemplo, el largo mínimo del código de acceso). Esto se revisa en code review.
- Las variables de entorno se validan con zod en `config/env.ts`, con su valor por defecto y su mensaje de error.

## Commits

- Conventional Commits: `tipo(ámbito): asunto`, con `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`, `build`, `perf`, `style` o `revert`. En los planes el ámbito es el id del plan, por ejemplo `test(04-06): …`.
- Identidad local del repositorio: `elianatorres5772 <elianatorres5772@gmail.com>`, como autora y como committer.
- El historial no se reescribe. Si un commit no cumple, se informa.
- La auditoría del historial es un comando y no una prueba de la CI, porque la CI clona el repositorio sin historial completo:

```bash
git log --format='autor=%an <%ae> committer=%cn <%ce>' | sort -u
git log --format=%s | grep -vcE '^(feat|fix|docs|test|chore|refactor|style|perf|build|ci|revert)(\(.+\))?!?: '
```

## Una regla nueva (D-62)

Una regla nueva de forma del código se agrega en la misma tarea en tres lugares: `.claude/CLAUDE.md`, el guardián (con una prueba que demuestre que detecta la violación) y `docs/estructura.md` si cambia la tabla de carpetas o roles. Una regla sin guardián se olvida, y un guardián sin prueba de violación puede no estar mirando nada.

## Versiones nuevas (D-35)

Una versión nueva de una dependencia o de una acción de GitHub se adopta solo cuando tiene al menos 7 días publicada. Las versiones van fijas en `package.json` y las acciones de la CI se fijan por SHA. El motivo es la cadena de suministro: una versión comprometida suele detectarse y retirarse en los primeros días.

## Reglas que se revisan a mano

No tienen guardián automático y se revisan en code review: el idioma por capa, que un texto que repite un dato se derive de su constante, no tocar `reto-01/` y la identidad de los commits.
