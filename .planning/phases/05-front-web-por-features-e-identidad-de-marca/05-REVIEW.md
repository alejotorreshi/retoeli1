---
phase: 05-front-web-por-features-e-identidad-de-marca
reviewed: 2026-10-16T21:21:46Z
depth: standard
iteration: 2
files_reviewed: 152
files_reviewed_list:
  - .claude/CLAUDE.md
  - .qa/suites/03.suite.json
  - SOLUCION.md
  - docs/arquitectura.md
  - docs/convenciones.md
  - docs/estructura.md
  - package.json
  - src/config/strings.ts
  - tests/architecture.test.ts
  - tests/arquitectura-web.test.ts
  - tests/docs/solucion.test.ts
  - tests/globales-nativos.test.ts
  - tests/helpers/app-dom.helper.ts
  - tests/helpers/dom.helper.ts
  - tests/helpers/red-web.helper.ts
  - tests/helpers/types/dom.type.ts
  - tests/helpers/types/red-web.type.ts
  - tests/http/estatico.test.ts
  - tests/sin-comentarios.test.ts
  - tests/web/acciones-rapidas.test.ts
  - tests/web/archivos.test.ts
  - tests/web/confirmaciones.test.ts
  - tests/web/conversacion.test.ts
  - tests/web/dom/app-acceso.test.tsx
  - tests/web/dom/app-angosto.test.tsx
  - tests/web/dom/app-panel.test.tsx
  - tests/web/dom/app.test.tsx
  - tests/web/estado-del-modelo.test.ts
  - tests/web/herramientas.test.ts
  - tests/web/hidratacion.test.ts
  - tests/web/marca.test.ts
  - tests/web/pestanas.test.ts
  - tests/web/progreso.test.ts
  - tests/web/seguimiento.test.ts
  - tests/web/store/acciones.test.ts
  - tests/web/store/almacen.test.ts
  - tests/web/store/app-con-almacen.test.tsx
  - tests/web/store/selectores.test.ts
  - tests/web/store/slices.test.ts
  - tests/web/tarjeta-caso.test.ts
  - tsconfig.dom.json
  - tsconfig.json
  - web/index.html
  - web/src/api/cliente-api.ts
  - web/src/api/descarga-local.ts
  - web/src/api/flujo-chat.ts
  - web/src/api/sesion-local.ts
  - web/src/app.tsx
  - web/src/compartido/aviso/aviso.module.css
  - web/src/compartido/aviso/aviso.tsx
  - web/src/compartido/iconos/iconos.tsx
  - web/src/compartido/logo-marca/logo-marca.module.css
  - web/src/compartido/logo-marca/logo-marca.tsx
  - web/src/config/constants/marca.constants.ts
  - web/src/config/constants/pais.constants.ts
  - web/src/config/constants/ui.constants.ts
  - web/src/config/strings.ts
  - web/src/features/acceso/pantalla-acceso/pantalla-acceso.module.css
  - web/src/features/acceso/pantalla-acceso/pantalla-acceso.tsx
  - web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts
  - web/src/features/acceso/pantalla-carga/pantalla-carga.module.css
  - web/src/features/acceso/pantalla-carga/pantalla-carga.tsx
  - web/src/features/archivos/aviso-disco-efimero/aviso-disco-efimero.module.css
  - web/src/features/archivos/aviso-disco-efimero/aviso-disco-efimero.tsx
  - web/src/features/archivos/aviso-disco-efimero/usar-aviso-disco-efimero.ts
  - web/src/features/archivos/dialogo-vista-previa/dialogo-vista-previa.module.css
  - web/src/features/archivos/dialogo-vista-previa/dialogo-vista-previa.tsx
  - web/src/features/archivos/dialogo-vista-previa/usar-dialogo-vista-previa.ts
  - web/src/features/archivos/estado/vista-previa.ts
  - web/src/features/archivos/lista-archivos/lista-archivos.module.css
  - web/src/features/archivos/lista-archivos/lista-archivos.tsx
  - web/src/features/archivos/lista-archivos/usar-lista-archivos.ts
  - web/src/features/casos/bloque-caso/bloque-caso.module.css
  - web/src/features/casos/bloque-caso/bloque-caso.tsx
  - web/src/features/casos/bloque-caso/usar-bloque-caso.ts
  - web/src/features/casos/estado/casos.ts
  - web/src/features/casos/panel-casos/panel-casos.module.css
  - web/src/features/casos/panel-casos/panel-casos.tsx
  - web/src/features/casos/panel-casos/usar-panel-casos.ts
  - web/src/features/casos/progreso-caso/progreso-caso.module.css
  - web/src/features/casos/progreso-caso/progreso-caso.tsx
  - web/src/features/casos/tarjeta-resultado/tarjeta-resultado.module.css
  - web/src/features/casos/tarjeta-resultado/tarjeta-resultado.tsx
  - web/src/features/casos/tarjeta-resultado/usar-tarjeta-resultado.ts
  - web/src/features/chat/acciones-rapidas/acciones-rapidas.module.css
  - web/src/features/chat/acciones-rapidas/acciones-rapidas.tsx
  - web/src/features/chat/acciones-rapidas/usar-acciones-rapidas.ts
  - web/src/features/chat/compositor/compositor.module.css
  - web/src/features/chat/compositor/compositor.tsx
  - web/src/features/chat/compositor/usar-compositor.ts
  - web/src/features/chat/estado-vacio/estado-vacio.module.css
  - web/src/features/chat/estado-vacio/estado-vacio.tsx
  - web/src/features/chat/estado-vacio/usar-estado-vacio.ts
  - web/src/features/chat/estado/conversacion.ts
  - web/src/features/chat/estado/seguimiento.ts
  - web/src/features/chat/estado/tarjeta-caso.ts
  - web/src/features/chat/indicador-pensando/indicador-pensando.module.css
  - web/src/features/chat/indicador-pensando/indicador-pensando.tsx
  - web/src/features/chat/indicador-pensando/usar-indicador-pensando.ts
  - web/src/features/chat/linea-de-tiempo/linea-de-tiempo.module.css
  - web/src/features/chat/linea-de-tiempo/linea-de-tiempo.tsx
  - web/src/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts
  - web/src/features/chat/mensaje/mensaje.module.css
  - web/src/features/chat/mensaje/mensaje.tsx
  - web/src/features/chat/tarjeta-caso/tarjeta-caso.module.css
  - web/src/features/chat/tarjeta-caso/tarjeta-caso.tsx
  - web/src/features/chat/tarjeta-caso/usar-tarjeta-caso.ts
  - web/src/features/confirmacion/estado/confirmaciones.ts
  - web/src/features/confirmacion/tarjeta-confirmacion/tarjeta-confirmacion.module.css
  - web/src/features/confirmacion/tarjeta-confirmacion/tarjeta-confirmacion.tsx
  - web/src/features/confirmacion/tarjeta-confirmacion/usar-tarjeta-confirmacion.ts
  - web/src/features/disposicion/barra-pestanas/barra-pestanas.module.css
  - web/src/features/disposicion/barra-pestanas/barra-pestanas.tsx
  - web/src/features/disposicion/barra-pestanas/usar-barra-pestanas.ts
  - web/src/features/disposicion/columnas/columnas.module.css
  - web/src/features/disposicion/columnas/columnas.tsx
  - web/src/features/disposicion/columnas/usar-columnas.ts
  - web/src/features/disposicion/estado/pestanas.ts
  - web/src/features/encabezado/aviso-modelo/aviso-modelo.module.css
  - web/src/features/encabezado/aviso-modelo/aviso-modelo.tsx
  - web/src/features/encabezado/aviso-modelo/usar-aviso-modelo.ts
  - web/src/features/encabezado/encabezado/encabezado.module.css
  - web/src/features/encabezado/encabezado/encabezado.tsx
  - web/src/features/encabezado/encabezado/usar-encabezado.ts
  - web/src/features/encabezado/estado/modelo.ts
  - web/src/features/encabezado/estado/salud.ts
  - web/src/features/herramientas/grupo-herramientas/grupo-herramientas.module.css
  - web/src/features/herramientas/grupo-herramientas/grupo-herramientas.tsx
  - web/src/features/herramientas/grupo-herramientas/usar-grupo-herramientas.ts
  - web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.module.css
  - web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx
  - web/src/features/herramientas/tarjeta-herramienta/usar-tarjeta-herramienta.ts
  - web/src/features/sesion/dialogo-nueva-sesion/dialogo-nueva-sesion.module.css
  - web/src/features/sesion/dialogo-nueva-sesion/dialogo-nueva-sesion.tsx
  - web/src/features/sesion/dialogo-nueva-sesion/usar-dialogo-nueva-sesion.ts
  - web/src/features/sesion/estado/dialogo-sesion.ts
  - web/src/features/sesion/estado/hidratacion.ts
  - web/src/main.tsx
  - web/src/store/acciones.ts
  - web/src/store/almacen.ts
  - web/src/store/dependencias.ts
  - web/src/store/instancia.ts
  - web/src/store/proveedor-almacen.tsx
  - web/src/store/raiz.ts
  - web/src/store/selectores.ts
  - web/src/store/usar-almacen.ts
  - web/src/styles/global.css
  - web/src/styles/tokens.css
  - web/src/types/chat.type.ts
  - web/src/types/store.type.ts
  - web/src/types/ui.type.ts
  - web/vite.config.ts
findings:
  critical: 0
  warning: 2
  info: 10
  total: 12
status: issues_found
---

# Phase 5: Code Review Report (iteration 2)

**Reviewed:** 2026-10-16T21:21:46Z
**Depth:** standard
**Files Reviewed:** 152
**Status:** issues_found

## Summary

This pass re-reviewed every `.ts`/`.tsx` file under `web/src` line by line. That includes the 14 files the first iteration skipped:
- `api/{descarga-local,flujo-chat,sesion-local}.ts`
- `compartido/aviso/*`
- `features/archivos/{aviso-disco-efimero,dialogo-vista-previa,lista-archivos}`
- `features/casos/{panel-casos,progreso-caso}`
- `features/chat/{acciones-rapidas,linea-de-tiempo}`

I also covered the store, the slices, the strings and constants, `index.html`, `vite.config.ts`, `global.css`/`tokens.css`, and the guardian implementations W21–W27 in `tests/arquitectura-web.test.ts`. I only spot-checked the CSS modules and the test suites, relying on W12/W18/W25/W26 for the CSS and checking the tests for reliability only.

**Iteration-1 fixes (4db7d61..2169bcc): all 16 are correct, and none caused a regression in behavior.**
- WR-01/WR-02: `CASO_GUION_PRD` is the only source.
- WR-03: the access state only becomes `CONCEDIDO` through `CONFIG_RECIBIDA`, so `faltaConfig` inside the empty state really does mean that config failed.
- WR-04: handlers are bound by name, and W24 is green.
- WR-05: font, favicon and theme-color are tied to their source files.
- WR-06: W21 checks import provenance, W16 uses `HOOK_EN_SU_CARPETA`, and W23 derives its family list.
- IN-02: the cache is wrapped.
- IN-04: the focus ref goes through the store.
- IN-05: the abort happens on unmount, and `cambiarPendiente` is skipped after unmount.
- IN-06: the title is written once.
- IN-07 to IN-10: verified.

The only side effect is cosmetic: the IN-04 fix left a dead `id` on the composer textarea (IN-01 below).

The new findings:
- One real UX bug: a preview modal lives inside a `<details>` that collapses on its own.
- One guardian gap: W24 and the store-primitive rule are easy to slip past.
- Ten info-level cleanliness items, in line with the "código muy muy limpio" bar.

There are no security issues. I found no `innerHTML`, no `any`, no comments, no persisted access code and no literal business codes.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The file-preview modal lives inside an auto-collapsing `<details>`, so it can vanish while the page stays inert

**File:** `web/src/features/casos/bloque-caso/bloque-caso.tsx:24-49`, `web/src/features/casos/bloque-caso/usar-bloque-caso.ts:29-31`, `web/src/features/casos/panel-casos/usar-panel-casos.ts:17-22`
**Issue:** `DialogoVistaPrevia` is rendered inside `<details open={abierto}>`, and `useBloqueCaso` forces `abierto` to follow `reciente` (`useEffect(() => setAbierto(reciente), [reciente])`). `reciente` is `indice === 0` in `usePanelCasos`, so it flips to `false` for this block whenever another case gets tool activity. That happens all the time during "Procesar los 4 casos", which is exactly when someone opens a preview while the agent works through the other cases. The sequence:
1. The user opens a preview for case A (`showModal()`, so the page becomes inert).
2. The agent touches case B, and A's `<details>` collapses under the open modal.
3. In browsers that do not render the content of a closed `<details>`, the top-layer dialog disappears while the rest of the page stays inert. Focus sits on the now-unrendered "Cerrar vista previa" button. Only Escape (a close request) recovers.

The same collapse also sets `activo=false` on `useListaArchivos`, which aborts the list fetch the user was looking at.
**Fix:** Render the dialog outside the `<details>` (as a sibling inside the `<li>`), and do not auto-collapse a block that is showing a preview. For example, only sync on a rising edge:
```tsx
<li className={estilos.bloque}>
  <details open={abierto} onToggle={alAlternar}>…</details>
  <DialogoVistaPrevia … />
</li>
```
```ts
const [recienteVisto, setRecienteVisto] = useState(reciente);
if (reciente !== recienteVisto) {
  setRecienteVisto(reciente);
  if (reciente || vistaPrevia === null) setAbierto(reciente);
}
```

### WR-02: Guardian false negatives in W24 and in the store-primitive rule

**File:** `tests/arquitectura-web.test.ts:230-231` (W24 `FUNCION_EN_ATRIBUTO`), `:233` with `:834-850` (`IMPORTACION_DE_REACT`/`violacionesDePrimitivasDelAlmacen`), `:65` (`API_DEL_NAVEGADOR`)
**Issue:** The new rules only recognize one written shape each, so equivalent code passes silently:
1. **W24:** The regex requires the function to start immediately after `={`, on the same line. These all declare a function in a view's JSX and pass:
   - `onClick={cerrado ? () => abrir() : undefined}`
   - `onClick={\n  () => abrir()\n}`
   - `onChange={(\n  evento,\n) => …}`, which is how Biome wraps long parameter lists.
   - `onClick={responder.bind(null, TIPO_ACCION.CONFIRMAR)}`

   The negative sample at `:1488-1506` covers none of these.
2. **Store primitives:** `IMPORTACION_DE_REACT` only matches named imports `import { … } from "react"`. With `import * as React from "react"` followed by `React.useSyncExternalStore(...)`, or a default import, a feature hook can build its own store and the rule never fires.
3. **Pure state (W4):** `API_DEL_NAVEGADOR` lists `document|window|localStorage|sessionStorage|fetch`. A reducer in `features/*/estado/` can still call `matchMedia`, `ResizeObserver`, `navigator`, `setTimeout` or `URL.createObjectURL` and stay "pure" for the guardian.

**Fix:**
1. For W24, run the check on the JSX attribute expression instead of the line. Strip strings, join the file, and match `\b[\w-]+=\{[^{}]*?(?:=>|\bfunction\b|\.bind\()`. Add the four shapes above to the negative sample.
2. Reject `import * as X from "react"` and default React imports outside `store/`, or scan for `\buseSyncExternalStore\b|\bcreateContext\b` usages instead of import names.
3. Extend `API_DEL_NAVEGADOR` with `matchMedia|ResizeObserver|navigator|globalThis|setTimeout|setInterval|URL\.createObjectURL`. Then add a negative-sample line for each new name.

## Info

### IN-01: Dead `id` on the composer textarea (left behind by the iteration-1 IN-04 fix)

**File:** `web/src/features/chat/compositor/compositor.tsx:30`, `web/src/features/chat/compositor/usar-compositor.ts:36,58`, `web/src/types/ui.type.ts:319`
**Issue:** `ID_CAMPO_MENSAJE` used to be the target of `getElementById`. After the fix, focus goes through `registrarCampoDelMensaje`, and the textarea is named by `aria-label`, so nothing references `id={idCampo}`: no `<label htmlFor>`, no `aria-*` and no test. The `useId()`, the `idCampo` field of `ControlCompositor` and the attribute are dead.
**Fix:** Remove `idCampo` from the hook, the type and the view.

### IN-02: The case-card data shape is redundant, and `ControlTarjetaCaso.slug` is never read

**File:** `web/src/features/chat/estado/tarjeta-caso.ts:23-34`, `web/src/features/chat/tarjeta-caso/usar-tarjeta-caso.ts:7-26`, `web/src/types/ui.type.ts:500-524`
**Issue:**
- `DatosTarjetaCaso` carries `slug`, `pais`, `codigo` (`pais.toUpperCase()`) and `nombrePais`. The hook ignores `slug` and `pais` and rebuilds the same information as `PaisDeTarjeta` through `paisDe(codigo, nombrePais)`.
- `ControlTarjetaCaso.slug` is returned but `TarjetaCaso` reads the `slug` prop instead.
- The result is three overlapping shapes for one concept.

**Fix:** Have `datosDeTarjetaCaso` return `{ cliente, pais: PaisDeTarjeta | null }`, and delete `paisDe`, `DatosTarjetaCaso.slug`/`pais`/`codigo`/`nombrePais` and `ControlTarjetaCaso.slug`. Then update `tests/web/tarjeta-caso.test.ts`.

### IN-03: The preview dialog keeps the previous file's content across close and reopen

**File:** `web/src/features/archivos/dialogo-vista-previa/usar-dialogo-vista-previa.ts:21-49`
**Issue:** `estado` is only reset to `CARGANDO` inside the fetch effect, after the open effect has already run `showModal()`. Reopening for a different file commits a render with the new title over the old table or error, then resets it. Because the reset is a state update scheduled from a passive effect, the browser can paint that mismatched frame. The previous file's masked values or error would then flash under the new file name. Between opens, the hook also holds a stale `LISTA` for a file that is no longer shown.
**Fix:** Reset when the dialog closes, or key the state by file so a mismatch reads as loading:
```ts
const [vista, setVista] = useState<{ nombre: string; estado: EstadoVistaPrevia } | null>(null);
const estado = vista !== null && vista.nombre === abierta?.archivo.nombre ? vista.estado : VISTA_CARGANDO;
```

### IN-04: Props are mirrored into state through effects (extra render with stale UI)

**File:** `web/src/features/casos/bloque-caso/usar-bloque-caso.ts:29-31`, `web/src/features/herramientas/grupo-herramientas/usar-grupo-herramientas.ts:14-16`, `web/src/features/disposicion/columnas/usar-columnas.ts:35-37`
**Issue:** Three hooks copy a derived value into state with `useEffect(() => setX(prop), [prop])`. Each change paints once with the old state and then re-renders. React documents this as the "adjust state on prop change" anti-pattern. In `useBloqueCaso` it also overrides a block the user opened by hand (see WR-01).
**Fix:** Use the during-render adjustment (`if (prop !== previo) { setPrevio(prop); setX(…) }`), or derive the value directly. For example, `cambiosSinVer` can compare against a `firmaVista` that is updated in the tab-selection handler.

### IN-05: Icon switches are not exhaustive, unlike the class maps next to them

**File:** `web/src/features/casos/progreso-caso/progreso-caso.tsx:23-46`, `web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx:21-47`, `web/src/features/encabezado/aviso-modelo/aviso-modelo.tsx:8-11`
**Issue:** `IconoDeEtapa` maps `PENDIENTE` through `default:`, and `IconoDeEstado` maps `ERROR` through `default:`. A new `ESTADO_ETAPA`/`ESTADO_HERRAMIENTA` member would silently get the pending or error icon, while the sibling `CLASE_DE_ESTADO` maps fail to compile thanks to `satisfies Record<…>`. In `aviso-modelo.tsx`, `CLASE_DE_TONO` is the only class map in the front without `satisfies Record<…, string | undefined>`.
**Fix:** Replace the switches with `ICONO_DE_ESTADO = { … } as const satisfies Record<EstadoEtapa, () => JSX.Element>` (or list every `case` and drop `default`). Add `satisfies Record<ValorDe<typeof TONO_DEL_MODELO>…>` to the `aviso-modelo` map.

### IN-06: Views still make decisions that belong in their hooks

**File:** `web/src/features/chat/acciones-rapidas/acciones-rapidas.tsx:15,18,23-24,27`, `web/src/features/casos/tarjeta-resultado/tarjeta-resultado.tsx:65,67`, `web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx:64,77`, `web/src/features/encabezado/encabezado/encabezado.tsx:34`, `web/src/features/archivos/lista-archivos/lista-archivos.tsx:68`
**Issue:** D-100/D-102 put the logic in `usar-<c>.ts`, and W24 now covers functions, but several views still compute rules:
- `disabled={deshabilitadas || cantidadCasos === 0}` (an enablement rule) and three `corta ? … : …` label choices.
- `paqueteArmado ? resultado.bloqueosLegibles : null` (whether blockers are meaningful).
- `fallida && llamada.codigo !== null` and `llamada.resumen ?? ""`.
- `angosto ? VARIANTE_LOGO.ENCABEZADO_ANGOSTO : VARIANTE_LOGO.ENCABEZADO`. The same hook already derives `clasePrefijo` from `angosto`, so half the `angosto` logic is in the hook and half in the view.
- `estado.archivos.length === 0` to pick the empty message.

**Fix:** Return ready values from the hooks: `todosDeshabilitado`, `textoDemo`/`etiquetaDemo`, `bloqueosVisibles`, `codigoVisible`, `varianteLogo` and `vacia`. The views then only bind them.

### IN-07: Quick actions and the "procesar de nuevo" chip stay enabled during hydration, and their clicks are silently dropped

**File:** `web/src/store/selectores.ts:126-128`, `web/src/store/acciones.ts:66`
**Issue:** `seleccionarEnvioDeshabilitado` is `enCurso || envioEnPausa`, but `iniciarTurno` also refuses while `hidratando`. After Detener (`detenerTurno` sets `hidratando: true`) or Recargar, the compact chips (`Columnas` with `conHistorial`) and the `AvisoDiscoEfimero` chip look enabled, yet clicking them does nothing and gives no feedback. The composer is correctly disabled, because `useCompositor` adds `seleccionarHidratando`. This looks carried over from Phase 3, but the store now makes it a one-line fix.
**Fix:** `return estado.conversacion.enCurso || estado.conversacion.hidratando || seleccionarEnvioEnPausa(estado);`. Then add a slice or selector test for it.

### IN-08: A login that succeeds, followed by a 401 on `/api/config`, fails silently

**File:** `web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts:40-47`, `web/src/features/chat/estado/conversacion.ts:83-84`
**Issue:** After `entrar` returns OK, the hook clears the code and the error and calls `cargarConfig`. If config answers 401 (for example, the access cookie was not stored), `accionDeConfig` maps it to `ACCESO_PEDIDO` with `aviso: null` and drops the server's `mensaje`. The access screen stays with an empty field, no error and no aviso, so the user just retries forever.
**Fix:** Keep the message: `{ tipo: ACCION_UI.ACCESO_PEDIDO, aviso: resultado.mensaje }`. Do this at least for the post-login path, or have `cargarConfig` return the result so the hook can `cambiarError(...)`.

### IN-09: The root id and the global classes are copied by hand, and a mismatch fails silently

**File:** `web/src/config/constants/ui.constants.ts:79,115-118`, `web/index.html:14`, `web/src/styles/global.css:53,59,79,91,106`, `web/src/main.tsx:12-19`
**Issue:**
- `ID_RAIZ = "root"` is repeated as `<div id="root">` and as `#root` in `global.css`. If they ever diverge, `main.tsx` skips rendering (`if (raiz !== null)`) and the user sees a blank page with no error.
- `CLASE_GLOBAL.OCULTO`/`GIRAR` (`"sr-only"`, `"girar"`) must match `global.css`. W26 only checks CSS modules, so renaming `.sr-only` would silently turn every screen-reader-only label visible.
- WR-05 of iteration 1 tied theme-color and fonts to their sources but not these.

**Fix:** Throw when the root is missing (`if (raiz === null) throw new Error(...)`, with the text in `strings.ts`). In `marca.test.ts`, assert that `index.html` contains `id="${ID_RAIZ}"` and that `global.css` defines `#${ID_RAIZ}` and `.${clase}` for every `CLASE_GLOBAL` value.

### IN-10: Hook API churn and inconsistency in the small `control*` helpers

**File:** `web/src/features/disposicion/barra-pestanas/usar-barra-pestanas.ts:17-28`, `web/src/features/archivos/lista-archivos/usar-lista-archivos.ts:76-81`
**Issue:**
- `useBarraPestanas` builds a new `registrar` ref callback for every tab on every render. In React 19 a changed callback ref is detached (`null`) and re-attached on each commit, so the `botones` map is rewritten on every render.
- `controlFilaArchivo(caso, archivo, alVer, alDescargar)` takes four positional arguments. Its siblings take the props object: `controlAvisoDiscoEfimero(props)`, `useTarjetaConfirmacion(props)` and `useBarraPestanas(props)`.

**Fix:**
- Memoize the per-tab ref callbacks once, for example with `useMemo` over `ORDEN_PESTANAS` or a single `useCallback((pestana) => (boton) => …)` cached in a `Map`.
- Make `controlFilaArchivo` take `PropsFilaArchivo`, as the other helpers do.

---

_Reviewed: 2026-10-16T21:21:46Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
