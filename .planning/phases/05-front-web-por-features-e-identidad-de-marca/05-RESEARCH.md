# Phase 5: Front web por features e identidad de marca - Research

**Researched:** 2026-10-16
**Domain:** Refactor de una SPA React 19 + Vite 8 (Bun 1.4.3) a features con store propio, guardianes de arquitectura, pruebas de componentes con Testing Library + happy-dom e identidad de marca autoalojada
**Confidence:** HIGH (casi todo se ejecutó en un spike aislado en el scratchpad con Bun 1.4.3 y en el repo real)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Decisiones previas de la usuaria (bloqueadas, de `.planning/todos/completed/2026-10-16-decisiones-fase-5-front.md`)
- **D-100:** `web/src` se organiza en carpetas por feature (carpeta padre) y, dentro de cada una, una carpeta por componente con la vista `.tsx` (solo presentación), el hook `usar-<componente>.ts` (lógica) y el `.module.css`. Lo compartido va en una carpeta común. Cita de la usuaria: "carpeta por componente más carpeta padre con feature, así lo dejamos más limpio". — **Reversibility:** costly — mueve los ~25 componentes, los 6 hooks y sus imports, y reescribe los guardianes W.
- **D-101:** El estado vive en un store propio sin dependencias de runtime, con `useSyncExternalStore`, Context y selectores por slice, sobre los reductores puros existentes. Se descartaron Zustand (dependencia nueva que habría que justificar según PRD §8) y `useReducer` + Context solo.
- **D-102:** Nada hardcodeado en los componentes. Los textos van en `strings.ts`, los valores en `config/constants` y los colores, tamaños y espacios en tokens CSS. Las vistas no llevan lógica de negocio ni de red, y los guardianes W lo exigen. El criterio rector es "las mejores prácticas, lo mejor de la industria".
- **D-103:** La semilla SEED-261014-8dq entra en el alcance. Sigue chat-first y sin modo oscuro.
- **D-104:** Corrida **encadenada nocturna de corrido**, igual que la Fase 4: UI-SPEC → plan → ejecución → eli-qa con Playwright MCP → loop de brechas con tope de 3 rondas. La usuaria eligió **no** detenerse para revisar el UI-SPEC antes de planear.

#### Dirección de marca (identidad de Periferia IT Group)
La usuaria pidió adoptar la identidad corporativa de https://periferiaitgroup.com/. Estos valores se extrajeron de su HTML y de `assets/css/style.css` el 2026-10-16:

| Token de su sitio | Valor | Uso |
|---|---|---|
| `--teal` / `theme-color` | `#063635` | Superficie de marca oscura (encabezado) |
| `--bright` | `#6dfd8c` | Neón, **solo sobre superficies oscuras** o como detalle no textual |
| `--dark` | `#15601d` | Acento interactivo sobre fondo claro |
| `--light` / `--muted` | `#ccffd6` / `#bfe8c0` | Tintes de acento suave |
| tintes | `#ecfff0`, `#f5fef7`, `#dceadd` | Fondos suaves |
| Títulos | Outfit 400–800 | |
| Cuerpo y botones | Montserrat 400–700 (botón: 700 de 14 px) | |
| Botones | `border-radius: 999px` (píldora) | |

Contraste medido: neón sobre blanco 1.31:1 (**prohibido para texto o controles sobre claro**), neón sobre teal 10.13:1, `#15601d` sobre blanco 7.71:1 (AAA) y teal sobre blanco 13.23:1.

- **D-105:** El nombre se mantiene: "Registro como proveedor" con el subtítulo "Periferia IT Group". La marca la ponen el logo, el color y la tipografía. Se llena el `<title>` real de `web/index.html` (hoy vacío), derivado de `TEXTO_APP.tituloDocumento`.
- **D-106:** **Encabezado teal `#063635`** con el logo blanco oficial y detalles en neón, como en su sitio. El cuerpo de la app sigue claro. Los botones primarios, los controles, el foco y los enlaces usan `#15601d` sobre claro. El neón solo va sobre el teal o en detalles no textuales.
- **D-107:** Tipografía **Outfit (títulos) + Montserrat (cuerpo y controles)**, **autoalojadas** como `.woff2` (subconjunto latino, con los pesos realmente usados) servidas desde `web/public`, con `@font-face` y `font-display: swap`. No se agrega ningún paquete npm y no hay petición a Google en tiempo de ejecución. Se incluye la licencia OFL de cada familia junto a los archivos. Con un respaldo de pila del sistema en los tokens `--fuente-*`.
- **D-108:** **Logo oficial** de Periferia: `https://periferiaitgroup.com/assets/img/periferia-it-group-1.webp` (blanco, para fondo oscuro) en el encabezado teal y en la pantalla de acceso. **Favicon oficial**: `https://periferiaitgroup.com/assets/img/favicon-3.jpg` (isotipo de arco neón con 5 puntos, 512×512), en lugar del `data:,` actual. Los archivos se **copian al repo** (`web/public/`) y nunca se cargan desde su dominio en tiempo de ejecución. El README o SOLUCION.md cita que el logo es marca de Periferia IT Group, usada porque la herramienta es interna para ellos. — **Reversibility:** reversible — se cambia el asset y un token.
- **D-109:** **Forma píldora** (`999px`) en botones y chips. Tarjetas, diálogos, compositor y avisos mantienen el radio de 8 px. Es un token nuevo, por ejemplo `--radio-pildora`.
- **D-110:** Los colores de estado (éxito, atención, error e info) se reajustan **a criterio de Claude en el UI-SPEC**. El verde de éxito actual `#1a6b41` casi coincide con la marca `#15601d`, así que "listo" no puede confundirse con "botón". Los estados se distinguen siempre por ícono y texto, nunca solo por color, y todos pasan AA.

#### Estado vacío con los 4 casos
- **D-111:** Una sesión sin turnos muestra **las tarjetas de los casos arriba** y **los 3 chips de acción rápida debajo** (el prompt de la demo, procesar todos y listar, como exige UI-07). Después del primer turno el estado vacío desaparece y quedan los chips compactos, igual que hoy.
- **D-112:** **Clic en la tarjeta = envío directo** del pedido de la demo del PRD (sección 11) aplicado a ese caso: `Procesa el caso "<slug>". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.` La plantilla vive en `web/src/config/strings.ts` y se deriva del mismo texto que `TEXTO_ACCIONES.mensajeDemo`, porque no se duplica el texto. La usuaria pidió explícitamente "sin salirnos de los requerimientos del reto". El clic no es una acción externa, así que RN4 y CA3 no cambian. Se deshabilita en las mismas condiciones que los chips (`envioDeshabilitado`).
- **D-113:** El contenido de la tarjeta **se deriva del slug, sin tocar la API**: `/api/config` sigue devolviendo `casos: string[]` (FE-06). Muestra el código de país del prefijo (`co`, `ec`, `pe`, `pa`, `hn`), el nombre del país desde una constante del front y el cliente humanizado del resto del slug (`industrias-delta` → "Industrias Delta"). El mapa de países va en `web/src/config/constants`, y si el prefijo no se conoce, la tarjeta muestra solo el slug.
- **D-114:** El país se muestra como **código en una píldora** ("CO", "EC", "HN", "PA") con el tinte verde de la marca. Sin emoji de bandera.

#### Pruebas del front
- **D-115:** Se agregan **Testing Library (`@testing-library/react`, y `@testing-library/user-event` si hace falta) + `happy-dom`** como **devDependencies** para probar los componentes con interacción. **Esto modifica el criterio de éxito 2 del ROADMAP** ("no hay dependencias nuevas en `package.json`"), que pasa a decir: no hay dependencias de **runtime** nuevas, y las únicas devDeps nuevas son las de prueba del front, con versión exacta fijada y justificadas en `SOLUCION.md`. El store sigue sin dependencias (FE-02 intacto). Las pruebas puras de los reductores en `tests/web/` se conservan. — **Reversibility:** reversible — son devDeps de prueba.
- **D-116:** La regresión de FE-06 la **garantiza eli-qa de punta a punta**, con todo completo: la regresión técnica (`bun run check`, `bun test`, `demo.ts`, `build:web` y CI) más la QA de navegador de todos los flujos (acceso, estado vacío y tarjetas, turno con herramientas, confirmación, panel de casos, archivos y vista previa, nueva sesión, errores y avisos, y layouts ancho y angosto) en local y en el link público, con el ensayo del pedido de la demo. La conducta se compara antes y después del refactor.
- **D-117:** La QA de navegador sigue con **Playwright MCP en eli-qa**, como en las fases 3 y 4, con la evidencia en `.planning`. No se agrega `@playwright/test` al repo.

#### Símbolo "§"
- **D-118:** **No se usa el símbolo "§" en ningún texto visible del front web ni de la CLI.** Hoy aparece en `web/src/config/strings.ts:272` (`DEMO_CORTO = "Demo §11"`) y en `src/config/strings.ts:509` (`turnoOk`: "…del guion del PRD §11 OK."). Se reescriben con palabras, por ejemplo "Pedido de la demo" o "sección 11 del PRD", y un guardián lo vigila en `web/src/config/strings.ts` y en los textos de la CLI. La documentación (README, SOLUCION y docs) queda como está.

#### Mapa de features
- **D-119:** Estructura aprobada:
  ```
  web/src/
    features/
      acceso/        pantalla-acceso
      encabezado/    encabezado, aviso-modelo (usar-salud)
      chat/          linea-de-tiempo, mensaje, indicador-pensando, compositor,
                     acciones-rapidas, estado-vacio (nuevo), tarjeta-caso (nuevo)
      herramientas/  grupo-herramientas, tarjeta-herramienta
      confirmacion/  tarjeta-confirmacion (pila)
      casos/         panel-casos, progreso-caso, tarjeta-resultado
      archivos/      lista-archivos, dialogo-vista-previa, aviso-disco-efimero (usar-archivos)
      sesion/        dialogo-nueva-sesion
      disposicion/   barra-pestanas (extraída de app.tsx), columnas (usar-diseno, usar-pestanas)
    compartido/      aviso, iconos
    store/  api/  config/  styles/  types/
    app.tsx          solo providers + disposicion
    main.tsx
  ```
  Dentro de cada feature va una carpeta por componente: `features/<feature>/<componente>/{<componente>.tsx, usar-<componente>.ts, <componente>.module.css}`. — **Reversibility:** costly — es la base sobre la que se reescriben los guardianes W.
- **D-120:** **Cada reductor puro va junto a su feature** (por ejemplo `features/confirmacion/estado/confirmaciones.ts`) y `web/src/store/` arma el store único, el Context y los selectores combinando los slices. Los reductores siguen sin React ni DOM (la regla actual de `state/` se traslada a la nueva ubicación). `usar-chat.ts` se absorbe en el store y en los hooks por feature.
- **D-121:** Los textos siguen en un **único `web/src/config/strings.ts`** (regla vigente de CLAUDE.md y W).
- **D-122:** **`web/src/api/` es transversal**. Solo la importan los hooks `usar-*.ts` y el store, nunca una vista `.tsx`, y un guardián W lo exige. `sesion-local.ts` sigue siendo el único lugar con `localStorage`.

### Claude's Discretion
- El tono exacto de los colores de estado (D-110), los tamaños de la escala tipográfica y la jerarquía, siempre que pasen AA y respeten la paleta de Periferia.
- El aspecto de las tarjetas de caso (disposición en grilla, hover y foco) y de la pantalla de acceso con la marca.
- Si los tipos se colocan por feature (`features/<f>/types/*.type.ts`) o siguen en `web/src/types/`, manteniendo la invariante de "solo `type` en `*.type.ts`" y ajustando W en consecuencia.
- La organización de `tests/web/` (espejo por feature o no) y qué componentes llevan prueba con Testing Library, priorizando los de interacción (compositor, tarjeta de confirmación, tarjetas de caso, diálogos y pestañas).
- La nomenclatura de los guardianes nuevos (W14 en adelante) y cómo se reescriben W1–W13 para las nuevas rutas.
- Los micro-movimientos (transiciones), siempre con tokens de duración y respetando `prefers-reduced-motion`.

### Deferred Ideas (OUT OF SCOPE)
- Quitar el "§" también de README, SOLUCION.md y `docs/`: la usuaria lo limitó a la web y la CLI. Si se quiere después, es una tarea rápida de docs.
- Una suite e2e versionada con `@playwright/test` en CI: se descartó por ahora (D-117).
- Enriquecer `/api/config` con cliente, país y formato por caso: se descartó para no cambiar el contrato (D-113).
- Modo oscuro: sigue fuera de alcance (REQUIREMENTS.md).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md:94-99) | Research Support |
|----|-------------|------------------|
| FE-01 | `web/src` por features, carpeta por componente con vista `.tsx`, hook `usar-<componente>.ts` y `.module.css`; lo compartido en carpeta común | Árbol objetivo exacto y mapa archivo-a-archivo (sección "Mapa de migración"); patrones de W13 con retro-referencia al nombre de carpeta; guardián W14 de carpeta de componente |
| FE-02 | Store propio sin dependencias nuevas con `useSyncExternalStore`, Context y selectores por slice; reductores puros probados sin React | Patrón de store (`almacen.ts` puro + Context + `usarSelector`), memoización por `WeakMap` verificada contra el error "getSnapshot should be cached", acciones con dependencias inyectadas que absorben `usar-chat.ts` |
| FE-03 | Sin valores hardcodeados: textos en `strings.ts`, valores en `config/constants`, colores/tamaños/espacios en tokens CSS; vistas sin lógica de negocio ni de red | W8 vigente + W15 (imports de la vista) + W18 (números mágicos, `style=`, colores en TSX) + W12 ampliado (`global.css` y unidades `rem/em/vh/vw/ms/deg`), con la lista de las 9 violaciones actuales que hay que migrar |
| FE-04 | Guardianes W1–W13 + nuevos exigen estructura, separación vista/lógica y uso del store; cada regla con prueba negativa | Reescritura regla por regla de W1–W13 y propuesta W14–W21 con su prueba negativa; ampliación de G (architecture.test.ts) y del escáner de comentarios a `tests/**/*.tsx` |
| FE-05 | Identidad de marca: logo, acento, tipografía, jerarquía, estado vacío con tarjetas de los 4 casos desde `/api/config`; chat-first, sin modo oscuro | Archivos `.woff2` estáticos de Fontsource (mismos v31/v15 de Google) con tamaños medidos; logo 248×62 y favicon 512×512 verificados; plugin `transformIndexHtml` verificado; CSP y tipos MIME de Hono verificados; derivación del slug como función pura |
| FE-06 | Sin cambios de conducta: contrato de API, agente y flujos de UI iguales; regresión completa, `demo.ts` y ensayo §11 en navegador | Línea base medida (2496 pruebas, 118 archivos, 24.7 s), orden de migración tracer-first con pruebas de caracterización antes de mover, lista de pruebas que leen rutas de `web/src/components`, suites eli-qa 03 (T08–T17, T20, T26–T31, T33) como baseline |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directivas accionables de `/Users/alejo/Developer/Alejo/reto-eli-1/.claude/CLAUDE.md` que el plan debe respetar:

- Sin comentarios en el código (incluye `web/**/*.{ts,tsx,css}`, `index.html` y, tras esta fase, `tests/**/*.tsx`). Las `description`/`.describe()` son contrato.
- TypeScript estricto sin `any`; `bun run check` (tsc + Biome) debe pasar.
- Sin `enum`; códigos como objetos `as const`; tipos exportados solo en `types/*.type.ts` con solo `type`/`import type`.
- Imports internos solo con alias `@/`, `@tests/`, `@web/`, `@modulo/`; nunca `../` ni `./`.
- Front: solo los paquetes `react`, `react-dom` y `eventsource-parser` en `web/src`; `@/` solo llega a `src/config/constants/**`, `src/config/types/**` y, con `import type`, a `src/http/types/**`.
- Todo texto visible en `web/src/config/strings.ts`; mensajes del servidor como nodos de texto con `white-space: pre-wrap`; nunca `dangerouslySetInnerHTML`, `innerHTML` ni markdown.
- Sin `import.meta.env`, sin `sessionStorage`; `localStorage` solo en `web/src/api/sesion-local.ts` (solo el `sessionId`, nunca el código de acceso).
- Regex solo en `web/src/config/constants/patterns.constants.ts`.
- `*.module.css` sin hex, `rgb()` ni `px` sueltos, solo `var(--…)` de `web/src/styles/tokens.css`.
- Identificadores en español con los nombres de componente de la UI-SPEC.
- Archivos kebab-case (Biome `useFilenamingConvention`).
- Nunca modificar `reto-01/`.
- Commits Conventional Commits con la identidad `elianatorres5772 <elianatorres5772@gmail.com>`.
- Cada regla de forma del código tiene guardián con prueba negativa (`tests/architecture.test.ts` G1–G16, `tests/arquitectura-web.test.ts` W1–W13, `tests/sin-comentarios.test.ts`).
- **La sección "Front web (`web/`)" de CLAUDE.md describe la estructura vieja** (`state/`, `hooks/`, `components/`); esta fase debe actualizarla junto con `docs/estructura.md` y `docs/convenciones.md` (ambos mencionan las rutas viejas) [VERIFIED: grep sobre docs y CLAUDE.md].

## Summary

El refactor es grande pero mecánicamente seguro si se ordena así: **(1)** primero la infraestructura de pruebas DOM y pruebas de caracterización de los componentes actuales; **(2)** después el store puro y sus pruebas; **(3)** después la mudanza feature por feature con los guardianes en modo de transición; **(4)** al final los guardianes estrictos, la marca y la documentación. La conducta queda protegida por las 2496 pruebas existentes (118 archivos, 24.7 s medidos hoy) más las pruebas nuevas con Testing Library, y por la suite eli-qa de la Fase 3 como línea base de navegador.

Hay tres hallazgos que cambian el plan. **Primero:** `@happy-dom/global-registrator` **reemplaza** los globales `fetch`, `Response`, `Request`, `Headers`, `URL`, `AbortController`, `AbortSignal`, `EventTarget`, `Event`, `setTimeout`, `Blob`, `FormData`, `WebSocket`, `navigator` y `File` (exec-verificado). Por eso **no puede ir como preload global** en `bunfig.toml`, porque contaminaría las 2400+ pruebas de backend. Hay que registrarlo por archivo y desregistrarlo en `afterAll`, lo que restaura todos los globales (verificado). **Segundo:** en `bun test` sin `--isolate` la caché de módulos se comparte entre archivos, así que `screen` de Testing Library y el `document` por defecto de `user-event` quedan atados a la ventana del **primer** archivo DOM. El segundo archivo falla con `Could not determine window of node` o, peor, con un `screen` que busca en un `body` viejo sin avisar. La solución verificada es pasar `document` explícito a `userEvent.setup({ document })` y consultar con `within(document.body)` en lugar de `screen`, todo encapsulado en un helper. **Tercero:** el `tsconfig.json` raíz no tiene `jsx` ni `lib: DOM`, e incluye `tests/`. Las pruebas `.test.tsx` necesitan un tercer `tsconfig.dom.json` y un `exclude` en el raíz, y los guardianes G1/G13 y el escáner de comentarios solo miran `tests/**/*.ts`, así que hay que ampliarlos a `.tsx`.

El store se construye con unas 40 líneas propias: un núcleo puro (`leer`, `suscribir`, `despachar`), un Context que transporta la **instancia** (nunca el estado) y un `usarSelector` sobre `useSyncExternalStore`. Toda derivación que crea objetos o arreglos se memoiza por referencia del estado con `WeakMap`. Sin eso React lanza `The result of getSnapshot should be cached to avoid an infinite loop` seguido de `Maximum update depth exceeded` (exec-verificado). `usar-chat.ts` se convierte en un objeto de **acciones** creado junto al store, con las dependencias de red inyectadas, lo que permite probarlo sin DOM con una API falsa.

**Primary recommendation:** Pinear `@testing-library/react@16.3.3`, `@testing-library/dom@10.4.2`, `@testing-library/user-event@14.6.7`, `@happy-dom/global-registrator@20.14.6` y `happy-dom@20.14.6` como devDeps exactas. Registrar happy-dom por archivo a través de un único `tests/helpers/dom.helper.ts` con imports dinámicos. Construir el store con `WeakMap` para memoizar. Mudar primero una feature trazadora completa (`sesion/dialogo-nueva-sesion` + `encabezado`). Bajar las fuentes estáticas por peso desde Fontsource y poner el título con un plugin `transformIndexHtml` probado importando `web/vite.config.ts`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Estructura por features, vistas y hooks | Browser / Client | — | Es código del bundle de la SPA; no toca el backend |
| Store (estado de conversación, salud, diálogo de sesión) | Browser / Client | — | Estado de UI en memoria; la verdad de la sesión sigue en la API (`/api/sessions/:id`) |
| SSE del turno, abortos e hidratación | Browser / Client (`store/acciones` + `api/`) | API / Backend (sin cambios) | El cliente orquesta; el contrato del cable no cambia (FE-06) |
| Derivación de la tarjeta de caso desde el slug | Browser / Client (función pura en `features/chat/estado`) | — | D-113: sin tocar `/api/config` |
| Fuentes, logo y favicon | CDN / Static (servidos por el mismo proceso Hono desde `web/dist`) | — | Archivos de `web/public/` copiados a `web/dist/` por Vite; servidos sin código de acceso |
| `<title>` del documento | Build (plugin de Vite) | Browser (`document.title` en `main.tsx`, ya existe) | El título existe antes de que corra el JS |
| CSP para fuentes e imágenes propias | API / Backend (`securityHeaders` en `server.wiring.ts`) | — | Ya permite `'self'` en `font-src` e `img-src`; no hay que cambiarla |
| Texto de la CLI sin "§" | CLI (`src/config/strings.ts`) | — | `turnoOk` del preflight |

## Standard Stack

### Core (sin cambios de runtime)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react / react-dom | 19.3.0 (ya instalado) | UI, `useSyncExternalStore` | API nativa de React para stores externos; sin dependencias nuevas (D-101) [VERIFIED: package.json] |
| vite | 8.3.3 (ya instalado) | Build; `publicDir` por defecto `web/public` porque `root` es `web/` | Copia `public/` a `dist/` sin hash [VERIFIED: build del spike] |
| eventsource-parser | 4.1.1 (ya instalado) | SSE del turno (sin cambios) | [VERIFIED: package.json] |

### Supporting (devDependencies nuevas, solo pruebas, D-115)
| Library | Version a pinear | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@testing-library/react` | **16.3.3** (2026-08-27) | `render`, `within`, `act`, `cleanup` | Pruebas de componentes con interacción. Peer: `react ^18 \|\| ^19`, `@testing-library/dom ^10` [VERIFIED: npm registry] |
| `@testing-library/dom` | **10.4.2** (2026-09-13) | Peer obligatorio de RTL 16 (ya no viene incluido) | Instalar explícito para fijar la versión [VERIFIED: npm registry] |
| `@testing-library/user-event` | **14.6.7** (2026-09-02) | Teclado (Enter, Shift+Enter, flechas de pestañas), clics y escritura realistas | Compositor, pestañas, diálogos. **No** pinear 14.6.8 (publicada el 2026-10-13, marcada `too-new` por el chequeo de legitimidad) [VERIFIED: npm registry] |
| `@happy-dom/global-registrator` | **20.14.6** (2026-10-08) | `GlobalRegistrator.register()/unregister()` | Mecanismo que recomienda la documentación de Bun [CITED: bun.com/docs/test/dom] |
| `happy-dom` | **20.14.6** | DOM en JS puro (lo instala el registrador con `^20.14.6`; pinearlo explícito lo fija) | Cumple el texto de D-115 ("happy-dom"). **No** usar la 21.x: es un mayor nuevo (21.0.0 del 2026-10-11, 21.0.3 de hace menos de un día) [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Registrar happy-dom por archivo | Preload global en `bunfig.toml` (lo que sugiere la doc de Bun) | **Descartado:** reemplaza `fetch`/`Response`/`Request`/`AbortController`… en todas las pruebas de backend (exec-verificado) |
| Helper con `document` explícito y `within` | `bun test --isolate` en CI y en `package.json` | Funciona y es más robusto (cada archivo con globales frescos; 27.5 s contra 24.7 s, las 2496 pruebas pasan, verificado), pero cambia el comando `bun test` que fijan los criterios de éxito y la CI. `[test] isolate = true` en bunfig **no** existe (verificado: se ignora). Queda como respaldo |
| `@testing-library/jest-dom` | — | **No agregar:** su versión 7.0.1 declara `vitest >= 0.32` como peer, y Bun instala peers, así que traería vitest. Se usan aserciones nativas (`.disabled`, `getAttribute`, `textContent`) [VERIFIED: npm registry] |
| `use-sync-external-store/with-selector` | Memoización propia con `WeakMap` | Agregaría una dependencia de runtime prohibida por D-101 |
| Google Fonts variable (`Montserrat` 400–600 en un solo archivo de 35.5 KB) | Fontsource estático por peso (18.8 + 18.7 KB) | El variable cumple pero rompe el contrato de archivos de la UI-SPEC (`montserrat-latin-400.woff2` y `-600.woff2`) |

**Installation:**
```bash
bun add -d --exact @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/user-event@14.6.7 @happy-dom/global-registrator@20.14.6 happy-dom@20.14.6
```
Agrega 24 paquetes al lockfile; `bun audit` queda en "No vulnerabilities found" (verificado en el spike). La CI ya hace `bun install --frozen-lockfile`, así que hay que commitear `bun.lock`. La etapa de producción del Dockerfile usa `--production`, así que la imagen no cambia.

**Version verification:** `npm view <pkg> time` el 2026-10-16. Las versiones elegidas tienen al menos 8 días y son anteriores a las *latest* marcadas `too-new`.

## Package Legitimacy Audit

| Package | Registry | Age (versión pineada) | Downloads | Source Repo | Verdict (seam, sobre *latest*) | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @testing-library/react | npm | 16.3.3, 7 semanas | 70.3M/sem | github.com/testing-library/react-testing-library | OK | Approved |
| @testing-library/dom | npm | 10.4.2, 5 semanas | 85.4M/sem | github.com/testing-library/dom-testing-library | OK | Approved |
| @testing-library/user-event | npm | 14.6.7, 6 semanas | 58.8M/sem | github.com/testing-library/user-event | SUS (`too-new`, por la *latest* 14.6.8 de hace 3 días) | Flagged: pinear 14.6.7; checkpoint |
| happy-dom | npm | 20.14.6, 8 días | 21.0M/sem | github.com/capricorn86/happy-dom | SUS (`too-new`, por la *latest* 21.0.3 de hace menos de 1 día) | Flagged: pinear 20.14.6; checkpoint |
| @happy-dom/global-registrator | npm | 20.14.6, 8 días | 3.1M/sem | github.com/capricorn86/happy-dom | SUS (`too-new`, por la *latest* 21.0.3) | Flagged: pinear 20.14.6; checkpoint |

Ninguno tiene `postinstall` (seam: `"postinstall": null`). Advisories de happy-dom: GHSA-w4gp-fjgq-3q4g (< 20.8.9), GHSA-6q6h-j7hj-3r64 (≤ 20.8.7), GHSA-qpm2-6cq5-7pq5 (< 20.0.2), GHSA-37j7-fg3j-429f (< 20.0.0) y GHSA-96g7-g7g9-jxw8 (< 15.10.2). La 20.14.6 está por encima de todos los parches [VERIFIED: api.github.com/advisories?affects=happy-dom].

**Packages removed due to [SLOP] verdict:** ninguno.
**Packages flagged as suspicious [SUS]:** `@testing-library/user-event`, `happy-dom` y `@happy-dom/global-registrator`. El motivo es solo `too-new` sobre la *latest*, no sobre la versión pineada. El planner inserta un `checkpoint:human-verify` antes de la instalación. Como la corrida es nocturna (D-104), el checkpoint puede resolverse de forma automática y auditable: `npm view <pkg>@<ver> time` (≥ 7 días), `bun audit` limpio y `npm view <pkg>@<ver> scripts.postinstall` vacío, con la salida pegada en el SUMMARY.

## Architecture Patterns

### System Architecture Diagram

```
 Navegador
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ main.tsx ──crea──> almacen (store único) ──recibe──> dependencias (api/*)     │
 │    │                     ▲   │ notifica                                       │
 │    ▼                     │   ▼                                                │
 │ <App almacen> ─> <ProveedorAlmacen> (Context = instancia, no estado)          │
 │                     │                                                         │
 │                     ▼                                                         │
 │   features/disposicion/columnas (vista) ── usar-columnas.ts (hook)            │
 │        │                                     │ usarSelector(selector memo)    │
 │        ▼                                     │ usarAcciones()                 │
 │   features/<f>/<c>/<c>.tsx  <── props ──  usar-<c>.ts ──> store/acciones ──┐  │
 │   (solo presentación:                       (lógica, efectos,             │  │
 │    strings, constants, css)                  refs, useId)                 │  │
 │                                                                           ▼  │
 │   features/<f>/estado/*.ts  <── reductores puros ── store/raiz.ts    api/*.ts │
 │   (sin React ni navegador)                                     (fetch, SSE,   │
 │                                                                localStorage)  │
 └──────────────────────────────────────────────────────────────────────┬───────┘
                                                                        │ HTTP / SSE (contrato sin cambios)
                                                                        ▼
 Servidor Hono (mismo proceso)  /api/*  ──requireAccess──> rutas
                                 *     ──serveStatic(web/dist)──> /assets, /fuentes/*.woff2, /marca/*  (sin acceso)
                                       └─ si no existe ──> index.html (comodín SPA)
```

### Recommended Project Structure
```
web/
├── index.html                 # <title>%TITULO_DOCUMENTO%</title>, favicon, preload de 2 fuentes, theme-color
├── public/
│   ├── fuentes/               # outfit-latin-600.woff2, montserrat-latin-{400,600}.woff2, OFL-Outfit.txt, OFL-Montserrat.txt
│   └── marca/                 # periferia-it-group.webp (248×62), favicon.jpg (512×512)
├── vite.config.ts             # + plugin tituloDelDocumento (transformIndexHtml)
└── src/
    ├── main.tsx               # crea el almacen real y monta <App almacen={…}/>
    ├── app.tsx                # solo <ProveedorAlmacen> + <Columnas/> (o <Disposicion/>)
    ├── api/                   # cliente-api.ts, flujo-chat.ts, sesion-local.ts, descarga-local.ts (sin cambios)
    ├── store/
    │   ├── almacen.ts         # núcleo puro: crearAlmacen(reductor, inicial) → { leer, suscribir, despachar }
    │   ├── raiz.ts            # EstadoRaiz + reducirRaiz (combina slices; puro)
    │   ├── selectores.ts      # selectores memoizados por referencia (puros)
    │   ├── acciones.ts        # crearAcciones(almacen, dependencias): absorbe usar-chat.ts (sin React)
    │   ├── dependencias.ts    # dependencias reales: importa @web/api/* (único lugar del store que ve la red)
    │   ├── proveedor-almacen.tsx  # Context.Provider
    │   └── usar-almacen.ts    # usarSelector, usarAcciones (React)
    ├── features/
    │   ├── acceso/{pantalla-acceso,pantalla-carga}/
    │   ├── encabezado/{encabezado,aviso-modelo}/  + estado/modelo.ts
    │   ├── chat/{linea-de-tiempo,mensaje,indicador-pensando,compositor,acciones-rapidas,estado-vacio,tarjeta-caso}/
    │   │        + estado/{conversacion,seguimiento,tarjeta-caso}.ts
    │   ├── herramientas/{grupo-herramientas,tarjeta-herramienta}/
    │   ├── confirmacion/tarjeta-confirmacion/ + estado/confirmaciones.ts
    │   ├── casos/{panel-casos,progreso-caso,tarjeta-resultado}/ + estado/casos.ts
    │   ├── archivos/{lista-archivos,dialogo-vista-previa,aviso-disco-efimero}/ + estado/vista-previa.ts
    │   ├── sesion/dialogo-nueva-sesion/ + estado/{hidratacion,dialogo-sesion}.ts
    │   └── disposicion/{barra-pestanas,columnas}/
    ├── compartido/{aviso,iconos,logo-marca}/
    ├── config/strings.ts  config/constants/{ui,patterns,marca,pais}.constants.ts
    ├── styles/{tokens,global}.css
    └── types/*.type.ts        # se quedan centralizados (discreción; W10 no cambia de ruta)
```
`usar-reintento-config.ts` no figura en D-119. Recomendación: absorberlo en el efecto de configuración del store (`store/usar-almacen.ts` o un `usar-<c>.ts` de `disposicion/columnas`), y conservar su conducta exacta: intervalo `REINTENTO_CONFIG_MS` y reintento al volver a la pestaña.

### Pattern 1: Store propio (núcleo puro + Context de instancia + selector)
**What:** el store guarda el estado fuera de React; el Context transporta la instancia estable; cada componente se suscribe con `useSyncExternalStore` a un selector.
**When to use:** todo el estado de aplicación (conversación, salud, diálogo de nueva sesión). El estado efímero de una vista (código visible, foco, seguimiento del scroll, pestaña activa) se queda en el `usar-<c>.ts` con `useState`/`useRef`.
**Example (propuesta; nombres a criterio del planner):**
```typescript
export function crearAlmacen<E, A>(reducir: (estado: E, accion: A) => E, inicial: E): Almacen<E, A> {
  let estado = inicial;
  const oyentes = new Set<() => void>();
  return {
    leer: () => estado,
    suscribir: (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    despachar: (accion) => {
      const siguiente = reducir(estado, accion);
      if (Object.is(siguiente, estado)) return;
      estado = siguiente;
      for (const oyente of oyentes) oyente();
    },
  };
}

export function usarSelector<T>(seleccionar: (estado: EstadoRaiz) => T): T {
  const almacen = usarAlmacen();
  return useSyncExternalStore(almacen.suscribir, () => seleccionar(almacen.leer()));
}
```
Reglas: `suscribir` debe ser estable (sale de la instancia, así que lo es). El Context **nunca** lleva el estado (si lo llevara, cada evento SSE re-renderizaría todo el árbol). El store se crea una sola vez fuera del render (en `main.tsx` o en un inicializador de `useState`), porque `StrictMode` invoca dos veces los renders y los inicializadores en desarrollo.

### Pattern 2: Selectores memoizados por referencia (obligatorio)
**What:** todo selector que construye un objeto o un arreglo nuevo (por ejemplo `progresoPorCaso`, `marcasDeArchivos`, `resultadosPorCaso`, `usoDeSesion`) se envuelve para devolver la misma referencia mientras la porción del estado de la que depende no cambie.
```typescript
export function memoizarPorReferencia<O extends object, T>(derivar: (origen: O) => T): (origen: O) => T {
  const cache = new WeakMap<O, T>();
  return (origen) => {
    const previo = cache.get(origen);
    if (previo !== undefined) return previo;
    const nuevo = derivar(origen);
    cache.set(origen, nuevo);
    return nuevo;
  };
}
```
Verificado en el spike: sin memo React emite `The result of getSnapshot should be cached to avoid an infinite loop` y lanza `Maximum update depth exceeded`; con `WeakMap` no hay ningún `console.error`. Los reductores ya devuelven la misma referencia cuando la acción no aplica (por ejemplo `default: return estado` en `reducirConversacion`, `web/src/state/conversacion.ts:417-418`), y eso es lo que hace funcionar la memo. Para selectores que devuelven primitivos (`estado.conversacion.enCurso`) no hace falta memo. **Prueba recomendada:** recorrer los selectores exportados y comprobar `Object.is(sel(e), sel(e))` sobre un estado de muestra.

### Pattern 3: Acciones del store (absorben `usar-chat.ts`)
**What:** `crearAcciones(almacen, dependencias)` devuelve `{ cambiarBorrador, enviar, enviarTexto, responderConfirmacion, recibirConfig, detener, recargar, nuevaSesion, volverASesionAnterior, vencerAcceso, hidratar, refrescarSalud }`. El `AbortController` del turno activo vive en el cierre de la instancia, como hoy en `turnoActivo` (`useRef`) de `web/src/hooks/usar-chat.ts:33`.
**Mapeo exacto desde `usar-chat.ts` (verbatim de `web/src/hooks/usar-chat.ts:65-135`):**
- `iniciarTurno` mantiene sus guardas `mensaje.length === 0 || estado.enCurso || estado.hidratando || turnoActivo.current !== null`, ahora con `almacen.leer()`. Despacha `{ tipo: ACCION_UI.ENVIAR, mensaje }` o con `accion`, y llama `enviarTurno(pedido, despacharDelTurno, controlador.signal, alTerminarTurno)`. `despacharDelTurno` descarta lo que llega tras abortar y guarda el `sesionId` con `guardarSesionId` cuando `sesionDelEvento` no es `null`.
- `alTerminarTurno` es `refrescarSalud` (hoy `useChat(refrescar)` en `app.tsx:132`). **No** agregar sondeo por intervalo de `/api/health`: lo prohíbe T33 de la suite eli-qa 03.
- `detener`, `nuevaSesion` y `volverASesionAnterior` conservan `sincronizarSesionGuardada` con `sesionGuardadaTras` y `leerSesionGuardada/guardarSesionId/olvidarSesion` de `sesion-local.ts`.
- La hidratación sigue siendo un efecto de React (en un hook) con deps `[accesoConcedido, sesionPorCargar]` que aborta al limpiar, como en `usar-chat.ts:52-59`. **No** convertirla en suscripción imperativa, para conservar la semántica de StrictMode y de recarga (T14, T31).
- `dependencias` se inyecta (`{ enviarTurno, obtenerSesionAsentada, obtenerConfig, obtenerSalud, entrar, listarArchivos, descargarArchivo, obtenerVistaPrevia, leerSesionGuardada, guardarSesionId, olvidarSesion }`). Así las acciones se prueban sin DOM con funciones falsas (`tests/web/store/acciones.test.ts`) y los componentes con un store falso.

### Pattern 4: Vista + hook por componente
**What:** `<c>.tsx` recibe solo lo que pinta (strings, valores ya derivados, callbacks y refs) desde `use<C>()`, definido en `usar-<c>.ts`. El hook concentra `useId`, `useRef`, `useState`, `useEffect`, los selectores, las acciones y las funciones puras de `estado/`.
**Convención de nombres:** archivo `usar-<c>.ts`, export `use<Componente>` (el prefijo `use` lo exigen las reglas de hooks de React y de Biome; ya es la convención actual: `usar-chat.ts` exporta `useChat`).
**Casos que hoy rompen la separación y hay que mover al hook** [VERIFIED: grep de imports en `web/src/components`]:
- `pantalla-acceso.tsx` importa `entrar` de `@web/api/cliente-api.ts`.
- `dialogo-vista-previa.tsx` importa `obtenerVistaPrevia` y funciones de `@web/state/*`.
- `lista-archivos.tsx` importa `nombreDeDescarga` y `rutaDeDescarga` de `@web/api/cliente-api.ts`.
- `panel-casos.tsx` importa `useArchivos` y `discoBorrado`.
- `linea-de-tiempo.tsx` importa `reducirSeguimiento`, `anuncioDeEstado`, `tarjetasDelTurno` y `resultadosDelTurno`.
- `grupo-herramientas.tsx`, `tarjeta-resultado.tsx`, `tarjeta-confirmacion.tsx` y `tarjeta-herramienta.tsx` importan funciones puras de `@web/state/*`.
- `app.tsx` contiene `BarraDePestanas`, `pestanaPorTecla` y `atributosDeVista` (pasan a `disposicion/`).

### Pattern 5: Pruebas DOM con happy-dom por archivo (verificado)
```typescript
import { afterAll, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

export async function prepararDom() {
  GlobalRegistrator.register({ url: "http://localhost:3000/" });
  const rtl = await import("@testing-library/react");
  const { default: userEvent } = await import("@testing-library/user-event");
  afterEach(() => rtl.cleanup());
  afterAll(async () => {
    await GlobalRegistrator.unregister();
  });
  return {
    render: rtl.render,
    act: rtl.act,
    pantalla: () => rtl.within(document.body),
    usuario: () => userEvent.setup({ document }),
  };
}
```
Uso en `tests/web/dom/<componente>.test.tsx`:
```typescript
const { render, pantalla, usuario } = await prepararDom();
const { AccionesRapidas } = await import("@web/features/chat/acciones-rapidas/acciones-rapidas.tsx");
```
Por qué así (todo exec-verificado en Bun 1.4.3):
- Los `import` estáticos de RTL se evalúan **antes** que un import de efecto lateral puesto primero, porque los paquetes CJS se evalúan al enlazar. `screen` queda sin `document` y lanza `For queries bound to document.body a global document has to be available`. Por eso RTL y los componentes se importan con `await import()` **después** de `register()`.
- Sin `--isolate`, el segundo archivo DOM falla con `userEvent.setup()` porque `defaultOptionsSetup.document` se capturó del primer `window` (`node_modules/@testing-library/user-event/dist/esm/setup/setup.js:23`: `document: globalThis.document,`). `screen` también queda atado al `body` viejo: busca y **no encuentra**. Con `setup({ document })` y `within(document.body)`, dos archivos DOM seguidos más uno de backend pasan en `bun test`, con `--isolate` y con `--parallel=2`.
- El `cleanup` automático de RTL solo se registra en el primer archivo que lo importa (caché de módulos), así que el helper registra `afterEach(cleanup)` por archivo.
- `unregister()` restaura todos los globales nativos (verificado: `sin restaurar tras unregister:` vacío y `document` vuelve a `undefined`).
- React 19.3 + RTL 16.3.3 no producen ningún `console.error` de `act` en render, clic, escritura ni despacho externo envuelto en `act` (verificado).
- Los `*.module.css` importados en `bun test` resuelven a `{}`, así que las clases son `undefined`. **No** afirmar clases; afirmar roles, nombres accesibles, `disabled`, `aria-*` y `data-*`.
- happy-dom 20.14.6 trae `ResizeObserver`, `IntersectionObserver`, `matchMedia` (que responde según `width` del registro), `HTMLDialogElement.showModal`, `requestAnimationFrame` y `scrollTo` (verificado). `register({ width: 375 })` sirve para probar el diseño angosto.

### Pattern 6: `<title>` desde `TEXTO_APP.tituloDocumento` en el build (verificado)
```typescript
import { TEXTO_APP } from "@web/config/strings.ts";

function tituloDelDocumento(): Plugin {
  return {
    name: "titulo-del-documento",
    transformIndexHtml: (html) => html.replace(MARCADOR_TITULO, TEXTO_APP.tituloDocumento),
  };
}
```
`web/index.html` lleva `<title>%TITULO_DOCUMENTO%</title>`. Verificado: `bun run build:web` con `--configLoader native` resuelve `@web/` desde `web/vite.config.ts` y produce `<title>Registro como proveedor · Periferia IT Group</title>`. La prueba importa `web/vite.config.ts` en `bun test`, busca el plugin por `name`, aplica `transformIndexHtml` al `web/index.html` real y compara con `TEXTO_APP.tituloDocumento` (verificado: pasa en 90 ms y no necesita el build). El marcador va como constante (en `vite.config.ts` o en `config/constants`). Conviene escapar `&` y `<` del texto. `main.tsx:9` ya hace `document.title = TEXTO_APP.tituloDocumento`; puede quedarse (idempotente).

### Anti-Patterns to Avoid
- **Preload global de happy-dom:** cambia `fetch`/`Response`/`AbortController` para todo el backend.
- **`screen` de RTL en más de un archivo sin `--isolate`:** falla en silencio (busca en un `body` viejo).
- **Context con el estado adentro:** re-render total por cada evento SSE.
- **Selector que hace `.map`/`.filter`/`{...}` sin memo:** bucle infinito en `useSyncExternalStore`.
- **Crear el store dentro del render:** StrictMode lo duplica.
- **Partir `EstadoConversacion` en slices independientes con `combineReducers` ingenuo:** `agregarTurno` llama a `marcarEnviando` y `terminarTurno` llama a `reducirConfirmaciones` con el turno (`conversacion.ts:99-122`), así que confirmaciones depende del turno. Hay que conservar `reducirConversacion` como reductor del slice `conversacion` (mueve de archivo, no de forma) y combinarlo en la raíz con slices nuevos e independientes (`salud`, `dialogoSesion`). Las 781 líneas de `tests/web/conversacion.test.ts` siguen aplicando.
- **Afirmar el código fuente con `toContain("onClick={…}")`:** se rompe con cualquier mudanza. Reemplazarlo por pruebas de conducta con Testing Library.
- **Cambiar `CLAVE_SESION_LOCAL`** (`"registro-proveedor.sesion-id"`, `web/src/config/constants/ui.constants.ts`): los navegadores con sesión guardada la perderían (cambio de conducta).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM para pruebas | `new Window()` y asignar globales a mano | `@happy-dom/global-registrator` | `register`/`unregister` restaura exactamente lo que cambió (15 globales verificados) |
| Interacción de teclado y foco | `fireEvent.keyDown` encadenados | `@testing-library/user-event` 14.6.7 | Secuencias reales (keydown/keypress/input/keyup), foco y `{Enter}`/`{Shift>}{Enter}` |
| Parseo SSE | Otro parser | `eventsource-parser` (ya está) | Sin cambios |
| Fuentes subconjunto | Subsetear con fonttools | Archivos de Fontsource (`cdn.jsdelivr.net/fontsource/fonts/<familia>@latest/latin-<peso>-normal.woff2`) | Mismas versiones que Google (Montserrat v31, Outfit v15) con `unicode-range` latino; sin herramientas nuevas |
| Store | Zustand / Redux | `useSyncExternalStore` + ~40 líneas | Bloqueado por D-101; es el mecanismo oficial de React para stores externos |

**Key insight:** lo que sí se escribe a mano (store y memo) es pequeño y está cubierto por pruebas puras. Todo lo que tiene muchos casos borde (DOM, eventos de usuario, SSE) viene de librerías maduras y queda **solo en devDeps**.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage["registro-proveedor.sesion-id"]` en los navegadores de la usuaria y de los evaluadores (`CLAVE_SESION_LOCAL`, `web/src/config/constants/ui.constants.ts`). Cookie firmada de acceso (servidor; no cambia) | Ninguna: **no renombrar la clave**. Que `sesion-local.ts` siga siendo su único dueño (W7) |
| Live service config | Servicio Render `registro-proveedor` (Blueprint con `autoDeployTrigger: checksPass`, `render.yaml`); el deploy se dispara con el push a `main` si la CI pasa | Ninguna de configuración. La CI debe pasar con el `bun.lock` nuevo; calentar el servicio antes de la QA del link público (`/api/health` respondió 200 el 2026-10-16) |
| OS-registered state | Ninguno: verificado, no hay tareas, servicios ni plists del proyecto | Ninguna |
| Secrets/env vars | `ACCESS_CODE`, `LLM_API_KEY` y `ACCESS_TOKEN_SECRET` en Render; ningún nombre cambia | Ninguna |
| Build artifacts | `web/dist/` (en .gitignore; se regenera en `build:web` y en el Dockerfile); imagen Docker de Render (se reconstruye en el deploy); caché del navegador de `index.html` (sin hash) | Reconstruir. Confirmar que `web/dist/fuentes/` y `web/dist/marca/` existen tras el build (el Dockerfile ya copia `web` completo en la etapa `build` y `web/dist` en la final) |

## Common Pitfalls

### Pitfall 1: happy-dom contamina el backend
**What goes wrong:** pruebas de Hono, SSE y `fetch` falsos fallan de forma intermitente según el orden de archivos.
**Why it happens:** `GlobalRegistrator.register()` reemplaza `fetch, Response, Request, Headers, URL, AbortController, AbortSignal, EventTarget, Event, setTimeout, Blob, FormData, WebSocket, navigator, File` (salida literal del spike).
**How to avoid:** nunca preload global; registrar solo en `prepararDom()` con `unregister()` en `afterAll`. Agregar una prueba centinela de backend que afirme `typeof document === "undefined"` y `String(fetch).includes("[native code]")`.
**Warning signs:** fallos que aparecen o desaparecen con `--randomize`.

### Pitfall 2: Estado viejo entre archivos DOM
**What goes wrong:** `Could not determine window of node. Node was [object HTMLDocument]`, o `screen.getBy…` que no encuentra lo que se ve.
**How to avoid:** `userEvent.setup({ document })` y `within(document.body)`; el helper no expone `screen`. Opcional: un guardián que prohíba `screen` y `userEvent.setup()` sin argumentos en `tests/**/*.tsx`.

### Pitfall 3: `tsc` del raíz rompe con `.tsx` en `tests/`
**What goes wrong:** `TS17004 Cannot use JSX unless the '--jsx' flag is provided`, `Cannot find name 'document'` (salida literal del spike).
**How to avoid:** `tsconfig.dom.json` en la raíz con `lib: ["ES2023","DOM","DOM.Iterable"]`, `jsx: "react-jsx"`, `types: ["bun","vite/client"]` (`vite/client` declara los `*.module.css`) y `paths` de `@/`, `@tests/` y `@web/`. Su `include` son `tests/web/dom` y `tests/helpers/dom.helper.ts`. El `tsconfig.json` raíz suma `"exclude": ["tests/web/dom", "tests/helpers/dom.helper.ts"]`. `check` pasa a `tsc --noEmit && tsc --noEmit -p web/tsconfig.json && tsc --noEmit -p tsconfig.dom.json && biome check .`. En el spike, la combinación de `bun` + `lib DOM` no dio errores de tipos duplicados. Nombrar el archivo `tsconfig.dom.json` y no `tests/web/dom/tsconfig.json`, porque Bun usa el `tsconfig.json` más cercano para resolver alias.

### Pitfall 4: Los guardianes no ven `.tsx` en `tests/`
**What goes wrong:** una prueba `.test.tsx` con `../` o con comentarios pasa los guardianes.
**Why it happens:** `tests/architecture.test.ts` escanea con `Bun.Glob(\`${carpeta}/**/*.ts\`)` (`escanearCarpetas`, líneas 513-517), y `tests/sin-comentarios.test.ts` lista `tests/**/*.ts` (línea 30-32).
**How to avoid:** ampliar ambos a `{ts,tsx}` y agregar a `NOMBRES_CON_ROL` el patrón `^tests/(?!unit/)(?:KEBAB/)*KEBAB\.test\.tsx$`, cada cambio con su prueba negativa.

### Pitfall 5: `SOLUCION.md` §6 debe listar cada devDep con su versión exacta
**What goes wrong:** `tests/docs/solucion.test.ts` ("§6 justifica cada dependencia de package.json con su versión exacta", líneas 185-192) falla al agregar las devDeps.
**How to avoid:** en el **mismo** commit que `package.json`, agregar a la tabla de `SOLUCION.md` §6 una fila por paquete, con nombre, versión exacta, "desarrollo" y el porqué.

### Pitfall 6: Ruta mal escrita de un asset responde `index.html` con 200
**What goes wrong:** `/fuentes/montserrat-latin-400.woff` (sin "2") responde el `index.html` del comodín SPA con `text/html` y status 200; el navegador descarta la fuente y cae en silencio a la pila del sistema.
**Why it happens:** `registerStaticRoutes` registra un segundo `serveStatic` con `path: ARCHIVO_INDEX_WEB` como respaldo (`src/http/routes/static.route.ts:15-16`).
**How to avoid:** una prueba estática que extraiga todas las URL `/fuentes/…` y `/marca/…` de `web/index.html`, `web/src/styles/global.css` y `marca.constants.ts` y compruebe que existen en `web/public/`. Agregar a `tests/http/estatico.test.ts` casos `.woff2` → `font/woff2`, `.webp` → `image/webp` y `.jpg` → `image/jpeg` sin cookie de acceso. Los tipos MIME salen de Hono: `jpg: "image/jpeg"`, `webp: "image/webp"`, `woff2: "font/woff2"` (`node_modules/hono/dist/utils/mime.js:36,65,67`, Hono 4.13.13). No cambiar el comodín (sería un cambio de conducta del servidor).

### Pitfall 7: Pruebas que leen rutas viejas o textos con "§"
Pruebas que se rompen con la mudanza o con D-118 [VERIFIED: grep en tests/]:
- `tests/web/acciones-rapidas.test.ts:8` lee `web/src/components/acciones-rapidas.tsx` y afirma fragmentos de fuente (líneas 55-65); las líneas 26 y 44 esperan `"Demo §11: ec-corp-andina"` y `"Demo §11"`. Reescribir a `"Demo del PRD: ec-corp-andina"` / `"Demo del PRD"` (UI-SPEC, Copywriting) y convertir las afirmaciones de fuente en pruebas DOM. La afirmación `promptDelPrd() === TEXTO_ACCIONES.mensajeDemo` se conserva.
- `tests/web/estado-del-modelo.test.ts:142-155` lee `web/src/components/aviso-modelo.tsx` y prohíbe `@web/api/`, `@web/hooks/` y `@web/state/`. Lo reemplazan W15 y una prueba DOM de "Comprobar de nuevo".
- `tests/arquitectura-web.test.ts` fija `web/src/state/conversacion.ts` (línea 205), `web/src/components/aviso.module.css` (línea 257), `CARPETA_DE_ESTADO = "web/src/state/"` (línea 33) y los patrones de W13 (líneas 59-67).
- Diez archivos de `tests/web/*.test.ts` importan `@web/state/{conversacion,casos,confirmaciones,hidratacion,modelo,seguimiento,vista-previa}.ts`: actualizar los imports al mover cada reductor.
- `tests/cli/preflight.test.ts:642` compara `TEXTO_PREFLIGHT.mensajeGuion` con `TEXTO_ACCIONES.mensajeDemo`: **`mensajeDemo` debe seguir siendo un string** (`mensajeDemoDe(CASO_DEMO_PRD)`), no una función.
- `src/config/strings.ts:509` `turnoOk: (numero: number): string => \`Turno ${numero} del guion del PRD §11 OK.\`` pasa a "Turno {n} del guion de la sección 11 del PRD OK." (UI-SPEC). `tests/cli/preflight.test.ts:531-532,759` usa `TEXTO_PREFLIGHT.turnoOk(…)` por referencia, así que no se rompe.
- `tests/sin-comentarios.test.ts:64` y `tests/arquitectura-web.test.ts:204` esperan `web/src/app.tsx`, que se conserva.

### Pitfall 8: Montserrat de Google es variable
**What goes wrong:** si se baja de `fonts.gstatic.com`, 400 y 600 apuntan al **mismo** archivo (`JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2`, 35 508 bytes); dos `@font-face` con el mismo `src` y nombres de archivo distintos son engañosos.
**How to avoid:** usar los estáticos de Fontsource, que ya tienen el nombre del contrato: montserrat 400 de 18 780 B, 600 de 18 688 B y outfit 600 de 14 140 B (todos WOFF2 verificados con `file`).

### Pitfall 9: Logo de baja resolución
**What goes wrong:** el webp mide 248×62 px; a 40 px de alto en pantallas 2x se necesitan unos 320 px físicos de ancho, así que se verá levemente suave en la pantalla de acceso.
**How to avoid:** aceptarlo (es el asset oficial, D-108) o, si hay un SVG oficial, cambiarlo luego (reversible). No escalar por encima de 62 px de alto CSS.

### Pitfall 10: Unidades sueltas que W12 hoy no ve
Violaciones actuales que un W12 ampliado detectaría [VERIFIED: grep]: `global.css:19` `100dvh`, `global.css:146` `360deg`, `global.css:152` `0ms`, `pantalla-acceso.module.css:105` `40em` (media query), `90deg` en `linea-de-tiempo.module.css:80`, `panel-casos.module.css:67`, `grupo-herramientas.module.css:24` y `tarjeta-herramienta.module.css:31`, y `tarjeta-herramienta.module.css:73` `40%`. Las variables CSS **no** funcionan dentro de `@media (…)`, así que la regla debe eximir las líneas `@media`.

## Code Examples

### Derivación de la tarjeta de caso (pura, sin regex por W11)
```typescript
export function datosDeTarjetaCaso(slug: string): DatosTarjetaCaso {
  const guion = slug.indexOf(SEPARADOR_SLUG);
  const prefijo = guion > 0 ? slug.slice(0, guion) : null;
  const pais = prefijo !== null && esPaisConocido(prefijo) ? prefijo : null;
  if (pais === null) return { slug, pais: null, codigo: null, nombrePais: null, cliente: slug };
  const cliente = slug
    .slice(guion + 1)
    .split(SEPARADOR_SLUG)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
  return { slug, pais, codigo: pais.toUpperCase(), nombrePais: TEXTO_PAIS[pais], cliente };
}
```
Los casos de fixtures que deben dar las 4 tarjetas son `co-industrias-delta`, `ec-corp-andina`, `hn-agroexport-sula` y `pa-logistica-istmo` [VERIFIED: `tests/web/acciones-rapidas.test.ts:33`, que los lista desde `reto-01/fixtures/reto-01/casos`]. `PAIS`, `SEPARADOR_SLUG` y `TEXTO_PAIS` son nombres propuestos [ASSUMED].

### Plantilla de mensaje sin duplicar texto (D-112)
```typescript
mensajeDemoDe: (caso: string) => `Procesa el caso "${caso}". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.`,
mensajeDemo: <el mismo mensajeDemoDe aplicado a CASO_DEMO_PRD, como string>,
```
Hoy `mensajeDemo` es el literal con `${CASO_DEMO_PRD}` (`web/src/config/strings.ts:282`) y `CASO_DEMO_PRD = "ec-corp-andina"` (`web/src/config/constants/ui.constants.ts:153`). Como un literal de objeto no puede referenciar a un hermano, la plantilla se declara antes como función local (`function mensajeDemoDe(caso: string): string`) y el objeto expone ambas.

### `@font-face` (contrato de la UI-SPEC)
```css
@font-face {
  font-family: "Outfit";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/fuentes/outfit-latin-600.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```
Verificado: Vite deja `url(/fuentes/outfit-latin-600.woff2)` sin hash en el CSS de `dist`. `font-weight: 600` y la línea `unicode-range` no contienen `px` ni hex; W12 ampliado debe aceptar `global.css` con `@font-face`. El `unicode-range` es el que sirve hoy Google CSS2 para `/* latin */` (verificado con curl).

### Guardián de carpeta de componente (W14) con retro-referencia
```typescript
const COMPONENTE_DE_FEATURE = new RegExp(
  `^web/src/features/${KEBAB}/(${KEBAB})/(?:\\1\\.tsx|usar-\\1\\.ts|\\1\\.module\\.css)$`,
);
const COMPONENTE_COMPARTIDO = new RegExp(
  `^web/src/compartido/(${KEBAB})/(?:\\1\\.tsx|usar-\\1\\.ts|\\1\\.module\\.css)$`,
);
```
Además, una regla de completitud: cada carpeta de componente tiene exactamente un `<c>.tsx`, y si existe `usar-<c>.ts` o `<c>.module.css` existe también la vista. `KEBAB` es la constante vigente `"[a-z0-9]+(?:-[a-z0-9]+)*"` (`tests/arquitectura-web.test.ts:57`).

## Reescritura de guardianes (FE-04)

Patrones vigentes de W13, verbatim de `tests/arquitectura-web.test.ts:59-67`:
```
/^web\/src\/(?:main|app)\.tsx$/,
/^web\/src\/config\/strings\.ts$/,
new RegExp(`^web/src/config/constants/${KEBAB}\\.constants\\.ts$`),
new RegExp(`^web/src/types/${KEBAB}\\.type\\.ts$`),
new RegExp(`^web/src/(?:api|state|hooks)/${KEBAB}\\.tsx?$`),
new RegExp(`^web/src/components/(?:icons/)?${KEBAB}\\.(?:tsx|module\\.css)$`),
new RegExp(`^web/src/styles/${KEBAB}\\.css$`),
```

| Regla | Hoy | Después (propuesta) | Prueba negativa nueva o ajustada |
|---|---|---|---|
| W1 relativos | todo `web/src` | sin cambio | sin cambio |
| W2 paquetes | react, react-dom, eventsource-parser | sin cambio (Testing Library vive en `tests/`) | sin cambio |
| W3 alias `@/` | config pura + `import type` http/types | sin cambio | sin cambio |
| W4 estado puro | `web/src/state/` | `web/src/features/*/estado/**` y `web/src/store/{almacen,raiz,selectores}.ts` | muestra en `web/src/features/chat/estado/x.ts` y en `web/src/store/raiz.ts`; `store/acciones.ts` no aplica |
| W5–W7, W9, W11 | — | sin cambio (`DUENO_DE_ALMACEN_LOCAL` sigue en `web/src/api/sesion-local.ts`) | sin cambio |
| W8 texto | literales y JSX | igual + `web/index.html` sin texto entre etiquetas (el título viene del plugin) | muestra de `<title>Hola mundo</title>` |
| W10 tipos | `web/src/types/*.type.ts` | **sin cambio de ruta** (recomendado; discreción) | sin cambio |
| W12 CSS | `*.module.css`: hex, rgb, px | todo `web/src/**/*.css` salvo `tokens.css`; además `rem/em/vh/vw/dvh/ms/s/deg` sueltos fuera de líneas `@media` | muestra con `90deg`, `100dvh` y `@media (min-width: 40em)` (esta última no reporta) |
| W13 ubicación | patrones de arriba | `main/app`, `strings`, `constants`, `types`, `api/KEBAB.ts`, `store/(KEBAB.ts\|proveedor-almacen.tsx)`, `features/KEBAB/estado/KEBAB.ts`, `COMPONENTE_DE_FEATURE`, `COMPONENTE_COMPARTIDO`, `styles/(tokens\|global).css` | muestras: `web/src/features/chat/x.tsx` (suelto), `web/src/features/chat/a/b.tsx` (nombre distinto), `web/src/components/aviso.tsx` (ruta vieja) |
| **W14** carpeta de componente | — | exactamente una vista por carpeta y nada huérfano | carpeta con solo `usar-x.ts`; carpeta con dos `.tsx` |
| **W15** vista sin red ni estado | — | un `features/**/<c>.tsx` o `compartido/**/<c>.tsx` solo importa: su `usar-<c>.ts`, su `<c>.module.css`, otras vistas `.tsx`, `@web/config/**`, `import type` de `@web/types/**` y `react`; **nunca** `@web/api/**`, `@web/store/**`, `@web/features/*/estado/**`, otro `usar-*.ts` ni valores de `react` (hooks) | muestra que importa `@web/api/cliente-api.ts`, `useState` y `usar-otro.ts` |
| **W16** `api/` transversal (D-122) | — | `@web/api/**` solo desde `usar-*.ts`, `web/src/store/**` y la propia `api/` | muestra en `features/chat/estado/x.ts` importando api |
| **W17** CSS propio | — | una vista importa solo su `<c>.module.css`, y ningún `.ts` importa un `.module.css` | vista que importa el CSS de otra |
| **W18** valores mágicos en vistas | — | en `.tsx`: sin números distintos de `0`, `1` y `-1` (fuera de cadenas, tras `Bun.Transpiler`), sin `style=` y sin colores hex/rgb | muestra con `width={24}`, `style={{…}}` y `fill="#fff"` |
| **W19** sin "§" (D-118) | — | ni en `web/src/config/strings.ts`, ni en `src/config/strings.ts`, ni en `web/index.html` | muestra con `"Demo §11"` |
| **W20** uso del store | — | `createContext`, `useContext`, `useReducer` y `useSyncExternalStore` solo en `web/src/store/**`, salvo `useSyncExternalStore` en el hook de diseño de `disposicion` (fuente `matchMedia`) | muestra con `useReducer` en un `usar-x.ts` |
| **W21** reductores y selectores estables | — | prueba de propiedad: cada selector exportado de `store/selectores.ts` devuelve `Object.is` lo mismo dos veces sobre el mismo estado | selector de muestra sin memo que la prueba detecta |
| G1/G13 y comentarios | `tests/**/*.ts` | `tests/**/*.{ts,tsx}` | muestra de `tests/web/dom/x.test.tsx` con `../` y con comentario |

En W15 la detección debe distinguir `import type` de `import` de valor: usar `extraerImportacionesConTipo` (ya devuelve `soloTipo`) de `tests/helpers/escaner-fuentes.helper.ts:27-36`. Para W18 se reutilizan `literalesDeTexto` y `Bun.Transpiler`, como W8. Durante la mudanza W13 puede aceptar a la vez las rutas viejas y las nuevas; **el último plan de la mudanza** quita las viejas.

## Mapa de migración y orden (FE-06)

**Orden recomendado (cada plan deja `bun run check` y `bun test` en verde):**
1. **Línea base:** `bun run check`, `bun test` (hoy: `Ran 2496 tests across 118 files. [24.65s]`, 0 fallos, medido el 2026-10-16), `bun run demo.ts` y `bun run build:web`. eli-qa captura el "antes" en local y en el link público con las suites 03 (T08–T17, T20, T26–T31) a 1280×720, 800×900 y 375×667.
2. **Infra de pruebas DOM:** devDeps (con checkpoint) + `SOLUCION.md` §6 en el mismo commit, `tsconfig.dom.json`, `exclude` en el raíz, `check` con el tercer `tsc`, `dom.helper.ts`, ampliación de G1/G13 y del escáner de comentarios a `.tsx`, y la prueba centinela de globales.
3. **Pruebas de caracterización** con Testing Library sobre los componentes **actuales**: Compositor (Enter envía, Shift+Enter salta línea, contador, deshabilitado en pausa), AccionesRapidas, TarjetaConfirmacion (Confirmar/Cancelar envían el mensaje explícito), DialogoNuevaSesion, BarraDePestanas (flechas, Inicio, Fin), PantallaAcceso (mostrar/ocultar, error) y AvisoModelo ("Comprobar de nuevo"). Fijan la conducta antes de mover; en la mudanza solo cambia su ruta de import.
4. **Store puro** (`almacen`, `raiz`, `selectores` con memo, `acciones` con dependencias falsas) y sus pruebas, **sin** conectarlo todavía.
5. **Feature trazadora completa:** `sesion/dialogo-nueva-sesion` + `encabezado` (salud al store) + `app.tsx` con el proveedor. Valida el patrón vista/hook/css, el store y W13 en transición.
6. **Resto de features**, serializadas porque todas tocan `app.tsx`/`columnas` y `types/ui.type.ts`: chat, confirmación, herramientas, casos, archivos, acceso y disposición. Cada una mueve sus reductores a `features/<f>/estado/` y actualiza los imports de `tests/web/*.test.ts`.
7. **Guardianes estrictos:** quitar las rutas viejas de W13 y agregar W14–W21 con sus pruebas negativas.
8. **Marca:** tokens, fuentes, logo, favicon, plugin del título, `LogoMarca`, `PantallaCarga`, `EstadoVacio`, `TarjetaCaso` y textos sin "§" (web y CLI) + W19. La marca va **después** del refactor para que los pasos 5–7 sean visualmente idénticos y cualquier diferencia de conducta se atribuya al refactor y no al rediseño.
9. **Documentación:** `.claude/CLAUDE.md` (sección Front web), `docs/estructura.md`, `docs/convenciones.md`, y `SOLUCION.md` (nota de marca registrada de Periferia, D-108).
10. **Regresión completa + eli-qa** (local y link público) + ensayo del pedido de la demo + CI verde + deploy en Render.

| Hoy | Destino |
|---|---|
| `state/conversacion.ts`, `state/seguimiento.ts` | `features/chat/estado/` |
| `state/confirmaciones.ts` | `features/confirmacion/estado/` |
| `state/casos.ts` | `features/casos/estado/` |
| `state/vista-previa.ts` | `features/archivos/estado/` |
| `state/hidratacion.ts` | `features/sesion/estado/` |
| `state/modelo.ts` | `features/encabezado/estado/` |
| `hooks/usar-chat.ts` | `store/acciones.ts` + efectos en hooks |
| `hooks/usar-salud.ts` | slice `salud` + efecto de visibilidad en `usar-encabezado.ts` (o en el store) |
| `hooks/usar-archivos.ts` | `features/archivos/lista-archivos/usar-lista-archivos.ts` (o se compone desde `usar-panel-casos.ts`) |
| `hooks/usar-diseno.ts`, `hooks/usar-pestanas.ts` | `features/disposicion/{columnas,barra-pestanas}/usar-*.ts` |
| `hooks/usar-reintento-config.ts` | efecto de configuración del store |
| `components/icons/iconos.tsx` | `compartido/iconos/iconos.tsx` |
| `components/aviso.tsx` | `compartido/aviso/aviso.tsx` |

Las dependencias entre los módulos de `estado` son acíclicas: `conversacion → casos, confirmaciones`; `hidratacion → confirmaciones`; `vista-previa → casos` [VERIFIED: grep `from "@web/state` en `web/src/state/*.ts`].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RTL 13–15 incluía `@testing-library/dom` | RTL 16 lo declara como peer | RTL 16.0 | Hay que instalar `@testing-library/dom` explícito |
| happy-dom < 20 (VM escape, CVE críticos) | happy-dom 20.x con JS deshabilitado por defecto y los parches de 2026 | 20.0.0 → 20.8.9 | Pinear ≥ 20.8.9; la elegida es 20.14.6 |
| Preload global de DOM (doc de Bun) | Registro por archivo cuando conviven pruebas de servidor | — | Específico de un monorepo backend + front |

**Deprecated/outdated:**
- `@testing-library/jest-dom` en Bun: su peer de vitest lo hace inconveniente; aserciones nativas.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Los nombres propuestos (`crearAlmacen`, `usarSelector`, `crearAcciones`, `PAIS`, `SEPARADOR_SLUG`, `TEXTO_PAIS`, `prepararDom`, `tsconfig.dom.json`, W14–W21) no existen todavía; son propuestas | Patterns / Code Examples | Bajo: el planner puede renombrar |
| A2 | Que el estado efímero de vista (pestaña, foco, código visible, seguimiento del scroll) quede en el hook y no en el store cumple FE-02 | Pattern 1 | Medio: si se exige "todo al store", hay que agregar slices de UI; el guardián W20 tendría que endurecerse |
| A3 | Mantener los tipos en `web/src/types/` (sin carpetas `types` por feature) | Estructura | Bajo: es discreción explícita |
| A4 | Que eli-qa compare conducta (no píxeles) entre antes y después, porque la marca cambia lo visual a propósito | Migración | Bajo |
| A5 | Que el checkpoint de los paquetes SUS se resuelva automáticamente con evidencia (corrida nocturna D-104) | Package Audit | Medio: si la política exige humano, la instalación se detiene hasta la mañana |

## Open Questions

1. **¿`bun test --isolate` como comando oficial?**
   - What we know: con el helper (`document` explícito + `within`) funciona sin `--isolate`; con `--isolate` todo pasa en 27.5 s (+11%).
   - What's unclear: si conviene la robustez extra a costa de cambiar `bun test` en la CI y en los criterios.
   - Recommendation: quedarse con `bun test` y el helper; documentar `--isolate` como diagnóstico.
2. **¿Dónde vive `nuevaSesionAbierta`?**
   - What we know: lo abren el Encabezado y `AvisoError` (acción `NUEVA_SESION`) y lo consume `DialogoNuevaSesion` (`app.tsx:133,156,190,263-267`).
   - Recommendation: un slice pequeño `dialogoSesion` en `features/sesion/estado/`, porque cruza tres features.
3. **¿`Mensaje` exporta dos componentes?**
   - What we know: la UI-SPEC pone `MensajeUsuaria` y `MensajeAgente` en `features/chat/mensaje`.
   - Recommendation: W14 exige un archivo `<c>.tsx` por carpeta, no un único export; se permiten varios exports de presentación en el mismo archivo.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun | todo | ✓ | 1.4.3 | — |
| Node/npm | `npm view` (solo investigación) | ✓ | 24.16.0 / 11.13.0 | — |
| Red a jsDelivr/Fontsource y periferiaitgroup.com | bajar fuentes y marca una vez | ✓ (200 en las 5 descargas) | — | Google gstatic (variable) |
| Docker (OrbStack) | QA de imagen local (T07) | ✓ | cliente 29.6.2 | Render remoto |
| Link público Render | eli-qa en el link público | ✓ (`/api/health` 200) | — | calentar antes |
| Playwright MCP | eli-qa (D-117) | no verificable desde aquí (MCP de la sesión) | — | — |

**Missing dependencies with no fallback:** ninguna.

## Validation Architecture

> `workflow.nyquist_validation` es `false` en `.planning/config.json`; se incluye porque el orquestador lo pidió (pregunta 7).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `bun test` (Bun 1.4.3) + Testing Library 16.3.3 / user-event 14.6.7 / happy-dom 20.14.6 |
| Config file | ninguno (sin `bunfig.toml`); `tsconfig.dom.json` nuevo para tipos |
| Quick run command | `bun test tests/web tests/arquitectura-web.test.ts tests/sin-comentarios.test.ts` |
| Full suite command | `bun run check && bun test && bun run demo.ts && bun run build:web` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FE-01 | estructura por feature y carpeta de componente | guardián | `bun test tests/arquitectura-web.test.ts -t "W13\|W14"` | ✅ archivo / ❌ reglas nuevas |
| FE-02 | store puro, memo estable y acciones con API falsa | unit | `bun test tests/web/store` | ❌ Wave 0 |
| FE-02 | reductores puros siguen pasando | unit | `bun test tests/web/conversacion.test.ts tests/web/confirmaciones.test.ts tests/web/hidratacion.test.ts` | ✅ (cambian imports) |
| FE-03 | sin literales, números mágicos, `style=` ni unidades sueltas | guardián | `bun test tests/arquitectura-web.test.ts -t "W8\|W12\|W15\|W18"` | ❌ reglas nuevas |
| FE-04 | cada regla con prueba negativa | guardián | `bun test tests/arquitectura-web.test.ts -t "muerde"` | ✅ / ❌ nuevas |
| FE-05 | título del plugin, assets existentes, MIME sin acceso, tarjeta de caso, sin "§" | unit + http + DOM | `bun test tests/web/marca.test.ts tests/http/estatico.test.ts tests/web/dom/tarjeta-caso.test.tsx` | ❌ Wave 0 |
| FE-06 | regresión completa | todo | `bun run check && bun test && bun run demo.ts && bun run build:web` | ✅ |
| FE-06 | flujos en navegador local y público | manual-only (eli-qa + Playwright MCP, D-117) | suites `.qa/suites/03.suite.json` + checklist de la UI-SPEC | ✅ suites |

### Sampling Rate
- **Per task commit:** quick run.
- **Per wave merge:** full suite.
- **Phase gate:** full suite verde + CI verde + eli-qa antes de `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/helpers/dom.helper.ts`, `tsconfig.dom.json` y el `exclude` del raíz.
- [ ] `tests/web/dom/*.test.tsx` (caracterización).
- [ ] `tests/web/store/*.test.ts`.
- [ ] Prueba centinela de globales nativos para el backend.
- [ ] `tests/web/marca.test.ts` (plugin del título y existencia de assets).

## Security Domain

### Applicable ASVS Categories (nivel 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (sin cambios; el código de acceso no se toca) | — |
| V3 Session Management | sí, indirecto | `sessionId` solo en `localStorage` vía `sesion-local.ts` (W7); el código de acceso nunca se guarda en el cliente |
| V4 Access Control | sí | `/api/*` sigue con `requireAccess`; los estáticos (`/fuentes`, `/marca`) son públicos por diseño (la pantalla de acceso los usa) |
| V5 Validation / Output encoding | sí | Texto como nodos de React, sin `innerHTML` (W5); el título se inserta en el build desde una constante, escapando `&` y `<` |
| V6 Cryptography | no | — |
| V14 Configuration / dependencias | sí | CSP vigente: `fontSrc: own()` e `imgSrc: [FUENTE_CSP.PROPIA, FUENTE_CSP.DATA]` (`src/http/wiring/server.wiring.ts:178-189`) ya permiten fuentes e imágenes propias, así que **no hay que tocar la CSP**. Sin peticiones a terceros en runtime. devDeps pineadas exactas y `bun audit` limpio |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cadena de suministro en devDeps de prueba | Tampering | Versiones exactas ≥ 7 días, sin `postinstall`, `bun audit` en CI; quedan fuera de la imagen (`--production`) |
| XSS por texto del modelo | Tampering | Sin cambios: nodos de texto, `pre-wrap` (W5) |
| Fuga del código de acceso al bundle | Information disclosure | W6 (sin `import.meta.env`); el plugin del título solo inyecta `TEXTO_APP` |
| Carga de recursos de terceros (Google Fonts, periferiaitgroup.com) | Information disclosure (privacidad) | Assets vendorizados en `web/public`; CSP `'self'` los bloquea de todos modos; eli-qa verifica la pestaña de red |
| Uso de marca registrada | — (legal) | Nota en README/SOLUCION (D-108); licencias OFL junto a las fuentes |

## Sources

### Primary (HIGH confidence)
- Spike propio en el scratchpad (Bun 1.4.3): globales que reemplaza happy-dom y su restauración, orden de evaluación de archivos en `bun test`, fallo del segundo archivo DOM y su arreglo, `--isolate`/`--parallel`, `[test] isolate` ignorado, render real de `AccionesRapidas` con CSS module `{}`, ausencia de avisos de `act`, error de `getSnapshot` sin memo y su arreglo con `WeakMap`, errores de `tsc` en `.tsx` y la solución `tsconfig.dom.json`, `bun audit`, build de Vite con `public/` y plugin del título, y la prueba del plugin importando `vite.config.ts`.
- Repo real: `bun test` (2496 pruebas, 24.65 s) y `bun test --isolate` (27.46 s), ambos en verde.
- npm registry (`npm view … time/peerDependencies`) y el seam `package-legitimacy check`.
- `node_modules/hono/dist/utils/mime.js` (Hono 4.13.13) y `node_modules/@testing-library/user-event/dist/esm/setup/setup.js`.
- api.github.com/advisories (happy-dom).
- fonts.googleapis.com/css2 (unicode-range latino, variable de Montserrat), Fontsource CDN y API (v31/v15, OFL-1.1), y raw.githubusercontent.com/google/fonts (OFL.txt).
- periferiaitgroup.com (logo 248×62 webp y favicon 512×512 jpeg, verificados con `sips`/`file`).

### Secondary (MEDIUM confidence)
- https://bun.com/docs/test/dom (preload de `GlobalRegistrator`, RTL, cleanup).
- https://bun.com/docs/runtime/bunfig (claves de `[test]`: no hay `isolate`).

### Tertiary (LOW confidence)
- Ninguna.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (versiones del registro, instalación y ejecución reales).
- Architecture (store, memo, helper DOM, título): HIGH (exec-verificado); la distribución exacta de slices es una recomendación (MEDIUM).
- Guardianes: HIGH sobre lo que hay hoy (código leído); las reglas nuevas son propuestas.
- Pitfalls: HIGH (todos reproducidos o leídos en el código).

**Research date:** 2026-10-16
**Valid until:** 2026-11-15 para el stack (happy-dom publica seguido: revisar si se reabre la decisión de la 21.x); la parte de arquitectura no vence.
