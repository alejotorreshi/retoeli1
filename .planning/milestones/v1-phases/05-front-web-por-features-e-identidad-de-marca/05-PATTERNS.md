# Phase 5: Front web por features e identidad de marca - Pattern Map

**Mapped:** 2026-10-16
**Files analyzed:** ~75 (25 componentes → triples, 7 reductores, 6 hooks, store nuevo, guardianes, pruebas, config, assets)
**Analogs found:** casi todos son mudanzas de un archivo existente (el analog es el propio archivo de origen). Sin analog: store, helper DOM, primer `.test.tsx`, plugin Vite, assets binarios.

Regla transversal: el código no lleva comentarios, solo alias `@web/` y `@/` (nunca `./`), los textos en `web/src/config/strings.ts`, sin `enum`, y los tipos exportados solo en `web/src/types/*.type.ts` (W10 no cambia de ruta, según la recomendación de RESEARCH).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `web/src/features/<f>/<c>/<c>.tsx` (x ~25) | component (vista) | request-response (props → JSX) | `web/src/components/<c>.tsx` (el mismo) | exact (mudanza) |
| `web/src/features/<f>/<c>/usar-<c>.ts` | hook | event-driven | `web/src/hooks/usar-salud.ts`, la lógica de `compositor.tsx` | role-match |
| `web/src/features/<f>/<c>/<c>.module.css` | style | — | `web/src/components/<c>.module.css` | exact (mudanza) |
| `features/chat/estado-vacio/*` (nuevo) | component | request-response | `EstadoVacio` dentro de `web/src/components/linea-de-tiempo.tsx` | exact (extracción) |
| `features/chat/tarjeta-caso/*` (nuevo) | component | event-driven (clic = envío) | `web/src/components/acciones-rapidas.tsx` | role-match |
| `features/chat/estado/tarjeta-caso.ts` (nuevo) | utility puro | transform | `web/src/state/casos.ts` | role-match |
| `features/disposicion/barra-pestanas/*` | component | event-driven | `BarraDePestanas` en `web/src/app.tsx` (~líneas 40-110) | exact (extracción) |
| `features/disposicion/columnas/*` | component + hook | — | `App` en `web/src/app.tsx:117+`, `hooks/usar-diseno.ts`, `usar-pestanas.ts`, `usar-reintento-config.ts` | exact |
| `features/<f>/estado/*.ts` (x7) | reducer puro | transform | `web/src/state/*.ts` | exact (mudanza) |
| `compartido/aviso/*`, `compartido/iconos/*`, `compartido/logo-marca/*` | component | — | `web/src/components/aviso.tsx`, `components/icons/iconos.tsx` | exact |
| `web/src/store/almacen.ts`, `raiz.ts`, `selectores.ts` | store (puro) | pub-sub | ninguno; reductor `web/src/state/conversacion.ts` | no analog |
| `web/src/store/acciones.ts`, `dependencias.ts` | service | request-response/streaming | `web/src/hooks/usar-chat.ts` | exact (absorción) |
| `web/src/store/proveedor-almacen.tsx`, `usar-almacen.ts` | provider/hook | pub-sub | ninguno | no analog |
| `web/src/app.tsx`, `web/src/main.tsx` | config/entry | — | los mismos | modify |
| `web/src/config/strings.ts` | config | — | el mismo (`:272`, `:282`) | modify |
| `web/src/config/constants/{marca,pais}.constants.ts` | config | — | `web/src/config/constants/ui.constants.ts` | exact |
| `src/config/strings.ts` | config | — | el mismo (`:509`) | modify |
| `web/src/styles/tokens.css`, `global.css` | style | — | los mismos | modify |
| `web/index.html` | config | — | el mismo | modify |
| `web/vite.config.ts` | config | build transform | el mismo | modify |
| `tsconfig.dom.json` (nuevo), `tsconfig.json`, `package.json` | config | — | `web/tsconfig.json`, `tsconfig.json` | role-match |
| `web/public/fuentes/*`, `web/public/marca/*` | asset | file-I/O | ninguno | no analog |
| `tests/arquitectura-web.test.ts` | test (guardián) | — | el mismo | modify |
| `tests/architecture.test.ts`, `tests/sin-comentarios.test.ts` | test (guardián) | — | los mismos (`escanearCarpetas` :513, `listarFuentes` :30) | modify |
| `tests/helpers/dom.helper.ts` (nuevo) | test helper | — | `tests/helpers/*.helper.ts`; RESEARCH Pattern 5 | partial |
| `tests/web/dom/<c>.test.tsx` (nuevo) | test | event-driven | `tests/web/acciones-rapidas.test.ts` | partial |
| `tests/web/*.test.ts` (11) | test | — | los mismos | modify (imports y rutas) |
| `tests/cli/preflight.test.ts` | test | — | el mismo (`:531-532`, `:642`) | modify, si cambia la aserción |
| `SOLUCION.md` §6 | docs | — | la tabla de deps existente de §6 | modify |

## Pattern Assignments

### Vista `features/<f>/<c>/<c>.tsx` (component)

**Analog:** `web/src/components/compositor.tsx` y `acciones-rapidas.tsx`.

**Imports actuales (compositor.tsx:1-5).** Al mudar, la ruta del CSS pasa a la del propio componente:
```typescript
import estilos from "@web/components/compositor.module.css";
import { MARGEN_AVISO_CONTADOR, TECLA_ENVIAR } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import type { PropsCompositor } from "@web/types/ui.type.ts";
import { type FormEvent, type KeyboardEvent, useId } from "react";
```
Así queda en la vista nueva:
```typescript
import estilos from "@web/features/chat/compositor/compositor.module.css";
import { useCompositor } from "@web/features/chat/compositor/usar-compositor.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import type { PropsCompositor } from "@web/types/ui.type.ts";
```
**Lo que se queda en la vista:** solo JSX, `aria-*`, `className={estilos.x}` y los textos de `TEXTO_*` (compositor.tsx:44-82).
**Lo que pasa al hook:** `useId`, `esEnvioPorTeclado`, `contadorVisible`, `alEnviarFormulario`, `alPresionarTecla` y los derivados `conContador`, `enElLimite` y `deshabilitado` (compositor.tsx:7-42).
**W15:** la vista no importa `@web/api/**`, `@web/store/**` ni `features/*/estado/**`. RESEARCH lista las violaciones actuales que hay que mover a cada hook: `pantalla-acceso` (entrar), `dialogo-vista-previa`, `lista-archivos`, `panel-casos`, `linea-de-tiempo:11-14`, `grupo-herramientas`, `tarjeta-resultado`, `tarjeta-confirmacion` y `tarjeta-herramienta`.

### Hook `usar-<c>.ts` (hook, event-driven)

**Analog:** `web/src/hooks/usar-salud.ts` (todo el archivo). Muestra el patrón de efecto con aborto y el export `useX` en un archivo `usar-x.ts`:
```typescript
export function useSalud(): ControlSalud {
  const [salud, setSalud] = useState<HealthResponse | null>(null);
  const pedidoActivo = useRef<AbortController | null>(null);
  const refrescar = useCallback(() => {
    pedidoActivo.current?.abort();
    const controlador = new AbortController();
    ...
    void obtenerSalud(controlador.signal).then((resultado) => {
      if (controlador.signal.aborted) return;
      if (resultado.tipo === RESULTADO_API.OK) setSalud(resultado.valor);
    })
```
**Convención:** el archivo se llama `usar-<c>.ts` y exporta `use<Componente>`. El tipo de retorno va en `web/src/types/ui.type.ts` o `chat.type.ts`. Solo los hooks y el store importan `@web/api/**` (W16).
`usar-salud.ts` pasa a `features/encabezado/aviso-modelo/` o a una acción del store. `alTerminarTurno = refrescarSalud`, sin sondeo por intervalo.

### `features/chat/tarjeta-caso/*` (nuevo, event-driven)

**Analog:** `web/src/components/acciones-rapidas.tsx:13-21`, el botón que envía la demo:
```tsx
<button type="button" className={estilos.chip} disabled={deshabilitadas}
  onClick={() => alEnviar(TEXTO_ACCIONES.mensajeDemo)}>
```
La tarjeta llama `alEnviar(TEXTO_ACCIONES.mensajeDemoDe(slug))` y se deshabilita con `envioDeshabilitado`. Los datos de la tarjeta salen de una función pura en `features/chat/estado/tarjeta-caso.ts` (RESEARCH, "Derivación de la tarjeta de caso"): usa `slug.indexOf(SEPARADOR_SLUG)` sin regex (W11) y un mapa `TEXTO_PAIS` en `pais.constants.ts` o `strings.ts`. Los 4 slugs esperados son `co-industrias-delta`, `ec-corp-andina`, `hn-agroexport-sula` y `pa-logistica-istmo`.

### `features/chat/estado-vacio/*` (extracción)

**Analog:** `EstadoVacio` y `PropsEstadoVacio` en `web/src/components/linea-de-tiempo.tsx` (imports :1-25). La línea de tiempo importa la vista nueva `@web/features/chat/estado-vacio/estado-vacio.tsx`, porque una vista puede importar otra vista según W15.

### `features/disposicion/barra-pestanas/*` y `columnas/*`

**Analog:** `web/src/app.tsx`. Allí `BarraDePestanas`, `pestanaPorTecla` y `atributosDeVista` (`useRef(new Map<Pestana, HTMLButtonElement>())` en :52) pasan a `barra-pestanas`. El cuerpo de `App` (:117-160: `useSalud`, `useChat(refrescar)`, `useDiseno`, `usePestanas(conPestanas, firmaDelProgreso(progresos))` y `useId`) pasa a `columnas/usar-columnas.ts`, que consume el store. `usar-diseno.ts` puede conservar `useSyncExternalStore` con `matchMedia`, la excepción de W20. `usar-reintento-config.ts` se absorbe con la misma conducta.

### Reductores `features/<f>/estado/*.ts` (reducer puro, transform)

**Analog:** `web/src/state/confirmaciones.ts` (se mudan sin cambios). Imports :1-10:
```typescript
import { ESTADO_HERRAMIENTA, ESTADO_TARJETA_CONFIRMACION } from "@web/config/constants/ui.constants.ts";
import type { AccionDeTarjeta, ... } from "@web/types/chat.type.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
```
Mapa de la mudanza: `casos` → `casos/estado`; `confirmaciones` → `confirmacion/estado`; `conversacion` y `seguimiento` → `chat/estado`; `modelo` → `encabezado/estado`; `hidratacion` → `sesion/estado`; `vista-previa` → `archivos/estado`. `conversacion.ts` sigue siendo el reductor raíz, porque llama a `reducirConfirmaciones` y `marcarEnviando` (:99-122). No se parte con un `combineReducers` ingenuo. Ningún reductor importa React ni las APIs del navegador (W4 ampliado).

### `web/src/store/acciones.ts` (absorbe `usar-chat.ts`)

**Analog:** `web/src/hooks/usar-chat.ts` (imports :1-25, `useChat` :32+):
```typescript
import { obtenerSesionAsentada } from "@web/api/cliente-api.ts";
import { enviarTurno } from "@web/api/flujo-chat.ts";
import { guardarSesionId, leerSesionGuardada, olvidarSesion } from "@web/api/sesion-local.ts";
...
export function useChat(alTerminarTurno: () => void): ControlChat {
  const [estado, despachar] = useReducer(reducirConversacion, null, estadoConSesionGuardada);
  const turnoActivo = useRef<AbortController | null>(null);
```
`useReducer` pasa a `crearAlmacen(reducirConversacion, estadoAlCargar(leerSesionGuardada()))`. `turnoActivo.current` pasa a una variable de cierre dentro de `crearAcciones(almacen, dependencias)`. Se conservan las guardas de `iniciarTurno` y `sincronizarSesionGuardada`. Los imports de `@web/api/*` van solo en `store/dependencias.ts`, que se inyectan. La hidratación sigue siendo un `useEffect` con deps `[accesoConcedido, sesionPorCargar]`. No se cambia `CLAVE_SESION_LOCAL`.

### `web/src/store/almacen.ts`, `selectores.ts`, `usar-almacen.ts`, `proveedor-almacen.tsx` (sin analog)

Se usan RESEARCH Pattern 1 (`crearAlmacen` con `leer`, `suscribir` y `despachar` y un `Object.is` temprano) y Pattern 2 (`memoizarPorReferencia` con `WeakMap`, obligatorio para todo selector que construya un objeto o un arreglo). El Context transporta la **instancia**, no el estado. `main.tsx` crea el almacén una sola vez fuera del render (StrictMode). `createContext`, `useContext` y `useSyncExternalStore` van solo en `store/**` (W20).

### `compartido/aviso/*`, `compartido/iconos/*`

**Analog:** `web/src/components/aviso.tsx` (se muda; los imports :1-4 pasan a `@web/compartido/iconos/iconos.tsx` y `@web/compartido/aviso/aviso.module.css`). Más de un export por vista (`AvisoError` y `AvisoSistema`) sigue permitido. `logo-marca` es una vista nueva con `<img src={RUTA_LOGO} alt={TEXTO_APP.…}>`, y la ruta va en `marca.constants.ts`.

### `web/src/config/strings.ts` (modify)

- `:272` `const DEMO_CORTO = "Demo §11";` pasa a un texto sin "§", por ejemplo "Pedido de la demo" (UI-SPEC manda).
- `:282` `mensajeDemo` pasa a `mensajeDemoDe(caso)`, y `mensajeDemo` sigue siendo **string** (`tests/cli/preflight.test.ts:642` lo compara con `TEXTO_PREFLIGHT.mensajeGuion`). Como un literal de objeto no se referencia a sí mismo, `mensajeDemoDe` se define como función de módulo antes del objeto.
- `TEXTO_APP` (:47) agrega `tituloDocumento`, el alt del logo y los textos de `TEXTO_PAIS` y de la tarjeta de caso.

### `src/config/strings.ts:509` (modify)

```typescript
turnoOk: (numero: number): string => `Turno ${numero} del guion del PRD §11 OK.`,
```
Pasa a "…del guion de la sección 11 del PRD OK." `tests/cli/preflight.test.ts:531-532` usa `TEXTO_PREFLIGHT.turnoOk(n)`, así que sigue pasando. Hay que revisar si `scripts` o eli-qa dependen del literal.

### `web/src/config/constants/{marca,pais}.constants.ts`

**Analog:** `web/src/config/constants/ui.constants.ts` (objetos `as const`, por ejemplo `CASO_DEMO_PRD` en :153 y `RESULTADO_API`). Las rutas `/marca/periferia-it-group.webp`, `/marca/favicon.jpg` y `/fuentes/*.woff2` van aquí. Los códigos de país van en un objeto `as const`, con su tipo derivado `ValorDe<typeof X>` en `types/`.

### `web/vite.config.ts` (modify)

**Analog:** el mismo archivo. Agregar un plugin al arreglo `plugins: [react()]` (:17). El alias `@web` ya existe (:20), así que el import de `TEXTO_APP` resuelve:
```typescript
function tituloDelDocumento(): Plugin {
  return { name: "titulo-del-documento",
    transformIndexHtml: (html) => html.replace(MARCADOR_TITULO, TEXTO_APP.tituloDocumento) };
}
```
`MARCADOR_TITULO = "%TITULO_DOCUMENTO%"` va en una constante, y la regex en `patterns` si hace falta. Mantener `--configLoader native` en `package.json`.

### `web/index.html` (modify)

Hoy tiene `<link rel="icon" href="data:," />` y `<title></title>`. Pasa a `<title>%TITULO_DOCUMENTO%</title>`, `<link rel="icon" href="/marca/favicon.jpg">`, el preload de 2 fuentes y `theme-color`. Sin texto entre etiquetas (W8 ampliado) y sin comentarios (`sin-comentarios` cubre `index.html`).

### `web/src/styles/tokens.css` y `global.css` (modify)

**Analog:** `tokens.css:1-25` (`--espacio-*`, `--fuente-base`, `--peso-*`, `--*-tamano`). Agregar los tokens de Periferia, `--radio-pildora`, `--fuente-titulo` y `--fuente-cuerpo` con la pila del sistema de respaldo, y tokens de duración. `@font-face` va en `global.css` (bloque de RESEARCH "@font-face"). Las violaciones actuales que W12 ampliado detectará y hay que tokenizar son `global.css:19` `100dvh`, `:146` `360deg`, `:152` `0ms`, `pantalla-acceso.module.css:105` `40em` (las líneas `@media` quedan exentas) y `90deg` en `linea-de-tiempo`.

### `tsconfig.dom.json` (nuevo) y `tsconfig.json` y `package.json` (modify)

**Analog:** `web/tsconfig.json` (`lib` DOM, `jsx: "react-jsx"`, `types: ["vite/client"]`, `paths`) combinado con el `tsconfig.json` raíz (`types: ["bun"]`, `paths` `@/`, `@tests/` y `@web/`). El nuevo usa `types: ["bun","vite/client"]` e `include: ["tests/**/*.tsx", "tests/helpers/dom.helper.ts"]`. El raíz agrega `exclude` de `tests/**/*.tsx`. `package.json:23`:
```
"check": "tsc --noEmit && tsc --noEmit -p web/tsconfig.json && biome check ."
```
Pasa a incluir `&& tsc --noEmit -p tsconfig.dom.json`. Las devDeps (`@testing-library/react`, `@testing-library/user-event`, `@happy-dom/global-registrator`) llevan versión exacta.

### `tests/helpers/dom.helper.ts` (nuevo, sin analog real)

Se copia RESEARCH Pattern 5 tal cual (`prepararDom()` con `GlobalRegistrator.register` → import dinámico de RTL → `afterEach(cleanup)` → `afterAll(unregister)`, expone `pantalla: () => within(document.body)` y `usuario: () => userEvent.setup({ document })`, nunca `screen`). Si exporta un tipo de retorno, va en `tests/helpers/types/dom.type.ts`. **Nunca** un preload global (Pitfall 1). Agregar una prueba centinela de backend con `typeof document === "undefined"`.

### `tests/web/dom/<c>.test.tsx` (nuevo)

**Analog estructural:** `tests/web/acciones-rapidas.test.ts:1-30` (`describe`/`test` de `bun:test`, aliases `@web/`, datos de `reto-01/fixtures`). Se cambian las aserciones de fuente por conducta:
```typescript
const { render, pantalla, usuario } = await prepararDom();
const { AccionesRapidas } = await import("@web/features/chat/acciones-rapidas/acciones-rapidas.tsx");
```
Se afirman roles, nombres accesibles, `disabled` y `aria-*`, nunca clases (los CSS modules resuelven a `{}`). Prioridad: Compositor (Enter envía, Shift+Enter no), AccionesRapidas, TarjetaConfirmacion, TarjetaCaso, los diálogos y BarraDePestanas.

### `tests/web/*.test.ts` (modify)

- `acciones-rapidas.test.ts:8` lee `web/src/components/acciones-rapidas.tsx`, y en :26 y :44 espera `"Demo §11: ec-corp-andina"`. Hay que reescribirlo al texto nuevo y pasar las aserciones de fuente (55-65) a la prueba DOM.
- `estado-del-modelo.test.ts:142-155` lee `components/aviso-modelo.tsx`. Lo reemplazan W15 y una prueba DOM.
- `confirmaciones.test.ts:5-6` y los demás importan `@web/state/*`, que pasan a las nuevas rutas `@web/features/<f>/estado/*`.

### `tests/arquitectura-web.test.ts` (modify)

**Analog:** el mismo archivo. Se mantiene su estructura de dos `describe`: "sobre el código real" (:201) y "muerde sobre fuentes de muestra" (:266). Cada regla es `function violacionesDeX(ruta, codigo): string[]` y se aplica con `sobreElCodigo(regla)`. Las muestras negativas comparan con `toEqual([...mensajes])`, como en W13 (:437-460):
```typescript
test("W13: reporta archivos sueltos o con el sufijo equivocado en web/src", () => {
  const rutas = ["web/src/aviso.tsx", ..., "web/src/components/aviso.tsx"];
  expect(rutas.flatMap(violacionesDeUbicacion)).toEqual([
    "web/src/aviso.tsx: no está en una carpeta de rol de web/src con su sufijo", ...]);
});
```
Constantes que cambian: `CARPETA_DE_ESTADO` (:33) pasa a un patrón `features/*/estado/` y `store/{almacen,raiz,selectores}.ts`, y `UBICACIONES_WEB` (:59-67) se reescribe. El resto sigue la tabla "Reescritura de guardianes" de RESEARCH (W14 con la retro-referencia `\\1` y W15 a W21), incluidas las muestras negativas. W15 usa `extraerImportacionesConTipo` (`soloTipo`) de `tests/helpers/escaner-fuentes.helper.ts`. W18 reutiliza `literalesDeTexto` y `transpilar` (:331). Hay que actualizar las rutas fijas `:205` (`web/src/state/conversacion.ts`) y `:257` (`components/aviso.module.css`).

### `tests/architecture.test.ts` y `tests/sin-comentarios.test.ts` (modify)

- `architecture.test.ts:513-517` `escanearCarpetas` usa `${carpeta}/**/*.ts`. Se amplía a `{ts,tsx}` y se agrega a `NOMBRES_CON_ROL` el patrón `^tests/(?!unit/)(?:KEBAB/)*KEBAB\.test\.tsx$`, con su prueba negativa.
- `sin-comentarios.test.ts:30-32`: `escanear(\`${carpeta}/**/*.ts\`)` se amplía a `.tsx`, con una muestra negativa.

### `SOLUCION.md` §6 (modify)

Va en el **mismo commit** que `package.json`: una fila por devDep con nombre, versión exacta, "desarrollo" y el porqué. Lo exige `tests/docs/solucion.test.ts:185-192`. Además se cita que el logo es marca de Periferia (D-108) y la licencia OFL de las fuentes.

## Shared Patterns

- **Imports:** primero `@web/…` y luego `react`, después `@/config/constants/**` y al final `import type` de `@/http/types/**` (orden de Biome, visto en `usar-salud.ts:1-5`).
- **Textos:** siempre `TEXTO_*` de `web/src/config/strings.ts`. Las funciones de texto con parámetros (`TEXTO_CHAT.contador(c, m)`) siguen ese patrón.
- **Estados y códigos:** objetos `as const` de `ui.constants.ts` (`RESULTADO_API.OK`, `ACCION_UI.ENVIAR`).
- **Guardianes:** cada regla nueva va con su prueba "muerde" y mensajes exactos.
- **Pruebas DOM:** `prepararDom()` por archivo, con imports dinámicos tras el registro.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `web/src/store/{almacen,selectores,usar-almacen,proveedor-almacen}` | store/provider | No hay store externo; usar RESEARCH Patterns 1 y 2 |
| `tests/helpers/dom.helper.ts`, `tests/web/dom/*.test.tsx` | test | No hay pruebas DOM; usar RESEARCH Pattern 5 |
| plugin `tituloDelDocumento` en vite | config | Usar RESEARCH Pattern 6 |
| `web/public/fuentes/*.woff2` + OFL, `web/public/marca/*` | asset | Descargar de Fontsource (estáticos 400/600, no el variable de Google) y del sitio oficial; agregar una prueba de existencia de assets (Pitfall 6) |

## Metadata

**Analog search scope:** `web/src/**`, `tests/web`, `tests/helpers`, `tests/arquitectura-web.test.ts`, `tests/architecture.test.ts`, `tests/sin-comentarios.test.ts`, `src/config/strings.ts`, `SOLUCION.md`, `package.json`, `tsconfig*.json`, `web/vite.config.ts`, `web/index.html`
**Pattern extraction date:** 2026-10-16
