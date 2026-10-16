---
phase: 05-front-web-por-features-e-identidad-de-marca
fixed_at: 2026-10-16T21:36:31Z
review_path: .planning/phases/05-front-web-por-features-e-identidad-de-marca/05-REVIEW.md
iteration: 2
findings_in_scope: 12
fixed: 12
skipped: 0
status: all_fixed
---

# Fase 5: informe de corrección de la revisión de código (iteración 2)

**Corregido el:** 2026-10-16T21:36:31Z
**Revisión de origen:** `.planning/phases/05-front-web-por-features-e-identidad-de-marca/05-REVIEW.md`
**Iteración:** 2 (la iteración 1 está en `05-REVIEW-FIX.iter1.md` y no se deshizo nada de ella)

**Resumen:**
- Hallazgos en alcance: 12 (2 advertencias y 10 informativos, `fix_scope: all`)
- Corregidos: 12
- Omitidos: 0

Cada hallazgo tiene un commit atómico en `main` local, con rutas explícitas y la identidad `elianatorres5772 <elianatorres5772@gmail.com>`. No se hizo push y no se tocó `reto-01/`.

## Dónde corrió la verificación

Todo corrió **en el checkout principal** (`/Users/alejo/Developer/Alejo/reto-eli-1`, rama `main`), no en un worktree aislado. El orquestador pidió trabajar ahí, y un worktree no trae `node_modules`. Por eso los números de abajo se reproducen desde el árbol actual.

| Puerta | Resultado |
|---|---|
| `bun run check` (tsc ×3 + Biome) | OK: `Checked 516 files … No fixes applied.`, exit 0 |
| `bun test` | 2648 pass · 2 skip · 0 fail (2650 pruebas en 131 archivos, 10588 `expect`) |
| `bun test --isolate` | 2648 pass · 2 skip · 0 fail (mismos totales) |
| `bun run build:web` | OK, exit 0. `web/dist/index.html` lleva `<title>Registro como proveedor · Periferia IT Group</title>` y `theme-color` `#063635` |
| `bun run demo.ts` | OK, exit 0. Resultados de los 4 casos: co LISTO 17/0/0, ec BLOQUEADO 13/1/1, hn BLOQUEADO 9/1/1 y pa LISTO 8/0/1 (los mismos que en la iteración 1) |

Además se corrieron `tests/web/dom` y `tests/web/store` 5 veces seguidas, y las 5 dieron 0 fallos.

## Fixed Issues

### WR-01: The file-preview modal lives inside an auto-collapsing `<details>`, so it can vanish while the page stays inert

**Archivos modificados:** `web/src/features/casos/bloque-caso/bloque-caso.tsx`, `web/src/features/casos/bloque-caso/usar-bloque-caso.ts`, `tests/web/dom/app-panel.test.tsx`
**Commit:** b235fff
**Estado:** corregido, **requiere verificación humana** (cambia lógica de estado)
**Corrección aplicada:** Primero se agregó la prueba DOM, que falló (RED) en `dialogo.closest("details") === null`. Después vino la corrección:
- `DialogoVistaPrevia` se renderiza como hermano del `<details>`, dentro del `<li>`, así que plegar el bloque ya no puede ocultar un diálogo modal abierto.
- `useBloqueCaso` ya no copia `reciente` con un `useEffect`. Ahora reacciona solo cuando `reciente` cambia, y lo hace durante el render. Si el bloque pierde la recencia mientras muestra una vista previa, no se pliega. Así la lista de archivos no se aborta y el botón "Ver" sigue visible para recibir el foco al cerrar.

La prueba nueva procesa el caso A, abre su vista previa y luego suelta un evento de herramienta del caso B, de modo que B pasa a ser el reciente. Comprueba que:
- el diálogo sigue conectado y abierto, fuera de cualquier `<details>`;
- el bloque de A sigue abierto y el contenido sigue visible;
- al cerrar, el foco vuelve a "Ver".

### WR-02: Guardian false negatives in W24 and in the store-primitive rule

**Archivos modificados:** `tests/arquitectura-web.test.ts`, `docs/convenciones.md`, `.claude/CLAUDE.md`
**Commit:** 4e7c1ca
**Corrección aplicada:** Las tres muestras negativas se escribieron primero y las tres pruebas fallaron (RED). Después vino el cambio y pasaron a GREEN.
1. **W24:** `FUNCION_EN_ATRIBUTO` ahora mira la expresión entera del atributo JSX sobre el archivo completo sin cadenas (`\b[A-Za-z][\w-]*=\{[^{}]*?(?:=>|\bfunction\b|\.bind\()`, global). Reporta la línea donde empieza el atributo. La muestra suma estos casos:
   - el ternario con flecha;
   - la flecha en varias líneas;
   - los parámetros partidos como los parte Biome;
   - `.bind(…)`;
   - una línea con `>=` y `<=` que **no** debe reportarse.
2. **W20 (primitivas del almacén):** ya no lee los nombres importados. Busca cada uso de `createContext`, `useContext`, `useReducer` y `useSyncExternalStore` en el código sin cadenas. Con eso se reportan `import * as React` + `React.useSyncExternalStore`, el import por defecto y el alias. La expresión se deriva del conjunto `PRIMITIVAS_DEL_ALMACEN`, que sigue siendo la única lista. La muestra también confirma que el texto `"useContext"` dentro de una cadena no se reporta.
3. **W4:** `API_DEL_NAVEGADOR` suma `matchMedia`, `ResizeObserver`, `navigator`, `globalThis`, `setTimeout`, `setInterval`, `requestAnimationFrame` y `URL.createObjectURL`/`revokeObjectURL`. La muestra tiene una línea por cada nombre nuevo.

El código real ya cumplía con las tres reglas ampliadas, así que no hubo que tocar `web/src`. `docs/convenciones.md` (W4, W20 y W24) y `.claude/CLAUDE.md` describen ahora las formas nuevas.

### IN-01: Dead `id` on the composer textarea (left behind by the iteration-1 IN-04 fix)

**Archivos modificados:** `web/src/types/ui.type.ts`, `web/src/features/chat/compositor/compositor.tsx`, `web/src/features/chat/compositor/usar-compositor.ts`
**Commit:** cef2e19
**Corrección aplicada:** Se quitaron el `useId()`, el campo `idCampo` de `ControlCompositor` y el atributo `id` del `textarea`. El campo sigue nombrado por `aria-label` y el foco sigue pasando por `registrarCampoDelMensaje`. El `idCampo` de la pantalla de acceso no se tocó, porque ese sí lo usan `<label htmlFor>` y `aria-controls`.

### IN-02: The case-card data shape is redundant, and `ControlTarjetaCaso.slug` is never read

**Archivos modificados:** `web/src/types/ui.type.ts`, `web/src/features/chat/estado/tarjeta-caso.ts`, `web/src/features/chat/tarjeta-caso/usar-tarjeta-caso.ts`, `tests/web/tarjeta-caso.test.ts`
**Commit:** bdb52cf
**Corrección aplicada:**
- `datosDeTarjetaCaso` devuelve `{ cliente, pais: PaisDeTarjeta | null }`.
- Se borraron `paisDe`, los campos `slug`, `pais`, `codigo` y `nombrePais` de `DatosTarjetaCaso`, y `ControlTarjetaCaso.slug`.
- El tipo `Pais` se queda, porque lo usan `esPaisConocido` y `TEXTO_PAIS`.
- La prueba se actualizó a la forma nueva. Además fija los cuatro nombres de país visibles.

### IN-03: The preview dialog keeps the previous file's content across close and reopen

**Archivos modificados:** `web/src/types/ui.type.ts`, `web/src/features/archivos/dialogo-vista-previa/usar-dialogo-vista-previa.ts`
**Commit:** 0487cc0
**Corrección aplicada:** El estado del diálogo se guarda junto con la apertura a la que pertenece (`VistaPreviaDeApertura = { abierta, estado }`). El estado visible se deriva así: si lo guardado no corresponde a la `abierta` actual, se lee como `CARGANDO`. Por eso una reapertura muestra "cargando" desde su primer render, y ya no hace falta el `setEstado(VISTA_CARGANDO)` dentro del efecto. Una reapertura del mismo archivo también empieza en "cargando", igual que antes.

No se agregó una prueba propia. El cuadro intermedio con el contenido viejo no se puede observar de forma determinista con la red falsa, que responde al instante. La garantía es estructural, y las pruebas DOM de la vista previa (contenido, 404, 401 y la de WR-01) siguen en verde.

### IN-04: Props are mirrored into state through effects (extra render with stale UI)

**Archivos modificados:** `web/src/features/herramientas/grupo-herramientas/usar-grupo-herramientas.ts`, `web/src/features/disposicion/columnas/usar-columnas.ts` (y `usar-bloque-caso.ts`, ya en el commit de WR-01)
**Commit:** a569137
**Corrección aplicada:** Los tres `useEffect(() => setX(prop), [prop])` se reemplazaron por ajustes durante el render:
- `useGrupoHerramientas` cierra el grupo cuando `cerrarAlTerminar` cambia a `true`, y recuerda el valor anterior en `cerrabaAlTerminar`.
- `usePestanas` marca el panel como visto durante el render si se está viendo y su firma cambió.
- `useBloqueCaso` quedó resuelto en WR-01.

Ninguno pinta ya un cuadro con el estado viejo. En `web/src` solo queda un `useEffect` que llama a un setter, el temporizador de `usar-indicador-pensando.ts`, y ese no copia una prop.

### IN-05: Icon switches are not exhaustive, unlike the class maps next to them

**Archivos modificados:** `web/src/types/ui.type.ts`, `web/src/features/casos/progreso-caso/progreso-caso.tsx`, `web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx`, `web/src/features/encabezado/aviso-modelo/aviso-modelo.tsx`
**Commit:** 1ef17b7
**Corrección aplicada:**
- Los `switch` con `default` se reemplazaron por mapas `ICONO_DE_ESTADO` con `as const satisfies Record<EstadoEtapa | EstadoHerramienta, ComponenteIcono>`. `ComponenteIcono` es un tipo nuevo en `ui.type.ts`.
- El ícono "en curso" (giro + reloj) pasó a ser un componente con nombre en cada vista.
- En la tarjeta de herramienta, la envoltura toma la clase de `CLASE_DE_ESTADO`, así que el DOM resultante es el mismo de antes.
- `CLASE_DE_TONO` de `aviso-modelo.tsx` ahora `satisfies Record<TonoDelAvisoModelo, string | undefined>`, donde `TonoDelAvisoModelo = (typeof TONO_DEL_MODELO)[EstadoModeloConAviso]`.

Si se agrega un estado nuevo y no tiene ícono o clase, el código no compila.

### IN-06: Views still make decisions that belong in their hooks

**Archivos modificados:** `web/src/types/ui.type.ts`, `acciones-rapidas.tsx`/`usar-acciones-rapidas.ts`, `tarjeta-resultado.tsx`/`usar-tarjeta-resultado.ts`, `tarjeta-herramienta.tsx`/`usar-tarjeta-herramienta.ts`, `encabezado.tsx`/`usar-encabezado.ts`, `lista-archivos.tsx`/`usar-lista-archivos.ts`
**Commit:** a27b8cb
**Corrección aplicada:** Los hooks devuelven valores listos para enlazar, y las vistas solo los enlazan. Ninguna vista decide ya habilitación, etiquetas cortas, visibilidad ni variantes.

| Componente | Valores que devuelve el hook ahora |
|---|---|
| Acciones rápidas | `todosDeshabilitado`, y `demo` y `todos` como `TextosDeChip { texto, etiqueta }`, armados por `textosDeChip(corta, completo, corto)`. Se fueron `corta` y `cantidadCasos` del control. |
| Tarjeta de resultado | `bloqueosVisibles`, que reemplaza a `paqueteArmado` |
| Tarjeta de herramienta | `resumen`, `resultado` y `codigoVisible`, que reemplazan a `fallida` |
| Encabezado | `varianteLogo`, junto a `clasePrefijo`, así que toda la lógica de `angosto` vive en el hook |
| Lista de archivos | `vacia` en `ControlArchivos` |

### IN-07: Quick actions and the "procesar de nuevo" chip stay enabled during hydration, and their clicks are silently dropped

**Archivos modificados:** `web/src/store/selectores.ts`, `tests/web/store/selectores.test.ts`, `tests/web/store/app-con-almacen.test.tsx`
**Commit:** 7038e5c
**Estado:** corregido, **requiere verificación humana** (cambia lógica de estado visible: los chips se ven deshabilitados mientras se hidrata)
**Corrección aplicada:** Se aplicó la corrección mínima que pide la revisión: `seleccionarEnvioDeshabilitado` = `enCurso || hidratando || envioEnPausa`. Es la misma guarda que ya aplican `iniciarTurno` y el compositor. Afecta a los chips de acción rápida, a las tarjetas de caso y al chip "procesar de nuevo".

Los flujos no cambian. Antes, esos clics durante la hidratación ya se descartaban en silencio; ahora el botón se ve deshabilitado.

Primero se escribieron dos pruebas, y ambas fallaron (RED):
- una prueba de selector: una sesión guardada (hidratando) deja el envío deshabilitado, y una sesión nueva no;
- una prueba DOM: después de un turno se llama a `recargar()` del almacén y los chips "Listar" quedan deshabilitados mientras `hidratando`. Al terminar la hidratación vuelven a habilitarse.

### IN-08: A login that succeeds, followed by a 401 on `/api/config`, fails silently

**Archivos modificados:** `web/src/types/store.type.ts`, `web/src/store/acciones.ts`, `web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts`, `tests/helpers/types/red-web.type.ts`, `tests/helpers/red-web.helper.ts`, `tests/web/dom/app-acceso.test.tsx`, `tests/web/store/acciones.test.ts`
**Commit:** a40ff20
**Estado:** corregido, **requiere verificación humana** (agrega un mensaje visible en un camino de error)
**Corrección aplicada:** Se eligió la variante "solo después del login" de la revisión, porque es la que no cambia el flujo de la primera visita.
- `cargarConfig` devuelve su `ResultadoApi<ConfigResponse>`, y sigue despachando igual que antes.
- `usePantallaAcceso` revisa ese resultado después de un código aceptado. Si es `ACCESO_VENCIDO`, muestra el `mensaje` del servidor en el error del campo (`aria-invalid`) y devuelve el foco al campo.
- `accionDeConfig` no se tocó. El 401 de la primera carga, sin cookie, sigue mostrando la pantalla de acceso sin aviso. La prueba existente ahora lo fija de forma explícita: sin `aria-invalid` y sin el texto `accesoVencido`.

La red falsa de pruebas tiene una opción nueva, `cookieDescartada`: el código correcto recibe 204 pero el acceso no queda concedido, que es justo el caso de la revisión. La prueba DOM nueva falló primero (RED) y después pasó.

### IN-09: The root id and the global classes are copied by hand, and a mismatch fails silently

**Archivos modificados:** `web/src/main.tsx`, `web/src/config/strings.ts`, `tests/web/marca.test.ts`
**Commit:** deb0194
**Corrección aplicada:**
- `main.tsx` lanza `new Error(TEXTO_APP.raizAusente)` si falta la raíz, en lugar de dejar la página en blanco. El texto vive en `strings.ts` y se deriva de `ID_RAIZ`.
- `marca.test.ts` comprueba tres cosas: que `index.html` lleva `id="${ID_RAIZ}"`, que `global.css` estiliza `#${ID_RAIZ}` (sin aceptar `#root-x`) y que define `.${clase}` para cada valor de `CLASE_GLOBAL`.
- Hay muestras negativas para un id distinto en el HTML, para un selector parecido en el CSS y para `.sr-only` renombrado.

### IN-10: Hook API churn and inconsistency in the small `control*` helpers

**Archivos modificados:** `web/src/types/ui.type.ts`, `web/src/features/disposicion/barra-pestanas/usar-barra-pestanas.ts`, `web/src/features/archivos/lista-archivos/usar-lista-archivos.ts`, `web/src/features/archivos/lista-archivos/lista-archivos.tsx`
**Commit:** 6a9d4e2
**Corrección aplicada:**
- `useBarraPestanas` arma una sola vez, con el inicializador perezoso de `useState`, un callback ref por pestaña: `registroDe(botones, pestana)`. Lo guarda en un objeto que `satisfies Record<Pestana, RegistroDeBoton>`. Así React no desengancha y vuelve a enganchar los botones en cada render. `RegistroDeBoton` es un tipo nuevo, que también usa `PestanaEnBarra.registrar`.
- `controlFilaArchivo` recibe `PropsFilaArchivo`, como `controlAvisoDiscoEfimero(props)` y los demás. La vista le pasa sus props tal cual.

La navegación con flechas entre pestañas sigue cubierta por las pruebas DOM de `app-angosto`, que están en verde.

## Notas para quien revise

- **Requieren verificación humana:**
  - **WR-01**: la vista previa abierta y el bloque que no se pliega. Conviene probarlo con Playwright durante "Procesar los 4 casos".
  - **IN-07**: los chips se ven deshabilitados durante Detener/Recargar.
  - **IN-08**: el mensaje después del login cuando la cookie no queda guardada.

  Las tres cambian lógica de estado. Las pruebas cubren lo estructural, no la intención.
- Ningún hallazgo se omitió. IN-07 e IN-08 se corrigieron con la variante mínima, y los flujos siguen iguales: en IN-08 el primer 401 sigue en silencio.
- Los guardianes del front siguen siendo W1–W27. Solo se ampliaron W4, W20 y W24, y `CLAUDE.md` y `docs/convenciones.md` ya lo reflejan.
- `.planning/config.json` ya estaba modificado antes de esta corrida y no se tocó.

---

_Corregido: 2026-10-16T21:36:31Z_
_Corrector: Claude (gsd-code-fixer)_
_Iteración: 2_
