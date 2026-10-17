---
phase: 05-front-web-por-features-e-identidad-de-marca
fixed_at: 2026-10-16T20:36:49Z
review_path: .planning/milestones/v1-phases/05-front-web-por-features-e-identidad-de-marca/05-REVIEW.md
iteration: 1
findings_in_scope: 16
fixed: 16
skipped: 0
status: all_fixed
---

# Fase 5: informe de corrección de la revisión de código

**Corregido el:** 2026-10-16T20:36:49Z
**Revisión de origen:** `.planning/milestones/v1-phases/05-front-web-por-features-e-identidad-de-marca/05-REVIEW.md`
**Iteración:** 1

**Resumen:**
- Hallazgos en alcance: 16 (6 advertencias y 10 informativos, `fix_scope: all`)
- Corregidos: 16
- Omitidos: 0

Hay un commit atómico por hallazgo, en `main` local, con rutas explícitas y la identidad `elianatorres5772 <elianatorres5772@gmail.com>`. No se hizo push.

Cada corrección de un guardián siguió el orden RED → GREEN. Primero se agregó la muestra negativa, y se vio fallar la prueba de muestra o la del código real. Después vino el cambio.

## Dónde corrió la verificación

Todo corrió **en el checkout principal** (`/Users/alejo/Developer/Alejo/reto-eli-1`, rama `main`), no en un worktree aislado. El orquestador pidió commitear sobre `main` local con rutas explícitas, y un worktree no trae `node_modules`, así que ahí no se pueden correr `tsc`, Biome ni `bun test`. Por eso los números de abajo se reproducen desde el árbol actual.

| Puerta | Resultado |
|---|---|
| `bun run check` (tsc ×3 + Biome) | OK: `Checked 516 files … No fixes applied.`, exit 0 |
| `bun test` | 2642 pass · 2 skip · 0 fail (2644 pruebas, 131 archivos, 10549 `expect`) |
| `bun run build:web` | OK, exit 0. `web/dist/index.html` lleva `<title>Registro como proveedor · Periferia IT Group</title>` y `theme-color` `#063635` |
| `bun run demo.ts` | OK, exit 0. Los 4 casos: co LISTO 17/0/0, ec BLOQUEADO 13/1/1, hn BLOQUEADO 9/1/1, pa LISTO 8/0/1 |

Las pruebas DOM se corrieron 5 veces seguidas después de quitar las pausas fijas (IN-09), y las 5 dieron 0 fallos.

## Fixed Issues

### WR-01: `CASO_DEMO_PRD` era una copia literal de `CASO_GUION_PRD`

**Archivos modificados:** `web/src/config/constants/ui.constants.ts`, `web/src/config/strings.ts`, `tests/web/tarjeta-caso.test.ts`, `tests/web/dom/app.test.tsx`
**Commit:** 4db7d61
**Corrección aplicada:** Se borró `CASO_DEMO_PRD` del front. `strings.ts` y las pruebas importan `CASO_GUION_PRD` de `@/config/constants/preflight.constants.ts`, la config pura que W3 deja importar, y esa es ahora la única fuente. W23 vigila el slug desde WR-06.

### WR-02: el placeholder del compositor escribía el slug a mano

**Archivos modificados:** `web/src/config/strings.ts`, `tests/web/dom/app.test.tsx`
**Commit:** 957c38c
**Corrección aplicada:** `placeholder` se arma ahora con `${CASO_GUION_PRD}`. La prueba DOM comprueba que el campo lleva ese placeholder y que el texto contiene el slug derivado.

### WR-03: el estado vacío decía "Cargando los casos…" para siempre cuando `/api/config` fallaba

**Archivos modificados:** `web/src/config/strings.ts`, `web/src/types/ui.type.ts`, `web/src/features/chat/estado-vacio/usar-estado-vacio.ts`, `web/src/features/chat/estado-vacio/estado-vacio.tsx`, `web/src/features/chat/estado-vacio/estado-vacio.module.css`, `web/src/store/selectores.ts`, `tests/web/dom/app.test.tsx`, `05-UI-SPEC.md`
**Commit:** 35978f4
**Estado:** corregido, **requiere verificación humana** (cambia un texto visible y la lógica de un estado)
**Corrección aplicada:** Se eligió la corrección mínima. El acceso solo pasa a `CONCEDIDO` con `CONFIG_RECIBIDA`, así que dentro del estado vacío una config nula significa siempre que la carga falló. Mientras `/api/config` no responde por primera vez, se ve `PantallaCarga`.
- No se agregó un tercer estado `CARGANDO`, porque no se puede alcanzar.
- El hook usa `seleccionarFaltaConfig`, y el selector `seleccionarConfigCargada` se borró porque quedó sin uso.
- El estado vacío muestra `TEXTO_ESTADO_VACIO.casosNoDisponibles` en un `<p role="status">`: "No se pudieron cargar los casos. Se vuelve a intentar en unos segundos; mientras tanto puedes escribir la instrucción."
- El reintento de config de la Fase 3 sigue igual.
- La prueba DOM que fijaba la conducta vieja ahora pide el aviso con `role="status"` y comprueba que la grilla lo reemplaza cuando el reintento responde.
- Se actualizó `05-UI-SPEC.md`: la viñeta del estado vacío, la tabla de copy y las filas `loading`/`error` de la matriz de estados.

### WR-04: las vistas llevaban manejadores en línea

**Archivos modificados:** `compositor.tsx`/`usar-compositor.ts`, `tarjeta-confirmacion.tsx`/`usar-tarjeta-confirmacion.ts`, `linea-de-tiempo.tsx`/`usar-linea-de-tiempo.ts`, `lista-archivos.tsx`/`usar-lista-archivos.ts`, `aviso-disco-efimero.tsx` y el nuevo `aviso-disco-efimero/usar-aviso-disco-efimero.ts`, `web/src/types/ui.type.ts`, `tests/arquitectura-web.test.ts`, `.claude/CLAUDE.md`, `docs/convenciones.md`
**Commit:** 5a8f04c
**Corrección aplicada:** Ahora cada hook devuelve los manejadores listos para enlazar:
- `alCambiar(evento)` del compositor.
- `alConfirmar` y `alCancelar` de la tarjeta de confirmación. La vista ya no importa `TIPO_ACCION`.
- `accionDelError` por turno en la línea de tiempo, que reemplaza el `alAccionDeAviso` que se pasaba hilo por hilo.
- `alPulsarVer` de la fila de archivo.
- `alProcesarDeNuevo` del aviso de disco efímero, en un hook nuevo que arma el mensaje con `TEXTO_DISCO.mensaje(caso)`. Se creó un archivo nuevo, `usar-aviso-disco-efimero.ts`, porque ese componente no tenía hook.

Se sumó el guardián **W24**: una vista no declara funciones en sus atributos JSX. La muestra negativa cubre flecha, `async`, `ref` y `function`. Primero estuvo en RED con exactamente las 6 líneas reales y después pasó a GREEN.

### WR-05: las constantes de marca no eran la fuente de verdad

**Archivos modificados:** `tests/web/marca.test.ts`, `web/src/config/constants/marca.constants.ts`
**Commit:** 2f4c6b1
**Corrección aplicada:** Se siguió la opción "drop them" de la revisión, que coincide con el UI-SPEC (las rutas son constantes solo cuando las usa TS).
- Se borraron `RUTA_FAVICON`, `FUENTES_AUTOALOJADAS` y `LICENCIAS_DE_FUENTES`, que solo usaba la prueba.
- Las fuentes de verdad pasan a ser `global.css` para las `@font-face`, `index.html` para el favicon y las precargas, y `tokens.css` para `--marca`.
- La prueba lee esos archivos. Verifica que cada fuente existe y es WOFF2, que hay una licencia OFL por familia y que cada precarga apunta a una `@font-face` declarada. También verifica que `apple-touch-icon` es el favicon y que `theme-color` es igual a `--marca`.
- Hay una muestra negativa para una precarga huérfana y para un `theme-color` distinto.

### WR-06: falsos negativos de los guardianes

**Archivos modificados:** `tests/arquitectura-web.test.ts`, `docs/convenciones.md`, `docs/estructura.md`, `.claude/CLAUDE.md`
**Commit:** ef3e17f
**Corrección aplicada:** Las cuatro muestras negativas fallaron primero (RED) y después pasaron (GREEN).
1. **W21:** `useSeleccion(x)` exige que `x` se importe de `@web/store/selectores.ts`. Un selector local o un alias que no venga de ahí se reporta. De paso se corrigió `SELECTOR_EN_LINEA`, que marcaba como "en línea" `useSeleccion( nombre )` cuando llevaba espacios.
2. **W16/W13:** solo cuenta como hook el `usar-<c>.ts` de su propia carpeta de componente (`HOOK_EN_SU_CARPETA`). W13 rechaza además los `usar-*.ts` dentro de `features/<f>/estado/`.
3. **W23:** `CODIGOS_DE_NEGOCIO` ya no es una lista a mano. Se deriva de cada `src/config/constants/*.constants.ts` así:
   - todos los valores de cada familia `snake_case`, también las de transporte como `TIPO_EVENTO`;
   - cada cadena exportada que es un código compuesto `snake_case` o `kebab-case`, como `CASO_GUION_PRD` y `TIPO_BLOQUEO_GUION`;
   - menos una lista explícita de 12 palabras genéricas (`string`, `boolean`, `true`, `false`, `none`, `ok`, `error`, `text`, `lista`, `pendiente`, `envio` y `herramientas`).

   Con esto, `{ tipo: "turn_end" }` y `"ec-corp-andina"` ya se reportan. El ejemplo de la revisión, `"fin_turno"`, no es un valor real; el valor de `TIPO_EVENTO.FIN_TURNO` es `"turn_end"`.

## Hallazgos informativos corregidos

### IN-01: código muerto y exportaciones que solo usaban las pruebas

**Archivos modificados:** `web/src/config/constants/ui.constants.ts`, `web/src/config/strings.ts`, `web/src/styles/global.css`, `tests/web/estado-del-modelo.test.ts`, `docs/estructura.md`
**Commit:** 487d04d
**Corrección aplicada:** Se borraron `CLASE_GLOBAL.TRANSICION`, las dos reglas `.transicion`, `TEXTO_RESULTADO.etiqueta`, `TEXTO_CONFIRMACION.etiqueta`, `TEXTO_MODELO.estado` y `TEXTO_APP.fechaEjecucion`. La prueba ahora arma el texto con las piezas reales (`prefijoModelo` + `etiqueta`, `prefijoFecha` + `valorFecha`).

### IN-02: `memoizarPorReferencia` trataba un `undefined` guardado como si no estuviera en caché

**Archivos modificados:** `web/src/store/selectores.ts`, `tests/web/store/selectores.test.ts`
**Commit:** b17978e
**Corrección aplicada:** La caché guarda el valor envuelto (`{ valor }`), sin `as`. Se agregó primero una prueba en RED en la que una derivación que da `undefined` se calcula una sola vez.

### IN-03: prefijo `use` en funciones que no son hooks

**Archivos modificados:** `tarjeta-confirmacion.tsx`/`usar-tarjeta-confirmacion.ts`, `tarjeta-herramienta.tsx`/`usar-tarjeta-herramienta.ts`, `lista-archivos.tsx`/`usar-lista-archivos.ts`, `usar-bloque-caso.ts`
**Commit:** 3bc2ff6
**Corrección aplicada:** Se renombraron `usePilaConfirmaciones` → `tarjetasEnPila`, `useTarjetaHerramienta` → `controlTarjetaHerramienta` y `useFilaArchivo` → `controlFilaArchivo`. `useArchivos` pasa a llamarse `useListaArchivos`, el hook propio de su carpeta, que `useBloqueCaso` eleva. La función nueva de WR-04 se llama `controlAvisoDiscoEfimero` por la misma regla.

### IN-04: el estado vacío pasaba el foco por un id global del DOM

**Archivos modificados:** `web/src/store/acciones.ts`, `web/src/types/store.type.ts`, `web/src/types/ui.type.ts`, `usar-compositor.ts`, `compositor.tsx`, `usar-estado-vacio.ts`, `ui.constants.ts`, `tests/web/store/acciones.test.ts`
**Commit:** 8c85b84
**Corrección aplicada:**
- El almacén expone `registrarCampoDelMensaje` y `enfocarCampoDelMensaje`, con un tipo `CampoEnfocable` que no depende del DOM.
- El compositor registra su `textarea` con `ref={registrarCampo}`, y el estado vacío llama a `enfocarCampoDelMensaje()` al desmontarse si tenía el foco.
- Se borró `ID_CAMPO_MENSAJE`, y el campo usa `useId()`.
- Se agregó una prueba unitaria de la acción. La prueba DOM del foco sigue pasando.

### IN-05: la carga de config del acceso usaba una señal que nadie podía abortar

**Archivos modificados:** `web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts`
**Commit:** 25ca91f
**Corrección aplicada:** Ahora el controlador se guarda en un ref y se aborta al desmontar la pantalla. `cambiarPendiente(false)` solo corre si la señal sigue viva, que es el caso de un 401 en config, porque la pantalla se queda.

### IN-06: el título del documento se escribía dos veces

**Archivos modificados:** `web/src/main.tsx`
**Commit:** d5ce290
**Corrección aplicada:** Se quitó `document.title = …`. El plugin `titulo-del-documento` de Vite queda como único mecanismo, en dev y en build, y lo prueba `marca.test.ts`.

### IN-07: los puntos de quiebre estaban duplicados en `em` en el CSS

**Archivos modificados:** `pantalla-acceso.module.css`, `pantalla-carga.module.css`, `tests/arquitectura-web.test.ts`, `.claude/CLAUDE.md`, `docs/convenciones.md`
**Commit:** 0e18e77
**Corrección aplicada:** `@media (min-width: 40em)` pasa a `@media (min-width: 640px)`, que es igual a `CONSULTA_DE_ANCHO.MEDIO`. Se sumó el guardián **W25**: toda consulta de ancho de un `@media` es un valor de `CONSULTA_DE_ANCHO` y todo `[data-diseno="…"]` es un valor de `DISENO`. La muestra negativa cubre `em`, `max-width` y un diseño inventado. Estuvo en RED con las 2 líneas reales y después en GREEN. Con la fuente por defecto de 16 px no cambia nada visible.

### IN-08: `LogoMarca` podía pintar `class="… undefined"`

**Archivos modificados:** `encabezado.tsx`, `aviso-modelo.tsx`, `tests/arquitectura-web.test.ts`, `.claude/CLAUDE.md`, `docs/convenciones.md`
**Commit:** 43dc9cb
**Corrección aplicada:** Se sumó el guardián **W26**: cada `estilos.<clase>` de una vista existe en su `.module.css`, y ninguna vista indexa el módulo con corchetes. Eso cubre `CLASE_POR_VARIANTE` y todos los `CLASE_DE_*`. Los dos accesos dinámicos `estilos[TONO_DEL_MODELO[…]]` pasaron a mapas `CLASE_DE_TONO` con nombre, y el compilador comprueba que el tono existe. La muestra negativa cubre una clase que falta y un acceso con corchetes.

### IN-09: pausas fijas en las pruebas DOM

**Archivos modificados:** `tests/web/dom/app.test.tsx`
**Commit:** d42a262
**Corrección aplicada:** Se quitaron las 5 llamadas `Bun.sleep(PAUSA_TRAS_SOLTAR_MS)` y la constante. Ahora las pruebas usan `await dom.act(async () => red.soltar())` y después `findBy*`. En la prueba de Detener, la ausencia del texto tardío no queda vacía: después de abortar, el flujo falso ya está en error y `soltar` no emite nada.

### IN-10: deriva de estructura y documentación

**Archivos modificados:** `web/src/api/cliente-api.ts`, `web/src/features/sesion/estado/hidratacion.ts`, `tests/web/hidratacion.test.ts`, `tests/arquitectura-web.test.ts`, `.claude/CLAUDE.md`, `docs/convenciones.md`
**Commit:** 2169bcc
**Corrección aplicada:**
- `sigueOcupada` se mudó a `api/cliente-api.ts`, porque solo inspecciona el resultado de la API.
- Se sumó el guardián **W27**: `web/src/api/` no importa `features/`, `store/` ni `compartido/`. Tiene muestra negativa y estuvo en RED con la importación real.
- `CLAUDE.md` describe `compartido/` como `aviso`, `iconos` y `logo-marca`.

## Notas para quien revise

- **WR-03** cambia un texto visible y lleva `requires human verification`. Conviene revisarlo con Playwright, cortando `/api/config` después del login. Contradecía la fila `error` anterior del UI-SPEC, que se actualizó en el mismo commit porque así lo pidió la usuaria.
- Los guardianes del front pasan de W1–W23 a **W1–W27**: W24 son los manejadores en línea, W25 el diseño en el CSS, W26 las clases de los módulos CSS y W27 la api transversal. `CLAUDE.md` y `docs/convenciones.md` ya lo reflejan.
- No se tocó `reto-01/`.

---

_Corregido: 2026-10-16T20:36:49Z_
_Corrector: Claude (gsd-code-fixer)_
_Iteración: 1_
