---
phase: "5"
slug: "front-web-por-features-e-identidad-de-marca"
status: approved
reviewed_at: "2026-10-16"
shadcn_initialized: false
preset: none
created: "2026-10-16"
extends: ".planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md"
---

# Phase 5 — UI Design Contract

> Contrato visual y de interacción del front web (`web/`) para la identidad de marca de Periferia IT Group y el estado vacío con tarjetas de caso. Lo generó gsd-ui-researcher y lo verifica gsd-ui-checker.
> Fuentes: 05-CONTEXT.md (D-100 a D-122, bloqueadas), REQUIREMENTS.md (FE-01 a FE-06; UI-01 a UI-09 no cambian), 03-UI-SPEC.md (contrato vigente), SEED-261014-8dq, `.claude/CLAUDE.md` (reglas de `web/`), los tokens de https://periferiaitgroup.com/assets/css/style.css medidos el 2026-10-16 y el estado actual de `web/src/styles/tokens.css`, `global.css`, `config/strings.ts` e `index.html`.
> Los valores marcados **[Claude]** son discreción de esta fase (sección "Claude's Discretion" de 05-CONTEXT.md). La corrida es nocturna sin pausa (D-104): no se preguntó nada a la usuaria y todo lo demás sale de las decisiones bloqueadas.

---

## Alcance: qué extiende y qué conserva

**Este contrato extiende 03-UI-SPEC.md; no lo reemplaza.** Todo lo que no aparece aquí sigue igual: el contrato de interacción por componente (LineaDeTiempo y su auto-scroll D-78/D-78.1, IndicadorPensando, GrupoHerramientas, TarjetaHerramienta, TarjetaConfirmacion, TarjetaResultado, ProgresoCaso, PanelCasos, ListaArchivos, DialogoVistaPrevia, Compositor, DialogoNuevaSesion, AvisoModelo, persistencia y recarga), los breakpoints, las dimensiones fijas, el copy no listado y la tabla de UI Considerations de la Fase 3 (FE-06).

Cambia solo esto:

| Área | Cambio | Decisión |
|------|--------|----------|
| Color | Paleta de Periferia: superficie teal, acento verde oscuro, neón solo sobre oscuro y estados reajustados | D-106, D-110 |
| Tipografía | Outfit (títulos) y Montserrat (cuerpo y controles), autoalojadas | D-107 |
| Marca | Logo blanco oficial en el encabezado teal, en la pantalla de acceso y en la de carga; favicon oficial; `<title>` real | D-105, D-108 |
| Forma | Píldora en botones y chips; 8 px en tarjetas, diálogos, compositor y avisos | D-109 |
| Estado vacío | Tarjetas de los casos arriba y los 3 chips debajo | D-111 a D-114 |
| Copy | Sin el símbolo de sección en la web ni en la CLI; nuevo copy del estado vacío y de las tarjetas | D-118 |
| Estructura | Carpetas por feature y componente (D-119). En este contrato solo cambian los nombres y las rutas de los componentes, no la conducta | D-100, D-119 |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (sin shadcn ni kits de componentes; STACK.md: "Tailwind / component kits (MUI, shadcn): no") |
| Preset | not applicable |
| Component library | none: componentes propios sobre HTML nativo (`<dialog>`, `<details>/<summary>`, `<button>`, `<a download>`, `<textarea>`), igual que la Fase 3 |
| Styling | CSS Modules de Vite más `web/src/styles/tokens.css` (todas las variables) y `web/src/styles/global.css` (reglas globales y `@font-face`). Los `*.module.css` solo usan `var(--…)`, sin hex, `rgb()` ni `px` sueltos (regla W vigente) |
| Icon library | none: el módulo propio de íconos SVG en línea pasa a `web/src/compartido/iconos/` con el mismo set cerrado (`check`, `x`, `alerta`, `chevron`, `descargar`, `ojo`, `reloj`, `girando`, `info`). No se agregan íconos; la tarjeta de caso usa `chevron` girado hacia la derecha |
| Font | Títulos: **Outfit 600**. Cuerpo y controles: **Montserrat 400 y 600**. Ambas autoalojadas en `.woff2` (subconjunto latino) con `font-display: swap` y la pila del sistema como respaldo. Monoespaciada sin cambios (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) |
| Tema | Solo claro, con el encabezado teal. Sin modo oscuro (D-103) |
| Markdown | Sin cambios: texto plano con `white-space: pre-wrap`; prohibidos `dangerouslySetInnerHTML`, `innerHTML` y markdown |
| Textos | Todo texto visible sigue en un único `web/src/config/strings.ts` (D-121). Los nombres de país también van ahí, con la clave tomada de una constante (ver TarjetaCaso) |
| Dependencias de runtime | Ninguna nueva. Las fuentes y la marca son archivos estáticos en `web/public/`, sin paquetes npm y sin peticiones a Google ni a periferiaitgroup.com en tiempo de ejecución |

---

## Activos de marca (contrato de archivos)

| Archivo en el repo | Origen | Uso | Notas |
|--------------------|--------|-----|-------|
| `web/public/marca/periferia-it-group.webp` | `https://periferiaitgroup.com/assets/img/periferia-it-group-1.webp` (248 × 62, blanco y neón, para fondo oscuro) | `LogoMarca` en el encabezado, la pantalla de acceso y la de carga | `<img>` con `width="248" height="62"` (relación 4:1, evita el salto de layout) y la altura fijada por token. `alt` = `TEXTO_APP.subtitulo` ("Periferia IT Group"). Se copia una vez al repo y nunca se carga de su dominio |
| `web/public/marca/favicon.jpg` | `https://periferiaitgroup.com/assets/img/favicon-3.jpg` (512 × 512, isotipo de arco neón con 5 puntos) | `<link rel="icon" type="image/jpeg" href="/marca/favicon.jpg">` y `<link rel="apple-touch-icon" href="/marca/favicon.jpg">` | Reemplaza el `data:,` actual |
| `web/public/fuentes/outfit-latin-600.woff2` | Google Fonts, Outfit 600 normal, subconjunto latin | Títulos | |
| `web/public/fuentes/montserrat-latin-400.woff2` | Google Fonts, Montserrat 400 normal, subconjunto latin | Cuerpo | |
| `web/public/fuentes/montserrat-latin-600.woff2` | Google Fonts, Montserrat 600 normal, subconjunto latin | Etiquetas fuertes, botones, chips y números | |
| `web/public/fuentes/OFL-Outfit.txt`, `web/public/fuentes/OFL-Montserrat.txt` | Licencia SIL Open Font License 1.1 de cada familia | Cumplimiento de la licencia | Junto a los archivos, como pide D-107 |

Las rutas públicas (`/marca/…`, `/fuentes/…`) son constantes de `web/src/config/constants/marca.constants.ts` cuando las usa TS (logo). En CSS e `index.html` van como URL absolutas desde la raíz.

`web/index.html`:
- `<title>` con el texto de `TEXTO_APP.tituloDocumento` ("Registro como proveedor · Periferia IT Group"). El texto no se escribe a mano en el HTML: se inyecta en el build desde la constante (por ejemplo, con `transformIndexHtml` en la config de Vite) y una prueba verifica que el `<title>` del HTML servido coincide con `TEXTO_APP.tituloDocumento`. El planner elige el mecanismo, siempre que el `<title>` exista antes de que corra el JS.
- `<meta name="theme-color" content="#063635">` (la barra del navegador móvil toma el teal de la marca).
- `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fuentes/montserrat-latin-400.woff2">` y el mismo para `outfit-latin-600.woff2`. Montserrat 600 no se precarga.
- Sin comentarios (lo vigila `tests/sin-comentarios.test.ts`).

Build y despliegue: Vite copia `web/public/` a `web/dist/`. Hay que verificar que `web/dist/marca/` y `web/dist/fuentes/` existen después de `build:web` y en la imagen de Render, y que `/fuentes/*.woff2` responde `200` con `Content-Type: font/woff2` (no el `index.html` del comodín SPA de `static.route.ts`) y sin pedir el código de acceso, porque la pantalla de acceso ya usa las fuentes y el logo.

---

## Componentes propios (contrato de esta fase)

Could not enumerate: no hay sistema de diseño instalado (Tool: none, CSS propio por decisión de stack); la tabla lista los componentes propios que esta fase mueve o construye, no los exports de un paquete. Es un conjunto de partida, no una lista cerrada: el executor puede agregar un componente que respete los tokens y este contrato sin bloquearse.

Cada componente vive en `web/src/features/<feature>/<componente>/` con `<componente>.tsx` (solo presentación), `usar-<componente>.ts` (lógica, cuando la tiene) y `<componente>.module.css` (D-100, D-119). Los nombres de componente son los de la UI-SPEC de la Fase 3.

| Componente | Carpeta | Estado | Cambio visual en esta fase |
|------------|---------|--------|-----------------------------|
| `PantallaAcceso` | `features/acceso/pantalla-acceso` | se mueve | Fondo teal, logo y nombre de la app sobre la tarjeta; botón píldora |
| `PantallaCarga` | `features/acceso/pantalla-carga` | se extrae de `app.tsx` | La pantalla "Cargando el agente…" con la misma superficie teal y el logo |
| `Encabezado` | `features/encabezado/encabezado` | se mueve | Superficie teal, logo, divisor neón, título en Outfit, chips oscuros y "Nueva sesión" en píldora con borde neón |
| `AvisoModelo` | `features/encabezado/aviso-modelo` | se mueve | Botón "Comprobar de nuevo" en píldora |
| `LineaDeTiempo` | `features/chat/linea-de-tiempo` | se mueve | Ninguno, salvo que el estado vacío pasa a su propio componente |
| `EstadoVacio` | `features/chat/estado-vacio` | **nuevo** (extraído de `linea-de-tiempo.tsx`) | Título Display, cuerpo, grilla de `TarjetaCaso` y los chips debajo (D-111) |
| `TarjetaCaso` | `features/chat/tarjeta-caso` | **nuevo** | Ver su contrato |
| `MensajeUsuaria` / `MensajeAgente` | `features/chat/mensaje` | se mueve | La burbuja de la usuaria toma el tinte menta `--acento-suave` |
| `IndicadorPensando` | `features/chat/indicador-pensando` | se mueve | Ninguno (los colores salen de los tokens) |
| `Compositor` | `features/chat/compositor` | se mueve | Botones "Enviar mensaje" y "Detener respuesta" en píldora; borde del campo con `--borde-control` |
| `AccionesRapidas` | `features/chat/acciones-rapidas` | se mueve | Chips en píldora; etiquetas sin el símbolo de sección |
| `GrupoHerramientas`, `TarjetaHerramienta` | `features/herramientas/…` | se mueven | Ninguno |
| `TarjetaConfirmacion` | `features/confirmacion/tarjeta-confirmacion` | se mueve | Botones en píldora |
| `PanelCasos`, `ProgresoCaso`, `TarjetaResultado` | `features/casos/…` | se mueven | Título del caso y del panel en Outfit |
| `ListaArchivos`, `DialogoVistaPrevia`, `AvisoDiscoEfimero` | `features/archivos/…` | se mueven | Botones y chip de reproceso en píldora; título del diálogo en Outfit |
| `DialogoNuevaSesion` | `features/sesion/dialogo-nueva-sesion` | se mueve | Botones en píldora; título en Outfit |
| `BarraDePestanas` | `features/disposicion/barra-pestanas` | **se extrae** de `app.tsx` | Ninguno (los estilos globales `.pestanas`, `.pestana` y `.punto-cambios` pasan a su `.module.css`) |
| `Columnas` | `features/disposicion/columnas` | **se extrae** de `app.tsx` | Ninguno |
| `AvisoError`, `AvisoSistema` | `compartido/aviso` | se mueve | Botones de acción en píldora |
| `LogoMarca` | `compartido/logo-marca` | **nuevo** | `<img>` del logo con la altura recibida por variante (`encabezado`, `encabezado-angosto`, `acceso`) |
| Íconos | `compartido/iconos` | se mueve | Ninguno |

---

## Layout

Los breakpoints no cambian (`PUNTO_DE_QUIEBRE_PX`: `angosto` < 640 px, `medio` 640–1023 px, `ancho` ≥ 1024 px, expuestos en `[data-diseno]`). La grilla de dos columnas, la barra de pestañas, los scroll independientes, el alto `100dvh` y la jerarquía de lectura de 03-UI-SPEC siguen vigentes.

### Encabezado (≥ 640 px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ fondo --marca (#063635), alto 56 px, padding 8 px 16 px                                  │
│ [logo 32 px alto] │ Registro como proveedor     [Fecha de ejecución 2026-09-03] [● deepseek-flash · Disponible] (Nueva sesión) │
│                   ↑ divisor 1 × 24 px neón       chips --marca-elevada, texto blanco, radio 4 px     píldora, borde neón │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- Bloque de marca (izquierda): `LogoMarca` de 32 px de alto (128 px de ancho), un divisor vertical de 1 × 24 px en `--neon` con 16 px de separación a cada lado, y el `<h1>` "Registro como proveedor" en Outfit 20/600, color `--sobre-marca`. El subtítulo "Periferia IT Group" de D-105 lo pone el logo, que dice exactamente eso y lo lleva como `alt`; ya no se pinta como texto aparte ni como separador "·". El orden de lectura queda "Periferia IT Group", "Registro como proveedor".
- Bloque de meta (derecha, `margin-inline-start: auto`): chip de fecha, chip del modelo y botón "Nueva sesión", con 8 px de separación.
- El encabezado no lleva borde inferior: el cambio de teal a claro ya marca el límite.

### Encabezado (< 640 px)

```
┌───────────────────────────────────────────┐
│ [logo 24 px] │ Registro como proveedor     │  línea 1: logo 96 × 24, divisor, h1 Outfit 16/600
│ [2026-09-03] [● Sin clave válida] (Nueva sesión) │  línea 2: una fila sin partir, con elipsis
└───────────────────────────────────────────┘
```

Igual que la Fase 3 (prefijos ocultos a la vista y presentes para lectores de pantalla, una sola fila con elipsis), con el logo a 24 px y el título a 16 px para que la línea 1 quepa en 343 px útiles a 375 px.

### Pantalla de acceso y pantalla de carga

```
┌──────────────────────────────── fondo --marca (#063635) ────────────────────────────────┐
│                                   (64 px arriba ≥ 640; 24 px en < 640)                  │
│                                 [logo 40 px alto, centrado]                             │
│                               Registro como proveedor (Outfit 20/600, blanco)           │
│                                         (32 px)                                         │
│                  ┌──────────── tarjeta blanca, 400 px máx., padding 32, radio 8 ─────┐  │
│                  │ Acceso al agente (Display 28, Outfit 600)                         │  │
│                  │ Escribe el código de acceso…  (Body, --texto-tenue)               │  │
│                  │ Código de acceso  [••••••••••••••••]  (Mostrar código)            │  │
│                  │ ( Entrar al agente )  píldora, ancho completo, --acento           │  │
│                  │ línea de error                                                    │  │
│                  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

- Punto focal: el campo del código, que recibe el foco al cargar (sin cambios).
- El nombre de la app bajo el logo es un `<p>` (el `<h1>` sigue siendo "Acceso al agente").
- La tarjeta va sin borde sobre el teal; los controles dentro de ella usan el foco claro.
- `PantallaCarga`: la misma superficie teal, el logo de 40 px centrado y "Cargando el agente…" debajo en Montserrat 16/400, `--sobre-marca`, con `role="status"`. Así no hay un destello claro antes de la pantalla de acceso.

### Estado vacío (`EstadoVacio`, sesión sin turnos)

Ancho y medio (≥ 640 px), dentro de la columna de chat de 768 px máx.:

```
 (48 px arriba)
 ¿Qué caso procesamos?                                   Display 28, Outfit 600
 Elige un caso para procesarlo o escribe una instrucción…  Body 16, --texto-tenue
 (24 px)
 Casos disponibles                                        Label 14/600, --texto-tenue
 (8 px)
 ┌───────────────────────────────────┐ ┌───────────────────────────────────┐
 │ (CO) Colombia                     │ │ (EC) Ecuador                      │
 │ Industrias Delta                  │ │ Corp Andina                       │   gap 16 px
 │ co-industrias-delta               │ │ ec-corp-andina                    │
 │ Procesar caso ›                   │ │ Procesar caso ›                   │
 └───────────────────────────────────┘ └───────────────────────────────────┘
 ┌───────────────────────────────────┐ ┌───────────────────────────────────┐
 │ (HN) Honduras                     │ │ (PA) Panamá                       │
 │ Agroexport Sula                   │ │ Logistica Istmo                   │
 │ hn-agroexport-sula                │ │ pa-logistica-istmo                │
 │ Procesar caso ›                   │ │ Procesar caso ›                   │
 └───────────────────────────────────┘ └───────────────────────────────────┘
 (24 px)
 Acciones rápidas                                         Label 14/600, --texto-tenue
 (8 px)
 (Demo del PRD: ec-corp-andina) (Procesar los 4 casos) (¿Qué casos hay?)   chips píldora
```

Angosto (< 640 px):

```
 (24 px arriba)
 ¿Qué caso procesamos?                 Heading 20, Outfit 600
 Elige un caso para procesarlo…        Body 16, --texto-tenue
 (24 px)
 Casos disponibles
 ┌─────────────────────────────────────┐
 │ (CO)  Industrias Delta            › │   fila: píldora · cliente (Outfit 16/600)
 │       Colombia · co-industrias-delta│          país · slug (Label 14, --texto-tenue)
 └─────────────────────────────────────┘   gap 8 px entre tarjetas
 … (EC, HN, PA)
 (24 px)
 Acciones rápidas
 (Demo del PRD: ec-corp-andina) (Procesar los 4 casos)
 (¿Qué casos hay?)
```

- Todo el estado vacío va **alineado al inicio** (izquierda) **[Claude]**: el título, el cuerpo, los rótulos, la grilla y los chips (`justify-content: flex-start`). Reemplaza el centrado de la Fase 3 porque una grilla de tarjetas centrada con texto a la izquierda se lee desalineada.
- Grilla: `display: grid`, `grid-template-columns: repeat(var(--columnas-tarjetas-caso), minmax(0, 1fr))` con 2 columnas en `ancho` y `medio` y 1 en `angosto`. El orden es el de `casos` de `/api/config`, sin reordenar.
- Punto focal del estado vacío: la grilla de tarjetas. Los chips quedan como segunda vía.
- Después del primer turno el estado vacío desaparece y quedan los chips compactos sobre el compositor, igual que hoy (D-111).

---

## Spacing Scale

Declared values (must be multiples of 4). Sin cambios respecto de la Fase 3:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gap entre ícono y texto, entre punto de estado y etiqueta, padding vertical de badges, gap entre el slug y la línea de acción de `TarjetaCaso` |
| sm | 8px | Gap entre tarjetas de herramienta y entre `TarjetaCaso` en angosto, gap interno de `TarjetaCaso`, padding horizontal de badges y de la píldora de país, padding vertical de chips, separación entre rótulo y contenido del estado vacío, padding vertical del encabezado |
| md | 16px | Padding de burbujas, tarjetas y `TarjetaCaso`, padding horizontal de botones y chips, gap de la grilla de casos en ancho y medio, separación a cada lado del divisor de marca, padding horizontal del encabezado |
| lg | 24px | Padding del panel y del compositor, separación entre bloques del estado vacío (cuerpo → casos → acciones), margen superior del estado vacío en angosto y de la pantalla de acceso en angosto, padding de diálogos |
| xl | 32px | Padding de la tarjeta de acceso, separación entre el bloque de marca y la tarjeta de acceso, separación entre turnos |
| 2xl | 48px | Margen superior del estado vacío en ancho y medio |
| 3xl | 64px | Margen superior de la pantalla de acceso en ≥ 640 px |

Dimensiones fijas nuevas (tamaños de caja, no espaciado; todas múltiplos de 4 salvo los trazos): logo del encabezado 32 px de alto (24 px en angosto); logo de acceso y carga 40 px; divisor de marca 1 × 24 px; píldora de país 24 px de alto; radio píldora `999px`. Se conservan las de la Fase 3: encabezado 56 px, pestañas 40 px, controles 40 px, panel 384 px, chat 768 px, tarjeta de acceso 400 px, compositor de 72 a 200 px y demás.

Exceptions: el anillo de foco (2 px de grosor y 2 px de offset), el divisor de marca (1 px de ancho) y los bordes (1 px y 4 px de atención) son trazos, no espaciado de layout. No hay otros valores.

---

## Typography

| Role | Size | Weight | Line Height | Familia |
|------|------|--------|-------------|---------|
| Body | 16px | 400 | 1.5 (24px) | Montserrat |
| Label | 14px | 400; 600 en botones, chips, badges, rótulos, etiquetas de campo, etapas activas, encabezados de tabla, píldora de país y "Procesar caso" | 1.43 (20px) | Montserrat |
| Heading | 20px | 600 | 1.2 (24px) | Outfit (números de contadores: Montserrat 600) |
| Display | 28px | 600 | 1.2 (≈34px) | Outfit |

Solo dos pesos en toda la app: **400 y 600**. La web de Periferia usa Montserrat 700 en botones; aquí se usa 600 para no cargar un cuarto archivo ni romper la regla de dos pesos **[Claude]**. Sin cursivas.

Uso por familia:
- **Outfit 600** (`--fuente-titulos`): `<h1>` del encabezado (20; 16 en angosto), "Acceso al agente" (Display 28), nombre de la app en acceso y carga (20), título del estado vacío (Display 28; Heading 20 en angosto), nombre del cliente en `TarjetaCaso` (Heading 20; 16 en angosto), títulos de `TarjetaResultado`, `TarjetaConfirmacion`, el panel y los diálogos (Heading 20).
- **Montserrat** (`--fuente-base`): todo lo demás, incluidos botones, chips, campos y los números de los contadores (20/600 con `font-variant-numeric: tabular-nums`, porque Montserrat trae cifras tabulares).
- **Monoespaciada** (`--fuente-mono`): sin cambios (nombres de herramienta, args, rutas, slugs, vista previa `.md`), incluido el slug de `TarjetaCaso` en 14/400.

Contrato de `@font-face` (en `web/src/styles/global.css`):
- Tres caras: `"Outfit"` 600, `"Montserrat"` 400 y `"Montserrat"` 600, `font-style: normal`, `src: url("/fuentes/<archivo>.woff2") format("woff2")`, `font-display: swap`.
- `unicode-range` latino de Google Fonts: `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`. Cubre tildes, ñ, ¿, ¡, "·" (U+00B7), "—" (U+2014) y "…" (U+2026).
- Respaldo en los tokens: `--fuente-base: "Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` y `--fuente-titulos: "Outfit", <la misma pila>`. Si un archivo falla, la app sigue legible con la fuente del sistema.
- Los tokens de rol suman `--titulo-fuente: var(--fuente-titulos)` y `--display-fuente: var(--fuente-titulos)`; `html` sigue tomando `--fuente-base`.

---

## Color

### Distribución 60/30/10

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` | Columna de chat, burbujas del agente, `TarjetaCaso`, tarjetas, diálogos, tarjeta de acceso, pestaña seleccionada |
| Secondary (30%) | `#F5FEF7` (tinte de Periferia) | Panel de casos, barra de pestañas, franja del compositor y de chips compactos, chips, cuerpo expandido de las tarjetas de herramienta, encabezado de tabla de la vista previa |
| Superficie de marca | `#063635` (teal de Periferia) | Encabezado, pantalla de acceso y pantalla de carga. Ocupa poco del área del chat y es la firma visual de Periferia |
| Accent (10%) | `#15601D` (verde oscuro de Periferia) | Solo la lista "Accent reserved for" |
| Destructive | `#B42318` | Solo el botón "Empezar sesión nueva" de `DialogoNuevaSesion` (sin cambios) |

### Tokens de color (valores exactos de `tokens.css`)

| Token | Valor | Uso | Contraste medido |
|-------|-------|-----|------------------|
| `--marca` | `#063635` | Superficie de marca | blanco 13.23:1 |
| `--marca-elevada` | `#0B4A48` | Chips de fecha y modelo sobre el encabezado | blanco 10.06:1 |
| `--marca-hover` | `#0F5A57` | Hover de "Nueva sesión" sobre teal | blanco 8.01:1; neón 6.14:1 |
| `--neon` | `#6DFD8C` | Detalles sobre teal (ver lista "Neón reservado para") | sobre teal 10.13:1; sobre `--marca-elevada` 7.70:1; **sobre blanco 1.31:1: prohibido sobre claro** |
| `--sobre-marca` | `#FFFFFF` | Texto sobre teal | 13.23:1 |
| `--sobre-marca-tenue` | `#A3C4BE` | Texto y borde de "Nueva sesión" deshabilitado | sobre teal 7.06:1 |
| `--dominante` | `#FFFFFF` | Fondo dominante | |
| `--secundario` | `#F5FEF7` | Fondo secundario | |
| `--acento` | `#15601D` | Acento interactivo sobre claro | sobre blanco 7.71:1 (AAA); sobre `--secundario` 7.49:1; blanco sobre él 7.71:1 |
| `--acento-hover` | `#0F4A16` | Hover del botón primario | blanco 10.44:1 |
| `--acento-activo` | `#0B3A11` | Botón primario presionado | blanco 12.90:1 |
| `--acento-suave` | `#ECFFF0` | Burbuja de la usuaria, hover de chips y de `TarjetaCaso` (tinte, no cuenta como uso del acento) | texto 15.87:1; acento 7.39:1; tenue 6.26:1 |
| `--acento-tinte` | `#CCFFD6` | Fondo de la píldora de país y de `TarjetaCaso` presionada | acento sobre él 6.92:1; tenue 5.86:1 |
| `--sobre-acento` | `#FFFFFF` | Texto sobre el acento y sobre el destructivo | |
| `--destructivo` | `#B42318` | Botón destructivo | blanco 6.57:1 |
| `--destructivo-hover` | `#8F1C13` | Hover del destructivo | blanco 8.96:1 |
| `--texto` | `#1B1F24` | Texto principal | blanco 16.56:1; secundario 16.09:1 |
| `--texto-tenue` | `#52615A` | Metadatos, ayudas, placeholders, rótulos del estado vacío, país y slug de `TarjetaCaso` | blanco 6.53:1; secundario 6.34:1 |
| `--borde` | `#C8D6CB` | Bordes de contenedores (tarjetas, burbujas, divisores, panel) | decorativo, 1.51:1 |
| `--borde-control` | `#6F8577` | Borde de los campos (`textarea`, código de acceso) y de los botones secundarios | blanco 3.96:1; secundario 3.85:1 (cumple 3:1 de WCAG 1.4.11) |
| `--deshabilitado-fondo` | `#E8EEEA` | Fondo de botones primarios y píldora de país deshabilitados | |
| `--deshabilitado-texto` | `#52615A` | Texto deshabilitado | sobre `--deshabilitado-fondo` 5.55:1 |
| `--sombra-elevada` | `0 4px 12px rgb(6 54 53 / 12%)` | Hover de `TarjetaCaso` | decorativa |

### Colores de estado reajustados (D-110) **[Claude]**

El éxito de la Fase 3 (`#1A6B41`) casi coincidía con el acento de marca `#15601D`. El éxito pasa a un **jade** de otro tono (≈ 169° contra ≈ 125° del acento) y además se separa por forma: los estados son **badges de 4 px con fondo tintado, texto de color e ícono**; los botones son **píldoras de fondo lleno con texto blanco**. Ningún estado usa fondo lleno de color, así que "Listo para firma" nunca se lee como un botón. Información deja el gris neutro y pasa a un **azul pizarra** para no confundirse con los metadatos tenues ni con una etapa pendiente. Atención y error se conservan porque ya son distintos y pasan AA.

| Semántica | Texto / ícono | Fondo | Borde | Contraste del texto | Ícono obligatorio |
|-----------|---------------|-------|-------|---------------------|-------------------|
| Éxito | `#0B6B5A` | `#E3F5F0` | `#0B6B5A` | 5.69:1 sobre su fondo; 6.43:1 sobre blanco; 6.25:1 sobre secundario | `check` |
| Atención | `#8A4B08` | `#FFF8EB` | `#B45309` | 6.43:1 sobre su fondo; 6.79:1 sobre blanco | `alerta` o `reloj` |
| Error | `#B42318` | `#FDECEA` | `#B42318` | 5.75:1 sobre su fondo; 6.57:1 sobre blanco | `x` o `alerta` |
| Información | `#2E5A88` | `#EEF4F9` | `#B6CCE0` | 6.46:1 sobre su fondo; 7.16:1 sobre blanco | `info` |

Se usan en los mismos lugares que fijó la Fase 3 (lleno, por confirmar, faltante, bloqueos, etapas, banners, avisos, badges de firma y estados terminales de confirmación). Siempre van con ícono y texto, nunca solo color. "Envío cancelado", "Reemplazada por una confirmación nueva", "Paquete sin armar", `AvisoSistema` y la etapa cancelada pasan al azul pizarra de información.

Puntos de estado del modelo **dentro del encabezado** (sobre `--marca-elevada`; elementos no textuales, siempre con su etiqueta):

| Token | Valor | Estado | Contraste sobre `#0B4A48` |
|-------|-------|--------|---------------------------|
| `--encabezado-punto-exito` | `var(--neon)` | Disponible | 7.70:1 |
| `--encabezado-punto-atencion` | `#FFC857` | No disponible, Tope diario | 6.54:1 |
| `--encabezado-punto-error` | `#FF8F85` | Sin clave válida, Sin saldo | 4.56:1 |

### Accent reserved for (lista cerrada)

1. El fondo de los botones primarios: "Enviar mensaje", "Entrar al agente" y "Confirmar envío simulado".
2. El anillo de foco sobre superficies claras (`--foco-color: var(--acento)`).
3. La etapa "en curso" de `ProgresoCaso` y el ícono girando de la `TarjetaHerramienta` en curso.
4. Los enlaces de texto "Ver" y "Descargar" de `ListaArchivos`.
5. El punto de 8 px de "cambios no vistos" en la pestaña "Casos y archivos".
6. En `TarjetaCaso`: el texto de la píldora de país, la línea "Procesar caso" con su chevron y el borde en hover y presionado.
7. El borde de los chips de `AccionesRapidas` en hover.

Ningún otro elemento usa el acento. Los botones secundarios ("Cancelar envío", "Detener respuesta", "Seguir en esta sesión", "Cerrar vista previa", "Descargar archivo", "Comprobar de nuevo", "Reintentar", "Ir al final", "Mostrar código") van con fondo `--dominante`, borde `--borde-control` y texto `--texto`. El acento **nunca** va sobre el teal (1.72:1).

### Neón reservado para (lista cerrada)

1. Los puntos del isotipo dentro del logo (vienen en el archivo).
2. El divisor vertical del bloque de marca en el encabezado.
3. El punto "Disponible" del chip del modelo en el encabezado.
4. El borde de la píldora "Nueva sesión" en el encabezado.
5. El anillo de foco sobre el teal (`--foco-color-marca: var(--neon)`): encabezado, y pantallas de acceso y carga fuera de la tarjeta.

El neón nunca se usa como color de texto ni de control sobre una superficie clara.

---

## Forma (D-109)

| Token | Valor | Se usa en |
|-------|-------|-----------|
| `--radio-pildora` | `999px` | Todo `<button>` y enlace con aspecto de botón: primarios, secundarios, destructivo, chips de `AccionesRapidas`, chip de reproceso del disco efímero, "Nueva sesión", "Comprobar de nuevo", "Reintentar", "Ir al final", "Mostrar código", acciones de `AvisoError`; también la píldora de país de `TarjetaCaso` (D-114) |
| `--radio` | `8px` | Tarjetas (`TarjetaCaso`, resultado, confirmación, herramienta), burbujas, diálogos, compositor, avisos y banners, tarjeta de acceso, campo del código |
| `--radio-chico` | `4px` | Badges de estado, chips informativos del encabezado (fecha y modelo), badges neutros de formato y país en `TarjetaResultado`, pestañas (solo las esquinas superiores) |

Regla de lectura **[Claude]**: la píldora se pulsa; el radio de 4 px informa. La única píldora que no es un control es la de país (bloqueada por D-114), que va siempre dentro de una `TarjetaCaso`, con `aria-hidden="true"`, 24 px de alto y fondo tintado, nunca lleno.

`TarjetaCaso` es un control pero conserva 8 px, porque es una tarjeta (D-109).

---

## Estados interactivos

| Control | Reposo | Hover | Presionado | Foco | Deshabilitado |
|---------|--------|-------|------------|------|---------------|
| Primario (píldora) | fondo `--acento`, texto `--sobre-acento`, borde `--acento`, Label 14/600 | fondo y borde `--acento-hover` | fondo y borde `--acento-activo` | anillo global | fondo y borde `--deshabilitado-fondo`, texto `--deshabilitado-texto`, `cursor: not-allowed` |
| Secundario (píldora) | fondo `--dominante`, borde `--borde-control`, texto `--texto`, Label 14/600 | fondo `--secundario` | fondo `--acento-suave` | anillo global | texto `--texto-tenue`, borde `--borde`, `cursor: not-allowed` |
| Destructivo (píldora) | fondo `--destructivo`, texto `--sobre-acento` | fondo `--destructivo-hover` | fondo `--destructivo-hover` | anillo global | no aplica (el diálogo no lo deshabilita) |
| Chip de `AccionesRapidas` (píldora) | fondo `--secundario`, borde `--borde`, texto `--texto`, Label 14/600 | fondo `--acento-suave`, borde `--acento` | fondo `--acento-tinte`, borde `--acento` | anillo global | texto `--texto-tenue`, borde `--borde`, fondo `--secundario`, sin hover |
| `TarjetaCaso` | fondo `--dominante`, borde `--borde`, radio 8 | fondo `--acento-suave`, borde `--acento`, sombra `--sombra-elevada` | fondo `--acento-tinte`, borde `--acento`, sin sombra | anillo global (2 px `--acento`, offset 2 px) | fondo `--secundario`, borde `--borde`, todo el texto en `--texto-tenue`, píldora con fondo `--deshabilitado-fondo` y texto `--deshabilitado-texto`, "Procesar caso" en `--texto-tenue`, sin hover ni sombra, `cursor: not-allowed` |
| "Nueva sesión" (sobre teal, píldora) | fondo transparente, borde 1 px `--neon`, texto `--sobre-marca`, Label 14/600 | fondo `--marca-hover` | fondo `--marca-elevada` | anillo `--neon` | borde y texto `--sobre-marca-tenue` |
| Enlaces "Ver" / "Descargar" | texto `--acento`, Label 14/600, sin subrayado | subrayado | subrayado | anillo global | no aplica |

Foco: `:focus-visible { outline: var(--foco-ancho) solid var(--foco-color); outline-offset: var(--foco-separacion); }`. Dentro del encabezado y sobre el fondo teal de acceso y carga, `--foco-color` pasa a `--foco-color-marca` (neón, 10.13:1 sobre teal). Dentro de la tarjeta blanca de acceso vuelve al acento. Prohibido `outline: none` sin reemplazo.

Hover solo con `@media (hover: hover)`, para que en pantallas táctiles no quede pegado.

---

## Movimiento **[Claude]**

- Duración única `--duracion-transicion: 150ms`, `ease`.
- Propiedades permitidas: `opacity`, `transform`, `background-color`, `border-color`, `color` y `box-shadow` (estas cuatro últimas no desplazan nada en pantalla). Ninguna transición mueve el layout ni anima el alto.
- `TarjetaCaso`, chips y botones animan solo el color, el borde y la sombra en hover y presionado. No hay desplazamientos ni escalas.
- `@media (prefers-reduced-motion: reduce)`: `--duracion-transicion: 0ms`, sin transiciones y el ícono girando se reemplaza por el reloj estático (vigente desde la Fase 3).

---

## Contrato de interacción (solo lo nuevo o lo que cambia)

### EstadoVacio (D-111)

- Se muestra si la sesión no tiene turnos y no se está cargando el historial (la misma condición que hoy). Durante "Cargando la conversación…" no aparece.
- Contenido en orden: título, cuerpo, sección "Casos disponibles" con la grilla de `TarjetaCaso`, sección "Acciones rápidas" con los 3 chips de `AccionesRapidas` en sus etiquetas completas.
- Cada sección es un `<section aria-labelledby>` con su rótulo visible (`<h3>` en Label 14/600, `--texto-tenue`). El grupo de chips conserva `role="group"` con `aria-label` "Acciones rápidas".
- La grilla es una lista (`<ul>` con un `<li>` por caso) para que el lector de pantalla anuncie "lista, 4 elementos".
- Casos sin cargar (`/api/config` falló; el estado vacío solo se pinta con el acceso concedido, que llega con la primera respuesta de config, así que una config nula siempre es un fallo): en lugar de la grilla, una línea con `role="status"` "No se pudieron cargar los casos. Se vuelve a intentar en unos segundos; mientras tanto puedes escribir la instrucción." en Label 14/400, `--texto-tenue`. No hay esqueletos animados. Sigue el reintento de config de la Fase 3 (`REINTENTO_CONFIG_MS`), y la grilla reemplaza la línea cuando responde (revisión WR-03).
- Config cargada con `casos` vacío: la sección "Casos disponibles" no se pinta y quedan el título, el cuerpo y los chips.
- Si al enviar desde una tarjeta o un chip del estado vacío este se desmonta con el foco dentro, el foco pasa al `textarea` del compositor, para que el teclado no quede en `body`.

### TarjetaCaso (D-112, D-113, D-114)

- Elemento: `<button type="button">` que ocupa toda la tarjeta, con el contenido en `<span>` de bloque. Enter y Espacio activan (nativo). Mínimo 40 px de alto.
- Datos, derivados del slug sin tocar la API (D-113), con una función pura y probada, fuera de la vista:
  - **Prefijo**: el texto antes del primer guion (`co`, `ec`, `pe`, `pa`, `hn`). Los prefijos conocidos son un objeto `as const` en `web/src/config/constants/` (por ejemplo `PAIS = { CO: "co", EC: "ec", PE: "pe", PA: "pa", HN: "hn" }`). El nombre visible de cada país vive en `strings.ts`, con la clave tomada de esa constante: Colombia, Ecuador, Perú, Panamá y Honduras. El código de la píldora es el prefijo en mayúsculas ("CO").
  - **Cliente**: el resto del slug, con cada palabra separada por guion y la inicial en mayúscula (`industrias-delta` → "Industrias Delta", `logistica-istmo` → "Logistica Istmo"). No se agregan tildes que el slug no trae: el nombre sale del dato, no se inventa.
  - **Prefijo desconocido o slug sin guion**: la tarjeta muestra solo el slug como título (Outfit), sin píldora, sin país y sin la línea mono repetida, y conserva "Procesar caso".
- Disposición en ancho y medio (columna, gap 8 px, padding 16 px): fila 1 con la píldora "CO" (24 px, Label 14/600, `--acento` sobre `--acento-tinte`, padding horizontal 8 px) y el país (Label 14/400, `--texto-tenue`) con 8 px entre ambos; fila 2 con el cliente (Heading 20, Outfit 600, `--texto`); fila 3 con el slug (mono 14/400, `--texto-tenue`); fila 4, con 8 px extra arriba, "Procesar caso" (Label 14/600, `--acento`) y el chevron de 16 px a la derecha del texto.
- Disposición en angosto (fila, gap 16 px, padding 8 px 16 px, alineación al centro): píldora a la izquierda; al centro, el cliente (Outfit 16/600) y debajo "{país} · {slug}" (Label 14, `--texto-tenue`, el slug en mono); a la derecha, el chevron de 20 px en `--acento`. "Procesar caso" no se pinta como texto en angosto, pero sigue en el nombre accesible.
- Nombre accesible: `aria-label` = "Procesar caso {cliente}, {país} ({slug})"; con prefijo desconocido, "Procesar caso {slug}". Contiene el texto visible ("Procesar caso", el cliente, el país y el slug), como pide WCAG 2.5.3. La píldora y el chevron llevan `aria-hidden="true"`.
- Clic: envía directo, sin pasar por el compositor, el pedido de la demo aplicado al caso (D-112), por el mismo camino que los chips (texto visible como mensaje de la usuaria, sin `accion`). El texto sale de una plantilla única en `strings.ts`, `TEXTO_ACCIONES.mensajeDemoDe(caso)`, y `TEXTO_ACCIONES.mensajeDemo` pasa a ser `mensajeDemoDe(CASO_DEMO_PRD)`, para no duplicar el texto. No es una acción externa: RN4 y CA3 no cambian.
- Deshabilitada (atributo `disabled`) exactamente cuando lo están los chips (`envioDeshabilitado`): durante un turno, con el envío en pausa (`sin_clave` o `tope_diario`) y mientras se hidrata la conversación. La explicación la dan el compositor y el banner, como hoy.
- Texto largo: `overflow-wrap: anywhere` en cliente y slug; la tarjeta crece en alto y nunca desborda su columna.

### AccionesRapidas

- Solo cambian la forma (píldora), los estados de la tabla de estados interactivos y la etiqueta del chip de la demo: "Demo del PRD: {caso}" en la versión completa y "Demo del PRD" en la franja compacta en angosto, con `aria-label` igual a la etiqueta completa. El mensaje que mandan no cambia.
- En el estado vacío los chips van alineados al inicio; en la franja compacta, igual que hoy.

### Encabezado

- Sin cambios de conducta (fecha del servidor, estado del modelo con punto y texto, "Nueva sesión" deshabilitado durante un turno).
- Chips de fecha y modelo: fondo `--marca-elevada`, texto `--sobre-marca`, Label 14/400, radio 4 px, sin borde, 40 px de alto (con el padding compacto de la Fase 3 en angosto).
- El `<h1>` lleva `font-family: var(--titulo-fuente)`.

### PantallaAcceso y PantallaCarga

- Sin cambios de conducta (D-72): el campo `password`, "Mostrar código" y "Ocultar código", "Verificando…", el error con `aria-invalid` y `aria-describedby`, y el código que nunca se guarda.
- Cambios visuales: los del Layout. El campo del código pasa a 8 px de radio con borde `--borde-control`; "Mostrar código" es un botón secundario píldora; "Entrar al agente" es primario píldora a ancho completo.

### Lo demás

Los componentes de la tabla "Componentes propios" marcados con "Ninguno" o con cambios de forma no cambian de conducta: aplica tal cual el contrato de interacción de 03-UI-SPEC.md (FE-06).

---

## Copywriting Contract

Todo en español y en `web/src/config/strings.ts` (o en `src/config/strings.ts` para la CLI). **Ningún texto visible de la web ni de la CLI usa el símbolo de sección** (D-118); un guardián lo vigila en ambos `strings.ts`. El copy de 03-UI-SPEC.md que no aparece aquí queda igual.

| Element | Copy |
|---------|------|
| Primary CTA | "Enviar mensaje" (botón del compositor, sin cambios) |
| CTA de la tarjeta de caso | "Procesar caso" (visible en ancho y medio) · nombre accesible "Procesar caso {cliente}, {país} ({slug})"; prefijo desconocido: "Procesar caso {slug}" |
| Mensaje que manda la tarjeta | `Procesa el caso "{slug}". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.` (plantilla `mensajeDemoDe`, la misma de `mensajeDemo`) |
| Empty state heading | "¿Qué caso procesamos?" (sin cambios) |
| Empty state body | "Elige un caso para procesarlo o escribe una instrucción, por ejemplo \"procesa el caso {CASO_DEMO_PRD}\". El agente lee la solicitud, mapea cada campo contra el maestro, genera el formulario y arma el paquete para firma. No registra ningún envío sin tu confirmación." (el ejemplo se deriva de `CASO_DEMO_PRD`; hoy muestra "ec-corp-andina") |
| Rótulo de las tarjetas | "Casos disponibles" |
| Rótulo de los chips | "Acciones rápidas" (el mismo texto de `TEXTO_ACCIONES.grupo`, ahora también visible) |
| Casos no disponibles (config que falla) | "No se pudieron cargar los casos. Se vuelve a intentar en unos segundos; mientras tanto puedes escribir la instrucción." |
| Nombres de país | co "Colombia" · ec "Ecuador" · pe "Perú" · pa "Panamá" · hn "Honduras" |
| Línea de país y slug (angosto) | "{país} · {slug}" (separador `TEXTO_APP.separador`) |
| Chip de la demo | "Demo del PRD: {CASO_DEMO_PRD}" · etiqueta corta "Demo del PRD" (reemplaza la etiqueta anterior con el símbolo de sección) |
| CLI, turno correcto (`src/config/strings.ts`, `turnoOk`) | "Turno {n} del guion de la sección 11 del PRD OK." |
| Título del documento | "Registro como proveedor · Periferia IT Group" (`TEXTO_APP.tituloDocumento`, sin cambios de texto; ahora también en el `<title>` de `index.html`) |
| Texto alternativo del logo | "Periferia IT Group" (`TEXTO_APP.subtitulo`) |
| Pantalla de carga | "Cargando el agente…" (sin cambios) |
| Nombre de la app en acceso y carga | "Registro como proveedor" (`TEXTO_APP.titulo`) |
| Error state | Sin cambios respecto de la Fase 3. Por ejemplo, stream cortado: "Se perdió la conexión con el servidor durante la respuesta. Recarga la conversación para ver lo que alcanzó a hacer, o vuelve a enviar el mensaje." · botón "Recargar conversación"; sin red: "No hay conexión con el servidor. Revisa tu red y vuelve a intentarlo." |
| Destructive confirmation | Nueva sesión (sin cambios): título "¿Empezar una sesión nueva?" · cuerpo "La conversación actual sale de esta pantalla y las confirmaciones pendientes se descartan. Los archivos generados siguen en el servidor mientras no se reinicie." · botones "Empezar sesión nueva" (destructivo) y "Seguir en esta sesión" |

Esta fase no agrega acciones destructivas. Hacer clic en una tarjeta de caso no es destructivo ni externo: manda un mensaje al chat, igual que un chip.

---

## Accesibilidad (agregados al contrato de la Fase 3)

- Todo par texto/fondo nuevo de este contrato tiene su contraste medido en la sección Color y cumple AA (≥ 4.5:1 en texto; ≥ 3:1 en bordes de campos, foco y puntos de estado). El acento sobre blanco cumple AAA (7.71:1).
- El neón nunca se usa como texto ni como control sobre una superficie clara.
- Los estados se distinguen por ícono y texto además del color. Éxito y acento se separan por tono, fondo (tintado frente a lleno) y forma (4 px frente a píldora).
- El foco es visible sobre claro (acento) y sobre teal (neón).
- `TarjetaCaso`: `<button>` nativo con nombre accesible que contiene el texto visible (WCAG 2.5.3), decoración con `aria-hidden` y `disabled` nativo.
- El logo lleva `alt` con el nombre de la empresa; el `<h1>` sigue siendo el nombre de la app.
- `font-display: swap` con respaldo del sistema: el texto nunca queda invisible mientras cargan las fuentes.
- `prefers-reduced-motion` apaga las transiciones y el giro.
- `<html lang="es">` sin cambios; el `<title>` deja de estar vacío.

---

## Verificación visual para eli-qa (D-116, D-117)

Con Playwright MCP, en local y en el link público, y comparando antes y después:

1. Capturas a 1280 × 720 (ancho), 800 × 900 (medio) y 375 × 667 (angosto) de: pantalla de acceso, estado vacío con las 4 tarjetas, turno de la demo con la confirmación abierta, panel de casos y diálogo de vista previa.
2. `document.title` es "Registro como proveedor · Periferia IT Group" y el favicon carga desde `/marca/favicon.jpg`.
3. `document.fonts.check('600 20px Outfit')` y `document.fonts.check('400 16px Montserrat')` dan `true` después de cargar.
4. En la pestaña de red no hay ninguna petición a `periferiaitgroup.com`, `fonts.googleapis.com` ni `fonts.gstatic.com`; `/fuentes/*.woff2` responde `font/woff2`.
5. `document.body.innerText` no contiene el símbolo de sección en ninguna pantalla.
6. Clic en la tarjeta `ec-corp-andina` produce exactamente el mismo mensaje que el chip "Demo del PRD: ec-corp-andina" y el mismo turno.
7. Las tarjetas y los chips están deshabilitados durante un turno y con el envío en pausa.
8. Con `prefers-reduced-motion: reduce` emulado no hay transiciones ni giro.
9. Recorrido con Tab: encabezado (foco neón visible) → tarjetas de caso → chips → compositor (foco verde visible).

---

## UI Considerations

Applicable state considerations resolved: 14 covered, 7 backstop, 1 dismissed, 0 unresolved (solo las superficies nuevas o cambiadas de esta fase; las 31 filas de 03-UI-SPEC.md siguen vigentes sin cambios)

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | EstadoVacio (config con `casos` vacío) | ✅ covered | Sin casos, la sección "Casos disponibles" no se pinta y quedan el título, el cuerpo y los 3 chips |
| loading | EstadoVacio (config sin cargar) | ➖ dismissed | No aplica: mientras `/api/config` no responde por primera vez el acceso está en verificación y se ve `PantallaCarga`, no el estado vacío |
| error | EstadoVacio (config que falla) | ✅ covered | Un fallo de config reemplaza la grilla por la línea `role="status"` de casos no disponibles mientras corre el reintento de la Fase 3; los chips y el compositor siguen usables (revisión WR-03) |
| populated | Grilla de TarjetaCaso | ✅ covered | Con los 4 casos de los fixtures se ven 4 tarjetas en 2 × 2 en ancho y medio, y 4 filas en angosto, cada una con píldora, país, cliente humanizado y slug, en el orden de `/api/config` |
| zero-one-many | Grilla de TarjetaCaso | ✅ covered | 0 casos ocultan la sección; 1 caso ocupa una columna sin estirarse; con número impar la última fila queda con una tarjeta alineada al inicio; más de 4 casos siguen el mismo flujo de grilla |
| partial | TarjetaCaso (prefijo desconocido o slug sin guion) | ✅ covered | La tarjeta muestra solo el slug como título y "Procesar caso", sin píldora ni país, con nombre accesible "Procesar caso {slug}" |
| long-text | TarjetaCaso (cliente o slug largos) | 🧪 backstop | `overflow-wrap: anywhere` en cliente y slug: la tarjeta crece en alto y nunca desborda su columna. Verificar con un slug de 60 caracteres a 375 × 667 y a 1280 × 720 |
| loading | TarjetaCaso durante un turno o hidratación | ✅ covered | La tarjeta queda `disabled` con el estilo deshabilitado en las mismas condiciones que los chips (`envioDeshabilitado`) |
| error | TarjetaCaso con el envío en pausa | ✅ covered | Con `sin_clave` o `tope_diario` la tarjeta queda deshabilitada y el banner y la ayuda del compositor explican la pausa, como en los chips |
| overflow | Encabezado en angosto con logo | 🧪 backstop | Línea 1 con logo de 24 px, divisor y título Outfit 16 en 343 px útiles; la línea 2 sigue en una fila con elipsis. Verificar a 375 × 667 y a 320 × 568 que el título no se parte en dos líneas ni tapa el logo |
| overflow | Chips en píldora con Montserrat | 🧪 backstop | Montserrat es más ancha que la fuente del sistema: en la franja compacta a 375 px los chips pueden ocupar dos filas (máximo permitido en la Fase 3) y nunca hacen scroll horizontal. Verificar a 375 × 667 con historial |
| error | Fuentes que no cargan | ✅ covered | Con `font-display: swap` y la pila del sistema en `--fuente-base` y `--fuente-titulos`, un `.woff2` ausente deja el texto legible con la fuente del sistema; las fuentes se sirven sin código de acceso |
| error | Logo que no carga | ✅ covered | El `<img>` conserva su caja (248 × 62 escalada) y muestra el `alt` "Periferia IT Group" en `--sobre-marca` sobre el teal |
| populated | Encabezado teal | ✅ covered | Logo, divisor neón, título Outfit, chips de fecha y modelo sobre `--marca-elevada` y "Nueva sesión" en píldora con borde neón; punto del modelo con los colores de encabezado y su etiqueta |
| populated | PantallaAcceso con marca | ✅ covered | Fondo teal, logo de 40 px, nombre de la app y tarjeta blanca con el campo enfocado al cargar; foco neón fuera de la tarjeta y verde dentro |
| loading | PantallaCarga | ✅ covered | "Cargando el agente…" en blanco sobre teal con el logo y `role="status"`, sin destello claro antes del acceso |
| empty | `<title>` y favicon | ✅ covered | El `<title>` deja de estar vacío ("Registro como proveedor · Periferia IT Group") y el favicon deja de ser `data:,` |
| error | PantallaAcceso con marca (código errado o vencido) | 🧪 backstop | Los estados de error, envío y campo vacío de la Fase 3 no cambian; solo cambia la piel. El mensaje de error vive dentro de la tarjeta blanca con `--error-texto` (5.75:1). Verificar con un código errado que el mensaje se ve, se anuncia y el foco vuelve al campo |
| loading | PantallaAcceso con marca (verificando el código) | 🧪 backstop | El botón "Entrar al agente" en píldora conserva el estado ocupado de la Fase 3 sobre la tarjeta blanca. Verificar que no hay doble envío y que el texto ocupado se lee |
| empty | Encabezado sin salud ni fecha todavía | 🧪 backstop | Con `salud` o `fechaEjecucion` en `null`, la Fase 3 oculta el chip correspondiente; sobre el teal no queda un hueco ni un punto huérfano. Verificar durante la primera carga en frío del link público |
| long-text | Encabezado (nombre del modelo largo) | 🧪 backstop | El prefijo del modelo se oculta en angosto (Fase 3) y el resto va con elipsis en la línea 2; verificar con el nombre real de `/api/health` a 320 × 568 |
| empty | TarjetaCaso sin slug | ➖ dismissed | No aplica: `/api/config` valida `casos` como slugs no vacíos con el patrón de caso, así que una tarjeta nunca recibe un slug vacío |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none: no se usa shadcn ni ningún registro de componentes (Tool: none; sistema de diseño propio en `tokens.css`) | not applicable |

Dependencias de runtime del front, sin cambios: `react`, `react-dom` y `eventsource-parser`. Las únicas devDeps nuevas de la fase son las de prueba (`@testing-library/react`, `@testing-library/user-event` si hace falta y `happy-dom`, D-115), con versión exacta y justificadas en `SOLUCION.md`. Las fuentes y la marca son archivos estáticos vendorizados, no paquetes.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS
- [ ] Dimension 7 Inventory Provenance: PASS

**Approval:** pending
