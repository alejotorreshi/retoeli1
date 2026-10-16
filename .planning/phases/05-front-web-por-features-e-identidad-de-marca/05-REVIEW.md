---
phase: 05-front-web-por-features-e-identidad-de-marca
reviewed: 2026-10-16T21:41:52Z
depth: standard
iteration: 3
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
  warning: 0
  info: 5
  total: 5
status: issues_found
---

# Phase 5: Code Review Report (iteration 3)

**Reviewed:** 2026-10-16T21:41:52Z
**Depth:** standard
**Files Reviewed:** 152
**Status:** issues_found

## Summary

This iteration re-reviews the phase scope after the iteration-2 fixes (commits `b235fff`..`6a9d4e2`). The 41 files those fixes touched were read line by line first. Then the rest of the scope was checked for regressions and leftovers. I independently re-ran the gates: `bun run check` (tsc ×3 + Biome, 516 files, clean) and `bun test tests/web tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts` (483 pass, 0 fail).

All 12 iteration-2 fixes are correct, and none of them introduced a regression:
- **WR-01:** The dialog is now a sibling of `<details>`. The render-phase `recienteVisto` adjustment converges and does not loop. The list stays `activo` while a preview is open.
- **WR-02:** The new W24 regex is global and multi-line and tolerates `>=`/`<=`. W20 now matches primitive uses, not import names. W4 has a wider list.
- **IN-03:** The preview state is keyed by the `VistaPreviaAbierta` identity. `alNoEncontrado` (`useCallback([])`) and `vencerAcceso` are stable, so the fetch effect does not refire on every block re-render.
- **IN-04:** All three render-phase adjustments are guarded and terminate.
- **IN-05:** The icon and class maps are exhaustive and checked with `satisfies`.
- **IN-07:** Confirmation cards are not affected. The timeline replaces the turns with the loading indicator while `hidratando`, so there is nothing to click.
- **IN-09:** `main.tsx` fails loudly.
- **IN-10:** The ref callbacks are stable.

There are no critical or warning findings. Five info-level items remain:
- one design wart introduced by the IN-08 fix;
- one duplicated "can send" rule that IN-07 made visible;
- two remaining guardian gaps in the rules that WR-02 widened;
- one duplication that the IN-05 fix moved but kept.

Already-fixed items from iterations 1–2 are not re-reported.

## Narrative Findings (AI reviewer)

## Info

### IN-01: The IN-08 fix opens a second channel for the 401 message and marks a code the server just accepted as invalid

**File:** `web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts:21-23,50-55`, `web/src/store/acciones.ts:104-108`, `web/src/types/store.type.ts:73`, `web/src/features/chat/estado/conversacion.ts:83-84`
**Issue:** The store already has a channel for "access needed, with a reason":
- `ACCESO_PEDIDO.aviso` is rendered by `PantallaAcceso` as `AvisoSistema` (`pantalla-acceso.tsx:34`).
- `vencerAcceso(mensaje)` (`acciones.ts:158`) and the hydration 401 (`hidratacion.ts:107`) both use it.

The fix does not route the post-login 401 through that channel. It does three things instead:
- It widens `Acciones.cargarConfig` to return the `ResultadoApi`.
- It adds a local `avisoTrasEntrar` mapper.
- It writes the server text into the field error, with `aria-invalid="true"`.

So the same server message (`MENSAJE_HTTP.accesoVencido`) now shows on two surfaces, depending on which request got the 401. In this path it also tells assistive tech that the code is wrong, but `POST /api/acceso` just answered 204. Retyping a correct code cannot fix a cookie the browser discards, so the user is pointed back at the field in a loop.
**Fix:** Reuse the existing action, and revert the signature change:
```ts
const resultado = await cargarConfig(controlador.signal);
if (controlador.signal.aborted) return;
cambiarPendiente(false);
if (resultado.tipo === RESULTADO_API.ACCESO_VENCIDO) vencerAcceso(resultado.mensaje);
```
If you keep `cargarConfig` returning `void`, `accionDeConfig` can carry the message (`aviso: resultado.mensaje`) only for the post-login call, for example through a dedicated `entrarYCargarConfig` action. Then drop `avisoTrasEntrar`, the field `aria-invalid` for this case, and the `campo.current?.focus()` hand-back. Update `app-acceso.test.tsx` to assert the `AvisoSistema` text instead of `aria-invalid`.

### IN-02: The composer re-derives the "can send" rule instead of reading `seleccionarEnvioDeshabilitado`

**File:** `web/src/features/chat/compositor/usar-compositor.ts:31-33,39,52`, `web/src/store/selectores.ts:126-128`
**Issue:** The IN-07 fix made `seleccionarEnvioDeshabilitado` the single definition, `enCurso || hidratando || envioEnPausa`. The chips, the case cards and the panel all read it. The composer still builds the same predicate from three separate selectors: `bloqueado || pausado` at line 39 and `!enCurso && !deshabilitado` at line 52. If the rule ever gains a fourth condition, the keyboard submit path and the selector drift apart silently. That is the class of bug IN-07 just fixed for the chips.
**Fix:** Read `const envioDeshabilitado = useSeleccion(seleccionarEnvioDeshabilitado);` and use it in `alPresionarTecla` (`if (!envioDeshabilitado) evento.currentTarget.form?.requestSubmit();`). Keep `deshabilitado` (`hidratando || pausado`) only for the textarea and the submit button, which are legitimately separate from `enCurso`. A `seleccionarCampoBloqueado` selector next to the other one would make that split explicit too.

### IN-03: W20 still lets a feature read the store context through React 19 `use(ContextoAlmacen)`

**File:** `tests/arquitectura-web.test.ts:233-240,837-850`, `web/src/store/usar-almacen.ts:15`
**Issue:** W20 now matches every use of `createContext`, `useContext`, `useReducer` and `useSyncExternalStore`. On React 19.3, `use(Contexto)` reads a context without any of those names, and `ContextoAlmacen` is a public export of `web/src/store/usar-almacen.ts`. So a feature hook can still do the following and pass every guardian:

```ts
import { use } from "react";
import { ContextoAlmacen } from "@web/store/usar-almacen.ts";
```

That hook bypasses `useSeleccion` and `useAcciones` and gets the whole `InstanciaAlmacen` (`almacen.despachar`, raw state). This is the "second source of truth" that D-101/W20 exist to prevent. The only importer outside `usar-almacen.ts` is `store/proveedor-almacen.tsx`.
**Fix:** Add a W20 clause, with a negative sample, so that `ContextoAlmacen` is imported only under `web/src/store/`. Alternatively, move the `createContext` call into `proveedor-almacen.tsx` and expose only `ProveedorAlmacen`, `useSeleccion` and `useAcciones`, so the context object never leaves the store module.

### IN-04: W4 is still a denylist, and it misses the impurities that matter most for pure reducers

**File:** `tests/arquitectura-web.test.ts:65-66`, `docs/convenciones.md` (W4 row), `.claude/CLAUDE.md:242`
**Issue:** The documented rationale for W4 is "Los reductores son puros y se prueban sin DOM". The widened list covers DOM and timer globals. It still lets through these clock, randomness and I/O sources:
- `Date.now()` / `new Date()`
- `Math.random()`
- `crypto`
- `performance`
- `location`, `history`
- `XMLHttpRequest`, `WebSocket`, `EventSource`
- `queueMicrotask`

The first two break reducer determinism the same way `setTimeout` does. The project rules already require an injected clock for that reason (CLAUDE.md, "Domain code should take an injected `Clock` port"). The current `estado/` code and the store core use none of them (verified by grep), so this is a guardian gap, not a live defect.
**Fix:** Extend `API_DEL_NAVEGADOR` with:

```ts
|Date\.now|new\s+Date\b|Math\.random|crypto|performance|location|history|XMLHttpRequest|WebSocket|EventSource|queueMicrotask
```

Add one negative-sample line per name in the "muerde" test, and mention the clock and randomness in the W4 row of `docs/convenciones.md` and in CLAUDE.md line 242.

### IN-05: The "en curso" icon and its reduced-motion CSS are duplicated between two features

**File:** `web/src/features/casos/progreso-caso/progreso-caso.tsx:23-34`, `web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx:21-32`, `web/src/features/casos/progreso-caso/progreso-caso.module.css:24-31,64-71`, `web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.module.css:39-46,198-205`
**Issue:** The IN-05 fix turned the inline JSX into the named components `IconoEtapaEnCurso` and `IconoHerramientaEnCurso`. The two are line-for-line identical: a `.giro` span with `IconoGirando` and a `.quieto` span with `IconoReloj`. Each relies on its own copy of the same CSS: `.giro, .quieto { display: inline-flex }`, `.quieto { display: none }`, and the `prefers-reduced-motion` block that swaps them. This is exactly what `compartido/` is for ("lo que usan varias features"). Today, a change to the spinner or to the reduced-motion behavior has to be made twice, in sync.
**Fix:** Add one shared component, for example `IconoEnCurso` in `web/src/compartido/iconos/` or in its own `compartido/icono-en-curso/` folder with a `.module.css` that owns `.giro`/`.quieto` and the reduced-motion rule. Point both `ICONO_DE_ESTADO[...EN_CURSO]` entries at it, and delete the two local components and the duplicated CSS rules. W26 (every module class exists) will then catch any stale class reference.

---

_Reviewed: 2026-10-16T21:41:52Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
