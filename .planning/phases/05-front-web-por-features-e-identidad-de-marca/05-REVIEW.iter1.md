---
phase: 05-front-web-por-features-e-identidad-de-marca
reviewed: 2026-10-16T20:15:37Z
depth: standard
files_reviewed: 138
files_reviewed_list:
  - .claude/CLAUDE.md
  - .gitattributes
  - .qa/suites/03.suite.json
  - SOLUCION.md
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
  - web/src/app.tsx
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
  - web/src/features/archivos/dialogo-vista-previa/dialogo-vista-previa.module.css
  - web/src/features/archivos/dialogo-vista-previa/usar-dialogo-vista-previa.ts
  - web/src/features/archivos/estado/vista-previa.ts
  - web/src/features/archivos/lista-archivos/lista-archivos.module.css
  - web/src/features/archivos/lista-archivos/usar-lista-archivos.ts
  - web/src/features/casos/bloque-caso/bloque-caso.module.css
  - web/src/features/casos/bloque-caso/bloque-caso.tsx
  - web/src/features/casos/bloque-caso/usar-bloque-caso.ts
  - web/src/features/casos/estado/casos.ts
  - web/src/features/casos/panel-casos/panel-casos.module.css
  - web/src/features/casos/panel-casos/usar-panel-casos.ts
  - web/src/features/casos/tarjeta-resultado/tarjeta-resultado.module.css
  - web/src/features/casos/tarjeta-resultado/tarjeta-resultado.tsx
  - web/src/features/casos/tarjeta-resultado/usar-tarjeta-resultado.ts
  - web/src/features/chat/acciones-rapidas/acciones-rapidas.module.css
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
  warning: 6
  info: 10
  total: 16
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-10-16T20:15:37Z
**Depth:** standard
**Files Reviewed:** 138
**Status:** issues_found

## Summary

The review covered the new store (`web/src/store/*`), the per-feature hooks and views, the slices that moved to `features/*/estado`, the brand assets wiring (`index.html`, `vite.config.ts`, `tokens.css`, `global.css`), the guardians in `tests/arquitectura-web.test.ts` (W1–W23), and the DOM test harness.

I compared the store against the Phase 3 hooks it replaces (`usar-chat.ts`, `usar-salud.ts`, `usar-reintento-config.ts`, `app.tsx` at `3827d7c`) and found it faithful. The abort and identity guards in `refrescarSalud` and `iniciarTurno`/`detener` are preserved and behave correctly under StrictMode double effects. `useSeleccion` only receives stable or WeakMap-memoized selectors, and no promise chain can reject, because `pedir`, `leerJson` and `leerCuerpo` swallow errors into `SIN_RED`. Dialog state persisting across access loss matches the old `useState` in `App`. I found no `innerHTML`, no `any`, no access code persisted and no comments.

The findings are about single-source-of-truth violations that the user's "código muy muy limpio" bar and D-102/D-124 forbid:
- a copied business slug,
- a hardcoded slug in a string,
- brand constants that are not the real source.

There is also a misleading empty-state loading message when `/api/config` fails, view-level logic that W15 cannot see, and several guardian gaps where a violation would pass silently.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `CASO_DEMO_PRD` is a literal copy of the backend's `CASO_GUION_PRD` (D-124 single source violated, W23 blind to it)

**File:** `web/src/config/constants/ui.constants.ts:166`
**Issue:** `export const CASO_DEMO_PRD = "ec-corp-andina";` duplicates `src/config/constants/preflight.constants.ts:27` (`export const CASO_GUION_PRD = "ec-corp-andina";`). That file is pure config, and W3 explicitly allows the front to import `@/config/constants/**`. D-124 says business data from `src/config/constants/**` is never copied as a literal into `web/src`. If someone renames the demo case on the server (CLI preflight, demo script), the front's chip, placeholder, empty-state copy and card template keep pointing at the old slug. W23 does not catch this, because its hand-curated family list (`tests/arquitectura-web.test.ts:185-201`) has no entry for the PRD demo case.
**Fix:**
```ts
// web/src/config/constants/ui.constants.ts
import { CASO_GUION_PRD } from "@/config/constants/preflight.constants.ts";
export const CASO_DEMO_PRD = CASO_GUION_PRD;
```
Alternatively, import `CASO_GUION_PRD` directly where `CASO_DEMO_PRD` is used, and add the constant (or the whole preflight module) to W23's checked families.

### WR-02: The composer placeholder hardcodes the demo slug instead of deriving it from its constant

**File:** `web/src/config/strings.ts:88`
**Issue:** `placeholder: "Escribe una instrucción, por ejemplo: procesa el caso ec-corp-andina"` repeats the value of `CASO_DEMO_PRD`. CLAUDE.md says "Un texto que repite un dato se deriva de su constante" (code-review-only rule, no guardian). This phase rewrote `vacioCuerpo` in the same object to use `${CASO_DEMO_PRD}`, so the two now disagree about how the slug is sourced. Once WR-01 is fixed, the placeholder is the only copy left behind.
**Fix:**
```ts
placeholder: `Escribe una instrucción, por ejemplo: procesa el caso ${CASO_DEMO_PRD}`,
```

### WR-03: The empty state says "Cargando los casos…" forever when `/api/config` fails, and the status is not announced

**File:** `web/src/features/chat/estado-vacio/usar-estado-vacio.ts:29-30`, `web/src/features/chat/estado-vacio/estado-vacio.tsx:18-19`
**Issue:** `cargandoCasos: !configCargada` cannot tell "still loading" apart from "config failed". When `/api/config` returns 503 or the network drops, `accionDeConfig` dispatches `CONFIG_RECIBIDA` with `config: null`. Access becomes `CONCEDIDO`, `config` stays `null`, and the new empty state shows "Cargando los casos…" indefinitely. The only recovery is the background retry every 10 s or on tab focus (`useSincronizacion`), with no error, no retry affordance and no explanation. `tests/web/dom/app.test.tsx:225-245` encodes this behavior as correct. The `<p>` also lacks `role="status"`, unlike every other loader in the app (`lista-archivos`, `dialogo-vista-previa`, `pantalla-carga`), so screen-reader users get no signal when the cards replace it.
**Fix:** Expose a distinct state, for example `ESTADO_CASOS = { CARGANDO, SIN_CONFIG, LISTOS }`, derived from `acceso`/`config` plus a "config attempted" flag set when `CONFIG_RECIBIDA` arrives with `null`. Show a `TEXTO_ESTADO_VACIO.casosNoDisponibles` message for the failed case, and render the loading text with `role="status"`.

### WR-04: Views still carry behavior (inline handlers that build arguments and messages), and W15 cannot see it

**File:** `web/src/features/chat/compositor/compositor.tsx:36`, `web/src/features/confirmacion/tarjeta-confirmacion/tarjeta-confirmacion.tsx:86,95` (same pattern outside this batch: `linea-de-tiempo.tsx:27`, `lista-archivos.tsx:23`, `aviso-disco-efimero.tsx:18`)
**Issue:** D-100/D-102 say the `.tsx` view is presentation only and the logic lives in `usar-<c>.ts`. Several views still compute in JSX:
- `onChange={(evento) => alCambiar(evento.target.value)}` unpacks the event in the view.
- `onClick={() => responder(TIPO_ACCION.CONFIRMAR)}` and `onClick={() => responder(TIPO_ACCION.CANCELAR)}` choose the business action code in the view.
- `aviso-disco-efimero.tsx:18` builds the outgoing chat message (`TEXTO_DISCO.mensaje(caso)`), and that component has no hook at all.

W15 only inspects imports and W18 only checks numbers, `style=` and colors, so none of this is detected.
**Fix:** Have the hooks return ready-to-bind handlers, for example `alCambiarTexto(evento: ChangeEvent<HTMLTextAreaElement>)`, `alConfirmar` and `alCancelar` in `useTarjetaConfirmacion`, and `alProcesarDeNuevo` in a new `usar-aviso-disco-efimero.ts`. The views then bind only identifiers (`onClick={alConfirmar}`). Optionally, add a W rule that rejects arrow functions in JSX attributes of `VISTA` files.

### WR-05: The brand constants are not the source of truth; `index.html` and `global.css` hardcode the same values

**File:** `web/src/config/constants/marca.constants.ts:3,15-24`, `web/index.html:6-10`, `web/src/styles/global.css:6,16,26`
**Issue:** `RUTA_FAVICON`, `FUENTES_AUTOALOJADAS` and `LICENCIAS_DE_FUENTES` are never read by runtime code. Only `tests/web/marca.test.ts` imports them. The paths the browser actually uses are literal strings in `index.html` (favicon, two font preloads) and in the three `@font-face` `src:` URLs. `<meta name="theme-color" content="#063635">` duplicates `--marca` from `tokens.css`. `marca.test.ts` only checks that every URL it finds exists and that there are "more than 3" font URLs. It does not check that `global.css` uses exactly the constant's fonts or that the preloads match. A font rename that updates `global.css` and the file but not the constant (or the reverse) passes every test. This is a "constant" that is really a test fixture, which goes against "cero valores hardcodeados" (D-102).
**Fix:** Either make the constants the real source, or drop them and make the test assert equality against the files that are the source:
- Inject the favicon, preloads and theme color in the existing `titulo-del-documento` Vite plugin from `marca.constants.ts`.
- Or keep the constants and add `expect(new Set(fontsInGlobalCss)).toEqual(new Set(FUENTES))` plus the same for the preloads.

### WR-06: Guardian false negatives: violations that the W rules let through silently

**File:** `tests/arquitectura-web.test.ts:112,485-489` (W21), `:594-600` with `:264` (W16/W13), `:185-201` (W23)
**Issue:** I found three gaps:
1. **W21:** `SELECTOR_EN_LINEA` only rejects an arrow function written inline in `useSeleccion(...)`. Stability is only verified for the exports of `selectores.ts`. A hook that declares `const seleccionarX = (e: EstadoRaiz) => ({ ... })` locally and calls `useSeleccion(seleccionarX)` passes both checks, yet makes `useSyncExternalStore` loop. That is exactly the failure W21 exists to prevent.
2. **W16:** `puedeImportarLaApi` whitelists any file whose basename matches `usar-*.ts`, and W13 accepts `features/<f>/estado/usar-x.ts`, because `usar-x` is valid kebab-case. A reducer file named `usar-*.ts` inside `estado/` can therefore import `@web/api/*`, which D-122 forbids. W4 only checks React imports and browser globals, not `@web/api`.
3. **W23:** The family list is hand-maintained. Any new or omitted family (for example `CASO_GUION_PRD`, see WR-01) is unguarded. The docs claim that the excluded transport families are "covered by W22 comparisons", but W22 only flags comparisons, `case`, ternaries and returns, so an object literal such as `{ tipo: "fin_turno" }` copying a `TIPO_EVENTO` value is caught by neither rule.
**Fix:**
1. Make W21 require that `useSeleccion` receives an identifier imported from `@web/store/selectores.ts`, by resolving the import of the argument name.
2. Exclude `ESTADO_DE_FEATURE` paths from `puedeImportarLaApi`, or forbid `usar-` filenames under `estado/` in W13.
3. Build `CODIGOS_DE_NEGOCIO` by importing every module in `src/config/constants/*.constants.ts` (the same way `codigosDelFront` does for the front), with an explicit exclusion list instead of an inclusion list.

## Info

### IN-01: Dead code and test-only exports

**File:** `web/src/config/constants/ui.constants.ts:120`, `web/src/styles/global.css:91-95,112-114`, `web/src/config/strings.ts:55,178,273,445`
**Issue:** `CLASE_GLOBAL.TRANSICION` and the global `.transicion` rule are never applied. `TEXTO_RESULTADO.etiqueta` and `TEXTO_CONFIRMACION.etiqueta` are unused. `TEXTO_MODELO.estado` and `TEXTO_APP.fechaEjecucion` are only referenced by `tests/web/estado-del-modelo.test.ts`.
**Fix:** Delete them, or wire them to the component that was meant to use them.

### IN-02: `memoizarPorReferencia` treats a cached `undefined` as a miss

**File:** `web/src/store/selectores.ts:26-27`
**Issue:** `if (previo !== undefined) return previo;` recomputes forever for a derivation that legitimately returns `undefined`, and the generic `T` allows it.
**Fix:** `if (cache.has(origen)) return cache.get(origen) as T;`, or constrain `T` to exclude `undefined`.

### IN-03: `use*` names on functions that are not hooks, and a hook shared across component folders

**File:** `web/src/features/confirmacion/tarjeta-confirmacion/usar-tarjeta-confirmacion.ts:51`, `web/src/features/herramientas/tarjeta-herramienta/usar-tarjeta-herramienta.ts:6`, `web/src/features/archivos/lista-archivos/usar-lista-archivos.ts:13,71`
**Issue:** `usePilaConfirmaciones`, `useTarjetaHerramienta` and `useFilaArchivo` call no React hook, so the `use` prefix subjects them to the hook rules for no reason. `useArchivos` (which fetches the file list) lives in the `lista-archivos` folder but is consumed by `usar-bloque-caso.ts`. The folder has no `useListaArchivos`, which blurs the one-folder-one-component contract of D-100.
**Fix:** Rename the pure ones to plain derivations (for example `tarjetasEnPila`). Move `useArchivos` to the component that owns it, or give it its own folder/hook name.

### IN-04: The empty state hands focus over through a global DOM id

**File:** `web/src/features/chat/estado-vacio/usar-estado-vacio.ts:7-10`
**Issue:** `document.getElementById(ID_CAMPO_MENSAJE)?.focus()` couples the `estado-vacio` component to the compositor's DOM id (`ID_CAMPO_MENSAJE = "campo-mensaje"`) and bypasses React refs. It works, but it is invisible coupling between two components and depends on a single global id.
**Fix:** Expose a `enfocarCompositor` action or a ref registered by `useCompositor` through the store or Context, and call that.

### IN-05: The login flow passes a signal that can never be aborted

**File:** `web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts:41-42`
**Issue:** `await cargarConfig(new AbortController().signal)` creates a controller that nobody can abort. After a successful config load the screen unmounts, and `cambiarPendiente(false)` then runs on an unmounted component. This is harmless in React 19, but it is noise.
**Fix:** Make the signal optional in `Acciones.cargarConfig`, or keep a ref'd controller that is aborted on unmount, and skip the state update once access is granted.

### IN-06: The document title is written twice

**File:** `web/src/main.tsx:11`, `web/vite.config.ts:27-33`
**Issue:** The Vite plugin already injects `TEXTO_APP.tituloDocumento` into `<title>` at build and dev time, and `main.tsx` sets `document.title` again at runtime.
**Fix:** Remove the runtime assignment (or the plugin) so there is one mechanism.

### IN-07: Layout breakpoints and the layout code are duplicated in CSS, in a different unit

**File:** `web/src/features/acceso/pantalla-acceso/pantalla-acceso.module.css` and `web/src/features/acceso/pantalla-carga/pantalla-carga.module.css` (`@media (min-width: 40em)`), `web/src/features/chat/tarjeta-caso/tarjeta-caso.module.css:140-183` (`[data-diseno="angosto"]`)
**Issue:**
- `40em` mirrors `PUNTO_DE_QUIEBRE_PX.MEDIO = 640`. JS uses `(min-width: 640px)`. An `em` media query scales with the user's default font size, so with a non-16 px browser default the two diverge.
- `"angosto"` duplicates `DISENO.ANGOSTO`.

W12 deliberately exempts `@media` lines, so nothing checks this.
**Fix:** Use `640px` to match the JS query exactly. Add a test asserting that every `@media (min-width: …)` in `web/src` equals a `CONSULTA_DE_ANCHO` value, and that every `data-diseno` selector value belongs to `DISENO`.

### IN-08: `LogoMarca` can render `class="… undefined"`

**File:** `web/src/compartido/logo-marca/logo-marca.tsx:6-10,15`
**Issue:** `CLASE_POR_VARIANTE` is typed `string | undefined`, because CSS-module keys are `string | undefined` under `noUncheckedIndexedAccess`. A missing class silently produces the literal class `undefined`. The same pattern exists in the `CLASE_DE_*` maps.
**Fix:** Filter falsy parts (`[estilos.logo, CLASE_POR_VARIANTE[variante]].filter(Boolean).join(" ")`), or add a test that each mapped class exists in the module.

### IN-09: Timing sleeps in the DOM tests

**File:** `tests/web/dom/app.test.tsx:132,172,237,268,321`
**Issue:** `await Bun.sleep(PAUSA_TRAS_SOLTAR_MS)` (30 ms) inside `act` waits for the SSE stream to drain. The `findBy*` that follows already polls, so the sleep only adds wall-clock dependence and is a potential flake on a slow CI runner.
**Fix:** Drop the sleep and rely on `await act(async () => red.soltar())` plus `findBy*`/`waitFor`.

### IN-10: Small structure and documentation drift

**File:** `.claude/CLAUDE.md:242`, `web/src/api/cliente-api.ts:9`
**Issue:**
- CLAUDE.md describes `compartido/` as "`aviso` e `iconos`", but `compartido/logo-marca` now exists.
- The cross-cutting `api/` layer imports `@web/features/sesion/estado/hidratacion.ts` (`sigueOcupada`), so the transversal layer depends on a feature, the reverse of D-122's direction. This was carried over from `state/`.
**Fix:**
- Add `logo-marca` to the CLAUDE.md description.
- Move `sigueOcupada` into `api/` (it only inspects the API result), or into a shared non-feature module.

---

_Reviewed: 2026-10-16T20:15:37Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
